import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

for (const file of [homePath, catalogPath]) {
  if (!fs.existsSync(file)) throw new Error(`LEVEL UP card-copy input missing: ${file}`);
}

// Auto-discovered apps used to fall back to the same three generic sentences.
// Keep card copy explicit per app so the card itself explains who it is for,
// what it trains, and the concrete benefit before the user opens it.
const COPY = {
  'anger-first-aid': {
    forWho: '怒った勢いで言い返したり、送信して後悔しやすい人',
    purpose: '怒りのピークで一度止まり、反射的な言動を選び直す',
    benefit: 'カッとなった瞬間でも、後悔しにくい次の一手を取りやすくなる',
  },
  'ato-ikkai': {
    forWho: '「意味ない」「効率が悪い」と考えて、量を止めがちな人',
    purpose: '本当の改善判断と、やりたくない気持ちからの理屈を分ける',
    benefit: '根拠が薄い言い訳で止まらず、まずあと1回試せるようになる',
  },
  'big-tech-interview': {
    forWho: '答えのない問題を前にすると、何から考えるか固まりやすい人',
    purpose: '分解・概算・逆転・制約活用など複数の思考法を反射化する',
    benefit: '初見の難問でも、考え始める切り口を素早く作りやすくなる',
  },
  boundary: {
    forWho: '仕事も人間関係も休息も、境目なく抱え込んでしまう人',
    purpose: '今やることと、今は入れないことの境界線を引く',
    benefit: '頼まれ事や気がかりに全部反応せず、自分の余白を守りやすくなる',
  },
  'chou-tsukareta': {
    forWho: 'ただ「疲れた」としか言えず、何を休めればいいか分からない人',
    purpose: '疲れを体・脳・感情・対人・未完了にほどいて原因を絞る',
    benefit: '今の疲れに合う回復の一手と、使うべきアプリが分かる',
  },
  'fail-forward': {
    forWho: '完璧にしてから出そうとして、公開や提出が遅くなる人',
    purpose: '60点で出して反応を得てから直す順番を身につける',
    benefit: '完成待ちで止まらず、現実のフィードバックで前進しやすくなる',
  },
  'habit-raid': {
    forWho: '習慣管理アプリを始めても、記録だけではすぐ飽きる人',
    purpose: '習慣の完了を攻撃・XP・宝箱・仲間集めに変えて継続する',
    benefit: 'やるべき習慣を、義務よりゲームを進める感覚で続けやすくなる',
  },
  'hontono-shimekiri': {
    forWho: '締切は分かっているのに、直前の予定を見落として焦る人',
    purpose: '移動・会議・出張を除いた「実際に準備できる最終日」を出す',
    benefit: '表面上の締切ではなく、本当に間に合う日から逆算しやすくなる',
  },
  'kokkara-best': {
    forWho: '不運や失敗が重なると「もう無理」と投げたくなる人',
    purpose: '変えられない損失と、まだ残っている手札を切り分ける',
    benefit: '状況が悪くても「ここからの最善手」へ素早く戻りやすくなる',
  },
  'meeting-respawn': {
    forWho: '会議が終わると一気に疲れ、次の仕事へ切り替えられない人',
    purpose: '会議後の疲労を短くリセットし、次の仕事を30秒まで小さくする',
    benefit: '会議の余韻を引きずらず、次の一手へ再起動しやすくなる',
  },
  'meeting-timebox': {
    forWho: '会議やコンサルで話が広がり、予定時間を超えやすい人',
    purpose: '残り時間に応じて深掘りを止め、決定・担当・期限へ移る',
    benefit: '内容を雑にせず、時間どおりに会議を着地させやすくなる',
  },
  'mou-haratta': {
    forWho: '嫌な出来事のあと「損した」「最悪だ」を何度も反芻する人',
    purpose: '嫌な出来事を「代償はもう払った」と捉え、思考を次へ切り替える',
    benefit: '一度の不運に追加で時間や気分まで払い続けにくくなる',
  },
  'my-job': {
    forWho: '頼まれると、相手の実務まで自分の仕事として抱えがちな人',
    purpose: '依頼を「自分がやる・相手がやる・別料金」に即仕分けする',
    benefit: '親切と抱え込みを分け、自分の仕事量を守りやすくなる',
  },
  'omoisadameru': {
    forWho: '思い通りにならない現実に抵抗し続け、消耗しやすい人',
    purpose: '起きた事実をいったん確定し、変えられる部分だけへ意識を戻す',
    benefit: '「こうなるはずだった」から離れ、現実的な次の一手を選びやすくなる',
  },
  'nou-keshigomu': {
    forWho: '仕事を終えても、頭の中だけ仕事が続いて休めない人',
    purpose: '残っている仕事や気がかりを言葉にして、頭の外へ置く',
    benefit: '短い休憩や夜の時間に、仕事から心を離しやすくなる',
  },
  'reflex-7': {
    forWho: '知っている原則はあるのに、現場ではとっさに使えない人',
    purpose: '重要優先・理解・第三案など7つの判断パターンを反射化する',
    benefit: '日常の場面で、使うべき考え方を素早く選びやすくなる',
  },
  'saiten-shinai': {
    forWho: '他人の成功や作品を見るたび「じゃあ自分は？」と落ち込む人',
    purpose: '他人の情報を見ることと、自分を採点することを切り離す',
    benefit: '人の成果を見ても、自分の価値まで自動評価しにくくなる',
  },
  'seikan-switch': {
    forWho: '不満・怒り・心配が出たとき、別の受け止め方へ切り替えたい人',
    purpose: '受容・感謝・喜ばれる行動などの考え方を日常判断で反復する',
    benefit: '嫌な場面でも、反応の選択肢を増やして切り替えやすくなる',
  },
  'smartphone-escape': {
    forWho: '気づくとスマホを開き、寝床や移動中まで触り続ける人',
    purpose: '自分の依存パターンを見つけ、7日間で環境と行動を変える',
    benefit: '意志力だけに頼らず、スマホとの距離を具体的に作りやすくなる',
  },
  'soredemo-ii-hi': {
    forWho: '予定が崩れると「今日はもうダメ」と一日ごと捨てがちな人',
    purpose: '失った時間を取り返そうとせず、残り時間から一日を組み直す',
    benefit: '予定外が起きても、その日の残りをいい日に戻しやすくなる',
  },
  'suteru-yuki': {
    forWho: 'やりたいことが多く、全部残そうとして身動きが取れない人',
    purpose: '魅力的な選択肢の中から、本当に残すものと捨てるものを決める',
    benefit: '「全部やる」から抜けて、大事なものへ時間を集中しやすくなる',
  },
  'thinking-stairs': {
    forWho: '考えてはいるのに、同じ思考の段でぐるぐるしやすい人',
    purpose: '反応・因果・前提・メタ認知・構造など思考の段を使い分ける',
    benefit: '詰まったときに視点の高さを変え、別の考え方へ移りやすくなる',
  },
  'today-last-day': {
    forWho: '忙しさに流され、本当に大事なことを後回しにしがちな人',
    purpose: '「今日が最後なら？」で、今使う時間の優先順位を選び直す',
    benefit: '惰性の予定より、自分にとって大切な行動を先に置きやすくなる',
  },
  'todo-raid': {
    forWho: 'ToDoを見るだけで重くなり、着手や完了の勢いが出ない人',
    purpose: '現実のタスクをクエスト化し、完了をゲーム進行へ変える',
    benefit: 'タスク消化そのものが報酬になり、次の1件へ進みやすくなる',
  },
  'web-marketer-rakuten': {
    forWho: '楽天市場の数字は見ているが、次に何を直すか迷う担当者',
    purpose: 'R-Karteで売上をアクセス・転換率・客単価に分解して判断する',
    benefit: 'RPP・検索・商品ページ・販促・リピートから最優先施策を選びやすくなる',
  },
  'yahoo-shopping-marketer': {
    forWho: 'Yahoo!ショッピングで、施策が多く優先順位を決めにくい担当者',
    purpose: '検索・広告・商品・販促・LINE・粗利を横断して数字から判断する',
    benefit: '売上の詰まりに対して、次に打つべき一手を絞りやすくなる',
  },
  'yotei-made-tsukaeru': {
    forWho: '午後に予定が1つあるだけで、それまで何も始められなくなる人',
    purpose: '準備と移動を先に確保し、残りを「使える時間」として取り戻す',
    benefit: '予定前の空白を待ち時間にせず、実際に1つ始めやすくなる',
  },
  'zenbu-fukusen': {
    forWho: '嫌な出来事があると「ただ損した」と意味を確定しやすい人',
    purpose: 'その出来事が未来で何の伏線になるか、複数の可能性を作る',
    benefit: '今は嫌な出来事でも、意味を未確定のまま持ちやすくなる',
  },
  'zenbu-yaranai': {
    forWho: '仕事が多すぎて、全部やろうとして破綻しそうな人',
    purpose: '守る・縮める・逃がす・捨てるで、最低限と終了条件を決める',
    benefit: '忙しいときほど仕事を減らし、破綻せず終わらせやすくなる',
  },
  kotowaru: {
    forWho: '断りたいのに、角が立つのが怖くて引き受けてしまう人',
    purpose: '相手や状況に合う断り方を選び、言葉の型を増やす',
    benefit: '関係を必要以上に傷つけず、自分の時間と境界線を守りやすくなる',
  },
  'asa-tanoshimi': {
    forWho: '早く寝たいのに、翌朝に起きる楽しみがなく夜更かししがちな人',
    purpose: '寝る前に翌朝の小さな楽しみを予約し、朝まで封印する',
    benefit: '早寝を我慢ではなく「明日の楽しみを早く開けたい」に変えやすくなる',
  },
  'time-anxiety-reset': {
    forWho: '時間が足りない感覚や人生への焦りが、いつも頭から離れない人',
    purpose: '時間不安の型を診断し、予定・完璧主義・自責との関係を整える',
    benefit: '時間を支配しようとせず、今日の余白と大切な時間を取り戻しやすくなる',
  },
};

