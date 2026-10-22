# data-menu-row-content 値比較（診断のみ、0.1.33）

現在チャットのリンク・単独行候補・動的ARIA対応を確認したメニュー内のみを採取します。子孫の構造は出力せず、各項目の文言と属性値の匿名番号だけを記録します。製品コードに操作判定は追加しません。

## 手順

1. 対象チャットを開き、以下の開始コード全文をそのタブのDevTools Consoleに貼り付けて実行します。
2. **10秒以内**にChatGPT画面へ戻り、現在チャットの「…」メニューを開き、0.5秒ほど待ちます。**Renameは選びません**。
3. Consoleへ戻りコピーコードを実行し、結果を共有してください。メニューが閉じても結果は保持されます。

## 開始コード

同一コード: `native-menu-row-values.js`

```js
/* Read-only comparison. Open current chat menu within 10 seconds. */
(()=>{
 'use strict';
 window.__ctcNativeRenameStop?.('replaced');
 const result={diagnostic:'native-menu-row-values-v1',productVersion:'0.1.33',status:'waiting-menu',items:[],cleanup:false};
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

```

## 状況確認

```js
console.log(window.__ctcNativeRenameDiagnostic);
```

## コピー

```js
copy(JSON.stringify(window.__ctcNativeRenameDiagnostic, null, 2))
```

## 停止／破棄

停止して結果を保持：

```js
window.__ctcNativeRenameStop?.('manual');
```

停止して破棄：

```js
window.__ctcNativeRenameStop?.('discard');
delete window.__ctcNativeRenameDiagnostic;
```

## 結果の読み方

- `reason: complete`、`cleanup: true`：採取終了・監視解除。
- `attributeState: absent`：属性なし。空文字とは別。
- `values[].state: empty`：空文字。`nonempty`：空文字以外（空白だけの値もそのまま比較）。
- `anonymousNumber`：同じ生の値に同じ番号。番号は今回の診断内のみ有効。生の値・長さ・ハッシュは出力しない。
- `allItemsHaveSameValue: true`：全項目に属性が存在し、すべて同一値。この場合、この属性による操作識別の調査を終了する。
- `distinctValueCount > 1` の場合だけ、次の限定確認を検討する。値が違うだけでRenameを特定したとは扱わない。属性なしの場合は別途その事実として扱う。

対象を一意に確認できない場合は範囲を広げず停止、未出現は10秒で停止します。上限は30項目、各20属性要素。クリック・入力・保存・通信・自動コピーは実行しません。本文・入力値・チャット名実値・アカウント領域・ページHTMLは記録しません。現在チャット名はメニュー文言から除外するためだけに内部参照します。監視は終了時に解除します。再実行で前回結果を置換し、ページの再読み込みで結果は消えます。
