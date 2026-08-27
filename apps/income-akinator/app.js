(() => {
  'use strict';

  const STORAGE_KEY = 'levelup-income-akinator-last-v1';
  const MAX_QUESTIONS = 12;
  const MIN_QUESTIONS = 10;

  const QUESTIONS = [
    { id: 'salarySource', group: 'job', weight: 1.6, label: '給与が収入の中心', text: 'あなたの収入の半分以上は、会社や組織から受け取る給与ですか？' },
    { id: 'businessOwner', group: 'job', weight: 1.7, label: '自分で売上をつくる', text: '自分で売上をつくる、または事業の利益が自分の収入に直結しますか？' },
    { id: 'managesPeople', group: 'income', weight: 1.35, label: '人をマネジメントする', text: '部下やメンバーの評価・採用・配置に関わりますか？' },
    { id: 'executiveDecisions', group: 'income', weight: 1.65, label: '経営判断に関わる', text: '会社全体の経営判断や、大きな事業方針の決定に直接関わりますか？' },
    { id: 'clientFacing', group: 'job', weight: 1.15, label: '顧客対応が多い', text: '仕事時間のかなりの割合を、顧客や取引先とのやり取りに使いますか？' },
    { id: 'salesTarget', group: 'job', weight: 1.5, label: '営業数字を追う', text: '売上・契約・受注など、はっきりした営業数字を追っていますか？' },
    { id: 'advisory', group: 'job', weight: 1.45, label: '課題解決を提案する', text: '他社や他部署の課題を整理して、解決策を提案することが仕事の中心ですか？' },
    { id: 'codeData', group: 'job', weight: 1.55, label: 'コード・データを扱う', text: 'コード・システム・データ分析のどれかを、ほぼ毎日扱いますか？' },
    { id: 'marketing', group: 'job', weight: 1.5, label: '集客の数字を見る', text: '広告・集客・EC・SNS・アクセス解析などの数字をよく見ますか？' },
    { id: 'finance', group: 'job', weight: 1.55, label: 'お金の数字を扱う', text: '会計・財務・経理・金融の数字を扱うことが仕事の中心ですか？' },
    { id: 'licensed', group: 'job', weight: 1.35, label: '資格・免許が重要', text: '資格や免許がないと、その仕事をするのが難しい職種ですか？' },
    { id: 'healthcare', group: 'job', weight: 1.8, label: '健康・治療に関わる', text: '人の身体・健康・治療に直接関わる仕事ですか？' },
    { id: 'education', group: 'job', weight: 1.65, label: '教えることが中心', text: '人に教えることが、仕事の中心ですか？' },
    { id: 'publicOrg', group: 'job', weight: 1.55, label: '公的機関で働く', text: '主な勤務先は、国・自治体・公的機関ですか？' },
    { id: 'creative', group: 'job', weight: 1.2, label: 'クリエイティブを作る', text: 'デザイン・文章・映像・企画表現など、何かを作る時間が長いですか？' },
    { id: 'physical', group: 'job', weight: 1.35, label: '体を動かす時間が長い', text: 'デスクワークより、体を動かす時間のほうが長いですか？' },
    { id: 'fieldWork', group: 'job', weight: 1.3, label: '現場で働く', text: 'オフィスより、店舗・工場・現場・屋外で働く時間が長いですか？' },
    { id: 'research', group: 'job', weight: 1.4, label: '研究・検証が中心', text: '実験・検証・研究・技術開発のように、答えが決まっていないものを深く調べますか？' },
    { id: 'officeDocs', group: 'job', weight: 1, label: 'オフィス業務が中心', text: '資料作成・調整・手続き・管理などのオフィス業務が中心ですか？' },
    { id: 'performancePay', group: 'income', weight: 1.25, label: '成果で収入が変わる', text: '成果によって、賞与・歩合・利益などの収入が大きく変わりますか？' },
    { id: 'experience10', group: 'income', weight: 1, label: '経験10年以上', text: 'この仕事、または近い分野での経験は10年以上ありますか？' },
    { id: 'experience20', group: 'income', weight: .9, label: '経験20年以上', text: 'その経験は20年以上ありますか？' },
    { id: 'largeBudget', group: 'income', weight: 1.2, label: '大きな売上・予算を持つ', text: '数千万円以上の売上・予算・案件に、直接責任を持つことがありますか？' }
  ];

  const CANDIDATES = [
    { id: 'executive', name: '経営者・会社役員', short: '経営', base: 1400, low: 700, high: 3000, traits: { salarySource: -.2, businessOwner: .9, managesPeople: .9, executiveDecisions: 1, clientFacing: .4, salesTarget: .4, advisory: .3, performancePay: .8, largeBudget: 1, experience10: .8, experience20: .4 } },
    { id: 'consultant', name: 'コンサルタント', short: 'コンサル', base: 850, low: 500, high: 1500, traits: { salarySource: .6, clientFacing: .9, advisory: 1, officeDocs: .7, codeData: .3, largeBudget: .5, performancePay: .2, physical: -.7, fieldWork: -.6 } },
    { id: 'engineer', name: 'ITエンジニア', short: 'IT', base: 650, low: 400, high: 1100, traits: { salarySource: .8, codeData: 1, officeDocs: .4, clientFacing: -.3, physical: -.9, fieldWork: -.8, research: .3 } },
    { id: 'marketing', name: 'マーケター・EC運営', short: 'マーケ・EC', base: 620, low: 380, high: 1000, traits: { salarySource: .7, marketing: 1, codeData: .4, creative: .5, officeDocs: .6, salesTarget: .3, clientFacing: .2 } },
    { id: 'sales', name: '営業職', short: '営業', base: 600, low: 350, high: 1100, traits: { salarySource: .8, clientFacing: 1, salesTarget: 1, advisory: .4, performancePay: .7, officeDocs: .2 } },
    { id: 'manager', name: '管理職・経営企画', short: '管理・企画', base: 800, low: 500, high: 1300, traits: { salarySource: .9, managesPeople: .9, executiveDecisions: .5, officeDocs: .8, largeBudget: .7, experience10: .7, clientFacing: .2 } },
    { id: 'finance', name: '経理・財務・金融', short: '財務・金融', base: 680, low: 400, high: 1100, traits: { salarySource: .9, finance: 1, officeDocs: .9, codeData: .3, clientFacing: -.1, physical: -.9, fieldWork: -.8 } },
    { id: 'healthcare', name: '医療専門職', short: '医療', base: 650, low: 350, high: 1200, traits: { salarySource: .7, licensed: 1, healthcare: 1, clientFacing: .8, physical: .3, fieldWork: .3, officeDocs: -.2 } },
    { id: 'teacher', name: '教師・講師', short: '教育', base: 540, low: 320, high: 850, traits: { salarySource: .8, education: 1, clientFacing: .7, licensed: .4, publicOrg: .2, officeDocs: .3 } },
    { id: 'public', name: '公務員・公的機関職員', short: '公務', base: 560, low: 350, high: 850, traits: { salarySource: 1, publicOrg: 1, officeDocs: .7, performancePay: -.8, businessOwner: -1, salesTarget: -.8 } },
    { id: 'creative', name: 'デザイナー・クリエイター', short: 'クリエイティブ', base: 500, low: 300, high: 900, traits: { salarySource: .4, creative: 1, codeData: .2, officeDocs: .3, businessOwner: .1, clientFacing: .3, physical: -.5 } },
    { id: 'manufacturing', name: '製造・技術職', short: '製造・技術', base: 550, low: 350, high: 850, traits: { salarySource: .9, fieldWork: .8, physical: .5, codeData: .2, research: .2, officeDocs: -.2 } },
    { id: 'construction', name: '建設・現場職', short: '建設・現場', base: 560, low: 350, high: 900, traits: { salarySource: .7, fieldWork: 1, physical: 1, clientFacing: .1, officeDocs: -.6, licensed: .3 } },
    { id: 'service', name: '小売・接客・サービス', short: '接客・サービス', base: 400, low: 260, high: 650, traits: { salarySource: .9, clientFacing: 1, physical: .5, fieldWork: .7, officeDocs: -.5, salesTarget: .2 } },
    { id: 'backoffice', name: '事務・バックオフィス', short: '事務', base: 450, low: 300, high: 700, traits: { salarySource: 1, officeDocs: 1, clientFacing: -.2, salesTarget: -.7, physical: -.8, fieldWork: -.7, codeData: .1 } },
    { id: 'freelance', name: '個人事業・フリーランス', short: 'フリーランス', base: 650, low: 300, high: 1500, traits: { salarySource: -1, businessOwner: .8, clientFacing: .7, performancePay: .9, creative: .4, codeData: .3, salesTarget: .3 } },
    { id: 'licensedProfessional', name: '士業・専門資格職', short: '士業', base: 800, low: 450, high: 1600, traits: { salarySource: .2, businessOwner: .4, licensed: 1, advisory: .8, clientFacing: .8, healthcare: -.8, officeDocs: .7 } },
    { id: 'researcher', name: '研究・開発職', short: '研究・開発', base: 650, low: 400, high: 1000, traits: { salarySource: .9, research: 1, codeData: .5, clientFacing: -.6, salesTarget: -.7, officeDocs: .4, physical: -.3 } }
  ];

  const questionById = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const state = { answers: {}, trail: [], screen: 'intro', locked: false, result: null };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const ui = {
    screens: $$('.screen'),
    lastResult: $('.last-result'),
    lastResultText: $('[data-last-result]'),
    qNumber: $('[data-question-number]'),
    candidateCount: $('[data-candidate-count]'),
    progress: $('[data-progress]'),
    card: $('[data-question-card]'),
    qMode: $('[data-question-mode]'),
    leading: $('[data-leading-candidate]'),
    qText: $('[data-question-text]'),
    leadingShort: $('[data-leading-short]'),
    secondShort: $('[data-second-short]'),
    yes: $('[data-answer="yes"]'),
    no: $('[data-answer="no"]'),
    undo: $('[data-action="undo"]'),
    confidence: $('[data-confidence]'),
    jobResult: $('[data-job-result]'),
    incomeResult: $('[data-income-result]'),
    incomeRange: $('[data-income-range]'),
    reasons: $('[data-reasons]'),
    alternatives: $('[data-alternatives]'),
    share: $('[data-action="share"]'),
    toast: $('[data-toast]')
  };

  function scoreCandidate(candidate, answers) {
    let score = 0;
    for (const [id, answer] of Object.entries(answers)) {
      const q = questionById[id];
      if (!q || typeof answer !== 'boolean') continue;
      const trait = candidate.traits[id] || 0;
      score += (answer ? 1 : -1) * trait * q.weight;
    }
    return score;
  }

  function rankCandidates(answers = state.answers) {
    return CANDIDATES
      .map((candidate) => ({ ...candidate, score: scoreCandidate(candidate, answers) }))
      .sort((a, b) => b.score - a.score);
  }

  function questionEligible(question, answers) {
    if (typeof answers[question.id] === 'boolean') return false;
    if (question.id === 'experience20' && answers.experience10 !== true) return false;
    return true;
  }

  function pickBestQuestion(answers) {
    const answered = Object.keys(answers).length;
    if (answered === 0) return questionById.salarySource;

    const eligible = QUESTIONS.filter((q) => questionEligible(q, answers));
    if (!eligible.length) return null;

    const incomeAnswered = QUESTIONS.filter((q) => q.group === 'income' && typeof answers[q.id] === 'boolean').length;
    if (answered >= 7 && incomeAnswered < 3) {
      const order = ['experience10', 'experience20', 'managesPeople', 'largeBudget', 'performancePay', 'executiveDecisions'];
      for (const id of order) {
        const q = questionById[id];
        if (q && questionEligible(q, answers)) return q;
      }
    }

    const ranked = rankCandidates(answers).slice(0, 8);
    const weights = ranked.map((_, index) => Math.max(1, 9 - index));
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const jobQuestions = eligible.filter((q) => q.group === 'job');
    const pool = jobQuestions.length && answered < 9 ? jobQuestions : eligible;

    return pool
      .map((question) => {
        const mean = ranked.reduce((sum, candidate, index) => sum + (candidate.traits[question.id] || 0) * weights[index], 0) / weightTotal;
        const variance = ranked.reduce((sum, candidate, index) => {
          const trait = candidate.traits[question.id] || 0;
          return sum + ((trait - mean) ** 2) * weights[index];
        }, 0) / weightTotal;
        const balanceBonus = 1 - Math.min(1, Math.abs(mean));
        return { question, value: variance * question.weight + balanceBonus * .35 };
      })
      .sort((a, b) => b.value - a.value)[0].question;
  }

  function shouldFinish(answers) {
    const count = Object.keys(answers).length;
    if (count >= MAX_QUESTIONS) return true;
    if (count < MIN_QUESTIONS) return false;
    const ranked = rankCandidates(answers);
    const margin = (ranked[0]?.score || 0) - (ranked[1]?.score || 0);
    const incomeAnswered = QUESTIONS.filter((q) => q.group === 'income' && typeof answers[q.id] === 'boolean').length;
    return margin >= 3.2 && incomeAnswered >= 3;
  }

  function estimateIncome(candidate, answers) {
    let multiplier = 1;
    if (answers.experience10 === true) multiplier *= 1.08;
    if (answers.experience10 === false) multiplier *= .88;
    if (answers.experience20 === true) multiplier *= 1.11;
    if (answers.managesPeople === true) multiplier *= 1.09;
    if (answers.executiveDecisions === true) multiplier *= 1.2;
    if (answers.largeBudget === true) multiplier *= 1.08;
    if (answers.performancePay === true) multiplier *= 1.05;
    if (answers.businessOwner === true) multiplier *= 1.09;
    const income = Math.max(250, Math.min(3500, Math.round((candidate.base * multiplier) / 10) * 10));
    const scale = income / candidate.base;
    const low = Math.max(220, Math.round((candidate.low * scale) / 10) * 10);
    const high = Math.max(low + 100, Math.min(5000, Math.round((candidate.high * scale) / 10) * 10));
    return { income, low, high };
  }

  function confidenceFor(ranked, count) {
    const margin = (ranked[0]?.score || 0) - (ranked[1]?.score || 0);
    return Math.max(52, Math.min(94, Math.round(56 + margin * 6 + count * 1.2)));
  }

  function plausibleCount(ranked) {
    const top = ranked[0]?.score || 0;
    return Math.max(1, ranked.filter((candidate) => candidate.score >= top - 3.5).length);
  }

  function reasonsFor(candidate, answers) {
    return Object.entries(answers)
      .map(([id, answer]) => {
        const q = questionById[id];
        if (!q || typeof answer !== 'boolean') return null;
        const trait = candidate.traits[id] || 0;
        const agreement = (answer ? 1 : -1) * trait * q.weight;
        return agreement > .25 ? { label: q.label, value: agreement } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((item) => item.label);
  }

  function showScreen(name) {
    state.screen = name;
    ui.screens.forEach((screen) => screen.classList.toggle('is-active', screen.dataset.screen === name));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function renderProgress(answerCount) {
    ui.progress.innerHTML = '';
    for (let i = 0; i < MAX_QUESTIONS; i += 1) {
      const dot = document.createElement('span');
      if (i < answerCount) dot.className = 'done';
      else if (i === answerCount) dot.className = 'current';
      ui.progress.append(dot);
    }
  }

  function currentQuestion() {
    const id = state.trail[state.trail.length - 1];
    return questionById[id] || questionById.salarySource;
  }

  function renderQuestion() {
    const q = currentQuestion();
    const count = Object.keys(state.answers).length;
    const ranked = rankCandidates();
    ui.qNumber.textContent = String(count + 1).padStart(2, '0');
    ui.candidateCount.textContent = String(plausibleCount(ranked));
    ui.qMode.textContent = q.group === 'income' ? '年収を読んでいます' : '職業を絞っています';
    ui.leading.textContent = count ? ranked[0].short : '分析中';
    ui.qText.textContent = q.text;
    ui.leadingShort.textContent = count ? ranked[0].short : '分析中';
    ui.secondShort.textContent = count ? (ranked[1]?.short || '?') : '?';
    ui.undo.disabled = state.trail.length <= 1 || state.locked;
    renderProgress(count);
  }

  function renderResult() {
    const ranked = rankCandidates();
    const winner = ranked[0];
    const estimate = estimateIncome(winner, state.answers);
    const confidence = confidenceFor(ranked, Object.keys(state.answers).length);
    const reasons = reasonsFor(winner, state.answers);
    state.result = { winner, estimate, confidence, ranked };

    ui.confidence.textContent = `推理確度 ${confidence}%`;
    ui.jobResult.textContent = winner.name;
    ui.incomeResult.textContent = String(estimate.income);
    ui.incomeRange.textContent = `ゲーム内推定レンジ：${estimate.low.toLocaleString()}〜${estimate.high.toLocaleString()}万円`;
    ui.reasons.innerHTML = '';
    (reasons.length ? reasons : ['回答パターン全体']).forEach((reason) => {
      const chip = document.createElement('span');
      chip.textContent = reason;
      ui.reasons.append(chip);
    });

    ui.alternatives.innerHTML = '';
    ranked.slice(1, 3).forEach((candidate, index) => {
      const row = document.createElement('div');
      row.className = 'alt-row';
      const altEstimate = estimateIncome(candidate, state.answers);
      row.innerHTML = `<span>0${index + 2}</span><strong>${candidate.name}</strong><small>約${altEstimate.income}万円</small>`;
      ui.alternatives.append(row);
    });

    const saved = { name: winner.name, income: estimate.income, at: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (_) {}
    renderLastResult(saved);
    showScreen('result');
  }

  function renderLastResult(value) {
    if (!value || !value.name || !Number.isFinite(value.income)) {
      ui.lastResult.hidden = true;
      return;
    }
    ui.lastResultText.textContent = `${value.name} / ${value.income.toLocaleString()}万円`;
    ui.lastResult.hidden = false;
  }

  function loadLastResult() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      renderLastResult(value);
    } catch (_) {
      renderLastResult(null);
    }
  }

  function startGame() {
    state.answers = {};
    state.trail = ['salarySource'];
    state.locked = false;
    state.result = null;
    ui.yes.classList.remove('selected');
    ui.no.classList.remove('selected');
    renderQuestion();
    showScreen('question');
  }

  function haptic(value) {
    try {
      if (navigator.vibrate) navigator.vibrate(value ? 18 : [10, 22, 10]);
    } catch (_) {}
  }

  function answer(value) {
    if (state.locked || state.screen !== 'question') return;
    state.locked = true;
    const q = currentQuestion();
    const button = value ? ui.yes : ui.no;
    button.classList.add('selected');
    ui.yes.disabled = true;
    ui.no.disabled = true;
    ui.card.classList.add('scanning');
    haptic(value);

    window.setTimeout(() => {
      state.answers = { ...state.answers, [q.id]: value };
      button.classList.remove('selected');
      ui.yes.disabled = false;
      ui.no.disabled = false;
      ui.card.classList.remove('scanning');
      state.locked = false;

      if (shouldFinish(state.answers)) {
        renderResult();
        return;
      }
      const next = pickBestQuestion(state.answers);
      if (!next) {
        renderResult();
        return;
      }
      state.trail.push(next.id);
      renderQuestion();
    }, 230);
  }

  function undoQuestion() {
    if (state.locked || state.trail.length <= 1) return;
    state.trail.pop();
    const previousId = state.trail[state.trail.length - 1];
    const nextAnswers = { ...state.answers };
    delete nextAnswers[previousId];
    state.answers = nextAnswers;
    renderQuestion();
  }

  function undoFromResult() {
    if (!state.trail.length) return;
    const lastId = state.trail[state.trail.length - 1];
    const nextAnswers = { ...state.answers };
    delete nextAnswers[lastId];
    state.answers = nextAnswers;
    state.result = null;
    renderQuestion();
    showScreen('question');
  }

  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { ui.toast.hidden = true; }, 1600);
  }

  async function shareResult() {
    if (!state.result) return;
    const { winner, estimate } = state.result;
    const text = `年収アキネーターの予想：${winner.name} / 推定年収 ${estimate.income.toLocaleString()}万円。はい・いいえだけで当てられる？`;
    const url = `${location.origin}${location.pathname}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: '年収アキネーター', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast('結果をコピーしました');
    } catch (error) {
      if (error?.name !== 'AbortError') toast('共有をキャンセルしました');
    }
  }

  $$('[data-action="start"], [data-action="restart"]').forEach((button) => button.addEventListener('click', startGame));
  ui.yes.addEventListener('click', () => answer(true));
  ui.no.addEventListener('click', () => answer(false));
  ui.undo.addEventListener('click', undoQuestion);
  $('[data-action="undo-result"]').addEventListener('click', undoFromResult);
  ui.share.addEventListener('click', shareResult);

  loadLastResult();
})();
