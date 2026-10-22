# 0.1.24 診断（名前変更schema:5）

重さの追加調査は利用者の指示で保留中です。現在は[下側配置の実画面確認と、残る場合の1ボタン診断](TOOLTIP.md)を優先します。以下の計測は必要になった場合だけ使用してください。

「上部ボタンhover後の重さ」を再調査する場合は、[hover前後の12秒区間別診断](HOVER.md)を実施してください。入力欄フォーカスが主なきっかけではないとの追加報告に合わせ、こちらを優先します。診断の同時実行は避けてください。

フォーカス単独の切り分けが必要な場合は[フォーカス1操作の比較](FOCUS.md)も残しています。表示OFFと拡張自体を無効にした状態は区別します。

重さの調査には[8秒の処理量診断](PERFORMANCE.md)を使用します。ツールチップ診断との同時実行は避けてください。

0.1.20は帯表示中のルート最小高さを確保します。ツールチップ診断の取得手順・名称変更診断の項目は変更していません。

上部の吹き出しについては別の[ツールチップ配置診断](TOOLTIP.md)を使用します。10秒の準備後に6秒だけ読み取り観測します。以下の名前変更診断とは別です。

0.1.19は処理中表示を帯の中央へ変更しました。診断の取得手順・収集項目・保存確認処理は維持しています。

0.1.18では未対応時の保存前中止と保存後の結果不明を分離しています。既存のphase／failure.submitted／finishedと上限付きの後続観測を利用します。診断手順・収集項目に変更はありません。

確定直後にeditor-releasedを記録します。evidence-detail.interactionにはbodyPointerNone、composerPresent、composerInert、composerPointerNone、composerHit、hitOwnedModalを追加しました。入力欄の中央へのヒットテストは読み取りのみで、クリック・フォーカス移動・属性変更を行いません。画面外の場合や他要素が重なる場合もあるため、composerHit:falseだけで原因を断定しないでください。タイトル文字列・失敗時の保持名・会話本文は出力しません。

新しい詳細スナップショットはawait-name中に最大250ms間隔です。名前一致の判定や安全確認は従来どおりDOM変更時と100ms補助チェックで行います。抑制なしの1回比較と取得コードは以下の従来手順と同じです。以下は過去の説明です（0.1.17では3秒後ではなく確定直後に編集欄を閉じます）。

---

# 0.1.16 診断（schema:4）

拡張と対象タブを再読み込みし、名前変更後、必要なら30秒待って以下で取得します。文字列・本文・チャットIDは含みません。

```js
const h = document.getElementById('marusin-thread-colors');
h?.dispatchEvent(new Event('thread-colors-diagnostic'));
copy(h?.getAttribute('data-rename-diagnostic'));
```

suppression-mode.enabledが通常true、native-submitからname-confirmed/finishedまでが保存後の所要時間です。editor-releasedは約3秒での編集欄終了で、抑制解除ではありません。10秒上限の後は表示を復元し、名称未確認ならlate-observationへ移ります。最大400イベントに達したときは古い反復サンプルを優先して間引き、保存・段階変更・終了イベントを保持します。

### 表示抑制なしの比較（任意・次の保存試行1回だけ）

本来のダイアログが表示される比較条件です。通常条件のJSONを取得した後、次のコードを実行してから帯で別の名前への変更を1回行い、同じ取得コードでJSONを保存してください。手動で開いたダイアログに手は加えません。比較は通信・ページ負荷のばらつきを伴うため、1組の時間差だけで因果関係を断定しません。

```js
document.getElementById('marusin-thread-colors')?.dispatchEvent(new Event('thread-colors-compare-unsuppressed'));
```

保存・入力・対象確認は同じで、表示抑制用スタイルと監視だけを無効にします。suppression-mode.enabled=falseが記録され、次の試行は自動的に通常へ戻ります。永続設定や追加権限はありません。比較をやめる場合はタブを再読み込みしてください。

通常の抑制はopacity:0とanimation/transition:noneを従来どおり使用します。これらが本来の終了処理に影響するかは未確定です。比較条件で時間が短くなっても、通信等の要因を除外した証明にはなりません。

以下は過去の診断の説明です。0.1.15の3秒での抑制解除は、0.1.16では編集欄のみの解除へ変更しています。

---

# 名前変更の診断

## 0.1.15：確定後の短いConsoleコード

今回の版は0.1.15、`diagnosticSchema:3`です。結果不明の終了後、保存実行から最大30秒まで500ms間隔で読み取り観測します。通知後30秒ほど待ってから以下を実行してください。以下のコードは、終了後の現在の状態も読み取り追記してコピーします。保存・再送・名前の変更・抑制解除は行いません。

