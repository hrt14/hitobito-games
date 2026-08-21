(() => {
  'use strict';

  const STORAGE_KEY = 'levelup.timeAnxietyReset.v1';
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];

  const TYPES = {
    pressure: { name: '追われ型', summary: '目の前の「やること」が多く、未完了そのものが圧力になりやすい。', prescription: '今日の予定を1つ、後日に送る。', why: 'まず目の前の圧力を下げ、余白を取り戻す。' },
    life: { name: '人生焦り型', summary: '「人生は短い」「もっとやらなければ」という全体の焦りが、今日まで急がせやすい。', prescription: '今週やらないことを1つ決める。', why: '全部できる前提を外し、選んだものへ時間を使う。' },
    perfect: { name: '完璧型', summary: '終わらせるより「もっと良くできる」が勝ちやすく、時間が膨らみやすい。', prescription: '今日1つ、70点で提出・終了する。', why: '最高品質ではなく「十分な前進」で止める練習をする。' },
    blind: { name: '時間盲目型', summary: '必要時間の見積もりと実際の時間がズレやすく、予定が後ろへ押しやすい。', prescription: '次の作業を予想→タイマーで実測する。', why: '気合ではなく外部の時計を使い、自分の補正値を知る。' },
    blame: { name: '自責型', summary: '予定どおり進まない時、出来事より先に「自分はダメだ」という評価へ飛びやすい。', prescription: '「事実・感情・自己評価」を1回分ける。', why: '起きたことと、自分への採点を同じものにしない。' },
    postpone: { name: '後回し型', summary: '大切なことを「仕事が全部終わった後」に置き、いつまでも自分の時間が来にくい。', prescription: '大切な時間を30分、先に確保する。', why: '余った時間ではなく、先取りして自分へ返す。' },
  };

  const QUESTIONS = [
    { kicker: 'UNFINISHED', text: 'やることが残っている時、休める？', note: 'いちばん近い感覚を選ぶ。', answers: [
      ['休んでいても、ずっと気になる', { pressure: 3, blame: 1 }], ['少し落ち着かない', { pressure: 2 }], ['急ぎだけ気にする', { pressure: 1 }], ['必要なら普通に休める', {}],
    ]},
    { kicker: 'WHOLE LIFE', text: '「人生が足りない」と焦ることは？', note: 'やりたいこと・成長・経験などを含める。', answers: [
      ['かなりある。もっと急がないとと思う', { life: 3 }], ['よくある', { life: 2 }], ['たまにある', { life: 1 }], ['ほぼない', {}],
    ]},
    { kicker: 'GOOD ENOUGH', text: '70点で終えるのは？', note: '仕事・家事・趣味などで考える。', answers: [
      ['かなり苦手。もっと良くしたくなる', { perfect: 3 }], ['苦手な方', { perfect: 2 }], ['物による', { perfect: 1 }], ['十分なら終えられる', {}],
    ]},
    { kicker: 'ESTIMATE', text: '予定より作業が長引くことは？', note: '見積もった時間と実際の時間の差。', answers: [
      ['かなり多い', { blind: 3, pressure: 1 }], ['よくある', { blind: 2 }], ['ときどき', { blind: 1 }], ['ほぼない', {}],
    ]},
    { kicker: 'SELF JUDGMENT', text: '時間をうまく使えなかった日は？', note: '最初に出てくる考えに近いもの。', answers: [
      ['「自分はダメだ」と思う', { blame: 3 }], ['かなり自分を責める', { blame: 2 }], ['少し反省する', { blame: 1 }], ['出来事として切り替えられる', {}],
    ]},
    { kicker: 'IMPORTANT FIRST', text: '本当にやりたいことは、いつやる？', note: '休息・家族・趣味・挑戦なども含む。', answers: [
      ['仕事や用事が全部終わってから', { postpone: 3 }], ['空いた時間があれば', { postpone: 2 }], ['予定に入れることもある', { postpone: 1 }], ['先に時間を確保する', {}],
    ]},
    { kicker: 'ONE APPOINTMENT', text: '予定が1つある日の自由時間は？', note: '予定の前後に余白があっても使える感覚か。', answers: [
      ['1日ずっと予定に縛られる感じ', { pressure: 2, blind: 2 }], ['前の時間が使いにくい', { pressure: 2 }], ['少し気になる', { pressure: 1 }], ['空き時間は普通に使える', {}],
    ]},
  ];

  const THOUGHTS = [
    { text: '今日は予定の3つのうち、1つ終わらなかった。', answer: 'fact', explain: '数えられる出来事なので「事実」。ここには自己評価が入っていません。' },
    { text: '終わらなくて、焦っている。', answer: 'feeling', explain: '「焦っている」は今の感情。事実と分けて扱えます。' },
    { text: '今日を無駄にした。自分は時間の使い方が下手だ。', answer: 'judgment', explain: '出来事そのものではなく、自分への評価が足されています。' },
  ];

  const defaultState = () => ({
    diagnosis: null,
    scores: {},
    returnedMinutes: 0,
    taskSessions: 0,
    thoughtSessions: 0,
    training: { letgo: 0, goodenough: 0, estimate: 0, choose: 0, bank: 0 },
    bankMinutes: 0,
    bankItems: [],
    estimates: [],
  });

  let state = loadState();
  let qIndex = 0;
  let scores = {};
  let tasks = [];
  let thoughtIndex = 0;
  let exercise = null;
  let timerStart = 0;
  let timerInterval = null;

  function loadState() {
    try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return defaultState(); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function showScreen(id) {
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800);
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
  }

  function startDiagnosis() {
    qIndex = 0; scores = Object.fromEntries(Object.keys(TYPES).map((key) => [key, 0]));
    showScreen('diagnosisScreen'); renderQuestion();
  }
  function renderQuestion() {
    const q = QUESTIONS[qIndex];
    $('qCount').textContent = `${String(qIndex + 1).padStart(2,'0')} / ${String(QUESTIONS.length).padStart(2,'0')}`;
    $('qProgress').style.width = `${((qIndex + 1) / QUESTIONS.length) * 100}%`;
    $('qKicker').textContent = q.kicker; $('qText').textContent = q.text; $('qNote').textContent = q.note;
    $('answerList').innerHTML = q.answers.map((a, i) => `<button type="button" data-answer="${i}">${escapeHtml(a[0])}<span>${i + 1}</span></button>`).join('');
  }
  function answerQuestion(index) {
    const weights = QUESTIONS[qIndex].answers[index][1];
    Object.entries(weights).forEach(([key, value]) => { scores[key] += value; });
    qIndex += 1;
    if (qIndex < QUESTIONS.length) renderQuestion(); else finishDiagnosis();
  }
  function finishDiagnosis() {
    const ranked = Object.entries(scores).sort((a,b) => b[1] - a[1]);
    const primary = ranked[0][0], secondary = ranked[1][1] > 0 ? ranked[1][0] : null;
    state.diagnosis = { primary, secondary, at: Date.now() }; state.scores = scores; saveState();
    renderResult(); showScreen('resultScreen');
  }
  function renderResult() {
    const d = state.diagnosis; if (!d) return startDiagnosis();
    const p = TYPES[d.primary], s = d.secondary ? TYPES[d.secondary] : null;
    $('typeBadge').textContent = s ? `${p.name} × ${s.name}` : p.name;
    $('resultTitle').textContent = s ? `${p.name}が中心。${s.name}も混ざっています。` : `${p.name}が中心です。`;
    $('resultSummary').textContent = p.summary + (s ? ` ${s.summary}` : '');
    const max = Math.max(1, ...Object.values(state.scores));
    $('scoreBars').innerHTML = Object.entries(TYPES).map(([key, value]) => {
      const score = state.scores[key] || 0; return `<div class="score-row"><span>${value.name}</span><div class="score-track"><i style="width:${Math.round(score / max * 100)}%"></i></div><b>${score}</b></div>`;
    }).join('');
    $('todayPrescription').textContent = p.prescription; $('prescriptionWhy').textContent = p.why;
  }

  function openRelief() {
    tasks = []; renderTasks(); showScreen('reliefScreen');
  }
  function addTask(name, minutes) {
    if (!name.trim()) return; tasks.push({ id: Date.now() + Math.random(), name: name.trim(), minutes, status: null }); renderTasks();
  }
  function processTask(id, action) {
    const task = tasks.find((t) => String(t.id) === String(id)); if (!task || task.status) return;
    task.status = action;
    if (action === 'later' || action === 'drop') state.returnedMinutes += task.minutes;
    if (action === 'reduce') state.returnedMinutes += Math.round(task.minutes * .3);
    saveState(); renderTasks();
  }
  function renderTasks() {
    $('taskDeck').innerHTML = tasks.length ? tasks.map((t) => `<div class="task-card ${t.status ? 'done':''}"><div class="task-head"><strong>${escapeHtml(t.name)}</strong><span>${t.minutes}分</span></div>${t.status ? `<div class="exercise-note">${({do:'今日はやる',reduce:'70%に減らす',later:'後日に送った',drop:'捨てた'})[t.status]}</div>` : `<div class="task-actions"><button data-task="${t.id}" data-action="do">やる</button><button data-task="${t.id}" data-action="reduce">減らす</button><button data-task="${t.id}" data-action="later">後日</button><button data-task="${t.id}" data-action="drop">捨てる</button></div>`}</div>`).join('') : '<div class="exercise-note">まず1〜5個だけ入れてください。全部を書き出す必要はありません。</div>';
    $('returnedMinutes').textContent = `${state.returnedMinutes}分`;
  }
  function finishRelief() { state.taskSessions += 1; saveState(); toast('今日の圧力を下げる練習を記録しました'); showTraining(); }

  function startThoughts() { thoughtIndex = 0; showScreen('thoughtScreen'); renderThought(); }
  function renderThought() {
    const item = THOUGHTS[thoughtIndex]; $('thoughtCard').textContent = `「${item.text}」`;
    $('thoughtChoices').innerHTML = '<button data-kind="fact">事実</button><button data-kind="feeling">感情</button><button data-kind="judgment">自己評価</button>';
    $('thoughtFeedback').className = 'feedback'; $('thoughtFeedback').textContent = ''; $('thoughtNextBtn').classList.add('hidden');
  }
  function answerThought(kind) {
    const item = THOUGHTS[thoughtIndex], ok = kind === item.answer;
    $('thoughtFeedback').className = `feedback show ${ok ? 'good':'bad'}`;
    $('thoughtFeedback').textContent = `${ok ? 'その通り。':'もう一度分けると…'} ${item.explain}`;
    $('thoughtNextBtn').classList.remove('hidden');
  }
  function nextThought() {
    thoughtIndex += 1;
    if (thoughtIndex < THOUGHTS.length) return renderThought();
    state.thoughtSessions += 1; saveState(); toast('事実と自己評価を分ける練習を記録しました'); showTraining();
  }

  function stats() {
    return {
      '余白力': Math.min(99, state.taskSessions * 8 + Math.round(state.returnedMinutes / 30) * 2 + state.training.letgo * 5),
      '70点力': Math.min(99, state.training.goodenough * 9),
      '時間感覚': Math.min(99, state.training.estimate * 9),
      '選ぶ力': Math.min(99, state.training.choose * 9 + state.training.letgo * 3),
      '自分優先': Math.min(99, state.training.bank * 8 + Math.round(state.bankMinutes / 30) * 2),
    };
  }
  function showTraining() {
    const values = stats(); $('statsGrid').innerHTML = Object.entries(values).map(([name,value]) => `<div class="stat"><b>${value}</b><span>${name}</span></div>`).join('');
    showScreen('trainingScreen');
  }

  function openExercise(kind) {
    exercise = kind; clearInterval(timerInterval); $('exerciseDoneBtn').classList.add('hidden');
    const configs = {
      letgo: ['01 / LET GO', '絶対に1つ、捨てる。', '「全部やる」を禁止して、選ぶ練習をします。'],
      goodenough: ['02 / GOOD ENOUGH', '70点で、止める。', 'もっと磨ける場面で「十分」を選ぶ練習です。'],
      estimate: ['03 / ESTIMATE', '予想して、測る。', '見積もりを気合で直さず、外部の時計で自分の傾向を知ります。'],
      choose: ['04 / CHOOSE', '全部は、持てない。', '人生で大切にしたいものを5つだけ選びます。'],
      bank: ['05 / TIME BANK', '大切な時間を、先に取る。', '余ったらやる、ではなく先取りします。'],
    }[kind];
    $('exerciseKicker').textContent = configs[0]; $('exerciseTitle').textContent = configs[1]; $('exerciseCopy').textContent = configs[2];
    renderExercise(kind); showScreen('exerciseScreen');
  }
  function renderExercise(kind) {
    const body = $('exerciseBody');
    if (kind === 'letgo') body.innerHTML = `<div class="exercise-card"><h3>今日やりたかった5つ。<br>でも、1つは必ず捨てる。</h3><div class="exercise-options" id="letgoOptions">${['急ぎではない返信','資料の最後の磨き込み','惰性で見ている情報収集','今日でなくてもいい雑用','なんとなく入れた予定'].map((x,i)=>`<button data-choice="${i}">${x}</button>`).join('')}</div><p class="exercise-note">捨てる＝価値がない、ではありません。今日の時間をどこへ使うか選ぶ行為です。</p></div>`;
    if (kind === 'goodenough') body.innerHTML = `<div class="exercise-card"><h3>資料は必要な情報が入り、誤字も確認済み。さらに30分かければ見た目を磨けます。</h3><div class="exercise-options" id="goodOptions"><button data-good="stop">ここで出す</button><button data-good="polish">あと30分磨く</button></div><p id="goodFeedback" class="exercise-note">今回の目的は「最高」ではなく「十分で終える」練習です。</p></div>`;
    if (kind === 'estimate') body.innerHTML = `<div class="exercise-card"><h3>短い作業を1つ決める。</h3><input id="estimateLabel" class="number-input" maxlength="30" placeholder="例：メールを1通返す"><input id="estimateMinutes" class="number-input" type="number" min="1" max="120" value="5" placeholder="予想（分）"><button id="estimateStart" class="small-action" type="button">実測スタート</button><div id="timerLive" class="timer-live">00:00</div><button id="estimateStop" class="small-action hidden" type="button">終わった</button><p id="estimateResult" class="exercise-note">予想してから時計を動かします。</p></div>`;
    if (kind === 'choose') body.innerHTML = `<div class="exercise-card"><h3>この中から、今大切にする5つだけ。</h3><div id="lifeGrid" class="life-grid">${['仕事','家族','休息','健康','友人','趣味','学び','旅行','創作'].map((x)=>`<button data-life="${x}">${x}</button>`).join('')}</div><p id="lifeCount" class="exercise-note">0 / 5 選択</p></div>`;
    if (kind === 'bank') body.innerHTML = `<div class="exercise-card"><h3>今週、自分へ先に返したい時間は？</h3><input id="bankLabel" class="number-input" maxlength="36" placeholder="例：何もしない / 子どもと出かける"><input id="bankMinutesInput" class="number-input" type="number" min="10" max="600" step="10" value="30"><button id="bankAdd" class="small-action" type="button">この時間を先取りする</button><p id="bankFeedback" class="exercise-note">カレンダーの空き時間ではなく「先に確保する」と決める練習です。</p></div>`;
  }

  function completeExercise() {
    if (!exercise) return; state.training[exercise] += 1; saveState(); toast('根本トレーニングを記録しました'); showTraining();
  }

  function renderRecord() {
    const totalTraining = Object.values(state.training).reduce((a,b)=>a+b,0);
    $('recordStats').innerHTML = `<div><span>返した見込み時間</span><b>${state.returnedMinutes}分</b></div><div><span>根本トレーニング</span><b>${totalTraining}回</b></div><div><span>事実分け練習</span><b>${state.thoughtSessions}回</b></div><div><span>診断</span><b>${state.diagnosis ? TYPES[state.diagnosis.primary].name : '未診断'}</b></div>`;
    $('bankTotal').textContent = `${state.bankMinutes}分`;
    $('estimateHistory').innerHTML = state.estimates.length ? state.estimates.slice(-5).reverse().map((e)=>`<div class="history-item"><strong>${escapeHtml(e.label || '作業')}</strong>：予想 ${e.estimate}分 / 実測 ${e.actual}分 → ${e.ratio}倍</div>`).join('') : '<div class="exercise-note">時間の実測記録はまだありません。</div>';
    showScreen('recordScreen');
  }

  async function shareResult() {
    const d = state.diagnosis; const values = stats();
    const text = d ? `時間に追われない自分になる｜${TYPES[d.primary].name}\n余白力 ${values['余白力']} / 70点力 ${values['70点力']} / 時間感覚 ${values['時間感覚']}\nLEVEL UP` : '「時間に追われない自分になる」で、時間との付き合い方を見直しています。｜LEVEL UP';
    try { if (navigator.share) await navigator.share({ text, url: location.href }); else { await navigator.clipboard.writeText(`${text}\n${location.href}`); toast('結果をコピーしました'); } } catch {}
  }

  $('startDiagnosisBtn').addEventListener('click', startDiagnosis);
  $('trainingHomeBtn').addEventListener('click', showTraining);
  $('trainingResultBtn').addEventListener('click', showTraining);
  $('reliefBtn').addEventListener('click', openRelief);
  $('recordBtn').addEventListener('click', renderRecord);
  $('trainingBackBtn').addEventListener('click', () => showScreen('homeScreen'));
  $('exerciseBackBtn').addEventListener('click', showTraining);
  $('exerciseDoneBtn').addEventListener('click', completeExercise);
  $('shareBtn').addEventListener('click', shareResult);
  $('reliefDoneBtn').addEventListener('click', finishRelief);
  $('thoughtBtn').addEventListener('click', startThoughts);
  $('thoughtNextBtn').addEventListener('click', nextThought);
  $('answerList').addEventListener('click', (e) => { const b = e.target.closest('[data-answer]'); if (b) answerQuestion(Number(b.dataset.answer)); });
  $('thoughtChoices').addEventListener('click', (e) => { const b = e.target.closest('[data-kind]'); if (b) answerThought(b.dataset.kind); });
  $('taskForm').addEventListener('submit', (e) => { e.preventDefault(); addTask($('taskName').value, Math.max(1, Number($('taskMinutes').value) || 30)); $('taskName').value = ''; });
  $('taskDeck').addEventListener('click', (e) => { const b = e.target.closest('[data-task]'); if (b) processTask(b.dataset.task, b.dataset.action); });
  document.querySelectorAll('[data-train]').forEach((b) => b.addEventListener('click', () => openExercise(b.dataset.train)));

  $('exerciseBody').addEventListener('click', (e) => {
    const choice = e.target.closest('[data-choice]');
    if (choice && exercise === 'letgo') { document.querySelectorAll('[data-choice]').forEach((b)=>b.classList.remove('selected')); choice.classList.add('selected'); $('exerciseDoneBtn').classList.remove('hidden'); }
    const good = e.target.closest('[data-good]');
    if (good && exercise === 'goodenough') { document.querySelectorAll('[data-good]').forEach((b)=>b.classList.remove('selected')); good.classList.add('selected'); $('goodFeedback').textContent = good.dataset.good === 'stop' ? '「十分」で止めました。完了を前進として扱います。' : '磨く選択もできます。ただし今回は「十分で止める」反射を鍛える回です。'; if (good.dataset.good === 'stop') $('exerciseDoneBtn').classList.remove('hidden'); }
    const life = e.target.closest('[data-life]');
    if (life && exercise === 'choose') { const selected = [...document.querySelectorAll('[data-life].selected')]; if (!life.classList.contains('selected') && selected.length >= 5) return toast('今日は5つまで。選ばないことも選択です'); life.classList.toggle('selected'); const n = document.querySelectorAll('[data-life].selected').length; $('lifeCount').textContent = `${n} / 5 選択${n === 5 ? ' — 選ばなかったものがある＝失敗、ではありません。':''}`; if (n === 5) $('exerciseDoneBtn').classList.remove('hidden'); }
    if (e.target.id === 'bankAdd' && exercise === 'bank') { const label = $('bankLabel').value.trim() || '自分のための時間'; const minutes = Math.max(10, Number($('bankMinutesInput').value) || 30); state.bankMinutes += minutes; state.bankItems.push({ label, minutes, at: Date.now() }); saveState(); $('bankFeedback').textContent = `「${label}」を${minutes}分、先取りしました。`; $('exerciseDoneBtn').classList.remove('hidden'); }
    if (e.target.id === 'estimateStart' && exercise === 'estimate') { timerStart = Date.now(); $('estimateStart').classList.add('hidden'); $('estimateStop').classList.remove('hidden'); timerInterval = setInterval(() => { const sec = Math.floor((Date.now()-timerStart)/1000); $('timerLive').textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }, 250); }
    if (e.target.id === 'estimateStop' && exercise === 'estimate' && timerStart) { clearInterval(timerInterval); const actualRaw = (Date.now()-timerStart)/60000; const actual = Math.max(.1, Math.round(actualRaw*10)/10); const estimate = Math.max(1, Number($('estimateMinutes').value)||5); const ratio = Math.round(actual/estimate*100)/100; const label = $('estimateLabel').value.trim() || '作業'; state.estimates.push({ label, estimate, actual, ratio, at:Date.now() }); saveState(); $('estimateStop').classList.add('hidden'); $('estimateResult').textContent = `予想 ${estimate}分 → 実測 ${actual}分。今回の補正値は ${ratio}倍。記録を重ねると、自分の見積もり傾向が見えてきます。`; $('exerciseDoneBtn').classList.remove('hidden'); timerStart = 0; }
  });

  $('resetBtn').addEventListener('click', () => { if (!confirm('このアプリの記録をすべて消しますか？')) return; state = defaultState(); saveState(); toast('記録をリセットしました'); renderRecord(); });

  if (state.diagnosis) renderResult();
})();