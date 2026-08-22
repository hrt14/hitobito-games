# LEVEL UP app SPEC / QUALITY template

Use these sections for a new LEVEL UP app or material redesign.

## `apps/<slug>/SPEC.md`

```md
# <App title> — Product Spec

## Exact use moment
Who opens this, in what concrete situation, feeling what, and what should be different afterward?

## Central benefit
One result only.

## Problem / design rationale
Why does this problem happen? What design principle is the app built around?

## Core interaction
What does the user physically do? Why does that operation itself train the target thinking/behavior?

## First 10 seconds
What is visible and tappable immediately? How does a first-time user know what to do without a tutorial?

## Success condition
What observable change means this session worked?

## Uniqueness
Why can this app not be replaced by another existing LEVEL UP app?

## Repeat-use strategy
Why should someone return, or why is this intentionally a one-shot tool?

## Title rationale
- Main user benefit/motive:
- Why this title is direct and specific:
- How it matches the actual app:
- Market/uniqueness checks actually performed (if any):
```

## `apps/<slug>/QUALITY.md`

```md
# <App title> — Quality Report

## Test environment
- Browser/device:
- Viewport:
- Build/commit:
- Production URL (if production verification is required):

## First-time clarity
- Status: PASS / FAIL / UNVERIFIED
- Observed evidence:

## Main interaction
- Status: PASS / FAIL / UNVERIFIED
- Observed evidence:

## Wrong / failure path
- Status: PASS / FAIL / NOT APPLICABLE / UNVERIFIED
- Observed evidence:

## Correct / success path
- Status: PASS / FAIL / NOT APPLICABLE / UNVERIFIED
- Observed evidence:

## Back / exit
- Status: PASS / FAIL / UNVERIFIED
- Observed evidence:

## Reload
- Status: PASS / FAIL / UNVERIFIED
- Observed evidence:

## Revisit
- Status: PASS / FAIL / UNVERIFIED
- Observed evidence:

## Mobile readability and tap targets
- Status: PASS / FAIL / UNVERIFIED
- Observed evidence:

## Production verification
- Status: PASS / FAIL / NOT REQUIRED / UNVERIFIED
- Observed evidence:

## Final scores
Clarity: 0/10
Usefulness: 0/10
Interaction quality: 0/10
Uniqueness: 0/10
Repeat value: 0/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES / NO / UNVERIFIED
Reason:

## Remaining issues
- ...
```

Do not mark UNVERIFIED as PASS. Do not invent browser observations.
