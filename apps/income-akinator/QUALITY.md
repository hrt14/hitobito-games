# 年収アキネーター — Quality Report

## Test environment
- Browser/device: Playwright Chromium 140 on GitHub Actions Ubuntu 24.04
- Viewport: mobile 390x844 / desktop 1280x900
- Local browser flow: run 33059051663
- Firebase deploy: run 33059366063 / job 98474021481
- Production browser flow: run 33059623600 / job 98474887012 / commit ac17bfc65e2b375d3652374ac1a5691578d7f2cf
- Production URL: https://levelup.hitobito.jp/apps/income-akinator/

## First-time clarity
- Status: PASS
- Observed evidence: 両viewportの本番URLでHTTP 200と「年収アキネーター」のtitleを確認。「推理スタート」が表示され、1タップでQ1へ遷移し、はい/いいえの2操作が即座に表示された。

## Main interaction
- Status: PASS
- Observed evidence: Firebase本番上で、はい/いいえを連続回答し、回答に応じてQ番号と質問が進行。最大質問数以内に結果画面へ到達し、職業名と推定年収の両方が空でないことを確認した。テスト回答では「コンサルタント / 1,280万円」を表示。

## Wrong / failure path
- Status: NOT APPLICABLE
- Observed evidence: 正誤型ではないため誤答は存在しない。回答修正経路として3回答後に「1問戻る」を操作し、Firebase本番でQ3へ正しく戻ることを確認した。

## Correct / success path
- Status: PASS
- Observed evidence: Firebase本番のmobile/desktopとも最大12問以内にresultScreenへ遷移し、職業・年収結果を表示した。

## Back / exit
- Status: PASS
- Observed evidence: ローカル実走で「1問戻る」により直前回答を取り消し、「最初から」で診断途中からスタート画面へ戻れることを確認。本番でも「1問戻る」を確認した。

## Reload
- Status: PASS
- Observed evidence: Firebase本番で診断後にリロードし、壊れた中間状態にならず「推理スタート」が見える利用可能な初期画面へ戻った。

## Revisit
- Status: PASS
- Observed evidence: Firebase本番の結果画面で「別の人で試す」を押すとQ1へリセットされ、再診断を開始できた。前回結果はlocalStorageに保存する実装。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: Firebase本番を390x844で実走し、タイトル、質問文、はい/いいえ、戻る、結果、再挑戦まで操作可能。主要回答ボタンは74px以上の高さを確保。

## Production verification
- Status: PASS
- Observed evidence: GitHub Actions run 33059366063でLEVEL UP bundle build、mobile-safe bundle check、Firebase Hosting deployがすべてSUCCESS。その後run 33059623600で https://levelup.hitobito.jp/apps/income-akinator/ を直接開き、mobile 390x844 / desktop 1280x900の両方でHTTP 200、開始、はい/いいえ、戻る、最大12問以内の完走、職業＋年収結果、再挑戦、リロード、pageerrorなしを確認。ログ末尾は `INCOME AKINATOR FIREBASE PRODUCTION PASS`。

## Final scores
Clarity: 9/10
Usefulness: 7/10
Interaction quality: 8/10
Uniqueness: 8/10
Repeat value: 8/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 自分だけでなく別の人でも推理結果が変わるため、短時間で繰り返す理由があり、職業名・年収を直接入力しない推理過程にも固有の面白さがある。

## Remaining issues
- None blocking release.
