import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const assetPath = path.join(outDir, 'levelup-maker.js');
const indexPath = path.join(outDir, 'index.html');

if (!fs.existsSync(assetPath) || !fs.existsSync(indexPath)) {
  throw new Error('LEVEL UP maker output not found. Run inject-levelup-maker.mjs first.');
}

let source = fs.readFileSync(assetPath, 'utf8');

const oldFormatter = `  function formatDate(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
  }`;

const newFormatter = `  function formatDate(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '';
    const monthDay = (date.getMonth() + 1) + '/' + date.getDate();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return monthDay + ' ' + hour + ':' + minute;
  }`;

if (!source.includes("String(date.getMinutes()).padStart(2, '0')")) {
  if (!source.includes(oldFormatter)) {
    throw new Error('Could not find LEVEL UP maker date formatter.');
  }
  source = source.replace(oldFormatter, newFormatter);
  fs.writeFileSync(assetPath, source);
}

const version = createHash('sha256').update(source).digest('hex').slice(0, 12);
let html = fs.readFileSync(indexPath, 'utf8');
const scriptPattern = /src="\/levelup-maker\.js(?:\?v=[^"]*)?"/g;
if (!scriptPattern.test(html)) {
  throw new Error('Could not find LEVEL UP maker script tag.');
}
html = html.replace(scriptPattern, `src="/levelup-maker.js?v=${version}"`);
fs.writeFileSync(indexPath, html);

if (!source.includes("return monthDay + ' ' + hour + ':' + minute;")) {
  throw new Error('LEVEL UP maker date/time formatter was not applied.');
}
if (!html.includes(`/levelup-maker.js?v=${version}`)) {
  throw new Error('LEVEL UP maker cache-busting version was not updated.');
}

console.log(`[Firebase] LEVEL UP maker date/time patched: M/D HH:mm; maker=${version}`);
