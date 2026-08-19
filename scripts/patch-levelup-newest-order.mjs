import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogSource = 'scripts/playtest-catalog.mjs';
const marker = 'data-levelup-newest-order-v1';

if (!fs.existsSync(homePath)) {
  throw new Error(`LEVEL UP home not found: ${homePath}`);
}

function gitTimestamps(args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split(/\r?\n/)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  } catch {
    return [];
  }
}

function levelupReleasedAt(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) return 0;

  // Prefer the first commit that registered this slug as a LEVEL UP app.
  // This represents catalogue release more accurately than the app file's creation date.
  const needle = `'${slug}': ['levelup'`;
  const catalogHistory = gitTimestamps([
    'log',
    '--reverse',
    '--format=%ct',
    `-S${needle}`,
    '--',
    catalogSource,
  ]);
  if (catalogHistory.length) return catalogHistory[0];

  // Fallback for legacy/special apps that predate the catalogue metadata.
  const appHistory = gitTimestamps([
    'log',
    '--reverse',
    '--diff-filter=A',
    '--format=%ct',
    '--',
    `apps/${slug}/index.html`,
  ]);
  return appHistory[0] || 0;
}

let html = fs.readFileSync(homePath, 'utf8');
const releases = [];

html = html.replace(/<article\b([^>]*\bdata-game="([^"]+)"[^>]*)>/g, (match, attrs, slug) => {
  const releasedAt = levelupReleasedAt(slug);
  releases.push({ slug, releasedAt });
  if (/\bdata-released-at=/.test(attrs)) return match;
  return `<article${attrs} data-released-at="${releasedAt}">`;
});

const oldSelection = "    const newGames = cards.filter((card) => card.dataset.new === 'true' && !favoriteSet.has(card)).slice(0, 3);";
const newSelection = `    // ${marker}: newest means actual LEVEL UP release time, not DOM/card insertion order.\n    const newGames = cards\n      .filter((card) => !favoriteSet.has(card))\n      .sort((a, b) => {\n        const ar = Number(a.dataset.releasedAt || 0);\n        const br = Number(b.dataset.releasedAt || 0);\n        return br - ar || originalIndex.get(a) - originalIndex.get(b);\n      })\n      .slice(0, 3);`;

if (!html.includes(marker)) {
  if (!html.includes(oldSelection)) {
    throw new Error('LEVEL UP newest selector was not found; upstream home UX changed.');
  }
  html = html.replace(oldSelection, newSelection);
}

const dated = releases.filter((item) => item.releasedAt > 0).sort((a, b) => b.releasedAt - a.releasedAt);
if (dated.length < 3) {
  throw new Error(`Could not resolve release timestamps for enough LEVEL UP cards: ${dated.length}`);
}

fs.writeFileSync(homePath, html);

const finalHome = fs.readFileSync(homePath, 'utf8');
if (!finalHome.includes(marker)) throw new Error('LEVEL UP newest-order patch marker missing.');
if (!finalHome.includes('data-released-at=')) throw new Error('LEVEL UP release timestamps missing.');
if (finalHome.includes(oldSelection)) throw new Error('Old DOM-order newest selector is still present.');

console.log(`[Firebase] LEVEL UP newest order patched: ${dated.slice(0, 3).map((item) => item.slug).join(' > ')}`);
