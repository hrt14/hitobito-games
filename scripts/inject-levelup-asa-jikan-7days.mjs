import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const sourceDir = path.join(root, 'apps', 'asa-jikan-7days');
const outDir = path.join(root, '.dist', 'firebase');
const appDir = path.join(outDir, 'apps', 'asa-jikan-7days');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

const game = {
  slug: 'asa-jikan-7days',
  title: '睡眠を削らず、朝時間を取り戻す7日間',
  kicker: '7-DAY MORNING RESET',
  skill: '睡眠習慣 / 朝時間',
  description: '夜を毎日1つ整え、睡眠を守れた朝だけ「朝時間貯金」に加算。7日で無理のない朝型リズムをつくる。',
  icon: '☀',
  href: '/apps/asa-jikan-7days/',
  updateCount: 1,
};

for (const required of [sourceDir, manifestPath, catalogPath, homePath]) {
  if (!fs.existsSync(required)) throw new Error(`Morning 7 prerequisite missing: ${required}`);
}

fs.rmSync(appDir, { recursive: true, force: true });
fs.cpSync(sourceDir, appDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
if (!manifest.games.some((item) => item.slug === game.slug)) {
  manifest.games.push({ slug: game.slug, category: 'levelup', title: game.title });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
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
      <div class="card-values" aria-label="このアプリの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">朝の時間が欲しいのに、早起きすると睡眠まで削ってしまう人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">夜を先に整えて、睡眠を守ったまま起床リズムを前へ動かす</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">7日間で「守れた睡眠」と「取り戻せた朝時間」を見える化できる</span></div>
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
  html = html.replace(`<strong>${oldCount}</strong><span>TRAINING GAMES</span>`, `<strong>${newCount}</strong><span>TRAINING GAMES</span>`);
  html = html.replace(`<span>${oldCount} games</span>`, `<span>${newCount} games</span>`);
}
fs.writeFileSync(homePath, html);

const finalHome = fs.readFileSync(homePath, 'utf8');
const finalManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!fs.existsSync(path.join(appDir, 'index.html'))) throw new Error('Morning 7 app copy failed.');
if (!finalManifest.games.some((item) => item.slug === game.slug && item.category === 'levelup')) throw new Error('Morning 7 manifest injection failed.');
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('Morning 7 catalog injection failed.');
if (!finalHome.includes(`data-game="${game.slug}" data-new="true"`)) throw new Error('Morning 7 home card injection failed.');
if (!finalHome.includes('7日間で「守れた睡眠」と「取り戻せた朝時間」を見える化できる')) throw new Error('Morning 7 tailored card copy missing.');

console.log(`[Firebase] Morning 7 injected into LEVEL UP: ${newCount} catalog games`);
