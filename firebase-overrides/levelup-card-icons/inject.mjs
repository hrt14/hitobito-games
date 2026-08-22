import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const STYLE_ID = 'levelup-fun-card-icons-v1';

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog missing for playful card icons.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const games = Array.isArray(catalog.games) ? catalog.games : [];
if (!games.length) throw new Error('LEVEL UP card icon catalog is empty.');

const ICON_BY_SLUG = {
  '3sec-action':'⚡', 'ato-5min':'⏳', 'one-thing':'🎯', 'timecraft':'⏰', '100-turns':'🎲',
  'task-separation':'✂️', 'levelup-control':'🎛️', 'expect-nothing':'🎈', 'dont-change-people':'🧭',
  'help-me':'🛟', 'levelup-mood':'🌤️', 'extra-load':'🎒', 'mou-owatta':'🔚', 'name-it':'🏷️',
  'viewpoint-exam':'🔭', 'jinsei-title':'🎬', 'meaning-map':'🗺️', 'main-character':'🦸',
  'arigatou-sagashi':'🍀', 'levelup-smalltalk':'💬', 'watashi-zukan':'🪞', 'maa-iika':'🫧',
  'self-management':'🎚️', 'subconscious-garden':'🌱', 'azukete-neru':'🌙', 'nemuri-no-umi':'🌊',
  'nou-keshigomu':'🧽', 'boundary':'🚧', 'kotowaru':'🙅', 'assertive':'🗣️', 'approval-off':'🕶️',
  'anger-first-aid':'🧯', 'saiten-shinai':'🧮', 'jinshin-shoaku':'🤝', 'manager-line-care':'🫶',
  'meeting-timebox':'⏱️', 'todo-raid':'⚔️', 'habit-raid':'🐉', 'smartphone-escape':'📵',
  'asa-glide':'🛏️', 'asa-jikan-7days':'🌅', 'asa-tanoshimi':'☀️', 'today-last-day':'⌛',
  'fail-forward':'🛹', 'mada-dekinai':'🧩', 'pinch-chance':'🎰', 'thinking-stairs':'🪜',
  'idea-lenses-40':'💡', 'uchite':'🧰', 'matomaru':'🧱', 'hontono-shimekiri':'📅',
  'chou-tsukareta':'🔋', 'sukkiri-note':'📝', 'jibun-wa-jibun':'🦩', 'soredemo-ii-hi':'🌦️',
  'sore-honto':'🔎', 'kininaranai':'🎧', 'kanji-warukatta':'🧊', 'omoisadameru':'⚓',
  'shikata-heiki':'🥋', 'zenbu-fukusen':'🧵', 'yotei-made-tsukaeru':'🛤️', 'kokkara-best':'🃏',
  'life-plus-one':'➕', 'atsumaru':'🧲', 'ato-ikkai':'🔁', 'already-90':'🍰', 'my-job':'🧑‍💼',
  'start':'🚀', 'reaction-pattern':'🧠', 'hard-request':'🪢', 'big-tech-interview':'🧠'
};

const RULES = [
  [/睡眠|眠|布団|寝|夜/, '🌙'],
  [/時間|予定|締切|朝|時刻|会議/, '⏰'],
  [/仕事|タスク|TODO|優先|集中/, '🎯'],
  [/人間関係|会話|雑談|お願い|断|相手|部下|顧客/, '🤝'],
  [/怒|イライラ|感情|気持ち|不安|モヤモヤ/, '🌤️'],
  [/自分|自己|価値観|比較|人生/, '🪞'],
  [/考え|思考|発想|アイデア|視点|問題/, '💡'],
  [/習慣|続け|反復|毎日/, '🔁'],
  [/失敗|挑戦|行動|始め|動け/, '🚀'],
  [/疲れ|休|負荷/, '🔋'],
  [/スマホ|通知/, '📵'],
  [/お金|売上|EC|楽天|Amazon|Yahoo/, '💰'],
];

const FALLBACK = ['🛸','🦖','🎪','🧠','🧨','🎨','🪩','🧭','🦊','🐙','🪄','🧪','🎮','🛰️','🗝️','🧲','🦄','🧿','🎲','🛹'];

