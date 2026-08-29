import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const appCopies = {
  'ato-nankai': {
    forWho: '毎日を無限にあるように使ってしまい、大切な時間を後回しにしがちな人',
    purpose: '春・土曜日・誕生日・大切な人に会う時間を、残り年数ではなく具体的な回数に変える',
    benefit: '今日まだ残っている「1回」の重みが見え、何を雑にしないか1つ決められる',
    bookTitle: '人生、あと何回？ 大切な時間を「残り回数」で見つめ直す',
    obi: '春・土曜日・誕生日・大切な人との時間を数えて、今日の1回を雑にしない。',
  },
  'jinsei-kieteru': {
    forWho: '毎日忙しいのに「自分の時間がない」と感じ、何に人生の時間を使っているか見直したい人',
    purpose: '睡眠・仕事・スマホ・移動・家事の1日平均を、残り人生の「何年」に相当するかへ変換する',
    benefit: '今の時間配分を続けたとき自由に残る人生が何年あるか見え、削りたい時間を具体的に選べる',
    bookTitle: 'あなたの人生、何に消えてる？ 24時間を「残り人生の何年」に変える',
    obi: '睡眠・仕事・スマホ・移動・家事の先に、自由な人生が何年残るかを見る。',
  },
  'jinsei-fukusen': {
    forWho: '昔の夢中や遠回りが、今の自分に何を残したのか見つけたい人',
    purpose: '昔の夢中・遠回り・困ったときのクセ・今の役割を5問で並べ、一見無関係な経験の共通線を見つける',
    benefit: '過去の出来事をバラバラな点のままにせず、今の強みや価値観につながる「ひとつの読み方」として共有カードにできる',
  },
  'how-seen': {
    forWho: '自分が周囲からどう見られているか気になり、自己イメージと実際の友人評価の差を知りたい人',
    purpose: '8つの二択で自己像を出し、友人の匿名回答と4軸で比べて「自分が思う自分」と「他人から見える自分」のズレを可視化する',
    benefit: '友人の実回答から、親しみやすさ・押しの強さ・安定感・本音の見えやすさのどこに認識差があるか分かる',
  },
  'what-stops-you': {
    forWho: 'やった方がいいと分かっているのに、仕事・返信・挑戦などでなぜか着手できず、自分が止まる理由を知りたい人',
    purpose: '12の具体場面への反応から、失敗恐怖・他人評価・完璧主義・面倒回避・考えすぎの5つの行動ブレーキを見分ける',
    benefit: '今出やすい主ブレーキと副ブレーキが分かり、次に止まった瞬間に使う30秒の解除行動と最適なLEVEL UPを1つ持ち帰れる',
  },
  'praise-manual': {
    forWho: '褒められるのは嬉しいはずなのに、褒め方によっては居心地が悪く、自分でも「どう褒められたいか」を説明しにくい人',
    purpose: '10問で、人前/1対1・結果/努力・短い一言/具体的・言葉/行動など7軸の「褒められ方の好み」を言語化する',
    benefit: '仕事・パートナーでそのまま使える例文とNG例まで入った取説を相手に送り、次に褒めてもらう瞬間から使える',
  },
  'life-rpg-status': {
    forWho: '今の自分の特徴を、長い診断文ではなく一目で分かるキャラクターとして見てみたい人',
    purpose: '12問から行動力・知力・社交力・回復力・運・残りHPを出し、職業・二つ名・特殊能力までRPG化する',
    benefit: 'LVと能力値が入った1枚のRPGカードで「自分っぽさ」を見つけ、そのまま画像で友人やSNSに共有できる',
  },
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, slug, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`${slug} LEVEL UP card field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

function applyBookCopy(article, slug, copy) {
  if (!copy.bookTitle || !copy.obi) return article;
  let next = article.replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
  if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(next)) throw new Error(`${slug} LEVEL UP card h2 missing`);
  next = next.replace(
    /<h2\b[^>]*>[\s\S]*?<\/h2>/,
    `<h2>${escapeHtml(copy.bookTitle)}</h2>\n      <p class="book-obi">${escapeHtml(copy.obi)}</p>`,
  );
  return next;
}

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP card-copy inputs are missing');
}

let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const [slug, copy] of Object.entries(appCopies)) {
  const token = `data-game="${slug}"`;
  const tokenIndex = home.indexOf(token);
  if (tokenIndex < 0) throw new Error(`${slug} card is missing from LEVEL UP home`);
  const articleStart = home.lastIndexOf('<article', tokenIndex);
  const articleClose = home.indexOf('</article>', tokenIndex);
  if (articleStart < 0 || articleClose < 0) throw new Error(`${slug} card bounds not found`);
  const articleEnd = articleClose + '</article>'.length;
  let article = home.slice(articleStart, articleEnd);
  article = replaceValue(article, slug, 'こんな人に', copy.forWho);
  article = replaceValue(article, slug, 'なんのため', copy.purpose);
  article = replaceValue(article, slug, 'ベネフィット', copy.benefit);
  article = applyBookCopy(article, slug, copy);
  home = home.slice(0, articleStart) + article + home.slice(articleEnd);

  const game = catalog.games.find((item) => item.slug === slug);
  if (!game) throw new Error(`${slug} missing from LEVEL UP catalog`);
  Object.assign(game, {
    forWho: copy.forWho,
    purpose: copy.purpose,
    benefit: copy.benefit,
    ...(copy.bookTitle && copy.obi ? { title: copy.bookTitle, description: copy.obi } : {}),
  });
}

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] ato-nankai, jinsei-kieteru, jinsei-fukusen, how-seen, what-stops-you, praise-manual, and life-rpg-status specific LEVEL UP card copy injected; book copy ready.');
