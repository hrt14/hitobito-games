const $ = (id) => document.getElementById(id);

const screens = [...document.querySelectorAll('.screen')];
const storageKey = 'levelup-approval-off-v1';
const defaultStats = { sessions: 0, bestAccuracy: 0, fastestAverage: 0 };

let selectedWho = '';
let selectedStandard = '';
let training = null;
let dragState = null;
let toastTimer = null;

const questions = [
  { context: '会議のあと', text: '自分が次回、準備を増やすか', answer: 'self', note: '次回の準備は、自分で選べる。' },
  { context: '会議のあと', text: '上司が「できる人」と評価するか', answer: 'other', note: '評価そのものは、上司が決める。' },
  { context: 'SNS', text: '自分が投稿するか、しないか', answer: 'self', note: '投稿するかは、自分で選べる。' },
  { context: 'SNS', text: '何件いいねが付くか', answer: 'other', note: '反応は、見る人たちが決める。' },
  { context: '友人との会話', text: '自分が丁寧に伝えるか', answer: 'self', note: '伝え方は、自分で選べる。' },
  { context: '友人との会話', text: '相手が自分を好きでいるか', answer: 'other', note: '好意は、相手の領域。' },
  { context: '仕事', text: '自分が挑戦するか', answer: 'self', note: '挑戦するかは、自分で決められる。' },
  { context: '仕事', text: '周囲が「成功者」と見るか', answer: 'other', note: '肩書きへの評価は、周囲が決める。' },
  { context: '家族', text: '自分が頼み方を変えるか', answer: 'self', note: '頼み方は、自分で工夫できる。' },
  { context: '家族', text: '相手が期待どおりに動くか', answer: 'other', note: '相手の行動は、相手が決める。' },
  { context: '買い物', text: '自分が本当に欲しい方を選ぶか', answer: 'self', note: '何を選ぶかは、自分の領域。' },
  { context: '買い物', text: '持ち物で周囲が羨むか', answer: 'other', note: '羨むかどうかは、周囲が決める。' },
  { context: '発表', text: '自分が分かりやすく話すか', answer: 'self', note: '準備と伝え方は、自分で選べる。' },
  { context: '発表', text: '全員が納得するか', answer: 'other', note: '受け取り方は、一人ひとりの領域。' },
  { context: 'キャリア', text: '自分が面白いと思う仕事へ進むか', answer: 'self', note: '進む方向は、自分で選べる。' },
  { context: 'キャリア', text: '肩書きを見て人が尊敬するか', answer: 'other', note: '尊敬するかは、相手が決める。' },
];

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return { ...defaultStats, ...saved };
  } catch {
    return { ...defaultStats };
  }
}

function saveStats(next) {
  try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
}

function track(event, detail = {}) {
  try {
    if (typeof window.levelupTrack === 'function') window.levelupTrack(event, { app: 'approval-off', ...detail });
  } catch {}
}

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  track('screen_view', { screen: id });
}

function showToast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('show');
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 1700);
}

function chooseWho(button) {
  selectedWho = button.dataset.who;
  [...$('whoGrid').querySelectorAll('button')].forEach((item) => item.classList.toggle('selected', item === button));
  $('noticeNextBtn').disabled = false;
}

function buildApprovalText() {
  const typed = $('approvalInput').value.trim();
  if (typed) return typed;
  if (selectedWho === 'SNS') return 'よく見られたい';
  if (selectedWho === '家族') return 'ちゃんとしていると思われたい';
  if (selectedWho === '友人') return '感じのいい人だと思われたい';
  if (selectedWho === '同僚') return '仕事ができると思われたい';
  if (selectedWho === '上司') return '評価されたい';
  return 'よく思われたい';
}

function openOutside() {
  $('approvalWho').textContent = `${selectedWho || '相手'}から`;
  $('approvalText').textContent = buildApprovalText();
  const card = $('approvalCard');
  card.style.transform = '';
  card.style.opacity = '';
  $('axisStage').classList.remove('done');
  $('outsideFallbackBtn').disabled = false;
  showScreen('outsideScreen');
  track('reset_started', { who: selectedWho || 'other' });
}

