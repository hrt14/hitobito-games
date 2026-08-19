const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d', { alpha: false });

const ui = {
  intro: document.querySelector('#intro'),
  ending: document.querySelector('#ending'),
  startBtn: document.querySelector('#startBtn'),
  againBtn: document.querySelector('#againBtn'),
  motionBtn: document.querySelector('#motionBtn'),
  lifeTime: document.querySelector('#lifeTime'),
  moment: document.querySelector('#moment'),
  momentMark: document.querySelector('#momentMark'),
  momentTitle: document.querySelector('#momentTitle'),
  momentText: document.querySelector('#momentText'),
  endingReason: document.querySelector('#endingReason'),
  resultTime: document.querySelector('#resultTime'),
  resultMoments: document.querySelector('#resultMoments'),
  resultRipples: document.querySelector('#resultRipples'),
  legacyText: document.querySelector('#legacyText'),
};

const STORAGE_KEY = 'hitobito.tsuyu.v1';
const memory = loadMemory();

const state = {
  mode: 'intro',
  dpr: 1,
  width: 0,
  height: 0,
  cx: 0,
  cy: 0,
  leafRx: 0,
  leafRy: 0,
  leafRotation: 0,
  leafWobble: 0,
  droplet: { x: 0, y: 0, vx: 0, vy: 0, r: 15 },
  tilt: { x: 0, y: 0, targetX: 0, targetY: 0 },
  pointer: { active: false, startX: 0, startY: 0, x: 0, y: 0 },
  motionEnabled: false,
  startedAt: 0,
  endedAt: 0,
  elapsed: 0,
  maxLife: 54,
  evaporation: 0,
  moments: [],
  met: new Set(),
  particles: [],
  ripples: [],
  petals: [],
  dust: [],
  lastFrame: performance.now(),
  momentTimer: 0,
  generation: memory.generations + 1,
  fallen: false,
  touched: false,
  ambientPhase: Math.random() * 10,
};

const MOMENTS = [
  { id:'sun', nx:-0.42, ny:-0.38, radius:.12, mark:'☀', title:'朝日を映した', text:'光は、一滴の中にも入る。' },
  { id:'pollen', nx:.10, ny:-.52, radius:.10, mark:'✣', title:'花粉に触れた', text:'ほんの少し、黄色い春を連れていく。' },
  { id:'friend', nx:.36, ny:-.06, radius:.13, mark:'●', title:'別の露と出会った', text:'一瞬だけ、ふたつがひとつになる。' },
  { id:'dragonfly', nx:-.18, ny:.25, radius:.12, mark:'⌁', title:'羽の影がよぎった', text:'上を通った何かも、この朝の一部。' },
  { id:'petal', nx:.48, ny:.32, radius:.12, mark:'❀', title:'蓮の花びらに触れた', text:'端まで来たから、見えたもの。' },
  { id:'sky', nx:-.52, ny:.06, radius:.11, mark:'◯', title:'空をまるごと映した', text:'小さいほど、世界を丸く抱えられる。' },
];

function loadMemory() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      generations: Number(raw.generations) || 0,
      ripples: Number(raw.ripples) || 0,
      totalMoments: Number(raw.totalMoments) || 0,
      bestMoments: Number(raw.bestMoments) || 0,
    };
  } catch {
    return { generations:0, ripples:0, totalMoments:0, bestMoments:0 };
  }
}

function saveMemory(roundMoments) {
  memory.generations += 1;
  memory.ripples += 1;
  memory.totalMoments += roundMoments;
  memory.bestMoments = Math.max(memory.bestMoments, roundMoments);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch {}
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.round(state.width * state.dpr);
  canvas.height = Math.round(state.height * state.dpr);
  ctx.setTransform(state.dpr,0,0,state.dpr,0,0);

  const portrait = state.height >= state.width;
  state.cx = state.width * (portrait ? .52 : .57);
  state.cy = state.height * (portrait ? .42 : .5);
  state.leafRx = Math.min(state.width * (portrait ? .56 : .39), 430);
  state.leafRy = Math.min(state.height * (portrait ? .33 : .43), 330);
  state.droplet.r = Math.max(11, Math.min(18, state.width * .038));

  if (state.mode === 'intro') resetDroplet(.03, -.08);
}

function resetDroplet(nx = 0, ny = 0) {
  state.droplet.x = state.cx + nx * state.leafRx;
  state.droplet.y = state.cy + ny * state.leafRy;
  state.droplet.vx = 0;
  state.droplet.vy = 0;
}

