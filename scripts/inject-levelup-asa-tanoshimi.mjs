import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const appPath = path.join(outDir, 'apps', 'asa-tanoshimi', 'index.html');

const game = {
  slug: 'asa-tanoshimi',
  title: '朝が楽しみ。',
  kicker: 'SLEEP TOWARD SOMETHING',
  skill: '睡眠 / 期待づくり',
  description: '寝る前に次の朝の小さな楽しみを1つ予約し、朝までは封印。起きたら開封して、早寝を我慢ではなく期待に変える。',
  icon: '☀',
  href: '/apps/asa-tanoshimi/',
  updateCount: 1,
};

for (const required of [homePath, catalogPath, manifestPath, appPath]) {
  if (!fs.existsSync(required)) throw new Error(`Morning reward injection prerequisite missing: ${required}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
if (!manifest.games.some((item) => item.slug === game.slug && item.category === 'levelup')) {
  throw new Error('asa-tanoshimi must be categorized as levelup before home injection.');
}

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
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">朝や早寝を「楽しみ」より義務に感じやすい人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">翌朝の小さな楽しみを予約して、眠る理由を期待に変える</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">明日の朝を楽しみにしながら、自然に寝る方向へ切り替えやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${game.slug}"`)) {
  if (html.includes('<div class="grid">')) html = html.replace('<div class="grid">', `<div class="grid">${card}`);
  else throw new Error('LEVEL UP card grid not found.');
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
if (!finalHome.includes(`data-game="${game.slug}"`)) throw new Error('Morning reward card injection failed.');
if (!finalHome.includes(`data-game="${game.slug}" data-new="true"`)) throw new Error('Morning reward NEW marker injection failed.');
if (!finalHome.includes('翌朝の小さな楽しみを予約して、眠る理由を期待に変える')) throw new Error('Morning reward card value metadata missing.');
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('Morning reward catalog injection failed.');
if (!finalHome.includes(`<span>${newCount} games</span>`)) throw new Error('LEVEL UP game count was not updated.');

console.log(`[Firebase] Morning reward injected into LEVEL UP home/catalog as NEW: ${newCount} games`);
