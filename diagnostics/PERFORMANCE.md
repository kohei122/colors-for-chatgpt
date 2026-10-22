# 短時間の処理量診断（0.1.22）

今回報告された「上部ボタンhover後の重さ」には、まず[hover前後の区間別診断](HOVER.md)を使ってください。以下の8秒集計も引き続き使用できます。

実チャットの重さの原因は未確定です。拡張自身の処理だけを8秒間集計します。本文・チャット名・ID・入力値は出力しません。常時測定せず、開始操作があった時だけ時刻を測ります。新しいDOM監視、全DOM走査、クリック、保存、通信は追加しません。

1. 拡張とChatGPTタブを再読み込みします。まず重いタブを帯ONにし、Consoleで開始します。

```js
document.getElementById('marusin-thread-colors')?.dispatchEvent(
  new Event('thread-colors-performance-start')
)
```

2. 8秒間、比較したい操作を1種類行います（待機／スクロール／入力／ボタンhover）。入力内容は記録しません。9秒ほどして結果をコピーします。

```js
copy(document.getElementById('marusin-thread-colors')
  ?.getAttribute('data-performance-diagnostic'))
```

3. 同じタブ・同じ幅で帯OFFにし、同じ操作で再取得します。可能なら軽いタブでも同じ条件で取得します。結果には「重いタブ・ON・スクロール」のような説明を別途添えてください。チャット名そのものは不要です。

途中停止：

```js
document.getElementById('marusin-thread-colors')?.dispatchEvent(
  new Event('thread-colors-performance-stop')
)
```

`status:complete`と`cleanup:true`で通常終了です。新規開始・遷移・pagehideでも古い計測を終了します。`work`はtitle／checkModals／refreshShells／mutationBatchの呼び出し数、累計ms、最長msです。入れ子の処理を含むため累計msを足してCPU時間と見なさないでください。ページ自体の処理・描画・通信、DevToolsや他の拡張の負荷は測っていません。ON/OFFはレイアウト表示の切替で、拡張をアンインストールした状態との比較ではありません。

ツールチップの配置診断とは別に実行してください。同時に実行すると測定自体の負荷が混ざります。実ページ側のResizeObserverや処理が原因かは、この集計だけで断定できません。
