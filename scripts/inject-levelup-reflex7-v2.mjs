import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const sourceDir = path.join(root, 'apps', 'reflex-7');
const appOutDir = path.join(outDir, 'apps', 'reflex-7');
const slug = 'reflex-7';

for (const file of [homePath, manifestPath, catalogPath, path.join(sourceDir, 'index.html'), path.join(sourceDir, 'style.css'), path.join(sourceDir, 'game.js')]) {
  if (!fs.existsSync(file)) throw new Error(`Missing REFLEX 7 build prerequisite: ${file}`);
}

// REFLEX 7 is LEVEL UP-only. Place it explicitly in the Firebase bundle.
fs.rmSync(appOutDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(appOutDir), { recursive: true });
fs.cpSync(sourceDir, appOutDir, { recursive: true });

// Mixed training must not reveal the category before the player answers.
const gamePath = path.join(appOutDir, 'game.js');
let gameJs = fs.readFileSync(gamePath, 'utf8');
const reveal = "    $('skillName').textContent=skill.code; $('skillJp').textContent=skill.jp; $('sceneNo').textContent=`SCENE ${String(state.index+1).padStart(2,'0')}`; $('scenarioText').textContent=item.text;";
const hidden = "    $('skillName').textContent='MIXED REFLEX'; $('skillJp').textContent='最善の一手を選ぶ'; $('sceneNo').textContent=`SCENE ${String(state.index+1).padStart(2,'0')}`; $('scenarioText').textContent=item.text;";
if (gameJs.includes(reveal)) gameJs = gameJs.replace(reveal, hidden);
else if (!gameJs.includes("$('skillName').textContent='MIXED REFLEX'")) throw new Error('REFLEX 7 pre-answer skill masking patch target not found.');
fs.writeFileSync(gamePath, gameJs);

const indexPath = path.join(appOutDir, 'index.html');
let appHtml = fs.readFileSync(indexPath, 'utf8');
appHtml = appHtml.replace('正解を暗記するゲームではありません。状況を見た瞬間の「最初の反応」を鍛えます。','習慣名を当てるゲームではありません。状況を見た瞬間の「最初の反応」を鍛えます。');
fs.writeFileSync(indexPath, appHtml);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.games = (manifest.games || []).filter((game) => game.slug !== slug);
manifest.games.push({ slug, category: 'levelup', title: 'REFLEX 7 | LEVEL UP' });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const meta = {
  slug,
  title: 'REFLEX 7',
  kicker: 'THINK LESS. CHOOSE BETTER.',
  skill: '7つの判断反射',
  description: '日常の場面を見て、より良い一手を瞬時に選ぶ。7つの判断パターンを知識ではなく反射へ変える。',
  icon: '7',
  href: '/apps/reflex-7/',
  updateCount: 2,
};

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
catalog.games = (catalog.games || []).filter((game) => game.slug !== slug);
catalog.games.unshift(meta);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
const catalogCount = catalog.games.length;

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${slug}"`)) {
  const card = `
  <article class="card is-new" data-game="${slug}" data-new="true">
    <button class="favorite" type="button" data-favorite="${slug}" aria-pressed="false" aria-label="REFLEX 7をお気に入りに追加">♡</button>
    <a class="card-link" href="/apps/reflex-7/">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE 2</span></div>
      <div class="icon">7</div>
      <div class="kicker">THINK LESS. CHOOSE BETTER.</div>
      <div class="skill">7つの判断反射</div>
      <h2>REFLEX 7</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">学んだ考え方を咄嗟には使えない人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">日常場面でより良い一手を瞬時に選ぶ練習</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">考え込む前の最初の反応を整えやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;
  const gridMarker = '<div class="grid">';
  if (!html.includes(gridMarker)) throw new Error('LEVEL UP home grid not found.');
  html = html.replace(gridMarker, `${gridMarker}${card}`);
}

html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${catalogCount}</strong><span>TRAINING GAMES</span>`);
html = html.replace(/<div class="section-head"><h2>Training Games<\/h2><span>\d+ games<\/span><\/div>/, `<div class="section-head"><h2>Training Games</h2><span>${catalogCount} games</span></div>`);
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
const finalGame = fs.readFileSync(gamePath, 'utf8');
if (!finalHtml.includes(`data-game="${slug}"`)) throw new Error('REFLEX 7 card injection failed.');
if (!finalHtml.includes('/apps/reflex-7/')) throw new Error('REFLEX 7 link missing.');
if (!finalHtml.includes(`<span>${catalogCount} games</span>`)) throw new Error('REFLEX 7 catalog count mismatch.');
if (!finalGame.includes("$('skillName').textContent='MIXED REFLEX'")) throw new Error('REFLEX 7 skill masking failed.');
if (!fs.existsSync(path.join(appOutDir, 'style.css'))) throw new Error('REFLEX 7 style missing from Firebase bundle.');

console.log(`[Firebase] REFLEX 7 v2 bundled + injected (${catalogCount} catalog games)`);
