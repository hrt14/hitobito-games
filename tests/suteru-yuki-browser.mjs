import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/apps/suteru-yuki/';
const out = process.env.OUTPUT_DIR || 'test-results/suteru-yuki';
fs.mkdirSync(out, { recursive: true });

async function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function openReady(page) {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#app').waitFor({ state: 'visible', timeout: 10000 });
}

async function reloadReady(page) {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#app').waitFor({ state: 'visible', timeout: 10000 });
}

async function run(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  page.on('console', msg => { if (msg.type() === 'error') console.log(`[console:${label}]`, msg.text()); });
  await openReady(page);
  await page.evaluate(() => localStorage.clear());
  await reloadReady(page);

  await assert(await page.getByRole('heading', { name: /やらないことを/ }).isVisible(), `${label}: title not visible`);
  await assert(await page.getByRole('button', { name: /この.*件を絞る/ }).isDisabled(), `${label}: must not start with fewer than 3 tasks`);

  const presetButtons = page.locator('[data-preset]');
  await presetButtons.nth(0).click();
  await presetButtons.nth(1).click();
  await assert(await page.getByRole('button', { name: /この2件を絞る/ }).isDisabled(), `${label}: 2-task guard failed`);
  await presetButtons.nth(2).click();
  await assert(!(await page.getByRole('button', { name: /この3件を絞る/ }).isDisabled()), `${label}: 3-task start should enable`);

  await page.getByRole('button', { name: /この3件を絞る/ }).click();
  await assert(await page.getByRole('heading', { name: /今日、何を/ }).isVisible(), `${label}: criterion screen missing`);
  await page.getByRole('button', { name: /成果/ }).click();
  await page.getByRole('button', { name: /候補を捨て始める/ }).click();

  const card = page.locator('#decisionCard');
  const box = await card.boundingBox();
  await assert(box, `${label}: decision card missing`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await assert((await page.locator('.topbar').textContent()).includes('2/3'), `${label}: swipe discard did not advance`);

  await page.getByRole('button', { name: '残す' }).click();
  await page.getByRole('button', { name: '残す' }).click();
  await assert(await page.getByRole('heading', { name: /両方は/ }).isVisible(), `${label}: final duel missing`);

  const duelButtons = page.locator('[data-win]');
  await duelButtons.nth(0).click();
  await assert(await page.getByRole('heading', { name: /今日やるのは/ }).isVisible(), `${label}: result missing`);
  await assert(await page.locator('.champion strong').textContent(), `${label}: champion missing`);
  await assert((await page.locator('.not-today p').count()) >= 2, `${label}: not-today list too small`);

  const primaryHeight = await page.locator('#copyResult').evaluate(el => el.getBoundingClientRect().height);
  await assert(primaryHeight >= 44, `${label}: tap target too short (${primaryHeight})`);

  await page.screenshot({ path: `${out}/${label}-result.png`, fullPage: true });
  await page.getByRole('button', { name: /この1つを始める/ }).click();
  await reloadReady(page);
  await assert(await page.locator('.previous').isVisible(), `${label}: revisit summary missing after reload`);
  await assert((await page.locator('.previous').textContent()).includes('前回の一番'), `${label}: revisit copy missing`);

  await page.getByRole('button', { name: /＋ 返信する/ }).click();
  await page.getByRole('button', { name: /＋ 資料を作る/ }).click();
  await page.getByRole('button', { name: /＋ 調べもの/ }).click();
  await page.getByRole('button', { name: /この3件を絞る/ }).click();
  await page.getByRole('button', { name: /← 候補を直す/ }).click();
  await assert(await page.locator('#taskInput').isVisible(), `${label}: back path failed`);
  await assert((await page.locator('.home-link').getAttribute('href')) === '/', `${label}: exit/home href incorrect`);

  console.log(`PASS ${label}: first visit, guard, criterion, swipe discard, keep path, duel, result, tap size, save/reload/revisit, back/home`);
  await browser.close();
}

await run({ width: 1280, height: 900 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
