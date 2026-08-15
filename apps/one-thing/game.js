(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];

  const TASKS = [
    {title:'企画書を1枚仕上げる', icon:'▤', steps:['骨子を3つ置く','要点を文章にする','余計な部分を削る','読み直して閉じる']},
    {title:'返信を1件、最後まで返す', icon:'↗', steps:['相手の要点を読む','返答を1文で決める','必要情報だけ足す','送信して閉じる']},
    {title:'机の一区画を片づける', icon:'◇', steps:['対象を一区画に決める','不要な物を捨てる','戻す物を戻す','机面を空ける']},
    {title:'見積もりを1本完成させる', icon:'¥', steps:['条件を確認する','金額を入れる','抜けを確認する','送れる形にする']},
    {title:'資料を1ページ作り切る', icon:'▣', steps:['結論を一行にする','根拠を置く','図を整える','完成版にする']},
    {title:'メールを1通だけ処理する', icon:'✉', steps:['必要事項を拾う','返事を決める','本文を書く','送って閉じる']},
    {title:'タスクを1件だけ完了にする', icon:'✓', steps:['完了条件を決める','必要な作業をする','抜けを確認する','完了にする']},
    {title:'数字を1つだけ確定させる', icon:'#', steps:['見る指標を決める','元データを確認する','数字を確定する','記録して閉じる']},
    {title:'文章を300字だけ書き切る', icon:'Aa', steps:['主張を一つ決める','最初から書く','最後まで書く','一度だけ整える']}
  ];

  const TEMPTATIONS = [
    {kind:'mail', icon:'✉', title:'新着メール', sub:'いま見る？', badge:'3'},
    {kind:'chat', icon:'●', title:'メッセージ', sub:'既読つける？', badge:'7'},
    {kind:'news', icon:'≋', title:'気になる記事', sub:'2分で読めます'},
    {kind:'treasure', icon:'◆', title:'宝箱', sub:'今だけレア', badge:'!'},
    {kind:'npc', icon:'☺', title:'ちょっといい？', sub:'NPCが呼んでいる'},
    {kind:'urgent', icon:'!', title:'緊急っぽい通知', sub:'赤いだけかも', badge:'!'},
    {kind:'idea', icon:'✦', title:'いいアイデア', sub:'忘れる前に…'},
    {kind:'calendar', icon:'▦', title:'予定確認', sub:'今日どうだっけ'},
    {kind:'shop', icon:'◈', title:'限定セール', sub:'残り 00:59'},
    {kind:'social', icon:'♥', title:'反応がついた', sub:'+12 reactions', badge:'12'},
    {kind:'update', icon:'↑', title:'更新できます', sub:'今すぐ再起動'},
    {kind:'request', icon:'?', title:'確認お願い', sub:'1分だけでOK'},
    {kind:'call', icon:'☎', title:'着信', sub:'出る？', badge:'1'}
  ];

  const state = {
    round: 1,
    clears: 0,
    progress: 0,
    combo: 1,
    wip: 1,
    maxWip: 1,
    totalMaxWip: 1,
    ignored: 0,
    roundIgnored: 0,
    selected: null,
    temptationTimer: null,
    activeTemptations: new Map(),
    temptationSeq: 0,
    running: false,
    mistakes: 0,
    holding: false,
    holdRaf: 0,
    holdLast: 0,
    toneStep: 0
  };

  function showScreen(id){
    screens.forEach(s => s.classList.toggle('active', s.id === id));
  }

  function haptic(pattern=18){
    try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(_e){}
  }

  let audioCtx;
  function tone(freq=440, duration=.06, gain=.025, type='sine'){
    try{
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if(audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = gain;
      o.connect(g); g.connect(audioCtx.destination);
      const t = audioCtx.currentTime;
      g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(.0001,t+duration);
      o.start(t); o.stop(t+duration);
    }catch(_e){}
  }

  function toast(message,type=''){
    const el = $('toast');
    el.className = `toast ${type}`;
    el.textContent = message;
    void el.offsetWidth;
    el.classList.add('show');
  }

  function shuffle(arr){
    return [...arr].sort(() => Math.random() - .5);
  }

  function startRun(){
    Object.assign(state,{round:1,clears:0,progress:0,combo:1,wip:1,maxWip:1,totalMaxWip:1,ignored:0,roundIgnored:0,selected:null,mistakes:0,running:false,holding:false,holdLast:0,toneStep:0});
    clearTemptations(true);
    renderPick();
  }

  function renderPick(){
    stopTemptationLoop();
    state.running = false;
    $('pickRound').textContent = state.round;
    const choices = shuffle(TASKS).slice(0,3);
    const holder = $('taskChoices');
    holder.innerHTML = '';
    choices.forEach(task => {
      const b = document.createElement('button');
      b.className = 'choice-card';
      b.innerHTML = `<span class="choice-icon">${task.icon}</span><span><h3>${task.title}</h3><p>これだけを終わらせる</p></span><span class="choice-arrow">→</span>`;
      b.addEventListener('click', () => chooseTask(task));
      holder.appendChild(b);
    });
    showScreen('pickScreen');
  }

  function chooseTask(task){
    state.selected = task;
    state.progress = 0;
    state.combo = 1;
    state.wip = 1;
    state.maxWip = 1;
    state.roundIgnored = 0;
    state.holding = false; state.holdLast = 0; state.toneStep = 0;
    clearTemptations(true);
    $('roundNumber').textContent = state.round;
    $('clearCount').textContent = state.clears;
    $('mainTaskTitle').textContent = task.title;
    $('mainTaskIcon').textContent = task.icon;
    $('wipChips').innerHTML = `<span class="wip-chip">${task.title}</span>`;
    updateProgress();
    updateWip();
    showScreen('gameScreen');
    state.running = true;
    tone(520,.06,.035,'triangle');
    setTimeout(startTemptationLoop, 700);
  }

  function updateProgress(){
    const pct = Math.min(100, state.progress);
    $('progressBar').style.width = `${pct}%`;
    $('progressLabel').textContent = `${Math.round(pct)}%`;
    $('comboLabel').textContent = `集中 ×${state.combo.toFixed(1)}`;
    const stepIndex = Math.min(3, Math.floor(Math.min(99,state.progress)/25));
    if(state.selected) $('mainTaskStep').textContent = state.selected.steps[stepIndex];
  }

  function updateWip(){
    $('wipCount').textContent = state.wip;
    $('trayBadge').textContent = state.wip;
    const overloaded = state.wip > 1;
    $('wipCount').classList.toggle('danger',overloaded);
    $('wipTray').classList.toggle('overloaded', state.wip >= 3);
  }

  function startWork(e){
    if(!state.running || state.holding) return;
    if(e && e.preventDefault) e.preventDefault();
    state.holding = true;
    state.holdLast = performance.now();
    $('workBtn').classList.add('holding');
    $('workBtnText').textContent = 'そのまま。離さない。';
    haptic(10);
    state.holdRaf = requestAnimationFrame(workFrame);
  }

  function stopWork(){
    if(!state.holding) return;
    state.holding = false;
    cancelAnimationFrame(state.holdRaf);
    $('workBtn').classList.remove('holding');
    $('workBtnText').textContent = 'この一個を押し続ける';
  }

  function workFrame(now){
    if(!state.holding || !state.running) return;
    const dt = Math.min(.05, Math.max(0,(now - state.holdLast)/1000));
    state.holdLast = now;
    const speed = 14.2 + Math.min(2.4,(state.combo-1)*1.4);
    state.progress = Math.min(100,state.progress + speed*dt);
    state.combo = Math.min(3,state.combo + dt*.16);
    updateProgress();
    const step = Math.floor(state.progress/25);
    if(step > state.toneStep){
      state.toneStep = step;
      tone(330 + step*110,.055,.018,'square');
      haptic(7);
    }
    if(state.progress >= 100){
      stopWork();
      completeRound();
      return;
    }
    state.holdRaf = requestAnimationFrame(workFrame);
  }

  function startTemptationLoop(){
    stopTemptationLoop();
    const desired = 5 + state.round;
    const initial = Math.min(desired, 3 + state.round);
    for(let i=0;i<initial;i++) setTimeout(() => { if(state.running && state.activeTemptations.size < desired) spawnTemptation(); }, i*90);
    const base = Math.max(420, 1180 - state.round*105);
    const spawn = () => {
      if(!state.running) return;
      if(state.activeTemptations.size < desired) spawnTemptation();
      const jitter = base * (.72 + Math.random()*.5);
      state.temptationTimer = setTimeout(spawn,jitter);
    };
    state.temptationTimer = setTimeout(spawn, 380);
  }

  function stopTemptationLoop(){
    if(state.temptationTimer) clearTimeout(state.temptationTimer);
    state.temptationTimer = null;
  }

  function spawnTemptation(){
    const layer = $('temptationLayer');
    const dataPool = state.round < 3 ? TEMPTATIONS.filter(t => !['urgent','call','treasure'].includes(t.kind)) : TEMPTATIONS;
    const data = dataPool[Math.floor(Math.random()*dataPool.length)];
    const id = ++state.temptationSeq;
    const el = document.createElement('button');
    const r = Math.random();
    const sizeClass = state.round <= 2
      ? (r < .48 ? 'round' : 'small')
      : (r < .28 ? 'round' : (r < .72 ? 'small' : 'wide'));
    el.className = `temptation ${sizeClass} ${data.kind}`;
    const isRound = sizeClass === 'round';
    el.setAttribute('aria-label', `${data.title}。誘惑です。触るとWIPが増えます。`);
    el.innerHTML = isRound
      ? `<span class="tempt-icon">${data.icon}</span>${data.badge?`<span class="badge">${data.badge}</span>`:''}`
      : `<span class="tempt-icon">${data.icon}</span><strong>${data.title}</strong><small>${data.sub}</small>${data.badge?`<span class="badge">${data.badge}</span>`:''}`;

    const pos = randomTemptationPosition();
    el.style.left = `${pos.x}%`;
    el.style.top = `${pos.y}%`;
    el.style.rotate = `${(Math.random()*8-4).toFixed(1)}deg`;
    el.addEventListener('click', () => touchTemptation(id,el,data));
    layer.appendChild(el);

    const life = Math.max(1900, 5200 - state.round*380 + Math.random()*1700);
    const timeout = setTimeout(() => ignoreTemptation(id,el), life);
    state.activeTemptations.set(id,{el,timeout,data});
  }

  function randomTemptationPosition(){
    const calm = [
      {x:2+Math.random()*18,y:4+Math.random()*13},
      {x:68+Math.random()*16,y:5+Math.random()*13},
      {x:4+Math.random()*16,y:18+Math.random()*8},
      {x:70+Math.random()*15,y:19+Math.random()*8},
      {x:2+Math.random()*16,y:72+Math.random()*7},
      {x:70+Math.random()*15,y:72+Math.random()*7}
    ];
    const invasive = [
      {x:0+Math.random()*12,y:31+Math.random()*18},
      {x:73+Math.random()*10,y:33+Math.random()*18},
      {x:3+Math.random()*13,y:55+Math.random()*10},
      {x:72+Math.random()*12,y:55+Math.random()*10}
    ];
    const pool = state.round >= 4 ? calm.concat(invasive) : calm;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function ignoreTemptation(id,el){
    const entry = state.activeTemptations.get(id);
    if(!entry) return;
    state.activeTemptations.delete(id);
    state.ignored++;
    state.roundIgnored++;
    el.classList.add('expiring');
    setTimeout(()=>el.remove(),300);
    if(state.round >= 4 && Math.random()<.18) toast('見なくても、何も壊れなかった','good');
  }

  function touchTemptation(id,el,data){
    if(!state.running) return;
    const entry = state.activeTemptations.get(id);
    if(!entry) return;
    clearTimeout(entry.timeout);
    state.activeTemptations.delete(id);
    state.wip++;
    state.maxWip = Math.max(state.maxWip,state.wip);
    state.totalMaxWip = Math.max(state.totalMaxWip,state.wip);
    state.mistakes++;
    stopWork();
    state.combo = 1;
    state.progress = Math.max(0,state.progress - 6);
    updateProgress();
    updateWip();
    el.classList.add('touched');
    setTimeout(()=>el.remove(),380);
    addWipChip(data.title);
    $('mainTask').classList.remove('hit');
    void $('mainTask').offsetWidth;
    $('mainTask').classList.add('hit');
    toast(`WIP +1 「${data.title}」を開いた`,'bad');
    tone(120,.14,.045,'sawtooth');
    haptic([35,25,35]);
  }

  function addWipChip(title){
    const chip = document.createElement('span');
    chip.className = 'wip-chip bad';
    chip.textContent = title;
    $('wipChips').appendChild(chip);
  }

  function clearTemptations(immediate=false){
    state.activeTemptations.forEach(({el,timeout}) => {
      clearTimeout(timeout);
      if(immediate) el.remove();
      else { el.classList.add('expiring'); setTimeout(()=>el.remove(),300); }
    });
    state.activeTemptations.clear();
    $('temptationLayer').innerHTML = '';
  }

  function completeRound(){
    state.running = false;
    stopWork();
    stopTemptationLoop();
    clearTemptations(false);
    state.clears++;
    $('clearCount').textContent = state.clears;
    $('roundMaxWip').textContent = state.maxWip;
    $('ignoredCount').textContent = state.roundIgnored;
    if(state.maxWip === 1){
      $('clearTitle').textContent = '一個のまま、終わった。';
      $('clearMessage').textContent = 'WIPを増やさなかった。これが最短ルート。';
    }else if(state.maxWip <= 3){
      $('clearTitle').textContent = '戻って、終わらせた。';
      $('clearMessage').textContent = '途中で開いても、主役に戻れば完了できる。';
    }else{
      $('clearTitle').textContent = '散らかった。でも終わった。';
      $('clearMessage').textContent = '次は「開かない」だけで、もっと軽くなる。';
    }
    $('nextRoundBtn').textContent = state.round >= 6 ? '集中レポートを見る' : '次の一個へ';
    burst();
    tone(660,.09,.04,'triangle'); setTimeout(()=>tone(880,.11,.035,'triangle'),90);
    haptic([20,40,60]);
    setTimeout(()=>showScreen('roundClearScreen'),260);
  }

  function burst(){
    const box = $('clearBurst');
    box.innerHTML='';
    for(let i=0;i<28;i++){
      const s=document.createElement('span');
      s.className='spark';
      s.style.left='50%';s.style.top='44%';
      const a=Math.random()*Math.PI*2, d=70+Math.random()*170;
      s.style.setProperty('--dx',`${Math.cos(a)*d}px`);
      s.style.setProperty('--dy',`${Math.sin(a)*d}px`);
      s.style.animationDelay=`${Math.random()*.15}s`;
      box.appendChild(s);
    }
  }

  function nextRound(){
    if(state.round >= 6){ showResult(); return; }
    state.round++;
    renderPick();
  }

  function showResult(){
    const base = 100;
    const penalty = Math.min(70, state.mistakes*5 + Math.max(0,state.totalMaxWip-1)*3);
    const bonus = Math.min(20,Math.floor(state.ignored/5));
    const score = Math.max(30,Math.min(100,base-penalty+bonus));
    $('resultClears').textContent = state.clears;
    $('resultMaxWip').textContent = state.totalMaxWip;
    $('resultIgnored').textContent = state.ignored;
    $('resultScore').textContent = score;
    if(state.totalMaxWip === 1){
      $('resultCopy').innerHTML='通知は消えなくても、仕事は終わる。<br><strong>あなたはWIPを1のまま通した。</strong>';
    }else if(state.totalMaxWip <= 3){
      $('resultCopy').innerHTML='気が散ることより、戻ることの方が大事。<br><strong>次は「開く前」に一回だけ止まろう。</strong>';
    }else{
      $('resultCopy').innerHTML='気になるものを全部開くと、主役が小さくなる。<br><strong>集中力は、終わるまで増やさない力だ。</strong>';
    }
    const best = getBest();
    if(score>best) setBest(score);
    updateBest();
    showScreen('resultScreen');
  }

  function getBest(){
    try{return Number(localStorage.getItem('oneThingBest')||0)}catch(_e){return 0}
  }
  function setBest(score){
    try{localStorage.setItem('oneThingBest',String(score))}catch(_e){}
  }
  function updateBest(){
    const best = getBest();
    $('bestScore').textContent = best ? `BEST FOCUS  ${best}` : '';
  }

  $('startBtn').addEventListener('click',startRun);
  $('howBtn').addEventListener('click',()=>showScreen('howScreen'));
  $('howStartBtn').addEventListener('click',startRun);
  $('quitFromPick').addEventListener('click',()=>showScreen('titleScreen'));
  $('workBtn').addEventListener('pointerdown',startWork);
  window.addEventListener('pointerup',stopWork);
  window.addEventListener('pointercancel',stopWork);
  $('workBtn').addEventListener('keydown',(e)=>{ if((e.key===' '||e.key==='Enter')&&!state.holding) startWork(e); });
  $('workBtn').addEventListener('keyup',(e)=>{ if(e.key===' '||e.key==='Enter') stopWork(); });
  $('nextRoundBtn').addEventListener('click',nextRound);
  $('retryBtn').addEventListener('click',startRun);
  $('backTitleBtn').addEventListener('click',()=>showScreen('titleScreen'));

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) stopTemptationLoop();
    else if(state.running) startTemptationLoop();
  });

  updateBest();
})();
