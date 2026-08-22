import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const slug = 'assertive';

const game = {
  slug,
  title: '言いたいことを、ちゃんと言える。',
  kicker: 'ASSERTIVE COMMUNICATION',
  skill: '自己主張 / 対話 / 境界',
  description: '断る・頼む・意見を伝える・やめてほしいを、自分と相手の両方を尊重して言葉にする。相手の反応が強くても、自分の線を保つ練習。',
  obi: '自分も相手も雑に扱わず、必要なことを短く言えるようになる1分練習。',
  icon: 'SAY',
  href: '/apps/assertive/',
  updateCount: 1,
  forWho: '本当は断りたい・頼みたい・意見を言いたいのに、相手の反応が気になって飲み込みやすい人',
  purpose: '最初の反射を止め、事実→自分の立場→要望・境界を短く組み立てる順番を反射化する',
  benefit: '相手がすぐ納得しない場面でも、自分と相手の両方を尊重しながら必要なことを言い切りやすくなる',
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
  if (!fs.existsSync(required)) throw new Error(`assertive card prerequisite missing: ${required}`);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const entry = catalog.games.find((item) => item.slug === slug);
if (!entry) throw new Error('assertive was not auto-discovered into LEVEL UP catalog');
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
const pattern = /<article class="card is-new" data-game="assertive" data-new="true">[\s\S]*?<\/article>/;
if (!pattern.test(html)) throw new Error('assertive auto-discovered card not found in LEVEL UP home');
html = html.replace(pattern, card.trim());
fs.writeFileSync(homePath, html);
console.log('[LEVEL UP] assertive card copy injected');
