# NEGOTIATOR｜動かす — Quality Report

## Validation status
- Source implementation: complete
- Production deployment: pending at the time of this report creation
- Production browser verification: pending at the time of this report creation

This report is intentionally not marked final until the production URL is deployed and exercised.

## Static implementation checks
- [x] Clear app title: `NEGOTIATOR｜動かす`
- [x] One-sentence promise appears on the first screen
- [x] Primary action is visible without a tutorial
- [x] Core loop uses rejection as a mechanic rather than a wrong answer
- [x] Offer visibly shrinks from 30 MIN → 5 MIN → 60 SEC → 10 SEC → 1 MOVE
- [x] Four concrete target categories exist: work / study / housework / exercise
- [x] A real-world 10-second action screen exists after acceptance
- [x] Restart and explicit negotiation exit are available
- [x] Result includes first offer, settled offer, rejection count, YES count, cumulative deals
- [x] Web Share API with clipboard fallback is implemented
- [x] localStorage is guarded with try/catch
- [x] `prefers-reduced-motion` is supported
- [x] No external runtime dependency

## Required production checks before final verdict
- [ ] Start flow
- [ ] Resistant choice changes the offer and dialogue
- [ ] Multiple resistance branches reach smaller offers
- [ ] Accept path reaches action mode
- [ ] 10-second action / already-done path reaches result
- [ ] Exit path ends without shaming the user
- [ ] Replay works
- [ ] Reload works
- [ ] Mobile viewport is usable
- [ ] No browser console errors
- [ ] Production page title and core copy match the source

## Provisional self-score
Scores are provisional until production verification.
- Clarity: 9/10
- Usefulness: 8/10
- Interaction feel: 8/10
- Uniqueness: 9/10
- Replayability: 8/10

## Uniqueness check
Unlike `3秒で動け` (rapid choice training) and `あと5分` (task decomposition), this app makes the user's refusal itself the input that reduces the negotiated demand. The user is not asked to agree with motivational advice; they can keep saying NO until the requested behavior is small enough to accept.

## Known design choice
The app does not guarantee that a persuasion technique will work. Technique names are treated as game-design patterns only. The user can end negotiation at any point.

## Final verdict
PENDING — must be replaced with production evidence after deployment.
