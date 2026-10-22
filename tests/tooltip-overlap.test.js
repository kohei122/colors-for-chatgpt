const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const html=`<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box}html,body{margin:0}#root,.shell{height:100dvh}.shell{display:flex;flex-direction:column}header{height:52px;flex:none;display:flex;justify-content:flex-end;padding:8px 114px;isolation:isolate;contain:layout paint;overflow:hidden}button{height:36px;min-width:78px}main{flex:1;overflow:auto}.composer{height:70px;flex:none;display:flex}textarea{flex:1}aside{position:fixed;top:0;bottom:0;width:80px;background:#eee}#portal{display:contents}[role=tooltip]{position:absolute;top:0;left:0;width:123px;height:30px;background:rgb(0,180,0);color:white;z-index:50;pointer-events:none}</style><div id=root><div class="shell h-dvh"><header><button id=share aria-label=共有>共有</button><button id=other aria-label=検索>検索</button></header><main><nav><a href=/c/a>Fixture</a></nav><div style="height:5000px">Messages</div></main><div class=composer><textarea id=prompt-textarea></textarea><button id=send>送信</button></div></div></div><aside></aside><div id=portal></div>`;
async function setup(t,width=1498,height=900){
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true});t.after(()=>b.close());const p=await b.newPage({viewport:{width,height}});
 await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:html}));await p.goto('https://chatgpt.com/c/a');
 await p.evaluate(()=>{
  window.listeners=[];window.chrome={storage:{local:{get:async key=>({[key]:key.includes(':display:')?true:key.endsWith('enabled')?true:{height:88,fontSize:24,border:4}}),set:async()=>{}},onChanged:{addListener:f=>listeners.push(f)}}};
  window.setEnabled=value=>listeners.forEach(f=>f({'thread-colors:v1:enabled':{newValue:value}},'local'));
  window.makeTip=(id='share',side='top')=>{
   document.querySelector('[role=tooltip]')?.remove();document.querySelectorAll('[aria-describedby]').forEach(e=>e.removeAttribute('aria-describedby'));
   const button=document.getElementById(id),tip=document.createElement('div');tip.id='dynamic-tip';tip.role='tooltip';tip.dataset.side=side;tip.textContent='説明';document.getElementById('portal').append(tip);button.setAttribute('aria-describedby',tip.id);
   const r=button.getBoundingClientRect(),body=document.body.getBoundingClientRect();const y=side==='top'?r.top-33.5:r.bottom+6;
   tip.style.transform=`translate(${Math.max(0,Math.min(innerWidth-123,r.x+(r.width-123)/2))}px,${y-body.top}px)`;
   return tip.getBoundingClientRect().toJSON();
  };
 });
 await p.addScriptTag({path:path.join(root,'core.js')});await p.addScriptTag({path:path.join(root,'content.js')});await p.locator('#marusin-thread-colors .bar').waitFor();return p;
}
test('recorded absolute tooltip structure isolates clipping, stacking and layout variants at equal widths',async t=>{
 const rows=[];
 for(const width of [1498,1388]){
  const p=await setup(t,width);
  for(const variant of ['current','no-root-minimum','no-transform','visible-overflow','static-body','current-no-band','visible-overflow-no-band']){
   await p.evaluate(variant=>{
    document.getElementById('marusin-thread-colors').shadowRoot.querySelector('.bar').style.visibility=variant.endsWith('no-band')?'hidden':'';
    document.getElementById('experiment')?.remove();const s=document.createElement('style');s.id='experiment';s.textContent=({'current-no-band':'','visible-overflow-no-band':'html[data-thread-colors-active] body{overflow:visible!important}',current:'','no-root-minimum':'html[data-thread-colors-active]{min-height:0!important}','no-transform':'html[data-thread-colors-active] body{transform:none!important}','visible-overflow':'html[data-thread-colors-active] body{overflow:visible!important}','static-body':'html[data-thread-colors-active] body{position:static!important;transform:none!important;padding-top:88px!important}'}[variant]);document.head.append(s);makeTip();
   },variant);
   const info=await p.evaluate(()=>{const tip=document.querySelector('[role=tooltip]'),r=tip.getBoundingClientRect(),body=document.body.getBoundingClientRect();return {tooltipTop:r.top,bodyTop:body.top,bodyOverflow:getComputedStyle(document.body).overflow,sidebarTop:document.querySelector('aside').getBoundingClientRect().top,composerBottom:document.querySelector('.composer').getBoundingClientRect().bottom,rootHeight:document.documentElement.getBoundingClientRect().height,bodyTransform:getComputedStyle(document.body).transform,overlapsBand:r.top<88,bodyZ:getComputedStyle(document.body).zIndex,hostZ:getComputedStyle(document.getElementById('marusin-thread-colors')).zIndex};});
   rows.push({width,variant,...info});
   if(variant==='current'||variant==='no-root-minimum'){assert.equal(info.tooltipTop,62.5);assert.equal(info.bodyTop,88);assert.equal(info.bodyOverflow,'auto');assert.equal(info.sidebarTop,88);}
   if(variant==='no-transform')assert.equal(info.sidebarTop,0);
   if(variant==='visible-overflow')assert.equal(info.overlapsBand,true);
   if(variant==='static-body')assert.equal(info.sidebarTop,0);
   if(width===1498)await p.screenshot({path:path.join(root,`tests/tooltip-variant-${variant}.png`)});
  }
  await p.evaluate(()=>{document.getElementById('experiment').remove();document.getElementById('marusin-thread-colors').shadowRoot.querySelector('.bar').style.visibility='';setEnabled(false);makeTip('share','bottom');});
  const off=await p.locator('[role=tooltip]').boundingBox();assert.equal(off.y,50);
  await p.close();
 }
 fs.writeFileSync(path.join(root,'tests/tooltip-overlap-results.json'),JSON.stringify(rows,null,2));
});
for(const viewport of [{width:1498,height:900},{width:390,height:700},{width:749,height:450}])test('linked overlapping tooltip remains readable without changing native direction '+viewport.width,async t=>{
 const p=await setup(t,viewport.width,viewport.height);
 for(const height of [40,88]){
  await p.evaluate(h=>listeners.forEach(f=>f({'thread-colors:v1:a':{newValue:{height:h}}},'local')),height);
  await p.locator('#share').hover();await p.evaluate(()=>makeTip());
  await p.waitForFunction(()=>document.querySelector('[role=tooltip]').getBoundingClientRect().top>=document.querySelector('#share').getBoundingClientRect().bottom+5);
  const info=await p.locator('[role=tooltip]').evaluate(e=>({side:e.dataset.side,r:e.getBoundingClientRect().toJSON(),translate:e.style.translate,parent:e.parentElement.id,pe:getComputedStyle(e).pointerEvents}));
  assert.equal(info.side,'top');assert.equal(info.parent,'portal');assert.equal(info.pe,'none');assert.ok(info.r.bottom<=viewport.height);
  await p.screenshot({path:path.join(root,`tests/tooltip-corrected-${viewport.width}-${height}.png`)});
  const rect=await p.locator('#send').boundingBox();assert.ok(rect.y+rect.height<=viewport.height+.1);
  await p.locator('#send').click();await p.waitForTimeout(30);assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.style.translate),'');
  // Keyboard focus uses the same ARIA relationship, without any key interception.
  await p.locator('#other').focus();await p.keyboard.press('Shift+Tab');assert.equal(await p.locator('#share').evaluate(e=>e===document.activeElement),true);await p.evaluate(()=>makeTip());
  await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');
  // A native update replaces transform; the correction follows without accumulating.
  await p.locator('[role=tooltip]').evaluate(e=>e.style.transform=e.style.transform.replace(/,.*px\)/,', -20px)'));
  await p.waitForTimeout(50);const after=await p.locator('[role=tooltip]').boundingBox();const button=await p.locator('#share').boundingBox();assert.ok(Math.abs(after.y-(button.y+button.height+6))<.2);
  await p.evaluate(()=>setEnabled(false));await p.waitForTimeout(30);assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.style.translate),'');
  assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).transform),'none');
  await p.evaluate(()=>setEnabled(true));
 }
});
test('bottom, unlinked, ambiguous, nested and modal tooltips are not repositioned',async t=>{
 const p=await setup(t);await p.locator('#share').hover();
 for(const mode of ['bottom','unlinked','ambiguous','nested','native-translate','modal']){
  await p.evaluate(mode=>{
   const portal=document.getElementById('portal');document.body.append(portal);document.querySelector('#foreign')?.remove();document.getElementById('share').setAttribute('aria-describedby','dynamic-tip');
   makeTip('share',mode==='bottom'?'bottom':'top');const tip=document.querySelector('[role=tooltip]');
   if(mode==='clear-top')tip.style.transform='translate(200px, 10px)';
   if(mode==='unlinked')document.getElementById('share').removeAttribute('aria-describedby');
   if(mode==='ambiguous'){const other=tip.cloneNode(true);other.id='foreign';portal.append(other);document.getElementById('share').setAttribute('aria-describedby','dynamic-tip foreign');}
   if(mode==='nested'){const box=document.createElement('section');box.id='foreign';document.body.append(box);box.append(portal);}
   if(mode==='native-translate')tip.style.translate='2px 2px';
   if(mode==='modal'){const d=document.createElement('div');d.id='foreign';d.role='dialog';d.setAttribute('aria-modal','true');d.style.cssText='position:fixed;inset:0;background:white';document.body.append(d);}
  },mode);
  await p.waitForTimeout(80);assert.equal(await p.locator('#dynamic-tip').evaluate(e=>e.style.translate),mode==='native-translate'?'2px 2px':'');
 }
});
test('tooltip correction does not loop on its style and releases after removal or navigation',async t=>{
 const p=await setup(t);await p.locator('#share').hover();await p.evaluate(()=>{window.tipStyleChanges=0;makeTip();window.probe=new MutationObserver(r=>window.tipStyleChanges+=r.length);probe.observe(document.querySelector('[role=tooltip]'),{attributes:true,attributeFilter:['style']});});
 await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');
 await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>tipStyleChanges),1);
 await p.evaluate(()=>{const d=document.createElement('div');d.id='manual-dialog';d.role='dialog';d.setAttribute('aria-modal','true');d.style.cssText='position:fixed;inset:0;background:white';document.body.append(d);});
 await p.waitForFunction(()=>document.getElementById('marusin-thread-colors').style.display==='none');
 assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.style.translate),'');assert.equal(await p.locator('#manual-dialog').isVisible(),true);
 await p.locator('#manual-dialog').evaluate(e=>e.remove());await p.locator('#marusin-thread-colors .bar').waitFor();await p.evaluate(()=>makeTip());
 await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');

 await p.evaluate(()=>{window.oldTip=document.querySelector('[role=tooltip]');oldTip.remove();});await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>oldTip.style.translate),'');
 await p.evaluate(()=>makeTip());await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');
 await p.evaluate(()=>{history.pushState({},'', '/');document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(80);assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.style.translate),'');
});


