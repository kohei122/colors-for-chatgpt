## 1.0.1 リリース準備（2026-10-28）

- 製品main、開始HEAD `1ac3d328785930b68606c790be688695790ba367`。既存未commitのtooltip製品修正・診断・fixture・テスト・設計記録を保持してリリース対象に含めた。manifest/package/lock・現行診断・版表示テストを1.0.1へ整合。過去記録は当時の状態として保持。
- `node --test --test-concurrency=2 tests/*.test.js`：15ファイル、335件PASS、失敗0・キャンセル0・スキップ0（427,575ms）。今回の全件実行で失敗・再実行なし。検証用Playwright ChromiumをCHROMIUM_EXECUTABLEで指定。旧absolute、fixed、フォルダー、ARIA所有者、遅延・競合・交換、hover/focus、OFF・遷移・削除・例外、ページ上書き・個別animation/transition復元、更新上限・非累積・静止後書込み、除外対象、既存機能・翻訳・性能を含む模擬回帰。
- JS/CJS 29ファイルのnode --check、tools Python AST、manifest/package/lock/7言語JSON、翻訳再生成一致、7言語キー・置換値、参照整合、tooltip生成コード一致、git diff --check：PASS。7言語更新説明はUTF-8・版表記・内容対応を確認。ネイティブ話者レビューなし。
- `python tools/package-release.py`：20ファイル、71,501 bytes、SHA-256 `e1fced567f14705c67c50878207c9a33ac500f18396eb1a0b68dd896dea43a38`。LICENSE、manifest直下、依存参照、CRC、元ファイル完全一致、生成コード同梱がPASS。tools/tooltip-policy.jsは開発時正本であり、content.jsへ埋め込んだコードが製品に含まれる。梱包前の生成コード検証を必須化した。
- `node tools/verify-package.cjs`：別の一時フォルダへ展開したZIPから拡張を読み込み、製品名・1.0.1・4アイコン・7言語popup・storage権限・content script・fixedボタン/フォルダーの下側表示とhover終了復元・SHA-256を確認、PASS。Windows CRLFも正規化して生成元ハッシュを比較するよう検証スクリプトを整備し、再確認PASS。実ChatGPT接続ではない。
- 1.0.0 ZIPは69,439 bytes、SHA-256 `02639e4fcfc9a79dc293eaf628d814aad204bcc12171937f7ad27d4ff625fae9` のまま保持。ZIP・ログ・検証画像/JSONは既存Git除外方針を維持。
- 利用者実機：最新修正後の通常／Work「…」・Workフォルダーは機能OKの報告を受領。ズーム・キーボード操作等の個別報告がない条件と、今回のZIP展開物そのものの実ChatGPT確認は未確認。以下の開発時の未確認記録は履歴であり、この追記が最新状況。
- LP：main `a1245350b7626ba28a5fd0eb223af886948f6d24`、変更なし。catalog（6製品）・news（15記事）検証、Wix catalog/newsテスト、diff --check：PASS。日英・機能・制限・権限・ストアリンク・SEO/構造化データは変更不要。News追加・共通LP構造/CMS追加・Wix手作業は不要。
- 両ストアの実ページ取得は失敗し、現在版の独立再確認はできず。1.0.1は両ストア未公開として記載。ローカルと取得したorigin/mainに.github workflowなし。Actions追加・変更・手動起動なし。GitHubへの通常pushと、Wix反映・ストア公開は別。ストア入力/提出/公開・GitHub Release作成は行わない。
- 詳細・ファイル一覧・実機手順は [RELEASE-1.0.1.md](RELEASE-1.0.1.md)。

## 1.0.0 レビュー依頼のストア共通化（2026-10-24）

## ローカル開発中：tooltip内部整理（1.0.0据え置き）

旧absolute／専用fixedの対応範囲を維持し、操作元・ARIA・構造判定を共通正本へ整理しました。
表示待ち・補正・中止の管理、例外時の解除、個別animation/transition指定の復元、ID/ARIA競合の再評価を追加しています。
判定変更時は `python tools/sync-tooltip-policy.py`、整合性確認は同コマンドの `--check` を実行します。
[設計・検証・実機手順](diagnostics/TOOLTIP-ARCHITECTURE.md)に条件と限界を記録しました。
関連104件PASS（新規31件含む）。通常／Workの「…」の以前の修正は利用者実機で改善確認済みですが、最新フォルダー修正と今回の内部整理は実機未確認です。
下記の過去版記録は当時の条件・結果として保持しています。commit・push・ZIP・ストア・LP操作は行っていません。


- 開始時はColors・LPとも既存差分なし。7言語のdescription.txt末尾2文を、ストア名を含まない評価・レビュー依頼の1文へ変更。日本語は指定文と一致。他6言語も既存の依頼表現を維持し、ストア名と星だけの評価に関する説明のみ削除した。
- store-listing/REVIEW.txtへ、Chrome / Edgeで共用する掲載文の運用ルール4項目を追加。過去記録は保持。
- 全7言語で編集前の末尾2文以外がバイト単位で一致、UTF-8 strict decode、既存改行・末尾改行の保持、Git HEADとのLF正規化比較、git diff --check：PASS。意味整合を確認。ネイティブ話者レビューは未実施。
- 製品コード・製品名・summary.txt・版番号1.0.0は変更なし。公開ZIPは再生成せず、SHA-256は既存と同じ02639e4fcfc9a79dc293eaf628d814aad204bcc12171937f7ad27d4ff625fae9。
- LPのextensions.json、topics.json、ui-labels.json、support-page.json、privacy-policy.jsonとBackend / Page Codeを検索・確認。日英に今回に相当するストア限定レビュー依頼はなかった。プライバシー文のストア利用規約説明、Newsの審査注意書き、ソース確認等のreviewはレビュー依頼ではない。ストア別ダウンロードボタン・リンクを含めLPは無変更。
- LP変更・News追加・Wix作業は不要：ストア共通原稿の依頼文整理のみで製品情報の変更がなく、LPに修正対象がないため。共通構造・CMS・Backend・Page Code・SEO/JSON-LD生成処理は変更しない。LP実画面・Wix現行設定の再確認は実施していない。
- 文言・文書のみのため、本文差分・文字コード・変更範囲の検証を実施し、製品ブラウザテストや無変更LPの回帰テストは再実行しない。ストア転記対象はstore-listing/{ja,en,ko,zh_CN,zh_TW,es,pt_BR}/description.txt。ストア入力・保存・公開、Wix公開操作なし。GitHub pushは公開LPへの配備と区別する。

## 1.0.0 ストア詳細説明の導入整理（2026-10-24）

- 開始時はColors・隣接LPリポジトリとも差分なし。両対象内と共通上位ディレクトリに適用されるAGENTS.mdは見つからなかった。
- `store-listing/{ja,en,ko,zh_CN,zh_TW,es,pt_BR}/description.txt` の導入3文のみ削除し、既存キャッチコピー、空行、既存の使い方見出しへ接続。7言語の削除内容の対応と構成を確認。新規翻訳なし、ネイティブ話者レビューは未実施。
- 編集直前の各ファイルと比較し、キャッチコピーおよび使い方見出し以降がバイト単位で一致：PASS。UTF-8 strict decode、既存CRLF維持、Git HEADとのLF正規化比較、`git diff --check`：PASS。最初のHEAD比較はGitのLFと作業ツリーのCRLFの差で不一致になったため、正規化後に再確認した。
- name.txt、summary.txt、製品コード、manifest/packageの1.0.0は変更なし。公開ZIPは再生成せず、SHA-256 `02639e4fcfc9a79dc293eaf628d814aad204bcc12171937f7ad27d4ff625fae9` が既存記録と一致。
- LP調査対象HEAD：`8484856ab537bad37140c0c3fd51ab888b733102`。`extensions.json` のColors日英本文・機能・FAQ・制限、`privacy-policy.json`、`topics.json`、README、docs/operation.md、docs/add-extension-guide.md、docs/enter-key-control-release-workflow.md、docs/release-status.md、Backend / Page Codeを読み取り確認。
- LP変更不要：ストア概要との重複整理であり、製品仕様・制限・storage権限・対応範囲・公開状態を変更しない。LPは独立した説明を持ち、ストア用description.txtを読み込まない。LP側にColorsのストア説明コピーもない。News追加、共通構造、CMS、SEO生成処理、Wix手作業は今回不要。
- LP検証：`python scripts/validate-catalog.py`（6製品）、`python scripts/validate-news.py`（13記事・可視13件）、`node scripts/test-wix-catalog.cjs`、`node scripts/test-wix-news.cjs`：すべてPASS。Python初回はURI format依存不足。TEMPへjsonschema[format]を導入し、同依存を参照できる実行環境で再実行してPASS。リポジトリやグローバル依存の変更なし。製品コード無変更のため拡張のブラウザテストは再実行しない。
- 現行LP JSONではColorsのstatusはpublished、Chrome/Edge URLあり、News `colors-for-chatgpt-release-2026-10-23` はisVisible=true。docs/operation.mdの初期登録時false/CMS下書き記録より後のcommitでNewsが公開されている。ストア公開の記録根拠はユーザー報告であり、今回ストア実ページの取得は失敗したため最新版・公開日時の独立再確認はできていない。
- 公開ページ取得：日本語トップ `https://www.ori-marusin.com/extensions` でColors Newsを確認。英語トップ `https://www.ori-marusin.com/en/extensions` は取得結果が古く、Colors反映は未確認。日英個別LPは取得ツールでアクセスできず、非公開とは断定しない。Wix Studio現行コード・CMS・実画面SEO/JSON-LDは未確認。GitHubへのpushとWix公開を区別する。
- ストアへの転記対象は上記7言語のdescription.txtのみ。ストア管理画面への入力・保存・公開、Wix編集・公開は実施しない。

## 1.0.0 公開用ZIPへのLICENSE追加（2026-10-22）

パッケージ許可リストへリポジトリ直下のLICENSEを追加し、20ファイルへ更新。manifest.jsonとLICENSEはZIP直下。既存19ファイルは旧ZIPとバイト単位で完全一致。製品コード・版番号1.0.0は変更なし。

- 保存先：releases/colors-for-chatgpt-1.0.0.zip
- サイズ：69,439 bytes
- SHA-256：`02639e4fcfc9a79dc293eaf628d814aad204bcc12171937f7ad27d4ff625fae9`
- 参照整合、CRC、全20ファイルと元ファイルの一致、旧19ファイルとの差分がLICENSE追加のみであること：PASS。
- Python構文確認：PASS。再実行でも同一ZIPになることを確認。
- 展開物を隔離したChromiumで読み込み、正式名・1.0.0・管理画面アイコン・4サイズPNG・7言語popup・content script・ZIPハッシュを確認：PASS（模擬ChatGPT画面）。実ChatGPTを今回再確認したものではない。
- 製品コードに変更なしのため270件は再実行しない。実ChatGPTでの失敗時復旧は未確認のまま。
- 旧ZIP（68,717 bytes）と旧検証成果物をreleases/history/pre-license-1.0.0へ保持。旧SHA-256：`e97a0020f1c5f37fb95ee2a9ac7b4affc3aff9676bf0c8ae778424aae5dc1095`。
- ZIPと生成物は.gitignoreで除外。スクリプト・README・本記録だけをGit対象とする。GitHub Release・ストア入力・審査提出は行わない。

ZIP内容一覧（20ファイル）：

```text
LICENSE
_locales/en/messages.json
_locales/es/messages.json
_locales/ja/messages.json
_locales/ko/messages.json
_locales/pt_BR/messages.json
_locales/zh_CN/messages.json
_locales/zh_TW/messages.json
content.js
core.js
i18n-data.js
i18n.js
icons/icon128.png
icons/icon16.png
icons/icon32.png
icons/icon48.png
manifest.json
popup.css
popup.html
popup.js
```

## 1.0.0 初回Publicリポジトリ準備（2026-10-22）

対象フォルダと親はGit未管理。指定リモートはPublic、既存参照なしと確認。19実行ファイルは検証済みZIPとバイト単位で一致し、製品動作・版番号の変更なし。ZIP後の変更は掲載詳細説明7言語、MIT LICENSE・README、package.jsonのlicense、公開準備のロックファイル・除外設定・文書およびテスト例の匿名化。公開用ZIPは再作成しない。

既存270件の最終PASS記録を採用。今回は全件再実行しない。匿名化したテスト例に関係する表示・チャット切替/再読込・古いタイトル混入防止の3件を再実行し、3件PASS（約5.3秒）。tests/browser.test.jsの構文確認もPASS。ローカル絶対パスを匿名化し、テストと過去の説明に使った作業名をサンプル名へ置換。実行コード・7言語の製品名/概要一致・MIT全文・JSON・参照先・機密情報候補を点検。ログ、スクリーンショット、計測結果、ZIP、依存実体は除外し、元ファイルは保持する。失敗時の実ChatGPT復旧は引き続き未確認。

## 2026-10-22 1.0.0利用者実機確認・公開用ZIP検証（未公開）

### 利用者による実Chrome・実ChatGPT確認

今回は1.0.0について利用者から以下の実機確認報告を受領した。自動テスト・0.1.33の過去確認とは区別する。

- ポップアップのver 1.0.0表示。
- 再読み込み後の色・サイズ設定保持。
- 日本語・英語での名前変更と再読み込み後の反映。
- 日本語IME変換中のEnterでは編集が終了しない。
- 変換確定後のEnterで保存。
- 外側クリックで確定し、キャンセルできる。
- フォルダを畳んでも取得済みの帯タイトルを保持。
- 本文入力・送信、画像ビューア開閉、ツールチップに支障なし。
- 同一チャットの別タブへ色設定が反映。

**失敗時の実ChatGPTでの復旧は未確認**として残す。報告にない全言語・全モード・すべてのエラー経路へ確認範囲を広げない。以下の過去記録の「1.0.0実確認は未実施」は当時の状態であり、上記報告分だけ更新する。

### ZIP作成

既存のZIP作成スクリプトはなく、toolsには翻訳生成のみ存在した。tools/package-release.pyに実行ファイル19件の許可リストを作成し、再現可能な固定ZIPタイムスタンプで梱包。同名の異なるZIPがあれば上書きせず中止する。

保存先：releases/colors-for-chatgpt-1.0.0.zip
サイズ：68,717 bytes
SHA-256：`e97a0020f1c5f37fb95ee2a9ac7b4affc3aff9676bf0c8ae778424aae5dc1095`

内容（ZIP直下にmanifest.json、余分な親ディレクトリなし）：
- manifest.json
- content.js、core.js、i18n.js、i18n-data.js
- popup.html、popup.css、popup.js
- _locales/{en,ja,ko,zh_CN,zh_TW,es,pt_BR}/messages.json（7件）
- icons/icon16.png、icon32.png、icon48.png、icon128.png

完全な一覧はreleases/colors-for-chatgpt-1.0.0.files.txt、チェックサムは同.zip.sha256、各ファイルのハッシュと展開先はreleases/package-1.0.0.json。design・diagnostics・tests・node_modules・store-listing・tools・package.json・開発文書・過去画像・ログはZIPに含めていない。元ファイルは削除せず、製品実行コード・翻訳・アイコン・版番号も変更なし。

### ZIPそのものの限定検証

- ZIPの全エントリと許可リスト19件が完全一致。CRC検査PASS、相対パスの安全性を確認。
- manifestのcontent_scripts・action.default_popup・icons・action.default_icon、popup.htmlのCSS/JS参照がすべてZIP内に存在。7言語JSON・概要一致を確認。
- 別の一時フォルダ `<temporary-extraction-directory>` に展開。全19ファイルのバイト列／SHA-256が元ファイルと一致。
- tools/verify-package.cjsで、この展開先だけを指定して拡張を読み込んだ。検証用Chromium 153.0.8010.12、隔離したプロファイル、模擬chatgpt.comページを使用。開発元フォルダからの読み込みではない。
- 拡張管理画面の正式名・版番号情報・読み込み済みアイコン、ポップアップの正式文書名とmanifest由来ver 1.0.0、4サイズのPNGを実際に読み込めることを確認。管理画面・ポップアップ画像を目視確認。
- 7言語のポップアップ切替、横はみ出しなし、storage権限だけで動くこと、popupで対象チャットが個別ONになりcontent scriptの帯が表示されることを確認。pageerrorは0件。
- ブラウザ検証後もZIPのSHA-256が一致。検証結果はreleases/package-browser-verification.json、画像はpackage-management.png / package-popup.png。
- 追加したPython/JS手順の構文PASS。製品コードに変更がないため、全270件は再実行していない。

ZIP展開物での実ChatGPT接続検証は実施していない。利用者の1.0.0実機確認は上記として扱い、今回の展開物テストで再確認したとは扱わない。失敗時の実機復旧は引き続き未確認。ストア入力・審査提出・公開は未実施。他の拡張・サンプルA・カタログの変更、commit・pushなし。

---

## 2026-10-22 初回正式版1.0.0の公開準備（未公開）

### 結果

既存13テストファイルを対象に全体検証を実施。修正後の再実行と分割実行を集計し、**ユニーク270件の最終結果がPASS、未解消のテスト失敗0件**。内訳はcore/browser 186件、設定・起動・7言語・popup 46件、性能・ツールチップ・診断38件。全ての初回コマンドが成功したという意味ではない。各ケースの最終ログは tests/release-1.0.0/summary.json に記録した。

模擬ChatGPTのDOM、Chrome APIのモック、Playwright Chromiumを使用。popup-extension.test.jsのみ拡張を実際に読み込み、実storage・manifest・ブラウザ再起動・200%拡大を確認するが、ChatGPT画面と通信はfixtureである。実ChatGPTの1.0.0再確認、実Windows IME確認、サーバー保存の永続化確認は未実施。

### 更新した版番号

- manifest.json：1.0.0。権限、対象URL、action、アイコン、多言語概要参照を維持。
- package.json：1.0.0。npm内部名chat-thread-colors・依存関係は維持。package-lock.jsonは存在しない。
- content.js：製品内の名前変更診断2箇所でmanifest版番号を優先取得し、モック環境等のフォールバックを1.0.0に更新。その他の製品動作変更なし。
- diagnostics/native-rename-ui.js、native-menu-row-values.js、native-rename-structure.js：現在版の診断メタデータを1.0.0へ更新。
- diagnostics/tooltip-layout.js：現在版の適用対象コメントを1.0.0へ更新。旧0.1.5専用診断は歴史的再現用なので保持。
- README.md：現行版の説明を先頭へ追加。古い0.1.33等の版番号・記録は履歴として保持。

版番号の生成スクリプトはなかった。既存のポップアップ表示はchrome.runtime.getManifest().versionを読む方式を変更せず、7言語のフッターテストと実際に読み込んだ拡張で「ver 1.0.0」を確認。内部識別子・storageキー・npm内部名は変更なし。

### 検出した不整合と対応

1. 掲載文にフォルダ折りたたみ時の名前編集制限が不足。7言語のdescription.txtに、対象行の表示が必要・閉じたフォルダでは変更不可・手動展開、を追記。製品名とsummary.txtは変更なし。
2. 古いテストが旧製品名、0.1.33、削除済み翻訳行、失敗時の警告を期待。現行仕様に更新。名前変更fixtureにはnative lang=jaを明記し、空白入力の無通知終了・再編集を検証するよう修正。
3. startup.test.jsのモックが共通初期値の読込Promiseを完了させていなかった。共通初期値なしの応答を返すよう修正。製品コードの起動待機は変更せず6件PASS。
4. 非編集状態でaria-busyを外す現行仕様に対し、属性値falseだけを待つ試験があった。busyがtrueでないことに加え、編集欄非表示・処理中表示解除を確認するよう更新。
5. 廃止済み警告の×をクリックする試験4件を、無通知からの再試行・設定操作へ更新。別の復元試験ではモックが先にダイアログを削除していたため、残存するダイアログの復元を検証するmode:stayへ修正。製品の保存1回・再送禁止・上限時間は変更なし。
6. ランナーの上限がテスト1件ではなくファイル全体に適用され、初回45秒とその後の600秒枠で中断。製品タイムアウトは変えず、末尾8件を分割実行。初期失敗・中断ログも残し、最終結果だけを集計した。無関係なテストを繰り返すための機能変更は行っていない。

### 要求範囲との対応

| 検証項目 | 主な試験と結果 |
| --- | --- |
| チャット別の色・帯・枠・文字、型検証 | core/browser、コントラスト・保存・再読込・リセット PASS |
| 全体OFF、個別ON/OFF、×、新規チャット | individual/popup/browser、優先順位と補正解除 PASS |
| 共通初期値、手動色除外、既存設定優先 | individualの031/032、単なる閲覧やON/OFFで更新しない PASS |
| 同一チャットの別タブ共有・遷移 | browser/individual、遅延読込・書込・戻る操作・再起動 PASS |
| 7言語とフォールバック | i18n-033/popup-footer/browser、キー・変数・幅・切替 PASS |
| 日英名前変更、その他・空・不明言語拒否 | browser native language群、対象照合と1回保存 PASS |
| Enter・外側クリック・キャンセル・IME | browser、合成composition/229/keyup/repeatの確認 PASS。実IMEではない |
| プロジェクト折りたたみ・名前保持・対象行制限 | browser project title retention、hidden/DOM削除/復帰/別チャット/成功・失敗 PASS |
| 要素欠落・例外・タイムアウト・無通知・再試行 | browser failure recovery/silent failure/unsupported DOM群 PASS |
| 未確認名の非確定・自動再送禁止・遅延完了 | browser live evidence/late observation/復元群 PASS |
| 長いタイトル・狭幅・入力欄・モーダル | browser/individual/tooltip、240〜1498px、実拡張200%拡大 PASS |
| ツールチップと長いDOM・診断解除 | tooltip/focus/hover/performance、上限付き観測・非干渉 PASS。実画面の重さ解消を保証しない |

### 静的整合・表示確認

26個のJS/CJS構文、Python生成スクリプト構文、manifestと7言語JSONを確認。7言語キー・空文字・置換変数・生成辞書一致はi18nテストでPASS。

正式製品名はmanifest.name/action.default_title、全言語appName、掲載name.txtでColors for ChatGPT (by marusin)に一致。ポップアップ可視ブランドは利用者指定どおり短いColors for ChatGPTを維持。全言語appDescription/m104とstore-listingのsummary.txtは完全一致。文字数はja77/en126/ko79/zh_CN52/zh_TW51/es129/pt_BR119、すべて132以内。

使い方・製品DOM・掲載文に「タイトル全文」の展開機能はない。名前変更の日英限定と閉じたフォルダの制限を掲載文と照合。icons/icon16.png、32、48、128のPNG署名・実寸法・画像デコード、manifest.icons/action.default_iconおよびスクリプト参照先を確認。権限はstorageのみ。ポップアップ1.0.0の画像、狭幅のポルトガル語画面を目視し、他の7言語は境界・折返しの自動検証も実施。

