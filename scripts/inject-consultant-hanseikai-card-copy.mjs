import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'consultant-hanseikai';
const copy = {
  title: 'コンサル後反省会を3分で終わらせる',
  kicker: 'CLOSE THE LOOP IN 3 MIN',
  skill: '事実 / 想像 / 改善 / 復帰',
  obi: '想像を捨て、改善1個だけ残し、自分の商売へ戻る。',
  description: 'コンサル後の不安を事実・想像・次に変えられることへ分け、改善を1個に絞って自分の仕事へ戻る。',
  forWho: 'コンサルや商談後に、相手の反応・契約継続・準備不足を何度も反省してしまう人',
  purpose: '事実・未確定の想像・次回変えられる行動を分け、考えても情報が増えない不安を閉じる',
  benefit: '改善を1個だけ持ち帰り、反省会を終えて自分の商売へ戻りやすくなる',
};

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home/catalog missing for consultant-hanseikai card copy');
}
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games?.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug} is not in LEVEL UP catalog`);
Object.assign(game, copy);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
const cardRe = /<article\b[^>]*data-game=["']consultant-hanseikai["'][\s\S]*?<\/article>/;
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
  if (!final.includes(text)) throw new Error(`consultant-hanseikai card copy patch missing: ${text}`);
}
console.log('[LEVEL UP card] consultant-hanseikai: specific title/obi/copy injected');
