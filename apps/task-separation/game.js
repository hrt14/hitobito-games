(() => {
  'use strict';

  const ZONE_LABELS = { self: '自分', joint: '共同', other: '相手', outside: 'コントロール外' };
  const STAGES = [
    'LEVEL 1 · 明確な境界線',
    'LEVEL 2 · 人間関係',
    'LEVEL 3 · 仕事',
    'LEVEL 4 · 家族',
    'LEVEL 5 · 善意と責任'
  ];

  const QUESTIONS = [
    {stage:0,s:'明日、資格試験を受ける。',t:'今夜30分だけ復習する',a:'self',why:'勉強するかは自分が選べる。'},
    {stage:0,s:'明日、資格試験を受ける。',t:'試験問題の難しさ',a:'outside',why:'問題そのものの難易度は決められない。'},
    {stage:0,s:'企画を提出した。',t:'企画を採用するかどうか',a:'other',why:'採用判断は決裁する相手の課題。'},
    {stage:0,s:'雨予報の日に出かける。',t:'傘を持って出る',a:'self',why:'準備は自分で選べる。'},
    {stage:0,s:'雨予報の日に出かける。',t:'実際に雨が降るか',a:'outside',why:'天気は誰にも完全には決められない。'},

    {stage:1,s:'友人から返信がない。',t:'もう一度だけ確認の連絡をする',a:'self',why:'連絡するかどうかは自分の一手。'},
    {stage:1,s:'友人から返信がない。',t:'相手が返信するタイミング',a:'other',why:'いつ返信するかは相手が決める。'},
    {stage:1,s:'友人に遊びへ誘われた。',t:'今回は断る',a:'self',why:'誘いを受けるか断るかは自分が選べる。'},
    {stage:1,s:'SNSに投稿した。',t:'他人が「いいね」するか',a:'other',why:'反応するかどうかは見る人の課題。'},
    {stage:1,s:'SNSに投稿した。',t:'投稿する内容を見直す',a:'self',why:'自分の発信内容は自分で選べる。'},

    {stage:2,s:'部下に仕事を依頼した。',t:'期限と完成条件を明確に伝える',a:'self',why:'伝え方を整えるのは自分の課題。'},
    {stage:2,s:'部下に仕事を依頼した。',t:'本人が本気で取り組むか',a:'other',why:'取り組み方の最終判断は本人にある。'},
    {stage:2,s:'会議の日程を決めたい。',t:'全員が参加できる時間を相談して決める',a:'joint',why:'日程は複数人の合意で成立する。'},
    {stage:2,s:'会議で提案が却下された。',t:'却下された理由を聞く',a:'self',why:'理由を確認する行動は自分が選べる。'},
    {stage:2,s:'会議で提案が却下された。',t:'上司が自分を優秀だと思うか',a:'other',why:'評価そのものは相手の中にある。'},
    {stage:2,s:'取引先との契約を進める。',t:'価格と条件を双方で合意する',a:'joint',why:'契約条件は双方の合意が必要。'},

    {stage:3,s:'家族で家事が偏っている。',t:'家事分担を話し合って決める',a:'joint',why:'分担は一方的ではなく合意して決める。'},
    {stage:3,s:'子どもに宿題がある。',t:'宿題を実際にやるか',a:'other',why:'最終的に取り組む本人の課題。'},
    {stage:3,s:'子どもに宿題がある。',t:'静かに勉強できる場所を用意する',a:'self',why:'環境を整えることは自分ができる支援。'},
    {stage:3,s:'家族が落ち込んでいる。',t:'話を聞けると伝える',a:'self',why:'支援を申し出ることは自分が選べる。'},
    {stage:3,s:'家族が落ち込んでいる。',t:'今すぐ元気になるか',a:'other',why:'感情がどう動くかを他人が決めることはできない。'},

    {stage:4,s:'同僚がミスをした。',t:'必要な事実と改善点を伝える',a:'self',why:'自分の伝え方と行動は自分の課題。'},
    {stage:4,s:'同僚がミスをした。',t:'指摘を受け入れて改善するか',a:'other',why:'受け止めて変えるかは本人の課題。'},
    {stage:4,s:'友人が困っている。',t:'頼まれる前に全部代わりに決める',a:'self',trap:true,why:'それをするかは自分の選択。ただし相手の選択まで奪わない注意が必要。'},
    {stage:4,s:'友人が困っている。',t:'助けが必要なら言って、と伝える',a:'self',why:'支援できることを伝えるのは自分の一手。'},
    {stage:4,s:'チームの成果が悪かった。',t:'次回の役割分担をチームで決め直す',a:'joint',why:'役割分担は関係者の合意で作る。'},
    {stage:4,s:'過去の失敗を思い出した。',t:'起きてしまった過去そのもの',a:'outside',why:'過去は変えられない。次の一手は変えられる。'},
    {stage:4,s:'過去の失敗を思い出した。',t:'次回のチェック項目を1つ作る',a:'self',why:'これからの行動は自分で変えられる。'},
    {stage:4,s:'自分の発言で相手を傷つけた。',t:'謝罪するかどうか',a:'self',why:'自分の行為への対応は自分の課題。'},
    {stage:4,s:'自分の発言で相手を傷つけた。',t:'謝罪を受け入れるか',a:'other',why:'受け入れるかどうかは相手の課題。'},
    {stage:4,s:'電車が大幅に遅れている。',t:'遅延そのものをなくす',a:'outside',why:'自分一人では変えられない出来事。'},
    {stage:4,s:'電車が大幅に遅れている。',t:'別ルートを調べる',a:'self',why:'状況の中で次の行動は選べる。'}
  ];

  const els = {
    hero: document.getElementById('heroScreen'), game: document.getElementById('gameScreen'), result: document.getElementById('resultScreen'),
    start: document.getElementById('startBtn'), retry: document.getElementById('retryBtn'), home: document.getElementById('homeBtn'), how: document.getElementById('howBtn'),
    dialog: document.getElementById('howDialog'), closeHow: document.getElementById('closeHowBtn'), dialogStart: document.getElementById('dialogStartBtn'),
    sound: document.getElementById('soundBtn'), progressFill: document.getElementById('progressFill'), progressText: document.getElementById('progressText'),
    combo: document.getElementById('comboValue'), comboPill: document.getElementById('comboPill'), stage: document.getElementById('stageLabel'), situation: document.getElementById('situationText'),
    card: document.getElementById('taskCard'), task: document.getElementById('taskText'), hint: document.getElementById('dragHint'), feedback: document.getElementById('feedbackBurst'), feedbackTitle: document.getElementById('feedbackTitle'), feedbackBody: document.getElementById('feedbackBody'),
    backpack: document.getElementById('backpack'), weightCount: document.getElementById('weightCount'), weightLabel: document.getElementById('weightLabel'), weightPerson: document.getElementById('weightPerson'),
    released: document.getElementById('releasedCount'), accuracy: document.getElementById('accuracyScore'), selfScore: document.getElementById('selfScore'), intrusion: document.getElementById('intrusionScore'), burden: document.getElementById('burdenScore'), resultMessage: document.getElementById('resultMessage')
  };

  let soundOn = true;
  let audioCtx = null;
  let deck = [];
  let index = 0;
  let combo = 0;
  let maxCombo = 0;
  let burden = 0;
  let stats = null;
  let locked = false;
  let pointer = null;

  function makeStats(){ return {correct:0,total:0,selfCorrect:0,selfTotal:0,intrusion:0,burdenMistakes:0,released:0}; }
  function shuffled(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

  function makeDeck(){
    const byStage = STAGES.map((_,s)=>shuffled(QUESTIONS.filter(q=>q.stage===s)));
    const picks = [...byStage[0].slice(0,3),...byStage[1].slice(0,4),...byStage[2].slice(0,4),...byStage[3].slice(0,3),...byStage[4].slice(0,4)];
    return picks;
  }

  function show(screen){
    els.hero.classList.toggle('hidden',screen!=='hero');
    els.game.classList.toggle('hidden',screen!=='game');
    els.result.classList.toggle('hidden',screen!=='result');
    window.scrollTo({top:0,behavior:'instant'});
  }

  function startGame(){
    if(els.dialog.open) els.dialog.close();
    deck=makeDeck(); index=0; combo=0; maxCombo=0; burden=0; stats=makeStats(); locked=false;
    show('game'); updateWeight(); renderQuestion(true);
  }

  function renderQuestion(first=false){
    const q=deck[index];
    if(!q){ finishGame(); return; }
    els.progressFill.style.width=`${(index/deck.length)*100}%`;
    els.progressText.textContent=`${index+1} / ${deck.length}`;
    els.stage.textContent=STAGES[q.stage];
    els.situation.textContent=q.s;
    els.task.textContent=q.t;
    els.combo.textContent=combo;
    els.comboPill.classList.toggle('hot',combo>=3);
    els.hint.textContent=first?'左右・上下へスワイプ。下のボタンでもOK':'カードを4方向へスワイプ';
    els.card.className='task-card';
    els.card.style.transition='none';
    els.card.style.transform='translate(0px,0px) rotate(0deg)';
    els.card.style.opacity='1';
    els.feedback.classList.add('hidden');
    document.querySelectorAll('.zone').forEach(z=>z.classList.remove('active'));
    locked=false;
  }

  function answer(zone){
    if(locked || !deck[index]) return;
    locked=true;
    const q=deck[index]; const correct=zone===q.a;
    stats.total++;
    if(q.a==='self') stats.selfTotal++;
    if(correct){
      stats.correct++; if(q.a==='self') stats.selfCorrect++;
      combo++; maxCombo=Math.max(maxCombo,combo);
      if(q.a==='other' || q.a==='outside') stats.released++;
      if(burden>0 && (q.a==='other'||q.a==='outside')) burden--;
    }else{
      combo=0;
      if(zone==='other' && q.a==='self') stats.intrusion++;
      if(zone==='self' && (q.a==='other'||q.a==='outside')){ stats.burdenMistakes++; burden++; }
    }
    updateWeight(); pulseZone(zone); playTone(correct);

    const v=vectorFor(zone);
    els.card.style.transition='transform .32s cubic-bezier(.2,.8,.2,1), opacity .28s';
    els.card.style.transform=`translate(${v.x}px,${v.y}px) rotate(${v.r}deg)`;
    els.card.style.opacity='.08';
    els.card.classList.add(correct?'correct-flash':'wrong-flash');
    showFeedback(correct,q);

    setTimeout(()=>{ index++; renderQuestion(); }, 760);
  }

  function vectorFor(zone){
    const d=Math.max(window.innerWidth,520);
    if(zone==='self') return {x:-d*.72,y:0,r:-13};
    if(zone==='other') return {x:d*.72,y:0,r:13};
    if(zone==='joint') return {x:0,y:-430,r:-5};
    return {x:0,y:430,r:5};
  }

  function showFeedback(correct,q){
    els.feedback.classList.remove('hidden','wrong');
    if(!correct) els.feedback.classList.add('wrong');
    els.feedbackTitle.textContent=correct ? (combo>=3?`BOUNDARY COMBO ×${combo}`:'SEPARATED!') : `正解は「${ZONE_LABELS[q.a]}」`;
    els.feedbackBody.textContent=q.why;
  }

  function pulseZone(zone){
    const el=document.querySelector(`.zone[data-zone="${zone}"]`); if(!el) return;
    el.classList.add('active'); setTimeout(()=>el.classList.remove('active'),360);
  }

  function updateWeight(){
    els.weightCount.textContent=burden;
    const text=burden===0?'0個 — 身軽':burden<=2?`${burden}個 — 少し重い`: `${burden}個 — 背負いすぎ`;
    els.weightLabel.textContent=text;
    els.backpack.style.transform=`scale(${1+Math.min(burden,5)*.14})`;
    els.weightPerson.querySelector('.mini-body').style.transform=`rotate(${Math.min(burden,4)*2.2}deg) translateY(${Math.min(burden,4)}px)`;
  }

  function finishGame(){
    const pct=(n,d)=>d?Math.round(n/d*100):0;
    const accuracy=pct(stats.correct,stats.total);
    const selfPct=pct(stats.selfCorrect,stats.selfTotal);
    const intrusion=pct(stats.intrusion,stats.total);
    const burdenPct=pct(stats.burdenMistakes,stats.total);
    els.released.textContent=stats.released;
    els.accuracy.textContent=`${accuracy}%`; els.selfScore.textContent=`${selfPct}%`; els.intrusion.textContent=`${intrusion}%`; els.burden.textContent=`${burdenPct}%`;
    els.progressFill.style.width='100%';
    if(accuracy>=90) els.resultMessage.textContent=`境界線がかなりクリア。最大${maxCombo}コンボ。次は迷う問題ほど「結果を引き受けるのは誰？」で切ろう。`;
    else if(accuracy>=70) els.resultMessage.textContent=`かなり仕分けられた。最大${maxCombo}コンボ。相手の結果ではなく、自分の一手へ戻ろう。`;
    else els.resultMessage.textContent='迷ったら「自分にできること」と「相手が決めること」を2つに割る。それだけで軽くなる。';
    show('result'); playFinish();
  }

  function playTone(ok){
    if(!soundOn) return; try{
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.connect(g);g.connect(audioCtx.destination);
      o.type='sine';o.frequency.value=ok?620:185;g.gain.setValueAtTime(.05,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.12);o.start();o.stop(audioCtx.currentTime+.12);
    }catch(_){ }
  }
  function playFinish(){ if(!soundOn) return; [0,90,180].forEach((ms,i)=>setTimeout(()=>{try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=[440,550,660][i];g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.2);o.start();o.stop(audioCtx.currentTime+.2);}catch(_){ }},ms)); }

  function zoneFromDelta(dx,dy){
    if(Math.abs(dx)>Math.abs(dy)) return dx<0?'self':'other';
    return dy<0?'joint':'outside';
  }

  els.card.addEventListener('pointerdown',e=>{
    if(locked) return; pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0}; els.card.setPointerCapture(e.pointerId); els.card.classList.add('dragging');
  });
  els.card.addEventListener('pointermove',e=>{
    if(!pointer||e.pointerId!==pointer.id||locked) return;
    pointer.dx=e.clientX-pointer.x; pointer.dy=e.clientY-pointer.y;
    const r=Math.max(-10,Math.min(10,pointer.dx/22));
    els.card.style.transform=`translate(${pointer.dx}px,${pointer.dy}px) rotate(${r}deg)`;
    const dist=Math.hypot(pointer.dx,pointer.dy); document.querySelectorAll('.zone').forEach(z=>z.classList.remove('active'));
    if(dist>42){ const zone=zoneFromDelta(pointer.dx,pointer.dy); document.querySelector(`.zone[data-zone="${zone}"]`)?.classList.add('active'); }
  });
  function endPointer(e){
    if(!pointer||e.pointerId!==pointer.id||locked) return;
    const {dx,dy}=pointer; pointer=null; els.card.classList.remove('dragging'); document.querySelectorAll('.zone').forEach(z=>z.classList.remove('active'));
    if(Math.hypot(dx,dy)>78){ answer(zoneFromDelta(dx,dy)); }
    else{ els.card.style.transition='transform .22s'; els.card.style.transform='translate(0,0) rotate(0deg)'; }
  }
  els.card.addEventListener('pointerup',endPointer); els.card.addEventListener('pointercancel',endPointer);
  els.card.addEventListener('keydown',e=>{
    const map={ArrowLeft:'self',ArrowUp:'joint',ArrowRight:'other',ArrowDown:'outside'}; if(map[e.key]){e.preventDefault();answer(map[e.key]);}
  });

  document.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>answer(btn.dataset.answer)));
  els.start.addEventListener('click',startGame); els.retry.addEventListener('click',startGame); els.home.addEventListener('click',()=>show('hero'));
  els.how.addEventListener('click',()=>els.dialog.showModal()); els.closeHow.addEventListener('click',()=>els.dialog.close()); els.dialogStart.addEventListener('click',startGame);
  els.dialog.addEventListener('click',e=>{ if(e.target===els.dialog) els.dialog.close(); });
  els.sound.addEventListener('click',()=>{soundOn=!soundOn;els.sound.textContent=soundOn?'♪':'×';els.sound.setAttribute('aria-label',soundOn?'効果音オン':'効果音オフ');});

  show('hero');
})();
