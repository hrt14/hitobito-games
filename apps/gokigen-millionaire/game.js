(() => {
  const STORAGE_KEY = 'levelup:gokigen-millionaire:v1';
  const GOAL = 1_000_000;
  const DIVIDEND_RATE = 0.1;
  const todayKey = () => new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });

  const $ = (id) => document.getElementById(id);
  const els = {
    balance: $('balance'), progressBar: $('progressBar'), goalPercent: $('goalPercent'), rankLabel: $('rankLabel'),
    todayCount: $('todayCount'), todayTotal: $('todayTotal'), funInput: $('funInput'), priceButton: $('priceButton'),
    pricePanel: $('pricePanel'), pricingEvent: $('pricingEvent'), cancelPricing: $('cancelPricing'), ledger: $('ledger'),
    dailyResult: $('dailyResult'), resultTotal: $('resultTotal'), resultBest: $('resultBest'), shareButton: $('shareButton'),
    addMoreButton: $('addMoreButton'), shareStatus: $('shareStatus'), vault: $('vault'), coinLayer: $('coinLayer'),
    soundButton: $('soundButton'), memoryDividend: $('memoryDividend'), memoryText: $('memoryText'),
    dividendYes: $('dividendYes'), dividendSkip: $('dividendSkip')
  };

  const defaultState = { balance: 0, entries: [], sound: true, lastDividendDate: null, lastResultDate: null };
  let state = loadState();
  let pendingEvent = '';
  let memoryCandidate = null;
  let audioCtx = null;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return { ...defaultState };
      return { ...defaultState, ...parsed, entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function formatG(value) {
    return Number(value || 0).toLocaleString('ja-JP');
  }

  function getRank(balance) {
    if (balance >= GOAL) return 'ミリオネア';
    if (balance >= 100_000) return 'ご機嫌資産家';
    if (balance >= 10_000) return 'ご機嫌富豪';
    if (balance >= 1_000) return '小金持ち';
    return '種銭づくり';
  }

  function entriesToday() {
    const key = todayKey();
    return state.entries.filter((entry) => entry.date === key && entry.kind !== 'dividend');
  }

  function todayTotal() {
    return state.entries.filter((entry) => entry.date === todayKey()).reduce((sum, entry) => sum + entry.value, 0);
  }

  function render() {
    const today = entriesToday();
    const percent = Math.min(100, (state.balance / GOAL) * 100);
    els.balance.textContent = formatG(state.balance);
    els.progressBar.style.width = `${percent}%`;
    els.goalPercent.textContent = `${percent.toFixed(percent < 1 ? 2 : 1)}%`;
    els.rankLabel.textContent = getRank(state.balance);
    els.todayCount.textContent = String(today.length);
    els.todayTotal.textContent = `+${formatG(todayTotal())}G`;
    els.soundButton.textContent = state.sound ? '♪' : '×';
    els.soundButton.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    renderLedger();
    renderDailyResult(today);
    maybeShowDividend();
  }

  function renderLedger() {
    const allToday = state.entries.filter((entry) => entry.date === todayKey()).slice().reverse();
    if (!allToday.length) {
      els.ledger.className = 'ledger empty-ledger';
      els.ledger.innerHTML = '<p>まだ0件。<br>最初の10Gを作ろう。</p>';
      return;
    }
    els.ledger.className = 'ledger';
    els.ledger.innerHTML = allToday.slice(0, 8).map((entry) => `
      <article class="ledger-item">
        <div class="ledger-coin">G</div>
        <div><p>${escapeHtml(entry.text)}</p><small>${entry.kind === 'dividend' ? '思い出し配当' : entry.label}</small></div>
        <strong>+${formatG(entry.value)}G</strong>
      </article>`).join('');
  }

  function renderDailyResult(today) {
    if (today.length < 3 || state.lastResultDate === todayKey()) {
      els.dailyResult.classList.add('is-hidden');
      return;
    }
    const best = today.reduce((a, b) => b.value > a.value ? b : a, today[0]);
    els.resultTotal.textContent = `${formatG(todayTotal())}G`;
    els.resultBest.textContent = best ? `今日いちばん高かったのは「${best.text}」の ${formatG(best.value)}G。` : '';
    els.dailyResult.classList.remove('is-hidden');
  }

  function maybeShowDividend() {
    if (state.lastDividendDate === todayKey()) {
      els.memoryDividend.classList.add('is-hidden');
      return;
    }
    const past = state.entries.filter((entry) => entry.kind !== 'dividend' && entry.date !== todayKey());
    if (!past.length) {
      els.memoryDividend.classList.add('is-hidden');
      return;
    }
    const seed = dayNumber() % past.length;
    memoryCandidate = past[seed];
    els.memoryText.textContent = `「${memoryCandidate.text}」`;
    els.memoryDividend.classList.remove('is-hidden');
  }

  function dayNumber() {
    const now = new Date();
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  }

  function startPricing() {
    const text = els.funInput.value.trim();
    if (!text) {
      els.funInput.focus();
      els.funInput.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 180 });
      return;
    }
    pendingEvent = text;
    els.pricingEvent.textContent = `「${text}」`;
    els.pricePanel.classList.remove('is-hidden');
    requestAnimationFrame(() => els.pricePanel.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    beep(330, .04);
  }

  function priceLabel(value) {
    if (value >= 10000) return '今日の大当たり';
    if (value >= 1000) return 'かなり良い';
    if (value >= 100) return 'けっこう良い';
    return 'ちょい良い';
  }

  function mint(value) {
    if (!pendingEvent) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: pendingEvent,
      value,
      label: priceLabel(value),
      date: todayKey(),
      createdAt: Date.now(),
      kind: 'fun'
    };
    state.entries.push(entry);
    state.balance += value;
    saveState();
    els.funInput.value = '';
    pendingEvent = '';
    els.pricePanel.classList.add('is-hidden');
    coinAnimation(value);
    haptic([20, 35, 25]);
    beep(520, .05); setTimeout(() => beep(780, .08), 65);
    render();
    flashBalance();
  }

  function coinAnimation(value) {
    const coin = document.createElement('span');
    coin.className = 'coin';
    coin.textContent = value >= 10000 ? '10K' : value >= 1000 ? '1K' : String(value);
    els.coinLayer.appendChild(coin);
    els.vault.classList.add('is-paying');
    setTimeout(() => coin.remove(), 900);
    setTimeout(() => els.vault.classList.remove('is-paying'), 650);
  }

  function flashBalance() {
    const card = els.balance.closest('.wealth-card');
    card.classList.remove('milestone-pop');
    void card.offsetWidth;
    card.classList.add('milestone-pop');
  }

  function addDividend() {
    if (!memoryCandidate || state.lastDividendDate === todayKey()) return;
    const value = Math.max(1, Math.round(memoryCandidate.value * DIVIDEND_RATE));
    state.entries.push({
      id: `${Date.now()}-dividend`,
      text: memoryCandidate.text,
      value,
      label: '思い出し配当',
      date: todayKey(),
      createdAt: Date.now(),
      kind: 'dividend'
    });
    state.balance += value;
    state.lastDividendDate = todayKey();
    saveState();
    els.memoryDividend.classList.add('is-hidden');
    coinAnimation(value);
    haptic([18, 25, 18]);
    beep(650, .06);
    render();
  }

  function skipDividend() {
    state.lastDividendDate = todayKey();
    saveState();
    els.memoryDividend.classList.add('is-hidden');
  }

  async function shareResult() {
    const today = entriesToday();
    const total = todayTotal();
    const best = today.length ? today.reduce((a, b) => b.value > a.value ? b : a, today[0]) : null;
    const text = `今日のご機嫌資産 +${formatG(total)}G\n${today.length}個の楽しいことを換金。${best ? `\n最高値：「${best.text}」 +${formatG(best.value)}G` : ''}\n\nLEVEL UP ご機嫌ミリオネア`;
    try {
      if (navigator.share) {
        await navigator.share({ title: '今日のご機嫌資産', text });
        els.shareStatus.textContent = 'シェアしました。';
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        els.shareStatus.textContent = '結果をコピーしました。';
      } else {
        els.shareStatus.textContent = 'この端末では共有機能を使えません。';
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') els.shareStatus.textContent = '共有できませんでした。';
    }
  }

  function closeDailyResult() {
    state.lastResultDate = todayKey();
    saveState();
    els.dailyResult.classList.add('is-hidden');
    els.funInput.focus();
    els.funInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char]));
  }

  function haptic(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function beep(freq, duration) {
    if (!state.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      const cue = button.dataset.prompt;
      const existing = els.funInput.value.trim();
      els.funInput.value = existing || cue;
      els.funInput.focus();
      els.funInput.setSelectionRange(els.funInput.value.length, els.funInput.value.length);
      haptic(10);
    });
  });

  document.querySelectorAll('[data-value]').forEach((button) => {
    button.addEventListener('click', () => mint(Number(button.dataset.value)));
  });

  els.priceButton.addEventListener('click', startPricing);
  els.funInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') startPricing(); });
  els.cancelPricing.addEventListener('click', () => { pendingEvent = ''; els.pricePanel.classList.add('is-hidden'); els.funInput.focus(); });
  els.soundButton.addEventListener('click', () => { state.sound = !state.sound; saveState(); render(); if (state.sound) beep(520, .05); });
  els.dividendYes.addEventListener('click', addDividend);
  els.dividendSkip.addEventListener('click', skipDividend);
  els.shareButton.addEventListener('click', shareResult);
  els.addMoreButton.addEventListener('click', closeDailyResult);

  render();
})();
