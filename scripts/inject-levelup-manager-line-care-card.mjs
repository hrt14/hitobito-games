import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'manager-line-care';

const game = {
  slug,
  title: '部下を守り、自分も抱え込まない。',
  kicker: 'MANAGER LINE CARE',
  skill: '部下育成 / リスク管理 / 自己管理',
  description: '「いつもと違う」変化に気づき、聴き、職場を整え、必要なら社内の支援につなぐ判断を6ケースで反復する。',
  obi: '管理職の「気づく→聴く→整える→つなぐ」を、6つの現場ケースで反射化。',
  icon: 'CARE',
  href: '/apps/manager-line-care/',
  updateCount: 1,
  forWho: '部下の変化に気づいたとき、声のかけ方・聴き方・どこまで自分で抱えるかに迷う管理職',
  purpose: '管理職が診断役にならず、「気づく→聴く→職場を整える／支援につなぐ」の順番を反射化する',
  benefit: '部下の安全とプライバシーを守りながら、管理職自身も抱え込みにくい対応の型を持てる',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

for (const required of [homePath, catalogPath]) {
  if (!fs.existsSync(required)) throw new Error(`manager-line-care card prerequisite missing: ${required}`);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const entry = catalog.games.find((item) => item.slug === slug);
if (!entry) throw new Error('manager-line-care was not auto-discovered into LEVEL UP catalog');
Object.assign(entry, game);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

const card = `
  <article class="card is-new" data-game="${escapeHtml(game.slug)}" data-new="true">
    <button class="favorite" type="button" data-favorite="${escapeHtml(game.slug)}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(game.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${escapeHtml(game.icon)}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <p class="book-obi">${escapeHtml(game.obi)}</p>
      <p>${escapeHtml(game.description)}</p>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(game.forWho)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(game.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(game.benefit)}</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
const pattern = /<article class="card is-new" data-game="manager-line-care" data-new="true">[\s\S]*?<\/article>/;
if (!pattern.test(html)) throw new Error('manager-line-care auto-discovered card not found in LEVEL UP home');
html = html.replace(pattern, card.trim());
fs.writeFileSync(homePath, html);
console.log('[LEVEL UP] manager-line-care card copy + book obi injected');
