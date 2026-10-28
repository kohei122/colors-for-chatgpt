/* Read-only selected-item evidence: start before opening the current chat menu.
 * Manually choose Rename after the menu appears. 10 seconds per stage.
 * No automatic clicks, input, saves, network or clipboard writes. */
(()=>{
 'use strict';
 window.__ctcNativeRenameStop?.();
 const thread=value=>{try{const u=new URL(value,location.href);return u.origin==='https://chatgpt.com'?u.pathname.match(/^\/(?:g\/[^/]+\/)?c\/([a-zA-Z0-9-]+)\/?$/)?.[1]||null:null;}catch{return null;}};
 const current=thread(location.href),refs=new WeakMap();let nextRef=0,observer,timer,pending=0,poll,stopped=false,menuElement=null,selected=false;

 const result={diagnostic:'native-rename-structure-v2',productVersion:'1.0.1',htmlLanguage:document.documentElement.lang,stages:[],status:'waiting-menu',samples:0,cleanup:false};
 window.__ctcNativeRenameDiagnostic=result;
 const ref=e=>{if(!e)return null;if(!refs.has(e))refs.set(e,++nextRef);return refs.get(e);};
 let links=current?[...document.querySelectorAll('a[href*="/c/"]')].filter(e=>!e.closest('main,article,[data-message-author-role]')&&thread(e.href)===current):[];
 const names=links.map(e=>(e.querySelector('.truncate')||e).textContent.trim()).filter(Boolean);
 const clean=value=>{let s=String(value||'').replace(/\s+/g,' ').trim();for(const secret of [current,...names].filter(Boolean))s=s.split(secret).join('[redacted]');return s.slice(0,120);};
 const visible=e=>e.isConnected&&!e.closest('[hidden],[inert],[aria-hidden="true"]')&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&e.getClientRects().length>0;
 const shape=e=>({ref:ref(e),tag:e.tagName.toLowerCase(),role:e.getAttribute('role'),type:e.getAttribute('type'),ariaLabel:clean(e.getAttribute('aria-label')),data:Object.fromEntries(['data-state','data-side','data-overlay-owner'].filter(k=>e.hasAttribute(k)).map(k=>[k,clean(e.getAttribute(k))])),hasPopup:e.getAttribute('aria-haspopup'),expanded:e.getAttribute('aria-expanded'),disabled:e.matches(':disabled')||e.getAttribute('aria-disabled')==='true',visible:Boolean(visible(e))});

 // Inventory names for every attribute; never dump arbitrary values or HTML.
 // Unknown data values remain redacted, so omission is not evidence of absence.

 const idTokens=new Map();
 const idToken=value=>{if(!idTokens.has(value))idTokens.set(value,'id-'+(idTokens.size+1));return idTokens.get(value);};
 function detail(e){
  const attributes={};
  for(const {name,value} of [...e.attributes]){
   if(name==='id'){attributes[name]={token:idToken(value),radixLike:/^radix[-_:]/.test(value)};continue;}
   if(['aria-controls','aria-labelledby','aria-describedby','aria-owns','for','form'].includes(name)){
    attributes[name]=value.trim().split(/\s+/).filter(Boolean).slice(0,8).map(id=>{const matches=document.querySelectorAll('#'+CSS.escape(id));return {token:idToken(id),count:matches.length,targetRef:matches.length===1?ref(matches[0]):null};});continue;
   }
   if(name==='href'||name==='xlink:href'||name==='action'||name==='formaction'){
    let u;try{u=new URL(value,location.href);}catch{}
    const fragment=value.includes('#')?value.split('#').pop():'';
    attributes[name]={present:true,sameOrigin:u?u.origin===location.origin:null,currentChat:u?thread(u.href)===current:false,hasQuery:Boolean(u?.search),hasFragment:Boolean(fragment),iconSymbol:e.tagName.toLowerCase()==='use'&&/^[a-z][a-z0-9-]{0,80}$/i.test(fragment)?clean(fragment):undefined};continue;
   }
   if(name.startsWith('data-')){
    const semantic=['data-testid','data-test-id','data-action','data-command','data-intent','data-slot','data-state','data-side','data-overlay-owner'];
    const known=/^(?:(?:chat|conversation|menu|item|dialog|title|rename|edit|save|cancel|delete|archive|share|pin|button|input|form|sidebar|slate|open|closed|top|bottom|left|right|true|false|trigger|content|close|separator|radix)(?:[-_:]|$))+$/i;
    attributes[name]=semantic.includes(name)&&known.test(value)?clean(value):{value:'[withheld]',empty:value===''};continue;
   }
   if(['role','type','aria-modal','aria-haspopup','aria-expanded','aria-disabled','aria-hidden','disabled','readonly','required','tabindex','method'].includes(name))attributes[name]=clean(value);
   else attributes[name]={value:'[withheld]'};
  }
  return {ref:ref(e),tag:e.tagName.toLowerCase(),attributes,formRef:'form' in e?ref(e.form):null};
 }
 function tree(root,maxDepth=24,maxNodes=256){
  const nodes=[],reasons=new Set(),cutoffs=[];
  const cut=(reason,e,depth)=>{reasons.add(reason);if(cutoffs.length<16)cutoffs.push({reason,parentRef:ref(e),depth});};
  function walk(e,parent,depth){
   nodes.push({...detail(e),parentRef:parent?ref(parent):null,depth});
   if(e.matches('input,textarea,[contenteditable="true"]')){if(e.children.length)cut('excluded-editable-content',e,depth);return;}
   if(depth>=maxDepth){if(e.children.length)cut('depth-limit',e,depth);return;}
   for(let child=e.firstElementChild;child;child=child.nextElementSibling){
    if(nodes.length>=maxNodes){cut('node-limit',e,depth);break;}
    walk(child,e,depth+1);
   }
  }
  walk(root,null,0);
  return {nodes,truncated:reasons.size>0,reasons:[...reasons],cutoffs,limits:{maxDepth,maxNodes},capturedNodeCount:nodes.length};
 }

 function stop(reason){if(stopped)return;stopped=true;observer?.disconnect();clearTimeout(timer);clearTimeout(pending);clearInterval(poll);document.removeEventListener('click',onClick,true);window.removeEventListener('pagehide',exit);result.reason=reason;result.status=reason==='complete'?'complete':'stopped';result.cleanup=true;if(window.__ctcNativeRenameStop===stop)delete window.__ctcNativeRenameStop;console.log('Colors for ChatGPT: native rename diagnostic ready in __ctcNativeRenameDiagnostic');}
 function exit(){stop('navigation');}
 function deadline(){clearTimeout(timer);timer=setTimeout(()=>stop(thread(location.href)===current?'deadline':'navigation'),10000);}
 function onClick(event){
  if(stopped||selected||!menuElement)return;
  const item=event.target instanceof Element?event.target.closest('[role="menuitem"]'):null;
  if(!item||!menuElement.contains(item))return;
  if(thread(location.href)!==current){stop('navigation');return;}
  try {
   const button=targets();
   const id=menuElement.id;
   const owners=(menuElement.getAttribute('aria-labelledby')||'').trim().split(/\s+/);
   if(button.length!==1||!menuElement.isConnected||!id||button[0].getAttribute('aria-controls')!==id||owners.length!==1||owners[0]!==button[0].id||!button[0].id||document.querySelectorAll('#'+CSS.escape(id)).length!==1||document.querySelectorAll('#'+CSS.escape(button[0].id)).length!==1||!result.stages[0].items.some(e=>e.ref===ref(item))){stop('selection-association-lost');return;}
   selected=true;result.selectedItemRef=ref(item);
   result.selectedItemStructure=tree(item);
   result.selectedItemLabel=clean(item.textContent);
   stop('complete');
  }catch{stop('diagnostic-error');}
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
  if(result.stages.length)return;
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
   result.stages.push({stage:'menu',trigger:shape(button),triggerParent:detail(button.parentElement),targetLink:{ref:ref(links[0]),currentChat:true},menu:{...shape(menu),ownerVerified:true},items:[...menu.querySelectorAll('[role="menuitem"]')].slice(0,20).map(e=>({...shape(e),label:clean(e.textContent)}))});
  }
  if(result.stages.length===1){result.status='waiting-selection';deadline();console.log('Colors for ChatGPT: menu verified. Manually choose Rename within 10 seconds; only that item will be captured.');}
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
