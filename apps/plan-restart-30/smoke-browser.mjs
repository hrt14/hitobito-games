import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.PLAN_RESTART_30_URL || 'http://127.0.0.1:4173/apps/plan-restart-30/';
const artifacts = path.resolve('apps/plan-restart-30/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
const notes = [];

function ok(condition, message) {
  if (!condition) throw new Error(message);
  notes.push(`PASS: ${message}`);
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  ok(await page.getByRole('heading', { name: /予定が崩れたら/ }).isVisible(), 'first visit shows the purpose immediately');
  ok(await page.getByRole('button', { name: /いま立て直す/ }).isVisible(), 'start action is visible without scrolling');
  await page.screenshot({ path: path.join(artifacts, '01-first-visit.png'), fullPage: true });

  await page.getByRole('button', { name: /いま立て直す/ }).click();
  ok(await page.getByText('まず、ここまでを切る。').isVisible(), 'start reaches the cut-the-past interaction');
  await page.getByRole('button', { name: /ここまでを切る/ }).click();
  await page.waitForTimeout(450);
  ok(await page.getByText('残っている時間だけ見る。').isVisible(), 'cut interaction advances to remaining-time view');

  await page.locator('.time[data-min="30"]').click();
  ok(await page.locator('#moveTitle').isVisible() && (await page.locator('#moveTitle').textContent()) === '10分だけ一本化', 'remaining-time choice returns a concrete reduced next move');
  ok(await page.getByRole('button', { name: /このサイズで始める/ }).isEnabled(), 'next step is enabled only after a time choice');
  await page.getByRole('button', { name: /このサイズで始める/ }).click();
  ok(await page.getByText('2秒押して、開始。').isVisible(), 'commit screen explains the physical start action');
  ok((await page.locator('#commitTitle').textContent()) === '10分だけ一本化', 'commit screen preserves the selected next move');

  const hold = page.getByRole('button', { name: /2秒長押しして開始/ });
  const box = await hold.boundingBox();
  if (!box) throw new Error('hold button has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2150);
  await page.mouse.up();
  await page.waitForTimeout(250);
  ok(await page.getByText('遅れではなく、').isVisible(), 'successful hold reaches completion');
  ok((await page.locator('#doneMove').textContent()) === '10分だけ一本化', 'completion preserves the chosen next move');
  ok((await page.locator('#todayCount').textContent()) === '1', 'completion records one real restart today');
  await page.screenshot({ path: path.join(artifacts, '02-complete.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  ok(await page.getByRole('button', { name: /また30秒で立て直す/ }).isVisible(), 'revisit recognizes prior completion without blocking reuse');

  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  ok(bodyWidth, '390px mobile viewport has no horizontal overflow');

  await page.getByRole('button', { name: /また30秒で立て直す/ }).click();
  await page.getByRole('button', { name: /ここまでを切る/ }).click();
  await page.waitForTimeout(450);
  await page.locator('.time[data-min="10"]').click();
  ok(await page.locator('#moveTitle').isVisible() && (await page.locator('#moveTitle').textContent()) === '3分だけ着手', 'low-time path reduces the next move further');

  fs.writeFileSync(path.join(artifacts, 'playtest.txt'), notes.join('\n') + '\n');
  console.log(notes.join('\n'));
} finally {
  await browser.close();
}
