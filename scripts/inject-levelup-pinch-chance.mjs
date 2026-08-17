import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const source = path.join(root, 'firebase-special-apps', 'pinch-chance');
const sourceIndex = path.join(source, 'index.html');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'pinch-chance';

if (!fs.existsSync(outDir)) throw new Error('Firebase output missing. Run build:hosting first.');
if (!fs.existsSync(sourceIndex)) throw new Error('Pinch Chance source missing.');
if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog missing.');

for (const destination of [path.join(outDir, slug), path.join(outDir, 'apps', slug)]) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

const game = {
  slug,
  title: 'ピンチはチャンス',
  kicker: 'TURN PRESSURE INTO GROWTH',
  skill: '意味づけ / 成長反射',
  description: 'ピンチを見た瞬間に「何を一段上げられる？」へ切り替え、集中・優先順位・委任・仕組み化などの成長機会へ変える。',
  icon: '↗',
  href: '/pinch-chance',
  updateCount: 1,
};

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');
if (!catalog.games.some((item) => item.slug === slug)) catalog.games.unshift(game);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${slug}"`)) {
  const card = `
  <article class="card is-new" data-game="${slug}" data-new="true">
    <button class="favorite" type="button" data-favorite="${slug}" aria-pressed="false" aria-label="ピンチはチャンスをお気に入りに追加">♡</button>
    <a class="card-link" href="/pinch-chance">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE 1</span></div>
      <div class="icon">↗</div>
      <div class="kicker">TURN PRESSURE INTO GROWTH</div>
      <div class="skill">意味づけ / 成長反射</div>
      <h2>ピンチはチャンス</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">仕事量や予定外の出来事を見ると、圧倒されて逃げたくなる人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">ピンチを「何を一段上げられる？」へ意味変換する反射を作る</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">大変な状況でも、成長機会と次の一手を見つけやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

  const gridOpen = '<div class="grid">';
  if (!html.includes(gridOpen)) throw new Error('LEVEL UP card grid missing.');
  html = html.replace(gridOpen, `${gridOpen}${card}`);
}

const count = catalog.games.length;
html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${count}</strong><span>TRAINING GAMES</span>`);
html = html.replace(/<div class="section-head"><h2>Training Games<\/h2><span>\d+ games<\/span><\/div>/, `<div class="section-head"><h2>Training Games</h2><span>${count} games</span></div>`);
fs.writeFileSync(homePath, html);

for (const relative of [`${slug}/index.html`, `apps/${slug}/index.html`]) {
  const file = path.join(outDir, relative);
  if (!fs.existsSync(file)) throw new Error(`${relative}: copy failed`);
  const appHtml = fs.readFileSync(file, 'utf8');
  if (!appHtml.includes(`data-game-slug="${slug}"`)) throw new Error(`${relative}: game slug missing`);
  if (!appHtml.includes('href="/"')) throw new Error(`${relative}: LEVEL UP home link missing`);
  if (!appHtml.includes('ピンチはチャンス')) throw new Error(`${relative}: title missing`);
}

const finalHome = fs.readFileSync(homePath, 'utf8');
if (!finalHome.includes(`data-game="${slug}" data-new="true"`)) throw new Error('Pinch Chance NEW card missing.');
if (!finalHome.includes(`href="/pinch-chance"`)) throw new Error('Pinch Chance home link missing.');
if (!finalHome.includes(`<span>${count} games</span>`)) throw new Error('LEVEL UP game count update failed.');

console.log(`[Firebase] Pinch Chance injected: /pinch-chance + /apps/pinch-chance; catalog=${count}`);
