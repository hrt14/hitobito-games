import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const accountPath = path.join(root, '.dist', 'firebase', 'levelup-account.js');

if (!fs.existsSync(accountPath)) {
  throw new Error('LEVEL UP account bundle not found. Run patch-levelup-popup-auth.mjs first.');
}

const source = fs.readFileSync(accountPath, 'utf8');

// iPhone was reaching Google with a custom-domain redirect URI that is not
// registered on the OAuth client, causing Google error 400 redirect_uri_mismatch.
// Keep the already-provisioned Firebase *.firebaseapp.com authDomain and use
// Firebase popup auth on every browser until the custom callback is explicitly
// registered in Google Auth Platform.
if (!source.includes('const result = await state.auth.signInWithPopup(provider);')) {
  throw new Error('LEVEL UP executable popup auth is missing.');
}
if (source.includes('signInWithRedirect(provider)') || source.includes('getRedirectResult()')) {
  throw new Error('LEVEL UP redirect auth must remain disabled while the custom OAuth redirect URI is unregistered.');
}
if (source.includes("config.authDomain = location.hostname")) {
  throw new Error('LEVEL UP custom authDomain override must remain disabled for popup auth.');
}

console.log('[Firebase] LEVEL UP Google login kept on Firebase popup auth for desktop and mobile');
