import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const sourceDir = path.join(root, 'apps', 'dream-simple');
const outDir = path.join(root, '.dist', 'firebase');
const targetDir = path.join(outDir, 'apps', 'dream-simple');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

for (const required of [sourceDir, manifestPath, catalogPath, homePath]) {
  if (!fs.existsSync(required)) throw new Error(`dream-simple prerequisite missing: ${required}`);
}

const meta = {
  slug: 'dream-simple',
  title: '「夢をかなえたい」が重くなった人の 夢をシンプルにする5タップ整理',
  kicker: 'SEPARATE THE DREAM',
  skill: '夢 / 欲求分解 / 自分軸',
  description: '夢に混ざったお金・承認・肩書き・自由を1つずつ分け、最後に残したい「やりたい」を1つにする。',
  icon: '◇',
  href: '/apps/dream-simple/',
  updateCount: 1,
  forWho: '「社長になりたい」「ミュージシャンになりたい」など、一つの夢にお金・承認・肩書き・自由まで背負わせて重くなっている人',
  purpose: '夢そのものと、収入・他人の評価・地位・働き方の条件を分けて考える',
  benefit: 'プリセットなら5タップから、何を夢として追い、何を別の目標として設計するかを見える形にできる',
};
const obi = 'お金・承認・肩書き・自由を外して、残す「やりたい」を1つにする。';

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
      <p class="book-obi">${escapeHtml(obi)}</p>
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
  if (!html.includes(gridOpen)) throw new Error('LEVEL UP home grid not found for dream-simple.');
  html = html.replace(gridOpen, `${gridOpen}${card}`);
}
const count = catalog.games.length;
html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${count}</strong><span>TRAINING GAMES</span>`);
html = html.replace(/(<div class="section-head"><h2>Training Games<\/h2><span>)\d+( games<\/span>)/, `$1${count}$2`);
fs.writeFileSync(homePath, html);

const liveApp = path.join(targetDir, 'index.html');
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!fs.existsSync(liveApp)) throw new Error('dream-simple was not copied into the Firebase bundle.');
if (!fs.readFileSync(liveApp, 'utf8').includes('data-dream-simple-v1')) throw new Error('dream-simple source marker is missing.');
if (!finalHome.includes(`data-game="${meta.slug}"`)) throw new Error('dream-simple card is missing from LEVEL UP home.');
if (!finalHome.includes(meta.forWho)) throw new Error('dream-simple dedicated こんな人に copy is missing.');
if (!finalHome.includes(`class="book-obi">${escapeHtml(obi)}`)) throw new Error('dream-simple title+obi card is missing.');
if (!finalCatalog.games.some((game) => game.slug === meta.slug && game.forWho === meta.forWho)) throw new Error('dream-simple catalog metadata is missing.');
console.log('[Firebase] dream-simple registered: app + 5-tap dream separator + dedicated catalog metadata.');
