import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const MARKER = 'id="levelup-color-mode-v1"';
const BUTTON = 'id="levelup-theme-toggle"';
const SCRIPT = 'id="levelup-color-mode-controller-v1"';

if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home missing for color mode injection.');
let html = fs.readFileSync(homePath, 'utf8');

const headInjection = `
<script id="levelup-color-mode-bootstrap-v1">
(()=>{
  const KEY='hitobito-levelup-color-mode-v1';
  const THEMES=['lime','violet-night','sky','sunset-night'];
  let theme='lime';
  try{const saved=localStorage.getItem(KEY);if(THEMES.includes(saved))theme=saved;}catch{}
  document.documentElement.dataset.levelupTheme=theme;
})();
</script>
<style id="levelup-color-mode-v1">
  .levelup-theme-toggle{
    --mode-accent:#dfff4f;
    flex:0 0 auto;width:44px;height:44px;display:grid;place-items:center;padding:0;
    border:1px solid #bdb9ad;border-radius:50%;background:#fffef8;color:#11110f;
    box-shadow:inset 0 -5px 0 var(--mode-accent);cursor:pointer;font:inherit;font-size:19px;line-height:1;
    -webkit-tap-highlight-color:transparent;transition:background-color .16s ease,color .16s ease,border-color .16s ease,transform .16s ease,box-shadow .16s ease;
  }
  .levelup-theme-toggle:hover{border-color:currentColor;transform:translateY(-1px)}
  .levelup-theme-toggle:active{transform:scale(.95)}
  .levelup-theme-toggle:focus-visible{outline:3px solid var(--mode-accent);outline-offset:3px}

  html[data-levelup-theme="lime"]{
    color-scheme:light!important;
    --lu-paper:#f3f1e8!important;--lu-surface:#fffef8!important;--lu-ink:#11110f!important;--lu-muted:#66645d!important;--lu-line:#cbc8bd!important;
    --lu-lime:#dfff4f!important;--lu-lime-soft:#efffa8!important;
    --lu-cat-paper:#f3f1e8!important;--lu-cat-card:#fffef8!important;--lu-cat-ink:#11110f!important;--lu-cat-muted:#6a675f!important;--lu-cat-line:#bdb9ad!important;--lu-cat-lime:#dfff4f!important;--lu-cat-lime-soft:#f2ffc0!important;
  }
  html[data-levelup-theme="sky"]{
    color-scheme:light!important;
    --lu-paper:#eef7f8!important;--lu-surface:#fbffff!important;--lu-ink:#0d1719!important;--lu-muted:#53686d!important;--lu-line:#bed2d6!important;
    --lu-lime:#70e7ff!important;--lu-lime-soft:#cdf7ff!important;
    --lu-cat-paper:#eef7f8!important;--lu-cat-card:#fbffff!important;--lu-cat-ink:#0d1719!important;--lu-cat-muted:#53686d!important;--lu-cat-line:#b7d0d5!important;--lu-cat-lime:#70e7ff!important;--lu-cat-lime-soft:#d8f9ff!important;
  }
  html[data-levelup-theme="violet-night"]{
    color-scheme:dark!important;
    --lu-paper:#0d0a12!important;--lu-surface:#17121f!important;--lu-ink:#f8f3ff!important;--lu-muted:#b8adc4!important;--lu-line:#3e344a!important;
    --lu-lime:#bf83ff!important;--lu-lime-soft:#332044!important;
    --lu-cat-paper:#0d0a12!important;--lu-cat-card:#17121f!important;--lu-cat-ink:#f8f3ff!important;--lu-cat-muted:#b8adc4!important;--lu-cat-line:#3e344a!important;--lu-cat-lime:#bf83ff!important;--lu-cat-lime-soft:#352149!important;
  }
  html[data-levelup-theme="sunset-night"]{
    color-scheme:dark!important;
    --lu-paper:#110b08!important;--lu-surface:#1d1511!important;--lu-ink:#fff5ee!important;--lu-muted:#c4afa2!important;--lu-line:#4a3930!important;
    --lu-lime:#ff9a5b!important;--lu-lime-soft:#432718!important;
    --lu-cat-paper:#110b08!important;--lu-cat-card:#1d1511!important;--lu-cat-ink:#fff5ee!important;--lu-cat-muted:#c4afa2!important;--lu-cat-line:#4a3930!important;--lu-cat-lime:#ff9a5b!important;--lu-cat-lime-soft:#462819!important;
  }

  html[data-levelup-theme] body{background:var(--lu-paper)!important;color:var(--lu-ink)!important}
  html[data-levelup-theme] .top{border-color:var(--lu-line)!important;background:transparent!important}
  html[data-levelup-theme] .brand{color:var(--lu-ink)!important}
  html[data-levelup-theme] .top a,html[data-levelup-theme] #levelup-account-chip{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important}
  html[data-levelup-theme] #levelup-nav-toggle{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:none!important}
  html[data-levelup-theme] #levelup-nav-toggle svg{color:var(--lu-ink)!important;stroke:var(--lu-ink)!important}
  html[data-levelup-theme] .levelup-theme-toggle{--mode-accent:var(--lu-lime);background:var(--lu-surface);color:var(--lu-ink);border-color:var(--lu-line)}

  html[data-levelup-theme] .lu-home-eyebrow{color:var(--lu-ink)!important}
  html[data-levelup-theme] .lu-home-hero h1,html[data-levelup-theme] .lu-home-hero h1 span{color:var(--lu-ink)!important}
  html[data-levelup-theme] .lu-home-hero h1 span{background:linear-gradient(transparent 55%,var(--lu-lime) 55%,var(--lu-lime) 91%,transparent 91%)!important}
  html[data-levelup-theme] .lu-home-hero .hero-copy{color:var(--lu-muted)!important}
  html[data-levelup-theme] .lu-home-stats strong{color:var(--lu-ink)!important}
  html[data-levelup-theme] .lu-home-stats span,html[data-levelup-theme] .lu-home-note{color:var(--lu-muted)!important}

  html[data-levelup-theme] body .lu-v3{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .lu-v3 h2,html[data-levelup-theme] body .lu-v3-kicker{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .lu-v3-lead{color:var(--lu-muted)!important}
  html[data-levelup-theme] body .lu-v3-problem,
  html[data-levelup-theme] body .lu-v3-problem:nth-child(3n+2),
  html[data-levelup-theme] body .lu-v3-problem:nth-child(3n),
  html[data-levelup-theme] body .lu-v3-problem[style]{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:inset 7px 0 0 var(--lu-lime)!important}
  html[data-levelup-theme] body .lu-v3-problem b{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .lu-v3-problem:hover{border-color:var(--lu-ink)!important}

  html[data-levelup-theme] body .levelup-search{background:color-mix(in srgb,var(--lu-surface) 78%,transparent)!important;border-color:var(--lu-line)!important}
  html[data-levelup-theme] body .levelup-search h2,html[data-levelup-theme] body .levelup-search-icon{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .levelup-search-box{background:var(--lu-surface)!important;border-color:var(--lu-line)!important}
  html[data-levelup-theme] body #levelup-search-input{color:var(--lu-ink)!important}
  html[data-levelup-theme] body #levelup-search-input::placeholder,html[data-levelup-theme] body .levelup-search-status{color:var(--lu-muted)!important}

  html[data-levelup-theme] body .section-head h2,html[data-levelup-theme] body .section-head strong,html[data-levelup-theme] body .catalog-divider strong{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .section-head span,html[data-levelup-theme] body .catalog-divider span{color:var(--lu-muted)!important}
  html[data-levelup-theme] body .catalog-divider{border-color:var(--lu-line)!important}
  html[data-levelup-theme] body .catalog-divider[data-kind="favorite"] strong,
  html[data-levelup-theme] body .catalog-divider[data-kind="new"] strong,
  html[data-levelup-theme] body .catalog-divider[data-kind="popular"] strong,
  html[data-levelup-theme] body .catalog-divider[data-category] strong{color:var(--lu-ink)!important;background:linear-gradient(transparent 56%,var(--lu-lime) 56%,var(--lu-lime) 92%,transparent 92%)!important}

  html[data-levelup-theme] body .premium-book-card,
  html[data-levelup-theme] body .premium-book-card.title-long,
  html[data-levelup-theme] body .premium-book-card.title-xlong,
  html[data-levelup-theme] body .levelup-category-card[data-category],
  html[data-levelup-theme] body .premium-theme-1,html[data-levelup-theme] body .premium-theme-2,html[data-levelup-theme] body .premium-theme-3,html[data-levelup-theme] body .premium-theme-4,
  html[data-levelup-theme] body .premium-theme-5,html[data-levelup-theme] body .premium-theme-6,html[data-levelup-theme] body .premium-theme-7,html[data-levelup-theme] body .premium-theme-8{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:none!important}
  html[data-levelup-theme] body .premium-book-card:before{background:var(--lu-lime)!important}
  html[data-levelup-theme] body .premium-book-card:hover{border-color:var(--lu-ink)!important}
  html[data-levelup-theme] body .premium-book-card h2,
  html[data-levelup-theme] body .premium-book-card.title-long h2,
  html[data-levelup-theme] body .premium-book-card.title-xlong h2{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .premium-book-card .book-obi{color:var(--lu-muted)!important}
  html[data-levelup-theme] body .premium-book-card .favorite{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important}
  html[data-levelup-theme] body .premium-book-card .favorite.is-on,
  html[data-levelup-theme] body .premium-book-card .favorite[aria-pressed="true"]{background:var(--lu-lime)!important;color:#11110f!important;border-color:var(--lu-ink)!important}

  html[data-levelup-theme] body .lu-categories,html[data-levelup-theme] body .lu-categories-head h2{color:var(--lu-cat-ink)!important}
  html[data-levelup-theme] body .lu-categories-head span{color:var(--lu-cat-muted)!important}
  html[data-levelup-theme] body #levelup-category-all{background:var(--lu-cat-card)!important;color:var(--lu-cat-ink)!important;border-color:var(--lu-cat-line)!important;box-shadow:none!important}
  html[data-levelup-theme] body #levelup-category-all::after{background:var(--lu-cat-lime)!important;color:#11110f!important}
  html[data-levelup-theme] body .lu-category-card,
  html[data-levelup-theme] body .lu-category-card.tone-black,
  html[data-levelup-theme] body .lu-category-card.tone-red,
  html[data-levelup-theme] body .lu-category-card.tone-green,
  html[data-levelup-theme] body .lu-category-card.tone-navy,
  html[data-levelup-theme] body .lu-category-card.tone-purple,
  html[data-levelup-theme] body .lu-category-card.tone-ochre{background:var(--lu-cat-card)!important;color:var(--lu-cat-ink)!important;border-color:var(--lu-cat-line)!important;box-shadow:none!important}
  html[data-levelup-theme] body .lu-category-card::after{background:var(--lu-cat-lime)!important}
  html[data-levelup-theme] body .lu-category-card:hover{border-color:var(--lu-cat-ink)!important}
  html[data-levelup-theme] body .lu-category-card.is-selected{border-color:var(--lu-cat-ink)!important;box-shadow:0 0 0 3px var(--lu-cat-lime)!important}
  html[data-levelup-theme] body .lu-category-mark{background:var(--lu-cat-lime-soft)!important;color:var(--lu-cat-ink)!important}
  html[data-levelup-theme] body .lu-category-copy strong{color:var(--lu-cat-ink)!important}
  html[data-levelup-theme] body .lu-category-copy small{color:var(--lu-cat-muted)!important}
  html[data-levelup-theme] body .lu-category-arrow{border-color:var(--lu-cat-line)!important;color:var(--lu-cat-lime)!important}

  html[data-levelup-theme] body .lu-v3-sheet{background:rgba(0,0,0,.48)!important}
  html[data-levelup-theme] body .lu-v3-panel,html[data-levelup-theme] body .lu-v3-result{background:var(--lu-paper)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important}
  html[data-levelup-theme] body .lu-v3-top strong,html[data-levelup-theme] body .lu-v3-question,html[data-levelup-theme] body .lu-v3-result h3{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .lu-v3-close,html[data-levelup-theme] body .lu-v3-option,html[data-levelup-theme] body .lu-v3-secondary{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important}
  html[data-levelup-theme] body .lu-v3-option small,html[data-levelup-theme] body .lu-v3-result p{color:var(--lu-muted)!important}
  html[data-levelup-theme] body .lu-v3-option.is-on{background:var(--lu-lime)!important;color:#11110f!important;border-color:var(--lu-ink)!important}
  html[data-levelup-theme] body .lu-v3-primary{background:var(--lu-lime)!important;color:#11110f!important;border:1px solid var(--lu-ink)!important}
  html[data-levelup-theme] body .lu-v3-result a{background:var(--lu-ink)!important;color:var(--lu-surface)!important}
  html[data-levelup-theme] body .lu-v3-result-intro{background:var(--lu-surface)!important;color:var(--lu-muted)!important}

  html[data-levelup-theme] .footer{border-color:var(--lu-line)!important;color:var(--lu-muted)!important}
  html[data-levelup-theme] .footer strong{color:var(--lu-ink)!important}
  @media(max-width:650px){.levelup-theme-toggle{width:42px;height:42px;font-size:18px}}
  @media(prefers-reduced-motion:reduce){.levelup-theme-toggle{transition:none!important}}
</style>`;

