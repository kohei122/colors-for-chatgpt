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

async function make(p,kind='fixed',source='button',event='hover') {
 await p.mouse.move(700,400);
 await p.evaluate(({kind,source})=>{
  const b=document.getElementById('more');
  if(source==='role-button'||source==='image'){
   const el=document.createElement(source==='image'?'span':'div');el.id='more';el.role=source==='image'?'img':'button';
   el.style.cssText='display:inline-block;width:32px;height:28px';if(source!=='image')el.tabIndex=0;b.replaceWith(el);
  }
  if(source==='wrapper'){const w=document.createElement('span');w.style.display='contents';b.before(w);w.append(b);}
  window.createSessionTip=()=>{
   makeTip();const tip=document.getElementById('tip');
   if(kind==='absolute'){document.body.append(tip);tip.style.cssText='position:absolute;left:500px;top:0;transform:translateY(-25.4545px);pointer-events:none';}
   if(source==='wrapper'){const b=document.getElementById('more');b.removeAttribute('aria-describedby');b.parentElement.setAttribute('aria-describedby','tip');}
   window.target=kind==='absolute'?tip:document.getElementById('positioner');
  };
 },{kind,source});
 if(event==='focus')await p.locator('#more').focus();else await p.locator('#more').hover();
 await p.evaluate(()=>createSessionTip());await placed(p);
}
for(const kind of ['absolute','fixed'])for(const source of ['button','role-button','image','wrapper'])for(const event of source==='image'?['hover']:['hover','focus'])
 test(`source x structure ${source} ${kind} ${event}`,async t=>{
  const p=await setup(t);await make(p,kind,source,event);
  assert.equal(await p.locator('#more').getAttribute('role'),source==='image'?'img':source==='role-button'?'button':null);
  if(source==='image')assert.equal(await p.locator('#more').getAttribute('tabindex'),null);
  if(event==='focus')await p.locator('#other').focus();else await p.mouse.move(700,400);
  await p.waitForFunction(()=>target.style.translate==='');
 });
