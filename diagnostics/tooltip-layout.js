/* Read-only Console diagnostic for 1.0.1. No page/style/input/storage writes,
 * clicks, network, text/HTML collection or clipboard calls. Run once per button.
 * Wait 10 seconds, then observe for 6 seconds. Results remain in
 * window.__ctcTooltipDiagnostic; copy them manually after completion.
 */
(() => {
  'use strict';
  // BEGIN GENERATED TOOLTIP POLICY
  // Read-only tooltip policy. Generated into content.js and the standalone diagnostic.
  // Change this source, then run python tools/sync-tooltip-policy.py.
  function createTooltipPolicy() {
    const sourceSelector='button,[role="button"],span[role="img"]';
    const excluded='[hidden],[inert],[aria-hidden="true"],dialog,[role="dialog"],[role="alertdialog"],[role="menu"],article,[data-message-author-role]';
    const tokens=el=>(el.getAttribute('aria-describedby')||'').trim().split(/\s+/).filter(Boolean);
    function source(node) {
      if(!(node instanceof Element))return null;
      const el=node.closest(sourceSelector);
      if(!el||!document.body.contains(el)||el.closest(excluded))return null;
      if(el.matches('span[role="img"]')&&el.parentElement?.closest('button,[role="button"],[aria-describedby]'))return null;
      return el;
    }
    function owners(el) {
      const result=[el],w=el.parentElement;
      if(el.matches('button,[role="button"]')&&w?.tagName==='SPAN'&&w.children.length===1&&w.firstElementChild===el&&
        !w.matches('[tabindex],[contenteditable],[hidden],[inert],[aria-hidden="true"]')&&
        (!w.hasAttribute('role')||['presentation','none'].includes(w.getAttribute('role')))&&
        w.querySelectorAll('button,[role="button"],a[href],input,select,textarea,[tabindex],[contenteditable]').length===1)result.push(w);
      return result;
    }
    function resolve(el,barBottom) {
      const reasons=[],o=owners(el),ids=o.flatMap(tokens),tips=[];
      if(!el.matches(sourceSelector))reasons.push('trigger-not-button');
      if(source(el)!==el)reasons.push('excluded-or-conflicting-source');
      if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))reasons.push('description-source-not-visible');
      const b=el.getBoundingClientRect();
      if(!b.width||!b.height||!Number.isFinite(barBottom)||b.top<barBottom-1||b.bottom>barBottom+96)reasons.push('outside-upper-control-range');
      if(!ids.length)reasons.push('button-has-no-describedby');
      if(ids.length>4)reasons.push('description-count-exceeds-four');
      if(new Set(ids).size!==ids.length)reasons.push('duplicate-description-id');
      for(const id of ids.slice(0,4)) {
        const matches=document.querySelectorAll('#'+CSS.escape(id));
        if(matches.length!==1)reasons.push('description-id-missing-or-not-unique');
        if(matches[0]?.matches('[role="tooltip"]'))tips.push(matches[0]);
        if(document.querySelectorAll('[aria-describedby~="'+CSS.escape(id)+'"]').length!==1)reasons.push('competing-description-owner');
      }
      if(tips.length!==1)reasons.push('linked-tooltip-count-not-one');
      const tip=tips.length===1?tips[0]:null;
      if(tip?.closest(excluded))reasons.push('excluded-tooltip-context');
      return {source:el,owners:o,ids,tip,rect:b,reasons:[...new Set(reasons)]};
    }
    function structures(relation) {
      const tip=relation.tip;
      if(!tip)return {absolute:{target:null,reasons:['no-unique-tooltip']},fixed:{target:null,reasons:['no-unique-tooltip']}};
      const parent=tip.parentElement,portal=parent?.parentElement,root=portal?.parentElement;
      const css=getComputedStyle(tip),common=[];
      if(css.display==='none'||css.visibility!=='visible'||Number(css.opacity)===0)common.push('tooltip-style-not-visible');
      if(css.rotate!=='none')common.push('rotate-not-none');
      if(css.scale!=='none')common.push('scale-not-none');
      const a=[...common],f=[...common];
      if(!tip.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))f.push('not-visible');
      if(parent!==document.body&&!(portal===document.body&&getComputedStyle(parent).display==='contents'))a.push('unverified-portal-structure');
      if(tip.offsetParent!==document.body)a.push('offset-parent-not-body');
      if(css.position!=='absolute')a.push('position-not-absolute');
      if(css.pointerEvents!=='none')a.push('pointer-events-not-none');
      if(relation.ids.length!==1||!parent?.hasAttribute('data-radix-popper-content-wrapper')||parent.children.length!==1||parent.firstElementChild!==tip||
        !root||root.parentElement!==document.body||root.tagName!=='DIV'||portal.tagName!=='DIV'||parent.querySelectorAll('[role="tooltip"]').length!==1||
        tip.querySelector('button,a[href],input,select,textarea,[tabindex],[contenteditable],[role="menu"],[role="dialog"]'))f.push('unverified-fixed-portal-structure');
      if(!f.includes('unverified-fixed-portal-structure')) {
        const w=getComputedStyle(parent),p=getComputedStyle(portal),r=getComputedStyle(root);
        if(css.position!=='static'||css.pointerEvents!=='auto'||tip.offsetParent!==parent||w.position!=='fixed'||parent.offsetParent!==portal||
          p.position!=='fixed'||p.contain!=='layout'||p.pointerEvents!=='none'||portal.offsetParent!==document.body||r.position!=='static')f.push('unsupported-fixed-coordinate-system');
        for(const el of [parent,portal,root,document.body,document.documentElement]) {
          const c=getComputedStyle(el);
          if(c.rotate!=='none'||c.scale!=='none'||c.perspective!=='none'||c.filter!=='none'||
            (el!==document.body&&(c.overflowX!=='visible'||c.overflowY!=='visible'))||(el!==parent&&c.translate!=='none'))f.push('unsupported-fixed-ancestor-effects');
          if(c.transform!=='none') {
            const m=new DOMMatrixReadOnly(c.transform);
            if(!m.is2D||m.a!==1||m.b!==0||m.c!==0||m.d!==1)f.push('unsupported-fixed-transform');
          }
        }
      }
      return {absolute:{target:tip,reasons:[...new Set(a)]},fixed:{target:parent,reasons:[...new Set(f)]}};
    }
    return {source,owners,tokens,resolve,structures,excluded};
  }
  // END GENERATED TOOLTIP POLICY
  const tooltipPolicy=createTooltipPolicy();
  window.__ctcTooltipDiagnosticStop?.();
  const result = window.__ctcTooltipDiagnostic = {
    diagnostic: 'tooltip-layout-v3', assessmentRevision: 2, status: 'preparing',
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

  const ids = new WeakMap(), firstRects = new WeakMap();
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
      inlineCorrectionEvidence:{translateImportant:el.style.getPropertyPriority('translate')==='important',
        wrappingImportant:['max-width','min-width','box-sizing','white-space','overflow-wrap','height','max-height'].every(k=>el.style.getPropertyPriority(k)==='important'),
        attribution:'unknown-product-private-state'},
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
        const trigger=targets.find(el=>ref(el)===b.ref);
        const relation=tooltipPolicy.resolve(trigger,band?band.bar.rect.y+band.bar.rect.height:NaN);
        const shapes=tooltipPolicy.structures(relation),wrapperEligible=relation.owners.length===2,wrapper=trigger.parentElement;
        const rawIds=relation.ids;
        const ariaResolution=rawIds.slice(0,8).map(key=>{
          const matches=[...document.querySelectorAll('#'+CSS.escape(key))];
          return {matchCount:matches.length,targetRefs:matches.slice(0,8).map(ref),
            descriptionOwnerCount:document.querySelectorAll('[aria-describedby~="'+CSS.escape(key)+'"]').length};
        });
        const fixedHint=!!relation.tip?.parentElement?.hasAttribute('data-radix-popper-content-wrapper');
        const selected=!shapes.fixed.reasons.length?'fixed':!shapes.absolute.reasons.length?'absolute':fixedHint?'fixed':'absolute';
        const reasons=[...relation.reasons,...shapes[selected].reasons];
        if(!snapshot.layoutActive)reasons.push('layout-inactive');
        const uncertainties=['product-active-flags-and-style-ownership-not-observable','product-session-and-conflict-budget-not-observable'];
        const geometry=[];
        const linked=snapshot.candidates.filter(c=>relation.tip&&c.element.ref===ref(relation.tip));
        for(const c of linked){
          const e=c.element,node=relation.tip;
          if(e.style.translate!=='none'||getComputedStyle(node.parentElement).translate!=='none')uncertainties.push('translate-present-native-or-existing-correction');
          const border=host?Number.parseFloat(getComputedStyle(host).getPropertyValue('--border')):NaN;
          const edge=Number.isFinite(border)?Math.max(4,border):null;
          if(edge===null)uncertainties.push('border-setting-unavailable');
          const bottom=b.rect.y+b.rect.height;
          const free=edge===null?null:innerHeight-edge-bottom-6;
          const width=edge===null?null:innerWidth-2*edge;
          const needsWrap=width!==null&&e.rect.width>width;
          if(needsWrap)uncertainties.push('wrap-required-height-after-wrap-unknown-read-only');
          if(free!==null&&e.rect.height>free&&!needsWrap)reasons.push('insufficient-space-below');
          if(!e.rect.width||!e.rect.height)reasons.push('zero-tooltip-size');
          if(!firstRects.has(node))firstRects.set(node,e.rect);
          const first=firstRects.get(node);
          geometry.push({tooltipRef:e.ref,edge,gap:6,requiredHeight:e.rect.height,
            availableBelow:free,availableWidth:width,needsWrap,
            fitsBelowAtObservedSize:free===null?null:e.rect.height<=free,
            tooltipBelowTrigger:e.rect.y>=bottom,firstObservedRect:first,
            deltaFromFirst:Object.fromEntries(['x','y','width','height'].map(k=>[k,round(e.rect[k]-first[k])])),
            correctionEvidence:e.inlineCorrectionEvidence});
        }
        return {triggerRef:b.ref,ariaResolution,descriptionCount:rawIds.length,geometry,uncertainties,
          policyRevision:1,structureEvaluations:Object.fromEntries(Object.entries(shapes).map(([kind,value])=>[kind,{eligible:!value.reasons.length,reasons:value.reasons}])),
          evaluatedStructure:selected,referenceOwnerRefs:relation.owners.map(ref),
          productDecision:'not-observed',evidenceKind:'read-only-policy-evaluation',
          assessment:reasons.length?'observed-rejection-conditions':'no-observed-rejection-not-proof-of-application',
          wrapperDescriptionEligible:wrapperEligible,wrapperRef:wrapperEligible?ref(wrapper):null,linkedTooltipCount:linked.length,ancestorDescribedByCount:ancestors.nodes.filter(n=>n.attributes.describedBy.length).length,reasons};
      });
      const key=JSON.stringify(snapshot);
      if(key!==previous) {
        if(result.samples.length<25)result.samples.push({ms:Math.round(performance.now()-start),...snapshot});
        else result.truncated=true;
      }
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
    if(window.__ctcTooltipDiagnosticCapture===capture)delete window.__ctcTooltipDiagnosticCapture;
    if(window.__ctcTooltipDiagnosticStop===stop)delete window.__ctcTooltipDiagnosticStop;
    if(reason==='complete')console.log('Colors for ChatGPT tooltip diagnostic',JSON.stringify(result));
  }
  function onPageHide(){stop('pagehide');}
  function capture() {
    if(result.status==='observing')sample();
    return {status:result.status,samples:result.samples.length,cleanup:result.cleanup};
  }
  window.__ctcTooltipDiagnosticCapture=capture;
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
