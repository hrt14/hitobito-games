import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'shikata-heiki';
const source = path.join(root, 'apps', slug);
const firebaseOut = path.join(root, '.dist', 'firebase');
const cloudflareOut = path.join(root, '.dist', 'cloudflare');
const firebaseManifestPath = path.join(firebaseOut, 'manifest.json');
const cloudflareManifestPath = path.join(cloudflareOut, 'manifest.json');

if (!fs.existsSync(path.join(source, 'index.html'))) throw new Error(`${slug}: index.html missing`);
if (!fs.existsSync(firebaseManifestPath)) throw new Error('Firebase manifest missing. Run build:hosting first.');

const firebaseManifest = JSON.parse(fs.readFileSync(firebaseManifestPath, 'utf8'));
const title = '思い通りにならなくても平気';
const existing = firebaseManifest.games.find((game) => game.slug === slug);
if (existing) Object.assign(existing, { category: 'levelup', title });
else firebaseManifest.games.push({ slug, category: 'levelup', title });

const destination = path.join(firebaseOut, 'apps', slug);
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });
fs.writeFileSync(firebaseManifestPath, JSON.stringify(firebaseManifest, null, 2) + '\n');

if (fs.existsSync(cloudflareManifestPath)) {
  const cloudflareManifest = JSON.parse(fs.readFileSync(cloudflareManifestPath, 'utf8'));
  cloudflareManifest.games = cloudflareManifest.games.filter((game) => game.slug !== slug);
  fs.writeFileSync(cloudflareManifestPath, JSON.stringify(cloudflareManifest, null, 2) + '\n');
  fs.rmSync(path.join(cloudflareOut, 'apps', slug), { recursive: true, force: true });
}

console.log(`[Firebase] Registered ${slug} as LEVEL UP and removed Cloudflare duplicate.`);
