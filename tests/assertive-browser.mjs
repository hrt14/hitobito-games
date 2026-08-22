import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173/apps/assertive/';
const outputDir = process.env.OUTPUT_DIR || 'test-results/assertive';
fs.mkdirSync(outputDir, { recursive: true });

async function dismissReflexes(page) {
  const cards = page.locator('.reflex-card');
  assert.equal(await cards.count(), 2, 'two reflex cards should be visible');
  await cards.nth(0).click();
  await page.waitForTimeout(80);
  await cards.nth(1).click();
  await page.locator('#buildStage:not(.hidden)').waitFor();
}

async function fillBuildStage(page, checkWrongPath = false) {
  if (checkWrongPath) {
    await page.locator('.phrase.bad').first().click();
    await page.locator('#buildFeedback.warn').waitFor();
    assert.ok((await page.locator('#buildFeedback').innerText()).length > 8, 'wrong phrase should explain why');
  }

  for (let slot = 0; slot < 3; slot += 1) {
    const before = await page.locator('.response-slot.filled').count();
    const candidates = await page.locator('.phrase.good:not(.used)').allTextContents();
    let advanced = false;
    for (const text of candidates) {
      await page.getByRole('button', { name: text, exact: true }).click();
      const after = await page.locator('.response-slot.filled').count();
      if (after > before) {
        advanced = true;
        break;
      }
    }
    assert.ok(advanced, `build slot ${slot + 1} should accept one correct phrase`);
  }
  await page.locator('#sayBtn:not(.hidden)').waitFor();
}

async function fillPushbackStage(page, checkWrongPath = false) {
  if (checkWrongPath) {
    const options = page.locator('.push-option');
    const count = await options.count();
    for (let i = 0; i < count; i += 1) {
      const before = await page.locator('.pushback-line').count();
      await options.nth(i).click();
      const after = await page.locator('.pushback-line').count();
      if (after === before && await page.locator('#pushbackFeedback.warn').isVisible()) break;
    }
  }

  for (let lineIndex = 0; lineIndex < 2; lineIndex += 1) {
    const before = await page.locator('.pushback-line').count();
    const candidates = await page.locator('.push-option:not(.used)').allTextContents();
    let advanced = false;
    for (const text of candidates) {
      await page.getByRole('button', { name: text, exact: true }).click();
      const after = await page.locator('.pushback-line').count();
      if (after > before) {
        advanced = true;
        break;
      }
    }
    assert.ok(advanced, `pushback line ${lineIndex + 1} should accept one correct phrase`);
  }
  await page.locator('#lockBtn:not(.hidden)').waitFor();
}

async function completeRound(page, index) {
  await page.locator('#reflexStage:not(.hidden)').waitFor();
  await dismissReflexes(page);
  await fillBuildStage(page, index === 0);
  await page.locator('#sayBtn').click();
  await page.locator('#voiceStage:not(.hidden)').waitFor();
  const spokenText = (await page.locator('#builtSpeech').innerText()).trim();
  assert.ok(spokenText.length > 25, 'built response should be substantial enough to say');
  await page.locator('#spokeBtn').click();
  await page.locator('#pushbackStage:not(.hidden)').waitFor();
  await fillPushbackStage(page, index === 0);
  await page.locator('#lockBtn').click();
  await page.locator('#roundResultStage:not(.hidden)').waitFor();
  assert.ok((await page.locator('#roundResultTitle').innerText()).trim().length > 5, 'round should show a meaningful result');
  await page.locator('#nextRoundBtn').click();
}

async function runDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), '言いたいことを、ちゃんと言える。 | LEVEL UP');
  await page.locator('h1').first().waitFor();
  assert.match(await page.locator('#homeView').innerText(), /断る。頼む。反対する。/);
  assert.equal(await page.locator('#startBtn').isVisible(), true, 'start button should be immediately visible');

  await page.locator('#startBtn').click();
  for (let i = 0; i < 4; i += 1) await completeRound(page, i);

  await page.locator('#resultView.active').waitFor();
  assert.match(await page.locator('#resultKept').innerText(), /4回/);
  assert.ok(await page.locator('.skill-result').count() >= 3, 'session should show skill results');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('hitobito.assertive.stats.v1') || '{}'));
  assert.equal(stored.sessions, 1, 'completed session should persist');
  await page.screenshot({ path: path.join(outputDir, 'desktop-result.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#homeView.active').waitFor();
  assert.equal(await page.locator('#homeStats').isVisible(), true, 'revisit should surface prior progress');
  assert.match(await page.locator('#homeStats').innerText(), /累計 1セッション/);

  await page.locator('#startBtn').click();
  await page.locator('#restartBtn').click();
  await page.locator('#homeView.active').waitFor();
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
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    startHeight: document.querySelector('#startBtn')?.getBoundingClientRect().height || 0,
    backHeight: document.querySelector('.home-link')?.getBoundingClientRect().height || 0,
  }));
  assert.ok(dimensions.scrollWidth <= dimensions.width + 1, 'mobile page should not overflow horizontally');
  assert.ok(dimensions.startHeight >= 58, 'primary mobile tap target should be large');
  assert.ok(dimensions.backHeight >= 44, 'back tap target should be at least 44px');
  await page.locator('#startBtn').click();
  await dismissReflexes(page);
  const afterStart = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(afterStart.scrollWidth <= afterStart.width + 1, 'mobile game stage should not overflow horizontally');
  await page.screenshot({ path: path.join(outputDir, 'mobile-build.png'), fullPage: true });
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runDesktop(browser);
  await runMobile(browser);
  console.log(`ASSERTIVE_BROWSER_PASS base=${baseUrl}`);
} finally {
  await browser.close();
}
