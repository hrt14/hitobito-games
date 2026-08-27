import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'nenshu-shindan';
const copy = {
  title: '30問でわかる あなたの「市場年収」診断',
  kicker: 'NO SALARY INPUT / 30 TAPS',
  skill: '市場価値 / キャリア棚卸し',
  obi: '年収は入力しない。仕事の役割・成果・希少性から、今の市場年収レンジを推定する。',
  description: '30問すべてタップだけ。キャリア・責任範囲・専門性・事業インパクト・希少性・市場反応の6軸から市場年収レンジを出す。',
  forWho: '自分の年収が市場で高いのか低いのか知りたいが、現在年収を入力せず客観的に棚卸ししたい人',
  purpose: '仕事の役割・経験・成果・裁量・専門性・希少性を30問で分解し、市場価値の強みと弱みを見える化する',
  benefit: '推定市場年収レンジと、年収を押し上げている要因・次に伸ばすべき要因を一度に確認できる',
};

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home/catalog missing for nenshu-shindan card injection');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games?.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug} is not in LEVEL UP catalog`);
Object.assign(game, copy);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cardRe = new RegExp(`<article\\b[^>]*data-game=["']${escaped}["'][\\s\\S]*?<\\/article>`);
const match = html.match(cardRe);
if (!match) throw new Error(`${slug} card missing from LEVEL UP home`);
let card = match[0];
card = card.replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${copy.title}</h2>`);
if (/class="book-obi"/.test(card)) {
  card = card.replace(/<p class="book-obi">[\s\S]*?<\/p>/, `<p class="book-obi">${copy.obi}</p>`);
} else {
  card = card.replace(/(<h2>[\s\S]*?<\/h2>)/, `$1<p class="book-obi">${copy.obi}</p>`);
}
card = card.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${copy.kicker}</div>`);
card = card.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${copy.skill}</div>`);
card = card.replace(/<p>(?![^<]*class=)[\s\S]*?<\/p>/, `<p>${copy.description}</p>`);
card = card
  .replace(/(<span class="card-value-label">こんな人に<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.forWho}$2`)
  .replace(/(<span class="card-value-label">なんのため<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.purpose}$2`)
  .replace(/(<span class="card-value-label">ベネフィット<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.benefit}$2`);
html = html.replace(cardRe, card);
fs.writeFileSync(homePath, html);

if (!card.includes('book-obi') || !card.includes(copy.obi)) {
  throw new Error(`${slug} book obi injection failed`);
}
console.log(`[LEVEL UP card] ${slug}: specific title/obi/copy injected`);
