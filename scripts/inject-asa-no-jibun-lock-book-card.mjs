import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const cards = {
  'asa-no-jibun-lock': {
    title: '朝の自分に決めさせない',
    obi: '起きるか迷う前に動く。前夜に5つだけ決め、朝は画面の1個を順番どおり実行する。',
  },
  'pulse-start': {
    title: '動きたいのに止まっている人の 90秒起動スイッチ',
    obi: 'やる気を待たず、姿勢と最初の身体動作から次の一手へ移る。',
  },
  'influence-rings': {
    title: '変えられないことを考え続ける人の 影響範囲を切り分ける練習',
    obi: '直接動かせることを見分け、自分の次の一手へ注意を戻す。',
  },
  'energy-bucket': {
    title: '夕方に電池切れする人の 体力の穴を1個ふさぐ',
    obi: '10個の体力の穴から明日ふさぐ1個だけを選び、IF-THENの行動ルールにする。',
  },
};

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

console.log('[Firebase] explicit title + obi book cards injected for morning-lock and current standalone releases.');
await import('./inject-bedtime-best-case-book-card.mjs');
