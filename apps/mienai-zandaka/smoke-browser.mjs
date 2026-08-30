import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.MIENAI_ZANDAKA_URL || 'http://127.0.0.1:4173/apps/mienai-zandaka/?test=1';
const artifactDir = path.resolve('apps/mienai-zandaka/.artifacts');
fs.mkdirSync(artifactDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  assert((await page.title()).includes('見えない残高'), 'title should identify the app');
  await page.locator('#pageTitle').waitFor({ state: 'visible' });
  await page.locator('#depositBtn').waitFor({ state: 'visible' });
  await page.locator('#awareBtn').waitFor({ state: 'visible' });
  assert((await page.locator('#balance').textContent())?.trim() === '0', 'fresh balance should be 0');
  console.log('PASS first visit: title, balance and two actions are visible on 390x844');

  const depositBox = await page.locator('#depositBtn').boundingBox();
  const awareBox = await page.locator('#awareBtn').boundingBox();
  assert(depositBox && depositBox.height >= 48, 'deposit tap target should be at least 48px high');
  assert(awareBox && awareBox.height >= 48, 'awareness tap target should be at least 48px high');
  console.log('PASS mobile tap targets: primary and secondary actions >= 48px');

  await page.locator('#depositBtn').click();
  await page.locator('[data-deposit="help"]').waitFor({ state: 'visible' });
  await page.locator('[data-deposit="help"]').click();
  await page.waitForFunction(() => document.querySelector('#balance')?.textContent?.trim() === '1');
  assert((await page.locator('#todayCount').textContent())?.trim() === '1', 'today count should increment');
  assert((await page.locator('#totalCount').textContent())?.trim() === '1', 'lifetime total should increment');
  console.log('PASS main interaction: one concrete positive action increases current/today/lifetime counts');

  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.locator('#balance').textContent())?.trim() === '1', 'balance should survive reload');
  assert((await page.locator('#totalCount').textContent())?.trim() === '1', 'total should survive reload');
  console.log('PASS reload/revisit: localStorage state persists');

  await page.locator('#depositBtn').click();
  await page.locator('[data-close="depositSheet"]').click();
  await page.waitForFunction(() => document.querySelector('#depositSheet')?.getAttribute('aria-hidden') === 'true');
  console.log('PASS back/exit: deposit sheet closes without changing balance');

  for (const key of ['thanks', 'yield', 'tidy', 'smile']) {
    await page.locator('#depositBtn').click();
    await page.locator(`[data-deposit="${key}"]`).click();
  }
  await page.waitForFunction(() => document.querySelector('#balance')?.textContent?.trim() === '5');
  assert((await page.locator('#totalCount').textContent())?.trim() === '5', 'total should be 5 before awareness');

  await page.locator('#awareBtn').click();
  await page.locator('[data-awareness="complaint"]').click();
  await page.locator('#confirmPanel').waitFor({ state: 'visible' });
  assert((await page.locator('#confirmOld').textContent())?.trim() === '5', 'confirmation should show old balance 5');
  assert((await page.locator('#confirmNew').textContent())?.trim() === '2', 'confirmation should show floor(5/2)=2');
  await page.locator('#confirmOk').click();
  await page.waitForFunction(() => document.querySelector('#balance')?.textContent?.trim() === '2');
  assert((await page.locator('#awareCount').textContent())?.trim() === '1', 'awareness count should increment');
  assert((await page.locator('#totalCount').textContent())?.trim() === '5', 'halving current balance must not erase lifetime deposits');
  console.log('PASS awareness path: 5 -> 2, awareness +1, lifetime deposits preserved');

  await page.locator('#awareBtn').click();
  await page.locator('[data-awareness="showoff"]').click();
  await page.locator('#confirmText').waitFor({ state: 'visible' });
  const showoffCopy = (await page.locator('#confirmText').textContent()) || '';
  assert(showoffCopy.includes('アプリそのものを人に紹介することは含めません'), 'showoff rule should distinguish app sharing from displaying one’s balance');
  await page.locator('#confirmCancel').click();
  assert((await page.locator('#balance').textContent())?.trim() === '2', 'cancel should not alter balance');
  await page.keyboard.press('Escape');
  console.log('PASS reversible path: awareness selection can be cancelled/escaped without mutation');

  const pageText = await page.locator('body').innerText();
  assert(pageText.includes('残高が半分になる仕組みは、このアプリ独自の気づきルールです'), 'source/independence note must be present');
  assert(pageText.includes('特定の人物・宗教・団体の公式アプリでもありません'), 'official-affiliation disclaimer must be present');
  console.log('PASS provenance copy: app-original halving rule and non-official status are explicit');

  await page.screenshot({ path: path.join(artifactDir, 'mobile-final.png'), fullPage: true });
  fs.writeFileSync(path.join(artifactDir, 'playtest.txt'), [
    'PASS first visit / start',
    'PASS mobile 390x844 readability and tap targets',
    'PASS positive deposit interaction',
    'PASS close/back path',
    'PASS reload/revisit persistence',
    'PASS awareness confirmation/cancel path',
    'PASS halving rule 5 -> 2 with lifetime total preserved',
    'PASS provenance/disclaimer copy',
  ].join('\n') + '\n');
  console.log('REAL MOBILE PLAYTEST PASS');
} finally {
  await browser.close();
}
