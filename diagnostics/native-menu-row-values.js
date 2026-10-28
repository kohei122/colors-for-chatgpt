/* Read-only comparison. Open current chat menu within 10 seconds. */
(()=>{
 'use strict';
 window.__ctcNativeRenameStop?.('replaced');
 const result={diagnostic:'native-menu-row-values-v1',productVersion:'1.0.1',status:'waiting-menu',items:[],cleanup:false};
 window.__ctcNativeRenameDiagnostic=result;
 let observer,timer,poll,pending,stopped=false;
 const thread=value=>{try{const u=new URL(value,location.href);return u.origin==='https://chatgpt.com'?u.pathname.match(/^\/(?:g\/[^/]+\/)?c\/([a-zA-Z0-9-]+)\/?$/)?.[1]||null:null;}catch{return null;}};
 const current=thread(location.href);
 const visible=e=>e.isConnected&&!e.closest('[hidden],[inert],[aria-hidden="true"]')&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&e.getClientRects().length>0;
 function stop(reason){
  if(stopped)return;stopped=true;observer?.disconnect();clearTimeout(timer);clearTimeout(pending);clearInterval(poll);window.removeEventListener('pagehide',exit);
  result.reason=reason;result.status=reason==='complete'?'complete':'stopped';result.cleanup=true;
  if(window.__ctcNativeRenameStop===stop)delete window.__ctcNativeRenameStop;
  console.log('Colors for ChatGPT: comparison ready in __ctcNativeRenameDiagnostic');
 }
 function exit(){stop('navigation');}
 function sample(){try{
  if(stopped)return;if(thread(location.href)!==current){stop('navigation');return;}
  const links=[...document.querySelectorAll('a[href*="/c/"]')].filter(e=>!e.closest('main,article,[data-message-author-role]')&&thread(e.href)===current);
  result.matchingLinkCount=links.length;
  if(!links.length)return;if(links.length!==1){stop('ambiguous-row');return;}
  const link=links[0];let candidates=[];
  for(let row=link.parentElement,depth=1;row&&row!==document.body&&depth<=7;row=row.parentElement,depth++){
   if([...row.querySelectorAll('a[href*="/c/"]')].some(e=>thread(e.href)!==current))break;
   candidates=[...row.querySelectorAll('button[aria-haspopup="menu"],[role="button"][aria-haspopup="menu"]')];
   if(candidates.length)break;
  }
  result.candidateCount=candidates.length;
  if(!candidates.length)return;if(candidates.length!==1){stop('ambiguous-trigger');return;}
  const button=candidates[0],key=button.getAttribute('aria-controls');
  if(!key||!button.id||button.getAttribute('aria-expanded')!=='true')return;
  const matches=document.querySelectorAll('#'+CSS.escape(key));
  if(matches.length>1){stop('ambiguous-menu-id');return;}
  const menu=matches[0];if(!menu||!menu.matches('[role="menu"]')||!visible(menu))return;
  const owners=(menu.getAttribute('aria-labelledby')||'').trim().split(/\s+/);
  if(owners.length!==1||owners[0]!==button.id||document.querySelectorAll('#'+CSS.escape(button.id)).length!==1){stop('menu-owner-mismatch');return;}
  const items=[...menu.querySelectorAll('[role="menuitem"]')].filter(e=>e.closest('[role="menu"]')===menu);
  if(!items.length)return;if(items.length>30){stop('item-limit');return;}
  const title=(link.querySelector('.truncate')||link).textContent.trim();
  const clean=value=>{let s=value.replace(/\s+/g,' ').trim();for(const secret of [current,title].filter(Boolean))s=s.split(secret).join('[redacted]');return s.slice(0,120);};
  const numbers=new Map();const anonymous=value=>{if(!numbers.has(value))numbers.set(value,numbers.size+1);return numbers.get(value);};
  const rows=[];
  for(const item of items){
   const nodes=[...item.querySelectorAll('[data-menu-row-content]')].filter(e=>e.closest('[role="menuitem"]')===item);
   if(item.hasAttribute('data-menu-row-content'))nodes.unshift(item);
   if(nodes.length>20){stop('attribute-count-limit');return;}
   rows.push({label:clean(item.textContent),attributeCount:nodes.length,attributeState:nodes.length?'present':'absent',values:nodes.map(e=>{const v=e.getAttribute('data-menu-row-content');return {state:v===''?'empty':'nonempty',anonymousNumber:anonymous(v)};})});
  }
  result.ownerVerified=true;result.items=rows;result.distinctValueCount=numbers.size;
  result.allItemsHaveSameValue=rows.every(r=>r.values.length>0)&&numbers.size===1;
  stop('complete');
 }catch{stop('diagnostic-error');}}
 window.__ctcNativeRenameStop=stop;
 if(!current){stop('no-chat-id');return;}
 window.addEventListener('pagehide',exit);
 observer=new MutationObserver(()=>{if(!pending&&!stopped)pending=setTimeout(()=>{pending=null;sample();},100);});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-controls','aria-labelledby','aria-expanded','hidden','data-state']});
 timer=setTimeout(()=>stop(thread(location.href)===current?'deadline':'navigation'),10000);
 poll=setInterval(()=>{if(thread(location.href)!==current)stop('navigation');},250);
 sample();
 if(!stopped)console.log('Colors for ChatGPT: open current chat menu within 10 seconds. Do not select Rename.');
})();
