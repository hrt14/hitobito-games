import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const accountPath = path.join(outDir, 'levelup-account.js');
const bridgePath = path.join(outDir, 'levelup-auth-bridge.html');

if (!fs.existsSync(accountPath)) {
  throw new Error('LEVEL UP account bundle not found. Run inject-levelup-account.mjs first.');
}

let source = fs.readFileSync(accountPath, 'utf8');

// On iPhone/iPad we deliberately authenticate on the project's firebaseapp.com
// origin. That origin is first-party to Firebase Auth, so Safari's third-party
// storage restrictions do not break the redirect handshake. The resulting
// short-lived Google OAuth credential is returned in the URL fragment and
// immediately exchanged for a Firebase session on levelup.hitobito.jp.
const signInNeedle = '      await state.auth.signInWithPopup(provider);';
const signInReplacement = `      const isMobileAuth = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)\n        || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);\n      if (isMobileAuth && location.hostname === 'levelup.hitobito.jp') {\n        const bridge = new URL('https://hitobito-levelup.firebaseapp.com/levelup-auth-bridge.html');\n        bridge.searchParams.set('return', location.href);\n        location.assign(bridge.toString());\n        return;\n      }\n      await state.auth.signInWithPopup(provider);`;

if (!source.includes('levelup-auth-bridge.html')) {
  if (!source.includes(signInNeedle)) {
    throw new Error('Could not find LEVEL UP Google popup sign-in call to patch.');
  }
  source = source.replace(signInNeedle, signInReplacement);
}

const initNeedle = `  async function initializeFirebase() {`;
const bridgeConsumer = `  function decodeBase64Url(value) {\n    const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');\n    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);\n    return atob(padded);\n  }\n\n  async function consumeBridgeCredential() {\n    const rawHash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;\n    const hash = new URLSearchParams(rawHash);\n    const packed = hash.get('_lu_google');\n    if (!packed) return false;\n\n    // Remove the credential from the visible URL before doing any network work.\n    hash.delete('_lu_google');\n    const cleanHash = hash.toString();\n    history.replaceState(null, '', location.pathname + location.search + (cleanHash ? '#' + cleanHash : ''));\n\n    const payload = JSON.parse(decodeBase64Url(packed));\n    if (!payload?.idToken && !payload?.accessToken) throw new Error('auth/invalid-credential');\n    const credential = firebase.auth.GoogleAuthProvider.credential(\n      payload.idToken || null,\n      payload.accessToken || null,\n    );\n    await state.auth.signInWithCredential(credential);\n    state.message = 'Googleログインが完了しました。';\n    state.messageKind = 'success';\n    return true;\n  }\n\n  async function initializeFirebase() {`;

if (!source.includes('consumeBridgeCredential()')) {
  if (!source.includes(initNeedle)) {
    throw new Error('Could not find LEVEL UP Firebase initialization block to patch.');
  }
  source = source.replace(initNeedle, bridgeConsumer);
}

const persistenceNeedle = `      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);`;
const persistenceReplacement = `${persistenceNeedle}\n      try {\n        await consumeBridgeCredential();\n      } catch (error) {\n        console.warn('[LEVEL UP account] auth bridge credential failed', error);\n        state.message = friendlyError(error);\n        state.messageKind = 'error';\n        state.busy = false;\n        render();\n      }`;

if (!source.includes('auth bridge credential failed')) {
  if (!source.includes(persistenceNeedle)) {
    throw new Error('Could not find LEVEL UP auth persistence call to patch.');
  }
  source = source.replace(persistenceNeedle, persistenceReplacement);
}

fs.writeFileSync(accountPath, source);

const bridgeHtml = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <title>LEVEL UP ログイン</title>
  <style>
    html,body{height:100%;margin:0;background:#10130e;color:#f5f7f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif}
    body{display:grid;place-items:center;padding:24px;box-sizing:border-box}
    main{width:min(420px,100%);text-align:center}
    .mark{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;margin:0 auto 18px;background:#d8ff5b;color:#11150c;font-weight:950;font-size:20px}
    h1{font-size:22px;margin:0 0 10px}p{font-size:13px;line-height:1.7;color:#aab19e;margin:0}.error{color:#ffb7a7;margin-top:14px}
  </style>
</head>
<body>
<main>
  <div class="mark">L</div>
  <h1>Googleログイン</h1>
  <p id="status">ログイン画面を準備しています…</p>
  <p id="error" class="error"></p>
</main>
<script src="/__/firebase/8.10.1/firebase-app.js"></script>
<script src="/__/firebase/8.10.1/firebase-auth.js"></script>
<script src="/__/firebase/init.js"></script>
<script>
(async () => {
  const RETURN_KEY = 'levelup-auth-bridge-return-v1';
  const status = document.getElementById('status');
  const errorNode = document.getElementById('error');
  const requestedReturn = new URLSearchParams(location.search).get('return');

  const isAllowedReturn = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'levelup.hitobito.jp';
    } catch {
      return false;
    }
  };

  if (requestedReturn && isAllowedReturn(requestedReturn)) {
    sessionStorage.setItem(RETURN_KEY, requestedReturn);
  }
  const returnUrl = isAllowedReturn(requestedReturn)
    ? requestedReturn
    : sessionStorage.getItem(RETURN_KEY);

  if (!isAllowedReturn(returnUrl)) {
    status.textContent = '戻り先を確認できませんでした。';
    errorNode.textContent = 'LEVEL UPからもう一度ログインしてください。';
    return;
  }

  const encodeBase64Url = (value) => btoa(value)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  try {
    const auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    const result = await auth.getRedirectResult();

    if (result && result.user && result.credential) {
      const oauth = result.credential;
      if (!oauth.idToken && !oauth.accessToken) throw new Error('Google credential was empty');

      const payload = encodeBase64Url(JSON.stringify({
        idToken: oauth.idToken || null,
        accessToken: oauth.accessToken || null,
      }));
      const target = new URL(returnUrl);
      const hash = new URLSearchParams(target.hash.startsWith('#') ? target.hash.slice(1) : target.hash);
      hash.set('_lu_google', payload);
      target.hash = hash.toString();
      sessionStorage.removeItem(RETURN_KEY);
      status.textContent = 'LEVEL UPへ戻ります…';
      location.replace(target.toString());
      return;
    }

    status.textContent = 'Googleアカウントを選択してください…';
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await auth.signInWithRedirect(provider);
  } catch (error) {
    console.error('[LEVEL UP auth bridge]', error);
    status.textContent = 'ログインを完了できませんでした。';
    errorNode.textContent = error && error.message ? error.message : 'もう一度LEVEL UPからお試しください。';
  }
})();
</script>
</body>
</html>`;

fs.writeFileSync(bridgePath, bridgeHtml);

const required = [
  'levelup-auth-bridge.html',
  'signInWithCredential(credential)',
  'consumeBridgeCredential()',
  "hash.get('_lu_google')",
];

for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`LEVEL UP mobile auth bridge patch missing: ${marker}`);
}
if (!fs.existsSync(bridgePath) || !fs.readFileSync(bridgePath, 'utf8').includes('getRedirectResult()')) {
  throw new Error('LEVEL UP Firebase auth bridge generation failed.');
}

console.log('[Firebase] LEVEL UP mobile auth now uses firebaseapp.com credential bridge');
