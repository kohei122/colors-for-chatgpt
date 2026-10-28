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
