import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const MARKER = 'id="levelup-dark-mode-v1"';
const BUTTON = 'id="levelup-theme-toggle"';
const SCRIPT = 'id="levelup-theme-controller-v1"';

if (!fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home missing for dark mode injection.');
}

let html = fs.readFileSync(homePath, 'utf8');

const headInjection = `
<script id="levelup-theme-bootstrap-v1">
(()=>{
  const KEY='hitobito-levelup-theme-v1';
  let theme='light';
  try{if(localStorage.getItem(KEY)==='dark')theme='dark';}catch{}
  document.documentElement.dataset.levelupTheme=theme;
})();
</script>
<style id="levelup-dark-mode-v1">
  .levelup-theme-toggle{
    flex:0 0 auto;
    width:42px;
    height:42px;
    display:grid;
    place-items:center;
    padding:0;
    border:1px solid #cbc8bd;
    border-radius:50%;
    background:#fffef8;
    color:#11110f;
    box-shadow:none;
    cursor:pointer;
    font:inherit;
    font-size:19px;
    line-height:1;
    -webkit-tap-highlight-color:transparent;
    transition:background-color .16s ease,color .16s ease,border-color .16s ease,transform .16s ease;
  }
  .levelup-theme-toggle:hover{border-color:#11110f;transform:translateY(-1px)}
  .levelup-theme-toggle:active{transform:scale(.96)}
  .levelup-theme-toggle:focus-visible{outline:3px solid #dfff4f;outline-offset:3px}

  html[data-levelup-theme="dark"]{
    color-scheme:dark!important;
    --lu-paper:#0a0b09!important;
    --lu-surface:#151713!important;
    --lu-ink:#f5f7ef!important;
    --lu-muted:#a7aea0!important;
    --lu-line:#353a31!important;
    --lu-lime:#dfff4f!important;
    --lu-lime-soft:#293219!important;
    --lu-cat-paper:#0a0b09!important;
    --lu-cat-card:#151713!important;
    --lu-cat-ink:#f5f7ef!important;
    --lu-cat-muted:#a7aea0!important;
    --lu-cat-line:#353a31!important;
    --lu-cat-lime:#dfff4f!important;
    --lu-cat-lime-soft:#273016!important;
    background:#0a0b09!important;
  }
  html[data-levelup-theme="dark"] body{
    background:#0a0b09!important;
    color:#f5f7ef!important;
  }
  html[data-levelup-theme="dark"] .top{border-color:#34382f!important;background:transparent!important}
  html[data-levelup-theme="dark"] .brand{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] .top a,
  html[data-levelup-theme="dark"] #levelup-account-chip{
    background:#151713!important;
    color:#f5f7ef!important;
    border-color:#353a31!important;
  }
  html[data-levelup-theme="dark"] #levelup-nav-toggle{
    background:#151713!important;
    color:#f5f7ef!important;
    border-color:#353a31!important;
    box-shadow:0 7px 18px rgba(0,0,0,.22)!important;
  }
  html[data-levelup-theme="dark"] #levelup-nav-toggle svg{color:#f5f7ef!important;stroke:#f5f7ef!important}
  html[data-levelup-theme="dark"] .levelup-theme-toggle{
    background:#151713;
    color:#f5f7ef;
    border-color:#3c4237;
  }
  html[data-levelup-theme="dark"] .levelup-theme-toggle:hover{border-color:#dfff4f;background:#1b1e18}

  html[data-levelup-theme="dark"] .lu-home-eyebrow{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] .lu-home-hero h1,
  html[data-levelup-theme="dark"] .lu-home-hero h1 span{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] .lu-home-hero .hero-copy{color:#b8bfb1!important}
  html[data-levelup-theme="dark"] .lu-home-stats strong{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] .lu-home-stats span,
  html[data-levelup-theme="dark"] .lu-home-note{color:#9ea697!important}

  html[data-levelup-theme="dark"] body .lu-v3{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-v3 h2,
  html[data-levelup-theme="dark"] body .lu-v3-kicker{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-v3-lead{color:#a7aea0!important}
  html[data-levelup-theme="dark"] body .lu-v3-problem,
  html[data-levelup-theme="dark"] body .lu-v3-problem:nth-child(3n+2),
  html[data-levelup-theme="dark"] body .lu-v3-problem:nth-child(3n),
  html[data-levelup-theme="dark"] body .lu-v3-problem[style]{
    --lu-problem-color:#151713!important;
    background:#151713!important;
    color:#f5f7ef!important;
    border-color:#353a31!important;
    box-shadow:inset 7px 0 0 #dfff4f!important;
  }
  html[data-levelup-theme="dark"] body .lu-v3-problem b{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-v3-problem:hover{background:#1b1f18!important;border-color:#dfff4f!important}

  html[data-levelup-theme="dark"] body .levelup-search{
    background:#11130f!important;
    border-color:#353a31!important;
  }
  html[data-levelup-theme="dark"] body .levelup-search h2,
  html[data-levelup-theme="dark"] body .levelup-search-icon{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .levelup-search-box{background:#171914!important;border-color:#3a4035!important}
  html[data-levelup-theme="dark"] body #levelup-search-input{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body #levelup-search-input::placeholder,
  html[data-levelup-theme="dark"] body .levelup-search-status{color:#8f9789!important}

  html[data-levelup-theme="dark"] body .section-head h2,
  html[data-levelup-theme="dark"] body .section-head strong,
  html[data-levelup-theme="dark"] body .catalog-divider strong{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .section-head span,
  html[data-levelup-theme="dark"] body .catalog-divider span{color:#9ca496!important}
  html[data-levelup-theme="dark"] body .catalog-divider{border-color:#34382f!important}
  html[data-levelup-theme="dark"] body .catalog-divider span{background:#151713!important;border-color:#353a31!important}

  html[data-levelup-theme="dark"] body .premium-book-card,
  html[data-levelup-theme="dark"] body .premium-book-card.title-long,
  html[data-levelup-theme="dark"] body .premium-book-card.title-xlong,
  html[data-levelup-theme="dark"] body .levelup-category-card[data-category],
  html[data-levelup-theme="dark"] body .premium-theme-1,
  html[data-levelup-theme="dark"] body .premium-theme-2,
  html[data-levelup-theme="dark"] body .premium-theme-3,
  html[data-levelup-theme="dark"] body .premium-theme-4,
  html[data-levelup-theme="dark"] body .premium-theme-5,
  html[data-levelup-theme="dark"] body .premium-theme-6,
  html[data-levelup-theme="dark"] body .premium-theme-7,
  html[data-levelup-theme="dark"] body .premium-theme-8{
    --lu-card-bg:#151713!important;
    background:#151713!important;
    color:#f5f7ef!important;
    border-color:#353a31!important;
  }
  html[data-levelup-theme="dark"] body .premium-book-card:hover{border-color:#dfff4f!important;box-shadow:0 16px 34px rgba(0,0,0,.25)!important}
  html[data-levelup-theme="dark"] body .premium-book-card h2,
  html[data-levelup-theme="dark"] body .premium-book-card.title-long h2,
  html[data-levelup-theme="dark"] body .premium-book-card.title-xlong h2{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .premium-book-card .book-obi{color:#aab1a4!important}
  html[data-levelup-theme="dark"] body .premium-book-card .favorite{background:#1c1f1a!important;color:#f5f7ef!important;border-color:#42483d!important}
  html[data-levelup-theme="dark"] body .premium-book-card .favorite.is-on,
  html[data-levelup-theme="dark"] body .premium-book-card .favorite[aria-pressed="true"]{background:#dfff4f!important;color:#11110f!important;border-color:#dfff4f!important}

  html[data-levelup-theme="dark"] body .lu-categories{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-categories-head h2{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-categories-head span{color:#929a8d!important}
  html[data-levelup-theme="dark"] body #levelup-category-all{background:#151713!important;color:#f5f7ef!important;border-color:#3b4037!important;box-shadow:none!important}
  html[data-levelup-theme="dark"] body .lu-category-card,
  html[data-levelup-theme="dark"] body .lu-category-card.tone-black,
  html[data-levelup-theme="dark"] body .lu-category-card.tone-red,
  html[data-levelup-theme="dark"] body .lu-category-card.tone-green,
  html[data-levelup-theme="dark"] body .lu-category-card.tone-navy,
  html[data-levelup-theme="dark"] body .lu-category-card.tone-purple,
  html[data-levelup-theme="dark"] body .lu-category-card.tone-ochre{
    background:#151713!important;
    color:#f5f7ef!important;
    border-color:#353a31!important;
    box-shadow:none!important;
  }
  html[data-levelup-theme="dark"] body .lu-category-card:hover{border-color:#dfff4f!important;box-shadow:0 15px 32px rgba(0,0,0,.23)!important}
  html[data-levelup-theme="dark"] body .lu-category-card.is-selected{border-color:#dfff4f!important;box-shadow:0 0 0 3px rgba(223,255,79,.28)!important}
  html[data-levelup-theme="dark"] body .lu-category-mark{background:#283118!important;color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-category-copy strong{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-category-copy small{color:#a7aea0!important}
  html[data-levelup-theme="dark"] body .lu-category-arrow{border-color:#42483d!important;color:#dfff4f!important}

  html[data-levelup-theme="dark"] body .lu-v3-sheet{background:rgba(0,0,0,.64)!important}
  html[data-levelup-theme="dark"] body .lu-v3-panel,
  html[data-levelup-theme="dark"] body .lu-v3-result{background:#11130f!important;color:#f5f7ef!important;border-color:#3a4035!important;box-shadow:0 28px 80px rgba(0,0,0,.55)!important}
  html[data-levelup-theme="dark"] body .lu-v3-top strong,
  html[data-levelup-theme="dark"] body .lu-v3-question,
  html[data-levelup-theme="dark"] body .lu-v3-result h3{color:#f5f7ef!important}
  html[data-levelup-theme="dark"] body .lu-v3-close,
  html[data-levelup-theme="dark"] body .lu-v3-option,
  html[data-levelup-theme="dark"] body .lu-v3-secondary{background:#191c17!important;color:#f5f7ef!important;border-color:#3b4137!important}
  html[data-levelup-theme="dark"] body .lu-v3-option small,
  html[data-levelup-theme="dark"] body .lu-v3-result p{color:#a7aea0!important}
  html[data-levelup-theme="dark"] body .lu-v3-option.is-on{background:#dfff4f!important;color:#11110f!important;border-color:#dfff4f!important}
  html[data-levelup-theme="dark"] body .lu-v3-option.is-on small{color:#343a1e!important}
  html[data-levelup-theme="dark"] body .lu-v3-result-intro{background:#1b1e18!important;color:#a7aea0!important}
  html[data-levelup-theme="dark"] body .lu-v3-result a{background:#dfff4f!important;color:#11110f!important}

  html[data-levelup-theme="dark"] .footer{border-color:#34382f!important;color:#9ca496!important}
  html[data-levelup-theme="dark"] .footer strong{color:#f5f7ef!important}

  @media(max-width:650px){
    .levelup-theme-toggle{width:40px;height:40px;font-size:18px}
  }
  @media(prefers-reduced-motion:reduce){.levelup-theme-toggle{transition:none!important}}
</style>`;

