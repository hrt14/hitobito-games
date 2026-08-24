(() => {
  'use strict';

  const STORAGE_KEY = 'levelup-100oku-connection-v1';

  const encounters = [
    {
      id: 'factory', tag: '展示会の片づけ',
      title: '隣で箱を運んでいた人と、少し話した。',
      copy: '名刺交換するほどでもない雑談。いまの仕事とは直接関係なさそうだ。',
      surface: '見えている情報：地方の小さな製造会社で働いているらしい。',
      thread: 'お礼を一言送り、連絡先だけ残した。',
      deep: '製造の困りごとを20分聞き、翌週オンラインで話す約束をした。'
    },
    {
      id: 'designer', tag: '昔の取引先からのDM',
      title: '若手デザイナーが、近況を聞いてきた。',
      copy: '急ぎの案件ではない。返信しなくても、今日の売上は1円も変わらない。',
      surface: '見えている情報：以前、一度だけバナーを作ってもらった人。',
      thread: '短く近況を返し、「また何かあれば」と糸を残した。',
      deep: '最近面白い表現を聞き、30分だけアイデアを交換した。'
    },
    {
      id: 'customer', tag: '返品フォーム',
      title: '返品したお客さんが、長い理由を書いている。',
      copy: '返金処理だけなら30秒。文章まで読む義務はない。',
      surface: '見えている情報：「惜しい。毎月届くなら欲しい」と書かれている。',
      thread: '理由を保存し、同じ声が出たら見返せるようにした。',
      deep: '本人に10分だけ聞き、何が惜しかったかを具体化した。'
    },
    {
      id: 'buyer', tag: '飛行機の遅延',
      title: '隣の席の人と、待ち時間に雑談になった。',
      copy: '肩書きは聞いていない。天気と仕事の話を少ししただけ。',
      surface: '見えている情報：出張が多く、店をよく見て回る人らしい。',
      thread: '別れ際に名前だけ交換し、短いお礼を送った。',
      deep: '最近売場で何が売れにくいかを聞き、連絡先を交換した。'
    },
    {
      id: 'engineer', tag: '知人の紹介',
      title: '副業エンジニアが、小さな自動化を見せてきた。',
      copy: '完成度は低い。いま発注するほどのものでもない。',
      surface: '見えている情報：在庫の集計を自分用に自動化している。',
      thread: 'デモURLを保存し、必要になったら連絡できるようにした。',
      deep: '実データを少し見せ、「1週間で何ができる？」まで聞いた。'
    },
    {
      id: 'overseas', tag: '通訳として同席',
      title: '本題ではない人が、帰り際に海外の話をした。',
      copy: '会議では通訳役。あなたの商談相手ではない。',
      surface: '見えている情報：東南アジアの小売事情に妙に詳しい。',
      thread: 'おすすめ市場を一つ聞き、連絡先を残した。',
      deep: '現地で売れそうな価格帯を聞き、サンプルを送る約束をした。'
    }
  ];

  const choiceConfig = {
    0: { label: '切る', cost: 0, action: 'ここで終える', why: '注意は使わない。その代わり、この接点から未来へ戻る道も消える。' },
    1: { label: '糸を残す', cost: 1, action: '一言返す・連絡先を残す', why: '深追いはしない。でも、未来から戻ってこられる細い道を残す。' },
    2: { label: '深く聞く', cost: 3, action: '20分ほど聞き、次の約束を決める', why: '注意を大きく使う。具体的な情報や共同作業が早く生まれやすい。' }
  };

  const positions = [[78,52],[282,48],[58,164],[302,165],[176,38],[181,184]];
  const screens = Array.from(document.querySelectorAll('.screen'));
  const $ = (id) => document.getElementById(id);

  let deck = [];
  let round = 0;
  let attention = 10;
  let decisions = {};
  let record = loadRecord();

  function loadRecord() {
    try { return { sessions: 0, best: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return { sessions: 0, best: 0 }; }
  }
  function saveRecord() { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); }
  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function showScreen(id) {
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function vibrate(pattern = 20) { if (navigator.vibrate) navigator.vibrate(pattern); }
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1300);
  }
  function renderIntroRecord() { $('bestIntro').textContent = record.sessions ? `BEST ${formatOku(record.best)}億` : '初回'; }

  function startGame() {
    deck = shuffle(encounters);
    round = 0;
    attention = 10;
    decisions = {};
    renderNetwork();
    renderEncounter();
    showScreen('gameScreen');
  }

  function renderNetwork() {
    const nodeLayer = $('nodeLayer');
    const edgeLayer = $('edgeLayer');
    nodeLayer.innerHTML = '';
    edgeLayer.innerHTML = '';
    deck.forEach((encounter, index) => {
      const [x, y] = positions[index];
      const decision = decisions[encounter.id];
      const stateClass = decision === undefined ? '' : decision === 0 ? 'cut' : decision === 1 ? 'kept' : 'deep';
      const edge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      edge.setAttribute('x1', '180'); edge.setAttribute('y1', '110'); edge.setAttribute('x2', String(x)); edge.setAttribute('y2', String(y));
      edge.setAttribute('class', `edge ${stateClass}`); edgeLayer.appendChild(edge);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(x)); circle.setAttribute('cy', String(y)); circle.setAttribute('r', '15'); circle.setAttribute('class', `encounter-node ${stateClass}`); nodeLayer.appendChild(circle);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(x)); text.setAttribute('y', String(y + 3)); text.setAttribute('text-anchor', 'middle'); text.setAttribute('class', 'node-index');
      text.textContent = String(index + 1).padStart(2, '0'); nodeLayer.appendChild(text);
    });
    const kept = Object.values(decisions).filter((v) => v > 0).length;
    const deep = Object.values(decisions).filter((v) => v === 2).length;
    if (!Object.keys(decisions).length) $('futureCaption').textContent = 'まだ、何につながるかは分からない。';
    else if (kept === 0) $('futureCaption').textContent = 'すべての線が、ここで止まっている。';
    else $('futureCaption').textContent = `${kept}本の糸が残った。深い接点は${deep}本。`;
  }

  function renderEncounter() {
    const encounter = deck[round];
    if (!encounter) { showChain(); return; }
    $('roundLabel').textContent = `${round + 1} / ${deck.length}`;
    $('attentionValue').textContent = attention;
    $('encounterTag').textContent = encounter.tag;
    $('encounterIndex').textContent = String(round + 1).padStart(2, '0');
    $('encounterTitle').textContent = encounter.title;
    $('encounterCopy').textContent = encounter.copy;
    $('surfaceDetail').textContent = encounter.surface;
    $('attentionRange').value = attention >= 1 ? '1' : '0';
    updateChoicePreview();
    renderNetwork();
  }

  function updateChoicePreview() {
    const value = Number($('attentionRange').value);
    const config = choiceConfig[value];
    $('choiceLabel').textContent = config.label;
    $('choiceCost').textContent = `注意 ${config.cost}`;
    $('choiceAction').textContent = config.action;
    $('choiceWhy').textContent = config.why;
    $('commitCost').textContent = config.cost ? `−${config.cost}` : '0';
    const notEnough = config.cost > attention;
    $('commitBtn').disabled = notEnough;
    $('commitBtn').querySelector('span').textContent = notEnough ? '注意が足りない' : value === 0 ? 'ここで切る' : 'この距離でつなぐ';
  }

  function commitDecision() {
    const encounter = deck[round];
    const value = Number($('attentionRange').value);
    const config = choiceConfig[value];
    if (config.cost > attention) return;
    attention -= config.cost;
    decisions[encounter.id] = value;
    vibrate(value === 2 ? [20,40,20] : 18);
    renderNetwork();
    $('rippleMark').textContent = value === 0 ? 'THREAD LOST' : value === 1 ? '1 THREAD' : 'DEEP LINK';
    $('rippleHeadline').textContent = value === 0 ? 'この偶然は、ここで終わる。' : 'いまは、何も起きない。';
    $('rippleCopy').textContent = value === 0 ? '今日の時間は守れた。ただし、数か月後にこの人が何者になるかを見る機会もなくなった。' : value === 1 ? encounter.thread : encounter.deep;
    $('rippleRule').textContent = value === 0 ? '切る判断も必要。ただし「今すぐ役立たない＝価値ゼロ」ではない。' : value === 1 ? '全部に深く関わらなくていい。細い糸なら、安く残せる。' : '深掘りは高コスト。だから、全員ではなく一部に使う。';
    showScreen('rippleScreen');
  }

  function nextEncounter() {
    round += 1;
    if (round >= deck.length) showChain();
    else { renderEncounter(); showScreen('gameScreen'); }
  }

  function getStats() {
    const values = Object.values(decisions);
    return { kept: values.filter((v) => v > 0).length, deep: values.filter((v) => v === 2).length };
  }
  function calculateValue() {
    const { kept, deep } = getStats();
    if (kept === 6 && deep >= 2) return 100;
    if (kept === 6 && deep === 1) return 62;
    if (kept >= 5 && deep >= 2) return 43;
    if (kept >= 5) return 18;
    if (kept >= 4) return 7.2;
    if (kept >= 3) return 2.4;
    if (kept >= 2) return 0.9;
    if (kept === 1) return 0.3;
    return 0.1;
  }
  function decisionFor(id) { return decisions[id] ?? 0; }
  function isKept(id) { return decisionFor(id) > 0; }
  function stepHtml(index, title, copy, active) {
    return `<div class="chain-step ${active ? '' : 'broken'}"><i>${String(index).padStart(2, '0')}</i><div><strong>${title}</strong><p>${copy}</p></div></div>`;
  }

  function showChain() {
    const product = isKept('customer') && isKept('factory');
    const brand = product && isKept('designer');
    const retail = brand && isKept('buyer');
    const recurring = product && isKept('engineer');
    const global = brand && isKept('overseas');
    const { kept } = getStats();
    $('chainTimeline').innerHTML = [
      stepHtml(1, product ? '返品の一言と町工場がつながる。' : '需要か製造のどちらかが消えていた。', product ? '「毎月届くなら欲しい」という声を、小ロット試作で確かめられた。' : '商品化の最初の橋が架からず、アイデアはメモのまま終わった。'),
      stepHtml(2, brand ? 'デザイナーが、商品を「選ばれる理由」に変える。' : '商品はできても、伝わり方が弱い。', brand ? '以前の細い接点から相談でき、見た目ではなく体験全体を組み直した。' : '売れる理由をつくる接点がなく、価格競争から抜けにくい。'),
      stepHtml(3, retail ? '飛行機で会った人から、200店舗のテストへ。' : '小売の扉は開かなかった。', retail ? '雑談の相手が後に商品責任者だと判明。小さなテスト販売が全国へ広がる。' : '肩書きが見えない時点で切れた接点は、後から探しても戻らない。'),
      stepHtml(4, recurring ? 'エンジニアが、単発売りを仕組みに変える。' : '伸びるほど、手作業が詰まり始める。', recurring ? '在庫・受注・継続課金がつながり、売上増が作業量増に直結しなくなる。' : '事業が伸びるほど運用負荷が増え、成長の速度が落ちる。'),
      stepHtml(5, global ? '通訳だった人の接点から、海外テストへ。' : '国内で強くても、次の市場へ出る橋がない。', global ? '最初は商談相手ですらなかった人が、東南アジアの流通につないだ。' : '海外の具体的な最初の一歩がなく、国内だけで成長が頭打ちになる。')
    ].join('');
    $('revealResultBtn').querySelector('span').textContent = kept >= 5 ? 'この連鎖の金額を見る' : '残った連鎖を見る';
    showScreen('chainScreen');
  }

  function formatOku(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, ''); }

  function showResult() {
    const value = calculateValue();
    const { kept, deep } = getStats();
    $('finalValue').textContent = formatOku(value);
    $('keptCount').textContent = kept;
    $('deepCount').textContent = deep;
    if (value >= 100) {
      $('resultHeadline').textContent = '100億円は、最初から見えていなかった。';
      $('resultCopy').textContent = '6人を「重要人物」と見抜いたのではない。全員に1の糸を残し、その中の一部だけを深く聞いた。後から接点同士が組み合わさった。';
    } else if (value >= 40) {
      $('resultHeadline').textContent = '大きく育った。でも、一本だけ欠けている。';
      $('resultCopy').textContent = '偶然の連鎖はかなり残った。切った接点のどこかが、後の倍率を下げている。';
    } else if (value >= 7) {
      $('resultHeadline').textContent = '偶然は残った。でも、連鎖が途中で切れた。';
      $('resultCopy').textContent = '一つひとつは小さな接点でも、組み合わせになると価値が跳ねる。次は「0か3」ではなく「1」を増やしてみる。';
    } else {
      $('resultHeadline').textContent = 'いくつかの偶然は、そこで消えた。';
      $('resultCopy').textContent = '未来につながる接点は、会った瞬間には判別できない。注意を守ることと、接点を全部切ることは同じではない。';
    }
    record.sessions += 1;
    record.best = Math.max(record.best || 0, value);
    saveRecord();
    renderIntroRecord(); renderRecord(); showScreen('resultScreen');
  }

  function renderRecord() {
    $('recordSessions').textContent = record.sessions;
    $('recordBest').textContent = record.sessions ? formatOku(record.best) : '—';
  }

  async function shareResult() {
    const value = calculateValue();
    const { kept, deep } = getStats();
    const text = `「目の前の人が100億円」で、6人中${kept}人との糸を残し、${deep}人を深掘り。フィクション上の連鎖は累計利益${formatOku(value)}億円まで育った。\n\n今すぐ役立つかだけで、偶然を切らない。`;
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: '目の前の人が100億円 | LEVEL UP', text, url });
        $('shareStatus').textContent = '共有しました。';
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        $('shareStatus').textContent = '結果をコピーしました。'; toast('コピーしました');
      } else $('shareStatus').textContent = 'この端末では共有機能を使えません。';
    } catch (error) { if (error?.name !== 'AbortError') $('shareStatus').textContent = '共有できませんでした。'; }
  }

  $('startBtn').addEventListener('click', startGame);
  $('recordStartBtn').addEventListener('click', startGame);
  $('attentionRange').addEventListener('input', updateChoicePreview);
  $('commitBtn').addEventListener('click', commitDecision);
  $('nextBtn').addEventListener('click', nextEncounter);
  $('revealResultBtn').addEventListener('click', showResult);
  $('againBtn').addEventListener('click', startGame);
  $('shareBtn').addEventListener('click', shareResult);
  $('recordBtn').addEventListener('click', () => { renderRecord(); showScreen('recordScreen'); });
  $('recordBackBtn').addEventListener('click', () => showScreen('introScreen'));
  $('resultHomeBtn').addEventListener('click', () => showScreen('introScreen'));
  renderIntroRecord(); renderRecord();
})();
