const STORAGE_KEY = 'levelup.resultSteps.v1';

const GOALS = {
  english: {
    title: '英語', eyebrow: 'ENGLISH', target: 100,
    actions: [
      { label: '英語を5分使った', note: '読む・聞く・書く、どれでもOK。', points: 1 },
      { label: '声に出して10分話した', note: '独り言でも音読でも、口を使った。', points: 2 },
      { label: '人やAIと英語で会話した', note: '実際のやり取りに使った。', points: 3 },
    ],
  },
  fitness: {
    title: '運動', eyebrow: 'FITNESS', target: 90,
    actions: [
      { label: '5分だけ身体を動かした', note: '散歩・ストレッチでも成立。', points: 1 },
      { label: '20分以上運動した', note: '少し息が上がる時間を作った。', points: 2 },
      { label: '予定したトレーニングを完了した', note: '決めた内容を最後まで実行した。', points: 3 },
    ],
  },
  money: {
    title: 'お金', eyebrow: 'MONEY', target: 200,
    actions: [
      { label: '興味を持って調べた', note: '市場・顧客・商品・仕組みを1つ知った。', points: 1 },
      { label: '新しい価値を作った', note: '商品・提案・改善を形にした。', points: 2 },
      { label: '売る・提案する行動をした', note: '現実の相手に届けた。', points: 3 },
    ],
  },
  work: {
    title: '仕事', eyebrow: 'WORK', target: 120,
    actions: [
      { label: '5分だけ着手した', note: '考えるだけでなく手を動かした。', points: 1 },
      { label: '重要な1件を前へ進めた', note: '完了でなくても詰まりを1つ解いた。', points: 2 },
      { label: '成果物を出した・渡した', note: '自分の中で終わらせず外へ出した。', points: 3 },
    ],
  },
  create: {
    title: '創作', eyebrow: 'CREATE', target: 80,
    actions: [
      { label: '5分作った', note: '完成度を問わず、素材を増やした。', points: 1 },
      { label: '1つのまとまりを作った', note: '1ページ・1案・1パーツまで進めた。', points: 2 },
      { label: '人に見せた・公開した', note: '反応が返る場所へ出した。', points: 3 },
    ],
  },
};

const el = (id) => document.getElementById(id);
const goalScreen = el('goalScreen');
const progressScreen = el('progressScreen');
const changeGoalBtn = el('changeGoalBtn');
const actionList = el('actionList');
const noActionBtn = el('noActionBtn');
const celebration = el('celebration');
let toastTimer = 0;

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDay(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayDiff(fromKey, toKey) {
  if (!fromKey || !toKey) return 0;
  const ms = parseDay(toKey) - parseDay(fromKey);
  return Math.max(0, Math.round(ms / 86400000));
}

function initialState() {
  return { activeGoal: null, goals: {} };
}

function newGoalState() {
  return {
    foundation: 0,
    momentum: 0,
    lastActionDate: null,
    appliedMissedDays: 0,
    history: [],
    breakthroughShown: false,
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.goals || typeof parsed.goals !== 'object') throw new Error('invalid');
    if (parsed.activeGoal && !GOALS[parsed.activeGoal]) parsed.activeGoal = null;
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return initialState();
  }
}

let store = loadStore();

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function stateFor(goalKey) {
  if (!store.goals[goalKey]) store.goals[goalKey] = newGoalState();
  const s = store.goals[goalKey];
  s.foundation = Number.isFinite(Number(s.foundation)) ? Math.max(0, Number(s.foundation)) : 0;
  s.momentum = Number.isFinite(Number(s.momentum)) ? Math.max(-20, Math.min(15, Number(s.momentum))) : 0;
  s.appliedMissedDays = Number.isFinite(Number(s.appliedMissedDays)) ? Math.max(0, Number(s.appliedMissedDays)) : 0;
  s.history = Array.isArray(s.history) ? s.history.slice(0, 20) : [];
  return s;
}

function currentGoalKey() {
  return store.activeGoal && GOALS[store.activeGoal] ? store.activeGoal : null;
}

