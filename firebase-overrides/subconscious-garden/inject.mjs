import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const sourceDir = path.join(root, 'apps', 'subconscious-garden');
const outDir = path.join(root, '.dist', 'firebase');
const targetDir = path.join(outDir, 'apps', 'subconscious-garden');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

for (const required of [sourceDir, manifestPath, catalogPath, homePath]) {
  if (!fs.existsSync(required)) throw new Error(`Murphy practice prerequisite missing: ${required}`);
}

const meta = {
  slug: 'subconscious-garden',
  title: '願いを潜在意識に通す',
  kicker: 'JOSEPH MURPHY METHOD',
  skill: 'マーフィー / 潜在意識 / 逆努力の法則',
  description: 'ジョセフ・マーフィーの原典に沿って、願望の特定→内的反発の調整→受容状態→メンタルムービー・ボードワン法・睡眠法などで実践する。',
  icon: '◐',
  href: '/apps/subconscious-garden/',
  updateCount: 2,
  forWho: 'マーフィーの法則を「前向きな言葉を唱える」以上の解像度で、原典の技法まで実践したい人',
  purpose: '意識と潜在意識の内的な衝突を減らし、努力を抜いた受容状態で「達成後の像・感覚」を扱うマーフィー式の手順を身につける',
  benefit: 'メンタルムービー、ボードワン法、睡眠法、感謝法、肯定法、逆努力の法則を、自分の願いと抵抗度に合わせて使い分けられる',
};

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
const manifestGame = manifest.games.find((game) => game.slug === meta.slug);
if (manifestGame) {
  manifestGame.category = 'levelup';
  manifestGame.title = meta.title;
} else {
  manifest.games.push({ slug: meta.slug, category: 'levelup', title: meta.title });
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');
catalog.games = catalog.games.filter((game) => game.slug !== meta.slug);
catalog.games.unshift(meta);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const card = `
  <article class="card is-new" data-game="${escapeHtml(meta.slug)}" data-new="true">
    <button class="favorite" type="button" data-favorite="${escapeHtml(meta.slug)}" aria-pressed="false" aria-label="${escapeHtml(meta.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(meta.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${meta.updateCount}</span></div>
      <div class="icon">${escapeHtml(meta.icon)}</div>
      <div class="kicker">${escapeHtml(meta.kicker)}</div>
      <div class="skill">${escapeHtml(meta.skill)}</div>
      <h2>${escapeHtml(meta.title)}</h2>
      <p>${escapeHtml(meta.description)}</p>
      <div class="card-values" aria-label="このアプリの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(meta.forWho)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(meta.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(meta.benefit)}</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${meta.slug}"`)) {
  const gridOpen = '<div class="grid">';
  if (!html.includes(gridOpen)) throw new Error('LEVEL UP home grid not found for Murphy practice.');
  html = html.replace(gridOpen, `${gridOpen}${card}`);
}

const count = catalog.games.length;
html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${count}</strong><span>TRAINING GAMES</span>`);
html = html.replace(/(<div class="section-head"><h2>Training Games<\/h2><span>)\d+( games<\/span>)/, `$1${count}$2`);
fs.writeFileSync(homePath, html);

const liveApp = path.join(targetDir, 'index.html');
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!fs.existsSync(liveApp)) throw new Error('Murphy practice was not copied into the Firebase bundle.');
if (!fs.readFileSync(liveApp, 'utf8').includes('data-subconscious-garden-v2')) throw new Error('Murphy v2 source marker is missing.');
if (!finalHome.includes(`data-game="${meta.slug}"`)) throw new Error('Murphy practice card is missing from LEVEL UP home.');
if (!finalHome.includes(meta.forWho)) throw new Error('Murphy practice dedicated card copy is missing.');
if (!finalCatalog.games.some((game) => game.slug === meta.slug && game.forWho === meta.forWho)) throw new Error('Murphy practice catalog metadata is missing.');

console.log('[Firebase] Murphy practice v2 registered: deep original-method app + dedicated catalog metadata.');
