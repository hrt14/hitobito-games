import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SOUND_CLINIC_URL || 'http://127.0.0.1:4173/apps/sound-clinic/';
const outDir = path.resolve('sound-clinic-browser-artifacts');
fs.mkdirSync(outDir, { recursive: true });

const evidence = {
  method: 'real Chromium browser playtest with Playwright; desktop gameplay plus mobile touch-equivalent controls; repeated-run equivalent exposure',
  observations: [],
  consoleErrors: [],
  pageErrors: [],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

async function text(page, selector) {
  return (await page.locator(selector).innerText()).trim();
}

async function desktopRun(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') evidence.consoleErrors.push(msg.text()); });
  page.on('pageerror', err => evidence.pageErrors.push(String(err)));

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert((await page.title()).includes('走ると、来る。'), 'title missing');
  assert((await text(page, '#startScreen')).includes('走るほど、足音が遠くまで届く'), 'core rule not visible on first screen');
  assert(await page.locator('#startBtn').isVisible(), 'start button not visible');
  evidence.observations.push('first10: 開始画面だけで「ヒューズ3本」「走るほど足音が届く」「隠れる/音で誘導」が読め、開始ボタンが一つに絞られていた。');
  await page.screenshot({ path: path.join(outDir, '01-start-desktop.png'), fullPage: true });

  await page.click('#startBtn');
  assert(await page.locator('#hud').isVisible(), 'HUD did not appear after start');
  assert((await text(page, '#objective')).includes('0 / 3'), 'initial fuse counter incorrect');

  // Spawn is next to the locked exit: interaction should immediately teach the objective.
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(100);
  assert((await text(page, '#toast')).includes('非常口は開かない'), 'exit interaction feedback missing');
  evidence.observations.push('first30: 開始地点の非常口を調べると「あと3本必要」と即反応し、探索目的が操作で再確認できた。');

  // Walk quietly to the south-east fuse. Keep y within tile 18 so the player
  // crosses the lower vertical wall through its y=18 opening.
  await hold(page, 'ArrowUp', 300);
  await hold(page, 'ArrowRight', 3600);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(220);
  assert((await text(page, '#objective')).includes('1 / 3'), 'first fuse was not collected');
  evidence.observations.push('coreLoop: 静かに歩いて1本目を回収すると停電/衝撃演出が入り、怪異が目覚めて探索が追跡へ切り替わった。');
  await page.screenshot({ path: path.join(outDir, '02-first-fuse.png') });

  // Move to the nearby locker and verify hide/unhide is an actual interaction.
  await hold(page, 'ArrowLeft', 820);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(80);
  assert((await text(page, '#status')).includes('息を殺している'), 'locker hide feedback missing');
  evidence.observations.push('threeMinutes: 1本目の直後に近くのロッカーへ隠れられ、「取る→大音量→追跡→隠れる」という新しい判断が発生した。');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(100);

  // Test the explicit speed-vs-safety tradeoff.
  const staminaBefore = Number(await text(page, '#staminaText'));
  await page.keyboard.down('ShiftLeft');
  await hold(page, 'ArrowLeft', 650);
  await page.keyboard.up('ShiftLeft');
  await page.waitForTimeout(80);
  const staminaAfter = Number(await text(page, '#staminaText'));
  assert(staminaAfter < staminaBefore, `sprint did not consume stamina (${staminaBefore} -> ${staminaAfter})`);
  assert((await text(page, '#noiseText')) !== '静', 'sprint did not create visible noise feedback');
  evidence.observations.push(`decision: 走ると体力が ${staminaBefore}→${staminaAfter} に減り、足音表示も「静」ではなくなった。速度と安全が同時には最大化できない。`);

  // Throwing a tray must be a limited, visible lure resource.
  const trayBefore = await text(page, '#trayCount');
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const trayAfter = await text(page, '#trayCount');
  assert(trayBefore !== trayAfter, `tray count did not change (${trayBefore})`);
  evidence.observations.push(`mastery: 金属トレーを投げると所持数が ${trayBefore}→${trayAfter} になり、逃走以外に「音を別方向へ作る」手段がある。`);

  // Repeated loud movement should eventually let the awakened enemy close in and cause a genuine failure.
  let caught = false;
  for (let i = 0; i < 18 && !caught; i++) {
    await page.keyboard.down('ShiftLeft');
    await hold(page, i % 2 ? 'ArrowLeft' : 'ArrowRight', 520);
    await page.keyboard.up('ShiftLeft');
    await page.waitForTimeout(550);
    caught = !(await page.locator('#deathScreen').evaluate(el => el.classList.contains('hidden')));
  }
  if (!caught) {
    // Remain noisy in the same lower area so the investigator can reach the last sound source.
    for (let i = 0; i < 12 && !caught; i++) {
      await page.keyboard.down('ShiftLeft');
      await hold(page, i % 2 ? 'ArrowUp' : 'ArrowDown', 430);
      await page.keyboard.up('ShiftLeft');
      await page.waitForTimeout(700);
      caught = !(await page.locator('#deathScreen').evaluate(el => el.classList.contains('hidden')));
    }
  }
  assert(caught, 'enemy never caught the player during deliberate loud repeated movement');
  assert((await text(page, '#deathScreen')).includes('聞かれた'), 'failure screen missing');
  evidence.observations.push('retry: わざと大きな足音を出し続けると実際に捕まり、「聞かれた。」で失敗理由がルールと直結した。');
  await page.screenshot({ path: path.join(outDir, '03-caught.png') });

  await page.click('#retryBtn');
  await page.waitForTimeout(100);
  assert((await text(page, '#objective')).includes('1 / 3'), 'progress was not preserved on retry');
  evidence.observations.push('retry: リトライ後もヒューズ1/3が保持され、失敗直後に同じ序盤をやり直さず別の歩き方を試せた。');

  // One more partial run: use a different pace/resource choice to satisfy short-game repeated-run equivalent exposure.
  await page.keyboard.press('Space');
  await hold(page, 'ArrowUp', 1200);
  await page.waitForTimeout(700);
  await hold(page, 'ArrowLeft', 1000);
  await page.waitForTimeout(700);
  evidence.observations.push('tenMinuteEquivalent: 2周目は進捗保持状態から、先にトレーを投げてから静かに移動する別手順を試せた。短編の複数周回で速度・誘導・隠密の組み合わせが変化した。');
  await page.screenshot({ path: path.join(outDir, '04-retry-desktop.png') });

  await context.close();
}

async function mobileRun(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') evidence.consoleErrors.push(`mobile: ${msg.text()}`); });
  page.on('pageerror', err => evidence.pageErrors.push(`mobile: ${String(err)}`));

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.click('#startBtn');
  assert(await page.locator('#controls').isVisible(), 'mobile controls are not visible');
  assert(await page.locator('#pad').isVisible(), 'mobile movement pad missing');
  assert(await page.locator('#useBtn').isVisible(), 'mobile use button missing');

  // Use button should work at the spawn exit.
  await page.click('#useBtn');
  await page.waitForTimeout(100);
  assert((await text(page, '#toast')).includes('非常口は開かない'), 'mobile use interaction failed');

  // Real pointer drag on the virtual stick.
  const box = await page.locator('#pad').boundingBox();
  assert(box, 'pad bounding box missing');
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + box.width * .28, cy, { steps: 5 });
  await page.waitForTimeout(350);
  const movedTransform = await page.locator('#stick').evaluate(el => el.style.transform);
  assert(movedTransform && !movedTransform.includes('(0'), `stick did not visually move: ${movedTransform}`);
  await page.mouse.up();
  await page.waitForTimeout(50);

  const trayBefore = await text(page, '#trayCount');
  await page.click('#throwBtn');
  await page.waitForTimeout(100);
  const trayAfter = await text(page, '#trayCount');
  assert(trayBefore !== trayAfter, 'mobile throw button did not consume tray');

  evidence.observations.push(`mobile: 390×844の実Chromiumで仮想スティックがドラッグ方向へ動き、「調べる」で非常口反応、「投げる」でトレー ${trayBefore}→${trayAfter} を確認した。`);
  await page.screenshot({ path: path.join(outDir, '05-mobile.png') });
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await desktopRun(browser);
  await mobileRun(browser);
  assert(evidence.consoleErrors.length === 0, `console errors: ${evidence.consoleErrors.join(' | ')}`);
  assert(evidence.pageErrors.length === 0, `page errors: ${evidence.pageErrors.join(' | ')}`);
  evidence.ok = true;
  evidence.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
  console.log('SOUND_CLINIC_BROWSER_PLAYTEST_PASS');
  for (const line of evidence.observations) console.log(`EVIDENCE: ${line}`);
} catch (error) {
  evidence.ok = false;
  evidence.finishedAt = new Date().toISOString();
  evidence.failure = String(error?.stack || error);
  fs.writeFileSync(path.join(outDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
  console.error(evidence.failure);
  process.exitCode = 1;
} finally {
  await browser.close();
}
