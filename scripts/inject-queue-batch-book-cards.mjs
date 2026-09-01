import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const cards = {
  'one-thing-room': {
    title: '難しいことが同時に押し寄せたときの 1個だけに戻す部屋',
    obi: '頭の中の負荷を外に出し、90秒で「次の1個」だけ決める。',
  },
  'rhythm-anchor': {
    title: '生活リズムが崩れやすい人の 夜2つだけアンカー',
    obi: '明日の起床時刻と今夜の終了時刻を決め、朝の判断を3つ減らす。',
  },
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog not found.');
const esc = (v) => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

for (const [slug, card] of Object.entries(cards)) {
  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} missing from LEVEL UP catalog.`);
  game.title = card.title;
  game.description = card.obi;
  const pattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
  const match = html.match(pattern);
  if (!match) throw new Error(`${slug} card missing from LEVEL UP home.`);
  let body = match[2].replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
  if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error(`${slug} card title missing.`);
  body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${esc(card.title)}</h2>\n      <p class="book-obi">${esc(card.obi)}</p>`);
  body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${esc(card.title)}をお気に入りに追加"`);
  html = html.replace(pattern, `$1${body}$3`);
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);
console.log('[Firebase] queue batch LEVEL UP title + obi book cards injected.');
