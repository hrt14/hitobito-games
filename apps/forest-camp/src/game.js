const SAVE_KEY = "forest-camp-save-v1";
const TICK_MS = 1000 / 30;
const RESOURCE_EMOJI = { wood: "🪵", meat: "🥩", stone: "🪨", hide: "🧥", iron: "⛓️" };
const RESOURCE_LABEL = { wood: "マキ", meat: "肉", stone: "石", hide: "皮", iron: "鉄" };

const facilityDefs = {
  furnace: {
    name: "炉",
    emoji: "🔥",
    desc: "キャンプの中心。温度・解放範囲・生存者上限に影響する。",
    x: 50,
    y: 50,
    size: 98,
    maxLevel: 8,
    workerCap: () => 1,
    requirement: () => true,
    buildCost: {},
    upgradeCost: (level) => ({ wood: 7 + level * 9, meat: Math.max(0, level - 1) * 3, stone: Math.max(0, level - 2) * 5 }),
    effect: (level) => `暖房範囲 +${level * 8}% / 温度低下を軽減`,
  },
  storage: {
    name: "倉庫",
    emoji: "📦",
    desc: "資源の保管上限とプレイヤーの運搬量を増やす。",
    x: 35,
    y: 60,
    size: 74,
    maxLevel: 7,
    workerCap: () => 0,
    requirement: (state) => state.facilities.furnace.level >= 1,
    buildCost: { wood: 10 },
    upgradeCost: (level) => ({ wood: 12 + level * 12, meat: level >= 3 ? 8 : 0, stone: Math.max(0, level - 2) * 6 }),
    effect: (level) => `保管上限 +${level * 35} / 運搬量 +${level * 4}`,
  },
  lodging: {
    name: "宿舎",
    emoji: "🏕️",
    desc: "生存者が定着し、作業員を増やせる。",
    x: 64,
    y: 61,
    size: 78,
    maxLevel: 7,
    workerCap: () => 0,
    requirement: (state) => state.facilities.furnace.level >= 2,
    buildCost: { wood: 22, meat: 6 },
    upgradeCost: (level) => ({ wood: 20 + level * 15, meat: 8 + level * 5, stone: Math.max(0, level - 2) * 8 }),
    effect: (level) => `生存者上限 +${level * 3} / 到着しやすくなる`,
  },
  woodCamp: {
    name: "伐採所",
    emoji: "🪓",
    desc: "作業員を配置するとマキを自動回収する。",
    x: 22,
    y: 38,
    size: 82,
    maxLevel: 7,
    workerCap: (level) => 1 + Math.floor(level / 2),
    requirement: (state) => state.facilities.storage.unlocked,
    buildCost: { wood: 24 },
    upgradeCost: (level) => ({ wood: 20 + level * 18, meat: level >= 2 ? 6 + level * 2 : 0, stone: Math.max(0, level - 3) * 9 }),
    effect: (level) => `マキ自動生産 ${formatRate(prodRates.wood(level))}/秒/人`,
  },
  huntingGround: {
    name: "狩場",
    emoji: "🏹",
    desc: "作業員を配置すると肉を自動回収する。たまに皮も拾う。",
    x: 78,
    y: 42,
    size: 82,
    maxLevel: 7,
    workerCap: (level) => 1 + Math.floor(level / 2),
    requirement: (state) => state.facilities.lodging.unlocked && state.facilities.woodCamp.unlocked,
    buildCost: { wood: 22, meat: 8 },
    upgradeCost: (level) => ({ wood: 26 + level * 16, meat: 10 + level * 5, stone: Math.max(0, level - 3) * 8 }),
    effect: (level) => `肉自動生産 ${formatRate(prodRates.meat(level))}/秒/人`,
  },
  kitchen: {
    name: "調理場",
    emoji: "🍲",
    desc: "肉の消費効率を上げ、生存者の到着速度を上げる。",
    x: 63,
    y: 36,
    size: 70,
    maxLevel: 6,
    workerCap: (level) => Math.min(2, level),
    requirement: (state) => state.facilities.huntingGround.unlocked && state.facilities.furnace.level >= 3,
    buildCost: { wood: 36, meat: 18 },
    upgradeCost: (level) => ({ wood: 24 + level * 18, meat: 18 + level * 8, stone: Math.max(0, level - 2) * 6 }),
    effect: (level) => `生存者到着 +${level * 12}% / 食料消費を軽減`,
  },
  quarry: {
    name: "石切場",
    emoji: "⛏️",
    desc: "中盤資源の石を自動回収する。炉や倉庫の高レベル強化に必要。",
    x: 48,
    y: 22,
    size: 78,
    maxLevel: 6,
    workerCap: (level) => 1 + Math.floor(level / 2),
    requirement: (state) => state.facilities.furnace.level >= 3 && state.facilities.storage.level >= 2,
    buildCost: { wood: 48, meat: 18 },
    upgradeCost: (level) => ({ wood: 42 + level * 18, meat: 18 + level * 6, stone: 12 + level * 8 }),
    effect: (level) => `石自動生産 ${formatRate(prodRates.stone(level))}/秒/人`,
  },
  wall: {
    name: "防壁",
    emoji: "🛡️",
    desc: "吹雪と獣の被害を軽減する。今後の防衛要素の土台。",
    x: 50,
    y: 76,
    size: 86,
    maxLevel: 5,
    workerCap: () => 0,
    requirement: (state) => state.facilities.quarry.unlocked,
    buildCost: { wood: 60, stone: 25 },
    upgradeCost: (level) => ({ wood: 50 + level * 22, meat: 12 + level * 4, stone: 22 + level * 12 }),
    effect: (level) => `温度低下 -${level * 6}% / 襲撃対策`,
  },
};