未変更での終了は通知・本来の保存操作・新規診断記録を行いません。0.1.12のちらつき解消は利用者の実画面で確認済みです。0.1.14では特定チャットの名称確認タイムアウトを調べる診断を拡充しました。

1. chrome://extensionsで拡張を再読み込みし、対象のChatGPTタブも再読み込みします。
2. 問題が起きるチャットで帯から名前変更を1回試し、成功または結果不明の通知を待ちます。
3. タブを再読み込みせず、F12 → Consoleで以下を実行し、コピーされたJSONを共有してください。対象要素を探す操作は不要です。

```js
const h = document.getElementById('marusin-thread-colors');
h?.dispatchEvent(new Event('thread-colors-diagnostic'));
copy(h?.getAttribute('data-rename-diagnostic'));
```

最新版の確定試行1回分をJSON文字列としてコピーします。copyを使わず同じgetAttributeの結果をConsoleに表示しても確認できます。nullは未記録です。最大400イベント、相対時刻ms、版番号と途中状態のみ。入力値・タイトル文字列・会話本文・チャットID・認証情報を含まず、送信/Storage保存もしません。タブの更新で失われます。同じページのDOMに保持するためページ側からも読める診断です。

- phase / native-submit：どの確認段階か、本来の保存を実行したか。
- name-check：sourceはsidebarまたはdocument.title、idMatchは開始IDと現在URLの一致、expectedMatchは期待名との一致。countは該当リンク数、replacedは前回と異なるリンク要素、changedは確定開始時からのページタイトル変更。
- sidebarのtotalCountは対象IDリンク全数、visibleCountは表示判定を通った件数、countは実際に確認へ使う候補数。selectionはvisible/all、previousConnectedは直前の参照がまだ接続中か。candidatesは最大5件について接続状態、取得元testid/truncate/link-text、文字列の一致、title属性／aria-labelの一致、hidden等の有無だけを記録します。属性の一致は診断用で、成功判定には使用しません。
- frame：ダイアログ件数・抑制の有無・所有した画面/背景のopacity・帯と余白属性。最大5つのdialogStatesに各画面のopacity/hidden/同じ親のopen背景件数も記録します。状態が変わった描画フレームを記録します。
- suppressed / suppression-release：対象を照合して表示抑制した時点と解除した時点。
- failure / finished：終了段階・送信済みか・タイムアウトか・抑制が解除されたか。truncated=trueの場合は記録上限に達しています。
- finishedのediting/busy/composing/observerActive/widthFramePending/diagnosticFramePendingはfalse、activeWaitsは0、editorHidden/compositionHiddenはtrueが正常な終了状態です。confirmedは名称更新の確認が成立したかを示します。
- evidence-detail：before-submit / await-name / before-release / after-release / manual-after-cleanupで比較します。dialogとoverlayには接続、open/closed、CSS上の表示、アニメーション稼働数などを記録。リンクは最大3件・各16要素まで、タグ、子要素数、実際の取得要素selected、期待名／元の名前との一致、前回から文字が変わったか、hidden・aria-hidden・inertを別々に記録します。選択要素がサンプル範囲外ならselectedInSample=falseです。タイトル文字列・属性文字列・クラス名は記録しません。別チャットへ移った場合はidMatch:falseだけを記録し、リンクは調べません。

`candidates.hidden`はCSS非表示ではなく、`[hidden]`・`[aria-hidden="true"]`・`[inert]`の自身／祖先の有無です。CSSのcheckVisibilityとは独立し、名前の成功判定ではこのhiddenを除外条件に使いません。名前取得は `[data-testid="conversation-title"],.truncate` に最初に一致した子孫、なければリンク全体のtextContentです。診断の子要素一致だけで成功条件を緩めることはありません。

不一致が続く場合は、終了通知が出た直後に上記コードを実行してください。手動でダイアログを閉じた後や数秒後にもう一度コードを実行すると、リロードなしでその時点の状態を追記できます。これは利用者が実行した時だけの読み取りで、手動コード自体は新しい監視・タイマーを作りません。0.1.15の自動観測は保存実行から30秒の上限で終了します。実際の名前はJSONへ手書き追記しなくて構いません。

native-submit後にname-checkがすべて不一致なら「保存操作を送ったが名称を確認できない」状態です。name-checkが一致し、画面終了確認で失敗した場合は名称更新とモーダル終了を分けて調べます。診断の一致はページ表示の証拠であり、サーバー永続化の独立検証ではありません。今回の特定チャットの原因は実画面の診断を受け取るまで未確定です。

