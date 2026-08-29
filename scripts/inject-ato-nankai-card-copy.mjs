import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const appCopies = {
  'ato-nankai': {
    forWho: '毎日を無限にあるように使ってしまい、大切な時間を後回しにしがちな人',
    purpose: '春・土曜日・誕生日・大切な人に会う時間を、残り年数ではなく具体的な回数に変える',
    benefit: '今日まだ残っている「1回」の重みが見え、何を雑にしないか1つ決められる',
  },
  'how-seen': {
    forWho: '自分が周囲からどう見られているか気になり、自己イメージと実際の友人評価の差を知りたい人',
    purpose: '8つの二択で自己像を出し、友人の匿名回答と4軸で比べて「自分が思う自分」と「他人から見える自分」のズレを可視化する',
    benefit: '友人の実回答から、親しみやすさ・押しの強さ・安定感・本音の見えやすさのどこに認識差があるか分かる',
  },
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, slug, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`${slug} LEVEL UP card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP card-copy inputs are missing');
}

let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const [slug, copy] of Object.entries(appCopies)) {
  const token = `data-game="${slug}"`;
  const tokenIndex = home.indexOf(token);
  if (tokenIndex < 0) throw new Error(`${slug} card is missing from LEVEL UP home`);
  const articleStart = home.lastIndexOf('<article', tokenIndex);
  const articleClose = home.indexOf('</article>', tokenIndex);
  if (articleStart < 0 || articleClose < 0) throw new Error(`${slug} card bounds not found`);
  const articleEnd = articleClose + '</article>'.length;
  let article = home.slice(articleStart, articleEnd);
  article = replaceValue(article, slug, 'こんな人に', copy.forWho);
  article = replaceValue(article, slug, 'なんのため', copy.purpose);
  article = replaceValue(article, slug, 'ベネフィット', copy.benefit);
  home = home.slice(0, articleStart) + article + home.slice(articleEnd);

  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} missing from LEVEL UP catalog`);
  Object.assign(game, copy);
}

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] ato-nankai and how-seen specific LEVEL UP card copy injected.');
