(() => {
  'use strict';

  const STORAGE_KEY = 'levelup.smartphoneEscape.v1';
  const screens = [...document.querySelectorAll('.screen')];
  const $ = (id) => document.getElementById(id);

  const TYPES = {
    hand: {
      name: '手元依存',
      short: '手元',
      summary: '近くにあるだけで、反射的に手が伸びやすい。',
      action: 'スマホを「手を伸ばしても届かない場所」に置く。',
      cutTitle: '2m、離す。',
      cutBody: 'いまスマホを、手を伸ばしても届かない場所へ置く。ポケット・机の手元から距離を作る。',
      cutLabel: '離して置いた',
      checks: ['ポケットから出す', '腕を伸ばしても届かない', '必要な時だけ取りに行く'],
    },
    bed: {
      name: 'ベッド依存',
      short: 'ベッド',
      summary: '寝る前・起きた直後に、ベッドへ刺激が入りやすい。',
      action: '今夜の充電場所を、ベッドから離れた場所に決める。',
      cutTitle: '充電場所を、移す。',
      cutBody: '今夜のスマホ置き場をベッドの外に決める。寝床と刺激をいったん分ける。',
      cutLabel: '置き場を決めた',
      checks: ['ベッドの外', '手を伸ばしても届かない', 'アラームだけなら代替も検討'],
    },
    stimulus: {
      name: '刺激依存',
      short: '刺激',
      summary: '少し暇になると、反射で次の刺激を探しやすい。',
      action: '暇になっても、10秒だけ何もしない。',
      cutTitle: '10秒、退屈する。',
      cutBody: 'スマホを触りたくなっても、10秒だけ何もしない。刺激を入れない時間を先に作る。',
      cutLabel: '10秒できた',
      checks: ['通知を開かない', '検索もしない', '10秒だけ待つ'],
    },
    multi: {
      name: 'ながら依存',
      short: 'ながら',
      summary: '1つの行動だけでは物足りず、別の刺激を足しやすい。',
      action: '次の5分だけ、1つのことしかしない。',
      cutTitle: '5分、1個だけ。',
      cutBody: '食事・仕事・動画など、次の5分は1つだけにする。別のアプリや通知を足さない。',
      cutLabel: '5分を1個でやった',
      checks: ['通知を見ない', '別アプリを開かない', '1つ終えるまで足さない'],
    },
  };

  const QUESTIONS = [
    {
      kicker: 'MORNING', text: '朝、目が覚めたら？', note: 'いちばん近いものをタップ。',
      answers: [
        ['ほぼ反射でスマホを見る', { bed: 3, stimulus: 2 }],
        ['アラーム後、そのまま何か見る', { bed: 2, hand: 1 }],
        ['起きて少ししてから見る', { bed: 1 }],
        ['朝はほぼ見ない', {}],
      ],
    },
    {
      kicker: 'DISTANCE', text: '普段、スマホはどこ？', note: '「使っていない時」の定位置で回答。',
      answers: [
        ['手に持っていることが多い', { hand: 3 }],
        ['ポケット・すぐ届く場所', { hand: 2 }],
        ['机やバッグの中', { hand: 1 }],
        ['少し離れた場所', {}],
      ],
    },
    {
      kicker: 'BED', text: 'ベッドでスマホを見る？', note: '寝る前・起きた直後を含める。',
      answers: [
        ['毎日、かなり見る', { bed: 3 }],
        ['よく見る', { bed: 2 }],
        ['ときどき', { bed: 1 }],
        ['ほぼ見ない', {}],
      ],
    },
    {
      kicker: 'BOREDOM', text: '「ちょっと暇」が来ると？', note: '待ち時間・信号・エレベーターなど。',
      answers: [
        ['ほぼ自動でスマホを開く', { stimulus: 3, hand: 1 }],
        ['SNSやショート動画を探す', { stimulus: 3 }],
        ['必要な時だけ見る', { stimulus: 1 }],
        ['何もしない時間も平気', {}],
      ],
    },
    {
      kicker: 'ONE THING', text: '「ながらスマホ」は？', note: '食事・仕事・テレビ・会話中など。',
      answers: [
        ['ほぼいつも何かと同時', { multi: 3 }],
        ['かなり多い', { multi: 2 }],
        ['ときどき', { multi: 1 }],
        ['ほぼしない', {}],
      ],
    },
    {
      kicker: 'CONTROL', text: 'やめようと思った時は？', note: '予定より長く見てしまうことがあるか。',
      answers: [
        ['止めたいのに何度も延長する', { stimulus: 2, hand: 2 }],
        ['気づくと予定より長い', { stimulus: 2 }],
        ['区切りを決めれば止められる', { hand: 1 }],
        ['ほぼ予定通り止められる', {}],
      ],
    },
  ];

  const MISSIONS = [
    { icon: '#', kicker: '数字を見る', title: '現実を数字にする', body: '昨日のスクリーンタイムをもう一度見る。減らす前に、まず知る。', type: 'info', info: 'スクリーンタイムを開き、「昨日」の合計時間を確認したら完了。' },
    { icon: '↔', kicker: '距離を作る', title: 'ポケットから追い出す', body: '使っていない時のスマホに、物理的な距離を作る。', type: 'info', info: '次の30分だけ、スマホをポケット・手元ではなく、取りに行く必要がある場所へ置く。' },
    { icon: '☾', kicker: 'ベッドを取り戻す', title: '寝床に持ち込まない', body: '今夜のスマホ置き場を、ベッドの外へ移す。', type: 'info', info: '充電場所を先に決める。「寝る直前に考える」より、今決める。' },
    { icon: '1', kicker: 'ながらを切る', title: '5分だけ一点集中', body: 'スマホを足さず、1つの行動だけで5分過ごす。', type: 'info', info: '食事・読書・仕事・片付けなど何でもOK。5分だけ「1つ」にする。' },
    { icon: '…', kicker: '退屈を作る', title: '30秒、何もしない', body: '刺激を入れず、何もしない時間をそのまま通過する。', type: 'timer' },
    { icon: '↻', kicker: '代わりを入れる', title: '別の満足へ乗り換える', body: '空いた時間に入れる、現実側の行動を1つ選ぶ。', type: 'roulette' },
    { icon: '◎', kicker: '戻る場所を決める', title: 'スマホより夢中になる先', body: '減らした時間を、何に戻したいか1つ決める。', type: 'focus' },
  ];

  const REPLACEMENTS = ['5分だけ散歩する', '水を1杯飲む', 'ストレッチする', '本を1ページ読む', '外を1分眺める', '机を1か所片付ける', '腕立て・スクワットを5回', '3分だけ何もしない'];
  const FOCUS_OPTIONS = ['読書', '運動', '勉強', '仕事・制作', '家族・友人', '趣味', '散歩', '睡眠'];

  let state = loadState();
  let answers = [];
  let questionIndex = 0;
  let diagnosisMode = 'baseline';
  let selectedGoal = 60;
  let selectedDay = nextOpenDay();
  let timerId = null;
  let timerRemaining = 30;
  let timerRunning = false;
  let selectedReplacement = '';
  let selectedFocus = '';

  function blankState() {
    return { baseline: null, latest: null, programStarted: false, completedDays: [], focus: '', startDate: null, version: 1 };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return blankState();
      return { ...blankState(), ...JSON.parse(raw) };
    } catch { return blankState(); }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    updateTopStatus();
  }

  function showScreen(id) {
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateTopStatus();
  }

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function updateTopStatus() {
    const done = state.completedDays?.length || 0;
    const pct = Math.round((done / 7) * 100);
    $('topStatus').textContent = state.programStarted ? `ESCAPE ${pct}%` : 'ESCAPE 0%';
    $('resumeBtn').classList.toggle('hidden', !state.programStarted);
  }

  function startDiagnosis(mode = 'baseline') {
    diagnosisMode = mode;
    answers = [];
    questionIndex = 0;
    renderQuestion();
    showScreen('diagnosisScreen');
  }

  function renderQuestion() {
    const q = QUESTIONS[questionIndex];
    $('questionCount').textContent = `${questionIndex + 1} / ${QUESTIONS.length}`;
    $('questionBar').style.width = `${((questionIndex + 1) / QUESTIONS.length) * 100}%`;
    $('questionKicker').textContent = q.kicker;
    $('questionText').textContent = q.text;
    $('questionNote').textContent = q.note;
    $('answerList').innerHTML = '';
    q.answers.forEach(([label, score], idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<b>${escapeHtml(label)}</b><span>${String.fromCharCode(65 + idx)}</span>`;
      button.addEventListener('click', () => selectAnswer(score));
      $('answerList').appendChild(button);
    });
    $('diagnosisBackBtn').style.visibility = questionIndex ? 'visible' : 'hidden';
  }

  function selectAnswer(score) {
    answers[questionIndex] = score;
    if (navigator.vibrate) navigator.vibrate(15);
    if (questionIndex < QUESTIONS.length - 1) {
      questionIndex += 1;
      renderQuestion();
    } else {
      const previous = diagnosisMode === 'recheck' ? state.latest || state.baseline : state.baseline;
      const mins = previous?.screenMinutes ?? 240;
      $('screenHours').value = Math.floor(mins / 60);
      $('screenMinutes').value = mins % 60;
      showScreen('numbersScreen');
    }
  }

  function scoreAnswers() {
    const totals = { hand: 0, bed: 0, stimulus: 0, multi: 0 };
    answers.forEach((score) => {
      Object.entries(score || {}).forEach(([key, value]) => { totals[key] += value; });
    });
    const maxPossible = { hand: 8, bed: 8, stimulus: 12, multi: 3 };
    const scores = Object.fromEntries(Object.keys(totals).map((key) => [key, Math.min(100, Math.round((totals[key] / maxPossible[key]) * 100))]));
    const type = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
    const overall = Math.round((Math.max(...Object.values(scores)) * .55) + (Object.values(scores).reduce((a, b) => a + b, 0) / 4) * .45);
    return { scores, type, overall };
  }

  function buildDiagnosis() {
    const hours = clampNumber($('screenHours').value, 0, 23);
    const mins = clampNumber($('screenMinutes').value, 0, 59);
    const screenMinutes = hours * 60 + mins;
    if (screenMinutes === 0) {
      toast('スクリーンタイムを確認して入力してください');
      return;
    }
    const result = scoreAnswers();
    const payload = { ...result, screenMinutes, goalMinutes: selectedGoal, at: new Date().toISOString() };
    if (diagnosisMode === 'recheck' && state.baseline) {
      state.latest = payload;
      saveState();
      renderCompare();
      showScreen('compareScreen');
      return;
    }
    state.baseline = payload;
    state.latest = payload;
    saveState();
    renderResult(payload);
    showScreen('resultScreen');
  }

  function renderResult(result) {
    const type = TYPES[result.type];
    $('overallScore').textContent = result.overall;
    $('scoreRing').style.background = `conic-gradient(var(--red) ${result.overall * 3.6}deg,#1a1720 0deg)`;
    $('typeName').textContent = type.name;
    $('typeSummary').textContent = type.summary;
    $('firstAction').textContent = type.action;
    $('meters').innerHTML = Object.entries(TYPES).map(([key, meta]) => `
      <div class="meter"><span>${meta.short}</span><div class="meter-track"><i style="width:${result.scores[key]}%"></i></div><b>${result.scores[key]}</b></div>`).join('');
  }

  function renderCut() {
    const result = state.latest || state.baseline;
    const type = TYPES[result?.type || 'stimulus'];
    $('cutTitle').textContent = type.cutTitle;
    $('cutBody').textContent = type.cutBody;
    $('cutDoneLabel').textContent = type.cutLabel;
    $('cutCheck').innerHTML = type.checks.map((text) => `<span>${escapeHtml(text)}</span>`).join('');
    $('cutSuccess').classList.add('hidden');
    $('startProgramBtn').classList.add('hidden');
    $('cutDoneBtn').classList.remove('hidden');
  }

  function completeCut() {
    $('cutDoneBtn').classList.add('hidden');
    $('cutSuccess').classList.remove('hidden');
    $('startProgramBtn').classList.remove('hidden');
    if (navigator.vibrate) navigator.vibrate([25, 35, 50]);
  }

  function startProgram() {
    state.programStarted = true;
    state.startDate ||= new Date().toISOString().slice(0, 10);
    saveState();
    selectedDay = nextOpenDay();
    renderProgram();
    showScreen('programScreen');
  }

  function nextOpenDay() {
    const completed = new Set(state.completedDays || []);
    for (let d = 1; d <= 7; d += 1) if (!completed.has(d)) return d;
    return 7;
  }

  function renderWeekStrip() {
    $('weekStrip').innerHTML = '';
    for (let d = 1; d <= 7; d += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = state.completedDays.includes(d) ? '✓' : d;
      btn.className = `${state.completedDays.includes(d) ? 'done ' : ''}${selectedDay === d ? 'current' : ''}`.trim();
      btn.setAttribute('aria-label', `DAY ${d}${state.completedDays.includes(d) ? ' 完了' : ''}`);
      btn.addEventListener('click', () => { selectedDay = d; renderProgram(); });
      $('weekStrip').appendChild(btn);
    }
  }

  function renderProgram() {
    stopTimer();
    const oldCover = $('missionCard').querySelector('.mission-done');
    if (oldCover) oldCover.remove();
    selectedReplacement = '';
    selectedFocus = state.focus || '';
    const mission = MISSIONS[selectedDay - 1];
    $('currentDayNumber').textContent = selectedDay;
    $('missionIcon').textContent = mission.icon;
    $('missionKicker').textContent = mission.kicker;
    $('missionTitle').textContent = mission.title;
    $('missionBody').textContent = mission.body;
    renderWeekStrip();
    renderMissionAction(mission);
    const done = state.completedDays.includes(selectedDay);
    $('completeMissionBtn').classList.toggle('hidden', done || mission.type === 'timer');
    $('nextMissionBtn').classList.toggle('hidden', !done || selectedDay >= 7);
    if (done) showMissionDone();
  }

  function renderMissionAction(mission) {
    const el = $('missionAction');
    if (mission.type === 'info') {
      el.innerHTML = `<div class="info-box">${escapeHtml(mission.info)}</div>`;
      return;
    }
    if (mission.type === 'timer') {
      el.innerHTML = `<div class="timer-box"><div class="timer-value" id="timerValue">30</div><button type="button" id="timerStartBtn">30秒スタート</button><small>カウント中に画面へ触れるとやり直し。</small></div>`;
      $('timerStartBtn').addEventListener('click', (event) => { event.stopPropagation(); startTimer(); });
      return;
    }
    if (mission.type === 'roulette') {
      el.innerHTML = `<div class="roulette-box"><div class="roulette-result" id="rouletteResult">スマホの代わりを1つ引く</div><button type="button" id="rouletteBtn">ルーレット</button></div>`;
      $('rouletteBtn').addEventListener('click', rollReplacement);
      return;
    }
    if (mission.type === 'focus') {
      el.innerHTML = `<div class="focus-grid" id="focusGrid">${FOCUS_OPTIONS.map((option) => `<button type="button" data-focus="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}</div><input class="focus-input" id="focusInput" maxlength="36" placeholder="ほかに戻りたい場所があれば入力" />`;
      [...$('focusGrid').querySelectorAll('button')].forEach((btn) => btn.addEventListener('click', () => chooseFocus(btn.dataset.focus)));
      $('focusInput').addEventListener('input', () => { if ($('focusInput').value.trim()) chooseFocus($('focusInput').value.trim(), false); });
    }
  }

  function startTimer() {
    timerRemaining = 30;
    timerRunning = true;
    $('timerStartBtn').disabled = true;
    $('timerStartBtn').textContent = '何もしない…';
    $('timerValue').textContent = timerRemaining;
    clearInterval(timerId);
    timerId = setInterval(() => {
      timerRemaining -= 1;
      if ($('timerValue')) $('timerValue').textContent = timerRemaining;
      if (timerRemaining <= 0) {
        stopTimer(false);
        completeMission(5);
        toast('30秒クリア。退屈耐性 +1');
      }
    }, 1000);
  }

  function stopTimer(resetUi = true) {
    clearInterval(timerId);
    timerId = null;
    timerRunning = false;
    if (resetUi && $('timerStartBtn')) {
      $('timerStartBtn').disabled = false;
      $('timerStartBtn').textContent = '30秒スタート';
      if ($('timerValue')) $('timerValue').textContent = '30';
    }
  }

  function interruptTimer(event) {
    if (!timerRunning) return;
    const target = event.target;
    if (target?.id === 'timerStartBtn') return;
    stopTimer();
    toast('触ったので30秒から再スタート');
  }

  function rollReplacement() {
    const next = REPLACEMENTS[Math.floor(Math.random() * REPLACEMENTS.length)];
    selectedReplacement = next;
    $('rouletteResult').textContent = next;
    $('rouletteBtn').textContent = 'もう一回';
    toast('これならやれそう？');
  }

  function chooseFocus(value, syncButtons = true) {
    selectedFocus = value;
    if (syncButtons && $('focusGrid')) {
      [...$('focusGrid').querySelectorAll('button')].forEach((btn) => btn.classList.toggle('selected', btn.dataset.focus === value));
    }
  }

  function completeMission(day = selectedDay) {
    const mission = MISSIONS[day - 1];
    if (mission.type === 'roulette' && !selectedReplacement) {
      toast('先にルーレットを1回まわそう');
      return;
    }
    if (mission.type === 'focus') {
      const custom = $('focusInput')?.value.trim();
      if (custom) selectedFocus = custom;
      if (!selectedFocus) {
        toast('戻りたい場所を1つ選ぼう');
        return;
      }
      state.focus = selectedFocus;
    }
    if (!state.completedDays.includes(day)) state.completedDays.push(day);
    state.completedDays.sort((a, b) => a - b);
    saveState();
    renderWeekStrip();
    showMissionDone();
    $('completeMissionBtn').classList.add('hidden');
    if (day < 7) $('nextMissionBtn').classList.remove('hidden');
    if (navigator.vibrate) navigator.vibrate([18, 30, 38]);
    if (state.completedDays.length === 7) {
      setTimeout(() => showScreen('finalScreen'), 650);
    }
  }

  function showMissionDone() {
    if ($('missionCard').querySelector('.mission-done')) return;
    const cover = document.createElement('div');
    cover.className = 'mission-done';
    cover.innerHTML = `<div><b>✓</b><strong>DAY ${selectedDay} CLEAR</strong><span>脱出度 ${Math.round((state.completedDays.length / 7) * 100)}%</span></div>`;
    $('missionCard').appendChild(cover);
  }

  function goNextDay() {
    const next = Math.min(7, selectedDay + 1);
    selectedDay = next;
    const cover = $('missionCard').querySelector('.mission-done');
    if (cover) cover.remove();
    renderProgram();
  }

  function renderCompare() {
    const before = state.baseline;
    const now = state.latest;
    if (!before || !now) return;
    $('beforeTime').textContent = formatMinutes(before.screenMinutes);
    $('afterTime').textContent = formatMinutes(now.screenMinutes);
    const reclaimed = Math.max(0, before.screenMinutes - now.screenMinutes);
    $('reclaimedTime').textContent = reclaimed >= 60 ? `${Math.floor(reclaimed / 60)}時間${reclaimed % 60 ? `${reclaimed % 60}分` : ''}` : `${reclaimed}分`;
    $('compareMeters').innerHTML = Object.entries(TYPES).map(([key, meta]) => {
      const delta = before.scores[key] - now.scores[key];
      const label = delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : '±0';
      return `<div class="compare-row"><span>${meta.short}</span><div class="compare-bar"><i style="width:${now.scores[key]}%"></i></div><b class="delta">${label}</b></div>`;
    }).join('');
  }

  function renderRecord() {
    $('recordDays').textContent = `${state.completedDays.length}/7`;
    $('recordBaseline').textContent = state.baseline ? formatMinutes(state.baseline.screenMinutes) : '—';
    $('recordLatest').textContent = state.latest ? formatMinutes(state.latest.screenMinutes) : '—';
    $('recordFocus').textContent = state.focus || 'まだ未設定';
    $('recordResumeBtn').querySelector('span').textContent = state.programStarted ? '続きへ' : '診断を始める';
  }

  function shareResult() {
    const before = state.baseline;
    const now = state.latest;
    const reclaimed = before && now ? Math.max(0, before.screenMinutes - now.screenMinutes) : 0;
    const text = `スマホ中毒脱出 7DAYS\n${state.completedDays.length}/7 DAY CLEAR\n1日あたり ${reclaimed}分をスマホ以外へ戻した。\n#LEVELUP #スマホ中毒脱出`;
    if (navigator.share) {
      navigator.share({ title: 'スマホ中毒脱出', text, url: location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${location.href}`).then(() => toast('結果をコピーしました')).catch(() => toast('コピーできませんでした'));
    } else {
      toast('共有機能を利用できません');
    }
  }

  function keepMode() {
    selectedDay = nextOpenDay();
    renderProgram();
    showScreen('programScreen');
  }

  function formatMinutes(total) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
  }

  function clampNumber(value, min, max) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }

  $('startDiagnosisBtn').addEventListener('click', () => startDiagnosis(state.baseline ? 'recheck' : 'baseline'));
  $('resumeBtn').addEventListener('click', () => { selectedDay = nextOpenDay(); renderProgram(); showScreen(state.completedDays.length === 7 ? 'finalScreen' : 'programScreen'); });
  $('recordBtn').addEventListener('click', () => { renderRecord(); showScreen('recordScreen'); });
  $('recordBackBtn').addEventListener('click', () => showScreen('homeScreen'));
  $('recordResumeBtn').addEventListener('click', () => { if (state.programStarted) { selectedDay = nextOpenDay(); renderProgram(); showScreen(state.completedDays.length === 7 ? 'finalScreen' : 'programScreen'); } else startDiagnosis('baseline'); });
  $('diagnosisBackBtn').addEventListener('click', () => { if (questionIndex > 0) { questionIndex -= 1; renderQuestion(); } });
  $('goalPills').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-goal]');
    if (!btn) return;
    selectedGoal = Number(btn.dataset.goal);
    [...$('goalPills').querySelectorAll('button')].forEach((b) => b.classList.toggle('selected', b === btn));
  });
  $('showResultBtn').addEventListener('click', buildDiagnosis);
  $('cutLoopBtn').addEventListener('click', () => { renderCut(); showScreen('cutScreen'); });
  $('resultRedoBtn').addEventListener('click', () => startDiagnosis('baseline'));
  $('cutDoneBtn').addEventListener('click', completeCut);
  $('startProgramBtn').addEventListener('click', startProgram);
  $('completeMissionBtn').addEventListener('click', () => completeMission());
  $('nextMissionBtn').addEventListener('click', goNextDay);
  $('recheckBtn').addEventListener('click', () => startDiagnosis('recheck'));
  $('keepModeBtn').addEventListener('click', keepMode);
  $('shareResultBtn').addEventListener('click', shareResult);
  $('compareHomeBtn').addEventListener('click', () => showScreen('homeScreen'));
  document.addEventListener('pointerdown', interruptTimer, true);

  updateTopStatus();
})();
