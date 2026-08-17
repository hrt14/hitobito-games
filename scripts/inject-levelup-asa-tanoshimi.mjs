import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const sourceAppDir = path.join(root, 'apps', 'asa-tanoshimi');
const builtAppDir = path.join(outDir, 'apps', 'asa-tanoshimi');

const game = {
  slug: 'asa-tanoshimi',
  title: '朝が待ち遠しい',
  kicker: 'PUT JOY IN THE MORNING',
  skill: '早寝 / 朝の期待づくり',
  description: '寝る前に次の朝の小さな楽しみを1つ予約し、朝までは封印。起きたら開封して、早寝を我慢ではなく期待に変える。',
  icon: '☀',
  href: '/apps/asa-tanoshimi/',
  updateCount: 1,
};

for (const required of [homePath, catalogPath, manifestPath, sourceAppDir]) {
  if (!fs.existsSync(required)) throw new Error(`Morning Joy injection prerequisite missing: ${required}`);
}
if (!fs.existsSync(path.join(builtAppDir, 'index.html'))) {
  fs.mkdirSync(path.dirname(builtAppDir), { recursive: true });
  fs.cpSync(sourceAppDir, builtAppDir, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
if (!manifest.games.some((item) => item.slug === game.slug)) {
  manifest.games.push({ slug: game.slug, category: 'levelup', title: '朝が待ち遠しい | LEVEL UP' });
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

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const card = `
  <article class="card is-new" data-game="${game.slug}" data-new="true">
    <button class="favorite" type="button" data-favorite="${game.slug}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${game.href}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${game.icon}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">早く寝たいのに、夜を終える理由が弱い人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">次の朝に小さな楽しみを先に置く</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">「寝なきゃ」を「早く朝になってほしい」に変えやすくなる</span></div>
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
  html = html.replace(new RegExp(`<strong>${oldCount}</strong><span>TRAINING GAMES</span>`), `<strong>${newCount}</strong><span>TRAINING GAMES</span>`);
  html = html.replace(new RegExp(`<span>${oldCount} games</span>`), `<span>${newCount} games</span>`);
}

fs.writeFileSync(homePath, html);
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const finalManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!finalHome.includes(`data-game="${game.slug}"`)) throw new Error('Morning Joy card injection failed.');
if (!finalHome.includes(`data-game="${game.slug}" data-new="true"`)) throw new Error('Morning Joy NEW marker missing.');
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('Morning Joy catalog injection failed.');
if (!finalManifest.games.some((item) => item.slug === game.slug && item.category === 'levelup')) throw new Error('Morning Joy manifest injection failed.');
if (!fs.existsSync(path.join(builtAppDir, 'app.js'))) throw new Error('Morning Joy app bundle missing app.js.');

console.log(`[Firebase] Morning Joy injected into LEVEL UP home/catalog: ${newCount} games`);
