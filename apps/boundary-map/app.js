(() => {
  'use strict';

  const STORAGE_KEY = 'hitobito-boundary-map-v1';
  const DRAG_THRESHOLD = 88;

  const AXES = [
    { id: 'time', label: '時間の境界線', short: '時間', color: '#ffb454' },
    { id: 'money', label: 'お金の境界線', short: 'お金', color: '#63e6be' },
    { id: 'emotion', label: '感情の境界線', short: '感情', color: '#ff8fb1' },
    { id: 'values', label: '価値観の境界線', short: '価値観', color: '#7fb2ff' },
  ];
  const AXIS_ORDER = ['time', 'money', 'emotion', 'values'];

  const TIME_CARDS = [
    { id: 't1', axis: 'time', scene: '友人から夜21時に電話がかかってきて、そのまま1時間、恋愛相談を聞くことになりそう。', ask: '今から少しだけ聞いてほしいんだけど、いい?', acceptNote: '「少しだけ」が延びやすいのは、時間の境界線が薄いサイン。延びた分は自分の時間から出ている。', declineNote: '「今日は無理だけど、明日の昼なら」と時間を区切って渡すのも、断るの一形態。' },
    { id: 't2', axis: 'time', scene: '上司から金曜17時半に「月曜までにこれ」と、就業後にかかる作業を頼まれた。', ask: '悪いけど、月曜の朝一で欲しいんだよね。', acceptNote: '緊急度を確認せず引き受けると、「頼めば動く人」として次回も同じ時間帯に頼まれやすくなる。', declineNote: '「本当に朝一で必要か」を確認するだけでも、時間の主導権は自分に戻る。' },
    { id: 't3', axis: 'time', scene: '職場の飲み会LINEで「幹事だから来てね」と、気が進まない集まりに誘われた。', ask: '全員来る予定だから、来てくれるよね?', acceptNote: '「みんな来るから」は理由になっていても、あなたの予定の代わりにはならない。', declineNote: '毎回ではなく今回だけ断ることに、長い説明はほとんどいらない。' },
    { id: 't4', axis: 'time', scene: '後輩から「ちょっとだけ教えてください」と聞かれ、気づけば1時間、自分の作業が止まっている。', ask: 'あと少しだけ、ここも見てもらえますか?', acceptNote: '「ちょっとだけ」の見積もりが毎回外れるなら、時間を区切って渡す練習が要る。', declineNote: '「あと10分だけ」と区切ってから続けると、無限に延びるのを防げる。' },
    { id: 't5', axis: 'time', scene: '家族から「ついでにこれも」と、外出のたびに用事が積み増しされる。', ask: '出るならこれも、あれもお願いできる?', acceptNote: '「ついで」が積み重なると、自分の外出の目的が家族の用事に置き換わっていく。', declineNote: '「今日はこれだけ」と先に伝えておくと、積み増しを防ぎやすい。' },
  ];

  const MONEY_CARDS = [
    { id: 'm1', axis: 'money', scene: '友人から「来月には絶対返すから」と、3回目になる少額の借金を頼まれた。', ask: '今月だけ厳しくて、来月には返すから。', acceptNote: '「来月には」が3回続いているなら、それは次のお願いの前振りになっている可能性がある。', declineNote: '断る理由を細かく説明しなくても、「それはできない」は完結した返事になる。' },
    { id: 'm2', axis: 'money', scene: 'グループ旅行の精算で「きりのいい数字で」と、自分の支払い分より多めの割り勘を提案された。', ask: '細かい端数は面倒だから、多めに出せる人が出そうよ。', acceptNote: '「多めに出せる人」にされた瞬間、実際の支払い額と離れた基準で払うことになる。', declineNote: '「実費で割ろう」と一言添えるだけで、基準を事実に戻せる。' },
    { id: 'm3', axis: 'money', scene: '後輩との飲みで「先輩だから今日は」と、支払いを促す空気が流れた。', ask: '今日は先輩がごちそうしてくれるんですよね?', acceptNote: '毎回ではなく今日だけと決めていないなら、それは「先輩は払うもの」という前提を強化する。', declineNote: '「今日は割り勘で」は、関係を壊す一言ではない。' },
    { id: 'm4', axis: 'money', scene: '親から「少しでいいから」と、数ヶ月おきに援助を頼まれている。', ask: '今月だけ厳しくて、少しでいいから助けてくれる?', acceptNote: '「少しでいい」が繰り返されるなら、金額より頻度を先に見る必要がある。', declineNote: '「今回は難しい」と、金額の相談の前に伝えることもできる。' },
    { id: 'm5', axis: 'money', scene: '同僚の送別会の会費が「みんな多めに包もう」と、事前確認なしに引き上げられた。', ask: '今回はお世話になった人だから、多めに集めることにしたから。', acceptNote: '決定後に伝えられた金額をそのまま受け入れると、次回も事後承諾が通ってしまう。', declineNote: '「次からは事前に相談してほしい」は、今回の関係を壊さずに言える。' },
  ];

  const EMOTION_CARDS = [
    { id: 'e1', axis: 'emotion', scene: '友人から「あなたにしか話せない」と、2時間、同じ愚痴を繰り返し聞かされている。', ask: '本当にあなたにしか話せないから、もう少し聞いて。', acceptNote: '「あなたにしか」は感情を預けるための言葉で、あなたが唯一の受け皿である必要はない。', declineNote: '「聞くのはここまでにして、続きは他の人にも」と渡せる。' },
    { id: 'e2', axis: 'emotion', scene: 'パートナーが不機嫌な理由を、話す前から自分のせいだと決めつけられた。', ask: 'なんでそんな態度なの、あなたのせいでしょ。', acceptNote: '相手の機嫌の理由をすべて引き受けると、原因を確認する前に謝る癖がつく。', declineNote: '「何があったか教えて」と事実を先に聞くだけでも、責任の引き受けすぎを防げる。' },
    { id: 'e3', axis: 'emotion', scene: '家族の機嫌を直すために、自分の予定をその場でキャンセルしそうになっている。', ask: '今日は家にいてよ、機嫌悪いんだから。', acceptNote: '機嫌を直す責任を毎回引き受けると、相手は不機嫌を使って予定を変えさせる方法を覚える。', declineNote: '「今日は出かけるけど、帰ったら話そう」と両立できることもある。' },
    { id: 'e4', axis: 'emotion', scene: '同僚のミスを、自分の評価を使ってかばうよう頼まれた。', ask: '私のミスにしないで、フォローしてくれるよね。', acceptNote: '毎回かばうと、相手のミスの責任があなたの評価の中に積み上がっていく。', declineNote: '「今回は事実として報告するね」は、関係を切る言葉ではない。' },
    { id: 'e5', axis: 'emotion', scene: '恋人の不安を、常に自分が言葉で解消しないといけない空気になっている。', ask: 'また不安になってきた、大丈夫だって言って。', acceptNote: '相手の不安をゼロにする責任を引き受け続けると、あなたの言葉の効果が下がっていく。', declineNote: '「大丈夫」と言うことと、相手の不安を管理する責任を持つことは別。' },
  ];

  const VALUES_CARDS = [
    { id: 'v1', axis: 'values', scene: '自分のやり方を「普通はこうするでしょ」と否定された。', ask: '普通そんなやり方しないよね、変えたら?', acceptNote: '「普通」は多数派の言い換えであって、あなたのやり方が間違っている根拠ではない。', declineNote: '「これは自分に合っているやり方」とだけ返せば十分。' },
    { id: 'v2', axis: 'values', scene: '子育てやお金の使い方について、意見の違いを長時間説得され続けている。', ask: 'それは違うと思う、ちゃんと考え直した方がいい。', acceptNote: '説得され続けて折れると、次も同じテーマで長時間の説得が繰り返される。', declineNote: '「考えは聞いた、でも今のやり方を続ける」で会話を終えられる。' },
    { id: 'v3', axis: 'values', scene: '気が進まない飲み会に「みんな行くから」と誘われている。', ask: 'みんな行くのに、あなただけ行かないの?', acceptNote: '「みんな」の中に、実際に強く行きたい人が何人いるかは確認されていない。', declineNote: '「今回はパス」は、関係が終わる言葉ではない。' },
    { id: 'v4', axis: 'values', scene: '望んでいない進路や選択を「あなたのためだから」と勧められている。', ask: 'あなたのために言ってるんだから、聞いた方がいい。', acceptNote: '「あなたのため」という前置きは、選ぶ責任の所在をわかりにくくする。', declineNote: '「心配してくれてありがとう、でも自分で決める」は両立できる。' },
    { id: 'v5', axis: 'values', scene: 'SNSでの発言について、「それはおかしい」と価値観を否定するコメントが続いている。', ask: 'その考え方はさすがにおかしいと思う。', acceptNote: 'すべてのコメントに説明責任を感じ始めると、発言そのものをやめたくなっていく。', declineNote: '反応するかどうかも選べる。無視も、境界線の一形態。' },
  ];

  const ALL_CARDS = [];
  for (let i = 0; i < 5; i += 1) {
    ALL_CARDS.push(TIME_CARDS[i], MONEY_CARDS[i], EMOTION_CARDS[i], VALUES_CARDS[i]);
  }

  const CARDS_BY_AXIS = { time: TIME_CARDS, money: MONEY_CARDS, emotion: EMOTION_CARDS, values: VALUES_CARDS };

  const TYPES = {
    timeStolen: { id: 'timeStolen', title: '時間吸われ型', desc: '頼まれた瞬間の「少しだけ」を信じやすく、気づくと自分の時間が他人の予定で埋まっている。', rule: '引き受ける前に「いつまで」を先に決める。時間を区切ってから引き受ければ、延びるのを防げる。' },
    moneyLoose: { id: 'moneyLoose', title: 'お財布ゆるみ型', desc: '「来月には」「少しでいいから」に弱く、金額より人間関係を優先して財布を開きやすい。', rule: '同じ頼みが2回続いたら、3回目の前に「次からは難しい」と先に言っておく。' },
    emotionCarrier: { id: 'emotionCarrier', title: '感情引き受け型', desc: '相手の機嫌や不安の責任を、自分のことのように引き受けやすい。', rule: '相手の感情の理由を確認する前に謝らない。まず「何があったか教えて」と聞く。' },
    valuesBlend: { id: 'valuesBlend', title: '合わせすぎ型', desc: '「普通は」「みんなは」に押されやすく、自分の考えより場の空気を優先しやすい。', rule: '説得に対しては「考えは聞いた」とだけ返し、その場で結論を変えない。' },
    solidBoundary: { id: 'solidBoundary', title: '境界線しっかり型', desc: 'どの領域でも、引き受ける前に一度立ち止まって判断できている。', rule: '強すぎる境界線が孤立に傾いていないか、時々だけ確認する。' },
    fullyOpen: { id: 'fullyOpen', title: 'まるごと明け渡し型', desc: '時間・お金・感情・価値観のどこでも、相手の要求をそのまま受け止めやすい。', rule: 'まず一つの領域だけ、今日から「少し考えさせて」と言う練習をする。' },
  };

  function loadStoredState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { totalSessions: 0, lastSession: null, shares: 0 };
      const parsed = JSON.parse(raw);
      return {
        totalSessions: typeof parsed.totalSessions === 'number' ? parsed.totalSessions : 0,
        lastSession: parsed.lastSession || null,
        shares: typeof parsed.shares === 'number' ? parsed.shares : 0,
      };
    } catch {
      return { totalSessions: 0, lastSession: null, shares: 0 };
    }
  }

  function writeStoredState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage is optional.
    }
  }

  function computeAxisRates(choices, cards) {
    const rates = { time: 0, money: 0, emotion: 0, values: 0 };
    for (const axis of AXIS_ORDER) {
      const axisCards = cards.filter((card) => card.axis === axis);
      if (axisCards.length === 0) continue;
      const declined = axisCards.filter((card) => choices[card.id] === 'decline').length;
      rates[axis] = Math.round((declined / axisCards.length) * 100);
    }
    return rates;
  }

  function pickType(axisRates) {
    const values = AXIS_ORDER.map((axis) => axisRates[axis]);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (average >= 75) return TYPES.solidBoundary;
    if (average <= 25) return TYPES.fullyOpen;

    let weakestAxis = AXIS_ORDER[0];
    let weakestRate = axisRates[weakestAxis];
    for (const axis of AXIS_ORDER) {
      if (axisRates[axis] < weakestRate) {
        weakestAxis = axis;
        weakestRate = axisRates[axis];
      }
    }
    if (weakestAxis === 'time') return TYPES.timeStolen;
    if (weakestAxis === 'money') return TYPES.moneyLoose;
    if (weakestAxis === 'emotion') return TYPES.emotionCarrier;
    return TYPES.valuesBlend;
  }

  function findWeakestAxis(axisRates) {
    let weakest = AXIS_ORDER[0];
    let weakestRate = axisRates[weakest];
    for (const axis of AXIS_ORDER) {
      if (axisRates[axis] < weakestRate) {
        weakest = axis;
        weakestRate = axisRates[axis];
      }
    }
    return weakest;
  }

  function axisLabel(axisId) {
    const meta = AXES.find((item) => item.id === axisId);
    return meta ? meta.label : axisId;
  }

  function axisShort(axisId) {
    const meta = AXES.find((item) => item.id === axisId);
    return meta ? meta.short : axisId;
  }

  function gapMessage(selfRating, acceptanceRate) {
    const diff = acceptanceRate - selfRating;
    if (diff >= 15) {
      return `自己申告(${selfRating})より、実際の引き受けやすさ(${acceptanceRate})の方が高かった。自分が思うより、頼まれると流されやすい。`;
    }
    if (diff <= -15) {
      return `自己申告(${selfRating})ほどには、実際の引き受けやすさ(${acceptanceRate})は高くなかった。思っているより、断れている。`;
    }
    return `自己申告(${selfRating})と、実際の引き受けやすさ(${acceptanceRate})はほぼ一致していた。自己認識どおりの傾向。`;
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    let cursorY = y;
    for (const char of text) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, cursorY);
        line = char;
        cursorY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
    return cursorY;
  }

  function buildShareImage(canvas, type, axisRates) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0d0f12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffb454';
    ctx.font = '900 28px Arial';
    ctx.fillText('HITOBITO / LEVEL UP', 64, 96);

    ctx.fillStyle = '#8f98a6';
    ctx.font = '900 22px Arial';
    ctx.fillText('境界線マップ', 64, 140);

    ctx.fillStyle = '#f4f0e6';
    ctx.font = '950 78px Arial';
    drawWrappedText(ctx, type.title, 64, 250, canvas.width - 128, 86);

    ctx.fillStyle = '#d7dde5';
    ctx.font = '700 32px Arial';
    const descBottom = drawWrappedText(ctx, type.desc, 64, 380, canvas.width - 128, 46);

    let barY = Math.max(descBottom + 40, 470);
    const barLeft = 64;
    const barWidth = canvas.width - 128 - 180;
    for (const axis of AXIS_ORDER) {
      const meta = AXES.find((item) => item.id === axis);
      const rate = axisRates[axis];

      ctx.fillStyle = '#c6ccd5';
      ctx.font = '850 28px Arial';
      ctx.fillText(meta.short, barLeft, barY - 12);

      ctx.fillStyle = '#1c2027';
      ctx.fillRect(barLeft + 130, barY - 28, barWidth, 32);

      ctx.fillStyle = meta.color;
      ctx.fillRect(barLeft + 130, barY - 28, (barWidth * rate) / 100, 32);

      ctx.fillStyle = '#f4f0e6';
      ctx.font = '850 26px Arial';
      ctx.fillText(String(rate), barLeft + 130 + barWidth + 16, barY - 4);

      barY += 66;
    }

    ctx.fillStyle = '#ffb454';
    ctx.font = '900 26px Arial';
    drawWrappedText(ctx, type.rule, 64, barY + 46, canvas.width - 128, 40);

    ctx.fillStyle = '#5c6470';
    ctx.font = '800 24px Arial';
    ctx.fillText('levelup.hitobito.jp/apps/boundary-map/', 64, canvas.height - 56);
  }

  // --- State ---
  let mode = 'main'; // 'main' | 'weak'
  let weakAxis = null;
  let selfRating = 50;
  let deck = ALL_CARDS;
  let runIndex = 0;
  let runChoices = {};
  let pendingChoice = null;
  let mainAxisRates = null;
  let mainType = null;
  let previousSession = null;
  let totalSessions = 0;

  const dragState = { active: false, startX: 0, dragX: 0 };

  // --- DOM ---
  const screens = document.querySelectorAll('.screen');
  const sessionCountEl = document.getElementById('sessionCount');
  const axisLegendEl = document.getElementById('axisLegend');
  const selfRateInput = document.getElementById('selfRateInput');
  const selfRateValue = document.getElementById('selfRateValue');
  const startMainBtn = document.getElementById('startMainBtn');

  const progressLabel = document.getElementById('progressLabel');
  const progressCount = document.getElementById('progressCount');
  const progressBarFill = document.getElementById('progressBarFill');
  const card = document.getElementById('card');
  const cardHintAccept = document.getElementById('cardHintAccept');
  const cardHintDecline = document.getElementById('cardHintDecline');
  const cardAxis = document.getElementById('cardAxis');
  const cardScene = document.getElementById('cardScene');
  const cardAsk = document.getElementById('cardAsk');
  const declineBtn = document.getElementById('declineBtn');
  const acceptBtn = document.getElementById('acceptBtn');
  const insight = document.getElementById('insight');
  const nextBtn = document.getElementById('nextBtn');

  const typeTitle = document.getElementById('typeTitle');
  const typeDesc = document.getElementById('typeDesc');
  const axisBars = document.getElementById('axisBars');
  const gapBox = document.getElementById('gapBox');
  const compareBox = document.getElementById('compareBox');
  const ruleText = document.getElementById('ruleText');
  const shareBtn = document.getElementById('shareBtn');
  const shareFeedback = document.getElementById('shareFeedback');
  const sharePreview = document.getElementById('sharePreview');
  const shareCanvas = document.getElementById('shareCanvas');
  const weakBlock = document.getElementById('weakBlock');
  const weakBlockText = document.getElementById('weakBlockText');
  const weakRetakeBtn = document.getElementById('weakRetakeBtn');
  const miniResult = document.getElementById('miniResult');
  const miniResultText = document.getElementById('miniResultText');
  const restartMainBtn = document.getElementById('restartMainBtn');
  const backHomeBtn = document.getElementById('backHomeBtn');

  function pulse() {
    if (navigator.vibrate) navigator.vibrate(14);
  }

  function showScreen(name) {
    screens.forEach((section) => {
      section.classList.toggle('active', section.dataset.screen === name);
    });
    window.scrollTo(0, 0);
  }

  function renderAxisLegend() {
    axisLegendEl.innerHTML = '';
    for (const axis of AXES) {
      const div = document.createElement('div');
      div.className = 'axis-legend-item';
      div.innerHTML = `<span>${axis.short}</span><strong>${axis.label}</strong>`;
      axisLegendEl.appendChild(div);
    }
  }

  function updateSessionCount() {
    sessionCountEl.textContent = `${totalSessions} SESSIONS`;
  }

  function startMain() {
    mode = 'main';
    weakAxis = null;
    deck = ALL_CARDS;
    runIndex = 0;
    runChoices = {};
    pendingChoice = null;
    shareFeedback.textContent = '';
    sharePreview.hidden = true;
    showScreen('swipe');
    renderCard();
  }

  function startWeakRetake(axis) {
    mode = 'weak';
    weakAxis = axis;
    deck = CARDS_BY_AXIS[axis];
    runIndex = 0;
    runChoices = {};
    pendingChoice = null;
    showScreen('swipe');
    renderCard();
  }

  function renderCard() {
    const currentCard = deck[runIndex];
    progressLabel.textContent = mode === 'weak' ? 'WEAK POINT PRACTICE' : '20 REQUESTS';
    progressCount.textContent = `${runIndex + 1} / ${deck.length}`;
    progressBarFill.style.width = `${(runIndex / deck.length) * 100}%`;

    cardAxis.textContent = axisLabel(currentCard.axis);
    cardScene.textContent = currentCard.scene;
    cardAsk.textContent = currentCard.ask;

    dragState.dragX = 0;
    card.style.transform = 'translateX(0px) rotate(0deg)';
    cardHintAccept.style.opacity = '0';
    cardHintDecline.style.opacity = '0';

    insight.hidden = true;
    insight.textContent = '';
    nextBtn.hidden = true;
    declineBtn.disabled = false;
    acceptBtn.disabled = false;
  }

  function chooseCurrent(choice) {
    if (pendingChoice) return;
    const currentCard = deck[runIndex];
    pendingChoice = choice;
    runChoices[currentCard.id] = choice;
    declineBtn.disabled = true;
    acceptBtn.disabled = true;
    card.style.transform = `translateX(${choice === 'accept' ? DRAG_THRESHOLD : -DRAG_THRESHOLD}px) rotate(${(choice === 'accept' ? DRAG_THRESHOLD : -DRAG_THRESHOLD) / 18}deg)`;
    insight.hidden = false;
    insight.textContent = choice === 'accept' ? currentCard.acceptNote : currentCard.declineNote;
    nextBtn.hidden = false;
    nextBtn.textContent = runIndex + 1 === deck.length ? '結果を見る →' : '次へ →';
    pulse();
  }

  function goNext() {
    if (!pendingChoice) return;
    pendingChoice = null;
    if (runIndex + 1 >= deck.length) {
      if (mode === 'main') finishMainRun();
      else finishWeakRun();
      return;
    }
    runIndex += 1;
    renderCard();
  }

  function finishMainRun() {
    mainAxisRates = computeAxisRates(runChoices, ALL_CARDS);
    mainType = pickType(mainAxisRates);

    const stored = loadStoredState();
    previousSession = stored.lastSession;
    totalSessions = stored.totalSessions + 1;

    const record = {
      date: Date.now(),
      axisRates: mainAxisRates,
      selfRating,
      typeId: mainType.id,
    };
    writeStoredState({ totalSessions, lastSession: record, shares: stored.shares });
    updateSessionCount();
    renderResult();
    showScreen('result');
  }

  function finishWeakRun() {
    if (!weakAxis) return;
    const axisCards = CARDS_BY_AXIS[weakAxis];
    const declined = axisCards.filter((c) => runChoices[c.id] === 'decline').length;
    const weakRate = Math.round((declined / axisCards.length) * 100);
    const mainRate = mainAxisRates[weakAxis];
    miniResult.hidden = false;
    let comparison;
    if (weakRate > mainRate) comparison = '、この5問では少し踏みとどまれた。';
    else if (weakRate < mainRate) comparison = '、この5問ではより流されやすかった。';
    else comparison = '、ほぼ同じ結果だった。';
    miniResultText.textContent = `今回のこの領域だけの結果は ${weakRate} 。全体結果の ${mainRate} と比べて${comparison}`;
    showScreen('result');
  }

  function renderResult() {
    typeTitle.textContent = mainType.title;
    typeDesc.textContent = mainType.desc;
    ruleText.textContent = mainType.rule;

    axisBars.innerHTML = '';
    for (const axis of AXES) {
      const row = document.createElement('div');
      row.className = 'axis-bar-row';
      row.innerHTML = `
        <span class="axis-bar-label">${axis.short}</span>
        <div class="axis-bar-track"><div class="axis-bar-fill" style="width:${mainAxisRates[axis.id]}%;background:${axis.color}"></div></div>
        <span class="axis-bar-value">${mainAxisRates[axis.id]}</span>
      `;
      axisBars.appendChild(row);
    }

    const acceptanceRate = 100 - Math.round(AXIS_ORDER.reduce((sum, axis) => sum + mainAxisRates[axis], 0) / AXIS_ORDER.length);
    gapBox.textContent = gapMessage(selfRating, acceptanceRate);

    if (previousSession) {
      let biggestAxis = AXIS_ORDER[0];
      let biggestDiff = 0;
      for (const axis of AXIS_ORDER) {
        const diff = mainAxisRates[axis] - previousSession.axisRates[axis];
        if (Math.abs(diff) > Math.abs(biggestDiff)) {
          biggestDiff = diff;
          biggestAxis = axis;
        }
      }
      compareBox.hidden = false;
      if (biggestDiff === 0) {
        compareBox.textContent = '前回とほぼ同じ傾向だった。';
      } else {
        const direction = biggestDiff > 0 ? '守れる場面が増えた' : '今回はゆるみやすかった';
        compareBox.textContent = `前回から、${axisLabel(biggestAxis)}が${biggestDiff > 0 ? '+' : ''}${biggestDiff}pt。${direction}。`;
      }
    } else {
      compareBox.hidden = true;
      compareBox.textContent = '';
    }

    const weakest = findWeakestAxis(mainAxisRates);
    weakBlock.hidden = false;
    weakBlockText.textContent = `すり減りやすいのは「${axisLabel(weakest)}」。この領域だけ5問、もう一度確認できる。`;
    weakRetakeBtn.textContent = `${axisShort(weakest)}だけ再確認する`;
    weakRetakeBtn.onclick = () => startWeakRetake(weakest);
    miniResult.hidden = true;
    miniResultText.textContent = '';

    shareFeedback.textContent = '';
    sharePreview.hidden = true;
  }

  async function handleShare() {
    if (!mainType || !mainAxisRates) return;
    shareBtn.disabled = true;
    shareFeedback.textContent = '';
    try {
      buildShareImage(shareCanvas, mainType, mainAxisRates);
      const blob = await new Promise((resolve, reject) => {
        shareCanvas.toBlob((result) => (result ? resolve(result) : reject(new Error('failed to build image'))), 'image/png');
      });
      const file = new File([blob], 'boundary-map.png', { type: 'image/png' });
      const shareText = `わたしは「${mainType.title}」でした。 境界線マップ`;
      const shareUrl = 'https://levelup.hitobito.jp/apps/boundary-map/';

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: '境界線マップ', text: shareText, url: shareUrl });
        shareFeedback.textContent = '共有しました。';
      } else if (navigator.share) {
        await navigator.share({ title: '境界線マップ', text: shareText, url: shareUrl });
        shareFeedback.textContent = '共有しました。画像は下に表示したものを保存してください。';
        sharePreview.src = URL.createObjectURL(blob);
        sharePreview.hidden = false;
      } else {
        sharePreview.src = URL.createObjectURL(blob);
        sharePreview.hidden = false;
        shareFeedback.textContent = 'この端末では自動共有できません。画像を長押しで保存してシェアしてください。';
      }

      const stored = loadStoredState();
      writeStoredState({ ...stored, shares: stored.shares + 1 });
    } catch (error) {
      if (error && error.name === 'AbortError') {
        shareBtn.disabled = false;
        return;
      }
      shareFeedback.textContent = '共有に失敗しました。もう一度お試しください。';
    }
    shareBtn.disabled = false;
  }

  function restart() {
    mainAxisRates = null;
    mainType = null;
    previousSession = null;
    shareFeedback.textContent = '';
    sharePreview.hidden = true;
    showScreen('home');
  }

  // --- Pointer drag ---
  function onPointerDown(event) {
    if (pendingChoice) return;
    dragState.active = true;
    dragState.startX = event.clientX;
    card.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragState.active || pendingChoice) return;
    dragState.dragX = event.clientX - dragState.startX;
    card.style.transform = `translateX(${dragState.dragX}px) rotate(${dragState.dragX / 18}deg)`;
    card.style.transition = 'none';
    const acceptOpacity = Math.min(Math.max(dragState.dragX / DRAG_THRESHOLD, 0), 1);
    const declineOpacity = Math.min(Math.max(-dragState.dragX / DRAG_THRESHOLD, 0), 1);
    cardHintAccept.style.opacity = String(acceptOpacity);
    cardHintDecline.style.opacity = String(declineOpacity);
  }

  function endDrag() {
    if (!dragState.active) return;
    dragState.active = false;
    card.style.transition = 'transform .2s ease';
    if (pendingChoice) return;
    if (dragState.dragX > DRAG_THRESHOLD) chooseCurrent('accept');
    else if (dragState.dragX < -DRAG_THRESHOLD) chooseCurrent('decline');
    else {
      card.style.transform = 'translateX(0px) rotate(0deg)';
      cardHintAccept.style.opacity = '0';
      cardHintDecline.style.opacity = '0';
    }
  }

  // --- Wire up ---
  renderAxisLegend();
  const initialStored = loadStoredState();
  totalSessions = initialStored.totalSessions;
  updateSessionCount();

  selfRateInput.addEventListener('input', (event) => {
    selfRating = Number(event.target.value);
    selfRateValue.textContent = String(selfRating);
  });

  startMainBtn.addEventListener('click', startMain);
  declineBtn.addEventListener('click', () => chooseCurrent('decline'));
  acceptBtn.addEventListener('click', () => chooseCurrent('accept'));
  nextBtn.addEventListener('click', goNext);

  card.addEventListener('pointerdown', onPointerDown);
  card.addEventListener('pointermove', onPointerMove);
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointerleave', endDrag);
  card.addEventListener('pointercancel', endDrag);

  shareBtn.addEventListener('click', handleShare);
  restartMainBtn.addEventListener('click', startMain);
  backHomeBtn.addEventListener('click', restart);

  if (new URLSearchParams(location.search).get('test') === '1') {
    window.__boundaryMapTestHooks = { ALL_CARDS, computeAxisRates, pickType };
  }
})();
