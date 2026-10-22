(async () => {
  "use strict";
  const I=globalThis.ColorsI18n;
  if(I)await I.ready;
  const T=source=>I?I.text(source):source;
  const C = globalThis.ThreadColorsCore;
  const HOST = "marusin-thread-colors";
  if (!C || document.getElementById(HOST)) return;
  const prefix = "thread-colors:v1:";
  const enabledKey = prefix + "enabled";
  const appearanceKey=prefix+"defaults:appearance";
  const dimensionNames=['height','fontSize','border'];
  const dimensions=value=>{const valid=C.settings(value,null);return Object.fromEntries(dimensionNames.map(name=>[name,valid[name]]));};
  const sharedAppearance=value=>({...dimensions(value),...(['auto','vivid'].includes(value?.textMode)?{textMode:value.textMode}:{})});
  let appearance={}, appearanceRevision=0, hasOwnSettings=false, deferredOwn=null;
  const resolveSettings=value=>C.settings(value===undefined?appearance:value,id);
  const appearanceLoaded=chrome.storage.local.get(appearanceKey).then(values=>{
    if(!appearanceRevision)appearance=sharedAppearance(values[appearanceKey]);
  });
  // Keep a rejected read handled until route awaits it; never publish provisional dimensions.
  appearanceLoaded.catch(()=>{});
  function enqueueSettings(key,part){
    const changedDimensions=dimensionNames.some(name=>Object.hasOwn(part,name));
    const changedMode=['auto','vivid'].includes(part.textMode);
    const shared=changedDimensions||changedMode?{
      ...(writes.get(key)?.appearance||inFlightEntry?.appearance||appearance),
      ...(changedDimensions?dimensions(cfg):{}),...(changedMode?{textMode:part.textMode}:{})
    }:writes.get(key)?.appearance;
    writes.set(key,{value:{...cfg},token:generation,...(shared?{appearance:shared}:{})});
    hasOwnSettings=true;
  }
  let id = null, cfg = C.settings(null, null), enabled = true, generation = 0;
  let enabledReady=false, chatReady=false;
  const displayPrefix=prefix+"display:";
  let individual=false, individualReady=false, individualRevision=0;
  let lastPath = null, titleAtSwitch = "", lastDocumentTitle = document.title, initialRoute = true, lastTitle = "";
  let confirmedDocumentSource=null;
  let panelOpen = false, saving = false, storageFailed = false, editRevision = 0;
  let modalVisible = false, modalFrame = 0, scrollSnapshot = null;
  let quietRename = null;
  const quietNode = node => quietRename && (node === quietRename.dialog || node === quietRename.overlay);
  const writes = new Map();
  let loading = false, pendingPatch = {}, enabledRevision = 0;
  let inFlightKey = null;
  let inFlightEntry = null;
  const host = document.createElement("div");
  host.id = HOST;
  host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483600;pointer-events:none;display:none";
  const shadow = host.attachShadow({mode: "open"});
  shadow.innerHTML = `
    <style>
      :host{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:light}
      *{box-sizing:border-box} [hidden]{display:none!important}
      .frame{position:fixed;inset:0;border:var(--border,6px) solid var(--color,#64748b);pointer-events:none}
      .bar{position:fixed;inset:0 0 auto;display:flex;justify-content:center;align-items:center;--controls-space:170px;height:var(--height,56px);padding:0 12px;background:var(--color,#64748b);color:var(--fg,#fff);pointer-events:auto}
      .title-input{flex:none;width:48px;min-width:0;max-width:calc(100% - 2 * var(--controls-space));font:inherit;color:#182132;background:#fff;border:1px solid #64748b;padding:4px 6px;border-radius:4px}
      .edit-actions{position:absolute;right:50px;display:flex}.edit-actions button{font-size:12px;padding:4px;line-height:1.2;max-width:80px;overflow-wrap:anywhere}
      .title[data-editable="false"]{cursor:auto;user-select:text}
      .title{padding-block:.15em;cursor:text;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:calc(100% - 2 * var(--controls-space));min-width:0}
      .title,.title-input,.title-measure{font-family:inherit;font-weight:700;font-size:var(--font,26px);line-height:normal;letter-spacing:normal}
      .title-measure{position:fixed;left:0;top:0;transform:translateX(-100%);visibility:hidden;pointer-events:none;white-space:pre;width:max-content}
      button{font:inherit;cursor:pointer} button:focus-visible,input:focus-visible{outline:3px solid #111827;outline-offset:3px}
      .hide-chat{position:absolute;left:44px;width:40px;height:40px;border:0;border-radius:6px;background:transparent;color:inherit;font-size:26px;line-height:1}.hide-chat:hover{background:#ffffff25}.hide-chat:disabled{opacity:.5;cursor:wait}
      .open{position:absolute;right:50px;border:1px solid currentColor;background:transparent;color:inherit;border-radius:8px;padding:7px 12px;white-space:normal;max-width:120px;overflow-wrap:anywhere;font-size:13px;line-height:1.15;flex:none}
      .rename-notice{position:fixed;top:calc(var(--height,56px) + 8px);left:8px;width:min(360px,calc(100vw - 16px));max-height:calc(100dvh - var(--height,56px) - 16px);overflow:auto;background:#fff;color:#182132;border:1px solid #c8ced8;border-radius:8px;padding:12px;box-shadow:0 4px 16px #0003;pointer-events:auto;font-size:13px;line-height:1.5;overflow-wrap:anywhere}.dismiss-rename{float:right;margin-left:8px}
      .rename-success{position:fixed;top:calc(var(--height,56px) + 3px);right:12px;max-width:calc(100vw - 24px);font-size:12px;line-height:1.5;color:#182132;background:#fff;padding:2px 6px;border-radius:4px;overflow-wrap:anywhere;pointer-events:none}.rename-success:empty{padding:0;background:transparent}
      .rename-progress{font-size:calc(var(--font,26px) * .8);font-weight:700;line-height:1.15;text-align:center;max-width:calc(100% - 2 * var(--controls-space));overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none}.rename-progress:empty{display:none}
      .composition-status{position:fixed;top:calc(var(--height,56px) + 3px);left:50%;transform:translateX(-50%);font-size:12px;line-height:1.5;background:#fff;color:#182132;padding:2px 6px;border-radius:4px;pointer-events:none}
      .panel{position:fixed;top:calc(var(--height,56px) + 10px);right:44px;width:min(340px,calc(100vw - 28px));max-height:calc(100dvh - var(--height,56px) - 24px);overflow:auto;background:#fff;color:#182132;border:1px solid #d8dee8;border-radius:14px;padding:20px;box-shadow:0 12px 38px #0003;pointer-events:auto;font-size:14px;line-height:1.5}
      .heading{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;font-size:17px;margin-bottom:14px}
      .close{border:0;background:#eef1f6;color:#182132;border-radius:6px;padding:3px 9px;font-size:20px}
      .swatches{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));justify-items:center;gap:7px;margin:8px 0 16px}
      .swatch{width:100%;max-width:28px;aspect-ratio:1;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #c8ced8;padding:0}
      .swatch[aria-pressed=true]{box-shadow:0 0 0 3px #111827}
      .choices{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.choices button{padding:6px;border:1px solid #c8ced8;border-radius:6px;background:#fff;color:#182132}.choices button[aria-pressed=true]{background:#dbeafe;border-color:#2563eb} label,.color-row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin:13px 0} .panel{overflow-wrap:anywhere}.panel input[type=range]{max-width:100%}
      input[type=color]{width:64px;height:34px;border:1px solid #d8dee8;border-radius:6px;background:#fff;padding:2px}
      input[type=range]{width:140px;accent-color:#2563eb}
      .note{font-size:12px;color:#586579;margin:14px 0 0}.status{font-size:12px;color:#475569;min-height:18px;margin-top:10px}
      .reset{background:#eef2f7;border:0;border-radius:7px;padding:8px 12px;margin-top:10px;color:#182132}
      .usage{margin-top:14px;font-size:13px;line-height:1.6;color:#182132}.usage summary{cursor:pointer;font-weight:600}.usage ol{padding-left:22px;margin:12px 0 0}.usage li{padding-left:2px;margin:0 0 16px}.usage li:last-child{margin-bottom:0}.usage h3{font-size:13px;font-weight:600;margin:0 0 4px}.usage p{margin:4px 0}.usage .usage-note{font-size:12px;color:#586579}
      .popup-footer{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 12px;margin-top:10px}.other-extensions{display:block;min-width:0;overflow-wrap:anywhere;font-size:12px;color:#1a73e8;text-decoration:none}.other-extensions:hover{color:#1558b0;text-decoration:underline}
      @media(max-width:520px){.bar{--controls-space:134px;padding:0 6px}.open{padding:4px 6px;max-width:84px}.open,.edit-actions{right:44px}}
      @media(max-width:320px){.bar{--edge-inset:clamp(6px,calc((100vw - 240px) / 2 + 6px),44px);--controls-space:calc(var(--edge-inset) + 84px)}.hide-chat{left:var(--edge-inset)}.open,.edit-actions{right:var(--edge-inset)}}
    </style>
    <span class="title-measure" aria-hidden="true"></span>
    <div class="frame" aria-hidden="true"></div>
    <div class="bar" role="region" aria-label="現在のチャット">
      <button type="button" class="hide-chat" aria-label="このチャットの帯を非表示">×</button>
      <span class="title" tabindex="0" role="button" aria-label="チャット名を編集" aria-busy="false"></span><input class="title-input" aria-label="編集するチャット名" hidden><div class="edit-actions" hidden><button type="button" class="cancel-title">キャンセル</button></div>
      <span class="rename-progress" role="status" aria-live="polite" aria-atomic="true"></span>
      <button class="open" aria-label="このチャットの色と表示を設定" aria-expanded="false" aria-controls="settings">色・表示</button>
    </div>
    <div class="rename-success" role="status" aria-live="polite" aria-atomic="true"></div>
    <div class="composition-status" hidden>変換中</div>
    <div class="rename-notice" hidden><button class="dismiss-rename" type="button" aria-label="名前変更の通知を閉じる">×</button><div class="rename-status" id="rename-message" role="status" aria-live="polite"></div><div class="failed-draft" hidden><label>入力した名前<input class="draft-value" readonly aria-label="入力した名前" style="width:100%;min-width:0"></label><button type="button" class="reuse-draft">この名前で編集し直す</button></div></div>
    <section class="panel" id="settings" aria-label="チャットの色と表示" hidden>
      <div class="heading">このチャットの色設定<button class="close" aria-label="設定を閉じる">×</button></div>
      <div>色を選ぶ</div><div class="swatches"></div>
      <div class="color-row"><span>自由な色</span><input name="color" type="color" aria-label="帯の色を選択"></div>
      <div>文字色</div>
      <div class="choices" aria-label="文字色モード">
        <button data-mode="auto">読みやすい</button>
        <button data-mode="vivid">目立つ色</button>
        <button data-mode="custom">色を選択</button>
      </div>
      <div class="color-row"><span>文字色を選択</span><input name="textColor" type="color" aria-label="文字色を選択"></div>
      <label>帯の高さ <output id="height-value"></output><input name="height" aria-label="帯の高さ" type="range" min="40" max="88" step="2"></label>
      <label>文字サイズ <output id="fontSize-value"></output><input name="fontSize" aria-label="文字サイズ" type="range" min="18" max="36"></label>
      <label>枠の太さ <output id="border-value"></output><input name="border" aria-label="枠の太さ" type="range" min="0" max="12"></label>
      <button class="reset">見た目を初期設定に戻す</button>
      <div class="status" role="status" aria-live="polite"></div>
      <details class="usage"><summary>使い方</summary><ol>
        <li><h3>チャットごとに色を設定</h3><p>色見本や「自由な色」で、このチャットの色を選びます。</p><p class="usage-note">色や表示設定は、このブラウザ内にチャットごとに保存されます。</p></li>
        <li><h3>帯・枠・文字を調整</h3><p>帯の高さ、枠の太さ、文字サイズと文字色を調整できます。</p></li>
        <li><h3>チャット名を変更</h3><p>帯のチャット名をクリックすると編集できます。</p><p>Enterまたは編集欄の外側のページをクリックすると確定します。</p><p class="usage-note">ChatGPTの表示言語が日本語・英語の場合のみ対応します。</p><p class="usage-note">チャットがフォルダ内にある場合、フォルダが閉じているとチャット名を変更できません。</p><p class="usage-note">キャンセルで編集を取り消せます。</p></li>
        <li><h3>このチャットの色表示をOFF</h3><p>帯の左端の×で、このチャットの帯と枠を非表示にします。</p><p class="usage-note">色やサイズの設定は残ります。全体ONなら、拡張アイコンを開くと再表示できます。</p></li>
      </ol></details>
      <div class="popup-footer"><a class="other-extensions" href="https://chromewebstore.google.com/search/(by%20marusin)?hl=ja&authuser=0" target="_blank" rel="noopener noreferrer">Chrome拡張を見る</a></div>
    </section>`;
  I?.bind(shadow);
  if(I)host.lang=I.locale.replace('_','-');
  document.documentElement.append(host);
  const $ = s => shadow.querySelector(s);
  // Explicitly requested, bounded performance sampling. No text, IDs or values.
  let perfSession=null, perfTimer=0, perfLongTasks=null;
  function perfBucket(session=perfSession) {
    if(!session?.phases)return null;
    const ms=performance.now()-session.started;
    return session.phases[ms<3000?'before':ms<6000?'hover':ms<9000?'afterQuiet':'afterInteraction'];
  }
  function perfSignal(name,count=1) {
    if(!perfSession)return;
    const bucket=perfBucket()||perfSession;
    bucket.signals[name]=(bucket.signals[name]||0)+count;
  }
  function profiled(name, fn) {
    return function(...args) {
      const session=perfSession;
      if(!session)return fn.apply(this,args);
      const start=performance.now(),bucket=perfBucket(session);
      try{return fn.apply(this,args);}
      finally {
        const elapsed=performance.now()-start;
        for(const work of bucket?[session.work,bucket.work]:[session.work]) {
          const item=work[name]||(work[name]={calls:0,ms:0,maxMs:0});
          item.calls++;item.ms+=elapsed;item.maxMs=Math.max(item.maxMs,elapsed);
        }
      }
    };
  }
  function stopPerf(reason='complete') {
    clearTimeout(perfTimer);perfTimer=0;perfLongTasks?.disconnect();perfLongTasks=null;
    if(!perfSession)return;
    const session=perfSession;perfSession=null;
    session.elapsedMs=Math.round(performance.now()-session.started);
    delete session.started;session.status=reason;session.cleanup=true;
    for(const work of [session.work,...Object.values(session.phases||{}).map(p=>p.work)])for(const item of Object.values(work))for(const k of ['ms','maxMs'])item[k]=Math.round(item[k]*100)/100;
    host.setAttribute('data-performance-diagnostic',JSON.stringify(session));
  }
  function startPerf(hover=false) {
    stopPerf('restarted');
    perfSession={schema:2,status:'observing',started:performance.now(),durationMs:hover?12000:8000,
      enabled,layoutActive:document.documentElement.hasAttribute('data-thread-colors-active'),
      viewport:{width:innerWidth,height:innerHeight},work:{},signals:{},cleanup:false};
    if(hover) {
      perfSession.phases=Object.fromEntries(['before','hover','afterQuiet','afterInteraction'].map(name=>[name,{work:{},signals:{}}]));
      perfSession.phaseWindowsMs={before:[0,3000],hover:[3000,6000],afterQuiet:[6000,9000],afterInteraction:[9000,12000]};
      perfSession.longTasks=[];
      if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        const session=perfSession;
        perfLongTasks=new PerformanceObserver(list=>{
          if(perfSession!==session)return;
          for(const e of list.getEntries())if(e.startTime>=session.started&&session.longTasks.length<40)
            session.longTasks.push({atMs:Math.round(e.startTime-session.started),durationMs:Math.round(e.duration)});
        });
        perfLongTasks.observe({type:'longtask'});
      }
    }
    host.setAttribute('data-performance-diagnostic',JSON.stringify({schema:2,status:'observing',cleanup:false}));
    perfTimer=setTimeout(()=>stopPerf(),perfSession.durationMs);
  }
  host.addEventListener('thread-colors-performance-start',()=>startPerf());
  host.addEventListener('thread-colors-hover-start',()=>startPerf(true));
  host.addEventListener('thread-colors-performance-stop',()=>stopPerf('cancelled'));
  const style = document.createElement("style");
  style.id = HOST + "-layout";
  // Body is the containing block for fixed page UI; the extension stays outside it.
  // Only app roots / direct viewport-height shells are resized, never all descendants.
  style.textContent = `
    /* The fixed body leaves normal flow. Keep the root's measurable boundary
       at viewport height for page-owned floating placement/collision checks. */
    html[data-thread-colors-active] {min-height:100dvh!important;}
    html[data-thread-colors-active] body {position:fixed!important;inset:var(--thread-colors-height) 0 0!important;margin:0!important;width:auto!important;height:auto!important;min-height:0!important;overflow:auto!important;transform:translateZ(0)!important;}
    html[data-thread-colors-active] body > :is(#__next,#root,.h-dvh,.h-screen) {height:100%!important;min-height:0!important;}
    html[data-thread-colors-active] body > :is(.min-h-dvh,.min-h-screen) {min-height:100%!important;}
    html[data-thread-colors-active] [data-thread-colors-height-shell] {max-height:calc(100dvh - var(--thread-colors-height))!important;}
    html[data-thread-colors-active] [data-thread-colors-min-shell] {min-height:0!important;}
  `;
  document.head.append(style);
  const shellNodes = new Map();
  let shellViewport = "", shellDirty = true, shellActive = false, shellStructureDirty=true;
  let layoutAncestors = new Set();
  const composerSelector = '#prompt-textarea,main textarea,main [contenteditable="true"][role="textbox"]';
  function refreshShells() {
    // Keep stable corrections in place: removing them on every UI update would
    // temporarily grow scroll containers and clamp a conversation at the bottom.
    const active = enabledReady && chatReady && individualReady && individual && !loading && enabled && id && !modalVisible;
    const viewport = innerWidth + ':' + innerHeight;
    const resized = viewport !== shellViewport;
    if (!shellDirty && !resized && Boolean(active) === shellActive) return;
    perfSignal('shell-dirty-pass');
    const rebuild=shellStructureDirty||Boolean(active)!==shellActive;
    if(rebuild)perfSignal('shell-ancestor-rebuild');
    shellStructureDirty=false;
    shellDirty = false; shellActive = Boolean(active);
    shellViewport = viewport;
    const ancestors = active&&!rebuild ? new Set(layoutAncestors) : new Set();
    for (const anchor of active&&rebuild ? document.querySelectorAll(composerSelector + ',main') : []) {
      if (anchor.closest('dialog,[role="dialog"],[role="alertdialog"]')) continue;
      for (let el = anchor.matches('main') ? anchor : anchor.parentElement;
           el && el !== document.body; el = el.parentElement) ancestors.add(el);
    }
    layoutAncestors = ancestors;
    for (const [el] of shellNodes) {
      // A maximum preserves smaller page-owned heights. Keep it installed through
      // focus/class/style changes instead of expanding the whole conversation
      // to 100vh, reading layout, then shrinking it again.
      if (!ancestors.has(el)) {
        el.removeAttribute('data-thread-colors-height-shell');
        el.removeAttribute('data-thread-colors-min-shell');
        shellNodes.delete(el);
      }
    }
    const corrections = [];
    for (const el of ancestors) {
      if (shellNodes.has(el)) continue;
      perfSignal('shell-style-read');
      const css = getComputedStyle(el);
      const full = value => Math.abs(parseFloat(value) - innerHeight) <= 1;
      const height = full(css.height) || el.matches('.h-dvh,.h-screen');
      const minimum = full(css.minHeight) || el.matches('.min-h-dvh,.min-h-screen');
      if (height || minimum) corrections.push({el,height,minimum});
    }
    for (const {el,height,minimum} of corrections) {
      if (height) el.setAttribute('data-thread-colors-height-shell','');
      if (minimum) el.setAttribute('data-thread-colors-min-shell','');
      shellNodes.set(el, true);
    }
  }
  // Place only a currently hovered/focused, ARIA-linked upper tooltip below in the
  // body portal observed in diagnostics. Keep body containment for fixed UI.
  let tooltipHover=null, tooltipFocus=null, tooltipTrigger=null, tooltipFrame=0, tooltipCorrection=null;
  const tooltipOwnStyles=new WeakMap();
  function clearTooltipCorrection() {
    const own=tooltipCorrection;tooltipCorrection=null;
    if(!own)return;
    for(const [name,entry] of Object.entries(own.properties)) {
      if(own.el.style.getPropertyValue(name)!==entry.written||own.el.style.getPropertyPriority(name)!=='important')continue;
      if(entry.value)own.el.style.setProperty(name,entry.value,entry.priority);
      else own.el.style.removeProperty(name);
    }
    tooltipOwnStyles.set(own.el,own.el.getAttribute('style'));
  }
  function tooltipStyle(state,name,value) {
    let entry=state.properties[name];
    if(!entry)entry=state.properties[name]={value:state.el.style.getPropertyValue(name),priority:state.el.style.getPropertyPriority(name)};
    if(entry.written===value&&state.el.style.getPropertyValue(name)===value)return false;
    state.el.style.setProperty(name,value,'important');entry.written=state.el.style.getPropertyValue(name);return true;
  }
  function requestTooltipCheck() {
    if(!tooltipTrigger||tooltipFrame)return;
    tooltipFrame=requestAnimationFrame(()=>{tooltipFrame=0;correctTooltip();});
  }
  function tooltipSource(node) {
    if(!(node instanceof Element))return null;
    // A description source need not be clickable. Only the observed semantic
    // span is provisionally tracked; correction still requires its own ARIA link.
    const button=node.closest('button,[role="button"],span[role="img"]');
    if(button?.matches('span[role="img"]')&&button.parentElement?.closest('button,[role="button"],[aria-describedby]'))return null;
    if(!button||button.closest('dialog,[role="dialog"],[role="alertdialog"],[role="menu"],article,[data-message-author-role]')||!document.body.contains(button))return null;
    return button;
  }
  function selectTooltipTrigger() {
    const next=tooltipHover||tooltipFocus;
    if(next!==tooltipTrigger){clearTooltipCorrection();tooltipTrigger=next;}
    requestTooltipCheck();
  }
  function tooltipOver(e) {tooltipHover=tooltipSource(e.target);selectTooltipTrigger();}
  function tooltipOut(e) {if(e.relatedTarget instanceof Node&&tooltipHover?.contains(e.relatedTarget))return;tooltipHover=null;selectTooltipTrigger();}
  function tooltipFocusIn(e) {tooltipHover=null;tooltipFocus=tooltipSource(e.target);selectTooltipTrigger();}
  function tooltipFocusOut(e) {if(e.relatedTarget instanceof Node&&tooltipFocus?.contains(e.relatedTarget))return;tooltipFocus=null;selectTooltipTrigger();}
  function tooltipDescriptionIds(button) {
    const owners=[button],wrapper=button.parentElement;
    // Observed Work structure only: immediate span with this button as its sole
    // element child. Never walk further ancestors or accept arbitrary spans.
    if(button.matches('button,[role="button"]')&&wrapper?.tagName==='SPAN'&&wrapper.children.length===1&&wrapper.firstElementChild===button&&
      !wrapper.matches('[tabindex],[contenteditable],[hidden],[inert],[aria-hidden="true"]')&&
      (!wrapper.hasAttribute('role')||['presentation','none'].includes(wrapper.getAttribute('role')))&&
      wrapper.querySelectorAll('button,[role="button"],a[href],input,select,textarea,[tabindex],[contenteditable]').length===1)owners.push(wrapper);
    const ids=owners.flatMap(owner=>(owner.getAttribute('aria-describedby')||'').trim().split(/\s+/).filter(Boolean));
    if(!ids.length||ids.length>4||new Set(ids).size!==ids.length)return [];
    return ids;
  }
  function correctTooltip() {
    const button=tooltipTrigger;
    const active=enabledReady&&chatReady&&individualReady&&individual&&!loading&&enabled&&id&&!modalVisible;
    if(!active||!button?.isConnected||tooltipSource(button)!==button){clearTooltipCorrection();return;}
    const ids=tooltipDescriptionIds(button);
    if(!ids.length||ids.length>4){clearTooltipCorrection();return;}
    const tips=[];
    // Exact ID queries only while a trigger is active; duplicate DOM IDs are
    // ambiguous even when getElementById would return a first match.
    for(const key of ids) {
      const matches=document.querySelectorAll('#'+CSS.escape(key));
      if(matches.length!==1){clearTooltipCorrection();return;}
      if(matches[0].matches('[role="tooltip"]'))tips.push(matches[0]);
    }
    if(tips.length!==1){clearTooltipCorrection();return;}
    // For the new image-description path, reject competing reference owners
    // and non-visible sources. These bounded queries run only for an active tip.
    if(button.matches('span[role="img"]')&&(
      button.closest('[hidden],[inert],[aria-hidden="true"]')||
      !button.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||
      ids.some(key=>document.querySelectorAll('[aria-describedby~="'+CSS.escape(key)+'"]').length!==1)
    )){clearTooltipCorrection();return;}
    const tip=tips[0],parent=tip.parentElement;
    if(tooltipCorrection&&tooltipCorrection.el!==tip)clearTooltipCorrection();
    // The observed portal is body > display:contents > tooltip. No arbitrary
    // clipped/transformed ancestor chain, modal, generated class or asset match.
    if(parent!==document.body&&!(parent?.parentElement===document.body&&getComputedStyle(parent).display==='contents')){clearTooltipCorrection();return;}
    if(tip.closest('[hidden],[inert],[aria-hidden="true"],dialog,[role="dialog"],[role="alertdialog"],[role="menu"],article,[data-message-author-role]')){clearTooltipCorrection();return;}
    const css=getComputedStyle(tip),own=tooltipCorrection;
    if(own&&Object.entries(own.properties).some(([name,e])=>tip.style.getPropertyValue(name)!==e.written||tip.style.getPropertyPriority(name)!=='important')) {
      clearTooltipCorrection();return; // Preserve a newer page-owned value.
    }
    if(tip.offsetParent!==document.body||css.position!=='absolute'||css.pointerEvents!=='none'||css.display==='none'||css.visibility!=='visible'||Number(css.opacity)===0||
      (!own&&css.translate!=='none')||css.rotate!=='none'||css.scale!=='none') {clearTooltipCorrection();return;}
    const bar=$('.bar').getBoundingClientRect(),b=button.getBoundingClientRect();
    let r=tip.getBoundingClientRect();
    if(!b.width||!b.height||b.top<bar.bottom-1||b.bottom>bar.bottom+96||!r.width||!r.height){clearTooltipCorrection();return;}
    const state=own||{el:tip,properties:{},shiftX:0,shiftY:0,wrapped:false};
    const edge=Math.max(4,cfg.border);
    const available=innerWidth-2*edge;
    if(r.width>available||state.wrapped) {
      tooltipCorrection=state;state.wrapped=true;
      let changed=false;
      for(const [name,value] of Object.entries({'max-width':available+'px','min-width':'0px','box-sizing':'border-box','white-space':'normal','overflow-wrap':'anywhere','height':'auto','max-height':'none'}))
        changed=tooltipStyle(state,name,value)||changed;
      // One necessary read after wrapping; subsequent callbacks make no writes.
      if(changed)r=tip.getBoundingClientRect();
    }
    const nativeTop=r.top-state.shiftY,nativeLeft=r.left-state.shiftX;
    const maxTop=innerHeight-edge-r.height;
    if(maxTop<b.bottom+6||r.width>available+.5){clearTooltipCorrection();return;}
    const destination=nativeTop>=b.bottom?Math.min(nativeTop,maxTop):b.bottom+6;
    const left=Math.max(edge,Math.min(nativeLeft,innerWidth-edge-r.width));
    const dx=Math.round((left-nativeLeft)*100)/100,dy=Math.round((destination-nativeTop)*100)/100;
    if(!dx&&!dy&&!state.wrapped){clearTooltipCorrection();return;}
    tooltipStyle(state,'translate',`${dx}px ${dy}px`);
    state.shiftX=dx;state.shiftY=dy;state.signature=tip.getAttribute('style');tooltipOwnStyles.set(tip,state.signature);tooltipCorrection=state;
  }

  function tooltipMutations(records) {
    if(!tooltipTrigger)return;
    const tip=tooltipCorrection?.el, descriptionIds=tooltipDescriptionIds(tooltipTrigger);
    for(const r of records) {
      if(r.type==='attributes') {
        if(r.attributeName==='style'&&tooltipOwnStyles.has(r.target)&&r.target.getAttribute('style')===tooltipOwnStyles.get(r.target))continue;
        const linked=descriptionIds.includes(r.target.id);
        if(r.target===tooltipTrigger||linked||r.target===document.body||layoutAncestors.has(r.target)||r.target.contains(tooltipTrigger)||(tip&&r.target.contains(tip))){requestTooltipCheck();return;}
      } else if(r.target===tooltipTrigger.parentElement||r.target.contains(tooltipTrigger)||r.target===document.body||r.target.parentElement===document.body||!tooltipTrigger.isConnected||tip&&!tip.isConnected){requestTooltipCheck();return;}
    }
  }
  document.addEventListener('pointerover',tooltipOver,true);
  document.addEventListener('pointerout',tooltipOut,true);
  document.addEventListener('focusin',tooltipFocusIn,true);
  document.addEventListener('focusout',tooltipFocusOut,true);
  window.addEventListener('scroll',requestTooltipCheck,true);
  window.addEventListener('resize',requestTooltipCheck);
  function setOpen(value) {
    if(value)clearRenameSuccess();
    else $('.usage').open=false;
    panelOpen = value;
    $(".panel").hidden = !value;
    $(".open").setAttribute("aria-expanded", String(value));
  }
  function status(text) { $(".status").textContent = text; }
  const dialogSelector = 'dialog,[role="dialog"],[role="alertdialog"]';
  // Index dialogs once, then inspect only changed subtrees. Do not repeatedly
  // scan a long conversation on every timer tick or ancestor style mutation.
  const dialogNodes = new Set(document.querySelectorAll(dialogSelector));
  function visibleModal(el) {
    if (el.closest('#' + HOST) || !el.isConnected) return false;
    for (let node = el; node; node = node.parentElement) {
      const css = getComputedStyle(node);
      if (node.hidden || node.getAttribute('aria-hidden') === 'true' ||
          css.display === 'none' || css.visibility === 'hidden' || css.visibility === 'collapse' ||
          (Number(css.opacity) === 0 && !quietNode(node)) || css.contentVisibility === 'hidden') return false;
    }
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) return false;
    if (el.matches('dialog:modal')) return true;
    if (el.tagName === 'DIALOG' && !el.hasAttribute('open')) return false;
    const modal = el.getAttribute('aria-modal');
    if (modal === 'true') return true;
    // Unlabelled full-screen dialog fallback; ordinary side panels / menus do not qualify.
    return modal !== 'false' && getComputedStyle(el).position === 'fixed' &&
      r.width >= innerWidth * .8 && r.height >= innerHeight * .8;
  }
  function restoreScroll(snapshot) {
    if (!snapshot || snapshot.path !== location.pathname) return;
    for (const [el, x, y] of snapshot.nodes) if (el.isConnected) {el.scrollLeft = x; el.scrollTop = y;}
    window.scrollTo({left:snapshot.x, top:snapshot.y, behavior:'instant'});
  }
  function checkModals() {
    const dialogs = [...dialogNodes].filter(el=>el.isConnected);
    perfSignal('indexed-dialog-candidates',dialogs.length);
    const next = dialogs.some(d => d !== quietRename?.dialog && visibleModal(d));
    if (next === modalVisible) return;
    perfSignal(next?'modal-enter':'modal-exit');
    if (next) {
      // Snapshot only on entry, outside dialogs. Never carry old-thread scroll into a new thread.
      scrollSnapshot = {path:location.pathname, x:scrollX, y:scrollY, nodes:
        [...document.body.querySelectorAll('*'), document.body].filter(el =>
          (el.scrollTop || el.scrollLeft) && !el.closest(dialogSelector)
        ).map(el => [el, el.scrollLeft, el.scrollTop])};
      setOpen(false); // Do not reopen a floating panel or steal modal focus on return.
    }
    modalVisible = next;
    if (location.pathname !== lastPath) void route();
    apply();
    restoreScroll(scrollSnapshot);
    if (!next) scrollSnapshot = null;
  }
  function scheduleModalCheck(reason='resize') {
    perfSignal('schedule-'+(typeof reason==='string'?reason:'resize'));
    if (!modalFrame) modalFrame = requestAnimationFrame(() => {perfSignal('scheduled-frame');modalFrame = 0; checkModals(); refreshShells();});
  }
  function containsDialog(node) {
    return node.nodeType === Node.ELEMENT_NODE &&
      (node.matches(dialogSelector) || [...dialogNodes].some(el=>node.contains(el)));
  }
  // Body excludes our host/Shadow DOM and html layout writes, preventing feedback loops.
  const modalObserver = new MutationObserver(profiled('mutationBatch',records => {
    tooltipMutations(records);
    let modalChanged=false;
    for(const r of records) {
      if(perfSession) {
        perfSignal('mutation-'+r.type);
        if(r.type==='attributes') {
          perfSignal('attribute-'+r.attributeName);
          if(r.target.closest('[role="tooltip"]'))perfSignal('tooltip-attribute');
          if(layoutAncestors.has(r.target))perfSignal('layout-ancestor-attribute');
        } else for(const [nodes,label] of [[r.addedNodes,'added'],[r.removedNodes,'removed']])
          for(const node of nodes)if(node.nodeType===1&&(node.matches('[role="tooltip"]')||node.querySelector('[role="tooltip"]')))perfSignal('tooltip-'+label);
      }
      if(r.type==='attributes') {
        if(r.attributeName==='role') {
          if(r.target.matches(dialogSelector))dialogNodes.add(r.target);
          else if(dialogNodes.delete(r.target))modalChanged=true;
        }
        if(containsDialog(r.target))modalChanged=true;
        if(r.attributeName==='href')titleLinksDirty=true;
      } else {
        for(const node of [...r.addedNodes,...r.removedNodes]) {
          if(node.nodeType!==Node.ELEMENT_NODE)continue;
          if(!r.target.closest?.('main,article,[data-message-author-role]') &&
            !node.matches('main,article,[data-message-author-role]') &&
            (node.matches('a[href*="/c/"]')||node.querySelector('a[href*="/c/"]')))titleLinksDirty=true;
          if(node.matches(dialogSelector)){dialogNodes.add(node);modalChanged=true;}
          for(const el of node.querySelectorAll(dialogSelector)){dialogNodes.add(el);modalChanged=true;}
        }
      }
    }
    for(const el of dialogNodes)if(!el.isConnected){dialogNodes.delete(el);modalChanged=true;}
    if(modalChanged)scheduleModalCheck('dialog-mutation');
    const structureChanged=records.some(r=>r.type==='childList'&&
      [...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===Node.ELEMENT_NODE&&
        (n.matches(composerSelector+',main')||n.querySelector(composerSelector+',main'))));
    if(structureChanged)shellStructureDirty=true;
    if (structureChanged||records.some(r=>r.type==='attributes'&&
      ['class','style','hidden'].includes(r.attributeName)&&layoutAncestors.has(r.target))) {
      shellDirty = true; scheduleModalCheck(structureChanged?'layout-structure':'layout-attribute');
    }
  }));
  modalObserver.observe(document.body, {subtree:true, childList:true, attributes:true,
    attributeFilter:['aria-describedby','role','aria-modal','aria-hidden','hidden','open','class','style','href']});
  function layoutTransition(e) {
    if(tooltipTrigger&&(e.target===tooltipCorrection?.el||(tooltipTrigger.getAttribute('aria-describedby')||'').split(/\s+/).includes(e.target.id)))requestTooltipCheck();
    if (layoutAncestors.has(e.target)) {shellDirty = true; scheduleModalCheck('layout-'+e.type);}
    else if (containsDialog(e.target)) scheduleModalCheck('dialog-'+e.type);
  }
  document.body.addEventListener('transitionend', layoutTransition);
  document.body.addEventListener('animationend', layoutTransition);
  window.addEventListener('resize', scheduleModalCheck);
  function apply() {
    perfSignal('apply');
    const active = enabledReady && chatReady && individualReady && individual && !loading && enabled && Boolean(id) && !modalVisible;
    if(!active)clearRenameSuccess();
    if(!active)host.style.display = "none";
    document.documentElement.toggleAttribute("data-thread-colors-active", active);
    if (active) {
      document.documentElement.style.setProperty("--thread-colors-height", cfg.height + "px");
      host.style.setProperty("--color", cfg.color);
      host.style.setProperty("--fg", C.textForeground(cfg));
      host.style.setProperty("--height", cfg.height + "px");
      host.style.setProperty("--alignment", "center");
      host.style.setProperty("--font", cfg.fontSize + "px");
      scheduleTitleWidth();
      host.style.setProperty("--border", cfg.border + "px");
    } else document.documentElement.style.removeProperty("--thread-colors-height");
    refreshShells();
    for (const name of ["color", "textColor", "height", "fontSize", "border"]) {
      const input = $(`[name="${name}"]`);
      if (shadow.activeElement !== input) input.value = cfg[name];
      const output = $("#" + name + "-value");
      if (output) output.value = cfg[name] + "px";
    }
    shadow.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === cfg.textMode)));
    shadow.querySelectorAll(".swatch").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.color === cfg.color)));
    // Publish only after settings, title and page layout are ready, in this task.
    host.style.display = active ? "block" : "none";
    updateNativeEditing();
    if(active)requestTooltipCheck();else clearTooltipCorrection();
  }
  // Page-lifetime, chat-scoped evidence only; never store an editor draft.
  const knownTitles = new Map();
  let titleLinksDirty=true, titleLinks=[];
  function title() {
    if (!id || C.threadId(location.href)!==id) return;
    let text = "";
    const known=knownTitles.get(id);
    if(titleLinksDirty) {
      perfSignal('title-link-rebuild');
      titleLinks=[...document.querySelectorAll('a[href*="/c/"]')].filter(a=>!a.closest('main,article,[data-message-author-role]'));
      titleLinksDirty=false;
    }
    for (const a of titleLinks) {
      perfSignal('title-link-visit');
      if(!a.isConnected)continue;
      if (a.closest('main,article,[data-message-author-role]')) continue;
      if (C.threadId(a.href) !== id) continue;
      text = linkName(a);
      if (text) break;
    }
    // On a route change, an unchanged document.title may belong to the old thread.
    if(confirmedDocumentSource?.id===id && confirmedDocumentSource.title===document.title)text=C.pageTitle(document.title);
    if (!text && (initialRoute || document.title !== titleAtSwitch) &&
        (!known || known.documentTitle !== document.title)) text = C.pageTitle(document.title);
    if(text)knownTitles.set(id,{name:text,documentTitle:document.title});
    text ||= known?.name || T("チャット名を確認中…");
    if (text !== lastTitle) {
      $(".title").textContent = text;
      $(".title").title = text;
      lastTitle = text;
    }
  }
  let navigationRevision = 0;
  async function route() {
    const path = location.pathname;
    if (path === lastPath) { title(); lastDocumentTitle = document.title; return; }
    navigationRevision++;
    stopPerf('navigation');
    setRenameProgress(false);
    failedDraft=null;$('.failed-draft').hidden=true;$('.draft-value').value='';
    stopLateObservation('navigation');
    clearRenameSuccess();
    confirmedDocumentSource=null;
    if (editSession) {endEdit(); renameNotice('');}
    initialRoute = lastPath === null;
    lastPath = path;
    titleAtSwitch = lastDocumentTitle;
    lastDocumentTitle = document.title;
    const token = ++generation;
    loading = true; chatReady=false; pendingPatch = {}; storageFailed = false;hasOwnSettings=false;deferredOwn=null;
    id = C.threadId(location.href);
    individual=false;individualReady=false;
    void readIndividual(id);
    cfg = C.settings(null, id);
    lastTitle = "";
    $(".title").textContent = "";
    setOpen(false);
    status("");
    apply(); title();
    if (!id) { loading = false; return; }
    const key = prefix + id;
    try {
      const [values] = await Promise.all([chrome.storage.local.get(key),appearanceLoaded]);
      if (token !== generation) return;
      const localWrite = writes.get(key) || (inFlightKey === key ? inFlightEntry : null);
      const raw=localWrite?localWrite.value:deferredOwn?deferredOwn.value:values[key];
      deferredOwn=null;hasOwnSettings=raw!==undefined;
      cfg = C.settings({...resolveSettings(raw), ...pendingPatch}, id);
      loading = false; chatReady=true;
      if (Object.keys(pendingPatch).length) {
        enqueueSettings(key,pendingPatch);
        void flush();
      }
      pendingPatch = {};
      storageFailed = false;
      apply();
    } catch {
      if (token !== generation) return;
      loading = false;
      storageFailed = true;
      chatReady=false;apply();
      status(T("設定を読み込めません。拡張機能を再読み込みしてからページを更新してください。"));
    }
  }
  async function readIndividual(target) {
    const revision=++individualRevision;
    if(!target)return;
    try {
      const key=displayPrefix+target, values=await chrome.storage.local.get(key);
      if(revision!==individualRevision || id!==target || C.threadId(location.href)!==target)return;
      individual=values[key]===true;individualReady=true;apply();
    } catch {if(revision===individualRevision){individualReady=false;apply();}}
  }
  // Popup accesses only this content script's current conversation, not tab URLs.
  chrome.runtime?.onMessage?.addListener((request,sender,respond)=>{
    if(sender.id!==chrome.runtime.id || !['chat-colors:state','chat-colors:set-display'].includes(request?.type))return;
    const current=C.threadId(location.href);
    if(request.type==='chat-colors:state') {
      respond({id:current,ready:current===id&&individualReady,individual:current===id&&individual,enabled});return;
    }
    if(!current || current!==id || request.id!==current || typeof request.value!=='boolean') {
      respond({ok:false,error:T('チャットが切り替わりました。現在のチャットを確認してください。')});return;
    }
    const key=displayPrefix+current;
    chrome.storage.local.set({[key]:request.value}).then(()=>respond({ok:true}),()=>respond({ok:false,error:T('設定を保存できませんでした。')}));
    return true;
  });
  async function flush() {
    if (saving) return;
    saving = true;
    let succeeded = false;
    while (writes.size) {
      const [key, entry] = writes.entries().next().value;
      writes.delete(key);
      inFlightKey = key;
      inFlightEntry = entry;
      try {
        await chrome.storage.local.set({[key]: entry.value,...(entry.appearance?{[appearanceKey]:entry.appearance}:{})});
        succeeded = true;
        if (entry.token === generation && !writes.has(key)) status(T("保存しました"));
      } catch {
        succeeded = false;
        if (entry.token === generation) status(T("保存できませんでした。表示のみ変更されています。もう一度設定してください。"));
      }
    }
    inFlightKey = null;
    inFlightEntry = null;
    saving = false;
    // Reconcile events received during a write, including a concurrent tab's save.
    if (succeeded && id && !loading) {
      const token = generation, revision = editRevision, key = prefix + id;
      try {
        const values = await chrome.storage.local.get(key);
        if (token === generation && revision === editRevision && !saving && !loading) {
          hasOwnSettings=values[key]!==undefined;cfg = resolveSettings(values[key]); apply();
        }
      } catch { /* The completed write remains valid; later storage events still sync. */ }
    }
  }
  function change(part) {
    if (location.pathname !== lastPath) {void route(); return;}
    editRevision++;
    cfg = C.settings({...cfg, ...part}, id);
    apply();
    if (storageFailed) status(T("読み込みエラーのため保存していません。ページを更新してください。"));
    else if (loading) {Object.assign(pendingPatch, part); status(T("読み込み後に保存します…"));}
    else if (id) {
      status(T("保存中…"));
      enqueueSettings(prefix+id,part);
      void flush();
    }
  }
  // Native ChatGPT labels observed in user DOM; independent of extension i18n.
  const nativeLabels={
    ja:{action:'チャットのアクション',rename:'名前を変更',heading:'チャット名を変更',input:'チャットのタイトル',save:'保存',cancel:'キャンセル'},
    en:{action:'Chat actions',rename:'Rename',heading:'Rename chat',input:'Chat title',save:'Save',cancel:'Cancel'}
  };
  const nativeLang=()=>document.documentElement.getAttribute('lang')||'';
  const nativeProfile=()=>{const match=/^(ja|en)(?:-[a-z0-9]+)*$/i.exec(nativeLang());return match?nativeLabels[match[1].toLowerCase()]:null;};
  let nativeRevision=0, abortNativeWait=null;
  const canBeginNativeEdit=()=>Boolean(nativeProfile()&&enabledReady&&chatReady&&individualReady&&enabled&&individual&&!loading&&id&&C.threadId(location.href)===id&&!modalVisible&&!renaming);
  function updateNativeEditing(){
    const allowed=canBeginNativeEdit(),el=$('.title');
    for(const [key,value] of Object.entries({role:'button',tabindex:'0','aria-label':T('チャット名を編集')})){
      if(allowed)el.setAttribute(key,value);else el.removeAttribute(key);
    }
    if(!allowed&&!renaming)el.removeAttribute('aria-busy');
    el.dataset.editable=String(allowed);
  }
  const nativeLanguageObserver=new MutationObserver(()=>{
    nativeRevision++;stopLateObservation('language-changed');
    if(editSession&&!renaming)endEdit();
    abortNativeWait?.();updateNativeEditing();
  });
  nativeLanguageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  let renaming = false, editSession = null, composingTitle = false, imeReleaseRequired=false, imeEndedAt=-Infinity;
  let titleWidthFrame=0,titleWidthKey='';
  function measureTitleWidth() {
    if(!editSession||renaming||host.style.display==='none')return;
    const input=$('.title-input'),key=input.value+'\0'+cfg.fontSize;
    if(key===titleWidthKey)return;
    titleWidthKey=key;
    const mirror=$('.title-measure');mirror.textContent=input.value;
    // Same shaping/font as the title; 12px padding + 2px borders + 4px caret room.
    input.style.width=Math.max(48,Math.ceil(mirror.getBoundingClientRect().width)+18)+'px';
  }
  function scheduleTitleWidth() {
    if(editSession&&!renaming&&!titleWidthFrame)titleWidthFrame=requestAnimationFrame(()=>{titleWidthFrame=0;measureTitleWidth();});
  }
  let diagnostic=null, diagnosticStart=0, diagnosticFrame=0;
  function trace(kind,details={}) {
    if(!diagnostic)return;
    if(diagnostic.events.length>=400){const i=diagnostic.events.findIndex((e,i)=>i>0&&['name-check','evidence-detail','frame'].includes(e.kind));diagnostic.events.splice(i<0?1:i,1);diagnostic.truncated=true;}
    diagnostic.events.push({ms:Math.round(performance.now()-diagnosticStart),kind,...details});
    host.setAttribute('data-rename-diagnostic',JSON.stringify(diagnostic));
  }
  function startTrace() {
    diagnostic={version:chrome.runtime?.getManifest?.().version||'1.0.0',diagnosticSchema:5,events:[],truncated:false};diagnosticStart=performance.now();
    trace('start');let previous='';
    const frame=()=>{
      const ds=[...document.querySelectorAll(dialogSelector)];
      const state={dialogs:ds.length,visibleDialogs:ds.filter(visibleModal).length,quiet:Boolean(quietRename),
        dialogStates:ds.slice(0,5).map(d=>({opacity:getComputedStyle(d).opacity,hidden:d.hidden,
          siblingOverlays:d.parentElement?[...d.parentElement.children].filter(e=>e.matches('.codex-dialog-overlay[data-state="open"]')).length:0})),
        dialogOpacity:quietRename?getComputedStyle(quietRename.dialog).opacity:null,
        overlayOpacity:quietRename?getComputedStyle(quietRename.overlay).opacity:null,
        band:host.style.display!=='none',layout:document.documentElement.hasAttribute('data-thread-colors-active')};
      const key=JSON.stringify(state);if(key!==previous){trace('frame',state);previous=key;}
      if(renaming)diagnosticFrame=requestAnimationFrame(frame);
    };diagnosticFrame=requestAnimationFrame(frame);
  }
  const normalizeName = value => String(value || '').replace(/\s+/g, ' ').trim();
  const nameNode = link => link.querySelector('[data-testid="conversation-title"],.truncate') || link;
  const linkName = link => normalizeName(nameNode(link).textContent);
  let diagnosticProbe=null;
  let failedDraft=null;
  let suppressNextRename=true;
  host.addEventListener('thread-colors-compare-unsuppressed',()=>{if(!renaming)suppressNextRename=false;});
  let lateObservation=null, noticeRevision=0;
  function stopLateObservation(reason) {
    if(!lateObservation)return;
    clearInterval(lateObservation.poll);clearTimeout(lateObservation.deadline);
    lateObservation=null;trace('late-observation-stop',{reason,active:false});
  }
  function observeLateResult(session,dialog,probe) {
    stopLateObservation('replaced');
    const remaining=30000-(performance.now()-session.submittedAt);
    if(remaining<=0)return;
    const state={poll:0,deadline:0,notice:noticeRevision,confirmed:false};
    lateObservation=state;
    const closed=node=>!node||!node.isConnected||node.hidden||getComputedStyle(node).display==='none'||!node.getClientRects().length;
    const check=()=>{
      if(lateObservation!==state)return;
      if(performance.now()-session.submittedAt>=30000){stopLateObservation('deadline');return;}
      if(session.id!==C.threadId(location.href)||session.revision!==navigationRevision||!enabled||!individual||editSession){stopLateObservation('context-changed');return;}
      try {
        probe('post-timeout');
        const matched=nameEvidence(session,session.expected);
        if(matched&&!state.confirmed){
          state.confirmed=true;trace('late-name-confirmed');
          if(noticeRevision===state.notice){renameNotice('');state.notice=noticeRevision;}
        }
        if(state.confirmed&&closed(dialog)&&closed(session.probeOverlay)){
          title();if(noticeRevision===state.notice)renameSuccess();
          stopLateObservation('confirmed-and-closed');
        }
      } catch {stopLateObservation('observation-error');}
    };
    trace('late-observation-start',{active:true,limitFromSubmitMs:30000,intervalMs:500});
    state.poll=setInterval(check,500);
    state.deadline=setTimeout(()=>{check();stopLateObservation('deadline');},remaining);
    check();
  }
  window.addEventListener('pagehide',()=>stopLateObservation('pagehide'));
  host.addEventListener('thread-colors-diagnostic',()=>{
    if(!renaming)diagnosticProbe?.('manual-after-cleanup');
  });
  function evidenceProbe(session,dialog,phase) {
    const now=performance.now();
    if(phase==='await-name'&&session.lastProbePhase===phase&&now-session.lastProbeAt<250)return;
    session.lastProbePhase=phase;session.lastProbeAt=now;
    const idMatch=C.threadId(location.href)===session.id;
    if(!idMatch){trace('evidence-detail',{phase,idMatch:false});return;}
    const previous=session.probeText||(session.probeText=new WeakMap());
    const describe=node=>{
      const value=normalizeName(node.textContent),old=previous.get(node);
      previous.set(node,value);
      return {tag:node.tagName.toLowerCase(),connected:node.isConnected,
        expectedMatch:value===normalizeName(session.expected),originalMatch:value===session.original,
        previouslyObserved:old!==undefined,textChanged:old!==undefined&&old!==value,
        ownTextMatch:normalizeName([...node.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(''))===normalizeName(session.expected),
        childCount:node.children.length,hiddenAncestor:Boolean(node.closest('[hidden]')),
        ariaHiddenAncestor:Boolean(node.closest('[aria-hidden="true"]')),inertAncestor:Boolean(node.closest('[inert]'))};
    };
    const links=[...document.querySelectorAll('a[href*="/c/"]')].filter(a=>C.threadId(a.href)===session.id&&!a.closest('main,article,[data-message-author-role]'));
    const native=node=>{
      if(!node)return {present:false};
      const css=getComputedStyle(node);
      return {present:true,connected:node.isConnected,hidden:node.hidden,
        state:['open','closed'].includes(node.dataset.state)?node.dataset.state:'other-or-absent',
        displayNone:css.display==='none',visibilityHidden:css.visibility==='hidden',
        opacityZero:Number(css.opacity)===0,hasRects:node.getClientRects().length>0,
        animationActive:css.animationName!=='none',transitionDisabled:css.transitionProperty==='none',
        runningAnimations:node.getAnimations().filter(a=>a.playState==='running').length};
    };
    const composer=document.querySelector(composerSelector);
    const rect=composer?.getBoundingClientRect();
    const hit=rect?document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2):null;
    trace('evidence-detail',{phase,idMatch,linkCount:links.length,
      interaction:{bodyPointerNone:getComputedStyle(document.body).pointerEvents==='none',
        composerPresent:Boolean(composer),composerInert:Boolean(composer?.closest('[inert]')),
        composerPointerNone:Boolean(composer&&getComputedStyle(composer).pointerEvents==='none'),
        composerHit:Boolean(composer&&hit&&composer.contains(hit)),
        hitOwnedModal:Boolean(hit&&(dialog?.contains(hit)||session.probeOverlay?.contains(hit)))},
      links:links.slice(0,3).map(a=>{
        const selected=nameNode(a),nodes=[a,...a.querySelectorAll('*')].slice(0,16);
        return {selectedIsLink:selected===a,selectedInSample:nodes.includes(selected),
          nodes:nodes.map(n=>({...describe(n),selected:n===selected,
            titleTestId:n.matches('[data-testid="conversation-title"]'),truncate:n.matches('.truncate')}))};
      }),dialog:native(dialog),overlay:native(session.probeOverlay),quiet:Boolean(quietRename),
      documentChanged:document.title!==session.documentTitle,
      documentExpectedMatch:C.pageTitle(document.title)===normalizeName(session.expected)});
  }
  function nameEvidence(session,expected) {
    const links=[...document.querySelectorAll('a[href*="/c/"]')].filter(a=>
      C.threadId(a.href)===session.id&&!a.closest('main,article,[data-message-author-role]'));
    const visible=links.filter(a=>a.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
    const candidates=visible.length?visible:links;
    const link=candidates.length===1?candidates[0]:null;
    const match=Boolean(link&&linkName(link)===normalizeName(expected));
    const documentMatch=document.title!==session.documentTitle&&C.pageTitle(document.title)===normalizeName(expected);
    const idMatch=C.threadId(location.href)===session.id;
    trace('name-check',{source:'sidebar',idMatch,count:candidates.length,expectedMatch:match,
      totalCount:links.length,visibleCount:visible.length,selection:visible.length?'visible':'all',
      previousConnected:Boolean(session.confirmLink?.isConnected),
      replaced:Boolean(link&&session.confirmLink&&link!==session.confirmLink),connected:link?.isConnected||false,
      candidates:candidates.slice(0,5).map(a=>({connected:a.isConnected,
        source:nameNode(a)===a?'link-text':nameNode(a).matches('[data-testid="conversation-title"]')?'testid':'truncate',
        expectedMatch:linkName(a)===normalizeName(expected),
        titleAttributeMatch:normalizeName(a.getAttribute('title'))===normalizeName(expected),
        ariaLabelMatch:normalizeName(a.getAttribute('aria-label'))===normalizeName(expected),
        hidden:Boolean(a.closest('[hidden],[aria-hidden="true"],[inert]'))}))});
    trace('name-check',{source:'document.title',idMatch,changed:document.title!==session.documentTitle,expectedMatch:documentMatch});
    if(link)session.confirmLink=link;
    if(idMatch&&documentMatch&&!match)confirmedDocumentSource={id:session.id,title:document.title};
    if(idMatch&&(match||documentMatch))knownTitles.set(session.id,{
      name:match?linkName(link):C.pageTitle(document.title),documentTitle:document.title});
    return idMatch&&(match||documentMatch);
  }
  let successTimer=0;
  function clearRenameSuccess() {
    clearTimeout(successTimer);successTimer=0;
    $('.rename-success').textContent='';
  }
  function renameSuccess() {
    failedDraft=null;
    renameNotice('');
    $('.rename-success').textContent=T('チャット名を変更しました');
    successTimer=setTimeout(clearRenameSuccess,3000);
  }
  function renameNotice(message) {
    noticeRevision++;
    clearRenameSuccess();
    $('.rename-status').textContent = I?I.notice(message):message;
    $('.rename-notice').hidden = !message;
    const draft=failedDraft&&failedDraft.id===C.threadId(location.href)?failedDraft:null;
    $('.failed-draft').hidden=!message||!draft;
    $('.draft-value').value=draft?.value||'';
    $('.reuse-draft').hidden=Boolean(draft?.submitted);
  }
  $('.dismiss-rename').addEventListener('click', () => renameNotice(''));
  function displayed(el) {
    const own = quietRename?.dialog.contains(el);
    if (!el.isConnected || !el.checkVisibility({checkOpacity:!own,checkVisibilityCSS:true}) ||
        el.closest('[hidden],[aria-hidden="true"],[inert]') || !el.getClientRects().length) return false;
    if (own) for(let n=el;n;n=n.parentElement) {
      if(Number(getComputedStyle(n).opacity)===0 && !quietNode(n))return false;
    }
    return true;
  }
  function threadTarget(startId, modalPhase = false) {
    const targets = new Map();
    for (const link of document.querySelectorAll('a[href*="/c/"]')) {
      if (C.threadId(link.href) !== startId || link.closest('main,article,[data-message-author-role]')) continue;
      // Native modal libraries may aria-hide the sidebar. During our modal only,
      // structural identity still must remain unique; no hidden trigger is clicked.
      if (!modalPhase && !displayed(link)) continue;
      for (let row = link; row && row !== document.body && row !== document.documentElement; row = row.parentElement) {
        if (row.matches('nav,aside,[role="navigation"],#root,#__next') || row.querySelector('main')) break;
        const links = [...row.querySelectorAll('a[href*="/c/"]')];
        if (row.matches('a[href]')) links.push(row);
        if (links.some(a => C.threadId(a.href) && C.threadId(a.href) !== startId)) break;
        const profile=nativeProfile();
        const actions = profile?[...row.querySelectorAll('button[aria-haspopup="menu"]')].filter(b=>b.getAttribute('aria-label')===profile.action):[];
        if (actions.length) {
          if (actions.length !== 1) throw Error(T('対象行のボタンを一意に確認できません（複数候補）。'));
          targets.set(actions[0], {button:actions[0], row, link}); break;
        }
      }
    }
    if (targets.size !== 1) throw Error(T('現在のチャットとボタンの対応を一意に確認できません。対象リンクとボタンの最小共通祖先を確認してください。'));
    return [...targets.values()][0];
  }
  function assertAction(target) {
    const {button, row} = target, r = button.getBoundingClientRect();
    if (!button.isConnected || button.disabled || button.matches(':disabled') || button.getAttribute('aria-disabled') === 'true' ||
        !r.width || !r.height || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth)
      throw Error(T('対象行のボタンが非表示または無効です（寸法・位置・disabled）。'));
    for (let n=button; n; n=n.parentElement) {
      const st=getComputedStyle(n);
      if (n.hidden || n.hasAttribute('inert') || n.getAttribute('aria-hidden') === 'true' || n.getAttribute('aria-disabled') === 'true' ||
          st.display === 'none' || st.visibility !== 'visible' || st.contentVisibility === 'hidden')
        throw Error(T('対象行のボタンが非表示または無効です（祖先の表示・操作制限）。'));
      // A child may explicitly restore pointer-events:auto under a none ancestor.
      if (n === button && st.pointerEvents === 'none')
        throw Error(T('対象ボタンがクリックを受け付けません（pointer-events:none）。'));
      if (Number(st.opacity) === 0) {
        const known = n !== button && n !== row && row.matches('[role="group"]') && row.contains(n) &&
          ['opacity-0','group-focus-visible:opacity-100','group-hover:opacity-100','group-has-[:focus-visible]:opacity-100','has-[[data-state=open]]:opacity-100'].every(c=>n.classList.contains(c));
        if (!known) throw Error(T('対象行のボタンが非表示または無効です（未確認のopacity）。'));
      }
    }
    if (!button.checkVisibility({checkOpacity:false,checkVisibilityCSS:true})) throw Error(T('対象ボタンの表示領域を確認できません。'));
    const point = {clientX:(Math.max(0,r.left)+Math.min(innerWidth,r.right))/2,
      clientY:(Math.max(0,r.top)+Math.min(innerHeight,r.bottom))/2};
    const hit = document.elementFromPoint(point.clientX,point.clientY);
    // SVG/path/span descendants are valid hits; unrelated overlays are not.
    if (!hit || !button.contains(hit)) throw Error(T('対象ボタンが別の要素に覆われているため操作を中止しました。'));
    return point;
  }
  function boundMenu(button) {
    const menus=[...document.querySelectorAll('[role="menu"]')].filter(displayed);
    if (!menus.length) return null;
    const valid=menus.filter(m=>m.matches('[data-overlay-owner="slate-sidebar"]') && button.id &&
      m.id && m.id===button.getAttribute('aria-controls') && button.getAttribute('aria-expanded')==='true' &&
      (m.getAttribute('aria-labelledby')||'').split(/\s+/).includes(button.id));
    if (menus.length!==1 || valid.length!==1) throw Error(T('開いているメニューと対象ボタンの対応を確認できません。'));
    return valid[0];
  }
  function setRenameProgress(active) {
    const text=active?T('更新中・・・'):'';
    if($('.rename-progress').textContent!==text)$('.rename-progress').textContent=text;
    $('.title').hidden=active;
  }
  function endEdit() {
    cancelAnimationFrame(titleWidthFrame);titleWidthFrame=0;titleWidthKey='';
    editSession=null; composingTitle=false;imeReleaseRequired=false;imeEndedAt=-Infinity;
    $('.composition-status').hidden=true;
    $('.title').hidden=Boolean($('.rename-progress').textContent); $('.title-input').hidden=true; $('.edit-actions').hidden=true; $('.open').hidden=false;
  }
  function beginEdit(reuse=false) {
    if(!canBeginNativeEdit())return;
    if(reuse===true&&failedDraft?.submitted)return;
    if(editSession){$('.title-input').focus();return;}
    // Our error notice can cover the sidebar trigger; remove only our notice
    // before hit-testing the native target. Errors below restore it.
    $('.rename-notice').hidden=true;
    try {
      if (!enabled || !individual || !id || C.threadId(location.href)!==id) throw Error(T('現在のチャットを確認できません。'));
      if ([...document.querySelectorAll(dialogSelector)].some(visibleModal)) throw Error(T('別のダイアログが開いているため中止しました。'));
      const target=threadTarget(id);
      assertAction(target);
      const original=linkName(target.link);
      if (!original) throw Error(T('現在の名前を確認できません。'));
      stopLateObservation('new-edit');
      editSession={nativeLanguage:nativeLang(),nativeRevision,profile:nativeProfile(),id, revision:navigationRevision, original, submitted:false,documentTitle:document.title,confirmLink:target.link};
      $('.title-input').value=reuse===true&&failedDraft?.id===id?failedDraft.value:original; $('.title-input').disabled=false;
      $('.cancel-title').disabled=false;
      $('.title').hidden=true; $('.title-input').hidden=false; $('.edit-actions').hidden=false; $('.open').hidden=true;
      setOpen(false); renameNotice(''); measureTitleWidth(); $('.title-input').focus();
    } catch(error) {
      endEdit();renameNotice('');title();
      // Failure evidence is developer-only; no product warning or draft panel.
      try {diagnostic={version:chrome.runtime?.getManifest?.().version||'1.0.0',diagnosticSchema:5,events:[],truncated:false};diagnosticStart=performance.now();trace('failure',{stage:'edit-start',submitted:false,confirmed:false});trace('finished',{busy:renaming,editing:Boolean(editSession),activeWaits:0,observerActive:false,overallTimerActive:false,quiet:Boolean(quietRename)});}catch{}
    }
  }
  async function saveTitle() {
    if (renaming || !editSession || editSession.submitted || composingTitle) return;
    if(!nativeProfile()||editSession.nativeLanguage!==nativeLang()||editSession.nativeRevision!==nativeRevision){endEdit();return;}
    const session=editSession, desired=$('.title-input').value.trim();
    if (!desired) {endEdit();renameNotice('');title();return;}
    if(normalizeName(desired)===session.original && C.threadId(location.href)===session.id && session.revision===navigationRevision) {
      endEdit();renameNotice('');return;
    }
    const labels=session.profile;
    renaming=true;
    const useSuppression=suppressNextRename;suppressNextRename=true;
    let stage=T('開始条件'), ownedDialog=null, quietObserver=null, releaseQuiet=()=>{}, quietError=null, activeWaits=0;
    const operationDeadline=performance.now()+20000, waitClosers=new Set();
    let overallTimer=0, expired=false;
    const safely=fn=>{try{fn();}catch{/* Cleanup steps must not block each other. */}};
    diagnosticProbe=phase=>evidenceProbe(session,ownedDialog,phase);
    const guard = () => {
      if(expired||performance.now()>=operationDeadline)throw Error(T('タイムアウトしました。'));
      if(session.nativeLanguage!==nativeLang()||session.nativeRevision!==nativeRevision||!nativeProfile())throw Error(T('名前変更画面が一致しません。'));
      if(quietError)throw quietError;
      if(session.submitted&&performance.now()-session.submittedAt>=10000)throw Error(T('タイムアウトしました。'));
      if (session.id!==C.threadId(location.href) || session.revision!==navigationRevision ||
          (editSession!==session&&!(session.detachedEdit&&editSession===null)))
        throw Error(T('チャットが切り替わったため中止しました。'));
      if (!enabled || (!individual&&!session.submitted)) throw Error(T('表示がOFFのため中止しました。'));
    };
    const onlyOwnedModal = () => {
      const dialogs=[...document.querySelectorAll(dialogSelector)].filter(visibleModal);
      if (dialogs.some(d=>d!==ownedDialog)) throw Error(T('別のダイアログが開いているため中止しました。'));
      if(session.submitted&&ownedDialog?.isConnected&&[...ownedDialog.querySelectorAll('[role="alert"]')].some(e=>e.textContent.trim()&&displayed(e)))
        throw Error(T('名前変更画面にエラー表示があります。画面の内容を確認してください。'));
    };
    const waitFor = (read,timeout=3000) => new Promise((resolve,reject) => {
      // React/Radix DOM commits can be ready between paints. Check on mutation
      // instead of leaving a ready menu/dialog visible until the next 100ms poll.
      // The fallback still handles property-only changes and route cancellation.
      let settled=false,observer=null,poll=0,deadline=0;
      activeWaits++;
      const finish=(error,value)=>{
        if(settled)return;
        settled=true;if(abortNativeWait===check)abortNativeWait=null;
        observer?.disconnect();clearInterval(poll);clearTimeout(deadline);waitClosers.delete(cancel);activeWaits--;
        if(error)reject(error);else resolve(value);
      };
      const cancel=()=>finish(Error(T('タイムアウトしました。')));
      const check=()=>{
        if(settled)return;
        try{guard();const value=read();if(value)finish(null,value);}catch(error){finish(error);}
      };
      waitClosers.add(cancel);abortNativeWait=check;
      try{
        observer=new MutationObserver(check);
        poll=setInterval(check,100);
        deadline=setTimeout(cancel,Math.max(0,Math.min(timeout,operationDeadline-performance.now())));
        observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,
          attributeFilter:['role','aria-modal','aria-hidden','aria-controls','aria-labelledby','aria-expanded','aria-disabled','disabled','hidden','open','class','style']});
        check();
      }catch(error){finish(error);}
    });
    const currentTarget = () => {
      guard(); const target=threadTarget(session.id,Boolean(ownedDialog));
      if(linkName(target.link)!==session.original) throw Error(T('ページ側の名前が変わったため中止しました。'));
      return target;
    };
    try {
      overallTimer=setTimeout(()=>{expired=true;abortNativeWait?.();},20000);
      startTrace();session.expected=desired;session.documentTitle=document.title;
      trace('suppression-mode',{enabled:useSuppression});
      session.detachedEdit=true;endEdit();renameNotice('');setRenameProgress(true);
      trace('editor-released',{quiet:false,busy:renaming});
      $('.title').setAttribute('aria-busy','true');
      $('.cancel-title').disabled=true; $('.title-input').disabled=true;
      guard(); onlyOwnedModal();
      stage=T('対象行の確認');trace('phase',{stage}); let target=currentTarget(); assertAction(target);
      stage=T('メニューの対応確認');trace('phase',{stage});
      let menu=boundMenu(target.button);
      if(!menu) {
        const button=target.button;
        button.focus({preventScroll:true});
        await new Promise(resolve=>setTimeout(resolve,0)); // Let focus handlers commit, then revalidate (also in background tabs).
        guard(); onlyOwnedModal(); target=currentTarget();
        if(target.button!==button) throw Error(T('対象行が更新されたため中止しました。'));
        const point=assertAction(target);
        menu=boundMenu(button);
        if(!menu) {
          // One native-style activation sequence supports pointerdown-based triggers.
          button.dispatchEvent(new PointerEvent('pointerdown',{...point,bubbles:true,cancelable:true,button:0,buttons:1,pointerType:'mouse',isPrimary:true}));
          guard(); onlyOwnedModal();
          button.dispatchEvent(new PointerEvent('pointerup',{...point,bubbles:true,cancelable:true,button:0,buttons:0,pointerType:'mouse',isPrimary:true}));
          button.click();
        }
        menu=await waitFor(()=>{onlyOwnedModal();if(currentTarget().button!==button)throw Error(T('対象行が変わりました。'));return boundMenu(button);});
      }
      stage=T('名前を変更項目の確認');trace('phase',{stage});
      target=currentTarget(); assertAction(target); onlyOwnedModal();
      if(boundMenu(target.button)!==menu) throw Error(T('対象メニューが変わりました。'));
      const items=[...menu.querySelectorAll('[role="menuitem"]')].filter(e=>e.textContent.trim()===labels.rename&&displayed(e)&&e.getAttribute('aria-disabled')!=='true'&&!e.matches(':disabled'));
      if(items.length!==1)throw Error(T('「名前を変更」を一意に確認できません。'));
      // Arm only around our verified menu action. No selector-wide hiding rule:
      // a complete, newly inserted pair must be identified before either is styled.
      const before=new Set(document.querySelectorAll(dialogSelector+',.codex-dialog-overlay'));
      let paired=false;
      const captureQuiet=()=>{
        if(!useSuppression)return;
        try {
          guard();
          if(paired) {
            if(quietRename && !quietRename.dialog.isConnected) {
              if(!quietRename.overlay.isConnected)releaseQuiet();
              return; // Keep a still-mounted exit backdrop quiet until it closes too.
            }
            if(quietRename && !quietRename.overlay.isConnected)throw Error(T('名前変更画面の背景が変わったため中止しました。'));
            if(quietRename && (quietRename.dialog.parentElement!==quietRename.overlay.parentElement ||
              quietRename.dialog.parentElement.querySelectorAll('.codex-dialog-overlay').length!==1 ||
              !quietRename.overlay.matches('.codex-dialog-overlay') ||
              !['open','closed'].includes(quietRename.overlay.getAttribute('data-state')) ||
              [...document.querySelectorAll(dialogSelector)].some(d=>d!==quietRename.dialog&&visibleModal(d))))
              throw Error(T('名前変更画面と背景の対応が変わったため中止しました。'));
            return;
          }
          const ds=[...document.querySelectorAll(dialogSelector)].filter(visibleModal);
          if(ds.length!==1)return;
          const d=ds[0], parent=d.parentElement;
          if(before.has(d)||!parent||parent===document.body||parent===document.documentElement||
             !d.matches('[role="dialog"][aria-modal="true"]')||
             ![...d.querySelectorAll('h2')].some(h=>h.textContent.trim()===labels.heading))return;
          const overlays=[...parent.children].filter(e=>e.matches('.codex-dialog-overlay[data-state="open"]'));
          if(overlays.length!==1||before.has(overlays[0])||parent.querySelectorAll(dialogSelector).length!==1)return;
          const overlay=overlays[0], rect=overlay.getBoundingClientRect();
          // A Radix backdrop is decorative and may intentionally be aria-hidden.
          // That hides it from assistive technology, not from visual rendering.
          // The shared parent has already passed visibleModal via the dialog;
          // do not reuse the stricter interactive-control predicate here.
          const backdropPainted = overlay.isConnected &&
            overlay.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}) &&
            !overlay.closest('[hidden],[inert]') && overlay.getClientRects().length > 0;
          if(getComputedStyle(overlay).position!=='fixed'||rect.width<innerWidth*.8||rect.height<innerHeight*.8||!backdropPainted)return;
          const inputs=[...d.querySelectorAll('form input')].filter(e=>e.getAttribute('aria-label')===labels.input);
          const saves=[...d.querySelectorAll('form button[type="submit"]')].filter(b=>b.textContent.trim()===labels.save);
          const cancels=[...d.querySelectorAll('button[type="button"]')].filter(b=>b.textContent.trim()===labels.cancel);
          if(inputs.length!==1||saves.length!==1||cancels.length!==1||inputs[0].form!==saves[0].form||
             normalizeName(inputs[0].value)!==session.original||!displayed(inputs[0])||
             inputs[0].disabled||inputs[0].readOnly||inputs[0].getAttribute('aria-disabled')==='true')return;
          if(linkName(threadTarget(session.id,true).link)!==session.original)return;
          const saved=[d,overlay].map(node=>[node,['opacity','transition','animation'].map(key=>[key,node.style.getPropertyValue(key),node.style.getPropertyPriority(key)])]);
          paired=true; quietRename={dialog:d,overlay};safely(()=>trace('suppressed',{paired:true}));
          session.probeOverlay=overlay;
          releaseQuiet=()=>{
            safely(()=>trace('suppression-release'));
            quietRename=null;
            for(const [node,props] of saved)for(const [key,value,priority] of props) {
              safely(()=>{if(value)node.style.setProperty(key,value,priority);else node.style.removeProperty(key);});
            }
            releaseQuiet=()=>{};
          };
          for(const [node] of saved){node.style.setProperty('transition','none','important');node.style.setProperty('animation','none','important');node.style.setProperty('opacity','0','important');}
        } catch(error) {quietError=error;releaseQuiet();}
      };
      if(useSuppression){quietObserver=new MutationObserver(captureQuiet);
        quietObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['role','aria-modal','data-state','class','style']});}
      guard(); items[0].click();
      captureQuiet(); // Synchronous insertions; the observer handles later commits before paint.
      stage=T('名前変更ダイアログの確認');trace('phase',{stage});
      ownedDialog=await waitFor(()=>{
        const ds=[...document.querySelectorAll(dialogSelector)].filter(visibleModal);
        if(!ds.length)return null;
        if(ds.length!==1)throw Error(T('別のダイアログが開いたため中止しました。'));
        const d=ds[0];
        if(before.has(d))throw Error(T('操作前から存在する画面のため中止しました。'));
        if(!d.matches('[role="dialog"][aria-modal="true"]')||![...d.querySelectorAll('h2')].some(h=>h.textContent.trim()===labels.heading))throw Error(T('名前変更画面が一致しません。'));
        return d;
      });
      guard(); onlyOwnedModal(); currentTarget(); checkModals();
      const fields=[...ownedDialog.querySelectorAll('form input')].filter(e=>e.getAttribute('aria-label')===labels.input);
      const saves=[...ownedDialog.querySelectorAll('form button[type="submit"]')].filter(b=>b.textContent.trim()===labels.save);
      const cancels=[...ownedDialog.querySelectorAll('button[type="button"]')].filter(b=>b.textContent.trim()===labels.cancel);
      if(fields.length!==1||saves.length!==1||cancels.length!==1||fields[0].form!==saves[0].form)throw Error(T('編集欄と保存操作を一意に確認できません。'));
      const input=fields[0], submit=saves[0];
      if(!displayed(input)||input.disabled||input.matches(':disabled')||input.getAttribute('aria-disabled')==='true'||input.readOnly||normalizeName(input.value)!==session.original)throw Error(T('本来の入力欄の現在値または状態が一致しません。'));
      stage=T('入力の反映');trace('phase',{stage}); guard(); onlyOwnedModal(); currentTarget();
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setter.call(input,desired);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(resolve=>setTimeout(resolve,0)); // Let the native UI commit its input state.
      await waitFor(()=>{
        onlyOwnedModal(); currentTarget();
        if(!ownedDialog.isConnected||!input.isConnected||!ownedDialog.contains(submit)||input.value!==desired)throw Error(T('編集画面が変更されたため中止しました。'));
        const liveFields=[...ownedDialog.querySelectorAll('form input')].filter(e=>e.getAttribute('aria-label')===labels.input);
        const liveSaves=[...ownedDialog.querySelectorAll('form button[type="submit"]')].filter(b=>b.textContent.trim()===labels.save);
        if(liveFields.length!==1||liveFields[0]!==input||liveSaves.length!==1||liveSaves[0]!==submit||!input.form||input.form!==submit.form)
          throw Error(T('編集欄と保存操作の対応が変わったため中止しました。'));
        return displayed(submit)&&!submit.disabled&&!submit.matches(':disabled')&&submit.getAttribute('aria-disabled')!=='true';
      });
      stage=T('保存と名称更新の確認');trace('phase',{stage}); guard(); onlyOwnedModal(); currentTarget();
      diagnosticProbe('before-submit');
      session.submitted=true;session.submittedAt=performance.now();trace('native-submit');
      renameNotice('');
      submit.click(); // Exactly once. No retries after this point.
      await waitFor(()=>{
        onlyOwnedModal();
        diagnosticProbe('await-name');
        return nameEvidence(session,session.expected);
      },10000-(performance.now()-session.submittedAt));
      session.confirmed=true;trace('name-confirmed');
      if(ownedDialog) {
        stage=T('名前変更画面の終了確認');trace('phase',{stage});
        await waitFor(()=>{
          onlyOwnedModal();
          const closed=node=>!node||!node.isConnected||node.hidden||getComputedStyle(node).display==='none'||!node.getClientRects().length;
          return closed(ownedDialog)&&closed(session.probeOverlay);
        },10000-(performance.now()-session.submittedAt));
      }
      guard(); endEdit(); title(); if(individual)renameSuccess();
    } catch(error) {
      if(session.id===C.threadId(location.href)&&session.revision===navigationRevision)failedDraft={id:session.id,value:desired,submitted:session.submitted};
      safely(()=>trace('failure',{stage,submitted:session.submitted,confirmed:Boolean(session.confirmed),timeout:error?.message===T('タイムアウトしました。')}));
      if(session.id===C.threadId(location.href)&&session.revision===navigationRevision)renameNotice('');
      // Leave the native dialog visible on errors; never operate an unrelated cancel.
    } finally {
      clearTimeout(overallTimer);overallTimer=0;
      for(const close of [...waitClosers])safely(close);
      abortNativeWait=null;
      safely(()=>quietObserver?.disconnect());quietObserver=null;
      // Diagnostics must never prevent restoration of the owned UI.
      safely(()=>diagnosticProbe('before-release'));
      safely(releaseQuiet);
      safely(()=>diagnosticProbe('after-release'));
      safely(()=>setRenameProgress(false));
      renaming=false;
      safely(endEdit);
      safely(()=>{$('.title').setAttribute('aria-busy','false');updateNativeEditing();});
      safely(()=>{$('.title-input').disabled=false;$('.cancel-title').disabled=false;});
      cancelAnimationFrame(diagnosticFrame);diagnosticFrame=0;
      safely(checkModals);safely(title);
      safely(()=>trace('finished',{submitted:session.submitted,confirmed:Boolean(session.confirmed),quiet:Boolean(quietRename),
        editing:Boolean(editSession),busy:renaming,editorHidden:$('.title-input').hidden,
        composing:composingTitle,compositionHidden:$('.composition-status').hidden,
        observerActive:Boolean(quietObserver),activeWaits,overallTimerActive:Boolean(overallTimer),widthFramePending:Boolean(titleWidthFrame),diagnosticFramePending:Boolean(diagnosticFrame)}));
      if(session.nativeLanguage===nativeLang()&&session.nativeRevision===nativeRevision&&session.submitted&&!session.confirmed&&session.id===C.threadId(location.href)&&session.revision===navigationRevision&&enabled&&individual)
        safely(()=>observeLateResult(session,ownedDialog,diagnosticProbe));
    }
  }

  $('.title').addEventListener('click',beginEdit);
  $('.reuse-draft').addEventListener('click',()=>beginEdit(true));
  $('.title-input').addEventListener('input',scheduleTitleWidth);
  $('.title-input').addEventListener('compositionupdate',scheduleTitleWidth);
  document.fonts?.ready.then(()=>{titleWidthKey='';scheduleTitleWidth();});
  $('.title').addEventListener('keydown',e=>{if(canBeginNativeEdit()&&(e.key==='Enter'||e.key===' ')){e.preventDefault();beginEdit();}});
  $('.title-input').addEventListener('compositionstart',()=>{if(!editSession||renaming)return;composingTitle=true;imeReleaseRequired=false;$('.composition-status').hidden=false;});
  $('.title-input').addEventListener('compositionend',()=>{composingTitle=false;$('.composition-status').hidden=true;if(!editSession)return;imeEndedAt=performance.now();});
  $('.title-input').addEventListener('keyup',e=>{if(e.key==='Enter'||e.keyCode===229)imeReleaseRequired=false;});
  $('.title-input').addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.keyCode!==229)return;
    e.stopPropagation();
    if(e.isComposing||e.keyCode===229||composingTitle){imeReleaseRequired=true;return;}
    e.preventDefault();
    if(imeReleaseRequired||e.repeat)return;
    void saveTitle();
  });
  let outsidePress=null;
  document.addEventListener('pointerdown',e=>{
    outsidePress=null;
    if(!editSession||renaming||e.button!==0||e.composedPath().includes(host)||
      e.target.closest?.(dialogSelector+',[role="menu"]')||[...document.querySelectorAll(dialogSelector)].some(visibleModal))return;
    const nextId=C.threadId(e.target.closest?.('a[href]')?.href);
    outsidePress={target:e.target,session:editSession,allowed:!composingTitle&&performance.now()-imeEndedAt>=80&&(!nextId||nextId===editSession.id)};
  },true);
  document.addEventListener('click',e=>{
    const path=e.composedPath();
    if(panelOpen&&!path.includes($('.panel'))&&!path.includes($('.open')))setOpen(false);
    const press=outsidePress;outsidePress=null;
    if(!press||!press.allowed||press.session!==editSession||press.target!==e.target||e.composedPath().includes(host)||composingTitle||renaming)return;
    void saveTitle();
  },true);
  let hidingChat=false;
  $('.hide-chat').addEventListener('click',async()=>{
    if(hidingChat||!id||C.threadId(location.href)!==id)return;
    const target=id;
    hidingChat=true;$('.hide-chat').disabled=true;
    try {
      // Same individual key/event path as popup; no color/default/global changes.
      await chrome.storage.local.set({[displayPrefix+target]:false});
    } catch {
      if(id===target)renameNotice(T('帯を非表示にできませんでした。もう一度お試しください。'));
    } finally {hidingChat=false;$('.hide-chat').disabled=false;}
  });
  $('.cancel-title').addEventListener('click',()=>{if(!renaming){endEdit();renameNotice('');}});
  for (const color of C.palette) {
    const b = document.createElement("button");
    b.className = "swatch"; b.dataset.color = color; b.style.backgroundColor = color;
    b.setAttribute("aria-label", color); b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => change({color}));
    $(".swatches").append(b);
  }
  $(".open").addEventListener("click", () => {setOpen(!panelOpen); if (panelOpen) $(".close").focus();});
  $(".close").addEventListener("click", () => {setOpen(false); $(".open").focus();});
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && panelOpen && !e.isComposing && !e.defaultPrevented) {
      const inside=e.composedPath().includes($('.panel'));
      setOpen(false); if(inside)$(".open").focus();
    }
  });
  for (const name of ["color", "textColor", "height", "fontSize", "border"]) {
    $(`[name="${name}"]`).addEventListener("input", e => change({...(name === "textColor" ? {textMode:"custom"} : {}), [name]: (name === "color" || name === "textColor") ? e.target.value : Number(e.target.value)}));
  }
  shadow.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => change({textMode:b.dataset.mode})));
  $(".reset").addEventListener("click", () => change(C.settings(null, id)));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if(changes[appearanceKey]){
      appearanceRevision++;appearance=sharedAppearance(changes[appearanceKey].newValue);
      if(!hasOwnSettings&&!loading){cfg=resolveSettings(undefined);apply();}
    }
    if (changes[enabledKey]) { enabledRevision++; enabledReady=true; enabled = changes[enabledKey].newValue !== false; setOpen(false); apply(); }
    if (location.pathname !== lastPath) {void route(); return;}
    const displayChange=id && changes[displayPrefix+id];
    if(displayChange){individualRevision++;individualReady=true;individual=displayChange.newValue===true;
      if(!individual){endEdit();stopLateObservation("individual-off");}
      setOpen(false);apply();}
    const own = id && changes[prefix + id];
    if (own && inFlightKey !== prefix + id && !writes.has(prefix + id)) {
      if(loading){deferredOwn={value:own.newValue};return;}
      generation++; loading = false; chatReady=true;hasOwnSettings=own.newValue!==undefined;
      cfg = C.settings({...resolveSettings(own.newValue), ...pendingPatch}, id);
      if (Object.keys(pendingPatch).length) {
        enqueueSettings(prefix+id,pendingPatch); void flush();
      }
      pendingPatch = {}; apply();
    }
  });
  chrome.storage.local.get(enabledKey).then(values => {
    if (!enabledRevision) {enabledReady=true;enabled = values[enabledKey] !== false; apply();}
  }).catch(() => {if(!enabledRevision){enabledReady=false;apply();}storageFailed = true; status(T("設定を読み込めません。ページを更新してください。"));});
  // Navigation is checked without patching ChatGPT's history or keyboard handlers.
  correctTooltip=profiled('correctTooltip',correctTooltip);
  visibleModal=profiled('visibleModal',visibleModal);
  title=profiled('title',title);
  checkModals=profiled('checkModals',checkModals);
  refreshShells=profiled('refreshShells',refreshShells);
  I?.onChange(()=>{
    host.lang=I.locale.replace('_','-');updateNativeEditing();
    for(const selector of ['.status','.rename-status','.rename-success','.rename-progress']){
      const el=$(selector);el.textContent=I.notice(el.textContent);
    }
  });
  updateNativeEditing();checkModals(); void route();
  const timer = setInterval(() => {perfSignal('route-poll');if (document.visibilityState !== "hidden") {checkModals(); void route();}}, 600);
  document.addEventListener("visibilitychange", () => {if (document.visibilityState !== "hidden") {checkModals(); void route();}});
  window.addEventListener("pagehide", e => {
    stopPerf('pagehide');
    clearTooltipCorrection();cancelAnimationFrame(tooltipFrame);tooltipFrame=0;tooltipHover=null;tooltipFocus=null;tooltipTrigger=null;
    if (!e.persisted) {
      clearInterval(timer); nativeLanguageObserver.disconnect();modalObserver.disconnect(); cancelAnimationFrame(modalFrame);
      document.removeEventListener('pointerover',tooltipOver,true);document.removeEventListener('pointerout',tooltipOut,true);
      document.removeEventListener('focusin',tooltipFocusIn,true);document.removeEventListener('focusout',tooltipFocusOut,true);
      window.removeEventListener('scroll',requestTooltipCheck,true);window.removeEventListener('resize',requestTooltipCheck);
      document.body.removeEventListener('transitionend', layoutTransition);
      document.body.removeEventListener('animationend', layoutTransition);
      window.removeEventListener('resize', scheduleModalCheck);
    }
  });
})();
