(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const dots = [...document.querySelectorAll('#stepDots i')];
  const root = document.documentElement;

  const emotions = [
    { id:'anger', label:'怒り', sub:'腹が立つ / 許せない', symbol:'●', tone:'#ff806b' },
    { id:'hurt', label:'傷ついた', sub:'否定された / 悲しい', symbol:'◇', tone:'#8fb7ff' },
    { id:'anxiety', label:'不安', sub:'どうなるか怖い', symbol:'≈', tone:'#ad9cff' },
    { id:'frustration', label:'悔しい', sub:'納得できない / 負けた', symbol:'▲', tone:'#ffb766' },
    { id:'disgust', label:'気持ち悪い', sub:'嫌悪 / 居心地が悪い', symbol:'×', tone:'#7be0a8' },
    { id:'shame', label:'恥ずかしい', sub:'消えたい / 見られた', symbol:'□', tone:'#ff9cc8' },
    { id:'tired', label:'疲れた', sub:'もう考えたくない', symbol:'−', tone:'#9ba7a1' },
    { id:'unknown', label:'わからない', sub:'言葉にできない', symbol:'?', tone:'#d8ff5b' },
  ];

  const state = {
    before: 7,
    after: 5,
    emotion: null,
    sound: true,
    breathTimer: null,
    breathCycle: 0,
    drag: null,
    thrown: false,
  };

  const STORAGE_KEY = 'levelup.nukeru.v1';
  let audioContext = null;

  function loadHistory(){
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions.slice(-60) : [],
        sound: parsed.sound !== false,
      };
    } catch { return { sessions: [], sound: true }; }
  }

  let history = loadHistory();
  state.sound = history.sound;

  function saveHistory(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }

  function vibrate(pattern=8){
    try { navigator.vibrate?.(pattern); } catch {}
  }

  function ensureAudio(){
    if (!state.sound) return null;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    } catch { return null; }
  }

  function tone(freq=440, duration=.08, gain=.028){
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    vol.gain.setValueAtTime(gain, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
    osc.connect(vol); vol.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
  }

  function setIntensity(value){
    const normalized = Math.max(0, Math.min(1, value / 10));
    root.style.setProperty('--intensity', String(normalized));
    root.style.setProperty('--fog-opacity', String(0.25 + normalized * 0.55));
  }

  function updateRange(input, output, key){
    const v = Number(input.value);
    state[key] = v; output.textContent = v; setIntensity(v);
  }

  function setScreen(id){
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    const active = $(id);
    const step = Number(active?.dataset.step ?? 0);
    dots.forEach((dot, i) => dot.classList.toggle('active', i === Math.min(step, 4)));
    window.scrollTo({top:0, behavior:'auto'});
    try { window.LevelUpTelemetry?.step?.(id.replace(/Screen$/, '')); } catch {}
  }

  function renderEmotions(){
    $('emotionGrid').innerHTML = emotions.map(e => `
      <button class="emotion-btn" type="button" data-emotion="${e.id}" style="--tone:${e.tone}">
        <span class="symbol">${e.symbol}</span><b>${e.label}</b><span>${e.sub}</span>
      </button>`).join('');
    $('emotionGrid').addEventListener('click', e => {
      const btn = e.target.closest('[data-emotion]');
      if (!btn) return;
      chooseEmotion(btn.dataset.emotion);
    });
  }

  function chooseEmotion(id){
    state.emotion = emotions.find(e => e.id === id) || null;
    $('blobLabel').textContent = state.emotion ? state.emotion.label : 'この嫌さ';
    tone(480,.06); vibrate(10);
    beginBreathing();
  }

  function clearBreathing(){
    clearTimeout(state.breathTimer); state.breathTimer = null;
  }

  function beginBreathing(){
    setScreen('breatheScreen');
    clearBreathing();
    state.breathCycle = 0;
    [...document.querySelectorAll('#cycleDots i')].forEach(i => i.classList.remove('done'));
    $('breathRing').className = 'breath-ring';
    $('breathPhase').textContent = '準備'; $('breathCount').textContent = '3';
    state.breathTimer = setTimeout(() => runPhase('inhale', 3), 700);
  }

  function runPhase(type, seconds){
    const ring = $('breathRing');
    ring.classList.remove('inhale','exhale');
    ring.classList.add(type);
    const label = type === 'inhale' ? 'ゆっくり吸う' : '長めに吐く';
    $('breathPhase').textContent = label;
    tone(type === 'inhale' ? 330 : 245, .1, .018);
    let remaining = seconds;
    $('breathCount').textContent = remaining;
    const tick = () => {
      if (--remaining > 0) {
        $('breathCount').textContent = remaining;
        state.breathTimer = setTimeout(tick, 1000);
      } else if (type === 'inhale') {
        runPhase('exhale', 5);
      } else {
        document.querySelectorAll('#cycleDots i')[state.breathCycle]?.classList.add('done');
        state.breathCycle += 1;
        setIntensity(Math.max(1, state.before - state.breathCycle * .7));
        if (state.breathCycle >= 3) {
          $('breathPhase').textContent = 'そのままで'; $('breathCount').textContent = '✓';
          tone(520,.16,.022); vibrate([8,35,8]);
          state.breathTimer = setTimeout(beginThrow, 650);
        } else {
          state.breathTimer = setTimeout(() => runPhase('inhale', 3), 450);
        }
      }
    };
    state.breathTimer = setTimeout(tick, 1000);
  }

  function beginThrow(){
    clearBreathing(); setScreen('throwScreen');
    state.thrown = false; state.drag = null;
    const blob = $('moodBlob');
    blob.classList.remove('thrown'); blob.style.transform = ''; blob.style.opacity = '1';
    blob.style.setProperty('--throw-x','0px'); blob.style.setProperty('--throw-x2','0px'); blob.style.setProperty('--throw-r','10deg');
    $('throwHint').textContent = '↑ 上へスワイプ';
  }

  function finishThrow(dx=-10){
    if (state.thrown) return;
    state.thrown = true;
    const blob = $('moodBlob');
    blob.style.transform = '';
    const throwX = Math.max(-90, Math.min(90, dx));
    blob.style.setProperty('--throw-x', `${throwX}px`);
    blob.style.setProperty('--throw-x2', `${throwX * 1.7}px`);
    blob.style.setProperty('--throw-r', `${Math.max(-24,Math.min(24,dx/4))}deg`);
    blob.classList.add('thrown');
    $('throwHint').textContent = '距離ができた。';
    $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on');
    tone(620,.15,.03); setTimeout(()=>tone(820,.2,.018),90); vibrate([10,28,15]);
    setTimeout(() => {
      $('afterRange').value = String(state.before);
      updateRange($('afterRange'), $('afterValue'), 'after');
      setScreen('afterScreen');
    }, 820);
  }

  function pointerDown(e){
    if (state.thrown) return;
    const p = e.touches ? e.touches[0] : e;
    state.drag = {x:p.clientX,y:p.clientY,dx:0,dy:0};
    $('moodBlob').setPointerCapture?.(e.pointerId);
  }
  function pointerMove(e){
    if (!state.drag || state.thrown) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - state.drag.x;
    const dy = Math.min(55, p.clientY - state.drag.y);
    state.drag.dx = dx; state.drag.dy = dy;
    $('moodBlob').style.transform = `translate3d(${dx*.65}px,${dy}px,0) rotate(${dx*.035}deg) scale(${Math.max(.88,1+dy/900)})`;
    if (dy < -35) $('throwHint').textContent = 'そのまま上へ ↑';
  }
  function pointerUp(){
    if (!state.drag || state.thrown) return;
    const {dx,dy} = state.drag; state.drag = null;
    if (dy < -80) finishThrow(dx);
    else { $('moodBlob').style.transform=''; $('throwHint').textContent='↑ 上へスワイプ'; }
  }

  function showResult(){
    const drop = state.before - state.after;
    const positiveDrop = Math.max(0, drop);
    $('dropValue').textContent = positiveDrop;
    $('dropUnit').textContent = drop > 0 ? 'ぬけた。' : drop === 0 ? 'そのまま。' : '今は上がった。';
    $('beforeAfter').innerHTML = `<span>BEFORE <b>${state.before}</b></span><i>→</i><span>NOW <b>${state.after}</b></span>`;
    if (drop >= 4) $('resultCopy').innerHTML = 'かなり距離ができた。<br>今は、戻れた感覚だけ持って終わる。';
    else if (drop > 0) $('resultCopy').innerHTML = '解決してなくてもいい。<br>少し距離ができれば、今日はそれで十分。';
    else if (drop === 0) $('resultCopy').innerHTML = '変わらない日もある。<br>「今ここまで」と確認できたところで終わっていい。';
    else $('resultCopy').innerHTML = '今は下げるより、離れる・休む方がよさそう。<br>このアプリで無理に変えなくていい。';

    const entry = {t:Date.now(), before:state.before, after:state.after, drop, emotion:state.emotion?.id || null};
    history.sessions.push(entry); history.sessions = history.sessions.slice(-60); saveHistory();
    setIntensity(state.after); setScreen('resultScreen');
    try { window.LevelUpTelemetry?.complete?.('result'); } catch {}
    tone(drop > 0 ? 660 : 380,.16,.025);
  }

  function renderHistory(){
    const sessions = history.sessions;
    if (!sessions.length) { $('localStats').hidden = true; return; }
    const changes = sessions.map(s => Number(s.drop) || 0);
    const average = changes.reduce((a,b)=>a+b,0) / changes.length;
    const amount = Math.abs(average).toFixed(1).replace('.0','');
    $('playCount').textContent = sessions.length;
    $('averageDrop').textContent = average > 0 ? `${amount}↓` : average < 0 ? `${amount}↑` : '0';
    $('localStats').hidden = false;
  }

  function reset(){
    clearBreathing(); state.emotion=null; state.thrown=false; state.drag=null;
    $('beforeRange').value='7'; updateRange($('beforeRange'), $('beforeValue'), 'before');
    $('afterRange').value='5'; $('afterValue').textContent='5'; state.after=5;
    renderHistory(); setScreen('startScreen');
  }

  $('beforeRange').addEventListener('input', () => updateRange($('beforeRange'), $('beforeValue'), 'before'));
  $('afterRange').addEventListener('input', () => updateRange($('afterRange'), $('afterValue'), 'after'));
  $('startBtn').addEventListener('click', () => { ensureAudio(); tone(420,.06); vibrate(8); setScreen('emotionScreen'); });
  $('emotionSkipBtn').addEventListener('click', () => { state.emotion=null; $('blobLabel').textContent='この嫌さ'; beginBreathing(); });
  $('breatheSkipBtn').addEventListener('click', beginThrow);
  $('throwFallbackBtn').addEventListener('click', () => finishThrow(0));
  $('finishBtn').addEventListener('click', showResult);
  $('againBtn').addEventListener('click', reset);
  $('soundBtn').addEventListener('click', () => {
    state.sound = !state.sound; history.sound = state.sound; saveHistory();
    $('soundBtn').setAttribute('aria-pressed', String(state.sound));
    $('soundBtn').setAttribute('aria-label', state.sound ? '音をオフにする' : '音をオンにする');
    $('soundBtn').textContent = state.sound ? '♪' : '×';
    if (state.sound) tone(520,.06);
  });

  const blob = $('moodBlob');
  blob.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', pointerMove, {passive:true});
  window.addEventListener('pointerup', pointerUp, {passive:true});
  blob.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishThrow(0); } });

  document.addEventListener('visibilitychange', () => { if (document.hidden && $('breatheScreen').classList.contains('active')) clearBreathing(); });

  renderEmotions(); renderHistory();
  $('soundBtn').setAttribute('aria-pressed', String(state.sound));
  $('soundBtn').textContent = state.sound ? '♪' : '×';
  setIntensity(state.before);
})();
