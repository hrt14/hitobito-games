(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const FIELD = { left: 28, right: 512, top: 145, bottom: 742 };

  const els = {
    shell: document.getElementById('gameShell'),
    roomName: document.getElementById('roomName'),
    roomEyebrow: document.getElementById('roomEyebrow'),
    sealCount: document.getElementById('sealCount'),
    heartBar: document.getElementById('heartBar'),
    heatBar: document.getElementById('heatBar'),
    objective: document.getElementById('objective'),
    toast: document.getElementById('toast'),
    title: document.getElementById('titleScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    ending: document.getElementById('endingScreen'),
    clearTime: document.getElementById('clearTime'),
    captureCount: document.getElementById('captureCount'),
    damageCount: document.getElementById('damageCount'),
    bestCopy: document.getElementById('bestCopy'),
    gameOverCopy: document.getElementById('gameOverCopy'),
    start: document.getElementById('startBtn'),
    retry: document.getElementById('retryBtn'),
    restartFromOver: document.getElementById('restartFromOverBtn'),
    restart: document.getElementById('restartBtn'),
    joystick: document.getElementById('joystick'),
    stick: document.getElementById('stick'),
    flash: document.getElementById('flashBtn'),
    flashCharge: document.getElementById('flashCharge'),
    suction: document.getElementById('suctionBtn'),
    damage: document.getElementById('damageVignette'),
    screenFlash: document.getElementById('screenFlash'),
  };

  const params = new URLSearchParams(location.search);
  const seedText = params.get('seed') || `${Date.now()}-${Math.random()}`;
  let seed = hashSeed(seedText);
  function hashSeed(text) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng() {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const choose = (arr) => arr[Math.floor(rng() * arr.length)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

  const state = {
    mode: 'title',
    room: 'foyer',
    rooms: {},
    seals: 0,
    captures: 0,
    damageTaken: 0,
    startAt: 0,
    elapsed: 0,
    runId: 1,
    freeze: 0,
    shake: 0,
    transition: 0,
    roomCheckpoint: null,
    lastToastAt: 0,
  };

  const player = {
    x: 270, y: 650, r: 14, face: -Math.PI / 2,
    hp: 3, maxHp: 3, speed: 175,
    heat: 0, overheat: 0, flashCharge: 0, flashCooldown: 0,
    invuln: 0, suctionTarget: null, counterTime: 0,
    lightRangeBonus: 0, suctionBonus: 0,
  };

  const input = {
    x: 0, y: 0, keys: new Set(),
    flashHeld: false, suctionHeld: false,
    joystickPointer: null,
  };

  const particles = [];
  const motes = Array.from({ length: 42 }, () => ({ x: rng() * W, y: rng() * H, r: .5 + rng() * 1.6, s: 4 + rng() * 12, a: .08 + rng() * .18 }));

  const roomBlueprints = {
    foyer: {
      name: '玄関ホール', eyebrow: 'ENTRANCE / 00:03', tone: '#665548', floor: 'wood', required: 1, seal: false,
      furniture: [
        ['umbrella', 108, 420, 48, 82, '傘立て'], ['sofa', 350, 520, 112, 54, '古い長椅子'],
        ['clock', 420, 232, 46, 96, '大時計'], ['table', 185, 280, 86, 50, '受付机'], ['plant', 76, 235, 45, 58, '枯れた鉢'],
      ],
      doors: [
        { id: 'library', x: 42, y: 338, side: 'left', target: 'library', label: '書庫' },
        { id: 'gallery', x: 498, y: 338, side: 'right', target: 'gallery', label: '肖像画室' },
        { id: 'dining', x: 270, y: 160, side: 'top', target: 'dining', label: '食堂' },
      ],
      ghostTypes: ['shade'], fixedPossessed: 'umbrella',
    },
    library: {
      name: '沈黙の書庫', eyebrow: 'WEST WING / 00:17', tone: '#4b5144', floor: 'wood', required: 1, seal: true,
      furniture: [
        ['shelf', 72, 205, 72, 150, '本棚'], ['shelf', 395, 210, 72, 145, '本棚'], ['desk', 198, 374, 142, 62, '読書机'],
        ['chair', 145, 525, 52, 52, '椅子'], ['chest', 364, 535, 82, 56, '木箱'],
      ],
      doors: [{ id: 'foyer', x: 270, y: 724, side: 'bottom', target: 'foyer', label: '玄関へ' }],
      ghostTypes: ['trickster'], hideables: ['shelf', 'chest'], upgrade: 'light',
    },
    gallery: {
      name: '肖像画室', eyebrow: 'EAST WING / 00:19', tone: '#51404a', floor: 'tile', required: 1, seal: true,
      furniture: [
        ['portrait', 82, 205, 62, 88, '肖像画'], ['portrait', 392, 205, 62, 88, '肖像画'], ['bench', 191, 435, 150, 52, '長椅子'],
        ['curtain', 50, 510, 58, 112, 'カーテン'], ['statue', 416, 505, 54, 98, '彫像'],
      ],
      doors: [{ id: 'foyer', x: 270, y: 724, side: 'bottom', target: 'foyer', label: '玄関へ' }],
      ghostTypes: ['shade'], hideables: ['portrait', 'curtain', 'statue'], upgrade: 'suction',
    },
    dining: {
      name: '止まった食堂', eyebrow: 'MAIN HOUSE / 00:34', tone: '#584b3d', floor: 'tile', required: 2, seal: true,
      furniture: [
        ['longtable', 135, 330, 270, 100, '長い食卓'], ['cabinet', 52, 210, 76, 115, '食器棚'], ['cart', 412, 474, 62, 72, '配膳台'],
        ['chandelier', 235, 194, 70, 48, 'シャンデリア'], ['chest', 63, 545, 78, 56, '木箱'],
      ],
      doors: [
        { id: 'foyer', x: 270, y: 724, side: 'bottom', target: 'foyer', label: '玄関へ' },
        { id: 'cellar', x: 270, y: 160, side: 'top', target: 'cellar', label: '地下階段' },
      ],
      ghostTypes: ['shade', 'trickster'], hideables: ['cabinet', 'cart', 'chandelier'], upgrade: 'heart',
    },
    cellar: {
      name: '息をする地下室', eyebrow: 'BASEMENT / 00:49', tone: '#354847', floor: 'stone', required: 1, seal: true,
      furniture: [
        ['boiler', 59, 232, 100, 116, '古いボイラー'], ['crate', 361, 237, 96, 76, '積まれた箱'], ['crate', 82, 520, 80, 70, '積まれた箱'],
        ['barrel', 398, 505, 58, 74, '樽'], ['drain', 224, 410, 90, 44, '排水口'],
      ],
      doors: [
        { id: 'dining', x: 270, y: 724, side: 'bottom', target: 'dining', label: '食堂へ' },
        { id: 'ballroom', x: 270, y: 160, side: 'top', target: 'ballroom', label: '大広間' },
      ],
      ghostTypes: ['brute'], hideables: ['boiler', 'crate', 'barrel'], upgrade: 'cooling',
    },
    ballroom: {
      name: '鏡の大広間', eyebrow: 'SEALED HALL / 01:06', tone: '#403d59', floor: 'marble', required: 1, seal: true,
      furniture: [
        ['mirror', 205, 180, 130, 88, '大鏡'], ['piano', 55, 470, 110, 76, 'ピアノ'], ['sofa', 365, 485, 104, 52, '長椅子'],
        ['statue', 78, 230, 52, 94, '彫像'], ['statue', 410, 230, 52, 94, '彫像'],
      ],
      doors: [{ id: 'cellar', x: 270, y: 724, side: 'bottom', target: 'cellar', label: '地下へ' }],
      ghostTypes: ['mirror'], fixedPossessed: 'mirror',
    },
  };

  function makeRooms() {
    const rooms = {};
    Object.entries(roomBlueprints).forEach(([id, b]) => {
      const furniture = b.furniture.map((f, i) => ({
        id: `${id}-${i}`, type: f[0], x: f[1], y: f[2], w: f[3], h: f[4], label: f[5],
        searched: false, search: 0, possessed: false, rattling: 0, broken: false, loot: null,
      }));
      if (b.fixedPossessed) {
        const fixed = furniture.find((f) => f.type === b.fixedPossessed);
        if (fixed) fixed.possessed = true;
      } else if (b.hideables) {
        const candidates = furniture.filter((f) => b.hideables.includes(f.type));
        shuffle(candidates);
        for (let i = 0; i < Math.min(b.required, candidates.length); i++) candidates[i].possessed = true;
      }
      const safe = furniture.filter((f) => !f.possessed);
      if (safe.length) choose(safe).loot = rng() < .5 ? 'heart' : 'cool';
      rooms[id] = {
        id, name: b.name, eyebrow: b.eyebrow, tone: b.tone, floor: b.floor,
        furniture, doors: b.doors.map((d) => ({ ...d })), ghosts: [],
        required: b.required, captured: 0, cleared: false, seal: b.seal, sealAwarded: false,
        ghostTypes: [...b.ghostTypes], upgrade: b.upgrade || null,
        entered: false, introDone: false,
      };
    });
    return rooms;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function resetRun() {
    state.rooms = makeRooms();
    state.room = 'foyer';
    state.seals = 0;
    state.captures = 0;
    state.damageTaken = 0;
    state.elapsed = 0;
    state.runId += 1;
    player.x = 270; player.y = 650; player.face = -Math.PI / 2;
    player.hp = 3; player.maxHp = 3; player.heat = 0; player.overheat = 0;
    player.flashCharge = 0; player.flashCooldown = 0; player.invuln = 0;
    player.lightRangeBonus = 0; player.suctionBonus = 0; player.suctionTarget = null; player.counterTime = 0;
    particles.length = 0;
    enterRoom('foyer', 'bottom', true);
  }

  function startGame() {
    resetRun();
    state.mode = 'running';
    state.startAt = performance.now();
    els.title.hidden = true;
    els.gameOver.hidden = true;
    els.ending.hidden = true;
    els.shell.dataset.state = 'running';
    updateHud();
    toast('初仕事。まずは、勝手に揺れる物を探す。', 1800);
    initAudio();
  }

  function enterRoom(id, fromSide = 'bottom', initial = false) {
    const room = state.rooms[id];
    state.room = id;
    room.entered = true;
    player.suctionTarget = null;
    player.counterTime = 0;
    player.heat = Math.min(player.heat, .35);
    if (fromSide === 'bottom') { player.x = 270; player.y = 675; player.face = -Math.PI / 2; }
    if (fromSide === 'top') { player.x = 270; player.y = 205; player.face = Math.PI / 2; }
    if (fromSide === 'left') { player.x = 90; player.y = 390; player.face = 0; }
    if (fromSide === 'right') { player.x = 450; player.y = 390; player.face = Math.PI; }
    state.transition = initial ? 0 : .45;
    state.roomCheckpoint = snapshotRoomCheckpoint(id);
    updateHud();
    updateObjective();
    if (!room.introDone) {
      room.introDone = true;
      setTimeout(() => {
        if (state.mode === 'running' && state.room === id) roomIntro(id);
      }, initial ? 800 : 420);
    }
  }

  function roomIntro(id) {
    const lines = {
      foyer: '館内に人はいない。なのに、傘立てだけが揺れている。',
      library: '本のページをめくる音。風はない。',
      gallery: '視線だけが、あなたを追っている。',
      dining: '食器が二つ鳴った。気配も二つ。',
      cellar: '何か重いものが、壁の向こうを歩いている。',
      ballroom: '鏡の中だけ、あなたの後ろに誰かいる。',
    };
    toast(lines[id], 1900);
  }

  function snapshotRoomCheckpoint(id) {
    const r = state.rooms[id];
    return {
      id,
      furniture: r.furniture.map((f) => ({ id: f.id, searched: f.searched, search: f.search, possessed: f.possessed, broken: f.broken, loot: f.loot })),
      captured: r.captured,
      cleared: r.cleared,
      sealAwarded: r.sealAwarded,
      seals: state.seals,
      captures: state.captures,
      player: { hp: player.hp, maxHp: player.maxHp, lightRangeBonus: player.lightRangeBonus, suctionBonus: player.suctionBonus },
    };
  }

  function restoreCheckpoint() {
    const cp = state.roomCheckpoint;
    if (!cp) return startGame();
    const r = state.rooms[cp.id];
    cp.furniture.forEach((saved) => {
      const f = r.furniture.find((x) => x.id === saved.id);
      if (f) Object.assign(f, saved);
    });
    r.ghosts = [];
    r.captured = cp.captured;
    r.cleared = cp.cleared;
    r.sealAwarded = cp.sealAwarded;
    state.seals = cp.seals;
    state.captures = cp.captures;
    player.hp = cp.player.maxHp;
    player.maxHp = cp.player.maxHp;
    player.lightRangeBonus = cp.player.lightRangeBonus;
    player.suctionBonus = cp.player.suctionBonus;
    player.heat = 0; player.overheat = 0; player.invuln = 1;
    state.mode = 'running';
    els.gameOver.hidden = true;
    els.shell.dataset.state = 'running';
    enterRoom(cp.id, 'bottom', true);
    toast('今度は、光を溜めてから近づく。', 1500);
  }

  function currentRoom() { return state.rooms[state.room]; }

  function doorUnlocked(door) {
    const r = currentRoom();
    if (r.id === 'foyer' && door.id === 'library') return r.cleared;
    if (r.id === 'foyer' && door.id === 'gallery') return r.cleared;
    if (r.id === 'foyer' && door.id === 'dining') return state.rooms.library.cleared && state.rooms.gallery.cleared;
    if (r.id === 'dining' && door.id === 'cellar') return r.cleared;
    if (r.id === 'cellar' && door.id === 'ballroom') return r.cleared;
    return true;
  }

  function updateObjective() {
    if (state.mode !== 'running') return;
    const r = currentRoom();
    let text = '';
    if (r.id === 'foyer' && !r.cleared) text = '揺れている傘立てを「吸う」';
    else if (r.id === 'foyer' && !(state.rooms.library.cleared && state.rooms.gallery.cleared)) {
      const left = !state.rooms.library.cleared ? '← 書庫' : '';
      const right = !state.rooms.gallery.cleared ? '肖像画室 →' : '';
      text = `${left}${left && right ? '　/　' : ''}${right}`;
    } else if (r.id === 'foyer') text = '正面の食堂へ';
    else if (!r.cleared && r.ghosts.some((g) => !g.dead)) text = '光で止める → 吸いながら逆へ踏ん張る';
    else if (!r.cleared) text = `気配を探す　${r.captured} / ${r.required}`;
    else if (r.id === 'library' || r.id === 'gallery') text = '玄関へ戻る';
    else if (r.id === 'dining') text = '地下階段が開いた';
    else if (r.id === 'cellar') text = '大広間へ';
    else if (r.id === 'ballroom') text = '最後の封印を回収した';
    els.objective.textContent = text;
  }

  function updateHud() {
    const r = currentRoom();
    els.roomName.textContent = r ? r.name : '玄関ホール';
    els.roomEyebrow.textContent = r ? r.eyebrow : 'MIDNIGHT SHIFT';
    els.sealCount.textContent = `${state.seals} / 5`;
    els.heatBar.style.width = `${Math.round(player.heat * 100)}%`;
    els.heartBar.innerHTML = '';
    for (let i = 0; i < player.maxHp; i++) {
      const h = document.createElement('i');
      h.className = `heart${i >= player.hp ? ' empty' : ''}`;
      els.heartBar.appendChild(h);
    }
    els.suction.classList.toggle('overheated', player.overheat > 0);
  }

  let toastTimer = 0;
  function toast(text, ms = 1300) {
    clearTimeout(toastTimer);
    els.toast.textContent = text;
    els.toast.hidden = false;
    state.lastToastAt = performance.now();
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, ms);
  }

  function setFlashHeld(on) {
    if (state.mode !== 'running') return;
    if (on && player.flashCooldown > 0) return;
    input.flashHeld = on;
    els.flash.classList.toggle('charging', on);
    if (!on && player.flashCharge > 0) releaseFlash();
  }

  function releaseFlash() {
    const charge = clamp(player.flashCharge / 1.15, .1, 1);
    player.flashCharge = 0;
    player.flashCooldown = .48 + .22 * charge;
    els.flashCharge.style.height = '0%';
    mildAutoAim();
    const range = 185 + 105 * charge + player.lightRangeBonus;
    const half = .28 + .34 * charge + player.lightRangeBonus * .0012;
    const stun = 1.05 + 1.65 * charge;
    state.freeze = .045 + .045 * charge;
    state.shake = 2 + charge * 4;
    flashVisual();
    soundFlash(charge);
    vibrate(charge > .7 ? [16, 20, 22] : 16);

    let hit = 0;
    currentRoom().ghosts.forEach((g) => {
      if (g.dead) return;
      const d = dist(player, g);
      const a = Math.atan2(g.y - player.y, g.x - player.x);
      if (d <= range && Math.abs(angleDelta(a, player.face)) <= half) {
        if (g.type === 'decoy') {
          g.dead = true;
          burst(g.x, g.y, '#a9a3ff', 12);
          hit++;
          return;
        }
        g.stunned = Math.max(g.stunned, stun);
        g.reveal = 1;
        g.flashHit = .25;
        hit++;
        burst(g.x, g.y, '#fff0aa', 15);
      }
    });
    currentRoom().furniture.forEach((f) => {
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      const d = Math.hypot(cx - player.x, cy - player.y);
      const a = Math.atan2(cy - player.y, cx - player.x);
      if (!f.searched && f.possessed && d < range && Math.abs(angleDelta(a, player.face)) < half * 1.25) f.rattling = .8;
    });
    if (hit >= 2) toast(`${hit}体まとめて止めた！`, 900);
  }

  function mildAutoAim() {
    const live = currentRoom().ghosts.filter((g) => !g.dead);
    if (!live.length) return;
    live.sort((a, b) => dist(player, a) - dist(player, b));
    const g = live[0];
    const a = Math.atan2(g.y - player.y, g.x - player.x);
    const delta = Math.abs(angleDelta(a, player.face));
    if (dist(player, g) < 300 && delta < 1.0) player.face = a;
  }

  function setSuctionHeld(on) {
    if (state.mode !== 'running') return;
    if (on && player.overheat > 0) return;
    input.suctionHeld = on;
    els.suction.classList.toggle('active', on);
    if (!on) { player.suctionTarget = null; player.counterTime = 0; }
  }

  function update(dt) {
    if (state.mode !== 'running') return;
    if (state.freeze > 0) { state.freeze -= dt; return; }
    state.elapsed = (performance.now() - state.startAt) / 1000;
    state.transition = Math.max(0, state.transition - dt);
    player.flashCooldown = Math.max(0, player.flashCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    if (player.overheat > 0) {
      player.overheat = Math.max(0, player.overheat - dt);
      input.suctionHeld = false;
      els.suction.classList.remove('active');
    }

    if (input.flashHeld && player.flashCooldown <= 0) {
      player.flashCharge = clamp(player.flashCharge + dt, 0, 1.15);
      els.flashCharge.style.height = `${Math.round((player.flashCharge / 1.15) * 100)}%`;
    }

    const move = getMoveVector();
    const chargingSlow = input.flashHeld ? .68 : 1;
    const suctionSlow = input.suctionHeld && player.suctionTarget ? .62 : 1;
    const speed = player.speed * chargingSlow * suctionSlow;
    player.x += move.x * speed * dt;
    player.y += move.y * speed * dt;
    if (Math.hypot(move.x, move.y) > .15) player.face = Math.atan2(move.y, move.x);
    constrainPlayer();
    resolveFurnitureCollisions();

    updateSuction(dt, move);
    updateGhosts(dt);
    updateFurniture(dt);
    updateParticles(dt);
    checkDoors();
    state.shake = Math.max(0, state.shake - dt * 18);
    updateHud();
    updateObjective();
  }

  function getMoveVector() {
    let x = input.x, y = input.y;
    if (input.keys.has('a') || input.keys.has('arrowleft')) x -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright')) x += 1;
    if (input.keys.has('w') || input.keys.has('arrowup')) y -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown')) y += 1;
    const m = Math.hypot(x, y);
    return m > 1 ? { x: x / m, y: y / m } : { x, y };
  }

  function constrainPlayer() {
    player.x = clamp(player.x, FIELD.left + player.r, FIELD.right - player.r);
    player.y = clamp(player.y, FIELD.top + player.r, FIELD.bottom - player.r);
  }

  function resolveFurnitureCollisions() {
    currentRoom().furniture.forEach((f) => {
      if (f.broken || f.type === 'portrait' || f.type === 'curtain' || f.type === 'chandelier' || f.type === 'mirror') return;
      const nearestX = clamp(player.x, f.x, f.x + f.w);
      const nearestY = clamp(player.y, f.y, f.y + f.h);
      const dx = player.x - nearestX, dy = player.y - nearestY;
      const d = Math.hypot(dx, dy);
      if (d < player.r + 2) {
        if (d > .01) { player.x += (dx / d) * (player.r + 2 - d); player.y += (dy / d) * (player.r + 2 - d); }
        else player.y += player.r + 3;
      }
    });
  }

  function updateSuction(dt, move) {
    if (!input.suctionHeld || player.overheat > 0) {
      player.heat = Math.max(0, player.heat - dt * (state.rooms.cellar.cleared ? .38 : .29));
      player.suctionTarget = null;
      player.counterTime = Math.max(0, player.counterTime - dt * 2);
      return;
    }

    let target = null;
    const candidates = currentRoom().ghosts.filter((g) => !g.dead && g.stunned > 0 && dist(player, g) < 178);
    if (candidates.length) {
      candidates.sort((a, b) => dist(player, a) - dist(player, b));
      target = candidates[0];
    }

    if (target) {
      player.suctionTarget = target.id;
      player.heat = clamp(player.heat + dt * .24, 0, 1.05);
      const awayX = player.x - target.x, awayY = player.y - target.y;
      const awayM = Math.hypot(awayX, awayY) || 1;
      const counter = (move.x * awayX + move.y * awayY) / awayM;
      const bonus = counter > .45 ? 1.75 : counter < -.3 ? .62 : 1;
      if (counter > .45) player.counterTime += dt; else player.counterTime = Math.max(0, player.counterTime - dt * 1.7);
      const damage = (24 + player.suctionBonus) * bonus * dt;
      target.hp -= damage;
      target.tether = .12;
      target.x += (player.x - target.x) * dt * (.16 + bonus * .07);
      target.y += (player.y - target.y) * dt * (.16 + bonus * .07);
      if (player.counterTime > .72) {
        player.counterTime = 0;
        target.hp -= 18 + player.suctionBonus * .35;
        target.x += (player.x - target.x) * .13;
        target.y += (player.y - target.y) * .13;
        state.freeze = .055;
        state.shake = 9;
        burst(target.x, target.y, '#8ff5e8', 18);
        soundYank();
        vibrate([26, 18, 26]);
      }
      if (target.hp <= 0) captureGhost(target);
    } else {
      player.suctionTarget = null;
      player.counterTime = 0;
      player.heat = clamp(player.heat + dt * .09, 0, 1.05);
      searchFurniture(dt);
    }

    if (player.heat >= 1) {
      player.overheat = 1.35;
      input.suctionHeld = false;
      player.suctionTarget = null;
      els.suction.classList.remove('active');
      toast('吸霊機が熱い。少し離して冷ます。', 1100);
      soundOverheat();
      vibrate(30);
    }
  }

  function searchFurniture(dt) {
    const nearby = currentRoom().furniture
      .filter((f) => !f.searched && !f.broken)
      .map((f) => ({ f, d: Math.hypot((f.x + f.w / 2) - player.x, (f.y + f.h / 2) - player.y) }))
      .filter((o) => o.d < 125)
      .sort((a, b) => a.d - b.d);
    if (!nearby.length) return;
    const f = nearby[0].f;
    f.search = clamp(f.search + dt * 1.25, 0, 1);
    f.rattling = Math.max(f.rattling, .12);
    if (f.search >= 1) revealFurniture(f);
  }

  function revealFurniture(f) {
    if (f.searched) return;
    f.searched = true;
    f.search = 1;
    if (f.possessed) {
      f.broken = true;
      const type = currentRoom().ghostTypes[Math.min(currentRoom().captured, currentRoom().ghostTypes.length - 1)] || 'shade';
      spawnGhost(type, f.x + f.w / 2, f.y + f.h / 2);
      burst(f.x + f.w / 2, f.y + f.h / 2, '#b9b2ff', 22);
      state.shake = 7;
      soundReveal();
      vibrate([20, 45, 26]);
      toast('いた。光を溜めて、正面から！', 1100);
    } else if (f.loot === 'heart') {
      if (player.hp < player.maxHp) {
        player.hp++;
        toast('古い救急箱。体力が1戻った。', 1000);
      } else toast('何もいない。ここは安全。', 800);
      f.loot = null;
      soundPickup();
    } else if (f.loot === 'cool') {
      player.heat = 0;
      toast('冷却缶を発見。吸霊機が冷えた。', 1000);
      f.loot = null;
      soundPickup();
    } else {
      toast('空っぽ。気配は別の場所だ。', 720);
    }
  }

  let ghostSerial = 0;
  function spawnGhost(type, x, y) {
    const spec = {
      shade: { hp: 72, speed: 72, radius: 24, color: '#b0a8ff' },
      trickster: { hp: 82, speed: 88, radius: 22, color: '#e39fcf' },
      brute: { hp: 150, speed: 53, radius: 31, color: '#8fcfc8' },
      mirror: { hp: 250, speed: 67, radius: 34, color: '#b7b2ff' },
      decoy: { hp: 1, speed: 74, radius: 22, color: '#807ca8' },
    }[type];
    const g = {
      id: `g${++ghostSerial}`, type, x: clamp(x, 70, 470), y: clamp(y, 190, 650),
      hp: spec.hp, maxHp: spec.hp, speed: spec.speed, radius: spec.radius, color: spec.color,
      stunned: .18, reveal: 1, attackCooldown: 1.2, wander: rng() * Math.PI * 2,
      phase: rng() * 8, dash: 0, teleport: 2 + rng() * 1.8, tether: 0, flashHit: 0,
      dead: false, decoyTimer: type === 'decoy' ? 5 : 0, spawnedPhase: 0,
    };
    currentRoom().ghosts.push(g);
    return g;
  }

  function updateGhosts(dt) {
    const room = currentRoom();
    room.ghosts.forEach((g) => {
      if (g.dead) return;
      g.phase += dt * 3;
      g.attackCooldown -= dt;
      g.stunned = Math.max(0, g.stunned - dt);
      g.reveal = Math.max(.28, g.reveal - dt * .12);
      g.tether = Math.max(0, g.tether - dt);
      g.flashHit = Math.max(0, g.flashHit - dt);
      if (g.type === 'decoy') {
        g.decoyTimer -= dt;
        if (g.decoyTimer <= 0) { g.dead = true; return; }
      }
      if (g.stunned > 0 || player.suctionTarget === g.id) return;

      const dx = player.x - g.x, dy = player.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      let vx = dx / d, vy = dy / d;
      if (g.type === 'trickster') {
        const side = Math.sin(g.phase * .7) > 0 ? 1 : -1;
        vx = vx * .65 + (-dy / d) * .76 * side;
        vy = vy * .65 + (dx / d) * .76 * side;
        g.teleport -= dt;
        if (g.teleport < 0 && d > 125) {
          g.teleport = 2.4 + rng() * 1.2;
          g.x = clamp(player.x + Math.cos(g.phase + 2.2) * 145, 70, 470);
          g.y = clamp(player.y + Math.sin(g.phase + 2.2) * 145, 200, 650);
          burst(g.x, g.y, g.color, 10);
        }
      }
      if (g.type === 'brute') {
        g.dash -= dt;
        if (g.dash < -1.1 && d > 120 && d < 330) { g.dash = .48; soundGrowl(); }
        if (g.dash > 0) { vx *= 2.6; vy *= 2.6; }
      }
      if (g.type === 'mirror') {
        const hpRatio = g.hp / g.maxHp;
        const phase = hpRatio < .34 ? 2 : hpRatio < .68 ? 1 : 0;
        if (phase > g.spawnedPhase) {
          g.spawnedPhase = phase;
          for (let i = 0; i < phase + 1; i++) {
            const a = (Math.PI * 2 * i) / (phase + 1) + rng();
            spawnGhost('decoy', player.x + Math.cos(a) * 160, player.y + Math.sin(a) * 150);
          }
          toast('鏡像が増えた。本物だけが吸える。', 1200);
        }
        vx += Math.sin(g.phase * .45) * .32;
      }

      const vm = Math.hypot(vx, vy) || 1;
      g.x += (vx / vm) * g.speed * dt * (g.dash > 0 ? 2.2 : 1);
      g.y += (vy / vm) * g.speed * dt * (g.dash > 0 ? 2.2 : 1);
      g.x = clamp(g.x, 48, 492); g.y = clamp(g.y, 170, 690);

      if (d < g.radius + player.r + 8 && g.attackCooldown <= 0) {
        g.attackCooldown = g.type === 'brute' ? 1.55 : 1.05;
        hurtPlayer(g, g.type === 'brute' ? 1 : 1);
      }
    });
    room.ghosts = room.ghosts.filter((g) => !g.dead || g.type !== 'decoy');
  }

  function captureGhost(g) {
    if (g.dead) return;
    g.dead = true;
    currentRoom().captured++;
    state.captures++;
    player.suctionTarget = null;
    input.suctionHeld = false;
    els.suction.classList.remove('active');
    player.heat = Math.max(0, player.heat - .25);
    state.freeze = .13;
    state.shake = 12;
    burst(g.x, g.y, '#dffff8', 36);
    soundCapture();
    vibrate([35, 25, 55]);
    if (currentRoom().captured >= currentRoom().required) clearRoom(currentRoom());
    else toast(`捕獲！　あと${currentRoom().required - currentRoom().captured}体。`, 1000);
  }

  function clearRoom(room) {
    if (room.cleared) return;
    room.cleared = true;
    if (room.seal && !room.sealAwarded) {
      room.sealAwarded = true;
      state.seals++;
      soundSeal();
      toast(`封印片を回収　${state.seals} / 5`, 1400);
    } else toast('玄関の左右の扉が開いた。', 1300);

    if (room.upgrade === 'light') {
      player.lightRangeBonus += 38;
      setTimeout(() => toast('書庫のレンズ：光の範囲が広がった。', 1300), 1500);
    }
    if (room.upgrade === 'suction') {
      player.suctionBonus += 8;
      setTimeout(() => toast('銀のノズル：吸引力が上がった。', 1300), 1500);
    }
    if (room.upgrade === 'heart' && player.maxHp < 4) {
      player.maxHp = 4; player.hp = 4;
      setTimeout(() => toast('厨房の護符：体力が1増えた。', 1300), 1500);
    }
    if (room.upgrade === 'cooling') {
      setTimeout(() => toast('地下の冷却管：熱が早く抜ける。', 1300), 1500);
    }
    if (room.id === 'ballroom') setTimeout(finishGame, 1300);
    updateHud();
    updateObjective();
  }

  function hurtPlayer(g) {
    if (player.invuln > 0 || state.mode !== 'running') return;
    player.hp--;
    player.invuln = 1.05;
    state.damageTaken++;
    state.shake = 13;
    const dx = player.x - g.x, dy = player.y - g.y, d = Math.hypot(dx, dy) || 1;
    player.x += (dx / d) * 34; player.y += (dy / d) * 34;
    player.suctionTarget = null;
    input.suctionHeld = false;
    els.suction.classList.remove('active');
    els.damage.classList.add('show');
    setTimeout(() => els.damage.classList.remove('show'), 170);
    soundHit(); vibrate([45, 25, 35]);
    updateHud();
    if (player.hp <= 0) gameOver();
  }

  function gameOver() {
    state.mode = 'gameover';
    input.flashHeld = input.suctionHeld = false;
    els.gameOverCopy.textContent = `${currentRoom().name}から再開できます。見つけた安全な家具は覚えておこう。`;
    els.gameOver.hidden = false;
    els.shell.dataset.state = 'gameover';
  }

  function finishGame() {
    if (state.mode !== 'running') return;
    state.mode = 'ending';
    const seconds = Math.max(1, Math.round(state.elapsed));
    const timeText = formatTime(seconds);
    const key = 'midnightHauntedCleanerBest';
    const old = Number(localStorage.getItem(key) || 0);
    let bestText = '';
    if (!old || seconds < old) {
      localStorage.setItem(key, String(seconds));
      bestText = old ? `BEST更新：${formatTime(old)} → ${timeText}` : '初回クリア記録を保存しました。';
    } else bestText = `BEST ${formatTime(old)}　あと${seconds - old}秒で更新`;
    els.clearTime.textContent = timeText;
    els.captureCount.textContent = String(state.captures);
    els.damageCount.textContent = String(state.damageTaken);
    els.bestCopy.textContent = bestText;
    els.ending.hidden = false;
    els.shell.dataset.state = 'ending';
    soundEnding();
  }

  function formatTime(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function updateFurniture(dt) {
    currentRoom().furniture.forEach((f) => {
      f.rattling = Math.max(0, f.rattling - dt);
      if (f.possessed && !f.searched && rng() < dt * .18) f.rattling = .35;
    });
  }

  function checkDoors() {
    if (state.transition > 0) return;
    const r = currentRoom();
    for (const d of r.doors) {
      if (Math.hypot(player.x - d.x, player.y - d.y) < 34) {
        if (!doorUnlocked(d)) {
          if (performance.now() - state.lastToastAt > 1100) toast('まだ封印されている。別の部屋を掃除する。', 850);
          pushFromDoor(d);
          return;
        }
        const from = d.side === 'top' ? 'bottom' : d.side === 'bottom' ? 'top' : d.side === 'left' ? 'right' : 'left';
        soundDoor();
        enterRoom(d.target, from);
        return;
      }
    }
  }

  function pushFromDoor(d) {
    if (d.side === 'top') player.y += 18;
    if (d.side === 'bottom') player.y -= 18;
    if (d.side === 'left') player.x += 18;
    if (d.side === 'right') player.x -= 18;
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= .985; p.vy *= .985;
      if (p.life <= 0) particles.splice(i, 1);
    }
    motes.forEach((m) => {
      m.y += m.s * dt;
      m.x += Math.sin((m.y + m.r) * .01) * dt * 5;
      if (m.y > H) { m.y = 125; m.x = rng() * W; }
    });
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2, s = 30 + rng() * 130;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .35 + rng() * .7, max: 1, r: 1.5 + rng() * 3.5, color });
    }
  }

  function render() {
    ctx.save();
    const sx = state.shake ? (rng() - .5) * state.shake : 0;
    const sy = state.shake ? (rng() - .5) * state.shake : 0;
    ctx.translate(sx, sy);
    drawRoom();
    drawDoors();
    drawFurniture();
    drawParticles(false);
    drawGhosts();
    drawPlayer();
    drawSuctionBeam();
    drawLighting();
    drawParticles(true);
    ctx.restore();
    if (state.transition > 0) {
      ctx.fillStyle = `rgba(0,0,0,${clamp(state.transition * 1.8, 0, .8)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawRoom() {
    const r = currentRoom();
    ctx.fillStyle = '#0b0c0e'; ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, FIELD.top, 0, FIELD.bottom);
    grad.addColorStop(0, r.tone); grad.addColorStop(1, '#18191b');
    ctx.fillStyle = grad; roundRect(ctx, FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top, 12); ctx.fill();
    ctx.save();
    ctx.beginPath(); roundRect(ctx, FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top, 12); ctx.clip();
    if (r.floor === 'wood') {
      for (let y = FIELD.top; y < FIELD.bottom; y += 27) {
        ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(FIELD.left, y); ctx.lineTo(FIELD.right, y); ctx.stroke();
      }
      for (let x = FIELD.left; x < FIELD.right; x += 70) {
        ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.moveTo(x, FIELD.top); ctx.lineTo(x + 22, FIELD.bottom); ctx.stroke();
      }
    } else if (r.floor === 'tile' || r.floor === 'marble') {
      for (let x = FIELD.left; x < FIELD.right; x += 54) for (let y = FIELD.top; y < FIELD.bottom; y += 54) {
        ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.strokeRect(x, y, 54, 54);
      }
    } else {
      for (let i = 0; i < 75; i++) {
        const x = FIELD.left + ((i * 83) % 480), y = FIELD.top + ((i * 47) % 590);
        ctx.fillStyle = 'rgba(0,0,0,.09)'; ctx.fillRect(x, y, 24 + (i % 4) * 7, 2);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.fillRect(FIELD.left, FIELD.top, 16, FIELD.bottom - FIELD.top); ctx.fillRect(FIELD.right - 16, FIELD.top, 16, FIELD.bottom - FIELD.top);
    ctx.restore();
    motes.forEach((m) => { ctx.fillStyle = `rgba(245,238,210,${m.a})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill(); });
  }

  function drawDoors() {
    const r = currentRoom();
    r.doors.forEach((d) => {
      const unlocked = doorUnlocked(d);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.fillStyle = unlocked ? '#2a241f' : '#17171a';
      ctx.strokeStyle = unlocked ? 'rgba(255,220,148,.4)' : 'rgba(214,96,104,.35)';
      ctx.lineWidth = 2;
      if (d.side === 'top' || d.side === 'bottom') {
        ctx.fillRect(-38, -14, 76, 28); ctx.strokeRect(-38, -14, 76, 28);
      } else { ctx.fillRect(-14, -38, 28, 76); ctx.strokeRect(-14, -38, 28, 76); }
      ctx.fillStyle = unlocked ? '#f0d99c' : '#9a575b';
      ctx.font = '800 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const ox = d.side === 'left' ? 39 : d.side === 'right' ? -39 : 0;
      const oy = d.side === 'top' ? 28 : d.side === 'bottom' ? -28 : 0;
      ctx.fillText(unlocked ? d.label : '封印', ox, oy);
      ctx.restore();
    });
  }

  function drawFurniture() {
    currentRoom().furniture.forEach((f) => {
      ctx.save();
      let rx = f.x, ry = f.y;
      if (f.rattling > 0) { rx += (rng() - .5) * 5; ry += (rng() - .5) * 4; }
      ctx.translate(rx, ry);
      const alpha = f.broken ? .42 : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = furnitureColor(f.type);
      ctx.strokeStyle = 'rgba(255,255,255,.13)';
      ctx.lineWidth = 1.2;
      if (f.type === 'portrait' || f.type === 'mirror') {
        ctx.fillRect(0, 0, f.w, f.h); ctx.strokeRect(0, 0, f.w, f.h);
        ctx.fillStyle = f.type === 'mirror' ? 'rgba(170,190,210,.24)' : 'rgba(15,12,16,.75)'; ctx.fillRect(7, 7, f.w - 14, f.h - 14);
        if (f.type === 'portrait') { ctx.fillStyle = 'rgba(220,210,190,.25)'; ctx.beginPath(); ctx.arc(f.w/2, f.h*.42, 12, 0, Math.PI*2); ctx.fill(); }
      } else if (f.type === 'curtain') {
        for (let x = 0; x < f.w; x += 9) { ctx.fillStyle = x % 18 ? '#44303b' : '#35262f'; ctx.fillRect(x, 0, 9, f.h); }
      } else if (f.type === 'chandelier') {
        ctx.strokeStyle = '#8c7c5f'; ctx.beginPath(); ctx.moveTo(f.w/2, -45); ctx.lineTo(f.w/2, 15); ctx.stroke();
        ctx.fillStyle = '#7b694d'; ctx.beginPath(); ctx.ellipse(f.w/2, f.h/2, f.w/2, f.h/3, 0, 0, Math.PI*2); ctx.fill();
      } else if (f.type === 'plant') {
        ctx.fillRect(8, f.h - 25, f.w - 16, 25); ctx.fillStyle = '#394235';
        for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(f.w/2+(i-2)*6,22+i%2*7,8,24,(i-2)*.25,0,Math.PI*2);ctx.fill();}
      } else if (f.type === 'statue') {
        ctx.fillStyle = '#6c6c68'; ctx.fillRect(f.w*.28, f.h*.3, f.w*.44, f.h*.58); ctx.beginPath(); ctx.arc(f.w/2, f.h*.22, f.w*.23, 0, Math.PI*2); ctx.fill(); ctx.fillRect(0, f.h*.87, f.w, f.h*.13);
      } else if (f.type === 'drain') {
        ctx.fillStyle = '#202326'; roundRect(ctx, 0, 0, f.w, f.h, 12); ctx.fill(); for(let x=10;x<f.w;x+=14){ctx.fillStyle='#0c0d0e';ctx.fillRect(x,6,5,f.h-12);}
      } else if (f.type === 'barrel') {
        ctx.fillStyle = '#493a2b'; roundRect(ctx, 4, 0, f.w-8, f.h, 18); ctx.fill(); ctx.strokeStyle='#81715a';ctx.beginPath();ctx.moveTo(5,f.h*.28);ctx.lineTo(f.w-5,f.h*.28);ctx.moveTo(5,f.h*.72);ctx.lineTo(f.w-5,f.h*.72);ctx.stroke();
      } else {
        roundRect(ctx, 0, 0, f.w, f.h, Math.min(10, f.h*.2)); ctx.fill(); ctx.stroke();
        if (['shelf','cabinet'].includes(f.type)) { for(let y=18;y<f.h;y+=26){ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(5,y);ctx.lineTo(f.w-5,y);ctx.stroke();} }
        if (f.type === 'piano') { ctx.fillStyle='#121216';ctx.fillRect(9,13,f.w-18,22); for(let x=12;x<f.w-14;x+=7){ctx.fillStyle='#c9c5b8';ctx.fillRect(x,15,5,16);} }
      }
      if (f.search > 0 && !f.searched) {
        ctx.globalAlpha = 1; ctx.strokeStyle = '#8ff5e8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.w/2, f.h/2, 20 + f.search*13, -Math.PI/2, -Math.PI/2 + Math.PI*2*f.search); ctx.stroke();
      }
      if (f.broken) { ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(2,2);ctx.lineTo(f.w-4,f.h-3);ctx.moveTo(f.w-5,5);ctx.lineTo(6,f.h-4);ctx.stroke(); }
      ctx.restore();
    });
  }

  function furnitureColor(type) {
    if (['shelf','desk','table','longtable','chest','cabinet','cart','bench','chair','umbrella'].includes(type)) return '#4d3e31';
    if (type === 'sofa') return '#45413e';
    if (type === 'clock') return '#3e332a';
    if (type === 'boiler') return '#3c4b4a';
    if (type === 'crate') return '#594733';
    if (type === 'piano') return '#27262a';
    return '#49484a';
  }

  function drawPlayer() {
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.face);
    const blink = player.invuln > 0 && Math.floor(player.invuln * 14) % 2 === 0;
    ctx.globalAlpha = blink ? .35 : 1;
    ctx.fillStyle = '#d5c9a3'; ctx.beginPath(); ctx.arc(0, 0, player.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2e3437'; roundRect(ctx, -11, 4, 22, 20, 6); ctx.fill();
    ctx.fillStyle = '#8ff5e8'; roundRect(ctx, -7, 8, 14, 13, 4); ctx.fill();
    ctx.fillStyle = '#f6dda0'; ctx.fillRect(9, -4, 24, 8);
    ctx.fillStyle = '#fff2b7'; ctx.beginPath(); ctx.arc(35,0,5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawGhosts() {
    currentRoom().ghosts.forEach((g) => {
      if (g.dead) return;
      ctx.save(); ctx.translate(g.x, g.y + Math.sin(g.phase) * 4);
      const alpha = g.stunned > 0 ? .96 : .68 * g.reveal;
      ctx.globalAlpha = alpha;
      if (g.flashHit > 0) { ctx.shadowColor='#fff4bd';ctx.shadowBlur=28; }
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.moveTo(-g.radius, 0); ctx.quadraticCurveTo(-g.radius*.8,-g.radius*1.2,0,-g.radius*1.15); ctx.quadraticCurveTo(g.radius*.8,-g.radius*1.2,g.radius,0);
      ctx.quadraticCurveTo(g.radius*.7,g.radius*.85,g.radius*.32,g.radius*.58);ctx.quadraticCurveTo(0,g.radius*1.05,-g.radius*.32,g.radius*.58);ctx.quadraticCurveTo(-g.radius*.7,g.radius*.85,-g.radius,0);ctx.fill();
      ctx.fillStyle = g.stunned > 0 ? '#242026' : '#16151b';
      ctx.beginPath();ctx.arc(-g.radius*.32,-g.radius*.18,4.2,0,Math.PI*2);ctx.arc(g.radius*.32,-g.radius*.18,4.2,0,Math.PI*2);ctx.fill();
      if (g.type !== 'decoy') {
        const hp = clamp(g.hp / g.maxHp, 0, 1);
        ctx.globalAlpha=.9;ctx.fillStyle='rgba(0,0,0,.5)';roundRect(ctx,-31,g.radius+12,62,7,4);ctx.fill();ctx.fillStyle=g.stunned>0?'#8ff5e8':'#d9c576';roundRect(ctx,-31,g.radius+12,62*hp,7,4);ctx.fill();
      }
      if (g.stunned > 0) {
        ctx.globalAlpha=.9;ctx.fillStyle='#fff0a7';for(let i=0;i<3;i++){const a=g.phase+i*Math.PI*2/3;ctx.beginPath();ctx.arc(Math.cos(a)*g.radius*.85,-g.radius*1.35+Math.sin(a)*7,2.6,0,Math.PI*2);ctx.fill();}
      }
      ctx.restore();
    });
  }

  function drawSuctionBeam() {
    if (!input.suctionHeld || player.overheat > 0) return;
    ctx.save();
    if (player.suctionTarget) {
      const g = currentRoom().ghosts.find((x) => x.id === player.suctionTarget && !x.dead);
      if (g) {
        const grad = ctx.createLinearGradient(player.x, player.y, g.x, g.y); grad.addColorStop(0,'rgba(143,245,232,.08)');grad.addColorStop(.55,'rgba(143,245,232,.45)');grad.addColorStop(1,'rgba(230,255,250,.75)');
        ctx.strokeStyle=grad;ctx.lineWidth=5+Math.sin(performance.now()*.03)*1.5;ctx.setLineDash([10,8]);ctx.lineDashOffset=-performance.now()*.05;ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.quadraticCurveTo((player.x+g.x)/2+(rng()-.5)*12,(player.y+g.y)/2+(rng()-.5)*12,g.x,g.y);ctx.stroke();
      }
    } else {
      ctx.strokeStyle='rgba(143,245,232,.24)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(player.x+Math.cos(player.face)*84,player.y+Math.sin(player.face)*84);ctx.stroke();
    }
    ctx.restore();
  }

  function drawLighting() {
    ctx.save();
    ctx.fillStyle='rgba(2,3,5,.49)';ctx.fillRect(0,FIELD.top,W,FIELD.bottom-FIELD.top);
    const range = 220 + player.lightRangeBonus*.6 + player.flashCharge*55;
    const half=.42+player.flashCharge*.14;
    const a1=player.face-half,a2=player.face+half;
    const grad=ctx.createRadialGradient(player.x,player.y,10,player.x,player.y,range);grad.addColorStop(0,'rgba(255,237,177,.22)');grad.addColorStop(.65,'rgba(255,221,139,.095)');grad.addColorStop(1,'rgba(255,220,130,0)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.arc(player.x,player.y,range,a1,a2);ctx.closePath();ctx.fill();
    const glow=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,70);glow.addColorStop(0,'rgba(255,239,191,.16)');glow.addColorStop(1,'rgba(255,239,191,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(player.x,player.y,70,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawParticles(front) {
    particles.forEach((p, i) => {
      if ((i % 2 === 0) !== front) return;
      ctx.globalAlpha=clamp(p.life/.7,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    });
  }

  function flashVisual() {
    els.screenFlash.classList.remove('show'); void els.screenFlash.offsetWidth; els.screenFlash.classList.add('show');
  }

  function roundRect(c,x,y,w,h,r){
    if(w<0){x+=w;w=-w}if(h<0){y+=h;h=-h}r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.033, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function joystickPoint(e) {
    const r = els.joystick.getBoundingClientRect();
    return { x: e.clientX - (r.left + r.width/2), y: e.clientY - (r.top + r.height/2), radius: r.width*.36 };
  }
  function updateJoystick(e) {
    const p=joystickPoint(e),m=Math.hypot(p.x,p.y)||1,lim=Math.min(m,p.radius),nx=p.x/m,ny=p.y/m;
    input.x=nx*(lim/p.radius);input.y=ny*(lim/p.radius);els.stick.style.transform=`translate(${nx*lim}px,${ny*lim}px)`;
  }
  els.joystick.addEventListener('pointerdown',(e)=>{input.joystickPointer=e.pointerId;els.joystick.setPointerCapture(e.pointerId);updateJoystick(e);});
  els.joystick.addEventListener('pointermove',(e)=>{if(input.joystickPointer===e.pointerId)updateJoystick(e);});
  const endJoy=(e)=>{if(input.joystickPointer!==e.pointerId)return;input.joystickPointer=null;input.x=input.y=0;els.stick.style.transform='translate(0,0)';};
  els.joystick.addEventListener('pointerup',endJoy);els.joystick.addEventListener('pointercancel',endJoy);

  const holdButton=(el,onDown,onUp)=>{
    el.addEventListener('pointerdown',(e)=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);onDown();});
    el.addEventListener('pointerup',(e)=>{e.preventDefault();onUp();});
    el.addEventListener('pointercancel',onUp);el.addEventListener('pointerleave',(e)=>{if(e.buttons===0)onUp();});
  };
  holdButton(els.flash,()=>setFlashHeld(true),()=>setFlashHeld(false));
  holdButton(els.suction,()=>setSuctionHeld(true),()=>setSuctionHeld(false));

  window.addEventListener('keydown',(e)=>{
    const k=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){input.keys.add(k);e.preventDefault();}
    if((e.code==='Space'||k===' ')&&!e.repeat){setFlashHeld(true);e.preventDefault();}
    if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat){setSuctionHeld(true);e.preventDefault();}
  });
  window.addEventListener('keyup',(e)=>{
    const k=e.key.toLowerCase();input.keys.delete(k);
    if(e.code==='Space'||k===' '){setFlashHeld(false);e.preventDefault();}
    if(e.code==='ShiftLeft'||e.code==='ShiftRight'){setSuctionHeld(false);e.preventDefault();}
  });
  window.addEventListener('blur',()=>{input.keys.clear();input.x=input.y=0;setFlashHeld(false);setSuctionHeld(false);});

  els.start.addEventListener('click',startGame);
  els.retry.addEventListener('click',restoreCheckpoint);
  els.restartFromOver.addEventListener('click',startGame);
  els.restart.addEventListener('click',startGame);

  let audioCtx=null;
  function initAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}catch{audioCtx=null}}
  function tone(freq,duration,type='sine',gain=.045,slide=0){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),audioCtx.currentTime+duration);g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}
  function soundFlash(c){tone(450+c*340,.14,'sawtooth',.035,420);tone(1160,.08,'sine',.025,-280)}
  function soundReveal(){tone(150,.28,'sawtooth',.05,-85);setTimeout(()=>tone(82,.36,'square',.025,-30),80)}
  function soundYank(){tone(118,.09,'square',.045,140);tone(260,.08,'sawtooth',.03,-90)}
  function soundCapture(){tone(180,.18,'sawtooth',.04,400);setTimeout(()=>tone(570,.24,'sine',.04,260),100)}
  function soundOverheat(){tone(150,.35,'square',.025,-70)}
  function soundPickup(){tone(620,.09,'sine',.03,120);setTimeout(()=>tone(850,.12,'sine',.025,80),80)}
  function soundSeal(){tone(260,.18,'sine',.04,140);setTimeout(()=>tone(520,.24,'sine',.04,260),140)}
  function soundHit(){tone(95,.2,'sawtooth',.055,-40)}
  function soundDoor(){tone(76,.28,'triangle',.035,-25)}
  function soundGrowl(){tone(62,.42,'sawtooth',.025,-22)}
  function soundEnding(){tone(330,.26,'sine',.035,110);setTimeout(()=>tone(440,.3,'sine',.035,220),210);setTimeout(()=>tone(660,.45,'sine',.03,220),430)}
  function vibrate(pattern){try{navigator.vibrate?.(pattern)}catch{}}

  window.__playtestSnapshot = () => {
    const r=currentRoom();
    return JSON.parse(JSON.stringify({
      mode:state.mode,room:state.room,roomName:r.name,seals:state.seals,captures:state.captures,damageTaken:state.damageTaken,elapsed:state.elapsed,
      player:{x:player.x,y:player.y,hp:player.hp,maxHp:player.maxHp,face:player.face,heat:player.heat,flashCharge:player.flashCharge,flashCooldown:player.flashCooldown,lightRangeBonus:player.lightRangeBonus,suctionBonus:player.suctionBonus},
      roomState:{cleared:r.cleared,captured:r.captured,required:r.required},
      ghosts:r.ghosts.filter(g=>!g.dead).map(g=>({id:g.id,type:g.type,x:g.x,y:g.y,hp:g.hp,maxHp:g.maxHp,stunned:g.stunned})),
      furniture:r.furniture.map(f=>({id:f.id,type:f.type,label:f.label,x:f.x,y:f.y,w:f.w,h:f.h,searched:f.searched,search:f.search,possessed:f.possessed,broken:f.broken})),
      doors:r.doors.map(d=>({...d,unlocked:doorUnlocked(d)})),
      clearedRooms:Object.fromEntries(Object.entries(state.rooms).map(([id,room])=>[id,room.cleared])),
    }));
  };

  state.rooms = makeRooms();
  updateHud(); updateObjective();
  requestAnimationFrame(loop);
})();