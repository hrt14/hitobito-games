(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const storageKey = 'levelup-matomaru-v1';

  const cases = [
    {tag:'仕事',title:'売上が落ちている。',text:'先月より売上が18%減。アクセス数はほぼ同じ。商品ページの離脱率が上がり、レビューには「違いが分からない」が増えている。広告費は先月と同水準。',summary:'問題は集客量より、商品ページで価値が伝わっていないこと。',reason:'アクセスは減っていないのに離脱が増え、レビューでも違いが分からないと言われている。',next:'商品ページの訴求と比較表現を先に直してCVRを確認する。',wrong:['広告費をもっと増やすべき。','売上が18%減ったのでかなり危険。','レビュー返信を全部やる。']},
    {tag:'会議',title:'会議が長引いている。',text:'毎週60分の定例が90分を超える。議題は5つだが、最初の報告だけで40分使う。資料は会議中に初めて読む人が多く、決定事項は最後の10分に集中する。',summary:'会議時間の問題は、報告と意思決定が同じ場に混ざっていること。',reason:'資料の読み上げに時間を使い、決める時間が最後に追いやられている。',next:'報告は事前共有に移し、会議は意思決定する議題だけに絞る。',wrong:['会議を30分に設定し直す。','参加者の話が長い。','資料のデザインを整える。']},
    {tag:'企画',title:'新企画の反応が弱い。',text:'告知ページは公開済み。SNSでは閲覧されているが申込は少ない。ページ内で対象者が曖昧で、参加後に何が得られるかは後半まで読まないと分からない。',summary:'認知不足より、誰にどんな価値がある企画かが伝わっていない。',reason:'閲覧はあるのに申込が少なく、対象とベネフィットがページ上で弱い。',next:'ファーストビューで対象者と得られる価値を明示して反応を比べる。',wrong:['SNS投稿回数を倍にする。','申込フォームを短くする。','企画名を英語にする。']},
    {tag:'優先順位',title:'仕事が多すぎる。',text:'今日中の依頼が6件。うち2件は他部署待ち、1件は明日でも影響なし、2件は30分で終わる。残り1件だけが今日17時の意思決定に必要。',summary:'全部急ぎではなく、今日17時の判断に必要な1件が最優先。',reason:'他部署待ちや翌日でもよい仕事が混ざっており、締切影響があるのは1件だけ。',next:'17時の判断に必要な1件を先に終え、残りを待ち・後回しへ分ける。',wrong:['6件を上から順に片づける。','30分で終わる2件からやる。','全部今日中なので休憩しない。']},
    {tag:'チーム',title:'メンバーの進捗が遅い。',text:'担当者は毎日作業している。だが要件変更が週2回あり、そのたびに作り直し。依頼元は完成イメージを会議で追加している。担当者の作業時間自体は確保されている。',summary:'個人の作業速度より、途中の要件変更が手戻りを生んでいる。',reason:'作業時間はあるのに、週2回の変更で作り直しが発生している。',next:'着手前に要件を固定する確認点を設け、変更は次版へ回す。',wrong:['担当者に残業してもらう。','担当者のスキル不足を調べる。','毎日進捗会議を追加する。']},
    {tag:'EC',title:'広告は伸びたのに利益が減った。',text:'広告経由売上は30%増。広告費は70%増。新規客比率は高いが、割引クーポン利用も増えた。粗利率は先月より6pt低下。',summary:'売上拡大より、広告費と値引きで採算が悪化している。',reason:'広告費の伸びが売上を大きく上回り、粗利率も下がっている。',next:'売上ではなく粗利ベースで広告とクーポンの条件を見直す。',wrong:['広告経由売上が伸びているので成功。','新規客が多いのでさらに割引する。','商品数を増やす。']},
    {tag:'学習',title:'勉強しているのに覚えられない。',text:'毎日1時間、教科書を読んでいる。ノートもきれいにまとめている。ただし問題演習は週末だけで、翌日に思い出すテストはしていない。',summary:'勉強時間より、思い出す練習が少ないことが問題。',reason:'読む・まとめる時間は多い一方、問題演習と想起の回数が少ない。',next:'読む時間を減らし、毎日短い問題演習と翌日の想起を入れる。',wrong:['勉強時間を2時間に増やす。','もっときれいなノートを作る。','新しい参考書を買う。']},
    {tag:'生活',title:'朝いつも慌てる。',text:'家を出る時刻は毎日同じ。起床後に服を決め、バッグを準備し、充電ケーブルを探す。朝食時間は10分程度で一定。',summary:'起床時刻より、朝に判断と準備が残りすぎている。',reason:'時間がぶれるのは服・バッグ・持ち物を朝に決めている部分。',next:'服とバッグを前夜に固定し、朝の判断を減らす。',wrong:['30分早く起きる。','朝食を抜く。','もっと速く歩く。']},
    {tag:'プロジェクト',title:'締切前に毎回バタつく。',text:'最終締切は金曜。レビューは木曜午後に設定されることが多い。修正には平均4時間かかるが、木曜夜は別会議で埋まっている。',summary:'最終締切ではなく、修正時間を取れる最後の日が実質締切。',reason:'木曜レビュー後に必要な4時間を確保できない予定になっている。',next:'レビューを水曜までに前倒しし、修正時間を先に確保する。',wrong:['金曜朝に集中して修正する。','レビューを短くする。','締切を忘れないよう通知を増やす。']},
    {tag:'顧客',title:'問い合わせが増えた。',text:'新商品発売後、問い合わせ件数が2倍。内容の62%が初期設定方法。説明書には記載があるが、購入後メールには設定案内がない。故障率は以前と同じ。',summary:'商品不良より、購入直後の設定案内不足が問い合わせを増やしている。',reason:'問い合わせの大半が初期設定で、故障率は増えていない。',next:'購入後メールと同梱物の最初に設定手順を出す。',wrong:['サポート担当を倍にする。','商品を改良する。','説明書を20ページ増やす。']},
    {tag:'分析',title:'アクセスが急増した。',text:'昨日だけアクセスが3倍。売上は1.2倍。流入を見ると特定SNSからの訪問が急増し、その流入のCVRは通常の3分の1。',summary:'アクセス増は成果増というより、低CVRのSNS流入が一時的に増えた影響。',reason:'SNS流入だけが増え、そのCVRは通常より大幅に低い。',next:'SNS投稿の内容と遷移先を確認し、意図した客を呼べているか見る。',wrong:['アクセスが3倍なので大成功。','サーバーを増強する。','全流入のCVRを平均だけで見る。']},
    {tag:'判断',title:'新機能を追加するか迷う。',text:'要望は5社から来ている。ただし既存ユーザー300社の利用ログでは関連機能の利用率は8%。実装は3週間。今月は解約理由の上位に別の不具合がある。',summary:'新機能より、今は解約につながる既存不具合の方が優先度が高い。',reason:'要望数は限定的で関連利用率も低く、別の不具合が実際の解約理由になっている。',next:'まず解約要因の不具合を直し、新機能は要望顧客へ追加確認する。',wrong:['5社が欲しいならすぐ作る。','3週間なら短いので作る。','新機能を無料で先行公開する。']},
    {tag:'コミュニケーション',title:'説明すると長くなる。',text:'質問は「いつ終わる？」だけ。答えに背景、過去の経緯、担当者の状況、リスクを全部説明してから日付を伝えている。相手は途中で再度「結局いつ？」と聞く。',summary:'情報不足ではなく、結論を後ろに置いているため伝わりにくい。',reason:'相手が知りたい終了日より先に背景説明を長くしている。',next:'最初に予定日を言い、その後に必要な理由とリスクだけ補足する。',wrong:['もっと詳しい資料を作る。','話す速度を上げる。','背景を最初から全部話す。']},
    {tag:'採用',title:'応募は多いのに採用できない。',text:'応募数は目標の140%。書類通過は多いが、一次面接後の辞退率が55%。辞退者アンケートでは仕事内容のイメージ違いが最多。',summary:'母集団不足ではなく、応募前の仕事内容理解にズレがある。',reason:'応募は十分で、面接後辞退の主因が仕事内容のイメージ違い。',next:'求人ページと面接前案内で実際の仕事内容・期待役割を具体化する。',wrong:['求人広告費を増やす。','書類通過率をもっと上げる。','面接回数を増やす。']},
    {tag:'店舗',title:'行列ができるのに売上が伸びない。',text:'昼は行列がある。客単価は変わらない。席数も変わらない。注文から提供までが平均11分から18分へ延び、回転数が落ちている。',summary:'需要不足ではなく、提供時間の悪化で回転数が下がっている。',reason:'行列はあるのに提供時間が7分伸び、席の回転が落ちている。',next:'厨房工程の詰まりを特定し、提供時間を先に戻す。',wrong:['広告を出してもっと行列を作る。','値上げだけする。','席を装飾する。']},
    {tag:'予定',title:'予定を入れると全部崩れる。',text:'一日の予定を空き時間なく30分単位で埋めている。移動、メール、突発対応の時間は入れていない。毎日1〜2件の割り込みは実際に起きる。',summary:'予定量より、変化を吸収する余白がゼロなことが崩れる原因。',reason:'日常的に割り込みがあるのに、計画にはその時間が入っていない。',next:'最初から20〜30%を空白として残し、固定予定を詰め込みすぎない。',wrong:['すべて15分単位で管理する。','割り込みを完全になくす。','予定表の色を増やす。']},
    {tag:'制作',title:'完成しない。',text:'LP制作を始めて5日。コピー、写真、FAQ、アニメーションを同時に直している。公開条件は主要3セクションがあれば満たせるが、細部を直し続けている。',summary:'作業量より、公開に必要な最低条件と仕上げ作業が混ざっている。',reason:'公開条件は満たせるのに、非必須の細部を同時に直し続けている。',next:'公開条件の3セクションだけ完成させて一度出し、細部は次版へ回す。',wrong:['全部完璧になるまで公開しない。','アニメーションから仕上げる。','写真を100枚比較する。']},
    {tag:'顧客',title:'値下げ要望が多い。',text:'商談10件中6件で価格について質問。ただし失注理由を確認すると、4件は導入効果が不明、1件は時期、1件だけが価格。',summary:'価格質問の多さと、価格が本当の失注原因かは別。',reason:'実際の失注理由では価格は1件で、導入効果の不明確さが最多。',next:'値下げ前に、導入効果の説明と事例を強化して失注率を見る。',wrong:['6件が価格を聞いたので値下げする。','価格表示を消す。','商談数を減らす。']},
    {tag:'マネジメント',title:'相談が自分に集中する。',text:'5人チームで細かな判断も全員がリーダーに確認。判断基準は口頭でしか共有されていない。過去の似た判断も記録されていない。',summary:'メンバーの自立性より、判断基準が共有資産になっていないことが問題。',reason:'毎回リーダーしか知らない基準を確認する必要がある。',next:'頻出判断の基準と例を短く文書化し、自己判断できる範囲を決める。',wrong:['相談を禁止する。','会議を毎日増やす。','リーダーがもっと速く返信する。']},
    {tag:'調査',title:'調査に時間がかかりすぎる。',text:'新市場を調べるため記事を40本保存。知りたいのは「市場規模」「主要顧客」「参入障壁」の3点だが、読みながら別の気になる情報も追っている。',summary:'情報量不足ではなく、調査の問いが途中で広がり続けている。',reason:'必要な3点は決まっているのに、関連情報へ探索が拡散している。',next:'3つの問いに答える情報だけ先に集め、残りは別リストへ逃がす。',wrong:['記事を100本集めてから考える。','全部最初から精読する。','調査テーマをさらに増やす。']},
    {tag:'習慣',title:'運動が続かない。',text:'目標は毎日45分の運動。忙しい日はできず、その翌日も「昨日できなかったから」とやめる。5分歩くことならほぼ毎日可能。',summary:'意志の弱さより、成功条件が45分固定で大きすぎる。',reason:'5分ならできる日でも、45分できないと失敗扱いになっている。',next:'最低ラインを5分にして、余裕がある日だけ伸ばす。',wrong:['毎朝45分早く起きる。','できない日は罰をつける。','高価な運動器具を買う。']},
    {tag:'商品',title:'新商品が選ばれない。',text:'旧商品より性能は20%高い。価格は15%高い。商品名と写真は似ており、一覧画面では違いが分からない。比較表はページ最下部にある。',summary:'性能不足より、一覧と序盤で新商品の違いが見えないことが問題。',reason:'性能差はあるが、購入判断する場所で差分が伝わっていない。',next:'一覧とファーストビューで旧商品との違いを一目で比較できるようにする。',wrong:['さらに性能を上げる。','価格を半額にする。','比較表をもっと下に置く。']},
    {tag:'会議',title:'決めたはずなのに進まない。',text:'会議では「改善する」で合意。担当者、期限、最初の作業は決めていない。次週も同じ議題が出ている。',summary:'合意はあるが、実行単位まで決まっていない。',reason:'担当・期限・最初の作業が未定なので、誰も着手条件を持っていない。',next:'会議の最後に「誰が・いつまでに・最初に何を」を1行で確定する。',wrong:['もっと強く合意する。','議事録を長くする。','次週の会議時間を延ばす。']},
    {tag:'問題解決',title:'クレームが減らない。',text:'毎回担当者が個別に謝罪して解決している。直近20件のうち13件は同じ配送連絡の遅れ。原因部署への共有はしていない。',summary:'個別対応はできているが、同じ原因を仕組みとして止めていない。',reason:'20件中13件が同一原因なのに、ケースごとの謝罪で閉じている。',next:'配送連絡の発生工程を修正し、同種クレームの再発率を追う。',wrong:['謝罪文をもっと丁寧にする。','担当者を増やす。','クレーム対応研修だけする。']},
    {tag:'企画',title:'アイデアが多く決められない。',text:'候補は12案。目的は「3か月以内に新規顧客を増やす」。実装期間が3か月超の案が5つ、既存客向け案が3つ含まれている。',summary:'案の良し悪し以前に、目的と期限に合わない候補が混ざっている。',reason:'12案のうち8案は新規顧客・3か月という条件から外れている。',next:'目的と制約で候補を先に落とし、残った案だけ比較する。',wrong:['12案を全部詳細企画にする。','多数決だけで決める。','一番新しい案を選ぶ。']},
    {tag:'個人',title:'ずっとモヤモヤしている。',text:'気になる仕事が3つ。1つは相手の返信待ち、1つは来週まで動けない、1つだけ今日自分で進められる。頭の中では3つ全部を同時に考えている。',summary:'問題の数より、今動かせないものまで同時に考えていることが負荷になっている。',reason:'今日自分で進められるのは1件だけで、残りは待ち状態。',next:'待ち2件を外部リストへ出し、今日動かせる1件だけ開く。',wrong:['3件をずっと覚えておく。','相手の返信を何度も確認する。','全部今日終わらせる。']}
  ];

  const slotConfig = {
    summary: { label: '要するに？', hint: '最初に言うなら、どれ？' },
    reason: { label: 'なぜ？', hint: 'その結論を支える事実は？' },
    next: { label: 'だから？', hint: '次にやる一手は？' }
  };

  const state = {
    stats: loadStats(), rounds: [], roundIndex: 0, slotIndex: 0, answers: {},
    timeLimit: 20, timeLeft: 20, timerId: null, roundStartedAt: 0,
    correct: 0, total: 0, elapsed: [], score: 0, locked: false, realTimerId: null
  };

  function loadStats() {
    try {
      return Object.assign({sessions:0,bestAccuracy:0,bestAvg:null,lastAccuracy:0}, JSON.parse(localStorage.getItem(storageKey) || '{}'));
    } catch { return {sessions:0,bestAccuracy:0,bestAvg:null,lastAccuracy:0}; }
  }
  function saveStats() { localStorage.setItem(storageKey, JSON.stringify(state.stats)); }
  function difficultyFor(sessions) { return sessions >= 7 ? 10 : sessions >= 3 ? 15 : 20; }
  function nextDifficulty(sessions) { return difficultyFor(sessions); }
  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  function showScreen(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    window.scrollTo({top:0,behavior:'auto'});
  }
  function tone(freq=520,duration=.055) {
    if ($('soundBtn').getAttribute('aria-pressed') !== 'true') return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.value = freq; gain.gain.value = .035; osc.connect(gain); gain.connect(ctx.destination); osc.start();
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration); osc.onended = () => { try { ctx.close(); } catch {} }; osc.stop(ctx.currentTime + duration);
    } catch {}
  }
  function vibrate(ms=18) { if (navigator.vibrate) navigator.vibrate(ms); }
  function updateHome() {
    const s = state.stats;
    $('sessionsStat').textContent = s.sessions;
    $('accuracyStat').textContent = s.bestAccuracy ? `${s.bestAccuracy}%` : '—';
    $('speedStat').textContent = s.bestAvg ? `${s.bestAvg.toFixed(1)}s` : '—';
    const limit = difficultyFor(s.sessions);
    $('difficultyNote').textContent = s.sessions < 3 ? '最初は20秒。3セッションで15秒へ。' : s.sessions < 7 ? `現在${limit}秒。7セッションで10秒へ。` : '現在10秒。結論→根拠→次を反射にする。';
  }
  function startTraining() {
    state.rounds = shuffle(cases).slice(0, 7);
    state.roundIndex = 0; state.slotIndex = 0; state.answers = {}; state.correct = 0; state.total = 0; state.elapsed = []; state.score = 0;
    state.timeLimit = difficultyFor(state.stats.sessions);
    showScreen('trainScreen'); renderRound();
  }
  function renderRound() {
    clearInterval(state.timerId); state.locked = false; state.slotIndex = 0; state.answers = {};
    const c = state.rounds[state.roundIndex];
    $('roundLabel').textContent = `ROUND ${state.roundIndex + 1} / 7`;
    $('caseTag').textContent = c.tag; $('caseTitle').textContent = c.title; $('caseText').textContent = c.text;
    ['Summary','Reason','Next'].forEach(name => $(`map${name}`).textContent = '？');
    document.querySelectorAll('.map-cell').forEach((el,i)=>{el.classList.toggle('active',i===0);el.classList.remove('done')});
    state.timeLeft = state.timeLimit; state.roundStartedAt = performance.now(); updateTimer(); startTimer(); renderSlot();
  }
  function startTimer() {
    state.timerId = setInterval(() => {
      state.timeLeft = Math.max(0, state.timeLimit - (performance.now() - state.roundStartedAt) / 1000);
      updateTimer();
      if (state.timeLeft <= 0) { clearInterval(state.timerId); timeUp(); }
    }, 80);
  }
  function updateTimer() {
    $('timerValue').textContent = Math.ceil(state.timeLeft);
    $('timerBar').style.transform = `scaleX(${Math.max(0, state.timeLeft/state.timeLimit)})`;
    $('timer').classList.toggle('danger', state.timeLeft <= 5);
  }
  function currentSlot() { return ['summary','reason','next'][state.slotIndex]; }
  function distractors(c, slot) {
    const other = slot === 'summary' ? [c.reason,c.next] : slot === 'reason' ? [c.summary,c.next] : [c.summary,c.reason];
    return shuffle([...c.wrong, ...other]).slice(0,3);
  }
  function renderSlot() {
    const c = state.rounds[state.roundIndex]; const slot = currentSlot(); const cfg = slotConfig[slot];
    $('frameLabel').textContent = cfg.label; $('questionHint').textContent = cfg.hint;
    const correct = c[slot]; const choices = shuffle([correct, ...distractors(c,slot)]);
    $('options').innerHTML = '';
    choices.forEach((text, idx) => {
      const btn = document.createElement('button'); btn.className='option'; btn.type='button'; btn.dataset.correct = String(text===correct);
      btn.innerHTML = `<span class="key">${String.fromCharCode(65+idx)}</span><span class="txt"></span>`;
      btn.querySelector('.txt').textContent = text;
      btn.addEventListener('click', ()=>selectOption(btn,text)); $('options').appendChild(btn);
    });
  }
  function selectOption(btn,text) {
    if (state.locked) return; state.locked = true; const c = state.rounds[state.roundIndex]; const slot = currentSlot();
    const isCorrect = text === c[slot]; state.total++;
    document.querySelectorAll('.option').forEach(o=>{o.classList.add('disabled');if(o.dataset.correct==='true')o.classList.add('correct')});
    if (isCorrect) { state.correct++; state.score += 100; tone(680); vibrate(12); } else { btn.classList.add('wrong'); tone(180,.09); vibrate(38); }
    state.answers[slot] = c[slot]; $(`map${slot[0].toUpperCase()+slot.slice(1)}`).textContent = c[slot];
    const cell = document.querySelector(`.map-cell[data-slot="${slot}"]`); cell.classList.remove('active'); cell.classList.add('done');
    setTimeout(() => advanceSlot(), isCorrect ? 360 : 720);
  }
  function skipCurrent() {
    if (state.locked) return; state.locked = true; const c=state.rounds[state.roundIndex]; const slot=currentSlot(); state.total++;
    document.querySelectorAll('.option').forEach(o=>{o.classList.add('disabled');if(o.dataset.correct==='true')o.classList.add('correct')});
    state.answers[slot]=c[slot]; $(`map${slot[0].toUpperCase()+slot.slice(1)}`).textContent=c[slot];
    const cell=document.querySelector(`.map-cell[data-slot="${slot}"]`);cell.classList.remove('active');cell.classList.add('done');tone(260,.08);
    setTimeout(()=>advanceSlot(),700);
  }
  function advanceSlot() {
    state.slotIndex++;
    if (state.slotIndex >= 3) return finishRound();
    const next = currentSlot(); document.querySelector(`.map-cell[data-slot="${next}"]`).classList.add('active'); state.locked=false; renderSlot();
  }
  function timeUp() {
    if (state.locked) return; state.locked = true;
    const c = state.rounds[state.roundIndex];
    while (state.slotIndex < 3) { const slot=currentSlot(); state.total++; state.answers[slot]=c[slot]; state.slotIndex++; }
    tone(130,.12); vibrate(60); setTimeout(()=>finishRound(true),420);
  }
  function finishRound(timedOut=false) {
    clearInterval(state.timerId);
    const c = state.rounds[state.roundIndex]; const elapsed = Math.min(state.timeLimit, (performance.now()-state.roundStartedAt)/1000); state.elapsed.push(elapsed);
    const speedBonus = Math.max(0, Math.round((state.timeLimit-elapsed)/state.timeLimit*100)); state.score += speedBonus;
    $('resultSummary').textContent=c.summary; $('resultReason').textContent=c.reason; $('resultNext').textContent=c.next;
    $('roundResultTitle').textContent = timedOut ? '時間切れ。でも型は残す。' : '3点にまとまった。';
    $('nextRoundBtn').querySelector('span').textContent = state.roundIndex === 6 ? '結果を見る' : '次の問題';
    showScreen('roundResultScreen');
  }
  function nextRound() {
    if (state.roundIndex >= 6) return finishSession(); state.roundIndex++; showScreen('trainScreen'); renderRound();
  }
  function finishSession() {
    const accuracy = Math.round((state.correct/Math.max(1,state.total))*100); const avg = state.elapsed.reduce((a,b)=>a+b,0)/Math.max(1,state.elapsed.length);
    state.stats.sessions++; state.stats.lastAccuracy=accuracy; state.stats.bestAccuracy=Math.max(state.stats.bestAccuracy,accuracy);
    if (!state.stats.bestAvg || avg < state.stats.bestAvg) state.stats.bestAvg=avg; saveStats();
    const nextLimit = nextDifficulty(state.stats.sessions);
    $('scoreValue').textContent=state.score; $('resultAccuracy').textContent=`${accuracy}%`; $('resultSpeed').textContent=`${avg.toFixed(1)}秒`; $('resultLimit').textContent=`${nextLimit}秒`;
    $('sessionFeedback').textContent = accuracy >= 90 ? 'かなり速い。次は「正解を探す」より、現実でもこの順番を自動で出す。' : accuracy >= 70 ? '型は入ってきている。迷ったら、まず「要するに？」だけを先に決める。' : 'まだ考えが枝分かれしている。まず結論を1つに決めてから理由へ進む。';
    updateHome(); showScreen('sessionResultScreen');
  }
  function startRealMode() {
    clearInterval(state.realTimerId); ['realSummary','realReason','realNext'].forEach(id=>$(id).value=''); $('realTimer').textContent='30'; showScreen('realScreen');
    let left=30; state.realTimerId=setInterval(()=>{left--; $('realTimer').textContent=Math.max(0,left); if(left<=0){clearInterval(state.realTimerId);tone(220,.08)}},1000);
    setTimeout(()=>$('realSummary').focus(),180);
  }
  function finishReal() {
    const summary=$('realSummary').value.trim(), reason=$('realReason').value.trim(), next=$('realNext').value.trim();
    if (!summary || !reason || !next) { toast('3つとも一文だけ入れる'); tone(190,.07); return; }
    clearInterval(state.realTimerId);
    $('outSummary').textContent=summary; $('outReason').textContent=reason; $('outNext').textContent=next; showScreen('realResultScreen'); tone(720,.07); vibrate(15);
  }
  async function copyReal() {
    const text=`要するに：${$('outSummary').textContent}\nなぜ：${$('outReason').textContent}\nだから：${$('outNext').textContent}`;
    try { await navigator.clipboard.writeText(text); toast('3行をコピーしました'); tone(700,.05); }
    catch { toast('コピーできませんでした'); }
  }
  function toast(msg) { const el=$('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),1600); }
  function toggleSound() { const on=$('soundBtn').getAttribute('aria-pressed')==='true'; $('soundBtn').setAttribute('aria-pressed',String(!on)); $('soundBtn').textContent=on?'×':'♪'; $('soundBtn').setAttribute('aria-label',on?'音をオンにする':'音をオフにする'); if(!on)tone(520); }
  function goHome() { clearInterval(state.timerId); clearInterval(state.realTimerId); updateHome(); showScreen('homeScreen'); }

  $('trainBtn').addEventListener('click',startTraining); $('realBtn').addEventListener('click',startRealMode); $('skipBtn').addEventListener('click',skipCurrent);
  $('nextRoundBtn').addEventListener('click',nextRound); $('againBtn').addEventListener('click',startTraining); $('realFromResultBtn').addEventListener('click',startRealMode);
  $('realFinishBtn').addEventListener('click',finishReal); $('realBackBtn').addEventListener('click',goHome); $('copyBtn').addEventListener('click',copyReal); $('realAgainBtn').addEventListener('click',startRealMode); $('homeBtn').addEventListener('click',goHome); $('soundBtn').addEventListener('click',toggleSound);
  document.addEventListener('keydown',(e)=>{if(!$('trainScreen').classList.contains('active'))return; const n=['1','2','3','4'].indexOf(e.key); if(n>=0)document.querySelectorAll('.option')[n]?.click();});
  updateHome();
})();
