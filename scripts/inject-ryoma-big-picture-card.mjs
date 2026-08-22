import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'ryoma-big-picture';

const meta = {
  title: '目先に振り回されない — 坂本龍馬に学ぶ「大きく考える」練習',
  kicker: 'WIDEN THE BOARD',
  skill: '大局観 / 戦略的リフレーミング',
  icon: '外',
  description: '目的・時間・人・手段を広げてから一手を選ぶ。目先の勝敗ではなく、盤面そのものを変える反射を鍛える。',
  obi: '目の前の勝ち負けから離れ、半年後まで効く「盤面を変える一手」を選ぶ。',
  forWho: '対立・失敗・数字悪化が起きると、今すぐ言い返す／取り返す／施策を増やすことに意識が狭まりやすい人',
  purpose: '目の前の問題に反応する前に、目的・時間軸・関係者・打ち手を広げて考える順序を身につける',
  benefit: '「今ここ」の勝敗から離れ、半年後まで効く仕組み・第三案・より大きな一手を選びやすくする',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error(`LEVEL UP catalog missing ${slug}; auto-discovery must run first.`);
Object.assign(game, meta, { description: meta.obi });
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

const card = `
  <article class="card is-new" data-game="${slug}" data-new="true">
    <button class="favorite" type="button" data-favorite="${slug}" aria-pressed="false" aria-label="${escapeHtml(meta.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="/apps/${slug}/">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount || 1}</span></div>
      <div class="icon">${escapeHtml(meta.icon)}</div>
      <div class="kicker">${escapeHtml(meta.kicker)}</div>
      <div class="skill">${escapeHtml(meta.skill)}</div>
      <h2>${escapeHtml(meta.title)}</h2>
      <p class="book-obi">${escapeHtml(meta.obi)}</p>
      <p>${escapeHtml(meta.description)}</p>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(meta.forWho)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(meta.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(meta.benefit)}</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
const cardPattern = new RegExp(`<article class="card is-new" data-game="${slug}"[\\s\\S]*?<\\/article>`);
if (!cardPattern.test(html)) throw new Error(`LEVEL UP home card missing ${slug}.`);
html = html.replace(cardPattern, card.trim());
fs.writeFileSync(homePath, html);
console.log(`[Firebase] patched app-specific title + obi + card metadata for ${slug}.`);
