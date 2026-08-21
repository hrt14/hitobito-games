import fs from 'node:fs';
import path from 'node:path';

const cloudflareRoot = path.resolve('.dist/cloudflare');
const homePath = path.join(cloudflareRoot, 'index.html');
const appsRoot = path.join(cloudflareRoot, 'apps');

if (!fs.existsSync(homePath)) throw new Error(`PLAY homepage not found: ${homePath}`);

function removePickupSection(markup) {
  const needle = '<section class="section">\n      <div class="section-head"><div class="section-title"><h2>Pick Up</h2>';
  const start = markup.indexOf(needle);
  if (start < 0) return { html: markup, removed: false };
  const endTag = '</section>';
  const end = markup.indexOf(endTag, start);
  if (end < 0) throw new Error('PLAY Pick Up section starts but has no closing section tag.');
  const after = end + endTag.length;
  return {
    html: `${markup.slice(0, start)}${markup.slice(after)}`.replace(/\n{3,}/g, '\n\n'),
    removed: true,
  };
}

const appNav = String.raw`
<style id="hitobito-play-app-nav-style">
  #hitobito-play-app-nav{position:fixed;z-index:2147483647;top:max(10px,env(safe-area-inset-top));left:max(10px,env(safe-area-inset-left));font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;color:#fff;line-height:1.2}
  #hitobito-play-app-nav *{box-sizing:border-box}
  #hitobito-play-app-nav-toggle{width:48px;height:48px;display:grid;place-items:center;padding:0;border:1px solid rgba(17,17,17,.18);border-radius:15px;background:rgba(248,245,236,.96);color:#111;box-shadow:0 10px 32px rgba(0,0,0,.22);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #hitobito-play-app-nav-toggle svg{width:24px;height:24px;display:block}
  #hitobito-play-app-nav-toggle:active{transform:scale(.94)}
  #hitobito-play-app-nav-toggle:focus-visible{outline:3px solid rgba(243,201,105,.55);outline-offset:3px}
  #hitobito-play-app-nav-menu{position:absolute;top:56px;left:0;width:min(250px,calc(100vw - 20px));padding:8px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(12,15,20,.97);box-shadow:0 20px 60px rgba(0,0,0,.4);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);opacity:0;transform:translateY(-5px) scale(.98);pointer-events:none;transition:.14s ease;transform-origin:top left}
  #hitobito-play-app-nav.open #hitobito-play-app-nav-menu{opacity:1;transform:none;pointer-events:auto}
  .hitobito-play-app-nav-item{min-height:50px;display:flex!important;align-items:center!important;gap:11px!important;padding:0 12px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#f4f1ea!important;text-decoration:none!important;font-size:14px!important;font-weight:850!important;letter-spacing:0!important;text-transform:none!important;box-shadow:none!important;transform:none!important}
  .hitobito-play-app-nav-item:hover,.hitobito-play-app-nav-item:focus-visible{background:rgba(243,201,105,.1)!important;color:#fff!important;outline:none!important}
  .hitobito-play-app-nav-item.primary{color:#f3c969!important}
  .hitobito-play-app-nav-icon{width:22px;text-align:center;font-size:17px;line-height:1}
  .hitobito-play-app-nav-sep{height:1px;margin:5px 8px;background:rgba(255,255,255,.1)}
  @media(max-width:720px){#hitobito-play-app-nav{top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left))}#hitobito-play-app-nav-toggle{width:46px;height:46px}}
  @media(prefers-reduced-motion:reduce){#hitobito-play-app-nav-menu{transition:none}}
</style>
<div id="hitobito-play-app-nav">
  <button id="hitobito-play-app-nav-toggle" type="button" aria-label="PLAYメニューを開く" aria-expanded="false" aria-controls="hitobito-play-app-nav-menu">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6.5h16M4 12h16M4 17.5h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
  </button>
  <nav id="hitobito-play-app-nav-menu" aria-label="PLAYアプリメニュー">
    <a class="hitobito-play-app-nav-item primary" href="https://play.hitobito.jp/"><span class="hitobito-play-app-nav-icon">←</span><span>PLAYトップへ戻る</span></a>
    <a class="hitobito-play-app-nav-item" href="https://play.hitobito.jp/#games"><span class="hitobito-play-app-nav-icon">▦</span><span>ゲーム一覧</span></a>
    <div class="hitobito-play-app-nav-sep"></div>
    <a class="hitobito-play-app-nav-item" href="https://levelup.hitobito.jp/"><span class="hitobito-play-app-nav-icon">↗</span><span>LEVEL UP</span></a>
    <a class="hitobito-play-app-nav-item" href="https://hitobito.jp/"><span class="hitobito-play-app-nav-icon">⌂</span><span>hitobito ホーム</span></a>
  </nav>
</div>
<script id="hitobito-play-app-nav-script">
(() => {
  const host = document.getElementById('hitobito-play-app-nav');
  const toggle = document.getElementById('hitobito-play-app-nav-toggle');
  if (!host || !toggle) return;
  const close = () => { host.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const opening = !host.classList.contains('open');
    host.classList.toggle('open', opening);
    toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
  });
  host.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', close);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
})();
</script>`;

function injectAppNav(indexPath) {
  let markup = fs.readFileSync(indexPath, 'utf8');
  if (markup.includes('id="hitobito-play-app-nav"')) return false;
  const bodyMatch = markup.match(/<body(?:\s[^>]*)?>/i);
  if (!bodyMatch || bodyMatch.index == null) throw new Error(`No body tag for PLAY app: ${indexPath}`);
  const insertAt = bodyMatch.index + bodyMatch[0].length;
  markup = `${markup.slice(0, insertAt)}\n${appNav}\n${markup.slice(insertAt)}`;
  fs.writeFileSync(indexPath, markup);
  return true;
}

const home = removePickupSection(fs.readFileSync(homePath, 'utf8'));
fs.writeFileSync(homePath, home.html);

if (!fs.existsSync(appsRoot)) throw new Error(`PLAY apps directory not found: ${appsRoot}`);
const appDirs = fs.readdirSync(appsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
let injected = 0;
let eligible = 0;
for (const entry of appDirs) {
  const indexPath = path.join(appsRoot, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  eligible += 1;
  if (injectAppNav(indexPath)) injected += 1;
}

if (!eligible) throw new Error('No Cloudflare PLAY apps found for navigation injection.');

console.log(`[PLAY] Pick Up removed: ${home.removed ? 'yes' : 'already absent'}`);
console.log(`[PLAY] App hamburger return menu present on ${eligible} apps (${injected} newly injected).`);
