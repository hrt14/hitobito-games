import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const SLUG = 'yesterday-self';
const CARD = {
  title: '昨日の自分に1勝',
  kicker: 'BEAT YESTERDAY, NOT PEOPLE',
  skill: '比較リセット / 自己成長',
  icon: '1–0',
  forWho: '他人の成果や進み方を見るたび「自分は遅い」と採点して、気持ちや行動が弱くなる人',
  purpose: '比較そのものを禁止せず、対戦相手を他人から「昨日の自分」へ入れ替える反射を作る',
  benefit: '他人との勝敗で消耗せず、今日ひとつだけ自分で動かせる小さな前進へ戻りやすくなる',
};

GAME_META[SLUG] = [
  'levelup',
  '他人と比べてしまった瞬間、比較相手を対戦表から外し、昨日の自分を相手に今日ひとつだけ具体的な1勝を作る。',
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function patchBuiltCard() {
  const entry = String(process.argv[1] || '');
  if (!entry.endsWith('inject-levelup-auto-discover.mjs')) return;

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.resolve(scriptDir, '..', '.dist', 'firebase');
  const catalogPath = path.join(outDir, 'levelup-catalog.json');
  const homePath = path.join(outDir, 'index.html');
  if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) return;

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const game = Array.isArray(catalog.games) ? catalog.games.find((item) => item.slug === SLUG) : null;
  if (!game) return;

  Object.assign(game, CARD);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

  let html = fs.readFileSync(homePath, 'utf8');
  const cardPattern = new RegExp(`<article class="card is-new" data-game="${SLUG}"[\\s\\S]*?<\\/article>`);
  const match = html.match(cardPattern);
  if (!match) return;

  let card = match[0];
  card = card
    .replace(/<div class="icon">[\s\S]*?<\/div>/, `<div class="icon">${escapeHtml(CARD.icon)}</div>`)
    .replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${escapeHtml(CARD.kicker)}</div>`)
    .replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${escapeHtml(CARD.skill)}</div>`)
    .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${escapeHtml(CARD.title)}</h2>`);

  const values = [CARD.forWho, CARD.purpose, CARD.benefit];
  let valueIndex = 0;
  card = card.replace(/<span class="card-value-text">[\s\S]*?<\/span>/g, () => {
    const value = values[valueIndex++] || '';
    return `<span class="card-value-text">${escapeHtml(value)}</span>`;
  });

  html = html.replace(match[0], card);
  fs.writeFileSync(homePath, html);
}

process.on('beforeExit', patchBuiltCard);
