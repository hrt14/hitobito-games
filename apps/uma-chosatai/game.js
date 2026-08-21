const CASES = [
  {
    id: 'nessie',
    name: 'ネッシー',
    region: 'SCOTLAND / LOCH NESS',
    pin: [51, 27],
    coords: '57.3229°N · 4.4244°W',
    glyph: '≈',
    aquatic: true,
    lead: 'ネス湖で長く語られてきた「湖の怪物」案件。水面の影だけを追わず、波・鳥・魚などの既知候補を消しながら記録を重ねる。',
    pattern: '長い航跡 / 水面下の影 / 低い水音',
    decoy: '波・鳥・大型魚・流木',
    briefBg: 'linear-gradient(180deg,#173e42 0%,#102b2e 44%,#081415 100%)',
    fieldBg: 'linear-gradient(180deg,#17373c 0%,#10272b 44%,#071112 100%)',
    tools: { trace: ['ソナー', '水中の反響を拾う'] },
    zones: [
      { id: 'north', name: '北岸', icon: '⌇', x: 21, y: 59, cue: 'audio' },
      { id: 'deep', name: '深水域', icon: '≈', x: 50, y: 53, cue: 'trace' },
      { id: 'pier', name: '桟橋', icon: '┆', x: 76, y: 66, cue: 'visual' },
      { id: 'cove', name: '入り江', icon: '◜', x: 68, y: 34, cue: 'thermal' }
    ],
    evidence: {
      visual: '波とは逆向きに進む細い航跡を記録。',
      audio: '水面下から周期の違う低い反響を記録。',
      trace: 'ソナーに短時間だけ連続する移動反応。',
      thermal: '水温と異なる小さな熱差が移動した。'
    },
    decoys: ['波頭の重なりを長い背中と誤認していた。', '水鳥の列が遠距離で一つの影に見えていた。', '漂流物の反射がカメラ上で生物の輪郭に見えていた。']
  },
  {
    id: 'sasquatch',
    name: 'サスカッチ',
    region: 'NORTH AMERICA / PACIFIC NORTHWEST',
    pin: [16, 27],
    coords: '46.8°N · 121.7°W',
    glyph: '⌁',
    aquatic: false,
    lead: '北米の森林で語られる大型の毛深い人型生物の調査案件。足跡や遠い声だけで断定せず、クマ・人・地形音の可能性を一つずつ除外する。',
    pattern: '大きな足跡 / 木立の影 / 遠い叫声',
    decoy: 'クマ・人間・倒木・反響音',
    briefBg: 'linear-gradient(180deg,#22392c 0%,#15271d 48%,#08100c 100%)',
    fieldBg: 'linear-gradient(180deg,#1d3326 0%,#102219 48%,#050b08 100%)',
    zones: [
      { id: 'ridge', name: '尾根', icon: '⌃', x: 18, y: 43, cue: 'visual' },
      { id: 'creek', name: '沢', icon: '⌇', x: 43, y: 68, cue: 'trace' },
      { id: 'cedar', name: '杉林', icon: '♠', x: 68, y: 45, cue: 'audio' },
      { id: 'cut', name: '伐採跡', icon: '╱', x: 82, y: 69, cue: 'thermal' }
    ],
    evidence: {
      visual: '木立の奥で二足歩行らしい影が一度だけ横切った。',
      audio: '既知の鳥声と周期が合わない短い発声を記録。',
      trace: '人の靴跡とは形の異なる連続痕を記録。',
      thermal: '大型動物サイズの熱源が立ち上がるように移動した。'
    },
    decoys: ['立ち上がったクマの影が人型に見えた可能性を除外。', '登山者の足跡が雨で拡大していた。', '谷の反響で一つの鳴き声が複数方向から聞こえていた。']
  },
  {
    id: 'yeti',
    name: 'イエティ',
    region: 'HIMALAYA / HIGH ALPINE',
    pin: [72, 35],
    coords: '27.9°N · 86.9°E',
    glyph: '△',
    aquatic: false,
    lead: 'ヒマラヤで語られる雪男の調査案件。過去の「イエティ由来」とされた試料にはクマ類など既知動物と判明した例があるため、痕跡の一致を厳しく見る。',
    pattern: '雪上の足跡 / 岩稜の影 / 夜間の物音',
    decoy: 'ヒマラヤのクマ類・人間・雪崩痕',
    briefBg: 'linear-gradient(180deg,#71858a 0%,#31494d 43%,#10191a 100%)',
    fieldBg: 'linear-gradient(180deg,#61767b 0%,#2b4144 42%,#0b1213 100%)',
    zones: [
      { id: 'pass', name: '峠', icon: '△', x: 24, y: 40, cue: 'visual' },
      { id: 'moraine', name: '氷堆石', icon: '◆', x: 45, y: 67, cue: 'trace' },
      { id: 'cave', name: '岩穴', icon: '◒', x: 72, y: 52, cue: 'thermal' },
      { id: 'slope', name: '雪斜面', icon: '⌁', x: 82, y: 28, cue: 'audio' }
    ],
    evidence: {
      visual: '岩稜を横切る影を連写し、四足動物の輪郭とは一致しないフレームを得た。',
      audio: '風速の変化と同期しない短い打撃音を記録。',
      trace: '雪上に一定間隔で続く痕跡を測定。崩落だけでは説明しにくい。',
      thermal: '岩穴の奥で移動する熱源を短時間だけ検出。'
    },
    decoys: ['クマ類の痕跡と一致する特徴を確認し候補から除外。', '融雪で広がった足跡が実寸以上に大きく見えていた。', '落石音が谷壁で反響し接近音のように聞こえていた。']
  },
  {
    id: 'chupacabra',
    name: 'チュパカブラ',
    region: 'PUERTO RICO / RURAL NIGHT',
    pin: [30, 43],
    coords: '18.2°N · 66.5°W',
    glyph: '✣',
    aquatic: false,
    lead: '1990年代のプエルトリコで広まった怪生物の調査案件。後年の類似報告では皮膚病のコヨーテなど既知動物が正体だった例もある。',
    pattern: '家畜周辺の異変 / 夜間の四足影 / 乾いた鳴き声',
    decoy: '犬・コヨーテ類・皮膚病の野生動物',
    briefBg: 'linear-gradient(180deg,#4b2a2b 0%,#28191b 47%,#0d0a0a 100%)',
    fieldBg: 'linear-gradient(180deg,#402528 0%,#211719 46%,#090707 100%)',
    zones: [
      { id: 'pen', name: '家畜小屋', icon: '▥', x: 21, y: 63, cue: 'trace' },
      { id: 'road', name: '未舗装路', icon: '═', x: 48, y: 70, cue: 'visual' },
      { id: 'scrub', name: '低木地', icon: '♣', x: 72, y: 47, cue: 'thermal' },
      { id: 'tank', name: '貯水槽', icon: '◉', x: 81, y: 27, cue: 'audio' }
    ],
    evidence: {
      visual: '既知の犬科とは歩様が異なるフレームを一度記録。',
      audio: '周辺の犬声と一致しない短い発声を分離した。',
      trace: '同一方向へ続く足跡列を測定し、家畜の痕跡と分離した。',
      thermal: '低い姿勢の熱源が遮蔽物の間を高速で移動した。'
    },
    decoys: ['皮膚の状態が悪い犬科動物を誤認した可能性を除外。', '家畜の足跡が重なり奇妙な形になっていた。', '夜間照明の影で背中の輪郭が大きく変形していた。']
  },
  {
    id: 'tsuchinoko',
    name: 'ツチノコ',
    region: 'JAPAN / MOUNTAIN VILLAGE',
    pin: [86, 34],
    coords: '35.4°N · 137.3°E',
    glyph: '∿',
    aquatic: false,
    lead: '日本で古くから語られ、1970年代には「幻のヘビ」として全国的な未確認動物ブームにもなった存在を追う。小さな動きほど先入観を捨てる。',
    pattern: '太い蛇状の影 / 草むらの擦過 / 短い移動痕',
    decoy: '既知のヘビ・トカゲ・枝・草の揺れ',
    briefBg: 'linear-gradient(180deg,#3f4d28 0%,#223119 48%,#0a1008 100%)',
    fieldBg: 'linear-gradient(180deg,#354625 0%,#1b2a15 46%,#070c06 100%)',
    zones: [
      { id: 'stone', name: '石垣', icon: '▦', x: 22, y: 62, cue: 'thermal' },
      { id: 'grass', name: '草地', icon: '〽', x: 47, y: 69, cue: 'visual' },
      { id: 'ditch', name: '水路', icon: '⌇', x: 72, y: 56, cue: 'trace' },
      { id: 'shed', name: '物置裏', icon: '▰', x: 81, y: 31, cue: 'audio' }
    ],
    evidence: {
      visual: '草むらを横切る短く太い輪郭を複数フレームで記録。',
      audio: '草擦れとは別に、短い接触音が同じ方向へ移動した。',
      trace: '蛇行だけではない短い圧痕が連続していた。',
      thermal: '石垣の隙間から細長い小型熱源が移動した。'
    },
    decoys: ['既知のヘビの胴が折れ曲がって太く見えたケースを除外。', '風で倒れた草が移動痕のように並んでいた。', '湿った枝の反射が生物の皮膚に見えていた。']
  },
  {
    id: 'orang-pendek',
    name: 'オラン・ペンデク',
    region: 'SUMATRA / RAINFOREST',
    pin: [78, 62],
    coords: '1.7°S · 101.3°E',
    glyph: '♟',
    aquatic: false,
    lead: 'スマトラの森林で語られる小柄な二足歩行の霊長類のような存在を追う。伝承や目撃談はあるが、決定的な写真・物証は確認されていない。',
    pattern: '小柄な二足影 / 足跡 / 森林内の発声',
    decoy: 'テナガザル類・マカク類・マレーグマ・人間',
    briefBg: 'linear-gradient(180deg,#1f533d 0%,#153a2b 46%,#07130e 100%)',
    fieldBg: 'linear-gradient(180deg,#194631 0%,#102f22 46%,#050e0a 100%)',
    zones: [
      { id: 'trail', name: '獣道', icon: '╱', x: 18, y: 66, cue: 'trace' },
      { id: 'fig', name: '果実林', icon: '♣', x: 44, y: 49, cue: 'visual' },
      { id: 'ravine', name: '谷底', icon: '⌄', x: 69, y: 70, cue: 'audio' },
      { id: 'bamboo', name: '竹林', icon: 'ǀ', x: 82, y: 37, cue: 'thermal' }
    ],
    evidence: {
      visual: '地表近くを二足で横切る小柄な影を短時間記録。',
      audio: '既知の周辺霊長類と周期が異なる短い発声を記録。',
      trace: '獣道に左右交互へ続く足跡状の圧痕を測定。',
      thermal: '地上を移動する中型熱源が一度立ち止まった。'
    },
    decoys: ['マカク類の移動痕と一致する部分を候補から除外。', 'マレーグマの足跡に近い形状を確認し別扱いにした。', '枝葉の揺れが二足歩行の輪郭に見える視差を確認した。']
  }
];

