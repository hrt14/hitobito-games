import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const from = 'const ref=db.collection("levelupSessions").doc();batch.set(ref,';
const to = 'const docId=(batchId+String(i+1).padStart(2,"0")).slice(0,40);const ref=db.collection("levelupSessions").doc(docId);batch.set(ref,';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let patched = 0;
for (const file of walk(outDir)) {
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('levelup-feedback-session-fallback')) continue;
  if (!html.includes(from)) {
    if (html.includes(to)) continue;
    throw new Error(`Feedback fallback session-id pattern missing in ${file}`);
  }
  html = html.replaceAll(from, to);
  fs.writeFileSync(file, html);
  patched += 1;
}

if (!patched) throw new Error('No LEVEL UP feedback fallback pages were patched.');
console.log(`[Firebase] LEVEL UP feedback fallback now uses explicit lowercase session IDs on ${patched} HTML pages.`);