function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function chooseIcon(game) {
  if (ICON_BY_SLUG[game.slug]) return ICON_BY_SLUG[game.slug];
  const text = `${game.title || ''} ${game.skill || ''} ${game.description || ''} ${game.benefit || ''}`;
  const matched = RULES.find(([pattern]) => pattern.test(text));
  if (matched) return matched[1];
  return FALLBACK[hash(game.slug || text) % FALLBACK.length];
}

const iconMap = new Map(games.map((game) => [game.slug, chooseIcon(game)]));
let html = fs.readFileSync(homePath, 'utf8');
let inserted = 0;

html = html.replace(/<article\b([^>]*\bdata-game="([^"]+)"[^>]*)>/g, (whole, attrs, slug) => {
  const icon = iconMap.get(slug) || FALLBACK[hash(slug) % FALLBACK.length];
  inserted += 1;
  if (whole.includes('data-fun-icon=')) return whole;
  return `<article${attrs} data-fun-icon="${icon}">`;
});

html = html.replace(/(<article\b[^>]*\bdata-game="([^"]+)"[^>]*>)([\s\S]*?)(<button\b[^>]*class="[^"]*\bfavorite\b)/g,
  (whole, article, slug, between, favoriteStart) => {
    if (between.includes('class="fun-card-icon"')) return whole;
    const icon = iconMap.get(slug) || FALLBACK[hash(slug) % FALLBACK.length];
    return `${article}${between}<span class="fun-card-icon" aria-hidden="true">${icon}</span>${favoriteStart}`;
  });

if (!html.includes(`id="${STYLE_ID}"`)) {
  const style = `
<style id="${STYLE_ID}">
  .premium-book-card .fun-card-icon,.card .fun-card-icon{
    position:absolute!important;z-index:5!important;top:13px!important;right:62px!important;
    display:grid!important;place-items:center!important;width:40px!important;height:40px!important;
    border:1px solid color-mix(in srgb,var(--lu-line,#cbc8bd) 82%,transparent)!important;
    border-radius:14px!important;background:color-mix(in srgb,var(--lu-lime-soft,#efffa8) 74%,var(--lu-surface,#fffef8))!important;
    color:var(--lu-ink,#11110f)!important;font-size:21px!important;line-height:1!important;
    box-shadow:0 6px 16px rgba(20,20,16,.08)!important;transform:rotate(3deg)!important;
    pointer-events:none!important;user-select:none!important;-webkit-user-select:none!important;
  }
  .premium-book-card:nth-of-type(3n) .fun-card-icon,.card:nth-of-type(3n) .fun-card-icon{transform:rotate(-4deg)!important}
  .premium-book-card:nth-of-type(3n+2) .fun-card-icon,.card:nth-of-type(3n+2) .fun-card-icon{transform:rotate(1deg)!important}
  @media(max-width:650px){
    .premium-book-card .fun-card-icon,.card .fun-card-icon{
      top:9px!important;right:51px!important;width:35px!important;height:35px!important;border-radius:12px!important;font-size:18px!important;
    }
  }
</style>`;
  if (!html.includes('</head>')) throw new Error('LEVEL UP head missing for playful card icon styles.');
  html = html.replace('</head>', `${style}\n</head>`);
}

fs.writeFileSync(homePath, html);
const out = fs.readFileSync(homePath, 'utf8');
const cardCount = [...out.matchAll(/<article\b[^>]*\bdata-game="[^"]+"/g)].length;
const iconCount = (out.match(/class="fun-card-icon"/g) || []).length;
const distinctIcons = new Set([...out.matchAll(/class="fun-card-icon"[^>]*>([^<]+)<\/span>/g)].map((match) => match[1]));

if (inserted !== games.length) throw new Error(`LEVEL UP fun icon card coverage mismatch: inserted=${inserted}, catalog=${games.length}`);
if (iconCount !== cardCount || iconCount !== games.length) throw new Error(`LEVEL UP fun icon visible coverage mismatch: icons=${iconCount}, cards=${cardCount}, catalog=${games.length}`);
if (distinctIcons.size < 12) throw new Error(`LEVEL UP fun icons are not varied enough: ${distinctIcons.size} distinct icons.`);
if (!out.includes(STYLE_ID) || !out.includes('data-fun-icon=')) throw new Error('LEVEL UP playful card icon assets missing.');

console.log(`[Firebase] LEVEL UP playful icons added: ${iconCount} cards / ${distinctIcons.size} distinct icons.`);
