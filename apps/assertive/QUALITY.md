# 言いたいことを、ちゃんと言える。 — Quality Report

## Test environment
- Browser/device: Playwright 1.55.0 / Chromium 140 on GitHub Actions Ubuntu 24.04
- Viewport: desktop 1280×900 / mobile touch 390×844, deviceScaleFactor 2
- Build/commit: c2c9e643883d6cf11a752547c1dd667f444dded0 browser verification run 32580403359
- Production URL (if production verification is required): https://levelup.hitobito.jp/apps/assertive/

## First-time clarity
- Status: PASS
- Observed evidence: 初回表示でタイトル「言いたいことを、ちゃんと言える。」、対象行動「断る。頼む。反対する。やめてほしいと言う。」、主操作「1分練習を始める」を実ブラウザで確認。自動テストでタイトル・説明文・開始ボタンの可視性を検証した。

## Main interaction
- Status: PASS
- Observed evidence: 4ラウンドすべてで、反射カードを外す → 事実・自分の立場・要望／境界の3要素を組む → 声に出すステップ → 相手の押し返しに2段階で返す → ラウンド結果、の全フローをローカルと本番のChromiumで完走した。

## Wrong / failure path
- Status: PASS
- Observed evidence: 第1ラウンドで意図的に不適切な返答断片と押し返し返答を選択し、理由を含む警告フィードバックが表示され、そのまま正しい順序へ修正して完走できることを確認した。

## Correct / success path
- Status: PASS
- Observed evidence: 各ラウンドで3つの返答スロットを正しい順に埋め、押し返し後の2つの返答も通し、4ラウンド終了後にセッション結果・技能別結果まで到達した。

## Back / exit
- Status: PASS
- Observed evidence: 練習開始後にヘッダーの「最初から」を操作し、ホーム画面へ安全に戻れることをブラウザテストで確認した。ホームへの戻るタップ領域も44px以上を確認した。

## Reload
- Status: PASS
- Observed evidence: 4ラウンド完了後にページを再読み込みし、アプリが正常にホームへ戻り、保存済み履歴を読めることを確認した。

## Revisit
- Status: PASS
- Observed evidence: 完了時に `hitobito.assertive.stats.v1` へセッション数と技能別実績が保存され、再読み込み後に「累計 1セッション」の履歴表示が出ることを確認した。次回シナリオ選択では過去の弱い技能を優先する実装になっている。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: 390×844のタッチ環境で横スクロールが発生しないこと、開始ボタン高58px以上、戻る操作44px以上を自動測定。開始 → 反射カード排除 → 返答組み立てまで操作し、モバイル画面のスクリーンショットをCI証跡として保存した。

## Production verification
- Status: PASS
- Observed evidence: 2026-08-22、`https://levelup.hitobito.jp/apps/assertive/` と `app.js` が期待する新ソースで公開されていることをcurlで確認後、同じ本番URLにPlaywrightでアクセスし、PCの4ラウンド完走・誤答復帰・保存／再訪と390pxモバイル操作をすべてPASSした。GitHub Actions run: 32580403359。

## Final scores
Clarity: 9/10
Usefulness: 9/10
Interaction quality: 8/10
Uniqueness: 8/10
Repeat value: 8/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 実際の会話と同じ「反射を止める → 自分の線を言葉にする → 相手に押し返されても戻る」を短時間で反復でき、仕事・家族・友人・取引先の10場面から日替わりかつ苦手優先で出るため、会話前の練習にも日常の反射づくりにも再利用する理由がある。

## Remaining issues
- 発声ステップは自己申告で、音声認識による発話内容の判定は行っていない。
- 自動ブラウザ確認はChromiumであり、物理iPhone上のSafari実機テストではない。
- 上記は現在の中核体験を妨げる不具合ではなく、将来の検証・拡張候補として残す。
