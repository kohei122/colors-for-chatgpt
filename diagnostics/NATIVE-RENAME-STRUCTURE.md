# 名前変更の言語非依存識別調査（0.1.33、診断のみ）

## 現コードで確認したこと

- `content.js` の `threadTarget`：現在URLのチャットIDとサイドバーリンクを照合し、別チャットを含む祖先を除外して単独の操作ボタンを探す部分は言語非依存。ただし現製品の `actionSelector` は日本語aria-labelに依存する。
- `boundMenu`：実行時のaria-controls、aria-labelledby、aria-expanded、role=menu、data-overlay-owner=slate-sidebarで対応を検証。動的IDの固定値には依存しない。英語・韓国語の利用者診断でも対応確認済み。ただしこの属性は「名前変更」という操作の識別子ではない。
- メニュー項目：製品は「名前を変更」の完全一致。既存診断では子孫の識別情報と任意data属性を未採取のため、固有属性が存在しないとは判断できない。
- 編集画面：新規dialog、aria-modal、form所属、候補の一意性、入力とsubmitの所属一致は言語非依存。既存英語・韓国語結果も同構造。だがこの構造だけでは別の編集フォームと区別できない。
- 製品は見出し「チャット名を変更」、入力ラベル「チャットのタイトル」、保存・キャンセルの文言にも依存する。抑制開始・入力設定・保存直前の再照合にも同じ依存がある。単に最初の検索だけ置き換えることはできない。
- 保存結果は対象チャットの名称更新と所有dialog終了で確認し、閉じたことだけで成功にしない。この対象照合は表示言語とは別。

英語・韓国語の実表記は取得済みだが、今回、新しい言語別文言・判定は製品へ追加しない。属性の実値が得られても、複数言語で意味・一意性が一致するか確認するまで安定識別子とは判断しない。CSSクラス、メニュー順序、SVGパス、React内部、非公開APIは識別の根拠にしない。

## 今回の実測解析（2026-10-22）

利用者のv1結果はcomplete、選択項目ref:8（Rename）。RenameのstructureとselectedItemStructureはともに6要素、最大深さ4、truncated:true。全構造の記録合計は70要素で、300要素上限ではなく深さ4の上限により子孫を取りこぼした。data-menu-row-contentは他項目にもあり、単独でRenameを識別できない。completeは診断終了であり構造の完全採取を意味しない。

## 不足部分だけの再採取（v2）

今回は**利用者が選んだメニュー項目だけ**の子孫構造を採取する。他項目は対応確認用の概要のみでstructureを作らず、トリガーやdialogの子孫構造も再採取しない。選択イベントのcapture段階で同期的に読み取り、メニューが消える前に記録して監視を終了する。クリックを妨げたり、代わりに実行したりしない。

選択項目は深さ24（項目自身を0）、最大256要素。末端まで取得できれば `truncated:false`。上限に達した場合は `reasons` に `depth-limit` / `node-limit`、入力領域の子孫を除外した場合は `excluded-editable-content` を記録する。`cutoffs`には打ち切った親refと深さを最大16件記録。上限に達した下位ツリーを追加走査して総数を数えることはしない。

子孫のdata属性名はすべて記録する。値は従来どおり許可済みUIトークン以外を伏せる。svg/useのhrefまたはxlink:hrefは、安全な形式のfragmentからアイコン識別名を記録し、URLのパス・ハッシュ・queryは出力しない。SVGパスのd、入力value、本文、チャット名実値、アカウント情報、HTMLは記録しない。伏せた値や打ち切りがあれば、その範囲の意味は未確認として扱う。data-menu-row-contentやアイコン名だけでRenameとは判断しない。

1. 英語表示の保存済みチャットで、下のコードをConsoleに実行。
2. 10秒以内にChatGPT画面へ戻り、現在チャットの「…」を開いて0.5秒ほど待つ。
3. メニュー確認後10秒以内に手動でRenameを選ぶ。**その瞬間に選択項目の構造を採取して停止する**。
4. Consoleへ戻りコピーコードを実行。開いた編集UIは手動でキャンセルする。入力・保存は不要。

## 開始コード

同じコードは `native-rename-structure.js`。再実行すると前回監視を停止し、前回結果を置き換える。

```js
/* Read-only selected-item evidence: start before opening the current chat menu.
 * Manually choose Rename after the menu appears. 10 seconds per stage.
 * No automatic clicks, input, saves, network or clipboard writes. */
(()=>{
 'use strict';
 window.__ctcNativeRenameStop?.();
 const thread=value=>{try{const u=new URL(value,location.href);return u.origin==='https://chatgpt.com'?u.pathname.match(/^\/(?:g\/[^/]+\/)?c\/([a-zA-Z0-9-]+)\/?$/)?.[1]||null:null;}catch{return null;}};
 const current=thread(location.href),refs=new WeakMap();let nextRef=0,observer,timer,pending=0,poll,stopped=false,menuElement=null,selected=false;

 const result={diagnostic:'native-rename-structure-v2',productVersion:'0.1.33',htmlLanguage:document.documentElement.lang,stages:[],status:'waiting-menu',samples:0,cleanup:false};
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

```

## 状況確認

```js
console.log(window.__ctcNativeRenameDiagnostic);
```

`diagnostic: "native-rename-structure-v2"`、`reason: "complete"`、`cleanup: true`を確認。構造の完全性は別に `selectedItemStructure.truncated` と `reasons` を確認する。結果はメニューが閉じても保持される。ページ再読み込みでは消える。

## コピー

```js
copy(JSON.stringify(window.__ctcNativeRenameDiagnostic, null, 2))
```

## 停止（結果保持）

```js
window.__ctcNativeRenameStop?.('manual');
```

## 停止・破棄

```js
window.__ctcNativeRenameStop?.('discard');
delete window.__ctcNativeRenameDiagnostic;
```

## 検証

構文確認合格。Playwright/Chromiumの検証用画面で、深さ4を超える入れ子のdata属性・svg/use識別名の完全採取、深さ24の打ち切り理由、256要素の打ち切り理由を確認。各ケースで他項目の構造非採取、テスト用秘密文字列の除外、監視解除、メニュー削除後の保持も確認した。実ChatGPTでv2の採取は未確認。製品コード・版番号0.1.33は変更なし。
