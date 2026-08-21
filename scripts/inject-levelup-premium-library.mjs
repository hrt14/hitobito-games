import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for premium library pass.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const games = Array.isArray(catalog.games) ? catalog.games : [];
if (!games.length) throw new Error('LEVEL UP premium library: empty catalog.');

let html = fs.readFileSync(homePath, 'utf8');

const hashTheme = (slug) => {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return (hash % 8) + 1;
};

let themed = 0;
html = html.replace(/<article class="([^"]*\bcard\b[^"]*)"([^>]*\bdata-game="([^"]+)"[^>]*)>/g, (whole, classes, attrs, slug) => {
  const themeClass = `premium-theme-${hashTheme(slug)}`;
  const nextClasses = [...new Set(`${classes} premium-book-card ${themeClass}`.split(/\s+/).filter(Boolean))].join(' ');
  themed += 1;
  return `<article class="${nextClasses}"${attrs}>`;
});

const styleMarker = 'id="levelup-premium-library-style"';
if (!html.includes(styleMarker)) {
  const style = `
<style id="levelup-premium-library-style">
  :root{
    --premium-bg:#0a0c0a;
    --premium-panel:#11150f;
    --premium-text:#f6f4ec;
    --premium-muted:#989e90;
    --premium-lime:#d8ff5b;
    --premium-gold:#d8c58b;
  }

  html{background:var(--premium-bg)!important}
  body{
    background:
      radial-gradient(circle at 92% -8%,rgba(216,255,91,.08),transparent 30%),
      radial-gradient(circle at 8% 24%,rgba(216,197,139,.045),transparent 26%),
      linear-gradient(180deg,#0b0e0a 0%,#080a08 100%)!important;
    color:var(--premium-text)!important;
  }
  body:before{
    content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:.22;
    background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);
    background-size:28px 28px;
    mask-image:linear-gradient(to bottom,rgba(0,0,0,.5),transparent 68%);
  }

  .shell{width:min(1180px,calc(100% - 30px))!important;padding-bottom:110px!important}
  .top{
    position:relative!important;min-height:58px!important;padding:9px 0 13px!important;
    border-bottom:1px solid rgba(255,255,255,.07)!important;
    background:linear-gradient(180deg,rgba(10,12,10,.82),rgba(10,12,10,.52))!important;
    -webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
  }
  .brand{font-size:12px!important;letter-spacing:.16em!important;color:#f2f0e9!important}
  .levelup-top-actions{gap:7px!important}
  .top a,#levelup-account-chip{
    min-height:36px!important;border-color:rgba(255,255,255,.10)!important;background:rgba(255,255,255,.035)!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;
  }

  .hero{padding:30px 0 24px!important;gap:22px!important}
  .hero-kicker{color:var(--premium-gold)!important;letter-spacing:.22em!important;font-size:9px!important}
  .hero h1{
    font-size:clamp(54px,8vw,92px)!important;line-height:.83!important;letter-spacing:-.065em!important;
    text-shadow:0 16px 42px rgba(0,0,0,.30)!important;
  }
  .hero h1 span{color:var(--premium-lime)!important}
  .hero-copy{color:#aeb4a7!important;max-width:46ch!important}

  .levelup-search{
    margin:0 0 18px!important;padding:12px 14px!important;border:1px solid rgba(255,255,255,.085)!important;border-radius:18px!important;
    background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.024))!important;
    box-shadow:0 16px 40px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.035)!important;
  }
  .levelup-search-box,#levelup-search-input{
    background:#0d100c!important;border-color:rgba(255,255,255,.09)!important;border-radius:14px!important;
  }
  #levelup-search-input{color:#f7f7f2!important}

  .section-head{margin:17px 0 12px!important;border-bottom:0!important}
  .section-head strong{font-size:11px!important;letter-spacing:.16em!important;color:#cfcbbf!important}

  .grid{
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:18px!important;align-items:stretch!important;
  }
  .catalog-divider{
    grid-column:1/-1!important;min-height:42px!important;margin:10px 0 0!important;padding:0 2px 9px!important;
    border-bottom:1px solid rgba(255,255,255,.08)!important;
    background:none!important;
  }
  .catalog-divider strong{
    font-size:12px!important;letter-spacing:.10em!important;color:#e9e5dc!important;font-weight:850!important;
  }
  .catalog-divider span{
    font-size:10px!important;color:#777f71!important;padding:3px 8px!important;border:1px solid rgba(255,255,255,.07)!important;
    border-radius:999px!important;background:rgba(255,255,255,.025)!important;
  }
  .catalog-divider[data-kind="favorite"] strong,.catalog-divider[data-kind="new"] strong,.catalog-divider[data-kind="popular"] strong{color:var(--premium-lime)!important}

  .premium-book-card{
    --cover-1:#17241b;--cover-2:#0d1510;--cover-accent:#b7cf7e;
    position:relative!important;isolation:isolate!important;overflow:hidden!important;
    min-height:330px!important;border:1px solid color-mix(in srgb,var(--cover-accent) 34%,transparent)!important;border-radius:22px!important;
    background:
      radial-gradient(circle at 88% 2%,color-mix(in srgb,var(--cover-accent) 16%,transparent) 0 18%,transparent 19%),
      linear-gradient(145deg,var(--cover-1) 0%,var(--cover-2) 72%)!important;
    box-shadow:
      0 18px 36px rgba(0,0,0,.30),
      0 2px 0 rgba(255,255,255,.025) inset,
      6px 0 0 rgba(0,0,0,.15) inset,
      7px 0 0 color-mix(in srgb,var(--cover-accent) 15%,transparent) inset!important;
    transform:translateZ(0);
    transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease!important;
  }
  .premium-book-card:hover{
    transform:translateY(-3px)!important;
    border-color:color-mix(in srgb,var(--cover-accent) 52%,transparent)!important;
    box-shadow:0 24px 48px rgba(0,0,0,.38),0 2px 0 rgba(255,255,255,.035) inset,6px 0 0 rgba(0,0,0,.15) inset,7px 0 0 color-mix(in srgb,var(--cover-accent) 20%,transparent) inset!important;
  }
  .premium-book-card:after{
    content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.28;
    background:
      linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.018) 45% 45.7%,transparent 46% 100%),
      repeating-linear-gradient(0deg,rgba(255,255,255,.013) 0 1px,transparent 1px 4px);
    mix-blend-mode:screen;
  }
  .premium-book-card:before{
    content:""!important;position:absolute!important;width:170px!important;height:170px!important;right:-64px!important;top:-64px!important;
    border-radius:50%!important;border:1px solid color-mix(in srgb,var(--cover-accent) 16%,transparent)!important;
    background:radial-gradient(circle,color-mix(in srgb,var(--cover-accent) 14%,transparent),transparent 68%)!important;
    box-shadow:none!important;opacity:.95!important;
  }

  .premium-theme-1{--cover-1:#193024;--cover-2:#0c1610;--cover-accent:#aeca74}
  .premium-theme-2{--cover-1:#172636;--cover-2:#0b131b;--cover-accent:#9db6cb}
  .premium-theme-3{--cover-1:#322512;--cover-2:#171006;--cover-accent:#c6aa6a}
  .premium-theme-4{--cover-1:#1b3217;--cover-2:#0c1709;--cover-accent:#9fc879}
  .premium-theme-5{--cover-1:#261e35;--cover-2:#110d18;--cover-accent:#a99bc7}
  .premium-theme-6{--cover-1:#351c1e;--cover-2:#190c0d;--cover-accent:#c19087}
  .premium-theme-7{--cover-1:#253028;--cover-2:#111612;--cover-accent:#b2c6aa}
  .premium-theme-8{--cover-1:#302b18;--cover-2:#161307;--cover-accent:#c9bf80}

  .premium-book-card .card-link{
    min-height:330px!important;height:100%!important;padding:27px 22px 21px 25px!important;
    display:flex!important;flex-direction:column!important;justify-content:space-between!important;align-items:stretch!important;
    position:relative!important;z-index:2!important;
  }
  .premium-book-card .card-top,.premium-book-card .icon,.premium-book-card .kicker,.premium-book-card .skill,.premium-book-card .card-values,.premium-book-card .play,.premium-book-card .lu-treatment-badge,.premium-book-card .card-link>p:not(.book-obi){display:none!important}
  .premium-book-card h2{
    display:block!important;overflow:visible!important;-webkit-line-clamp:unset!important;-webkit-box-orient:initial!important;
    margin:48px 4px 26px!important;max-width:none!important;
    color:#f4f0e8!important;
    font-family:"Hiragino Mincho ProN","Yu Mincho","YuMincho",serif!important;
    font-size:clamp(22px,2.1vw,31px)!important;line-height:1.42!important;letter-spacing:-.045em!important;font-weight:700!important;
    text-wrap:pretty!important;word-break:auto-phrase!important;
    text-shadow:0 3px 18px rgba(0,0,0,.36)!important;
  }
  .premium-book-card .book-obi{
    display:block!important;margin:auto 0 0!important;padding:14px 15px 13px!important;
    border:1px solid color-mix(in srgb,var(--cover-accent) 42%,rgba(255,255,255,.08))!important;border-radius:12px!important;
    background:linear-gradient(180deg,color-mix(in srgb,var(--cover-accent) 16%,rgba(15,18,13,.88)),rgba(10,12,9,.82))!important;
    color:#eef4de!important;font-size:12px!important;line-height:1.62!important;font-weight:760!important;letter-spacing:.005em!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 8px 22px rgba(0,0,0,.18)!important;
    -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  }
  .premium-book-card .book-obi:before{content:"↗";display:inline-block;margin-right:7px;color:var(--cover-accent);font-weight:950}

  .premium-book-card .favorite{
    z-index:5!important;width:39px!important;height:39px!important;right:14px!important;top:14px!important;
    border:1px solid rgba(255,255,255,.16)!important;border-radius:50%!important;
    background:rgba(5,7,5,.46)!important;color:#e8e8df!important;font-size:22px!important;
    box-shadow:0 8px 18px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.055)!important;
    -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  }
  .premium-book-card .favorite.is-on,.premium-book-card .favorite[aria-pressed="true"]{color:var(--premium-lime)!important;border-color:rgba(216,255,91,.34)!important;background:rgba(216,255,91,.08)!important}
  .premium-book-card:focus-within{outline:2px solid rgba(216,255,91,.62)!important;outline-offset:3px!important}
  .premium-book-card .card-link:active{transform:scale(.992)}

  #levelup-refresh{
    right:max(14px,env(safe-area-inset-right))!important;bottom:max(14px,env(safe-area-inset-bottom))!important;
    min-width:0!important;width:auto!important;height:44px!important;padding:0 14px!important;
    border-color:rgba(216,255,91,.25)!important;background:rgba(10,13,9,.88)!important;
    box-shadow:0 10px 26px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.04)!important;
    font-size:11px!important;letter-spacing:.02em!important;
  }
  #levelup-refresh .refresh-icon{font-size:16px!important}

  @media(max-width:900px){
    .grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}
    .premium-book-card,.premium-book-card .card-link{min-height:320px!important}
  }
  @media(max-width:600px){
    .shell{width:min(100% - 18px,1180px)!important;padding-bottom:96px!important}
    .top{min-height:52px!important;padding:6px 0 10px!important}
    .brand{font-size:10px!important}
    .hero{padding:18px 2px 16px!important;display:block!important}
    .hero-kicker{margin-bottom:9px!important}.hero h1{font-size:42px!important;line-height:.88!important}.hero-copy{display:none!important}.stats{display:none!important}
    .levelup-search{padding:8px!important;margin-bottom:12px!important;border-radius:15px!important}.levelup-search-box{min-height:44px!important}#levelup-search-input{height:44px!important;font-size:16px!important}
    .section-head{margin:12px 0 8px!important}
    .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:11px!important}
    .catalog-divider{min-height:34px!important;margin-top:7px!important;padding-bottom:7px!important}.catalog-divider strong{font-size:10px!important}.catalog-divider span{font-size:8px!important;padding:2px 7px!important}
    .premium-book-card{min-height:304px!important;border-radius:18px!important}
    .premium-book-card .card-link{min-height:304px!important;padding:20px 14px 14px 17px!important}
    .premium-book-card:before{width:130px!important;height:130px!important;right:-54px!important;top:-54px!important}
    .premium-book-card h2{
      margin:43px 2px 20px!important;font-size:clamp(18px,5.2vw,24px)!important;line-height:1.48!important;letter-spacing:-.04em!important;
    }
    .premium-book-card .book-obi{padding:11px 10px 10px!important;border-radius:10px!important;font-size:10.5px!important;line-height:1.55!important}
    .premium-book-card .favorite{width:34px!important;height:34px!important;right:10px!important;top:10px!important;font-size:19px!important}
    #levelup-refresh{height:40px!important;padding:0 12px!important;font-size:10px!important;opacity:.92!important}
  }
  @media(max-width:390px){
    .grid{gap:9px!important}
    .premium-book-card,.premium-book-card .card-link{min-height:292px!important}
    .premium-book-card .card-link{padding:18px 12px 12px 15px!important}
    .premium-book-card h2{font-size:18px!important;line-height:1.47!important;margin-top:40px!important}
    .premium-book-card .book-obi{font-size:10px!important;padding:10px 9px!important}
  }
  @media(max-width:340px){
    .grid{grid-template-columns:1fr!important}
    .premium-book-card,.premium-book-card .card-link{min-height:250px!important}
    .premium-book-card h2{font-size:24px!important;margin-right:42px!important}
    .premium-book-card .book-obi{font-size:11px!important}
  }

  @media(prefers-reduced-motion:reduce){.premium-book-card{transition:none!important}.premium-book-card:hover{transform:none!important}}
</style>`;
  if (!html.includes('</head>')) throw new Error('LEVEL UP premium library: </head> missing.');
  html = html.replace('</head>', `${style}\n</head>`);
}

