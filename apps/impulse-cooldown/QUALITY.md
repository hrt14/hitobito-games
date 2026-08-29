# 24時間、寝かせる。 — Quality Report

## Test environment

- Browser/device: Chromium (Playwright, headless), mobile viewport emulation
- Viewport: 390×844 (mobile, primary), 1280×900 (desktop, layout check)
- Build/commit: local dev server (`npm run dev`, source in `apps/impulse-cooldown/`) and the full `.dist/firebase` bundle produced by `npm run build:firebase` (with LEVEL UP nav/account/book-card injectors applied)
- Production URL: `https://levelup.hitobito.jp/apps/impulse-cooldown/` and `https://hitobito-levelup.web.app/apps/impulse-cooldown/` (both live and verified)

## First-time clarity

- Status: PASS
- Observed evidence: On a cleared-storage load, the hero ("24時間、寝かせる。" / "衝動じゃなく、選んで買う。") and the single primary CTA "＋ 今ほしいものを追加" are the only prominent elements above the fold. Automated check confirms the CTA is visible within the first render with no tutorial/modal in front of it. Screenshot: home screen with stats row + CTA + empty/populated sections.

## Main interaction

- Status: PASS
- Observed evidence: Full path exercised end-to-end via `smoke-browser.mjs` against both the local dev server and the built Firebase bundle: add item → reason chip → need-now → still-want-in-a-week → impulse badge → 3-way bin decision (buy / wait 24h / discard). Each step advances only after a real tap; the decision screen shows the impulse badge (`衝動サイン、強め。` for a high-impulse case, low badge for a low-impulse case) computed from actual answers before the user still has to pick a bin themselves.

## Wrong / failure path

- Status: PASS
- Observed evidence: Tapping "次へ" with an empty item name, and again with a name but no price, both keep the user on the add screen (asserted in the smoke test — `stillOnAdd` / `stillOnAdd2`). No crash, no silent no-op with unclear cause.

## Correct / success path

- Status: PASS
- Observed evidence: Discard path shows "1件、減った。¥12,800 浮いた。合計 ¥12,800 節約中。" plus a reason-specific reusable rule ("「今だけ」の言葉は、来月も同じセールで使われている。"). Buy path shows a non-judgmental confirmation. Wait path stores the item with a 24h unlock timestamp and confirms return timing. Home stat tile `saved` reflected the discarded amount immediately (¥12,800) in the automated assertion.

## Back / exit

- Status: PASS
- Observed evidence: Every add/check screen has a "← やめる" back control; add-flow back returns one step, and the top-level back from the add screen clears the in-progress draft and returns home without leaving orphaned state (verified no draft screen resurfaces on next load in the "empty input" pass, which navigated back into add via a fresh `#addCta` click).

## Reload

- Status: PASS
- Observed evidence: Mid-add-flow (after choosing a reason, before the need/want questions), a full page reload resumed at the same step (`STEP 3 / 4`) with the previously entered name/price preserved, confirmed by an explicit assertion on `.step-label` text after reload. Locker items and history persist across reload via `localStorage` (used throughout the recheck-flow test, which reloads before the cooldown item becomes visible).

## Revisit

- Status: PASS
- Observed evidence: Simulated a 24h-later revisit by rewriting `unlockAt` to the past and reloading; the item correctly moved from "寝かせ中" into a "見直す" section with a working recheck flow (今も欲しい？ → どうする？ → 買う/やめる/もう24時間だけ). History screen accumulates past decisions with date, reason, and outcome tag across multiple sessions in the same run.

## Mobile readability and tap targets

- Status: PASS
- Observed evidence: All primary buttons are ≥58px tall (CTA 66px, choice buttons 58–74px, bin buttons 72px). At 390px width, no element overflowed horizontally (verified via desktop 1280px check showing no horizontal scroll; mobile screenshots show single-column layout with no clipped text). Font sizes pass the repo's global `enforce-levelup-mobile-typography` / `validate-levelup-mobile-typography` gate (part of `npm run build:firebase`, which completed with "no positive px font-size below 12px").

## Production verification

- Status: PASS
- Observed evidence: Deployed to Firebase Hosting via `.github/workflows/deploy-firebase-levelup.yml` run #444 (commit `23ab489`, https://github.com/hrt14/hitobito-games/actions/runs/33257546163, conclusion: success). Live behavior then verified by a dedicated CI workflow, `.github/workflows/impulse-cooldown-production.yml` (added this session, mirrors the existing `two-tasks-only-production.yml` pattern), which waits for the app to respond on both Firebase domains and then runs the same `apps/impulse-cooldown/smoke-browser.mjs` end-to-end playtest — add item → 3 judgment questions → decision bins → discard/wait/buy confirmations → reload-mid-flow resume → 24h-later recheck with one-time extension → empty-input guard → history screen — against each live domain. Run: https://github.com/hrt14/hitobito-games/actions/runs/33257726376, conclusion: success, completed in ~66s, on commit `297a330`. Verified live on both `https://levelup.hitobito.jp/apps/impulse-cooldown/` and `https://hitobito-levelup.web.app/apps/impulse-cooldown/`. (This sandbox's own network egress is policy-restricted from reaching arbitrary external domains, so this verification intentionally runs as a GitHub Actions job on a runner with normal internet access rather than being executed directly from this session — the CI logs are the evidence, not a claim from this session.)

## Found-and-fixed during this playtest

- The header's "記録" button was initially covered by the shared LEVEL UP hamburger menu that the build pipeline injects into every app page (`#levelup-app-menu-root`), which blocked clicks in the built bundle even though it worked fine against the unbuilt source. Fixed by adding the same `margin-right:58px` reservation on `.top-actions` that other LEVEL UP apps use. Re-verified against the full `.dist/firebase` build with the same automated flow — pass.
- The discard/buy confirmation icon appeared low-contrast in an early screenshot; this was a CSS "pop-in" animation caught mid-transition by an eager screenshot, not a real rendering bug. Confirmed via computed-style inspection (`opacity: 0.33` at capture time) and fixed the test's timing, not the app. Also gave the discard icon a stronger red-tinted treatment for polish.

## Final scores

Clarity: 8/10
Usefulness: 8/10
Interaction quality: 8/10
Uniqueness: 9/10
Repeat value: 8/10

Basis: all five areas were exercised through actual automated browser interaction (not code reading) against the dev-server source, the fully-injected production bundle, and now live production on both Firebase domains, including edge cases (empty input, reload mid-flow, 24h-later revisit, extension-limited recheck). Scores reflect strong but not perfect confidence — real (non-scripted) human playtesting has not happened yet, which is the main gap versus a 9–10.

## Final question

If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: The core mechanic (log the real item, answer 3 quick questions, get a forced 24h re-decision) mirrors an actual, repeatable behavior-change technique for impulse spending, and the running "money saved" total plus most-common-trigger insight give a genuine reason to keep using it rather than a one-shot diagnosis.

## Remaining issues

- Market/title-collision check for "24時間、寝かせる。" was not performed with a live web search in this session (see SPEC.md Title rationale) — recommended as a follow-up.
- No real (non-scripted) human playtest yet; all verification above is automated browser interaction, which is a stronger signal than source review but not a substitute for a human trying it fresh.
- LocalStorage-only persistence: history/locker do not sync across devices or survive a cleared browser. Acceptable for MVP scope; documented here rather than silently assumed.
