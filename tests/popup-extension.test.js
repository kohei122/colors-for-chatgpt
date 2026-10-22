const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');const {chromium}=require('playwright');
test('025 actual extension popup uses only storage permission and targets active tab',async t=>{
 const root=path.resolve(__dirname,'..');
 const ctx=await chromium.launchPersistentContext('',{executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`]});t.after(()=>ctx.close());
 await ctx.route('https://chatgpt.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Example - ChatGPT</title><nav><a href="/c/example">Example</a></nav><main><textarea></textarea></main>'}));
 const p=await ctx.newPage();await p.goto('https://chatgpt.com/c/example');
 await p.waitForSelector('#marusin-thread-colors',{state:'attached'});
 // Resolve the real extension ID through chrome://extensions, without a service worker.
 const management=await ctx.newPage();await management.goto('chrome://extensions');
 const extensionId=await management.evaluate(()=>document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item').id);
 // A real action popup does not replace the active page tab. Keep that tab active before popup initialization.
 const popup=await ctx.newPage();await p.bringToFront();await popup.goto(`chrome-extension://${extensionId}/popup.html`);
 await popup.waitForFunction(()=>!document.getElementById('individual').disabled);
 assert.equal(await popup.evaluate(()=>chrome.runtime.getManifest().version),'1.0.0');assert.equal(await popup.locator('#app-version').textContent(),'ver 1.0.0');
 assert.equal(await popup.locator('h1').textContent(),'Colors for ChatGPT');assert.equal(await popup.locator('#individual').isChecked(),true);
 await p.waitForSelector('#marusin-thread-colors',{state:'visible'});
 assert.equal(await popup.evaluate(()=>chrome.permissions.getAll().then(p=>p.permissions.join(','))),'storage');
 await popup.evaluate(async()=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});await chrome.tabs.setZoom(tab.id,2);});
 const geometry=await p.locator('.title').evaluate(e=>{const r=e.getBoundingClientRect();return {center:r.x+r.width/2,screen:innerWidth/2,ratio:devicePixelRatio};});
 assert.ok(Math.abs(geometry.center-geometry.screen)<1);assert.equal(geometry.ratio,2);
 await popup.evaluate(async()=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});await chrome.tabs.setZoom(tab.id,1);});
 await popup.locator('#enabled').evaluate(e=>e.click());
 await p.waitForSelector('#marusin-thread-colors',{state:'hidden'});assert.equal(await popup.locator('#individual').isChecked(),true);
 await p.evaluate(()=>history.pushState({},'', '/'));await popup.waitForFunction(()=>document.getElementById('individual').disabled);
 assert.match(await popup.locator('#chat-status').textContent(),/新規チャット|new chat screen/);
});
test('025 browser restart retains individual preference and original color settings',async t=>{
 const fs=require('node:fs'),os=require('node:os');
 const temp=path.resolve(os.tmpdir()),profile=fs.mkdtempSync(path.join(temp,'ctc-025-'));
 const root=path.resolve(__dirname,'..');let ctx;
 t.after(async()=>{if(ctx)await ctx.close();if(path.dirname(path.resolve(profile))!==temp||!path.basename(profile).startsWith('ctc-025-'))throw Error('Unexpected temporary profile');fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});});
 async function launch(){ctx=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`]});await ctx.route('https://chatgpt.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Example - ChatGPT</title><a href="/c/example">Example</a>'}));return ctx.newPage();}
 let p=await launch();await p.goto('chrome://extensions');
 const extensionId=await p.evaluate(()=>document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item').id);
 await p.goto(`chrome-extension://${extensionId}/popup.html`);
 await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:display:example':true,'thread-colors:v1:example':{color:'#123456',height:88,fontSize:34,border:9}}));
 await ctx.close();ctx=null;p=await launch();await p.goto('https://chatgpt.com/c/example');await p.locator('.bar').waitFor();
 assert.equal(await p.locator('#marusin-thread-colors').evaluate(e=>e.style.getPropertyValue('--color')),'#123456');
 assert.equal(await p.locator('.bar').evaluate(e=>e.getBoundingClientRect().height),88);
});
