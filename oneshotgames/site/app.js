(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    authBtn: $('authBtn'), myQuestsBtn: $('myQuestsBtn'), prompt: $('gamePrompt'), promptCount: $('promptCount'),
    submit: $('submitQuestBtn'), message: $('creatorMessage'), gamesGrid: $('gamesGrid'), panel: $('questsPanel'),
    questsList: $('questsList'), profileBox: $('profileBox'), nicknameModal: $('nicknameModal'), nicknameInput: $('nicknameInput'),
    nicknameError: $('nicknameError'), saveNickname: $('saveNicknameBtn')
  };

  const state = { auth: null, db: null, user: null, profile: null, requests: [], games: [], pendingAction: null };

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
    return ({ queued: 'LV.1 QUEST', synced: 'LV.1 QUEST', processing: 'LV.2 BUILDING', testing: 'LV.3 TESTING', deploying: 'LV.3 DEPLOYING', completed: 'LV.4 LIVE', failed: 'FAILED', rejected: 'REJECTED' })[status] || String(status || 'QUEUED').toUpperCase();
  }

  function formatDate(value) {
    const date = value?.toDate ? value.toDate() : new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  async function loadGames() {
    try {
      const response = await fetch(`/games.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`games.json ${response.status}`);
      const payload = await response.json();
      state.games = Array.isArray(payload.games) ? payload.games : [];
      renderGames();
    } catch (error) {
      console.warn('[OSG] game list failed', error);
      els.gamesGrid.innerHTML = '<div class="loading-card">まだ公開ゲームはありません。</div>';
    }
  }

  function renderGames() {
    if (!state.games.length) {
      els.gamesGrid.innerHTML = '<div class="loading-card">最初のゲームを作ってみよう。</div>';
      return;
    }
    els.gamesGrid.innerHTML = state.games.slice(0, 18).map((game) => `
      <a class="game-card" href="${escapeHtml(game.url || `/g/${game.id}/`)}">
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
      const live = req.status === 'completed';
      const improve = req.type === 'improve';
      return `<article class="quest-card">
        <div class="quest-top"><span class="quest-status">${escapeHtml(statusLabel(req.status))}</span><small>${escapeHtml(formatDate(req.createdAt))}</small></div>
        <p>${escapeHtml(req.prompt)}</p>
        <div class="quest-actions">
          ${live && req.resultUrl ? `<a class="mini-btn" href="${escapeHtml(req.resultUrl)}">PLAY</a>` : ''}
          ${live && !improve ? `<button class="mini-btn" type="button" data-improve="${escapeHtml(req.gameId)}">改善する</button>` : ''}
        </div>
      </article>`;
    }).join('');
    els.questsList.querySelectorAll('[data-improve]').forEach((button) => button.addEventListener('click', () => startImprovement(button.dataset.improve)));
  }

  async function loadUserDoc() {
    if (!state.user || !state.db) return;
    const ref = state.db.collection('levelupUsers').doc(state.user.uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    state.profile = data.osgProfile || null;
    state.requests = Array.isArray(data.osgRequests) ? data.osgRequests : [];
    renderAccount();
    if (!state.profile?.nickname) showNicknameModal();
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
    const request = { id, gameId, type: 'create', prompt, status: 'queued', authorNickname: state.profile.nickname, createdAt: new Date().toISOString(), resultUrl: `/g/${gameId}/` };
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
    const request = { id, gameId, type: 'improve', prompt: note.trim().slice(0, 600), status: 'queued', authorNickname: state.profile.nickname, createdAt: new Date().toISOString(), resultUrl: `/g/${gameId}/` };
    try {
      await appendRequest(request);
      renderAccount();
      setMessage('改善クエストを登録しました。', 'ok');
    } catch (error) {
      console.warn('[OSG] improvement request failed', error);
      setMessage('改善クエストを保存できませんでした。', 'error');
    }
  }

  function openPanel() {
    els.panel.classList.add('open');
    els.panel.setAttribute('aria-hidden', 'false');
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
    els.authBtn.addEventListener('click', async () => {
      if (!state.user) return signIn();
      if (!state.profile?.nickname) return showNicknameModal();
      openPanel();
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
      state.user = user;
      state.profile = null;
      state.requests = [];
      renderAccount();
      if (user) await loadUserDoc();
      if (user && state.pendingAction === 'submit' && state.profile?.nickname) {
        state.pendingAction = null;
        await submitQuest();
      }
    });
  }

  bind();
  renderAccount();
  loadGames();
  initFirebase();
})();
