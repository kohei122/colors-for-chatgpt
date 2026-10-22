const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require('playwright');
const prefix='thread-colors:v1:';
const root=path.resolve(__dirname,'..');
const fixture=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>サンプルA開発 - ChatGPT</title><style>*{box-sizing:border-box}body{margin:0}.h-dvh{height:100dvh;display:flex}nav{width:260px;flex:none;background:#f4f5f7;padding:20px}nav a{display:block;margin:12px 0}main{flex:1;display:flex;flex-direction:column;min-width:0}header{padding:20px;border-bottom:1px solid #ddd}.messages{overflow:auto;flex:1;padding:40px}textarea{margin:20px;height:80px;resize:none}</style></head><body><div id="root" class="h-dvh"><nav><strong>ChatGPT</strong><a href="/c/thread-a"><span class="truncate">サンプルA開発</span></a><a href="/g/g-p-project/c/thread-b"><span class="truncate">サンプルB開発</span></a></nav><main><header>チャット</header><div class="messages"><p>作業用のサンプル会話です。</p></div><textarea aria-label="プロンプト">入力内容は保持されます</textarea></main></div></body></html>`;
async function setup(t,{getDelay=0,setDelay=0,fail=false,extensionLanguage=null,html=fixture}={}) {
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox'],headless:true});
  t.after(()=>browser.close());
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const data=extensionLanguage?{[prefix+'language']:extensionLanguage}:{};let failure=fail;const reads=[];
  await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:html}));
  await context.exposeBinding('__testGet',async (_, key)=>{
    const value=structuredClone(data[key]);reads.push(key);
    if(getDelay) await new Promise(r=>setTimeout(r,getDelay));
    return {[key]:key.startsWith(prefix+"display:")?true:value};
  });
  await context.exposeBinding('__testSet',async (_, values)=>{
    if(setDelay) await new Promise(r=>setTimeout(r,setDelay));
    if(failure) throw Error('Test write failure');
    for(const [key,value] of Object.entries(values)) {
      const oldValue=data[key];data[key]=value;
      for(const p of context.pages()) await p.evaluate(({key,oldValue,value})=>window.__listeners.forEach(f=>f({[key]:{oldValue,newValue:value}},'local')),{key,oldValue,value});
    }
  });
  await context.addInitScript(()=>{
    window.__listeners=[];
    window.chrome={storage:{local:{get:key=>window.__testGet(key),set:v=>window.__testSet(v)},onChanged:{addListener:f=>window.__listeners.push(f)}}};
  });
  async function page(url='https://chatgpt.com/c/thread-a') {
    const p=await context.newPage();await p.goto(url);
    await p.addScriptTag({path:path.join(root,'core.js')});if(extensionLanguage){await p.addScriptTag({path:path.join(root,'i18n-data.js')});await p.addScriptTag({path:path.join(root,'i18n.js')});}await p.addScriptTag({path:path.join(root,'content.js')});return p;
  }
  const p=await page();
  const bar=p.locator('#marusin-thread-colors .bar');
  await bar.waitFor({state:'visible'});
  return {p,bar,data,page,reads,setFailure:v=>failure=v};
}
async function color(p,value) {
  await p.locator('#marusin-thread-colors .open').click();
  await p.locator(`#marusin-thread-colors button[data-color="${value}"]`).click();
}
async function until(p,fn) {await p.waitForFunction(fn);}
test('banner, frame and reserved space; input survives; duplicate initialization is rejected',async t=>{
  const {p,bar}=await setup(t);
  assert.equal(await p.locator('#marusin-thread-colors .title').textContent(),'サンプルA開発');
  assert.equal(await bar.evaluate(el=>el.getBoundingClientRect().height),56);
  assert.equal(await p.locator('header').evaluate(el=>el.getBoundingClientRect().top),56);
  assert.ok(await p.locator('textarea').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
  assert.equal(await p.locator('textarea').inputValue(),'入力内容は保持されます');
  await p.addScriptTag({path:path.join(root,'content.js')});assert.equal(await p.locator('#marusin-thread-colors').count(),1);
  await p.locator('textarea').focus();await p.keyboard.press('Enter');assert.match(await p.locator('textarea').inputValue(),/\n/);
});
test('colors survive thread switching and page reload, with independent per-thread keys',async t=>{
  const {p,data}=await setup(t);await color(p,'#15803d');
  await until(p,()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.status').textContent==='保存しました');
  await p.evaluate(()=>history.pushState({},'', '/g/g-p-project/c/thread-b'));
  await p.locator('#marusin-thread-colors .title').filter({hasText:'サンプルB開発'}).waitFor();
  await color(p,'#be123c');await p.waitForTimeout(100);
  assert.equal(data[prefix+'thread-a'].color,'#15803d');assert.equal(data[prefix+'thread-b'].color,'#be123c');
  await p.evaluate(()=>history.pushState({},'', '/c/thread-a'));
  await until(p,()=>document.querySelector('#marusin-thread-colors').style.getPropertyValue('--color')==='#15803d');
  await p.reload();await p.addScriptTag({path:path.join(root,'core.js')});await p.addScriptTag({path:path.join(root,'content.js')});
  await until(p,()=>document.querySelector('#marusin-thread-colors').style.getPropertyValue('--color')==='#15803d');
});
test('cross-tab storage updates change another open copy of the same thread',async t=>{
  const {p,page}=await setup(t);const second=await page();await color(p,'#c2410c');
  await until(second,()=>document.querySelector('#marusin-thread-colors').style.getPropertyValue('--color')==='#c2410c');
});
test('new chat hides the widget and removes its layout reservation',async t=>{
  const {p,data}=await setup(t);await p.evaluate(()=>history.pushState({},'', '/'));
  await p.locator('#marusin-thread-colors').waitFor({state:'hidden'});
  assert.equal(await p.locator('html').getAttribute('data-thread-colors-active'),null);
  assert.equal(Object.keys(data).length,0);
});
test('stale titles are never reused for an unknown thread; title changes are observed',async t=>{
  const {p}=await setup(t);await p.evaluate(()=>history.pushState({},'', '/c/thread-unknown'));
  await p.locator('#marusin-thread-colors .title').filter({hasText:'チャット名を確認中'}).waitFor();
  await p.evaluate(()=>document.title='新しい開発チャット - ChatGPT');
  await p.locator('#marusin-thread-colors .title').filter({hasText:'新しい開発チャット'}).waitFor();
});
test('a title updated in the same navigation is accepted without needing a sidebar entry',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>{history.pushState({},'', '/c/thread-new');document.title='同時に更新された名前 - ChatGPT';});
  await p.locator('#marusin-thread-colors .title').filter({hasText:'同時に更新された名前'}).waitFor();
});
test('returning to a thread during a pending write retains the newest local color',async t=>{
  const {p}=await setup(t,{setDelay:2000});await color(p,'#15803d');
  await p.evaluate(()=>history.pushState({},'', '/g/g-p-project/c/thread-b'));
  await p.locator('#marusin-thread-colors .title').filter({hasText:'サンプルB開発'}).waitFor();
  await p.evaluate(()=>history.pushState({},'', '/c/thread-a'));
  await p.locator('#marusin-thread-colors .title').filter({hasText:'サンプルA開発'}).waitFor();
  await until(p,()=>document.querySelector('#marusin-thread-colors').style.getPropertyValue('--color')==='#15803d');
});
test('delayed storage reads cannot overwrite a color chosen immediately after navigation',async t=>{
  const {p,data}=await setup(t,{getDelay:900});await color(p,'#7e22ce');await p.waitForTimeout(1000);
  assert.equal(data[prefix+'thread-a'].color,'#7e22ce');
  assert.equal(await p.locator('#marusin-thread-colors').evaluate(el=>el.style.getPropertyValue('--color')),'#7e22ce');
});
test('queued writes retain their original thread identity during navigation',async t=>{
  const {p,data}=await setup(t,{setDelay:1100});await color(p,'#15803d');
  await p.locator('#marusin-thread-colors button[data-color="#7e22ce"]').click();
  await p.evaluate(()=>history.pushState({},'', '/g/g-p-project/c/thread-b'));
  await p.locator('#marusin-thread-colors .title').filter({hasText:'サンプルB開発'}).waitFor();
  await p.waitForTimeout(2500);
  assert.equal(data[prefix+'thread-a'].color,'#7e22ce');assert.equal(data[prefix+'thread-b'],undefined);
});
test('save failures are visible and do not pretend that the setting was saved',async t=>{
  const {p,data,setFailure}=await setup(t,{fail:true});await color(p,'#be123c');
  await p.locator('#marusin-thread-colors .status').filter({hasText:'保存できませんでした'}).waitFor();
  assert.equal(data[prefix+'thread-a'],undefined);
  setFailure(false);await p.locator('#marusin-thread-colors button[data-color="#15803d"]').click();
  await p.locator('#marusin-thread-colors .status').filter({hasText:'保存しました'}).waitFor();
});
test('global disable removes all layout effects and re-enable restores the thread',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:enabled':false}));
  await p.locator('#marusin-thread-colors').waitFor({state:'hidden'});
  assert.equal(await p.locator('header').evaluate(el=>el.getBoundingClientRect().top),0);
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:enabled':true}));
  await p.locator('#marusin-thread-colors .bar').waitFor({state:'visible'});
});
test('narrow viewport retains title, controls, input and on-screen settings panel',async t=>{
  const {p}=await setup(t);await p.setViewportSize({width:390,height:844});
  await p.addStyleTag({content:'nav{display:none}'});await p.locator('#marusin-thread-colors .open').click();
  const rect=await p.locator('#marusin-thread-colors .panel').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=390);
  await p.keyboard.press('Escape');await p.locator('#marusin-thread-colors .panel').waitFor({state:'hidden'});
});

async function input(p,name,value) {
  await p.locator(`#marusin-thread-colors [name="${name}"]`).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
}
async function saved(p) {await p.locator('#marusin-thread-colors .status').filter({hasText:'保存しました'}).waitFor();}
test('new modes persist, sync, recalculate and reset with old settings preserved',async t=>{
  const {p,page,data}=await setup(t);
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:thread-a':{color:'#123456',height:74,fontSize:32,border:10}}));
  const second=await page();
  await p.locator('#marusin-thread-colors .open').click();
  await p.locator('[data-mode="vivid"]').click(); await saved(p);
  assert.equal(data[prefix+'thread-a'].height,74);
  for(const bg of ['#ffffff','#000000','#ffaaaa']) {
    await input(p,'color',bg);await saved(p);
    assert.ok(await p.evaluate(()=>{const h=document.querySelector('#marusin-thread-colors');return ThreadColorsCore.contrast(h.style.getPropertyValue('--color'),h.style.getPropertyValue('--fg'))>=4.5;}));
  }
  await input(p,'textColor','#112233');await input(p,'color','#abcdef');await saved(p);
  await until(second,()=>document.querySelector('#marusin-thread-colors').style.getPropertyValue('--fg')==='#112233');
  assert.equal(data[prefix+'thread-a'].textMode,'custom');assert.equal(data[prefix+'thread-a'].alignment,'left');
  await p.reload();await p.addScriptTag({path:path.join(root,'core.js')});await p.addScriptTag({path:path.join(root,'content.js')});
  await until(p,()=>document.querySelector('#marusin-thread-colors').style.getPropertyValue('--alignment')==='center');
  await p.locator('#marusin-thread-colors .open').click();await p.locator('[data-mode="auto"]').click();await saved(p);
  assert.equal(data[prefix+'thread-a'].textMode,'auto');
  await p.locator('#marusin-thread-colors .reset').click();await saved(p);
  assert.deepEqual(data[prefix+'thread-a'],require('../core').settings(null,'thread-a'));
});
test('all alignments remain centered geometrically and avoid controls at narrow widths',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>document.querySelector('nav .truncate').textContent='長いチャット名'.repeat(60));
  await until(p,()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title').textContent.length>100);
  await p.locator('#marusin-thread-colors .open').click();
  for(const width of [1280,390,240]) {
    await p.setViewportSize({width,height:700});
    for(const align of ['left','center','right']) {
      await p.evaluate(alignment=>chrome.storage.local.set({'thread-colors:v1:thread-a':{alignment,color:'#abcdef',height:56}}),align);
      assert.equal(await p.locator('[data-align]').count(),0);
      const r=await p.locator('#marusin-thread-colors .title').evaluate(el=>{
        const t=el.getBoundingClientRect(),b=el.getRootNode().querySelector('.open').getBoundingClientRect();
        return {center:t.x+t.width/2,right:t.right,button:b.left,align:getComputedStyle(el).textAlign,clipped:el.scrollWidth>el.clientWidth,title:el.title};
      });
      assert.equal(r.center,width/2);assert.ok(r.right<=r.button);assert.equal(r.align,'center');assert.ok(r.clipped);assert.ok(r.title.length>100);
    }
  }
  assert.equal(await p.locator('.full-title').count(),0);assert.equal(await p.locator('summary').filter({hasText:'タイトル全文'}).count(),0);
});
test('fixed sidebar/header/composer follow height and restore exactly when disabled',async t=>{
  const {p}=await setup(t);
  await p.addStyleTag({content:'nav{position:fixed;inset:0 auto 0 0;overflow:auto}main{margin-left:260px}header{position:fixed;top:0;left:260px}textarea{position:fixed;bottom:0;left:260px}'});
  await p.locator('#marusin-thread-colors .open').click();
  for(const h of [40,88,56]) {
    await input(p,'height',String(h));
    for(const selector of ['nav','header']) assert.equal(await p.locator(selector).evaluate(e=>e.getBoundingClientRect().top),h);
    assert.ok(await p.locator('textarea').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
    assert.equal(await p.locator('#root').evaluate(e=>e.getBoundingClientRect().height),900-h);
  }
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:enabled':false}));
  assert.equal(await p.locator('nav').evaluate(e=>e.getBoundingClientRect().top),0);
  assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).transform),'none');
  assert.equal(await p.locator('#root').evaluate(e=>e.getBoundingClientRect().height),900);
});
test('editing during a delayed legacy read preserves untouched fields',async t=>{
  const {p,data,page}=await setup(t,{getDelay:800});
  data[prefix+'thread-a']={color:'#123456',height:80,fontSize:34,border:9};
  const second=await page();await second.locator('#marusin-thread-colors .open').click();await second.locator('[data-mode="vivid"]').click();await saved(second);
  assert.equal(data[prefix+'thread-a'].height,80);assert.equal(data[prefix+'thread-a'].color,'#123456');assert.equal(data[prefix+'thread-a'].textMode,'vivid');
});
test('navigation before polling cannot save previous controls into either thread',async t=>{
  const {p,data}=await setup(t);await p.locator('#marusin-thread-colors .open').click();
  await p.evaluate(()=>{history.pushState({},'', '/c/thread-b');document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('[data-mode="vivid"]').click();});
  await p.waitForTimeout(700);assert.deepEqual(data,{});
});

test('scroll area and unrelated viewport-height descendants retain their own sizing',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>{document.querySelector('.messages').innerHTML='<div style="height:3000px">long conversation</div>';const x=document.createElement('div');x.className='h-dvh';x.id='unrelated';document.querySelector('.messages').append(x);});
  await p.locator('.messages').evaluate(el=>{el.scrollTop=400;});
  assert.equal(await p.locator('.messages').evaluate(el=>el.scrollTop),400);
  assert.equal(await p.locator('#unrelated').evaluate(el=>el.getBoundingClientRect().height),900);
  await p.locator('textarea').fill('入力欄を操作できます');
  assert.equal(await p.locator('textarea').inputValue(),'入力欄を操作できます');
});
test('a storage update wins over an older pending read',async t=>{
  const {p}=await setup(t,{getDelay:800});
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:thread-a':{color:'#ffeeaa',textMode:'custom',textColor:'#123456',alignment:'center'}}));
  await p.waitForTimeout(1000);
  assert.equal(await p.locator('#marusin-thread-colors').evaluate(el=>el.style.getPropertyValue('--fg')),'#123456');
  assert.equal(await p.locator('#marusin-thread-colors').evaluate(el=>el.style.getPropertyValue('--alignment')),'center');
});