function nxToX(nx){ return state.cx + nx * state.leafRx; }
function nyToY(ny){ return state.cy + ny * state.leafRy; }

function startGame() {
  if (state.mode === 'playing') return;
  state.mode = 'playing';
  state.startedAt = performance.now();
  state.elapsed = 0;
  state.evaporation = 0;
  state.met.clear();
  state.moments = [];
  state.fallen = false;
  state.ripples.length = 0;
  state.particles.length = 0;
  state.tilt.x = state.tilt.y = state.tilt.targetX = state.tilt.targetY = 0;
  resetDroplet(0, -.04);
  ui.lifeTime.textContent = '0.0';
  ui.intro.classList.remove('is-visible');
  ui.ending.classList.remove('is-visible');
  document.body.classList.add('playing');
  document.body.classList.remove('touched');
  playTone(620, .08, .03);
  setTimeout(() => {
    if (state.mode === 'playing' && supportsMotionPermission()) {
      ui.motionBtn.hidden = false;
    }
  }, 900);
}

function endGame(reason) {
  if (state.mode !== 'playing') return;
  state.mode = 'ending';
  state.endedAt = performance.now();
  state.fallen = reason === 'fall';
  document.body.classList.remove('playing');
  ui.motionBtn.hidden = true;

  const finalTime = Math.max(.1, state.elapsed);
  const roundMoments = state.met.size;
  saveMemory(roundMoments);

  ui.endingReason.textContent = reason === 'fall'
    ? 'THE DROP BECAME A RIPPLE'
    : 'THE DROP RETURNED TO THE AIR';
  ui.resultTime.textContent = finalTime.toFixed(1);
  ui.resultMoments.textContent = String(roundMoments);
  ui.resultRipples.textContent = String(memory.ripples);
  ui.legacyText.textContent = memory.generations <= 1
    ? 'あなたの波紋で、次の葉が少し揺れる。'
    : `${memory.generations}滴の朝が、この池に残っている。`;

  if (reason === 'fall') {
    spawnSplash(state.droplet.x, state.droplet.y);
    state.ripples.push({ x: state.droplet.x, y: state.droplet.y, age: 0 });
    playTone(190, .32, .06);
    haptic([18, 34, 12]);
  } else {
    for (let i=0;i<22;i++) {
      state.particles.push({
        x: state.droplet.x, y: state.droplet.y,
        vx:(Math.random()-.5)*22, vy:-15-Math.random()*35,
        age:0, life:.8+Math.random()*.7, size:2+Math.random()*4
      });
    }
    playTone(820, .45, .035);
    haptic(16);
  }

  setTimeout(() => ui.ending.classList.add('is-visible'), reason === 'fall' ? 1450 : 1050);
}

function supportsMotionPermission() {
  return typeof DeviceOrientationEvent !== 'undefined';
}

async function enableMotion() {
  try {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') return;
    }
    window.addEventListener('deviceorientation', onOrientation, { passive:true });
    state.motionEnabled = true;
    ui.motionBtn.textContent = '傾き ON';
    haptic(10);
  } catch {
    ui.motionBtn.textContent = '指で遊べます';
  }
}

function onOrientation(event) {
  if (!state.motionEnabled || state.mode !== 'playing') return;
  const gamma = Number(event.gamma) || 0;
  const beta = Number(event.beta) || 0;
  state.tilt.targetX = clamp(gamma / 28, -1, 1);
  state.tilt.targetY = clamp((beta - 42) / 34, -1, 1);
}

function pointerStart(e) {
  if (state.mode !== 'playing') return;
  state.pointer.active = true;
  state.pointer.startX = state.pointer.x = e.clientX;
  state.pointer.startY = state.pointer.y = e.clientY;
  if (!state.touched) {
    state.touched = true;
    document.body.classList.add('touched');
  }
}

function pointerMove(e) {
  if (!state.pointer.active || state.mode !== 'playing' || state.motionEnabled) return;
  state.pointer.x = e.clientX;
  state.pointer.y = e.clientY;
  const dx = (state.pointer.x - state.pointer.startX) / Math.max(90, state.width * .24);
  const dy = (state.pointer.y - state.pointer.startY) / Math.max(90, state.height * .18);
  state.tilt.targetX = clamp(dx, -1, 1);
  state.tilt.targetY = clamp(dy, -1, 1);
}

