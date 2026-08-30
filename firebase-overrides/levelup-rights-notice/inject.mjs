import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const MARKER = 'id="levelup-rights-notice-v1"';
const HOME_LAYOUT_MARKER = 'id="levelup-home-header-cleanup-v2"';

if (!fs.existsSync(outDir)) throw new Error('LEVEL UP Firebase bundle missing for rights notice injection.');

function walk(dirPath, out = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const injection = `
<script id="levelup-rights-notice-v1">
(()=>{
  if(window.__LEVELUP_RIGHTS_NOTICE_V1__)return;window.__LEVELUP_RIGHTS_NOTICE_V1__=true;
  const mount=()=>{
    const panel=document.getElementById('lu-fb-panel');
    const types=document.getElementById('lu-fb-types');
    const textarea=document.getElementById('lu-fb-message');
    if(!panel||!types||!textarea)return false;
    let note=document.getElementById('lu-fb-rights-note');
    if(!note){
      note=document.createElement('div');
      note.id='lu-fb-rights-note';
      note.setAttribute('role','note');
      note.innerHTML='<strong>アプリ制作に関する注意</strong><span>制作・生成された内容について、著作権その他の権利の成立・帰属は保証されません。第三者の著作物・商標・キャラクター等の無断利用は避けてください。</span>';
      textarea.insertAdjacentElement('afterend',note);
      const style=document.createElement('style');
      style.id='lu-fb-rights-note-style';
      style.textContent='#lu-fb-rights-note{display:none;margin:10px 0 2px;padding:10px 11px;border:1px solid rgba(216,255,91,.22);border-radius:12px;background:rgba(216,255,91,.06);font-size:12px;line-height:1.55}#lu-fb-rights-note.on{display:block}#lu-fb-rights-note strong{display:block;margin-bottom:3px;color:#d8ff5b;font-size:12px}#lu-fb-rights-note span{display:block;color:#c4cbbf}';
      document.head.appendChild(style);
    }
    const sync=()=>{const idea=types.querySelector('[data-type="idea"]');note.classList.toggle('on',Boolean(idea?.classList.contains('on')))};
    types.addEventListener('click',()=>setTimeout(sync,0));
    sync();
    return true;
  };
  if(mount())return;
  let attempts=0;const timer=setInterval(()=>{attempts+=1;if(mount()||attempts>120)clearInterval(timer)},50);
})();
</script>`;

let injected = 0;
for (const filePath of walk(outDir)) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(MARKER) || !html.includes('data-levelup-feedback-v1') || !html.includes('</body>')) continue;
  html = html.replace('</body>', `${injection}\n</body>`);
  fs.writeFileSync(filePath, html);
  injected += 1;
}

if (!injected) throw new Error('LEVEL UP rights notice was not injected into any feedback-enabled page.');

const homeLayout = `
<style id="levelup-home-header-cleanup-v2">
  /* Keep the first screen calm and clear the iPhone status bar reliably. */
  body{
    --lu-status-clearance:max(54px,calc(env(safe-area-inset-top) + 20px));
  }
  body .top{
    position:relative!important;
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    align-items:center!important;
    gap:10px!important;
    min-height:58px!important;
    padding:8px 0 14px 60px!important;
  }
  body .brand{
    min-width:0!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
    font-size:12px!important;
    letter-spacing:.12em!important;
  }
  body .levelup-top-actions{
    min-width:0!important;
    display:flex!important;
    align-items:center!important;
    justify-content:flex-end!important;
    gap:0!important;
    padding-right:max(2px,env(safe-area-inset-right))!important;
  }
  body .levelup-top-actions>a[href*="games.hitobito.jp"]{display:none!important}
  body #levelup-account-chip{
    width:auto!important;
    max-width:164px!important;
    min-height:38px!important;
    padding:4px 10px 4px 4px!important;
  }
  body #levelup-account-chip .account-name{max-width:112px!important}
  body #levelup-nav-fixed{
    top:max(10px,env(safe-area-inset-top))!important;
    left:max(12px,env(safe-area-inset-left))!important;
  }
  body .lu-home-hero{padding-top:38px!important}
  body .lu-home-eyebrow{margin-bottom:16px!important}
  body .lu-home-hero .hero-copy{margin-top:24px!important}
  body .lu-home-stats{margin-top:28px!important}
  body .lu-home-note{margin-top:18px!important}

  @media(max-width:650px){
    body .shell{
      width:min(100% - 22px,1120px)!important;
      padding-top:var(--lu-status-clearance)!important;
    }
    body .top{
      min-height:56px!important;
      padding:6px 0 12px 56px!important;
      gap:8px!important;
    }
    body .brand{
      font-size:12px!important;
      letter-spacing:.07em!important;
      transform:scale(.92);
      transform-origin:left center;
    }
    body #levelup-nav-fixed{
      top:calc(var(--lu-status-clearance) + 4px)!important;
      left:max(8px,env(safe-area-inset-left))!important;
    }
    body #levelup-nav-toggle{width:44px!important;height:44px!important;border-radius:14px!important}
    body #levelup-account-chip{
      max-width:104px!important;
      min-height:36px!important;
      padding-right:8px!important;
      margin-right:max(2px,env(safe-area-inset-right))!important;
    }
    body #levelup-account-chip .account-name{max-width:60px!important}
    body #levelup-account-chip .account-avatar,
    body #levelup-account-chip .account-avatar-fallback{width:26px!important;height:26px!important;flex-basis:26px!important}

    body .lu-home-hero{padding:30px 0 32px!important}
    body .lu-home-eyebrow{display:none!important}
    body .lu-home-hero h1{font-size:clamp(52px,15vw,72px)!important;line-height:.92!important}
    body .lu-home-hero .hero-copy{margin-top:18px!important;font-size:14px!important;line-height:1.7!important}
    body .lu-home-stats{gap:26px!important;margin-top:22px!important}
    body .lu-home-stats strong{font-size:36px!important}
    body .lu-home-stats span{font-size:12px!important;transform:scale(.82);transform-origin:left top}
    body .lu-home-note{display:none!important}
  }

  @media(max-width:390px){
    body{--lu-status-clearance:max(56px,calc(env(safe-area-inset-top) + 22px))}
    body .top{padding-left:54px!important}
    body .brand{
      font-size:12px!important;
      letter-spacing:.05em!important;
      transform:scale(.84);
      transform-origin:left center;
    }
    body #levelup-account-chip{max-width:88px!important;padding-right:7px!important}
    body #levelup-account-chip .account-name{max-width:44px!important}
  }
</style>`;

if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home missing for header cleanup.');
let home = fs.readFileSync(homePath, 'utf8');
if (!home.includes(HOME_LAYOUT_MARKER)) {
  if (!home.includes('</head>')) throw new Error('LEVEL UP home head missing for header cleanup.');
  home = home.replace('</head>', `${homeLayout}\n</head>`);
  fs.writeFileSync(homePath, home);
}

const finalHome = fs.readFileSync(homePath, 'utf8');
for (const token of [HOME_LAYOUT_MARKER, '--lu-status-clearance:max(54px', '.levelup-top-actions>a[href*="games.hitobito.jp"]', 'padding-top:var(--lu-status-clearance)', 'top:calc(var(--lu-status-clearance) + 4px)']) {
  if (!finalHome.includes(token)) throw new Error(`LEVEL UP home header cleanup missing ${token}`);
}

console.log(`[Firebase] LEVEL UP app-idea rights notice injected into ${injected} pages; iPhone status-bar-safe home header applied.`);
