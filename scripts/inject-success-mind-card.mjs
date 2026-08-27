import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

for (const required of [homePath, catalogPath]) {
  if (!fs.existsSync(required)) throw new Error(`LEVEL UP output missing for success-mind card: ${required}`);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games) || !catalog.games.some((game) => game.slug === 'success-mind')) {
  throw new Error('success-mind must be auto-discovered into the LEVEL UP catalog before book-card patching.');
}

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes('id="levelup-book-cards-style"')) {
  throw new Error('Book-card styles must be injected before success-mind book-copy patch.');
}

const articlePattern = /<article\b([^>]*\bdata-game="success-mind"[^>]*)>([\s\S]*?)<\/article>/;
const match = html.match(articlePattern);
if (!match) throw new Error('Auto-discovered success-mind card was not found on LEVEL UP home.');

let attrs = match[1];
let body = match[2];
if (!/\bis-new\b/.test(attrs)) attrs = ` class="card is-new" data-new="true"${attrs.replace(/\s*class="[^"]*"/,'')}`;
else if (!/\bdata-new="true"/.test(attrs)) attrs += ' data-new="true"';

body = body.replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
body = body.replace(
  /<h2\b[^>]*>[\s\S]*?<\/h2>/,
  '<h2>考え方で「生涯年収」が変わる？ 成功マインド診断</h2>\n      <p class="book-obi">12の判断から「成功マインド換算 生涯年収」を出す。</p>',
);
body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, 'aria-label="成功マインド診断をお気に入りに追加"');

const replacement = `<article${attrs}>${body}</article>`;
html = html.replace(articlePattern, replacement);
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
const finalMatch = finalHtml.match(articlePattern);
if (!finalMatch || !finalMatch[2].includes('class="book-obi"')) {
  throw new Error('success-mind title+obi patch failed.');
}
if (!finalMatch[2].includes('成功マインド診断')) {
  throw new Error('success-mind title patch failed.');
}

console.log('[Firebase] success-mind auto-discovered card upgraded to NEW book card.');
