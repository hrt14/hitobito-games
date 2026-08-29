import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.PRAISE_MANUAL_URL || 'http://127.0.0.1:4173/apps/praise-manual/';
const artifacts = path.resolve('apps/praise-manual/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));
await page.addInitScript(() => {
  navigator.share = async (payload) => { window.__capturedShare = payload; };
});

function fail(message) { throw new Error(message); }

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const intro = await page.locator('#app').innerText();
  if (!intro.includes('私の褒め方') || !intro.includes('10問')) fail('First view does not explain the diagnosis.');
  if (!(await page.locator('#start').isVisible())) fail('Start button is not visible.');
  const startBox = await page.locator('#start').boundingBox();
  if (!startBox || startBox.height < 48) fail(`Start tap target too short: ${startBox?.height}`);
  if ((await page.locator('input, textarea, select').count()) !== 0) fail('Unexpected typing control found.');
  await page.screenshot({ path: path.join(artifacts, '01-intro-390.png'), fullPage: true });

  await page.locator('#start').click();
  for (let n = 0; n < 10; n += 1) {
    const questionText = await page.locator('#app').innerText();
    if (!questionText.includes(`${n + 1} / 10`)) fail(`Question progress mismatch at ${n + 1}.`);
    const choices = page.locator('.choice');
    if ((await choices.count()) !== 2) fail(`Question ${n + 1} does not have two choices.`);
    const boxes = await choices.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
    if (boxes.some((height) => height < 48)) fail(`Question ${n + 1} tap target too short: ${JSON.stringify(boxes)}`);
    await choices.nth(n % 2).click();
  }

  const resultText = await page.locator('#app').innerText();
  for (const required of ['YOUR PRAISE MANUAL', '3-STEP RECIPE', 'そのまま使える褒め方', '逆に、これは刺さりにくい', 'この取説を送る']) {
    if (!resultText.includes(required)) fail(`Result is missing: ${required}`);
  }
  if ((await page.locator('.axis').count()) !== 7) fail('Seven diagnosis axes were not rendered.');
  if (!resultText.includes('一般人口での順位')) fail('Percent interpretation disclaimer is missing.');
  await page.screenshot({ path: path.join(artifacts, '02-result-390.png'), fullPage: true });

  await page.locator('#send').click();
  const sharePayload = await page.evaluate(() => window.__capturedShare);
  if (!sharePayload?.url || !sharePayload.url.includes('?r=')) fail('Share URL was not generated.');

  const sharedPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const sharedErrors = [];
  sharedPage.on('console', (message) => { if (message.type() === 'error') sharedErrors.push(message.text()); });
  sharedPage.on('pageerror', (error) => sharedErrors.push(String(error)));
  await sharedPage.goto(sharePayload.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const sharedText = await sharedPage.locator('#app').innerText();
  if (!sharedText.includes('共有された「褒め方」取説') || !sharedText.includes('この人を褒めるなら')) fail('Shared-result view did not render.');
  if (!sharedText.includes('自分の「褒め方」取説も作る')) fail('Shared-result acquisition loop is missing.');
  if (sharedText.includes('QUESTION 01')) fail('Per-question answers leaked into shared result.');
  await sharedPage.screenshot({ path: path.join(artifacts, '03-shared-390.png'), fullPage: true });

  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow390 > 1) fail(`390px viewport has horizontal overflow: ${overflow390}px`);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow360 > 1) fail(`360px viewport has horizontal overflow: ${overflow360}px`);
  await page.locator('#start').click();
  const smallBoxes = await page.locator('.choice').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (smallBoxes.some((box) => box.width < 300 || box.height < 48)) fail(`360px choices too small: ${JSON.stringify(smallBoxes)}`);
  await page.screenshot({ path: path.join(artifacts, '04-question-360.png'), fullPage: true });
  await sharedPage.close();

  if (consoleErrors.length || sharedErrors.length) fail('Browser console errors:\n' + [...consoleErrors, ...sharedErrors].join('\n'));
  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first-view clarity and visible start action',
      'tap-only 10-question completion',
      'seven-axis result and practical praise examples',
      'percent interpretation disclaimer',
      'share URL generation and shared-result rendering',
      'shared-result acquisition loop without per-question disclosure',
      'mobile overflow and tap targets'
    ],
    consoleErrors: []
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
