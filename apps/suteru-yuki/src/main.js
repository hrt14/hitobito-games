import { values, rounds, categoryMeta } from './data.js';

const app = document.querySelector('#app');

const freshState = () => ({
  screen: 'intro',
  value: null,
  round: 0,
  selected: new Set(),
  overflow: false,
  overflowEver: 0,
  stats: { money: 5, health: 6, freedom: 6, trust: 5, meaning: 5 },
  wisdom: 0,
  streak: 0,
  bestStreak: 0,
  history: [],
  sound: true,
  lastResult: null
});

let state = freshState();

const icons = {
  money: '¥', health: '+', freedom: '◇', trust: '○', meaning: '✦'
};
const statLabels = { money:'資産', health:'健康', freedom:'余白', trust:'信頼', meaning:'納得' };

function render() {
  if (state.screen === 'intro') renderIntro();
  else if (state.screen === 'values') renderValues();
  else if (state.screen === 'game') renderGame();
  else if (state.screen === 'result') renderRoundResult();
  else if (state.screen === 'ending') renderEnding();
}

function renderIntro() {
  app.innerHTML = `
    <main class="intro page-shell">
      <button class="sound-btn" data-sound aria-label="サウンド切替">${state.sound ? '♪' : '×'}</button>
      <section class="hero-paper" aria-labelledby="title">
        <div class="eyebrow">DECISION GAME / TWO OF FIVE</div>
        <div class="tear-mark" aria-hidden="true"></div>
        <h1 id="title">捨てる勇気</h1>
        <p class="hero-lead">毎ターン、案件は5つ。<br><strong>選べるのは2つまで。</strong></p>
        <div class="mini-cards" aria-hidden="true">
          <span></span><span></span><span class="cut"></span><span class="cut"></span><span class="cut"></span>
        </div>
        <p class="hero-copy">良さそうな話ほど、あなたの時間を奪うかもしれない。<br>最後に人生を決めるのは、やったことより——捨てたこと。</p>
        <button class="primary big" data-start>人生を始める <span>→</span></button>
      </section>
      <p class="footnote">1プレイ 約5分 · スマホ推奨</p>
    </main>`;
  bindCommon();
  $('[data-start]').addEventListener('click', () => { tone('start'); state.screen = 'values'; render(); });
}

function renderValues() {
  app.innerHTML = `
    <main class="page-shell values-page">
      <button class="back-ghost" data-back>←</button>
      <div class="eyebrow">BEFORE YOU CHOOSE</div>
      <h2>何を守る人生にする？</h2>
      <p class="section-lead">優先順位は、基準がなければ決められない。<br>今のあなたに一番近いものを1つ。</p>
      <div class="value-grid">
        ${values.map(v => `
          <button class="value-card" data-value="${v.id}">
            <span class="value-glyph">${v.glyph}</span>
            <strong>${v.label}</strong>
            <small>${v.copy}</small>
          </button>`).join('')}
      </div>
      <p class="small-note">途中で変えられません。正解はありません。</p>
    </main>`;
  $('[data-back]').addEventListener('click', () => { state.screen='intro'; render(); });
  $$('[data-value]').forEach(btn => btn.addEventListener('click', () => {
    state.value = btn.dataset.value;
    state.screen = 'game';
    tone('choose');
    render();
  }));
}

