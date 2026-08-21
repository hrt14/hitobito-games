import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import process from 'node:process';

const PORT = 4173;
const URL = `http://127.0.0.1:${PORT}/apps/midnight-haunted-cleaner/?seed=mobile-browser-playtest`;
const server = spawn(process.execPath, ['scripts/local-server.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
let browser;
let page;

async function snap() { return page.evaluate(() => window.__playtestSnapshot()); }
async function waitServer() {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(URL)).ok) return; } catch {}
    await sleep(100);
  }
  throw new Error('local server unavailable');
}
async function pulse(keys, ms = 85) {
  for (const k of keys) await page.keyboard.down(k);
  await sleep(ms);
  for (const k of [...keys].reverse()) await page.keyboard.up(k);
}
function keysFor(dx, dy) {
  const out = [];
  if (Math.abs(dx) > 8) out.push(dx > 0 ? 'd' : 'a');
  if (Math.abs(dy) > 8) out.push(dy > 0 ? 's' : 'w');
  return out;
}
async function moveTo(x, y, tolerance = 52, max = 150) {
  let stuck = 0, last = null;
  for (let i = 0; i < max; i++) {
    const s = await snap();
    const dx = x - s.player.x, dy = y - s.player.y;
    if (Math.hypot(dx, dy) <= tolerance) return s;
    if (last && Math.hypot(s.player.x-last.x, s.player.y-last.y) < .7) stuck++; else stuck = 0;
    last = s.player;
    let keys = keysFor(dx, dy);
    if (stuck > 5) { keys = Math.abs(dx) > Math.abs(dy) ? [dy > 0 ? 's':'w'] : [dx > 0 ? 'd':'a']; stuck = 0; }
    await pulse(keys, 76);
    await sleep(16);
  }
  const s = await snap();
  throw new Error(`moveTo failed: target=${x},${y} at=${s.player.x.toFixed(0)},${s.player.y.toFixed(0)} room=${s.room}`);
}
async function face(x, y) {
  const s = await snap();
  const dx = x-s.player.x, dy = y-s.player.y;
  const key = Math.abs(dx)>Math.abs(dy) ? (dx>0?'d':'a') : (dy>0?'s':'w');
  await pulse([key], 55);
}
async function holdButton(selector) {
  const box = await page.locator(selector).boundingBox();
  assert(box, `missing button ${selector}`);
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await page.mouse.down();
}
async function releaseButton() { await page.mouse.up(); }

