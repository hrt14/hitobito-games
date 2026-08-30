import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const BOOTSTRAP_MARKER = 'id="levelup-app-theme-sync-bootstrap-v1"';
const RUNTIME_MARKER = 'id="levelup-app-theme-sync-runtime-v1"';

const THEMES = {
  lime:{id:'lime',scheme:'light',paper:'#f3f1e8',surface:'#fffef8',ink:'#11110f',muted:'#66645d',line:'#cbc8bd',accent:'#dfff4f',soft:'#efffa8'},
  'violet-night':{id:'violet-night',scheme:'dark',paper:'#0d0a12',surface:'#17121f',ink:'#f8f3ff',muted:'#b8adc4',line:'#3e344a',accent:'#bf83ff',soft:'#332044'},
  sky:{id:'sky',scheme:'light',paper:'#eef7f8',surface:'#fbffff',ink:'#0d1719',muted:'#53686d',line:'#bed2d6',accent:'#70e7ff',soft:'#cdf7ff'},
  'sunset-night':{id:'sunset-night',scheme:'dark',paper:'#110b08',surface:'#1d1511',ink:'#fff5ee',muted:'#c4afa2',line:'#4a3930',accent:'#ff9a5b',soft:'#432718'},
  sakura:{id:'sakura',scheme:'light',paper:'#fff4f7',surface:'#fffafd',ink:'#2b1720',muted:'#805f6b',line:'#e9c8d2',accent:'#ff78a5',soft:'#ffd5e3'},
  matcha:{id:'matcha',scheme:'light',paper:'#f2f4e8',surface:'#fbfcef',ink:'#182315',muted:'#66705c',line:'#c9d0b5',accent:'#9acb53',soft:'#dff0bc'},
  ocean:{id:'ocean',scheme:'light',paper:'#eaf7f7',surface:'#f7ffff',ink:'#09252b',muted:'#54747a',line:'#b9d9dd',accent:'#20c5c9',soft:'#c4f1f2'},
  'midnight-blue':{id:'midnight-blue',scheme:'dark',paper:'#07101f',surface:'#0e1b31',ink:'#edf5ff',muted:'#9eb0c9',line:'#2c4161',accent:'#6aa9ff',soft:'#193760'},
  'rose-night':{id:'rose-night',scheme:'dark',paper:'#160a11',surface:'#25121c',ink:'#fff1f6',muted:'#c2a0ae',line:'#543141',accent:'#ff6e9f',soft:'#4a1d30'},
  amber:{id:'amber',scheme:'light',paper:'#fff7e8',surface:'#fffdf7',ink:'#2a1d09',muted:'#7d6a4c',line:'#ead4aa',accent:'#ffbf3f',soft:'#ffe6a8'},
  mint:{id:'mint',scheme:'light',paper:'#edf9f3',surface:'#fbfffd',ink:'#10271d',muted:'#5d766a',line:'#bfddd0',accent:'#62dfa9',soft:'#cbf4df'},
  lavender:{id:'lavender',scheme:'light',paper:'#f6f1fb',surface:'#fefbff',ink:'#251b31',muted:'#71647f',line:'#d8cbe5',accent:'#b58cff',soft:'#e6d9ff'},
  mono:{id:'mono',scheme:'light',paper:'#f0f0ee',surface:'#ffffff',ink:'#111111',muted:'#666666',line:'#c8c8c5',accent:'#9d9d99',soft:'#ddddda'},
  'washi-red':{id:'washi-red',scheme:'light',paper:'#f4efe5',surface:'#fffaf0',ink:'#261b16',muted:'#73655b',line:'#d5c6b6',accent:'#d9483b',soft:'#f3c2b8'},
  cyber:{id:'cyber',scheme:'dark',paper:'#050809',surface:'#0b1112',ink:'#eaffff',muted:'#8caaaa',line:'#244245',accent:'#49ffd7',soft:'#123f39'},
  'deep-sea':{id:'deep-sea',scheme:'dark',paper:'#041116',surface:'#092029',ink:'#e8fbff',muted:'#8fafb7',line:'#214650',accent:'#28d7ff',soft:'#0c3a48'},
  'forest-night':{id:'forest-night',scheme:'dark',paper:'#07110b',surface:'#102018',ink:'#effff4',muted:'#9bb5a4',line:'#2c4938',accent:'#64e58c',soft:'#173b25'},
  peach:{id:'peach',scheme:'light',paper:'#fff3eb',surface:'#fffaf6',ink:'#2d1b15',muted:'#80685d',line:'#e8cdbf',accent:'#ff9f7a',soft:'#ffd8c7'},
  cobalt:{id:'cobalt',scheme:'light',paper:'#eef2ff',surface:'#fbfcff',ink:'#111a3a',muted:'#5d688c',line:'#c4ccec',accent:'#5578ff',soft:'#d5ddff'},
  chocolate:{id:'chocolate',scheme:'dark',paper:'#130d0a',surface:'#211712',ink:'#fff5eb',muted:'#c0aa98',line:'#4c392e',accent:'#e7a56c',soft:'#462d1f'},
  'aurora-night':{id:'aurora-night',scheme:'dark',paper:'#070d12',surface:'#101922',ink:'#f0fbff',muted:'#9bb2be',line:'#29434d',accent:'#7cffc4',soft:'#1d4050'},
  lemon:{id:'lemon',scheme:'light',paper:'#fffce7',surface:'#fffff8',ink:'#26230d',muted:'#79734c',line:'#e5dcaa',accent:'#f5df36',soft:'#fff3a3'},
  ice:{id:'ice',scheme:'light',paper:'#f1f8ff',surface:'#fbfdff',ink:'#10233a',muted:'#60778f',line:'#c9dbea',accent:'#8bc9ff',soft:'#d9eeff'},
  'retro-blue':{id:'retro-blue',scheme:'dark',paper:'#0b1020',surface:'#151c31',ink:'#fff8dc',muted:'#c0b99b',line:'#47506b',accent:'#ffcf4a',soft:'#39405a'}
};

