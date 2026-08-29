(() => {
  'use strict';

  const STORAGE_KEY = 'levelup-negotiator-procrastination-v1';
  const RESISTANCE = {
    time: { label: '時間がない', line: '時間は増やしません。むしろ削ります。' },
    mood: { label: '気分が乗らない', line: 'やる気は交渉条件から外します。動作だけにします。' },
    heavy: { label: 'まだ重い', line: '重いなら、もっと小さくします。終わらせる話はしません。' },
    unclear: { label: '何から始めるか曖昧', line: '決める量を減らします。最初の1操作だけにします。' },
    perfect: { label: 'ちゃんとやりたい', line: '品質は今の契約から外します。雑な着手だけで成立です。' },
    energy: { label: '体力・気力がない', line: '負荷を下げます。最小の接触だけにします。' },
    later: { label: '今じゃない', line: '「後で」は時間が曖昧です。今の要求をさらに短くします。' }
  };

  const STAGES = [
    {
      seconds: 1500,
      label: '25分',
      chip: '25:00',
      stage: 'OPENING OFFER',
      speech: '先延ばし中ですね。では直球で。<strong>今から25分</strong>、やれますか？',
      accept: 'できる。25分やる',
      rejects: [
        { label: '無理。そんな時間ない', reason: 'time' },
        { label: 'いや。気分が乗らない', reason: 'mood' }
      ]
    },
    {
      seconds: 300,
      label: '5分',
      chip: '05:00',
      stage: 'CONCESSION 01',
      speech: '<strong>25分は撤回します。</strong>5分だけならどうですか？ 終わらなくていい。5分で打ち切っていい。',
      accept: '5分ならやる',
      rejects: [
        { label: '5分でも長い', reason: 'heavy' },
        { label: '始めたら長引きそう', reason: 'time' }
      ]
    },
    {
      seconds: 60,
      label: '60秒',
      chip: '01:00',
      stage: 'CONCESSION 02',
      speech: 'では、<strong>60秒。</strong>成果は要りません。「着手した」という事実だけ作る。',
      accept: '60秒ならできる',
      rejects: [
        { label: '何から始めるか決まってない', reason: 'unclear' },
        { label: 'まだやる気がない', reason: 'mood' }
      ]
    },
    {
      seconds: 30,
      label: '30秒',
      chip: '00:30',
      stage: 'CONCESSION 03',
      speech: 'やる気も完成も要りません。<strong>30秒だけ、対象に触れる。</strong>それで契約終了です。',
      accept: '30秒だけやる',
      rejects: [
        { label: '中途半端なら意味ない', reason: 'perfect' },
        { label: '今じゃなくてもいい', reason: 'later' }
      ]
    },
    {
      seconds: 10,
      label: '10秒',
      chip: '00:10',
      stage: 'CONCESSION 04',
      speech: '意味があるかは後で決めましょう。今は<strong>10秒だけ。</strong>雑でいい。途中で終えていい。',
      accept: '10秒ならやる',
      rejects: [
        { label: 'それでもまだ重い', reason: 'heavy' },
        { label: '今日は疲れてる', reason: 'energy' }
      ]
    },
    {
      seconds: 5,
      label: '5秒',
      chip: '00:05',
      stage: 'LAST CONCESSION',
      speech: 'わかりました。最後に<strong>5秒だけ。</strong>作業ではなく、対象を開く・道具を出す・最初の1操作。どれか1つ。',
      accept: '5秒だけならやる',
      rejects: [
        { label: 'それすら今は嫌', reason: 'energy' },
        { label: '今日はやらないと決める', reason: 'quit', quit: true }
      ]
    },
    {
      seconds: 1,
      label: '1秒',
      chip: '00:01',
      stage: 'FINAL OFFER',
      speech: 'では1秒。<strong>対象を見るだけ。</strong>やる義務はありません。見るか、今日はやらないか。あなたが決めてください。',
      accept: '見る。1秒だけ',
      rejects: [
        { label: 'まだ無理', reason: 'energy', final: true },
        { label: '今日はやらない', reason: 'quit', quit: true }
      ]
    }
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ['negotiationScreen', 'prepScreen', 'timerScreen', 'resultScreen', 'failScreen'];
  const els = {
    speech: $('speech'), choices: $('choices'), askChip: $('askChip'), askTrackFill: $('askTrackFill'),
    stageLabel: $('stageLabel'), concession: $('concession'), sessionHint: $('sessionHint'), subcopy: $('subcopy'),
    prepScreen: $('prepScreen'), negotiationScreen: $('negotiationScreen'), timerScreen: $('timerScreen'),
    resultScreen: $('resultScreen'), failScreen: $('failScreen'), exitBtn: $('exitBtn'), exitModal: $('exitModal'),
    stayBtn: $('stayBtn'), backToNegotiation: $('backToNegotiation'), selectedAction: $('selectedAction'),
    timerNumber: $('timerNumber'), timerRing: $('timerRing'), timerNote: $('timerNote'), startActionBtn: $('startActionBtn'),
    didStartBtn: $('didStartBtn'), resultLead: $('resultLead'), initialAsk: $('initialAsk'), finalAsk: $('finalAsk'),
    topResistance: $('topResistance'), resultInsight: $('resultInsight'), statsRow: $('statsRow'),
    continueBtn: $('continueBtn'), shareBtn: $('shareBtn'), againBtn: $('againBtn'), failResistance: $('failResistance'),
    retryTinyBtn: $('retryTinyBtn'), toast: $('toast')
  };

  let stats = loadStats();
  let state = freshState();
  let timerId = null;
  let timerStart = 0;

  function freshState(startIndex = 0) {
    return {
      stageIndex: startIndex,
      initialStageIndex: startIndex,
      resistances: {},
      resistanceHistory: [],
      agreedSeconds: null,
      agreedLabel: '',
      action: '',
      timerSeconds: 0,
      completed: false,
      continuation: false
    };
  }

  function loadStats() {
    try {
      return Object.assign({ sessions: 0, starts: 0, failures: 0, resistances: {}, lastOutcome: '', lastTopResistance: '' }, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch (_) {
      return { sessions: 0, starts: 0, failures: 0, resistances: {}, lastOutcome: '', lastTopResistance: '' };
    }
  }

  function saveStats() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch (_) {}
  }

  function buzz(pattern = 9) {
    try { navigator.vibrate?.(pattern); } catch (_) {}
  }

  function showToast(text) {
    els.toast.textContent = text;
    els.toast.classList.add('show');
    window.setTimeout(() => els.toast.classList.remove('show'), 1500);
  }

  function showScreen(id) {
    screens.forEach((screenId) => $(screenId).classList.toggle('active', screenId === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function topResistance(map = state.resistances) {
    const entries = Object.entries(map).filter(([key]) => key !== 'quit');
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || null;
  }

  function adaptiveStartIndex() {
    if (stats.lastOutcome === 'failed') return 4;
    if (!stats.sessions) return 0;
    const strongest = topResistance(stats.resistances);
    const startByResistance = {
      time: 1,
      mood: 2,
      heavy: 3,
      unclear: 2,
      perfect: 3,
      energy: 4,
      later: 3
    };
    return strongest ? (startByResistance[strongest] ?? 0) : 0;
  }

  function renderNegotiation({ announce = false } = {}) {
    const stage = STAGES[state.stageIndex];
    const max = STAGES[state.initialStageIndex].seconds;
    const pct = Math.max(2, (stage.seconds / max) * 100);

    els.stageLabel.textContent = stage.stage;
    els.askChip.textContent = stage.chip;
    els.askTrackFill.style.width = `${pct}%`;
    els.speech.innerHTML = contextualSpeech(stage);
    els.choices.innerHTML = '';

    els.choices.appendChild(makeChoice(
      stage.accept,
      state.stageIndex === state.initialStageIndex ? 'この条件を受ける' : `${stage.label}まで条件が縮みました`,
      'accept',
      () => acceptStage(stage)
    ));

    stage.rejects.forEach((item) => {
      const note = item.quit ? '交渉を打ち切る' : RESISTANCE[item.reason]?.label || '条件を変える';
      els.choices.appendChild(makeChoice(item.label, note, item.quit ? 'quit' : '', () => rejectStage(item)));
    });

    if (announce && state.resistanceHistory.length) {
      const last = state.resistanceHistory[state.resistanceHistory.length - 1];
      const previous = STAGES[Math.max(state.stageIndex - 1, 0)];
      els.concession.hidden = false;
      els.concession.textContent = `${RESISTANCE[last]?.line || '条件を変えます。'}　${previous.label} → ${stage.label}`;
    } else {
      els.concession.hidden = true;
    }

    if (stats.sessions > 0) {
      const remembered = stats.lastTopResistance && RESISTANCE[stats.lastTopResistance]?.label;
      els.sessionHint.hidden = false;
      els.sessionHint.textContent = remembered
        ? `この端末では ${stats.sessions}回交渉。前回まで多かった抵抗：「${remembered}」→ 今回は${STAGES[state.initialStageIndex].label}から。`
        : `この端末では ${stats.sessions}回交渉しています。`;
    } else {
      els.sessionHint.hidden = true;
    }

    showScreen('negotiationScreen');
    if (announce) buzz(12);
  }

  function contextualSpeech(stage) {
    if (!state.resistanceHistory.length) return stage.speech;
    const reason = state.resistanceHistory[state.resistanceHistory.length - 1];
    const preface = RESISTANCE[reason]?.line;
    return preface ? `<small style="display:block;color:#9b9b96;font-size:12px;line-height:1.6;margin-bottom:8px;font-weight:700">${preface}</small>${stage.speech}` : stage.speech;
  }

  function makeChoice(label, note, type, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `choice-btn ${type || ''}`.trim();
    button.innerHTML = `<span>${escapeHtml(label)}<small>${escapeHtml(note)}</small></span><b>${type === 'accept' ? '→' : type === 'quit' ? '×' : '↘'}</b>`;
    button.addEventListener('click', handler);
    return button;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function acceptStage(stage) {
    state.agreedSeconds = stage.seconds;
    state.agreedLabel = stage.label;
    state.continuation = false;
    buzz(18);
    showScreen('prepScreen');
  }

  function rejectStage(item) {
    if (item.quit || item.final) {
      if (item.reason && item.reason !== 'quit') recordResistance(item.reason);
      failNegotiation();
      return;
    }
    recordResistance(item.reason);
    if (state.stageIndex < STAGES.length - 1) {
      state.stageIndex += 1;
      renderNegotiation({ announce: true });
    } else {
      failNegotiation();
    }
  }

  function recordResistance(reason) {
    state.resistances[reason] = (state.resistances[reason] || 0) + 1;
    state.resistanceHistory.push(reason);
  }

  function chooseAction(action) {
    state.action = action;
    state.continuation = false;
    state.timerSeconds = Math.max(1, Math.min(30, state.agreedSeconds || 30));
    els.selectedAction.textContent = action;
    els.timerNumber.textContent = String(state.timerSeconds);
    els.timerRing.style.setProperty('--progress', '0deg');
    els.timerNote.textContent = state.agreedSeconds > 30
      ? `${state.agreedLabel}の約束はそのまま。まず最初の30秒だけ計測します。`
      : `${state.agreedLabel}だけやったら、そこで止めても契約成立です。`;
    els.startActionBtn.hidden = false;
    els.didStartBtn.hidden = true;
    els.startActionBtn.querySelector('span').textContent = 'タイマー開始';
    showScreen('timerScreen');
    buzz(10);
  }

  function startTimer() {
    clearInterval(timerId);
    const total = state.timerSeconds * 1000;
    timerStart = performance.now();
    els.startActionBtn.hidden = true;
    els.didStartBtn.hidden = false;
    els.didStartBtn.textContent = state.continuation ? 'ここで終える' : 'もう始めた';
    tickTimer();
    timerId = window.setInterval(tickTimer, 100);
    buzz(16);

    function tickTimer() {
      const elapsed = performance.now() - timerStart;
      const remaining = Math.max(0, total - elapsed);
      const seconds = Math.ceil(remaining / 1000);
      const progress = Math.min(1, elapsed / total);
      els.timerNumber.textContent = String(seconds);
      els.timerRing.style.setProperty('--progress', `${progress * 360}deg`);
      if (remaining <= 0) completeSuccess('timer');
    }
  }

  function completeSuccess(source) {
    if (state.completed) return;
    state.completed = true;
    clearInterval(timerId);
    timerId = null;

    if (state.continuation) {
      state.continuation = false;
      showScreen('resultScreen');
      showToast(source === 'timer' ? '追加の5分、完了' : 'ここまででOK');
      buzz([18, 28, 18]);
      return;
    }

    const top = topResistance();
    stats.sessions += 1;
    stats.starts += 1;
    stats.lastOutcome = 'started';
    stats.lastTopResistance = top || '';
    Object.entries(state.resistances).forEach(([key, value]) => {
      stats.resistances[key] = (stats.resistances[key] || 0) + value;
    });
    saveStats();

    els.initialAsk.textContent = STAGES[state.initialStageIndex].label;
    els.finalAsk.textContent = state.agreedLabel;
    els.topResistance.textContent = top ? RESISTANCE[top]?.label : '抵抗なし';
    els.resultLead.textContent = source === 'button'
      ? `「${state.action}」を始めた時点で交渉成立。全部終わらせなくても、先延ばし状態からは一度抜けました。`
      : `約束した時間だけ「${state.action}」に触れました。全部終わらせる契約ではありません。開始したことが今回の成果です。`;
    els.resultInsight.textContent = insightFor(top);
    els.statsRow.innerHTML = `
      <div><strong>${stats.sessions}</strong><span>SESSIONS</span></div>
      <div><strong>${stats.starts}</strong><span>STARTS</span></div>
      <div><strong>${Math.round((stats.starts / Math.max(1, stats.sessions)) * 100)}%</strong><span>START RATE</span></div>`;

    showScreen('resultScreen');
    buzz([22, 40, 22]);
  }

  function insightFor(reason) {
    const map = {
      time: '今回は「長くやること」が壁でした。次回は、時間を確保する前に要求時間を削る方が入りやすそうです。',
      mood: '今回は気分が開始条件になっていました。次回も「やる気」ではなく、対象を開く動作から交渉します。',
      heavy: '今回は要求サイズそのものが重かったようです。次回は最初から短い契約に寄せます。',
      unclear: '今回は最初の一手が曖昧でした。次回も「何を終えるか」ではなく「最初の1操作」を先に決めます。',
      perfect: '今回は品質への要求が開始を重くしていました。次回も「雑な着手」と本番品質を分けます。',
      energy: '今回は気力・体力が壁でした。次回は立つ・集中する前提を置かず、接触だけから始めます。',
      later: '今回は「今じゃない」が壁でした。次回は曖昧な後回しではなく、今の数秒だけを交渉対象にします。'
    };
    return reason ? map[reason] : '今回は最初の条件でそのまま着手できました。次回も余計な交渉を増やさず、その条件から始めます。';
  }

  function failNegotiation() {
    clearInterval(timerId);
    timerId = null;
    const top = topResistance();
    stats.sessions += 1;
    stats.failures += 1;
    stats.lastOutcome = 'failed';
    stats.lastTopResistance = top || '';
    Object.entries(state.resistances).forEach(([key, value]) => {
      stats.resistances[key] = (stats.resistances[key] || 0) + value;
    });
    saveStats();
    els.failResistance.textContent = top ? RESISTANCE[top]?.label : '今日はやらない';
    showScreen('failScreen');
  }

  function restart(startIndex = adaptiveStartIndex()) {
    clearInterval(timerId);
    timerId = null;
    state = freshState(startIndex);
    els.subcopy.textContent = startIndex > 0
      ? `前回までの抵抗に合わせて、今回は${STAGES[startIndex].label}から。断っても、また条件を変えます。`
      : '断っていい。条件を変えて、あなたが動けるところまで交渉します。';
    renderNegotiation();
  }

  async function shareResult() {
    const text = `${STAGES[state.initialStageIndex].label}は断った。でも${state.agreedLabel}で「${state.action}」を始めた。\nNEGOTIATOR｜先延ばしをやめろ`;
    const url = `${location.origin}/apps/negotiator-procrastination/`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NEGOTIATOR｜先延ばしをやめろ', text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        showToast('結果をコピーしました');
      } else {
        showToast('この端末では共有できません');
      }
    } catch (_) {}
  }

  function continueFiveMinutes() {
    state.agreedSeconds = 300;
    state.agreedLabel = '5分';
    state.timerSeconds = 300;
    state.action = state.action || 'このまま続ける';
    state.completed = false;
    state.continuation = true;
    els.selectedAction.textContent = state.action;
    els.timerNumber.textContent = '300';
    els.timerNote.textContent = '追加の5分です。いつでも終了して構いません。';
    els.timerRing.style.setProperty('--progress', '0deg');
    els.startActionBtn.hidden = false;
    els.didStartBtn.hidden = true;
    els.startActionBtn.querySelector('span').textContent = '5分スタート';
    showScreen('timerScreen');
  }

  document.querySelectorAll('#actionGrid button').forEach((button) => {
    button.addEventListener('click', () => chooseAction(button.dataset.action || '最初の1操作をする'));
  });

  els.backToNegotiation.addEventListener('click', () => renderNegotiation());
  els.startActionBtn.addEventListener('click', startTimer);
  els.didStartBtn.addEventListener('click', () => completeSuccess('button'));
  els.continueBtn.addEventListener('click', continueFiveMinutes);
  els.shareBtn.addEventListener('click', shareResult);
  els.againBtn.addEventListener('click', () => restart());
  els.retryTinyBtn.addEventListener('click', () => restart(4));

  els.exitBtn.addEventListener('click', () => { els.exitModal.hidden = false; buzz(8); });
  els.stayBtn.addEventListener('click', () => { els.exitModal.hidden = true; });
  els.exitModal.addEventListener('click', (event) => { if (event.target === els.exitModal) els.exitModal.hidden = true; });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') els.exitModal.hidden = true; });

  restart();
})();
