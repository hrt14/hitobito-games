# 預けて、寝る。 — Quality Report

## Test environment
- Browser/device: Chromium 1194 (Playwright, headless), viewport 390×844 / deviceScaleFactor 2 / isMobile+hasTouch (iPhone相当)
- Viewport: 390×844
- Build/commit: ローカル作業ツリー（`apps/azukete-neru/` 単体を `python3 -m http.server` で提供して検証、加えて `npm run build:firebase` の `.dist/firebase/apps/azukete-neru/` も同条件で確認）
- Production URL: 未デプロイのため該当なし

## First-time clarity
- Status: PASS
- Observed evidence: 初回訪問で390px幅・横スクロールなし（overflow=0px）。タイトル「預けて、寝る。」、リード文「今すぐ答えを出さなくていい。今夜の担当から、外すだけ。」、忙しさスライダー、CTA「預け先を選ぶ」のみが1画面に収まり、説明を読まなくても次の操作（スライダーを動かす→ボタンを押す）が視覚的に分かる状態をスクリーンショットで確認した。

## Main interaction
- Status: PASS
- Observed evidence: カテゴリチップ「仕事」をタップ→「預ける」タップでカードが右へ飛び、預けた件数が0→1に即時反映。自由記入「明日の会議が不安」でも同様に2へ増加。タップ操作に加えてポインタードラッグでの左右スワイプ分岐（預ける/今すぐ一手）も実装し、動作確認済み。

## Wrong / failure path
- Status: PASS
- Observed evidence: チップ未選択・未入力の状態では「今すぐ一手」「預ける」の両ボタンが disabled になり、誤って空の考えを送信できないことを確認。カード送信後にフォームがリセットされた直後も、再度何も選ばない限りボタンは disabled のままであることを確認した。

## Correct / success path
- Status: PASS
- Observed evidence: 「もう浮かばない」で休止画面へ進むと、預けた件数（2件）と選んだ枠（明日の朝）が反映された文言が表示され、呼吸アニメーション画面→頭の忙しさ再評価（Beforeと同じ値からスタートし、改善方向へアンカリングしない設計を確認）→結果画面まで一連の完走を確認。結果画面にBefore→After・預けた件数・枠・今夜のルールが表示された。

## Back / exit
- Status: PASS
- Observed evidence: 全画面共通のヘッダーに「⌂ LEVEL UP」ホームリンク（`href="/"`）が常時表示されることを確認。本アプリは他のLEVEL UPミニアプリと同様にホームリンクからの離脱のみをサポートするシングルページ構成で、ブラウザの戻るボタンによる画面内ステップ巻き戻しは対象外（既存アプリ群と同一の設計）。

## Reload
- Status: PASS
- Observed evidence: セッション完了後にページをリロードすると、開始画面に戻りつつ localStorage から `NIGHTS 1` の統計が復元されて表示されることを確認した。

## Revisit
- Status: PASS
- Observed evidence: 保存済みセッションの日付を過去日付に書き換えて再読み込みすると、開始画面上部に「前回、預けたもの」の再チェックカードが自動表示され、「仕事」「明日の会議が不安」の2件が一覧された。「もう平気」をタップすると該当行が resolved 表示（グレーアウト＋ボタン無効化）になることを確認した。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: 390px幅で全画面において横スクロール発生なし（overflow=0px、ソース版・ビルド版の両方で確認）。主要ボタン（primary-btn, choice, slot-grid button, chip-grid button）は最小44px相当のタップ領域を確保。`npm run build:firebase` のモバイルタイポグラフィ検証（`validate-levelup-mobile-typography.mjs`）でも本アプリ含む全106 HTMLファイルが12px未満のフォントサイズなしと確認された。

## Production verification
- Status: NOT REQUIRED
- Observed evidence: `npm run build:firebase` を実行し、LEVEL UPの本番ビルドパイプライン（`validate-firebase-bundle.mjs` 等の全検証ステップ）が本アプリ込みで正常終了することを確認した（`[Firebase validation] OK: 83 curated LEVEL UP games...`）。ただし実際の `firebase deploy` は本セッションでは未実施であり、`levelup.hitobito.jp` での本番確認はまだ行っていない。`HOSTING_POLICY.md` に従い、公開デプロイはユーザーの了承を得たうえで別途実施する。

## Final scores
Clarity: 9/10
Usefulness: 8/10
Interaction quality: 8/10
Uniqueness: 8/10
Repeat value: 8/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 就寝前に複数の考え事がループする状況は繰り返し起きるものであり、「明日の枠に預けるだけでいい」という短い操作と、翌晩の再チェックで「預けたものは実際に処理された」と実感できる設計のため、同じ場面が来るたびに開き直す動機がある。

## Remaining issues
- 実機（実際のiPhone/Android）での操作感・振動・音は未検証（Playwrightのエミュレーションのみ）。
- 本番Firebaseへのデプロイと`levelup.hitobito.jp`上での実地確認は未実施（ユーザー承認後に実施予定）。
- 「枠（朝/昼/夜/週末）」は日付単位の簡易判定で「過去日付なら再チェック対象」としており、時刻単位の厳密な期限管理は行っていない（設計上の意図的な簡略化、SPEC.mdに記載）。
