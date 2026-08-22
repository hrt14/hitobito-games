import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const manifestPath = path.join(outDir, 'manifest.json');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');
const requiredHomeAssets = ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest'];
const accountAssetPath = path.join(outDir, 'levelup-account.js');

if (!fs.existsSync(manifestPath) || !fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('Firebase bundle is missing. Run npm run build:firebase first.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const problems = [];

for (const game of manifest.games) {
  const dir = path.join(outDir, 'apps', game.slug);
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    problems.push(`${game.slug}: index.html missing`);
    continue;
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('id="levelup-nav-fixed"')) {
    problems.push(`${game.slug}: LEVEL UP navigation menu missing`);
  }
  if (!html.includes('id="levelup-nav-toggle"')) {
    problems.push(`${game.slug}: LEVEL UP hamburger toggle missing`);
  }
  if (!html.includes('id="levelup-nav-menu"')) {
    problems.push(`${game.slug}: LEVEL UP navigation panel missing`);
  }
  if (!html.includes('href="https://levelup.hitobito.jp/"')) {
    problems.push(`${game.slug}: LEVEL UP home navigation target is incorrect`);
  }
  if (!html.includes('aria-label="LEVEL UPメニューを開く"')) {
    problems.push(`${game.slug}: LEVEL UP hamburger accessibility label missing`);
  }
  if (!html.includes('data-levelup-account') || !html.includes(`data-game-slug="${game.slug}"`)) {
    problems.push(`${game.slug}: shared LEVEL UP account missing`);
  }

  const refs = [...html.matchAll(/(?:src|href)=["'](\.\/[^"'#?]+)["']/g)].map((m) => m[1]);
  for (const ref of refs) {
    const target = path.resolve(dir, ref);
    if (!target.startsWith(dir + path.sep) && target !== dir) {
      problems.push(`${game.slug}: unsafe relative asset ${ref}`);
      continue;
    }
    if (!fs.existsSync(target)) {
      problems.push(`${game.slug}: missing relative asset ${ref}`);
    }
  }
}

const ato5minDir = path.join(outDir, 'apps', 'ato-5min');
const ato5minIndexPath = path.join(ato5minDir, 'index.html');
const ato5minIndex = fs.existsSync(ato5minIndexPath) ? fs.readFileSync(ato5minIndexPath, 'utf8') : '';
const ato5minGamePath = path.join(ato5minDir, 'game.js');
const ato5minPackedPaths = [path.join(ato5minDir, 'game-a.bin'), path.join(ato5minDir, 'game-b.bin')];
const ato5minUsesGameJs = ato5minIndex.includes('./game.js?v=') && fs.existsSync(ato5minGamePath);
const ato5minUsesPackedLoader = ['game-a.bin', 'game-b.bin', 'DecompressionStream'].every((token) => ato5minIndex.includes(token))
  && ato5minPackedPaths.every((assetPath) => fs.existsSync(assetPath));
if (!ato5minUsesGameJs && !ato5minUsesPackedLoader) {
  problems.push('ato-5min: neither versioned game.js nor packed game loader is complete');
}
if (ato5minUsesGameJs) {
  const ato5minGame = fs.readFileSync(ato5minGamePath, 'utf8');
  if (!ato5minGame.includes("window.location.assign('https://levelup.hitobito.jp/')")) {
    problems.push('ato-5min: original home button does not return to LEVEL UP top');
  }
}

const meetingIndexPath = path.join(outDir, 'apps', 'meeting-respawn', 'index.html');
const meetingGamePath = path.join(outDir, 'apps', 'meeting-respawn', 'game.js');
const meetingStylePath = path.join(outDir, 'apps', 'meeting-respawn', 'style.css');
if (!fs.existsSync(meetingIndexPath) || !fs.existsSync(meetingGamePath) || !fs.existsSync(meetingStylePath)) {
  problems.push('meeting-respawn: app assets missing');
} else {
  const meetingIndex = fs.readFileSync(meetingIndexPath, 'utf8');
  const meetingGame = fs.readFileSync(meetingGamePath, 'utf8');
  for (const required of ['会議リスポーン | LEVEL UP', './game.js', './style.css']) {
    if (!meetingIndex.includes(required)) problems.push(`meeting-respawn: missing ${required}`);
  }
  for (const required of ['頭の残響を、置く。', '仕事の前に、休む。', '頭の霧、どう？', '次じゃなく、戻り口。', 'RESPAWN COMPLETE']) {
    if (!meetingGame.includes(required)) problems.push(`meeting-respawn: recovery flow missing ${required}`);
  }
  for (const stale of ['30秒だけやる', '始められた？', 'もっと小さくした']) {
    if (meetingGame.includes(stale)) problems.push(`meeting-respawn: stale pre-recovery flow still present ${stale}`);
  }
}

const thinkingIndexPath = path.join(outDir, 'apps', 'thinking-stairs', 'index.html');
const thinkingGamePath = path.join(outDir, 'apps', 'thinking-stairs', 'game.js');
const thinkingStylePath = path.join(outDir, 'apps', 'thinking-stairs', 'style.css');
if (!fs.existsSync(thinkingIndexPath) || !fs.existsSync(thinkingGamePath) || !fs.existsSync(thinkingStylePath)) {
  problems.push('thinking-stairs: app assets missing');
} else {
  const thinkingIndex = fs.readFileSync(thinkingIndexPath, 'utf8');
  const thinkingGame = fs.readFileSync(thinkingGamePath, 'utf8');
  for (const required of ['思考の階段 | LEVEL UP', './game.js', './style.css']) {
    if (!thinkingIndex.includes(required)) problems.push(`thinking-stairs: missing ${required}`);
  }
  for (const required of ['思考の高さより、', '切り替え。', '高い段ほど偉いわけではない', 'THINKING STAIRS']) {
    if (!thinkingGame.includes(required)) problems.push(`thinking-stairs: game flow missing ${required}`);
  }
}

const home = fs.readFileSync(homePath, 'utf8');
for (const asset of requiredHomeAssets) {
  if (!fs.existsSync(path.join(outDir, asset))) problems.push(`home: ${asset} missing`);
}
for (const reference of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/site.webmanifest']) {
  if (!home.includes(`href="${reference}"`)) problems.push(`home: missing icon reference ${reference}`);
}

const manifestSlugs = new Set(manifest.games.map((game) => game.slug));
for (const game of catalog.games) {
  if (!home.includes(`href="${game.href}"`)) {
    problems.push(`home: missing curated link ${game.href}`);
  }
  if (game.href.startsWith('/apps/') && !manifestSlugs.has(game.slug)) {
    const overrideIndex = path.join(outDir, 'apps', game.slug, 'index.html');
    if (!fs.existsSync(overrideIndex)) {
      problems.push(`catalog: ${game.slug} is neither in Firebase manifest nor a built override app`);
    }
  }
}

if (!home.includes('id="levelup-refresh"')) {
  problems.push('home: refresh button missing');
}

if (!home.includes('id="levelup-favorite-sort"')) {
  problems.push('home: favorites-first sorting missing');
}

if (!fs.existsSync(accountAssetPath)) {
  problems.push('account: levelup-account.js missing');
} else {
  const account = fs.readFileSync(accountAssetPath, 'utf8');
  for (const required of ['GoogleAuthProvider', "collection('levelupUsers')", "collection('history')", 'hitobito-levelup-favorites-v1', 'hitobito-levelup-history-v1']) {
    if (!account.includes(required)) problems.push(`account: missing ${required}`);
  }
}

if (!home.includes('data-levelup-account') || !home.includes('data-page="home"')) {
  problems.push('home: shared LEVEL UP account missing');
}

if (!Array.isArray(catalog.games) || catalog.games.length === 0) {
  problems.push('catalog: no curated games found');
} else {
  const uniqueCatalogSlugs = new Set(catalog.games.map((game) => game.slug));
  if (uniqueCatalogSlugs.size !== catalog.games.length) {
    problems.push(`catalog: duplicate slugs detected (${catalog.games.length - uniqueCatalogSlugs.size})`);
  }
  const homeCardSlugs = [...home.matchAll(/<article class="card(?: [^"]*)?"[^>]*data-game="([^"]+)"/g)].map((match) => match[1]);
  const uniqueHomeCardSlugs = new Set(homeCardSlugs);
  for (const game of catalog.games) {
    if (!uniqueHomeCardSlugs.has(game.slug)) problems.push(`home: curated card missing ${game.slug}`);
  }
  if (!home.includes(`<span>${catalog.games.length} games</span>`)) {
    problems.push(`home: game count does not match catalog (${catalog.games.length})`);
  }
}

if (problems.length) {
  console.error('[Firebase validation] FAILED');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`[Firebase validation] OK: ${catalog.games.length} curated LEVEL UP games; ${manifest.games.length} bundled app directories verified; shared account, refresh button, favorites-first sorting, and persistent navigation menus present`);
