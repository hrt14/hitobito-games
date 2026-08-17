import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const appsDir = path.join(outDir, 'apps');
const assetPath = path.join(outDir, 'levelup-account.js');
const marker = 'data-levelup-account';

if (!fs.existsSync(path.join(outDir, 'index.html')) || !fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after build:hosting and home generation.');
}

function accountBootstrap() {
  'use strict';

  if (window.__LEVELUP_ACCOUNT_LOADED__) return;
  window.__LEVELUP_ACCOUNT_LOADED__ = true;

  const FAVORITES_KEY = 'hitobito-levelup-favorites-v1';
  const HISTORY_KEY = 'hitobito-levelup-history-v1';
  const script = document.currentScript;
  const gameSlug = script?.dataset.gameSlug || '';
  const isHome = script?.dataset.page === 'home';
  const state = {
    auth: null,
    db: null,
    user: null,
    panelOpen: false,
    busy: false,
    message: '',
    messageKind: '',
    favorites: readFavorites(),
    history: [],
  };

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function readFavorites() {
    const values = readJson(FAVORITES_KEY, []);
    return new Set(Array.isArray(values) ? values.filter((value) => typeof value === 'string') : []);
  }

  function readPendingHistory() {
    const value = readJson(HISTORY_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function savePendingPlay() {
    if (!gameSlug) return;
    const history = readPendingHistory();
    const previous = history[gameSlug] || {};
    history[gameSlug] = {
      slug: gameSlug,
      title: cleanTitle(document.title) || gameSlug,
      path: location.pathname,
      lastPlayedAt: new Date().toISOString(),
      playCount: Math.max(0, Number(previous.playCount) || 0) + 1,
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function cleanTitle(title) {
    return String(title || '')
      .replace(/\s*[|｜]\s*(hitobito\s*)?LEVEL\s*UP.*$/i, '')
      .replace(/\s*[|｜]\s*hitobito.*$/i, '')
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function friendlyError(error) {
    const code = error?.code || '';
    if (code.includes('popup-closed-by-user')) return 'ログインをキャンセルしました。';
    if (code.includes('popup-blocked')) return 'ポップアップがブロックされました。もう一度お試しください。';
    if (code.includes('unauthorized-domain')) return 'このドメインはGoogleログインに未登録です。';
    if (code.includes('operation-not-allowed')) return 'Googleログインの初期設定がまだ完了していません。';
    if (code.includes('permission-denied')) return 'クラウド保存の権限設定を確認してください。';
    if (code.includes('unavailable') || code.includes('network-request-failed')) return '通信できません。端末への保存は続いています。';
    return '接続に失敗しました。端末への保存は続いています。';
  }

  const host = document.createElement('div');
  host.id = 'levelup-account-root';
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host{all:initial;color-scheme:dark;--lu-lime:#d8ff5b;--lu-bg:#10130e;--lu-text:#f5f7f0;--lu-muted:#aab19e;--lu-line:rgba(216,255,91,.22);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif}
    *{box-sizing:border-box}
    button{font:inherit}
    .trigger{position:fixed;z-index:2147483000;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;min-height:44px;max-width:min(260px,calc(100vw - 28px));padding:7px 12px 7px 8px;border:1px solid var(--lu-line);border-radius:999px;background:rgba(11,14,9,.94);color:var(--lu-text);box-shadow:0 10px 34px rgba(0,0,0,.35);cursor:pointer;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
    .trigger:hover{border-color:rgba(216,255,91,.5)}
    .avatar,.avatar-fallback{width:30px;height:30px;flex:0 0 30px;border-radius:50%;object-fit:cover}
    .avatar-fallback{display:grid;place-items:center;background:var(--lu-lime);color:#11150c;font-size:12px;font-weight:950}
    .trigger-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:900;letter-spacing:.03em}
    .dot{width:7px;height:7px;border-radius:50%;background:#6f7569}.dot.on{background:var(--lu-lime);box-shadow:0 0 10px rgba(216,255,91,.65)}
    .backdrop{position:fixed;z-index:2147483001;inset:0;background:rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .15s ease}
    .backdrop.open{opacity:1;pointer-events:auto}
    .panel{position:fixed;z-index:2147483002;right:max(14px,env(safe-area-inset-right));bottom:max(68px,calc(env(safe-area-inset-bottom) + 62px));width:min(380px,calc(100vw - 28px));max-height:min(680px,calc(100dvh - 96px));overflow:auto;border:1px solid var(--lu-line);border-radius:22px;background:linear-gradient(145deg,#171c12,#0c0f0a);color:var(--lu-text);box-shadow:0 26px 80px rgba(0,0,0,.55);transform:translateY(12px) scale(.98);opacity:0;pointer-events:none;transition:.16s ease;padding:20px}
    .panel.open{transform:none;opacity:1;pointer-events:auto}
    .panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.eyebrow{font-size:9px;font-weight:950;letter-spacing:.16em;color:var(--lu-lime)}
    .close{width:34px;height:34px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:transparent;color:var(--lu-text);cursor:pointer;font-size:18px}
    h2{font-size:26px;line-height:1.1;letter-spacing:-.04em;margin:5px 0 8px}.lead{font-size:12px;line-height:1.7;color:var(--lu-muted);margin:0 0 18px}
    .google,.secondary{width:100%;min-height:46px;border-radius:13px;cursor:pointer;font-weight:900}.google{border:0;background:#fff;color:#202124;display:flex;align-items:center;justify-content:center;gap:10px}.google:disabled,.secondary:disabled{opacity:.55;cursor:wait}
    .g{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:16px;font-weight:950;color:#4285f4;background:#fff}
    .secondary{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.04);color:var(--lu-text)}
    .user{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.035)}.user .avatar,.user .avatar-fallback{width:42px;height:42px;flex-basis:42px}.who{min-width:0}.name{font-size:14px;font-weight:950;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.email{font-size:10px;color:var(--lu-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}
    .sync{display:flex;align-items:center;gap:7px;margin:12px 1px 16px;font-size:10px;color:var(--lu-muted)}.sync .dot{flex:0 0 auto}
    .stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:15px 0}.stat{padding:13px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}.stat strong{display:block;font-size:24px;color:var(--lu-lime)}.stat span{font-size:9px;letter-spacing:.08em;color:var(--lu-muted);font-weight:900}
    .history-title{font-size:10px;letter-spacing:.12em;font-weight:950;margin:17px 0 8px}.history{display:grid;gap:7px;margin-bottom:16px}.history a{display:flex;justify-content:space-between;gap:12px;padding:10px 11px;border:1px solid rgba(255,255,255,.075);border-radius:12px;color:var(--lu-text);text-decoration:none;background:rgba(255,255,255,.025)}.history-name{font-size:11px;font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.history-meta{font-size:9px;color:var(--lu-muted);white-space:nowrap}.empty{font-size:11px;color:var(--lu-muted);padding:10px 2px 15px}
    .message{font-size:10px;line-height:1.5;color:var(--lu-muted);margin:10px 1px}.message.error{color:#ffb7a7}
    .privacy{font-size:9px;line-height:1.6;color:#7f8776;margin:13px 2px 0}
    @media(max-width:600px){.panel{left:10px;right:10px;bottom:max(66px,calc(env(safe-area-inset-bottom) + 60px));width:auto;max-height:calc(100dvh - 84px);border-radius:20px}.trigger{right:10px;bottom:max(10px,env(safe-area-inset-bottom))}}
    @media(prefers-reduced-motion:reduce){.panel,.backdrop{transition:none}}
  `;
  root.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.addEventListener('click', closePanel);
  root.appendChild(backdrop);

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'LEVEL UP アカウント');
  root.appendChild(panel);

  const trigger = document.createElement('button');
  trigger.className = 'trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-label', 'LEVEL UP アカウントを開く');
  trigger.addEventListener('click', openPanel);
  root.appendChild(trigger);

  function avatar(user, extraClass = '') {
    if (user?.photoURL) return `<img class="avatar ${extraClass}" src="${escapeHtml(user.photoURL)}" alt="" referrerpolicy="no-referrer">`;
    const initial = (user?.displayName || user?.email || 'L').trim().slice(0, 1).toUpperCase();
    return `<span class="avatar-fallback ${extraClass}">${escapeHtml(initial)}</span>`;
  }

  function formatDate(value) {
    const date = value?.toDate ? value.toDate() : new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
  }

  function safeGamePath(value, slug) {
    const path = String(value || '');
    return /^\/apps\/[a-z0-9-]+\/$/.test(path) ? path : '/apps/' + encodeURIComponent(slug) + '/';
  }

  function render() {
    const user = state.user;
    trigger.innerHTML = user
      ? `${avatar(user)}<span class="trigger-label">${escapeHtml(user.displayName || 'ログイン中')}</span><span class="dot on"></span>`
      : `<span class="avatar-fallback">L</span><span class="trigger-label">ログイン</span><span class="dot"></span>`;

    const pendingCount = Object.keys(readPendingHistory()).length;
    const history = state.history.slice(0, 5);
    const historyHtml = history.length
      ? history.map((item) => `<a href="${escapeHtml(safeGamePath(item.path, item.slug))}"><span class="history-name">${escapeHtml(item.title || item.slug)}</span><span class="history-meta">${escapeHtml(formatDate(item.lastPlayedAt))} · ${Number(item.playCount) || 1}回</span></a>`).join('')
      : '<div class="empty">まだプレイ履歴はありません。</div>';
    const messageHtml = state.message ? `<div class="message ${state.messageKind === 'error' ? 'error' : ''}">${escapeHtml(state.message)}</div>` : '';

    panel.innerHTML = user ? `
      <div class="panel-head"><div><div class="eyebrow">HITOBITO / LEVEL UP</div><h2>マイデータ</h2></div><button class="close" type="button" aria-label="閉じる">×</button></div>
      <div class="user">${avatar(user)}<div class="who"><div class="name">${escapeHtml(user.displayName || 'LEVEL UP ユーザー')}</div><div class="email">${escapeHtml(user.email || '')}</div></div></div>
      <div class="sync"><span class="dot on"></span><span>${state.busy ? 'クラウドと同期中…' : 'Googleアカウントで同期済み'}</span></div>
      <div class="stats"><div class="stat"><strong>${state.favorites.size}</strong><span>お気に入り</span></div><div class="stat"><strong>${state.history.length}</strong><span>プレイしたゲーム</span></div></div>
      <div class="history-title">最近のプレイ</div><div class="history">${historyHtml}</div>
      ${messageHtml}
      <button class="secondary" data-action="logout" type="button" ${state.busy ? 'disabled' : ''}>ログアウト</button>
    ` : `
      <div class="panel-head"><div><div class="eyebrow">HITOBITO / LEVEL UP</div><h2>続きから遊ぶ</h2></div><button class="close" type="button" aria-label="閉じる">×</button></div>
      <p class="lead">Googleでログインすると、LEVEL UP共通でお気に入りとプレイ履歴を残せます。</p>
      <div class="stats"><div class="stat"><strong>${state.favorites.size}</strong><span>端末のお気に入り</span></div><div class="stat"><strong>${pendingCount}</strong><span>端末のプレイ履歴</span></div></div>
      ${messageHtml}
      <button class="google" data-action="login" type="button" ${state.busy ? 'disabled' : ''}><span class="g">G</span><span>Googleでログイン</span></button>
      <p class="privacy">ログイン前のデータも、ログイン後に同じアカウントへまとめます。ゲームのプレイ内容そのものは保存しません。</p>
    `;

    panel.querySelector('.close')?.addEventListener('click', closePanel);
    panel.querySelector('[data-action="login"]')?.addEventListener('click', signIn);
    panel.querySelector('[data-action="logout"]')?.addEventListener('click', signOut);
  }

  function openPanel() {
    state.panelOpen = true;
    panel.classList.add('open');
    backdrop.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.querySelector('.close')?.focus();
  }

  function closePanel() {
    state.panelOpen = false;
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.panelOpen) closePanel();
  });

  function applyFavoritesToHome() {
    if (!isHome) return;
    document.querySelectorAll('[data-favorite]').forEach((button) => {
      const slug = button.dataset.favorite;
      const on = state.favorites.has(slug);
      button.classList.toggle('is-on', on);
      button.closest('.card')?.classList.toggle('is-favorite', on);
      button.textContent = on ? '♥' : '♡';
      button.setAttribute('aria-pressed', String(on));
      const title = button.closest('.card')?.querySelector('h2')?.textContent || slug;
      button.setAttribute('aria-label', title + (on ? 'をお気に入りから外す' : 'をお気に入りに追加'));
    });
    const grid = document.querySelector('.grid');
    if (grid) {
      const cards = [...grid.querySelectorAll('.card')];
      cards.sort((a, b) => Number(state.favorites.has(b.dataset.game)) - Number(state.favorites.has(a.dataset.game)));
      cards.forEach((card) => grid.appendChild(card));
    }
    window.dispatchEvent(new CustomEvent('levelup:favorites-synced', { detail: { favorites: [...state.favorites] } }));
  }

  function listenForFavoriteChanges() {
    if (!isHome) return;
    document.querySelectorAll('[data-favorite]').forEach((button) => {
      button.addEventListener('click', () => {
        queueMicrotask(async () => {
          state.favorites = readFavorites();
          render();
          if (!state.user || !state.db) return;
          try {
            await state.db.collection('levelupUsers').doc(state.user.uid).set({
              favorites: [...state.favorites],
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          } catch (error) {
            state.message = friendlyError(error);
            state.messageKind = 'error';
            render();
          }
        });
      });
    });
  }

  async function mergeFavorites() {
    const ref = state.db.collection('levelupUsers').doc(state.user.uid);
    const snapshot = await ref.get();
    const remote = snapshot.exists && Array.isArray(snapshot.data()?.favorites) ? snapshot.data().favorites : [];
    state.favorites = new Set([...remote, ...readFavorites()]);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
    await ref.set({
      favorites: [...state.favorites],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    applyFavoritesToHome();
  }

  async function uploadPendingHistory() {
    const pending = readPendingHistory();
    const entries = Object.values(pending).filter((item) => item?.slug);
    if (!entries.length) return;
    const batch = state.db.batch();
    for (const item of entries) {
      const ref = state.db.collection('levelupUsers').doc(state.user.uid).collection('history').doc(item.slug);
      const parsedDate = new Date(item.lastPlayedAt || Date.now());
      batch.set(ref, {
        slug: item.slug,
        title: item.title || item.slug,
        path: item.path || '/apps/' + item.slug + '/',
        lastPlayedAt: firebase.firestore.Timestamp.fromDate(Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate),
        playCount: firebase.firestore.FieldValue.increment(Math.max(1, Number(item.playCount) || 1)),
      }, { merge: true });
    }
    await batch.commit();
    localStorage.removeItem(HISTORY_KEY);
  }

  async function loadHistory() {
    const snapshot = await state.db.collection('levelupUsers').doc(state.user.uid)
      .collection('history').orderBy('lastPlayedAt', 'desc').limit(100).get();
    state.history = snapshot.docs.map((doc) => ({ slug: doc.id, ...doc.data() }));
  }

  async function syncUserData() {
    if (!state.user || !state.db) return;
    state.busy = true;
    state.message = '';
    render();
    try {
      await mergeFavorites();
      await uploadPendingHistory();
      await loadHistory();
      state.message = 'お気に入りとプレイ履歴を同期しました。';
      state.messageKind = 'success';
    } catch (error) {
      console.warn('[LEVEL UP account] sync failed', error);
      state.message = friendlyError(error);
      state.messageKind = 'error';
    } finally {
      state.busy = false;
      render();
    }
  }

  async function signIn() {
    if (!state.auth || state.busy) return;
    state.busy = true;
    state.message = '';
    render();
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await state.auth.signInWithPopup(provider);
    } catch (error) {
      console.warn('[LEVEL UP account] sign-in failed', error);
      state.message = friendlyError(error);
      state.messageKind = 'error';
      state.busy = false;
      render();
    }
  }

  async function signOut() {
    if (!state.auth || state.busy) return;
    state.busy = true;
    render();
    try {
      await state.auth.signOut();
      state.message = 'ログアウトしました。お気に入りはこの端末にも残っています。';
      state.messageKind = 'success';
    } catch (error) {
      state.message = friendlyError(error);
      state.messageKind = 'error';
    } finally {
      state.busy = false;
      render();
    }
  }

  async function initializeFirebase() {
    if (!window.firebase?.auth || !window.firebase?.firestore || !firebase.apps?.length) {
      state.message = 'ログイン機能を読み込めませんでした。端末への保存は続いています。';
      state.messageKind = 'error';
      render();
      return;
    }
    try {
      state.auth = firebase.auth();
      state.db = firebase.firestore();
      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      state.auth.onAuthStateChanged(async (user) => {
        state.user = user;
        state.history = [];
        state.busy = false;
        render();
        if (user) await syncUserData();
      });
    } catch (error) {
      console.warn('[LEVEL UP account] initialization failed', error);
      state.message = friendlyError(error);
      state.messageKind = 'error';
      render();
    }
  }

  savePendingPlay();
  listenForFavoriteChanges();
  render();
  initializeFirebase();
}

const accountScript = `(${accountBootstrap.toString()})();\n`;

fs.writeFileSync(assetPath, accountScript);

const sdkScripts = (attributes) => `
  <script src="/__/firebase/8.10.1/firebase-app.js" data-levelup-account-sdk></script>
  <script src="/__/firebase/8.10.1/firebase-auth.js" data-levelup-account-sdk></script>
  <script src="/__/firebase/8.10.1/firebase-firestore.js" data-levelup-account-sdk></script>
  <script src="/__/firebase/init.js" data-levelup-account-sdk></script>
  <script src="/levelup-account.js" ${marker} ${attributes}></script>
`;

function inject(indexPath, attributes) {
  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(marker)) return false;
  const snippet = sdkScripts(attributes);
  html = html.includes('</body>') ? html.replace('</body>', `${snippet}</body>`) : `${html}${snippet}`;
  fs.writeFileSync(indexPath, html);
  return true;
}

let injected = 0;
if (inject(path.join(outDir, 'index.html'), 'data-page="home"')) injected += 1;

for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  if (inject(indexPath, `data-game-slug="${entry.name.replaceAll('"', '&quot;')}"`)) injected += 1;
}

if (!fs.existsSync(assetPath) || !fs.readFileSync(path.join(outDir, 'index.html'), 'utf8').includes(marker)) {
  throw new Error('LEVEL UP account injection failed.');
}

console.log(`[Firebase] LEVEL UP account injected into ${injected} pages`);
