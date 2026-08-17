(() => {
  'use strict';

  const STORAGE_KEY = 'levelup:mou-haratta:v1';
  const DEFAULT_STATE = {
    totalReps: 0,
    sessions: 0,
    realRecall: { yes: 0, late: 0, no: 0 },
    reactionSamples: [],
    sound: true,
    lastPlayedAt: null
  };

  const { incidents: INCIDENTS, realCategories: REAL_CATEGORIES } = window.MOU_HARATTA_DATA;

  const shell = document.getElementById('shell');
  const soundBtn = document.getElementById('soundBtn');
  const confetti = document.getElementById('confetti');
  let state = loadState();
  let audioCtx = null;
  let session = null;
  let nowFlow = null;

  function loadState(){
    try{
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(!raw) return structuredClone(DEFAULT_STATE);
      return {...structuredClone(DEFAULT_STATE), ...raw, realRecall:{...DEFAULT_STATE.realRecall,...(raw.realRecall||{})}, reactionSamples:Array.isArray(raw.reactionSamples)?raw.reactionSamples:[]};
    }catch{return structuredClone(DEFAULT_STATE);}
  }
  function saveState(){
    state.lastPlayedAt = new Date().toISOString();
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch{}
    updateSoundButton();
  }
  function updateSoundButton(){
    soundBtn.textContent = state.sound ? '♪' : '×';
    soundBtn.setAttribute('aria-pressed', state.sound ? 'true':'false');
    soundBtn.setAttribute('aria-label', state.sound ? '音をオフにする':'音をオンにする');
  }
  function avgReaction(){
    const a = state.reactionSamples;
    if(!a.length) return null;
    return a.reduce((x,y)=>x+y,0)/a.length;
  }
  function mastery(){
    if(state.totalReps < 10) return 1;
    if(state.totalReps < 35) return 2;
    if(state.totalReps < 80) return 3;
    return 4;
  }
  function modeName(level){
    return ['','見て覚える','選ばず思い出す','高速反射','現実転移'][level] || '反射';
  }
  function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function vibrate(pattern){if('vibrate' in navigator) navigator.vibrate(pattern);}
  function ensureAudio(){
    if(!state.sound) return null;
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(freq,duration=0.08,type='sine',gain=.055,delay=0){
    const ctx=ensureAudio(); if(!ctx) return;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.frequency.value=freq; g.gain.value=0;
    o.connect(g);g.connect(ctx.destination);
    const t=ctx.currentTime+delay;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.start(t);o.stop(t+duration+.02);
  }
  function paySound(){tone(115,.08,'square',.04);tone(73,.11,'sine',.055,.02);setTimeout(()=>{tone(440,.09,'sine',.04);tone(660,.12,'sine',.035,.07)},95)}
  function clickSound(){tone(260,.05,'sine',.025)}

  soundBtn.addEventListener('click',()=>{state.sound=!state.sound;saveState();if(state.sound) clickSound();});

  function titleScreen(){
    session=null;nowFlow=null;
    const avg=avgReaction();
    const recallTotal=state.realRecall.yes+state.realRecall.late;
    shell.innerHTML=`
      <section class="screen title-screen">
        <div class="brand-chip"><i></i> REFLEX TRAINING</div>
        <div class="logo-wrap"><h1 class="logo">もう払った<span class="paid-dot">済</span></h1></div>
        <p class="lead">嫌なことが起きたら、<strong>「代償先払い。」</strong><br>考え込む前に思い出す反射を、30秒でつくる。</p>
        <div class="action-stack">
          <button class="primary" id="startBtn" type="button">30秒だけ練習</button>
          <button class="secondary" id="nowBtn" type="button">今、起きた</button>
          <button class="ghost" id="aboutBtn" type="button">考え方を見る</button>
        </div>
        <div class="quick-stats" aria-label="これまでの記録">
          <div class="stat"><strong>${state.totalReps}</strong><span>累計反射</span></div>
          <div class="stat"><strong>${avg ? (avg/1000).toFixed(1)+'秒' : '—'}</strong><span>平均反応</span></div>
          <div class="stat"><strong>${recallTotal}</strong><span>現実で想起</span></div>
        </div>
        <p class="micro">記録は減りません。毎日やる必要もありません。現実で自然に思い出せたら、それがクリアです。</p>
      </section>`;
    document.getElementById('startBtn').onclick=()=>startTraining('auto');
    document.getElementById('nowBtn').onclick=showNowCategories;
    document.getElementById('aboutBtn').onclick=infoScreen;
  }

  function startTraining(kind='auto'){
    clickSound();
    const level = kind==='recall' ? Math.max(2,mastery()) : mastery();
    session={
      level,
      questions:shuffle(INCIDENTS).slice(0,5),
      index:0,
      startAt:performance.now(),
      roundStartAt:0,
      reactions:[],
      paid:false,
      revealed:false,
      recallMark:null
    };
    renderRound();
  }

  function renderRound(){
    const q=session.questions[session.index];
    session.paid=false;session.revealed=false;session.roundStartAt=performance.now();
    const level=session.level;
    const recallMode=level>=2;
    const hint = level===1 ? 'まずは合言葉と動きを結びつける。' : level===2 ? '文字を見る前に、頭の中で答える。' : 'できるだけ早く、頭の中で言う。';
    shell.innerHTML=`
      <section class="screen training-screen">
        <div class="training-head"><div class="mode-label">${modeName(level)}</div><div class="progress">${session.index+1} / 5</div></div>
        <div class="progress-track"><div class="progress-fill" style="width:${((session.index+1)/5)*100}%"></div></div>
        <div class="scene">
          <article class="incident-card" id="incidentCard">
            <div><div class="incident-category">${escapeHtml(q[0])}</div><div class="incident-text">${escapeHtml(q[1])}</div></div>
            <div class="recall-hint">${hint}</div>
            <div class="stamp" id="stamp">PAID<small>支払い済み</small></div>
          </article>
          <div class="pay-zone">
            <button class="pay-button ${recallMode?'recall':''}" id="payBtn" type="button">
              ${recallMode ? '<span>こういうとき何だっけ？</span><span class="small">頭の中で答えてからタップ</span>' : '代償先払い<span class="small">これで処理済みにする</span>'}
            </button>
            <div class="flash-message" id="flash">いいことの代償、先に払った。じゃあ次。</div>
            <button class="skip" id="quitBtn" type="button">今日はここまで</button>
          </div>
        </div>
      </section>`;
    document.getElementById('payBtn').onclick=payCurrent;
    document.getElementById('quitBtn').onclick=titleScreen;
  }

  function payCurrent(){
    if(session.paid) return nextRound();
    const btn=document.getElementById('payBtn');
    const stamp=document.getElementById('stamp');
    const card=document.getElementById('incidentCard');
    const flash=document.getElementById('flash');
    const reaction=Math.max(100,performance.now()-session.roundStartAt);
    session.reactions.push(reaction);
    state.totalReps += 1;
    state.reactionSamples=[...state.reactionSamples,reaction].slice(-60);
    saveState();
    session.paid=true;
    if(session.level>=2){btn.classList.add('revealed');session.revealed=true;}
    card.classList.add('paid');stamp.classList.add('show');flash.classList.add('show');
    btn.innerHTML='支払い済み<span class="small">タップして次へ</span>';
    btn.classList.remove('recall');
    paySound();vibrate([18,28,38]);burst();
    setTimeout(()=>{if(session && session.paid) nextRound();},860);
  }

  function nextRound(){
    if(!session) return;
    if(session.index>=4) return finishSession();
    session.index++;
    renderRound();
  }

  function finishSession(){
    const reactions=session.reactions.filter(Number.isFinite);
    const sessionAvg=reactions.length?reactions.reduce((a,b)=>a+b,0)/reactions.length:null;
    state.sessions+=1;
    saveState();
    const beforeLevel=session.level;
    const afterLevel=mastery();
    shell.innerHTML=`
      <section class="screen result-screen">
        <div class="result-kicker">SESSION COMPLETE</div>
        <h2 class="result-title">今日も5回、<br>先払い。</h2>
        <p class="result-copy">嫌なことが起きた瞬間に思い出せれば、それでOK。速さより、現実で出てくることがゴール。</p>
        <div class="result-grid">
          <div class="result-card"><strong>${sessionAvg?(sessionAvg/1000).toFixed(1)+'秒':'—'}</strong><span>今回の平均反応</span></div>
          <div class="result-card"><strong>${state.totalReps}</strong><span>累計反射</span></div>
        </div>
        ${afterLevel>beforeLevel?`<div class="transfer"><p>反射レベルが上がりました。次回は答えの文字を減らして、自力で思い出す練習になります。</p></div>`:''}
        <div class="transfer"><p>今日、現実で「代償先払い」を思い出せた？</p>
          <div class="transfer-buttons">
            <button data-recall="yes">思い出せた</button>
            <button data-recall="late">あとで思い出した</button>
            <button data-recall="no">まだ</button>
          </div>
        </div>
        <div class="action-stack">
          <button class="primary" id="doneBtn" type="button">終了</button>
          <button class="ghost" id="againBtn" type="button">もう5問</button>
        </div>
      </section>`;
    document.querySelectorAll('[data-recall]').forEach(b=>b.onclick=()=>markRecall(b));
    document.getElementById('doneBtn').onclick=titleScreen;
    document.getElementById('againBtn').onclick=()=>startTraining('auto');
  }

  function markRecall(btn){
    const key=btn.dataset.recall;
    const previous=session?.recallMark || null;
    if(previous===key) return;
    if(previous) state.realRecall[previous]=Math.max(0,(state.realRecall[previous]||0)-1);
    state.realRecall[key]=(state.realRecall[key]||0)+1;
    if(session) session.recallMark=key;
    document.querySelectorAll('[data-recall]').forEach(x=>x.classList.toggle('selected',x===btn));
    saveState();
    clickSound();
  }

  function showNowCategories(){
    clickSound();nowFlow=null;
    shell.innerHTML=`
      <section class="screen now-screen">
        <div class="mode-label">RIGHT NOW</div>
        <h2 class="now-title">今、起きた。</h2>
        <p class="now-sub">詳しく書かなくていい。近いものを1つだけ選ぶ。</p>
        <div class="categories">${REAL_CATEGORIES.map((x,i)=>`<button class="category-btn" data-cat="${i}" type="button">${x[0]}<span>${x[1]}</span></button>`).join('')}</div>
        <button class="skip" id="backBtn" type="button">戻る</button>
      </section>`;
    document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>startNow(Number(b.dataset.cat)));
    document.getElementById('backBtn').onclick=titleScreen;
  }

  function startNow(index){
    clickSound();nowFlow={category:REAL_CATEGORIES[index][0],step:0};renderNowStep();
  }
  function renderNowStep(){
    const steps=[
      {k:'まず事実',big:'嫌だった。',note:'無理に「よかったこと」にしなくていい。嫌だったことは、そのまま認める。',button:'次へ'},
      {k:'意味を切り替える',big:'でも、もう払った。',note:'いいことの代償を、先に払ったことにする。',button:'支払い済みにする'},
      {k:'処理済み',big:'PAID',note:'支払い済み。必要な現実対応だけして、この出来事の続きを頭の中で払い続けない。',button:'じゃあ次。'}
    ];
    const s=steps[nowFlow.step];
    shell.innerHTML=`
      <section class="screen now-screen">
        <div class="now-process">
          <article class="now-card" id="nowCard">
            <div class="now-step">${escapeHtml(nowFlow.category)} · ${s.k}</div>
            <h2 class="now-big">${s.big}</h2>
            <p class="now-note">${s.note}</p>
            ${nowFlow.step===2?'<div class="stamp show" style="top:28%;font-size:39px">PAID<small>支払い済み</small></div>':''}
          </article>
          <button class="${nowFlow.step===1?'secondary':'primary'} now-next" id="nowNext" type="button">${s.button}</button>
          <button class="skip" id="nowBack" type="button">やめる</button>
        </div>
      </section>`;
    document.getElementById('nowNext').onclick=()=>{
      if(nowFlow.step===1){paySound();vibrate([18,28,38]);burst();state.totalReps+=1;state.realRecall.yes+=1;saveState();}
      if(nowFlow.step>=2){return titleScreen();}
      nowFlow.step++;renderNowStep();
    };
    document.getElementById('nowBack').onclick=titleScreen;
  }

  function infoScreen(){
    clickSound();
    shell.innerHTML=`
      <section class="screen info-screen">
        <div class="mode-label">ABOUT</div>
        <h2 class="info-title">代償先払い</h2>
        <div class="info-box"><h3>このアプリでやること</h3><p>嫌な出来事が起きたとき、「いいことの代償を先に払った」と意味づけして、長く引きずる前に次へ進む合言葉を反復します。</p></div>
        <div class="info-box"><h3>嫌だったことは消さない</h3><p>嫌な出来事を「嫌ではなかった」と言い換えるアプリではありません。まず嫌だったことを認め、そのあとで「もう払った」と区切ります。</p></div>
        <div class="info-box"><h3>現実で思い出せたらクリア</h3><p>アプリの点数や連続日数は目的ではありません。アプリを開かなくても「代償先払い」と自然に思い出せることがゴールです。</p></div>
        <div class="danger-note"><strong>大切なこと</strong><p>事故・犯罪・健康・安全・深刻な人間関係など、現実の対応が必要な問題を「代償先払い」で放置しないでください。これは必要な対処の代わりではなく、気持ちを切り替えるための合言葉です。</p></div>
        <button class="primary" id="infoStart" type="button">30秒だけ練習</button>
        <button class="skip" id="infoBack" type="button">戻る</button>
      </section>`;
    document.getElementById('infoStart').onclick=()=>startTraining('auto');
    document.getElementById('infoBack').onclick=titleScreen;
  }

  function burst(){
    const cx=window.innerWidth/2,cy=window.innerHeight*.58;
    const colors=['#c43b2f','#181512','#245c48','#b6873e'];
    for(let i=0;i<14;i++){
      const p=document.createElement('i');
      const a=(Math.PI*2*i/14)+(Math.random()-.5)*.3;
      const d=46+Math.random()*78;
      p.style.left=cx+'px';p.style.top=cy+'px';p.style.background=colors[i%colors.length];
      p.style.setProperty('--x',Math.cos(a)*d+'px');p.style.setProperty('--y',Math.sin(a)*d+'px');
      confetti.appendChild(p);setTimeout(()=>p.remove(),720);
    }
  }
  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') titleScreen();
    if((e.key==='Enter'||e.key===' ') && session && !session.paid){e.preventDefault();payCurrent();}
  });
  updateSoundButton();
  titleScreen();
})();
