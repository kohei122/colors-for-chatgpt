const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function setup(t,work=false){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true});
 t.after(()=>browser.close());
 const p=await browser.newPage({viewport:work?{width:1819,height:898}:{width:1369,height:862}});
 await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'fixtures/tooltip-fixed.html'),'utf8')}));
 await p.goto('https://chatgpt.com/c/fixture');
 await p.evaluate(()=>{
  window.listeners=[];window.chrome={storage:{local:{get:async key=>({[key]:key.includes(':display:')?true:key.endsWith('enabled')?true:{height:88,border:12}}),set:async()=>{}},onChanged:{addListener:f=>listeners.push(f)}}};
  window.setEnabled=v=>listeners.forEach(f=>f({'thread-colors:v1:enabled':{newValue:v}},'local'));
  window.makeTip=()=>{
   const w=document.createElement('div');w.id='positioner';w.setAttribute('data-radix-popper-content-wrapper','');
   w.innerHTML='<div id="tip" role="tooltip" data-side="top" data-state="instant-open">Fixture tip</div>';
   document.getElementById('layer').append(w);document.getElementById('more').setAttribute('aria-describedby','tip');
  };
 });
 await p.addScriptTag({path:path.join(root,'core.js')});await p.addScriptTag({path:path.join(root,'content.js')});
 await p.locator('#marusin-thread-colors .bar').waitFor();
 await p.locator('#more').hover();
 return p;
}
async function placed(p){await p.waitForFunction(()=>{
 const tip=document.getElementById('tip'),b=document.getElementById('more');
 return tip&&Math.abs(tip.getBoundingClientRect().top-b.getBoundingClientRect().bottom-6)<.1;
});}
for(const work of [false,true])test(`recorded fixed portal ${work?'Work':'normal'}: geometry, native updates, resize and stability`,async t=>{
 const p=await setup(t,work);
 await p.evaluate(work=>{makeTip();if(work){document.getElementById('positioner').style.transform='translate(1611.82px,-25.4545px)';document.getElementById('tip').dataset.state='delayed-open';}
 window.nativeTransform=document.getElementById('positioner').style.transform;
 window.beforeTop=document.getElementById('tip').getBoundingClientRect().top;
 window.writes=0;new MutationObserver(r=>writes+=r.length).observe(document.getElementById('positioner'),{attributes:true,attributeFilter:['style']});
 },work);
 await placed(p);
 const geometry=await p.evaluate(()=>({before:beforeTop,after:document.getElementById('tip').getBoundingClientRect().top,body:document.body.getBoundingClientRect().top,side:document.getElementById('tip').dataset.side,transform:document.getElementById('positioner').style.transform,native:nativeTransform}));
 assert.ok(Math.abs(geometry.before-62.5455)<.1);assert.ok(Math.abs(geometry.after-138)<.02);assert.equal(geometry.body,88);
 assert.equal(geometry.side,'top');assert.equal(geometry.transform,geometry.native);
 await p.waitForTimeout(250);const stable=await p.evaluate(()=>writes);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>writes),stable);
 for(const y of [-45,20,-10]){
  await p.locator('#positioner').evaluate((e,y)=>e.style.transform=`translate(500px,${y}px)`,y);await placed(p);
  assert.equal(await p.locator('#positioner').evaluate(e=>e.style.transform),`translate(500px, ${y}px)`);
 }
 await p.locator('#tip').evaluate(e=>e.style.height='55px');await placed(p);
 await p.setViewportSize({width:800,height:600});await p.locator('#more').hover();await placed(p);
 await p.evaluate(()=>window.dispatchEvent(new Event('scroll')));await placed(p);
 await p.waitForTimeout(200);const count=await p.evaluate(()=>writes);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>writes),count);
});
for(const exit of ['hover','remove-tip','remove-wrapper','remove-button','navigation','off','individual-off','pagehide','modal'])test('fixed portal restores on '+exit,async t=>{
 const p=await setup(t);await p.evaluate(()=>{makeTip();window.oldW=document.getElementById('positioner');window.oldTip=document.getElementById('tip');});await placed(p);
 if(exit==='hover')await p.mouse.move(400,400);
 else await p.evaluate(exit=>{
  if(exit==='remove-tip')oldTip.remove();if(exit==='remove-wrapper')oldW.remove();if(exit==='remove-button')document.getElementById('more').remove();
  if(exit==='navigation'){history.pushState({},'', '/c/next-fixture');document.dispatchEvent(new Event('visibilitychange'));}
  if(exit==='off')setEnabled(false);
  if(exit==='individual-off')listeners.forEach(f=>f({'thread-colors:v1:display:fixture':{newValue:false}},'local'));
  if(exit==='pagehide')window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
  if(exit==='modal'){const d=document.createElement('div');d.role='dialog';d.setAttribute('aria-modal','true');d.style.cssText='position:fixed;inset:0';document.body.append(d);}
 },exit);
 await p.waitForFunction(()=>oldW.style.translate===''&&oldW.style.animation===''&&oldTip.style.animation==='');
 await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>oldW.style.translate),'');
});
for(const mode of ['duplicate-id','other-owner','sibling','nested','scaled','rotate','native-translate','menu','article','too-tall','interactive'])test('fixed portal refuses '+mode,async t=>{
 const p=await setup(t);
 await p.evaluate(mode=>{makeTip();const tip=document.getElementById('tip'),w=tip.parentElement,b=document.getElementById('more');
  if(mode==='duplicate-id'){const d=document.createElement('div');d.id='tip';document.body.append(d);}
  if(mode==='other-owner')document.getElementById('other').setAttribute('aria-describedby','tip');
  if(mode==='sibling')w.append(document.createElement('div'));
  if(mode==='nested'){const d=document.createElement('div');w.before(d);d.append(w);}
  if(mode==='scaled')document.getElementById('layer').style.transform='scale(.9)';
  if(mode==='rotate')w.style.rotate='2deg';
  if(mode==='native-translate')w.style.translate='1px 2px';
  if(mode==='menu')document.getElementById('layer').role='menu';
  if(mode==='article')document.getElementById('layer').setAttribute('data-message-author-role','assistant');
  if(mode==='too-tall')tip.style.height='900px';
  if(mode==='interactive')tip.innerHTML='<button>action</button>';
  window.expected=w.style.translate;window.writes=0;new MutationObserver(r=>writes+=r.length).observe(w,{attributes:true,attributeFilter:['style']});
 },mode);
 await p.waitForTimeout(200);assert.equal(await p.locator('#positioner').evaluate(e=>e.style.translate),await p.evaluate(()=>expected));
 const writes=await p.evaluate(()=>window.writes);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>window.writes),writes);
});
test('fixed portal neutralizes directional animation and marked arrow, restores and preserves native overwrite',async t=>{
 const p=await setup(t);await p.evaluate(()=>{makeTip();const s=document.createElement('style');s.textContent='@keyframes fromTop{from{transform:translateY(-20px)}to{transform:none}} #tip{animation:fromTop 2s}';document.head.append(s);
 document.getElementById('tip').innerHTML+='<svg data-radix-popper-arrow aria-hidden="true" style="position:absolute;bottom:-5px"><path d="M0 0 L5 5 L10 0"/></svg>';
 });await placed(p);
 assert.equal(await p.locator('#tip').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.equal(await p.locator('[data-radix-popper-arrow]').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 await p.locator('#positioner').evaluate(e=>e.style.setProperty('translate','3px 4px'));
 await p.waitForTimeout(150);assert.equal(await p.locator('#positioner').evaluate(e=>e.style.translate),'3px 4px');
 assert.equal(await p.locator('#tip').evaluate(e=>e.style.animation),'');
 assert.equal(await p.locator('[data-radix-popper-arrow]').evaluate(e=>e.style.visibility),'');
});

test('new sibling invalidates dedicated wrapper; unrelated portal tooltip stays unchanged',async t=>{
 const p=await setup(t);await p.evaluate(()=>{makeTip();const other=document.createElement('div');other.setAttribute('data-radix-popper-content-wrapper','');other.id='foreign-wrapper';other.innerHTML='<div role="tooltip" id="foreign-tip">Unrelated</div>';document.getElementById('layer').append(other);});
 await placed(p);
 assert.equal(await p.locator('#foreign-wrapper').getAttribute('style'),null);
 assert.equal(await p.locator('#foreign-tip').getAttribute('style'),null);
 await p.locator('#positioner').evaluate(e=>e.append(document.createElement('div')));
 await p.waitForFunction(()=>document.getElementById('positioner').style.translate==='');
 assert.equal(await p.locator('#tip').evaluate(e=>e.style.animation),'');
});

for(const mode of ['valid','plain-span','native-img','other-owner','duplicate-id','nested-owner','outside-upper','message-image'])test('Work fixed folder source: '+mode,async t=>{
 const p=await setup(t,true);await p.setViewportSize({width:1819,height:1019});
 await p.evaluate(mode=>{
  let f=document.getElementById('folder');
  if(mode==='plain-span')f.removeAttribute('role');
  if(mode==='native-img'){const img=document.createElement('img');img.id=f.id;img.setAttribute('style',f.getAttribute('style'));img.setAttribute('role','img');f.replaceWith(img);f=img;}
  if(mode==='outside-upper')f.style.top='250px';
  if(mode==='nested-owner'||mode==='message-image'){const w=document.createElement('div');if(mode==='nested-owner')w.setAttribute('aria-describedby','another-tip');else w.setAttribute('data-message-author-role','assistant');f.before(w);w.append(f);}
  window.folderClicks=0;f.addEventListener('click',()=>folderClicks++);
 },mode);
 await p.locator('#folder').hover();
 await p.evaluate(mode=>{makeTip();document.getElementById('more').removeAttribute('aria-describedby');document.getElementById('folder').setAttribute('aria-describedby','tip');
  document.getElementById('positioner').style.transform='translate(320px,-25.4545px)';
  if(mode==='other-owner')document.getElementById('other').setAttribute('aria-describedby','tip');
  if(mode==='duplicate-id'){const d=document.createElement('div');d.id='tip';document.body.append(d);}
 },mode);
 if(mode==='valid'){
  await p.waitForFunction(()=>Math.abs(document.getElementById('tip').getBoundingClientRect().top-138)<.02);
  const r=await p.locator('#folder').boundingBox();assert.deepEqual(r,{x:356,y:96,width:36,height:36});
  assert.equal(1019-12-(r.y+r.height)-6,869);
  // Pointer movement between the SVG and its span must retain the same source.
  await p.mouse.move(388,128);
  await p.waitForTimeout(80);assert.notEqual(await p.locator('#positioner').evaluate(e=>e.style.translate),'');
  await p.mouse.move(700,400);
  await p.waitForFunction(()=>document.getElementById('positioner').style.translate==='');
  assert.equal(await p.locator('#tip').evaluate(e=>e.style.animation),'');
  await p.locator('#folder').hover();await p.waitForFunction(()=>Math.abs(document.getElementById('tip').getBoundingClientRect().top-138)<.02);
 }else{
  await p.waitForTimeout(180);assert.equal(await p.locator('#positioner').evaluate(e=>e.style.translate),'');
 }
 assert.equal(await p.evaluate(()=>folderClicks),0);
 assert.equal(await p.locator('#folder').getAttribute('tabindex'),null);
 assert.equal(await p.locator('#folder').getAttribute('role'),mode==='plain-span'?null:'img');
});
