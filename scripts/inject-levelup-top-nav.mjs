import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const appsDir = path.join(outDir, 'apps');
const homePath = path.join(outDir, 'index.html');
const marker = 'id="levelup-nav-fixed"';
const styleStart = '<style id="levelup-nav-fixed-style">';
const scriptStart = '<script id="levelup-nav-fixed-script">';

if (!fs.existsSync(homePath) || !fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run the main build first.');
}

if (fs.readFileSync(homePath, 'utf8').includes(marker)) {
  console.log('[Firebase] LEVEL UP top navigation already present.');
  process.exit(0);
}

let sourceHtml = '';
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const appIndex = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(appIndex)) continue;
  const html = fs.readFileSync(appIndex, 'utf8');
  if (html.includes(marker) && html.includes(styleStart) && html.includes(scriptStart)) {
    sourceHtml = html;
    break;
  }
}

if (!sourceHtml) throw new Error('Could not find an app page containing the shared LEVEL UP navigation.');

const start = sourceHtml.indexOf(styleStart);
const scriptAt = sourceHtml.indexOf(scriptStart, start);
const end = sourceHtml.indexOf('</script>', scriptAt);
if (start < 0 || scriptAt < 0 || end < 0) throw new Error('Shared LEVEL UP navigation snippet is malformed.');
const snippet = sourceHtml.slice(start, end + '</script>'.length);

let home = fs.readFileSync(homePath, 'utf8');
if (home.includes('</body>')) home = home.replace('</body>', `${snippet}\n</body>`);
else home += `\n${snippet}`;
fs.writeFileSync(homePath, home);

console.log('[Firebase] Shared LEVEL UP navigation injected into top page.');
