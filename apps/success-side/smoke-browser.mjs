import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.SUCCESS_SIDE_URL || 'http://127.0.0.1:4173/apps/success-side/';
const artifacts = path.resolve('apps/success-side/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }
async function noOverflow(label) {
  const px = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (px > 1) fail(`${label}: horizontal overflow ${px}px`);
}
async function minHeight(selector, expected, label) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box || box.height < expected) fail(`${label}: target too short ${box?.height}`);
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.removeItem('levelup-success-side-count');
    localStorage.removeItem('levelup-success-side-best');
    sessionStorage.removeItem('success-side-scene');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  // First visit.
  if (!(await active('introScreen'))) fail('First visit does not show intro screen.');
  const title = await page.locator('.hero h1').innerText();
  if (!title.includes('成功する方で') || !title.includes('考える')) fail(`Core title missing: ${title}`);
  const lead = await page.locator('.hero-copy').innerText();
  if (!lead.includes('成功を保証するゲームじゃない') || !lead.includes('成功確率を上げる行動')) fail(`Core promise is unclear: ${lead}`);
  if ((await page.locator('#lifetimeCount').innerText()) !== '0') fail('Clean first visit count is not zero.');
  if ((await page.locator('.home').getAttribute('href')) !== '/') fail('Home/exit link is not wired to LEVEL UP root.');
  await minHeight('#startBtn', 44, 'Start');
  await noOverflow('390 intro');
  await page.screenshot({ path: path.join(artifacts, '01-intro-390.png'), fullPage: true });

  // Main interaction: cut all four failure branches.
  await page.locator('#startBtn').click();
  if (!(await active('branchScreen'))) fail('Start did not open branch screen.');
  if ((await page.locator('.branch-chip').count()) !== 4) fail('Branch screen does not show exactly four failure forecasts.');
  await minHeight('.branch-chip', 44, 'Branch chip');
  const firstScene = await page.locator('#sceneTitle').innerText();
  for (let i = 0; i < 4; i += 1) {
    const visible = page.locator('.branch-chip:not(.cut)').first();
    await visible.click();
  }
  await page.waitForTimeout(500);
  if (!(await active('riskScreen'))) fail('Four cuts did not advance to risk screen.');
  await page.screenshot({ path: path.join(artifacts, '02-risk-390.png'), fullPage: true });

  // Guard path: select one protection only.
  await page.locator('[data-risk="guard"]').click();
  if (await page.locator('#guardBox').isHidden()) fail('Guard choice did not reveal one-guard options.');
  if ((await page.locator('.guard-option').count()) !== 3) fail('Guard options are missing.');
  if (!(await page.locator('#riskDone').isHidden())) fail('Risk stage advanced before a guard was chosen.');
  await page.locator('.guard-option').first().click();
  if (await page.locator('#riskDone').isHidden()) fail('Guard selection did not finish the one-time risk check.');
  const riskDone = await page.locator('#riskDone').innerText();
  if (!riskDone.includes('これ以上、失敗パターンを増やさない')) fail('Risk stop rule is not explicit.');
  await minHeight('#toCommitBtn', 44, 'Commit transition');
  await page.locator('#toCommitBtn').click();

  // Success-side switch and concrete action.
  if (!(await active('commitScreen'))) fail('Risk stage did not open success-side switch.');
  await page.locator('#successLever').click();
  await page.waitForTimeout(450);
  if (!await page.locator('#successLever').evaluate((el) => el.classList.contains('switched'))) fail('Success lever did not switch.');
  if (await page.locator('#actionZone').isHidden()) fail('Success actions did not appear.');
  if ((await page.locator('.action-option').count()) !== 3) fail('Concrete success actions are missing.');
  const chosenAction = await page.locator('.action-option').first().innerText();
  await minHeight('.action-option', 44, 'Success action');
  await page.locator('.action-option').first().click();

  if (!(await active('resultScreen'))) fail('Choosing a success action did not reach result.');
  if ((await page.locator('#resultScene').innerText()) !== firstScene) fail('Result scene changed unexpectedly.');
  if ((await page.locator('#resultAction').innerText()) !== chosenAction) fail('Chosen action is not preserved in result.');
  if (!(await page.locator('.result-rule').innerText()).includes('失敗は1回だけ確認')) fail('Reusable rule is missing from result.');
  if ((await page.locator('#resultCount').innerText()) !== '1') fail('Successful switch was not counted.');
  const storedCount = await page.evaluate(() => localStorage.getItem('levelup-success-side-count'));
  if (storedCount !== '1') fail('Successful switch count was not stored locally.');
  await noOverflow('390 result');
  await page.screenshot({ path: path.join(artifacts, '03-result-390.png'), fullPage: true });

  // Reload/revisit keeps learning evidence usable.
  await page.reload({ waitUntil: 'domcontentloaded' });
  if (!(await active('introScreen'))) fail('Reload does not return to usable intro screen.');
  if ((await page.locator('#lifetimeCount').innerText()) !== '1') fail('Reload lost cumulative switch count.');
  await page.locator('#startBtn').click();
  const secondScene = await page.locator('#sceneTitle').innerText();
  if (secondScene === firstScene) fail('Immediate revisit did not prioritize a different scene.');

  // Recoverable path should skip guard selection.
  for (let i = 0; i < 4; i += 1) await page.locator('.branch-chip:not(.cut)').first().click();
  await page.waitForTimeout(500);
  await page.locator('[data-risk="recoverable"]').click();
  if (!(await page.locator('#guardBox').isHidden())) fail('Recoverable path incorrectly opened guard options.');
  if (await page.locator('#riskDone').isHidden()) fail('Recoverable path did not end risk check.');

  // Reset path.
  await page.locator('#resetBtn').click();
  if (!(await active('introScreen'))) fail('Reset did not return to intro.');
  if ((await page.locator('#lifetimeCount').innerText()) !== '0') fail('Reset did not clear local learning count.');

  // Mobile 360 layout and targets.
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await noOverflow('360 intro');
  await minHeight('#startBtn', 44, '360 start');
  await page.locator('#startBtn').click();
  await noOverflow('360 branch');
  const branchBoxes = await page.locator('.branch-chip').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (branchBoxes.some((box) => box.width < 100 || box.height < 44)) fail('Branch choices are too small on 360px viewport.');
  await page.screenshot({ path: path.join(artifacts, '04-branch-360.png'), fullPage: true });

  if (pageErrors.length) fail('Browser page errors:\n' + pageErrors.join('\n'));
  const body = await page.locator('body').innerText();
  if (/\b(undefined|NaN|Infinity)\b/.test(body)) fail('Invalid visible runtime value detected.');

  const summary = {
    url,
    browser: 'Playwright Chromium',
    viewports: ['390x844', '360x800'],
    tested: [
      'first visit clarity and exit',
      'four-branch cut interaction',
      'guard path with exactly one protection',
      'recoverable path without extra analysis',
      'success-side lever',
      'concrete next-action selection',
      'result rule and local count',
      'reload and revisit with different scene',
      'reset behavior',
      '360px overflow and tap targets',
    ],
    pageErrors,
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
