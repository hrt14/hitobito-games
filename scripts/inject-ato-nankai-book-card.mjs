import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const copies = {
  'ato-nankai': {
    title: '人生で「あと何回？」を数えると、今日の1回を雑にできなくなる',
    obi: '春・土曜日・誕生日・大切な人に会える回数を、残り年数から具体的に見える化する。',
  },
  'jinsei-kieteru': {
    title: '毎日の24時間を「残り人生の何年」に変えると、自由な時間が見えてくる',
    obi: '睡眠・仕事・スマホ・移動・家事に使う時間の先に、自由な人生が何年残るかを見る。',
  },
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog missing');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

for (const [slug, copy] of Object.entries(copies)) {
  const game = catalog.games?.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} missing from LEVEL UP catalog`);
  Object.assign(game, copy);
  const re = new RegExp(`<article\\b[^>]*data-game=["']${slug}["'][\\s\\S]*?<\\/article>`);
  const match = html.match(re);
  if (!match) throw new Error(`${slug} card missing from LEVEL UP home`);
  let card = match[0];
  const title = escapeHtml(copy.title);
  const obi = escapeHtml(copy.obi);
  card = card.replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${title}</h2>`);
  if (/class="book-obi"/.test(card)) card = card.replace(/<p class="book-obi">[\s\S]*?<\/p>/, `<p class="book-obi">${obi}</p>`);
  else card = card.replace(/(<h2>[\s\S]*?<\/h2>)/, `$1<p class="book-obi">${obi}</p>`);
  html = html.replace(re, card);
}

fs.writeFileSync(homePath, html);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] ato-nankai + jinsei-kieteru book titles and obi injected after shared book conversion.');
