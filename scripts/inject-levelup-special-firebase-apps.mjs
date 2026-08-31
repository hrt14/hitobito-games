import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const sourceRoot = path.join(root, 'firebase-special-apps');
const outDir = path.join(root, '.dist', 'firebase');
const manifestPath = path.join(outDir, 'manifest.json');

if (!fs.existsSync(outDir)) throw new Error('Firebase output missing. Run build:hosting first.');
if (!fs.existsSync(sourceRoot)) throw new Error('firebase-special-apps source directory missing.');
if (!fs.existsSync(manifestPath)) throw new Error('Firebase manifest missing. Run build:hosting first.');

const slugs = fs.readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => /^[a-z0-9-]+$/.test(slug))
  .filter((slug) => fs.existsSync(path.join(sourceRoot, slug, 'index.html')))
  .sort();

if (!slugs.length) throw new Error('No special LEVEL UP apps with index.html were found.');

function titleFromHtml(html, slug) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = String(match?.[1] || slug)
    .replace(/\s*[|｜]\s*LEVEL\s*UP\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return title || slug;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.games)) throw new Error('Firebase manifest is invalid.');
const manifestSlugs = new Set(manifest.games.map((game) => game?.slug).filter(Boolean));
let registered = 0;

for (const slug of slugs) {
  const source = path.join(sourceRoot, slug);
  const sourceIndex = path.join(source, 'index.html');
  const sourceHtml = fs.readFileSync(sourceIndex, 'utf8');

  // Keep each special app on its root route and also provide /apps/<slug>/
  // so shared navigation/history can use one stable alias pattern.
  for (const destination of [path.join(outDir, slug), path.join(outDir, 'apps', slug)]) {
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
    const outputIndex = path.join(destination, 'index.html');
    if (!fs.existsSync(outputIndex)) throw new Error(`Special LEVEL UP copy failed: ${slug}`);
    const html = fs.readFileSync(outputIndex, 'utf8');
    if (!html.includes('href="/"')) throw new Error(`Special LEVEL UP home link missing: ${slug}`);
  }

  // Auto-discovery reads manifest.json. Register special apps there so every
  // newly added standalone app also reaches the public LEVEL UP catalog/home.
  if (!manifestSlugs.has(slug)) {
    manifest.games.push({ slug, title: titleFromHtml(sourceHtml, slug), category: 'levelup' });
    manifestSlugs.add(slug);
    registered += 1;
  }
}

if (registered) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`[Firebase] Copied ${slugs.length} special LEVEL UP apps to root routes + /apps aliases; registered ${registered} missing manifest entries: ${slugs.join(', ')}`);
