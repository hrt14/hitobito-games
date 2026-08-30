import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'thick-self';
const data = {
  title: '分厚い自分をつくる',
  kicker: 'DAILY 3-MIN RESPONSE TRAINING',
  skill: '心の厚み / 7つの反応',
  icon: '層',
  forWho: '批判・比較・失敗・成功などで心が大きく動いたとき、知識では分かっていても反射的に反応してしまう人',
  purpose: '余白・受容・距離・曖昧さ・奥行き・軽やかさ・復元を、現実場面の短い反復で同時に鍛える',
  benefit: '嫌な感情や欲を消さずに持ったまま、即反応せず、選び直し、取り乱しても日常へ戻りやすくする',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) process.exit(0);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('thick-self missing from LEVEL UP catalog');
Object.assign(game, data);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = html.indexOf(token);
if (tokenIndex < 0) throw new Error('thick-self card missing from LEVEL UP home');
const articleStart = html.lastIndexOf('<article', tokenIndex);
const articleClose = html.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error('thick-self card bounds not found');
const articleEnd = articleClose + '</article>'.length;
let article = html.slice(articleStart, articleEnd);

article = article
  .replace(/<div class="icon">[\s\S]*?<\/div>/, `<div class="icon">${data.icon}</div>`)
  .replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${data.kicker}</div>`)
  .replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${data.skill}</div>`)
  .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${data.title}</h2>`)
  .replace(/(<span class="card-value-label">こんな人に<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${data.forWho}$2`)
  .replace(/(<span class="card-value-label">なんのため<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${data.purpose}$2`)
  .replace(/(<span class="card-value-label">ベネフィット<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${data.benefit}$2`);

for (const generic of [
  '考える力を、知識ではなく反射として鍛えたい人',
  '短い問題を繰り返して、使える思考の型を増やす',
  '初めて見る問題でも、切り口を素早く作りやすくなる',
]) {
  if (article.includes(generic)) throw new Error(`thick-self generic card copy remains: ${generic}`);
}

html = html.slice(0, articleStart) + article + html.slice(articleEnd);
fs.writeFileSync(homePath, html);
console.log('[Firebase] thick-self card copy injected and verified.');