const toggle = `<button id="levelup-theme-toggle" class="levelup-theme-toggle" type="button" aria-pressed="false" aria-label="ダークモードに切り替える" title="ダークモードに切り替える"><span aria-hidden="true">☾</span></button>`;

const controller = `
<script id="levelup-theme-controller-v1">
(()=>{
  const KEY='hitobito-levelup-theme-v1';
  const root=document.documentElement;
  const button=document.getElementById('levelup-theme-toggle');
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(!button)return;

  const apply=(theme,persist=false)=>{
    const dark=theme==='dark';
    root.dataset.levelupTheme=dark?'dark':'light';
    button.setAttribute('aria-pressed',String(dark));
    const label=dark?'ライトモードに切り替える':'ダークモードに切り替える';
    button.setAttribute('aria-label',label);
    button.setAttribute('title',label);
    button.querySelector('span').textContent=dark?'☀':'☾';
    if(themeMeta)themeMeta.setAttribute('content',dark?'#0a0b09':'#f3f1e8');
    if(persist){try{localStorage.setItem(KEY,dark?'dark':'light');}catch{}}
  };

  apply(root.dataset.levelupTheme==='dark'?'dark':'light');
  button.addEventListener('click',()=>apply(root.dataset.levelupTheme==='dark'?'light':'dark',true));
  window.addEventListener('storage',(event)=>{
    if(event.key===KEY)apply(event.newValue==='dark'?'dark':'light');
  });
})();
</script>`;

if (!html.includes(MARKER)) {
  if (!html.includes('</head>')) throw new Error('LEVEL UP head missing for dark mode injection.');
  html = html.replace('</head>', `${headInjection}\n</head>`);
}

if (!html.includes(BUTTON)) {
  const top = html.match(/<header class="top"[^>]*>[\s\S]*?<\/header>/)?.[0];
  if (!top) throw new Error('LEVEL UP top header missing for dark mode toggle.');
  html = html.replace(top, top.replace('</header>', `${toggle}</header>`));
}

if (!html.includes(SCRIPT)) {
  if (!html.includes('</body>')) throw new Error('LEVEL UP body missing for dark mode controller.');
  html = html.replace('</body>', `${controller}\n</body>`);
}

fs.writeFileSync(homePath, html);

const out = fs.readFileSync(homePath, 'utf8');
for (const token of [MARKER, BUTTON, SCRIPT, 'hitobito-levelup-theme-v1', 'data-levelup-theme="dark"', 'ライトモードに切り替える']) {
  if (!out.includes(token)) throw new Error(`LEVEL UP dark mode missing ${token}`);
}

console.log('[Firebase] LEVEL UP home dark mode toggle injected with persistent preference.');
