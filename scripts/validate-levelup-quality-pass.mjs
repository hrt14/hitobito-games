import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const levelup = Object.entries(GAME_META).filter(([, meta]) => meta?.[0] === 'levelup');

if (!fs.existsSync(appsDir)) {
  throw new Error('Firebase apps directory not found.');
}

const errors = [];
let checked = 0;
let missing = 0;

for (const [slug] of levelup) {
  const indexPath = path.join(appsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) {
    missing += 1;
    continue;
  }

  checked += 1;
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('data-levelup-quality-pass=')) errors.push(`${slug}: quality marker missing`);
  if (!html.includes('id="levelup-quality-pass-style"')) errors.push(`${slug}: quality CSS missing`);
  if (!html.includes('id="levelup-quality-pass-runtime"')) errors.push(`${slug}: quality runtime missing`);
  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(html)) errors.push(`${slug}: zoom-blocking viewport remains`);
  if (!/prefers-reduced-motion/i.test(html)) errors.push(`${slug}: reduced-motion support missing`);
  if (!/:focus-visible/i.test(html)) errors.push(`${slug}: focus-visible support missing`);
  if (!/min-(?:width|height):44px/i.test(html)) errors.push(`${slug}: 44px touch target baseline missing`);
}

if (checked < 20) {
  errors.push(`only ${checked} LEVEL UP apps were available for validation`);
}

if (errors.length) {
  console.error('[LEVEL UP quality validation] failed');
  for (const error of errors) console.error(` - ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[LEVEL UP quality validation] ${checked} apps passed${missing ? ` (${missing} catalog entries not present in this Firebase bundle)` : ''}`);
}
