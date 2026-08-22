import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const catalogSource = 'scripts/playtest-catalog.mjs';
const marker = 'data-levelup-newest-order-v2';
const dateStyleId = 'levelup-card-updated-date-v1';

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for newest-order patch.');
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
  const appHistory = gitTimestamps([
    'log', '--reverse', '--diff-filter=A', '--format=%ct', '--', `apps/${slug}/index.html`,
  ]);
  if (appHistory.length) return appHistory[0];

  const specialHistory = gitTimestamps([
    'log', '--reverse', '--diff-filter=A', '--format=%ct', '--', `firebase-special-apps/${slug}/index.html`,
  ]);
  if (specialHistory.length) return specialHistory[0];

  const needle = `'${slug}': ['levelup'`;
  const catalogHistory = gitTimestamps([
    'log', '--reverse', '--format=%ct', `-S${needle}`, '--', catalogSource,
  ]);
  return catalogHistory[0] || 0;
}

function levelupUpdatedAt(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) return 0;
  const candidates = [
    `apps/${slug}`,
    `firebase-special-apps/${slug}`,
  ];
  for (const candidate of candidates) {
    const history = gitTimestamps(['log', '-1', '--format=%ct', '--', candidate]);
    if (history.length) return history[0];
  }
  return levelupReleasedAt(slug);
}

function formatJstDate(epochSeconds) {
  if (!epochSeconds) return '';
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(epochSeconds * 1000));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}.${values.month}.${values.day}`;
}

const metadata = new Map();
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
for (const game of catalog.games || []) {
  const releasedAt = levelupReleasedAt(game.slug);
  const updatedAt = levelupUpdatedAt(game.slug) || releasedAt;
  metadata.set(game.slug, { releasedAt, updatedAt });
  game.releasedAt = releasedAt;
  game.updatedAt = updatedAt;
  game.updatedDate = formatJstDate(updatedAt);
}

catalog.games.sort((a, b) => {
  const au = Number(a.updatedAt || 0);
  const bu = Number(b.updatedAt || 0);
  return bu - au || Number(b.releasedAt || 0) - Number(a.releasedAt || 0) || String(a.slug).localeCompare(String(b.slug));
});
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
let datedCards = 0;
html = html.replace(/<article\b([^>]*\bdata-game="([^"]+)"[^>]*)>/g, (match, attrs, slug) => {
  const data = metadata.get(slug) || { releasedAt: levelupReleasedAt(slug), updatedAt: levelupUpdatedAt(slug) };
  const updatedAt = data.updatedAt || data.releasedAt || 0;
  if (updatedAt > 0) datedCards += 1;
  let nextAttrs = attrs
    .replace(/\sdata-released-at="[^"]*"/g, '')
    .replace(/\sdata-updated-at="[^"]*"/g, '');
  nextAttrs += ` data-released-at="${data.releasedAt || 0}" data-updated-at="${updatedAt}"`;
  return `<article${nextAttrs}>`;
});

html = html.replace(/(<article\b[^>]*\bdata-game="([^"]+)"[^>]*>[\s\S]*?<a\b[^>]*class="[^"]*\bcard-link\b[^"]*"[^>]*>)([\s\S]*?)(<h2>)/g,
  (whole, prefix, slug, between, h2) => {
    if (between.includes('class="card-updated-date"')) return whole;
    const updatedAt = metadata.get(slug)?.updatedAt || levelupUpdatedAt(slug) || levelupReleasedAt(slug);
    const label = formatJstDate(updatedAt);
    if (!label) return whole;
    return `${prefix}${between}<time class="card-updated-date" datetime="${label.replaceAll('.', '-')}">更新 ${label}</time>${h2}`;
  });

if (!html.includes(`id="${dateStyleId}"`)) {
  const style = `<style id="${dateStyleId}">
