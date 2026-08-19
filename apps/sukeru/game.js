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
  const errorMessage = document.getElementById('errorMessage');
  const hud = document.getElementById('hud');

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const state = {
    stream: null,
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
    state.goal = clamp((state.width + state.height) * 6.2, 6000, 9400);
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
    shine.addColorStop(0.42, 'rgba(255,255,255,0)');
    shine.addColorStop(0.50, 'rgba(255,255,255,0.055)');
    shine.addColorStop(0.58, 'rgba(255,255,255,0)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.save();
    ctx.translate(state.width * 0.48, state.height * 0.48);
    ctx.rotate(-0.22);
    ctx.translate(-state.width * 0.48, -state.height * 0.48);
    ctx.fillRect(-state.width * 0.2, 0, state.width * 1.4, state.height);
    ctx.restore();

    if (progress > 0) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = Math.min(0.42, progress * 0.38);
      ctx.fillRect(0, 0, state.width, state.height);
    }
    ctx.restore();
  }

  function setProgress(value) {
    state.progress = clamp(value, 0, 1);
    const shown = Math.floor(state.progress * 100);
    percent.textContent = `${shown}%`;
    veil.style.opacity = String(clamp(0.72 - state.progress * 0.66, 0.06, 0.72));

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
    const width = 54 + speed * 26;
    const alpha = 0.12 + speed * 0.08;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.globalAlpha = 0.055;
    ctx.lineWidth = width * 1.75;
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
    if (!state.drawing || event.pointerId !== state.pointerId || state.completed) return;
    const point = pointFromEvent(event);
    const dx = point.x - state.last.x;
    const dy = point.y - state.last.y;
    const rawDistance = Math.hypot(dx, dy);
    if (rawDistance < 1.5) return;

    const distance = Math.min(rawDistance, 72);
    scratchSegment(state.last, point, distance);
    state.last = point;
    state.rubDistance += distance;

    if (!state.hintDismissed && state.rubDistance > 180) {
      state.hintDismissed = true;
      rubHint.classList.add('fade');
      window.setTimeout(() => { rubHint.hidden = true; }, 320);
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
    percent.textContent = '100%';
    app.classList.add('is-done');
    rubHint.hidden = true;
    done.hidden = false;
    if (navigator.vibrate) navigator.vibrate([18, 45, 28]);
    window.setTimeout(() => { done.hidden = true; }, 2100);
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
    done.hidden = true;
    percent.textContent = '0%';
    veil.style.opacity = '0.72';
    canvas.style.opacity = '1';
    drawCover(0);
    rubHint.hidden = false;
    rubHint.classList.remove('fade');
  }

  async function requestRearCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('このブラウザはカメラ表示に対応していません。Safari / Chrome の最新版で開いてください。');
    }
    if (!window.isSecureContext) {
      throw new Error('カメラを使うにはHTTPSで開く必要があります。');
    }

    const preferred = {
      audio: false,
      video: {
        facingMode: { exact: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };

    try {
      return await navigator.mediaDevices.getUserMedia(preferred);
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') throw error;
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
    }
  }

  async function startCamera() {
    startButton.disabled = true;
    startButton.querySelector('span').textContent = 'カメラを準備中…';
    errorPanel.hidden = true;

    try {
      stopCamera();
      state.stream = await requestRearCamera();
      video.srcObject = state.stream;
      await video.play();
      app.classList.remove('is-boot');
      app.classList.add('is-live');
      hud.setAttribute('aria-hidden', 'false');
      resetScratch();
    } catch (error) {
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      errorMessage.textContent = denied
        ? 'ブラウザのカメラ許可をオンにして、もう一度試してください。'
        : (error?.message || '背面カメラを起動できませんでした。別のブラウザでもう一度試してください。');
      errorPanel.hidden = false;
    } finally {
      startButton.disabled = false;
      startButton.querySelector('span').textContent = 'カメラを起動';
    }
  }

  function stopCamera() {
    if (!state.stream) return;
    for (const track of state.stream.getTracks()) track.stop();
    state.stream = null;
    video.srcObject = null;
  }

  startButton.addEventListener('click', startCamera);
  retryButton.addEventListener('click', startCamera);
  resetButton.addEventListener('click', resetScratch);
  canvas.addEventListener('pointerdown', beginRub, { passive: false });
  canvas.addEventListener('pointermove', moveRub, { passive: false });
  canvas.addEventListener('pointerup', endRub);
  canvas.addEventListener('pointercancel', endRub);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener('resize', () => {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(() => setCanvasSize(), 120);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.stream && video.paused) {
      video.play().catch(() => {});
    }
  });

  window.addEventListener('pagehide', stopCamera);

  setCanvasSize();
  setProgress(0);
})();
