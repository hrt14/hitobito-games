(() => {
  const app = document.getElementById('app');
  const introTemplate = document.getElementById('introTemplate');
  const restartTop = document.getElementById('restartTop');
  const toastEl = document.getElementById('toast');

  const THREADS = {
    observe: { title: '見えないものを拾う力', short: '観察する力', line: '人や状況の小さな違いに気づき、まだ言葉になっていないものを拾える。' },
    make: { title: 'まだないものを形にする力', short: '形にする力', line: '頭の中だけにあったものを、試作品・言葉・表現として外へ出せる。' },
    connect: { title: '人と経験をつなぐ力', short: 'つなぐ力', line: '別々の人や気持ちの間に入り、関係や意味をつなぎ直せる。' },
    organize: { title: '混乱を整える力', short: '整える力', line: '散らかった情報や状況を分け、順番をつくり、次の一手を見つけられる。' },
    move: { title: 'まず試して道をつくる力', short: '動きながら考える力', line: '答えが見えなくても小さく試し、現実から次の手がかりを取れる。' },
    persist: { title: '立て直して続ける力', short: '続け直す力', line: '一度止まっても、やり方や距離を変えながらもう一度進める。' },
  };

  const QUESTIONS = [
    {
      label: 'PAST 01', title: '昔、気づくと時間を使っていたのは？', help: '上手だったかではなく、ついやっていたものを選んでください。', role: '昔の夢中',
      options: [
        { text: '絵・文章・工作など、何かを作る', tags: ['make','move'] },
        { text: '本・図鑑・ネットで、とことん調べる', tags: ['observe','organize'] },
        { text: '友達に教える、説明する', tags: ['connect','organize'] },
        { text: '遊びやイベントを仕切る、段取りする', tags: ['organize','move'] },
        { text: '誰かの話を長く聞く', tags: ['connect','observe'] },
        { text: '一人で試行錯誤して、できるまでやる', tags: ['persist','make'] },
      ],
    },
    {
      label: 'PAST 02', title: 'いちばん「遠回りだった」と感じる経験は？', help: '成功した話でなくて大丈夫です。今振り返って気になるものを。', role: '遠回り',
      options: [
        { text: '続かなかった習い事・部活・勉強', tags: ['move','persist'] },
        { text: '進路や目標を途中で変えた', tags: ['move','observe'] },
        { text: '合わない仕事や役割を経験した', tags: ['organize','observe'] },
        { text: '人間関係で離れる・やり直す経験をした', tags: ['connect','persist'] },
        { text: '失敗して、ゼロからやり直した', tags: ['persist','move'] },
        { text: '何をしたいか決まらない時期があった', tags: ['observe','make'] },
      ],
    },
    {
      label: 'PAST 03', title: '困ったとき、昔からついやるのは？', help: '理想ではなく、実際のクセに近い方を。', role: '困ったときのクセ',
      options: [
        { text: 'まず情報を集める', tags: ['observe','organize'] },
        { text: '人に話して、考えを整理する', tags: ['connect','organize'] },
        { text: '問題を小さく分ける', tags: ['organize','persist'] },
        { text: '一回やってみてから考える', tags: ['move','make'] },
        { text: '別の方法を何個も試す', tags: ['make','move'] },
        { text: '少し距離を置いて、落ち着いて見る', tags: ['observe','persist'] },
      ],
    },
    {
      label: 'NOW 04', title: '今、人から頼られやすいのは？', help: '褒められることより、「なぜか自分に回ってくること」で選んでください。', role: '今の役割',
      options: [
        { text: 'わかりやすく説明すること', tags: ['organize','connect'] },
        { text: '話を聞いて、気持ちを受け止めること', tags: ['connect','observe'] },
        { text: '散らかったものを整理・段取りすること', tags: ['organize','persist'] },
        { text: '新しい案や別のやり方を出すこと', tags: ['make','move'] },
        { text: '最後まで持っていくこと', tags: ['persist','organize'] },
        { text: 'トラブル時に冷静になること', tags: ['observe','persist'] },
      ],
    },
    {
      label: 'NOW 05', title: 'これからも失いたくないものは？', help: '「一番正しい」ではなく、今の自分に残したい感覚を。', role: 'これから',
      options: [
        { text: '自由に選び直せること', tags: ['move','make'] },
        { text: '安心して戻れる場所があること', tags: ['persist','connect'] },
        { text: '昨日より少し成長していること', tags: ['persist','move'] },
        { text: '人とちゃんとつながっていること', tags: ['connect','observe'] },
        { text: '自分らしいものを作れること', tags: ['make','observe'] },
        { text: '複雑なことを、納得できる形にすること', tags: ['organize','observe'] },
      ],
    },
  ];

  let state = { step: 0, answers: [], result: null };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastEl.classList.remove('show'), 1700);
  }

  function showIntro() {
    state = { step: 0, answers: [], result: null };
    restartTop.hidden = true;
    app.innerHTML = '';
    app.appendChild(introTemplate.content.cloneNode(true));
    document.getElementById('startBtn').addEventListener('click', () => showQuestion(0));
  }

  function showQuestion(index) {
    state.step = index;
    restartTop.hidden = false;
    const q = QUESTIONS[index];
    const progress = (index / QUESTIONS.length) * 100;
    app.innerHTML = `
      <section class="screen question-screen">
        <div class="progress-head"><span class="progress-copy">あなたの過去をたどる</span><span class="progress-count">${index + 1} / ${QUESTIONS.length}</span></div>
        <div class="progress-line"><i style="width:${progress}%"></i></div>
        <div class="question-label">${q.label}</div>
        <h2 class="question-title">${escapeHtml(q.title)}</h2>
        <p class="question-help">${escapeHtml(q.help)}</p>
        <div class="choices">${q.options.map((opt, i) => `<button class="choice" type="button" data-index="${i}">${escapeHtml(opt.text)}</button>`).join('')}</div>
        <div class="selection-echo" aria-label="回答済み ${state.answers.length}件">${QUESTIONS.map((_, i) => `<span class="echo-dot ${i < state.answers.length ? 'done' : ''}"></span>`).join('')}</div>
      </section>`;
    app.querySelectorAll('.choice').forEach((button) => button.addEventListener('click', () => selectAnswer(Number(button.dataset.index))));
  }

  function selectAnswer(optionIndex) {
    const q = QUESTIONS[state.step];
    const option = q.options[optionIndex];
    state.answers[state.step] = { role: q.role, text: option.text, tags: option.tags };
    if (state.step < QUESTIONS.length - 1) showQuestion(state.step + 1);
    else { state.result = makeResult(); showReveal(); }
  }

  function makeResult() {
    const scores = Object.fromEntries(Object.keys(THREADS).map((key) => [key, 0]));
    state.answers.forEach((answer, answerIndex) => {
      answer.tags.forEach((tag, tagIndex) => {
        const weight = tagIndex === 0 ? 2 : 1;
        const recencyBoost = answerIndex >= 3 ? 1 : 0;
        scores[tag] += weight + recencyBoost;
      });
    });
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topScore = ranked[0][1];
    const tied = ranked.filter(([, value]) => value === topScore).map(([key]) => key);
    const tieSeed = state.answers.map((a) => a.text.length).reduce((sum, n) => sum + n, 0);
    const key = tied[tieSeed % tied.length];
    const thread = THREADS[key];
    const storyParts = [state.answers[0].text, state.answers[1].text, state.answers[2].text];
    const story = `「${storyParts[0]}」ことも、「${storyParts[1]}」ことも、困ったときに「${storyParts[2]}」ことも。別々に見えた経験を並べると、今のあなたの「${thread.short}」へ続く線として読むことができます。`;
    return { key, thread, story, scores };
  }

  function showReveal() {
    restartTop.hidden = false;
    app.innerHTML = `
      <section class="screen reveal-screen">
        <div class="reveal-kicker">CONNECTING THE DOTS</div>
        <div class="reveal-thread" aria-hidden="true"><svg viewBox="0 0 360 220"><path d="M18 34 C92 25 62 88 133 91 S204 148 342 174" /><circle cx="18" cy="34" r="5" /><circle cx="133" cy="91" r="5" /><circle cx="232" cy="146" r="5" /><circle class="end" cx="342" cy="174" r="8" /></svg></div>
        <h2 class="reveal-title">バラバラだった経験に、<br>一本の線が見えてきました。</h2>
        <p class="reveal-copy">これは「人生の答え」ではありません。<br>今のあなたから過去を見たときに拾える、ひとつのつながりです。</p>
      </section>`;
    setTimeout(showResult, 1650);
  }

  function cardNodesHtml() {
    const picks = [state.answers[0], state.answers[1], state.answers[3], { role: '今につながっているもの', text: state.result.thread.title, present: true }];
    return picks.map((item) => `<div class="card-node ${item.present ? 'present' : ''}"><div class="node-label">${escapeHtml(item.role)}</div><div class="node-value">${escapeHtml(item.text)}</div></div>`).join('');
  }

  function showResult() {
    const result = state.result;
    app.innerHTML = `
      <section class="screen result-screen">
        <div class="result-head"><div class="kicker">YOUR STORY CARD</div><h2>あなたの人生の伏線</h2></div>
        <article class="story-card" id="storyCard">
          <div class="card-top"><span class="card-brand">LEVEL UP · LIFE THREAD</span><span class="card-no">05 → 01</span></div>
          <div class="card-title">一見、無関係だった。</div><div class="card-sub">でも、今から見ると線がある。</div>
          <div class="card-thread"><div class="thread-rail" aria-hidden="true"></div><div>${cardNodesHtml()}</div></div>
          <div class="card-core"><small>YOUR THREAD</small><strong>${escapeHtml(result.thread.title)}</strong></div>
          <p class="card-story">${escapeHtml(result.story)}</p>
          <div class="card-quote">無駄だった経験ではなく、まだ意味が見えていなかった経験だったのかもしれない。</div>
        </article>
        <p class="result-disclaimer">選択した経験から見える「ひとつの読み方」です。能力や性格を判定する診断ではありません。</p>
        <div class="actions"><button id="shareBtn" class="primary" type="button">この伏線カードをシェア <span>↗</span></button><button id="imageBtn" class="secondary" type="button">画像として保存</button><button id="againBtn" class="tiny-action" type="button">もう一度、つなぎ直す</button></div>
      </section>`;
    document.getElementById('shareBtn').addEventListener('click', shareCard);
    document.getElementById('imageBtn').addEventListener('click', saveCardImage);
    document.getElementById('againBtn').addEventListener('click', showIntro);
    saveLastResult();
  }

  function saveLastResult() {
    try { localStorage.setItem('jinsei-fukusen:last', JSON.stringify({ at: Date.now(), answers: state.answers, resultKey: state.result.key })); } catch (_) {}
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = []; let line = '';
    [...text].forEach((char) => { const next = line + char; if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = char; } else line = next; });
    if (line) lines.push(line); return lines;
  }

  async function makeCardBlob() {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#191713'; ctx.fillRect(0, 0, 1080, 1350);
    const glow = ctx.createRadialGradient(870, 120, 10, 870, 120, 430); glow.addColorStop(0, 'rgba(184,77,59,.28)'); glow.addColorStop(1, 'rgba(184,77,59,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 600);
    ctx.fillStyle = '#c9c0b4'; ctx.font = '800 26px -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif'; ctx.fillText('LEVEL UP · あなたの人生の伏線', 80, 90);
    ctx.fillStyle = '#fff9ef'; ctx.font = '700 62px "Yu Mincho", "Hiragino Mincho ProN", serif'; ctx.fillText('一見、無関係だった。', 80, 190);
    ctx.fillStyle = '#b9afa2'; ctx.font = '500 29px -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif'; ctx.fillText('でも、今から見ると線がある。', 82, 238);
    const nodes = [state.answers[0], state.answers[1], state.answers[3]]; const startY = 340; const gapY = 155;
    ctx.strokeStyle = '#b84d3b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(103, startY + 7); ctx.lineTo(103, startY + gapY * 3 + 17); ctx.stroke();
    nodes.forEach((item, i) => { const y = startY + gapY * i; ctx.fillStyle = '#191713'; ctx.strokeStyle = '#dca396'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(103, y + 7, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#968d82'; ctx.font = '800 21px -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif'; ctx.fillText(item.role, 145, y); ctx.fillStyle = '#f5eee3'; ctx.font = '700 31px -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif'; wrapText(ctx, item.text, 820).slice(0, 2).forEach((line, n) => ctx.fillText(line, 145, y + 44 + n * 41)); });
    const coreY = startY + gapY * 3; ctx.fillStyle = '#b84d3b'; ctx.beginPath(); ctx.arc(103, coreY + 17, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a9a095'; ctx.font = '800 21px -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif'; ctx.fillText('今につながっているもの', 145, coreY + 3); ctx.fillStyle = '#fffaf2'; ctx.font = '700 47px "Yu Mincho", "Hiragino Mincho ProN", serif'; wrapText(ctx, state.result.thread.title, 820).slice(0, 2).forEach((line, n) => ctx.fillText(line, 145, coreY + 62 + n * 58));
    ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(80, 950); ctx.lineTo(1000, 950); ctx.stroke();
    ctx.fillStyle = '#c9c0b4'; ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif'; wrapText(ctx, state.result.story, 920).slice(0, 5).forEach((line, i) => ctx.fillText(line, 80, 1010 + i * 44));
    ctx.fillStyle = '#dda598'; ctx.font = '700 25px -apple-system, BlinkMacSystemFont, "Yu Gothic", sans-serif'; const quote = '無駄だった経験ではなく、まだ意味が見えていなかった経験だったのかもしれない。'; wrapText(ctx, quote, 920).slice(0, 3).forEach((line, i) => ctx.fillText(line, 80, 1240 + i * 38));
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('画像を作れませんでした')), 'image/png', 0.94));
  }

  async function shareCard() {
    const title = 'あなたの人生の伏線'; const text = `私の人生の伏線は「${state.result.thread.title}」につながっていた。あなたは何につながる？`; const url = `${location.origin}${location.pathname}`;
    try {
      const blob = await makeCardBlob(); const file = new File([blob], 'jinsei-fukusen.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ title, text, url, files: [file] }); return; }
      if (navigator.share) { await navigator.share({ title, text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`); toast('シェア文とリンクをコピーしました');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      try { await navigator.clipboard.writeText(`${text}\n${url}`); toast('シェア文とリンクをコピーしました'); } catch (_) { toast('共有メニューを開けませんでした'); }
    }
  }

  async function saveCardImage() {
    try { const blob = await makeCardBlob(); const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = 'jinsei-fukusen.png'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(href), 1000); toast('伏線カードを画像にしました'); }
    catch (_) { toast('画像を作れませんでした'); }
  }

  restartTop.addEventListener('click', showIntro);
  showIntro();
})();
