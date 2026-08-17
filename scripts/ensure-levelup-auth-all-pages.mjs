import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const accountPath = path.join(outDir, 'levelup-account.js');
const FIREBASE_VERSION = '12.16.0';

if (!fs.existsSync(outDir) || !fs.existsSync(accountPath)) {
  throw new Error('Firebase LEVEL UP bundle/account asset missing. Run this after patch-levelup-popup-auth.mjs.');
}

const accountSource = fs.readFileSync(accountPath, 'utf8');
const accountVersion = createHash('sha256').update(accountSource).digest('hex').slice(0, 12);

function collectHtmlPages(dir) {
  const pages = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) pages.push(...collectHtmlPages(target));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) pages.push(target);
  }
  return pages;
}

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function accountMetadata(page) {
  const relative = path.relative(outDir, page).split(path.sep).join('/');
  if (relative === 'index.html') return ' data-page="home"';

  const parts = relative.split('/');
  if (parts[0] === 'apps' && parts[1]) {
    return ` data-game-slug="${escapeAttr(parts[1])}"`;
  }

  // Root-level LEVEL UP pages, if added later, still receive a stable slug.
  if (parts.length > 1 && parts[0] && parts[0] !== '404.html') {
    return ` data-game-slug="${escapeAttr(parts[0])}"`;
  }
  return '';
}

function canonicalAccountBlock(page) {
  const metadata = accountMetadata(page);
  return [
    `<script src="https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js" data-levelup-account-sdk></script>`,
    `<script src="https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js" data-levelup-account-sdk></script>`,
    `<script src="https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js" data-levelup-account-sdk></script>`,
    `<script src="/levelup-account.js?v=${accountVersion}" data-levelup-account${metadata}></script>`,
  ].join('\n');
}

const pages = collectHtmlPages(outDir);
if (!pages.length) throw new Error('No Firebase HTML pages found.');

let changed = 0;
for (const page of pages) {
  let html = fs.readFileSync(page, 'utf8');
  const before = html;

  // Normalize the shared account shell so every HTML page gets exactly one copy.
  html = html
    .replace(/\s*<script\b[^>]*\bdata-levelup-account-sdk\b[^>]*>\s*<\/script>/gi, '')
    .replace(/\s*<script\b(?=[^>]*\bdata-levelup-account\b)(?![^>]*\bdata-levelup-account-sdk\b)[^>]*>\s*<\/script>/gi, '')
    .replace(/\s*<script\b[^>]*src=["']\/__\/firebase\/init\.js["'][^>]*>\s*<\/script>/gi, '');

  const block = canonicalAccountBlock(page);
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${block}\n</body>`);
  else html = `${html}\n${block}\n`;

  if (html !== before) changed += 1;
  fs.writeFileSync(page, html);
}

const requiredAssets = [
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`,
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`,
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`,
  `/levelup-account.js?v=${accountVersion}`,
];

const problems = [];
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const relative = path.relative(outDir, page).split(path.sep).join('/');
  for (const asset of requiredAssets) {
    if (!html.includes(asset)) problems.push(`${relative}: missing ${asset}`);
  }
  if (html.includes('/__/firebase/init.js')) problems.push(`${relative}: legacy Firebase init.js remains`);

  const accountTags = html.match(/<script\b(?=[^>]*\bdata-levelup-account\b)(?![^>]*\bdata-levelup-account-sdk\b)[^>]*>/gi) || [];
  if (accountTags.length !== 1) problems.push(`${relative}: expected 1 shared account script, found ${accountTags.length}`);

  const sdkTags = html.match(/<script\b[^>]*\bdata-levelup-account-sdk\b[^>]*>/gi) || [];
  if (sdkTags.length !== 3) problems.push(`${relative}: expected 3 Firebase account SDK scripts, found ${sdkTags.length}`);

  if (relative === 'index.html' && !html.includes('data-page="home"')) {
    problems.push('index.html: home account metadata missing');
  }
  if (relative.startsWith('apps/')) {
    const slug = relative.split('/')[1];
    if (!html.includes(`data-game-slug="${slug}"`)) problems.push(`${relative}: game slug metadata missing`);
  }
}

if (problems.length) {
  console.error('[Firebase auth coverage] FAILED');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`[Firebase auth coverage] OK: shared Google login normalized on all ${pages.length} HTML pages (${changed} rewritten); account=${accountVersion}`);
