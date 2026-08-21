# apps/ — mandatory game implementation rules

These instructions apply to every file under `apps/` and are intentionally more specific than the repository-root instructions.

## Before touching gameplay

If the app is an ordinary PLAY game, you MUST:

1. Read `../docs/PLAY_FUN_FIRST.md`.
2. Read `../GAME_QUALITY.md`.
3. Create or update `FUN_REPORT.json` in the game directory BEFORE substantial implementation so it acts as the design contract, not a post-hoc justification.
4. State concretely:
   - what is fun about the actual interaction;
   - the 30-second core loop;
   - the meaningful tradeoff the player repeatedly faces;
   - the best 5-second moment;
   - why the player should want one more run.

Ordinary PLAY games are the apps shipped as normal games. LEVEL UP apps and `aaa-lab` human-test-only apps are excluded from the automated PLAY report requirement, but they still obey `GAME_QUALITY.md`.

## During implementation

Prioritize in this order:

1. fun basic interaction
2. meaningful decisions
3. responsive consequences
4. mastery / player skill
5. progression / collection / story
6. polish

Do not use XP, coins, gacha, achievements, story, visual effects, content volume, or difficulty inflation to hide a weak core loop.

If the player mostly reads text, presses Next, repeats obvious 3-choice prompts, waits, or watches numbers grow, stop and redesign the core interaction unless that interaction itself contains meaningful skill and tradeoffs.

## Mandatory real playtest

You MUST actually run and play the game in a browser after implementation.

The required checks are:

- first 10 seconds: purpose/action is clear
- first 30 seconds: core loop is already enjoyable
- 3 minutes: at least one new decision, discovery, or escalation appears
- 10 minutes: play has not collapsed into pure repetition; for very short games, test repeated runs until equivalent exposure
- retry desire: after failure/end, there is a concrete reason to retry
- no-reward test: core interaction remains worth doing with meta rewards mentally removed

Do not mark a test PASS based only on reading code. Record a concrete observed behavior in `FUN_REPORT.json`.

If browser interaction is unavailable, do not invent evidence. Leave the test failing/unverified and do not claim the game is complete.

## Mechanical gate

Before completion, run:

`node ../scripts/validate-play-fun-gate.mjs --report FUN_REPORT.json`

(or from repository root: `node scripts/validate-play-fun-gate.mjs --report apps/<slug>/FUN_REPORT.json`)

The report must pass all required tests and score thresholds. GitHub Actions also checks changed PLAY app directories and fails when their `FUN_REPORT.json` is missing, stale from the PR, malformed, or below threshold.

## Completion language

Never say a PLAY gameplay task is complete merely because it builds, deploys, or renders.

It is complete only when:

- the implementation works;
- the real playtest was performed;
- the report passes the FUN gate;
- required repository checks pass;
- if production publication was requested, production is deployed and live-verified under `HOSTING_POLICY.md`.
