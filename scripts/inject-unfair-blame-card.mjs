import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'unfair-blame';
const copy = {
  title: '悪くないのに責められ、行動まで制限されたとき',
  kicker: 'KEEP YOUR AGENCY',
  skill: '濡れ衣 / 境界線 / 選択権',
  description: '事実・断定・制限を分けて、相手に奪われていない選択権を取り戻す。',
  forWho: '身に覚えのないことで責められ、行動まで制限されそうになっている人',
  purpose: '事実・相手の断定・行動制限を分け、自分で決められる部分だけを回収する',
  benefit: '理不尽な圧の中でも反射で言い返さず、境界のある次の一手を選びやすくなる',
};

for (const file of [catalogPath, homePath]) {
  if (!fs.existsSync(file)) throw new Error(`LEVEL UP unfair-blame card input missing: ${file}`);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games?.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug} is not in LEVEL UP catalog`);
Object.assign(game, copy);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
const cardRe = new RegExp(`<article\\b[^>]*data-game=["']${slug}["'][\\s\\S]*?<\\/article>`);
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

for (const text of Object.values(copy)) {
  if (!html.includes(text)) throw new Error(`${slug} card patch missing: ${text}`);
}
console.log(`[LEVEL UP card] ${slug}: specific title/copy injected`);
