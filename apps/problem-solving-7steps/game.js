(() => {
  'use strict';

  const STEP_NAMES = ['見分ける', '絞る', '具体化', '広げる', '決める', '計画', '見直す'];
  const STORAGE_KEY = 'levelup.problem-solving-7steps.v1';

  const cases = window.PROBLEM_SOLVING_CASES;
  if (!Array.isArray(cases) || !cases.length) throw new Error('Problem-solving cases are missing');

  const $ = (id) => document.getElementById(id);

  const state = {
    caseIndex: 0,
    step: 0,
    scores: [],
    classifyIndex: 0,
    classifyHits: 0,
    classifyLocked: false,
    ideaSelection: [],
    orderSelection: [],
  };

  let saved = loadSaved();

  function loadSaved() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        sessions: Number(value.sessions) || 0,
        mastery: Array.isArray(value.mastery) && value.mastery.length === 7 ? value.mastery.map(Number) : [0,0,0,0,0,0,0],
        counts: Array.isArray(value.counts) && value.counts.length === 7 ? value.counts.map(Number) : [0,0,0,0,0,0,0],
        seen: Array.isArray(value.seen) ? value.seen : [],
      };
    } catch {
      return { sessions: 0, mastery: [0,0,0,0,0,0,0], counts: [0,0,0,0,0,0,0], seen: [] };
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }

  function vibrate(pattern = 10) {
    try { navigator.vibrate?.(pattern); } catch {}
  }

  function currentCase() {
    return cases[state.caseIndex];
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('is-active'));
    $(id).classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextUnseenIndex(from = -1) {
    if (saved.seen.length >= cases.length) saved.seen = [];
    for (let offset = 1; offset <= cases.length; offset += 1) {
      const idx = (from + offset + cases.length) % cases.length;
      if (!saved.seen.includes(cases[idx].id)) return idx;
    }
    return (from + 1 + cases.length) % cases.length;
  }

  function updateStartSummary() {
    $('sessionCount').textContent = String(saved.sessions);
    const practiced = saved.counts.map((count, i) => ({ i, count, value: count ? saved.mastery[i] / count : null })).filter((x) => x.value !== null);
    if (!practiced.length) {
      $('strongSkill').textContent = '—';
      $('weakSkill').textContent = '—';
      return;
    }
    practiced.sort((a,b) => b.value - a.value);
    $('strongSkill').textContent = STEP_NAMES[practiced[0].i];
    $('weakSkill').textContent = STEP_NAMES[practiced[practiced.length - 1].i];
  }

  function setStepScore(score) {
    state.scores[state.step] = Math.round(score);
  }

  function finishStep() {
    state.step += 1;
    state.classifyLocked = false;
    renderStep();
  }

  function renderRail() {
    const rail = $('stepRail');
    rail.innerHTML = '';
    STEP_NAMES.forEach((name, i) => {
      const node = document.createElement('div');
      node.className = 'step-node';
      node.title = `${i + 1}. ${name}`;
      if (i < state.step) node.classList.add('is-done');
      if (i === state.step) node.classList.add('is-current');
      rail.appendChild(node);
    });
    const fog = Math.max(18, 100 - state.step * 12);
    $('fogValue').textContent = String(fog);
  }

  function stepHeader(number, title, instruction) {
    return `
      <div class="step-label"><b>${number}</b><span>${STEP_NAMES[number - 1].toUpperCase()}</span></div>
      <h3>${title}</h3>
      <p class="instruction">${instruction}</p>
    `;
  }

  function renderStep() {
    if (state.step >= 7) {
      finishSession();
      return;
    }
    renderRail();
    const c = currentCase();
    $('caseKicker').textContent = c.kicker;
    $('caseTitle').textContent = c.title;
    $('situationText').textContent = c.situation;
    const work = $('workArea');
    work.innerHTML = '';

    if (state.step === 0) renderClassify(work, c);
    if (state.step === 1) renderFocus(work, c);
    if (state.step === 2) renderDefine(work, c);
    if (state.step === 3) renderIdeas(work, c);
    if (state.step === 4) renderDecide(work, c);
    if (state.step === 5) renderPlan(work, c);
    if (state.step === 6) renderReview(work, c);
  }

  function renderClassify(work, c) {
    work.innerHTML = stepHeader(1, '動かせるものだけ拾う', '問題に混ざっているものを、今こちらから影響できるかで分けます。');
    const item = c.classify[state.classifyIndex];
    const card = document.createElement('div');
    card.className = 'classify-card';
    card.innerHTML = `<div class="counter">${state.classifyIndex + 1} / ${c.classify.length}</div><strong>${item.text}</strong>`;
    work.appendChild(card);

    const binary = document.createElement('div');
    binary.className = 'binary';
    binary.innerHTML = `
      <button class="choice" data-kind="solvable" type="button"><strong>動かせる</strong><small>自分たちの行動で影響できる</small></button>
      <button class="choice" data-kind="unsolvable" type="button"><strong>今は動かせない</strong><small>評価・過去・完全予測など</small></button>
    `;
    work.appendChild(binary);

    binary.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.classifyLocked) return;
        state.classifyLocked = true;
        const chosen = button.dataset.kind;
        const ok = chosen === item.kind;
        if (ok) state.classifyHits += 1;
        button.classList.add(ok ? 'is-good' : 'is-bad');
        binary.querySelectorAll('button').forEach((b) => b.disabled = true);
        vibrate(ok ? 12 : [15,45,15]);

        const feedback = document.createElement('div');
        feedback.className = `feedback${ok ? '' : ' bad'}`;
        feedback.innerHTML = `<b>${ok ? 'その分け方でOK。' : 'ここは分け直せます。'}</b> ${item.why}`;
        work.appendChild(feedback);

        const row = document.createElement('div');
        row.className = 'continue-row';
        const last = state.classifyIndex === c.classify.length - 1;
        row.innerHTML = `<button class="primary" type="button">${last ? '次の手へ' : '次を仕分ける'} <span>→</span></button>`;
        work.appendChild(row);
        row.querySelector('button').addEventListener('click', () => {
          state.classifyLocked = false;
          if (last) {
            const map = [35, 50, 70, 85, 100];
            setStepScore(map[state.classifyHits] ?? 35);
            finishStep();
          } else {
            state.classifyIndex += 1;
            renderStep();
          }
        });
      });
    });
  }

  function renderSingleChoice(work, number, title, instruction, options) {
    work.innerHTML = stepHeader(number, title, instruction);
    const list = document.createElement('div');
    list.className = 'list-stack';
    options.forEach((opt) => {
      const button = document.createElement('button');
      button.className = 'choice';
      button.type = 'button';
      button.innerHTML = `<strong>${opt.text}</strong>`;
      button.addEventListener('click', () => {
        if (list.dataset.locked) return;
        list.dataset.locked = '1';
        list.querySelectorAll('button').forEach((b) => b.disabled = true);
        button.classList.add(opt.score >= 90 ? 'is-good' : 'is-bad');
        setStepScore(opt.score);
        vibrate(opt.score >= 90 ? 12 : [15,45,15]);
        const feedback = document.createElement('div');
        feedback.className = `feedback${opt.score >= 90 ? '' : ' bad'}`;
        feedback.innerHTML = `<b>${opt.score >= 90 ? '焦点が小さくなりました。' : 'もう少し操作できる形にできます。'}</b> ${opt.why}`;
        work.appendChild(feedback);
        const row = document.createElement('div');
        row.className = 'continue-row';
        row.innerHTML = '<button class="primary" type="button">次の手へ <span>→</span></button>';
        work.appendChild(row);
        row.querySelector('button').addEventListener('click', finishStep);
      });
      list.appendChild(button);
    });
    work.appendChild(list);
  }

  function renderFocus(work, c) {
    renderSingleChoice(work, 2, '1つだけ選ぶ', '「全部」ではなく、重要で、今から動かせる1つを最初の対象にします。', c.focus);
  }

  function renderDefine(work, c) {
    renderSingleChoice(work, 3, '問題を1文にする', '曖昧なラベルを、対象・変化・期限・未決事項が見える文へ縮めます。', c.define);
  }

  function renderIdeas(work, c) {
    work.innerHTML = stepHeader(4, '良し悪しを決めず、3方向から案を出す', 'この手だけは、すぐ評価しません。違う方向の案を3つ集めてから比べます。');
    state.ideaSelection = [];
    const grid = document.createElement('div');
    grid.className = 'idea-grid';
    c.ideas.forEach((idea) => {
      const button = document.createElement('button');
      button.className = 'idea-card';
      button.type = 'button';
      button.dataset.id = idea.id;
      button.innerHTML = `<span class="lever">${idea.lever}</span><strong>${idea.text}</strong><small>${idea.family}方向の案</small>`;
      button.addEventListener('click', () => {
        const pos = state.ideaSelection.indexOf(idea.id);
        if (pos >= 0) {
          state.ideaSelection.splice(pos, 1);
          button.classList.remove('is-selected');
        } else if (state.ideaSelection.length < 3) {
          state.ideaSelection.push(idea.id);
          button.classList.add('is-selected');
          vibrate(8);
        }
        counter.textContent = `${state.ideaSelection.length} / 3`;
        next.disabled = state.ideaSelection.length !== 3;
      });
      grid.appendChild(button);
    });
    work.appendChild(grid);
    const counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = '0 / 3';
    work.appendChild(counter);
    const row = document.createElement('div');
    row.className = 'continue-row';
    const next = document.createElement('button');
    next.className = 'primary';
    next.type = 'button';
    next.disabled = true;
    next.innerHTML = '3案を比べる <span>→</span>';
    row.appendChild(next);
    work.appendChild(row);
    next.addEventListener('click', () => {
      const families = new Set(state.ideaSelection.map((id) => c.ideas.find((x) => x.id === id).family));
      setStepScore(families.size === 3 ? 100 : families.size === 2 ? 80 : 60);
      finishStep();
    });
    const rule = document.createElement('div');
    rule.className = 'mini-rule';
    rule.textContent = 'コツ：同じ方向の案を3つ集めるより、「範囲・人・仕組み」のように方向を変える。';
    work.appendChild(rule);
  }

  function utility(idea) {
    return idea.impact + idea.feasibility - idea.load;
  }

  function metric(label, value) {
    return `
      <div class="metric-row">
        <span>${label}</span>
        <div class="metric-track"><div class="metric-fill" style="width:${value * 20}%"></div></div>
        <b>${value}</b>
      </div>
    `;
  }

  function renderDecide(work, c) {
    work.innerHTML = stepHeader(5, '効果 × 実行しやすさで1案を決める', 'さっき出した3案だけを比べます。大きく効いて、今できて、負担が重すぎない案を選びます。');
    const selected = state.ideaSelection.map((id) => c.ideas.find((x) => x.id === id));
    const bestUtility = Math.max(...selected.map(utility));
    const matrix = document.createElement('div');
    matrix.className = 'matrix';
    selected.forEach((idea) => {
      const card = document.createElement('div');
      card.className = 'plan-card';
      card.innerHTML = `
        <button class="choice" type="button"><strong>${idea.text}</strong></button>
        ${metric('効果', idea.impact)}
        ${metric('実行性', idea.feasibility)}
        ${metric('負担', 6 - idea.load)}
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (matrix.dataset.locked) return;
        matrix.dataset.locked = '1';
        matrix.querySelectorAll('button').forEach((b) => b.disabled = true);
        const best = utility(idea) === bestUtility;
        card.querySelector('button').classList.add(best ? 'is-good' : 'is-bad');
        setStepScore(best ? 100 : 72);
        vibrate(best ? 12 : [15,45,15]);
        const feedback = document.createElement('div');
        feedback.className = `feedback${best ? '' : ' bad'}`;
        const strongest = selected.slice().sort((a,b) => utility(b) - utility(a))[0];
        feedback.innerHTML = best
          ? `<b>実行に移しやすい案です。</b> 「効果が高い」だけでなく、実行性と負担も同時に見ています。`
          : `<b>悪い案とは限りません。</b> 今回の3案では「${strongest.text}」の方が、効果と実行性のバランスが高めです。`;
        work.appendChild(feedback);
        const row = document.createElement('div');
        row.className = 'continue-row';
        row.innerHTML = '<button class="primary" type="button">実行計画へ <span>→</span></button>';
        work.appendChild(row);
        row.querySelector('button').addEventListener('click', finishStep);
      });
      matrix.appendChild(card);
    });
    work.appendChild(matrix);
  }

  function shuffled(array) {
    return array.map((x) => ({ x, r: Math.random() })).sort((a,b) => a.r - b.r).map(({x}) => x);
  }

  function renderPlan(work, c) {
    work.innerHTML = stepHeader(6, '「いつ・何を」の順番にする', '行動は、考え方ではなく予定にします。下のカードを実行する順にタップしてください。');
    state.orderSelection = [];
    const pool = shuffled(c.plan);
    const source = document.createElement('div');
    source.className = 'order-source';
    const stack = document.createElement('div');
    stack.className = 'order-stack';
    stack.innerHTML = '<span class="instruction">ここに実行順で積みます</span>';

    function refresh() {
      stack.innerHTML = '';
      if (!state.orderSelection.length) stack.innerHTML = '<span class="instruction">ここに実行順で積みます</span>';
      state.orderSelection.forEach((order) => {
        const item = c.plan.find((x) => x.order === order);
        const card = document.createElement('button');
        card.className = 'order-card';
        card.type = 'button';
        card.textContent = `${state.orderSelection.indexOf(order) + 1}. ${item.text}`;
        card.addEventListener('click', () => {
          if (state.orderSelection[state.orderSelection.length - 1] !== order) return;
          state.orderSelection.pop();
          refresh();
          renderPool();
        });
        stack.appendChild(card);
      });
      done.disabled = state.orderSelection.length !== c.plan.length;
    }

    function renderPool() {
      source.innerHTML = '';
      pool.filter((item) => !state.orderSelection.includes(item.order)).forEach((item) => {
        const button = document.createElement('button');
        button.className = 'order-card';
        button.type = 'button';
        button.textContent = item.text;
        button.addEventListener('click', () => {
          state.orderSelection.push(item.order);
          vibrate(8);
          refresh();
          renderPool();
        });
        source.appendChild(button);
      });
    }

    work.appendChild(stack);
    work.appendChild(source);
    const row = document.createElement('div');
    row.className = 'continue-row';
    const done = document.createElement('button');
    done.className = 'primary';
    done.type = 'button';
    done.disabled = true;
    done.innerHTML = 'この順で実行する <span>→</span>';
    row.appendChild(done);
    work.appendChild(row);
    renderPool();
    refresh();

    done.addEventListener('click', () => {
      const exact = state.orderSelection.every((order, idx) => order === idx + 1);
      const first = state.orderSelection[0] === 1;
      setStepScore(exact ? 100 : first ? 78 : 55);
      done.disabled = true;
      source.querySelectorAll('button').forEach((b) => b.disabled = true);
      const feedback = document.createElement('div');
      feedback.className = `feedback${exact ? '' : ' bad'}`;
      feedback.innerHTML = exact
        ? '<b>行動できる計画になりました。</b> 最初の15〜30分が見えると、問題は「考えるもの」から「進めるもの」に変わります。'
        : `<b>順番を整えると、もっと動きやすい。</b> おすすめは「${c.plan.map((x) => x.text).join(' → ')}」。`;
      work.appendChild(feedback);
      const nextRow = document.createElement('div');
      nextRow.className = 'continue-row';
      nextRow.innerHTML = '<button class="primary" type="button">最後に見直す <span>→</span></button>';
      work.appendChild(nextRow);
      nextRow.querySelector('button').addEventListener('click', finishStep);
    });
  }

  function renderReview(work, c) {
    work.innerHTML = stepHeader(7, '結果を見て、効いた部分だけ残す', '計画は当てるものではなく、試して調整するもの。結果を見て次の一手を選びます。');
    const outcome = document.createElement('div');
    outcome.className = 'outcome';
    outcome.innerHTML = `<b>やってみた結果</b><br>${c.outcome}`;
    work.appendChild(outcome);
    const options = document.createElement('div');
    options.className = 'review-options';
    c.review.forEach((opt) => {
      const button = document.createElement('button');
      button.className = 'choice';
      button.type = 'button';
      button.innerHTML = `<strong>${opt.text}</strong>`;
      button.addEventListener('click', () => {
        if (options.dataset.locked) return;
        options.dataset.locked = '1';
        options.querySelectorAll('button').forEach((b) => b.disabled = true);
        const good = opt.score >= 90;
        button.classList.add(good ? 'is-good' : 'is-bad');
        setStepScore(opt.score);
        vibrate(good ? 12 : [15,45,15]);
        const feedback = document.createElement('div');
        feedback.className = `feedback${good ? '' : ' bad'}`;
        feedback.innerHTML = `<b>${good ? 'レビュー完了。' : '調整の余地があります。'}</b> ${opt.why}`;
        work.appendChild(feedback);
        const row = document.createElement('div');
        row.className = 'continue-row';
        row.innerHTML = '<button class="primary" type="button">今回の解き方を見る <span>→</span></button>';
        work.appendChild(row);
        row.querySelector('button').addEventListener('click', finishStep);
      });
      options.appendChild(button);
    });
    work.appendChild(options);
  }

  function finishSession() {
    saved.sessions += 1;
    const c = currentCase();
    if (!saved.seen.includes(c.id)) saved.seen.push(c.id);
    state.scores.forEach((score, i) => {
      saved.mastery[i] += score || 0;
      saved.counts[i] += 1;
    });
    persist();

    const total = Math.round(state.scores.reduce((sum, x) => sum + x, 0) / 7);
    $('resultScore').textContent = String(total);

    const ranked = state.scores.map((score, i) => ({ score, i })).sort((a,b) => b.score - a.score);
    const strong = STEP_NAMES[ranked[0].i];
    const weak = STEP_NAMES[ranked[ranked.length - 1].i];
    $('resultMessage').innerHTML = `今回いちばん良かったのは <b>「${strong}」</b>。次は <b>「${weak}」</b> を意識すると、問題をさらに小さくできます。`;

    const bars = $('skillBars');
    bars.innerHTML = '';
    state.scores.forEach((score, i) => {
      const row = document.createElement('div');
      row.className = 'skill-bar';
      row.innerHTML = `<span>${i + 1}. ${STEP_NAMES[i]}</span><div class="bar"><i style="width:${score}%"></i></div><b>${score}</b>`;
      bars.appendChild(row);
    });
    $('carryRule').textContent = c.rule;
    updateStartSummary();
    showScreen('resultScreen');
  }

  function startCase() {
    state.step = 0;
    state.scores = [];
    state.classifyIndex = 0;
    state.classifyHits = 0;
    state.classifyLocked = false;
    state.ideaSelection = [];
    state.orderSelection = [];
    showScreen('trainingScreen');
    renderStep();
  }

  function chooseAnotherCase() {
    state.caseIndex = nextUnseenIndex(state.caseIndex);
    const c = currentCase();
    $('caseButton').textContent = `次は「${c.title}」`;
    vibrate(8);
  }

  $('startButton').addEventListener('click', startCase);
  $('caseButton').addEventListener('click', chooseAnotherCase);
  $('nextCaseButton').addEventListener('click', () => {
    state.caseIndex = nextUnseenIndex(state.caseIndex);
    startCase();
  });
  $('resetButton').addEventListener('click', () => {
    if (!window.confirm('このアプリの練習記録をリセットしますか？')) return;
    localStorage.removeItem(STORAGE_KEY);
    saved = loadSaved();
    state.caseIndex = 0;
    updateStartSummary();
    $('caseButton').textContent = 'ケースを変える';
    showScreen('startScreen');
  });

  state.caseIndex = nextUnseenIndex(-1);
  updateStartSummary();
})();