const GENERIC = [
  '考える力を、知識ではなく反射として鍛えたい人',
  '短い問題を繰り返して、使える思考の型を増やす',
  '初めて見る問題でも、切り口を素早く作りやすくなる',
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function replaceValue(article, label, value) {
  const pattern = new RegExp(`(<span class="card-value-label">${label}</span><span class="card-value-text">)([\\s\\S]*?)(</span>)`);
  if (!pattern.test(article)) throw new Error(`LEVEL UP card value field missing: ${label}`);
  return article.replace(pattern, (_all, open, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

let home = fs.readFileSync(homePath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const patched = [];

for (const [slug, copy] of Object.entries(COPY)) {
  const token = `data-game="${slug}"`;
  const tokenIndex = home.indexOf(token);
  if (tokenIndex < 0) continue;
  const articleStart = home.lastIndexOf('<article', tokenIndex);
  const articleClose = home.indexOf('</article>', tokenIndex);
  if (articleStart < 0 || articleClose < 0) throw new Error(`LEVEL UP card bounds not found: ${slug}`);
  const articleEnd = articleClose + '</article>'.length;
  let article = home.slice(articleStart, articleEnd);
  if (!article.includes('class="card-values"')) continue;

  article = replaceValue(article, 'こんな人に', copy.forWho);
  article = replaceValue(article, 'なんのため', copy.purpose);
  article = replaceValue(article, 'ベネフィット', copy.benefit);
  home = home.slice(0, articleStart) + article + home.slice(articleEnd);

  const game = catalog.games.find((item) => item.slug === slug);
  if (game) Object.assign(game, copy);
  patched.push(slug);
}

const offenders = [];
for (const game of catalog.games) {
  const token = `data-game="${game.slug}"`;
  const tokenIndex = home.indexOf(token);
  if (tokenIndex < 0) continue;
  const articleStart = home.lastIndexOf('<article', tokenIndex);
  const articleClose = home.indexOf('</article>', tokenIndex);
  if (articleStart < 0 || articleClose < 0) continue;
  const article = home.slice(articleStart, articleClose + '</article>'.length);
  if (GENERIC.some((text) => article.includes(text))) offenders.push(game.slug);
}

if (offenders.length) {
  throw new Error(`Generic LEVEL UP card copy remains for: ${offenders.join(', ')}. Add app-specific copy before shipping.`);
}

fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

for (const slug of patched) {
  const copy = COPY[slug];
  for (const text of Object.values(copy)) {
    if (!home.includes(escapeHtml(text))) throw new Error(`LEVEL UP card copy patch missing: ${slug}`);
  }
}

console.log(`[Firebase] LEVEL UP app-specific card copy patched: ${patched.length}; generic fallback remaining=0.`);
