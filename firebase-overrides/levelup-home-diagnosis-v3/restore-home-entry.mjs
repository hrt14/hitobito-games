import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');

if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home missing for moyamoya finder restore.');

let html = fs.readFileSync(homePath, 'utf8');
const searchAnchor = '<section class="levelup-search" id="levelup-search"';
const sectionPattern = /<section class="lu-v3" id="levelup-state-diagnosis-v3">[\s\S]*?<\/section>\s*/g;
const section = `
<section class="lu-v3" id="levelup-state-diagnosis-v3">
  <div class="lu-v3-kicker">MOYAMOYA FINDER</div>
  <h2>モヤモヤの正体、当てます。</h2>
  <p class="lu-v3-lead">質問に「はい / いいえ」で答えるだけ。いま何に引っかかっているかを絞り込み、最後に今やるLEVEL UPを出します。</p>
  <div class="lu-v3-start-row"><button type="button" class="lu-v3-start" id="lu-v3-start">モヤモヤを特定する →</button><span class="lu-v3-note">入力なし・約5〜7問</span></div>
</section>`;

for (const required of [
  searchAnchor,
  'id="lu-v3-sheet"',
  'data-levelup-state-diagnosis-v3',
  'id="levelup-state-diagnosis-v3-style"'
]) {
  if (!html.includes(required)) throw new Error(`LEVEL UP moyamoya finder dependency missing: ${required}`);
}

// A later category-navigation pass intentionally removed the visible v3 entry.
// Re-create exactly one entry and pin it immediately before search so the
// production order is hero -> moyamoya finder -> search -> categories -> games.
html = html.replace(sectionPattern, '');
html = html.replace(searchAnchor, `${section}\n${searchAnchor}`);
fs.writeFileSync(homePath, html);

const out = fs.readFileSync(homePath, 'utf8');
const sectionCount = (out.match(/id="levelup-state-diagnosis-v3"/g) || []).length;
if (sectionCount !== 1) throw new Error(`LEVEL UP moyamoya finder entry count must be 1, got ${sectionCount}.`);
for (const required of ['モヤモヤの正体、当てます。', 'モヤモヤを特定する →']) {
  if (!out.includes(required)) throw new Error(`LEVEL UP moyamoya finder visible copy missing: ${required}`);
}
const finderIndex = out.indexOf('id="levelup-state-diagnosis-v3"');
const searchIndex = out.indexOf('id="levelup-search"');
const categoriesIndex = out.indexOf('id="levelup-categories"');
if (!(finderIndex >= 0 && finderIndex < searchIndex && searchIndex < categoriesIndex)) {
  throw new Error('LEVEL UP home order must be moyamoya finder -> search -> categories.');
}

console.log('[Firebase] LEVEL UP moyamoya finder restored as the first action after hero.');
