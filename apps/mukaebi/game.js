'use strict';
/* 向かい火 — 山火事を止める3分 —
   風向きを読み、火が来る前に防火線と向かい火で回り込む消火判断ゲーム。 */
(() => {

/* =========================================================
   0. 定数
   ========================================================= */
const COLS = 20, ROWS = 30, N = COLS * ROWS;
const RUN_SEC = 180;
const IDX = (x, y) => y*COLS + x;

const T = { GRASS:0, FOREST:1, ROCK:2, WATER:3, ROAD:4, VILLAGE:5, BREAK:6 };
const TP = [
  { flam:true,  ig:1.45, burn:5.0,  hot:0.85 }, // GRASS
  { flam:true,  ig:1.00, burn:14.0, hot:1.30 }, // FOREST
  { flam:false }, { flam:false }, { flam:false },
  { flam:true,  ig:0.85, burn:10.0, hot:1.15 }, // VILLAGE
  { flam:false },
];

let SPREAD = 0.11;        // 基本延焼速度
let ANISO  = 3.2;         // 風下 / 風上の非対称性
let HEAT_DECAY = 0.012;
const SLOPE_K = 14;       // 上り坂で速くなる係数
const WET_SEC = 15;

const WATER_MAX = 3, WATER_RECHARGE = 14, WATER_R = 1.6;
const LINE_BUDGET = 38, LINE_SEC = 0.38, WALK_SEC = 0.12;
const JUMP_WIND = 0.5;   // これ以上の風で、火が細い防火線を飛び越える
const FIRE_COOL = 5;

const DIRS = ['北','北東','東','南東','南','南西','西','北西'];
const DIRVEC = [[0,-1],[0.7071,-0.7071],[1,0],[0.7071,0.7071],[0,1],[-0.7071,0.7071],[-1,0],[-0.7071,-0.7071]];
const VILLAGE_NAMES = ['一ノ谷','二ツ瀬','三ツ木','奥志賀','杉の戸','鹿ノ口','水無瀬','八重原'];

const NB = [];
for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
  if (!dx && !dy) continue;
  const len = Math.hypot(dx,dy);
  NB.push({ dx, dy, ux:dx/len, uy:dy/len, w:1/len });
}

/* =========================================================
   1. 乱数 / ノイズ
   ========================================================= */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
let rnd = mulberry32(1);
const rr = (a,b) => a + rnd()*(b-a);
const ri = (a,b) => Math.floor(rr(a,b+1));
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const lerp = (a,b,t) => a+(b-a)*t;
const smooth = t => t*t*(3-2*t);

function valueNoise(w,h,scale,seedRnd){
  const gw = Math.ceil(w/scale)+2, gh = Math.ceil(h/scale)+2;
  const g = new Float32Array(gw*gh);
  for (let i=0;i<g.length;i++) g[i] = seedRnd();
  const out = new Float32Array(w*h);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){
    const fx = x/scale, fy = y/scale;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = smooth(fx-x0), ty = smooth(fy-y0);
    const a = g[y0*gw+x0], b = g[y0*gw+x0+1], c = g[(y0+1)*gw+x0], d = g[(y0+1)*gw+x0+1];
    out[y*w+x] = lerp(lerp(a,b,tx), lerp(c,d,tx), ty);
  }
  return out;
}

/* =========================================================
   2. ゲーム状態
   ========================================================= */
let G = null;
let runIndex = Number(localStorage.getItem('mukaebi.runs') || 0);
let best = Number(localStorage.getItem('mukaebi.best') || 0);

function makeWindPlan(diff){
  const plan = [];
  let dir = rnd() < 0.5 ? 0 : 4;   // 初回は長辺（南北）方向。以降のシフトで斜めにもなる
  let speed = clamp(0.40 + diff*0.04 + rr(-0.03,0.05), 0.3, 0.6);
  plan.push({ t:0, dir, speed });
  const times = [35, 75, 115, 150];
  for (const t of times){
    const turn = (rnd() < 0.5 ? -1 : 1) * (rnd() < 0.55 ? 1 : 2);
    dir = (dir + turn + 8) % 8;
    speed = clamp(speed + 0.11 + rr(0, 0.08) + diff*0.012, 0.3, 0.96);
    plan.push({ t, dir, speed });
  }
  return plan;
}

function buildMap(seed, diff){
  rnd = mulberry32(seed);
  const terrain = new Uint8Array(N);
  const elev = new Float32Array(N);

  const n1 = valueNoise(COLS, ROWS, 9, rnd);
  const n2 = valueNoise(COLS, ROWS, 4.5, rnd);
  const n3 = valueNoise(COLS, ROWS, 2.2, rnd);
  for (let i=0;i<N;i++) elev[i] = clamp(n1[i]*0.6 + n2[i]*0.28 + n3[i]*0.12, 0, 1);

  // 稜線 / 草地 / 森
  for (let i=0;i<N;i++){
    const e = elev[i];
    terrain[i] = e > 0.78 ? T.ROCK : e < 0.34 ? T.GRASS : T.FOREST;
  }

  // 谷の外縁は岩稜（延焼を閉じ込める）
  for (let x=0;x<COLS;x++){ terrain[IDX(x,0)] = T.ROCK; terrain[IDX(x,ROWS-1)] = T.ROCK; }
  for (let y=0;y<ROWS;y++){ terrain[IDX(0,y)] = T.ROCK; terrain[IDX(COLS-1,y)] = T.ROCK; }

  // 川（上から下へ蛇行）
  let rx = ri(4, COLS-5);
  for (let y=1;y<ROWS-1;y++){
    rx = clamp(rx + ri(-1,1), 2, COLS-3);
    for (let k=0;k<(rnd()<0.3?2:1);k++) terrain[IDX(clamp(rx+k,1,COLS-2), y)] = T.WATER;
  }

  // 浅瀬（火が渡れる場所を2箇所）
  for (let k=0;k<2;k++){
    const fy = ri(4, ROWS-5);
    for (let y=fy; y<fy+2; y++) for (let x=1;x<COLS-1;x++){
      const i = IDX(x,y);
      if (terrain[i] === T.WATER) terrain[i] = T.GRASS;
    }
  }

  // 林道（横断）
  let ry = ri(6, ROWS-7);
  for (let x=1;x<COLS-1;x++){
    if (rnd() < 0.28) ry = clamp(ry + (rnd()<0.5?-1:1), 3, ROWS-4);
    const i = IDX(x,ry);
    if (terrain[i] !== T.WATER) terrain[i] = T.ROAD;
  }

  return { terrain, elev };
}

// 集落を置ける 2x2 の平地を、目標地点の近くから探す
function findVillageSpot(g, tx, ty){
  const cx = clamp(Math.round(tx), 2, COLS-4), cy = clamp(Math.round(ty), 2, ROWS-4);
  for (let r=0; r<=7; r++){
    const cands = [];
    for (let y=cy-r; y<=cy+r; y++) for (let x=cx-r; x<=cx+r; x++){
      if (Math.max(Math.abs(x-cx), Math.abs(y-cy)) !== r) continue;
      if (x<2||y<2||x>COLS-4||y>ROWS-4) continue;
      let ok = true;
      for (let dy=0; dy<2 && ok; dy++) for (let dx=0; dx<2 && ok; dx++){
        const t = g.terrain[IDX(x+dx, y+dy)];
        if (t !== T.FOREST && t !== T.GRASS) ok = false;
      }
      if (!ok) continue;
      let far = true;
      for (const v of g.villages) if (Math.hypot(v.x-(x+1), v.y-(y+1)) < 7) far = false;
      if (far) cands.push([x,y]);
    }
    if (cands.length) return cands[ri(0, cands.length-1)];
  }
  return null;
}

