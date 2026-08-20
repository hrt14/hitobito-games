import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const accountPath = path.join(root, '.dist', 'firebase', 'levelup-account.js');

if (!fs.existsSync(accountPath)) {
  throw new Error('LEVEL UP account bundle not found. Run the auth patches first.');
}

let source = fs.readFileSync(accountPath, 'utf8');

const oldCondition = "        if (location.hostname === 'levelup.hitobito.jp') config.authDomain = location.hostname;";
const newCondition = "        if (['levelup.hitobito.jp', 'hitobito-levelup.web.app', 'hitobito-levelup.firebaseapp.com'].includes(location.hostname)) config.authDomain = location.hostname;";

if (!source.includes(newCondition)) {
  if (!source.includes(oldCondition)) {
    throw new Error('LEVEL UP authDomain condition changed unexpectedly; refusing a partial Hosting-domain patch.');
  }
  source = source.replace(oldCondition, newCondition);
}

if (source.includes(oldCondition)) {
  throw new Error('LEVEL UP custom-domain-only authDomain condition still remains.');
}
for (const host of ['levelup.hitobito.jp', 'hitobito-levelup.web.app', 'hitobito-levelup.firebaseapp.com']) {
  if (!source.includes(host)) throw new Error(`LEVEL UP same-origin auth host missing: ${host}`);
}
if (!source.includes('await state.auth.signInWithRedirect(provider);')) {
  throw new Error('LEVEL UP redirect auth call missing after Hosting-domain patch.');
}

fs.writeFileSync(accountPath, source);
console.log('[Firebase] LEVEL UP same-origin authDomain enabled for custom, web.app, and firebaseapp.com Hosting domains');
