import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog missing. Run after build-firebase-levelup-home and favorite enrichment.');
}

const game = {
  slug: 'my-job',
  title: 'それ、俺の仕事？',
  kicker: 'DRAW THE WORK BOUNDARY',
  skill: '役割境界 / スコープ管理',
  description: '依頼を「やる・相手がやる・別料金」に3秒で仕分け、全部を自分の仕事として背負わない反射を鍛える。',
  icon: '⇄',
  href: '/apps/my-job/',
  updateCount: 1,
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const beforeCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) {
  catalog.games.push(game);
}
const afterCount = catalog.games.length;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes('data-game="my-job"')) {
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
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">頼まれたことを全部自分で背負って消耗しやすい人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">自分の価値・相手の実務・追加対応を瞬時に分ける</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">役割を広げすぎず、本当に価値を出す仕事へ集中しやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

  if (!html.includes('<div class="grid">')) throw new Error('LEVEL UP grid marker not found.');
  html = html.replace('<div class="grid">', `<div class="grid">${card}`);
}

if (afterCount !== beforeCount) {
  html = html.replaceAll(`${beforeCount} games`, `${afterCount} games`);
  html = html.replace(
    `<strong>${beforeCount}</strong><span>TRAINING GAMES</span>`,
    `<strong>${afterCount}</strong><span>TRAINING GAMES</span>`,
  );
}

fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes('data-game="my-job"')) throw new Error('my-job card injection failed.');
if (!finalHtml.includes('data-new="true"')) throw new Error('my-job NEW marker missing.');
if (!finalHtml.includes('頼まれたことを全部自分で背負って消耗しやすい人')) throw new Error('my-job value metadata missing.');
if (!catalog.games.some((item) => item.slug === 'my-job')) throw new Error('my-job catalog injection failed.');

console.log(`[Firebase] my-job injected as NEW release (${afterCount} games)`);
