(() => {
  const DATA = window.SEIKAN_DATA;
  const shell = document.getElementById('shell');
  const soundBtn = document.getElementById('soundBtn');
  const learnBtn = document.getElementById('learnBtn');
  const toast = document.getElementById('toast');
  const STORE_KEY = 'levelup_seikan_switch_v1';
  const state = {
    view:'home', sound:true, round:0, set:[], answers:[], startedAt:0, answered:false,
    stats: loadStats()
  };

  function loadStats(){
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return {
        sessions:Number(raw.sessions)||0,
        answers:Number(raw.answers)||0,
        correct:Number(raw.correct)||0,
        real:Number(raw.real)||0,
        lens:raw.lens && typeof raw.lens==='object' ? raw.lens : {}
      };
    } catch { return {sessions:0,answers:0,correct:0,real:0,lens:{}}; }
  }
  function save(){ try{ localStorage.setItem(STORE_KEY,JSON.stringify(state.stats)); }catch{} }
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function shuffle(a){ const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }
  function beep(kind='ok'){
    if(!state.sound) return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext; const ctx=new Ctx();
      const o=ctx.createOscillator(), g=ctx.createGain(); o.connect(g); g.connect(ctx.destination);
      const now=ctx.currentTime; o.type='sine'; o.frequency.setValueAtTime(kind==='ok'?620:220,now); if(kind==='ok')o.frequency.linearRampToValueAtTime(780,now+.09);
      g.gain.setValueAtTime(.035,now); g.gain.exponentialRampToValueAtTime(.001,now+.14); o.start(now);o.stop(now+.15);
    }catch{}
  }
  function flash(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>toast.classList.remove('show'),1300)}
  function scrollTop(){window.scrollTo({top:0,behavior:'instant'});}
  function lensChips(){return Object.values(DATA.lenses).map(x=>`<div class="lens-chip"><b>${esc(x.icon)}</b><span>${esc(x.short)}</span></div>`).join('')}

  function home(){
    state.view='home';
    const acc=state.stats.answers?Math.round(state.stats.correct/state.stats.answers*100):0;
    shell.innerHTML=`
      <section class="hero">
        <div class="eyebrow">KOBAYASHI SEIKAN / REFLEX TRAINING</div>
        <h1>正観<em>スイッチ</em></h1>
        <p class="lead">出来事は選べなくても、<b>次の見方は選べる。</b><br>日常の場面を見て、小林正観の著作に見られる考え方へ切り替える練習。</p>
        <p class="sublead">正解暗記ではなく「イラッ → 気づく → 切り替える」を反復します。急がせません。反応時間は測りますが、自動で次へ進みません。</p>
        <button class="primary" id="startBtn">60秒トレーニング</button>
        <button class="secondary" id="realBtn">今、起きた → 現実モード</button>
        <div class="helper">5問 / 入力なし / 途中で時間切れなし</div>
        <div class="lenses">${lensChips()}</div>
        <div class="stats-row">
          <div class="stat"><strong>${state.stats.sessions}</strong><span>SESSIONS</span></div>
          <div class="stat"><strong>${state.stats.answers}</strong><span>JUDGMENTS</span></div>
          <div class="stat"><strong>${acc}%</strong><span>SWITCH RATE</span></div>
        </div>
      </section>`;
    document.getElementById('startBtn').onclick=startSession;
    document.getElementById('realBtn').onclick=realtimeMenu;
    scrollTop();
  }

  function buildSet(){
    const byLens={}; Object.keys(DATA.lenses).forEach(k=>byLens[k]=shuffle(DATA.scenarios.filter(q=>q.l===k)));
    return shuffle(Object.keys(DATA.lenses)).map(k=>byLens[k][0]).slice(0,5);
  }
  function startSession(){state.set=buildSet();state.round=0;state.answers=[];renderQuestion();}
  function renderQuestion(){
    state.view='training'; state.answered=false; state.startedAt=performance.now();
    const q=state.set[state.round], lens=DATA.lenses[q.l];
    shell.innerHTML=`
      <div class="session-head"><div><b>SWITCH ${state.round+1} / ${state.set.length}</b><div class="timer" id="timer">0.0 sec</div></div><div class="round-dots">${state.set.map((_,i)=>`<i class="${i<state.round?'done':i===state.round?'now':''}"></i>`).join('')}</div></div>
      <section class="scenario">
        <span class="scene-tag">${esc(lens.short)}の場面</span>
        <h2>${esc(q.scene)}</h2>
        <p>感情を消すのではなく、次に何を足すかを選ぶ。</p>
      </section>
      <div class="prompt">${esc(q.prompt)}</div>
      <div class="choices">${q.choices.map((c,i)=>`<button class="choice" data-i="${i}"><span class="key">${String.fromCharCode(65+i)}</span><b>${esc(c)}</b></button>`).join('')}</div>
      <div id="feedback"></div>`;
    shell.querySelectorAll('.choice').forEach(btn=>btn.onclick=()=>answer(Number(btn.dataset.i)));
    const timer=document.getElementById('timer');
    const tick=()=>{if(state.answered||state.view!=='training')return;timer.textContent=((performance.now()-state.startedAt)/1000).toFixed(1)+' sec';requestAnimationFrame(tick)}; requestAnimationFrame(tick);
    scrollTop();
  }
  function answer(i){
    if(state.answered)return; state.answered=true;
    const q=state.set[state.round], lens=DATA.lenses[q.l], correct=i===q.answer, ms=Math.round(performance.now()-state.startedAt);
    state.answers.push({lens:q.l,correct,ms}); state.stats.answers++; if(correct)state.stats.correct++;
    state.stats.lens[q.l]=state.stats.lens[q.l]||{n:0,c:0};state.stats.lens[q.l].n++;if(correct)state.stats.lens[q.l].c++;save();beep(correct?'ok':'ng');
    shell.querySelectorAll('.choice').forEach((btn,idx)=>{btn.disabled=true;if(idx===q.answer)btn.classList.add('correct');else if(idx===i&&!correct)btn.classList.add('wrong')});
    const f=document.getElementById('feedback');
    f.innerHTML=`<section class="feedback ${correct?'good':''}"><div class="feedback-top"><span class="mark">${correct?'SWITCH OK':'もう一回ならこっち'}</span><span class="speed">${(ms/1000).toFixed(1)} sec</span></div><h3>${esc(lens.title)}</h3><p>${esc(q.explain)}</p><span class="source-lens">型：${esc(lens.short)}</span><button class="next-btn" id="nextBtn">${state.round===state.set.length-1?'結果を見る':'次へ'}</button><div class="note">時間切れはありません。読んでから進めます。</div></section>`;
    document.getElementById('nextBtn').onclick=()=>{state.round++; if(state.round>=state.set.length)result();else renderQuestion()};
    setTimeout(()=>f.scrollIntoView({behavior:'smooth',block:'nearest'}),80);
  }
  function result(){
    state.view='result';state.stats.sessions++;save();
    const correct=state.answers.filter(a=>a.correct).length; const avg=state.answers.length?state.answers.reduce((s,a)=>s+a.ms,0)/state.answers.length:0;
    const rows=Object.keys(DATA.lenses).map(k=>{const a=state.answers.filter(x=>x.lens===k);const pct=a.length?Math.round(a.filter(x=>x.correct).length/a.length*100):0;return `<div class="type-row"><b>${esc(DATA.lenses[k].short)}</b><div class="bar"><i style="width:${pct}%"></i></div><span>${pct}%</span></div>`}).join('');
    const weakest=[...state.answers].sort((a,b)=>(a.correct===b.correct?a.ms-b.ms:(a.correct?1:-1)))[0];
    const focus=weakest?DATA.lenses[weakest.lens]:null;
    shell.innerHTML=`<section class="result-hero"><div class="eyebrow">SESSION COMPLETE</div><div class="big">${correct}/5</div><h1>今日のスイッチ完了。</h1><p>${focus?`次は「${esc(focus.short)}」を現実で一回使うと、ゲームが日常につながります。`:'5つの型を一周しました。'}</p></section>
      <div class="result-grid"><div class="result-card"><strong>${(avg/1000).toFixed(1)}s</strong><span>平均判断時間</span></div><div class="result-card"><strong>${state.stats.sessions}</strong><span>累計セッション</span></div></div>
      <div class="type-list">${rows}</div>
      <button class="primary" id="againBtn">もう5問</button><button class="secondary" id="toRealBtn">現実で使う</button><button class="secondary" id="homeBtn">トップへ</button>`;
    document.getElementById('againBtn').onclick=startSession;document.getElementById('toRealBtn').onclick=realtimeMenu;document.getElementById('homeBtn').onclick=home;scrollTop();
  }

  function realtimeMenu(){
    state.view='realmenu';
    shell.innerHTML=`<section class="mode-title"><div class="eyebrow">REAL WORLD MODE</div><h1>今、何が起きた？</h1><p>説明を読むより、いまの出来事に一つ使う。近いものを選んでください。</p></section><div class="real-grid">${DATA.realtime.map(x=>`<button class="real-card" data-id="${esc(x.id)}"><b>${esc(x.icon)}　${esc(x.title)}</b><span>${esc(x.desc)}</span></button>`).join('')}</div><button class="secondary" id="backBtn">戻る</button>`;
    shell.querySelectorAll('.real-card').forEach(b=>b.onclick=()=>renderRealtime(b.dataset.id));document.getElementById('backBtn').onclick=home;scrollTop();
  }
  function renderRealtime(id){
    const x=DATA.realtime.find(v=>v.id===id); if(!x)return realtimeMenu(); const lens=DATA.lenses[x.lens];
    state.view='real';
    shell.innerHTML=`<section class="mode-title"><div class="eyebrow">${esc(lens.short)} / 10–30 SEC</div><h1>${esc(x.title)}</h1><p>考え方を理解するより、一回使う。</p></section><section class="action-card"><div class="icon">${esc(x.icon)}</div><h2>${esc(x.headline)}</h2><div class="steps">${x.steps.map((s,i)=>`<div class="step"><i>${i+1}</i><span>${esc(s)}</span></div>`).join('')}</div>${x.link?`<a class="link-card" href="${esc(x.link.href)}"><b>${esc(x.link.label)}</b><span>専用トレーニング →</span></a>`:''}<button class="primary" id="doneBtn">今、一回やった</button></section><button class="secondary" id="otherBtn">別の出来事</button>`;
    document.getElementById('doneBtn').onclick=()=>{state.stats.real++;save();beep('ok');flash('現実で1回。これが本番。');setTimeout(home,550)};document.getElementById('otherBtn').onclick=realtimeMenu;scrollTop();
  }

  function learn(){
    state.view='learn';
    const cards=Object.entries(DATA.lenses).map(([k,x],i)=>`<article class="learn-card"><header><div class="num">0${i+1}</div><h2>${esc(x.title)}</h2></header><p>${esc(x.description)}</p>${k==='gokai'?'<small>五戒：不平不満・愚痴・泣き言・悪口・文句</small>':k==='sowaka'?'<small>そ＝掃除 / わ＝笑い / か＝感謝</small>':''}</article>`).join('');
    shell.innerHTML=`<section class="mode-title"><div class="eyebrow">5 LENSES</div><h1>5つの型</h1><p>ここは暗記ページではありません。迷ったときに型を確認するための短い索引です。</p></section><div class="learn-list">${cards}</div><div class="source-box"><strong>出典の扱い</strong><br>このアプリは、小林正観の著作・公式管理サイトで紹介されている考え方を、LEVEL UP向けの練習問題へ再構成したものです。科学的・医学的効果を主張するものではありません。危険、健康、法令、契約、強要が関わる場面では、受容や頼まれごとより安全と適切な相談を優先してください。<br><a href="https://www.skp358.com/" target="_blank" rel="noopener noreferrer">SKP公式サイト ↗</a></div><button class="secondary" id="learnBack">戻る</button>`;
    document.getElementById('learnBack').onclick=home;scrollTop();
  }

  soundBtn.onclick=()=>{state.sound=!state.sound;soundBtn.setAttribute('aria-pressed',String(state.sound));soundBtn.textContent=state.sound?'♪':'×';flash(state.sound?'音 ON':'音 OFF')};
  learnBtn.onclick=learn;
  home();
})();
