const $ = (id) => document.getElementById(id);
const screens = [...document.querySelectorAll('.screen')];
const STORAGE_KEY = 'levelup-ryoma-big-picture-v1';
const SESSION_LENGTH = 5;
const lensOrder = ['purpose', 'people', 'options', 'time'];

const lensMeta = {
  purpose: { label: '目的を広げる', short: '目的', question: 'そもそも、何を実現したい？' },
  time: { label: '時間を広げる', short: '時間', question: '今日ではなく、半年後なら？' },
  people: { label: '人を広げる', short: '人', question: '敵と味方の二択以外に誰がいる？' },
  options: { label: '手段を広げる', short: '手段', question: '戦う以外の打ち手は？' },
};

const historyFacts = {
  learn: {
    title: '所属の外へ出て、学ぶ相手を変えた',
    fact: '国立国会図書館によれば、坂本龍馬は1862年に脱藩して江戸へ出て、勝海舟の門下生となり、神戸海軍操練所建設に尽力した。',
    abstraction: '自分の陣地の常識だけで答えを出さず、盤面を変える知識へ移動する。',
    href: 'https://www.ndl.go.jp/portrait/datas/89',
  },
  bridge: {
    title: '対立していた勢力をつないだ',
    fact: '国立国会図書館によれば、龍馬は薩長連合締結に努力し、1866年に西郷隆盛と木戸孝允の盟約に立ち会った。',
    abstraction: '目の前の対立を勝ち負けで終わらせず、上位の共通目的を探す。',
    href: 'https://www.ndl.go.jp/portrait/datas/89',
  },
  organize: {
    title: '個人技だけでなく、動ける組織をつくった',
    fact: '国立国会図書館によれば、龍馬は1865年、長崎の亀山に社中を開いた。これは後の海援隊につながった。',
    abstraction: '自分一人が頑張るより、人・役割・仕組みを置いて問題を動かす。',
    href: 'https://www.ndl.go.jp/portrait/datas/89',
  },
  system: {
    title: '個別の争いより、国の仕組みまで構想した',
    fact: '国立国会図書館は、1867年11月の「新政府綱領八策」を、龍馬が「船中八策」をもとに起草して土佐藩重役に示した政体案として紹介している。',
    abstraction: '個別の揉め事を一件ずつ処理するだけでなく、同じ問題が起きにくい仕組みまで考える。',
    href: 'https://www.ndl.go.jp/modern/cha1/description02.html',
  },
};

