(() => {
  'use strict';

  const nativeSetInterval = window.setInterval.bind(window);
  window.setInterval = (fn, ms, ...args) => nativeSetInterval(() => {
    if (document.visibilityState === 'visible') fn(...args);
  }, ms);

  const modal = document.getElementById('rewardModal');
  if (modal && document.visibilityState !== 'visible') {
    modal.classList.remove('hidden');
    modal.dataset.visibilityGuard = '1';
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const guarded = document.getElementById('rewardModal');
    if (guarded?.dataset.visibilityGuard === '1') {
      guarded.classList.add('hidden');
      delete guarded.dataset.visibilityGuard;
    }
  });
})();
