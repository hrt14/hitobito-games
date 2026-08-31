import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

const APPS = {
  'expectation-reset': {
    kicker: 'EXPECT LESS / DO NEXT',
    skill: '期待を置く / 現実受容 / 次の一手',
    forWho: '思いどおりにならない出来事が続くと、期待とのズレで消耗しやすい人',
    purpose: '問題が起きる前提を通し、手放す期待を1つ選んで、行動へ戻る手順を反復する',
    benefit: '状況への抵抗を長引かせず、1〜3分で自分ができる小さい一手へ戻りやすくなる',
  },
  'moya-30': {
    kicker: 'MOYA / OUTSIDE',
    skill: 'モヤモヤ / 感覚化 / 30秒リセット',
    forWho: '理由をうまく言葉にできないモヤモヤが、その場で頭や身体に残りやすい人',
    purpose: '正体を考え込みすぎず、近い感覚を選び、短い操作でいったん外へ動かす',
    benefit: '30秒でモヤモヤとの距離を少し作り、水・歩く・一手進める・休むから次を選びやすくなる',
  },
};

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`new reset card-copy input missing: ${file}`);
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function replaceValue(article, label, value, slug) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`${slug} card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const [slug, copy] of Object.entries(APPS)) {
  const token = `data-game="${slug}"`;
  const tokenIndex = home.indexOf(token);
  if (tokenIndex < 0) throw new Error(`${slug} card not found on LEVEL UP home`);
  const articleStart = home.lastIndexOf('<article', tokenIndex);
  const articleClose = home.indexOf('</article>', tokenIndex);
  if (articleStart < 0 || articleClose < 0) throw new Error(`${slug} card bounds not found`);
  const articleEnd = articleClose + '</article>'.length;
  let article = home.slice(articleStart, articleEnd);
  article = article.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${escapeHtml(copy.kicker)}</div>`);
  article = article.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${escapeHtml(copy.skill)}</div>`);
  article = replaceValue(article, 'こんな人に', copy.forWho, slug);
  article = replaceValue(article, 'なんのため', copy.purpose, slug);
  article = replaceValue(article, 'ベネフィット', copy.benefit, slug);
  home = home.slice(0, articleStart) + article + home.slice(articleEnd);

  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} missing from LEVEL UP catalog`);
  Object.assign(game, copy);
}

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] expectation-reset and moya-30 app-specific card copy injected.');
