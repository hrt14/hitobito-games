import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const accountPath = path.join(outDir, 'levelup-account.js');
const appsDir = path.join(outDir, 'apps');

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
  "    if (code.includes('redirect-result-empty')) return 'Google認証から戻りましたが、ログイン状態を受け取れませんでした（auth/redirect-result-empty）。';",
  "    if (code.includes('config-fetch-failed')) return 'Firebase認証設定を読み込めませんでした（auth/config-fetch-failed）。';",
  networkErrorNeedle,
].join('\n');
if (!source.includes("code.includes('redirect-result-empty')")) {
  if (!source.includes(networkErrorNeedle)) throw new Error('Could not find LEVEL UP network auth error text.');
  source = source.replace(networkErrorNeedle, networkErrorReplacement);
}

const popupCall = '      await state.auth.signInWithPopup(provider);';
const signInHandled = [
  "      const isMobileAuth = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)",
  "        || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);",
  "      if (isMobileAuth) {",
  "        try { sessionStorage.setItem('levelup-auth-redirect-pending-v3', String(Date.now())); } catch {}",
  "        const returnUrl = new URL(location.href);",
  "        returnUrl.searchParams.set('_lu_auth_return', '1');",
  "        history.replaceState(null, '', returnUrl.pathname + returnUrl.search + returnUrl.hash);",
  "        await state.auth.signInWithRedirect(provider);",
  "        return;",
  "      }",
  "      const result = await state.auth.signInWithPopup(provider);",
  "      if (result?.user) {",
  "        state.user = result.user;",
  "        state.busy = false;",
  "        state.message = 'Googleログインが完了しました。';",
  "        state.messageKind = 'success';",
  "        render();",
  "      }",
].join('\n');
if (!source.includes("levelup-auth-redirect-pending-v3")) {
  if (!source.includes(popupCall)) throw new Error('Could not find LEVEL UP popup sign-in call.');
  source = source.replace(popupCall, signInHandled);
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
    if (!window.firebase?.auth || !window.firebase?.firestore) {
      state.message = 'ログイン機能を読み込めませんでした。端末への保存は続いています。';
      state.messageKind = 'error';
      render();
      return;
    }
    try {
      let app = firebase.apps?.[0] || null;
      if (!app) {
        const response = await fetch('/__/firebase/init.json', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) {
          const configError = new Error('Firebase config fetch failed');
          configError.code = 'auth/config-fetch-failed';
          throw configError;
        }
        const config = await response.json();
        if (location.hostname === 'levelup.hitobito.jp') config.authDomain = location.hostname;
        app = firebase.initializeApp(config);
      }

      state.auth = app.auth();
      state.db = app.firestore();
      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      let redirectPending = false;
      try {
        redirectPending = Boolean(sessionStorage.getItem('levelup-auth-redirect-pending-v3'));
      } catch {}
      const currentUrl = new URL(location.href);
      if (currentUrl.searchParams.has('_lu_auth_return')) {
        redirectPending = true;
        currentUrl.searchParams.delete('_lu_auth_return');
        history.replaceState(null, '', currentUrl.pathname + currentUrl.search + currentUrl.hash);
      }

      try {
        const redirectResult = await state.auth.getRedirectResult();
        try { sessionStorage.removeItem('levelup-auth-redirect-pending-v3'); } catch {}
        if (redirectResult?.user) {
          state.user = redirectResult.user;
          state.message = 'Googleログインが完了しました。';
          state.messageKind = 'success';
          state.busy = false;
          render();
        } else if (redirectPending && !state.auth.currentUser) {
          const redirectError = new Error('Redirect result was empty');
          redirectError.code = 'auth/redirect-result-empty';
          console.warn('[LEVEL UP account] redirect returned without a user', {
            host: location.hostname,
            authDomain: app.options?.authDomain || '',
          });
          state.message = friendlyError(redirectError);
          state.messageKind = 'error';
          state.busy = false;
          render();
        }
      } catch (error) {
        try { sessionStorage.removeItem('levelup-auth-redirect-pending-v3'); } catch {}
        console.warn('[LEVEL UP account] redirect result failed', error);
        state.message = friendlyError(error);
        state.messageKind = 'error';
        state.busy = false;
        render();
      }

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
      state.busy = false;
      render();
    }
  }`;

if (!source.includes("fetch('/__/firebase/init.json'")) {
  if (!source.includes(initializeNeedle)) throw new Error('Could not find LEVEL UP Firebase initialization block.');
  source = source.replace(initializeNeedle, initializeReplacement);
}

fs.writeFileSync(accountPath, source);

const initScript = '  <script src="/__/firebase/init.js" data-levelup-account-sdk></script>\n';
const pages = [path.join(outDir, 'index.html')];
if (fs.existsSync(appsDir)) {
  for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(appsDir, entry.name, 'index.html');
    if (fs.existsSync(indexPath)) pages.push(indexPath);
  }
}

let removedInitScripts = 0;
for (const page of pages) {
  let html = fs.readFileSync(page, 'utf8');
  if (html.includes(initScript)) {
    html = html.replaceAll(initScript, '');
    fs.writeFileSync(page, html);
    removedInitScripts += 1;
  }
}

const required = [
  'signInWithRedirect(provider)',
  "fetch('/__/firebase/init.json'",
  "config.authDomain = location.hostname",
  'getRedirectResult()',
  'auth/redirect-result-empty',
  'signInWithPopup(provider)',
];
for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`LEVEL UP same-origin auth hardening missing: ${marker}`);
}

if (removedInitScripts !== pages.length) {
  throw new Error(`LEVEL UP Firebase init.js removal incomplete: ${removedInitScripts}/${pages.length}`);
}
for (const page of pages) {
  if (fs.readFileSync(page, 'utf8').includes('/__/firebase/init.js')) {
    throw new Error(`LEVEL UP page still auto-initializes Firebase: ${page}`);
  }
}

console.log(`[Firebase] LEVEL UP auth patched: mobile redirect + same-origin authDomain + explicit redirect diagnostics on ${pages.length} pages`);
