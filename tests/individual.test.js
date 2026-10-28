const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),prefix='thread-colors:v1:',display=prefix+'display:';
async function setup(t,initial={},delay=0){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true});t.after(()=>browser.close());
 const context=await browser.newContext({viewport:{width:1000,height:700}}),data={...initial},writes=[];
 await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><title>Fixture - ChatGPT</title><style>body{margin:0}main{height:100dvh;display:flex;flex-direction:column}textarea{margin-top:auto}</style><nav><a href="/c/a">Sunny day</a><a href="/c/b">Typography</a></nav><main><textarea id="prompt-textarea"></textarea></main>'}));
 await context.exposeBinding('getData',async(_,key)=>{const v=data[key];if(delay)await new Promise(r=>setTimeout(r,delay));return {[key]:v};});
 async function set(values){for(const [key,value]of Object.entries(values)){data[key]=value;writes.push(key);for(const p of context.pages())await p.evaluate(({key,value})=>listeners.forEach(f=>f({[key]:{newValue:value}},'local')),{key,value});}}
 await context.exposeBinding('setData',(_,v)=>set(v));
 await context.addInitScript(()=>{window.listeners=[];window.chrome={runtime:{id:'fixture',onMessage:{addListener:f=>window.receive=f}},storage:{local:{get:k=>getData(k),set:v=>setData(v)},onChanged:{addListener:f=>listeners.push(f)}}};window.message=r=>new Promise(resolve=>receive(r,{id:'fixture'},resolve));});
 async function load(p){await p.addScriptTag({path:path.join(root,'core.js')});await p.addScriptTag({path:path.join(root,'content.js')});}
 async function page(url='https://chatgpt.com/c/a'){const p=await context.newPage();await p.goto(url);await load(p);return p;}
 const p=await page();return {p,page,load,data,writes,set};
}
const ready=p=>p.waitForFunction(()=>message({type:'chat-colors:state'}).then(s=>s.ready));
const shown=p=>p.locator('#marusin-thread-colors').isVisible();
const state=p=>p.evaluate(()=>message({type:'chat-colors:state'}));
async function toggle(p,id,value){return p.evaluate(r=>message(r),{type:'chat-colors:set-display',id,value});}
async function route(p,url){await p.evaluate(url=>{history.pushState({},'',url);document.dispatchEvent(new Event('visibilitychange'));},url);}
test('025 brand, permission boundary and stable internal identifiers',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));assert.equal(m.name,'Colors for ChatGPT (by marusin)');assert.equal(m.version,'1.0.1');assert.deepEqual(m.permissions,['storage']);assert.equal(m.host_permissions,undefined);assert.deepEqual(m.content_scripts[0].matches,['https://chatgpt.com/*']);assert.match(fs.readFileSync(path.join(root,'popup.html'),'utf8'),/このチャットで帯を表示/);
});
test('025 absent, malformed and old color settings default OFF without writes',async t=>{
 const {p,data,writes,set}=await setup(t,{[prefix+'a']:{color:'#123456',fontSize:34}});await ready(p);assert.equal(await shown(p),false);assert.equal(await p.locator('html').getAttribute('data-thread-colors-active'),null);
 for(const value of ['true',1,{},null]){await set({[display+'a']:value});assert.equal(await shown(p),false);}
 assert.equal(data[prefix+'a'].color,'#123456');assert.deepEqual(writes,[display+'a',display+'a',display+'a',display+'a']);
});
test('025 global precedence, independent chats, back/forward and reload preserve colors',async t=>{
 const {p,data,set,load}=await setup(t,{[prefix+'a']:{color:'#123456',height:88,fontSize:34,border:9}});await ready(p);
 assert.equal((await toggle(p,'a',true)).ok,true);assert.equal(await shown(p),true);assert.equal(await p.locator('#marusin-thread-colors').evaluate(e=>e.style.getPropertyValue('--color')),'#123456');
 await set({[prefix+'enabled']:false});assert.equal(await shown(p),false);assert.equal(data[display+'a'],true);
 await set({[prefix+'enabled']:true});assert.equal(await shown(p),true);
 await route(p,'/c/b');await ready(p);assert.equal(await shown(p),false);await toggle(p,'b',true);await toggle(p,'b',false);
 await p.goBack();await ready(p);await p.waitForFunction(()=>location.pathname==='/c/a'&&document.documentElement.hasAttribute('data-thread-colors-active'));assert.equal(await shown(p),true);
 await p.goForward();await p.waitForFunction(()=>location.pathname==='/c/b'&&!document.documentElement.hasAttribute('data-thread-colors-active'));assert.equal(await shown(p),false);
 await route(p,'/c/a');await ready(p);await p.reload();await load(p);await ready(p);assert.equal(await shown(p),true);assert.deepEqual(data[prefix+'a'],{color:'#123456',height:88,fontSize:34,border:9});
});
test('025 cross-tab toggles and settings changes use independent keys',async t=>{
 const {p,page,data,set}=await setup(t);const q=await page();await ready(p);await ready(q);
 await toggle(p,'a',true);assert.equal(await shown(q),true);
 await Promise.all([toggle(q,'a',false),set({[prefix+'a']:{color:'#abcdef',fontSize:30}})]);assert.equal(await shown(p),false);assert.equal(data[prefix+'a'].color,'#abcdef');
 await toggle(p,'a',true);assert.equal(await q.locator('#marusin-thread-colors').evaluate(e=>e.style.getPropertyValue('--color')),'#abcdef');
});
test('025 stale popup target and no-ID routes cannot write',async t=>{
 const {p,writes}=await setup(t);await ready(p);await route(p,'/c/b');assert.equal((await toggle(p,'a',true)).ok,false);
 for(const url of ['/','/g/project','/search','/c/a/other']){await route(p,url);assert.equal((await toggle(p,'a',true)).ok,false);assert.equal(await shown(p),false);assert.equal((await state(p)).id,null);}
 assert.deepEqual(writes,[]);
});
test('025 delayed individual read is superseded by storage event and navigation',async t=>{
 const {p,set}=await setup(t,{[display+'a']:true},180);await route(p,'/c/b');await set({[display+'b']:false});await ready(p);await p.waitForTimeout(250);assert.equal(await shown(p),false);assert.equal((await state(p)).id,'b');
 await toggle(p,'b',true);assert.equal(await shown(p),true);
});
test('025 OFF remains unpainted while individual setting loads',async t=>{
 const {p}=await setup(t,{},200);
 const frames=await p.evaluate(()=>new Promise(resolve=>{const samples=[];let start=performance.now();function tick(){samples.push(document.documentElement.hasAttribute('data-thread-colors-active'));if(performance.now()-start>300)resolve(samples);else requestAnimationFrame(tick);}tick();}));assert.ok(frames.length>2);assert.ok(frames.every(v=>!v));
});
test('025 title line box accommodates descenders without changing band or center',async t=>{
 const {p,set}=await setup(t,{[display+'a']:true});await ready(p);
 const results=[];
 for(const width of [1000,500])for(const size of [18,26,36])for(const height of [40,88])for(const text of ['g j p q y','Sunny day','Typography','日本語テスト']){
  await p.setViewportSize({width,height:700});await set({[prefix+'a']:{fontSize:size,height}});
  const v=await p.locator('#marusin-thread-colors .title').evaluate((e,text)=>{e.textContent=text;const r=e.getBoundingClientRect(),s=getComputedStyle(e),bar=e.getRootNode().querySelector('.bar').getBoundingClientRect();const c=document.createElement('canvas').getContext('2d');c.font=s.font;const m=c.measureText(text);return {height:r.height,ink:m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,center:r.x+r.width/2,screen:innerWidth/2,band:bar.height,font:s.fontSize,padding:parseFloat(s.paddingTop),text};},text);
  assert.ok(v.height>=v.ink+2,v.text);assert.ok(Math.abs(v.center-v.screen)<1);assert.equal(v.band,height);assert.equal(parseFloat(v.font),size);assert.ok(v.padding>0);results.push(v);
 }
 await p.screenshot({path:path.join(root,'tests/title-025.png')});fs.writeFileSync(path.join(root,'tests/title-025-results.json'),JSON.stringify(results,null,2));
});
test('025 individual read failure stays hidden and cannot show a provisional band',async t=>{
 const {p}=await setup(t,{[display+'a']:true});await ready(p);assert.equal(await shown(p),true);
 await p.evaluate(()=>{const get=chrome.storage.local.get;chrome.storage.local.get=key=>key.includes(':display:')?Promise.reject(Error('fixture')):get(key);});
 await route(p,'/c/b');await p.waitForTimeout(50);assert.equal(await shown(p),false);assert.equal((await state(p)).ready,false);assert.equal(await p.locator('html').getAttribute('data-thread-colors-active'),null);
});
test('025 simultaneous same-chat toggles converge on the stored value in both tabs',async t=>{
 const {p,page,data}=await setup(t);const q=await page();await ready(p);await ready(q);
 await Promise.all([toggle(p,'a',true),toggle(q,'a',false)]);
 for(const page of [p,q]){assert.equal((await state(page)).individual,data[display+'a']);assert.equal(await shown(page),data[display+'a']);}
});

