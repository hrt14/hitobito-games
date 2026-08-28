import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog not found. Run this after the Firebase home is fully assembled.');
}

// Book-cover copy: the title carries the user's problem + promised change.
// The obi is deliberately one short benefit line. Detailed metadata stays in the
// hidden DOM/catalog so diagnosis and keyword search keep working.
const BOOK_COPY = {
  'impulse-cooldown': {
    title: 'カートに入れた瞬間、指が「購入」に伸びる人の 24時間だけ寝かせる練習',
    obi: '衝動のまま買わず、今すぐ買う・待つ・やめるを自分で選べるようになる。',
  },
  'azukete-neru': {
    title: '布団に入ると考え事がループして眠れない人の 今夜の担当から外す練習',
    obi: '答えを出さず、明日の枠に預けるだけで頭が静かになる。',
  },
  'subconscious-garden': {
    title: '同じ不安が勝手に出てくる人の「無意識」を毎日数分で育て直す練習',
    obi: '考え直そうと頑張らなくても、望む反応へ戻りやすくする。',
  },
  'shikata-heiki': {
    title: '思い通りにならないだけで「失敗した」と感じる人の 現実を受け入れる練習',
    obi: '予定と現実のズレで消耗せず、修正へ早く移る。',
  },
  'zenbu-fukusen': {
    title: '嫌な出来事を「ただ損した」で終わらせない 全部、伏線。',
    obi: '意味を今決めず、未来につながる可能性を残す。',
  },
  'yotei-made-tsukaeru': {
    title: '午後に予定が1つあると何もできない人の「予定前時間」の使い方',
    obi: '準備と移動だけ先に確保して、残り時間を取り戻す。',
  },
  'web-marketer-rakuten': {
    title: '楽天市場の売上が落ちたとき「次に何を直すか」がわかる実戦トレーニング',
    obi: 'アクセス・転換率・客単価から、最優先施策を1つ選ぶ。',
  },
  'uchite': {
    title: '問題が起きると同じ案しか出ない人の「打ち手を増やす」練習',
    obi: '聞く・調べる・試す・任せる。別方向の一手を素早く出す。',
  },
  'todo-raid': {
    title: 'ToDoが重くて始められない人の タスクをRPGにするTODO RAID',
    obi: '完了を攻撃・XP・宝箱に変えて、次の1件へ進む。',
  },
  'today-last-day': {
    title: '今日が人生最後の日なら、あなたは何に時間を使う？',
    obi: '忙しさに流されず、本当に大切な行動を先に選ぶ。',
  },
  'time-anxiety-reset': {
    title: '「時間が足りない」が頭から離れない人の 時間不安リセット',
    obi: '7問で焦りの型を知り、今日の余白を取り戻す。',
  },
  'suteru-yuki': {
    title: 'やりたいことが多すぎて動けない人の「やらないこと」を決める練習',
    obi: '全部やるをやめて、本当に大事なものへ時間を集中する。',
  },
  'soredemo-ii-hi': {
    title: '予定が崩れた瞬間「今日はもうダメ」となる人の 一日を立て直す練習',
    obi: '失った時間を取り返さず、残り時間からいい日に戻す。',
  },
  'sore-honto': {
    title: '「嫌われたかも」を事実だと思い込む前に それ、本当？',
    obi: '出来事と頭が足した意味を分け、未確定の余白をつくる。',
  },
  'smartphone-escape': {
    title: '気づくとスマホを開いている人の 7日間スマホ依存リセット',
    obi: '6問で依存パターンを知り、意志力より環境を変える。',
  },
  'saiten-shinai': {
    title: '他人の成功を見るたび自分を下げてしまう人の「自分を採点しない」練習',
    obi: '人の成果と自分の価値を、自動で結びつけない。',
  },
  'omoisadameru': {
    title: '「こうなるはずだった」を手放せない人の 現実を受け入れて次へ進む練習',
    obi: '変えられない事実を確定し、変えられる部分だけ動かす。',
  },
  'nukeru': {
    title: '嫌なことが頭から離れないときの 60〜90秒 感情リセット',
    obi: '原因分析の前に、今の「嫌さ」から少し距離を取る。',
  },
  'nou-keshigomu': {
    title: '仕事が終わっても頭だけ働き続ける人の 脳消しゴム',
    obi: '気がかりを頭の外へ出して、仕事から心を離す。',
  },
  'meeting-timebox': {
    title: '会議がいつも時間オーバーする人の「残り時間」で終わらせる技術',
    obi: '深掘りを止め、決定・担当・期限まで時間どおり着地する。',
  },
  'matomaru': {
    title: '考えがまとまらない人の「要するに・なぜ・だから」3点整理術',
    obi: '情報が多くても、結論と次の一手を短時間でつくる。',
  },
  'mada-dekinai': {
    title: '失敗すると「向いてない」と決めつける人の「まだ、できない。」練習',
    obi: '才能判定で終わらず、次の学習行動へ切り替える。',
  },
  'life-plus-one': {
    title: '「今日も何も進まなかった」と感じる人の LIFE +1',
    obi: '成果がない日にも、昨日までになかった人生の差分を見つける。',
  },
  'kotowaru': {
    title: '嫌われたくなくて断れない人の 関係を壊しにくい断り方トレーニング',
    obi: '相手に合う言葉を選び、自分の時間と境界線を守る。',
  },
  'kokkara-best': {
    title: '不運や失敗が重なったときの「ここからの最善手」を選ぶ練習',
    obi: '失ったものではなく、まだ残っている手札から立て直す。',
  },
  'kininaranai': {
    title: '小さなことまで全部気になる人の「気にしない」より先のノイズ無視トレーニング',
    obi: '必要な信号だけ拾い、どうでもいい違和感は通過させる。',
  },
  'kanji-warukatta': {
    title: '会話のあと「感じ悪かった？嫌われた？」が止まらない人の 反省会終了術',
    obi: '事実と気遣いと想像を分け、必要な行動1個だけ残す。',
  },
  'jinshin-shoaku': {
    title: '部下・顧客・相手が自分から動きたくなる「お願いの伝え方」トレーニング',
    obi: '命令より、相手が守りたいものを見抜いて協力を引き出す。',
  },
  'idea-lenses-40': {
    title: 'アイデアが毎回同じになる人の 発想を40方向に増やすトレーニング',
    obi: '1つの問題から、複数の打ち手を素早く出せるようにする。',
  },
  'hontono-shimekiri': {
    title: '締切直前に予定が詰まって焦る人の「本当の締切」逆算術',
    obi: '出張・会議・移動を除いた、実際に準備できる最終日を出す。',
  },
  'habit-raid': {
    title: '習慣管理アプリが続かない人の 習慣をRPGにするTODO＆ドラゴンズ',
    obi: '完了を攻撃・XP・宝箱に変えて、義務よりゲームで続ける。',
  },
  'fail-forward': {
    title: '完璧にしてから出そうとして遅れる人の「60点で出す」練習',
    obi: '先に出して反応をもらい、現実のフィードバックで直す。',
  },
  'chou-tsukareta': {
    title: '「なんかもう疲れた」しか言えない人の 5問でわかる疲れ方診断',
    obi: '体・脳・感情・対人・未完了に分け、今休める場所を見つける。',
  },
  'boundary': {
    title: '仕事も人間関係も抱え込みすぎる人の「ここから先は入れない」境界線',
    obi: '今やることと今は入れないことを分け、自分の余白を守る。',
  },
  'big-tech-interview': {
    title: '答えのない難問で固まる人の 30秒で「考え始める切り口」を作る練習',
    obi: '分解・概算・逆転・制約活用を反射で使えるようにする。',
  },
  'atsumaru': {
    title: '「人が集まらなかったら怖い」を 今日の検証1個に変える集客トレーニング',
    obi: '集客不安を4つの仮説に分け、まず確かめる。',
  },
  'ato-ikkai': {
    title: '「意味ない・効率悪い」でやめる前に あと1回だけ試す練習',
    obi: '本当の改善判断と言い訳を分け、根拠が薄ければもう1回動く。',
  },
  'asa-glide': {
    title: '朝、スマホは触れるのに起きられない人の「寝たまま始める」起床術',
    obi: '全部の支度を考えず、今できそうな1個からベッドを出る。',
  },
  'approval-off': {
    title: '人からどう思われるかで決めてしまう人の「他人軸OFF」トレーニング',
    obi: '評価は相手、行動は自分。判断のハンドルを取り戻す。',
  },
  'anger-first-aid': {
    title: '怒った勢いで言って後悔する人の「言う・送る前に止まる」怒りの応急処置',
    obi: '怒りのピークで一度止まり、後悔しにくい次の一手を選ぶ。',
  },
  'already-90': {
    title: '足りない10%ばかり気になる人の「90%は、もうある。」練習',
    obi: '今あるものを消さず、不満は1%ずつ軽くする。',
  },
  'thinking-stairs': {
    title: '考えているのに同じところをぐるぐるする人の「思考の階段」',
    obi: '詰まったら視点の高さを変え、別の考え方へ移る。',
  },
  'pinch-chance': {
    title: '「もう無理」と思うピンチで 次に伸ばせる1つを見つける練習',
    obi: '大変な状況を、成長機会と具体的な一手へ変える。',
  },
  'nemuri-no-umi': {
    title: '寝る直前までスマホを見てしまう人の「スマホを置く」眠りゲーム',
    obi: '刺激を少しずつ減らし、遊びの終わりを就寝につなげる。',
  },
  'jibun-wa-jibun': {
    title: '他人と比べるたび焦る人の「自分は自分」に戻る練習',
    obi: '人を参考にしても、自分まで採点しない。',
  },
  'sukkiri-note': {
    title: 'やることが多すぎて何から手をつけるか止まる人の スッキリノート',
    obi: '頭の未完了を全部外へ出し、今見るものを一つにする。',
  },
  'ima-yaru': {
    title: '先延ばしの理由を30秒で潰して「今やる。」に変える',
    obi: '重い・曖昧・不安・完璧主義から、現実で動ける一手を出す。',
  },
  'hitori-shouten': {
    title: 'ひとりで売上をつくる人の「8時間をどこに使うか」実戦トレーニング',
    obi: '作業量ではなく、顧客・販売・勝ち筋・仕組みに時間を使う。',
  },
  'reflex-7': {
    title: '知っているのに現場で使えない人の「7つの判断」を反射にする',
    obi: '重要優先・理解・第三案などを、とっさに選べるようにする。',
  },
  'mou-haratta': {
    title: '嫌なことの代償を何度も払い続けない 「もう払った。」練習',
    obi: '一度の不運に、追加で時間と気分まで払わない。',
  },
  'asa-tanoshimi': {
    title: '早く寝たいのに夜更かしする人の「明日の朝に楽しみを予約する」習慣',
    obi: '早寝を我慢ではなく、明日の楽しみを早く開けたいに変える。',
  },
  'zenbu-yaranai': {
    title: '仕事が多すぎて破綻しそうな人の「全部やらない」仕事術',
    obi: '守る・縮める・逃がす・捨てるで、終えられる量まで減らす。',
  },
  'seikan-switch': {
    title: 'イライラ・不満・心配から抜けたいときの「とらえ方スイッチ」',
    obi: '同じ出来事でも、次に選ぶ反応を増やす。',
  },
  'extra-load': {
    title: '仕事そのものより「考えすぎ」で疲れている人の 余計な疲れを増やさない練習',
    obi: '全部背負う・完璧・同時進行・反芻を見抜き、必要な分だけ考える。',
  },
  'watashi-zukan': {
    title: '自分が何を大事にしたいかわからない人の「選び方」から作る わたし図鑑',
    obi: '実際の選択から、自分に合う働き方や生き方の軸を見つける。',
  },
  'ato-5min': {
    title: '大きすぎる仕事を 5分で始められる大きさにする',
    obi: '最初の一手まで分解すれば、止まっていた仕事が動く。',
  },
  'one-thing': {
    title: 'やることが多すぎる人の 一個だけ終わらせる練習',
    obi: '通知も割り込みも切って、一つを最後まで。',
  },
  'task-separation': {
    title: '人の機嫌まで背負ってしまう人の 課題の分離',
    obi: '誰の課題かを分けて、自分の課題だけに集中する。',
  },
  'meeting-respawn': {
    title: '会議が終わると疲れて次の仕事に戻れない人の 30秒リスポーン',
    obi: '会議の余韻を短く切り、次の仕事を30秒サイズにする。',
  },
  'start': {
    title: '宿題に手がつかない人の MBTI別「最初の一手」',
    obi: '自分に合う始め方まで、宿題を小さくする。',
  },
  '3sec-action': {
    title: '考えすぎて動けない人の 3秒で動く練習',
    obi: 'やる・捨てる・任せる。迷いを行動に変える。',
  },
  'timecraft': {
    title: '時間が足りない人の 予定を減らして余白をつくる時間術',
    obi: '詰め込むより、何に時間を使うかを選ぶ。',
  },
  '100-turns': {
    title: '死ぬまでにあと100ターンなら、今日なにを選ぶ？',
    obi: '残り時間を意識して、本当に使いたいものへ時間を使う。',
  },
  'levelup-control': {
    title: '変えられないことに消耗しない 「変えられる？」練習',
    obi: '変えられることだけを見つけて、次の一手へ進む。',
  },
  'expect-nothing': {
    title: '期待どおりにならなくて疲れる人の 期待を手放す練習',
    obi: '「こうなるはず」を減らして、現実に合わせて動く。',
  },
  'dont-change-people': {
    title: '人を変えようとして疲れる人の 自分の打ち手を変える練習',
    obi: '距離・頼み方・配置。変えられる側から問題をほどく。',
  },
  'help-me': {
    title: '一人で抱え込む人の「助けて」が言える練習',
    obi: '人・AI・外注・上司。頼る先を選んで仕事を軽くする。',
  },
  'levelup-mood': {
    title: '嫌なことがあっても引きずらない 自分の機嫌を自分で戻す練習',
    obi: '気分を出来事任せにせず、自分で戻す選択肢を増やす。',
  },
  'mou-owatta': {
    title: '会議・メール・会話の失敗を引きずらない「もう終わった」練習',
    obi: '事実と次に変えられることだけ拾って、思考を終了する。',
  },
  'name-it': {
    title: 'モヤモヤの正体がわからないときの 感情に名前をつける練習',
    obi: '「なんか嫌」を言葉にして、ぼんやりした感情を認識する。',
  },
  'viewpoint-exam': {
    title: '嫌な出来事を一つの見方で決めつけない 視点を変える練習',
    obi: '同じ出来事に別の見方をつくり、解釈の選択肢を増やす。',
  },
  'jinsei-title': {
    title: '嫌な出来事の意味を変える 人生に別タイトルをつける練習',
    obi: '出来事は同じでも、つけるタイトルで意味を編集できる。',
  },
  'meaning-map': {
    title: '「この仕事、何の意味がある？」と感じる人の 意味マップ',
    obi: '今の行動を目的・一貫性・重要感につなぎ、やる理由を見つける。',
  },
  'main-character': {
    title: '人の「普通」で生きるのをやめる 自分で選ぶ練習',
    obi: '周囲の期待ではなく、自分ならどうしたいかで選ぶ。',
  },
  'arigatou-sagashi': {
    title: '不満ばかり目につく日に ありがとうを見つける練習',
    obi: '何気ない日常を支えているものを、ゲーム感覚で見つける。',
  },
  'levelup-smalltalk': {
    title: '雑談が続かない人の 返す・広げる・質問する練習',
    obi: '会話を続ける3つの動きを、何度も反復する。',
  },
  'maa-iika': {
    title: '予定どおりにならないとイライラする人の「まあ、いいか」練習',
    obi: '予定外を受け止めて、抵抗し続けず次へ進む。',
  },
  'self-management': {
    title: '疲れているのに無理してしまう人の 今の自分に合う一手を選ぶ自己管理',
    obi: '体力・集中・ストレス・脳内WIPを見て、今やることを決める。',
  },
  'my-job': {
    title: '頼まれると相手の仕事まで抱える人の「それ、俺の仕事？」仕分け術',
    obi: '自分がやる・相手がやる・別料金を分け、自分の仕事量を守る。',
  },
  'amazon-operator': {
    title: 'Amazonの売上が落ちたとき「次に何を直すか」を数字で決める運用トレーニング',
    obi: '広告・商品ページ・利益・在庫から、ボトルネックを1つ選ぶ。',
  },
  'web-marketer-owned-site': {
    title: '自社ECの売上が落ちたとき「一番効く一手」を数字から選ぶ実戦トレーニング',
    obi: '集客・CVR・計測・CRMを横断して、最優先施策を決める。',
  },
  'yahoo-shopping-marketer': {
    title: 'Yahoo!ショッピングの売上が落ちたとき「次に何を直すか」を選ぶ運用トレーニング',
    obi: '検索・広告・商品・販促・LINE・粗利から最優先の一手を決める。',
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const games = Array.isArray(catalog.games) ? catalog.games : [];
const known = new Set(games.map((game) => game.slug));
const missingFromCatalog = Object.keys(BOOK_COPY).filter((slug) => !known.has(slug));
if (missingFromCatalog.length) {
  console.warn(`[LEVEL UP book cards] mapped slugs not present in this build: ${missingFromCatalog.join(', ')}`);
}

for (const game of games) {
  const copy = BOOK_COPY[game.slug];
  if (!copy) continue;
  game.title = copy.title;
  game.description = copy.obi;
}
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

let html = fs.readFileSync(homePath, 'utf8');
let replaced = 0;
html = html.replace(/<article\b([^>]*\bdata-game="([^"]+)"[^>]*)>([\s\S]*?)<\/article>/g, (whole, attrs, slug, body) => {
  const copy = BOOK_COPY[slug];
  if (!copy) return whole;
  let next = body.replace(/<p class="book-obi">[\s\S]*?<\/p>\s*/g, '');
  const titleHtml = `<h2>${escapeHtml(copy.title)}</h2>`;
  if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/.test(next)) return whole;
  next = next.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/, `${titleHtml}\n      <p class="book-obi">${escapeHtml(copy.obi)}</p>`);
  next = next.replace(/aria-label="[^"]*をお気に入りに追加"/, `aria-label="${escapeHtml(copy.title)}をお気に入りに追加"`);
  replaced += 1;
  return `<article${attrs}>${next}</article>`;
});

