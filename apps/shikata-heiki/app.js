(() => {
  'use strict';

  const TOTAL = 12;
  const STORAGE_KEY = 'levelup:shikata-heiki:v3';
  const SWIPE_THRESHOLD = 82;

  const EVENTS = [
    { stage: 1, tag: '小さな予定', plan: '電車は時間通り来る', real: '5分遅れた', line: 'ズレた。普通。' },
    { stage: 1, tag: '一日の予定', plan: '午前中に3つ終える', real: '2つしか終わらなかった', line: '予定は地図。現実は地面。' },
    { stage: 1, tag: '移動', plan: '道は空いている', real: '渋滞していた', line: '世界は予定表を読んでいない。' },
    { stage: 2, tag: '他人', plan: 'すぐ返信が来る', real: '今日は返信が来なかった', line: '相手には、相手の時間がある。' },
    { stage: 2, tag: '会議', plan: '自分の案が通る', real: '別案が選ばれた', line: '目標と結果は、別のもの。' },
    { stage: 2, tag: '協力', plan: '相手も同じ温度で進める', real: '思ったほど動かなかった', line: '他人は、自分の計画の部品ではない。' },
    { stage: 3, tag: '努力と結果', plan: '頑張れば数字が伸びる', real: '今月は目標に届かなかった', line: '努力は操作できる。結果は完全にはできない。' },
    { stage: 3, tag: '企画', plan: '良い企画なら反応がある', real: '思ったほど人が集まらなかった', line: '予測が外れた。失敗と同義ではない。' },
    { stage: 3, tag: '仕事', plan: '準備すれば予定通り終わる', real: '想定外が重なって遅れた', line: '現実には、必ず未計画が混ざる。' },
    { stage: 4, tag: '大事な目標', plan: 'ここまで来たら達成したい', real: 'あと少しで届かなかった', line: '悔しくても、起きた事実とは戦わない。' },
    { stage: 4, tag: 'コントロール外', plan: 'この日だけは晴れてほしい', real: '雨になった', line: '望んでいい。でも、天気に従う義務はない。' },
    { stage: 4, tag: '現実', plan: 'できれば全部うまくいってほしい', real: 'いくつかは、うまくいかなかった', line: '思い通りになる方が、むしろ特別。' },
  ];

  const els = Object.fromEntries([
    'startScreen','trainingScreen','resultScreen','realScreen','startBtn','realBtn','resultRealBtn','againBtn','soundBtn','topLevel',
    'sessionCount','acceptCount','bestTime','localStats','roundText','stageLabel','speedText','progressFill','gapField','gapCard','eventTag',
    'planText','realText','gapDot','swipeCue','feedback','feedbackTitle','feedbackText','fallbackBtn','resultLevel','resultCopy','avgTime',
    'sessionAccept','closeRealBtn','inputStep','releaseStep','wishInput','actualInput','makeGapBtn','wishPreview','actualPreview','releaseTrack',
    'releaseKnob','releaseResult','actionInput','finishRealBtn','flash'
  ].map((id) => [id, document.getElementById(id)]));

  const state = { sound: true, round: 0, startedAt: 0, times: [], locked: false, drag: null, releaseDrag: null };
  let audioCtx = null;

  function readStats() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { sessions: Number(value.sessions) || 0, accepts: Number(value.accepts) || 0, bestTime: Number(value.bestTime) || 0 };
    } catch { return { sessions: 0, accepts: 0, bestTime: 0 }; }
  }

  function writeStats(avg) {
    const prev = readStats();
    const next = {
      sessions: prev.sessions + 1,
      accepts: prev.accepts + TOTAL,
      bestTime: prev.bestTime > 0 ? Math.min(prev.bestTime, avg) : avg,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function levelFor(stats) {
    const n = stats.accepts;
    if (n >= 240) return 5;
    if (n >= 120) return 4;
    if (n >= 60) return 3;
    if (n >= 24) return 2;
    return 1;
  }

  function renderStats() {
    const stats = readStats();
    els.sessionCount.textContent = String(stats.sessions);
    els.acceptCount.textContent = String(stats.accepts);
    els.bestTime.textContent = stats.bestTime ? stats.bestTime.toFixed(1) : '–';
    els.topLevel.textContent = String(levelFor(stats));
    els.localStats.hidden = stats.sessions === 0;
  }

  function show(screen) {
    [els.startScreen, els.trainingScreen, els.resultScreen, els.realScreen].forEach((el) => el.classList.remove('active'));
    screen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function stageName(stage) {
    return ['','小さなズレ','他人は動かせない','努力 ≠ 結果','どうにもならない現実'][stage];
  }

  function startTraining() {
    state.round = 0;
    state.times = [];
    state.locked = false;
    show(els.trainingScreen);
    renderRound();
  }

  function renderRound() {
    if (state.round >= TOTAL) return finishTraining();
    const item = EVENTS[state.round];
    state.locked = false;
    state.drag = null;
    state.startedAt = performance.now();
    els.roundText.textContent = `${state.round + 1} / ${TOTAL}`;
    els.stageLabel.textContent = stageName(item.stage);
    els.progressFill.style.width = `${(state.round / TOTAL) * 100}%`;
    els.eventTag.textContent = item.tag;
    els.planText.textContent = item.plan;
    els.realText.textContent = item.real;
    els.gapCard.style.transform = '';
    els.gapCard.style.opacity = '';
    els.gapCard.className = 'gap-card enter';
    els.feedback.className = 'feedback';
    els.swipeCue.classList.remove('hidden');
    const gap = 18 + (item.stage * 12);
    els.gapDot.style.transform = `translateX(${gap}px)`;
    if (state.times.length) {
      const latest = state.times[state.times.length - 1];
      els.speedText.textContent = `${latest.toFixed(1)}s`;
    } else els.speedText.textContent = '–';
  }

  function acceptRound(direction = 1) {
    if (state.locked) return;
    state.locked = true;
    const item = EVENTS[state.round];
    const elapsed = Math.min(9.9, (performance.now() - state.startedAt) / 1000);
    state.times.push(elapsed);
    els.speedText.textContent = `${elapsed.toFixed(1)}s`;
    els.swipeCue.classList.add('hidden');
    els.gapCard.classList.add('accepted');
    els.gapCard.style.transform = `translateX(${direction * 115}px) rotate(${direction * 3}deg)`;
    els.gapCard.style.opacity = '.16';
    els.feedbackTitle.textContent = item.line;
    els.feedbackText.textContent = item.stage >= 4 ? '受け入れるのは、賛成することではない。事実との抵抗をやめるだけ。' : 'まず事実を置く。修正は、そのあとでいい。';
    els.feedback.classList.add('show');
    ping(item.stage >= 4 ? 330 : 420, .07);
    vibrate(18);
    flash();
    window.setTimeout(() => {
      state.round += 1;
      els.progressFill.style.width = `${(state.round / TOTAL) * 100}%`;
      renderRound();
    }, item.stage >= 4 ? 1100 : 780);
  }

  function finishTraining() {
    const avg = state.times.reduce((a, b) => a + b, 0) / Math.max(1, state.times.length);
    const stats = writeStats(avg);
    const level = levelFor(stats);
    els.resultLevel.textContent = `Lv.${level}`;
    els.avgTime.textContent = avg.toFixed(1);
    els.sessionAccept.textContent = String(TOTAL);
    const copy = {
      1: '小さなズレを「失敗」ではなく、ただの現実として置く練習が始まった。',
      2: '予定から外れた瞬間に、すぐ異常事態にしない回数が増えている。',
      3: '他人や結果まで予定通りにしようとする力みを、少し早く手放せている。',
      4: '大事な目標がズレても、「そうなったか」から立て直す型が育っている。',
      5: '目標は持つ。現実とは戦わない。その両立が反射になってきた。',
    };
    els.resultCopy.textContent = copy[level];
    renderStats();
    show(els.resultScreen);
  }

  function pointX(event) { return event.touches?.[0]?.clientX ?? event.changedTouches?.[0]?.clientX ?? event.clientX; }

  function beginCardDrag(event) {
    if (state.locked) return;
    state.drag = { x: pointX(event) || 0 };
    els.gapCard.classList.add('dragging');
  }

  function moveCardDrag(event) {
    if (!state.drag || state.locked) return;
    const dx = (pointX(event) || 0) - state.drag.x;
    els.gapCard.style.transform = `translateX(${dx}px) rotate(${dx * .025}deg)`;
    els.gapCard.style.opacity = String(Math.max(.35, 1 - Math.abs(dx) / 260));
    if (Math.abs(dx) > 8) event.preventDefault();
  }

  function endCardDrag(event) {
    if (!state.drag || state.locked) return;
    const dx = (pointX(event) || 0) - state.drag.x;
    state.drag = null;
    els.gapCard.classList.remove('dragging');
    if (Math.abs(dx) >= SWIPE_THRESHOLD) acceptRound(dx >= 0 ? 1 : -1);
    else {
      els.gapCard.style.transform = '';
      els.gapCard.style.opacity = '';
    }
  }

  function openReal() {
    els.wishInput.value = '';
    els.actualInput.value = '';
    els.actionInput.value = '';
    els.inputStep.hidden = false;
    els.releaseStep.hidden = true;
    els.releaseResult.hidden = true;
    resetReleaseKnob();
    show(els.realScreen);
    window.setTimeout(() => els.wishInput.focus({ preventScroll: true }), 160);
  }

  function buildRealGap() {
    const wish = els.wishInput.value.trim();
    const actual = els.actualInput.value.trim();
    if (!wish || !actual) {
      const target = !wish ? els.wishInput : els.actualInput;
      target.classList.remove('shake'); void target.offsetWidth; target.classList.add('shake'); target.focus();
      return;
    }
    els.wishPreview.textContent = wish;
    els.actualPreview.textContent = actual;
    els.inputStep.hidden = true;
    els.releaseStep.hidden = false;
    els.releaseResult.hidden = true;
    resetReleaseKnob();
  }

  function resetReleaseKnob() {
    els.releaseKnob.style.transform = 'translateX(0px)';
    els.releaseTrack.classList.remove('done');
    state.releaseDrag = null;
  }

  function beginRelease(event) {
    if (els.releaseTrack.classList.contains('done')) return;
    state.releaseDrag = { x: pointX(event) || 0 };
  }

  function moveRelease(event) {
    if (!state.releaseDrag) return;
    const max = Math.max(120, els.releaseTrack.clientWidth - els.releaseKnob.offsetWidth - 18);
    const dx = Math.max(0, Math.min(max, (pointX(event) || 0) - state.releaseDrag.x));
    els.releaseKnob.style.transform = `translateX(${dx}px)`;
    if (dx > 4) event.preventDefault();
  }

  function endRelease(event) {
    if (!state.releaseDrag) return;
    const max = Math.max(120, els.releaseTrack.clientWidth - els.releaseKnob.offsetWidth - 18);
    const dx = Math.max(0, Math.min(max, (pointX(event) || 0) - state.releaseDrag.x));
    state.releaseDrag = null;
    if (dx >= max * .72) completeRelease(max);
    else els.releaseKnob.style.transform = 'translateX(0px)';
  }

  function completeRelease(max) {
    els.releaseKnob.style.transform = `translateX(${max}px)`;
    els.releaseTrack.classList.add('done');
    ping(380, .09); vibrate(22); flash();
    window.setTimeout(() => {
      els.releaseResult.hidden = false;
      els.releaseResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 240);
  }

  function finishReal() {
    els.wishInput.value = '';
    els.actualInput.value = '';
    els.actionInput.value = '';
    show(els.startScreen);
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
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.028, audioCtx.currentTime + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration + .03);
  }

  function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }
  function flash() { els.flash.classList.remove('on'); void els.flash.offsetWidth; els.flash.classList.add('on'); }

  els.startBtn.addEventListener('click', () => { ensureAudio(); startTraining(); });
  els.againBtn.addEventListener('click', () => { ensureAudio(); startTraining(); });
  els.realBtn.addEventListener('click', openReal);
  els.resultRealBtn.addEventListener('click', openReal);
  els.closeRealBtn.addEventListener('click', () => show(els.startScreen));
  els.makeGapBtn.addEventListener('click', buildRealGap);
  els.finishRealBtn.addEventListener('click', finishReal);
  els.fallbackBtn.addEventListener('click', () => acceptRound(1));

  els.gapCard.addEventListener('pointerdown', beginCardDrag);
  window.addEventListener('pointermove', moveCardDrag, { passive: false });
  window.addEventListener('pointerup', endCardDrag);
  els.gapCard.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') acceptRound(-1);
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); acceptRound(1); }
  });

  els.releaseKnob.addEventListener('pointerdown', beginRelease);
  window.addEventListener('pointermove', moveRelease, { passive: false });
  window.addEventListener('pointerup', endRelease);

  els.soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    els.soundBtn.textContent = state.sound ? '♪' : '×';
    els.soundBtn.setAttribute('aria-pressed', String(state.sound));
    els.soundBtn.setAttribute('aria-label', state.sound ? '音をオフにする' : '音をオンにする');
    if (state.sound) { ensureAudio(); ping(440, .05); }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && els.trainingScreen.classList.contains('active')) state.startedAt = performance.now();
  });

  renderStats();
})();
