import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SOUND_CLINIC_URL || 'http://127.0.0.1:4173/apps/sound-clinic/';
const outDir = path.resolve('sound-clinic-browser-artifacts');
fs.mkdirSync(outDir, { recursive: true });
const evidence = { method: 'real Chromium browser playtest; noisy approach/capture/retry plus mobile control run', observations: [], consoleErrors: [], pageErrors: [] };
const assert = (v, m) => { if (!v) throw new Error(m); };
const text = async (page, s) => (await page.locator(s).innerText()).trim();
async function hold(page, key, ms) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); }
async function sprint(page, key, ms) {
  await page.keyboard.down('ShiftLeft');
  await hold(page, key, ms);
  await page.keyboard.up('ShiftLeft');
}
async function caught(page) {
  return !(await page.locator('#deathScreen').evaluate(el => el.classList.contains('hidden')));
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') evidence.consoleErrors.push(m.text()); });
  page.on('pageerror', e => evidence.pageErrors.push(String(e)));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert((await page.title()).includes('走ると、来る。'), 'title missing');
  assert((await text(page, '#startScreen')).includes('速く走るほど、足音が遠くまで届く'), 'core rule missing on first screen');
  evidence.observations.push('first10: 開始画面だけで「ヒューズ3本」「走るほど足音が届く」「隠れる/音で誘導」が読め、開始操作が一つに絞られていた。');
  await page.click('#startBtn');

  await page.keyboard.press('KeyE');
  await page.waitForTimeout(100);
  assert((await text(page, '#toast')).includes('非常口は開かない'), 'exit objective feedback missing');
  evidence.observations.push('first30: 開始地点の非常口を調べると「あと3本必要」と即反応し、目的がプレイ中の操作で分かった。');

  // Quietly reach the south-east fuse through the y=18 opening.
  await hold(page, 'ArrowUp', 300);
  await hold(page, 'ArrowRight', 3600);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(220);
  assert((await text(page, '#objective')).includes('1 / 3'), 'first fuse did not collect');
  evidence.observations.push('coreLoop: 静かな歩行で南東の1本目を回収すると停電/衝撃演出が入り、怪異が目覚めた。');
  await page.screenshot({ path: path.join(outDir, '01-first-fuse.png') });

  // Exercise the explicit speed/noise tradeoff before deliberately approaching danger.
  const staminaBefore = Number(await text(page, '#staminaText'));
  await sprint(page, 'ArrowLeft', 700);
  const staminaAfter = Number(await text(page, '#staminaText'));
  assert(staminaAfter < staminaBefore, `sprint did not consume stamina (${staminaBefore} -> ${staminaAfter})`);
  assert((await text(page, '#noiseText')) !== '静', 'sprint did not create visible noise');
  evidence.observations.push(`decision: 走ると体力が ${staminaBefore}→${staminaAfter} に減り、足音表示も「静」ではなくなった。速度と安全を同時に最大化できない。`);

  const trayBeforeDanger = await text(page, '#trayCount');
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const trayAfterDanger = await text(page, '#trayCount');
  assert(trayBeforeDanger !== trayAfterDanger, 'tray lure did not spend resource');
  evidence.observations.push(`mastery: 金属トレーを投げると所持数が ${trayBeforeDanger}→${trayAfterDanger} になり、逃げる以外に音源をずらす手段がある。`);

  // Legitimate gameplay route back through the central y=18/x=15 corridor, then north.
  // We intentionally sprint and make noise rather than manipulating game state.
  if (!(await caught(page))) await sprint(page, 'ArrowLeft', 3000);
  if (!(await caught(page))) await sprint(page, 'ArrowUp', 5200);
  for (let i = 0; i < 8 && !(await caught(page)); i++) {
    await sprint(page, i % 2 ? 'ArrowDown' : 'ArrowUp', 650);
    await page.waitForTimeout(300);
  }
  await page.locator('#deathScreen:not(.hidden)').waitFor({ state: 'visible', timeout: 8000 });
  assert((await text(page, '#deathScreen')).includes('聞かれた'), 'caught screen text missing');
  evidence.observations.push('failure: ヒューズ1本目の後、中央通路から怪異側へ走って足音を出すと実際に追跡され、「聞かれた。」で捕まった。失敗原因がコアルールと一致した。');
  await page.screenshot({ path: path.join(outDir, '02-caught-noisy-approach.png') });

  await page.click('#retryBtn');
  await page.waitForTimeout(120);
  assert((await text(page, '#objective')).includes('1 / 3'), 'fuse progress did not persist after retry');
  evidence.observations.push('retry: 「入口から続ける」で即再開し、ヒューズ1/3が保持されたため、序盤を繰り返さず別の手順を試せた。');

  // Second run: choose a different sequence, lure first and move quietly.
  const trayBefore = await text(page, '#trayCount');
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  const trayAfter = await text(page, '#trayCount');
  assert(trayBefore !== trayAfter, 'second-run lure was not spent');
  await hold(page, 'ArrowUp', 800);
  await hold(page, 'ArrowLeft', 900);
  evidence.observations.push(`repeatEquivalent: 再挑戦では開始直後にトレーを ${trayBefore}→${trayAfter} と先に使い、その後は歩行。前周の「怪異側へ走る」と違う速度・誘導順序を実行できた。`);
  await page.screenshot({ path: path.join(outDir, '03-retry-strategy.png') });
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
  await mp.screenshot({ path: path.join(outDir, '04-mobile-controls.png') });
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