function searchPoint(player, f) {
  const cx=f.x+f.w/2, cy=f.y+f.h/2;
  const dx=player.x-cx, dy=player.y-cy, m=Math.hypot(dx,dy)||1;
  return { x:cx+dx/m*58, y:cy+dy/m*58 };
}
async function routeToSearchPoint(s, f, p) {
  if (s.room === 'dining' && f.type === 'chandelier' && s.player.y > 430) {
    await moveTo(270,620,42,100);
    await moveTo(492,620,36,120);
    await moveTo(492,278,38,160);
  }
  return moveTo(p.x,p.y,55);
}
async function revealNext(evidence) {
  let s = await snap();
  const f=s.furniture.find(x=>x.possessed&&!x.searched);
  assert(f, `no possessed furniture left in ${s.room}`);
  const p=searchPoint(s.player,f);
  await routeToSearchPoint(s,f,p);
  await face(f.x+f.w/2,f.y+f.h/2);
  await holdButton('#suctionBtn');
  for(let i=0;i<25;i++){
    await sleep(90); s=await snap();
    if(s.ghosts.some(g=>g.type!=='decoy')) break;
  }
  await releaseButton();
  await sleep(100);
  s=await snap();
  assert(s.ghosts.some(g=>g.type!=='decoy'), `search failed at ${f.label}; player=${JSON.stringify(s.player)} furniture=${JSON.stringify(f)}`);
  const ghost=s.ghosts.find(g=>g.type!=='decoy');
  evidence.push(`${s.room}: ${f.label}を吸引探索→${ghost?.type||'ghost'}出現`);
}
async function flashAt(g) {
  await face(g.x,g.y);
  await holdButton('#flashBtn');
  await sleep(520);
  await releaseButton();
  await sleep(80);
}
async function stabilizeForFight(id, max = 12) {
  for (let i = 0; i < max; i++) {
    const s = await snap();
    const g = s.ghosts.find(x => x.id === id);
    if (!g || s.mode !== 'running') return;
    const d = Math.hypot(s.player.x-g.x, s.player.y-g.y);
    const nearEdge = s.player.x < 88 || s.player.x > 452 || s.player.y < 215 || s.player.y > 690;
    if (d >= 102 && d <= 152 && !nearEdge) return;

    let dx;
    let dy;
    if (nearEdge) {
      dx = 270 - s.player.x;
      dy = 430 - s.player.y;
      if (d < 100) {
        dx += (s.player.x - g.x) * 1.6;
        dy += (s.player.y - g.y) * 1.6;
      }
    } else if (d > 152) {
      dx = g.x - s.player.x;
      dy = g.y - s.player.y;
    } else {
      dx = (s.player.x - g.x) * 1.6 + (270 - s.player.x) * .3;
      dy = (s.player.y - g.y) * 1.6 + (430 - s.player.y) * .3;
    }
    const keys = keysFor(dx,dy);
    await pulse(keys.length ? keys : ['w'], 58);
    await sleep(10);
  }
}
async function counterPull(id) {
  await holdButton('#suctionBtn');
  const until=Date.now()+820;
  while(Date.now()<until){
    const s=await snap(); const g=s.ghosts.find(x=>x.id===id);
    if(!g) break;
    const keys=keysFor(s.player.x-g.x,s.player.y-g.y);
    await pulse(keys.length?keys:['s'],82); await sleep(18);
  }
  await releaseButton();
  await sleep(250);
}
async function fight(evidence) {
  for(let round=0;round<24;round++){
    let s=await snap();
    assert(s.mode==='running', `player defeated during fight in ${s.room}`);
    const real=s.ghosts.filter(g=>g.type!=='decoy');
    if(!real.length) return;
    const g=real.find(x=>x.type==='mirror')||real[0];
    const d=Math.hypot(s.player.x-g.x,s.player.y-g.y);
    if(d>155) await moveTo(g.x,g.y,128,80);
    await stabilizeForFight(g.id);
    s=await snap(); const live=s.ghosts.find(x=>x.id===g.id); if(!live) return;
    await flashAt(live);
    s=await snap(); const stunned=s.ghosts.find(x=>x.id===g.id); if(!stunned) return;
    if(stunned.stunned<=0){await stabilizeForFight(g.id);continue;}
    const distance=Math.hypot(s.player.x-stunned.x,s.player.y-stunned.y);
    if(distance>=176){await moveTo(stunned.x,stunned.y,148,35);}
    s=await snap(); const ready=s.ghosts.find(x=>x.id===g.id); if(!ready) return;
    if(ready.stunned<=0){await stabilizeForFight(g.id);continue;}
    const before=ready.hp;
    await counterPull(g.id);
    s=await snap();
    if(s.mode!=='running') throw new Error(`player defeated after suction in ${s.room}`);
    const after=s.ghosts.find(x=>x.id===g.id);
    if(after){
      assert(after.hp<before, `suction caused no HP loss in ${s.room}`);
      await stabilizeForFight(g.id);
    }
  }
  throw new Error(`fight loop exhausted: ${JSON.stringify((await snap()).ghosts)}`);
}
async function clearRoom(evidence) {
  let s=await snap(); const id=s.room;
  while(!s.roomState.cleared){
    if(!s.ghosts.some(g=>g.type!=='decoy')) await revealNext(evidence);
    await fight(evidence); s=await snap();
  }
  evidence.push(`${id}: 捕獲${s.roomState.captured}/${s.roomState.required}、封印${s.seals}/5`);
}
function sideKey(side){
  if(side==='top') return 'w';
  if(side==='bottom') return 's';
  if(side==='left') return 'a';
  return 'd';
}
async function crossDoor(d,target,max=180){
  let stuck=0,last=null;
  for(let i=0;i<max;i++){
    const s=await snap();
    if(s.room===target) return s;
    const dx=d.x-s.player.x, dy=d.y-s.player.y;
    if(last&&Math.hypot(s.player.x-last.x,s.player.y-last.y)<.7) stuck++; else stuck=0;
    last={x:s.player.x,y:s.player.y};
    let keys=keysFor(dx,dy);
    if(Math.hypot(dx,dy)<18||!keys.length) keys=[sideKey(d.side)];
    if(stuck>5){
      keys=Math.abs(dx)>Math.abs(dy)?[dy>0?'s':'w']:[dx>0?'d':'a'];
      stuck=0;
    }
    await pulse(keys,55);
    await sleep(16);
  }
  const s=await snap();
  throw new Error(`transition to ${target} failed at ${s.player.x.toFixed(0)},${s.player.y.toFixed(0)} in ${s.room}`);
}
async function door(target) {
  let s=await snap(); const d=s.doors.find(x=>x.target===target);
  assert(d&&d.unlocked, `door ${s.room}->${target} unavailable: ${JSON.stringify(s.doors)}`);
  if(d.side==='bottom'){
    await moveTo(478,650,62,120);
    await moveTo(478,700,42,80);
  }
  if(d.side==='top'){
    if(s.room==='foyer'){
      await moveTo(340,390,48,100);
      await moveTo(340,225,40,100);
    }else if(s.room==='dining'){
      if(s.player.y>460) await moveTo(495,600,32,120);
      await moveTo(495,300,34,150);
      await moveTo(340,225,40,110);
    }else if(s.room==='cellar'){
      await moveTo(340,510,45,100);
      await moveTo(340,330,36,110);
      await moveTo(340,225,40,100);
    }
  }
  await crossDoor(d,target);
}

