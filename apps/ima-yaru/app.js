(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const dots = [...document.querySelectorAll('#stepDots i')];
  const STORAGE_KEY = 'levelup.ima-yaru.v1';

  const causes = [
    { id:'big', label:'大きすぎる', sub:'どこまでやるか考えるだけで重い', symbol:'▰', tone:'#d8ff5b' },
    { id:'vague', label:'何からやるか不明', sub:'次の一手が見えていない', symbol:'?', tone:'#9cc2ff' },
    { id:'fear', label:'失敗がこわい', sub:'結果・反応・評価を考えて止まる', symbol:'!', tone:'#ff9f8f' },
    { id:'perfect', label:'ちゃんとやりたい', sub:'完成度を上げようとして始められない', symbol:'100', tone:'#c6a8ff' },
    { id:'heavy', label:'気が重い', sub:'疲れた・面倒・気分が乗らない', symbol:'−', tone:'#9fb0a3' },
    { id:'distract', label:'別のものを見ちゃう', sub:'通知・SNS・他タスクへ逃げる', symbol:'↗', tone:'#ffca75' },
  ];

  const prescriptions = {
    big: {
      badge:'SIZE DOWN',
      lead:'終わらせる範囲を考えると重くなるなら、完成を禁止して入口だけにします。',
      action:(task)=>`「${task}」を完成させない。まず必要な画面・資料・道具を1つ開く。`,
    },
    vague: {
      badge:'NEXT ONLY',
      lead:'全体を整理する前に、次に触るものを1つだけ決めます。',
      action:(task)=>`「${task}」のために、最初に確認する1つを開く。まだ作らなくていい。`,
    },
    fear: {
      badge:'PRIVATE DRAFT',
      lead:'結果を出すところまで考えず、誰にも見せない下書きから始めます。',
      action:(task)=>`「${task}」の提出しない下書きを1行だけ作る。評価はまだ考えない。`,
    },
    perfect: {
      badge:'ROUGH FIRST',
      lead:'最初から正解を作らず、直す前提の仮版を先に出します。',
      action:(task)=>`「${task}」の60点の仮版を30秒だけ作る。整えるのはあと。`,
    },
    heavy: {
      badge:'30 SEC',
      lead:'気分を変えてから始めるのではなく、続ける判断を30秒後に回します。',
      action:(task)=>`「${task}」に30秒だけ触る。30秒後に続けるかやめるか決める。`,
    },
    distract: {
      badge:'ONE SCREEN',
      lead:'選択肢を増やさず、対象以外の画面をいったん切ります。',
      action:(task)=>`このアプリを閉じて「${task}」に必要な画面だけ開く。ほかは見ない。`,
    },
  };

  const state = { task:'', cause:null, microAction:'', launchedAt:0, leftAt:0, hasLeft:false, countdownTimer:null, returnTimer:null, rescueOptions:[] };

  function loadHistory(){
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { sessions:Array.isArray(value.sessions) ? value.sessions.slice(-80) : [] };
    } catch { return { sessions:[] }; }
  }
  let history = loadHistory();

  function saveHistory(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }

  function savePending(){
    try {
      localStorage.setItem(`${STORAGE_KEY}.pending`, JSON.stringify({
        task:state.task, cause:state.cause?.id || null, action:state.microAction, launchedAt:state.launchedAt || Date.now(),
      }));
    } catch {}
  }

  function clearPending(){
    try { localStorage.removeItem(`${STORAGE_KEY}.pending`); } catch {}
  }

  function loadPending(){
    try {
      const pending = JSON.parse(localStorage.getItem(`${STORAGE_KEY}.pending`) || 'null');
      if (!pending?.task || !pending?.action || Date.now() - Number(pending.launchedAt || 0) > 2 * 60 * 60 * 1000) { clearPending(); return null; }
      return pending;
    } catch { clearPending(); return null; }
  }

  function vibrate(pattern=8){ try { navigator.vibrate?.(pattern); } catch {} }

  function setScreen(id){
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    const active = $(id);
    const step = Number(active?.dataset.step ?? 0);
    dots.forEach((dot, index) => dot.classList.toggle('active', index === Math.min(step, 3)));
    window.scrollTo({ top:0, behavior:'auto' });
    try { window.LevelUpTelemetry?.step?.(id.replace(/Screen$/, '')); } catch {}
  }

  function cleanTask(value){ return String(value || '').trim().replace(/\s+/g, ' '); }

  function renderCauses(){
    $('causeGrid').innerHTML = causes.map((cause) => `
      <button class="cause-btn" type="button" data-cause="${cause.id}" style="--tone:${cause.tone}">
        <span class="symbol">${cause.symbol}</span>
        <div><b>${cause.label}</b><span>${cause.sub}</span></div>
      </button>`).join('');
  }

  function selectCause(id){
    state.cause = causes.find((cause) => cause.id === id) || causes[0];
    const prescription = prescriptions[state.cause.id];
    state.microAction = prescription.action(state.task);
    $('taskPreview').textContent = state.task;
    $('prescriptionLead').textContent = prescription.lead;
    $('causeBadge').textContent = prescription.badge;
    $('microAction').value = state.microAction;
    vibrate(10);
    setScreen('actionScreen');
  }

  function shrinkAgain(){
    const task = state.task;
    const options = [
      `「${task}」に必要な画面・ファイルを開くだけ。`,
      `「${task}」のタイトル・見出し・最初の1行だけ置く。`,
      `「${task}」に使う道具・資料を1つだけ手元に出す。`,
      `30秒タイマーを始めて「${task}」に触る。続けるかは後。`,
    ];
    state.rescueOptions = options;
    const grid = $('rescueGrid');
    grid.replaceChildren();
    options.forEach((text, index) => {
      const button = document.createElement('button');
      button.className = 'rescue-btn'; button.type = 'button'; button.dataset.rescue = String(index);
      const number = document.createElement('b'); number.textContent = `0${index+1}`;
      const copy = document.createElement('span'); copy.textContent = text;
      button.append(number, copy); grid.append(button);
    });
    setScreen('rescueScreen');
  }

  function clearLaunchTimers(){
    clearInterval(state.countdownTimer); state.countdownTimer = null;
    clearTimeout(state.returnTimer); state.returnTimer = null;
  }

  function beginLaunch(){
    state.microAction = cleanTask($('microAction').value) || prescriptions[state.cause?.id || 'heavy'].action(state.task);
    $('microAction').value = state.microAction;
    $('launchAction').textContent = state.microAction;
    $('checkTask').textContent = state.microAction;
    $('goBtn').hidden = true;
    $('alreadyStartedBtn').hidden = true;
    $('launchNote').textContent = 'この画面を閉じて、対象の画面・道具を開いてください。戻ってきたら着手できたか記録します。';
    $('launchTitle').innerHTML = '30秒だけ、<br>始める。';
    clearLaunchTimers();
    setScreen('launchScreen');
    let remaining = 3;
    $('countdown').textContent = remaining;
    state.countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        $('countdown').textContent = remaining;
        vibrate(6);
        return;
      }
      clearInterval(state.countdownTimer); state.countdownTimer = null;
      $('countdown').textContent = 'GO';
      $('goBtn').hidden = false;
      $('alreadyStartedBtn').hidden = false;
      state.launchedAt = Date.now();
      savePending();
      vibrate([10,30,15]);
      $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on');
    }, 780);
  }

  function markGo(){
    state.launchedAt = state.launchedAt || Date.now();
    savePending();
    $('goBtn').hidden = true;
    $('launchNote').textContent = 'ここから先はアプリの外。対象だけ開いて、30秒触ってください。';
    $('launchTitle').innerHTML = 'ここを閉じて、<br>今やる。';
    vibrate(12);
    state.returnTimer = setTimeout(() => { $('alreadyStartedBtn').hidden = false; }, 4000);
  }

  function showCheck(){
    clearLaunchTimers();
    setScreen('checkScreen');
  }

  function record(started){
    const entry = {
      t:Date.now(), task:state.task, cause:state.cause?.id || null,
      action:state.microAction, started:Boolean(started), leftApp:Boolean(state.hasLeft),
      delayMs:state.launchedAt ? Math.max(0, Date.now() - state.launchedAt) : null,
    };
    history.sessions.push(entry); history.sessions = history.sessions.slice(-80); saveHistory();
    return entry;
  }

  function finishSuccess(){
    clearPending();
    record(true);
    $('resultAction').textContent = state.microAction;
    renderStats();
    const stats = getStats();
    $('resultSessions').textContent = stats.total;
    $('resultRate').textContent = `${stats.rate}%`;
    setScreen('resultScreen');
    vibrate([12,30,12]);
    try { window.LevelUpTelemetry?.complete?.('started'); } catch {}
  }

  function retrySmaller(){
    clearPending();
    record(false);
    shrinkAgain();
  }

  function getStats(){
    const sessions = history.sessions;
    const total = sessions.length;
    const started = sessions.filter((item) => item.started).length;
    const rate = total ? Math.round(started / total * 100) : 0;
    const counts = new Map();
    for (const item of sessions) {
      if (!item.cause) continue;
      counts.set(item.cause, (counts.get(item.cause) || 0) + 1);
    }
    let topId = null, topCount = 0;
    for (const [id, count] of counts) if (count > topCount) { topId = id; topCount = count; }
    return { total, rate, top:causes.find((cause) => cause.id === topId)?.label || '—' };
  }

  function renderStats(){
    const stats = getStats();
    if (!stats.total) { $('localStats').hidden = true; return; }
    $('startRate').textContent = `${stats.rate}%`;
    $('topCause').textContent = stats.top;
    $('localStats').hidden = false;
  }

  function reset(){
    clearLaunchTimers(); clearPending();
    state.task=''; state.cause=null; state.microAction=''; state.launchedAt=0; state.leftAt=0; state.hasLeft=false; state.rescueOptions=[];
    $('taskInput').value=''; $('startBtn').disabled=true;
    renderStats(); setScreen('startScreen');
  }

  $('taskInput').addEventListener('input', () => {
    state.task = cleanTask($('taskInput').value);
    $('startBtn').disabled = state.task.length < 1;
  });
  $('taskInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !$('startBtn').disabled) { event.preventDefault(); $('startBtn').click(); }
  });
  $('startBtn').addEventListener('click', () => {
    state.task = cleanTask($('taskInput').value);
    if (state.task.length < 1) return;
    setScreen('causeScreen'); vibrate(8);
  });
  $('causeGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-cause]'); if (button) selectCause(button.dataset.cause);
  });
  $('microAction').addEventListener('input', () => { state.microAction = cleanTask($('microAction').value); });
  $('prepareBtn').addEventListener('click', beginLaunch);
  $('smallerBtn').addEventListener('click', shrinkAgain);
  $('rescueGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-rescue]'); if (!button) return;
    state.microAction = state.rescueOptions[Number(button.dataset.rescue)] || state.microAction;
    $('microAction').value = state.microAction;
    beginLaunch();
  });
  $('backActionBtn').addEventListener('click', () => setScreen('actionScreen'));
  $('goBtn').addEventListener('click', markGo);
  $('alreadyStartedBtn').addEventListener('click', showCheck);
  $('didStartBtn').addEventListener('click', finishSuccess);
  $('notYetBtn').addEventListener('click', retrySmaller);
  $('againBtn').addEventListener('click', reset);
  $('resetBtn').addEventListener('click', reset);

  document.addEventListener('visibilitychange', () => {
    if (!$('launchScreen').classList.contains('active')) return;
    if (document.hidden) {
      state.hasLeft = true; state.leftAt = Date.now();
      return;
    }
    if (state.hasLeft && state.leftAt && Date.now() - state.leftAt >= 1800) showCheck();
  });
  window.addEventListener('pageshow', () => {
    if ($('launchScreen').classList.contains('active') && state.hasLeft && state.leftAt && Date.now() - state.leftAt >= 1800) showCheck();
  });

  renderCauses(); renderStats();
  const pending = loadPending();
  if (pending) {
    state.task = pending.task; state.cause = causes.find((cause) => cause.id === pending.cause) || null;
    state.microAction = pending.action; state.launchedAt = Number(pending.launchedAt || Date.now()); state.hasLeft = true;
    $('checkTask').textContent = state.microAction;
    setScreen('checkScreen');
  }
})();
