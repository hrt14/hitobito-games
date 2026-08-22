import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.RYOMA_URL || 'http://127.0.0.1:4173/apps/ryoma-big-picture/';
const artifacts = path.resolve('apps/ryoma-big-picture/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function visible(id) { return page.locator(`#${id}.active`).isVisible(); }

async function openLens(key) {
  const button = page.locator(`[data-lens="${key}"]`);
  await button.click();
  const pressed = await button.getAttribute('aria-pressed');
  if (pressed !== 'true') fail(`Lens ${key} did not open.`);
}

async function pickScale(scale) {
  const button = page.locator(`.move-btn[data-scale="${scale}"]`);
  if (await button.isDisabled()) fail(`Move ${scale} should be enabled.`);
  await button.click();
  if (!(await visible('feedbackScreen'))) fail('Feedback screen did not appear.');
}

async function finishCurrentWithBig(openAll = true) {
  for (const key of openAll ? ['purpose', 'people', 'options', 'time'] : ['purpose', 'people', 'options']) await openLens(key);
  await pickScale('big');
  await page.locator('#nextBtn').click();
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // First 10 seconds: purpose, action, and the four lenses are visible without a tutorial.
  if (!(await visible('introScreen'))) fail('Intro is not visible on first visit.');
  const heading = await page.locator('#introScreen h1').innerText();
  if (!heading.includes('目先に') || !heading.includes('振り回されない')) fail('Core benefit is not clear in title.');
  const start = page.getByRole('button', { name: /今日の5航路をはじめる/ });
  if (!(await start.isVisible())) fail('Primary start action is not visible.');
  if ((await page.locator('.lens-preview div').count()) !== 4) fail('Four-lens preview is missing.');
  await page.screenshot({ path: path.join(artifacts, '01-first-visit-mobile.png'), fullPage: true });

  // Start + locked decision: a move cannot be chosen before widening at least three directions.
  await start.click();
  if (!(await visible('gameScreen'))) fail('Game screen did not open.');
  if ((await page.locator('.move-btn:disabled').count()) !== 3) fail('Moves should be locked initially.');
  await openLens('purpose');
  await openLens('people');
  if ((await page.locator('.move-btn:disabled').count()) !== 3) fail('Moves unlocked before three lenses.');
  await openLens('options');
  if ((await page.locator('.move-btn:enabled').count()) !== 3) fail('Moves did not unlock after three lenses.');
  const boardClass = await page.locator('#boardShell').getAttribute('class');
  if (!boardClass?.includes('open-3')) fail('Board did not visibly expand to open-3 state.');
  await page.screenshot({ path: path.join(artifacts, '02-three-lenses-open.png'), fullPage: true });

  // Wrong/narrow path still teaches a reusable rule, not just "wrong".
  await pickScale('small');
  if ((await page.locator('#scaleStamp').innerText()) !== '目先の一手') fail('Small move scale feedback missing.');
  if ((await page.locator('#transferRule').innerText()).length < 12) fail('Transferable rule is too thin.');
  const sourceHref = await page.locator('#historyLink').getAttribute('href');
  if (!sourceHref?.startsWith('https://www.ndl.go.jp/')) fail('Official NDL source is not linked.');
  const fact = await page.locator('#historyFact').innerText();
  const abstraction = await page.locator('#historyAbstraction').innerText();
  if (!fact.includes('国立国会図書館') || fact === abstraction) fail('Verified fact and abstraction are not clearly separated.');
  await page.screenshot({ path: path.join(artifacts, '03-narrow-move-feedback.png'), fullPage: true });
  await page.locator('#nextBtn').click();

  // Correct/big path with all four directions.
  await openLens('purpose'); await openLens('people'); await openLens('options'); await openLens('time');
  if ((await page.locator('#openCount').innerText()) !== '4 / 4 OPEN') fail('Full four-lens state is not visible.');
  await pickScale('big');
  if ((await page.locator('#scaleStamp').innerText()) !== '盤面を変える一手') fail('Big move feedback missing.');
  await page.screenshot({ path: path.join(artifacts, '04-big-move-feedback.png'), fullPage: true });
  await page.locator('#nextBtn').click();

  // Finish session with full lenses to verify completion and growth evidence.
  await finishCurrentWithBig(true);
  await finishCurrentWithBig(true);
  await openLens('purpose'); await openLens('people'); await openLens('options'); await openLens('time');
  await pickScale('big');
  await page.locator('#nextBtn').click();
  if (!(await visible('resultScreen'))) fail('Result screen did not appear after five scenarios.');
  if ((await page.locator('#bigMoveScore').innerText()) !== '4') fail('Big-move result count should be 4 after one small + four big choices.');
  if ((await page.locator('#fullViewScore').innerText()) !== '4') fail('Full-view result count should be 4.');
  if (!(await page.locator('#weakLensTitle').innerText()).includes('時間')) fail('Weakest-lens feedback should identify time after omitting it once.');
  await page.screenshot({ path: path.join(artifacts, '05-result-mobile.png'), fullPage: true });

  // Revisit and persistence.
  await page.locator('#resultHomeBtn').click();
  if (!(await visible('introScreen'))) fail('Could not return to intro.');
  await page.locator('#recordBtn').click();
  if ((await page.locator('#recordSessions').innerText()) !== '1') fail('Session count did not persist.');
  if ((await page.locator('#recordBest').innerText()) !== '4') fail('Best score did not persist.');
  await page.locator('#recordBackBtn').click();

  // Reload must remain usable and keep local progress.
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await visible('introScreen'))) fail('Reload did not return to usable intro.');
  if (!(await page.locator('#bestIntro').innerText()).includes('4/5')) fail('Reload lost best score.');

  // Back/home link and mobile ergonomics.
  if ((await page.locator('.home-link').getAttribute('href')) !== '/') fail('LEVEL UP home link is incorrect.');
  const primaryBox = await page.locator('#startBtn').boundingBox();
  if (!primaryBox || primaryBox.height < 48) fail(`Primary tap target too short: ${primaryBox?.height}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) fail(`390px viewport has horizontal overflow: ${overflow}px`);

  // 360px narrow-phone check.
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow360 > 1) fail(`360px viewport has horizontal overflow: ${overflow360}px`);
  await page.locator('#startBtn').click();
  const lensBoxes = await page.locator('.lens').evaluateAll((nodes) => nodes.map((node) => { const r = node.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
  if (lensBoxes.some((box) => box.w < 120 || box.h < 100)) fail('Lens tap targets are too small on 360px viewport.');
  await page.screenshot({ path: path.join(artifacts, '06-360-game.png'), fullPage: true });

  if (consoleErrors.length) fail('Browser console errors:\n' + consoleErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first-time clarity and primary CTA',
      'moves locked until three lenses',
      'visual board expansion',
      'narrow/small move feedback',
      'big move and four-lens path',
      'verified-history vs abstraction separation',
      'five-round completion and weak-lens result',
      'local best/session persistence',
      'reload/revisit',
      'home/back link',
      'mobile overflow and tap targets',
    ],
    observed: {
      bigMoves: 4,
      fullViews: 4,
      weakestLens: 'time',
      persistedSessions: 1,
      persistedBest: 4,
      consoleErrors,
    },
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
