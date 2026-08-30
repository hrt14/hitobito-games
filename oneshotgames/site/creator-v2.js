(() => {
  'use strict';

  const TERMS_VERSION = '2026-08-30-v1';
  const MAX_REQUEST = 590;
  const $ = (id) => document.getElementById(id);
  const els = {
    card: $('creatorCard'), prompt: $('gamePrompt'), submit: $('submitQuestBtn'), message: $('creatorMessage'), authBtn: $('authBtn'),
    photoStart: $('photoStartBtn'), photoInput: $('photoInput'), photoPreview: $('photoPreview'), photoImg: $('photoPreviewImg'),
    removePhoto: $('removePhotoBtn'), photoCaution: $('photoCaution'), rights: $('rightsConsent'),
    goal: $('briefGoal'), control: $('briefControl'), result: $('briefResult'), mood: $('briefMood')
  };
  if (!els.submit || !els.prompt) return;

  const state = {
    photoFile: null,
    previewUrl: '',
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

  function hasBrief() {
    return [els.goal, els.control, els.result, els.mood].some((el) => el?.value.trim());
  }

  function buildRequestPrompt(imageUrl = '') {
    const answers = [
      ['目的', clip(els.goal?.value, 48)],
      ['操作', clip(els.control?.value, 48)],
      ['結果', clip(els.result?.value, 48)],
      ['雰囲気', clip(els.mood?.value, 48)]
    ].filter(([, value]) => value);
    const suffix = [
      ...answers.map(([label, value]) => `${label}:${value}`),
      imageUrl ? `参考画像:${imageUrl}` : ''
    ].filter(Boolean);
    const suffixText = suffix.join('\n');
    const themeRaw = els.prompt.value.trim() || (imageUrl ? 'この写真を起点にゲーム化。細部はおまかせ。' : '');
    const available = Math.max(42, MAX_REQUEST - suffixText.length - (suffixText ? 1 : 0) - 3);
    const theme = clip(themeRaw, available);
    let composed = [`テーマ:${theme}`, suffixText].filter(Boolean).join('\n');
    if (composed.length > MAX_REQUEST) {
      const compactAnswers = answers.slice(0, 2).map(([label, value]) => `${label}:${clip(value, 30)}`);
      const fixed = [...compactAnswers, imageUrl ? `参考画像:${imageUrl}` : ''].filter(Boolean).join('\n');
      const themeBudget = Math.max(36, MAX_REQUEST - fixed.length - 4);
      composed = [`テーマ:${clip(themeRaw, themeBudget)}`, fixed].filter(Boolean).join('\n');
    }
    return composed.slice(0, MAX_REQUEST);
  }

  function resetPhoto() {
    state.photoFile = null;
    els.photoInput.value = '';
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = '';
    els.photoPreview.hidden = true;
    els.photoCaution.hidden = true;
    els.photoImg.removeAttribute('src');
  }

  function resetExtras() {
    resetPhoto();
    for (const el of [els.goal, els.control, els.result, els.mood]) if (el) el.value = '';
  }

  function showPhoto(file) {
    if (!file || !String(file.type || '').startsWith('image/')) {
      setMessage('画像ファイルを選んでください。', 'error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMessage('写真が大きすぎます。20MB以下の画像を選んでください。', 'error');
      return;
    }
    resetPhoto();
    state.photoFile = file;
    state.previewUrl = URL.createObjectURL(file);
    els.photoImg.src = state.previewUrl;
    els.photoPreview.hidden = false;
    els.photoCaution.hidden = false;
    setMessage('写真を選びました。テーマや4つの質問は全部スキップしても送れます。');
  }

  function imageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image-decode-failed')); };
      img.src = url;
    });
  }

  async function compressPhoto(file) {
    try {
      const img = await imageFromFile(file);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (blob && blob.size <= 8 * 1024 * 1024) return blob;
    } catch (error) {
      console.warn('[OSG creator] photo compression fallback', error);
    }
    if (file.size <= 8 * 1024 * 1024) return file;
    throw new Error('photo-too-large');
  }

  async function uploadPhoto(user) {
    if (!state.photoFile) return '';
    if (!window.firebase?.storage) throw new Error('storage-sdk-missing');
    const blob = await compressPhoto(state.photoFile);
    const random = (crypto?.randomUUID ? crypto.randomUUID().replaceAll('-', '') : Math.random().toString(36).slice(2)).slice(0, 16);
    const path = `osg-inputs/${user.uid}/${Date.now()}-${random}.jpg`;
    const ref = firebase.storage().ref().child(path);
    await ref.put(blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: 'private,max-age=300',
      customMetadata: { purpose: 'oneshotgames-source', termsVersion: TERMS_VERSION }
    });
    return ref.getDownloadURL();
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
    }, 15000);
  }

  function storageErrorMessage(error) {
    const code = String(error?.code || '');
    if (String(error?.message || '') === 'photo-too-large') return '写真を圧縮できませんでした。別の写真を選ぶか、画像サイズを小さくしてください。';
    if (code.includes('unauthorized')) return '写真保存の権限設定がまだ完了していません。写真を外せばテキストだけで制作できます。';
    if (code.includes('bucket-not-found') || code.includes('project-not-found') || code.includes('unknown') || String(error?.message || '').includes('storage')) return '写真機能のFirebase Storage初期設定がまだ必要です。写真を外せばテキストだけで制作できます。';
    return '写真をアップロードできませんでした。写真を外すか、もう一度お試しください。';
  }

  async function enhancedSubmit() {
    if (state.busy) return;
    const hasTheme = els.prompt.value.trim().length >= 2;
    if (!hasTheme && !state.photoFile) {
      setMessage('テーマを1つ書くか、写真を1枚選んでください。4つの質問は空欄でOKです。', 'error');
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
    setMessage(state.photoFile ? '写真を制作素材として保存しています…' : '制作クエストを準備しています…');

    try {
      await rememberTerms(user);
      const imageUrl = await uploadPhoto(user);
      const composed = buildRequestPrompt(imageUrl);
      els.prompt.value = composed;
      els.prompt.dispatchEvent(new Event('input', { bubbles: true }));
      state.bypass = true;
      watchOriginalSubmission();
      els.submit.click();
    } catch (error) {
      console.warn('[OSG creator] enhanced submit failed', error);
      state.busy = false;
      els.card.classList.remove('is-uploading');
      els.submit.innerHTML = state.originalButtonHtml;
      setMessage(storageErrorMessage(error), 'error');
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

  els.photoStart?.addEventListener('click', () => els.photoInput?.click());
  els.photoInput?.addEventListener('change', () => showPhoto(els.photoInput.files?.[0]));
  els.removePhoto?.addEventListener('click', resetPhoto);
  document.querySelector('[data-focus-theme]')?.addEventListener('click', () => els.prompt.focus());
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