async function modal(p,id='viewer',attrs={role:'dialog','aria-modal':'true'}) {
  await p.evaluate(({id,attrs})=>{
    const el=document.createElement('div');el.id=id;
    for(const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
    el.style.cssText='position:fixed;inset:0;background:white;z-index:1000';
    el.innerHTML='<button style="position:absolute;top:4px;right:12px;height:32px">Download</button>';
    el.querySelector('button').onclick=()=>window.downloadClicked=true;
    document.body.append(el);
  },{id,attrs});
  await p.locator('#marusin-thread-colors').waitFor({state:'hidden'});
}
async function removeModal(p,id='viewer') {
  await p.locator('#'+id).evaluate(el=>el.remove());
}
test('modal hides banner frame and settings, releases layout and restores saved appearance without writes',async t=>{
  const {p,data}=await setup(t);
  const cfg={color:'#abcdef',textMode:'custom',textColor:'#123456',alignment:'center',height:88,fontSize:34,border:10};
  await p.evaluate(cfg=>chrome.storage.local.set({'thread-colors:v1:thread-a':cfg}),cfg);
  await p.locator('#marusin-thread-colors .open').click();
  const before=structuredClone(data);
  await modal(p);
  for(const selector of ['.bar','.frame','.panel']) assert.equal(await p.locator('#marusin-thread-colors '+selector).isVisible(),false);
  assert.equal(await p.locator('html').getAttribute('data-thread-colors-active'),null);
  assert.equal(await p.locator('#viewer').evaluate(e=>e.getBoundingClientRect().top),0);
  assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).transform),'none');
  await p.locator('#viewer button').click(); assert.equal(await p.evaluate(()=>window.downloadClicked),true);
  await removeModal(p);await p.locator('#marusin-thread-colors .bar').waitFor();
  const style=await p.locator('#marusin-thread-colors').evaluate(e=>Object.fromEntries(['color','fg','alignment','height','font','border'].map(k=>[k,e.style.getPropertyValue('--'+k)])));
  assert.deepEqual(style,{color:'#abcdef',fg:'#123456',alignment:'center',height:'88px',font:'34px',border:'10px'});
  assert.equal(await p.locator('header').evaluate(e=>e.getBoundingClientRect().top),88);
  assert.equal(await p.locator('#marusin-thread-colors .panel').isVisible(),false);
  assert.deepEqual(data,before);
});
test('nested modals wait for every visible modal, including a hidden retained dialog',async t=>{
  const {p}=await setup(t);await modal(p,'one');await modal(p,'two',{role:'alertdialog','aria-modal':'true'});
  await removeModal(p,'two');await p.waitForTimeout(100);
  assert.equal(await p.locator('#marusin-thread-colors').isVisible(),false);
  await p.locator('#one').evaluate(el=>el.hidden=true);await p.locator('#marusin-thread-colors .bar').waitFor();
  await p.locator('#one').evaluate(el=>el.hidden=false);await p.locator('#marusin-thread-colors').waitFor({state:'hidden'});
  await removeModal(p,'one');await p.locator('#marusin-thread-colors .bar').waitFor();
});
test('hidden ancestors opacity offscreen and ordinary menus or side panels do not suppress',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>{
    document.body.insertAdjacentHTML('beforeend',`<div role="menu" style="position:fixed;inset:0">Menu</div><aside role="dialog" style="position:fixed;inset:0 0 0 auto;width:250px">Panel</aside><dialog>Closed</dialog>`);
    for(const css of ['display:none','visibility:hidden','opacity:0','content-visibility:hidden','position:fixed;left:-2000px;top:0;width:100px']) {
      const wrapper=document.createElement('div');wrapper.style.cssText=css;
      wrapper.innerHTML='<div role="dialog" aria-modal="true" style="width:100px;height:100px">Hidden</div>';document.body.append(wrapper);
    }
    const wrapper=document.createElement('div');wrapper.setAttribute('aria-hidden','true');wrapper.innerHTML='<div role="dialog" aria-modal="true">Hidden</div>';document.body.append(wrapper);
  });
  await p.waitForTimeout(750);assert.equal(await p.locator('#marusin-thread-colors .bar').isVisible(),true);
  await p.locator('#marusin-thread-colors .open').click();await p.waitForTimeout(750);
  assert.equal(await p.locator('#marusin-thread-colors .panel').isVisible(),true);
});
test('native modal and unlabelled full-screen dialog are detected but non-modal dialog is not',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>{const d=document.createElement('dialog');d.id='native';d.textContent='Native';document.body.append(d);d.show();});
  await p.waitForTimeout(100);assert.equal(await p.locator('#marusin-thread-colors .bar').isVisible(),true);
  await p.evaluate(()=>{const d=document.querySelector('#native');d.close();d.showModal();});
  await p.locator('#marusin-thread-colors').waitFor({state:'hidden'});
  await p.evaluate(()=>document.querySelector('#native').close());await p.locator('#marusin-thread-colors .bar').waitFor();
  await modal(p,'fallback',{role:'dialog'});await removeModal(p,'fallback');await p.locator('#marusin-thread-colors .bar').waitFor();
});
test('modal navigation restores the current thread and global off remains off',async t=>{
  const {p,data}=await setup(t);
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:thread-b':{color:'#eeccaa',textMode:'vivid',alignment:'right',height:74,fontSize:32,border:8}}));
  await modal(p);await p.evaluate(()=>history.pushState({},'', '/c/thread-b'));
  await until(p,()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title').textContent==='サンプルB開発');
  await removeModal(p);await p.locator('#marusin-thread-colors .bar').waitFor();
  assert.equal(await p.locator('#marusin-thread-colors').evaluate(e=>e.style.getPropertyValue('--color')),'#eeccaa');
  assert.equal(await p.locator('header').evaluate(e=>e.getBoundingClientRect().top),74);
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:enabled':false}));
  await modal(p);await removeModal(p);await p.waitForTimeout(750);
  assert.equal(await p.locator('#marusin-thread-colors').isVisible(),false);assert.equal(data[prefix+'enabled'],false);
  assert.equal(await p.locator('header').evaluate(e=>e.getBoundingClientRect().top),0);
});
test('modal round trip preserves conversation scroll at middle and bottom plus input and dimensions',async t=>{
  const {p}=await setup(t);
  await p.locator('.messages').evaluate(el=>el.innerHTML='<div style="height:4000px">Conversation</div>');
  for(const height of [40,88]) {
    await p.locator('#marusin-thread-colors .open').click();await input(p,'height',String(height));await p.locator('#marusin-thread-colors .close').click();
    for(const y of [500,100000]) {
      await p.locator('.messages').evaluate((el,y)=>el.scrollTop=y,y);
      const before=await p.locator('.messages').evaluate(el=>({scroll:el.scrollTop,height:el.clientHeight}));
      await modal(p);await removeModal(p);await p.locator('#marusin-thread-colors .bar').waitFor();
      const after=await p.locator('.messages').evaluate(el=>({scroll:el.scrollTop,height:el.clientHeight}));
      assert.deepEqual(after,before);
      assert.ok(await p.locator('textarea').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
      assert.equal(await p.locator('textarea').inputValue(),'入力内容は保持されます');
    }
  }
});
test('modal closing by page Escape remains owned by page and DOM updates do not loop',async t=>{
  const {p}=await setup(t);await modal(p);
  await p.evaluate(()=>{
    window.layoutMutations=0;
    new MutationObserver(r=>window.layoutMutations+=r.length).observe(document.documentElement,{attributes:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){window.pageEscape=true;document.querySelector('#viewer').remove();}},{once:true});
  });
  await p.keyboard.press('Escape');await p.locator('#marusin-thread-colors .bar').waitFor();
  await p.waitForTimeout(750);assert.equal(await p.evaluate(()=>window.pageEscape),true);
  assert.ok(await p.evaluate(()=>window.layoutMutations<10));
});

const nestedFixture=`<!doctype html><html lang="ja"><head><title>Nested - ChatGPT</title><style>
*{box-sizing:border-box}html,body{margin:0;overflow:hidden}#root{height:100dvh;overflow:hidden}.shell{height:100dvh;min-height:100dvh;display:flex;overflow:hidden}.conversation{height:100vh;min-height:100vh;display:flex;flex:1;min-width:0;flex-direction:column;overflow:hidden}nav{width:120px;flex:none;overflow:auto}nav div{height:2500px}header{height:36px;flex:none}.messages{flex:1;min-height:0;overflow:auto}.messages div{height:4000px}form{flex:none;padding:8px;display:flex;align-items:end;gap:8px}textarea{height:64px;max-height:160px;min-width:0;flex:1}button{height:36px;width:60px}
</style></head><body><div id="root"><div class="shell"><nav><a href="/c/thread-a">Nested</a><div>Sidebar</div></nav><main class="conversation"><header>Conversation</header><div class="messages"><div>Long conversation</div></div><form onsubmit="event.preventDefault();window.sent=true"><textarea id="prompt-textarea" aria-label="プロンプト"></textarea><button type="submit" id="send">送信</button></form></main></div></div></body></html>`;
async function checkComposer(p) {
  for(const sel of ['#prompt-textarea','#send']) {
    const r=await p.locator(sel).evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:innerWidth,h:innerHeight,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
    assert.ok(r.top>=0&&r.bottom<=r.h&&r.left>=0&&r.right<=r.w,`${sel} clipped ${JSON.stringify(r)}`);assert.ok(r.hit,`${sel} covered`);
    await p.locator(sel).click();
  }
  assert.equal(await p.evaluate(()=>window.sent),true);
}
test('nested viewport shells keep composer and send button visible through resize and multiline input',async t=>{
  const {p}=await setup(t,{html:nestedFixture});
  for(const viewport of [{width:1280,height:900},{width:640,height:450},{width:390,height:600}]) {
    await p.setViewportSize(viewport);
    for(const height of [40,88]) {
      await p.locator('#marusin-thread-colors .open').click();await input(p,'height',String(height));await p.locator('#marusin-thread-colors .close').click();
      for(const multiline of [false,true]) {
        await p.locator('#prompt-textarea').evaluate((e,m)=>{e.style.height=m?'160px':'64px';e.value=m?'複数行\n入力\n確認':'入力';},multiline);
        await checkComposer(p);
        await p.locator('.messages').evaluate(e=>e.scrollTop=100000);await checkComposer(p);
        await p.locator('nav').evaluate(e=>e.scrollTop=300);assert.equal(await p.locator('nav').evaluate(e=>e.scrollTop),300);
      }
    }
  }
});
test('nested viewport shells restore after modals and off/on without moving composer DOM',async t=>{
  const {p}=await setup(t,{html:nestedFixture});
  await p.evaluate(()=>window.originalComposer=document.querySelector('#prompt-textarea'));
  await checkComposer(p);await modal(p);await removeModal(p);await p.locator('#marusin-thread-colors .bar').waitFor();await checkComposer(p);
  for(const enabled of [false,true]) {
    await p.evaluate(enabled=>chrome.storage.local.set({'thread-colors:v1:enabled':enabled}),enabled);await checkComposer(p);
    assert.equal(await p.evaluate(()=>window.originalComposer===document.querySelector('#prompt-textarea')),true);
  }
});

test('nested conversation bottom stays stable across settings and modal round trip',async t=>{
  const {p}=await setup(t,{html:nestedFixture});
  await p.locator('.messages').evaluate(e=>e.scrollTop=100000);
  const before=await p.locator('.messages').evaluate(e=>e.scrollTop);
  await p.locator('#marusin-thread-colors .open').click();await p.locator('#marusin-thread-colors .close').click();
  await p.waitForTimeout(750);assert.equal(await p.locator('.messages').evaluate(e=>e.scrollTop),before);
  await modal(p);await removeModal(p);await p.locator('#marusin-thread-colors .bar').waitFor();
  await p.waitForTimeout(750);assert.equal(await p.locator('.messages').evaluate(e=>e.scrollTop),before);await checkComposer(p);
});
test('replaced nested conversation shell is corrected without affecting message descendants',async t=>{
  const {p}=await setup(t,{html:nestedFixture});
  await p.evaluate(()=>{
    const main=document.querySelector('main');main.replaceWith(main.cloneNode(true));
    const unrelated=document.createElement('div');unrelated.className='h-dvh';unrelated.style.height='100dvh';unrelated.id='message-viewport';document.querySelector('.messages').append(unrelated);
  });
  await until(p,()=>document.querySelector('main').hasAttribute('data-thread-colors-height-shell'));
  await checkComposer(p);
  assert.equal(await p.locator('#message-viewport').evaluate(e=>e.getBoundingClientRect().height),900);
});

test('contenteditable composer grows within the nested shell and remains clickable',async t=>{
  const html=nestedFixture.replace('<textarea id="prompt-textarea" aria-label="プロンプト"></textarea>', '<div id="prompt-textarea" contenteditable="true" role="textbox" aria-label="プロンプト" style="flex:1;min-width:0;min-height:64px;max-height:160px;overflow:auto"></div>');
  const {p}=await setup(t,{html});await p.setViewportSize({width:640,height:450});
  await p.locator('#prompt-textarea').fill(Array.from({length:20},(_,i)=>'日本語の入力 '+i).join('\n'));
  await checkComposer(p);
  assert.match(await p.locator('#prompt-textarea').textContent(),/日本語の入力/);
  await modal(p);await removeModal(p);await p.locator('#marusin-thread-colors .bar').waitFor();await checkComposer(p);
});

async function renameFixture(p,{locale="ja",delay=0,missing=false,ambiguous=false,badAssociation=false,opacityAncestor=false,mode="save",nativeDelay=0}={}) {
  await p.evaluate(options=>{
    const nativeText=value=>options.locale==='en'?value.replaceAll('チャットのアクション','Chat actions').replaceAll('名前を変更','Rename').replaceAll('チャット名を変更','Rename chat').replaceAll('チャットのタイトル','Chat title').replaceAll('タイトルを追加…','Add a title…').replaceAll('キャンセル','Cancel').replaceAll('保存','Save'):value;
    window.renameClicks=[];window.nativeSaves=0;window.renameOptions=options;
    const nav=document.querySelector('nav');nav.innerHTML='';
    for(const id of ['thread-b','thread-a']) {
      const row=document.createElement('div');row.setAttribute('role','presentation');
      row.innerHTML=`<a href="/c/${id}"><span class="truncate">${id==='thread-a'?'サンプルA開発':'サンプルB開発'}</span></a><button aria-label="チャットのアクション" aria-haspopup="menu" aria-expanded="false">…</button>`;
      row.innerHTML=nativeText(row.innerHTML);
      const button=row.querySelector('button');button.id='dynamic-button-'+id+'-'+Math.random().toString(36).slice(2);
      button.onclick=()=>{
        window.renameClicks.push(id);
        if(options.missing)return;
        setTimeout(()=>{
          const menu=document.createElement('div');menu.id='dynamic-menu-'+Math.random().toString(36).slice(2);menu.setAttribute('role','menu');menu.dataset.overlayOwner='slate-sidebar';menu.setAttribute('aria-labelledby',options.badAssociation?'wrong':button.id);button.setAttribute('aria-controls',menu.id);button.setAttribute('aria-expanded','true');
          menu.style.cssText='position:fixed;top:120px;left:300px;background:white;z-index:2000';
          menu.innerHTML='<button role="menuitem">削除</button><button role="menuitem">名前を変更</button>';
          menu.innerHTML=nativeText(menu.innerHTML);
          menu.firstChild.onclick=()=>window.wrongAction=true;
          menu.lastChild.onclick=()=>{
            window.menuThread=id;menu.remove();button.setAttribute('aria-expanded','false');
            const d=document.createElement('section');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.style.cssText='position:fixed;inset:0;background:white;z-index:2000';
            d.innerHTML='<h2>チャット名を変更</h2><form><input aria-label="チャットのタイトル" placeholder="タイトルを追加…"><button type="button">キャンセル</button><button type="submit">保存</button></form>';
            d.innerHTML=nativeText(d.innerHTML);
            d.querySelector('input').value=options.mode==='mismatch'?'別のタイトル':row.querySelector('.truncate').textContent;
            window.nativeInputState=d.querySelector('input').value;
            d.querySelector('input').addEventListener('input',e=>window.nativeInputState=e.target.value);
            d.querySelector('button[type="button"]').onclick=()=>d.remove();
            d.querySelector('form').onsubmit=e=>{e.preventDefault();window.nativeSaves++;
              window.hiddenDuringSave=document.querySelector('#marusin-thread-colors').style.display==='none';
              if(options.mode==='navigate'){history.pushState({},'', '/c/thread-b');d.remove();return;}
              if(options.mode==='stay')return;
              setTimeout(()=>{if(options.mode!=='unknown')row.querySelector('.truncate').textContent=window.nativeInputState;d.remove();},options.nativeDelay);
            };
            document.body.append(d);
          };document.body.append(menu);
        },options.delay);
      };
      if(options.opacityAncestor){
        row.setAttribute('role','group');const wrap=document.createElement('div');
        wrap.className='opacity-0 group-focus-visible:opacity-100 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 has-[[data-state=open]]:opacity-100';
        wrap.style.opacity='0';button.replaceWith(wrap);wrap.append(button);
      }
      nav.append(row);
      if(options.ambiguous&&id==='thread-a'){const duplicate=row.cloneNode(true);duplicate.querySelector('button').onclick=()=>window.wrongAction=true;nav.append(duplicate);}
    }
  },{locale,delay,missing,ambiguous,badAssociation,opacityAncestor,mode,nativeDelay});
}
test('unrelated animations and unchanged settings do not remeasure layout ancestors',async t=>{
  const {p}=await setup(t,{html:nestedFixture});
  await p.waitForTimeout(200);
  await p.evaluate(()=>{window.shellReads=0;const original=window.getComputedStyle;window.getComputedStyle=function(el,...args){if(el.matches('main,.shell,#root,form'))window.shellReads++;return original.call(this,el,...args);};});
  await p.evaluate(()=>{for(let i=0;i<30;i++){const e=document.createElement('span');e.className='message-piece';document.querySelector('.messages').append(e);e.dispatchEvent(new Event('animationend',{bubbles:true}));}});
  await p.locator('#marusin-thread-colors .open').click();await p.waitForTimeout(750);
  assert.equal(await p.evaluate(()=>window.shellReads),0);await p.locator('#marusin-thread-colors .close').click();await checkComposer(p);
});

// The 0.1.4/0.1.5 rename scenarios below are adapted to explicit inline Save.
async function diagnosedPointerRow(p) {
  await renameFixture(p,{opacityAncestor:true});
  await p.evaluate(()=>{
    const row=document.querySelector('nav').lastChild;
    row.style.pointerEvents='none';
    row.querySelector('a').style.pointerEvents='auto';
    row.querySelector('button').style.pointerEvents='auto';
  });
}
for(const openMenu of [false,true]) test(`diagnosed none parent and auto button saves once, existing menu=${openMenu}`,async t=>{
  const {p}=await setup(t);await diagnosedPointerRow(p);
  if(openMenu){await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').click());await p.locator('[role="menu"]').waitFor();}
  await editName(p);await commitName(p);await nameConfirmed(p);
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),['thread-a']);
  assert.equal(await p.evaluate(()=>window.menuThread),'thread-a');
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.evaluate(()=>window.hiddenDuringSave),true);
  assert.equal(await p.evaluate(()=>window.wrongAction),undefined);
  assert.deepEqual(await p.evaluate(()=>{const r=document.querySelector('nav').lastChild;return [r.style.pointerEvents,getComputedStyle(r).pointerEvents,getComputedStyle(r.querySelector('button')).pointerEvents,r.querySelector('button').parentElement.style.opacity];}),['none','none','auto','0']);
});
for(const child of ['svg','span']) test(`hit on button ${child} descendant permits native save`,async t=>{
  const {p}=await setup(t);await diagnosedPointerRow(p);
  const hit=await p.evaluate(child=>{
    const b=document.querySelector('nav').lastChild.querySelector('button');
    b.style.cssText='pointer-events:auto;width:32px;height:32px;padding:0;border:0';
    b.innerHTML=child==='svg'?'<svg width="32" height="32"><rect width="32" height="32" /></svg>':'<span style="display:block;width:32px;height:32px">X</span>';
    const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2).localName;
  },child);
  assert.equal(hit,child==='svg'?'rect':'span');
  await editName(p);await commitName(p);await nameConfirmed(p);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('button pointer-events none rejects even if its child accepts hits',async t=>{
  const {p}=await setup(t);await diagnosedPointerRow(p);
  await p.evaluate(()=>{const b=document.querySelector('nav').lastChild.querySelector('button');b.style.pointerEvents='none';b.innerHTML='<span style="pointer-events:auto">X</span>';});
  await p.locator('.title').click();
  assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.equal(await p.locator('.title-input').isVisible(),false);
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});
for(const editing of [false,true]) test(`unrelated overlay prevents action, editing=${editing}`,async t=>{
  const {p}=await setup(t);await diagnosedPointerRow(p);
  if(editing)await editName(p);
  await p.evaluate(()=>{
    const b=document.querySelector('nav').lastChild.querySelector('button'),r=b.getBoundingClientRect(),cover=document.createElement('div');
    cover.id='action-cover';cover.style.cssText=`position:fixed;left:${r.left}px;top:${r.top-document.body.getBoundingClientRect().top}px;width:${r.width}px;height:${r.height}px;z-index:9999;background:white`;
    document.body.append(cover);
  });
  if(editing)await commitName(p);else await p.locator('.title').click();
  await waitRenameFailure(p);
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await p.locator('#action-cover').evaluate(e=>e.remove());
  await editName(p);
  await commitName(p);await nameConfirmed(p);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('rename observes ready menu before its next paint and records intermediate dialog frames',async t=>{
  const {p}=await setup(t);await renameFixture(p,{nativeDelay:180});
  await p.evaluate(()=>{
    window.renameFrames=[];window.readyMenuPaints=[];window.layoutChanges=[];
    new MutationObserver(records=>{for(const r of records)if(r.attributeName==='data-thread-colors-active')window.layoutChanges.push(document.documentElement.hasAttribute(r.attributeName));}).observe(document.documentElement,{attributes:true});
    const seen=new WeakSet();
    new MutationObserver(()=>{
      const m=document.querySelector('[role="menu"]');
      if(m&&!seen.has(m)){seen.add(m);requestAnimationFrame(()=>window.readyMenuPaints.push(m.isConnected));}
    }).observe(document.body,{subtree:true,childList:true});
    window.traceRunning=true;
    function frame(){
      const d=document.querySelector('[role="dialog"]'),host=document.querySelector('#marusin-thread-colors');
      window.renameFrames.push({dialog:Boolean(d),opacity:d?getComputedStyle(d).opacity:null,host:host.style.display,layout:document.documentElement.hasAttribute('data-thread-colors-active'),saves:window.nativeSaves});
      if(window.traceRunning)requestAnimationFrame(frame);
    }requestAnimationFrame(frame);
  });
  await editName(p);await commitName(p);await nameConfirmed(p);
  await p.locator('.bar').waitFor();await p.evaluate(()=>window.traceRunning=false);
  const trace=await p.evaluate(()=>({frames:window.renameFrames,menus:window.readyMenuPaints,changes:window.layoutChanges}));
  assert.deepEqual(trace.menus,[false]); // Ready menu handled before the next animation frame, not 100ms later.
  const during=trace.frames.filter(f=>f.dialog&&f.saves===1);
  assert.ok(during.length>=2);assert.ok(during.every(f=>f.opacity==='1'&&f.host==='none'&&!f.layout));
  assert.deepEqual(trace.changes,[false,true]); // One retreat/restore, no repeated layout toggling.
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('delayed native Save readiness is awaited after input state commits',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>{
    document.body.addEventListener('input',e=>{
      if(!e.target.closest('[role="dialog"]'))return;
      const submit=e.target.form.querySelector('[type="submit"]');submit.disabled=true;window.readyToSave=false;
      setTimeout(()=>{window.readyToSave=true;submit.disabled=false;},120);
    });
    document.body.addEventListener('submit',()=>window.submittedWhileReady=window.readyToSave,true);
  });
  await editName(p);await commitName(p);await nameConfirmed(p);
  assert.equal(await p.evaluate(()=>window.submittedWhileReady),true);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('manual rename and timeout dialog remain visible and operable',async t=>{
  const {p}=await setup(t);await renameFixture(p,{mode:'stay'});
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').click());
  await p.locator('[role="menuitem"]').filter({hasText:'名前を変更'}).click();
  const dialog=p.locator('[role="dialog"]');await dialog.waitFor();await p.locator('.bar').waitFor({state:'hidden'});
  const original=await dialog.getAttribute('style');
  assert.equal(await dialog.evaluate(d=>getComputedStyle(d).opacity),'1');
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
  await editName(p);await commitName(p);await dialog.waitFor();
  await waitRenameFailure(p);
  assert.equal(await dialog.getAttribute('style'),original);assert.equal(await dialog.isVisible(),true);
  assert.notEqual(await p.locator('.title').getAttribute('aria-busy'),'true');
  assert.equal(await p.locator('.title-input').evaluate(e=>e.hidden),true);
  assert.equal(await p.locator('.rename-progress').textContent(),'');
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('navigation during native readiness wait aborts and leaves visible dialog for user',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>document.body.addEventListener('input',e=>{
    if(!e.target.closest('[role="dialog"]'))return;
    e.target.form.querySelector('[type="submit"]').disabled=true;
    setTimeout(()=>history.pushState({},'', '/c/thread-b'),30);
  }));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  assert.equal(await p.locator('[role="dialog"]').evaluate(d=>getComputedStyle(d).opacity),'1');
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
  assert.equal(await p.locator('.title').textContent(),'サンプルB開発');
});
async function pairedDialogFixture(p,options={}) {
  await renameFixture(p,{nativeDelay:180,...options});
  await p.evaluate(options=>{
    window.quietFrames=[];window.pairHistory=[];window.exitFrames=[];
    if(options.preexistingOverlay){const e=document.createElement('div');e.className='codex-dialog-overlay';e.hidden=true;document.body.append(e);window.oldOverlay=e;}
    const seen=new WeakSet();
    const observer=new MutationObserver(()=>{
      for(const d of document.querySelectorAll('[role="dialog"]')){
        if(seen.has(d))continue;seen.add(d);
        const parent=document.createElement('div'),overlay=window.oldOverlay||document.createElement('div');overlay.hidden=false;
        overlay.className='codex-dialog-overlay';overlay.dataset.state='open';
        if(options.overlayAriaHidden)overlay.setAttribute('aria-hidden','true');
        overlay.style.cssText='position:fixed;inset:0;background:#0008;opacity:0.9;transition:opacity 1s';
        if(options.overlayDisplayNone)overlay.style.display='none';
        d.before(parent);parent.append(overlay,d);
        if(options.duplicateOverlay)parent.prepend(overlay.cloneNode());
        if(options.wrongParent)document.body.append(overlay);
        window.pairHistory.push({d,overlay,parent});
        function frame(){
          if(!d.isConnected){if(overlay.isConnected){window.exitFrames.push(getComputedStyle(overlay).opacity);requestAnimationFrame(frame);}return;}
          window.quietFrames.push({dialog:getComputedStyle(d).opacity,overlay:getComputedStyle(overlay).opacity,host:document.querySelector('#marusin-thread-colors').style.display,layout:document.documentElement.hasAttribute('data-thread-colors-active'),composer:document.querySelector('textarea').getBoundingClientRect().bottom});
          requestAnimationFrame(frame);
        }requestAnimationFrame(frame);
      }
      for(const pair of window.pairHistory)if(!pair.d.isConnected&&!pair.exiting){pair.exiting=true;if(options.exitDelay)setTimeout(()=>pair.parent.remove(),options.exitDelay);else pair.parent.remove();}
    });observer.observe(document.body,{subtree:true,childList:true});
  },options);
}
test('verified new dialog and sibling overlay are suppressed before every sampled paint while saving once',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p);
  const bottom=await p.locator('textarea').evaluate(e=>e.getBoundingClientRect().bottom);
  await editName(p);await commitName(p);await nameConfirmed(p);
  const frames=await p.evaluate(()=>window.quietFrames);assert.ok(frames.length>=2);
  assert.ok(frames.every(f=>f.dialog==='0'&&f.overlay==='0'&&f.host==='block'&&f.layout&&f.composer===bottom));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),['thread-a']);
  assert.deepEqual(await p.evaluate(()=>window.pairHistory.map(({d,overlay})=>[d.style.opacity,overlay.style.opacity,overlay.style.transition])),[['','0.9','opacity 1s']]);
});
test('late backdrop exit remains suppressed after dialog removal until native close completes',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{exitDelay:180});
  await editName(p);await commitName(p);await nameConfirmed(p);
  const frames=await p.evaluate(()=>window.exitFrames);assert.ok(frames.length>=2);assert.ok(frames.every(v=>v==='0'));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.locator('.codex-dialog-overlay').count(),0);
});
test('manual paired rename is never suppressed and cancel remains clickable',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p);
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').click());
  await p.locator('[role="menuitem"]').filter({hasText:'名前を変更'}).click();
  await p.waitForFunction(()=>window.quietFrames.length>=2);
  assert.ok((await p.evaluate(()=>window.quietFrames)).every(f=>f.dialog==='1'&&f.overlay==='0.9'));
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
});
for(const invalid of ['duplicateOverlay','wrongParent','preexistingOverlay'])test(`uncertain background pairing is not suppressed: ${invalid}`,async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{[invalid]:true});
  await editName(p);await commitName(p);await nameConfirmed(p);
  assert.ok((await p.evaluate(()=>window.quietFrames)).every(f=>f.dialog==='1'&&f.overlay==='0.9'));
});
test('suppressed dialog timeout restores visible native controls and original styles without resending',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{mode:'stay'});
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>window.quietFrames.some(f=>f.dialog==='0'));
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.locator('[role="dialog"]').evaluate(d=>getComputedStyle(d).opacity),'1');
  assert.equal(await p.locator('.codex-dialog-overlay').evaluate(e=>e.style.opacity),'0.9');
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);assert.equal(await p.locator('.title-input').isVisible(),false);
});
test('navigation restores suppressed pair before further native save',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p);
  await p.evaluate(()=>document.body.addEventListener('input',e=>{
    if(!e.target.closest('[role="dialog"]'))return;
    e.target.form.querySelector('[type="submit"]').disabled=true;
    setTimeout(()=>history.pushState({},'', '/c/thread-b'),60);
  }));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>window.quietFrames.some(f=>f.dialog==='0'));
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  assert.equal(await p.locator('[role="dialog"]').evaluate(d=>getComputedStyle(d).opacity),'1');
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
});
test('another modal during suppression reveals the pair and aborts without saving',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p);
  await p.evaluate(()=>document.body.addEventListener('input',e=>{
    if(!e.target.closest('[role="dialog"]'))return;
    e.target.form.querySelector('[type="submit"]').disabled=true;
    setTimeout(()=>{const other=document.createElement('div');other.id='other-modal';other.setAttribute('role','alertdialog');other.setAttribute('aria-modal','true');other.style.cssText='position:fixed;inset:0;background:white;z-index:9000';document.body.append(other);},60);
  }));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>document.querySelector('#other-modal')&&[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  assert.equal(await p.locator('[role="dialog"]').evaluate(d=>getComputedStyle(d).opacity),'1');
  assert.equal(await p.locator('#other-modal').evaluate(d=>getComputedStyle(d).opacity),'1');
  await p.locator('#other-modal').evaluate(e=>e.remove());await p.locator('[role="dialog"] button[type="button"]').click();
  await p.locator('.bar').waitFor();
});
for(const mode of ['sync','delayed-replacement','document-title'])test(`name confirmation uses live page evidence: ${mode}`,async t=>{
  const {p}=await setup(t);await renameFixture(p,{mode:'stay'});
  await p.evaluate(mode=>document.body.addEventListener('submit',()=>{
    const update=()=>{
      const row=document.querySelector('nav').lastChild;
      if(mode==='document-title')document.title=window.nativeInputState+' - ChatGPT';
      else {
        const a=row.querySelector('a').cloneNode(true);a.querySelector('.truncate').textContent=window.nativeInputState;
        row.replaceChildren(a); // New link, no action button: name confirmation must not require a trigger.
      }
      document.querySelector('[role="dialog"]').remove();
    };
    if(mode==='delayed-replacement')setTimeout(update,160);else update();
  }),mode);
  await editName(p);await commitName(p);await nameConfirmed(p);
  const report=await p.locator('#marusin-thread-colors').evaluate(e=>JSON.parse(e.getAttribute('data-rename-diagnostic')));
  assert.ok(report.events.some(e=>e.kind==='name-check'&&e.expectedMatch&&e.idMatch));
  if(mode==='delayed-replacement')assert.ok(report.events.some(e=>e.replaced));
  assert.ok(!JSON.stringify(report).includes('新しい名前'));assert.ok(!JSON.stringify(report).includes('サンプルA開発'));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('IME commit Enter is ignored and next independent Enter confirms',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p);
  await p.locator('.title-input').evaluate(e=>{
    e.dispatchEvent(new CompositionEvent('compositionstart'));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}));
    e.dispatchEvent(new CompositionEvent('compositionend'));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));e.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true}));
  });
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);await p.waitForTimeout(100);
  await commitName(p);await nameConfirmed(p);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('outside pointer click confirms but composition-ending click does not',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p);
  await p.locator('.title-input').evaluate(e=>e.dispatchEvent(new CompositionEvent('compositionstart')));
  await p.locator('textarea').click();
  await p.locator('.title-input').evaluate(e=>e.dispatchEvent(new CompositionEvent('compositionend')));
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await p.waitForTimeout(100);await p.locator('textarea').click();await nameConfirmed(p);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('Tab and cancel blur do not save; outside click and Enter race saves once',async t=>{
  const {p}=await setup(t);await renameFixture(p,{delay:200});await editName(p);
  await p.locator('.title-input').press('Tab');assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await p.locator('.title-input').focus();assert.equal(await p.locator('.title-input').inputValue(),'新しい名前');
  await p.locator('.cancel-title').click();assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
  assert.equal(await p.locator('.save-title').count(),0);
  await editName(p);await commitName(p);await p.locator('textarea').click();await nameConfirmed(p);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('unchanged and blank edits never invoke native save; normal page Enter remains untouched',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p,'サンプルA開発');await commitName(p);
  assert.equal(await p.locator('.title-input').isVisible(),false);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
  await editName(p,'   ');await commitName(p);assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await p.locator('textarea').fill('text');await p.locator('textarea').press('Enter');assert.equal(await p.locator('textarea').inputValue(),'text\n');
});
test('clicking another chat never confirms the old edit',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p);
  await p.evaluate(()=>document.querySelector('nav a[href="/c/thread-b"]').addEventListener('click',e=>{e.preventDefault();history.pushState({},'', '/c/thread-b');}));
  await p.locator('nav a[href="/c/thread-b"]').click();await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});
