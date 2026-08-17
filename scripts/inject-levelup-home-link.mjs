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
    color:#fff;
    text-decoration:none;
    font:900 24px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    box-shadow:0 8px 28px rgba(0,0,0,.28);
    -webkit-backdrop-filter:blur(12px);
    backdrop-filter:blur(12px);
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
  }
  #levelup-home-fixed:active{transform:scale(.94)}
</style>
<a id="levelup-home-fixed" href="https://levelup.hitobito.jp/" aria-label="LEVEL UPトップへ戻る" title="LEVEL UPトップへ戻る">‹</a>
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
