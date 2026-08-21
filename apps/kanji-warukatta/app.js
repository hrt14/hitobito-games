(() => {
  'use strict';

  const STORAGE_KEY = 'levelup_kanji_warukatta_v1';
  const state = {
    before: 6,
    after: 6,
    fact: '',
    careMode: 'none',
    action: '',
    fearRemaining: 3,
  };

  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const beforeRange = $('beforeRange');
  const beforeValue = $('beforeValue');
  const afterRange = $('afterRange');
  const afterValue = $('afterValue');
  const factInput = $('factInput');
  const factCount = $('factCount');
  const factNextButton = $('factNextButton');
  const factPreview = $('factPreview');
  const repairPanel = $('repairPanel');
  const repairInput = $('repairInput');
  const keepAction = $('keepAction');
  const resultCopy = $('resultCopy');
  const resultDelta = $('resultDelta');
  const fearCounter = $('fearCounter');
  const holdProgress = $('holdProgress');
  const closedSummary = $('closedSummary');
  const sessionCount = $('sessionCount');
  const toast = $('toast');

  let holdTimer = null;
  let holdStartedAt = 0;
  let holdFrame = null;
  let toastTimer = null;

  function readStats() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        completed: Number.isFinite(parsed.completed) ? parsed.completed : 0,
        totalDelta: Number.isFinite(parsed.totalDelta) ? parsed.totalDelta : 0,
      };
    } catch {
      return { completed: 0, totalDelta: 0 };
    }
  }

  function saveStats(delta) {
    const stats = readStats();
    const next = {
      completed: stats.completed + 1,
      totalDelta: stats.totalDelta + delta,
      lastCompletedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    renderStats(next);
  }

  function renderStats(stats = readStats()) {
    sessionCount.textContent = `${stats.completed} END`;
  }

  function showScreen(name) {
    screens.forEach((screen) => screen.classList.toggle('is-active', screen.dataset.screen === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function vibrate(pattern = 10) {
    try { navigator.vibrate?.(pattern); } catch {}
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1600);
  }

  function syncFactButton() {
    state.fact = factInput.value.trim();
    factCount.textContent = `${factInput.value.length} / 100`;
    factNextButton.disabled = state.fact.length === 0;
  }

  function goCare() {
    state.fact = factInput.value.trim() || '具体的な出来事は思い当たらない';
    factPreview.textContent = state.fact;
    showScreen('care');
  }

  function chooseCare(mode) {
    state.careMode = mode;
    document.querySelectorAll('[data-care]').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.care === mode);
    });

    if (mode === 'repair') {
      repairPanel.hidden = false;
      repairInput.value = '';
      repairInput.focus({ preventScroll: true });
      return;
    }

    repairPanel.hidden = true;
    state.action = mode === 'next' ? '次回は、同じ場面で少しだけ言い方・伝え方を整える' : '';
    setTimeout(() => showScreen('fear'), 170);
  }

  function finishFearCard(card) {
    if (card.classList.contains('is-gone')) return;
    card.classList.add('is-gone');
    state.fearRemaining = Math.max(0, state.fearRemaining - 1);
    vibrate(8);

    if (state.fearRemaining > 0) {
      fearCounter.textContent = `${state.fearRemaining}個、未確定の想像が残っています`;
    } else {
      fearCounter.textContent = '未確定の想像を、いったん全部外しました';
      setTimeout(renderResult, 420);
    }
  }

  function renderResult() {
    if (state.action) {
      keepAction.textContent = state.action;
      resultCopy.textContent = '気遣いとして必要なことは、1個だけ残しました。';
    } else {
      keepAction.textContent = '今やることは、なし';
      resultCopy.textContent = '具体的な修正がないなら、これ以上の反省は増やしません。';
    }

    // 効果を演出しない。AfterはBeforeと同値から始め、本人の実感だけで動かす。
    state.after = state.before;
    afterRange.value = String(state.after);
    afterValue.textContent = String(state.after);
    updateDelta();
    showScreen('result');
  }

  function updateDelta() {
    state.after = Number(afterRange.value);
    afterValue.textContent = String(state.after);
    const delta = state.before - state.after;
    if (delta > 0) resultDelta.textContent = `頭の占有度 −${delta}`;
    else if (delta === 0) resultDelta.textContent = '変わらなくてもOK。やることの判定は終わっています。';
    else resultDelta.textContent = 'まだ重いなら、今は結論を増やさず休止でOK。';
  }

  function holdTick() {
    const elapsed = performance.now() - holdStartedAt;
    const ratio = Math.min(1, elapsed / 800);
    holdProgress.style.width = `${ratio * 100}%`;
    if (ratio >= 1) {
      completeSession();
      return;
    }
    holdFrame = requestAnimationFrame(holdTick);
  }

  function beginHold(event) {
    if (event.type === 'pointerdown' && event.button !== 0) return;
    cancelHold();
    holdStartedAt = performance.now();
    holdTimer = setTimeout(() => {}, 800);
    holdFrame = requestAnimationFrame(holdTick);
  }

  function cancelHold() {
    if (holdTimer) clearTimeout(holdTimer);
    if (holdFrame) cancelAnimationFrame(holdFrame);
    holdTimer = null;
    holdFrame = null;
    holdProgress.style.width = '0%';
  }

  function completeSession() {
    cancelHold();
    const delta = state.before - state.after;
    saveStats(delta);
    vibrate([18, 40, 18]);
    closedSummary.innerHTML = state.action
      ? `残した行動：<b>${escapeHtml(state.action)}</b><br>それ以外の「どう思われたか」は追加情報が来るまで保留。`
      : '具体的に直すことは見つかりませんでした。<br>「どう思われたか」は追加情報が来るまで保留。';
    showScreen('closed');
    try {
      window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete', { detail: { slug: 'kanji-warukatta', delta } }));
      window.LevelUpTelemetry?.action?.(`real-kanji-effect-${delta > 0 ? 'lighter' : delta === 0 ? 'same' : 'heavier'}`);
      window.LevelUpTelemetry?.complete?.('real-kanji');
    } catch {}
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function resetSession() {
    state.before = 6;
    state.after = 6;
    state.fact = '';
    state.careMode = 'none';
    state.action = '';
    state.fearRemaining = 3;
    beforeRange.value = '6';
    beforeValue.textContent = '6';
    afterRange.value = '6';
    afterValue.textContent = '6';
    factInput.value = '';
    syncFactButton();
    repairInput.value = '';
    repairPanel.hidden = true;
    document.querySelectorAll('[data-care]').forEach((button) => button.classList.remove('is-selected'));
    document.querySelectorAll('.fear-card').forEach((card) => card.classList.remove('is-gone'));
    fearCounter.textContent = '3個、未確定の想像が残っています';
    showScreen('start');
  }

  beforeRange.addEventListener('input', () => {
    state.before = Number(beforeRange.value);
    beforeValue.textContent = String(state.before);
  });
  afterRange.addEventListener('input', updateDelta);
  $('startButton').addEventListener('click', () => {
    state.before = Number(beforeRange.value);
    vibrate(8);
    showScreen('fact');
    setTimeout(() => factInput.focus({ preventScroll: true }), 180);
  });

  factInput.addEventListener('input', syncFactButton);
  factNextButton.addEventListener('click', goCare);
  $('noFactButton').addEventListener('click', () => {
    factInput.value = '具体的な出来事は思い当たらない';
    syncFactButton();
    goCare();
  });
  document.querySelectorAll('[data-fact]').forEach((button) => {
    button.addEventListener('click', () => {
      factInput.value = button.dataset.fact;
      syncFactButton();
      showToast('事実だけ入れました');
    });
  });

  document.querySelectorAll('[data-care]').forEach((button) => {
    button.addEventListener('click', () => chooseCare(button.dataset.care));
  });
  document.querySelectorAll('[data-repair]').forEach((button) => {
    button.addEventListener('click', () => {
      repairInput.value = button.dataset.repair;
      showToast('1個だけ残します');
    });
  });
  $('repairNextButton').addEventListener('click', () => {
    state.action = repairInput.value.trim() || '必要なら、一言だけ補足・謝る';
    showScreen('fear');
  });

  document.querySelectorAll('.fear-card').forEach((card) => {
    card.addEventListener('click', () => finishFearCard(card));
  });

  const endButton = $('endButton');
  endButton.addEventListener('pointerdown', beginHold);
  endButton.addEventListener('pointerup', cancelHold);
  endButton.addEventListener('pointerleave', cancelHold);
  endButton.addEventListener('pointercancel', cancelHold);
  endButton.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !holdFrame) beginHold(event);
  });
  endButton.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' || event.key === ' ') cancelHold();
  });
  $('againButton').addEventListener('click', resetSession);

  renderStats();
  syncFactButton();
})();
