import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.MANAGER_LINE_CARE_URL || 'http://127.0.0.1:4173/apps/manager-line-care/';
const outDir = path.resolve('apps/manager-line-care/.artifacts');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('body[data-levelup-source="manager-line-care-v1"]').waitFor();
  await page.getByRole('heading', { name: /部下を守り/ }).waitFor();

  await page.getByRole('button', { name: '学習根拠' }).click();
  await page.getByRole('heading', { name: 'この演習の学習根拠' }).waitFor();
  await page.getByRole('button', { name: '×' }).click();

  await page.getByRole('button', { name: '今日の6ケースを始める' }).click();
  for (let round = 0; round < 6; round += 1) {
    await page.locator('.action').first().waitFor();
    const choices = page.locator('.action');
    await choices.nth(0).click();
    await choices.nth(1).click();
    await page.getByRole('button', { name: 'この順番で判断する' }).click();
    await page.locator('.feedback:not(.hidden)').waitFor();
    const nextName = round === 5 ? '結果を見る' : '次のケースへ';
    await page.getByRole('button', { name: nextName }).click();
  }

  await page.locator('#resultScreen:not(.hidden)').waitFor();
  const score = Number(await page.locator('#totalScore').textContent());
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error(`Invalid score: ${score}`);
  await page.screenshot({ path: path.join(outDir, 'mobile-result.png'), fullPage: true });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(`MANAGER LINE CARE BROWSER PLAYTHROUGH PASS score=${score}`);
} finally {
  await browser.close();
}
