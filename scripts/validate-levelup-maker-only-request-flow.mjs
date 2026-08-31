import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');

if (!fs.existsSync(homePath)) throw new Error('LEVEL UP Firebase home bundle is missing.');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const home = fs.readFileSync(homePath, 'utf8');
if (!home.includes('data-levelup-maker') || !home.includes('/levelup-maker.js')) {
  throw new Error('Authenticated 5-step LEVEL UP maker is missing from the home page.');
}

const legacyMarkers = [
  'data-levelup-app-request-v1',
  'lu-appreq-fab',
  '__LEVELUP_APP_REQUEST_V1__',
];
const offenders = [];
for (const file of walk(outDir)) {
  const html = fs.readFileSync(file, 'utf8');
  const marker = legacyMarkers.find((candidate) => html.includes(candidate));
  if (marker) offenders.push(`${path.relative(outDir, file)} (${marker})`);
}

if (offenders.length) {
  throw new Error(`Legacy anonymous app-request UI is still present: ${offenders.slice(0, 12).join(', ')}${offenders.length > 12 ? ` +${offenders.length - 12} more` : ''}`);
}

console.log('[Firebase] LEVEL UP creation requests are maker-only: authenticated 5-step maker present, legacy anonymous widget absent.');