function newRun(){
  const diff = clamp(Math.floor((best - 700)/180), 0, 6);   // 腕前に合わせて風が強くなる
  const seed = (Date.now() ^ (runIndex*2654435761)) >>> 0;
  const map = buildMap(seed, diff);
  const windPlan = makeWindPlan(diff);

  const g = {
    seed, diff,
    terrain: map.terrain, elev: map.elev, villages: [],
    state: new Uint8Array(N), heat: new Float32Array(N), burn: new Float32Array(N),
    wet: new Float32Array(N), origin: new Uint8Array(N), flameSeed: new Float32Array(N),
    burning: [], initialFlam: 0, burnedByFire: 0,
    windPlan, windIdx: 0, wind: { dir: windPlan[0].dir, speed: windPlan[0].speed, vx:0, vy:0, angle:0 },
    windGhost: null,
    t: 0, over: false, contained: false,
    water: WATER_MAX, waterTimer: 0, lineLeft: LINE_BUDGET, fireCool: 0,
    crew: { cx:0, cy:0, fx:0, fy:0, tx:0, ty:0, route:[], step:0, stepT:0, mode:'idle', worked:0, skipped:0 },
    stats: { water:0, line:0, backfire:0, meets:0, embers:0 },
    heli: [], particles: [], embersFx: [], bursts: [], shake: 0,
    meetMark: new Uint8Array(N), skipMarks: [], hintDone: {},
    tool: 'water', drag: null, pointer: null, ended: null,
  };

  applyWind(g, g.windPlan[0]);
  const wx = g.wind.vx, wy = g.wind.vy;

  // 出火点：風上寄りの内陸
  const idealX = COLS/2 - wx*8.5 + rr(-2,2), idealY = ROWS/2 - wy*11.5 + rr(-2,2);
  let start = -1, bestD = 1e9;
  for (let y=3;y<ROWS-3;y++) for (let x=3;x<COLS-3;x++){
    const i = IDX(x,y);
    if (!TP[g.terrain[i]].flam) continue;
    const d = Math.hypot(idealX-x, idealY-y);
    if (d < bestD){ bestD = d; start = i; }
  }
  if (start < 0) start = IDX(COLS>>1, ROWS>>1);
  const sx = start % COLS, sy = (start / COLS) | 0;

  // 集落：出火点の風下へ扇状に3つ
  const names = VILLAGE_NAMES.slice().sort(() => rnd()-0.5);
  const layout = [[14, -5.5], [18.5, 0.5], [15, 5.5]].sort(() => rnd()-0.5);
  for (const [alongBase, perpBase] of layout){
    const along = alongBase + rr(-1.5, 2.5), perp = perpBase + rr(-1.5, 1.5);
    let spot = findVillageSpot(g, sx + wx*along - wy*perp, sy + wy*along + wx*perp);
    if (spot && Math.hypot(spot[0]+1-sx, spot[1]+1-sy) < 11){
      const far = findVillageSpot(g, sx + wx*(along+4) - wy*perp*0.6, sy + wy*(along+4) + wx*perp*0.6);
      if (far && Math.hypot(far[0]+1-sx, far[1]+1-sy) > Math.hypot(spot[0]+1-sx, spot[1]+1-sy)) spot = far;
    }
    if (!spot) continue;
    const cells = [];
    for (let dy=0;dy<2;dy++) for (let dx=0;dx<2;dx++){
      const i = IDX(spot[0]+dx, spot[1]+dy); g.terrain[i] = T.VILLAGE; cells.push(i);
    }
    g.villages.push({ x:spot[0]+1, y:spot[1]+1, cells, lost:false, burning:false, cause:null,
                      name:names[g.villages.length] });
  }

  for (let i=0;i<N;i++){ g.flameSeed[i] = rnd()*Math.PI*2; if (TP[g.terrain[i]].flam) g.initialFlam++; }

  g.crew.cx = clamp(sx - Math.round(wx*3), 1, COLS-2);
  g.crew.cy = clamp(sy - Math.round(wy*3), 1, ROWS-2);
  g.crew.fx = g.crew.cx; g.crew.fy = g.crew.cy;

  // 到着時点ですでに燃え広がっている（風下へ伸びた楕円）。放水だけでは足りない大きさ。
  for (let dy=-4; dy<=4; dy++) for (let dx=-4; dx<=4; dx++){
    const x = sx+dx, y = sy+dy;
    if (x<1||y<1||x>=COLS-1||y>=ROWS-1) continue;
    const along = dx*wx + dy*wy;             // 風下方向の伸び
    const cross = -dx*wy + dy*wx;
    const shifted = along - 0.8;             // 頭を風下側へ
    if ((shifted*shifted)/9 + (cross*cross)/3.2 > 1) continue;
    if (rnd() < 0.14) continue;
    ignite(g, IDX(x,y), 0);
    if (along > 0.5) g.burn[IDX(x,y)] *= 0.55;   // 風下の頭は燃え始めたばかり
  }
  return g;
}

function applyWind(g, w){
  g.wind.dir = w.dir; g.wind.speed = w.speed;
  const v = DIRVEC[w.dir];
  g.wind.vx = v[0]; g.wind.vy = v[1];
  g.wind.angle = Math.atan2(v[1], v[0]);
}

/* =========================================================
   3. シミュレーション
   ========================================================= */
function ignite(g, i, origin){
  if (g.state[i] !== 0) return false;
  const tp = TP[g.terrain[i]];
  if (!tp.flam) return false;
  g.state[i] = 1;
  g.burn[i] = tp.burn * rr(0.85, 1.2);
  g.origin[i] = origin;
  g.heat[i] = 1;
  g.burning.push(i);
  if (g.terrain[i] === T.VILLAGE){
    const v = villageOf(g, i);
    if (v && !v.lost && !v.burning){
      v.burning = true; v.cause = origin;
      toast(origin ? `${v.name}に自分の火が入った！` : `${v.name}が燃えている！`, 'bad', true);
      flash('bad'); g.shake = Math.max(g.shake, 9); sfx('alarm');
      showHint('放水で消し止めれば集落はまだ助かる', true);
    }
  }
  return true;
}

function villageOf(g, i){ for (const v of g.villages) if (v.cells.includes(i)) return v; return null; }

function extinguish(g, i){
  if (g.state[i] !== 1) return;
  g.state[i] = 2; g.burn[i] = 0; g.heat[i] = 0;
  const k = g.burning.indexOf(i); if (k >= 0) g.burning.splice(k,1);
  markDirty();
}

function burnOut(g, i){
  g.state[i] = 2; g.burn[i] = 0; g.heat[i] = 0;
  g.burnedByFire++;
  markDirty();
  if (g.terrain[i] === T.VILLAGE){
    const v = villageOf(g, i);
    if (v && !v.lost){
      v.lost = true; v.burning = false;
      toast(`${v.name} 焼失`, 'bad', true); flash('bad'); g.shake = Math.max(g.shake, 12); sfx('lose');
    }
  }
}

function step(g, dt){
  g.t += dt;

  // --- 風の予報と切り替え ---
  const next = g.windPlan[g.windIdx+1];
  if (next){
    const lead = next.t - g.t;
    if (lead <= 15 && lead > 0){
      g.windGhost = next;
      showForecast(`まもなく${DIRS[(next.dir+4)%8]}の風`, lead);
    } else if (lead <= 0){
      g.windIdx++; g.windGhost = null; hideForecast();
      applyWind(g, next);
      toast(`風向きが変わった → ${DIRS[(next.dir+4)%8]}の風`, 'wind', true);
      sfx('gust');
      for (let k=0;k<26;k++) spawnWindGust(g);
    }
  }

  // --- 延焼 ---
  const wv = g.wind, sp = wv.speed;
  for (let bi = g.burning.length - 1; bi >= 0; bi--){
    const i = g.burning[bi];
    const tp = TP[g.terrain[i]];
    const prog = 1 - g.burn[i] / (tp.burn*1.05);
    const emit = tp.hot * (prog < 0.18 ? Math.max(0.15, prog/0.18) : 1);
    const x = i % COLS, y = (i/COLS)|0;
    for (const nb of NB){
      const nx = x+nb.dx, ny = y+nb.dy;
      if (nx<0||ny<0||nx>=COLS||ny>=ROWS) continue;
      const j = IDX(nx,ny);
      if (g.state[j] !== 0) continue;
      const jp = TP[g.terrain[j]];
      if (!jp.flam) continue;
      const align = nb.ux*wv.vx + nb.uy*wv.vy;
      const windMul = Math.pow(ANISO, align*sp);
      const slope = clamp(1 + (g.elev[j]-g.elev[i])*SLOPE_K, 0.55, 2.2);
      let gain = SPREAD * emit * jp.ig * windMul * slope * nb.w * dt;
      if (g.wet[j] > 0) gain *= 0.04;
      g.heat[j] += gain;
      if (g.heat[j] >= 1){
        ignite(g, j, g.origin[i]);
        checkMeet(g, j);
      }
    }
    // 強い風では、細い防火線・川・焼け跡を1マス飛び越える
    if (sp > JUMP_WIND){
      for (const nb of NB){
        const align = nb.ux*wv.vx + nb.uy*wv.vy;
        if (align < 0.6) continue;
        const mx = x+nb.dx, my = y+nb.dy, jx = x+nb.dx*2, jy = y+nb.dy*2;
        if (jx<0||jy<0||jx>=COLS||jy>=ROWS) continue;
        const mid = IDX(mx,my), j = IDX(jx,jy);
        if (TP[g.terrain[mid]].flam && g.state[mid] === 0) continue;   // 普通に燃え移れる相手は対象外
        if (g.state[j] !== 0 || !TP[g.terrain[j]].flam) continue;
        let gain = SPREAD * emit * TP[g.terrain[j]].ig * (sp - JUMP_WIND) * 2.0 * nb.w * dt;
        if (g.wet[j] > 0) gain *= 0.04;
        g.heat[j] += gain;
        if (g.heat[j] >= 1){
          ignite(g, j, g.origin[i]);
          if (!TP[g.terrain[mid]].flam && g.t - (g.lastJumpToast || -99) > 7){
            g.lastJumpToast = g.t;
            toast('火が防火線を飛び越えた！', 'bad');
            showHint('強風では細い線は越えられる。焼いた帯なら越えられない');
            g.bursts.push({ x:jx+0.5, y:jy+0.5, life:0.7, max:1 });
            sfx('ember');
          }
          checkMeet(g, j);
        }
      }
    }

    g.burn[i] -= dt;
    if (g.burn[i] <= 0){
      burnOut(g, i);
      g.burning.splice(bi,1);
    }
  }

  // --- 熱と水分の減衰 ---
  for (let i=0;i<N;i++){
    if (g.state[i] === 0 && g.heat[i] > 0) g.heat[i] = Math.max(0, g.heat[i] - HEAT_DECAY*dt);
    if (g.wet[i] > 0) g.wet[i] = Math.max(0, g.wet[i] - dt);
  }

  // --- 集落の延焼判定（消し止めれば助かる）---
  for (const v of g.villages){
    if (v.lost || !v.burning) continue;
    if (!v.cells.some(i => g.state[i] === 1)){
      v.burning = false;
      toast(`${v.name} を消し止めた！`, 'good', true); flash('hit'); sfx('save');
    }
  }

  // --- 資源 ---
  if (g.water < WATER_MAX){
    g.waterTimer += dt;
    if (g.waterTimer >= WATER_RECHARGE){ g.waterTimer = 0; g.water++; sfx('refill'); }
  }
  if (g.fireCool > 0) g.fireCool = Math.max(0, g.fireCool - dt);

  updateCrew(g, dt);
  updateEmbers(g, dt);
  updateFx(g, dt);

  // --- 終了判定 ---
  if (!g.over){
    if (g.villages.every(v => v.lost)) endRun(g, 'lost');
    else if (g.burning.length === 0 && !g.embersFx.length && maxHeat(g) < 0.12) endRun(g, 'contained');
    else if (g.t >= RUN_SEC) endRun(g, 'timeup');
  }
}

