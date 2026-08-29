import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'iya-feeling-first-aid';
const copy = {
  title: '嫌な気持ち、いったん下げる',
  kicker: 'SUDDEN BAD FEELING / ABOUT 1 MIN',
  skill: '急な不快感 / 切り替え',
  obi: '理由はあとでいい。8秒待つ→名前を1つつける→今へ戻す。',
  description: '急に不安・イライラ・恥ずかしさなどが湧いたとき、原因探しより先に約1分で勢いを1段下げる。',
  forWho: '理由がはっきりしない嫌な気持ちが急に湧き、すぐ原因探しや反応を始めそうな人',
  purpose: '感情を消そうとせず、8秒待つ・一語で名前をつける・体や視線を今へ戻す順番を実行する',
  benefit: '今すぐ何とかしなければという圧を少し下げ、次の数分へ戻りやすくなる',
};

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home/catalog missing for iya-feeling-first-aid card injection');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');
const game = catalog.games?.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug} is not in LEVEL UP catalog`);
Object.assign(game, copy);

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

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);
console.log('[LEVEL UP card] iya-feeling-first-aid title/obi/copy injected');
