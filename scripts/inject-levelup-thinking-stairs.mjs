import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const sourceAppDir = path.join(root, 'apps', 'thinking-stairs');
const builtAppDir = path.join(outDir, 'apps', 'thinking-stairs');
const appPath = path.join(builtAppDir, 'index.html');

const game = {
  slug: 'thinking-stairs',
  title: '思考の階段',
  kicker: 'THINK HIGH. THINK LOW. SWITCH.',
  skill: '思考の切り替え / メタ認知',
  description: '高い段を選ぶのではなく、状況に合う思考へ上がる・降りる反射を10問で鍛える。',
  icon: '↕',
  href: '/apps/thinking-stairs/',
  updateCount: 1,
};

for (const required of [homePath, catalogPath, manifestPath, sourceAppDir]) {
  if (!fs.existsSync(required)) throw new Error(`Thinking Stairs injection prerequisite missing: ${required}`);
}

if (!fs.existsSync(appPath)) {
  fs.mkdirSync(path.dirname(builtAppDir), { recursive: true });
  fs.cpSync(sourceAppDir, builtAppDir, { recursive: true });
}
if (!fs.existsSync(appPath)) throw new Error('Thinking Stairs app copy failed.');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
if (!manifest.games.some((item) => item.slug === game.slug)) {
  manifest.games.push({ slug: game.slug, category: 'levelup', title: '思考の階段 | LEVEL UP' });
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
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">怒り・焦り・思い込みで、考え方が一つに固まりやすい人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">状況に応じて思考の段を上り下りする反射を鍛える</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">考えすぎも反射しすぎも減らし、必要な思考へ切り替えやすくなる</span></div>
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
const finalManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!finalHome.includes(`data-game="${game.slug}" data-new="true"`)) throw new Error('Thinking Stairs NEW card injection failed.');
if (!finalHome.includes(`href="${game.href}"`)) throw new Error('Thinking Stairs card link injection failed.');
if (!finalHome.includes('状況に応じて思考の段を上り下りする反射を鍛える')) throw new Error('Thinking Stairs benefit metadata injection failed.');
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('Thinking Stairs catalog injection failed.');
if (!finalManifest.games.some((item) => item.slug === game.slug && item.category === 'levelup')) throw new Error('Thinking Stairs manifest injection failed.');
if (!finalHome.includes(`<span>${newCount} games</span>`)) throw new Error('LEVEL UP game count was not updated for Thinking Stairs.');

console.log(`[Firebase] Thinking Stairs injected into LEVEL UP home/catalog as NEW: ${newCount} games`);
