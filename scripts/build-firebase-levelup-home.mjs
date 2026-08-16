import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const manifestPath = path.join(outDir, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  throw new Error('Firebase manifest not found. Run npm run build:hosting first.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const updateCounts = {
  'watashi-zukan': 19,
  'ato-5min': 3,
  'one-thing': 3,
  'task-separation': 2,
};

const specialGames = [
  {
    slug: 'start',
    title: 'START',
    description: 'MBTIを選び、自分に合う始め方で宿題や仕事を最初の一手まで小さくする。',
    href: '/start',
    updateCount: 1,
    skill: '着手 / 極小化',
  },
  {
    slug: 'maa-iika',
    title: 'まあ、いいか。',
    description: '予定外に抵抗し続けず、「そうなったか」と受け取り、次へ進む反射を鍛える。',
    href: '/maa-iika',
    updateCount: 1,
    skill: '受容 / 切り替え',
  },
  {
    slug: 'self-management',
    title: '自分を回せ。',
    description: '体力、集中、ストレス、脳内WIPを見て、その瞬間に最適な一手を選ぶ。',
    href: '/self-management',
    updateCount: 1,
    skill: '自己管理 / WIP制御',
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const staticGames = manifest.games.map((game) => ({
  slug: game.slug,
  title: game.title,
  description: GAME_META[game.slug]?.[1] || '遊びながら、日常で使える考え方を反復する。',
  href: `/apps/${encodeURIComponent(game.slug)}/`,
  updateCount: updateCounts[game.slug] || 1,
  skill: 'LEVEL UP',
}));

const games = [...specialGames, ...staticGames].sort((a, b) => {
  if (b.updateCount !== a.updateCount) return b.updateCount - a.updateCount;
  return a.title.localeCompare(b.title, 'ja');
});

const cards = games.map((game, index) => `
  <a class="card" href="${escapeHtml(game.href)}">
    <div class="card-top">
      <span class="number">${String(index + 1).padStart(2, '0')}</span>
      <span class="updates">UPDATE ${game.updateCount}</span>
    </div>
    <div class="skill">${escapeHtml(game.skill)}</div>
    <h2>${escapeHtml(game.title)}</h2>
    <p>${escapeHtml(game.description)}</p>
    <div class="play">PLAY <span>↗</span></div>
  </a>`).join('\n');

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#0a0d08" />
  <meta name="description" content="遊ぶだけで、考え方の癖を鍛える。hitobito LEVEL UP。" />
  <title>LEVEL UP | hitobito</title>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;color:#f6f8f1;background:#090b08;--lime:#d8ff5b;--muted:#aab09f;--line:rgba(216,255,91,.17)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 90% -10%,rgba(216,255,91,.12),transparent 32%),#090b08;color:#f6f8f1;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}
    .shell{width:min(1160px,calc(100% - 28px));margin:auto;padding:18px 0 72px}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding:8px 0 18px}.brand{font-size:11px;font-weight:950;letter-spacing:.18em}.top a{font-size:10px;color:var(--muted);border:1px solid var(--line);padding:8px 11px;border-radius:999px}
    .hero{padding:58px 0 44px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);gap:34px;align-items:end}.kicker{font-size:10px;font-weight:950;letter-spacing:.18em;color:var(--lime);margin-bottom:15px}.hero h1{font-size:clamp(64px,11vw,130px);line-height:.78;letter-spacing:-.075em;margin:0;font-weight:950}.hero h1 span{color:var(--lime)}.hero-copy{font-size:14px;line-height:1.9;color:#bbc1b0;margin:0}.stats{display:flex;gap:24px;margin-top:22px}.stats strong{display:block;font-size:28px}.stats span{font-size:9px;letter-spacing:.12em;color:#7f8777;font-weight:900}
    .intro{border:1px solid var(--line);border-radius:22px;padding:18px 20px;margin-bottom:34px;background:rgba(216,255,91,.035);font-size:12px;line-height:1.8;color:#b8bfac}.intro strong{color:#f7f9f2}
    .section-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:13px}.section-head h2{font-size:11px;letter-spacing:.18em;margin:0;text-transform:uppercase}.section-head span{font-size:10px;color:#798071}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{position:relative;overflow:hidden;min-height:250px;border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:17px;background:linear-gradient(150deg,#151a12,#0d100c);display:flex;flex-direction:column;transition:.18s transform,.18s border-color}.card:before{content:'';position:absolute;width:180px;height:180px;border-radius:50%;right:-80px;top:-95px;background:rgba(216,255,91,.055)}.card:hover{transform:translateY(-3px);border-color:rgba(216,255,91,.35)}.card-top{display:flex;justify-content:space-between;position:relative;z-index:1}.number{font-size:9px;font-weight:950;color:#747c6e;letter-spacing:.12em}.updates{font-size:9px;font-weight:950;color:#10140c;background:var(--lime);padding:5px 7px;border-radius:999px}.skill{margin-top:34px;font-size:9px;color:#8e9785;font-weight:900;letter-spacing:.12em}.card h2{font-size:28px;line-height:1.05;letter-spacing:-.045em;margin:10px 0 9px}.card p{font-size:11px;line-height:1.7;color:#aeb5a5;margin:0 0 18px}.play{margin-top:auto;font-size:10px;font-weight:950;letter-spacing:.12em;color:var(--lime)}.play span{font-size:16px;margin-left:4px}.footer{margin-top:50px;border-top:1px solid var(--line);padding-top:20px;color:#747c6e;font-size:10px;display:flex;justify-content:space-between;gap:18px}
    @media(max-width:900px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:600px){.shell{width:min(100% - 20px,1160px);padding-top:10px}.hero{padding:38px 0 30px;gap:20px}.hero h1{font-size:clamp(64px,22vw,94px)}.hero-copy{font-size:13px}.grid{grid-template-columns:1fr}.card{min-height:210px}.footer{flex-direction:column}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="top"><div class="brand">HITOBITO / LEVEL UP</div><a href="https://games.hitobito.jp/">GAMES ↗</a></header>
    <section class="hero">
      <div><div class="kicker">PLAY. REPEAT. CHANGE.</div><h1>LEVEL<br><span>UP.</span></h1></div>
      <div><p class="hero-copy">考え方、行動、切り替え、断る力。知識を読むだけでなく、ゲームとして何度も判断して、日常で使える思考の癖にする。</p><div class="stats"><div><strong>${games.length}</strong><span>TRAINING GAMES</span></div><div><strong>0</strong><span>API COST</span></div></div></div>
    </section>
    <div class="intro"><strong>更新回数が多いゲームほど上に表示。</strong> 繰り返し磨いたものから遊べるようにしています。</div>
    <section><div class="section-head"><h2>Training Games</h2><span>${games.length} games</span></div><div class="grid">${cards}</div></section>
    <footer class="footer"><strong>hitobito LEVEL UP</strong><span>遊んで、生きる力を鍛える。</span></footer>
  </main>
</body>
</html>\n`;

fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log(`[Firebase] LEVEL UP home generated: ${games.length} games`);
