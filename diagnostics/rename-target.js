/* Read-only diagnosis for Chat Thread Colors 0.1.5. Paste the entire file into
 * the affected ChatGPT tab's DevTools Console. No click, write, network,
 * storage, clipboard, input value, conversation text or page HTML access. */
(() => {
  'use strict';
  const selector = 'button[aria-label="チャットのアクション"][aria-haspopup="menu"]';
  const LIMIT = 40;
  const threadId = value => {
    try {
      const u = new URL(value, location.href);
      if (u.origin !== 'https://chatgpt.com') return null;
      return u.pathname.match(/^\/(?:g\/[^/]+\/)?c\/([a-zA-Z0-9-]+)\/?$/)?.[1] || null;
    } catch { return null; }
  };
  const current = threadId(location.href);
  if (!current) {
    const result = {diagnostic:'rename-target-v1', error:'保存済みのchatgpt.com会話URLで実行してください。'};
    console.log(JSON.stringify(result,null,2)); return result;
  }
  const refs = new Map();
  const ref = el => {if (!refs.has(el)) refs.set(el, 'node-' + (refs.size + 1));return refs.get(el);};
  const shape = el => el ? {
    ref:ref(el), tag:el.tagName.toLowerCase(), id:el.id || null,
    role:el.getAttribute('role'), class:typeof el.className === 'string' ? el.className.slice(0,300) : null,
    threadId:el.matches('a[href]') ? threadId(el.href) : null,
    isActionButton:el.matches(selector), childElementCount:el.childElementCount
  } : null;
  function visibility(el) {
    const css=getComputedStyle(el), r=el.getBoundingClientRect();
    const blockers=[];
    for(let node=el, depth=0;node && depth<40;node=node.parentElement,depth++) {
      const st=getComputedStyle(node), reasons=[];
      if(node.hidden) reasons.push('hidden');
      if(node.getAttribute('aria-hidden')==='true') reasons.push('aria-hidden=true');
      if(node.hasAttribute('inert')) reasons.push('inert');
      if(st.display==='none') reasons.push('display:none');
      if(['hidden','collapse'].includes(st.visibility)) reasons.push('visibility:'+st.visibility);
      if(Number(st.opacity)===0) reasons.push('opacity:0');
      if(st.contentVisibility==='hidden') reasons.push('content-visibility:hidden');
      if(reasons.length) blockers.push({node:shape(node),reasons});
    }
    const checkVisibility=el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
    const rectCount=el.getClientRects().length;
    const blockedAncestor=el.closest('[hidden],[aria-hidden="true"],[inert]');
    const displayed015=el.isConnected && checkVisibility && !blockedAncestor && rectCount>0;
    const disabled=Boolean(el.disabled);
    const rejection015=[];
    if(!el.isConnected)rejection015.push('isConnected=false');
    if(!checkVisibility)rejection015.push('checkVisibility=false');
    if(blockedAncestor)rejection015.push('hidden/aria-hidden/inert ancestor:'+ref(blockedAncestor));
    if(!rectCount)rejection015.push('getClientRects.length=0');
    if(disabled)rejection015.push('disabled=true');
    return {displayed015, actionable015:displayed015&&!disabled, rejection015,
      isConnected:el.isConnected, checkVisibility, rectCount, disabled,
      matchesDisabled:el.matches(':disabled'), ariaDisabled:el.getAttribute('aria-disabled'),
      ariaHidden:el.getAttribute('aria-hidden'), hidden:el.hidden, inert:el.hasAttribute('inert'),
      display:css.display, visibility:css.visibility, opacity:css.opacity,
      pointerEvents:css.pointerEvents, contentVisibility:css.contentVisibility,
      rect:{x:r.x,y:r.y,width:r.width,height:r.height},
      intersectsViewport:r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.x<innerWidth&&r.y<innerHeight,
      blockers};
  }
  const menus=[...document.querySelectorAll('[role="menu"][data-overlay-owner="slate-sidebar"]')];
  const candidates=new Map();
  function buttonInfo(el) {
    if(candidates.has(el))return ref(el);
    if(candidates.size>=160)return 'candidate-limit';
    const controls=el.getAttribute('aria-controls');
    const info={node:shape(el), parent:shape(el.parentElement), ariaLabel:el.getAttribute('aria-label'),
      ariaHaspopup:el.getAttribute('aria-haspopup'), ariaExpanded:el.getAttribute('aria-expanded'),
      ariaControls:controls, state:visibility(el), menuRelations:[]};
    for(const menu of menus) {
      const byControls=Boolean(controls)&&menu.id===controls;
      const byLabel=Boolean(el.id)&&(menu.getAttribute('aria-labelledby')||'').split(/\s+/).includes(el.id);
      if(byControls||byLabel)info.menuRelations.push({menu:shape(menu),byControls,byLabel,
        ariaLabelledby:menu.getAttribute('aria-labelledby'),state:visibility(menu),
        renameItemCount:[...menu.querySelectorAll('[role="menuitem"]')].filter(n=>n.textContent.trim()==='名前を変更').length});
    }
    candidates.set(el,info);return ref(el);
  }
  const allMatches=[...document.querySelectorAll('a[href*="/c/"]')].filter(a=>threadId(a.href)===current);
  const links=[];
  const accepted=new Set();
  let multipleActionStop=false;
  for(const link of allMatches.slice(0,LIMIT)) {
    const excluded=Boolean(link.closest('main,article,[data-message-author-role]'));
    const state=visibility(link);
    const entry={node:shape(link),path:new URL(link.href).pathname,excludedBy015:excluded,state,walk:[],stop:null,nearbyAncestors:[]};
    if(excluded)entry.stop='conversation-content exclusion';
    else if(!state.displayed015)entry.stop='matching link not displayed';
    else for(let row=link,depth=0;row&&depth<40;row=row.parentElement,depth++) {
      if(row===document.body||row===document.documentElement){entry.stop='body/html boundary';break;}
      const record={node:shape(row)};entry.walk.push(record);
      if(row.matches('nav,aside,[role="navigation"],#root,#__next')||row.querySelector('main')){entry.stop='navigation/app boundary';break;}
      const rowLinks=[...row.querySelectorAll('a[href*="/c/"]')];if(row.matches('a[href]'))rowLinks.push(row);
      record.threadIds=[...new Set(rowLinks.map(a=>threadId(a.href)).filter(Boolean))];
      if(record.threadIds.some(id=>id!==current)){entry.stop='mixed thread IDs';break;}
      const actions=[...row.querySelectorAll(selector)];record.actionCount=actions.length;
      if(actions.length){
        record.buttons=actions.slice(0,LIMIT).map(buttonInfo);
        entry.selectedAncestor=shape(row);
        entry.stop=actions.length!==1?'multiple actions in first matching ancestor':'first matching ancestor';
        if(actions.length!==1)multipleActionStop=true;
        else if(candidates.get(actions[0])?.state.actionable015)accepted.add(actions[0]);
        // Look one parent beyond the selected row to expose a hidden clone / visible sibling.
        const parent=row.parentElement;
        if(parent&&parent!==document.body&&parent!==document.documentElement){
          entry.parentStructure={node:shape(parent),children:[...parent.children].slice(0,20).map(shape),truncated:parent.children.length>20};
          entry.parentButtons=[...parent.querySelectorAll(selector)].slice(0,LIMIT).map(buttonInfo);
        }
        break;
      }
    }
    // Small structural path even when the link itself was rejected; never include text/HTML.
    for(let n=link.parentElement,i=0;n&&n!==document.body&&i<5;n=n.parentElement,i++)entry.nearbyAncestors.push(shape(n));
    links.push(entry);
  }
  // Open-menu triggers may be clones outside the ancestor chosen by 0.1.5.
  const openMenus=menus.filter(m=>visibility(m).displayed015).slice(0,LIMIT).map(menu=>{
    const labels=(menu.getAttribute('aria-labelledby')||'').split(/\s+/);
    const triggers=[...document.querySelectorAll(selector)].filter(b=>(b.id&&labels.includes(b.id))||b.getAttribute('aria-controls')===menu.id);
    return {menu:shape(menu),ariaLabelledby:menu.getAttribute('aria-labelledby'),triggers:triggers.slice(0,LIMIT).map(buttonInfo)};
  });
  const report={diagnostic:'rename-target-v1',runtimeVersion:'0.1.5',currentThreadId:current,
    viewport:{width:innerWidth,height:innerHeight},matchingLinkCount:allMatches.length,
    links, candidates:[...candidates.values()],openMenus,
    current015Outcome:{multipleActionStop,acceptedButtonRefs:[...accepted].map(ref),
      rowSelectionWouldPass:!multipleActionStop&&accepted.size===1,
      existingVisibleMenuWouldRejectAfterRowPass:[...document.querySelectorAll('[role="menu"]')].some(m=>visibility(m).displayed015)},
    limits:{maxMatchingLinks:LIMIT,maxCandidateButtons:160,maxButtonsPerScope:LIMIT,maxPathDepth:40,
      linksTruncated:allMatches.length>LIMIT},
    notes:['0.1.5 does not explicitly reject aria-disabled or test nonzero dimensions/pointer-events.',
      'An existing visible menu is rejected after threadAction; it is not reused by 0.1.5.',
      'No clicks, inputs, storage, network or HTML collection were performed.']};
  console.log(JSON.stringify(report,null,2));
  return report;
})();
