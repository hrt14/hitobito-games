import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.CONFIDENCE_BEFORE_RESULTS_URL || 'http://127.0.0.1:4173/apps/confidence-before-results/';
const artifacts = path.resolve('apps/confidence-before-results/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function visible(id) { return page.locator(`#${id}:not(.hidden)`).isVisible(); }
async function noOverflow(label) {
  const px = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (px > 1) fail(`${label}: horizontal overflow ${px}px`);
}
async function minHeight(selector, min, label) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box || box.height < min) fail(`${label}: target height ${box?.height}`);
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.removeItem('levelup-confidence-before-results-v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  if (!(await visible('stageChallenge'))) fail('First visit does not show challenge stage.');
  const firstText = await page.locator('#stageChallenge').innerText();
  if (!firstText.includes('結果が出る前に') || !firstText.includes('次の一手を出せる前提')) fail('Core promise is not clear on first screen.');
  if (!firstText.includes('成功する確信') && !firstText.includes('成功する保証')) fail('Success-guarantee boundary is missing.');
  await minHeight('#toBrake', 44, 'Primary challenge CTA');
  await noOverflow('390 first screen');
  await page.screenshot({ path: path.join(artifacts, '01-first-390.png'), fullPage: true });

  await page.getByRole('button', { name: /仕事の挑戦/ }).click();
  if (await page.locator('#toBrake').isDisabled()) fail('Challenge choice did not enable progression.');
  await page.locator('#toBrake').click();
  if (!(await visible('stageBrake'))) fail('Challenge did not advance to brake stage.');
  if (!(await page.locator('#challengeEcho').innerText()).includes('仕事')) fail('Selected challenge was not carried forward.');

  await page.getByRole('button', { name: /もっと準備してから動きたい/ }).click();
  await page.locator('#toSwitch').click();
  if (!(await visible('stageSwitch'))) fail('Brake choice did not advance to switch stage.');
  const switchText = await page.locator('#stageSwitch').innerText();
  if (!switchText.includes('自信 → 行動 → 修正 → 結果')) fail('Reversed confidence order is missing.');
  if (!switchText.includes('成功するか') || !switchText.includes('次の一手は出せる')) fail('Calibrated confidence copy is missing.');

  for (let i = 0; i < 3; i += 1) await page.locator('#chargeButton').click();
  if (await page.locator('#toAction').isDisabled()) fail('Three confidence taps did not unlock action stage.');
  const batteryWidth = await page.locator('#batteryFill').evaluate((node) => getComputedStyle(node).width);
  if (!batteryWidth || batteryWidth === '0px') fail('Confidence meter did not visibly fill.');
  await page.screenshot({ path: path.join(artifacts, '02-charged-390.png'), fullPage: true });
  await page.locator('#toAction').click();

  if (!(await visible('stageAction'))) fail('Switch did not advance to action stage.');
  await page.getByRole('button', { name: /3行だけ書く/ }).click();
  await page.locator('#toCountdown').click();
  if (!(await visible('stageCountdown'))) fail('Action did not open countdown.');
  if (!(await page.locator('#actionEcho').innerText()).includes('3行')) fail('Selected action was not carried to countdown.');
  await page.waitForFunction(() => !document.querySelector('#startNow')?.classList.contains('hidden'), null, { timeout: 5000 });
  if ((await page.locator('#countdownNumber').innerText()) !== 'GO') fail('Countdown did not reach GO.');
  await page.screenshot({ path: path.join(artifacts, '03-go-390.png'), fullPage: true });
  await page.locator('#startNow').click();

  if (!(await visible('stageReturn'))) fail('GO did not reach real-world check.');
  await minHeight('#markDone', 44, 'Done CTA');

  // Failure / friction path: hitting a wall should return to choosing a smaller move without losing the challenge.
  await page.locator('#hitWall').click();
  if (!(await visible('stageAction'))) fail('Wall path did not return to action selection.');
  if ((await page.locator('#toCountdown').isDisabled()) !== true) fail('Wall path should require a new next move.');
  await page.getByRole('button', { name: /10分だけ試す/ }).click();
  await page.locator('#toCountdown').click();
  await page.waitForFunction(() => !document.querySelector('#startNow')?.classList.contains('hidden'), null, { timeout: 5000 });
  await page.locator('#startNow').click();
  await page.locator('#markDone').click();

  if (!(await visible('stageDone'))) fail('Done action did not reach result.');
  if ((await page.locator('#wins').innerText()) !== '1') fail('Win count did not increment.');
  const resultText = await page.locator('#resultText').innerText();
  if (!resultText.includes('仕事') || !resultText.includes('10分')) fail('Result does not preserve challenge and action.');
  const saved = await page.evaluate(() => localStorage.getItem('levelup-confidence-before-results-v1'));
  if (!saved || !JSON.parse(saved).wins) fail('Win count was not saved locally.');
  if (!(await page.locator('#shareResult').isVisible())) fail('Mandatory share action is missing.');
  await page.screenshot({ path: path.join(artifacts, '04-result-390.png'), fullPage: true });

  await page.reload({ waitUntil: 'domcontentloaded' });
  if (!(await visible('stageChallenge'))) fail('Reload does not return to usable first stage.');
  if ((await page.locator('#wins').innerText()) !== '1') fail('Saved win count did not survive reload.');

  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await noOverflow('360 first screen');
  await minHeight('#toBrake', 44, '360 primary CTA');
  const choiceBoxes = await page.locator('#challengeChoices .choice').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect(); return { width: rect.width, height: rect.height };
  }));
  if (choiceBoxes.some((box) => box.width < 260 || box.height < 44)) fail('360px challenge choices are too small.');
  await page.screenshot({ path: path.join(artifacts, '05-first-360.png'), fullPage: true });

  if (pageErrors.length) fail('Browser page errors:\n' + pageErrors.join('\n'));
  const body = await page.locator('body').innerText();
  if (/\b(undefined|NaN|Infinity)\b/.test(body)) fail('Invalid visible runtime value detected.');

  const summary = {
    url,
    browser: 'Playwright Chromium',
    viewports: ['390x844', '360x800'],
    tested: [
      'first-time promise and calibrated-confidence boundary',
      'challenge selection and carry-forward',
      'brake selection',
      'three-tap confidence charge',
      'ten-minute next-move selection',
      '3-2-1 countdown to GO',
      'wall/failure recovery path',
      'successful real-world check and +1 win',
      'localStorage persistence after reload',
      'share action presence',
      '360px overflow and tap targets',
    ],
    pageErrors,
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
