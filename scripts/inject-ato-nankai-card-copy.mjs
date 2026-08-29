import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'ato-nankai';
const copy = {
  forWho: '毎日を無限にあるように使ってしまい、大切な時間を後回しにしがちな人',
  purpose: '春・土曜日・誕生日・大切な人に会う時間を、残り年数ではなく具体的な回数に変える',
  benefit: '今日まだ残っている「1回」の重みが見え、何を雑にしないか1つ決められる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`ato-nankai LEVEL UP card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('ato-nankai LEVEL UP card-copy inputs are missing');
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('ato-nankai card is missing from LEVEL UP home');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('ato-nankai card bounds not found');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);
article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);
home = home.slice(0, articleStart) + article + home.slice(articleEnd);
fs.writeFileSync(homePath, home);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('ato-nankai missing from LEVEL UP catalog');
Object.assign(game, copy);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] ato-nankai specific LEVEL UP card copy injected.');
