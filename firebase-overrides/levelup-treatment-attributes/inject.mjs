import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { treatmentFor, TREATMENT_TYPES, validateTreatment } from '../../scripts/levelup-treatment-attributes.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const marker = 'data-levelup-treatment-attributes';

for (const required of [homePath, catalogPath]) {
  if (!fs.existsSync(required)) throw new Error(`LEVEL UP treatment prerequisite missing: ${required}`);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games) || !catalog.games.length) throw new Error('LEVEL UP catalog has no games.');

for (const game of catalog.games) {
  const treatment = treatmentFor(game.slug);
  const meta = TREATMENT_TYPES[treatment];
  game.treatment = treatment;
  game.treatmentLabel = meta.label;
  game.treatmentDescription = meta.description;
}

catalog.version = Math.max(Number(catalog.version || 1), 2);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

let html = fs.readFileSync(homePath, 'utf8');

const style = `
<style id="levelup-treatment-attributes-style" ${marker}>
  .lu-treatment-badge{display:inline-flex;align-items:center;width:max-content;max-width:100%;margin:7px 0 1px;padding:4px 8px;border:1px solid rgba(216,255,91,.2);border-radius:999px;background:rgba(216,255,91,.055);color:#cfe97a;font-size:8px;font-weight:950;letter-spacing:.08em;line-height:1.2}
  .card[data-treatment="relief"] .lu-treatment-badge{border-color:rgba(126,213,255,.26);background:rgba(126,213,255,.07);color:#a8ddff}
  .card[data-treatment="rebuild"] .lu-treatment-badge{border-color:rgba(216,255,91,.24);background:rgba(216,255,91,.065);color:#dcff72}
  .card[data-treatment="both"] .lu-treatment-badge{border-color:rgba(210,169,255,.24);background:rgba(210,169,255,.065);color:#ddc4ff}
</style>`;

if (!html.includes('id="levelup-treatment-attributes-style"')) {
  if (!html.includes('</head>')) throw new Error('LEVEL UP home head not found for treatment attributes.');
  html = html.replace('</head>', `${style}\n</head>`);
}

for (const game of catalog.games) {
  const needle = `data-game="${escapeHtml(game.slug)}"`;
  const at = html.indexOf(needle);
  if (at < 0) throw new Error(`LEVEL UP treatment card missing from home: ${game.slug}`);
  const articleStart = html.lastIndexOf('<article', at);
  const articleOpenEnd = html.indexOf('>', at);
  const articleEnd = html.indexOf('</article>', articleOpenEnd);
  if (articleStart < 0 || articleOpenEnd < 0 || articleEnd < 0) throw new Error(`LEVEL UP treatment card malformed: ${game.slug}`);

  let openTag = html.slice(articleStart, articleOpenEnd + 1);
  if (!/\sdata-treatment=/.test(openTag)) {
    openTag = openTag.slice(0, -1) + ` data-treatment="${game.treatment}">`;
    html = html.slice(0, articleStart) + openTag + html.slice(articleOpenEnd + 1);
  }

  const freshAt = html.indexOf(needle);
  const freshStart = html.lastIndexOf('<article', freshAt);
  const freshEnd = html.indexOf('</article>', freshAt);
  let segment = html.slice(freshStart, freshEnd + '</article>'.length);
  if (!segment.includes('data-treatment-badge')) {
    const badge = `<span class="lu-treatment-badge" data-treatment-badge="${game.treatment}">${escapeHtml(game.treatmentLabel)}</span>`;
    const skillStart = segment.indexOf('<div class="skill">');
    if (skillStart >= 0) {
      const skillEnd = segment.indexOf('</div>', skillStart);
      segment = segment.slice(0, skillEnd + 6) + `\n      ${badge}` + segment.slice(skillEnd + 6);
    } else {
      const heading = segment.indexOf('<h2');
      if (heading < 0) throw new Error(`LEVEL UP treatment badge anchor missing: ${game.slug}`);
      segment = segment.slice(0, heading) + badge + '\n      ' + segment.slice(heading);
    }
    html = html.slice(0, freshStart) + segment + html.slice(freshEnd + '</article>'.length);
  }
}

const treatmentIndex = Object.fromEntries(catalog.games.map((game) => [game.slug, {
  treatment: game.treatment,
  label: game.treatmentLabel,
  description: game.treatmentDescription,
}]));
const dataScript = `<script type="application/json" id="levelup-treatment-data" ${marker}>${JSON.stringify(treatmentIndex).replaceAll('<', '\\u003c')}</script>`;
if (!html.includes('id="levelup-treatment-data"')) {
  if (!html.includes('</body>')) throw new Error('LEVEL UP home body not found for treatment data.');
  html = html.replace('</body>', `${dataScript}\n</body>`);
}

fs.writeFileSync(homePath, html);

const finalCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const finalHome = fs.readFileSync(homePath, 'utf8');
for (const game of finalCatalog.games) {
  if (!validateTreatment(game.treatment)) throw new Error(`LEVEL UP treatment is invalid: ${game.slug}`);
  const markerText = `data-game="${escapeHtml(game.slug)}"`;
  const at = finalHome.indexOf(markerText);
  const start = finalHome.lastIndexOf('<article', at);
  const end = finalHome.indexOf('</article>', at);
  const segment = start >= 0 && end >= 0 ? finalHome.slice(start, end) : '';
  if (!segment.includes(`data-treatment="${game.treatment}"`)) throw new Error(`LEVEL UP treatment attribute missing from card: ${game.slug}`);
  if (!segment.includes(`data-treatment-badge="${game.treatment}"`)) throw new Error(`LEVEL UP treatment badge missing from card: ${game.slug}`);
}

console.log(`[Firebase] LEVEL UP treatment attributes applied to ${finalCatalog.games.length} apps.`);
