(() => {
  const install = () => {
    const timer = document.getElementById('realTimer');
    const screen = document.getElementById('realScreen');
    if (!timer || !screen || document.getElementById('realExtendBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'realExtendBtn';
    btn.type = 'button';
    btn.className = 'ghost-btn';
    btn.textContent = 'もう少し考える +30秒';
    btn.style.marginBottom = '12px';
    btn.addEventListener('click', () => {
      const current = Math.max(0, Number(timer.textContent || 0) || 0);
      timer.textContent = String(current + 30);
      window.dispatchEvent(new CustomEvent('matomaru:extend-thinking', { detail: { seconds: 30 } }));
      btn.textContent = 'さらに考える +30秒';
    });
    const finish = document.getElementById('realFinishBtn');
    if (finish) finish.insertAdjacentElement('beforebegin', btn);
  };

  const originalSetInterval = window.setInterval;
  let activeRealTimer = null;
  window.setInterval = function patchedSetInterval(fn, delay, ...args) {
    const id = originalSetInterval(fn, delay, ...args);
    if (delay === 1000 && document.getElementById('realScreen')?.classList.contains('active')) activeRealTimer = id;
    return id;
  };

  window.addEventListener('matomaru:extend-thinking', () => {
    const timer = document.getElementById('realTimer');
    if (!timer) return;
    let left = Number(timer.textContent || 30) || 30;
    if (activeRealTimer) clearInterval(activeRealTimer);
    activeRealTimer = originalSetInterval(() => {
      left -= 1;
      timer.textContent = String(Math.max(0, left));
      if (left <= 0) clearInterval(activeRealTimer);
    }, 1000);
  });

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', install, { once: true }) : install();
})();
