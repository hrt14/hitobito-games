# やらないことを決める — Quality Report

## Test environment
- Browser/device: GitHub Actions / Ubuntu 24.04 / Playwright 1.55.0 / Chromium 140
- Viewport: desktop 1280×900 / mobile 390×844
- Production app bundle: Firebase deploy from main commit `c5e25f2582e56ccb74e65f9ec87d02856b8800de`
- Production browser test harness: `d3143d86df851fcc5fc75f2d0915ea5a831d0713`
- Production test workflow: https://github.com/hrt14/hitobito-games/actions/runs/33071544522
- Production URL: https://levelup.hitobito.jp/apps/suteru-yuki/

## First-time clarity
- Status: PASS
- Observed evidence: desktop/mobileとも初回表示で「やらないことを決める」が見え、候補3件未満では開始ボタンが無効、3件になると有効化された。候補を入れて絞るという最初の操作が説明なしで進行できた。

## Main interaction
- Status: PASS
- Observed evidence: desktop/mobileとも実際に最初の候補カードを約140px左へドラッグし、「今日はやらない」として1/3から2/3へ進行した。残り候補は「残す」操作で進み、最終比較へ遷移した。

## Wrong / failure path
- Status: PASS
- Observed evidence: 候補0〜2件では開始できず、2件の時点でもボタンが無効のまま。最低3候補という前提を破る進行を防止できた。

## Correct / success path
- Status: PASS
- Observed evidence: 候補3件追加 → 基準「成果」選択 → 1件をスワイプで捨てる → 2件を残す → 最終比較で1件を選ぶ → 結果画面で「今日の一番」と2件以上の「今日はやらない」が表示された。

## Back / exit
- Status: PASS
- Observed evidence: 基準選択画面から「← 候補を直す」で入力画面へ戻れた。LEVEL UPリンクは `/` を指していた。

## Reload
- Status: PASS
- Observed evidence: 結果を「この1つを始める」で保存後に再読み込みし、初期画面へ戻っても前回結果が復元された。

## Revisit
- Status: PASS
- Observed evidence: 保存・再読み込み後に「前回の一番」と前回捨てた件数が表示され、前回の意思決定を文脈として再利用できた。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: 390×844のChromiumで初回から結果・再訪まで同じ一連の操作が完走した。結果画面の主要ボタン高は44px以上であることを実測した。

## Production verification
- Status: PASS
- Observed evidence: Firebase Hostingへのデプロイ成功後、production URL `https://levelup.hitobito.jp/apps/suteru-yuki/` に対して同じPlaywrightシナリオを実行。desktop 1280×900 / mobile 390×844の双方で、初回表示、3件未満ガード、基準選択、実ドラッグによる左スワイプ、残す経路、最終比較、結果、44px以上の主要タップ領域、保存→reload→再訪、戻る／ホームまで完走した。Workflow run `33071544522` の Production browser test はPASS。

## Final scores
Clarity: 9/10
Usefulness: 8/10
Interaction quality: 8/10
Uniqueness: 8/10
Repeat value: 8/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 今日抱えている候補を3〜7件入れて、物理的に捨てながら最後の1件まで絞るため、仕事が散った瞬間に繰り返し使える。前回の一番も残る。

## Remaining issues
- Blocking issue: none.
- Title note: 外部チェックでは同名書籍は確認できなかったが、2026-04-28発売の『やらないことを決める技術』という近似書名は存在する。SPECに記録済み。