新しい画像・測定結果26ファイルは tests/release-1.0.0/ に保存し、既存の履歴画像・JSON36ファイルは検証前のバイト列へ復元した。初期ログ・最終ログはtest-release-1.0.0-*.txt、静的確認はtest-release-1.0.0-static.json。集計はtests/release-1.0.0/summary.json。

### 公開前に残る作業

- 1.0.0を実Chromeへ再読み込みし、実ChatGPTの日英名前変更、保存後の再読込、実Windows IME、外側クリック・キャンセルを最終確認。
- 失敗・結果不明からの復旧と再試行、フォルダを畳む／展開する操作、別タブ・全体/個別OFF、画像ビューア、入力欄、Workモードのツールチップを実環境で確認。
- 過去の利用者確認（英語保存、韓国語クリック無効、日本語IME、外側クリック・キャンセル、折りたたみ保持と展開後編集）は0.1.33での実績として下記に保持。今回の1.0.0実確認へ繰り上げない。
- 公開用ファイルの選別・パッケージ作成、ストア入力・審査提出・公開は未実施。診断・テスト・ログを含む開発フォルダ全体を無条件に提出する準備はしていない。掲載翻訳のネイティブ話者による最終レビューも未実施。

Git管理は対象フォルダで検出されなかった。既存変更を保持し、他の拡張・サンプルA・カタログは変更なし。commit・push・ZIP作成・ストア入力・審査提出・公開なし。

---

## 2026-10-22 使い方の整理・利用者実機確認（0.1.33維持）

利用者による実Chrome・実ChatGPT確認（自動テストとは別）：
- プロジェクトを畳んでも取得済みのチャット名が帯に残る。
- 対象行が見えない状態では名前編集不可。
- プロジェクトを展開すると名前編集可能。

上記を確定仕様とする。フォルダの自動展開・代替UI操作は追加しない。以下の過去記録にある同挙動の未確認事項は、この利用者報告で更新する。その他の失敗復元や全言語の実操作まで確認済みとは扱わない。

実装確認：使い方はpopup.htmlではなくcontent.jsの帯設定メニューに存在。既存detailsとキーボード開閉、終了時の折りたたみを維持して4項目の番号付きリストへ整理。色選択／帯・枠・文字調整／名前変更／個別OFFの順。名前変更の直下へ日英限定と「対象行を表示、プロジェクトならフォルダ展開」の条件を配置。Enter・外側クリック・IME・キャンセル説明を保持。個別OFFは左×、色や寸法は保持、再表示は全体ONでアイコンを開く旨を説明。

見出し13px・600、本文13px・行高1.6、補足12px、操作間16px。過剰な太字や一文への条件の詰め込みを避けた。7言語を同じDOM構成・意味で一元翻訳。既存キーは維持し、同一見出しは既存訳を再利用。説明の出し分け、設定処理、名前編集処理は変更なし。

限定検証4件PASS：details初期閉鎖とEnter/Space、全閉じ方のリセット、7言語と実編集条件の分離、4項目の順序・全見出し／段落の翻訳辞書一致・幅640/320pxで横はみ出しなし。関連JS3ファイルの構文、7言語JSON・キー/置換変数整合・版番号を確認。全件テストは未実施。今回の説明デザインは実ChatGPTで未確認、実Windows IMEの追加確認も未実施。

既存変更と0.1.33を維持。他の拡張・サンプルA・カタログの変更、commit・push・ZIP・公開なし。

---

## 2026-10-22 プロジェクト折りたたみ時のタイトル保持（0.1.33維持）

コード調査：title()は毎回対象リンクまたは条件付きdocument.titleから取得し、lastTitleは描画比較のみ。チャットID別の保持値がなかった。行のDOM削除とpageTitleの未取得が重なると確認中へ戻る。一方beginEdit()はthreadTarget()による可視リンク・最小共通祖先・一意のアクションボタンとassertAction()による操作可能性を要求する。非表示／削除行では、表示名が残っていても開始を拒否する。この2経路で症状を説明できるが、報告された2チャットの実DOMで同一原因とは未確定。

修正：ページ内MapでID別の取得済み名とその時点のdocument.titleを保持。リンクからの再取得と確認済み名前変更で更新し、同じdocument.titleを古い値として読み戻さない。リンクが取れない場合は保持値を使用。現在URLと内部IDが不一致の間は取得せず、未訪問チャットに他チャットの保持値を使わない。永続保存・storageキー変更なし。編集候補の照合・タイムアウト・後片付け・日英制限は変更なし。

検証用Chromium：関連5件PASS（既存の未知チャットへの古い名非流用、遷移と同時のpageTitle更新、新規のhidden行／削除行での保持・復帰・再展開・ネイティブ更新・正常保存後の保持、失敗入力非保持と通常表示復帰）。対象行不在でボタンのクリック／保存が0回であることを確認。

追加の限定診断project-title.jsは10秒後の単発読み取り。本文・名前・IDの生値・入力値・HTMLを出力せず、対象リンク件数、最小行の判定、表示・操作制限、上部メニュー候補と動的ARIA対応を報告する。限定診断テスト1件PASS：対象行1件を特定、名前／ID非出力、クリック／保存0回。構文content.js・tests/browser.test.js・診断JS確認済み。全件テストは未実施。

残る確認：対象行なしで利用できる正規の名前変更UIと対象IDの対応は未確認。自動展開・代替クリックは追加していない。diagnostics/PROJECT-TITLE.mdの手順で、必要なら対象2チャットの畳んだ状態／展開状態を比較する。実ChatGPTでの保持・編集不可の個別原因・今回の解消は未確認。製品版番号0.1.33、既存変更を維持。他の拡張・サンプルA・カタログ、commit・push・ZIP・公開なし。

---

## 2026-10-22 左右ボタンの追加移動・編集説明の常時表示（0.1.33維持）

左右ボタンをさらに30px中央寄りへ移動：×は左44px、設定／編集キャンセルは右50px（幅520px以下は44px）。中央タイトル用の予約幅も30px拡張。幅320px以下では余白を44〜6pxへ縮め、クリック領域を削らず長文タイトル・編集欄との重なりを回避する。

編集説明を指定の日本語および同義の7言語へ更新。「使い方」の編集説明をhiddenにする専用処理を削除。説明専用の通信・状態はなかった。native lang監視、編集開始条件、名前変更の中止処理は実機能と共有しているため維持。使い方を展開したときは言語・対象チャット・ON/OFFにかかわらず説明を表示する。

限定ブラウザテスト2件PASS：7言語見出しと説明の非非表示、ja/en-US/ko/空/不明langでの実編集可否の分離、チャットなしと全体OFF、幅1280/640/320/240pxで長いタイトルと編集欄の中央配置・左右ボタン非重複・×の40pxクリック幅。構文確認content.js、tests/browser.test.js、i18n-data.jsと7言語JSON・説明文一致PASS。全件テストは未実施。

今回の実ChatGPT表示・実Windows IMEは未確認。既存変更と版番号0.1.33を維持。他の拡張の変更、commit・push・ZIP作成・公開なし。以下は変更前の経緯を含む記録。

---

## 2026-10-22 帯の配置・見出し・編集説明の整理（0.1.33維持）

左右ボタンを8px内側へ移動（×は左14px、設定は右20px／狭幅14px）。クリック領域を維持し、タイトル・編集欄の左右予約幅も8px拡張。指定された「このチャットの表示」は、アイコンのポップアップではなく帯メニュー内の見出しに存在したため、同箇所を「このチャットの色設定」へ更新した。7言語の対応文言も変更。

タイトル全文のdetailsと専用要素・更新処理・CSS・翻訳を削除。翻訳生成では削除行を空スロットとして扱い、他のmessageキーを繰り上げない。通常タイトルのtitle属性、名前編集、保存設定は維持。

編集説明と編集開始に共通の適格条件を使用。ja/enだけでなく、対象ID一致、読込完了、全体・個別ON、モーダル・名前変更処理の状態を確認する。対象外言語・空・不明langや対象チャットなしでは編集説明を隠す。通常の保存説明は残す。

関連6件PASS（既存4件、新規2件）：狭幅、長文タイトルと中央配置、日英Enter編集、7言語見出しとnative lang追従、チャットなし／全体OFF、全文欄の削除、幅1280/640/320/240pxでボタンとの非重複と編集欄中央配置。初回の新規テスト1件は一時的なルート状態だけで復帰判定してタイムアウトしたため、新規画面の遷移完了を待つようテストを修正し、新規2件を再実行してPASS。

構文・静的整合：content.js、tests/browser.test.js、i18n-data.jsのnode --check、生成スクリプトのPython構文、7言語JSONと生成辞書・翻訳キー、削除キーm014の不存在、概要とstore-listingの一致、版番号0.1.33を確認。全件テストは未実施。

実ChatGPTでの今回の配置・説明表示、実Windows IMEは未確認。過去の利用者実機確認は以下の記録を保持。他の拡張・サンプルA・カタログの変更、commit・push・ZIP・公開なし。

---

## 2026-10-22 掲載確定名・概要の製品反映（0.1.33維持）

正式名Colors for ChatGPT (by marusin)をmanifest.name、action.default_title、全7言語のappName、popup.htmlの文書titleへ反映。可視ブランド（h1と読み上げ名を含む）とレイアウトは変更なし。translations.tsvの既存概要行を各summary.txtに揃え、tools/build-i18n.pyの名前・概要抽出条件を更新して_localesとi18n-data.jsを再生成。messageキーは維持。

限定検証PASS：manifestおよび7言語JSON構文、manifestの多言語参照、各summary.txtとの完全一致、appNameの全言語一致、生成済み同梱辞書との一致、i18n-data.jsのnode --check、生成スクリプトのPython構文。各言語の変更キーがm104/appName/appDescriptionだけであることを確認。
概要文字数（Unicodeコードポイント数・UTF-16単位数とも同一）：ja 77 / en 126 / ko 79 / zh_CN 52 / zh_TW 51 / es 129 / pt_BR 119。すべて132文字以内。

content.js、core.js、popup.js、popup.css、i18n.js、package.jsonの変更前後ハッシュ一致。popup.htmlは文書title以外の変更なし。版番号・storage・内部識別子・npm内部名・default_locale・権限は維持。全件テスト、実Chromeでの再読み込み確認、ストア入力・公開は未実施。

---

## 2026-10-22 利用者による実機確認と7言語掲載文（0.1.33維持）

利用者から「失敗時の案内非表示化後も、日本語環境で名前変更が成功した」との実Chrome・実ChatGPT確認報告あり。自動テストとは別の利用者実機確認として記録する。実ChatGPTでの失敗時の復旧動作は引き続き未確認。今回の報告から他言語・他操作の成功や復旧を推定しない。

掲載用原稿をstore-listingへ新規作成。日・英・韓・簡体字・繁体字・西・ブラジル葡の各言語にname.txt / summary.txt / description.txtを用意。共通製品名はColors for ChatGPT (by marusin)。日本語概要と詳細冒頭は利用者指定をそのまま使用。全概要が132文字以内、UTF-8、文字化け置換文字なし、7言語で機能・制限・プライバシー項目を照合済み。概要文字数・実装との照合・既存製品との差分はstore-listing/REVIEW.txt参照。

翻訳のネイティブ話者レビュー、ストア入力・公開は未実施。製品コード・manifest・製品翻訳・版番号0.1.33は変更していない。今回の確認は原稿の文字数・内容検証であり、製品テストは再実行していない。他の拡張・サンプルA・カタログは変更なし。

---

## 2026-10-22 名前変更失敗通知を非表示化（0.1.33維持）

利用者の指定により、名前変更の失敗・保存結果不明・中止時の製品通知と失敗入力の再利用パネルを表示しないよう変更。空白のみの入力も保存せず通常表示へ戻す。成功未確認の入力名は確定表示せず、既存のページ名称取得処理で確認できる名前を表示する。再編集はページ側の現在名から開始。成功確認後の成功通知と、名前変更以外の設定操作の通知は変更なし。

開発用のfailure/finished、結果不明・遅延観測の診断を維持。編集開始失敗も診断へ記録する。タイムアウト3秒／送信後合計10秒／全体20秒、結果不明後の読み取り専用観測上限30秒、UI復元、自動再送禁止は変更なし。以下の過去記録にある「結果不明の案内」は当時の仕様であり、現在は製品画面に出さない。

関連20件PASS（15件＋5件）。構文確認content.js / tests/browser.test.js PASS。通知の出現待機に依存していた既存テストを、開発用の失敗診断と通常表示への復帰・無通知を確認する期待値へ更新。

確認範囲：英語での対象不一致・曖昧さ拒否、例外4経路、要素欠落と再試行、全体watchdog、dialog未出現、保存結果不明でも通知なし・成功トーストなし、未確認名を表示しないこと、明示的再試行まで保存1回、未変更・空白、ネイティブエラー時の復元、遅延結果の通知保護。

実Chrome・実ChatGPTでの今回の無通知動作は未確認。検証用Chromiumの結果と利用者の過去の実機確認を区別する。製品版番号0.1.33維持。他の拡張・公開成果物は変更なし。

---

## 2026-10-22 名前変更失敗時の復元強化（0.1.33維持）

### 調査・修正

既存は各待機3秒、送信後の確認合計10秒、結果不明後の読み取り観測は送信から30秒。finallyで復元する設計だったが、保存開始の表示・診断準備がtryの外にあり、例外時にrenamingが残る経路を確認。編集開始後の寸法測定例外でも編集状態が残り得た。またfinally内の復元前診断が例外になるとreleaseQuietに到達せず、表示抑制が残り得た。waitForのObserver開始例外でもタイマー等を解除できない構造だった。

表示準備をtry/finally内へ移動し、編集開始失敗でもendEdit。待機資源を登録・解除し、Observer開始例外でもfinishする。診断・抑制解除・編集解除・UI状態更新を独立した後片付けとして実行。抑制解除中の診断例外も復元を妨げない。処理全体20秒のwatchdogを追加し、各待機の期限も全体期限に制限。残ったネイティブ画面を勝手に閉じない。古い処理のエラーは別チャットへ表示しない。

### タイムアウト

- 各メニュー・dialog・保存可能状態の待機：最大3秒。
- 保存送信後の名称更新＋所有画面終了：合計最大10秒（従来維持）。
- 名前変更処理全体：最大20秒。イベントループ停止中の実行時刻は保証できない。
- 結果不明後：既存の読み取り専用観測のみ送信から最大30秒、500ms間隔。操作・再送・表示抑制なし。新規編集・遷移・言語変更で停止。全体処理の終了後もこの有限観測だけは意図的に残す。

### 検証結果

関連するユニーク32件が最終的にPASS、content.js / tests/browser.test.jsの構文確認PASS。全件テストは実行していない。追加10件（初期測定例外、診断開始例外、Observer開始例外、復元前診断例外、項目欠落、入力欠落、保存ボタン欠落、対象削除、全体watchdog、dialog未出現）で復元と明示的再試行を確認。

- 新規例外4件PASS。欠落等4件は再試行の検証を追加して再実行PASS。
- 関連25件は最初24件PASS、1件は遷移先に古いエラーを出さない仕様と旧期待値の不一致。期待値を更新し当該ケース再実行PASS。
- 遅延観測の期限・通知の保護・別チャットへの非干渉3件PASS。
- 実時間の3秒・10秒タイムアウト、読み取り観測の30秒上限（時計制御）、全体watchdogの発火（コールバックを試験で発火）を確認。20秒を実時間で待つ試験は未実施。
- 保存1回・結果不明通知・日英編集・対象外言語・IME合成イベント・言語変更時の抑制解除を維持。
- 後片付け後の診断finishedでbusy:false、activeWaits:0、observerActive:false、overallTimerActive:false、quiet:falseを確認。ネイティブdialogが残った例は可視状態へ戻し、テストで利用者のキャンセルを再現してから再試行。

実Chrome・実ChatGPTでの今回の異常系修正は未確認。以前の実画面の「固まったように見える」現象との因果関係は未確定。利用者による正常系実機確認は以下の過去記録として保持。版番号0.1.33維持。他拡張・公開用成果物の変更なし。

---

### 利用者による実機確認（2026-10-22報告、0.1.33）

利用者が実Chrome・実ChatGPTで次を確認しました。以下は自動テストとは別の実機確認記録です。

- 英語UI：タイトルの名前変更と保存が成功。
- 韓国語UI：タイトルをクリックしても編集を開始しない。
- 日本語UI：IME変換中のEnterでは名前変更を確定しない。
- 日本語UI：変換確定後のEnterで名前変更が反映される。
- 編集欄の外側クリックで名前変更が反映される。
- キャンセルすると元の名前が保たれる。

外側クリック・キャンセルの確認言語は報告で個別に指定されていないため、日英両方で確認済みとは扱いません。今回の報告は、再読み込み後の永続化、韓国語でのキーボード操作、その他言語・空／不明lang、処理中のlang変更や異常時の復元、すべてのIME操作の実機確認までは含みません。

今回の更新はREADME.mdとVALIDATION.mdの記録のみ。製品コード・版番号0.1.33は変更せず、自動テストは再実行していません。以下には過去時点の調査・未確認記録も履歴として残します。

---

## 2026-10-22 日本語・英語ネイティブ名前変更（0.1.33維持）

表示7言語を維持、ChatGPT側の名前編集はhtml.langのja/ja-*・en/en-*のみ。英語は利用者の実DOM（Chat actions / Rename / Rename chat / Chat title / Save / Cancel）が根拠。placeholder・Close dialogは観測済みだが選択には不要なため使用しない。nativeLabelsは拡張の翻訳辞書と独立。

製品修正はcontent.jsのみ。既存日本語テストfixtureのlangをjaと明示。関連テスト計17件PASS（14件＋追加3件）、全件再実行なし。content.js / tests/browser.test.jsの構文確認PASS。

- 日英のクリック編集、Enter／外側クリック確定、キャンセル、対象チャットだけへの保存。
- その他5言語、空・不明langはマウス・Enter・Spaceで編集せず、role・Tab対象・編集aria-labelを除去。文字選択可能。
- 実i18nモジュールでポップアップ7言語を切替え、ChatGPT側の編集可否と独立することを確認。
- 編集中・メニュー待機中・入力反映後保存直前のlang変更で保存せず中止。
- 送信後のlang変更でも保存1回のまま所有ダイアログを可視・操作可能に復元し再送しない。
- 対象重複、ARIA不一致、入力名不一致、Rename項目重複を拒否。既存の保存ボタン所属変更の拒否も維持。
- 英語での正常保存中のダイアログ・背景抑制、既存日本語の抑制、IMEイベント順序3ケースの回帰PASS。

初回の検証では、残るネイティブモーダルによって帯通知が退避するため、エラー通知の可視性待機を中断。テストを通知内容と終了状態の確認へ修正して再実行PASS。製品のモーダル退避は変更していない。

以上の17件はPlaywright/Chromiumの検証用画面・合成IMEイベントによる確認です。その後の利用者による実機確認は冒頭に別記しています。未知のネイティブDOM変更や、報告範囲外の実操作は未確認です。過去の診断completeは保存成功の証明とは扱わない。版番号0.1.33を維持、他拡張・公開用成果物は変更なし。

---

# 0.1.33：ネイティブ名前変更UIの7言語調査（診断のみ）

現在フォルダcolors-for-chatgpt、Git管理なし。既存製品コード・版番号・翻訳・storageを保持。README、既存検証記録とcontent.jsの名前変更処理を照合した。

## 確認した依存

日本語の固定照合は、actionSelectorの「チャットのアクション」、メニュー内の「名前を変更」、h2「チャット名を変更」、input aria-label「チャットのタイトル」、type=submitかつ「保存」、type=buttonかつ「キャンセル」。これらは拡張の表示言語とは独立している。

言語非依存の根拠として、現在URLとリンクのチャットID一致、単独行の候補数、動的aria-controls/aria-labelledbyの相互対応、menu/dialog/formのroleと構造、入力欄の元の名前照合、submit所属form、保存後の名称更新・dialog終了確認を既に使用している。ただしこれらだけではメニュー項目が名前変更か削除等かを保証できないため、文言判定を無条件に外さない。

## 各言語の状態

- 日本語：利用者提供の実DOMと過去の実画面成功報告あり。現在の実画面は再確認できていない。既存実装を維持。
- 英語：今回実ChatGPTで未確認。模擬DOMのRename/Chat title等は診断テスト用で、製品に採用する根拠ではない。
- 韓国語・簡体字中国語・繁体字中国語・スペイン語・ブラジルポルトガル語：実表記・DOM未取得、製品登録なし。

利用可能ツールにログイン済みブラウザ接続なし。computer-use SKILL.mdを読み、必要なnode_repl/sky実行ツールが現在のセッションにないことを確認した。非公開API・認証取得・OS独自操作へ迂回せず、実UI未確認として扱う。7言語対応の製品実装は保留。

## 追加と検証

読み取り専用diagnostics/native-rename-ui.jsと手順NATIVE-RENAME.mdを追加。ユーザーが現在チャットのネイティブメニューを開き、診断実行後に名前変更項目を手動で選ぶと、動的ARIAの対応と実文言を2段階で記録する。最大30秒/40サンプル、曖昧な行・遷移・終了で監視とタイマーを解除。自動クリック、入力、保存、storage、通信なし。本文・input.value・ページ全体HTML・生IDを出力せず、現在名は出力の伏せ字用にだけ読む。

node --check合格。Chromium模擬画面の4ケース（メニュー→dialog採取、重複候補の中止、期限、遷移）PASS。全ケースでclick0、個人名/入力値/ID出力なし、終了後の記録不変を確認。実ChatGPTの英語UI確認や名前保存成功を意味しない。製品コード無変更のため既存名前変更・Enter・外側クリック・キャンセルの全件再実行はしていない。

次は英語1件の実診断を確認し、対象行/メニュー項目/見出し/input/submitの対応を特定してから製品への対応と回帰検証を進める。他の拡張・サンプルA・カタログを変更せず、commit/push/ZIP/公開なし。

---

# 0.1.33：フォルダ名変更後の参照確認

現在の作業場所は `<workspace>\colors-for-chatgpt`。旧フォルダは存在しない。Git管理はなく、未コミット差分は取得できない。対象・祖先のAGENTS.mdは見つからなかった。既存ファイルを保持して確認した。

対象内の旧フォルダ名・旧絶対パスを検索。READMEの現在の導入手順2か所だけを新フォルダ名へ更新。package.jsonのnameは非公開npmパッケージの内部名で、ディレクトリ参照ではないため保持。VALIDATIONの過去の作業場所・提供ZIP名、テストログの過去のスタックトレースは変更しない。

manifestのpopup/content scripts/iconsは相対参照。テストは__dirnameからルートを解決し、翻訳生成スクリプトも自身のファイル位置を基準としている。実行用ファイルに旧パス依存は見つからなかった。manifest/packageは0.1.33、storageキー・メッセージ名・ホストID・アイコン画像を変更していない。

