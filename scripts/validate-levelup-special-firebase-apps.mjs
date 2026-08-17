import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const firebasePath = path.join(root, 'firebase.json');
const slugs = ['start', 'maa-iika', 'self-management', 'jibun-wa-jibun'];
const problems = [];

for (const slug of slugs) {
  for (const relative of [`${slug}/index.html`, `apps/${slug}/index.html`]) {
    const file = path.join(outDir, relative);
    if (!fs.existsSync(file)) {
      problems.push(`${relative}: missing`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('data-levelup-account')) problems.push(`${relative}: shared account missing`);
    if (!html.includes(`data-game-slug="${slug}"`)) problems.push(`${relative}: game slug missing`);
    if (!html.includes('firebase-auth-compat.js')) problems.push(`${relative}: Firebase Auth SDK missing`);
    if (!html.includes('href="/"')) problems.push(`${relative}: LEVEL UP home link missing`);
  }
}

const firebase = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
const redirects = firebase.hosting?.redirects || [];
for (const slug of slugs) {
  const source = `/${slug}`;
  const redirect = redirects.find((item) => item.source === source);
  if (redirect) problems.push(`${source}: must be Firebase-hosted, but redirect remains to ${redirect.destination}`);
}

if (problems.length) {
  console.error('[Firebase special apps] FAILED');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log('[Firebase special apps] OK: START / まあ、いいか。 / 自分を回せ。 / 自分は自分 are Firebase-hosted with shared login');
