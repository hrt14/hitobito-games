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

const genericError = "    return '接続に失敗しました。端末への保存は続いています。';";
const diagnosticError = "    return '接続に失敗しました' + (code ? '（' + code + '）' : '') + '。端末への保存は続いています。';";
if (!source.includes("(code ? '（' + code + '）' : '')")) {
  if (!source.includes(genericError)) throw new Error('Could not find LEVEL UP generic auth error text.');
  source = source.replace(genericError, diagnosticError);
}

const popupCall = '      await state.auth.signInWithPopup(provider);';
const popupHandled = `      const result = await state.auth.signInWithPopup(provider);\n      if (result?.user) {\n        state.user = result.user;\n        state.busy = false;\n        state.message = 'Googleログインが完了しました。';\n        state.messageKind = 'success';\n        render();\n      }`;
if (!source.includes("const result = await state.auth.signInWithPopup(provider);")) {
  if (!source.includes(popupCall)) throw new Error('Could not find LEVEL UP popup sign-in call.');
  source = source.replace(popupCall, popupHandled);
}

fs.writeFileSync(accountPath, source);

const required = [
  'signInWithPopup(provider)',
  "state.message = 'Googleログインが完了しました。';",
  "(code ? '（' + code + '）' : '')",
];
for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`LEVEL UP popup auth hardening missing: ${marker}`);
}

console.log('[Firebase] LEVEL UP popup auth hardened with explicit success state and visible error codes');