manifestのJSON・参照ファイル存在、ローカル依存の解決、変更がREADME/VALIDATIONのみであることを確認。全件テストは未実施。外部フォルダ/Chromeプロファイルは網羅検索していない。利用者のChromeで新フォルダが読み込み先として登録されているか、拡張IDと保存設定が維持されているかは未確認。拡張IDを固定するkeyの追加や、設定の移行・削除は行っていない。

---

# 0.1.33：ポップアップ下部の表示調整（版番号維持）

marusin toolsを左、manifestから取得した`ver 0.1.33`を右に同一行で表示。footerの上余白を18→10px、上paddingを12→8pxへ縮小。既存HTMLは版番号固定文字列だったため、popup.jsでchrome.runtime.getManifest().versionを取得する形へ修正した。リンクURL・青色・hover下線・focus枠・target/relは維持。設定保存や既存機能の処理は変更していない。

該当表示のブラウザテスト1件で7言語を確認：左右端配置、同一行、横はみ出しなし、manifest版番号、URL/new-tab/rel、hover/focus表示がPASS。tests/popup-footer-033.pngを目視確認。popup.jsと変更テスト2ファイルの構文確認もPASS。ログはtest-popup-footer-033.txt。全件テストは実行していない。実Chromeツールバーのポップアップでの利用者確認は未実施。

---

# 0.1.33：7言語・ポップアップ下部

開始版0.1.32。既存状態をaudit-033-before.jsonに記録。対象フォルダ以外は変更なし。

## 参照した実装

<workspace>/chatgpt-enter-key-control のmanifest.json（1.3.5、default_locale=en）、popup.js（FORCE_LANGS、getForcedLang、loadForcedMessages、getMessage、setupLanguageSelect）、popup.html、_locales/en/messages.jsonを読み取り。en/ja/ko/zh_CN/zh_TW/es/pt_BR、自動＋手動、手動辞書不在時のchrome.i18nへのフォールバックを確認。隣接claude-enter-key-control/gemini-enter-key-controlの列挙とdefault_localeも一致。ファイル変更なし。

## 実装と境界

Chrome標準_localesを導入しdefault_locale=en、manifest説明をメッセージ参照に変更。translations.tsvから7辞書とJSバンドルを生成する。popup/content scriptは同梱辞書を使用し、Chrome i18nのlocaleCodeで自動言語を取得。手動選択は既存キーとは別のthread-colors:v1:language。参照元はpopup localStorage方式だが、帯にも反映するためstorage.localで共有する。未対応の選択値は自動へ、未対応Chrome言語は英語、欠落した個別メッセージも英語へフォールバック。

static文言・aria/title属性とdynamic通知を翻訳。ユーザー名・入力値は翻訳関数へ渡さない。lang属性はpopup文書と拡張ホストだけに設定。初回は言語読込み後にcontent初期化し、既存寸法の初回表示ゲートも維持。翻訳にページ全体の監視は使わない。名前変更の日本語ネイティブセレクターは固定のまま、辞書とは独立。英語等のChatGPTネイティブUIへの対応追加はしていない。

ポップアップリンクはmarusin tools、作者名のみを削除し版番号維持。帯リンクは従来の意味の翻訳。長文言語に備えて設定ボタンの幅上限・折返しとタイトル左右の予約幅を調整し、中央位置を維持。

## 実施した関連検証

- test-i18n-033-final.txt：22 PASS（新規i18n9件＋既存popup関連13件）。
- test-i18n-033-extra.txt：英語ケースへ結果不明/タイムアウト復元を加え、言語のライブ切替を追加して2 PASS。
- test-i18n-033-lang.txt：読み上げlang属性反映後のライブ切替1件PASS。
- test-ime-033.txt：既存の独立Enter/キー解放順序/229の合成IME3件PASS。
- 重複を除く26件。無関係の全件再実行なし。

辞書7言語のキー集合・非空・置換トークン一致・生成物一致・権限storageのみ・版番号を確認。現時点の文言に動的置換トークンはない。各言語でpopup、リンク/rel/キーボードフォーカス、メニュー/使い方のEnter展開、ariaラベル、編集中値、キャンセル、空白エラー、中央更新中表示、保存成功を模擬画面で確認。

各言語で日本語ネイティブUIを模したメニュー→dialog→保存1回→名称更新を実行。英語のnative triggerへ差し替えたときはクリックせず安全に中止。英語表示で保存結果不明の通知・再送なし・タイムアウト時のdialog表示復元を確認。言語切替でチャット名や入力値（辞書の日本語と同じ文字を意図的に使用）が変わらないことを確認。

幅390px/320px、帯高88px/40px、文字36pxで設定ボタンの画面内収まりとメニューscrollWidthを検証。tests/i18n-033-es.pngを目視し、長いエラーが折返して操作を隠さないことを確認。Chromiumで実拡張を読み込み、模擬ChatGPT上のpopup個別ON・全体OFF・storage権限・再起動保持も既存テストで確認。

node --check：i18n.js/i18n-data.js/content.js/popup.js/diagnostics/tooltip-layout.jsおよび変更テスト。7辞書とmanifest/package JSON、0.1.33、生成再実行時の一致も確認。

## 未確認

実ChatGPT本体（日本語・英語等すべての組合せ）、実Windows IME、実スクリーンリーダーによる読み上げ、実200%ブラウザズームの7言語画面、ネイティブ話者レビューは未実施。狭幅の模擬検証を実ズーム確認とは扱わない。ツールチップ所有関係や他言語のネイティブ名前変更を、翻訳導入だけで対応済みとしない。ストア掲載文は対象外。commit/push/ZIP/公開なし。

---

# 0.1.32：文字色モード・個別OFFボタン

0.1.31を保持しaudit-032-before.jsonに既存状態を記録。対象フォルダのみ変更。

## 実装

共通appearanceの検証にtextMode=auto/vividのみを追加。custom/textColorは取り込まない。auto/vivid選択時に共通値を更新し、寸法更新時には既存の共通modeを保持する。書込み待ち・実行中の共有値も引き継いで、直後のcustom/寸法編集でmodeを失わないようにした。個別設定優先、非編集時の書込みなし、既存保存キーと権限を維持。

左端に40×40pxのbuttonを絶対配置。aria-labelは「このチャットの帯を非表示」。左右の既存予約幅内に収まり、タイトル中心を動かさない。既存displayキーだけをfalse保存し、storageイベントで帯・枠・レイアウト・tooltip補正を解除。同一チャットの別タブに反映。処理中の連打を無効化、失敗時は通知して再操作可能。イベントはhost内のため外側クリック確定に入らない。

名前変更の保存前の個別OFFは従来どおり中止。送信済みの場合は個別OFFだけを理由に結果確認を中断しないようguardを限定変更し、保存1回、10秒上限、エラー/遷移時の解除を維持。OFF中は成功通知を出さない。所有ダイアログの抑制・復元は既存finally経路を利用。

リセットは文字列のみ変更。既存change(C.settings(null,id))の呼出し・対象を保持。

## 検証（関連10件）

- individualの031/032関連6件PASS：auto/vivid共有、custom・手動色除外、寸法編集時の共通mode保持、個別手動色優先、読込み/ON-OFFで共通値不変、遅延初回描画、別タブ、×で補正解除、390px幅の中央配置・40px操作範囲・Enter操作、設定保持。
- browserの新規2件と既存mode/reset1件PASS：編集中の×で保存0回。送信後に×を押しても保存1回のまま名称更新とdialog終了まで確認。保存エラー時はnative dialog/背景を操作可能な表示へ戻し、帯はOFF維持。
- tooltip新規1件PASS：補正済みtooltipが存在する状態で×を起動し、translateとbody配置を解除。
- 初回テストでは参照行の順序に依存したassertと、storageイベントを発火しないtooltip用mockを修正。エラー時の背景は既存1秒transitionで復元されるため、style復元とtransition終了を確認するassertに修正し、該当ケースのみ再実行PASS。
- ログ：test-032.txt、test-032-tooltip.txt、test-032-rename.txt、test-032-error-final.txt。全件テストは実施していない。
- node --check：content.js、diagnostics/tooltip-layout.js、変更した3テスト。manifest/packageのJSONと0.1.32整合を確認。

## 未確認

実ChatGPTでの×・名前変更中のOFF・共通モード引き継ぎは利用者確認待ち。テストは模擬DOM/storageと合成操作で、実画面の解消を断定しない。他の拡張・サンプルA・カタログの変更、commit/push/公開なし。

---

# 0.1.31：共通の見た目初期値

開始版0.1.30、既存状態をaudit-031-before.jsonに記録。Git管理なし。対象フォルダのみ変更。

## 項目と保存方針

現行の編集可能な寸法はheight（40〜88）、fontSize（18〜36）、border（0〜12）の3項目。共通値はこの3つだけを既存settingsの数値検証・丸め・上限下限で正規化する。alignmentは中央固定、color/textMode/textColorとON/OFF、名前は対象外。

新キーthread-colors:v1:defaults:appearance（コロンを含みチャットIDと衝突しない）を追加。寸法入力またはリセット時のみ、チャットの個別設定と共通寸法を同じstorage.setに含める。後続の色編集がキュー中の寸法更新を落とさないよう共通値を保持。読込み・閲覧・ON/OFFでは保存しない。既存チャットの一括書換えなし。個別設定が存在する場合は従来の欠損項目補完を維持。

共通読込みとチャット設定を両方待ってからchatReadyを立てる。先に届いたstorageイベントを古い読込み結果が上書きしない。読込み中に届いた個別設定は保留して、共通値も揃ってから適用。共通値の更新は未保存チャットだけに反映し、保存済みの別チャットを変更しない。読込み失敗時は仮の寸法で表示しない。

## 関連検証

- tests/individual.test.js：既存10件＋追加4件＝14 PASS（test-appearance-031.txt）。キーをチャットIDと衝突しない形式に確定した後、追加4件のみ再実行して4 PASS（test-appearance-031-final.txt）。
- tests/browser.test.jsから設定保存・読込み・切替・別タブ・旧設定・失敗の10件を選択して10 PASS（test-storage-031.txt）。重複を除く関連24件。全件テストは実行していない。
- 新しい未保存チャットで寸法を継承し、帯色・文字色mode・ON/OFFは引き継がない。個別設定未作成のまま。閲覧・切替・OFF→ONで共通書込みが増えない。
- 既存の部分設定が優先され、旧補完値を維持。色・文字色モードの編集では共通値不変。
- 共通読込みを200ms遅延させ、別タブ更新を先に発火。可視フレームすべてで88px/36px/12px、仮サイズの描画なし。
- 共通値の型・範囲検証、未保存チャットへの別タブ反映、保存済みチャットへの非干渉。保留書込みと遷移、古い読込み結果、保存失敗も確認。
- node --check：content.js、diagnostics/tooltip-layout.js、tests/individual.test.js。manifest/packageのJSONと0.1.31整合を確認。

## 未確認

実ChatGPTでの初回表示と別タブ反映は未確認。模擬画面とstorage模擬実装の結果であり、実画面での確認とは区別する。ツールチップ・IME・名前変更・popup動作の実装は変更せず、無関係の全件再実行を省略。他の拡張・サンプルA・カタログの変更、commit/push/公開なし。

---

# 0.1.30：ポップアップの見た目と切替操作

開始版0.1.29。Git管理なし、既存変更はaudit-030-before.jsonに記録。対象フォルダのみ変更。

## 実装

青色リンク（#1459bd）、hover/focus-visibleの下線・フォーカス枠。Colorsは16px/800、各文字を濃い6色、for ChatGPTは500/単色。外部アセット・権限追加なし。名称の単一aria-labelは維持。

チェックボックスからネイティブbutton＋role=switch/aria-checkedへ変更。各行の右端、64×44px以上、ON/OFF文字。aria-labelledbyで行のラベルを参照し、個別には理由表示のaria-describedbyを付与。Enter/Spaceはネイティブbuttonの挙動を利用。

保存中はdisabled/aria-busyと実行中フラグで連打を阻止し、未保存の状態を先に確定表示しない。全体はstorageを再取得、個別はcontent scriptの状態を再取得。エラー時は保存状態と理由を表示する。個別の保存開始で読取り世代を更新し、遅れたpoll応答による再有効化を防止。開始時の個別ON・全体OFF・ID/タブ照合は継続。

## 検証結果

- tests/popup-029.test.js＋tests/popup-extension.test.js：12 PASS（test-popup-030.txt）。
- 古いpoll応答の競合対策後、その回帰テストを加えた030関連4件のみ再実行し4 PASS（test-popup-030-final.txt）。重複を除いた関連13件が合格。全件再実行なし。
- 遅延保存時の3連打でも書込みは各ボタン1回。成功後はOFF、保存失敗時はONを維持し理由表示。保存中の古い応答でdisabledが解除されないことを確認。
- Enter/Space、role/aria-checked/ON-OFF文字、クリック範囲、タイトル文字サイズ・太さ、青色リンク・hover/focus下線を検証。tests/popup-030.pngの途中ではなく安定後の画面を目視確認。
- 個別自動ON、手動OFF保持、全体OFF維持、IDなし、対象切替、保存失敗時の再試行なし、模擬ChatGPTを読み込む実拡張環境でstorage権限・設定再起動保持を確認。
- node --check：popup.js、content.js、diagnostics/tooltip-layout.js、変更したpopup/individualテスト。manifest/packageのJSONと0.1.30整合を確認。

## 未確認と維持範囲

実ChatGPT上でChromeツールバーから開くポップアップの利用者確認、実スクリーンリーダーでの読み上げは未確認。ブラウザ自動検証は模擬ページ。ツールチップ、IME、初期表示、入力欄、名前変更の実装は版番号以外変更なし。他の拡張・サンプルA・カタログを変更せず、commit/push/ZIP/公開は行っていない。

---

# 0.1.29：ポップアップとIME Enter

開始版0.1.28。Git管理なし、作業指示AGENTS.mdなし。audit-029-before.jsonで既存状態を記録。対象フォルダのみを変更。

## 実装・原因

ポップアップの名称を16px、独自6色、h1の単一aria-labelと装飾文字のaria-hiddenで表示。2つのラベルを別行にし、長文説明と通常保存通知を撤去。必要時のみ短い案内を表示。ストアリンクは帯と同URL、target=_blank、rel=noopener noreferrer。版番号/marusinを控えめに配置。スクリーンショットtests/popup-029.pngでも確認。

default_popupとstorage権限だけを継続。初回取得のtab/idを固定し、readyになるまで同一対象を確認。個別ONは1回だけ、既にONは書き込まない。個別OFFに戻した後のpollでは再ONにしない。保存直前のactive tab照合とcontent script側のURL/id照合を使用。色設定キーは変更しない。新規画面・対象外・遷移・エラーで自動再試行しない。

帯inputのcompositionendで解放フラグを再設定していたこと、および終了後80msの時間条件によって独立Enterを拒否し得たことをコードで確認。キー解放後は時間による拒否をせず、compositionendがkeyupより後でもフラグを再設定しない。composition中/229は保存しない、未解放/リピートも保存しない。Enterのlistenerは帯inputとタイトルにだけ存在。documentのkeydownは設定メニューのEscape処理のみで、本文Enterを妨げない。外側クリックのIME確定との混同防止は変更していない。

## 実行した関連検証

- popup-029、popup-extension、individual：19件のうち初回18 PASS。実拡張テストがpopupを通常タブとして先にactiveにしていたため、自動ONの対象が異なり1件失敗。実際のaction popup同様に元のChatGPTタブをactiveにした状態で初期化するfixtureに修正し、その1件のみ再実行PASS。最終19件合格。
- browser.test.jsをIME/composition/外側クリック/キャンセル/未変更関連に絞り11 PASS。旧期待値の「キー解放後の独立Enterも捨てる」を削除して再検証。新規3件は同じJSタスク内（80ms待機なし）でcompositionend→keyup、keyup→compositionend、Unidentified/229を再現し、その次のEnterで保存1回を確認。
- 実Chrome拡張読み込み＋模擬ChatGPT画面：権限storageだけ、active tab対象、個別ON・全体OFF・新規画面、設定再読み込みと保持を確認。
- 模擬popup：全体OFF中の個別ON、手動OFF維持、既存ON書込みなし、IDなし、タブ/チャット切替、保存失敗で再試行なし、読込み中遷移、ラベル・リンク・配色を確認。
- 設定：別タブ反映、色保持、遅延読込み、初回OFF、保存対象照合等を確認。全件テストは実行していない。
- 構文：content.js、popup.js、diagnostics/tooltip-layout.js、変更したテスト。manifest/package JSONと0.1.29整合を確認。

ログ：test-popup-029.txt、test-popup-029-real-recheck.txt、test-ime-029-final.txt。初回の旧期待値によるIME失敗ログtest-ime-029.txtも保持。

## 未確認

実Windows IME・スクリーンリーダーによる読上げ・実ChatGPTでのアイコン操作は未確認。IME検証は合成イベントであり、実際の変換確定→キーを離す→次のEnterで保存1回を利用者に確認いただく。本文送信での3回Enter現象の原因は本コードでは確認できていない。ツールチップ等の無変更領域の全件再実行は省略。

---

# 0.1.28：Workフォルダの直接ARIA参照

開始版0.1.27。既存状態はaudit-028-before.jsonに記録。Git管理なし。対象フォルダ以外は変更していない。

## 事実・修正・未確認点

利用者診断：span role=img自身のaria-describedbyがtooltipを1件参照し、拒否理由はtrigger-not-buttonのみ。spanはx356/y96/36×36、tooltipはtop/y62.5〜92.3で帯に重なる。コードもbutton/role=buttonだけを選ぶため、同じ構造で除外されることを確認した。

説明対象とクリック対象を区別し、span[role=img]の直接参照を限定追加。上部範囲・可視性・参照一意性・既存portal条件を検証する。祖先button/説明参照、別参照元、重複ID・トークン・複数tooltipは拒否。wrapperへの参照拡張は従来どおりbuttonにだけ適用する。role変更やクリック追加はない。通常時の監視追加なし。新しい競合参照検索は操作中の最大4参照に限定する。

診断コードもrole=imgの説明対象を認識し、祖先や別参照元との競合・非表示を理由に記録する。本文・タイトル・入力値を収集しない方針は維持。

## 関連検証

- tests/tooltip-overlap.test.js、tests/tooltip-diagnostic.test.js：既存25件＋新規2件＝27 PASS（test-tooltip-028-local.txt）。その後追加した診断1件のみ実行し1 PASS（test-tooltip-028-diagnostic.txt）。合計28件。全件テストは実行していない。
- 実測座標のspan（36×36）と内側SVG（20×20）を再現。tooltip初期y62.5からspan下端+6＝138へ移動。role=img/tabindexなし/クリック0を維持。
- hover終了・全体OFF・個別OFF・tooltip除去で補正を解除。安定後300msのtooltip style更新0件。
- 重複ID、競合参照元、複数tooltip、参照重複、祖先参照/ボタン、hidden/inert/opacity:0、単なるspan/div role=img、wrapperだけの参照、本文・メニュー内を拒否。
- 既存の概要直上span（hover/focus、寸法0のラッパー）、共有等のbutton、狭幅・左右端・復元・ループ防止の関連テストもPASS。
- node --check：content.js、diagnostics/tooltip-layout.js、変更した関連テスト3ファイル。manifest/packageのJSONと版番号整合も確認。

実Workモードの表示は未確認。フォルダと概要が下側に表示されること、共有・その他等の既存表示を利用者に確認いただく。模擬PASSを実画面での解消とは扱わない。名前変更等の無変更領域の全件再実行は依頼に従って省略。

---

# 0.1.27：概要の直上span参照への限定対応

開始版0.1.26。Git管理なし、既存状態をaudit-027-before.jsonに記録。対象ディレクトリのみ変更し、旧設定・内部識別子・storage権限・適用サイトを維持。

## 確定した原因と修正範囲

利用者の実測ではbutton ref:1の直上span ref:2がtooltip ref:3をaria-describedbyで参照（depth:1）。button自身の参照はなく、旧コードはそこで終了していた。tooltipはtop、62.5〜92.3pxで0〜88pxの帯と交差。今回の変更はこの参照取得の不足への対応であり、body高さ・z-index・overflowは変更しない。

ボタン自身と、唯一の要素子としてそのボタンを持つ直上spanだけを確認。追加のbutton/role=button/link/input/tabindex等の操作要素がないこと、spanに操作用role/tabindex/contenteditableやhidden/inert等がないことを検証する。role=presentation/noneの非操作ラッパーは許可。他のtagやさらに上の祖先は使わない。寸法は常に実ボタンを使用する。

参照トークンの重複、複数のtooltip、参照IDの欠落/重複要素は拒否。ID検索は対象操作中の最大4参照に限定し、全要素の列挙や新たな常時探索/位置測定はしない。既存MutationObserverで直上参照や子要素の変更時に再確認し、同一バッチ内の参照取得を再利用する。複数ボタンが追加されれば補正を解除する。新しい監視・タイマーは追加していない。

本文/メニュー/モーダル除外、上部範囲、tooltipのポータル/位置条件、左右端補正、下側の既存配置保持、OFF時の復元を継続。名前変更・IME・初期表示・色設定・入力欄のコードは変更していない。

## フォルダの未確定部分

buttonRef:nullで、フォルダhover時の関連付けは未採取。現行製品はbutton/role=button以外をトリガーにしない。旧診断のrole列挙ではlink/tab等はotherになるため、標準roleの列挙を拡張し、模擬role=linkの実値が記録されることを検証した。実フォルダがlinkだと断定していない。未知roleはotherのままとし、全spanやアイコン名による恒久的な判定を追加していない。必要な追加情報はWorkモードのフォルダ1件だけ。診断手順はdiagnostics/TOOLTIP.md先頭に記載。

## 検証

**関連25件PASS / 失敗0 / スキップ0**。実行は `node --test tests/tooltip-overlap.test.js tests/tooltip-diagnostic.test.js`（約21秒）、ログはtest-tooltip-027-final-local.txt。変更したJSの構文チェックとmanifestの版/権限確認もPASS。

今回の追加4テスト：寸法0の直上spanをhover/focusの各経路で補正しボタン下+6pxとなること、参照削除/再設定/個別OFF時の復元、複数ボタン/外側祖先/競合参照/重複参照/重複ID/操作用wrapper/非buttonを拒否すること、後から別ボタンが追加された際の補正解除。関連する既存テストで、複数の上部ラベル・帯40/88px・狭幅/200%相当viewport・キーボードフォーカス・既に下側・本文/メニュー/モーダル除外・hover終了/遷移/OFF復元・送信ボタンの表示範囲・補正循環がないことを確認。全件テストや遅延保存の再試験は指示どおり実施していない。

