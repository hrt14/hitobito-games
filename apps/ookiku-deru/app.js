(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const dots = [...document.querySelectorAll('#stepDots i')];
  const STORAGE_KEY = 'levelup.ookiku-deru.v1';

  const causes = [
    { id:'meiwaku', label:'迷惑になる気がする', sub:'相手の負担を先に想像してる', symbol:'△', tone:'#ffb454' },
    { id:'kowai', label:'断られるのが怖い', sub:'NOをもらう前に自分で下げてる', symbol:'!', tone:'#ff7a4d' },
    { id:'migara', label:'身の丈じゃない気がする', sub:'まだ早いと自分で判定してる', symbol:'?', tone:'#ffce5c' },
    { id:'medatsu', label:'目立ちたくない', sub:'周りの反応が気になる', symbol:'↑', tone:'#ff9f6a' },
    { id:'hazukashii', label:'失敗したら恥ずかしい', sub:'結果より反応を先に考えてる', symbol:'×', tone:'#ff6b5e' },
    { id:'mendou', label:'面倒な人と思われたくない', sub:'条件を主張しづらい', symbol:'−', tone:'#ffa73d' },
  ];

  const prescriptions = {
    meiwaku: {
      badge:'ASK REAL',
      lead:'相手の負担を先に計算して削るのをやめ、本当に欲しい条件をそのまま書きます。断れる余地は相手に残していい。',
      action:(small)=>`${small.replace(/。$/, '')}ではなく、本当はどこまで欲しいかを先に書く。相手が断れる余地は残していい。`,
    },
    kowai: {
      badge:'ASK HIGH',
      lead:'断られる前提で最初から下げるのをやめ、通ったら儲けものの水準で聞きます。NOは情報であって、否定ではない。',
      action:(small)=>`${small.replace(/。$/, '')}を、最高でどこまで通ればラッキーかの水準に書き換える。ダメなら次でいい。`,
    },
    migara: {
      badge:'SIZE = GOAL',
      lead:'「自分にはまだ早い」を判定材料にせず、実現したいことそのものの大きさで決めます。資格はあとからついてくる。',
      action:(small)=>`${small.replace(/。$/, '')}を、自分の実力ではなく本当に実現したいことの大きさで書き換える。`,
    },
    medatsu: {
      badge:'RESULT FIRST',
      lead:'目立つことを避けて縮めるのをやめ、周りにどう見えるかより結果を優先します。',
      action:(small)=>`${small.replace(/。$/, '')}を、周りの反応を一旦外して、一番効果が大きい形に書き換える。`,
    },
    hazukashii: {
      badge:'UPSIDE FIRST',
      lead:'失敗したときの恥ずかしさを先取りして削るのをやめ、うまくいった場合のリターンを基準にします。',
      action:(small)=>`${small.replace(/。$/, '')}を、うまくいった場合に一番大きい結果になる書き方に変える。`,
    },
    mendou: {
      badge:'KEEP TERMS',
      lead:'「面倒な人」と思われる不安で条件を削るのをやめ、必要な条件はそのまま伝えます。丁寧さは言い方で足りる。',
      action:(small)=>`${small.replace(/。$/, '')}の条件を削らず、言い方だけ丁寧に整えて出す。`,
    },
  };

  const state = { small:'', cause:null, bigAction:'', today:'', launchedAt:0, leftAt:0, hasLeft:false, countdownTimer:null, returnTimer:null, rescueOptions:[] };

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
        small:state.small, cause:state.cause?.id || null, big:state.bigAction, today:state.today, launchedAt:state.launchedAt || Date.now(),
      }));
    } catch {}
  }

  function clearPending(){
    try { localStorage.removeItem(`${STORAGE_KEY}.pending`); } catch {}
  }

  function loadPending(){
    try {
      const pending = JSON.parse(localStorage.getItem(`${STORAGE_KEY}.pending`) || 'null');
      if (!pending?.small || !pending?.big || Date.now() - Number(pending.launchedAt || 0) > 2 * 60 * 60 * 1000) { clearPending(); return null; }
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

  function cleanText(value){ return String(value || '').trim().replace(/\s+/g, ' '); }

  function renderCauses(){
    $('causeGrid').innerHTML = causes.map((cause) => `
      <button class="cause-btn" type="button" data-cause="${cause.id}" style="--tone:${cause.tone}">
        <span class="symbol">${cause.symbol}</span>
        <div><b>${cause.label}</b><span>${cause.sub}</span></div>
      </button>`).join('');
  }

  function updatePrepareEnabled(){
    $('prepareBtn').disabled = cleanText($('bigAction').value).length < 1 || cleanText($('todayInput').value).length < 1;
  }

  function selectCause(id){
    state.cause = causes.find((cause) => cause.id === id) || causes[0];
    const prescription = prescriptions[state.cause.id];
    state.bigAction = prescription.action(state.small);
    $('smallPreview').textContent = state.small;
    $('prescriptionLead').textContent = prescription.lead;
    $('causeBadge').textContent = prescription.badge;
    $('bigAction').value = state.bigAction;
    $('todayInput').value = '';
    updatePrepareEnabled();
    vibrate(10);
    setScreen('expandScreen');
  }

  function shrinkHalfStep(){
    const small = state.small;
    const big = state.bigAction || small;
    const options = [
      `${small.replace(/。$/, '')}に、一番言いたかった条件を1つだけ足して出す。`,
      `${small.replace(/。$/, '')}はそのまま出しつつ、大きい版は「次はこうしたい」と一言だけ添える。`,
      `大きい版「${big}」のうち、今回は削らず言える範囲だけ残して出す。`,
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
    state.bigAction = cleanText($('bigAction').value) || state.bigAction;
    state.today = cleanText($('todayInput').value) || state.today;
    $('launchAction').textContent = state.today || state.bigAction;
    $('checkTask').textContent = state.today || state.bigAction;
    $('goBtn').hidden = true;
    $('alreadyStartedBtn').hidden = true;
    $('launchNote').textContent = 'この画面を閉じて、実際に送る・言う・出す相手や画面を開いてください。戻ってきたら出せたか記録します。';
    $('launchTitle').innerHTML = '大きいまま、<br>出す。';
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
    $('launchNote').textContent = 'ここから先はアプリの外。大きい版のまま、実際に送る・言う・出してください。';
    $('launchTitle').innerHTML = 'ここを閉じて、<br>大きいまま出す。';
    vibrate(12);
    state.returnTimer = setTimeout(() => { $('alreadyStartedBtn').hidden = false; }, 4000);
  }

  function showCheck(){
    clearLaunchTimers();
    setScreen('checkScreen');
  }

  function record(stayedBig){
    const entry = {
      t:Date.now(), small:state.small, cause:state.cause?.id || null,
      big:state.bigAction, today:state.today, stayedBig:Boolean(stayedBig), leftApp:Boolean(state.hasLeft),
      delayMs:state.launchedAt ? Math.max(0, Date.now() - state.launchedAt) : null,
    };
    history.sessions.push(entry); history.sessions = history.sessions.slice(-80); saveHistory();
    return entry;
  }

  function finishSuccess(){
    clearPending();
    record(true);
    $('resultSmall').textContent = state.small;
    $('resultBig').textContent = state.bigAction;
    renderStats();
    const stats = getStats();
    $('resultSessions').textContent = stats.total;
    $('resultRate').textContent = `${stats.rate}%`;
    setScreen('resultScreen');
    vibrate([12,30,12]);
    try { window.LevelUpTelemetry?.complete?.('stayed-big'); } catch {}
  }

  function retryHalfStep(){
    clearPending();
    record(false);
    shrinkHalfStep();
  }

  function getStats(){
    const sessions = history.sessions;
    const total = sessions.length;
    const stayedBig = sessions.filter((item) => item.stayedBig).length;
    const rate = total ? Math.round(stayedBig / total * 100) : 0;
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
    $('bigRate').textContent = `${stats.rate}%`;
    $('topCause').textContent = stats.top;
    $('localStats').hidden = false;
  }

  function reset(){
    clearLaunchTimers(); clearPending();
    state.small=''; state.cause=null; state.bigAction=''; state.today=''; state.launchedAt=0; state.leftAt=0; state.hasLeft=false; state.rescueOptions=[];
    $('smallInput').value=''; $('startBtn').disabled=true;
    renderStats(); setScreen('startScreen');
  }

  $('smallInput').addEventListener('input', () => {
    state.small = cleanText($('smallInput').value);
    $('startBtn').disabled = state.small.length < 1;
  });
  $('smallInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !$('startBtn').disabled) { event.preventDefault(); $('startBtn').click(); }
  });
  $('startBtn').addEventListener('click', () => {
    state.small = cleanText($('smallInput').value);
    if (state.small.length < 1) return;
    setScreen('causeScreen'); vibrate(8);
  });
  $('causeGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-cause]'); if (button) selectCause(button.dataset.cause);
  });
  $('bigAction').addEventListener('input', () => { state.bigAction = cleanText($('bigAction').value); updatePrepareEnabled(); });
  $('todayInput').addEventListener('input', () => { state.today = cleanText($('todayInput').value); updatePrepareEnabled(); });
  $('prepareBtn').addEventListener('click', () => { if (!$('prepareBtn').disabled) beginLaunch(); });
  $('rescueGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-rescue]'); if (!button) return;
    state.bigAction = state.rescueOptions[Number(button.dataset.rescue)] || state.bigAction;
    state.today = state.today || state.bigAction;
    beginLaunch();
  });
  $('backActionBtn').addEventListener('click', () => setScreen('expandScreen'));
  $('goBtn').addEventListener('click', markGo);
  $('alreadyStartedBtn').addEventListener('click', showCheck);
  $('didStayBigBtn').addEventListener('click', finishSuccess);
  $('shrunkBackBtn').addEventListener('click', retryHalfStep);
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
    state.small = pending.small; state.cause = causes.find((cause) => cause.id === pending.cause) || null;
    state.bigAction = pending.big; state.today = pending.today || ''; state.launchedAt = Number(pending.launchedAt || Date.now()); state.hasLeft = true;
    $('checkTask').textContent = state.today || state.bigAction;
    setScreen('checkScreen');
  }
})();
