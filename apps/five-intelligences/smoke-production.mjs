import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const url = process.env.FIVE_INTELLIGENCES_URL || 'https://levelup.hitobito.jp/apps/five-intelligences/';
const artifacts = path.resolve('apps/five-intelligences/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['Pixel 7'] });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

try {
  const response = await page.goto(`${url}?production-smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!response || !response.ok()) throw new Error(`Production route returned HTTP ${response?.status() ?? 'no response'}`);
  await page.locator('h1').getByText('60秒で').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#startBtn').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(artifacts, 'production-start.png'), fullPage: true });

  await page.locator('#startBtn').click();
  await page.locator('#playScreen.active').waitFor({ state: 'visible' });

  for (let i = 0; i < 10; i += 1) {
    await page.waitForFunction((expected) => document.querySelector('#questionCounter')?.textContent?.trim() === expected, `${i + 1} / 10`);
    await page.waitForFunction(() => !document.querySelector('#switchGrid')?.classList.contains('locked'));
    await page.locator('#switchGrid button[data-type="IQ"]').click();
    if (i < 9) {
      await page.waitForFunction((expected) => document.querySelector('#questionCounter')?.textContent?.trim() === expected, `${i + 2} / 10`, { timeout: 5000 });
    }
  }

  await page.locator('#resultScreen.active').waitFor({ state: 'visible', timeout: 5000 });
  const score = (await page.locator('#scoreValue').textContent())?.trim() || '';
  if (!/^\d{1,3}$/.test(score)) throw new Error(`Unexpected result score: ${score}`);
  const typeRows = await page.locator('#typeResults .type-row').count();
  if (typeRows !== 5) throw new Error(`Expected 5 intelligence result rows, got ${typeRows}`);
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);

  await page.screenshot({ path: path.join(artifacts, 'production-result.png'), fullPage: true });
  console.log(`FIVE INTELLIGENCES PRODUCTION MOBILE PLAYTEST OK: ${url} score=${score} rows=${typeRows}`);
} finally {
  await browser.close();
}
