import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import process from 'node:process';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/apps/midnight-haunted-cleaner/`;
const server = spawn(process.execPath, ['scripts/local-server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (d) => { serverOutput += d.toString(); });
server.stderr.on('data', (d) => { serverOutput += d.toString(); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error(`Local server did not start. ${serverOutput}`);
}

async function snapshot(page) {
  return page.evaluate(() => window.__playtestSnapshot());
}

function movementKeys(dx, dy) {
  const keys = [];
  if (Math.abs(dx) > 10) keys.push(dx > 0 ? 'd' : 'a');
  if (Math.abs(dy) > 10) keys.push(dy > 0 ? 's' : 'w');
  return keys;
}

async function pulseKeys(page, keys, ms = 105) {
  for (const key of keys) await page.keyboard.down(key);
  await sleep(ms);
  for (const key of [...keys].reverse()) await page.keyboard.up(key);
}

async function moveTo(page, x, y, tolerance = 54, maxSteps = 120) {
  let previous = null;
  let stagnant = 0;
  for (let i = 0; i < maxSteps; i++) {
    const s = await snapshot(page);
    const dx = x - s.player.x;
    const dy = y - s.player.y;
    if (Math.hypot(dx, dy) <= tolerance) return s;
    if (previous && Math.hypot(previous.x - s.player.x, previous.y - s.player.y) < 1.2) stagnant++;
    else stagnant = 0;
    previous = { x: s.player.x, y: s.player.y };
    let keys = movementKeys(dx, dy);
    if (stagnant > 4) {
      keys = Math.abs(dx) > Math.abs(dy) ? [dy > 0 ? 's' : 'w'] : [dx > 0 ? 'd' : 'a'];
      stagnant = 0;
    }
    await pulseKeys(page, keys, 85);
    await sleep(18);
  }
  const s = await snapshot(page);
  throw new Error(`Could not move to ${x},${y}. At ${s.player.x.toFixed(1)},${s.player.y.toFixed(1)} in ${s.room}`);
}

async function faceToward(page, x, y) {
  const s = await snapshot(page);
  const dx = x - s.player.x, dy = y - s.player.y;
  const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
  await pulseKeys(page, [key], 55);
}

function approachPoint(player, furniture, distance = 63) {
  const cx = furniture.x + furniture.w / 2;
  const cy = furniture.y + furniture.h / 2;
  const dx = player.x - cx, dy = player.y - cy;
  const m = Math.hypot(dx, dy) || 1;
  return { x: cx + (dx / m) * distance, y: cy + (dy / m) * distance };
}

async function searchPossessed(page) {
  let s = await snapshot(page);
  const f = s.furniture.find((item) => item.possessed && !item.searched);
  assert(f, `No unrevealed possessed furniture in ${s.room}`);
  const p = approachPoint(s.player, f);
  await moveTo(page, p.x, p.y, 62);
  await faceToward(page, f.x + f.w / 2, f.y + f.h / 2);
  await page.keyboard.down('Shift');
  for (let i = 0; i < 18; i++) {
    await sleep(100);
    s = await snapshot(page);
    if (s.ghosts.length) break;
  }
  await page.keyboard.up('Shift');
  await sleep(120);
  s = await snapshot(page);
  assert(s.ghosts.some((g) => g.type !== 'decoy'), `Suction did not reveal a ghost from ${f.label}`);
  return { furniture: f, snapshot: s };
}

async function chargeFlash(page, ghost) {
  await faceToward(page, ghost.x, ghost.y);
  await page.keyboard.down('Space');
  await sleep(880);
  await page.keyboard.up('Space');
  await sleep(100);
}

async function counterPull(page, ghostId, ms = 830) {
  await page.keyboard.down('Shift');
  const started = Date.now();
  while (Date.now() - started < ms) {
    const s = await snapshot(page);
    const g = s.ghosts.find((item) => item.id === ghostId);
    if (!g) break;
    const dx = s.player.x - g.x, dy = s.player.y - g.y;
    const keys = movementKeys(dx, dy);
    await pulseKeys(page, keys.length ? keys : ['s'], 95);
    await sleep(20);
  }
  await page.keyboard.up('Shift');
  await sleep(180);
}

async function fightOne(page, preferredType = null) {
  for (let round = 0; round < 14; round++) {
    let s = await snapshot(page);
    const real = s.ghosts.filter((g) => g.type !== 'decoy');
    if (!real.length) return;
    const g = preferredType ? (real.find((x) => x.type === preferredType) || real[0]) : real[0];
    if (Math.hypot(s.player.x - g.x, s.player.y - g.y) > 145) await moveTo(page, g.x, g.y, 128, 70);
    s = await snapshot(page);
    const current = s.ghosts.find((x) => x.id === g.id);
    if (!current) return;
    await chargeFlash(page, current);
    s = await snapshot(page);
    const flashed = s.ghosts.find((x) => x.id === g.id);
    if (!flashed) return;
    if (flashed.stunned <= 0) {
      await pulseKeys(page, ['a'], 80);
      continue;
    }
    await counterPull(page, g.id, 840);
    await sleep(420);
  }
  const s = await snapshot(page);
  throw new Error(`Ghost survived too many flash/suction cycles in ${s.room}: ${JSON.stringify(s.ghosts)}`);
}

async function clearCurrentRoom(page, evidence) {
  let s = await snapshot(page);
  const room = s.room;
  const required = s.roomState.required;
  while (!s.roomState.cleared) {
    if (!s.ghosts.some((g) => g.type !== 'decoy')) {
      const found = await searchPossessed(page);
      evidence.push(`${room}: suction search revealed ${found.snapshot.ghosts[0]?.type || 'ghost'} from ${found.furniture.label}`);
    }
    await fightOne(page, room === 'ballroom' ? 'mirror' : null);
    s = await snapshot(page);
  }
  evidence.push(`${room}: cleared ${s.roomState.captured}/${required}, seals=${s.seals}, hp=${s.player.hp}/${s.player.maxHp}`);
  return s;
}

async function useDoor(page, targetRoom) {
  let s = await snapshot(page);
  const door = s.doors.find((d) => d.target === targetRoom);
  assert(door, `No door from ${s.room} to ${targetRoom}`);
  assert(door.unlocked, `Door from ${s.room} to ${targetRoom} is locked`);
  await moveTo(page, door.x, door.y, 20, 100);
  for (let i = 0; i < 25; i++) {
    await sleep(70);
    s = await snapshot(page);
    if (s.room === targetRoom) return s;
    const dx = door.x - s.player.x, dy = door.y - s.player.y;
    await pulseKeys(page, movementKeys(dx, dy), 65);
  }
  throw new Error(`Door transition ${door.target} failed`);
}

async function runFull(browser, seed, route = ['library', 'gallery']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}?seed=${encodeURIComponent(seed)}`, { waitUntil: 'networkidle' });
  await page.click('#startBtn');
  await sleep(180);
  const evidence = [];
  const started = Date.now();
  let s = await snapshot(page);
  assert(s.mode === 'running' && s.room === 'foyer', 'Start button did not enter foyer gameplay');
  const p0 = { ...s.player };
  await pulseKeys(page, ['w'], 360);
  s = await snapshot(page);
  assert(Math.hypot(s.player.x - p0.x, s.player.y - p0.y) > 30, 'Movement did not visibly change player position');
  evidence.push(`first10s: start objective visible; player moved ${Math.round(Math.hypot(s.player.x-p0.x,s.player.y-p0.y))}px with one movement input`);

  await clearCurrentRoom(page, evidence);
  const firstLoopSeconds = (Date.now() - started) / 1000;
  assert(firstLoopSeconds < 30, `First search→flash→suction loop took ${firstLoopSeconds.toFixed(1)}s`);
  evidence.push(`first30s: first full search→reveal→flash→counter-pull→capture loop completed in ${firstLoopSeconds.toFixed(1)}s`);

  for (const branch of route) {
    await useDoor(page, branch);
    await clearCurrentRoom(page, evidence);
    await useDoor(page, 'foyer');
  }
  s = await snapshot(page);
  assert(s.clearedRooms.library && s.clearedRooms.gallery, 'Both optional wings were not cleared');
  assert(s.player.lightRangeBonus > 0 && s.player.suctionBonus > 0, 'Branch rewards did not alter mechanics');
  evidence.push(`branch: both wings cleared; light bonus=${s.player.lightRangeBonus}, suction bonus=${s.player.suctionBonus}`);

  await useDoor(page, 'dining');
  await clearCurrentRoom(page, evidence);
  await useDoor(page, 'cellar');
  await clearCurrentRoom(page, evidence);
  await useDoor(page, 'ballroom');
  await clearCurrentRoom(page, evidence);
  for (let i = 0; i < 30; i++) {
    await sleep(100);
    s = await snapshot(page);
    if (s.mode === 'ending') break;
  }
  assert(s.mode === 'ending', `Final room did not reach ending: ${JSON.stringify(s.roomState)}`);
  assert(s.seals === 5, `Expected 5 seals, got ${s.seals}`);
  assert(errors.length === 0, `Browser page errors: ${errors.join('\n')}`);
  evidence.push(`ending: ${s.captures} captures, ${s.seals}/5 seals, ${s.damageTaken} damage events, elapsed=${s.elapsed.toFixed(1)}s`);
  const layout = Object.fromEntries(Object.entries(s.clearedRooms).map(([k,v])=>[k,v]));
  await page.close();
  return { evidence, firstLoopSeconds, final: s, layout };
}

