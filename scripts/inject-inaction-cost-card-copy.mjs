import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`LEVEL UP card-copy input missing: ${file}`);
}

const CARDS = {
  'inaction-cost': {
    kicker: 'RUNWAY OR ANESTHETIC?',
    skill: '先延ばし / 機会コスト / 意思決定',
    forWho: 'やった方がいいと分かっているのに、面倒・不安・失敗の怖さで決めることを先延ばししている人',
    purpose: '「今やる痛み」だけでなく「何もしない未来」も同じ天秤に乗せ、待つ意味を公平に見直す',
    benefit: '待つなら準備の滑走路に変え、単なる回避なら今できる最小の一手を1つ決めて終えられる',
  },
  'confidence-before-results': {
    kicker: 'CONFIDENCE BEFORE RESULTS',
    skill: '自己効力感 / 着手 / 継続',
    forWho: '実績不足・失敗評価・準備不足・他人比較が気になり、挑戦の最初の一手が弱くなりやすい人',
    purpose: '自信を「成功した後のご褒美」から「結果が出る前に次の一手を出す前提」へ置き直す',
    benefit: '成功を思い込まずに、10分以内の一手を決めて3・2・1で現実の行動を始めやすくなる',
  },
  'breakthrough-90': {
    kicker: 'ZOOM OUT. MOVE ONE STEP.',
    skill: '俯瞰 / 比較リセット / 次の一手',
    forWho: '新しい挑戦が行き詰まり、「もう無理かも」と次の一手が見えなくなっている人',
    purpose: '時間軸を10年まで引き、他人比較を外して、考える対象を昨日の自分と次の15分へ戻す',
    benefit: '八方塞がりの感覚を抱えたままでも、いま実行できる具体的な一手を1つ決めて動き始めやすくなる',
  },
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value, slug) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`${slug} card value missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const generic = [
  '考える力を、知識ではなく反射として鍛えたい人',
  '短い問題を繰り返して、使える思考の型を増やす',
  '初めて見る問題でも、切り口を素早く作りやすくなる',
];

function patchCard(slug, copy) {
  const token = `data-game="${slug}"`;
  const tokenIndex = home.indexOf(token);
  if (tokenIndex < 0) throw new Error(`${slug} card not found on LEVEL UP home.`);

  const articleStart = home.lastIndexOf('<article', tokenIndex);
  const articleClose = home.indexOf('</article>', tokenIndex);
  if (articleStart < 0 || articleClose < 0) throw new Error(`${slug} card bounds not found.`);
  const articleEnd = articleClose + '</article>'.length;
  let article = home.slice(articleStart, articleEnd);

  article = article.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${escapeHtml(copy.kicker)}</div>`);
  article = article.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${escapeHtml(copy.skill)}</div>`);
  article = replaceValue(article, 'こんな人に', copy.forWho, slug);
  article = replaceValue(article, 'なんのため', copy.purpose, slug);
  article = replaceValue(article, 'ベネフィット', copy.benefit, slug);

  if (generic.some((text) => article.includes(text))) {
    throw new Error(`${slug} card still contains generic LEVEL UP copy.`);
  }

  home = home.slice(0, articleStart) + article + home.slice(articleEnd);

  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} catalog entry not found.`);
  Object.assign(game, copy);

  for (const text of Object.values(copy)) {
    if (!article.includes(escapeHtml(text))) throw new Error(`${slug} card copy missing after patch: ${text}`);
  }
}

for (const [slug, copy] of Object.entries(CARDS)) patchCard(slug, copy);

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

console.log('[Firebase] 何もしないコスト + 結果が出る前に自信をつくる + breakthrough-90 app-specific LEVEL UP card copy injected.');
