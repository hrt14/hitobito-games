import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const marker = 'data-levelup-app-menu';

if (!fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after build:hosting.');
}

function menuBootstrap() {
  'use strict';

  if (window.__LEVELUP_APP_MENU_LOADED__) return;
  window.__LEVELUP_APP_MENU_LOADED__ = true;

  const FAVORITES_KEY = 'hitobito-levelup-favorites-v1';
  const script = document.currentScript;
  const gameSlug = script?.dataset.gameSlug || '';
  if (!gameSlug) return;

  function readFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []);
    } catch {
      return new Set();
    }
  }

  function writeFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
    window.dispatchEvent(new CustomEvent('levelup:favorites-changed', {
      detail: { slug: gameSlug, favorites: [...favorites] },
    }));
  }

  function cleanTitle(title) {
    return String(title || '')
      .replace(/\s*[|｜]\s*(hitobito\s*)?LEVEL\s*UP.*$/i, '')
      .replace(/\s*[|｜]\s*hitobito.*$/i, '')
      .trim();
  }

  function currentTitle() {
    return cleanTitle(document.title) || gameSlug;
  }

  const host = document.createElement('div');
  host.id = 'levelup-app-menu-root';
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host{all:initial;color-scheme:dark;--lu-lime:#d8ff5b;--lu-bg:#0c0f0a;--lu-text:#f6f7f2;--lu-muted:#aeb5a4;--lu-line:rgba(216,255,91,.24);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif}
    *{box-sizing:border-box}
    button,a{font:inherit}
    .menu-trigger{position:fixed;z-index:2147483400;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));width:48px;height:48px;display:grid;place-items:center;border:1px solid var(--lu-line);border-radius:16px;background:rgba(10,13,8,.88);color:var(--lu-text);box-shadow:0 10px 32px rgba(0,0,0,.34);cursor:pointer;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
    .menu-trigger:active{transform:scale(.96)}
    .hamburger{width:20px;height:14px;display:flex;flex-direction:column;justify-content:space-between}
    .hamburger span{display:block;height:2px;border-radius:999px;background:currentColor}
    .backdrop{position:fixed;z-index:2147483401;inset:0;background:rgba(0,0,0,.52);opacity:0;pointer-events:none;transition:opacity .15s ease}
    .backdrop.open{opacity:1;pointer-events:auto}
    .sheet{position:fixed;z-index:2147483402;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));width:min(340px,calc(100vw - 24px));border:1px solid var(--lu-line);border-radius:22px;background:linear-gradient(145deg,#171c12,#0b0e09);color:var(--lu-text);box-shadow:0 28px 90px rgba(0,0,0,.55);padding:16px;opacity:0;transform:translateY(-8px) scale(.98);pointer-events:none;transition:.16s ease}
    .sheet.open{opacity:1;transform:none;pointer-events:auto}
    .head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 2px 12px}.kicker{font-size:9px;letter-spacing:.16em;font-weight:950;color:var(--lu-lime)}.title{margin-top:4px;font-size:15px;line-height:1.35;font-weight:950;max-width:245px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.close{width:36px;height:36px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:transparent;color:var(--lu-text);font-size:20px;cursor:pointer}
    .actions{display:grid;gap:8px}.action{width:100%;min-height:54px;display:flex;align-items:center;gap:12px;padding:12px 13px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.035);color:var(--lu-text);text-decoration:none;cursor:pointer;text-align:left}.action:hover{border-color:rgba(216,255,91,.42);background:rgba(216,255,91,.06)}.action:disabled{opacity:.6;cursor:wait}.action-icon{width:31px;height:31px;display:grid;place-items:center;flex:0 0 31px;border-radius:10px;background:rgba(255,255,255,.075);font-size:18px}.favorite.is-on .action-icon{background:var(--lu-lime);color:#12160d}.action-copy{min-width:0;flex:1}.action-copy strong{display:block;font-size:13px;font-weight:950}.action-copy small{display:block;margin-top:3px;font-size:9px;line-height:1.45;color:var(--lu-muted)}
    .status{min-height:18px;padding:10px 3px 0;font-size:9px;line-height:1.5;color:var(--lu-muted)}.status.ok{color:#d8ff9f}.status.error{color:#ffb7a7}
    @media(max-width:600px){.menu-trigger{top:max(9px,env(safe-area-inset-top));right:9px;width:46px;height:46px;border-radius:15px}.sheet{top:max(8px,env(safe-area-inset-top));right:8px;left:8px;width:auto}}
    @media(prefers-reduced-motion:reduce){.backdrop,.sheet{transition:none}}
  `;
  root.appendChild(style);

  const trigger = document.createElement('button');
  trigger.className = 'menu-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-label', 'メニューを開く');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<span class="hamburger" aria-hidden="true"><span></span><span></span><span></span></span>';
  root.appendChild(trigger);

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  root.appendChild(backdrop);

  const sheet = document.createElement('section');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'LEVEL UP メニュー');
  sheet.innerHTML = `
    <div class="head">
      <div><div class="kicker">LEVEL UP</div><div class="title"></div></div>
      <button class="close" type="button" aria-label="閉じる">×</button>
    </div>
    <div class="actions">
      <button class="action favorite" data-action="favorite" type="button" aria-pressed="false">
        <span class="action-icon">♡</span>
        <span class="action-copy"><strong>お気に入りに追加</strong><small>あとでトップからすぐ開けます</small></span>
      </button>
      <a class="action" href="/">
        <span class="action-icon">⌂</span>
        <span class="action-copy"><strong>LEVEL UP トップ</strong><small>ほかのトレーニングを見る</small></span>
      </a>
      <button class="action" data-action="account" type="button">
        <span class="action-icon">◎</span>
        <span class="action-copy"><strong>ログイン・マイデータ</strong><small>お気に入りと履歴を同期</small></span>
      </button>
    </div>
    <div class="status" role="status" aria-live="polite"></div>
  `;
  root.appendChild(sheet);

  const titleNode = sheet.querySelector('.title');
  const favoriteButton = sheet.querySelector('[data-action="favorite"]');
  const accountButton = sheet.querySelector('[data-action="account"]');
  const closeButton = sheet.querySelector('.close');
  const status = sheet.querySelector('.status');
  let open = false;
  let busy = false;

  function renderFavorite() {
    const on = readFavorites().has(gameSlug);
    favoriteButton.classList.toggle('is-on', on);
    favoriteButton.setAttribute('aria-pressed', String(on));
    favoriteButton.querySelector('.action-icon').textContent = on ? '♥' : '♡';
    favoriteButton.querySelector('strong').textContent = on ? 'お気に入り登録済み' : 'お気に入りに追加';
    favoriteButton.querySelector('small').textContent = on ? 'タップするとお気に入りから外します' : 'あとでトップからすぐ開けます';
  }

  function setStatus(message, kind = '') {
    status.textContent = message || '';
    status.className = 'status' + (kind ? ` ${kind}` : '');
  }

  function openMenu() {
    open = true;
    titleNode.textContent = currentTitle();
    renderFavorite();
    sheet.classList.add('open');
    backdrop.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    closeButton.focus({ preventScroll: true });
  }

  function closeMenu() {
    open = false;
    sheet.classList.remove('open');
    backdrop.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({ preventScroll: true });
  }

  async function syncFavorites(favorites) {
    const firebaseGlobal = window.firebase;
    if (!firebaseGlobal?.auth || !firebaseGlobal?.firestore || !firebaseGlobal.apps?.length) return false;
    const user = firebaseGlobal.auth().currentUser;
    if (!user) return false;
    await firebaseGlobal.firestore().collection('levelupUsers').doc(user.uid).set({
      favorites: [...favorites],
      updatedAt: firebaseGlobal.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  }

  async function toggleFavorite() {
    if (busy) return;
    busy = true;
    favoriteButton.disabled = true;
    setStatus('');
    const favorites = readFavorites();
    const adding = !favorites.has(gameSlug);
    if (adding) favorites.add(gameSlug);
    else favorites.delete(gameSlug);
    writeFavorites(favorites);
    renderFavorite();
    try {
      const synced = await syncFavorites(favorites);
      setStatus(adding
        ? (synced ? 'お気に入りに追加し、クラウドにも同期しました。' : 'お気に入りに追加しました。')
        : (synced ? 'お気に入りから外し、クラウドにも同期しました。' : 'お気に入りから外しました。'), 'ok');
    } catch (error) {
      console.warn('[LEVEL UP app menu] favorite sync failed', error);
      setStatus('端末には保存しました。クラウド同期は次回ログイン時に再試行します。', 'error');
    } finally {
      busy = false;
      favoriteButton.disabled = false;
    }
  }

  function openAccount() {
    closeMenu();
    const accountHost = document.getElementById('levelup-account-root');
    const accountTrigger = accountHost?.shadowRoot?.querySelector('.trigger');
    if (accountTrigger) accountTrigger.click();
    else location.href = '/';
  }

  trigger.addEventListener('click', () => open ? closeMenu() : openMenu());
  backdrop.addEventListener('click', closeMenu);
  closeButton.addEventListener('click', closeMenu);
  favoriteButton.addEventListener('click', toggleFavorite);
  accountButton.addEventListener('click', openAccount);
  window.addEventListener('storage', (event) => {
    if (event.key === FAVORITES_KEY) renderFavorite();
  });
  window.addEventListener('levelup:favorites-changed', renderFavorite);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) closeMenu();
  });

  renderFavorite();
}

const menuScript = `(${menuBootstrap.toString()})();`;
let injected = 0;

for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(marker)) continue;
  const snippet = `\n  <script ${marker} data-game-slug="${entry.name.replaceAll('"', '&quot;')}">${menuScript}</script>\n`;
  html = html.includes('</body>') ? html.replace('</body>', `${snippet}</body>`) : `${html}${snippet}`;
  fs.writeFileSync(indexPath, html);
  injected += 1;
}

if (!injected) {
  throw new Error('LEVEL UP app menu injection found no app pages.');
}

let verified = 0;
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(marker) || !html.includes('お気に入りに追加') || !html.includes('menu-trigger')) {
    throw new Error(`LEVEL UP app menu missing from ${entry.name}`);
  }
  verified += 1;
}

console.log(`[Firebase] LEVEL UP hamburger favorite menu injected into ${injected} pages; verified ${verified}`);
