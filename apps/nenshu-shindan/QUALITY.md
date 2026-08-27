# 30問でわかる 市場年収診断 — Quality Report

## Test environment
- Browser/device: Playwright 1.55.0 / Chromium 140 headless on GitHub Actions Ubuntu 24.04
- Viewport: 390×844 and 360×800
- Build/commit: app code tested at `e9877a52e79aa49913c25261d11a2a9e0aa2bacf`; later branch changes only add LEVEL UP catalog classification and quality evidence
- Browser playtest: GitHub Actions run 33053013892 / job 98452857574
- Production URL (if production verification is required): NOT REQUIRED at this branch-quality stage

## First-time clarity
- Status: PASS
- Observed evidence: On a fresh localStorage state, the browser saw `30問でわかる 市場年収診断`, the visible `入力欄なし` promise, and the primary start action. The start target measured at least 48px high.

## Main interaction
- Status: PASS
- Observed evidence: Chromium completed the diagnosis using option-button taps only. Selecting an option automatically advanced from question 1 to question 2, and the browser completed all 30 questions without typing or manual next buttons. A DOM check found zero `input`, `textarea`, or `select` elements.

## Wrong / failure path
- Status: NOT APPLICABLE
- Observed evidence: This is a self-assessment, so there are no right/wrong answers. The uncertainty path is represented by explicit `わからない` choices on questions where users may not know the answer; those answers widen uncertainty rather than pretending to be precise.

## Correct / success path
- Status: PASS
- Observed evidence: After 30 taps, the result view opened and rendered a numeric salary range, market-value score, exactly two top drivers, and all six factor bars. With the test's neutral middle choices, the observed result was 470〜640万円 and 50/100.

## Back / exit
- Status: PASS
- Observed evidence: After answering question 1 and advancing to question 2, the browser used `戻る`, returned to 1/30, and confirmed that the prior selected option remained visibly selected. The LEVEL UP home link remains available in the app shell/result actions.

## Reload
- Status: PASS
- Observed evidence: Reload after completion returned to a usable intro rather than a broken intermediate state.

## Revisit
- Status: PASS
- Observed evidence: After completion and reload, the intro restored a `前回の結果` summary from localStorage including the previous salary range. The app stores a short history for comparison on a later diagnosis.

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: Chromium tested both 390×844 and 360×800. Neither viewport had horizontal overflow. Start and option controls were at least 48px high, and 360px-wide question options were at least 300px wide. Screenshots and JSON evidence were uploaded as the `nenshu-shindan-browser-playtest` workflow artifact. Console/page errors: 0.

## Production verification
- Status: NOT REQUIRED
- Observed evidence: This report verifies the branch implementation. Firebase production publication is a separate repository-policy step and is not claimed here.

## Final scores
Clarity: 9/10
Usefulness: 8/10
Interaction quality: 8/10
Uniqueness: 8/10
Repeat value: 7/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: It gives a quick no-typing market-value snapshot, explains which factors are carrying the result, and makes a later re-check meaningful after a promotion, larger result, new responsibility, skill acquisition, or job-market test.

## Remaining issues
- Production deployment/live verification is still separate from branch quality and must not be claimed until Firebase is actually deployed and checked.
- The salary-range conversion is intentionally a heuristic anchored to official statistics, not a validated individual compensation model; the result screen discloses that limitation.