function maxHeat(g){ let m = 0; for (let i=0;i<N;i++) if (g.state[i]===0 && g.heat[i]>m) m = g.heat[i]; return m; }

function checkMeet(g, i){
  const o = g.origin[i];
  const x = i % COLS, y = (i/COLS)|0;
  for (const nb of NB){
    const nx = x+nb.dx, ny = y+nb.dy;
    if (nx<0||ny<0||nx>=COLS||ny>=ROWS) continue;
    const j = IDX(nx,ny);
    if (g.state[j] === 0) continue;
    if (g.origin[j] === o) continue;
    if (g.meetMark[i] || g.meetMark[j]) return;
    // 別々の火がぶつかった
    for (let yy=Math.max(0,y-3); yy<=Math.min(ROWS-1,y+3); yy++)
      for (let xx=Math.max(0,x-3); xx<=Math.min(COLS-1,x+3); xx++) g.meetMark[IDX(xx,yy)] = 1;
    g.stats.meets++;
    g.bursts.push({ x:x+0.5, y:y+0.5, life:1, max:1 });
    g.bursts.push({ x:x+0.5, y:y+0.5, life:1.35, max:1.35 });
    for (let k=0;k<14;k++) spawnSteam(g, x+rr(-1.2,1.8), y+rr(-1.2,1.8));
    flash('hit'); g.shake = Math.max(g.shake, 8); sfx('meet');
    toast('向かい火 命中！ 火が火を止めた', 'good', true);
    return;
  }
}

/* --- 隊（防火線） --- */
function updateCrew(g, dt){
  const c = g.crew;
  if (c.mode === 'idle') return;

  if (c.mode === 'move'){
    const dx = c.tx - c.fx, dy = c.ty - c.fy;
    const d = Math.hypot(dx, dy);
    const spd = 1/WALK_SEC;
    if (d < 0.08){
      c.fx = c.tx; c.fy = c.ty; c.cx = Math.round(c.fx); c.cy = Math.round(c.fy);
      c.mode = 'work'; c.step = 0; c.stepT = 0; c.worked = 0; c.skipped = 0;
    } else {
      const m = Math.min(d, spd*dt);
      c.fx += dx/d*m; c.fy += dy/d*m;
      c.cx = Math.round(c.fx); c.cy = Math.round(c.fy);
    }
    return;
  }

  c.stepT += dt;
  while (c.stepT >= LINE_SEC){
    c.stepT -= LINE_SEC;
    const cell = c.route[c.step];
    if (!cell){
      c.mode = 'idle'; c.route = []; c.step = 0;
      if (c.skipped > 0) toast(`火のそばの${c.skipped}マスは切れなかった`, 'bad');
      else if (c.worked > 0) toast(`防火線 ${c.worked}マス 完成`, 'good');
      break;
    }
    const [x,y] = cell;
    const i = IDX(x,y);
    c.step++;
    if (g.state[i] === 1 || g.heat[i] > 0.85){
      // 火の中には入れない。そのマスだけ諦めて先へ進む
      c.skipped++;
      g.skipMarks.push({ x:x+0.5, y:y+0.5, life:1.4 });
      if (c.skipped === 1){ sfx('deny'); showHint('火が来たマスは切れない。線は火より先に引く'); }
      continue;
    }
    c.fx = x; c.fy = y; c.cx = x; c.cy = y;
    if (TP[g.terrain[i]].flam && g.state[i] === 0){
      if (g.lineLeft <= 0){ toast('防火線の余力がない', 'bad'); c.mode = 'idle'; c.route = []; c.step = 0; break; }
      g.terrain[i] = T.BREAK; g.heat[i] = 0; g.lineLeft--; g.stats.line++; c.worked++;
      markDirty(); sfx('dig');
      spawnDust(g, x+0.5, y+0.5);
    }
  }
}

function bresenham(x0,y0,x1,y1){
  const pts = [];
  let dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
  let sx = x0<x1?1:-1, sy = y0<y1?1:-1, err = dx-dy;
  let x = x0, y = y0, guard = 0;
  while (guard++ < 400){
    pts.push([x,y]);
    if (x===x1 && y===y1) break;
    const e2 = 2*err;
    if (e2 > -dy){ err -= dy; x += sx; }
    if (e2 < dx){ err += dx; y += sy; }
  }
  return pts;
}

function thicken(path){
  // 斜め移動は直交セルを足して火の斜め抜けを防ぐ
  const out = [];
  for (let k=0;k<path.length;k++){
    const p = path[k];
    out.push(p);
    const q = path[k+1];
    if (q && q[0] !== p[0] && q[1] !== p[1]) out.push([q[0], p[1]]);
  }
  return out;
}

function commitLine(g, path){
  if (path.length < 1) return;
  if (g.lineLeft <= 0){ toast('防火線の余力がない', 'bad'); sfx('deny'); return; }
  const c = g.crew;
  const full = thicken(path);
  // 隊に近い端から着手する
  const dA = Math.hypot(full[0][0]-c.cx, full[0][1]-c.cy);
  const dB = Math.hypot(full[full.length-1][0]-c.cx, full[full.length-1][1]-c.cy);
  const route = dB < dA ? full.slice().reverse() : full;
  c.route = route; c.step = 0; c.stepT = 0;
  c.tx = route[0][0]; c.ty = route[0][1];
  c.worked = 0; c.skipped = 0;
  c.mode = 'move';
  sfx('order');
}

/* --- 飛び火 --- */
function updateEmbers(g, dt){
  for (let k = g.embersFx.length-1; k>=0; k--){
    const e = g.embersFx[k];
    e.life += dt;
    const p = e.life / e.dur;
    if (p >= 1){
      g.embersFx.splice(k,1);
      const i = IDX(e.tx, e.ty);
      if (g.state[i] === 0 && TP[g.terrain[i]].flam && g.wet[i] <= 0){
        ignite(g, i, g.origin[e.src] || 0);
        toast('飛び火！ 風下に新しい火', 'bad');
        showHint('飛び火は小さいうちに放水で消す');
      }
    }
  }
  if (g.wind.speed < 0.62 || !g.burning.length) return;
  g.emberTimer = (g.emberTimer || rr(6,10)) - dt;
  if (g.emberTimer > 0) return;
  g.emberTimer = rr(9, 15) - g.diff*0.5;
  const src = g.burning[ri(0, g.burning.length-1)];
  const sx = src % COLS, sy = (src/COLS)|0;
  const dist = rr(3, 6.5);
  const tx = Math.round(clamp(sx + g.wind.vx*dist + rr(-1.5,1.5), 1, COLS-2));
  const ty = Math.round(clamp(sy + g.wind.vy*dist + rr(-1.5,1.5), 1, ROWS-2));
  const i = IDX(tx,ty);
  if (!TP[g.terrain[i]].flam || g.state[i] !== 0) return;
  g.stats.embers++;
  g.embersFx.push({ sx:sx+0.5, sy:sy+0.5, tx, ty, life:0, dur:1.5, src });
  sfx('ember');
}

/* --- プレイヤー操作 --- */
function dropWater(g, x, y){
  if (g.water <= 0){ toast('水がない。ヘリの帰投待ち', 'bad'); sfx('deny'); return; }
  g.water--; g.stats.water++;
  if (g.water === WATER_MAX-1) g.waterTimer = 0;
  const fromLeft = x < COLS/2;
  g.heli.push({ x: fromLeft ? -3 : COLS+3, y: y - 2, tx:x, ty:y, phase:'in', t:0, dir: fromLeft?1:-1 });
  sfx('heli');
}