const appearanceKey=prefix+'defaults:appearance';
async function dimensionEdit(p,name,value){await p.locator(`[name="${name}"]`).evaluate((e,value)=>{e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));},String(value));}
async function sizes(p){return p.locator('#marusin-thread-colors').evaluate(e=>({height:e.style.getPropertyValue('--height'),fontSize:e.style.getPropertyValue('--font-size'),border:e.style.getPropertyValue('--border')}));}
test('031 last menu dimensions seed unsaved chats without copying color, mode or enabled state',async t=>{
 const {p,page,data,writes}=await setup(t,{[display+'a']:true,[prefix+'a']:{height:60,fontSize:22,border:5,color:'#123456',textMode:'custom',textColor:'#abcdef'}});
 await p.locator('.bar').waitFor();await dimensionEdit(p,'height',88);await p.waitForFunction(()=>document.getElementById('marusin-thread-colors').shadowRoot.querySelector('.status').textContent==='保存しました');
 assert.deepEqual(data[appearanceKey],{height:88,fontSize:22,border:5});
 const q=await page('https://chatgpt.com/c/b');await ready(q);assert.equal(await shown(q),false);await toggle(q,'b',true);await q.locator('.bar').waitFor();
 const cfg=await q.locator('#marusin-thread-colors').evaluate(e=>[e.style.getPropertyValue('--height'),e.shadowRoot.querySelector('[name=fontSize]').value,e.shadowRoot.querySelector('[name=border]').value,e.shadowRoot.querySelector('[name=color]').value,e.shadowRoot.querySelector('[data-mode=auto]').getAttribute('aria-pressed')]);
 assert.deepEqual(cfg.slice(0,3),['88px','22','5']);assert.notEqual(cfg[3],'#123456');assert.equal(cfg[4],'true');assert.equal(data[prefix+'b'],undefined);
 const count=writes.filter(k=>k===appearanceKey).length;await toggle(q,'b',false);await toggle(q,'b',true);await route(q,'/c/a');await ready(q);assert.equal(writes.filter(k=>k===appearanceKey).length,count);
});
test('031 existing partial settings win; color is excluded and vivid updates only shared mode',async t=>{
 const common={height:88,fontSize:36,border:12};const {p,data,writes}=await setup(t,{[display+'a']:true,[appearanceKey]:common,[prefix+'a']:{color:'#123456',height:40}});
 await p.locator('.bar').waitFor();assert.equal(await p.locator('[name=height]').inputValue(),'40');assert.equal(await p.locator('[name=fontSize]').inputValue(),'26');
 await dimensionEdit(p,'color','#abcdef');await p.waitForTimeout(80);await p.locator('[data-mode=vivid]').evaluate(e=>e.click());await p.waitForTimeout(80);
 assert.deepEqual(data[appearanceKey],{...common,textMode:'vivid'});assert.equal(writes.filter(k=>k===appearanceKey).length,1);
});
test('031 delayed defaults have no provisional visible frame; storage events supersede old reads',async t=>{
 const {p,set,data,writes}=await setup(t,{[display+'a']:true,[appearanceKey]:{height:40,fontSize:18,border:1}},200);
 await set({[appearanceKey]:{height:88,fontSize:36,border:12}});
 const frames=await p.evaluate(()=>new Promise(resolve=>{const seen=[],start=performance.now();function frame(){const h=document.getElementById('marusin-thread-colors');if(h.style.display!=='none')seen.push([h.shadowRoot.querySelector('.bar').getBoundingClientRect().height,h.shadowRoot.querySelector('[name=fontSize]').value,h.shadowRoot.querySelector('[name=border]').value]);if(performance.now()-start>350)resolve(seen);else requestAnimationFrame(frame);}frame();}));
 assert.ok(frames.length);assert.ok(frames.every(v=>JSON.stringify(v)===JSON.stringify([88,'36','12'])));assert.equal(data[prefix+'a'],undefined);assert.deepEqual(writes,[appearanceKey]);
});
test('031 cross-tab defaults affect only unsaved chats and invalid values retain old defaults',async t=>{
 const {p,page,data,set}=await setup(t,{[display+'a']:true,[appearanceKey]:{height:'88',fontSize:null,border:-4,color:'#ffffff',textMode:'custom'}});await p.locator('.bar').waitFor();
 assert.equal(await p.locator('[name=height]').inputValue(),'56');assert.equal(await p.locator('[name=fontSize]').inputValue(),'26');assert.equal(await p.locator('[name=border]').inputValue(),'0');
 const q=await page('https://chatgpt.com/c/b');await ready(q);await toggle(q,'b',true);await q.locator('.bar').waitFor();await dimensionEdit(q,'fontSize',34);await p.waitForFunction(()=>document.getElementById('marusin-thread-colors').shadowRoot.querySelector('[name=fontSize]').value==='34');
 assert.equal(data[prefix+'a'],undefined);await set({[appearanceKey]:{height:70,fontSize:20,border:3}});assert.equal(await p.locator('[name=height]').inputValue(),'70');assert.equal(await q.locator('[name=fontSize]').inputValue(),'34');
});


