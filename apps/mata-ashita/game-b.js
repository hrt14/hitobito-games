  const battleDefs={
    pigeon:{name:'せかせか鳩',emoji:'🐦',hp:18,line:'ものすごく急いでいる。',tryCount:0},
  };

  function startBattle(id){
    const def=battleDefs[id];
    state.battle={id,hp:def.hp,maxHp:def.hp,tryCount:0,turn:0};
    state.movement.x=state.movement.y=0;
    battleLayer.classList.remove('hidden');
    $('#enemyName').textContent=def.name; $('#enemyArt').textContent=def.emoji; $('#enemyLine').textContent=def.line;
    $('#battleLog').textContent=`${def.name}が道を急いでいる。`;
    updateBattleUI();
  }

  function updateBattleUI(){
    $('#hpText').textContent=`${Math.max(0,state.player.hp)} / ${state.player.maxHp}`;
    $('#shockText').textContent=state.player.shock;
  }

  function battleAction(action){
    const b=state.battle; if(!b) return;
    const log=$('#battleLog');
    if(action==='attack'){
      const dmg=7+Math.floor(Math.random()*4); b.hp-=dmg; log.textContent=`傘ではらった！ ${dmg}くらい効いた。`;
    } else if(action==='try'){
      b.tryCount++;
      if(b.tryCount===1){ log.textContent='道をゆずってみた。鳩は逆に困っている。'; b.hp-=3; }
      else { log.textContent='「急がなくていいよ」と言った。鳩は立ち止まった。'; b.hp=0; }
    } else {
      const gum=state.bag.find(i=>i.name==='10円ガム'&&i.count>0);
      if(gum){ gum.count--; state.player.shock=Math.max(0,state.player.shock-4); log.textContent='10円ガムをかんだ。なんとなく落ち着いた。'; }
      else { log.textContent='使えそうなものがない。'; return; }
    }
    updateBattleUI();
    if(b.hp<=0){ setTimeout(winBattle,650); return; }
    setTimeout(enemyTurn,620);
  }

  function enemyTurn(){
    if(!state.battle) return;
    const lines=['鳩は時計を見た。時計はしていない。','鳩が早歩きでぶつかってきた！','鳩は「間に合わない！」という顔をした。'];
    const dmg=3+Math.floor(Math.random()*4); state.player.shock+=dmg;
    $('#battleLog').textContent=`${lines[state.battle.turn%lines.length]} どうよう +${dmg}`;
    state.battle.turn++;
    if(state.player.shock>=12){state.player.hp=Math.max(1,state.player.hp-4);state.player.shock=Math.max(3,state.player.shock-7);}
    updateBattleUI();
  }

  function winBattle(){
    const id=state.battle.id; state.flags.add(`${id}Defeated`); state.battle=null; battleLayer.classList.add('hidden');
    state.player.shock=0; updateBattleUI();
    const e=state.entities.find(x=>x.id==='pigeon'); if(e){e.el.style.opacity='.42';e.el.querySelector('.npc-label').textContent='落ち着いた鳩';}
    if(state.flags.has('minatoJoined')) startDialogue(dialogues.pigeonAfter); else flashHint('鳩は少し落ち着いた');
  }

  document.querySelectorAll('.battle-actions button').forEach(b=>b.addEventListener('click',()=>battleAction(b.dataset.action)));

  function nearestEntity(){
    let best=null,bestD=999;
    for(const e of state.entities){
      if(e.id==='pigeon'&&state.flags.has('pigeonDefeated')) continue;
      const d=distance(state.player,e); if(d<bestD){best=e;bestD=d;}
    }
    return bestD<88?best:null;
  }

  function updateNearby(){
    state.nearby=nearestEntity();
    for(const e of state.entities) e.el.classList.toggle('near',e===state.nearby);
    if(state.nearby){ talkBtn.classList.remove('hidden'); talkBtn.textContent=state.nearby.battle&&!state.flags.has(`${state.nearby.battle}Defeated`)?'むきあう':'はなす'; }
    else talkBtn.classList.add('hidden');
  }
  talkBtn.addEventListener('click',()=>state.nearby&&interact(state.nearby));

  function isBlocked(x,y){
    if(x<35||x>WORLD.w-35||y<35||y>WORLD.h-35) return true;
    const solids=[
      [75,850,295,215],[800,850,290,225],[55,335,330,230],[370,70,350,275],[795,125,220,220],[1140,470,300,235],
      [1005,0,220,300],[1005,405,220,240]
    ];
    return solids.some(([sx,sy,sw,sh])=>x>sx-18&&x<sx+sw+18&&y>sy-18&&y<sy+sh+18);
  }

  function update(dt){
    if(!state.started||state.dialogue||state.battle||state.cleared) return;
    let dx=state.movement.x,dy=state.movement.y; const mag=Math.hypot(dx,dy);
    if(mag>.05){
      dx/=Math.max(1,mag);dy/=Math.max(1,mag);
      const nx=state.player.x+dx*state.player.speed*dt,ny=state.player.y+dy*state.player.speed*dt;
      if(!isBlocked(nx,state.player.y)) state.player.x=nx;
      if(!isBlocked(state.player.x,ny)) state.player.y=ny;
      state.player.el.classList.add('walking');
      if(state.companion){
        const tx=state.player.x-dx*40,ty=state.player.y-dy*40; state.companion.x+=(tx-state.companion.x)*Math.min(1,dt*5);state.companion.y+=(ty-state.companion.y)*Math.min(1,dt*5);ensureCompanion();
      }
      state.timeMinutes += dt*.4;
    } else state.player.el.classList.remove('walking');
    updatePlayerEl(); updateCamera(); updateNearby(); updateClock();
  }

  function updateCamera(){
    const vw=viewport.clientWidth,vh=viewport.clientHeight;
    const tx=Math.max(0,Math.min(WORLD.w-vw,state.player.x-vw/2));
    const ty=Math.max(0,Math.min(WORLD.h-vh,state.player.y-vh/2));
    state.camera.x += (tx-state.camera.x)*.14; state.camera.y += (ty-state.camera.y)*.14;
    worldEl.style.transform=`translate(${-state.camera.x}px,${-state.camera.y}px)`;
  }
  function updateClock(){
    const m=Math.floor(state.timeMinutes);$('#clock').textContent=`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  }

  function loop(t){const dt=Math.min(.035,(t-state.lastTime)/1000);state.lastTime=t;update(dt);requestAnimationFrame(loop)}

  const zone=$('#joystickZone'),base=$('#joystickBase'),knob=$('#joystickKnob'); let joyId=null,origin={x:0,y:0};
  zone.addEventListener('pointerdown',e=>{if(state.dialogue||state.battle) return;joyId=e.pointerId;origin={x:e.clientX,y:e.clientY};base.style.left=`${e.clientX}px`;base.style.top=`${e.clientY-zone.getBoundingClientRect().top}px`;base.classList.remove('hidden');zone.setPointerCapture(e.pointerId);});
  zone.addEventListener('pointermove',e=>{if(e.pointerId!==joyId)return;let dx=e.clientX-origin.x,dy=e.clientY-origin.y;const m=Math.hypot(dx,dy),max=40;if(m>max){dx=dx/m*max;dy=dy/m*max;}knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;state.movement.x=dx/max;state.movement.y=dy/max;});
  const endJoy=e=>{if(e.pointerId!==joyId)return;joyId=null;state.movement.x=state.movement.y=0;base.classList.add('hidden');knob.style.transform='translate(-50%,-50%)';}; zone.addEventListener('pointerup',endJoy);zone.addEventListener('pointercancel',endJoy);

  const keys=new Set(); window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){keys.add(e.key.toLowerCase());e.preventDefault();syncKeys();} if((e.key===' '||e.key==='Enter')&&state.nearby&&!state.dialogue) interact(state.nearby);}); window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());syncKeys();});
  function syncKeys(){state.movement.x=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);state.movement.y=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0)}

  function flashHint(text){hintEl.textContent=text;hintEl.classList.remove('hidden');clearTimeout(flashHint.t);flashHint.t=setTimeout(()=>hintEl.classList.add('hidden'),2400)}

  $('#bagBtn').addEventListener('click',()=>{renderBag();$('#bagPanel').classList.remove('hidden')});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).classList.add('hidden')));
  function renderBag(){
    $('#bagList').innerHTML=state.bag.map(i=>`<div class="bag-item"><span>${i.emoji} ${i.name}${i.count>1?` ×${i.count}`:''}</span><small>${i.note}</small></div>`).join('') || '<p>からっぽ。</p>';
  }

  $('#walkAgainBtn').addEventListener('click',()=>{state.cleared=false;$('#ending').classList.add('hidden');flashHint('夕方は、まだ少し残っている。')});

  function startGame(){
    $('#titleScreen').classList.add('hidden');playScreen.classList.remove('hidden');state.started=true;buildWorld();updateCamera();requestAnimationFrame(()=>startDialogue([
      {speaker:'ミナト',face:'📞',text:'もしもし。'},
      {speaker:'ミナト',face:'📞',text:'今日さ。\nちょっと変なんだ。'},
      {speaker:'ミナト',face:'📞',text:'……明日、学校に来ないで。'},
      {speaker:'',face:'📞',text:'電話が切れた。'},
      ...dialogues.momIntro
    ]));
  }
  $('#startBtn').addEventListener('click',startGame);

  window.__MATA_ASHITA__={state,startGame,interact,startBattle,buyMilk,setObjective};

  requestAnimationFrame(loop);
