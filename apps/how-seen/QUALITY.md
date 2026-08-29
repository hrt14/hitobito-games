# 他人からどう見えてる？診断 — Quality Report

## Test environment
- Browser/device: GitHub Actions Ubuntu 24.04 / Google Chrome headless via Puppeteer
- Viewport: 390 x 844 mobile and 1280 x 900 desktop
- Browser verification: how-seen browser run 33258822428, success
- Firebase deployment: Deploy LEVEL UP run 33258714062, success
- Production verification: Verify how-seen production run 33258849889, success on both Firebase default domain and levelup.hitobito.jp
- Production URL: https://levelup.hitobito.jp/apps/how-seen/

## First-time clarity
- Status: PASS
- Observed evidence: 390 x 844の初回画面で「他人からどう見えてる？」見出しと「8つの二択で診断する」CTAを確認。開始ボタンの実測高さは48px以上で、説明を読まなくても開始操作を特定できた。

## Main interaction
- Status: PASS
- Observed evidence: 本人側8問を二択で最後まで回答し、4軸の自己像結果を表示。その結果から友達用URLを生成し、別ブラウザページで友達側8問を完走、返却URLを生成して本人側へ取り込む一連のフローを自動操作で確認した。

## Wrong / failure path
- Status: NOT APPLICABLE
- Observed evidence: この診断には正誤判定がなく、二択のどちらも有効な自己・他者評価として扱うため、誤答専用フローは存在しない。

## Correct / success path
- Status: PASS
- Observed evidence: 自己診断完了後に4本の結果バーを表示し、友達回答返却後には「ズレ / 100」、4軸の自分/他人比較、最大差分への短い解釈が表示された。

## Back / exit
- Status: PASS
- Observed evidence: 結果画面から「最初から」を押し、初回画面と開始CTAへ戻れることをブラウザ操作で確認した。

## Reload
- Status: PASS
- Observed evidence: 友達回答を取り込んだ後にページをreloadし、友達1人の平均とズレ結果が保持されることを確認した。

## Revisit
- Status: PASS
- Observed evidence: localStorageの本人結果と友達回答から、再訪時に診断をやり直さず結果ダッシュボードを復元できることを確認した。友達回答が増えるほど平均が更新される設計になっている。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: 390 x 844のモバイルviewportで初回画面、二択、結果、友達回答を操作。主要開始CTAは48px以上。1280 x 900でもレイアウトコンテナが正常に表示されることを確認した。

## Production verification
- Status: PASS
- Observed evidence: GitHub Actions run 33258849889で `https://hitobito-levelup.web.app/apps/how-seen/` と `https://levelup.hitobito.jp/apps/how-seen/` の両方から本番HTMLとapp.jsを取得し、タイトル、app mount、友達回答保存キー、共有CTAの本番配信を確認。Firebase deploy run 33258714062もsuccess。

## Final scores
Clarity: 9/10
Usefulness: 8/10
Interaction quality: 8/10
Uniqueness: 9/10
Repeat value: 8/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 1回目は自己像だけだが、友達の回答が返るたびに「他人から見える自分」の平均が更新されるため、2人目・3人目にも送りたくなる明確な再訪理由がある。共有が宣伝ボタンではなく、診断を完成させる操作になっている。

## Remaining issues
- サーバーに個人評価を保存しない設計のため、返却リンクを本人が開かなければ回答は集約されない。現段階ではプライバシーと実装負荷を優先した意図的なトレードオフ。
- SNSごとの画像カード生成は未実装。現状はWeb Share API / テキスト＋URL共有で共有ループを成立させている。