function pointerEnd() {
  state.pointer.active = false;
  if (!state.motionEnabled) {
    state.tilt.targetX *= .4;
    state.tilt.targetY *= .4;
  }
}

function update(dt) {
  state.ambientPhase += dt;
  updateParticles(dt);
  updateRipples(dt);

  if (state.mode !== 'playing') {
    state.leafWobble += (Math.sin(state.ambientPhase * .65) * .008 - state.leafWobble) * Math.min(1,dt*2);
    return;
  }

  state.elapsed = (performance.now() - state.startedAt) / 1000;
  ui.lifeTime.textContent = state.elapsed.toFixed(1);

  state.tilt.x += (state.tilt.targetX - state.tilt.x) * Math.min(1, dt * 5.5);
  state.tilt.y += (state.tilt.targetY - state.tilt.y) * Math.min(1, dt * 5.5);
  if (!state.pointer.active && !state.motionEnabled) {
    state.tilt.targetX *= Math.pow(.25, dt);
    state.tilt.targetY *= Math.pow(.25, dt);
  }

  state.leafRotation += ((state.tilt.x * .025) - state.leafRotation) * Math.min(1,dt*4);
  state.leafWobble += ((state.tilt.y * .015) - state.leafWobble) * Math.min(1,dt*4);

  const accel = 245;
  const d = state.droplet;
  d.vx += state.tilt.x * accel * dt;
  d.vy += state.tilt.y * accel * dt;
  d.vx *= Math.pow(.36, dt);
  d.vy *= Math.pow(.36, dt);

  const speed = Math.hypot(d.vx,d.vy);
  const maxSpeed = 265;
  if (speed > maxSpeed) {
    d.vx = d.vx / speed * maxSpeed;
    d.vy = d.vy / speed * maxSpeed;
  }

  d.x += d.vx * dt;
  d.y += d.vy * dt;
  d.vy += Math.sin(state.ambientPhase * .8) * 1.5 * dt;

  checkMoments();

  const norm = normalizedLeafDistance(d.x,d.y);
  const edgeRisk = smoothstep(.72,.98,norm);
  const centerStillness = 1 - smoothstep(.20,.55,norm);
  state.evaporation += dt * (0.010 + centerStillness * .013);
  if (speed > 30) state.evaporation = Math.max(0,state.evaporation - dt * .002);

  if (norm > 1.03) {
    endGame('fall');
  } else if (state.elapsed >= state.maxLife || state.evaporation >= 1) {
    endGame('evaporate');
  }

  if (edgeRisk > .55 && Math.random() < dt * 5) {
    state.dust.push({x:d.x+(Math.random()-.5)*18,y:d.y+(Math.random()-.5)*18,age:0,life:.5});
  }
  updateDust(dt);
}

function normalizedLeafDistance(x,y) {
  const dx = (x - state.cx) / state.leafRx;
  const dy = (y - state.cy) / state.leafRy;
  const notch = Math.max(0, 1 - Math.hypot((dx+.03)/.24,(dy+.88)/.28));
  return Math.sqrt(dx*dx + dy*dy) + notch*.26;
}

function checkMoments() {
  const d = state.droplet;
  for (const m of MOMENTS) {
    if (state.met.has(m.id)) continue;
    const x = nxToX(m.nx), y = nyToY(m.ny);
    const dist = Math.hypot(d.x-x,d.y-y);
    if (dist < Math.max(28, state.leafRx*m.radius)) {
      state.met.add(m.id);
      state.moments.push(m.id);
      showMoment(m);
      for (let i=0;i<10;i++) {
        state.particles.push({
          x:d.x,y:d.y,vx:(Math.random()-.5)*45,vy:(Math.random()-.5)*45,
          age:0,life:.55+Math.random()*.4,size:1.5+Math.random()*3.5
        });
      }
      d.vx *= .86; d.vy *= .86;
      playTone(520 + state.met.size*60, .14, .025);
      haptic(8);
    }
  }
}

function showMoment(m) {
  clearTimeout(state.momentTimer);
  ui.momentMark.textContent = m.mark;
  ui.momentTitle.textContent = m.title;
  ui.momentText.textContent = m.text;
  ui.moment.classList.add('show');
  state.momentTimer = setTimeout(() => ui.moment.classList.remove('show'), 2200);
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(.15,dt);
    p.vy *= Math.pow(.15,dt);
  }
  state.particles = state.particles.filter(p => p.age < p.life);
}

