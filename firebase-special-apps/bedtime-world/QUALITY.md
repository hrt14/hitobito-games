# 寝る前が楽しみになるイメトレ — Quality Report

## Test environment
- Browser/device: Chromium 140 headless / Playwright Python
- Viewport: 390×844 mobile, 1280×800 desktop
- Build/commit: local implementation candidate before GitHub merge
- Production URL (if production verification is required): pending first production deploy

## First-time clarity
- Status: PASS
- Observed evidence: 390×844で初回表示を開くと、最初の画面だけで「今夜から、寝る前に続きがある。」、4つの世界、各世界の短い説明が同時に見えた。世界を1タップすると即ホームへ進み、チュートリアルなしで開始できた。

## Main interaction
- Status: PASS
- Observed evidence: 夜行列車を選択後、「布団に入った。入口を開く」→3つの入口から選択→6つの感覚素材から3つを選択→「目を閉じる準備ができた」→「画面を伏せる」まで連続操作できた。3つの選択はスロットへ即反映され、入口と感覚素材が最終画面に引き継がれた。

## Wrong / failure path
- Status: PASS
- Observed evidence: 感覚素材を3つ選んだ後に4つ目を押してもスロット数は3のまま増えなかった。素材画面から「戻る」で入口画面へ戻り、再度進むと選択済み3素材が維持されていたため、誤操作からやり直さず復帰できた。

## Correct / success path
- Status: PASS
- Observed evidence: 初回完了後に「続きは、明日の夜。」と次の場所「水上の駅」が予告され、ホームでは進行が「1夜ぶん進行」になった。同じ日にもう一度完了しても進行は1夜のままで、同日の二重進行は発生しなかった。

## Back / exit
- Status: PASS
- Observed evidence: 入口画面と感覚素材画面の「戻る」が機能し、選んだ入口・素材を保持したまま前後できた。最終の「画面を伏せる」でアプリ側の操作を終了し、完了画面からホームへ戻れた。

## Reload
- Status: PASS
- Observed evidence: 1夜完了済みの保存状態を新しいブラウザページへ読み直すと「今夜の続きを、もう見た。」「1夜ぶん進行」「月明かりのホーム」が復元され、同日完了状態が保持された。

## Revisit
- Status: PASS
- Observed evidence: 保存済み1夜の lastCompleted を前日にした状態で再訪すると、ホームが「今夜も、続きがある。」へ戻り、今夜の場所が「月明かりのホーム」から次の「水上の駅」へ進んだ。翌晩にだけ続きを開く設計が確認できた。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: 390×844で横スクロールは発生せず、document scrollWidth=clientWidth=390。主要ボタンは画面幅いっぱい、世界カード・入口カード・感覚素材は指で押せる大きさを確保。1280×800でも横方向のオーバーフローはなかった。

## Production verification
- Status: UNVERIFIED
- Observed evidence: First production deployment has not completed yet.

## Final scores
Clarity: 9/10
Usefulness: 8/10
Interaction quality: 8/10
Uniqueness: 9/10
Repeat value: 9/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 翌晩だけ次の場所が開き、ポイントではなく「未完了の世界の続き」自体が再訪理由になる。就寝直前の操作も入口と3素材の選択だけで短い。

## Remaining issues
- First production deploy and live URL verification remain before full production completion can be claimed.
