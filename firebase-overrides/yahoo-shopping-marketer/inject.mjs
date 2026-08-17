import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const appIndexPath = path.join(outDir, 'apps', 'yahoo-shopping-marketer', 'index.html');
const appGamePath = path.join(outDir, 'apps', 'yahoo-shopping-marketer', 'game.js');

for (const file of [homePath, catalogPath, manifestPath, appIndexPath, appGamePath]) {
  if (!fs.existsSync(file)) throw new Error(`yahoo-shopping-marketer integration input missing: ${file}`);
}

const game = {
  slug: 'yahoo-shopping-marketer',
  title: 'Yahoo!ショッピング担当者',
  kicker: 'WEB MARKETER TRAINING',
  skill: 'Yahoo!ショッピング / 販売判断',
  description: '商品・検索・広告・販促・CRM・粗利を横断し、数字から次の一手を選ぶ判断力を反復する。',
  icon: 'Y!',
  href: '/apps/yahoo-shopping-marketer/',
  updateCount: 1,
};

const values = {
  forWhom: 'Yahoo!ショッピングの売上改善を担当する人',
  purpose: '商品・広告・販促・CRMのどこを直すべきか素早く判断する',
  benefit: '売上だけでなくCVR・粗利・リピートまで見て次の一手を選べるようになる',
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

const appGame = fs.readFileSync(appGamePath, 'utf8');
const appIndex = fs.readFileSync(appIndexPath, 'utf8');
if (!appGame.includes('コマースアドマネージャー')) throw new Error('Yahoo current ad naming is missing from game');
if (appGame.includes('アイテムマッチ') || appIndex.includes('アイテムマッチ')) throw new Error('Stale Yahoo ad naming remains in app');
if (!appGame.includes('timedOut?[0,0,0,0]')) throw new Error('Yahoo timeout KPI safety fix is missing');
if (!appGame.includes("els.game.classList.add('answered')")) throw new Error('Yahoo mobile feedback compaction hook is missing');
if (!appIndex.includes('business-ec.yahoo.co.jp/shopping/question/index.html')) throw new Error('Yahoo official source link is missing');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const beforeCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) catalog.games.push(game);
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

const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
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
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('yahoo-shopping-marketer catalog integration failed');

console.log(`[Firebase] Yahoo Shopping marketer validated + injected as NEW release (${afterCount} games)`);
