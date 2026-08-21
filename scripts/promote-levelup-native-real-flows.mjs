import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const apps = {
  'help-me': { required: ['id="realDelegateModal"', 'src="./real-delegation.js"'] },
  'expect-nothing': { required: ['id="realExpectationModal"', 'src="./real-life.js"'] },
  'suteru-yuki': { required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'jinsei-title': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'arigatou-sagashi': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'main-character': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'kokkara-best': { required: ['id="realFlow"', 'data-levelup-real-bridge="native"'] },
};

function injectAssets(html) {
  if (!html.includes('href="./real-life.css"')) {
    html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="./real-life.css">\n</head>');
  }
  if (!html.includes('src="./real-life.js"')) {
    html = html.replace(/<\/body>/i, '  <script src="./real-life.js"></script>\n</body>');
  }
  return html;
}

for (const [slug, config] of Object.entries(apps)) {
  const indexPath = path.join(appsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error(`[native-real-flow] missing ${slug}/index.html`);
  let html = fs.readFileSync(indexPath, 'utf8');

  if (config.injectAssets) html = injectAssets(html);

  for (const marker of config.required) {
    if (!html.includes(marker)) throw new Error(`[native-real-flow] ${slug} dedicated flow missing: ${marker}`);
  }

  html = html.replace(/<style id="levelup-real-bridge-style">[\s\S]*?<\/style>\s*/i, '');
  html = html.replace(/<script id="levelup-real-bridge-runtime">[\s\S]*?<\/script>\s*/i, '');
  if (/data-levelup-real-bridge=["'][^"']*["']/i.test(html)) {
    html = html.replace(/data-levelup-real-bridge=["'][^"']*["']/i, 'data-levelup-real-bridge="native"');
  } else {
    html = html.replace(/<html(\s|>)/i, '<html data-levelup-real-bridge="native"$1');
  }
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`[native-real-flow] promoted ${slug}`);
}
