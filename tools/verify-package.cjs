const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'releases');
 const version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).version;
 const report=JSON.parse(fs.readFileSync(path.join(out,`package-${version}.json`),'utf8'));assert.equal(report.version,version);
 const dir=report.extractedDirectory;
 const policy=fs.readFileSync(path.join(root,'tools/tooltip-policy.js'),'utf8').replace(/\r\n/g,'\n').trimEnd();
 const embedded=policy.split('\n').map(line=>line?'  '+line:'').join('\n');
 assert.ok(fs.readFileSync(path.join(dir,'content.js'),'utf8').replace(/\r\n/g,'\n').includes(embedded));
 assert.equal(crypto.createHash('sha256').update(policy).digest('hex'),report.policySourceSha256);
 for(const f of report.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f.path))).digest('hex'),f.sha256);
 const ctx=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:[`--disable-extensions-except=${dir}`,`--load-extension=${dir}`]});
 const errors=[];
 try{
  await ctx.route('https://chatgpt.com/**',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'tests/fixtures/tooltip-fixed.html'),'utf8')+'<title>Package check - ChatGPT</title><nav><a href="/c/package-check">Package check</a></nav>'}));
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('https://chatgpt.com/c/package-check');
  await p.waitForSelector('#marusin-thread-colors',{state:'attached'});
  const management=await ctx.newPage();await management.goto('chrome://extensions');
  const item=()=>document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item');
  const details=await management.evaluate(()=>{
   const item=document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item');
   return {id:item.id,text:item.shadowRoot.textContent};
  });
  assert.ok(details.text.includes('Colors for ChatGPT (by marusin)'));assert.ok(details.text.includes(version));
  await management.waitForFunction(()=>{const s=document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item').shadowRoot;return [...s.querySelectorAll('img')].some(i=>i.complete&&i.naturalWidth>0);});
  await management.screenshot({path:path.join(out,`package-${version}-management.png`)});
  const popup=await ctx.newPage();popup.on('pageerror',e=>errors.push(e.message));await p.bringToFront();await popup.goto(`chrome-extension://${details.id}/popup.html`);
  await popup.waitForFunction(()=>!document.getElementById('individual').disabled);
  const m=await popup.evaluate(()=>chrome.runtime.getManifest());
  assert.equal(m.name,'Colors for ChatGPT (by marusin)');assert.equal(m.version,version);
  assert.equal(await popup.title(),m.name);assert.equal(await popup.locator('#app-version').textContent(),`ver ${version}`);
  assert.equal(await popup.locator('#individual').getAttribute('aria-checked'),'true');
  await p.locator('.bar').waitFor();assert.equal(await p.locator('.title').textContent(),'Package check');
  for(const source of ['more','folder']) {
   await p.bringToFront();await p.locator('#'+source).hover();
   await p.evaluate(source=>{
    const w=document.createElement('div');w.id='package-positioner';w.setAttribute('data-radix-popper-content-wrapper','');
    w.innerHTML='<div role="tooltip" id="package-tip" data-side="top">Tooltip</div>';document.getElementById('layer').append(w);
    document.getElementById(source).setAttribute('aria-describedby','package-tip');
   },source);
   await p.waitForFunction(source=>Math.abs(document.getElementById('package-tip').getBoundingClientRect().top-document.getElementById(source).getBoundingClientRect().bottom-6)<.1,source);
   await p.mouse.move(700,400);
   await p.waitForFunction(()=>document.getElementById('package-positioner').style.translate==='');
   await p.evaluate(source=>{document.getElementById('package-positioner').remove();document.getElementById(source).removeAttribute('aria-describedby');},source);
  }
  const icons=await popup.evaluate(async()=>{
   const paths=chrome.runtime.getManifest().icons;
   return Promise.all(Object.entries(paths).map(([size,file])=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve({size:Number(size),width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(Error('icon failed'));image.src=chrome.runtime.getURL(file);
   })));
  });
  for(const icon of icons)assert.equal(icon.size,icon.width),assert.equal(icon.size,icon.height);
  for(const locale of ['en','ja','ko','zh_CN','zh_TW','es','pt_BR']){
   await popup.locator('#language').selectOption(locale);await popup.waitForFunction(l=>ColorsI18n.locale===l,locale);
   assert.equal(await popup.locator('#app-version').textContent(),`ver ${version}`);
   assert.ok(await popup.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await popup.locator('#language').selectOption('ja');await popup.waitForFunction(()=>ColorsI18n.locale==='ja');
  await popup.screenshot({path:path.join(out,`package-${version}-popup.png`)});
  assert.deepEqual(await popup.evaluate(()=>chrome.permissions.getAll().then(p=>p.permissions)),['storage']);
  assert.deepEqual(errors,[]);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(report.archive)).digest('hex'),report.sha256);
  fs.writeFileSync(path.join(out,`package-${version}-browser-verification.json`),JSON.stringify({result:'PASS',version:m.version,name:m.name,sha256:report.sha256,loadedFrom:dir,chrome:ctx.browser()?.version()||'persistent Chromium',checks:['extracted sources match ZIP/source hashes','management name/version/icon','popup manifest version','all four runtime icons load','seven popup locales without horizontal overflow','real storage permission only','content script injected and banner enabled by popup','embedded shared tooltip policy matches source','packaged fixed button/folder placement and hover restoration'],pageErrors:errors,environment:'Playwright Chromium, unpacked extracted ZIP, mocked chatgpt.com page; not live ChatGPT'},null,2)+'\n');
  console.log('PASS: extracted ZIP loaded; name, version, management icon, four PNGs, popup in seven languages, content script and SHA-256 verified');
 }finally{await ctx.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
