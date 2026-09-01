import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.BEDTIME_WORLD_URL || 'http://127.0.0.1:4173/apps/bedtime-world/';
const artifacts = path.resolve('apps/bedtime-world/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));

function fail(message) { throw new Error(message); }
async function noOverflow(label) {
  const px = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (px > 1) fail(`${label}: horizontal overflow ${px}px`);
}
async function heading() { return page.locator('h1,h2').first().innerText(); }

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.removeItem('levelup-bedtime-world-v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  const firstHeading = await heading();
  if (!firstHeading.includes('今夜から') || !firstHeading.includes('寝る前に続きがある')) fail(`First promise unclear: ${firstHeading}`);
  if ((await page.locator('[data-world]').count()) !== 4) fail('Four persistent-world choices are not visible.');
  await noOverflow('390 intro');
  await page.screenshot({ path: path.join(artifacts, '01-intro-390.png'), fullPage: true });

  await page.getByRole('button', { name: /夜行列車の世界/ }).click();
  if (!(await page.locator('h1').innerText()).includes('今夜も、続きがある')) fail('World selection did not reach nightly home.');
  if (!(await page.locator('.teaser-title').innerText()).includes('月明かりのホーム')) fail('Tonight location is missing.');
  if ((await page.locator('.landmark').count()) !== 14) fail('World map does not expose the planned 14-step arc.');
  const enter = page.getByRole('button', { name: '布団に入った。入口を開く' });
  const enterBox = await enter.boundingBox();
  if (!enterBox || enterBox.height < 44) fail('Primary bedtime action is too small.');
  await page.screenshot({ path: path.join(artifacts, '02-home-390.png'), fullPage: true });

  await enter.click();
  if (!(await page.locator('.screen-title').innerText()).includes('月明かりのホーム')) fail('Portal title is wrong.');
  if ((await page.locator('[data-route]').count()) !== 3) fail('Three meaningful route choices are missing.');
  await page.locator('[data-route="1"]').click();
  await page.getByRole('button', { name: 'この入口から入る' }).click();

  if ((await page.locator('[data-fragment]').count()) !== 6) fail('Six sensory fragments are missing.');
  const close = page.getByRole('button', { name: '目を閉じる準備ができた' });
  if (!(await close.isDisabled())) fail('Close action must remain disabled before three fragments.');
  await page.locator('[data-fragment="0"]').click();
  await page.locator('[data-fragment="0"]').click();
  if ((await page.locator('.slot.filled').count()) !== 0) fail('Fragment deselection did not recover cleanly.');
  for (const i of [0,1,2]) await page.locator(`[data-fragment="${i}"]`).click();
  if ((await page.locator('.slot.filled').count()) !== 3) fail('Exactly three chosen cues were not placed into slots.');
  if (await close.isDisabled()) fail('Close action did not enable after three fragments.');
  await page.screenshot({ path: path.join(artifacts, '03-cues-390.png'), fullPage: true });

  await close.click();
  const darkTitle = await page.locator('.dark-screen h2').innerText();
  if (!darkTitle.includes('まだ名前のない駅で降りる')) fail(`Selected route was not carried into lights-out screen: ${darkTitle}`);
  const darkText = await page.locator('.dark-screen').innerText();
  for (const cue of ['遠くで鳴る、低い汽笛','窓に流れる青い灯り','少し冷たい手すり']) {
    if (!darkText.includes(cue)) fail(`Chosen sensory cue missing: ${cue}`);
  }
  await page.screenshot({ path: path.join(artifacts, '04-lights-out-390.png'), fullPage: true });

  await page.getByRole('button', { name: '画面を伏せる' }).click();
  if (!(await page.locator('.dark-screen h2').innerText()).includes('続きは、明日の夜')) fail('Completion screen is missing.');
  if (!(await page.locator('.dim').innerText()).includes('水上の駅')) fail('Tomorrow teaser is missing.');
  await page.getByRole('button', { name: 'ホームへ戻る' }).click();
  if (!(await page.locator('h1').innerText()).includes('今夜の続きを、もう見た')) fail('Completed state is not shown on return home.');
  if (!(await page.locator('.map-head').innerText()).includes('1夜ぶん進行')) fail('Night progress did not increment once.');

  // Same-day replay must not unlock tomorrow twice.
  await page.getByRole('button', { name: 'もう一度、入口を見る' }).click();
  await page.getByRole('button', { name: 'この入口から入る' }).click();
  for (const i of [0,1,2]) await page.locator(`[data-fragment="${i}"]`).click();
  await page.getByRole('button', { name: '目を閉じる準備ができた' }).click();
  await page.getByRole('button', { name: '画面を伏せる' }).click();
  await page.getByRole('button', { name: 'ホームへ戻る' }).click();
  if (!(await page.locator('.map-head').innerText()).includes('1夜ぶん進行')) fail('Same-day replay incorrectly incremented progress twice.');
  if (!(await page.locator('.teaser-title').innerText()).includes('月明かりのホーム')) fail('Same-day replay incorrectly advanced tonight location.');

  // Reload and revisit should preserve the world and progress.
  await page.reload({ waitUntil: 'domcontentloaded' });
  if (!(await page.locator('h1').innerText()).includes('今夜の続きを、もう見た')) fail('Reload did not restore completed state.');
  if (!(await page.locator('.map-head').innerText()).includes('1夜ぶん進行')) fail('Reload lost progress.');
  await page.getByRole('button', { name: '世界' }).click();
  if (!(await page.locator('.screen-title').innerText()).includes('夜行列車の世界')) fail('Settings did not preserve chosen world.');
  await page.getByRole('button', { name: '戻る' }).click();
  if (!(await page.locator('h1').innerText()).includes('今夜の続きを、もう見た')) fail('Settings back path failed.');

  await page.setViewportSize({ width: 320, height: 568 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await noOverflow('320 revisit');
  const mobileEnter = page.getByRole('button', { name: 'もう一度、入口を見る' });
  const mobileBox = await mobileEnter.boundingBox();
  if (!mobileBox || mobileBox.height < 44) fail('320px primary target is too small.');
  await page.screenshot({ path: path.join(artifacts, '05-revisit-320.png'), fullPage: true });

  if (errors.length) fail('Browser page errors:\n' + errors.join('\n'));
  const body = await page.locator('body').innerText();
  if (/\b(undefined|NaN|Infinity)\b/.test(body)) fail('Invalid runtime value became visible.');

  const summary = {
    url,
    browser: 'Playwright Chromium',
    viewports: ['390x844', '320x568'],
    tested: [
      'first-visit benefit and four world choices',
      'persistent world map and bedtime action',
      'three route choices',
      'three-of-six sensory cue interaction',
      'disabled and recoverable failure path',
      'lights-out handoff with selected cues',
      'completion and tomorrow teaser',
      'same-day double-progress protection',
      'reload and revisit persistence',
      'settings back path',
      '320px overflow and tap target',
    ],
    pageErrors: errors,
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
