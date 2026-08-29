import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const cards = {
  'unfair-blame': {
    title: '悪くないのに責められ、行動まで制限されたとき 自分を守って動く練習',
    obi: '事実と決めつけを分け、奪われていない選択権を取り戻す。',
  },
  'ato-nankai': {
    title: '「いつでもできる」と後回しにする前に 人生、あと何回？',
    obi: '春・土曜日・大切な人との時間を残り回数にして、今日の1回を選ぶ。',
  },
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for book cards.');
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

for (const [slug, card] of Object.entries(cards)) {
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

const finalHtml = fs.readFileSync(homePath, 'utf8');
for (const [slug, card] of Object.entries(cards)) {
  if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(card.obi)}</p>`)) {
    throw new Error(`${slug} book card injection failed.`);
  }
}
console.log('[Firebase] unfair-blame + ato-nankai title/obi copy injected.');
