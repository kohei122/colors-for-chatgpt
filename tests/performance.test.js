const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),results=[];
const versions=process.env.CTC_COMPARE_BASELINE?['baseline','current']:['current'];
for(const version of versions)for(const enabled of [true,false,'absent'])test(`long DOM work counters ${version} enabled=${enabled}`,async t=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox'],headless:true});t.after(()=>browser.close());
  const p=await browser.newPage();
  await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><style>html,body{margin:0}#root{height:100dvh}.focus-shell{height:100dvh;display:flex;flex-direction:column}main{flex:1;overflow:auto}textarea{height:60px;flex:none}</style><div id="root"><div class="focus-shell h-dvh"><nav><a href="/c/a">Fixture</a></nav><main></main><textarea id="prompt-textarea"></textarea></div></div>'}));
  await p.goto('https://chatgpt.com/c/a');
  await p.evaluate(enabled=>{
    window.chrome={storage:{local:{get:async key=>({[key]:key.includes(':display:')?true:key.endsWith('enabled')?enabled:undefined}),set:async()=>{}},onChanged:{addListener(){}}}};
    const main=document.querySelector('main'),fragment=document.createDocumentFragment();
    for(let i=0;i<5000;i++){const e=document.createElement('div');e.innerHTML='<span><b>Fixture</b><a href="/c/message-link">Link</a></span>';fragment.append(e);}main.append(fragment);
    window.workNodes={root:document.querySelector('.focus-shell'),main,input:document.querySelector('textarea')};
    window.stats={};window.resetStats=()=>window.stats={documentQueries:0,elementQueries:0,queryMs:0,styles:0,rects:0,measureMs:0,correctionRemovals:0,focusMs:0};
    window.resetStats();
    const remove=Element.prototype.removeAttribute;Element.prototype.removeAttribute=function(name){if(name.startsWith('data-thread-colors-')&&this.hasAttribute(name))window.stats.correctionRemovals++;return remove.call(this,name);};
    const input=window.workNodes.input,container=window.workNodes.root;input.addEventListener('focus',()=>{container.classList.add('focused');container.style.setProperty('--focused','1');});input.addEventListener('blur',()=>{container.classList.remove('focused');container.style.setProperty('--focused','0');});
    for(const [proto,key,count] of [[Document.prototype,'querySelectorAll','documentQueries'],[Document.prototype,'querySelector','documentQueries'],[Element.prototype,'querySelector','elementQueries'],[Element.prototype,'querySelectorAll','elementQueries']]){
      const original=proto[key];proto[key]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{window.stats[count]++;window.stats.queryMs+=performance.now()-start;}};
    }
    const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){const s=performance.now();try{return rect.call(this);}finally{window.stats.rects++;window.stats.measureMs+=performance.now()-s;}};
    const computed=window.getComputedStyle;window.getComputedStyle=function(...args){const s=performance.now();try{const css=computed.apply(this,args);return new Proxy(css,{get(target,key){const start=performance.now();try{const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}finally{window.stats.measureMs+=performance.now()-start;}}});}finally{window.stats.styles++;window.stats.measureMs+=performance.now()-s;}};
  },enabled);
  if(enabled!=='absent'){
  await p.addScriptTag({path:path.join(root,'core.js')});
  await p.addScriptTag({path:path.join(root,version==='baseline'?'tests/performance-baseline-local.js':'content.js')});
  }
  await p.waitForTimeout(800);
  const phases={};
  for(const phase of ['idle','focus','scroll','input','tooltip']){
    await p.evaluate(phase=>{
      window.resetStats();let tick=0;
      window.workTimer=setInterval(()=>{
        const {root,main,input}=window.workNodes;
        if(phase==='focus'){const start=performance.now();if(document.activeElement===input)input.blur();else input.focus();window.stats.focusMs+=performance.now()-start;}
        if(phase==='scroll'){main.scrollTop+=50;root.style.setProperty('--fixture-scroll',String(++tick));}
        if(phase==='input'){input.value+='x';input.dispatchEvent(new Event('input',{bubbles:true}));root.classList.toggle('typing');}
        if(phase==='tooltip'){const tip=document.createElement('div');tip.setAttribute('role','tooltip');tip.style.cssText='position:fixed;top:100px;left:100px';document.body.append(tip);setTimeout(()=>tip.remove(),30);}
      },50);
    },phase);
    await p.waitForTimeout(1250);
    phases[phase]=await p.evaluate(()=>{clearInterval(window.workTimer);return window.stats;});
  }
  results.push({version,enabled,nodes:20000,phases});
  if(version==='current'){
    assert.equal(phases.idle.documentQueries,0);
    assert.equal(phases.idle.styles,0);assert.equal(phases.idle.rects,0);
    assert.equal(phases.focus.correctionRemovals,0);
    for(const phase of ['scroll','input'])assert.ok(phases[phase].elementQueries<10,JSON.stringify(phases[phase]));
  }
});
test.after(()=>{
  fs.writeFileSync(path.join(root,'tests/performance-results.json'),JSON.stringify(results,null,2));
});
