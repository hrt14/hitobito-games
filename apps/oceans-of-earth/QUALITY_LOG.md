# Quality loop log

## Experiment premise
Use the short “Claude of Duty” style instruction as the forcing function: aim at an unreasonable quality bar, split the problem into subsystems, judge harshly, and iterate instead of accepting the first functional build.

## Pass 1 — functional critic
Found two blocking issues before visual polish:
- tank volume extended too far toward the observation hall, risking water/sand geometry appearing in front of the glass;
- dive transition shared the main render clock, which could make the transition stall or run much slower than intended.

Fixed both before continuing.

## Pass 2 — visual-depth critic
The tank could still read like an empty hole in the wall and scale was ambiguous.
Added:
- glass streak/reflection layer;
- volumetric-feeling light shafts;
- visible water ceiling;
- animated caustic layer;
- quiet visitor silhouettes for human scale;
- more layered lighting and depth cues.

## Pass 3 — experience critic
The first Dunkleosteus reveal was too slow: players could reach the observation marker and wait for the reveal state to finish.
Changed reveal timing so the first peak lands in roughly 4–5 seconds after the trigger. Added mottled body texture and tail motion so the animal reads less like a rigid moving sculpture.

## Current limitation
This environment can syntax/smoke-test the code but cannot render the Three.js scene because working headless WebGL is unavailable here. Therefore the final “blind side-by-side visual judge” portion of the original prompt has not been honestly completed yet. The next quality loop should be run in an environment that can render the scene and capture screenshots/interaction.
