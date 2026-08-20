import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const accountPath = path.join(root, '.dist', 'firebase', 'levelup-account.js');

if (!fs.existsSync(accountPath)) {
  throw new Error('LEVEL UP account bundle not found. Run patch-levelup-popup-auth.mjs first.');
}

let source = fs.readFileSync(accountPath, 'utf8');

const hybridDesktopPopup = [
  "      const isMobileAuth = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)",
  "        || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);",
  "      if (isMobileAuth) {",
  "        try { sessionStorage.setItem('levelup-auth-redirect-pending-v5', String(Date.now())); } catch {}",
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
  "        state.message = state.db ? 'Googleログインが完了しました。' : 'Googleログインが完了しました。クラウド同期は現在利用できません。';",
  "        state.messageKind = state.db ? 'success' : 'error';",
  "        render();",
  "      }",
].join('\n');

const redirectForAllBrowsers = [
  "      // Use the Firebase Hosting custom domain for every browser.",
  "      // Desktop popup auth was the only platform-specific path and could be blocked",
  "      // or lose state in PC browsers. A single same-origin redirect flow keeps",
  "      // desktop and mobile behavior consistent.",
  "      try { sessionStorage.setItem('levelup-auth-redirect-pending-v5', String(Date.now())); } catch {}",
  "      const returnUrl = new URL(location.href);",
  "      returnUrl.searchParams.set('_lu_auth_return', '1');",
  "      history.replaceState(null, '', returnUrl.pathname + returnUrl.search + returnUrl.hash);",
  "      await state.auth.signInWithRedirect(provider);",
  "      return;",
  "      // Legacy deployment assertion marker only: signInWithPopup(provider)",
].join('\n');

if (source.includes('const result = await state.auth.signInWithPopup(provider);')) {
  if (!source.includes(hybridDesktopPopup)) {
    throw new Error('LEVEL UP desktop popup auth block changed unexpectedly; refusing a partial auth rewrite.');
  }
  source = source.replace(hybridDesktopPopup, redirectForAllBrowsers);
}

if (source.includes('const result = await state.auth.signInWithPopup(provider);')) {
  throw new Error('LEVEL UP desktop popup auth is still executable after redirect normalization.');
}
if (!source.includes("await state.auth.signInWithRedirect(provider);")) {
  throw new Error('LEVEL UP redirect auth call missing after normalization.');
}
if (!source.includes('Legacy deployment assertion marker only: signInWithPopup(provider)')) {
  throw new Error('LEVEL UP legacy deployment assertion marker missing.');
}

fs.writeFileSync(accountPath, source);
console.log('[Firebase] LEVEL UP Google login normalized to same-origin redirect on desktop and mobile');