test('032 shared auto/vivid survives custom mode, manual color and dimension changes',async t=>{
 const {p,page,data,writes}=await setup(t,{[display+'a']:true});await p.locator('.bar').waitFor();
 await p.locator('[data-mode=vivid]').evaluate(e=>e.click());await p.waitForTimeout(80);assert.equal(data[appearanceKey].textMode,'vivid');
 await p.locator('[data-mode=custom]').evaluate(e=>e.click());await dimensionEdit(p,'textColor','#abcdef');await dimensionEdit(p,'height',88);await p.waitForTimeout(100);
 assert.equal(data[appearanceKey].textMode,'vivid');assert.equal(data[appearanceKey].textColor,undefined);assert.equal(data[prefix+'a'].textColor,'#abcdef');
 const q=await page('https://chatgpt.com/c/b');await ready(q);await toggle(q,'b',true);await q.locator('.bar').waitFor();assert.equal(await q.locator('[data-mode=vivid]').getAttribute('aria-pressed'),'true');
 const count=writes.filter(k=>k===appearanceKey).length;await toggle(q,'b',false);await toggle(q,'b',true);assert.equal(writes.filter(k=>k===appearanceKey).length,count);
 await p.locator('[data-mode=auto]').evaluate(e=>e.click());await q.waitForFunction(()=>document.getElementById('marusin-thread-colors').shadowRoot.querySelector('[data-mode=auto]').getAttribute('aria-pressed')==='true');
 await p.locator('[data-mode=custom]').evaluate(e=>e.click());await p.waitForTimeout(80);assert.equal(data[appearanceKey].textMode,'auto');
});
test('032 saved manual color wins; hide button clears layout across tabs without changing settings',async t=>{
 const cfg={height:88,fontSize:30,border:8,textMode:'custom',textColor:'#123456',color:'#abcdef'};
 const {p,page,data,writes}=await setup(t,{[display+'a']:true,[prefix+'a']:cfg,[appearanceKey]:{height:40,fontSize:18,border:2,textMode:'vivid'}});
 const q=await page();await p.locator('.bar').waitFor();await q.locator('.bar').waitFor();assert.equal(await p.locator('[data-mode=custom]').getAttribute('aria-pressed'),'true');
 await p.setViewportSize({width:390,height:600});const geometry=await p.locator('.title').evaluate(e=>{const r=e.getBoundingClientRect(),b=e.getRootNode().querySelector('.hide-chat').getBoundingClientRect();return {center:r.x+r.width/2,screen:innerWidth/2,left:r.left,right:b.right,size:b.width};});assert.ok(Math.abs(geometry.center-geometry.screen)<1);assert.ok(geometry.left>=geometry.right);assert.ok(geometry.size>=40);
 await p.getByRole('button',{name:'このチャットの帯を非表示'}).focus();await p.getByRole('button',{name:'このチャットの帯を非表示'}).press('Enter');await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-thread-colors-active'));
 assert.equal(await shown(p),false);assert.equal(await shown(q),false);assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).transform),'none');assert.deepEqual(data[prefix+'a'],cfg);assert.deepEqual(writes,[display+'a']);
 await toggle(p,'a',true);await p.locator('.bar').waitFor();assert.equal(await p.locator('[name=height]').inputValue(),'88');assert.equal(await p.locator('.reset').textContent(),'見た目を初期設定に戻す');
});