function renderGame() {
  const round = rounds[state.round];
  const chosenCount = state.selected.size;
  const capacity = state.overflow ? 5 : 2;
  const canDecide = chosenCount > 0;
  const value = values.find(v => v.id === state.value);

  app.innerHTML = `
    <main class="game-shell stage-${state.round}">
      <header class="game-header">
        <div class="life-meta">
          <span class="age">${round.age}<small>歳</small></span>
          <div><div class="round-label">${state.round + 1} / ${rounds.length}</div><strong>${round.title}</strong></div>
        </div>
        <button class="sound-btn in-game" data-sound aria-label="サウンド切替">${state.sound ? '♪' : '×'}</button>
      </header>

      <section class="life-line" aria-label="人生の進行">
        ${rounds.map((r,i) => `<span class="life-dot ${i < state.round ? 'done' : ''} ${i === state.round ? 'now' : ''}"></span>`).join('')}
      </section>

      <section class="north-star">
        <span>${value.glyph}</span>
        <div><small>あなたの基準</small><strong>${value.label}</strong></div>
        <p>${round.subtitle}</p>
      </section>

      <section class="capacity-bar ${state.overflow ? 'danger' : ''}">
        <div>
          <small>${state.overflow ? '容量オーバー中' : '今期の処理枠'}</small>
          <strong><b>${chosenCount}</b> / ${state.overflow ? '∞' : '2'}件</strong>
        </div>
        <div class="slots" aria-hidden="true">
          ${Array.from({length: Math.max(2, chosenCount)}, (_,i) => `<i class="${i < chosenCount ? 'filled' : ''} ${i >= 2 ? 'over' : ''}"></i>`).join('')}
        </div>
      </section>

      <section class="cards" aria-label="届いた案件">
        ${round.cases.map((item, index) => caseCard(item,index)).join('')}
      </section>

      <section class="decision-dock">
        <div class="decision-summary">
          <strong>${chosenCount === 0 ? 'やる案件を選ぶ' : `${chosenCount}件やる / ${5-chosenCount}件捨てる`}</strong>
          <span>${chosenCount < 2 && !state.overflow ? 'タップで選択' : state.overflow ? '抱えるほど負荷が増える' : 'これ以上やるなら、余白を前借りする'}</span>
        </div>
        <button class="primary decide" data-decide ${canDecide ? '' : 'disabled'}>この選択で進む</button>
        ${chosenCount >= 2 && !state.overflow ? `<button class="overload-link" data-overflow>まだ抱える <span>「全部やる」</span></button>` : ''}
      </section>

      <aside class="stats-strip" aria-label="現在の状態">
        ${Object.entries(state.stats).map(([k,v]) => statChip(k,v)).join('')}
      </aside>
    </main>`;

  bindCommon();
  $$('[data-case]').forEach(btn => btn.addEventListener('click', () => toggleCase(btn.dataset.case)));
  $('[data-decide]').addEventListener('click', commitRound);
  const overload = $('[data-overflow]');
  if (overload) overload.addEventListener('click', enableOverflow);
}

function caseCard(item, index) {
  const selected = state.selected.has(item.id);
  const meta = categoryMeta[item.category] || {label:'案件',icon:'·'};
  return `
    <button class="case-card ${selected ? 'selected' : ''}" data-case="${item.id}" style="--delay:${index * 45}ms">
      <div class="case-top">
        <span class="case-index">0${index+1}</span>
        <span class="category"><b>${meta.icon}</b>${meta.label}</span>
        <span class="choice-stamp">${selected ? 'やる' : ''}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
      <div class="signals">${item.signals.map(s => `<span>${s}</span>`).join('')}</div>
      <div class="tap-cue">${selected ? '選択中 · もう一度で戻す' : 'タップして「やる」'}</div>
    </button>`;
}

function toggleCase(id) {
  if (state.selected.has(id)) {
    state.selected.delete(id);
    tone('soft');
    render();
    return;
  }
  if (!state.overflow && state.selected.size >= 2) {
    pulseDock();
    tone('warn');
    return;
  }
  state.selected.add(id);
  tone(state.selected.size > 2 ? 'warn' : 'choose');
  render();
}

function enableOverflow() {
  state.overflow = true;
  tone('warn');
  render();
  requestAnimationFrame(() => {
    const bar = $('.capacity-bar');
    if (bar) bar.classList.add('shake');
  });
}

