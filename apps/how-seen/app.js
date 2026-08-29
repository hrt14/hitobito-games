(() => {
  const app = document.getElementById('app');
  const resetBtn = document.getElementById('resetBtn');
  const API = 'https://asia-northeast1-hitobito-levelup.cloudfunctions.net/howSeenApi';
  const AXES = [
    { key:'calm', label:'冷静さ', short:'冷静' },
    { key:'warm', label:'親しみやすさ', short:'親しみ' },
    { key:'drive', label:'自己主張', short:'主張' },
    { key:'reliable', label:'信頼感', short:'信頼' },
    { key:'considerate', label:'気づかい', short:'配慮' },
  ];
  const QUESTIONS = [
    { axis:'calm', self:'予定外のトラブルが起きても、わりと冷静でいられる', peer:'予定外のトラブルが起きても、この人はわりと冷静でいる' },
    { axis:'warm', self:'初対面でも、話しかけやすい空気を出している', peer:'初対面でも、この人は話しかけやすい空気がある' },
    { axis:'drive', self:'意見が割れたとき、自分の考えをはっきり言える', peer:'意見が割れたとき、この人は自分の考えをはっきり言う' },
    { axis:'reliable', self:'頼まれたことは、期限や約束をかなり守る方だ', peer:'この人は、頼まれたことの期限や約束をかなり守る' },
    { axis:'considerate', self:'相手の表情や言い方の変化によく気づく', peer:'この人は、相手の表情や言い方の変化によく気づく' },
    { axis:'calm', self:'ミスした直後でも、引きずりすぎず次の対応に移れる', peer:'ミスした直後でも、この人は引きずりすぎず次の対応に移る' },
    { axis:'warm', self:'人から相談や雑談を持ちかけられやすい', peer:'この人には、相談や雑談を持ちかけやすい' },
    { axis:'drive', self:'必要なら、相手にNOと言ったり断ったりできる', peer:'この人は、必要ならNOと言ったり断ったりする' },
    { axis:'reliable', self:'周りから「任せて大丈夫」と思われる方だ', peer:'この人には「任せて大丈夫」と感じる' },
    { axis:'considerate', self:'自分が話すより、相手が話しやすいように調整することがある', peer:'この人は、相手が話しやすいように会話を調整している' },
  ];
  const SCALE = [
    { label:'かなり違う', score:15 },
    { label:'やや違う', score:38 },
    { label:'ややそう', score:62 },
    { label:'かなりそう', score:85 },
  ];

  let state = { mode:'home', index:0, answers:[], sid:'', ownerToken:'', selfScores:null, friendScores:null, friendCount:-1 };
  let pollTimer = null;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function clamp(n, min=0, max=100) { return Math.max(min, Math.min(max, n)); }
  function baseUrl() { return `${location.origin}${location.pathname}`; }
  function friendUrl(sid) { return `${baseUrl()}?friend=${encodeURIComponent(sid)}`; }
  function ownerUrl(sid, token) { return `${baseUrl()}?owner=${encodeURIComponent(sid)}#key=${encodeURIComponent(token)}`; }
  function clearPoll() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }
  function randomId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID().replace(/-/g,'');
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }
  function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch {} }
  function safeRemove(key) { try { localStorage.removeItem(key); } catch {} }
  function ownerStorageKey(sid) { return `how-seen-owner:${sid}`; }
  function responseStorageKey(sid) { return `how-seen-response:${sid}`; }
  function sentStorageKey(sid) { return `how-seen-sent:${sid}`; }

  function calcScores(answers) {
    const grouped = Object.fromEntries(AXES.map(a => [a.key, []]));
    answers.forEach((answerIndex, i) => grouped[QUESTIONS[i].axis].push(SCALE[answerIndex].score));
    return Object.fromEntries(AXES.map(axis => {
      const values = grouped[axis.key];
      const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
      return [axis.key, clamp(Math.round(avg))];
    }));
  }

  function axisByKey(key) { return AXES.find(axis => axis.key === key); }
  function sortedGaps(self, peers) {
    return AXES.map(axis => ({
      ...axis,
      self:self[axis.key],
      peer:peers[axis.key],
      delta:peers[axis.key] - self[axis.key],
      abs:Math.abs(peers[axis.key] - self[axis.key]),
    })).sort((a,b) => b.abs - a.abs);
  }
  function overallGap(self, peers) {
    return Math.round(AXES.reduce((sum, axis) => sum + Math.abs(self[axis.key] - peers[axis.key]), 0) / AXES.length);
  }
  function strongest(scores) {
    return AXES.map(axis => ({...axis, value:scores[axis.key]})).sort((a,b) => b.value - a.value)[0];
  }

  function toast(message) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1900);
  }

  async function copyText(text, success='コピーしました') {
    try {
      await navigator.clipboard.writeText(text);
      toast(success);
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.appendChild(input); input.select();
      try { document.execCommand('copy'); toast(success); } catch { prompt('この内容をコピーしてください', text); }
      input.remove();
    }
  }

  async function shareInvite(sid) {
    const url = friendUrl(sid);
    const title = '友達から見たあなた';
    const text = '私って実際どう見えてる？ 10問だけ、あなたから見た印象で答えてほしい。';
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; }
      catch (error) { if (error?.name === 'AbortError') return; }
    }
    await copyText(`${text}\n${url}`, '友達用リンクをコピーしました');
  }

  async function api(path, options={}) {
    const response = await fetch(`${API}${path}`, {
      method:options.method || 'GET',
      headers:{
        ...(options.body ? {'Content-Type':'application/json'} : {}),
        ...(options.token ? {'Authorization':`Bearer ${options.token}`} : {}),
      },
      body:options.body ? JSON.stringify(options.body) : undefined,
      cache:'no-store',
    });
    let data = null;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) {
      const error = new Error(data?.error || `HTTP_${response.status}`);
      error.status = response.status;
      error.code = data?.error || '';
      throw error;
    }
    return data;
  }

  function renderHome() {
    clearPoll();
    state = { mode:'home', index:0, answers:[], sid:'', ownerToken:'', selfScores:null, friendScores:null, friendCount:-1 };
    resetBtn.hidden = true;
    app.innerHTML = `
      <section class="hero home-hero">
        <div class="eyebrow">SELF × 3 FRIENDS</div>
        <h1>友達から見た<br>あなた</h1>
        <p class="lead">自分ではこう思っている。<br>でも、周りからはどう見えている？</p>
        <div class="example-gap" aria-label="結果イメージ">
          <span>冷静さ</span><b>自分 81</b><i>→</i><b>友達 46</b>
        </div>
        <button class="primary" id="startSelf" type="button">まず自分で10問に答える</button>
        <p class="micro centered">約1分。入力なし。友達3人の回答が揃うと比較結果が開きます。</p>
      </section>
      <section class="plain-card how-it-works">
        <div><b>1</b><span>自分で10問</span></div><i>→</i><div><b>2</b><span>友達3人へURL</span></div><i>→</i><div><b>3</b><span>差分を見る</span></div>
      </section>`;
    document.getElementById('startSelf').onclick = () => startQuestions('self');
  }

  function startQuestions(mode) {
    clearPoll();
    state.mode = mode;
    state.index = 0;
    state.answers = [];
    resetBtn.hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    const isFriend = state.mode === 'friend';
    const item = QUESTIONS[state.index];
    const text = isFriend ? item.peer : item.self;
    const progress = ((state.index + 1) / QUESTIONS.length) * 100;
    app.innerHTML = `
      <section class="quiz-head">
        <div class="quiz-kicker">${isFriend ? 'あなたから見た印象' : '自分が思う自分'} <b>${state.index + 1}/${QUESTIONS.length}</b></div>
        <div class="progress"><i style="width:${progress}%"></i></div>
      </section>
      <section class="question-card">
        <div class="axis-chip">${esc(axisByKey(item.axis).label)}</div>
        <h2 class="question">${esc(text)}</h2>
        <p class="question-hint">どのくらい当てはまる？</p>
        <div class="choices scale-choices">
          ${SCALE.map((choice, index) => `<button class="choice" type="button" data-answer="${index}"><span>${esc(choice.label)}</span></button>`).join('')}
        </div>
      </section>`;
    app.querySelectorAll('[data-answer]').forEach(button => {
      button.onclick = () => {
        state.answers.push(Number(button.dataset.answer));
        state.index += 1;
        if (state.index < QUESTIONS.length) {
          renderQuestion();
        } else {
          const scores = calcScores(state.answers);
          if (isFriend) submitFriend(scores);
          else createOwnerSession(scores);
        }
      };
    });
  }

  function renderSaving(label='結果を準備しています') {
    app.innerHTML = `<section class="loading-card"><div class="spinner" aria-hidden="true"></div><h2>${esc(label)}</h2><p>数秒で次の画面に進みます。</p></section>`;
  }

  async function createOwnerSession(scores) {
    state.selfScores = scores;
    renderSaving('友達に送るURLを作っています');
    try {
      const data = await api('/session', { method:'POST', body:{ selfScores:scores } });
      state.sid = data.sid;
      state.ownerToken = data.ownerToken;
      safeSet(ownerStorageKey(data.sid), data.ownerToken);
      history.replaceState(null, '', ownerUrl(data.sid, data.ownerToken));
      renderWaiting(0);
      startOwnerPolling();
    } catch (error) {
      renderCreateError(scores, error);
    }
  }

  function renderCreateError(scores, error) {
    const rate = error?.code === 'RATE_LIMIT';
    app.innerHTML = `
      <section class="plain-card error-card">
        <div class="status-icon">!</div>
        <h1>${rate ? '今日は作成上限に達しました' : 'URLを作れませんでした'}</h1>
        <p>${rate ? '同じ端末・回線からの作成回数が多いため、今日は新しい比較を作れません。' : '通信状態を確認して、もう一度試してください。'}</p>
        ${rate ? '' : '<button class="primary" id="retryCreate" type="button">もう一度試す</button>'}
        <button class="secondary" id="backHome" type="button">最初に戻る</button>
      </section>`;
    if (!rate) document.getElementById('retryCreate').onclick = () => createOwnerSession(scores);
    document.getElementById('backHome').onclick = resetAll;
  }

  function friendDots(count) {
    return `<div class="friend-dots" aria-label="${count}人回答済み">${[0,1,2].map(i => `<div class="friend-dot ${i < count ? 'done' : ''}"><span>${i < count ? '✓' : i+1}</span><small>${i < count ? '回答済み' : '待ち'}</small></div>`).join('')}</div>`;
  }

  function renderWaiting(count) {
    if (state.mode === 'owner' && state.friendCount === count && document.getElementById('inviteFriend')) return;
    state.mode = 'owner';
    state.friendCount = count;
    resetBtn.hidden = false;
    const remaining = 3 - count;
    app.innerHTML = `
      <section class="unlock-card">
        <div class="eyebrow">RESULT LOCKED</div>
        <div class="lock-orbit"><div class="lock">${count}/3</div></div>
        <h1>${count === 0 ? '友達3人に聞くと結果が開く' : `あと${remaining}人で結果が開く`}</h1>
        <p>あなた自身の10問は完了しました。<br>同じURLを3人に送るだけです。</p>
        ${friendDots(count)}
      </section>
      <section class="plain-card invite-card">
        <h2>友達にこれを送る</h2>
        <div class="invite-preview">「私って実際どう見えてる？ 10問だけ答えてほしい」</div>
        <button class="primary" id="inviteFriend" type="button">友達にURLを送る</button>
        <button class="secondary" id="copyFriend" type="button">友達用URLをコピー</button>
        <p class="micro">友達にはあなたの自己評価は見えません。個別の回答もあなたには表示されず、3人平均だけが結果になります。</p>
      </section>
      <section class="refresh-line"><span>回答数は自動更新されます</span><button id="manualRefresh" type="button">今すぐ確認</button></section>`;
    document.getElementById('inviteFriend').onclick = () => shareInvite(state.sid);
    document.getElementById('copyFriend').onclick = () => copyText(friendUrl(state.sid), '友達用URLをコピーしました');
    document.getElementById('manualRefresh').onclick = async event => {
      event.currentTarget.disabled = true;
      await loadOwner(true);
      if (event.currentTarget?.isConnected) event.currentTarget.disabled = false;
    };
  }

  function startOwnerPolling() {
    clearPoll();
    loadOwner(false);
    pollTimer = setInterval(() => { if (!document.hidden) loadOwner(false); }, 7000);
  }

  async function loadOwner(showToast=false) {
    if (!state.sid || !state.ownerToken) return;
    try {
      const data = await api(`/session/${encodeURIComponent(state.sid)}`, { token:state.ownerToken });
      state.selfScores = data.selfScores;
      if (data.complete && data.friendAverage) {
        clearPoll();
        state.friendScores = data.friendAverage;
        renderComparison(data.selfScores, data.friendAverage);
      } else {
        const changed = state.friendCount !== data.friendCount;
        renderWaiting(data.friendCount);
        if (showToast && !changed) toast(`現在 ${data.friendCount}/3 人です`);
      }
    } catch (error) {
      if (showToast) toast('回答数を確認できませんでした');
      if (error?.code === 'FORBIDDEN' || error?.code === 'OWNER_TOKEN_REQUIRED' || error?.code === 'SESSION_NOT_FOUND') renderOwnerLinkError();
    }
  }

  function renderOwnerLinkError() {
    clearPoll();
    app.innerHTML = `
      <section class="plain-card error-card">
        <div class="status-icon">?</div>
        <h1>この結果ページを開けません</h1>
        <p>本人用の非公開キーが見つからないか、比較データが存在しません。</p>
        <button class="primary" id="newStart" type="button">新しく始める</button>
      </section>`;
    document.getElementById('newStart').onclick = resetAll;
  }

  async function renderFriendIntro(sid) {
    clearPoll();
    state = { mode:'friend-intro', index:0, answers:[], sid, ownerToken:'', selfScores:null, friendScores:null, friendCount:-1 };
    resetBtn.hidden = true;
    const alreadySent = safeGet(sentStorageKey(sid)) === '1';
    if (alreadySent) return renderAlreadyAnswered();
    app.innerHTML = `
      <section class="hero friend-hero">
        <div class="friend-badge">友達から判定依頼が届いています</div>
        <h1>この人、<br>実際どう見える？</h1>
        <p class="lead">本人の自己評価は見せません。<br>あなたの普段の印象だけで10問答えてください。</p>
        <button class="primary" id="friendStart" type="button">匿名で10問に答える</button>
        <p class="micro centered">約1分。名前・メール・文章入力なし。個別回答は本人には表示されません。</p>
      </section>`;
    document.getElementById('friendStart').onclick = () => startQuestions('friend');
    try {
      const info = await api(`/session/${encodeURIComponent(sid)}/public`);
      if (!info.open) renderFriendClosed();
    } catch (error) {
      if (error?.code === 'SESSION_NOT_FOUND') renderFriendMissing();
    }
  }

  async function submitFriend(scores) {
    renderSaving('回答を届けています');
    let responseId = safeGet(responseStorageKey(state.sid));
    if (!responseId) {
      responseId = randomId();
      safeSet(responseStorageKey(state.sid), responseId);
    }
    try {
      const data = await api(`/session/${encodeURIComponent(state.sid)}/response`, {
        method:'POST',
        body:{ scores, responseId },
      });
      safeSet(sentStorageKey(state.sid), '1');
      renderFriendThanks(data.friendCount, scores, data.duplicate);
    } catch (error) {
      if (error?.code === 'SESSION_FULL') return renderFriendClosed();
      if (error?.code === 'SESSION_NOT_FOUND') return renderFriendMissing();
      app.innerHTML = `
        <section class="plain-card error-card">
          <div class="status-icon">!</div><h1>送信できませんでした</h1>
          <p>回答はこの端末に残っています。通信状態を確認して、もう一度送ってください。</p>
          <button class="primary" id="retryFriend" type="button">もう一度送る</button>
        </section>`;
      document.getElementById('retryFriend').onclick = () => submitFriend(scores);
    }
  }

  function renderFriendThanks(count, scores, duplicate=false) {
    const top = strongest(scores);
    resetBtn.hidden = true;
    app.innerHTML = `
      <section class="thanks-card">
        <div class="check-burst">✓</div>
        <div class="eyebrow">ANSWER SENT</div>
        <h1>${duplicate ? '回答済みです' : '回答を届けました'}</h1>
        <p>これで <strong>${count}/3人</strong>。${count >= 3 ? '本人の比較結果が開きます。' : `あと${3-count}人で本人の結果が開きます。`}</p>
      </section>
      <section class="plain-card mini-result">
        <span>あなたから見たこの人</span>
        <h2>いちばん強く見えたのは<br>「${esc(top.label)}」</h2>
        <div class="mini-meter"><i style="width:${top.value}%"></i></div>
      </section>
      <section class="loop-card">
        <div><span>今度はあなたの番</span><h2>自分も3人に聞いてみる？</h2></div>
        <button class="primary" id="startMine" type="button">自分もやってみる</button>
      </section>`;
    document.getElementById('startMine').onclick = () => {
      history.replaceState(null, '', baseUrl());
      renderHome();
    };
  }

  function renderAlreadyAnswered() {
    app.innerHTML = `
      <section class="thanks-card compact">
        <div class="check-burst">✓</div><h1>この依頼には回答済みです</h1>
        <p>同じ人への回答は1回だけ集計されます。</p>
      </section>
      <section class="loop-card"><div><span>あなたも比べてみる</span><h2>友達3人からどう見える？</h2></div><button class="primary" id="startMine" type="button">自分も始める</button></section>`;
    document.getElementById('startMine').onclick = () => { history.replaceState(null,'',baseUrl()); renderHome(); };
  }

  function renderFriendClosed() {
    safeSet(sentStorageKey(state.sid), safeGet(sentStorageKey(state.sid)) || 'closed');
    app.innerHTML = `
      <section class="plain-card error-card">
        <div class="status-icon done-icon">3</div><h1>3人の回答が揃いました</h1>
        <p>この依頼の受付は終了しています。本人にはすでに比較結果が開いています。</p>
        <button class="primary" id="startMine" type="button">自分も3人に聞いてみる</button>
      </section>`;
    document.getElementById('startMine').onclick = () => { history.replaceState(null,'',baseUrl()); renderHome(); };
  }

  function renderFriendMissing() {
    app.innerHTML = `
      <section class="plain-card error-card">
        <div class="status-icon">?</div><h1>この依頼は見つかりません</h1>
        <p>URLが途中で切れているか、依頼が無効です。</p>
        <button class="primary" id="startMine" type="button">自分の比較を始める</button>
      </section>`;
    document.getElementById('startMine').onclick = () => { history.replaceState(null,'',baseUrl()); renderHome(); };
  }

  function comparisonRows(self, peer) {
    return AXES.map(axis => {
      const s = self[axis.key];
      const p = peer[axis.key];
      const delta = p - s;
      const note = Math.abs(delta) < 8 ? 'ほぼ一致' : delta > 0 ? `友達の方が +${Math.abs(delta)}` : `自分の方が +${Math.abs(delta)}`;
      return `<article class="compare-row">
        <div class="compare-title"><strong>${esc(axis.label)}</strong><span>${note}</span></div>
        <div class="score-line self"><label>自分では</label><div class="score-track"><i style="width:${s}%"></i></div><b>${s}</b></div>
        <div class="score-line peer"><label>友達3人</label><div class="score-track"><i style="width:${p}%"></i></div><b>${p}</b></div>
      </article>`;
    }).join('');
  }

  function gapCopy(top) {
    if (top.abs < 8) return `「${top.label}」まで含め、自己評価と友達の印象はかなり近い結果でした。`;
    if (top.delta > 0) return `あなたが思っているより、友達はあなたの「${top.label}」を強く感じています。`;
    return `自分では「${top.label}」が高いと思っている一方、友達3人からはそこまで強く見えていません。`;
  }

  function renderComparison(self, peer) {
    clearPoll();
    state.mode = 'result';
    state.selfScores = self;
    state.friendScores = peer;
    state.friendCount = 3;
    resetBtn.hidden = false;
    const gaps = sortedGaps(self, peer);
    const top = gaps[0];
    const gap = overallGap(self, peer);
    app.innerHTML = `
      <section class="result-hero">
        <div class="result-tag">3 FRIENDS COMPLETED</div>
        <p class="result-overline">いちばん見え方が違ったのは</p>
        <h1>${esc(top.label)}</h1>
        <div class="hero-score-pair"><div><span>自分では</span><b>${top.self}</b></div><i>VS</i><div><span>友達3人</span><b>${top.peer}</b></div></div>
        <p class="result-copy">${esc(gapCopy(top))}</p>
      </section>
      <section class="gap-summary">
        <div><span>5項目の平均ズレ</span><b>${gap}<small>/100</small></b></div>
        <p>高い・低いの優劣ではなく、自己認識と3人の印象の距離です。</p>
      </section>
      <section class="comparison-card">
        <div class="section-head"><span>SELF × FRIENDS</span><h2>5つの見え方を比較</h2></div>
        <div class="compare-list">${comparisonRows(self, peer)}</div>
      </section>
      <section class="plain-card interpretation">
        <h2>この結果の見方</h2>
        <p>これは性格の正解を決める診断ではありません。<strong>「自分が自分をどう見ているか」と「この3人が普段どう感じているか」</strong>の差です。相手や関係性が変われば結果も変わります。</p>
      </section>
      <section class="share-box">
        <button class="primary" id="shareComparison" type="button">この差をシェアする</button>
        <button class="secondary" id="newRound" type="button">別の3人でもう一度</button>
      </section>`;
    document.getElementById('shareComparison').onclick = async () => {
      const text = `友達3人から見た自分、いちばんズレたのは「${top.label}」。自分 ${top.self} / 友達 ${top.peer} だった。`;
      if (navigator.share) {
        try { await navigator.share({ title:'友達から見たあなた', text, url:baseUrl() }); return; }
        catch (error) { if (error?.name === 'AbortError') return; }
      }
      await copyText(`${text}\n${baseUrl()}`, '結果をコピーしました');
    };
    document.getElementById('newRound').onclick = resetAll;
  }

  function resetAll() {
    clearPoll();
    const oldSid = state.sid;
    if (oldSid) safeRemove(ownerStorageKey(oldSid));
    history.replaceState(null, '', baseUrl());
    renderHome();
  }

  async function init() {
    resetBtn.onclick = resetAll;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.mode === 'owner') loadOwner(false);
    });
    const params = new URLSearchParams(location.search);
    const friendSid = params.get('friend');
    const ownerSid = params.get('owner');
    if (friendSid) return renderFriendIntro(friendSid);
    if (ownerSid) {
      const hash = new URLSearchParams(location.hash.replace(/^#/,''));
      const token = hash.get('key') || safeGet(ownerStorageKey(ownerSid)) || '';
      state = { mode:'owner', index:0, answers:[], sid:ownerSid, ownerToken:token, selfScores:null, friendScores:null, friendCount:-1 };
      if (!token) return renderOwnerLinkError();
      safeSet(ownerStorageKey(ownerSid), token);
      renderSaving('回答数を確認しています');
      await loadOwner(false);
      if (state.mode === 'owner') startOwnerPolling();
      return;
    }
    renderHome();
  }

  init();
})();
