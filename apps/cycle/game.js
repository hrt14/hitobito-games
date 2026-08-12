(() => {
  'use strict';

  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const els = {
    life: document.getElementById('lifeScore'),
    balance: document.getElementById('balanceScore'),
    cycle: document.getElementById('cycleScore'),
    nutrient: document.getElementById('nutrientValue'),
    tray: document.getElementById('speciesTray'),
    legend: document.getElementById('legend'),
    message: document.getElementById('message'),
    intro: document.getElementById('intro'),
    complete: document.getElementById('complete'),
    best: document.getElementById('bestBalance'),
    sound: document.getElementById('soundBtn')
  };

  const SPECIES = [
    { key:'grass', name:'草', sub:'生産者', icon:'♒', color:'#9ed36b', target:72, unlock:()=>true, lock:'最初から' },
    { key:'insect', name:'バッタ', sub:'草を食べる', icon:'⌁', color:'#d8c86b', target:34, unlock:s=>s.grass>=38, lock:'草 38+' },
    { key:'frog', name:'カエル', sub:'虫を食べる', icon:'●', color:'#83c786', target:18, unlock:s=>s.insect>=14, lock:'バッタ 14+' },
    { key:'snake', name:'ヘビ', sub:'カエルを食べる', icon:'∿', color:'#c1af78', target:9, unlock:s=>s.frog>=7, lock:'カエル 7+' },
    { key:'hawk', name:'タカ', sub:'頂点捕食者', icon:'⌃', color:'#d9b08c', target:5, unlock:s=>s.snake>=4, lock:'ヘビ 4+' },
    { key:'fungi', name:'菌類', sub:'死を土へ還す', icon:'♧', color:'#c7a6d9', target:24, unlock:s=>s.detritus>=8, lock:'死骸 8+' }
  ];

  const state = {
    grass: 18, insect: 0, frog: 0, snake: 0, hawk: 0, fungi: 0,
    nutrients: 46, detritus: 1, moisture: 42, sunlight: 55,
    introduced: { grass:true },
    score: 0, bestBalance: 0, completionHold: 0, completed: false,
    started: false, fx: true, time: 0
  };

  const sprites = {};
  const terrainSeeds = Array.from({length:90}, (_,i)=>({
    x: pseudo(i*7.13), y: pseudo(i*13.71), a:.1+pseudo(i*4.17)*.6
  }));

  function pseudo(n){ return Math.abs(Math.sin(n*12.9898)*43758.5453)%1; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function fmt(v){ return Math.max(0,Math.round(v)); }

  function resize(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width*dpr);
    canvas.height = Math.floor(rect.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize);
  resize();

  function speciesCard(sp){
    const b = document.createElement('button');
    b.className = 'species-card';
    b.dataset.species = sp.key;
    b.innerHTML = `<span class="species-icon" style="color:${sp.color}">${sp.icon}</span><span class="pop">0</span><b>${sp.name}</b><small>${sp.sub}</small><span class="lock-copy"></span><span class="foodline" style="background:${sp.color}"></span>`;
    b.addEventListener('click', ()=>introduce(sp.key));
    els.tray.appendChild(b);
  }
  SPECIES.forEach(speciesCard);

  SPECIES.forEach(sp=>{
    const l = document.createElement('span');
    l.className = 'legend-dot';
    l.innerHTML = `<i style="background:${sp.color}"></i>${sp.name}`;
    els.legend.appendChild(l);
  });

  function introduce(key){
    if(!state.started) return;
    const sp = SPECIES.find(s=>s.key===key);
    if(!sp || !sp.unlock(state)) {
      whisper(`${sp.name}は、まだこの草原では暮らせない。`);
      return;
    }
    state.introduced[key] = true;
    const amounts = { grass:11, insect:8, frog:4, snake:2.4, hawk:1.5, fungi:7 };
    state[key] += amounts[key];
    pulseSprite(key);
    const copy = {
      grass:'草が広がる。食べる命を支える土台だ。',
      insect:'バッタが入った。草が、動物の命へ変わり始める。',
      frog:'カエルが入った。増えすぎた虫を食べ始める。',
      snake:'ヘビが入った。食べる側にも、食べられる側ができた。',
      hawk:'タカが来た。草原の頂点まで食物連鎖が伸びた。',
      fungi:'菌類が入った。死が土へ還り、循環が閉じ始める。'
    };
    whisper(copy[key]);
  }

  document.querySelectorAll('.action-card').forEach(btn=>btn.addEventListener('click',()=>{
    if(!state.started) return;
    const a=btn.dataset.action;
    if(a==='sun'){
      state.sunlight=clamp(state.sunlight+24,0,100);
      state.grass+=4;
      whisper('光が差した。草が一斉に伸びる。');
    } else if(a==='rain'){
      state.moisture=clamp(state.moisture+28,0,100);
      state.nutrients=clamp(state.nutrients+5,0,100);
      whisper('雨が土を潤した。草原の回復力が上がる。');
    } else {
      state.detritus+=7;
      whisper(state.fungi>0?'落ち葉を菌類が分解し、土へ返していく。':'落ち葉が積もった。これを土へ戻す生き物が必要だ。');
    }
    btn.animate([{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:180});
  }));

  document.getElementById('startBtn').addEventListener('click',()=>{
    state.started=true;
    els.intro.classList.remove('is-open');
    whisper('陽だまりや雨を使って、まず草を増やそう。');
  });
  document.getElementById('continueBtn').addEventListener('click',()=>els.complete.classList.remove('is-open'));
  els.sound.addEventListener('click',()=>{
    state.fx=!state.fx;
    els.sound.textContent=state.fx?'✦':'·';
    els.sound.style.opacity=state.fx?'1':'.45';
  });

  let msgTimer;
  function whisper(text){
    clearTimeout(msgTimer);
    els.message.querySelector('strong').textContent=text;
    els.message.classList.add('is-visible');
    msgTimer=setTimeout(()=>els.message.classList.remove('is-visible'),2800);
  }

  function simulate(dt){
    if(!state.started) return;
    state.time += dt;

    state.sunlight += (54-state.sunlight)*dt*.045;
    state.moisture += (48-state.moisture)*dt*.035;

    // Producer growth is limited by soil nutrients, light, water and crowding.
    const env = (state.nutrients/100)*.45 + (state.sunlight/100)*.3 + (state.moisture/100)*.25;
    const grassGrowth = 2.35*env*(1-state.grass/125);
    const herbivory = .026*state.insect*state.grass/(22+state.grass);
    const grassNaturalDeath = state.grass*.006;
    state.grass += (grassGrowth-herbivory-grassNaturalDeath)*dt;
    state.nutrients -= Math.max(0,grassGrowth)*.042*dt;
    state.detritus += grassNaturalDeath*.18*dt;

    const insectBirth = .13*state.insect*(state.grass/(20+state.grass));
    const insectPred = .045*state.frog*state.insect/(8+state.insect);
    const insectDeath = .038*state.insect;
    state.insect += (insectBirth-insectPred-insectDeath)*dt;
    state.detritus += insectDeath*.15*dt;

    const frogBirth = .105*state.frog*(state.insect/(10+state.insect));
    const frogPred = .055*state.snake*state.frog/(5+state.frog);
    const frogDeath = .034*state.frog;
    state.frog += (frogBirth-frogPred-frogDeath)*dt;
    state.detritus += frogDeath*.3*dt;

    const snakeBirth = .085*state.snake*(state.frog/(5+state.frog));
    const snakePred = .062*state.hawk*state.snake/(2.8+state.snake);
    const snakeDeath = .03*state.snake;
    state.snake += (snakeBirth-snakePred-snakeDeath)*dt;
    state.detritus += snakeDeath*.55*dt;

    const hawkBirth = .055*state.hawk*(state.snake/(3+state.snake));
    const hawkDeath = .032*state.hawk;
    state.hawk += (hawkBirth-hawkDeath)*dt;
    state.detritus += hawkDeath*.8*dt;

    const fungiGrowth = .12*state.fungi*(state.detritus/(7+state.detritus));
    const fungiDeath = .048*state.fungi;
    const decomposition = Math.min(state.detritus, .16*state.fungi*state.detritus/(6+state.detritus));
    state.fungi += (fungiGrowth-fungiDeath)*dt;
    state.detritus -= decomposition*dt;
    state.nutrients += decomposition*.95*dt;

    ['grass','insect','frog','snake','hawk','fungi'].forEach(k=>state[k]=clamp(state[k],0,180));
    state.detritus=clamp(state.detritus,0,90);
    state.nutrients=clamp(state.nutrients,2,100);

    // Ecological activity becomes LIFE score; a stable web scores faster.
    const balance = getBalance();
    const cycle = getCycle();
    state.score += dt*(.22 + balance/220 + cycle/260);
    state.bestBalance=Math.max(state.bestBalance,balance);

    const all = SPECIES.every(sp=>state.introduced[sp.key] && state[sp.key]>.35);
    if(all && balance>=70 && cycle>=80){
      state.completionHold += dt;
      if(state.completionHold>10 && !state.completed){
        state.completed=true;
        els.best.textContent=`${Math.round(state.bestBalance)}%`;
        els.complete.classList.add('is-open');
      }
    } else state.completionHold=Math.max(0,state.completionHold-dt*.6);
  }

  function getBalance(){
    const active=SPECIES.filter(sp=>state.introduced[sp.key]);
    if(!active.length) return 0;
    let sum=0;
    active.forEach(sp=>{
      const ratio=state[sp.key]/sp.target;
      sum += clamp(1-Math.abs(Math.log(Math.max(.02,ratio)))*.55,0,1);
    });
    // Penalize a nearly empty trophic level heavily.
    return clamp((sum/active.length)*100,0,100);
  }

  function getCycle(){
    const levels=['grass','insect','frog','snake','hawk'];
    const present=levels.filter(k=>state.introduced[k]&&state[k]>.4).length;
    const chain=(present/levels.length)*67;
    const decomposer=(state.introduced.fungi&&state.fungi>.5)?22:0;
    const soil=state.nutrients>18&&state.nutrients<88?6:2;
    const det=state.detritus<35?5:1;
    return clamp(chain+decomposer+soil+det,0,100);
  }

  function updateUI(){
    const balance=getBalance(), cycle=getCycle();
    els.life.textContent=Math.floor(state.score).toLocaleString('ja-JP');
    els.balance.textContent=`${Math.round(balance)}%`;
    els.cycle.textContent=`${Math.round(cycle)}%`;
    els.nutrient.textContent=Math.round(state.nutrients);

    document.querySelectorAll('.species-card').forEach(card=>{
      const sp=SPECIES.find(s=>s.key===card.dataset.species);
      const unlocked=sp.unlock(state);
      card.disabled=!unlocked;
      card.classList.toggle('locked',!unlocked);
      card.classList.toggle('active',!!state.introduced[sp.key]);
      card.querySelector('.pop').textContent=fmt(state[sp.key]);
      card.querySelector('.lock-copy').textContent=unlocked?(state.introduced[sp.key]?'もう一度迎える':'迎えられる'):sp.lock;
      const health=clamp(state[sp.key]/sp.target,0,1);
      card.querySelector('.foodline').style.transform=`scaleX(${health})`;
    });
  }

  function pulseSprite(key){
    sprites[key] = sprites[key] || {};
    sprites[key].pulse=1;
  }

  function draw(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    ctx.clearRect(0,0,w,h);

    // Distant haze and irregular terrain patches.
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#101e16');sky.addColorStop(.55,'#273a25');sky.addColorStop(1,'#162319');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    ctx.save();
    ctx.globalAlpha=.24;
    for(let i=0;i<9;i++){
      const x=pseudo(i*9.1)*w, y=h*(.45+pseudo(i*2.4)*.4), r=80+pseudo(i*3.2)*130;
      const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,'#638150');g.addColorStop(1,'rgba(40,66,39,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();

    // Soil and detritus details.
    terrainSeeds.forEach((p,i)=>{
      const y=h*(.35+p.y*.62), x=p.x*w;
      ctx.globalAlpha=.08+p.a*.14;
      ctx.fillStyle=i%3?'#d2d6a8':'#8b704a';
      ctx.beginPath();ctx.arc(x,y,1+p.a*1.8,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;

    drawGrass(w,h);
    drawSpecies(w,h);
    drawFlow(w,h);
  }

  function drawGrass(w,h){
    const density=Math.min(135,Math.floor(state.grass*1.8));
    ctx.lineCap='round';
    for(let i=0;i<density;i++){
      const x=pseudo(i*3.77+1)*w;
      const y=h*(.38+pseudo(i*8.31+2)*.58);
      const len=6+pseudo(i*6.11)*15;
      const sway=Math.sin(state.time*.8+i)*1.8;
      const alpha=.22+pseudo(i*11.8)*.48;
      ctx.strokeStyle=`rgba(${120+Math.floor(pseudo(i)*40)},${158+Math.floor(pseudo(i*2)*60)},${82+Math.floor(pseudo(i*4)*30)},${alpha})`;
      ctx.lineWidth=.7+pseudo(i*4.2)*1.2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+sway,y-len*.55,x+sway*1.3,y-len);ctx.stroke();
    }
  }

  function drawSpecies(w,h){
    const config={
      insect:{glyph:'⌁',size:14,max:16,y:[.45,.84]},
      frog:{glyph:'●',size:14,max:10,y:[.55,.87]},
      snake:{glyph:'∿',size:22,max:8,y:[.56,.88]},
      hawk:{glyph:'⌃',size:26,max:6,y:[.25,.54]},
      fungi:{glyph:'♧',size:18,max:14,y:[.64,.93]}
    };
    Object.entries(config).forEach(([key,c],si)=>{
      const sp=SPECIES.find(s=>s.key===key);
      const count=Math.min(c.max,Math.ceil(state[key]/Math.max(1,sp.target/c.max)));
      const pulse=sprites[key]?.pulse||0;
      for(let i=0;i<count;i++){
        const seed=si*100+i;
        let x=pseudo(seed*2.31+3)*w;
        let y=h*(c.y[0]+pseudo(seed*7.17+4)*(c.y[1]-c.y[0]));
        const speed=(si+1)*.22;
        x=(x + Math.sin(state.time*speed+seed)*14 + w)%w;
        y+=Math.cos(state.time*.35+seed)*3;
        const size=c.size*(1+pulse*.18);
        ctx.save();ctx.translate(x,y);
        if(key==='hawk') ctx.rotate(Math.sin(state.time+seed)*.12);
        ctx.globalAlpha=.55+pseudo(seed)*.4;
        ctx.font=`700 ${size}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle=sp.color;ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=7;ctx.fillText(c.glyph,0,0);
        ctx.restore();
      }
      if(sprites[key]) sprites[key].pulse=Math.max(0,pulse-.035);
    });
  }

  function drawFlow(w,h){
    if(!state.fx) return;
    // Floating specks make decomposition and renewal visible without UI arrows.
    const intensity=Math.min(20,Math.floor(state.fungi/2 + state.detritus/6));
    for(let i=0;i<intensity;i++){
      const phase=(state.time*.025+pseudo(i*5.3))%1;
      const x=pseudo(i*12.2+7)*w;
      const y=h*(.92-phase*.44);
      ctx.globalAlpha=.1*(1-phase);
      ctx.fillStyle=i%2?'#c8b486':'#c2d69b';
      ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  let last=performance.now(), uiClock=0;
  function frame(now){
    const dt=Math.min(.08,(now-last)/1000);last=now;
    simulate(dt);
    draw();
    uiClock+=dt;
    if(uiClock>.18){ updateUI();uiClock=0; }
    requestAnimationFrame(frame);
  }
  updateUI();
  requestAnimationFrame(frame);
})();
