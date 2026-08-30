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
    forWho: 'タイプ名だけでなく、どんな環境で力が出てどこで消耗しやすいかまで自分を具体的に理解したい人',
    purpose: '30の具体場面からENERGY・STRUCTURE・OPENNESS・RELATION・DRIVE・STABILITYの6軸を出し、今の自分の戦い方をRPGビルドとして読む',
    benefit: '強く出た傾向だけでなく、力が出やすい環境・消耗しやすい罠・次の1週間で試すことまで持ち帰れる',
    bookTitle: '人生RPGステータス｜30問で自分の「戦い方」を6軸にする',
    obi: 'タイプを決めつけず、30の場面から力が出る環境・消耗の罠・次の実験まで読む。',
  },
  'life-movie': {
    forWho: '今の自分を性格診断だけでなく、「物語の途中」として見直してみたい人',
    purpose: '8つの二択シーンから、ジャンル・現在の章・主人公属性・過去の伏線・次回予告を組み立てる',
    benefit: '今の状況を完成した自分ではなく変化途中の物語として眺め直し、シェアできる映画ポスターとして持ち帰れる',
  },
  'daily-special-ability': {
    forWho: '自分では普通にやっている行動の中に、どんな強みがあるのか言葉にしにくい人',
    purpose: '12の日常場面の二択から行動傾向を見つけ、普段の強みを覚えやすい「日常特殊能力名」に変える',
    benefit: '自分の強みを能力名・発動条件・副能力として持ち帰り、結果カードで友人やSNSに見せたり比べたりできる',
    bookTitle: 'あなたの日常特殊能力診断｜普通の強みを能力名にする',
    obi: '12の日常二択から、いつもの行動に潜む強みを「能力名・発動条件・副能力」に変える。',
  },
  '100nin-rank': {
    forWho: '自分の決断力・行動速度・メンタル耐久などの傾向を、直感的な順位表示で見てみたい人',
    purpose: '12問の行動・考え方への回答を一定ルールで換算し、複数の行動特性を「100人いたら何位？」という推定順位で可視化する',
    benefit: '自分の強く出ている行動特性を一目で把握し、実測統計ではない推定だと分かったうえで結果を共有できる',
    bookTitle: '100人いたら何位？｜12問で行動特性を推定順位にする',
    obi: '決断力・行動速度・メンタル耐久などを100人中の推定順位で可視化。実測統計ではなく回答パターンから算出。',
  },
  'mind-reading-off': {
    forWho: '短い返信・表情・沈黙から相手の悪い気持ちを読みすぎ、確認できないことを何度も考えて疲れる人',
    purpose: '対人シーンの文を「見えた事実」と「推測・ストーリー」へ仕分け、別の可能性と必要な確認へ戻す',
    benefit: '相手の気持ちを推測しても事実扱いせず、取り越し苦労を小さくして次の行動を選びやすくなる',
    bookTitle: '考えすぎストップ。｜相手の気持ちを「事実」と「推測」に分ける',
    obi: '返信・表情・沈黙を悪く読みすぎた時、見えた事実と頭の中のストーリーを仕分け直す。',
  },
  'kiku-chikara': {
    forWho: '相手が悩みを話すと、すぐ助言・自分語り・質問攻めへ飛び、もっと自然に話を聴けるようになりたい人',
    purpose: '6つの実戦会話で、要約→気持ちを決めつけず確認→開いた質問の3手を連続して選ぶ',
    benefit: '話の直後に「何を返すか」で焦らず、相手が続きを話しやすい最初の一言を出しやすくなる',
    bookTitle: '聴く力。｜要約・気持ち確認・質問を18手で反射化する',
    obi: '助言より先に受け取る。6会話×3手で、相手が続きを話しやすい返しを練習する。',
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
console.log(`[Firebase] app-specific LEVEL UP card copy injected: ${Object.keys(appCopies).join(', ')}; book copy ready.`);
