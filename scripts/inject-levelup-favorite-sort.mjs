import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');

if (!fs.existsSync(homePath)) {
  throw new Error('Firebase LEVEL UP home not found. Run build:firebase after the home is generated.');
}

let html = fs.readFileSync(homePath, 'utf8');
const marker = 'id="levelup-favorite-sort"';

if (!html.includes(marker)) {
  const snippet = `
<script id="levelup-favorite-sort">
  (() => {
    const grid = document.querySelector('.grid');
    if (!grid) return;

    const cards = [...grid.querySelectorAll('.card')];
    const sortFavoritesFirst = () => {
      const favorites = [];
      const others = [];

      cards.forEach((card) => {
        const button = card.querySelector('[data-favorite]');
        const target = button?.getAttribute('aria-pressed') === 'true' ? favorites : others;
        target.push(card);
      });

      [...favorites, ...others].forEach((card) => grid.appendChild(card));
    };

    sortFavoritesFirst();
    cards.forEach((card) => {
      card.querySelector('[data-favorite]')?.addEventListener('click', () => {
        requestAnimationFrame(sortFavoritesFirst);
      });
    });
  })();
</script>
`;

  if (html.includes('</body>')) html = html.replace('</body>', `${snippet}</body>`);
  else html += snippet;
  fs.writeFileSync(homePath, html);
}

if (!fs.readFileSync(homePath, 'utf8').includes(marker)) {
  throw new Error('LEVEL UP favorite sorting injection failed.');
}

console.log('[Firebase] LEVEL UP favorites-first sorting injected');