模擬画面の合格と実Workモードの解消確認は別。概要は利用者の実確認待ち、フォルダは未対応・診断待ち。通常モードに吹き出しを新設していない。0.1.25で利用者が確認した名称/個別表示/yの下端/今回の入力スクロールの良好な結果を維持するが、重さ全般の解消とはしていない。

README・版番号を0.1.27開発候補へ更新。変更一覧はaudit-027-changes.json。Git diff --checkはGit管理なしのため不可。構文・末尾空白・競合マーカー・変更一覧・権限境界を確認。他拡張・サンプルA・カタログの変更、commit/push/ZIP作成/公開はなし。

---

# 0.1.26 開発候補：名称とWorkモードの限定診断

## 監査・確認済みの事実

対象は `<workspace>\chat-thread-colors`。開始版0.1.25、名称Chat Colors for ChatGPT。Git管理なし。先祖/対象のAGENTS.mdは見つからず、開始ハッシュをaudit-026-before.jsonへ記録。従来の作業を保持し、権限storageのみ、適用chatgpt.comのみを維持した。

利用者は0.1.25でポップアップ名称、全体ON＋個別ON、末尾yの文字下端を実確認済み。今回の入力・スクロールで引っかかりは気にならなかったが、重さ全般の解消とはしない。共有・その他は下側、Workモードの概要/フォルダは上側で隠れる。通常モードで確認範囲のフォルダ吹き出しは出ていない。

## 調査結果と未確定部分

correctTooltipは最寄りbutton/role=buttonをトリガーにし、その要素自身のaria-describedbyから一意のrole=tooltipを取得する。body直下またはbody > display:contents > tooltip、offsetParent=body、position=absolute、pointer-events:none、上部範囲等の条件を確認する。本文/メニュー/モーダルは除外する。

SVGのuse参照先はボタン/tooltipの対応を証明しない。今回、ボタン本体・ARIA・吹き出し本体の実DOMは未取得で、どの条件で概要/フォルダが外れているかは未確定。接続可能なブラウザも確認したがapps/browsersはいずれも0件で、こちらから実WorkモードのDOMを参照できなかった。現在のトリガー/ARIA/可視候補の取得条件が違い得ることはコードで確認したが、実原因を推測で確定していない。

補正処理は変更していない（content.jsは診断の版表示のみ更新）。body/z-index/overflow/方向固定、複製、親変更、新しい吹き出しの作成は行っていない。共有・その他の動作を保持し、未対応Workツールチップは実診断待ちとする。

## 実装

製品の現在名称をColors for ChatGPT、版番号を0.1.26開発候補へ更新。manifest/action、popup、READMEを変更。内部ID・フォルダ・保存キー・設定はそのまま。

既存tooltip-layout診断をv3へ拡張。明示実行時にだけ提供されたuse末尾を概要/フォルダの手掛かりとして一度探索。ボタン祖先、各祖先のARIA参照、候補の同じ親にある可視要素/読み上げ要素を数値参照で記録する。祖先ARIAと直接のdescribedbyを区別し、候補を所有関係の証拠とはしない。

10秒準備・6秒観測、use探索512要素/8候補、上部トリガー4件、候補24件、ARIA関係64件、変更スナップショット25件の上限。サンプル内の同じ要素の矩形/スタイルは再利用。終了/遷移/再実行/pagehideで解除。クリック・入力・保存・通信・スタイル変更なし。本文/タイトル/入力値/tooltip文言/アセットURL/ハッシュ/ID文字列/全HTMLなし。通常時の監視/探索/測定は増えていない。

## 検証

**199件PASS / 失敗0 / スキップ0**（既存197件＋追加2件）。全件ログはtest-suite-026-local.txt、所要約393秒。診断単体11件もPASS。content.js、popup.js、診断・テストスクリプトの構文チェックもPASS。

追加2件は、(1)概要SVG＋ボタン祖先ARIA＋読み上げtooltipの可視兄弟要素、(2)フォルダxlink＋非buttonトリガーで、理由・関連構造を採取し、私的文字列やアセットを出さずページを変更しないことを検証。既存の準備時間・遅延出現・hover/focus・ON/OFF・終了時解除テストも維持。製品名/版番号を検証する2テストファイルの期待値だけ今回の名称/版に合わせた。

模擬DOMで診断が動作することと、実Workモードで配置が直ったことは別。今回、実Workモードの解消は確認できておらず、配置問題自体も未修正。追加で必要なのは概要1件の、SVGからボタン祖先、ARIA参照先、可視候補の位置/親構造。利用者が手作業で要素を探す必要はない。手順はdiagnostics/TOOLTIP.mdの先頭を参照。

変更一覧・SHA-256はaudit-026-changes.json。Git diff --checkはGit管理がないため利用不可。代わりに構文・空白・競合マーカー・権限境界・変更一覧を確認。他拡張/サンプルA/カタログの変更、commit/push/ZIP作成/公開はなし。

---

# 0.1.25（仮）開発候補：開始監査・実装・検証

## 開始監査（2026-10-21）

- 対象絶対パス：`<workspace>\chat-thread-colors`。manifestを確認でき、対象は一意。
- 開始版0.1.24、名称Chat Thread Colors。Git管理なし。`git status --short`、branch、HEADはいずれもnot a git repository。追跡差分/未コミット状態はGitでは判定できない。以前の作業成果が存在する状態をそのまま基準とし、初期SHA-256一覧を `audit-025-before.json` に記録。先祖ディレクトリと対象内に適用対象のAGENTS.mdは見つからなかった。
- manifest V3、permissionsはstorageのみ、host_permissionsなし、chatgpt.com HTTPSのみ・トップフレーム・document_idleでcore.js/content.js。サービスワーカーやローカライズ構造なし。
- 全体表示は `thread-colors:v1:enabled`、各チャットの色・寸法等は `thread-colors:v1:<id>`。既存検証済みのURLパーサー、600msの可視時ルート確認、storageイベント、読み込み世代判定を継続。
- 帯ホストはbody外。非表示時にはホストとページ側の予約領域を解除。起動時は設定取得完了まで非表示。入力欄と固定サイドバー保護のbody補正は維持。
- 色選択inputは64×34pxの可視領域。親はlabelではなくcolor-row。行全体からカラーピッカーを起動する処理はない。既存の回帰テストを継続。
- 0.1.24のツールチップはボタンのARIA対応・限定ポータル構造を確認する実装。概要・フォルダの実DOM確認は未完了。診断と既存制約を保持。

## 指示の照合・設計判断

「個別ONにした会話だけ表示」に従い、旧色設定だけが存在するチャットも個別OFFとする。これは従来の全チャット表示からの明示的な仕様変更であり、保存データの削除/上書き移行はしない。ONにすると以前の色を使用できる。重大な権限変更、データ破壊、安全確認の緩和は必要なかった。

「既存の左右配置」は現在の画面基準中央配置、「折り返し」は既存の1行省略と全文確認を維持するものとして扱った。旧left/right設定の復活や複数行表示は追加しない。

個別設定は色設定とは別キー `thread-colors:v1:display:<id>`、trueだけをONとする。型不正・未設定はOFF。個別読み込み用の世代を別に設け、遷移やstorageイベントで古い読み込みを無効化。全体OFFは個別キーを変更しない。新規画面や対象外URLでは保存を拒否する。個別OFFでは未保存の編集を終了し、保存中は既存のOFF中止経路で抑制を復元する。再送は行わない。

非表示の帯からは操作できないため、ポップアップへ個別スイッチを配置。chrome.tabsからは現在タブのIDだけを取得し、そのcontent scriptがURLから対象を検証する。送信元拡張ID・要求型・対象ID・booleanを検証し、古いポップアップ対象への保存を拒否。開いているポップアップのみ600msで対象を更新し、pagehideで解除。ページの通常監視は増やしていない。

Chrome公式Tabs APIに記載された権限不要のquery/sendMessageを使用。実際の拡張読み込みテストでもstorageだけで動作した。tabs/activeTab/webNavigation/host_permissionsの追加なし。チャットIDはローカル保存/拡張内通信だけで使用し、本文・タイトル・入力値の収集や外部送信なし。既存内部識別子/ディレクトリ/アイコンを維持しているため、名称変更による拡張ID変更は行っていない。

## 文字欠けの調査と変更

表示タイトルはoverflow:hidden・line-height:1.15・上下paddingなしだった。帯自体の高さを変えず、表示タイトルに上下0.15emの余裕、表示/編集/測定に同一のnormal行高を適用した。横方向の省略/全文確認/中心位置は維持。

旧CSSと新CSSで `g j p q y` を帯40px・文字36pxで撮影。検証環境の標準フォントでは旧CSSのyの欠けを確実には再現できず、実画面の原因確定とはしていない。確認できたCSSの切り取り条件を緩和する予防的な修正であり、実Windows/Chromeでの確認が必要。

4文字列×3文字サイズ×2帯高×2画面幅の48条件で、文字領域がCanvasの実グリフ上下幅を余裕付きで含むこと、帯高とfontSizeが指定値のまま、中央位置を維持することを確認。これは実画面の全フォントで欠けない保証ではない。結果 `tests/title-025-results.json`、比較画像 `tests/title-024-descenders.png` / `tests/title-025-descenders.png`。

## テスト結果

最終コードで **197件PASS / 0件FAIL / 0件SKIP**（既存183件＋追加14件）。全件実行ログ：`test-suite-025-final-local.txt`、所要約391秒。初回の既存183件も全件PASS。終了処理追加後に全件を再実行した結果が197件であり、対象を絞った実行結果の合算ではない。

実行：`node --test tests/*.test.js`（既存のCHROMIUM_EXECUTABLEを指定）。content.js / core.js / popup.jsとテストスクリプトの構文チェックもPASS。追加権限なしの実拡張テストは2件、個別状態/文字領域テストは10件、既存ブラウザ試験への個別OFF終了経路は2件。

既存テストのON状態を扱うfixtureに、個別ONの保存値を明示した。従来の検証assertion、timeout、試験の対象は維持。新しいdefault OFF仕様を隠すための自動ONを製品コードには入れていない。skipの追加なし。

追加検証：旧色設定保持、未設定/不正型OFF、全体優先、A/B独立、戻る/進む、再読み込み、複数タブ・同時更新、古い対象とIDなしの保存拒否、遅延読み込みと変更イベントの競合、読み込み失敗、初期フレームOFF、文字48条件。実際の拡張を読み込んだheadless Chromiumとポップアップページで、追加権限なしのメッセージ送受信、全体/個別切替、IDなし無効化、chrome.tabs.setZoomによる200%時の中央位置、同じ一時プロファイルでのブラウザ終了・再起動後の個別設定/色の復元を確認した。ページ内容は検証用HTMLであり実ChatGPTではない。

## 差分監査・未確認

最終の変更ファイル一覧は `audit-025-changes.json`。ソース変更はcontent.js/manifest.json/package.json/popup.html/popup.js、文書はREADME.md/VALIDATION.md。core.js、popup.css、既存diagnosticsは変更していない。既存テスト6ファイルに個別ONのfixture設定を追加し、browser.test.jsには個別OFF時の編集取消・保存中止の2テストも追加。さらに追加2テストファイルと画像作成スクリプト、結果/画像/監査記録を作成。テストによって既存の生成結果・画像も更新されている。

Git管理がないためgit diff --checkは実行できない（not a git repository）。代わりに変更したテキストの末尾空白・競合マーカー、構文、manifest境界、初期ハッシュとの差分一覧を確認。依存ライブラリの追加なし。対象外サイト・他拡張・サンプルA・カタログのファイル変更なし。commit/push/ZIP作成/公開なし。

実ChatGPTは未確認。利用者確認：同じフォルダで拡張を再読み込み後、(1)未設定チャットは帯なし、(2)ポップアップから個別ON、(3)旧色設定が復元、(4)別チャット/別タブ/全体OFFと復帰、(5)新規チャットのID確定前後、(6)ブラウザ再起動後、(7)各文字列と文字サイズ・200%表示、(8)名前変更/IME/画像ビューア/入力欄/上部ツールチップ。Windows IMEと実ChatGPTのUI連動は合成イベント/検証HTMLの合格と区別する。

概要・フォルダのツールチップ、読み込み時を含む重さ、実環境でのyの欠けは解消済みと扱わない。今回の版番号は0.1.25（仮）の開発候補で、実ブラウザ確認前の正式版確定は行わない。

---

# 0.1.24：上部ツールチップの下側配置と端補正

## 利用者報告・確認できた条件・未確定部分

利用者は0.1.23で「共有」「その他」が下側になり良好と確認。「概要の固定表示の切り替え」「フォルダ」は上側のままとの報告です。今回、上でも読めればよいという方針から、帯ON時の上部ボタンは下側へ表示する方針へ変更しました。

手元の実測DOMは共有のものだけです。0.1.23のコードには、tooltipが帯と交差しなければ補正を解除する条件と、左右が画面外なら補正しない条件がありました。帯直下で上向きだが帯には重ならないケースを再現し、旧条件では対象外、新条件では下側になることを検証しました。しかし、残る2ボタンが実際にこの条件で対象外だったと断定する証拠はありません。

ボタン自身のaria-describedby、候補1つ、body > display:contents > tooltip等の親構造、absolute／offsetParent=bodyの条件は維持しています。未確認の祖先ARIA、近隣tooltip、名前やアイコンから対象を推測する変更はしていません。computer-useによる接続確認も行いましたが、参照可能なブラウザ／タブは0件で、利用者の実ChromeのDOMをこちらから取得できませんでした。

## 実装内容

- 対応が確認できた上部tooltipは、帯との交差の有無にかかわらずボタン下へ配置。既に下側で画面内に収まるものは、その位置を保持。
- 左右に最低4px、色枠がそれより太ければ枠幅の余白を確保し、はみ出しを移動で補正。幅が大きい説明はmax-width・white-space・overflow-wrap・height等を一時適用して折り返し。表示文言を省略・置換しない。
- translateと幅・折り返しの各プロパティについて元のinline値とpriorityを保持。終了／OFF／モーダル／遷移時に拡張が書いたままの値だけを戻し、ページが新しく書いた値を上書きしない。
- 本文のarticle／data-message-author-role、メニュー、モーダルのボタンを除外。対応不明のARIAや別ポータル構造も操作しない。
- 折り返した結果が下側の利用可能な高さにも収まらない極端なケースでは補正を中止し、元に戻す。戻したstyleも自己更新として判別するWeakMapを用い、再補正→復元の循環を防止。
- 全DOMの常時探索・位置測定・タイマーは追加せず、既存の対象操作・関連変更時だけ確認。必要な幅変更後の測定は1回にまとめる。名前変更・入力欄補正・モーダル退避・設定保存は変更しない。

## 検証用画面

共有型の確認済みARIA・bodyポータル構造で、共有／その他／概要の固定表示の切り替え／フォルダ／検索／サイドバーの名称を使ったケースを検証しました。名称では分岐しません。これは6種類の実DOM構造を取得した検証ではなく、残る2ボタンが実画面でも適用される証拠にはなりません。

- 帯と非交差の上側でも下へ移動、下側はinline styleを変更しない。
- 幅390の両端、長い日本語・英数字・絵文字の折り返し、色枠12pxの内側への配置。scrollWidth／scrollHeightで文字の切り取りがないこととスクリーンショットを確認（tests/tooltip-024-wrapped.png）。
- OFF時にtranslate・max-width・height・white-space・max-height等を復元。
- 既存の帯40／88、幅1498／1388／390／749、キーボード移動、ネイティブtransform更新、モーダル・遷移時の解除を維持。
- 本文／メニュー／モーダル、候補重複・ARIA欠落・別親・独自translateを拒否。
- 幅補正中の自己style更新が安定し、極端に長い説明で高さ不足となった場合も更新が繰り返されない。

## 未対応2ボタンの診断

既存のtooltip-layout.jsをv2へ更新しました。ボタンだけでなくhover／focus中のARIA関連要素の構造を読み取り、ボタン自身の参照欠落、祖先に参照があるか、参照先tooltip件数、親構造・offsetParent、読み上げ専用らしい小さい要素等をassessmentsに記録。aria-labelledby／aria-detailsも診断内の連番として取得します。これらは診断の手掛かりであり、補正対象としての自動採用ではありません。

まず0.1.24の実画面を確認し、まだ上側に出る場合だけ概要（再現しなければフォルダ）の1件を採取します。全文を一度貼り付けると10秒準備＋6秒観測後、JSONをConsoleへ自動表示。追加のcopyコード実行は不要で、結果変数にも保持します。本文・タイトル・入力値・tooltip文章・実ID・HTMLは収集しません。追加測定は上限で停止します。手順はdiagnostics/TOOLTIP.md。

## テスト結果

全183件を実行し、初回は182件PASS／追加診断テスト1件FAIL（391.5秒、test-suite-024-local.txt）。既存178件はPASSです。失敗はテストがボタンを祖先で包み直して位置を変えた後、マウスが対象から外れたまま診断した準備不備でした。包み直した後に対象へフォーカスするよう修正し、最終ファイルのtooltip補正10件＋診断9件を再実行して全19件PASS（16.8秒、test-tooltip-024-final-local.txt）。追加5件もこの再実行でPASSしています。全体テスト実行中の枠幅・除外状態の再確認に関する変更も、この関連再実行に含まれます。全183件の単一実行が全PASSだったとは記録しません。content.js・診断・追加テストの構文確認も成功。実Chromeでの6ボタン全件の下側表示・ネイティブフォント・実200％拡大は未確認です。重さ調査は引き続き保留し、読み込み時を含む重さを解消済みとは扱いません。版番号・README・診断手順を0.1.24に更新し、他拡張・サンプルA・カタログ、commit・push・公開は扱っていません。

以下は過去の記録です。

# 0.1.23：上部ツールチップの帯との重なりを限定補正

## 確認した実測と未確定の部分

既存のON診断（20261020-052815）とOFF診断（20261020-055331）を読み直しました。添付は観測資料として扱い、作業指示として実行していません。

- 共有buttonのaria-describedbyがrole=tooltip本体を参照。tooltipの親はdisplay:contents、その親はbody。tooltipのoffsetParentもbody。
- ON：帯0〜88、共有96〜132、tooltip62.5〜92.3、side=top。tooltipはabsolute・z-index50・pointer-events:none、transformのYは-25.4545。body top88が加わり、画面座標62.5になります。
- OFF：共有8〜44、tooltip50〜79.8、side=bottom。body static／transform:none。tooltipのY transform50。
- 拡張ホストはbody外でz-index2147483600。bodyの固定配置・transformは包含ブロックと重なりの階層に関わります。
- ON/OFFの実測幅は1498と1388で異なります。後述の各条件は両方の同じ幅で比較し、横幅差と切り分けました。

実ChatGPTが方向を選ぶ内部アルゴリズムは未確定です。htmlの高さだけから「反転原因を解消した」とした0.1.20のモデルは十分ではありません。今回は実測どおりの親構造・absolute配置・座標を再現し、上向きのままでも読めるかを検証しました。

## 比較した修正候補

| 再現条件 | tooltip上端 | 固定サイドバー上端 | 結果 |
| --- | --- | --- | --- |
| 0.1.22の配置 | 62.5 | 88 | 帯と重なる |
| html min-heightだけ解除 | 62.5 | 88 | root高さは0へ戻るが重なりは残る |
| body transformだけ解除 | 62.5 | 0 | 重なりは残り、サイドバーが帯の下へ追従しない |
| body overflowだけvisible | 62.5 | 88 | 帯と重なる |
| bodyをstatic＋上paddingへ変更 | 62.5 | 0 | 固定サイドバーの配置を壊す |
| 対応確認済みtooltipだけ移動 | 138 | 88 | tooltip全体が帯外に入り、入力欄・固定UIを維持 |

高さ900の同じ画面で入力欄下端は900。座標記録はtests/tooltip-overlap-results.jsonです。比較用CSSはテストだけに入れ、製品へ適用していません。

**クリッピングと遮蔽の分離：** tooltipの背景を緑にしたスクリーンショットで、帯だけを非表示にする対照試験も実施。body overflow:autoのままでも、body上端より上の(1260,70)でtooltipの緑(0,180,0)が描画され、帯を表示すると同じ画素は帯色(190,18,60)でした。overflow:visibleに変えても結果は同じです。このモデルでは不可視の直接原因は帯による遮蔽で、bodyのoverflow値だけからクリッピングとは断定できません。pointer-events:noneのヒットテスト結果はこの判断に使用していません。tests/tooltip-pixel-results.jsonとtooltip-variant-*.pngに記録。実ページの現在の全祖先を再採取したわけではないため、あらゆる要素の切り取りを否定するものではありません。

## 採用した限定補正

body側をまとめて変更する案は固定UIに影響するため採用しません。観測済み構造のtooltipを対象に、ページ本来のtransformを保持してCSSの独立したtranslateだけを一時適用します。

- hover／focus中のbutton／role=buttonからaria-describedbyを解決し、tooltip候補が1つであることを確認。
- 上部（帯直下96px以内）のボタン、body直下またはbody > display:contentsのtooltip、offsetParent=body、absolute・pointer-events:noneに限定。
- 非表示・inert・aria-hidden、別包含構造、複数候補、モーダル内、ページ独自のtranslate／rotate／scaleがある場合は補正しない。
- tooltipの本来の上端が帯に重なる場合だけ、ボタン下6pxに全体が収まることを確認して移動。下側や既に帯外にある上側tooltipはそのまま。幅が画面外、下に収まらない場合も無理に移動しない。
- data-side、ネイティブtransform、z-index、overflow、文言、親、DOMの同一性は維持。複製や全tooltipの方向固定は行わない。
- hover／focus終了、tooltip消滅、OFF、モーダル退避、遷移、pagehideで拡張が所有するtranslateを復元。ページが値を変更した場合はその値を優先。
- ポインター移動とフォーカスの最新操作を反映。イベントに応じたrAFをまとめ、自己style変更は監視で除外。常時の全DOM探索・測定用タイマーは追加しない。既存の名前変更・モーダル・レイアウト処理は維持。

## 検証と実画面確認

再現テストでは幅1498／1388、帯40／88、狭い幅390、200％拡大相当のCSS表示領域749×450、マウスhoverとキーボードfocusを確認しました。実ブラウザの200％ズームそのものとは区別します。tooltipの全矩形が帯外・画面内にあり、スクリーンショットで文字全体が見えることを確認。入力欄と送信ボタンの画面内配置・クリック、手動モーダルの表示、OFF時のbody復元も確認しています。