function doDrop(g, x, y){
  for (let dy=-2; dy<=2; dy++) for (let dx=-2; dx<=2; dx++){
    const nx = x+dx, ny = y+dy;
    if (nx<0||ny<0||nx>=COLS||ny>=ROWS) continue;
    if (Math.hypot(dx,dy) > WATER_R) continue;
    const i = IDX(nx,ny);
    if (g.state[i] === 1) extinguish(g, i);
    g.heat[i] = 0;
    if (TP[g.terrain[i]].flam) g.wet[i] = WET_SEC;
    for (let k=0;k<3;k++) spawnSteam(g, nx+rnd(), ny+rnd());
  }
  sfx('splash');
  markDirty();
}

function setBackfire(g, x, y){
  const i = IDX(x,y);
  if (g.fireCool > 0){ sfx('deny'); return; }
  if (!TP[g.terrain[i]].flam || g.state[i] !== 0){ toast('そこには火をつけられない', 'bad'); sfx('deny'); return; }
  if (g.wet[i] > 0){ toast('濡れていて火がつかない', 'bad'); sfx('deny'); return; }
  ignite(g, i, 1);
  g.fireCool = FIRE_COOL; g.stats.backfire++;
  sfx('flare');
  showHint('向かい火は風下へ走る。受けの線を越えさせるな');
}

/* =========================================================
   4. 終了 / スコア
   ========================================================= */
function endRun(g, kind){
  g.over = true;
  g.contained = kind === 'contained';
  const saved = g.villages.filter(v => !v.lost).length;
  const burnRatio = g.burnedByFire / Math.max(1, g.initialFlam);
  const remain = Math.max(0, RUN_SEC - g.t);
  let score = Math.round((1-burnRatio)*700) + saved*150;
  if (g.contained) score += 150 + Math.round(remain*1.2);
  if (kind === 'lost') score = Math.round(score*0.5);
  const rank = (score >= 1300 && saved === 3) ? 'S' : score >= 1080 ? 'A'
             : score >= 820 ? 'B' : kind === 'lost' ? 'D' : 'C';
  g.ended = { kind, saved, burnRatio, score, rank, time:g.t };
  runIndex++; localStorage.setItem('mukaebi.runs', String(runIndex));
  if (score > best){ best = score; localStorage.setItem('mukaebi.best', String(best)); g.ended.newBest = true; }
  setTimeout(() => { if (G === g) showResult(g); }, 900);
  sfx(g.contained ? 'win' : 'end');
}

/* =========================================================
   5. 描画
   ========================================================= */
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');
const staticCv = document.createElement('canvas');
const sctx = staticCv.getContext('2d');
const glowCv = document.createElement('canvas');
const gctx = glowCv.getContext('2d');
let CELL = 16, VW = 320, VH = 416, DPR = 1;
let staticDirty = true;
let shadeArr = null, tintArr = null;
let spriteGlow = null, spriteSmoke = null, spriteSteam = null;

function markDirty(){ staticDirty = true; }

function makeSprite(size, stops){
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const grd = x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  for (const s of stops) grd.addColorStop(s[0], s[1]);
  x.fillStyle = grd; x.fillRect(0,0,size,size);
  return c;
}

function buildSprites(){
  spriteGlow = makeSprite(64, [[0,'rgba(255,150,40,0.95)'],[0.45,'rgba(255,90,20,0.45)'],[1,'rgba(255,60,0,0)']]);
  spriteSmoke = makeSprite(64, [[0,'rgba(180,168,158,0.55)'],[1,'rgba(150,140,130,0)']]);
  spriteSteam = makeSprite(64, [[0,'rgba(226,244,255,0.75)'],[1,'rgba(200,230,255,0)']]);
}
buildSprites();

function resize(){
  const wrap = document.getElementById('mapWrap');
  const rect = wrap.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const cw = rect.width/COLS, ch = rect.height/ROWS;
  let cellW = cw, cellH = ch;
  if (ch > cw) cellH = Math.min(ch, cw*1.25); else cellW = Math.min(cw, ch*1.12);
  const dispW = Math.floor(cellW*COLS), dispH = Math.floor(cellH*ROWS);
  CELL = Math.max(9, Math.floor(Math.min(cellW, cellH)));
  VW = CELL*COLS; VH = CELL*ROWS; DPR = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = dispW+'px'; canvas.style.height = dispH+'px';
  canvas.width = Math.round(dispW*DPR); canvas.height = Math.round(dispH*DPR);
  const sx = canvas.width/VW, sy = canvas.height/VH;
  ctx.setTransform(sx,0,0,sy,0,0);
  staticCv.width = canvas.width; staticCv.height = canvas.height;
  sctx.setTransform(sx,0,0,sy,0,0);
  glowCv.width = Math.max(1, Math.round(VW/3)); glowCv.height = Math.max(1, Math.round(VH/3));
  staticDirty = true;
}

function buildShade(g){
  shadeArr = new Float32Array(N); tintArr = new Float32Array(N);
  const r2 = mulberry32(g.seed ^ 0x9e37);
  for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++){
    const i = IDX(x,y);
    const l = g.elev[IDX(Math.max(0,x-1),y)], u = g.elev[IDX(x,Math.max(0,y-1))];
    shadeArr[i] = clamp((g.elev[i]-l)*2.6 + (g.elev[i]-u)*2.0, -0.5, 0.5);
    tintArr[i] = r2();
  }
}

function shadeHex(base, amt){
  const r = clamp(base[0]+amt,0,255)|0, gg = clamp(base[1]+amt,0,255)|0, b = clamp(base[2]+amt,0,255)|0;
  return `rgb(${r},${gg},${b})`;
}

const C_GRASS=[104,116,58], C_FOREST=[38,72,46], C_ROCK=[92,86,78], C_WATER=[32,84,110],
      C_ROAD=[112,95,70], C_BREAK=[104,80,54], C_BURNT=[30,24,21], C_VILL=[150,132,104];

function drawStatic(g){
  sctx.clearRect(0,0,VW,VH);
  for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++){
    const i = IDX(x,y);
    const px = x*CELL, py = y*CELL;
    const burnt = g.state[i] === 2;
    const sh = shadeArr[i]*34 + (tintArr[i]-0.5)*11;
    let base = C_FOREST;
    const tt = g.terrain[i];
    if (burnt) base = C_BURNT;
    else if (tt === T.GRASS) base = C_GRASS;
    else if (tt === T.ROCK) base = C_ROCK;
    else if (tt === T.WATER) base = C_WATER;
    else if (tt === T.ROAD) base = C_ROAD;
    else if (tt === T.BREAK) base = C_BREAK;
    else if (tt === T.VILLAGE) base = C_VILL;
    sctx.fillStyle = shadeHex(base, burnt ? sh*0.4 : sh);
    sctx.fillRect(px, py, CELL+0.6, CELL+0.6);

    if (burnt){
      if (tintArr[i] > 0.72){
        sctx.fillStyle = 'rgba(120,60,30,0.5)';
        sctx.fillRect(px+CELL*0.3, py+CELL*0.3, CELL*0.22, CELL*0.22);
      }
      // 焼け残った幹
      if (tt === T.FOREST && tintArr[i] > 0.45){
        sctx.strokeStyle = 'rgba(16,12,10,0.85)'; sctx.lineWidth = Math.max(1, CELL*0.09);
        sctx.beginPath(); sctx.moveTo(px+CELL*0.5, py+CELL*0.8); sctx.lineTo(px+CELL*0.44, py+CELL*0.3); sctx.stroke();
      }
      continue;
    }
    if (tt === T.FOREST){
      const cx = px + CELL*(0.32 + tintArr[i]*0.36), cy = py + CELL*(0.36 + (1-tintArr[i])*0.26);
      const r = CELL*(0.26 + tintArr[i]*0.1);
      const conifer = g.elev[i] > 0.55;
      sctx.fillStyle = 'rgba(10,22,14,0.5)';
      if (conifer){
        sctx.beginPath();
        sctx.moveTo(cx+r*0.3, cy-r*1.25); sctx.lineTo(cx+r*1.35, cy+r*0.85); sctx.lineTo(cx-r*0.7, cy+r*0.85);
        sctx.closePath(); sctx.fill();
        sctx.fillStyle = shadeHex([44,88,54], sh*1.1);
        sctx.beginPath();
        sctx.moveTo(cx, cy-r*1.35); sctx.lineTo(cx+r, cy+r*0.8); sctx.lineTo(cx-r, cy+r*0.8);
        sctx.closePath(); sctx.fill();
        sctx.fillStyle = 'rgba(150,200,130,0.18)';
        sctx.beginPath();
        sctx.moveTo(cx, cy-r*1.3); sctx.lineTo(cx-r*0.2, cy+r*0.7); sctx.lineTo(cx-r*0.9, cy+r*0.75);
        sctx.closePath(); sctx.fill();
      } else {
        sctx.beginPath(); sctx.arc(cx+r*0.28, cy+r*0.34, r, 0, 6.283); sctx.fill();
        sctx.fillStyle = shadeHex([58,108,62], sh*1.1);
        sctx.beginPath(); sctx.arc(cx, cy, r, 0, 6.283); sctx.fill();
        sctx.fillStyle = 'rgba(150,200,130,0.2)';
        sctx.beginPath(); sctx.arc(cx-r*0.3, cy-r*0.34, r*0.45, 0, 6.283); sctx.fill();
      }
    } else if (tt === T.GRASS){
      sctx.strokeStyle = 'rgba(160,180,90,0.22)'; sctx.lineWidth = 1;
      sctx.beginPath();
      sctx.moveTo(px+CELL*0.3, py+CELL*0.8); sctx.lineTo(px+CELL*0.36, py+CELL*0.5);
      sctx.moveTo(px+CELL*0.62, py+CELL*0.85); sctx.lineTo(px+CELL*0.68, py+CELL*0.55);
      sctx.stroke();
    } else if (tt === T.ROCK){
      sctx.fillStyle = 'rgba(205,198,186,0.13)';
      sctx.beginPath();
      sctx.moveTo(px+CELL*(0.15+tintArr[i]*0.3), py+CELL*0.72);
      sctx.lineTo(px+CELL*(0.42+tintArr[i]*0.24), py+CELL*(0.2+tintArr[i]*0.2));
      sctx.lineTo(px+CELL*(0.82-tintArr[i]*0.16), py+CELL*0.75);
      sctx.closePath(); sctx.fill();
    } else if (tt === T.WATER){
      sctx.strokeStyle = 'rgba(180,225,245,0.3)'; sctx.lineWidth = 1;
      sctx.beginPath(); sctx.moveTo(px+CELL*0.15, py+CELL*(0.4+tintArr[i]*0.2));
      sctx.lineTo(px+CELL*0.85, py+CELL*(0.5+tintArr[i]*0.2)); sctx.stroke();
    } else if (tt === T.BREAK){
      sctx.fillStyle = 'rgba(60,44,30,0.5)';
      sctx.fillRect(px+CELL*0.15, py+CELL*0.35, CELL*0.7, CELL*0.16);
      sctx.fillStyle = 'rgba(190,170,140,0.25)';
      sctx.fillRect(px+CELL*0.2, py+CELL*0.6, CELL*0.5, CELL*0.1);
    }
  }
  // 集落
  for (const v of g.villages) drawVillage(sctx, g, v);
  staticDirty = false;
}

