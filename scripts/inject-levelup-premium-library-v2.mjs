import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP premium v2 prerequisites missing.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const games = Array.isArray(catalog.games) ? catalog.games : [];
let html = fs.readFileSync(homePath, 'utf8');

if (!html.includes('id="levelup-premium-library-style"')) {
  throw new Error('LEVEL UP premium v2 must run after the base premium library pass.');
}

const styleMarker = 'id="levelup-premium-library-v2-style"';
if (!html.includes(styleMarker)) {
  const style = `
<style id="levelup-premium-library-v2-style">
  /* Home navigation belongs to the header, not on top of cards while scrolling. */
  #levelup-nav-fixed{
    position:absolute!important;
    top:max(13px,env(safe-area-inset-top))!important;
    left:max(13px,env(safe-area-inset-left))!important;
    z-index:1000!important;
  }
  #levelup-nav-toggle{
    width:38px!important;height:38px!important;border-radius:13px!important;
    border-color:rgba(255,255,255,.12)!important;
    background:rgba(12,15,12,.76)!important;
    box-shadow:0 7px 18px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.04)!important;
  }
  #levelup-nav-toggle svg{width:18px!important;height:18px!important}
  .top{padding-left:54px!important}

  /* Give every cover a quiet, app-specific typographic watermark instead of a generic empty gradient. */
  .premium-book-card .icon{
    display:block!important;
    position:absolute!important;
    z-index:0!important;
    right:15px!important;
    bottom:86px!important;
    width:auto!important;height:auto!important;margin:0!important;
    color:var(--cover-accent)!important;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
    font-size:72px!important;line-height:1!important;font-weight:900!important;
    letter-spacing:-.08em!important;
    opacity:.065!important;
    filter:none!important;
    pointer-events:none!important;
    transform:rotate(-5deg)!important;
  }
  .premium-book-card h2,.premium-book-card .book-obi{position:relative!important;z-index:2!important}

  /* Long titles are deliberately typeset, never ellipsized. */
  .premium-book-card.title-long h2{font-size:clamp(20px,1.85vw,27px)!important;line-height:1.40!important}
  .premium-book-card.title-xlong h2{font-size:clamp(18px,1.65vw,24px)!important;line-height:1.38!important}
  .premium-book-card.title-xlong{min-height:350px!important}
  .premium-book-card.title-xlong .card-link{min-height:350px!important}

  /* The obi reads like a real secondary line, not a fluorescent CTA. */
  .premium-book-card .book-obi{
    border-left:2px solid color-mix(in srgb,var(--cover-accent) 78%,white 5%)!important;
    border-top-color:rgba(255,255,255,.07)!important;
    border-right-color:rgba(255,255,255,.045)!important;
    border-bottom-color:rgba(255,255,255,.045)!important;
    background:linear-gradient(90deg,color-mix(in srgb,var(--cover-accent) 11%,rgba(10,13,10,.92)),rgba(10,13,10,.72))!important;
  }
  .premium-book-card .book-obi:before{content:""!important;margin:0!important}

  /* Reduce chrome: the content should feel like a library, not an admin dashboard. */
  .catalog-divider{opacity:.94!important}
  .catalog-divider span{font-variant-numeric:tabular-nums!important}
  #levelup-refresh{opacity:.84!important}

  @media(max-width:600px){
    #levelup-nav-fixed{top:max(10px,env(safe-area-inset-top))!important;left:max(9px,env(safe-area-inset-left))!important}
    #levelup-nav-toggle{width:36px!important;height:36px!important;border-radius:12px!important}
    .top{padding-left:48px!important;padding-right:2px!important}
    .premium-book-card .icon{font-size:54px!important;right:10px!important;bottom:78px!important;opacity:.055!important}
    .premium-book-card.title-long h2{font-size:17.5px!important;line-height:1.43!important}
    .premium-book-card.title-xlong h2{font-size:16px!important;line-height:1.41!important;letter-spacing:-.035em!important}
    .premium-book-card.title-xlong,.premium-book-card.title-xlong .card-link{min-height:318px!important}
    /* Browser pull-to-refresh already exists; do not float a utility over the books. */
    #levelup-refresh{display:none!important}
  }
  @media(max-width:390px){
    .premium-book-card.title-long h2{font-size:16.5px!important}
    .premium-book-card.title-xlong h2{font-size:15.5px!important}
  }
  @media(max-width:340px){
    .premium-book-card.title-long h2,.premium-book-card.title-xlong h2{font-size:21px!important}
  }
</style>`;
  if (!html.includes('</head>')) throw new Error('LEVEL UP premium v2: </head> missing.');
  html = html.replace('</head>', `${style}\n</head>`);
}

const scriptMarker = 'id="levelup-premium-library-v2-script"';
if (!html.includes(scriptMarker)) {
  const script = `
<script id="levelup-premium-library-v2-script">
(() => {
  const cards=[...document.querySelectorAll('.premium-book-card')];
  cards.forEach(card=>{
    const title=card.querySelector('h2');
    if(!title)return;
    const count=[...title.textContent.trim()].length;
    card.classList.toggle('title-long',count>24&&count<=34);
    card.classList.toggle('title-xlong',count>34);
  });
})();
</script>`;
  if (!html.includes('</body>')) throw new Error('LEVEL UP premium v2: </body> missing.');
  html = html.replace('</body>', `${script}\n</body>`);
}

fs.writeFileSync(homePath, html);
const finalHtml = fs.readFileSync(homePath, 'utf8');
const cardCount = [...finalHtml.matchAll(/<article\b[^>]*\bpremium-book-card\b[^>]*\bdata-game="[^"]+"/g)].length;
if (cardCount !== games.length) {
  throw new Error(`LEVEL UP premium v2 card coverage mismatch: cards=${cardCount}, catalog=${games.length}`);
}
if (!finalHtml.includes(styleMarker) || !finalHtml.includes(scriptMarker)) {
  throw new Error('LEVEL UP premium v2 assets missing from generated home.');
}
if (!finalHtml.includes('#levelup-refresh{display:none!important}')) {
  throw new Error('LEVEL UP premium v2 mobile overlap guard missing.');
}

console.log(`[Firebase] LEVEL UP premium library v2 applied: ${cardCount} covers; nav no longer floats over cards; mobile refresh overlay removed.`);
