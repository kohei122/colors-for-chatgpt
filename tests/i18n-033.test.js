const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const langs=['en','ja','ko','zh_CN','zh_TW','es','pt_BR'];
const messages=Object.fromEntries(langs.map(l=>[l,JSON.parse(fs.readFileSync(path.join(root,'_locales',l,'messages.json'),'utf8'))]));
const sourceKey=s=>Object.keys(messages.ja).find(k=>messages.ja[k].message===s);
const translated=(l,s)=>messages[l][sourceKey(s)].message;
test('033 all seven dictionaries are complete, nonempty, match substitution tokens and generated bundle',()=>{
 const keys=Object.keys(messages.en).sort();const ctx={};vm.runInNewContext(fs.readFileSync(path.join(root,'i18n-data.js'),'utf8'),ctx);
 for(const l of langs){assert.deepEqual(Object.keys(messages[l]).sort(),keys);for(const k of keys){const s=messages[l][k].message;assert.ok(s.trim());assert.deepEqual(s.match(/\$\w+\$|\{\w+\}/g)||[],messages.en[k].message.match(/\$\w+\$|\{\w+\}/g)||[]);}assert.equal(JSON.stringify(ctx.ColorsMessages[l]),JSON.stringify(messages[l]));}
 const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));assert.equal(m.default_locale,'en');assert.equal(m.version,'1.0.0');assert.deepEqual(m.permissions,['storage']);
 const rows=fs.readFileSync(path.join(root,'translations.tsv'),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(r=>r.trim()).map(r=>r.split('|'));assert.ok(rows.every(r=>r.length===7&&r.every(s=>s.trim())));
});
async function setup(t,lang,auto='ja'){
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true});t.after(()=>b.close());const p=await b.newPage({viewport:{width:390,height:700}});
 await p.route('https://fixture/**',r=>{const file=path.basename(new URL(r.request().url()).pathname);return r.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(root,file),'utf8')});});
 await p.route('https://chatgpt.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ja"><meta charset=utf-8><title>保存しました - ChatGPT</title><style>body{margin:0}main{height:100dvh}nav a{display:inline-block;padding:10px}button{min-height:30px}</style><nav><div role=group><a href=/c/a><span class=truncate>保存しました</span></a><button aria-label="チャットのアクション" aria-haspopup=menu>…</button></div></nav><main><textarea></textarea></main>'}));
 await p.addInitScript(({lang,auto})=>{
  window.listeners=[];window.data={'thread-colors:v1:language':lang,'thread-colors:v1:display:a':true,'thread-colors:v1:a':{height:88,fontSize:26}};window.saves=0;
  window.chrome={runtime:{getManifest:()=>({version:'1.0.0'})},i18n:{getMessage:()=>auto},storage:{local:{get:async key=>({[key]:data[key]}),set:async values=>{Object.assign(data,values);const changes=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{newValue:v}]));listeners.forEach(f=>f(changes,'local'));}},onChanged:{addListener:f=>listeners.push(f)}},tabs:{query:async()=>[{id:1}],sendMessage:async()=>({id:'a',ready:true,individual:true})}};
 },{lang,auto});return p;
}
for(const lang of langs)test('033 '+lang+' popup, menu, editor, notifications, width and native Japanese rename',async t=>{
 const p=await setup(t,lang);await p.goto('https://fixture/popup.html');await p.waitForFunction(()=>!document.getElementById('enabled').disabled);
 assert.equal(await p.locator('#enabled-label').textContent(),translated(lang,'拡張機能を有効にする'));assert.equal(await p.locator('h1').getAttribute('aria-label'),'Colors for ChatGPT');
 const link=p.getByRole('link',{name:'marusin tools'});assert.equal(await link.getAttribute('href'),'https://chromewebstore.google.com/search/(by%20marusin)?hl=ja&authuser=0');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert.equal(await p.locator('small').textContent(),'ver 1.0.0');
 await link.focus();assert.equal(await link.evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.goto('https://chatgpt.com/c/a');
 await p.evaluate(()=>{
  const trigger=document.querySelector('nav button');trigger.id='dynamic-trigger';trigger.onclick=()=>{
   trigger.setAttribute('aria-controls','dynamic-menu');trigger.setAttribute('aria-expanded','true');const m=document.createElement('div');m.role='menu';m.id='dynamic-menu';m.setAttribute('aria-labelledby',trigger.id);m.dataset.overlayOwner='slate-sidebar';m.innerHTML='<button role="menuitem">名前を変更</button>';document.body.append(m);
   m.firstChild.onclick=()=>{m.remove();trigger.setAttribute('aria-expanded','false');const container=document.createElement('div');container.innerHTML='<div class="codex-dialog-overlay" data-state="open" aria-hidden="true" style="position:fixed;inset:0;background:#0008"></div><div role="dialog" aria-modal="true" data-state="open" style="position:fixed;top:200px;background:white;padding:20px"><h2>チャット名を変更</h2><form><input aria-label="チャットのタイトル"><button type="button">キャンセル</button><button type="submit">保存</button></form></div>';document.body.append(container);container.querySelector('input').value=document.querySelector('.truncate').textContent;
    container.querySelector('form').onsubmit=e=>{e.preventDefault();saves++;const v=container.querySelector('input').value;setTimeout(()=>{document.querySelector('.truncate').textContent=v;container.remove();},250);};container.querySelector('button[type=button]').onclick=()=>container.remove();};
  };
 });
 for(const file of ['i18n-data.js','i18n.js','core.js','content.js'])await p.addScriptTag({path:path.join(root,file)});
 await p.locator('.bar').waitFor();assert.equal(await p.locator('.title').textContent(),'保存しました');assert.equal(await p.locator('.hide-chat').getAttribute('aria-label'),translated(lang,'このチャットの帯を非表示'));
 await p.locator('.open').click();assert.equal(await p.locator('.reset').textContent(),translated(lang,'見た目を初期設定に戻す'));assert.equal(await p.locator('.other-extensions').textContent(),translated(lang,'Chrome拡張を見る'));
 assert.ok(await p.locator('.panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await p.locator('.usage summary').focus();await p.locator('.usage summary').press('Enter');assert.equal(await p.locator('.usage').evaluate(e=>e.open),true);
 await p.locator('.close').click();await p.locator('.title').click();assert.equal(await p.locator('.title-input').inputValue(),'保存しました');await p.locator('.title-input').fill('変更しない入力🙂');await p.locator('.cancel-title').click();assert.equal(await p.evaluate(()=>saves),0);
 await p.locator('.title').click();await p.locator('.title-input').fill('  ');await p.locator('.title-input').press('Enter');assert.equal(await p.locator('.rename-status').textContent(),'');assert.equal(await p.locator('.title-input').isVisible(),false);await p.locator('.title').click();
 await p.locator('.title-input').fill('User input 日本語🙂');await p.locator('.title-input').press('Enter');assert.equal(await p.locator('.rename-progress').textContent(),translated(lang,'更新中・・・'));
 await p.waitForFunction(()=>document.querySelector('.truncate').textContent==='User input 日本語🙂');await p.locator('.rename-success').filter({hasText:translated(lang,'チャット名を変更しました')}).waitFor();assert.equal(await p.evaluate(()=>saves),1);assert.equal(await p.locator('.title').textContent(),'User input 日本語🙂');
 await p.setViewportSize({width:320,height:450});await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:a':{height:40,fontSize:36}}));
 assert.ok(await p.locator('.open').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=40.5&&r.right<=innerWidth;}));
 await p.locator('.open').click();assert.ok(await p.locator('.panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await p.locator('.close').click();
 if(lang==='en'){
  await p.clock.install();
  await p.evaluate(()=>document.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();saves++;},true));
  await p.locator('.title').click();await p.locator('.title-input').fill('Unknown result');await p.locator('.title-input').press('Enter');await p.waitForFunction(()=>saves===2);
  await p.clock.runFor(11000);assert.equal(await p.locator('.rename-status').textContent(),'');assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await p.locator('.rename-progress').textContent(),'');
  assert.equal(await p.evaluate(()=>saves),2);assert.equal(await p.locator('[role=dialog]').evaluate(e=>getComputedStyle(e).opacity),'1');await p.locator('[role=dialog] button[type=button]').click();
 }
 // An English trigger mismatching native html lang=ja must fail silently and safely.
 await p.locator('nav button').evaluate(e=>e.setAttribute('aria-label','Chat actions'));
 await p.locator('.title').click();assert.equal(await p.locator('.rename-status').textContent(),'');assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await p.evaluate(()=>saves),lang==='en'?2:1);
 await p.screenshot({path:path.join(root,'tests/i18n-033-'+lang+'.png')});
});
test('033 language selection and unsupported locale fallback; no settings other than language change',async t=>{
 const p=await setup(t,'invalid','unsupported');await p.goto('https://fixture/popup.html');await p.waitForFunction(()=>!document.getElementById('enabled').disabled);assert.equal(await p.evaluate(()=>ColorsI18n.locale),'en');
 await p.locator('#language').selectOption('ko');await p.waitForFunction(()=>ColorsI18n.locale==='ko');assert.equal(await p.locator('#individual-label').textContent(),translated('ko','このチャットで帯を表示'));
 await p.locator('#language').selectOption('auto');await p.waitForFunction(()=>ColorsI18n.locale==='en');assert.equal(await p.evaluate(()=>data['thread-colors:v1:display:a']),true);
});

test('033 live language changes preserve user input and localize static and composing UI',async t=>{
 const p=await setup(t,'ja');await p.goto('https://chatgpt.com/c/a');for(const file of ['i18n-data.js','i18n.js','core.js','content.js'])await p.addScriptTag({path:path.join(root,file)});await p.locator('.bar').waitFor();await p.locator('.title').click();await p.locator('.title-input').fill('キャンセル');
 await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:language':'es'}));assert.equal(await p.locator('.title-input').inputValue(),'キャンセル');assert.equal(await p.locator('.cancel-title').textContent(),'Cancelar');assert.equal(await p.locator('#marusin-thread-colors').getAttribute('lang'),'es');assert.equal(await p.locator('.title').textContent(),'保存しました');
 await p.locator('.title-input').dispatchEvent('compositionstart');assert.equal(await p.locator('.composition-status').textContent(),'Componiendo');await p.locator('.title-input').dispatchEvent('keydown',{key:'Enter',isComposing:true,keyCode:229});assert.equal(await p.locator('.title-input').isVisible(),true);await p.locator('.cancel-title').click();assert.equal(await p.locator('.title').textContent(),'保存しました');
});
