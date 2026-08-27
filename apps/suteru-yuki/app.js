(() => {
  'use strict';

  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const storageKey = 'levelup-suteru-yuki-focus-v2';
  const historyKey = 'levelup-suteru-yuki-focus-history-v2';

  const presets = ['返信する', '資料を作る', '調べもの', '会議準備', '片づけ', '運動する', 'SNSを見る', '買い物', '家族の用事'];
  const criteria = [
    ['成果', '今日いちばん結果が動く'],
    ['締切', '今日やらないと困る'],
    ['健康', '体力を削らない'],
    ['家族', '大切な人との時間を守る'],
    ['余白', '予定を詰めすぎない'],
    ['納得', '自分で選んだ一日にする']
  ];

  let state = fresh();

  function fresh() {
    return {
      screen: 'input',
      tasks: [],
      criterion: null,
      pressureBefore: 8,
      pressureAfter: 5,
      cursor: 0,
      keep: [],
      drop: [],
      duel: [],
      champion: null,
      dragX: 0
    };
  }

  function esc(v) {
    return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tasks: state.tasks, criterion: state.criterion, pressureBefore: state.pressureBefore }));
    } catch {}
  }

  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (d && Array.isArray(d.tasks)) {
        state.tasks = d.tasks.filter(Boolean).slice(0, 7);
        state.criterion = d.criterion || null;
        state.pressureBefore = Number.isFinite(Number(d.pressureBefore)) ? Number(d.pressureBefore) : 8;
      }
    } catch {}
  }

  function getHistory() {
    try {
      const h = JSON.parse(localStorage.getItem(historyKey) || '[]');
      return Array.isArray(h) ? h : [];
    } catch { return []; }
  }

  function render() {
    if (state.screen === 'input') renderInput();
    else if (state.screen === 'criterion') renderCriterion();
    else if (state.screen === 'sort') renderSort();
    else if (state.screen === 'duel') renderDuel();
    else renderResult();
  }

  function topbar(label = '1 / 4') {
    return `<header class="topbar"><a href="/" class="home-link">LEVEL UP</a><span>${label}</span><button type="button" class="ghost" data-reset>やり直す</button></header>`;
  }

  function renderInput() {
    const h = getHistory();
    const last = h[h.length - 1];
    app.innerHTML = `${topbar('1 / 4')}
      <section class="screen input-screen">
        <p class="eyebrow">LESS, BUT IMPORTANT</p>
        <h1>やらないことを<br><em>決める。</em></h1>
        <p class="lead">今日、全部はできません。<br><strong>1つ守るために、候補を減らします。</strong></p>
        ${last ? `<aside class="previous"><small>前回の一番</small><strong>${esc(last.champion)}</strong><span>${last.dropped}件を「今日はやらない」にした</span></aside>` : ''}
        <div class="quick-add" aria-label="候補をすぐ追加">
          ${presets.map(p => `<button type="button" data-preset="${esc(p)}">＋ ${esc(p)}</button>`).join('')}
        </div>
        <label class="task-input"><span>今日やろうとしていること</span><div><input id="taskInput" maxlength="60" placeholder="例：提案資料を仕上げる"><button type="button" id="addTask">追加</button></div></label>
        <div class="task-list" id="taskList">${taskListHtml()}</div>
        <div class="pressure"><div><span>全部やらなきゃ感</span><strong><b id="pressureValue">${state.pressureBefore}</b>/10</strong></div><input id="pressure" type="range" min="0" max="10" value="${state.pressureBefore}"></div>
        <button class="primary" id="toCriterion" type="button" ${state.tasks.length < 3 ? 'disabled' : ''}>この${state.tasks.length || ''}件を絞る <span>→</span></button>
        <p class="note">3〜7件。入力した内容はこの端末内だけに保存します。</p>
      </section>`;
    bindReset();
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => addTask(b.dataset.preset)));
    document.querySelector('#addTask').addEventListener('click', () => {
      const input = document.querySelector('#taskInput');
      addTask(input.value);
      input.value = '';
      input.focus();
    });
    document.querySelector('#taskInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.querySelector('#addTask').click(); }
    });
    document.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      state.tasks.splice(Number(b.dataset.remove), 1); saveDraft(); render();
    }));
    document.querySelector('#pressure').addEventListener('input', e => {
      state.pressureBefore = Number(e.target.value); document.querySelector('#pressureValue').textContent = e.target.value; saveDraft();
    });
    document.querySelector('#toCriterion').addEventListener('click', () => { state.screen = 'criterion'; render(); });
  }

  function taskListHtml() {
    if (!state.tasks.length) return '<p class="empty">候補を3つ以上入れると開始できます。</p>';
    return state.tasks.map((t,i) => `<div class="task-row"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(t)}</strong><button type="button" data-remove="${i}" aria-label="${esc(t)}を削除">×</button></div>`).join('');
  }

  function addTask(raw) {
    const value = String(raw || '').trim();
    if (!value) return;
    if (state.tasks.includes(value)) return flash('すでに入っています');
    if (state.tasks.length >= 7) return flash('7件までです');
    state.tasks.push(value); saveDraft(); render();
  }

  function renderCriterion() {
    app.innerHTML = `${topbar('2 / 4')}
      <section class="screen criterion-screen">
        <p class="eyebrow">YOUR FILTER</p>
        <h2>今日、何を<br>いちばん守る？</h2>
        <p class="lead small">基準がないと、全部が重要に見えます。<br>今日は1つだけ。</p>
        <div class="criteria">${criteria.map(([name,copy]) => `<button type="button" data-criterion="${name}" class="${state.criterion === name ? 'selected' : ''}"><strong>${name}</strong><span>${copy}</span></button>`).join('')}</div>
        <button class="primary" id="startCut" type="button" ${state.criterion ? '' : 'disabled'}>候補を捨て始める <span>→</span></button>
        <button class="text-link" id="backInput" type="button">← 候補を直す</button>
      </section>`;
    bindReset();
    document.querySelectorAll('[data-criterion]').forEach(b => b.addEventListener('click', () => {
      state.criterion = b.dataset.criterion; saveDraft(); render();
    }));
    document.querySelector('#backInput').addEventListener('click', () => { state.screen = 'input'; render(); });
    document.querySelector('#startCut').addEventListener('click', () => {
      state.cursor = 0; state.keep = []; state.drop = []; state.screen = 'sort'; render();
    });
  }

  function renderSort() {
    const task = state.tasks[state.cursor];
    if (!task) return finishSort();
    const remaining = state.tasks.length - state.cursor;
    app.innerHTML = `${topbar(`3 / 4 · ${state.cursor+1}/${state.tasks.length}`)}
      <section class="screen sort-screen">
        <div class="sort-meta"><div><small>守る基準</small><strong>${esc(state.criterion)}</strong></div><div><small>残せる枠</small><strong>${state.keep.length} / 3</strong></div></div>
        <p class="decision-question">これを、今日やる？</p>
        <div class="decision-stage">
          <div class="drop-zone left"><b>←</b><span>今日はやらない</span></div>
          <article class="decision-card" id="decisionCard" tabindex="0" aria-label="${esc(task)}"><small>候補 ${state.cursor+1}</small><h3>${esc(task)}</h3><p>基準は「${esc(state.criterion)}」。<br>今日の枠を使う価値がある？</p><div class="swipe-cue"><span>← 捨てる</span><span>残す →</span></div></article>
          <div class="drop-zone right"><b>→</b><span>残す</span></div>
        </div>
        <div class="decision-buttons"><button class="discard" id="discardBtn" type="button">今日はやらない</button><button class="keep" id="keepBtn" type="button" ${state.keep.length >= 3 ? 'disabled' : ''}>残す</button></div>
        <p class="note">${state.keep.length >= 3 ? '残す枠は埋まりました。残りは「今日はやらない」です。' : `あと${remaining}件。スワイプでも選べます。`}</p>
      </section>`;
    bindReset();
    document.querySelector('#discardBtn').addEventListener('click', () => decide('drop'));
    document.querySelector('#keepBtn').addEventListener('click', () => decide('keep'));
    bindSwipe(document.querySelector('#decisionCard'));
  }

  function bindSwipe(card) {
    let startX = null;
    const move = x => {
      state.dragX = x;
      card.style.transform = `translateX(${x}px) rotate(${x/40}deg)`;
      card.classList.toggle('toward-drop', x < -35);
      card.classList.toggle('toward-keep', x > 35);
    };
    card.addEventListener('pointerdown', e => { startX = e.clientX; card.setPointerCapture(e.pointerId); card.classList.add('dragging'); });
    card.addEventListener('pointermove', e => { if (startX == null) return; move(e.clientX - startX); });
    card.addEventListener('pointerup', e => {
      if (startX == null) return;
      const dx = e.clientX - startX; startX = null; card.classList.remove('dragging');
      if (dx < -80) decide('drop');
      else if (dx > 80 && state.keep.length < 3) decide('keep');
      else { card.style.transform = ''; card.classList.remove('toward-drop','toward-keep'); }
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') decide('drop');
      if (e.key === 'ArrowRight' && state.keep.length < 3) decide('keep');
    });
  }

  function decide(type) {
    const task = state.tasks[state.cursor];
    if (!task) return;
    if (type === 'keep' && state.keep.length >= 3) return flash('残せるのは3件まで');
    (type === 'keep' ? state.keep : state.drop).push(task);
    state.cursor += 1;
    render();
  }

  function finishSort() {
    if (!state.keep.length) {
      const fallback = state.drop.shift();
      if (fallback) state.keep.push(fallback);
    }
    if (state.keep.length === 1) {
      state.champion = state.keep[0];
      state.screen = 'result';
      state.pressureAfter = Math.max(0, state.pressureBefore - Math.min(5, state.drop.length));
      return render();
    }
    state.duel = [...state.keep];
    state.screen = 'duel';
    render();
  }

  function renderDuel() {
    if (state.duel.length === 1) {
      state.champion = state.duel[0];
      state.drop.push(...state.keep.filter(x => x !== state.champion));
      state.pressureAfter = Math.max(0, state.pressureBefore - Math.min(5, state.drop.length));
      state.screen = 'result';
      return render();
    }
    const [a,b] = state.duel;
    app.innerHTML = `${topbar('4 / 4')}
      <section class="screen duel-screen">
        <p class="eyebrow">FINAL CUT</p>
        <h2>両方は、<br>守れない。</h2>
        <p class="lead small">基準は「${esc(state.criterion)}」。今日の一番を1つだけ。</p>
        <div class="duel-pair"><button type="button" data-win="0"><small>残すなら</small><strong>${esc(a)}</strong></button><span>VS</span><button type="button" data-win="1"><small>残すなら</small><strong>${esc(b)}</strong></button></div>
        <p class="note">選ばなかった方は「今日はやらない」へ移します。</p>
      </section>`;
    bindReset();
    document.querySelectorAll('[data-win]').forEach(btn => btn.addEventListener('click', () => {
      const winner = Number(btn.dataset.win) === 0 ? a : b;
      const loser = winner === a ? b : a;
      state.drop.push(loser);
      state.duel = [winner, ...state.duel.slice(2)];
      render();
    }));
  }

  function renderResult() {
    app.innerHTML = `${topbar('DONE')}
      <section class="screen result-screen">
        <p class="eyebrow">TODAY'S ONE</p>
        <h2>今日やるのは、<br><em>これ。</em></h2>
        <article class="champion"><small>今日の一番 · ${esc(state.criterion)}</small><strong>${esc(state.champion)}</strong></article>
        <div class="not-today"><div><span>今日はやらない</span><strong>${state.drop.length}件</strong></div>${state.drop.map(x => `<p><b>×</b>${esc(x)}</p>`).join('')}</div>
        <div class="pressure result-pressure"><div><span>全部やらなきゃ感</span><strong><b id="afterValue">${state.pressureAfter}</b>/10</strong></div><input id="afterPressure" type="range" min="0" max="10" value="${state.pressureAfter}"><small>${state.pressureBefore} → <b id="afterText">${state.pressureAfter}</b></small></div>
        <button class="primary" id="copyResult" type="button">今日の決定をコピー</button>
        <button class="secondary" id="doneBtn" type="button">この1つを始める</button>
        <button class="text-link" id="againBtn" type="button">もう一度絞る</button>
      </section>`;
    bindReset();
    document.querySelector('#afterPressure').addEventListener('input', e => {
      state.pressureAfter = Number(e.target.value); document.querySelector('#afterValue').textContent = e.target.value; document.querySelector('#afterText').textContent = e.target.value;
    });
    document.querySelector('#copyResult').addEventListener('click', copyResult);
    document.querySelector('#doneBtn').addEventListener('click', complete);
    document.querySelector('#againBtn').addEventListener('click', () => { state = fresh(); loadDraft(); state.screen = 'input'; render(); });
  }

  async function copyResult() {
    const text = `今日の一番：${state.champion}\n今日はやらない：${state.drop.join(' / ')}\n基準：${state.criterion}`;
    try { await navigator.clipboard.writeText(text); flash('コピーしました'); }
    catch { flash('コピーできませんでした'); }
  }

  function complete() {
    const h = getHistory().slice(-19);
    h.push({ champion: state.champion, dropped: state.drop.length, criterion: state.criterion, before: state.pressureBefore, after: state.pressureAfter, at: Date.now() });
    try { localStorage.setItem(historyKey, JSON.stringify(h)); localStorage.removeItem(storageKey); } catch {}
    flash('決定を保存しました。あとは1つだけ。');
    document.querySelector('#doneBtn').disabled = true;
    document.querySelector('#doneBtn').textContent = '保存しました';
    try { window.LevelUpTelemetry?.complete?.('focus-cut'); } catch {}
  }

  function bindReset() {
    const btn = document.querySelector('[data-reset]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!confirm('入力中の候補を消して、最初からやり直しますか？')) return;
      state = fresh();
      try { localStorage.removeItem(storageKey); } catch {}
      render();
    });
  }

  function flash(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(flash.t); flash.t = setTimeout(() => toast.classList.remove('show'), 1600);
  }

  loadDraft();
  render();
})();
