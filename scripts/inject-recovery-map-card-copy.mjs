import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'recovery-map';
const copy = {
  forWho: '疲れているのに、頭を休めるべきか身体を休めるべきか分からない人',
  purpose: '今の疲れのサインを頭・気持ち／身体に分け、原因を決めつけず休み方を選ぶ',
  benefit: '約90秒で今の偏りを見える化し、次の10分にやる低リスクな回復行動を1つ決められる',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for recovery-map card copy.');
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`recovery-map card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('recovery-map card missing from LEVEL UP home.');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('recovery-map card bounds missing.');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);
article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);
home = home.slice(0, articleStart) + article + home.slice(articleEnd);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('recovery-map missing from LEVEL UP catalog.');
Object.assign(game, copy);

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log('[Firebase] recovery-map app-specific LEVEL UP card copy injected.');
