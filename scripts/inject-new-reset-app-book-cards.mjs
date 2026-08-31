import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

const CARDS = {
  'expectation-reset': {
    title: '期待を置く。',
    obi: '問題ゼロを前提にしない。期待を1つ手放して、いま自分ができる小さい一手へ戻る。',
  },
  'moya-30': {
    title: 'モヤを外に出す30秒',
    obi: '理由を考え込みすぎず、近い感覚を選んで3回押す。30秒で少し距離を作って次を選ぶ。',
  },
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for new reset app book cards.');
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

for (const [slug, card] of Object.entries(CARDS)) {
  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} missing from LEVEL UP catalog.`);
  game.title = card.title;
  game.description = card.obi;

  const cardPattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
  const match = html.match(cardPattern);
  if (!match) throw new Error(`${slug} card missing from LEVEL UP home.`);

  let body = match[2].replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
  if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error(`${slug} card title missing.`);
  body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(card.title)}</h2>\n      <p class="book-obi">${escapeHtml(card.obi)}</p>`);
  body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(card.title)}をお気に入りに追加"`);
  html = html.replace(cardPattern, `$1${body}$3`);
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);

for (const [slug, card] of Object.entries(CARDS)) {
  const finalHtml = fs.readFileSync(homePath, 'utf8');
  if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(card.obi)}</p>`)) {
    throw new Error(`${slug} book card injection failed.`);
  }
}

console.log('[Firebase] expectation-reset and moya-30 title + obi book cards injected.');
