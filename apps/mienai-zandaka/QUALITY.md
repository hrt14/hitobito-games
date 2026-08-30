# 見えない残高 — Quality Report

## Test environment
- Browser/device: UNVERIFIED — GitHub Actions Playwright mobile testを実行予定
- Viewport: 390x844 planned
- Build/commit: branch `app-mienai-zandaka`
- Production URL (if production verification is required): https://levelup.hitobito.jp/apps/mienai-zandaka/

## First-time clarity
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。静的仕様上はタイトル、大きな残高、「ひとつ積む」「気づいたことがある」をファーストビューに配置。

## Main interaction
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。積む→カテゴリ選択→残高+1→光の粒・波紋・短い音/振動の経路を実装。

## Wrong / failure path
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。気づき項目は確定前に旧残高→新残高を提示し、戻る／閉じる／Escapeで取り消せる設計。

## Correct / success path
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。5から半減した場合は `floor(5/2)=2`、積んだ総数は減らない設計。

## Back / exit
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。各ボトムシートに閉じる操作、背景タップ、Escapeを実装。

## Reload
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。localStorage保存を実装。

## Revisit
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。日付が変わると今日の積み数のみ0へ戻し、現在残高・総数・気づき回数は維持する設計。

## Mobile readability and tap targets
- Status: UNVERIFIED
- Observed evidence: 実ブラウザテスト前。主操作は60px、副操作は60px、選択肢は原則58〜68px以上に設計。

## Production verification
- Status: UNVERIFIED
- Observed evidence: main反映・Firebaseデプロイ後に確認予定。

## Final scores
Clarity: 0/10
Usefulness: 0/10
Interaction quality: 0/10
Uniqueness: 0/10
Repeat value: 0/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: UNVERIFIED
Reason: 実ブラウザで一連の操作を確認してから判断する。

## Remaining issues
- Playwrightで初回、積む、半減、取消、リロード、再訪、390x844表示を実測する。
- main反映後にFirebase本番URLとトップページ掲載を確認する。
- 実測結果に基づいて5項目を再採点し、品質ゲートを通す。
