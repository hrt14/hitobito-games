const TYPE_META = {
  encounter: { label: '出会い', icon: '◎', desc: '人との接点が未来を変える', prompt: '誰と出会ったことで、今の出来事の意味が変わった？' },
  pivot: { label: '方向転換', icon: '↗', desc: '別の道が本命になる', prompt: 'この出来事が閉じた道の代わりに、どんな道を選んだ？' },
  skill: { label: '習得', icon: '◇', desc: '痛みが技術に変わる', prompt: 'この経験があったから身についた力は何？' },
  space: { label: '余白', icon: '○', desc: '空いた場所に新しいものが入る', prompt: '失ったことで生まれた時間や余白に、何が入ってきた？' },
  boundary: { label: '境界線', icon: '▢', desc: '選び方の基準ができる', prompt: 'この経験のあと、何を選ばないと決めた？' },
  detour: { label: '寄り道', icon: '⌁', desc: '予定外が新しい景色につながる', prompt: '予定どおりなら行かなかった場所で、何を見つけた？' },
};

const INCIDENTS = [
  {
    id: 'exam', icon: '✕', hue: 15,
    title: '第一志望に落ちた。',
    truth: '悔しい。努力してきた分だけ、簡単には切り替えられない。',
    routes: [
      { type: 'encounter', title: '第二志望で、重要な人に会う', hint: '場所が変わると、会う人も変わる。', beats: [
        ['3か月後', '新しい席で隣になった人と話す', '第一志望では会わなかった友人と、毎日一緒にいるようになる。'],
        ['1年後', '二人で小さな企画を始める', '得意分野が真逆で、組むと妙にうまく進むことに気づく。'],
        ['3年後', 'その友人と最初の仕事をつくる', '不合格で変わった進路が、今の相棒につながっていた。'] ],
        endTitle: '落ちた学校ではなく、会った人が人生を動かした。', endStory: '第一志望に落ちた事実は消えない。でも、その日に変わった進路が、親友との出会いの入口になった。' },
      { type: 'pivot', title: '「何になりたいか」を選び直す', hint: '学校名から、やりたいことへ。', beats: [
        ['3か月後', '進路をもう一度考え直す', '悔しさをきっかけに、学校名ではなく「そこで何をしたいか」を書き出す。'],
        ['1年後', '興味のある分野に深く入る', '予定していなかった専攻で、自分が時間を忘れるテーマを見つける。'],
        ['3年後', 'そのテーマが進路になる', '落ちたことで選び直した分野が、自分の専門になっている。'] ],
        endTitle: '不合格が、進路の選び直しを始めた。', endStory: '「どこに入るか」がゴールではなくなり、「何をやるか」に軸が移った。' },
      { type: 'skill', title: '失敗の分析が、自分の武器になる', hint: '悔しさを再現可能な改善に変える。', beats: [
        ['3か月後', '勉強法を分解して振り返る', '時間ではなく、伸びた方法と伸びなかった方法を記録する。'],
        ['1年後', '後輩に勉強法を教える', '自分の失敗を説明すると、改善の型がはっきりしてくる。'],
        ['3年後', '「学び方」を人に教える立場になる', 'あの失敗の分析が、どんな分野にも使える学習スキルになった。'] ],
        endTitle: '失敗した経験が、「学び方」の技術になった。', endStory: '結果は望んだものではなかった。でも、失敗を分解する習慣は残った。' }
    ]
  },
  {
    id: 'breakup', icon: '↯', hue: 338,
    title: '恋人に振られた。',
    truth: '寂しいし、納得できない部分もある。今すぐ意味をつけなくていい。',
    routes: [
      { type: 'space', title: '空いた時間に、自分の生活が戻る', hint: '失ったものと同時に、空いたものを見る。', beats: [
        ['3か月後', '週末を一人で使い始める', '止めていた趣味や友人との予定を、少しずつ戻していく。'],
        ['1年後', '一人でも満ちる生活ができる', '誰かがいないと成立しない休日ではなくなる。'],
        ['3年後', '次の関係を「不足」から選ばなくなる', '一人でも大丈夫だから、相手を必要ではなく希望として選べる。'] ],
        endTitle: '別れが、自分の生活を取り戻す余白になった。', endStory: '関係が終わった痛みは消えない。でも、その余白で自分の時間の使い方が変わった。' },
      { type: 'boundary', title: '次に大切にする条件が見える', hint: '合わなかったことも、基準になる。', beats: [
        ['3か月後', 'つらかった場面を書き出す', '何が嫌だったかを「相手の悪さ」ではなく、自分の境界線として整理する。'],
        ['1年後', '早い段階で違和感に気づける', '合わせすぎず、必要なことを言葉にできるようになる。'],
        ['3年後', '無理をしない関係を選んでいる', 'あの別れが、自分に合う関係の基準を作った。'] ],
        endTitle: '終わった関係が、次の関係の設計図になった。', endStory: '別れは失敗だけではなく、自分が何を大切にしたいかを知る材料にもなった。' },
      { type: 'encounter', title: '一人で出た場所で、新しい縁ができる', hint: '予定が消えると、別の場所へ行ける。', beats: [
        ['3か月後', '一人でイベントに参加する', '本来ならデートだった日に、気になっていた集まりへ行く。'],
        ['1年後', 'そこで会った仲間と活動が続く', '恋愛とは別のコミュニティが、生活の大きな支えになる。'],
        ['3年後', '仕事も趣味も、その縁から広がる', '一つの関係が終わったことで、別の人間関係が始まった。'] ],
        endTitle: '失った縁が、別の縁のための席を空けた。', endStory: '誰かの代わりが見つかったのではない。空いた場所に、別の種類のつながりが入ってきた。' }
    ]
  },
  {
    id: 'project', icon: '−', hue: 204,
    title: '仕事を外された。',
    truth: '評価されなかったように感じる。悔しいし、自信も揺らぐ。',
    routes: [
      { type: 'skill', title: '足りなかった力を、一つだけ鍛える', hint: '全部を否定せず、差分だけ拾う。', beats: [
        ['3か月後', '外された理由を一つの技能に絞る', '「自分はダメ」ではなく、足りなかった具体的な1項目を練習する。'],
        ['1年後', 'その技能で別案件を任される', '以前なら避けていた役割を、今度は自分から取りにいける。'],
        ['3年後', 'その技能が自分の看板になる', '外された案件が、伸ばすべき能力を最も早く教えてくれた。'] ],
        endTitle: '外された仕事が、次の専門を教えた。', endStory: '痛かった評価を人格の判定にせず、伸ばす技能の情報として使えた。' },
      { type: 'pivot', title: '自分が勝てる仕事へ寄せる', hint: '向いていない場所から動く。', beats: [
        ['3か月後', '得意だった仕事を棚卸しする', '外された案件と、なぜか成果が出る案件の違いを比べる。'],
        ['1年後', '得意領域の案件比率を増やす', '苦手を平均まで上げるより、強みのある場所で成果が増える。'],
        ['3年後', 'その領域の指名が来る', '外されたことが、自分の勝ち筋を選ぶきっかけになった。'] ],
        endTitle: '外された場所から離れたら、指名される場所ができた。', endStory: 'すべての仕事に適合する必要はなかった。合わない仕事から得意な仕事へ軸が移った。' },
      { type: 'space', title: '空いた時間で、小さな仕事を始める', hint: '予定外の空白を資源にする。', beats: [
        ['3か月後', '空いた時間で試作品を一つ作る', '前から気になっていた小さなアイデアを形にしてみる。'],
        ['1年後', '小さな仕事として続き始める', '本業の外で始めたものに、少しずつ依頼が来る。'],
        ['3年後', 'それが新しい柱になる', '外されたことで生まれた時間が、次の仕事の種になった。'] ],
        endTitle: '失った案件が、新しい仕事を始める時間になった。', endStory: '仕事が減った瞬間は損失だった。でも、その空白が別の柱を作る余地になった。' }
    ]
  },
  {
    id: 'trip', icon: '⌁', hue: 176,
    title: '旅行が中止になった。',
    truth: '楽しみにしていた予定が消えた。がっかりするのは自然なこと。',
    routes: [
      { type: 'detour', title: '近場の寄り道が、新しい定番になる', hint: '遠くへ行けないなら、近くを違う目で見る。', beats: [
        ['3か月後', '代わりに近場へ日帰りで出る', '行ったことのなかった小さな町を歩いてみる。'],
        ['1年後', '季節ごとにその町へ行く', 'お気に入りの店や景色ができて、自分の定番になる。'],
        ['3年後', 'そこで始めた習慣が生活の一部になる', '中止になった旅行が、長く続く小さな旅の入口になった。'] ],
        endTitle: '行けなかった遠方の代わりに、帰りたくなる近場ができた。', endStory: '予定どおりの旅はなくなったが、別の移動が新しい習慣になった。' },
      { type: 'space', title: '予定のない休日を、何もしない日にする', hint: '埋め直さない未来もある。', beats: [
        ['3か月後', '空いた日を予定で埋めずに過ごす', '寝る、読む、散歩する。久しぶりに時間を急がせない。'],
        ['1年後', '意図的に「空白の日」を作る', '忙しさの回復には、イベントではなく余白が必要だと分かる。'],
        ['3年後', '休むことを予定として扱える', '旅行中止の日が、回復のための時間設計を覚えるきっかけになった。'] ],
        endTitle: '中止になった予定が、休み方を教えた。', endStory: '代わりの楽しい予定を探すだけでなく、空いたままにする価値も見つかった。' },
      { type: 'encounter', title: '延期した旅で、別の人と出会う', hint: '同じ場所でも、日が違えば物語が違う。', beats: [
        ['3か月後', '旅行を別の日程で取り直す', '場所は同じでも、季節も混雑も少し違う。'],
        ['1年後', '旅先で会った人と連絡が続く', '元の日程では会わなかった人と、偶然会話が始まる。'],
        ['3年後', 'その縁を訪ねてまた旅をする', '中止でずれた日付が、新しい縁につながっていた。'] ],
        endTitle: 'ずれた日付そのものが、出会いの伏線になった。', endStory: '「行けなかった」だけで終わらず、ずれた時間にも別の可能性があった。' }
    ]
  },
  {
    id: 'proposal', icon: '↘', hue: 271,
    title: '自分の案が採用されなかった。',
    truth: '考えた時間が長いほど、否定されたように感じる。',
    routes: [
      { type: 'skill', title: '伝え方を磨く材料にする', hint: '中身と伝達を切り分ける。', beats: [
        ['3か月後', '通らなかった理由を3つに分ける', '内容、タイミング、伝え方を別々に見直す。'],
        ['1年後', '小さな提案で検証を重ねる', '一発で大きく通すより、試して数字を見せる癖がつく。'],
        ['3年後', '提案を通す人として頼られる', '却下された案が、提案技術を鍛える最初の教材になった。'] ],
        endTitle: '却下が、提案力のトレーニング開始日になった。', endStory: '案が通らなかったことと、自分の価値は別。差分を技能として扱えた。' },
      { type: 'pivot', title: '別の形で小さく試す', hint: '採用される前に、実証する。', beats: [
        ['3か月後', '自分でできる最小版を作る', '許可のいらない範囲まで小さくして、実際に動かす。'],
        ['1年後', '小さな成果が出る', '言葉ではなく結果が、次の提案材料になる。'],
        ['3年後', '元の案より良い形で広がる', '採用されなかったことで、机上案が実証済みの仕組みに変わった。'] ],
        endTitle: '採用されなかったから、先に試せた。', endStory: '承認待ちで止まらず、小さく動いたことが後の説得力になった。' },
      { type: 'boundary', title: '「通す案」と「守る案」を分ける', hint: '全部を他人の評価に預けない。', beats: [
        ['3か月後', '譲れる部分と譲れない部分を整理する', '採用のために変えていいものと、核として残すものを分ける。'],
        ['1年後', '反対されても核だけは守れる', '案の形は変わっても、目的まで失わない提案ができる。'],
        ['3年後', '自分の判断軸が明確になる', '却下された経験が、何を守るかを決める境界線になった。'] ],
        endTitle: '却下が、「何を守るか」を決める基準になった。', endStory: '他人の評価に合わせ切るのではなく、自分の核と手段を分けられるようになった。' }
    ]
  },
  {
    id: 'move', icon: '□', hue: 95,
    title: '住みたかった部屋の審査に落ちた。',
    truth: '生活を思い描いていた分、予定が崩れた感じがする。',
    routes: [
      { type: 'detour', title: '別の街を探して、意外な場所を好きになる', hint: '条件を外すと候補が広がる。', beats: [
        ['3か月後', '候補外だった隣の駅も見る', 'なんとなく避けていた街を歩くと、落ち着く場所が見つかる。'],
        ['1年後', 'その街にお気に入りが増える', '店、人、散歩道が生活の一部になる。'],
        ['3年後', '「ここでよかった」と思える日常がある', '審査落ちでずれた場所が、自分に合う暮らしにつながった。'] ],
        endTitle: '入れなかった部屋が、知らなかった街へ連れていった。', endStory: '希望の部屋は失ったが、暮らし全体では別の当たりを引いた。' },
      { type: 'boundary', title: '住まいの条件を本気で選び直す', hint: '理想と必要条件を分ける。', beats: [
        ['3か月後', '譲れない条件を3つに絞る', '見栄えより睡眠、通勤、静けさなど生活への影響で優先順位をつける。'],
        ['1年後', '条件に合う部屋で生活が安定する', '毎日の小さな摩擦が減って、家が回復の場所になる。'],
        ['3年後', '住まい選びの基準が一生ものになる', '審査落ちを機に、自分に必要な環境が言語化された。'] ],
        endTitle: '落ちた部屋が、暮らしの優先順位を教えた。', endStory: '「欲しい物件」ではなく「合う生活」を選べるようになった。' },
      { type: 'space', title: '引っ越しを急がず、今の部屋を整える', hint: '延期を改善期間にする。', beats: [
        ['3か月後', '今の部屋を一度ちゃんと片づける', '引っ越す前提で放置していた不便を直す。'],
        ['1年後', '必要な物が減る', '暮らしを整理した結果、次に必要な部屋の大きさまで変わる。'],
        ['3年後', '身軽に住み替えられる', '審査落ちの延期期間が、暮らしを軽くする時間になった。'] ],
        endTitle: '引っ越せなかった時間が、身軽さを作った。', endStory: '止まったように見えた期間にも、次の暮らしを整える余地があった。' }
    ]
  },
  {
    id: 'event', icon: '∅', hue: 43,
    title: '楽しみにしていたイベントが中止になった。',
    truth: '期待していた時間が突然なくなると、損したような気持ちになる。',
    routes: [
      { type: 'space', title: '空いた日から、新しい習慣が始まる', hint: '一日だけの空白を長い習慣に変える。', beats: [
        ['3か月後', '空いた時間に初めてのことを試す', 'なんとなく始めた運動や制作が、意外と続く。'],
        ['1年後', '週に一度の習慣になっている', 'イベント一回分より長く、自分の生活に残るものになる。'],
        ['3年後', 'その習慣が自分の一部になる', '中止で空いた一日が、何百日も続く習慣の初日になった。'] ],
        endTitle: 'なくなった一日が、続く習慣の一日目になった。', endStory: '一度きりの楽しみは消えた。でも、その空白から長く残るものが始まった。' },
      { type: 'encounter', title: '代わりの小さな集まりで人と会う', hint: '大きな場がなくても、つながりは作れる。', beats: [
        ['3か月後', '少人数の集まりに顔を出す', '大イベントの代替で開かれた小さな会に参加する。'],
        ['1年後', 'その人たちと定期的に会う', '人数が少なかったからこそ、深く話せる関係になる。'],
        ['3年後', '一緒に新しいイベントを作る', '中止された側から、今度は場を作る側になっている。'] ],
        endTitle: '中止が、小さな出会いを濃くした。', endStory: '大きな場が消えたことで、別のサイズのつながりが生まれた。' },
      { type: 'pivot', title: '「参加する側」から「作る側」へ動く', hint: 'なくなったなら、小さく自分で作る。', beats: [
        ['3か月後', '友人3人だけで代替企画をする', '完璧なイベントではなく、できる規模で楽しむ。'],
        ['1年後', '小さな企画を何度か開く', '人を集めること自体が面白くなってくる。'],
        ['3年後', '自分の企画を待つ人がいる', '中止をきっかけに、参加者から主催者へ役割が変わった。'] ],
        endTitle: 'なくなったイベントが、最初の主催の伏線になった。', endStory: '予定を失ったことが、受け身だった自分の役割を変えるきっかけになった。' }
    ]
  },
  {
    id: 'mistake', icon: '!', hue: 4,
    title: '大きなミスをして、叱られた。',
    truth: '恥ずかしいし、申し訳なさもある。なかったことにはできない。',
    routes: [
      { type: 'skill', title: '再発防止を、仕組みに変える', hint: '気合いではなく、再現性のある対策へ。', beats: [
        ['3か月後', 'ミスの直前の流れを分解する', '注意力ではなく、チェックが抜ける構造を見つける。'],
        ['1年後', 'チームの確認手順に組み込まれる', '自分の対策が、他の人のミスも減らす仕組みになる。'],
        ['3年後', '事故を未然に防ぐ人になる', '一度の大きなミスが、仕組みで守る視点を育てた。'] ],
        endTitle: 'ミスが、チームの仕組みを一段強くした。', endStory: '失敗を個人の反省で終わらせず、再発しにくい構造に変えた。' },
      { type: 'boundary', title: '抱え込みすぎない基準を作る', hint: 'ミスの背景に、無理な持ち方がなかったかを見る。', beats: [
        ['3か月後', '仕事量と確認時間を記録する', '忙しいときほどチェックが消えるパターンに気づく。'],
        ['1年後', '危険な量になる前に相談できる', '「まだいける」ではなく、品質が落ちる手前を基準にする。'],
        ['3年後', '無理な進め方を止められる', '叱られた経験が、自分とチームを守る境界線になった。'] ],
        endTitle: '叱られた日が、抱え込み方を変えた。', endStory: 'ミスそのものだけでなく、ミスが起きやすい働き方を見直す材料になった。' },
      { type: 'encounter', title: '助けを求めた相手が、長い師匠になる', hint: '失敗したからこそ聞けることがある。', beats: [
        ['3か月後', '詳しい人に教えを請う', '恥ずかしさより再発防止を優先して、初歩から聞き直す。'],
        ['1年後', '定期的に相談する関係になる', '一度の質問から、仕事全体を教えてもらうようになる。'],
        ['3年後', '今度は自分が後輩を助ける', 'あのミスがなければ始まらなかった学びの関係が続いている。'] ],
        endTitle: '失敗が、教えてくれる人との縁を作った。', endStory: 'できないことを見せた瞬間が、長い学びの入口になることもある。' }
    ]
  }
];

