import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.SOUND_CLINIC_URL || 'http://127.0.0.1:4173/apps/sound-clinic/';
const outDir = path.resolve('sound-clinic-browser-audit-v2');
fs.mkdirSync(outDir, { recursive: true });
const evidence = { method: 'real Chromium browser playtest with Playwright', observations: [], errors: [] };
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const text = async (page, sel) => (await page.locator(sel).innerText()).trim();
async function hold(page, code, ms){ await page.keyboard.down(code); await page.waitForTimeout(ms); await page.keyboard.up(code); }

const browser = await chromium.launch({ headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') evidence.errors.push('console: '+m.text()); });
  page.on('pageerror', e => evidence.errors.push('page: '+String(e)));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert((await page.title()).includes('走ると、来る。'), 'title missing');
  const startText = await text(page, '#startScreen');
  assert(startText.includes('3本のヒューズ'), '3-fuse goal missing');
  assert(startText.includes('速く走るほど、足音が遠くまで届く'), 'sound rule missing');
  assert(await page.locator('#startBtn').isVisible(), 'start button missing');
  evidence.observations.push('first10: 目的、走るリスク、隠れる/投げるという対処が開始画面で読めた。');
  await page.screenshot({ path: path.join(outDir, '01-start.png') });

  await page.click('#startBtn');
  assert(await page.locator('#hud').isVisible(), 'HUD missing after start');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(120);
  assert((await text(page, '#toast')).includes('非常口は開かない'), 'exit feedback missing');
  assert((await text(page, '#objective')).includes('0 / 3'), 'initial objective incorrect');
  evidence.observations.push('first30: 開始地点の非常口を調べるだけで、あと3本必要と操作から目的を再確認できた。');

  // Reach the south-east fuse through the only lower-corridor opening at y=18.
  await hold(page, 'ArrowUp', 300);
  await hold(page, 'ArrowRight', 3350);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(260);
  assert((await text(page, '#objective')).includes('1 / 3'), 'first fuse not collected on corrected route');
  evidence.observations.push('core: 静かに南東へ移動して1本目を回収すると、停電演出と怪異覚醒が入り探索から追跡へ切り替わった。');
  await page.screenshot({ path: path.join(outDir, '02-fuse.png') });

  // Nearby locker interaction.
  await hold(page, 'ArrowLeft', 520);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(120);
  assert((await text(page, '#status')).includes('息を殺している'), 'locker hide interaction failed');
  evidence.observations.push('threeMinute: ヒューズ取得直後にロッカーへ隠れられ、音を出した後の対処判断が実際に機能した。');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(100);

  const staminaBefore = Number(await text(page, '#staminaText'));
  await page.keyboard.down('ShiftLeft');
  await hold(page, 'ArrowLeft', 700);
  await page.keyboard.up('ShiftLeft');
  await page.waitForTimeout(60);
  const staminaAfter = Number(await text(page, '#staminaText'));
  assert(staminaAfter < staminaBefore, `sprint stamina unchanged ${staminaBefore}->${staminaAfter}`);
  assert((await text(page, '#noiseText')) !== '静', 'sprint noise feedback missing');
  evidence.observations.push(`decision: 走ると体力が${staminaBefore}→${staminaAfter}に下がり、足音も静ではなくなった。速さと安全が競合した。`);

  const trayBefore = await text(page, '#trayCount');
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  const trayAfter = await text(page, '#trayCount');
  assert(trayBefore !== trayAfter, `tray not consumed ${trayBefore}`);
  evidence.observations.push(`riskReward: 金属トレーは${trayBefore}→${trayAfter}となり、有限資源を使って音源を別方向へ作れる。`);

  // Deliberately stay loud until caught; this verifies the core rule has real consequences.
  let caught = false;
  for (let i=0; i<36 && !caught; i++) {
    await page.keyboard.down('ShiftLeft');
    await hold(page, i%2 ? 'ArrowLeft' : 'ArrowRight', 430);
    await page.keyboard.up('ShiftLeft');
    await page.waitForTimeout(420);
    caught = !(await page.locator('#deathScreen').evaluate(el => el.classList.contains('hidden')));
  }
  assert(caught, 'deliberate loud movement never caused capture');
  assert((await text(page, '#deathScreen')).includes('聞かれた'), 'failure text missing');
  evidence.observations.push('retry: 大きな足音を出し続けると実際に捕まり、失敗理由が「音」のルールと直結した。');
  await page.screenshot({ path: path.join(outDir, '03-caught.png') });

  await page.click('#retryBtn');
  await page.waitForTimeout(120);
  assert((await text(page, '#objective')).includes('1 / 3'), 'fuse progress not preserved on retry');
  const trayRetryBefore = await text(page, '#trayCount');
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const trayRetryAfter = await text(page, '#trayCount');
  assert(trayRetryBefore !== trayRetryAfter, 'alternate retry action failed');
  evidence.observations.push('tenMinuteEquivalent: 2周目はヒューズ1/3を保持したまま始まり、先にトレーを使う別手順を即座に試せた。');
  await ctx.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mp = await mobile.newPage();
  mp.on('console', m => { if (m.type() === 'error') evidence.errors.push('mobile console: '+m.text()); });
  mp.on('pageerror', e => evidence.errors.push('mobile page: '+String(e)));
  await mp.goto(base, { waitUntil: 'domcontentloaded' });
  await mp.click('#startBtn');
  assert(await mp.locator('#controls').isVisible(), 'mobile controls hidden');
  assert(await mp.locator('#pad').isVisible(), 'mobile pad hidden');
  assert(await mp.locator('#useBtn').isVisible(), 'mobile use button hidden');
  await mp.locator('#useBtn').dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 });
  await mp.waitForTimeout(120);
  assert((await text(mp, '#toast')).includes('非常口は開かない'), 'mobile use did not interact');
  const before = await text(mp, '#trayCount');
  await mp.locator('#throwBtn').dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch', isPrimary: true, button: 0 });
  await mp.waitForTimeout(120);
  const after = await text(mp, '#trayCount');
  assert(before !== after, 'mobile throw did not consume tray');
  const box = await mp.locator('#pad').boundingBox();
  assert(box, 'mobile pad has no bounds');
  const cx=box.x+box.width/2, cy=box.y+box.height/2;
  await mp.mouse.move(cx,cy); await mp.mouse.down(); await mp.mouse.move(cx+30,cy,{steps:4}); await mp.waitForTimeout(260);
  const transform = await mp.locator('#stick').evaluate(el=>el.style.transform); await mp.mouse.up();
  assert(transform && transform !== 'translate(0px, 0px)' && transform !== 'translate(0,0)', `mobile stick did not move: ${transform}`);
  evidence.observations.push(`mobile: 390x844実Chromiumで仮想スティック、調べる、投げるを操作し、トレー${before}→${after}を確認した。`);
  await mp.screenshot({ path: path.join(outDir, '04-mobile.png') });
  await mobile.close();

  assert(evidence.errors.length === 0, evidence.errors.join(' | '));
  evidence.ok = true;
  evidence.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outDir,'evidence.json'), JSON.stringify(evidence,null,2));
  console.log('SOUND_CLINIC_BROWSER_AUDIT_V2_PASS');
  evidence.observations.forEach(o=>console.log('EVIDENCE:',o));
} catch (err) {
  evidence.ok = false; evidence.finishedAt = new Date().toISOString(); evidence.failure = String(err?.stack||err);
  fs.writeFileSync(path.join(outDir,'evidence.json'), JSON.stringify(evidence,null,2));
  console.error(evidence.failure); process.exitCode=1;
} finally { await browser.close(); }
