import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const firebaseDir = path.join(root, '.dist', 'firebase');
const appsDir = path.join(firebaseDir, 'apps');
const menuMarker = 'data-levelup-app-menu';
const feedbackMarker = 'data-levelup-feedback-v1';
const dedupeStyleMarker = 'id="levelup-app-menu-dedupe-style"';
const dedupeScriptMarker = 'id="levelup-app-menu-dedupe-script"';
const feedbackBridgeMarker = 'id="levelup-feedback-menu-bridge"';

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

const feedbackBridgeScript = `
<script id="levelup-feedback-menu-bridge">
(() => {
  if (window.__LEVELUP_FEEDBACK_MENU_BRIDGE__) return;
  window.__LEVELUP_FEEDBACK_MENU_BRIDGE__ = true;

  const attach = () => {
    const menuHost = document.getElementById('levelup-app-menu-root');
    const shadow = menuHost?.shadowRoot;
    const actions = shadow?.querySelector('.actions');
    if (!actions) return false;
    if (actions.querySelector('[data-action="feedback"]')) return true;

    const button = document.createElement('button');
    button.className = 'action';
    button.type = 'button';
    button.dataset.action = 'feedback';
    button.innerHTML = '<span class="action-icon">✎</span><span class="action-copy"><strong>改善要望を送る</strong><small>このアプリの改善・バグ・アイデアを送信</small></span>';
    button.addEventListener('click', () => {
      shadow.querySelector('.close')?.click();
      const feedbackButton = document.getElementById('lu-fb-fab');
      if (feedbackButton) {
        feedbackButton.click();
        return;
      }
      window.dispatchEvent(new CustomEvent('levelup:open-feedback'));
    });
    actions.appendChild(button);
    return true;
  };

  if (attach()) return;
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (attach() || attempts >= 40) clearInterval(timer);
  }, 100);
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

function safeSlug(slug) {
  return String(slug || 'home').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64) || 'home';
}

const homeIndex = path.join(firebaseDir, 'index.html');
if (!fs.existsSync(homeIndex)) {
  throw new Error('Firebase LEVEL UP home page not found; cannot verify feedback widget donor.');
}
const homeHtml = fs.readFileSync(homeIndex, 'utf8');
const feedbackDonor = homeHtml.match(/<script\s+data-levelup-feedback-v1\b[\s\S]*?<\/script>/i)?.[0] || '';
if (!feedbackDonor) {
  throw new Error('LEVEL UP feedback widget donor missing from Firebase home page.');
}

function feedbackBlockFor(slug) {
  const nextSlug = safeSlug(slug);
  if (!/data-app-slug="[^"]*"/i.test(feedbackDonor)) {
    throw new Error('LEVEL UP feedback donor is missing data-app-slug.');
  }
  return feedbackDonor.replace(/data-app-slug="[^"]*"/i, `data-app-slug="${nextSlug}"`);
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
let feedbackRestored = 0;
let feedbackLinksAdded = 0;
let verified = 0;

for (const { slug, label, indexPath } of pages) {
  let html = fs.readFileSync(indexPath, 'utf8');

  if (!html.includes(menuMarker)) {
    throw new Error(`LEVEL UP shared hamburger missing from ${label}`);
  }

  // The original feedback injector historically skipped HTML without a closing
  // </body>. Repair any missed app page by copying the already-generated widget
  // from the Firebase home page and changing only its app slug.
  if (!html.includes(feedbackMarker)) {
    html = injectBeforeBody(html, feedbackBlockFor(slug));
    feedbackRestored += 1;
  }

  if (!html.includes(dedupeStyleMarker)) {
    html = html.includes('</head>')
      ? html.replace('</head>', `${dedupeStyle}\n</head>`)
      : `${dedupeStyle}\n${html}`;
  }

  if (!html.includes(dedupeScriptMarker)) {
    html = injectBeforeBody(html, dedupeScript);
  }

  // Keep the existing fixed "改善" tab, and also put the same action inside the
  // shared hamburger. This gives every app a second, layout-independent path to
  // the feedback form and makes the link discoverable even when an app overlaps
  // the right-side fixed tab.
  if (!html.includes(feedbackBridgeMarker)) {
    html = injectBeforeBody(html, feedbackBridgeScript);
    feedbackLinksAdded += 1;
  }

  fs.writeFileSync(indexPath, html);
  updated += 1;
}

for (const { label, indexPath } of pages) {
  const html = fs.readFileSync(indexPath, 'utf8');

  if (!html.includes(menuMarker)) {
    throw new Error(`LEVEL UP shared hamburger missing from ${label}`);
  }
  if (!html.includes(feedbackMarker) || !html.includes('lu-fb-fab')) {
    throw new Error(`LEVEL UP feedback widget missing from ${label}`);
  }
  if (!html.includes(feedbackBridgeMarker) || !html.includes('data-action = \'feedback\'') && !html.includes("button.dataset.action = 'feedback'")) {
    throw new Error(`LEVEL UP feedback menu link missing from ${label}`);
  }
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
  if (appHtml.includes(feedbackMarker) && !rootHtml.includes(feedbackMarker)) {
    throw new Error(`LEVEL UP feedback widget missing from root alias /${slug}/`);
  }
}

if (!verified) {
  throw new Error('LEVEL UP feedback/menu audit found no app pages to verify.');
}

console.log(`[Firebase] LEVEL UP root hamburger mirrored to ${mirrored} aliases; feedback restored to ${feedbackRestored} pages; feedback menu link added to ${feedbackLinksAdded} pages; duplicate guard applied to ${updated} pages; verified ${verified}`);