function drawVillage(c, g, v){
  const px = (v.x-1)*CELL, py = (v.y-1)*CELL, w = CELL*2;
  const lost = v.lost;
  const houses = [[0.16,0.2,0.42],[0.55,0.13,0.36],[0.3,0.58,0.46]];
  for (const [hx,hy,hs] of houses){
    const x = px + w*hx, y = py + w*hy, s = w*hs;
    c.fillStyle = lost ? '#241c18' : '#efe4cf';
    c.fillRect(x, y+s*0.42, s, s*0.5);
    c.beginPath();
    c.moveTo(x-s*0.1, y+s*0.45); c.lineTo(x+s*0.5, y+s*0.02); c.lineTo(x+s*1.1, y+s*0.45); c.closePath();
    c.fillStyle = lost ? '#150f0d' : '#c05a35';
    c.fill();
    if (!lost){
      c.fillStyle = 'rgba(255,214,140,0.9)';
      c.fillRect(x+s*0.32, y+s*0.6, s*0.22, s*0.22);
    }
  }
}

function drawFrame(g, now, dt){
  if (!spriteGlow || !shadeArr) return;
  if (staticDirty) drawStatic(g);
  ctx.clearRect(0,0,VW,VH);
  ctx.save();
  if (g.shake > 0.2){
    ctx.translate((Math.random()-0.5)*g.shake, (Math.random()-0.5)*g.shake);
    g.shake *= 0.86;
  }
  ctx.drawImage(staticCv, 0, 0, VW, VH);

  // 濡れ / 予熱
  for (let i=0;i<N;i++){
    const x = (i%COLS)*CELL, y = ((i/COLS)|0)*CELL;
    if (g.wet[i] > 0){
      ctx.fillStyle = `rgba(90,190,230,${0.10 + 0.16*(g.wet[i]/WET_SEC)})`;
      ctx.fillRect(x,y,CELL+0.6,CELL+0.6);
    }
    if (g.state[i] === 0 && g.heat[i] > 0.3){
      const a = (g.heat[i]-0.3)/0.7;
      ctx.fillStyle = `rgba(255,${Math.round(150-90*a)},40,${0.10+0.3*a})`;
      ctx.fillRect(x,y,CELL+0.6,CELL+0.6);
    }
  }

  // 風の流れ
  ctx.strokeStyle = 'rgba(220,230,255,0.13)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const p of g.particles){
    if (p.kind !== 'wind') continue;
    ctx.moveTo(p.x*CELL, p.y*CELL);
    ctx.lineTo((p.x - g.wind.vx*0.9)*CELL, (p.y - g.wind.vy*0.9)*CELL);
  }
  ctx.stroke();

  // 隊の作業予定線
  const c = g.crew;
  const pending = c.mode === 'idle' ? null : c.route.slice(c.step);
  if (pending && pending.length){
    ctx.save();
    ctx.setLineDash([CELL*0.35, CELL*0.3]);
    ctx.strokeStyle = 'rgba(255,225,160,0.75)';
    ctx.lineWidth = Math.max(2, CELL*0.22);
    ctx.beginPath();
    ctx.moveTo(c.fx*CELL+CELL/2, c.fy*CELL+CELL/2);
    for (const p of pending) ctx.lineTo(p[0]*CELL+CELL/2, p[1]*CELL+CELL/2);
    ctx.stroke();
    ctx.restore();
  }
  for (const m of g.skipMarks){
    ctx.save();
    ctx.globalAlpha = clamp(m.life, 0, 1);
    ctx.strokeStyle = '#ff5a44'; ctx.lineWidth = Math.max(2, CELL*0.16);
    const r = CELL*0.3;
    ctx.beginPath();
    ctx.moveTo(m.x*CELL-r, m.y*CELL-r); ctx.lineTo(m.x*CELL+r, m.y*CELL+r);
    ctx.moveTo(m.x*CELL+r, m.y*CELL-r); ctx.lineTo(m.x*CELL-r, m.y*CELL+r);
    ctx.stroke();
    ctx.restore();
  }
  if (g.drag && g.drag.path.length){
    ctx.save();
    ctx.setLineDash([CELL*0.3, CELL*0.25]);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, CELL*0.26);
    ctx.beginPath();
    const p0 = g.drag.path[0];
    ctx.moveTo(p0[0]*CELL+CELL/2, p0[1]*CELL+CELL/2);
    for (const p of g.drag.path) ctx.lineTo(p[0]*CELL+CELL/2, p[1]*CELL+CELL/2);
    ctx.stroke();
    ctx.restore();
  }

  // 火の光（低解像度ブルーム）
  gctx.clearRect(0,0,glowCv.width, glowCv.height);
  const gs = 1/3;
  for (const i of g.burning){
    const x = (i%COLS)*CELL*gs, y = ((i/COLS)|0)*CELL*gs;
    const r = CELL*gs*3.4;
    gctx.drawImage(spriteGlow, x+CELL*gs/2-r/2, y+CELL*gs/2-r/2, r, r);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.85;
  ctx.drawImage(glowCv, 0, 0, VW, VH);
  ctx.restore();

  // 炎
  const lean = g.wind.vx * g.wind.speed, leanY = g.wind.vy * g.wind.speed;
  for (const i of g.burning){
    const x = (i%COLS)*CELL, y = ((i/COLS)|0)*CELL;
    const tp = TP[g.terrain[i]];
    const prog = clamp(1 - g.burn[i]/(tp.burn*1.05), 0, 1);
    const inten = Math.sin(Math.min(1,prog*1.4)*Math.PI*0.85) * (0.6 + tp.hot*0.4);
    const ph = now*0.005 + g.flameSeed[i];
    const h = CELL*(0.9 + 0.5*Math.sin(ph*2.3)) * (0.5+inten);
    const w = CELL*(0.44 + 0.1*Math.sin(ph*3.1));
    const bx = x+CELL/2, by = y+CELL*0.92;
    drawFlame(ctx, bx, by, w, h, lean, leanY, '#ff5f1c', 0.9);
    drawFlame(ctx, bx, by, w*0.6, h*0.62, lean, leanY, '#ffc44f', 0.95);
    drawFlame(ctx, bx, by, w*0.3, h*0.32, lean, leanY, '#fff3c2', 0.9);
  }

  // 飛び火
  for (const e of g.embersFx){
    const p = e.life/e.dur;
    const x = lerp(e.sx, e.tx+0.5, p)*CELL;
    const y = lerp(e.sy, e.ty+0.5, p)*CELL - Math.sin(p*Math.PI)*CELL*2.6;
    ctx.fillStyle = '#ffd06a';
    ctx.beginPath(); ctx.arc(x, y, CELL*0.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,40,0.4)';
    ctx.beginPath(); ctx.arc(x, y, CELL*0.42, 0, 6.283); ctx.fill();
    // 着地予告
    ctx.strokeStyle = `rgba(255,110,60,${0.35+0.45*p})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc((e.tx+0.5)*CELL, (e.ty+0.5)*CELL, CELL*(0.8-0.3*p), 0, 6.283); ctx.stroke();
  }

  // 粒子（煙・蒸気・土煙）
  for (const p of g.particles){
    if (p.kind === 'wind') continue;
    const sp = p.kind === 'steam' ? spriteSteam : spriteSmoke;
    const a = clamp(p.life/p.ttl, 0, 1);
    ctx.globalAlpha = a * p.a;
    const s = p.size*CELL*(1 + (1-a)*1.3);
    ctx.drawImage(sp, p.x*CELL - s/2, p.y*CELL - s/2, s, s);
  }
  ctx.globalAlpha = 1;

  // ヘリ
  for (const h of g.heli){
    const x = h.x*CELL, y = h.y*CELL;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(CELL*0.4, CELL*0.7, CELL*0.7, CELL*0.3, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#e8eef2';
    ctx.beginPath(); ctx.ellipse(0, 0, CELL*0.62, CELL*0.33, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2f80a8';
    ctx.fillRect(-CELL*0.1, -CELL*0.16, CELL*0.36, CELL*0.3);
    ctx.strokeStyle = 'rgba(230,240,250,0.85)'; ctx.lineWidth = 2;
    const rot = (performance.now()*0.05) % 6.283;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(rot)*CELL*0.9, -Math.sin(rot)*CELL*0.3);
    ctx.lineTo(Math.cos(rot)*CELL*0.9, Math.sin(rot)*CELL*0.3);
    ctx.stroke();
    ctx.restore();
  }

  // 命中バースト
  for (const b of g.bursts){
    const life = clamp(b.life / (b.max || 1), 0, 1);
    const p = 1-life;
    ctx.strokeStyle = `rgba(255,255,255,${life*0.95})`;
    ctx.lineWidth = Math.max(3, CELL*0.55*life);
    ctx.beginPath(); ctx.arc(b.x*CELL, b.y*CELL, CELL*(0.6+p*4.2), 0, 6.283); ctx.stroke();
    ctx.fillStyle = `rgba(245,246,250,${life*0.55})`;
    ctx.beginPath(); ctx.arc(b.x*CELL, b.y*CELL, CELL*(0.5+p*2.8), 0, 6.283); ctx.fill();
  }

  // 集落の警戒表示
  for (const v of g.villages){
    if (v.lost) continue;
    let near = 99;
    for (const i of g.burning){
      const d = Math.hypot((i%COLS)+0.5-v.x, ((i/COLS)|0)+0.5-v.y);
      if (d < near) near = d;
    }
    if (near < 7 || v.burning){
      const pulse = 0.5+0.5*Math.sin(now*0.008);
      const danger = v.burning ? 1 : clamp((7-near)/7, 0, 1);
      ctx.strokeStyle = `rgba(255,${v.burning?60:120},60,${0.35+0.5*danger*pulse})`;
      ctx.lineWidth = Math.max(2, CELL*0.18);
      ctx.strokeRect((v.x-1.15)*CELL, (v.y-1.15)*CELL, CELL*2.3, CELL*2.3);
    }
  }

  // 隊
  const crx = c.fx*CELL+CELL/2, cry = c.fy*CELL+CELL/2;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(crx, cry+CELL*0.3, CELL*0.36, CELL*0.16, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = c.mode === 'work' ? '#ffd76b' : '#f2f0ea';
  ctx.beginPath(); ctx.arc(crx, cry, CELL*0.26, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#1c1512';
  ctx.fillRect(crx-CELL*0.16, cry-CELL*0.05, CELL*0.32, CELL*0.1);
  if (c.mode === 'work'){
    ctx.strokeStyle = 'rgba(255,220,140,0.9)'; ctx.lineWidth = 2;
    const sw = Math.sin(now*0.02)*CELL*0.3;
    ctx.beginPath(); ctx.moveTo(crx, cry-CELL*0.1); ctx.lineTo(crx+sw, cry-CELL*0.5); ctx.stroke();
  }

  // 操作プレビュー
  if (g.pointer && !g.over) drawPreview(g, now);

  ctx.restore();
}

function drawFlame(c, bx, by, w, h, lean, leanY, color, alpha){
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(bx-w/2, by);
  c.quadraticCurveTo(bx-w*0.62, by-h*0.55, bx+lean*h*0.55, by-h);
  c.quadraticCurveTo(bx+w*0.62, by-h*0.55, bx+w/2, by);
  c.closePath();
  c.fill();
  c.restore();
}

function drawPreview(g, now){
  const { x, y } = g.pointer;
  if (x<0||y<0||x>=COLS||y>=ROWS) return;
  const px = x*CELL+CELL/2, py = y*CELL+CELL/2;
  const pulse = 0.6+0.4*Math.sin(now*0.01);
  if (g.tool === 'water'){
    ctx.strokeStyle = `rgba(120,215,245,${0.55+0.35*pulse})`;
    ctx.lineWidth = Math.max(2, CELL*0.16);
    ctx.beginPath(); ctx.arc(px, py, CELL*WATER_R, 0, 6.283); ctx.stroke();
    ctx.fillStyle = 'rgba(120,215,245,0.14)';
    ctx.beginPath(); ctx.arc(px, py, CELL*WATER_R, 0, 6.283); ctx.fill();
  } else if (g.tool === 'fire'){
    const ok = g.fireCool <= 0 && TP[g.terrain[IDX(x,y)]].flam && g.state[IDX(x,y)] === 0;
    ctx.strokeStyle = ok ? `rgba(255,170,70,${0.6+0.35*pulse})` : 'rgba(150,150,150,0.5)';
    ctx.lineWidth = Math.max(2, CELL*0.16);
    ctx.beginPath(); ctx.arc(px, py, CELL*0.55, 0, 6.283); ctx.stroke();
    if (ok){
      // 風下に伸びる予告
      ctx.strokeStyle = 'rgba(255,140,50,0.5)';
      ctx.setLineDash([CELL*0.3, CELL*0.25]);
      ctx.beginPath(); ctx.moveTo(px, py);
      ctx.lineTo(px + g.wind.vx*CELL*4.5*g.wind.speed*1.6, py + g.wind.vy*CELL*4.5*g.wind.speed*1.6);
      ctx.stroke(); ctx.setLineDash([]);
    }
  } else {
    ctx.strokeStyle = `rgba(255,235,190,${0.5+0.3*pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x*CELL+1, y*CELL+1, CELL-2, CELL-2);
  }
}

/* --- 粒子 --- */
function spawnSmoke(g, x, y){
  if (g.particles.length > 240) return;
  g.particles.push({ kind:'smoke', x, y, vx: g.wind.vx*g.wind.speed*1.5 + rr(-0.2,0.2),
    vy: g.wind.vy*g.wind.speed*1.5 + rr(-0.2,0.2) - 0.15, life:rr(2.4,4.4), ttl:4.4, size:rr(1.1,2.2), a:rr(0.4,0.75) });
}
function spawnSteam(g, x, y){
  g.particles.push({ kind:'steam', x, y, vx: rr(-0.35,0.35), vy: rr(-0.9,-0.3), life:1.1, ttl:1.1, size:rr(0.9,1.6), a:0.85 });
}
function spawnDust(g, x, y){
  g.particles.push({ kind:'smoke', x, y, vx: rr(-0.3,0.3), vy: rr(-0.5,-0.1), life:0.8, ttl:0.8, size:0.7, a:0.5 });
}
function spawnWindGust(g){
  g.particles.push({ kind:'wind', x: rr(0,COLS), y: rr(0,ROWS), vx: g.wind.vx*6, vy: g.wind.vy*6, life:1.6, ttl:1.6, size:1, a:1 });
}

function updateFx(g, dt){
  // 煙の発生
  if (g.burning.length){
    g.smokeAcc = (g.smokeAcc || 0) + dt * Math.min(46, 4 + g.burning.length*2.2);
    while (g.smokeAcc >= 1){
      g.smokeAcc -= 1;
      const i = g.burning[ri(0, g.burning.length-1)];
      spawnSmoke(g, (i%COLS)+rnd(), ((i/COLS)|0)+rnd());
    }
  }
  // 常時の風表示
  g.windAcc = (g.windAcc || 0) + dt*9;
  while (g.windAcc >= 1){ g.windAcc -= 1; if (g.particles.length < 260) spawnWindGust(g); }

  for (let k=g.particles.length-1;k>=0;k--){
    const p = g.particles[k];
    p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt;
    if (p.kind === 'smoke') { p.vx += g.wind.vx*g.wind.speed*0.5*dt; p.vy += g.wind.vy*g.wind.speed*0.5*dt; }
    if (p.life <= 0 || p.x < -3 || p.y < -3 || p.x > COLS+3 || p.y > ROWS+3) g.particles.splice(k,1);
  }
  for (let k=g.skipMarks.length-1;k>=0;k--){
    g.skipMarks[k].life -= dt*0.8;
    if (g.skipMarks[k].life <= 0) g.skipMarks.splice(k,1);
  }
  for (let k=g.bursts.length-1;k>=0;k--){
    g.bursts[k].life -= dt*1.6;
    if (g.bursts[k].life <= 0) g.bursts.splice(k,1);
  }
  for (let k=g.heli.length-1;k>=0;k--){
    const h = g.heli[k];
    h.t += dt;
    const speed = 22;
    const dx = h.tx - h.x, dy = h.ty - h.y;
    const d = Math.hypot(dx,dy);
    if (h.phase === 'in'){
      if (d < 0.45){
        h.phase = 'out'; doDrop(g, h.tx, h.ty);
      } else {
        h.x += dx/d*speed*dt; h.y += dy/d*speed*dt;
      }
    } else {
      h.x += h.dir*speed*0.8*dt; h.y -= speed*0.15*dt;
      if (h.x < -4 || h.x > COLS+4) g.heli.splice(k,1);
    }
  }
}

/* =========================================================
   6. UI
   ========================================================= */
const $ = id => document.getElementById(id);
const elStart = $('startScreen'), elGame = $('gameScreen'), elResult = $('resultScreen');
const elToasts = $('toasts'), elHint = $('hint'), elFlash = $('flash');
const elForecast = $('forecast'), elForecastText = $('forecastText'),
      elForecastCount = $('forecastCount'), elForecastBar = $('forecastBar');

function screenTo(name){
  for (const s of [elStart, elGame, elResult]) s.classList.remove('active');
  ({ start: elStart, game: elGame, result: elResult })[name].classList.add('active');
}

let toastQueue = [];
function toast(text, kind, big){
  const d = document.createElement('div');
  d.className = 'toast' + (kind ? ' '+kind : '') + (big ? ' big' : '');
  d.textContent = text;
  elToasts.appendChild(d);
  toastQueue.push(d);
  while (toastQueue.length > 3) toastQueue.shift().remove();
  setTimeout(() => { d.style.transition = 'opacity .3s'; d.style.opacity = '0';
    setTimeout(() => { d.remove(); toastQueue = toastQueue.filter(x => x !== d); }, 320); }, big ? 2400 : 1700);
}

let flashTimer = 0;
function flash(kind){
  elFlash.className = 'flash';
  void elFlash.offsetWidth;
  elFlash.className = 'flash ' + (kind || 'hit');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { elFlash.className = 'flash'; }, 520);
}

