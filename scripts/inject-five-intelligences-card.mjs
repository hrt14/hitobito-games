import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'five-intelligences';
const copy = {
  title: '60秒で使い分ける 5つの知能',
  kicker: '10 SCENES / 5 SWITCHES',
  skill: '状況判断 / 思考切替',
  obi: 'IQだけで解こうとしない。場面ごとにEQ・SQ・IQ・BKQ・NQを切り替える。',
  description: '10の場面で5つの知能スイッチを選び、状況に合う最初の一手を反射化する。',
  forWho: '仕事や人間関係で、今は考える・感じる・頼るのどれを使うべきか迷う人',
  purpose: 'EQ・SQ・IQ・BKQ・NQを状況ごとの道具として見分け、使い分ける練習をする',
  benefit: '何でもIQだけで解こうとせず、場面に合う別の突破口を選びやすくなる',
};

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) throw new Error('LEVEL UP home/catalog missing for five-intelligences card injection');
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
if (/class="book-obi"/.test(card)) card = card.replace(/<p class="book-obi">[\s\S]*?<\/p>/, `<p class="book-obi">${copy.obi}</p>`);
else card = card.replace(/(<h2>[\s\S]*?<\/h2>)/, `$1<p class="book-obi">${copy.obi}</p>`);
card = card.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${copy.kicker}</div>`);
card = card.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${copy.skill}</div>`);
card = card.replace(/<p>(?![^<]*class=)[\s\S]*?<\/p>/, `<p>${copy.description}</p>`);
card = card
  .replace(/(<span class="card-value-label">こんな人に<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.forWho}$2`)
  .replace(/(<span class="card-value-label">なんのため<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.purpose}$2`)
  .replace(/(<span class="card-value-label">ベネフィット<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.benefit}$2`);
html = html.replace(cardRe, card);
fs.writeFileSync(homePath, html);
console.log(`[LEVEL UP card] ${slug}: specific title/obi/copy injected`);