test('confirmed upper controls move below even without band overlap; bottom placement stays untouched',async t=>{
 const p=await setup(t);
 for(const label of ['共有','その他','概要の固定表示の切り替え','フォルダ','検索','サイドバーを切り替える']) {
  await p.locator('#share').evaluate((e,label)=>e.setAttribute('aria-label',label),label);await p.locator('#share').hover();
  await p.evaluate(()=>{makeTip();document.querySelector('[role=tooltip]').style.transform='translate(200px, 10px)';});
  await p.waitForFunction(()=>document.querySelector('[role=tooltip]').getBoundingClientRect().top>=document.getElementById('share').getBoundingClientRect().bottom);
  const tip=await p.locator('[role=tooltip]').boundingBox();assert.equal(tip.y,138);
  await p.evaluate(()=>makeTip('share','bottom'));const before=await p.locator('[role=tooltip]').getAttribute('style');await p.waitForTimeout(50);
  assert.equal(await p.locator('[role=tooltip]').getAttribute('style'),before);
 }
});
test('edge translation and wrapping preserve full text and restore all owned styles',async t=>{
 const p=await setup(t,390,700);await p.locator('#share').hover();
 for(const x of [-80,380]) {
  await p.evaluate(x=>{makeTip();document.querySelector('[role=tooltip]').style.transform=`translate(${x}px,-25.5px)`;},x);
  await p.waitForFunction(()=>{const r=document.querySelector('[role=tooltip]').getBoundingClientRect();return r.left>=3.9&&r.right<=386.1&&r.top>=138;});
 }
 await p.evaluate(()=>{makeTip();const e=document.querySelector('[role=tooltip]');e.textContent='日本語English長い説明🙂'.repeat(12);e.style.cssText='transform:translate(-200px,-25.5px);width:900px;height:30px;white-space:nowrap;max-height:30px';window.nativeTipStyles=e.getAttribute('style');window.nativeTipText=e.textContent;window.styleWrites=0;new MutationObserver(r=>styleWrites+=r.length).observe(e,{attributes:true,attributeFilter:['style']});});
 await p.waitForFunction(()=>{const r=document.querySelector('[role=tooltip]').getBoundingClientRect();return r.left>=3.9&&r.right<=386.1&&r.top>=138;});
 assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.textContent===nativeTipText&&e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1),true);
 await p.evaluate(()=>listeners.forEach(f=>f({'thread-colors:v1:a':{newValue:{height:88,border:12}}},'local')));
 await p.waitForFunction(()=>{const r=document.querySelector('[role=tooltip]').getBoundingClientRect();return r.left>=12&&r.right<=378;});
 await p.screenshot({path:path.join(root,'tests/tooltip-024-wrapped.png')});
 const count=await p.evaluate(()=>styleWrites);await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>styleWrites),count);
 await p.evaluate(()=>setEnabled(false));
 const styles=await p.locator('[role=tooltip]').evaluate(e=>[e.style.translate,e.style.maxWidth,e.style.height,e.style.whiteSpace,e.style.maxHeight]);assert.deepEqual(styles,['','','30px','nowrap','30px']);
});
test('article controls and menu controls never get tooltip correction',async t=>{
 const p=await setup(t);
 await p.locator('#share').hover();await p.evaluate(()=>makeTip());await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');
 await p.locator('header').evaluate(e=>e.setAttribute('role','menu'));await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate==='');await p.locator('header').evaluate(e=>e.removeAttribute('role'));

 for(const tag of ['article','menu']) {
  await p.evaluate(tag=>{const button=document.getElementById('share');let wrapper=document.getElementById('excluded');if(wrapper){wrapper.before(button);wrapper.remove();}wrapper=document.createElement('div');wrapper.id='excluded';if(tag==='article')wrapper.setAttribute('data-message-author-role','assistant');else wrapper.role='menu';button.before(wrapper);wrapper.append(button);},tag);
  await p.locator('#share').hover();await p.evaluate(()=>makeTip());await p.waitForTimeout(60);assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.style.translate),'');
 }
});