function commitRound() {
  if (!state.selected.size) return;
  const round = rounds[state.round];
  const selectedItems = round.cases.filter(c => state.selected.has(c.id));
  const rejectedItems = round.cases.filter(c => !state.selected.has(c.id));
  const before = {...state.stats};
  let wisdomDelta = 0;

  selectedItems.forEach(item => {
    applyEffects(item.take);
    wisdomDelta += item.takeWisdom + alignmentBonus(item, true);
  });
  rejectedItems.forEach(item => {
    applyEffects(item.reject);
    wisdomDelta += item.rejectWisdom + alignmentBonus(item, false);
  });

  const extras = Math.max(0, selectedItems.length - 2);
  let overloadPenalty = null;
  if (extras > 0) {
    overloadPenalty = { health: -extras * 2, freedom: -extras * 2, meaning: -extras };
    applyEffects(overloadPenalty);
    wisdomDelta -= extras * 4;
    state.overflowEver += extras;
    state.streak = 0;
  } else {
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
  }

  state.wisdom += wisdomDelta;
  const after = {...state.stats};
  const result = { round: state.round, selectedItems, rejectedItems, before, after, wisdomDelta, overloadPenalty, extras };
  state.history.push(result);
  state.lastResult = result;
  state.screen = 'result';
  state.selected = new Set();
  state.overflow = false;
  tone(extras ? 'drop' : 'resolve');
  render();
}

function renderRoundResult() {
  const result = state.lastResult;
  const round = rounds[result.round];
  const strongestReject = [...result.rejectedItems].sort((a,b)=>b.rejectWisdom-a.rejectWisdom)[0];
  const riskiestTake = [...result.selectedItems].sort((a,b)=>a.takeWisdom-b.takeWisdom)[0];
  const statChanges = Object.keys(state.stats).map(k => ({k, d: result.after[k]-result.before[k]})).filter(x=>x.d!==0);
  const insight = result.extras
    ? `処理枠を${result.extras}件超えた。成果は増えたが、余白と健康を前借りした。`
    : strongestReject && strongestReject.rejectWisdom > 1
      ? `「${strongestReject.title}」を捨てた判断が、今期いちばん大きかった。`
      : riskiestTake && riskiestTake.takeWisdom < 0
        ? `「${riskiestTake.title}」は魅力的だったが、長期コストも残った。`
        : '2つに絞ったことで、選んだ案件に集中できた。';

  app.innerHTML = `
    <main class="result-page page-shell stage-${result.round}">
      <div class="result-kicker">${round.age}歳 · ${round.title}</div>
      <h2>${result.extras ? '抱えすぎた。' : `${result.rejectedItems.length}つ、捨てた。`}</h2>
      <p class="result-insight">${insight}</p>

      <section class="result-columns">
        <div class="result-col kept">
          <h3><span>→</span> やった</h3>
          ${result.selectedItems.map(x => `<article><strong>${x.title}</strong><p>${x.lesson}</p></article>`).join('')}
        </div>
        <div class="result-col discarded">
          <h3><span>×</span> 捨てた</h3>
          ${result.rejectedItems.map(x => `<article><strong>${x.title}</strong></article>`).join('')}
        </div>
      </section>

      ${result.extras ? `<div class="overload-result"><strong>容量オーバー × ${result.extras}</strong><span>健康 ${-result.extras*2} / 余白 ${-result.extras*2}</span></div>` : ''}

      <section class="delta-row">
        ${statChanges.length ? statChanges.map(x => `<span class="delta ${x.d>0?'up':'down'}">${icons[x.k]} ${statLabels[x.k]} ${x.d>0?'+':''}${x.d}</span>`).join('') : '<span class="delta">変化なし</span>'}
      </section>

      <section class="discard-ribbon">
        <small>これまでに捨てたもの</small>
        <div>${state.history.flatMap(h=>h.rejectedItems).slice(-12).map(x=>`<span>${x.title}</span>`).join('')}</div>
      </section>

      <button class="primary big" data-next>${state.round === rounds.length-1 ? '人生を振り返る' : '次の時代へ'} <span>→</span></button>
    </main>`;

  $('[data-next]').addEventListener('click', () => {
    tone('start');
    if (state.round === rounds.length - 1) {
      state.screen='ending';
    } else {
      state.round += 1;
      state.screen='game';
    }
    render();
  });
}

