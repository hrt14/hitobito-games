import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const sourceRoot = path.join(root, 'firebase-special-apps');
const outDir = path.join(root, '.dist', 'firebase');
const slugs = ['start', 'maa-iika', 'self-management'];

if (!fs.existsSync(outDir)) throw new Error('Firebase output missing. Run build:hosting first.');

for (const slug of slugs) {
  const source = path.join(sourceRoot, slug);
  const indexPath = path.join(source, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error(`Special LEVEL UP source missing: ${slug}/index.html`);

  // Keep the existing public URLs (/start, /maa-iika, /self-management),
  // and also provide /apps/<slug>/ aliases because the shared account
  // history sanitizer falls back to /apps/<slug>/ for older records.
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

console.log(`[Firebase] Copied ${slugs.length} special LEVEL UP apps to root routes + /apps aliases`);
