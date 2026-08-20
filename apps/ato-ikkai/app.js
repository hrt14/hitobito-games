(()=>{
  const app=document.querySelector('#app');
  const STORAGE='levelup_ato_ikkai_v1';
  const ROUNDS=12;

  const questions=[
    {icon:'📚',thought:'「この勉強法、意味ない気がする」',context:'まだ2日目。成果を測れるほど続けていない。',answer:'go',why:'まだ材料不足。評価より、まず量を足す。'},
    {icon:'🏃',thought:'「今日は走らなくていい。効率悪いし」',context:'少し面倒なだけで、痛みも体調不良もない。',answer:'go',why:'「効率」は後付けかもしれない。まず1回。'},
    {icon:'🎹',thought:'「基礎練より曲を弾く方が質が高い」',context:'基礎練が退屈で、ここ3日ずっと飛ばしている。',answer:'go',why:'嫌いだから避けていないかを先に疑う。'},
    {icon:'💻',thought:'「この反復、もう意味ない」',context:'20回やった結果、同じミスだけが増えている。原因も特定できた。',answer:'stop',why:'量を増やすより、方法を変える材料がある。'},
    {icon:'🏋️',thought:'「あと10回やれば強くなる」',context:'鋭い痛みが出ていて、フォームも崩れている。',answer:'stop',why:'安全を無視するのは「量」ではない。止める。'},
    {icon:'✍️',thought:'「下手な文章を何本書いても無駄」',context:'まだ3本。人に見せてもいない。',answer:'go',why:'上手くなる前に必要な試行回数が足りない。'},
    {icon:'📞',thought:'「営業電話は時代遅れだから意味ない」',context:'苦手で怖くて、今日はまだ1件もしていない。',answer:'go',why:'“古い”が、避けるための理屈になっていないか。'},
    {icon:'🎯',thought:'「もっと数を打てば当たる」',context:'100件送って返信0。対象顧客が明らかにズレている。',answer:'stop',why:'失敗データが十分ある。量ではなく狙いを変える。'},
    {icon:'🗣️',thought:'「英会話は質の高い教材だけで十分」',context:'教材選びに2週間使い、声に出したのは10分だけ。',answer:'go',why:'教材選びが練習の代わりになっている。'},
    {icon:'🧪',thought:'「この実験はもう切る」',context:'仮説が否定され、再現も3回取れた。',answer:'stop',why:'検証が済んだ。続けるより次の仮説へ。'},
    {icon:'🎨',thought:'「もっと良いアイデアが出てから作る」',context:'考えているだけで、試作品はまだ0個。',answer:'go',why:'質を考える材料を作るためにも、まず1個。'},
    {icon:'😮‍💨',thought:'「今日は集中できないからやっても無駄」',context:'始める前からそう決めている。5分ならできる。',answer:'go',why:'“できない予測”より、5分の実績を作る。'},
    {icon:'📊',thought:'「数字が悪いけど、量で押し切る」',context:'同じ施策を200回繰り返し、悪化傾向が一貫している。',answer:'stop',why:'量を続ける理由がない。方法を変える。'},
    {icon:'🥋',thought:'「型稽古は実戦じゃないから意味ない」',context:'型が苦手で、基本動作がまだ安定していない。',answer:'go',why:'嫌いな基礎を“実戦的でない”と片付けていないか。'},
    {icon:'🧠',thought:'「暗記は意味ない。理解が大事」',context:'理解したつもりだが、何も見ずに説明できない。',answer:'go',why:'理解と反復は対立しない。思い出す回数を増やす。'},
    {icon:'🛌',thought:'「根性であと3時間やる」',context:'睡眠不足で判断ミスが連発している。明日も続けられる。',answer:'stop',why:'継続可能性を壊す量は、目的から外れている。'}
  ];

  const realOptions=['仕事を1件だけ進める','練習を1回だけ追加','勉強を5分だけやる','連絡を1件だけ送る'];
  let saved=load();
  let state={screen:'home',round:0,score:0,correct:0,streak:0,maxStreak:0,deck:[],dragX:0,dragStart:0,realChoice:'',realDone:false};

  function load(){
    try{return {...{sessions:0,totalExtra:0,best:0,last:''},...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch{return {sessions:0,totalExtra:0,best:0,last:''}}
  }
  function persist(){localStorage.setItem(STORAGE,JSON.stringify(saved))}
  function shell(body,meta=''){return `<section class="shell"><header class="top"><div class="brand"><span class="mark">+1</span>あと1回。</div><div class="muted">${meta}</div></header>${body}</section>`}
  function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
  function home(){
    state.screen='home';
    app.innerHTML=shell(`<section class="hero">
      <div class="hero-kicker">QUANTITY BEFORE EXCUSE</div>
      <h1>あと<br>1回。</h1>
      <p>「意味ない」「効率悪い」「質が大事」。<br>その理屈は本物か、<strong>ただやりたくないだけか。</strong></p>
      <div class="rule">
        <div><b>→</b><span>材料不足・面倒・怖いだけ<br><strong>あと1回やる</strong></span></div>
        <div><b>←</b><span>危険・失敗データ・目的不一致<br><strong>やり方を変える</strong></span></div>
      </div>
      <button class="btn primary" data-action="start">12問で鍛える</button>
      <p class="muted small">累計「あと1回」 ${saved.totalExtra} 回</p>
    </section>`,`TOTAL +${saved.totalExtra}`)
  }
  function start(){
    state={screen:'game',round:0,score:0,correct:0,streak:0,maxStreak:0,deck:shuffle(questions).slice(0,ROUNDS),dragX:0,dragStart:0,realChoice:'',realDone:false};
    renderCard();
  }
  function renderCard(){
    if(state.round>=ROUNDS)return realIntro();
    state.screen='game';
    const q=state.deck[state.round];
    const pct=Math.round((state.round/ROUNDS)*100);
    app.innerHTML=shell(`<div class="hud"><div class="track"><div class="fill" style="width:${pct}%"></div></div><div class="score"><b>${state.round+1}</b> / ${ROUNDS}</div></div>
      <section class="arena" data-arena>
        <div class="shadow-card"></div>
        <article class="card" data-card>
          <div class="badge">その理屈、本物？</div>
          <div class="icon">${q.icon}</div>
          <div class="thought">${q.thought}</div>
          <div class="context">${q.context}</div>
          <div class="hint">
            <div class="stop"><b>← 変える</b>根拠がある</div>
            <div class="go"><b>あと1回 →</b>逃げかも</div>
          </div>
        </article>
      </section>`,`STREAK ${state.streak}`);
  }
  function answer(choice){
    if(state.screen!=='game')return;
    state.screen='locked';
    const q=state.deck[state.round];
    const ok=choice===q.answer;
    if(ok){state.correct++;state.streak++;state.maxStreak=Math.max(state.maxStreak,state.streak);state.score+=100+state.streak*10}
    else{state.streak=0;state.score+=25}
    toast(ok?`✓ ${q.why}`:`違う。${q.why}`,ok?'good':'bad');
    const card=document.querySelector('[data-card]');
    if(card)card.classList.add(choice==='go'?'fly-right':'fly-left');
    setTimeout(()=>{state.round++;renderCard()},520);
  }
  function toast(text,type){const el=document.createElement('div');el.className=`feedback ${type}`;el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),760)}
  function realIntro(){
    state.screen='real';
    app.innerHTML=shell(`<section class="real">
      <div class="one">+1</div>
      <h2>ゲームで終わらせない。</h2>
      <p>今、現実で「質を考える前に量を1つ足す」対象を選ぶ。大きくやらなくていい。<strong>1回だけ。</strong></p>
      <div class="real-options">${realOptions.map((x,i)=>`<button class="real-option" data-real="${i}">${x}</button>`).join('')}</div>
      <input class="custom" data-custom maxlength="40" placeholder="または自分で入力（例：腕立てを1回）">
      <button class="btn primary" data-action="commit">これを、あと1回やる</button>
      <button class="btn ghost" style="margin-top:8px" data-action="skip">今日はゲームだけで終了</button>
    </section>`,'REAL +1');
  }
  function commitReal(){
    const custom=document.querySelector('[data-custom]')?.value.trim();
    if(custom)state.realChoice=custom;
    if(!state.realChoice){toast('1つ選んでください','bad');return}
    state.screen='countdown';
    let n=3;
    app.innerHTML=shell(`<section class="real"><div class="muted">${escapeHtml(state.realChoice)}</div><div class="countdown" data-count>${n}</div><h2>考えず、始める。</h2><p>完璧にやる必要はない。1回だけ追加する。</p><button class="btn ghost" data-action="done">もうやった</button></section>`,'NOW');
    const t=setInterval(()=>{n--;const el=document.querySelector('[data-count]');if(!el){clearInterval(t);return}if(n>0)el.textContent=n;else{clearInterval(t);el.textContent='GO';navigator.vibrate?.(30)}},700);
  }
  function doneReal(){
    if(state.realDone)return;
    state.realDone=true;saved.totalExtra++;saved.last=new Date().toISOString();persist();
    result(true);
  }
  function result(real){
    state.screen='result';
    saved.sessions++;saved.best=Math.max(saved.best,state.correct);persist();
    const rate=Math.round(state.correct/ROUNDS*100);
    const grade=rate>=92?'S':rate>=75?'A':rate>=58?'B':'C';
    app.innerHTML=shell(`<section class="result">
      <div class="grade">${grade}</div>
      <h2>${real?'1回、積んだ。':'見抜く筋肉を鍛えた。'}</h2>
      <p>${real?`「${escapeHtml(state.realChoice)}」を、考える前に1回追加した。`:'次はゲームの外で「あと1回」を1つ足してみる。'}</p>
      <div class="stats">
        <div class="stat"><strong>${state.correct}/${ROUNDS}</strong><span>見抜いた</span></div>
        <div class="stat"><strong>${state.maxStreak}</strong><span>MAX STREAK</span></div>
        <div class="stat"><strong>${saved.totalExtra}</strong><span>現実 +1 累計</span></div>
      </div>
      <div class="quote"><small>今日の反射</small><b>「意味ある？」の前に、<br>「ただ、やりたくないだけでは？」</b></div>
      <div class="actions"><button class="btn primary" data-action="again">もう12問</button><button class="btn ghost" data-action="home">ホームへ</button></div>
    </section>`,`SCORE ${state.score}`)
  }
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

  app.addEventListener('click',e=>{
    const a=e.target.closest('[data-action]')?.dataset.action;
    const real=e.target.closest('[data-real]');
    if(real){document.querySelectorAll('.real-option').forEach(x=>x.classList.remove('selected'));real.classList.add('selected');state.realChoice=realOptions[Number(real.dataset.real)];return}
    if(a==='start'||a==='again')start();
    if(a==='home')home();
    if(a==='commit')commitReal();
    if(a==='done')doneReal();
    if(a==='skip')result(false);
  });

  app.addEventListener('pointerdown',e=>{
    const card=e.target.closest('[data-card]');
    if(!card||state.screen!=='game')return;
    state.dragStart=e.clientX;state.dragX=0;card.setPointerCapture?.(e.pointerId);card.classList.add('grab');
  });
  app.addEventListener('pointermove',e=>{
    const card=document.querySelector('[data-card]');
    if(!card||!state.dragStart||state.screen!=='game')return;
    state.dragX=e.clientX-state.dragStart;const rot=state.dragX/18;card.style.transform=`translateX(${state.dragX}px) rotate(${rot}deg)`;
  });
  app.addEventListener('pointerup',()=>{
    const card=document.querySelector('[data-card]');
    if(!card||!state.dragStart||state.screen!=='game')return;
    const dx=state.dragX;state.dragStart=0;state.dragX=0;card.classList.remove('grab');
    if(Math.abs(dx)>72)return answer(dx>0?'go':'stop');
    card.style.transform='';
  });
  app.addEventListener('pointercancel',()=>{state.dragStart=0;state.dragX=0;const c=document.querySelector('[data-card]');if(c)c.style.transform=''});

  home();
})();
