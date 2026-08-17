import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const manifestPath = path.join(outDir, 'manifest.json');
const appIndexPath = path.join(outDir, 'apps', 'web-marketer-owned-site', 'index.html');

for (const file of [homePath, catalogPath, manifestPath, appIndexPath]) {
  if (!fs.existsSync(file)) throw new Error(`web-marketer-owned-site override input missing: ${file}`);
}

const game = {
  slug: 'web-marketer-owned-site',
  title: '売上レスキュー',
  kicker: 'WEB MARKETER TRAINING',
  skill: 'WEBマーケ / 販売判断',
  description: '自社ECのKPIから売上の詰まりを見抜き、集客・CVR・計測・LTV・実験の最優先の一手を7秒で選ぶ。',
  icon: '↗',
  href: '/apps/web-marketer-owned-site/',
  updateCount: 1,
};

const values = {
  forWhom: '数字は見ているのに、次に何を直すべきか迷いやすいWEBマーケター',
  purpose: '売上のボトルネックを数字から見抜き、施策の優先順位を決める',
  benefit: '集客・CVR・計測・CRMを横断して、一番効く一手を選びやすくなる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

// Firebase版では、10問を完全ランダムにせず5領域×2問にする。
// 同時に領域別のベスト習熟率もlocalStorageへ残す。
let appHtml = fs.readFileSync(appIndexPath, 'utf8');
const randomStart = "function start(){pool=shuffle(cases).slice(0,ROUNDS);round=0;score=0;streak=0;bestStreak=0;skill=Object.fromEntries(Object.keys(labels).map(k=>[k,{ok:0,total:0}]));showCase()}";
const balancedStart = "function buildPool(){return Object.keys(labels).flatMap(cat=>shuffle(cases.filter(q=>q.cat===cat)).slice(0,2))}function start(){pool=buildPool();round=0;score=0;streak=0;bestStreak=0;skill=Object.fromEntries(Object.keys(labels).map(k=>[k,{ok:0,total:0}]));showCase()}";
if (appHtml.includes(randomStart)) appHtml = appHtml.replace(randomStart, balancedStart);
else if (!appHtml.includes('function buildPool(){return Object.keys(labels).flatMap')) throw new Error('web-marketer-owned-site: balanced 5-domain session patch target not found');

const oldResultSave = "best.plays++;if(score>best.score)best.score=score;localStorage.setItem('wm-owned-best',JSON.stringify(best));const rows=Object.entries(skill).map(([k,s])=>[k,s.total?Math.round(s.ok/s.total*100):null]);";
const newResultSave = "best.plays++;if(score>best.score)best.score=score;const rows=Object.entries(skill).map(([k,s])=>[k,s.total?Math.round(s.ok/s.total*100):null]);best.domains=best.domains||{};rows.forEach(([k,v])=>{if(v!==null)best.domains[k]=Math.max(best.domains[k]||0,v)});localStorage.setItem('wm-owned-best',JSON.stringify(best));";
if (appHtml.includes(oldResultSave)) appHtml = appHtml.replace(oldResultSave, newResultSave);
else if (!appHtml.includes('best.domains=best.domains||{}')) throw new Error('web-marketer-owned-site: domain proficiency save patch target not found');

fs.writeFileSync(appIndexPath, appHtml);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!manifest.games.some((item) => item.slug === game.slug)) {
  throw new Error('web-marketer-owned-site is not included in Firebase manifest');
}

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

  if (!home.includes('<div class="grid">')) throw new Error('LEVEL UP grid marker not found for web marketer card');
  home = home.replace('<div class="grid">', `<div class="grid">${card}`);
}

if (afterCount !== beforeCount) {
  home = home.replaceAll(`${beforeCount} games`, `${afterCount} games`);
  home = home.replace(
    `<strong>${beforeCount}</strong><span>TRAINING GAMES</span>`,
    `<strong>${afterCount}</strong><span>TRAINING GAMES</span>`,
  );
}

fs.writeFileSync(homePath, home);

const finalApp = fs.readFileSync(appIndexPath, 'utf8');
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
for (const required of [
  'function buildPool(){return Object.keys(labels).flatMap',
  'best.domains=best.domains||{}',
  'const LIMIT=7000,ROUNDS=10',
]) {
  if (!finalApp.includes(required)) throw new Error(`web-marketer-owned-site final app patch missing: ${required}`);
}
for (const required of [
  `data-game="${game.slug}"`,
  `href="${game.href}"`,
  'data-new="true"',
  values.forWhom,
  values.purpose,
  values.benefit,
]) {
  if (!finalHome.includes(required)) throw new Error(`web-marketer-owned-site home integration missing: ${required}`);
}
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('web-marketer-owned-site catalog integration failed');

console.log(`[Firebase] web-marketer-owned-site patched + injected as NEW release (${afterCount} games)`);
