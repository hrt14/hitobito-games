import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'ato-nankai';
const copy = {
  title: '人生で「あと何回？」を数えると、今日の1回を雑にできなくなる',
  obi: '春・土曜日・誕生日・大切な人に会える回数を、残り年数から具体的に見える化する。',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog missing');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games?.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug} missing from LEVEL UP catalog`);
Object.assign(game, copy);
let html = fs.readFileSync(homePath, 'utf8');
const re = new RegExp(`<article\\b[^>]*data-game=["']${slug}["'][\\s\\S]*?<\\/article>`);
const match = html.match(re);
if (!match) throw new Error(`${slug} card missing from LEVEL UP home`);
let card = match[0];
card = card.replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${copy.title}</h2>`);
if (/class="book-obi"/.test(card)) card = card.replace(/<p class="book-obi">[\s\S]*?<\/p>/, `<p class="book-obi">${copy.obi}</p>`);
else card = card.replace(/(<h2>[\s\S]*?<\/h2>)/, `$1<p class="book-obi">${copy.obi}</p>`);
html = html.replace(re, card);
fs.writeFileSync(homePath, html);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] ato-nankai book title + obi injected after shared book conversion.');