const scenarios = [
  {
    id: 'credit', scene: '会議',
    situation: '自分が考えた案を、同僚が自分の案のように話した。上司もその同僚を評価している。',
    narrowFrame: '今すぐ訂正して、手柄を取り返したい。',
    lenses: {
      purpose: '本当の目的は一回の手柄より、提案を通し、継続的に自分の貢献が見える状態をつくること。',
      time: '今日の会議だけでなく、来週・来月も同じメンバーと仕事をする。',
      people: '同僚と上司だけではない。議事録を見る人、実行担当、関係部署もいる。',
      options: '公開の場で争う以外に、議事録、1on1、役割分担、次回の進め方を変える手がある。',
    },
    moves: [
      { label: 'その場で「それ、私の案です」と強く訂正する', scale: 'small', feedback: '手柄は守れるかもしれない。ただ、問題を「一回の発言」に閉じたままです。' },
      { label: '次回は自分が先に発言するよう気をつける', scale: 'middle', feedback: '自分の行動は変わりますが、役割と記録の構造はそのままです。' },
      { label: '事実を記録し、上司と役割・提案のオーナーを明確にする', scale: 'big', feedback: '一回の手柄争いから、今後も貢献が見える仕組みへ盤面を広げました。' },
    ],
    transferRule: '人と争う前に、同じ揉め事を減らす構造をつくれないかを見る。', historyKey: 'system',
  },
  {
    id: 'rejected', scene: '提案',
    situation: '時間をかけた提案を取引先に断られた。担当者は「今は必要ない」の一点張り。',
    narrowFrame: 'この提案をなんとか通すか、諦めるか。',
    lenses: {
      purpose: '目的は自分の提案を通すことではなく、相手の課題を解決して取引を前に進めること。',
      time: '今月の受注だけでなく、半年後に信頼と実績が残る選択もある。',
      people: '担当者だけでなく、実際の利用者、決裁者、現場責任者がいる。',
      options: '完成案を丸ごと売る以外に、小さな実験、共同検証、別の入口がある。',
    },
    moves: [
      { label: '資料を増やして、もう一度説得する', scale: 'small', feedback: '同じ土俵で押すだけだと、相手の前提が変わらない限り結果も変わりにくい。' },
      { label: 'いったん引いて、別の案件を探す', scale: 'middle', feedback: '損切りはできます。ただ、断りの中にある学習機会は拾えていません。' },
      { label: '断る理由を聞き、最小の検証に組み替えて一緒に試す', scale: 'big', feedback: '「通す／諦める」の二択から、相手と新しい選択肢をつくる盤面へ移れました。' },
    ],
    transferRule: '二択になったら、第三の小さな実験をつくる。', historyKey: 'learn',
  },
  {
    id: 'copy', scene: '競争',
    situation: '競合が自社の新機能とよく似たものを出した。社内には怒りと焦りが広がっている。',
    narrowFrame: 'もっと早く、もっと多く機能を出して勝つ。',
    lenses: {
      purpose: '目的は競合を悔しがらせることではなく、顧客が自社を選び続ける理由を強くすること。',
      time: '一機能の先陣争いより、1〜3年で積み上がる優位性を見る。',
      people: '競合だけでなく、顧客、販売パートナー、コミュニティ、データ提供者がいる。',
      options: '機能競争以外に、顧客接点、導入体験、流通、ブランド、データの蓄積がある。',
    },
    moves: [
      { label: '競合より多い機能を急いで追加する', scale: 'small', feedback: '競合の動きに自社の優先順位を握らせる形になります。' },
      { label: '似ている点を比較して、自社の差を広告する', scale: 'middle', feedback: '違いは伝えられますが、模倣されにくい強みそのものは増えません。' },
      { label: '顧客接点と導入後の成功体験を強化し、模倣されにくい資産を積む', scale: 'big', feedback: '一機能の勝負から、時間と関係性が味方になる競争へ盤面を広げました。' },
    ],
    transferRule: '相手の一手に反応するより、自分だけが積み上げられるものを見る。', historyKey: 'organize',
  },
  {
    id: 'family', scene: '家族',
    situation: '家族に頼んだことを何度言ってもやってくれない。言い方もきつくなり、また口論になった。',
    narrowFrame: 'どちらが正しいか、わからせたい。',
    lenses: {
      purpose: '目的は言い負かすことではなく、必要なことが回り、関係も壊さない状態をつくること。',
      time: '今夜の勝敗より、同じ問題が来月も起きるかどうかが重要。',
      people: '自分と相手だけでなく、家族全体の予定や役割の影響もある。',
      options: '説得以外に、担当の変更、頻度の調整、見える化、外部サービスもある。',
    },
    moves: [
      { label: '正しい理由をもっと丁寧に説明する', scale: 'small', feedback: '説明不足が原因なら効きますが、役割や負荷が原因なら同じ衝突が戻ります。' },
      { label: '今回は自分でやって、怒りを収める', scale: 'middle', feedback: 'その場は収まりますが、次回の構造は変わりません。' },
      { label: '共通の目的を確認し、役割・頻度・やり方を一緒に組み替える', scale: 'big', feedback: '「正しい方が勝つ」から、「家全体が回る仕組みをつくる」へ盤面が広がりました。' },
    ],
    transferRule: '対人問題ほど、相手を変える前に共通目的と構造を見る。', historyKey: 'bridge',
  },
  {
    id: 'sales', scene: '売上',
    situation: '今月の売上が目標を大きく下回った。会議では「とにかくキャンペーンを増やそう」という空気。',
    narrowFrame: '今月中に数字を戻す施策を何本も打つ。',
    lenses: {
      purpose: '目的は今月の見栄えではなく、売上が再現性を持って伸びる状態をつくること。',
      time: '今月だけでなく、90日・半年でどの指標を積み上げるかを見る。',
      people: '新規客だけでなく、既存客、休眠客、販売パートナー、商品担当がいる。',
      options: '値引き以外に、流入、CVR、単価、継続、品揃え、導線を変える手がある。',
    },
    moves: [
      { label: '月末セールを追加して売上を取りにいく', scale: 'small', feedback: '短期回復には使えますが、なぜ落ちたかが不明なら翌月も同じです。' },
      { label: '競合の施策を調べて、似た企画を試す', scale: 'middle', feedback: '打ち手は増えますが、自社の制約がどこかはまだ見えていません。' },
      { label: '最大の制約指標を一つ特定し、90日でそこを改善する実験を組む', scale: 'big', feedback: '月末の焦りから、再現性のある成長をつくる時間軸へ移れました。' },
    ],
    transferRule: '焦ったときほど、施策の数ではなく最大の制約を探す。', historyKey: 'system',
  },
  {
    id: 'boss-no', scene: '上司',
    situation: '新しい企画を上司に否定された。理由は「前例がないし、失敗したら困る」。',
    narrowFrame: '自分の企画が正しいと証明したい。',
    lenses: {
      purpose: '目的は自分の正しさを認めさせることではなく、価値があるかを確かめること。',
      time: '一回の承認ではなく、次の判断材料が増える進め方を考える。',
      people: '上司だけでなく、利用者、実行担当、リスクを負う人、協力者がいる。',
      options: '全面承認以外に、限定テスト、期限付き実験、撤退条件を先に決める手がある。',
    },
    moves: [
      { label: '反論資料を作って再度プレゼンする', scale: 'small', feedback: '相手の恐れが「失敗コスト」なら、正しさの説明だけでは前提が動きません。' },
      { label: 'いったん諦めて、機会を待つ', scale: 'middle', feedback: '衝突は避けられますが、判断材料は増えません。' },
      { label: '失敗コストを小さくした限定実験と撤退条件を提案する', scale: 'big', feedback: '「承認する／しない」から、「安全に学ぶ」という第三の盤面をつくれました。' },
    ],
    transferRule: '反対されたら、説得力より「失敗しても小さい形」を設計する。', historyKey: 'learn',
  },
  {
    id: 'sns', scene: 'SNS',
    situation: '自分について事実と違う批判が投稿され、反論したくて何度も画面を開いてしまう。',
    narrowFrame: '相手を論破して、誤解を全部解きたい。',
    lenses: {
      purpose: '目的は相手に勝つことではなく、信用を守り、自分の時間を本来の活動に使うこと。',
      time: '今夜の感情より、一週間後に何が残るかを見る。',
      people: '批判者だけでなく、黙って見ている人、顧客、仲間、自分自身がいる。',
      options: '全面反論以外に、必要な事実だけ訂正、個別連絡、無反応、第三者の確認がある。',
    },
    moves: [
      { label: '相手の投稿を引用して、一つずつ反論する', scale: 'small', feedback: '事実訂正はできますが、相手を中心に自分の時間が回りやすくなります。' },
      { label: '何も言わず、画面を閉じる', scale: 'middle', feedback: '反応を止めるのは強い選択です。ただ、信用上必要な訂正がある場合は別です。' },
      { label: '必要な事実だけ一度訂正し、その後は本来の活動へ戻る', scale: 'big', feedback: '批判者との一騎打ちから、自分の信用と時間を守る大きな目的へ戻れました。' },
    ],
    transferRule: '目の前の一人ではなく、誰に何を残したいかで反応を選ぶ。', historyKey: 'bridge',
  },
  {
    id: 'overload', scene: '仕事量',
    situation: '依頼が次々に増え、全部重要に見える。朝から通知に反応するだけで一日が終わりそう。',
    narrowFrame: 'もっと速く全部こなす方法を探す。',
    lenses: {
      purpose: '目的は依頼を全部消すことではなく、最重要の成果を出すこと。',
      time: '今日の受信箱より、今月の成果と持続可能性を見る。',
      people: '自分だけでなく、任せられる人、依頼主、意思決定者、外部サービスがいる。',
      options: '自分で処理する以外に、やめる、任せる、期限を変える、まとめる、自動化する手がある。',
    },
    moves: [
      { label: 'タスク管理を細かくして、処理速度を上げる', scale: 'small', feedback: '整理はできますが、仕事量そのものが多すぎる問題は残ります。' },
      { label: '今日は一番簡単なものから片付ける', scale: 'middle', feedback: '前進感は出ますが、重要な成果への距離が縮むとは限りません。' },
      { label: '最重要成果を一つ決め、他は削る・任せる・期限変更する', scale: 'big', feedback: '「速く全部」から、「重要なものが進む配置」へ盤面を変えました。' },
    ],
    transferRule: '能力不足に見えるときほど、仕事の配置そのものを疑う。', historyKey: 'organize',
  },
  {
    id: 'career', scene: '転機',
    situation: '面白そうな新しい仕事の話が来た。でも今の安定を失うのが怖く、判断できない。',
    narrowFrame: '辞めるか、残るかを今決める。',
    lenses: {
      purpose: '目的は不安をゼロにすることではなく、長期的に望む能力・仕事・生活へ近づくこと。',
      time: '今月の安心だけでなく、3年後・5年後に何を積みたいかを見る。',
      people: '自分と会社だけでなく、家族、仲間、メンター、将来の顧客もいる。',
      options: '退職／残留以外に、副業、試用、短期プロジェクト、情報面談、撤退条件がある。',
    },
    moves: [
      { label: '不安が消えるまで、今のまま様子を見る', scale: 'small', feedback: '不安は減るかもしれませんが、判断材料も増えにくいままです。' },
      { label: '思い切って辞めて、新しい方へ賭ける', scale: 'middle', feedback: '大きく動けますが、不可逆な決断を先に置いています。' },
      { label: '小さく試せる形を作り、3か月で判断材料を増やす', scale: 'big', feedback: '「安全か挑戦か」の二択から、学びながら進む時間軸へ広げました。' },
    ],
    transferRule: '大きな決断ほど、不可逆にする前に小さく試す。', historyKey: 'learn',
  },
  {
    id: 'price-war', scene: '価格競争',
    situation: '競合が大幅値下げを始め、顧客からも「同じ価格にできないか」と言われた。',
    narrowFrame: 'こちらも値下げして客を取られないようにする。',
    lenses: {
      purpose: '目的は価格表で勝つことではなく、利益を残しながら選ばれる理由をつくること。',
      time: '今月の失注だけでなく、値下げを半年続けた後の体力を見る。',
      people: '競合と顧客だけでなく、既存顧客、仕入先、営業、サポート担当もいる。',
      options: '値下げ以外に、対象限定、構成変更、保証、速度、サポート、契約条件を変える手がある。',
    },
    moves: [
      { label: '全商品を競合価格まで下げる', scale: 'small', feedback: '短期の防衛にはなりますが、競合がさらに下げれば同じ問題が続きます。' },
      { label: '値下げせず、品質の良さだけを説明する', scale: 'middle', feedback: '軸は守れますが、顧客が比較している価値を具体化できていない可能性があります。' },
      { label: '価格感度の高い層だけ条件を分け、残りは価値・契約・支援を再設計する', scale: 'big', feedback: '一律の価格勝負から、顧客ごとに勝ち方を分ける盤面へ移れました。' },
    ],
    transferRule: '相手の土俵に合わせる前に、勝負する土俵を分けられないかを見る。', historyKey: 'organize',
  },
];

