# PLAY Game Development Rules — FUN FIRST

This repository powers PLAY / hitobito games. For any request to create, improve, redesign, or implement a game, treat the following as mandatory product rules.

The goal is not to ship code. The goal is to ship a game that is genuinely fun to play and makes the player want one more run.

## 1. Define the fun before implementation

Before coding, be able to state in one sentence what action, decision, tension, discovery, or interaction is enjoyable in this specific game.

Do not describe only what the game is about. Describe what is fun about playing it.

If that cannot be stated clearly, redesign the concept before implementation.

## 2. Build the core loop first

Prioritize in this order:

1. Fun basic interaction
2. Meaningful decisions
3. Interesting consequences and surprises
4. Skill growth / mastery
5. Progression, collection, story
6. Visual polish and decoration

Never use progression systems to hide a weak core loop.

The main loop should repeat within roughly 30 seconds:

`observe -> decide -> act -> world responds -> new situation`

The loop should remain enjoyable even if coins, XP, achievements, gacha, login bonuses, rankings, and story rewards are temporarily removed.

## 3. Avoid fake gameplay

Do not mistake these for sufficient gameplay:

- repeating the same 3-choice question
- reading text and pressing Next
- clicking only to make a number increase
- waiting for timers without meaningful intervention
- enemies that only gain more HP or speed
- unrelated gacha, XP, or daily rewards
- card grids with no interesting interaction
- gauges that increase without decisions
- story or effects used to mask boring interaction
- content volume used to mask repetition

If the game resembles these patterns, return to the core loop.

## 4. Create meaningful decisions

The player should regularly feel "Which should I choose?"

Good choices include at least one tradeoff:

- reward vs risk
- safety vs speed
- now vs later
- certainty vs upside
- resource A vs resource B
- short-term gain vs long-term consequence

Avoid obvious correct answers. Prefer situations where the player wants both options but cannot have both.

Player choices should alter subsequent game state whenever possible.

## 5. Make the world respond

The game world must not be passive scenery.

Player actions should visibly and mechanically change the situation, producing new problems, opportunities, or consequences.

Prefer this structure:

`player action -> state changes -> new consequence -> next decision changes`

This creates emergent play instead of a fixed sequence of prompts.

## 6. Make the player feel skillful

Wins should not feel purely random.

Create moments where players can recognize that they:

- noticed something
- predicted correctly
- timed an action well
- took a calculated risk
- discovered a useful interaction
- escaped narrowly
- improved compared with the previous run

The game should let players understand why they succeeded or failed.

## 7. Make input feel good

Every important action needs clear, immediate feedback.

Use only where appropriate:

- motion
- sound
- haptics
- hit stop
- acceleration / deceleration
- screen shake
- particles
- number changes
- object or character reactions
- environmental state changes

Feedback intensity should match action importance. Do not use the same generic effect for everything.

## 8. Create surprise with logic

Mix three kinds of outcomes:

1. expected success
2. slightly unexpected discovery
3. surprising consequence

Avoid arbitrary randomness. The ideal reaction is:

"Oh, THAT happens!"

not:

"Why did that happen?"

Surprises should usually make sense in hindsight and preferably create a new decision.

## 9. Easy to learn, hard to master

The game should be understandable quickly without a long tutorial.

Target progression:

- first minute: understand the basic action
- first few minutes: discover an effective tactic
- later: discover interactions, timing, risk management, or alternate strategies that were not obvious initially

Difficulty should add new demands on player skill instead of only increasing numeric values.

Useful skill dimensions include:

- observation
- timing
- prioritization
- prediction
- spatial reasoning
- memory
- resource management
- risk management

## 10. Support multiple strategies

Prefer systems where the same rules can support different approaches, such as:

- aggressive
- safe
- speed-focused
- combo-focused
- resource-saving
- prediction-heavy
- high-risk/high-reward

A smaller systemic game with multiple valid strategies is preferable to a large amount of linear content.

## 11. Give the run a tension curve

Avoid flat intensity.

Create a rhythm such as:

`understand -> succeed -> harder situation -> danger -> breakthrough -> relief -> new discovery -> larger danger`

Use tension and release deliberately.

## 12. Make failure useful and interesting

A failure screen should not only say GAME OVER.

After failure, the player should usually think:

"I know what I want to try next."

Good failures can provide:

- a near miss
- a visible bad decision
- a funny or surprising accident
- discovery of a rule
- a new tactical idea

Failure should often increase desire to retry.

## 13. Engineer memorable moments

Before considering the game complete, identify the strongest five-second moment in the game.

Examples:

- a chain reaction fills the screen
- success with 0.2 seconds remaining
- a system suddenly stabilizes after a risky choice
- a clue makes previous events click into place

If the game has no specific peak moment, improve the design.

## 14. Prefer emergent stories over exposition

Whenever possible, let players create stories through play:

- "I got greedy and lost everything."
- "I barely saved it."
- "That weak ability unexpectedly saved the run."
- "I caused that disaster myself."

Do not rely on long text to create all of the drama.

## 15. Build a real reason to replay

At the end of a run, leave at least one genuine gameplay reason to try again:

- improve execution
- test another strategy
- discover another outcome
- beat a score through skill
- reach a previously seen-but-unreached state
- change a consequential decision

Do not rely only on rewards or daily bonuses.

## 16. Add features only if they strengthen play

Before adding a feature, ask:

"Does this make the core loop more interesting?"

If not, remove it or postpone it.

Prefer fewer strong systems over many weak systems.

## 17. Mandatory playtest gates

Do not treat successful build, PR creation, merge, or deployment as proof that the game is good.

Actually play the game from the player perspective and run these tests:

### 30-second test
Does the opening interaction create a desire to keep touching the game?

### 3-minute test
Has the player encountered a new decision, tactic, or discovery?

### 10-minute test
Has the game evolved, or is it still repeating the same action with different numbers/content?

### Retry test
After a failure, is there a concrete desire to try again?

### No-reward test
If XP, coins, achievements, gacha, and meta rewards are removed, is the play itself still enjoyable?

If any answer is clearly no, continue redesigning instead of declaring completion.

## 18. Mandatory fun score

Score each item from 1 to 10 after implementation:

1. First 10-second pull
2. Core loop
3. Input feel
4. Decision quality
5. Skill / mastery depth
6. Surprise / variation
7. Risk vs reward
8. Pacing
9. Desire to replay
10. Unique reason this game exists

Completion gate:

- average must be at least 8/10
- every category must be at least 7/10
- Core loop, Decision quality, and Desire to replay must each be at least 8/10

If the gate fails, improve the game and retest.

## 19. Final three questions

Before completion, answer yes to all three:

1. Would this still be fun with simpler graphics?
2. Would this still be fun with all reward systems removed?
3. If a similar game were beside it, is there a concrete reason to choose this one?

If any answer is no, return to the core loop.

## 20. Definition of done for PLAY

"It works" is not done.

"It is deployed" is not done.

"It is playable" is not enough.

For game changes, done means:

- implementation is complete
- the live user-facing version is updated when deployment is required
- the actual game flow has been played and verified
- the mandatory playtest gates pass
- the mandatory fun score passes
- the game creates a credible "one more run" impulse

When a requested change affects only repository development instructions (for example this file), no production deployment is required; merging the instruction change into the default branch is sufficient.
