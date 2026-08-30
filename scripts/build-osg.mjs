import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = path.join(root, 'oneshotgames', 'site');
const gamesDir = path.join(root, 'oneshotgames', 'games');
const outDir = path.join(root, '.dist', 'osg');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function escAttr(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

fs.rmSync(outDir, { recursive: true, force: true });
copyDir(siteDir, outDir);
fs.mkdirSync(path.join(outDir, 'g'), { recursive: true });

const games = [];
if (fs.existsSync(gamesDir)) {
  for (const entry of fs.readdirSync(gamesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const src = path.join(gamesDir, entry.name);
    const indexPath = path.join(src, 'index.html');
    const metaPath = path.join(src, 'meta.json');
    if (!fs.existsSync(indexPath) || !fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const id = String(meta.id || entry.name);
    if (!/^[a-z0-9-]{2,64}$/.test(id)) throw new Error(`Invalid OneShotGames id: ${id}`);
    if (!meta.title || !meta.authorNickname) throw new Error(`Missing OneShotGames meta fields: ${id}`);
    const dest = path.join(outDir, 'g', id);
    copyDir(src, dest);
    const destIndex = path.join(dest, 'index.html');
    let html = fs.readFileSync(destIndex, 'utf8');
    if (!html.includes('data-osg-runtime')) {
      const runtime = `<script src="/osg-runtime.js" data-osg-runtime data-game-id="${escAttr(id)}" data-author="${escAttr(meta.authorNickname)}" data-title="${escAttr(meta.title)}"></script>`;
      html = html.includes('</body>') ? html.replace('</body>', `${runtime}</body>`) : `${html}${runtime}`;
      fs.writeFileSync(destIndex, html);
    }
    games.push({
      id,
      title: String(meta.title),
      description: String(meta.description || ''),
      authorNickname: String(meta.authorNickname),
      version: Math.max(1, Number(meta.version) || 1),
      createdAt: String(meta.createdAt || ''),
      updatedAt: String(meta.updatedAt || meta.createdAt || ''),
      url: `/g/${id}/`
    });
  }
}

games.sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
fs.writeFileSync(path.join(outDir, 'games.json'), JSON.stringify({ generatedAt: new Date().toISOString(), games }, null, 2) + '\n');

for (const required of ['index.html', 'app.js', 'styles.css', 'logo.svg', 'osg-runtime.js', 'games.json']) {
  if (!fs.existsSync(path.join(outDir, required))) throw new Error(`Missing OSG build file: ${required}`);
}
if (!games.length) throw new Error('OneShotGames requires at least one playable game.');
console.log(`[OSG] built ${games.length} games into ${outDir}`);