.card-updated-date{position:absolute;z-index:3;top:20px;left:26px;display:inline-block;color:var(--lu-muted,#7a7a72);font-size:10px;font-weight:900;line-height:1;letter-spacing:.08em;font-variant-numeric:tabular-nums;pointer-events:none}
@media(max-width:650px){.card-updated-date{top:17px;left:18px;font-size:9px}}
</style>`;
  html = html.replace('</head>', `${style}\n</head>`);
}

const oldPatchedSelection = /\s*\/\/ data-levelup-newest-order-v1:[\s\S]*?\.slice\(0, 3\);/;
html = html.replace(oldPatchedSelection, '');

const layoutStart = "    const favorite = cards.filter((card) => card.querySelector('[data-favorite]')?.getAttribute('aria-pressed') === 'true');";
const layoutEnd = "    groups.forEach(([kind, label, group]) => {\n      if (!group.length) return;\n      home.appendChild(makeDivider(kind, label, group.length));\n      group.forEach((card) => home.appendChild(card));\n    });";
const startIndex = html.indexOf(layoutStart);
const endIndex = startIndex >= 0 ? html.indexOf(layoutEnd, startIndex) : -1;
if (startIndex < 0 || endIndex < 0) {
  throw new Error('LEVEL UP default catalogue layout block not found; upstream home UX changed.');
}
const replacement = `    // ${marker}: default catalogue is always last-updated first.\n    const updated = [...cards].sort((a, b) => {\n      const au = Number(a.dataset.updatedAt || 0);\n      const bu = Number(b.dataset.updatedAt || 0);\n      const ar = Number(a.dataset.releasedAt || 0);\n      const br = Number(b.dataset.releasedAt || 0);\n      return bu - au || br - ar || originalIndex.get(a) - originalIndex.get(b);\n    });\n    if (updated.length) {\n      home.appendChild(makeDivider('new', '新着順', updated.length));\n      updated.forEach((card) => home.appendChild(card));\n    }`;
html = html.slice(0, startIndex) + replacement + html.slice(endIndex + layoutEnd.length);

// Match initial HTML order to the runtime order as well, avoiding a visible reorder flash.
const gridMatch = html.match(/<div class="grid"([^>]*)>([\s\S]*?)<\/div>\s*<\/section>/);
if (gridMatch) {
  const articleRegex = /<article\b[^>]*\bdata-game="([^"]+)"[^>]*>[\s\S]*?<\/article>/g;
  const articles = [...gridMatch[2].matchAll(articleRegex)].map((match) => ({ slug: match[1], html: match[0] }));
  if (articles.length >= 3) {
    articles.sort((a, b) => {
      const au = metadata.get(a.slug)?.updatedAt || 0;
      const bu = metadata.get(b.slug)?.updatedAt || 0;
      const ar = metadata.get(a.slug)?.releasedAt || 0;
      const br = metadata.get(b.slug)?.releasedAt || 0;
      return bu - au || br - ar;
    });
    const sortedInner = articles.map((item) => item.html).join('\n');
    html = html.replace(gridMatch[0], `<div class="grid"${gridMatch[1]}>${sortedInner}</div></section>`);
  }
}

fs.writeFileSync(homePath, html);

const finalHome = fs.readFileSync(homePath, 'utf8');
if (!finalHome.includes(marker)) throw new Error('LEVEL UP updated-order patch marker missing.');
if (!finalHome.includes('data-updated-at=')) throw new Error('LEVEL UP update timestamps missing from cards.');
if (!finalHome.includes('class="card-updated-date"')) throw new Error('LEVEL UP visible update dates missing from cards.');
if (!finalHome.includes("makeDivider('new', '新着順', updated.length)")) throw new Error('LEVEL UP newest-first runtime layout missing.');
if (datedCards < Math.max(3, Math.floor((catalog.games || []).length * 0.9))) {
  throw new Error(`Could not resolve update timestamps for enough LEVEL UP cards: ${datedCards}/${(catalog.games || []).length}`);
}

const newest = [...(catalog.games || [])].slice(0, 5).map((game) => `${game.slug}:${game.updatedDate}`).join(' > ');
console.log(`[Firebase] LEVEL UP cards sorted by last update; visible dates added. Newest: ${newest}`);
