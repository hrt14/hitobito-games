(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const screens = ['startScreen','trainingScreen','cutScreen','realScreen','afterScreen','resultScreen'];
  const state = { before:7, after:7, index:0, correct:0, answers:[], startedAt:0, cardStartedAt:0, cutIndex:0, source:'', sound:true, locked:false };
  const items = [
    {scene:'スポーツを見て', text:'この選手は今日、大きな結果を出した。', type:'observe', note:'その人についての観察。あなたの評価ではない。'},
    {scene:'スポーツを見て', text:'それに比べて、自分は何も成し遂げていない。', type:'score', note:'「それに比べて」から自分の採点が始まっている。'},
    {scene:'ゲームを遊んで', text:'この作品には、作った人たちがいる。', type:'observe', note:'作品の背景についての観察。ここで終われる。'},
    {scene:'ゲームを遊んで', text:'自分ももっと何かを作っていないとダメだ。', type:'score', note:'作品から自分への「〜すべき」を追加している。'},
    {scene:'仕事の記事を見て', text:'この人は長い時間をかけて、この仕事を続けてきた。', type:'observe', note:'他人の経歴についての情報。'},
    {scene:'仕事の記事を見て', text:'自分はこの年齢なのに遅れている。', type:'score', note:'他人の時間軸を、自分の採点表に変えている。'},
    {scene:'SNSを見て', text:'この投稿では、新しい挑戦が報告されている。', type:'observe', note:'投稿の内容についての観察。'},
    {scene:'SNSを見て', text:'自分の毎日は、この人より価値が低い。', type:'score', note:'投稿だけから自分の価値は計算できない。'},
    {scene:'本を読んで', text:'この著者は、こういう考え方をしている。', type:'observe', note:'「そういう考えもある」で止められる。'},
    {scene:'本を読んで', text:'この通りに生きていない自分は間違っている。', type:'score', note:'知識を自分への判定に変えている。'}
  ];
  const cuts = [['この人は大きな仕事をやった','だから自分は遅れている'],['この選手は努力している','だから自分は努力不足だ'],['このゲームは面白い','だから自分も何か生み出すべきだ']];
  function show(id, progress){ screens.forEach((s)=>$(s).classList.toggle('active',s===id)); $('progressBar').style.width = `${progress}%`; window.scrollTo(0,0); }
  function tone(freq=520,duration=.045){ if(!state.sound) return; try{ const C=window.AudioContext||window.webkitAudioContext; if(!C)return; const ctx=tone.ctx||(tone.ctx=new C()); const o=ctx.createOscillator(); const g=ctx.createGain(); o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.04,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);}catch{} }
  function buzz(pattern=12){ try{ navigator.vibrate?.(pattern); }catch{} }
  function flash(){ $('flash').classList.remove('go'); void $('flash').offsetWidth; $('flash').classList.add('go'); }
  function readStats(){ try{return JSON.parse(localStorage.getItem('levelup:saiten-shinai')||'{}')}catch{return{}} }
  function renderStats(){ const s=readStats(); if(s.plays){$('localStats').hidden=false;$('playCount').textContent=s.plays;$('bestAccuracy').textContent=`${s.best||0}%`;} }
  function saveStats(acc){ const s=readStats(); s.plays=(s.plays||0)+1;s.best=Math.max(s.best||0,acc); try{localStorage.setItem('levelup:saiten-shinai',JSON.stringify(s))}catch{} }
  function updateRange(input,valueEl,key){ const el=$(input), out=$(valueEl); el.addEventListener('input',()=>{state[key]=Number(el.value);out.textContent=el.value;}); }
  function loadCard(){ state.locked=false; const item=items[state.index]; $('roundIndex').textContent=state.index+1; $('roundTotal').textContent=items.length; $('scenarioLabel').textContent=item.scene; $('thoughtText').textContent=item.text; $('cardSignal').textContent='?'; $('feedback').textContent=''; const card=$('thoughtCard'); card.className='thought-card'; card.style.transform='';card.style.opacity='1'; state.cardStartedAt=performance.now(); }
  function answer(type){ if(state.locked)return; state.locked=true; const item=items[state.index]; const ok=item.type===type; const elapsed=(performance.now()-state.cardStartedAt)/1000; state.answers.push(elapsed); if(ok){state.correct++;tone(620);buzz(10);$('thoughtCard').classList.add('correct');$('cardSignal').textContent='✓';$('feedback').textContent=item.note;}else{tone(210,.08);buzz([12,35,12]);$('thoughtCard').classList.add('wrong');$('cardSignal').textContent='×';$('feedback').textContent=item.type==='observe'?'これは「観察」。自分の評価はまだ入っていない。':'これは「採点」。他人の情報から自分の判定へ飛んでいる。';} setTimeout(()=>{ const dir=type==='observe'?-1:1; const card=$('thoughtCard'); card.style.transform=`translateX(${dir*120}%) rotate(${dir*8}deg)`;card.style.opacity='0'; setTimeout(()=>{state.index++; if(state.index>=items.length){state.cutIndex=0;loadCut();show('cutScreen',55);}else{loadCard();}},180);},520); }
  function loadCut(){ const pair=cuts[state.cutIndex]; $('cutFact').textContent=pair[0];$('cutScore').textContent=pair[1];$('wire').classList.remove('cut');$('cutRemaining').textContent=cuts.length-state.cutIndex; }
  function doCut(){ if($('wire').classList.contains('cut'))return; $('wire').classList.add('cut');tone(720);buzz(15);flash(); setTimeout(()=>{state.cutIndex++; if(state.cutIndex>=cuts.length){show('realScreen',75);}else loadCut();},520); }
  function selectSource(source,btn){ state.source=source; document.querySelectorAll('#sourceGrid button').forEach((b)=>b.classList.toggle('selected',b===btn)); $('realFact').textContent=`${source}で、誰かの成果・表現を見た。`; $('realSeparation').hidden=false; tone(540); setTimeout(()=>$('realSeparation').scrollIntoView({behavior:'smooth',block:'nearest'}),60); }
  function finish(){ state.after=Number($('afterRange').value); const acc=Math.round((state.correct/items.length)*100); const avg=state.answers.length?state.answers.reduce((a,b)=>a+b,0)/state.answers.length:0; $('accuracyValue').textContent=`${acc}%`;$('speedValue').textContent=`${avg.toFixed(1)}s`;$('beforeResult').textContent=state.before;$('afterResult').textContent=state.after;saveStats(acc);show('resultScreen',100);tone(680,.09);buzz([10,30,20]); }
  function reset(){ state.index=0;state.correct=0;state.answers=[];state.cutIndex=0;state.source='';state.locked=false; $('sourceGrid').querySelectorAll('button').forEach(b=>b.classList.remove('selected'));$('realSeparation').hidden=true; $('beforeRange').value='7';$('beforeValue').textContent='7';$('afterRange').value='7';$('afterValue').textContent='7';state.before=7;state.after=7;renderStats();show('startScreen',0); }
  $('startBtn').addEventListener('click',()=>{state.before=Number($('beforeRange').value);state.after=state.before;$('afterRange').value=state.before;$('afterValue').textContent=state.before;state.startedAt=performance.now();state.index=0;state.correct=0;state.answers=[];loadCard();show('trainingScreen',18);tone(500);});
  $('observeBtn').addEventListener('click',()=>answer('observe'));$('scoreBtn').addEventListener('click',()=>answer('score'));$('cutBtn').addEventListener('click',doCut);
  $('sourceGrid').addEventListener('click',(e)=>{const btn=e.target.closest('button[data-source]');if(btn)selectSource(btn.dataset.source,btn);});
  $('realDoneBtn').addEventListener('click',()=>{show('afterScreen',90);tone(600);});$('finishBtn').addEventListener('click',finish);$('againBtn').addEventListener('click',reset);
  $('soundBtn').addEventListener('click',()=>{state.sound=!state.sound;$('soundBtn').setAttribute('aria-pressed',String(state.sound));$('soundBtn').textContent=state.sound?'♪':'×';});
  updateRange('beforeRange','beforeValue','before');updateRange('afterRange','afterValue','after');
  let drag={active:false,startX:0,dx:0}; const card=$('thoughtCard');
  card.addEventListener('pointerdown',(e)=>{if(state.locked)return;drag={active:true,startX:e.clientX,dx:0};card.setPointerCapture?.(e.pointerId);});
  card.addEventListener('pointermove',(e)=>{if(!drag.active||state.locked)return;drag.dx=e.clientX-drag.startX;const rot=drag.dx/18;card.style.transform=`translateX(${drag.dx}px) rotate(${rot}deg)`;document.querySelector('.swipe-label.left').style.opacity=drag.dx<-35?Math.min(1,Math.abs(drag.dx)/90):0;document.querySelector('.swipe-label.right').style.opacity=drag.dx>35?Math.min(1,Math.abs(drag.dx)/90):0;});
  function endDrag(){if(!drag.active)return;drag.active=false;document.querySelectorAll('.swipe-label').forEach(x=>x.style.opacity=0);if(Math.abs(drag.dx)>70)answer(drag.dx<0?'observe':'score');else card.style.transform='';}
  card.addEventListener('pointerup',endDrag);card.addEventListener('pointercancel',endDrag);card.addEventListener('keydown',(e)=>{if(e.key==='ArrowLeft')answer('observe');if(e.key==='ArrowRight')answer('score');});renderStats();
})();