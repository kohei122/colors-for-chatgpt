# Colors for ChatGPT 1.0.1 リリース準備（2026-10-28）

## 変更内容

通常チャット／Workの上部tooltipが帯に重なる問題と、Workフォルダーの下側表示を修正。button、button直上spanのARIA所有者、span[role="img"]の操作元判定を共通化し、旧absolute／専用fixed構造の配置・監視・復元へ接続した。座標系を考慮して操作元下端+6pxへ補正し、ネイティブtransformを保持する。

表示待ち・補正・中止を分離し、古い予約処理、ARIA競合、ID変更、inert化、対象交換、例外、終了・OFF・遷移時の復元を整理。ページ側の上書きを保護し、animation/transitionの個別指定を保持する。更新回数に上限を設ける。診断は観測・構造別評価・製品内部の未確認事項を区別する。

対応範囲は既存の上部領域・一意なARIA・旧absolute／検証済み専用fixedラッパーに限定する。新しい祖先探索、対応構造の拡大、bodyレイアウト変更、権限追加、代替tooltipは含まない。将来のDOM/CSS変更すべてへの対応は保証しない。

manifest、package、lock、現行診断の版参照を1.0.1へ整合。過去の記録は保持した。7言語のChrome／Edge共通更新説明を `store-listing/*/release-notes-1.0.1.txt` に追加した。翻訳のネイティブ話者レビューは未実施。

## 作業環境・保護

Windows / PowerShell。製品は `C:\Users\kohei_marusin\Documents\chrome-extensions\colors-for-chatgpt`、main、開始HEAD `1ac3d328785930b68606c790be688695790ba367`。origin/mainと一致。未commitの製品修正・診断・fixture・テスト・設計記録を保持し、今回のリリースに含めた。

LPは隣接 `marusin-extension-catalog`、main、HEAD `a1245350b7626ba28a5fd0eb223af886948f6d24`、開始時差分なし。LPのファイル変更なし。

## 検証

全件回帰は15テストファイル・335件PASS（失敗・キャンセル・スキップ0）。詳細はVALIDATION.mdの1.0.1記録を参照。検証用Chromiumの模擬ページによる回帰と、実機の利用者報告は区別する。

構文（JS/CJS、Python AST）、JSON、翻訳再生成一致、7言語キー・置換値・参照整合、tooltip生成コード一致、git diff --checkを確認。`tools/tooltip-policy.js` が判定正本で、`python tools/sync-tooltip-policy.py --check` を梱包の必須チェックにした。製品が使うコードはcontent.jsへ埋め込み済み。toolsをZIPへ入れる必要はなく、追加の実行時依存はない。

既存の梱包スクリプトの20ファイル許可リストを維持。LICENSE、ZIP直下manifest、manifest/popup参照先、CRC、元ファイル完全一致、SHA-256を確認。別の一時フォルダへ展開し、そこから実際の拡張APIを使って読込検証した。製品名・1.0.1表示・4アイコン・7言語popup・storage権限・content scriptと、梱包済みfixedボタン／フォルダーの下側表示・hover終了復元がPASS。実ChatGPT接続の検証ではない。

## ZIP

- パス：`C:\Users\kohei_marusin\Documents\chrome-extensions\colors-for-chatgpt\releases\colors-for-chatgpt-1.0.1.zip`
- サイズ：71,501 bytes、20ファイル。
- SHA-256：`e1fced567f14705c67c50878207c9a33ac500f18396eb1a0b68dd896dea43a38`
- 一覧：`releases/colors-for-chatgpt-1.0.1.files.txt`。
- 内容：LICENSE、manifest.json、core.js、content.js、i18n.js、i18n-data.js、popup.html/css/js、7言語の_locales/*/messages.json、icons/icon16/32/48/128.png。
- 1.0.0 ZIP（69,439 bytes、SHA-256 `02639e4fcfc9a79dc293eaf628d814aad204bcc12171937f7ad27d4ff625fae9`）は保持。
- ZIP・展開検証JSON・画像・ログは既存.gitignore方針でGit対象外。

## LP・公開の扱い

extensions.json、topics.json、日英情報、機能・制限・storage権限、ストアリンク、SEO・構造化データを確認。既存の1.0.0公開Newsは履歴として保持する。今回の修正は機能・権限・リンクを変えず、LPにバージョン項目もないため、LP変更・News追加・共通構造/CMS追加・Wix手作業は不要。

LPのvalidate-catalog（6製品）、validate-news（15記事）、test-wix-catalog、test-wix-news、diff --checkはPASS。日英・ストアリンク・canonical/hreflang/OG/Twitter・SoftwareApplication/FAQPage・News構造化データを既存テストで確認した。Wix現行設定や公開実画面の再確認は行っていない。

両ストアURLの取得は失敗し、現在のストア版番号を独立確認できなかった。1.0.1は利用者の指示どおり両ストア未公開として扱う。GitHubへの通常pushは、Wix反映・ストア公開と別。ローカル／取得したorigin/mainに.github workflowなし。Actionsの追加・変更・手動起動は行わない。GitHub Release作成、ストア入力・アップロード・審査提出・公開操作は対象外。

## 実機状況と残る確認

最新修正後の通常／Work「…」、Workフォルダーは利用者実機で機能OKの報告を受領。ズーム・キーボード操作など個別に報告されていない条件は実機未確認。今回のZIP展開物そのものの実ChatGPT確認も別途必要。共有ボタンはhoverでtooltipが出ないため採取対象外。

追加確認時は、展開した1.0.1を開発者モードで読み込み、通常チャット／Workで「…」、Workでフォルダーへhoverし、下端+6px付近に表示されて帯に重ならず、hover終了で復元することを確認する。画面移動・OFF後の残留がないことを確認し、キーボードfocus・ズーム・リサイズは実施条件を明記して別々に記録する。本文・メニュー・モーダルへの影響も確認する。
