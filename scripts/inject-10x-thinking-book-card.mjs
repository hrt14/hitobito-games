import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for 10x-thinking book card.');
}

const slug = '10x-thinking';
const title = '1件・1回・1人で終わらせない 目の前を10倍にする。';
const obi = '量・質・波及の3方向から、同じ作業を増やさずに「桁を変える」練習。';
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('10x-thinking missing from LEVEL UP catalog.');
game.title = title;
game.description = obi;
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
const cardPattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
const match = html.match(cardPattern);
if (!match) throw new Error('10x-thinking card missing from LEVEL UP home.');

let body = match[2].replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error('10x-thinking card title missing.');
body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(title)}</h2>\n      <p class="book-obi">${escapeHtml(obi)}</p>`);
body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(title)}をお気に入りに追加"`);
html = html.replace(cardPattern, `$1${body}$3`);
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(obi)}</p>`)) {
  throw new Error('10x-thinking book card injection failed.');
}
console.log('[Firebase] 10x-thinking title + obi copy injected.');
