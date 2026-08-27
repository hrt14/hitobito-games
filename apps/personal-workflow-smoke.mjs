import { chromium } from 'playwright';

const base = (process.env.LEVELUP_BASE || 'https://levelup.hitobito.jp').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function pageFor(slug) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/apps/${slug}/?production-smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { page, errors };
}

async function prepStop() {
  const { page, errors } = await pageFor('prep-stop');
  await page.locator('#start').click();
  await page.locator('#meeting').fill('明日のコンサル');
  await page.locator('#goal').fill('施策を3つ決める');
  await page.locator('#look').fill('直近4週間の売上');
  await page.locator('#ask').fill('今いちばん困っていること');
  await page.locator('#next').fill('担当と期限を決める');
  await page.locator('#finish.ready').click();
  await page.locator('#sealed.active').waitFor();
  const title = await page.locator('#sealed h1').innerText();
  if (!title.includes('準備完了') || !title.includes('もう調べない')) throw new Error(`prep-stop bad result: ${title}`);
  await page.locator('#urgeBtn').click();
  await page.locator('#urgeInput').fill('競合をさらに全部見る');
  await page.locator('#canProceed').click();
  const verdict = await page.locator('#verdict').innerText();
  if (!verdict.includes('今日はやらない')) throw new Error(`prep-stop bad urge verdict: ${verdict}`);
  if (errors.length) throw new Error(`prep-stop page errors: ${errors.join(' | ')}`);
  await page.close();
}

async function handoff() {
  const { page, errors } = await pageFor('handoff-tomorrow');
  await page.locator('#start').click();
  await page.locator('#dump').fill('資料を直す\nメールを返す\n数字を確認する');
  await page.locator('#chooseBtn').click();
  await page.locator('#choices .task').first().click();
  await page.locator('#nextBtn').click();
  await page.locator('#action').fill('資料を開いて1ページ目を見る');
  await page.locator('#sealBtn').click();
  await page.locator('#finalScreen.active').waitFor();
  const title = await page.locator('#finalScreen h1').innerText();
  if (!title.includes('引き継ぎ完了') || !title.includes('今日は閉じる')) throw new Error(`handoff bad result: ${title}`);
  if (errors.length) throw new Error(`handoff page errors: ${errors.join(' | ')}`);
  await page.close();
}

async function notNow() {
  const { page, errors } = await pageFor('not-now-decision');
  await page.locator('#start').click();
  await page.locator('#decision').fill('新しい仕事を受けるか');
  await page.locator('#gateBtn').click();
  await page.locator('#no').click();
  await page.locator('#no').click();
  await page.locator('#yes').click();
  await page.locator('#resultScreen.active').waitFor();
  const title = await page.locator('#resultTitle').innerText();
  if (!title.includes('いま決めなくていい')) throw new Error(`not-now bad result: ${title}`);
  await page.locator('.datebtn[data-days="3"]').click();
  await page.locator('#saveLater').click();
  const saved = await page.locator('#saveLater').innerText();
  if (!saved.includes('保留しました')) throw new Error(`not-now did not save: ${saved}`);
  if (errors.length) throw new Error(`not-now page errors: ${errors.join(' | ')}`);
  await page.close();
}

async function enough() {
  const { page, errors } = await pageFor('enough-done');
  await page.locator('#start').click();
  await page.locator('#target').fill('明日のコンサル資料');
  await page.locator('#judge').click();
  await page.locator('#yes').click();
  await page.locator('#no').click();
  await page.locator('#no').click();
  await page.locator('#resultScreen.active').waitFor();
  const title = await page.locator('#title').innerText();
  if (!title.includes('十分やった') || !title.includes('出す')) throw new Error(`enough-done bad result: ${title}`);
  await page.locator('.done-action').first().click();
  await page.locator('#complete.show').waitFor();
  if (errors.length) throw new Error(`enough-done page errors: ${errors.join(' | ')}`);
  await page.close();
}

try {
  await prepStop();
  await handoff();
  await notNow();
  await enough();
  console.log(`PERSONAL WORKFLOW PRODUCTION PLAYTEST OK: ${base}`);
} finally {
  await browser.close();
}
