(() => {
  'use strict';

  const app = document.getElementById('app');
  const video = document.getElementById('camera');
  const canvas = document.getElementById('scratch');
  const veil = document.getElementById('veil');
  const start = document.getElementById('start');
  const retry = document.getElementById('retry');
  if (!app || !video || !canvas || !veil) return;

  // WebKit/iPhone is sensitive to inline-playback flags on camera-backed video.
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  // The original scratch was intentionally subtle, but on a real phone it
  // looked like the camera had not started. Add a stronger second erase pass.
  const ctx = canvas.getContext('2d');
  let rubbing = false;
  let pointerId = null;
  let last = null;

  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  canvas.addEventListener('pointerdown', (event) => {
    if (!app.classList.contains('is-live') || app.classList.contains('is-done')) return;
    rubbing = true;
    pointerId = event.pointerId;
    last = point(event);
  }, { passive: true });

  canvas.addEventListener('pointermove', (event) => {
    if (!rubbing || event.pointerId !== pointerId || !last) return;
    const next = point(event);
    const distance = Math.hypot(next.x - last.x, next.y - last.y);
    if (distance < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = .74;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.min(96, 72 + distance * .45);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    ctx.restore();

    last = next;
  }, { passive: true });

  const stopRub = (event) => {
    if (event.pointerId !== pointerId) return;
    rubbing = false;
    pointerId = null;
    last = null;
  };
  canvas.addEventListener('pointerup', stopRub);
  canvas.addEventListener('pointercancel', stopRub);

  const forceClearVeil = () => {
    if (app.classList.contains('is-live')) {
      veil.style.setProperty('opacity', '0.06', 'important');
    }
  };
  new MutationObserver(forceClearVeil).observe(app, { attributes: true, attributeFilter: ['class'] });
  forceClearVeil();

  let note = null;
  const showStallNote = () => {
    if (note || !app.classList.contains('is-live')) return;
    note = document.createElement('div');
    note.className = 'camera-stall-note';
    note.textContent = '映像が黒いままなら、アプリ内ブラウザではなくSafariでこのページを開いてください。';
    app.appendChild(note);
  };

  const clearStallNote = () => {
    if (!note) return;
    note.remove();
    note = null;
  };

  const watchCamera = () => {
    clearStallNote();
    const startTime = video.currentTime || 0;
    window.setTimeout(() => {
      if (!app.classList.contains('is-live')) return;
      const hasFrame = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
      const advancing = (video.currentTime || 0) > startTime + .03;
      if (!hasFrame || !advancing) showStallNote();
    }, 4500);
  };

  start?.addEventListener('click', watchCamera);
  retry?.addEventListener('click', watchCamera);
  video.addEventListener('playing', () => window.setTimeout(clearStallNote, 250));
})();
