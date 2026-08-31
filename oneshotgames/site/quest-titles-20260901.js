(() => {
  'use strict';

  const questsList = document.getElementById('questsList');
  if (!questsList || !window.firebase?.auth || !window.firebase?.firestore) return;

  let requests = [];
  let gamesById = new Map();
  let userUnsubscribe = null;
  let decorateQueued = false;

  function clip(value, max = 34) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
  }

  function fallbackTitle(req) {
    const firstLine = String(req?.prompt || '').split('\n').map((line) => line.trim()).find(Boolean) || '';
    const theme = firstLine.replace(/^テーマ\s*:\s*/u, '').trim();
    if (theme) return `仮タイトル：${clip(theme)}`;
    return req?.type === 'improve' ? 'ゲームタイトル確認中…' : '新規ゲーム（タイトル未定）';
  }

  function titleFor(req) {
    const game = gamesById.get(String(req?.gameId || ''));
    return String(game?.title || req?.gameTitle || fallbackTitle(req));
  }

  function setTitleBlock(card, req) {
    let block = card.querySelector('.quest-game-title');
    if (!block) {
      block = document.createElement('div');
      block.className = 'quest-game-title';

      const label = document.createElement('span');
      const title = document.createElement('strong');
      block.append(label, title);

      const prompt = card.querySelector('p');
      card.insertBefore(block, prompt || card.querySelector('.quest-actions') || null);
    }

    const label = block.querySelector('span');
    const title = block.querySelector('strong');
    const nextLabel = req?.type === 'improve' ? 'GAME · 改善対象' : 'GAME';
    const nextTitle = titleFor(req);

    if (label && label.textContent !== nextLabel) label.textContent = nextLabel;
    if (title && title.textContent !== nextTitle) title.textContent = nextTitle;

    const prompt = card.querySelector('p');
    if (prompt && !prompt.querySelector('.quest-request-label')) {
      const promptLabel = document.createElement('span');
      promptLabel.className = 'quest-request-label';
      promptLabel.textContent = '依頼内容';
      prompt.prepend(promptLabel);
    }
  }

  function decorate() {
    const cards = [...questsList.querySelectorAll('.quest-card')];
    const newestFirst = [...requests].reverse();
    cards.forEach((card, index) => {
      const req = newestFirst[index];
      if (req) setTitleBlock(card, req);
    });
  }

  function scheduleDecorate() {
    if (decorateQueued) return;
    decorateQueued = true;
    requestAnimationFrame(() => {
      decorateQueued = false;
      decorate();
    });
  }

  async function refreshGames() {
    try {
      const response = await fetch(`/games.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      gamesById = new Map((Array.isArray(payload.games) ? payload.games : []).map((game) => [String(game.id || ''), game]));
      scheduleDecorate();
    } catch (error) {
      console.warn('[OSG] quest title refresh failed', error);
    }
  }

  new MutationObserver(scheduleDecorate).observe(questsList, { childList: true, subtree: true });

  firebase.auth().onAuthStateChanged((user) => {
    if (typeof userUnsubscribe === 'function') userUnsubscribe();
    userUnsubscribe = null;
    requests = [];
    scheduleDecorate();

    if (!user) return;
    const ref = firebase.firestore().collection('levelupUsers').doc(user.uid);
    userUnsubscribe = ref.onSnapshot(
      (snap) => {
        const data = snap?.exists ? snap.data() : {};
        requests = Array.isArray(data.osgRequests) ? data.osgRequests : [];
        scheduleDecorate();
      },
      (error) => console.warn('[OSG] quest title request watch failed', error)
    );
    void refreshGames();
  });

  window.setInterval(() => {
    if (document.visibilityState === 'visible') void refreshGames();
  }, 30000);

  const style = document.createElement('style');
  style.textContent = `
    .quest-game-title{margin:12px 0 0;padding:11px 12px;border:1px solid #e2e9f5;border-radius:12px;background:#f6f9ff}
    .quest-game-title span{display:block;font-size:9px;font-weight:950;letter-spacing:.13em;color:#0b7cff}
    .quest-game-title strong{display:block;margin-top:3px;color:#07133b;font-size:15px;line-height:1.4;letter-spacing:-.02em}
    .quest-request-label{display:block;margin-bottom:3px;color:#8490a8;font-size:9px;font-weight:900;letter-spacing:.1em}
  `;
  document.head.append(style);
})();
