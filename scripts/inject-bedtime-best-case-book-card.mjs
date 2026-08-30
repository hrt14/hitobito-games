import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'bedtime-best-case';
const card = {
  title: '寝る前3分\n全部うまくいくイメトレ',
  obi: '目を閉じてから迷わない。始まり・最高の瞬間・安心の余韻。今夜見る3シーンを先に作る。',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for bedtime-best-case book card.');
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
body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="寝る前3分 全部うまくいくイメトレをお気に入りに追加"`);
html = html.replace(cardPattern, `$1${body}$3`);

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(card.obi)}</p>`)) {
  throw new Error(`${slug} book card injection failed.`);
}
console.log('[Firebase] bedtime-best-case title + obi book card injected.');
await import('./inject-time-energy-triage-book-card.mjs');
