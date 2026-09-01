import { chromium } from 'playwright';

const base = process.env.LEVELUP_PRODUCTION_ORIGIN || 'https://levelup.hitobito.jp';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function oneThingRoom() {
  const page = await context.newPage();
  await page.goto(`${base}/apps/one-thing-room/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByRole('button', { name: '今すぐ1個に戻す' }).click();
  await page.getByRole('button', { name: '書き出しへ進む' }).click();
  await page.locator('.slot').first().fill('次の1個');
  await page.getByRole('button', { name: '並べ替える' }).click();
  await page.locator('.pick').first().click();
  await page.getByRole('button', { name: '少し前に進んだ' }).click();
  await page.getByRole('heading', { name: '1個でいい。' }).waitFor();
  console.log('[production mobile] one-thing-room interaction OK');
  await page.close();
}

async function rhythmAnchor() {
  const page = await context.newPage();
  await page.goto(`${base}/apps/rhythm-anchor/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByRole('button', { name: '今夜のアンカーを作る' }).click();
  await page.getByRole('button', { name: 'この2つで準備する' }).click();
  await page.getByRole('button', { name: '今夜の3チェックへ' }).click();
  await page.locator('.check').first().click();
  await page.locator('#finish').click();
  await page.getByRole('heading', { name: /明日は/ }).waitFor();
  console.log('[production mobile] rhythm-anchor interaction OK');
  await page.close();
}

try {
  await oneThingRoom();
  await rhythmAnchor();
} finally {
  await browser.close();
}
