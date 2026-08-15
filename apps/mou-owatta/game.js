(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const scenes = [
    {
      category:'日常',level:1,icon:'🥤',title:'ジュースをこぼした',fact:'机の上でジュースをこぼし、ノートの端が少し濡れた。',
      thoughts:[
        ['ノートの端が濡れた','fact'],['なんで自分はいつも雑なんだ','guess'],['濡れたページを乾かす','action']
      ],
      control:{text:'こぼしたという過去',correct:'no',action:'濡れたページを乾かす',reason:'過去は変えられない。直せる部分だけ直す。'},
      replays:['ちゃんと持っていれば…','もっと注意していれば…','また同じことをやるかも…']
    },
    {
      category:'仕事',level:1,icon:'💬',title:'会議で言い間違えた',fact:'会議中、数字を1つ言い間違えて、その場で訂正した。',
      thoughts:[['数字を1つ言い間違えた','fact'],['能力がないと思われた','guess'],['次回、数字だけ事前に確認する','action']],
      control:{text:'相手が自分をどう評価したか',correct:'outside',action:'次回、数字だけ事前に確認する',reason:'他人の評価は直接は操作できない。自分の準備だけ残す。'},
      replays:['変な空気になっていたかも…','あの人も気づいていた…','評価が下がったかもしれない…']
    },
    {
      category:'連絡',level:2,icon:'📱',title:'返信がまだ来ない',fact:'昨日送ったメッセージに、24時間返信が来ていない。',
      thoughts:[['24時間返信が来ていない','fact'],['怒っているに違いない','guess'],['急ぎなら要件だけ再送する','action']],
      control:{text:'相手が今すぐ返信するか',correct:'outside',action:'急ぎなら要件だけ再送する',reason:'返信のタイミングは相手次第。必要な連絡だけ自分で選べる。'},
      replays:['嫌われたのかな…','既読なのにわざと…','何かまずいことを言った？']
    },
    {
      category:'勉強',level:2,icon:'✏️',title:'試験で1問落とした',fact:'自己採点で、覚えていたはずの問題を1問間違えた。',
      thoughts:[['1問間違えた','fact'],['本番に弱い人間だ','guess'],['間違えた論点を1回だけ解き直す','action']],
      control:{text:'すでに提出した答案',correct:'no',action:'間違えた論点を1回だけ解き直す',reason:'答案は戻せない。次回の正答率につながる1回だけ残す。'},
      replays:['あそこを見直していれば…','点数が足りなかったら…','なんであれを忘れたんだ…']
    },
    {
      category:'対人',level:3,icon:'🧊',title:'店員の態度が冷たかった',fact:'会計のとき、店員は目を合わせず短い返事をした。',
      thoughts:[['店員は短い返事をした','fact'],['自分が何か失礼だった','guess'],['必要なら次回は別の店を選ぶ','action']],
      control:{text:'店員がなぜ冷たく見えたか',correct:'outside',action:'必要なら次回は別の店を選ぶ',reason:'理由は分からない。分からないものを物語で埋めない。'},
      replays:['自分だけ扱いが違った？','あの表情、絶対怒ってた…','何か変なことしたかな…']
    },
    {
      category:'SNS',level:3,icon:'⚡',title:'投稿に批判がついた',fact:'投稿に「その考えは違うと思う」というコメントが1件ついた。',
      thoughts:[['批判コメントが1件ついた','fact'],['みんな自分を馬鹿にしている','guess'],['必要なら内容だけ確認して修正する','action']],
      control:{text:'コメントした人の気持ち',correct:'outside',action:'必要なら内容だけ確認して修正する',reason:'相手の感情ではなく、使える情報があるかだけを見る。'},
      replays:['他の人も同じことを思ってる？','消したほうがよかった？','これから見られ方が変わるかも…']
    },
    {
      category:'仕事',level:4,icon:'📎',title:'上司に注意された',fact:'資料の表記ミスを指摘され、「次から確認して」と言われた。',
      thoughts:[['表記ミスを指摘された','fact'],['呆れられたに違いない','guess'],['提出前チェックを1項目追加する','action']],
      control:{text:'次の資料の確認手順',correct:'yes',action:'提出前チェックを1項目追加する',reason:'ここは変えられる。だから1個だけ仕組みにして終える。'},
      replays:['言い方が少し冷たかった…','前のミスも思い出されてる？','評価面談に響いたら…']
    },
    {
      category:'約束',level:4,icon:'🗓️',title:'約束を忘れた',fact:'約束の時間を30分過ぎて気づき、すぐ謝罪の連絡をした。',
      thoughts:[['30分遅れて気づいた','fact'],['信用を全部失った','guess'],['次回は前日に通知を入れる','action']],
      control:{text:'次回の通知設定',correct:'yes',action:'次回は前日に通知を入れる',reason:'謝罪後に残せるのは再発防止。罪悪感の長さは改善量ではない。'},
      replays:['もっと早く気づけたはず…','相当怒ってるよな…','もう誘われないかも…']
    },
    {
      category:'勝負',level:5,icon:'🏀',title:'大事な場面でミスした',fact:'試合終盤、同点の場面で自分のパスが相手に渡った。その後チームは敗れた。',
      thoughts:[['自分のパスが相手に渡った','fact'],['自分のせいで全部負けた','guess'],['次の練習で同じ状況を3回再現する','action']],
      control:{text:'終わった試合の結果',correct:'no',action:'次の練習で同じ状況を3回再現する',reason:'結果は戻らない。練習に変換できたら、試合の再生は終了。'},
      replays:['あの瞬間だけ戻れたら…','みんな責めてるかも…','別のパスなら勝てた…']
    },
    {
      category:'曖昧',level:5,icon:'…',title:'理由の分からない沈黙',fact:'相談したあと、相手は5秒ほど黙ってから「わかった」とだけ言った。',
      thoughts:[['相手は5秒ほど黙った','fact'],['内心では反対している','guess'],['必要なら後で意図だけ確認する','action']],
      control:{text:'沈黙の本当の意味',correct:'outside',action:'必要なら後で意図だけ確認する',reason:'意味は確定できない。確かめる必要がなければ、そのまま未確定で置く。'},
      replays:['あの沈黙、絶対何かある…','言わないだけで怒ってる？','本当は嫌だったのかも…']
    }
  ];

  const state = {stage:0, thought:0, correct:0,total:0,stops:0,replays:0,slots:0,locked:false,currentThoughts:[]};

  const screens = {start:$('#startScreen'),game:$('#gameScreen'),result:$('#resultScreen')};
  const phases = ['classifyPhase','controlPhase','savePhase','replayPhase','closePhase'];
  const typeNames = {fact:'事実',guess:'想像',action:'次にできること'};
  const controlOptions = [
    {id:'yes',label:'変えられる',sub:'自分の次の行動・準備・仕組み'},
    {id:'no',label:'もう変えられない',sub:'過去・終わった結果'},
    {id:'outside',label:'自分では決められない',sub:'相手の感情・評価・反応'}
  ];

  function showScreen(name){ Object.values(screens).forEach(s=>s.classList.remove('active')); screens[name].classList.add('active'); }
  function showPhase(id){ phases.forEach(p=>$('#'+p).classList.toggle('active',p===id)); }
  function scene(){ return scenes[state.stage]; }
  function renderSlots(){
    $('#slotDots').innerHTML='';
    for(let i=0;i<5;i++){ const d=document.createElement('i'); d.className='slot-dot'+(i<state.slots?' filled':''); $('#slotDots').append(d); }
  }
  function resetRun(){ state.stage=0;state.thought=0;state.correct=0;state.total=0;state.stops=0;state.replays=0;state.slots=0;state.locked=false;state.currentThoughts=[]; }
  function startGame(){ resetRun(); $('#hud').hidden=false; showScreen('game'); loadStage(); }

  function loadStage(){
    const s=scene(); state.thought=0;state.slots=0;state.locked=false; state.currentThoughts=[...s.thoughts].sort(()=>Math.random()-.5);
    $('#stageNo').textContent=state.stage+1; $('#sceneCategory').textContent=s.category; $('#sceneDifficulty').textContent='LEVEL '+s.level;
    $('#sceneIllustration').textContent=s.icon; $('#sceneTitle').textContent=s.title; $('#sceneFact').textContent=s.fact;
    setPhaseCopy('STEP 1','頭の中を仕分ける','出てきた言葉を「事実 / 想像 / 次にできること」に分けよう。');
    renderThought(); renderSlots(); showPhase('classifyPhase');
  }
  function setPhaseCopy(k,t,h){$('#phaseKicker').textContent=k;$('#phaseTitle').textContent=t;$('#phaseHelp').textContent=h;}
  function renderThought(){
    const s=scene(), item=state.currentThoughts[state.thought];
    $('#thoughtText').textContent=item[0]; $('#thoughtProgress').style.width=((state.thought)/state.currentThoughts.length*100)+'%';
    $('#feedback').textContent='';$('#feedback').className='feedback';
    $('#thoughtCard').className='thought-card';
  }
  function classify(type){
    if(state.locked)return; state.locked=true;
    const s=scene(), item=state.currentThoughts[state.thought], ok=item[1]===type; state.total++;
    if(ok){ state.correct++; $('#feedback').textContent='✓ '+typeNames[type]+'。'; $('#feedback').className='feedback good'; $('#thoughtCard').classList.add('correct'); }
    else { state.slots=Math.min(5,state.slots+1); renderSlots(); $('#feedback').textContent='これは「'+typeNames[item[1]]+'」。'; $('#feedback').className='feedback bad'; $('#thoughtCard').classList.add('wrong'); }
    setTimeout(()=>{
      state.thought++; state.locked=false;
      if(state.thought < state.currentThoughts.length) renderThought(); else startControl();
    }, ok?360:650);
  }
  function startControl(){
    const s=scene(); setPhaseCopy('STEP 2','変えられる範囲だけ拾う','考え続ける前に、コントロールできる範囲を切り分ける。');
    $('#controlObject').textContent=s.control.text; const box=$('#controlButtons'); box.innerHTML='';
    controlOptions.forEach(o=>{ const b=document.createElement('button'); b.dataset.id=o.id; b.innerHTML=`${o.label}<small>${o.sub}</small>`; b.onclick=()=>chooseControl(o.id,b); box.append(b); });
    showPhase('controlPhase');
  }
  function chooseControl(id,btn){
    if(state.locked)return; const s=scene();
    if(id!==s.control.correct){state.slots=Math.min(5,state.slots+1);renderSlots();btn.style.borderColor='var(--danger)';btn.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260});return;}
    state.locked=true;btn.classList.add('correct-pulse');setTimeout(startSave,380);
  }
  function startSave(){
    const s=scene(); state.locked=false; setPhaseCopy('STEP 3','1個だけ保存する','反省を長くしない。次回に効くものを1つだけ残す。');
    $('#savedAction').textContent=s.control.action; $('#saveReason').textContent=s.control.reason; showPhase('savePhase');
  }
  function startReplay(){
    const s=scene(); state.replayIndex=0; setPhaseCopy('STEP 4','再生を終わらせる','新しい情報が増えないなら、考えること自体を止める。');
    $('#replayThought').textContent=s.replays[0]; $('#replayHint').textContent='新しい情報は増えましたか？ 同じ情報なら止める。'; showPhase('replayPhase');
  }
  function replayAgain(){
    const s=scene(); state.replays++; state.slots=Math.min(5,state.slots+1); renderSlots(); state.replayIndex=(state.replayIndex+1)%s.replays.length;
    $('#replayThought').textContent=s.replays[state.replayIndex]; $('#replayZone').classList.remove('overloaded'); void $('#replayZone').offsetWidth; $('#replayZone').classList.add('overloaded');
    const messages=['新しい事実は増えていない。物語だけが増えた。','まだ新情報はない。思考スロットだけ埋まる。','考える量は増えた。でも事実は増えていない。']; $('#replayHint').textContent=messages[Math.min(state.replays-1,2)];
    if(state.slots>=5) $('#replayHint').textContent='思考スロット満杯。今こそ停止。';
  }
  function stopReplay(){ state.stops++; state.slots=Math.max(0,state.slots-2); renderSlots(); finishStage(); }
  function finishStage(){
    const s=scene(); setPhaseCopy('CLEAR','終了動作','改善だけ残して、出来事そのものは画面の外へ。');
    $('#closeSummary').textContent='保存：「'+s.control.action+'」'; showPhase('closePhase');
  }
  function next(){
    state.stage++; if(state.stage>=scenes.length) return result(); loadStage();
  }
  function result(){
    $('#hud').hidden=true; const accuracy=state.total?state.correct/state.total:0; const score=Math.max(20,Math.min(100,Math.round(50+accuracy*35+state.stops*1.5-state.replays*4)));
    $('#scoreValue').textContent=score; $('#factScore').textContent=`${state.correct} / ${state.total}`; $('#stopScore').textContent=`${state.stops} 回`; $('#replayScore').textContent=`${state.replays} 回`; showScreen('result');
  }

  $('#startBtn').addEventListener('click',startGame); $('#retryBtn').addEventListener('click',startGame);
  $$('.choice-btn').forEach(b=>b.addEventListener('click',()=>classify(b.dataset.type)));
  $('#toReplayBtn').addEventListener('click',startReplay); $('#stopBtn').addEventListener('click',stopReplay); $('#againBtn').addEventListener('click',replayAgain); $('#replayBtn').addEventListener('click',replayAgain); $('#nextBtn').addEventListener('click',next);

  window.__MOU_OWATTA__={scenes,state,startGame};
})();
