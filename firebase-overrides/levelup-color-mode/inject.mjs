import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const MARKER = 'id="levelup-color-mode-v1"';
const BUTTON = 'id="levelup-theme-toggle"';
const SCRIPT = 'id="levelup-color-mode-controller-v1"';

const THEMES = [
  {id:'lime',name:'LIME',scheme:'light',paper:'#f3f1e8',surface:'#fffef8',ink:'#11110f',muted:'#66645d',line:'#cbc8bd',accent:'#dfff4f',soft:'#efffa8',icon:'◐'},
  {id:'violet-night',name:'VIOLET NIGHT',scheme:'dark',paper:'#0d0a12',surface:'#17121f',ink:'#f8f3ff',muted:'#b8adc4',line:'#3e344a',accent:'#bf83ff',soft:'#332044',icon:'◑'},
  {id:'sky',name:'SKY',scheme:'light',paper:'#eef7f8',surface:'#fbffff',ink:'#0d1719',muted:'#53686d',line:'#bed2d6',accent:'#70e7ff',soft:'#cdf7ff',icon:'◐'},
  {id:'sunset-night',name:'SUNSET NIGHT',scheme:'dark',paper:'#110b08',surface:'#1d1511',ink:'#fff5ee',muted:'#c4afa2',line:'#4a3930',accent:'#ff9a5b',soft:'#432718',icon:'◑'},
  {id:'sakura',name:'SAKURA',scheme:'light',paper:'#fff4f7',surface:'#fffafd',ink:'#2b1720',muted:'#805f6b',line:'#e9c8d2',accent:'#ff78a5',soft:'#ffd5e3',icon:'✿'},
  {id:'matcha',name:'MATCHA',scheme:'light',paper:'#f2f4e8',surface:'#fbfcef',ink:'#182315',muted:'#66705c',line:'#c9d0b5',accent:'#9acb53',soft:'#dff0bc',icon:'◉'},
  {id:'ocean',name:'OCEAN',scheme:'light',paper:'#eaf7f7',surface:'#f7ffff',ink:'#09252b',muted:'#54747a',line:'#b9d9dd',accent:'#20c5c9',soft:'#c4f1f2',icon:'≋'},
  {id:'midnight-blue',name:'MIDNIGHT BLUE',scheme:'dark',paper:'#07101f',surface:'#0e1b31',ink:'#edf5ff',muted:'#9eb0c9',line:'#2c4161',accent:'#6aa9ff',soft:'#193760',icon:'✦'},
  {id:'rose-night',name:'ROSE NIGHT',scheme:'dark',paper:'#160a11',surface:'#25121c',ink:'#fff1f6',muted:'#c2a0ae',line:'#543141',accent:'#ff6e9f',soft:'#4a1d30',icon:'◆'},
  {id:'amber',name:'AMBER',scheme:'light',paper:'#fff7e8',surface:'#fffdf7',ink:'#2a1d09',muted:'#7d6a4c',line:'#ead4aa',accent:'#ffbf3f',soft:'#ffe6a8',icon:'◒'},
  {id:'mint',name:'MINT',scheme:'light',paper:'#edf9f3',surface:'#fbfffd',ink:'#10271d',muted:'#5d766a',line:'#bfddd0',accent:'#62dfa9',soft:'#cbf4df',icon:'◌'},
  {id:'lavender',name:'LAVENDER',scheme:'light',paper:'#f6f1fb',surface:'#fefbff',ink:'#251b31',muted:'#71647f',line:'#d8cbe5',accent:'#b58cff',soft:'#e6d9ff',icon:'◇'},
  {id:'mono',name:'MONO',scheme:'light',paper:'#f0f0ee',surface:'#ffffff',ink:'#111111',muted:'#666666',line:'#c8c8c5',accent:'#9d9d99',soft:'#ddddda',icon:'◐'},
  {id:'washi-red',name:'WASHI RED',scheme:'light',paper:'#f4efe5',surface:'#fffaf0',ink:'#261b16',muted:'#73655b',line:'#d5c6b6',accent:'#d9483b',soft:'#f3c2b8',icon:'◎'},
  {id:'cyber',name:'CYBER',scheme:'dark',paper:'#050809',surface:'#0b1112',ink:'#eaffff',muted:'#8caaaa',line:'#244245',accent:'#49ffd7',soft:'#123f39',icon:'⚡'},
  {id:'deep-sea',name:'DEEP SEA',scheme:'dark',paper:'#041116',surface:'#092029',ink:'#e8fbff',muted:'#8fafb7',line:'#214650',accent:'#28d7ff',soft:'#0c3a48',icon:'◈'},
  {id:'forest-night',name:'FOREST NIGHT',scheme:'dark',paper:'#07110b',surface:'#102018',ink:'#effff4',muted:'#9bb5a4',line:'#2c4938',accent:'#64e58c',soft:'#173b25',icon:'❖'},
  {id:'peach',name:'PEACH',scheme:'light',paper:'#fff3eb',surface:'#fffaf6',ink:'#2d1b15',muted:'#80685d',line:'#e8cdbf',accent:'#ff9f7a',soft:'#ffd8c7',icon:'☼'},
  {id:'cobalt',name:'COBALT',scheme:'light',paper:'#eef2ff',surface:'#fbfcff',ink:'#111a3a',muted:'#5d688c',line:'#c4ccec',accent:'#5578ff',soft:'#d5ddff',icon:'◉'},
  {id:'chocolate',name:'CHOCOLATE',scheme:'dark',paper:'#130d0a',surface:'#211712',ink:'#fff5eb',muted:'#c0aa98',line:'#4c392e',accent:'#e7a56c',soft:'#462d1f',icon:'◍'},
  {id:'aurora-night',name:'AURORA NIGHT',scheme:'dark',paper:'#070d12',surface:'#101922',ink:'#f0fbff',muted:'#9bb2be',line:'#29434d',accent:'#7cffc4',soft:'#1d4050',icon:'✧'},
  {id:'lemon',name:'LEMON',scheme:'light',paper:'#fffce7',surface:'#fffff8',ink:'#26230d',muted:'#79734c',line:'#e5dcaa',accent:'#f5df36',soft:'#fff3a3',icon:'●'},
  {id:'ice',name:'ICE',scheme:'light',paper:'#f1f8ff',surface:'#fbfdff',ink:'#10233a',muted:'#60778f',line:'#c9dbea',accent:'#8bc9ff',soft:'#d9eeff',icon:'❄'},
  {id:'retro-blue',name:'RETRO BLUE',scheme:'dark',paper:'#0b1020',surface:'#151c31',ink:'#fff8dc',muted:'#c0b99b',line:'#47506b',accent:'#ffcf4a',soft:'#39405a',icon:'▣'}
];