function updateRipples(dt) {
  for (const r of state.ripples) r.age += dt;
  state.ripples = state.ripples.filter(r => r.age < 1.8);
}

function updateDust(dt) {
  for (const d of state.dust) d.age += dt;
  state.dust = state.dust.filter(d => d.age < d.life);
}

function spawnSplash(x,y) {
  for (let i=0;i<18;i++) {
    const a = Math.random()*Math.PI*2;
    const s = 18+Math.random()*70;
    state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-22,age:0,life:.55+Math.random()*.55,size:2+Math.random()*5});
  }
}

function draw() {
  const w=state.width,h=state.height;
  drawWater(w,h);
  drawDistantLotus(w,h);
  drawLeaf();
  drawMomentObjects();
  drawDroplet();
  drawEffects();
  drawAtmosphere();
}

function drawWater(w,h) {
  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#edf8f1');
  g.addColorStop(.48,'#c9e7df');
  g.addColorStop(1,'#92c9c4');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

  const sun = ctx.createRadialGradient(w*.18,h*.12,0,w*.18,h*.12,Math.max(w,h)*.7);
  sun.addColorStop(0,'rgba(255,245,201,.68)');
  sun.addColorStop(.24,'rgba(255,244,210,.22)');
  sun.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sun;ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.globalAlpha=.16;
  ctx.strokeStyle='#ffffff';
  ctx.lineWidth=1;
  for(let i=0;i<8;i++){
    const y=h*(.13+i*.105)+Math.sin(state.ambientPhase*.6+i)*8;
    ctx.beginPath();
    for(let x=-20;x<w+20;x+=24){
      const yy=y+Math.sin(x*.018+state.ambientPhase*.7+i)*3;
      if(x===-20)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawDistantLotus(w,h) {
  ctx.save();
  const count = 5 + Math.min(4, Math.floor(memory.ripples/3));
  for(let i=0;i<count;i++){
    const seed=(i*97.3+13.7);
    const x=(Math.sin(seed)*.5+.5)*w;
    const y=h*(.73+((i*37)%17)/100);
    const s=18+((i*23)%22);
    ctx.globalAlpha=.16+((i%3)*.035);
    ctx.fillStyle='#4e9a6f';
    ctx.beginPath();ctx.ellipse(x,y,s*1.7,s*.68,(i%2?-.2:.24),0,Math.PI*2);ctx.fill();
  }
  if(memory.ripples>=2){
    const bloomCount=Math.min(4,Math.floor(memory.ripples/2));
    for(let i=0;i<bloomCount;i++){
      const x=w*(.12+i*.22);const y=h*(.72+(i%2)*.055);
      drawLotusFlower(x,y,12+i*1.8,.23);
    }
  }
  ctx.restore();
}

function leafPath() {
  const {cx,cy,leafRx:rx,leafRy:ry}=state;
  ctx.beginPath();
  ctx.moveTo(cx,cy-ry*.90);
  ctx.bezierCurveTo(cx-rx*.14,cy-ry*.63,cx-rx*.88,cy-ry*.88,cx-rx,cy-ry*.08);
  ctx.bezierCurveTo(cx-rx*1.03,cy+ry*.60,cx-rx*.38,cy+ry*.98,cx,cy+ry*.95);
  ctx.bezierCurveTo(cx+rx*.48,cy+ry*.98,cx+rx*1.04,cy+ry*.54,cx+rx,cy-ry*.10);
  ctx.bezierCurveTo(cx+rx*.92,cy-ry*.78,cx+rx*.20,cy-ry*.68,cx,cy-ry*.90);
}

function drawLeaf() {
  ctx.save();
  ctx.translate(state.cx,state.cy);
  ctx.rotate(state.leafRotation);
  ctx.translate(-state.cx,-state.cy);

  ctx.save();
  ctx.translate(0,10+state.leafWobble*110);
  ctx.filter='blur(14px)';
  ctx.globalAlpha=.22;
  ctx.fillStyle='#164d3d';
  leafPath();ctx.fill();
  ctx.restore();

  const g=ctx.createRadialGradient(state.cx-state.leafRx*.34,state.cy-state.leafRy*.42,8,state.cx,state.cy,state.leafRx*1.05);
  g.addColorStop(0,'#81bd7d');
  g.addColorStop(.5,'#4a9a67');
  g.addColorStop(1,'#226443');
  ctx.fillStyle=g;
  leafPath();ctx.fill();

  ctx.save();
  leafPath();ctx.clip();
  const glow=ctx.createRadialGradient(state.cx-state.leafRx*.4,state.cy-state.leafRy*.5,0,state.cx-state.leafRx*.4,state.cy-state.leafRy*.5,state.leafRx*.72);
  glow.addColorStop(0,'rgba(255,255,205,.30)');glow.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=glow;ctx.fillRect(state.cx-state.leafRx,state.cy-state.leafRy,state.leafRx*2,state.leafRy*2);

  ctx.globalAlpha=.31;ctx.strokeStyle='#d6e9a6';ctx.lineWidth=1;
  for(let i=0;i<22;i++){
    const a=(i/22)*Math.PI*2;
    const ex=state.cx+Math.cos(a)*state.leafRx*.95;
    const ey=state.cy+Math.sin(a)*state.leafRy*.88;
    ctx.beginPath();ctx.moveTo(state.cx,state.cy+state.leafRy*.05);ctx.quadraticCurveTo(
      state.cx+Math.cos(a)*state.leafRx*.35,
      state.cy+Math.sin(a)*state.leafRy*.22,
      ex,ey
    );ctx.stroke();
  }
  ctx.globalAlpha=.12;ctx.strokeStyle='#173f30';ctx.lineWidth=1;
  for(let j=1;j<5;j++){
    ctx.beginPath();ctx.ellipse(state.cx,state.cy,state.leafRx*(.16+j*.15),state.leafRy*(.12+j*.14),0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle='rgba(244,255,225,.62)';ctx.lineWidth=1.25;leafPath();ctx.stroke();

  const dimple=ctx.createRadialGradient(state.cx,state.cy+6,0,state.cx,state.cy+6,38);
  dimple.addColorStop(0,'rgba(25,76,50,.32)');dimple.addColorStop(1,'rgba(25,76,50,0)');
  ctx.fillStyle=dimple;ctx.beginPath();ctx.arc(state.cx,state.cy+6,40,0,Math.PI*2);ctx.fill();

  ctx.restore();
}

function drawMomentObjects() {
  for(const m of MOMENTS){
    const x=nxToX(m.nx),y=nyToY(m.ny);
    const met=state.met.has(m.id);
    ctx.save();
    ctx.globalAlpha=met?.32:.78;
    if(m.id==='pollen'){
      ctx.fillStyle='#f5d85f';
      for(let i=0;i<7;i++){
        const a=i*2.4;ctx.beginPath();ctx.arc(x+Math.cos(a)*8,y+Math.sin(a)*6,1.8,0,Math.PI*2);ctx.fill();
      }
    }else if(m.id==='friend'){
      drawSmallDrop(x,y,7);
    }else if(m.id==='petal'){
      ctx.fillStyle='#eaa6bd';ctx.beginPath();ctx.ellipse(x,y,15,6,-.35,0,Math.PI*2);ctx.fill();
    }else if(m.id==='sun'){
      const rg=ctx.createRadialGradient(x,y,0,x,y,24);rg.addColorStop(0,'rgba(255,244,173,.92)');rg.addColorStop(1,'rgba(255,244,173,0)');
      ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();
    }else if(m.id==='sky'){
      ctx.strokeStyle='rgba(218,244,238,.86)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.stroke();
    }else if(m.id==='dragonfly'){
      ctx.strokeStyle='rgba(22,52,42,.34)';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x+9,y);ctx.moveTo(x,y-7);ctx.lineTo(x,y+7);ctx.stroke();
      ctx.beginPath();ctx.ellipse(x-7,y-3,8,3,-.5,0,Math.PI*2);ctx.ellipse(x+7,y+3,8,3,-.5,0,Math.PI*2);ctx.stroke();
    }
    if(!met){
      const pulse=1+Math.sin(state.ambientPhase*2.2+m.nx*9)*.08;
      ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,22*pulse,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}

function drawSmallDrop(x,y,r){
  const g=ctx.createRadialGradient(x-r*.4,y-r*.5,1,x,y,r);
  g.addColorStop(0,'rgba(255,255,255,.95)');
  g.addColorStop(.3,'rgba(223,248,245,.74)');
  g.addColorStop(1,'rgba(63,125,107,.20)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=.8;ctx.stroke();
}

function drawDroplet() {
  if(state.mode==='ending' && state.fallen && state.ripples.length) return;
  const d=state.droplet;
  const speed=Math.hypot(d.vx,d.vy);
  const stretch=clamp(speed/240,0,.26);
  const angle=Math.atan2(d.vy,d.vx);

  ctx.save();
  ctx.translate(d.x,d.y);
  ctx.rotate(angle);
  ctx.scale(1+stretch,1-stretch*.6);
  const r=d.r;

  ctx.globalAlpha=.16;ctx.fillStyle='#164b3a';
  ctx.beginPath();ctx.ellipse(3,7,r*.94,r*.56,0,0,Math.PI*2);ctx.fill();

  const g=ctx.createRadialGradient(-r*.35,-r*.42,r*.08,0,0,r*1.18);
  g.addColorStop(0,'rgba(255,255,255,.98)');
  g.addColorStop(.18,'rgba(233,253,250,.84)');
  g.addColorStop(.58,'rgba(169,229,219,.46)');
  g.addColorStop(1,'rgba(49,123,101,.20)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.88)';ctx.lineWidth=1;ctx.stroke();

  ctx.fillStyle='rgba(255,255,255,.82)';ctx.beginPath();ctx.ellipse(-r*.34,-r*.38,r*.24,r*.14,-.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawEffects() {
  for(const p of state.particles){
    const a=1-p.age/p.life;
    ctx.globalAlpha=a*.74;ctx.fillStyle='rgba(245,255,252,.9)';
    ctx.beginPath();ctx.arc(p.x,p.y,p.size*a,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  for(const r of state.ripples){
    const t=r.age/1.8;
    ctx.strokeStyle=`rgba(244,255,253,${(1-t)*.7})`;
    ctx.lineWidth=Math.max(.6,1.8*(1-t));
    for(let i=0;i<3;i++){
      const rr=18+(t*170)+i*18;
      ctx.beginPath();ctx.ellipse(r.x,r.y,rr,rr*.32,0,0,Math.PI*2);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
  for(const d of state.dust){
    const a=1-d.age/d.life;ctx.fillStyle=`rgba(255,255,255,${a*.4})`;
    ctx.beginPath();ctx.arc(d.x,d.y,1.2+a*1.5,0,Math.PI*2);ctx.fill();
  }
}

function drawAtmosphere() {
  ctx.save();
  const v=ctx.createRadialGradient(state.width*.5,state.height*.43,Math.min(state.width,state.height)*.18,state.width*.5,state.height*.45,Math.max(state.width,state.height)*.72);
  v.addColorStop(0,'rgba(255,255,255,0)');
  v.addColorStop(1,'rgba(18,66,50,.13)');
  ctx.fillStyle=v;ctx.fillRect(0,0,state.width,state.height);
  ctx.restore();
}

function drawLotusFlower(x,y,size,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;
  for(let i=0;i<7;i++){
    ctx.rotate(Math.PI*2/7);
    ctx.fillStyle=i%2?'#f3c2cf':'#f7d7df';
    ctx.beginPath();ctx.ellipse(0,-size*.55,size*.28,size*.72,0,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#e8bb65';ctx.beginPath();ctx.arc(0,0,size*.18,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function loop(now) {
  const dt=Math.min(.035,(now-state.lastFrame)/1000 || .016);
  state.lastFrame=now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function playTone(freq=440,duration=.1,volume=.02){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    const ac=playTone.ac||(playTone.ac=new AC());
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.value=freq;
    g.gain.setValueAtTime(.0001,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(volume,ac.currentTime+.015);
    g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+duration);
    o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+duration+.02);
  }catch{}
}

function haptic(pattern){
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch{}
}

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function smoothstep(a,b,v){ const x=clamp((v-a)/(b-a),0,1);return x*x*(3-2*x); }

ui.startBtn.addEventListener('click', startGame);
ui.againBtn.addEventListener('click', () => {
  ui.ending.classList.remove('is-visible');
  setTimeout(startGame, 220);
});
ui.motionBtn.addEventListener('click', enableMotion);
window.addEventListener('resize', resize);
canvas.addEventListener('pointerdown', pointerStart);
canvas.addEventListener('pointermove', pointerMove);
window.addEventListener('pointerup', pointerEnd);
window.addEventListener('pointercancel', pointerEnd);
canvas.addEventListener('contextmenu', e => e.preventDefault());

resize();
requestAnimationFrame(loop);