function renderEnding() {
  const value = values.find(v=>v.id===state.value);
  const rejected = state.history.flatMap(h=>h.rejectedItems);
  const selected = state.history.flatMap(h=>h.selectedItems);
  const rejectedCategories = tally(rejected.map(x=>x.category));
  const topReject = Object.entries(rejectedCategories).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const topMeta = categoryMeta[topReject] || {label:'案件',icon:'×'};
  const life = endingCopy();
  const score = Math.max(0, Math.min(100, Math.round(54 + state.wisdom * 1.7 - state.overflowEver * 2)));
  const courage = Math.max(0, Math.min(100, 65 + rejected.filter(x=>x.rejectWisdom >= 3).length*5 - state.overflowEver*8));
  const focus = Math.max(0, Math.min(100, 60 + state.bestStreak*5 - state.overflowEver*10));

  app.innerHTML = `
    <main class="ending-page page-shell">
      <div class="eyebrow">YOUR LIFE, DEFINED BY NO</div>
      <div class="ending-symbol">${value.glyph}</div>
      <h1>${life.title}</h1>
      <p class="ending-lead">${life.body}</p>

      <section class="ending-score">
        <div class="big-score"><strong>${score}</strong><span>/100</span><small>選択の納得度</small></div>
        <div class="meter-list">
          ${meter('捨てる勇気', courage)}
          ${meter('集中を守る力', focus)}
          ${meter(`${value.label}を守った度`, valueScore(value.id))}
        </div>
      </section>

      <section class="life-finding">
        <small>あなたが一番捨てたもの</small>
        <div class="finding-main"><span>${topMeta.icon}</span><strong>${topMeta.label}</strong></div>
        <p>${rejectInterpretation(topReject)}</p>
      </section>

      <section class="final-stats">
        ${Object.entries(state.stats).map(([k,v]) => `<div><span>${icons[k]}</span><strong>${clamp(v)}</strong><small>${statLabels[k]}</small></div>`).join('')}
      </section>

      <section class="final-quote">
        <p>人生の輪郭は、<br><strong>引き受けなかったもの</strong>でもできている。</p>
      </section>

      <button class="primary big" data-replay>別の人生を選ぶ <span>↻</span></button>
      <button class="text-btn" data-review>全40案件の選択を見る</button>

      <dialog class="review-dialog" data-dialog>
        <div class="dialog-head"><div><small>DECISION ARCHIVE</small><h2>選んだもの / 捨てたもの</h2></div><button data-close>×</button></div>
        <div class="archive">
          ${state.history.map((h,i)=>`
            <section><h3>${rounds[i].age}歳 · ${rounds[i].title}</h3>
              ${rounds[i].cases.map(x=>`<div class="archive-row ${h.selectedItems.some(s=>s.id===x.id)?'yes':'no'}"><span>${h.selectedItems.some(s=>s.id===x.id)?'やる':'捨てる'}</span><strong>${x.title}</strong></div>`).join('')}
            </section>`).join('')}
        </div>
      </dialog>
    </main>`;

  $('[data-replay]').addEventListener('click', ()=>{ state=freshState(); state.screen='values'; render(); });
  const dialog=$('[data-dialog]');
  $('[data-review]').addEventListener('click', ()=>dialog.showModal());
  $('[data-close]').addEventListener('click', ()=>dialog.close());
}

function alignmentBonus(item, take) {
  const map = {
    freedom:['freedom'],
    growth:['growth'],
    people:['people'],
    craft:['craft']
  };
  const aligned = map[state.value]?.includes(item.category);
  if (!aligned) return 0;
  return take ? 1 : -1;
}

function valueScore(value) {
  const related = {freedom:['freedom'],growth:['growth'],people:['people'],craft:['craft']}[value];
  const takenAligned = state.history.flatMap(h=>h.selectedItems).filter(x=>related.includes(x.category)).length;
  const rejectedAligned = state.history.flatMap(h=>h.rejectedItems).filter(x=>related.includes(x.category)).length;
  return Math.max(0, Math.min(100, 55 + takenAligned*8 - rejectedAligned*5 - state.overflowEver*4));
}

