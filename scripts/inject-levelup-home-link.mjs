import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');

if (!fs.existsSync(appsDir)) {
  throw new Error('Firebase apps bundle not found. Run build:hosting first.');
}

const marker = 'id="levelup-nav-fixed"';
const snippet = `
<style id="levelup-nav-fixed-style">
  #levelup-nav-fixed{position:fixed;z-index:2147483647;top:max(10px,env(safe-area-inset-top));left:max(6px,env(safe-area-inset-left));font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;color:#f5f7f0}
  #levelup-nav-toggle{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.24);border-radius:14px;background:rgba(12,16,24,.82);color:#d8ff5b;box-shadow:0 8px 28px rgba(0,0,0,.28);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);-webkit-tap-highlight-color:transparent;touch-action:manipulation;cursor:pointer}
  #levelup-nav-toggle svg{width:21px;height:21px;display:block}
  #levelup-nav-toggle:hover,#levelup-nav-toggle:focus-visible{border-color:rgba(216,255,91,.58);background:rgba(24,31,18,.92)}
  #levelup-nav-toggle:focus-visible{outline:3px solid rgba(216,255,91,.5);outline-offset:3px}
  #levelup-nav-toggle:active{transform:scale(.94)}
  #levelup-nav-menu{position:absolute;top:50px;left:0;width:min(260px,calc(100vw - 16px));padding:8px;border:1px solid rgba(216,255,91,.22);border-radius:18px;background:rgba(12,16,14,.96);box-shadow:0 18px 54px rgba(0,0,0,.44);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);opacity:0;transform:translateY(-5px) scale(.98);pointer-events:none;transition:.14s ease;transform-origin:top left}
  #levelup-nav-fixed.open #levelup-nav-menu{opacity:1;transform:none;pointer-events:auto}
  .levelup-nav-item{width:100%;min-height:46px;display:flex;align-items:center;gap:11px;padding:0 12px;border:0;border-radius:12px;background:transparent;color:#f3f5ef;text-decoration:none;font:inherit;font-size:13px;font-weight:850;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .levelup-nav-item:hover,.levelup-nav-item:focus-visible{background:rgba(216,255,91,.1);color:#e9ff9c;outline:none}
  .levelup-nav-icon{width:22px;text-align:center;font-size:17px;line-height:1}
  .levelup-nav-sep{height:1px;margin:5px 8px;background:rgba(255,255,255,.09)}
  #levelup-feedback-root #lu-fb-fab{display:none!important}
  @media(prefers-reduced-motion:reduce){#levelup-nav-menu{transition:none}}
</style>
<div id="levelup-nav-fixed">
  <button id="levelup-nav-toggle" type="button" aria-label="LEVEL UPメニューを開く" aria-expanded="false" aria-controls="levelup-nav-menu">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6.5h16M4 12h16M4 17.5h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
  </button>
  <nav id="levelup-nav-menu" aria-label="LEVEL UPメニュー">
    <a class="levelup-nav-item" href="https://levelup.hitobito.jp/"><span class="levelup-nav-icon">⌂</span><span>LEVEL UP ホーム</span></a>
    <a class="levelup-nav-item" href="https://play.hitobito.jp/"><span class="levelup-nav-icon">▶</span><span>ゲームで遊ぶ</span></a>
    <button class="levelup-nav-item" id="levelup-nav-account" type="button"><span class="levelup-nav-icon">♥</span><span>お気に入り・履歴</span></button>
    <div class="levelup-nav-sep"></div>
    <button class="levelup-nav-item" id="levelup-nav-feedback" type="button"><span class="levelup-nav-icon">✎</span><span>改善を送る</span></button>
  </nav>
</div>
<script id="levelup-nav-fixed-script">
(() => {
  const host=document.getElementById('levelup-nav-fixed');
  const toggle=document.getElementById('levelup-nav-toggle');
  const account=document.getElementById('levelup-nav-account');
  const feedback=document.getElementById('levelup-nav-feedback');
  if(!host||!toggle)return;
  const close=()=>{host.classList.remove('open');toggle.setAttribute('aria-expanded','false')};
  const open=()=>{host.classList.add('open');toggle.setAttribute('aria-expanded','true')};
  toggle.addEventListener('click',()=>host.classList.contains('open')?close():open());
  document.addEventListener('click',e=>{if(!host.contains(e.target))close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  const accountRoot=()=>document.getElementById('levelup-account-root')?.shadowRoot;
  const hideAccountTrigger=()=>{const trigger=accountRoot()?.querySelector('.trigger');if(trigger){trigger.style.display='none';return true}return false};
  if(!hideAccountTrigger()){
    const observer=new MutationObserver(()=>{if(hideAccountTrigger())observer.disconnect()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }
  account?.addEventListener('click',()=>{close();const trigger=accountRoot()?.querySelector('.trigger');if(trigger){trigger.click();return}location.href='https://levelup.hitobito.jp/'});
  feedback?.addEventListener('click',()=>{close();const trigger=document.getElementById('lu-fb-fab');if(trigger){trigger.click();return}alert('改善フォームを読み込み中です。少ししてからもう一度お試しください。')});
})();
</script>
`;

let count = 0;
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;

  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(marker)) continue;
  if (html.includes('</body>')) html = html.replace('</body>', `${snippet}</body>`);
  else html += snippet;
  fs.writeFileSync(indexPath, html);
  count++;
}

if (!count) throw new Error('No LEVEL UP game pages received the persistent navigation menu.');
console.log(`[Firebase] Persistent LEVEL UP navigation menu injected: ${count} games`);