## 旧版の履歴資料

現行版は0.1.9です。新規の名前変更ダイアログと同じ親の新規背景の対応確認による表示抑制を追加しました。この履歴診断はその対応判定を検証するものではありません。以下は旧版の記録です。

現行版は0.1.8です。名前変更の待機をDOM更新に追従させました。以下の診断コード・記録は旧版の対象判定を調べるための履歴資料です。

本体の現行版は0.1.7です。2026-10-19に完全な0.1.5診断JSONを確認し、0.1.6の祖先pointer-events:noneの過剰判定を再現しました。0.1.7ではボタン自身の計算済みpointer-eventsとヒットテストで判定します。この診断コードは履歴用のままで、0.1.7の操作可否を再現するものではありません。以下は旧版時点の手順・記録です。

これは0.1.5の拒否条件を再現する履歴診断です。本体は0.1.6へ更新済みです。通常状態の原因は利用者の診断によりホバー用祖先のopacity:0と特定されました。0.1.6の限定例外の可否を判定するコードではありません。

## 実行方法

1. 問題が出る保存済みのChatGPT会話を開き、Chrome DevToolsのConsoleを開きます。
2. `rename-target.js` の全文を貼り付けて実行します。拡張の再読み込みは不要です。
3. 出力されたJSON文字列を控えます。まず通常状態で1回取得してください。
4. ChatGPT本来の対象会話の「…」メニューを開いた状態でも取得し、2つの結果を共有してください。

Consoleへ移動するとメニューが閉じる場合は、ファイル全文を次の形で囲んで実行し、5秒以内にページ側の対象メニューを開いてください。5秒後に読み取るだけで、クリックはしません。

```js
setTimeout(() => {
  // この行を rename-target.js の全文に置き換える
}, 5000);
```

コードはクリック、入力変更、保存、通信、Storage/認証/クリップボードへのアクセスを行いません。会話本文、タイトル文字列、入力値、ページ全体のHTMLを収集しません。対象会話ID、対象リンクのpath、関連要素のID・class・role・aria属性、構造と表示状態を収集します。件数制限はJSONのlimitsに示します。

## 確認する項目

- `links[].walk` / `selectedAncestor` / `stop`：0.1.5がたどる祖先、別チャット混在、選択位置と停止理由。
- `candidates[].node.ref`：同じ実要素を識別する診断内の番号。
- `state.rejection015`：0.1.5の実際の条件で拒否する理由。
- `state.blockers`：opacity=0、display:none、hidden、aria-hidden、inertなどの原因要素と祖先。
- `rect` / `rectCount` / `intersectsViewport` / `pointerEvents`：寸法・画面との位置関係。0.1.5はすべてを判定条件にしているわけではありません。
- `disabled` / `matchesDisabled` / `ariaDisabled`：disabled属性、fieldset等を含む実効disabled、ARIA指定を分離。
- `parentStructure` / `parentButtons`：選ばれた行の1段上に、別の可視ボタンや複製がないか。
- `openMenus[].triggers` / `menuRelations`：表示中メニューの動的id/aria-labelledby/aria-controlsと結び付くトリガー。0.1.5の選択候補と同じ要素か。

現在の報告だけでは、どの実要素を拒否したか確定できません。読み取り結果を確認するまでは、安全条件を緩めたり別のボタンを自動クリックしたりしません。

## 追加診断が必要になった場合

0.1.6では帯内編集と本来の保存連動を実装済みです。通常状態の追加情報は不要です。既にメニューを開いた状態だけで失敗する場合は、その状態の `openMenus`、対応する `candidates[].menuRelations` と `state`、対象行の `links[].selectedAncestor` を確認します。0.1.5再現用の `rejection015` は0.1.6の失敗条件とは異なる点に注意してください。実画面のクリック・保存連動は別途確認が必要です。


### schema:3の後続観測

late-observation-startに上限と間隔、evidence-detailのpost-timeoutに抑制解除後の状態、late-name-confirmedに名称一致時刻、late-observation-stopに終了理由を記録します。finishedは編集処理の終了であり、後続観測の終了はlate-observation-stopで別に確認してください。自動観測にMutationObserverは使わず、停止時にpoll/deadlineの両タイマーを解除します。背景タブのタイマー制限によって間隔や実行時刻が遅れる場合があります。

3秒以内の名前更新と画面終了、期限後の更新、解除後のCSS状態の変化を比較します。解除後に更新しただけでは、解除が原因だったとは判定しません。観測期限内に証拠が得られなければ結果不明を維持し、再送はしません。
