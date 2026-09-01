(() => {
  const STORAGE_KEY = 'levelup-yesterday-self-v1';
  const DRAFT_KEY = 'levelup-yesterday-self-draft-v1';

  const PRESETS = {
    start: {
      text: '昨日より5分早く、大事なことを始める',
      nudge: '対象のファイル・画面を開くだけ。開始時刻を1回動かす。',
    },
    focus: {
      text: '昨日より5分長く、一つだけに集中する',
      nudge: '通知を伏せて、まず2分だけその一つを続ける。',
    },
    reply: {
      text: '昨日より1件多く、止めていた返信を返す',
      nudge: '一番短く返せる1件を開き、一文だけ送る。',
    },
    sleep: {
      text: '昨日より5分早く、布団へ向かう準備を始める',
      nudge: 'スマホを充電場所へ置く、または歯みがきだけ始める。',
    },
    move: {
      text: '昨日止まった場所から、一手だけ進める',
      nudge: '完成させない。次に必要な一手だけを30秒やる。',
    },
  };

  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const opponentInput = $('opponentInput');
  const opponentCard = $('opponentCard');
  const opponentName = $('opponentName');
  const dismissStage = $('dismissStage');
  const swipeGuide = $('swipeGuide');
  const customWrap = $('customWrap');
  const customWin = $('customWin');
  const selectedWin = $('selectedWin');
  const selectedWinText = $('selectedWinText');
  const startMatchBtn = $('startMatchBtn');
  const missionText = $('missionText');
  const nudgeCard = $('nudgeCard');
  const nudgeText = $('nudgeText');
  const resultMission = $('resultMission');
  const shareStatus = $('shareStatus');
  const toast = $('toast');

  let selectedId = '';
  let selectedText = '';
  let currentScreen = 'reset';
  let toastTimer = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerCurrentX = 0;
  let dragging = false;
  let dismissed = false;

  function todayKey(offset = 0) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseJson(value, fallback) {
    try {
      return JSON.parse(value) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadRecords() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = parseJson(raw, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.date === 'string' && typeof item.text === 'string' && typeof item.createdAt === 'number');
  }

  function saveRecords(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-120)));
    } catch {
      showToast('この端末では記録を保存できません');
    }
  }

  function saveDraft() {
    if (!selectedId || !selectedText) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ id: selectedId, text: selectedText, phase: currentScreen }));
    } catch {
      // Draft persistence is optional; the app still works without storage.
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  function vibrate(pattern = 10) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function showScreen(name, { push = false } = {}) {
    currentScreen = name;
    screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (push) history.pushState({ screen: name }, '', `#${name}`);
    updateHeaderState();
  }

  function updateHeaderState() {
    $('recordBtn').hidden = currentScreen === 'record';
  }

  function countStreak(records = loadRecords()) {
    const days = new Set(records.map((record) => record.date));
    let cursor = 0;
    let streak = 0;
    while (days.has(todayKey(-cursor))) {
      streak += 1;
      cursor += 1;
    }
    return streak;
  }

  function recordsForDate(date, records = loadRecords()) {
    return records.filter((record) => record.date === date);
  }

  function updateMiniStats() {
    const records = loadRecords();
    const wins = recordsForDate(todayKey(), records).length;
    $('todayMini').hidden = wins === 0;
    $('todayMiniWins').textContent = `${wins}勝`;
  }

  function updateYesterdayWin() {
    const records = loadRecords();
    const yesterday = recordsForDate(todayKey(-1), records).slice(-1)[0];
    $('lastWin').hidden = !yesterday;
    $('lastWinText').textContent = yesterday ? yesterday.text : '';
  }

  function resetOpponentCard() {
    dismissed = false;
    dragging = false;
    pointerStartX = 0;
    pointerStartY = 0;
    pointerCurrentX = 0;
    opponentCard.classList.remove('dragging', 'dismiss-left', 'dismiss-right');
    opponentCard.style.transform = '';
    opponentCard.style.opacity = '';
    swipeGuide.style.opacity = '';
  }

  function completeDismiss(direction = 1) {
    if (dismissed) return;
    dismissed = true;
    dragging = false;
    opponentCard.classList.remove('dragging');
    opponentCard.style.transform = '';
    opponentCard.style.opacity = '';
    opponentCard.classList.add(direction < 0 ? 'dismiss-left' : 'dismiss-right');
    swipeGuide.style.opacity = '0';
    vibrate([18, 26, 24]);
    setTimeout(() => {
      resetOpponentCard();
      showScreen('enemy', { push: true });
      updateYesterdayWin();
    }, 260);
  }

  function dragMove(clientX, clientY) {
    if (!dragging) return;
    const dx = clientX - pointerStartX;
    const dy = clientY - pointerStartY;
    pointerCurrentX = dx;
    if (Math.abs(dy) > Math.abs(dx) * 1.4) return;
    const rotate = Math.max(-10, Math.min(10, dx / 18));
    const fade = Math.max(.38, 1 - Math.abs(dx) / 420);
    opponentCard.style.transform = `translate3d(${dx}px,0,0) rotate(${rotate}deg)`;
    opponentCard.style.opacity = String(fade);
    swipeGuide.style.opacity = String(Math.max(.15, 1 - Math.abs(dx) / 120));
  }

  function finishDrag() {
    if (!dragging) return;
    dragging = false;
    opponentCard.classList.remove('dragging');
    if (Math.abs(pointerCurrentX) >= 82) {
      completeDismiss(pointerCurrentX < 0 ? -1 : 1);
      return;
    }
    opponentCard.style.transform = '';
    opponentCard.style.opacity = '';
    swipeGuide.style.opacity = '';
  }

  opponentInput.addEventListener('input', () => {
    opponentName.textContent = opponentInput.value.trim() || '他人';
  });

  opponentCard.addEventListener('pointerdown', (event) => {
    if (dismissed) return;
    dragging = true;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerCurrentX = 0;
    opponentCard.classList.add('dragging');
    opponentCard.setPointerCapture?.(event.pointerId);
  });
  opponentCard.addEventListener('pointermove', (event) => dragMove(event.clientX, event.clientY));
  opponentCard.addEventListener('pointerup', finishDrag);
  opponentCard.addEventListener('pointercancel', finishDrag);
  opponentCard.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') completeDismiss(-1);
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      completeDismiss(1);
    }
  });
  $('dismissFallbackBtn').addEventListener('click', () => completeDismiss(1));

  $('chooseWinBtn').addEventListener('click', () => {
    showScreen('choose', { push: true });
  });

  document.querySelectorAll('.win-option').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.win-option').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      selectedId = button.dataset.win || '';
      if (selectedId === 'custom') {
        customWrap.hidden = false;
        selectedText = customWin.value.trim();
        customWin.focus();
      } else {
        customWrap.hidden = true;
        selectedText = PRESETS[selectedId]?.text || '';
      }
      selectedWin.hidden = !selectedText;
      selectedWinText.textContent = selectedText;
      startMatchBtn.disabled = !selectedText;
      vibrate(8);
    });
  });

  customWin.addEventListener('input', () => {
    if (selectedId !== 'custom') return;
    selectedText = customWin.value.trim();
    selectedWin.hidden = !selectedText;
    selectedWinText.textContent = selectedText;
    startMatchBtn.disabled = !selectedText;
  });

  function startMatch() {
    if (!selectedText) return;
    missionText.textContent = selectedText;
    nudgeText.textContent = selectedId === 'custom'
      ? 'その1勝を30秒で始められる形にさらに小さくして、最初の動作だけやる。'
      : PRESETS[selectedId]?.nudge || '最初の一手だけやる。';
    nudgeCard.hidden = true;
    $('todayScore').textContent = '?';
    $('todayScoreLabel').textContent = 'あと1勝';
    showScreen('duel', { push: true });
    saveDraft();
    vibrate(12);
  }

  startMatchBtn.addEventListener('click', startMatch);
  $('notYetBtn').addEventListener('click', () => {
    nudgeCard.hidden = false;
    nudgeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    vibrate(10);
  });
  $('changeWinBtn').addEventListener('click', () => {
    clearDraft();
    showScreen('choose', { push: true });
  });
  $('chooseBackBtn').addEventListener('click', () => showScreen('enemy', { push: true }));

  function recordWin() {
    if (!selectedText) return;
    const records = loadRecords();
    records.push({
      date: todayKey(),
      id: selectedId || 'custom',
      text: selectedText,
      createdAt: Date.now(),
    });
    saveRecords(records);
    clearDraft();
    resultMission.textContent = selectedText;
    $('todayScore').textContent = '1';
    $('todayScoreLabel').textContent = 'WIN';
    vibrate([25, 35, 75]);
    setTimeout(() => {
      renderResult();
      showScreen('result', { push: true });
    }, 180);
  }

  $('winBtn').addEventListener('click', recordWin);

  function renderResult() {
    const records = loadRecords();
    const todayWins = recordsForDate(todayKey(), records).length;
    $('todayWins').textContent = `${todayWins}勝`;
    $('streakDays').textContent = `${countStreak(records)}日`;
    $('totalWins').textContent = `${records.length}勝`;
    renderBars(records);
    updateMiniStats();
  }

  function renderBars(records) {
    const container = $('dayBars');
    container.innerHTML = '';
    for (let offset = -6; offset <= 0; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const key = todayKey(offset);
      const count = recordsForDate(key, records).length;
      const day = document.createElement('div');
      day.className = `day-bar${count > 0 ? ' active' : ''}`;
      const bar = document.createElement('i');
      bar.style.height = `${Math.max(7, Math.min(64, count * 15))}px`;
      bar.title = `${key}: ${count}勝`;
      const label = document.createElement('span');
      label.textContent = offset === 0 ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`;
      day.append(bar, label);
      container.append(day);
    }
  }

  async function shareResult() {
    const records = loadRecords();
    const todayWins = recordsForDate(todayKey(), records).length;
    const text = `昨日の自分に1勝。\n今日の勝利条件：${selectedText}\n今日 ${todayWins}勝 / 連続 ${countStreak(records)}日\n#LEVELUP`;
    shareStatus.textContent = '';
    try {
      if (navigator.share) {
        await navigator.share({ title: '昨日の自分に1勝', text });
        shareStatus.textContent = '共有しました';
        return;
      }
      await navigator.clipboard.writeText(text);
      shareStatus.textContent = '結果をコピーしました';
    } catch (error) {
      if (error?.name !== 'AbortError') shareStatus.textContent = '共有できませんでした';
    }
  }

  $('shareBtn').addEventListener('click', shareResult);
  $('resetAgainBtn').addEventListener('click', () => {
    opponentInput.value = '';
    opponentName.textContent = '他人';
    selectedId = '';
    selectedText = '';
    customWin.value = '';
    customWrap.hidden = true;
    selectedWin.hidden = true;
    startMatchBtn.disabled = true;
    document.querySelectorAll('.win-option').forEach((item) => item.classList.remove('selected'));
    resetOpponentCard();
    showScreen('reset', { push: true });
  });

  function renderRecord() {
    const records = loadRecords();
    $('recordTotal').textContent = String(records.length);
    $('recordStreak').textContent = String(countStreak(records));
    const list = $('recordList');
    list.innerHTML = '';
    if (records.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'record-empty';
      empty.textContent = 'まだ戦績はありません。\n最初の相手は、昨日の自分。';
      empty.style.whiteSpace = 'pre-line';
      list.append(empty);
      return;
    }
    records.slice(-12).reverse().forEach((record) => {
      const item = document.createElement('div');
      item.className = 'record-item';
      const score = document.createElement('b');
      score.textContent = '1–0';
      const copy = document.createElement('div');
      const time = document.createElement('time');
      time.dateTime = new Date(record.createdAt).toISOString();
      time.textContent = record.date;
      const text = document.createElement('strong');
      text.textContent = record.text;
      copy.append(time, text);
      item.append(score, copy);
      list.append(item);
    });
  }

  $('recordBtn').addEventListener('click', () => {
    renderRecord();
    showScreen('record', { push: true });
  });
  $('recordResetBtn').addEventListener('click', () => {
    resetOpponentCard();
    showScreen('reset', { push: true });
  });
  $('recordBackBtn').addEventListener('click', () => history.back());

  function restoreDraft() {
    const draft = parseJson(localStorage.getItem(DRAFT_KEY), null);
    if (!draft || !draft.text || !draft.id) return false;
    selectedId = draft.id;
    selectedText = draft.text;
    if (selectedId === 'custom') customWin.value = selectedText;
    missionText.textContent = selectedText;
    nudgeText.textContent = selectedId === 'custom'
      ? 'その1勝を30秒で始められる形にさらに小さくして、最初の動作だけやる。'
      : PRESETS[selectedId]?.nudge || '最初の一手だけやる。';
    if (draft.phase === 'duel') {
      showScreen('duel');
      return true;
    }
    return false;
  }

  window.addEventListener('popstate', (event) => {
    const target = event.state?.screen || 'reset';
    if (screens.some((screen) => screen.dataset.screen === target)) showScreen(target);
    else showScreen('reset');
  });

  window.addEventListener('beforeunload', () => {
    if (currentScreen === 'duel' && selectedText) saveDraft();
  });

  updateMiniStats();
  updateYesterdayWin();
  renderRecord();
  if (!restoreDraft()) {
    history.replaceState({ screen: 'reset' }, '', '#reset');
    showScreen('reset');
  } else {
    history.replaceState({ screen: 'duel' }, '', '#duel');
  }
})();
