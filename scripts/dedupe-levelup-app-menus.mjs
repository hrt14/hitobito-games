import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const firebaseDir = path.join(root, '.dist', 'firebase');
const appsDir = path.join(firebaseDir, 'apps');
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

  // A few apps have their own top-right exit button. The shared fixed hamburger
  // occupies that same 46-48px corner, so move the hamburger left instead of
  // letting its shadow-DOM trigger intercept the app's exit control.
  const appExit = document.getElementById('exitBtn');
  const sharedMenuHost = document.getElementById('levelup-app-menu-root');
  const sharedTrigger = sharedMenuHost?.shadowRoot?.querySelector('.menu-trigger');
  if (appExit && sharedTrigger) sharedTrigger.style.right = '66px';
})();
</script>`;

function appEntries() {
  return fs.readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      slug: entry.name,
      appIndex: path.join(appsDir, entry.name, 'index.html'),
      rootIndex: path.join(firebaseDir, entry.name, 'index.html'),
    }))
    .filter((entry) => fs.existsSync(entry.appIndex));
}

function injectBeforeBody(html, snippet) {
  return html.includes('</body>') ? html.replace('</body>', `${snippet}\n</body>`) : `${html}\n${snippet}`;
}

const entries = appEntries();
let mirrored = 0;

// Some LEVEL UP apps are intentionally served at both /apps/<slug>/ and /<slug>/.
// The shared menu injector runs against /apps/<slug>/; mirror the exact injected
// menu block into each root alias so the public URL gets the same hamburger too.
for (const { slug, appIndex, rootIndex } of entries) {
  if (!fs.existsSync(rootIndex)) continue;

  const appHtml = fs.readFileSync(appIndex, 'utf8');
  let rootHtml = fs.readFileSync(rootIndex, 'utf8');
  if (!appHtml.includes(menuMarker) || rootHtml.includes(menuMarker)) continue;

  const menuMatch = appHtml.match(/<script\s+data-levelup-app-menu\b[\s\S]*?<\/script>/i);
  if (!menuMatch) {
    throw new Error(`LEVEL UP app menu block could not be mirrored to root alias: ${slug}`);
  }

  rootHtml = injectBeforeBody(rootHtml, menuMatch[0]);
  fs.writeFileSync(rootIndex, rootHtml);
  mirrored += 1;
}

const pages = [];
for (const { slug, appIndex, rootIndex } of entries) {
  pages.push({ slug, label: `apps/${slug}`, indexPath: appIndex });
  if (fs.existsSync(rootIndex)) pages.push({ slug, label: slug, indexPath: rootIndex });
}

let updated = 0;
let verified = 0;

for (const { indexPath } of pages) {
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(menuMarker)) continue;

  if (!html.includes(dedupeStyleMarker)) {
    html = html.includes('</head>')
      ? html.replace('</head>', `${dedupeStyle}\n</head>`)
      : `${dedupeStyle}\n${html}`;
  }

  if (!html.includes(dedupeScriptMarker)) {
    html = injectBeforeBody(html, dedupeScript);
  }

  fs.writeFileSync(indexPath, html);
  updated += 1;
}

for (const { label, indexPath } of pages) {
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(menuMarker)) continue;

  if (!html.includes(dedupeStyleMarker) || !html.includes(dedupeScriptMarker) || !html.includes('#levelup-nav-fixed{display:none!important}')) {
    throw new Error(`LEVEL UP duplicate hamburger guard missing from ${label}`);
  }
  verified += 1;
}

for (const { slug, appIndex, rootIndex } of entries) {
  if (!fs.existsSync(rootIndex)) continue;
  const appHtml = fs.readFileSync(appIndex, 'utf8');
  const rootHtml = fs.readFileSync(rootIndex, 'utf8');
  if (appHtml.includes(menuMarker) && !rootHtml.includes(menuMarker)) {
    throw new Error(`LEVEL UP hamburger missing from root alias /${slug}/`);
  }
}

if (!verified) {
  throw new Error('LEVEL UP duplicate hamburger guard found no app pages to verify.');
}

console.log(`[Firebase] LEVEL UP root hamburger mirrored to ${mirrored} aliases; duplicate guard applied to ${updated} pages; verified ${verified}`);