## Summary

Describe what changed and why.

## PLAY FUN gate (required for ordinary PLAY gameplay changes)

- [ ] I read `apps/AGENTS.md`, `docs/PLAY_FUN_FIRST.md`, and `GAME_QUALITY.md`.
- [ ] The game has an updated `apps/<slug>/FUN_REPORT.json` in this PR.
- [ ] The FUN report was used as a design contract, not written only after coding.
- [ ] I actually played the game in a browser.
- [ ] First 10s / 30s / 3m / 10m-or-equivalent / retry / no-reward tests all passed.
- [ ] Core loop, decision quality, and retry desire are each >= 8; all scores are >= 7; average is >= 8.
- [ ] `node scripts/validate-play-fun-gate.mjs --report apps/<slug>/FUN_REPORT.json` passes.
- [ ] I did not infer or fabricate playtest evidence from source code.

If this PR does not change ordinary PLAY gameplay, explain why the FUN gate is not applicable.

## Verification

List commands run, browser checks performed, and production verification when applicable.
