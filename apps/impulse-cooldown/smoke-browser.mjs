import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.env.IMPULSE_COOLDOWN_URL || 'https://levelup.hitobito.jp/apps/impulse-cooldown/';
const outDir = path.resolve('apps/impulse-cooldown/.artifacts');
fs.mkdirSync(outDir, { recursive: true });
const label = url.includes('localhost') ? 'local' : url.includes('web.app') ? 'firebase' : 'custom';
const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM_PATH });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

async function clearStorage() {
  await page.evaluate(() => {
    localStorage.removeItem('impulse-cooldown:locker:v1');
    localStorage.removeItem('impulse-cooldown:history:v1');
    localStorage.removeItem('impulse-cooldown:draft:v1');
  });
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await clearStorage();
  await page.reload({ waitUntil: 'domcontentloaded' });

  // --- First-time clarity: hero + primary CTA visible without explanation ---
  const hero = await page.locator('h1').first().innerText();
  if (!hero.includes('24時間') || !hero.includes('寝かせる')) throw new Error(`Unexpected hero: ${hero}`);
  await page.locator('#addCta').waitFor({ state: 'visible' });

  // --- Flow A: discard path ---
  await page.locator('#addCta').click();
  await page.locator('#itemName').fill('ワイヤレスイヤホン');
  await page.locator('#itemPrice').fill('12800');
  await page.locator('#nextBtn').click();
  await page.locator('[data-reason="sale"]').waitFor({ state: 'visible' });
  await page.locator('[data-reason="sale"]').click();
  await page.locator('[data-need="no"]').waitFor({ state: 'visible' });
  await page.locator('[data-need="no"]').click();
  await page.locator('[data-want="no"]').waitFor({ state: 'visible' });
  await page.locator('[data-want="no"]').click();
  await page.locator('.impulse-badge.high').waitFor({ state: 'visible' });
  await page.locator('#binDiscard').click();
  const discardMsg = await page.locator('.confirm-message').innerText();
  if (!discardMsg.includes('12,800') || !discardMsg.includes('浮いた')) throw new Error(`Unexpected discard confirm: ${discardMsg}`);
  await page.waitForTimeout(500); // let the confirm-icon pop animation settle before capturing evidence
  await page.screenshot({ path: path.join(outDir, `${label}-discard-confirm.png`) });
  await page.locator('#toHome').click();

  const savedStat = await page.locator('.stat-tile.saved strong').innerText();
  if (savedStat !== '¥12,800') throw new Error(`Expected saved stat ¥12,800, got ${savedStat}`);

  // --- Flow B: wait (cooldown) path ---
  await page.locator('#addCta').click();
  await page.locator('#itemName').fill('デザイナーズ椅子');
  await page.locator('#itemPrice').fill('48000');
  await page.locator('#nextBtn').click();
  await page.locator('[data-reason="longwanted"]').click();
  await page.locator('[data-need="yes"]').click();
  await page.locator('[data-want="yes"]').click();
  await page.locator('.impulse-badge.low').waitFor({ state: 'visible' });
  await page.locator('#binWait').click();
  await page.locator('.confirm-message').waitFor({ state: 'visible' });
  await page.locator('#toHome').click();

  const waitingCount = await page.locator('.section:has(.section-title:has-text("寝かせ中")) .badge-count').innerText();
  if (waitingCount !== '1') throw new Error(`Expected 1 waiting item, got ${waitingCount}`);
  await page.screenshot({ path: path.join(outDir, `${label}-home-waiting.png`) });

  // --- Reload mid-add-flow keeps draft (reload requirement) ---
  await page.locator('#addCta').click();
  await page.locator('#itemName').fill('スニーカー');
  await page.locator('#itemPrice').fill('9800');
  await page.locator('#nextBtn').click();
  await page.locator('[data-reason="sns"]').click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#itemName');
  const resumedStep = await page.locator('.step-label').innerText();
  if (!resumedStep.includes('STEP 3')) throw new Error(`Expected resume at STEP 3 after reload, got ${resumedStep}`);
  await page.locator('[data-need="no"]').click();
  await page.locator('[data-want="unsure"]').click();
  await page.locator('#binDiscard').click();
  await page.locator('#toHome').click();

  // --- Fast-forward the cooldown item to unlocked and verify recheck flow ---
  await page.evaluate(() => {
    const locker = JSON.parse(localStorage.getItem('impulse-cooldown:locker:v1'));
    locker[0].unlockAt = Date.now() - 1000;
    localStorage.setItem('impulse-cooldown:locker:v1', JSON.stringify(locker));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.section:has(.section-title:has-text("見直す"))').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(outDir, `${label}-home-recheck.png`) });
  await page.locator('[data-recheck]').first().click();
  await page.locator('#wantYes').waitFor({ state: 'visible' });
  await page.locator('#wantYes').click();
  await page.locator('#rExtend').waitFor({ state: 'visible' });
  await page.locator('#rBuy').click();
  const boughtMsg = await page.locator('.confirm-message').innerText();
  if (!boughtMsg.includes('デザイナーズ椅子') && !boughtMsg.includes('自分で選んだ')) throw new Error(`Unexpected recheck-buy confirm: ${boughtMsg}`);
  await page.locator('#toHome').click();

  // --- Wrong / empty-input path is blocked ---
  await page.locator('#addCta').click();
  await page.locator('#nextBtn').click();
  const stillOnAdd = await page.locator('#itemName').isVisible();
  if (!stillOnAdd) throw new Error('Empty item name should not advance past add screen');
  await page.locator('#itemName').fill('本');
  await page.locator('#nextBtn').click();
  const stillOnAdd2 = await page.locator('#itemName').isVisible();
  if (!stillOnAdd2) throw new Error('Missing price should not advance past add screen');
  await page.locator('#itemName').fill('');

  // --- History screen shows insight after 3+ discards ---
  await page.goto(url + '', { waitUntil: 'domcontentloaded' });
  await page.locator('#historyButton').click();
  const historyText = await page.locator('#app').innerText();
  if (!historyText.includes('やめた') || !historyText.includes('買った')) throw new Error(`History missing decision tags: ${historyText.slice(0, 200)}`);
  await page.screenshot({ path: path.join(outDir, `${label}-history.png`) });

  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);
  console.log(`IMPULSE COOLDOWN PLAYTEST OK: ${url}`);
} finally {
  await browser.close();
}
