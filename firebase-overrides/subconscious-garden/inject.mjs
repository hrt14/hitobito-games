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
  description: '入力不要。仕事・お金・人間関係・自信・睡眠・目標などから近い願いを選び、達成後の一場面まで自動で作ってマーフィー式の実践へ入る。',
  icon: '◐',
  href: '/apps/subconscious-garden/',
  updateCount: 3,
  forWho: 'マーフィーの潜在意識法を試したいが、自分で願望文やイメージ場面を一から文章にするのは面倒な人',
  purpose: '近い願いをタップで選ぶだけで、達成後の像・内的反発・受容状態・技法選択までマーフィー式の実践手順に入れる',
  benefit: '基本は入力ゼロ。迷ったら「おまかせ」で即開始でき、必要な人だけ自分の願いを自由入力できる',
};

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

// v3: keep the researched core app intact, but make the default setup tap-first.
const liveApp = path.join(targetDir, 'index.html');
const tapFirstJs = path.join(targetDir, 'no-input-v3.js');
if (!fs.existsSync(tapFirstJs)) throw new Error('Murphy tap-first v3 script is missing.');
let appHtml = fs.readFileSync(liveApp, 'utf8');
if (!appHtml.includes('no-input-v3.js')) {
  appHtml = appHtml.replace('</body>', '<script src="./no-input-v3.js"></script>\n</body>');
  fs.writeFileSync(liveApp, appHtml);
}

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

const finalApp = fs.readFileSync(liveApp, 'utf8');
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!finalApp.includes('data-subconscious-garden-v2')) throw new Error('Murphy researched core marker is missing.');
if (!finalApp.includes('no-input-v3.js')) throw new Error('Murphy tap-first v3 was not attached to the production app.');
if (!finalHome.includes(`data-game="${meta.slug}"`)) throw new Error('Murphy practice card is missing from LEVEL UP home.');
if (!finalHome.includes(meta.forWho)) throw new Error('Murphy practice dedicated card copy is missing.');
if (!finalCatalog.games.some((game) => game.slug === meta.slug && game.forWho === meta.forWho)) throw new Error('Murphy practice catalog metadata is missing.');

console.log('[Firebase] Murphy practice v3 registered: researched core + tap-first/no-input default.');
