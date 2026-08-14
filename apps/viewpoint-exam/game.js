(() => {
  'use strict';

  const LENSES = {
    remain: { name: '残ったものを見る', short: '残ったもの', guide: '失ったものだけでなく、まだ残っている資源・能力・選択肢を見る。', example: '足を骨折した → もう片方の足は無事だった' },
    compare: { name: '比較の幅を広げる', short: '比較する', guide: '被害を過小評価せず、より大きな損失と切り分けて現在地を測る。', example: '財布をなくした → 命や健康まで失ったわけではない' },
    time: { name: '時間を伸ばす', short: '時間を伸ばす', guide: '今日だけでなく、数週間後・1年後の視点から出来事の大きさを見る。', example: '発表で噛んだ → 1年後にはほぼ覚えていない' },
    learn: { name: '学びに変える', short: '学びに変える', guide: '失敗から、次に再利用できる情報・チェック項目を1つ持ち帰る。', example: '商談失敗 → 刺さらない提案が1つ分かった' },
    chance: { name: '機会に変える', short: '機会に変える', guide: '空いた時間・役割・選択肢など、新しく生まれた余白を見る。', example: '予定がなくなった → 別のことを選べる時間ができた' },
    constraint: { name: '制約を利用する', short: '制約を利用', guide: '制約そのものをルールにして、小さく・速く・工夫して進める。', example: '予算がない → 小さく試す設計になる' },
    story: { name: 'ネタにする', short: 'ネタにする', guide: '笑える失敗や意外な出来事なら、将来話せる経験として保存する。', example: '盛大に転んだ → 一生使える話が1つ増えた' },
    next: { name: '次の一手を見る', short: '次の一手', guide: '過去の評価より、次回に変えられる具体的な行動を1つ作る。', example: 'メール誤送信 → 送信前チェックを1項目増やす' },
    other: { name: '相手側から見る', short: '相手側から見る', guide: '自分への攻撃と決めつけず、相手の事情・役割・目的からも眺める。', example: '注意された → 品質を守る役割から言っているのかもしれない' },
    present: { name: '今あるものを見る', short: '今あるもの', guide: '「ないもの」から注意を外し、すでに使えるもの・持っているものを見る。', example: '欲しい物を買えない → 今ある道具を使い切れる' }
  };

  const SCENARIOS = [
    {
      level: 1, event: '雨が降った。', anchor: '濡れるし予定も変わる。そのうえで別の面もある。',
      good: [
        ['涼しくなって過ごしやすい時間もある。','present'], ['植物や街路樹には恵みになる。','other'], ['家でやることに切り替える理由ができた。','chance'], ['次から折りたたみ傘を置くきっかけになる。','next'], ['雨の日にしか見えない景色もある。','chance'], ['今日の雨も数日後には小さな出来事。','time']
      ],
      bad: [['雨なんて全然イヤじゃない。むしろ最高。','事実を消している'], ['雨を降らせた天気予報が悪い。','他責にしている']]
    },
    {
      level: 1, event: '電車に乗り遅れた。', anchor: '遅れた事実は変わらない。次の10分の意味は増やせる。',
      good: [
        ['次の電車には乗れる。','remain'], ['一本ぶん休憩する時間ができた。','chance'], ['次から5分早く出る基準ができた。','next'], ['少し走ったので運動にはなった。','story'], ['今日全体で見れば数分の遅れだ。','time'], ['駅でやる小さな用事を済ませられる。','constraint']
      ],
      bad: [['遅刻しても絶対に誰も気にしない。','根拠のない決めつけ'], ['電車が自分を待たないのがおかしい。','他責にしている']]
    },
    {
      level: 1, event: 'お気に入りのマグカップを割った。', anchor: '気に入っていた物を失った残念さは、そのままでいい。',
      good: [
        ['他の食器は残っている。','remain'], ['置き場所を見直すきっかけになる。','next'], ['長く使えた時間まで消えたわけではない。','present'], ['新しい一個を選ぶ余白ができた。','chance'], ['割れ物を扱うときの癖に気づける。','learn'], ['いつか「派手に割った話」にはできる。','story']
      ],
      bad: [['本当は全然気に入っていなかった。','事実を消している'], ['割れたのは運命が新しい物を買えと言っている。','根拠のない意味づけ']]
    },
    {
      level: 1, event: '楽しみにしていた店が休みだった。', anchor: 'がっかりする。それでも「今日」はまだ残っている。',
      good: [
        ['別の店を試す機会になった。','chance'], ['店そのものはなくなったわけではない。','remain'], ['次は営業日を確認する習慣がつく。','next'], ['空いた時間で周辺を歩ける。','constraint'], ['一日の予定全部が失敗したわけではない。','compare'], ['後日行く楽しみを残せた。','time']
      ],
      bad: [['休みの店なんて二度と価値がない。','極端な一般化'], ['きっと自分が来るのを嫌がって休んだ。','根拠のない個人化']]
    },
    {
      level: 2, event: '楽しみにしていた旅行が中止になった。', anchor: '楽しみにしていた分、残念。それでも失ったもの以外も見る。',
      good: [
        ['使う予定だったお金は残る。','remain'], ['別の日程や行き先を選び直せる。','chance'], ['キャンセル対応の手順を一度覚えられた。','learn'], ['予定が空いたから近場でできることを探せる。','constraint'], ['数か月後には別の思い出を作れる。','time'], ['一緒に行く人と「次どうする？」を話せる。','other']
      ],
      bad: [['中止のほうが絶対に旅行より楽しい。','無理やり肯定'], ['もう旅行は全部うまくいかない。','極端な一般化']]
    },
    {
      level: 2, event: '財布を落とした。', anchor: '手続きも損失もある。被害を小さく言い換えるゲームではない。',
      good: [
        ['カードを止めるという次の一手はある。','next'], ['身分証やカードの管理方法を見直せる。','learn'], ['命や身体まで失ったわけではない。','compare'], ['現金を持ちすぎない仕組みに変えられる。','constraint'], ['手元に残っている決済手段を確認できる。','remain'], ['数週間後には手続きが終わっている可能性が高い。','time']
      ],
      bad: [['落とした財布は必ず善人が届けてくれる。','根拠のない楽観'], ['財布を落とせてラッキーだった。','損失の否定']]
    },
    {
      level: 2, event: '友人から返信が来ない。', anchor: '返信がまだない。それ以上は、まだ事実ではない。',
      good: [
        ['「嫌われた」と決まったわけではない。','remain'], ['相手が忙しい可能性もある。','other'], ['必要なら後で一度だけ確認すればいい。','next'], ['返信を待つ間に自分の予定を進められる。','constraint'], ['今日返ってこなくても関係全体は決まらない。','time'], ['自分がコントロールできるのは送った後の行動だけ。','present']
      ],
      bad: [['絶対に嫌われた。','根拠のない決めつけ'], ['相手は返信する義務がある。','他責にしている']]
    },
    {
      level: 2, event: '買ったばかりの服にコーヒーをこぼした。', anchor: '汚れたショックはある。そこから何を残せるか。',
      good: [
        ['すぐ対処すれば落とせる可能性は残っている。','remain'], ['染み抜きの方法を覚える機会になった。','learn'], ['次から飲み物を置く位置を変えられる。','next'], ['服一着の汚れで今日全部が悪くなったわけではない。','compare'], ['あとでは笑える失敗談になるかもしれない。','story'], ['家にある別の服を活かす日になる。','present']
      ],
      bad: [['汚れた服のほうが新品より絶対おしゃれ。','無理やり肯定'], ['コーヒーを作った人のせいだ。','他責にしている']]
    },
    {
      level: 3, event: '仕事で大きなミスをした。', anchor: '影響は受け止める。反省と自己否定は同じではない。',
      good: [
        ['致命傷になる前に弱点が見えたとも言える。','learn'], ['再発防止のチェック項目を今日作れる。','next'], ['一度のミスだけで全能力が消えるわけではない。','remain'], ['数年後にも使える改善策を残せる。','time'], ['同じ失敗をした人の気持ちは以前より分かる。','other'], ['限られた時間なら「まず止血」を優先できる。','constraint']
      ],
      bad: [['大きなミスはむしろ成功と同じ。','損失の否定'], ['周りがちゃんと見ていなかったのが悪い。','他責にしている']]
    },
    {
      level: 3, event: '大事な発表で頭が真っ白になった。', anchor: '恥ずかしさはある。でも一場面から全部を決めない。',
      good: [
        ['最後までその場に立った経験は残る。','remain'], ['次は冒頭だけ暗記しない設計に変えられる。','next'], ['緊張した時の自分の反応を知れた。','learn'], ['一年後には今ほど大きく感じないかもしれない。','time'], ['聞き手も完璧な発表だけを求めていたとは限らない。','other'], ['この失敗はいつか人前で話せるネタになる。','story']
      ],
      bad: [['失敗したから、もう人前に出る資格がない。','極端な一般化'], ['聞いていた人は全員もう忘れたはず。','根拠のない決めつけ']]
    },
    {
      level: 3, event: '希望していた仕事の選考に落ちた。', anchor: '欲しかった結果ではない。それでも未来の選択肢は1社ではない。',
      good: [
        ['応募して得た資料や面接経験は残っている。','remain'], ['合わなかった点を次の応募条件にできる。','learn'], ['別の会社や働き方を選ぶ余白が戻った。','chance'], ['次に直す応募書類の1点を決められる。','next'], ['一社の判断が自分の価値全体ではない。','compare'], ['半年後には違う場所で働いている可能性もある。','time']
      ],
      bad: [['落ちた会社はきっと最低の会社だ。','他責にしている'], ['選考に落ちることこそ最高の成功だ。','損失の否定']]
    },
    {
      level: 3, event: '信頼していた人に厳しく注意された。', anchor: '刺さる言い方だったとしても、受け取る意味は1つではない。',
      good: [
        ['関係を切るだけなら注意すらしない場合もある。','other'], ['内容の中から使える一点だけ持ち帰れる。','learn'], ['言い方と指摘内容を分けて考えられる。','present'], ['次に確認する質問を1つ作れる。','next'], ['一度の注意で関係の全部が決まるわけではない。','time'], ['自分に残っている強みや実績まで消えたわけではない。','remain']
      ],
      bad: [['注意されたのは全部相手の性格が悪いから。','他責にしている'], ['注意されたなら自分は何も悪くない。','事実から逃げている']]
    },
    {
      level: 4, event: '長く育ててきた企画が白紙になった。', anchor: '積み上げが形にならない痛さはある。それでもゼロではない。',
      good: [
        ['作った知識・資料・判断経験までは消えない。','remain'], ['最初から選び直せる余白が戻った。','chance'], ['どこで止まったかは次の企画の設計情報になる。','learn'], ['今すぐ再利用できる部分だけ切り出せる。','next'], ['一年後には別の形で使っているかもしれない。','time'], ['制約が増えたなら小さな実験に縮められる。','constraint']
      ],
      bad: [['白紙なら今までの時間は完全に無意味だった。','全か無か思考'], ['白紙になったこと自体が最高の結果だ。','損失の否定']]
    },
    {
      level: 4, event: '努力した大会で予選落ちした。', anchor: '悔しい。その悔しさと、経験の価値は同時に存在できる。',
      good: [
        ['準備で身についた技術は残っている。','remain'], ['本番で崩れた条件を具体的に分析できる。','learn'], ['次回までの練習テーマを1つ決められる。','next'], ['一大会の結果が競技人生全部ではない。','time'], ['勝った人のやり方を観察する機会ができた。','other'], ['限られた練習時間なら弱点1つに絞れる。','constraint']
      ],
      bad: [['負けたから出場した意味はゼロ。','全か無か思考'], ['審判や環境が全部悪かった。','他責にしている']]
    },
    {
      level: 4, event: '長く続けた店を閉めることになった。', anchor: '失うものは大きい。だからこそ、軽く言い換えずに残るものを見る。',
      good: [
        ['積み上げた技術や顧客理解は自分に残る。','remain'], ['次は違う規模・形でやる選択肢もある。','chance'], ['閉店までに次へ持っていく資産を選べる。','next'], ['うまくいかなかった条件は次の判断材料になる。','learn'], ['店が終わってもそこで築いた関係まで全部消えるわけではない。','other'], ['今は大きくても数年後の意味は変わっているかもしれない。','time']
      ],
      bad: [['閉店できるなんて最高、損失は何もない。','損失の否定'], ['閉店は周りの客が来なかったせいだけだ。','他責にしている']]
    },
    {
      level: 4, event: '目標にしていた計画をゼロからやり直すことになった。', anchor: 'やり直しは負担。それでも「経験を持ったゼロ」は最初のゼロと違う。',
      good: [
        ['一度やった経験は残っている。','remain'], ['最初より不要な工程を削れる。','learn'], ['今の条件に合わせて選び直せる。','chance'], ['次の一手を最小単位に分けられる。','next'], ['制約が明確になったぶん小さく試せる。','constraint'], ['今日のやり直しも長い時間軸では一地点になる。','time']
      ],
      bad: [['やり直しになったなら前の努力は全部ゼロ。','全か無か思考'], ['計画が壊れたのは運が悪いだけで改善点はない。','学びを拒否している']]
    }
  ];

  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const state = {
    round: 0,
    score: 0,
    views: 0,
    taps: 0,
    goodTaps: 0,
    timer: 10,
    timerHandle: null,
    current: null,
    pickedLenses: [],
    lensCounts: {},
    usedScenarioIndexes: new Set(),
    roundGood: 0,
    roundBad: 0,
    roundStartedAt: 0,
    locked: false
  };

  const storage = loadStorage();

  function loadStorage() {
    try {
      return JSON.parse(localStorage.getItem('viewpointExamStats')) || { bestScore: 0, totalViews: 0, bestRank: '未受検' };
    } catch (_) { return { bestScore: 0, totalViews: 0, bestRank: '未受検' }; }
  }

  function saveStorage(data) {
    try { localStorage.setItem('viewpointExamStats', JSON.stringify(data)); } catch (_) {}
  }

  function showScreen(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function difficultyForRound(roundIndex) {
    if (roundIndex <= 2) return 1;
    if (roundIndex <= 5) return 2;
    if (roundIndex <= 8) return 3;
    return 4;
  }

  function levelName(level) { return ['','初級','中級','上級','達人級'][level]; }

  function pickScenario(level) {
    const pool = SCENARIOS.map((s,i)=>({s,i})).filter(x => x.s.level === level && !state.usedScenarioIndexes.has(x.i));
    const fallback = SCENARIOS.map((s,i)=>({s,i})).filter(x => x.s.level === level);
    const chosen = shuffle(pool.length ? pool : fallback)[0];
    state.usedScenarioIndexes.add(chosen.i);
    return chosen.s;
  }

  function startGame() {
    clearInterval(state.timerHandle);
    Object.assign(state, {
      round: 0, score: 0, views: 0, taps: 0, goodTaps: 0, timer: 10,
      current: null, pickedLenses: [], lensCounts: {}, usedScenarioIndexes: new Set(),
      roundGood: 0, roundBad: 0, locked: false
    });
    $('score').textContent = '0';
    showScreen('screen-game');
    beginRound();
  }

  function beginRound() {
    clearInterval(state.timerHandle);
    state.round += 1;
    state.timer = 10;
    state.roundGood = 0;
    state.roundBad = 0;
    state.pickedLenses = [];
    state.locked = false;

    const level = difficultyForRound(state.round - 1);
    state.current = pickScenario(level);
    $('round-number').textContent = state.round;
    $('difficulty-badge').textContent = levelName(level);
    $('event-text').textContent = state.current.event;
    $('event-anchor').textContent = state.current.anchor;
    $('view-count').textContent = '0';
    $('combo-number').textContent = '×0';
    $('combo-label').textContent = '見方を拾え';
    $('timer-text').textContent = '10.0';
    $('timer-bar').style.width = '100%';

    renderOptions();
    state.roundStartedAt = performance.now();
    state.timerHandle = setInterval(tick, 50);
  }

  function renderOptions() {
    const options = [
      ...state.current.good.map(([text,lens]) => ({ text, lens, good: true })),
      ...state.current.bad.map(([text,reason]) => ({ text, reason, good: false }))
    ];
    const container = $('options');
    container.innerHTML = '';
    shuffle(options).forEach((opt, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-card';
      button.dataset.index = String(idx);
      button.innerHTML = `<span class="option-text"></span><span class="lens-label">　</span>`;
      button.querySelector('.option-text').textContent = opt.text;
      button.addEventListener('click', () => pickOption(button, opt));
      container.appendChild(button);
    });
  }

  function pickOption(button, opt) {
    if (state.locked || button.disabled) return;
    button.disabled = true;
    state.taps += 1;

    if (opt.good) {
      state.goodTaps += 1;
      state.roundGood += 1;
      state.views += 1;
      state.pickedLenses.push(opt.lens);
      state.lensCounts[opt.lens] = (state.lensCounts[opt.lens] || 0) + 1;
      const diversity = new Set(state.pickedLenses).size;
      const speedBonus = Math.round(Math.max(0, state.timer) * 7);
      const diversityBonus = diversity * 18;
      state.score += 100 + speedBonus + diversityBonus;
      button.classList.add('good-picked');
      button.querySelector('.lens-label').textContent = `✓ ${LENSES[opt.lens].short}`;
      $('combo-label').textContent = diversity >= 5 ? '視点が広がっている' : diversity >= 3 ? '違う型がつながった' : 'GOOD VIEW';
      pulseViewMeter();
      haptic(18);
      tone(520 + diversity * 55, 0.045);
    } else {
      state.roundBad += 1;
      state.score = Math.max(0, state.score - 80);
      state.timer = Math.max(0, state.timer - 1.25);
      button.classList.add('bad-picked');
      button.querySelector('.lens-label').textContent = `× ${opt.reason}`;
      $('combo-label').textContent = 'それは見方を増やしていない';
      haptic([25,30,25]);
      tone(170, 0.07);
    }

    $('score').textContent = state.score.toLocaleString('ja-JP');
    $('view-count').textContent = state.roundGood;
    $('combo-number').textContent = `×${new Set(state.pickedLenses).size}`;
  }

  function pulseViewMeter() {
    const el = $('view-count');
    el.animate([{transform:'scale(1)'},{transform:'scale(1.28)'},{transform:'scale(1)'}], {duration:220, easing:'ease-out'});
  }

  function tick() {
    state.timer = Math.max(0, state.timer - 0.05);
    $('timer-text').textContent = state.timer.toFixed(1);
    $('timer-bar').style.width = `${state.timer * 10}%`;
    if (state.timer <= 0) finishRound();
  }

  function finishRound() {
    if (state.locked) return;
    state.locked = true;
    clearInterval(state.timerHandle);
    [...document.querySelectorAll('.option-card')].forEach(b => b.disabled = true);
    if (state.roundGood >= 5 && state.roundBad === 0) state.score += 300;

    const unique = [...new Set(state.pickedLenses)];
    $('round-result-burst').textContent = `${state.roundGood} VIEW!`;
    $('round-result-title').textContent = state.roundGood >= 5 ? 'VIEW RUSH!' : state.roundGood >= 3 ? 'ROUND CLEAR' : 'KEEP TRAINING';
    $('round-result-event').textContent = state.current.event;
    $('round-result-copy').textContent = roundCopy(state.roundGood, state.roundBad);

    const tagBox = $('lens-tags');
    tagBox.innerHTML = '';
    if (unique.length) {
      unique.forEach(key => {
        const tag = document.createElement('span');
        tag.className = 'lens-tag';
        tag.textContent = LENSES[key].name;
        tagBox.appendChild(tag);
      });
    } else {
      const tag = document.createElement('span');
      tag.className = 'lens-tag';
      tag.textContent = '次は1つ拾えばOK';
      tagBox.appendChild(tag);
    }

    const missed = state.current.good.find(([,lens]) => !unique.includes(lens));
    $('missed-box').classList.toggle('hidden', !missed);
    if (missed) $('missed-example').textContent = `${missed[0]}（${LENSES[missed[1]].name}）`;

    $('next-round').textContent = state.round >= 10 ? '結果を見る' : '次の問題へ';
    showScreen('screen-round');
  }

  function roundCopy(good, bad) {
    if (good >= 5 && bad === 0) return '事実を消さずに、複数の意味を同時に持てています。速さだけでなく「型の違い」が強さ。';
    if (good >= 4) return bad ? '見方は十分に広がっています。ハズレは「前向き」ではなく、事実否定や決めつけだった点に注目。' : '1つの出来事に複数の意味を持てています。この反復が反射になります。';
    if (good >= 2) return '別の見方は作れています。次は、似た言い換えより違う「型」を拾うと一気に強くなります。';
    return '最初は1つ見つかれば十分。嫌な出来事を消さず、「それ以外に何が残っている？」から始めます。';
  }

  function nextRound() {
    if (state.round >= 10) showResult();
    else { showScreen('screen-game'); beginRound(); }
  }

  function showResult() {
    clearInterval(state.timerHandle);
    const accuracy = state.taps ? Math.round((state.goodTaps / state.taps) * 100) : 0;
    const uniqueCount = Object.keys(state.lensCounts).length;
    const rank = rankFor(state.score, state.views, accuracy, uniqueCount);

    $('rank-name').textContent = rank.name;
    $('result-level').textContent = rank.copy;
    $('final-score').textContent = state.score.toLocaleString('ja-JP');
    $('final-views').textContent = state.views;
    $('final-accuracy').textContent = `${accuracy}%`;

    const sorted = Object.keys(LENSES).sort((a,b)=>(state.lensCounts[b]||0)-(state.lensCounts[a]||0));
    renderGrowth('strong-lenses', sorted.slice(0,3));
    renderGrowth('weak-lenses', [...sorted].reverse().slice(0,3));

    storage.bestScore = Math.max(storage.bestScore || 0, state.score);
    storage.totalViews = (storage.totalViews || 0) + state.views;
    if (rank.value > rankValue(storage.bestRank)) storage.bestRank = rank.name;
    saveStorage(storage);
    updateHomeStats();
    showScreen('screen-result');
  }

  function renderGrowth(id, keys) {
    const box = $(id); box.innerHTML='';
    keys.forEach(key=>{
      const el=document.createElement('span');
      el.className='growth-chip';
      el.textContent=`${LENSES[key].short} ${state.lensCounts[key]||0}`;
      box.appendChild(el);
    });
  }

  function rankFor(score, views, accuracy, unique) {
    if (score >= 9000 && views >= 43 && accuracy >= 88 && unique >= 9) return {name:'意味選びの達人',copy:'意味を自分で選べる。',value:4};
    if (score >= 6500 && views >= 34 && accuracy >= 78 && unique >= 7) return {name:'多視点の上級者',copy:'複数の意味を同時に持てる。',value:3};
    if (score >= 4200 && views >= 24 && accuracy >= 68) return {name:'別解の中級者',copy:'「別の意味」が自然に見え始めている。',value:2};
    return {name:'見方の初心者',copy:'まず1つ、別の意味を探せるところから。',value:1};
  }

  function rankValue(name) {
    if (name === '意味選びの達人') return 4;
    if (name === '多視点の上級者') return 3;
    if (name === '別解の中級者') return 2;
    if (name === '見方の初心者') return 1;
    return 0;
  }

  function updateHomeStats() {
    $('best-score').textContent = storage.bestScore ? storage.bestScore.toLocaleString('ja-JP') : '—';
    $('total-views').textContent = storage.totalViews || 0;
    $('best-rank').textContent = storage.bestRank || '未受検';
  }

  function renderDictionary() {
    const box = $('dictionary-list');
    box.innerHTML = '';
    Object.entries(LENSES).forEach(([key,lens],i)=>{
      const el = document.createElement('article');
      el.className='dictionary-item';
      el.innerHTML=`<div class="dictionary-item-head"><strong>${i+1}. ${lens.name}</strong><code>${key.toUpperCase()}</code></div><p>${lens.guide}</p><em>${lens.example}</em>`;
      box.appendChild(el);
    });
  }

  function openDialog(id) {
    const d=$(id); if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open','');
  }

  function closeDialog(id) { const d=$(id); if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }

  function haptic(pattern) { try { navigator.vibrate?.(pattern); } catch (_) {} }
  let audioCtx = null;
  function tone(freq, duration) {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.value=freq; g.gain.value=.028; o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.stop(audioCtx.currentTime+duration);
    } catch (_) {}
  }

  $('start-game').addEventListener('click', startGame);
  $('retry-game').addEventListener('click', startGame);
  $('next-round').addEventListener('click', nextRound);
  $('quit-game').addEventListener('click', () => { clearInterval(state.timerHandle); showScreen('screen-home'); });
  $('back-home').addEventListener('click', () => showScreen('screen-home'));
  $('open-howto').addEventListener('click', () => openDialog('howto-dialog'));
  $('open-dictionary-home').addEventListener('click', () => openDialog('dictionary-dialog'));
  $('open-dictionary-result').addEventListener('click', () => openDialog('dictionary-dialog'));
  document.querySelectorAll('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => closeDialog(btn.dataset.closeDialog)));
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', (e) => { if (e.target === d) closeDialog(d.id); }));

  renderDictionary();
  updateHomeStats();
})();
