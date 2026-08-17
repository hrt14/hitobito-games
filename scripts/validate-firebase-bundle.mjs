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
  if (!html.includes('id="levelup-home-fixed"')) {
    problems.push(`${game.slug}: LEVEL UP home button missing`);
  }
  if (!html.includes('href="https://levelup.hitobito.jp/"')) {
    problems.push(`${game.slug}: LEVEL UP home button target is incorrect`);
  }
  if (!html.includes('<svg viewBox="0 0 24 24"')) {
    problems.push(`${game.slug}: LEVEL UP home icon missing`);
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

const ato5minIndexPath = path.join(outDir, 'apps', 'ato-5min', 'index.html');
const ato5minIndex = fs.existsSync(ato5minIndexPath) ? fs.readFileSync(ato5minIndexPath, 'utf8') : '';
if (!ato5minIndex.includes('./game.js?v=')) {
  problems.push('ato-5min: versioned game.js reference missing');
}

const ato5minGamePath = path.join(outDir, 'apps', 'ato-5min', 'game.js');
if (!fs.existsSync(ato5minGamePath)) {
  problems.push('ato-5min: game.js missing');
} else {
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
  for (const required of ['RESPAWN COMPLETE', '30秒だけやる', '始められた？', 'もっと小さくした']) {
    if (!meetingGame.includes(required)) problems.push(`meeting-respawn: game flow missing ${required}`);
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
    problems.push(`catalog: ${game.slug} is not in Firebase manifest`);
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

if (catalog.games.length !== 25) {
  problems.push(`catalog: expected 25 curated games, found ${catalog.games.length}`);
}

if (problems.length) {
  console.error('[Firebase validation] FAILED');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`[Firebase validation] OK: ${catalog.games.length} curated LEVEL UP games; ${manifest.games.length} bundled app directories verified; shared account, refresh button, favorites-first sorting, and app home buttons present`);
