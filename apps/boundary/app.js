(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const screens = $$('.screen');
  const storageKey = 'boundary-switch-v1';
  const todayKey = () => new Date().toISOString().slice(0, 10);

  const state = {
    mode: null,
    startedAt: 0,
    intent: '',
    residuals: [],
    sortIndex: 0,
    placed: [],
    distractionsLeft: 0,
  };

  const defaultStats = { onCount: 0, offCount: 0, onBest: null, offBest: null, days: {} };
  const getStats = () => {
    try { return { ...defaultStats, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; }
    catch { return { ...defaultStats }; }
  };
  const saveStats = (stats) => localStorage.setItem(storageKey, JSON.stringify(stats));

  function show(name) {
    screens.forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    window.scrollTo(0, 0);
  }

  function tapFeedback(strong = false) {
    if (navigator.vibrate) navigator.vibrate(strong ? 18 : 8);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = strong ? 180 : 360;
      gain.gain.setValueAtTime(strong ? .05 : .025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .06);
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + .065);
    } catch {}
  }

  function whoosh(mode) {
    if (navigator.vibrate) navigator.vibrate([25, 30, 55]);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(mode === 'on' ? 160 : 260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(mode === 'on' ? 720 : 90, ctx.currentTime + .28);
      gain.gain.setValueAtTime(.055, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + .33);
    } catch {}
  }

  function begin(mode) {
    state.mode = mode;
    state.startedAt = performance.now();
    state.intent = '';
    state.residuals = [];
    state.placed = [];
    state.sortIndex = 0;
    $('#intentInput').value = '';
    $('#intentNext').disabled = true;
    $('#residualInput').value = '';
    $('#residualList').innerHTML = '';
    if (mode === 'on') show('on-intent');
    else show('off-capture');
    tapFeedback();
  }

  $('#startOn').addEventListener('click', () => begin('on'));
  $('#startOff').addEventListener('click', () => begin('off'));
  $('#homeBtn').addEventListener('click', () => { show('home'); updateHome(); });
  $('#statsBtn').addEventListener('click', () => { renderStats(); show('stats'); });
  $$('[data-back]').forEach(btn => btn.addEventListener('click', () => show(btn.dataset.back)));

  $('#intentInput').addEventListener('input', e => {
    state.intent = e.target.value.trim();
    $('#intentNext').disabled = !state.intent;
  });
  $('#intentInput').addEventListener('keydown', e => { if (e.key === 'Enter' && state.intent) $('#intentNext').click(); });
  $$('#intentChips button').forEach(btn => btn.addEventListener('click', () => {
    $('#intentInput').value = btn.dataset.intent;
    state.intent = btn.dataset.intent;
    $('#intentNext').disabled = false;
    tapFeedback();
  }));
  $('#intentNext').addEventListener('click', () => {
    if (!state.intent) return;
    $('#focusIntent').textContent = state.intent;
    setupDistractions();
    show('on-clear');
    tapFeedback(true);
  });

  const distractionPool = ['通知', 'SNS', '別件', '昨日の失敗', 'メール', 'あとで調べたいこと', 'ニュース', '他人の反応'];
  function setupDistractions() {
    const field = $('#distractionField');
    field.innerHTML = '';
    const items = distractionPool.slice(0, 6);
    state.distractionsLeft = items.length;
    $('#clearMeter').style.width = '0%';
    $('#clearHint').textContent = 'カードをタップして外へ';
    const coords = [[9,12],[52,10],[18,36],[58,40],[8,66],[49,68]];
    items.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'distraction'; b.textContent = text;
      b.style.left = coords[i][0] + '%'; b.style.top = coords[i][1] + '%';
      b.addEventListener('click', () => dismissDistraction(b));
      field.appendChild(b);
    });
  }
  function dismissDistraction(el) {
    if (el.classList.contains('dismissed')) return;
    const dx = (Math.random() > .5 ? 1 : -1) * (180 + Math.random() * 90);
    const dy = -60 + Math.random() * 170;
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    el.style.setProperty('--rot', (-35 + Math.random() * 70) + 'deg');
    el.classList.add('dismissed');
    state.distractionsLeft--;
    const done = distractionPool.slice(0, 6).length - state.distractionsLeft;
    $('#clearMeter').style.width = `${(done / 6) * 100}%`;
    tapFeedback();
    if (state.distractionsLeft === 0) {
      $('#clearHint').textContent = '残ったのは、1つだけ。';
      setTimeout(() => setupCross('on'), 430);
    }
  }

  function addResidual() {
    const input = $('#residualInput');
    const value = input.value.trim();
    if (!value) return;
    state.residuals.push(value);
    input.value = '';
    renderResiduals();
    tapFeedback();
  }
  $('#addResidual').addEventListener('click', addResidual);
  $('#residualInput').addEventListener('keydown', e => { if (e.key === 'Enter') addResidual(); });
  function renderResiduals() {
    const list = $('#residualList'); list.innerHTML = '';
    state.residuals.forEach((text, i) => {
      const row = document.createElement('div'); row.className = 'residual-item';
      row.innerHTML = `<span></span><button type="button" aria-label="削除">×</button>`;
      row.querySelector('span').textContent = text;
      row.querySelector('button').addEventListener('click', () => { state.residuals.splice(i,1); renderResiduals(); });
      list.appendChild(row);
    });
  }
  $('#nothingResidual').addEventListener('click', () => { state.residuals = []; setupCross('off'); });
  $('#captureNext').addEventListener('click', () => {
    if ($('#residualInput').value.trim()) addResidual();
    if (state.residuals.length === 0) return setupCross('off');
    state.sortIndex = 0; state.placed = [];
    renderSort(); show('off-sort'); tapFeedback(true);
  });
  function renderSort() {
    const total = state.residuals.length;
    const i = state.sortIndex;
    if (i >= total) return setTimeout(() => setupCross('off'), 250);
    $('#sortProgress').textContent = `${i+1} / ${total}`;
    $('#sortText').textContent = state.residuals[i];
    $('#placedSummary').textContent = state.placed.map(x => `${x.text} → ${x.bucket}`).join('　');
  }
  $$('.sort-grid button').forEach(btn => btn.addEventListener('click', () => {
    const text = state.residuals[state.sortIndex];
    state.placed.push({ text, bucket: btn.dataset.bucket });
    state.sortIndex++;
    tapFeedback(); renderSort();
  }));

  let crossMode = 'on';
  let dragging = false; let startX = 0; let currentX = 0;
  function setupCross(mode) {
    crossMode = mode;
    state.mode = mode;
    const knob = $('#sliderKnob');
    knob.classList.toggle('off-mode', mode === 'off');
    knob.style.setProperty('--x', '0px');
    $('#knobArrow').textContent = mode === 'on' ? '→' : '←';
    $('#crossStep').textContent = `${mode.toUpperCase()} · 3 / 3`;
    $('#crossTiny').textContent = mode === 'on' ? 'READY' : 'DONE FOR TODAY';
    $('#crossTitle').textContent = '境界線を越える';
    $('#crossSub').textContent = mode === 'on' ? state.intent : (state.placed.length ? `${state.placed.length}件、頭の外へ置いた。` : 'もう持って帰る仕事はない。');
    $('#swipeHint').textContent = mode === 'on' ? '右へスワイプ' : '左へスワイプ';
    show('cross');
  }

  function maxTravel() {
    const stage = $('#boundaryStage').getBoundingClientRect();
    const knob = $('#sliderKnob').getBoundingClientRect();
    return Math.max(0, stage.width - knob.width - 36);
  }
  function setKnob(delta) {
    const max = maxTravel();
    currentX = crossMode === 'on' ? Math.max(0, Math.min(max, delta)) : Math.min(0, Math.max(-max, delta));
    $('#sliderKnob').style.setProperty('--x', currentX + 'px');
  }
  $('#sliderKnob').addEventListener('pointerdown', e => {
    dragging = true; startX = e.clientX; currentX = 0; e.currentTarget.setPointerCapture(e.pointerId); tapFeedback();
  });
  $('#sliderKnob').addEventListener('pointermove', e => { if (dragging) setKnob(e.clientX - startX); });
  function finishDrag() {
    if (!dragging) return;
    dragging = false;
    const max = maxTravel();
    if (Math.abs(currentX) >= max * .72) completeSwitch();
    else { $('#sliderKnob').style.setProperty('--x', '0px'); currentX = 0; }
  }
  $('#sliderKnob').addEventListener('pointerup', finishDrag);
  $('#sliderKnob').addEventListener('pointercancel', finishDrag);
  // Pointer capture can be inconsistent in embedded/standalone mobile browsers;
  // window-level release keeps the swipe completion reliable.
  window.addEventListener('pointerup', finishDrag);
  $('#sliderKnob').addEventListener('keydown', e => {
    if ((crossMode === 'on' && e.key === 'ArrowRight') || (crossMode === 'off' && e.key === 'ArrowLeft') || e.key === 'Enter') completeSwitch();
  });
  $('#crossCancel').addEventListener('click', () => show(crossMode === 'on' ? 'on-intent' : 'off-capture'));

  function completeSwitch() {
    const elapsed = Math.max(.1, (performance.now() - state.startedAt) / 1000);
    const stats = getStats();
    const countKey = state.mode === 'on' ? 'onCount' : 'offCount';
    const bestKey = state.mode === 'on' ? 'onBest' : 'offBest';
    stats[countKey] = (stats[countKey] || 0) + 1;
    stats[bestKey] = stats[bestKey] == null ? elapsed : Math.min(stats[bestKey], elapsed);
    stats.days = stats.days || {};
    stats.days[todayKey()] = (stats.days[todayKey()] || 0) + 1;
    saveStats(stats);
    whoosh(state.mode);
    document.body.classList.add(state.mode === 'on' ? 'flash-on' : 'flash-off');
    setTimeout(() => document.body.classList.remove('flash-on','flash-off'), 600);
    renderResult(elapsed, stats);
    setTimeout(() => show('result'), 130);
  }

  function rankFor(time) {
    if (time <= 8) return '反射級 · もう身体が知っている';
    if (time <= 20) return '高速切替 · 迷いが少ない';
    if (time <= 45) return '安定切替 · いい境界線';
    return '意識切替 · ここから速くなる';
  }
  function renderResult(elapsed) {
    const off = state.mode === 'off';
    $('#screen-result').classList.toggle('off', off);
    $('#resultEyebrow').textContent = off ? 'CLOSED' : 'SWITCHED';
    $('#resultTitle').textContent = off ? 'OFF' : 'ON';
    $('#resultMain').textContent = off ? '今日の仕事は、ここまで。' : state.intent;
    $('#resultTime').textContent = `${elapsed.toFixed(1)}秒`;
    $('#resultRank').textContent = rankFor(elapsed);
    $('#finishCopy').textContent = off ? 'この先は、休む時間。' : 'このまま作業へ。';
  }
  $('#finishBtn').addEventListener('click', () => { updateHome(); show('home'); });

  function classFor(stats) {
    const total = (stats.onCount || 0) + (stats.offCount || 0);
    if (total >= 100) return ['境界線の達人','切り替えを、考える前に始められる。'];
    if (total >= 50) return ['スイッチマスター','ONとOFFの両方を自分で選べる。'];
    if (total >= 20) return ['境界線ランナー','切り替えが習慣になってきた。'];
    if (total >= 7) return ['スイッチ練習生','境界線を越える回数が積み上がっている。'];
    return ['境界線ビギナー','まずは切り替えを「意識してやる」ところから。'];
  }
  function renderStats() {
    const s = getStats();
    $('#statOnCount').textContent = s.onCount || 0;
    $('#statOffCount').textContent = s.offCount || 0;
    $('#statOnBest').textContent = s.onBest == null ? '—' : s.onBest.toFixed(1);
    $('#statOffBest').textContent = s.offBest == null ? '—' : s.offBest.toFixed(1);
    const [name, copy] = classFor(s); $('#currentClass').textContent = name; $('#classCopy').textContent = copy;
  }
  $('#resetStats').addEventListener('click', () => {
    if (!confirm('切替の記録をすべてリセットしますか？')) return;
    localStorage.removeItem(storageKey); renderStats(); updateHome();
  });
  function updateHome() {
    const s = getStats();
    const today = (s.days || {})[todayKey()] || 0;
    $('#todayCount').textContent = `${today} SWITCH${today === 1 ? '' : 'ES'}`;
    const total = (s.onCount || 0) + (s.offCount || 0);
    $('#bestSummary').textContent = total ? `累計 ${total}回 · ON ${s.onCount || 0} / OFF ${s.offCount || 0}` : 'まず1回、境界線を越える';
  }

  // Allow a click on the knob to nudge, but never auto-complete accidentally.
  $('#sliderKnob').addEventListener('click', () => { if (!dragging) tapFeedback(); });
  updateHome();
})();
