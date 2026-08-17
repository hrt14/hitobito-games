import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsRoot = path.join(root, '.dist', 'firebase', 'apps');

const risky = [
  ['DecompressionStream', /DecompressionStream/g],
  ['CompressionStream', /CompressionStream/g],
  ['SharedArrayBuffer', /SharedArrayBuffer/g],
  ['Atomics', /\bAtomics\./g],
  ['WebGPU', /navigator\.gpu/g],
  ['File System Access API', /show(?:OpenFile|SaveFile|Directory)Picker/g],
  ['OffscreenCanvas', /OffscreenCanvas/g],
  ['WebTransport', /WebTransport/g],
  ['WebCodecs', /\b(?:VideoEncoder|VideoDecoder|AudioEncoder|AudioDecoder)\b/g],
  ['runtime code eval', /\beval\s*\(/g],
];
const fragileAssetRef = /(?:\.bin|\.b64|game-[\w-]+\.txt)/g;
const warnings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:html|js)$/i.test(entry.name)) inspect(full);
  }
}

function inspect(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  for (const [label, pattern] of risky) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) warnings.push(`${rel}: ${label}`);
  }
  fragileAssetRef.lastIndex = 0;
  if (fragileAssetRef.test(text)) warnings.push(`${rel}: runtime split/binary asset reference`);
}

if (!fs.existsSync(appsRoot)) throw new Error('Firebase apps bundle missing');
walk(appsRoot);

if (warnings.length) {
  console.log('[Mobile audit] WARNINGS');
  for (const warning of warnings) console.log(`- ${warning}`);
} else {
  console.log('[Mobile audit] OK: no known high-risk mobile browser APIs or split/binary runtime loaders found');
}
