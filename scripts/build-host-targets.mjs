import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, 'apps');
const outRoot = path.join(root, '.dist');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'deploy-targets.json'), 'utf8'));

const cloudflareOut = path.join(outRoot, 'cloudflare');
const firebaseOut = path.join(outRoot, 'firebase');
const excludedCloudflareCategories = new Set(policy.targets.cloudflarePages.excludeCategories || []);
const excludedCloudflareSlugs = new Set(policy.targets.cloudflarePages.excludeSlugs || []);
const firebaseCategories = new Set(policy.targets.firebaseHosting.categories || []);
const humanOnlySlugs = new Set(policy.targets.humanTestOnly.slugs || []);

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'apps'), { recursive: true });
}

function categoryOf(slug) {
  return GAME_META[slug]?.[0] || 'other';
}

function copyGame(slug, targetRoot) {
  const source = path.join(appsDir, slug);
  const target = path.join(targetRoot, 'apps', slug);
  fs.cpSync(source, target, { recursive: true });
}

function extractTitle(slug) {
  const indexPath = path.join(appsDir, slug, 'index.html');
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim();
  } catch {}
  return slug;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function writeManifest(targetRoot, target, games) {
  fs.writeFileSync(
    path.join(targetRoot, 'manifest.json'),
    JSON.stringify({ target, generatedAt: new Date().toISOString(), games }, null, 2) + '\n',
  );
}

function writeIndex(targetRoot, heading, games) {
  const cards = games
    .map((game) => {
      const meta = GAME_META[game.slug];
      const description = meta?.[1] || '';
      return `
        <a class="card" href="/apps/${encodeURIComponent(game.slug)}/">
          <div class="tag">${escapeHtml(game.category)}</div>
          <h2>${escapeHtml(game.title)}</h2>
          <p>${escapeHtml(description)}</p>
          <span>PLAY →</span>
        </a>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(heading)}</title>
  <style>
    :root{color-scheme:dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0b0d12;color:#f7f7f8}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#192134 0,#0b0d12 45%);min-height:100vh}
    main{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:54px 0 80px}
    header{margin-bottom:28px}h1{font-size:clamp(32px,7vw,64px);line-height:1;margin:0 0 12px;letter-spacing:-.04em}
    .lead{color:#aeb7c8;margin:0;font-size:15px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
    .card{display:block;text-decoration:none;color:inherit;border:1px solid #283248;background:#121722cc;border-radius:18px;padding:20px;min-height:190px;transition:.18s transform,.18s border-color,.18s background}
    .card:hover{transform:translateY(-3px);border-color:#6d7fa3;background:#171e2c}.card h2{font-size:20px;margin:10px 0 8px}.card p{color:#aeb7c8;font-size:13px;line-height:1.65;margin:0 0 18px}.card span{font-weight:800;font-size:12px;letter-spacing:.08em}
    .tag{display:inline-block;border:1px solid #34415b;border-radius:999px;padding:4px 8px;color:#8fa4ce;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(heading)}</h1>
      <p class="lead">通常ゲーム ${games.length}本。404・LEVEL UP・AAA LABは別ホストで管理しています。</p>
    </header>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>\n`;

  fs.writeFileSync(path.join(targetRoot, 'index.html'), html);
}

resetDir(cloudflareOut);
resetDir(firebaseOut);

const cloudflareGames = [];
const firebaseGames = [];
const skipped = [];

const entries = fs.existsSync(appsDir)
  ? fs.readdirSync(appsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];

for (const entry of entries) {
  const slug = entry.name;
  const indexPath = path.join(appsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) continue;

  const category = categoryOf(slug);
  const title = extractTitle(slug);
  const humanOnly = humanOnlySlugs.has(slug) || category === 'aaa-lab';

  if (humanOnly) {
    skipped.push({ slug, category, reason: 'human-test-only' });
    continue;
  }

  if (firebaseCategories.has(category)) {
    copyGame(slug, firebaseOut);
    firebaseGames.push({ slug, category, title });
    continue;
  }

  if (excludedCloudflareSlugs.has(slug) || excludedCloudflareCategories.has(category)) {
    skipped.push({ slug, category, reason: 'excluded-from-cloudflare' });
    continue;
  }

  copyGame(slug, cloudflareOut);
  cloudflareGames.push({ slug, category, title });
}

writeManifest(cloudflareOut, 'cloudflare-pages', cloudflareGames);
writeManifest(firebaseOut, 'firebase-hosting', firebaseGames);
writeIndex(cloudflareOut, 'hitobito games / normal', cloudflareGames);
writeIndex(firebaseOut, 'LEVEL UP', firebaseGames);
fs.writeFileSync(path.join(outRoot, 'skipped.json'), JSON.stringify(skipped, null, 2) + '\n');

console.log(`[Hosting] Cloudflare bundle: ${cloudflareGames.length} games -> .dist/cloudflare`);
console.log(`[Hosting] Firebase bundle: ${firebaseGames.length} games -> .dist/firebase`);
console.log(`[Hosting] Skipped / protected: ${skipped.length} games`);
