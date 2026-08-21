import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const sourceDir = path.join(root, 'apps', 'reaction-pattern');
const outDir = path.join(root, '.dist', 'firebase');
const targetDir = path.join(outDir, 'apps', 'reaction-pattern');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

for (const required of [sourceDir, manifestPath, catalogPath, homePath]) {
  if (!fs.existsSync(required)) throw new Error(`reaction-pattern prerequisite missing: ${required}`);
}

const meta = {
  slug: 'reaction-pattern',
  title: '5分で見える 自分の反応パターン｜性格5軸＋メタ認知トレーニング',
  kicker: 'SELF OBSERVER / 5 MIN',
  skill: '自己理解 / メタ認知 / 感情整理',
  description: '性格を1タイプに決めず、5つの傾向・反応の奥の動機・事実と解釈の混ざり方から「自分の反応の取扱説明書」を作る。',
  icon: '◎',
  href: '/apps/reaction-pattern/',
  updateCount: 1,
  forWho: '自分のことを知りたいが、性格診断で「あなたは○○型」と言われるだけでは日常の反応を変えにくい人',
  purpose: '性格の傾向、反応の奥で守りたいもの、事実と解釈の混ざり方を分けて、自分を一段上から観察する',
  benefit: '約5分で「自分は何に反応しやすく、反応した瞬間に何を確認すればいいか」を短い取扱説明書として持ち帰れる',
};
const obi = '「私はこういう人」で終わらない。反応した瞬間に、自分を一段上から見る。';

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
const manifestGame = manifest.games.find((game) => game.slug === meta.slug);
if (manifestGame) {
  manifestGame.category = 'levelup';
  manifestGame.title = meta.title;
} else {
  manifest.games.push({ slug: meta.slug, category: 'levelup', title: meta.title });
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');
catalog.games = catalog.games.filter((game) => game.slug !== meta.slug);
catalog.games.unshift(meta);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const card = `
  <article class="card is-new" data-game="${escapeHtml(meta.slug)}" data-new="true">
    <button class="favorite" type="button" data-favorite="${escapeHtml(meta.slug)}" aria-pressed="false" aria-label="${escapeHtml(meta.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(meta.href)}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${meta.updateCount}</span></div>
      <div class="icon">${escapeHtml(meta.icon)}</div>
      <div class="kicker">${escapeHtml(meta.kicker)}</div>
      <div class="skill">${escapeHtml(meta.skill)}</div>
      <h2>${escapeHtml(meta.title)}</h2>
      <p class="book-obi">${escapeHtml(obi)}</p>
      <p>${escapeHtml(meta.description)}</p>
      <div class="card-values" aria-label="このアプリの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(meta.forWho)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(meta.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(meta.benefit)}</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

let html = fs.readFileSync(homePath, 'utf8');
html = html.replace(new RegExp(`<article[^>]*data-game="${meta.slug}"[\\s\\S]*?<\\/article>`), '');
const gridOpen = '<div class="grid">';
if (!html.includes(gridOpen)) throw new Error('LEVEL UP home grid not found for reaction-pattern.');
html = html.replace(gridOpen, `${gridOpen}${card}`);
const count = catalog.games.length;
html = html.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${count}</strong><span>TRAINING GAMES</span>`);
html = html.replace(/(<div class="section-head"><h2>Training Games<\/h2><span>)\d+( games<\/span>)/, `$1${count}$2`);
fs.writeFileSync(homePath, html);

const liveApp = path.join(targetDir, 'index.html');
const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!fs.existsSync(liveApp)) throw new Error('reaction-pattern was not copied into the Firebase bundle.');
const appHtml = fs.readFileSync(liveApp, 'utf8');
if (!appHtml.includes('data-reaction-pattern-v1')) throw new Error('reaction-pattern source marker is missing.');
if (!appHtml.includes('医学的・心理学的な診断ではありません')) throw new Error('reaction-pattern non-diagnostic disclosure is missing.');
if (!appHtml.includes('事実') || !appHtml.includes('解釈') || !appHtml.includes('次の一手')) throw new Error('reaction-pattern metacognition sorter is missing.');
if (!appHtml.includes('reaction-pattern-history')) throw new Error('reaction-pattern local self-monitoring history is missing.');
if (!appHtml.includes('navigator.share')) throw new Error('reaction-pattern share loop is missing.');
if (!finalHome.includes(`data-game="${meta.slug}"`)) throw new Error('reaction-pattern card is missing from LEVEL UP home.');
if (!finalHome.includes(meta.forWho)) throw new Error('reaction-pattern dedicated こんな人に copy is missing.');
if (!finalHome.includes(`class="book-obi">${escapeHtml(obi)}`)) throw new Error('reaction-pattern title+obi card is missing.');
if (!finalCatalog.games.some((game) => game.slug === meta.slug && game.forWho === meta.forWho)) throw new Error('reaction-pattern catalog metadata is missing.');
console.log('[Firebase] reaction-pattern registered: app + self-observation + metacognition sorter + local history + share loop.');
