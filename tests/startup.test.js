const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),path=require('node:path');
const root=path.resolve(__dirname,'..'),prefix='thread-colors:v1:';
async function setup(t){
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox'],headless:true});t.after(()=>browser.close());
  const context=await browser.newContext({viewport:{width:900,height:700}});
  await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><style>body{margin:0}#root{height:100dvh;display:flex;flex-direction:column}main{height:100vh;min-height:0;flex:1;display:flex;flex-direction:column}textarea{margin-top:auto;height:80px}</style><div id="root"><a href="/c/a">A</a><a href="/c/b">B</a><main><textarea id="prompt-textarea"></textarea></main></div>'}));
  await context.addInitScript(()=>{
    window.gets={};window.listeners=[];window.frames=[];window.activeWrites=0;
    window.chrome={storage:{local:{get:key=>key.includes(":display:")?Promise.resolve({[key]:true}):key.endsWith("defaults:appearance")?Promise.resolve({}):new Promise((resolve,reject)=>{window.gets[key]={resolve,reject};}),set:async()=>{}},onChanged:{addListener:f=>window.listeners.push(f)}}};
    window.finishRead=(key,value,fail=false)=>{const pending=window.gets[key];if(fail)pending.reject(Error('fixture read failure'));else pending.resolve({[key]:value});};
  });
  async function load(p){
    await p.addScriptTag({path:path.join(root,'core.js')});
    await p.evaluate(()=>{
      new MutationObserver(records=>{for(const r of records)if(r.attributeName==='data-thread-colors-active'&&document.documentElement.hasAttribute(r.attributeName))window.activeWrites++;}).observe(document.documentElement,{attributes:true});
      function frame(){
        const h=document.getElementById('marusin-thread-colors'),active=document.documentElement.hasAttribute('data-thread-colors-active');
        if(h){const s=h.shadowRoot,shown=getComputedStyle(h).display!=='none';
          window.frames.push({shown,active,bodyFixed:getComputedStyle(document.body).position==='fixed',
            ...(shown?{height:s.querySelector('.bar').getBoundingClientRect().height,font:parseFloat(getComputedStyle(s.querySelector('.title')).fontSize),border:parseFloat(getComputedStyle(s.querySelector('.frame')).borderTopWidth),composerBottom:document.querySelector('textarea').getBoundingClientRect().bottom,titlePresent:!!s.querySelector('.title').textContent}:{} )});
        }
        window.frame=requestAnimationFrame(frame);
      }window.frame=requestAnimationFrame(frame);
    });
    await p.addScriptTag({path:path.join(root,'content.js')});
    await p.waitForFunction(()=>window.gets['thread-colors:v1:enabled']&&window.gets['thread-colors:v1:a']);
  }
  const p=await context.newPage();await p.goto('https://chatgpt.com/c/a');await load(p);
  return {p,load};
}
const frames=async p=>p.evaluate(()=>new Promise(resolve=>{let n=0;function tick(){if(++n===5)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
async function finish(p,key,value,fail=false){await p.evaluate(({key,value,fail})=>window.finishRead(key,value,fail),{key,value,fail});await frames(p);}
for(const fail of ['none','enabled','chat'])test('startup remains entirely hidden with OFF or failed read: '+fail,async t=>{
  const {p,load}=await setup(t);
  for(let run=0;run<2;run++){
    if(run){await p.reload();await load(p);}
    await frames(p);assert.ok((await p.evaluate(()=>window.frames)).every(f=>!f.shown&&!f.active&&!f.bodyFixed));
    await finish(p,prefix+'a',{height:88,fontSize:36,border:12},fail==='chat');
    await finish(p,prefix+'enabled',fail==='chat'?true:false,fail==='enabled');
    const result=await p.evaluate(()=>({frames:window.frames,writes:window.activeWrites}));
    assert.equal(result.writes,0);assert.ok(result.frames.length>5);
    assert.ok(result.frames.every(f=>!f.shown&&!f.active&&!f.bodyFixed));
    await p.locator('textarea').click();assert.equal(await p.locator('textarea').evaluate(e=>e===document.activeElement),true);
  }
});
for(const order of ['enabled-first','chat-first'])test('first visible frame uses saved dimensions and route waits for new settings: '+order,async t=>{
  const {p,load}=await setup(t);
  const cfg={color:'#123456',height:88,fontSize:36,border:12};
  await finish(p,order==='enabled-first'?prefix+'enabled':prefix+'a',order==='enabled-first'?true:cfg);
  assert.ok((await p.evaluate(()=>window.frames)).every(f=>!f.shown&&!f.active));
  await finish(p,order==='enabled-first'?prefix+'a':prefix+'enabled',order==='enabled-first'?cfg:true);
  const shown=await p.evaluate(()=>window.frames.filter(f=>f.shown));
  assert.ok(shown.length);assert.ok(shown.every(f=>f.active&&f.height===88&&f.font===36&&f.border===12&&f.titlePresent&&f.composerBottom<=700));
  await p.evaluate(()=>{history.pushState({},'', '/c/b');document.dispatchEvent(new Event('visibilitychange'));window.frames=[];});
  await frames(p);assert.ok((await p.evaluate(()=>window.frames)).every(f=>!f.shown&&!f.active));
  await finish(p,prefix+'b',{height:40,fontSize:18,border:2});
  assert.ok((await p.evaluate(()=>window.frames.filter(f=>f.shown))).every(f=>f.height===40&&f.font===18&&f.border===2));
  await p.evaluate(()=>history.replaceState({},'', '/c/a'));await p.reload();await load(p);
  await frames(p);assert.ok((await p.evaluate(()=>window.frames)).every(f=>!f.shown&&!f.active));
  await finish(p,prefix+'enabled',true);await finish(p,prefix+'a',cfg);
  const reloadFrames=await p.evaluate(()=>window.frames.filter(f=>f.shown));assert.ok(reloadFrames.length);
  assert.ok(reloadFrames.every(f=>f.height===88&&f.font===36&&f.border===12&&f.composerBottom<=700));
});
test('storage changes override pending startup reads without a provisional paint',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>window.listeners.forEach(f=>f({'thread-colors:v1:enabled':{newValue:true},'thread-colors:v1:a':{newValue:{height:80,fontSize:34,border:9}}},'local')));
  await frames(p);
  await finish(p,prefix+'a',{height:40,fontSize:18,border:0});
  await finish(p,prefix+'enabled',false);
  const shown=await p.evaluate(()=>window.frames.filter(f=>f.shown));
  assert.ok(shown.length);assert.ok(shown.every(f=>f.height===80&&f.font===34&&f.border===9));
});
