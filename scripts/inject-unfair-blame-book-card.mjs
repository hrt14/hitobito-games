import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for book-card copy injection.');
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

const cards = [
  {
    slug: 'unfair-blame',
    title: '悪くないのに責められ、行動まで制限されたとき 自分を守って動く練習',
    obi: '事実と決めつけを分け、奪われていない選択権を取り戻す。',
  },
  {
    slug: 'nenshu-shindan',
    title: '30問でわかる あなたの「市場年収」診断',
    obi: '年収は入力しない。役割・成果・専門性・希少性から市場年収レンジを推定する。',
  },
];

for (const { slug, title, obi } of cards) {
  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) {
    if (slug === 'nenshu-shindan') continue;
    throw new Error(`${slug} missing from LEVEL UP catalog.`);
  }
  game.title = title;
  game.description = obi;

  const cardPattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
  const match = html.match(cardPattern);
  if (!match) throw new Error(`${slug} card missing from LEVEL UP home.`);

  let body = match[2].replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
  if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error(`${slug} card title missing.`);
  body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(title)}</h2>\n      <p class="book-obi">${escapeHtml(obi)}</p>`);
  body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(title)}をお気に入りに追加"`);
  html = html.replace(cardPattern, `$1${body}$3`);
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
for (const { slug, obi } of cards) {
  if (!catalog.games.some((item) => item.slug === slug)) continue;
  if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(obi)}</p>`)) {
    throw new Error(`${slug} book card injection failed.`);
  }
}
console.log('[Firebase] unfair-blame + nenshu-shindan title/obi copy injected.');
