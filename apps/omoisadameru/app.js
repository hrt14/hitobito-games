(() => {
  'use strict';

  const EVENTS = [
    {scene:'仕事',icon:'◆',expected:'予定どおり終わる',actual:'終わらなかった',control:'movable',lesson:'終わらなかった事実は確定。次の優先順位や締め方はまだ動かせる。'},
    {scene:'人間関係',icon:'○',expected:'すぐ返信が来る',actual:'返信が来ない',control:'fixed',lesson:'相手がいつ返すかは動かせない。必要なら自分の次の連絡だけ決めればいい。'},
    {scene:'会議',icon:'△',expected:'30分で終わる',actual:'45分かかった',control:'movable',lesson:'超過した15分は戻らない。次回の終了条件やアラームは動かせる。'},
    {scene:'成果',icon:'↗',expected:'頑張れば評価される',actual:'評価されなかった',control:'fixed',lesson:'今回の評価そのものは確定済み。評価者の気持ちを頭の中で操作しなくていい。'},
    {scene:'体調',icon:'◇',expected:'今日は元気に動ける',actual:'思ったより疲れている',control:'movable',lesson:'今の疲労は事実。今日の量・順番・休み方は動かせる。'},
    {scene:'予定',icon:'□',expected:'楽しみにしていた予定に行く',actual:'予定が中止になった',control:'fixed',lesson:'中止になった予定は戻せない。まず中止という現実だけを置く。'},
    {scene:'自分',icon:'•',expected:'うまく話せる',actual:'言葉に詰まった',control:'movable',lesson:'詰まった瞬間は消せない。次に伝える一文や準備はまだ動かせる。'},
    {scene:'売上',icon:'¥',expected:'目標を達成する',actual:'目標を下回った',control:'movable',lesson:'出た数字は確定。原因の確認や次の施策は動かせる。'},
    {scene:'移動',icon:'→',expected:'時間どおり着く',actual:'電車が遅れた',control:'fixed',lesson:'遅延そのものは動かせない。現実に抵抗しても到着は早まらない。'},
    {scene:'失敗',icon:'×',expected:'ミスなく終える',actual:'失敗した',control:'movable',lesson:'失敗した事実と、自分がダメだという物語は別。修正と次回の仕組みは動かせる。'},
    {scene:'相手',icon:'◎',expected:'こちらの意図を分かってくれる',actual:'伝わらなかった',control:'movable',lesson:'伝わらなかった事実を認めると、説明方法だけを変えられる。'},
    {scene:'偶然',icon:'✦',expected:'今日は問題なく進む',actual:'予想外が重なった',control:'fixed',lesson:'予想外が起きない一日は保証されない。「起きたら異常」をやめる。'},
    {scene:'比較',icon:'≠',expected:'自分の方がうまくいく',actual:'他人の方が先に進んだ',control:'fixed',lesson:'他人の進み方は自分の操作対象ではない。比較の結果を事実以上に膨らませない。'},
    {scene:'準備',icon:'▦',expected:'十分準備できる',actual:'準備時間が足りない',control:'movable',lesson:'足りない時間は増やせなくても、最低限の完成条件は動かせる。'},
    {scene:'人生',icon:'∞',expected:'計画どおり進む',actual:'全然ちがう方向に来た',control:'movable',lesson:'計画からズレたことと、終わったことは同じではない。今いる場所から次を選べる。'},
  ];

  const LEVELS = [
    {name:'抵抗する',need:0},
    {name:'受け入れる',need:1},
    {name:'切り替える',need:3},
    {name:'想定内にする',need:7},
    {name:'思い定める',need:14},
  ];
  const STORAGE_KEY = 'levelup-omoisadameru-v1';
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const state = {
    mode:'train', round:0, deck:[], accepted:false, locked:false,
    correct:0, answers:0, sound:true,
    stats:loadStats(), drag:null,
  };

  function loadStats(){
    try{
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {sessions:Number(raw.sessions)||0, correct:Number(raw.correct)||0, answers:Number(raw.answers)||0};
    }catch{return {sessions:0,correct:0,answers:0};}
  }
  function saveStats(){
    try{localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));}catch{}
  }
  function levelFor(sessions){
    let idx=0;
    LEVELS.forEach((level,i)=>{if(sessions>=level.need) idx=i;});
    return {index:idx,...LEVELS[idx]};
  }
  function updateGlobalUI(){
    const level=levelFor(state.stats.sessions);
    $('mindLevel').textContent=`Lv.${level.index+1}`;
    $('mindName').textContent=level.name;
    $('sessionCount').textContent=state.stats.sessions;
    const rate=state.stats.answers ? Math.round(state.stats.correct/state.stats.answers*100) : 0;
    $('acceptRate').textContent=`${rate}%`;
    $('startStats').hidden=state.stats.sessions===0;
  }
  function showScreen(id){
    screens.forEach(s=>s.classList.toggle('active',s.id===id));
    window.scrollTo({top:0,behavior:'auto'});
  }
  function shuffle(items){
    const a=[...items];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function beep(freq=420,duration=.045,type='sine',gain=.025){
    if(!state.sound) return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;
      const ctx=beep.ctx||(beep.ctx=new Ctx());
      const osc=ctx.createOscillator(), g=ctx.createGain();
      osc.type=type;osc.frequency.value=freq;g.gain.value=gain;
      osc.connect(g);g.connect(ctx.destination);osc.start();g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);osc.stop(ctx.currentTime+duration);
    }catch{}
  }
  function haptic(ms=10){try{navigator.vibrate?.(ms);}catch{}}
  function toast(text){
    $('toast').textContent=text;$('toast').classList.add('show');
    clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.remove('show'),1100);
  }

  function startTraining(){
    state.mode='train';state.round=0;state.deck=shuffle(EVENTS).slice(0,12);state.correct=0;state.answers=0;state.locked=false;
    $('roundTotal').textContent=state.deck.length;
    showScreen('trainScreen');renderRound();
  }
  function renderRound(){
    const item=state.deck[state.round];
    if(!item) return finishTraining();
    state.accepted=false;state.locked=false;state.drag=null;
    $('stageLabel').textContent = state.round<4 ? 'LEVEL 1 / 受け止める' : state.round<8 ? 'LEVEL 2 / 分ける' : 'LEVEL 3 / 次へ進む';
    $('roundNow').textContent=state.round+1;
    $('progressBar').style.width=`${((state.round+1)/state.deck.length)*100}%`;
    $('sceneTag').textContent=item.scene;$('sceneIcon').textContent=item.icon;$('expectedText').textContent=item.expected;$('actualText').textContent=item.actual;
    $('realityCard').className='reality-card';$('realityCard').style.transform='';$('realityCard').style.opacity='1';
    $('controlPanel').className='control-panel';$('controlPanel').setAttribute('aria-hidden','true');
    $('feedback').className='feedback';$('feedback').setAttribute('aria-hidden','true');
    $('trainingKicker').textContent=state.round<4?'REALITY CARD':'ACCEPT → CONTROL';
    $('trainingTitle').innerHTML=state.round<4?'まず、起きたことを<br>確定させる。':'現実と戦わず、<br>動かせる方を見る。';
  }
  function acceptCard(){
    if(state.accepted||state.locked) return;
    state.accepted=true;state.locked=true;
    beep(520,.07,'triangle',.035);haptic(14);
    $('realityCard').classList.add('accepted');
    setTimeout(()=>{
      $('controlPanel').classList.add('open');$('controlPanel').setAttribute('aria-hidden','false');state.locked=false;
    },180);
  }
  function answerControl(choice){
    if(!state.accepted||state.locked) return;
    state.locked=true;state.answers++;
    const item=state.deck[state.round];
    const right=choice===item.control;
    if(right){state.correct++;beep(660,.07,'sine',.03);haptic(10);}else{beep(180,.09,'square',.018);haptic([12,30,12]);}
    $('feedbackMark').textContent=right?'✓':'↺';
    $('feedbackTitle').textContent=right ? (choice==='movable'?'次だけ動かす。':'ここは離していい。') : '現実と操作対象を分ける。';
    $('feedbackText').textContent=item.lesson;
    $('feedback').classList.add('show');$('feedback').setAttribute('aria-hidden','false');
    setTimeout(()=>{
      $('feedback').classList.remove('show');state.round++;renderRound();
    },right?900:1450);
  }
  function finishTraining(){
    state.stats.sessions++;state.stats.correct+=state.correct;state.stats.answers+=state.answers;saveStats();updateGlobalUI();
    const before=levelFor(Math.max(0,state.stats.sessions-1));
    const after=levelFor(state.stats.sessions);
    const rate=state.answers?Math.round(state.correct/state.answers*100):0;
    $('resultTitle').innerHTML=rate>=75?'現実はそのまま。<br>次だけ動かす。':'「起きた」と「動かせる」を<br>分ければいい。';
    $('resultCopy').textContent=`今回のCONTROL判定 ${rate}%。正解率より先に、「起きた事実と戦わない」順番を身体で覚える。`;
    $('resultLevel').textContent=after.index>before.index?`Lv.${before.index+1} ${before.name} → Lv.${after.index+1} ${after.name}`:`Lv.${after.index+1} ${after.name} / TRAIN ${state.stats.sessions}`;
    showScreen('resultScreen');beep(760,.12,'triangle',.04);
  }

  function startReal(){
    state.mode='real';$('realInput').value='';$('charCount').textContent='0';showScreen('realScreen');setTimeout(()=>$('realInput').focus(),260);
  }
  function acceptReal(){
    const text=$('realInput').value.trim() || '思い通りにいかなかった。';
    $('acceptedFact').textContent=text;
    showScreen('realControlScreen');beep(520,.07,'triangle',.035);haptic(12);
  }
  function finishReal(movable){
    $('resultLevel').textContent='「思い通りにいかない」を異常事態にしなかった。';
    if(movable){
      $('nextInput').value='';showScreen('nextScreen');setTimeout(()=>$('nextInput').focus(),260);return;
    }
    $('resultTitle').innerHTML='ここは、もう<br>動かさなくていい。';
    $('resultCopy').textContent='変えられないものを頭の中で変え続けない。今日の処理はここで終了。';
    showScreen('resultScreen');beep(610,.1,'sine',.03);
  }
  function finishNext(){
    const next=$('nextInput').value.trim();
    $('resultTitle').innerHTML='事実はそのまま。<br>次だけ動かす。';
    $('resultCopy').textContent=next?`次の一手：「${next}」これ以上、全部を取り返さなくていい。`:'次の一手を今決めないことも選べる。現実を元に戻そうとしなくていい。';
    showScreen('resultScreen');beep(680,.1,'triangle',.035);
  }

  function setupDrag(){
    const card=$('realityCard');
    const start=(x,y,pointerId)=>{if(state.accepted||state.locked)return;state.drag={x,y,dy:0,pointerId};card.classList.add('dragging');};
    const move=(x,y)=>{if(!state.drag)return;state.drag.dy=y-state.drag.y;const dy=Math.min(28,state.drag.dy);card.style.transform=`translateY(${dy}px) rotate(${Math.max(-3,Math.min(3,state.drag.dy/30))}deg)`;};
    const end=()=>{if(!state.drag)return;const dy=state.drag.dy;state.drag=null;card.classList.remove('dragging');if(dy<-72){acceptCard();}else{card.style.transform='';if(dy>45)toast('上へ。「起きた」を確定する');}};
    card.addEventListener('pointerdown',e=>{card.setPointerCapture?.(e.pointerId);start(e.clientX,e.clientY,e.pointerId);});
    card.addEventListener('pointermove',e=>{if(state.drag?.pointerId===e.pointerId)move(e.clientX,e.clientY);});
    card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
    card.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='Enter'||e.key===' '){e.preventDefault();acceptCard();}});
  }

  $('trainBtn').addEventListener('click',startTraining);
  $('realBtn').addEventListener('click',startReal);
  $('movableBtn').addEventListener('click',()=>answerControl('movable'));
  $('fixedBtn').addEventListener('click',()=>answerControl('fixed'));
  $('realAcceptBtn').addEventListener('click',acceptReal);
  $('realSkipBtn').addEventListener('click',acceptReal);
  $('realMovableBtn').addEventListener('click',()=>finishReal(true));
  $('realFixedBtn').addEventListener('click',()=>finishReal(false));
  $('nextDoneBtn').addEventListener('click',finishNext);
  $('nextSkipBtn').addEventListener('click',()=>{$('nextInput').value='';finishNext();});
  $('againBtn').addEventListener('click',startTraining);
  $('realInput').addEventListener('input',()=>{$('charCount').textContent=$('realInput').value.length;});
  $('soundBtn').addEventListener('click',()=>{
    state.sound=!state.sound;$('soundBtn').textContent=state.sound?'♪':'×';$('soundBtn').setAttribute('aria-pressed',String(state.sound));$('soundBtn').setAttribute('aria-label',state.sound?'音をオフにする':'音をオンにする');if(state.sound)beep(480,.05);
  });

  setupDrag();updateGlobalUI();
})();
