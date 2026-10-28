# 上部「…」tooltipのローカル修正（1.0.0据え置き）

## 根拠

利用者提供の062930（通常チャット）と063457（Work）の診断JSONを読み取り確認。
各1保存サンプルであり、実画面の時間変化・ネイティブ更新周期を検証したデータではない。

両方とも一意なARIA参照からstatic / pointer-events:autoのtooltipへ対応する。
直上は子要素がtooltipだけのdata-radix-popper-content-wrapper（fixed、平行移動transform）。
さらにfixed / contain:layout / pointer-events:noneのportal、static div、bodyが続く。
body上端88px、tooltip上端約62.5px、幅約102.2px・高さ約29.8px。
下側空きは通常712px／Work748px。旧absolute構造のガードで補正対象外となっていた。

## 変更

content.jsに新構造専用の分岐を追加。旧分岐とbodyレイアウトは維持。
ARIA参照先・説明元の一意性、単独tooltipの専用ラッパー、観測済みの祖先構造とoffsetParentを確認する。
回転・拡縮・perspective等のある未確認座標系、本文・メニュー・モーダル、操作可能な子要素、空き不足は対象外。
ボタン下端+6pxと現在のtooltip矩形との差をラッパーのtranslateへ設定する。
前回の補正量を差し引くため累積せず、ネイティブtransformやdata-sideは変更しない。帯高を別途加算しない。

新構造に限り専用ラッパーとtooltipのanimation/transitionを一時停止し、上向きスライドとの不整合を避ける。
明示的なdata-radix-popper-arrow要素は補正中のみ非表示にする。通常のSVGは変更しない。
提供JSONには矢印の子構造やanimationの情報がないため、実サイトの矢印の有無・形状を確認済みとは扱わない。
未知の矢印や疑似要素まで一般化して非表示にしない。実画面で逆向き矢印が残る場合は、その構造を確認して追加対応を判断する。

ResizeObserverで対象の寸法変化を追跡。停止時に解除し、書き込んだプロパティだけを復元する。
ネイティブ側が同じプロパティを上書きした場合は新しい値を保護する。
hover終了、要素削除、遷移、全体OFF・個別OFF、pagehide、モーダル表示を検証。

既存未commitのdiagnostics/TOOLTIP.md、diagnostics/tooltip-layout.js、tests/tooltip-diagnostic.test.jsは変更前のSHA-256と一致。
旧診断のreasonsは旧ガードの評価なので、修正後も新構造を見送りと報告し得る。製品の実際の適用判定として使用しない。

## ローカル検証

node --check content.js
node --check tests/tooltip-fixed.test.js
node --test tests/tooltip-fixed.test.js tests/tooltip-overlap.test.js tests/tooltip-diagnostic.test.js tests/core.test.js

インストール済みChromium 1243をCHROMIUM_EXECUTABLEで指定。65件成功（新構造24、旧構造17、診断14、コア10）。
初回の新構造テストは21/23成功。2件は138pxとの厳密等価比較に対し137.9955pxとなったため失敗。
補正の0.01px丸めとブラウザの小数座標に合わせ、位置誤差0.02px未満を検証するよう修正して全件再実行した。
ネイティブtransform更新、スクロール、リサイズ、寸法変更、静止後の追加書込みがないこと、除外と復元を模擬検証。
fixtureは実測の親構造と数値を匿名化して再現したもので、実ChatGPTの配置エンジン全体の再現ではない。
git diff --checkと構文チェック成功。版番号・commit・push・ZIP・ストア・LP操作なし。

## 実画面の確認（通常チャットとWorkで同じ操作）

1. ローカル拡張をChromeの拡張機能管理画面から再読み込みし、対象ChatGPTタブも再読み込みする。
2. 帯ONで上部「…」へhoverし、tooltipがボタン下端から約6px下に表示されることを確認する。共有ボタンは採取しない。
3. hoverを数秒保持し、上下の振動や位置ずれがないか、矢印が逆向きに残っていないか、出現・消失時の動きに違和感がないか確認する。
4. hoverを外して再hoverし、同じ位置に出ることを確認する。ウィンドウ幅変更・スクロール後も繰り返す。
5. メニューを開く／閉じる、チャットを移動する、全体OFFとONを切り替える。補正が残らず、本文・メニュー・他のtooltipに影響しないことを確認する。
6. 通常／Workごとに結果を記録する。まだ上側や振動が出る場合は、そのモードと操作順を報告し、追加の時間変化採取を検討する。

実画面確認は未実施。ユーザーの確認前に解消済みとは断定しない。


## 1.0.1準備時の追記（2026-10-28）

最新修正後の通常チャット／Work「…」とWorkフォルダーは、利用者実機で機能OKとの報告を受領。本文の実機未確認の記載は開発当時の記録です。ズーム・キーボード操作など未報告の条件は実機未確認のままです。フォルダー修正時に診断JSON本体を参照できなかった制限も保持します。[リリース説明](../RELEASE-1.0.1.md)を参照してください。
