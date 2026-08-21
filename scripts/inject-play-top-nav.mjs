import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const target = path.resolve('.dist/cloudflare/index.html');
if (!fs.existsSync(target)) throw new Error(`Play index not found: ${target}`);

let html = fs.readFileSync(target, 'utf8');

function gitTimestamp(args) {
  try {
    const value = execFileSync('git', args, { cwd: path.resolve('.'), encoding: 'utf8' }).trim();
    return Number(value) || 0;
  } catch {
    return 0;
  }
}

function firstAddedAt(slug) {
  try {
    const values = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--format=%ct', '--reverse', '--', `apps/${slug}`],
      { cwd: path.resolve('.'), encoding: 'utf8' },
    ).trim().split(/\s+/).filter(Boolean);
    return Number(values[0]) || gitTimestamp(['log', '-1', '--format=%ct', '--', `apps/${slug}`]);
  } catch {
    return gitTimestamp(['log', '-1', '--format=%ct', '--', `apps/${slug}`]);
  }
}

function cleanTitleMarkup(card) {
  return card.replace(/(<h3>)([\s\S]*?)(<\/h3>)/i, (_match, open, title, close) => {
    const cleaned = title.replace(/\s*(?:\||｜|—|–|-)\s*hitobito\s+PLAY\s*$/i, '').trim();
    return `${open}${cleaned}${close}`;
  });
}

function sortGameCardsNewestFirst(markup) {
  const startTag = '<div class="games-grid" id="games">';
  const startTagAt = markup.indexOf(startTag);
  if (startTagAt < 0) return { html: markup, count: 0 };

  const contentStart = startTagAt + startTag.length;
  const sectionEnd = markup.indexOf('\n    </section>', contentStart);
  if (sectionEnd < 0) return { html: markup, count: 0 };

  const gridEnd = markup.lastIndexOf('</div>', sectionEnd);
  if (gridEnd < contentStart) return { html: markup, count: 0 };

  const inner = markup.slice(contentStart, gridEnd);
  const cards = inner.match(/\s*<a class="game-card"[\s\S]*?<\/a>/g) || [];
  if (!cards.length) return { html: markup, count: 0 };

  const entries = cards.map((raw, originalIndex) => {
    const href = raw.match(/href="\/apps\/([^/\"]+)\/"/i)?.[1] || '';
    let slug = href;
    try { slug = decodeURIComponent(href); } catch {}
    return {
      raw,
      slug,
      originalIndex,
      addedAt: slug ? firstAddedAt(slug) : 0,
    };
  });

  const chronological = [...entries].sort((a, b) =>
    a.addedAt - b.addedAt || a.slug.localeCompare(b.slug, 'ja') || a.originalIndex - b.originalIndex,
  );
  const serialBySlug = new Map(chronological.map((entry, index) => [entry.slug, index + 1]));

  entries.sort((a, b) =>
    b.addedAt - a.addedAt || b.originalIndex - a.originalIndex || a.slug.localeCompare(b.slug, 'ja'),
  );

  const rebuilt = entries.map((entry, index) => {
    const serial = String(serialBySlug.get(entry.slug) || (entries.length - index)).padStart(2, '0');
    let card = cleanTitleMarkup(entry.raw.trim());
    card = card.replace(/<a class="game-card"\s*/i, `<a class="game-card" data-added-at="${entry.addedAt}"${index < 3 ? ' data-newest="true"' : ''} `);
    card = card.replace(/(<span class="cover-number">)HITO\s*\/\s*\d+(<\/span>)/i, `$1HITO / ${serial}$2`);
    return `\n        ${card}`;
  }).join('');

  let next = `${markup.slice(0, contentStart)}${rebuilt}\n      ${markup.slice(gridEnd)}`;
  next = next.replace(
    /<div class="section-title"><h2>All Games<\/h2><span>[^<]*<\/span><\/div>/,
    `<div class="section-title"><h2>All Games</h2><span>${entries.length} games · 新着順</span></div>`,
  );
  return { html: next, count: entries.length };
}

