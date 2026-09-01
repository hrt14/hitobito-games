const SCENES = [
  {
    title: '会議で新しい提案を出す',
    sub: '成功する可能性はある。でも頭が先に失敗を作り始める。',
    branches: ['変な提案と思われるかも', '質問に答えられないかも', '空気が悪くなるかも', '否定されたら恥ずかしい'],
    guards: ['数字を1つ確認', '結論を一文にする', '反対意見への返しを1つ用意'],
    actions: ['結論を一文で先に言う', '相手のメリットを1つ入れる', 'まず60秒だけ話して反応を見る']
  },
  {
    title: '新しい仕事に手を挙げる',
    sub: 'やれば伸びるかもしれない。でも「無理だったら」が先に膨らむ。',
    branches: ['期待外れと思われるかも', '時間が足りなくなるかも', '失敗が目立つかも', '途中で投げ出すかも'],
    guards: ['必要時間を確認', '相談相手を1人決める', '最初の区切りを小さくする'],
    actions: ['まず「やります」と伝える', '最初の30分だけ着手する', '成功条件を1つ確認して始める']
  },
  {
    title: '気になる相手に連絡する',
    sub: '普通に送ればいいだけなのに、返信が来ない未来を何通りも作り始める。',
    branches: ['迷惑かもしれない', '既読無視されるかも', '変に思われるかも', '話題が続かないかも'],
    guards: ['短文にする', '返信不要でも成立させる', '重い話題を避ける'],
    actions: ['一番自然な一文だけ送る', '相手が返しやすい質問を1つ入れる', '考え直す前に送信画面まで進む']
  },
  {
    title: '作ったものを公開する',
    sub: '出せば反応が取れる。でも公開直前になると欠点ばかり見える。',
    branches: ['誰にも見られないかも', '低評価がつくかも', '粗が見つかるかも', 'もっと直せたと思うかも'],
    guards: ['致命的な不具合だけ確認', '戻せる手段を確認', '説明文を一度読む'],
    actions: ['公開して実際の反応を見る', '一人に先に見てもらう', '今日直すのは1点だけにする']
  },
  {
    title: '値上げを伝える',
    sub: '必要な判断なのに、断られる未来だけが何度も再生される。',
    branches: ['離れていくかも', '高いと言われるかも', '関係が悪くなるかも', '説明に詰まるかも'],
    guards: ['理由を一文にする', '開始日を明確にする', '例外条件を確認する'],
    actions: ['価値と変更内容を簡潔に伝える', '最初の1社に送る', '質問された時の回答を1つ用意して送る']
  },
  {
    title: '初めての場所へ一人で行く',
    sub: '行けば何とかなる場面でも、頭は先回りしてトラブルを量産する。',
    branches: ['道に迷うかも', '浮くかもしれない', '失敗して帰りたくなるかも', '準備不足かも'],
    guards: ['場所だけ保存', '帰り道を確認', '必要物を3つだけ確認'],
    actions: ['出発時刻を決める', '靴を履くところまで進む', '地図を開いて最初の地点へ向かう']
  }
];

const $ = (id) => document.getElementById(id);
const screens = ['introScreen', 'branchScreen', 'riskScreen', 'commitScreen', 'resultScreen'];
const lifetimeKey = 'levelup-success-side-count';
const bestKey = 'levelup-success-side-best';
let scene = null;
let cut = 0;
let startedAt = 0;
let selectedGuard = '';
let selectedAction = '';
let toastTimer = null;

function intStore(key, fallback = 0) {
  const n = Number.parseInt(localStorage.getItem(key) || '', 10);
  return Number.isFinite(n) ? n : fallback;
}

function show(id) {
  screens.forEach((name) => $(name).classList.toggle('active', name === id));
  window.scrollTo({ top: Math.max(0, $('app').offsetTop), behavior: 'smooth' });
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1500);
}

function randomScene() {
  const previous = sessionStorage.getItem('success-side-scene');
  const candidates = SCENES.filter((item) => item.title !== previous);
  return candidates[Math.floor(Math.random() * candidates.length)] || SCENES[0];
}

function updateLifetime() {
  $('lifetimeCount').textContent = intStore(lifetimeKey);
}

function makeBranches() {
  $('branchCloud').innerHTML = '';
  const positions = [
    { left: '4%', top: '34%' },
    { right: '4%', top: '34%' },
    { left: '14%', top: '7%' },
    { right: '14%', top: '7%' }
  ];
  scene.branches.forEach((text, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'branch-chip';
    button.textContent = text;
    Object.assign(button.style, positions[index]);
    button.addEventListener('click', () => cutBranch(button, index));
    $('branchCloud').appendChild(button);
  });
}

