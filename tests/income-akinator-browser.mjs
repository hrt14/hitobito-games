import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173/apps/income-akinator/';
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'test-results/income-akinator';
await fs.mkdir(OUTPUT_DIR, { recursive: true });

async function finishRun(page, answers) {
  for (let index = 0; index < 12; index += 1) {
    if (await page.locator('[data-screen="result"].is-active').count()) return index;
    const answer = answers[index % answers.length] ? 'yes' : 'no';
    await page.locator(`[data-answer="${answer}"]`).click();
    await page.waitForTimeout(320);
  }
  if (!(await page.locator('[data-screen="result"].is-active').count())) {
    throw new Error('Result screen did not appear within 12 questions');
  }
  return 12;
}

async function assertNoHorizontalOverflow(page) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (result.scrollWidth > result.clientWidth + 2) {
    throw new Error(`Horizontal overflow: ${result.scrollWidth} > ${result.clientWidth}`);
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  await page.getByRole('heading', { name: /年収/ }).waitFor();
  if (await page.locator('input, textarea, select').count()) throw new Error('Typing controls must not exist');
  await page.getByRole('button', { name: /見抜けるか試す/ }).click();
  await page.locator('[data-question-text]').waitFor();

  const firstQuestion = await page.locator('[data-question-text]').textContent();
  await page.locator('[data-answer="yes"]').click();
  await page.waitForTimeout(320);
  const secondQuestion = await page.locator('[data-question-text]').textContent();
  if (!secondQuestion || secondQuestion === firstQuestion) throw new Error('Question did not advance');

  await page.getByRole('button', { name: /1問戻る/ }).click();
  await page.waitForTimeout(120);
  const restoredQuestion = await page.locator('[data-question-text]').textContent();
  if (restoredQuestion !== firstQuestion) throw new Error('Undo did not restore the previous question');

  await page.locator('[data-answer="no"]').click();
  await page.waitForTimeout(320);
  const used = await finishRun(page, [false, true, false, false, true]);
  if (used > 12) throw new Error('Too many questions');

  const job = (await page.locator('[data-job-result]').textContent())?.trim();
  const income = (await page.locator('[data-income-result]').textContent())?.trim();
  const confidence = (await page.locator('[data-confidence]').textContent())?.trim();
  if (!job || !income || !/^\d+$/.test(income) || !/推理確度/.test(confidence || '')) {
    throw new Error('Result summary is incomplete');
  }
  if ((await page.locator('.reason-chips span').count()) < 1) throw new Error('No deciding reasons shown');
  if ((await page.locator('.alt-row').count()) !== 2) throw new Error('Two alternative guesses are required');
  await page.screenshot({ path: `${OUTPUT_DIR}/desktop-result.png`, fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.intro-screen.is-active').waitFor();
  if (!(await page.locator('.last-result:not([hidden])').count())) throw new Error('Last result is not visible after reload');
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const m = await mobile.newPage();
  await m.goto(BASE_URL, { waitUntil: 'networkidle' });
  await assertNoHorizontalOverflow(m);
  await m.getByRole('button', { name: /見抜けるか試す/ }).click();
  await m.locator('[data-question-text]').waitFor();
  await assertNoHorizontalOverflow(m);

  const boxes = await Promise.all(['yes', 'no'].map(async (answer) => m.locator(`[data-answer="${answer}"]`).boundingBox()));
  for (const box of boxes) {
    if (!box || box.height < 44 || box.width < 44) throw new Error('Mobile answer tap target is too small');
  }

  await finishRun(m, [true, true, false, true, false, true]);
  await assertNoHorizontalOverflow(m);
  const salaryBox = await m.locator('.salary-number').boundingBox();
  if (!salaryBox || salaryBox.x < -1 || salaryBox.x + salaryBox.width > 391) throw new Error('Salary result overflows mobile viewport');
  await m.screenshot({ path: `${OUTPUT_DIR}/mobile-result.png`, fullPage: true });

  await m.getByRole('button', { name: /最後の1問を変える/ }).click();
  await m.locator('[data-screen="question"].is-active').waitFor();
  await m.locator('[data-answer="no"]').click();
  await m.waitForTimeout(320);
  await finishRun(m, [false, true, false]);
  await m.locator('[data-screen="result"].is-active').waitFor();
  await mobile.close();

  console.log(JSON.stringify({
    ok: true,
    desktopResult: { job, income, confidence },
    checks: [
      'no typing controls',
      'question advances',
      'undo restores previous question',
      'result within 12 questions',
      'result has job/income/confidence/reasons/alternatives',
      'reload shows previous result',
      '390x844 no horizontal overflow',
      'mobile answer targets >=44px',
      'result undo returns to question flow',
    ],
  }, null, 2));
} finally {
  await browser.close();
}
