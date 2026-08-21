import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

const hiddenSlugs = [
  'amazon-operator',
  'web-marketer-owned-site',
  'web-marketer-rakuten',
  'yahoo-shopping-marketer',
  'hitori-shouten',
];

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`LEVEL UP marketing visibility input missing: ${file}`);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');

const beforeCount = catalog.games.length;
const hidden = new Set(hiddenSlugs);
catalog.games = catalog.games.filter((game) => !hidden.has(game.slug));
const afterCount = catalog.games.length;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let home = fs.readFileSync(homePath, 'utf8');
for (const slug of hiddenSlugs) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cardPattern = new RegExp(`\\s*<article\\b[^>]*\\bdata-game="${escaped}"[^>]*>[\\s\\S]*?<\\/article>\\s*`, 'g');
  home = home.replace(cardPattern, '\n');
}

home = home.replace(
  /<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/,
  `<strong>${afterCount}</strong><span>TRAINING GAMES</span>`,
);
home = home.replace(/<span>\d+ games<\/span>/g, `<span>${afterCount} games</span>`);
fs.writeFileSync(homePath, home);

const finalHome = fs.readFileSync(homePath, 'utf8');
const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const slug of hiddenSlugs) {
  if (finalCatalog.games.some((game) => game.slug === slug)) {
    throw new Error(`Marketing app still exists in LEVEL UP catalog: ${slug}`);
  }
  if (finalHome.includes(`data-game="${slug}"`) || finalHome.includes(`href="/apps/${slug}/"`)) {
    throw new Error(`Marketing app still exists on LEVEL UP home: ${slug}`);
  }

  const appIndex = path.join(outDir, 'apps', slug, 'index.html');
  if (!fs.existsSync(appIndex)) {
    throw new Error(`Marketing app was expected to stay directly accessible but is missing: ${slug}`);
  }
}

console.log(`[Firebase] hid ${beforeCount - afterCount} professional/marketing apps from LEVEL UP discovery; direct app pages remain available`);
