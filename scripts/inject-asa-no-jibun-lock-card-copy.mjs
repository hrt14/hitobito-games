import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'asa-no-jibun-lock';
const data = {
  title: '朝の自分に決めさせない',
  kicker: 'NIGHT DECIDES / MORNING EXECUTES',
  skill: '朝の起動 / 意思決定の前倒し',
  icon: '☀',
  description: '目覚ましの次に開く朝のオートパイロット。前夜に起床後の5行動を固定し、朝は選ばず1個ずつ実行して、予定時刻との差を記録する。',
  forWho: '明日は起きたいと分かっているのに、アラーム後の「あと5分」「今日はいいか」で布団に残りやすい人',
  purpose: '元気な前夜に朝の5行動を固定し、起床直後に「何をするか」「今日はどうするか」を考え直さない型をつくる',
  benefit: '朝は画面に出た1個だけを順番に実行し、ベッドの中の判断時間を短くして離床まで進みやすくする',
};

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) process.exit(0);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug} missing from LEVEL UP catalog`);
Object.assign(game, data);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = html.indexOf(token);
if (tokenIndex < 0) throw new Error(`${slug} card missing from LEVEL UP home`);
const articleStart = html.lastIndexOf('<article', tokenIndex);
const articleClose = html.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error(`${slug} card bounds not found`);
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
  if (article.includes(generic)) throw new Error(`${slug} generic card copy remains: ${generic}`);
}

html = html.slice(0, articleStart) + article + html.slice(articleEnd);
fs.writeFileSync(homePath, html);
console.log(`[Firebase] ${slug} card copy injected and verified.`);
