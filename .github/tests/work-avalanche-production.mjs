import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.env.WORK_AVALANCHE_URL || 'https://levelup.hitobito.jp/apps/work-avalanche/?test=1';
const outDir = path.resolve('.artifacts/work-avalanche-production');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

await page.addInitScript(() => {
  localStorage.removeItem('levelup-work-avalanche-v1');
  localStorage.removeItem('levelup-work-avalanche-history-v1');
});

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  assert(response && response.ok(), `production route returned ${response?.status()}`);
  await page.locator('#app').waitFor({ state: 'visible', timeout: 20_000 });

  assert.match(await page.title(), /仕事の雪崩を止める/);
  assert.equal(new URL(page.url()).pathname, '/apps/work-avalanche/');

  const initialOverflow = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert(initialOverflow.scrollWidth <= initialOverflow.innerWidth + 1, `horizontal overflow at setup: ${JSON.stringify(initialOverflow)}`);

  await page.locator('#win-title').fill('提案の骨子を決める');
  await page.locator('#finish-line').fill('施策を3つ文章にする');
  await page.locator('form[data-form="setup"] button[type="submit"]').click();
  await page.locator('[data-action="meeting"]').waitFor();
  assert.match(await page.locator('#app').innerText(), /今日の1勝/);
  assert.match(await page.locator('#app').innerText(), /提案の骨子を決める/);

  await page.locator('[data-action="meeting"]').click();
  await page.locator('#triage-input').fill('見積もり条件を確認する');
  await page.locator('form[data-form="triage-add"] button[type="submit"]').click();
  await page.locator('[data-action="start-classify"]').click();
  await page.locator('[data-action="classify"][data-bucket="week"]').click();

  await page.locator('#return-action').fill('資料を開いて見出しを3つ書く');
  await page.locator('form[data-form="return-plan"] button[type="submit"]').click();
  await page.locator('[data-action="timer-complete"]').click();
  await page.locator('[data-action="rescue"]').waitFor();

  let dashboardText = await page.locator('#app').innerText();
  assert.match(dashboardText, /1勝へ復帰/);
  assert.match(dashboardText, /今日から逃がした/);
  assert.match(dashboardText, /\b1\b/);

  await page.locator('[data-action="rescue"]').click();
  await page.locator('#shrink-input').fill('タイトルと施策3つだけ書く');
  await page.locator('[data-action="rescue-start"]').click();
  await page.locator('[data-action="timer-complete"]').click();
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-action="close-partway"]').click();
  await page.locator('#close-next').fill('2ページ目の見出しから書く');
  await page.locator('[data-action="finish-close"]').click();

  const summary = await page.locator('#app').innerText();
  assert.match(summary, /次手/);
  assert.match(summary, /2ページ目の見出しから書く/);
  assert.match(summary, /重要仕事へ戻った回数/);
  assert.match(summary, /夕方の救出/);
  assert(!/NaN|Infinity|undefined/.test(summary), 'summary contains an invalid value');

  const finalOverflow = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert(finalOverflow.scrollWidth <= finalOverflow.innerWidth + 1, `horizontal overflow at summary: ${JSON.stringify(finalOverflow)}`);

  assert.equal(pageErrors.length, 0, `page errors:\n${pageErrors.join('\n')}`);

  await page.screenshot({ path: path.join(outDir, 'iphone-summary.png'), fullPage: true });
  const evidence = {
    url: page.url(),
    title: await page.title(),
    viewport: await page.viewportSize(),
    routeStatus: response.status(),
    initialOverflow,
    finalOverflow,
    pageErrors,
    checkedFlow: [
      '今日の1勝を固定',
      '会議後に増えた仕事を今週へ逃がす',
      '3分復帰',
      '12分救出',
      '途中の仕事に次の一手を置いて終了',
    ],
  };
  fs.writeFileSync(path.join(outDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
