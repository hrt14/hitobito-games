import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const sourceRoot = path.join(root, 'firebase-special-apps');
const outDir = path.join(root, '.dist', 'firebase');

if (!fs.existsSync(outDir)) throw new Error('Firebase output missing. Run build:hosting first.');
if (!fs.existsSync(sourceRoot)) throw new Error('firebase-special-apps source directory missing.');

const slugs = fs.readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => /^[a-z0-9-]+$/.test(slug))
  .filter((slug) => fs.existsSync(path.join(sourceRoot, slug, 'index.html')))
  .sort();

if (!slugs.length) throw new Error('No special LEVEL UP apps with index.html were found.');

for (const slug of slugs) {
  const source = path.join(sourceRoot, slug);

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
}

console.log(`[Firebase] Copied ${slugs.length} special LEVEL UP apps to root routes + /apps aliases: ${slugs.join(', ')}`);
