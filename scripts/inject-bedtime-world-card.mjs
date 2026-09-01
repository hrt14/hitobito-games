import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'bedtime-world';

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`bedtime-world card-copy input missing: ${file}`);
}

const copy = {
  kicker: 'NIGHTLY CONTINUATION',
  skill: '想像 / 就寝 / 切り替え',
  forWho: '早く寝たいのに、寝るよりスマホや作業の続きを選んでしまう人',
  purpose: '寝る前だけ進められる想像世界を作り、布団に入ること自体を毎晩の楽しみに変える',
  benefit: '「早く寝なきゃ」ではなく「今夜の続きを見たい」から、自然に布団へ向かいやすくなる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`bedtime-world card value missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error('bedtime-world card not found on LEVEL UP home.');

const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('bedtime-world card bounds not found.');
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
  throw new Error('bedtime-world card still contains generic LEVEL UP copy.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('bedtime-world catalog entry not found.');
Object.assign(game, copy);

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

for (const text of Object.values(copy)) {
  if (!home.includes(escapeHtml(text))) throw new Error(`bedtime-world card copy missing after patch: ${text}`);
}

console.log('[Firebase] bedtime-world app-specific LEVEL UP card copy injected.');
