import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const accountPath = path.join(root, '.dist', 'firebase', 'levelup-account.js');

if (!fs.existsSync(accountPath)) {
  throw new Error('LEVEL UP account bundle not found. Run the auth patches first.');
}

const source = fs.readFileSync(accountPath, 'utf8');

// Do not override authDomain to levelup.hitobito.jp here. Google rejects that
// callback with redirect_uri_mismatch until
// https://levelup.hitobito.jp/__/auth/handler is explicitly registered on the
// OAuth client. The Firebase Hosting init config already supplies the project's
// default *.firebaseapp.com authDomain used by popup auth.
if (source.includes("config.authDomain = location.hostname")) {
  throw new Error('LEVEL UP custom authDomain override unexpectedly remains.');
}
if (source.includes('signInWithRedirect(provider)') || source.includes('getRedirectResult()')) {
  throw new Error('LEVEL UP redirect auth unexpectedly remains.');
}
if (!source.includes('signInWithPopup(provider)')) {
  throw new Error('LEVEL UP popup auth marker is missing.');
}

console.log('[Firebase] LEVEL UP keeps Firebase Hosting default authDomain for popup auth');
