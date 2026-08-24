import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const appPath = path.join(outDir, 'apps', 'zenbu-yaranai', 'index.html');

const game = {
  slug: 'zenbu-yaranai',
  title: '全部やらなくていい',
  kicker: 'ONE THING. MINIMUM. DROP.',
  skill: '高負荷 / 一個ずつ',
  description: '仕事が多すぎるとき、今の一件・最低成立ライン・今回はやらないことを決めて、25分だけ前へ進む。',
  icon: '1',
  href: '/apps/zenbu-yaranai/',
  updateCount: 2,
};

for (const required of [homePath, catalogPath, manifestPath, appPath]) {
  if (!fs.existsSync(required)) throw new Error(`Zenbu-yaranai injection prerequisite missing: ${required}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
if (!manifest.games.some((item) => item.slug === game.slug && item.category === 'levelup')) {
  throw new Error('zenbu-yaranai must be categorized as levelup before home injection.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');

const oldCount = catalog.games.length;
const existing = catalog.games.find((item) => item.slug === game.slug);
if (existing) Object.assign(existing, game);
else catalog.games.unshift(game);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
const newCount = catalog.games.length;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const card = `
  <article class="card is-new" data-game="${escapeHtml(game.slug)}" data-new="true">
    <button class="favorite" type="button" data-favorite="${escapeHtml(game.slug)}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(game.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${escapeHtml(game.icon)}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">仕事・締切・移動・会議が重なり、全部ちゃんとやろうとして処理順が見えなくなっている人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">今の一件と最低成立ラインを決め、今回はやらないことを先に切る</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">「全部終わっていない」から離れ、今はこの一件だけやる状態へ戻る</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
const existingCard = new RegExp(`<article class="card[^>]*data-game="${game.slug}"[\\s\\S]*?<\\/article>`);
if (existingCard.test(html)) html = html.replace(existingCard, card.trim());
else if (html.includes('<div class="grid">')) html = html.replace('<div class="grid">', `<div class="grid">${card}`);
else throw new Error('LEVEL UP card grid not found.');

if (newCount !== oldCount) {
  html = html.replace(
    `<strong>${oldCount}</strong><span>TRAINING GAMES</span>`,
    `<strong>${newCount}</strong><span>TRAINING GAMES</span>`,
  );
  html = html.replace(`<span>${oldCount} games</span>`, `<span>${newCount} games</span>`);
}

fs.writeFileSync(homePath, html);

const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!finalHome.includes(`data-game="${game.slug}"`)) throw new Error('Zenbu-yaranai card injection failed.');
if (!finalHome.includes(`data-game="${game.slug}" data-new="true"`)) throw new Error('Zenbu-yaranai NEW marker injection failed.');
if (!finalHome.includes('今の一件と最低成立ラインを決め、今回はやらないことを先に切る')) throw new Error('Zenbu-yaranai card value metadata missing.');
if (!finalCatalog.games.some((item) => item.slug === game.slug && item.title === game.title)) throw new Error('Zenbu-yaranai catalog update failed.');
if (!finalHome.includes(`<span>${newCount} games</span>`)) throw new Error('LEVEL UP game count was not updated.');

console.log(`[Firebase] 全部やらなくていい injected into LEVEL UP home/catalog as NEW: ${newCount} games`);
