# QUALITY REVIEW — 結果が出る前に自信をつくる

## Test environment
- Browser harness: Playwright Chromium via `.github/workflows/confidence-before-results-browser.yml`.
- Primary viewport: 390x844.
- Narrow viewport: 360x800.
- Storage: localStorage clean-first-visit and reload persistence paths.
- Network: app itself uses no external network requests.

## First-time clarity
- Status: PASS
- Observed evidence: First screen presents 「結果 → 自信 / 順番を逆にする」, title 「結果が出る前に、自信をつくる。」, and explicitly narrows confidence to 「次の一手を出せる前提」 rather than success certainty. Browser test asserts these phrases before any interaction.

## Main interaction
- Status: PASS
- Observed evidence: Browser test covers challenge selection → brake selection → three-tap confidence charge → 10-minute action → 3・2・1 countdown → real-world check → +1 win. Each required choice gates the next CTA, and three charge taps are required before action selection unlocks.

## Wrong / failure path
- Status: PASS
- Observed evidence: 「壁に当たった」 returns to action selection, clears the prior action, disables progression until a new next move is chosen, and preserves the original challenge context.

## Correct / success path
- Status: PASS
- Observed evidence: 「一手、出せた？」で完了を選ぶと通算勝利が+1され、挑戦と実行した一手が結果画面に残る。Browser test checks both result copy and incremented score.

## Back / exit
- Status: PASS
- Observed evidence: Challenge / brake / switch / action stages expose explicit back controls, and the fixed home control always links to `https://levelup.hitobito.jp/`. The real-world stage intentionally treats leaving the page as valid because the next action happens outside the screen.

## Reload
- Status: PASS
- Observed evidence: Browser test reloads after a completed round, verifies that the app returns to a usable first stage, and confirms saved win count remains visible.

## Revisit
- Status: PASS
- Observed evidence: localStorage keeps only wins, lastAt, lastChallenge, and lastAction. Browser test completes a round, reloads, and checks that the cumulative win count survives without blocking a new round.

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: Main CTAs use at least 58px CSS min-height, choices collapse to a single column below 560px, and the browser test checks 390px and 360px viewports for horizontal overflow and >=44px primary/choice target height.

## Production verification
- Status: NOT REQUIRED
- Reason: Pre-merge quality document. Production publication is verified by the repository's dedicated Firebase production workflow after merge to main.

## Share
- Status: PASS
- Observed evidence: Result screen always exposes 「結果をシェア」. It uses Web Share API when available, clipboard fallback when available, then prompt fallback. Shared text includes challenge, chosen action, cumulative wins, and the canonical LEVEL UP app URL.

## Safety / calibration
- Status: PASS
- Observed evidence: Copy explicitly says success is not guaranteed, scores action rather than outcome, and keeps a footer warning not to skip necessary confirmation or professional advice for important decisions.

## Final scores
Clarity: 9/10
Usefulness: 9/10
Interaction quality: 8/10
Uniqueness: 8/10
Repeat value: 9/10

## Final question
「説明を読ませるだけではなく、挑戦前の反応を現実の一手へ変えるLEVEL UPゲームとして完成しているか？」

Answer: YES
