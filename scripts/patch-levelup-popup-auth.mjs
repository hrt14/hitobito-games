import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const accountPath = path.join(outDir, 'levelup-account.js');
const appsDir = path.join(outDir, 'apps');
const FIREBASE_VERSION = '12.16.0';

if (!fs.existsSync(accountPath)) {
  throw new Error('LEVEL UP account bundle not found. Run inject-levelup-account.mjs first.');
}

let source = fs.readFileSync(accountPath, 'utf8');

const genericError = "    return '接続に失敗しました。端末への保存は続いています。';";
const diagnosticError = "    return '接続に失敗しました' + (code ? '（' + code + '）' : '') + '。端末への保存は続いています。';";
if (!source.includes("(code ? '（' + code + '）' : '')")) {
  if (!source.includes(genericError)) throw new Error('Could not find LEVEL UP generic auth error text.');
  source = source.replace(genericError, diagnosticError);
}

const networkErrorNeedle = "    if (code.includes('unavailable') || code.includes('network-request-failed')) return '通信できません。端末への保存は続いています。';";
const networkErrorReplacement = [
  "    if (code.includes('internal-error')) return 'Googleログイン処理で内部エラーが発生しました（auth/internal-error）。';",
  "    if (code.includes('sdk-app-missing')) return 'Firebase本体を読み込めませんでした（auth/sdk-app-missing）。';",
  "    if (code.includes('sdk-auth-missing')) return 'Firebase Authenticationを読み込めませんでした（auth/sdk-auth-missing）。';",
  "    if (code.includes('config-fetch-failed')) return 'Firebase認証設定を読み込めませんでした（auth/config-fetch-failed）。';",
  networkErrorNeedle,
].join('\n');
if (!source.includes("code.includes('sdk-auth-missing')")) {
  if (!source.includes(networkErrorNeedle)) throw new Error('Could not find LEVEL UP network auth error text.');
  source = source.replace(networkErrorNeedle, networkErrorReplacement);
}

const popupCall = '      await state.auth.signInWithPopup(provider);';
const popupHandled = [
  "      const result = await state.auth.signInWithPopup(provider);",
  "      if (result?.user) {",
  "        state.user = result.user;",
  "        state.busy = false;",
  "        state.message = state.db ? 'Googleログインが完了しました。' : 'Googleログインが完了しました。クラウド同期は現在利用できません。';",
  "        state.messageKind = state.db ? 'success' : 'error';",
  "        render();",
  "      }",
].join('\n');
if (!source.includes('const result = await state.auth.signInWithPopup(provider);')) {
  if (!source.includes(popupCall)) throw new Error('Could not find LEVEL UP popup sign-in call.');
  source = source.replace(popupCall, popupHandled);
}

const initializeNeedle = `  async function initializeFirebase() {
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
  }`;

const initializeReplacement = `  async function initializeFirebase() {
    try {
      if (!window.firebase?.initializeApp) {
        const sdkError = new Error('Firebase app SDK unavailable');
        sdkError.code = 'auth/sdk-app-missing';
        throw sdkError;
      }
      if (!window.firebase?.auth) {
        const sdkError = new Error('Firebase Auth SDK unavailable');
        sdkError.code = 'auth/sdk-auth-missing';
        throw sdkError;
      }

      let app = firebase.apps?.[0] || null;
      if (!app) {
        const response = await fetch('/__/firebase/init.json', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) {
          const configError = new Error('Firebase config fetch failed');
          configError.code = 'auth/config-fetch-failed';
          throw configError;
        }
        const config = await response.json();
        // Keep Firebase Hosting's default *.firebaseapp.com authDomain here.
        // Popup auth communicates with that helper window directly and does not
        // require a custom OAuth redirect URI on levelup.hitobito.jp.
        app = firebase.initializeApp(config);
      }

      state.auth = app.auth();
      state.db = window.firebase?.firestore && typeof app.firestore === 'function' ? app.firestore() : null;
      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      // Clear state left behind by the previous redirect implementation so an
      // old Safari tab cannot keep surfacing a redirect error after this build.
      try {
        sessionStorage.removeItem('levelup-auth-redirect-pending-v3');
        sessionStorage.removeItem('levelup-auth-redirect-pending-v4');
        sessionStorage.removeItem('levelup-auth-redirect-pending-v5');
      } catch {}
      const currentUrl = new URL(location.href);
      if (currentUrl.searchParams.has('_lu_auth_return')) {
        currentUrl.searchParams.delete('_lu_auth_return');
        history.replaceState(null, '', currentUrl.pathname + currentUrl.search + currentUrl.hash);
      }

      state.auth.onAuthStateChanged(async (user) => {
        state.user = user;
        state.history = [];
        state.busy = false;
        render();
        if (user && state.db) await syncUserData();
      });
    } catch (error) {
      console.warn('[LEVEL UP account] initialization failed', error);
      state.message = friendlyError(error);
      state.messageKind = 'error';
      state.busy = false;
      render();
    }
  }`;

if (!source.includes("sessionStorage.removeItem('levelup-auth-redirect-pending-v5')")) {
  if (!source.includes(initializeNeedle)) throw new Error('Could not find LEVEL UP Firebase initialization block.');
  source = source.replace(initializeNeedle, initializeReplacement);
}

fs.writeFileSync(accountPath, source);

const pages = [path.join(outDir, 'index.html')];
if (fs.existsSync(appsDir)) {
  for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(appsDir, entry.name, 'index.html');
    if (fs.existsSync(indexPath)) pages.push(indexPath);
  }
}

const accountVersion = createHash('sha256').update(source).digest('hex').slice(0, 12);
let patchedPages = 0;
for (const page of pages) {
  let html = fs.readFileSync(page, 'utf8');
  const before = html;

  html = html
    .replaceAll('/__/firebase/8.10.1/firebase-app.js', `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`)
    .replaceAll('/__/firebase/8.10.1/firebase-auth.js', `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`)
    .replaceAll('/__/firebase/8.10.1/firebase-firestore.js', `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`)
    .replaceAll('  <script src="/__/firebase/init.js" data-levelup-account-sdk></script>\n', '');

  html = html.replace(/src="\/levelup-account\.js(?:\?v=[^"]*)?"/g, `src="/levelup-account.js?v=${accountVersion}"`);

  if (html !== before) patchedPages += 1;
  fs.writeFileSync(page, html);
}

const required = [
  'signInWithPopup(provider)',
  "fetch('/__/firebase/init.json'",
  "sessionStorage.removeItem('levelup-auth-redirect-pending-v5')",
  "state.message = state.db ? 'Googleログインが完了しました。'",
];
for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`LEVEL UP popup auth hardening missing: ${marker}`);
}
if (source.includes('signInWithRedirect(provider)') || source.includes('getRedirectResult()') || source.includes("config.authDomain = location.hostname")) {
  throw new Error('LEVEL UP account bundle still contains custom-domain redirect auth.');
}
if (patchedPages !== pages.length) {
  throw new Error(`LEVEL UP auth page patch incomplete: ${patchedPages}/${pages.length}`);
}
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  for (const asset of [
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`,
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`,
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`,
    `/levelup-account.js?v=${accountVersion}`,
  ]) {
    if (!html.includes(asset)) throw new Error(`LEVEL UP page missing ${asset}: ${page}`);
  }
  if (html.includes('/__/firebase/init.js')) throw new Error(`LEVEL UP page still auto-initializes Firebase: ${page}`);
}

console.log(`[Firebase] LEVEL UP auth patched: Firebase ${FIREBASE_VERSION} compat + popup auth + stale redirect cleanup on ${pages.length} pages; account=${accountVersion}`);
