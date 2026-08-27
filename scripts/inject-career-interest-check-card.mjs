import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

const cards = [
  {
    slug: 'career-interest-check',
    copy: {
      title: '3分でわかる 向いてる仕事チェック',
      kicker: '18 QUESTIONS / RIASEC',
      skill: '職業興味 / キャリア探索',
      obi: '「得意そう」ではなく「やってみたい」で選ぶ。仕事の方向を6領域で可視化。',
      description: '18の具体的な仕事活動を比べ、興味の上位2領域・職業例・1日実験まで返す。',
      forWho: '進路・転職・副業で、職業候補が多すぎて何から見ればいいか迷う人',
      purpose: '具体的な仕事活動の二択から、RIASECの6領域で自分の職業興味の方向を可視化する',
      benefit: '向いていると断定せず、次に調べる職業候補と現実で試す小さな実験を決めやすくなる',
    },
  },
  {
    slug: 'nenshu-shindan',
    copy: {
      title: '30問でわかる あなたの「市場年収」診断',
      kicker: 'NO SALARY INPUT / 30 TAPS',
      skill: '市場価値 / キャリア棚卸し',
      obi: '年収は入力しない。役割・成果・専門性・希少性から市場年収レンジを推定する。',
      description: '30問すべてタップだけ。キャリア・責任範囲・専門性・事業インパクト・希少性・市場反応の6軸から市場年収レンジを出す。',
      forWho: 'いまの年収そのものを入力せず、自分の仕事の市場価値を客観的に棚卸ししたい人',
      purpose: '役割・責任・専門性・成果・希少性・市場反応を30問で分解して見る',
      benefit: '会社員としての市場年収レンジと、年収を押し上げている要因・次に伸ばす要因が分かる',
    },
  },
];

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home/catalog missing for career diagnosis card injection');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

for (const { slug, copy } of cards) {
  const game = catalog.games?.find((item) => item.slug === slug);
  if (!game) {
    if (slug === 'nenshu-shindan') continue;
    throw new Error(`${slug} is not in LEVEL UP catalog`);
  }
  Object.assign(game, copy);

  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cardRe = new RegExp(`<article\\b[^>]*data-game=["']${escaped}["'][\\s\\S]*?<\\/article>`);
  const match = html.match(cardRe);
  if (!match) throw new Error(`${slug} card missing from LEVEL UP home`);
  let card = match[0];
  card = card.replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${copy.title}</h2>`);
  if (/class="book-obi"/.test(card)) {
    card = card.replace(/<p class="book-obi">[\s\S]*?<\/p>/, `<p class="book-obi">${copy.obi}</p>`);
  } else {
    card = card.replace(/(<h2>[\s\S]*?<\/h2>)/, `$1<p class="book-obi">${copy.obi}</p>`);
  }
  card = card.replace(/<div class="kicker">[\s\S]*?<\/div>/, `<div class="kicker">${copy.kicker}</div>`);
  card = card.replace(/<div class="skill">[\s\S]*?<\/div>/, `<div class="skill">${copy.skill}</div>`);
  card = card.replace(/<p>(?![^<]*class=)[\s\S]*?<\/p>/, `<p>${copy.description}</p>`);
  card = card
    .replace(/(<span class="card-value-label">こんな人に<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.forWho}$2`)
    .replace(/(<span class="card-value-label">なんのため<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.purpose}$2`)
    .replace(/(<span class="card-value-label">ベネフィット<\/span><span class="card-value-text">)[\s\S]*?(<\/span>)/, `$1${copy.benefit}$2`);
  html = html.replace(cardRe, card);
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(homePath, html);
console.log('[LEVEL UP card] career-interest-check + nenshu-shindan specific title/obi/copy injected');
