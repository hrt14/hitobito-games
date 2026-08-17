import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const out = path.join(root, '.dist', 'firebase');
const targetDir = path.join(out, 'apps', 'amazon-operator');
const sourceIndex = path.join(here, 'index.html');
const homePath = path.join(out, 'index.html');
const catalogPath = path.join(out, 'levelup-catalog.json');

for (const file of [sourceIndex, homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`Amazon operator prerequisite missing: ${file}`);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceIndex, path.join(targetDir, 'index.html'));

const game = {
  slug: 'amazon-operator',
  title: 'Amazon担当者',
  kicker: 'AMAZON OPERATOR',
  skill: 'EC運用 / 広告判断',
  description: 'Amazon運用の数字からボトルネックを見抜き、広告・商品ページ・利益・在庫の次の一手を判断する。',
  icon: 'AMZ',
  href: '/apps/amazon-operator/',
  updateCount: 1,
};

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const beforeCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) catalog.games.push(game);
const afterCount = catalog.games.length;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
const slug = game.slug;

if (!html.includes(`data-game="${slug}"`)) {
  const card = `
  <article class="card is-new" data-game="amazon-operator" data-new="true">
    <button class="favorite" type="button" data-favorite="amazon-operator" aria-pressed="false" aria-label="Amazon担当者をお気に入りに追加">♡</button>
    <a class="card-link" href="/apps/amazon-operator/">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE 1</span></div>
      <div class="icon">AMZ</div>
      <div class="kicker">AMAZON OPERATOR</div>
      <div class="skill">EC運用 / 広告判断</div>
      <h2>Amazon担当者</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">Amazon運用を担当する人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">数字からボトルネックを見抜く</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">広告・商品ページ・利益・在庫の次の一手が速くなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

  const gridOpen = '<div class="grid">';
  if (!html.includes(gridOpen)) throw new Error('LEVEL UP card grid not found.');
  html = html.replace(gridOpen, `${gridOpen}${card}`);
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
const liveIndex = path.join(targetDir, 'index.html');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!fs.existsSync(liveIndex) || fs.statSync(liveIndex).size < 5000) throw new Error('Amazon operator app copy failed.');
if (!finalHtml.includes('data-game="amazon-operator"')) throw new Error('Amazon operator LEVEL UP card injection failed.');
if (!finalHtml.includes('data-new="true"')) throw new Error('Amazon operator NEW marker missing.');
if (!finalCatalog.games.some((item) => item.slug === slug)) throw new Error('Amazon operator catalog integration failed.');

console.log(`[Firebase] Amazon operator training injected + cataloged (${afterCount} games)`);
