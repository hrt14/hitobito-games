import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.env.ENERGY_BUCKET_URL || 'http://127.0.0.1:4173/apps/energy-bucket/?test=1';
const artifactDir = path.resolve('apps/energy-bucket/.artifacts');
fs.mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(err.message));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('levelup:energy-bucket:v1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(artifactDir, '01-first-visit.png'), fullPage: true });

  assert((await page.locator('h1').first().innerText()).includes('漏れを1個ふさぐ'), 'First-view promise is not visible.');
  assert(await page.locator('.leak-card').count() === 10, 'Expected 10 leak choices.');
  assert(await page.locator('#toChoose').isDisabled(), 'Continue should be disabled before a leak is selected.');
  assert((await page.locator('body').evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)), 'Mobile layout overflows horizontally.');

  await page.locator('.leak-card[data-key="postLunchSleepy"]').click();
  await page.locator('.leak-card[data-key="nightPhone"]').click();
  assert((await page.locator('#leakCounter').innerText()).includes('2 / 10'), 'Leak counter did not update.');
  assert(await page.locator('#holeLayer i').count() === 2, 'Bucket holes did not respond to selections.');
  const waterHeight = await page.locator('#water').evaluate((el) => parseFloat(getComputedStyle(el).height));
  assert(waterHeight > 0, 'Water visual disappeared.');
  await page.screenshot({ path: path.join(artifactDir, '02-leaks-selected.png'), fullPage: true });

  await page.locator('#toChoose').click();
  await page.waitForSelector('#chooseView:not([hidden])');
  assert(await page.locator('.recommendation').count() === 2, 'Recommendations should reflect the two selected leaks.');
  assert((await page.locator('.recommendation').first().innerText()).includes('食後2分だけ歩く'), 'Highest-priority recommendation is unexpected.');

  await page.locator('.recommendation').first().click();
  await page.waitForSelector('#planView:not([hidden])');
  assert((await page.locator('#triggerInput').inputValue()).includes('昼食'), 'IF trigger was not prefilled.');
  assert((await page.locator('#actionInput').inputValue()).includes('2分'), 'THEN action was not prefilled.');

  await page.locator('#triggerInput').fill('昼食を食べ終えたら');
  await page.locator('#actionInput').fill('2分だけ軽く歩く');
  await page.locator('#savePlan').click();
  await page.waitForSelector('#doneView:not([hidden])');
  assert((await page.locator('#resultLeak').innerText()).includes('昼食後'), 'Result does not show the chosen leak.');
  assert((await page.locator('#resultThen').innerText()).includes('2分だけ軽く歩く'), 'Result does not show the action.');
  await page.screenshot({ path: path.join(artifactDir, '03-result.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.locator('#returnCard').isVisible(), 'Saved plan did not survive reload.');
  assert((await page.locator('#lastRule').innerText()).includes('2分だけ軽く歩く'), 'Revisit card lost the saved rule.');
  await page.locator('#markNotYet').click();
  assert((await page.locator('#lastCount').innerText()).includes('成功 0日'), 'Not-yet path should not add a success day.');
  await page.locator('#markDone').click();
  assert((await page.locator('#lastCount').innerText()).includes('成功 1日'), 'Done path should add one success day.');

  await page.locator('.leak-card[data-key="stairsBreathless"]').click();
  assert(await page.locator('#safetyNote').isVisible(), 'Breathlessness safety branch did not appear.');
  assert((await page.locator('#safetyNote').innerText()).includes('医療機関'), 'Safety branch lacks medical-consultation guidance.');
  await page.screenshot({ path: path.join(artifactDir, '04-revisit-safety.png'), fullPage: true });

  const homeHref = await page.locator('.brand').getAttribute('href');
  assert(homeHref === '/', 'LEVEL UP home exit is missing.');
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);

  const report = {
    status: 'PASS',
    url,
    viewport: '390x844',
    checks: [
      'first visit promise and 10 leak choices visible',
      'bucket holes and water state respond to taps',
      'recommendation prioritization',
      'IF-THEN plan edit and save',
      'completion result',
      'reload and revisit persistence',
      'not-yet and done outcome paths',
      'breathlessness safety branch',
      'mobile horizontal overflow',
      'LEVEL UP home exit',
      'no console/page errors'
    ]
  };
  fs.writeFileSync(path.join(artifactDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('ENERGY BUCKET REAL MOBILE FLOW PASS');
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
