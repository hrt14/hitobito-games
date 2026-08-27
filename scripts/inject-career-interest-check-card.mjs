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
  {
    slug: 'income-akinator',
    copy: {
      title: '年収アキネーター',
      kicker: 'YES / NO ONLY · MAX 12',
      skill: '仕事推理 / 自己理解',
      obi: '職業名も年収も聞かない。「はい / いいえ」だけで、仕事と年収を当てにいく。',
      description: '働き方・専門性・責任・顧客接点などを質問し、回答ごとに候補を絞って職業とゲーム内推定年収を予想する。',
      forWho: '自分の仕事が周辺の特徴だけでどこまで当てられるか、短時間で試してみたい人',
      purpose: '職業名や年収を直接入力せず、働き方の特徴から候補を絞る推理ゲームを楽しむ',
      benefit: '自分の仕事を特徴づけている要素が、結果の決め手と一緒に見えてくる',
    },
  },
  {
    slug: 'negotiator-sleep',
    copy: {
      title: 'NEGOTIATOR｜寝かせる',
      kicker: 'NO IS PART OF THE GAME',
      skill: '就寝前の切り替え / 小さい行動',
      obi: '「まだ寝ない」と断っていい。NOのたびに要求を小さくして、最後は3秒だけ目を閉じる。',
      description: '仕事・照明・スマホ・体勢を少しずつ寝る側へ。拒否理由に合わせて条件が変わる睡眠前の交渉ゲーム。',
      forWho: '寝た方がいいと思っていても「まだ仕事」「眠くない」「スマホを見たい」と切り替えられない人',
      purpose: '「寝る」という大きな決断を、照明・スマホ・体勢・数秒の目閉じまで小さく分解する',
      benefit: '寝る気分になるのを待たず、今できる最小の一手だけを睡眠側へ進めやすくなる',
    },
  },
  {
    slug: 'negotiator-rest',
    copy: {
      title: 'NEGOTIATOR｜休ませる',
      kicker: 'NO IS PART OF THE GAME',
      skill: '休息への切り替え / 小さい行動',
      obi: '「休めない」と断っていい。2週間から5分、1分、水一口まで要求を下げて交渉する。',
      description: 'NOを材料に条件を小さくし、水・脱力・視線オフ・呼吸など数十秒の休息まで実際に始める。',
      forWho: '疲れていても「仕事がある」「休む暇がない」と止まれず、休息へ切り替えにくい人',
      purpose: '「休む」という大きな要求を、水・脱力・視線オフ・呼吸など小さな行動へ分解する',
      benefit: '長く休めない時でも、数十秒から休息を実際に始めやすくなる',
    },
  },
  {
    slug: 'negotiator-move',
    copy: {
      title: 'NEGOTIATOR｜動かす',
      kicker: 'NO IS PART OF THE GAME',
      skill: '着手 / 小さい行動',
      obi: '「時間がない」「やる気がない」と断っていい。30分の要求を、最後は1動作まで削る。',
      description: '仕事・勉強・家事・運動を選び、NOの理由に合わせて30分→5分→60秒→10秒→1動作まで条件を下げる交渉ゲーム。',
      forWho: 'やるべきことは分かっているのに、時間・やる気・面倒さで最初の一歩が重くなっている人',
      purpose: '「ちゃんと始める」という大きな要求を、今できる最小の現実行動まで交渉で小さくする',
      benefit: 'やる気を待たず、自分が受け入れられる条件まで下げて最初の10秒を実際に始めやすくなる',
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
console.log('[LEVEL UP card] career diagnosis + NEGOTIATOR specific title/obi/copy injected');
