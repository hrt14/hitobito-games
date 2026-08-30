import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'time-energy-triage';
const copy = {
  kicker: 'TIME × ENERGY',
  skill: '時間 / 余力 / 仕事量',
  forWho: '時間が足りない日に、全部を効率よく片づけようとして消耗しやすい人',
  purpose: '残り時間と余力を見て、今やる・小さくする・任せる・後ろへ送る・休むを選ぶ',
  benefit: '5問で今日の仕事量を現実に合わせ、最初の一手とやらないことを決めやすくなる',
};

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`time-energy-triage card input missing: ${file}`);
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`time-energy-triage card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('time-energy-triage card not found on LEVEL UP home');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('time-energy-triage card bounds not found');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);
article = article.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${escapeHtml(copy.kicker)}</div>`);
article = article.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${escapeHtml(copy.skill)}</div>`);
article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);
home = home.slice(0, articleStart) + article + home.slice(articleEnd);
fs.writeFileSync(homePath, home);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('time-energy-triage missing from LEVEL UP catalog');
Object.assign(game, copy);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

for (const value of Object.values(copy)) {
  if (!home.includes(escapeHtml(value))) throw new Error('time-energy-triage card copy verification failed');
}
console.log('[Firebase] time-energy-triage app-specific card copy injected and verified.');
