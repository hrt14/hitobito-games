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

if (!fs.existsSync(sourceIndex)) throw new Error('Amazon operator source is missing.');
if (!fs.existsSync(homePath)) throw new Error('Firebase LEVEL UP home is missing.');

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceIndex, path.join(targetDir, 'index.html'));

let html = fs.readFileSync(homePath, 'utf8');
const slug = 'amazon-operator';

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

  html = html.replace(/<strong>(\d+)<\/strong><span>TRAINING GAMES<\/span>/, (_, n) => `<strong>${Number(n) + 1}</strong><span>TRAINING GAMES</span>`);
  html = html.replace(/<span>(\d+) games<\/span>/, (_, n) => `<span>${Number(n) + 1} games</span>`);
}

fs.writeFileSync(homePath, html);

if (fs.existsSync(catalogPath)) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  if (!catalog.games.some((game) => game.slug === slug)) {
    catalog.games.unshift({
      slug,
      title: 'Amazon担当者',
      kicker: 'AMAZON OPERATOR',
      skill: 'EC運用 / 広告判断',
      description: '広告・商品詳細ページ・利益・在庫の数字から、ボトルネックと次の一手を判断する。',
      icon: 'AMZ',
      updateCount: 1,
      href: '/apps/amazon-operator/'
    });
    fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }
}

const finalHtml = fs.readFileSync(homePath, 'utf8');
const liveIndex = path.join(targetDir, 'index.html');
if (!fs.existsSync(liveIndex) || fs.statSync(liveIndex).size < 5000) throw new Error('Amazon operator app copy failed.');
if (!finalHtml.includes('data-game="amazon-operator"')) throw new Error('Amazon operator LEVEL UP card injection failed.');
if (!finalHtml.includes('data-new="true"')) throw new Error('Amazon operator NEW marker missing.');

console.log('[Firebase] Amazon operator training injected + NEW card added');
