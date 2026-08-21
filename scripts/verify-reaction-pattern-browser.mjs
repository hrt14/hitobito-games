import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const candidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const executablePath = candidates.find((value) => fs.existsSync(value));
if (!executablePath) throw new Error(`Chrome executable not found. Tried: ${candidates.join(', ')}`);

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.log(`[browser:console-error] ${message.text()}`);
  });

  const url = `https://levelup.hitobito.jp/apps/reaction-pattern/?e2e=${Date.now()}`;
  const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  assert(response?.ok(), `reaction-pattern returned HTTP ${response?.status()}`);

  const title = await page.title();
  assert(title.includes('5分で見える 自分の反応パターン'), `Unexpected title: ${title}`);
  assert(await page.$('[data-reaction-pattern-v1]'), 'Source marker is missing in production DOM.');
  assert(await page.$('#homeScreen.active'), 'Home screen is not active on first load.');

  await page.click('#startBtn');
  await page.waitForSelector('#moodScreen.active');
  await page.$eval('#moodRange', (el) => {
    el.value = '3';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('#moodNext');
  await page.waitForSelector('#traitScreen.active');

  for (let index = 0; index < 10; index += 1) {
    await page.waitForSelector('#traitCard [data-scale="4"]');
    const before = await page.$eval('#traitCard .q-meta span:last-child', (el) => el.textContent.trim());
    await page.click('#traitCard [data-scale="4"]');
    if (index < 9) {
      await page.waitForFunction((previous) => {
        const el = document.querySelector('#traitCard .q-meta span:last-child');
        return el && el.textContent.trim() !== previous;
      }, {}, before);
    }
  }

  await page.waitForSelector('#traitResultScreen.active');
  const bars = await page.$$('#bars .bar-row');
  assert(bars.length === 5, `Expected 5 trait bars, got ${bars.length}`);

  await page.click('#lensNext');
  await page.waitForSelector('#lensScreen.active');
  await page.click('#lensGrid [data-lens="safe"]');
  const sortNextEnabled = await page.$eval('#sortNext', (el) => !el.disabled);
  assert(sortNextEnabled, 'Sort button stayed disabled after selecting a motive lens.');
  await page.click('#sortNext');
  await page.waitForSelector('#sortScreen.active');

  const expected = ['fact', 'story', 'action', 'fact', 'story', 'action'];
  for (let index = 0; index < expected.length; index += 1) {
    await page.waitForSelector(`#sortScreen.active [data-sort="${expected[index]}"]:not([disabled])`);
    const before = await page.$eval('#sortCard .scene', (el) => el.textContent.trim());
    await page.click(`[data-sort="${expected[index]}"]`);
    await page.waitForSelector('#sortFeedback.show.good');
    if (index < expected.length - 1) {
      await page.waitForFunction((previous) => {
        const el = document.querySelector('#sortCard .scene');
        return el && el.textContent.trim() !== previous;
      }, { timeout: 5000 }, before);
    }
  }

  await page.waitForSelector('#resultScreen.active', { timeout: 5000 });
  const score = await page.$eval('#sortScore', (el) => el.textContent.trim());
  assert(score === '6/6', `Unexpected metacognition score: ${score}`);
  const manual = await page.$eval('#manualTitle', (el) => el.textContent.trim());
  assert(manual.length > 10, 'Reaction manual title was not generated.');

  await page.$eval('#moodAfterRange', (el) => {
    el.value = '1';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('#saveMoodBtn');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('reaction-pattern-history') || '[]'));
  assert(saved.length >= 1, 'Self-monitoring history was not stored in localStorage.');
  assert(saved[0].moodBefore === 3 && saved[0].moodAfter === 1, `Unexpected saved mood values: ${JSON.stringify(saved[0])}`);

  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('#homeScreen.active');
  await page.click('#historyBtn');
  await page.waitForSelector('#historyScreen.active');
  const historyText = await page.$eval('#historyList', (el) => el.textContent);
  assert(historyText.includes('ざわつき 3→1'), `Saved history was not visible after reload: ${historyText}`);

  await page.click('#infoBtn');
  await page.waitForSelector('#infoModal.show');
  const sourceLinks = await page.$$('#infoModal .sources a');
  assert(sourceLinks.length >= 3, `Expected at least 3 source links, got ${sourceLinks.length}`);

  assert(pageErrors.length === 0, `Production page errors: ${pageErrors.join(' | ')}`);
  console.log('REACTION PATTERN PRODUCTION BROWSER FLOW VERIFIED: mobile start -> 10 traits -> motive -> 6 sorter -> result -> save -> reload -> history -> sources');
} finally {
  await browser.close();
}