const toggle = `<button id="levelup-theme-toggle" class="levelup-theme-toggle" type="button" aria-label="カラーモードを切り替える" title="カラーモードを切り替える"><span aria-hidden="true">◐</span></button>`;
const controller = `
<script id="levelup-color-mode-controller-v1">
(()=>{
  const KEY='hitobito-levelup-color-mode-v1';
  const MODES=[
    {id:'lime',name:'LIME',meta:'#f3f1e8',icon:'◐'},
    {id:'violet-night',name:'VIOLET NIGHT',meta:'#0d0a12',icon:'◑'},
    {id:'sky',name:'SKY',meta:'#eef7f8',icon:'◐'},
    {id:'sunset-night',name:'SUNSET NIGHT',meta:'#110b08',icon:'◑'}
  ];
  const root=document.documentElement;
  const button=document.getElementById('levelup-theme-toggle');
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(!button)return;
  const indexOf=()=>Math.max(0,MODES.findIndex(mode=>mode.id===root.dataset.levelupTheme));
  const apply=(mode,persist=false)=>{
    root.dataset.levelupTheme=mode.id;
    button.dataset.mode=mode.id;
    button.setAttribute('aria-label','カラーモードを切り替える。現在 '+mode.name);
    button.setAttribute('title','COLOR MODE · '+mode.name);
    button.querySelector('span').textContent=mode.icon;
    if(themeMeta)themeMeta.setAttribute('content',mode.meta);
    if(persist){try{localStorage.setItem(KEY,mode.id);}catch{}}
  };
  apply(MODES[indexOf()]);
  button.addEventListener('click',()=>apply(MODES[(indexOf()+1)%MODES.length],true));
  window.addEventListener('storage',(event)=>{if(event.key!==KEY)return;const mode=MODES.find(item=>item.id===event.newValue)||MODES[0];apply(mode);});
})();
</script>`;

if (!html.includes(MARKER)) {
  if (!html.includes('</head>')) throw new Error('LEVEL UP head missing for color mode injection.');
  html = html.replace('</head>', `${headInjection}\n</head>`);
}
if (!html.includes(BUTTON)) {
  const top = html.match(/<header class="top"[^>]*>[\s\S]*?<\/header>/)?.[0];
  if (!top) throw new Error('LEVEL UP top header missing for color mode toggle.');
  html = html.replace(top, top.replace('</header>', `${toggle}</header>`));
}
if (!html.includes(SCRIPT)) {
  if (!html.includes('</body>')) throw new Error('LEVEL UP body missing for color mode controller.');
  html = html.replace('</body>', `${controller}\n</body>`);
}
fs.writeFileSync(homePath, html);

const out = fs.readFileSync(homePath, 'utf8');
for (const token of [MARKER, BUTTON, SCRIPT, 'hitobito-levelup-color-mode-v1', 'violet-night', 'sunset-night', 'カラーモードを切り替える']) {
  if (!out.includes(token)) throw new Error(`LEVEL UP color mode missing ${token}`);
}
console.log('[Firebase] LEVEL UP home color modes injected: lime / violet night / sky / sunset night.');
