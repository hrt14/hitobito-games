# あなたの人生、何に消えてる？ — Quality Report

## Test environment
- Browser/device: GitHub Actions headless Google Chrome / mobile viewport 390×844
- Production URL: https://levelup.hitobito.jp/apps/jinsei-kieteru/
- Production verification: PASS (2026-08-30 JST)

## Verified behavior
- Production URL returned HTTP 200 and loaded the intended app title.
- Default age 40 → assumed age 90, with 4 free hours/day, displayed 8年4か月 of free life.
- Increasing smartphone/video time from 3 to 4 hours/day recalculated free life to 6年3か月.
- Changing current age from 40 to 50 after that recalculated free life to 5年0か月.
- Increasing work/study enough to exceed 24 total hours/day displayed the overflow warning.
- Mobile interaction test completed without application errors; analytics transport aborts are excluded from app-error checks.

## Share behavior
- 1080×1350 PNG share-card generation is implemented.
- Web Share with file is used when the browser supports it; otherwise text share/clipboard fallback is implemented.
- iPhone native share-sheet UI itself remains manual-only because the CI browser cannot reproduce the iOS share sheet.

## Final status
- Core calculation: PASS
- Mobile interaction: PASS
- Production route: PASS
- Overflow handling: PASS
- Share implementation: PASS (code path); native iPhone share-sheet UI not manually verified here
