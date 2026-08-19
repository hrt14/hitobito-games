(() => {
  'use strict';

  const app = document.getElementById('app');
  const video = document.getElementById('camera');
  const start = document.getElementById('start');
  const retry = document.getElementById('retry');
  const hud = document.getElementById('hud');
  const rubHint = document.getElementById('rubHint');
  const errorPanel = document.getElementById('errorPanel');
  const errorMessage = document.getElementById('errorMessage');
  if (!app || !video || !start || !retry || !errorPanel) return;

  let stream = null;
  let launching = false;

  function stopStream() {
    if (!stream) return;
    for (const track of stream.getTracks()) track.stop();
    stream = null;
  }

  async function getRearCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('このブラウザではカメラを起動できません。');
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') throw error;
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
    }
  }

  function enterLiveMode() {
    errorPanel.hidden = true;
    errorPanel.setAttribute('aria-hidden', 'true');
    errorPanel.style.display = 'none';
    errorPanel.style.pointerEvents = 'none';

    app.classList.remove('is-boot');
    app.classList.add('is-live');
    hud?.setAttribute('aria-hidden', 'false');
    if (rubHint) rubHint.hidden = false;

    start.disabled = false;
    const label = start.querySelector('span');
    if (label) label.textContent = 'カメラを起動';
  }

  function showError(error) {
    const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
    if (errorMessage) {
      errorMessage.textContent = denied
        ? 'カメラへのアクセスを許可したあと、「許可したらもう一度」を押してください。'
        : 'カメラの起動に失敗しました。もう一度試してください。';
    }
    errorPanel.hidden = false;
    errorPanel.removeAttribute('aria-hidden');
    errorPanel.style.removeProperty('display');
    errorPanel.style.removeProperty('pointer-events');
  }

  async function launchCamera(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    if (launching) return;
    launching = true;

    start.disabled = true;
    const label = start.querySelector('span');
    if (label) label.textContent = 'カメラを準備中…';
    errorPanel.hidden = true;
    errorPanel.style.display = 'none';

    try {
      stopStream();
      stream = await getRearCamera();

      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.srcObject = stream;

      // Do not await play(). Some iOS embedded browsers keep the promise
      // pending even though camera capture has already started.
      const playback = video.play();
      if (playback?.catch) playback.catch(() => {});

      // Once getUserMedia succeeds, let the user into the scratch screen.
      // Frame readiness is checked separately and must never block the UI.
      enterLiveMode();

      window.setTimeout(() => {
        if (!app.classList.contains('is-live')) return;
        if (video.readyState < 2 || video.videoWidth === 0) {
          if (errorMessage) {
            errorMessage.textContent = 'カメラは許可されていますが映像の準備に時間がかかっています。画面を一度タップしてみてください。';
          }
        }
      }, 2500);
    } catch (error) {
      showError(error);
    } finally {
      launching = false;
      if (!app.classList.contains('is-live')) {
        start.disabled = false;
        if (label) label.textContent = 'カメラを起動';
      }
    }
  }

  // Capture phase runs before the older game.js click handlers. This prevents
  // the legacy `await video.play()` path from trapping the screen on iPhone.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('#start, #retry') : null;
    if (!target) return;
    launchCamera(event);
  }, true);

  window.addEventListener('pagehide', stopStream);
})();
