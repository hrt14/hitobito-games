import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'how-seen';
const copy = {
  forWho: '自分が周囲からどう見られているか気になり、自己イメージと実際の友人評価の差を知りたい人',
  purpose: '8つの二択で自己像を出し、友人の匿名回答と4軸で比べて「自分が思う自分」と「他人から見える自分」のズレを可視化する',
  benefit: '友人の実回答から、親しみやすさ・押しの強さ・安定感・本音の見えやすさのどこに認識差があるか分かる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`how-seen LEVEL UP card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('how-seen LEVEL UP card-copy inputs are missing');
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('how-seen card is missing from LEVEL UP home');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('how-seen card bounds not found');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);
article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);
home = home.slice(0, articleStart) + article + home.slice(articleEnd);
fs.writeFileSync(homePath, home);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('how-seen missing from LEVEL UP catalog');
Object.assign(game, copy);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] how-seen specific LEVEL UP card copy injected.');
