(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const storageKey = 'levelup-suteru-yuki-real-v1';
  let modal;
  let selected = new Set();
  let criterion = '余白';

  function ensureLauncher() {
    const ending = $('.ending-page');
    if (!ending || $('[data-real-prune-launch]', ending)) return;
    const replay = $('[data-replay]', ending);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'real-prune-launch primary big';
    button.dataset.realPruneLaunch = '1';
    button.innerHTML = '今の選択肢を、本当に捨てる <span>→</span>';
    button.addEventListener('click', open);
    replay?.before(button);
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'real-prune-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="real-prune-card" role="dialog" aria-modal="true" aria-labelledby="realPruneTitle">
        <div class="real-prune-head"><div><small>REAL LIFE / TWO OF FIVE</small><h2 id="realPruneTitle">現実の候補から、<br>2つだけ残す。</h2></div><button type="button" data-prune-close aria-label="閉じる">×</button></div>
        <section data-prune-step="input">
          <p class="real-prune-copy">「全部やる」を禁止して、今の自分の選択肢でやる。</p>
          <div class="real-prune-criterion"><span>今回いちばん守るもの</span><div>${['余白','売上','健康','信頼','納得'].map((v,i)=>`<button type="button" data-criterion="${v}" class="${i===0?'selected':''}">${v}</button>`).join('')}</div></div>
          <div class="real-prune-inputs">
            ${[1,2,3,4,5].map((n)=>`<label><span>候補 ${n}${n>2?'（任意）':''}</span><input type="text" maxlength="70" data-option="${n}" placeholder="${n===1?'例：新しいSNS施策':n===2?'例：商品ページ改善':''}"></label>`).join('')}
          </div>
          <div class="real-prune-meter"><div><span>全部やりたい圧</span><strong><b data-before-value>7</b>/10</strong></div><input data-before type="range" min="0" max="10" value="7"></div>
          <button class="real-prune-primary" type="button" data-prune-next disabled>2つまで選ぶ →</button>
        </section>
        <section data-prune-step="choose" hidden>
          <div class="real-prune-north"><small>今回の基準</small><strong data-criterion-result>余白</strong><span>残せるのは2つまで</span></div>
          <div class="real-prune-options" data-prune-options></div>
          <div class="real-prune-count"><strong data-selected-count>0</strong> / 2 まで残す</div>
          <div class="real-prune-meter"><div><span>選んだ後の「全部やりたい圧」</span><strong><b data-after-value>7</b>/10</strong></div><input data-after type="range" min="0" max="10" value="7"></div>
          <small>下がっていなくてもOK。捨てる不安が増えたなら、その数字をそのまま。</small>
          <button class="real-prune-primary" type="button" data-prune-finish disabled>残すものを確定する</button>
        </section>
        <section data-prune-step="done" hidden>
          <h3 data-done-title>捨てたから、残したものが見えた。</h3>
          <div class="real-prune-result"><div><small>KEEP / 残す</small><div data-keep-list></div></div><div class="drop"><small>DROP / 今回はやらない</small><div data-drop-list></div></div></div>
          <div class="real-prune-delta" data-delta></div>
          <div class="real-prune-history" data-history hidden></div>
          <button class="real-prune-secondary" type="button" data-prune-again>別の選択肢でもう1回</button>
        </section>
      </div>`;
    document.body.appendChild(modal);

    $('[data-prune-close]', modal).addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    $$('[data-criterion]', modal).forEach((b) => b.addEventListener('click', () => {
      criterion = b.dataset.criterion;
      $$('[data-criterion]', modal).forEach((x) => x.classList.toggle('selected', x === b));
    }));
    $$('[data-option]', modal).forEach((i) => i.addEventListener('input', validateInput));
    $('[data-before]', modal).addEventListener('input', (e) => $('[data-before-value]', modal).textContent = e.target.value);
    $('[data-after]', modal).addEventListener('input', (e) => $('[data-after-value]', modal).textContent = e.target.value);
    $('[data-prune-next]', modal).addEventListener('click', buildChoiceStep);
    $('[data-prune-finish]', modal).addEventListener('click', finish);
    $('[data-prune-again]', modal).addEventListener('click', reset);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('show')) close(); });
    return modal;
  }

  function validateInput() {
    const values = $$('[data-option]', modal).map((i) => i.value.trim()).filter(Boolean);
    $('[data-prune-next]', modal).disabled = values.length < 2;
  }

  function open() {
    ensureModal();
    reset();
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => $('[data-option="1"]', modal).focus({ preventScroll: true }));
    try { window.LevelUpTelemetry?.action?.('real-prune-start'); } catch {}
  }
  function close() {
    modal?.classList.remove('show');
    modal?.setAttribute('aria-hidden', 'true');
    $('[data-real-prune-launch]')?.focus({ preventScroll: true });
  }
  function showStep(name) {
    $$('[data-prune-step]', modal).forEach((s) => { s.hidden = s.dataset.pruneStep !== name; });
  }
  function reset() {
    ensureModal();
    selected = new Set();
    criterion = '余白';
    $$('[data-option]', modal).forEach((i) => i.value = '');
    $$('[data-criterion]', modal).forEach((b) => b.classList.toggle('selected', b.dataset.criterion === criterion));
    $('[data-before]', modal).value = '7'; $('[data-before-value]', modal).textContent = '7';
    $('[data-after]', modal).value = '7'; $('[data-after-value]', modal).textContent = '7';
    $('[data-prune-next]', modal).disabled = true;
    showStep('input');
  }

  function buildChoiceStep() {
    const options = $$('[data-option]', modal).map((i) => i.value.trim()).filter(Boolean);
    if (options.length < 2) return;
    selected = new Set();
    $('[data-criterion-result]', modal).textContent = criterion;
    $('[data-after]', modal).value = $('[data-before]', modal).value;
    $('[data-after-value]', modal).textContent = $('[data-before]', modal).value;
    $('[data-prune-options]', modal).innerHTML = options.map((value, i) => `<button type="button" data-choice="${i}"><small>候補 ${i+1}</small><strong>${escapeHtml(value)}</strong><span>残す</span></button>`).join('');
    $$('[data-choice]', modal).forEach((b) => b.addEventListener('click', () => toggleChoice(b)));
    updateChoiceState();
    showStep('choose');
    try { window.LevelUpTelemetry?.step?.('real-prune-choose'); } catch {}
  }

  function toggleChoice(button) {
    const id = button.dataset.choice;
    if (selected.has(id)) selected.delete(id);
    else {
      if (selected.size >= 2) return;
      selected.add(id);
    }
    updateChoiceState();
  }
  function updateChoiceState() {
    $$('[data-choice]', modal).forEach((b) => b.classList.toggle('selected', selected.has(b.dataset.choice)));
    $('[data-selected-count]', modal).textContent = String(selected.size);
    $('[data-prune-finish]', modal).disabled = selected.size === 0;
  }

  function finish() {
    const buttons = $$('[data-choice]', modal);
    const keep = buttons.filter((b) => selected.has(b.dataset.choice)).map((b) => $('strong', b).textContent);
    const drop = buttons.filter((b) => !selected.has(b.dataset.choice)).map((b) => $('strong', b).textContent);
    const before = Number($('[data-before]', modal).value);
    const after = Number($('[data-after]', modal).value);
    const delta = before - after;
    $('[data-done-title]', modal).textContent = drop.length ? '捨てたから、残したものが見えた。' : '今回は捨てなかった。その判断も記録する。';
    $('[data-keep-list]', modal).innerHTML = keep.map((v) => `<strong>${escapeHtml(v)}</strong>`).join('');
    $('[data-drop-list]', modal).innerHTML = drop.length ? drop.map((v) => `<span>${escapeHtml(v)}</span>`).join('') : '<span>なし</span>';
    $('[data-delta]', modal).textContent = `「全部やりたい圧」 ${before} → ${after}　／　基準：${criterion}`;
    saveRun({ before, after, delta, kept: keep.length, dropped: drop.length, criterion });
    renderHistory();
    showStep('done');
    try {
      window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete', { detail: { slug: 'suteru-yuki', delta, kept: keep.length, dropped: drop.length } }));
      window.LevelUpTelemetry?.action?.(`real-prune-effect-${delta > 0 ? 'lighter' : delta === 0 ? 'same' : 'heavier'}`);
      window.LevelUpTelemetry?.complete?.('real-prune');
    } catch {}
  }

  function saveRun(run) {
    try {
      const prev = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const runs = Array.isArray(prev) ? prev.slice(-19) : [];
      runs.push({ ...run, at: Date.now() });
      localStorage.setItem(storageKey, JSON.stringify(runs));
    } catch {}
  }
  function renderHistory() {
    try {
      const runs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const el = $('[data-history]', modal);
      if (!Array.isArray(runs) || !runs.length) { el.hidden = true; return; }
      const dropped = runs.reduce((sum, r) => sum + Number(r.dropped || 0), 0);
      const lighter = runs.filter((r) => Number(r.delta) > 0).length;
      el.hidden = false;
      el.textContent = `現実の選択 ${runs.length}回。これまで ${dropped}件を「今回はやらない」にし、${lighter}回で圧が下がりました。`;
    } catch {}
  }
  function escapeHtml(v) { return String(v).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }

  const observer = new MutationObserver(() => ensureLauncher());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(ensureLauncher, 500);
})();