test('too-tall wrapping fails safely without an own-style correction loop',async t=>{
 const p=await setup(t,390,450);await p.locator('#share').hover();await p.evaluate(()=>{makeTip();const tip=document.querySelector('[role=tooltip]');tip.style.cssText='width:900px;white-space:nowrap;transform:translate(0px,-25.5px)';tip.textContent='VeryLong説明'.repeat(500);window.writes=0;new MutationObserver(r=>writes+=r.length).observe(tip,{attributes:true,attributeFilter:['style']});});
 await p.waitForTimeout(300);const count=await p.evaluate(()=>writes);assert.ok(count>0&&count<30,count);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>writes),count);assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.style.maxWidth),'');
});

for(const mode of ['hover','focus'])test('Work immediate span description uses actual button rect with a zero-size wrapper: '+mode,async t=>{
 const p=await setup(t,749,450);
 await p.evaluate(()=>{const b=document.getElementById('share'),w=document.createElement('span');w.id='work-wrapper';w.style.display='contents';b.before(w);w.append(b);});
 if(mode==='hover')await p.locator('#share').hover();else await p.locator('#share').focus();
 await p.evaluate(()=>{makeTip();const b=document.getElementById('share'),w=b.parentElement;w.setAttribute('aria-describedby',b.getAttribute('aria-describedby'));b.removeAttribute('aria-describedby');});
 await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');
 const r=await p.evaluate(()=>({tip:document.querySelector('[role=tooltip]').getBoundingClientRect().toJSON(),button:document.getElementById('share').getBoundingClientRect().toJSON(),wrapper:document.getElementById('work-wrapper').getBoundingClientRect().toJSON()}));
 assert.equal(r.wrapper.width,0);assert.equal(r.wrapper.height,0);assert.equal(r.tip.y,r.button.bottom+6);assert.ok(r.tip.bottom<=450);
 // Wrapper reference updates are observed; removing the correspondence restores styles.
 await p.locator('#work-wrapper').evaluate(e=>e.removeAttribute('aria-describedby'));
 await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate==='');
 await p.locator('#work-wrapper').evaluate(e=>e.setAttribute('aria-describedby','dynamic-tip'));
 await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');
 await p.evaluate(()=>listeners.forEach(f=>f({'thread-colors:v1:display:a':{newValue:false}},'local')));
 assert.equal(await p.locator('[role=tooltip]').evaluate(e=>e.style.translate),'');
 assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).transform),'none');
});

