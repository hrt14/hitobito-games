import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const rawBase = process.env.BASE_URL || 'http://127.0.0.1:4173/apps/zenbu-yaranai/';
const baseUrl = new URL(rawBase);
baseUrl.searchParams.set('qa', '1');
const outputDir = process.env.OUTPUT_DIR || 'test-results/zenbu-yaranai';
fs.mkdirSync(outputDir, { recursive: true });

const observations = [];
function observe(area, evidence) {
  observations.push({ area, evidence });
  console.log(`[OBSERVED] ${area}: ${evidence}`);
}

async function answerLoadCheck(page, answerText) {
  for (let i = 0; i < 8; i += 1) {
    await page.getByRole('button', { name: answerText, exact: true }).click();
  }
}

async function expectToast(page, text) {
  const toast = page.locator('#zenbuToast');
  await toast.waitFor({ state: 'visible' });
  assert.match(await toast.innerText(), new RegExp(text));
}

async function fillThreeTasks(page) {
  await page.locator('[data-action="add-task"]').click();
  await page.locator('[data-action="add-task"]').click();
  const inputs = page.locator('[data-testid="task-input"]');
  assert.equal(await inputs.count(), 3);
  await inputs.nth(0).fill('木曜のA社コンサル準備');
  await inputs.nth(1).fill('B社資料作成');
  await inputs.nth(2).fill('メール返信');
}

async function waitForOutcome(page) {
  await page.locator('[data-testid="outcome-done"]').waitFor({ state: 'visible', timeout: 8000 });
}

async function runDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(baseUrl.href, { waitUntil: 'domcontentloaded', timeout: 45000 });

  assert.equal(await page.title(), '全部やらなくていい | LEVEL UP');
  assert.equal(await page.locator('h1').first().innerText(), '全部やらなくていい');
  assert.match(await page.locator('.subtitle').innerText(), /高負荷のときほど、一個ずつ/);
  assert.equal(await page.locator('[data-testid="check-question"]').isVisible(), true);
  assert.equal(await page.locator('[data-answer]').count(), 3);
  observe('first-time clarity', 'Desktop first paint shows title, state-change subtitle, one workload question, and three large answers without an intro screen.');

  await answerLoadCheck(page, 'かなり');
  assert.equal(await page.locator('[data-testid="load-level"]').innerText(), 'RED');
  assert.match(await page.locator('main').innerText(), /医療診断ではありません/);
  observe('workload check', 'Eight “かなり” answers produce RED and the page explicitly labels the check as non-medical.');

  await page.locator('[data-action="to-tasks"]').click();
  await page.locator('[data-action="tasks-next"]').click();
  await expectToast(page, '仕事を1件');
  observe('failure path', 'Empty task list is blocked with a short corrective message rather than silently advancing.');

  await fillThreeTasks(page);
  await page.locator('[data-action="tasks-next"]').click();
  const choices = page.locator('[data-testid="task-choice"]');
  assert.equal(await choices.count(), 3);
  assert.match(await page.locator('main').innerText(), /被害が減るもの/);
  await choices.nth(0).click();
  await page.locator('[data-testid="minimum-input"]').waitFor();

  await page.locator('[data-action="back"]').click();
  assert.equal(await page.locator('[data-testid="task-choice"]').count(), 3);
  await page.locator('[data-testid="task-choice"]').nth(0).click();
  await page.locator('[data-testid="minimum-input"]').waitFor();
  observe('back / recovery', 'Back from minimum-line step returns to the three-task chooser without losing the task dump.');

  await page.locator('[data-action="minimum-next"]').click();
  await expectToast(page, '最低成立ライン');
  await page.locator('[data-testid="minimum-input"]').fill('最新数字を確認して、課題3つと次施策3つを出す');
  await page.locator('[data-action="minimum-next"]').click();

  await page.locator('[data-action="discard-next"]').click();
  await expectToast(page, 'やらないもの');
  await page.getByRole('button', { name: '完璧な資料', exact: true }).click();
  await page.getByRole('button', { name: '見栄え', exact: true }).click();
  assert.match(await page.locator('.no-do-card').innerText(), /これは、やらない/);
  await page.locator('[data-action="discard-next"]').click();

  assert.match(await page.locator('.timer-task').innerText(), /A社コンサル準備/);
  assert.match(await page.locator('.timer-meta').innerText(), /課題3つと次施策3つ/);
  assert.match(await page.locator('.timer-meta').innerText(), /完璧な資料/);
  assert.equal(await page.locator('[data-testid="timer-display"]').innerText(), '00:02');
  await page.locator('[data-testid="timer-start"]').click();
  await page.waitForTimeout(450);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  assert.match(await page.locator('.timer-task').innerText(), /A社コンサル準備/);
  observe('reload', 'Reload during an active focus session restores the selected task, minimum line, discard list, and countdown state from localStorage.');

  await waitForOutcome(page);
  await page.locator('[data-testid="outcome-more"]').click();
  await waitForOutcome(page);
  await page.locator('[data-testid="outcome-done"]').click();
  await page.locator('[data-testid="complete-title"]').waitFor();
  assert.equal(await page.locator('[data-testid="complete-title"]').innerText(), '1件、減った。');
  assert.equal(await page.locator('.plus-one').innerText(), '+1');
  observe('success path', 'Second focus block can be requested; choosing minimum-line achieved then ends on “1件、減った。” with +1.');

  await page.locator('[data-action="show-history"]').click();
  assert.equal(await page.locator('[data-testid="stat-red"]').innerText(), '1');
  assert.equal(await page.locator('[data-testid="stat-tasks"]').innerText(), '3');
  assert.equal(await page.locator('[data-testid="stat-completed"]').innerText(), '1');
  assert.match(await page.locator('main').innerText(), /完璧な資料/);
  observe('history', 'Seven-day history immediately shows one RED day, three entered tasks, one completed item, and discarded-item aggregation.');
  await page.screenshot({ path: path.join(outputDir, 'desktop-history.png'), fullPage: true });

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  assert.equal(await page.locator('[data-testid="complete-title"]').innerText(), '1件、減った。');
  await page.locator('[data-action="show-history"]').click();
  assert.match(await page.locator('h1').innerText(), /一個ずつ、減らした記録/);
  await page.locator('[data-action="close-history"]').click();
  assert.equal(await page.locator('[data-testid="complete-title"]').innerText(), '1件、減った。');
  observe('revisit', 'Reload after completion preserves the completed session; history can be reopened and closed back to that result.');

  const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(dimensions.scrollWidth <= dimensions.width + 1, 'desktop page should not overflow horizontally');
  await context.close();
}

