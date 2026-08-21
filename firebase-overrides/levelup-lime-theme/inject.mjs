import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const HOME_MARKER = 'id="levelup-lime-theme-v1"';
const APP_MARKER = 'id="levelup-lime-app-theme-bootstrap-v1"';

if (!fs.existsSync(homePath) || !fs.existsSync(appsDir)) {
  throw new Error('LEVEL UP Firebase bundle missing. Run this near the end of build:firebase.');
}

const homeTheme = `
<style id="levelup-lime-theme-v1">
  :root{
    color-scheme:light!important;
    --lu-paper:#f3f1e8;
    --lu-surface:#fffef8;
    --lu-ink:#11110f;
    --lu-muted:#66645d;
    --lu-line:#cbc8bd;
    --lu-lime:#dfff4f;
    --lu-lime-soft:#efffa8;
  }
  html,body{background:var(--lu-paper)!important;color:var(--lu-ink)!important}
  body:before{display:none!important}
  .top{border-color:var(--lu-line)!important;background:transparent!important}
  .brand{color:var(--lu-ink)!important}
  .top a,#levelup-account-chip{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:none!important}
  #levelup-nav-toggle{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:0 7px 18px rgba(20,20,15,.06)!important}
  #levelup-nav-toggle svg{color:var(--lu-ink)!important;stroke:var(--lu-ink)!important}

  .lu-home-eyebrow{color:var(--lu-ink)!important}
  .lu-home-hero h1,.lu-home-hero h1 span{color:var(--lu-ink)!important}
  .lu-home-hero h1 span{
    display:inline;
    padding:0 .035em;
    background:linear-gradient(transparent 55%,var(--lu-lime) 55%,var(--lu-lime) 91%,transparent 91%)!important;
    box-decoration-break:clone;
    -webkit-box-decoration-break:clone;
  }
  .lu-home-hero .hero-copy{color:#55534d!important}
  .lu-home-stats strong{color:var(--lu-ink)!important}
  .lu-home-stats span,.lu-home-note{color:var(--lu-muted)!important}

  body .lu-v3{color:var(--lu-ink)!important;background:transparent!important}
  body .lu-v3 h2,body .lu-v3-kicker,body .lu-v3-lead{color:var(--lu-ink)!important}
  body .lu-v3-lead{color:var(--lu-muted)!important}
  body .lu-v3-problem,
  body .lu-v3-problem:nth-child(3n+2),
  body .lu-v3-problem:nth-child(3n),
  body .lu-v3-problem[style]{
    --lu-problem-color:var(--lu-surface)!important;
    background:var(--lu-surface)!important;
    color:var(--lu-ink)!important;
    border:1px solid var(--lu-line)!important;
    box-shadow:inset 7px 0 0 var(--lu-lime)!important;
  }
  body .lu-v3-problem b{color:var(--lu-ink)!important}
  body .lu-v3-problem:hover{background:#fbfbe8!important;border-color:var(--lu-ink)!important;box-shadow:inset 7px 0 0 var(--lu-lime)!important}

  body .levelup-search{background:rgba(255,254,248,.64)!important;border-color:var(--lu-line)!important}
  body .levelup-search h2,body .levelup-search-icon{color:var(--lu-ink)!important}
  body .levelup-search-box{background:var(--lu-surface)!important;border-color:var(--lu-line)!important}
  body #levelup-search-input{color:var(--lu-ink)!important}
  body #levelup-search-input::placeholder,body .levelup-search-status{color:#8b8981!important}

  body .section-head h2,body .section-head strong,body .catalog-divider strong{color:var(--lu-ink)!important}
  body .section-head span,body .catalog-divider span{color:var(--lu-muted)!important}
  body .catalog-divider{border-color:var(--lu-line)!important}
  body .catalog-divider[data-kind="favorite"] strong,
  body .catalog-divider[data-kind="new"] strong,
  body .catalog-divider[data-kind="popular"] strong,
  body .catalog-divider[data-category] strong{
    color:var(--lu-ink)!important;
    background:linear-gradient(transparent 56%,var(--lu-lime) 56%,var(--lu-lime) 92%,transparent 92%)!important;
  }

  body .premium-book-card,
  body .premium-book-card.title-long,
  body .premium-book-card.title-xlong,
  body .levelup-category-card[data-category],
  body .premium-theme-1,body .premium-theme-2,body .premium-theme-3,body .premium-theme-4,
  body .premium-theme-5,body .premium-theme-6,body .premium-theme-7,body .premium-theme-8{
    --lu-card-bg:var(--lu-surface)!important;
    background:var(--lu-surface)!important;
    border:1px solid var(--lu-line)!important;
    box-shadow:none!important;
  }
  body .premium-book-card:before{
    display:block!important;
    content:""!important;
    position:absolute!important;
    left:0!important;right:0!important;top:0!important;
    width:auto!important;height:8px!important;
    background:var(--lu-lime)!important;
    opacity:1!important;
  }
  body .premium-book-card:after{display:none!important}
  body .premium-book-card:hover{border-color:var(--lu-ink)!important;box-shadow:0 15px 32px rgba(25,24,18,.08)!important}
  body .premium-book-card h2,
  body .premium-book-card.title-long h2,
  body .premium-book-card.title-xlong h2{color:var(--lu-ink)!important;text-shadow:none!important}
  body .premium-book-card .book-obi{color:#5c5a54!important;background:transparent!important;border-color:transparent!important}
  body .premium-book-card .favorite{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:none!important}
  body .premium-book-card .favorite.is-on,
  body .premium-book-card .favorite[aria-pressed="true"]{background:var(--lu-lime)!important;color:var(--lu-ink)!important;border-color:var(--lu-ink)!important}

  body .lu-v3-sheet{background:rgba(18,18,15,.32)!important}
  body .lu-v3-panel,body .lu-v3-result{background:var(--lu-paper)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important}
  body .lu-v3-top strong,body .lu-v3-question,body .lu-v3-result h3{color:var(--lu-ink)!important}
  body .lu-v3-close,body .lu-v3-option,body .lu-v3-secondary{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important}
  body .lu-v3-option small,body .lu-v3-result p{color:var(--lu-muted)!important}
  body .lu-v3-option.is-on{background:var(--lu-lime)!important;color:var(--lu-ink)!important;border-color:var(--lu-ink)!important}
  body .lu-v3-option.is-on small{color:#3e431f!important}
  body .lu-v3-primary{background:var(--lu-lime)!important;color:var(--lu-ink)!important;border:1px solid var(--lu-ink)!important}
  body .lu-v3-result a{background:var(--lu-ink)!important;color:var(--lu-surface)!important}
  body .lu-v3-result.is-priority{border-color:var(--lu-ink)!important;box-shadow:inset 6px 0 0 var(--lu-lime)!important}
  body .lu-v3-role{color:var(--lu-ink)!important}
  body .lu-v3-priority{background:var(--lu-lime)!important;color:var(--lu-ink)!important}
  body .lu-v3-result-intro{background:#e9e6dc!important;color:var(--lu-muted)!important}

  #levelup-refresh{background:var(--lu-lime)!important;color:var(--lu-ink)!important;border:1px solid var(--lu-ink)!important;box-shadow:0 10px 26px rgba(20,20,15,.14)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  #levelup-account-chip:hover{background:var(--lu-lime-soft)!important;border-color:var(--lu-ink)!important}
  #levelup-account-chip .account-avatar{background:#e7e4da!important}
  #levelup-account-chip .account-avatar-fallback{background:var(--lu-lime)!important;color:var(--lu-ink)!important}
  #levelup-account-chip.is-signed-in{border-color:var(--lu-line)!important}

  .footer{border-color:var(--lu-line)!important;color:var(--lu-muted)!important}.footer strong{color:var(--lu-ink)!important}

  @media(max-width:650px){
    body .lu-v3-problem,body .lu-v3-problem[style]{box-shadow:inset 6px 0 0 var(--lu-lime)!important}
    body .premium-book-card:before{height:7px!important}
  }
</style>`;

