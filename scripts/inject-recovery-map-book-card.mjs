import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'recovery-map';
const card = {
  title: 'RECOVERY MAP\n疲れを分けて、休み方を決める',
  obi: '頭・気持ち側と身体側の疲れサインを約90秒で整理し、次の10分にやる回復行動を1つ決める。',
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
if (!game) throw new Error(`${slug} missing from LEVEL UP catalog.`);
game.title = card.title.replace('\n', ' ');
game.description = card.obi;

let html = fs.readFileSync(homePath, 'utf8');
const cardPattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
const match = html.match(cardPattern);
if (!match) throw new Error(`${slug} card missing from LEVEL UP home.`);

let body = match[2].replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error(`${slug} card title missing.`);
const titleHtml = escapeHtml(card.title).replace('\n', '<br>');
body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${titleHtml}</h2>\n      <p class="book-obi">${escapeHtml(card.obi)}</p>`);
body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="RECOVERY MAP 疲れを分けて、休み方を決めるをお気に入りに追加"`);
html = html.replace(cardPattern, `$1${body}$3`);

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);
console.log('[Firebase] recovery-map title + obi book card injected.');
