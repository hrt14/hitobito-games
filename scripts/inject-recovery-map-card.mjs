import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'recovery-map';

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`recovery-map card-copy input missing: ${file}`);
}

const copy = {
  kicker: 'RECOVERY MAP',
  skill: '疲労サイン / 切り分け / 休息',
  forWho: '疲れているのに、頭を休めるか身体を休めるか分からない人',
  purpose: '今感じている疲れのサインを頭・気持ち側と身体側に分け、次の10分の休み方を1つ決める',
  benefit: '約90秒で疲れの偏りを見える化し、今すぐできる低リスクな回復行動を選びやすくなる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`recovery-map card value missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('recovery-map card not found on LEVEL UP home.');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('recovery-map card bounds not found.');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);

article = article.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${escapeHtml(copy.kicker)}</div>`);
article = article.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${escapeHtml(copy.skill)}</div>`);
article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);
home = home.slice(0, articleStart) + article + home.slice(articleEnd);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('recovery-map catalog entry not found.');
Object.assign(game, copy);

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] recovery-map app-specific LEVEL UP card copy injected.');
