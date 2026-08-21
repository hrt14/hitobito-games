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
  if (!fs.existsSync(required)) throw new Error(`無意識の庭 prerequisite missing: ${required}`);
}

const meta = {
  slug: 'subconscious-garden',
  title: '無意識の庭',
  kicker: 'GROW WHAT FEELS NATURAL',
  skill: '無意識 / 前提づくり / 毎日の反復',
  description: '自然音の中で、言葉・イメージ・IF→THEN・現実の証拠を急がず反復し、なりたい自分の前提を毎日少しずつ根づかせる。',
  icon: '🌱',
  href: '/apps/subconscious-garden/',
  updateCount: 1,
  forWho: '頭では変わりたいと分かっていても、同じ不安・自己評価・焦りが反射的に出てしまう人',
  purpose: '落ち着いた状態で新しい前提と具体的な行動を繰り返し結び、別の反応を選ぶ道を日常に増やす',
  benefit: '毎日数分、自分のペースで続けるほど「こう考えよう」と頑張らなくても望む反応へ戻りやすくする',
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
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

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
  if (!html.includes(gridOpen)) throw new Error('LEVEL UP home grid not found for 無意識の庭.');
  html = html.replace(gridOpen, `${gridOpen}${card}`);
}

const count = catalog.games.length;
html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${count}</strong><span>TRAINING GAMES</span>`);
html = html.replace(/(<div class="section-head"><h2>Training Games<\/h2><span>)\d+( games<\/span>)/, `$1${count}$2`);
fs.writeFileSync(homePath, html);

const liveApp = path.join(targetDir, 'index.html');
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!fs.existsSync(liveApp)) throw new Error('無意識の庭 was not copied into the Firebase bundle.');
if (!fs.readFileSync(liveApp, 'utf8').includes('data-subconscious-garden-v1')) throw new Error('無意識の庭 source marker is missing.');
if (!finalHome.includes(`data-game="${meta.slug}"`)) throw new Error('無意識の庭 card is missing from LEVEL UP home.');
if (!finalHome.includes(meta.forWho)) throw new Error('無意識の庭 dedicated こんな人に copy is missing.');
if (!finalCatalog.games.some((game) => game.slug === meta.slug && game.forWho === meta.forWho)) throw new Error('無意識の庭 catalog metadata is missing.');

console.log('[Firebase] 無意識の庭 registered: app + dedicated catalog card + metadata.');
