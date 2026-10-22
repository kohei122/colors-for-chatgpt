const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
test('popup footer: seven languages, manifest version, alignment and link states',async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true});t.after(()=>browser.close());
 for(const lang of ['en','ja','ko','zh_CN','zh_TW','es','pt_BR']){
  const p=await browser.newPage({viewport:{width:316,height:400}});
  await p.route('https://fixture/**',r=>{const file=path.basename(new URL(r.request().url()).pathname);r.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(root,file),'utf8')});});
  await p.addInitScript(({lang,version})=>{window.chrome={runtime:{getManifest:()=>({version})},i18n:{getMessage:()=>lang},storage:{local:{get:async key=>({[key]:key.endsWith(':language')?lang:true}),set:async()=>{}},onChanged:{addListener(){}}},tabs:{query:async()=>[{id:1}],sendMessage:async()=>({id:'a',ready:true,individual:true})}};},{lang,version:manifest.version});
  await p.goto('https://fixture/popup.html');await p.waitForFunction(()=>!document.getElementById('enabled').disabled);
  const link=p.getByRole('link',{name:'marusin tools'});assert.equal(await p.locator('#app-version').textContent(),`ver ${manifest.version}`);
  const r=await p.locator('footer').evaluate(e=>{const a=e.querySelector('a').getBoundingClientRect(),b=e.querySelector('small').getBoundingClientRect(),f=e.getBoundingClientRect();return {gap:b.left-a.right,left:a.left-f.left,right:f.right-b.right,top:Math.abs(a.top-b.top),overflow:e.scrollWidth-e.clientWidth};});assert.ok(r.gap>0&&r.top<4);assert.equal(r.left,0);assert.equal(r.right,0);assert.ok(r.overflow<=0);
  assert.equal(await link.getAttribute('href'),'https://chromewebstore.google.com/search/(by%20marusin)?hl=ja&authuser=0');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert.equal(await link.evaluate(e=>getComputedStyle(e).color),'rgb(20, 89, 189)');
  await link.hover();assert.equal(await link.evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');await link.focus();assert.equal(await link.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  if(lang==='ja')await p.screenshot({path:path.join(root,'tests/popup-footer-033.png')});await p.close();
 }
});
