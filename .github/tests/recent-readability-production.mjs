import { chromium } from 'playwright';

const apps = [
  { slug: 'work-avalanche', selector: '#app', action: 'button' },
  { slug: 'miss-check-reflex', selector: '#app', action: 'button' },
  { slug: 'success-side', selector: '#app', action: '#startBtn' },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const app of apps) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const url = `https://levelup.hitobito.jp/apps/${app.slug}/?verify=${Date.now()}`;
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!response?.ok()) throw new Error(`${app.slug}: HTTP ${response?.status()}`);
    await page.waitForSelector(app.selector, { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(800);

    const readable = await page.evaluate(() => {
      const targets = Array.from(document.querySelectorAll('.eyebrow,.scene-mark,.scene-label,.step-head p,.progress-head,.counter,.win-label,.pill,.lane-label,.metric span,.field-help,.tiny,.footer-note,.test-badge,.meter,.cut-status span,.cut-status em,.risk-done>span,.action-zone>p,.result-scene span,.result-rule p,.result-stats span,.result-stats small,.mini,footer,.lead,.hero-copy,.section-copy,.scene-sub,.intro-card p,.finish-line,.timer-label,.notice,.feedback,.history,.action span,.choice span,.category span,.risk-choice span,.result-rule strong,.result-scene strong,.field label,.task span,.shrink-item,.summary-box span,.pressure,.cue,.previous,.action b,.choice b,.category b,.risk-choice b,.guard-box>p,.action-option,.btn,.primary,.secondary,.hold,.branch-chip,.guard-option'));
      const visible = targets.filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
      });
      const tooSmall = visible.map((el) => ({ text: (el.textContent || '').trim().slice(0, 40), size: parseFloat(getComputedStyle(el).fontSize) || 0 })).filter((x) => x.size < 14);
      return { count: visible.length, tooSmall };
    });
    if (readable.count === 0) throw new Error(`${app.slug}: no readability targets found`);
    if (readable.tooSmall.length) throw new Error(`${app.slug}: text below 14px: ${JSON.stringify(readable.tooSmall.slice(0, 5))}`);

    const candidates = page.locator(app.action);
    const count = await candidates.count();
    let clicked = false;
    for (let i = 0; i < count; i += 1) {
      const candidate = candidates.nth(i);
      if (await candidate.isVisible() && await candidate.isEnabled()) {
        await candidate.click({ timeout: 10000 });
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error(`${app.slug}: no visible enabled interaction control found`);
    await page.waitForTimeout(300);
    console.log(`[production-mobile] ${app.slug}: PASS (${readable.count} readable targets)`);
    await page.close();
  }
} finally {
  await browser.close();
}