const sorted = sortGameCardsNewestFirst(html);
html = sorted.html;

if (html.includes('id="hitobito-play-nav"')) {
  fs.writeFileSync(target, html);
  console.log(`Play homepage already has navigation; newest-first order refreshed for ${sorted.count} games.`);
  process.exit(0);
}

const nav = String.raw`
<style id="hitobito-play-nav-style">
  /* Keep the generated PLAY homepage color system intact. This layer only fixes readability and navigation. */
  #games .game-card{color:#111!important;background:#fff!important;border-color:rgba(17,17,17,.13)!important}
  #games .card-body{background:#fff!important}
  #games .card-meta{color:#555650!important}
  #games .go{color:#111!important}
  #games .game-card h3{color:#111!important;font-weight:900!important}
  #games .game-card p{color:#555650!important}
  #games .cover-number{font-size:9px!important;text-shadow:0 1px 10px rgba(0,0,0,.2)}
  #games .game-card[data-newest="true"] .cover-number:after{content:'NEW';display:inline-block;margin-left:8px;padding:3px 6px;border-radius:999px;background:#f3c969;color:#17130d;font-size:8px;letter-spacing:.08em;text-shadow:none;vertical-align:1px}
  #hitobito-play-nav{position:fixed;z-index:2147483647;top:max(10px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));display:flex;align-items:flex-start;gap:8px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;color:#fff}
  #hitobito-play-nav-toggle{width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(18,22,28,.18);border-radius:14px;background:rgba(244,239,230,.96);color:#15181d;box-shadow:0 10px 30px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #hitobito-play-nav-toggle svg{width:22px;height:22px;display:block}
  #hitobito-play-nav-toggle:hover,#hitobito-play-nav-toggle:focus-visible{background:#111;color:#fff;border-color:#111}
  #hitobito-play-nav-toggle:focus-visible{outline:3px solid rgba(243,201,105,.38);outline-offset:3px}
  #hitobito-play-nav-toggle:active{transform:scale(.94)}
  #hitobito-play-refresh{height:44px;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(17,17,17,.14);border-radius:14px;padding:0 13px;background:#f3c969;color:#18140d;box-shadow:0 10px 30px rgba(0,0,0,.16);font:inherit;font-size:12px;font-weight:900;letter-spacing:.02em;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #hitobito-play-refresh:hover,#hitobito-play-refresh:focus-visible{background:#111;color:#fff;border-color:#111}
  #hitobito-play-refresh:focus-visible{outline:3px solid rgba(243,201,105,.38);outline-offset:3px}
  #hitobito-play-refresh:active{transform:scale(.96)}
  #hitobito-play-refresh:disabled{opacity:.7;cursor:wait;transform:none}
  #hitobito-play-refresh-icon{font-size:16px;line-height:1}
  #hitobito-play-nav-menu{position:absolute;top:52px;left:0;width:min(270px,calc(100vw - 18px));padding:8px;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:rgba(13,17,23,.97);box-shadow:0 20px 60px rgba(0,0,0,.38);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);opacity:0;transform:translateY(-5px) scale(.98);pointer-events:none;transition:.14s ease;transform-origin:top left}
  #hitobito-play-nav.open #hitobito-play-nav-menu{opacity:1;transform:none;pointer-events:auto}
  .hitobito-play-nav-item{min-height:48px;display:flex;align-items:center;gap:11px;padding:0 12px;border-radius:12px;color:#ece8e1;text-decoration:none;font-size:13px;font-weight:850;letter-spacing:0}
  .hitobito-play-nav-item:hover,.hitobito-play-nav-item:focus-visible{background:rgba(243,201,105,.09);color:#fff;outline:none}
  .hitobito-play-nav-item.current{color:#f3c969}
  .hitobito-play-nav-icon{width:22px;text-align:center;font-size:16px;line-height:1}
  .hitobito-play-nav-sep{height:1px;margin:5px 8px;background:rgba(205,214,223,.09)}
  @media(max-width:720px){
    #hitobito-play-nav{top:max(8px,env(safe-area-inset-top));left:max(7px,env(safe-area-inset-left));gap:7px}
    #hitobito-play-nav-toggle{width:42px;height:42px}
    #hitobito-play-refresh{height:42px;padding:0 11px;font-size:11px}
    .shell{padding-top:64px!important}
    #games .card-body{padding:15px 16px 17px!important}
    #games .card-meta{font-size:10px!important;margin-bottom:10px!important}
    #games .game-card h3{font-size:20px!important;line-height:1.16!important;margin-bottom:8px!important}
    #games .game-card p{font-size:13px!important;line-height:1.55!important;min-height:0!important}
    #games .cover-number{font-size:10px!important}
  }
  @media(max-width:430px){
    #games .cover{aspect-ratio:1.95/1!important}
    #games .game-card h3{font-size:22px!important;letter-spacing:-.035em!important}
    #games .game-card p{font-size:14px!important}
  }
  @media(prefers-reduced-motion:reduce){#hitobito-play-nav-menu{transition:none}}
</style>
<div id="hitobito-play-nav">
  <button id="hitobito-play-nav-toggle" type="button" aria-label="PLAYメニューを開く" aria-expanded="false" aria-controls="hitobito-play-nav-menu">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6.5h16M4 12h16M4 17.5h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
  </button>
  <button id="hitobito-play-refresh" type="button" aria-label="PLAYトップを最新状態に更新"><span id="hitobito-play-refresh-icon" aria-hidden="true">↻</span><span id="hitobito-play-refresh-label">更新</span></button>
  <nav id="hitobito-play-nav-menu" aria-label="hitobito PLAYメニュー">
    <a class="hitobito-play-nav-item current" href="https://play.hitobito.jp/"><span class="hitobito-play-nav-icon">▶</span><span>PLAY ホーム</span></a>
    <a class="hitobito-play-nav-item" href="https://levelup.hitobito.jp/"><span class="hitobito-play-nav-icon">↗</span><span>LEVEL UP</span></a>
    <a class="hitobito-play-nav-item" href="https://tools.hitobito.jp/"><span class="hitobito-play-nav-icon">◇</span><span>TOOLS</span></a>
    <div class="hitobito-play-nav-sep"></div>
    <a class="hitobito-play-nav-item" href="https://hitobito.jp/"><span class="hitobito-play-nav-icon">⌂</span><span>hitobito ホーム</span></a>
  </nav>
</div>
<script id="hitobito-play-nav-script">
(() => {
  const host = document.getElementById('hitobito-play-nav');
  const toggle = document.getElementById('hitobito-play-nav-toggle');
  const refresh = document.getElementById('hitobito-play-refresh');
  const refreshLabel = document.getElementById('hitobito-play-refresh-label');
  if (!host || !toggle) return;
  const close = () => { host.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
  const open = () => { host.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
  toggle.addEventListener('click', () => host.classList.contains('open') ? close() : open());
  refresh?.addEventListener('click', () => {
    close();
    refresh.disabled = true;
    refresh.setAttribute('aria-busy', 'true');
    if (refreshLabel) refreshLabel.textContent = '更新中…';
    const url = new URL('/', window.location.origin);
    url.searchParams.set('_refresh', Date.now().toString());
    url.hash = 'games';
    window.location.replace(url.toString());
  });
  document.addEventListener('click', (event) => { if (!host.contains(event.target)) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
})();
</script>`;

if (!html.includes('</body>')) throw new Error('Play index has no closing body tag.');
html = html.replace('</body>', `${nav}\n</body>`);
fs.writeFileSync(target, html);
console.log(`Injected Play navigation/readability fixes and sorted ${sorted.count} games newest-first.`);
