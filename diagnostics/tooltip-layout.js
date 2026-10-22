/* Read-only Console diagnostic for 1.0.0. No page/style/input/storage writes,
 * clicks, network, text/HTML collection or clipboard calls. Run once per button.
 * Wait 10 seconds, then observe for 6 seconds. Results remain in
 * window.__ctcTooltipDiagnostic; copy them manually after completion.
 */
(() => {
  'use strict';
  window.__ctcTooltipDiagnosticStop?.();
  const result = window.__ctcTooltipDiagnostic = {
    diagnostic: 'tooltip-layout-v3', status: 'preparing',
    preparationMs: 10000, observationMs: 6000, intervalMs: 250,
    samples: [], cleanup: false, truncated: false
  };
  const start = performance.now(), path = location.pathname;
  let iconSeeds=[], descriptions=new WeakMap();
  // Explicit diagnostic only: asset suffixes are hints, never production selectors.
  function seedIcons() {
    const uses=document.querySelectorAll('svg use');
    result.iconScanTruncated=uses.length>512;
    const matches=[...uses].slice(0,512).flatMap(el=>{
      const href=el.getAttribute('href')||el.getAttributeNS('http://www.w3.org/1999/xlink','href')||'';
      const kind=href.endsWith('#list-circle-light-20')?'overview':href.endsWith('#folder-light-20')?'folder':null;
      return kind&&!excluded(el)?[{el,kind}]:[];
    });
    iconSeeds=matches.slice(0,8);result.iconScanTruncated ||= matches.length>8;
    result.iconMatchCount=matches.length;
  }

  const ids = new WeakMap();
  let serial = 0, prepareTimer, pollTimer, endTimer, stopped = false, previous = '';
  const ref = el => {
    if (!el) return null;
    if (!ids.has(el)) ids.set(el, ++serial);
    return ids.get(el);
  };
  const round = n => Math.round(n * 10) / 10;
  const rect = el => {
    const r = el.getBoundingClientRect();
    return {x:round(r.x), y:round(r.y), width:round(r.width), height:round(r.height)};
  };
  const enumAttr = (el, name, allowed) => {
    const value = el.getAttribute(name);
    return value === null ? null : allowed.includes(value) ? value : 'other';
  };
  const related = (el, attr) => (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)
    .slice(0, 8).map(id => document.getElementById(id)).filter(Boolean);
  const excluded = el => el.closest('#marusin-thread-colors,[data-message-author-role],article');
  function describe(el) {
    if(descriptions.has(el))return descriptions.get(el);
    const css = getComputedStyle(el), r = rect(el);
    const value = {
      ref:ref(el), tag:el.tagName.toLowerCase(), connected:el.isConnected, rect:r,
      attributes:{
        role:enumAttr(el,'role',['tooltip','button','dialog','alertdialog','presentation','none','group','link','menu','menuitem','menuitemcheckbox','menuitemradio','checkbox','switch','tab','treeitem','img']),
        side:enumAttr(el,'data-side',['top','right','bottom','left']),
        align:enumAttr(el,'data-align',['start','center','end']),
        state:enumAttr(el,'data-state',['open','closed','delayed-open','instant-open']),
        ariaHidden:enumAttr(el,'aria-hidden',['true','false']),
        expanded:enumAttr(el,'aria-expanded',['true','false']),
        hasPopup:enumAttr(el,'aria-haspopup',['true','false','menu','dialog','listbox','tree','grid']),
        hidden:el.hidden === true, inert:el.hasAttribute('inert'),
        disabled:el.matches(':disabled'), hasTitle:el.hasAttribute('title'),
        sharedButton:el.matches('button[aria-label="共有"]'),
        popperWrapper:el.hasAttribute('data-radix-popper-content-wrapper'),
        describedBy:related(el,'aria-describedby').map(ref),
        controls:related(el,'aria-controls').map(ref),
        labelledBy:related(el,'aria-labelledby').map(ref),
        details:related(el,'aria-details').map(ref)
      },
      style:Object.fromEntries(['position','top','right','bottom','left','width','height',
        'maxHeight','minHeight','zIndex','overflow','overflowX','overflowY','transform',
        'translate','rotate','scale','transformOrigin','perspective','isolation','contain','display','visibility',
        'opacity','pointerEvents','contentVisibility','boxSizing'].map(k=>[k,css[k]])),
      effects:{filter:css.filter!=='none',backdropFilter:css.backdropFilter!=='none',
        clipPath:css.clipPath!=='none',willChangeTransform:css.willChange.includes('transform')},
      offsetParent:ref(el.offsetParent), hovered:el.matches(':hover'), focused:el===document.activeElement,
      visible:el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),
      outOfViewport:r.x<0||r.y<0||r.x+r.width>innerWidth||r.y+r.height>innerHeight
    };
    descriptions.set(el,value);return value;
  }
  function ancestry(el) {
    const nodes=[];
    for(let n=el.parentElement;n&&nodes.length<10;n=n.parentElement) nodes.push(describe(n));
    return {nodes,truncated:!!nodes.length&&nodes.at(-1).tag!=='html'};
  }
  function hitTest(el) {
    const r=el.getBoundingClientRect();
    const left=Math.max(0,r.left),right=Math.min(innerWidth,r.right);
    const top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
    if(right<=left||bottom<=top)return [];
    return [[(left+right)/2,(top+bottom)/2],[left+1,top+1],[right-1,bottom-1]].map(([x,y])=>{
      const stack=document.elementsFromPoint(x,y).slice(0,6);
      return {x:round(x),y:round(y),stack:stack.map(n=>({
        ref:ref(n),tag:n.tagName.toLowerCase(),insideCandidate:el.contains(n),
        ancestorOfCandidate:n.contains(el),extensionHost:n.id==='marusin-thread-colors'
      }))};
    });
  }
  function sample() {
    if(stopped)return;
    if(location.pathname!==path){stop('navigation');return;}
    try {
      descriptions=new WeakMap();
      // Only hovered/focused controls; no permanent icon asset selectors.
      const controls=[...document.querySelectorAll('button:hover,[role="button"]:hover,[aria-describedby]:hover,[tabindex]:hover')];
      const focused=document.activeElement?.closest('button,[role="button"],[aria-describedby],[tabindex]');
      if(focused)controls.push(focused);
      for(const {el} of iconSeeds) {
        if(!el.isConnected)continue;
        const button=el.closest('button,[role="button"]');
        if(button&&(button.matches(':hover')||button===document.activeElement))controls.push(button);
        else if(el.closest('svg')?.matches(':hover')) {
          for(let n=el.parentElement,depth=0;n&&n!==document.body&&depth<6;n=n.parentElement,depth++)controls.push(n);
        }
      }
      const buttons=[...new Set(controls)].filter(el=>{
        if(excluded(el))return false;
        const r=el.getBoundingClientRect();
        return r.bottom>0&&r.top<Math.min(innerHeight,320)&&r.width>0&&r.height>0;
      });
      const targets=buttons.slice(0,4);
      const candidates=new Map();
      const add=(el,source,button=null)=>{
        if(!el||excluded(el))return;
        if(!candidates.has(el)&&candidates.size>=24){result.truncated=true;return;}
        if(!candidates.has(el))candidates.set(el,{sources:[],triggerRefs:[]});
        const entry=candidates.get(el);
        if(!entry.sources.includes(source))entry.sources.push(source);
        if(button&&!entry.triggerRefs.includes(ref(button)))entry.triggerRefs.push(ref(button));
      };
      const ariaEdges=[];
      for(const button of targets) {
        for(let owner=button,depth=0;owner&&owner!==document.body&&depth<7;owner=owner.parentElement,depth++) {
          for(const attribute of ['aria-describedby','aria-labelledby','aria-controls','aria-details']) {
            for(const node of related(owner,attribute)) {
              // Only a direct description is an existing trigger association.
              add(node,depth===0&&attribute==='aria-describedby'?'aria-describedby':'ancestor-or-other-aria',depth===0&&attribute==='aria-describedby'?button:null);
              if(ariaEdges.length<64)ariaEdges.push({triggerRef:ref(button),ownerRef:ref(owner),targetRef:ref(node),attribute,depth});
            }
          }
        }
      }
      // These are diagnostic candidates, not proof of ownership or visibility.
      for(const node of document.querySelectorAll('[role="tooltip"],[data-radix-popper-content-wrapper],[data-side][data-state]')) {
        if(candidates.size>=24){result.truncated=true;break;}
        add(node,node.getAttribute('role')==='tooltip'?'role-tooltip':'positioning-hint');
      }
      const host=document.getElementById('marusin-thread-colors');
      const bar=host?.shadowRoot?.querySelector('.bar');
      const band=bar?{host:describe(host),bar:describe(bar)}:null;
      const snapshot={
        viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,
          visual:visualViewport?{width:round(visualViewport.width),height:round(visualViewport.height),
            scale:visualViewport.scale,offsetTop:visualViewport.offsetTop,offsetLeft:visualViewport.offsetLeft}:null},
        layoutActive:document.documentElement.hasAttribute('data-thread-colors-active'),
        band, body:describe(document.body),html:describe(document.documentElement),
        ariaEdges, icons:iconSeeds.map(({el,kind})=>({kind,element:describe(el),
          buttonRef:ref(el.closest('button,[role="button"]')),ancestors:ancestry(el)})),
        buttonCount:buttons.length,buttons:targets.map(el=>({element:describe(el),ancestors:ancestry(el)})),
        candidateCount:candidates.size,candidates:[...candidates].map(([el,relation])=>({
          ...relation,element:describe(el),ancestors:ancestry(el),hits:hitTest(el),
          localStructure:el.parentElement&&el.parentElement!==document.body&&el.parentElement!==document.documentElement?
            {parentRef:ref(el.parentElement),truncated:el.parentElement.children.length>8,
              siblings:[...el.parentElement.children].slice(0,8).map(describe)}:null,
          intersectsBand:!!bar&&getComputedStyle(host).display!=='none'&&(()=>{
            const a=el.getBoundingClientRect(),b=bar.getBoundingClientRect();
            return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
          })()
        }))
      };
      snapshot.assessments=snapshot.buttons.map(({element:b,ancestors})=>{
        const trigger=targets.find(el=>ref(el)===b.ref),wrapper=trigger?.parentElement;
        const wrapperEligible=!!(trigger?.matches('button,[role="button"]')&&wrapper?.tagName==='SPAN'&&wrapper.children.length===1&&wrapper.firstElementChild===trigger&&
          !wrapper.matches('[tabindex],[contenteditable],[hidden],[inert],[aria-hidden="true"]')&&
          (!wrapper.hasAttribute('role')||['presentation','none'].includes(wrapper.getAttribute('role')))&&
          wrapper.querySelectorAll('button,[role="button"],a[href],input,select,textarea,[tabindex],[contenteditable]').length===1);
        const effectiveRefs=[...b.attributes.describedBy,...(wrapperEligible?related(wrapper,'aria-describedby').map(ref):[])];
        const linked=snapshot.candidates.filter(c=>effectiveRefs.includes(c.element.ref)&&c.element.attributes.role==='tooltip');
        const reasons=[];
        const imageSource=b.tag==='span'&&b.attributes.role==='img';
        if(b.tag!=='button'&&b.attributes.role!=='button'&&!imageSource)reasons.push('trigger-not-button');
        if(imageSource){
          if(trigger.parentElement?.closest('button,[role="button"],[aria-describedby]'))reasons.push('conflicting-description-ancestor');
          if(!b.visible||trigger.closest('[hidden],[inert],[aria-hidden="true"]'))reasons.push('description-source-not-visible');
          const ids=(trigger.getAttribute('aria-describedby')||'').trim().split(/\s+/).filter(Boolean);
          if(ids.some(key=>document.querySelectorAll('[aria-describedby~="'+CSS.escape(key)+'"]').length!==1))reasons.push('competing-description-owner');
        }
        if(!effectiveRefs.length)reasons.push('button-has-no-describedby');
        if(new Set(effectiveRefs).size!==effectiveRefs.length)reasons.push('duplicate-description-reference');
        if(linked.length!==1)reasons.push('linked-tooltip-count-not-one');
        const edge=band?.bar.rect.y+band?.bar.rect.height;
        if(b.rect.y<edge-1||b.rect.y+b.rect.height>edge+96)reasons.push('outside-upper-control-range');
        for(const c of linked){
          const e=c.element,n=c.ancestors.nodes;
          if(n[0]?.ref!==snapshot.body.ref&&!(n[0]?.style.display==='contents'&&n[1]?.ref===snapshot.body.ref))reasons.push('unverified-portal-structure');
          if(e.offsetParent!==snapshot.body.ref)reasons.push('offset-parent-not-body');
          if(e.style.position!=='absolute')reasons.push('position-not-absolute');
          if(e.style.pointerEvents!=='none')reasons.push('pointer-events-not-none');
          if(e.rect.width<=1||e.rect.height<=1)reasons.push('possibly-accessibility-only-tooltip');
          if(!e.visible)reasons.push('not-visible');
        }
        return {triggerRef:b.ref,wrapperDescriptionEligible:wrapperEligible,wrapperRef:wrapperEligible?ref(wrapper):null,linkedTooltipCount:linked.length,ancestorDescribedByCount:ancestors.nodes.filter(n=>n.attributes.describedBy.length).length,reasons};
      });
      const key=JSON.stringify(snapshot);
      if(key!==previous&&result.samples.length<25)result.samples.push({ms:Math.round(performance.now()-start),...snapshot});
      previous=key;
    } catch {
      // Do not include exception text, which can contain page-provided values.
      stop('read-error');
    }
  }
  function stop(reason='cancelled') {
    if(stopped)return;
    stopped=true;clearTimeout(prepareTimer);clearInterval(pollTimer);clearTimeout(endTimer);
    window.removeEventListener('pagehide',onPageHide);
    result.status=reason;result.elapsedMs=Math.round(performance.now()-start);
    result.cleanup=true;
    if(window.__ctcTooltipDiagnosticStop===stop)delete window.__ctcTooltipDiagnosticStop;
    if(reason==='complete')console.log('Colors for ChatGPT tooltip diagnostic',JSON.stringify(result));
  }
  function onPageHide(){stop('pagehide');}
  window.__ctcTooltipDiagnosticStop=stop;
  window.addEventListener('pagehide',onPageHide);
  prepareTimer=setTimeout(()=>{
    result.status='observing';seedIcons();sample();
    if(stopped)return;
    pollTimer=setInterval(sample,250);
    endTimer=setTimeout(()=>{sample();stop('complete');},6000);
  },10000);
  return '10秒後から6秒間観測します。ボタンへマウスを移すか、Tabでフォーカスしてください。';
})();
