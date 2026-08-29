const TEST_MODE = new URLSearchParams(location.search).has('test');
const HOLD_MS = TEST_MODE ? 650 : 8000;
const HISTORY_KEY = 'levelup-iya-feeling-first-aid-v1';

const state = {
  before: null,
  after: null,
  emotion: null,
  source: null,
  anchor: null,
  waveDone: false,
};

const screens = [...document.querySelectorAll('.screen')];
const resetBtn = document.querySelector('#resetBtn');
const waveHold = document.querySelector('#waveHold');
const holdCopy = document.querySelector('#holdCopy');
const holdTime = document.querySelector('#holdTime');
const sourceSubcopy = document.querySelector('#sourceScreen .subcopy');
const anchorLead = document.querySelector('#anchorLead');
const anchorChoices = document.querySelector('#anchorChoices');
const doTitle = document.querySelector('#doTitle');
const actionDetail = document.querySelector('#actionDetail');
const lastSession = document.querySelector('#lastSession');
const lastSessionText = document.querySelector('#lastSessionText');
const personalInsight = document.querySelector('#personalInsight');
const resultInsight = document.querySelector('#resultInsight');

const SOURCE_LABELS = {
  body: '体',
  memory: '思い出',
  future: '先の想像',
  person: '相手',
  unknown: '理由不明',
};

const ANCHORS = {
  body: [
    { id: 'feet', title: '足の裏を床に3秒押す', detail: '床から返ってくる圧だけを3秒感じる。考えは止めなくていい。' },
    { id: 'shoulders', title: '肩を上げて、ストンと落とす', detail: '1回だけでOK。肩が落ちた位置をそのままにする。' },
    { id: 'hands', title: '手のひらをぎゅっと開く', detail: '3秒握って、ゆっくり開く。手の温度と感触へ注意を戻す。' },
    { id: 'water', title: '水をひと口だけ飲む', detail: '飲める場所なら、ひと口だけ。喉を通る感覚を見る。' },
  ],
  memory: [
    { id: 'squares', title: '目の前の四角を3つ探す', detail: '画面、窓、机など。過去の場面ではなく、今見えている形を3つ。' },
    { id: 'feet', title: '足の裏を床に3秒押す', detail: '今いる場所の床を3秒だけ感じる。場面を消そうとしなくていい。' },
    { id: 'date', title: '今日の日付を心の中で言う', detail: '「今日は今日」と確認する。思い出の時間から現在へ戻る目印にする。' },
    { id: 'shoulders', title: '肩を上げて、ストンと落とす', detail: '過去の場面を考えたままでもいい。体だけ今へ戻す。' },
  ],
  future: [
    { id: 'object', title: '目の前の物を1個、形まで見る', detail: '色だけでなく、角・丸み・影まで見る。まだ起きていない場面から視線を戻す。' },
    { id: 'far', title: '10秒だけ遠くを見る', detail: '窓の外や部屋の奥など、スマホより遠い一点を見る。' },
    { id: 'feet', title: '足の裏を床に3秒押す', detail: '先のことではなく、今ここで支えられている感覚へ戻す。' },
    { id: 'minute', title: '次の10分だけ決める', detail: '今日全部ではなく、次の10分にすることを1個だけ決める。' },
  ],
  person: [
    { id: 'phone-down', title: 'スマホを10秒だけ伏せる', detail: '返信・表情・通知を追加で読まない時間を10秒だけつくる。' },
    { id: 'feet', title: '足の裏を床に3秒押す', detail: '相手の頭の中ではなく、自分が今いる場所へ戻る。' },
    { id: 'shoulders', title: '肩を上げて、ストンと落とす', detail: '相手を変える前に、自分の体の力みだけ1つ下げる。' },
    { id: 'reply-later', title: '返信を10分だけ遅らせる', detail: '今すぐ返さない。10分後の自分に一度渡す。' },
  ],
  unknown: [
    { id: 'feet', title: '足の裏を床に3秒押す', detail: '理由を探さず、まず床の圧だけを感じる。' },
    { id: 'squares', title: '目の前の四角を3つ探す', detail: '説明ではなく、今見えている形を3つだけ拾う。' },
    { id: 'shoulders', title: '肩を上げて、ストンと落とす', detail: '原因不明のままでいい。体の力みだけ1つ下げる。' },
    { id: 'far', title: '10秒だけ遠くを見る', detail: '部屋の奥や窓の外など、遠い一点へ視線を置く。' },
  ],
};

function loadHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value.slice(0, 7) : [];
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 7)));
}

