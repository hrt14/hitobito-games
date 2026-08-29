import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog missing for feedback app cards.');

const COPY = {
  'sasshi-sugi-stop': {
    title: '相手の気持ちを察しすぎて疲れる人の「それ、事実？」',
    obi: '見えた事実と頭が足した推測を8問で仕分ける。',
    description: '返信・表情・短い返事から相手の内面まで決めつける前に、観察できた事実と推測を分ける反射を鍛える。',
  },
  'listening-reflex': {
    title: 'すぐ助言してしまう人の 傾聴反射トレーニング「聴く。」',
    obi: '要点→感情の仮置き→開いた質問の3手を会話で反復する。',
    description: '相手の話を要約し、感情を決めつけず、続きを引き出す質問へつなぐ傾聴の反射を鍛える。',
  },
};

let html = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
for (const game of catalog.games || []) {
  const copy = COPY[game.slug];
  if (!copy) continue;
  game.description = copy.description;
  const re = new RegExp(`(<article\\b[^>]*data-game="${game.slug}"[^>]*>)([\\s\\S]*?)(<\\/article>)`);
  const match = html.match(re);
  if (!match) throw new Error(`Card not found for ${game.slug}`);
  let body = match[2];
  body = body.replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${copy.title}</h2>`);
  if (body.includes('class="book-obi"')) body = body.replace(/<[^>]*class="book-obi"[^>]*>[\s\S]*?<\/[^>]+>/, `<p class="book-obi">${copy.obi}</p>`);
  else body = body.replace(/<\/h2>/, `</h2><p class="book-obi">${copy.obi}</p>`);
  html = html.replace(re, `$1${body}$3`);
}
fs.writeFileSync(homePath, html);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] feedback-driven app card copy injected.');