if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home missing for color mode injection.');
let html = fs.readFileSync(homePath, 'utf8');

const themeRules = THEMES.map((theme)=>`html[data-levelup-theme="${theme.id}"]{color-scheme:${theme.scheme}!important;--lu-paper:${theme.paper}!important;--lu-surface:${theme.surface}!important;--lu-ink:${theme.ink}!important;--lu-muted:${theme.muted}!important;--lu-line:${theme.line}!important;--lu-lime:${theme.accent}!important;--lu-lime-soft:${theme.soft}!important;--lu-cat-paper:${theme.paper}!important;--lu-cat-card:${theme.surface}!important;--lu-cat-ink:${theme.ink}!important;--lu-cat-muted:${theme.muted}!important;--lu-cat-line:${theme.line}!important;--lu-cat-lime:${theme.accent}!important;--lu-cat-lime-soft:${theme.soft}!important}`).join('\n');
const themeIds = THEMES.map((theme)=>theme.id);
const controllerModes = THEMES.map(({id,name,paper,icon})=>({id,name,meta:paper,icon}));

const headInjection = `
<script id="levelup-color-mode-bootstrap-v1">
(()=>{
  const KEY='hitobito-levelup-color-mode-v1';
  const THEMES=${JSON.stringify(themeIds)};
  let theme='lime';
  try{const saved=localStorage.getItem(KEY);if(THEMES.includes(saved))theme=saved;}catch{}
  document.documentElement.dataset.levelupTheme=theme;
})();
</script>
<style id="levelup-color-mode-v1">
  .levelup-theme-toggle{--mode-accent:#dfff4f;flex:0 0 auto;width:44px;height:44px;display:grid;place-items:center;padding:0;border:1px solid #bdb9ad;border-radius:50%;background:#fffef8;color:#11110f;box-shadow:inset 0 -5px 0 var(--mode-accent);cursor:pointer;font:inherit;font-size:19px;line-height:1;-webkit-tap-highlight-color:transparent;transition:background-color .16s ease,color .16s ease,border-color .16s ease,transform .16s ease,box-shadow .16s ease}
  .levelup-theme-toggle:hover{border-color:currentColor;transform:translateY(-1px)}
  .levelup-theme-toggle:active{transform:scale(.95)}
  .levelup-theme-toggle:focus-visible{outline:3px solid var(--mode-accent);outline-offset:3px}
  ${themeRules}
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
  html[data-levelup-theme] body .lu-v3-problem,html[data-levelup-theme] body .lu-v3-problem:nth-child(3n+2),html[data-levelup-theme] body .lu-v3-problem:nth-child(3n),html[data-levelup-theme] body .lu-v3-problem[style]{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:inset 7px 0 0 var(--lu-lime)!important}
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
  html[data-levelup-theme] body .catalog-divider[data-kind="favorite"] strong,html[data-levelup-theme] body .catalog-divider[data-kind="new"] strong,html[data-levelup-theme] body .catalog-divider[data-kind="popular"] strong,html[data-levelup-theme] body .catalog-divider[data-category] strong{color:var(--lu-ink)!important;background:linear-gradient(transparent 56%,var(--lu-lime) 56%,var(--lu-lime) 92%,transparent 92%)!important}
  html[data-levelup-theme] body .premium-book-card,html[data-levelup-theme] body .premium-book-card.title-long,html[data-levelup-theme] body .premium-book-card.title-xlong,html[data-levelup-theme] body .levelup-category-card[data-category],html[data-levelup-theme] body .premium-theme-1,html[data-levelup-theme] body .premium-theme-2,html[data-levelup-theme] body .premium-theme-3,html[data-levelup-theme] body .premium-theme-4,html[data-levelup-theme] body .premium-theme-5,html[data-levelup-theme] body .premium-theme-6,html[data-levelup-theme] body .premium-theme-7,html[data-levelup-theme] body .premium-theme-8{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important;box-shadow:none!important}
  html[data-levelup-theme] body .premium-book-card:before{background:var(--lu-lime)!important}
  html[data-levelup-theme] body .premium-book-card:hover{border-color:var(--lu-ink)!important}
  html[data-levelup-theme] body .premium-book-card h2,html[data-levelup-theme] body .premium-book-card.title-long h2,html[data-levelup-theme] body .premium-book-card.title-xlong h2{color:var(--lu-ink)!important}
  html[data-levelup-theme] body .premium-book-card .book-obi{color:var(--lu-muted)!important}
  html[data-levelup-theme] body .premium-book-card .favorite{background:var(--lu-surface)!important;color:var(--lu-ink)!important;border-color:var(--lu-line)!important}
  html[data-levelup-theme] body .premium-book-card .favorite.is-on,html[data-levelup-theme] body .premium-book-card .favorite[aria-pressed="true"]{background:var(--lu-lime)!important;color:#11110f!important;border-color:var(--lu-ink)!important}
  html[data-levelup-theme] body .lu-categories,html[data-levelup-theme] body .lu-categories-head h2{color:var(--lu-cat-ink)!important}
  html[data-levelup-theme] body .lu-categories-head span{color:var(--lu-cat-muted)!important}
  html[data-levelup-theme] body #levelup-category-all{background:var(--lu-cat-card)!important;color:var(--lu-cat-ink)!important;border-color:var(--lu-cat-line)!important;box-shadow:none!important}
  html[data-levelup-theme] body #levelup-category-all::after{background:var(--lu-cat-lime)!important;color:#11110f!important}
  html[data-levelup-theme] body .lu-category-card,html[data-levelup-theme] body .lu-category-card.tone-black,html[data-levelup-theme] body .lu-category-card.tone-red,html[data-levelup-theme] body .lu-category-card.tone-green,html[data-levelup-theme] body .lu-category-card.tone-navy,html[data-levelup-theme] body .lu-category-card.tone-purple,html[data-levelup-theme] body .lu-category-card.tone-ochre{background:var(--lu-cat-card)!important;color:var(--lu-cat-ink)!important;border-color:var(--lu-cat-line)!important;box-shadow:none!important}
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
  const MODES=${JSON.stringify(controllerModes)};
  const root=document.documentElement;
  const button=document.getElementById('levelup-theme-toggle');
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(!button)return;
  const indexOf=()=>Math.max(0,MODES.findIndex(mode=>mode.id===root.dataset.levelupTheme));
  const apply=(mode,persist=false)=>{
    root.dataset.levelupTheme=mode.id;
    button.dataset.mode=mode.id;
    button.setAttribute('aria-label','カラーモードを切り替える。現在 '+mode.name);
    button.setAttribute('title','COLOR MODE · '+mode.name+' · '+(indexOf()+1)+' / '+MODES.length);
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
for (const token of [MARKER, BUTTON, SCRIPT, 'hitobito-levelup-color-mode-v1', ...themeIds, 'カラーモードを切り替える']) {
  if (!out.includes(token)) throw new Error(`LEVEL UP color mode missing ${token}`);
}
console.log(`[Firebase] LEVEL UP home color modes injected: ${THEMES.length} themes.`);
