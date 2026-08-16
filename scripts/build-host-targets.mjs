import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, 'apps');
const outRoot = path.join(root, '.dist');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'deploy-targets.json'), 'utf8'));

const cloudflareOut = path.join(outRoot, 'cloudflare');
const firebaseOut = path.join(outRoot, 'firebase');
const excludedCloudflareCategories = new Set(policy.targets.cloudflarePages.excludeCategories || []);
const excludedCloudflareSlugs = new Set(policy.targets.cloudflarePages.excludeSlugs || []);
const firebaseCategories = new Set(policy.targets.firebaseHosting.categories || []);
const humanOnlySlugs = new Set(policy.targets.humanTestOnly.slugs || []);

const CATEGORY_THEME = {
  horror: { label: 'HORROR', icon: '◉', c1: '#ff6a5f', c2: '#531525' },
  nature: { label: 'NATURE', icon: '✦', c1: '#72e6a8', c2: '#14553f' },
  sim: { label: 'SIMULATION', icon: '⌁', c1: '#ffbf69', c2: '#703f17' },
  story: { label: 'STORY', icon: '✎', c1: '#c49bff', c2: '#4e2874' },
  adventure: { label: 'ADVENTURE', icon: '↗', c1: '#72b8ff', c2: '#184b75' },
  other: { label: 'EXPERIMENT', icon: '◆', c1: '#a9b4c7', c2: '#3f4756' },
};

const FEATURED_SLUGS = ['cctv-2am', 'whale-fall', 'one-tsubo', 'elevator'];

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'apps'), { recursive: true });
}

function categoryOf(slug) {
  return GAME_META[slug]?.[0] || 'other';
}

function copyGame(slug, targetRoot) {
  const source = path.join(appsDir, slug);
  const target = path.join(targetRoot, 'apps', slug);
  fs.cpSync(source, target, { recursive: true });
}

function extractTitle(slug) {
  const indexPath = path.join(appsDir, slug, 'index.html');
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim();
  } catch {}
  return slug;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function themeFor(category) {
  return CATEGORY_THEME[category] || CATEGORY_THEME.other;
}

function writeManifest(targetRoot, target, games) {
  fs.writeFileSync(
    path.join(targetRoot, 'manifest.json'),
    JSON.stringify({ target, generatedAt: new Date().toISOString(), games }, null, 2) + '\n',
  );
}