function bestAnchorInsight(history = loadHistory()) {
  if (history.length < 3) return null;
  const grouped = new Map();
  for (const item of history) {
    if (!item.anchorId || typeof item.before !== 'number' || typeof item.after !== 'number') continue;
    const drop = item.before - item.after;
    const current = grouped.get(item.anchorId) || { title: item.anchorTitle, count: 0, total: 0 };
    current.count += 1;
    current.total += drop;
    grouped.set(item.anchorId, current);
  }
  const candidates = [...grouped.values()].filter((item) => item.count >= 2);
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.total / b.count) - (a.total / a.count));
  const best = candidates[0];
  const avg = best.total / best.count;
  if (avg <= 0) return null;
  return `最近は「${best.title}」の回で平均 ${avg.toFixed(1)} 段階下がっています。`;
}

function renderHistory() {
  const history = loadHistory();
  const last = history[0];
  if (last) {
    lastSession.hidden = false;
    lastSessionText.textContent = `${last.before} → ${last.after} / ${last.anchorTitle}`;
  } else {
    lastSession.hidden = true;
  }
  const insight = bestAnchorInsight(history);
  if (insight) {
    personalInsight.hidden = false;
    personalInsight.textContent = insight;
  } else {
    personalInsight.hidden = true;
    personalInsight.textContent = '';
  }
}

function show(screenId) {
  for (const screen of screens) screen.classList.toggle('active', screen.id === screenId);
  resetBtn.hidden = screenId === 'startScreen';
  window.scrollTo({ top: 0, behavior: TEST_MODE ? 'auto' : 'smooth' });
}

function resetSession() {
  state.before = null;
  state.after = null;
  state.emotion = null;
  state.source = null;
  state.anchor = null;
  state.waveDone = false;
  holdElapsed = 0;
  stopHold();
  updateWave();
  renderHistory();
  show('startScreen');
}

for (const btn of document.querySelectorAll('[data-role="before-scale"] [data-intensity]')) {
  btn.addEventListener('click', () => {
    state.before = Number(btn.dataset.intensity);
    show('waveScreen');
  });
}

for (const btn of document.querySelectorAll('[data-role="after-scale"] [data-intensity]')) {
  btn.addEventListener('click', () => {
    state.after = Number(btn.dataset.intensity);
    finishSession();
  });
}

let holding = false;
let holdElapsed = 0;
let holdStartedAt = 0;
let rafId = 0;

function updateWave() {
  const ratio = Math.min(1, holdElapsed / HOLD_MS);
  waveHold.style.setProperty('--wave-progress', String(Math.round(ratio * 100)));
  const secondsLeft = Math.max(0, Math.ceil((HOLD_MS - holdElapsed) / 1000));
  holdTime.textContent = state.waveDone ? 'OK' : `${secondsLeft}秒`;
  holdCopy.textContent = state.waveDone ? '波を1回やり過ごした' : holding ? 'そのまま' : 'ここを押したまま';
  waveHold.classList.toggle('holding', holding);
  waveHold.classList.toggle('complete', state.waveDone);
}

function tick(now) {
  if (!holding || state.waveDone) return;
  const segment = now - holdStartedAt;
  const total = holdElapsed + segment;
  const ratio = Math.min(1, total / HOLD_MS);
  waveHold.style.setProperty('--wave-progress', String(Math.round(ratio * 100)));
  const secondsLeft = Math.max(0, Math.ceil((HOLD_MS - total) / 1000));
  holdTime.textContent = `${secondsLeft}秒`;
  if (total >= HOLD_MS) {
    holdElapsed = HOLD_MS;
    holding = false;
    state.waveDone = true;
    updateWave();
    setTimeout(() => show('labelScreen'), TEST_MODE ? 80 : 350);
    return;
  }
  rafId = requestAnimationFrame(tick);
}

function startHold(event) {
  if (state.waveDone || holding) return;
  holding = true;
  holdStartedAt = performance.now();
  if (event?.pointerId != null) {
    try { waveHold.setPointerCapture(event.pointerId); } catch {}
  }
  updateWave();
  rafId = requestAnimationFrame(tick);
}

function stopHold() {
  if (!holding) return;
  holdElapsed += performance.now() - holdStartedAt;
  holdElapsed = Math.min(holdElapsed, HOLD_MS);
  holding = false;
  cancelAnimationFrame(rafId);
  updateWave();
}

waveHold.addEventListener('pointerdown', startHold);
waveHold.addEventListener('pointerup', stopHold);
waveHold.addEventListener('pointercancel', stopHold);
waveHold.addEventListener('keydown', (event) => {
  if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
    event.preventDefault();
    startHold(event);
  }
});
waveHold.addEventListener('keyup', (event) => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    stopHold();
  }
});