test('confirmed page name and native close timeout are reported separately',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{mode:'stay'});
  await p.evaluate(()=>document.body.addEventListener('submit',()=>document.querySelector('nav').lastChild.querySelector('.truncate').textContent=window.nativeInputState));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.locator('.rename-status').textContent(),'');
  const report=await p.locator('#marusin-thread-colors').evaluate(e=>JSON.parse(e.getAttribute('data-rename-diagnostic')));
  assert.ok(report.events.some(e=>e.kind==='failure'&&e.confirmed));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
});
for(const outside of [false,true])test(`unchanged or restored original ends silently without native UI, outside=${outside}`,async t=>{
  const {p}=await setup(t);await renameFixture(p);
  for(const revert of [false,true]) {
    await editName(p,'サンプルA開発');
    if(revert){await p.locator('.title-input').fill('途中の変更');await p.locator('.title-input').fill('サンプルA開発');}
    if(outside)await p.locator('textarea').click();else await commitName(p);
    assert.equal(await p.locator('.title-input').isVisible(),false);
    assert.equal(await p.locator('.rename-notice').isVisible(),false);
    assert.equal(await p.locator('.rename-status').textContent(),'');
    assert.equal(await p.locator('.rename-success').textContent(),'');
    assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
  }
});
test('title click and keyboard Enter or Space begin edit without pencil',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  assert.equal(await p.locator('.rename').count(),0);
  const title=p.getByRole('button',{name:'チャット名を編集',exact:true});
  for(const key of ['click','Enter',' ']) {
    if(key==='click')await title.click();else{await title.focus();await title.press(key);}
    assert.equal(await p.locator('.title-input').isVisible(),true);
    await p.locator('.cancel-title').click();
  }
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
});
test('editor matches title font and value width, stays centered and caps long IME text',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  const title=await p.locator('.title').evaluate(e=>({width:e.getBoundingClientRect().width,font:getComputedStyle(e).font,fontSize:getComputedStyle(e).fontSize}));
  await p.locator('.title').click();
  const initial=await p.locator('.title-input').evaluate(e=>({width:e.getBoundingClientRect().width,font:getComputedStyle(e).font,fontSize:getComputedStyle(e).fontSize}));
  assert.equal(initial.font,title.font);assert.equal(initial.fontSize,title.fontSize);
  assert.ok(initial.width>=title.width+18&&initial.width<title.width+20);
  const widths=[];
  for(const value of ['','i','WWWW','日本語あいうえお','👨‍👩‍👧‍👦🙂日本語ABC']) {
    await p.locator('.title-input').fill(value);await p.waitForTimeout(40);
    const r=await p.locator('.title-input').evaluate(e=>({width:e.getBoundingClientRect().width,center:e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,mirror:e.getRootNode().querySelector('.title-measure').getBoundingClientRect().width}));
    assert.equal(r.center,640);assert.equal(r.width,Math.max(48,Math.ceil(r.mirror)+18));widths.push(r.width);
  }
  assert.ok(widths[3]>widths[2]);
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:thread-a':{fontSize:34,height:56}}));
  await p.waitForFunction(()=>getComputedStyle(document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-input')).fontSize==='34px');
  await p.waitForTimeout(40);
  assert.equal(await p.locator('.title-input').evaluate(e=>e.getBoundingClientRect().width),await p.locator('.title-measure').evaluate(e=>Math.ceil(e.getBoundingClientRect().width)+18));
  await p.locator('.title-input').evaluate(e=>{e.dispatchEvent(new CompositionEvent('compositionstart'));e.value='変換中🙂'.repeat(100);e.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});
  await p.waitForTimeout(40);
  for(const width of [1280,390,240]) {
    await p.setViewportSize({width,height:700});
    const r=await p.locator('.title-input').evaluate(e=>{const b=e.getBoundingClientRect(),c=e.getRootNode().querySelector('.cancel-title').getBoundingClientRect();return {center:b.x+b.width/2,right:b.right,left:b.left,cancel:c.left,scroll:e.scrollWidth,client:e.clientWidth};});
    assert.equal(r.center,width/2);assert.ok(r.left>=0&&r.right<r.cancel,JSON.stringify({width,...r}));assert.ok(r.scroll>r.client);
  }
  await p.locator('.title-input').evaluate(e=>e.dispatchEvent(new CompositionEvent('compositionend')));
  await p.locator('.title-input').press('Home');await p.locator('.title-input').press('End');await p.waitForFunction(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-input').scrollLeft>0);
  await p.locator('.cancel-title').click();
});
test('value measurement is idle outside edits and only repeats for relevant changes',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>{const e=document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-measure'),read=e.getBoundingClientRect.bind(e);window.widthReads=0;e.getBoundingClientRect=()=>{window.widthReads++;return read();};});
  await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>window.widthReads),0);
  await editName(p);await p.waitForTimeout(50);const before=await p.evaluate(()=>window.widthReads);assert.ok(before>0);
  await p.evaluate(()=>{for(let i=0;i<20;i++)document.querySelector('.messages').append(document.createElement('span'));});
  await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>window.widthReads),before);
  await p.locator('.title-input').fill('異なる幅');await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>window.widthReads),before+1);
  await p.locator('.cancel-title').click();await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>window.widthReads),before+1);
});
async function commitName(p) {await p.locator('.title-input').press('Enter');}
async function editName(p,name='新しい名前',viaTitle=false) {
  await p.locator(viaTitle?'#marusin-thread-colors .title':'#marusin-thread-colors .title').click();
  await p.locator('.title-input').fill(name);
}
async function nameConfirmed(p,name='新しい名前') {
  await p.locator('.rename-success').filter({hasText:'チャット名を変更しました'}).waitFor();
  assert.equal(await p.locator('#marusin-thread-colors .title').textContent(),name);
  assert.equal(await p.locator('.title-input').isVisible(),false);
}

