const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'releases');
 const report=JSON.parse(fs.readFileSync(path.join(out,'package-1.0.0.json'),'utf8'));
 const dir=report.extractedDirectory;
 for(const f of report.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f.path))).digest('hex'),f.sha256);
 const ctx=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:[`--disable-extensions-except=${dir}`,`--load-extension=${dir}`]});
 const errors=[];
 try{
  await ctx.route('https://chatgpt.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ja"><meta charset="utf-8"><title>Package check - ChatGPT</title><nav><a href="/c/package-check">Package check</a></nav><main><textarea></textarea></main></html>'}));
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('https://chatgpt.com/c/package-check');
  await p.waitForSelector('#marusin-thread-colors',{state:'attached'});
  const management=await ctx.newPage();await management.goto('chrome://extensions');
  const item=()=>document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item');
  const details=await management.evaluate(()=>{
   const item=document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item');
   return {id:item.id,text:item.shadowRoot.textContent};
  });
  assert.ok(details.text.includes('Colors for ChatGPT (by marusin)'));assert.ok(details.text.includes('1.0.0'));
  await management.waitForFunction(()=>{const s=document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item').shadowRoot;return [...s.querySelectorAll('img')].some(i=>i.complete&&i.naturalWidth>0);});
  await management.screenshot({path:path.join(out,'package-management.png')});
  const popup=await ctx.newPage();popup.on('pageerror',e=>errors.push(e.message));await p.bringToFront();await popup.goto(`chrome-extension://${details.id}/popup.html`);
  await popup.waitForFunction(()=>!document.getElementById('individual').disabled);
  const m=await popup.evaluate(()=>chrome.runtime.getManifest());
  assert.equal(m.name,'Colors for ChatGPT (by marusin)');assert.equal(m.version,'1.0.0');
  assert.equal(await popup.title(),m.name);assert.equal(await popup.locator('#app-version').textContent(),'ver 1.0.0');
  assert.equal(await popup.locator('#individual').getAttribute('aria-checked'),'true');
  await p.locator('.bar').waitFor();assert.equal(await p.locator('.title').textContent(),'Package check');
  const icons=await popup.evaluate(async()=>{
   const paths=chrome.runtime.getManifest().icons;
   return Promise.all(Object.entries(paths).map(([size,file])=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve({size:Number(size),width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(Error('icon failed'));image.src=chrome.runtime.getURL(file);
   })));
  });
  for(const icon of icons)assert.equal(icon.size,icon.width),assert.equal(icon.size,icon.height);
  for(const locale of ['en','ja','ko','zh_CN','zh_TW','es','pt_BR']){
   await popup.locator('#language').selectOption(locale);await popup.waitForFunction(l=>ColorsI18n.locale===l,locale);
   assert.equal(await popup.locator('#app-version').textContent(),'ver 1.0.0');
   assert.ok(await popup.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await popup.locator('#language').selectOption('ja');await popup.waitForFunction(()=>ColorsI18n.locale==='ja');
  await popup.screenshot({path:path.join(out,'package-popup.png')});
  assert.deepEqual(await popup.evaluate(()=>chrome.permissions.getAll().then(p=>p.permissions)),['storage']);
  assert.deepEqual(errors,[]);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(report.archive)).digest('hex'),report.sha256);
  fs.writeFileSync(path.join(out,'package-browser-verification.json'),JSON.stringify({result:'PASS',version:m.version,name:m.name,sha256:report.sha256,loadedFrom:dir,chrome:ctx.browser()?.version()||'persistent Chromium',checks:['extracted sources match ZIP/source hashes','management name/version/icon','popup manifest version','all four runtime icons load','seven popup locales without horizontal overflow','real storage permission only','content script injected and banner enabled by popup'],pageErrors:errors,environment:'Playwright Chromium, unpacked extracted ZIP, mocked chatgpt.com page; not live ChatGPT'},null,2)+'\n');
  console.log('PASS: extracted ZIP loaded; name, version, management icon, four PNGs, popup in seven languages, content script and SHA-256 verified');
 }finally{await ctx.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
