(() => {
  'use strict';

  const STORAGE_KEY = 'todoRaid.v1';
  const DIFF = {
    easy: { label: '小', xp: 20, damage: 70, gold: 12, color: '#38bdf8' },
    normal: { label: '中', xp: 45, damage: 145, gold: 28, color: '#f59e0b' },
    hard: { label: '大', xp: 90, damage: 280, gold: 65, color: '#fb7185' }
  };
  const BOSSES = [
    { name: '先延ばしドラゴン', emoji: '🐉', hp: 600 },
    { name: '雑念ゴーレム', emoji: '🗿', hp: 900 },
    { name: '完璧主義デーモン', emoji: '👹', hp: 1300 },
    { name: '会議ヒドラ', emoji: '🐲', hp: 1800 },
    { name: '無限TODO皇帝', emoji: '👑', hp: 2600 }
  ];
  const WORLDS = [
    { name: '着手の草原', emoji: '🌱', desc: '最初の一歩が最強の武器。', glow: 'rgba(34,197,94,.14)' },
    { name: '集中の遺跡', emoji: '🏛️', desc: '雑念を倒して、流れに乗る。', glow: 'rgba(56,189,248,.14)' },
    { name: '完了の火山', emoji: '🌋', desc: '中途半端を終わらせる。', glow: 'rgba(249,115,22,.15)' },
    { name: '余白の空中都市', emoji: '☁️', desc: '終えたぶんだけ、時間が戻る。', glow: 'rgba(167,139,250,.16)' },
    { name: '伝説のゼロ件城', emoji: '🏰', desc: 'やるべきことを、やる。', glow: 'rgba(251,191,36,.16)' }
  ];
  const COMPANIONS = [
    { id:'slime', name:'着手スライム', emoji:'🟢', rarity:'R', effect:'最初の1個を祝う' },
    { id:'owl', name:'集中フクロウ', emoji:'🦉', rarity:'R', effect:'コンボを見守る' },
    { id:'fox', name:'段取りキツネ', emoji:'🦊', rarity:'SR', effect:'中タスクが得意' },
    { id:'wolf', name:'完遂ウルフ', emoji:'🐺', rarity:'SR', effect:'連続完了に強い' },
    { id:'phoenix', name:'復活フェニックス', emoji:'🔥', rarity:'SSR', effect:'再開を祝う' },
    { id:'dragon', name:'明日やらない竜', emoji:'🐲', rarity:'SSR', effect:'大タスクの象徴' }
  ];

  const $ = (id) => document.getElementById(id);
  const todayKey = () => new Date().toISOString().slice(0,10);
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));

  function defaultState() {
    return {
      date: todayKey(), tasks: [], completedToday: 0, totalCompleted: 0,
      combo: 0, chestProgress: 0, chestReady: false,
      xp: 0, level: 1, gold: 0, shards: 0,
      bossIndex: 0, bossHp: BOSSES[0].hp, bossKills: 0,
      unlockedWorld: 0, companions: [], summons: 0,
      sound: true, bestCombo: 0, daysActive: 1,
      daily: { first:false, three:false, hard:false },
      lastActiveDate: todayKey()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = { ...defaultState(), ...JSON.parse(raw) };
      rollover(parsed);
      return parsed;
    } catch (_) { return defaultState(); }
  }

  function rollover(s) {
    const today = todayKey();
    if (s.date === today) return;
    const prev = new Date(s.lastActiveDate || s.date);
    const now = new Date(today);
    const diff = Math.round((now - prev) / 86400000);
    if (diff >= 1) s.daysActive += 1;
    s.date = today;
    s.completedToday = 0;
    s.combo = 0;
    s.chestProgress = 0;
    s.chestReady = false;
    s.daily = { first:false, three:false, hard:false };
    s.tasks = s.tasks.filter(t => !t.completed);
    s.lastActiveDate = today;
  }

  let state = load();
  let selectedDiff = 'easy';
  let toastTimer = null;

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

  function render() {
    renderBoss(); renderStats(); renderTasks(); renderMomentum(); renderDaily(); renderWorld(); renderCollection();
    $('soundBtn').textContent = state.sound ? '♪' : '×';
  }

  function renderBoss() {
    const boss = BOSSES[state.bossIndex % BOSSES.length];
    $('bossName').textContent = boss.name;
    $('bossSprite').textContent = boss.emoji;
    $('bossSprite').setAttribute('aria-label', boss.name);
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

  function renderTasks() {
    const list = $('taskList');
    list.innerHTML = '';
    const open = state.tasks.filter(t => !t.completed);
    $('emptyState').classList.toggle('hidden', open.length > 0 || state.tasks.some(t=>t.completed));
    [...open, ...state.tasks.filter(t=>t.completed).slice(-2)].forEach(task => {
      const d = DIFF[task.diff] || DIFF.easy;
      const item = document.createElement('div');
      item.className = `task-item${task.completed?' completed':''}`;
      item.style.setProperty('--taskColor', d.color);
      item.innerHTML = `
        <button class="attack-btn" data-complete="${task.id}" ${task.completed?'disabled':''} aria-label="${escapeHtml(task.title)}を完了">${task.completed?'✓':'⚔️'}</button>
        <div class="task-copy"><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta">${d.label}クエスト · +${d.xp}XP · +${d.gold}G</div></div>
        <div class="task-damage">-${d.damage} HP</div>`;
      list.appendChild(item);
    });
  }

  function renderMomentum() {
    $('comboText').textContent = state.combo;
    const next = state.chestReady ? '宝箱を開けられる！' : `あと${3-state.chestProgress}個で宝箱`;
    $('nextRewardText').textContent = state.combo ? `${state.combo}連続中 · ${next}` : next;
    $('chestBtn').disabled = !state.chestReady;
    $('chestBtn').className = `chest-btn ${state.chestReady?'ready':'locked'}`;
    $('chestPips').innerHTML = [0,1,2].map(i=>`<i class="${i<state.chestProgress || state.chestReady?'on':''}"></i>`).join('');
  }

  function renderDaily() {
    const rows = [
      ['⚡','まず1個終える','最初の一撃を入れる',state.daily.first],
      ['🔥','3個終える','勢いを作る',state.daily.three],
      ['👑','大タスクを1個倒す','90XPクエストを完了',state.daily.hard]
    ];
    $('dailyList').innerHTML = rows.map(r=>`<div class="daily-item"><div class="daily-icon">${r[0]}</div><div class="daily-copy"><strong>${r[1]}</strong><small>${r[2]}</small></div><div class="daily-check">${r[3]?'✓':'·'}</div></div>`).join('');
    const count = rows.filter(r=>r[3]).length;
    $('dailyCount').textContent = `${count}/3`;
  }

  function renderWorld() {
    $('worldMap').innerHTML = WORLDS.map((w,i)=>`
      <div class="world-node ${i<=state.unlockedWorld?'':'locked'}" style="--nodeGlow:${w.glow}">
        <div class="world-emoji">${w.emoji}</div>
        <div class="world-copy"><strong>${w.name}</strong><small>${w.desc}</small></div>
        <div class="world-state">${i<state.unlockedWorld?'CLEARED':i===state.unlockedWorld?'NOW':'LOCKED'}</div>
      </div>`).join('');
    $('statsGrid').innerHTML = [
      ['完了したタスク',state.totalCompleted],['倒したボス',state.bossKills],['最高コンボ',state.bestCombo],['冒険日数',state.daysActive]
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

  function completeTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.completed) return;
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
    if (state.chestProgress >= 3) { state.chestReady = true; state.chestProgress = 3; }
    state.daily.first = true;
    if (state.completedToday >= 3) state.daily.three = true;
    if (task.diff === 'hard') state.daily.hard = true;
    state.bossHp -= d.damage;
    save();

    hitAnimation(d.damage);
    if (state.bossHp <= 0) {
      setTimeout(defeatBoss, 540);
    } else {
      showToast(`+${d.xp} XP · +${d.gold}G · 召喚石 +1`);
      render();
    }
  }

  function hitAnimation(dmg) {
    const boss = $('bossSprite');
    const pop = $('damagePop');
    const combo = $('comboPop');
    boss.classList.remove('hit'); void boss.offsetWidth; boss.classList.add('hit');
    pop.textContent = `-${dmg}`; pop.classList.remove('show'); void pop.offsetWidth; pop.classList.add('show');
    if (state.combo >= 2) { combo.textContent = `${state.combo} COMBO!`; combo.classList.remove('show'); void combo.offsetWidth; combo.classList.add('show'); }
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
    state.unlockedWorld = Math.min(WORLDS.length-1, state.bossKills);
    state.bossIndex = (state.bossIndex + 1) % BOSSES.length;
    state.bossHp = BOSSES[state.bossIndex].hp;
    save();
    setTimeout(()=>{
      bossEl.classList.remove('defeated');
      showReward('BOSS DEFEATED!', `<strong>${defeated.name} 撃破</strong><br>+${120 + state.bossKills*20}G · 召喚石 +2<br>新しいエリアが進んだ。`);
      render();
    },680);
  }

  function openChest() {
    if (!state.chestReady) return;
    const roll = (state.totalCompleted * 17 + state.gold * 3 + Date.now()) % 100;
    let gold = 50, shards = 1, label = 'COMMON CHEST';
    if (roll > 82) { gold = 180; shards = 3; label = 'GOLD CHEST'; }
    else if (roll > 45) { gold = 90; shards = 2; label = 'SILVER CHEST'; }
    state.gold += gold; state.shards += shards; state.chestReady = false; state.chestProgress = 0;
    save(); render();
    tone(620,.12); vibrate([30,40,30]);
    showReward(label, `<strong>+${gold} GOLD</strong><br>召喚石 +${shards}<br><span class="muted">次の3タスクでまた宝箱。</span>`);
  }

  function summon() {
    if (state.shards < 5) return;
    state.shards -= 5; state.summons += 1;
    const pool = COMPANIONS.filter(c=>!state.companions.includes(c.id));
    const pickPool = pool.length ? pool : COMPANIONS;
    const index = (state.summons * 7 + state.totalCompleted * 3 + new Date().getDate()) % pickPool.length;
    const c = pickPool[index];
    if (!state.companions.includes(c.id)) state.companions.push(c.id);
    else state.gold += 120;
    save(); render();
    tone(760,.18); vibrate([25,30,25,30,50]);
    showReward(`${c.rarity} SUMMON`, `<div style="font-size:52px">${c.emoji}</div><strong>${c.name}</strong><br>${c.effect}`);
  }

  function showReward(title, html) {
    $('rewardTitle').textContent = title;
    $('rewardBody').innerHTML = html;
    $('rewardModal').classList.remove('hidden');
  }
  function closeReward() { $('rewardModal').classList.add('hidden'); }

  function showToast(msg) {
    const t = $('toast'); clearTimeout(toastTimer); t.textContent = msg; t.classList.add('show');
    toastTimer = setTimeout(()=>t.classList.remove('show'),1800);
  }

  function openForm() {
    $('taskForm').classList.remove('hidden');
    setTimeout(()=>$('taskInput').focus(),40);
  }

  function addTask(title) {
    state.tasks.unshift({ id:uid(), title:title.trim(), diff:selectedDiff, completed:false, createdAt:Date.now() });
    save(); render();
    $('taskInput').value=''; $('taskForm').classList.add('hidden');
    showToast('クエスト追加。倒しにいこう。');
  }

  function escapeHtml(str) { return String(str).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
  function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

  let audioCtx = null;
  function tone(freq,dur) {
    if (!state.sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
      osc.type='triangle'; osc.frequency.value=freq; gain.gain.value=.035;
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start();
      gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur); osc.stop(audioCtx.currentTime+dur);
    } catch (_) {}
  }

  function switchView(target) {
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===target));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.target===target));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  $('taskForm').addEventListener('submit', e=>{ e.preventDefault(); const title=$('taskInput').value.trim(); if(title) addTask(title); });
  $('quickAddBtn').addEventListener('click',openForm); $('emptyAddBtn').addEventListener('click',openForm);
  document.querySelectorAll('.difficulty').forEach(btn=>btn.addEventListener('click',()=>{
    selectedDiff=btn.dataset.diff; document.querySelectorAll('.difficulty').forEach(b=>b.classList.toggle('active',b===btn));
  }));
  $('taskList').addEventListener('click',e=>{ const btn=e.target.closest('[data-complete]'); if(btn) completeTask(btn.dataset.complete); });
  $('chestBtn').addEventListener('click',openChest); $('summonBtn').addEventListener('click',summon);
  $('rewardCloseBtn').addEventListener('click',closeReward); $('rewardModal').addEventListener('click',e=>{ if(e.target===$('rewardModal')) closeReward(); });
  $('soundBtn').addEventListener('click',()=>{ state.sound=!state.sound; save(); render(); showToast(state.sound?'サウンド ON':'サウンド OFF'); });
  $('homeBtn').addEventListener('click',()=>{ location.href='/'; });
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.target)));

  window.__TODO_RAID__ = { getState:()=>JSON.parse(JSON.stringify(state)), reset:()=>{localStorage.removeItem(STORAGE_KEY);location.reload();} };
  render();
})();
