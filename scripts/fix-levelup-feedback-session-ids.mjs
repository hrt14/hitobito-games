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

// Feedback #293: do not reveal the preferred answer before the user chooses.
// The previous markup added `good` to every negative-stress option at render time,
// which looked like a pre-selected answer and also exposed the intended answer.
const maaIikaPath = path.join(outDir, 'maa-iika', 'index.html');
if (!fs.existsSync(maaIikaPath)) throw new Error('maa-iika production page missing.');
let maaIika = fs.readFileSync(maaIikaPath, 'utf8');
const preselectedChoice = 'class="choice ${c[1]<0?\'good\':\'\'}"';
if (!maaIika.includes(preselectedChoice)) throw new Error('maa-iika preselected choice pattern missing.');
maaIika = maaIika.replace(preselectedChoice, 'class="choice"');
fs.writeFileSync(maaIikaPath, maaIika);
console.log('[Firebase] maa-iika no longer pre-highlights the preferred choice.');

// Feedback #294: keep Negotiator apps available at their direct URLs, but remove
// the whole series from the LEVEL UP home catalog so it does not crowd discovery.
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog missing.');
let home = fs.readFileSync(homePath, 'utf8');
const negotiatorCard = /\s*<article class="card[^"]*" data-game="negotiator-[^"]+"[\s\S]*?<\/article>/g;
const beforeHome = home;
home = home.replace(negotiatorCard, '');
if (home === beforeHome) throw new Error('No Negotiator cards were found on LEVEL UP home.');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');
const beforeCount = catalog.games.length;
catalog.games = catalog.games.filter((game) => !String(game?.slug || '').startsWith('negotiator-'));
const removedCount = beforeCount - catalog.games.length;
if (removedCount < 1) throw new Error('No Negotiator entries were found in LEVEL UP catalog.');
const visibleCount = catalog.games.length;
home = home.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${visibleCount}</strong><span>TRAINING GAMES</span>`);
home = home.replace(/<span>\d+ games<\/span>/, `<span>${visibleCount} games</span>`);
fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`[Firebase] removed ${removedCount} Negotiator cards from LEVEL UP home discovery; visible=${visibleCount}.`);

// App creation requests now use the authenticated 5-step LEVEL UP maker injected
// by scripts/inject-levelup-maker.mjs. Do not inject the legacy anonymous,
// single-textarea app-request widget here; public apps remain login-free, while
// creating a new app is intentionally tied to the signed-in user's account.
await import('./apply-levelup-queue-improvements.mjs');
