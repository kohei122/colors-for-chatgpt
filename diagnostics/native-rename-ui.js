/* Read-only two-stage evidence: start before opening the current chat menu.
 * Manually choose Rename after the menu appears. 10 seconds per stage.
 * No automatic clicks, input, saves, network or clipboard writes. */
(()=>{
 'use strict';
 window.__ctcNativeRenameStop?.();
 const thread=value=>{try{const u=new URL(value,location.href);return u.origin==='https://chatgpt.com'?u.pathname.match(/^\/(?:g\/[^/]+\/)?c\/([a-zA-Z0-9-]+)\/?$/)?.[1]||null:null;}catch{return null;}};
 const current=thread(location.href),refs=new WeakMap();let nextRef=0,observer,timer,pending=0,poll,stopped=false,menuElement=null,selected=false;
 const dialogSelector='[role="dialog"][aria-modal="true"],dialog[open]';
 const initialDialogs=new Set(document.querySelectorAll(dialogSelector));
 const result={diagnostic:'native-rename-ui-v3',productVersion:'1.0.1',htmlLanguage:document.documentElement.lang,stages:[],status:'waiting-menu',samples:0,cleanup:false};
 window.__ctcNativeRenameDiagnostic=result;
 const ref=e=>{if(!e)return null;if(!refs.has(e))refs.set(e,++nextRef);return refs.get(e);};
 let links=current?[...document.querySelectorAll('a[href*="/c/"]')].filter(e=>!e.closest('main,article,[data-message-author-role]')&&thread(e.href)===current):[];
 const names=links.map(e=>(e.querySelector('.truncate')||e).textContent.trim()).filter(Boolean);
 const clean=value=>{let s=String(value||'').replace(/\s+/g,' ').trim();for(const secret of [current,...names].filter(Boolean))s=s.split(secret).join('[redacted]');return s.slice(0,120);};
 const visible=e=>e.isConnected&&!e.closest('[hidden],[inert],[aria-hidden="true"]')&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&e.getClientRects().length>0;
 const shape=e=>({ref:ref(e),tag:e.tagName.toLowerCase(),role:e.getAttribute('role'),type:e.getAttribute('type'),ariaLabel:clean(e.getAttribute('aria-label')),data:Object.fromEntries(['data-state','data-side','data-overlay-owner'].filter(k=>e.hasAttribute(k)).map(k=>[k,clean(e.getAttribute(k))])),hasPopup:e.getAttribute('aria-haspopup'),expanded:e.getAttribute('aria-expanded'),disabled:e.matches(':disabled')||e.getAttribute('aria-disabled')==='true',visible:Boolean(visible(e))});
 function stop(reason){if(stopped)return;stopped=true;observer?.disconnect();clearTimeout(timer);clearTimeout(pending);clearInterval(poll);document.removeEventListener('click',onClick,true);window.removeEventListener('pagehide',exit);result.reason=reason;result.status=reason==='complete'?'complete':'stopped';result.cleanup=true;if(window.__ctcNativeRenameStop===stop)delete window.__ctcNativeRenameStop;console.log('Colors for ChatGPT: native rename diagnostic ready in __ctcNativeRenameDiagnostic');}
 function exit(){stop('navigation');}
 function deadline(){clearTimeout(timer);timer=setTimeout(()=>stop(thread(location.href)===current?'deadline':'navigation'),10000);}
 function onClick(event){
  if(stopped||selected||!menuElement)return;
  const item=event.target instanceof Element?event.target.closest('[role="menuitem"]'):null;
  if(!item||!menuElement.contains(item))return;
  if(thread(location.href)!==current){stop('navigation');return;}
  selected=true;result.selectedItemRef=ref(item);result.status='waiting-dialog';
 }
 function captureDialog(){
  if(!selected)return;
  const dialogs=[...document.querySelectorAll(dialogSelector)].filter(visible);
  result.dialogCandidateCount=dialogs.length;
  if(dialogs.length>1){stop('ambiguous-dialog');return;}
  if(!dialogs.length)return;
  const d=dialogs[0];if(initialDialogs.has(d)){stop('preexisting-dialog');return;}
  const forms=[...d.querySelectorAll('form')],inputs=[...d.querySelectorAll('input:not([type="hidden"]),textarea,[contenteditable="true"]')];
  if(forms.length!==1||inputs.length!==1||!inputs[0].matches('input:not([type]),input[type="text"]')||inputs[0].form!==forms[0]){result.dialogUncapturedReason='unsupported-form-structure';return;}
  const buttons=[...d.querySelectorAll('button')];
  if(buttons.length>8||buttons.filter(e=>e.type==='submit'&&e.form===forms[0]).length!==1){result.dialogUncapturedReason='ambiguous-submit';return;}
  result.stages.push({stage:'dialog',association:'user-selected-item-followed-by-new-form-dialog',dialog:shape(d),parent:{tag:d.parentElement?.tagName.toLowerCase(),role:d.parentElement?.getAttribute('role')},form:shape(forms[0]),headings:[...d.querySelectorAll('h1,h2,[role="heading"]')].slice(0,3).map(e=>clean(e.textContent)),input:{...shape(inputs[0]),placeholder:clean(inputs[0].getAttribute('placeholder'))},buttons:buttons.map(e=>({...shape(e),label:clean(e.textContent),sameForm:e.form===forms[0]}))});
  console.log('Colors for ChatGPT: dialog captured (2/2).');stop('complete');
 }
 if(!current){stop('no-chat-id');return;}
 result.matchingLinkCount=links.length;
 function targets(){
  const candidates=new Set();
  for(const link of links){let row=link.parentElement;for(let depth=1;row&&row!==document.body&&depth<=7;depth++,row=row.parentElement){
   if([...row.querySelectorAll('a[href*="/c/"]')].some(e=>thread(e.href)!==current))break;
   const buttons=[...row.querySelectorAll('button[aria-haspopup="menu"],[role="button"][aria-haspopup="menu"]')];
   if(buttons.length){buttons.forEach(e=>candidates.add(e));break;}
  }}return [...candidates];
 }
 function safelySample(){try{sample();}catch{stop('diagnostic-error');}}
 function sample(){
  pending=0;if(stopped)return;if(thread(location.href)!==current){stop('navigation');return;}
  if(++result.samples>161){stop('sample-limit');return;}
  if(result.stages.length){captureDialog();return;}
  links=[...document.querySelectorAll('a[href*="/c/"]')].filter(e=>!e.closest('main,article,[data-message-author-role]')&&thread(e.href)===current);
  result.matchingLinkCount=links.length;
  for(const link of links){const name=(link.querySelector('.truncate')||link).textContent.trim();if(name&&!names.includes(name))names.push(name);}
  const candidates=targets();result.candidateCount=candidates.length;result.candidates=candidates.slice(0,8).map(shape);
  if(!links.length||!candidates.length)return;
  if(links.length!==1||candidates.length!==1){stop('ambiguous-row');return;}
  const button=candidates[0],key=button.getAttribute('aria-controls');
  const menus=key?[...document.querySelectorAll('#'+CSS.escape(key))]:[];
  const menu=menus.length===1&&menus[0].matches('[role="menu"]')&&visible(menus[0])?menus[0]:null;
  const owners=menu?(menu.getAttribute('aria-labelledby')||'').trim().split(/\s+/).filter(Boolean):[];
  const ownerMatch=button.id&&owners.length===1&&owners[0]===button.id&&document.querySelectorAll('#'+CSS.escape(button.id)).length===1;
  if(menu&&ownerMatch&&!result.stages.some(s=>s.stage==='menu')){
   menuElement=menu;
   result.stages.push({stage:'menu',trigger:shape(button),menu:{...shape(menu),ownerVerified:true},items:[...menu.querySelectorAll('[role="menuitem"]')].slice(0,20).map(e=>({...shape(e),label:clean(e.textContent)}))});
  }
  if(result.stages.length===1){result.status='waiting-selection';deadline();console.log('Colors for ChatGPT: menu captured (1/2). Manually choose Rename within 10 seconds.');}
 }
 window.__ctcNativeRenameStop=stop;window.addEventListener('pagehide',exit);
 document.addEventListener('click',onClick,true);
 deadline();
 poll=setInterval(()=>{if(thread(location.href)!==current)stop('navigation');},250);
 observer=new MutationObserver(()=>{if(!pending&&!stopped)pending=setTimeout(safelySample,100);});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-controls','aria-labelledby','aria-expanded','hidden','open','class','style']});
 safelySample();
 if(!stopped)console.log('Colors for ChatGPT: waiting up to 10 seconds for the current chat menu.');
})();
