const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
async function popup(t,options={}){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true});t.after(()=>browser.close());const p=await browser.newPage();
 await p.route('https://fixture/**',r=>{const name=new URL(r.request().url()).pathname.slice(1)||'popup.html';r.fulfill({contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(root,name),'utf8')});});
 await p.addInitScript(options=>{
  window.state={id:'a',ready:true,individual:false,...options};window.writes=[];window.tab=1;window.listeners=[];window.queries=0;window.globalValue=options.global!==false;
  window.chrome={i18n:{getMessage:()=> 'ja'},tabs:{query:async()=>{queries++;if(options.switchTab&&queries===2)tab=2;return [{id:tab}];},sendMessage:async(id,r)=>{if(r.type==='chat-colors:state')return {...state};if(options.delay)await new Promise(r=>setTimeout(r,options.delay));if(options.switchChat)state.id='b';if(r.id!==state.id)return {ok:false,error:'チャットが切り替わりました。'};writes.push({...r,tab:id});if(options.fail)return {ok:false,error:'保存できませんでした。'};state.individual=r.value;return {ok:true};}},storage:{local:{get:async()=>({'thread-colors:v1:enabled':globalValue}),set:async v=>{writes.push(v);if(options.delay)await new Promise(r=>setTimeout(r,options.delay));if(options.failGlobal)throw Error('fixture');globalValue=v['thread-colors:v1:enabled'];}},onChanged:{addListener:f=>listeners.push(f)}}};
 },options);await p.goto('https://fixture/popup.html');await p.waitForTimeout(100);return p;
}
test('029 popup enables once, allows OFF, keeps global OFF and exposes compact accessible UI',async t=>{
 const p=await popup(t,{global:false});assert.equal(await p.locator('#individual').isChecked(),true);assert.equal(await p.locator('#enabled').isChecked(),false);assert.equal(await p.locator('#chat-status').textContent(),'全体OFFのため非表示');
 assert.equal(await p.locator('h1').getAttribute('aria-label'),'Colors for ChatGPT');assert.equal(await p.locator('.brand-colors span').count(),6);assert.equal(await p.locator('h1').evaluate(e=>getComputedStyle(e).fontSize),'16px');
 const link=p.getByRole('link',{name:'marusin tools'});assert.equal(await link.getAttribute('href'),'https://chromewebstore.google.com/search/(by%20marusin)?hl=ja&authuser=0');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
 await p.getByRole('switch',{name:'このチャットで帯を表示'}).click();await p.waitForTimeout(700);assert.deepEqual(await p.evaluate(()=>writes.map(w=>w.value)),[true,false]);assert.equal(await p.locator('#individual').isChecked(),false);
 await p.screenshot({path:path.join(root,'tests/popup-029.png')});
});
for(const options of [{individual:true},{id:null},{switchChat:true},{switchTab:true},{fail:true}])test('029 popup safe opening '+JSON.stringify(options),async t=>{
 const p=await popup(t,options);await p.waitForTimeout(700);const writes=await p.evaluate(()=>window.writes);assert.equal(writes.length,options.fail?1:0);if(options.fail)assert.match(await p.locator('#status').textContent(),/保存できません/);
});
test('029 popup pins chat while loading and does not enable the next chat',async t=>{
 const p=await popup(t,{ready:false});await p.evaluate(()=>{state.id='b';state.ready=true;});await p.waitForTimeout(700);assert.deepEqual(await p.evaluate(()=>writes),[]);
});

for(const fail of [false,true])test('030 switches serialize delayed writes and show persisted state, failure='+fail,async t=>{
 const p=await popup(t,{individual:true,delay:200,fail,failGlobal:fail});
 for(const id of ['enabled','individual']){
  const button=p.locator('#'+id);assert.equal(await button.textContent(),'ON');
  await button.evaluate(e=>{e.click();e.click();e.click();});
  assert.equal(await button.isDisabled(),true);assert.equal(await button.getAttribute('aria-busy'),'true');assert.equal(await button.textContent(),'ON');
  await p.waitForFunction(id=>!document.getElementById(id).disabled,id);
  assert.equal(await button.textContent(),fail?'ON':'OFF');assert.equal(await button.getAttribute('aria-checked'),String(fail));
 }
 assert.equal(await p.evaluate(()=>writes.length),2);
 if(fail)assert.match(await p.locator('#status').textContent(),/保存できません/);
});
test('030 keyboard switches, blue focused link and compact bold brand',async t=>{
 const p=await popup(t,{individual:true});const button=p.getByRole('switch',{name:'拡張機能を有効にする'});
 await button.focus();await button.press('Space');await p.waitForFunction(()=>document.getElementById('enabled').textContent==='OFF');
 await button.press('Enter');await p.waitForFunction(()=>document.getElementById('enabled').textContent==='ON');
 const rect=await button.boundingBox();assert.ok(rect.width>=64&&rect.height>=44);
 assert.equal(await p.locator('.brand-colors').evaluate(e=>getComputedStyle(e).fontWeight),'800');
 assert.equal(await p.locator('.brand-suffix').evaluate(e=>getComputedStyle(e).fontWeight),'500');
 const link=p.getByRole('link');await link.focus();assert.equal(await link.evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');assert.equal(await link.evaluate(e=>getComputedStyle(e).color),'rgb(20, 89, 189)');
 await link.hover();assert.equal(await link.evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');
 await p.screenshot({path:path.join(root,'tests/popup-030.png'),clip:{x:0,y:0,width:316,height:270}});
});

test('030 stale polling reply cannot re-enable the switch during a save',async t=>{
 const p=await popup(t,{individual:true,delay:500});
 await p.evaluate(()=>{const send=chrome.tabs.sendMessage;let once=true;chrome.tabs.sendMessage=async(...args)=>{const result=await send(...args);if(args[1].type==='chat-colors:state'&&once){once=false;await new Promise(r=>setTimeout(r,250));}return result;};listeners.forEach(f=>f({},'local'));});
 await p.locator('#individual').click();await p.waitForTimeout(300);assert.equal(await p.locator('#individual').isDisabled(),true);
 await p.waitForFunction(()=>document.getElementById('individual').textContent==='OFF');assert.equal(await p.evaluate(()=>writes.length),1);
});
