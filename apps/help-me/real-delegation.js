(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const resultModal = $('resultModal');
  const openBtn = $('realDelegateButton');
  const modal = $('realDelegateModal');
  if (!resultModal || !openBtn || !modal) return;

  const els = {
    close: $('realDelegateClose'), task: $('realTaskText'), deadline: $('realDeadline'),
    before: $('realBeforeRange'), beforeValue: $('realBeforeValue'), classify: $('realClassifyButton'),
    typeStep: $('realDelegateTypeStep'), typeGrid: $('realDelegateTypeGrid'), planStep: $('realDelegatePlanStep'),
    target: $('realDelegateTarget'), keep: $('realDelegateKeep'), ask: $('realDelegateAsk'),
    after: $('realDelegateAfterRange'), afterValue: $('realDelegateAfterValue'), finish: $('realDelegateFinish'),
    done: $('realDelegateDone'), doneTitle: $('realDelegateDoneTitle'), summary: $('realDelegateSummary'),
    copy: $('realDelegateCopy'), again: $('realDelegateAgain'), history: $('realDelegateHistory')
  };

  const TYPES = {
    judgment: { label: '最終判断は自分', target: 'AI・メンバーに下ごしらえを任せる', keep: '判断基準と最終決定だけ自分に残す', ask: '「判断材料を3点に整理して。最終判断は自分がする」' },
    draft: { label: 'たたき台を作る仕事', target: 'AIに初稿を出させる', keep: '目的・NG条件・最終修正だけ自分に残す', ask: '「目的は○○。条件は○○。まず60点の初稿を作って」' },
    repeat: { label: '反復・定型作業', target: '担当者・自動化・外注へ渡す', keep: '完了条件と確認タイミングだけ自分に残す', ask: '「この条件で完了。○時に一度だけ確認させて」' },
    expertise: { label: '自分より得意な人がいる', target: '得意な人・専門家へ渡す', keep: '依頼目的と受け取り条件だけ自分に残す', ask: '「自分で抱えるより、ここが得意なのでお願いしたい。完了は○○」' },
    priority: { label: '優先順位が決められない', target: '上司・依頼者に優先順位を返す', keep: '選択肢と影響だけ整理して相談する', ask: '「AとBが競合しています。今日優先する方を決めてください」' }
  };

  let selected = '';
  const trim = (v) => String(v || '').trim();
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  const setStep = (step) => [els.typeStep, els.planStep, els.done].forEach((el) => { if (el) el.hidden = el !== step; });

  function open() {
    selected = '';
    els.task.value = '';
    els.deadline.value = '';
    els.before.value = '7';
    els.after.value = '7';
    els.beforeValue.textContent = '7';
    els.afterValue.textContent = '7';
    els.classify.disabled = true;
    els.classify.textContent = 'この仕事の「任せどころ」を見る';
    els.typeGrid.classList.remove('is-ready');
    [...els.typeGrid.querySelectorAll('[data-real-type]')].forEach((b) => b.classList.remove('selected'));
    setStep(els.typeStep);
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => els.task.focus({ preventScroll: true }));
    try { window.LevelUpTelemetry?.action?.('real-delegation-start'); } catch {}
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

  els.task.addEventListener('input', () => { els.classify.disabled = trim(els.task.value).length < 2; });
  els.before.addEventListener('input', () => { els.beforeValue.textContent = els.before.value; });
  els.after.addEventListener('input', () => { els.afterValue.textContent = els.after.value; });

  els.classify.addEventListener('click', () => {
    if (trim(els.task.value).length < 2) return;
    els.classify.textContent = '↓ 一番近い型を選ぶ';
    els.typeGrid.classList.add('is-ready');
    els.typeGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try { window.LevelUpTelemetry?.step?.('real-delegation-type'); } catch {}
  });

  els.typeGrid.addEventListener('click', (e) => {
    const button = e.target.closest('[data-real-type]');
    if (!button) return;
    selected = button.dataset.realType;
    const type = TYPES[selected];
    if (!type) return;
    [...els.typeGrid.querySelectorAll('[data-real-type]')].forEach((b) => b.classList.toggle('selected', b === button));
    els.target.textContent = type.target;
    els.keep.textContent = type.keep;
    els.ask.value = type.ask;
    const before = Number(els.before.value);
    els.after.value = String(before);
    els.afterValue.textContent = String(before);
    setStep(els.planStep);
    try { window.LevelUpTelemetry?.action?.(`real-delegation-${selected}`); } catch {}
  });

  els.finish.addEventListener('click', () => {
    const type = TYPES[selected];
    if (!type) return;
    const before = Number(els.before.value);
    const after = Number(els.after.value);
    const delta = before - after;
    const task = trim(els.task.value);
    const deadline = trim(els.deadline.value);
    const ask = trim(els.ask.value) || type.ask;
    els.doneTitle.textContent = delta > 0 ? '抱え込みを、外へ動かせた。' : delta === 0 ? '重さは同じ。でも渡し方は決まった。' : '少し重くなった。まず依頼だけ外へ出す。';
    els.summary.innerHTML = `<small>実際の仕事</small><strong>${escapeHtml(task)}</strong><small>渡す先</small><b>${escapeHtml(type.target)}</b><small>自分に残すもの</small><b>${escapeHtml(type.keep)}</b><small>そのまま使える依頼文</small><p>${escapeHtml(ask)}</p>${deadline ? `<small>期限・タイミング</small><b>${escapeHtml(deadline)}</b>` : ''}<div class="real-delegate-delta">抱え込み感 ${before} → ${after}</div>`;
    els.copy.dataset.copy = ask;
    saveRun({ type: selected, before, after, delta });
    renderHistory();
    setStep(els.done);
    try {
      window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete', { detail: { slug: 'help-me', delta, type: selected } }));
      window.LevelUpTelemetry?.action?.(`real-delegation-effect-${delta > 0 ? 'lighter' : delta === 0 ? 'same' : 'heavier'}`);
      window.LevelUpTelemetry?.complete?.('real-delegation');
    } catch {}
  });

  els.copy.addEventListener('click', async () => {
    const value = els.copy.dataset.copy || '';
    try { await navigator.clipboard.writeText(value); els.copy.textContent = '依頼文をコピーしました'; }
    catch { els.copy.textContent = 'コピーできませんでした'; }
    setTimeout(() => { els.copy.textContent = '依頼文をコピー'; }, 1400);
  });
  els.again.addEventListener('click', open);

  function saveRun(run) {
    try {
      const key = 'levelup-help-me-real-v1';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const runs = Array.isArray(prev) ? prev.slice(-19) : [];
      runs.push({ ...run, at: Date.now() });
      localStorage.setItem(key, JSON.stringify(runs));
    } catch {}
  }

  function renderHistory() {
    try {
      const runs = JSON.parse(localStorage.getItem('levelup-help-me-real-v1') || '[]');
      if (!Array.isArray(runs) || !runs.length) { els.history.hidden = true; return; }
      const moved = runs.filter((r) => Number(r.delta) > 0).length;
      els.history.hidden = false;
      els.history.textContent = `現実の仕事 ${runs.length}件。${moved}件で抱え込み感が下がりました。`;
    } catch { els.history.hidden = true; }
  }
})();
