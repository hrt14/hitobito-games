# 100人いたら何位？ — Quality Report

## Test environment
- Browser/device: production Playwright Chromium verification scheduled
- Viewport: 390x844 and 360x800
- Production URL: https://levelup.hitobito.jp/apps/100nin-rank/

## Verification target
- First screen communicates the title, 12-question length, and non-statistical estimate disclosure.
- All 12 questions expose four concrete choices and complete without JavaScript errors.
- The live crowd contains exactly 100 markers.
- Result exposes an overall rank plus five dimension ranks.
- Result explicitly states that it is not a national survey, standardized test, or actual 100-person comparison.
- Share URL opens a read-only shared result and offers the recipient a one-tap route to take the diagnosis.
- 360px viewport has no horizontal overflow.

## Current status
Production verification is driven by `.github/workflows/verify-100nin-rank-production.yml`. Do not treat this report as PASS until that workflow succeeds against the deployed Firebase URL.

## Final scores
Clarity: pending production evidence
Usefulness: pending production evidence
Interaction quality: pending production evidence
Uniqueness: pending production evidence
Repeat value: pending production evidence
