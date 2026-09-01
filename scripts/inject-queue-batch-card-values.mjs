import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const COPY = {
  'one-thing-room': {
    forWho: '難しいことが重なり、疲れて何から手をつけるか決められない人',
    purpose: '頭の中の負荷を外へ出し、今の自分が少し動かせる1個だけを選ぶ',
    benefit: '全部を同時に解決しようとせず、短いリセットから次の2分へ戻りやすくなる',
  },
  'rhythm-anchor': {
    forWho: '夜の過ごし方がずれやすく、翌朝まで生活リズムを引きずりやすい人',
    purpose: '今夜の終了時刻と明日の起床時刻を決め、朝の判断を小さく準備する',
    benefit: '完璧な予定を作らず、毎晩2つの時刻から生活のリズムを戻しやすくなる',
  },
};

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`LEVEL UP queue-batch card input missing: ${file}`);
}
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`LEVEL UP queue-batch card value missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}
let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
for (const [slug, copy] of Object.entries(COPY)) {
  const token = `data-game="${slug}"`;
  const at = home.indexOf(token);
  if (at < 0) throw new Error(`LEVEL UP queue-batch card missing: ${slug}`);
  const start = home.lastIndexOf('<article', at);
  const close = home.indexOf('</article>', at);
  if (start < 0 || close < 0) throw new Error(`LEVEL UP queue-batch card bounds missing: ${slug}`);
  const end = close + '</article>'.length;
  let article = home.slice(start, end);
  article = replaceValue(article, 'こんな人に', copy.forWho);
  article = replaceValue(article, 'なんのため', copy.purpose);
  article = replaceValue(article, 'ベネフィット', copy.benefit);
  home = home.slice(0, start) + article + home.slice(end);
  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`LEVEL UP queue-batch catalog missing: ${slug}`);
  Object.assign(game, copy);
}
fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log('[Firebase] queue-batch app-specific LEVEL UP card values injected.');
