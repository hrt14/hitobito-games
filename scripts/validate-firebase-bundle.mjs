import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

if (!fs.existsSync(manifestPath) || !fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('Firebase bundle is missing. Run npm run build:firebase first.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const problems = [];

for (const game of manifest.games) {
  const dir = path.join(outDir, 'apps', game.slug);
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    problems.push(`${game.slug}: index.html missing`);
    continue;
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["'](\.\/[^"'#?]+)["']/g)].map((m) => m[1]);
  for (const ref of refs) {
    const target = path.resolve(dir, ref);
    if (!target.startsWith(dir + path.sep) && target !== dir) {
      problems.push(`${game.slug}: unsafe relative asset ${ref}`);
      continue;
    }
    if (!fs.existsSync(target)) {
      problems.push(`${game.slug}: missing relative asset ${ref}`);
    }
  }
}

const home = fs.readFileSync(homePath, 'utf8');
const manifestSlugs = new Set(manifest.games.map((game) => game.slug));
for (const game of catalog.games) {
  if (!home.includes(`href="${game.href}"`)) {
    problems.push(`home: missing curated link ${game.href}`);
  }
  if (game.href.startsWith('/apps/') && !manifestSlugs.has(game.slug)) {
    problems.push(`catalog: ${game.slug} is not in Firebase manifest`);
  }
}

if (!home.includes('id="levelup-refresh"')) {
  problems.push('home: refresh button missing');
}

if (catalog.games.length !== 22) {
  problems.push(`catalog: expected 22 curated games, found ${catalog.games.length}`);
}

if (problems.length) {
  console.error('[Firebase validation] FAILED');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`[Firebase validation] OK: ${catalog.games.length} curated LEVEL UP games; ${manifest.games.length} bundled app directories verified; refresh button present`);
