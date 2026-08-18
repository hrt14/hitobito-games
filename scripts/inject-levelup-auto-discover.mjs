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
  const description = meta?.[1] || '短いプレイを反復して、考え方や行動の型を身につける。';
  return {
    slug: item.slug,
    title: cleanTitle(item.title, item.slug),
    kicker: 'NEW THINKING TRAINING',
    skill: '思考トレーニング',
    description,
    icon: 'NEW',
    href: `/apps/${encodeURIComponent(item.slug)}/`,
    updateCount: 1,
  };
}

function makeCard(game) {
  return `\n  <article class="card is-new" data-game="${escapeHtml(game.slug)}" data-new="true">\n    <button class="favorite" type="button" data-favorite="${escapeHtml(game.slug)}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>\n    <a class="card-link" href="${escapeHtml(game.href)}">\n      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>\n      <div class="icon">${escapeHtml(game.icon)}</div>\n      <div class="kicker">${escapeHtml(game.kicker)}</div>\n      <div class="skill">${escapeHtml(game.skill)}</div>\n      <h2>${escapeHtml(game.title)}</h2>\n      <p>${escapeHtml(game.description)}</p>\n      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">\n        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">考える力を、知識ではなく反射として鍛えたい人</span></div>\n        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">短い問題を繰り返して、使える思考の型を増やす</span></div>\n        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">初めて見る問題でも、切り口を素早く作りやすくなる</span></div>\n      </div>\n      <div class="play">PLAY <span>↗</span></div>\n    </a>\n  </article>`;
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
