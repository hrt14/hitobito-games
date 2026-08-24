import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.UNFAIR_BLAME_URL || 'http://127.0.0.1:4173/apps/unfair-blame/?test=1';
const artifacts = path.resolve('apps/unfair-blame/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }
async function chooseBucket(name) { await page.locator(`.bucket[data-bucket="${name}"]`).click(); }
async function nextSort() { await page.locator('#sortNextBtn').click(); }

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  if (!(await active('introView'))) fail('Intro is not visible on first visit.');
  const title = await page.locator('#introView h1').innerText();
  if (!title.includes('悪くないのに責められ') || !title.includes('行動まで制限')) fail('Exact use moment is not clear in first view.');
  if (!(await page.getByRole('button', { name: /事実から取り戻す/ }).isVisible())) fail('Primary action is not visible.');
  const startBox = await page.locator('#startBtn').boundingBox();
  if (!startBox || startBox.height < 48) fail(`Primary tap target too short: ${startBox?.height}`);
  await page.screenshot({ path: path.join(artifacts, '01-first-visit-mobile.png'), fullPage: true });

  await page.locator('#startBtn').click();
  if (!(await active('sortView'))) fail('Sort stage did not open.');

  await chooseBucket('assumption');
  const wrongSort = await page.locator('#sortFeedback').innerText();
  if (!wrongSort.includes('その箱ではない')) fail('Wrong classification did not return corrective feedback.');
  if (!(await page.locator('#sortNextBtn').evaluate((n) => n.classList.contains('hidden')))) fail('Wrong classification unexpectedly unlocked next.');
  await chooseBucket('fact');
  await nextSort();

  await chooseBucket('assumption'); await nextSort();
  await chooseBucket('fact'); await nextSort();
  await chooseBucket('restriction'); await nextSort();
  await chooseBucket('assumption'); await nextSort();
  if (!(await active('controlView'))) fail('Control stage did not open after sorting.');

  const controls = page.locator('.control-chip');
  await controls.nth(1).click();
  await page.locator('#controlCheckBtn').click();
  const wrongControl = await page.locator('#controlFeedback').innerText();
  if (!wrongControl.includes('相手の領域')) fail('Wrong agency selection did not explain boundary.');
  await controls.nth(1).click();
  for (const index of [0,2,3,5]) await controls.nth(index).click();
  await page.locator('#controlCheckBtn').click();
  await page.waitForTimeout(500);
  if (!(await active('buildView'))) fail('Build stage did not open after correct agency selection.');

  const parts = page.locator('.reply-part');
  await parts.nth(0).click();
  const wrongBuild = await page.locator('#buildFeedback').innerText();
  if (!wrongBuild.includes('先に「事実」')) fail('Wrong reply order did not explain expected first step.');
  await parts.nth(1).click();
  await parts.nth(3).click();
  await parts.nth(0).click();
  await parts.nth(2).click();
  if (await page.locator('#buildNextBtn').evaluate((n) => n.classList.contains('hidden'))) fail('Correct four-line boundary did not unlock next.');
  await page.locator('#buildNextBtn').click();
  if (!(await active('pressureView'))) fail('Pressure stage did not open.');

  await page.locator('#holdBtn').dispatchEvent('pointerdown');
  await page.waitForTimeout(250);
  await page.locator('#holdBtn').dispatchEvent('pointerup');
  if (!(await page.locator('#pressureFeedback').innerText()).includes('途中で離した')) fail('Early release path did not respond.');
  await page.locator('#holdBtn').dispatchEvent('pointerdown');
  await page.waitForTimeout(1350);
  if (await page.locator('#steadyBox').evaluate((n) => n.classList.contains('hidden'))) fail('1.2 second hold did not reveal steady response.');
  await page.locator('#pressureNextBtn').click();
  if (!(await active('resultView'))) fail('Result stage did not open.');
  if ((await page.locator('#resultSort').innerText()) !== '5/5') fail('Sort result is not 5/5.');
  if ((await page.locator('#resultControl').innerText()) !== '4/4') fail('Control result is not 4/4.');
  if ((await page.locator('#resultBuild').innerText()) !== '4/4') fail('Build result is not 4/4.');
  if ((await page.locator('#resultPause').innerText()) !== 'OK') fail('Pause result is not OK.');

  await page.locator('#afterRange').evaluate((node) => {
    node.value = '35';
    node.dispatchEvent(new Event('input', { bubbles: true }));
  });
  if ((await page.locator('#deltaResult').innerText()) !== '−30') fail('Before/after delta is incorrect.');
  await page.locator('#saveBtn').click();
  if (!(await page.locator('#savedPanel').innerText()).includes('1回目')) fail('First saved session is not shown.');
  const local = await page.evaluate(() => JSON.parse(localStorage.getItem('hitobito-unfair-blame-progress-v2') || '{}'));
  if (local.sessions !== 1 || local.bestDrop !== 30) fail(`Local progress incorrect: ${JSON.stringify(local)}`);
  await page.screenshot({ path: path.join(artifacts, '02-result-mobile.png'), fullPage: true });

  const homeHref = await page.locator('.home-link').getAttribute('href');
  if (homeHref !== '/') fail(`LEVEL UP home link is wrong: ${homeHref}`);
  await page.locator('#nextScenarioBtn').click();
  if (!(await active('introView'))) fail('Next scenario did not return to intro.');
  if (!(await page.locator('#scenarioLabel').innerText()).includes('家族')) fail('Next scenario did not change content.');

  await page.reload({ waitUntil: 'networkidle' });
  if (!(await active('introView'))) fail('Reload did not return to usable intro.');
  if ((await page.locator('#sessionCount').innerText()) !== '1') fail('Reload lost saved training count.');

  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow390 > 1) fail(`390px viewport has horizontal overflow: ${overflow390}px`);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow360 > 1) fail(`360px viewport has horizontal overflow: ${overflow360}px`);
  await page.locator('#startBtn').click();
  const bucketBoxes = await page.locator('.bucket').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (bucketBoxes.some((box) => box.width < 300 || box.height < 48)) fail(`Mobile bucket target too small: ${JSON.stringify(bucketBoxes)}`);
  await page.screenshot({ path: path.join(artifacts, '03-sort-360.png'), fullPage: true });

  if (consoleErrors.length) fail('Browser console errors:\n' + consoleErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844','360x800'],
    tested: [
      'first-time clarity and primary action',
      'wrong and correct fact/assumption/restriction classification',
      'wrong and correct agency recovery',
      'wrong and correct four-line boundary order',
      'early release and successful 1.2-second pause',
      'completion metrics and before/after stress delta',
      'local persistence across reload/revisit',
      'next-scenario repeat path',
      'LEVEL UP back link',
      'mobile overflow and tap targets'
    ],
    observed: {
      sessions: 1,
      bestStressDrop: 30,
      result: { sort: '5/5', agency: '4/4', boundary: '4/4', pause: 'OK' },
      consoleErrors
    }
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
