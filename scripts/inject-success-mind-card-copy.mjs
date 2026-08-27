import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'success-mind';
const copy = {
  title: '成功マインド診断',
  kicker: '12 DECISIONS → LIFETIME EARNINGS',
  skill: '成功思考 / 意思決定 / 自己理解',
  obi: '12の判断から「成功マインド換算 生涯年収」を出す。',
  description: '仕事・失敗・お金・競争・チャンスの12場面から、成功につながる判断パターンを6軸で診断する。',
  forWho: 'このままの考え方で、収入やキャリアが伸びるか知りたい人',
  purpose: '実行・統制・複利・学習・協力・リスク設計の判断パターンを診断する',
  benefit: '成功を一番伸ばしている考え方と、一番止めている考え方が金額スケールで分かる',
};

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home/catalog missing for success-mind card copy');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games?.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug} is not in LEVEL UP catalog`);
Object.assign(game, copy);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
const cardRe = /<article\b[^>]*data-game=["']success-mind["'][\s\S]*?<\/article>/;
const match = html.match(cardRe);
if (!match) throw new Error(`${slug} card missing from LEVEL UP home`);
let card = match[0];
card = card.replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${copy.title}</h2>`);
if (/class="book-obi"/.test(card)) card = card.replace(/<p class="book-obi">[\s\S]*?<\/p>/, `<p class="book-obi">${copy.obi}</p>`);
else card = card.replace(/(<h2>[\s\S]*?<\/h2>)/, `$1\n      <p class="book-obi">${copy.obi}</p>`);
card = card.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${copy.kicker}</div>`);
card = card.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${copy.skill}</div>`);
card = card.replace(/<p>(?![^<]*class=)[\s\S]*?<\/p>/, `<p>${copy.description}</p>`);
card = card
  .replace(/(<span class="card-value-label">こんな人に<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.forWho}$2`)
  .replace(/(<span class="card-value-label">なんのため<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.purpose}$2`)
  .replace(/(<span class="card-value-label">ベネフィット<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.benefit}$2`);
html = html.replace(cardRe, card);
fs.writeFileSync(homePath, html);

const final = fs.readFileSync(homePath, 'utf8');
for (const text of [copy.title, copy.forWho, copy.purpose, copy.benefit]) {
  if (!final.includes(text)) throw new Error(`success-mind card copy patch missing: ${text}`);
}
console.log('[LEVEL UP card] success-mind: specific title/obi/copy injected');