if (!fs.existsSync(appsDir)) throw new Error('LEVEL UP apps bundle missing for app theme sync.');

const bootstrap = `
<script id="levelup-app-theme-sync-bootstrap-v1">
(()=>{
  const KEY='hitobito-levelup-color-mode-v1';
  const THEMES=${JSON.stringify(THEMES)};
  let id='lime';
  try{const saved=localStorage.getItem(KEY);if(saved&&THEMES[saved])id=saved;}catch{}
  const t=THEMES[id]||THEMES.lime;
  const root=document.documentElement;
  root.dataset.levelupTheme=t.id;
  root.dataset.levelupAppScheme=t.scheme;
  root.style.colorScheme=t.scheme;
  const vars={paper:t.paper,surface:t.surface,ink:t.ink,muted:t.muted,line:t.line,accent:t.accent,soft:t.soft};
  for(const [name,value] of Object.entries(vars))root.style.setProperty('--levelup-theme-'+name,value);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',t.paper);
  else{const m=document.createElement('meta');m.name='theme-color';m.content=t.paper;document.head.appendChild(m)}
})();
</script>
<style id="levelup-app-theme-sync-style-v1">
  html[data-levelup-app-scheme="dark"]{color-scheme:dark!important;background:var(--levelup-theme-paper)!important}
  html[data-levelup-app-scheme="dark"] body{background-color:var(--levelup-theme-paper)!important;color:var(--levelup-theme-ink)!important}
  html[data-levelup-app-scheme="dark"] :where(input,textarea,select){color-scheme:dark!important}
  html[data-levelup-app-scheme="dark"] [data-levelup-dark-surface="1"]{background-color:var(--levelup-theme-surface)!important;color:var(--levelup-theme-ink)!important}
</style>`;

