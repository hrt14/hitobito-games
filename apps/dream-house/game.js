(() => {
  'use strict';

  const STORAGE_KEY = 'hitobito.dream-house.v2';

  const BUILDINGS = [
    { id: 'cafe', icon: '☕', name: '川辺のカフェ', description: '川の真上に朝食テラス', cost: 500, income: 7, wow: 10, visitors: 2, prereq: [] },
    { id: 'cinema', icon: '🎬', name: 'プライベート映画館', description: '家の中に12席のシネマ', cost: 900, income: 10, wow: 12, visitors: 2, prereq: ['cafe'] },
    { id: 'mountain', icon: '⛰️', name: '山のガラスラウンジ', description: '山を切り取る全面ガラス室', cost: 1350, income: 13, wow: 18, visitors: 3, prereq: ['cafe'] },
    { id: 'aquarium', icon: '🐠', name: '海底ガラスフロア', description: '魚が泳ぐ海そのものを壁に', cost: 2100, income: 20, wow: 30, visitors: 4, prereq: ['cinema'] },
    { id: 'cave', icon: '🛶', name: '海底洞窟ドック', description: '洞窟から小舟で外海へ', cost: 3200, income: 27, wow: 38, visitors: 5, prereq: ['aquarium'] },
    { id: 'elevator', icon: '🛗', name: '屋上スカイリフト', description: '屋上から上空へ伸びるリフト', cost: 4800, income: 36, wow: 50, visitors: 6, prereq: ['mountain', 'cave'] },
    { id: 'orbit', icon: '🪐', name: '宇宙ラウンジ', description: '地球を見下ろす最後の部屋', cost: 7600, income: 70, wow: 100, visitors: 10, prereq: ['elevator'] },
  ];

  const COMBOS = [
    { name: '川音ブランチ', needs: ['cafe', 'mountain'], incomeBoost: 0.15, wow: 12 },
    { name: '青の回廊', needs: ['aquarium', 'cave'], incomeBoost: 0.20, wow: 18 },
    { name: '夜から宇宙へ', needs: ['cinema', 'elevator'], incomeBoost: 0.15, wow: 20 },
    { name: '川・山・海・宇宙', needs: ['cafe', 'mountain', 'aquarium', 'orbit'], incomeBoost: 0.30, wow: 40 },
  ];

  const $ = (id) => document.getElementById(id);
  const refs = {
    money: $('money'), income: $('income'), wow: $('wow'), rank: $('rank'),
    missionTitle: $('missionTitle'), missionProgress: $('missionProgress'), missionBar: $('missionBar'),
    scene: $('scene'), cards: $('cards'), comboList: $('comboList'), visitors: $('visitors'), orbs: $('orbs'),
    toast: $('toast'), reset: $('reset'), finale: $('finale'), finaleWow: $('finaleWow'), continue: $('continue'),
  };

  const validIds = new Set(BUILDINGS.map((building) => building.id));
  const defaultState = () => ({ money: 520, built: [], lastSavedAt: Date.now(), finished: false });

  const has = (state, id) => state.built.includes(id);
  const activeCombos = (state) => COMBOS.filter((combo) => combo.needs.every((id) => has(state, id)));
  const incomeFor = (state) => {
    const base = 4 + BUILDINGS.filter((building) => has(state, building.id)).reduce((sum, building) => sum + building.income, 0);
    const multiplier = 1 + activeCombos(state).reduce((sum, combo) => sum + combo.incomeBoost, 0);
    return base * multiplier;
  };
  const wowFor = (state) => 8
    + BUILDINGS.filter((building) => has(state, building.id)).reduce((sum, building) => sum + building.wow, 0)
    + activeCombos(state).reduce((sum, combo) => sum + combo.wow, 0);

  const loadState = () => {
    const fallback = defaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const saved = JSON.parse(raw);
      const state = {
        money: Number.isFinite(saved.money) ? Math.max(0, saved.money) : fallback.money,
        built: Array.isArray(saved.built) ? [...new Set(saved.built.filter((id) => validIds.has(id)))] : [],
        lastSavedAt: Number.isFinite(saved.lastSavedAt) ? saved.lastSavedAt : Date.now(),
        finished: Boolean(saved.finished),
      };
      const offlineSeconds = Math.min(7200, Math.max(0, (Date.now() - state.lastSavedAt) / 1000));
      state.money += incomeFor(state) * offlineSeconds;
      return state;
    } catch {
      return fallback;
    }
  };

  let state = loadState();
  let toastTimer = 0;
  let orbTimer = 0;
  let lastTick = performance.now();

  const save = () => {
    state.lastSavedAt = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  };

  const isAvailable = (building) => !has(state, building.id) && building.prereq.every((id) => has(state, id));
  const format = (value) => value >= 10000
    ? `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}k`
    : Math.floor(value).toLocaleString('ja-JP');

  const rankFor = () => {
    const count = state.built.length;
    if (count === BUILDINGS.length) return '地球で一番変な家';
    if (count >= 6) return '空へ伸びる邸宅';
    if (count >= 4) return '海底へ続く邸宅';
    if (count >= 2) return '絶景ヴィラ';
    if (count >= 1) return '川辺の人気邸';
    return '川の上の小さな家';
  };

  const showToast = (text) => {
    clearTimeout(toastTimer);
    refs.toast.textContent = text;
    refs.toast.classList.add('show');
    toastTimer = setTimeout(() => refs.toast.classList.remove('show'), 1500);
  };

  const updateNumbers = () => {
    refs.money.textContent = format(state.money);
    refs.income.textContent = `+${format(incomeFor(state))}`;
    refs.wow.textContent = format(wowFor(state));
  };

  const renderScene = () => {
    BUILDINGS.forEach((building) => {
      refs.scene.classList.toggle(`has-${building.id}`, has(state, building.id));
      const room = $(`room-${building.id}`);
      if (room) room.classList.toggle('locked', !has(state, building.id));
    });
    refs.scene.classList.toggle('space-mode', has(state, 'orbit'));

    refs.visitors.innerHTML = '';
    const visitorCount = Math.min(18, BUILDINGS.filter((building) => has(state, building.id)).reduce((sum, building) => sum + building.visitors, 0));
    for (let index = 0; index < visitorCount; index += 1) {
      const person = document.createElement('i');
      person.className = 'person';
      person.style.setProperty('--duration', `${6 + (index % 6) * 1.2}s`);
      person.style.setProperty('--delay', `${-(index * 1.3) % 7}s`);
      person.style.setProperty('--shirt', ['#d86f67', '#69a7c4', '#c5a15d', '#719c77'][index % 4]);
      refs.visitors.appendChild(person);
    }
  };

  const renderCards = () => {
    refs.cards.innerHTML = BUILDINGS.map((building) => {
      const done = has(state, building.id);
      const available = isAvailable(building);
      const missing = Math.max(0, building.cost - state.money);
      const status = done
        ? '完成'
        : available
          ? (missing <= 0 ? `+${building.income}/秒 · WOW +${building.wow}` : `あと ${format(missing)} DREAM`)
          : '前の増築が必要';
      return `
        <button class="build-card ${available ? 'available' : ''}" data-build="${building.id}" ${done || !available ? 'disabled' : ''}>
          <span class="build-icon">${building.icon}</span>
          <span class="build-copy"><b>${building.name}</b><small>${building.description}</small></span>
          <span class="build-price"><b>${done ? '完成' : format(building.cost)}</b><small>${status}</small></span>
        </button>`;
    }).join('');
  };

  const renderCombos = () => {
    refs.comboList.innerHTML = COMBOS.map((combo) => {
      const active = combo.needs.every((id) => has(state, id));
      return `<span class="combo-chip ${active ? 'active' : ''}">${combo.name}</span>`;
    }).join('');
  };

  const renderMission = () => {
    const next = BUILDINGS.find((building) => isAvailable(building)) || BUILDINGS.find((building) => !has(state, building.id));
    refs.rank.textContent = rankFor();
    refs.missionTitle.textContent = next ? `${next.name}をつくる` : '完成した家を眺める';
    refs.missionProgress.textContent = `${state.built.length} / ${BUILDINGS.length}`;
    refs.missionBar.style.width = `${(state.built.length / BUILDINGS.length) * 100}%`;
  };

  const render = () => {
    updateNumbers();
    renderScene();
    renderCards();
    renderCombos();
    renderMission();
  };

  const build = (id) => {
    const building = BUILDINGS.find((item) => item.id === id);
    if (!building || !isAvailable(building)) return;
    if (state.money < building.cost) {
      showToast(`あと ${format(building.cost - state.money)} DREAM`);
      spawnOrb(true);
      return;
    }

    state.money -= building.cost;
    state.built.push(building.id);
    navigator.vibrate?.([18, 30, 24]);
    render();
    save();
    showToast(`${building.name} 完成`);

    if (building.id === 'orbit' && !state.finished) {
      state.finished = true;
      save();
      setTimeout(() => {
        refs.finaleWow.textContent = `WOW ${format(wowFor(state))}`;
        refs.finale.classList.add('show');
      }, 550);
    }
  };

  const spawnOrb = (force = false) => {
    if (!force && refs.orbs.children.length > 0) return;
    if (refs.orbs.children.length >= 2) return;

    const reward = Math.round(80 + incomeFor(state) * 3 + Math.random() * 70);
    const orb = document.createElement('button');
    orb.className = 'dream-orb';
    orb.type = 'button';
    orb.setAttribute('aria-label', `ひらめき +${reward} DREAM`);
    orb.style.left = `${8 + Math.random() * 78}%`;
    orb.style.top = `${10 + Math.random() * 57}%`;
    orb.textContent = '✦';
    orb.addEventListener('click', () => {
      state.money += reward;
      navigator.vibrate?.(10);
      orb.remove();
      updateNumbers();
      renderCards();
      save();
      showToast(`+${reward} DREAM`);
    });
    refs.orbs.appendChild(orb);
  };

  refs.cards.addEventListener('click', (event) => {
    const button = event.target.closest('[data-build]');
    if (button) build(button.dataset.build);
  });

  refs.reset.addEventListener('click', () => {
    if (!window.confirm('最初から建て直しますか？')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    refs.finale.classList.remove('show');
    render();
    save();
    showToast('最初から建て直します');
  });

  refs.continue.addEventListener('click', () => refs.finale.classList.remove('show'));
  window.addEventListener('pagehide', save);

  const tick = (now) => {
    const delta = Math.min(0.5, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    state.money += incomeFor(state) * delta;
    updateNumbers();
    orbTimer += delta;
    if (orbTimer >= Math.max(5, 9 - state.built.length * 0.5)) {
      orbTimer = 0;
      spawnOrb();
    }
    requestAnimationFrame(tick);
  };

  render();
  setTimeout(() => spawnOrb(true), 500);
  requestAnimationFrame(tick);

  window.__dreamHouse = {
    getState: () => ({ ...state, built: [...state.built] }),
    canBuild: (id) => {
      const building = BUILDINGS.find((item) => item.id === id);
      return Boolean(building && isAvailable(building));
    },
  };
})();
