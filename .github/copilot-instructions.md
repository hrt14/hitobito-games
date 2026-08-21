# hitobito-games Copilot instructions

For ordinary PLAY game creation, redesign, or gameplay changes, `docs/PLAY_FUN_FIRST.md` is mandatory, not optional guidance.

When working under `apps/`:

- obey `apps/AGENTS.md` and `GAME_QUALITY.md`;
- define the fun/core loop/tradeoff/peak moment before substantial coding;
- create or update the app's `FUN_REPORT.json` as a design contract;
- perform an actual browser playtest before claiming completion;
- never infer or fabricate playtest evidence from source code;
- run `node scripts/validate-play-fun-gate.mjs --report apps/<slug>/FUN_REPORT.json`;
- if the gate fails, continue iterating instead of calling the game complete.

For production publication, also obey `HOSTING_POLICY.md`. A build, PR, merge, or deploy by itself is not completion.