function completeReturn() {
  const card = $('approvalCard');
  if ($('axisStage').classList.contains('done')) return;
  $('axisStage').classList.add('done');
  $('outsideFallbackBtn').disabled = true;
  card.style.transition = 'transform .36s cubic-bezier(.2,.8,.2,1),opacity .28s ease';
  card.style.transform = 'translate3d(150%, -10px, 0) rotate(18deg)';
  card.style.opacity = '0';
  track('approval_returned');
  setTimeout(() => showScreen('insideScreen'), 390);
}

function chooseStandard(button) {
  selectedStandard = button.dataset.standard;
  $('customStandard').value = '';
  [...$('standardGrid').querySelectorAll('button')].forEach((item) => item.classList.toggle('selected', item === button));
  $('insideNextBtn').disabled = false;
}

function syncCustomStandard() {
  const value = $('customStandard').value.trim();
  if (!value) {
    $('insideNextBtn').disabled = !selectedStandard;
    return;
  }
  selectedStandard = value;
  [...$('standardGrid').querySelectorAll('button')].forEach((item) => item.classList.remove('selected'));
  $('insideNextBtn').disabled = false;
}

function lockStandard() {
  const value = $('customStandard').value.trim() || selectedStandard || '自分で選ぶ';
  $('lockedStandard').textContent = value;
  showScreen('lockScreen');
  track('self_axis_restored');
}

