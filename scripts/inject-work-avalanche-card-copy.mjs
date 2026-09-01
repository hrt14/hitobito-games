import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'work-avalanche';

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`仕事の雪崩を止める card-copy input missing: ${file}`);
}

const copy = {
  kicker: 'STOP THE WORK AVALANCHE',
  skill: '重要仕事 / 会議後 / 仕事量',
  forWho: '会議で一日が埋まり、夕方には疲れて大事な仕事だけが残ってしまう人',
  purpose: '今日の大事な1つを先に固定し、会議で増えた仕事を今日・今週・人に返す・やらないへ仕分ける',
  benefit: '会議だらけの日でも3分復帰と12分救出で、重要仕事を何も進めないまま一日を終えにくくなる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`仕事の雪崩を止める card value missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('仕事の雪崩を止める card not found on LEVEL UP home.');

const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('仕事の雪崩を止める card bounds not found.');
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);

article = article.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${escapeHtml(copy.kicker)}</div>`);
article = article.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${escapeHtml(copy.skill)}</div>`);
article = replaceValue(article, 'こんな人に', copy.forWho);
article = replaceValue(article, 'なんのため', copy.purpose);
article = replaceValue(article, 'ベネフィット', copy.benefit);

home = home.slice(0, articleStart) + article + home.slice(articleEnd);

const generic = [
  '考える力を、知識ではなく反射として鍛えたい人',
  '短い問題を繰り返して、使える思考の型を増やす',
  '初めて見る問題でも、切り口を素早く作りやすくなる',
];
if (generic.some((text) => article.includes(text))) {
  throw new Error('仕事の雪崩を止める card still contains generic LEVEL UP copy.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('仕事の雪崩を止める catalog entry not found.');
Object.assign(game, copy);

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

for (const text of Object.values(copy)) {
  if (!home.includes(escapeHtml(text))) throw new Error(`仕事の雪崩を止める card copy missing after patch: ${text}`);
}

console.log('[Firebase] 仕事の雪崩を止める app-specific LEVEL UP card copy injected.');
