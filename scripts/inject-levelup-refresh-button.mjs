import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');

if (!fs.existsSync(homePath)) {
  throw new Error('Firebase LEVEL UP home not found. Run build:firebase after the home is generated.');
}

let html = fs.readFileSync(homePath, 'utf8');
const marker = 'id="levelup-refresh"';

if (!html.includes(marker)) {
  const snippet = `
<style id="levelup-refresh-style">
  #levelup-refresh{
    position:fixed;
    z-index:2147483647;
    right:max(14px,env(safe-area-inset-right));
    bottom:max(16px,env(safe-area-inset-bottom));
    min-width:94px;
    height:48px;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    border:1px solid rgba(216,255,91,.42);
    border-radius:999px;
    background:rgba(15,19,12,.92);
    color:#d8ff5b;
    padding:0 16px;
    font:900 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;
    letter-spacing:.04em;
    box-shadow:0 12px 38px rgba(0,0,0,.38);
    -webkit-backdrop-filter:blur(14px);
    backdrop-filter:blur(14px);
    cursor:pointer;
    touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
  }
  #levelup-refresh:active{transform:scale(.96)}
  #levelup-refresh.is-loading{opacity:.72;pointer-events:none}
  #levelup-refresh .refresh-icon{font-size:19px;line-height:1}
</style>
<button id="levelup-refresh" type="button" aria-label="最新のLEVEL UPトップページに更新する">
  <span class="refresh-icon" aria-hidden="true">↻</span><span>更新</span>
</button>
<script>
  (() => {
    const refreshKey = '_levelup_refresh';
    const current = new URL(location.href);
    if (current.searchParams.has(refreshKey)) {
      current.searchParams.delete(refreshKey);
      history.replaceState(null, '', current.pathname + (current.search ? current.search : '') + current.hash);
    }

    const button = document.getElementById('levelup-refresh');
    button?.addEventListener('click', () => {
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      const url = new URL(location.href);
      url.searchParams.set(refreshKey, Date.now().toString());
      location.replace(url.toString());
    });
  })();
</script>
`;

  if (html.includes('</body>')) html = html.replace('</body>', `${snippet}</body>`);
  else html += snippet;
  fs.writeFileSync(homePath, html);
}

if (!fs.readFileSync(homePath, 'utf8').includes(marker)) {
  throw new Error('LEVEL UP refresh button injection failed.');
}

console.log('[Firebase] LEVEL UP refresh button injected');
