import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.env.BEDTIME_WORLD_URL || 'http://127.0.0.1:4173/apps/bedtime-world/';
const appOrigin = new URL(url).origin;
const artifactDir = path.resolve('firebase-special-apps/bedtime-world/.artifacts');
fs.mkdirSync(artifactDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isAppResource(urlValue) {
  const parsed = new URL(urlValue);
  return parsed.origin === appOrigin && !parsed.pathname.startsWith('/__/firebase/');
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo' });
  const page = await context.newPage();
  const browserErrors = [];
  page.on('pageerror', (err) => browserErrors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource:')) {
      browserErrors.push(`console: ${msg.text()}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && isAppResource(response.url())) {
      browserErrors.push(`http ${response.status()}: ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (isAppResource(request.url())) {
      browserErrors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  assert(await page.getByText('今夜から、').isVisible(), 'first screen headline is not visible');
  assert(await page.locator('[data-world]').count() === 4, 'four persistent worlds are not shown');
  await page.locator('[data-world="train"]').click();
  assert(await page.getByText('月明かりのホーム').first().isVisible(), 'first landmark is not visible');

  await page.locator('#enter').click();
  assert(await page.locator('[data-route]').count() === 3, 'three routes are not shown');
  await page.locator('[data-route="1"]').click();
  await page.locator('#next').click();
  assert(await page.locator('[data-fragment]').count() === 6, 'six sensory fragments are not shown');
  for (const index of [0, 1, 2, 3]) await page.locator(`[data-fragment="${index}"]`).click();
  assert(await page.locator('[data-fragment].selected').count() === 3, 'fragment selection exceeded three');
  assert(await page.locator('.slot.filled').count() === 3, 'three cue slots were not filled');

  await page.locator('#back').click();
  assert(await page.getByText('今夜の入口').isVisible(), 'back from fragments did not return to portal');
  await page.locator('#next').click();
  assert(await page.locator('[data-fragment].selected').count() === 3, 'selected fragments were not preserved after back/forward');
  await page.locator('#close').click();
  assert(await page.getByText('ここから先は画面を見ない').isVisible(), 'dark handoff screen is missing');
  await page.locator('#finish').click();
  assert(await page.getByText('続きは、明日の夜。').isVisible(), 'completion screen is missing');
  assert(await page.getByText('水上の駅').isVisible(), 'next-night teaser is missing');
  await page.locator('#home').click();
  assert(await page.getByText('1夜ぶん進行').isVisible(), 'first completion did not advance exactly one night');

  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.getByText('今夜の続きを、もう見た。').isVisible(), 'same-night completion was not restored after reload');
  assert(await page.getByText('1夜ぶん進行').isVisible(), 'night count changed after reload');

  await page.locator('#enter').click();
  await page.locator('#next').click();
  for (const index of [0, 1, 2]) await page.locator(`[data-fragment="${index}"]`).click();
  await page.locator('#close').click();
  await page.locator('#finish').click();
  await page.locator('#home').click();
  assert(await page.getByText('1夜ぶん進行').isVisible(), 'same-day second completion advanced the world');

  await page.evaluate(() => {
    const key = 'levelup-bedtime-world-v1';
    const state = JSON.parse(localStorage.getItem(key));
    state.lastCompleted = '2000-01-01';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.getByText('水上の駅').first().isVisible(), 'next-day revisit did not reveal the next landmark');
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert(!mobileOverflow, 'mobile layout has horizontal overflow');
  await page.screenshot({ path: path.join(artifactDir, 'mobile-revisit.png'), fullPage: true });
  assert(browserErrors.length === 0, `browser errors: ${browserErrors.join(' | ')}`);
  await context.close();

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'Asia/Tokyo' });
  const desktopPage = await desktop.newPage();
  const desktopErrors = [];
  desktopPage.on('pageerror', (err) => desktopErrors.push(`pageerror: ${err.message}`));
  desktopPage.on('response', (response) => {
    if (response.status() >= 400 && isAppResource(response.url())) {
      desktopErrors.push(`http ${response.status()}: ${response.url()}`);
    }
  });
  desktopPage.on('requestfailed', (request) => {
    if (isAppResource(request.url())) {
      desktopErrors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
    }
  });
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const desktopOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert(!desktopOverflow, 'desktop layout has horizontal overflow');
  assert(desktopErrors.length === 0, `desktop browser errors: ${desktopErrors.join(' | ')}`);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'desktop-intro.png'), fullPage: true });
  await desktop.close();

  console.log('BEDTIME WORLD REAL BROWSER PLAYTEST PASS');
  console.log('- first visit and world choice');
  console.log('- route + exactly three sensory cues');
  console.log('- back/forward state preservation');
  console.log('- dark-screen handoff and completion');
  console.log('- same-day duplicate completion prevention');
  console.log('- reload persistence and next-day continuation');
  console.log('- mobile + desktop overflow checks');
} finally {
  await browser.close();
}