test('success toast expires, restarts for next rename and clears on chat switch',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await editName(p);await commitName(p);await nameConfirmed(p);
  assert.equal(await p.locator('.rename-notice').isVisible(),false);
  assert.equal(await p.locator('.rename-success').getAttribute('aria-live'),'polite');
  assert.equal(await p.locator('.rename-success button').count(),0);
  await p.waitForTimeout(3200);assert.equal(await p.locator('.rename-success').textContent(),'');
  await editName(p,'次の名前');await commitName(p);await nameConfirmed(p,'次の名前');
  await p.waitForTimeout(1800);
  await editName(p,'最後の名前');await commitName(p);await nameConfirmed(p,'最後の名前');
  await p.waitForTimeout(1500);assert.equal(await p.locator('.rename-success').isVisible(),true);
  await p.evaluate(()=>history.pushState({},'', '/c/thread-b'));
  await p.waitForFunction(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.rename-success').textContent==='');
  assert.equal(await p.evaluate(()=>window.nativeSaves),3);
});

test('success toast keeps centered title and controls unobstructed at narrow viewport',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p);await commitName(p);await nameConfirmed(p);
  for(const width of [1280,640,240]) {
    await p.setViewportSize({width,height:450});
    const r=await p.evaluate(()=>{const s=document.querySelector('#marusin-thread-colors').shadowRoot,rect=c=>s.querySelector(c).getBoundingClientRect();const b=rect('.bar'),n=rect('.rename-success'),a=rect('.title'),o=rect('.open');return {height:b.height,center:(a.left+a.right)/2,w:innerWidth,below:n.top>=b.bottom,inBounds:n.left>=0&&n.right<=innerWidth,button:s.elementFromPoint(o.x+o.width/2,o.y+o.height/2)===s.querySelector('.open')};});
    assert.equal(r.height,56);assert.ok(Math.abs(r.center-r.w/2)<1);assert.ok(r.below&&r.inBounds&&r.button);
  }
});

test('unknown result stays silent and never becomes a success toast',async t=>{
  const {p}=await setup(t);await renameFixture(p,{mode:'unknown'});await editName(p);await commitName(p);
  await waitRenameFailure(p);
  await p.waitForTimeout(3200);assert.equal(await p.locator('.rename-notice').isVisible(),false);
  assert.equal(await p.locator('.rename-success').textContent(),'');
  assert.equal(await p.locator('.rename-notice').isVisible(),false);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('settings outside clicks preserve page action and inside color events stay open',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.locator('.open').click();await p.locator('.swatch').first().click();assert.equal(await p.locator('.panel').isVisible(),true);
  // Native picker is browser UI: simulate the input/change and focus return it delivers.
  await p.locator('[name=color]').dispatchEvent('click');await input(p,'color','#123456');
  await p.locator('[name=color]').dispatchEvent('change');await p.locator('[name=color]').focus();
  assert.equal(await p.locator('.panel').isVisible(),true);
  await p.locator('.bar').click({position:{x:5,y:20}});assert.equal(await p.locator('.panel').isVisible(),false);
  await p.locator('.open').click();await p.locator('.open').click();assert.equal(await p.locator('.panel').isVisible(),false);
  await p.locator('.open').click();await p.locator('textarea').click();assert.equal(await p.locator('.panel').isVisible(),false);
  assert.equal(await p.locator('textarea').evaluate(e=>e===document.activeElement),true);
  await p.locator('.open').click();await p.locator('textarea').focus();await p.keyboard.press('Escape');assert.equal(await p.locator('.panel').isVisible(),false);
  await p.locator('.open').click();await p.locator('.title').click();assert.equal(await p.locator('.panel').isVisible(),false);
  await p.locator('.title-input').fill('外側で確定');await p.waitForTimeout(100);await p.locator('textarea').click();await nameConfirmed(p,'外側で確定');
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('usage disclosure is initially collapsed and supports keyboard expansion',async t=>{
  const {p}=await setup(t);await p.locator('.open').click();
  assert.equal(await p.locator('.usage').evaluate(e=>e.open),false);
  await p.locator('.usage summary').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.usage').evaluate(e=>e.open),true);
  assert.doesNotMatch(await p.locator('.usage').textContent(),/日本語入力中のEnter/);
  assert.match(await p.locator('.usage').textContent(),/キャンセルで編集を取り消せます/);
  await p.keyboard.press('Space');assert.equal(await p.locator('.usage').evaluate(e=>e.open),false);
});

test('mode labels preserve stored mode and store footer opens a safe ordinary new-tab link',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:thread-a':{textMode:'custom',textColor:'#123456',color:'#eeeeee'}}));
  await p.locator('.open').click();
  assert.deepEqual(await p.locator('[data-mode]').allTextContents(),['読みやすい','目立つ色','色を選択']);
  assert.equal(await p.locator('[data-mode=custom]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('[name=textColor]').inputValue(),'#123456');
  const link=p.locator('.other-extensions'),url='https://chromewebstore.google.com/search/(by%20marusin)?hl=ja&authuser=0';
  assert.equal(await link.getAttribute('href'),url);assert.equal(await link.getAttribute('target'),'_blank');
  assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
  // Store navigation crashes this Windows test Chromium (exit 2147483651).
  // Validate the production URL above, then test native new-tab semantics on the routed fixture origin.
  await link.evaluate(a=>a.href='https://example.test/store-link');
  const [popup]=await Promise.all([p.context().waitForEvent('page'),link.click()]);await popup.waitForLoadState();assert.equal(popup.url(),'https://example.test/store-link');await popup.close();
  await p.locator('.title').click();assert.equal(await link.isVisible(),false);
  // Even a programmatic link activation during editing is an extension action, not an outside commit.
  await p.locator('.title-input').fill('編集中');await link.dispatchEvent('click');
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);await p.locator('.cancel-title').click();
  assert.deepEqual(require('../manifest.json').permissions,['storage']);
});
test('inline rename saves current row once via dynamic native UI and preserves settings',async t=>{
  const {p,data}=await setup(t);await renameFixture(p,{opacityAncestor:true});
  await editName(p);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
  await commitName(p);await nameConfirmed(p);
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),['thread-a']);assert.equal(await p.evaluate(()=>window.menuThread),'thread-a');
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);assert.equal(await p.evaluate(()=>window.nativeInputState),'新しい名前');
  assert.equal(await p.evaluate(()=>window.hiddenDuringSave),true);assert.equal(await p.evaluate(()=>window.wrongAction),undefined);
  assert.deepEqual(data,{});assert.equal(await p.locator('.dot').count(),0);
});
test('title starts inline editing and cancel plus IME Enter never saves',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p,'未保存',true);
  await p.locator('.title-input').evaluate(e=>{e.dispatchEvent(new CompositionEvent('compositionstart'));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}));});
  await commitName(p);assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await p.locator('.title-input').evaluate(e=>e.dispatchEvent(new CompositionEvent('compositionend')));
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
  await p.locator('.cancel-title').click();assert.equal(await p.locator('.title').textContent(),'サンプルA開発');assert.equal(await p.locator('.title-input').isVisible(),false);
});
test('ambiguous sidebar rows fail without clicking any action',async t=>{
  const {p}=await setup(t);await renameFixture(p,{ambiguous:true});await p.locator('.title').click();
  await waitRenameFailure(p);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});
test('mixed-thread ancestor is never used as a shared action row',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>{const nav=document.querySelector('nav'),b=nav.lastChild.querySelector('button');b.remove();nav.append(b);});
  await p.locator('.title').click();await waitRenameFailure(p);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});
test('navigation during menu wait aborts and duplicate Save starts are ignored',async t=>{
  const {p}=await setup(t);await renameFixture(p,{delay:400});await editName(p);
  await p.evaluate(()=>{const b=document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-input');b.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));b.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});
  await p.waitForFunction(()=>window.renameClicks.length===1);
  await p.evaluate(()=>history.pushState({},'', '/c/thread-b'));await p.waitForTimeout(700);
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.deepEqual(await p.evaluate(()=>window.renameClicks),['thread-a']);
  assert.equal(await p.locator('.rename-status').textContent(),'');
});
test('mismatched dynamic menu association rejects without clicking any item and releases busy state',async t=>{
  const {p}=await setup(t);await renameFixture(p,{badAssociation:true});await editName(p);await commitName(p);
  await waitRenameFailure(p);
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.equal(await p.evaluate(()=>window.wrongAction),undefined);assert.equal(await p.locator('.title-input').isEnabled(),true);
});
test('existing unrelated modal prevents beginning and unrelated modal while editing prevents Save',async t=>{
  const {p}=await setup(t);await renameFixture(p);await modal(p);
  await p.evaluate(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title').click());
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);await removeModal(p);await p.locator('.bar').waitFor();
  await editName(p);await modal(p);
  await p.evaluate(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  await removeModal(p);await p.locator('.bar').waitFor();assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.equal(await p.locator('.title-input').inputValue(),'新しい名前');assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});
test('failed target detection stays silent and repaired row can retry without opening color settings',async t=>{
  const {p}=await setup(t);await p.locator('.title').click();await waitRenameFailure(p);
  assert.equal(await p.locator('.panel').isVisible(),false);assert.equal(await p.locator('.title').isEnabled(),true);
  await p.locator('.open').click();assert.equal(await p.locator('.panel').isVisible(),true);await p.locator('.open').click();
  await renameFixture(p);await editName(p);assert.equal(await p.locator('.panel').isVisible(),false);await commitName(p);await nameConfirmed(p);
});
test('menu timeout releases state and permits explicit retry before submission',async t=>{
  const {p}=await setup(t);await renameFixture(p,{missing:true});await editName(p);await commitName(p);
  await waitRenameFailure(p);
  assert.equal(await p.locator('.panel').isVisible(),false);assert.equal(await p.locator('.title-input').isEnabled(),true);
  await p.evaluate(()=>window.renameOptions.missing=false);await editName(p);await commitName(p);await nameConfirmed(p);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('narrow inline controls remain on screen and repeated Save clicks produce one submission',async t=>{
  const {p}=await setup(t);await p.setViewportSize({width:240,height:700});await renameFixture(p,{delay:600});
  const a=await p.locator('.title').boundingBox(),b=await p.locator('.open').boundingBox();assert.ok(a.x+a.width<b.x);
  await p.mouse.click(b.x+b.width/2,b.y+b.height/2);assert.equal(await p.locator('.panel').isVisible(),true);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);await p.locator('.open').click();
  await editName(p);for(const sel of ['.title-input','.cancel-title']){const r=await p.locator(sel).boundingBox();assert.ok(r.x>=0&&r.x+r.width<=240);}
  await p.locator('.title-input').evaluate(e=>{e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});
  await nameConfirmed(p);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('button opacity itself is rejected and repaired button can retry',async t=>{
  const {p}=await setup(t);await renameFixture(p);await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').style.opacity='0');
  await p.locator('.title').click();await waitRenameFailure(p);assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.equal(await p.locator('.rename-notice').isVisible(),false);assert.equal(await p.locator('.panel').isVisible(),false);
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').style.opacity='1');await editName(p);await commitName(p);await nameConfirmed(p);
});
test('already open matching menu is reused without retoggling its opacity-hidden trigger',async t=>{
  const {p}=await setup(t);await renameFixture(p,{opacityAncestor:true});
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').click());await p.locator('[role="menu"]').waitFor();
  await editName(p);await commitName(p);await nameConfirmed(p);assert.deepEqual(await p.evaluate(()=>window.renameClicks),['thread-a']);
});
test('unrelated open menu is never reused',async t=>{
  const {p}=await setup(t);await renameFixture(p);await p.evaluate(()=>document.querySelector('nav').firstChild.querySelector('button').click());await p.locator('[role="menu"]').waitFor();
  await editName(p);await commitName(p);await waitRenameFailure(p);assert.equal(await p.evaluate(()=>window.nativeSaves),0);
});
test('native current title mismatch aborts before input or submit',async t=>{
  const {p}=await setup(t);await renameFixture(p,{mode:'mismatch'});await editName(p);await commitName(p);
  await p.locator('[role="dialog"] input').waitFor();await p.waitForTimeout(300);assert.equal(await p.locator('[role="dialog"] input').inputValue(),'別のタイトル');assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();assert.equal(await p.locator('.rename-status').textContent(),'');assert.equal(await p.locator('.title-input').inputValue(),'新しい名前');
});
test('dialog close without name update is unknown and disables resubmission',async t=>{
  const {p}=await setup(t);await renameFixture(p,{mode:'unknown'});await editName(p);await commitName(p);
  await waitRenameFailure(p);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.locator('.title-input').isVisible(),false);await p.evaluate(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>window.nativeSaves),1);assert.equal(await p.locator('.title').textContent(),'サンプルA開発');assert.equal(await p.locator('.title').isVisible(),true);assert.equal(await p.locator('.rename-progress').textContent(),'');
});
test('navigation before Save or after native submission never acts on another thread',async t=>{
  const {p}=await setup(t);await renameFixture(p,{mode:'navigate'});await editName(p);
  await p.evaluate(()=>{history.pushState({},'', '/c/thread-b');document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);await p.waitForTimeout(700);
  await p.evaluate(()=>history.pushState({},'', '/c/thread-a'));await p.waitForTimeout(700);await editName(p);await commitName(p);
  await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>window.nativeSaves),1);assert.equal(await p.locator('.rename-status').textContent(),''); // No old-chat result on the destination chat.
  assert.equal(await p.locator('.rename-progress').textContent(),'');
});
test('page title tracking never overwrites draft and concurrent rename aborts before opening menu',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p,'編集中');
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('.truncate').textContent='他のタブで変更');await p.waitForTimeout(750);
  assert.equal(await p.locator('.title-input').inputValue(),'編集中');await commitName(p);await waitRenameFailure(p);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});
