import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const out = path.join(root, '.dist', 'firebase');
const targetDir = path.join(out, 'apps', 'hitori-shouten');
const homePath = path.join(out, 'index.html');
const catalogPath = path.join(out, 'levelup-catalog.json');
const sourceFiles = ['index.html', 'style.css', 'game.js'];

for (const file of sourceFiles) {
  if (!fs.existsSync(path.join(here, file))) throw new Error(`hitori-shouten source is missing: ${file}`);
}
if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('Firebase LEVEL UP home/catalog is missing.');

fs.mkdirSync(targetDir, { recursive: true });
for (const file of sourceFiles) fs.copyFileSync(path.join(here, file), path.join(targetDir, file));

const game = {
  slug: 'hitori-shouten',
  title: 'ひとり商店',
  kicker: 'SELL BEFORE YOU SCALE',
  skill: '顧客起点 / 販売 / 仕組み化',
  description: '1日8時間の使い道を選び、顧客理解→小さく販売→勝ち筋へ集中→仕組み化の順番を体で覚える。',
  icon: '¥',
  href: '/apps/hitori-shouten/',
  updateCount: 1,
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const beforeCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) catalog.games.unshift(game);
const afterCount = catalog.games.length;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes('data-game="hitori-shouten"')) {
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
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">1人で事業を始めたい・売上づくりで迷う人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">限られた8時間を、顧客・販売・勝ち筋・仕組みに配る判断を反復する</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">「仕事してる感」ではなく、売上につながる一手を先に選びやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;
  const gridOpen = '<div class="grid">';
  if (!html.includes(gridOpen)) throw new Error('LEVEL UP card grid not found.');
  html = html.replace(gridOpen, `${gridOpen}${card}`);
}
if (afterCount !== beforeCount) {
  html = html.replace(/<strong>(\d+)<\/strong><span>TRAINING GAMES<\/span>/, (_, n) => `<strong>${Number(n) + 1}</strong><span>TRAINING GAMES</span>`);
  html = html.replace(/<span>(\d+) games<\/span>/, (_, n) => `<span>${Number(n) + 1} games</span>`);
}
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
for (const file of sourceFiles) {
  const liveFile = path.join(targetDir, file);
  if (!fs.existsSync(liveFile) || fs.statSync(liveFile).size < 1000) throw new Error(`hitori-shouten asset copy failed: ${file}`);
}
if (!finalHtml.includes('data-game="hitori-shouten"')) throw new Error('hitori-shouten LEVEL UP card injection failed.');
if (!finalHtml.includes('data-new="true"')) throw new Error('hitori-shouten NEW marker missing.');
if (!finalHtml.includes('売上につながる一手を先に選びやすくなる')) throw new Error('hitori-shouten value metadata missing.');

console.log(`[Firebase] hitori-shouten injected + NEW card added (${afterCount} games)`);