ネイティブtransform更新時の再補正、下側／既に読める上側／未対応／複数候補への非干渉、自己style更新が一度で止まること、消滅・遷移・モーダル時の復元を回帰化しました。既存172件＋追加6件の全178件PASS、失敗0（390.5秒、test-tooltip-suite-local.txt）。全件実行開始後の境界条件・診断項目とテスト強化について、最終版のtooltip補正6件＋診断8件も別途実行し14件PASS（test-tooltip-final-local.txt）。content.js・診断・追加テストの構文確認に成功しました。既存の名前変更・IME合成イベント・画像ビューア相当／手動モーダル・初期表示・入力欄・保存互換性の回帰を含みます。実ChatGPTでの合格を意味しません。

**実ChatGPTでの解消は未確認です。** まず拡張・タブを再読み込みし、共有や他の上部ボタンが読めるか確認が必要です。検索・サイドバーの下側表示、帯高、狭い画面／実200％ズーム、画像ビューア・手動モーダル・入力欄も確認してください。現時点で追加診断は必須としていません。残る場合だけ共有1件を既存の読み取り診断で採取でき、translateも記録するよう更新しました。

重さの最適化は利用者指示により保留。今回の利用者の共有hoverでは引っかかりなし・計測各処理の最長0.3msとの報告ですが、読み込み時を含む重さ全体の解消とは扱いません。

以下は過去の記録です。

# 0.1.22 追加調査：上部ボタンhover後の引っかかり

## 利用者報告と範囲

入力欄フォーカス自体よりも、上部ボタンのtooltipを出した後にページ全体が引っかかるとの追加報告を優先しました。0.1.22の初期表示・高さ補正・名前変更は保持。原因の再現・修正に至っていないため版番号は0.1.22のままとし、診断のみを拡張しています。Git管理はなく、適用されるAGENTS.mdはありません。他ディレクトリの変更はしていません。

## 発火元と実行処理の確認

- tooltipのroleはdialogSelectorに含まれず、それだけではモーダルに分類されません。body配下のchildList/class/style等は既存MutationObserverに入ります。追加・削除部分の検索は行われますが、tooltipだけではタイトルリンク再探索・入力欄祖先再探索・モーダル用rAFの条件を満たしません。
- ページ側が既存レイアウト祖先のclass/style/hiddenを変える場合は、shellDirty→rAF→refreshShellsという別経路になります。dialogやその祖先の属性変更はmodal確認を予約します。600msの経路確認はhoverの有無に関係なく継続し、通常タイトルとモーダル索引を確認します。
- 拡張ホストはbodyの外、設定・帯はShadow DOM内にあり、既存監視には含まれません。高さ補正用属性もattributeFilterの対象外です。拡張にResizeObserverはありません。ただし実ChatGPT側の監視との相互作用は未確認です。
- 既存計測をschema:2へ拡張し、上記の変更元・予約理由・実行回数を区間別に記録。refreshShellsの呼び出しだけでなく、dirty確認、祖先再探索、スタイル参照も区別します。名称取得のリンク訪問・再探索、索引内dialog候補数、visibleModalの処理時間も記録します。収集は明示開始時だけで、名前・本文・ID・入力値は取得しません。

## 長いDOMの再現結果

約20,000子孫要素、100dvhの入れ子祖先、上部ボタンとbody内portal tooltipの画面で、ブラウザのマウス操作でhover／離脱しました。表示中は50msごとにtooltipとportalのstyleを変更。3秒待機→3秒hover→3秒離脱待機→3秒スクロール・フォーカスの順です。最後の操作ではレイアウト祖先のstyleを1回変更し、原因と実行処理の対応も検証しました。合成mouseenterのみの初回試験に加え、最終テストはPlaywrightのマウス操作を使用しています。

| 条件 | hover中の監視callback回数／累計ms | 消滅区間のcallback回数／累計ms | hover前・中・消滅待機の追加rAF | 操作区間の追加rAF |
| --- | --- | --- | --- | --- |
| 帯ON | 59／1.8 | 3／0.2 | 0 | 1 |
| 表示OFF | 59／3.2 | 3／0.3 | 0 | 0 |

消滅区間のcallbackは区間境界付近の最後のstyle変更とノード除去によるものです。その後に継続的な更新は発生していません。ONでの操作区間の1回は、注入した祖先style変更とschedule-layout-attribute→scheduled-frameに対応します。全区間でモーダル入退場・apply・タイトルリンク再探索・入力欄祖先再探索は0。定期タイトル／モーダル確認は各3秒で概ね5回のままでした。データはtests/hover-results.json。1回の模擬画面計測であり、実画面の負荷・原因の証明ではありません。診断自体のカウンター処理時間も含まれます。

## 追加診断と未確認

[diagnostics/HOVER.md](diagnostics/HOVER.md)に開始とコピーの短いConsoleコードを用意しました。既存ホストの診断を再利用し、before／hover／afterQuiet／afterInteractionを各3秒、合計12秒に限定。追加のLong Task observerは最大40件の数値だけを記録し、時間上限・中止・遷移・pagehide・再開始時に解除します。通常時の探索や測定は増やしていません（診断中でなければカウンター関数は早期終了）。

実ChatGPTの重さは再現・解消未確認です。実際のtooltip周辺DOMが他の祖先・dialog等を変更しているかは追加診断待ちです。ツールチップが帯に隠れる配置問題も未解決で、重さと共通原因とは断定しません。配置CSS・z-index・overflow・方向は変更していません。表示OFFと拡張無効＋タブ再読み込みは区別し、内部診断は拡張無効時には動かないことも手順に明記しました。

## 検証

最終版のhover回帰3件PASS（test-hover-local.txt）：ON/OFFの区間比較、tooltipモーダル誤認なし、消滅後の循環なし、祖先style起因の処理、収集終了後の結果不変、キャンセル・遷移の解除。content.jsと追加テストの構文確認に成功。既存169件＋追加3件の全172件PASS、失敗0（386.4秒、test-hover-suite-local.txt）。全件実行開始後にhoverテストを合成イベントからブラウザのマウス操作へ強化し、最終版3件も別途再実行してPASSしています。初期表示・名前変更・IME・モーダル抑制・入力欄・メニュー等の既存回帰を含みます。実ChatGPTや実Windows IMEでの確認ではありません。

以下は先行する0.1.22の記録です。

# 0.1.22 検証記録

## 起動時の原因と修正

0.1.21はhostをdisplay:blockで生成し、enabled=trueとチャットの仮設定でroute/applyを実行してから非同期Storageを適用していました。OFFの取得前や保存寸法の取得前に、仮の帯・枠・ページ補正を出し得るコードでした。

hostはdisplay:noneで生成。enabledReadyとchatReadyを分離し、表示可否と対象チャット設定の両方が確定するまで表示・レイアウト補正をしません。チャット切替時にはchatReadyを解除し、世代チェック付きの読込成功または新しいStorage通知でのみ確定します。失敗時は仮設定で表示しません。ON時はCSS変数・ページ補正・設定UIを適用した同じタスクの最後にhostを表示します。ChatGPT本体は隠さず、初回表示用の固定待機や常時監視を追加していません。

## フォーカスに関する調査と限定した改善

拡張に本文のfocus/focusin・選択変更のハンドラーはなく、通常の本文クリックでは名前編集中でない限り外側確定処理を早期終了します。ページ側がフォーカス時に祖先のclass/styleを変更した場合、MutationObserver→requestAnimationFrame→refreshShellsという経路があります。

旧実装は補正済み祖先のclass/styleの文字列変化で高さ補正を外し、getComputedStyleのheight等を読んで再適用していました。大きな会話領域を一時的に全画面高へ戻す、読み取り／書き込みの往復が起こり得ます。これをmax-heightによる上限へ変更。既に確認済みの全画面祖先は、フォーカス・class/style・resize時にも上限を維持します。小さいページ本来のheightは上限以下なら優先されます。構造変更・表示OFF・モーダル退避時の解除は維持しています。未補正祖先の必要な測定と通常の経路監視は残します。

## 長いDOMでの比較

20,000子孫要素と100dvhの祖先を持つ画面で、1.25秒間に約24回focus/blurを交互に実行し、ページ側のfocus/blurで祖先class/styleが変わる条件を再現。0.1.21の作業前コピーと修正版をON・表示OFF・content scriptなしで比較しました。計測APIの差し替えはテスト環境のみです。CSSStyleDeclarationのプロパティ参照時間も含めて測定しています。

| 条件 | 補正解除回数 | スタイル取得回数 | 取得・参照の累計ms | focus/blur呼び出し累計ms |
| --- | --- | --- | --- | --- |
| 旧ON | 24 | 72 | 30.7 | 361.5 |
| 新ON | 0 | 48 | 0.4 | 379.9 |
| 旧表示OFF | 0 | 0 | 0 | 362.5 |
| 新表示OFF | 0 | 0 | 0 | 368.2 |
| 旧版比較の拡張なし | 0 | 0 | 0 | 305.4 |
| 新版比較の拡張なし | 0 | 0 | 0 | 335.6 |

この1回の比較から操作全体が速くなったとは判断できません。確認できた改善は補正の解除・再適用とそれに伴うスタイル参照負荷の削減です。約24回のストレス条件は利用者の1クリックをそのまま再現したものではありません。最初の単純な直下rootの画面では補正解除が発生しなかったため、実装が対象にする入れ子の100dvh祖先を加えて切り分けました。結果はtests/focus-comparison.json。実画面の主因や改善は未確認です。

フォーカス1操作用にdiagnostics/focus-latency.jsを追加。3秒準備＋8秒上限でpointerdown/focusin・次フレーム・Event Timing・Long Taskの数値のみを取得します。拡張そのものを無効化したページでも動作し、本文・タイトル・入力値・URLを記録しません。常時動かさず、診断終了時に監視・イベント・タイマーを解除します。手順はdiagnostics/FOCUS.md。

## テスト結果

- 既存機能と追加回帰を含む全169件PASS、失敗0（約384.7秒）。test-results-local.txt。core／browser／tooltip-diagnostic／performance／startup／focus-diagnosticを実行しました。
- 全件実行開始後、起動テストの画面をflex構成に強化し、ONの再読み込み初回フレームと入力欄の画面内配置も追加確認。最終版startupの6件を再実行し全PASS（test-startup-local.txt）。
- 入れ子の画面高・固定サイドバー・スクロール・ResizeObserverの既存関連5件、フォーカス中の補正維持・小さい高さ・リサイズの追加1件も個別PASS。フォーカス診断のON／OFF／拡張なし3件PASS。
- 新旧×ON／OFF／拡張なしの性能比較6件PASS。比較用の旧コード一時コピーは削除し、測定結果をtests/focus-comparison.jsonに保持しました。
- content.js、新診断、startup／performance／focus-diagnosticテストのnode --checkに成功。

設定取得を手動で保留した再現画面で毎フレームを記録し、OFF・設定取得失敗では表示とページ補正が一度も出ないこと、ONは保存した帯高88px・文字36px・枠12pxで最初から表示されることを確認しました。新規ページ・再読み込み・チャット切替・古い読込結果とStorage通知の競合を含みます。実ChatGPTや実Windows IMEの検証ではなく、ブラウザ再現画面・Storage模擬実装・合成イベントによる検証です。

## 維持・未確認

ツールチップは未解決です。min-heightや方向・z-indexの追加対策は行っていません。名前変更の保存1回・再送禁止・更新中表示、IME、モーダル抑制、入力欄・送信ボタン・サイドバー、色入力のクリック範囲を回帰確認しました。実ChatGPTでのクリック遅延、Windows IME、実画面の新規タブ初回表示は利用者確認待ちです。

以下は過去の記録です。

# 0.1.21 検証記録

## 利用者報告と未解決点

0.1.20実画面では検索・サイドバーは下側、ほかの上部ボタンは上側で、ツールチップ問題は未解消。html最小高さだけで解消したとは扱いません。重い長いチャットと軽い別チャットで配置傾向は同じとの報告です。チャット長・版番号・ツールチップ問題と重さの因果は未確定。今回はツールチップの配置CSS、z-index、親、方向を追加変更しません。修正版の実DOM診断が必要です（diagnostics/TOOLTIP.md）。

## 重さ：確認したコードと変更

通常時の600msタイマーが全ページのチャットリンクとダイアログを繰り返し検索していました。body配下の祖先class/style変更時にも、対象祖先の全子孫をダイアログ検索していました。さらに祖先style変更で入力欄・mainの全ページ検索を再実行していました。大きいDOMでこれらの探索時間が増えることを再現しました。

- ダイアログは初回の索引と追加・削除部分／role変更による更新へ変更。可視性チェックと600msの経路確認は維持。
- 通常タイトル取得はサイドバー候補への参照を保持し、リンク構造・href変更で更新。本文側の追加リンクはタイトル候補にしない。名称保存の安全確認・成功判定に使う新しいDOMの再取得は変更していません。
- 入力欄の祖先集合は構造変更・表示ON/OFF時に更新。祖先style変更やリサイズ時は必要なサイズ・既存補正を再確認し、main／入力欄の全ページ検索を繰り返しません。間引き・待機延長ではありません。

拡張自身のShadow DOMとhtml属性はbody監視の外で、補正用data属性も監視対象外です。今回の再現では自身の更新循環は検出していません。拡張はResizeObserverを使用していません。通常時の詳細名称診断は実行されず、名前変更中と上限付き後続観測に限定されています。モーダル入場時のスクロール退避には既存の全要素走査が残ります（毎フレームや待機中の処理ではなく、復元仕様を保持するため今回は変更していません）。実ChatGPT側のResizeObserverや描画・通信との相互作用は未確定です。

## 約2万要素での同条件比較

修正前0.1.20の一時コピーと修正版を、同じヘッドレスChromium・5,000行／約20,000子孫要素で比較しました。各phaseは1.25秒、scroll/inputでは50msごとに祖先style/classを変更、tooltipでは小さいノードの追加削除を行います。DOM探索API、getComputedStyle、getBoundingClientRectをテスト環境内で計測。実サイトや拡張製品にはこれらのAPI差し替えを追加していません。

| 帯ONの条件 | document探索回数 旧→新 | 探索API累計ms 旧→新 | スタイル測定回数 旧→新 |
| --- | --- | --- | --- |
| 待機 | 4→0 | 8.3→0.1 | 0→0 |
| スクロール＋祖先style | 54→0 | 96.0→0.0 | 50→50 |
| 入力＋祖先class | 54→0 | 164.7→0.1 | 50→50 |
| tooltip追加削除 | 4→0 | 8.6→0.6 | 0→0 |

帯OFFもdocument探索は各phase4→0。tooltipでの小さな部分探索は100→149回に増えますが、全ページ探索を除いたため累計時間は減少しています。表は1回の計測値で、性能倍率の保証ではありません。スタイル測定の累計はONのscroll/inputで修正版各約0.2ms。強制レイアウトが実際の主因だったとの証拠ではなく、今回確認したのは不要な広範囲探索の削減です。生の数値はtests/performance-comparison.json、回帰用はtests/performance.test.js。実際の「めちゃくちゃ重い」現象の解消は利用者確認待ちです。

実画面用には明示操作で8秒だけ関数の回数・累計時間・最長時間を集計する診断を追加。通常時には計測せず、本文・名前・ID・入力値を収集しません。終了・遷移・pagehide・再実行で解除します。手順はdiagnostics/PERFORMANCE.md。入れ子の関数時間は単純合算できず、ページ全体のCPU使用量を示すものではありません。

## 色パレット

input[type=color]の親labelにより、説明文字や行の余白のクリックが入力に転送されていました。色の2行だけをdiv＋span＋可視inputへ変更。inputは64×34pxのままで、帯色／文字色のアクセシブル名とTabフォーカスを維持します。文字色モードのボタンはパレット起動と別のままです。行内余白・文字・モードのクリックでinputのclickが発生せず、色入力クリックでは発生し、メニューを維持することを検証します。実Chromeのネイティブパレット操作・キーボード起動は実画面でも確認してください。

## 検証結果

既存152件＋追加6件＝158件すべてPASS（失敗・スキップ0、約379秒）。`node --test tests/core.test.js tests/browser.test.js tests/tooltip-diagnostic.test.js tests/performance.test.js`、ログはtest-results-local.txt。追加は色行クリック範囲、短時間診断の終了・遷移、リンク置換／role変更、安定時ResizeObserver、長いDOMでのON/OFF各1件です。Spaceキーで色入力を起動しEscape後もメニューを保持する追加確認も、最終版で個別再実行してPASS（test-color-local.txt）。修正前後の比較4条件もPASS（test-performance-local.txt）。content.jsと変更したテスト・診断コードの構文確認もPASS。

短時間診断テストは、拡張起動後に仮想時計を導入すると既存のタイマーを期待どおり進められないため、visibilitychangeによる通常の確認経路を明示的に発火して集計・終了を検証しました。旧版の比較用コピーは作業終了時に削除し、匿名の測定値をperformance-comparison.jsonへ残しています。

実ChatGPTの重い／軽いタブの比較、ページ側のResizeObserverや描画負荷、隠れるツールチップの新しい実DOMは未取得です。利用者は拡張・対象タブを再読み込みし、重い／軽いタブのON/OFFを同じ条件で比較してください。診断はPERFORMANCE.mdの8秒集計と、TOOLTIP.mdの10秒準備＋6秒観測を別々に実行できます。Windows Chrome本来のパレット選択も実画面で確認してください。ツールチップ解消・実画面の重さ解消を今回のPASSだけで確定しません。

以下は過去の記録です。

# 0.1.20 検証記録

## 添付から確認した事実

052815診断（帯ON）はviewport幅1498.2、帯y=0〜88、共有y=96〜132、対応するrole=tooltipがside=top・y=62.5〜92.3。tooltipの親はdisplay:contents、その親はbody。bodyはfixed/top88/overflow:auto/transformあり、html矩形の高さは0。帯ホストz-index2147483600、tooltipは50、pointer-events:none。

055331診断（OFF）は幅1388.2、共有y=8〜44、tooltipはbottom・y=50〜79.8、html/body高さ1393.6、bodyはstatic/overflow:visible/transform:none。ON/OFFで幅が異なるため、この2件だけで各CSS指定の因果は断定しません。本文・タイトル等は比較に使用していません。

## 同幅での再現と限定した修正

検証用Chromiumの幅1498／1388・高さ1394をそれぞれ固定し、両幅で同じ結果を得ました。実測と同じabsolute tooltip、display:contentsの親、bodyの配置を再現。配置モデルはhtml.getBoundingClientRectを境界とし、下側が収まらなければ上側へ反転する明示的なモデルです。これはChatGPTのコードそのものではありません。

| 条件（帯88px） | html高さ | 方向／吹き出しy | 影響 |
| --- | --- | --- | --- |
| 旧CSS | 0 | top／60〜90 | 帯と重なる |
| overflowだけvisible | 0 | top／60〜90 | 反転は残る |
| transformだけnone | 0 | top／60〜90 | 反転は残る |
| bodyだけstatic | 1306 | bottom／50〜80 | bodyの上端も0へ戻り、帯用余白を失う |
| html最小高さ100dvh | 1394 | bottom／138〜168 | body上端88を保持して重なり解消 |

数値記録はtests/tooltip-boundary-results.json。初回比較テストでは上書きCSSの詳細度が不足して旧CSSを再現できなかったため、同じ詳細度の後置CSSに修正しました。

修正は既存のactive属性付きhtmlへのmin-height:100dvh!importantの1規則のみ。root境界の縮退を修正し、入力欄・固定サイドバー用のbody固定配置、transform、overflow、子の高さ補正は保持します。ツールチップのスタイル・親・配置方向・z-indexを変更しません。OFFとモーダル退避時は属性が外れ、元のページCSSに復帰します。

