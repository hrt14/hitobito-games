import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const menuMarker = 'data-levelup-app-menu';
const dedupeStyleMarker = 'id="levelup-app-menu-dedupe-style"';
const dedupeScriptMarker = 'id="levelup-app-menu-dedupe-script"';

if (!fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after build:firebase app menu injection.');
}

const dedupeStyle = `
<style id="levelup-app-menu-dedupe-style">
  /* App pages use the newer right-side favorite/account menu. Hide the legacy left nav to avoid two hamburger buttons. */
  #levelup-nav-fixed{display:none!important}
</style>`;

const dedupeScript = `
<script id="levelup-app-menu-dedupe-script">
(() => {
  const legacyNav = document.getElementById('levelup-nav-fixed');
  if (legacyNav) legacyNav.remove();
})();
</script>`;

let updated = 0;
let verified = 0;

for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;

  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(menuMarker)) continue;

  if (!html.includes(dedupeStyleMarker)) {
    html = html.includes('</head>')
      ? html.replace('</head>', `${dedupeStyle}\n</head>`)
      : `${dedupeStyle}\n${html}`;
  }

  if (!html.includes(dedupeScriptMarker)) {
    html = html.includes('</body>')
      ? html.replace('</body>', `${dedupeScript}\n</body>`)
      : `${html}\n${dedupeScript}`;
  }

  fs.writeFileSync(indexPath, html);
  updated += 1;
}

for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(menuMarker)) continue;

  if (!html.includes(dedupeStyleMarker) || !html.includes(dedupeScriptMarker) || !html.includes('#levelup-nav-fixed{display:none!important}')) {
    throw new Error(`LEVEL UP duplicate hamburger guard missing from ${entry.name}`);
  }
  verified += 1;
}

if (!verified) {
  throw new Error('LEVEL UP duplicate hamburger guard found no app pages to verify.');
}

console.log(`[Firebase] LEVEL UP duplicate hamburger guard applied to ${updated} pages; verified ${verified}`);
