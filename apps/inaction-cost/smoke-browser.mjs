import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.INACTION_COST_URL || 'http://127.0.0.1:4173/apps/inaction-cost/';
const artifactDir = path.resolve('apps/inaction-cost/.artifacts');
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const outbound = [];
page.on('request', (request) => outbound.push(request.url()));

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /何もしない/ }).waitFor();

  await page.getByRole('button', { name: '公平に比べる' }).click();
  await page.getByText('先延ばししていることを1つ入れてください。').waitFor();

  await page.locator('#task').fill('秘密の企画A');
  await page.getByRole('button', { name: '公平に比べる' }).click();
  for (const label of ['面倒', '怖い', '失敗したくない']) {
    await page.getByRole('button', { name: label, exact: true }).click();
  }
  await page.getByText('3 / 3 選択').waitFor();
  await page.getByRole('button', { name: '天秤に乗せる' }).click();
  await page.getByRole('button', { name: '1週間' }).click();
  await page.getByRole('button', { name: '3か月' }).click();
  await page.getByText('試して修正できたかもしれない回数').waitFor();
  await page.getByRole('button', { name: '待つ意味を確かめる' }).click();
  await page.getByRole('button', { name: /麻酔/ }).click();
  await page.getByRole('button', { name: 'この判断で進む' }).click();
  await page.getByRole('button', { name: '1文だけ書く' }).click();
  await page.getByRole('button', { name: 'この一手で終える' }).click();
  await page.getByText('比較して、決めた。').waitFor();
  await page.getByText('秘密の企画A').waitFor();
  await page.getByText('1文だけ書く').waitFor();
  await page.getByText('共有文には、入力した内容や選んだ悩みを含めません。').waitFor();

  await page.getByRole('button', { name: 'もう一度比べる' }).click();
  await page.locator('#task').fill('返信する');
  await page.getByRole('button', { name: '公平に比べる' }).click();
  await page.getByRole('button', { name: '気まずい', exact: true }).click();
  await page.getByRole('button', { name: '天秤に乗せる' }).click();
  await page.getByRole('button', { name: '1年' }).click();
  await page.getByRole('button', { name: '待つ意味を確かめる' }).click();
  await page.getByRole('button', { name: /滑走路/ }).click();
  await page.getByRole('button', { name: 'この判断で進む' }).click();
  await page.getByRole('button', { name: '滑走路にする' }).click();
  await page.getByText('待つことで増やすものを具体的に入れてください。').waitFor();
  await page.locator('#gain').fill('候補3社を比較する');
  await page.locator('#rule').fill('金曜18時に判断する');
  await page.getByRole('button', { name: '滑走路にする' }).click();
  await page.getByText('候補3社を比較する → 金曜18時に判断する').waitFor();

  if (outbound.some((requestUrl) => requestUrl.includes('秘密の企画A'))) {
    throw new Error('Free-text task leaked into a network request.');
  }

  await page.screenshot({ path: path.join(artifactDir, 'mobile-result.png'), fullPage: true });
  console.log('inaction-cost mobile playtest passed');
} finally {
  await browser.close();
}