const runtime = `
<script id="levelup-app-theme-sync-runtime-v1">
(()=>{
  if(window.__LEVELUP_APP_THEME_SYNC_V1__)return;window.__LEVELUP_APP_THEME_SYNC_V1__=true;
  const root=document.documentElement;
  if(root.dataset.levelupAppScheme!=="dark")return;
  const readVar=(name,fallback)=>getComputedStyle(root).getPropertyValue(name).trim()||fallback;
  const t={paper:readVar('--levelup-theme-paper','#0d0a12'),surface:readVar('--levelup-theme-surface','#17121f'),ink:readVar('--levelup-theme-ink','#f8f3ff'),muted:readVar('--levelup-theme-muted','#b8adc4'),line:readVar('--levelup-theme-line','#3e344a'),accent:readVar('--levelup-theme-accent','#bf83ff'),soft:readVar('--levelup-theme-soft','#332044')};
  const rgba=(value)=>{const m=String(value||'').match(/rgba?\\(\\s*(\\d+(?:\\.\\d+)?)\\s*[, ]\\s*(\\d+(?:\\.\\d+)?)\\s*[, ]\\s*(\\d+(?:\\.\\d+)?)(?:\\s*[,/]\\s*(\\d+(?:\\.\\d+)?))?\\s*\\)/i);return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]}:null};
  const nearWhite=(c)=>c&&c.a>.35&&c.r>=232&&c.g>=232&&c.b>=232;
  const nearBlack=(c)=>c&&c.a>.35&&c.r<=48&&c.g<=48&&c.b<=48;
  let adapting=false;
  const adapt=()=>{
    if(adapting)return;adapting=true;
    try{
      const viewport=Math.max(1,innerWidth*innerHeight);
      const candidates=new Set([document.body,...document.body.children,...document.querySelectorAll('main,#app,#root,.app,.page,.screen,.view,.container,.wrapper,.wrap,.shell,.content')]);
      for(const el of candidates){
        if(!(el instanceof HTMLElement)||el===document.body)continue;
        const rect=el.getBoundingClientRect();
        if(rect.width*rect.height<viewport*.12)continue;
        const cs=getComputedStyle(el);
        if(cs.backgroundImage&&cs.backgroundImage!=='none')continue;
        const bg=rgba(cs.backgroundColor);
        if(!nearWhite(bg))continue;
        el.dataset.levelupDarkSurface='1';
        el.style.setProperty('background-color',t.surface,'important');
        if(nearBlack(rgba(cs.color)))el.style.setProperty('color',t.ink,'important');
      }
    }finally{adapting=false}
  };
  const syncMenu=()=>{
    const host=document.getElementById('levelup-app-menu-root');
    const shadow=host?.shadowRoot;
    if(!shadow)return false;
    host.style.setProperty('--levelup-menu-paper',t.paper);
    host.style.setProperty('--levelup-menu-surface',t.surface);
    host.style.setProperty('--levelup-menu-ink',t.ink);
    host.style.setProperty('--levelup-menu-muted',t.muted);
    host.style.setProperty('--levelup-menu-line',t.line);
    host.style.setProperty('--levelup-menu-accent',t.accent);
    host.style.setProperty('--levelup-menu-soft',t.soft);
    let style=shadow.getElementById('levelup-selected-theme-menu-v1');
    if(!style){style=document.createElement('style');style.id='levelup-selected-theme-menu-v1';shadow.appendChild(style)}
    style.textContent=':host{color-scheme:dark!important;--lu-lime:var(--levelup-menu-accent)!important;--lu-bg:var(--levelup-menu-paper)!important;--lu-text:var(--levelup-menu-ink)!important;--lu-muted:var(--levelup-menu-muted)!important;--lu-line:var(--levelup-menu-line)!important}.menu-trigger{background:var(--levelup-menu-surface)!important;color:var(--levelup-menu-ink)!important;border-color:var(--levelup-menu-line)!important;box-shadow:0 8px 24px rgba(0,0,0,.34)!important}.hamburger span{background:var(--levelup-menu-ink)!important}.backdrop{background:rgba(0,0,0,.68)!important}.sheet{background:var(--levelup-menu-paper)!important;color:var(--levelup-menu-ink)!important;border-color:var(--levelup-menu-line)!important;box-shadow:0 28px 80px rgba(0,0,0,.46)!important}.kicker{color:var(--levelup-menu-ink)!important;background:linear-gradient(transparent 54%,var(--levelup-menu-accent) 54%,var(--levelup-menu-accent) 91%,transparent 91%)!important}.title{color:var(--levelup-menu-ink)!important}.close,.action{background:var(--levelup-menu-surface)!important;color:var(--levelup-menu-ink)!important;border-color:var(--levelup-menu-line)!important}.action:hover{background:var(--levelup-menu-soft)!important;border-color:var(--levelup-menu-accent)!important}.action-icon{background:var(--levelup-menu-soft)!important;color:var(--levelup-menu-ink)!important}.favorite.is-on .action-icon{background:var(--levelup-menu-accent)!important;color:var(--levelup-menu-paper)!important}.action-copy strong{color:var(--levelup-menu-ink)!important}.action-copy small,.status{color:var(--levelup-menu-muted)!important}.status.ok{color:var(--levelup-menu-accent)!important}.status.error{color:var(--levelup-menu-muted)!important}';
    return true;
  };
  adapt();
  let attempts=0;const menuTimer=setInterval(()=>{attempts+=1;if(syncMenu()||attempts>120)clearInterval(menuTimer)},50);
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(adapt,30)};
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(adapt,0),true);
  addEventListener('hashchange',adapt);
  addEventListener('popstate',adapt);
})();
</script>`;

let injected = 0;
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(BOOTSTRAP_MARKER) || html.includes(RUNTIME_MARKER)) continue;
  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error(`LEVEL UP app shell missing in ${entry.name}`);
  html = html.replace('</head>', `${bootstrap}\n</head>`);
  html = html.replace('</body>', `${runtime}\n</body>`);
  fs.writeFileSync(indexPath, html);
  injected += 1;
}

if (!injected) throw new Error('LEVEL UP app theme sync was not injected into any app page.');
console.log(`[Firebase] LEVEL UP selected theme now persists into ${injected} app pages.`);
