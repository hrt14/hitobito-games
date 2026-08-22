const STORAGE_KEY = 'levelup-10x-thinking-v1';

const scenarios = [
  {
    tag: '顧客対応',
    situation: '1人のお客さまから、同じ質問がまた届いた。',
    oneX: 'その人に、今回も丁寧に返信する。',
    lenses: {
      volume: { title: '量を10倍', insight: 'この質問をする人が10人いる前提なら、1対1返信だけでは追いつかない。' },
      quality: { title: '質を10倍', insight: '答えだけでなく「迷わず判断できる例・図・比較」まであれば、問い合わせ自体を減らせる。' },
      ripple: { title: '波及を10倍', insight: 'FAQ・動画・テンプレートにすれば、次の100人にも同じ価値が残る。' },
    },
    moves: {
      low: { label: '1–3X / 同じ延長線', text: '返信文を少し詳しくする。', why: '丁寧にはなるが、次の問い合わせでも同じ仕事が発生する。' },
      mid: { label: '4–7X / 届く範囲を広げる', text: '返信をFAQへ転記し、似た質問にも使える形にする。', why: '1回の回答が複数人へ届き始める。' },
      high: { label: '8–10X / 仕組みを変える', text: '迷うポイントを特定し、FAQ＋図解＋導線まで直して「質問しなくても解決できる」状態を作る。', why: '回答の量を増やすのではなく、問い合わせが生まれる構造そのものを変える。' },
    },
    transfer: 'この1件を、次の100人にも効かせるには？',
  },
  {
    tag: '会議',
    situation: '明日の会議に向けて、説明資料を1本つくる。',
    oneX: '見栄えのいいスライドを最後まで作り込む。',
    lenses: {
      volume: { title: '量を10倍', insight: '同じ論点を10回説明する未来を考えると、「毎回スライドを作る」は重すぎる。' },
      quality: { title: '質を10倍', insight: '情報量より「この会議で何を決めるか」が1画面で分かる方が価値は大きい。' },
      ripple: { title: '波及を10倍', insight: '判断基準・数字・決定事項を更新できる型にすれば、次の会議も速くなる。' },
    },
    moves: {
      low: { label: '1–3X / 同じ延長線', text: 'スライドを増やして説明を丁寧にする。', why: '資料は厚くなるが、会議の判断速度は大きく変わらない。' },
      mid: { label: '4–7X / 目的を広げる', text: '冒頭に「今日決めること・選択肢・推奨案」を1枚で置く。', why: '資料づくりから、意思決定を前へ進める道具に変わる。' },
      high: { label: '8–10X / 仕組みを変える', text: '会議前に論点を共有し、当日は判断だけに集中。決定事項は次回も使う更新型1ページへ残す。', why: '毎回資料を作る仕事から、会議そのものが速くなる仕組みへ変わる。' },
    },
    transfer: 'この資料を10回作らずに済む仕組みは？',
  },
  {
    tag: 'EC / 商品',
    situation: '売れていない商品ページを1ページ改善する。',
    oneX: 'タイトルと説明文を少し良くする。',
    lenses: {
      volume: { title: '量を10倍', insight: '1商品だけ直すより、同じ弱点を持つ商品群へ一気に効くルールを見つけたい。' },
      quality: { title: '質を10倍', insight: '文章を磨く前に、購入前の不安・比較・証拠が足りない可能性がある。' },
      ripple: { title: '波及を10倍', insight: '勝ちパターンをテンプレート化すれば、次の商品登録から改善が標準になる。' },
    },
    moves: {
      low: { label: '1–3X / 同じ延長線', text: 'キャッチコピーを強くする。', why: 'そのページだけは変わるが、なぜ売れないかの学びが残らない。' },
      mid: { label: '4–7X / 検証へ広げる', text: '検索語・離脱・レビューから購入前の不安を1つ特定し、そこを直す。', why: '見た目の修正から、原因仮説に基づく改善へ変わる。' },
      high: { label: '8–10X / 仕組みを変える', text: '不安の発見→改善→検証を型にして、同タイプの商品10ページへ横展開できるテンプレートを作る。', why: '1ページ改善が、商品群全体の改善システムになる。' },
    },
    transfer: 'この1ページから、10ページ分の学びを取るには？',
  },
  {
    tag: '企画',
    situation: '新しい企画を1つ思いついた。',
    oneX: '企画書を作り込み、完成してから人に見せる。',
    lenses: {
      volume: { title: '量を10倍', insight: '1案に賭けるより、同じ目的を達成する10案を並べると前提が見える。' },
      quality: { title: '質を10倍', insight: '企画書の完成度より、ユーザーが本当に欲しいかを早く確かめる方が価値が高い。' },
      ripple: { title: '波及を10倍', insight: '検証結果を残せば、当たらなかった企画も次の企画の判断材料になる。' },
    },
    moves: {
      low: { label: '1–3X / 同じ延長線', text: '企画書を20ページに増やす。', why: '説明量は増えるが、企画が当たる確率はほとんど増えない。' },
      mid: { label: '4–7X / 試行を広げる', text: '同じ目的の案を5つ出し、最小モックで反応を見る。', why: '1案を磨く前に、より良い方向を比較できる。' },
      high: { label: '8–10X / 仕組みを変える', text: '10仮説→3つの超小型テスト→反応記録を1セットにし、企画を「当てる作業」から「学習する仕組み」へ変える。', why: '失敗しても次の成功確率が上がるため、1企画の価値が何度も残る。' },
    },
    transfer: 'この1案を、10個の学びに変えるには？',
  },
  {
    tag: '学習',
    situation: '新しい分野を1時間勉強する。',
    oneX: '本や記事を読み、理解した気になるまで進める。',
    lenses: {
      volume: { title: '量を10倍', insight: '10時間読むより、1時間で重要論点を抽出し反復できる方が伸びやすい。' },
      quality: { title: '質を10倍', insight: '読むだけより、自分の言葉で説明・問題化・実践した方が理解の穴が見える。' },
      ripple: { title: '波及を10倍', insight: '学んだ内容をチェックリストやテンプレートにすれば、次の仕事でも再利用できる。' },
    },
    moves: {
      low: { label: '1–3X / 同じ延長線', text: '読む速度を上げてページ数を増やす。', why: '情報量は増えるが、使える知識になる保証はない。' },
      mid: { label: '4–7X / 出力へ広げる', text: '30分で読み、残り30分で人に説明できる要点5つと問題3つを作る。', why: '受け身の読書から、理解を確かめる学習に変わる。' },
      high: { label: '8–10X / 仕組みを変える', text: '要点→自作問題→実務で1回使う→結果をテンプレート化までを1セットにする。', why: '1時間の学習が、知識・練習・実務資産の3つへ波及する。' },
    },
    transfer: 'この1時間を、明日も使える資産にするには？',
  },
  {
    tag: 'チーム',
    situation: '部下や同僚が同じミスをした。',
    oneX: '本人に注意し、次から気をつけてもらう。',
    lenses: {
      volume: { title: '量を10倍', insight: '同じミスを10人が起こす前提なら、個別注意だけでは追いつかない。' },
      quality: { title: '質を10倍', insight: '「気をつける」より、間違えにくい入力・確認・判断基準を作る方が強い。' },
      ripple: { title: '波及を10倍', insight: '再発防止が共有されれば、新しい人が入っても同じ失敗を減らせる。' },
    },
    moves: {
      low: { label: '1–3X / 同じ延長線', text: 'もう少し強く注意する。', why: '本人の記憶と注意力に依存したまま。' },
      mid: { label: '4–7X / 原因へ広げる', text: 'どこで判断を間違えたかを一緒に確認し、チェックを1つ追加する。', why: '人の問題から、工程の問題へ視点が広がる。' },
      high: { label: '8–10X / 仕組みを変える', text: 'ミスが起きる条件を特定し、入力・確認・例外処理まで含む「間違えにくい標準」に変える。', why: '1人への注意が、チーム全体の品質を上げる仕組みに変わる。' },
    },
    transfer: 'この1回のミスから、10回分の再発を防ぐには？',
  },
  {
    tag: '発信',
    situation: '役立つ気づきを1つ見つけた。',
    oneX: '自分のメモに残して終える。',
    lenses: {
      volume: { title: '量を10倍', insight: '同じ悩みを持つ10人に届けば、その気づきの価値は一気に大きくなる。' },
      quality: { title: '質を10倍', insight: '思いつきを一言で終えず、具体例・失敗例・使い方まで揃えると実用になる。' },
      ripple: { title: '波及を10倍', insight: '記事・テンプレート・小さなツールにすれば、時間が経っても価値が働き続ける。' },
    },
    moves: {
      low: { label: '1–3X / 同じ延長線', text: 'メモをきれいに整理する。', why: '自分には残るが、価値の届く範囲は変わらない。' },
      mid: { label: '4–7X / 他者へ広げる', text: '具体例を1つ足し、同じ悩みを持つ人へ共有する。', why: '自分の気づきが他者の行動に使われ始める。' },
      high: { label: '8–10X / 仕組みを変える', text: '気づきを「誰が・いつ・どう使うか」まで設計し、何度でも使えるチェックリストや小ツールにする。', why: '一瞬の気づきが、繰り返し使われる資産へ変わる。' },
    },
    transfer: 'この気づきを、10人が使える形にすると？',
  },
];