test('known opacity ancestor does not bypass disabled aria-disabled hidden inert display or pointer blocking',async t=>{
  const {p}=await setup(t);
  for(const reason of ['disabled','aria-disabled','hidden','inert','display','visibility','pointer','zero','unknown-opacity']) {
    await renameFixture(p,{opacityAncestor:true});
    await p.evaluate(reason=>{const row=document.querySelector('nav').lastChild,b=row.querySelector('button'),w=b.parentElement;
      if(reason==='disabled')b.disabled=true;else if(reason==='aria-disabled')b.setAttribute('aria-disabled','true');else if(reason==='hidden')w.hidden=true;else if(reason==='inert')w.inert=true;
      else if(reason==='display')w.style.display='none';else if(reason==='visibility')w.style.visibility='hidden';else if(reason==='pointer')w.style.pointerEvents='none';else if(reason==='zero')b.style.cssText='width:0;height:0;padding:0;border:0';else w.className='opacity-0';
    },reason);
    await p.locator('.title').click();assert.equal(await p.locator('.title-input').isVisible(),false,reason);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
  }
});

const renameDiagnosticSource=require('node:fs').readFileSync(path.join(root,'diagnostics','rename-target.js'),'utf8');
test('read-only diagnosis identifies hidden selected button and separately correlates a visible menu trigger clone',async t=>{
  const {p,data}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>{
    const row=document.querySelector('nav').lastElementChild, hidden=row.querySelector('button');
    hidden.id='hidden-original';hidden.style.opacity='0';
    const clone=hidden.cloneNode(true);clone.id='visible-clone';clone.style.opacity='1';clone.setAttribute('aria-expanded','true');clone.setAttribute('aria-controls','visible-menu');row.parentElement.append(clone);
    const menu=document.createElement('div');menu.id='visible-menu';menu.setAttribute('role','menu');menu.dataset.overlayOwner='slate-sidebar';menu.setAttribute('aria-labelledby','visible-clone');menu.innerHTML='<button role="menuitem">名前を変更</button>';document.body.append(menu);
    document.querySelector('main .messages').textContent='PRIVATE-CONVERSATION-CONTENT';document.querySelector('textarea').value='PRIVATE-DRAFT';
  });
  const before=await p.evaluate(()=>document.documentElement.outerHTML);
  const report=await p.evaluate(renameDiagnosticSource);
  const hidden=report.candidates.find(c=>c.node.id==='hidden-original'), visible=report.candidates.find(c=>c.node.id==='visible-clone');
  assert.equal(hidden.state.actionable015,false);assert.ok(hidden.state.rejection015.includes('checkVisibility=false'));
  assert.ok(hidden.state.blockers.some(b=>b.reasons.includes('opacity:0')));
  assert.equal(visible.state.actionable015,true);assert.equal(visible.menuRelations[0].byControls,true);assert.equal(visible.menuRelations[0].byLabel,true);
  assert.equal(report.current015Outcome.rowSelectionWouldPass,false);
  assert.equal(report.openMenus[0].triggers[0],visible.node.ref);
  assert.equal(await p.evaluate(()=>document.documentElement.outerHTML),before);
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);assert.deepEqual(data,{});
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE-CONVERSATION-CONTENT|PRIVATE-DRAFT|サンプルA開発|サンプルB開発/);
});
test('diagnosis separates ancestor hiding, native disabled and aria-disabled from current acceptance rules',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>{const b=document.querySelector('nav').lastChild.querySelector('button');b.disabled=true;b.setAttribute('aria-disabled','true');const wrap=document.createElement('div');b.replaceWith(wrap);wrap.append(b);wrap.setAttribute('aria-hidden','true');});
  const report=await p.evaluate(renameDiagnosticSource);const b=report.candidates.find(c=>c.state.disabled);
  assert.equal(b.state.ariaDisabled,'true');assert.equal(b.state.actionable015,false);
  assert.ok(b.state.rejection015.includes('disabled=true'));assert.ok(b.state.blockers.some(x=>x.reasons.includes('aria-hidden=true')));
  await p.evaluate(()=>{const b=document.querySelector('nav').lastChild.querySelector('button');b.disabled=false;b.parentElement.removeAttribute('aria-hidden');});
  const second=await p.evaluate(renameDiagnosticSource);const ariaOnly=second.candidates.find(c=>c.state.ariaDisabled==='true');
  assert.equal(ariaOnly.state.actionable015,true); // Documents a gap; the diagnostic never clicks it.
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});
test('diagnosis reports mixed-row boundary and pre-existing menu rejection without changing native UI',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').click());
  await p.locator('[role="menu"]').waitFor();const report=await p.evaluate(renameDiagnosticSource);
  assert.equal(report.current015Outcome.rowSelectionWouldPass,true);assert.equal(report.current015Outcome.existingVisibleMenuWouldRejectAfterRowPass,true);
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),['thread-a']);assert.equal(await p.locator('[role="dialog"]').count(),0);
  await p.evaluate(()=>{const nav=document.querySelector('nav');const wrap=document.createElement('div');while(nav.firstChild)wrap.append(nav.firstChild);nav.append(wrap);const b=wrap.lastChild.querySelector('button');wrap.append(b);});
  const mixed=await p.evaluate(renameDiagnosticSource);assert.equal(mixed.links[0].stop,'mixed thread IDs');
  assert.equal(mixed.current015Outcome.rowSelectionWouldPass,false);
});

test('native focus can reveal the diagnosed action region before activation',async t=>{
  const {p}=await setup(t);await renameFixture(p,{opacityAncestor:true});
  await p.evaluate(()=>{const b=document.querySelector('nav').lastChild.querySelector('button');b.addEventListener('focus',()=>{window.focusRevealed=true;b.parentElement.style.opacity='1';});});
  await editName(p);await commitName(p);await nameConfirmed(p);assert.equal(await p.evaluate(()=>window.focusRevealed),true);
});
test('native modal aria-hiding sidebar does not erase draft or break structural identity',async t=>{
  const {p}=await setup(t);await renameFixture(p,{nativeDelay:300});
  await p.evaluate(()=>{
    new MutationObserver(()=>{document.querySelector('nav').toggleAttribute('aria-hidden',false);if(document.querySelector('[role="dialog"]'))document.querySelector('nav').setAttribute('aria-hidden','true');}).observe(document.body,{childList:true});
  });
  await editName(p,'保持する名前');await commitName(p);await nameConfirmed(p,'保持する名前');assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
test('a hidden duplicate action in the same row remains ambiguous even with diagnosed opacity classes',async t=>{
  const {p}=await setup(t);await renameFixture(p,{opacityAncestor:true});
  await p.evaluate(()=>{const row=document.querySelector('nav').lastChild,b=row.querySelector('button'),c=b.cloneNode(true);c.hidden=true;b.parentElement.append(c);});
  await p.locator('.title').click();await waitRenameFailure(p);assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
});


test('real DOM decorative aria-hidden backdrop is suppressed with its verified rename dialog',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true});
  await editName(p);await commitName(p);await nameConfirmed(p);
  const frames=await p.evaluate(()=>window.quietFrames);
  assert.ok(frames.length>=2);
  assert.ok(frames.every(f=>f.dialog==='0'&&f.overlay==='0'), JSON.stringify(frames));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});


test('manual rename with an aria-hidden decorative backdrop stays visible',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true});
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('button').click());
  await p.locator('[role="menuitem"]').filter({hasText:'名前を変更'}).click();
  await p.waitForFunction(()=>window.quietFrames.length>=2);
  assert.ok((await p.evaluate(()=>window.quietFrames)).every(f=>f.dialog==='1'&&f.overlay==='0.9'));
  assert.equal(await p.locator('.codex-dialog-overlay').getAttribute('aria-hidden'),'true');
  await p.locator('[role="dialog"] button[type="button"]').click();
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
});

test('aria-hidden decorative backdrop is restored on timeout without changing its accessibility attribute',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true,mode:'stay'});
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>window.quietFrames.some(f=>f.dialog==='0'));
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.locator('[role="dialog"]').evaluate(d=>getComputedStyle(d).opacity),'1');
  assert.equal(await p.locator('.codex-dialog-overlay').evaluate(e=>e.style.opacity),'0.9');
  assert.equal(await p.locator('.codex-dialog-overlay').getAttribute('aria-hidden'),'true');
  await p.locator('[role="dialog"] button[type="button"]').click();
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('actually display-none backdrop is not accepted as a visually rendered pair',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true,overlayDisplayNone:true});
  await editName(p);await commitName(p);await nameConfirmed(p);
  assert.ok((await p.evaluate(()=>window.quietFrames)).every(f=>f.dialog==='1'));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('usage collapses on every settings close path',async t=>{
  const {p}=await setup(t);
  for(const method of ['toggle','outside','escape','close']) {
    await p.locator('.open').click();await p.locator('.usage summary').click();
    assert.equal(await p.locator('.usage').evaluate(e=>e.open),true);
    if(method==='toggle')await p.locator('.open').click();
    if(method==='outside')await p.locator('textarea').click();
    if(method==='escape')await p.keyboard.press('Escape');
    if(method==='close')await p.locator('.close').click();
    await p.locator('.open').click();assert.equal(await p.locator('.usage').evaluate(e=>e.open),false);
    await p.locator('.open').click();
  }
});

for(const mode of ['save','unknown','mismatch','navigate'])test('rename cleanup restores normal editor state: '+mode,async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true,mode});
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>{
    const d=JSON.parse(document.querySelector('#marusin-thread-colors').getAttribute('data-rename-diagnostic'));
    return d.events.some(e=>e.kind==='finished');
  });
  const d=await p.evaluate(()=>JSON.parse(document.querySelector('#marusin-thread-colors').getAttribute('data-rename-diagnostic')));
  const end=d.events.findLast(e=>e.kind==='finished');
  for(const key of ['quiet','editing','busy','composing','observerActive','widthFramePending','diagnosticFramePending'])assert.equal(end[key],false,key);
  assert.equal(end.activeWaits,0);assert.equal(end.editorHidden,true);assert.equal(end.compositionHidden,true);
  assert.equal(await p.locator('.title-input').evaluate(e=>e.hidden),true);
  assert.equal(await p.locator('.open').evaluate(e=>e.hidden),false);
  assert.equal(await p.evaluate(()=>window.nativeSaves),mode==='mismatch'?0:1);
  if(mode!=='save')assert.equal(await p.locator('.rename-success').textContent(),'');
  if(mode==='mismatch') {
    assert.equal(await p.locator('[role=dialog]').evaluate(e=>getComputedStyle(e).opacity),'1');
    await p.locator('[role=dialog] button[type=button]').click();
  }
});

test('saved name with ambiguous recreated links stays unknown but exits editor and records only evidence metadata',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.evaluate(()=>{
    const observer=new MutationObserver(()=>{
      const row=document.querySelector('nav').lastChild;
      if(row.querySelector('.truncate').textContent==='サンプルA開発')return;
      observer.disconnect();
      row.after(row.cloneNode(true));row.replaceWith(row.cloneNode(true));
    });observer.observe(document.querySelector('nav'),{subtree:true,childList:true,characterData:true});
  });
  await editName(p,'診断に含めない名前');await commitName(p);
  await waitRenameFailure(p);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.locator('nav a').filter({hasText:'診断に含めない名前'}).count(),2);
  assert.equal(await p.locator('.title-input').isVisible(),false);
  const raw=await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic'),d=JSON.parse(raw);
  assert.ok(!raw.includes('診断に含めない名前')&&!raw.includes('thread-a'));
  const checks=d.events.filter(e=>e.kind==='name-check'&&e.source==='sidebar');
  assert.ok(checks.some(e=>e.count===2&&e.previousConnected===false&&e.candidates.every(c=>c.expectedMatch)));
  assert.equal(await p.locator('.rename-success').textContent(),'');
  await p.locator('textarea').click();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('composition indicator follows native input events and clears on cancel or navigation',async t=>{
  const {p}=await setup(t);await renameFixture(p);await editName(p);
  const field=p.locator('.title-input');
  assert.equal(await field.evaluate(e=>e===e.getRootNode().activeElement&&e.tagName==='INPUT'),true);
  await field.dispatchEvent('compositionstart');assert.equal(await p.locator('.composition-status').isVisible(),true);
  await field.dispatchEvent('keydown',{key:'Enter',keyCode:229,isComposing:true});
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await field.dispatchEvent('compositionend');assert.equal(await p.locator('.composition-status').isVisible(),false);
  await field.dispatchEvent('keydown',{key:'Enter'});await field.dispatchEvent('keyup',{key:'Enter'});
  await p.waitForTimeout(100);await field.dispatchEvent('keydown',{key:'Enter',repeat:true});
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await commitName(p);await nameConfirmed(p);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  await editName(p,'取消');await field.dispatchEvent('compositionstart');await p.locator('.cancel-title').click();
  assert.equal(await p.locator('.composition-status').isVisible(),false);
  await editName(p,'移動');await field.dispatchEvent('compositionstart');await p.evaluate(()=>history.pushState({},'', '/c/thread-b'));
  await p.waitForFunction(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.composition-status').hidden);
  assert.equal(await field.isVisible(),false);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

for(const stayOpen of [false,true])test('evidence diagnostic separates aria-hidden, selected link text and native close state: '+stayOpen,async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{mode:stayOpen?'stay':'unknown',overlayAriaHidden:true});
  await p.evaluate(stay=>{
    document.addEventListener('submit',()=>{
      const a=document.querySelector('nav').lastChild.querySelector('a');
      a.querySelector('.truncate').className='';
      a.parentElement.setAttribute('aria-hidden','true');
      if(!stay){a.firstChild.textContent=window.nativeInputState;const extra=document.createElement('span');extra.textContent='補助表示';a.append(extra);}
    });
  },stayOpen);
  await editName(p,'診断対象の名前');await commitName(p);
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events.some(e=>e.kind==='finished'));
  await p.locator('#marusin-thread-colors').dispatchEvent('thread-colors-diagnostic');
  const raw=await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic'),d=JSON.parse(raw);
  assert.equal(d.diagnosticSchema,5);
  for(const value of ['診断対象の名前','サンプルA開発','補助表示','thread-a'])assert.equal(raw.includes(value),false);
  const checks=d.events.filter(e=>e.kind==='name-check'&&e.source==='sidebar');
  assert.ok(checks.some(e=>e.visibleCount===1&&e.candidates[0].hidden));
  const detail=d.events.filter(e=>e.kind==='evidence-detail'&&e.phase==='await-name');
  assert.ok(detail.length>0);
  assert.ok(detail.some(e=>e.dialog.connected===stayOpen));
  assert.ok(detail.every(e=>e.links[0].selectedIsLink));
  assert.ok(detail.some(e=>e.links[0].nodes[0].ariaHiddenAncestor&&!e.links[0].nodes[0].hiddenAncestor));
  if(!stayOpen)assert.ok(detail.some(e=>e.links[0].nodes.some(n=>!n.selected&&n.expectedMatch)&&!e.links[0].nodes[0].expectedMatch));
  const end=d.events.findLast(e=>e.kind==='evidence-detail');
  assert.equal(end.phase,'manual-after-cleanup');assert.equal(end.quiet,false);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.locator('.rename-success').textContent(),'');
  assert.equal(await p.locator('.title-input').evaluate(e=>e.hidden),true);
});

for(const releaseDependent of [false,true])test('bounded observation confirms delayed native save without resending: '+releaseDependent,async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{mode:releaseDependent?'stay':'save',nativeDelay:11400,overlayAriaHidden:true});
  if(releaseDependent)await p.evaluate(()=>{
    document.addEventListener('submit',e=>{
      const d=e.target.closest('[role=dialog]');
      const tick=()=>{
        if(getComputedStyle(d).opacity==='0'){requestAnimationFrame(tick);return;}
        document.querySelector('nav').lastChild.querySelector('.truncate').textContent=window.nativeInputState;d.remove();
      };requestAnimationFrame(tick);
    });
  });
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events.some(e=>e.kind==='late-observation-start'));
  assert.equal(await p.locator('.title-input').evaluate(e=>e.hidden),true);
  await nameConfirmed(p);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);assert.equal(await p.locator('.rename-notice').isVisible(),false);
  const d=JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic'));
  assert.ok(d.events.some(e=>e.kind==='late-name-confirmed'));
  assert.equal(d.events.findLast(e=>e.kind==='late-observation-stop').reason,'confirmed-and-closed');
  assert.ok(d.events.some(e=>e.kind==='evidence-detail'&&e.phase==='before-release'&&e.quiet));
});

