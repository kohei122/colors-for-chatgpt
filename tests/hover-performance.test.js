const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),results=[];
for(const enabled of [true,false])test(`bounded hover trace on long DOM enabled=${enabled}`,async t=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true});t.after(()=>browser.close());
  const p=await browser.newPage({viewport:{width:1000,height:700}});
  await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><style>body{margin:0}#root,.shell{height:100dvh}.shell{display:flex;flex-direction:column}main{flex:1;overflow:auto}textarea{height:60px;flex:none}[role=tooltip]{position:fixed;top:50px;left:20px;pointer-events:none}</style><div id=root><div class="shell h-dvh"><nav><a href=/c/private-id>PRIVATE_TITLE</a></nav><header><button aria-label=共有>共有</button></header><main></main><textarea id=prompt-textarea>PRIVATE_INPUT</textarea></div></div>`}));
  await p.goto('https://chatgpt.com/c/private-id');
  await p.evaluate(enabled=>{
    window.chrome={storage:{local:{get:async key=>({[key]:key.includes(':display:')?true:key.endsWith('enabled')?enabled:undefined}),set:async()=>{}},onChanged:{addListener(){}}}};
    const frag=document.createDocumentFragment();for(let i=0;i<5000;i++){const el=document.createElement('div');el.innerHTML='<span><b>PRIVATE_BODY</b><i>text</i></span>';frag.append(el);}document.querySelector('main').append(frag);
    const button=document.querySelector('button');
    button.addEventListener('mouseenter',()=>{
      const wrap=document.createElement('div');wrap.id='portal';wrap.innerHTML='<div role=tooltip data-state=open>TIP</div>';document.body.append(wrap);
      let tick=0;window.tipTimer=setInterval(()=>{wrap.style.transform=`translateX(${++tick%2}px)`;wrap.firstChild.style.opacity=tick%2?'.9':'1';},50);
    });
    button.addEventListener('mouseleave',()=>{clearInterval(window.tipTimer);document.querySelector('#portal')?.remove();});
  },enabled);
  await p.addScriptTag({path:path.join(root,'core.js')});await p.addScriptTag({path:path.join(root,'content.js')});await p.waitForTimeout(800);
  await p.evaluate(()=>document.getElementById('marusin-thread-colors').dispatchEvent(new Event('thread-colors-hover-start')));
  await p.waitForTimeout(3020);await p.locator('header button').hover();
  await p.waitForTimeout(3000);await p.mouse.move(950,650);
  await p.waitForTimeout(3000);await p.evaluate(()=>{
    document.querySelector('main').scrollTop=200;document.querySelector('textarea').focus();
    // One page-owned ancestor style change is a separate, attributable layout trigger.
    document.querySelector('.shell').style.setProperty('--focus','1');
  });
  await p.waitForTimeout(3200);
  const result=await p.evaluate(()=>JSON.parse(document.getElementById('marusin-thread-colors').getAttribute('data-performance-diagnostic')));
  assert.equal(result.status,'complete');assert.equal(result.cleanup,true);
  for(const phase of Object.values(result.phases)){
    assert.equal(phase.signals['modal-enter']||0,0);assert.equal(phase.signals['modal-exit']||0,0);
    assert.equal(phase.signals.apply||0,0);assert.equal(phase.signals['title-link-rebuild']||0,0);
    assert.equal(phase.signals['shell-ancestor-rebuild']||0,0);
  }
  assert.equal(result.phases.hover.signals['tooltip-added'],1);
  assert.ok(result.phases.hover.signals['tooltip-attribute']>30);
  assert.equal(result.phases.afterQuiet.signals['tooltip-removed'],1);
  for(const phase of ['before','hover','afterQuiet'])assert.equal(result.phases[phase].signals['scheduled-frame']||0,0);
  assert.equal(result.phases.afterInteraction.signals['schedule-layout-attribute']||0,enabled?1:0);
  assert.equal(result.phases.afterInteraction.signals['scheduled-frame']||0,enabled?1:0);
  const raw=JSON.stringify(result);for(const secret of ['PRIVATE','private-id','TIP'])assert.ok(!raw.includes(secret));
  await p.waitForTimeout(700);assert.equal(await p.locator('#marusin-thread-colors').getAttribute('data-performance-diagnostic'),raw);
  results.push({enabled,result});
});
test.after(()=>fs.writeFileSync(path.join(root,'tests/hover-results.json'),JSON.stringify(results,null,2)));

test('hover diagnostics release observers and do not publish later after cancel or navigation',async t=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true});t.after(()=>browser.close());
  const p=await browser.newPage();await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><main><textarea></textarea></main>'}));await p.goto('https://chatgpt.com/c/a');
  await p.evaluate(()=>window.chrome={storage:{local:{get:async key=>({[key]:key.includes(":display:")?true:undefined}),set:async()=>{}},onChanged:{addListener(){}}}});
  await p.addScriptTag({path:path.join(root,'core.js')});await p.addScriptTag({path:path.join(root,'content.js')});await p.waitForTimeout(100);await p.clock.install();
  for(const reason of ['cancelled','navigation']){
    await p.evaluate(reason=>{const h=document.getElementById('marusin-thread-colors');h.dispatchEvent(new Event('thread-colors-hover-start'));if(reason==='cancelled')h.dispatchEvent(new Event('thread-colors-performance-stop'));else {history.pushState({},'', '/c/b');document.dispatchEvent(new Event('visibilitychange'));}},reason);
    const raw=await p.locator('#marusin-thread-colors').getAttribute('data-performance-diagnostic');const data=JSON.parse(raw);assert.equal(data.status,reason);assert.equal(data.cleanup,true);
    await p.clock.runFor(13000);assert.equal(await p.locator('#marusin-thread-colors').getAttribute('data-performance-diagnostic'),raw);
  }
});
