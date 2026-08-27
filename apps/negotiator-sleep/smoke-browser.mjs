import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.NEGOTIATOR_SLEEP_URL || 'https://levelup.hitobito.jp/apps/negotiator-sleep/';
const artifacts = path.resolve('apps/negotiator-sleep/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });

async function expectText(locator, text) {
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  const actual = (await locator.textContent()) || '';
  if (!actual.includes(text)) throw new Error(`Expected ${JSON.stringify(text)} in ${JSON.stringify(actual)}`);
}
async function clickText(text) {
  const button = page.getByRole('button', { name: text, exact: true });
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click();
  await page.waitForTimeout(240);
}
async function offer(expected) {
  await expectText(page.locator('#offerSize'), expected);
}
async function loadApp() {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.locator('#startScreen.active').waitFor({ state: 'visible', timeout: 15000 });
}
async function reloadApp() {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.locator('#startScreen.active').waitFor({ state: 'visible', timeout: 15000 });
}

try {
  await loadApp();
  if (!(await page.title()).includes('NEGOTIATOR｜寝かせる')) throw new Error(`Unexpected title: ${await page.title()}`);
  await expectText(page.locator('h1'), '寝る気ゼロ');
  await page.screenshot({ path: path.join(artifacts, '01-start.png'), fullPage: true });

  // Deep resistance path: the displayed ask must never grow after it shrinks.
  await clickText('交渉を始める');
  await offer('100%');
  await clickText('まだやることがある');
  await offer('36%');
  await clickText('いや、あと1個だけある');
  await offer('22%');
  await clickText('忘れそうで無理');
  await offer('14%');
  await clickText('声に出すのは嫌');
  await offer('14%');
  await clickText('今のままがいい');
  await offer('10%');
  await clickText('10秒も嫌');
  await offer('6%');
  await clickText('今はそれも嫌');
  await offer('6%');
  await clickText('まだ座っていたい');
  await offer('6%');
  await clickText('まだ動きたくない');
  await page.locator('#holdScreen.active').waitFor({ state: 'visible', timeout: 10000 });
  await expectText(page.locator('#holdSeconds'), '3');
  await page.screenshot({ path: path.join(artifacts, '02-three-second-deal.png'), fullPage: true });

  // Door-in-the-face fallback: refuse 3 sec, accept only 1 sec.
  await clickText('それすら今は無理');
  await expectText(page.locator('#holdSeconds'), '1');
  const hold = page.locator('#holdBtn');
  await hold.dispatchEvent('pointerdown');
  await page.waitForTimeout(1250);
  await hold.dispatchEvent('pointerup');
  await page.locator('#resultScreen.active').waitFor({ state: 'visible', timeout: 10000 });
  await expectText(page.locator('#resultTitle'), '成立');
  await expectText(page.locator('#finalOffer'), '1%');
  await expectText(page.locator('#resultRefusals'), '10');
  await page.screenshot({ path: path.join(artifacts, '03-result.png'), fullPage: true });

  await clickText('このまま画面を閉じる');
  await page.locator('#blackoutScreen.active').waitFor({ state: 'visible', timeout: 5000 });
  await clickText('やっぱり戻る');
  await page.locator('#resultScreen.active').waitFor({ state: 'visible', timeout: 5000 });

  // Reload/revisit: the previous result is deliberately local-only and should survive.
  await reloadApp();
  await expectText(page.locator('#previous'), '10回断って');
  await expectText(page.locator('#previous'), '1%');

  // Immediate YES path must not pretend that the ask was reduced.
  await page.evaluate(() => localStorage.removeItem('negotiator-sleep:last'));
  await reloadApp();
  await clickText('交渉を始める');
  await clickText('はい。もう寝る');
  await page.locator('#resultScreen.active').waitFor({ state: 'visible', timeout: 10000 });
  await expectText(page.locator('#resultTitle'), '即成立');
  await expectText(page.locator('#finalOffer'), '100%');

  // Full refusal path: autonomy wins; the app must stop rather than force a YES.
  await page.evaluate(() => localStorage.removeItem('negotiator-sleep:last'));
  await reloadApp();
  await clickText('交渉を始める');
  await clickText('全然眠くない');
  await clickText('まだスマホを見る');
  await clickText('充電は十分ある');
  await clickText('10秒も嫌');
  await clickText('今はそれも嫌');
  await clickText('まだ座っていたい');
  await clickText('まだ動きたくない');
  await page.locator('#holdScreen.active').waitFor({ state: 'visible', timeout: 10000 });
  await clickText('それすら今は無理');
  await expectText(page.locator('#holdSeconds'), '1');
  await clickText('それすら今は無理');
  await page.locator('#resultScreen.active').waitFor({ state: 'visible', timeout: 10000 });
  await expectText(page.locator('#resultTitle'), '不成立');
  await expectText(page.locator('#resultLead'), '寝るかどうかはあなたが決める');
  await page.screenshot({ path: path.join(artifacts, '04-full-refusal.png'), fullPage: true });

  const tapTargets = await page.evaluate(() => [...document.querySelectorAll('button')]
    .filter((el) => getComputedStyle(el).display !== 'none')
    .map((el) => ({ text: el.textContent?.trim(), h: el.getBoundingClientRect().height }))
    .filter((item) => item.h > 0 && item.h < 44));
  if (tapTargets.length) throw new Error(`Tap targets below 44px: ${JSON.stringify(tapTargets)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log('NEGOTIATOR SLEEP PRODUCTION PLAYTEST PASSED');
  console.log(JSON.stringify({
    url,
    viewport: '390x844',
    refusalPath: '100→36→22→14→14→10→6→6→6→3→1',
    finalRefusals: 10,
    directAccept: '100%',
    fullRefusal: '不成立',
    screenshots: 4,
  }));
} finally {
  await browser.close();
}
