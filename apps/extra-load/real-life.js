(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const patterns = {
    control: { name: '変えられる一手だけ。', drop: '相手・結果まで背負う', prompt: '今、自分が動かせる一手だけ残すなら？', placeholder: '例：確認事項を3つにして、相手へ送る。' },
    one: { name: '一個だけ。', drop: '全部を同時に頭へ載せる', prompt: '次にやる一個だけ残すなら？', placeholder: '例：最初の25分は、資料の1ページ目だけ作る。' },
    enough: { name: '十分で出す。', drop: '必要以上の完成度を足す', prompt: '目的を満たす最低ラインは？', placeholder: '例：判断できる3案まで作って、一度見せる。' },
    end: { name: 'ここで終わり。', drop: '終わった出来事を再生し続ける', prompt: '次回変える一つだけ残すなら？', placeholder: '例：次回は冒頭で結論を先に言う。' },
    hold: { name: '今は保留。', drop: '今決めなくていいことを考え続ける', prompt: 'いつ・何が揃ったら再判断する？', placeholder: '例：金曜17時に返事を確認してから決める。' }
  };

  const els = {
    result: $('resultScreen'), real: $('realScreen'), done: $('realDoneScreen'), realBtn: $('realBtn'), retry: $('retryBtn'),
    inputStep: $('realInputStep'), patternStep: $('realPatternStep'), keepStep: $('realKeepStep'), afterStep: $('realAfterStep'),
    loadText: $('realLoadText'), beforeRange: $('realBeforeRange'), beforeValue: $('realBeforeValue'), analyze: $('realAnalyzeBtn'),
    patternGrid: $('realPatternGrid'), dropCopy: $('realDropCopy'), keepPrompt: $('realKeepPrompt'), keepText: $('realKeepText'), keepBtn: $('realKeepBtn'),
    keptAction: $('realKeptAction'), afterRange: $('realAfterRange'), afterValue: $('realAfterValue'), finish: $('realFinishBtn'),
    beforeResult: $('realBeforeResult'), afterResult: $('realAfterResult'), doneTitle: $('realDoneTitle'), originalResult: $('realOriginalResult'), patternResult: $('realPatternResult'), keepResult: $('realKeepResult'),
    history: $('realEffectHistory'), again: $('realAgainBtn'), trainAgain: $('realTrainAgainBtn'), start: $('startBtn')
  };

  let selectedPattern = '';

  const showScreen = (target) => {
    screens.forEach((screen) => screen.classList.toggle('active', screen === target));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const showStep = (target) => {
    [els.inputStep, els.patternStep, els.keepStep, els.afterStep].forEach((step) => {
      const active = step === target;
      step.hidden = !active;
      step.classList.toggle('active', active);
    });
  };
  const trim = (value) => String(value || '').trim();

  function resetRealFlow() {
    selectedPattern = '';
    els.loadText.value = '';
    els.keepText.value = '';
    els.beforeRange.value = '6';
    els.afterRange.value = '6';
    els.beforeValue.textContent = '6';
    els.afterValue.textContent = '6';
    els.analyze.disabled = true;
    els.keepBtn.disabled = true;
    [...els.patternGrid.querySelectorAll('button')].forEach((button) => button.classList.remove('selected'));
    showStep(els.inputStep);
  }

  function beginRealFlow() {
    resetRealFlow();
    showScreen(els.real);
    requestAnimationFrame(() => els.loadText.focus({ preventScroll: true }));
    try { window.LevelUpTelemetry?.action?.('real-life-start'); } catch {}
  }

  function updateHistory(delta) {
    const key = 'levelup-extra-load-real-v1';
    try {
      const prev = JSON.parse(localStorage.getItem(key) || '{}') || {};
      const runs = Array.isArray(prev.runs) ? prev.runs.slice(-29) : [];
      runs.push({ delta, before: Number(els.beforeRange.value), after: Number(els.afterRange.value), pattern: selectedPattern, at: Date.now() });
      const positive = runs.filter((run) => Number(run.delta) > 0).length;
      const avg = runs.length ? runs.reduce((sum, run) => sum + Number(run.delta || 0), 0) / runs.length : 0;
      localStorage.setItem(key, JSON.stringify({ runs, updatedAt: Date.now() }));
      els.history.hidden = false;
      els.history.textContent = runs.length === 1
        ? '初回の実物トレーニングを記録しました。次回は同じ型で軽くなるか比較できます。'
        : `実物トレーニング ${runs.length}回中 ${positive}回で軽減。平均変化 ${avg >= 0 ? '−' : '＋'}${Math.abs(avg).toFixed(1)}。`;
    } catch {
      els.history.hidden = true;
    }
  }

  els.realBtn?.addEventListener('click', beginRealFlow);
  els.loadText?.addEventListener('input', () => { els.analyze.disabled = trim(els.loadText.value).length < 2; });
  els.beforeRange?.addEventListener('input', () => { els.beforeValue.textContent = els.beforeRange.value; });
  els.afterRange?.addEventListener('input', () => { els.afterValue.textContent = els.afterRange.value; });

  els.analyze?.addEventListener('click', () => {
    if (trim(els.loadText.value).length < 2) return;
    showStep(els.patternStep);
    try { window.LevelUpTelemetry?.step?.('real-life-pattern'); } catch {}
  });

  els.patternGrid?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pattern]');
    if (!button) return;
    selectedPattern = button.dataset.pattern;
    const pattern = patterns[selectedPattern];
    if (!pattern) return;
    [...els.patternGrid.querySelectorAll('button')].forEach((item) => item.classList.toggle('selected', item === button));
    els.dropCopy.textContent = pattern.drop;
    els.keepPrompt.textContent = pattern.prompt;
    els.keepText.placeholder = pattern.placeholder;
    showStep(els.keepStep);
    requestAnimationFrame(() => els.keepText.focus({ preventScroll: true }));
    try { window.LevelUpTelemetry?.action?.(`real-pattern-${selectedPattern}`); } catch {}
  });

  els.keepText?.addEventListener('input', () => { els.keepBtn.disabled = trim(els.keepText.value).length < 2; });
  els.keepBtn?.addEventListener('click', () => {
    const action = trim(els.keepText.value);
    if (action.length < 2 || !patterns[selectedPattern]) return;
    els.keptAction.textContent = action;
    const before = Number(els.beforeRange.value);
    els.afterRange.value = String(before);
    els.afterValue.textContent = String(before);
    showStep(els.afterStep);
    try { window.LevelUpTelemetry?.step?.('real-life-after'); } catch {}
  });

  els.finish?.addEventListener('click', () => {
    const before = Number(els.beforeRange.value);
    const after = Number(els.afterRange.value);
    const delta = before - after;
    const pattern = patterns[selectedPattern] || patterns.one;
    els.beforeResult.textContent = String(before);
    els.afterResult.textContent = String(after);
    els.originalResult.textContent = trim(els.loadText.value);
    els.patternResult.textContent = pattern.name;
    els.keepResult.textContent = trim(els.keepText.value);
    if (delta >= 3) els.doneTitle.innerHTML = 'かなり下ろせた。<br>残すのは一手だけ。';
    else if (delta >= 1) els.doneTitle.innerHTML = '少し下ろせた。<br>必要な分だけ残した。';
    else if (delta === 0) els.doneTitle.innerHTML = '重さは同じ。<br>でも荷物の形は分かった。';
    else els.doneTitle.innerHTML = '少し重くなった。<br>無理に軽くしなくていい。';
    updateHistory(delta);
    showScreen(els.done);
    try {
      window.dispatchEvent(new CustomEvent('levelup:played', { detail: { slug: 'extra-load', score: Math.max(0, Math.min(100, 50 + delta * 10)), effectDelta: delta } }));
      window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete', { detail: { slug: 'extra-load', delta, pattern: selectedPattern } }));
      window.LevelUpTelemetry?.action?.(`real-effect-${delta > 0 ? 'lighter' : delta === 0 ? 'same' : 'heavier'}`);
      window.LevelUpTelemetry?.complete?.('real-life');
    } catch {}
  });

  els.again?.addEventListener('click', beginRealFlow);
  els.trainAgain?.addEventListener('click', () => {
    showScreen(document.getElementById('introScreen'));
    els.start?.focus({ preventScroll: true });
  });
})();
