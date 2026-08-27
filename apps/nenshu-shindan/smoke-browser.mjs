import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.NENSHU_SHINDAN_URL || 'http://127.0.0.1:4173/apps/nenshu-shindan/?test=1';
const artifacts = path.resolve('apps/nenshu-shindan/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }
async function waitForApp() {
  await page.locator('#introView').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForTimeout(300);
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp();
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp();

  if (!(await active('introView'))) fail('Intro is not visible on first visit.');
  const firstText = await page.locator('#introView').innerText();
  if (!firstText.includes('30問でわかる') || !firstText.includes('市場年収診断')) fail('First view does not explain the product.');
  if (!firstText.includes('入力欄なし')) fail('No-typing promise is not visible.');
  if (!(await page.locator('#startBtn').isVisible())) fail('Primary start action is not visible.');
  const startBox = await page.locator('#startBtn').boundingBox();
  if (!startBox || startBox.height < 48) fail(`Primary tap target too short: ${startBox?.height}`);

  const formControls = await page.locator('#app input, #app textarea, #app select').count();
  if (formControls !== 0) fail(`Typing/form controls found inside salary app: ${formControls}`);
  await page.screenshot({ path: path.join(artifacts, '01-first-visit-mobile.png'), fullPage: true });

  await page.locator('#startBtn').click();
  if (!(await active('questionView'))) fail('Question view did not open.');
  if ((await page.locator('#questionCount').innerText()) !== '1 / 30') fail('Question count did not start at 1 / 30.');
  const optionBoxes = await page.locator('.option').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  if (!optionBoxes.length || optionBoxes.some((height) => height < 48)) fail(`Question tap target too short: ${JSON.stringify(optionBoxes)}`);

  await page.locator('.option').nth(2).click();
  await page.waitForTimeout(220);
  if ((await page.locator('#questionCount').innerText()) !== '2 / 30') fail('Selecting an option did not advance automatically.');
  await page.locator('#backBtn').click();
  if ((await page.locator('#questionCount').innerText()) !== '1 / 30') fail('Back did not return to the previous question.');
  if (!(await page.locator('.option').nth(2).evaluate((n) => n.classList.contains('selected')))) fail('Back did not preserve the previous choice.');

  for (let i = 0; i < 30; i += 1) {
    if (!(await active('questionView'))) break;
    await page.locator('.option').nth(2).click();
    await page.waitForTimeout(180);
  }

  if (!(await active('resultView'))) fail('Result view did not open after 30 tap answers.');
  const low = (await page.locator('#salaryLow').innerText()).trim();
  const high = (await page.locator('#salaryHigh').innerText()).trim();
  const score = (await page.locator('#marketScore').innerText()).trim();
  if (!/^\d[\d,]*$/.test(low) || !/^\d[\d,]*$/.test(high)) fail(`Salary range is not numeric: ${low} - ${high}`);
  if (!score.includes('/ 100')) fail(`Market score is missing: ${score}`);
  if ((await page.locator('#topDrivers .driver').count()) !== 2) fail('Top two drivers were not rendered.');
  if ((await page.locator('#axisBars .axis-row').count()) !== 6) fail('Six factor bars were not rendered.');
  await page.screenshot({ path: path.join(artifacts, '02-result-mobile.png'), fullPage: true });

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp();
  if (!(await active('introView'))) fail('Reload did not return to a usable intro.');
  const previous = await page.locator('#previousResult').innerText();
  if (!previous.includes('前回の結果') || !previous.includes('万円')) fail('Revisit did not restore the previous result summary.');

  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow390 > 1) fail(`390px viewport has horizontal overflow: ${overflow390}px`);

  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp();
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow360 > 1) fail(`360px viewport has horizontal overflow: ${overflow360}px`);
  await page.locator('#startBtn').click();
  const smallOptionBoxes = await page.locator('.option').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (smallOptionBoxes.some((box) => box.width < 300 || box.height < 48)) fail(`360px options too small: ${JSON.stringify(smallOptionBoxes)}`);
  await page.screenshot({ path: path.join(artifacts, '03-question-360.png'), fullPage: true });

  if (consoleErrors.length) fail('Browser console errors:\n' + consoleErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first-time clarity and visible start action',
      'zero text/number input controls inside the salary app',
      'tap-only automatic progression',
      'back navigation with preserved choice',
      'all 30 questions through result',
      'salary range, score, two drivers and six factors',
      'local previous-result persistence after reload/revisit',
      'mobile overflow and tap targets'
    ],
    observed: { low, high, score, consoleErrors }
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