test('late observation stops at its bound without saving again',async t=>{
  const {p}=await setup(t);await p.clock.install();await pairedDialogFixture(p,{mode:'unknown'});
  await editName(p);await commitName(p);await waitRenameFailure(p);
  await p.clock.fastForward(31000);
  const d=JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic'));
  assert.equal(d.events.findLast(e=>e.kind==='late-observation-stop').reason,'deadline');
  const count=d.events.length;await p.clock.fastForward(5000);
  assert.equal(JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events.length,count);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);assert.equal(await p.locator('.rename-success').textContent(),'');
});

test('late result cannot overwrite a dismissed notice',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{nativeDelay:11500});
  await editName(p);await commitName(p);await waitRenameFailure(p);
  await p.evaluate(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.dismiss-rename').click());
  await p.waitForTimeout(2200);
  const events=JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events;
  assert.ok(events.some(e=>e.kind==='late-name-confirmed'),JSON.stringify(events.filter(e=>e.kind.startsWith('late-')||e.kind==='failure')));
  assert.equal(await p.locator('.rename-success').textContent(),'');assert.equal(await p.locator('.rename-notice').isVisible(),false);
});

test('late result cannot follow a different chat',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{mode:'unknown'});await editName(p,'次の名前');await commitName(p);
  await waitRenameFailure(p);
  await p.evaluate(()=>history.pushState({},'', '/c/thread-b'));await p.waitForTimeout(700);
  const d=JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic'));
  assert.ok(['navigation','context-changed'].includes(d.events.findLast(e=>e.kind==='late-observation-stop').reason));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

for(const suppress of [true,false])test('slow native save keeps editor separate from owned dialog suppression: '+suppress,async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{nativeDelay:4600,overlayAriaHidden:true});
  if(!suppress)await p.locator('#marusin-thread-colors').dispatchEvent('thread-colors-compare-unsuppressed');
  await editName(p);await commitName(p);await p.waitForTimeout(3500);
  assert.equal(await p.locator('.title-input').evaluate(e=>e.hidden),true);
  assert.equal(await p.locator('.title').getAttribute('aria-busy'),'true');
  assert.equal(await p.locator('.rename-progress').textContent(),'更新中・・・');
  const frames=await p.evaluate(()=>window.quietFrames);assert.ok(frames.length>100);
  assert.ok(frames.every(f=>f.dialog===(suppress?'0':'1')&&f.overlay===(suppress?'0':'0.9')));
  await nameConfirmed(p);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title').evaluate(e=>e.hidden),false);
  const events=JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events;
  assert.equal(events.find(e=>e.kind==='suppression-mode').enabled,suppress);
  assert.ok(events.some(e=>e.kind==='editor-released'));
  assert.ok(!events.some(e=>e.kind==='late-observation-start'));
});

test('native error while pending reveals owned controls and ends progress',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{mode:'stay',overlayAriaHidden:true});
  await p.evaluate(()=>document.addEventListener('submit',e=>{
    const d=e.target.closest('[role=dialog]');setTimeout(()=>{const a=document.createElement('div');a.setAttribute('role','alert');a.textContent='保存できません';d.append(a);},3500);
  }));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events.some(e=>e.kind==='finished'));
  assert.equal(await p.locator('[role=dialog]').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title').evaluate(e=>e.hidden),false);
  await p.locator('[role=dialog] button[type=button]').click();
  assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.locator('.rename-status').textContent(),'');
});

for(const exit of ['navigation','deadline','pair-loss'])test('pending owned dialog is restored after '+exit,async t=>{
  const {p}=await setup(t);if(exit==='deadline')await p.clock.install();
  await pairedDialogFixture(p,{mode:'stay',overlayAriaHidden:true});await editName(p);await commitName(p);
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events.some(e=>e.kind==='editor-released'));
  await p.waitForTimeout(3300);
  if(exit==='navigation')await p.evaluate(()=>history.pushState({},'', '/c/thread-b'));
  if(exit==='deadline')await p.clock.fastForward(8000);
  if(exit==='pair-loss')await p.locator('.codex-dialog-overlay').evaluate(e=>document.body.append(e));
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.locator('[role=dialog]').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title').evaluate(e=>e.hidden),false);
  await p.locator('[role=dialog] button[type=button]').click();
  assert.equal(await p.locator('.title-input').evaluate(e=>e.hidden),true);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('owned closed-state exit remains suppressed until the native elements disconnect',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{nativeDelay:4600,overlayAriaHidden:true});
  await p.evaluate(()=>document.addEventListener('submit',e=>{
    const d=e.target.closest('[role=dialog]');
    setTimeout(()=>{d.dataset.state='closed';d.parentElement.querySelector('.codex-dialog-overlay').dataset.state='closed';},3200);
  }));
  await editName(p);await commitName(p);await nameConfirmed(p);
  const frames=await p.evaluate(()=>window.quietFrames);
  assert.ok(frames.length>150);assert.ok(frames.every(f=>f.dialog==='0'&&f.overlay==='0'));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  const events=JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events;
  assert.ok(!events.some(e=>e.kind==='failure'));
});

test('commit immediately exits editor and failed rename restarts from confirmed name',async t=>{
  const {p}=await setup(t);await renameFixture(p,{missing:true});
  await editName(p,'再利用する名前');await commitName(p);
  assert.equal(await p.locator('.title-input').isVisible(),false);
  assert.equal(await p.locator('.rename-progress').textContent(),'更新中・・・');
  await p.locator('.title').dispatchEvent('click');assert.equal(await p.locator('.title-input').isVisible(),false);
  await waitRenameFailure(p);assert.equal(await p.locator('.failed-draft').isVisible(),false);
  assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title').isVisible(),true);
  assert.equal(await p.locator('.draft-value').inputValue(),'再利用する名前');
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await p.evaluate(()=>window.renameOptions.missing=false);
  await p.locator('.title').click();assert.equal(await p.locator('.title-input').inputValue(),'サンプルA開発');await p.locator('.title-input').fill('再利用する名前');
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  await commitName(p);await nameConfirmed(p,'再利用する名前');assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('diagnostic observes native modal input blocking without clearing native inert',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{nativeDelay:1800,overlayAriaHidden:true});
  await p.evaluate(()=>document.addEventListener('submit',e=>{
    const root=document.querySelector('#root'),d=e.target.closest('[role=dialog]');root.inert=true;
    const o=new MutationObserver(()=>{if(!d.isConnected){root.inert=false;o.disconnect();}});o.observe(document.body,{childList:true,subtree:true});
  }));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events.some(e=>e.interaction?.composerInert));
  assert.equal(await p.locator('#root').evaluate(e=>e.inert),true);
  const events=JSON.parse(await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic')).events;
  assert.ok(events.some(e=>e.interaction?.hitOwnedModal&&!e.interaction.composerHit));
  await nameConfirmed(p);assert.equal(await p.locator('#root').evaluate(e=>e.inert),false);
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

for(const change of ['missing','duplicate','mixed-row'])test('unsupported DOM safely retains colors: '+change,async t=>{
  const {p,bar}=await setup(t);await renameFixture(p);
  const before=await bar.evaluate(e=>getComputedStyle(e).backgroundColor);
  await p.evaluate(change=>{
    const row=document.querySelector('nav').lastChild;
    if(change==='missing')row.querySelector('button').remove();
    if(change==='duplicate')row.append(row.querySelector('button').cloneNode(true));
    if(change==='mixed-row')row.append(document.querySelector('nav').firstChild.querySelector('a').cloneNode(true));
  },change);
  assert.equal(await p.locator('.rename-notice').isVisible(),false);
  await p.locator('.title').click();
  assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  assert.equal(await bar.evaluate(e=>getComputedStyle(e).backgroundColor),before);
  assert.equal(await p.locator('.rename-notice').isVisible(),false);await p.locator('.open').click();assert.equal(await p.locator('.panel').isVisible(),true);
});

test('changed save button association aborts before submission and restores native dialog',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true});
  await p.evaluate(()=>document.addEventListener('input',e=>{
    if(e.target.matches('input[aria-label="チャットのタイトル"]')){
      const b=e.target.form.querySelector('button[type=submit]');b.after(b.cloneNode(true));
    }
  }));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
  assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.equal(await p.locator('[role=dialog]').evaluate(e=>getComputedStyle(e).opacity),'1');
  await p.locator('[role=dialog] button[type=button]').click();await p.locator('textarea').click();assert.equal(await p.locator('textarea').evaluate(e=>e===document.activeElement&&e.getBoundingClientRect().bottom<=innerHeight),true);
  assert.equal(await p.locator('.title-input').isVisible(),false);
});

