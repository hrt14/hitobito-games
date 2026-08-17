import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const appPath = path.join(outDir, 'apps', 'mou-haratta', 'index.html');

const game = {
  slug: 'mou-haratta',
  title: 'もう払った。',
  kicker: 'PAID. MOVE ON.',
  skill: '意味づけ / 切り替え',
  description: '嫌な出来事が起きた瞬間に「代償先払い」と意味を切り替え、「もう支払い済み」と次へ進む反射を鍛える。',
  icon: '済',
  href: '/apps/mou-haratta/',
  updateCount: 1,
};

for (const required of [homePath, catalogPath, appPath]) {
  if (!fs.existsSync(required)) throw new Error(`もう払った。 injection prerequisite missing: ${required}`);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');

const oldCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) {
  catalog.games.unshift(game);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
}
const newCount = catalog.games.length;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const card = `
  <article class="card is-new" data-game="${escapeHtml(game.slug)}" data-new="true">
    <button class="favorite" type="button" data-favorite="${escapeHtml(game.slug)}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(game.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${escapeHtml(game.icon)}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">嫌なことを長く引きずりやすい人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">嫌な出来事を「代償先払い」と捉え直す反射を鍛える</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">嫌な出来事のあと、気持ちを切り替えて次へ進みやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${game.slug}"`)) {
  if (html.includes('<div class="grid">')) {
    html = html.replace('<div class="grid">', `<div class="grid">${card}`);
  } else {
    throw new Error('LEVEL UP card grid not found.');
  }
}

if (newCount !== oldCount) {
  html = html.replace(
    `<strong>${oldCount}</strong><span>TRAINING GAMES</span>`,
    `<strong>${newCount}</strong><span>TRAINING GAMES</span>`,
  );
  html = html.replace(`<span>${oldCount} games</span>`, `<span>${newCount} games</span>`);
}

fs.writeFileSync(homePath, html);

const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!finalHome.includes(`data-game="${game.slug}"`)) throw new Error('もう払った。 card injection failed.');
if (!finalHome.includes(`href="${game.href}"`)) throw new Error('もう払った。 card link injection failed.');
if (!finalHome.includes(`data-game="${game.slug}" data-new="true"`)) throw new Error('もう払った。 NEW marker injection failed.');
if (!finalHome.includes('嫌な出来事を「代償先払い」と捉え直す反射を鍛える')) throw new Error('もう払った。 card benefit metadata injection failed.');
if (!finalCatalog.games.some((item) => item.slug === game.slug)) throw new Error('もう払った。 catalog injection failed.');
if (!finalHome.includes(`<span>${newCount} games</span>`)) throw new Error('LEVEL UP game count was not updated for もう払った。');

console.log(`[Firebase] もう払った。 injected into LEVEL UP home/catalog as NEW: ${newCount} games`);
