(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const openBtn = $('realExpectationButton');
  const modal = $('realExpectationModal');
  if (!openBtn || !modal) return;

  const traps = {
    mindread: { label: '察して期待', release: '察してもらう', keep: '必要なことを短く頼む', prompt: '相手に察してほしいことを、依頼文にすると？', example: '例：今日は疲れている。洗い物をお願いできる？' },
    normal: { label: '「普通は」期待', release: '自分の普通どおりに動いてもらう', keep: '自分の目的だけ進める', prompt: '相手の態度を直さず、自分の目的を進めるなら？', example: '例：必要な用件だけ確認して、この件は終える。' },
    assume: { label: 'やってあるはず期待', release: '相手が予定どおり動く前提', keep: '確認時刻と代替案を持つ', prompt: 'いつ確認し、来なかったらどうする？', example: '例：16時に確認。なければ暫定版で進める。' },
    result: { label: '評価・反応期待', release: '評価される・賛成される前提', keep: '見える化・質問・交渉へ戻す', prompt: '反応を要求せず、自分側で確認できる行動は？', example: '例：成果を3点で共有して、次の期待値を確認する。' },
    return: { label: '見返り期待', release: '善意への自動的なお返し', keep: '必要なら普通に頼み、代替案を持つ', prompt: '過去の貸しを請求書にせず、今の依頼にすると？', example: '例：今度手伝ってもらえる？ 難しければ別の手段を探す。' }
  };

  const els = {
    close: $('realExpectationClose'), situation: $('realExpectationText'), before: $('realExpectationBefore'), beforeValue: $('realExpectationBeforeValue'),
    next: $('realExpectationNext'), classify: $('realExpectationClassify'), patternButtons: [...document.querySelectorAll('[data-expect-trap]')],
    actionStep: $('realExpectationActionStep'), patternLabel: $('realExpectationPatternLabel'), release: $('realExpectationRelease'), keep: $('realExpectationKeep'),
    prompt: $('realExpectationPrompt'), action: $('realExpectationAction'), after: $('realExpectationAfter'), afterValue: $('realExpectationAfterValue'), finish: $('realExpectationFinish'),
    done: $('realExpectationDone'), doneTitle: $('realExpectationDoneTitle'), doneSummary: $('realExpectationDoneSummary'), history: $('realExpectationHistory'), again: $('realExpectationAgain')
  };
  let selected = '';
  const trim = (v) => String(v || '').trim();
  const escapeHtml = (v) => String(v).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));

  function showOnly(el) {
    [els.classify, els.actionStep, els.done].forEach((x) => { x.hidden = x !== el; });
  }
  function reset() {
    selected = '';
    els.situation.value = '';
    els.action.value = '';
    els.before.value = '7';
    els.after.value = '7';
    els.beforeValue.textContent = '7';
    els.afterValue.textContent = '7';
    els.next.disabled = true;
    els.next.textContent = 'どの期待か仕分ける';
    els.patternButtons.forEach((b) => b.classList.remove('selected'));
    showOnly(els.classify);
  }
  function open() {
    reset();
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => els.situation.focus({ preventScroll: true }));
    try { window.LevelUpTelemetry?.action?.('real-expectation-start'); } catch {}
  }
  function close() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    openBtn.focus({ preventScroll: true });
  }

  openBtn.addEventListener('click', open);
  els.close.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('show')) close(); });
  els.situation.addEventListener('input', () => { els.next.disabled = trim(els.situation.value).length < 2; });
  els.before.addEventListener('input', () => { els.beforeValue.textContent = els.before.value; });
  els.after.addEventListener('input', () => { els.afterValue.textContent = els.after.value; });
  els.next.addEventListener('click', () => {
    if (trim(els.situation.value).length < 2) return;
    els.next.textContent = '↓ 一番近い期待を選ぶ';
    els.patternButtons[0]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try { window.LevelUpTelemetry?.step?.('real-expectation-pattern'); } catch {}
  });

  els.patternButtons.forEach((button) => button.addEventListener('click', () => {
    selected = button.dataset.expectTrap;
    const item = traps[selected];
    if (!item) return;
    els.patternButtons.forEach((b) => b.classList.toggle('selected', b === button));
    els.patternLabel.textContent = item.label;
    els.release.textContent = item.release;
    els.keep.textContent = item.keep;
    els.prompt.textContent = item.prompt;
    els.action.placeholder = item.example;
    const before = Number(els.before.value);
    els.after.value = String(before);
    els.afterValue.textContent = String(before);
    showOnly(els.actionStep);
    requestAnimationFrame(() => els.action.focus({ preventScroll: true }));
    try { window.LevelUpTelemetry?.action?.(`real-expectation-${selected}`); } catch {}
  }));

  els.finish.addEventListener('click', () => {
    const item = traps[selected];
    const action = trim(els.action.value);
    if (!item || action.length < 2) { els.action.focus(); return; }
    const before = Number(els.before.value);
    const after = Number(els.after.value);
    const delta = before - after;
    els.doneTitle.textContent = delta > 0 ? '期待を、自分の一手に戻せた。' : delta === 0 ? '重さは同じ。でも相手の領域と分けた。' : '少し重くなった。相手を動かすより、自分の一手だけ残す。';
    els.doneSummary.innerHTML = `<small>頭にあった期待</small><strong>${escapeHtml(trim(els.situation.value))}</strong><small>外すもの</small><b>${escapeHtml(item.release)}</b><small>自分側に戻した一手</small><p>${escapeHtml(action)}</p><div class="expect-real-delta">期待の引っかかり ${before} → ${after}</div>`;
    save(delta, selected);
    renderHistory();
    showOnly(els.done);
    try {
      window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete', { detail: { slug: 'expect-nothing', delta, trap: selected } }));
      window.LevelUpTelemetry?.action?.(`real-expectation-effect-${delta > 0 ? 'lighter' : delta === 0 ? 'same' : 'heavier'}`);
      window.LevelUpTelemetry?.complete?.('real-expectation');
    } catch {}
  });
  els.again.addEventListener('click', open);

  function save(delta, trap) {
    try {
      const key = 'levelup-expect-nothing-real-v1';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const runs = Array.isArray(prev) ? prev.slice(-19) : [];
      runs.push({ delta, trap, at: Date.now() });
      localStorage.setItem(key, JSON.stringify(runs));
    } catch {}
  }
  function renderHistory() {
    try {
      const runs = JSON.parse(localStorage.getItem('levelup-expect-nothing-real-v1') || '[]');
      if (!Array.isArray(runs) || !runs.length) { els.history.hidden = true; return; }
      const lighter = runs.filter((r) => Number(r.delta) > 0).length;
      const counts = runs.reduce((acc, r) => (acc[r.trap] = (acc[r.trap] || 0) + 1, acc), {});
      const top = Object.keys(counts).sort((a,b) => counts[b] - counts[a])[0];
      els.history.hidden = false;
      els.history.textContent = `現実ケース ${runs.length}件中 ${lighter}件で軽減。出やすい型：${traps[top]?.label || '記録中'}。`;
    } catch { els.history.hidden = true; }
  }
})();
