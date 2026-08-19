(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    grid: $('lifeGrid'), percent: $('percentValue'), caption: $('worldCaption'),
    intro: $('introPanel'), already: $('alreadyPanel'), burden: $('burdenPanel'), one: $('onePanel'), result: $('resultPanel'), finish: $('finishPanel'),
    start: $('startBtn'), giftGrid: $('giftGrid'), giftCount: $('giftCount'), giftNext: $('giftNextBtn'),
    burdenGrid: $('burdenGrid'), burdenNext: $('burdenNextBtn'), burdenEcho: $('burdenEcho'), moveList: $('moveList'),
    swipeZone: $('swipeZone'), darkCard: $('darkCard'), darkLabel: $('darkLabel'), moveLabel: $('moveLabel'), swipeHint: $('swipeHint'), swipeFallback: $('swipeFallbackBtn'),
    resultPercent: $('resultPercent'), keptList: $('keptList'), resultCopy: $('resultCopy'), another: $('anotherBtn'), finishBtn: $('finishBtn'),
    finishPercent: $('finishPercent'), again: $('againBtn'), reset: $('resetBtn'), flash: $('flash'), historyBox: $('historyBox'), historySessions: $('historySessions')
  };

  const gifts = [
    '今日まで生きてきた経験','休める瞬間','好きだと思えるもの','自分で選べること',
    '助けを求める手段','学べるもの','使える時間','触れられる世界',
    '戻れる場所','話せる相手','できること','今日という残り時間'
  ];

  const burdens = [
    ['不安','先のことが気になる'],['疲れ','もう余力が少ない'],['未完了','終わっていないこと'],
    ['人間関係','誰かとの引っかかり'],['怒り','納得できないこと'],['自己否定','自分へのダメ出し'],['その他','名前をつけにくいもの']
  ];

  const movesByBurden = {
    '不安': [['DEFER','今決めなくていいことを1つ後ろへ'],['CHECK','事実だけを1つ確かめる'],['SHRINK','次の5分だけに縮める']],
    '疲れ': [['DROP','今日やらないことを1つ決める'],['REST','5分だけ回復を先にする'],['ASK','1つだけ誰かに頼る']],
    '未完了': [['ONE','一番小さい1個だけ終わらせる'],['SPLIT','大きな仕事を半分にする'],['DEFER','今日じゃないものを外す']],
    '人間関係': [['SPACE','今すぐ反応せず距離を置く'],['FACT','事実と想像を分ける'],['ASK','短い1文だけ伝える']],
    '怒り': [['PAUSE','返事を少し遅らせる'],['SPACE','その場から一度離れる'],['FACT','事実だけ1つに戻す']],
    '自己否定': [['FACT','できている事実を1つ残す'],['SMALL','基準を1段だけ下げる'],['STOP','今日の採点をここで止める']],
    'その他': [['DEFER','今は考えないと決める'],['SMALL','1%だけ小さくする'],['ASK','一人で持たない方法を1つ選ぶ']]
  };

  const storeKey = 'levelup_already90_v1';
  let saved = loadSaved();
  let state = freshState();
  let drag = null;

  function freshState() {
    return { percent: 90, gifts: [], burden: '', move: null, rounds: 0 };
  }

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; } catch { return {}; }
  }

  function saveSession() {
    saved.sessions = Number(saved.sessions || 0) + 1;
    saved.lastGifts = [...state.gifts];
    saved.lastPercent = state.percent;
    saved.lastPlayedAt = Date.now();
    try { localStorage.setItem(storeKey, JSON.stringify(saved)); } catch {}
  }

  function show(panel) {
    [els.intro, els.already, els.burden, els.one, els.result, els.finish].forEach((p) => p.classList.toggle('active', p === panel));
    requestAnimationFrame(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  function renderGrid(newIndex = -1) {
    els.grid.innerHTML = '';
    for (let i = 0; i < 100; i++) {
      const cell = document.createElement('i');
      cell.className = 'life-cell' + (i < state.percent ? ' on' : '') + (i === newIndex ? ' new' : '');
      els.grid.appendChild(cell);
    }
    els.percent.textContent = state.percent;
    els.grid.setAttribute('aria-label', `${state.percent}個の明るいマスと${100 - state.percent}個の暗いマス`);
  }

  function renderGifts() {
    els.giftGrid.innerHTML = gifts.map((g) => `<button class="gift" type="button" data-gift="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join('');
    if (saved.lastGifts?.length) {
      for (const btn of els.giftGrid.querySelectorAll('.gift')) {
        if (saved.lastGifts.includes(btn.dataset.gift)) btn.title = '前回も選んだもの';
      }
    }
  }

  function renderBurdens() {
    els.burdenGrid.innerHTML = burdens.map(([name, note]) => `<button class="burden" type="button" data-burden="${escapeHtml(name)}"><i></i><span><strong>${escapeHtml(name)}</strong><br><small>${escapeHtml(note)}</small></span></button>`).join('');
  }

  function renderMoves() {
    const moves = movesByBurden[state.burden] || movesByBurden['その他'];
    els.moveList.innerHTML = moves.map(([tag, label], i) => `<button class="move" type="button" data-index="${i}"><span>${tag}</span><strong>${escapeHtml(label)}</strong></button>`).join('');
    els.swipeZone.hidden = true;
    state.move = null;
  }

  function escapeHtml(value) {
    return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function pulse() {
    if (navigator.vibrate) navigator.vibrate(18);
  }

  function flash() {
    els.flash.classList.remove('go');
    void els.flash.offsetWidth;
    els.flash.classList.add('go');
  }

  function updateGiftUI() {
    els.giftCount.textContent = state.gifts.length;
    els.giftNext.disabled = state.gifts.length !== 3;
  }

  function selectBurden(name, btn) {
    state.burden = name;
    els.burdenGrid.querySelectorAll('.burden').forEach((b) => b.classList.toggle('selected', b === btn));
    els.burdenNext.disabled = false;
    pulse();
  }

  function chooseMove(index, btn) {
    const moves = movesByBurden[state.burden] || movesByBurden['その他'];
    state.move = moves[index];
    els.moveList.querySelectorAll('.move').forEach((m) => m.classList.toggle('selected', m === btn));
    els.moveLabel.textContent = state.move[1];
    els.darkLabel.textContent = `${state.burden}の1%`;
    els.swipeZone.hidden = false;
    requestAnimationFrame(() => els.swipeZone.scrollIntoView({ behavior:'smooth', block:'nearest' }));
    pulse();
  }

  function completeOnePercent() {
    if (!state.move || state.percent >= 100) return;
    const newIndex = state.percent;
    state.percent += 1;
    state.rounds += 1;
    renderGrid(newIndex);
    els.caption.innerHTML = `暗い方を触っている間も、<br>${state.percent}%の明るさは残っている。`;
    flash(); pulse();
    els.resultPercent.textContent = state.percent;
    els.keptList.innerHTML = state.gifts.map((g) => `<span>${escapeHtml(g)}</span>`).join('');
    const remaining = 100 - state.percent;
    els.resultCopy.innerHTML = remaining > 0
      ? `残り${remaining}%が気になってもいい。<br>いま、1%だけ小さくした。`
      : '暗いマスは0になった。<br>でも、100にすること自体が目的ではない。';
    els.another.hidden = state.rounds >= 3 || state.percent >= 100;
    els.historySessions.textContent = Number(saved.sessions || 0);
    els.historyBox.hidden = !(saved.sessions > 0);
    show(els.result);
    resetDarkCard();
  }

  function resetDarkCard() {
    els.darkCard.style.transform = '';
    els.darkCard.style.opacity = '';
    els.swipeHint.textContent = '↑ 上へスワイプ';
  }

  function startAnother() {
    state.move = null;
    $('oneStepLabel').textContent = `${String(3 + state.rounds).padStart(2,'0')} / ONE MORE PERCENT`;
    els.burdenEcho.textContent = `${state.burden}を全部なくさなくていい。次の1%だけ。`;
    renderMoves();
    show(els.one);
  }

  function finishSession() {
    saveSession();
    els.finishPercent.textContent = `${state.percent}%`;
    show(els.finish);
  }

  function resetAll() {
    state = freshState();
    renderGrid();
    els.caption.innerHTML = '暗い10%を見る前に、<br>明るい90%を視界から消さない。';
    els.giftGrid.querySelectorAll('.gift').forEach((b) => b.classList.remove('selected'));
    els.burdenGrid.querySelectorAll('.burden').forEach((b) => b.classList.remove('selected'));
    state.gifts = [];
    updateGiftUI();
    els.burdenNext.disabled = true;
    $('oneStepLabel').textContent = '03 / ONE PERCENT';
    show(els.intro);
  }

  els.start.addEventListener('click', () => { show(els.already); pulse(); });

  els.giftGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.gift');
    if (!btn) return;
    const gift = btn.dataset.gift;
    if (state.gifts.includes(gift)) {
      state.gifts = state.gifts.filter((g) => g !== gift);
      btn.classList.remove('selected');
    } else if (state.gifts.length < 3) {
      state.gifts.push(gift);
      btn.classList.add('selected');
      pulse();
    }
    updateGiftUI();
  });

  els.giftNext.addEventListener('click', () => { show(els.burden); pulse(); });
  els.burdenGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.burden');
    if (btn) selectBurden(btn.dataset.burden, btn);
  });
  els.burdenNext.addEventListener('click', () => {
    els.burdenEcho.textContent = `${state.burden}を10%全部なくさなくていい。ほんの1%だけ。`;
    renderMoves();
    show(els.one); pulse();
  });
  els.moveList.addEventListener('click', (e) => {
    const btn = e.target.closest('.move');
    if (btn) chooseMove(Number(btn.dataset.index), btn);
  });

  els.darkCard.addEventListener('pointerdown', (e) => {
    drag = { id:e.pointerId, y:e.clientY, startY:e.clientY };
    els.darkCard.setPointerCapture?.(e.pointerId);
  });
  els.darkCard.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    drag.y = e.clientY;
    const dy = Math.min(0, e.clientY - drag.startY);
    els.darkCard.style.transform = `translateY(${dy}px) rotate(${dy / 22}deg) scale(${1 + Math.min(0.08, -dy / 1000)})`;
    els.darkCard.style.opacity = String(Math.max(.35, 1 + dy / 230));
  });
  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const dy = drag.y - drag.startY;
    drag = null;
    if (dy < -70) {
      els.darkCard.style.transform = 'translateY(-180px) rotate(-7deg) scale(.9)';
      els.darkCard.style.opacity = '0';
      setTimeout(completeOnePercent, 180);
    } else resetDarkCard();
  }
  els.darkCard.addEventListener('pointerup', endDrag);
  els.darkCard.addEventListener('pointercancel', () => { drag = null; resetDarkCard(); });
  els.darkCard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); completeOnePercent(); } });
  els.swipeFallback.addEventListener('click', completeOnePercent);

  els.another.addEventListener('click', startAnother);
  els.finishBtn.addEventListener('click', finishSession);
  els.again.addEventListener('click', resetAll);
  els.reset.addEventListener('click', resetAll);

  renderGrid();
  renderGifts();
  renderBurdens();
  updateGiftUI();
})();
