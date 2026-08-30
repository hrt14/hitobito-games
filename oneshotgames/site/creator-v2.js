(() => {
  'use strict';

  const TERMS_VERSION = '2026-08-30-v1';
  const MAX_REQUEST = 590;
  const $ = (id) => document.getElementById(id);
  const els = {
    card: $('creatorCard'), prompt: $('gamePrompt'), submit: $('submitQuestBtn'), message: $('creatorMessage'), authBtn: $('authBtn'),
    rights: $('rightsConsent'), goal: $('briefGoal'), control: $('briefControl'), result: $('briefResult'), mood: $('briefMood')
  };
  if (!els.submit || !els.prompt) return;

  const state = {
    bypass: false,
    busy: false,
    pendingAfterLogin: false,
    nicknameWatch: null,
    originalButtonHtml: els.submit.innerHTML
  };

  try {
    els.rights.checked = localStorage.getItem(`osg-terms:${TERMS_VERSION}`) === 'accepted';
  } catch {}

  function setMessage(text = '', kind = '') {
    els.message.textContent = text;
    els.message.className = `creator-message ${kind}`.trim();
  }

  function clip(value, max) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return `${text.slice(0, Math.max(1, max - 1))}…`;
  }

  function buildRequestPrompt() {
    const answers = [
      ['目的', clip(els.goal?.value, 48)],
      ['操作', clip(els.control?.value, 48)],
      ['結果', clip(els.result?.value, 48)],
      ['雰囲気', clip(els.mood?.value, 48)]
    ].filter(([, value]) => value);
    const suffixText = answers.map(([label, value]) => `${label}:${value}`).join('\n');
    const themeRaw = els.prompt.value.trim();
    const available = Math.max(42, MAX_REQUEST - suffixText.length - (suffixText ? 1 : 0) - 3);
    const theme = clip(themeRaw, available);
    let composed = [`テーマ:${theme}`, suffixText].filter(Boolean).join('\n');
    if (composed.length > MAX_REQUEST) {
      const compactAnswers = answers.slice(0, 2).map(([label, value]) => `${label}:${clip(value, 30)}`);
      const fixed = compactAnswers.join('\n');
      const themeBudget = Math.max(36, MAX_REQUEST - fixed.length - 4);
      composed = [`テーマ:${clip(themeRaw, themeBudget)}`, fixed].filter(Boolean).join('\n');
    }
    return composed.slice(0, MAX_REQUEST);
  }

  function resetExtras() {
    for (const el of [els.goal, els.control, els.result, els.mood]) if (el) el.value = '';
  }

  async function profileFor(user) {
    const snap = await firebase.firestore().collection('levelupUsers').doc(user.uid).get();
    return snap.exists ? snap.data()?.osgProfile || null : null;
  }

  function waitForNickname(user) {
    state.nicknameWatch?.();
    state.nicknameWatch = firebase.firestore().collection('levelupUsers').doc(user.uid).onSnapshot((snap) => {
      const nickname = snap.exists ? snap.data()?.osgProfile?.nickname : '';
      if (!nickname || !state.pendingAfterLogin) return;
      state.nicknameWatch?.();
      state.nicknameWatch = null;
      state.pendingAfterLogin = false;
      enhancedSubmit();
    });
  }

  async function ensureReadyUser() {
    const user = firebase.auth().currentUser;
    if (!user) {
      state.pendingAfterLogin = true;
      setMessage('制作にはGoogleログインが必要です。ログイン後、この内容のまま続けます。');
      els.authBtn?.click();
      return null;
    }
    const profile = await profileFor(user);
    if (!profile?.nickname) {
      state.pendingAfterLogin = true;
      setMessage('先にゲームへ表示する作者名を決めてください。');
      waitForNickname(user);
      els.authBtn?.click();
      return null;
    }
    return user;
  }

  async function rememberTerms(user) {
    try {
      await firebase.firestore().collection('levelupUsers').doc(user.uid).set({
        osgTerms: { version: TERMS_VERSION, acceptedAt: firebase.firestore.FieldValue.serverTimestamp() }
      }, { merge: true });
    } catch (error) {
      console.warn('[OSG creator] terms acceptance save failed', error);
    }
  }

  function watchOriginalSubmission() {
    const observer = new MutationObserver(() => {
      const accepted = /GAME QUEST ACCEPTED/.test(els.message.textContent || '') && els.message.classList.contains('ok');
      const failed = els.message.classList.contains('error');
      if (!accepted && !failed) return;
      observer.disconnect();
      state.busy = false;
      els.card.classList.remove('is-uploading');
      els.submit.innerHTML = state.originalButtonHtml;
      if (accepted) resetExtras();
    });
    observer.observe(els.message, { childList: true, characterData: true, subtree: true, attributes: true });
    setTimeout(() => {
      observer.disconnect();
      if (!state.busy) return;
      state.busy = false;
      els.card.classList.remove('is-uploading');
      els.submit.innerHTML = state.originalButtonHtml;
      setMessage('送信に時間がかかっています。もう一度お試しください。', 'error');
    }, 15000);
  }

  async function enhancedSubmit() {
    if (state.busy) return;
    if (els.prompt.value.trim().length < 2) {
      setMessage('ゲームのテーマを1つ書いてください。4つの質問は空欄でOKです。', 'error');
      els.prompt.focus();
      return;
    }
    if (!els.rights.checked) {
      setMessage('制作クエストを送る前に、投稿内容の権利ルールを確認して同意してください。', 'error');
      els.rights.focus();
      return;
    }
    const user = await ensureReadyUser();
    if (!user) return;

    state.busy = true;
    els.card.classList.add('is-uploading');
    els.submit.innerHTML = '<span class="submit-progress">準備中…</span>';
    setMessage('制作クエストを準備しています…');

    try {
      await rememberTerms(user);
      els.prompt.value = buildRequestPrompt();
      els.prompt.dispatchEvent(new Event('input', { bubbles: true }));
      state.bypass = true;
      watchOriginalSubmission();
      els.submit.click();
    } catch (error) {
      console.warn('[OSG creator] enhanced submit failed', error);
      state.busy = false;
      els.card.classList.remove('is-uploading');
      els.submit.innerHTML = state.originalButtonHtml;
      setMessage('制作クエストを準備できませんでした。もう一度お試しください。', 'error');
    }
  }

  els.submit.addEventListener('click', (event) => {
    if (state.bypass) {
      state.bypass = false;
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    enhancedSubmit();
  }, true);

  els.rights?.addEventListener('change', () => {
    try {
      if (els.rights.checked) localStorage.setItem(`osg-terms:${TERMS_VERSION}`, 'accepted');
      else localStorage.removeItem(`osg-terms:${TERMS_VERSION}`);
    } catch {}
  });

  if (window.firebase?.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user && state.pendingAfterLogin) waitForNickname(user);
    });
  }
})();
