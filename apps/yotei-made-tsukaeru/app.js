(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const screens = ['setupScreen', 'reclaimScreen', 'focusScreen', 'doneScreen'];
  const storageKey = 'levelup:yotei-made-tsukaeru:v1';

  const state = {
    eventAt: null,
    safeStopAt: null,
    usableMinutes: 0,
    bufferMinutes: 30,
    selectedMinutes: 25,
    task: '',
    timerId: null,
    timerStartedAt: null,
    timerSeconds: 0,
    timerTotalSeconds: 0,
  };

  const durationOptions = [
    { minutes: 5, label: '5分', note: '超小さく' },
    { minutes: 15, label: '15分', note: '一区切り' },
    { minutes: 25, label: '25分', note: '集中1本' },
    { minutes: 45, label: '45分', note: 'まとまって' },
  ];

  const eventTime = $('eventTime');
  const bufferRange = $('bufferRange');
  const bufferOutput = $('bufferOutput');
  const calculateBtn = $('calculateBtn');
  const setupError = $('setupError');
  const resetBtn = $('resetBtn');
  const usableNumber = $('usableNumber');
  const safeStopText = $('safeStopText');
  const timelineFree = $('timelineFree');
  const timelineBuffer = $('timelineBuffer');
  const timelineNow = $('timelineNow');
  const timelineStop = $('timelineStop');
  const timelineEvent = $('timelineEvent');
  const durationGrid = $('durationGrid');
  const taskInput = $('taskInput');
  const startBtn = $('startBtn');
  const backBtn = $('backBtn');
  const focusTask = $('focusTask');
  const focusClock = $('focusClock');
  const focusSafety = $('focusSafety');
  const progressBar = $('progressBar');
  const completeBtn = $('completeBtn');
  const stopBtn = $('stopBtn');
  const doneCopy = $('doneCopy');
  const todayCount = $('todayCount');
  const totalCount = $('totalCount');
  const againBtn = $('againBtn');
  const finishBtn = $('finishBtn');
  const toast = $('toast');

  function showScreen(id) {
    screens.forEach((screenId) => $(screenId).classList.toggle('is-active', screenId === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function formatClock(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatDuration(minutes) {
    const rounded = Math.max(0, Math.floor(minutes));
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    if (hours === 0) return `${mins}分`;
    return `${hours}時間${pad(mins)}分`;
  }

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseNextEvent(value) {
    if (!/^\d{2}:\d{2}$/.test(value)) return null;
    const [hours, minutes] = value.split(':').map(Number);
    if (hours > 23 || minutes > 59) return null;
    const now = new Date();
    const event = new Date(now);
    event.setHours(hours, minutes, 0, 0);
    if (event <= now) event.setDate(event.getDate() + 1);
    return event;
  }

  function setDefaultEventTime() {
    if (eventTime.value) return;
    const target = new Date(Date.now() + 3 * 60 * 60 * 1000);
    target.setMinutes(Math.ceil(target.getMinutes() / 5) * 5, 0, 0);
    eventTime.value = formatClock(target);
  }

  function calculateUsable() {
    setupError.textContent = '';
    const event = parseNextEvent(eventTime.value);
    if (!event) {
      setupError.textContent = '予定の時刻を入れてください。';
      return;
    }

    const bufferMinutes = Number(bufferRange.value);
    const safeStopAt = new Date(event.getTime() - bufferMinutes * 60 * 1000);
    const usableMinutes = Math.floor((safeStopAt.getTime() - Date.now()) / 60000);

    if (usableMinutes < 5) {
      setupError.textContent = bufferMinutes
        ? '準備・移動を引くと、使える時間が5分未満です。準備時間か予定時刻を見直してください。'
        : '予定まで5分未満です。今回は予定の準備に切り替えましょう。';
      return;
    }

    state.eventAt = event;
    state.safeStopAt = safeStopAt;
    state.usableMinutes = usableMinutes;
    state.bufferMinutes = bufferMinutes;
    state.selectedMinutes = pickDefaultDuration(usableMinutes);

    renderReclaim();
    showScreen('reclaimScreen');
  }

  function pickDefaultDuration(usableMinutes) {
    const available = durationOptions.filter((option) => option.minutes <= usableMinutes);
    if (!available.length) return 5;
    return available.reduce((pick, option) => option.minutes <= 25 ? option.minutes : pick, available[0].minutes);
  }

  function renderReclaim() {
    const now = new Date();
    const totalMinutes = Math.max(1, Math.floor((state.eventAt - now) / 60000));
    const freeShare = Math.max(8, Math.min(96, (state.usableMinutes / totalMinutes) * 100));
    const bufferShare = Math.max(4, 100 - freeShare);

    usableNumber.textContent = formatDuration(state.usableMinutes);
    const dayLabel = state.eventAt.getDate() !== now.getDate() ? '明日の' : '';
    safeStopText.textContent = `${dayLabel}${formatClock(state.safeStopAt)}に止めれば大丈夫。そこまでは、予定の時間ではありません。`;

    timelineFree.style.flexBasis = `${freeShare}%`;
    timelineBuffer.style.flexBasis = `${bufferShare}%`;
    timelineNow.textContent = formatClock(now);
    timelineStop.textContent = `終了線 ${formatClock(state.safeStopAt)}`;
    timelineEvent.textContent = `予定 ${formatClock(state.eventAt)}`;

    renderDurations();
    updateStartState();
  }

  function renderDurations() {
    durationGrid.innerHTML = '';
    durationOptions.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'duration-btn';
      button.disabled = option.minutes > state.usableMinutes;
      button.classList.toggle('is-selected', option.minutes === state.selectedMinutes && !button.disabled);
      button.innerHTML = `${option.label}<small>${option.note}</small>`;
      button.addEventListener('click', () => {
        state.selectedMinutes = option.minutes;
        renderDurations();
        updateStartState();
      });
      durationGrid.appendChild(button);
    });
  }

  function updateStartState() {
    state.task = taskInput.value.trim();
    const validDuration = state.selectedMinutes > 0 && state.selectedMinutes <= state.usableMinutes;
    startBtn.disabled = !state.task || !validDuration;
  }

  function startFocus() {
    updateStartState();
    if (startBtn.disabled) return;

    const now = Date.now();
    const requestedSeconds = state.selectedMinutes * 60;
    const safeSeconds = Math.max(1, Math.floor((state.safeStopAt.getTime() - now) / 1000));
    state.timerTotalSeconds = Math.min(requestedSeconds, safeSeconds);
    state.timerSeconds = state.timerTotalSeconds;
    state.timerStartedAt = now;

    focusTask.textContent = state.task;
    focusSafety.textContent = `${formatClock(state.safeStopAt)}が終了線。タイマーが終わっても、準備・移動の時間は残ります。`;
    renderTimer();
    showScreen('focusScreen');
    clearInterval(state.timerId);
    state.timerId = window.setInterval(tick, 250);
  }

  function tick() {
    const elapsed = Math.floor((Date.now() - state.timerStartedAt) / 1000);
    state.timerSeconds = Math.max(0, state.timerTotalSeconds - elapsed);
    renderTimer();
    if (state.timerSeconds <= 0) {
      clearInterval(state.timerId);
      state.timerId = null;
      showToast('ここまでで1区切り。予定の準備時間は守れています。');
    }
  }

  function renderTimer() {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    focusClock.textContent = `${pad(mins)}:${pad(secs)}`;
    const done = state.timerTotalSeconds ? (1 - state.timerSeconds / state.timerTotalSeconds) * 100 : 0;
    progressBar.style.width = `${Math.max(0, Math.min(100, done))}%`;
  }

  function finishSession(completed) {
    clearInterval(state.timerId);
    state.timerId = null;

    const elapsedSeconds = state.timerStartedAt
      ? Math.max(1, Math.min(state.timerTotalSeconds, Math.floor((Date.now() - state.timerStartedAt) / 1000)))
      : 0;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const record = saveSession({
      completed,
      task: state.task,
      plannedMinutes: state.selectedMinutes,
      usedMinutes: elapsedMinutes,
      at: new Date().toISOString(),
    });

    doneCopy.textContent = completed
      ? `「${state.task}」を完了。予定までの時間から、${elapsedMinutes}分を自分の時間として使えました。`
      : `「${state.task}」をここで区切りました。途中で止めても、${elapsedMinutes}分はちゃんと自分の時間です。`;
    todayCount.textContent = String(record.todayCompleted);
    totalCount.textContent = String(record.totalCompleted);
    showScreen('doneScreen');
  }

  function loadLog() {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : { sessions: [] };
      if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
      return parsed;
    } catch {
      return { sessions: [] };
    }
  }

  function saveSession(session) {
    const log = loadLog();
    log.sessions.push(session);
    log.sessions = log.sessions.slice(-100);
    try { localStorage.setItem(storageKey, JSON.stringify(log)); } catch {}

    const today = dateKey();
    const completed = log.sessions.filter((item) => item.completed);
    return {
      todayCompleted: completed.filter((item) => dateKey(new Date(item.at)) === today).length,
      totalCompleted: completed.length,
    };
  }

  function resetAll() {
    clearInterval(state.timerId);
    state.timerId = null;
    state.eventAt = null;
    state.safeStopAt = null;
    state.usableMinutes = 0;
    state.task = '';
    taskInput.value = '';
    setupError.textContent = '';
    bufferRange.value = '30';
    bufferOutput.textContent = '30分';
    setDefaultEventTime();
    showScreen('setupScreen');
  }

  function backToReclaim() {
    const remainingMinutes = Math.floor((state.safeStopAt.getTime() - Date.now()) / 60000);
    if (remainingMinutes < 5) {
      showToast('もう準備・移動の時間です。ここからは予定のために使いましょう。');
      showScreen('setupScreen');
      return;
    }

    state.usableMinutes = remainingMinutes;
    state.selectedMinutes = pickDefaultDuration(remainingMinutes);
    state.task = '';
    taskInput.value = '';
    updateStartState();
    renderReclaim();
    showScreen('reclaimScreen');
  }

  let toastTimer = null;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  bufferRange.addEventListener('input', () => {
    bufferOutput.textContent = `${bufferRange.value}分`;
  });
  calculateBtn.addEventListener('click', calculateUsable);
  taskInput.addEventListener('input', updateStartState);
  startBtn.addEventListener('click', startFocus);
  backBtn.addEventListener('click', () => showScreen('setupScreen'));
  completeBtn.addEventListener('click', () => finishSession(true));
  stopBtn.addEventListener('click', () => finishSession(false));
  againBtn.addEventListener('click', backToReclaim);
  finishBtn.addEventListener('click', resetAll);
  resetBtn.addEventListener('click', resetAll);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.timerId) tick();
  });

  setDefaultEventTime();
  bufferOutput.textContent = `${bufferRange.value}分`;
})();
