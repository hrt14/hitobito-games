(() => {
  'use strict';

  const TOTAL_ROUNDS = 12;
  const STORAGE_KEY = 'levelup:kininaranai:v1';

  const EVENTS = [
    { text: '相手の返信が、いつもより少し短い。', type: 'noise', tag: '人間関係' },
    { text: 'SNSの投稿に、思ったほど反応がない。', type: 'noise', tag: '評価' },
    { text: '隣の人が、自分より先に呼ばれた。', type: 'noise', tag: '日常' },
    { text: '机に、小さな傷を見つけた。', type: 'noise', tag: '小さな違和感' },
    { text: '予定が10分だけ後ろにずれた。', type: 'noise', tag: '予定' },
    { text: 'すれ違った人が、少し不機嫌そうだった。', type: 'noise', tag: '他人' },
    { text: '自分の案が、一回で採用されなかった。', type: 'noise', tag: '仕事' },
    { text: 'グループの会話が、自分抜きで少し進んでいた。', type: 'noise', tag: '人間関係' },
    { text: '買った物が、翌日に少し安くなっていた。', type: 'noise', tag: '損得' },
    { text: '相手の文章に、句点がなかった。', type: 'noise', tag: '解釈' },
    { text: '一度だけ、言い間違えた。', type: 'noise', tag: '失敗' },
    { text: '電車で、座りたかった席を先に取られた。', type: 'noise', tag: '日常' },
    { text: '会議で、自分の発言に誰も反応しなかった。', type: 'noise', tag: '評価' },
    { text: '天気予報より、少し曇っている。', type: 'noise', tag: '予定外' },
    { text: '知り合いが、自分より楽しそうに見えた。', type: 'noise', tag: '比較' },
    { text: 'レジの列が、隣だけ少し速く進んでいる。', type: 'noise', tag: '日常' },
    { text: '今日18時が締切の申請が、まだ未提出。', type: 'signal', tag: '締切' },
    { text: '「至急確認してください」と仕事の連絡が来た。', type: 'signal', tag: '要確認' },
    { text: '雨が降り始めたのに、窓が開いたまま。', type: 'signal', tag: '対応' },
    { text: '引き落としが残高不足で失敗した通知が来た。', type: 'signal', tag: 'お金' },
    { text: '予約時間まで20分。移動には15分かかる。', type: 'signal', tag: '時間' },
    { text: '明日の朝に必要な資料が、まだ完成していない。', type: 'signal', tag: '準備' },
    { text: '冷蔵庫の扉が、少し開いたままになっている。', type: 'signal', tag: '対応' },
    { text: '大事な相手から「今日中に返答がほしい」と来た。', type: 'signal', tag: '返信' },
  ];

  const els = Object.fromEntries([
    'startScreen','trainingScreen','resultScreen','startBtn','againBtn','soundBtn','topLevel',
    'sessionCount','bestScore','lifetimePass','localStats','roundText','modeLabel','streakValue','progressFill',
    'attentionField','eventCard','eventTag','eventText','timerNumber','feedback','feedbackTitle','feedbackText',
    'pickBtn','trainingHint','resultScore','noisePassText','signalCatchText','noisePassBar','signalCatchBar',
    'resultLevel','levelCopy','screenFlash'
  ].map((id) => [id, document.getElementById(id)]));

  const state = {
    sound: true,
    deck: [],
    round: 0,
    streak: 0,
    bestStreak: 0,
    noiseTotal: 0,
    noisePassed: 0,
    signalTotal: 0,
    signalCaught: 0,
    locked: false,
    deadline: 0,
    frame: 0,
    timerId: 0,
  };

  let audioCtx = null;

  function loadStats() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        sessions: Number(parsed.sessions) || 0,
        best: Number(parsed.best) || 0,
        noiseTotal: Number(parsed.noiseTotal) || 0,
        noisePassed: Number(parsed.noisePassed) || 0,
        signalTotal: Number(parsed.signalTotal) || 0,
        signalCaught: Number(parsed.signalCaught) || 0,
      };
    } catch {
      return { sessions: 0, best: 0, noiseTotal: 0, noisePassed: 0, signalTotal: 0, signalCaught: 0 };
    }
  }

  function saveStats(sessionScore) {
    const stats = loadStats();
    const next = {
      sessions: stats.sessions + 1,
      best: Math.max(stats.best, sessionScore),
      noiseTotal: stats.noiseTotal + state.noiseTotal,
      noisePassed: stats.noisePassed + state.noisePassed,
      signalTotal: stats.signalTotal + state.signalTotal,
      signalCaught: stats.signalCaught + state.signalCaught,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function levelFromScore(score) {
    if (score >= 95) return 7;
    if (score >= 88) return 6;
    if (score >= 80) return 5;
    if (score >= 70) return 4;
    if (score >= 58) return 3;
    if (score >= 42) return 2;
    return 1;
  }

  function renderStats() {
    const stats = loadStats();
    const passRate = stats.noiseTotal ? Math.round((stats.noisePassed / stats.noiseTotal) * 100) : 0;
    els.topLevel.textContent = String(levelFromScore(stats.best));
    els.sessionCount.textContent = String(stats.sessions);
    els.bestScore.textContent = String(stats.best);
    els.lifetimePass.textContent = String(passRate);
    els.localStats.hidden = stats.sessions === 0;
  }

  function showScreen(target) {
    [els.startScreen, els.trainingScreen, els.resultScreen].forEach((screen) => screen.classList.remove('active'));
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function makeDeck() {
    const noise = shuffle(EVENTS.filter((item) => item.type === 'noise')).slice(0, 8);
    const signal = shuffle(EVENTS.filter((item) => item.type === 'signal')).slice(0, 4);
    return shuffle([...noise, ...signal]);
  }

  function durationForRound(round) {
    if (round < 3) return 2600;
    if (round < 7) return 2250;
    return 1950;
  }

  function resetSession() {
    cancelRoundTimer();
    Object.assign(state, {
      deck: makeDeck(), round: 0, streak: 0, bestStreak: 0,
      noiseTotal: 0, noisePassed: 0, signalTotal: 0, signalCaught: 0,
      locked: false, deadline: 0,
    });
    els.streakValue.textContent = '0';
    els.progressFill.style.width = '0%';
    els.trainingHint.textContent = '何もしなければ、そのまま流れていきます。';
  }

  function cancelRoundTimer() {
    clearTimeout(state.timerId);
    cancelAnimationFrame(state.frame);
    state.timerId = 0;
    state.frame = 0;
  }

  function animateTimer(duration) {
    state.deadline = performance.now() + duration;
    const tick = (now) => {
      const remain = Math.max(0, state.deadline - now);
      els.timerNumber.textContent = (remain / 1000).toFixed(1);
      if (remain > 0 && !state.locked) state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);
  }

  function currentEvent() {
    return state.deck[state.round];
  }

  function startRound() {
    if (state.round >= TOTAL_ROUNDS) return finishSession();

    state.locked = false;
    const item = currentEvent();
    const duration = durationForRound(state.round);
    els.pickBtn.disabled = false;
    els.feedback.className = 'feedback';
    els.eventCard.className = 'event-card';
    void els.eventCard.offsetWidth;
    els.eventCard.classList.add('enter');
    els.eventTag.textContent = item.tag;
    els.eventText.textContent = item.text;
    els.roundText.textContent = `${state.round + 1} / ${TOTAL_ROUNDS}`;
    els.modeLabel.textContent = state.round < 3 ? 'EASY' : state.round < 7 ? 'NORMAL' : 'FAST';
    els.progressFill.style.width = `${(state.round / TOTAL_ROUNDS) * 100}%`;
    els.timerNumber.textContent = (duration / 1000).toFixed(1);
    animateTimer(duration);
    state.timerId = window.setTimeout(() => resolveRound('pass'), duration);
  }

  function resolveRound(action) {
    if (state.locked) return;
    state.locked = true;
    cancelRoundTimer();
    els.pickBtn.disabled = true;

    const item = currentEvent();
    const picked = action === 'pick';
    let correct = false;
    let title = '';
    let copy = '';

    if (item.type === 'noise') {
      state.noiseTotal += 1;
      if (!picked) {
        state.noisePassed += 1;
        correct = true;
        title = '通過。';
        copy = 'それは、脳内に入れなくていい。';
        els.eventCard.classList.add('pass');
      } else {
        title = '拾わなくていい。';
        copy = '小さなノイズまで開かない。';
        els.eventCard.classList.add('wrong');
      }
    } else {
      state.signalTotal += 1;
      if (picked) {
        state.signalCaught += 1;
        correct = true;
        title = '拾えた。';
        copy = '必要なことだけ反応する。';
        els.eventCard.classList.add('pick');
      } else {
        title = 'これは拾う。';
        copy = '放っておくと現実に困るものは対応。';
        els.eventCard.classList.add('wrong');
      }
    }

    if (correct) {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      ping(item.type === 'signal' ? 540 : 420, 0.055);
      flash();
    } else {
      state.streak = 0;
      ping(170, 0.07);
    }

    els.streakValue.textContent = String(state.streak);
    els.feedbackTitle.textContent = title;
    els.feedbackText.textContent = copy;
    els.feedback.classList.add('show', correct ? 'good' : 'bad');
    els.trainingHint.textContent = correct ? '判断を長引かせない。次へ。' : '「全部無視」ではなく、必要な信号だけ拾う。';

    window.setTimeout(() => {
      state.round += 1;
      els.progressFill.style.width = `${(state.round / TOTAL_ROUNDS) * 100}%`;
      startRound();
    }, correct ? 620 : 900);
  }

  function finishSession() {
    cancelRoundTimer();
    const noiseRate = state.noiseTotal ? Math.round((state.noisePassed / state.noiseTotal) * 100) : 0;
    const signalRate = state.signalTotal ? Math.round((state.signalCaught / state.signalTotal) * 100) : 0;
    const score = (noiseRate + signalRate) ? Math.round((2 * noiseRate * signalRate) / (noiseRate + signalRate)) : 0;
    const level = levelFromScore(score);
    const stats = saveStats(score);

    els.resultScore.textContent = String(score);
    els.noisePassText.textContent = `${noiseRate}%`;
    els.signalCatchText.textContent = `${signalRate}%`;
    els.resultLevel.textContent = String(level);
    els.topLevel.textContent = String(levelFromScore(stats.best));

    const copies = {
      1: 'まずは「反応しなくていいもの」があると体で覚える段階。',
      2: '小さなノイズを、全部は拾わなくなってきた。',
      3: '「気にしない」と決める前に、通過できる回数が増えている。',
      4: '必要な信号とノイズの分離が安定してきた。',
      5: 'ノイズに毎回説明をつけず、そのまま流せている。',
      6: '必要なものだけが、注意に残る状態に近づいている。',
      7: '無風。小さなノイズは、ほとんど画面に残らない。',
    };
    els.levelCopy.textContent = copies[level];

    showScreen(els.resultScreen);
    requestAnimationFrame(() => {
      els.noisePassBar.style.width = `${noiseRate}%`;
      els.signalCatchBar.style.width = `${signalRate}%`;
    });
    renderStats();
  }

  function startSession() {
    resetSession();
    showScreen(els.trainingScreen);
    window.setTimeout(startRound, 260);
  }

  function flash() {
    els.screenFlash.classList.remove('on');
    void els.screenFlash.offsetWidth;
    els.screenFlash.classList.add('on');
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
  }

  function ping(freq, duration) {
    if (!state.sound) return;
    ensureAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.02);
  }

  els.startBtn.addEventListener('click', () => { ensureAudio(); startSession(); });
  els.againBtn.addEventListener('click', () => { ensureAudio(); startSession(); });
  els.pickBtn.addEventListener('click', () => resolveRound('pick'));
  els.soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    els.soundBtn.setAttribute('aria-pressed', String(state.sound));
    els.soundBtn.setAttribute('aria-label', state.sound ? '音をオフにする' : '音をオンにする');
    els.soundBtn.textContent = state.sound ? '♪' : '×';
    if (state.sound) { ensureAudio(); ping(460, 0.05); }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && els.trainingScreen.classList.contains('active')) {
      cancelRoundTimer();
      state.locked = true;
      els.trainingHint.textContent = '戻ったら、この12問を最初からやり直します。';
    } else if (!document.hidden && els.trainingScreen.classList.contains('active') && state.locked) {
      startSession();
    }
  });

  renderStats();
})();
