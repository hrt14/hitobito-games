import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve('.dist/cloudflare/index.html');
if (!fs.existsSync(target)) throw new Error(`Play index not found: ${target}`);

let html = fs.readFileSync(target, 'utf8');
if (html.includes('id="hitobito-play-nav"')) {
  console.log('Play hamburger navigation already injected.');
  process.exit(0);
}

const nav = String.raw`
<style id="hitobito-play-nav-style">
  :root{--bg:#0b0e13!important;--panel:#11151c!important;--panel2:#171c24!important;--text:#f4efe6!important;--muted:#98a1ad!important;--soft:#c9cdd2!important;--line:rgba(205,214,223,.12)!important;--lime:#f3c969!important}
  html,body{background:#0b0e13!important;color:#f4efe6!important}
  body{background:radial-gradient(circle at 14% -10%,rgba(84,111,145,.13),transparent 34%),radial-gradient(circle at 92% 8%,rgba(226,173,91,.08),transparent 27%),#0b0e13!important}
  body:before{background-image:linear-gradient(rgba(183,197,211,.014) 1px,transparent 1px),linear-gradient(90deg,rgba(183,197,211,.014) 1px,transparent 1px)!important}
  .brand{color:#f7f2e9}
  .pill{color:#aab3bf!important;border-color:rgba(205,214,223,.12)!important;background:rgba(255,255,255,.022)!important}
  .pill.tools{color:#f3c969!important;border-color:rgba(243,201,105,.24)!important;background:rgba(243,201,105,.055)!important}
  .eyebrow{color:#f3c969!important}.eyebrow i{background:#f3c969!important;box-shadow:0 0 18px rgba(243,201,105,.45)!important}
  h1{color:#f7f2e9}.hero-copy{color:#b6bfca!important}.hero-side{color:#7f8997!important}.hero-side strong{color:#d9dde3!important}
  .section-head h2{color:#e9e4dc}.section-head span{color:#818b99!important}
  .card{border-color:rgba(205,214,223,.105)!important}.card:hover{border-color:rgba(243,201,105,.28)!important;box-shadow:0 22px 54px rgba(0,0,0,.3)!important}
  .tag{color:#d8dce2!important}.tag.new{color:#1b1710!important;background:#f3c969!important;box-shadow:0 0 0 1px rgba(255,239,190,.18)}
  .arrow{color:#d9dee5!important}.icon{border-color:rgba(205,214,223,.12)!important;background:rgba(255,255,255,.045)!important}.meta{color:#8c97a5!important}.card h3{color:#f1ede5}.card p{color:#abb5c1!important}
  .feature{border-color:rgba(205,214,223,.105)!important}.feature:hover{border-color:rgba(243,201,105,.24)!important}
  .feature:not(.wp){--accent:#b79ee8!important;--accent2:rgba(137,107,198,.2)!important;background:linear-gradient(145deg,#181621 0%,#0c0f14 68%)!important}
  .feature.wp{--accent:#e5a06f!important;--accent2:rgba(216,139,85,.18)!important;background:linear-gradient(145deg,#1d1713 0%,#0c0f13 68%)!important}
  .pick{color:#d9dde3!important}.play{background:#f1ece3!important;color:#14171b!important}.feature h3{color:#f4efe6}.feature h3 small{color:#a8b1bd!important}.feature p{color:#b4bdc8!important}
  .levelup-card{border-color:rgba(243,201,105,.24)!important;background:linear-gradient(135deg,#1c1912 0%,#0d1014 58%,#12151a 100%)!important}.levelup-card:before{background:radial-gradient(circle,rgba(243,201,105,.16),transparent 68%)!important}.levelup-card:hover{border-color:rgba(243,201,105,.4)!important}.levelup-kicker{color:#f3c969!important}.levelup-title{color:#f4efe6}.levelup-copy{color:#b5bdc8!important}.levelup-go{background:#f3c969!important;color:#19150e!important;box-shadow:0 12px 40px rgba(243,201,105,.14)!important}
  .footer{color:#7e8895!important;border-color:rgba(205,214,223,.1)!important}.footer strong{color:#b8c0ca!important}
  #hitobito-play-nav{position:fixed;z-index:2147483647;top:max(10px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));display:flex;align-items:flex-start;gap:8px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;color:#fff}
  #hitobito-play-nav-toggle{width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(18,22,28,.2);border-radius:14px;background:rgba(244,239,230,.94);color:#15181d;box-shadow:0 10px 30px rgba(0,0,0,.2);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #hitobito-play-nav-toggle svg{width:22px;height:22px;display:block}
  #hitobito-play-nav-toggle:hover,#hitobito-play-nav-toggle:focus-visible{background:#f3c969;color:#18140d;border-color:#f3c969}
  #hitobito-play-nav-toggle:focus-visible{outline:3px solid rgba(243,201,105,.32);outline-offset:3px}
  #hitobito-play-nav-toggle:active{transform:scale(.94)}
  #hitobito-play-refresh{height:44px;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(243,201,105,.3);border-radius:14px;padding:0 13px;background:rgba(243,201,105,.94);color:#18140d;box-shadow:0 10px 30px rgba(0,0,0,.2);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);font:inherit;font-size:12px;font-weight:900;letter-spacing:.02em;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #hitobito-play-refresh:hover,#hitobito-play-refresh:focus-visible{background:#ffe29d;color:#15120c;border-color:#ffe29d}
  #hitobito-play-refresh:focus-visible{outline:3px solid rgba(243,201,105,.32);outline-offset:3px}
  #hitobito-play-refresh:active{transform:scale(.96)}
  #hitobito-play-refresh:disabled{opacity:.7;cursor:wait;transform:none}
  #hitobito-play-refresh-icon{font-size:16px;line-height:1}
  #hitobito-play-nav-menu{position:absolute;top:52px;left:0;width:min(270px,calc(100vw - 18px));padding:8px;border:1px solid rgba(205,214,223,.13);border-radius:18px;background:rgba(13,17,23,.97);box-shadow:0 20px 60px rgba(0,0,0,.38);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);opacity:0;transform:translateY(-5px) scale(.98);pointer-events:none;transition:.14s ease;transform-origin:top left}
  #hitobito-play-nav.open #hitobito-play-nav-menu{opacity:1;transform:none;pointer-events:auto}
  .hitobito-play-nav-item{min-height:48px;display:flex;align-items:center;gap:11px;padding:0 12px;border-radius:12px;color:#ece8e1;text-decoration:none;font-size:13px;font-weight:850;letter-spacing:0}
  .hitobito-play-nav-item:hover,.hitobito-play-nav-item:focus-visible{background:rgba(243,201,105,.09);color:#fff;outline:none}
  .hitobito-play-nav-item.current{color:#f3c969}
  .hitobito-play-nav-icon{width:22px;text-align:center;font-size:16px;line-height:1}
  .hitobito-play-nav-sep{height:1px;margin:5px 8px;background:rgba(205,214,223,.09)}
  @media(max-width:720px){#hitobito-play-nav{top:max(8px,env(safe-area-inset-top));left:max(7px,env(safe-area-inset-left));gap:7px}#hitobito-play-nav-toggle{width:42px;height:42px}#hitobito-play-refresh{height:42px;padding:0 11px;font-size:11px}}
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
    url.hash = 'latest-games';
    window.location.replace(url.toString());
  });
  document.addEventListener('click', (event) => { if (!host.contains(event.target)) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
})();
</script>`;

if (!html.includes('</body>')) throw new Error('Play index has no closing body tag.');
html = html.replace('</body>', `${nav}\n</body>`);
fs.writeFileSync(target, html);
console.log('Injected Play color theme, navigation, and refresh button into Cloudflare index.');
