import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found for result-steps book card.');
}

const copies = [
  {
    slug: 'result-steps',
    title: '努力しているのに結果が見えない人の「結果が出るまで、あと○歩」',
    obi: '見えない積み上げを、今日の1歩として確かめる。',
  },
  {
    slug: '100oku-connection',
    title: '将来につながる出会いを切り捨てない「目の前の人が100億円」練習',
    obi: '全員に深く関わらず、細い接点だけ残して偶然のつながりを待つ。',
  },
  {
    slug: 'gokigen-millionaire',
    title: '楽しいことをすぐ忘れる人の 今日の「楽しかった」を100万Gまで貯める ご機嫌ミリオネア',
    obi: '小さな楽しさに値段をつけるほど、今日のプラスが目に見えて残る。',
  },
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

for (const { slug, title, obi } of copies) {
  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} missing from LEVEL UP catalog.`);
  game.title = title;
  game.description = obi;

  const cardPattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
  const match = html.match(cardPattern);
  if (!match) throw new Error(`${slug} card missing from LEVEL UP home.`);

  let body = match[2].replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
  if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error(`${slug} card title missing.`);
  body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(title)}</h2>\n      <p class="book-obi">${escapeHtml(obi)}</p>`);
  body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(title)}をお気に入りに追加"`);
  html = html.replace(cardPattern, `$1${body}$3`);
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
for (const { slug, obi } of copies) {
  if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(obi)}</p>`)) {
    throw new Error(`${slug} book card injection failed.`);
  }
}
console.log('[Firebase] result-steps + current new release title/obi copy injected.');