const lensNames = {
  volume: { title: '量を広げる', question: '1人・1回・1件で終わらせないなら？' },
  quality: { title: '質を広げる', question: '磨くより、体験そのものを変えるなら？' },
  ripple: { title: '波及を広げる', question: '今回だけでなく、次にも効く形にすると？' },
};

const $ = (id) => document.getElementById(id);
const screens = ['introScreen', 'gameScreen', 'feedbackScreen', 'resultScreen', 'recordScreen'];

const state = {
  deck: [],
  round: 0,
  opened: new Set(),
  multiplier: 1,
  highScale: 0,
  fullLens: 0,
  structural: 0,
  lensUse: { volume: 0, quality: 0, ripple: 0 },
};

function loadRecord() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      sessions: Number(value.sessions) || 0,
      best: Number(value.best) || 0,
    };
  } catch {
    return { sessions: 0, best: 0 };
  }
}

function saveRecord(result) {
  const current = loadRecord();
  const next = {
    sessions: current.sessions + 1,
    best: Math.max(current.best, result.highScale),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeDeck() {
  const params = new URLSearchParams(location.search);
  return params.get('test') === '1' ? scenarios.slice(0, 5) : shuffle(scenarios).slice(0, 5);
}

function showScreen(id) {
  screens.forEach((screenId) => $(screenId).classList.toggle('active', screenId === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function buzz(ms = 12) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function renderIntroRecord() {
  const record = loadRecord();
  $('bestIntro').textContent = record.sessions ? `BEST ${record.best}/5` : '初回';
  $('recordSessions').textContent = String(record.sessions);
  $('recordBest').textContent = record.sessions ? String(record.best) : '—';
}

function resetRoundState() {
  state.opened = new Set();
  state.multiplier = 1;
  $('multiplierRange').value = '1';
  document.documentElement.style.setProperty('--range-progress', '0%');
  document.querySelectorAll('.lens').forEach((button) => {
    button.classList.remove('open');
    button.setAttribute('aria-pressed', 'false');
  });
}

function renderProgress() {
  $('roundLabel').textContent = `${state.round + 1} / ${state.deck.length}`;
  $('progressDots').innerHTML = state.deck.map((_, index) => `<i class="${index < state.round ? 'done' : index === state.round ? 'current' : ''}"></i>`).join('');
}

function currentScenario() {
  return state.deck[state.round];
}

function renderScenario() {
  resetRoundState();
  const scenario = currentScenario();
  renderProgress();
  $('sceneTag').textContent = scenario.tag;
  $('situationText').textContent = scenario.situation;
  $('oneXText').textContent = scenario.oneX;
  $('openedIdea').innerHTML = '<span>まだ1Xの視野</span><p>レンズを開くと、この場面の見え方が変わります。</p>';
  updateMultiplierUI();
  showScreen('gameScreen');
}

function moveFor(multiplier) {
  const moves = currentScenario().moves;
  if (multiplier >= 8) return { ...moves.high, level: 'high' };
  if (multiplier >= 4) return { ...moves.mid, level: 'mid' };
  return { ...moves.low, level: 'low' };
}

function updateLaunchState() {
  const opened = state.opened.size;
  const ready = opened >= 2 && state.multiplier >= 8;
  $('launchBtn').disabled = !ready;
  if (opened < 2) $('launchLabel').textContent = `あと${2 - opened}レンズ開く`;
  else if (state.multiplier < 8) $('launchLabel').textContent = '8X以上まで押し上げる';
  else $('launchLabel').textContent = 'この10Xを決める';
}

function updateMultiplierUI() {
  const multiplier = Number($('multiplierRange').value);
  state.multiplier = multiplier;
  const move = moveFor(multiplier);
  $('multiplierValue').textContent = `${multiplier}X`;
  $('moveScaleLabel').textContent = move.label;
  $('moveText').textContent = move.text;
  $('moveWhy').textContent = move.why;
  $('movePreview').classList.remove('scale-low', 'scale-mid', 'scale-high');
  $('movePreview').classList.add(`scale-${move.level}`);
  const progress = ((multiplier - 1) / 9) * 100;
  document.documentElement.style.setProperty('--range-progress', `${progress}%`);
  updateLaunchState();
}

function openLens(key) {
  if (state.opened.has(key)) return;
  state.opened.add(key);
  const button = document.querySelector(`[data-lens="${key}"]`);
  button.classList.add('open');
  button.setAttribute('aria-pressed', 'true');
  const data = currentScenario().lenses[key];
  $('openedIdea').innerHTML = `<span>${data.title}</span><p>${data.insight}</p>`;
  updateLaunchState();
  buzz();
}

function launch() {
  if (state.opened.size < 2 || state.multiplier < 8) return;
  const scenario = currentScenario();
  const move = moveFor(state.multiplier);
  state.highScale += 1;
  if (state.opened.size === 3) state.fullLens += 1;
  if (move.level === 'high') state.structural += 1;
  state.opened.forEach((key) => { state.lensUse[key] += 1; });

  $('scaleStamp').textContent = `${state.multiplier}X MOVE`;
  $('feedbackHeadline').textContent = state.opened.size === 3 ? '3方向を見て、10Xへ。' : '視野を広げて、10Xへ。';
  $('feedbackCopy').textContent = move.why;
  $('feedbackLenses').textContent = `${state.opened.size} / 3`;
  $('feedbackMultiplier').textContent = `${state.multiplier}X`;
  $('transferRule').textContent = scenario.transfer;
  showScreen('feedbackScreen');
  buzz(28);
}

function nextRound() {
  state.round += 1;
  if (state.round >= state.deck.length) finishSession();
  else renderScenario();
}

function weakestLens() {
  return Object.keys(state.lensUse).sort((a, b) => state.lensUse[a] - state.lensUse[b])[0];
}

function finishSession() {
  const record = saveRecord({ highScale: state.highScale });
  $('highScaleScore').textContent = String(state.highScale);
  $('fullLensScore').textContent = String(state.fullLens);
  document.querySelectorAll('[data-result-lens]').forEach((node) => {
    const key = node.dataset.resultLens;
    node.querySelector('b').textContent = `${state.lensUse[key]}/${state.deck.length}`;
  });
  const weak = weakestLens();
  $('weakLensTitle').textContent = lensNames[weak].title;
  $('weakLensQuestion').textContent = lensNames[weak].question;
  $('sessionCount').textContent = `これまで ${record.sessions} セッション`;
  $('resultHeadline').textContent = state.fullLens >= 4
    ? '「普通のサイズ」を、そのまま受け取らなかった。'
    : '5つの「普通」を、大きく見直した。';
  renderIntroRecord();
  showScreen('resultScreen');
}

function startSession() {
  state.deck = makeDeck();
  state.round = 0;
  state.highScale = 0;
  state.fullLens = 0;
  state.structural = 0;
  state.lensUse = { volume: 0, quality: 0, ripple: 0 };
  $('shareStatus').textContent = '';
  renderScenario();
}

async function shareResult() {
  const text = `目の前を10倍にする。\n今日の10倍思考：8X以上 ${state.highScale}/5｜3レンズ全部 ${state.fullLens}/5\n明日1回だけ「これを10倍にしたら？」と聞く。\n#LEVELUP #10倍思考`;
  try {
    if (navigator.share) {
      await navigator.share({ text, title: '目の前を10倍にする。' });
      $('shareStatus').textContent = '共有しました。';
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      $('shareStatus').textContent = '結果をコピーしました。';
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    $('shareStatus').textContent = '結果をコピーしました。';
  } catch {
    $('shareStatus').textContent = '共有をキャンセルしました。';
  }
}

function returnIntro() {
  renderIntroRecord();
  showScreen('introScreen');
}

document.querySelectorAll('.lens').forEach((button) => {
  button.addEventListener('click', () => openLens(button.dataset.lens));
});
$('multiplierRange').addEventListener('input', updateMultiplierUI);
$('launchBtn').addEventListener('click', launch);
$('startBtn').addEventListener('click', startSession);
$('nextBtn').addEventListener('click', nextRound);
$('againBtn').addEventListener('click', startSession);
$('shareBtn').addEventListener('click', shareResult);
$('resultHomeBtn').addEventListener('click', returnIntro);
$('recordBtn').addEventListener('click', () => { renderIntroRecord(); showScreen('recordScreen'); });
$('recordBackBtn').addEventListener('click', returnIntro);
$('recordStartBtn').addEventListener('click', startSession);

renderIntroRecord();
