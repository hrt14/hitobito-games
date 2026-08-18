(() => {
  'use strict';
  const STORAGE_KEY = 'levelup:sukkiri-note:v1';
  const DAY_KEY = () => new Date().toLocaleDateString('sv-SE');
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  let timerId = null;
  let toastId = null;

  const defaultState = () => ({
    version: 1,
    items: [],
    activeId: null,
    lastScreen: 'capture'
  });

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return defaultState();
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  }

  function saveState(message = '保存しました') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $('saveState').classList.add('saved');
      $('saveState').innerHTML = '<span class="save-dot"></span>端末に保存済み';
      if (message) announce(message, false);
    } catch {
      $('saveState').classList.remove('saved');
      $('saveState').innerHTML = '<span class="save-dot"></span>保存できません';
    }
  }

  function uid() {
    return (crypto?.randomUUID?.() || `t-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }

  function openItems() { return state.items.filter((item) => item.status === 'open'); }
  function closedItems() { return state.items.filter((item) => item.status !== 'open'); }
  function activeItem() { return state.items.find((item) => item.id === state.activeId) || null; }
  function todayClosed() { return closedItems().filter((item) => item.closedDay === DAY_KEY()); }

  function showScreen(name) {
    screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
    state.lastScreen = name;
    if (name !== 'focus') stopTimerTicker();
    window.scrollTo(0, 0);
  }

  function announce(text, visible = true) {
    if (!visible) return;
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastId);
    toastId = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function sanitizeLine(line) {
    return line
      .replace(/^\s*[-*・•□■✓✔︎✅]+\s*/, '')
      .replace(/^\s*\d+[.)、]\s*/, '')
      .trim();
  }

  function parseDump(value) {
    const seen = new Set(state.items.filter(i => i.status === 'open').map(i => i.text.toLowerCase()));
    const result = [];
    value.split(/\r?\n/).map(sanitizeLine).filter(Boolean).forEach((text) => {
      const key = text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(text);
      }
    });
    return result;
  }

  function addTasks(lines) {
    const now = Date.now();
    const startIndex = state.items.length;
    lines.forEach((text, index) => state.items.push({
      id: uid(), text, firstStep: '', status: 'open', createdAt: now + index,
      startedAt: null, accumulatedMs: 0, closedAt: null, closedDay: null
    }));
    state.activeId = null;
    saveState('ノートに置きました');
    renderBoard();
    showScreen('board');
    if (startIndex === 0 && lines.length) announce(`${lines.length}個、頭の外に出しました`);
  }

  function renderCapture() {
    const count = openItems().length;
    $('resumeBtn').classList.toggle('hidden', count === 0);
    $('resumeCount').textContent = `${count}個`;
    updateLineCount();
  }

  function updateLineCount() {
    const count = parseDump($('brainDump').value).length;
    $('lineCount').textContent = count ? `${count}個` : '0個くらい';
  }

  function renderBoard() {
    const open = openItems();
    const closed = [...closedItems()].sort((a,b) => (b.closedAt || 0) - (a.closedAt || 0));
    $('remainingCount').textContent = open.length;
    $('stackCount').textContent = open.length;
    $('doneCount').textContent = closed.length;
    $('pickTopBtn').disabled = open.length === 0;

    const list = $('taskList');
    list.innerHTML = '';
    if (!open.length) {
      list.innerHTML = '<div class="empty-list">いま片づけるものはありません。</div>';
    } else {
      open.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `task-card${item.firstStep ? ' has-step' : ''}`;
        button.dataset.id = item.id;
        button.innerHTML = `
          <span class="task-no">${String(index + 1).padStart(2,'0')}</span>
          <span class="task-copy"><b></b><small></small></span>
          <span class="task-go">→</span>`;
        button.querySelector('b').textContent = item.text;
        button.querySelector('small').textContent = item.firstStep ? `最初：${item.firstStep}` : 'これを一つだけ見る';
        button.addEventListener('click', () => selectItem(item.id));
        list.appendChild(button);
      });
    }

    const doneList = $('doneList');
    doneList.innerHTML = '';
    if (!closed.length) {
      doneList.innerHTML = '<div class="empty-list">片づくと、ここへ移動します。</div>';
    } else {
      closed.slice(0, 30).forEach((item) => {
        const row = document.createElement('div');
        row.className = 'done-item';
        const icon = item.status === 'done' ? '✓' : item.status === 'delegated' ? '↗' : '−';
        const label = item.status === 'done' ? '完了' : item.status === 'delegated' ? '任せた' : 'やらない';
        row.innerHTML = `<span>${icon}</span><s></s><small>${label}</small>`;
        row.querySelector('s').textContent = item.text;
        doneList.appendChild(row);
      });
    }

    if (open.length === 0 && state.items.length) renderEmpty();
  }

  function selectItem(id) {
    const item = state.items.find((x) => x.id === id && x.status === 'open');
    if (!item) return;
    state.activeId = id;
    saveState('');
    renderFocus();
    showScreen('focus');
  }

  function renderFocus() {
    const item = activeItem();
    if (!item || item.status !== 'open') {
      renderBoard();
      showScreen(openItems().length ? 'board' : 'empty');
      return;
    }
    $('focusTitle').textContent = item.text;
    $('firstStepText').textContent = item.firstStep || 'まず、この一つだけ始める。';
    $('firstStepInput').value = item.firstStep || '';
    $('smallerPanel').classList.add('hidden');
    $('smallerToggle').setAttribute('aria-expanded', 'false');
    renderTimer();
    if (isRunning(item)) startTimerTicker();
  }

  function isRunning(item) { return Boolean(item?.startedAt); }
  function elapsedMs(item) {
    return (item?.accumulatedMs || 0) + (item?.startedAt ? Date.now() - item.startedAt : 0);
  }
  function formatTime(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(sec / 60);
    return `${String(min).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}`;
  }
  function formatElapsed(ms) {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${Math.max(1,sec)}秒`;
    const min = Math.floor(sec / 60);
    return `${min}分${sec % 60 ? `${sec % 60}秒` : ''}`;
  }

  function renderTimer() {
    const item = activeItem();
    if (!item) return;
    const running = isRunning(item);
    $('timerBox').classList.toggle('running', running);
    $('timerLabel').textContent = running ? 'この一つだけ作業中' : (elapsedMs(item) ? 'ここまでやった' : 'まだ始めていない');
    $('timerValue').textContent = formatTime(elapsedMs(item));
    $('startTaskBtn').classList.toggle('running', running);
    $('startTaskBtn').querySelector('span').textContent = running ? 'Ⅱ' : '▶';
    $('startTaskBtn').querySelector('b').textContent = running ? 'いったん止める' : (elapsedMs(item) ? '続きを始める' : 'この一つを始める');
  }

  function startTimerTicker() {
    stopTimerTicker();
    timerId = setInterval(renderTimer, 1000);
  }
  function stopTimerTicker() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }
  function toggleRunning() {
    const item = activeItem();
    if (!item) return;
    if (item.startedAt) {
      item.accumulatedMs = elapsedMs(item);
      item.startedAt = null;
      stopTimerTicker();
      announce('いったん止めました');
    } else {
      item.startedAt = Date.now();
      startTimerTicker();
      announce('この一つだけ、開始');
    }
    saveState('');
    renderTimer();
  }

  function saveFirstStep() {
    const item = activeItem();
    if (!item) return;
    const value = $('firstStepInput').value.trim();
    if (!value) {
      announce('最初の一歩を一つだけ書いてください');
      $('firstStepInput').focus();
      return;
    }
    item.firstStep = value;
    saveState('');
    $('firstStepText').textContent = value;
    $('smallerPanel').classList.add('hidden');
    $('smallerToggle').setAttribute('aria-expanded', 'false');
    announce('やることを小さくしました');
  }

  function closeActive(status) {
    const item = activeItem();
    if (!item) return;
    if (item.startedAt) {
      item.accumulatedMs = elapsedMs(item);
      item.startedAt = null;
    }
    item.status = status;
    item.closedAt = Date.now();
    item.closedDay = DAY_KEY();
    const spent = item.accumulatedMs || 0;
    state.activeId = null;
    saveState('');
    stopTimerTicker();
    renderClear(item, status, spent);
    showScreen('clear');
  }

  function renderClear(item, status, spent) {
    const remain = openItems().length;
    const messages = {
      done: ['ONE THING CLOSED', '一つ、<br><em>頭から消えた。</em>', '終わったものは、もう覚えておかなくていい。'],
      delegated: ['ONE THING HANDED OFF', '一つ、<br><em>手から離れた。</em>', '自分で抱えなくても、片づけることはできる。'],
      dropped: ['ONE THING DROPPED', '一つ、<br><em>やらないと決めた。</em>', 'やらないと決めたものも、頭から下ろしていい。']
    };
    const [eyebrow,title,copy] = messages[status] || messages.done;
    $('clearEyebrow').textContent = eyebrow;
    $('clearTitle').innerHTML = title;
    $('clearCopy').textContent = copy;
    $('elapsedStat').textContent = spent ? formatElapsed(spent) : '即決';
    $('remainingStat').textContent = remain;
    $('nextOneLabel').textContent = remain ? '次の一つへ' : 'ノートを見る';
  }

  function renderEmpty() {
    $('todayDoneCount').textContent = todayClosed().length;
  }

  function nextFromClear() {
    if (openItems().length) {
      renderBoard();
      showScreen('board');
    } else {
      renderEmpty();
      showScreen('empty');
    }
  }

  function init() {
    $('brainDump').addEventListener('input', updateLineCount);
    $('sampleBtn').addEventListener('click', () => {
      $('brainDump').value = '今日中に返すメール\n資料の最初の1ページを作る\n経費の入力\n明日の予定を確認';
      updateLineCount();
      $('brainDump').focus();
    });
    $('captureForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const lines = parseDump($('brainDump').value);
      if (!lines.length) {
        announce('まず一つ、頭にあることを書いてください');
        $('brainDump').focus();
        return;
      }
      addTasks(lines);
      $('brainDump').value = '';
      updateLineCount();
    });
    $('resumeBtn').addEventListener('click', () => { renderBoard(); showScreen('board'); });
    $('addMoreBtn').addEventListener('click', () => { renderCapture(); showScreen('capture'); setTimeout(() => $('brainDump').focus(), 50); });
    $('pickTopBtn').addEventListener('click', () => { const first = openItems()[0]; if (first) selectItem(first.id); });
    $('backBoardBtn').addEventListener('click', () => { renderBoard(); showScreen('board'); });
    $('startTaskBtn').addEventListener('click', toggleRunning);
    $('doneTaskBtn').addEventListener('click', () => closeActive('done'));
    $('smallerToggle').addEventListener('click', () => {
      const panel = $('smallerPanel');
      const opening = panel.classList.contains('hidden');
      panel.classList.toggle('hidden');
      $('smallerToggle').setAttribute('aria-expanded', String(opening));
      if (opening) setTimeout(() => $('firstStepInput').focus(), 40);
    });
    $('stepChips').addEventListener('click', (event) => {
      const btn = event.target.closest('[data-step]');
      if (!btn) return;
      $('firstStepInput').value = btn.dataset.step;
      $('firstStepInput').focus();
    });
    $('saveStepBtn').addEventListener('click', saveFirstStep);
    $('firstStepInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); saveFirstStep(); } });
    $('delegateBtn').addEventListener('click', () => closeActive('delegated'));
    $('dropBtn').addEventListener('click', () => closeActive('dropped'));
    $('nextOneBtn').addEventListener('click', nextFromClear);
    $('stayClearBtn').addEventListener('click', () => { renderBoard(); showScreen(openItems().length ? 'board' : 'empty'); });
    $('addAfterClearBtn').addEventListener('click', () => { renderCapture(); showScreen('capture'); setTimeout(() => $('brainDump').focus(), 50); });

    window.addEventListener('pagehide', () => {
      const item = activeItem();
      if (item?.startedAt) {
        item.accumulatedMs = elapsedMs(item);
        item.startedAt = null;
        saveState('');
      }
    });

    renderCapture();
    const open = openItems();
    if (open.length) {
      renderBoard();
      showScreen(state.activeId && activeItem()?.status === 'open' ? 'focus' : 'board');
      if (state.activeId) renderFocus();
    } else if (state.items.length) {
      renderEmpty();
      showScreen('empty');
    } else {
      showScreen('capture');
    }
  }

  init();
})();
