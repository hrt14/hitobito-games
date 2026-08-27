(() => {
  'use strict';

  const AXES = {
    career: { label: 'キャリア', short: 'CAREER', advice: '役割の難度が上がる仕事を取りにいき、経験年数ではなく「任される仕事の格」を上げる。' },
    scope: { label: '責任範囲', short: 'SCOPE', advice: '担当範囲を広げる。人・予算・意思決定のどれか1つでも、自分が最終判断する領域を増やす。' },
    expertise: { label: '専門性', short: 'EXPERTISE', advice: '「一人で完結できる」から「難題の相談先になる」へ。再現できる専門領域を1つ深くする。' },
    impact: { label: '事業インパクト', short: 'IMPACT', advice: '売上・利益・コスト・時間・品質のどれをどれだけ動かしたか、成果を数字と因果で残せる仕事を増やす。' },
    scarcity: { label: '希少性', short: 'SCARCITY', advice: '単一スキルより、2〜3領域の掛け合わせを作る。「できる人が少ない組み合わせ」に寄せる。' },
    market: { label: '市場反応', short: 'MARKET', advice: '社内評価だけでなく外部市場で確かめる。求人を見る、スカウトを受ける、面談するなど小さく市場テストする。' }
  };

  const SECTION_ORDER = ['career', 'scope', 'expertise', 'impact', 'scarcity', 'market'];
  const SECTION_LABELS = {
    career: '01 現在地', scope: '02 任されている範囲', expertise: '03 仕事の難しさ',
    impact: '04 動かした成果', scarcity: '05 代わりの少なさ', market: '06 外からの評価'
  };

  const q = (axis, text, hint, options) => ({ axis, text, hint, options });
  const o = (label, value, note = '', unknown = false) => ({ label, value, note, unknown });

  const QUESTIONS = [
    q('career','この仕事・職種の経験はどれくらい？','同じ会社にいた年数ではなく、近い仕事内容の経験で選ぶ。',[
      o('まだ1年未満',0),o('1〜2年',1),o('3〜5年',2),o('6〜10年',3),o('11年以上',4)
    ]),
    q('career','いまの立ち位置に一番近いのは？','肩書きより、実際に期待されている役割で選ぶ。',[
      o('教わりながら担当する',0),o('一人で担当を完結する',1),o('難しい案件の主担当・リード',2),o('チームや複数案件を率いる',3),o('部門・事業・経営レベルを担う',4)
    ]),
    q('career','新しい仕事を任された時、立ち上がるまでの速さは？','「何をすればいいか」が曖昧な状況を含めて考える。',[
      o('手順がないと難しい',0),o('既存例があれば進められる',1),o('調べながら自走できる',2),o('前例がなくても設計できる',3),o('他人が進められる型まで作れる',4)
    ]),
    q('career','仕事の評価はどの範囲で決まる？','自分の成果がどこまで見られているか。',[
      o('自分の作業・件数',0),o('担当案件の成果',1),o('チームの成果',2),o('部門・サービスの成果',3),o('会社・事業全体の成果',4)
    ]),
    q('career','いまの仕事を別の会社でも再現できそう？','会社固有の仕組みを離れても価値が残るか。',[
      o('かなり会社依存',0),o('一部は持ち出せる',1),o('多くは他社でも使える',2),o('業界をまたいでも使える',3),o('複数業界で価値が出る',4)
    ]),

    q('scope','自分で決められる範囲は？','承認を取らずに、責任を持って決められる範囲。',[
      o('ほぼ決められない',0),o('自分の作業方法',1),o('案件の進め方・優先順位',2),o('チーム方針・配分',3),o('事業方針・投資判断',4)
    ]),
    q('scope','人を動かす責任はどれくらい？','直属部下だけでなく、案件上のリードも含む。',[
      o('自分だけ',0),o('1〜2人と連携',1),o('3〜7人をリード',2),o('8〜30人規模を動かす',3),o('複数チーム・30人超を動かす',4)
    ]),
    q('scope','予算・原価・仕入れなど、お金の判断規模は？','厳密な金額でなく、普段の意思決定の桁感で選ぶ。',[
      o('ほぼ扱わない',0),o('100万円未満',1),o('100万〜1,000万円規模',2),o('1,000万〜1億円規模',3),o('1億円超の規模',4),o('わからない',2,'',true)
    ]),
    q('scope','あなたが止まると、どこまで仕事が止まる？','責任の集中度を見る質問。',[
      o('ほぼ影響しない',0),o('自分の担当が遅れる',1),o('案件・チームが遅れる',2),o('部門や重要顧客に影響する',3),o('事業・経営判断が止まる',4)
    ]),
    q('scope','社外の重要人物とのやり取りは？','顧客・取引先・経営者・パートナーなど。',[
      o('ほぼない',0),o('定型的な連絡が中心',1),o('提案・交渉を担当する',2),o('重要顧客・責任者と直接交渉する',3),o('経営層同士の交渉・提携を担う',4)
    ]),

    q('expertise','同職種の人が困った時、あなたはどの位置？','専門性の深さを「相談され方」で見る。',[
      o('自分が相談する側',0),o('基本なら答えられる',1),o('難しい案件も相談される',2),o('社内の最終相談先の一人',3),o('社外からも指名・相談される',4)
    ]),
    q('expertise','問題の原因が見えない時、どこまでできる？','正解が用意されていない問題を想像する。',[
      o('切り分け方がわからない',0),o('手順があれば調べられる',1),o('仮説を立てて検証できる',2),o('複雑な原因を構造化できる',3),o('新しい解法や仕組みを作れる',4)
    ]),
    q('expertise','あなたの仕事は、どれくらい「型」にできている？','属人的な腕ではなく、再現できる専門性か。',[
      o('まだ自分でも安定しない',0),o('慣れた仕事なら安定する',1),o('再現できる手順がある',2),o('他人にも教えて再現させられる',3),o('組織標準・方法論にできる',4)
    ]),
    q('expertise','複数分野をつなぐ力は？','例：技術×営業、EC×データ、企画×現場など。',[
      o('ほぼ1分野だけ',0),o('隣接分野を少し理解',1),o('2分野を実務で使う',2),o('3分野以上を組み合わせる',3),o('分野の橋渡し役として指名される',4)
    ]),
    q('expertise','仕事で使う知識の更新頻度は？','学習量ではなく、価値を保つために更新が必要か。',[
      o('ほぼ変化しない',0),o('数年単位で更新',1),o('年に何度か更新',2),o('毎月のように更新が必要',3),o('変化を追う側ではなく先に試す側',4)
    ]),

    q('impact','あなたの成果は売上にどのくらい近い？','直接売る仕事でなくても、売上を動かす因果が見えるか。',[
      o('ほぼ関係しない',0),o('間接的に支える',1),o('担当施策・案件の売上に影響',2),o('大きな売上目標を直接持つ',3),o('事業売上そのものを設計・責任',4)
    ]),
    q('impact','利益・コスト・工数を減らした実績は？','一度きりではなく、結果として残った改善を考える。',[
      o('まだ特にない',0),o('小さな改善はある',1),o('チームで分かる改善がある',2),o('部門レベルで大きな改善がある',3),o('会社・事業の構造を変える改善がある',4)
    ]),
    q('impact','目標に対して結果を出す安定度は？','景気や運だけでなく、自分の打ち手で再現できるか。',[
      o('まだ安定しない',0),o('条件が良ければ達成',1),o('おおむね達成できる',2),o('難しい目標でも達成率が高い',3),o('他人の達成率まで上げられる',4)
    ]),
    q('impact','過去2〜3年で「明確に大きかった成果」は？','肩書きではなく、結果の大きさで選ぶ。',[
      o('まだこれから',0),o('自分の担当内で改善した',1),o('チームで認識される成果',2),o('部門・重要顧客で大きな成果',3),o('会社の代表実績になる成果',4)
    ]),
    q('impact','あなたが作った仕組みは、その後どうなる？','成果の持続性を見る。',[
      o('自分が離れると止まる',0),o('しばらくは続く',1),o('他人が運用できる',2),o('複数チームへ展開される',3),o('会社の標準・資産として残る',4)
    ]),
    q('impact','失敗した時の影響の大きさは？','責任が重い仕事ほど、判断の価値も高くなりやすい。',[
      o('やり直しが簡単',0),o('担当内で修正できる',1),o('顧客・チームに影響する',2),o('大きな損失・信用に影響する',3),o('事業継続・経営判断に影響する',4)
    ]),

    q('scarcity','同じレベルの人を採用するとしたら？','自分ではなく「同じ仕事を同じ水準でできる人」を想像する。',[
      o('かなり見つけやすい',0),o('普通に見つかる',1),o('少し探す必要がある',2),o('採用がかなり難しい',3),o('ほとんど見つからない',4),o('わからない',2,'',true)
    ]),
    q('scarcity','あなたしか知らない、ではなく「あなたしか解けない」に近い仕事は？','情報を抱えている希少性は除く。',[
      o('ほぼない',0),o('たまにある',1),o('一定数ある',2),o('重要案件で多い',3),o('その問題で指名される',4)
    ]),
    q('scarcity','海外・異文化・外国語を仕事で使える？','資格点数ではなく、仕事を進められるかで選ぶ。',[
      o('使わない',0),o('簡単なやり取りなら',1),o('実務を一部進められる',2),o('交渉・会議まで完結できる',3),o('複数市場をまたいで仕事を作れる',4)
    ]),
    q('scarcity','あなたの強みは何個の掛け合わせ？','「営業だけ」より「営業×データ×業界知識」のような組み合わせを見る。',[
      o('まだ明確な強みがない',0),o('1つの強み',1),o('2つの強みを掛け合わせる',2),o('3つ以上を掛け合わせる',3),o('独自の組み合わせとして認知される',4)
    ]),

    q('market','社外から仕事・転職の声がかかる頻度は？','応募した結果ではなく、相手から来る反応。',[
      o('ほぼない',0),o('年に数回',1),o('月に1回前後',2),o('月に何度も',3),o('継続的に指名・誘いが来る',4)
    ]),
    q('market','自分の職種の求人を見た時、要件への当てはまりは？','年収欄ではなく、仕事内容・必須要件への一致で見る。',[
      o('まだ要件に届かないことが多い',0),o('一部なら合う',1),o('中堅求人にはかなり合う',2),o('上位・リード求人にも合う',3),o('責任者・専門家求人にも合う',4),o('求人を見ないのでわからない',2,'',true)
    ]),
    q('market','社外であなたの実績を説明した時の反応は？','SNSの人気ではなく、仕事の相手・採用側の反応。',[
      o('説明しても伝わりにくい',0),o('仕事内容は理解される',1),o('実績を評価される',2),o('詳しく聞かれる・紹介される',3),o('指名・登壇・相談につながる',4),o('社外で話したことがない',1,'',true)
    ]),
    q('market','今の会社を離れたら、同等以上の役割を探せそう？','実際に辞める必要はない。選択肢の多さを想像する。',[
      o('かなり不安',0),o('時間をかければ探せそう',1),o('複数社は候補がありそう',2),o('かなり選べそう',3),o('すでに具体的な選択肢が複数ある',4),o('わからない',2,'',true)
    ]),
    q('market','仕事の価値を「社外に伝わる言葉」で説明できる？','役職名ではなく、何を動かせる人なのか。',[
      o('うまく言えない',0),o('仕事内容なら言える',1),o('強みと成果を言える',2),o('数字・事例で価値を説明できる',3),o('相手別に価値提案として説明できる',4)
    ])
  ];

  const els = Object.fromEntries([
    'introView','questionView','resultView','startBtn','restartTopBtn','previousResult','backBtn','sectionLabel','questionCount','progressBar','questionCard','questionKicker','questionText','questionHint','options','salaryLow','salaryHigh','marketScore','uncertaintyNote','topDrivers','nextLever','axisBars','comparisonCard','shareBtn','retryBtn','shareStatus'
  ].map(id => [id, document.getElementById(id)]));

  let index = 0;
  let answers = Array(QUESTIONS.length).fill(null);
  let previousSnapshot = loadHistory()[0] || null;

  function show(view) {
    [els.introView, els.questionView, els.resultView].forEach(v => v.classList.toggle('active', v === view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPrevious() {
    const prev = loadHistory()[0];
    if (!prev) return;
    els.previousResult.classList.remove('hidden');
    els.previousResult.innerHTML = `前回の結果 <strong>${prev.low}〜${prev.high}万円</strong> <span>市場価値スコア ${prev.score}</span>`;
  }

  function start(reset = true) {
    if (reset) {
      index = 0;
      answers = Array(QUESTIONS.length).fill(null);
      previousSnapshot = loadHistory()[0] || null;
    }
    show(els.questionView);
    renderQuestion();
  }

  function renderQuestion() {
    const item = QUESTIONS[index];
    const axisIndex = SECTION_ORDER.indexOf(item.axis);
    els.sectionLabel.textContent = SECTION_LABELS[item.axis];
    els.questionCount.textContent = `${index + 1} / ${QUESTIONS.length}`;
    els.progressBar.style.width = `${(index / QUESTIONS.length) * 100}%`;
    els.questionKicker.textContent = AXES[item.axis].short;
    els.questionText.textContent = item.text;
    els.questionHint.textContent = item.hint;
    els.backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';

    document.querySelectorAll('[data-axis-dot]').forEach((dot, i) => {
      dot.classList.toggle('done', i < axisIndex);
      dot.classList.toggle('current', i === axisIndex);
    });

    els.options.innerHTML = '';
    item.options.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option';
      if (answers[index]?.optionIndex === optionIndex) button.classList.add('selected');
      button.innerHTML = `<span class="key">${String.fromCharCode(65 + optionIndex)}</span><strong>${option.label}</strong>`;
      button.addEventListener('click', () => selectOption(optionIndex, button));
      els.options.appendChild(button);
    });

    els.questionCard.animate?.([
      { opacity: .45, transform: 'translateX(8px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ], { duration: 180, easing: 'ease-out' });
  }

  function selectOption(optionIndex, button) {
    const item = QUESTIONS[index];
    const option = item.options[optionIndex];
    answers[index] = { axis: item.axis, value: option.value, unknown: option.unknown, optionIndex };
    els.options.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
    button.classList.add('selected');
    if (navigator.vibrate) navigator.vibrate(8);

    window.setTimeout(() => {
      if (index < QUESTIONS.length - 1) {
        index += 1;
        renderQuestion();
      } else {
        renderResult();
      }
    }, 150);
  }

  function goBack() {
    if (index <= 0) return;
    index -= 1;
    renderQuestion();
  }

  function calculate() {
    const sums = {};
    SECTION_ORDER.forEach(axis => sums[axis] = { total: 0, count: 0 });
    let unknownCount = 0;
    answers.forEach(a => {
      if (!a) return;
      sums[a.axis].total += a.value;
      sums[a.axis].count += 1;
      if (a.unknown) unknownCount += 1;
    });

    const axisScores = {};
    SECTION_ORDER.forEach(axis => {
      const s = sums[axis];
      axisScores[axis] = s.count ? Math.round((s.total / (s.count * 4)) * 100) : 50;
    });

    const weights = { career: .12, scope: .18, expertise: .18, impact: .24, scarcity: .14, market: .14 };
    const score = Math.round(SECTION_ORDER.reduce((acc, axis) => acc + axisScores[axis] * weights[axis], 0));
    const mid = clamp(220, 2400, round10(545 * Math.exp((score - 50) * .026)));
    const unknownRate = unknownCount / QUESTIONS.length;
    const width = .15 + unknownRate * .28;
    const low = clamp(180, 2200, round10(mid * (1 - width)));
    const high = clamp(240, 3000, round10(mid * (1 + width * 1.12)));
    return { axisScores, score, mid, low, high, unknownCount };
  }

  function renderResult() {
    const result = calculate();
    show(els.resultView);
    els.salaryLow.textContent = result.low.toLocaleString('ja-JP');
    els.salaryHigh.textContent = result.high.toLocaleString('ja-JP');
    els.marketScore.textContent = `${result.score} / 100`;
    els.uncertaintyNote.textContent = result.unknownCount
      ? `「わからない」が${result.unknownCount}件あったため、結果レンジを少し広げています。`
      : '30問すべての回答を使ってレンジ化しました。';

    const ranked = SECTION_ORDER
      .map(axis => ({ axis, score: result.axisScores[axis] }))
      .sort((a, b) => b.score - a.score);

    els.topDrivers.innerHTML = ranked.slice(0, 2).map((item, i) => `
      <article class="driver">
        <span>DRIVER ${String(i + 1).padStart(2, '0')}</span>
        <strong>${AXES[item.axis].label} ${item.score}</strong>
        <p>${driverCopy(item.axis, item.score)}</p>
      </article>
    `).join('');

    const lever = ranked.slice().reverse().find(x => x.axis !== 'career') || ranked[ranked.length - 1];
    els.nextLever.innerHTML = `<b>${AXES[lever.axis].label}</b><p>現在 ${lever.score}/100。${AXES[lever.axis].advice}</p>`;

    els.axisBars.innerHTML = SECTION_ORDER.map(axis => `
      <div class="axis-row">
        <span>${AXES[axis].label}</span>
        <i><b style="width:${result.axisScores[axis]}%"></b></i>
        <strong>${result.axisScores[axis]}</strong>
      </div>
    `).join('');

    if (previousSnapshot) {
      const oldMid = Math.round((previousSnapshot.low + previousSnapshot.high) / 2);
      const newMid = Math.round((result.low + result.high) / 2);
      const delta = newMid - oldMid;
      els.comparisonCard.classList.remove('hidden');
      els.comparisonCard.innerHTML = delta === 0
        ? `前回も <strong>${previousSnapshot.low}〜${previousSnapshot.high}万円</strong>。レンジの中心はほぼ同じです。`
        : `前回 <strong>${previousSnapshot.low}〜${previousSnapshot.high}万円</strong> → 今回 <strong>${result.low}〜${result.high}万円</strong>。レンジ中心は <strong>${delta > 0 ? '+' : ''}${delta}万円</strong>。`;
    } else {
      els.comparisonCard.classList.add('hidden');
    }

    saveResult(result);
    els.shareBtn.dataset.share = `30問でわかる 市場年収診断\n推定レンジ：${result.low}〜${result.high}万円\n市場価値スコア：${result.score}/100\n強み：${AXES[ranked[0].axis].label} / ${AXES[ranked[1].axis].label}\nhttps://levelup.hitobito.jp/apps/nenshu-shindan/`;
  }

  function driverCopy(axis, score) {
    const strength = score >= 80 ? 'かなり強い水準。' : score >= 65 ? '年収を押し上げる強み。' : score >= 50 ? '平均的な土台がある。' : 'まだ伸びしろが大きい。';
    const copy = {
      career: '経験を年数だけでなく、役割の難度と再現性に変えられています。',
      scope: '意思決定、人、予算、顧客など、任される範囲が広いほど報酬に結びつきやすい領域です。',
      expertise: '難しい問題を自走して解き、他人へ再現させられる力を見ています。',
      impact: '売上・利益・改善・継続する仕組みなど、事業へ残した結果を見ています。',
      scarcity: '採用しにくさ、複数スキルの掛け合わせ、代替しにくさを見ています。',
      market: '社外からの声、求人要件との一致、外で価値が伝わるかを見ています。'
    };
    return `${strength}${copy[axis]}`;
  }

  function saveResult(result) {
    const history = loadHistory();
    const snapshot = { low: result.low, high: result.high, score: result.score, at: Date.now() };
    history.unshift(snapshot);
    try { localStorage.setItem('levelup-nenshu-shindan-history-v1', JSON.stringify(history.slice(0, 5))); } catch (_) {}
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem('levelup-nenshu-shindan-history-v1') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }

  async function shareResult() {
    const text = els.shareBtn.dataset.share || '';
    els.shareStatus.textContent = '';
    try {
      if (navigator.share) {
        await navigator.share({ title: '30問でわかる 市場年収診断', text });
        els.shareStatus.textContent = '共有しました。';
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        els.shareStatus.textContent = '結果をコピーしました。';
        return;
      }
      els.shareStatus.textContent = 'この端末では共有機能を使えません。';
    } catch (err) {
      if (err?.name !== 'AbortError') els.shareStatus.textContent = '共有を完了できませんでした。';
    }
  }

  function retry() {
    previousSnapshot = loadHistory()[0] || null;
    index = 0;
    answers = Array(QUESTIONS.length).fill(null);
    start(false);
  }

  function round10(n) { return Math.round(n / 10) * 10; }
  function clamp(min, max, value) { return Math.max(min, Math.min(max, value)); }

  els.startBtn.addEventListener('click', () => start(true));
  els.restartTopBtn.addEventListener('click', () => { previousSnapshot = loadHistory()[0] || null; show(els.introView); renderPrevious(); });
  els.backBtn.addEventListener('click', goBack);
  els.retryBtn.addEventListener('click', retry);
  els.shareBtn.addEventListener('click', shareResult);

  renderPrevious();
})();
