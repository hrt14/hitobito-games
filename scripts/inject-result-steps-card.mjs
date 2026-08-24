import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = 'result-steps';

const meta = {
  title: '結果が出るまで、あと○歩',
  kicker: 'VISIBLE PROGRESS',
  skill: '継続 / 見えない成長',
  icon: '↗',
  description: '努力しているのに結果が見えない時期を、積み上げと勢いの2層で可視化。今日の具体的な1歩へ戻る。',
  forWho: '続けているのに成果が見えず、「この努力は意味があるのか」とやめたくなる人',
  purpose: '結果だけで進捗を判断せず、今日の行動と積み上げを見て継続できる状態へ戻る',
  benefit: '空白日があっても過去の積み上げを消さず、今日また1歩進める',
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
Object.assign(game, meta);
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
console.log(`[Firebase] patched app-specific card metadata for ${slug}.`);
