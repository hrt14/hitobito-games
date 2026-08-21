import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'important-first';
const copy = {
  forWho: '急ぎの用事に反応し続けて、本当に大事なことが後回しになる人',
  purpose: '重要度×緊急度の4象限で瞬時に仕分け、重要だけど急がないことを先に守る',
  benefit: '目の前の「至急」に流されず、未来に効く重要タスクへ時間を使いやすくなる',
};

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`important-first card-copy input missing: ${file}`);
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('important-first is missing from LEVEL UP home after auto-discovery.');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('important-first card bounds not found.');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);

function replaceValue(source, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(source)) throw new Error(`important-first card field missing: ${label}`);
  return source.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);
home = home.slice(0, articleStart) + article + home.slice(articleEnd);

const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('important-first is missing from LEVEL UP catalog.');
Object.assign(game, copy);

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

for (const text of Object.values(copy)) {
  if (!home.includes(escapeHtml(text))) throw new Error(`important-first specific copy missing after patch: ${text}`);
}

console.log('[Firebase] important-first app-specific card copy applied before generic-copy quality gate.');
