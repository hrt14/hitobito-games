import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const manifestPath = path.join(outDir, 'manifest.json');
const homePath = path.join(outDir, 'index.html');

if (!fs.existsSync(manifestPath) || !fs.existsSync(homePath)) {
  throw new Error('Firebase bundle is missing. Run npm run build:firebase first.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
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
for (const game of manifest.games) {
  const expected = `/apps/${encodeURIComponent(game.slug)}/`;
  if (!home.includes(`href="${expected}"`)) {
    problems.push(`home: missing link ${expected}`);
  }
}

if (problems.length) {
  console.error('[Firebase validation] FAILED');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`[Firebase validation] OK: ${manifest.games.length} games, links and relative assets verified`);
