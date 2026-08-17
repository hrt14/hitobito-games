import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const appPath = path.join(outDir, 'apps', 'meeting-respawn', 'index.html');
const sourceAppDir = path.join(root, 'apps', 'meeting-respawn');
const builtAppDir = path.join(outDir, 'apps', 'meeting-respawn');

const game = {
  slug: 'meeting-respawn',
  title: '会議リスポーン',
  kicker: 'RESET. SHRINK. RESTART.',
  skill: '会議後の切り替え / 再着手',
  description: '会議後のぐったりを短く切り替え、次の仕事を30秒の一手まで小さくして実際に始める。',
  icon: '↻',
  href: '/apps/meeting-respawn/',
  updateCount: 2,
};

for (const required of [homePath, catalogPath, manifestPath, sourceAppDir]) {
  if (!fs.existsSync(required)) throw new Error(`Meeting Respawn injection prerequisite missing: ${required}`);
}
if (!fs.existsSync(appPath)) {
  fs.mkdirSync(path.dirname(builtAppDir), { recursive: true });
  fs.cpSync(sourceAppDir, builtAppDir, { recursive: true });
}
if (!fs.existsSync(appPath)) throw new Error('Meeting Respawn app copy failed.');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
if (!manifest.games.some((item) => item.slug === game.slug)) {
  manifest.games.push({ slug: game.slug, category: 'levelup', title: '会議リスポーン | LEVEL UP' });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');

const oldCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) {
  const after = catalog.games.findIndex((item) => item.slug === 'task-separation');
  const index = after >= 0 ? after + 1 : Math.min(4, catalog.games.length);
  catalog.games.splice(index, 0, game);
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
  <article class="card" data-game="${escapeHtml(game.slug)}">
    <button class="favorite" type="button" data-favorite="${escapeHtml(game.slug)}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(game.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${escapeHtml(game.icon)}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <p>${escapeHtml(game.description)}</p>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${game.slug}"`)) {
  const anchor = /(<article class="card" data-game="task-separation">[\s\S]*?<\/article>)/;
  if (anchor.test(html)) html = html.replace(anchor, `$1${card}`);
  else if (html.includes('<div class="grid">')) html = html.replace('<div class="grid">', `<div class="grid">${card}`);
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
if (!finalHome.includes(`data-game="${game.slug}"`)) throw new Error('Meeting Respawn card injection failed.');
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('Meeting Respawn catalog injection failed.');
const finalManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!finalManifest.games.some((item) => item.slug === game.slug && item.category === 'levelup')) throw new Error('Meeting Respawn manifest injection failed.');
if (!finalHome.includes(`<span>${newCount} games</span>`)) throw new Error('LEVEL UP game count was not updated.');

console.log(`[Firebase] Meeting Respawn injected into LEVEL UP home/catalog: ${newCount} games`);
