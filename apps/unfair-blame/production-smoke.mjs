import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.UNFAIR_BLAME_PRODUCTION_URL || 'https://levelup.hitobito.jp/apps/unfair-blame/';
const artifacts = path.resolve('apps/unfair-blame/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

try {
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
  if (!response || !response.ok()) throw new Error(`Production route did not return 2xx: ${response?.status()}`);

  await page.locator('#introView h1').waitFor({ state: 'visible', timeout: 10_000 });
  const title = await page.locator('#introView h1').innerText();
  if (!title.includes('悪くないのに責められ') || !title.includes('行動まで制限')) {
    throw new Error(`Unexpected production title: ${title}`);
  }
  if (!(await page.locator('.case-card').isVisible())) throw new Error('Production case card is not visible.');
  if (!(await page.locator('#startBtn').isVisible())) throw new Error('Production primary action is not visible.');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Production mobile viewport has horizontal overflow: ${overflow}px`);

  await page.locator('#startBtn').click();
  await page.locator('#sortView.active').waitFor({ state: 'visible', timeout: 5_000 });
  const firstEvidence = await page.locator('#evidenceText').innerText();
  if (!firstEvidence.trim()) throw new Error('Production training did not render first evidence card.');

  await page.screenshot({ path: path.join(artifacts, '04-production-route-mobile.png'), fullPage: true });
  console.log(JSON.stringify({
    status: 'UNFAIR BLAME PRODUCTION ROUTE VERIFIED',
    url,
    httpStatus: response.status(),
    viewport: '390x844',
    title,
    firstEvidence,
    horizontalOverflow: overflow
  }, null, 2));
} finally {
  await browser.close();
}
