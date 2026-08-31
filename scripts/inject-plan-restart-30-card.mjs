import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'plan-restart-30';
const copy = {
  kicker: '30 SEC RESTART',
  skill: '再始動 / 予定崩れ / 着手',
  forWho: '予定どおりに進まないと、その後の仕事までやる気が落ちて止まりやすい人',
  purpose: '過ぎた区間を切り、残り時間だけを見て、次の一手を小さくする手順を固定する',
  benefit: '予定が崩れても30秒で残り時間へ戻り、3〜20分の一手を始めやすくなる',
};

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`plan-restart-30 card input missing: ${file}`);
}
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`plan-restart-30 card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}
let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('plan-restart-30 card not found on LEVEL UP home');
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('plan-restart-30 card bounds not found');
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
if (!game) throw new Error('plan-restart-30 missing from LEVEL UP catalog');
Object.assign(game, copy);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
for (const value of Object.values(copy)) {
  if (!home.includes(escapeHtml(value))) throw new Error('plan-restart-30 card copy verification failed');
}
console.log('[Firebase] plan-restart-30 app-specific LEVEL UP card copy injected and verified.');
await import('./inject-new-reset-app-card-copy.mjs');
