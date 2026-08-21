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
  #hitobito-play-nav{position:fixed;z-index:2147483647;top:max(10px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));display:flex;align-items:flex-start;gap:8px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;color:#fff}
  #hitobito-play-nav-toggle{width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(17,17,17,.18);border-radius:14px;background:rgba(255,255,255,.9);color:#111;box-shadow:0 10px 30px rgba(0,0,0,.16);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #hitobito-play-nav-toggle svg{width:22px;height:22px;display:block}
  #hitobito-play-nav-toggle:hover,#hitobito-play-nav-toggle:focus-visible{background:#111;color:#fff;border-color:#111}
  #hitobito-play-nav-toggle:focus-visible{outline:3px solid rgba(255,95,87,.38);outline-offset:3px}
  #hitobito-play-nav-toggle:active{transform:scale(.94)}
  #hitobito-play-refresh{height:44px;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(17,17,17,.18);border-radius:14px;padding:0 13px;background:rgba(255,255,255,.9);color:#111;box-shadow:0 10px 30px rgba(0,0,0,.16);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);font:inherit;font-size:12px;font-weight:900;letter-spacing:.02em;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #hitobito-play-refresh:hover,#hitobito-play-refresh:focus-visible{background:#111;color:#fff;border-color:#111}
  #hitobito-play-refresh:focus-visible{outline:3px solid rgba(216,255,91,.32);outline-offset:3px}
  #hitobito-play-refresh:active{transform:scale(.96)}
  #hitobito-play-refresh:disabled{opacity:.7;cursor:wait;transform:none}
  #hitobito-play-refresh-icon{font-size:16px;line-height:1}
  #hitobito-play-nav-menu{position:absolute;top:52px;left:0;width:min(270px,calc(100vw - 18px));padding:8px;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:rgba(14,15,17,.96);box-shadow:0 20px 60px rgba(0,0,0,.34);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);opacity:0;transform:translateY(-5px) scale(.98);pointer-events:none;transition:.14s ease;transform-origin:top left}
  #hitobito-play-nav.open #hitobito-play-nav-menu{opacity:1;transform:none;pointer-events:auto}
  .hitobito-play-nav-item{min-height:48px;display:flex;align-items:center;gap:11px;padding:0 12px;border-radius:12px;color:#f7f7f4;text-decoration:none;font-size:13px;font-weight:850;letter-spacing:0}
  .hitobito-play-nav-item:hover,.hitobito-play-nav-item:focus-visible{background:rgba(255,255,255,.09);color:#fff;outline:none}
  .hitobito-play-nav-item.current{color:#ffbd2e}
  .hitobito-play-nav-icon{width:22px;text-align:center;font-size:16px;line-height:1}
  .hitobito-play-nav-sep{height:1px;margin:5px 8px;background:rgba(255,255,255,.09)}
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
console.log('Injected Play hamburger navigation and refresh button into Cloudflare index.');
