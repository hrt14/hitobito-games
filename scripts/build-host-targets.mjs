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

function writeManifest(targetRoot, target, games) {
  fs.writeFileSync(
    path.join(targetRoot, 'manifest.json'),
    JSON.stringify({ target, generatedAt: new Date().toISOString(), games }, null, 2) + '\n',
  );
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
  const humanOnly = humanOnlySlugs.has(slug) || category === 'aaa-lab';

  if (humanOnly) {
    skipped.push({ slug, category, reason: 'human-test-only' });
    continue;
  }

  if (firebaseCategories.has(category)) {
    copyGame(slug, firebaseOut);
    firebaseGames.push({ slug, category });
    continue;
  }

  if (excludedCloudflareSlugs.has(slug) || excludedCloudflareCategories.has(category)) {
    skipped.push({ slug, category, reason: 'excluded-from-cloudflare' });
    continue;
  }

  copyGame(slug, cloudflareOut);
  cloudflareGames.push({ slug, category });
}

writeManifest(cloudflareOut, 'cloudflare-pages', cloudflareGames);
writeManifest(firebaseOut, 'firebase-hosting', firebaseGames);
fs.writeFileSync(path.join(outRoot, 'skipped.json'), JSON.stringify(skipped, null, 2) + '\n');

console.log(`[Hosting] Cloudflare bundle: ${cloudflareGames.length} games -> .dist/cloudflare`);
console.log(`[Hosting] Firebase bundle: ${firebaseGames.length} games -> .dist/firebase`);
console.log(`[Hosting] Skipped / protected: ${skipped.length} games`);
