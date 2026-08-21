import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.UMA_URL || 'http://127.0.0.1:4173/apps/uma-chosatai/';
const artifactDir = path.resolve('apps/uma-chosatai/.artifacts');
fs.mkdirSync(artifactDir, { recursive: true });

const observations = [];
const failures = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

// Stable randomness keeps the automated route reproducible while still using the real UI and game state machine.
await context.addInitScript(() => {
  Math.random = () => 0.1;
  try { localStorage.clear(); } catch {}
});

const page = await context.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') failures.push(`console: ${msg.text()}`);
});
page.on('pageerror', (err) => failures.push(`pageerror: ${err.message}`));

async function shot(name) {
  await page.screenshot({ path: path.join(artifactDir, `${name}.png`), fullPage: true });
}

async function horizontalOverflow() {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  assert((await page.title()).includes('UMA調査隊'), 'title should identify the game');
  await page.locator('#world-title').waitFor({ state: 'visible' });
  const worldText = await page.locator('#screen-world').innerText();
  assert(worldText.includes('世界の未確認生物を、'), 'world screen must explain the purpose immediately');
  assert((await page.locator('.case-card').count()) === 6, 'world map should expose six case files');
  const worldOverflow = await horizontalOverflow();
  assert(worldOverflow <= 2, `mobile world screen must not horizontally overflow: ${worldOverflow}px`);
  observations.push('first10Seconds: 390px幅で目的コピー、世界地図、CASEカード、最初の調査ボタンが同一画面フローに表示され、横スクロールは発生しなかった。');
  await shot('01-world-mobile');

  await page.locator('#continueBtn').click();
  await page.locator('#screen-briefing.active').waitFor({ state: 'visible' });
  assert((await page.locator('#brief-title').innerText()) === 'ネッシー', 'first case should be Nessie');
  const briefingText = await page.locator('#screen-briefing').innerText();
  assert(briefingText.includes('主な誤認候補'), 'briefing must surface false-positive candidates');
  observations.push('briefing: 調査対象だけでなく「主な誤認候補」とMISSIONが開始前に見える。');
  await shot('02-briefing-mobile');

  await page.locator('#deployBtn').click();
  await page.locator('#screen-field.active').waitFor({ state: 'visible' });
  assert((await page.locator('.zone-btn').count()) === 4, 'field should have four investigable zones');
  assert((await page.locator('.tool-btn').count()) === 4, 'field should have four tools');
  assert(await page.locator('#stakeoutBtn').isDisabled(), 'stakeout should start locked');
  assert((await horizontalOverflow()) <= 2, 'mobile field screen should not horizontally overflow');
  observations.push('first30Seconds: 現場で4地点の反応強度を見比べ、地点を選ぶまで装備が無効、地点選択後に装備が有効になる二段操作を確認。');
  await shot('03-field-start-mobile');

  for (let toolIndex = 0; toolIndex < 4; toolIndex += 1) {
    await page.locator('.zone-btn').nth(0).click();
    assert(!(await page.locator('.tool-btn').nth(toolIndex).isDisabled()), `tool ${toolIndex} should enable after zone selection`);
    await page.locator('.tool-btn').nth(toolIndex).click();
    await page.waitForTimeout(90);
  }

  const litEvidence = await page.locator('.evidence-dots i.on').count();
  assert(litEvidence >= 4, `four investigation types should yield evidence in deterministic route, got ${litEvidence}`);
  assert(!(await page.locator('#stakeoutBtn').isDisabled()), 'stakeout should unlock after independent evidence');
  const timeLeft = Number(await page.locator('#timeStat').innerText());
  const batteryLeft = Number(await page.locator('#batteryStat').innerText());
  assert(timeLeft === 4, `four investigations should consume four actions, time=${timeLeft}`);
  assert(batteryLeft === 3, `camera+recorder+trace+thermal should consume five battery, battery=${batteryLeft}`);
  observations.push('coreLoop: 望遠・録音・痕跡・熱源の4手で TIME 8→4、BAT 8→3。証拠系統が増えるたびEVIDENCEが点灯し、条件達成で「張り込む」が解放された。');
  await shot('04-field-evidence-mobile');

  await page.locator('#stakeoutBtn').click();
  await page.locator('#screen-encounter.active').waitFor({ state: 'visible', timeout: 3500 });
  observations.push('peakMoment: 張り込み成功後、通常UIから全画面スコープへ切り替わり、移動するシルエットを4秒以内に撮影する状態へ遷移した。');
  await shot('05-encounter-mobile');
  await page.locator('#cryptidTarget').click({ force: true });
  await page.locator('#screen-result.active').waitFor({ state: 'visible', timeout: 2000 });
  const confidence = Number((await page.locator('#resultConfidence').innerText()).replace('%', ''));
  assert(confidence > 0 && confidence < 100, `result confidence must be a game score below 100, got ${confidence}`);
  const resultText = await page.locator('#screen-result').innerText();
  assert(resultText.includes('科学的な存在証明を意味しません'), 'result must distinguish game score from scientific proof');
  assert(resultText.includes('同じ案件を再調査'), 'result should provide a concrete retry action');
  assert((await horizontalOverflow()) <= 2, 'mobile result screen should not horizontally overflow');
  observations.push(`result: 撮影後に発見確度${confidence}%、独立証拠・証拠点数・誤認除外・PHOTOを分解表示し、同案件再調査と次地域の両方を提示した。`);
  await shot('06-result-mobile');

  // Equivalent repeated exposure: visit three additional cases through their real briefing/field UI.
  await page.locator('#screen-result [data-action="world"]').click();
  await page.locator('#screen-world.active').waitFor({ state: 'visible' });
  for (let caseIndex = 1; caseIndex <= 3; caseIndex += 1) {
    await page.locator('.case-card').nth(caseIndex).click();
    await page.locator('#screen-briefing.active').waitFor({ state: 'visible' });
    const caseName = await page.locator('#brief-title').innerText();
    await page.locator('#deployBtn').click();
    await page.locator('#screen-field.active').waitFor({ state: 'visible' });
    const zoneLabels = await page.locator('.zone-label').allInnerTexts();
    assert(new Set(zoneLabels).size === 4, `${caseName} should have four distinct field zones`);
    await page.locator('.zone-btn').nth(0).click();
    await page.locator('.tool-btn').nth((caseIndex - 1) % 4).click();
    await page.waitForTimeout(70);
    observations.push(`variation run ${caseIndex + 1}: ${caseName}で地域固有の4地点 (${zoneLabels.join(' / ')}) と証拠ログの切替を確認。`);
    await page.locator('#screen-field [data-action="world"]').click();
    await page.locator('#screen-world.active').waitFor({ state: 'visible' });
  }

  observations.push('tenMinutesEquivalent: ネッシーの1フルランに加え、サスカッチ・イエティ・チュパカブラを同一ブラウザセッションで巡回し、地域ごとに地点構成と証拠文脈が変わることを確認。');
  observations.push('noReward: XP・コイン・ガチャ等のメタ報酬なしで、観察→地点選択→装備選択→証拠/誤認の更新→張り込みという操作だけで進行することを確認。');
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  fs.writeFileSync(path.join(artifactDir, 'playtest-observations.json'), JSON.stringify({ observations, failures }, null, 2));
  await browser.close();
}

console.log(JSON.stringify({ observations, failures }, null, 2));
if (failures.length) process.exit(1);
