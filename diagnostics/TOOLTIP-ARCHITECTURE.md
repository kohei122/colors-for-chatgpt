# Tooltip内部整理（案A・1.0.0据え置き）

## 対象と実機状況

ローカルmain、開始HEAD 1ac3d328785930b68606c790be688695790ba367。
未commitのfixed／フォルダー修正、診断、fixture、テスト、記録を土台に整理した。GitHub版で上書きしていない。
通常／Workの「…」は整理前の修正について利用者実機で改善確認済み。
最新フォルダー修正と今回の内部整理は模擬検証のみで、実ChatGPT確認は未実施。
フォルダー追加時のJSON本体は参照できず、依頼本文の実測値を使ったという制限も継続する。

## 共通判定と役割

`tools/tooltip-policy.js`を読み取り専用判定の正本とする。
`python tools/sync-tooltip-policy.py`でcontent.jsとConsole単独診断へ同じコードを埋め込み、`--check`とテストで完全一致を確認する。
実行時の外部読込やmanifestの追加は不要。生成済みファイルを直接修正せず正本を変更する。

- source：button／role=button／span role=imgだけを収集。本文・メニュー・モーダル・hidden/inert等を除外。
- owners／resolve：操作元自身と従来の限定された直上spanの参照を解決。可視性、帯下端から96px以内、参照数、ID・説明元の一意性を検証。
- structures：absoluteとfixedを個別評価。配置側は操作元のタグを再判定しない。
- tooltipPlacement：矩形・前回の補正量から座標のみを計算。DOMや監視・スタイル所有を扱わない。
- tooltipSession：表示待ち／補正中／中止／終了を管理。世代が違う予約処理は新対象へ作用しない。
- releaseTooltipStyles：observer解除と所有する値だけの復元。1プロパティの復元失敗で他の後片付けを中断しない。

旧absoluteはbody直下またはdisplay:contents直下、offsetParent=body、absolute、pointer-events:noneを維持。
fixedは専用Radixラッパーと単独tooltip、fixed/contain:layout祖先、static div/body、対応するoffsetParentと平行移動だけの座標系を維持。
祖先探索や構造対応の拡大、bodyレイアウト変更、代替tooltip生成はしていない。
ARIAの競合は操作元種類によらず拒否する。従来absoluteボタンで見逃し得た競合も安全条件として統一した。

## 所有・監視・停止

animation/transitionの略記を上書きせず、animation-nameとtransition-propertyだけを停止・復元する。
元のduration、timing-function等は変更しない。ページ側が上書きした所有プロパティは復元で上書きしない。
ネイティブtransformとdata-sideは維持し、前回の補正を差し引いて非累積で配置する。同値・同優先度の書込みは省略する。

表示待ちは15秒。生成待ちや適格性回復待ちが期限を超えると中止する。
補正量の変化は1秒内12回、1セッション累計120回を上限とする。上限・例外・ページ側の所有値上書きでは中止・復元し、同じhover中に自動再開しない。離れて再hover／新しいfocusで新セッションになる。
これはDOM構造の拡大ではなく、競合時の有限な停止方針。長い連続移動でも安全側で補正を止め得るため実機確認が必要。

ID・inert・ARIAの追加属性監視はセッション中だけ。既存の関連DOM・scroll・resize監視を利用し、寸法は対象2要素のResizeObserverで確認する。
無関係な本文更新では全documentの参照検索を行わず、追加・削除された部分の対象ID／ARIAとの関係だけを調べる。
常時計測・常時ポーリングを追加しない。OFF・遷移・終了時はtimer、予約フレーム、追加属性監視、ResizeObserverを解除する。

## 診断の意味

`structureEvaluations.absolute/fixed`は共通正本による読み取り評価。`evaluatedStructure`で評価対象を示す。
fixedが適合する場合、absolute側の不一致を全体のreasonsへ混ぜない。
矩形、ARIA参照数、スタイルは観測事実。`productDecision: not-observed`で内部の適用・停止を未観測と明示。
内部の有効フラグ・スタイル所有・監視期限・競合回数はConsoleから確認できない。構造適合だけで製品が適用済みとは断定しない。
本文・チャット名・チャットID・URL全文は診断結果に出さない。

## 検証

実行対象：core、tooltip-overlap、tooltip-fixed、tooltip-diagnostic、tooltip-session。
新規31件を含め104件PASS。最初の新規テストは30/31成功。待機期限のテストで仮想時計をセッション開始後に導入していたため失敗し、開始順を修正して再実行した。期待する期限や結果は緩和していない。
生成一致確認、JS構文確認、git diff --checkを実施。
インストール済みChromium 1243をCHROMIUM_EXECUTABLEで指定した模擬検証であり、実ChatGPT検証とは異なる。

- 操作元×absolute/fixed×hover/focusの14組合せ（span role=imgにtabindexは追加しない）。
- 遅延生成とARIA付与の前後順、ID変更、重複、競合説明元、hidden/inert化、要素交換。
- hover/focus終了、OFF、遷移、削除、pagehide、例外時の復元。
- 個別animation/transition指定とページ側上書きの保護。
- 非累積配置、連続更新の中止、期限、古い予約、静止後書込み、無関係な本文変更への非干渉。
- fixed診断の構造別評価と正本の完全一致。

## 実機確認

1. ローカル拡張と対象ChatGPTタブを再読み込みする。
2. 通常／Workの「…」とWorkフォルダーをhover。下側表示、数秒保持、出入り、遅延表示を確認する。共有ボタンは採取対象にしない。
3. 既存のキーボードfocus、ウィンドウ幅変更、チャット移動、OFF/ON後の解除・再表示を確認する。
4. メニュー・モーダル・本文・他のtooltipへ波及しないこと、矢印・アニメーションの向きや消失に違和感がないことを確認する。
5. 診断を採取する場合は更新後のtooltip-layout.jsを使う。内部の中止原因はJSONから断定せず、操作順と表示の結果を添える。

fixed構造の階層・Radixマーカー・CSS条件、旧absolute条件、上部96px領域、未知の回転／拡縮・矢印などへの依存は残る。
版番号1.0.0維持。commit・push・ZIP・ストア・LP・News操作なし。


## 1.0.1準備時の追記（2026-10-28）

最新修正後の通常チャット／Work「…」とWorkフォルダーは、利用者実機で機能OKとの報告を受領。本文の実機未確認の記載は開発当時の記録です。ズーム・キーボード操作など未報告の条件は実機未確認のままです。フォルダー修正時に診断JSON本体を参照できなかった制限も保持します。[リリース説明](../RELEASE-1.0.1.md)を参照してください。
