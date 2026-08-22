import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const slug = '10x-thinking';

const meta = {
  title: '目の前を10倍にする。',
  kicker: '1X → 10X',
  skill: '10倍思考 / 機会発見',
  icon: '10X',
  description: '量・質・波及を広げ、目の前の仕事を与えられたサイズのまま終わらせない。大きなチャンスへ変える反射を鍛える。',
  forWho: '目の前の仕事を真面目にこなせる一方で、「これをもっと大きな成果につなげられないか」を考える前に終わらせてしまう人',
  purpose: '1件・1回・1人という小さな単位をそのまま受け取らず、量・質・波及のどこで桁を変えるかを考える順序を身につける',
  benefit: '同じ作業を10回やる発想ではなく、仕組み・再利用・体験設計へ視点を変え、目の前の小さな仕事から大きな機会を見つけやすくする',
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