const prodRates = {
  wood: (level) => 0.10 + level * 0.055,
  meat: (level) => 0.065 + level * 0.038,
  stone: (level) => 0.035 + level * 0.026,
};

const quests = [
  { title: "最初の火種", body: "マキを拾ってキャンプ中央に戻り、炉へ投入しよう。", done: (s) => s.totalFedWood >= 3 },
  { title: "倉庫を作る", body: "マキを10本ためて倉庫を建てよう。資源上限が増える。", done: (s) => s.facilities.storage.unlocked },
  { title: "炉を強くする", body: "炉をレベル2にして、宿舎を建てられる状態にしよう。", done: (s) => s.facilities.furnace.level >= 2 },
  { title: "宿舎を建てる", body: "肉を集めて宿舎を作ろう。生存者が増え、作業員を使える。", done: (s) => s.facilities.lodging.unlocked },
  { title: "マキ集めを自動化", body: "伐採所を建てて作業員を配置しよう。手作業から一歩解放される。", done: (s) => s.facilities.woodCamp.unlocked && s.facilities.woodCamp.assignedWorkers > 0 },
  { title: "肉集めも自動化", body: "狩場を建てて作業員を配置しよう。生存者を増やしやすくなる。", done: (s) => s.facilities.huntingGround.unlocked && s.facilities.huntingGround.assignedWorkers > 0 },
  { title: "石の時代へ", body: "炉Lv3・倉庫Lv2にして、石切場を解放しよう。", done: (s) => s.facilities.quarry.unlocked },
  { title: "小さな村へ", body: "キャンプレベル10を目指そう。自動化ラインが回り始める。", done: (s) => getCampLevel(s) >= 10 },
];

function defaultState() {
  const facilities = {};
  Object.keys(facilityDefs).forEach((key) => {
    facilities[key] = {
      id: key,
      level: key === "furnace" ? 1 : 0,
      unlocked: key === "furnace",
      assignedWorkers: 0,
    };
  });
  return {
    resources: { wood: 0, meat: 0, stone: 0, hide: 0, iron: 0 },
    carried: { wood: 0, meat: 0, stone: 0, hide: 0, iron: 0 },
    facilities,
    survivors: 1,
    heat: 42,
    player: { x: 50, y: 72 },
    resourcesOnMap: [],
    logs: ["極寒の雪原に到着した。まずはマキを集めよう。"],
    floaters: [],
    selectedFacility: "furnace",
    mobilePanel: null,
    totalFedWood: 0,
    totalCollected: { wood: 0, meat: 0, stone: 0, hide: 0, iron: 0 },
    flags: {},
    lastSavedAt: Date.now(),
    createdAt: Date.now(),
  };
}

let state = loadState();
let lastTick = performance.now();
let pressed = new Set();
let pointerTarget = null;
let joystick = { active: false, x: 0, y: 0 };
let resourceId = 1;
let saveTimer = 0;

const app = document.getElementById("app");

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    const merged = deepMerge(base, parsed);
    normalizeState(merged);
    applyOfflineProgress(merged);
    return merged;
  } catch (error) {
    console.warn(error);
    return defaultState();
  }
}

function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  Object.keys(source).forEach((key) => {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}

function normalizeState(s) {
  Object.keys(facilityDefs).forEach((key) => {
    if (!s.facilities[key]) s.facilities[key] = defaultState().facilities[key];
    if (!s.facilities[key].id) s.facilities[key].id = key;
    if (!Number.isFinite(s.facilities[key].assignedWorkers)) s.facilities[key].assignedWorkers = 0;
  });
  ["wood", "meat", "stone", "hide", "iron"].forEach((r) => {
    s.resources[r] = Number(s.resources[r] ?? 0);
    s.carried[r] = Number(s.carried[r] ?? 0);
    s.totalCollected[r] = Number(s.totalCollected[r] ?? 0);
  });
  s.resourcesOnMap = [];
}

function saveState() {
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, floaters: [], resourcesOnMap: [] }));
}

