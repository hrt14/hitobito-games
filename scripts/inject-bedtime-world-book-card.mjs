import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'bedtime-world';
const card = {
  title: '寝る前が楽しみになる\nイメトレ',
  obi: '今夜も、続きがある。布団に入ったら世界をひとつ先へ進め、続きは目を閉じてから見る。',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for bedtime-world book card.');
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
body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="寝る前が楽しみになるイメトレをお気に入りに追加"`);
html = html.replace(cardPattern, `$1${body}$3`);

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(card.obi)}</p>`)) {
  throw new Error(`${slug} book card injection failed.`);
}
console.log('[Firebase] bedtime-world title + obi book card injected.');
