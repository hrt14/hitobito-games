import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const appDir = path.join(outDir, 'apps', 'yahoo-shopping-marketer');
const appIndexPath = path.join(appDir, 'index.html');
const appScriptPath = path.join(appDir, 'game.js');
const appCompactStylePath = path.join(appDir, 'compact.css');

for (const file of [homePath, catalogPath, manifestPath, appIndexPath, appScriptPath, appCompactStylePath]) {
  if (!fs.existsSync(file)) throw new Error(`yahoo-shopping-marketer integration input missing: ${file}`);
}

const game = {
  slug: 'yahoo-shopping-marketer',
  title: 'Yahoo!ショッピング担当者',
  kicker: 'YAHOO! SHOPPING OPERATOR',
  skill: 'EC運用 / 販促判断',
  description: '商品・検索・コマースアドマネージャー・ポイント／クーポン・LINE／CRM・粗利を横断し、数字から次の一手を判断する。',
  icon: 'Y!',
  href: '/apps/yahoo-shopping-marketer/',
  updateCount: 2,
};

const values = {
  forWhom: 'Yahoo!ショッピングの売上改善を担当する人',
  purpose: '数字からボトルネックを見抜き、最優先の一手を選ぶ',
  benefit: '商品ページ・広告・販促・CRM・粗利の判断が速くなる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!manifest.games.some((item) => item.slug === game.slug)) {
  throw new Error('yahoo-shopping-marketer is not included in Firebase manifest');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const beforeCount = catalog.games.length;
const existing = catalog.games.find((item) => item.slug === game.slug);
if (existing) Object.assign(existing, game);
else catalog.games.push(game);
const afterCount = catalog.games.length;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let home = fs.readFileSync(homePath, 'utf8');
if (!home.includes(`data-game="${game.slug}"`)) {
  const card = `
  <article class="card is-new" data-game="${game.slug}" data-new="true">
    <button class="favorite" type="button" data-favorite="${game.slug}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${game.href}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${escapeHtml(game.icon)}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(values.forWhom)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(values.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(values.benefit)}</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

  const marker = '<div class="grid">';
  if (!home.includes(marker)) throw new Error('LEVEL UP grid marker not found for Yahoo Shopping marketer card');
  home = home.replace(marker, `${marker}${card}`);
}

if (afterCount !== beforeCount) {
  home = home.replaceAll(`${beforeCount} games`, `${afterCount} games`);
  home = home.replace(
    `<strong>${beforeCount}</strong><span>TRAINING GAMES</span>`,
    `<strong>${afterCount}</strong><span>TRAINING GAMES</span>`,
  );
}

fs.writeFileSync(homePath, home);

const finalIndex = fs.readFileSync(appIndexPath, 'utf8');
const finalScript = fs.readFileSync(appScriptPath, 'utf8');
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const required of ['コマースアドマネージャー', '判断後の解説は自動で消えません', './compact.css']) {
  if (!finalIndex.includes(required)) throw new Error(`Yahoo Shopping app index check failed: ${required}`);
}

for (const required of [
  'コマースアドマネージャーのクリックは増えた',
  'const timedOut = index < 0',
  'const deltaArray = timedOut ? [0, 0, 0, 0]',
  "els.choices.classList.add('answered')",
  '料金・制度の変更告知が出た',
]) {
  if (!finalScript.includes(required)) throw new Error(`Yahoo Shopping game quality check failed: ${required}`);
}

for (const required of [
  `data-game="${game.slug}"`,
  `href="${game.href}"`,
  'data-new="true"',
  values.forWhom,
  values.purpose,
  values.benefit,
]) {
  if (!finalHome.includes(required)) throw new Error(`yahoo-shopping-marketer home integration missing: ${required}`);
}

const finalEntry = finalCatalog.games.find((item) => item.slug === game.slug);
if (!finalEntry) throw new Error('yahoo-shopping-marketer catalog integration failed');
if (!finalEntry.description.includes('コマースアドマネージャー')) throw new Error('Yahoo Shopping catalog terminology is stale');

console.log(`[Firebase] Yahoo Shopping marketer injected as NEW release (${afterCount} games)`);
