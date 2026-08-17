import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const accountPath = path.join(root, '.dist', 'firebase', 'levelup-account.js');

if (!fs.existsSync(accountPath)) {
  throw new Error('LEVEL UP account bundle not found. Run inject-levelup-account.mjs first.');
}

let source = fs.readFileSync(accountPath, 'utf8');

const signInNeedle = '      await state.auth.signInWithPopup(provider);';
const signInReplacement = `      const isMobileAuth = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)\n        || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);\n      if (isMobileAuth) {\n        await state.auth.signInWithRedirect(provider);\n        return;\n      }\n      await state.auth.signInWithPopup(provider);`;

if (!source.includes('signInWithRedirect(provider)')) {
  if (!source.includes(signInNeedle)) {
    throw new Error('Could not find LEVEL UP Google popup sign-in call to patch.');
  }
  source = source.replace(signInNeedle, signInReplacement);
}

const initNeedle = `      state.auth = firebase.auth();\n      state.db = firebase.firestore();\n      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);`;
const initReplacement = `      const defaultApp = firebase.app();\n      let authApp = defaultApp;\n      if (location.hostname === 'levelup.hitobito.jp' && defaultApp.options?.authDomain !== location.hostname) {\n        const authConfig = { ...defaultApp.options, authDomain: location.hostname };\n        authApp = firebase.apps.find((app) => app.name === 'levelup-custom-auth')\n          || firebase.initializeApp(authConfig, 'levelup-custom-auth');\n      }\n      state.auth = authApp.auth();\n      state.db = firebase.firestore();\n      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);`;

if (!source.includes("app.name === 'levelup-custom-auth'")) {
  if (!source.includes(initNeedle)) {
    throw new Error('Could not find LEVEL UP Firebase initialization block to patch.');
  }
  source = source.replace(initNeedle, initReplacement);
}

const observerNeedle = `      state.auth.onAuthStateChanged(async (user) => {\n        state.user = user;\n        state.history = [];\n        state.busy = false;\n        render();\n        if (user) await syncUserData();\n      });`;
const observerReplacement = `${observerNeedle}\n      try {\n        const redirectResult = await state.auth.getRedirectResult();\n        if (redirectResult?.user) {\n          state.message = 'Googleログインが完了しました。';\n          state.messageKind = 'success';\n          render();\n        }\n      } catch (error) {\n        console.warn('[LEVEL UP account] redirect result failed', error);\n        state.message = friendlyError(error);\n        state.messageKind = 'error';\n        state.busy = false;\n        render();\n      }`;

if (!source.includes('getRedirectResult()')) {
  if (!source.includes(observerNeedle)) {
    throw new Error('Could not find LEVEL UP auth observer to patch.');
  }
  source = source.replace(observerNeedle, observerReplacement);
}

fs.writeFileSync(accountPath, source);

const required = [
  'signInWithRedirect(provider)',
  "location.hostname === 'levelup.hitobito.jp'",
  "app.name === 'levelup-custom-auth'",
  'getRedirectResult()',
];

for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`LEVEL UP mobile auth patch missing: ${marker}`);
}

console.log('[Firebase] LEVEL UP mobile Google auth patched for redirect return flow');