const styleMarker = 'id="levelup-book-cards-style"';
if (!html.includes(styleMarker)) {
  const style = `
<style id="levelup-book-cards-style">
  /* Book-cover catalog: title + one obi line only. Detailed copy remains in the DOM for search/diagnosis. */
  .grid{align-items:stretch}
  .card{min-height:250px}
  .card .card-link{min-height:250px;display:flex!important;flex-direction:column;justify-content:center;align-items:stretch;padding:30px 24px 24px!important}
  .card .card-top,.card .icon,.card .kicker,.card .skill,.card .card-values,.card .play,.card .lu-treatment-badge,.card .card-link>p:not(.book-obi){display:none!important}
  .card h2{margin:0!important;max-width:none!important;font-size:clamp(24px,2.25vw,34px)!important;line-height:1.18!important;letter-spacing:-.045em!important;font-weight:950!important;text-wrap:balance}
  .card .book-obi{display:block!important;margin:22px 0 0!important;padding:11px 12px!important;border:0!important;border-radius:5px!important;background:var(--lime)!important;color:#0b0e08!important;font-size:11.5px!important;line-height:1.55!important;font-weight:900!important;letter-spacing:0!important}
  .card .favorite{z-index:5}
  @media(max-width:700px){
    .card{min-height:220px}
    .card .card-link{min-height:220px;padding:28px 20px 20px!important}
    .card h2{font-size:clamp(23px,7vw,30px)!important;line-height:1.2!important}
    .card .book-obi{margin-top:18px!important;font-size:11.5px!important}
  }
</style>`;
  if (!html.includes('</head>')) throw new Error('LEVEL UP head not found for book-card styles.');
  html = html.replace('</head>', `${style}\n</head>`);
}

fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
const currentMapped = games.filter((game) => BOOK_COPY[game.slug]).length;
if (replaced !== currentMapped) {
  throw new Error(`LEVEL UP book-card replacement mismatch: replaced ${replaced}, expected ${currentMapped}`);
}
if (!finalHtml.includes(styleMarker) || !finalHtml.includes('class="book-obi"')) {
  throw new Error('LEVEL UP book-card UI was not injected.');
}

console.log(`[Firebase] LEVEL UP book-cover titles injected: ${replaced} cards (${Object.keys(BOOK_COPY).length} mapped).`);
