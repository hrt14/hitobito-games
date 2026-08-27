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
  {
    slug: 'two-tasks-only',
    copy: {
      title: '今日やるのは2つだけ',
      kicker: 'TODAY HAS ONLY TWO SEATS',
      skill: 'WIP制限 / 仕事を減らす',
      obi: '今日の席は2つだけ。3つ目を入れるなら、いまの1つを必ず追い出す。',
      description: '候補を1件ずつ「今日・あと・捨てる」へ送り、TODAYが満席なら既存タスクとの入れ替えを強制する。',
      forWho: 'どの仕事も重要に見えて「これも今日やる」が増え、同時に抱える仕事が多くなりすぎる人',
      purpose: '優先順位を細かく採点せず、今日同時に抱える仕事を2件までに物理的に制限する',
      benefit: '3件目以降を今日から外し、今見るべき仕事を2件だけにして頭の中のWIPを減らせる',
    },
  },
  {
    slug: 'prep-stop',
    copy: {
      title: '準備はここまで',
      kicker: 'READY LINE / 4 LOCKS',
      skill: '準備の終了 / やりすぎ防止',
      obi: '目的・見る・聞く・次。4つ揃ったら「準備完了。もう調べない。」',
      description: '会議や商談の最低条件を4項目だけ埋め、4/4で準備を封印。追加準備も本当に必須か1問で止める。',
      forWho: '本番前に「これも調べたい」が増え続け、必要以上に準備時間を伸ばしてしまう人',
      purpose: '準備の量ではなく、本番を成立させる最低条件を満たしたかで終了時点を決める',
      benefit: '準備を100点まで増やさず、本番へ移るタイミングを自分で切りやすくなる',
    },
  },
  {
    slug: 'handoff-tomorrow',
    copy: {
      title: '明日の自分に渡す',
      kicker: 'CLOSE TODAY SAFELY',
      skill: '仕事終了 / 引き継ぎ',
      obi: '残り仕事を明日の箱へ。朝イチの1件と最初の10秒だけ決めたら、今日は閉じる。',
      description: '未完了を最大10件出し、明日の最初の1件だけ選択。具体的な最初の10秒を書いて仕事を引き継ぐ。',
      forWho: '未完了タスクが頭に残り、「もう少しだけ」と仕事を終えにくい夜や退勤前の人',
      purpose: '未完了を今日中に消すのではなく、安全に明日へ移して今日の仕事を終了する',
      benefit: '覚えておく必要をなくし、翌朝の再開点を残したうえで仕事から離れやすくなる',
    },
  },
  {
    slug: 'not-now-decision',
    copy: {
      title: 'いま決めなくていい',
      kicker: 'DECIDE WHETHER TO DECIDE',
      skill: '判断WIP / 保留',
      obi: '結論の前に「今日決める必要ある？」だけ3問で判定。不要なら再検討日まで保留。',
      description: '締切・停止影響・追加情報の3問でNOW/LATERを判定し、保留案件は再検討日つきで置いておく。',
      forWho: '新しい依頼やアイデアが来るたび、その場で全部判断しようとして頭の中の案件が増える人',
      purpose: '判断内容ではなく、今日その判断をする必要があるかだけを先に判定する',
      benefit: '今決める必要のない案件を正式に保留し、判断そのものを頭から降ろせる',
    },
  },
  {
    slug: 'enough-done',
    copy: {
      title: '十分やった',
      kicker: 'STOP WHEN MORE IS NOT BETTER',
      skill: '止め時 / 過剰改善防止',
      obi: '目的達成・致命穴・追加30分の価値を3問で判定。止め時なら、そのまま出す。',
      description: '資料やメールを直し続ける時、3つのSTOP条件で終了判定。続行しても最後の修正は1件だけ。',
      forWho: 'すでに使える成果物を80点から100点へ直し続け、提出・送信・終了が遅れる人',
      purpose: '品質を下げず、追加時間に見合う改善が残っているかだけを判定する',
      benefit: '改善幅が小さくなった仕事を見切り、出す・送る・閉じる現実行動へ移りやすくなる',
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
console.log('[LEVEL UP card] app-specific title/obi/copy injected');
