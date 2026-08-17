import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');

if (!fs.existsSync(appsDir)) {
  throw new Error('Firebase apps bundle not found. Run build:hosting first.');
}

const marker = 'id="levelup-home-fixed"';
const snippet = `
<style id="levelup-home-fixed-style">
  #levelup-home-fixed{
    position:fixed;
    z-index:2147483647;
    top:max(10px,env(safe-area-inset-top));
    left:max(10px,env(safe-area-inset-left));
    width:46px;
    height:46px;
    display:grid;
    place-items:center;
    border:1px solid rgba(255,255,255,.24);
    border-radius:15px;
    background:rgba(12,16,24,.82);
    color:#d8ff5b;
    text-decoration:none;
    box-shadow:0 8px 28px rgba(0,0,0,.28);
    -webkit-backdrop-filter:blur(12px);
    backdrop-filter:blur(12px);
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
  }
  #levelup-home-fixed svg{width:24px;height:24px;display:block}
  #levelup-home-fixed:hover{border-color:rgba(216,255,91,.58);background:rgba(24,31,18,.92)}
  #levelup-home-fixed:focus-visible{outline:3px solid rgba(216,255,91,.5);outline-offset:3px}
  #levelup-home-fixed:active{transform:scale(.94)}
</style>
<a id="levelup-home-fixed" href="https://levelup.hitobito.jp/" aria-label="LEVEL UPトップへ戻る" title="LEVEL UPトップへ戻る">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3.5 10.5 12 3.25l8.5 7.25v9.25a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</a>
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

if (!count) throw new Error('No LEVEL UP game pages received the persistent home link.');
console.log(`[Firebase] Persistent LEVEL UP home link injected: ${count} games`);