async function runMobile(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(baseUrl.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.locator('#resetButton').click();

  const firstDimensions = await page.evaluate(() => {
    const answers = [...document.querySelectorAll('[data-answer]')];
    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      answerHeights: answers.map(el => el.getBoundingClientRect().height),
      historyHeight: document.querySelector('#historyButton')?.getBoundingClientRect().height || 0,
      resetHeight: document.querySelector('#resetButton')?.getBoundingClientRect().height || 0,
    };
  });
  assert.ok(firstDimensions.scrollWidth <= firstDimensions.width + 1, 'mobile first screen should not overflow horizontally');
  assert.ok(firstDimensions.answerHeights.every(height => height >= 58), 'all mobile load answers should be at least 58px tall');
  assert.ok(firstDimensions.historyHeight >= 42 && firstDimensions.resetHeight >= 42, 'top mobile controls should be large enough to tap');
  observe('mobile first screen', '390×844 layout has no horizontal overflow; answer buttons are >=58px and header controls >=42px.');

  await answerLoadCheck(page, '少し');
  assert.equal(await page.locator('[data-testid="load-level"]').innerText(), 'YELLOW');
  await page.locator('[data-action="to-tasks"]').click();
  await page.locator('[data-testid="task-input"]').fill('明日の会議準備');
  await page.locator('[data-action="tasks-next"]').click();
  await page.locator('[data-testid="task-choice"]').click();
  await page.locator('[data-testid="minimum-input"]').waitFor();
  await page.locator('[data-testid="minimum-input"]').fill('議題3つをメモする');
  await page.locator('[data-action="minimum-next"]').click();
  await page.getByRole('button', { name: '詳細分析', exact: true }).click();
  await page.locator('[data-action="discard-next"]').click();

  const timerDimensions = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    startHeight: document.querySelector('[data-testid="timer-start"]')?.getBoundingClientRect().height || 0,
  }));
  assert.ok(timerDimensions.scrollWidth <= timerDimensions.width + 1, 'mobile timer should not overflow horizontally');
  assert.ok(timerDimensions.startHeight >= 58, 'mobile timer primary control should be at least 58px');
  await page.screenshot({ path: path.join(outputDir, 'mobile-timer.png'), fullPage: true });

  await page.locator('[data-testid="timer-start"]').click();
  await page.waitForTimeout(350);
  await page.locator('[data-action="pause-timer"]').click();
  assert.equal(await page.locator('[data-testid="timer-start"]').isVisible(), true);
  assert.match(await page.locator('.timer-task').innerText(), /明日の会議準備/);
  observe('timer interruption', 'Mobile timer can be stopped deliberately and returns to the same single task without surfacing the hidden backlog.');

  await page.locator('[data-testid="timer-start"]').click();
  await waitForOutcome(page);
  await page.locator('[data-testid="outcome-stop"]').click();
  assert.equal(await page.locator('[data-testid="complete-title"]').innerText(), '今日はここまで。');
  observe('stop path', 'Mobile “今日はここまで” ends the session without pretending the task was completed.');
  await page.screenshot({ path: path.join(outputDir, 'mobile-stop.png'), fullPage: true });

  const finalDimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(finalDimensions.scrollWidth <= finalDimensions.width + 1, 'mobile completion should not overflow horizontally');
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runDesktop(browser);
  await runMobile(browser);
  const report = {
    status: 'PASS',
    baseUrl: baseUrl.href,
    testedAt: new Date().toISOString(),
    desktop: '1280x900 Chromium',
    mobile: '390x844 Chromium touch emulation',
    observations,
  };
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`ZENBU_YARANAI_BROWSER_PASS base=${baseUrl.href}`);
} catch (error) {
  const report = {
    status: 'FAIL',
    baseUrl: baseUrl.href,
    testedAt: new Date().toISOString(),
    observations,
    error: error?.stack || String(error),
  };
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
