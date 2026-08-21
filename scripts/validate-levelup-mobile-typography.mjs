import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const firebaseRoot = path.join(root, '.dist', 'firebase');
const MIN_PX = 12;
const violations = [];
let htmlCount = 0;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(?:html|css|js)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

for (const file of walk(firebaseRoot)) {
  const content = fs.readFileSync(file, 'utf8');
  if (/\.html$/i.test(file)) {
    htmlCount += 1;
    if (!content.includes('id="levelup-mobile-type-floor"')) {
      violations.push(`${path.relative(firebaseRoot, file)}: missing mobile typography baseline`);
    }
  }
  for (const match of content.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi)) {
    const size = Number(match[1]);
    if (Number.isFinite(size) && size > 0 && size < MIN_PX) {
      violations.push(`${path.relative(firebaseRoot, file)}: font-size ${size}px`);
      if (violations.length >= 80) break;
    }
  }
  if (violations.length >= 80) break;
}

const reaction = path.join(firebaseRoot, 'apps', 'reaction-pattern', 'index.html');
if (!fs.existsSync(reaction)) violations.push('reaction-pattern production bundle missing');
else {
  const html = fs.readFileSync(reaction, 'utf8');
  if (!html.includes('id="reaction-pattern-mobile-readable"')) violations.push('reaction-pattern mobile readability override missing');
  for (const required of ['.mood-labels', '.section-copy', '.primary,.secondary,.ghost']) {
    if (!html.includes(required)) violations.push(`reaction-pattern readability rule missing: ${required}`);
  }
}

if (violations.length) {
  console.error(`LEVEL UP mobile typography validation failed (${violations.length} shown):`);
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`LEVEL UP mobile typography validation OK: ${htmlCount} HTML files, no positive px font-size below ${MIN_PX}px.`);