let home = fs.readFileSync(homePath, 'utf8');
if (!home.includes(HOME_MARKER)) {
  home = home.includes('</head>') ? home.replace('</head>', `${homeTheme}\n</head>`) : `${homeTheme}\n${home}`;
  fs.writeFileSync(homePath, home);
}

function appMenuThemeBootstrap() {
  'use strict';
  const THEME_ID = 'levelup-lime-app-menu-theme-v1';
  let attempts = 0;

  function apply() {
    attempts += 1;
    const host = document.getElementById('levelup-app-menu-root');
    const shadow = host?.shadowRoot;
    if (!shadow) {
      if (attempts < 120) setTimeout(apply, 50);
      return;
    }
    if (shadow.getElementById(THEME_ID)) return;
    const style = document.createElement('style');
    style.id = THEME_ID;
    style.textContent = `
      :host{color-scheme:light!important;--lu-lime:#dfff4f!important;--lu-bg:#f3f1e8!important;--lu-text:#11110f!important;--lu-muted:#66645d!important;--lu-line:#cbc8bd!important}
      .menu-trigger{background:rgba(255,254,248,.97)!important;color:#11110f!important;border-color:#cbc8bd!important;box-shadow:0 8px 24px rgba(20,20,15,.1)!important}
      .hamburger span{background:#11110f!important}
      .backdrop{background:rgba(17,17,15,.34)!important}
      .sheet{background:#f3f1e8!important;color:#11110f!important;border-color:#cbc8bd!important;box-shadow:0 28px 80px rgba(20,20,15,.18)!important}
      .kicker{display:inline-block!important;color:#11110f!important;background:linear-gradient(transparent 54%,#dfff4f 54%,#dfff4f 91%,transparent 91%)!important}
      .title{color:#11110f!important}
      .close{background:#fffef8!important;color:#11110f!important;border-color:#cbc8bd!important}
      .action{background:#fffef8!important;color:#11110f!important;border-color:#cbc8bd!important}
      .action:hover{background:#efffa8!important;border-color:#11110f!important}
      .action-icon{background:#e9e6dc!important;color:#11110f!important}
      .favorite.is-on .action-icon{background:#dfff4f!important;color:#11110f!important}
      .action-copy strong{color:#11110f!important}.action-copy small,.status{color:#66645d!important}
      .status.ok{color:#343b13!important}.status.error{color:#4a342e!important}
    `;
    shadow.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
}

const appThemeScript = `\n<script id="levelup-lime-app-theme-bootstrap-v1">(${appMenuThemeBootstrap.toString()})();</script>\n`;
let appCount = 0;
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(APP_MARKER)) {
    html = html.includes('</body>') ? html.replace('</body>', `${appThemeScript}</body>`) : `${html}${appThemeScript}`;
    fs.writeFileSync(indexPath, html);
  }
  appCount += 1;
}

const finalHome = fs.readFileSync(homePath, 'utf8');
for (const token of [HOME_MARKER, '--lu-lime:#dfff4f', '#levelup-refresh', '.lu-v3-problem', '.premium-book-card']) {
  if (!finalHome.includes(token)) throw new Error(`LEVEL UP lime theme missing ${token}`);
}
if (!appCount) throw new Error('No LEVEL UP app pages found for lime menu theme.');
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(APP_MARKER)) throw new Error(`LEVEL UP lime app menu theme missing from ${entry.name}`);
}

console.log(`[Firebase] LEVEL UP cream / black / fluorescent-lime theme applied to home + ${appCount} app menus.`);
