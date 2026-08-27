import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home not found for success-mind card injection.');

let html = fs.readFileSync(homePath, 'utf8');
if (html.includes('data-game="success-mind"')) {
  console.log('[Firebase] success-mind card already exists.');
  process.exit(0);
}
if (!html.includes('id="levelup-book-cards-style"')) {
  throw new Error('Book-card styles must be injected before success-mind card.');
}

const card = `
  <article class="card is-new" data-game="success-mind" data-new="true">
    <button class="favorite" type="button" data-favorite="success-mind" aria-pressed="false" aria-label="成功マインド診断をお気に入りに追加">♡</button>
    <a class="card-link" href="/apps/success-mind/">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE 1</span></div>
      <div class="icon">¥</div>
      <div class="kicker">12 DECISIONS → LIFETIME EARNINGS</div>
      <div class="skill">成功思考 / 意思決定 / 自己理解</div>
      <h2>考え方で「生涯年収」が変わる？ 成功マインド診断</h2>
      <p class="book-obi">12の判断から「成功マインド換算 生涯年収」を出す。</p>
      <p>仕事・失敗・お金・競争・チャンスの12場面から、成功につながる判断パターンを6軸で診断する。</p>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">このままの考え方で収入やキャリアが伸びるか知りたい人</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">実行・統制・複利・学習・協力・リスク設計の判断パターンを診断する</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">成功を一番伸ばしている考え方と、一番止めている考え方が金額スケールで分かる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

const gridPattern = /(<div class="grid"[^>]*>)/;
if (!gridPattern.test(html)) throw new Error('LEVEL UP card grid not found.');
html = html.replace(gridPattern, `$1${card}`);
fs.writeFileSync(homePath, html);

const verify = fs.readFileSync(homePath, 'utf8');
if (!verify.includes('data-game="success-mind"') || !verify.includes('class="book-obi"')) {
  throw new Error('success-mind book card injection verification failed.');
}
console.log('[Firebase] success-mind NEW book card injected.');
