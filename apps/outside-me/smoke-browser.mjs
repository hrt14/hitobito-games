import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.OUTSIDE_ME_URL || 'http://127.0.0.1:4173/apps/outside-me/';
const artifacts = path.resolve('apps/outside-me/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(String(error)));

async function advanceToChoices(max = 24) {
  for (let i = 0; i < max; i += 1) {
    const visible = await page.locator('.choice-button:visible').count();
    if (visible > 0) return;
    await page.locator('#novelPanel').click({ position: { x: 120, y: 34 } });
    await page.waitForTimeout(35);
  }
  throw new Error('Choices did not appear in time. Current text: ' + await page.locator('#storyText').innerText());
}

async function choose(text) {
  await advanceToChoices();
  const button = page.getByRole('button', { name: new RegExp(text) }).first();
  await button.waitFor({ state: 'visible' });
  await button.click();
  await page.waitForTimeout(60);
}

async function finishEnding(expectedTitle) {
  await advanceToChoices();
  await page.locator('.choice-button:visible').first().click();
  await page.locator('#endingScreen.is-visible').waitFor({ state: 'visible' });
  const title = (await page.locator('#endingTitle').innerText()).trim();
  if (title !== expectedTitle) throw new Error(`Expected ending ${expectedTitle}, got ${title}`);
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.screenshot({ path: path.join(artifacts, '01-title-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '静かに始める' }).click();
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(artifacts, '02-first-10-seconds.png'), fullPage: true });

  await choose('ドアホンを見る');
  await choose('玄関から離れて家を調べる');
  await choose('調べる場所を選ぶ');

  await choose('洗面所の鏡');
  await choose('玄関へ戻る');
  await choose('スマホ');
  await choose('玄関へ戻る');
  await choose('勝手口');
  await choose('玄関へ戻る');

  await choose('ドアホンをもう一度見る');
  await page.screenshot({ path: path.join(artifacts, '03-camera-twist.png'), fullPage: true });
  await choose('録画を30秒巻き戻す');
  await choose('ブレーカーを落とし、勝手口から出る');
  await finishEnding('ふたりのいない家');
  await page.screenshot({ path: path.join(artifacts, '04-true-ending.png'), fullPage: true });

  await page.getByRole('button', { name: '別の手掛かりを追う' }).click();
  await page.locator('#memoryLine:not([hidden])').waitFor({ state: 'visible' });
  const memoryText = await page.locator('#memoryLine').innerText();
  if (!memoryText.includes('ふたりのいない家')) throw new Error('Second-run memory did not remember the previous ending.');
  await page.screenshot({ path: path.join(artifacts, '05-second-run-memory.png'), fullPage: true });

  await page.getByRole('button', { name: '静かに始める' }).click();
  await page.waitForTimeout(90);
  const repeatedOpening = await page.locator('#storyText').innerText();
  if (!repeatedOpening.includes('また') && !repeatedOpening.includes('同じ')) {
    throw new Error('Second-run opening did not change.');
  }
  await advanceToChoices();

  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '静かに始める' }).click();
  await choose('ドアホンを見る');
  await choose('「誰？」と話しかける');
  await choose('今すぐ開ける');
  await finishEnding('交代');

  if (consoleErrors.length) throw new Error('Browser console errors:\n' + consoleErrors.join('\n'));

  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify({
    url,
    viewport: '390x844',
    tested: [
      'first 10 seconds',
      'true route: mirror + phone + backdoor + rewind',
      'camera-twist peak moment',
      'true ending',
      'second-run persistent memory',
      'early-open swap ending',
    ],
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
