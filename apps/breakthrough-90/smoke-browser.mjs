import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.BREAKTHROUGH_90_URL || 'http://127.0.0.1:4173/apps/breakthrough-90/';
const outDir = path.resolve('apps/breakthrough-90/.artifacts');
fs.mkdirSync(outDir, { recursive: true });
const log = [];
const note = (message) => { log.push(message); console.log(message); };
const assert = (condition, message) => { if (!condition) throw new Error(message); note(`PASS: ${message}`); };

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
page.on('console', msg => { if (msg.type() === 'error') log.push(`CONSOLE ERROR: ${msg.text()}`); });
page.on('pageerror', err => log.push(`PAGE ERROR: ${err.message}`));

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, '01-first.png'), fullPage: true });
  assert(await page.locator('[data-stage="intro"]').isVisible(), 'first visit opens on the intro screen');
  assert((await page.locator('h1').innerText()).includes('次の一手'), 'first screen states the concrete benefit');
  assert(await page.locator('#start-btn').isDisabled(), 'empty problem cannot start (failure path is blocked)');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, '390px mobile viewport has no horizontal overflow');
  const startBox = await page.locator('#start-btn').boundingBox();
  assert(startBox && startBox.height >= 48, 'primary mobile tap target is at least 48px high');

  await page.locator('#problem').fill('新しい企画が止まり、次に何を試せばいいか分からない');
  await page.locator('#before-range').fill('9');
  assert(!(await page.locator('#start-btn').isDisabled()), 'entering a concrete problem enables the start action');
  await page.locator('#start-btn').click();
  assert(await page.locator('[data-stage="zoom"]').isVisible(), 'start moves directly into the zoom-out interaction');

  await page.locator('#back-btn').click();
  assert(await page.locator('[data-stage="intro"]').isVisible(), 'back returns one step without leaving the app');
  assert((await page.locator('#problem').inputValue()).includes('新しい企画'), 'back preserves the in-progress problem');
  await page.locator('#start-btn').click();

  assert(await page.locator('#zoom-next').isDisabled(), 'zoom step cannot be skipped before widening the horizon');
  const beforeWidth = (await page.locator('#zoom-problem').boundingBox()).width;
  await page.locator('#horizon-range').fill('10');
  const afterWidth = (await page.locator('#zoom-problem').boundingBox()).width;
  assert(afterWidth < beforeWidth * 0.7, 'moving to a 10-year horizon visibly shrinks the problem card');
  assert(!(await page.locator('#zoom-next').isDisabled()), '10-year zoom unlocks the next step');
  await page.locator('#zoom-next').click();

  const chipBox = await page.locator('.chip:not(.discarded)').first().boundingBox();
  assert(chipBox && chipBox.height >= 44, 'comparison chips remain comfortably tappable on mobile');
  for (let i = 0; i < 4; i += 1) {
    await page.locator('.chip:not(.discarded)').first().click();
  }
  assert((await page.locator('.target strong').innerText()) === '昨日の自分', 'discarding all external comparisons reveals yesterday-self as the target');
  assert(await page.locator('#compare-next').isDisabled(), 'comparison step still requires a personal 1mm delta');
  await page.locator('#delta').fill('昨日より仮説を1つ減らせた');
  await page.locator('#compare-next').click();

  const typeBox = await page.getByRole('button', { name: '試す', exact: true }).boundingBox();
  assert(typeBox && typeBox.height >= 44, 'action-type buttons remain comfortably tappable on mobile');
  await page.getByRole('button', { name: '試す', exact: true }).click();
  await page.locator('#next-action').fill('15分で最小版を1人に見せる');
  const hold = page.locator('#hold-btn');
  await hold.focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('[data-stage="rate"]').isVisible(), 'keyboard activation commits the action without requiring pointer hold');

  await page.locator('#after-range').fill('4');
  await page.locator('#finish-btn').click();
  assert(await page.locator('[data-stage="done"]').isVisible(), 'success path reaches the BREAKTHROUGH CARD');
  assert((await page.locator('.action-result').innerText()).includes('最小版'), 'result card preserves the concrete next 15-minute action');
  assert((await page.locator('.change').innerText()).includes('9 → 4'), 'result card shows before/after stuckness evidence');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('hitobito-levelup-breakthrough-90-v1')));
  assert(saved?.nextAction === '15分で最小版を1人に見せる', 'completion saves the last action locally');
  await page.screenshot({ path: path.join(outDir, '02-result.png'), fullPage: true });

  await page.locator('#launch-btn').click();
  assert(await page.locator('[data-stage="launch"]').isVisible(), 'launch mode removes extra decisions and shows only the chosen action');
  assert((await page.locator('.mission').innerText()).includes('15分で'), 'launch mode repeats the exact action to execute');

  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.locator('[data-stage="intro"]').isVisible(), 'reload returns safely to a fresh intro instead of a broken mid-stage state');
  assert((await page.locator('.last strong').innerText()).includes('最小版'), 'revisit surfaces the previous action from local storage');
  await page.screenshot({ path: path.join(outDir, '03-revisit.png'), fullPage: true });

  const errors = log.filter(line => line.startsWith('CONSOLE ERROR') || line.startsWith('PAGE ERROR'));
  assert(errors.length === 0, 'no browser console/page errors occurred during the full mobile flow');
  fs.writeFileSync(path.join(outDir, 'playtest.log'), log.join('\n') + '\n');
  note('REAL MOBILE PLAYTEST COMPLETE');
} finally {
  await browser.close();
}
