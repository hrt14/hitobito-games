# hitobito-games agent instructions

This repository powers PLAY, LEVEL UP, and related hitobito games.

## Read this first

Treat this file as a map, not the full manual.

For any file under `apps/`, also obey `apps/AGENTS.md`.

Authoritative project docs:

- `docs/PLAY_FUN_FIRST.md` — mandatory FUN-FIRST rules for PLAY games
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

## Required checks

For normal repository changes, run the relevant existing checks.

For a PLAY game report, run:

`node scripts/validate-play-fun-gate.mjs --report apps/<slug>/FUN_REPORT.json`

For a branch/PR diff, run:

`node scripts/validate-play-fun-gate.mjs --base <base-sha-or-ref> --head <head-sha-or-ref>`

GitHub Actions also runs the diff-based FUN gate on pull requests and pushes to `main`.

## Completion standard

Code written, build passed, PR opened, or PR merged are not sufficient by themselves.

For user-facing production work, follow `HOSTING_POLICY.md`: production deployment and live verification are required before claiming production completion.

For PLAY gameplay work, the FUN gate is an additional completion requirement. A game that merely works but is boring is not complete.