const scriptMarker = 'id="levelup-premium-library-script"';
if (!html.includes(scriptMarker)) {
  const script = `
<script id="levelup-premium-library-script">
(() => {
  document.documentElement.classList.add('levelup-premium-library');
  const cards = [...document.querySelectorAll('.premium-book-card')];
  cards.forEach((card) => {
    const title = card.querySelector('h2');
    if (title) title.setAttribute('title', title.textContent.trim());
  });
})();
</script>`;
  if (!html.includes('</body>')) throw new Error('LEVEL UP premium library: </body> missing.');
  html = html.replace('</body>', `${script}\n</body>`);
}

fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
const premiumCount = (finalHtml.match(/premium-book-card/g) || []).length;
const expected = games.length;
if (themed !== expected) {
  throw new Error(`LEVEL UP premium library theme coverage mismatch: themed=${themed}, expected=${expected}`);
}
if (premiumCount < expected || !finalHtml.includes(styleMarker) || !finalHtml.includes(scriptMarker)) {
  throw new Error(`LEVEL UP premium library injection incomplete: premiumCount=${premiumCount}, expected>=${expected}`);
}
if (!finalHtml.includes('-webkit-line-clamp:unset!important')) {
  throw new Error('LEVEL UP premium library: full-title anti-truncation style missing.');
}

console.log(`[Firebase] LEVEL UP premium library applied: ${expected} cards; full titles + refined book-cover UI.`);
