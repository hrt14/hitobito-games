import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.RESULT_STEPS_URL || 'http://127.0.0.1:4173/apps/result-steps/?test=1';
const artifacts = path.resolve('apps/result-steps/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  if (!(await active('goalScreen'))) fail('Goal screen is not visible on first visit.');
  const firstTitle = await page.locator('#goalScreen h1').innerText();
  if (!firstTitle.includes('結果が出るまで') || !firstTitle.includes('あと○歩')) fail('Core benefit is not clear in first 10 seconds.');
  if ((await page.locator('[data-goal]').count()) !== 5) fail('Five goal choices are not available.');
  const english = page.locator('[data-goal="english"]');
  const englishBox = await english.boundingBox();
  if (!englishBox || englishBox.height < 100) fail('Goal tap target is too small.');
  await page.screenshot({ path: path.join(artifacts, '01-first-visit-mobile.png'), fullPage: true });

  await english.click();
  if (!(await active('progressScreen'))) fail('Progress screen did not open.');
  if ((await page.locator('#goalTitle').innerText()) !== '英語') fail('Selected goal title is wrong.');
  if ((await page.locator('#remainingValue').innerText()) !== '100') fail('Initial English remaining steps should be 100.');
  if ((await page.locator('.action-btn').count()) !== 3) fail('Three concrete daily actions are not shown.');
  await page.screenshot({ path: path.join(artifacts, '02-english-start.png'), fullPage: true });

  const firstAction = page.locator('.action-btn').first();
  await firstAction.click();
  if ((await page.locator('#foundationValue').innerText()) !== '1') fail('Foundation did not increase by 1.');
  if ((await page.locator('#momentumValue').innerText()) !== '+1') fail('Momentum did not increase by 1.');
  if ((await page.locator('#remainingValue').innerText()) !== '98') fail('Visible position should reflect foundation + momentum.');
  if (!(await firstAction.isDisabled())) fail('A second same-day action should be blocked.');
  if (!(await page.locator('#doneNote').isVisible())) fail('Same-day completion feedback is missing.');
  await page.screenshot({ path: path.join(artifacts, '03-after-one-step.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  if (!(await active('progressScreen'))) fail('Reload did not preserve active goal.');
  if ((await page.locator('#foundationValue').innerText()) !== '1') fail('Reload lost foundation progress.');
  if ((await page.locator('#momentumValue').innerText()) !== '+1') fail('Reload lost momentum.');

  await page.locator('#changeGoalBtn').click();
  if (!(await active('goalScreen'))) fail('Change-goal control did not return to goal selection.');
  if ((await page.locator('.home-link').getAttribute('href')) !== '/') fail('LEVEL UP home link is incorrect.');
  await english.click();

  await page.evaluate(() => {
    const key = 'levelup.resultSteps.v1';
    const data = JSON.parse(localStorage.getItem(key));
    data.goals.english.foundation = 40;
    data.goals.english.momentum = 5;
    data.goals.english.lastActionDate = '2026-08-20';
    data.goals.english.appliedMissedDays = 0;
    data.goals.english.history = [{ date: '2026-08-20', label: '英語を5分使った', note: '積み上げ + 勢い +1', delta: 1, type: 'action' }];
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle' });
  const absenceVisible = await page.locator('#absenceNote').isVisible();
  if (!absenceVisible) fail('Missed-day feedback did not appear.');
  const absenceText = await page.locator('#absenceNote').innerText();
  if (!absenceText.includes('積み上げ 40歩はそのまま')) fail('Missed-day feedback does not protect accumulated progress.');
  if ((await page.locator('#foundationValue').innerText()) !== '40') fail('Foundation should not decrease after missed days.');
  await page.screenshot({ path: path.join(artifacts, '04-missed-days.png'), fullPage: true });

  await page.evaluate(() => {
    const key = 'levelup.resultSteps.v1';
    const data = JSON.parse(localStorage.getItem(key));
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;
    data.goals.english = {
      foundation: 99,
      momentum: 0,
      lastActionDate: null,
      appliedMissedDays: 0,
      history: [],
      breakthroughShown: false
    };
    data.activeGoal = 'english';
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.action-btn').first().click();
  if (!(await page.locator('#celebration').isVisible())) fail('Breakthrough celebration did not appear.');
  if ((await page.locator('#remainingValue').innerText()) !== '0') fail('Remaining steps should reach 0 at breakthrough.');
  await page.screenshot({ path: path.join(artifacts, '05-breakthrough.png'), fullPage: true });
  await page.locator('#celebrationClose').click();
  if (await page.locator('#celebration').isVisible()) fail('Breakthrough overlay could not be closed.');

  await page.evaluate(() => localStorage.setItem('levelup.resultSteps.v1', '{broken-json'));
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await active('goalScreen'))) fail('Corrupt saved data did not recover to a usable first screen.');

  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow390 > 1) fail(`390px viewport has horizontal overflow: ${overflow390}px`);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow360 > 1) fail(`360px viewport has horizontal overflow: ${overflow360}px`);
  const goalBoxes = await page.locator('[data-goal]').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (goalBoxes.some((box) => box.height < 100 || box.width < 145)) fail('Goal cards are too small on 360px viewport.');
  await page.screenshot({ path: path.join(artifacts, '06-360-goals.png'), fullPage: true });

  if (consoleErrors.length) fail('Browser console errors:\n' + consoleErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first-time title and five goal choices',
      'goal selection and growth curve state',
      'correct action path and same-day duplicate block',
      'reload persistence',
      'change-goal/back path',
      'missed-day momentum decay without foundation loss',
      'breakthrough success path and overlay dismissal',
      'corrupt local data recovery',
      'mobile overflow and tap-target size'
    ],
    observed: {
      firstAction: { foundation: 1, momentum: 1, remaining: 98 },
      missedDayFoundationPreserved: 40,
      breakthroughRemaining: 0,
      consoleErrors
    }
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
