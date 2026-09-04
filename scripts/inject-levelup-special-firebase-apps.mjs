import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const sourceRoot = path.join(root, 'firebase-special-apps');
const outDir = path.join(root, '.dist', 'firebase');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

if (!fs.existsSync(outDir)) throw new Error('Firebase output missing. Run build:hosting first.');
if (!fs.existsSync(sourceRoot)) throw new Error('firebase-special-apps source directory missing.');
for (const file of [manifestPath, catalogPath, homePath]) {
  if (!fs.existsSync(file)) throw new Error(`Firebase LEVEL UP build input missing: ${file}`);
}

const slugs = fs.readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => /^[a-z0-9-]+$/.test(slug))
  .filter((slug) => fs.existsSync(path.join(sourceRoot, slug, 'index.html')))
  .sort();

if (!slugs.length) throw new Error('No special LEVEL UP apps with index.html were found.');

const CARD_META = {
  'pulse-start': {
    title: 'PULSE START', kicker: '90 SECOND IGNITION', skill: '行動開始 / 身体から起動', icon: '↗',
    description: '考え込む前に短い身体動作を作り、最初の一手へ移る起動トレーニング。',
    forWho: 'やることは分かっているのに、その場で止まって動き始めにくい人',
    purpose: 'やる気を待たず、姿勢・立つ・触るなど小さな身体動作から行動開始を作る',
    benefit: '考え続ける時間を短くし、約1分で次の具体的な動作へ移りやすくなる',
  },
  'influence-rings': {
    title: 'INFLUENCE RINGS', kicker: 'FOCUS THE INNER RING', skill: '影響範囲 / 注意の切り分け', icon: '◎',
    description: '直接動かせることと、直接は動かせないことを仕分けて次の行動へ戻る練習。',
    forWho: '他人の反応や結果など、自分では直接動かせないことまで考え続けてしまう人',
    purpose: '今の自分が直接動かせる領域と外側を素早く切り分け、注意を内側へ戻す',
    benefit: 'コントロールできないことへの消耗を減らし、自分の次の一手を選びやすくなる',
  },
  'bedtime-world': {
    title: '寝る前が楽しみになるイメトレ', kicker: 'TONIGHT HAS A CONTINUATION', skill: '就寝動機 / イメージ習慣', icon: '☾',
    description: '毎晩ひとつだけ架空世界の続きを開き、布団に入ること自体を楽しみに変える寝る前のイメトレ。',
    forWho: '早く寝たいのに、スマホや作業のほうが今は楽しくて布団へ行くのを先延ばししやすい人',
    purpose: '「早く寝なきゃ」ではなく、「昨日の世界の続きを見たい」から布団へ向かう理由を作る',
    benefit: '入口と3つの感覚手がかりだけ準備し、画面を伏せたあと頭の中で毎晩続きを楽しめる',
  },
  'energy-bucket': {
    title: '夕方に電池切れする人の 体力の穴を1個ふさぐ', kicker: 'LEAK FIRST / ONE PLUG', skill: '疲労習慣 / If-Then', icon: '▽',
    description: '10個の「体力の穴」を見つけ、明日ふさぐ1個だけをIF-THENの行動ルールにする。',
    forWho: '朝は動けても夕方になると頭も体も電池切れし、何から生活を直せばいいか分からない人',
    purpose: '体力対策を増やす前に、毎日エネルギーを減らしていそうな生活習慣を1個だけ選ぶ',
    benefit: '明日1回だけ試せるIF-THENルールを持ち帰り、できた／まだを次回記録できる',
  },
};

function titleFromHtml(html, slug) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = String(match?.[1] || slug)
    .replace(/\s*[|｜]\s*LEVEL\s*UP\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return title || slug;
}

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function card(game) {
  return `\n  <article class="card is-new" data-game="${esc(game.slug)}" data-new="true">\n    <button class="favorite" type="button" data-favorite="${esc(game.slug)}" aria-pressed="false" aria-label="${esc(game.title)}をお気に入りに追加">♡</button>\n    <a class="card-link" href="${esc(game.href)}">\n      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE 1</span></div>\n      <div class="icon">${esc(game.icon)}</div>\n      <div class="kicker">${esc(game.kicker)}</div>\n      <div class="skill">${esc(game.skill)}</div>\n      <h2>${esc(game.title)}</h2><p>${esc(game.description)}</p>\n      <div class="card-values"><div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${esc(game.forWho)}</span></div><div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${esc(game.purpose)}</span></div><div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${esc(game.benefit)}</span></div></div>\n      <div class="play">PLAY <span>↗</span></div>\n    </a>\n  </article>`;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let home = fs.readFileSync(homePath, 'utf8');
if (!Array.isArray(manifest.games) || !Array.isArray(catalog.games)) throw new Error('Firebase LEVEL UP metadata is invalid.');
const manifestSlugs = new Set(manifest.games.map((game) => game?.slug).filter(Boolean));
const catalogSlugs = new Set(catalog.games.map((game) => game?.slug).filter(Boolean));
let registered = 0;
let cataloged = 0;

for (const slug of slugs) {
  const source = path.join(sourceRoot, slug);
  const sourceIndex = path.join(source, 'index.html');
  const sourceHtml = fs.readFileSync(sourceIndex, 'utf8');

  for (const destination of [path.join(outDir, slug), path.join(outDir, 'apps', slug)]) {
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
    const outputIndex = path.join(destination, 'index.html');
    if (!fs.existsSync(outputIndex)) throw new Error(`Special LEVEL UP copy failed: ${slug}`);
    const html = fs.readFileSync(outputIndex, 'utf8');
    if (!html.includes('href="/"')) throw new Error(`Special LEVEL UP home link missing: ${slug}`);
  }

  if (!manifestSlugs.has(slug)) {
    manifest.games.push({ slug, title: titleFromHtml(sourceHtml, slug), category: 'levelup' });
    manifestSlugs.add(slug);
    registered += 1;
  }

  const meta = CARD_META[slug];
  if (meta && !catalogSlugs.has(slug)) {
    const game = { slug, ...meta, href: `/apps/${slug}/`, updateCount: 1 };
    catalog.games.unshift(game);
    catalogSlugs.add(slug);
    if (!home.includes(`data-game="${slug}"`)) {
      if (!home.includes('<div class="grid">')) throw new Error('LEVEL UP card grid not found.');
      home = home.replace('<div class="grid">', `<div class="grid">${card(game)}`);
    }
    cataloged += 1;
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
if (cataloged) {
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(homePath, home);
}
console.log(`[Firebase] Copied ${slugs.length} special LEVEL UP apps; registered ${registered} manifest entries; cataloged ${cataloged} apps with explicit card copy.`);