function endingCopy() {
  if (state.overflowEver >= 5 || state.stats.health <= 1 || state.stats.freedom <= 0) {
    return { title:'全部を背負った人', body:'多くを手に入れた。その代わり、「選ぶ」ことを後回しにした。最後に不足したのは能力ではなく、余白だった。' };
  }
  if (state.stats.freedom >= 9 && state.stats.meaning >= 8) {
    return { title:'余白を残した人', body:'大きな話をいくつも断った。でも空いた場所には、自分で選んだ仕事と時間が残った。' };
  }
  if (state.stats.meaning >= 10) {
    return { title:'自分の仕事を残した人', body:'最も儲かる道ではなく、納得できるものを選び続けた。捨てた案件が、作品の輪郭を作った。' };
  }
  if (state.stats.trust >= 10) {
    return { title:'人を残した人', body:'成果だけではなく、誰と時間を使うかを選んだ。最後に残ったのは予定表ではなく、関係だった。' };
  }
  if (state.stats.money >= 11) {
    return { title:'機会を掴み続けた人', body:'価値ある機会を数多くものにした。だからこそ、次に問われるのは「もう十分」と言える基準だ。' };
  }
  return { title:'選び直し続けた人', body:'正解は一度も固定されなかった。それでも毎回、何を残し、何を捨てるかを自分で決めた。' };
}

function rejectInterpretation(category) {
  const copy = {
    status:'他人からどう見えるかより、自分の基準を優先した。',
    obligation:'「頼まれたから」を理由にしない選択が増えた。',
    money:'最大の報酬より、別の価値を選ぶ場面が多かった。',
    freedom:'余白そのものを捨ててでも、やることを選んだ。',
    growth:'挑戦をすべて拾わず、伸びる方向を限定した。',
    people:'人との時間より、別の優先順位を取る場面が多かった。',
    craft:'作りたいものを何度か見送り、他の価値を選んだ。',
    health:'健康の用事を後回しにする場面が多かった。'
  };
  return copy[category] || '捨てたものに、あなたの基準が表れている。';
}

function meter(label,value){
  return `<div class="meter"><div><span>${label}</span><b>${value}</b></div><i><em style="width:${value}%"></em></i></div>`;
}

function applyEffects(effects) {
  Object.entries(effects).forEach(([k,v]) => {
    if (state.stats[k] != null) state.stats[k] = clamp(state.stats[k] + v);
  });
}
function clamp(v){ return Math.max(0, Math.min(12, v)); }
function tally(arr){ return arr.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{}); }
function statChip(k,v){ return `<div class="stat-chip ${v<=2?'low':''}"><span>${icons[k]}</span><b>${clamp(v)}</b><small>${statLabels[k]}</small></div>`; }
function pulseDock(){ const dock=$('.decision-dock'); if(!dock)return; dock.classList.remove('pulse'); void dock.offsetWidth; dock.classList.add('pulse'); }
function $(q){ return document.querySelector(q); }
function $$(q){ return [...document.querySelectorAll(q)]; }
function bindCommon(){ const b=$('[data-sound]'); if(b)b.addEventListener('click',()=>{state.sound=!state.sound; render();}); }

let audioCtx;
function tone(kind='soft') {
  if (!state.sound) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const conf = {
      start:[330,0.08,'sine'], choose:[520,0.05,'triangle'], soft:[300,0.04,'sine'], warn:[150,0.12,'sawtooth'], resolve:[620,0.12,'triangle'], drop:[110,0.18,'sawtooth']
    }[kind] || [300,0.05,'sine'];
    o.type=conf[2]; o.frequency.setValueAtTime(conf[0],now); if(kind==='resolve') o.frequency.exponentialRampToValueAtTime(820,now+conf[1]);
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.035,now+0.01); g.gain.exponentialRampToValueAtTime(0.0001,now+conf[1]);
    o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now+conf[1]+0.02);
  } catch {}
}

render();
