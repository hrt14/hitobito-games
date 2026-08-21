import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SOUND_CLINIC_URL || 'http://127.0.0.1:4173/apps/sound-clinic/';
const outDir = path.resolve('sound-clinic-browser-artifacts');
fs.mkdirSync(outDir, { recursive: true });
const evidence = { method: 'real Chromium browser playtest; capture/retry plus mobile control run', observations: [], consoleErrors: [], pageErrors: [] };
const assert = (v, m) => { if (!v) throw new Error(m); };
const text = async (page, s) => (await page.locator(s).innerText()).trim();
async function hold(page, key, ms) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); }

const browser = await chromium.launch({ headless: true });
try {
  // Desktop failure/retry run.
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') evidence.consoleErrors.push(m.text()); });
  page.on('pageerror', e => evidence.pageErrors.push(String(e)));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.click('#startBtn');

  // Reach the south-east fuse through the center of the one-tile opening.
  await hold(page, 'ArrowUp', 300);
  await hold(page, 'ArrowRight', 3600);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(200);
  assert((await text(page, '#objective')).includes('1 / 3'), 'first fuse did not collect');
  evidence.observations.push('captureSetup: 静かな歩行で南東の1本目まで到達し、ヒューズ1/3と怪異覚醒を再現できた。');

  // Do not evade. The awakened investigator should reach the last sound source and catch the stationary player.
  await page.locator('#deathScreen:not(.hidden)').waitFor({ state: 'visible', timeout: 35000 });
  assert((await text(page, '#deathScreen')).includes('聞かれた'), 'caught screen text missing');
  evidence.observations.push('failure: ヒューズ取得後にその場で止まると怪異が実際に到達し、「聞かれた。」の死亡画面になった。');
  await page.screenshot({ path: path.join(outDir, '06-caught-stationary.png') });

  await page.click('#retryBtn');
  await page.waitForTimeout(120);
  assert((await text(page, '#objective')).includes('1 / 3'), 'fuse progress did not persist after retry');
  evidence.observations.push('retry: 死亡後の「入口から続ける」で即再開し、ヒューズ1/3が保持された。失敗した区間だけ戦略を変えられる。');

  // Second-run strategy differs: spend a lure before moving, then walk rather than sprint.
  const trayBefore = await text(page, '#trayCount');
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  const trayAfter = await text(page, '#trayCount');
  assert(trayBefore !== trayAfter, 'second-run lure was not spent');
  await hold(page, 'ArrowUp', 800);
  await hold(page, 'ArrowLeft', 900);
  evidence.observations.push(`repeatEquivalent: 再挑戦では開始直後にトレーを ${trayBefore}→${trayAfter} と先に使い、その後は歩行。前周の「回収地点で待つ」と異なる順序を実行できた。`);
  await page.screenshot({ path: path.join(outDir, '07-retry-strategy.png') });
  await context.close();

  // Mobile-size real browser control run.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mp = await mobile.newPage();
  mp.on('console', m => { if (m.type() === 'error') evidence.consoleErrors.push(`mobile: ${m.text()}`); });
  mp.on('pageerror', e => evidence.pageErrors.push(`mobile: ${String(e)}`));
  await mp.goto(base, { waitUntil: 'domcontentloaded' });
  await mp.click('#startBtn');
  assert(await mp.locator('#controls').isVisible(), 'mobile control cluster hidden');
  assert(await mp.locator('#pad').isVisible(), 'mobile pad hidden');
  assert(await mp.locator('#runBtn').isVisible(), 'mobile run button hidden');
  assert(await mp.locator('#useBtn').isVisible(), 'mobile use button hidden');
  assert(await mp.locator('#throwBtn').isVisible(), 'mobile throw button hidden');

  await mp.click('#useBtn');
  await mp.waitForTimeout(100);
  assert((await text(mp, '#toast')).includes('非常口は開かない'), 'mobile use did not inspect exit');

  const box = await mp.locator('#pad').boundingBox();
  assert(box, 'mobile pad has no bounds');
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await mp.mouse.move(cx, cy);
  await mp.mouse.down();
  await mp.mouse.move(cx + box.width * .28, cy - box.height * .12, { steps: 6 });
  await mp.waitForTimeout(300);
  const transform = await mp.locator('#stick').evaluate(el => el.style.transform);
  assert(transform && transform !== 'translate(0px, 0px)' && transform !== 'translate(0,0)', `mobile stick did not move: ${transform}`);
  await mp.mouse.up();

  const mobileTrayBefore = await text(mp, '#trayCount');
  await mp.click('#throwBtn');
  await mp.waitForTimeout(100);
  const mobileTrayAfter = await text(mp, '#trayCount');
  assert(mobileTrayBefore !== mobileTrayAfter, 'mobile throw did not spend tray');
  evidence.observations.push(`mobile: 390×844のChromiumで仮想スティックをドラッグでき、「調べる」で非常口反応、「投げる」で ${mobileTrayBefore}→${mobileTrayAfter} を確認した。`);
  await mp.screenshot({ path: path.join(outDir, '08-mobile-controls.png') });
  await mobile.close();

  assert(evidence.consoleErrors.length === 0, `console errors: ${evidence.consoleErrors.join(' | ')}`);
  assert(evidence.pageErrors.length === 0, `page errors: ${evidence.pageErrors.join(' | ')}`);
  evidence.ok = true;
  evidence.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, 'evidence-final.json'), JSON.stringify(evidence, null, 2));
  console.log('SOUND_CLINIC_FINAL_BROWSER_PLAYTEST_PASS');
  for (const line of evidence.observations) console.log(`EVIDENCE: ${line}`);
} catch (error) {
  evidence.ok = false;
  evidence.finishedAt = new Date().toISOString();
  evidence.failure = String(error?.stack || error);
  fs.writeFileSync(path.join(outDir, 'evidence-final.json'), JSON.stringify(evidence, null, 2));
  console.error(evidence.failure);
  process.exitCode = 1;
} finally {
  await browser.close();
}
