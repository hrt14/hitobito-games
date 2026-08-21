import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const firebaseAppsDir = path.join(root, '.dist', 'firebase', 'apps');
const MARKER = 'data-levelup-real-bridge';
const errors = [];
const rows = [];

for (const [slug, meta] of Object.entries(GAME_META)) {
  if (meta?.[0] !== 'levelup') continue;
  const indexPath = path.join(firebaseAppsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) {
    errors.push(`${slug}: built index.html missing`);
    continue;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const markerMatch = html.match(new RegExp(`${MARKER}=["']([^"']+)["']`, 'i'));
  if (!markerMatch) {
    errors.push(`${slug}: ${MARKER} marker missing`);
    continue;
  }
  const mode = markerMatch[1];
  if (mode !== 'native') {
    if (!html.includes('id="levelup-real-bridge-style"')) errors.push(`${slug}: bridge style missing`);
    if (!html.includes('id="levelup-real-bridge-runtime"')) errors.push(`${slug}: bridge runtime missing`);
    if (!html.includes('REAL LIFE TRANSFER')) errors.push(`${slug}: transfer UI copy missing`);
  }
  rows.push({ slug, mode });
}

if (errors.length) {
  console.error('[validate-levelup-real-bridge] FAILED');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

const native = rows.filter((row) => row.mode === 'native').length;
const injected = rows.length - native;
console.log(`[validate-levelup-real-bridge] OK total=${rows.length} injected=${injected} native=${native}`);
