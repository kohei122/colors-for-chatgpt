const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),path=require('node:path');
const source=path.resolve(__dirname,'../diagnostics/focus-latency.js');
for(const state of ['on','off','absent'])test('focus diagnostic works and cleans up: '+state,async t=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox'],headless:true});t.after(()=>browser.close());
  const p=await browser.newPage();
  await p.setContent('<main><textarea id="prompt-textarea">PRIVATE_INPUT</textarea><p>PRIVATE_BODY</p></main>');
  await p.evaluate(state=>{
    if(state!=='absent'){const h=document.createElement('div');h.id='marusin-thread-colors';h.style.display=state==='on'?'block':'none';document.body.append(h);}
    window.interactions=0;document.addEventListener('input',()=>window.interactions++);
  },state);
  await p.clock.install();await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));
  await p.addScriptTag({path:source});await p.clock.runFor(2999);
  assert.equal(await p.evaluate(()=>window.__ctcFocusDiagnostic.status),'preparing');
  await p.clock.runFor(2);
  await p.evaluate(()=>{const input=document.querySelector('textarea');input.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));input.focus();});
  await p.clock.runFor(8100);
  const result=await p.evaluate(()=>window.__ctcFocusDiagnostic);
  assert.equal(result.status,'complete');assert.equal(result.cleanup,true);
  assert.equal(result.extensionPresent,state!=='absent');assert.equal(result.bandVisible,state==='on');
  assert.ok(result.pointer&&result.focus);assert.equal(typeof result.nextFrameMs,'number');
  assert.ok(!JSON.stringify(result).includes('PRIVATE_'));
  assert.equal(await p.evaluate(()=>window.interactions),0);
  assert.equal(await p.locator('textarea').inputValue(),'PRIVATE_INPUT');
  assert.equal(await p.evaluate(()=>typeof window.__ctcFocusStop),'undefined');
  const snapshot=JSON.stringify(result);await p.clock.runFor(9000);
  assert.equal(JSON.stringify(await p.evaluate(()=>window.__ctcFocusDiagnostic)),snapshot);
  await p.addScriptTag({path:source});await p.evaluate(()=>window.__ctcFocusStop());
  assert.equal(await p.evaluate(()=>window.__ctcFocusDiagnostic.status),'cancelled');
  assert.equal(await p.evaluate(()=>typeof window.__ctcFocusStop),'undefined');
});