配置ライブラリには境界を用いた衝突判定が存在します（参考：[Floating UI公式detectOverflow](https://floating-ui.com/docs/detectoverflow)）。今回のChatGPTがこのライブラリ・同じ境界設定を使用しているとの証拠ではありません。再現で確定したのは固定bodyによるルート矩形縮退と、それを参照するモデルでの誤反転です。実サイトの内部計算と、修正版での実際の解消は未確認です。

## 回帰確認範囲

追加4ケース：上記の同幅比較、幅1498／390／749の各画面で共有等5ボタン×hover/focus×帯40/88。749×450は1498×900の200％拡大相当のCSS表示領域とDPR2をCDPで設定した条件で、Chromeメニューから実際に200％へ変更した操作ではありません。いずれも吹き出し矩形が帯・画面外に出ないこと、入力欄・送信ボタンの画面内配置とクリック、モーダル前後のスクロール、OFF時のルート補正解除を検証します。pointer-events:noneのツールチップの不在ヒットを不可視判定には使用しません。

実ChatGPTでは上部各ボタンのhover／Tabフォーカス、帯40／88、狭い幅、実際の200％拡大、入力欄・固定サイドバー、画像ビューア、名前変更を確認してください。未確認点を模擬画面のPASSで解消済みとは扱いません。以下は履歴です。

検証結果：本体既存140件＋追加4件＝144件PASS。全体実行（core/browser/tooltip-diagnostic、約376秒）では152件中151件PASS、診断の「9999ms時点で未取得」1件が実時間の進行により失敗。診断開始前に仮想時計を停止して境界の不安定さを除き、診断8件を再実行して8件PASS（約8秒）。現在の全152ケースは合格を確認していますが、一度の全体実行で152件PASSという記録ではありません。ログはtest-results-local.txtとtest-tooltip-recheck-local.txt。追加4件もhtml/overflowを添付実測と同じ条件へ揃えた最終版で再実行し4件PASS（test-tooltip-fix-local.txt）。content/core/popup/診断/関連テストの構文確認もPASS。

tests/tooltip-390.pngを視覚確認し、88px帯の下に黒い説明が見え、入力欄・送信ボタンも画面内にあることを確認しました。ページ側のz-index・pointer-events・tooltip位置を拡張側で操作していません。既存全テストには固定サイドバー、スクロール、画像ビューア、手動モーダル、名前変更の抑制・更新中表示・保存1回・再送禁止・DOM変更時中止が含まれます。

# 0.1.19 検証記録

## 追加調査：ツールチップ（診断のみ）

上部の複数ボタンの吹き出しが帯に隠れる報告を受け、既存レイアウトを確認。bodyの固定配置・帯分のinset・overflow:auto・transform:translateZ(0)、body外の高いz-indexの拡張ホストを確認しました。実ツールチップのDOMが未取得のため、配置計算への影響・祖先によるクリップ・帯との前後関係のどれが実際の原因かは未確定です。拡張本体・manifest・版番号は変更していません。

diagnostics/tooltip-layout.jsと手順を追加。10秒準備＋6秒上限の読み取り観測、対象と参照先・配置候補・祖先・矩形・スタイル・ヒットテストを匿名化して保存。自動コピー・操作・通信・ページ変更はなし。実ChatGPTでのホバー／キーボード説明、各ボタン・高さ・狭い画面・200％拡大での解消確認は未実施であり、解決済みとは扱いません。

今回の検証：診断専用8件＋既存core10件＝18件PASS（約8秒）。帯ON/OFF×hover/focus、10秒前の未取得、遅延出現、読み上げ用tooltipと可視祖先の区別、匿名化、操作なし、完了後の測定停止、手動終了・遷移・pagehide・再実行での解除を確認。最初の診断用fixtureはcharset未指定で日本語セレクタが一致しなかったためUTF-8指定を追加し、再実行しました。`node --test tests/core.test.js tests/tooltip-diagnostic.test.js`の最終結果はtest-tooltip-recheck-local.txt。診断コード・診断テスト・content.jsの構文確認もPASS。拡張本体を変更していないため既存140件の全ブラウザテストは今回は再実行せず、以下に前回の結果を保持します。模擬画面での診断機能の検証は、実ChatGPTの原因特定や修正確認とは別です。

## 0.1.19の実装検証

2026-10-20。中央の通常タイトルとは別のstatus要素に「更新中・・・」を一度だけ設定し、通常タイトルをhiddenにします。名称取得は継続しますが、処理中の表示を上書きしません。font-sizeは設定の80％、色は帯から継承。中央配置と操作ボタンの左右予約幅を共有し、端の重複表示を廃止。遷移時とfinallyで表示を解除します。

追加2件：同期的な確定受付直後（ネイティブ保存前）の表示切替、4.6秒保存中のページ名変更に対する表示維持、文言変更1回、文字色3モード・18/26/36px・360px幅での追従と中央配置、成功復帰／未変更・キャンセル・合成IMEでは処理中表示なし。既存の遅延保存・エラー・上限・遷移・保存前中止・結果不明のテストにも通常タイトルへの復帰確認を追加。

実ChatGPTおよび実Windows IME・スクリーンリーダーでの確認は未実施。実画面では確定直後の中央表示、保存待機中の維持、保存後の名前表示、失敗・遷移後の復帰を確認してください。保存時間の短縮は測定しておらず、短縮したとは判断しません。以下は履歴です。

検証結果：既存138件＋追加2件＝140件すべてPASS（失敗・スキップ0、約363秒）。`node --test tests/core.test.js tests/browser.test.js`で実行し、test-results-local.txtに記録。content.js／core.js／popup.js／tests/browser.test.jsの構文確認もPASS。検証用Chromium・模擬Storage・合成IMEイベントによる結果です。

## 0.1.18

2026-10-20。ChatGPTの仕様変更時に安全に中止する方針を追加。保存前の未対応案内と保存後の結果不明を区別し、後者では入力名を確認・コピーできる状態だけを残し、再編集を促すボタンを表示しません。

保存直前のフォーム・入力欄・保存ボタンの対応と候補数を再検証。操作前から存在するダイアログを利用しない確認も追加しました。追加5ケース：対象ボタン欠落／候補重複／別チャット混在でクリックせず色と設定を維持、入力反映時の保存ボタン複製で送信せず表示復元、保存後の別ダイアログ差し替えで保存1回・結果不明・再送案内なし・ページ入力復元・手動名称追従。

実ChatGPTの将来の構造変更は未確認です。検証は模擬DOM・Storageを使うブラウザテストであり、任意の将来DOMでの正常動作を保証しません。既存の画像ビューア・手動モーダル退避と、所有ペア限定のちらつき抑制は維持します。

検証結果：既存133件＋追加5件＝138件すべてPASS（失敗・スキップ0、約356秒）。`node --test tests/core.test.js tests/browser.test.js`、結果はtest-results-local.txt。content.js／core.js／popup.js／tests/browser.test.jsの構文確認もPASS。追加テスト初回では異なる検証画面用の入力欄セレクタを流用して2件が失敗したため、当該画面のtextareaで画面内の位置・クリック後のフォーカスを検証するよう修正し、全件再実行しました。実ChatGPTでは通常の名前変更、保存前の中止案内、結果不明後の通常表示・入力名確認、手動変更の帯への追従を利用者側で確認してください。

以下は0.1.17の記録です。

## 0.1.17

2026-10-20。提示された実測は通常約3.96秒、抑制なし約4.08秒。この2回で抑制による遅延は認められず、通信とページ処理の内訳は未確定。実測なしに速度短縮を主張しません。

## 実装

未変更・空白・IME等の判定後、変更の確定を受け付けた同期処理で編集欄を終了し、変更中表示へ移行。保存待機用セッションとガードは維持します。3秒後に編集欄を閉じるタイマーを削除し、名前更新・ダイアログ終了の証拠が揃うまで成功扱いにしません。所有ペアの抑制、10秒上限、終了処理、30秒の後続観測は維持。

失敗時には入力名を当該チャット用の一時メモリに保持し、通知内のreadonly inputで確認・コピー可能。「この名前で編集し直す」は対象を再検証して新しい編集セッションに値を戻すだけで送信しません。自動再送なし。成功・遷移で破棄、永続保存や診断出力なし。再編集時に拡張のエラー通知がネイティブ対象ボタンを覆っていたため、自身の通知だけ先に閉じてヒットテストするよう修正しました。

詳細診断の繰り返しDOM測定はawait-nameで250msに制限し、名称一致判定と安全チェックは間引きません。フォーカス後・ネイティブinputイベント後のsetTimeout(0)はページの状態反映を待つため維持。これは約4秒の固定待機ではありません。保存開始前の不要な数秒待機はありません。

## 非表示モーダルの操作制限

検証用画面では、opacity:0の所有ダイアログ／背景が入力欄へのヒットを遮り、ページ側のinertが残る条件を再現。拡張はinert・pointer-events・ページのフォーカス制御を解除しません。診断に入力欄中央のヒット先、inert祖先、body/inputのpointer-eventsを追加。実ChatGPTのフォーカストラップや操作制限は、この環境では未確認です。

## テスト

追加2件：確定直後の編集終了・再編集防止・失敗名再利用から明示的な保存1回／ネイティブinertと透明モーダルの入力遮蔽を診断し、ページ本来の解除まで変更しないこと。以前の保存中復元テストは、editor-releasedが即時になったため保存開始後の状態になるまで待って検証するよう調整。

既存131件＋追加2件＝133件すべてPASS（失敗・スキップ0、約353秒）。node --test tests/core.test.js tests/browser.test.jsで実行、test-results-local.txtへ記録。content.js／tests/browser.test.jsの構文確認もPASS。検証用Chromiumと模擬Storageによる結果です。実画面では確定直後の反応、失敗時の保持名の確認・再利用、約4秒の間のページ操作制限と新診断、抑制と終了復元を確認してください。4秒の保存時間の短縮と操作制限の解消は未確認です。

---

# 0.1.16 検証記録

2026-10-20。利用者が提示した0.1.15実測の時系列を確認。保存182ms、3203msタイムアウト、3205ms抑制解除、3804msに接続中/open/視覚表示、4305msに名称一致と切断、4308ms遅延成功。この露出は完了前の解除で説明できます。通信・ページ処理・抑制の競合のどれが約4秒を要した原因かは未確定です。

## 変更と上限

編集セッションの表示を約3秒で終了しても、保存処理の対象ID/遷移世代と処理中ガードを保持します。端に小さな変更中表示を置き、入力の多重開始を防ぎます。所有したダイアログの抑制と監視は名称更新とダイアログ/背景の終了まで継続し、保存実行から10秒を共通上限とします。実測4.3秒を包含する有限の運用上限で、サーバー応答時間を測った推定値ではありません。上限は時計でも確認し、無期限に隠しません。

ページの所有ダイアログ内に非空のrole=alert通知が表示された場合は、安全側で待機を中止し、画面の確認を促して抑制を解除します。固有のエラーコードや通信応答は読み取っていません。対応関係喪失、別モーダル、遷移、表示OFFでも既存のガードで終了。保存は1回。finallyで変更中表示・編集終了タイマー・監視・抑制を解除し、残った本来の画面を操作可能に戻します。10秒後も名称未確認なら既存の30秒上限の読み取り観測を使います。

同じ所有ペアのdata-stateがopenからclosedへ移行することは通常の終了遷移として許可し、切断まで抑制を維持します。従来はclosedも対応喪失として早期解除していたため、この経路を修正。親・要素の対応が変わる場合の中止は維持します。

通常モードのanimation/transition無効化は変更していません。次の保存試行のみ抑制を無効にする比較用イベントを追加し、同じ対象確認・入力・保存経路で所要時間を記録します。実ChatGPTでの比較は未実施で、原因は修正済みとは扱いません。

## 検証

追加7件：4.6秒の保存（抑制あり／なしの2件）、3.5秒後のネイティブ通知、編集解除後の遷移・上限・背景対応喪失（3件）、通常のclosed状態への移行。抑制ありでは3秒を超える途中フレームもdialog/overlay opacity=0を確認。比較条件では実際に表示された状態で同じ保存が成立することを確認。タイムアウト後の遅延確認テストは新上限を超える11.4/11.5秒へ変更しました。

全件実行で130件すべてPASS（失敗・スキップ0、約351秒）。その後追加したclosed状態のテストと関係する5ケースを再実行して6件すべてPASS（約20秒）。合計131件を確認済みです。記録はtest-results-local.txtとtest-exit-local.txt。構文確認もPASS。検証用Chromium・模擬Storageでの結果と実ChatGPTを区別します。実画面では通常条件で途中表示が抑えられるか、任意の抑制なし条件と完了時間が違うかをschema:4で比較してください。

---

# 0.1.15 検証記録

2026-10-20。添付schema:2診断を読み取り確認。保存186msの1回、3200msでタイムアウト、3202ms解除直後も旧名、19296msの手動観測で同一リンクの期待値一致・document.title一致・ダイアログ切断。リンクの文字混在を示す証拠はなく、実際に観測DOMが旧名のままでした。更新時刻、サーバー応答時刻、抑制との因果関係は未確定です。

## 変更

3秒の編集期限・抑制解除・通常表示復元を維持。送信済みで名称未確認の終了後に、保存開始から30秒を上限として500ms間隔の読み取り観測を開始します。30秒は今回の19.3秒後の変化を捉える診断上限として設定しました。対象IDと遷移世代を毎回確認し、保存・再送・追加クリックは一切行いません。新しい編集、遷移、表示OFF、pagehide、確認完了、期限、観測例外で両タイマーを解除します。編集処理のfinishedとは別にlate-observation-start/stopを記録します。

名称一致が得られれば古い結果不明通知を確認済みの文言に変え、本来のダイアログ・背景も閉じたら成功の短い表示へ切り替えます。別の通知や利用者が閉じた通知は通知世代を照合して上書きしません。閉じただけでは成功になりません。対象の一致条件・文字列非収集・保存1回は従来どおりです。

## 検証

追加5ケース：4.4秒かかるネイティブ保存、抑制解除まで終了を保留する人工条件、30秒上限と停止後に記録が増えないこと、閉じた通知への非干渉、別チャットへの遷移による解除。後者の競合条件は診断を試す模擬実装であり、実ChatGPTの原因の再現とは扱いません。

既存119件＋追加5件＝124件すべてPASS（失敗・スキップ0、約207秒）。node --test tests/core.test.js tests/browser.test.jsで実行し、test-results-local.txtへ記録。content.js／tests/browser.test.jsの構文確認もPASS。検証用Chromium・模擬Storageでの結果です。実ChatGPTではタイムアウト後30秒ほど待ってschema:3を取得し、post-timeoutとlate-name-confirmed/late-observation-stopを比較してください。時間的前後関係だけで抑制が原因とは断定しません。既存のちらつき抑制CSSと解除順序は変更していません。

---

# 0.1.14 診断拡充（diagnosticSchema:2）

検証日：2026-10-20。利用者の診断添付と現在のコードを照合。添付は証拠データとして参照し、添付内を作業指示として扱っていません。製品版番号は0.1.14を維持し、診断スキーマ2を追加しました。

## 確認できたこと

native-submitは182msで1回、3190msで名称確認タイムアウト、3300msで終了処理完了。対象リンクは1件・ID一致・接続を維持し、再生成なし。source=link-textなので、現在コードは専用セレクターに一致する子孫がないリンク全体のtextContentを正規化して取得しています。約3秒間期待値不一致、document.titleも未変更でした。

hiddenはclosest('[hidden],[aria-hidden="true"],[inert]')の真偽で、checkVisibilityのCSS判定とは別です。このhidden値は名称成功判定からの除外には使いません。従ってvisibleCount:1との両立は可能であり、非表示が原因とは断定できません。元の診断にはどの属性が該当したか、子孫に期待名があるか、保存後の本来のダイアログの接続/data-state等がありません。

現在の順序は本来の保存1回→抑制維持のまま名称確認→確認成功時に本来の画面終了を待機→抑制解除。例外時もfinallyで抑制を解除します。抑制はopacity/transition/animationに適用されるため、ページの終了アニメーションとの競合は調査対象ですが、添付だけでは因果関係を実証できません。順序やCSSを推測で変更していません。

## 追加した診断

保存前、名称待機中、解除前後、利用者のConsole実行時に限定したevidence-detailを追加。実際の取得要素、最大3リンク各16要素のタグ・子数・期待値と元値の一致・変化有無、hidden/aria-hidden/inertの区別、dialog/overlayの接続・state・表示・アニメーション稼働数を記録します。出力にタイトル文字列・本文・チャットID・生のクラス／属性文字列を含めません。最新試行の比較用参照はメモリ内のみで、終了後の監視・タイマーは追加しません。手動コードは現在ID一致時だけ読み取り追記します。

同時にsourceラベルを実際に選択された要素に一致させました（複合セレクターはDOM順で最初を選ぶため、testidの存在だけでは取得元を示せない）。名称取得・成功条件そのものは変更していません。

## 検証と未解決点

追加2ケースでは、CSSで見えるがaria-hidden祖先を持つリンクについて、リンク全体に補助文字が混ざり子要素だけ期待名に一致する状態と、ダイアログが残り名前が更新されない状態を区別できました。どちらも保存1回・結果不明・通常表示へ復帰、文字列非収集を確認。これらは判別能力を検証する人工条件で、実ChatGPTの原因の再現とは扱いません。

content.jsとtests/browser.test.jsの構文確認PASS。`node --test tests/core.test.js tests/browser.test.js` は既存117件＋追加2件＝119件すべてPASS（失敗・スキップ0、約181秒）。実行記録はtest-results-local.txt。検証用Chromium・模擬Storageでの結果です。

実ChatGPTの名前取得構造、更新遅延、抑制と終了アニメーションの競合のどれが原因かは未確定です。新しいConsoleコードで終了直後のJSONを取得し、必要なら手動閉鎖後／数秒後にも追記して比較します。待機時間延長・再送・閉じただけの成功判定は追加していません。

---

# 0.1.14 検証記録

検証日：2026-10-20。開始時0.1.13、Git管理なし、適用対象のAGENTS.mdなし。既存変更を保持。対象フォルダ以外の拡張・サンプルA・カタログは変更せず、commit/push/公開なし。

## 実画面報告と原因の切り分け

利用者は、一方のチャットでは正常に変更でき、特定チャットでは名前確認タイムアウト後に白い編集欄が残り、リロード後には名前が変わっていると報告。単独タブでも発生するため、タブ分割を原因とは判断していません。

コード上、従来のfinallyは送信済みeditSessionを残して入力欄をdisabledにするため、タイムアウト後に白い編集表示が残る経路を確認しました。全保存終了経路でendEditし、実行中状態・変換表示・幅計測予約・抑制スタイル・監視を解除するよう修正。待機処理のobserver/poll/deadlineはfinishで解除し、その稼働数も診断へ記録します。エラー時には本来のダイアログを利用者が操作できる表示に戻します。

名称確認は現在DOMの対象IDリンクを毎回取得し、表示候補があればそれを優先、候補が一意で期待名と一致した場合、または現在ID一致かつ保存開始時から変化したページタイトルが期待名と一致した場合に限ります。入力欄の値や拡張の文字は成功根拠にしません。この条件と3秒期限は変更していません。別チャット・複数候補を通す緩和や再送は行っていません。

今回の追加再現では、本来の保存後に名前が変わっていても対象リンクが2件に再生成され、document.titleが未更新なら確認不能になる条件を作りました。結果不明・保存1回のまま通常表示へ復帰しました。これは実画面の原因の断定ではありません。特定チャットの実DOM／名称更新の診断は未受領で、確認タイムアウト自体は未解決点として残ります。

## UIとIME

使い方のopen属性はsetOpen(false)で解除。全閉鎖経路で共通です。IMEはフォーカスされた通常のinputを維持し、hiddenの幅測定用spanは描画の代替ではありません。入力中にvalueを上書きせず、CSSは従来のフォント・line-height:1.15・上下padding:4pxを保持。独自下線は追加していません。composition中だけ編集欄近くに固定配置の「変換中」を出し、compositionend/endEditで消します。

合成イベントでcomposition/Enter/keyCode229/keyup/repeatを検証。Windows IMEの実際の下線描画・キーイベント順序・スクリーンリーダーはこの検証では未確認です。

## テスト

追加7件：使い方の全閉鎖経路／正常・結果不明・入力欄不一致・遷移の終了状態（4件）／保存済みでも候補複数で確認不能になる状態と診断の非収集／変換表示とEnter・キャンセル・遷移。既存のリンク再生成・早い／遅い名称更新・ちらつき抑制・手動ダイアログ非干渉も実行します。以前の「失敗後に同じ編集欄で再試行」「送信後は入力欄をdisabledで残す」という期待値は、通常表示へ戻して明示的に編集し直す仕様へ更新しました。

環境：Node.js 22.16.0 / Playwright 1.62.1 / Chromium 153、検証用DOM・模擬Storage。

全件実行（node --test tests/core.test.js tests/browser.test.js）は既存110件＋追加7件＝117件、115件PASS・2件FAIL（約204秒）。2件は旧仕様の「失敗後も編集状態を残す」「送信後はdisabledにする」という期待値でした。通常表示へ戻して再編集する期待値に更新し、関連3ケースを再実行して3件PASS。これにより全117件を確認済みです。全件記録はtest-results-local.txt、修正後の再確認はtest-recheck-local.txtです。最初に指定した25秒の実行制限はファイル全体へ適用され中断したため、制限を外して上記全件を実行しています。

content.js／core.js／popup.js／tests内の両JS／diagnostics/rename-target.jsの構文確認PASS。追加の候補再生成テストは名称更新の後に別タスクで複製するのでは確認が先に成功するため、同じDOM更新で再生成する構造に直し、確認不能の条件を明確に再現しました。製品の確認条件は緩めていません。

## 実画面で必要な確認

拡張・対象タブを再読み込み後、対象チャットで名前変更し、結果不明でも編集欄と変換中表示が残らず設定やタイトルが操作できることを確認してください。確認タイムアウトが出た場合、リロード前にdiagnostics/README.mdのConsoleコードでJSONを取得します。文字列・会話本文・チャットIDは記録せず、対象要素を探す必要はありません。正常チャットの成功、IMEの実下線・独立したEnterで保存、使い方リセット、ちらつき抑制の維持も実画面で確認してください。

---

# 0.1.13 検証記録

検証日：2026-10-20。開始時0.1.12。Git管理なし、適用対象のAGENTS.mdなし。既存変更を保持し、対象フォルダのみを変更。Enter Key Controlのpopup.html／popup.js／日本語メッセージはリンクの読み取り参照のみ。

## 利用者による実画面の結果

0.1.12で名前変更時のちらつき解消を利用者が実ChatGPTで確認済み。0.1.13の新しいUIと再読み込み後の名前の永続化は、今回こちらでは確認していません。

## 実装と確認範囲

- 成功専用のpoliteライブ領域を帯右端直下に設置。約3秒で文字列を消し、タイマーを解除。新しい通知・編集・設定メニュー表示・チャット切替・非表示化でも解除。固定配置・pointer-events:noneで帯の高さ、タイトル中心、操作領域を維持。
- エラー／結果不明は既存の理由表示と手動閉鎖を維持。名称確認に成功した経路だけ成功通知を使用。未変更は引き続き保存・通知なし。
- メニューの外側クリックはcomposedPathでShadow DOM内外を区別し、メニュー／開閉ボタン以外で閉鎖。preventDefaultやクリックの伝播停止は行わない。名前確定用のpointerdown→click照合は維持。Escapeはメニューが開いている場合のみ扱い、IME中・既に処理されたイベントは無視。
- 使い方はネイティブdetails/summary（閉状態が初期値、標準の▶/▼、展開状態のアクセシビリティとEnter/Space操作）。長い常設説明を削除。
- 文字色のラベルだけ変更。既存のauto/vivid/custom・色計算・保存値は維持。
- ストアリンクは指定URL、target=_blank、rel=noopener noreferrer。Enter Key Controlと同じ12px青色・ホバー下線・下部配置。manifestの権限はstorageだけ。

## 今回追加した回帰テスト（6件）

1. 成功表示の3秒消去、連続保存によるタイマー更新、チャット切替時の解除、保存回数。
2. 幅1280／640／240pxでタイトル中心・帯高・成功表示の収まり・設定ボタンのヒットテスト。
3. 結果不明は3秒後も理由を保持、手動で閉鎖可能、成功表示なし、再送なし。
4. メニュー内の操作・色入力イベントでは維持、帯／ページ外側・再クリック・Escapeでは閉鎖。ページフォーカス・外側クリック確定と保存1回。
5. 使い方の初期折りたたみ、Enter／Spaceの展開・折りたたみ。
6. 旧custom文字色保持、新ラベル、リンク属性、新規タブ動作、編集中のストアリンク非表示と多重保存なし、追加権限なし。

検証環境：Node.js 22.16.0 / Playwright 1.62.1 / Chromium 153、検証用DOM・模擬Storage。
最終版で `node --test tests/core.test.js tests/browser.test.js` を実行し、既存104件＋追加6件＝**110件すべてPASS**（失敗・スキップ0、約157秒）。実行記録は [test-results-local.txt](test-results-local.txt)。content.js／core.js／popup.js／tests内の両JSの構文確認もPASS。

初回全件実行では109件PASS、旧テストのsummary要素が1つだけという前提で1件失敗。「タイトル全文」を明示するセレクターへ更新し、最終版の全件再実行で合格しました。未変更時には新しい成功通知も出ないことを既存テストへ追加しています。

### 検証上の制限と実画面での確認

実ストアURLへの遷移は、このWindows検証用Chromiumプロセスが終了（exitCode=2147483651）して検証不可でした。製品側のURLは変更せず属性を検査し、テスト内でのみhrefを検証用URLへ置き換え、通常リンクが新しいタブを開くことを確認しています。実ストア表示は通常のChromeで確認してください。

カラーピッカーはページへのclick/input/changeとフォーカス復帰を再現してメニュー維持を検証。OSの色選択ウィンドウそのものは未確認です。実ChatGPTでは色選択、約3秒の通知と読み上げ、狭い画面／200%拡大、メニュー外側・Escape、ストアリンク、および名前変更時のちらつき抑制維持を確認してください。

---

# 0.1.12 検証記録

検証日：2026-10-20。手元の0.1.11と、利用者提供のchat-thread-colors-0.1.12.zip内の差分パッチ・検証記録・各ファイルを照合しました。パッチの各変更前ブロックが一致することを確認して差分だけを適用し、フォルダ全体は上書きしていません。Git管理・適用されるAGENTS.mdはなく、既存変更を保持しました。提供ZIPは変更していません。

## 原因と修正

過去の利用者の実画面DOMにある、装飾用背景のaria-hidden="true"を検証画面へ追加。0.1.11はdisplayed(overlay)がこの属性でfalseを返し、背景・ダイアログのペアを抑制しません。今回も追加テストを修正前に実行してFAILを確認。保存中の8フレームでdialog opacity=1、overlay opacity=0.9、帯非表示・余白退避を再現しました（提供ZIPの記録では11フレーム）。

背景の確認のみ、CSS描画状態・hidden/inert・寸法を使う専用条件へ変更。親を共有するダイアログの可視性と対象確認は従来どおりです。aria-hidden属性は保持し、一般のdisplayed関数・操作ボタン判定は変更していません。

## 追加テスト4件

1. aria-hiddenの背景と対応ダイアログが各描画フレームで抑制され、保存は1回。
2. 同じ属性の手動の名前変更は表示され、キャンセルできる。
3. 保存タイムアウトで元の見た目へ復帰し、aria-hiddenを保持、再送しない。
4. 実際にdisplay:noneの背景はペアとして受け入れない。

今回の環境：Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromium 153 / Storage模擬実装。実ChatGPTへの適用・ちらつき解消・再読み込み後のサーバー永続化は未確認です。

提供ZIP内のTEST-RESULTS.txtは、別環境（Node.js 24.19.0）で101件＋3件の計104件PASSと記録されています。今回はこちらの環境で `node --test tests/core.test.js tests/browser.test.js` を実行し、既存100件＋追加4件＝104件すべてPASS（失敗・スキップ0、約140秒）。途中描画・手動表示・タイムアウト復帰を含む実行記録は [test-results-local.txt](test-results-local.txt) に保存しました。content.js・core.js・popup.js・diagnostics/rename-target.js・tests内の両JSのnode --checkもすべてPASSしました。

利用者による実画面確認：拡張とChatGPTタブを再読み込みし、帯内からの名前変更時の途中表示、名前反映と再読み込み後の保持、手動の名前変更・画像ビューアの表示を確認してください。ちらつき解消済みとは判断していません。

以下は手元に保持していた過去の検証記録です。

---

# 0.1.11 検証記録

検証日：2026-10-20。開始時0.1.10、Git管理なし、AGENTS.mdなし。既存変更を保持。

## 変更と依存関係

- 未変更（元の値へ戻した場合を含む）の確定は、対象ID/遷移世代を照合して通知なしで通常表示へ戻す。本来のUI操作や新規診断は開始しない。失敗・結果不明等の通知は維持。
- 鉛筆を削除し、タイトルのclick/Enter/Spaceとアクセシビリティ名「チャット名を編集」を維持。処理中aria-busyはタイトルへ移動。鉛筆専用グリッド列を廃止し、中央タイトル/入力と右端操作を独立配置。中央要素の幅上限だけを対称に設ける。
- 編集欄・測定用span・表示タイトルのfont-family/weight/size/line-heightを共通化。現在値をwhite-space:preで測定して幅+18px、最小48px。CSS max-widthで制限し、長い値はinput内部スクロール。初期値・input・compositionupdate・設定文字サイズ・フォントreadyに限定。値とサイズのキーで不要測定を省き、入力イベントをrAFで集約。リサイズで全DOM測定しない。
- 既存の表示抑制と診断は、所有モーダルの可視性例外・帯/余白維持・エラー復帰・名称確認と依存するため保持。新たな非表示対策は追加しない。実画面の名前変更ウィンドウは既知の表示であり、ちらつき解消済みではない。

## 検証

既存95件の鉛筆操作/処理中状態の期待値をタイトル操作へ更新。追加5件：未変更/変更後復元のEnter確定・外側確定（2件）、タイトルクリック/Enter/Space、通常タイトルとのフォント一致・文字幅追従・日本語/英数/絵文字/IME・空欄最小幅・長文上限と横スクロール・1280/390/240pxで中央/非重複、非編集/待機/無関係DOM更新時に測定しないこと。

狭幅で編集欄とキャンセルの境界が接する問題を検出し、ボタン位置と対称上限を調整して間隔を確保しました。横スクロール試験はHome→Endでキャレットを移動し、ブラウザの描画更新後にscrollLeftを確認します。

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromiumで実行。

- `npm test`：単体10件PASS。
- 修正後の `npm run test:browser`：90件PASS、失敗・スキップ0。合計100件（既存95＋追加5）。
- content.js、tests/browser.test.js、core.js、popup.jsの構文確認PASS。manifest/package/popup/診断の0.1.11表記一致を確認。
- 通常時の不要測定なし、編集中文字サイズ34pxへの追従、モーダルで帯が非表示の間は文字幅を測らないことも確認対象にしました。

## 実画面の未確認点

検証用DOMとStorage模擬による確認。0.1.11の実ChatGPTでのフォント描画、実IME、長い名前のキャレット/横スクロール、拡大表示は未確認。更新後にタイトルから編集し、未変更終了の無通知、入力幅、キャンセル、Enter/外側確定、入力欄と画像ビューアの従来動作を確認してください。名前変更画面の表示は残る前提で、診断コードは引き続き利用可能です。

対象外の拡張・サンプルA・カタログ変更、commit・push・公開なし。以下は履歴です。

---

# 0.1.10 検証記録

検証日：2026-10-20。開始時manifest/packageは0.1.9、Git管理なし。既存86件のテストと限定表示抑制実装を確認。対象フォルダ内の変更を保持して更新しました。

## 保存と名称確認の切り分け

実画面で名称は変更されたのに「保存と名称更新の確認」がタイムアウトする間欠的な報告があります。コード上は、名称確認にthreadTarget（ボタン付き行の一意性）を再利用していました。古いDOM参照を固定していたわけではありませんが、再生成後のボタン欠落/構造変化に依存していました。また帯がフォールバックに使うdocument.titleを保存後確認は参照していませんでした。実画面の根本原因は診断結果を受領するまで未確定です。

新しい名称確認は対象ID・期待名を保持し、現在DOMから本文外の一致URLリンクを毎回取得。ボタンを要求せず、リンクの一時欠落/重複は待機。現在URLのIDが一致し、確定開始時と異なるdocument.titleが期待名になった場合も証拠にします。帯自身の文字を証拠にせず、document.titleを採用したときの帯もページからの値へ追従。待機開始時の即時評価で同期更新も検出します。期限延長・自動再送はしていません。

## UIと互換性

左右寄せUIを除去し、対称グリッドを保って画面中央へ固定。旧alignmentの保存値や他の設定は削除せず描画だけ中央にします。帯内保存ボタンを廃止。Enter/外側pointerクリックによる確定、変換中・composition直後Enterの抑制、keyup後の独立Enter、キャンセル、Tab非保存、重複確定防止を実装。ページのEnter/送信処理にはハンドラーを追加していません。外側クリックは観測のみでpreventDefaultせず、別チャットのリンクは確定対象外です。編集中の鉛筆は入力へフォーカス、「色・表示」は編集終了後に操作します。

利用者向け通知・ラベル・説明・文書の用語をチャットに統一。内部の保存キーと変数は維持しました。

## 診断と追加検証

名前やIDを含めない最新試行の時系列JSONをDOM属性へ保持。短いConsoleコードで名前変更後に取得可能。取得元・URLのID一致・期待値一致・リンク置換・処理段階・表示抑制・途中フレームを最大400件記録し、通信/Storage保存なし。

既存86件の観点を保持し、旧保存ボタン操作はEnter操作に、配置UI操作は旧alignmentのStorage入力＋中央表示検証に変更。追加9件：同期名称更新、遅い行再生成（ボタンなし）、document.titleだけの更新、IME確定/次Enter、外側クリック/変換確定クリック、Tab/キャンセル/鉛筆/重複確定、未変更/空白/ページEnter、別チャットリンク遷移、名称確認済みとモーダル終了タイムアウトの通知分離。結果不明・手動モーダル・画像ビューア・ちらつき途中状態は既存テストで引き続き検証します。

全体試験で、本来のダイアログのキャンセルクリックを編集の再確定として拾う問題を検出しました。モーダル/メニュー内クリックと可視モーダル中のクリックを外側確定から除外して修正し、元の失敗理由を保持することを確認しています。

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromiumで実行。

- `npm test`：単体10件PASS。
- 修正後の `npm run test:browser`：85件PASS、失敗・スキップ0。合計95件（既存86＋追加9）。
- 全体試験で検出したモーダルキャンセルの再確定問題を修正後、該当ケースと関連ケースを個別確認し、その後ブラウザ全件を再実行してPASS。
- content.js/tests/browser.test.js/core.js/popup.jsの構文確認PASS。manifest/package/popup/診断の0.1.10表記を確認。

## 実画面で必要な確認

0.1.10の間欠タイムアウト改善、ちらつき、実IMEイベントの順序、外側クリック、中央配置は実ChatGPT未確認。拡張とタブを更新後に名前を変更し、通知有無、実際の名称、ちらつきを確認して診断JSONを取得してください。その後、再読み込み後の名称保持を確認してください。検証用画面の合格を実画面での解消とは扱いません。

他の拡張・サンプルA・カタログは変更せず、commit・push・公開なし。以下は履歴です。

---

# 0.1.9 検証記録

検証日：2026-10-20

## 実画面の報告と調査根拠

0.1.8は実ChatGPTで名前変更画面がはっきり表示され、待機短縮では要求を満たしていませんでした。今回提供された実DOM情報は、同じ親内にdiv.codex-dialog-overlay[data-state=open]とdiv[role=dialog][aria-modal=true]が並ぶ構造です。0.1.7の実際の名称変更成功は確認済み、再読み込み後の永続化は未報告です。

## 対応付けと復帰

拡張の保存中、現在IDの対象行・動的IDで結び付くメニューを確認し、名前変更項目のクリック直前の全dialog/背景要素を記録。操作後に新しく現れた可視モーダルが1つ、名前変更見出し・form・元のタイトル・保存/キャンセルが一致し、同じ親に新規のopen背景が1つ、親がbody/htmlでない、背景がfixedで幅/高さともviewportの80%以上という条件で対応付けます。操作直後の同期チェックとMutationObserverで、描画前のマイクロタスクで照合・抑制します。内容が未完成なら隠しません。

対応する2要素だけにopacity:0!important、transition:none!important、animation:none!importantを設定。元の値と優先度を保持し、終了時に復元。display/visibility/hidden/inertやページ全体のCSSは変更しません。内部の表示確認は所有した要素のopacityだけを例外にし、それ以外の条件は維持。抑制した対象だけを帯・余白の退避から除外し、他モーダルは従来どおり扱います。

保存1回と対象名更新確認後、残る対象画面/背景の終了も最大3秒待機。ダイアログが先に消えて背景の終了が遅れる場合も、背景を途中で表示し直しません。例外・不明・タイムアウト・遷移では監視を解除しスタイルを復元して、本来の画面を操作可能に戻します。自動再送なし。途中で親/背景の対応が変わった場合や他モーダルが出現した場合も復元して中止します。

## 追加検証（9件）

- 新規pairで最初のrequestAnimationFrameから複数フレームを記録。dialog/背景ともopacity:0、帯は表示・余白属性は有効、入力欄の下端座標が変化しないまま保存1回・対象名更新。終了後は元のスタイルへ復元。
- 遅れて消える背景はダイアログ削除後の複数フレームもopacity:0を維持し、終了後に成功表示。
- 手動の名前変更は透明化せず、キャンセル可能。
- 背景2件、別コンテナ、操作前から存在した背景は抑制しない（3件）。
- 保存後に閉じない画面はタイムアウトで元のopacity/transitionへ復元、利用者がキャンセル可能。保存は1回、再送禁止。
- 保存可能待機中の遷移は送信0回、表示復帰。
- 別のモーダル出現は送信0回で中止し、対象も別モーダルも可視。

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromiumで実行。

- `npm test`：単体10件PASS。
- `npm run test:browser`：75件PASS（既存67＋追加8）。その実行中に追加した背景終了遅延テスト1件も個別実行でPASS。合計86件（既存77＋追加9）を確認、失敗なし。
- 背景終了遅延・既存背景・別モーダル中止の3件を最新コードで個別確認しPASS。
- content.js、tests/browser.test.js、core.js、popup.jsの構文確認PASS。manifest/package/popupの0.1.9表記一致を確認。

## 未確認点

以上は自作DOM・Storage模擬・検証用Chromiumです。実ChatGPTで0.1.9のちらつき解消、入力/保存の成立、アニメーション終了、背景の対応付けは未確認です。段階的なDOM構築で必要な内容が揃う前に描画される場合、対応付け前の表示は残ります。利用者が更新後に確認するまで「実画面で解消済み」とは扱いません。実際の背景が条件外なら、親コンテナ内のdialog/背景の件数・属性・挿入タイミングに絞って追加情報が必要です。

対象フォルダのみ変更、既存変更を保持。Git管理/AGENTS.mdなし。commit・push・公開なし。以下は旧版の記録です。

---

# 0.1.8 検証記録

検証日：2026-10-20

## 利用者の実画面結果

0.1.7は実ChatGPTで帯内編集から実際のチャット名を変更できることを利用者が確認済み。再読み込み後の永続化は未報告。0.1.8の表示改善を実ChatGPTで確認したものではありません。

## 調査と変更

保存開始→フォーカス後80ms→対象メニュー→ダイアログ→入力イベント→次タスク→保存可能確認→保存1回→名称更新、という順序を確認しました。各UIの成立確認は即時確認の後、未成立なら100ms間隔で再確認しており、その間に準備が整っても表示が残りました。ダイアログ検出時のcheckModalsは帯・枠・余白を退避し、閉じると復帰します。

0.1.8では待機中のMutationObserverでDOM更新直後に成立確認。同じ対象・状態検証、入力後の次タスク待機、3秒期限、属性以外の状態変化に対応する100ms補助確認を維持。フォーカス後80msは次タスクまでに短縮し、再検証後に操作します。待機終了時は監視・タイマーを必ず解除。ページのダイアログ/背景に一時スタイルを付ける処理は追加していません。

帯・余白の既存退避処理は維持しました。対応する背景を安全に識別するDOM情報がなく、UI操作性・エラー時の復帰を損なわずダイアログ自体を完全に消す対応は行っていません。短いダイアログ表示と退避/復帰は残ります。

## 追加の途中状態検証（4件）

- requestAnimationFrameとMutationObserverで保存途中を記録。遅延180msの保存fixtureで複数フレームのダイアログ表示（opacity:1）を確認。帯は非表示、余白は退避。準備済みメニューは次フレーム前に処理され、余白属性はfalse→trueの各1回のみ。
- 入力イベント後に保存ボタンを120ms無効化するfixtureで、ページ側の準備後にだけ保存することを確認。
- 手動で開いた名前変更ダイアログは可視でキャンセル可能。保存後に閉じないfixtureは3秒後に結果不明となり、処理中状態を解除。スタイルは元のまま、利用者がキャンセル可能。
- 保存可能待機中のチャット切替は送信0回で中止。残ったダイアログは可視でキャンセル可能、新チャットの帯へ復帰。

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromiumで実行。

- `npm test`：単体10件PASS。
- `npm run test:browser`：ブラウザ67件PASS。既存73＋追加4の合計77件、失敗・スキップ0件。
- `node --check`：content.js、tests/browser.test.js、core.js、popup.jsすべてPASS。
- manifest.json・package.json・popup.htmlのバージョン0.1.8の一致を確認。README・診断資料の現行版表記も更新し、過去の記録は保持。

## 実画面の残る確認

上記は自作DOM・Storage模擬・検証用Chromiumです。DOM更新後に処理してもChatGPT固有のアニメーション、入力状態更新、通信時間によって表示は残り得ます。実ChatGPTで更新後の保存時のちらつき・名前反映・再読み込み後の永続化、手動ダイアログ、画像ビューア退避と入力欄を確認してください。静止画や最終状態だけでちらつき解消と判定していません。

対象ディレクトリのみ変更。既存変更を保持。Git管理/AGENTS.mdなし。commit・push・公開なし。以下は旧版の記録です。

---

# 0.1.7 検証記録

検証日：2026-10-20

## 原因と修正

完全な0.1.5診断JSONを2026-10-19に受領して現行判定と照合。現在IDの行がpointer-events:none、子ボタンがautoという構造に対し、0.1.6は祖先のnoneを理由に拒否していました。検証用画面でボタンがヒット対象でも同じエラーを再現し、行のpointer-eventsだけをautoにした対照条件で編集開始できることを確認しました。この対照操作は検証用画面のみです。

0.1.7は祖先のpointer-events:noneだけでは拒否せず、ボタン自身の計算済み値を確認。画面内のボタン領域の中央でelementFromPointを実行し、ボタン自身またはその子孫へのヒットだけを許可します。SVG内のrect/pathやspanも子孫として扱います。ヒット位置をpointerdown/upの座標にも使用します。ページ側の祖先スタイルは書き換えません。既存のopacity限定対応、一意性、各種非表示/無効条件、チャット切替・IME・二重保存対策は維持しています。

## 検証内容

既存66件を変更せず、ブラウザ回帰テスト7件を追加しました。

- 親none・子auto・確認済み祖先opacity:0で、帯内編集から動的メニュー、名前変更ダイアログ、保存1回、対象名称更新まで連動。別チャットは操作せず、祖先のnone/opacity:0が維持されることも確認。
- 同じ構造で既に開いている対応メニューを再利用し、トリガーを再クリックしない。
- ボタン内SVGのrect、spanへの実際のヒットを確認して保存まで連動（2件）。
- ボタン自身none・子spanのみautoの場合は拒否。
- 編集開始前と編集開始後の別要素による遮蔽で、メニュー・保存を操作せず拒否。遮蔽解除後の明示的再試行で保存1回（2件）。

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromiumで実行。

- `npm test`：単体10件PASS。
- `npm run test:browser`：ブラウザ63件PASS。合計73件（既存66＋追加7）、失敗・スキップ0件。
- `node --check`：content.js、core.js、popup.js、tests/browser.test.jsすべてPASS。
- manifest.json・package.json・popup.htmlの0.1.7表記の一致を確認。READMEと診断手順に現行版の説明を追加し、旧版の記録は保持。

## 実画面との区別

自作DOM・Storage模擬実装・検証用Chromiumによる結果です。0.1.7の実ChatGPTのメニュー開閉、入力イベントとページ側状態の同期、保存・再読み込み後の永続化は未確認です。0.1.5の診断JSONは当時の構造を示す証拠であり、現在の実DOMを直接取得したものではありません。

利用者確認：拡張とタブを再読み込みし、通常状態/対象メニューを開いた状態で帯内編集→保存→サイドバー名更新→再読み込み後の名前を確認。キャンセル、日本語IME、入力欄・送信ボタン、画像ビューア退避、表示ON/OFFも確認してください。利用者による0.1.2の画像ビューア退避、0.1.3の入力欄改善の実画面確認結果は引き続き有効な過去の記録として保持します。

対象フォルダのみ変更。Git管理なし、AGENTS.mdなし。commit・push・公開なし。以下は当時の記述を残した旧版の検証記録です。

---

# 0.1.6 検証記録

検証日：2026-10-19

## 診断の根拠と実装

利用者の通常状態の診断：リンク1件、現在IDだけのrole=group行、アクション1件（親にも同じ1件）、20×20pxで画面内、disabled/matchesDisabled/ariaDisabled=false、ボタン自身はvisible/opacity:1/pointer-events:auto。拒否はcheckVisibility=falseのみで、原因祖先は指定されたホバー/フォーカスクラスを持つopacity:0。添付JSON本体をこの実行環境では参照できていません。報告された値とクラスを根拠にしています。

対象の一意性と操作可否を分離。対象のrole=group内の祖先に、提供された5クラスがすべてある場合だけopacity:0を許容。まずフォーカスによる表示を試し、それでもopacity:0ならCSSを書き換えず限定的に操作。ボタン自身、行自身、未知クラスのopacity:0や、非表示/無効の別条件は拒否します。既に対象メニューが開いていれば双方向の動的ID対応を確認して再利用します。

鉛筆/タイトルから帯内編集。明示的な保存/キャンセルのみ。保存は本来のダイアログの見出し/form/入力現在値/ボタンを検証し、標準setterとinput/changeイベントで値を設定した後、本来の保存を1回実行します。サイドバーの対象IDの名称更新を確認して終了します。閉じただけでは成功とせず、不明時は自動再送・その編集での再保存をしません。独自API/別名保存/認証取得なし。

## テスト

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromium 153。単体10件、ブラウザ56件、合計66件PASS。core.js/content.js/popup.jsの構文確認PASS。

旧テストの回帰観点は維持。ただし「鉛筆ですぐ本来のダイアログを開く」11件は、今回の仕様に合わせ「帯で編集し明示的な保存で連動」に更新しました。既存診断3件は0.1.5の拒否条件再現として保持。従来の入力欄/文字色/配置/Storage/モーダル/性能試験も維持しています。

直接編集UIの検証：

- 鉛筆/タイトルによる開始、帯内の入力・保存・キャンセル、Enterでは送信しないこと。
- IME合成イベント中の保存無視、キャンセルで元の名前を維持。
- ページ側の定期タイトル更新が編集中の値を壊さないこと。
- 幅240pxで全コントロールが画面内、保存連打でも1回、設定パネルを誤って開かないこと。
- モーダル退避で入力値を保持。開始前/保存中の遷移時に中止。

本来のUIとの連動を模したfixtureの検証：

- 対象外行を先に置き、role=group内の祖先だけが指定クラスでopacity:0の対象を選ぶ。メニュー→名前変更→イベント経由の入力状態更新→保存1回→対象行の名称更新確認まで実行。
- フォーカスでopacity:1になる場合と、opacity:0が残る限定例外の場合。
- 動的IDの対応、既存の対象メニューの再利用、別メニューの拒否。
- 複数行/同一行内の非表示複製、別チャット混在、disabled/aria-disabled/hidden/inert/display/visibility/pointer-events/ゼロ寸法/未知opacityの拒否。
- 本来の入力現在値不一致では入力も保存もしない。サイドバーがnative modalによりaria-hiddenでも対象構造を照合。
- メニュー無応答のタイムアウトと送信前の明示的再試行。送信後にダイアログだけ閉じた場合は結果不明、再送なし。
- 保存開始前・メニュー待機中・本来の保存後に遷移しても別チャットを操作しない。

## 実画面の未確認点

利用者により0.1.3入力欄改善と0.1.2画像ビューア退避は確認済み。0.1.6の実ChatGPT上のメニュー開閉、合成イベントの受け入れ、React等の状態反映、保存と再読込後の永続化は未確認です。fixtureの合格は実画面連動の保証ではありません。IMEはイベント模擬で実IME未検証。開いたメニューで同じ旧通知が出た原因も確定していません。

更新後、帯内編集の保存/キャンセルと実名更新、対象メニューを開いた状態、複数行IME、200%拡大、モーダル退避・入力欄を確認してください。開いたメニューでのみ失敗する場合は、その時点のトリガーとメニューの動的ID/aria属性/表示属性に絞って追加診断します。通常状態の診断の再取得は不要です。

対象外の変更、commit・push・公開はなし。Git管理・AGENTS.mdは今回もなし。既存変更を保持して対象内だけ更新しました。

---

以下は保持した過去の記録です。

# 0.1.6実装前の診断（本体0.1.5を保持）

検証日：2026-10-19

## 実画面からの報告と確定したコードの挙動

利用者は再読込後も「対象行のボタンが非表示または無効」を確認。ChatGPT側の対象メニューを開いても同じエラー。どの実要素・表示条件が原因かは未確定です。

コード上、現在IDのリンクから祖先をたどり、最初に見つけた候補行のボタンにdisplayedとdisabledを適用して拒否します。別チャットID混在は拒否していますが、非表示の複製を先に選んだ可能性は実DOMなしには否定できません。checkVisibilityはopacity/visibilityを検査し、hidden/aria-hidden/inert祖先も除外。rectCountは見る一方、ゼロ寸法・画面外・pointer-events・aria-disabledは明示条件にしていません。

対象行判定の後で既存メニューを一律拒否するため、現在のボタン拒否が発生した時点では、開いているメニューの動的対応を調べていません。既存メニューの安全な再利用は今後の実装事項です。

## 今回追加したもの

- diagnostics/rename-target.js：対象リンク、祖先の選択経路、候補ボタンごとの拒否理由と表示属性、親構造、開いたメニューの動的対応をJSON出力する読み取り専用コード。
- diagnostics/README.md：通常状態/対象メニューを開いた状態の取得手順。会話本文・入力値・ページ全体HTML・認証情報は不要。
- 読み取り専用診断のテスト3件。既存53件と本体ファイルは変更せず維持。

## 検証結果

単体10件、ブラウザ46件（既存43件＋診断3件）、合計56件PASS。診断コード構文確認PASS。Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromium 153。

追加試験：

1. 選ばれる非表示ボタンと、親にある表示中の複製ボタンを分けて報告。表示中メニューのトリガーが後者だと特定。実行前後のDOM同一、クリック0回、Storage変更なし、会話本文/入力値/タイトル文字列が出力されないことを確認。
2. aria-hidden祖先、disabled、aria-disabledを分けて記録。0.1.5がaria-disabled単独では拒否しない点も診断上で示す（操作は行わない）。
3. 別チャット混在の停止理由と、既存メニューの拒否条件を報告。ネイティブUIを変更しないことを確認。

いずれも自作fixtureによる検証。実ChatGPTで診断コードを実行した結果は未取得。帯の直接編集UIと本来の保存への連動は未実装・未検証です。追加DOMが必要な段階のため0.1.6完成とは扱わず、manifest/package/popupの版は0.1.5を維持します。

対象外の変更、commit・push・公開はなし。Git管理とAGENTS.mdは今回もなし。

---

以下は保持した過去の記録です。

# 0.1.5 検証記録

検証日：2026-10-19

## 調査結果

manifest.json、現在のイベント接続、名前変更処理、既存テストを確認。Git管理なし、対象/上位のAGENTS.mdなし。既存変更・49件を保持し対象フォルダ内だけを更新。commit・push・公開なし。

利用者報告：鉛筆で色設定パネルが開き、名前変更ダイアログは開かない。色・表示は再クリックで閉じるが鉛筆では変化がない。

- イベント接続：鉛筆はopenRename、色・表示はsetOpen(!panelOpen)。誤接続はソース上なし。
- 伝播・領域：両ボタンは別の兄弟要素。片方のイベントがもう片方へ伝播する構造ではない。追加の幅240px座標クリック試験でも混同・重なりなし。実画面の領域は未取得。
- 失敗表示：旧catchでrename-statusへ理由を設定しsetOpen(true)していたことを確認。これが設定パネルを開く明確な経路。同じ失敗を繰り返しても同じパネル/文言となる。
- 実行中フラグ：旧版もfinallyでrenaming=falseとdisabled=falseに戻す。解除漏れを原因とは断定しない。修正後も成功・失敗・タイムアウトで解除を検証。
- 対象検出：旧文言「現在のチャットとボタンの対応を一意に確認できません。サイドバーの対象行を表示してください。」はリンクなし、非表示、同一行判定失敗、ボタン非表示/無効、複数候補をまとめていた。実画面でどの条件かは未確認。

## 修正

rename-statusを色設定パネルから鉛筆の下の独立通知へ移動。catchは専用通知に失敗段階と理由を表示し、色パネルは開かない。通知を閉じる操作、開始中の表示とaria-busyを追加。成功時は通知を消す。ローカル別名・独自保存・API通信は追加しない。

対象行の診断をリンクなし/非表示、単独行を確認できない、ボタン非表示/無効、複数候補に分けた。元の安全条件、途中遷移中止、モーダル退避、多重開始防止は保持。

## 検証

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromium 153。

- 単体10件PASS。
- ブラウザ43件PASS（既存39件＋追加4件）。合計53件PASS。
- core.js/content.js/popup.js構文確認PASS。

追加4件：

1. 実際に鉛筆をクリックし、対象行判定失敗時の専用理由表示、設定パネルが閉じたまま、名前変更ダイアログなしを確認。繰り返し押しても実行中状態が解除され、色・表示は独立して開閉。DOM条件を直した後の再試行でダイアログが開き、キャンセル後にも再開始できる。
2. メニュー応答なしでタイムアウト、段階表示、設定パネルが閉じたまま、disabled/aria-busy解除。応答を直して再試行し成功。
3. 幅240pxの鉛筆/色・表示の矩形が分離し、座標クリックでそれぞれの機能が動く。処理中の二度クリックでアクションは1回のみ。
4. opacity=0の対象ボタンを検出して専用理由を表示。通知の×が設定パネルに影響せず、表示条件を直して再試行できる。

従来49件は削除・緩和していません。上記は自作DOMとStorage模擬実装であり、実際のChatGPTでの結果ではありません。

## 実画面確認・追加DOM

0.1.5の実画面連動は未確認。更新後は新しい専用通知の全文を確認してください。失敗箇所を確定するには表示された段階に応じたDOMが必要です。

対象行：現在チャットのaとアクションボタンの最小共通祖先、その1段上の親、隣の1行。非表示/無効の場合は対象ボタンと祖先の表示属性/スタイルも必要です。メニュー段階：押下後のボタンの動的id・aria-controls・aria-expanded、メニューのid・aria-labelledby・role・data-overlay-owner。ダイアログ段階：見出し、form、入力、保存/キャンセル。

更新後、鉛筆→本来のダイアログ、キャンセル/保存、失敗理由の表示と再試行、色・表示の独立した開閉を確認してください。入力欄、モーダル退避、文字色/配置、200%拡大の維持も実画面の確認対象です。

---

以下は保持した過去の検証記録です。

# 0.1.4 検証記録

検証日：2026-10-19

## 実画面報告と変更

利用者が0.1.3の入力欄改善を確認済み。0.1.2の画像ビューア中の帯退避も確認済み。今回、利用者からアクションボタン、slate-sidebarメニュー、名前変更ダイアログのDOMが提供されました。実際のクリック連動は未確認です。

対象のmanifest.jsonと既存実装を確認。Git管理なし、AGENTS.mdなし。既存41件と既存変更を保持。対象外の拡張・サンプルA・カタログ変更、commit・push・公開なし。

丸い装飾を削除し、鉛筆ボタンを追加。現在IDのリンクと同じ単独行にあるボタンのみを選び、動的aria-controls/aria-labelledbyを相互照合して「名前を変更」をクリック。本来のダイアログを検証後、保存/キャンセルは利用者へ委ねます。非公開API、認証取得、別名保存、独自編集フォーム、IME/送信処理の介入はなし。

## 自動検証

Windows / Node.js 22.16.0 / Playwright 1.62.1 / Chromium 153。自作fixtureとStorage模擬実装。

- 単体10件PASS。
- ブラウザ39件PASS（既存31件＋追加8件）。合計49件。
- core.js/content.js/popup.js構文確認PASS。

追加8件：

1. 別チャットのボタンを先に配置し、動的IDの対応で現在チャットのみを選択。本来の保存後にページ名へ追従、Storage書き込みなし、削除項目をクリックしない、装飾なし。
2. 日本語IMEイベントで拡張が保存しない、キャンセルで元のタイトル維持、保存成功と表示しない。
3. 現在IDの行が重複した場合はクリック前に中止。
4. 複数チャットを含む共通祖先のボタンを対象として選ばない。
5. メニュー待機中のチャット変更で中止、多重開始を抑止。
6. メニューの動的IDの対応不一致でタイムアウト、他項目をクリックしない。
7. 既存モーダル中はプログラムからの開始でもクリックしない。
8. 無関係なアニメーション30回と配置設定変更で、main/シェル/root/formへの追加getComputedStyle呼び出し0回。入力欄の操作も維持。

既存の文字色・配置・保存互換性、幅240/390/1280px、入れ子のviewport高、複数行入力、モーダル退避、スクロール、表示ON/OFFも回帰検証します。

## 性能調査の範囲

行番号だけで原因を決めていません。旧コードの無条件animationend/transitionend→requestAnimationFrame→refreshShells経路と、補正不要な祖先を毎回再測定する経路を確認しました。変更フラグと対象祖先へのイベント絞り込みで不要な再測定を削減しました。実画面のConsole警告60〜74ms/Forced reflowは再現・時間計測しておらず、解消の断定はしません。モーダル開始時のスクロール位置取得は従来どおり残ります。

## 必要なDOM・実画面確認

対象行の構造は引き続き未確認。必要な追加DOMは、現在IDのa要素とアクションボタンの最小共通祖先、さらに1段上の親と隣の1行が分かるouterHTMLです。個人情報を除き、href/role/ariaと階層を残してください。対応が曖昧なら中止するため、実画面で利用できない場合があります。

更新後に拡張とChatGPTタブを再読み込みし、複数チャットが見える状態で鉛筆が正しい名前変更画面を開くこと、保存後の追従、キャンセル、ダイアログ退避を確認してください。入力欄、200%拡大、帯40/88px、Consoleの警告頻度も確認対象です。fixtureのIMEイベント試験は実IME入力の保証ではありません。

---

以下は保持した過去の記録です。

# 0.1.3 検証記録

検証日：2026-10-19

## 利用者からの実画面結果

- 0.1.2で画像ビューア中に帯が消えることは確認済みとの報告。
- 通常会話で入力欄が下にはみ出し、最下部までスクロールしても全体を表示できないとの報告。
- 今回こちらからは添付画像を確認できず、実DOMも未取得。画像ビューア開閉との因果関係は未確定。

## 事前確認・再現と修正

manifest.jsonあり。Git管理なし。対象と上位のAGENTS.mdなし。既存36件のテストと既存ファイルを保持して対象内だけを変更。バージョン表記は0.1.3。commit・push・公開なし。

旧処理はbody直下しか高さを補正しないため、入れ子の100vh/100dvh/min-heightのシェルに帯高が上乗せされ、overflow:hiddenで入力欄が切れる条件を再現。修正前の追加テスト2件はFAIL。画面高900pxに対し入力欄下端948px、ヒットテストfalseを確認しました。モーダルを開く前に失敗します。

main/入力欄の祖先に限定し、viewport高と一致するheight/min-heightや既知の画面高クラスを検出して補正。すべて同じ利用可能高に揃え、帯高の二重減算は行いません。通常更新では補正を保持し、DOM差し替え・関連class/style変更・リサイズをまとめて再評価。モーダル/表示OFF時は解除。入力欄の移動・複製、下余白の追加、反復自動スクロールはなし。

## テスト

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 検証用Chromium 153。

- 単体10件PASS。
- ブラウザ31件PASS（既存26件＋追加5件）。合計41件。
- core.js/content.js/popup.js構文確認PASS。

追加した条件：

1. 多重の100vh/100dvhとmin-height、overflow:hidden、独立したサイドバー/会話スクロール、下部の入力form。1280×900、640×450、390×600、帯40/88px、64/160pxの入力欄、途中/最下部で検証。
2. モーダル開閉とOFF/ONで入力欄・送信ボタンが表示され、元の入力欄DOMが同一であること。
3. 会話末尾で設定変更・モーダル開閉後もscrollTopが保持されること。
4. 会話領域DOM差し替えに追従し、本文内の無関係なviewport高要素は変更しないこと。
5. contenteditable入力欄に20行の日本語を入れ、狭い画面とモーダル開閉後も操作できること。

入力欄・送信ボタンの全矩形がviewport内かをクリック前に検査し、elementFromPointのヒットテストとPlaywrightによる実クリック、fixture内の送信ハンドラー発火を確認します。実際のChatGPTへメッセージは送信していません。

旧テストが見逃した理由：body直下の単一シェルで高さ補正が必ず当たる構造だったこと、入れ子のmin-heightとoverflow:hiddenの組み合わせがなかったこと、入力欄下端だけの検査で送信ボタンの範囲/クリックを検証していなかったこと。

## タイトル変更・実画面の未確認点

ブラウザ操作機能のインベントリはapps=[]、browsers=[]で、ログイン済み実画面にアクセスできませんでした。タイトル変更の実UI連動は実証できず、編集ボタンも追加していません。ローカル別名や非公開APIは追加なし。必要情報は、実際の名前変更メニュー/編集欄/保存・キャンセル/成功後の反映を確認できる接続済みChatGPTタブ、または個人情報を除いたDOMと手順です。

今回のテストは自作fixture＋Storage模擬であり、0.1.3の実画面修正完了を保証しません。640×450 CSS pxは200%時相当の表示領域を想定していますが、実Chromeのズーム操作は未実施。独自calc式、異なるDOM、OS倍率、IME、Enter Key Control併用は実画面で確認が必要です。

利用者の確認：拡張/ChatGPTタブを再読み込みし、帯40/88px、ウィンドウリサイズ、200%ズーム、複数行入力で入力欄全体と送信ボタンを確認。会話/サイドバーのスクロール、画像ビューア開閉、OFF/ON前後も確認してください。問題が残る場合は、画面サイズ・帯高・ズーム率と入力欄からアプリシェルまでの個人情報を除いたDOM/CSSが原因の絞り込みに必要です。

---

以下は保持した過去の検証記録です。

# 0.1.2 検証記録

検証日：2026-10-19

## 対象・原因・変更

対象フォルダにmanifest.jsonあり。Git管理はなく、対象および上位フォルダのAGENTS.mdもなし。既存の0.1.1とテスト29件を保持して修正しました。他拡張・サンプルA・カタログは変更せず、commit・push・公開なし。実行時依存・権限・外部通信の追加なし。

インストール中の版は特定していません。0.1.1のソースでは拡張ホストのz-indexが2147483600、bodyがtransformを持つ固定領域になっており、通常DOMのビューアより拡張が前面に来ることがあり得ます。単にz-indexを下げず、モーダル中は拡張ホスト全体と余白処理を一時解除します。保存値と全体ON/OFFには書き込みません。最後の表示中モーダルが閉じると、現在のチャットの設定で復帰します。拡張設定パネルは閉じた状態で戻り、フォーカスを奪いません。

判定は表示中のnative dialog:modal、aria-modal=trueを持つdialog/role=dialog/role=alertdialog、およびモーダル指定がないfixedダイアログで幅・高さがviewportの80%以上のもの。aria-modal=falseのものは全画面補助判定から除外。祖先も含むhidden/aria-hidden/display/visibility/opacity/content-visibility、面積ゼロ、画面外を除外します。拡張自身のShadow DOMには探索しません。

bodyの関連属性と子要素の追加/削除を監視し、ダイアログ候補に関係する更新を1描画フレームにまとめます。拡張UIとhtmlへのレイアウト書き込みは監視外。既存600ms巡回でCSS由来の変化も補完。ページのキーイベントやChatGPTのz-indexには介入しません。

## テスト結果

Windows / Node.js 22.16.0 / Playwright 1.62.1 / 既存検証用Chromium 153.0.8010.12。

- `npm test`：10件PASS。
- `npm run test:browser`：26件PASS（既存19件＋追加7件）。
- 合計36件PASS。既存29件を削除・緩和していません。
- core.js / content.js / popup.js の `node --check`：PASS。

追加回帰テスト：

1. 帯・枠・開いていた設定パネルを隠し、余白属性とbody transformを解除。上端のDownloadボタンを実際にクリック。保存値不変、色・文字色・中央配置・88pxの高さ・文字サイズ・枠幅が復帰。
2. 2つのモーダルがある間は退避を継続。DOMに残るhiddenダイアログは除外し、再表示に追従。
3. 非表示祖先、opacityゼロ、content-visibility、画面外、aria-hidden、閉じたdialog、通常メニュー、サイドパネル、拡張設定パネルを誤検出しない。
4. native showModal、モーダル属性がない全画面fixedダイアログを検出。native showによる非モーダルは除外。
5. モーダル中にチャット変更後、新チャットの設定で復帰。全体OFFでは閉じても表示しない。
6. 帯40/88px、会話スクロール途中/末尾で開閉後のスクロール位置・領域高を保持し、入力内容・入力欄の画面内配置を維持。
7. ページ側Escape処理で閉じられ、html属性の更新が監視ループにならない。

## 実画面での未確認点と確認手順

すべて自作fixtureとStorage模擬実装による検証です。今回のメッセージではスクリーンショット添付を確認できず、ログイン済みChatGPTのDOMも取得していません。実画面での画像ビューアの属性・大きさ・ポータル位置は未確認です。未標識の小さいダイアログ、iframe/Shadow DOM内の独自ビューアは検出できない場合があります。アプリ独自のスクロール復元やアニメーションとの組み合わせも未確認です。

1. 拡張機能管理で本拡張を再読み込みし、ChatGPTタブを更新する。
2. 生成画像を開いて帯・枠・設定パネルが消え、上部に空白が残らず、ダウンロード・閉じる操作ができることを確認する。
3. 帯40/88px、会話途中/末尾でビューアを開閉し、スクロール位置・入力欄・帯の復帰を確認する。
4. 複数モーダル、通常メニュー、モーダル中のチャット切替、表示OFF時を確認する。
5. 狭い画面・200%拡大、Enter Key Control併用時のIME・改行・送信も確認する。

---

以下は保持した0.1.1時点の検証記録です。

# 0.1.1 検証記録

検証日：2026-10-19

## 対象と事前確認

対象はこのフォルダだけ。manifest.jsonあり。Git管理なし。対象と上位フォルダにAGENTS.mdなし。既存のファイルをベースに更新し、他拡張・サンプルA・カタログは変更していません。commit・push・ストア提出なし。

開始時の単体テスト7件PASS。ブラウザテストはPlaywright未導入で起動できなかったため、既存package.jsonの開発依存だけを対象内node_modulesへ導入しました。実行時依存の追加なし。

## 自動検証

Windows、Node.js 22.16.0、Playwright 1.62.1、既存の検証用Chromium 153.0.8010.12を使用。

- `npm test`：10件PASS（既存7件＋追加3件）。
- `npm run test:browser`：19件PASS（既存12件＋追加7件）。
- `node --check core.js`、`content.js`、`popup.js`：PASS。

単体テスト：白・黒・グレー・鮮やかな色・淡い色・既定パレットで色計算、決定性、有彩色、4.5:1以上を確認。さらにRGB空間の4,096サンプルでコントラスト条件を確認。旧設定保持、新項目の型・許容値、モード別の色選択も確認しました。フォールバック分岐は実装していますが、今回の色サンプルでは有彩色が得られるため、フォールバックに入る入力は確認していません。

ブラウザテスト：新項目の保存・再読込・別タブ同期・リセット、帯変更時の目立つ色の再計算と自由な文字色の維持、白黒へ戻す操作、旧設定の遅延読込中の編集、古い読込より新しいStorageイベントを優先する処理、チャット切替直後の誤保存防止、既存の非同期保存・切替・エラー表示を確認しました。

配置テスト：幅1280/390/240 CSS pxで左・中央・右寄せ、画面中央との一致、タイトル省略、全文の確認、設定ボタンとの非重複。検証中に狭幅で日本語ボタンの幅が予約幅を超える問題を検出し、左右同幅の予約を80pxに修正後PASS。長いタイトルは0.6秒の更新処理を待って判定します。

レイアウトテスト：通常のアプリシェルに加え、固定サイドバー・固定ヘッダー・固定入力欄を仮定したfixtureを使用。帯40/56/88pxに対する位置・画面内の入力欄・シェルの高さ、OFF時の座標とtransformの復元、会話領域のスクロール、無関係な入れ子のh-dvhを変更しないことを確認しました。

## 実画面との区別・未確認点

利用者による0.1.0の実際のChatGPTへの導入・表示確認は済んでいます。今回の0.1.1の自動テストは自作DOMとChrome Storageの模擬実装です。実際のChatGPT全体の動作保証ではありません。今回、ログイン済み実画面のDOMや画像を取得していません。

body配下にアプリシェルがあり、固定UIもその子孫であるDOMを想定。旧方式のbody上マージンがviewport基準のfixed要素に効かないことを原因候補として対応しました。実画面での原因確定は未実施です。bodyを帯の下の固定領域とし、transformでfixed子孫の基準も移しています。入れ子のviewport高シェルやtop layer、独自transformとの相互作用は実画面で未確認です。

幅240pxのテストは拡大時の狭いCSS viewportを想定したものです。Chromeの実際のズーム操作、OS表示倍率、モバイルのソフトウェアキーボードの検証ではありません。Enter Key Controlとの併用、IME、実際の送信は未実施。ページ全体のキーイベントや送信処理には追加介入していません。

## 利用者による0.1.1の確認

1. Chrome拡張機能管理で本拡張を再読み込みし、ChatGPTタブを更新する。
2. 帯40/88pxで「新しいチャット」・サイドバー開閉・ヘッダー・入力欄が隠れず、会話スクロールが使えることを確認する。
3. 文字色3モード、帯の色変更、タイトル左/中央/右と長いタイトルの全文を確認する。
4. 狭いウィンドウと200%ズームで設定ボタンとパネルを操作する。
5. 同じチャットの2タブへの反映、別チャットへの切替、再読込、リセットを確認する。
6. OFFで元のレイアウトへ戻り、ONで復元することを確認する。
7. Enter Key Control有効時に日本語IME・改行・送信が従来どおり動くことを確認する。