function shuffledQuestions(count = 8) {
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function startTraining() {
  training = {
    questions: shuffledQuestions(8),
    index: 0,
    correct: 0,
    combo: 0,
    bestCombo: 0,
    times: [],
    startedAt: performance.now(),
    locked: false,
  };
  showScreen('trainingScreen');
  track('training_started');
  renderQuestion();
}

function renderQuestion() {
  const q = training.questions[training.index];
  training.locked = false;
  training.startedAt = performance.now();
  $('questionCounter').textContent = `${training.index + 1} / ${training.questions.length}`;
  $('comboValue').textContent = `COMBO ${training.combo}`;
  $('questionContext').textContent = q.context;
  $('questionText').textContent = q.text;
  $('questionPrompt').textContent = '誰が決める？';
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  const card = $('trainCard');
  card.style.transition = 'none';
  card.style.transform = '';
  card.style.opacity = '1';
  $('timerBar').style.transition = 'none';
  $('timerBar').style.transform = 'scaleX(1)';
  requestAnimationFrame(() => {
    $('timerBar').style.transition = 'transform 5s linear';
    $('timerBar').style.transform = 'scaleX(0)';
  });
}

function answerTraining(answer, viaSwipe = false) {
  if (!training || training.locked) return;
  training.locked = true;
  const q = training.questions[training.index];
  const elapsed = Math.min(9.99, (performance.now() - training.startedAt) / 1000);
  training.times.push(elapsed);
  const correct = q.answer === answer;
  if (correct) {
    training.correct += 1;
    training.combo += 1;
    training.bestCombo = Math.max(training.bestCombo, training.combo);
  } else {
    training.combo = 0;
  }
  $('comboValue').textContent = `COMBO ${training.combo}`;
  $('feedback').textContent = correct ? `✓ ${q.note}` : `↺ ${q.note}`;
  $('feedback').className = `feedback ${correct ? 'correct' : 'wrong'}`;
  $('timerBar').style.transition = 'none';

  const card = $('trainCard');
  const direction = answer === 'self' ? -1 : 1;
  card.style.transition = 'transform .28s ease, opacity .24s ease';
  card.style.transform = `translate3d(${direction * 125}%,0,0) rotate(${direction * 13}deg)`;
  card.style.opacity = '.12';

  track('training_answer', { correct, answer, via: viaSwipe ? 'swipe' : 'button' });
  setTimeout(() => {
    training.index += 1;
    if (training.index >= training.questions.length) finishTraining();
    else renderQuestion();
  }, 650);
}

function finishTraining() {
  const accuracy = Math.round((training.correct / training.questions.length) * 100);
  const average = training.times.reduce((sum, value) => sum + value, 0) / training.times.length;
  const speedBonus = Math.max(0, Math.round((2.5 - Math.min(2.5, average)) * 8));
  const score = Math.min(100, Math.round(accuracy * 0.9 + speedBonus));
  $('scoreValue').textContent = score;
  $('scoreRing').style.setProperty('--score', `${score}%`);
  $('accuracyValue').textContent = `${accuracy}%`;
  $('speedValue').textContent = `${average.toFixed(2)}s`;
  $('bestComboValue').textContent = training.bestCombo;

  const stats = loadStats();
  stats.sessions += 1;
  stats.bestAccuracy = Math.max(stats.bestAccuracy || 0, accuracy);
  if (!stats.fastestAverage || average < stats.fastestAverage) stats.fastestAverage = average;
  saveStats(stats);
  showScreen('resultScreen');
  track('training_completed', { accuracy, score });
}

function renderStats() {
  const stats = loadStats();
  $('statSessions').textContent = stats.sessions;
  $('statBest').textContent = stats.sessions ? `${stats.bestAccuracy}%` : '—';
  $('statFastest').textContent = stats.fastestAverage ? `${stats.fastestAverage.toFixed(2)}s` : '—';
  showScreen('statsScreen');
}

async function shareResult() {
  const accuracy = $('accuracyValue').textContent;
  const text = `今日の自分軸 ${accuracy}\n「評価は相手。行動は自分。」\n他人軸OFF | LEVEL UP`;
  const shareData = { title: '他人軸OFF | LEVEL UP', text, url: location.href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      track('result_shared', { method: 'share' });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${location.href}`);
    showToast('結果をコピーしました');
    track('result_shared', { method: 'clipboard' });
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('共有できませんでした');
  }
}

function bindHorizontalDrag(element, onCommit, { threshold = 72, direction = null } = {}) {
  element.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragState = { element, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 };
    element.setPointerCapture?.(event.pointerId);
    element.classList.add('dragging');
    element.style.transition = 'none';
  });

  element.addEventListener('pointermove', (event) => {
    if (!dragState || dragState.element !== element) return;
    dragState.dx = event.clientX - dragState.startX;
    dragState.dy = event.clientY - dragState.startY;
    if (Math.abs(dragState.dx) < Math.abs(dragState.dy) && Math.abs(dragState.dy) > 18) return;
    const rotate = dragState.dx * 0.035;
    element.style.transform = `translate3d(${dragState.dx}px,${dragState.dy * 0.08}px,0) rotate(${rotate}deg)`;
  });

  const finish = (event) => {
    if (!dragState || dragState.element !== element) return;
    const { dx } = dragState;
    dragState = null;
    element.classList.remove('dragging');
    element.releasePointerCapture?.(event.pointerId);
    const directionOk = direction === 'right' ? dx > threshold : direction === 'left' ? dx < -threshold : Math.abs(dx) > threshold;
    if (directionOk) {
      onCommit(dx > 0 ? 'right' : 'left');
    } else {
      element.style.transition = 'transform .2s ease';
      element.style.transform = '';
    }
  };

  element.addEventListener('pointerup', finish);
  element.addEventListener('pointercancel', finish);
}

bindHorizontalDrag($('approvalCard'), () => completeReturn(), { direction: 'right', threshold: 65 });
bindHorizontalDrag($('trainCard'), (dir) => answerTraining(dir === 'left' ? 'self' : 'other', true), { threshold: 62 });

$('approvalCard').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    completeReturn();
  }
});
$('trainCard').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') answerTraining('self', true);
  if (event.key === 'ArrowRight') answerTraining('other', true);
});

$('whoGrid').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-who]');
  if (button) chooseWho(button);
});
$('standardGrid').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-standard]');
  if (button) chooseStandard(button);
});
$('customStandard').addEventListener('input', syncCustomStandard);

$('resetModeBtn').addEventListener('click', () => showScreen('triggerScreen'));
$('trainingModeBtn').addEventListener('click', startTraining);
$('statsBtn').addEventListener('click', renderStats);
$('noticeNextBtn').addEventListener('click', openOutside);
$('outsideFallbackBtn').addEventListener('click', completeReturn);
$('insideNextBtn').addEventListener('click', lockStandard);
$('lockDoneBtn').addEventListener('click', () => showScreen('homeScreen'));
$('trainFromLockBtn').addEventListener('click', startTraining);
$('selfAnswerBtn').addEventListener('click', () => answerTraining('self'));
$('otherAnswerBtn').addEventListener('click', () => answerTraining('other'));
$('againTrainingBtn').addEventListener('click', startTraining);
$('shareBtn').addEventListener('click', shareResult);
$('homeBtn').addEventListener('click', () => showScreen('homeScreen'));
$('statsTrainBtn').addEventListener('click', startTraining);
$('statsBackBtn').addEventListener('click', () => showScreen('homeScreen'));

track('app_opened');
