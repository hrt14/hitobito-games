import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog not found for ten-years-back card.');

const slug = 'ten-years-back';
const meta = {
  title: '10歳若返りました。', kicker: 'RETURN FROM 10 YEARS LATER', skill: '時間感覚 / 今日の一手', icon: '−10',
  description: '10年後まで進んでから今日へ巻き戻し、「もう遅い」を「10歳若返った今日」に変えて、未来の後悔を今日の1個へ落とす。',
  forWho: '年齢や時間の経過を意識して「もう遅い」「時間がない」「このままでいいのか」と感じている人',
  purpose: '10年後の自分を参照点にして現在へ戻り、いま持っている10年の価値を体感して今日の行動へ変える',
  benefit: '「まだ間に合う」を気休めで終わらせず、今日やる具体的な1個まで決めやすくする',
};
const bookTitle = '「もう遅い」と感じる人の 10年後から戻って10歳若返る体験';
const obi = '未来の後悔を、10歳若い今日の「やること1個」に変える。';
const escapeHtml = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const game = catalog.games.find((item) => item.slug === slug);
if (!game) throw new Error('ten-years-back missing from LEVEL UP catalog.');
Object.assign(game, meta, { title: bookTitle, description: obi });
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
const cardPattern = new RegExp(`(<article\\b[^>]*\\bdata-game="${slug}"[^>]*>)([\\s\\S]*?)(</article>)`);
const match = html.match(cardPattern);
if (!match) throw new Error('ten-years-back card missing from LEVEL UP home.');
let body = match[2];
body = body.replace(/<div class="icon">[\s\S]*?<\/div>/, `<div class="icon">${escapeHtml(meta.icon)}</div>`);
body = body.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${escapeHtml(meta.kicker)}</div>`);
body = body.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${escapeHtml(meta.skill)}</div>`);
body = body.replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(body)) throw new Error('ten-years-back card title missing.');
body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(bookTitle)}</h2>\n      <p class="book-obi">${escapeHtml(obi)}</p>`);
body = body.replace(/<p>([\s\S]*?)<\/p>/, `<p>${escapeHtml(meta.description)}</p>`);
body = body.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(bookTitle)}をお気に入りに追加"`);
const cardValues = [meta.forWho, meta.purpose, meta.benefit];
let valueIndex = 0;
body = body.replace(/<span class="card-value-text">[\s\S]*?<\/span>/g, () => `<span class="card-value-text">${escapeHtml(cardValues[valueIndex++] || '')}</span>`);
if (valueIndex !== 3) throw new Error(`ten-years-back expected 3 rendered card values, found ${valueIndex}.`);
html = html.replace(cardPattern, `$1${body}$3`);
fs.writeFileSync(homePath, html);
const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes(`data-game="${slug}"`) || !finalHtml.includes(`<p class="book-obi">${escapeHtml(obi)}</p>`)) throw new Error('ten-years-back card injection failed.');
for (const required of cardValues) {
  if (!finalHtml.includes(escapeHtml(required))) throw new Error(`ten-years-back rendered card value missing: ${required}`);
}
console.log('[Firebase] ten-years-back discovery + title/obi + rendered values injected.');
