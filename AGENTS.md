# hitobito-games agent instructions

This repository powers PLAY, LEVEL UP, and related hitobito games.

## Read this first

Treat this file as a map, not the full manual.

For any file under `apps/`, also obey `apps/AGENTS.md`.

Authoritative project docs:

- `docs/PLAY_FUN_FIRST.md` — mandatory FUN-FIRST rules for PLAY games
- `docs/LEVELUP_QUALITY_STANDARD.md` — mandatory product-quality rules for LEVEL UP apps
- `GAME_QUALITY.md` — shared gameplay/UX quality rules
- `HOSTING_POLICY.md` — production/deployment rules
- `deploy-targets.json` — canonical hosting split

## Mandatory rule for PLAY work

When creating, redesigning, or materially changing a PLAY game:

1. Read `docs/PLAY_FUN_FIRST.md` and `GAME_QUALITY.md` before coding.
2. Define the fun, core loop, meaningful tradeoff, and peak 5-second moment before implementation.
3. Create or update that game's `FUN_REPORT.json` as an implementation contract.
4. Actually play the game in a browser. Do not infer playtest results from source code.
5. Run the FUN gate after implementation and after the final playtest.
6. If the FUN gate fails, continue iterating. Do not call the work complete.

Do not fabricate playtest evidence or scores. If you cannot actually perform a required playtest, mark it unverified/failing and report that limitation instead of claiming completion.

## Mandatory rule for LEVEL UP work

When creating, redesigning, or materially changing a LEVEL UP app:

1. Read `docs/LEVELUP_QUALITY_STANDARD.md` and `GAME_QUALITY.md` before substantial implementation.
2. Define the exact user/use moment and one central benefit before coding.
3. Create or update the app's `SPEC.md` and `QUALITY.md` as implementation contracts, not post-hoc justification.
4. Make the interaction itself match the thinking/behavior being trained; do not default to generic three-choice prompts.
5. Re-evaluate the title against the title quality gate after the product experience is clear.
6. Actually use the app from first visit through completion, failure/wrong paths, reload/revisit, and mobile layout. Source review alone is not a playtest.
7. Score clarity, usefulness, interaction quality, uniqueness, and repeat value from 0–10 based on observed behavior. Every item must be at least 7 before claiming full completion.
8. If a browser or live environment is unavailable, mark the affected test unverified. Never fabricate test evidence or quality scores.
9. For production-facing work, deploy and live-verify according to `HOSTING_POLICY.md` before saying the work is complete.

A LEVEL UP app is not complete merely because it exists, builds, or is merged. Prefer one 90-point app over ten 60-point apps.

## Required checks

For normal repository changes, run the relevant existing checks.

For a PLAY game report, run:

`node scripts/validate-play-fun-gate.mjs --report apps/<slug>/FUN_REPORT.json`

For a branch/PR diff, run:

`node scripts/validate-play-fun-gate.mjs --base <base-sha-or-ref> --head <head-sha-or-ref>`

GitHub Actions also runs the diff-based FUN gate on pull requests and pushes to `main`.

For LEVEL UP work, also review the app against `docs/LEVELUP_QUALITY_STANDARD.md` and keep `SPEC.md` / `QUALITY.md` current. Do not mark unverified playtest claims as PASS.

## Completion standard

Code written, build passed, PR opened, or PR merged are not sufficient by themselves.

For user-facing production work, follow `HOSTING_POLICY.md`: production deployment and live verification are required before claiming production completion.

For PLAY gameplay work, the FUN gate is an additional completion requirement. A game that merely works but is boring is not complete.

For LEVEL UP work, all five final quality scores must be at least 7/10 and supported by actual testing before claiming full product completion.