for (const btn of document.querySelectorAll('[data-emotion]')) {
  btn.addEventListener('click', () => {
    state.emotion = btn.dataset.emotion;
    sourceSubcopy.textContent = `${state.emotion}が来てる。原因を解くのではなく、戻り方だけ選びます。`;
    show('sourceScreen');
  });
}

for (const btn of document.querySelectorAll('[data-source]')) {
  btn.addEventListener('click', () => {
    state.source = btn.dataset.source;
    renderAnchors();
    show('anchorScreen');
  });
}

function renderAnchors() {
  const label = SOURCE_LABELS[state.source] || '今';
  anchorLead.textContent = `${label}に近いなら、考えを増やさず体か視線を1個だけ動かす。`;
  anchorChoices.innerHTML = '';
  for (const anchor of ANCHORS[state.source] || ANCHORS.unknown) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.anchor = anchor.id;
    btn.innerHTML = `<strong>${anchor.title}</strong><span>${anchor.detail}</span>`;
    btn.addEventListener('click', () => chooseAnchor(anchor));
    anchorChoices.append(btn);
  }
}

function chooseAnchor(anchor) {
  state.anchor = anchor;
  doTitle.textContent = anchor.title;
  actionDetail.textContent = anchor.detail;
  show('doScreen');
}

document.querySelector('#doneActionBtn').addEventListener('click', () => show('afterScreen'));
document.querySelector('#skipActionBtn').addEventListener('click', () => show('anchorScreen'));

function finishSession() {
  const drop = state.before - state.after;
  const resultTitle = document.querySelector('#resultTitle');
  const beforeAfter = document.querySelector('#beforeAfter');
  const resultCopy = document.querySelector('#resultCopy');
  const resultEmotion = document.querySelector('#resultEmotion');
  const resultAnchor = document.querySelector('#resultAnchor');

  beforeAfter.innerHTML = `<b>${state.before}</b> → <b>${state.after}</b>`;
  if (drop >= 2) {
    resultTitle.textContent = `${drop}段階、下がった。`;
    resultCopy.textContent = '今回は、原因を解決する前に波の勢いを下げられた。ここで終えてもいい。';
  } else if (drop === 1) {
    resultTitle.textContent = '1段階、下がった。';
    resultCopy.textContent = '消えていなくていい。今すぐ反応する圧を1つ下げたところで止める。';
  } else if (drop === 0) {
    resultTitle.textContent = '強さは同じ。';
    resultCopy.textContent = '下がらなくても、すぐ原因探しや反応へ行かずに1回待てた。必要ならもう1周だけ。';
  } else {
    resultTitle.textContent = '今は上がっている。';
    resultCopy.textContent = 'この1分で押さえ込めなかった。これ以上ひとりで分析を増やさず、場所を変えるか人に声をかける方へ切り替える。';
  }

  resultEmotion.textContent = `${state.emotion}が来てる`;
  resultAnchor.textContent = state.anchor?.title || '—';

  saveHistory({
    at: new Date().toISOString(),
    before: state.before,
    after: state.after,
    emotion: state.emotion,
    source: state.source,
    anchorId: state.anchor?.id,
    anchorTitle: state.anchor?.title,
  });

  const insight = bestAnchorInsight();
  if (insight) {
    resultInsight.hidden = false;
    resultInsight.textContent = insight;
  } else {
    resultInsight.hidden = true;
    resultInsight.textContent = '';
  }
  show('resultScreen');
}

document.querySelector('#nextActions').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-next]');
  if (!btn) return;
  const next = btn.dataset.next;
  if (next === 'again') {
    resetSession();
    return;
  }
  const title = document.querySelector('#resultTitle');
  const copy = document.querySelector('#resultCopy');
  document.querySelector('#nextActions').hidden = true;
  if (next === 'move') {
    title.textContent = '場所を少し変える。';
    copy.textContent = '席を立つ、向きを変える、別の部屋へ行く。考えを増やす代わりに、景色を1つ変えてここで終了。';
  } else {
    title.textContent = 'ここで終わり。';
    copy.textContent = 'この気持ちの説明を続けず、さっきしていたことへ戻る。必要になったら、また1分だけ使う。';
  }
});

for (const btn of document.querySelectorAll('[data-back]')) {
  btn.addEventListener('click', () => {
    const target = btn.dataset.back;
    if (target === 'start') show('startScreen');
    if (target === 'wave') show('waveScreen');
    if (target === 'label') show('labelScreen');
    if (target === 'source') show('sourceScreen');
  });
}

resetBtn.addEventListener('click', resetSession);

renderHistory();
updateWave();
show('startScreen');
