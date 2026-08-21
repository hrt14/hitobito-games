import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const canonicalBase = 'https://levelup.hitobito.jp';

if (!fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP catalog not found. Run this after the Firebase LEVEL UP build.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).games || [];
const bySlug = new Map(catalog.map((game) => [game.slug, game]));

const landingDefinitions = [
  {
    slug: 'ugokenai',
    title: 'やるべきことに手をつけられないとき',
    seoTitle: '先延ばしで動けない・やる気が出ないときの30秒ゲーム | LEVEL UP',
    description: 'やるべきことがあるのに手をつけられない、先延ばししてしまうときに。考える前に最初の一手まで小さくする無料トレーニングをまとめました。',
    kicker: 'PROCRASTINATION / START',
    lead: '「全部やらなきゃ」をやめて、最初の一手だけにする。いまの重さに合うLEVEL UPを1本選んで、その場で始められます。',
    candidates: ['3sec-action', 'ato-5min', 'start', 'one-thing', 'ima-yaru'],
  },
  {
    slug: 'hikizuru',
    title: '嫌なこと・失言を引きずるとき',
    seoTitle: '嫌なことや失言を引きずる・頭から離れないときの切り替えゲーム | LEVEL UP',
    description: '会議や会話の失言、嫌だった出来事を何度も思い返してしまうときに。必要な反省だけ残して、頭の中の反芻を終える無料トレーニングです。',
    kicker: 'RUMINATION / RESET',
    lead: 'もう終わった出来事を、もう一度生き直さない。事実・直せること・想像を分けて、頭の中のループを短く終わらせます。',
    candidates: ['mou-owatta', 'sukkiri-note', 'maa-iika', 'kanji-warukatta', 'nukeru'],
  },
  {
    slug: 'hitonome',
    title: '人の目・嫌われることが気になるとき',
    seoTitle: '人の目が気になる・嫌われるのが怖いときの自分軸トレーニング | LEVEL UP',
    description: '「感じ悪かったかな」「嫌われないかな」と相手の評価が気になるときに。他人の評価と自分の行動を分け、自分軸へ戻る無料トレーニングです。',
    kicker: 'APPROVAL / SELF AXIS',
    lead: '気遣いは残して、評価の予測だけ手放す。相手の課題と自分の課題を分け、判断のハンドルを自分側へ戻します。',
    candidates: ['approval-off', 'task-separation', 'jibun-wa-jibun', 'expect-nothing', 'kanji-warukatta'],
  },
  {
    slug: 'kangaesugi',
    title: '考えすぎて頭がいっぱいなとき',
    seoTitle: '考えすぎて疲れた・頭がいっぱいなときの思考整理ゲーム | LEVEL UP',
    description: '考えることが多すぎて頭がいっぱい、何から考えればいいかわからないときに。余計な思考負荷を減らし、次の一手だけを決める無料トレーニングです。',
    kicker: 'OVERTHINKING / CLEAR',
    lead: '全部を同時に解こうとしない。いま考える必要があるものだけ残して、頭の中のWIPを減らします。',
    candidates: ['extra-load', 'thinking-stairs', 'matomaru', 'name-it', 'self-management'],
  },
  {
    slug: 'smartphone',
    title: 'スマホをやめたい・触りすぎるとき',
    seoTitle: 'スマホをやめたい・スマホ依存を減らしたいときの無料ゲーム | LEVEL UP',
    description: '気づくとスマホを触っている、SNSや動画をやめられないときに。依存パターンを知り、刺激との距離を作るための無料トレーニングです。',
    kicker: 'PHONE / DOPAMINE',
    lead: '意志の強さだけで我慢しない。触ってしまう場面を見つけて、環境と行動の両方からスマホとの距離を作ります。',
    candidates: ['smartphone-escape', 'one-thing', '3sec-action'],
  },
  {
    slug: 'tsukareta',
    title: '疲れて何もしたくないとき',
    seoTitle: '疲れて何もしたくない・頭が動かないときの回復ゲーム | LEVEL UP',
    description: '疲れて何もしたくない、頭が回らない、気力が残っていないときに。さらに疲れを増やす思考を減らし、その瞬間に必要な回復を選ぶ無料トレーニングです。',
    kicker: 'TIRED / RECOVERY',
    lead: '疲れているときに、さらに自分へ課題を足さない。今の体力と脳内負荷を見て、回復につながる最小の一手を選びます。',
    candidates: ['self-management', 'extra-load', 'levelup-mood', 'nemuri-no-umi', 'nukeru'],
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

function localIndexPath(href) {
  const url = new URL(canonicalize(href));
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '').replace(/\/+$/, '');
  return relative ? path.join(outDir, relative, 'index.html') : path.join(outDir, 'index.html');
}

function ensureTag(html, test, markup) {
  if (test.test(html)) return html;
  return html.replace('</head>', `  ${markup}\n</head>`);
}

function ensurePageSeo(html, game, href) {
  const canonical = canonicalize(href);
  const fallbackDescription = game.description || game.benefit || '遊んで、考え方と行動の反射を鍛えるLEVEL UPトレーニング。';
  const fallbackTitle = `${game.title || game.slug} | LEVEL UP`;

  html = ensureTag(html, /<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(fallbackTitle)}</title>`);
  html = ensureTag(html, /<meta[^>]+name=["']description["']/i, `<meta name="description" content="${escapeHtml(fallbackDescription)}" />`);
  html = ensureTag(html, /<meta[^>]+name=["']robots["']/i, '<meta name="robots" content="index,follow,max-image-preview:large" />');

  if (/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`);
  }

  return html;
}

