(() => {
  'use strict';

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const KEY = 'hitobito.mada-dekinai.v1';
  const initial = { shifts: 0, trainingBest: 0, rounds: 0, challengeChoices: 0, moves: { strategy: 0, feedback: 0, help: 0, practice: 0 } };
  let stats = load();
  let run = null;

  const scenarios = [
    { scene:'会議で準備した説明がうまく伝わらず、質問に詰まった。', thought:'自分は説明が下手だ。向いてない。', yet:'うまく説明できない' },
    { scene:'新しい分析方法を試したが、数字が合わずやり直しになった。', thought:'こういうのが得意な人とは頭の作りが違う。', yet:'この分析方法を使いこなせない' },
    { scene:'企画を出したら、かなり厳しいフィードバックが返ってきた。', thought:'評価が低い。自分には才能がないのかも。', yet:'フィードバックを次の案に生かせない' },
    { scene:'勉強しているのに、同じ種類の問題でまた間違えた。', thought:'何度やってもできない。もう無理だ。', yet:'この種類の問題を安定して解けない' },
    { scene:'初めての仕事で、周りより明らかに時間がかかった。', thought:'遅い自分を見られるくらいなら、難しい仕事は避けたい。', yet:'この仕事を速く進められない' },
    { scene:'プレゼンで他の人の方がずっと上手く見えた。', thought:'あの人にはセンスがある。自分にはない。', yet:'この水準でプレゼンできない' },
    { scene:'新しいツールを触ったが、基本操作で何度もつまずいた。', thought:'こんな簡単なことも分からないなら、自分には無理だ。', yet:'このツールを使いこなせない' },
    { scene:'提案が採用されず、別案になった。', thought:'採用されないなら、考えた時間は全部ムダだった。', yet:'採用される提案にできない' }
  ];

  const fixedThoughts = [
    '向いてない。',
    '才能がない。',
    '失敗を見られたくない。',
    '難しいなら避けたい。',
    '努力しても無駄だ。',
    'できる人とは違う。'
  ];

  const moves = [
    { id:'strategy', icon:'↻', title:'やり方を変える', desc:'同じ努力量を増やす前に、別の方法を1つ試す。' },
    { id:'feedback', icon:'⌁', title:'フィードバックを取る', desc:'「どこを1つ直す？」を具体的に聞く。' },
    { id:'help', icon:'＋', title:'助け・見本を借りる', desc:'できる人の手順・例・考え方を1つ借りる。' },
    { id:'practice', icon:'▰', title:'小さく分けて練習する', desc:'詰まった部分だけ難易度を下げ、反復する。' },
    { id:'effortOnly', icon:'!', title:'同じやり方で倍がんばる', desc:'方法は変えず、とにかく時間と根性を増やす。', bad:true }
  ];

  const triggers = [
    { id:'ability', text:'「向いてない／才能がない」' },
    { id:'hide', text:'「失敗を見られたくない」' },
    { id:'avoid', text:'「難しいなら避けたい」' },
    { id:'futile', text:'「努力しても無駄」' },
    { id:'compare', text:'「できる人とは違う」' },
    { id:'other', text:'その他の能力判定' }
  ];

  function fresh(){ return { ...initial, moves:{...initial.moves} }; }
  function load(){
    try{
      const parsed = JSON.parse(localStorage.getItem(KEY));
      return parsed && typeof parsed === 'object' ? {...initial, ...parsed, moves:{...initial.moves, ...(parsed.moves||{})}} : fresh();
    }catch{return fresh()}
  }
  function save(){ try{localStorage.setItem(KEY, JSON.stringify(stats))}catch{} }
  function escapeHtml(value=''){return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function vibrate(ms=10){try{navigator.vibrate?.(ms)}catch{}}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),1100)}
  function progress(n){return `<div class="progress"><i style="--p:${Math.max(0,Math.min(100,n))}%"></i></div>`}
  function header(p=0, close='home'){
    return `<div class="topbar"><a class="home" href="/" aria-label="LEVEL UPへ戻る">⌂</a><div class="brand">LEVEL UP / <b>NOT YET</b></div><button class="round-btn" type="button" data-nav="${close}" aria-label="閉じる">×</button></div>${p?progress(p):''}`;
  }
  function footer(){return `<div class="footer-note">Carol S. Dweckのgrowth mindset研究を参考にした非公式トレーニングです。能力を無限と断定するものではなく、現在の結果を最終判定にしない練習を目的にしています。<br><button class="source-btn" type="button" data-nav="sources">考え方・出典</button></div>`}
  function show(html,p=0,close='home'){
    app.innerHTML=header(p,close)+`<section class="screen">${html}</section>`;
    window.scrollTo({top:0,behavior:'instant'});
    bindBase();
  }
  function bindBase(){
    app.querySelectorAll('[data-nav]').forEach(el=>el.addEventListener('click',()=>({home,trainingStart,realStart,sources,resetStats}[el.dataset.nav]||home)()));
    app.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>handleAction(el.dataset.action)));
  }
  function handleAction(action){
    if(action==='train') return trainingStart();
    if(action==='real') return realStart();
    if(action==='shift') return forceShift();
    if(action==='erase') return resetStats();
    if(action==='backHome') return home();
  }

  function home(){
    run=null;
    const moveTotal=Object.values(stats.moves).reduce((a,b)=>a+b,0);
    show(`<div class="eyebrow">GROWTH MINDSET — 反射トレーニング</div>
      <h1 class="hero">まだ、<br><em>できない。</em></h1>
      <p class="lead">失敗した瞬間に「自分には能力がない」で終わらせない。<b>現在地 → 次の学習行動</b>へ切り替える反射をつくる。</p>
      <div class="hero-rule"><span class="rule-pill">能力判定</span><span class="rule-arrow">→</span><span class="rule-pill">まだ</span><span class="rule-arrow">→</span><span class="rule-pill">次の実験</span></div>
      <button class="mode primary" type="button" data-action="train"><span class="mode-kicker">60 SEC / TRAINING</span><strong>失敗を「まだ」に通す</strong><p>カードを上へ。戦略・フィードバック・助け・練習へ切り替える。</p><span class="go">↗</span></button>
      <button class="mode secondary" type="button" data-action="real"><span class="mode-kicker">30 SEC / REAL LIFE</span><strong>いまの「できなかった」を変換</strong><p>今日のつまずきを、次の1回の実験に変える。入力内容は保存しない。</p><span class="go">→</span></button>
      <div class="stats"><div class="stat"><b>${stats.shifts}</b><span>YET SHIFT</span></div><div class="stat"><b>${moveTotal}</b><span>LEARNING MOVE</span></div><div class="stat"><b>${stats.trainingBest}</b><span>BEST / ROUND</span></div></div>${footer()}`);
  }

  function trainingStart(){
    const deck=[...scenarios].sort(()=>Math.random()-.5).slice(0,5);
    run={mode:'train',deck,index:0,score:0,scenario:null,shifted:false,move:null};
    trainingRound();
  }
  function trainingRound(){
    if(!run || run.mode!=='train') return trainingStart();
    if(run.index>=run.deck.length) return trainingDone();
    run.scenario=run.deck[run.index];run.shifted=false;run.move=null;
    const n=run.index+1;
    show(`<div class="eyebrow">ROUND ${n} / ${run.deck.length}</div><h2 class="section-title">判決にしない。</h2>
      <div class="scenario"><small>起きたこと</small><p>${escapeHtml(run.scenario.scene)}</p></div>
      <div class="yet-stage"><div class="gate">NOT YET GATE</div><article class="thought-card" id="thoughtCard" tabindex="0" role="button" aria-label="上へスワイプして、まだに変換"><small>AUTOMATIC VERDICT</small><strong>「${escapeHtml(run.scenario.thought)}」</strong><span>この一文を、能力の最終判定にしない。</span></article></div>
      <p class="swipe-hint">↑ カードを「まだ」のゲートへスワイプ</p><button class="ghost-btn" type="button" data-action="shift">スワイプが難しいときはタップ</button>`, 10+(run.index/run.deck.length)*80, 'home');
    bindSwipe();
  }

  function bindSwipe(){
    const card=document.getElementById('thoughtCard'); if(!card)return;
    let startY=0,dy=0,active=false;
    const reset=()=>{card.style.transition='transform .18s ease';card.style.transform='translateY(54px)';setTimeout(()=>card.style.transition='',190)};
    card.addEventListener('pointerdown',e=>{active=true;startY=e.clientY;dy=0;card.setPointerCapture?.(e.pointerId)});
    card.addEventListener('pointermove',e=>{if(!active)return;dy=Math.min(30,e.clientY-startY);card.style.transform=`translateY(${54+dy}px) rotate(${dy/18}deg)`});
    card.addEventListener('pointerup',()=>{if(!active)return;active=false;if(dy<-72)doShift();else reset()});
    card.addEventListener('pointercancel',()=>{active=false;reset()});
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();doShift()}});
  }
  function forceShift(){doShift()}
  function doShift(){
    if(!run || run.shifted)return; run.shifted=true; stats.shifts++;save();vibrate(18);
    const card=document.getElementById('thoughtCard'); if(card){card.style.transition='transform .3s cubic-bezier(.2,.9,.2,1),opacity .3s';card.style.transform='translateY(-160px) scale(.9)';card.style.opacity='.1'}
    setTimeout(()=>moveScreen(),260);
  }
  function moveScreen(){
    const yetText=run.mode==='train'?run.scenario.yet:'今回のことを、うまくできない';
    show(`<div class="eyebrow">VERDICT → CURRENT STATE</div><h2 class="section-title">「まだ」を足す。</h2>
      <article class="thought-card shifted" style="position:relative;transform:none;width:100%;min-height:170px;margin:12px 0 8px"><small>NOT YET</small><strong>「<em>まだ</em>、${escapeHtml(yetText)}。」</strong><span>「今できない」は、次に何を学ぶかを決めるための情報に変えられる。</span></article>
      <p class="section-copy">次は根性ではなく、<b>新しい情報が増える一手</b>を選ぶ。</p><div class="choice-list">${moves.map(m=>`<button type="button" class="choice ${m.bad?'bad':''}" data-move="${m.id}"><span class="choice-icon">${m.icon}</span><span><b>${m.title}</b><span>${m.desc}</span></span></button>`).join('')}</div><div id="feedbackSlot"></div>`, run.mode==='train'?45+(run.index/run.deck.length)*45:70, 'home');
    app.querySelectorAll('[data-move]').forEach(btn=>btn.addEventListener('click',()=>chooseMove(btn.dataset.move,btn)));
  }
  function chooseMove(id,btn){
    const move=moves.find(m=>m.id===id); if(!move)return;
    const slot=document.getElementById('feedbackSlot');
    app.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
    if(move.bad){
      slot.innerHTML=`<div class="feedback warn"><b>努力だけ、では足りない。</b><p>成長マインドセットは「とにかく頑張る」ことではない。うまくいっていないなら、戦略・フィードバック・助け・練習方法のどれかを動かそう。</p></div>`;vibrate(8);return;
    }
    run.move=move;stats.moves[id]=(stats.moves[id]||0)+1;stats.rounds++;save();vibrate(16);
    slot.innerHTML=`<div class="feedback"><b>学習モードへ切り替わった。</b><p>「できる人間か」を証明するより、次の試行で新しい情報を1つ増やす。</p></div><button class="primary-btn blue" type="button" id="moveNext">${run.mode==='train'?'次のROUNDへ':'この一手で終える'} →</button>`;
    document.getElementById('moveNext').addEventListener('click',()=>{
      if(run.mode==='train'){run.score++;run.index++;trainingRound()}else realDone();
    });
  }
  function trainingDone(){
    stats.trainingBest=Math.max(stats.trainingBest,run.score);save();
    const top=Object.entries(stats.moves).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const topMove=moves.find(m=>m.id===top)?.title||'まだこれから';
    show(`<div class="done-orbit">YET</div><h2 class="done-title">5回、判決を<br>学習に変えた。</h2><p class="done-copy">しなやかさは「いつも前向き」になることではなく、固定的な反応に気づいたあと、もう一度学習できる形へ戻す練習。</p><div class="result-card"><small>TODAY</small><b>${run.score} / ${run.deck.length} SHIFT</b><p>あなたがよく選んでいる学習行動：${escapeHtml(topMove)}</p></div><button class="primary-btn" type="button" data-action="train">もう5回やる</button><button class="ghost-btn" type="button" data-action="backHome">ホームへ</button>${footer()}`,100,'home');
  }

  function realStart(){
    run={mode:'real',text:'',trigger:null,thoughtIndex:0,move:null,shifted:false};
    show(`<div class="eyebrow">REAL LIFE / STEP 1</div><h2 class="section-title">何が、できなかった？</h2><p class="section-copy">評価ではなく出来事だけを短く。ここに書いた文章は保存しない。</p><textarea class="textarea" id="realText" maxlength="80" placeholder="例：会議で質問にうまく答えられなかった"></textarea><div class="counter"><span id="count">0</span> / 80</div><button class="primary-btn" id="realNext" type="button" disabled>次へ →</button>`,20,'home');
    const ta=document.getElementById('realText'),next=document.getElementById('realNext'),count=document.getElementById('count');
    ta.addEventListener('input',()=>{count.textContent=ta.value.length;next.disabled=!ta.value.trim()});
    next.addEventListener('click',()=>{run.text=ta.value.trim();realTrigger()});
    ta.focus();
  }
  function realTrigger(){
    show(`<div class="eyebrow">REAL LIFE / STEP 2</div><h2 class="section-title">頭が足した「判決」は？</h2><p class="section-copy">一番近いものを1つだけ。これは事実ではなく、いま出た反応として扱う。</p><div class="trigger-grid">${triggers.map((t,i)=>`<button type="button" class="trigger" data-trigger="${i}">${t.text}</button>`).join('')}</div><button class="primary-btn" id="triggerNext" type="button" disabled>「まだ」に通す →</button>`,45,'home');
    const next=document.getElementById('triggerNext');
    app.querySelectorAll('[data-trigger]').forEach(btn=>btn.addEventListener('click',()=>{app.querySelectorAll('[data-trigger]').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');run.thoughtIndex=Number(btn.dataset.trigger);run.trigger=triggers[run.thoughtIndex];next.disabled=false}));
    next.addEventListener('click',realShiftScreen);
  }
  function realShiftScreen(){
    const thought=fixedThoughts[run.thoughtIndex]||'いまの結果で、自分の能力を決めたくなる。';
    show(`<div class="eyebrow">REAL LIFE / STEP 3</div><div class="scenario"><small>できなかったこと</small><p>${escapeHtml(run.text)}</p></div><div class="yet-stage"><div class="gate">NOT YET GATE</div><article class="thought-card" id="thoughtCard" tabindex="0" role="button"><small>AUTOMATIC VERDICT</small><strong>「${escapeHtml(thought)}」</strong><span>上へスワイプして、最終判定を保留する。</span></article></div><p class="swipe-hint">↑ 「できない」から「まだ」へ</p><button class="ghost-btn" type="button" data-action="shift">タップで通す</button>`,60,'home');
    bindSwipe();
  }
  function realDone(){
    const move=run.move||moves[0];
    stats.challengeChoices++;save();
    show(`<div class="done-orbit">→</div><h2 class="done-title">次は、<br>証明ではなく実験。</h2><p class="done-copy">うまくいく保証を作る必要はない。次の1回で、学習材料を1つ増やせばいい。</p><div class="result-card"><small>NEXT EXPERIMENT</small><b>${escapeHtml(move.title)}</b><p>${escapeHtml(move.desc)}</p></div><div class="result-card"><small>REFRAME</small><b>「まだ、できない。次の1回で確かめる。」</b><p>入力した出来事は保存していません。</p></div><button class="primary-btn" type="button" data-action="backHome">終える</button>${footer()}`,100,'home');
  }

  function sources(){
    show(`<div class="eyebrow">ABOUT / SOURCES</div><h2 class="section-title">このアプリが<br>練習していること。</h2><p class="section-copy">「努力すれば何でもできる」と教えるアプリではない。現在の結果を能力の最終判定にせず、失敗・難題・フィードバックを次の学習行動へつなぐ練習に絞っている。</p>
      <div class="source-card"><b>Stanford Center for Teaching and Learning — Growth Mindset</b><p>失敗を学習機会として捉え直すこと、フィードバックを使うこと、難題に取り組み続けることなどを説明。</p><a href="https://ctl.stanford.edu/students/growth-mindset" target="_blank" rel="noopener noreferrer">公式ページを開く ↗</a></div>
      <div class="source-card"><b>Stanford Teaching Commons — Growth Mindset and Enhanced Learning</b><p>growth mindsetを単なる「努力の称賛」に縮めないこと、誰にでもfixed/growthの両方の反応がありうることを説明。</p><a href="https://teachingcommons.stanford.edu/teaching-guides/foundations-course-design/learning-activities/growth-mindset-and-enhanced-learning" target="_blank" rel="noopener noreferrer">公式ページを開く ↗</a></div>
      <button class="ghost-btn" type="button" data-nav="home">戻る</button><button class="source-btn" style="margin:14px auto 0" type="button" data-action="erase">この端末の練習記録を消す</button>`,0,'home');
  }
  function resetStats(){
    try{localStorage.removeItem(KEY)}catch{}stats=fresh();toast('練習記録を消しました');setTimeout(home,500);
  }

  home();
})();