const state = {
  screen: 'introScreen',
  deck: [],
  round: 0,
  roundTotal: 5,
  incident: null,
  route: null,
  beat: 0,
  recovered: 0,
  usedTypes: new Set(),
  combo: 0,
  maxCombo: 0,
  lastType: null,
  roundCredited: false,
};

const $ = (id) => document.getElementById(id);
const screens = ['introScreen','gameScreen','resultScreen','bookScreen','customScreen'];
let returnScreen = 'introScreen';
let selectedCustomType = null;
let toastTimer = null;

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(id) {
  screens.forEach(s => $(s).classList.toggle('is-active', s === id));
  state.screen = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

function readBook() {
  try { return JSON.parse(localStorage.getItem('fukusen-book') || '[]'); }
  catch { return []; }
}
function writeBook(items) {
  localStorage.setItem('fukusen-book', JSON.stringify(items.slice(0, 60)));
  updateBookCount();
}
function updateBookCount() { $('bookCount').textContent = readBook().length; }

function startSession() {
  state.deck = shuffle(INCIDENTS).slice(0, state.roundTotal);
  state.round = 0;
  state.recovered = 0;
  state.usedTypes = new Set();
  state.combo = 0;
  state.maxCombo = 0;
  state.lastType = null;
  state.roundCredited = false;
  showScreen('gameScreen');
  loadRound();
}

function renderProgress() {
  $('roundNow').textContent = state.round + 1;
  $('roundTotal').textContent = state.roundTotal;
  $('progressDots').innerHTML = Array.from({length: state.roundTotal}, (_, i) => {
    const cls = i < state.round ? 'done' : i === state.round ? 'current' : '';
    return `<i class="${cls}"></i>`;
  }).join('');
}

function loadRound() {
  state.incident = state.deck[state.round];
  state.route = null;
  state.beat = 0;
  state.roundCredited = false;
  renderProgress();
  const i = state.incident;
  $('incidentTitle').textContent = i.title;
  $('incidentTruth').textContent = i.truth;
  $('sceneIcon').textContent = i.icon;
  $('storyStage').style.background = `linear-gradient(145deg, hsl(${i.hue} 40% 24%), #0f1b32 72%)`;
  $('storyStage').classList.remove('flash');
  void $('storyStage').offsetWidth;
  $('storyStage').classList.add('flash');
  $('questionBlock').hidden = false;
  $('routeGrid').hidden = false;
  $('timelinePanel').hidden = true;
  $('recoveryPanel').hidden = true;
  renderRoutes();
}

function renderRoutes() {
  $('routeGrid').innerHTML = state.incident.routes.map((r, index) => {
    const meta = TYPE_META[r.type];
    return `<button class="route-card" type="button" data-route="${index}">
      <small>${meta.label}</small>
      <strong>${r.title}</strong>
      <span>${r.hint}</span>
      <b class="route-icon" aria-hidden="true">${meta.icon}</b>
    </button>`;
  }).join('');
  [...$('routeGrid').querySelectorAll('.route-card')].forEach(btn => {
    btn.addEventListener('click', () => chooseRoute(Number(btn.dataset.route)));
  });
}

function chooseRoute(index) {
  state.route = state.incident.routes[index];
  state.beat = 0;
  $('questionBlock').hidden = true;
  $('routeGrid').hidden = true;
  $('timelinePanel').hidden = false;
  $('recoveryPanel').hidden = true;
  const meta = TYPE_META[state.route.type];
  $('routeType').textContent = meta.label;
  $('routeTitle').textContent = state.route.title;
  updateBeat();
  setTimeout(() => $('timelinePanel').scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
}

function updateBeat() {
  const beat = state.route.beats[state.beat];
  const meta = TYPE_META[state.route.type];
  $('beatTime').textContent = beat[0];
  $('beatEmoji').textContent = meta.icon;
  $('beatTitle').textContent = beat[1];
  $('beatBody').textContent = beat[2];
  $('beatCard').classList.remove('swap');
  void $('beatCard').offsetWidth;
  $('beatCard').classList.add('swap');
  const pct = ((state.beat + 1) / 3) * 100;
  $('fateProgress').style.width = `${pct}%`;
  ['node1','node2','node3'].forEach((id, idx) => $(id).classList.toggle('is-lit', idx <= state.beat));
  $('nextBeatBtn').innerHTML = state.beat === 2 ? '伏線を回収する <span>✦</span>' : '時間を進める <span>→</span>';
}

function advanceBeat() {
  if (state.beat < 2) {
    state.beat += 1;
    updateBeat();
  } else {
    recover();
  }
}

function recover() {
  const r = state.route;
  $('timelinePanel').hidden = true;
  $('recoveryPanel').hidden = false;
  $('recoveryTitle').textContent = r.endTitle;
  $('recoveryStory').textContent = r.endStory;

  if (!state.roundCredited) {
    if (state.lastType && state.lastType !== r.type) state.combo += 1;
    else state.combo = 1;
    state.lastType = r.type;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.usedTypes.add(r.type);
    state.recovered += 1;
    state.roundCredited = true;
    $('fusenReward').textContent = '+1';
  } else {
    state.usedTypes.add(r.type);
    $('fusenReward').textContent = '+0';
  }
  $('viewReward').textContent = `+${state.usedTypes.size}`;
  $('comboReward').textContent = `×${state.combo}`;

  const book = readBook();
  book.unshift({
    id: `${state.incident.id}-${r.type}-${Date.now()}`,
    incident: state.incident.title,
    type: TYPE_META[r.type].label,
    future: r.endTitle,
    story: r.endStory,
    date: new Date().toISOString()
  });
  writeBook(book);
  navigator.vibrate?.(20);
  setTimeout(() => $('recoveryPanel').scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
}

function nextIncident() {
  state.round += 1;
  if (state.round >= state.roundTotal) showResult();
  else {
    loadRound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showResult() {
  $('resultCount').textContent = state.recovered;
  $('statRecovered').textContent = state.recovered;
  $('statTypes').textContent = state.usedTypes.size;
  $('statCombo').textContent = `×${state.maxCombo}`;
  showScreen('resultScreen');
}

function replayRoutes() {
  $('recoveryPanel').hidden = true;
  $('questionBlock').hidden = false;
  $('routeGrid').hidden = false;
  window.scrollTo({ top: 220, behavior: 'smooth' });
}

function renderBook() {
  const items = readBook();
  $('emptyBook').hidden = items.length > 0;
  $('bookList').innerHTML = items.map(item => {
    const d = new Date(item.date);
    const date = Number.isNaN(d.getTime()) ? '' : `${d.getMonth()+1}/${d.getDate()}`;
    return `<article class="book-item">
      <div class="book-item-top"><span class="book-item-type">${escapeHtml(item.type)}</span><span class="book-item-date">${date}</span></div>
      <h3>${escapeHtml(item.incident)}</h3>
      <p><strong>${escapeHtml(item.future)}</strong><br>${escapeHtml(item.story || '')}</p>
    </article>`;
  }).join('');
}

function openBook() {
  returnScreen = state.screen === 'bookScreen' ? 'introScreen' : state.screen;
  renderBook();
  showScreen('bookScreen');
}

function closeBook() { showScreen(returnScreen || 'introScreen'); }

function openCustom() {
  returnScreen = state.screen === 'customScreen' ? 'introScreen' : state.screen;
  selectedCustomType = null;
  $('customEvent').value = '';
  $('customFutureText').value = '';
  $('customCount').textContent = '0';
  $('customFuture').hidden = true;
  $('saveCustomBtn').disabled = true;
  renderCustomTypes();
  showScreen('customScreen');
}

function renderCustomTypes() {
  $('customTypes').innerHTML = Object.entries(TYPE_META).map(([key, m]) =>
    `<button class="type-chip" type="button" data-type="${key}"><strong>${m.icon} ${m.label}</strong><span>${m.desc}</span></button>`
  ).join('');
  [...$('customTypes').querySelectorAll('.type-chip')].forEach(btn => btn.addEventListener('click', () => {
    selectedCustomType = btn.dataset.type;
    [...$('customTypes').children].forEach(c => c.classList.toggle('selected', c === btn));
    $('customFuture').hidden = false;
    $('promptHint').textContent = TYPE_META[selectedCustomType].prompt;
    validateCustom();
    setTimeout(() => $('customFuture').scrollIntoView({ behavior:'smooth', block:'center' }), 20);
  }));
}

function validateCustom() {
  const event = $('customEvent').value.trim();
  const future = $('customFutureText').value.trim();
  $('customCount').textContent = $('customEvent').value.length;
  $('saveCustomBtn').disabled = !(event.length >= 3 && selectedCustomType && future.length >= 5);
}

function saveCustom() {
  const event = $('customEvent').value.trim();
  const future = $('customFutureText').value.trim();
  if (!event || !future || !selectedCustomType) return;
  const meta = TYPE_META[selectedCustomType];
  const book = readBook();
  book.unshift({ id:`custom-${Date.now()}`, incident:event, type:`MY / ${meta.label}`, future, story:'自分で作った未来の仮説。現実がこの通りになる必要はない。', date:new Date().toISOString() });
  writeBook(book);
  showToast('伏線帳に1本追加しました');
  setTimeout(() => { renderBook(); showScreen('bookScreen'); }, 350);
}

function escapeHtml(str='') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

$('startBtn').addEventListener('click', startSession);
$('againBtn').addEventListener('click', startSession);
$('nextBeatBtn').addEventListener('click', advanceBeat);
$('nextIncidentBtn').addEventListener('click', nextIncident);
$('replayRouteBtn').addEventListener('click', replayRoutes);
$('otherRouteBtn').addEventListener('click', replayRoutes);
$('bookBtn').addEventListener('click', openBook);
$('closeBookBtn').addEventListener('click', closeBook);
$('customBtnIntro').addEventListener('click', openCustom);
$('customBtnResult').addEventListener('click', openCustom);
$('closeCustomBtn').addEventListener('click', () => showScreen(returnScreen || 'introScreen'));
$('customEvent').addEventListener('input', validateCustom);
$('customFutureText').addEventListener('input', validateCustom);
$('saveCustomBtn').addEventListener('click', saveCustom);

updateBookCount();
