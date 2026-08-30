import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'mienai-zandaka';
const data = {
  title: '見えない残高',
  kicker: '10-SECOND KINDNESS LEDGER',
  skill: '親切 / 感謝 / 気づき',
  icon: '＋',
  forWho: '親切や感謝はしているのに、日々の中で「何も積み上がっていない」と感じやすい人',
  purpose: '小さな親切・感謝・手助けを10秒で記録し、自分が周囲へ渡したものを見える形に残す',
  benefit: '成果やお金以外にも積み上がっているものへ気づき、日常の小さな行動を続けやすくなる',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) process.exit(0);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('mienai-zandaka missing from LEVEL UP catalog');
Object.assign(game, data);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = html.indexOf(token);
if (tokenIndex < 0) throw new Error('mienai-zandaka card missing from LEVEL UP home');
const articleStart = html.lastIndexOf('<article', tokenIndex);
const articleClose = html.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('mienai-zandaka card bounds not found');
const articleEnd = articleClose + '</article>'.length;
let article = html.slice(articleStart, articleEnd);

article = article
  .replace(/<div class="icon">[\s\S]*?<\/div>/, `<div class="icon">${data.icon}</div>`)
  .replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${data.kicker}</div>`)
  .replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${data.skill}</div>`)
  .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${data.title}</h2>`)
  .replace(/(<span class="card-value-label">こんな人に<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${data.forWho}$2`)
  .replace(/(<span class="card-value-label">なんのため<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${data.purpose}$2`)
  .replace(/(<span class="card-value-label">ベネフィット<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${data.benefit}$2`);

html = html.slice(0, articleStart) + article + html.slice(articleEnd);
fs.writeFileSync(homePath, html);
console.log('[Firebase] mienai-zandaka card copy injected.');
