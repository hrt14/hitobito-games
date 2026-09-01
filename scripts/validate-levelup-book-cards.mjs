import './inject-success-mind-card.mjs';
import './inject-queue-batch-book-cards.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found.');
}

const html = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const games = Array.isArray(catalog.games) ? catalog.games : [];
const cards = [...html.matchAll(/<article\b([^>]*\bdata-game="([^"]+)"[^>]*)>([\s\S]*?)<\/article>/g)];
const bySlug = new Map(cards.map((match) => [match[2], match[3]]));
const missingCards = games.filter((game) => !bySlug.has(game.slug));
const missingBookCopy = games.filter((game) => {
  const body = bySlug.get(game.slug) || '';
  return !body.includes('class="book-obi"');
});

console.log(`[LEVEL UP book cards] catalog=${games.length} cards=${cards.length} book-cards=${games.length - missingBookCopy.length}`);

if (missingCards.length) {
  throw new Error(`LEVEL UP cards missing from home: ${missingCards.map((game) => `${game.slug} (${game.title})`).join(', ')}`);
}
if (missingBookCopy.length) {
  throw new Error(`LEVEL UP apps without title+obi copy: ${missingBookCopy.map((game) => `${game.slug} (${game.title})`).join(', ')}`);
}
if (games.length === 0) {
  throw new Error('LEVEL UP catalog is empty.');
}

console.log(`[Firebase] LEVEL UP title+obi coverage verified for all ${games.length} apps.`);
