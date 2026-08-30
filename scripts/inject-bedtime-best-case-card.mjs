import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'bedtime-best-case';
const copy = {
  forWho: '寝る前にイメトレしたいのに、目を閉じると何を考えるか曖昧になる人',
  purpose: '全部うまくいった未来を、始まり・最高の瞬間・安心の余韻の3カットへ具体化する',
  benefit: '目を閉じたあとに考え足さず、今夜見る3シーンを順番どおり再生しやすくなる',
};

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`bedtime-best-case card input missing: ${file}`);
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`bedtime-best-case card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('bedtime-best-case card not found on LEVEL UP home');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('bedtime-best-case card bounds not found');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);
article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);
home = home.slice(0, articleStart) + article + home.slice(articleEnd);
fs.writeFileSync(homePath, home);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('bedtime-best-case missing from LEVEL UP catalog');
Object.assign(game, copy);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

for (const value of Object.values(copy)) {
  if (!home.includes(escapeHtml(value))) throw new Error('bedtime-best-case card copy verification failed');
}
console.log('[Firebase] bedtime-best-case app-specific card copy injected and verified.');
await import('./inject-time-energy-triage-card.mjs');
