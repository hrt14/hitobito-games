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

## Before touching a LEVEL UP app

If the app is a LEVEL UP app, you MUST:

1. Read `../docs/LEVELUP_QUALITY_STANDARD.md`, `../docs/LEVELUP_APP_QUALITY_TEMPLATE.md`, and `../GAME_QUALITY.md`.
2. Before substantial implementation, create or update `SPEC.md` with:
   - exact user/use moment;
   - one central benefit;
   - why the problem occurs / design rationale;
   - core interaction and why that operation matches the target skill;
   - first-10-second experience;
   - success condition;
   - why an existing LEVEL UP app cannot replace this one;
   - repeat-use strategy, or an explicit one-shot rationale.
3. Create or update `QUALITY.md` before completion. It must record actual test status rather than aspirational claims.
4. Do not begin with a generic template and then try to justify it. If the interaction is only reading text, pressing Next, or repeating obvious three-choice prompts, redesign it unless that exact interaction is essential to the skill being trained.

## During PLAY implementation

Prioritize in this order:

1. fun basic interaction
2. meaningful decisions
3. responsive consequences
4. mastery / player skill
5. progression / collection / story
6. polish

Do not use XP, coins, gacha, achievements, story, visual effects, content volume, or difficulty inflation to hide a weak core loop.

If the player mostly reads text, presses Next, repeats obvious 3-choice prompts, waits, or watches numbers grow, stop and redesign the core interaction unless that interaction itself contains meaningful skill and tradeoffs.

## During LEVEL UP implementation

Prioritize in this order:

1. real-life usefulness for the exact target moment;
2. immediate clarity in the first 10 seconds;
3. an interaction that embodies the target thinking/behavior;
4. short, reusable feedback explaining why;
5. evidence of change or growth at the end;
6. a meaningful reason to return when repetition adds value;
7. visual/interaction polish.

Also apply these rules:

- The user wants the result beyond the training: relief, action, clarity, confidence, better judgment, continuation, or another concrete change.
- Use specific real-life situations rather than generic psychological wording.
- Keep content varied enough that later prompts are not thin rewrites of the first few.
- Do not use generic AI encouragement, decorative gradients/emoji, fake levels, or unrelated rewards to create an illusion of quality.
- Re-evaluate the title after the experience is clear. The title must be direct, concrete, benefit-linked, restrained, target-aware, and consistent with the actual app. Clever wording must never beat meaning.
- Where appropriate, make the app a useful standalone discovery page and make results naturally shareable, but never sacrifice the core experience for SEO or promotion.

## Mandatory real playtest for PLAY

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

## Mandatory real use test for LEVEL UP

You MUST actually use the app like a user after implementation:

- first visit;
- start;
- main interaction;
- wrong/failure path where applicable;
- correct/success path where applicable;
- back/exit;
- reload;
- completion;
- revisit;
- mobile layout.

Record concrete observed evidence in `QUALITY.md`.

Then score each from 0–10:

- clarity;
- usefulness;
- interaction quality;
- uniqueness;
- repeat value.

Every score must be at least 7 to call the LEVEL UP app fully complete. Do not average away a weak category.

If browser or live interaction is unavailable, mark that item unverified and do not invent a PASS or score.

## Mechanical gates

For PLAY, before completion run:

`node ../scripts/validate-play-fun-gate.mjs --report FUN_REPORT.json`

(or from repository root: `node scripts/validate-play-fun-gate.mjs --report apps/<slug>/FUN_REPORT.json`)

The PLAY report must pass all required tests and score thresholds. GitHub Actions also checks changed PLAY app directories and fails when their `FUN_REPORT.json` is missing, stale from the PR, malformed, or below threshold.

For LEVEL UP, before completion run from repository root:

`node scripts/validate-levelup-quality-gate.mjs --app apps/<slug>`

The LEVEL UP gate must pass. It checks the required SPEC/QUALITY structure, actual PASS evidence for required real-use checks, five scores at 7/10 or above, no remaining UNVERIFIED claims, and a final YES to the return-use question.

## Completion language

Never say a PLAY gameplay task is complete merely because it builds, deploys, or renders.

It is complete only when:

- the implementation works;
- the real playtest was performed;
- the report passes the FUN gate;
- required repository checks pass;
- if production publication was requested, production is deployed and live-verified under `HOSTING_POLICY.md`.

Never say a LEVEL UP app is fully complete merely because code exists, a build passes, a PR is merged, or Firebase deployment is triggered.

A LEVEL UP app is fully complete only when:

- `SPEC.md` reflects the actual finished product;
- `QUALITY.md` contains real observed test evidence;
- all five quality scores are at least 7/10;
- `validate-levelup-quality-gate.mjs` passes;
- relevant repository checks pass;
- if production publication was requested, production is deployed and live-verified under `HOSTING_POLICY.md`.

Final LEVEL UP question:

> If I genuinely had this problem, would I open this app again?

If the answer is no, continue improving it.
