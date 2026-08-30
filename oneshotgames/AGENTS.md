# OneShotGames production rules

OneShotGames is hosted on Firebase Hosting. Never deploy OneShotGames with Vercel.

## Request source

Production game work normally starts from open GitHub Issues labeled `osg-game-request` or `osg-improvement`. The Issue body contains the authoritative `requestId`, `gameId`, author nickname and user request.

## New game contract

Create exactly:

- `oneshotgames/games/<gameId>/index.html`
- `oneshotgames/games/<gameId>/meta.json`

Additional local assets inside that game directory are allowed.

`meta.json` must contain:

- `id`: exact gameId from the Issue
- `title`: short human-readable game title
- `description`: one-sentence description
- `authorNickname`: exact author nickname from the Issue
- `version`: integer, starting at 1
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp when improved

## Improvement contract

Modify the existing `oneshotgames/games/<gameId>/` game. Keep the same gameId and production URL. Increment `meta.json.version` by exactly 1 and update `updatedAt`.

## Product quality

A game must be a real interactive experience, not an explanation page. Before considering it complete:

1. The first screen makes the goal and primary action understandable within 10 seconds.
2. The core interaction matches the game idea.
3. There is immediate visual feedback for player actions; use sound/haptics only when they improve the experience and fail safely.
4. There is a clear success/failure/result state and a replay path.
5. Mobile touch targets and viewport behavior are correct.
6. Content is not thin repetition. Add enough variation to make replay meaningful when the concept calls for it.
7. The design should feel intentional and game-specific rather than generic AI-card UI.

## Brand

The OneShotGames parent UI uses white, deep navy, electric blue, purple, magenta, orange and aqua. Individual games may have their own art direction. Do not force the parent brand palette on the game if another direction better serves the concept.

The build injects the common OneShotGames runtime automatically, including brand/author/share controls.

## Safety

Do not implement illegal, dangerous, abusive, privacy-invasive, copyright-infringing, or otherwise disallowed requests. Add the `osg-rejected` label, explain the reason on the Issue, and close it without implementing.

## Build and completion

Run or satisfy the equivalent of:

`node scripts/build-osg.mjs`

Do not report completion at code-writing or PR creation. Merge to `main`, wait for `Deploy OneShotGames production`, and verify the real Firebase URL:

`https://hitobito-osg.web.app/g/<gameId>/`

Only after the production game is playable should the request Issue be closed.