let hintTimer = 0;
function showHint(text, force){
  if (!G) return;
  if (!force && G.hintDone[text]) return;
  G.hintDone[text] = true;
  elHint.textContent = text;
  elHint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { elHint.hidden = true; }, 6200);
}

function showForecast(text, lead){
  elForecast.hidden = false;
  elForecastText.textContent = text;
  elForecastCount.textContent = String(Math.ceil(lead));
  elForecastBar.style.width = (lead/15*100)+'%';
}
function hideForecast(){ elForecast.hidden = true; }

function updateHud(g){
  const remain = Math.max(0, RUN_SEC - g.t);
  $('timeLabel').textContent = `${Math.floor(remain/60)}:${String(Math.floor(remain%60)).padStart(2,'0')}`;
  const saved = g.villages.filter(v => !v.lost).length;
  const vl = $('villageLabel');
  vl.textContent = `${saved}/3`;
  vl.parentElement.classList.toggle('warn', saved < 3 || g.villages.some(v => v.burning));
  $('burnLabel').textContent = Math.round(g.burnedByFire/Math.max(1,g.initialFlam)*100) + '%';

  const from = DIRS[(g.wind.dir+4)%8];
  $('windLabel').textContent = from + 'の風';
  const sp = g.wind.speed;
  $('windSpeedLabel').textContent = (sp < 0.5 ? '弱い' : sp < 0.68 ? 'やや強い' : sp < 0.85 ? '強い' : '猛烈') + `・火は${DIRS[g.wind.dir]}へ`;
  $('windNeedle').style.transform = `rotate(${g.wind.angle*180/Math.PI + 90}deg) scale(${0.75+sp*0.5})`;
  const ghost = $('windGhost');
  if (g.windGhost){
    ghost.classList.add('show');
    ghost.style.transform = `rotate(${Math.atan2(DIRVEC[g.windGhost.dir][1], DIRVEC[g.windGhost.dir][0])*180/Math.PI + 90}deg)`;
  } else ghost.classList.remove('show');

  $('waterMeta').textContent = String(g.water);
  $('toolWater').dataset.empty = g.water <= 0 ? '1' : '0';
  $('waterCool').style.width = (g.water >= WATER_MAX ? 0 : g.waterTimer/WATER_RECHARGE*100) + '%';
  $('lineMeta').textContent = String(g.lineLeft);
  $('toolLine').dataset.empty = g.lineLeft <= 0 ? '1' : '0';
  $('fireMeta').textContent = g.fireCool > 0 ? Math.ceil(g.fireCool)+'s' : 'OK';
  $('toolFire').dataset.empty = g.fireCool > 0 ? '1' : '0';
  $('fireCool').style.width = (g.fireCool/FIRE_COOL*100) + '%';
}

