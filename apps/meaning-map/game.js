(() => {
  'use strict';

  const LENSES = {
    coherence: {
      name: '一貫性', command: '一貫性をつなげ',
      question: 'この行動を「自分の価値観・経験」とつなげる見方は？',
      color: '#72c9ff', prompt: '「これは、自分の何とつながっている？」と考える。'
    },
    purpose: {
      name: '目的', command: '目的をつなげ',
      question: 'この行動を「次の目標・未来」とつなげる見方は？',
      color: '#ffad5c', prompt: '「これが終わると、次に何ができる？」と考える。'
    },
    mattering: {
      name: '重要感', command: '重要感をつなげ',
      question: 'この行動を「誰かへの影響・貢献」とつなげる見方は？',
      color: '#ff7d9b', prompt: '「誰の、何を少し良くしている？」と考える。'
    }
  };

  const ROUNDS = [
    { lens:'coherence', activity:'毎月、同じ数字を確認する。', correct:'小さな変化を見逃さず、事実から判断する自分でいたい。', close:'この数字があれば、来月の打ち手を決められる。', wrong:['毎月やっているから、やるしかない。','数字が良ければ自分の価値も上がる。'], explain:'「事実から判断したい」という自分の姿勢につながった。' },
    { lens:'purpose', activity:'会議のために資料を作る。', correct:'論点を見える形にして、会議で決められる状態へ進める。', close:'参加者が迷わず話せる材料を渡している。', wrong:['きれいな資料なら必ず評価される。','頼まれた仕事には全部、大きな使命がある。'], explain:'資料そのものではなく、「決める」という次の状態につながった。' },
    { lens:'mattering', activity:'問い合わせに返信する。', correct:'相手が迷って止まっている時間を、少し短くできる。', close:'返信を終えると、自分の次の仕事へ進める。', wrong:['全員に好かれる返信を書かなければならない。','返信しない自分には価値がない。'], explain:'世界を変えなくても、誰かの小さな停滞を減らしている。' },
    { lens:'purpose', activity:'売れなかった商品の数字を見る。', correct:'次に「やらないこと」と「試すこと」を一つずつ決められる。', close:'うまくいかなかった事実も丁寧に扱う自分でいたい。', wrong:['失敗には必ず感動的な意味がある。','悪い数字を見れば、もっと自分を追い込める。'], explain:'結果を正当化せず、次の判断材料へつなげた。' },
    { lens:'coherence', activity:'新しいゲームを小さく試作する。', correct:'まず無数に試し、当たりを見つけて育てる自分のやり方と合っている。', close:'遊んだ人に、新しい体験を一つ渡せる。', wrong:['新しいことだけが、古い仕事より価値がある。','完成するまで見せない自分でいたい。'], explain:'行動が、自分の経験からできた成功法則とつながった。' },
    { lens:'mattering', activity:'同じ作業を自動化する。', correct:'未来の自分と仲間が、単純作業に使う時間を減らせる。', close:'空いた時間で、より大切な判断に進める。', wrong:['効率化できない人より自分は優秀だ。','すべてを自動化すれば誰も疲れなくなる。'], explain:'貢献先には「未来の自分」も含めていい。' },
    { lens:'coherence', activity:'今日は仕事を切り上げて休む。', correct:'長く続けられる働き方と、暮らしの余白を守りたい。', close:'明日の判断力を戻して、次の仕事へ進みやすくする。', wrong:['疲れている日は、何もしない人間になる。','休めば必ずすべての問題が解決する。'], explain:'休むことも、大切にしたい生き方を守る行動になる。' },
    { lens:'mattering', activity:'頼まれた仕事を一つ断る。', correct:'抱え込みによる遅延を防ぎ、相手にも早く別の手段を選んでもらえる。', close:'本当に残す仕事に集中できる未来へ進む。', wrong:['断れば、相手の期待を全部裏切る。','自分の時間だけ守れれば相手はどうでもいい。'], explain:'境界線は、自分だけでなく相手の選択肢も守れる。' },
    { lens:'purpose', activity:'うまくいかなかった企画を整理する。', correct:'使える部分と捨てる部分を分け、次の企画をゼロから始めずに済む。', close:'積み上げを雑に捨てない自分でいたい。', wrong:['失敗を整理すれば、必ず成功に変わる。','過去に意味があったと証明するまで終われない。'], explain:'過去を美化せず、次に使える形へ変えた。' },
    { lens:'mattering', activity:'家族の話を、結論を急がず聞く。', correct:'相手が安心して自分の考えを言葉にできる時間を作る。', close:'身近な人を大切にする自分でいたい。', wrong:['正しい答えを出して相手を変えなければならない。','聞いてあげれば、相手は必ず感謝する。'], explain:'答えを出さなくても、安心して考えられる場は貢献になる。' },
    { lens:'purpose', activity:'一件だけメールを返す。', correct:'対人の未完了を一つ閉じ、頭の空きを取り戻せる。', close:'返事を待つ相手の不確実さを一つ減らせる。', wrong:['受信箱をゼロにすれば人生が整う。','全部返すまで休む資格はない。'], explain:'大きな使命ではなく、「次の状態」を作れば目的になる。' },
    { lens:'coherence', activity:'古い仕事の型を見直す。', correct:'一度作って終わりにせず、繰り返して磨く自分でいたい。', close:'次から同じ仕事を短い時間で終えられる。', wrong:['昔のやり方は全部間違っている。','改善し続けなければ自分の価値がなくなる。'], explain:'何を大切に働きたいかが、行動の一貫性になる。' }
  ];

  const $ = id => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const state = { round:0, score:0, combo:0, counts:{coherence:0,purpose:0,mattering:0}, used:[], current:null, timer:20, timerId:null, locked:false };
  const builder = { step:0, activity:'', coherence:'', purpose:'', mattering:'' };

  function show(id){ screens.forEach(s => s.classList.toggle('active', s.id === id)); }
  function shuffle(list){ const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  function padScore(n){ return String(n).padStart(4,'0'); }

  function startGame(){
    clearInterval(state.timerId);
    Object.assign(state,{round:0,score:0,combo:0,counts:{coherence:0,purpose:0,mattering:0},used:shuffle(ROUNDS).slice(0,9),current:null,timer:20,timerId:null,locked:false});
    $('score').textContent='0000'; $('combo').textContent='×0';
    show('game-screen'); nextRound();
  }

  function nextRound(){
    clearInterval(state.timerId);
    if(state.round>=9){ finishGame(); return; }
    state.current=state.used[state.round]; state.round+=1; state.locked=false; state.timer=20;
    const lens=LENSES[state.current.lens];
    $('round-current').textContent=state.round;
    $('progress-bar').style.width=`${((state.round-1)/9)*100}%`;
    $('lens-badge').textContent=lens.command;
    $('lens-badge').style.color=lens.color;
    $('lens-badge').style.background=`${lens.color}1f`;
    $('round-title').textContent=state.current.activity;
    $('question').textContent=lens.question;
    $('feedback').className='feedback';
    renderOptions(); updateMap(); startTimer();
  }

  function renderOptions(){
    const r=state.current;
    const items=[
      {text:r.correct,type:'correct'},
      {text:r.close,type:'close'},
      ...r.wrong.map(text=>({text,type:'wrong'}))
    ];
    const keys=['A','B','C','D'];
    $('options').innerHTML='';
    shuffle(items).forEach((item,i)=>{
      const btn=document.createElement('button'); btn.type='button'; btn.className='option'; btn.dataset.key=keys[i]; btn.textContent=item.text;
      btn.addEventListener('click',()=>answer(btn,item)); $('options').appendChild(btn);
    });
  }

  function startTimer(){
    $('timer').textContent='20'; $('timer-bar').style.width='100%'; $('timer-bar').style.background='var(--lime)';
    const started=performance.now();
    state.timerId=setInterval(()=>{
      const left=Math.max(0,20-(performance.now()-started)/1000); state.timer=left;
      $('timer').textContent=String(Math.ceil(left)); $('timer-bar').style.width=`${(left/20)*100}%`;
      if(left<=5) $('timer-bar').style.background='var(--orange)';
      if(left<=0) clearInterval(state.timerId);
    },100);
  }

  function answer(button,item){
    if(state.locked) return;
    const all=[...document.querySelectorAll('.option')];
    if(item.type!=='correct'){
      button.classList.add('wrong'); button.disabled=true; state.combo=0; $('combo').textContent='×0';
      const close=item.type==='close';
      showFeedback(false,close?'それも意味になる。ただし今回は別の線。':'それは、意味ではなく自分への圧力。',close?`今回は「${LENSES[state.current.lens].name}」へつなぐ選択肢を探そう。`:'評価・義務・無理な楽観ではなく、実際のつながりを探そう。',false);
      return;
    }
    state.locked=true; clearInterval(state.timerId); button.classList.add('correct'); all.forEach(b=>b.disabled=true);
    const tempo=Math.round(Math.max(0,state.timer)*5); state.combo+=1; state.counts[state.current.lens]+=1; state.score+=100+tempo+Math.min(100,(state.combo-1)*20);
    $('score').textContent=padScore(state.score); $('combo').textContent=`×${state.combo}`; $('progress-bar').style.width=`${(state.round/9)*100}%`;
    updateMap(true); showFeedback(true,`${LENSES[state.current.lens].name}がつながった。`,state.current.explain,true);
  }

  function showFeedback(ok,title,text,withNext){
    const box=$('feedback'); box.className=`feedback show${ok?'':' bad'}`; $('feedback-mark').textContent=ok?'✓':'↺'; $('feedback-title').textContent=title; $('feedback-text').textContent=text; $('next-button').style.display=withNext?'block':'none';
  }

  function updateMap(pulse=false){
    Object.keys(LENSES).forEach(key=>{
      $(`count-${key}`).textContent=state.counts[key];
      const node=document.querySelector(`[data-map="${key}"]`); node.classList.toggle('lit',state.counts[key]>0);
      if(pulse&&key===state.current.lens){ node.animate([{transform:key==='mattering'?'translateX(-50%) scale(1)':'scale(1)'},{transform:key==='mattering'?'translateX(-50%) scale(1.12)':'scale(1.12)'},{transform:key==='mattering'?'translateX(-50%) scale(1)':'scale(1)'}],{duration:420}); }
    });
  }

  function finishGame(){
    clearInterval(state.timerId); show('result-screen');
    $('result-coherence').textContent=state.counts.coherence; $('result-purpose').textContent=state.counts.purpose; $('result-mattering').textContent=state.counts.mattering; $('final-score').textContent=padScore(state.score);
    $('rank').textContent=state.score>=1750?'MEANING CARTOGRAPHER':state.score>=1450?'MEANING MAKER':'LINK FINDER';
    const weak=Object.keys(state.counts).sort((a,b)=>state.counts[a]-state.counts[b])[0];
    $('insight-title').textContent=`${LENSES[weak].name}の線を足すと、もっと立体的になる。`; $('insight-text').textContent=LENSES[weak].prompt;
    try{ localStorage.setItem('meaning-map-best',String(Math.max(Number(localStorage.getItem('meaning-map-best')||0),state.score))); }catch{}
  }

  function openBuilder(){ builder.step=0; builder.activity=''; builder.coherence=''; builder.purpose=''; builder.mattering=''; $('activity-input').value=''; $('saved-note').textContent=''; show('builder-screen'); showBuilderStep(0); }
  function showBuilderStep(step){ builder.step=step; document.querySelectorAll('.builder-step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===step)); $('builder-progress').style.width=`${Math.min(100,(step+1)*20)}%`; }
  function chooseBuilder(lens,value){ builder[lens]=value; if(lens==='coherence') showBuilderStep(2); else if(lens==='purpose') showBuilderStep(3); else renderPersonalMap(); }
  function renderPersonalMap(){
    $('personal-activity').textContent=builder.activity; $('personal-coherence').textContent=builder.coherence; $('personal-purpose').textContent=builder.purpose; $('personal-mattering').textContent=builder.mattering;
    $('personal-summary').textContent=`「${builder.activity}」は、${builder.coherence}。その先で${builder.purpose}。そして、${builder.mattering}。`;
    showBuilderStep(4);
  }
  function saveMap(){
    try{ localStorage.setItem('meaning-map-personal',JSON.stringify({...builder,savedAt:new Date().toISOString()})); $('saved-note').textContent='この端末に保存しました。'; }catch{ $('saved-note').textContent='保存できませんでした。'; }
  }

  $('start-button').addEventListener('click',startGame); $('next-button').addEventListener('click',nextRound); $('retry-button').addEventListener('click',startGame); $('real-button').addEventListener('click',openBuilder);
  $('builder-close').addEventListener('click',()=>show('result-screen'));
  document.querySelectorAll('.quick-picks button').forEach(btn=>btn.addEventListener('click',()=>{ $('activity-input').value=btn.textContent; }));
  document.querySelector('.builder-next').addEventListener('click',()=>{ const value=$('activity-input').value.trim(); if(!value){ $('activity-input').focus(); return; } builder.activity=value; showBuilderStep(1); });
  document.querySelectorAll('.builder-options').forEach(group=>{ const lens=group.dataset.builder; group.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>chooseBuilder(lens,btn.dataset.value))); });
  $('save-map').addEventListener('click',saveMap); $('builder-restart').addEventListener('click',openBuilder);
})();
