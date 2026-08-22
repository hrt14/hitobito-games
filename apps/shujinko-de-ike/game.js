(() => {
  'use strict';

  const scenes = [
    {
      chapter: 1, tag: '休日', title: 'せっかくの休み。',
      body: '友人から「休みの日まで勉強するの？」と言われた。でも昨日から、新しいことを試したくてうずうずしている。',
      voices: ['休みくらい普通に遊ぼうよ', '頑張りすぎじゃない？'],
      inner: '誰にも見られていなくても、今日は何をしたい？',
      choices: [
        { text: '午前だけ、やりたかった勉強を始める', note: '自分の「やりたい」を採用する', hero: 11, safety: -2, owned: 1, fear: 0, other: 0, title: '自分の休日を、自分で決めた。', feedback: '「人からどう見えるか」ではなく、今日の自分が望む時間を選んだ。' },
        { text: 'みんなに合わせて遊びに行く', note: '浮かない方を選ぶ', hero: -8, safety: 8, owned: 0, fear: 0, other: 1, title: '空気は守った。', feedback: '安全だけれど、自分の希望は一度、後ろに置いた。' },
        { text: '今日は本当に休みたい。堂々と何もしない', note: '休むことも、自分で選べる', hero: 8, safety: 4, owned: 1, fear: 0, other: 0, title: '休むことも、主人公の選択。', feedback: '主人公＝無理して挑戦する人ではない。本音が休息なら、それを自分で選ぶ。' }
      ]
    },
    {
      chapter: 1, tag: '買い物', title: 'みんなが持っている。',
      body: '周囲で流行っている高価なアイテム。欲しい気もする。でも、本当に必要なのかはよく分からない。',
      voices: ['今どき持ってないの？', 'みんな買ってるよ'],
      inner: '「みんな」を消したら、自分は欲しい？',
      choices: [
        { text: '24時間置いて、それでも欲しければ買う', note: '自分の欲求を確認する', hero: 9, safety: 5, owned: 1, fear: 0, other: 0, title: '「みんな」から距離を取った。', feedback: '衝動にも同調にも乗らず、自分の答えが出る時間を作った。' },
        { text: '置いていかれたくないから今すぐ買う', note: '他人基準で決める', hero: -9, safety: 7, owned: 0, fear: 0, other: 1, title: '選んだのは、周囲だった。', feedback: '買うこと自体ではなく、理由が「みんな」になっている。' },
        { text: '自分は欲しい。予算内なので買う', note: '欲しい理由が自分にある', hero: 10, safety: 1, owned: 1, fear: 0, other: 0, title: '同じ「買う」でも、物語は違う。', feedback: '行動ではなく、誰が決めたか。自分で選んだなら主人公度は上がる。' }
      ]
    },
    {
      chapter: 1, tag: '人間関係', title: '誘いを断りたい。',
      body: '今夜の集まり。悪い人たちではない。でも今日は一人で過ごしたい。',
      voices: ['付き合い悪いと思われるよ', '断ったら空気悪くない？'],
      inner: '嫌われる心配がなければ、どうする？',
      choices: [
        { text: '今日は行かない。次に会いたい日を提案する', note: '関係も自分の時間も守る', hero: 11, safety: 1, owned: 1, fear: 0, other: 0, title: '関係を壊さず、自分も消さなかった。', feedback: '主人公は「全部断る人」ではない。自分の意思を関係の中に置ける人だ。' },
        { text: '気が進まないけど、とりあえず参加する', note: '摩擦を避ける', hero: -8, safety: 9, owned: 0, fear: 1, other: 1, title: '平和は守った。自分は後回し。', feedback: '断れない理由が「嫌われるかも」なら、恐怖が脚本を書いている。' },
        { text: '面倒だから既読のまま放置する', note: '選択から逃げる', hero: -5, safety: 0, owned: 0, fear: 1, other: 0, title: '決めないことを選んだ。', feedback: '主人公度は「強く言う」より、意思を引き受けることで上がる。' }
      ]
    },
    {
      chapter: 2, tag: '仕事', title: '安定した道がある。',
      body: '今の仕事は悪くない。一方で、ずっと試したかった役割への異動募集が出た。成功の保証はない。',
      voices: ['今のままで十分じゃない？', '失敗したら評価下がるよ'],
      inner: '失敗しても人生が終わらないなら、どちらを選ぶ？',
      choices: [
        { text: '応募する。足りない条件は応募後に埋める', note: '怖さより興味を一歩前へ', hero: 13, safety: -7, owned: 1, fear: 0, other: 0, title: '物語が、次の章へ進んだ。', feedback: '保証がないからこそ、「やってみたい」を選んだ事実が残る。' },
        { text: '今回は見送る。ただし半年後の応募条件を作る', note: '安定を「逃げ」にしない', hero: 8, safety: 8, owned: 1, fear: 0, other: 0, title: '留まることを、自分で選んだ。', feedback: '今は動かない。でも「怖いから」ではなく、次の一手まで自分で決めた。' },
        { text: '周りも応募しないので、やめておく', note: '周囲を判断基準にする', hero: -10, safety: 10, owned: 0, fear: 0, other: 1, title: '多数派の脚本に乗った。', feedback: '安全度は上がった。でも「自分はどうしたい？」の答えは保留になった。' }
      ]
    },
    {
      chapter: 2, tag: '発言', title: '会議で違和感がある。',
      body: '全員が賛成ムード。ただ、自分だけ重大な見落としに気づいている気がする。確信は80%。',
      voices: ['今さら水差すの？', '空気読んだ方がいいよ'],
      inner: '映画の主人公なら、ここで何をする？',
      choices: [
        { text: '「確認だけ」と前置きして違和感を共有する', note: '反対ではなく、責任を果たす', hero: 12, safety: -2, owned: 1, fear: 0, other: 0, title: '一言で、場面が変わった。', feedback: '主人公らしさは大声ではない。必要な瞬間に、自分の視点を出すこと。' },
        { text: '会議後に一人で抱える', note: '摩擦を避ける', hero: -7, safety: 8, owned: 0, fear: 1, other: 0, title: '波風は立たなかった。', feedback: 'でも、見えていたものを物語の外に置いた。' },
        { text: '確信100%になるまで黙る', note: '完全な保証を待つ', hero: -5, safety: 6, owned: 0, fear: 1, other: 0, title: '保証を待って、場面は過ぎた。', feedback: '現実では100%はなかなか来ない。主人公は不確実さの中で言葉を選ぶ。' }
      ]
    },
    {
      chapter: 2, tag: '挑戦', title: 'やりたい。でも怖い。',
      body: '小さな作品を公開できるところまで来た。まだ粗い。出せば評価される。出さなければ傷つかない。',
      voices: ['もっと完成してからでしょ', '笑われたらどうする？'],
      inner: '怖さがゼロなら、今日どうする？',
      choices: [
        { text: '限定公開して、3人から反応をもらう', note: '怖さを小さくして前進する', hero: 12, safety: 2, owned: 1, fear: 0, other: 0, title: '怖さを消さず、サイズを変えた。', feedback: '主人公は恐怖がない人ではない。恐怖があっても次の一手を作る。' },
        { text: '完璧になるまで非公開にする', note: '傷つかない方を選ぶ', hero: -9, safety: 11, owned: 0, fear: 1, other: 0, title: '作品は守った。物語は止まった。', feedback: '安全度は高い。でも反応がない限り、次の章の材料も増えない。' },
        { text: '勢いで全部公開し、反応は見ない', note: '挑戦に見えて、責任から逃げる', hero: 1, safety: -5, owned: 0, fear: 1, other: 0, title: '飛び出した。でも向き合ってはいない。', feedback: '無謀さ＝主人公ではない。選択の結果を引き受けることまでが物語。' }
      ]
    },
    {
      chapter: 3, tag: '家族', title: '期待されている道。',
      body: '家族は「安定した会社に残ってほしい」と願っている。自分には別の働き方を試したい気持ちがある。',
      voices: ['心配かけない方がいい', '家族なら言うこと聞くべき'],
      inner: '大切な人の意見を聞いたうえで、自分はどう生きたい？',
      choices: [
        { text: '不安材料を洗い出し、期限を決めて挑戦する', note: '他人の懸念も材料にして自分で決める', hero: 14, safety: -3, owned: 1, fear: 0, other: 0, title: '誰かを無視せず、自分も消さなかった。', feedback: '主人公は周囲の声を遮断しない。聞いたうえで、最終決定権を自分に戻す。' },
        { text: '家族が安心する道をそのまま選ぶ', note: '期待を優先する', hero: -10, safety: 12, owned: 0, fear: 0, other: 1, title: '安心は増えた。決定権は外へ出た。', feedback: 'その道が本音なら問題ない。でも理由が「期待に応えるだけ」なら主人公度は下がる。' },
        { text: '反発して、計画なしで辞める', note: '他人の逆を選ぶだけ', hero: -2, safety: -12, owned: 0, fear: 0, other: 1, title: '逆らっても、他人軸のまま。', feedback: '「言われたから逆をやる」も、脚本を書いているのは相手だ。' }
      ]
    },
    {
      chapter: 3, tag: '価値観', title: '成功って、何だ。',
      body: '周囲は昇進や年収の話で盛り上がっている。自分は最近、自由な時間の方に強く惹かれている。',
      voices: ['上を目指さないの？', 'もったいないよ'],
      inner: '拍手されなくても欲しいものは何？',
      choices: [
        { text: '自分の成功指標を「時間」に置き直す', note: '勝ち方そのものを選ぶ', hero: 13, safety: 0, owned: 1, fear: 0, other: 0, title: 'ゲームのルールを、自分で決めた。', feedback: '主人公は他人のランキングで1位を取る人ではない。自分の物語の勝利条件を決める。' },
        { text: '遅れたくないので昇進競争に乗る', note: '比較を基準にする', hero: -9, safety: 7, owned: 0, fear: 1, other: 1, title: 'レースには乗った。行き先は未確認。', feedback: '速く走れても、自分が行きたい方向でなければ物語は薄くなる。' },
        { text: '昇進も時間も欲しいので条件交渉する', note: '二択にせず、自分で第三案を作る', hero: 14, safety: 2, owned: 1, fear: 0, other: 0, title: '脚本にない選択肢を作った。', feedback: '主人公らしさの上位技は、与えられた二択から降りること。' }
      ]
    },
    {
      chapter: 4, tag: '責任', title: '夢と約束がぶつかった。',
      body: 'ずっと行きたかったイベントの招待が来た。同じ日に、以前から引き受けた大事な約束がある。',
      voices: ['夢なら行くべきでしょ', '約束は絶対でしょ'],
      inner: '「主人公っぽさ」ではなく、自分が後で引き受けられる選択は？',
      choices: [
        { text: 'まず約束相手に事情を話し、代替案を相談する', note: '欲望と責任を同じテーブルに載せる', hero: 13, safety: 1, owned: 1, fear: 0, other: 0, title: '物語を壊さず、交渉した。', feedback: '主人公＝自分勝手ではない。自分の望みも約束も、どちらも現実として扱う。' },
        { text: '主人公なら夢を取る、と無断で約束を破る', note: '「主人公」を言い訳にする', hero: -12, safety: -10, owned: 0, fear: 0, other: 0, title: 'それは主人公ではなく、独断。', feedback: 'このゲームの主人公度は、派手さではなく「自分で決め、結果を引き受ける力」。' },
        { text: '何も相談せず夢を諦める', note: '摩擦を避けて可能性を閉じる', hero: -7, safety: 9, owned: 0, fear: 1, other: 0, title: '守れたものはある。試していないことも残った。', feedback: '約束を守るのは大切。ただ、相談という選択肢まで捨てる必要はない。' }
      ]
    },
    {
      chapter: 4, tag: '人生', title: '最後のカット。',
      body: '10年後の自分が、今日のあなたを映画館で見ている。今の選択を見て、何と言うだろう。',
      voices: ['普通でいいじゃん', '今さら変えなくても', '失敗しない方が賢いよ'],
      inner: 'この場面の主人公は、何を選ぶ？',
      choices: [
        { text: '一番気になっていることに、今日15分だけ使う', note: '物語を現実の一歩に落とす', hero: 15, safety: 0, owned: 1, fear: 0, other: 0, title: 'エンドロールの前に、次の場面を作った。', feedback: '大きな宣言より、今日の15分。主人公の物語は行動でしか続かない。' },
        { text: 'いつか余裕ができたら考える', note: '未来の自分へ送る', hero: -11, safety: 10, owned: 0, fear: 1, other: 0, title: '「いつか」に脚本を預けた。', feedback: '安全だけれど、「いつか」は場面を進めない。' },
        { text: 'やることを1つ決め、誰かに宣言する', note: '自分の選択に現実の重さを持たせる', hero: 13, safety: -2, owned: 1, fear: 0, other: 0, title: '主人公が、カメラの外でも動き始めた。', feedback: '選んだことを現実へ接続すると、ゲームの反射が生活へ移る。' }
      ]
    }
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ['startScreen', 'gameScreen', 'resultScreen'];
  const state = { index: 0, hero: 50, safety: 50, owned: 0, fear: 0, other: 0, answers: [], sound: true };

  const clamp = (v) => Math.max(0, Math.min(100, v));
  const showScreen = (id) => {
    screens.forEach(s => $(s).classList.toggle('active', s === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function tone(freq = 520, duration = .08, type = 'sine', gain = .035) {
    if (!state.sound) return;
    try {
      const ctx = tone.ctx || (tone.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      amp.gain.value = gain;
      osc.connect(amp); amp.connect(ctx.destination);
      osc.start();
      amp.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  function haptic(ms = 12) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function reset() {
    Object.assign(state, { index: 0, hero: 50, safety: 50, owned: 0, fear: 0, other: 0, answers: [] });
    renderScene();
    showScreen('gameScreen');
  }

  function renderScene() {
    const scene = scenes[state.index];
    $('chapterPill').textContent = `CHAPTER ${scene.chapter}`;
    $('progressBar').style.width = `${((state.index + 1) / scenes.length) * 100}%`;
    $('heroScore').textContent = state.hero;
    $('safetyScore').textContent = state.safety;
    $('sceneTag').textContent = scene.tag;
    $('sceneCount').textContent = `${state.index + 1} / ${scenes.length}`;
    $('sceneTitle').textContent = scene.title;
    $('sceneBody').textContent = scene.body;
    $('innerQuestion').textContent = scene.inner;
    $('feedbackPanel').hidden = true;
    $('sceneCard').hidden = false;

    const voices = $('voices');
    voices.innerHTML = '';
    scene.voices.forEach((v, i) => {
      const chip = document.createElement('span');
      chip.className = 'voice-chip';
      chip.style.animationDelay = `${i * 90}ms`;
      chip.textContent = v;
      voices.appendChild(chip);
    });

    const choices = $('choices');
    choices.innerHTML = '';
    scene.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span>${choice.text}</span><small>${choice.note}</small>`;
      btn.addEventListener('click', () => choose(choice, i));
      choices.appendChild(btn);
    });
  }

  function choose(choice, choiceIndex) {
    state.hero = clamp(state.hero + choice.hero);
    state.safety = clamp(state.safety + choice.safety);
    state.owned += choice.owned;
    state.fear += choice.fear;
    state.other += choice.other;
    state.answers.push({ scene: state.index, choice: choiceIndex, ...choice });

    $('heroScore').textContent = state.hero;
    $('safetyScore').textContent = state.safety;
    $('feedbackTitle').textContent = choice.title;
    $('feedbackBody').textContent = choice.feedback;
    $('feedbackKicker').textContent = choice.hero >= 8 ? 'YOUR STORY MOVED' : choice.hero < 0 ? 'WHO WROTE THIS SCENE?' : 'STORY CHECK';

    const deltas = $('deltaRow');
    deltas.innerHTML = '';
    const heroDelta = document.createElement('span');
    heroDelta.className = 'delta hero';
    heroDelta.textContent = `主人公度 ${choice.hero >= 0 ? '+' : ''}${choice.hero}`;
    deltas.appendChild(heroDelta);
    const safeDelta = document.createElement('span');
    safeDelta.className = 'delta safe';
    safeDelta.textContent = `安全度 ${choice.safety >= 0 ? '+' : ''}${choice.safety}`;
    deltas.appendChild(safeDelta);

    $('sceneCard').hidden = true;
    $('feedbackPanel').hidden = false;
    tone(choice.hero >= 8 ? 660 : choice.hero < 0 ? 240 : 430, .1, choice.hero >= 8 ? 'triangle' : 'sine');
    haptic(choice.hero >= 8 ? 18 : 9);
  }

  function next() {
    if (state.index >= scenes.length - 1) return finish();
    state.index += 1;
    renderScene();
    tone(460, .06, 'sine', .025);
  }

  function finish() {
    const n = scenes.length;
    const ownedRate = Math.round((state.owned / n) * 100);
    const fearRate = Math.round((state.fear / n) * 100);
    const otherRate = Math.round((state.other / n) * 100);

    let title, copy, lesson;
    if (state.hero >= 82) {
      title = 'DIRECTOR’S CUT — 自分で脚本を書いた人';
      copy = '周囲の声を消すのではなく、聞いたうえで決定権を自分に戻せている。次は現実の1場面で、この反射を使うだけ。';
      lesson = '「本当はどうしたい？」を、行動の前に1回だけ入れる。';
    } else if (state.hero >= 65) {
      title = 'MAIN CHARACTER — 物語は動いている';
      copy = '怖さや空気に引っ張られる場面はある。それでも、自分の意思に戻る回数が増えている。主人公度は筋トレと同じで反復で上がる。';
      lesson = '「怖くなければどっち？」で、恐怖と希望を分離する。';
    } else if (state.hero >= 45) {
      title = 'SCRIPT REWRITE — 脚本を書き換え中';
      copy = '「普通」「失敗」「期待」が選択に入り込みやすい。でも、それに気づけた時点で書き換えは始まっている。';
      lesson = '「これは自分の希望？ 他人の期待？」を毎回見分ける。';
    } else {
      title = 'NPC MODE — 決定権を取り戻せ';
      copy = '安全を選んだことが問題ではない。理由の多くが「他人」「恐怖」になっていたことがポイント。安定だって、自分で選べば主人公の選択になる。';
      lesson = '行動ではなく「誰がこの選択を決めた？」を見る。';
    }

    $('finalHero').textContent = state.hero;
    $('ownedRate').textContent = `${ownedRate}%`;
    $('fearRate').textContent = `${fearRate}%`;
    $('otherRate').textContent = `${otherRate}%`;
    $('endingTitle').textContent = title;
    $('endingCopy').textContent = copy;
    $('lessonText').textContent = lesson;
    $('scoreRing').style.background = `conic-gradient(var(--hero) ${state.hero * 3.6}deg,#293044 0deg 360deg)`;

    try {
      const best = Math.max(Number(localStorage.getItem('shujinkoBest') || 0), state.hero);
      localStorage.setItem('shujinkoBest', String(best));
      localStorage.setItem('shujinkoLastPlayed', new Date().toISOString());
    } catch (_) {}

    showScreen('resultScreen');
    tone(740, .12, 'triangle', .04);
    setTimeout(() => tone(880, .14, 'triangle', .03), 110);
  }

  function share() {
    const text = `『主人公で行け。』\n主人公度 ${state.hero} / 100\n自分で選んだ ${Math.round(state.owned / scenes.length * 100)}%\n\n「これは自分の希望？ 他人の期待？」`;
    const ok = () => toast('結果をコピーしました');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('結果をコピーしました'); } catch (_) { toast('コピーできませんでした'); }
    ta.remove();
  }

  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  $('startBtn').addEventListener('click', () => { reset(); tone(520, .08, 'triangle'); });
  $('nextBtn').addEventListener('click', next);
  $('retryBtn').addEventListener('click', reset);
  $('shareBtn').addEventListener('click', share);
  $('soundBtn').addEventListener('click', () => {
    state.sound = !state.sound;
    $('soundBtn').setAttribute('aria-pressed', String(state.sound));
    $('soundBtn').textContent = state.sound ? '♪' : '×';
    if (state.sound) tone(520, .06);
  });
})();