function applyOfflineProgress(s) {
  const elapsed = Math.min(60 * 60 * 3, Math.max(0, (Date.now() - (s.lastSavedAt || Date.now())) / 1000));
  if (elapsed < 20) return;
  const caps = getStorageCaps(s);
  const multiplier = s.heat > 20 ? 0.35 : 0.18;
  let gained = { wood: 0, meat: 0, stone: 0 };
  const wc = s.facilities.woodCamp;
  const hg = s.facilities.huntingGround;
  const qu = s.facilities.quarry;
  if (wc.unlocked) gained.wood = wc.assignedWorkers * prodRates.wood(wc.level) * elapsed * multiplier;
  if (hg.unlocked) gained.meat = hg.assignedWorkers * prodRates.meat(hg.level) * elapsed * multiplier;
  if (qu.unlocked) gained.stone = qu.assignedWorkers * prodRates.stone(qu.level) * elapsed * multiplier;
  Object.entries(gained).forEach(([type, amount]) => {
    s.resources[type] = clamp(s.resources[type] + amount, 0, caps[type]);
  });
  const total = Object.values(gained).reduce((a, b) => a + b, 0);
  if (total > 1) {
    s.logs.unshift(`留守中に資源を回収：マキ${Math.floor(gained.wood)} / 肉${Math.floor(gained.meat)} / 石${Math.floor(gained.stone)}`);
  }
}

function getStorageCaps(s = state) {
  const storageLevel = s.facilities.storage.unlocked ? s.facilities.storage.level : 0;
  return {
    wood: 35 + storageLevel * 45 + s.facilities.furnace.level * 10,
    meat: 25 + storageLevel * 35 + (s.facilities.kitchen.unlocked ? s.facilities.kitchen.level * 18 : 0),
    stone: 20 + storageLevel * 30,
    hide: 15 + storageLevel * 12,
    iron: 10 + storageLevel * 10,
  };
}

function getCarryCap(s = state) {
  return 8 + (s.facilities.storage.unlocked ? s.facilities.storage.level * 5 : 0);
}

function getAssignedWorkers(s = state) {
  return Object.values(s.facilities).reduce((sum, f) => sum + (f.assignedWorkers || 0), 0);
}

function getFreeWorkers(s = state) {
  return Math.max(0, getWorkerCapacity(s) - getAssignedWorkers(s));
}

function getWorkerCapacity(s = state) {
  return Math.max(0, s.survivors - 1);
}

function getSurvivorCap(s = state) {
  const lodging = s.facilities.lodging.unlocked ? s.facilities.lodging.level : 0;
  return 2 + s.facilities.furnace.level + lodging * 4;
}

function getCampLevel(s = state) {
  return Object.values(s.facilities).reduce((sum, f) => sum + (f.unlocked ? f.level : 0), 0);
}

function canAfford(cost) {
  return Object.entries(cost).every(([type, amount]) => (state.resources[type] || 0) >= amount);
}

function spend(cost) {
  if (!canAfford(cost)) return false;
  Object.entries(cost).forEach(([type, amount]) => {
    state.resources[type] = Math.max(0, state.resources[type] - amount);
  });
  return true;
}

function formatRate(rate) {
  return rate >= 1 ? rate.toFixed(1) : rate.toFixed(2);
}

