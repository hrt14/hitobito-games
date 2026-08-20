(() => {
  'use strict';

  const STORAGE_KEY = 'todoRaid.v1';
  const DIFF = {
    easy: { label: '小', xp: 20, damage: 70, gold: 12, color: '#38bdf8' },
    normal: { label: '中', xp: 45, damage: 145, gold: 28, color: '#f59e0b' },
    hard: { label: '大', xp: 90, damage: 280, gold: 65, color: '#fb7185' }
  };
  const ADD_REWARD = { xp: 20, gold: 10, max: 5 };
  const START_REWARD = { xp: 10, damage: 25, max: 5 };
  const FOCUS_REWARD = { xp: 15, damage: 35, max: 5, delayMs: 5 * 60 * 1000 };
  const BOSSES = [
    { name: '先延ばしドラゴン', emoji: '🐉', hp: 600 },
    { name: '雑念ゴーレム', emoji: '🗿', hp: 900 },
    { name: '完璧主義デーモン', emoji: '👹', hp: 1300 },
    { name: '会議ヒドラ', emoji: '🐲', hp: 1800 },
    { name: '無限TODO皇帝', emoji: '👑', hp: 2600 }
  ];
  const WORLDS = [
    { name: '着手の草原', emoji: '🌱', theme: 'grassland', desc: '最初の一歩が最強の武器。' },
    { name: '集中の遺跡', emoji: '🏛️', theme: 'ruins', desc: '雑念を倒して、流れに乗る。' },
    { name: '完了の火山', emoji: '🌋', theme: 'volcano', desc: '中途半端を終わらせる。' },
    { name: '余白の空中都市', emoji: '☁️', theme: 'skycity', desc: '終えたぶんだけ、時間が戻る。' },
    { name: '伝説のゼロ件城', emoji: '🏰', theme: 'castle', desc: 'やるべきことを、やる。' }
  ];
  const COMPANIONS = [
    { id:'slime', name:'着手スライム', emoji:'🟢', rarity:'R', effect:'最初の1個を祝う' },
    { id:'owl', name:'集中フクロウ', emoji:'🦉', rarity:'R', effect:'コンボを見守る' },
    { id:'fox', name:'段取りキツネ', emoji:'🦊', rarity:'SR', effect:'中タスクが得意' },
    { id:'wolf', name:'完遂ウルフ', emoji:'🐺', rarity:'SR', effect:'連続完了に強い' },
    { id:'phoenix', name:'復活フェニックス', emoji:'🔥', rarity:'SSR', effect:'再開を祝う' },
    { id:'dragon', name:'明日やらない竜', emoji:'🐲', rarity:'SSR', effect:'大タスクの象徴' }
  ];

  const $ = id => document.getElementById(id);
  const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));

  function defaultState() {
    return {
      date: todayKey(), tasks: [], completedToday: 0, totalCompleted: 0,
      combo: 0, chestProgress: 0, chestReady: false, pendingChests: 0,
      xp: 0, level: 1, gold: 0, shards: 0,
      bossIndex: 0, bossHp: BOSSES[0].hp, bossKills: 0,
      unlockedWorld: 0, companions: [], summons: 0,
      sound: true, bestCombo: 0, daysActive: 1,
      addRewardsToday: 0, startRewardsToday: 0, focusRewardsToday: 0,
      daily: { first:false, focus:false, three:false, hard:false },
      lastActiveDate: todayKey()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = { ...defaultState(), ...JSON.parse(raw) };
      if (!Number.isFinite(parsed.pendingChests)) parsed.pendingChests = parsed.chestReady ? 1 : 0;
      if (!Number.isFinite(parsed.addRewardsToday)) parsed.addRewardsToday = 0;
      if (!Number.isFinite(parsed.startRewardsToday)) parsed.startRewardsToday = 0;
      if (!Number.isFinite(parsed.focusRewardsToday)) parsed.focusRewardsToday = 0;
      parsed.chestReady = parsed.pendingChests > 0;
      parsed.daily = { ...defaultState().daily, ...(parsed.daily || {}) };
      parsed.tasks = (parsed.tasks || []).map(t => ({
        ...t,
        startedAt: t.startedAt || null,
        focusRewardAt: t.focusRewardAt || null
      }));
      rollover(parsed);
      return parsed;
    } catch (_) {
      return defaultState();
    }
  }

  function rollover(s) {
    const today = todayKey();
    if (s.date === today) return;
    const prev = new Date(s.lastActiveDate || s.date);
    const now = new Date();
    if (Math.round((now - prev) / 86400000) >= 1) s.daysActive += 1;
    s.date = today;
    s.completedToday = 0;
    s.combo = 0;
    s.chestProgress = 0;
    s.chestReady = s.pendingChests > 0;
    s.addRewardsToday = 0;
    s.startRewardsToday = 0;
    s.focusRewardsToday = 0;
    s.daily = { first:false, focus:false, three:false, hard:false };
    s.tasks = s.tasks.filter(t => !t.completed);
    s.lastActiveDate = today;
  }

  let state = load();
  let selectedDiff = 'easy';
  let toastTimer = null;
  let rewardAction = null;
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  function xpNeeded(level) { return 100 + (level - 1) * 45; }
  function currentLevelProgress() {
    let spent = 0;
    for (let l=1; l<state.level; l++) spent += xpNeeded(l);
    return { current: state.xp - spent, needed: xpNeeded(state.level) };
  }
  function addXp(amount) {
    state.xp += amount;
    let threshold = 0;
    for (let l=1; l<=state.level; l++) threshold += xpNeeded(l);
    while (state.xp >= threshold) {
      state.level += 1;
      showToast(`LEVEL UP! Lv.${state.level}`);
      threshold += xpNeeded(state.level);
    }
  }
  function rankFor(total) {
    if (total >= 100) return 'DIAMOND I';
    if (total >= 60) return 'PLATINUM II';
    if (total >= 35) return 'GOLD III';
    if (total >= 15) return 'SILVER II';
    return `BRONZE ${Math.max(1, 3 - Math.floor(total / 5))}`;
  }
  function formatRemaining(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    const min = Math.floor(sec / 60);
    return `${String(min).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}`;
  }

  function installStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .task-item.started{border-color:rgba(34,197,94,.3);box-shadow:inset 0 0 0 1px rgba(34,197,94,.08)}
      .attack-btn.start{background:linear-gradient(145deg,rgba(34,197,94,.23),rgba(56,189,248,.16));box-shadow:inset 0 0 0 1px rgba(74,222,128,.24)}
      .attack-btn.start small{color:#bbf7d0}.attack-btn.finish small{color:#fde68a}
      .task-status{display:inline-flex;align-items:center;gap:4px;margin-right:5px;padding:2px 6px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.05em}
      .task-status.ready{background:rgba(56,189,248,.12);color:#bae6fd}.task-status.go{background:rgba(34,197,94,.12);color:#bbf7d0}
      .task-status.focus{background:rgba(245,158,11,.15);color:#fde68a;box-shadow:inset 0 0 0 1px rgba(245,158,11,.18)}
      .focus-count{display:inline-flex;align-items:center;gap:4px;font-variant-numeric:tabular-nums;font-weight:950;color:#fde68a}
      .focus-count.done{color:#86efac}
      .focus-bar{height:4px;margin-top:5px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.08)}
      .focus-bar>i{display:block;height:100%;width:var(--focus-progress,0%);border-radius:inherit;background:linear-gradient(90deg,#22c55e,#f59e0b);transition:width .8s linear}
      .task-item.focus-ready{border-color:rgba(245,158,11,.42);box-shadow:0 0 0 1px rgba(245,158,11,.1),0 8px 24px rgba(245,158,11,.08)}
      .reward-loop-note{margin-top:6px;color:#fde68a;font-size:10px;font-weight:850}
    `;
    document.head.appendChild(style);
    const submit = $('taskForm')?.querySelector('.primary-btn');
    if (submit) submit.textContent = 'クエスト化して報酬GET';
  }

  function render() {
    renderBoss();
    renderStats();
    renderTasks();
    renderMomentum();
    renderDaily();
    renderWorld();
    renderCollection();
    $('soundBtn').textContent = state.sound ? '♪' : '×';
  }

  function renderBoss() {
    const boss = BOSSES[state.bossIndex % BOSSES.length];
    const world = WORLDS[Math.min(state.unlockedWorld, WORLDS.length - 1)];
    $('bossName').textContent = boss.name;
    $('bossSprite').textContent = boss.emoji;
    $('bossSprite').setAttribute('aria-label', boss.name);
    $('areaBadge').textContent = `${world.emoji} ${world.name}`;
    $('worldCaption').textContent = world.name;
    $('worldScene').className = `world-scene scene-${world.theme}`;
    document.body.dataset.world = world.theme;
    $('hpText').textContent = `${Math.max(0,state.bossHp)} / ${boss.hp}`;
    $('hpFill').style.width = `${clamp((state.bossHp / boss.hp) * 100,0,100)}%`;
  }

  function renderStats() {
    const p = currentLevelProgress();
    $('levelText').textContent = state.level;
    $('goldText').textContent = state.gold;
    $('rankBadge').textContent = rankFor(state.totalCompleted);
    $('xpFill').style.width = `${clamp((p.current/p.needed)*100,0,100)}%`;
  }

  function focusProgress(task, now=Date.now()) {
    if (!task.startedAt) return 0;
    if (task.focusRewardAt) return 1;
    return clamp((now - task.startedAt) / FOCUS_REWARD.delayMs, 0, 1);
  }

  function renderTasks() {
    const list = $('taskList');
    list.innerHTML = '';
    const open = state.tasks.filter(t => !t.completed);
    $('emptyState').classList.toggle('hidden', open.length > 0 || state.tasks.some(t => t.completed));
    const now = Date.now();
    [...open, ...state.tasks.filter(t => t.completed).slice(-2)].forEach(task => {
      const d = DIFF[task.diff] || DIFF.easy;
      const started = Boolean(task.startedAt) && !task.completed;
      const focusDone = Boolean(task.focusRewardAt);
      const progress = focusProgress(task, now);
      const item = document.createElement('div');
      item.className = `task-item${started?' started':''}${focusDone?' focus-ready':''}${task.completed?' completed':''}`;
      item.style.setProperty('--taskColor', d.color);
      const action = task.completed
        ? `<button class="attack-btn" disabled aria-label="${escapeHtml(task.title)}は完了"><span>✓</span><small>完了</small></button>`
        : started
          ? `<button class="attack-btn finish" data-complete="${task.id}" aria-label="${escapeHtml(task.title)}を完了"><span>⚔️</span><small>倒す</small></button>`
          : `<button class="attack-btn start" data-start="${task.id}" aria-label="${escapeHtml(task.title)}に着手"><span>▶</span><small>始める</small></button>`;
      let meta;
      if (task.completed) {
        meta = `${d.label}クエスト · 完了済み`;
      } else if (!started) {
        meta = `<span class="task-status ready">未着手</span> 始めると先制攻撃 +${START_REWARD.xp}XP`;
      } else if (focusDone) {
        meta = `<span class="task-status focus">🔥 5分達成</span> 完了で +${d.xp}XP · +${d.gold}G`;
      } else {
        const remaining = FOCUS_REWARD.delayMs - (now - task.startedAt);
        meta = `<span class="task-status go">攻略中</span> <span class="focus-count" data-focus-timer="${task.id}">FOCUS ${formatRemaining(remaining)}</span> · 5分で +${FOCUS_REWARD.xp}XP
          <div class="focus-bar" aria-hidden="true"><i data-focus-bar="${task.id}" style="--focus-progress:${Math.round(progress*100)}%"></i></div>`;
      }
      const side = task.completed ? '' : started
        ? (focusDone ? `FINISH -${d.damage}` : `5MIN -${FOCUS_REWARD.damage}`)
        : `START -${START_REWARD.damage}`;
      item.innerHTML = `${action}
        <div class="task-copy"><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta">${meta}</div></div>
        <div class="task-side"><div class="task-damage">${side}</div>${task.completed?'':`<button class="task-delete" data-delete="${task.id}" aria-label="${escapeHtml(task.title)}を削除">×</button>`}</div>`;
      list.appendChild(item);
    });
  }

  function renderMomentum() {
    $('comboText').textContent = state.combo;
    state.chestReady = state.pendingChests > 0;
    const untilNext = 3 - state.chestProgress;
    const next = state.pendingChests > 0 ? `宝箱 ${state.pendingChests}個待機 · 次まであと${untilNext}個` : `あと${untilNext}個で宝箱`;
    $('nextRewardText').textContent = state.combo ? `${state.combo}連続中 · ${next}` : next;
    $('chestBtn').disabled = state.pendingChests < 1;
    $('chestBtn').className = `chest-btn ${state.pendingChests > 0?'ready':'locked'}`;
    $('chestCount').textContent = state.pendingChests;
    $('chestCount').classList.toggle('hidden', state.pendingChests < 1);
    $('chestBtn').setAttribute('aria-label', state.pendingChests > 0 ? `宝箱を開ける。${state.pendingChests}個待機` : '宝箱を開ける');
    $('chestPips').innerHTML = [0,1,2].map(i=>`<i class="${i<state.chestProgress?'on':''}"></i>`).join('');
  }

  function renderDaily() {
    const rows = [
      ['⚡','まず1個始める','「始める」で先制攻撃',state.daily.first],
      ['🔥','5分続ける','FOCUS BURSTを発生',state.daily.focus],
      ['🏆','3個終える','勢いを作る',state.daily.three]
    ];
    $('dailyList').innerHTML = rows.map(r=>`<div class="daily-item"><div class="daily-icon">${r[0]}</div><div class="daily-copy"><strong>${r[1]}</strong><small>${r[2]}</small></div><div class="daily-check">${r[3]?'✓':'·'}</div></div>`).join('');
    $('dailyCount').textContent = `${rows.filter(r=>r[3]).length}/3`;
  }

  function renderWorld() {
    $('worldMap').innerHTML = WORLDS.map((w,i)=>`
      <div class="world-node world-${w.theme} ${i<=state.unlockedWorld?'':'locked'}">
        <div class="world-thumb" aria-hidden="true"><div class="thumb-sky"></div><div class="thumb-landmark"></div><div class="thumb-ground"></div><span>${w.emoji}</span></div>
        <div class="world-copy"><strong>${w.name}</strong><small>${w.desc}</small></div>
        <div class="world-state">${i<state.unlockedWorld?'CLEARED':i===state.unlockedWorld?'NOW':'LOCKED'}</div>
      </div>`).join('');
    $('statsGrid').innerHTML = [
      ['完了したタスク',state.totalCompleted],
      ['倒したボス',state.bossKills],
      ['最高コンボ',state.bestCombo],
      ['冒険日数',state.daysActive]
    ].map(([k,v])=>`<div class="stat-card"><span>${k}</span><strong>${v}</strong></div>`).join('');
  }

  function renderCollection() {
    $('shardText').textContent = state.shards;
    $('summonBtn').disabled = state.shards < 5;
    $('collectionGrid').innerHTML = COMPANIONS.map(c=>{
      const has = state.companions.includes(c.id);
      return `<div class="companion-card ${has?'':'locked'}"><div class="rarity">${has?c.rarity:'???'}</div><div class="companion-emoji">${has?c.emoji:'❔'}</div><strong>${has?c.name:'未発見'}</strong><small>${has?c.effect:'タスクを進めて発見'}</small></div>`;
    }).join('');
  }

  function addTask(title) {
    const task = {
      id: uid(), title: title.trim(), diff: selectedDiff,
      completed: false, startedAt: null, focusRewardAt: null, createdAt: Date.now()
    };
    state.tasks.unshift(task);
    const rewarded = state.addRewardsToday < ADD_REWARD.max;
    if (rewarded) {
      state.addRewardsToday += 1;
      state.gold += ADD_REWARD.gold;
      addXp(ADD_REWARD.xp);
    }
    save();
    render();
    $('taskInput').value = '';
    $('taskForm').classList.add('hidden');
    tone(680,.12);
    vibrate([24,30,40]);
    const rewardLine = rewarded
      ? `<strong>+${ADD_REWARD.xp} XP · +${ADD_REWARD.gold} GOLD</strong><br>登録ボーナス ${state.addRewardsToday}/${ADD_REWARD.max}`
      : `<strong>QUEST CREATED!</strong><br>今日の登録ボーナスはMAX。`;
    showReward(
      'QUEST CREATED!',
      `<div style="font-size:48px">📜✨</div>${rewardLine}<div class="reward-loop-note">次は「始める」で先制攻撃。5分続けるともう一度報酬。</div>`,
      '⚡','今すぐ始める',()=>startTask(task.id)
    );
  }

  function startTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.completed || task.startedAt) return;
    task.startedAt = Date.now();
    task.focusRewardAt = null;
    const rewarded = state.startRewardsToday < START_REWARD.max;
    let dealt = 0;
    if (rewarded) {
      state.startRewardsToday += 1;
      addXp(START_REWARD.xp);
      dealt = Math.min(START_REWARD.damage, Math.max(0, state.bossHp - 1));
      state.bossHp -= dealt;
    }
    state.daily.first = true;
    save();
    render();
    if (dealt > 0) hitAnimation(dealt);
    else { tone(320,.06); vibrate(18); }
    showToast(rewarded
      ? `FIRST STRIKE! +${START_REWARD.xp} XP · -${dealt} HP · 次は5分`
      : '攻略開始！ 5分続けるとFOCUS BURST');
  }

  function awardFocusForTasks(tasks, showModal=true) {
    if (!tasks.length) return false;
    let rewardedCount = 0;
    let xp = 0;
    let dealtTotal = 0;
    const now = Date.now();
    for (const task of tasks) {
      if (!task || task.completed || !task.startedAt || task.focusRewardAt) continue;
      task.focusRewardAt = now;
      state.daily.focus = true;
      if (state.focusRewardsToday < FOCUS_REWARD.max) {
        state.focusRewardsToday += 1;
        rewardedCount += 1;
        xp += FOCUS_REWARD.xp;
        addXp(FOCUS_REWARD.xp);
        const dealt = Math.min(FOCUS_REWARD.damage, Math.max(0, state.bossHp - 1));
        state.bossHp -= dealt;
        dealtTotal += dealt;
      }
    }
    save();
    render();
    if (dealtTotal > 0) hitAnimation(dealtTotal);
    tone(520,.13);
    vibrate([22,28,22,28,42]);
    if (showModal) {
      const countLabel = tasks.length > 1 ? ` ×${tasks.length}` : '';
      const rewardLine = rewardedCount
        ? `<strong>+${xp} XP · -${dealtTotal} HP</strong><br>5分継続ボーナス ${state.focusRewardsToday}/${FOCUS_REWARD.max}`
        : `<strong>5分継続達成！</strong><br>今日のFOCUS報酬はMAX。`;
      showReward(
        `FOCUS BURST${countLabel}`,
        `<div style="font-size:52px">🔥⚡</div>${rewardLine}<div class="reward-loop-note">5分続いた。ここから本番。終えたら撃破報酬。</div>`,
        '🔥','続ける'
      );
    }
    return true;
  }

  function checkFocusMilestones(showModal=true) {
    if (showModal && !$('rewardModal').classList.contains('hidden')) return false;
    const now = Date.now();
    const due = state.tasks.filter(t =>
      !t.completed && t.startedAt && !t.focusRewardAt &&
      now - t.startedAt >= FOCUS_REWARD.delayMs
    );
    return awardFocusForTasks(due, showModal);
  }

  function completeTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.completed) return;
    if (!task.startedAt) {
      startTask(id);
      return;
    }
    if (!task.focusRewardAt && Date.now() - task.startedAt >= FOCUS_REWARD.delayMs) {
      awardFocusForTasks([task], false);
    }
    const d = DIFF[task.diff] || DIFF.easy;
    task.completed = true;
    task.completedAt = Date.now();
    state.completedToday += 1;
    state.totalCompleted += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo,state.combo);
    state.gold += d.gold + Math.min(state.combo-1,5)*2;
    state.shards += 1;
    addXp(d.xp + Math.min(state.combo-1,5)*3);
    state.chestProgress += 1;
    if (state.chestProgress >= 3) {
      state.pendingChests += Math.floor(state.chestProgress / 3);
      state.chestProgress %= 3;
      state.chestReady = true;
    }
    if (state.completedToday >= 3) state.daily.three = true;
    if (task.diff === 'hard') state.daily.hard = true;
    state.bossHp -= d.damage;
    save();
    hitAnimation(d.damage);
    if (state.bossHp <= 0) setTimeout(defeatBoss, 540);
    else {
      showToast(`FINISH! +${d.xp} XP · +${d.gold}G · 召喚石 +1`);
      render();
    }
  }

  function hitAnimation(dmg) {
    const boss = $('bossSprite'), pop = $('damagePop'), combo = $('comboPop');
    boss.classList.remove('hit');
    void boss.offsetWidth;
    boss.classList.add('hit');
    pop.textContent = `-${dmg}`;
    pop.classList.remove('show');
    void pop.offsetWidth;
    pop.classList.add('show');
    if (state.combo >= 2) {
      combo.textContent = `${state.combo} COMBO!`;
      combo.classList.remove('show');
      void combo.offsetWidth;
      combo.classList.add('show');
    }
    vibrate(state.combo >= 3 ? [20,35,25] : 18);
    tone(180 + Math.min(state.combo,5)*35, .06);
  }

  function defeatBoss() {
    const bossEl = $('bossSprite');
    bossEl.classList.add('defeated');
    const defeated = BOSSES[state.bossIndex % BOSSES.length];
    state.bossKills += 1;
    state.gold += 120 + state.bossKills * 20;
    state.shards += 2;
    const previousWorld = state.unlockedWorld;
    state.unlockedWorld = Math.min(WORLDS.length-1, state.bossKills);
    const newlyUnlocked = state.unlockedWorld > previousWorld ? WORLDS[state.unlockedWorld] : null;
    state.bossIndex = (state.bossIndex + 1) % BOSSES.length;
    state.bossHp = BOSSES[state.bossIndex].hp;
    save();
    setTimeout(()=>{
      bossEl.classList.remove('defeated');
      const areaLine = newlyUnlocked
        ? `<br><strong class="unlock-line">${newlyUnlocked.emoji} ${newlyUnlocked.name} 解放！</strong>`
        : '<br>最終エリアで戦いは続く。';
      showReward(
        'BOSS DEFEATED!',
        `<strong>${defeated.name} 撃破</strong><br>+${120 + state.bossKills*20}G · 召喚石 +2${areaLine}`
      );
      render();
    },680);
  }

  function openChest() {
    if (state.pendingChests < 1) return;
    const roll = (state.totalCompleted * 17 + state.gold * 3 + Date.now()) % 100;
    let gold = 50, shards = 1, label = 'COMMON CHEST';
    if (roll > 82) { gold = 180; shards = 3; label = 'GOLD CHEST'; }
    else if (roll > 45) { gold = 90; shards = 2; label = 'SILVER CHEST'; }
    state.gold += gold;
    state.shards += shards;
    state.pendingChests -= 1;
    state.chestReady = state.pendingChests > 0;
    save();
    render();
    tone(620,.12);
    vibrate([30,40,30]);
    showReward(
      label,
      `<strong>+${gold} GOLD</strong><br>召喚石 +${shards}<br><span class="muted">宝箱が残っていても、現実のタスクはそのまま進めてOK。</span>`
    );
  }

  function summon() {
    if (state.shards < 5) return;
    state.shards -= 5;
    state.summons += 1;
    const pool = COMPANIONS.filter(c=>!state.companions.includes(c.id));
    const pickPool = pool.length ? pool : COMPANIONS;
    const index = (state.summons * 7 + state.totalCompleted * 3 + new Date().getDate()) % pickPool.length;
    const c = pickPool[index];
    if (!state.companions.includes(c.id)) state.companions.push(c.id);
    else state.gold += 120;
    save();
    render();
    tone(760,.18);
    vibrate([25,30,25,30,50]);
    showReward(`${c.rarity} SUMMON`, `<div style="font-size:52px">${c.emoji}</div><strong>${c.name}</strong><br>${c.effect}`);
  }

  function showReward(title, html, burst='✦', actionLabel='受け取る', action=null) {
    rewardAction = action;
    $('rewardBurst').textContent = burst;
    $('rewardTitle').textContent = title;
    $('rewardBody').innerHTML = html;
    $('rewardCloseBtn').textContent = actionLabel;
    $('rewardModal').classList.remove('hidden');
  }

  function closeReward(runAction=false) {
    $('rewardModal').classList.add('hidden');
    const action = rewardAction;
    rewardAction = null;
    $('rewardCloseBtn').textContent = '受け取る';
    $('rewardBurst').textContent = '✦';
    if (runAction && action) action();
  }

  function showToast(msg) {
    const t = $('toast');
    clearTimeout(toastTimer);
    t.textContent = msg;
    t.classList.add('show');
    toastTimer = setTimeout(()=>t.classList.remove('show'),1800);
  }

  function openForm() {
    $('taskForm').classList.remove('hidden');
    setTimeout(()=>$('taskInput').focus(),40);
  }

  function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.completed) return;
    state.tasks = state.tasks.filter(t => t.id !== id);
    save();
    render();
    showToast('クエストを削除した。');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
    }[c]));
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  let audioCtx = null;
  function tone(freq,dur) {
    if (!state.sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type='triangle';
      osc.frequency.value=freq;
      gain.gain.value=.035;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);
      osc.stop(audioCtx.currentTime+dur);
    } catch (_) {}
  }

  function switchView(target) {
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===target));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.target===target));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function tickFocusTimers() {
    const now = Date.now();
    document.querySelectorAll('[data-focus-timer]').forEach(el=>{
      const task = state.tasks.find(t=>t.id===el.dataset.focusTimer);
      if (!task || task.completed || !task.startedAt || task.focusRewardAt) return;
      const remaining = FOCUS_REWARD.delayMs - (now - task.startedAt);
      el.textContent = remaining > 0 ? `FOCUS ${formatRemaining(remaining)}` : 'FOCUS READY!';
      const bar = document.querySelector(`[data-focus-bar="${CSS.escape(task.id)}"]`);
      if (bar) bar.style.setProperty('--focus-progress', `${Math.round(focusProgress(task, now)*100)}%`);
    });
    checkFocusMilestones(document.visibilityState === 'visible');
  }

  $('taskForm').addEventListener('submit', e=>{
    e.preventDefault();
    const title = $('taskInput').value.trim();
    if (title) addTask(title);
  });
  $('quickAddBtn').addEventListener('click',openForm);
  $('emptyAddBtn').addEventListener('click',openForm);
  document.querySelectorAll('.difficulty').forEach(btn=>btn.addEventListener('click',()=>{
    selectedDiff=btn.dataset.diff;
    document.querySelectorAll('.difficulty').forEach(b=>b.classList.toggle('active',b===btn));
  }));
  $('taskList').addEventListener('click',e=>{
    const deleteBtn=e.target.closest('[data-delete]');
    if(deleteBtn){ deleteTask(deleteBtn.dataset.delete); return; }
    const startBtn=e.target.closest('[data-start]');
    if(startBtn){ startTask(startBtn.dataset.start); return; }
    const completeBtn=e.target.closest('[data-complete]');
    if(completeBtn) completeTask(completeBtn.dataset.complete);
  });
  $('chestBtn').addEventListener('click',openChest);
  $('summonBtn').addEventListener('click',summon);
  $('rewardCloseBtn').addEventListener('click',()=>closeReward(true));
  $('rewardModal').addEventListener('click',e=>{
    if(e.target===$('rewardModal')) closeReward(false);
  });
  $('soundBtn').addEventListener('click',()=>{
    state.sound=!state.sound;
    save();
    render();
    showToast(state.sound?'サウンド ON':'サウンド OFF');
  });
  $('homeBtn').addEventListener('click',()=>{ location.href='/'; });
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.target)));
  document.addEventListener('visibilitychange',()=>{
    if (document.visibilityState === 'visible') {
      checkFocusMilestones(true);
      tickFocusTimers();
    }
  });

  installStyles();
  window.__TODO_RAID__ = {
    getState:()=>JSON.parse(JSON.stringify(state)),
    reset:()=>{localStorage.removeItem(STORAGE_KEY);location.reload();},
    addTask,
    startTask,
    completeTask,
    checkFocus:()=>checkFocusMilestones(true),
    FOCUS_DELAY_MS: FOCUS_REWARD.delayMs
  };
  render();
  checkFocusMilestones(true);
  tickFocusTimers();
  setInterval(tickFocusTimers, 1000);
})();