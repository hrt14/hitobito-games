import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'problem-solving-7steps';
const copy = {
  title: '仕事で詰まったときの 問題を7手で小さくする練習',
  kicker: '1 CASE, 7 MOVES',
  skill: '問題解決 / 構造化',
  description: '混ざった問題を、動かせる1個と具体的な実行計画までほどく。',
  forWho: '仕事の問題が大きく見え、何から手をつけるか分からなくなる人',
  purpose: '問題を仕分け・焦点化・具体化し、複数案から実行計画まで一気通貫で作る',
  benefit: '「全部どうしよう」から抜けて、今日動かせる最初の一手を決めやすくなる',
};

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home/catalog missing for problem-solving card injection');
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
card = card.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${copy.kicker}</div>`);
card = card.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${copy.skill}</div>`);
card = card.replace(/<p>(?![^<]*class=)[\s\S]*?<\/p>/, `<p>${copy.description}</p>`);
card = card
  .replace(/(<span class="card-value-label">こんな人に<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.forWho}$2`)
  .replace(/(<span class="card-value-label">なんのため<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.purpose}$2`)
  .replace(/(<span class="card-value-label">ベネフィット<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.benefit}$2`);
html = html.replace(cardRe, card);
fs.writeFileSync(homePath, html);
console.log(`[LEVEL UP card] ${slug}: specific title/copy injected`);
