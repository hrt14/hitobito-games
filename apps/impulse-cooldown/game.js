(function () {
  'use strict';

  var LS_LOCKER = 'impulse-cooldown:locker:v1';
  var LS_HISTORY = 'impulse-cooldown:history:v1';
  var LS_DRAFT = 'impulse-cooldown:draft:v1';
  var COOLDOWN_MS = 24 * 60 * 60 * 1000;

  var REASONS = [
    { id: 'sns', label: 'SNSで見た', weight: 3, rule: 'SNSで見た「欲しい」は、明日には他の投稿に書き換わっている。' },
    { id: 'sale', label: 'セール・期間限定', weight: 3, rule: '「今だけ」の言葉は、来月も同じセールで使われている。' },
    { id: 'urgency', label: '今日だけ・残りわずか', weight: 3, rule: '売り切れの不安は、欲しさとは別の感情。' },
    { id: 'mood', label: '気分転換にほしい', weight: 2, rule: '気分を変えたいなら、買い物以外にも方法がある。' },
    { id: 'longwanted', label: 'ずっと欲しかった', weight: 0, rule: 'ずっと欲しかったものは、24時間待っても欲しいままのことが多い。' },
  ];

  var app = document.getElementById('app');
  var historyButton = document.getElementById('historyButton');

  var state = { screen: 'home', draft: null };

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function loadLocker() { return loadJSON(LS_LOCKER, []); }
  function saveLocker(list) { saveJSON(LS_LOCKER, list); }
  function loadHistory() { return loadJSON(LS_HISTORY, []); }
  function saveHistory(list) { saveJSON(LS_HISTORY, list); }
  function loadDraft() {
    try {
      var raw = localStorage.getItem(LS_DRAFT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveDraft(draft) {
    if (draft) { try { localStorage.setItem(LS_DRAFT, JSON.stringify(draft)); } catch (e) {} }
    else { try { localStorage.removeItem(LS_DRAFT); } catch (e) {} }
  }

  function reasonOf(id) {
    for (var i = 0; i < REASONS.length; i++) if (REASONS[i].id === id) return REASONS[i];
    return null;
  }
  function yen(n) {
    var num = Number(n) || 0;
    return '¥' + num.toLocaleString('ja-JP');
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }
  function newId() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function computeScore(draft) {
    var reason = reasonOf(draft.reason);
    var score = reason ? reason.weight : 0;
    if (draft.needNow === 'no') score += 2;
    if (draft.stillWant === 'no') score += 3;
    else if (draft.stillWant === 'unsure') score += 2;
    return score;
  }
  function scoreLevel(score) {
    if (score >= 6) return 'high';
    if (score >= 3) return 'mid';
    return 'low';
  }
  var LEVEL_TEXT = {
    high: '衝動サイン、強め。',
    mid: '少し様子を見てもいいかも。',
    low: '本当に欲しいものかもしれない。',
  };

  function formatCountdown(ms) {
    if (ms <= 0) return 'まもなく見直せる';
    var totalMin = Math.ceil(ms / 60000);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if (h <= 0) return 'あと' + m + '分';
    return 'あと' + h + '時間' + (m > 0 ? m + '分' : '');
  }

  var DRAFT_SCREENS = ['add', 'checkReason', 'checkNeed', 'checkWant', 'decision'];

  function go(screen) {
    state.screen = screen;
    if (state.draft && DRAFT_SCREENS.indexOf(screen) !== -1) {
      state.draft.step = screen;
      saveDraft(state.draft);
    }
    render();
    window.scrollTo(0, 0);
  }

  function startAdd() {
    state.draft = { step: 'add', name: '', price: '', reason: null, needNow: null, stillWant: null };
    saveDraft(state.draft);
    go('add');
  }
  function cancelDraft() {
    state.draft = null;
    saveDraft(null);
    go('home');
  }

  function finalizeDecision(decision, source) {
    var draft = state.draft;
    var record = {
      id: newId(),
      name: draft.name,
      price: Number(draft.price) || 0,
      reason: draft.reason,
      decision: decision,
      source: source || 'first',
      decidedAt: Date.now(),
    };
    var history = loadHistory();
    history.unshift(record);
    saveHistory(history);
    state.lastRecord = record;
    state.draft = null;
    saveDraft(null);
    go(decision === 'bought' ? 'confirmBuy' : 'confirmDiscard');
  }

  function sendToLocker() {
    var draft = state.draft;
    var item = {
      id: newId(),
      name: draft.name,
      price: Number(draft.price) || 0,
      reason: draft.reason,
      needNow: draft.needNow,
      stillWant: draft.stillWant,
      createdAt: Date.now(),
      unlockAt: Date.now() + COOLDOWN_MS,
      extended: false,
    };
    var locker = loadLocker();
    locker.unshift(item);
    saveLocker(locker);
    state.draft = null;
    saveDraft(null);
    state.lastRecord = item;
    go('confirmWait');
  }

  function openRecheck(id) {
    state.recheckId = id;
    go('recheckAsk');
  }
  function currentRecheckItem() {
    var locker = loadLocker();
    for (var i = 0; i < locker.length; i++) if (locker[i].id === state.recheckId) return locker[i];
    return null;
  }
  function removeFromLocker(id) {
    var locker = loadLocker().filter(function (item) { return item.id !== id; });
    saveLocker(locker);
  }
  function recheckFinalize(decision) {
    var item = currentRecheckItem();
    if (!item) { go('home'); return; }
    removeFromLocker(item.id);
    var record = {
      id: newId(),
      name: item.name,
      price: item.price,
      reason: item.reason,
      decision: decision,
      source: 'cooldown',
      decidedAt: Date.now(),
    };
    var history = loadHistory();
    history.unshift(record);
    saveHistory(history);
    state.lastRecord = record;
    go(decision === 'bought' ? 'confirmBuy' : 'confirmDiscard');
  }
  function recheckExtend() {
    var item = currentRecheckItem();
    if (!item) { go('home'); return; }
    var locker = loadLocker().map(function (entry) {
      if (entry.id !== item.id) return entry;
      entry.extended = true;
      entry.unlockAt = Date.now() + COOLDOWN_MS;
      return entry;
    });
    saveLocker(locker);
    state.lastRecord = item;
    go('confirmExtend');
  }

  function stats() {
    var history = loadHistory();
    var saved = 0, spent = 0, discardedCount = 0;
    var reasonTally = {};
    for (var i = 0; i < history.length; i++) {
      var r = history[i];
      if (r.decision === 'discarded') {
        saved += r.price;
        discardedCount += 1;
        reasonTally[r.reason] = (reasonTally[r.reason] || 0) + 1;
      } else if (r.decision === 'bought') {
        spent += r.price;
      }
    }
    var topReasonId = null, topCount = 0;
    Object.keys(reasonTally).forEach(function (key) {
      if (reasonTally[key] > topCount) { topCount = reasonTally[key]; topReasonId = key; }
    });
    return { saved: saved, spent: spent, discardedCount: discardedCount, topReasonId: topReasonId, topCount: topCount };
  }

  function render() {
    if (state.screen === 'home') return renderHome();
    if (state.screen === 'add') return renderAdd();
    if (state.screen === 'checkReason') return renderCheckReason();
    if (state.screen === 'checkNeed') return renderCheckNeed();
    if (state.screen === 'checkWant') return renderCheckWant();
    if (state.screen === 'decision') return renderDecision();
    if (state.screen === 'confirmBuy') return renderConfirm('bought');
    if (state.screen === 'confirmDiscard') return renderConfirm('discarded');
    if (state.screen === 'confirmWait') return renderConfirmWait();
    if (state.screen === 'confirmExtend') return renderConfirmExtend();
    if (state.screen === 'recheckAsk') return renderRecheckAsk();
    if (state.screen === 'recheckDecide') return renderRecheckDecide();
    if (state.screen === 'history') return renderHistory();
    renderHome();
  }

  function renderHome() {
    var locker = loadLocker();
    var ready = locker.filter(function (item) { return item.unlockAt <= Date.now(); });
    var waiting = locker.filter(function (item) { return item.unlockAt > Date.now(); });
    var s = stats();

    var html = '';
    html += '<section class="screen">';
    html += '<div class="eyebrow">IMPULSE COOLDOWN</div>';
    html += '<h1>24時間、寝かせる。</h1>';
    html += '<p class="subtitle">衝動じゃなく、選んで買う。</p>';

    html += '<div class="stat-row">';
    html += '<div class="stat-tile saved"><strong>' + escapeHtml(yen(s.saved)) + '</strong><span>浮いたお金</span></div>';
    html += '<div class="stat-tile"><strong>' + s.discardedCount + '</strong><span>やめた回数</span></div>';
    html += '<div class="stat-tile"><strong>' + escapeHtml(yen(s.spent)) + '</strong><span>買った金額</span></div>';
    html += '</div>';

    html += '<button class="add-cta" type="button" id="addCta">＋ 今ほしいものを追加</button>';

    if (ready.length) {
      html += '<div class="section">';
      html += '<div class="section-title">見直す<span class="badge-count">' + ready.length + '</span></div>';
      ready.forEach(function (item) {
        html += '<div class="item-card locker-card">';
        html += '<div class="row-top"><div class="item-name">' + escapeHtml(item.name) + '</div><div class="item-price">' + escapeHtml(yen(item.price)) + '</div></div>';
        html += '<div class="item-meta">24時間前: ' + escapeHtml(reasonOf(item.reason) ? reasonOf(item.reason).label : '') + '</div>';
        html += '<button class="recheck-btn" type="button" data-recheck="' + escapeHtml(item.id) + '">今、まだ欲しい？</button>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '<div class="section">';
    html += '<div class="section-title">寝かせ中<span class="badge-count">' + waiting.length + '</span></div>';
    if (waiting.length) {
      waiting.forEach(function (item) {
        html += '<div class="item-card">';
        html += '<div class="row-top"><div class="item-name">' + escapeHtml(item.name) + '</div><div class="item-price">' + escapeHtml(yen(item.price)) + '</div></div>';
        html += '<div class="item-meta waiting-note">' + escapeHtml(formatCountdown(item.unlockAt - Date.now())) + '</div>';
        html += '</div>';
      });
    } else if (!ready.length) {
      html += '<div class="empty-note">まだ何もない。ネットで欲しいものを見つけたら、買う前にここへ追加しよう。</div>';
    }
    html += '</div>';

    html += '</section>';
    app.innerHTML = html;

    var addBtn = document.getElementById('addCta');
    if (addBtn) addBtn.addEventListener('click', startAdd);
    var recheckBtns = app.querySelectorAll('[data-recheck]');
    recheckBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { openRecheck(btn.getAttribute('data-recheck')); });
    });
  }

  function backRow(onBack) {
    var wrap = document.createElement('div');
    wrap.className = 'back-row';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-button';
    btn.textContent = '← やめる';
    btn.addEventListener('click', onBack);
    wrap.appendChild(btn);
    return wrap;
  }

  function renderAdd() {
    var draft = state.draft || (state.draft = loadDraft() || { step: 'add', name: '', price: '', reason: null, needNow: null, stillWant: null });
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.appendChild(backRow(cancelDraft));
    section.insertAdjacentHTML('beforeend',
      '<div class="eyebrow">STEP 1 / 4</div>' +
      '<h1 style="font-size:clamp(28px,7.5vw,40px)">何がほしい？</h1>' +
      '<p class="subtitle">カートに入れたそのまま、名前と金額だけ。</p>' +
      '<div class="field-label">商品名</div>' +
      '<input class="field-input" id="itemName" type="text" placeholder="例）ワイヤレスイヤホン" maxlength="60" value="' + escapeHtml(draft.name) + '">' +
      '<div class="field-label">価格（円）</div>' +
      '<input class="field-input" id="itemPrice" type="number" inputmode="numeric" min="0" placeholder="例）12800" value="' + escapeHtml(draft.price) + '">' +
      '<button class="primary" id="nextBtn" type="button">次へ</button>'
    );
    app.appendChild(section);

    var nameInput = document.getElementById('itemName');
    var priceInput = document.getElementById('itemPrice');
    var nextBtn = document.getElementById('nextBtn');
    function sync() {
      draft.name = nameInput.value;
      draft.price = priceInput.value;
      saveDraft(draft);
    }
    nameInput.addEventListener('input', sync);
    priceInput.addEventListener('input', sync);
    nextBtn.addEventListener('click', function () {
      sync();
      if (!draft.name.trim()) { nameInput.focus(); return; }
      if (!(Number(draft.price) > 0)) { priceInput.focus(); return; }
      go('checkReason');
    });
  }

  function renderCheckReason() {
    var draft = state.draft;
    var html = '<div class="step-label">STEP 2 / 4</div>' +
      '<div class="question-card">' +
      '<div class="item-recap">' + escapeHtml(draft.name) + '（' + escapeHtml(yen(draft.price)) + '）</div>' +
      '<h2>今、なぜ欲しくなった？</h2>' +
      '<div class="choice-list" id="reasonList">' +
      REASONS.map(function (r) { return '<button type="button" data-reason="' + r.id + '">' + escapeHtml(r.label) + '</button>'; }).join('') +
      '</div></div>';
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.appendChild(backRow(function () { go('add'); }));
    section.insertAdjacentHTML('beforeend', html);
    app.appendChild(section);
    app.querySelectorAll('[data-reason]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draft.reason = btn.getAttribute('data-reason');
        saveDraft(draft);
        go('checkNeed');
      });
    });
  }

  function renderCheckNeed() {
    var draft = state.draft;
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.appendChild(backRow(function () { go('checkReason'); }));
    section.insertAdjacentHTML('beforeend',
      '<div class="step-label">STEP 3 / 4</div>' +
      '<div class="question-card">' +
      '<div class="item-recap">' + escapeHtml(draft.name) + '（' + escapeHtml(yen(draft.price)) + '）</div>' +
      '<h2>それが無くても、今日困る？</h2>' +
      '<div class="choice-grid-2">' +
      '<button type="button" data-need="yes">困る</button>' +
      '<button type="button" data-need="no">困らない</button>' +
      '</div></div>'
    );
    app.appendChild(section);
    app.querySelectorAll('[data-need]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draft.needNow = btn.getAttribute('data-need');
        saveDraft(draft);
        go('checkWant');
      });
    });
  }

  function renderCheckWant() {
    var draft = state.draft;
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.appendChild(backRow(function () { go('checkNeed'); }));
    section.insertAdjacentHTML('beforeend',
      '<div class="step-label">STEP 4 / 4</div>' +
      '<div class="question-card">' +
      '<div class="item-recap">' + escapeHtml(draft.name) + '（' + escapeHtml(yen(draft.price)) + '）</div>' +
      '<h2>1週間後も、まだ欲しいと思う？</h2>' +
      '<div class="choice-grid-3">' +
      '<button type="button" data-want="yes">はい</button>' +
      '<button type="button" data-want="unsure">わからない</button>' +
      '<button type="button" data-want="no">いいえ</button>' +
      '</div></div>'
    );
    app.appendChild(section);
    app.querySelectorAll('[data-want]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draft.stillWant = btn.getAttribute('data-want');
        saveDraft(draft);
        go('decision');
      });
    });
  }

  function renderDecision() {
    var draft = state.draft;
    var score = computeScore(draft);
    var level = scoreLevel(score);
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.insertAdjacentHTML('beforeend',
      '<div class="eyebrow">判定</div>' +
      '<h1 style="font-size:clamp(26px,7vw,36px)">' + escapeHtml(draft.name) + '</h1>' +
      '<p class="subtitle">' + escapeHtml(yen(draft.price)) + '</p>' +
      '<div class="impulse-badge ' + level + '">' + escapeHtml(LEVEL_TEXT[level]) + '</div>' +
      '<div class="bin-grid">' +
      '<button class="bin-button bin-buy" type="button" id="binBuy">今すぐ買う<small>もう迷わない。これは自分の選択。</small></button>' +
      '<button class="bin-button bin-wait" type="button" id="binWait">24時間だけ寝かせる<small>あと1日、判断を待つ。</small></button>' +
      '<button class="bin-button bin-discard" type="button" id="binDiscard">やめておく<small>今回は見送る。</small></button>' +
      '</div>'
    );
    app.appendChild(section);
    document.getElementById('binBuy').addEventListener('click', function () { finalizeDecision('bought', 'first'); });
    document.getElementById('binWait').addEventListener('click', sendToLocker);
    document.getElementById('binDiscard').addEventListener('click', function () { finalizeDecision('discarded', 'first'); });
  }

  function renderConfirm(decision) {
    var record = state.lastRecord;
    var reason = reasonOf(record.reason);
    var icon = decision === 'bought' ? '◎' : '−1';
    var s = stats();
    var message = decision === 'bought'
      ? '買った。これは自分で選んだ買い物。'
      : '1件、減った。' + yen(record.price) + ' 浮いた。合計 ' + yen(s.saved) + ' 節約中。';
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen confirm-screen';
    section.insertAdjacentHTML('beforeend',
      '<div class="confirm-icon ' + (decision === 'bought' ? 'icon-buy' : 'icon-discard') + '">' + escapeHtml(icon) + '</div>' +
      '<h2>' + (decision === 'bought' ? '購入、記録した。' : 'よく手放した。') + '</h2>' +
      '<p class="confirm-message">' + escapeHtml(message) + '</p>' +
      (reason ? '<div class="confirm-rule">' + escapeHtml(reason.rule) + '</div>' : '') +
      '<button class="primary" id="toHome" type="button">ホームへ</button>'
    );
    app.appendChild(section);
    document.getElementById('toHome').addEventListener('click', function () { go('home'); });
  }

  function renderConfirmWait() {
    var record = state.lastRecord;
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen confirm-screen';
    section.insertAdjacentHTML('beforeend',
      '<div class="confirm-icon">⏳</div>' +
      '<h2>寝かせ始めた。</h2>' +
      '<p class="confirm-message">' + escapeHtml(record.name) + '（' + escapeHtml(yen(record.price)) + '）は24時間後、また聞くね。それまで買わなくていい。</p>' +
      '<button class="primary" id="toHome" type="button">ホームへ</button>'
    );
    app.appendChild(section);
    document.getElementById('toHome').addEventListener('click', function () { go('home'); });
  }

  function renderConfirmExtend() {
    var record = state.lastRecord;
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen confirm-screen';
    section.insertAdjacentHTML('beforeend',
      '<div class="confirm-icon">⏳</div>' +
      '<h2>もう24時間。</h2>' +
      '<p class="confirm-message">' + escapeHtml(record.name) + 'を、あと24時間だけ寝かせる。次はここで決めよう。</p>' +
      '<button class="primary" id="toHome" type="button">ホームへ</button>'
    );
    app.appendChild(section);
    document.getElementById('toHome').addEventListener('click', function () { go('home'); });
  }

  function renderRecheckAsk() {
    var item = currentRecheckItem();
    if (!item) { go('home'); return; }
    var reason = reasonOf(item.reason);
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.appendChild(backRow(function () { go('home'); }));
    section.insertAdjacentHTML('beforeend',
      '<div class="step-label">見直し</div>' +
      '<div class="question-card">' +
      '<div class="item-recap">24時間前：' + escapeHtml(reason ? reason.label : '') + 'で欲しかった</div>' +
      '<h2>' + escapeHtml(item.name) + '（' + escapeHtml(yen(item.price)) + '）<br>今も、まだ欲しい？</h2>' +
      '<div class="choice-grid-2">' +
      '<button type="button" id="wantYes">はい</button>' +
      '<button type="button" id="wantNo">いいえ</button>' +
      '</div></div>'
    );
    app.appendChild(section);
    document.getElementById('wantYes').addEventListener('click', function () { go('recheckDecide'); });
    document.getElementById('wantNo').addEventListener('click', function () { recheckFinalize('discarded'); });
  }

  function renderRecheckDecide() {
    var item = currentRecheckItem();
    if (!item) { go('home'); return; }
    var choices = '<button type="button" id="rBuy">今すぐ買う</button><button type="button" id="rDiscard">やめておく</button>';
    if (!item.extended) choices += '<button type="button" id="rExtend">もう24時間だけ</button>';
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.appendChild(backRow(function () { go('recheckAsk'); }));
    section.insertAdjacentHTML('beforeend',
      '<div class="step-label">見直し</div>' +
      '<div class="question-card">' +
      '<div class="item-recap">' + escapeHtml(item.name) + '（' + escapeHtml(yen(item.price)) + '）</div>' +
      '<h2>どうする？</h2>' +
      '<div class="choice-list">' + choices + '</div>' +
      (item.extended ? '<p class="subtitle" style="font-size:13px;margin-top:14px">延長は1回まで。今日、決めよう。</p>' : '') +
      '</div>'
    );
    app.appendChild(section);
    document.getElementById('rBuy').addEventListener('click', function () { recheckFinalize('bought'); });
    document.getElementById('rDiscard').addEventListener('click', function () { recheckFinalize('discarded'); });
    var extendBtn = document.getElementById('rExtend');
    if (extendBtn) extendBtn.addEventListener('click', recheckExtend);
  }

  function renderHistory() {
    var history = loadHistory();
    var s = stats();
    app.innerHTML = '';
    var section = document.createElement('section');
    section.className = 'screen';
    section.appendChild(backRow(function () { go('home'); }));
    var html = '<div class="eyebrow">記録</div><h1 style="font-size:clamp(28px,7.5vw,40px)">これまでの判断</h1>';
    if (s.discardedCount >= 3 && s.topReasonId) {
      var topReason = reasonOf(s.topReasonId);
      html += '<div class="empty-note" style="border-style:solid;border-color:rgba(217,255,99,.35);background:var(--lime-soft);color:var(--text)">よく手放す理由：<strong>' + escapeHtml(topReason ? topReason.label : '') + '</strong>（' + s.topCount + '回）</div>';
    }
    html += '<div class="section" style="margin-top:18px">';
    if (!history.length) {
      html += '<div class="empty-note">まだ記録がない。</div>';
    } else {
      history.forEach(function (record) {
        var reason = reasonOf(record.reason);
        var d = new Date(record.decidedAt);
        var dateLabel = (d.getMonth() + 1) + '/' + d.getDate();
        html += '<div class="item-card">' +
          '<div class="row-top"><div class="item-name">' + escapeHtml(record.name) + '</div><div class="item-price">' + escapeHtml(yen(record.price)) + '</div></div>' +
          '<div class="item-meta">' + dateLabel + '・' + escapeHtml(reason ? reason.label : '') + (record.source === 'cooldown' ? '・24時間後に判断' : '') + '</div>' +
          '<span class="history-decision ' + (record.decision === 'bought' ? 'bought' : 'discarded') + '">' + (record.decision === 'bought' ? '買った' : 'やめた') + '</span>' +
          '</div>';
      });
    }
    html += '</div>';
    section.insertAdjacentHTML('beforeend', html);
    app.appendChild(section);
  }

  historyButton.addEventListener('click', function () { go('history'); });

  (function init() {
    var draft = loadDraft();
    if (draft && draft.name !== undefined) {
      state.draft = draft;
      state.screen = DRAFT_SCREENS.indexOf(draft.step) !== -1 ? draft.step : 'add';
      render();
      return;
    }
    go('home');
  })();

  setInterval(function () {
    if (state.screen === 'home') renderHome();
  }, 30000);
})();