function showScreen(name) {
  const isGoal = name === 'goal';
  goalScreen.classList.toggle('active', isGoal);
  progressScreen.classList.toggle('active', !isGoal);
  changeGoalBtn.hidden = isGoal;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  const node = el('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1800);
}

function effectiveSteps(s) {
  return Math.max(0, s.foundation + s.momentum);
}

function phaseFor(ratio) {
  if (ratio >= 1) return ['突破ゾーン', '積み上げが見える変化につながる区間。ここからも続けられます。'];
  if (ratio >= .82) return ['変化が見え始める区間', '傾きが変わってきた。ここまでの静かな積み上げが土台です。'];
  if (ratio >= .55) return ['まだ静かな区間', '結果は小さくても、現在地は確実に右へ進んでいます。'];
  return ['まだ見えない区間', '結果はまだ静か。でも、積み上げは始まっています。'];
}

function processAbsence(goalKey) {
  const s = stateFor(goalKey);
  const today = todayKey();
  if (!s.lastActionDate) return 0;
  const totalMissed = Math.max(0, dayDiff(s.lastActionDate, today) - 1);
  const newMissed = Math.max(0, totalMissed - s.appliedMissedDays);
  if (!newMissed) return 0;
  const loss = newMissed * 5;
  s.momentum = Math.max(-20, s.momentum - loss);
  s.appliedMissedDays = totalMissed;
  s.history.unshift({ date: today, label: `空白日 ${newMissed}日`, note: '積み上げはそのまま。勢いだけ調整。', delta: -loss, type: 'miss-auto' });
  s.history = s.history.slice(0, 20);
  saveStore();
  return loss;
}

function hasTodayEntry(s) {
  const today = todayKey();
  return s.history.some((item) => item && item.date === today && (item.type === 'action' || item.type === 'miss-manual'));
}

function streakFromHistory(s) {
  const actionDays = [...new Set(s.history.filter((item) => item.type === 'action').map((item) => item.date))]
    .sort((a, b) => b.localeCompare(a));
  if (!actionDays.length) return 0;
  const today = todayKey();
  const startGap = dayDiff(actionDays[0], today);
  if (startGap > 1) return 0;
  let streak = 1;
  for (let i = 1; i < actionDays.length; i += 1) {
    if (dayDiff(actionDays[i], actionDays[i - 1]) === 1) streak += 1;
    else break;
  }
  return streak;
}

function pointOnCurve(ratio) {
  const path = el('curveLine');
  const targetFraction = ratio <= 1 ? Math.max(0, ratio) * .86 : Math.min(1, .86 + (ratio - 1) * .7);
  const length = path.getTotalLength();
  return path.getPointAtLength(length * targetFraction);
}

function renderActions(goalKey, s) {
  const goal = GOALS[goalKey];
  const completed = hasTodayEntry(s);
  const multiplier = s.foundation >= goal.target ? 2 : 1;
  actionList.innerHTML = '';
  goal.actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-btn';
    button.disabled = completed;
    button.dataset.points = String(action.points);
    button.innerHTML = `<span class="action-copy"><strong>${action.label}</strong><small>${action.note}</small></span><span class="action-points">+${action.points * multiplier}<small>歩</small></span>`;
    button.addEventListener('click', () => recordAction(goalKey, action));
    actionList.appendChild(button);
  });
  noActionBtn.disabled = completed;
  const doneNote = el('doneNote');
  doneNote.hidden = !completed;
  if (completed) {
    const todayItem = s.history.find((item) => item.date === todayKey() && (item.type === 'action' || item.type === 'miss-manual'));
    doneNote.textContent = todayItem?.type === 'action'
      ? `今日は「${todayItem.label}」を記録済み。次の1歩は明日。`
      : '今日は休む日として記録済み。積み上げは消えていません。';
  }
  el('todayHint').textContent = multiplier > 1 ? '突破後ボーナス：ゲーム上の歩数 ×2' : '実際にやったものを1つ。';
}

function renderHistory(s) {
  const list = el('historyList');
  const rows = s.history.slice(0, 6);
  if (!rows.length) {
    list.innerHTML = '<p class="empty-history">最初の1歩を記録すると、ここに残ります。</p>';
    return;
  }
  list.innerHTML = rows.map((item) => {
    const [, month, day] = item.date.split('-');
    const minus = Number(item.delta) < 0;
    const delta = Number(item.delta) > 0 ? `+${item.delta}` : String(item.delta || 0);
    return `<div class="history-item"><span class="history-date">${Number(month)}/${Number(day)}</span><span class="history-main"><strong>${item.label}</strong><small>${item.note || ''}</small></span><span class="history-delta${minus ? ' minus' : ''}">${delta}</span></div>`;
  }).join('');
}

function renderProgress(options = {}) {
  const goalKey = currentGoalKey();
  if (!goalKey) return showScreen('goal');
  const goal = GOALS[goalKey];
  const s = stateFor(goalKey);
  const loss = options.skipAbsence ? 0 : processAbsence(goalKey);
  const effective = effectiveSteps(s);
  const ratio = effective / goal.target;
  const remaining = Math.max(0, Math.ceil(goal.target - effective));
  const [phase, message] = phaseFor(ratio);

  el('goalEyebrow').textContent = goal.eyebrow;
  el('goalTitle').textContent = goal.title;
  el('remainingValue').textContent = String(remaining);
  el('foundationValue').textContent = String(Math.round(s.foundation));
  el('momentumValue').textContent = s.momentum > 0 ? `+${Math.round(s.momentum)}` : String(Math.round(s.momentum));
  el('streakValue').textContent = String(streakFromHistory(s));
  el('phaseChip').textContent = phase;
  el('curveMessage').textContent = message;
  el('sessionCount').textContent = `${s.history.filter((item) => item.type === 'action').length}回`;

  const pt = pointOnCurve(ratio);
  for (const id of ['positionDot', 'positionHalo']) {
    el(id).setAttribute('cx', pt.x.toFixed(1));
    el(id).setAttribute('cy', pt.y.toFixed(1));
  }
  el('youLabel').setAttribute('x', pt.x.toFixed(1));
  el('youLabel').setAttribute('y', Math.max(18, pt.y - 25).toFixed(1));

  const absenceNote = el('absenceNote');
  absenceNote.hidden = !loss;
  if (loss) absenceNote.textContent = `空白日があったので勢い −${loss}歩。ただし、積み上げ ${Math.round(s.foundation)}歩はそのまま残っています。`;

  renderActions(goalKey, s);
  renderHistory(s);
  saveStore();
  showScreen('progress');
}

