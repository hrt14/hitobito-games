# PLAY FUN-FIRST — authoritative game-design specification

This is the source of truth for ordinary PLAY game design.

The goal is not to ship code. The goal is to ship a game that is genuinely fun to play and makes the player want one more run.

## 1. Define the fun before implementation

Before coding, state in one sentence what action, decision, tension, discovery, or interaction is enjoyable in this specific game.

Do not describe only what the game is about. Describe what is fun about playing it.

Bad: "A game about running a planet."

Good: "Every placement changes ecology and economics, forcing the player to improvise when one solution creates a new problem."

If the fun cannot be stated clearly, redesign before implementation.

## 2. Core-loop-first order

Prioritize strictly in this order:

1. fun basic interaction
2. meaningful decisions
3. interesting consequences and surprises
4. player skill and mastery
5. progression, collection, story
6. visual polish and decoration

Do not use progression to disguise a weak core loop.

The main loop should normally repeat within about 30 seconds:

`observe -> decide -> act -> world responds -> new situation`

The loop should still be worth doing if XP, coins, achievements, gacha, login bonuses, rankings, and story rewards are removed.

## 3. Meaningful decisions

The player should regularly feel "Which should I choose?"

A good decision contains a real tradeoff, such as:

- reward vs risk
- speed vs safety
- now vs later
- certainty vs upside
- resource A vs resource B
- short-term gain vs long-term consequence

Avoid obvious correct answers.

Prefer: "I want both, but I cannot have both."

Whenever possible, the player's decision should change the next situation rather than merely awarding a score.

## 4. Responsive world

The game world must not be passive scenery.

Prefer:

`player action -> visible/mechanical state change -> consequence -> next decision changes`

The player should be able to explain why the current situation exists partly because of what they previously did.

## 5. Make the player feel skillful

Create moments where the player can truthfully think:

- I noticed that
- I predicted that
- I timed that well
- I took a risk and it paid off
- I discovered that combination
- I handled that better than last run

Do not substitute random wins for mastery.

## 6. Input must feel good

Important input needs immediate, proportional feedback.

Use only what supports clarity and feel:

- animation
- sound
- haptics
- hit stop
- acceleration/deceleration
- screen shake
- particles
- number changes
- character/world reactions

Every meaningful action should visibly cause something.

## 7. Prediction and surprise

Create a cycle of:

`prediction -> action -> result -> learning/surprise`

Surprises should usually make sense afterward.

Aim for "Oh, THAT'S what happens" rather than "Why did the game do that?"

Random events are useful only if the player can react to, exploit, avoid, or plan around them.

## 8. Depth from rules, not content count

Prefer one rule that supports multiple strategies over 100 nearly identical stages.

Examples of strategic axes:

- speed
- safety
- burst
- conservation
- combo
- prediction
- risk management

The same situation should sometimes invite a different plan on the next run.

## 9. Easy to learn, hard to master

Desired progression:

- first minute: "I get it."
- around 3 minutes: "Oh, that is useful."
- later: "Can I combine these?"
- after repeated runs: "I understand this much better than I did at first."

Increase the abilities demanded of the player, not merely enemy HP or speed.

## 10. Tension has rhythm

Avoid constant intensity.

Use cycles such as:

`understand -> succeed -> pressure -> danger -> breakthrough -> release -> discovery -> larger danger`

The player needs both tension and relief.

## 11. Failure should teach

A good failure creates "one more run" because the player sees a better attempt.

Failure should ideally reveal one of:

- a bad decision
- a missed clue
- a timing mistake
- a new rule
- an entertaining accident
- a near miss

A dead-end "GAME OVER / RETRY" without learning is weak.

## 12. Emergent story over exposition

Prefer stories the player creates through play:

- "I got greedy and lost everything."
- "I survived with 0.2 seconds left."
- "The weak ability I ignored saved the run."

These are stronger for PLAY than long explanatory text.

## 13. Define the peak five seconds

Before implementation, answer:

"What are the most exciting five seconds in this game?"

If there is no concrete answer, the design is not ready.

Examples:

- a chain reaction spreads across the entire screen
- a last-second save
- several systems suddenly click into equilibrium
- clues from multiple cameras suddenly reveal the threat

Build toward this moment.

## 14. Explicit one-more-run reason

At the end of a run, there must be a concrete reason to restart, such as:

- I can execute better
- I want to try another strategy
- I almost reached the next state
- I want to see a different consequence
- I now understand why I failed

Meta rewards alone do not satisfy this requirement.

## 15. Fake-gameplay warning signs

Stop and redesign when gameplay is mostly:

- repeating the same obvious three-choice question
- reading text and pressing Next
- clicking only to increase numbers
- waiting for timers
- enemies differing only by larger numeric stats
- unrelated gacha/XP/daily rewards
- cards with no interesting manipulation
- bars that fill without decisions
- story covering weak interaction
- effects covering weak interaction
- content volume covering repetition

## 16. Mandatory implementation contract: FUN_REPORT.json

Every materially created or changed ordinary PLAY game must have a `FUN_REPORT.json` in the app directory.

Create/update it before substantial coding so it acts as the design contract, then update its evidence after real playtesting.

Use `docs/FUN_REPORT_TEMPLATE.json` as the schema example.

Do not write aspirational PASS results before testing.

## 17. Mandatory playtest

After implementation, actually play the game in a browser.

Required tests:

### First 10 seconds
The player can identify the main action and purpose without relying on a long explanation.

### First 30 seconds
The actual core loop has happened and is already interesting enough to continue.

### Three minutes
A new decision, discovery, interaction, pressure, or escalation has appeared.

### Ten minutes
The experience has not reduced to pure repetition. For a deliberately short game, repeat runs until equivalent exposure and judge variation/mastery between runs.

### Retry desire
After failure/end, there is a specific gameplay reason to retry.

### No-reward test
Mentally remove XP, coins, achievements, unlocks, and streaks. The core interaction is still worth doing.

A browser cannot be replaced by source-code inspection for these tests.

If you cannot actually run a test, mark it failing/unverified. Never fabricate evidence.

## 18. Scoring gate

Score each item 1–10 after playtesting:

1. first-10-seconds pull
2. core loop
3. input feel
4. decision quality
5. mastery depth
6. surprise/variation
7. risk/reward
8. pacing
9. retry desire
10. uniqueness

Passing threshold:

- every score >= 7
- average >= 8.0
- core loop >= 8
- decision quality >= 8
- retry desire >= 8

These are release gates, not encouragement scores.

Every score must be supported by concrete playtest observations in the report.

## 19. Iteration rule

If any required test or score fails:

1. identify the exact boring/confusing moment
2. change the interaction/rule before adding decoration
3. replay from the beginning
4. update evidence
5. rerun the FUN gate

Continue until the gate passes or report honestly that it does not.

## 20. Completion rule

A game is not complete because:

- code exists
- build passes
- it renders
- it deploys
- a PR merges

For PLAY gameplay work, completion requires:

- functional implementation
- actual browser playtest
- passing `FUN_REPORT.json`
- passing mechanical FUN gate
- relevant repository checks
- production deployment and live verification when production publication was requested

A working but boring game is unfinished.
