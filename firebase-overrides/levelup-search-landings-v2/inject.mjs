import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const canonicalBase = 'https://levelup.hitobito.jp';

if (!fs.existsSync(catalogPath)) throw new Error('LEVEL UP catalog not found.');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).games || [];
const bySlug = new Map(catalog.map((game) => [game.slug, game]));

const existingProblems = [
  ['ugokenai', '先延ばしで動けない', 'PROCRASTINATION / START'],
  ['hikizuru', '嫌なこと・失言を引きずる', 'RUMINATION / RESET'],
  ['hitonome', '人の目・嫌われるのが気になる', 'APPROVAL / SELF AXIS'],
  ['kangaesugi', '考えすぎて頭がいっぱい', 'OVERTHINKING / CLEAR'],
  ['smartphone', 'スマホをやめたい', 'PHONE / DOPAMINE'],
  ['tsukareta', '疲れて何もしたくない', 'TIRED / RECOVERY'],
  ['kotowarenai', '断れない・頼めない', 'ASSERTIVE / BOUNDARY'],
  ['nerumae-kangaegoto', '寝る前に考え事が止まらない', 'BEDTIME / PARK'],
];

const newDefinitions = [
  {
    slug: 'shigoto-yaruki',
    title: '仕事のやる気が出ないとき',
    seoTitle: '仕事のやる気が出ない・仕事に手がつかないとき | LEVEL UP',
    description: '仕事を始めなきゃいけないのにやる気が出ない、手が止まるときに。気合いではなく最初の一手を小さくして、短く動き始める無料トレーニングです。',
    kicker: 'WORK / START',
    lead: 'やる気が出るまで待たず、動けるサイズまで仕事を小さくする。今の状態に近い1本を選んで、その場で始めます。',
    candidates: ['3sec-action', 'ato-5min', 'start', 'one-thing', 'ima-yaru'],
  },
  {
    slug: 'asa-okirenai',
    title: '朝起きられないとき',
    seoTitle: '朝起きられない・起きても動けないときの最初の一手 | LEVEL UP',
    description: '朝起きられない、起きても布団から動けない、朝の行動を始められないときに。考える前に最小の行動へつなげる無料トレーニングです。',
    kicker: 'MORNING / MOVE',
    lead: '完璧な朝を作ろうとしない。起きた直後に必要なことを1つだけにして、体を先に動かします。',
    candidates: ['3sec-action', 'one-thing', 'self-management', 'start'],
  },
  {
    slug: 'ikari-henshin',
    title: '怒りの返信を送りそうなとき',
    seoTitle: '怒りのメール・LINEを送りそうなときの返信前トレーニング | LEVEL UP',
    description: '腹が立ってメールやLINE、チャットに強い返信を送りそうなときに。感情と伝える内容を分け、送る前に一度整える無料トレーニングです。',
    kicker: 'ANGER / REPLY',
    lead: '怒りを消す必要はない。送る文章だけは別にする。相手を攻撃せず、自分の線を伝える形へ切り替えます。',
    candidates: ['assertive', 'task-separation', 'maa-iika', 'hard-request'],
  },
  {
    slug: 'kaigi-hansei',
    title: '会議のあと反省が止まらないとき',
    seoTitle: '会議後の反省・相手の反応が気になって止まらないとき | LEVEL UP',
    description: '会議や商談のあとに「変なことを言ったかも」「相手の反応が悪かったかも」と何度も振り返ってしまうときに。必要な改善だけ残して反芻を終える無料トレーニングです。',
    kicker: 'MEETING / RESET',
    lead: '改善点は残す。でも、相手の表情や評価を何度も再生し続けない。事実と想像を分けて反省会を終わらせます。',
    candidates: ['mou-owatta', 'sukkiri-note', 'kanji-warukatta', 'maa-iika'],
  },
  {
    slug: 'short-video-yametai',
    title: 'ショート動画をやめたいとき',
    seoTitle: 'ショート動画・リール・TikTokをやめたいときの切り替えゲーム | LEVEL UP',
    description: 'TikTok、YouTube Shorts、Instagram Reelsなどのショート動画を見続けてしまうときに。刺激の連鎖を一度切り、次の行動へ移る無料トレーニングです。',
    kicker: 'SHORT VIDEO / EXIT',
    lead: 'あと1本を繰り返さない。意志だけで耐えず、画面から離れるきっかけを作って次の行動へ移ります。',
    candidates: ['smartphone-escape', 'one-thing', '3sec-action'],
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function canonicalize(href) {
  const url = new URL(href, canonicalBase);
  url.search = '';
  url.hash = '';
  if (url.pathname !== '/' && !url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

const style = `
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;color:#f6f8f1;background:#090b08;--lime:#d8ff5b;--muted:#aab09f;--line:rgba(216,255,91,.18)}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 88% -10%,rgba(216,255,91,.11),transparent 32%),#090b08;color:#f6f8f1;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}.shell{width:min(900px,calc(100% - 30px));margin:auto;padding:18px 0 72px}.top{display:flex;align-items:center;justify-content:space-between;padding:8px 0 18px;border-bottom:1px solid var(--line)}.brand{font-size:12px;font-weight:950;letter-spacing:.12em}.home{font-size:12px;color:var(--muted);border:1px solid var(--line);padding:8px 11px;border-radius:999px}.hero{padding:54px 0 30px}.kicker{font-size:12px;font-weight:950;letter-spacing:.14em;color:var(--lime);margin-bottom:12px}h1{font-size:clamp(38px,8vw,68px);line-height:.98;letter-spacing:-.055em;margin:0 0 16px}.lead{font-size:14px;line-height:1.9;color:#c1c7b8;max-width:740px;margin:0}.section{padding:28px 0;border-top:1px solid var(--line)}.section h2{font-size:24px;margin:0 0 14px;letter-spacing:-.03em}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{display:flex;flex-direction:column;min-height:220px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(145deg,rgba(216,255,91,.07),rgba(255,255,255,.025));border-radius:18px;padding:16px}.card small{font-size:12px;letter-spacing:.10em;color:var(--lime);font-weight:900}.card h3{font-size:22px;line-height:1.15;margin:10px 0 8px}.card p{font-size:12px;line-height:1.65;color:#aeb5a5;margin:0 0 14px}.play{margin-top:auto;font-size:12px;font-weight:950;color:var(--lime)}.why{display:grid;grid-template-columns:1fr 1fr;gap:10px}.why div{border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:15px}.why strong{display:block;font-size:13px;margin-bottom:5px}.why span{font-size:12px;line-height:1.65;color:#aeb5a5}.problem-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.problem-list a{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:13px 14px;background:#11150e}.problem-list strong{display:block;font-size:13px}.problem-list span{display:block;font-size:12px;color:#929b89;margin-top:4px}.footer{padding-top:24px;border-top:1px solid var(--line);font-size:12px;color:#7f8777}.footer a{color:#aeb5a5;margin-right:14px}@media(max-width:720px){.grid{grid-template-columns:1fr}.why,.problem-list{grid-template-columns:1fr}.card{min-height:0}.hero{padding-top:42px}}
`;

function appCards(definition) {
  return definition.candidates
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, 3)
    .map((game) => {
      const href = game.href || `/apps/${encodeURIComponent(game.slug)}/`;
      return `<a class="card" href="${escapeHtml(href)}?utm_source=google&utm_medium=organic&utm_campaign=problem_${escapeHtml(definition.slug)}"><small>${escapeHtml(game.skill || 'LEVEL UP')}</small><h3>${escapeHtml(game.title)}</h3><p>${escapeHtml(game.description || game.benefit || '')}</p><div class="play">今すぐやる →</div></a>`;
    });
}

function landingHtml(definition) {
  const cards = appCards(definition);
  if (!cards.length) throw new Error(`No matching apps for new problem landing: ${definition.slug}`);
  const canonical = `${canonicalBase}/problems/${definition.slug}/`;
  const itemList = definition.candidates
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, 3)
    .map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: game.title,
      url: canonicalize(game.href || `/apps/${encodeURIComponent(game.slug)}/`),
    }));
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: definition.seoTitle.replace(/ \| LEVEL UP$/, ''),
    description: definition.description,
    url: canonical,
    mainEntity: { '@type': 'ItemList', itemListElement: itemList },
  }).replaceAll('</', '<\\/');

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#0a0d08" />
  <meta name="description" content="${escapeHtml(definition.description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta property="og:title" content="${escapeHtml(definition.seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(definition.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <title>${escapeHtml(definition.seoTitle)}</title>
  <script type="application/ld+json">${jsonLd}</script>
  <style>${style}</style>
</head>
<body>
  <div class="shell">
    <header class="top"><a class="brand" href="/">HITOBITO / LEVEL UP</a><a class="home" href="/">トップへ</a></header>
    <main>
      <section class="hero"><div class="kicker">${escapeHtml(definition.kicker)}</div><h1>${escapeHtml(definition.title)}</h1><p class="lead">${escapeHtml(definition.lead)}</p></section>
      <section class="section"><h2>今の状態から始める3本</h2><div class="grid">${cards.join('')}</div></section>
      <section class="section"><h2>使い方</h2><div class="why"><div><strong>① 一番近い1本だけ選ぶ</strong><span>全部やる必要はありません。タイトルを見て「今これ」と思うものを1本だけ。</span></div><div><strong>② 短くプレイして現実へ戻る</strong><span>LEVEL UPは知識を読む場所ではなく、考え方と行動を短く反復するトレーニングです。</span></div></div></section>
      <section class="section"><a class="home" href="/problems/">ほかの悩みから探す →</a></section>
    </main>
    <footer class="footer"><a href="/privacy/">プライバシー</a><a href="/terms/">利用規約</a><a href="/support/">サポート</a></footer>
  </div>
</body>
</html>`;
}

function writeNewPages() {
  const problemsDir = path.join(outDir, 'problems');
  fs.mkdirSync(problemsDir, { recursive: true });
  for (const definition of newDefinitions) {
    const dir = path.join(problemsDir, definition.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), landingHtml(definition));
  }
}

function writeHub() {
  const canonical = `${canonicalBase}/problems/`;
  const all = [
    ...existingProblems,
    ...newDefinitions.map((d) => [d.slug, d.title.replace(/とき$/, ''), d.kicker]),
  ];
  const description = '先延ばし、仕事のやる気、朝起きられない、会議後の反省、怒りの返信、ショート動画、考えすぎ、人の目、スマホ、疲れなど。今の悩みから、その場で使えるLEVEL UPの無料トレーニングを探せます。';
  const list = all.map(([slug, title, kicker]) => `<a href="/problems/${escapeHtml(slug)}/"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(kicker)}</span></a>`).join('');
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: '悩みからLEVEL UPを探す', description, url: canonical }).replaceAll('</', '<\\/');
  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#0a0d08" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <title>悩みから無料トレーニングを探す | LEVEL UP</title>
  <script type="application/ld+json">${jsonLd}</script>
  <style>${style}</style>
</head>
<body>
  <div class="shell">
    <header class="top"><a class="brand" href="/">HITOBITO / LEVEL UP</a><a class="home" href="/">トップへ</a></header>
    <main>
      <section class="hero"><div class="kicker">FIND BY PROBLEM</div><h1>いま困っていることから探す。</h1><p class="lead">アプリ名を知らなくても大丈夫。いまの状態に一番近い入口から、その場で使えるLEVEL UPへ進めます。</p></section>
      <section class="section"><h2>今どうしたい？</h2><div class="problem-list">${list}</div></section>
    </main>
    <footer class="footer"><a href="/privacy/">プライバシー</a><a href="/terms/">利用規約</a><a href="/support/">サポート</a></footer>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, 'problems', 'index.html'), html);
}

function refreshSitemap() {
  const sitemapPath = path.join(outDir, 'sitemap.xml');
  const urls = new Set([`${canonicalBase}/`, `${canonicalBase}/problems/`]);
  if (fs.existsSync(sitemapPath)) {
    const current = fs.readFileSync(sitemapPath, 'utf8');
    for (const match of current.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const decoded = match[1].replaceAll('&amp;', '&');
      if (decoded.startsWith(canonicalBase)) urls.add(decoded);
    }
  }
  for (const definition of newDefinitions) urls.add(`${canonicalBase}/problems/${definition.slug}/`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(sitemapPath, xml);
}

writeNewPages();
writeHub();
refreshSitemap();

for (const definition of newDefinitions) {
  const indexPath = path.join(outDir, 'problems', definition.slug, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error(`Missing new problem landing: ${definition.slug}`);
  const html = fs.readFileSync(indexPath, 'utf8');
  for (const required of ['<meta name="description"', '<link rel="canonical"', 'application/ld+json', '今の状態から始める3本']) {
    if (!html.includes(required)) throw new Error(`New problem landing failed validation: ${definition.slug} / ${required}`);
  }
}

console.log(`[Firebase] LEVEL UP acquisition expansion ready: ${newDefinitions.length} new problem landings; 13-problem hub refreshed.`);
