(() => {
  'use strict';

  const app = document.getElementById('app');
  const params = new URLSearchParams(location.search);
  const TEST = params.get('test') === '1';
  const STORAGE_KEY = 'levelup-work-avalanche-v1';
  const HISTORY_KEY = 'levelup-work-avalanche-history-v1';
  let timerInterval = null;

  const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const freshState = (carry = null) => ({
    version: 1,
    date: todayKey(),
    mode: 'dashboard',
    carry,
    oneWin: null,
    metrics: { returns: 0, rescues: 0, meetings: 0, triaged: 0, keptOut: 0, returned: 0 },
    todayInflux: [],
    triage: [],
    triageIndex: 0,
    shrink: [],
    timer: null,
    closeStatus: null,
    closed: false,
    closedAt: null,
  });

  const safeParse = (raw, fallback) => {
    try { return JSON.parse(raw) ?? fallback; } catch { return fallback; }
  };

  const addHistory = (snapshot) => {
    if (!snapshot?.date || !snapshot?.oneWin) return;
    const list = safeParse(localStorage.getItem(HISTORY_KEY), []);
    const compact = {
      date: snapshot.date,
      title: snapshot.oneWin.title,
      finishLine: snapshot.oneWin.finishLine,
      done: Boolean(snapshot.oneWin.done),
      nextAction: snapshot.oneWin.nextAction || '',
      metrics: snapshot.metrics || {},
      closed: Boolean(snapshot.closed),
    };
    const next = [compact, ...list.filter((item) => item?.date !== compact.date)].slice(0, 14);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const loadState = () => {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY), null);
    if (!raw || raw.date === todayKey()) return raw || freshState();
    addHistory(raw);
    const carry = raw.oneWin && !raw.oneWin.done ? {
      title: raw.oneWin.title || '',
      finishLine: raw.oneWin.finishLine || '',
      nextAction: raw.oneWin.nextAction || '',
    } : null;
    return freshState(carry);
  };

  let state = loadState();

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const e = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const header = (back = false) => `
    <div class="top">
      <div>
        <p class="eyebrow">LEVEL UP / WORK</p>
        <h1>仕事の雪崩を止める</h1>
      </div>
      ${back ? '<button class="icon-btn" type="button" data-action="home" aria-label="今日の画面へ戻る">←</button>' : (TEST ? '<span class="test-badge">TEST</span>' : '')}
    </div>`;

  const footer = () => '<div class="footer-note">全部終わらせるのではなく、大事な1つが埋もれない日をつくる。</div>';

  const page = (content, back = false) => {
    app.innerHTML = `<div class="shell">${header(back)}${content}${footer()}</div>`;
  };

  const setupView = () => {
    const carry = state.carry;
    page(`
      <section class="card hero-card">
        <h2>今日、何を守る？</h2>
        <p class="lead">ToDoを全部入れません。今日これだけ進めば「何もできなかった日」ではない、という1つだけ決めます。</p>
      </section>
      ${carry ? `
        <section class="card next-card">
          <div class="section-title"><h3>昨日から残っている1勝</h3><span class="pill">引き継げる</span></div>
          <div class="win-title">${e(carry.title)}</div>
          <div class="finish-line">${e(carry.finishLine)}</div>
          <button class="btn block" type="button" data-action="use-carry" style="margin-top:12px">これを今日の1勝にする</button>
        </section>` : ''}
      <form class="card form" data-form="setup">
        <div class="field">
          <label for="win-title">今日これだけ進めば「何もできなかった日」ではない仕事</label>
          <input class="text-input" id="win-title" name="title" maxlength="120" autocomplete="off" placeholder="例：提案の骨子を決める" required>
        </div>
        <div class="field">
          <label for="finish-line">どこまで行けば今日は勝ち？</label>
          <input class="text-input" id="finish-line" name="finishLine" maxlength="160" autocomplete="off" placeholder="例：3つの施策を文章にする" required>
          <div class="field-help">「完成」ではなく、今日の終了条件を具体的に。</div>
        </div>
        <button class="btn primary block" type="submit">今日の1勝を固定する</button>
      </form>`);
  };

  const snowBlocks = (count, cls = '') => Array.from({ length: Math.min(5, count) }, () => `<span class="snow ${cls}"></span>`).join('');

  const dashboardView = () => {
    const w = state.oneWin;
    const m = state.metrics;
    page(`
      <section class="card hero-card">
        <div class="win-label"><span>今日の1勝</span>${w.done ? '<span class="done-badge">✓ 達成</span>' : '<span>最優先レーン</span>'}</div>
        <div class="win-title">${e(w.title)}</div>
        <div class="finish-line">勝ちライン：${e(w.finishLine)}</div>
        ${w.nextAction && !w.done ? `<div class="notice" style="margin-top:12px"><b>次に開いたら：</b> ${e(w.nextAction)}</div>` : ''}
        <button class="btn ${w.done ? 'ghost' : 'good'} block" type="button" data-action="toggle-win" style="margin-top:13px">${w.done ? '達成を取り消す' : '今日の1勝、できた'}</button>
      </section>

      <section class="avalanche" aria-label="今日の仕事の流れ">
        <div class="avalanche-head"><h3>雪崩の流れ</h3><span class="pill">1勝を埋めない</span></div>
        <div class="flow">
          <div><div class="side-lane">${snowBlocks(m.keptOut, 'out')}</div><div class="lane-label">今日から逃がした ${m.keptOut}</div></div>
          <div><div class="core-lane"><div class="core">${e(w.title)}</div></div><div class="lane-label">守る1本</div></div>
          <div><div class="side-lane">${snowBlocks(m.meetings)}</div><div class="lane-label">会議 ${m.meetings}</div></div>
        </div>
      </section>

      <section class="actions" aria-label="今やること">
        <button class="action accent" type="button" data-action="meeting"><b>会議が終わった</b><span>増えた仕事を今日から逃がして、1勝へ戻る</span></button>
        <button class="action" type="button" data-action="quick-return"><b>3分だけ戻る</b><span>重要仕事へ戻る最小の一手を決める</span></button>
        <button class="action" type="button" data-action="rescue"><b>救出モード</b><span>疲れた今でもできる大きさまで仕事を縮める</span></button>
        <button class="action" type="button" data-action="close"><b>今日は閉じる</b><span>反省会をせず、未完了を次の一手に変える</span></button>
      </section>

      <section class="metrics" aria-label="今日の記録">
        <div class="metric"><strong>${m.returns}</strong><span>1勝へ復帰</span></div>
        <div class="metric"><strong>${m.keptOut}</strong><span>今日から逃がした</span></div>
        <div class="metric"><strong>${m.rescues}</strong><span>救出セッション</span></div>
      </section>

      ${state.todayInflux.length ? `
        <section class="card">
          <div class="section-title"><h3>今日に残した追加仕事</h3><span class="pill">1勝のあと</span></div>
          <p class="tiny">会議で増えた仕事です。今日でなくてよくなったら、ここから逃がせます。</p>
          <div class="task-list">${state.todayInflux.map((task, i) => `<div class="task"><span>${e(task)}</span><button type="button" data-action="move-influx" data-index="${i}" aria-label="${e(task)}を今週へ移す">↗</button></div>`).join('')}</div>
        </section>` : ''}`);
  };

  const triageCaptureView = () => page(`
    <section class="card hero-card">
      <div class="section-title"><h2>会議の仕事を、今日に積まない</h2><span class="pill">会議 ${state.metrics.meetings}</span></div>
      <p class="lead">会議で増えた「やること」だけ書き出します。あとで1件ずつ、置き場所を決めます。</p>
    </section>
    <form class="card form" data-form="triage-add">
      <div class="field">
        <label for="triage-input">増えた仕事</label>
        <input class="text-input" id="triage-input" name="task" maxlength="160" autocomplete="off" placeholder="例：見積もり条件を確認する">
      </div>
      <button class="btn block" type="submit">＋ 追加</button>
      ${state.triage.length ? `<div class="task-list">${state.triage.map((task, i) => `<div class="task"><span>${e(task)}</span><button type="button" data-action="remove-triage" data-index="${i}" aria-label="削除">×</button></div>`).join('')}</div>` : ''}
      <div class="btn-row">
        <button class="btn primary" type="button" data-action="start-classify" ${state.triage.length ? '' : 'disabled'}>仕分ける</button>
        <button class="btn ghost" type="button" data-action="no-new-task">増えた仕事なし → 1勝へ戻る</button>
      </div>
    </form>`, true);

  const classifyView = () => {
    const index = state.triageIndex;
    const task = state.triage[index];
    page(`
      <section class="card classify-card">
        <div class="counter">${index + 1} / ${state.triage.length}</div>
        <div class="classify-task">${e(task)}</div>
        <p class="tiny">「できるか」ではなく、「今日でなければ困るか」で決める。</p>
        <div class="choices">
          <button class="choice" type="button" data-action="classify" data-bucket="today"><b>今日やる</b><span>今日でないと実害がある</span></button>
          <button class="choice" type="button" data-action="classify" data-bucket="week"><b>今週</b><span>今日の1勝を邪魔させない</span></button>
          <button class="choice" type="button" data-action="classify" data-bucket="return"><b>人に返す</b><span>自分が抱え続ける仕事ではない</span></button>
          <button class="choice" type="button" data-action="classify" data-bucket="drop"><b>やらない</b><span>今決めなくても困らない</span></button>
        </div>
      </section>`, true);
  };

  const returnPlanView = () => page(`
    <section class="card hero-card">
      <div class="win-label"><span>会議はここで終了</span><span>重要仕事へ復帰</span></div>
      <div class="win-title">${e(state.oneWin.title)}</div>
      <div class="finish-line">勝ちライン：${e(state.oneWin.finishLine)}</div>
    </section>
    <form class="card form" data-form="return-plan">
      <div class="field">
        <label for="return-action">次の3分で、何をする？</label>
        <input class="text-input" id="return-action" name="action" maxlength="160" autocomplete="off" placeholder="例：資料を開いて見出しを3つ書く" required value="${e(state.oneWin.nextAction || '')}">
        <div class="field-help">「考える」ではなく、指や目が実際に動く一手にします。</div>
      </div>
      <button class="btn accent block" type="submit">3分だけ戻る</button>
    </form>`, true);

  const rescueView = () => page(`
    <section class="card hero-card">
      <div class="section-title"><h2>全部終わらせるのをやめる</h2><span class="pill">救出モード</span></div>
      <div class="win-title" style="margin-top:14px">${e(state.oneWin.title)}</div>
      <div class="finish-line">本来の勝ちライン：${e(state.oneWin.finishLine)}</div>
    </section>
    <section class="card form">
      <div class="field">
        <label for="shrink-input">今の疲れでもできる最小形にすると？</label>
        <input class="text-input" id="shrink-input" maxlength="160" autocomplete="off" placeholder="例：タイトルと施策3つだけ書く" value="${e(state.shrink.at(-1) || '')}">
      </div>
      ${state.shrink.length > 1 ? `<div class="shrink-stack">${state.shrink.slice(0, -1).map((item) => `<div class="shrink-item">${e(item)}</div>`).join('')}</div>` : ''}
      <div class="btn-row">
        <button class="btn" type="button" data-action="shrink-more">まだ重い → さらに縮める</button>
        <button class="btn accent" type="button" data-action="rescue-start">これならできる → 12分</button>
      </div>
      <div class="field-help">12分で完成しなくていい。今日を「ゼロのまま終える」ことだけを防ぎます。</div>
    </section>`, true);

  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const timerView = () => {
    const t = state.timer;
    if (!t) { state.mode = 'dashboard'; save(); render(); return; }
    const remaining = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000));
    const finished = remaining <= 0;
    page(`
      <section class="card timer">
        <div class="counter">${t.kind === 'rescue' ? '12分救出' : '3分復帰'}</div>
        <div class="timer-ring"><div class="timer-value" id="timer-value">${formatTime(remaining)}</div></div>
        <h2>${e(t.action)}</h2>
        <div class="timer-label">${finished ? 'ここまでで十分。進んだ分を今日に残します。' : '他の仕事は今だけ触らない。終わらせるより、この1本へ戻る。'}</div>
        ${finished ? `<button class="btn good block" type="button" data-action="timer-complete">${t.kind === 'rescue' ? '進んだ。今日を救出した' : '戻れた'}</button>` : '<button class="btn ghost" type="button" data-action="timer-complete">もう動き始めたので戻る</button>'}
      </section>`, true);
    startTicking();
  };

  const closeView = () => page(`
    <section class="card hero-card">
      <h2>反省会ではなく、閉じる準備</h2>
      <p class="lead">今日できなかった仕事を数えません。1勝の状態だけ決めて、未完了なら「次に開いたときの一手」を置いて終了します。</p>
    </section>
    <section class="card">
      <div class="win-label"><span>今日の1勝</span>${state.oneWin.done ? '<span class="done-badge">✓ 達成</span>' : '<span>確認</span>'}</div>
      <div class="win-title">${e(state.oneWin.title)}</div>
      <div class="finish-line">${e(state.oneWin.finishLine)}</div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn good" type="button" data-action="close-done">できた</button>
        <button class="btn" type="button" data-action="close-partway">途中</button>
      </div>
    </section>
    ${state.closeStatus === 'partway' ? `
      <section class="card form">
        <div class="field">
          <label for="close-next">次に開いたら、最初に何をする？</label>
          <input class="text-input" id="close-next" maxlength="160" autocomplete="off" placeholder="例：2ページ目の見出しから書く" value="${e(state.oneWin.nextAction || '')}">
        </div>
        <button class="btn primary block" type="button" data-action="finish-close">次の一手を置いて、今日は終了</button>
      </section>` : ''}`, true);

  const summaryView = () => {
    const m = state.metrics;
    const done = state.oneWin?.done;
    page(`
      <section class="card summary-hero">
        <strong>${done ? '1勝' : '次手'}</strong>
        <span>${done ? '今日の大事な仕事をゼロで終わらせなかった。' : '未完了を、明日の具体的な一手に変えた。'}</span>
      </section>
      <section class="card">
        <div class="win-label"><span>${done ? '今日できたこと' : '次に戻る場所'}</span><span>${e(state.date)}</span></div>
        <div class="win-title">${e(state.oneWin.title)}</div>
        <div class="finish-line">${done ? `勝ちライン：${e(state.oneWin.finishLine)}` : `次の一手：${e(state.oneWin.nextAction || '未設定')}`}</div>
      </section>
      <section class="summary-grid">
        <div class="summary-box"><strong>${m.returns}</strong><span>重要仕事へ戻った回数</span></div>
        <div class="summary-box"><strong>${m.keptOut}</strong><span>今日から逃がした仕事</span></div>
        <div class="summary-box"><strong>${m.returned}</strong><span>人に返した仕事</span></div>
        <div class="summary-box"><strong>${m.rescues}</strong><span>夕方の救出</span></div>
      </section>
      <div class="notice ${done ? 'success' : ''}">${done ? '残っている仕事の数ではなく、今日守れた前進を終了条件にします。' : '今日はここで終了。次回は「何をするか」から考え直さず、置いた一手から再開できます。'}</div>
      <button class="btn block" type="button" data-action="reopen">まだ今日を続ける</button>`);
  };

  const startTimer = (minutes, kind, action) => {
    const seconds = TEST ? 5 : minutes * 60;
    state.timer = { kind, action, durationSec: seconds, endAt: Date.now() + seconds * 1000 };
    state.mode = 'timer';
    save();
    render();
  };

  const startTicking = () => {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (state.mode !== 'timer' || !state.timer) { clearInterval(timerInterval); return; }
      const remaining = Math.max(0, Math.ceil((state.timer.endAt - Date.now()) / 1000));
      const node = document.getElementById('timer-value');
      if (node) node.textContent = formatTime(remaining);
      if (remaining <= 0) {
        clearInterval(timerInterval);
        render();
      }
    }, 250);
  };

  const finalizeClose = () => {
    state.closed = true;
    state.closedAt = new Date().toISOString();
    state.mode = 'summary';
    addHistory(state);
    save();
    render();
  };

  const render = () => {
    clearInterval(timerInterval);
    if (!state.oneWin) return setupView();
    if (state.closed || state.mode === 'summary') return summaryView();
    switch (state.mode) {
      case 'triage-capture': return triageCaptureView();
      case 'triage-classify': return classifyView();
      case 'return-plan': return returnPlanView();
      case 'rescue': return rescueView();
      case 'timer': return timerView();
      case 'close': return closeView();
      default: return dashboardView();
    }
  };

  app.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    if (form.dataset.form === 'setup') {
      const title = String(data.get('title') || '').trim();
      const finishLine = String(data.get('finishLine') || '').trim();
      if (!title || !finishLine) return;
      state.oneWin = { title, finishLine, done: false, nextAction: '' };
      state.carry = null;
      state.mode = 'dashboard';
      save(); render();
      return;
    }
    if (form.dataset.form === 'triage-add') {
      const task = String(data.get('task') || '').trim();
      if (!task) return;
      state.triage.push(task.slice(0, 160));
      save(); render();
      requestAnimationFrame(() => document.getElementById('triage-input')?.focus());
      return;
    }
    if (form.dataset.form === 'return-plan') {
      const action = String(data.get('action') || '').trim();
      if (!action) return;
      state.oneWin.nextAction = action.slice(0, 160);
      save();
      startTimer(3, 'return', state.oneWin.nextAction);
    }
  });

  app.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;

    if (action === 'home') {
      state.mode = 'dashboard'; state.timer = null; state.closeStatus = null; save(); render(); return;
    }
    if (action === 'use-carry' && state.carry) {
      state.oneWin = { title: state.carry.title, finishLine: state.carry.finishLine, done: false, nextAction: state.carry.nextAction || '' };
      state.carry = null; state.mode = 'dashboard'; save(); render(); return;
    }
    if (action === 'toggle-win') {
      state.oneWin.done = !state.oneWin.done; save(); render(); return;
    }
    if (action === 'meeting') {
      state.metrics.meetings += 1;
      state.triage = []; state.triageIndex = 0; state.mode = 'triage-capture'; save(); render(); return;
    }
    if (action === 'quick-return') {
      state.mode = 'return-plan'; save(); render(); return;
    }
    if (action === 'rescue') {
      state.shrink = []; state.mode = 'rescue'; save(); render(); return;
    }
    if (action === 'close') {
      state.closeStatus = state.oneWin.done ? 'done' : null; state.mode = 'close'; save(); render(); return;
    }
    if (action === 'remove-triage') {
      const i = Number(button.dataset.index);
      if (Number.isInteger(i) && i >= 0 && i < state.triage.length) state.triage.splice(i, 1);
      save(); render(); return;
    }
    if (action === 'start-classify' && state.triage.length) {
      state.triageIndex = 0; state.mode = 'triage-classify'; save(); render(); return;
    }
    if (action === 'no-new-task') {
      state.triage = []; state.triageIndex = 0; state.mode = 'return-plan'; save(); render(); return;
    }
    if (action === 'classify') {
      const task = state.triage[state.triageIndex];
      if (!task) return;
      const bucket = button.dataset.bucket;
      state.metrics.triaged += 1;
      if (bucket === 'today') state.todayInflux.push(task);
      if (bucket === 'week') state.metrics.keptOut += 1;
      if (bucket === 'return') { state.metrics.keptOut += 1; state.metrics.returned += 1; }
      if (bucket === 'drop') state.metrics.keptOut += 1;
      state.triageIndex += 1;
      if (state.triageIndex >= state.triage.length) {
        state.triage = []; state.triageIndex = 0; state.mode = 'return-plan';
      }
      save(); render(); return;
    }
    if (action === 'move-influx') {
      const i = Number(button.dataset.index);
      if (Number.isInteger(i) && i >= 0 && i < state.todayInflux.length) {
        state.todayInflux.splice(i, 1); state.metrics.keptOut += 1;
      }
      save(); render(); return;
    }
    if (action === 'shrink-more') {
      const input = document.getElementById('shrink-input');
      const value = String(input?.value || '').trim();
      if (!value) { input?.focus(); return; }
      const previous = state.shrink.at(-1);
      if (!previous || previous !== value) state.shrink.push(value.slice(0, 160));
      state.shrink.push('');
      save(); render();
      requestAnimationFrame(() => document.getElementById('shrink-input')?.focus());
      return;
    }
    if (action === 'rescue-start') {
      const input = document.getElementById('shrink-input');
      const value = String(input?.value || '').trim();
      if (!value) { input?.focus(); return; }
      state.shrink = state.shrink.filter(Boolean);
      if (state.shrink.at(-1) !== value) state.shrink.push(value.slice(0, 160));
      state.oneWin.nextAction = value.slice(0, 160);
      save(); startTimer(12, 'rescue', value); return;
    }
    if (action === 'timer-complete') {
      const kind = state.timer?.kind;
      if (kind === 'rescue') state.metrics.rescues += 1;
      if (kind === 'return' || kind === 'rescue') state.metrics.returns += 1;
      state.timer = null; state.mode = 'dashboard'; save(); render(); return;
    }
    if (action === 'close-done') {
      state.oneWin.done = true; state.closeStatus = 'done'; save(); finalizeClose(); return;
    }
    if (action === 'close-partway') {
      state.oneWin.done = false; state.closeStatus = 'partway'; save(); render();
      requestAnimationFrame(() => document.getElementById('close-next')?.focus());
      return;
    }
    if (action === 'finish-close') {
      const input = document.getElementById('close-next');
      const value = String(input?.value || '').trim();
      if (!value) { input?.focus(); return; }
      state.oneWin.nextAction = value.slice(0, 160); save(); finalizeClose(); return;
    }
    if (action === 'reopen') {
      state.closed = false; state.closedAt = null; state.mode = 'dashboard'; state.closeStatus = null; save(); render();
    }
  });

  render();
})();
