import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.env.TWO_TASKS_ONLY_URL || 'https://levelup.hitobito.jp/apps/two-tasks-only/';
const outDir = path.resolve('apps/two-tasks-only/.artifacts');
fs.mkdirSync(outDir, { recursive: true });
const label = url.includes('web.app') ? 'firebase' : 'custom';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => localStorage.removeItem('levelup-two-tasks-only-v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#startBtn').waitFor({ state: 'visible' });
  const hero = await page.locator('#startScreen h1').innerText();
  if (!hero.includes('今日やるのは') || !hero.includes('2つだけ')) throw new Error(`Unexpected hero: ${hero}`);

  await page.locator('#startBtn').click();
  await page.locator('#taskInput').fill(['emb資料を仕上げる', '競合を確認する', 'メールを返す', '新アプリを考える'].join('\n'));
  await page.locator('#sortBtn').click();

  await page.locator('#todayBtn').click();
  await page.locator('#todayBtn').click();
  const twoSeats = await page.locator('#slots .slot.filled').count();
  if (twoSeats !== 2) throw new Error(`Expected 2 filled TODAY seats, got ${twoSeats}`);

  await page.locator('#todayBtn').click();
  await page.locator('#swapScreen.active').waitFor({ state: 'visible' });
  const swapHeadline = await page.locator('#swapScreen h1').innerText();
  if (!swapHeadline.includes('満席')) throw new Error(`Swap screen did not explain full seats: ${swapHeadline}`);
  await page.locator('#swapList .slot-button').first().click();

  await page.locator('#dropBtn').click();
  await page.locator('#resultScreen.active').waitFor({ state: 'visible' });
  const result = await page.locator('#resultBoard').innerText();
  if (!result.includes('競合を確認する') || !result.includes('メールを返す')) throw new Error(`Unexpected TODAY result: ${result}`);
  const later = await page.locator('#laterCount').innerText();
  const dropped = await page.locator('#dropCount').innerText();
  if (later !== '1' || dropped !== '1') throw new Error(`Unexpected off-today counts later=${later} dropped=${dropped}`);

  await page.locator('#startedBtn').click();
  await page.locator('#startedMessage.show').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(outDir, `${label}-result.png`), fullPage: true });

  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);
  console.log(`TWO TASKS ONLY PRODUCTION PLAYTEST OK: ${url}`);
} finally {
  await browser.close();
}
