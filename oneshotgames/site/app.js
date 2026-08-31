(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    authBtn: $('authBtn'), myQuestsBtn: $('myQuestsBtn'), prompt: $('gamePrompt'), promptCount: $('promptCount'),
    submit: $('submitQuestBtn'), message: $('creatorMessage'), gamesGrid: $('gamesGrid'), panel: $('questsPanel'),
    questsList: $('questsList'), profileBox: $('profileBox'), nicknameModal: $('nicknameModal'), nicknameInput: $('nicknameInput'),
    nicknameError: $('nicknameError'), saveNickname: $('saveNicknameBtn'), questRefreshBtn: $('questRefreshBtn'),
    questsLastUpdated: $('questsLastUpdated')
  };

  const AUTO_REFRESH_MS = 30000;
  const state = {
    auth: null,
    db: null,
    user: null,
    profile: null,
    requests: [],
    games: [],
    gameOrigin: '',
    pendingAction: null,
    userDocUnsubscribe: null,
    autoRefreshTimer: null,
    refreshInFlight: false,
    lastRefreshAt: null
  };

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function requestId() {
    if (crypto?.randomUUID) return crypto.randomUUID().replaceAll('-', '').slice(0, 20).toLowerCase();
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.slice(0, 20);
  }

  function setMessage(text = '', kind = '') {
    els.message.textContent = text;
    els.message.className = `creator-message ${kind}`.trim();
  }

  function statusLabel(status) {
    return ({
      queued: 'LV.1 受付済み',
      synced: 'LV.1 同期済み',
      processing: 'LV.2 制作中',
      testing: 'LV.3 テスト中',
      deploying: 'LV.3 公開準備中',
      completed: 'LV.4 公開済み',
      failed: '制作エラー',
      rejected: '受付不可'
    })[status] || String(status || '受付済み').toUpperCase();
  }

  function formatDate(value) {
    const date = value?.toDate ? value.toDate() : new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  function formatRefreshTime(date) {
    if (!date) return '自動更新 ON';
    return `最終更新 ${new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date)}`;
  }

  function updateRefreshUi() {
    if (els.questRefreshBtn) {
      els.questRefreshBtn.disabled = state.refreshInFlight;
      els.questRefreshBtn.textContent = state.refreshInFlight ? '↻ 更新中…' : '↻ 更新';
    }
    if (els.questsLastUpdated) {
      els.questsLastUpdated.textContent = state.refreshInFlight ? '最新状態を確認中…' : formatRefreshTime(state.lastRefreshAt);
    }
  }

  function markRefreshed() {
    state.lastRefreshAt = new Date();
    updateRefreshUi();
  }

  function publishedGame(gameId) {
    if (!gameId) return null;
    return state.games.find((game) => String(game.id || '') === String(gameId)) || null;
  }

  function isolatedGameUrl(gameId) {
    if (!gameId) return '';
    const published = publishedGame(gameId);
    if (published?.url) return String(published.url);
    const origin = String(state.gameOrigin || '').replace(/\/$/, '');
    return origin ? `${origin}/g/${encodeURIComponent(gameId)}/` : '';
  }

  function requestIsPublished(req) {
    if (req.status === 'completed') return true;
    const game = publishedGame(req.gameId);
    if (!game) return false;
    if (req.type !== 'improve') return true;

    const hasBaseVersion = req.baseVersion !== undefined && req.baseVersion !== null && req.baseVersion !== '';
    if (hasBaseVersion) {
      const baseVersion = Math.max(1, Number(req.baseVersion) || 1);
      const liveVersion = Math.max(1, Number(game.version) || 1);
      return liveVersion > baseVersion;
    }

    const requestTime = new Date(req.createdAt || 0).getTime();
    const gameTime = new Date(game.updatedAt || game.createdAt || 0).getTime();
    return Number.isFinite(requestTime) && Number.isFinite(gameTime) && gameTime >= requestTime;
  }

  async function loadGames({ silent = false } = {}) {
    try {
      const response = await fetch(`/games.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`games.json ${response.status}`);
      const payload = await response.json();
      state.gameOrigin = typeof payload.gameOrigin === 'string' ? payload.gameOrigin : '';
      state.games = Array.isArray(payload.games) ? payload.games : [];
      renderGames();
      if (state.user && state.requests.length) renderRequests();
      return true;
    } catch (error) {
      console.warn('[OSG] game list failed', error);
      if (!silent && !state.games.length) els.gamesGrid.innerHTML = '<div class="loading-card">公開ゲームを読み込めませんでした。更新してもう一度お試しください。</div>';
      return false;
    }
  }

  function renderGames() {
    if (!state.games.length) {
      els.gamesGrid.innerHTML = '<div class="loading-card">最初のゲームを作ってみよう。</div>';
      return;
    }
    els.gamesGrid.innerHTML = state.games.slice(0, 18).map((game) => `
      <a class="game-card" href="${escapeHtml(game.url || isolatedGameUrl(game.id))}">
        <div class="game-art"><div class="mini">ONE SHOT GAME · V${Number(game.version) || 1}</div><h3>${escapeHtml(game.title || 'Untitled Game')}</h3></div>
        <div class="game-info"><p>${escapeHtml(game.description || 'OneShotGamesで作られたゲーム')}</p><div class="game-meta"><span class="author">@${escapeHtml(game.authorNickname || 'oneshotgames')}</span><span>PLAY →</span></div></div>
      </a>`).join('');
  }

  function renderAccount() {
    if (!state.user) {
      els.authBtn.textContent = 'Googleでログイン';
      els.profileBox.innerHTML = '<div class="profile-card"><b>ログインして制作</b><small>ゲーム制作・改善にはGoogleログインが必要です。</small></div>';
      els.questsList.innerHTML = '<div class="loading-card">ログインすると制作クエストが表示されます。</div>';
      return;
    }
    els.authBtn.textContent = state.profile?.nickname ? `@${state.profile.nickname}` : '作者名を設定';
    els.profileBox.innerHTML = `<div class="profile-card"><b>@${escapeHtml(state.profile?.nickname || '未設定')}</b><small>${state.requests.length} quests · Google login connected</small></div>`;
    renderRequests();
  }

  function renderRequests() {
    if (!state.user) return;
    if (!state.requests.length) {
      els.questsList.innerHTML = '<div class="loading-card">まだ制作クエストはありません。</div>';
      return;
    }
    const items = [...state.requests].reverse();
    els.questsList.innerHTML = items.map((req) => {
      const published = requestIsPublished(req);
      const displayStatus = published ? 'LV.4 公開済み' : statusLabel(req.status);
      const resultUrl = isolatedGameUrl(req.gameId) || req.resultUrl || '';
      const publishedBadge = published
        ? '<span style="display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#e9fbf4;color:#078864;font-size:10px;font-weight:900;letter-spacing:.04em;white-space:nowrap">✓ 公開済み</span>'
        : '';
      return `<article class="quest-card">
        <div class="quest-top"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="quest-status">${escapeHtml(displayStatus)}</span>${publishedBadge}</div><small>${escapeHtml(formatDate(req.createdAt))}</small></div>
        <p>${escapeHtml(req.prompt)}</p>
        <div class="quest-actions">
          ${published && resultUrl ? `<a class="mini-btn" href="${escapeHtml(resultUrl)}">PLAY</a>` : ''}
          ${published && req.gameId ? `<button class="mini-btn" type="button" data-improve="${escapeHtml(req.gameId)}">改善する</button>` : ''}
        </div>
      </article>`;
    }).join('');
    els.questsList.querySelectorAll('[data-improve]').forEach((button) => button.addEventListener('click', () => startImprovement(button.dataset.improve)));
  }

  function applyUserDoc(snap) {
    const data = snap?.exists ? snap.data() : {};
    state.profile = data.osgProfile || null;
    state.requests = Array.isArray(data.osgRequests) ? data.osgRequests : [];
    renderAccount();
    markRefreshed();
    if (!state.profile?.nickname && !els.nicknameModal.classList.contains('open')) showNicknameModal();
  }

  async function loadUserDoc({ server = false } = {}) {
    if (!state.user || !state.db) return false;
    const ref = state.db.collection('levelupUsers').doc(state.user.uid);
    try {
      const snap = server ? await ref.get({ source: 'server' }) : await ref.get();
      applyUserDoc(snap);
      return true;
    } catch (error) {
      console.warn('[OSG] user data refresh failed', error);
      return false;
    }
  }

  function stopUserDocWatch() {
    if (typeof state.userDocUnsubscribe === 'function') state.userDocUnsubscribe();
    state.userDocUnsubscribe = null;
  }

  function watchUserDoc() {
    stopUserDocWatch();
    if (!state.user || !state.db) return;
    const ref = state.db.collection('levelupUsers').doc(state.user.uid);
    state.userDocUnsubscribe = ref.onSnapshot(
      { includeMetadataChanges: false },
      (snap) => applyUserDoc(snap),
      (error) => console.warn('[OSG] realtime user data failed', error)
    );
  }

  async function refreshAll() {
    if (state.refreshInFlight) return;
    state.refreshInFlight = true;
    updateRefreshUi();
    try {
      const jobs = [loadGames({ silent: true })];
      if (state.user) jobs.push(loadUserDoc({ server: true }));
      await Promise.allSettled(jobs);
      markRefreshed();
    } finally {
      state.refreshInFlight = false;
      updateRefreshUi();
    }
  }

  function startAutoRefresh() {
    if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
    state.autoRefreshTimer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      const refreshed = await loadGames({ silent: true });
      if (refreshed) markRefreshed();
    }, AUTO_REFRESH_MS);
  }

  function showNicknameModal() {
    if (!state.user) return;
    els.nicknameModal.classList.add('open');
    els.nicknameModal.setAttribute('aria-hidden', 'false');
    els.nicknameInput.value = state.profile?.nickname || '';
    setTimeout(() => els.nicknameInput.focus(), 30);
  }

  function hideNicknameModal() {
    els.nicknameModal.classList.remove('open');
    els.nicknameModal.setAttribute('aria-hidden', 'true');
  }

  function nicknameValid(value) {
    const name = String(value || '').trim();
    return name.length >= 2 && name.length <= 24 && /^[\p{L}\p{N}_-]+$/u.test(name);
  }

  async function saveNickname() {
    const nickname = els.nicknameInput.value.trim();
    if (!nicknameValid(nickname)) {
      els.nicknameError.textContent = '2〜24文字。文字・数字・_・- が使えます。';
      return;
    }
    els.saveNickname.disabled = true;
    try {
      const profile = { nickname, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      if (!state.profile?.createdAt) profile.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await state.db.collection('levelupUsers').doc(state.user.uid).set({ osgProfile: profile }, { merge: true });
      state.profile = { ...(state.profile || {}), nickname };
      hideNicknameModal();
      renderAccount();
      if (state.pendingAction === 'submit') {
        state.pendingAction = null;
        await submitQuest();
      }
    } catch (error) {
      console.warn('[OSG] nickname save failed', error);
      els.nicknameError.textContent = '保存できませんでした。もう一度お試しください。';
    } finally {
      els.saveNickname.disabled = false;
    }
  }

  async function signIn() {
    if (!state.auth) return;
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await state.auth.signInWithPopup(provider);
    } catch (error) {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
        const provider = new firebase.auth.GoogleAuthProvider();
        await state.auth.signInWithRedirect(provider);
        return;
      }
      console.warn('[OSG] login failed', error);
      setMessage(error?.code === 'auth/unauthorized-domain' ? 'このドメインをGoogleログインの許可ドメインに追加する必要があります。' : 'Googleログインに失敗しました。', 'error');
    }
  }

  async function appendRequest(request) {
    const ref = state.db.collection('levelupUsers').doc(state.user.uid);
    await state.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists && Array.isArray(snap.data()?.osgRequests) ? snap.data().osgRequests : [];
      const trimmed = current.slice(-39);
      tx.set(ref, { osgRequests: [...trimmed, request], osgProfile: { ...(snap.data()?.osgProfile || {}), nickname: state.profile.nickname } }, { merge: true });
    });
    state.requests = [...state.requests.slice(-39), request];
  }

  async function submitQuest() {
    const prompt = els.prompt.value.trim();
    if (prompt.length < 8) return setMessage('ゲームの内容をもう少し具体的に書いてください。', 'error');
    if (!state.user) {
      state.pendingAction = 'submit';
      setMessage('制作にはGoogleログインが必要です。ログイン後にこの内容をそのまま送れます。');
      await signIn();
      return;
    }
    if (!state.profile?.nickname) {
      state.pendingAction = 'submit';
      showNicknameModal();
      return;
    }
    els.submit.disabled = true;
    const id = requestId();
    const gameId = `g-${id}`;
    const request = { id, gameId, type: 'create', prompt, status: 'queued', authorNickname: state.profile.nickname, createdAt: new Date().toISOString(), resultUrl: isolatedGameUrl(gameId) };
    try {
      await appendRequest(request);
      els.prompt.value = '';
      els.promptCount.textContent = '0 / 600';
      setMessage('GAME QUEST ACCEPTED — 制作キューへ登録しました。', 'ok');
      renderAccount();
      openPanel();
    } catch (error) {
      console.warn('[OSG] request failed', error);
      setMessage('制作クエストを保存できませんでした。もう一度お試しください。', 'error');
    } finally {
      els.submit.disabled = false;
    }
  }

  async function startImprovement(gameId) {
    const note = window.prompt('どう改善したい？', '');
    if (!note?.trim()) return;
    const id = requestId();
    const currentGame = publishedGame(gameId);
    const baseVersion = currentGame ? Math.max(1, Number(currentGame.version) || 1) : null;
    const request = {
      id,
      gameId,
      type: 'improve',
      prompt: note.trim().slice(0, 600),
      status: 'queued',
      authorNickname: state.profile.nickname,
      createdAt: new Date().toISOString(),
      resultUrl: isolatedGameUrl(gameId),
      ...(baseVersion ? { baseVersion } : {})
    };
    try {
      await appendRequest(request);
      renderAccount();
      setMessage('改善クエストを登録しました。公開されると「公開済み」が付きます。', 'ok');
    } catch (error) {
      console.warn('[OSG] improvement request failed', error);
      setMessage('改善クエストを保存できませんでした。', 'error');
    }
  }

  function openPanel() {
    els.panel.classList.add('open');
    els.panel.setAttribute('aria-hidden', 'false');
    refreshAll();
  }

  function closePanel() {
    els.panel.classList.remove('open');
    els.panel.setAttribute('aria-hidden', 'true');
  }

  function bind() {
    els.prompt.addEventListener('input', () => { els.promptCount.textContent = `${els.prompt.value.length} / 600`; });
    els.submit.addEventListener('click', submitQuest);
    els.myQuestsBtn.addEventListener('click', openPanel);
    document.querySelectorAll('[data-close-panel]').forEach((node) => node.addEventListener('click', closePanel));
    els.saveNickname.addEventListener('click', saveNickname);
    els.nicknameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') saveNickname(); });
    if (els.questRefreshBtn) els.questRefreshBtn.addEventListener('click', refreshAll);
    els.authBtn.addEventListener('click', async () => {
      if (!state.user) return signIn();
      if (!state.profile?.nickname) return showNicknameModal();
      openPanel();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshAll();
    });
  }

  async function initFirebase() {
    if (!window.firebase?.auth || !window.firebase?.firestore || !firebase.apps?.length) {
      setMessage('Firebaseを読み込めませんでした。', 'error');
      return;
    }
    state.auth = firebase.auth();
    state.db = firebase.firestore();
    await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    state.auth.onAuthStateChanged(async (user) => {
      stopUserDocWatch();
      state.user = user;
      state.profile = null;
      state.requests = [];
      renderAccount();
      if (user) watchUserDoc();
      if (user && state.pendingAction === 'submit' && state.profile?.nickname) {
        state.pendingAction = null;
        await submitQuest();
      }
    });
  }

  bind();
  renderAccount();
  updateRefreshUi();
  loadGames({ silent: false }).then((ok) => { if (ok) markRefreshed(); });
  startAutoRefresh();
  initFirebase();
})();