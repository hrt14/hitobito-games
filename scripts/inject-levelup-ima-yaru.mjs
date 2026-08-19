import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const source = path.join(root, 'apps', 'ima-yaru');
const outDir = path.join(root, '.dist', 'firebase');
const destination = path.join(outDir, 'apps', 'ima-yaru');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

for (const required of [path.join(source, 'index.html'), homePath, catalogPath]) {
  if (!fs.existsSync(required)) throw new Error(`今やる。 prerequisite missing: ${required}`);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });

const game = {
  slug: 'ima-yaru',
  title: '今やる。',
  kicker: 'PROCRASTINATION → START',
  skill: '先延ばし / 着手',
  description: '先延ばしの引っかかりを1つ見抜き、30秒の一手まで小さくして、アプリの外で実際に始める。',
  icon: 'NOW',
  href: '/apps/ima-yaru/',
  updateCount: 1,
  forWho: 'やるべきことは分かっているのに、重さ・曖昧さ・不安・完璧主義で手が止まる人',
  purpose: '先延ばしの理由を短く特定し、現実で動ける最小の一手へ変換する',
  benefit: '迷っている状態から30秒以内の着手へ移り、止まりやすい理由と着手率も分かる',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function makeCard(item) {
  return `
  <article class="card is-new" data-game="${escapeHtml(item.slug)}" data-new="true">
    <button class="favorite" type="button" data-favorite="${escapeHtml(item.slug)}" aria-pressed="false" aria-label="${escapeHtml(item.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(item.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${item.updateCount}</span></div>
      <div class="icon">${escapeHtml(item.icon)}</div>
      <div class="kicker">${escapeHtml(item.kicker)}</div>
      <div class="skill">${escapeHtml(item.skill)}</div>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.description)}</p>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(item.forWho)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(item.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(item.benefit)}</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');
if (!catalog.games.some((item) => item.slug === game.slug)) catalog.games.unshift(game);

let home = fs.readFileSync(homePath, 'utf8');
if (!home.includes(`data-game="${game.slug}"`)) {
  if (!home.includes('<div class="grid">')) throw new Error('LEVEL UP card grid not found.');
  home = home.replace('<div class="grid">', `<div class="grid">${makeCard(game)}`);
}
const count = catalog.games.length;
home = home.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${count}</strong><span>TRAINING GAMES</span>`);
home = home.replace(/<span>\d+ games<\/span>/, `<span>${count} games</span>`);

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
fs.writeFileSync(homePath, home);

if (!fs.existsSync(path.join(destination, 'app.js')) || !fs.existsSync(path.join(destination, 'style.css'))) {
  throw new Error('今やる。 assets were not copied.');
}
if (!home.includes('href="/apps/ima-yaru/"')) throw new Error('今やる。 home card missing.');

console.log(`[Firebase] Injected 今やる。 into LEVEL UP; catalog=${count}`);