for(const order of ['aria-first','tip-first'])test('delayed nested portal '+order,async t=>{
 const p=await setup(t);
 if(order==='aria-first')await p.locator('#more').evaluate(e=>e.setAttribute('aria-describedby','tip'));
 await p.waitForTimeout(60);
 await p.evaluate(order=>{makeTip();if(order==='tip-first')document.getElementById('more').removeAttribute('aria-describedby');},order);
 if(order==='tip-first'){await p.waitForTimeout(60);await p.locator('#more').evaluate(e=>e.setAttribute('aria-describedby','tip'));}
 await placed(p);
});
for(const change of ['id','duplicate-id','competing-owner','hidden','inert','source-inert','replace'])test('revalidation releases on '+change,async t=>{
 const p=await setup(t);await make(p);await p.evaluate(change=>{
  window.oldTarget=target;window.oldTip=document.getElementById('tip');
  if(change==='id')oldTip.id='changed';
  if(change==='duplicate-id'){const x=document.createElement('div');x.id='tip';document.querySelector('article').append(x);}
  if(change==='competing-owner'){const x=document.createElement('span');x.setAttribute('aria-describedby','tip');document.querySelector('article').append(x);}
  if(change==='hidden')oldTip.hidden=true;
  if(change==='inert')oldTip.inert=true;
  if(change==='source-inert')document.getElementById('more').inert=true;
  if(change==='replace'){const clone=oldTip.cloneNode(true);clone.style.cssText='';oldTip.replaceWith(clone);}
 },change);
 if(change==='replace'){
  await p.waitForFunction(()=>oldTip.style.getPropertyValue('animation-name')==='');await placed(p);
 }else await p.waitForFunction(()=>oldTarget.style.translate==='');
});
for(const overwrite of [false,true])test('longhand restoration protects native updates '+overwrite,async t=>{
 const p=await setup(t);await p.mouse.move(700,400);
 await p.evaluate(()=>{makeTip();window.target=document.getElementById('positioner');const tip=document.getElementById('tip');
  for(const el of [tip,target]){el.style.setProperty('animation-name','native-fade');el.style.setProperty('animation-duration','3s','important');el.style.setProperty('animation-timing-function','linear');el.style.setProperty('transition-property','opacity');el.style.setProperty('transition-duration','2s','important');}
  window.before=[tip,target].map(e=>['animation-name','animation-duration','animation-timing-function','transition-property','transition-duration'].map(n=>[n,e.style.getPropertyValue(n),e.style.getPropertyPriority(n)]));
 });await p.locator('#more').hover();await placed(p);
 if(overwrite)await p.evaluate(()=>document.getElementById('tip').style.setProperty('animation-name','page-new','important'));
 else await p.mouse.move(700,400);
 await p.waitForFunction(()=>target.style.translate==='');
 const after=await p.evaluate(()=>[document.getElementById('tip'),target].map(e=>['animation-name','animation-duration','animation-timing-function','transition-property','transition-duration'].map(n=>[n,e.style.getPropertyValue(n),e.style.getPropertyPriority(n)])));
 const before=await p.evaluate(()=>before);if(overwrite)before[0][0]=['animation-name','page-new','important'];assert.deepEqual(after,before);
});
test('partial-write exception restores and disconnects observation',async t=>{
 const p=await setup(t);await p.evaluate(()=>{
  const Native=window.ResizeObserver;window.liveObservers=0;
  window.ResizeObserver=class {constructor(fn){this.inner=new Native(fn);this.live=true;liveObservers++;}observe(e){this.inner.observe(e);}disconnect(){this.inner.disconnect();if(this.live){liveObservers--;this.live=false;}}};
  makeTip();const tip=document.getElementById('tip'),rect=tip.getBoundingClientRect.bind(tip);
  tip.getBoundingClientRect=()=>{if(tip.style.getPropertyValue('animation-name')==='none')throw Error('injected');return rect();};
 });
 await p.waitForTimeout(150);
 assert.equal(await p.evaluate(()=>liveObservers),0);
 assert.equal(await p.locator('#tip').evaluate(e=>e.style.getPropertyValue('animation-name')),'');
 assert.equal(await p.locator('#positioner').evaluate(e=>e.style.translate),'');
 // Further native style changes cannot restart the failed session.
 await p.locator('#positioner').evaluate(e=>e.style.transform='translate(200px,0px)');await p.waitForTimeout(100);
 assert.equal(await p.evaluate(()=>liveObservers),0);
});
test('continuous native repositioning stops without automatic restart',async t=>{
 const p=await setup(t);await make(p);
 await p.evaluate(async()=>{for(let i=0;i<20;i++){target.style.transform=`translate(400px,${i%2?-25:10}px)`;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}});
 await p.waitForFunction(()=>target.style.translate==='');
 await p.locator('#positioner').evaluate(e=>e.style.transform='translate(500px,-20px)');await p.waitForTimeout(80);
 assert.equal(await p.locator('#positioner').evaluate(e=>e.style.translate),'');
 await p.mouse.move(700,400);await p.locator('#more').hover();await placed(p);
});
test('waiting expires; stale frame cannot affect next source',async t=>{
 const p=await setup(t);await p.mouse.move(700,400);await p.clock.install();await p.locator('#more').hover();await p.clock.runFor(16000);
 await p.evaluate(()=>makeTip());await p.clock.runFor(100);
 assert.equal(await p.locator('#positioner').evaluate(e=>e.style.translate),'');
 await p.mouse.move(700,400);await p.locator('#more').hover();await p.clock.runFor(100);await placed(p);
 await p.evaluate(()=>{window.dispatchEvent(new Event('resize'));document.getElementById('other').focus();});await p.clock.runFor(100);
 assert.equal(await p.locator('#positioner').evaluate(e=>e.style.translate),'');
});
test('unrelated message updates do not trigger document-wide selector queries',async t=>{
 const p=await setup(t);await make(p);await p.waitForTimeout(100);
 await p.evaluate(()=>{window.queries=0;const query=document.querySelectorAll.bind(document);document.querySelectorAll=(...a)=>{queries++;return query(...a);};
  const a=document.querySelector('article');for(let i=0;i<30;i++){const span=document.createElement('span');span.textContent='fixture';a.append(span);}
 });await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>queries),0);
});
test('standalone diagnostic uses shared fixed policy, not absolute rejection reasons',async t=>{
 const p=await setup(t);await make(p);await p.clock.install();
 await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});await p.clock.runFor(16500);
 const d=await p.evaluate(()=>window.__ctcTooltipDiagnostic);
 assert.equal(d.status,'complete');const a=d.samples[0].assessments.find(a=>a.linkedTooltipCount===1);
 assert.equal(a.evaluatedStructure,'fixed');assert.equal(a.structureEvaluations.fixed.eligible,true);
 assert.equal(a.structureEvaluations.absolute.eligible,false);assert.equal(a.productDecision,'not-observed');
 assert.ok(!a.reasons.includes('position-not-absolute'));
});
test('generated policy copies are byte-identical to source',()=>{
 const source=fs.readFileSync(path.join(root,'tools/tooltip-policy.js'),'utf8').trimEnd();
 for(const name of ['content.js','diagnostics/tooltip-layout.js']){
  const text=fs.readFileSync(path.join(root,name),'utf8').split('// BEGIN GENERATED TOOLTIP POLICY\n')[1].split('  // END GENERATED TOOLTIP POLICY')[0].trimEnd();
  assert.equal(text.split('\n').map(x=>x.startsWith('  ')?x.slice(2):x).join('\n'),source);
 }
});
