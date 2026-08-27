import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`NEGOTIATOR card-copy input missing: ${file}`);
}

const COPY = {
  'negotiator-procrastination': {
    forWho: 'やるべきことがあるのに「時間がない」「気分が乗らない」と先延ばししている人',
    purpose: '拒否理由に合わせて要求を小さく再交渉し、最初の1操作まで落とす',
    benefit: 'やる気を待たず、今の自分が受け入れられる最小条件で着手しやすくなる',
  },
  'negotiator-move': {
    forWho: 'やるべきことは分かっているのに「忙しい」「やる気がない」「今じゃない」で着手できない人',
    purpose: '抵抗を否定せず要求を小さく再交渉し、現実の最初の1動作まで落とす',
    benefit: 'やる気を作ろうとせず、今できる最小の一歩から動き始めやすくなる',
  },
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`NEGOTIATOR card value field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const patched = [];

for (const [slug, copy] of Object.entries(COPY)) {
  const token = `data-game="${slug}"`;
  const tokenIndex = home.indexOf(token);
  if (tokenIndex < 0) continue;
  const articleStart = home.lastIndexOf('<article', tokenIndex);
  const articleClose = home.indexOf('</article>', tokenIndex);
  if (articleStart < 0 || articleClose < 0) throw new Error(`NEGOTIATOR card bounds not found: ${slug}`);
  const articleEnd = articleClose + '</article>'.length;
  let article = home.slice(articleStart, articleEnd);
  if (!article.includes('class="card-values"')) continue;

  article = replaceValue(article, 'こんな人に', copy.forWho);
  article = replaceValue(article, 'なんのため', copy.purpose);
  article = replaceValue(article, 'ベネフィット', copy.benefit);
  home = home.slice(0, articleStart) + article + home.slice(articleEnd);

  const game = catalog.games.find((item) => item.slug === slug);
  if (game) Object.assign(game, copy);
  patched.push(slug);
}

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

for (const slug of patched) {
  for (const text of Object.values(COPY[slug])) {
    if (!home.includes(escapeHtml(text))) throw new Error(`NEGOTIATOR card copy patch missing: ${slug}`);
  }
}

console.log(`[Firebase] NEGOTIATOR card copy patched: ${patched.join(', ') || 'none present'}`);
