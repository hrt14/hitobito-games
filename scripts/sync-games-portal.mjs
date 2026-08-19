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
const LIMIT = 12;

const THEMES = {
  horror: { tag: 'HORROR', icon: '◉', g1: '#321722', g2: '#09080b', glow: 'rgba(255,92,104,.18)' },
  nature: { tag: 'NATURE', icon: '✦', g1: '#17372d', g2: '#07100d', glow: 'rgba(114,230,168,.17)' },
  sim: { tag: 'SIMULATION', icon: '⌁', g1: '#352719', g2: '#0c0906', glow: 'rgba(255,191,105,.17)' },
  story: { tag: 'STORY', icon: '✎', g1: '#2a1c3a', g2: '#0b0810', glow: 'rgba(196,155,255,.17)' },
  adventure: { tag: 'ADVENTURE', icon: '↗', g1: '#172d43', g2: '#070d13', glow: 'rgba(114,184,255,.17)' },
  other: { tag: 'GAME', icon: '◆', g1: '#202630', g2: '#090b0f', glow: 'rgba(169,180,199,.15)' },
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

function lastChangedAt(slug) {
  try {
    const value = execFileSync(
      'git',
      ['log', '-1', '--format=%ct', '--', `apps/${slug}`],
      { cwd: root, encoding: 'utf8' },
    ).trim();
    return Number(value) || 0;
  } catch {
    return 0;
  }
}

function isPortalGame(slug, category) {
  if (humanOnlySlugs.has(slug) || category === 'aaa-lab') return false;
  if (firebaseCategories.has(category)) return false;
  if (excludedCloudflareSlugs.has(slug) || excludedCloudflareCategories.has(category)) return false;
  return true;
}

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
    return { slug, category, title, description, changedAt: lastChangedAt(slug) };
  })
  .filter((game) => isPortalGame(game.slug, game.category))
  .sort((a, b) => b.changedAt - a.changedAt || a.slug.localeCompare(b.slug, 'ja'))
  .slice(0, LIMIT);

const cards = games.map((game) => {
  const theme = THEMES[game.category] || THEMES.other;
  return `<a class="card compact" href="https://play.hitobito.jp/apps/${encodeURIComponent(game.slug)}/" style="--g1:${theme.g1};--g2:${theme.g2};--glow:${theme.glow}"><div class="card-top"><span class="tag new">NEW</span><span class="arrow">↗</span></div><div class="mark"><span class="icon">${theme.icon}</span><span class="meta">${escapeHtml(theme.tag)}</span></div><div><h3>${escapeHtml(game.title)}</h3><p>${escapeHtml(game.description)}</p></div></a>`;
}).join('\n');

const block = `${START}\n<section class="section" id="latest-games"><div class="section-head"><h2>Latest Games</h2><span>新しく作ったゲーム</span></div><div class="grid">\n${cards}\n<a class="card compact" href="https://play.hitobito.jp/" style="--g1:#242a18;--g2:#090b07;--glow:rgba(216,255,91,.18)"><div class="card-top"><span class="tag">ALL GAMES</span><span class="arrow">↗</span></div><div class="mark"><span class="icon">＋</span><span class="meta">FULL CATALOG</span></div><div><h3>すべてのゲーム</h3><p>hitobito PLAY のゲーム一覧を開く。</p></div></a>\n</div></section>\n${END}`;

let portal = fs.readFileSync(portalPath, 'utf8');
const markerPattern = new RegExp(`${START}[\\s\\S]*?${END}`, 'm');

if (markerPattern.test(portal)) {
  portal = portal.replace(markerPattern, block);
} else {
  const anchor = '<section class="section"><div class="section-head"><h2>Games</h2>';
  if (!portal.includes(anchor)) {
    throw new Error('Could not find the Games section anchor in index.html');
  }
  portal = portal.replace(anchor, `${block}\n${anchor}`);
}

fs.writeFileSync(portalPath, portal);
console.log(`[Portal] Synced ${games.length} latest game links into index.html`);