function updateExistingPages() {
  let updated = 0;
  for (const game of catalog) {
    const href = game.href || `/apps/${encodeURIComponent(game.slug)}/`;
    const indexPath = localIndexPath(href);
    if (!fs.existsSync(indexPath)) continue;
    const before = fs.readFileSync(indexPath, 'utf8');
    const after = ensurePageSeo(before, game, href);
    if (after !== before) {
      fs.writeFileSync(indexPath, after);
      updated += 1;
    }
  }

  const homePath = path.join(outDir, 'index.html');
  if (fs.existsSync(homePath)) {
    let home = fs.readFileSync(homePath, 'utf8');
    home = ensureTag(home, /<meta[^>]+name=["']robots["']/i, '<meta name="robots" content="index,follow,max-image-preview:large" />');
    if (/<link[^>]+rel=["']canonical["'][^>]*>/i.test(home)) {
      home = home.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonicalBase}/" />`);
    } else {
      home = home.replace('</head>', `  <link rel="canonical" href="${canonicalBase}/" />\n</head>`);
    }
    fs.writeFileSync(homePath, home);
  }
  return updated;
}

const style = `
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;color:#f6f8f1;background:#090b08;--lime:#d8ff5b;--muted:#aab09f;--line:rgba(216,255,91,.18)}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 88% -10%,rgba(216,255,91,.11),transparent 32%),#090b08;color:#f6f8f1;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}.shell{width:min(900px,calc(100% - 30px));margin:auto;padding:18px 0 72px}.top{display:flex;align-items:center;justify-content:space-between;padding:8px 0 18px;border-bottom:1px solid var(--line)}.brand{font-size:11px;font-weight:950;letter-spacing:.16em}.home{font-size:10px;color:var(--muted);border:1px solid var(--line);padding:8px 11px;border-radius:999px}.hero{padding:54px 0 30px}.kicker{font-size:10px;font-weight:950;letter-spacing:.16em;color:var(--lime);margin-bottom:12px}h1{font-size:clamp(38px,8vw,68px);line-height:.98;letter-spacing:-.055em;margin:0 0 16px}.lead{font-size:14px;line-height:1.9;color:#c1c7b8;max-width:740px;margin:0}.section{padding:28px 0;border-top:1px solid var(--line)}.section h2{font-size:24px;margin:0 0 14px;letter-spacing:-.03em}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{display:flex;flex-direction:column;min-height:220px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(145deg,rgba(216,255,91,.07),rgba(255,255,255,.025));border-radius:18px;padding:16px}.card small{font-size:9px;letter-spacing:.12em;color:var(--lime);font-weight:900}.card h3{font-size:22px;line-height:1.15;margin:10px 0 8px}.card p{font-size:11px;line-height:1.65;color:#aeb5a5;margin:0 0 14px}.play{margin-top:auto;font-size:10px;font-weight:950;color:var(--lime)}.why{display:grid;grid-template-columns:1fr 1fr;gap:10px}.why div{border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:15px}.why strong{display:block;font-size:12px;margin-bottom:5px}.why span{font-size:11px;line-height:1.65;color:#aeb5a5}.problem-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.problem-list a{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:13px 14px;background:#11150e}.problem-list strong{display:block;font-size:13px}.problem-list span{display:block;font-size:10px;color:#929b89;margin-top:4px}.footer{padding-top:24px;border-top:1px solid var(--line);font-size:10px;color:#7f8777}.footer a{color:#aeb5a5;margin-right:14px}@media(max-width:720px){.grid{grid-template-columns:1fr}.why,.problem-list{grid-template-columns:1fr}.card{min-height:0}.hero{padding-top:42px}}
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
  if (!cards.length) return null;
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

function hubHtml(definitions) {
  const canonical = `${canonicalBase}/problems/`;
  const description = '先延ばし、考えすぎ、嫌なことの反芻、人の目、スマホ、疲れ。今の悩みから、その場で使えるLEVEL UPの無料トレーニングを探せます。';
  const list = definitions.map((definition) => `<a href="/problems/${escapeHtml(definition.slug)}/"><strong>${escapeHtml(definition.title)}</strong><span>${escapeHtml(definition.kicker)}</span></a>`).join('');
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '悩みからLEVEL UPを探す',
    description,
    url: canonical,
  }).replaceAll('</', '<\\/');
  return `<!doctype html>
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
}

function writeLandingPages() {
  const generated = [];
  const problemsDir = path.join(outDir, 'problems');
  fs.mkdirSync(problemsDir, { recursive: true });

  for (const definition of landingDefinitions) {
    const html = landingHtml(definition);
    if (!html) continue;
    const dir = path.join(problemsDir, definition.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    generated.push(definition);
  }

  fs.writeFileSync(path.join(problemsDir, 'index.html'), hubHtml(generated));
  return generated;
}

function refreshDiscoveryFiles(generated) {
  const sitemapPath = path.join(outDir, 'sitemap.xml');
  const urls = new Set([`${canonicalBase}/`, `${canonicalBase}/problems/`]);

  if (fs.existsSync(sitemapPath)) {
    const current = fs.readFileSync(sitemapPath, 'utf8');
    for (const match of current.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const decoded = match[1].replaceAll('&amp;', '&');
      if (decoded.startsWith(canonicalBase)) urls.add(decoded);
    }
  }

  for (const definition of generated) urls.add(`${canonicalBase}/problems/${definition.slug}/`);
  for (const legalPath of ['privacy', 'terms', 'support']) {
    if (fs.existsSync(path.join(outDir, legalPath, 'index.html'))) urls.add(`${canonicalBase}/${legalPath}/`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(sitemapPath, xml);
  fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${canonicalBase}/sitemap.xml\n`);
}

function validate(generated) {
  if (generated.length < 6) throw new Error(`Expected 6 problem landing pages, generated ${generated.length}.`);
  const sitemap = fs.readFileSync(path.join(outDir, 'sitemap.xml'), 'utf8');
  const robots = fs.readFileSync(path.join(outDir, 'robots.txt'), 'utf8');
  for (const definition of generated) {
    const indexPath = path.join(outDir, 'problems', definition.slug, 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    for (const required of ['<meta name="description"', '<meta name="robots"', '<link rel="canonical"', 'application/ld+json']) {
      if (!html.includes(required)) throw new Error(`SEO landing missing ${required}: ${definition.slug}`);
    }
    if (!sitemap.includes(`${canonicalBase}/problems/${definition.slug}/`)) throw new Error(`Sitemap missing problem landing: ${definition.slug}`);
  }
  if (!robots.includes(`Sitemap: ${canonicalBase}/sitemap.xml`)) throw new Error('robots.txt is missing the LEVEL UP sitemap declaration.');
}

const updatedPages = updateExistingPages();
const generated = writeLandingPages();
refreshDiscoveryFiles(generated);
validate(generated);

console.log(`[Firebase] LEVEL UP SEO foundation strengthened: ${updatedPages} existing pages normalized + ${generated.length} problem search landings + sitemap/robots refreshed.`);
