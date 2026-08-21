import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, 'apps');
const portalPath = path.join(root, 'index.html');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'deploy-targets.json'), 'utf8'));

const excludedCloudflareCategories = new Set(policy.targets.cloudflarePages.excludeCategories || []);
const excludedCloudflareSlugs = new Set(policy.targets.cloudflarePages.excludeSlugs || []);
const firebaseCategories = new Set(policy.targets.firebaseHosting.categories || []);
const humanOnlySlugs = new Set(policy.targets.humanTestOnly.slugs || []);

const START = '<!-- AUTO-LATEST-GAMES:START -->';
const END = '<!-- AUTO-LATEST-GAMES:END -->';

const THEMES = {
  horror: { tag: 'HORROR', icon: '◉', g1: '#28191e', g2: '#0d0b0e', glow: 'rgba(197,100,119,.14)' },
  nature: { tag: 'NATURE', icon: '✦', g1: '#162923', g2: '#0a100e', glow: 'rgba(100,170,145,.14)' },
  sim: { tag: 'SIMULATION', icon: '⌁', g1: '#2a2217', g2: '#0e0c09', glow: 'rgba(198,158,101,.14)' },
  story: { tag: 'STORY', icon: '✎', g1: '#211d2d', g2: '#0d0b11', glow: 'rgba(154,133,196,.14)' },
  adventure: { tag: 'ADVENTURE', icon: '↗', g1: '#172533', g2: '#090e13', glow: 'rgba(94,141,184,.14)' },
  other: { tag: 'GAME', icon: '◆', g1: '#19212b', g2: '#0a0e13', glow: 'rgba(119,139,162,.12)' },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function categoryOf(slug) {
  return GAME_META[slug]?.[0] || 'other';
}

function extract(html, pattern, fallback = '') {
  const match = html.match(pattern);
  return match?.[1]?.replace(/\s+/g, ' ').trim() || fallback;
}

function gitTimestamp(args) {
  try {
    const value = execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    return Number(value) || 0;
  } catch {
    return 0;
  }
}

function lastChangedAt(slug) {
  return gitTimestamp(['log', '-1', '--format=%ct', '--', `apps/${slug}`]);
}

function firstAddedAt(slug) {
  try {
    const values = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--format=%ct', '--reverse', '--', `apps/${slug}`],
      { cwd: root, encoding: 'utf8' },
    ).trim().split(/\s+/).filter(Boolean);
    return Number(values[0]) || lastChangedAt(slug);
  } catch {
    return lastChangedAt(slug);
  }
}

function isPortalGame(slug, category) {
  if (humanOnlySlugs.has(slug) || category === 'aaa-lab') return false;
  if (firebaseCategories.has(category)) return false;
  if (excludedCloudflareSlugs.has(slug) || excludedCloudflareCategories.has(category)) return false;
  return true;
}

function keepOnlyExternalCards(portal, heading) {
  const sectionPattern = new RegExp(
    `<section class="section"><div class="section-head"><h2>${heading}<\\/h2>[\\s\\S]*?<\\/div><\\/section>`,
    'm',
  );
  const section = portal.match(sectionPattern)?.[0];
  if (!section) return portal;

  const internalCardPattern = /<a class="card(?: compact)?" href="https:\/\/play\.hitobito\.jp\/apps\/[^\"]+\/"[^>]*>[\s\S]*?<\/a>\n?/g;
  const cleaned = section.replace(internalCardPattern, '');
  return portal.replace(section, cleaned);
}

let portal = fs.readFileSync(portalPath, 'utf8');
const markerPattern = new RegExp(`${START}[\\s\\S]*?${END}`, 'm');

const games = fs.readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => fs.existsSync(path.join(appsDir, slug, 'index.html')))
  .map((slug) => {
    const category = categoryOf(slug);
    const html = fs.readFileSync(path.join(appsDir, slug, 'index.html'), 'utf8');
    const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i, slug);
    const description = GAME_META[slug]?.[1]
      || extract(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || 'スマホですぐ遊べるブラウザゲーム。';
    return { slug, category, title, description, addedAt: firstAddedAt(slug) };
  })
  .filter((game) => isPortalGame(game.slug, game.category))
  .sort((a, b) => b.addedAt - a.addedAt || a.slug.localeCompare(b.slug, 'ja'));

const cards = games.map((game) => {
  const theme = THEMES[game.category] || THEMES.other;
  return `<a class="card compact" href="https://play.hitobito.jp/apps/${encodeURIComponent(game.slug)}/" data-added-at="${game.addedAt}" style="--g1:${theme.g1};--g2:${theme.g2};--glow:${theme.glow}"><div class="card-top"><span class="tag new">NEW</span><span class="arrow">↗</span></div><div class="mark"><span class="icon">${theme.icon}</span><span class="meta">${escapeHtml(theme.tag)}</span></div><div><h3>${escapeHtml(game.title)}</h3><p>${escapeHtml(game.description)}</p></div></a>`;
}).join('\n');

const block = `${START}\n<section class="section" id="latest-games"><div class="section-head"><h2>Latest Games</h2><span>追加された新しい順に自動更新</span></div><div class="grid">\n${cards}\n</div></section>\n${END}`;

portal = portal.replace(markerPattern, '');
const featuredAnchor = '<section class="section featured-section">';
if (!portal.includes(featuredAnchor)) {
  throw new Error('Could not find the Featured section anchor in index.html');
}
portal = portal.replace(featuredAnchor, `${block}\n${featuredAnchor}`);

portal = keepOnlyExternalCards(portal, 'Games');
portal = keepOnlyExternalCards(portal, 'More Games');

fs.writeFileSync(portalPath, portal);
console.log(`[Portal] Synced ${games.length} games in newest-added order`);
