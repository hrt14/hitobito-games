import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.WHAT_STOPS_YOU_URL || 'http://127.0.0.1:4173/apps/what-stops-you/';
const artifacts = path.resolve('apps/what-stops-you/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
await page.addInitScript(() => {
  navigator.share = async (payload) => { window.__sharePayload = payload; };
});

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('h1').waitFor();
  if (!(await page.locator('h1').innerText()).includes('あなたを')) throw new Error('start title missing');
  if (!(await page.locator('.note').innerText()).includes('医療・心理検査ではありません')) throw new Error('disclaimer missing');

  const startWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (startWidth > 390) throw new Error(`horizontal overflow on start: ${startWidth}`);

  await page.getByRole('button', { name: '診断する' }).click();
  const failureAnswerIndexes = [0, 4, 1, 2, 0, 1, 0, 3, 2, 0, 0, 2];
  for (let i = 0; i < failureAnswerIndexes.length; i += 1) {
    await page.locator('.answer').nth(failureAnswerIndexes[i]).click();
    if (i < failureAnswerIndexes.length - 1) {
      await page.waitForFunction((expected) => document.querySelector('#progressNum')?.textContent?.startsWith(String(expected)), i + 2);
    }
  }

  await page.locator('#resultScreen.active').waitFor();
  const type = (await page.locator('#typeName').innerText()).trim();
  if (type !== '失敗恐怖型') throw new Error(`unexpected result type: ${type}`);
  if ((await page.locator('#bars .bar-row').count()) !== 5) throw new Error('five result bars not rendered');
  const recHref = await page.locator('#recommendation').getAttribute('href');
  if (!recHref?.includes('/apps/fail-forward/')) throw new Error(`unexpected recommendation: ${recHref}`);

  const resultWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (resultWidth > 390) throw new Error(`horizontal overflow on result: ${resultWidth}`);

  await page.getByRole('button', { name: '結果をシェア' }).click();
  const shared = await page.evaluate(() => window.__sharePayload);
  if (!shared?.url?.includes('type=failure')) throw new Error(`share URL does not include result type: ${shared?.url}`);
  if (shared.url.includes('answers') || shared.url.includes('choices')) throw new Error('share URL leaks answers');

  await page.screenshot({ path: path.join(artifacts, 'result-mobile.png'), fullPage: true });

  const sharedUrl = `${url}?from=share&type=failure`;
  await page.goto(sharedUrl, { waitUntil: 'networkidle' });
  const banner = (await page.locator('#friendBanner').innerText()).trim();
  if (!banner.includes('友だちは「失敗恐怖型」')) throw new Error(`shared-entry banner missing: ${banner}`);
  if (!(await page.locator('#friendBanner').isVisible())) throw new Error('shared-entry banner is not visible');

  if (errors.length) throw new Error(errors.join('\n'));
  fs.writeFileSync(path.join(artifacts, 'playtest.txt'), [
    'PASS',
    'viewport=390x844 mobile touch',
    '12 questions completed',
    'deterministic failure result verified',
    '5 result bars verified',
    'fail-forward recommendation verified',
    'share payload verified',
    'shared URL contains type only, no answers',
    'shared-entry banner verified',
    'no horizontal overflow',
    'no page/console errors',
  ].join('\n') + '\n');
  console.log('what-stops-you mobile browser playtest: PASS');
} finally {
  await browser.close();
}
