import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const marker = 'data-levelup-ga4';

if (!fs.existsSync(outDir)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after build:firebase assets are generated.');
}

const ga4Bootstrap = `
<script ${marker}>
(() => {
  if (window.__LEVELUP_GA4_BOOTSTRAPPED__) return;
  window.__LEVELUP_GA4_BOOTSTRAPPED__ = true;

  const pathname = window.location.pathname || '/';
  const cleanLocation = window.location.origin + pathname;
  const appMatch = pathname.match(/^\\/apps\\/([a-z0-9-]{1,64})(?:\\/|$)/);

  fetch('/__/firebase/init.json', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
    .then((response) => {
      if (!response.ok) throw new Error('Firebase init config request failed: ' + response.status);
      return response.json();
    })
    .then((config) => {
      const measurementId = String(config && config.measurementId || '').trim();
      if (!/^G-[A-Z0-9]+$/i.test(measurementId)) {
        console.info('[LEVEL UP GA4] measurementId is unavailable. Enable Google Analytics for the Firebase web app.');
        return;
      }

      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

      const tag = document.createElement('script');
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
      document.head.appendChild(tag);

      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        page_location: cleanLocation,
        page_path: pathname,
        page_title: document.title,
      });

      if (appMatch) {
        window.gtag('event', 'levelup_app_open', {
          app_slug: appMatch[1],
        });
      } else if (pathname === '/' || pathname === '/index.html') {
        window.gtag('event', 'levelup_home_view');
      }
    })
    .catch((error) => console.warn('[LEVEL UP GA4] bootstrap failed', error));
})();
</script>`;

function collectHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectHtmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

const htmlFiles = collectHtmlFiles(outDir);
if (!htmlFiles.length) throw new Error('No HTML files found in Firebase LEVEL UP bundle.');

let injected = 0;
for (const htmlPath of htmlFiles) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (html.includes(marker)) continue;

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${ga4Bootstrap}\n</head>`);
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', `${ga4Bootstrap}\n</body>`);
  } else {
    throw new Error(`Cannot inject LEVEL UP GA4 into HTML without </head> or </body>: ${path.relative(outDir, htmlPath)}`);
  }

  fs.writeFileSync(htmlPath, html);
  injected += 1;
}

const missing = collectHtmlFiles(outDir).filter((htmlPath) => !fs.readFileSync(htmlPath, 'utf8').includes(marker));
if (missing.length) {
  throw new Error(`LEVEL UP GA4 injection missing from ${missing.length} HTML files: ${missing.slice(0, 5).map((file) => path.relative(outDir, file)).join(', ')}`);
}

console.log(`[Firebase] LEVEL UP GA4 bootstrap injected into ${injected} HTML files (${htmlFiles.length} total).`);