function formatNum(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.floor(value)}`;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addLog(message) {
  state.logs.unshift(message);
  state.logs = state.logs.slice(0, 16);
}

function addFloater(text, x = state.player.x, y = state.player.y) {
  state.floaters.push({ id: Math.random().toString(36).slice(2), text, x, y, life: 1.05 });
}

function getCurrentQuest() {
  return quests.find((q) => !q.done(state)) || quests[quests.length - 1];
}

function getFacilityCost(id) {
  const def = facilityDefs[id];
  const facility = state.facilities[id];
  if (!facility.unlocked) return def.buildCost;
  if (facility.level >= def.maxLevel) return null;
  return def.upgradeCost(facility.level);
}

function canShowFacility(id) {
  const f = state.facilities[id];
  const def = facilityDefs[id];
  return f.unlocked || def.requirement(state);
}

function isFacilityReady(id) {
  const cost = getFacilityCost(id);
  return cost && canAfford(cost) && canShowFacility(id);
}

function buildOrUpgrade(id) {
  const def = facilityDefs[id];
  const f = state.facilities[id];
  if (!def.requirement(state)) {
    addFloater("まだ解放されていない", def.x, def.y);
    return;
  }
  const cost = getFacilityCost(id);
  if (!cost) {
    addFloater("最大レベル", def.x, def.y);
    return;
  }
  if (!spend(cost)) {
    addFloater("資源が足りない", def.x, def.y);
    return;
  }
  if (!f.unlocked) {
    f.unlocked = true;
    f.level = 1;
    addLog(`${def.name}を建設した。新しい自動化が近づいた。`);
    addFloater(`${def.name} 建設!`, def.x, def.y);
  } else {
    f.level += 1;
    addLog(`${def.name}をLv${f.level}に強化した。`);
    addFloater(`${def.name} Lv${f.level}!`, def.x, def.y);
  }
  revealUnlocks();
  saveState();
  render();
}

function revealUnlocks() {
  Object.entries(facilityDefs).forEach(([id, def]) => {
    if (!state.flags[`seen-${id}`] && !state.facilities[id].unlocked && def.requirement(state)) {
      state.flags[`seen-${id}`] = true;
      addLog(`新設備「${def.name}」が建てられるようになった。`);
    }
  });
}

function assignWorker(id, delta) {
  const f = state.facilities[id];
  const def = facilityDefs[id];
  if (!f.unlocked) return;
  const cap = def.workerCap(f.level);
  if (delta > 0) {
    if (getFreeWorkers() <= 0) {
      addFloater("空き作業員がいない", def.x, def.y);
      return;
    }
    if (f.assignedWorkers >= cap) {
      addFloater("配置上限", def.x, def.y);
      return;
    }
    f.assignedWorkers += 1;
    addLog(`${def.name}に作業員を配置した。`);
  } else {
    f.assignedWorkers = Math.max(0, f.assignedWorkers - 1);
  }
  saveState();
  render();
}

function feedFurnace() {
  let used = false;
  if (state.carried.wood >= 1) {
    state.carried.wood -= 1;
    used = true;
  } else if (state.resources.wood >= 1) {
    state.resources.wood -= 1;
    used = true;
  }
  if (!used) {
    addFloater("マキが必要", 50, 50);
    render();
    return;
  }
  const boost = 15 + state.facilities.furnace.level * 4;
  state.heat = clamp(state.heat + boost, 0, 100);
  state.totalFedWood += 1;
  addFloater(`炉 +${boost}`, 50, 50);
  if (state.totalFedWood === 1) addLog("炉に火が戻った。温かさに引き寄せられて人が来るかもしれない。");
  saveState();
  render();
}

function attractSurvivors(dt) {
  const cap = getSurvivorCap();
  if (state.survivors >= cap) return;
  if (state.heat < 55) return;
  const foodNeeded = Math.max(2, 5 - (state.facilities.kitchen.unlocked ? state.facilities.kitchen.level : 0));
  if (state.resources.meat < foodNeeded) return;
  const lodgingBonus = state.facilities.lodging.unlocked ? state.facilities.lodging.level * 0.02 : 0;
  const kitchenBonus = state.facilities.kitchen.unlocked ? state.facilities.kitchen.level * 0.015 : 0;
  const chancePerSecond = 0.012 + lodgingBonus + kitchenBonus + state.facilities.furnace.level * 0.004;
  if (Math.random() < chancePerSecond * dt) {
    state.resources.meat -= foodNeeded;
    state.survivors += 1;
    addLog(`新しい生存者が加わった。作業員候補が${getWorkerCapacity()}人になった。`);
    addFloater("生存者 +1", 52 + Math.random() * 8 - 4, 56 + Math.random() * 8 - 4);
  }
}

function spawnResource() {
  const counts = state.resourcesOnMap.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});
  const unlockedStone = state.facilities.quarry.unlocked || state.facilities.furnace.level >= 3;
  const candidates = [];
  if ((counts.wood || 0) < 12) candidates.push("wood", "wood", "wood");
  if ((counts.meat || 0) < 8 && state.totalFedWood >= 1) candidates.push("meat", "meat");
  if ((counts.stone || 0) < 6 && unlockedStone) candidates.push("stone");
  if (candidates.length === 0) return;
  const type = candidates[Math.floor(Math.random() * candidates.length)];
  const pos = randomResourcePosition(type);
  const value = type === "wood" ? randInt(2, 5) : type === "meat" ? randInt(1, 4) : randInt(1, 3);
  state.resourcesOnMap.push({ id: resourceId++, type, value, x: pos.x, y: pos.y });
}

function randomResourcePosition(type) {
  if (type === "wood") return { x: rand(10, 36), y: rand(18, 74) };
  if (type === "meat") return { x: rand(66, 90), y: rand(22, 72) };
  return { x: rand(35, 62), y: rand(8, 29) };
}

function rand(min, max) { return min + Math.random() * (max - min); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

function collectNearbyResources() {
  const carryCap = getCarryCap();
  let carriedTotal = Object.values(state.carried).reduce((a, b) => a + b, 0);
  const remaining = [];
  for (const r of state.resourcesOnMap) {
    if (dist(state.player, r) < 5.8 && carriedTotal < carryCap) {
      const canTake = Math.min(r.value, carryCap - carriedTotal);
      state.carried[r.type] += canTake;
      state.totalCollected[r.type] += canTake;
      carriedTotal += canTake;
      addFloater(`${RESOURCE_EMOJI[r.type]} +${canTake}`, r.x, r.y);
      if (r.value > canTake) remaining.push({ ...r, value: r.value - canTake });
    } else {
      remaining.push(r);
    }
  }
  state.resourcesOnMap = remaining;
}

function depositIfNearCamp() {
  const nearFurnace = dist(state.player, { x: 50, y: 50 }) < 9.5;
  const nearStorage = state.facilities.storage.unlocked && dist(state.player, { x: facilityDefs.storage.x, y: facilityDefs.storage.y }) < 7.8;
  if (!nearFurnace && !nearStorage) return;
  const caps = getStorageCaps();
  let deposited = [];
  Object.keys(state.carried).forEach((type) => {
    const amount = state.carried[type];
    if (amount <= 0) return;
    const room = Math.max(0, caps[type] - state.resources[type]);
    const move = Math.min(amount, room);
    if (move > 0) {
      state.carried[type] -= move;
      state.resources[type] += move;
      deposited.push(`${RESOURCE_EMOJI[type]}${move}`);
    }
  });
  if (deposited.length) addFloater(`納品 ${deposited.join(" ")}`, 50, 50);
}

function tick(now) {
  const dt = Math.min(0.08, (now - lastTick) / 1000);
  lastTick = now;

  updateMovement(dt);
  collectNearbyResources();
  depositIfNearCamp();
  updateProduction(dt);
  updateHeat(dt);
  attractSurvivors(dt);
  updateFloaters(dt);

  if (Math.random() < dt * 0.9) spawnResource();
  saveTimer += dt;
  if (saveTimer > 4) {
    saveTimer = 0;
    saveState();
  }
  updateDomLight();
  requestAnimationFrame(tick);
}

function updateMovement(dt) {
  let vx = 0;
  let vy = 0;
  if (pressed.has("ArrowLeft") || pressed.has("a")) vx -= 1;
  if (pressed.has("ArrowRight") || pressed.has("d")) vx += 1;
  if (pressed.has("ArrowUp") || pressed.has("w")) vy -= 1;
  if (pressed.has("ArrowDown") || pressed.has("s")) vy += 1;
  if (joystick.active) {
    vx += joystick.x;
    vy += joystick.y;
  }
  if (pointerTarget && Math.abs(vx) + Math.abs(vy) < 0.05) {
    const dx = pointerTarget.x - state.player.x;
    const dy = pointerTarget.y - state.player.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) {
      vx = dx / d;
      vy = dy / d;
    } else {
      pointerTarget = null;
    }
  }
  const len = Math.hypot(vx, vy) || 1;
  const speed = pressed.has("Shift") ? 26 : 19;
  state.player.x = clamp(state.player.x + (vx / len) * speed * dt, 5, 95);
  state.player.y = clamp(state.player.y + (vy / len) * speed * dt, 6, 93);
}

function updateProduction(dt) {
  const caps = getStorageCaps();
  const coldPenalty = state.heat < 25 ? 0.45 : state.heat < 45 ? 0.7 : 1;
  const addResource = (type, amount) => {
    state.resources[type] = clamp(state.resources[type] + amount, 0, caps[type]);
    state.totalCollected[type] += amount;
  };
  const wc = state.facilities.woodCamp;
  if (wc.unlocked && wc.assignedWorkers > 0) {
    addResource("wood", wc.assignedWorkers * prodRates.wood(wc.level) * dt * coldPenalty);
  }
  const hg = state.facilities.huntingGround;
  if (hg.unlocked && hg.assignedWorkers > 0) {
    addResource("meat", hg.assignedWorkers * prodRates.meat(hg.level) * dt * coldPenalty);
    if (Math.random() < hg.assignedWorkers * hg.level * 0.0025 * dt) addResource("hide", 1);
  }
  const qu = state.facilities.quarry;
  if (qu.unlocked && qu.assignedWorkers > 0) {
    addResource("stone", qu.assignedWorkers * prodRates.stone(qu.level) * dt * coldPenalty);
  }
  const furnace = state.facilities.furnace;
  if (furnace.assignedWorkers > 0 && state.heat < 78 && state.resources.wood >= 1) {
    const consume = Math.min(state.resources.wood, furnace.assignedWorkers * (0.10 + furnace.level * 0.02) * dt);
    state.resources.wood -= consume;
    state.heat = clamp(state.heat + consume * (10 + furnace.level * 1.5), 0, 100);
  }
}

function updateHeat(dt) {
  const furnaceLevel = state.facilities.furnace.level;
  const wallLevel = state.facilities.wall.unlocked ? state.facilities.wall.level : 0;
  const decay = Math.max(0.10, 1.15 - furnaceLevel * 0.09 - wallLevel * 0.06);
  state.heat = clamp(state.heat - decay * dt, 0, 100);
  if (state.heat <= 0 && state.survivors > 1 && Math.random() < 0.035 * dt) {
    state.survivors -= 1;
    Object.values(state.facilities).forEach((f) => {
      if (getAssignedWorkers() > getWorkerCapacity() && f.assignedWorkers > 0) f.assignedWorkers -= 1;
    });
    addLog("炉が消え、生存者が1人離脱した。マキの自動投入を整えよう。");
  }
}

function updateFloaters(dt) {
  state.floaters.forEach((f) => { f.life -= dt; f.y -= dt * 3; });
  state.floaters = state.floaters.filter((f) => f.life > 0);
}

function updateDomLight() {
  const map = document.querySelector(".game-map");
  if (!map) return;
  const player = document.querySelector(".player");
  if (player) {
    player.style.setProperty("--x", `${state.player.x}%`);
    player.style.setProperty("--y", `${state.player.y}%`);
    player.dataset.carry = getCarryLabel();
  }
  const heatFill = document.querySelector(".bar-fill");
  if (heatFill) heatFill.style.width = `${state.heat}%`;
  const heatValue = document.querySelector("#heatValue");
  if (heatValue) heatValue.textContent = `${Math.floor(state.heat)}%`;
  const warm = document.querySelector(".warm-radius");
  if (warm) warm.style.setProperty("--radius", `${220 + state.facilities.furnace.level * 45}px`);
  state.floaters.forEach((f) => {
    const el = document.querySelector(`[data-floater-id="${f.id}"]`);
    if (el) {
      el.style.setProperty("--x", `${f.x}%`);
      el.style.setProperty("--y", `${f.y}%`);
    }
  });
}

function getCarryLabel() {
  const total = Object.values(state.carried).reduce((a, b) => a + b, 0);
  if (!total) return "空";
  return `${Math.floor(total)}/${getCarryCap()}`;
}

function render() {
  revealUnlocks();
  app.innerHTML = `
    <div class="app-shell">
      <main class="game-column">
        ${renderHud()}
        ${renderMap()}
        ${renderJoystick()}
        ${renderMobileActions()}
      </main>
      <aside class="side-column">
        ${renderInfoPanel()}
        ${renderFacilityPanel()}
        ${renderLogPanel()}
      </aside>
    </div>
  `;
  bindEvents();
  updateDomLight();
}

function renderHud() {
  const caps = getStorageCaps();
  const carry = getCarryLabel();
  const res = ["wood", "meat", "stone"].map((type) => `
    <div class="pill"><span>${RESOURCE_EMOJI[type]}</span><b>${formatNum(state.resources[type])}</b><small>/ ${formatNum(caps[type])}</small></div>
  `).join("");
  return `
    <section class="hud">
      <div class="resource-row">
        ${res}
        <div class="pill">🧍 <b>${state.survivors}</b><small>/ ${getSurvivorCap()}</small></div>
        <div class="pill">👷 <b>${getFreeWorkers()}</b><small>/ ${getWorkerCapacity()}</small></div>
        <div class="pill">🎒 <b>${carry}</b></div>
      </div>
      <div class="heat-panel">
        <div class="heat-label"><span>炉の温度</span><span id="heatValue">${Math.floor(state.heat)}%</span></div>
        <div class="bar"><div class="bar-fill" style="width:${state.heat}%"></div></div>
      </div>
    </section>
  `;
}

function renderMap() {
  const resources = state.resourcesOnMap.map((r) => `
    <div class="resource" data-value="${r.value}" style="--x:${r.x}%;--y:${r.y}%">${RESOURCE_EMOJI[r.type]}</div>
  `).join("");
  const facilities = Object.keys(facilityDefs).map((id) => renderFacilityOnMap(id)).join("");
  const workers = renderWorkersOnMap();
  const floats = state.floaters.map((f) => `
    <div class="notice-float" data-floater-id="${f.id}" style="--x:${f.x}%;--y:${f.y}%">${f.text}</div>
  `).join("");
  return `
    <div class="game-map" id="gameMap">
      <div class="warm-radius" style="--radius:${220 + state.facilities.furnace.level * 45}px"></div>
      ${facilities}
      ${resources}
      ${workers}
      <div class="player" style="--x:${state.player.x}%;--y:${state.player.y}%" data-carry="${getCarryLabel()}">🧑‍🚀</div>
      ${floats}
    </div>
  `;
}

function renderFacilityOnMap(id) {
  const def = facilityDefs[id];
  const f = state.facilities[id];
  const show = canShowFacility(id) || f.unlocked;
  if (!show) return "";
  const classes = ["facility"];
  if (!f.unlocked) classes.push("locked");
  if (isFacilityReady(id)) classes.push("ready");
  const level = f.unlocked ? `Lv${f.level}` : "NEW";
  return `
    <button class="${classes.join(" ")}" data-facility-map="${id}" style="--x:${def.x}%;--y:${def.y}%;--size:${def.size}px" aria-label="${def.name}">
      <span class="emoji">${def.emoji}</span>
      <span class="level-badge">${level}</span>
      <span class="label">${def.name}</span>
    </button>
  `;
}

function renderWorkersOnMap() {
  const parts = [];
  Object.entries(state.facilities).forEach(([id, f]) => {
    if (!f.unlocked || f.assignedWorkers <= 0) return;
    const def = facilityDefs[id];
    for (let i = 0; i < f.assignedWorkers; i++) {
      const angle = (Date.now() / 1100 + i * 1.9 + id.length) % (Math.PI * 2);
      const radius = 4 + (i % 2) * 2;
      const x = clamp(def.x + Math.cos(angle) * radius, 4, 96);
      const y = clamp(def.y + Math.sin(angle) * radius, 5, 94);
      parts.push(`<div class="worker" style="--x:${x}%;--y:${y}%">👷</div>`);
    }
  });
  return parts.join("");
}

function renderJoystick() {
  return `<div class="joystick" id="joystick"><div class="joystick-knob" style="--jx:0px;--jy:0px"></div></div>`;
}

function renderMobileActions() {
  return `
    <div class="mobile-actions">
      <button class="floating-button mobile-toggle" data-mobile-panel="facilities">🏗️</button>
      <button class="floating-button mobile-toggle" data-mobile-panel="info">📋</button>
      <button class="floating-button" data-feed-furnace>🔥</button>
    </div>
  `;
}

function renderInfoPanel() {
  const q = getCurrentQuest();
  const mobileClass = state.mobilePanel === "info" ? " mobile-open" : "";
  return `
    <section class="panel${mobileClass}">
      <div class="panel-header">
        <h1 class="title">FOREST CAMP</h1>
        <p class="subtitle">マキと肉を集め、炉と設備を育て、少しずつ作業を自動化する雪原サバイバル。</p>
      </div>
      <div class="panel-body">
        <div class="quest-card">
          <h3>次の目標：${q.title}</h3>
          <p>${q.body}</p>
        </div>
        <div class="stat-grid" style="margin-top:10px">
          <div class="stat-box"><b>${getCampLevel()}</b><span>キャンプレベル</span></div>
          <div class="stat-box"><b>${getAssignedWorkers()}</b><span>配置中の作業員</span></div>
          <div class="stat-box"><b>${Math.floor(state.totalCollected.wood)}</b><span>累計マキ</span></div>
          <div class="stat-box"><b>${Math.floor(state.totalCollected.meat)}</b><span>累計肉</span></div>
        </div>
        <div class="action-row" style="margin-top:10px">
          <button class="primary-btn" data-feed-furnace>マキを炉へ投入</button>
          <button class="ghost-btn" data-reset>リセット</button>
        </div>
      </div>
    </section>
  `;
}

function renderFacilityPanel() {
  const mobileClass = state.mobilePanel === "facilities" ? " mobile-open" : "";
  return `
    <section class="panel${mobileClass}" style="min-height:0; flex:1">
      <div class="panel-header">
        <h2 class="title" style="font-size:17px">設備強化・自動化</h2>
        <p class="subtitle">建設・強化・作業員配置で、資源回収を自動化していく。</p>
      </div>
      <div class="panel-body facility-list">
        ${Object.keys(facilityDefs).filter((id) => canShowFacility(id) || state.facilities[id].unlocked).map(renderFacilityCard).join("")}
      </div>
    </section>
  `;
}

function renderFacilityCard(id) {
  const def = facilityDefs[id];
  const f = state.facilities[id];
  const cost = getFacilityCost(id);
  const locked = !f.unlocked;
  const actionLabel = locked ? "建設" : f.level >= def.maxLevel ? "最大" : "強化";
  const workerCap = f.unlocked ? def.workerCap(f.level) : 0;
  const cardClasses = ["facility-card"];
  if (locked) cardClasses.push("locked");
  return `
    <article class="${cardClasses.join(" ")}" data-facility-card="${id}">
      <div class="card-top">
        <div class="card-icon">${def.emoji}</div>
        <div class="card-main">
          <div class="card-name">${def.name} ${f.unlocked ? `Lv${f.level}` : "未建設"}</div>
          <div class="card-desc">${def.desc}</div>
        </div>
      </div>
      <div class="card-desc">効果：${f.unlocked ? def.effect(f.level) : "建設すると解放"}</div>
      <div class="cost-row">${renderCost(cost)}</div>
      <div class="action-row">
        <button class="primary-btn" data-build="${id}" ${!cost || !canAfford(cost) || !facilityDefs[id].requirement(state) ? "disabled" : ""}>${actionLabel}</button>
        ${workerCap > 0 ? `
          <div class="worker-row" style="margin-left:auto">
            <button class="mini-btn ghost-btn" data-worker-minus="${id}">−</button>
            <span class="cost-chip">👷 ${f.assignedWorkers}/${workerCap}</span>
            <button class="mini-btn" data-worker-plus="${id}">＋</button>
          </div>
        ` : ""}
      </div>
    </article>
  `;
}

function renderCost(cost) {
  if (!cost) return `<span class="cost-chip">最大レベル</span>`;
  const entries = Object.entries(cost).filter(([, amount]) => amount > 0);
  if (!entries.length) return `<span class="cost-chip">無料</span>`;
  return entries.map(([type, amount]) => {
    const missing = (state.resources[type] || 0) < amount;
    return `<span class="cost-chip ${missing ? "missing" : ""}">${RESOURCE_EMOJI[type]} ${RESOURCE_LABEL[type]} ${Math.floor(amount)}</span>`;
  }).join("");
}

function renderLogPanel() {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2 class="title" style="font-size:16px">キャンプログ</h2>
      </div>
      <div class="panel-body log-list">
        ${state.logs.slice(0, 8).map((log) => `<div class="log-item">${escapeHtml(log)}</div>`).join("")}
      </div>
    </section>
  `;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}

