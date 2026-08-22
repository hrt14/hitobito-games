import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.PS7_URL || 'http://127.0.0.1:4173/apps/problem-solving-7steps/';
const here = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.join(here, '.artifacts');
fs.mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
});

function buttonWith(text) {
  return page.locator('button').filter({ hasText: text }).first();
}

async function clickAndAssert(text) {
  const target = buttonWith(text);
  await target.waitFor({ state: 'visible' });
  await target.click();
}

async function answerClassification(label) {
  await clickAndAssert(label);
  const feedback = page.locator('.feedback').last();
  await feedback.waitFor({ state: 'visible' });
  await page.locator('.continue-row button').last().click();
}

try {
  await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(() => localStorage.removeItem('levelup.problem-solving-7steps.v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  await page.locator('h1').filter({ hasText: '仕事の問題を' }).waitFor({ state: 'visible' });
  await page.locator('h1').filter({ hasText: '7手で小さくする' }).waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(artifactDir, 'start-mobile.png'), fullPage: true });

  await clickAndAssert('今日の1ケースをほどく');
  await page.locator('#caseTitle').filter({ hasText: '仕様変更で、納期が危ない' }).waitFor({ state: 'visible' });

  await answerClassification('動かせる');
  await answerClassification('今は動かせない');
  await answerClassification('動かせる');
  await answerClassification('今は動かせない');

  await clickAndAssert('8件のうち、公開に必須なものを確定すること');
  await clickAndAssert('次の手へ');

  await clickAndAssert('公開必須8件のうち、5日で完了できる範囲と担当が未確定');
  await clickAndAssert('次の手へ');

  await clickAndAssert('公開必須 / 後回しを15分で分ける');
  await clickAndAssert('休みの担当者のタスクを今日中に引き継ぐ');
  await clickAndAssert('残り5日は新規仕様を別キューへ置くルールにする');
  await clickAndAssert('3案を比べる');

  await clickAndAssert('公開必須 / 後回しを15分で分ける');
  await clickAndAssert('実行計画へ');

  await clickAndAssert('今から15分：8件を「公開必須 / 後回し候補」に分ける');
  await clickAndAssert('今日中：取引先へ優先順位と後回し候補を確認する');
  await clickAndAssert('確認後：担当を引き直し、5日分の順番を確定する');
  await clickAndAssert('この順で実行する');
  await clickAndAssert('最後に見直す');

  await clickAndAssert('効いたことを残し、工数が大きい1件だけ再分解する');
  await clickAndAssert('今回の解き方を見る');

  await page.locator('#resultScreen.is-active').waitFor({ state: 'visible' });
  const score = (await page.locator('#resultScore').textContent())?.trim();
  if (score !== '100') throw new Error(`Expected perfect score 100, got ${score}`);
  const carryRule = (await page.locator('#carryRule').textContent())?.trim() || '';
  if (!carryRule.includes('今、動かせる1個')) throw new Error(`Unexpected carry rule: ${carryRule}`);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('levelup.problem-solving-7steps.v1') || '{}'));
  if (stored.sessions !== 1) throw new Error(`Expected one persisted session, got ${stored.sessions}`);
  if (!Array.isArray(stored.seen) || !stored.seen.includes('deadline')) throw new Error('Completed case was not persisted as seen');
  await page.screenshot({ path: path.join(artifactDir, 'result-mobile.png'), fullPage: true });

  await clickAndAssert('別のケースでもう1回');
  await page.locator('#trainingScreen.is-active').waitFor({ state: 'visible' });
  const secondTitle = (await page.locator('#caseTitle').textContent())?.trim();
  if (!secondTitle || secondTitle === '仕様変更で、納期が危ない') {
    throw new Error(`Expected a new unseen case, got: ${secondTitle}`);
  }

  if (runtimeErrors.length) throw new Error(runtimeErrors.join('\n'));
  console.log('PROBLEM SOLVING 7 BROWSER PLAYTEST PASSED');
  console.log(`URL: ${appUrl}`);
  console.log('Verified: first 10s entry, full 7-step perfect route, persistence, result, repeat-run progression, mobile viewport.');
} finally {
  await browser.close();
}
