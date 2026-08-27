import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.NEGOTIATOR_REST_URL || 'http://127.0.0.1:4173/apps/negotiator-rest/?test=1';
const artifacts = new URL('./.artifacts/', import.meta.url);
await fs.mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const click = async id => page.locator(`[data-choice="${id}"]`).click();
const text = async () => page.locator('body').innerText();
const waitText = async value => page.getByText(value, { exact: false }).first().waitFor({ timeout: 5000 });

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  assert((await page.title()).includes('NEGOTIATOR'), 'title does not contain NEGOTIATOR');
  let body = await text();
  assert(body.includes('あなたを休ませます。'), 'first-view benefit is missing');
  assert(body.includes('2週間、全部休みませんか？'), 'opening offer is missing');
  assert(await page.locator('[data-choice]').count() === 3, 'opening screen must have exactly 3 choices');

  const tapHeights = await page.locator('button:visible').evaluateAll(nodes => nodes.map(n => Math.round(n.getBoundingClientRect().height)));
  assert(Math.min(...tapHeights) >= 44, `mobile tap target below 44px: ${tapHeights.join(',')}`);
  console.log(`FIRST_VIEW choices=3 tapMin=${Math.min(...tapHeights)} title=${JSON.stringify(await page.title())}`);
  await page.screenshot({ path: path.join(artifacts.pathname, 'first-view.png'), fullPage: true });

  await page.locator('[data-action="exit"]').click();
  await waitText('ここで終わって大丈夫です。');
  await page.locator('[data-action="continue"]').click();
  await waitText('2週間、全部休みませんか？');
  console.log('EXIT_MODAL continue=PASS');

  await click('open-busy');
  await waitText('2週間は撤回します。');
  body = await text();
  assert(body.includes('5分だけ休みませんか？'), 'counteroffer did not shrink to 5 minutes');
  console.log('RESIST_PATH stage=five offer=72');

  await page.reload({ waitUntil: 'networkidle' });
  body = await text();
  assert(body.includes('2週間は撤回します。') && body.includes('5分だけ休みませんか？'), 'reload did not resume active negotiation');
  console.log('RELOAD_RESUME stage=five PASS');

  await click('five-no');
  await waitText('5分も撤回します。');
  await click('one-tasks');
  await waitText('「休む」も撤回します。');
  await click('water-yes');
  await waitText('一口だけ。');
  await click('water-done');
  await waitText('水も必須ではありません。');
  await click('shoulder-yes');
  await waitText('肩を1cm下げる。');
  const hold = page.locator('[data-hold="shoulder"]');
  await hold.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await waitText('目だけ、仕事から外します。');
  await click('eyes-yes');
  await waitText('では最後に呼吸だけ。');
  await click('breath-yes');
  await waitText('もう22秒、離れています。');
  await click('final-yes');
  await waitText('休むと言う前に、少し休めました。');
  body = await text();
  const resultSeconds = Number((body.match(/\n(\d+)\n実際に仕事/) || [])[1]);
  assert(resultSeconds >= 30, `micro-rest path ended below 30 seconds: ${resultSeconds}`);
  assert(body.includes('大きな要求 → 要求縮小'), 'technique reveal is missing');
  console.log(`MICRO_RESULT rest=${resultSeconds} techniqueReveal=PASS`);
  await page.screenshot({ path: path.join(artifacts.pathname, 'micro-result.png'), fullPage: true });

  await click('again');
  await waitText('あなたを休ませます。');
  body = await text();
  assert(body.includes('前回') && body.includes(`${resultSeconds}秒休息`), 'revisit does not show previous session context');
  console.log('REVISIT previousSessionChip=PASS');

  await click('open-busy');
  await page.locator('[data-action="exit"]').click();
  await page.locator('[data-action="quit"]').click();
  await waitText('今日は、ここで終了。');
  console.log('QUIT_PATH result=PASS');

  await click('again');
  await click('open-busy');
  await click('five-yes');
  await waitText('交渉成立。');
  await waitText('休むと言う前に、少し休めました。');
  body = await text();
  assert(body.includes('\n300\n') || body.includes('300\n実際に仕事'), '5-minute accepted path did not record 300 seconds');
  console.log('EARLY_ACCEPT rest=300 PASS');

  assert(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  await fs.writeFile(new URL('evidence.json', artifacts), JSON.stringify({
    viewport: '390x844',
    firstViewChoices: 3,
    tapMin: Math.min(...tapHeights),
    reloadResume: true,
    microRestSeconds: resultSeconds,
    techniqueReveal: true,
    quitPath: true,
    earlyAcceptSeconds: 300,
    consoleErrors: errors,
  }, null, 2));
  console.log('NEGOTIATOR_REST_BROWSER_PLAYTEST=PASS');
} finally {
  await browser.close();
}