test('Work wrapper ambiguity, remote ancestor and non-button trigger are rejected',async t=>{
 const p=await setup(t);
 for(const mode of ['second-button','outer-span','conflicting','duplicate','duplicate-id','interactive-wrapper','non-button']){
  await p.evaluate(mode=>{
   document.querySelector('#work-wrapper')?.remove();document.querySelector('#outer')?.remove();document.querySelector('#share')?.remove();document.querySelector('#extra-tip')?.remove();
   const b=document.createElement(mode==='non-button'?'span':'button');b.id='share';b.textContent='fixture';if(mode==='non-button')b.tabIndex=0;document.querySelector('header').prepend(b);
   const w=document.createElement('span');w.id='work-wrapper';w.style.display='contents';b.before(w);w.append(b);makeTip();w.setAttribute('aria-describedby','dynamic-tip');b.removeAttribute('aria-describedby');
   if(mode==='second-button'){const other=document.createElement('button');w.append(other);}
   if(mode==='outer-span'){const outer=document.createElement('span');outer.id='outer';w.before(outer);outer.append(w);outer.setAttribute('aria-describedby','dynamic-tip');w.removeAttribute('aria-describedby');}
   if(mode==='conflicting'){const t=document.createElement('div');t.role='tooltip';t.id='extra-tip';document.getElementById('portal').append(t);b.setAttribute('aria-describedby','extra-tip');}
   if(mode==='duplicate-id')document.getElementById('portal').append(document.getElementById('dynamic-tip').cloneNode(true));
   if(mode==='duplicate')b.setAttribute('aria-describedby','dynamic-tip');
   if(mode==='interactive-wrapper')w.role='button';
  },mode);
  await p.locator('#share').focus();await p.waitForTimeout(60);
  assert.equal(await p.locator('#dynamic-tip').first().evaluate(e=>e.style.translate),'',mode);
 }
});

