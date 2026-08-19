import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');

for (const required of [homePath, catalogPath, manifestPath]) {
  if (!fs.existsSync(required)) throw new Error(`LEVEL UP auto-discovery prerequisite missing: ${required}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');

const existing = new Set(catalog.games.map((game) => game.slug));
const missing = manifest.games.filter((game) => game.category === 'levelup' && !existing.has(game.slug));

const AUTO_META = {
  nukeru: {
    title: 'ぬける。',
    kicker: '60–90 SEC RESET',
    skill: '感情調整 / 切り替え',
    icon: '↓',
    forWho: '嫌なことが頭から離れず、考える余力もない人',
    purpose: '原因分析より先に、今の感情との距離を少し作る',
    benefit: '約1分で「嫌さ」を測り直し、日常へ戻りやすくする',
  },
  uchite: {
    title: '打ち手を増やせ。',
    kicker: 'OPTION TRAINING',
    skill: '問題解決 / 発想の幅',
    icon: '↗',
    forWho: '困ると同じ考え方を繰り返し、次の一手が出なくなる人',
    purpose: '聞く・調べる・分析・実験・委任など、問題解決の入口を増やす',
    benefit: '初めての問題でも「別方向の一手」を複数出しやすくなる',
  },
  'idea-lenses-40': {
    title: '発想筋40',
    kicker: '40 IDEA LENSES',
    skill: '発想力 / 打ち手づくり',
    icon: '✳',
    forWho: '困ったとき、いつも同じ打ち手しか思いつかない人',
    purpose: '40の変形視点を反射で呼び出せるようにする',
    benefit: '1つの問題から複数方向の打ち手を素早く出しやすくする',
  },
  atsumaru: {
    title: '集まる？',
    kicker: 'UNCERTAINTY → TEST',
    skill: '集客不安 / 仮説検証',
    icon: '?',
    forWho: '新しい企画やコンテストを始めたいが「人が来なかったら」と不安な人',
    purpose: '曖昧な不安を4つの未検証仮説へ分け、最弱点を見つける',
    benefit: '今日確かめる1アクションが決まり、結果待ちの不安を検証へ変えられる',
  },
  'life-plus-one': {
    title: 'LIFE +1',
    kicker: 'AI LIFE DELTA',
    skill: '自己理解 / 振り返り',
    icon: '+1',
    forWho: '毎日いろいろやっているのに、何も進んでいない気がする人',
    purpose: '今日の出来事から、昨日までになかった人生の差分を見つける',
    benefit: '大きな成果がない日でも、経験・回復・学び・関係などの蓄積を確認できる',
  },
};

function cleanTitle(value, slug) {
  const title = String(value || slug)
    .replace(/\s*[|｜]\s*LEVEL\s*UP\s*$/i, '')
    .replace(/\s*[—–-]\s*LEVEL\s*UP\s*$/i, '')
    .trim();
  return title || slug;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function makeGame(item) {
  const meta = GAME_META[item.slug];
  const special = AUTO_META[item.slug] || {};
  const description = meta?.[1] || '短いプレイを反復して、考え方や行動の型を身につける。';
  return {
    slug: item.slug,
    title: special.title || cleanTitle(item.title, item.slug),
    kicker: special.kicker || 'NEW THINKING TRAINING',
    skill: special.skill || '思考トレーニング',
    description,
    icon: special.icon || 'NEW',
    href: `/apps/${encodeURIComponent(item.slug)}/`,
    updateCount: 1,
    forWho: special.forWho || '考える力を、知識ではなく反射として鍛えたい人',
    purpose: special.purpose || '短い問題を繰り返して、使える思考の型を増やす',
    benefit: special.benefit || '初めて見る問題でも、切り口を素早く作りやすくなる',
  };
}

function makeCard(game) {
  return `
  <article class="card is-new" data-game="${escapeHtml(game.slug)}" data-new="true">
    <button class="favorite" type="button" data-favorite="${escapeHtml(game.slug)}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(game.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${escapeHtml(game.icon)}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <p>${escapeHtml(game.description)}</p>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(game.forWho)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(game.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(game.benefit)}</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;
}

let html = fs.readFileSync(homePath, 'utf8');
const beforeCount = catalog.games.length;

for (const item of missing) {
  const game = makeGame(item);
  const builtIndex = path.join(outDir, 'apps', item.slug, 'index.html');
  if (!fs.existsSync(builtIndex)) throw new Error(`Auto-discovered LEVEL UP app is missing index.html: ${item.slug}`);

  catalog.games.unshift(game);
  existing.add(item.slug);

  if (!html.includes(`data-game="${item.slug}"`)) {
    if (!html.includes('<div class="grid">')) throw new Error('LEVEL UP card grid not found.');
    html = html.replace('<div class="grid">', `<div class="grid">${makeCard(game)}`);
  }
}

const afterCount = catalog.games.length;
if (afterCount !== beforeCount) {
  html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${afterCount}</strong><span>TRAINING GAMES</span>`);
  html = html.replace(/<span>\d+ games<\/span>/, `<span>${afterCount} games</span>`);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(homePath, html);
}

const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
for (const item of manifest.games.filter((game) => game.category === 'levelup')) {
  if (!finalCatalog.games.some((game) => game.slug === item.slug)) {
    throw new Error(`LEVEL UP game is in Firebase manifest but missing from catalog: ${item.slug}`);
  }
  if (!finalHome.includes(`data-game="${item.slug}"`)) {
    throw new Error(`LEVEL UP game is in Firebase manifest but missing from home: ${item.slug}`);
  }
}

console.log(`[Firebase] LEVEL UP auto-discovery: added ${afterCount - beforeCount}; catalog=${afterCount}; every manifest levelup game is on home.`);