function bindEvents() {
  document.querySelectorAll("[data-feed-furnace]").forEach((el) => el.addEventListener("click", feedFurnace));
  document.querySelectorAll("[data-reset]").forEach((el) => el.addEventListener("click", () => {
    if (confirm("セーブデータをリセットしますか？")) {
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      render();
    }
  }));
  document.querySelectorAll("[data-build]").forEach((el) => el.addEventListener("click", (e) => buildOrUpgrade(e.currentTarget.dataset.build)));
  document.querySelectorAll("[data-worker-plus]").forEach((el) => el.addEventListener("click", (e) => assignWorker(e.currentTarget.dataset.workerPlus, 1)));
  document.querySelectorAll("[data-worker-minus]").forEach((el) => el.addEventListener("click", (e) => assignWorker(e.currentTarget.dataset.workerMinus, -1)));
  document.querySelectorAll("[data-facility-map]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      state.selectedFacility = e.currentTarget.dataset.facilityMap;
      state.mobilePanel = "facilities";
      render();
    });
  });
  document.querySelectorAll("[data-mobile-panel]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const next = e.currentTarget.dataset.mobilePanel;
      state.mobilePanel = state.mobilePanel === next ? null : next;
      render();
    });
  });
  bindMapPointer();
  bindJoystick();
}