function cutBranch(button, index) {
  if (button.classList.contains('cut')) return;
  button.classList.add('cut');
  const paths = $('branchLines').querySelectorAll('path');
  if (paths[index]) paths[index].style.opacity = '.09';
  cut += 1;
  $('cutCount').textContent = cut;
  if (navigator.vibrate) navigator.vibrate(18);
  if (cut < 4) {
    $('cutHint').textContent = cut === 1 ? '全部検討しなくていい' : cut === 2 ? 'まだ増やさない' : 'あと1本';
  } else {
    $('cutHint').textContent = '枝分かれ終了';
    toast('失敗予想はここで終了');
    setTimeout(() => showRisk(), 360);
  }
}

function showRisk() {
  $('riskQuestion').textContent = `「${scene.title}」で失敗しても、戻せる？`;
  $('guardBox').hidden = true;
  $('riskDone').hidden = true;
  document.querySelectorAll('.risk-choice').forEach((b) => b.classList.remove('selected'));
  show('riskScreen');
}

function chooseRisk(type, button) {
  document.querySelectorAll('.risk-choice').forEach((b) => b.classList.toggle('selected', b === button));
  if (type === 'recoverable') {
    selectedGuard = 'やり直せると確認';
    $('guardBox').hidden = true;
    $('riskDone').hidden = false;
    toast('最悪の確認は1回で十分');
  } else {
    $('riskDone').hidden = true;
    $('guardBox').hidden = false;
    renderGuards();
    toast('守るなら1個だけ');
  }
}

function renderGuards() {
  $('guardOptions').innerHTML = '';
  scene.guards.forEach((text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'guard-option';
    button.textContent = text;
    button.addEventListener('click', () => {
      selectedGuard = text;
      [...$('guardOptions').children].forEach((node) => node.classList.toggle('selected', node === button));
      $('riskDone').hidden = false;
      toast('備えはそれで十分');
    });
    $('guardOptions').appendChild(button);
  });
}

function showCommit() {
  $('successLever').classList.remove('switched');
  $('actionZone').hidden = true;
  $('actionOptions').innerHTML = '';
  show('commitScreen');
}

function switchToSuccess() {
  const lever = $('successLever');
  if (lever.classList.contains('switched')) return;
  lever.classList.add('switched');
  if (navigator.vibrate) navigator.vibrate([18, 28, 28]);
  setTimeout(() => {
    renderActions();
    $('actionZone').hidden = false;
    toast('ここからは「どう通す？」');
  }, 320);
}

function renderActions() {
  $('actionOptions').innerHTML = '';
  scene.actions.forEach((text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-option';
    button.textContent = text;
    button.addEventListener('click', () => finish(text));
    $('actionOptions').appendChild(button);
  });
}

function finish(action) {
  selectedAction = action;
  const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const count = intStore(lifetimeKey) + 1;
  localStorage.setItem(lifetimeKey, String(count));
  const previousBest = intStore(bestKey, 0);
  const best = previousBest === 0 ? seconds : Math.min(previousBest, seconds);
  localStorage.setItem(bestKey, String(best));
  $('resultScene').textContent = scene.title;
  $('resultAction').textContent = selectedAction;
  $('resultCount').textContent = count;
  $('resultTime').textContent = seconds;
  $('bestTime').textContent = best;
  updateLifetime();
  show('resultScreen');
}

function start() {
  scene = randomScene();
  sessionStorage.setItem('success-side-scene', scene.title);
  cut = 0;
  selectedGuard = '';
  selectedAction = '';
  startedAt = Date.now();
  $('sceneTitle').textContent = scene.title;
  $('sceneSub').textContent = scene.sub;
  $('cutCount').textContent = '0';
  $('cutHint').textContent = '気になる枝をタップ';
  $('branchLines').querySelectorAll('path').forEach((path) => { path.style.opacity = '.6'; });
  makeBranches();
  show('branchScreen');
}

function resetAll() {
  localStorage.removeItem(lifetimeKey);
  localStorage.removeItem(bestKey);
  sessionStorage.removeItem('success-side-scene');
  updateLifetime();
  show('introScreen');
  toast('この端末の記録をリセットしました');
}

$('startBtn').addEventListener('click', start);
$('againBtn').addEventListener('click', start);
$('resetBtn').addEventListener('click', resetAll);
$('toCommitBtn').addEventListener('click', showCommit);
$('successLever').addEventListener('click', switchToSuccess);
document.querySelectorAll('.risk-choice').forEach((button) => {
  button.addEventListener('click', () => chooseRisk(button.dataset.risk, button));
});

updateLifetime();
