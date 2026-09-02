import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const CARDS = {
  'inaction-cost': {
    title: '何もしないコスト',
    obi: 'その先延ばし、滑走路？ 麻酔？ 「今やる痛み」と「待つ未来」を同じ天秤で比べる。',
  },
  'confidence-before-results': {
    title: '結果が出る前に自信をつくる',
    obi: '成功の証拠を待たない。「次の一手は出せる」を先払いして、3・2・1で動き始める。',
  },
  'breakthrough-90': {
    title: '八方塞がりから次の一手へ',
    obi: '10年まで引く。他人比較を外す。最後は「次の15分」だけを決める90秒リセット。',
  },
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for book card copy.');
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

function patch(slug, card) {
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

for (const [slug, card] of Object.entries(CARDS)) patch(slug, card);

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);

for (const [slug, card] of Object.entries(CARDS)) {
  const finalHtml = fs.readFileSync(homePath, 'utf8');
  if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(card.obi)}</p>`)) {
    throw new Error(`${slug} book card injection failed.`);
  }
}

console.log('[Firebase] 何もしないコスト + 結果が出る前に自信をつくる + breakthrough-90 title + obi book cards injected.');
