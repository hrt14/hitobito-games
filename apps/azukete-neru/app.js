(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STORE_KEY = 'levelup:azukete-neru';
  const SCREENS = ['startScreen', 'slotScreen', 'captureScreen', 'downshiftScreen', 'afterScreen', 'resultScreen', 'darkScreen'];
  const SLOT_LABELS = { '朝': '明日の朝', '昼': '明日の昼', '夜': '明日の夜', '週末': '週末' };
  const state = { before: 6, after: 6, slot: null, chip: null, parked: [], sound: false, locked: false };
  let downshiftTimer = null;

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function makeId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function tone(freq = 520, duration = .05) {
    if (!state.sound) return;
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      const ctx = tone.ctx || (tone.ctx = new C());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = 'sine';
      g.gain.setValueAtTime(.035, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + duration);
    } catch {}
  }

  function buzz(pattern = 10) {
    try { navigator.vibrate?.(pattern); } catch {}
  }

  function show(id, progress) {
    SCREENS.forEach((s) => $(s).classList.toggle('active', s === id));
    $('progressBar').style.width = `${progress}%`;
    window.scrollTo(0, 0);
  }

  function readStats() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
  }

  function writeStats(stats) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(stats)); } catch {}
  }

  function renderLocalStats() {
    const stats = readStats();
    if (!stats.sessions) return;
    $('localStats').hidden = false;
    $('sessionCount').textContent = stats.sessions;
    const avg = (stats.totalDiff || 0) / stats.sessions;
    const sign = avg > 0 ? '−' : avg < 0 ? '+' : '±';
    $('avgReduction').textContent = `${sign}${Math.abs(avg).toFixed(1)}`;
  }

  function renderRecap() {
    const stats = readStats();
    const todayKey = toDateKey(new Date());
    const overdue = [];
    for (const session of (stats.history || []).slice().reverse()) {
      if (session.date >= todayKey) continue;
      for (const item of session.items) {
        if (item.mode === 'park' && !item.resolved) overdue.push({ ...item, sessionDate: session.date });
        if (overdue.length >= 5) break;
      }
      if (overdue.length >= 5) break;
    }
    if (!overdue.length) { $('recapCard').hidden = true; return; }
    $('recapCard').hidden = false;
    $('recapList').innerHTML = overdue.map((item) => `
      <div class="recap-item" data-id="${escapeHtml(item.id)}" data-label="${escapeHtml(item.label)}">
        <strong>${escapeHtml(item.label)}</strong>
        <div class="recap-btns">
          <button type="button" class="ok" data-action="ok">もう平気</button>
          <button type="button" class="still" data-action="still">まだ気になる</button>
        </div>
      </div>`).join('');
  }

  function markRecapItem(id, action, label) {
    const stats = readStats();
    outer:
    for (const session of stats.history || []) {
      for (const item of session.items) {
        if (item.id === id) { item.resolved = true; break outer; }
      }
    }
    writeStats(stats);
    if (action === 'still') {
      state.parked.push({ id: makeId(), label, mode: 'park', carried: true });
      $('parkedCount').textContent = state.parked.length;
    }
  }

  $('recapList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('.recap-item');
    markRecapItem(row.dataset.id, btn.dataset.action, row.dataset.label);
    row.classList.add('resolved');
    row.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  });

  function updateRange(input, valueEl, key) {
    const el = $(input), out = $(valueEl);
    el.addEventListener('input', () => { state[key] = Number(el.value); out.textContent = el.value; });
  }
  updateRange('beforeRange', 'beforeValue', 'before');
  updateRange('afterRange', 'afterValue', 'after');

  $('startBtn').addEventListener('click', () => {
    state.before = Number($('beforeRange').value);
    show('slotScreen', 15);
    tone(500);
  });

  $('slotGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-slot]');
    if (!btn) return;
    state.slot = btn.dataset.slot;
    $('slotGrid').querySelectorAll('button').forEach((b) => b.classList.toggle('selected', b === btn));
    $('slotContinueBtn').disabled = false;
    tone(520);
  });

  $('slotContinueBtn').addEventListener('click', () => {
    show('captureScreen', 35);
    resetCard();
    $('parkedCount').textContent = state.parked.length;
    tone(560);
  });

  function currentLabel() {
    const text = $('thoughtInput').value.trim();
    return text || state.chip;
  }

  function updateCaptureButtons() {
    const has = !!currentLabel();
    $('nowBtn').disabled = !has;
    $('parkBtn').disabled = !has;
  }

  $('chipGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-chip]');
    if (!btn) return;
    const already = btn.classList.contains('selected');
    $('chipGrid').querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
    state.chip = already ? null : btn.dataset.chip;
    if (!already) btn.classList.add('selected');
    updateCaptureButtons();
  });

  $('thoughtInput').addEventListener('input', updateCaptureButtons);

  function resetCard() {
    $('thoughtInput').value = '';
    state.chip = null;
    $('chipGrid').querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
    updateCaptureButtons();
    const card = $('thoughtCard');
    card.style.transform = '';
    card.style.opacity = '1';
  }

  function capture(mode) {
    if (state.locked) return;
    const label = currentLabel();
    if (!label) return;
    state.locked = true;
    state.parked.push({ id: makeId(), label, mode });
    $('parkedCount').textContent = state.parked.length;
    const card = $('thoughtCard');
    if (mode === 'park') {
      tone(560);
      buzz(10);
      $('feedback').textContent = '預かりました。今夜の担当から外れます。';
    } else {
      tone(480, .06);
      buzz(14);
      $('feedback').textContent = '今すぐの一手として区別しました。';
    }
    const dir = mode === 'park' ? 1 : -1;
    card.style.transform = `translateX(${dir * 120}%) rotate(${dir * 8}deg)`;
    card.style.opacity = '0';
    setTimeout(() => { resetCard(); }, 260);
    setTimeout(() => { state.locked = false; $('feedback').textContent = ''; }, 700);
  }

  $('parkBtn').addEventListener('click', () => capture('park'));
  $('nowBtn').addEventListener('click', () => capture('now'));

  let drag = { active: false, startX: 0, dx: 0 };
  const card = $('thoughtCard');
  card.addEventListener('pointerdown', (e) => {
    if (state.locked || e.target.closest('button, input')) return;
    drag = { active: true, startX: e.clientX, dx: 0 };
    card.setPointerCapture?.(e.pointerId);
  });
  card.addEventListener('pointermove', (e) => {
    if (!drag.active || state.locked) return;
    drag.dx = e.clientX - drag.startX;
    const rot = drag.dx / 18;
    card.style.transform = `translateX(${drag.dx}px) rotate(${rot}deg)`;
    document.querySelector('.swipe-label.left').style.opacity = drag.dx < -35 ? Math.min(1, Math.abs(drag.dx) / 90) : 0;
    document.querySelector('.swipe-label.right').style.opacity = drag.dx > 35 ? Math.min(1, Math.abs(drag.dx) / 90) : 0;
  });
  function endDrag() {
    if (!drag.active) return;
    drag.active = false;
    document.querySelectorAll('.swipe-label').forEach((x) => { x.style.opacity = 0; });
    if (Math.abs(drag.dx) > 70 && currentLabel()) {
      capture(drag.dx > 0 ? 'park' : 'now');
    } else {
      card.style.transform = '';
    }
  }
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') capture('park');
    if (e.key === 'ArrowLeft') capture('now');
  });

  function goDownshift() {
    const parkCount = state.parked.filter((i) => i.mode === 'park').length;
    $('downshiftTitle').innerHTML = `今夜の担当は、<br>${parkCount}件になった。`;
    const slotPhrase = SLOT_LABELS[state.slot] || '明日';
    $('downshiftSlot').textContent = `${slotPhrase}、また会いましょう。`;
    show('downshiftScreen', 70);
    tone(500, .08);
    clearTimeout(downshiftTimer);
    downshiftTimer = setTimeout(() => goAfter(), 24000);
  }

  $('doneCaptureBtn').addEventListener('click', goDownshift);

  function goAfter() {
    clearTimeout(downshiftTimer);
    $('afterRange').value = state.before;
    $('afterValue').textContent = state.before;
    state.after = state.before;
    show('afterScreen', 85);
  }

  $('downshiftDoneBtn').addEventListener('click', goAfter);

  function finish() {
    state.after = Number($('afterRange').value);
    const parkItems = state.parked.filter((i) => i.mode === 'park').map((i) => ({ id: i.id, label: i.label, mode: 'park', resolved: false }));
    const nowItems = state.parked.filter((i) => i.mode === 'now').map((i) => ({ id: i.id, label: i.label, mode: 'now', resolved: true }));
    const stats = readStats();
    stats.sessions = (stats.sessions || 0) + 1;
    stats.totalDiff = (stats.totalDiff || 0) + (state.before - state.after);
    stats.history = stats.history || [];
    stats.history.push({ date: toDateKey(new Date()), slot: state.slot, items: [...parkItems, ...nowItems] });
    if (stats.history.length > 14) stats.history = stats.history.slice(-14);
    writeStats(stats);

    $('parkedResult').textContent = `${parkItems.length}件`;
    $('slotResult').textContent = SLOT_LABELS[state.slot] || '-';
    $('beforeResult').textContent = state.before;
    $('afterResult').textContent = state.after;
    show('resultScreen', 100);
    tone(640, .09);
    buzz([10, 30, 20]);
  }

  $('finishBtn').addEventListener('click', finish);

  $('lightsOutBtn').addEventListener('click', () => {
    document.body.classList.add('lights-out');
    show('darkScreen', 100);
    tone(300, .12);
  });

  $('soundBtn').addEventListener('click', () => {
    state.sound = !state.sound;
    $('soundBtn').setAttribute('aria-pressed', String(state.sound));
    $('soundBtn').setAttribute('aria-label', state.sound ? '音をオフにする' : '音をオンにする');
    $('soundBtn').textContent = state.sound ? '♪' : '×';
  });

  renderRecap();
  renderLocalStats();
  updateCaptureButtons();
  show('startScreen', 0);
})();