function writeCloudflareIndex(targetRoot, games) {
  const featured = FEATURED_SLUGS
    .map((slug) => games.find((game) => game.slug === slug))
    .filter(Boolean);
  for (const game of games) {
    if (featured.length >= 4) break;
    if (!featured.some((pick) => pick.slug === game.slug)) featured.push(game);
  }

  const featuredCards = featured
    .map((game, index) => {
      const meta = GAME_META[game.slug];
      const description = meta?.[1] || '短時間で遊べるブラウザゲーム。';
      const theme = themeFor(game.category);
      return `
        <a class="feature-card feature-${index + 1}" href="/apps/${encodeURIComponent(game.slug)}/" style="--c1:${theme.c1};--c2:${theme.c2}">
          <div class="feature-cover">
            <div class="feature-no">0${index + 1}</div>
            <div class="feature-symbol">${theme.icon}</div>
            <div class="feature-lines" aria-hidden="true"></div>
          </div>
          <div class="feature-copy">
            <div class="feature-meta"><span>${escapeHtml(theme.label)}</span><span>PLAY ↗</span></div>
            <h2>${escapeHtml(game.title)}</h2>
            <p>${escapeHtml(description)}</p>
          </div>
        </a>`;
    })
    .join('\n');

  const cards = games
    .map((game, index) => {
      const meta = GAME_META[game.slug];
      const description = meta?.[1] || '';
      const theme = themeFor(game.category);
      const serial = String(index + 1).padStart(2, '0');
      return `
        <a class="game-card" data-category="${escapeHtml(game.category)}" href="/apps/${encodeURIComponent(game.slug)}/" style="--c1:${theme.c1};--c2:${theme.c2}">
          <div class="cover">
            <span class="cover-number">HITO / ${serial}</span>
            <span class="cover-symbol">${theme.icon}</span>
            <span class="cover-orbit" aria-hidden="true"></span>
          </div>
          <div class="card-body">
            <div class="card-meta"><span>${escapeHtml(theme.label)}</span><span class="go">↗</span></div>
            <h3>${escapeHtml(game.title)}</h3>
            <p>${escapeHtml(description)}</p>
          </div>
        </a>`;
    })
    .join('\n');

  const categories = [...new Set(games.map((game) => game.category))];
  const categoryChips = categories
    .map((category) => `<button class="filter" type="button" data-filter="${escapeHtml(category)}">${escapeHtml(themeFor(category).label)}</button>`)
    .join('');

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#f2f1ec" />
  <meta name="description" content="hitobito PLAY — インストール不要ですぐ遊べる、短くて変なブラウザゲーム。" />
  <title>hitobito PLAY</title>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;color:#111;background:#f2f1ec;--ink:#111;--paper:#f2f1ec;--muted:#686862;--line:rgba(17,17,17,.14)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}button{font:inherit}
    .shell{width:min(1240px,calc(100% - 32px));margin:0 auto;padding:18px 0 72px}.topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:8px 0 20px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:950;letter-spacing:-.02em}.brand-mark{width:13px;height:13px;border-radius:50%;background:#111;box-shadow:11px 0 0 #ff5f57,22px 0 0 #ffbd2e}.brand span:last-child{margin-left:22px}.topnav{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.topnav a{font-size:10px;font-weight:900;letter-spacing:.05em;border:1px solid var(--line);border-radius:999px;padding:8px 11px;background:rgba(255,255,255,.35)}.topnav a:hover{background:#111;color:#fff}
    .hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:48px;align-items:end;padding:58px 0 46px}.kicker{font-size:11px;font-weight:950;letter-spacing:.17em;text-transform:uppercase;margin-bottom:16px}.hero h1{font-size:clamp(54px,9.2vw,118px);line-height:.84;letter-spacing:-.075em;margin:0;font-weight:950}.hero h1 em{font-style:normal;color:#ff4d42}.hero-copy{max-width:460px;font-size:15px;line-height:1.9;color:#585852;margin:0 0 8px}.hero-stat{display:flex;gap:26px;margin-top:24px}.hero-stat strong{display:block;font-size:26px;line-height:1}.hero-stat span{display:block;margin-top:5px;font-size:9px;letter-spacing:.12em;color:#73736c;font-weight:900}.hero-note{font-size:10px;color:#77776f;margin-top:12px}
    .series-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:52px}.series-link{position:relative;overflow:hidden;min-height:94px;border-radius:18px;padding:16px 18px;color:#fff;display:flex;flex-direction:column;justify-content:space-between;transition:transform .18s ease}.series-link:hover{transform:translateY(-3px)}.series-link b{font-size:18px;letter-spacing:-.03em}.series-link span{font-size:9px;font-weight:900;letter-spacing:.12em;opacity:.72}.series-link.wp{background:#151515}.series-link.horror{background:#421227}.series-link.levelup{background:#22380e}.series-link:after{content:'↗';position:absolute;right:17px;top:14px;font-size:20px}
    .section{margin-top:48px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:16px}.section-title{display:flex;align-items:baseline;gap:12px}.section-title h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;margin:0}.section-title span{font-size:10px;color:#74746d}.feature-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}.feature-card{position:relative;overflow:hidden;border-radius:26px;background:#111;color:#fff;min-height:372px;grid-column:span 6;display:grid;grid-template-columns:.9fr 1.1fr;transition:transform .2s ease,box-shadow .2s ease}.feature-card:hover{transform:translateY(-4px);box-shadow:0 22px 44px rgba(0,0,0,.12)}.feature-cover{position:relative;overflow:hidden;background:linear-gradient(145deg,var(--c1),var(--c2));min-height:100%}.feature-cover:before{content:'';position:absolute;width:220px;height:220px;border:1px solid rgba(255,255,255,.32);border-radius:50%;left:-70px;bottom:-70px}.feature-no{position:absolute;left:18px;top:16px;font-size:11px;font-weight:950;letter-spacing:.12em}.feature-symbol{position:absolute;right:17px;bottom:8px;font-size:118px;line-height:1;font-weight:400;opacity:.9}.feature-lines{position:absolute;inset:25% -8% auto auto;width:74%;height:1px;background:rgba(255,255,255,.45);transform:rotate(-22deg);box-shadow:0 22px 0 rgba(255,255,255,.23),0 44px 0 rgba(255,255,255,.12)}.feature-copy{padding:22px;display:flex;flex-direction:column;justify-content:flex-end}.feature-meta,.card-meta{display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:9px;font-weight:950;letter-spacing:.11em}.feature-meta{margin-bottom:auto;color:#bdbdb9}.feature-copy h2{font-size:clamp(26px,3vw,44px);line-height:1.02;letter-spacing:-.055em;margin:36px 0 10px}.feature-copy p{font-size:12px;line-height:1.7;color:#c5c5c0;margin:0}
    .catalog-head{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.filters{display:flex;gap:7px;overflow:auto;padding:2px 0 4px;scrollbar-width:none}.filters::-webkit-scrollbar{display:none}.filter{white-space:nowrap;border:1px solid var(--line);background:transparent;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:950;letter-spacing:.08em;cursor:pointer}.filter.active,.filter:hover{background:#111;color:#fff;border-color:#111}.games-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.game-card{display:block;border-radius:20px;overflow:hidden;background:#fff;border:1px solid rgba(17,17,17,.09);transition:transform .18s ease,box-shadow .18s ease}.game-card:hover{transform:translateY(-4px);box-shadow:0 18px 36px rgba(0,0,0,.09)}.game-card.hidden{display:none}.cover{position:relative;aspect-ratio:1.45/1;overflow:hidden;background:linear-gradient(145deg,var(--c1),var(--c2));color:#fff}.cover:before{content:'';position:absolute;width:150px;height:150px;border:1px solid rgba(255,255,255,.34);border-radius:50%;right:-38px;top:-44px}.cover-number{position:absolute;left:13px;top:12px;font-size:8px;font-weight:950;letter-spacing:.15em}.cover-symbol{position:absolute;right:13px;bottom:0;font-size:72px;line-height:1;opacity:.9}.cover-orbit{position:absolute;width:130px;height:38px;border:1px solid rgba(255,255,255,.34);border-radius:50%;left:12px;bottom:19px;transform:rotate(-14deg)}.card-body{padding:15px 15px 16px}.card-meta{color:#74746d;margin-bottom:13px}.go{font-size:15px;color:#222}.game-card h3{font-size:19px;line-height:1.12;letter-spacing:-.04em;margin:0 0 8px}.game-card p{font-size:11px;line-height:1.62;color:#686862;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px}
    .footer{margin-top:62px;padding-top:22px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:18px;color:#73736c;font-size:10px}.footer strong{color:#111;letter-spacing:.08em}.footer a{text-decoration:underline;text-underline-offset:3px}
    @media(max-width:980px){.hero{grid-template-columns:1fr;gap:24px;padding-top:44px}.hero-copy{max-width:640px}.feature-card{grid-column:span 12}.games-grid{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:720px){.shell{width:min(100% - 22px,1240px);padding-top:10px}.topbar{align-items:flex-start}.brand span:last-child{font-size:11px}.topnav a{padding:7px 9px}.hero{padding:36px 0 34px}.hero h1{font-size:clamp(52px,18vw,78px)}.hero-copy{font-size:13px;line-height:1.75}.series-strip{grid-template-columns:1fr;margin-bottom:38px}.series-link{min-height:76px}.section{margin-top:38px}.section-head{align-items:flex-start}.feature-card{min-height:330px;grid-template-columns:1fr}.feature-cover{min-height:138px}.feature-symbol{font-size:88px}.feature-copy{padding:18px}.feature-copy h2{font-size:31px;margin-top:24px}.games-grid{grid-template-columns:repeat(2,1fr)}.card-body{padding:13px}.game-card h3{font-size:17px}.game-card p{font-size:10.5px}.footer{flex-direction:column}}
    @media(max-width:430px){.games-grid{grid-template-columns:1fr}.cover{aspect-ratio:1.8/1}.game-card h3{font-size:19px}.feature-card{min-height:310px}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span><span>HITOBITO PLAY</span></a>
      <nav class="topnav" aria-label="関連サイト">
        <a href="https://hitobito.jp/">HITOBITO ↗</a>
        <a href="https://tools.hitobito.jp/">TOOLS ↗</a>
      </nav>
    </header>

    <section class="hero">
      <div>
        <div class="kicker">Browser games, made by hitobito</div>
        <h1>すぐ遊べる、<br><em>変なゲーム。</em></h1>
      </div>
      <div>
        <p class="hero-copy">インストール不要。説明を読む前に触ってみたくなる、小さくて変なブラウザゲームを作っています。</p>
        <div class="hero-stat"><div><strong>${games.length}</strong><span>PLAYABLE GAMES</span></div><div><strong>0</strong><span>INSTALLS NEEDED</span></div></div>
        <div class="hero-note">スマホでもPCでも、そのまま遊べます。</div>
      </div>
    </section>

    <section class="series-strip" aria-label="hitobito game series">
      <a class="series-link wp" href="https://working-planet.hitobito.jp/"><span>SIMULATION SERIES</span><b>ワーキングプラネット</b></a>
      <a class="series-link horror" href="https://404.hitobito.jp/"><span>URBAN HORROR</span><b>404 / 怪異調査</b></a>
      <a class="series-link levelup" href="https://levelup.hitobito.jp/"><span>THINKING GAMES</span><b>LEVEL UP</b></a>
    </section>

    <section class="section">
      <div class="section-head"><div class="section-title"><h2>Pick Up</h2><span>まず遊んでほしい4本</span></div></div>
      <div class="feature-grid">${featuredCards}</div>
    </section>

    <section class="section">
      <div class="section-head catalog-head">
        <div class="section-title"><h2>All Games</h2><span>${games.length} games</span></div>
        <div class="filters" aria-label="カテゴリで絞り込み"><button class="filter active" type="button" data-filter="all">ALL</button>${categoryChips}</div>
      </div>
      <div class="games-grid" id="games">${cards}</div>
    </section>

    <footer class="footer"><strong>HITOBITO PLAY</strong><span>small games, strange worlds. / <a href="https://hitobito.jp/">hitobito.jp</a></span></footer>
  </main>
  <script>
    const buttons = document.querySelectorAll('.filter');
    const cards = document.querySelectorAll('.game-card');
    buttons.forEach(function(button){
      button.addEventListener('click', function(){
        const filter = button.dataset.filter;
        buttons.forEach(function(item){ item.classList.toggle('active', item === button); });
        cards.forEach(function(card){ card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter); });
      });
    });
  </script>
</body>
</html>\n`;

  fs.writeFileSync(path.join(targetRoot, 'index.html'), html);
}

function writeFirebaseIndex(targetRoot, games) {
  const cards = games
    .map((game) => {
      const meta = GAME_META[game.slug];
      const description = meta?.[1] || '';
      return `
        <a class="card" href="/apps/${encodeURIComponent(game.slug)}/">
          <div class="tag">${escapeHtml(game.category)}</div>
          <h2>${escapeHtml(game.title)}</h2>
          <p>${escapeHtml(description)}</p>
          <span>PLAY →</span>
        </a>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LEVEL UP</title>
  <style>
    :root{color-scheme:dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0b0d12;color:#f7f7f8}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#192134 0,#0b0d12 45%);min-height:100vh}
    main{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:54px 0 80px}header{margin-bottom:28px}h1{font-size:clamp(32px,7vw,64px);line-height:1;margin:0 0 12px;letter-spacing:-.04em}
    .lead{color:#aeb7c8;margin:0;font-size:15px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.card{display:block;text-decoration:none;color:inherit;border:1px solid #283248;background:#121722cc;border-radius:18px;padding:20px;min-height:190px;transition:.18s transform,.18s border-color,.18s background}.card:hover{transform:translateY(-3px);border-color:#6d7fa3;background:#171e2c}.card h2{font-size:20px;margin:10px 0 8px}.card p{color:#aeb7c8;font-size:13px;line-height:1.65;margin:0 0 18px}.card span{font-weight:800;font-size:12px;letter-spacing:.08em}.tag{display:inline-block;border:1px solid #34415b;border-radius:999px;padding:4px 8px;color:#8fa4ce;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
  </style>
</head>
<body><main><header><h1>LEVEL UP</h1><p class="lead">遊んで、生きる力を鍛える。</p></header><section class="grid">${cards}</section></main></body>
</html>\n`;

  fs.writeFileSync(path.join(targetRoot, 'index.html'), html);
}

resetDir(cloudflareOut);
resetDir(firebaseOut);

const cloudflareGames = [];
const firebaseGames = [];
const skipped = [];

const entries = fs.existsSync(appsDir)
  ? fs.readdirSync(appsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];

for (const entry of entries) {
  const slug = entry.name;
  const indexPath = path.join(appsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) continue;

  const category = categoryOf(slug);
  const title = extractTitle(slug);
  const humanOnly = humanOnlySlugs.has(slug) || category === 'aaa-lab';

  if (humanOnly) {
    skipped.push({ slug, category, reason: 'human-test-only' });
    continue;
  }

  if (firebaseCategories.has(category)) {
    copyGame(slug, firebaseOut);
    firebaseGames.push({ slug, category, title });
    continue;
  }

  if (excludedCloudflareSlugs.has(slug) || excludedCloudflareCategories.has(category)) {
    skipped.push({ slug, category, reason: 'excluded-from-cloudflare' });
    continue;
  }

  copyGame(slug, cloudflareOut);
  cloudflareGames.push({ slug, category, title });
}

writeManifest(cloudflareOut, 'cloudflare-pages', cloudflareGames);
writeManifest(firebaseOut, 'firebase-hosting', firebaseGames);
writeCloudflareIndex(cloudflareOut, cloudflareGames);
writeFirebaseIndex(firebaseOut, firebaseGames);
fs.writeFileSync(path.join(outRoot, 'skipped.json'), JSON.stringify(skipped, null, 2) + '\n');

console.log(`[Hosting] Cloudflare bundle: ${cloudflareGames.length} games -> .dist/cloudflare`);
console.log(`[Hosting] Firebase bundle: ${firebaseGames.length} games -> .dist/firebase`);
console.log(`[Hosting] Skipped / protected: ${skipped.length} games`);
