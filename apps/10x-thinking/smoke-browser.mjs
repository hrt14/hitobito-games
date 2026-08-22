import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.TENX_URL || 'http://127.0.0.1:4173/apps/10x-thinking/?test=1';
const artifacts = path.resolve('apps/10x-thinking/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }
async function openLens(key) {
  const lens = page.locator(`[data-lens="${key}"]`);
  await lens.click();
  if ((await lens.getAttribute('aria-pressed')) !== 'true') fail(`Lens ${key} did not open.`);
}
async function setMultiplier(value) {
  await page.locator('#multiplierRange').evaluate((node, next) => {
    node.value = String(next);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  if ((await page.locator('#multiplierValue').innerText()) !== `${value}X`) fail(`Multiplier did not reach ${value}X.`);
}
async function launchAndNext(keys = ['volume', 'quality', 'ripple']) {
  for (const key of keys) await openLens(key);
  await setMultiplier(10);
  if (await page.locator('#launchBtn').isDisabled()) fail('10X launch should be enabled.');
  await page.locator('#launchBtn').click();
  if (!(await active('feedbackScreen'))) fail('Feedback screen did not appear.');
  await page.locator('#nextBtn').click();
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  if (!(await active('introScreen'))) fail('Intro is not visible on first visit.');
  const title = await page.locator('#introScreen h1').innerText();
  if (!title.includes('目の前を') || !title.includes('10倍にする')) fail('Core benefit is not immediately clear.');
  if ((await page.locator('.lens-preview > div').count()) !== 3) fail('Three-lens preview is missing.');
  const start = page.getByRole('button', { name: /今日の5つを10倍にする/ });
  if (!(await start.isVisible())) fail('Primary start action is not visible.');
  await page.screenshot({ path: path.join(artifacts, '01-first-visit-mobile.png'), fullPage: true });

  await start.click();
  if (!(await active('gameScreen'))) fail('Game screen did not open.');
  if (!(await page.locator('#launchBtn').isDisabled())) fail('Launch should start disabled.');

  await setMultiplier(10);
  if (!(await page.locator('#launchBtn').isDisabled())) fail('Wrong path: multiplier alone must not unlock 10X launch.');
  await openLens('volume');
  if (!(await page.locator('#launchBtn').isDisabled())) fail('Wrong path: one lens must not unlock 10X launch.');
  await page.screenshot({ path: path.join(artifacts, '02-10x-still-locked.png'), fullPage: true });

  await openLens('quality');
  if (await page.locator('#launchBtn').isDisabled()) fail('Two lenses plus 10X should unlock launch.');
  const preview = await page.locator('#moveText').innerText();
  if (!preview.includes('FAQ') || !preview.includes('導線')) fail('High-scale preview did not become structural.');
  await page.locator('#launchBtn').click();
  if (!(await active('feedbackScreen'))) fail('Correct path did not reach feedback.');
  if ((await page.locator('#feedbackLenses').innerText()) !== '2 / 3') fail('Two-lens result was not recorded.');
  if ((await page.locator('#feedbackMultiplier').innerText()) !== '10X') fail('10X feedback is missing.');
  if ((await page.locator('#transferRule').innerText()).length < 14) fail('Transfer question is too thin.');
  await page.screenshot({ path: path.join(artifacts, '03-first-10x-feedback.png'), fullPage: true });
  await page.locator('#nextBtn').click();

  await launchAndNext();
  await launchAndNext();
  await launchAndNext();
  for (const key of ['volume', 'quality', 'ripple']) await openLens(key);
  await setMultiplier(10);
  await page.locator('#launchBtn').click();
  await page.locator('#nextBtn').click();

  if (!(await active('resultScreen'))) fail('Result screen did not appear after five rounds.');
  if ((await page.locator('#highScaleScore').innerText()) !== '5') fail('High-scale score should be 5.');
  if ((await page.locator('#fullLensScore').innerText()) !== '4') fail('Full-lens score should be 4 after one two-lens round.');
  if (!(await page.locator('#weakLensTitle').innerText()).includes('波及')) fail('Weakest lens should be ripple after omitting it once.');
  await page.screenshot({ path: path.join(artifacts, '04-result-mobile.png'), fullPage: true });

  await page.locator('#resultHomeBtn').click();
  if (!(await active('introScreen'))) fail('Could not return to intro from result.');
  if (!(await page.locator('#bestIntro').innerText()).includes('5/5')) fail('Best score is not shown after completion.');
  await page.locator('#recordBtn').click();
  if (!(await active('recordScreen'))) fail('Record screen did not open.');
  if ((await page.locator('#recordSessions').innerText()) !== '1') fail('Session count did not persist.');
  if ((await page.locator('#recordBest').innerText()) !== '5') fail('Best score did not persist.');
  await page.locator('#recordBackBtn').click();
  if (!(await active('introScreen'))) fail('Back from record did not return to intro.');

  await page.reload({ waitUntil: 'networkidle' });
  if (!(await active('introScreen'))) fail('Reload did not return to usable intro.');
  if (!(await page.locator('#bestIntro').innerText()).includes('5/5')) fail('Reload lost stored best score.');
  if ((await page.locator('.home-link').getAttribute('href')) !== '/') fail('LEVEL UP home link is incorrect.');
  const startBox = await page.locator('#startBtn').boundingBox();
  if (!startBox || startBox.height < 48) fail(`Primary tap target too short: ${startBox?.height}`);
  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow390 > 1) fail(`390px viewport has horizontal overflow: ${overflow390}px`);

  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow360 > 1) fail(`360px viewport has horizontal overflow: ${overflow360}px`);
  await page.locator('#startBtn').click();
  const lensBoxes = await page.locator('.lens').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (lensBoxes.some((box) => box.width < 300 || box.height < 88)) fail('Lens tap targets are too small on 360px viewport.');
  await page.screenshot({ path: path.join(artifacts, '05-360-game.png'), fullPage: true });

  if (consoleErrors.length) fail('Browser console errors:\n' + consoleErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first-time clarity',
      '10X remains locked with multiplier only',
      '10X remains locked with one lens',
      'two lenses plus 8X+ unlocks launch',
      'structural high-scale preview',
      'feedback and transferable question',
      'five-round completion',
      'weak-lens result',
      'local session/best persistence',
      'back/exit and reload/revisit',
      'mobile overflow and tap targets',
    ],
    observed: { highScale: 5, fullLens: 4, weakestLens: 'ripple', sessions: 1, best: 5, consoleErrors },
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
