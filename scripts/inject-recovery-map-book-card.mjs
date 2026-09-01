import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'recovery-map';
const card = {
  title: '疲れているのに休み方が分からない人の RECOVERY MAP',
  obi: '頭・気持ちと身体のサインを分け、次の10分の休み方を1つ決める。',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for recovery-map book card.');
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('recovery-map missing from LEVEL UP catalog.');
game.title = card.title;
game.description = card.obi;

let html = fs.readFileSync(homePath, 'utf8');
const cardPattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
const match = html.match(cardPattern);
if (!match) throw new Error('recovery-map card missing from LEVEL UP home.');

let body = match[2].replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error('recovery-map card title missing.');
body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(card.title)}</h2>\n      <p class="book-obi">${escapeHtml(card.obi)}</p>`);
body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(card.title)}をお気に入りに追加"`);
html = html.replace(cardPattern, `$1${body}$3`);

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);
console.log('[Firebase] recovery-map title + obi book card injected.');