const TOOLS = [
  { id: 'camera', name: '望遠カメラ', channel: 'visual', cost: 1, note: '遠い動きを記録' },
  { id: 'recorder', name: '指向性マイク', channel: 'audio', cost: 1, note: '音の方向を切り分ける' },
  { id: 'trace', name: '痕跡キット', channel: 'trace', cost: 1, note: '足跡・接触痕を測る' },
  { id: 'thermal', name: '熱源スコープ', channel: 'thermal', cost: 2, note: '高精度 / 電池2' }
];

const CHANNEL_LABELS = { visual: 'VISUAL', audio: 'AUDIO', trace: 'TRACE', thermal: 'THERMAL' };
const STORAGE_KEY = 'uma_chosatai_records_v1';
const screens = [...document.querySelectorAll('.screen')];
const $ = (id) => document.getElementById(id);

let records = readRecords();
let currentCaseIndex = 0;
let state = null;
let soundEnabled = true;
let audioCtx = null;
let encounterTimer = null;
let encounterStart = 0;
let toastTimer = null;

function readRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveRecords() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch {}
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function rand(items) { return items[Math.floor(Math.random() * items.length)]; }
function caseData() { return CASES[currentCaseIndex]; }

function showScreen(name) {
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === `screen-${name}`));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function vibrate(pattern = 10) {
  try { navigator.vibrate?.(pattern); } catch {}
}

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(freq = 440, duration = .045, gain = .025, type = 'sine') {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function successSound() {
  tone(420, .06, .03, 'triangle');
  setTimeout(() => tone(620, .08, .025, 'triangle'), 60);
}

function failSound() { tone(150, .11, .03, 'sawtooth'); }

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

function renderWorld() {
  const pins = $('mapPins');
  const rail = $('caseRail');
  pins.innerHTML = '';
  rail.innerHTML = '';

  CASES.forEach((c, index) => {
    const record = records[c.id];
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = `map-pin${record ? ' done' : ''}`;
    pin.style.left = `${c.pin[0]}%`;
    pin.style.top = `${c.pin[1]}%`;
    pin.innerHTML = `<span>${c.name}</span>`;
    pin.setAttribute('aria-label', `${c.name}の調査案件を開く`);
    pin.addEventListener('click', () => openBriefing(index));
    pins.appendChild(pin);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `case-card${record ? ' done' : ''}`;
    card.style.setProperty('--case-glow', record ? 'rgba(119,233,215,.12)' : 'rgba(217,255,102,.10)');
    const score = record ? `BEST ${record.score}%` : c.region.split(' / ')[0];
    card.innerHTML = `<span class="case-no">CASE ${String(index + 1).padStart(2, '0')}</span><strong>${c.name}</strong><span>${score}</span>`;
    card.addEventListener('click', () => openBriefing(index));
    rail.appendChild(card);
  });

  const nextIndex = CASES.findIndex((c) => !records[c.id]);
  $('continueBtn').textContent = nextIndex >= 0 ? `CASE ${String(nextIndex + 1).padStart(2, '0')} を調査` : 'ランダム案件を再調査';
  $('continueBtn').onclick = () => openBriefing(nextIndex >= 0 ? nextIndex : Math.floor(Math.random() * CASES.length));
}

function openBriefing(index) {
  currentCaseIndex = index;
  const c = caseData();
  $('briefRegion').textContent = `CASE ${String(index + 1).padStart(2, '0')} / ${c.region}`;
  $('brief-title').textContent = c.name;
  $('briefLead').textContent = c.lead;
  $('briefPattern').textContent = c.pattern;
  $('briefDecoy').textContent = c.decoy;
  $('briefCoords').textContent = c.coords;
  $('briefGlyph').textContent = c.glyph;
  $('briefSky').style.setProperty('--brief-bg', c.briefBg);
  showScreen('briefing');
  tone(280, .05, .018, 'triangle');
}

function newRun() {
  const c = caseData();
  const targetIndex = Math.floor(Math.random() * c.zones.length);
  state = {
    time: 8,
    battery: 8,
    selectedZone: null,
    targetIndex,
    evidence: { visual: 0, audio: 0, trace: 0, thermal: 0 },
    decoys: 0,
    logs: [],
    actions: 0,
    strongestHint: null,
    captured: false,
    photoQuality: 0,
    ended: false
  };
  refreshSignals(true);
  renderField(true);
  showScreen('field');
  tone(220, .055, .02, 'triangle');
}

function refreshSignals(initial = false) {
  const c = caseData();
  state.signals = c.zones.map((_, i) => {
    if (i === state.targetIndex) return 3;
    const distance = Math.abs(i - state.targetIndex);
    if (distance === 1 || distance === c.zones.length - 1) return Math.random() < .7 ? 2 : 1;
    return Math.random() < .28 ? 2 : 1;
  });
  if (!initial && Math.random() < .34) {
    const choices = c.zones.map((_, i) => i).filter((i) => i !== state.targetIndex);
    const old = state.targetIndex;
    state.targetIndex = rand(choices);
    state.signals[old] = Math.max(1, state.signals[old] - 1);
    state.signals[state.targetIndex] = 3;
    state.logs.unshift('気配が移動した。前の地点に固執しない方がよさそうだ。');
  }
  const targetZone = c.zones[state.targetIndex];
  const cueLabel = {
    visual: '瞬間的な動き', audio: '断続的な音', trace: '地面・水面の乱れ', thermal: '温度差'
  }[targetZone.cue];
  state.strongestHint = `${targetZone.name}方向で${cueLabel}。パルスの強い地点ほど今は有望。`;
}

function renderField(first = false) {
  const c = caseData();
  $('field-title').textContent = c.name;
  $('fieldRegion').textContent = c.region;
  $('timeStat').textContent = state.time;
  $('batteryStat').textContent = state.battery;
  $('fieldStage').style.setProperty('--field-bg', c.fieldBg);
  $('fieldClock').textContent = `${String(21 + Math.floor(state.actions / 3)).padStart(2, '0')}:${String((10 + state.actions * 7) % 60).padStart(2, '0')}`;
  $('fieldHint').textContent = state.selectedZone == null ? '気になる場所をタップ' : '装備を選んで調査';
  $('sensorLine').textContent = state.strongestHint;

  renderZones();
  renderTools();
  renderEvidence();
  updateStakeout();

  if (first) {
    $('selectedZoneLabel').textContent = '未選択';
    $('toolGuide').textContent = '① 場所を選ぶ';
  }
}

function renderZones() {
  const c = caseData();
  const root = $('zones');
  root.innerHTML = '';
  c.zones.forEach((zone, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `zone-btn signal-${state.signals[index]}${state.selectedZone === index ? ' selected' : ''}`;
    btn.style.left = `${zone.x}%`;
    btn.style.top = `${zone.y}%`;
    btn.style.setProperty('--pulse', `${3.2 - state.signals[index] * .55}s`);
    btn.innerHTML = `<span class="zone-pulse"></span><span class="zone-icon">${zone.icon}</span><span class="zone-label">${zone.name}</span>`;
    btn.setAttribute('aria-label', `${zone.name}を選択。反応レベル${state.signals[index]}`);
    btn.addEventListener('click', () => selectZone(index));
    root.appendChild(btn);
  });
}

function selectZone(index) {
  if (!state || state.ended) return;
  state.selectedZone = index;
  const zone = caseData().zones[index];
  $('selectedZoneLabel').textContent = `${zone.name} / SIGNAL ${state.signals[index]}`;
  $('toolGuide').textContent = '② 装備を選ぶ';
  renderZones();
  renderTools();
  tone(330 + state.signals[index] * 55, .035, .018, 'square');
  vibrate(7);
}

function toolDisplay(tool) {
  const c = caseData();
  const override = c.tools?.[tool.id];
  if (!override) return [tool.name, tool.note];
  return [override[0], override[1]];
}

function renderTools() {
  const root = $('tools');
  root.innerHTML = '';
  TOOLS.forEach((tool) => {
    const [name, note] = toolDisplay(tool);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tool-btn';
    btn.disabled = state.selectedZone == null || state.battery < tool.cost || state.time <= 0 || state.ended;
    btn.innerHTML = `<b>${name}</b><span>${note}</span><em>BAT -${tool.cost}</em>`;
    btn.addEventListener('click', () => investigate(tool));
    root.appendChild(btn);
  });
}

function investigate(tool) {
  if (state.selectedZone == null || state.ended) return;
  if (state.battery < tool.cost) return toast('バッテリーが足りない');
  if (state.time <= 0) return endWithoutPhoto('時間切れ');

  const c = caseData();
  const zone = c.zones[state.selectedZone];
  const isTarget = state.selectedZone === state.targetIndex;
  const cueMatch = tool.channel === zone.cue;
  const signal = state.signals[state.selectedZone];
  const already = state.evidence[tool.channel];

  state.time -= 1;
  state.battery -= tool.cost;
  state.actions += 1;

  let successChance = .13 + signal * .08;
  if (isTarget) successChance += .33;
  if (cueMatch) successChance += .18;
  if (tool.id === 'thermal') successChance += .08;
  if (already >= 2) successChance -= .18;

  const roll = Math.random();
  if (roll < successChance) {
    state.evidence[tool.channel] = Math.min(3, already + 1);
    state.logs.unshift(`${zone.name} / ${CHANNEL_LABELS[tool.channel]} — ${c.evidence[tool.channel]}`);
    successSound();
    vibrate([12, 24, 12]);
    toast('独立証拠を記録');
  } else {
    const decoyChance = .34 + (isTarget ? -.08 : .14) + (cueMatch ? .08 : 0);
    if (Math.random() < decoyChance) {
      state.decoys += 1;
      const message = rand(c.decoys);
      state.logs.unshift(`既知候補を除外 — ${message}`);
      tone(210, .07, .022, 'triangle');
      vibrate(9);
      toast('誤認候補を1つ除外');
    } else {
      state.logs.unshift(`${zone.name} / ${CHANNEL_LABELS[tool.channel]} — 有効な反応なし。`);
      tone(170, .045, .016, 'sine');
      toast('反応なし。場所か手段を変えよう');
    }
  }

  state.selectedZone = null;
  refreshSignals(false);
  renderField(false);

  if (state.time <= 0) {
    setTimeout(() => endWithoutPhoto('調査時間終了'), 650);
  }
}

function evidenceSummary() {
  const values = Object.values(state.evidence);
  const total = values.reduce((a, b) => a + b, 0);
  const unique = values.filter((v) => v > 0).length;
  return { total, unique };
}

function renderEvidence() {
  for (const channel of Object.keys(state.evidence)) {
    const cell = document.querySelector(`.evidence-cell[data-evidence="${channel}"] .evidence-dots`);
    cell.innerHTML = [0, 1, 2].map((i) => `<i class="${state.evidence[channel] > i ? 'on' : ''}"></i>`).join('');
  }
  const { total, unique } = evidenceSummary();
  const certainty = clamp(unique * 13 + total * 5 + Math.min(state.decoys, 4) * 3, 0, 69);
  $('certaintyText').textContent = `確度 ${certainty}%`;
  $('evidenceLog').innerHTML = state.logs.length
    ? state.logs.slice(0, 6).map((log) => `<span class="${log.startsWith('既知候補') ? 'decoy' : log.includes('有効な反応なし') || log.includes('気配が移動') ? '' : 'good'}">${escapeHtml(log)}</span>`).join('')
    : '<span>まだ確かな証拠はない。</span>';
}

function updateStakeout() {
  const { total, unique } = evidenceSummary();
  const ready = unique >= 3 && total >= 4 && state.time > 0 && !state.ended;
  const btn = $('stakeoutBtn');
  btn.disabled = !ready;
  btn.classList.toggle('ready', ready);
  if (ready) {
    btn.innerHTML = `張り込む <span>${unique}系統 / 証拠${total} — 接触を狙える</span>`;
  } else {
    const needTypes = Math.max(0, 3 - unique);
    const needTotal = Math.max(0, 4 - total);
    btn.innerHTML = `張り込む <span>あと${needTypes}系統・証拠${needTotal}</span>`;
  }
}

function stakeout() {
  if (!state || $('stakeoutBtn').disabled || state.ended) return;
  const { total, unique } = evidenceSummary();
  state.time -= 1;
  state.actions += 1;
  state.selectedZone = null;
  renderField(false);

  const chance = clamp(.28 + unique * .09 + total * .055 + Math.min(state.decoys, 4) * .025, .45, .91);
  tone(90, .18, .03, 'sine');
  toast('灯りを落として張り込み…');

  setTimeout(() => {
    if (Math.random() <= chance) {
      beginEncounter();
    } else if (state.time > 0) {
      state.logs.unshift('接近音は止まった。証拠は失っていない。別の地点へ移動したようだ。');
      refreshSignals(false);
      renderField(false);
      failSound();
      toast('空振り。まだ時間はある');
    } else {
      endWithoutPhoto('張り込みは空振りだった');
    }
  }, 1050);
}

function beginEncounter() {
  state.ended = true;
  clearTimeout(encounterTimer);
  const target = $('cryptidTarget');
  target.classList.toggle('aquatic', caseData().aquatic);
  target.style.top = `${30 + Math.floor(Math.random() * 39)}%`;
  target.style.animation = 'none';
  void target.offsetWidth;
  target.style.animation = '';
  showScreen('encounter');
  encounterStart = performance.now();
  vibrate([25, 35, 25]);
  tone(72, .5, .035, 'sine');
  encounterTimer = setTimeout(() => finishEncounter(false, 0), 4050);
}

function captureTarget() {
  if (!state || !state.ended || !document.getElementById('screen-encounter').classList.contains('active')) return;
  clearTimeout(encounterTimer);
  const elapsed = performance.now() - encounterStart;
  const quality = clamp(Math.round(100 - Math.abs(elapsed - 1900) / 22), 35, 100);
  finishEncounter(true, quality);
}

function finishEncounter(captured, photoQuality) {
  state.captured = captured;
  state.photoQuality = photoQuality;
  if (captured) {
    successSound();
    setTimeout(successSound, 100);
    vibrate([18, 20, 18, 20, 35]);
    document.body.animate([{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 180 });
  } else {
    failSound();
    vibrate(35);
  }
  setTimeout(() => renderResult(captured ? '撮影成功' : 'シャッターが間に合わなかった'), captured ? 240 : 120);
}

function endWithoutPhoto(reason) {
  if (!state || state.resultShown) return;
  state.ended = true;
  state.captured = false;
  state.photoQuality = 0;
  renderResult(reason);
}

function calculateScore() {
  const { total, unique } = evidenceSummary();
  let score = total * 6 + unique * 9 + Math.min(state.decoys, 5) * 3;
  if (state.captured) score += 22 + Math.round(state.photoQuality * .10);
  return clamp(score, 12, 99);
}

function renderResult(reason) {
  if (state.resultShown) return;
  state.resultShown = true;
  const c = caseData();
  const { total, unique } = evidenceSummary();
  const score = calculateScore();
  const previous = records[c.id];
  const isBest = !previous || score > previous.score;
  if (isBest) {
    records[c.id] = { score, captured: state.captured, at: new Date().toISOString() };
    saveRecords();
  }

  const rank = score >= 82 ? '高確度フィールド記録' : score >= 65 ? '有力記録' : score >= 45 ? '調査継続' : '証拠不足';
  $('resultEyebrow').textContent = `${rank.toUpperCase()} / ${reason}`;
  $('result-title').textContent = c.name;
  $('resultConfidence').textContent = `${score}%`;
  $('resultSummary').textContent = state.captured
    ? `${unique}種類の独立証拠を積み上げ、接触時の撮影に成功した。${isBest ? 'この案件の自己最高記録を更新。' : '前回記録には届かなかった。別の装備順ならさらに精度を上げられる。'}`
    : `${unique}種類の独立証拠、合計${total}点を記録したが決定的な撮影には至らなかった。ログから弱かった証拠系統を見て、次の調査順を変えられる。`;

  $('resultBreakdown').innerHTML = `
    <div><span>INDEPENDENT TYPES</span><b>${unique} / 4</b></div>
    <div><span>EVIDENCE POINTS</span><b>${total}</b></div>
    <div><span>FALSE POSITIVES CLEARED</span><b>${state.decoys}</b></div>
    <div><span>PHOTO</span><b>${state.captured ? `${state.photoQuality}%` : 'NO RECORD'}</b></div>`;

  $('resultPhoto').style.background = c.aquatic
    ? 'linear-gradient(180deg,#879a98 0%,#425b5a 42%,#152729 58%,#071114 100%)'
    : 'linear-gradient(180deg,#768a80 0%,#314139 55%,#0b1410 100%)';
  $('resultSilhouette').classList.toggle('aquatic', c.aquatic);
  $('resultPhoto').style.opacity = state.captured ? '1' : '.46';
  $('nextCaseBtn').textContent = currentCaseIndex < CASES.length - 1 ? '次の地域へ' : '別の案件へ';
  showScreen('result');
  renderWorld();
}

function retryCurrent() { newRun(); }

function nextCase() {
  currentCaseIndex = (currentCaseIndex + 1) % CASES.length;
  openBriefing(currentCaseIndex);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

$('deployBtn').addEventListener('click', newRun);
$('stakeoutBtn').addEventListener('click', stakeout);
$('cryptidTarget').addEventListener('click', captureTarget);
$('retryBtn').addEventListener('click', retryCurrent);
$('nextCaseBtn').addEventListener('click', nextCase);
$('resetBtn').addEventListener('click', () => {
  if (!confirm('全案件の自己ベスト記録を消しますか？')) return;
  records = {};
  saveRecords();
  renderWorld();
  tone(160, .08, .02, 'triangle');
});
$('soundToggle').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  $('soundToggle').textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
  if (soundEnabled) tone(440, .05, .02, 'triangle');
});
document.querySelectorAll('[data-action="world"]').forEach((button) => button.addEventListener('click', () => {
  clearTimeout(encounterTimer);
  renderWorld();
  showScreen('world');
}));

document.addEventListener('pointerdown', ensureAudio, { once: true });
renderWorld();
