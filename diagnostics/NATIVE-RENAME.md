# ネイティブ名前変更UIの採取（0.1.33、診断のみ）

追加の言語非依存識別調査は [構造診断の手順](NATIVE-RENAME-STRUCTURE.md) を使用してください。既存v3では未採取だった項目子孫の属性・構造を限定採取します。

製品コードと版番号は変更しません。これはUI表記・構造の証拠を集める診断で、名前変更の連動テストではありません。拡張の表示言語とは別に、ChatGPT本体の表示言語を対象言語に切り替えてください。

## ブラウザ内で完結する手順

1. 保存済みの対象チャットを開き、既存のダイアログは閉じます。診断コードを先にコピーしておきます。
2. そのChatGPTタブのDevTools Consoleで、下の「診断開始」全文を実行します。
3. **10秒以内**にChatGPT画面へ戻り、現在チャットのサイドバー行の「…」を開きます。0.5秒ほど待つとメニューが自動採取されます。
4. **メニュー採取から10秒以内**に、利用者が手動で名前変更（英語ではRename）を選びます。入力や保存は不要です。編集UIの表示後、0.5秒ほど待ちます。
5. Consoleへ戻り、状況確認とコピーのコードを実行します。メニューが閉じても採取済み結果は保持されます。途中でVS Codeへ戻る必要はありません。
6. **編集UIは手動でキャンセル**してください。コピーしたJSONをCodexへ貼り付けます。

各段階10秒、合計最大約20秒です。開始前に開いていたダイアログは対象外です。対象行・動的ARIAの対応が曖昧なら範囲を広げず中止します。メニュー項目を利用者が選んだ後の、新規ダイアログかつ単一フォーム・単一テキスト入力・単一submitという構造だけを採取します。これは意味として名前変更であることの証明ではないため、取得結果の見出し・ラベルも別途確認します。構造が合わない場合は未採取理由を残します。

## 診断開始（そのままConsoleへ貼り付け）

同じコードは `native-rename-ui.js` にあります。言語ごとに再実行してください。前回の監視は停止し、前回結果は置き換えます。再読み込みすると保持結果は消えるため、先にコピーしてください。

```js
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
 const result={diagnostic:'native-rename-ui-v3',productVersion:'0.1.33',htmlLanguage:document.documentElement.lang,stages:[],status:'waiting-menu',samples:0,cleanup:false};
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

```

## 状況確認

```js
console.log(window.__ctcNativeRenameDiagnostic);
```

`stages` 内の `menu` / `dialog` がそれぞれの採取済み情報です。Consoleにも `(1/2)` / `(2/2)` を表示します。`status` は `waiting-menu`、`waiting-selection`、`waiting-dialog`、`complete`、`stopped` のいずれかです。`reason: "complete"` と `cleanup: true` なら2段階の採取・監視停止が完了しています。`deadline` は期限到達、`ambiguous-*` は候補が曖昧、`navigation` はチャット遷移による停止です。未採取でも部分結果をコピーできます。タイトルや本文を追加で取得する必要はありません。

## 保持結果をコピー

```js
copy(JSON.stringify(window.__ctcNativeRenameDiagnostic, null, 2))
```

DevToolsの `copy()` を明示的に実行します。自動クリップボード書込みは行いません。

## 監視停止（結果を保持）

```js
window.__ctcNativeRenameStop?.('manual');
```

## 結果破棄（先に監視も停止）

```js
window.__ctcNativeRenameStop?.('discard');
delete window.__ctcNativeRenameDiagnostic;
```

停止・破棄はChatGPTのメニューやダイアログを閉じません。編集UIは利用者がキャンセルします。

## 採取範囲と制限

現在チャットとの一致を内部照合し、対象行の候補件数、要素種別、role、必要なARIA属性、動的参照の照合結果、限定した親子構造、メニュー・見出し・操作ボタンの文言を記録します。data属性は `data-state` / `data-side` / `data-overlay-owner` のみに限定し、任意のdata属性は収集しません。IDは内部照合のみで、出力のrefは診断内の連番です。

本文・本文入力値・名前編集欄のvalue・チャットID・ページ全体HTML・アカウント領域は収集しません。現在チャット名は対象リンクから伏せ字処理のためだけに読み、結果には記録しません。共有前に意図しない個人情報が文言に混ざっていないか確認してください。

クリックイベントを読み取りで観測しますが、クリック・入力・保存・通信を自動実行せず、イベントも妨げません。終了時にObserver、イベント監視、タイマーを解除します。状況確認とコピーは終了後も可能です。

実ChatGPTでの採取・7言語連動の成功は未確認です。合成画面の検証は実ChatGPTの対応確認とは区別します。

## 今回の検証

`node --check diagnostics/native-rename-ui.js` 合格。Playwright/Chromiumの検証用画面で7ケース合格：開始後のメニュー→手動選択→編集UIの採取と閉鎖後保持、対象行の重複、ダイアログ重複、非対応フォームの未採取、DOM変更を伴わないチャット遷移、10秒の実時間タイムアウト、手動停止・再実行・破棄。正常結果にテスト用のチャット名・本文・入力値・チャットIDが含まれないことも確認しました。実ChatGPTの実表記・動作は未確認です。
