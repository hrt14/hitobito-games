(() => {
  'use strict';
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];

  const state = {
    thoughts: [],
    sorted: [],
    sortIndex: 0,
    eraseIndex: 0,
    eraseDistance: 0,
    eraseTarget: 980,
    startAt: 0,
    workRate: 87,
    sound: localStorage.getItem('brainEraserSound') !== 'off',
    shiftRemaining: 5,
    caught: 0,
    lastPoint: null,
  };

  const screens = $$('.screen');
  function show(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    window.scrollTo({top:0, behavior:'auto'});
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 1500);
  }

  function beep(freq=520, duration=.08, gain=.025) {
    if (!state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = beep.ctx || (beep.ctx = new Ctx());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq; g.gain.value = gain;
      o.connect(g); g.connect(ctx.destination); o.start();
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      o.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  function resetRun() {
    state.thoughts = [];
    state.sorted = [];
    state.sortIndex = 0;
    state.eraseIndex = 0;
    state.eraseDistance = 0;
    state.startAt = Date.now();
    state.workRate = 87;
    state.shiftRemaining = 5;
    state.caught = 0;
    renderThoughts();
    $('#thoughtInput').value = '';
    updateMeters();
  }

  function addThought(text) {
    text = text.trim().replace(/\s+/g,' ');
    if (!text) return;
    if (state.thoughts.length >= 3) return toast('3つまでで十分。');
    if (state.thoughts.some(t => t === text)) return toast('それはもう置いてあります。');
    state.thoughts.push(text);
    renderThoughts();
    beep(600,.05,.02);
  }

  function renderThoughts() {
    const wrap = $('#thoughtList');
    wrap.innerHTML = '';
    state.thoughts.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'thought-item';
      const span = document.createElement('span'); span.textContent = t;
      const del = document.createElement('button'); del.type='button'; del.textContent='×'; del.setAttribute('aria-label', `${t}を削除`);
      del.addEventListener('click', () => { state.thoughts.splice(i,1); renderThoughts(); });
      item.append(span, del); wrap.append(item);
    });
    $('#captureNextBtn').disabled = state.thoughts.length === 0;
  }

  function startSort() {
    if (!state.thoughts.length) state.thoughts = ['明日の仕事', 'まだ返ってこない返事', '今日の反省'];
    state.sorted = [];
    state.sortIndex = 0;
    renderSort();
    show('screen-sort');
  }

  function renderSort() {
    const text = state.thoughts[state.sortIndex];
    $('#sortText').textContent = text;
    $('#sortProgress').textContent = `${state.sortIndex + 1} / ${state.thoughts.length}`;
    $('#sortCard').animate([{transform:'translateX(18px) rotate(1deg)',opacity:.2},{transform:'rotate(-1.2deg)',opacity:1}],{duration:230,easing:'ease-out'});
  }

  function sortCurrent(bucket) {
    const text = state.thoughts[state.sortIndex];
    if (bucket === 'urgent') {
      state.pendingUrgent = text;
      show('screen-urgent');
      return;
    }
    state.sorted.push({text, bucket});
    beep(bucket === 'waiting' ? 420 : 560,.06,.02);
    state.sortIndex++;
    if (state.sortIndex >= state.thoughts.length) {
      state.eraseIndex = 0;
      show('screen-erase');
      setupEraseCard();
    } else renderSort();
  }

  const bucketCopy = {
    tomorrow: '「明日の自分へ」置いた。もう覚えてなくていい。',
    waiting: '今は相手・結果待ち。考えても状況は変わらない。',
    closed: 'もう記録した。頭の中で持ち続ける役目は終わり。'
  };

  function setupEraseCard() {
    const item = state.sorted[state.eraseIndex];
    if (!item) return beginShift();
    state.eraseDistance = 0;
    state.lastPoint = null;
    $('#eraseGuide').textContent = bucketCopy[item.bucket];
    $('#eraseProgress').textContent = `${state.eraseIndex + 1} / ${state.sorted.length}`;
    $('#eraserHint').style.opacity = '1';
    drawEraseCanvas(item.text);
  }

  function drawEraseCanvas(text) {
    const c = $('#eraseCanvas');
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, Math.floor(rect.width * dpr));
    c.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle = '#f2efdf';
    ctx.fillRect(0,0,rect.width,rect.height);
    ctx.fillStyle = '#151820';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 25px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif';
    wrapCanvasText(ctx,text,rect.width/2,rect.height/2,Math.min(310, rect.width - 70),38);
    ctx.fillStyle = 'rgba(21,24,32,.32)';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('今は持たない',rect.width/2,rect.height/2+72);
  }

  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight){
    const chars = [...text]; let line=''; const lines=[];
    chars.forEach(ch=>{ const test=line+ch; if(ctx.measureText(test).width>maxWidth && line){lines.push(line);line=ch}else line=test; });
    if(line) lines.push(line);
    const startY=y-((lines.length-1)*lineHeight)/2;
    lines.slice(0,3).forEach((l,i)=>ctx.fillText(l,x,startY+i*lineHeight));
  }

  function eraseAt(clientX, clientY) {
    const c = $('#eraseCanvas');
    const rect = c.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    if (x<0||y<0||x>rect.width||y>rect.height) return;
    const er = $('#eraserObject'); er.style.display='block'; er.style.left=`${x}px`; er.style.top=`${y}px`;
    $('#eraserHint').style.opacity = '0';
    if (state.lastPoint) state.eraseDistance += Math.hypot(x-state.lastPoint.x,y-state.lastPoint.y);
    state.lastPoint = {x,y};
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.save();
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=42;
    ctx.beginPath();
    if (eraseAt.prev) ctx.moveTo(eraseAt.prev.x,eraseAt.prev.y); else ctx.moveTo(x,y);
    ctx.lineTo(x,y); ctx.stroke(); ctx.restore();
    eraseAt.prev={x,y};
    if (state.eraseDistance >= state.eraseTarget) completeErase();
  }

  function completeErase() {
    if (completeErase.lock) return;
    completeErase.lock = true;
    state.workRate = Math.max(18, Math.round(87 - ((state.eraseIndex + 1) / state.sorted.length) * 69));
    updateMeters();
    beep(760,.12,.035);
    toast('頭から1つ降ろした。');
    const c = $('#eraseCanvas'); c.style.transition='opacity .35s'; c.style.opacity='0';
    setTimeout(()=>{
      c.style.opacity='1';
      state.eraseIndex++;
      completeErase.lock=false;
      if (state.eraseIndex >= state.sorted.length) beginShift(); else setupEraseCard();
    }, 520);
  }

  function updateMeters() {
    $('#workRate').textContent = `${state.workRate}%`;
    $('#workMeterFill').style.width = `${state.workRate}%`;
    const home = 87;
    $('#homeWorkRate').textContent = `${home}%`;
    $('#homeMeterFill').style.width = `${home}%`;
  }

  function beginShift() {
    show('screen-shift');
    state.shiftRemaining = 5; state.caught=0;
    $('#shiftRemaining').textContent = '5';
    $('#shiftWork').textContent = '18'; $('#shiftLife').textContent='82';
    renderLifeField();
  }

  const lifeItems = [
    ['湯気の立つお茶',true],['月',true],['本',true],['植物',true],['音楽',true],['散歩',true],['猫',true],['風',true],
    ['未返信',false],['売上',false],['資料',false],['明日の会議',false]
  ];
  function renderLifeField() {
    const field=$('#lifeField'); field.innerHTML='';
    const shuffled=[...lifeItems].sort(()=>Math.random()-.5).slice(0,10);
    const positions=[[6,8],[38,5],[69,12],[12,31],[53,30],[72,48],[7,58],[39,58],[61,72],[21,79]];
    shuffled.forEach((it,i)=>{
      const b=document.createElement('button'); b.type='button';
      b.className=`life-item ${it[1]?'life':'work'}`; b.textContent=it[0]; b.style.left=`${positions[i][0]}%`; b.style.top=`${positions[i][1]}%`; b.style.animationDelay=`${i*.17}s`;
      b.addEventListener('click',()=>tapLife(b,it[1])); field.append(b);
    });
  }
  function tapLife(el,isLife){
    if(isLife){
      if(el.classList.contains('caught'))return;
      el.classList.add('caught'); state.caught++; state.shiftRemaining=Math.max(0,5-state.caught);
      $('#shiftRemaining').textContent=state.shiftRemaining;
      const w=Math.max(4,18-state.caught*3); $('#shiftWork').textContent=w; $('#shiftLife').textContent=100-w;
      beep(540+state.caught*55,.055,.018);
      if(state.shiftRemaining===0)setTimeout(finishRun,500);
    } else {
      el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
      toast('それは仕事。今は見なくていい。'); beep(190,.08,.015);
    }
  }

  function finishRun(){
    const elapsed=Math.max(1,Math.round((Date.now()-state.startAt)/1000));
    const finalRate=4;
    state.workRate=finalRate;
    localStorage.setItem('brainEraserLastRate', String(finalRate));
    const stats=readStats();
    stats.plays++;
    stats.thoughts += state.sorted.length;
    stats.best = stats.best ? Math.min(stats.best,elapsed) : elapsed;
    localStorage.setItem('brainEraserStats',JSON.stringify(stats));
    $('#resultCount').textContent=state.sorted.length;
    $('#resultRate').textContent=finalRate;
    $('#resultTime').textContent=formatTime(elapsed);
    const list=$('#tomorrowBox'); list.innerHTML='';
    const tomorrow=state.sorted.filter(x=>x.bucket==='tomorrow');
    $('#tomorrowBoxWrap').style.display=tomorrow.length?'block':'none';
    tomorrow.forEach(x=>{const li=document.createElement('li');li.textContent=x.text;list.append(li)});
    show('screen-result'); beep(660,.16,.025);
  }

  function formatTime(s){ const m=Math.floor(s/60), r=s%60; return `${m}:${String(r).padStart(2,'0')}`; }
  function readStats(){ try{return Object.assign({plays:0,thoughts:0,best:0},JSON.parse(localStorage.getItem('brainEraserStats')||'{}'))}catch{return{plays:0,thoughts:0,best:0}} }
  function renderStats(){ const s=readStats(); $('#statPlays').textContent=s.plays; $('#statThoughts').textContent=s.thoughts; $('#statBest').textContent=s.best?formatTime(s.best):'--'; }

  $('#startBtn').addEventListener('click',()=>{resetRun();show('screen-capture');setTimeout(()=>$('#thoughtInput').focus(),250)});
  $('#statsBtn').addEventListener('click',()=>{renderStats();show('screen-stats')});
  $('#statsHomeBtn').addEventListener('click',()=>show('screen-home'));
  $('#thoughtForm').addEventListener('submit',e=>{e.preventDefault();addThought($('#thoughtInput').value);$('#thoughtInput').value='';});
  $$('#quickChips button').forEach(b=>b.addEventListener('click',()=>addThought(b.dataset.chip)));
  $('#captureNextBtn').addEventListener('click',startSort); $('#captureSkipBtn').addEventListener('click',startSort);
  $$('.choice-btn').forEach(b=>b.addEventListener('click',()=>sortCurrent(b.dataset.sort)));
  $('#urgentBackBtn').addEventListener('click',()=>{
    const text = state.pendingUrgent || state.thoughts[state.sortIndex];
    state.pendingUrgent = null;
    state.sorted.push({text, bucket:'tomorrow'});
    state.sortIndex++;
    beep(560,.06,.02);
    if (state.sortIndex >= state.thoughts.length) {
      state.eraseIndex = 0;
      show('screen-erase');
      setupEraseCard();
    } else {
      show('screen-sort');
      renderSort();
    }
  });
  $('#urgentHomeBtn').addEventListener('click',()=>show('screen-home'));
  $('#finishBtn').addEventListener('click',()=>show('screen-quiet'));
  $('#againBtn').addEventListener('click',()=>{resetRun();show('screen-capture')});
  $('#quietHomeBtn').addEventListener('click',()=>show('screen-home'));
  $('#soundBtn').addEventListener('click',()=>{state.sound=!state.sound;localStorage.setItem('brainEraserSound',state.sound?'on':'off');$('#soundBtn').classList.toggle('off',!state.sound);toast(state.sound?'音 ON':'音 OFF');if(state.sound)beep(560)});
  $('#soundBtn').classList.toggle('off',!state.sound);

  const stage=$('#eraserStage');
  stage.addEventListener('pointerdown',e=>{stage.setPointerCapture?.(e.pointerId);state.lastPoint=null;eraseAt.prev=null;eraseAt(e.clientX,e.clientY)});
  stage.addEventListener('pointermove',e=>{if(e.buttons===1||e.pointerType==='touch')eraseAt(e.clientX,e.clientY)});
  stage.addEventListener('pointerup',()=>{state.lastPoint=null;eraseAt.prev=null;$('#eraserObject').style.display='none'});
  stage.addEventListener('pointercancel',()=>{state.lastPoint=null;eraseAt.prev=null;$('#eraserObject').style.display='none'});
  window.addEventListener('resize',()=>{if($('#screen-erase').classList.contains('active')&&state.sorted[state.eraseIndex])drawEraseCanvas(state.sorted[state.eraseIndex].text)});

  updateMeters();
})();