test('replacement after submission is visible and never offers resubmission',async t=>{
  const {p,bar}=await setup(t);await pairedDialogFixture(p,{mode:'stay',overlayAriaHidden:true});
  await p.evaluate(()=>document.addEventListener('submit',e=>{
    const old=e.target.closest('[role=dialog]');
    const d=document.createElement('div');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
    d.style.cssText='position:fixed;inset:0;background:white;z-index:9999';
    d.innerHTML='<h2>変更された画面</h2><button>閉じる</button>';d.querySelector('button').onclick=()=>d.remove();
    old.remove();document.body.append(d);
  }));
  await editName(p);await commitName(p);
  await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
  assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.equal(await p.locator('.rename-status').textContent(),'');
  assert.equal(await p.locator('.reuse-draft').evaluate(e=>e.hidden),true);
  assert.equal(await p.locator('[role=dialog]').evaluate(e=>getComputedStyle(e).opacity),'1');
  await p.locator('[role=dialog] button').click();await bar.waitFor();await p.locator('textarea').click();assert.equal(await p.locator('textarea').evaluate(e=>e===document.activeElement&&e.getBoundingClientRect().bottom<=innerHeight),true);
  assert.equal(await p.locator('.title-input').isVisible(),false);
  await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('.truncate').textContent='手動変更');
  await p.waitForFunction(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title').textContent==='手動変更');
  assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('central progress is synchronous, stable through slow save, and follows title styling',async t=>{
  const {p}=await setup(t);await pairedDialogFixture(p,{nativeDelay:4600,overlayAriaHidden:true});
  await editName(p);
  const immediate=await p.evaluate(()=>{
    const s=document.querySelector('#marusin-thread-colors').shadowRoot;
    window.progressMutations=0;new MutationObserver(ms=>window.progressMutations+=ms.length).observe(s.querySelector('.rename-progress'),{childList:true,characterData:true,subtree:true});
    s.querySelector('.title-input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    return {editorHidden:s.querySelector('.title-input').hidden,titleHidden:s.querySelector('.title').hidden,progress:s.querySelector('.rename-progress').textContent,saves:window.nativeSaves};
  });
  assert.deepEqual(immediate,{editorHidden:true,titleHidden:true,progress:'更新中・・・',saves:0});
  await p.locator('.rename-progress').waitFor();
  for(const [textMode,fontSize] of [['auto',18],['vivid',26],['custom',36]]){
    await p.evaluate(({textMode,fontSize})=>window.__listeners.forEach(f=>f({'thread-colors:v1:thread-a':{newValue:{color:'#336699',textMode,textColor:'#ffcc11',fontSize,height:64,border:6}}},'local')),{textMode,fontSize});
    await p.waitForTimeout(100);
    const style=await p.locator('.rename-progress').evaluate(e=>{
      const t=e.parentElement.querySelector('.title'),r=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect(),o=e.parentElement.querySelector('.open').getBoundingClientRect();
      return {color:getComputedStyle(e).color,titleColor:getComputedStyle(t).color,font:parseFloat(getComputedStyle(e).fontSize),center:r.x+r.width/2,screen:innerWidth/2,height:b.height,overlap:r.right>o.left,titleHidden:t.hidden};
    });
    assert.equal(style.color,style.titleColor);assert.ok(Math.abs(style.font-fontSize*.8)<.01);assert.ok(Math.abs(style.center-style.screen)<1);assert.equal(style.height,64);assert.equal(style.overlap,false);assert.equal(style.titleHidden,true);
  }
  await p.setViewportSize({width:360,height:800});
  const narrow=await p.locator('.rename-progress').evaluate(e=>{const r=e.getBoundingClientRect(),o=e.parentElement.querySelector('.open').getBoundingClientRect();return [r.x+r.width/2,r.right<=o.left];});assert.ok(Math.abs(narrow[0]-180)<1);assert.equal(narrow[1],true);
  await p.evaluate(()=>{document.title='途中のページ更新';document.querySelector('nav').lastChild.querySelector('.truncate').textContent='途中のページ更新';});
  await p.waitForTimeout(3200);
  assert.equal(await p.locator('.title').isVisible(),false);assert.equal(await p.locator('.rename-progress').textContent(),'更新中・・・');
  assert.equal(await p.evaluate(()=>window.progressMutations),1);
  await nameConfirmed(p);assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title').evaluate(e=>e.hidden),false);assert.equal(await p.locator('.title').isVisible(),true);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('unchanged cancel and IME never start central progress',async t=>{
  const {p}=await setup(t);await renameFixture(p);
  await p.locator('.title').click();await commitName(p);
  assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title').evaluate(e=>e.hidden),false);
  await editName(p);await p.locator('.cancel-title').click();assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title').evaluate(e=>e.hidden),false);
  await editName(p);await p.locator('.title-input').dispatchEvent('compositionstart');
  await p.locator('.title-input').dispatchEvent('keydown',{key:'Enter',isComposing:true,keyCode:229});
  assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title-input').isVisible(),true);
  assert.equal(await p.evaluate(()=>window.nativeSaves),0);
});

// Explicit boundary-based positioning model, NOT ChatGPT's private implementation.
// Reproduces the supplied absolute tooltip / display:contents portal / body parent.
const tooltipBoundaryHTML=nestedFixture.replace('html,body{margin:0;overflow:hidden}','html,body{margin:0}');
async function boundaryTooltipFixture(p){
  await p.evaluate(()=>{
    const header=document.querySelector('header');header.style.cssText='height:52px;display:flex;gap:4px;align-items:start;padding-top:8px';
    header.innerHTML=['共有','その他','サイドバー','フォルダー','検索'].map((label,i)=>`<button data-tip="${i}" aria-label="${label}" style="width:44px;flex:none">${i}</button>`).join('');
    const portal=document.createElement('div');portal.style.display='contents';document.body.append(portal);
    const tip=document.createElement('div');tip.setAttribute('role','tooltip');tip.id='fixture-tip';tip.textContent='説明';
    tip.style.cssText='position:absolute;top:0;left:0;width:100px;height:30px;background:black;color:white;z-index:50;pointer-events:none';
    let target;
    window.placeFixtureTooltip=()=>{
      if(!target)return;
      const r=target.getBoundingClientRect(),boundary=document.documentElement.getBoundingClientRect();
      const side=r.bottom+6+30<=boundary.bottom?'bottom':'top';
      const y=side==='bottom'?r.bottom+6:r.top-6-30;
      const x=Math.max(0,Math.min(innerWidth-100,r.x+r.width/2-50));
      const offset=tip.offsetParent,origin=offset&&getComputedStyle(offset).position!=='static'?offset.getBoundingClientRect():{x:0,y:0};
      tip.dataset.side=side;tip.style.transform=`translate(${x-origin.x}px,${y-origin.y}px)`;
      return {side,rootHeight:boundary.height,rect:tip.getBoundingClientRect().toJSON(),button:r.toJSON(),bodyTop:document.body.getBoundingClientRect().top};
    };
    for(const button of header.querySelectorAll('button')){
      const show=()=>{target=button;portal.append(tip);button.setAttribute('aria-describedby',tip.id);window.placeFixtureTooltip();};
      button.addEventListener('mouseenter',show);button.addEventListener('focus',show);
    }
  });
}

test('tooltip boundary comparison isolates root collapse at equal widths',async t=>{
  const {p}=await setup(t,{html:tooltipBoundaryHTML});await boundaryTooltipFixture(p);
  const measurements=[];
  for(const width of [1498,1388]){
    await p.setViewportSize({width,height:1394});
    await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:thread-a':{height:88}}));
    await p.locator('[data-tip="0"]').hover();
    for(const variant of ['legacy','overflow-visible','no-transform','static-body','root-height']){
      const result=await p.evaluate(variant=>{
        const style=document.createElement('style');document.head.append(style);
        const overrides={'legacy':'','overflow-visible':'html[data-thread-colors-active] body{overflow:visible!important}',
          'no-transform':'html[data-thread-colors-active] body{transform:none!important}',
          'static-body':'html[data-thread-colors-active] body{position:static!important}',
          'root-height':'html[data-thread-colors-active]{min-height:100dvh!important}'};
        style.textContent='html[data-thread-colors-active]{min-height:0!important}'+overrides[variant];
        const value=window.placeFixtureTooltip();style.remove();return value;
      },variant);
      measurements.push({width,variant,...result});
      if(['legacy','overflow-visible','no-transform'].includes(variant)){assert.equal(result.rootHeight,0);assert.equal(result.side,'top');assert.ok(result.rect.y<88);}
      if(variant==='root-height'){assert.equal(result.rootHeight,1394);assert.equal(result.side,'bottom');assert.ok(result.rect.y>=88);}
      if(variant==='static-body'){assert.equal(result.side,'bottom');assert.equal(result.bodyTop,0);}
    }
    const restored=await p.evaluate(()=>window.placeFixtureTooltip());assert.equal(restored.side,'bottom');assert.equal(restored.bodyTop,88);
    await checkComposer(p);
  }
  // No title/body/ID from the user's diagnostic is copied to this artifact.
  require('node:fs').writeFileSync(path.join(root,'tests/tooltip-boundary-results.json'),JSON.stringify(measurements,null,2));
});

for(const viewport of [{width:1498,height:900},{width:390,height:700},{width:749,height:450}])test('page tooltip geometry and controls survive viewport '+viewport.width,async t=>{
  const {p}=await setup(t,{html:tooltipBoundaryHTML});await p.setViewportSize(viewport);
  if(viewport.width===749){const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setDeviceMetricsOverride',{width:749,height:450,deviceScaleFactor:2,mobile:false});assert.equal(await p.evaluate(()=>devicePixelRatio),2);}
  await boundaryTooltipFixture(p);
  for(const height of [40,88]){
    await p.evaluate(height=>chrome.storage.local.set({'thread-colors:v1:thread-a':{height}}),height);
    for(const focus of [false,true])for(let i=0;i<5;i++){
      const button=p.locator(`[data-tip="${i}"]`);if(focus)await button.focus();else await button.hover();
      const r=await p.evaluate(()=>window.placeFixtureTooltip());
      assert.equal(r.side,'bottom');assert.ok(r.rect.y>=height);assert.ok(r.rect.bottom<=viewport.height);assert.ok(r.rect.left>=0&&r.rect.right<=viewport.width);
      assert.equal(await p.locator('[role=tooltip]').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
    }
    if(viewport.width===390&&height===88)await p.screenshot({path:path.join(root,'tests/tooltip-390.png')});
    await checkComposer(p);
    await p.locator('.messages').evaluate(e=>e.scrollTop=500);
    const before=await p.locator('.messages').evaluate(e=>e.scrollTop);
    await modal(p);await removeModal(p);await p.locator('.bar').waitFor();
    assert.equal(await p.locator('.messages').evaluate(e=>e.scrollTop),before);await checkComposer(p);
  }
  await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:enabled':false}));
  const off=await p.evaluate(()=>({position:getComputedStyle(document.body).position,transform:getComputedStyle(document.body).transform,minHeight:getComputedStyle(document.documentElement).minHeight,active:document.documentElement.hasAttribute('data-thread-colors-active')}));
  assert.deepEqual(off,{position:'static',transform:'none',minHeight:'0px',active:false});
  await checkComposer(p);
});

test('color row labels and gaps do not activate native color inputs',async t=>{
  const {p}=await setup(t);await p.locator('.open').click();
  await p.locator('.panel').evaluate(panel=>{window.colorActivations=0;panel.addEventListener('click',e=>{if(e.target.matches('input[type=color]'))window.colorActivations++;});});
  for(const name of ['color','textColor']){
    const input=p.locator(`input[name="${name}"]`),row=p.locator('.color-row').filter({has:input});
    assert.equal(await input.evaluate(e=>e.labels.length),0);
    await row.locator('span').click();
    await row.click({position:{x:130,y:16}});
    assert.equal(await p.evaluate(()=>window.colorActivations),0);
    assert.equal(await p.locator('.panel').isVisible(),true);
    assert.ok(await input.getAttribute('aria-label'));
    await input.focus();assert.equal(await input.evaluate(e=>e.getRootNode().activeElement===e),true);
  }
  await p.locator('[data-mode=custom]').click();assert.equal(await p.evaluate(()=>window.colorActivations),0);
  await p.locator('input[name=color]').click();assert.equal(await p.evaluate(()=>window.colorActivations),1);
  await p.keyboard.press('Escape');assert.equal(await p.locator('.panel').isVisible(),true);
  await p.locator('input[name=textColor]').focus();await p.keyboard.press('Space');
  assert.equal(await p.evaluate(()=>window.colorActivations),2);
  await p.keyboard.press('Escape');assert.equal(await p.locator('.panel').isVisible(),true);
});

test('bounded performance sampling contains only counters and stops cleanly',async t=>{
  const {p}=await setup(t);await p.clock.install();
  const host=p.locator('#marusin-thread-colors');assert.equal(await host.getAttribute('data-performance-diagnostic'),null);
  await host.dispatchEvent('thread-colors-performance-start');await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await p.clock.runFor(8100);
  const raw=await host.getAttribute('data-performance-diagnostic'),d=JSON.parse(raw);
  assert.equal(d.status,'complete');assert.equal(d.cleanup,true);assert.ok(d.work.title.calls>0);
  assert.ok(!raw.includes('サンプルA'));assert.ok(!raw.includes('thread-a'));
  await p.clock.fastForward(9000);assert.equal(await host.getAttribute('data-performance-diagnostic'),raw);
  await host.dispatchEvent('thread-colors-performance-start');await p.evaluate(()=>{history.pushState({},'', '/c/thread-b');document.dispatchEvent(new Event('visibilitychange'));});await p.clock.fastForward(700);
  assert.equal(JSON.parse(await host.getAttribute('data-performance-diagnostic')).status,'navigation');
});

test('indexed title and dialogs follow node replacement and role changes',async t=>{
  const {p}=await setup(t);
  await p.evaluate(()=>{const a=document.querySelector('nav a');const b=a.cloneNode(true);b.textContent='置換後';a.replaceWith(b);});
  await p.locator('.title').filter({hasText:'置換後'}).waitFor();
  await p.evaluate(()=>{const d=document.createElement('div');d.id='changing-role';d.setAttribute('aria-modal','true');d.style.cssText='position:fixed;inset:0;background:white';document.body.append(d);});
  await p.waitForTimeout(50);await p.locator('#changing-role').evaluate(e=>e.setAttribute('role','dialog'));
  await p.waitForFunction(()=>document.querySelector('#marusin-thread-colors').style.display==='none');
  await p.locator('#changing-role').evaluate(e=>e.removeAttribute('role'));
  await p.locator('.bar').waitFor();
});

test('stable layout does not repeatedly notify page resize observers',async t=>{
  const {p}=await setup(t,{html:nestedFixture});
  await p.evaluate(()=>{window.resizeCalls=0;window.resizeProbe=new ResizeObserver(()=>window.resizeCalls++);for(const e of [document.documentElement,document.body,document.querySelector('#root')])window.resizeProbe.observe(e);});
  await p.waitForTimeout(250);await p.evaluate(()=>window.resizeCalls=0);await p.waitForTimeout(1250);
  assert.equal(await p.evaluate(()=>window.resizeCalls),0);await p.evaluate(()=>window.resizeProbe.disconnect());
});

test('focus styling retains height caps and scroll; smaller page heights still work',async t=>{
  const {p}=await setup(t,{html:nestedFixture});
  await p.locator('.messages').evaluate(e=>e.scrollTop=e.scrollHeight);
  const before=await p.locator('.messages').evaluate(e=>e.scrollTop);
  await p.evaluate(()=>{
    window.capRemovals=0;
    new MutationObserver(records=>{for(const r of records)if(!r.target.hasAttribute(r.attributeName))window.capRemovals++;}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-thread-colors-height-shell','data-thread-colors-min-shell']});
    const input=document.querySelector('#prompt-textarea'),shell=document.querySelector('.shell');
    input.addEventListener('focus',()=>{shell.classList.add('focused');shell.style.setProperty('--focus-ring','1');});
    input.addEventListener('blur',()=>{shell.classList.remove('focused');shell.style.setProperty('--focus-ring','0');});
  });
  for(let i=0;i<3;i++){await p.locator('#prompt-textarea').click();await p.locator('#send').focus();}
  await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>window.capRemovals),0);
  assert.equal(await p.locator('.messages').evaluate(e=>e.scrollTop),before);
  await checkComposer(p);
  await p.locator('.conversation').evaluate(e=>e.style.height='300px');await p.waitForTimeout(100);
  assert.equal(await p.locator('.conversation').evaluate(e=>getComputedStyle(e).height),'300px');
  await p.locator('.conversation').evaluate(e=>e.style.removeProperty('height'));
  await p.setViewportSize({width:640,height:450});await p.waitForTimeout(100);await checkComposer(p);
});

test('individual OFF cancels unsubmitted edit so later outside click cannot save',async t=>{
 const {p}=await setup(t);await renameFixture(p);await editName(p,'未保存の名前');
 await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:display:thread-a':false}));
 assert.equal(await p.locator('#marusin-thread-colors').isVisible(),false);
 await p.locator('textarea').click();assert.equal(await p.evaluate(()=>window.nativeSaves),0);
 assert.equal(await p.locator('.title-input').evaluate(e=>e.hidden),true);
 await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:display:thread-a':true}));
 assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await p.locator('.title').isVisible(),true);
});
test('individual OFF during native save restores owned modal without resending',async t=>{
 const {p}=await setup(t);await pairedDialogFixture(p,{mode:'stay'});await editName(p);await commitName(p);
 await p.waitForFunction(()=>window.nativeSaves===1);
 await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:display:thread-a':false}));
 await p.waitForFunction(()=>[document.querySelector('#marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
 assert.equal(await p.evaluate(()=>window.nativeSaves),1);assert.equal(await p.locator('.rename-progress').textContent(),'');
 assert.equal(await p.locator('[role="dialog"]').evaluate(e=>getComputedStyle(e).opacity),'1');
 assert.equal(await p.locator('.rename-success').textContent(),'');
});

for(const order of ['end-before-release','release-before-end','229-unidentified'])test('029 IME next independent Enter immediately saves once: '+order,async t=>{
 const {p}=await setup(t);await renameFixture(p);await editName(p);
 await p.locator('.title-input').evaluate((e,order)=>{
  e.dispatchEvent(new CompositionEvent('compositionstart'));
  e.dispatchEvent(new KeyboardEvent('keydown',{key:order==='229-unidentified'?'Unidentified':'Enter',keyCode:229,isComposing:true,bubbles:true}));
  const release=()=>e.dispatchEvent(new KeyboardEvent('keyup',{key:order==='229-unidentified'?'Unidentified':'Enter',keyCode:order==='229-unidentified'?229:13,bubbles:true}));
  if(order==='release-before-end')release();
  e.dispatchEvent(new CompositionEvent('compositionend'));
  if(order!=='release-before-end')release();
  e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true}));
  e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 },order);
 await nameConfirmed(p);assert.equal(await p.evaluate(()=>nativeSaves),1);
});

test('032 hide button cancels editing without a save and preserves an already submitted rename',async t=>{
 const {p,data}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true,nativeDelay:700});await editName(p);
 await p.locator('.hide-chat').click();await p.waitForFunction(()=>document.getElementById('marusin-thread-colors').style.display==='none');assert.equal(await p.evaluate(()=>nativeSaves),0);assert.equal(data[prefix+'display:thread-a'],false);
 await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:display:thread-a':true}));await p.locator('.bar').waitFor();await editName(p);await commitName(p);await p.waitForFunction(()=>nativeSaves===1);
 await p.locator('.hide-chat').click();await p.waitForFunction(()=>[document.getElementById('marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
 assert.equal(await p.evaluate(()=>nativeSaves),1);assert.equal(await p.locator('[role=dialog]').count(),0);assert.equal(await p.locator('nav a[href="/c/thread-a"] .truncate').textContent(),'新しい名前');assert.equal(await p.locator('html').getAttribute('data-thread-colors-active'),null);
});

test('032 individual OFF during submitted rename error restores native dialog',async t=>{
 const {p}=await setup(t);await pairedDialogFixture(p,{overlayAriaHidden:true,mode:'stay'});await editName(p);await commitName(p);await p.waitForFunction(()=>nativeSaves===1);await p.locator('.hide-chat').click();
 await p.locator('[role=dialog]').evaluate(d=>{const e=document.createElement('div');e.role='alert';e.textContent='fixture error';d.append(e);});
 await p.waitForFunction(()=>[document.getElementById('marusin-thread-colors').shadowRoot].every(s=>s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent));
 assert.equal(await p.evaluate(()=>nativeSaves),1);assert.equal(await p.locator('[role=dialog]').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await p.locator('.codex-dialog-overlay').evaluate(e=>e.style.opacity),'0.9');await p.waitForFunction(()=>getComputedStyle(document.querySelector('.codex-dialog-overlay')).opacity==='0.9');assert.equal(await p.locator('html').getAttribute('data-thread-colors-active'),null);
});


for(const locale of ['ja','en'])test(`native language: ${locale} enter outside cancel and one save`,async t=>{
 const {p}=await setup(t);await p.evaluate(locale=>document.documentElement.lang=locale+'-'+(locale==='en'?'US':'JP'),locale);await renameFixture(p,{locale});
 await editName(p,'cancelled');await p.locator('.cancel-title').click();assert.equal(await p.evaluate(()=>window.nativeSaves),0);
 await editName(p,'First');await commitName(p);await nameConfirmed(p,'First');
 await editName(p,'Second');await p.locator('header').click();await nameConfirmed(p,'Second');
 assert.equal(await p.evaluate(()=>window.nativeSaves),2);assert.deepEqual(await p.evaluate(()=>window.renameClicks),['thread-a','thread-a']);assert.equal(await p.evaluate(()=>window.wrongAction),undefined);
});
test('native language: unsupported and missing lang are plain selectable text',async t=>{
 const {p}=await setup(t);await renameFixture(p);
 for(const lang of ['ko-KR','zh-CN','zh-TW','es','pt-BR','','unknown','english']){
  await p.evaluate(lang=>document.documentElement.lang=lang,lang);
  const title=p.locator('#marusin-thread-colors .title');await p.waitForFunction(()=>!document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title').hasAttribute('role'));
  assert.equal(await title.getAttribute('tabindex'),null);assert.equal(await title.getAttribute('aria-label'),null);
  await title.click();await title.dispatchEvent('keydown',{key:'Enter',bubbles:true});await title.dispatchEvent('keydown',{key:' ',bubbles:true});
  assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await title.evaluate(e=>getComputedStyle(e).userSelect),'text');
 }
 assert.deepEqual(await p.evaluate(()=>window.renameClicks),[]);
 await p.evaluate(()=>document.documentElement.lang='en');await renameFixture(p,{locale:'en'});
 await p.locator('#marusin-thread-colors .title').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.title-input').isVisible(),true);
});
test('native language: change during editing or menu wait aborts without save',async t=>{
 const {p}=await setup(t);await renameFixture(p);await editName(p,'Draft');await p.evaluate(()=>document.documentElement.lang='ko');await p.waitForFunction(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-input').hidden);
 await p.evaluate(()=>document.documentElement.lang='en');await renameFixture(p,{locale:'en',delay:500});await editName(p,'Draft');await commitName(p);
 await p.waitForFunction(()=>window.renameClicks.length===1);await p.evaluate(()=>document.documentElement.lang='ja');
 await p.waitForFunction(()=>!document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.rename-progress').textContent);
 await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.equal(await p.locator('[role="dialog"]').count(),0);assert.equal(await p.locator('.title-input').isVisible(),false);
});
for(const mode of ['mismatch','ambiguous','badAssociation'])test(`native language: english rejects ${mode}`,async t=>{
 const {p}=await setup(t);await p.evaluate(()=>document.documentElement.lang='en');await renameFixture(p,{locale:'en',...(mode==='mismatch'?{mode}:{[mode]:true})});
 await p.locator('#marusin-thread-colors .title').click();if(mode!=='ambiguous'){await p.locator('.title-input').fill('Unsafe');await commitName(p);}
 await waitRenameFailure(p);assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.equal(await p.evaluate(()=>window.wrongAction),undefined);
});

test('native language: popup language never enables unsupported native lang',async t=>{
 const {p}=await setup(t,{extensionLanguage:'en'});await renameFixture(p);
 for(const native of ['ko','ja','en']){
  await p.evaluate(native=>document.documentElement.lang=native,native);
  for(const locale of ['en','ja','ko','zh_CN','zh_TW','es','pt_BR']){
   await p.evaluate(locale=>chrome.storage.local.set({'thread-colors:v1:language':locale}),locale);
   await p.waitForFunction(locale=>ColorsI18n.locale===locale,locale);
   assert.equal(await p.locator('#marusin-thread-colors .title').getAttribute('role'),native==='ko'?null:'button');
  }
 }
});
test('native language: english suppression restored on lang change after submit, no resend',async t=>{
 const {p}=await setup(t);await p.evaluate(()=>document.documentElement.lang='en');await pairedDialogFixture(p,{locale:'en',mode:'stay'});
 await editName(p,'Pending');await commitName(p);await p.waitForFunction(()=>window.nativeSaves===1);
 assert.equal(await p.locator('[role="dialog"]').evaluate(e=>getComputedStyle(e).opacity),'0');
 await p.evaluate(()=>document.documentElement.lang='ko');
 await p.waitForFunction(()=>document.querySelector('[role="dialog"]').style.opacity!=='0');
 assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await p.locator('.title').getAttribute('role'),null);
 assert.equal(await p.evaluate(()=>window.nativeSaves),1);
 assert.ok(await p.locator('[role="dialog"] button[type="button"]').isVisible());
 await p.locator('[role="dialog"] button[type="button"]').click();
});

for(const condition of ['duplicate-label','language-before-submit'])test(`native language: ${condition} never submits`,async t=>{
 const {p}=await setup(t);await p.evaluate(()=>document.documentElement.lang='en');await pairedDialogFixture(p,{locale:'en'});
 await p.evaluate(condition=>{
  if(condition==='duplicate-label'){
   const seen=new WeakSet();new MutationObserver(()=>{for(const m of document.querySelectorAll('[role="menu"]'))if(!seen.has(m)){seen.add(m);m.append(m.lastChild.cloneNode(true));}}).observe(document.body,{childList:true,subtree:true});
  }else document.addEventListener('input',e=>{if(e.target.matches('[role="dialog"] input'))document.documentElement.lang='ja';});
 },condition);
 await editName(p,'Not saved');await commitName(p);
 await waitRenameFailure(p);
 assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.equal(await p.evaluate(()=>window.wrongAction),undefined);
 assert.equal(await p.locator('.title-input').isVisible(),false);
 if(condition==='language-before-submit')assert.notEqual(await p.locator('[role="dialog"]').evaluate(e=>getComputedStyle(e).opacity),'0');
});
test('native language: english successful paired dialog suppression',async t=>{
 const {p}=await setup(t);await p.evaluate(()=>document.documentElement.lang='en-US');await pairedDialogFixture(p,{locale:'en'});await editName(p,'English result');await commitName(p);await nameConfirmed(p,'English result');
 const frames=await p.evaluate(()=>window.quietFrames);assert.ok(frames.length);assert.ok(frames.every(f=>f.dialog==='0'&&f.overlay==='0'));assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

async function failureIdle(p){
 await p.waitForFunction(()=>{const s=document.querySelector('#marusin-thread-colors').shadowRoot;return s.querySelector('.title').getAttribute('aria-busy')!=='true'&&s.querySelector('.title-input').hidden&&!s.querySelector('.rename-progress').textContent;});
 const d=await p.locator('#marusin-thread-colors').getAttribute('data-rename-diagnostic');
 if(d){const e=JSON.parse(d).events.findLast(e=>e.kind==='finished');assert.ok(e);assert.equal(e.busy,false);assert.equal(e.activeWaits,0);assert.equal(e.observerActive,false);assert.equal(e.overallTimerActive,false);assert.equal(e.quiet,false);}
}
for(const fault of ['begin-measure','start-trace','wait-observe','cleanup-probe'])test(`failure recovery: ${fault} cleans and allows explicit retry`,async t=>{
 const {p}=await setup(t);await pairedDialogFixture(p,{mode:fault==='cleanup-probe'?'stay':'save'});
 if(fault==='begin-measure'){
  await p.evaluate(()=>{const e=document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title-measure');const old=e.getBoundingClientRect.bind(e);e.getBoundingClientRect=()=>{e.getBoundingClientRect=old;throw Error('injected measure');};});
  await p.locator('.title').click();
 }else{
  await editName(p,'First attempt');
  await p.evaluate(fault=>{
   if(fault==='wait-observe'){const old=MutationObserver.prototype.observe;MutationObserver.prototype.observe=function(...args){if(new Error().stack.includes('waitFor')){MutationObserver.prototype.observe=old;throw Error('injected observe');}return old.apply(this,args);};}
   else{const host=document.querySelector('#marusin-thread-colors'),old=host.setAttribute.bind(host);host.setAttribute=(key,value)=>{if(key==='data-rename-diagnostic'){const e=JSON.parse(value).events.at(-1);if((fault==='start-trace'&&e.kind==='start')||(fault==='cleanup-probe'&&e.phase==='before-release')){host.setAttribute=old;throw Error('injected diagnostic');}}return old(key,value);};}
  },fault);
  await commitName(p);
  if(fault==='cleanup-probe'){
   await p.waitForFunction(()=>window.nativeSaves===1);
   await p.evaluate(()=>{const d=document.querySelector('[role="dialog"]');d.insertAdjacentHTML('beforeend','<div role="alert">Save error</div>');});
  }
 }
 await failureIdle(p);
 if(fault==='cleanup-probe'){
  assert.equal(await p.locator('[role="dialog"]').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await p.locator('.codex-dialog-overlay').evaluate(e=>e.style.opacity),'0.9');
  await p.locator('[role="dialog"] button[type="button"]').click();await p.locator('.bar').waitFor();
 }
 // Simulate user closing a native menu, without extension dismissing it.
 await p.evaluate(()=>document.querySelector('[role="menu"]')?.remove());
 await renameFixture(p);await editName(p,'Retry success');await commitName(p);await nameConfirmed(p,'Retry success');assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});
for(const fault of ['missing-item','missing-input','missing-submit','removed-target'])test(`failure recovery: ${fault} leaves native UI available`,async t=>{
 const {p}=await setup(t);await renameFixture(p);
 await editName(p,'Not saved');
 await p.evaluate(fault=>{
  if(fault==='removed-target'){document.querySelector('nav').lastChild.remove();return;}
  const seen=new WeakSet();window.failureObserver=new MutationObserver(()=>{
   for(const e of document.querySelectorAll('[role="menu"],[role="dialog"]'))if(!seen.has(e)){
    seen.add(e);if(fault==='missing-item'&&e.matches('[role="menu"]'))e.lastChild.remove();
    if(fault==='missing-input')e.querySelector('input')?.remove();
    if(fault==='missing-submit')e.querySelector('[type="submit"]')?.remove();
   }
  });window.failureObserver.observe(document.body,{subtree:true,childList:true});
 },fault);
 await commitName(p);await failureIdle(p);assert.equal(await p.evaluate(()=>window.nativeSaves),0);assert.equal(await p.evaluate(()=>window.wrongAction),undefined);
 if(await p.locator('[role="dialog"]').count()){assert.equal(await p.locator('[role="dialog"]').evaluate(e=>getComputedStyle(e).opacity),'1');await p.locator('[role="dialog"] button[type="button"]').click();}
 await p.evaluate(()=>{window.failureObserver?.disconnect();document.querySelector('[role="menu"]')?.remove();});
 await renameFixture(p);await editName(p,'Recovered');await commitName(p);await nameConfirmed(p,'Recovered');assert.equal(await p.evaluate(()=>window.nativeSaves),1);
});

test('failure recovery: whole-operation watchdog aborts wait and permits retry',async t=>{
 const {p}=await setup(t);await renameFixture(p,{missing:true});
 await p.evaluate(()=>{const old=setTimeout;window.setTimeout=(cb,ms,...args)=>{if(ms===20000)window.operationWatchdog=cb;return old(cb,ms,...args);};});
 await editName(p);await commitName(p);await p.waitForFunction(()=>window.renameClicks.length===1);
 await p.evaluate(()=>window.operationWatchdog());await failureIdle(p);assert.equal(await p.evaluate(()=>window.nativeSaves),0);
 await p.evaluate(()=>window.renameOptions.missing=false);await editName(p,'Retry');await commitName(p);await nameConfirmed(p,'Retry');
});
test('failure recovery: missing native dialog times out and permits retry',async t=>{
 const {p}=await setup(t);await renameFixture(p);
 await p.evaluate(()=>{const observer=new MutationObserver(()=>{const m=document.querySelector('[role="menu"]');if(m){m.lastChild.onclick=()=>m.remove();observer.disconnect();}});observer.observe(document.body,{subtree:true,childList:true});});
 await editName(p);await commitName(p);await waitRenameFailure(p);await failureIdle(p);
 assert.equal(await p.evaluate(()=>window.nativeSaves),0);await renameFixture(p);await editName(p,'Retry');await commitName(p);await nameConfirmed(p,'Retry');
});

async function waitRenameFailure(p){
 await p.waitForFunction(()=>{const h=document.querySelector('#marusin-thread-colors');const d=JSON.parse(h.getAttribute('data-rename-diagnostic')||'{}');return d.events?.some(e=>e.kind==='failure')&&h.shadowRoot.querySelector('.title').getAttribute('aria-busy')!=='true';});
 assert.equal(await p.locator('.rename-notice').isVisible(),false);
 assert.equal(await p.locator('.rename-status').textContent(),'');
}

test('silent failure: unknown result restores confirmed title and explicit retry starts fresh',async t=>{
 const {p}=await setup(t);await renameFixture(p,{mode:'unknown'});await editName(p,'UNCONFIRMED');await commitName(p);await waitRenameFailure(p);
 assert.equal(await p.locator('.title').textContent(),'サンプルA開発');assert.equal(await p.locator('.rename-progress').textContent(),'');assert.equal(await p.locator('.title-input').isVisible(),false);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
 await p.locator('.title').click();assert.equal(await p.locator('.title-input').inputValue(),'サンプルA開発');
 await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>window.nativeSaves),1);
 await p.locator('.cancel-title').click();await p.evaluate(()=>window.renameOptions.mode='save');await editName(p,'Confirmed retry');await commitName(p);await nameConfirmed(p,'Confirmed retry');assert.equal(await p.evaluate(()=>window.nativeSaves),2);
});

test('display polish: seven headings and unconditional guidance preserve native edit eligibility',async t=>{
 const {p}=await setup(t,{extensionLanguage:'ja'});await renameFixture(p);
 const headings={ja:'このチャットの色設定',en:'Colors for this chat',ko:'이 채팅의 색상 설정',zh_CN:'此聊天的颜色设置',zh_TW:'此聊天的色彩設定',es:'Colores de este chat',pt_BR:'Cores desta conversa'};
 for(const [locale,heading] of Object.entries(headings)){
  await p.evaluate(locale=>chrome.storage.local.set({'thread-colors:v1:language':locale}),locale);
  assert.ok((await p.locator('.heading').textContent()).startsWith(heading));
  assert.equal(await p.locator('.full-title').count(),0);
  for(const lang of ['ja','en-US','ko','','unknown']){
   await p.evaluate(lang=>document.documentElement.lang=lang,lang);
   const expected=lang==='ja'||lang==='en-US';
   await p.waitForFunction(expected=>{const s=document.querySelector('#marusin-thread-colors').shadowRoot;return s.querySelector('.usage li:nth-child(2)').hidden===false&&s.querySelector('.title').hasAttribute('role')===expected;},expected);
  }
 }
 await p.evaluate(()=>{document.documentElement.lang='ja';history.pushState({},'','/');});
 await p.waitForFunction(()=>{const s=document.querySelector('#marusin-thread-colors').shadowRoot;return !s.querySelector('.usage li:nth-child(2)').hidden&&!s.querySelector('.title').hasAttribute('role');});
 await p.locator('.bar').waitFor({state:'hidden'});
 await p.evaluate(()=>history.pushState({},'','/c/thread-a'));await p.locator('.bar').waitFor();
 await p.waitForFunction(()=>!document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.usage li:nth-child(2)').hidden);
 await p.evaluate(()=>chrome.storage.local.set({'thread-colors:v1:enabled':false}));
 assert.equal(await p.locator('.usage li').nth(1).evaluate(e=>e.hidden),false);
});
test('display polish: inset controls keep long title and editor centered without overlap',async t=>{
 const {p}=await setup(t);await renameFixture(p);
 await p.evaluate(()=>document.querySelector('nav').lastChild.querySelector('.truncate').textContent='Long title 日本語 '.repeat(30));
 for(const width of [1280,640,320,240]){
  await p.setViewportSize({width,height:700});
  await p.locator('.title').filter({hasText:'Long title'}).waitFor();
  const r=await p.locator('.title').evaluate(e=>{const s=e.getRootNode(),t=e.getBoundingClientRect(),l=s.querySelector('.hide-chat').getBoundingClientRect(),b=s.querySelector('.open').getBoundingClientRect();return {center:t.x+t.width/2,left:t.left,right:t.right,closeLeft:l.left,closeRight:l.right,closeWidth:l.width,openLeft:b.left,inset:innerWidth-b.right};});
  assert.equal(r.center,width/2);assert.equal(r.closeLeft,width<=320?Math.min(44,Math.max(6,(width-240)/2+6)):44);assert.equal(r.closeWidth,40);assert.equal(r.inset,width<=320?Math.min(44,Math.max(6,(width-240)/2+6)):width<=520?44:50);assert.ok(r.left>=r.closeRight);assert.ok(r.right<=r.openLeft);
  await p.locator('.title').click();
  const edit=await p.locator('.title-input').evaluate(e=>{const r=e.getBoundingClientRect(),s=e.getRootNode();return {center:r.x+r.width/2,left:r.left,right:r.right,close:s.querySelector('.hide-chat').getBoundingClientRect().right,cancel:s.querySelector('.cancel-title').getBoundingClientRect().left};});
  assert.equal(edit.center,width/2);assert.ok(edit.left>=edit.close);assert.ok(edit.right<=edit.cancel);await p.locator('.cancel-title').click();
 }
});

for(const collapse of ['hidden','removed'])test(`project title retention: ${collapse}, restore, route and native update`,async t=>{
 const {p}=await setup(t);await renameFixture(p);
 await p.locator('.title').filter({hasText:'サンプルA開発'}).waitFor();
 await p.evaluate(collapse=>{window.projectRow=document.querySelector('nav').lastChild;if(collapse==='hidden')window.projectRow.hidden=true;else window.projectRow.remove();document.title='ChatGPT';},collapse);
 await p.waitForTimeout(700);
 assert.equal(await p.locator('.title').textContent(),'サンプルA開発');
 await p.locator('.title').click();assert.equal(await p.locator('.title-input').isVisible(),false);
 assert.equal(await p.evaluate(()=>window.renameClicks.length),0);
 await p.evaluate(()=>history.pushState({},'','/c/thread-b'));
 await p.locator('.title').filter({hasText:'サンプルB開発'}).waitFor();
 await p.evaluate(()=>history.pushState({},'','/c/thread-a'));
 await p.waitForFunction(()=>document.querySelector('#marusin-thread-colors').shadowRoot.querySelector('.title').textContent==='サンプルA開発');
 await p.evaluate(()=>{window.projectRow.hidden=false;document.querySelector('nav').append(window.projectRow);window.projectRow.querySelector('.truncate').textContent='Native changed';});
 await p.locator('.title').filter({hasText:'Native changed'}).waitFor();
 await editName(p,'Confirmed edit');await commitName(p);await nameConfirmed(p,'Confirmed edit');
 await p.evaluate(()=>window.projectRow.remove());await p.waitForTimeout(700);
 assert.equal(await p.locator('.title').textContent(),'Confirmed edit');
});
test('project title retention: failed draft is never retained',async t=>{
 const {p}=await setup(t);await renameFixture(p,{badAssociation:true});
 await editName(p,'UNCONFIRMED');await commitName(p);await waitRenameFailure(p);
 await p.evaluate(()=>{document.querySelector('nav').lastChild.remove();document.title='ChatGPT';});await p.waitForTimeout(700);
 assert.equal(await p.locator('.title').textContent(),'サンプルA開発');
 assert.equal(await p.locator('.title-input').isVisible(),false);
 assert.equal(await p.locator('.rename-progress').textContent(),'');
 assert.equal(await p.evaluate(()=>window.nativeSaves),0);
});

test('project title diagnostic: bounded read-only snapshot excludes names and IDs',async t=>{
 const {p}=await setup(t);await renameFixture(p);
 await p.addScriptTag({path:path.join(root,'diagnostics/project-title.js')});
 await p.waitForFunction(()=>window.__ctcProjectDiagnostic.status==='complete');
 const result=await p.evaluate(()=>window.__ctcProjectDiagnostic);
 assert.equal(result.matchingLinkCount,1);assert.equal(result.links[0].reason,'unique-row');
 assert.equal(result.links[0].buttons.length,1);
 assert.doesNotMatch(JSON.stringify(result),/サンプルA|サンプルB|thread-a|thread-b/);
 assert.equal(await p.evaluate(()=>window.renameClicks.length),0);assert.equal(await p.evaluate(()=>window.nativeSaves),0);
});

test('usage guide: seven locales keep four ordered groups readable at narrow widths',async t=>{
 const {p}=await setup(t,{extensionLanguage:'ja'});await p.locator('.open').click();await p.locator('.usage summary').click();
 for(const locale of ['ja','en','ko','zh_CN','zh_TW','es','pt_BR']){
  await p.evaluate(locale=>chrome.storage.local.set({'thread-colors:v1:language':locale}),locale);
  for(const width of [640,320]){
   await p.setViewportSize({width,height:600});
   const report=await p.locator('.usage').evaluate(e=>{
    const panel=e.closest('.panel'),r=panel.getBoundingClientRect();
    const dict=globalThis.ColorsMessages[globalThis.ColorsI18n.locale];
    const values=new Set(Object.values(dict).map(x=>x.message));
    const texts=[...e.querySelectorAll('h3,p')];
    return {groups:e.querySelectorAll('ol > li').length,allTranslated:texts.every(x=>values.has(x.textContent)),allShown:texts.every(x=>!x.hidden&&getComputedStyle(x).display!=='none'),overflow:panel.scrollWidth>panel.clientWidth,bounds:texts.every(x=>{const b=x.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right;}),headings:[...e.querySelectorAll('h3')].map(x=>x.textContent)};
   });
   assert.equal(report.groups,4);assert.equal(report.allTranslated,true);assert.equal(report.allShown,true);assert.equal(report.overflow,false);assert.equal(report.bounds,true);
   if(locale==='ja')assert.deepEqual(report.headings,['チャットごとに色を設定','帯・枠・文字を調整','チャット名を変更','このチャットの色表示をOFF']);
  }
 }
 await p.evaluate(()=>document.documentElement.lang='ko');
 assert.equal(await p.locator('.usage li').nth(2).evaluate(e=>e.hidden),false);
});