function recordAction(goalKey, action) {
  const goal = GOALS[goalKey];
  const s = stateFor(goalKey);
  if (hasTodayEntry(s)) return showToast('今日はすでに記録済みです');
  const before = effectiveSteps(s);
  const multiplier = s.foundation >= goal.target ? 2 : 1;
  const gained = action.points * multiplier;
  s.foundation += gained;
  s.momentum = Math.min(15, s.momentum + 1);
  s.lastActionDate = todayKey();
  s.appliedMissedDays = 0;
  s.history.unshift({ date: todayKey(), label: action.label, note: multiplier > 1 ? `突破後ボーナス ×2 / 勢い +1` : '積み上げ + 勢い +1', delta: gained, type: 'action' });
  s.history = s.history.slice(0, 20);
  saveStore();
  renderProgress({ skipAbsence: true });
  showToast(`積み上げ +${gained}歩`);
  const after = effectiveSteps(s);
  if (before < goal.target && after >= goal.target && !s.breakthroughShown) {
    s.breakthroughShown = true;
    saveStore();
    celebration.hidden = false;
  }
}

function recordNoAction() {
  const goalKey = currentGoalKey();
  if (!goalKey) return;
  const s = stateFor(goalKey);
  if (hasTodayEntry(s)) return showToast('今日はすでに記録済みです');
  s.momentum = Math.max(-20, s.momentum - 5);
  if (s.lastActionDate) {
    const totalMissedTomorrow = Math.max(0, dayDiff(s.lastActionDate, todayKey()) || 1);
    s.appliedMissedDays = Math.max(s.appliedMissedDays, totalMissedTomorrow);
  }
  s.history.unshift({ date: todayKey(), label: '今日はやらなかった', note: '積み上げは残す。勢いだけ −5。', delta: -5, type: 'miss-manual' });
  s.history = s.history.slice(0, 20);
  saveStore();
  renderProgress({ skipAbsence: true });
  showToast('勢い −5。積み上げはそのまま');
}

function chooseGoal(goalKey) {
  if (!GOALS[goalKey]) return;
  store.activeGoal = goalKey;
  stateFor(goalKey);
  saveStore();
  renderProgress();
}

function shareResult() {
  const goalKey = currentGoalKey();
  if (!goalKey) return;
  const goal = GOALS[goalKey];
  const s = stateFor(goalKey);
  const remaining = Math.max(0, Math.ceil(goal.target - effectiveSteps(s)));
  const text = remaining > 0
    ? `${goal.title}｜結果が出るまで、あと${remaining}歩\n積み上げ ${Math.round(s.foundation)}歩・勢い ${s.momentum > 0 ? '+' : ''}${Math.round(s.momentum)}歩\nまだ結果になっていないだけ。`
    : `${goal.title}｜BREAKTHROUGH 到達\n積み上げ ${Math.round(s.foundation)}歩\n最初の静かな区間も、ここにつながっていた。`;
  const status = el('shareStatus');
  if (navigator.share) {
    navigator.share({ title: '結果が出るまで、あと○歩', text }).then(() => {
      status.textContent = '共有しました。';
    }).catch(() => {
      status.textContent = '共有をキャンセルしました。';
    });
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => { status.textContent = '結果をコピーしました。'; }).catch(() => { status.textContent = text; });
    return;
  }
  status.textContent = text;
}

document.querySelectorAll('[data-goal]').forEach((button) => {
  button.addEventListener('click', () => chooseGoal(button.dataset.goal));
});

changeGoalBtn.addEventListener('click', () => showScreen('goal'));
noActionBtn.addEventListener('click', recordNoAction);
el('shareBtn').addEventListener('click', shareResult);
el('celebrationClose').addEventListener('click', () => { celebration.hidden = true; });
el('resetBtn').addEventListener('click', () => {
  const goalKey = currentGoalKey();
  if (!goalKey) return;
  if (!window.confirm(`${GOALS[goalKey].title}の記録を最初からにしますか？`)) return;
  store.goals[goalKey] = newGoalState();
  saveStore();
  renderProgress({ skipAbsence: true });
  showToast('この目標の記録をリセットしました');
});

if (currentGoalKey()) renderProgress();
else showScreen('goal');
