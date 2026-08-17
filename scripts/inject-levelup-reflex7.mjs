import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'reflex-7';

for (const file of [homePath, manifestPath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`REFLEX 7 injection prerequisite missing: ${file}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!manifest.games.some((game) => game.slug === slug)) {
  throw new Error('REFLEX 7 is not classified into the Firebase LEVEL UP bundle.');
}

const meta = {
  slug,
  title: 'REFLEX 7',
  kicker: 'THINK LESS. CHOOSE BETTER.',
  skill: '7つの判断反射',
  description: '日常の場面を見て、より良い一手を瞬時に選ぶ。7つの判断パターンを知識ではなく反射へ変える。',
  icon: '7',
  href: '/apps/reflex-7/',
  updateCount: 1,
};

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
catalog.games = (catalog.games || []).filter((game) => game.slug !== slug);
catalog.games.unshift(meta);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${slug}"`)) {
  const card = `
  <article class="card is-new" data-game="${slug}" data-new="true">
    <button class="favorite" type="button" data-favorite="${slug}" aria-pressed="false" aria-label="REFLEX 7をお気に入りに追加">♡</button>
    <a class="card-link" href="/apps/reflex-7/">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE 1</span></div>
      <div class="icon">7</div>
      <div class="kicker">THINK LESS. CHOOSE BETTER.</div>
      <div class="skill">7つの判断反射</div>
      <h2>REFLEX 7</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">7つの習慣を知っていても、咄嗟には使えない人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">日常場面でより良い一手を瞬時に選ぶ練習</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">考え込む前の最初の反応を整えやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;
  const gridMarker = '<div class="grid">';
  if (!html.includes(gridMarker)) throw new Error('LEVEL UP home grid not found for REFLEX 7 injection.');
  html = html.replace(gridMarker, `${gridMarker}${card}`);
}

const cardCount = [...html.matchAll(/<article class="card(?:\s[^\"]*)?"[^>]*data-game=/g)].length;
html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${cardCount}</strong><span>TRAINING GAMES</span>`);
html = html.replace(/<div class="section-head"><h2>Training Games<\/h2><span>\d+ games<\/span><\/div>/, `<div class="section-head"><h2>Training Games</h2><span>${cardCount} games</span></div>`);

fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes(`data-game="${slug}"`)) throw new Error('REFLEX 7 home card injection failed.');
if (!finalHtml.includes('data-new="true"')) throw new Error('REFLEX 7 NEW marker missing.');
if (!finalHtml.includes('/apps/reflex-7/')) throw new Error('REFLEX 7 play link missing.');

console.log(`[Firebase] REFLEX 7 injected into LEVEL UP home (${cardCount} cards total)`);
