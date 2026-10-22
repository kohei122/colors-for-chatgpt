const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function setup(t,enabled=true) {
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox'],headless:true});
  t.after(()=>browser.close());
  const p=await browser.newPage({viewport:{width:800,height:600}});
  await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8">
    <style>body{margin:0}button{margin:8px}main{height:200px}</style>
    <nav><a href="/c/private-chat-id"><span class="truncate">PRIVATE_CHAT_NAME</span></a></nav>
    <header><button aria-label="共有">共有</button><button aria-label="PRIVATE_LABEL">別操作</button></header>
    <main><article>PRIVATE_CONVERSATION</article><textarea>PRIVATE_INPUT</textarea></main>`}));
  await p.goto('https://chatgpt.com/c/private-chat-id');
  await p.evaluate(enabled=>{
    window.chrome={storage:{local:{get:async key=>({[key]:key.includes(':display:')?true:key.endsWith('enabled')?enabled:undefined}),set:async()=>{}},onChanged:{addListener(){}}}};
  },enabled);
  await p.addScriptTag({path:path.join(root,'core.js')});
  await p.addScriptTag({path:path.join(root,'content.js')});
  await p.waitForTimeout(100);
  await p.clock.install();
  return p;
}
for(const enabled of [true,false])for(const focus of [true,false])test(`tooltip diagnostic is read-only and delayed, band=${enabled}, focus=${focus}`,async t=>{
  const p=await setup(t,enabled);
  const button=p.locator('button[aria-label="共有"]');
  if(focus)await button.focus();else await button.hover();
  await p.evaluate(()=>{
    window.actions=0;
    for(const event of ['click','input','submit'])document.addEventListener(event,()=>window.actions++);
    // A visually hidden accessibility tooltip inside a visible positioning wrapper.
    const wrapper=document.createElement('div');
    wrapper.setAttribute('data-radix-popper-content-wrapper','');
    wrapper.style.cssText='position:fixed;left:100px;top:-30px;transform:translate(0px,10px);z-index:50';
    wrapper.innerHTML='<div data-side="top" data-state="delayed-open" style="width:120px;height:32px;background:black"><span role="tooltip" id="PRIVATE_TOOLTIP_ID" style="position:absolute;width:1px;height:1px;overflow:hidden">PRIVATE_TOOLTIP_TEXT</span></div>';
    setTimeout(()=>{
      document.body.append(wrapper);
      document.querySelector('button').setAttribute('aria-describedby','PRIVATE_TOOLTIP_ID');
    },12000);
    window.originalBodyStyle=document.body.getAttribute('style');
  });
  // Freeze virtual time before the diagnostic starts: wall-clock scheduling
  // must not turn the 9999 ms assertion into a sample after 10000 ms.
  await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));
  await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});
  await p.clock.runFor(9999);
  assert.equal(await p.evaluate(()=>window.__ctcTooltipDiagnostic.samples.length),0);
  await p.clock.runFor(6501);
  const d=await p.evaluate(()=>window.__ctcTooltipDiagnostic);
  assert.equal(d.status,'complete');assert.equal(d.cleanup,true);
  assert.ok(d.samples.length>1);
  assert.equal(d.samples[0].layoutActive,enabled);
  const last=d.samples.at(-1);
  assert.ok(last.buttons.some(b=>b.element.attributes.sharedButton));
  const related=last.candidates.find(c=>c.sources.includes('aria-describedby'));
  assert.ok(related);assert.equal(related.triggerRefs.length,1);
  assert.ok(related.ancestors.nodes.some(n=>n.attributes.popperWrapper));
  assert.ok(related.ancestors.nodes.some(n=>n.style.transform!=='none'));
  assert.ok(last.candidates.some(c=>c.intersectsBand)===enabled);
  const json=JSON.stringify(d);
  for(const privateValue of ['PRIVATE_','private-chat-id','https://chatgpt.com'])assert.ok(!json.includes(privateValue));
  assert.deepEqual(await p.evaluate(()=>[window.actions,document.body.getAttribute('style')===window.originalBodyStyle,typeof window.__ctcTooltipDiagnosticStop]),[0,true,'undefined']);
  await p.clock.runFor(20000);
  assert.equal(JSON.stringify(await p.evaluate(()=>window.__ctcTooltipDiagnostic)),json);
});
for(const exit of ['cancel','navigation','pagehide','restart'])test('tooltip diagnostic cleans up on '+exit,async t=>{
  const p=await setup(t);
  await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});
  await p.clock.runFor(10200);
  await p.evaluate(()=>window.previousDiagnostic=window.__ctcTooltipDiagnostic);
  if(exit==='cancel')await p.evaluate(()=>window.__ctcTooltipDiagnosticStop());
  if(exit==='navigation')await p.evaluate(()=>history.pushState({},'', '/c/other'));
  if(exit==='pagehide')await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  if(exit==='restart')await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});
  await p.clock.runFor(300);
  const d=await p.evaluate(()=>window.previousDiagnostic);
  assert.equal(d.cleanup,true);
  assert.equal(d.status,{cancel:'cancelled',navigation:'navigation',pagehide:'pagehide',restart:'cancelled'}[exit]);
  const count=d.samples.length;await p.clock.runFor(17000);
  assert.equal(await p.evaluate(()=>window.previousDiagnostic.samples.length),count);
});


test('diagnostic distinguishes ancestor ARIA from button ARIA without collecting labels',async t=>{
 const p=await setup(t);await p.locator('button[aria-label="共有"]').hover();
 await p.evaluate(()=>{const b=document.querySelector('button'),wrapper=document.createElement('div');b.before(wrapper);wrapper.append(b);wrapper.setAttribute('aria-describedby','PRIVATE_TIP');const tip=document.createElement('div');tip.id='PRIVATE_TIP';tip.role='tooltip';tip.textContent='PRIVATE_DESCRIPTION';tip.style.cssText='position:absolute;top:40px;width:100px;height:30px';document.body.append(tip);});
 await p.locator('button[aria-label="共有"]').focus();
 await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});await p.clock.runFor(16500);
 const d=await p.evaluate(()=>window.__ctcTooltipDiagnostic);assert.equal(d.status,'complete');const item=d.samples.at(-1).assessments.find(x=>x.reasons.includes('button-has-no-describedby'));assert.ok(item);assert.equal(item.ancestorDescribedByCount,1);assert.ok(!JSON.stringify(d).includes('PRIVATE_'));
});

test('Work icon diagnostic captures ancestor ARIA and visible sibling without using asset as ownership',async t=>{
 const p=await setup(t);
 await p.evaluate(()=>{
  const b=document.querySelector('button'),wrap=document.createElement('div');b.before(wrap);wrap.append(b);
  wrap.setAttribute('aria-describedby','PRIVATE_ACCESSIBLE');
  b.innerHTML='<svg width="20" height="20"><use href="/PRIVATE_ASSET.svg#list-circle-light-20"></use></svg>';
  const portal=document.createElement('div');portal.innerHTML='<span role="tooltip" id="PRIVATE_ACCESSIBLE" style="position:absolute;width:1px;height:1px;overflow:hidden">PRIVATE_TEXT</span><div style="position:absolute;top:40px;width:150px;height:30px">PRIVATE_VISIBLE</div>';
  document.body.append(portal);
 });
 await p.locator('button[aria-label="共有"]').focus();
 await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});await p.clock.runFor(16500);
 const d=await p.evaluate(()=>window.__ctcTooltipDiagnostic),s=d.samples.at(-1);
 assert.equal(d.diagnostic,'tooltip-layout-v3');assert.equal(d.cleanup,true);assert.equal(d.iconMatchCount,1);
 assert.equal(s.icons[0].kind,'overview');assert.ok(s.icons[0].buttonRef);
 const edge=s.ariaEdges.find(x=>x.attribute==='aria-describedby'&&x.depth===1);assert.ok(edge);
 const tip=s.candidates.find(x=>x.element.ref===edge.targetRef);assert.deepEqual(tip.triggerRefs,[]);
 assert.ok(tip.localStructure.siblings.some(x=>x.rect.width===150));
 assert.ok(s.assessments.some(x=>x.reasons.includes('button-has-no-describedby')));
 assert.ok(!JSON.stringify(d).includes('PRIVATE_'));
});
test('Work folder xlink diagnostic works on non-button SVG ancestors and leaves the page untouched',async t=>{
 const p=await setup(t);await p.evaluate(()=>{
 const b=document.querySelector('button');b.outerHTML='<div role="link" tabindex="0" aria-describedby="PRIVATE_FOLDER" style="width:40px;height:30px"><svg width="20" height="20"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/PRIVATE_ASSET.svg#folder-light-20"></use></svg></div>';
 const tip=document.createElement('div');tip.id='PRIVATE_FOLDER';tip.role='tooltip';tip.style.cssText='position:fixed;top:20px;width:100px;height:30px';document.body.append(tip);
 window.beforeStyle=tip.getAttribute('style');window.countActions=0;document.addEventListener('click',()=>countActions++);
 });
 await p.locator('[tabindex="0"]').first().focus();
 await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});await p.clock.runFor(16500);
 const d=await p.evaluate(()=>window.__ctcTooltipDiagnostic),s=d.samples.at(-1);
 assert.equal(s.icons[0].kind,'folder');assert.equal(s.icons[0].buttonRef,null);
 assert.ok(s.icons[0].ancestors.nodes.some(n=>n.attributes.role==='link'));
 assert.ok(s.assessments.some(x=>x.reasons.includes('trigger-not-button')));
 assert.deepEqual(await p.evaluate(()=>[countActions,document.getElementById('PRIVATE_FOLDER').getAttribute('style')===beforeStyle]),[0,true]);
 assert.ok(!JSON.stringify(d).includes('PRIVATE_'));
});

test('Work folder diagnostic recognizes a direct semantic image description without adding interaction',async t=>{
 const p=await setup(t);await p.evaluate(()=>{
  document.querySelector('button').outerHTML='<span role="img" aria-describedby="PRIVATE_FOLDER" style="display:inline-block;width:36px;height:36px"><svg width="20" height="20"><use href="/PRIVATE_ASSET.svg#folder-light-20"></use></svg></span>';
  const tip=document.createElement('div');tip.id='PRIVATE_FOLDER';tip.role='tooltip';tip.style.cssText='position:absolute;top:20px;width:100px;height:30px;pointer-events:none';document.body.append(tip);
 });
 await p.locator('span[role=img]').hover();await p.addScriptTag({path:path.join(root,'diagnostics/tooltip-layout.js')});await p.clock.runFor(16500);
 const d=await p.evaluate(()=>window.__ctcTooltipDiagnostic),s=d.samples.at(-1);
 const source=s.buttons.find(x=>x.element.tag==='span'&&x.element.attributes.role==='img');assert.ok(source);
 const a=s.assessments.find(x=>x.triggerRef===source.element.ref);assert.ok(a);assert.equal(a.linkedTooltipCount,1);assert.ok(!a.reasons.includes('trigger-not-button'));
 assert.equal(d.cleanup,true);assert.ok(!JSON.stringify(d).includes('PRIVATE_'));assert.equal(await p.locator('span[role=img]').getAttribute('tabindex'),null);
});
