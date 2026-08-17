(() => {
  'use strict';

  const LABEL = { self: '自分の課題', other: '相手の課題' };
  const STAGES = [
    'LEVEL 1 · 日常',
    'LEVEL 2 · 人間関係',
    'LEVEL 3 · 仕事',
    'LEVEL 4 · 家族',
    'LEVEL 5 · 境界線'
  ];

  const QUESTIONS = [
    {stage:0,s:'明日、資格試験を受ける。',t:'自分が、今夜30分だけ復習するか',a:'self',why:'復習するかどうかは、自分が選ぶ行動。'},
    {stage:0,s:'企画を提出した。',t:'決裁者が、その企画を採用するか',a:'other',why:'採用するかどうかは、決裁する相手が選ぶ。'},
    {stage:0,s:'雨予報の日に出かける。',t:'自分が、傘を持って出るか',a:'self',why:'準備として何をするかは、自分が選べる。'},
    {stage:0,s:'SNSに投稿した。',t:'投稿を見た人が、「いいね」するか',a:'other',why:'反応するかどうかは、見た相手が選ぶ。'},

    {stage:1,s:'友人から返信がない。',t:'自分から、もう一度だけ連絡するか',a:'self',why:'もう一度連絡するかは、自分が選べる。'},
    {stage:1,s:'友人から返信がない。',t:'友人が、いつ返信するか',a:'other',why:'返信するタイミングは、友人が選ぶ。'},
    {stage:1,s:'友人に遊びへ誘われた。',t:'自分が、今回の誘いを断るか',a:'self',why:'誘いを受けるか断るかは、自分が選ぶ。'},
    {stage:1,s:'自分の意見を伝えた。',t:'相手が、その意見に納得するか',a:'other',why:'納得するかどうかは、相手が決める。'},

    {stage:2,s:'部下に仕事を依頼した。',t:'自分が、期限と完成条件を明確に伝えるか',a:'self',why:'依頼の伝え方は、自分が整えられる。'},
    {stage:2,s:'部下に仕事を依頼した。',t:'部下本人が、本気で取り組むか',a:'other',why:'実際にどう取り組むかは、本人が選ぶ。'},
    {stage:2,s:'会議で提案が却下された。',t:'自分が、却下された理由を確認するか',a:'self',why:'理由を聞くという次の一手は、自分が選べる。'},
    {stage:2,s:'会議で提案した。',t:'上司が、自分を優秀だと思うか',a:'other',why:'どう評価するかは、上司の中で決まる。'},

    {stage:3,s:'子どもに宿題がある。',t:'子ども本人が、宿題に取り組むか',a:'other',why:'最終的に宿題をするのは、本人。'},
    {stage:3,s:'子どもに宿題がある。',t:'自分が、静かに勉強できる場所を用意するか',a:'self',why:'環境を整えるという支援は、自分が選べる。'},
    {stage:3,s:'家族が落ち込んでいる。',t:'自分が、「話なら聞けるよ」と伝えるか',a:'self',why:'支援を申し出るかは、自分が選べる。'},
    {stage:3,s:'家族が落ち込んでいる。',t:'家族本人が、いつ元気になるか',a:'other',why:'感情がどう動くかは、その人の内側のこと。'},

    {stage:4,s:'同僚がミスをした。',t:'自分が、必要な事実と改善点を伝えるか',a:'self',why:'自分がどう伝えるかは、自分の課題。'},
    {stage:4,s:'同僚に改善点を伝えた。',t:'同僚が、指摘を受け入れて改善するか',a:'other',why:'受け止めて変えるかは、同僚本人が選ぶ。'}
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    hero:$('heroScreen'), game:$('gameScreen'), result:$('resultScreen'), start:$('startBtn'), retry:$('retryBtn'), home:$('homeBtn'), how:$('howBtn'),
    dialog:$('howDialog'), closeHow:$('closeHowBtn'), dialogStart:$('dialogStartBtn'), sound:$('soundBtn'), progressFill:$('progressFill'), progressText:$('progressText'),
    combo:$('comboValue'), comboPill:$('comboPill'), stage:$('stageLabel'), situation:$('situationText'), card:$('taskCard'), task:$('taskText'), hint:$('dragHint'),
    feedback:$('feedbackBurst'), feedbackTitle:$('feedbackTitle'), feedbackBody:$('feedbackBody'), weightCount:$('weightCount'), weightLabel:$('weightLabel'), backpack:$('backpack'),
    accuracy:$('accuracyScore'), correctCount:$('correctCount'), selfScore:$('selfScore'), otherScore:$('otherScore'), resultMessage:$('resultMessage'), reviewWrap:$('mistakeReviewWrap'), review:$('mistakeReview')
  };

  let deck=[]; let index=0; let combo=0; let locked=false; let burden=0; let mistakes=[]; let stats={}; let pointer=null; let soundOn=true; let audioCtx=null;

  function shuffled(arr){ const x=[...arr]; for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x; }
  function makeDeck(){
    const byStage=STAGES.map((_,stage)=>shuffled(QUESTIONS.filter(q=>q.stage===stage)));
    return [...byStage[0],...byStage[1],...byStage[2],...byStage[3],...byStage[4]];
  }
  function resetStats(){ return {correct:0,selfCorrect:0,selfTotal:0,otherCorrect:0,otherTotal:0}; }
  function show(name){
    els.hero.classList.toggle('hidden',name!=='hero'); els.game.classList.toggle('hidden',name!=='game'); els.result.classList.toggle('hidden',name!=='result');
    window.scrollTo({top:0,behavior:'instant'});
  }
  function startGame(){
    if(els.dialog.open) els.dialog.close(); deck=makeDeck(); index=0; combo=0; burden=0; mistakes=[]; stats=resetStats(); locked=false; show('game'); render();
  }
  function render(){
    const q=deck[index]; if(!q){finish();return;}
    els.progressFill.style.width=`${(index/deck.length)*100}%`; els.progressText.textContent=`${index+1} / ${deck.length}`; els.stage.textContent=STAGES[q.stage];
    els.situation.textContent=q.s; els.task.textContent=q.t; els.combo.textContent=combo; els.comboPill.classList.toggle('hot',combo>=3); els.hint.textContent='← 自分　　相手 →';
    els.card.className='task-card'; els.card.style.transition='none'; els.card.style.transform='translate(0px,0px) rotate(0deg)'; els.card.style.opacity='1'; els.feedback.classList.add('hidden');
    document.querySelectorAll('.zone').forEach(z=>z.classList.remove('active')); locked=false;
  }
  function answer(choice){
    if(locked||!deck[index])return; locked=true; const q=deck[index]; const correct=choice===q.a;
    if(q.a==='self'){stats.selfTotal++; if(correct)stats.selfCorrect++;} else {stats.otherTotal++; if(correct)stats.otherCorrect++;}
    if(correct){stats.correct++; combo++; if(q.a==='other'&&burden>0)burden--;} else {combo=0; mistakes.push({...q,choice}); if(choice==='self'&&q.a==='other')burden++;}
    updateWeight(); pulse(choice); tone(correct); showFeedback(correct,q);
    const distance=Math.max(window.innerWidth,520)*.75; const x=choice==='self'?-distance:distance;
    els.card.style.transition='transform .32s cubic-bezier(.2,.8,.2,1), opacity .28s'; els.card.style.transform=`translate(${x}px,0) rotate(${choice==='self'?-12:12}deg)`; els.card.style.opacity='.08'; els.card.classList.add(correct?'correct-flash':'wrong-flash');
    setTimeout(()=>{index++;render();},850);
  }
  function showFeedback(correct,q){
    els.feedback.classList.remove('hidden','wrong'); if(!correct)els.feedback.classList.add('wrong');
    els.feedbackTitle.textContent=correct?(combo>=3?`BOUNDARY COMBO ×${combo}`:'SEPARATED!'):`正解は「${LABEL[q.a]}」`;
    els.feedbackBody.textContent=q.why;
  }
  function pulse(choice){ const el=document.querySelector(`.zone[data-zone="${choice}"]`); if(!el)return; el.classList.add('active'); setTimeout(()=>el.classList.remove('active'),360); }
  function updateWeight(){
    els.weightCount.textContent=burden; els.weightLabel.textContent=burden===0?'0個 — 身軽':burden<=2?`${burden}個 — 少し重い`:`${burden}個 — 背負いすぎ`;
    els.backpack.style.transform=`scale(${1+Math.min(burden,5)*.14})`;
  }
  function finish(){
    const pct=(n,d)=>d?Math.round(n/d*100):0; const accuracy=pct(stats.correct,deck.length); els.accuracy.textContent=accuracy; els.correctCount.textContent=`${stats.correct} / ${deck.length}`;
    els.selfScore.textContent=`${pct(stats.selfCorrect,stats.selfTotal)}%`; els.otherScore.textContent=`${pct(stats.otherCorrect,stats.otherTotal)}%`;
    els.resultMessage.textContent=accuracy>=90?'かなり分かれてきた。自分の一手だけ持てばいい。':accuracy>=70?'迷った問題だけ見直せば、境界線はもっと速くなる。':'「最終的に誰が選ぶ？」を基準に、もう一度分けてみよう。';
    renderReview(); show('result');
  }
  function renderReview(){
    if(!mistakes.length){els.review.innerHTML='<div class="perfect">全問正解。今回は振り返る間違いはありません。</div>'; return;}
    els.review.innerHTML=mistakes.map((m,i)=>`<article class="review-item"><span class="review-no">MISS ${String(i+1).padStart(2,'0')}</span><h3>${escapeHtml(m.s)}<br>${escapeHtml(m.t)}</h3><div class="review-answer">正解：${LABEL[m.a]}</div><p>${escapeHtml(m.why)}</p></article>`).join('');
  }
  function escapeHtml(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function tone(correct){
    if(!soundOn)return; try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.frequency.value=correct?660:180; o.type=correct?'sine':'triangle'; g.gain.setValueAtTime(.045,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.14); o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+.14);}catch{}
  }

  els.start.addEventListener('click',startGame); els.retry.addEventListener('click',startGame); els.home.addEventListener('click',()=>show('hero'));
  els.how.addEventListener('click',()=>els.dialog.showModal()); els.closeHow.addEventListener('click',()=>els.dialog.close()); els.dialogStart.addEventListener('click',startGame);
  els.sound.addEventListener('click',()=>{soundOn=!soundOn;els.sound.textContent=soundOn?'♪':'×';});
  document.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>answer(btn.dataset.answer)));
  els.card.addEventListener('pointerdown',(e)=>{if(locked)return;pointer={id:e.pointerId,x:e.clientX};els.card.setPointerCapture?.(e.pointerId);els.card.classList.add('dragging');});
  els.card.addEventListener('pointermove',(e)=>{if(!pointer||pointer.id!==e.pointerId||locked)return;const dx=e.clientX-pointer.x;els.card.style.transition='none';els.card.style.transform=`translate(${dx}px,0) rotate(${dx/30}deg)`;});
  const endPointer=(e)=>{if(!pointer||pointer.id!==e.pointerId||locked)return;const dx=e.clientX-pointer.x;pointer=null;els.card.classList.remove('dragging');if(Math.abs(dx)>=55)answer(dx<0?'self':'other');else{els.card.style.transition='transform .2s';els.card.style.transform='translate(0,0) rotate(0)';}};
  els.card.addEventListener('pointerup',endPointer); els.card.addEventListener('pointercancel',()=>{pointer=null;els.card.style.transform='translate(0,0) rotate(0)';});
  els.card.addEventListener('keydown',(e)=>{if(e.key==='ArrowLeft')answer('self');if(e.key==='ArrowRight')answer('other');});
})();