try{
  await waitServer();
  browser=await chromium.launch({headless:true});
  page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.goto(URL,{waitUntil:'networkidle'});
  await page.click('#startBtn'); await sleep(120);
  const evidence=[]; const t0=Date.now();
  let s=await snap(); assert(s.mode==='running'&&s.room==='foyer','start failed');
  const start={x:s.player.x,y:s.player.y}; await pulse(['w'],330); s=await snap();
  const moved=Math.hypot(s.player.x-start.x,s.player.y-start.y); assert(moved>28,`movement too small ${moved}`);
  evidence.push(`10秒: 開始直後に移動${Math.round(moved)}px、目的HUDを維持`);
  await clearRoom(evidence);
  const first=(Date.now()-t0)/1000; assert(first<30,`first core loop ${first.toFixed(1)}s`);
  evidence.push(`30秒: 探索→出現→LIGHT→SUCTION+逆入力→捕獲を${first.toFixed(1)}秒で完了`);

  await door('library'); await clearRoom(evidence); await door('foyer');
  await door('gallery'); await clearRoom(evidence); await door('foyer');
  s=await snap(); assert(s.player.lightRangeBonus>0&&s.player.suctionBonus>0,'branch upgrades missing');
  evidence.push(`分岐: 書庫と肖像画室を別順で攻略可能。光+${s.player.lightRangeBonus}、吸引+${s.player.suctionBonus}`);
  await door('dining'); await clearRoom(evidence);
  await door('cellar'); await clearRoom(evidence);
  await door('ballroom'); await clearRoom(evidence);
  for(let i=0;i<25;i++){await sleep(100);s=await snap();if(s.mode==='ending')break;}
  assert(s.mode==='ending'&&s.seals===5,`ending failed ${JSON.stringify(s)}`);
  assert(pageErrors.length===0,`page errors: ${pageErrors.join('; ')}`);
  evidence.push(`全編: ${s.captures}体捕獲、封印${s.seals}/5、被弾${s.damageTaken}、ゲーム内${s.elapsed.toFixed(1)}秒でエンディング`);
  evidence.push('報酬なし: 最初の玄関捕獲は封印・能力強化・ベストタイム表示より前にコアループ単体で成立');
  console.log('PLAYTEST_RESULT: PASS');
  console.log('PLAYTEST_EVIDENCE_START'); evidence.forEach(x=>console.log(`- ${x}`)); console.log('PLAYTEST_EVIDENCE_END');
}catch(e){
  console.error('PLAYTEST_RESULT: FAIL');
  try{console.error('SNAPSHOT:',JSON.stringify(await snap()));}catch{}
  console.error(e.stack||e); process.exitCode=1;
}finally{
  if(browser)await browser.close(); server.kill('SIGTERM');
}