let state = {
  session: [], round: 0, opened: new Set(), results: [], selected: null, renderedMoves: [], lastResult: null,
};
let toastTimer = null;

function haptic(pattern) { try { navigator.vibrate?.(pattern); } catch {} }
function track(event, detail = {}) { try { window.levelupTrack?.(event, { app: 'ryoma-big-picture', ...detail }); } catch {} }
function showScreen(id) { screens.forEach((screen) => screen.classList.toggle('active', screen.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); track('screen_view', { screen: id }); }
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('show'); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 1500); }
function loadStats() { try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return { sessions: Number(raw.sessions) || 0, best: Number(raw.best) || 0 }; } catch { return { sessions: 0, best: 0 }; } }
function saveStats(stats) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {} }
function todayOffset() { const now = new Date(); const day = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000; return Math.abs(Math.floor(day)) % scenarios.length; }
function makeSession() { const offset = todayOffset(); return Array.from({ length: SESSION_LENGTH }, (_, i) => scenarios[(offset + i) % scenarios.length]); }
function shuffleMoves(moves, seedText) { const out = moves.map((move) => ({ ...move })); let seed = [...seedText].reduce((sum, c) => sum + c.charCodeAt(0), 0) + todayOffset(); for (let i = out.length - 1; i > 0; i -= 1) { seed = (seed * 9301 + 49297) % 233280; const j = Math.floor((seed / 233280) * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }

function updateStatsUI() {
  const stats = loadStats();
  $('recordSessions').textContent = String(stats.sessions);
  $('recordBest').textContent = stats.sessions ? String(stats.best) : '—';
  $('bestIntro').textContent = stats.sessions ? `自己ベスト ${stats.best}/5` : '初回';
}

function startSession() {
  state = { session: makeSession(), round: 0, opened: new Set(), results: [], selected: null, renderedMoves: [], lastResult: null };
  renderRound(); showScreen('gameScreen'); haptic([12, 26, 12]); track('session_start');
}

function renderRound() {
  const current = state.session[state.round];
  state.opened = new Set(); state.selected = null; state.renderedMoves = shuffleMoves(current.moves, current.id);
  $('roundLabel').textContent = `${state.round + 1} / ${state.session.length}`;
  $('progressDots').innerHTML = state.session.map((_, index) => `<i class="${index <= state.round ? 'on' : ''}"></i>`).join('');
  $('sceneTag').textContent = current.scene; $('situationText').textContent = current.situation; $('narrowText').textContent = current.narrowFrame; $('boardScene').textContent = current.scene;
  document.querySelectorAll('.lens').forEach((button) => { const key = button.dataset.lens; button.classList.remove('open'); button.setAttribute('aria-pressed', 'false'); button.querySelector('b').textContent = lensMeta[key].question; button.querySelector('small').textContent = 'TAP TO OPEN'; });
  state.renderedMoves.forEach((move, index) => { const button = document.querySelector(`[data-move-index="${index}"]`); button.dataset.scale = move.scale; button.querySelector('.move-text').textContent = move.label; button.disabled = true; });
  $('boardShell').className = 'board-shell'; updateOpenState();
}

function updateOpenState() {
  const count = state.opened.size; $('openCount').textContent = `${count} / 4 OPEN`; $('boardShell').className = `board-shell open-${count}`;
  const remaining = Math.max(0, 3 - count); const ready = count >= 3;
  $('movesPanel').classList.toggle('ready', ready); $('movesStatus').textContent = ready ? '盤面を見て、一手を選ぶ' : `あと${remaining}方向、開く`; $('movesCount').textContent = ready ? 'GO' : String(remaining);
  document.querySelectorAll('.move-btn').forEach((button) => { button.disabled = !ready; });
}

function openLens(key) {
  if (state.opened.has(key)) return;
  const current = state.session[state.round]; state.opened.add(key);
  const button = document.querySelector(`[data-lens="${key}"]`); button.classList.add('open'); button.setAttribute('aria-pressed', 'true'); button.querySelector('b').textContent = current.lenses[key]; button.querySelector('small').textContent = 'OPEN';
  updateOpenState(); haptic(10); track('lens_open', { lens: key, count: state.opened.size });
}

function scaleLabel(scale) { if (scale === 'big') return '盤面を変える一手'; if (scale === 'middle') return '一歩広い一手'; return '目先の一手'; }
function chooseMove(index) {
  if (state.opened.size < 3) return;
  const move = state.renderedMoves[index]; const current = state.session[state.round]; if (!move) return;
  state.selected = move;
  const history = historyFacts[current.historyKey];
  $('scaleStamp').textContent = scaleLabel(move.scale); $('scaleStamp').className = `scale-stamp ${move.scale}`; $('feedbackText').textContent = move.feedback; $('transferRule').textContent = current.transferRule;
  $('historyTitle').textContent = history.title; $('historyFact').textContent = history.fact; $('historyAbstraction').textContent = history.abstraction; $('historyLink').href = history.href;
  $('nextBtn').querySelector('span').textContent = state.round + 1 < state.session.length ? '次の航路へ' : '今日の結果を見る';
  showScreen('feedbackScreen'); haptic(move.scale === 'big' ? [18, 30, 26] : 14); track('move_chosen', { scale: move.scale, lenses: state.opened.size, scenario: current.id });
}

function nextRound() {
  if (!state.selected) return;
  state.results.push({ scenarioId: state.session[state.round].id, scale: state.selected.scale, opened: [...state.opened] });
  if (state.round + 1 < state.session.length) { state.round += 1; renderRound(); showScreen('gameScreen'); return; }
  finishSession();
}

function resultSummary() {
  const big = state.results.filter((r) => r.scale === 'big').length; const full = state.results.filter((r) => r.opened.length === 4).length;
  const counts = { purpose: 0, time: 0, people: 0, options: 0 }; state.results.forEach((r) => r.opened.forEach((key) => { counts[key] += 1; }));
  let weakest = lensOrder[0]; lensOrder.forEach((key) => { if (counts[key] < counts[weakest]) weakest = key; });
  return { big, full, counts, weakest };
}

function finishSession() {
  const summary = resultSummary(); const stats = loadStats(); const next = { sessions: stats.sessions + 1, best: Math.max(stats.best, summary.big) }; saveStats(next); state.lastResult = summary;
  $('bigMoveScore').textContent = String(summary.big); $('fullViewScore').textContent = String(summary.full);
  lensOrder.forEach((key) => { document.querySelector(`[data-result-lens="${key}"] b`).textContent = `${summary.counts[key]}/5`; });
  $('weakLensTitle').textContent = lensMeta[summary.weakest].label; $('weakLensQuestion').textContent = lensMeta[summary.weakest].question;
  $('resultHeadline').textContent = summary.big >= 4 ? '目先の勝負から、盤面へ戻れた。' : summary.big >= 2 ? '視野は広がった。次は一手まで変える。' : '見えた範囲より、選んだ一手はまだ小さい。';
  $('sessionCount').textContent = `これまで ${next.sessions} セッション`; $('shareStatus').textContent = ''; updateStatsUI(); showScreen('resultScreen'); haptic([22, 35, 22, 35, 36]); track('session_complete', { big: summary.big, full: summary.full, weakest: summary.weakest });
}

async function shareResult() {
  const summary = state.lastResult || resultSummary(); const text = `今日の「大きく考える」練習\n盤面を変える一手 ${summary.big}/5\n4つの視点を全部開いた ${summary.full}/5\n#LEVELUP`;
  try {
    if (navigator.share) { await navigator.share({ title: '目先に振り回されない', text, url: location.href }); $('shareStatus').textContent = '共有しました'; }
    else { await navigator.clipboard.writeText(`${text}\n${location.href}`); $('shareStatus').textContent = '結果をコピーしました'; toast('結果をコピーしました'); }
  } catch { $('shareStatus').textContent = ''; }
}

function showRecord() { updateStatsUI(); showScreen('recordScreen'); }

document.querySelectorAll('.lens').forEach((button) => button.addEventListener('click', () => openLens(button.dataset.lens)));
document.querySelectorAll('.move-btn').forEach((button) => button.addEventListener('click', () => chooseMove(Number(button.dataset.moveIndex))));
$('startBtn').addEventListener('click', startSession); $('againBtn').addEventListener('click', startSession); $('recordStartBtn').addEventListener('click', startSession); $('nextBtn').addEventListener('click', nextRound); $('shareBtn').addEventListener('click', shareResult); $('recordBtn').addEventListener('click', showRecord); $('recordBackBtn').addEventListener('click', () => showScreen('introScreen')); $('resultHomeBtn').addEventListener('click', () => showScreen('introScreen'));

updateStatsUI(); track('app_opened');
