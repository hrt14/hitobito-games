(() => {
  'use strict';

  const STORAGE_KEY = 'levelup-life-plus-one-v1';
  const ENDPOINT = 'https://asia-northeast1-hitobito-levelup.cloudfunctions.net/analyzeLifePlusOne';
  const CATEGORY_LABELS = {
    experience: 'EXPERIENCE', knowledge: 'KNOWLEDGE', skill: 'SKILL', courage: 'COURAGE',
    recovery: 'RECOVERY', self_knowledge: 'SELF KNOWLEDGE', relationship: 'RELATIONSHIP', memory: 'MEMORY',
    boundary: 'BOUNDARY', rest: 'REST', failure_data: 'FAILURE DATA', progress: 'PROGRESS', other: 'LIFE DELTA'
  };
  const CATEGORY_JA = {
    experience: '経験', knowledge: '知識', skill: '技能', courage: '勇気', recovery: '回復',
    self_knowledge: '自己理解', relationship: '関係', memory: '思い出', boundary: '境界線', rest: '休息',
    failure_data: '検証結果', progress: '前進', other: '人生の差分'
  };

  const els = Object.fromEntries([
    'inputScreen','analysisScreen','resultScreen','savedScreen','todayInput','findButton','lifeTotal','modeCopy',
    'scanWords','resultSource','resultCategory','resultTitle','resultAdded','resultReason','resultLife','foundResult',
    'noPlusResult','noPlusMessage','hiddenPlusSection','hiddenPlusList','addButton','differentButton','retryButton',
    'savedTotal','savedLine','anotherButton','historyButton','openHistoryButton','historyPanel','historyBackdrop','historyClose',
    'historySummary','historyList','todaySection','todayCount','todayList','clearButton','toast'
  ].map(id => [id, document.getElementById(id)]));

  let state = loadState();
  let currentResult = null;
  let scanTimer = null;
  let toastTimer = null;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { records: Array.isArray(parsed.records) ? parsed.records : [] };
    } catch {
      return { records: [] };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function esc(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function dateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ja-JP', { timeZone:'Asia/Tokyo', month:'numeric', day:'numeric' }).format(date);
  }

  function showScreen(id) {
    for (const screen of document.querySelectorAll('.screen')) screen.classList.toggle('active', screen.id === id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getSignedInUser() {
    return window.firebase?.auth ? window.firebase.auth().currentUser : null;
  }

  async function analyzeWithAI(text) {
    const user = getSignedInUser();
    if (!user) throw new Error('not-signed-in');
    const token = await user.getIdToken();
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const error = new Error(`ai-${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    if (!data || typeof data.found !== 'boolean') throw new Error('bad-ai-response');
    return { ...data, source: 'ai' };
  }

  function includesAny(text, words) { return words.some(word => text.includes(word)); }

  function localAnalyze(raw) {
    const text = raw.trim();
    const compact = text.toLowerCase();
    if (!text || /^(何もしてない|何もしていない|なにもしてない|特になし|とくになし|何もなかった)[。！!\s]*$/.test(text)) {
      return { found:false, message:'今日はまだ、はっきりした+1を決めなくてもよさそう。何か思い出したら、そのときで大丈夫です。', hiddenPlus:[], source:'local' };
    }

    let category = 'progress';
    if (includesAny(compact, ['初めて','はじめて','初参加','行った','行ってきた','訪れ','体験'])) category = 'experience';
    if (includesAny(compact, ['知った','わかった','分かった','学んだ','勉強','調べて'])) category = 'knowledge';
    if (includesAny(compact, ['できるよう','使えるよう','作れた','実装','覚えた'])) category = 'skill';
    if (includesAny(compact, ['怖かった','気が重','勇気','思い切って','緊張','嫌だったけど','やりたくなかったけど'])) category = 'courage';
    if (includesAny(compact, ['散歩','歩いた','戻った','復活','回復','落ち着','元気にな','楽にな'])) category = 'recovery';
    if (includesAny(compact, ['自分は','自分が','気づいた','気付いた','苦手','疲れると','わかった、自分'])) category = 'self_knowledge';
    if (includesAny(compact, ['家族','子ども','子供','友達','友人','妻','夫','話した','一緒に'])) category = 'relationship';
    if (includesAny(compact, ['楽しかった','旅行','思い出','おいしかった','美味しかった'])) category = 'memory';
    if (includesAny(compact, ['断った','やめた','やらない','手放した','任せた','今日はここまで'])) category = 'boundary';
    if (includesAny(compact, ['休んだ','寝た','眠った','昼寝','早めに寝','何もしないで休'])) category = 'rest';
    if (includesAny(compact, ['失敗','うまくいかな','ダメだった','駄目だった','売れなかった','間違えた','ミス'])) category = 'failure_data';

    const templates = {
      experience: ['新しい経験が1つ増えた','今日までになかった経験', '実際に経験したことは、次に似た場面へ入るときの土台として残る。'],
      knowledge: ['知らなかったことを1つ知った','今日わかったこと', '昨日まで知らなかった情報や見方が、次に考えるときの材料として残る。'],
      skill: ['できることが1つ増えた','今日実際に扱えたこと', '一度でも自分で扱った経験は、次回の「初めて」を減らしてくれる。'],
      courage: ['気が重くても1つ動いた','嫌さがある中で実行した行動', '気分が整うのを待たずに小さく動けた事実が、次の選択肢として残る。'],
      recovery: ['自分を戻す方法を1つ試した','今日、自分を少し戻した行動', '次に似た疲れ方をしたとき、試せる回復の選択肢が1つ増えた。'],
      self_knowledge: ['自分の取扱説明書が1行増えた','今日気づいた自分の傾向', '自分がどう反応するかを知った分、次回は少し早く対処しやすくなる。'],
      relationship: ['誰かとの時間が1つ増えた','今日その人と共有した時間', '成果とは別に、その人と過ごした今日の時間そのものが人生に残る。'],
      memory: ['今日の思い出が1つ増えた','今日しかなかった出来事', 'あとから振り返れる「今日の場面」が人生に1つ追加された。'],
      boundary: ['やらない判断を1つ実行した','今日、守るためにやめた・断ったこと', '全部を引き受けない選択を実行した記録が、次の境界線の土台になる。'],
      rest: ['休むという選択を1つした','今日、止まるために使った時間', '休息が必要だったかは後から分かることもある。少なくとも、今日は止まる選択をした。'],
      failure_data: ['うまくいかなかった条件が1つ分かった','今日うまくいかなかったという実データ', '失敗を良かったことにする必要はない。ただ、同じ条件を次に見直すためのデータは残った。'],
      progress: ['昨日までより1つ進んだ','今日、実際に動いた部分', '完成していなくても、ゼロだった場所に今日の行動分だけ差分ができた。'],
    };
    const [title, addedBase, lifeMeaning] = templates[category];
    const reason = category === 'failure_data'
      ? `「${clip(text, 62)}」という結果が実際に起きたため。成功扱いはせず、検証データとして拾いました。`
      : `「${clip(text, 68)}」という今日の事実から、確実に言える範囲だけを拾いました。`;
    const primary = { category, title, added: addedBase, reason, lifeMeaning };
    const hiddenPlus = [];
    if (category !== 'self_knowledge' && includesAny(compact, ['気づ','分かった','わかった'])) hiddenPlus.push({ category:'self_knowledge', title:'自分についての情報が1つ増えた' });
    if (category !== 'courage' && includesAny(compact, ['気が重','嫌だったけど','やりたくなかった'])) hiddenPlus.push({ category:'courage', title:'嫌さがあっても動いた経験が増えた' });
    return { found:true, primary, hiddenPlus:hiddenPlus.slice(0,2), source:'local' };
  }

  function clip(text, max) { return text.length > max ? text.slice(0, max - 1) + '…' : text; }

  async function findPlus() {
    const text = els.todayInput.value.trim();
    if (!text) return;
    els.findButton.disabled = true;
    showScreen('analysisScreen');
    startScan();
    const started = Date.now();
    let result;
    try {
      result = await analyzeWithAI(text);
    } catch (error) {
      console.info('[LIFE +1] AI unavailable; using local analysis.', error?.message || error);
      result = localAnalyze(text);
    }
    const wait = Math.max(0, 1200 - (Date.now() - started));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    stopScan();
    currentResult = { ...result, rawInput:text, createdAt:new Date().toISOString() };
    renderResult(currentResult);
    showScreen('resultScreen');
    els.findButton.disabled = !els.todayInput.value.trim();
  }

  function startScan() {
    const words = ['経験','知識','回復','判断','人との時間','自己理解','前進','休息','検証結果'];
    let i = 0;
    const render = () => { els.scanWords.innerHTML = `<span class="active">${words[i % words.length]}</span>`; i += 1; };
    render(); scanTimer = setInterval(render, 330);
  }
  function stopScan() { if (scanTimer) clearInterval(scanTimer); scanTimer = null; }

  function renderResult(result) {
    els.resultSource.textContent = result.source === 'ai' ? "AI FOUND TODAY'S +1" : "TODAY'S +1 · QUICK MODE";
    const found = result.found && result.primary;
    els.foundResult.hidden = !found;
    els.noPlusResult.hidden = !!found;
    els.addButton.hidden = !found;
    els.differentButton.hidden = !found;
    els.retryButton.hidden = !!found;
    if (!found) {
      els.resultCategory.textContent = 'NO NEED TO FORCE IT';
      els.resultTitle.textContent = '今日は、決めなくていい。';
      els.noPlusMessage.textContent = result.message || '今日はまだ、はっきりした+1を決めなくてもよさそう。';
      els.hiddenPlusSection.hidden = true;
      return;
    }
    const p = result.primary;
    els.resultCategory.textContent = CATEGORY_LABELS[p.category] || CATEGORY_LABELS.other;
    els.resultTitle.textContent = p.title;
    els.resultAdded.textContent = p.added;
    els.resultReason.textContent = p.reason;
    els.resultLife.textContent = p.lifeMeaning;
    const hidden = Array.isArray(result.hiddenPlus) ? result.hiddenPlus.slice(0,2) : [];
    els.hiddenPlusSection.hidden = hidden.length === 0;
    els.hiddenPlusList.innerHTML = hidden.map(item => `<div class="hidden-plus-item"><b>${esc(CATEGORY_LABELS[item.category] || 'LIFE DELTA')}</b><span>${esc(item.title)}</span></div>`).join('');
  }

  function addCurrent() {
    if (!currentResult?.found || !currentResult.primary) return;
    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
      dateKey: dateKey(), rawInput: currentResult.rawInput,
      primary: currentResult.primary, hiddenPlus: currentResult.hiddenPlus || [], source:currentResult.source,
      createdAt: currentResult.createdAt || new Date().toISOString(),
    };
    state.records.unshift(record);
    saveState();
    renderAll();
    els.savedTotal.textContent = `+${state.records.length}`;
    els.savedLine.textContent = `${CATEGORY_JA[record.primary.category] || '人生の差分'}が、今日の人生に1つ追加されました。`;
    showScreen('savedScreen');
    burstHaptic();
  }

  function burstHaptic() { try { navigator.vibrate?.(18); } catch {} }

  function renderAll() {
    els.lifeTotal.textContent = String(state.records.length);
    renderToday(); renderHistory();
  }

  function renderToday() {
    const today = dateKey();
    const records = state.records.filter(item => item.dateKey === today);
    els.todaySection.hidden = records.length === 0;
    els.todayCount.textContent = `+${records.length}`;
    els.todayList.innerHTML = records.slice(0,4).map(item => `<div class="mini-item"><b>${esc(CATEGORY_LABELS[item.primary.category] || 'LIFE DELTA')}</b><span>${esc(item.primary.title)}</span></div>`).join('');
  }

  function renderHistory() {
    const counts = {};
    for (const item of state.records) counts[item.primary.category] = (counts[item.primary.category] || 0) + 1;
    els.historySummary.innerHTML = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([key,count]) => `<span class="summary-chip">${esc(CATEGORY_JA[key] || '差分')}<b>${count}</b></span>`).join('');
    els.historyList.innerHTML = state.records.length ? state.records.map(item => `<article class="history-item"><div class="history-item-head"><b>${esc(CATEGORY_LABELS[item.primary.category] || 'LIFE DELTA')} +1</b><time>${esc(formatDate(item.createdAt))}</time></div><h3>${esc(item.primary.title)}</h3><p>${esc(item.rawInput)}</p></article>`).join('') : '<div class="empty-history">まだ記録はありません。<br>今日の出来事から、最初の+1を見つけてみてください。</div>';
  }

  function resetEntry() {
    currentResult = null;
    els.todayInput.value = '';
    els.findButton.disabled = true;
    showScreen('inputScreen');
    setTimeout(() => els.todayInput.focus(), 120);
  }

  function reviseEntry() {
    showScreen('inputScreen');
    els.findButton.disabled = !els.todayInput.value.trim();
    setTimeout(() => {
      els.todayInput.focus();
      els.todayInput.setSelectionRange(els.todayInput.value.length, els.todayInput.value.length);
    }, 120);
    showToast('少し書き足して、もう一度探せます');
  }

  function showToast(message) {
    clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  function openHistory() {
    renderHistory(); els.historyPanel.classList.add('open'); els.historyPanel.setAttribute('aria-hidden','false'); els.historyButton.setAttribute('aria-expanded','true');
  }
  function closeHistory() {
    els.historyPanel.classList.remove('open'); els.historyPanel.setAttribute('aria-hidden','true'); els.historyButton.setAttribute('aria-expanded','false');
  }

  function updateModeCopy() {
    const user = getSignedInUser();
    els.modeCopy.textContent = user ? 'AI分析を利用できます。入力文は分析時だけAPIへ送信されます。' : 'Googleログイン中はAIが分析。未ログインでも簡易判定で使えます。';
  }

  els.todayInput.addEventListener('input', () => { els.findButton.disabled = !els.todayInput.value.trim(); });
  els.findButton.addEventListener('click', findPlus);
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { els.todayInput.value = button.dataset.example || ''; els.findButton.disabled = false; els.todayInput.focus(); }));
  els.addButton.addEventListener('click', addCurrent);
  els.differentButton.addEventListener('click', reviseEntry);
  els.retryButton.addEventListener('click', resetEntry);
  els.anotherButton.addEventListener('click', resetEntry);
  els.historyButton.addEventListener('click', openHistory);
  els.openHistoryButton.addEventListener('click', openHistory);
  els.historyClose.addEventListener('click', closeHistory);
  els.historyBackdrop.addEventListener('click', closeHistory);
  els.clearButton.addEventListener('click', () => {
    if (!confirm('この端末に保存したLIFE +1の記録をすべて削除しますか？')) return;
    state = { records:[] }; saveState(); renderAll(); closeHistory(); showToast('この端末の記録を削除しました');
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeHistory(); });
  window.addEventListener('load', () => {
    updateModeCopy();
    if (window.firebase?.auth) window.firebase.auth().onAuthStateChanged(updateModeCopy);
  });

  renderAll();
})();
