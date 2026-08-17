import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const source = path.join(root, 'firebase-special-apps', 'nemuri-no-umi');
const outDir = path.join(root, '.dist', 'firebase');
const destination = path.join(outDir, 'apps', 'nemuri-no-umi');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

const game = {
  slug: 'nemuri-no-umi',
  title: 'ねむりの海。',
  kicker: 'SLOWER IS BETTER',
  skill: '睡眠 / クールダウン',
  description: '光をゆっくり長押しするほど、月が沈み、星と文字が減り、夜が静かになる。勝たずに終わる寝る前ゲーム。',
  icon: '☾',
  href: '/apps/nemuri-no-umi/',
  updateCount: 1,
};

for (const required of [source, homePath, catalogPath]) {
  if (!fs.existsSync(required)) throw new Error(`Sleep game injection prerequisite missing: ${required}`);
}
if (!fs.existsSync(path.join(source, 'index.html'))) {
  throw new Error('Sleep game source is missing index.html.');
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });
if (!fs.existsSync(path.join(destination, 'index.html'))) throw new Error('Sleep game copy failed.');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');
const oldCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) {
  catalog.games.unshift(game);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
}
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
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">寝る直前までスマホを触ってしまい、刺激を切りにくい人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">速さや勝敗のない反復で、画面の刺激を少しずつ減らしていく</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">遊びの終わりがそのまま「スマホを置く」行動につながる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${game.slug}"`)) {
  if (!html.includes('<div class="grid">')) throw new Error('LEVEL UP card grid not found.');
  html = html.replace('<div class="grid">', `<div class="grid">${card}`);
}

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
if (!finalHome.includes(`data-game="${game.slug}" data-new="true"`)) throw new Error('Sleep game card injection failed.');
if (!finalHome.includes('遊びの終わりがそのまま「スマホを置く」行動につながる')) throw new Error('Sleep game benefit copy missing.');
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('Sleep game catalog injection failed.');
if (!fs.existsSync(path.join(destination, 'index.html'))) throw new Error('Sleep game output route missing.');

console.log(`[Firebase] Sleep game injected into LEVEL UP as NEW: ${newCount} games`);