function setTool(name){
  if (!G) return;
  G.tool = name;
  for (const b of document.querySelectorAll('.tool')) b.dataset.active = b.dataset.tool === name ? '1' : '0';
  sfx('tick');
}

function updateHints(g){
  if (g.t > 1.5 && g.t < 12) showHint('火は風下（コンパスの矢印の向き）へ走る');
  if (g.t > 13 && g.stats.line === 0 && g.stats.water === 0 && g.crew.mode === 'idle')
    showHint('火の進む先をドラッグ → 隊が防火線を切る');
  if (g.t > 12){
    let near = 99;
    for (const v of g.villages){
      if (v.lost) continue;
      for (const i of g.burning) near = Math.min(near, Math.hypot((i%COLS)-v.x, ((i/COLS)|0)-v.y));
    }
    if (near < 9) showHint('集落の風上側をドラッグ → 隊が防火線を切る');
  }
  if (g.stats.line >= 6) showHint('防火線の風上側で向かい火。燃える物を先に消す');
}

/* =========================================================
   7. 入力
   ========================================================= */
function cellFromEvent(e){
  const r = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / (r.width / COLS));
  const y = Math.floor((e.clientY - r.top) / (r.height / ROWS));
  return { x: clamp(x, 0, COLS-1), y: clamp(y, 0, ROWS-1) };
}

canvas.addEventListener('pointerdown', e => {
  if (!G || G.over) return;
  canvas.setPointerCapture(e.pointerId);
  const c = cellFromEvent(e);
  G.pointer = c;
  if (G.tool === 'line') G.drag = { path: [[c.x, c.y]] };
  e.preventDefault();
});

canvas.addEventListener('pointermove', e => {
  if (!G || G.over) return;
  const c = cellFromEvent(e);
  G.pointer = c;
  if (G.drag){
    const last = G.drag.path[G.drag.path.length-1];
    if (last[0] !== c.x || last[1] !== c.y){
      const seg = bresenham(last[0], last[1], c.x, c.y);
      for (let k=1;k<seg.length;k++){
        if (G.drag.path.length >= G.lineLeft) break;
        G.drag.path.push(seg[k]);
      }
    }
  }
  e.preventDefault();
});