test('Work wrapper stops correcting immediately when another control is added',async t=>{
 const p=await setup(t);await p.evaluate(()=>{const b=document.getElementById('share'),w=document.createElement('span');w.id='work-wrapper';w.style.display='contents';b.before(w);w.append(b);});
 await p.locator('#share').hover();await p.evaluate(()=>{makeTip();const b=document.getElementById('share');b.parentElement.setAttribute('aria-describedby','dynamic-tip');b.removeAttribute('aria-describedby');});
 await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate!=='');
 await p.locator('#work-wrapper').evaluate(e=>{const b=document.createElement('button');e.append(b);});
 await p.waitForFunction(()=>document.querySelector('[role=tooltip]').style.translate==='');
});

async function folderSource(p){
 await p.evaluate(()=>{
  document.getElementById('share').outerHTML='<span id="share" role="img" style="display:inline-block;width:36px;height:36px"><svg width="20" height="20" style="margin:8px"><rect width="20" height="20"/></svg></span>';
  document.querySelector('header').style.cssText='justify-content:flex-start;padding-left:356px';
  window.folderClicks=0;document.getElementById('share').addEventListener('click',()=>folderClicks++);
 });
 await p.locator('#share svg').hover();
}
test('Work folder semantic image uses direct ARIA and span rect, without making it clickable',async t=>{
 const p=await setup(t);await folderSource(p);
 const before=await p.evaluate(()=>makeTip());assert.equal(before.y,62.5);
 await p.waitForFunction(()=>document.getElementById('dynamic-tip').style.translate!=='');
 const result=await p.evaluate(()=>{const s=document.getElementById('share');return {rect:s.getBoundingClientRect().toJSON(),tip:document.getElementById('dynamic-tip').getBoundingClientRect().toJSON(),role:s.role,tabindex:s.getAttribute('tabindex'),clicks:folderClicks};});
 assert.equal(result.rect.x,356);assert.equal(result.rect.y,96);assert.equal(result.tip.y,138);assert.equal(result.role,'img');assert.equal(result.tabindex,null);assert.equal(result.clicks,0);
 await p.evaluate(()=>{window.writes=0;new MutationObserver(r=>writes+=r.length).observe(document.getElementById('dynamic-tip'),{attributes:true,attributeFilter:['style']});});
 await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>writes),0);
 await p.mouse.move(10,300);await p.waitForFunction(()=>document.getElementById('dynamic-tip').style.translate==='');
 for(const mode of ['global','individual','removed']){
  await p.locator('#share svg').hover();await p.evaluate(()=>makeTip());await p.waitForFunction(()=>document.getElementById('dynamic-tip').style.translate!=='');
  await p.evaluate(mode=>{window.oldTip=document.getElementById('dynamic-tip');if(mode==='global')setEnabled(false);if(mode==='individual')listeners.forEach(f=>f({'thread-colors:v1:display:a':{newValue:false}},'local'));if(mode==='removed')oldTip.remove();},mode);
  await p.waitForFunction(()=>oldTip.style.translate==='');
  await p.evaluate(()=>{setEnabled(true);listeners.forEach(f=>f({'thread-colors:v1:display:a':{newValue:true}},'local'));});
 }
});
test('Work folder refuses ambiguous references, hidden sources and unsupported element types',async t=>{
 const p=await setup(t);
 for(const mode of ['duplicate-id','competing-owner','multiple-tips','duplicate-reference','ancestor-reference','button-ancestor','hidden','inert','opacity','plain-span','div-image','wrapper-only','article','menu']){
  await p.evaluate(()=>{document.querySelector('#wrapper')?.remove();document.querySelector('#share')?.remove();document.querySelector('#extra-owner')?.remove();document.querySelector('header').insertAdjacentHTML('afterbegin','<button id="share">fixture</button>');});
  await folderSource(p);
  await p.evaluate(mode=>{
   makeTip();const s=document.getElementById('share'),tip=document.getElementById('dynamic-tip');
   if(mode==='duplicate-id')tip.after(tip.cloneNode(true));
   if(mode==='competing-owner'){const e=document.createElement('span');e.id='extra-owner';e.setAttribute('aria-describedby',tip.id);document.querySelector('header').append(e);}
   if(mode==='multiple-tips'){const e=tip.cloneNode(true);e.id='extra-tip';tip.after(e);s.setAttribute('aria-describedby','dynamic-tip extra-tip');}
   if(mode==='duplicate-reference')s.setAttribute('aria-describedby','dynamic-tip dynamic-tip');
   if(['ancestor-reference','button-ancestor','wrapper-only','article','menu'].includes(mode)){const w=document.createElement(mode==='button-ancestor'?'button':'span');w.id='wrapper';s.before(w);w.append(s);if(['ancestor-reference','wrapper-only'].includes(mode))w.setAttribute('aria-describedby',tip.id);if(mode==='wrapper-only')s.removeAttribute('aria-describedby');if(mode==='article')w.setAttribute('data-message-author-role','assistant');if(mode==='menu')w.role='menu';}
   if(mode==='hidden')s.hidden=true;if(mode==='inert')s.inert=true;if(mode==='opacity')s.style.opacity='0';
   if(mode==='plain-span')s.removeAttribute('role');if(mode==='div-image'){const e=document.createElement('div');for(const a of s.attributes)e.setAttribute(a.name,a.value);e.innerHTML=s.innerHTML;s.replaceWith(e);}
  },mode);
  await p.waitForTimeout(65);assert.equal(await p.locator('#dynamic-tip').first().evaluate(e=>e.style.translate),'',mode);
  await p.evaluate(()=>document.querySelectorAll('[role=tooltip]').forEach(e=>e.remove()));
 }
});

test('032 hide button restores tooltip correction and page layout',async t=>{
 const p=await setup(t);await p.locator('#share').hover();await p.evaluate(()=>makeTip());await p.waitForFunction(()=>document.getElementById('dynamic-tip').style.translate!=='');
 await p.evaluate(()=>{chrome.storage.local.set=async values=>{const changes=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{newValue:v}]));listeners.forEach(f=>f(changes,'local'));};});
 // Programmatic activation while the tooltip remains present isolates OFF cleanup.
 await p.locator('.hide-chat').evaluate(e=>e.click());await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-thread-colors-active'));
 assert.equal(await p.locator('#dynamic-tip').evaluate(e=>e.style.translate),'');assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).transform),'none');
});
