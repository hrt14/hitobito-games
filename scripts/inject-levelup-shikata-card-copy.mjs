import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const slug = 'shikata-heiki';
const copy = {
  forWho: '予定や努力が思い通りにならないと、それだけで失敗に感じる人',
  purpose: '予定と現実のズレを異常扱いせず、まず事実として受け入れる',
  benefit: 'ズレた瞬間の消耗を減らし、必要なら修正へ早く移りやすくなる',
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

let home = fs.readFileSync(homePath, 'utf8');
const token = `data-game="${slug}"`;
const tokenIndex = home.indexOf(token);
if (tokenIndex < 0) throw new Error(`${slug}: LEVEL UP card missing`);
const articleStart = home.lastIndexOf('<article', tokenIndex);
const articleClose = home.indexOf('</article>', tokenIndex);
if (articleStart < 0 || articleClose < 0) throw new Error(`${slug}: card bounds missing`);
const articleEnd = articleClose + '</article>'.length;
let article = home.slice(articleStart, articleEnd);

for (const [label, value] of [
  ['こんな人に', copy.forWho],
  ['なんのため', copy.purpose],
  ['ベネフィット', copy.benefit],
]) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`${slug}: ${label} field missing`);
  article = article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

home = home.slice(0, articleStart) + article + home.slice(articleEnd);
fs.writeFileSync(homePath, home);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error(`${slug}: catalog entry missing`);
Object.assign(game, copy);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

for (const value of Object.values(copy)) {
  if (!home.includes(escapeHtml(value))) throw new Error(`${slug}: copy injection failed`);
}
console.log('[Firebase] shikata-heiki card copy matched to reality-gap training.');
