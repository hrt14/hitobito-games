import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const homePath = path.join(outDir, 'index.html');

const APPS = {
  'iya-feeling-first-aid': {
    title: '嫌な気持ち、いったん下げる',
    kicker: 'SUDDEN BAD FEELING / ABOUT 1 MIN',
    skill: '急な不快感 / 切り替え',
    obi: '理由はあとでいい。8秒待つ→名前を1つつける→今へ戻す。',
    description: '急に不安・イライラ・恥ずかしさなどが湧いたとき、原因探しより先に約1分で勢いを1段下げる。',
    forWho: '理由がはっきりしない嫌な気持ちが急に湧き、すぐ原因探しや反応を始めそうな人',
    purpose: '感情を消そうとせず、8秒待つ・一語で名前をつける・体や視線を今へ戻す順番を実行する',
    benefit: '今すぐ何とかしなければという圧を少し下げ、次の数分へ戻りやすくなる',
  },
  'negotiator-procrastination': {
    title: 'NEGOTIATOR｜先延ばしをやめろ',
    kicker: 'PROCRASTINATION / START NOW',
    skill: '先延ばし / 着手',
    obi: '25分が無理なら5分。5分が無理なら60秒。最後は30秒だけ始める。',
    description: 'やるべきことを先延ばししている瞬間、NOを材料に要求を小さくし、現実の最初の操作まで交渉する。',
    forWho: 'やるべき仕事・勉強・家事があるのに、時間・気分・完璧主義を理由に始められない人',
    purpose: '大きい要求を断りながら条件を小さくし、やる気ではなく最小の着手へ接続する',
    benefit: '今の抵抗を否定せず、30秒〜60秒の現実行動をその場で1回始めやすくなる',
  },
  'negotiator-stop-short-videos': {
    title: 'NEGOTIATOR｜小動画やめろ',
    kicker: 'SHORT VIDEO / BREAK AUTOPILOT',
    skill: 'ショート動画 / 自動視聴',
    obi: '禁止しない。3秒止める→親指を離す→5秒伏せる。自動運転へ割り込む。',
    description: 'ショート動画を延々見てしまう瞬間、要求を極小化して視聴の自動運転を一度切る。',
    forWho: 'あと1本のつもりでショート動画を見続け、やめようとすると反発したくなる人',
    purpose: '完全禁止ではなく、3秒停止・親指を離す・スマホを伏せるなど小さい摩擦を実行する',
    benefit: '意志力だけに頼らず、次の動画へ自動で進む流れへ一度割り込みやすくなる',
  },
  'negotiator-anger-reply': {
    title: 'NEGOTIATOR｜怒りの返信をやめろ',
    kicker: 'ANGER REPLY / DO NOT SEND YET',
    skill: '怒り / 返信保留',
    obi: '20分が無理なら20秒。最後は5秒だけ送らない。目的を確認してから選ぶ。',
    description: '怒った勢いで返信を送りそうな瞬間、保留時間を小さく交渉し、反射送信から一度離れる。',
    forWho: '腹が立った直後にメール・LINE・チャットを返し、あとで言い方を後悔しやすい人',
    purpose: '怒りを否定せず、送信だけ数秒〜数十分保留して返信の目的を言葉にする',
    benefit: '即レスの反射から離れ、訂正・主導権・感情放出の目的に合う行動を選び直しやすくなる',
  },
  'how-seen': {
    title: '他人からどう見えてる？診断',
    kicker: 'SELF IMAGE / OUTSIDE VIEW',
    skill: '自己イメージ / 他者評価',
    obi: '8つの二択で自分像を出し、友達の匿名評価と比べてズレを見る。',
    description: '自分が思う自分と、他人から見える自分のズレを、8つの二択と友達の匿名評価で比べる診断。',
    forWho: '自分が周囲からどう見えているのか気になり、自己イメージとの違いを確かめたい人',
    purpose: 'まず自分の自己イメージを8つの二択で出し、友達から受けた匿名評価と同じ軸で比較する',
    benefit: '自分の見立てと他人から見える印象の一致・ズレを具体的に捉えやすくなる',
  },
};

if (!fs.existsSync(catalogPath) || !fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home/catalog missing for card injection');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
let html = fs.readFileSync(homePath, 'utf8');

for (const [slug, copy] of Object.entries(APPS)) {
  const game = catalog.games?.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} is not in LEVEL UP catalog`);
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
console.log('[LEVEL UP card] iya-feeling-first-aid + NEGOTIATOR + how-seen card copy injected');