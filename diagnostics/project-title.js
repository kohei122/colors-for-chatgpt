/* Read-only, one snapshot after 10 seconds. No names, IDs, input values or HTML. */
(()=>{
 'use strict';
 window.__ctcProjectStop?.();
 const thread=value=>{try{const u=new URL(value,location.href);return u.origin==='https://chatgpt.com'?u.pathname.match(/^\/(?:g\/[^/]+\/)?c\/([a-zA-Z0-9-]+)\/?$/)?.[1]||null:null;}catch{return null;}};
 const start=thread(location.href),refs=new Map();
 const ref=e=>{if(!refs.has(e))refs.set(e,refs.size+1);return refs.get(e);};
 const state=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {ref:ref(e),tag:e.tagName.toLowerCase(),connected:e.isConnected,visible:e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),rect:{x:r.x,y:r.y,width:r.width,height:r.height},hiddenAncestor:!!e.closest('[hidden]'),ariaHiddenAncestor:!!e.closest('[aria-hidden="true"]'),inertAncestor:!!e.closest('[inert]'),disabled:e.matches(':disabled')||e.getAttribute('aria-disabled')==='true',pointerNone:c.pointerEvents==='none'};};
 const result={diagnostic:'project-title-v1',status:'waiting'};
 window.__ctcProjectDiagnostic=result;
 const stop=()=>{clearTimeout(timer);window.removeEventListener('pagehide',stop);if(result.status==='waiting')result.status='stopped';};
 const timer=setTimeout(()=>{
  try{
   if(!start||thread(location.href)!==start){result.status='context-changed';return;}
   const links=[...document.querySelectorAll('a[href*="/c/"]')].filter(a=>thread(a.href)===start&&!a.closest('main,article,[data-message-author-role]'));
   const buttons=[...document.querySelectorAll('button[aria-haspopup="menu"]')];
   const action=b=>['Chat actions','チャットのアクション'].includes(b.getAttribute('aria-label'));
   result.matchingLinkCount=links.length;
   result.links=links.slice(0,5).map(link=>{
    let row=null,reason='no-unique-row';
    for(let e=link;e&&e!==document.body&&e!==document.documentElement;e=e.parentElement){
     if(e.matches('nav,aside,[role="navigation"],#root,#__next')||e.querySelector('main'))break;
     if([...e.querySelectorAll('a[href*="/c/"]')].some(a=>thread(a.href)&&thread(a.href)!==start)){reason='mixed-chat-ancestor';break;}
     const found=[...e.querySelectorAll('button[aria-haspopup="menu"]')].filter(action);
     if(found.length){row=e;reason=found.length===1?'unique-row':'multiple-actions';break;}
    }
    return {...state(link),reason,rowTag:row?.tagName.toLowerCase()||null,buttons:row?[...row.querySelectorAll('button[aria-haspopup="menu"]')].filter(action).slice(0,5).map(state):[]};
   });
   const band=document.querySelector('#marusin-thread-colors');
   const edge=Number.parseFloat(band?.style.getPropertyValue('--height'))||88;
   const candidates=buttons.filter(b=>action(b)||b.getBoundingClientRect().top<edge+120);
   result.menuButtons=candidates.slice(0,40).map(b=>{
    const menus=[...document.querySelectorAll('[role="menu"]')].filter(m=>m.id&&m.id===b.getAttribute('aria-controls')&&b.id&&(m.getAttribute('aria-labelledby')||'').split(/\s+/).includes(b.id));
    return {...state(b),knownChatAction:action(b),insideHeader:!!b.closest('header,[role="banner"]'),currentRowRef:result.links.find(l=>l.buttons.some(x=>x.ref===ref(b)))?.ref||null,expanded:b.getAttribute('aria-expanded')==='true',boundMenuCount:menus.length,menus:menus.slice(0,2).map(m=>({...state(m),renameItemCount:[...m.querySelectorAll('[role="menuitem"]')].filter(i=>['Rename','名前を変更'].includes(i.textContent.trim())).length}))};
   });
   result.truncated=links.length>5||candidates.length>40;result.status='complete';
  }catch{result.status='error';}finally{stop();console.log('Colors for ChatGPT: __ctcProjectDiagnostic ready');}
 },10000);
 window.__ctcProjectStop=stop;window.addEventListener('pagehide',stop,{once:true});
 console.log('10秒後に1回だけ読み取り採取します。');
})();
