import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'important-first';
const title = '急ぎの仕事ばかりで大事なことが進まない人の「重要を先にする」4象限トレーニング';
const obi = '重要度×緊急度で仕分け、未来に効くQ2を先に予定へ入れる。';
const forWho = '急ぎの依頼に一日を使い切り、重要だけど急がない仕事を後回しにしやすい人';
const purpose = 'タスクを重要度×緊急度の4象限へ仕分け、Q2を先に予定へ確保する判断を反射化する';
const benefit = '目の前の火消しだけで終わらず、将来の成果につながる重要事項を実際に進めやすくなる';

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`important-first book-copy input missing: ${file}`);
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('important-first missing from catalog before book-copy patch.');
Object.assign(game, { title, description: obi, forWho, purpose, benefit });
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = html.indexOf(token);
if (tokenIndex < 0) throw new Error('important-first missing from home before book-copy patch.');
const articleStart = html.lastIndexOf('<article', tokenIndex);
const articleClose = html.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('important-first article bounds not found.');
const articleEnd = articleClose + '</article>'.length;
let article = html.slice(articleStart, articleEnd);

article = article.replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(article)) throw new Error('important-first h2 missing.');
article = article.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(title)}</h2>\n      <p class="book-obi">${escapeHtml(obi)}</p>`);
article = article.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(title)}をお気に入りに追加"`);
article = article
  .replace('考える力を、知識ではなく反射として鍛えたい人', escapeHtml(forWho))
  .replace('短い問題を繰り返して、使える思考の型を増やす', escapeHtml(purpose))
  .replace('初めて見る問題でも、切り口を素早く作りやすくなる', escapeHtml(benefit));
html = html.slice(0, articleStart) + article + html.slice(articleEnd);
fs.writeFileSync(homePath, html);

const finalArticle = html.slice(articleStart, html.indexOf('</article>', articleStart) + '</article>'.length);
for (const expected of [escapeHtml(title), escapeHtml(obi), escapeHtml(forWho), escapeHtml(purpose), escapeHtml(benefit)]) {
  if (!finalArticle.includes(expected)) throw new Error(`important-first app-specific card copy missing: ${expected}`);
}

console.log('[Firebase] important-first book-cover title + app-specific card copy added before all-card validator.');