function bindMapPointer() {
  const map = document.getElementById("gameMap");
  if (!map) return;
  const setTarget = (event) => {
    if (event.target.closest("button") || event.target.closest(".joystick")) return;
    const rect = map.getBoundingClientRect();
    pointerTarget = {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 5, 95),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 6, 93),
    };
  };
  map.addEventListener("pointerdown", (e) => {
    setTarget(e);
    map.setPointerCapture(e.pointerId);
  });
  map.addEventListener("pointermove", (e) => {
    if (e.buttons) setTarget(e);
  });
}

function bindJoystick() {
  const joy = document.getElementById("joystick");
  if (!joy) return;
  const knob = joy.querySelector(".joystick-knob");
  const update = (event) => {
    const rect = joy.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const max = rect.width * 0.32;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / max);
    joystick.x = (dx / d) * k;
    joystick.y = (dy / d) * k;
    knob.style.setProperty("--jx", `${joystick.x * max}px`);
    knob.style.setProperty("--jy", `${joystick.y * max}px`);
    pointerTarget = null;
  };
  joy.addEventListener("pointerdown", (event) => {
    joystick.active = true;
    joy.setPointerCapture(event.pointerId);
    update(event);
  });
  joy.addEventListener("pointermove", (event) => {
    if (joystick.active) update(event);
  });
  joy.addEventListener("pointerup", () => resetJoystick(knob));
  joy.addEventListener("pointercancel", () => resetJoystick(knob));
}

function resetJoystick(knob) {
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  knob.style.setProperty("--jx", "0px");
  knob.style.setProperty("--jy", "0px");
}

window.addEventListener("keydown", (event) => {
  pressed.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  if (event.key === " " || event.key === "Enter") feedFurnace();
});
window.addEventListener("keyup", (event) => {
  pressed.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});
window.addEventListener("beforeunload", saveState);

// 初期資源を少し置く
for (let i = 0; i < 9; i++) spawnResource();
render();
requestAnimationFrame(tick);
setInterval(render, 1400);
