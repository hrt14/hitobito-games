(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const moneyEl = document.getElementById('money');
  const populationEl = document.getElementById('population');
  const ridershipEl = document.getElementById('ridership');
  const profitText = document.getElementById('profitText');
  const infoLabel = document.getElementById('infoLabel');
  const infoText = document.getElementById('infoText');
  const toastEl = document.getElementById('toast');
  const goalCard = document.getElementById('goalCard');
  const goalTitle = document.getElementById('goalTitle');
  const goalSub = document.getElementById('goalSub');
  const goalProgress = document.getElementById('goalProgress');
  const speedBtn = document.getElementById('speedBtn');
  const resetBtn = document.getElementById('resetBtn');
  const toolButtons = [...document.querySelectorAll('.tool')];

  const N = 12;
  const RAIL_COST = 20;
  const STATION_COST = 140;
  const DEV_COST = 90;
  const START_MONEY = 680;
  const terrainSeed = [
    [0,0,0,0,0,0,0,0,2,2,2,2],
    [0,0,0,0,0,0,0,0,0,2,2,2],
    [0,0,0,0,0,0,0,0,0,0,2,2],
    [0,0,0,0,0,0,0,0,0,0,0,2],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [2,0,0,0,0,0,0,0,0,0,0,0],
    [2,2,0,0,0,0,0,0,0,0,0,0],
  ]; // 0 land, 1 water, 2 hill

  let state;
  let dpr = 1;
  let W = 0, H = 0, cell = 0, ox = 0, oy = 0;
  let lastTs = performance.now();
  let simAccumulator = 0;
  let growthAccumulator = 0;
  let financeAccumulator = 0;
  let incomePulse = 0;
  let toastTimer = 0;
  let pointerDown = false;
  let dragged = false;
  let lastPaintKey = '';

  function createTile(x, y) {
    return {
      x, y,
      terrain: terrainSeed[y][x],
      rail: false,
      station: false,
      stationLevel: 1,
      building: null,
      buildingLevel: 0,
      developed: false,
      landValue: 20,
      growth: Math.random() * .35,
    };
  }

  function newState() {
    const tiles = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) tiles.push(createTile(x, y));

    // Seed a weak pre-rail town so the map feels alive, but make the rail corridor empty enough to plan.
    const seeds = [
      [2,2,'house',1],[3,2,'house',1],[2,3,'shop',1],[8,8,'house',1],[9,8,'office',1],
      [9,9,'house',1],[1,8,'house',1],[2,9,'shop',1],[7,2,'house',1]
    ];
    for (const [x,y,type,lv] of seeds) {
      const t = tiles[y*N+x];
      t.building = type; t.buildingLevel = lv; t.growth = .2;
    }

    return {
      money: START_MONEY,
      day: 1,
      tool: 'rail',
      speed: 1,
      tiles,
      trains: [],
      stations: [],
      ridership: 0,
      lastIncome: 0,
      lastExpenses: 0,
      routeSignature: '',
      tutorialStep: 0,
      milestones: new Set(),
      selected: null,
      hover: null,
      sparkles: [],
    };
  }

  function tileAt(x,y) { return x>=0 && y>=0 && x<N && y<N ? state.tiles[y*N+x] : null; }
  function neighbors(t) { return [[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>tileAt(t.x+dx,t.y+dy)).filter(Boolean); }
  function isTrack(t) { return !!t && (t.rail || t.station); }

  function money(v) {
    const sign = v < 0 ? '-' : '';
    const a = Math.abs(Math.round(v));
    return `${sign}¥${a.toLocaleString('ja-JP')}`;
  }

  function getPopulation() {
    return state.tiles.reduce((s,t) => s + (t.building === 'house' ? [0,18,45,95,180][t.buildingLevel] : 0), 0);
  }
  function getJobs() {
    return state.tiles.reduce((s,t) => s + (t.building === 'shop' ? [0,10,28,60,115][t.buildingLevel] : t.building === 'office' ? [0,16,45,100,210][t.buildingLevel] : 0), 0);
  }

  function stationCatchment(st) {
    let pop = 0, jobs = 0, value = 0, buildings = 0;
    for (const t of state.tiles) {
      const d = Math.abs(t.x-st.x) + Math.abs(t.y-st.y);
      if (d <= 3) {
        const weight = 1 - d * .17;
        if (t.building === 'house') pop += [0,18,45,95,180][t.buildingLevel] * weight;
        if (t.building === 'shop') jobs += [0,10,28,60,115][t.buildingLevel] * weight;
        if (t.building === 'office') jobs += [0,16,45,100,210][t.buildingLevel] * weight;
        if (t.building) buildings++;
        value += t.landValue;
      }
    }
    return {pop, jobs, value, buildings};
  }

  function bfsPath(a,b) {
    const start = `${a.x},${a.y}`, goal = `${b.x},${b.y}`;
    const q = [a]; const prev = new Map([[start,null]]);
    while (q.length) {
      const t = q.shift(); const key = `${t.x},${t.y}`;
      if (key === goal) break;
      for (const n of neighbors(t)) {
        const nk = `${n.x},${n.y}`;
        if (!prev.has(nk) && isTrack(n)) { prev.set(nk,key); q.push(n); }
      }
    }
    if (!prev.has(goal)) return null;
    const path=[]; let cur=goal;
    while(cur){ const [x,y]=cur.split(',').map(Number); path.push(tileAt(x,y)); cur=prev.get(cur); }
    return path.reverse();
  }

  function recalcRoutes() {
    state.stations = state.tiles.filter(t=>t.station);
    let best = null;
    for (let i=0;i<state.stations.length;i++) for (let j=i+1;j<state.stations.length;j++) {
      const p = bfsPath(state.stations[i], state.stations[j]);
      if (p && (!best || p.length > best.length)) best = p;
    }
    const sig = best ? best.map(t=>`${t.x}.${t.y}`).join('|') : '';
    if (sig !== state.routeSignature) {
      state.routeSignature = sig;
      state.trains = best ? [{ path: best, pos: 0, dir: 1, speed: .72, dwell: .8, lastStationKey: '' }] : [];
      if (best && state.stations.length >= 2) showToast('🚆 列車が運行開始！');
    }
  }

  function spend(cost) {
    if (state.money < cost) { showToast(`資金不足 ${money(cost)}`); return false; }
    state.money -= cost; return true;
  }

  function canBuildOn(t) { return t && t.terrain === 0; }

  function buildRail(t) {
    if (!t || !canBuildOn(t) || t.building || t.station || t.rail) return false;
    if (!spend(RAIL_COST)) return false;
    t.rail = true;
    bump(t, '#f3ead4');
    recalcRoutes();
    return true;
  }

  function buildStation(t) {
    if (!t || !canBuildOn(t) || t.building || t.station) { showToast('空き地か線路上に駅を置けます'); return false; }
    if (!t.rail && !neighbors(t).some(isTrack)) { showToast('線路のそばに駅を置いてください'); return false; }
    if (!spend(STATION_COST)) return false;
    t.rail = true; t.station = true;
    bump(t, '#ffd66d', 10);
    recalcRoutes();
    return true;
  }

  function buildDevelopment(t) {
    if (!t || !canBuildOn(t) || t.rail || t.station || t.building) { showToast('空き地を選んでください'); return false; }
    if (!spend(DEV_COST)) return false;
    const nearby = nearestStation(t);
    const types = nearby ? ['house','shop','office'] : ['house','house','shop'];
    const type = types[Math.floor(Math.random()*types.length)];
    t.building = type; t.buildingLevel = 1; t.developed = true; t.growth = .15;
    bump(t, type==='house'?'#88e7d2':type==='shop'?'#ffd26c':'#a7bdfb', 10);
    showToast(type==='house'?'住宅を誘致':type==='shop'?'商業を誘致':'オフィスを誘致');
    return true;
  }

  function bulldoze(t) {
    if (!t) return false;
    let refund = 0;
    if (t.station) { refund = Math.round(STATION_COST*.5); t.station=false; t.rail=false; }
    else if (t.rail) { refund = Math.round(RAIL_COST*.5); t.rail=false; }
    else if (t.building && t.developed) { refund = Math.round(DEV_COST*.5); t.building=null; t.buildingLevel=0; t.developed=false; }
    else { showToast('撤去できる自社設備がありません'); return false; }
    state.money += refund; bump(t, '#ff8179', 7); recalcRoutes(); showToast(`${money(refund)} 戻りました`); return true;
  }

  function nearestStation(t) {
    let best=null, bd=999;
    for(const s of state.stations){ const d=Math.abs(t.x-s.x)+Math.abs(t.y-s.y); if(d<bd){bd=d;best=s;} }
    return bd<=4?best:null;
  }

  function tileAccessible(t) {
    return state.stations.some(s=>Math.abs(t.x-s.x)+Math.abs(t.y-s.y)<=3);
  }

  function growCity(dt) {
    const connected = !!state.routeSignature;
    if (!connected) return;
    for (const t of state.tiles) {
      if (t.terrain!==0 || t.rail || t.station) continue;
      const station = nearestStation(t);
      if (!station) { t.landValue = Math.max(12, t.landValue - .03*dt); continue; }
      const d = Math.abs(t.x-station.x)+Math.abs(t.y-station.y);
      const access = Math.max(0, 1 - d/4);
      t.landValue = Math.min(250, t.landValue + access*.55*dt);
      t.growth += access * .115 * dt * state.speed;

      if (!t.building) {
        const occupiedAdj = neighbors(t).filter(n=>n.building).length;
        if (t.growth > .82 + Math.random()*.34 && Math.random()<.32) {
          const city = cityBalance();
          let type;
          if (city.pop < city.jobs*1.45) type='house';
          else if (city.jobs < city.pop*.48) type=Math.random()<.55?'office':'shop';
          else type=['house','house','shop','office'][Math.floor(Math.random()*4)];
          t.building=type; t.buildingLevel=1; t.developed=false; t.growth=0;
          if (occupiedAdj>0 || d<=2) bump(t, type==='house'?'#7ee0cb':'#ffd46e', 5);
        }
      } else {
        const maxLevel = t.developed ? 4 : 3;
        const threshold = 1.25 + t.buildingLevel*1.08;
        if (t.growth > threshold && t.buildingLevel < maxLevel && Math.random()<.18) {
          t.buildingLevel++; t.growth=.2; bump(t, '#ffffff', 5);
        }
      }
    }
  }

  function cityBalance() { return {pop:getPopulation(),jobs:getJobs()}; }

  function runFinance() {
    const pop = getPopulation(); const jobs = getJobs();
    let riders = 0;
    if (state.routeSignature && state.stations.length>=2) {
      const catchments = state.stations.map(stationCatchment);
      const demand = catchments.reduce((s,c)=>s + 16 + c.buildings*3.2 + c.pop*.22 + c.jobs*.28, 0);
      riders = Math.round(Math.max(state.stations.length * 14, Math.min(pop*1.05 + jobs*.58 + state.stations.length*16, demand)) * (1 + Math.min(1.2,state.stations.length*.08)));
    }
    state.ridership = riders;
    const fares = riders * 2.35;
    const property = state.tiles.reduce((s,t)=>s+(t.developed && t.building ? t.landValue * t.buildingLevel * .07 : 0),0);
    const stationRetail = state.stations.reduce((s,st)=>s+stationCatchment(st).buildings*3.1,0);
    const upkeep = state.tiles.filter(t=>t.rail).length * .48 + state.stations.length * 5 + state.trains.length * 8;
    const net = Math.round(fares + property + stationRetail - upkeep);
    state.lastIncome = Math.round(fares+property+stationRetail);
    state.lastExpenses = Math.round(upkeep);
    state.money += net;
    incomePulse = net;
    if(net>0) bumpMoney();
  }

  function bumpMoney() { moneyEl.animate([{transform:'scale(1)'},{transform:'scale(1.08)',color:'#ffd66d'},{transform:'scale(1)'}],{duration:360}); }

  function moveTrains(dt) {
    for (const tr of state.trains) {
      if (tr.dwell > 0) { tr.dwell -= dt*state.speed; continue; }
      const path = tr.path;
      if (path.length<2) continue;
      tr.pos += tr.dir * tr.speed * dt * state.speed;
      if (tr.pos >= path.length-1) { tr.pos=path.length-1; tr.dir=-1; tr.dwell=.8; stationArrival(path[path.length-1]); }
      if (tr.pos <= 0) { tr.pos=0; tr.dir=1; tr.dwell=.8; stationArrival(path[0]); }
      const idx=Math.round(tr.pos); const tile=path[Math.max(0,Math.min(path.length-1,idx))];
      if(tile.station){ const k=`${tile.x},${tile.y}`; if(tr.lastStationKey!==k){tr.lastStationKey=k; stationArrival(tile);} }
      else tr.lastStationKey='';
    }
  }

  function stationArrival(st) {
    const c = stationCatchment(st);
    const pax = Math.round((c.pop*.08+c.jobs*.1)+4);
    state.sparkles.push({x:st.x,y:st.y,text:`+${pax}人`,life:1.1,max:1.1,color:'#ffd66d'});
  }

  function updateMilestones() {
    const stations = state.stations.length;
    const route = !!state.routeSignature;
    const pop = getPopulation();
    const steps = [
      {title:'2つの駅を線路でつなぐ',sub:'線路 → 駅 → 列車。街はそのあと勝手に育ちます。',progress:`${Math.min(stations,2)}/2`,done:route},
      {title:'駅前人口を300人にする',sub:'駅の近くに「開発」を置くと、周囲の自然成長が速まります。',progress:`${Math.min(pop,300)}/300`,done:pop>=300},
      {title:'1日100人を運ぶ',sub:'住宅と仕事場のバランスが良いほど乗客が増えます。',progress:`${Math.min(state.ridership,100)}/100`,done:state.ridership>=100},
      {title:'人口1,000人の鉄道都市へ',sub:'駅を増やし、線路の向こう側まで街を育てよう。',progress:`${Math.min(pop,1000)}/1000`,done:pop>=1000},
      {title:'都市は走り続ける',sub:'ここからは自由経営。黒字を伸ばし、自分だけの都市へ。',progress:'∞',done:false}
    ];
    while (state.tutorialStep < steps.length-1 && steps[state.tutorialStep].done) {
      state.tutorialStep++;
      goalCard.classList.remove('complete'); void goalCard.offsetWidth; goalCard.classList.add('complete');
      showToast('✓ 次の目標へ');
    }
    const g=steps[state.tutorialStep]; goalTitle.textContent=g.title; goalSub.textContent=g.sub; goalProgress.textContent=g.progress;
  }

  function bump(t,color='#fff',count=6){
    for(let i=0;i<count;i++) state.sparkles.push({x:t.x+(Math.random()-.5)*.55,y:t.y+(Math.random()-.5)*.55,vx:(Math.random()-.5)*.35,vy:-.15-Math.random()*.3,life:.7+Math.random()*.5,max:1.1,color,r:1.3+Math.random()*2.4});
  }

  function updateSparkles(dt){
    for(const s of state.sparkles){s.life-=dt; if(s.vx!=null){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=.18*dt;}}
    state.sparkles=state.sparkles.filter(s=>s.life>0);
  }

  function update(dt) {
    moveTrains(dt);
    simAccumulator += dt*state.speed;
    growthAccumulator += dt;
    financeAccumulator += dt*state.speed;
    if (growthAccumulator > .32) { growCity(growthAccumulator); growthAccumulator=0; }
    if (financeAccumulator > 5.5) { financeAccumulator-=5.5; state.day++; runFinance(); }
    updateSparkles(dt);
    updateMilestones();
    updateUI();
  }

  function updateUI() {
    moneyEl.textContent=money(state.money);
    populationEl.textContent=getPopulation().toLocaleString('ja-JP');
    ridershipEl.textContent=state.ridership.toLocaleString('ja-JP');
    const net=state.lastIncome-state.lastExpenses;
    profitText.textContent=`次の決算 ${net>=0?'+':''}${money(net)}`;
    profitText.style.color=net>=0?'#ffd66d':'#ff8179';
    if(state.selected){
      const t=state.selected;
      if(t.station){const c=stationCatchment(t); infoLabel.textContent='駅'; infoText.textContent=`駅勢圏：人口 ${Math.round(c.pop)} / 仕事 ${Math.round(c.jobs)} / 周辺建物 ${c.buildings}`;}
      else if(t.building){ infoLabel.textContent=t.building==='house'?'住宅':t.building==='shop'?'商業':'オフィス'; infoText.textContent=`Lv.${t.buildingLevel}　地価 ¥${Math.round(t.landValue)}　${tileAccessible(t)?'駅アクセス良好':'鉄道から遠い'}`; }
      else { infoLabel.textContent='都市計画室'; infoText.textContent=toolHint(state.tool); }
    } else { infoLabel.textContent='都市計画室'; infoText.textContent=toolHint(state.tool); }
  }

  function toolHint(tool){
    return ({rail:'マップをなぞって線路を敷けます。線路同士は自動でつながります。',station:'線路上・線路の隣に駅を置く。2駅がつながると列車が走ります。',develop:'駅前の空き地に投資。住宅・商業・オフィスを誘致します。',bulldoze:'自分で建てた線路・駅・開発を撤去し、建設費の50%を回収。'})[tool];
  }

  function showToast(text) {
    toastEl.textContent=text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toastEl.classList.remove('show'),950);
  }

  function resize() {
    const rect=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.width/1.05*dpr);
    W=canvas.width/dpr; H=canvas.height/dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cell=Math.min((W-22)/N,(H-22)/N); ox=(W-cell*N)/2; oy=(H-cell*N)/2;
  }

  function tileRect(t){ return {x:ox+t.x*cell,y:oy+t.y*cell,w:cell,h:cell}; }
  function screenToTile(px,py){ const x=Math.floor((px-ox)/cell), y=Math.floor((py-oy)/cell); return tileAt(x,y); }

  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

  function drawGround() {
    // Deep edge and subtle vignette.
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#466b50');g.addColorStop(1,'#244437');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(const t of state.tiles){
      const r=tileRect(t); let fill;
      if(t.terrain===1) fill=((t.x+t.y)%2)?'#2f7390':'#347f9a';
      else if(t.terrain===2) fill=((t.x+t.y)%2)?'#56745a':'#5d7d5e';
      else fill=((t.x+t.y)%2)?'#759267':'#6e8a61';
      ctx.fillStyle=fill; ctx.fillRect(r.x,r.y,r.w+.5,r.h+.5);
      ctx.strokeStyle='rgba(20,50,39,.09)'; ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);
      if(t.terrain===1){
        ctx.strokeStyle='rgba(184,236,255,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(r.x+3,r.y+r.h*.35);ctx.quadraticCurveTo(r.x+r.w*.55,r.y+r.h*.18,r.x+r.w-2,r.y+r.h*.35);ctx.stroke();
      }
      if(t.terrain===2){ drawHill(r,t); }
    }
    // tiny road hints through developed clusters
    for(const t of state.tiles){ if(t.building){ const r=tileRect(t); ctx.fillStyle='rgba(222,218,188,.22)'; ctx.fillRect(r.x,r.y+r.h*.82,r.w,r.h*.18); } }
  }

  function drawHill(r,t){
    ctx.fillStyle='rgba(28,58,41,.35)';
    ctx.beginPath();ctx.moveTo(r.x+3,r.y+r.h*.82);ctx.lineTo(r.x+r.w*.35,r.y+r.h*.28);ctx.lineTo(r.x+r.w*.55,r.y+r.h*.62);ctx.lineTo(r.x+r.w*.75,r.y+r.h*.35);ctx.lineTo(r.x+r.w-2,r.y+r.h*.82);ctx.closePath();ctx.fill();
  }

  function railDirs(t){
    return {n:isTrack(tileAt(t.x,t.y-1)),s:isTrack(tileAt(t.x,t.y+1)),w:isTrack(tileAt(t.x-1,t.y)),e:isTrack(tileAt(t.x+1,t.y))};
  }

  function drawRails() {
    for(const t of state.tiles){if(!isTrack(t))continue; const r=tileRect(t), d=railDirs(t), cx=r.x+r.w/2, cy=r.y+r.h/2;
      // ballast
      ctx.strokeStyle='rgba(68,61,50,.55)';ctx.lineWidth=Math.max(5,cell*.18);ctx.lineCap='butt';ctx.beginPath();
      if(d.n){ctx.moveTo(cx,cy);ctx.lineTo(cx,r.y);} if(d.s){ctx.moveTo(cx,cy);ctx.lineTo(cx,r.y+r.h);} if(d.w){ctx.moveTo(cx,cy);ctx.lineTo(r.x,cy);} if(d.e){ctx.moveTo(cx,cy);ctx.lineTo(r.x+r.w,cy);} if(!(d.n||d.s||d.w||d.e)){ctx.moveTo(r.x+4,cy);ctx.lineTo(r.x+r.w-4,cy);}ctx.stroke();
      // steel, dual parallel simplified based direction
      ctx.strokeStyle='#d8d8cd';ctx.lineWidth=Math.max(1.2,cell*.045);ctx.beginPath();
      const off=Math.max(2,cell*.08);
      if(d.n||d.s){ const y1=d.n?r.y:cy, y2=d.s?r.y+r.h:cy; ctx.moveTo(cx-off,y1);ctx.lineTo(cx-off,y2);ctx.moveTo(cx+off,y1);ctx.lineTo(cx+off,y2); }
      if(d.w||d.e||(!(d.n||d.s||d.w||d.e))){ const x1=d.w?r.x:r.x+4, x2=d.e?r.x+r.w:r.x+r.w-4;ctx.moveTo(x1,cy-off);ctx.lineTo(x2,cy-off);ctx.moveTo(x1,cy+off);ctx.lineTo(x2,cy+off); }
      ctx.stroke();
      // sleepers
      ctx.strokeStyle='#765e47';ctx.lineWidth=Math.max(1,cell*.055);
      if(d.n||d.s){for(let i=0;i<4;i++){const yy=r.y+(i+.5)*r.h/4;ctx.beginPath();ctx.moveTo(cx-cell*.16,yy);ctx.lineTo(cx+cell*.16,yy);ctx.stroke();}}
      if(d.w||d.e||(!(d.n||d.s||d.w||d.e))){for(let i=0;i<4;i++){const xx=r.x+(i+.5)*r.w/4;ctx.beginPath();ctx.moveTo(xx,cy-cell*.16);ctx.lineTo(xx,cy+cell*.16);ctx.stroke();}}
    }
  }

  function drawBuildings() {
    // Painter order north to south.
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const t=tileAt(x,y); if(t.building) drawBuilding(t);}
  }

  function drawBuilding(t){
    const r=tileRect(t), lv=t.buildingLevel; const margin=cell*.14; const baseW=cell-margin*2; const h=cell*(.34+.15*lv); const bx=r.x+margin, by=r.y+r.h*.84-h;
    let front, side, roof;
    if(t.building==='house'){front=['','#d9ddc8','#b7d7c6','#8fcab5','#63b69e'][lv];side='#6e9886';roof='#e27b67';}
    else if(t.building==='shop'){front=['','#f2ca70','#eeb35c','#e5904f','#d96e45'][lv];side='#9a6c4d';roof='#f4edcf';}
    else {front=['','#a8bbd8','#8faed3','#698fc4','#4e72ad'][lv];side='#556d8d';roof='#d9e5eb';}
    // shadow
    ctx.fillStyle='rgba(7,23,20,.22)';ctx.fillRect(bx+cell*.08,by+cell*.09,baseW,r.y+r.h*.84-by);
    // side extrusion
    const depth=cell*.10;ctx.fillStyle=side;ctx.beginPath();ctx.moveTo(bx+baseW,by);ctx.lineTo(bx+baseW+depth,by-depth*.55);ctx.lineTo(bx+baseW+depth,r.y+r.h*.84-depth*.55);ctx.lineTo(bx+baseW,r.y+r.h*.84);ctx.closePath();ctx.fill();
    // front
    ctx.fillStyle=front;ctx.fillRect(bx,by,baseW,r.y+r.h*.84-by);
    // roof
    ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(bx-cell*.03,by);ctx.lineTo(bx+baseW*.48,by-cell*.13);ctx.lineTo(bx+baseW+depth,by-depth*.55);ctx.lineTo(bx+baseW,by+cell*.04);ctx.closePath();ctx.fill();
    // windows / identity
    if(t.building==='house'){
      ctx.fillStyle='#163942'; const cols=lv>=3?3:2, rows=lv>=2?2:1;
      for(let yy=0;yy<rows;yy++)for(let xx=0;xx<cols;xx++){ctx.fillRect(bx+baseW*(.15+xx*.28),by+cell*.13+yy*cell*.16,Math.max(2,cell*.08),Math.max(2,cell*.08));}
      ctx.fillStyle='#775345';ctx.fillRect(bx+baseW*.42,r.y+r.h*.66,baseW*.16,r.y+r.h*.84-(r.y+r.h*.66));
    } else if(t.building==='shop'){
      ctx.fillStyle='#fff2c3';ctx.fillRect(bx+baseW*.1,by+cell*.10,baseW*.8,cell*.11);
      ctx.fillStyle='#7f3d36';ctx.fillRect(bx+baseW*.08,r.y+r.h*.63,baseW*.84,cell*.13);
      ctx.fillStyle='#dff5ef';ctx.fillRect(bx+baseW*.15,r.y+r.h*.67,baseW*.28,cell*.12);ctx.fillRect(bx+baseW*.57,r.y+r.h*.67,baseW*.28,cell*.12);
    } else {
      ctx.fillStyle='rgba(227,245,255,.78)'; const cols=3, rows=Math.min(4,lv+1);
      for(let yy=0;yy<rows;yy++)for(let xx=0;xx<cols;xx++)ctx.fillRect(bx+baseW*(.12+xx*.28),by+cell*.08+yy*cell*.12,baseW*.15,cell*.055);
      if(lv>=3){ctx.fillStyle='#e7efe8';ctx.fillRect(bx+baseW*.18,by-cell*.08,baseW*.64,cell*.08);}
    }
  }

  function drawStations(){
    for(const t of state.stations){const r=tileRect(t),cx=r.x+r.w/2,cy=r.y+r.h/2;
      ctx.fillStyle='rgba(10,24,24,.32)';ctx.beginPath();ctx.ellipse(cx+cell*.08,cy+cell*.19,cell*.38,cell*.18,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#f4e8be'; roundRect(r.x+cell*.12,r.y+cell*.18,cell*.76,cell*.47,cell*.08);ctx.fill();
      ctx.fillStyle='#d95b4d';ctx.fillRect(r.x+cell*.08,r.y+cell*.16,cell*.84,cell*.10);
      ctx.fillStyle='#213a45';ctx.fillRect(r.x+cell*.19,r.y+cell*.34,cell*.17,cell*.18);ctx.fillRect(r.x+cell*.62,r.y+cell*.34,cell*.18,cell*.18);
      ctx.fillStyle='#ffd66d';ctx.beginPath();ctx.arc(r.x+cell*.5,r.y+cell*.08,cell*.13,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#17241d';ctx.font=`900 ${Math.max(7,cell*.20)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('駅',r.x+cell*.5,r.y+cell*.08);
    }
  }

  function trainScreenPosition(tr){
    const i=Math.floor(tr.pos), f=tr.pos-i; const a=tr.path[Math.min(i,tr.path.length-1)], b=tr.path[Math.min(i+1,tr.path.length-1)];
    const ar=tileRect(a),br=tileRect(b); return {x:ar.x+cell/2+(br.x-ar.x)*f,y:ar.y+cell/2+(br.y-ar.y)*f,dx:br.x-ar.x,dy:br.y-ar.y};
  }
  function drawTrains(){for(const tr of state.trains){const p=trainScreenPosition(tr);const horizontal=Math.abs(p.dx)>Math.abs(p.dy);ctx.save();ctx.translate(p.x,p.y);if(!horizontal)ctx.rotate(Math.PI/2);
      ctx.fillStyle='rgba(5,18,19,.3)';roundRect(-cell*.30,-cell*.08,cell*.64,cell*.21,cell*.07);ctx.fill();
      ctx.fillStyle='#ef6657';roundRect(-cell*.32,-cell*.15,cell*.64,cell*.24,cell*.07);ctx.fill();
      ctx.fillStyle='#f5e7c2';ctx.fillRect(-cell*.08,-cell*.13,cell*.16,cell*.20);
      ctx.fillStyle='#183844';ctx.fillRect(-cell*.26,-cell*.09,cell*.12,cell*.08);ctx.fillRect(cell*.14,-cell*.09,cell*.12,cell*.08);
      ctx.fillStyle='#f7d467';ctx.beginPath();ctx.arc(cell*.31,-cell*.03,cell*.035,0,Math.PI*2);ctx.fill();
      ctx.restore();}}

  function drawSelection(){
    const t=state.hover||state.selected;if(!t)return;const r=tileRect(t);ctx.strokeStyle=state.tool==='bulldoze'?'#ff8179':'#7bf4c7';ctx.lineWidth=2;ctx.strokeRect(r.x+1.5,r.y+1.5,r.w-3,r.h-3);
    ctx.fillStyle=state.tool==='bulldoze'?'rgba(255,129,121,.08)':'rgba(123,244,199,.08)';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);
  }

  function drawCatchment(){
    if(!(state.tool==='station'||state.tool==='develop'))return;
    const focus=state.hover||state.selected;if(!focus)return;
    const s=focus.station?focus:nearestStation(focus);if(!s)return;
    for(const t of state.tiles){const d=Math.abs(t.x-s.x)+Math.abs(t.y-s.y);if(d<=3){const r=tileRect(t);ctx.fillStyle=`rgba(255,214,109,${.03+(3-d)*.018})`;ctx.fillRect(r.x,r.y,r.w,r.h);}}
  }

  function drawSparkles(){for(const s of state.sparkles){const r=tileRect({x:s.x,y:s.y});const alpha=Math.max(0,s.life/s.max);ctx.globalAlpha=alpha;if(s.text){ctx.fillStyle=s.color;ctx.font=`900 ${Math.max(8,cell*.23)}px sans-serif`;ctx.textAlign='center';ctx.fillText(s.text,r.x+cell/2,r.y+cell*.05-(1-alpha)*12);} else {ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(r.x+cell/2,r.y+cell/2,s.r||2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}}

  function draw(){
    ctx.clearRect(0,0,W,H); drawGround(); drawCatchment(); drawRails(); drawBuildings(); drawStations(); drawTrains(); drawSelection(); drawSparkles();
    // soft vignette
    const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(3,10,13,.27)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }

  function handleTile(t, paint=false){
    if(!t)return;
    state.selected=t;
    let ok=false;
    if(state.tool==='rail') ok=buildRail(t);
    else if(state.tool==='station'&&!paint) ok=buildStation(t);
    else if(state.tool==='develop'&&!paint) ok=buildDevelopment(t);
    else if(state.tool==='bulldoze'&&!paint) ok=bulldoze(t);
    if(ok) updateUI();
  }

  function pointerPos(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*(W/rect.width),y:(e.clientY-rect.top)*(H/rect.height)};}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();pointerDown=true;dragged=false;lastPaintKey='';canvas.setPointerCapture?.(e.pointerId);const p=pointerPos(e),t=screenToTile(p.x,p.y);if(t){state.hover=t;const k=`${t.x},${t.y}`;if(state.tool==='rail'){handleTile(t,true);lastPaintKey=k;}else state.selected=t;}});
  canvas.addEventListener('pointermove',e=>{const p=pointerPos(e),t=screenToTile(p.x,p.y);state.hover=t;if(pointerDown&&state.tool==='rail'&&t){const k=`${t.x},${t.y}`;if(k!==lastPaintKey){dragged=true;handleTile(t,true);lastPaintKey=k;}}});
  canvas.addEventListener('pointerup',e=>{e.preventDefault();const p=pointerPos(e),t=screenToTile(p.x,p.y);if(pointerDown&&t&&state.tool!=='rail')handleTile(t,false);pointerDown=false;});
  canvas.addEventListener('pointerleave',()=>{state.hover=null;pointerDown=false;});

  toolButtons.forEach(btn=>btn.addEventListener('click',()=>{state.tool=btn.dataset.tool;toolButtons.forEach(b=>b.classList.toggle('active',b===btn));state.selected=null;updateUI();}));
  speedBtn.addEventListener('click',()=>{state.speed=state.speed===1?2:state.speed===2?4:1;speedBtn.textContent=`▶ ${state.speed}x`;showToast(`${state.speed}倍速`);});
  resetBtn.addEventListener('click',()=>{if(confirm('都市を最初から作り直しますか？')){state=newState();recalcRoutes();updateUI();}});

  function loop(ts){const dt=Math.min(.05,(ts-lastTs)/1000);lastTs=ts;update(dt);draw();requestAnimationFrame(loop);}
  window.addEventListener('resize',resize);
  state=newState();resize();recalcRoutes();updateUI();requestAnimationFrame(loop);
})();