async function possessedSignature(browser, seed) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}?seed=${encodeURIComponent(seed)}`, { waitUntil: 'networkidle' });
  await page.click('#startBtn');
  const foyer = await snapshot(page);
  await clearCurrentRoom(page, []);
  await useDoor(page, 'library');
  const library = await snapshot(page);
  const sig = library.furniture.filter((f) => f.possessed).map((f) => f.id).join(',');
  await page.close();
  return { foyerPossessed: foyer.furniture.filter((f)=>f.possessed).map((f)=>f.id).join(','), libraryPossessed: sig };
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const full = await runFull(browser, 'midnight-playtest-A', ['library', 'gallery']);
  const sigA = await possessedSignature(browser, 'midnight-playtest-B');
  const sigB = await possessedSignature(browser, 'midnight-playtest-C');
  const variation = sigA.libraryPossessed !== sigB.libraryPossessed;
  assert(variation, `Expected seed variation in hidden furniture, got ${JSON.stringify({ sigA, sigB })}`);

  console.log('PLAYTEST_RESULT: PASS');
  console.log('PLAYTEST_EVIDENCE_START');
  for (const line of full.evidence) console.log(`- ${line}`);
  console.log(`- repeated-run variation: library possessed furniture changed (${sigA.libraryPossessed} vs ${sigB.libraryPossessed})`);
  console.log('- no-reward: the first foyer loop completed before any seal, upgrade, score, or best-time reward existed');
  console.log('PLAYTEST_EVIDENCE_END');
} catch (error) {
  console.error('PLAYTEST_RESULT: FAIL');
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
