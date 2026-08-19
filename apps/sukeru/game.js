(() => {
  'use strict';

  const app = document.getElementById('app');
  const video = document.getElementById('camera');
  const canvas = document.getElementById('scratch');
  const veil = document.getElementById('veil');
  const startButton = document.getElementById('start');
  const resetButton = document.getElementById('reset');
  const retryButton = document.getElementById('retry');
  const percent = document.getElementById('percent');
  const rubHint = document.getElementById('rubHint');
  const done = document.getElementById('done');
  const errorPanel = document.getElementById('errorPanel');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const hud = document.getElementById('hud');

  if (!app || !video || !canvas || !startButton || !retryButton) return;

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const state = {
    stream: null,
    starting: false,
    drawing: false,
    pointerId: null,
    last: null,
    rubDistance: 0,
    goal: 7600,
    progress: 0,
    completed: false,
    hintDismissed: false,
    dpr: 1,
    width: 0,
    height: 0,
    resizeTimer: 0,
    milestone: 0,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const oldProgress = state.progress;
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.goal = clamp((state.width + state.height) * 5.5, 5200, 8200);
    drawCover(oldProgress);
  }

  function drawCover(progress = 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, state.width, state.height);

    const gradient = ctx.createLinearGradient(0, 0, state.width, state.height);
    gradient.addColorStop(0, '#171c25');
    gradient.addColorStop(0.45, '#0d1117');
    gradient.addColorStop(1, '#05070a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    const shine = ctx.createLinearGradient(0, 0, state.width, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.46, 'rgba(255,255,255,0)');
    shine.addColorStop(0.52, 'rgba(255,255,255,0.07)');
    shine.addColorStop(0.60, 'rgba(255,255,255,0)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, state.width, state.height);

    if (progress > 0) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = Math.min(0.28, progress * 0.25);
      ctx.fillRect(0, 0, state.width, state.height);
    }
    ctx.restore();
  }

  function setProgress(value) {
    state.progress = clamp(value, 0, 1);
    const shown = Math.floor(state.progress * 100);
    if (percent) percent.textContent = `${shown}%`;
    if (veil) veil.style.opacity = String(clamp(0.28 - state.progress * 0.25, 0.03, 0.28));

    const milestone = Math.floor(shown / 25);
    if (milestone > state.milestone && milestone > 0 && shown < 100) {
      state.milestone = milestone;
      if (navigator.vibrate) navigator.vibrate(12);
    }

    if (state.progress >= 1 && !state.completed) finish();
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function scratchSegment(from, to, distance) {
    const speed = clamp(distance / 22, 0, 1);
    const width = 72 + speed * 30;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.78;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.globalAlpha = 0.16;
    ctx.lineWidth = width * 1.7;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  function beginRub(event) {
    if (!app.classList.contains('is-live') || state.completed) return;
    state.drawing = true;
    state.pointerId = event.pointerId;
    state.last = pointFromEvent(event);
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function moveRub(event) {
    if (!state.drawing || event.pointerId !== state.pointerId || state.completed || !state.last) return;
    const point = pointFromEvent(event);
    const dx = point.x - state.last.x;
    const dy = point.y - state.last.y;
    const rawDistance = Math.hypot(dx, dy);
    if (rawDistance < 1.5) return;

    const distance = Math.min(rawDistance, 80);
    scratchSegment(state.last, point, distance);
    state.last = point;
    state.rubDistance += distance;

    if (!state.hintDismissed && state.rubDistance > 120) {
      state.hintDismissed = true;
      rubHint?.classList.add('fade');
      window.setTimeout(() => {
        if (rubHint) rubHint.hidden = true;
      }, 320);
    }

    setProgress(state.rubDistance / state.goal);
    event.preventDefault();
  }

  function endRub(event) {
    if (event.pointerId !== state.pointerId) return;
    state.drawing = false;
    state.pointerId = null;
    state.last = null;
    try { canvas.releasePointerCapture?.(event.pointerId); } catch {}
  }

  function finish() {
    state.completed = true;
    state.progress = 1;
    if (percent) percent.textContent = '100%';
    app.classList.add('is-done');
    if (rubHint) rubHint.hidden = true;
    if (done) {
      done.hidden = false;
      window.setTimeout(() => { done.hidden = true; }, 2100);
    }
    if (navigator.vibrate) navigator.vibrate([18, 45, 28]);
  }

  function resetScratch() {
    state.drawing = false;
    state.pointerId = null;
    state.last = null;
    state.rubDistance = 0;
    state.progress = 0;
    state.completed = false;
    state.hintDismissed = false;
    state.milestone = 0;
    app.classList.remove('is-done');
    if (done) done.hidden = true;
    if (percent) percent.textContent = '0%';
    if (veil) veil.style.opacity = '0.28';
    canvas.style.opacity = '1';
    drawCover(0);
    if (rubHint) {
      rubHint.hidden = false;
      rubHint.classList.remove('fade');
    }
  }

  function hideError() {
    if (!errorPanel) return;
    errorPanel.hidden = true;
    errorPanel.style.display = 'none';
    errorPanel.style.pointerEvents = 'none';
    errorPanel.setAttribute('aria-hidden', 'true');
  }

  function showError(error) {
    if (!errorPanel) return;
    const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
    if (errorTitle) errorTitle.textContent = denied ? 'カメラの許可が必要です' : 'カメラを起動できません';
    if (errorMessage) {
      errorMessage.textContent = denied
        ? 'Safariのカメラを「許可」にしてから、下のボタンを押してください。'
        : 'カメラの起動に失敗しました。ページを再読み込みして、もう一度試してください。';
    }
    retryButton.textContent = denied ? '許可したらもう一度' : 'もう一度';
    errorPanel.hidden = false;
    errorPanel.style.removeProperty('display');
    errorPanel.style.removeProperty('pointer-events');
    errorPanel.removeAttribute('aria-hidden');
  }

  function stopCamera() {
    if (!state.stream) return;
    for (const track of state.stream.getTracks()) track.stop();
    state.stream = null;
    video.srcObject = null;
  }

  async function requestRearCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('このブラウザではカメラを起動できません。');
    }
    if (!window.isSecureContext) {
      throw new Error('カメラを使うにはHTTPSが必要です。');
    }

    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' }
      }
    });
  }

  function enterLiveMode() {
    hideError();
    app.classList.remove('is-boot');
    app.classList.add('is-live');
    hud?.setAttribute('aria-hidden', 'false');
    resetScratch();
  }

  async function startCamera() {
    if (state.starting) return;
    state.starting = true;
    startButton.disabled = true;
    const label = startButton.querySelector('span');
    if (label) label.textContent = 'カメラを準備中…';
    hideError();

    try {
      stopCamera();
      state.stream = await requestRearCamera();

      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.srcObject = state.stream;

      // Safari may keep play() pending even after camera capture begins.
      // Never let playback readiness block the scratch UI.
      try {
        const playback = video.play();
        if (playback?.catch) playback.catch(() => {});
      } catch {}

      enterLiveMode();
    } catch (error) {
      showError(error);
    } finally {
      state.starting = false;
      startButton.disabled = false;
      if (label) label.textContent = 'カメラを起動';
    }
  }

  startButton.addEventListener('click', startCamera);
  retryButton.addEventListener('click', startCamera);
  resetButton?.addEventListener('click', resetScratch);
  canvas.addEventListener('pointerdown', beginRub, { passive: false });
  canvas.addEventListener('pointermove', moveRub, { passive: false });
  canvas.addEventListener('pointerup', endRub);
  canvas.addEventListener('pointercancel', endRub);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener('resize', () => {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(setCanvasSize, 120);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.stream && video.paused) {
      try {
        const playback = video.play();
        if (playback?.catch) playback.catch(() => {});
      } catch {}
    }
  });

  window.addEventListener('pagehide', stopCamera);

  setCanvasSize();
  setProgress(0);
})();