function endPointer(e){
  if (!G) return;
  if (G.over){ G.drag = null; return; }
  const c = cellFromEvent(e);
  if (G.tool === 'line'){
    if (G.drag && G.drag.path.length){
      if (G.drag.path.length === 1) toast('ドラッグして線の長さを決める', 'bad');
      else commitLine(G, G.drag.path);
    }
    G.drag = null;
  } else if (G.tool === 'water'){
    dropWater(G, c.x, c.y);
  } else if (G.tool === 'fire'){
    setBackfire(G, c.x, c.y);
  }
  if (e.pointerType === 'touch') G.pointer = null;
}
canvas.addEventListener('pointerup', e => { endPointer(e); e.preventDefault(); });
canvas.addEventListener('pointercancel', () => { if (G) { G.drag = null; G.pointer = null; } });
canvas.addEventListener('pointerleave', () => { if (G) G.pointer = null; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

for (const b of document.querySelectorAll('.tool')){
  b.addEventListener('click', () => setTool(b.dataset.tool));
}
window.addEventListener('keydown', e => {
  if (e.key === '1') setTool('water');
  if (e.key === '2') setTool('line');
  if (e.key === '3') setTool('fire');
});

/* =========================================================
   8. 音
   ========================================================= */
let AC = null, master = null, fireGain = null, muted = localStorage.getItem('mukaebi.mute') === '1';
function initAudio(){
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(AC.destination);
    const buf = AC.createBuffer(1, AC.sampleRate*2, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * (0.6 + 0.4*Math.sin(i*0.0009));
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 780;
    fireGain = AC.createGain(); fireGain.gain.value = 0;
    src.connect(lp); lp.connect(fireGain); fireGain.connect(master); src.start();
  } catch { AC = null; }
}
function tone(freq, dur, type, vol, to){
  if (!AC || muted) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, AC.currentTime);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20,to), AC.currentTime+dur);
  g.gain.setValueAtTime(0.0001, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(vol, AC.currentTime+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+dur);
  o.connect(g); g.connect(master); o.start(); o.stop(AC.currentTime+dur+0.02);
}
function noise(dur, freq, q, vol, to){
  if (!AC || muted) return;
  const len = Math.max(1, Math.floor(AC.sampleRate*dur));
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i=0;i<len;i++) d[i] = (Math.random()*2-1)*(1-i/len);
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, AC.currentTime);
  f.Q.value = q || 1;
  if (to) f.frequency.exponentialRampToValueAtTime(Math.max(40,to), AC.currentTime+dur);
  const g = AC.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master); src.start();
}
function sfx(name){
  if (!AC || muted) return;
  switch(name){
    case 'splash': noise(0.5, 1800, 0.8, 0.5, 260); tone(420, 0.25, 'sine', 0.12, 180); break;
    case 'heli': noise(0.35, 240, 2.5, 0.25); break;
    case 'flare': noise(0.4, 500, 1.2, 0.35, 2400); tone(150, 0.3, 'sawtooth', 0.14, 60); break;
    case 'dig': tone(220, 0.07, 'triangle', 0.1); noise(0.08, 900, 2, 0.14); break;
    case 'meet': tone(880, 0.3, 'sine', 0.24, 1320); tone(1320, 0.45, 'sine', 0.16); noise(0.5, 1200, 0.6, 0.3, 300); break;
    case 'gust': noise(1.3, 300, 0.5, 0.34, 1400); break;
    case 'alarm': tone(680, 0.18, 'square', 0.14, 520); setTimeout(()=>tone(680,0.18,'square',0.14,520), 220); break;
    case 'lose': tone(180, 0.9, 'sawtooth', 0.22, 70); break;
    case 'save': [660,880,1180].forEach((f,k)=>setTimeout(()=>tone(f,0.22,'sine',0.18),k*80)); break;
    case 'win': [523,659,784,1046].forEach((f,k)=>setTimeout(()=>tone(f,0.4,'sine',0.2),k*110)); break;
    case 'end': tone(220, 0.7, 'sine', 0.16, 140); break;
    case 'deny': tone(120, 0.1, 'square', 0.13); break;
    case 'refill': tone(1200, 0.13, 'sine', 0.12, 1600); break;
    case 'ember': noise(0.35, 2600, 1.5, 0.24, 1400); break;
    case 'order': tone(520, 0.1, 'triangle', 0.12); setTimeout(()=>tone(780,0.12,'triangle',0.12), 90); break;
    case 'tick': tone(440, 0.05, 'square', 0.06); break;
  }
}
$('muteBtn').addEventListener('click', () => {
  muted = !muted;
  localStorage.setItem('mukaebi.mute', muted ? '1' : '0');
  $('muteBtn').dataset.off = muted ? '1' : '0';
  if (master) master.gain.value = muted ? 0 : 0.9;
});
$('muteBtn').dataset.off = muted ? '1' : '0';

/* =========================================================
   9. 結果
   ========================================================= */
function showResult(g){
  const r = g.ended;
  const title = $('resTitle');
  title.className = r.kind === 'contained' ? 'win' : r.kind === 'lost' ? 'lose' : '';
  title.textContent = r.kind === 'contained' ? '鎮火' : r.kind === 'lost' ? '全集落 焼失' : '日没 — 延焼中';
  const mm = Math.floor(r.time/60), ss = Math.floor(r.time%60);
  $('resEyebrow').textContent = `出動 ${runIndex}件目`;
  $('resSub').textContent = r.kind === 'contained'
    ? `${mm}:${String(ss).padStart(2,'0')} で火を止めた`
    : r.kind === 'lost' ? '守る集落がなくなった' : `${g.burning.length}マスが燃えたまま夜になった`;
  $('resVillage').textContent = `${r.saved} / 3`;
  $('resBurn').textContent = Math.round(r.burnRatio*100) + '%';
  $('resMeet').textContent = `${g.stats.meets} 回`;
  $('resScore').textContent = String(r.score);
  const rk = $('resRank'); rk.textContent = r.rank; rk.dataset.rank = r.rank;
  $('resBest').textContent = r.newBest ? '自己ベスト更新' : `BEST ${best}`;

  const lost = g.villages.filter(v => v.lost);
  const parts = [];
  if (lost.length){
    const byPlayer = lost.filter(v => v.cause === 1);
    if (byPlayer.length) parts.push(`<p class="cause">${byPlayer.map(v=>v.name).join('・')}を焼いたのは<b>あなたの向かい火</b>。放つ前に風下側へ防火線か川で受けを作る。</p>`);
    const byFire = lost.filter(v => v.cause !== 1);
    if (byFire.length) parts.push(`<p class="cause">${byFire.map(v=>v.name).join('・')}は<b>本隊の直撃</b>。予報が出た時点で風下の集落から線を引く。</p>`);
  } else {
    parts.push('<p>集落は<b>全て無事</b>。次は森の焼失を減らせる。</p>');
  }
  if (g.stats.meets > 0) parts.push(`<p>向かい火が本隊とぶつかって止めた回数 <b>${g.stats.meets}</b>。焼く面積を絞るほどスコアは伸びる。</p>`);
  else if (g.stats.backfire > 0) parts.push('<p>向かい火は本隊とぶつからなかった。<b>火の帯が届く位置</b>（本隊の3〜6マス手前）で放つ。</p>');
  else if (r.burnRatio > 0.33) parts.push('<p>向かい火を使わずに済ませた分、焼失が広がった。<b>先に焼いて帯を作る</b>と、火が届く範囲そのものを削れる。</p>');
  else parts.push('<p>向かい火なしで抑え込んだ。<b>もっと手前で止める</b>と焼失はさらに減らせる。</p>');
  parts.push(`<p>放水 <b>${g.stats.water}</b> / 防火線 <b>${g.stats.line}</b>マス / 向かい火 <b>${g.stats.backfire}</b>回 / 飛び火 <b>${g.stats.embers}</b>回</p>`);
  $('resReview').innerHTML = parts.join('');
  screenTo('result');
}

/* =========================================================
   10. ループ
   ========================================================= */
let last = 0, acc = 0, hudAcc = 0, running = false;
function loop(now){
  requestAnimationFrame(loop);
  if (!G) return;
  const dt = Math.min(0.06, (now - last)/1000 || 0);
  last = now;
  if (running && !G.over){
    acc += dt;
    let guard = 0;
    while (acc >= 1/30 && guard++ < 4){ step(G, 1/30); acc -= 1/30; }
    updateHints(G);
    hudAcc += dt;
    if (hudAcc >= 0.1){ hudAcc = 0; updateHud(G); }
  } else if (G.over){
    updateFx(G, dt);
  }
  if (fireGain && AC){
    const target = muted ? 0 : Math.min(0.3, G.burning.length*0.006);
    fireGain.gain.value += (target - fireGain.gain.value) * Math.min(1, dt*3);
  }
  drawFrame(G, now, dt);
}

function startRun(){
  initAudio();
  if (AC && AC.state === 'suspended') AC.resume();
  G = newRun();
  buildShade(G);
  staticDirty = true;
  running = true; acc = 0;
  hideForecast();
  elHint.hidden = true;
  elToasts.innerHTML = ''; toastQueue = [];
  setTool('water');
  screenTo('game');
  requestAnimationFrame(() => { resize(); updateHud(G); });
}

$('startBtn').addEventListener('click', startRun);
$('againBtn').addEventListener('click', startRun);
$('titleBtn').addEventListener('click', () => { running = false; refreshBest(); screenTo('start'); });
$('howToBtn').addEventListener('click', () => { $('howto').hidden = false; });
$('closeHowto').addEventListener('click', () => { $('howto').hidden = true; });

function refreshBest(){
  $('bestRecord').textContent = best > 0 ? `BEST ${best} ／ 出動 ${runIndex}回` : '';
}

window.addEventListener('resize', () => { resize(); });
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
document.addEventListener('visibilitychange', () => { if (document.hidden) last = performance.now(); });

refreshBest();
resize();
requestAnimationFrame(t => { last = t; loop(t); });

// 自動プレイテスト用のデバッグフック（通常プレイでは使わない）
window.__mukaebi = { get g(){ return G; }, startRun, setTool, dropWater, setBackfire, commitLine, step, doDrop, IDX, COLS, ROWS, T, TP,
  pause(){ running = false; }, resume(){ last = performance.now(); running = true; },
  tune(o){ if (o.spread !== undefined) SPREAD = o.spread; if (o.aniso !== undefined) ANISO = o.aniso; if (o.decay !== undefined) HEAT_DECAY = o.decay; } };

})();
