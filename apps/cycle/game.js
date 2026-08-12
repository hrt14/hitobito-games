(() => {
  'use strict';

  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const els = {
    life: document.getElementById('lifeScore'), balance: document.getElementById('balanceScore'), cycle: document.getElementById('cycleScore'),
    nutrient: document.getElementById('nutrientValue'), tray: document.getElementById('speciesTray'), message: document.getElementById('message'),
    intro: document.getElementById('intro'), complete: document.getElementById('complete'), best: document.getElementById('bestBalance'), sound: document.getElementById('soundBtn'),
    objective: document.getElementById('objective'), objectiveIcon: document.getElementById('objectiveIcon'), objectiveTitle: document.getElementById('objectiveTitle'),
    objectiveDetail: document.getElementById('objectiveDetail'), objectiveBar: document.getElementById('objectiveBar'), chainHint: document.getElementById('chainHint')
  };

  const SPECIES = [
    {key:'grass',name:'草',sub:'すべての命の入口',icon:'🌿',color:'#9ed36b',target:72,unlock:()=>true,lock:'最初から'},
    {key:'insect',name:'バッタ',sub:'草を食べる',icon:'🦗',color:'#d8c86b',target:34,unlock:s=>s.grass>=38,lock:'草 38+'},
    {key:'frog',name:'カエル',sub:'バッタを食べる',icon:'🐸',color:'#83c786',target:18,unlock:s=>s.insect>=14,lock:'バッタ 14+'},
    {key:'snake',name:'ヘビ',sub:'カエルを狙う',icon:'🐍',color:'#c1af78',target:9,unlock:s=>s.frog>=7,lock:'カエル 7+'},
    {key:'hawk',name:'タカ',sub:'草原の頂点',icon:'🦅',color:'#d9b08c',target:5,unlock:s=>s.snake>=4,lock:'ヘビ 4+'},
    {key:'fungi',name:'菌類',sub:'死を土へ戻す',icon:'🍄',color:'#c7a6d9',target:24,unlock:s=>s.detritus>=8,lock:'死骸 8+'}
  ];

  const state = {
    grass:18,insect:0,frog:0,snake:0,hawk:0,fungi:0,nutrients:46,detritus:1,moisture:42,sunlight:55,
    introduced:{grass:true},score:0,bestBalance:0,completionHold:0,completed:false,started:false,fx:true,time:0,
    flashes:[],hunts:[],particles:[]
  };

  const terrainSeeds = Array.from({length:110},(_,i)=>({x:pseudo(i*7.13),y:pseudo(i*13.71),a:.1+pseudo(i*4.17)*.6}));
  const creatureSeeds = {};
  const pulse = {};
  let lastObjectiveKey='';
  let msgTimer;

  function pseudo(n){ return Math.abs(Math.sin(n*12.9898)*43758.5453)%1; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function fmt(v){ return Math.max(0,Math.round(v)); }
  function rand(a,b){ return a+Math.random()*(b-a); }

  function resize(){
    const rect=canvas.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.floor(rect.width*dpr);canvas.height=Math.floor(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize',resize);resize();

  function speciesCard(sp){
    const b=document.createElement('button');
    b.className='species-card';b.dataset.species=sp.key;
    b.innerHTML=`<span class="species-icon">${sp.icon}</span><span class="pop">0</span><b>${sp.name}</b><small>${sp.sub}</small><span class="lock-copy"></span><span class="foodline" style="background:${sp.color}"></span>`;
    b.addEventListener('click',()=>introduce(sp.key));els.tray.appendChild(b);
  }
  SPECIES.forEach(speciesCard);

  function whisper(text,kicker='変化'){
    clearTimeout(msgTimer);
    els.message.querySelector('.message-kicker').textContent=kicker;
    els.message.querySelector('strong').textContent=text;
    els.message.classList.add('is-visible');
    msgTimer=setTimeout(()=>els.message.classList.remove('is-visible'),2400);
  }

  function flashObjective(){
    els.objective.classList.remove('flash');void els.objective.offsetWidth;els.objective.classList.add('flash');setTimeout(()=>els.objective.classList.remove('flash'),500);
  }

  function introduce(key){
    if(!state.started)return;
    const sp=SPECIES.find(s=>s.key===key);
    if(!sp||!sp.unlock(state))return;
    const first=!state.introduced[key];state.introduced[key]=true;
    const amounts={grass:11,insect:8,frog:4,snake:2.4,hawk:1.5,fungi:7};state[key]+=amounts[key];pulse[key]=1;
    burst(key,first?13:7);
    const copy={grass:'草が広がった。食べる命の土台になる。',insect:'バッタが草を食べ始めた。',frog:'カエルがバッタを追い始めた。',snake:'ヘビがカエルを狙い始めた。',hawk:'タカが上空からヘビを探している。',fungi:'菌類が死骸を土へ戻し始めた。'};
    whisper(copy[key],first?'新しい命':'個体数 +');flashObjective();
  }

  document.querySelectorAll('.action-card').forEach(btn=>btn.addEventListener('click',()=>{
    if(!state.started)return;
    const a=btn.dataset.action;
    btn.animate([{transform:'scale(.95)'},{transform:'scale(1)'}],{duration:180});
    if(a==='sun'){
      state.sunlight=clamp(state.sunlight+24,0,100);state.grass+=5;state.flashes.push({type:'sun',life:1});burst('grass',8);whisper('光で草が伸びた。','☀ 光');
    }else if(a==='rain'){
      state.moisture=clamp(state.moisture+30,0,100);state.nutrients=clamp(state.nutrients+5,0,100);state.grass+=2;state.flashes.push({type:'rain',life:1});whisper('雨で草原が潤った。','💧 雨');
    }else{
      state.detritus+=8;state.flashes.push({type:'leaf',life:1});burst('fungi',5);whisper(state.fungi>0?'落ち葉を菌類が分解している。':'落ち葉が積もった。分解者がいれば土へ戻せる。','🍂 落ち葉');
    }
    flashObjective();
  }));

  document.getElementById('startBtn').addEventListener('click',()=>{
    state.started=true;els.intro.classList.remove('is-open');
    whisper('光か雨をタップすると、草原がすぐ変わる。','最初の一歩');
    document.querySelector('[data-action="sun"]').classList.add('pulse');setTimeout(()=>document.querySelector('[data-action="sun"]').classList.remove('pulse'),2400);
  });
  document.getElementById('continueBtn').addEventListener('click',()=>els.complete.classList.remove('is-open'));
  els.sound.addEventListener('click',()=>{state.fx=!state.fx;els.sound.textContent=state.fx?'✦':'·';els.sound.style.opacity=state.fx?'1':'.45';});

  function burst(key,count){
    if(!state.fx)return;
    const colors={grass:'#b8e57f',insect:'#e4d56e',frog:'#8fd194',snake:'#d3bf87',hawk:'#ebc29c',fungi:'#d3b4e4'};
    for(let i=0;i<count;i++)state.particles.push({x:rand(.18,.82),y:rand(.48,.86),vx:rand(-.04,.04),vy:rand(-.12,-.035),life:rand(.55,1.1),color:colors[key]||'#fff'});
  }

  function simulate(dt){
    if(!state.started)return;
    state.time+=dt;
    state.sunlight+=(54-state.sunlight)*dt*.045;state.moisture+=(48-state.moisture)*dt*.035;

    const env=(state.nutrients/100)*.45+(state.sunlight/100)*.3+(state.moisture/100)*.25;
    const grassGrowth=2.55*env*(1-state.grass/126);
    const herbivory=.03*state.insect*state.grass/(22+state.grass);
    const grassDeath=state.grass*.0058;
    state.grass+=(grassGrowth-herbivory-grassDeath)*dt;state.nutrients-=Math.max(0,grassGrowth)*.041*dt;state.detritus+=grassDeath*.18*dt;

    const insectBirth=.145*state.insect*(state.grass/(19+state.grass));const insectPred=.051*state.frog*state.insect/(8+state.insect);const insectDeath=.037*state.insect;
    state.insect+=(insectBirth-insectPred-insectDeath)*dt;state.detritus+=insectDeath*.15*dt;

    const frogBirth=.112*state.frog*(state.insect/(9+state.insect));const frogPred=.059*state.snake*state.frog/(5+state.frog);const frogDeath=.033*state.frog;
    state.frog+=(frogBirth-frogPred-frogDeath)*dt;state.detritus+=frogDeath*.3*dt;

    const snakeBirth=.09*state.snake*(state.frog/(5+state.frog));const snakePred=.066*state.hawk*state.snake/(2.8+state.snake);const snakeDeath=.029*state.snake;
    state.snake+=(snakeBirth-snakePred-snakeDeath)*dt;state.detritus+=snakeDeath*.55*dt;

    const hawkBirth=.058*state.hawk*(state.snake/(3+state.snake));const hawkDeath=.031*state.hawk;
    state.hawk+=(hawkBirth-hawkDeath)*dt;state.detritus+=hawkDeath*.8*dt;

    const fungiGrowth=.125*state.fungi*(state.detritus/(7+state.detritus));const fungiDeath=.046*state.fungi;const decomposition=Math.min(state.detritus,.175*state.fungi*state.detritus/(6+state.detritus));
    state.fungi+=(fungiGrowth-fungiDeath)*dt;state.detritus-=decomposition*dt;state.nutrients+=decomposition*.97*dt;

    ['grass','insect','frog','snake','hawk','fungi'].forEach(k=>state[k]=clamp(state[k],0,180));state.detritus=clamp(state.detritus,0,90);state.nutrients=clamp(state.nutrients,2,100);

    const balance=getBalance(),cycle=getCycle();state.score+=dt*(.24+balance/210+cycle/245);state.bestBalance=Math.max(state.bestBalance,balance);
    maybeHunt(dt);updateFx(dt);

    const all=SPECIES.every(sp=>state.introduced[sp.key]&&state[sp.key]>.35);
    if(all&&balance>=70&&cycle>=80){state.completionHold+=dt;if(state.completionHold>7&&!state.completed){state.completed=true;els.best.textContent=`${Math.round(state.bestBalance)}%`;els.complete.classList.add('is-open');burst('grass',24);}}
    else state.completionHold=Math.max(0,state.completionHold-dt*.7);
  }

  function maybeHunt(dt){
    if(!state.fx||Math.random()>dt*.55)return;
    const pairs=[['frog','insect'],['snake','frog'],['hawk','snake']];
    const valid=pairs.filter(([pred,prey])=>state[pred]>.8&&state[prey]>1);
    if(!valid.length)return;
    const [pred,prey]=valid[Math.floor(Math.random()*valid.length)];
    state.hunts.push({pred,prey,x:rand(.18,.82),y:rand(.48,.82),life:1});
  }

  function updateFx(dt){
    state.flashes.forEach(f=>f.life-=dt*1.35);state.flashes=state.flashes.filter(f=>f.life>0);
    state.hunts.forEach(h=>h.life-=dt*.9);state.hunts=state.hunts.filter(h=>h.life>0);
    state.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.055*dt;});state.particles=state.particles.filter(p=>p.life>0);
  }

  function getBalance(){
    const active=SPECIES.filter(sp=>state.introduced[sp.key]);if(!active.length)return 0;let sum=0;
    active.forEach(sp=>{const ratio=state[sp.key]/sp.target;sum+=clamp(1-Math.abs(Math.log(Math.max(.02,ratio)))*.55,0,1);});
    return clamp((sum/active.length)*100,0,100);
  }
  function getCycle(){
    const levels=['grass','insect','frog','snake','hawk'];const present=levels.filter(k=>state.introduced[k]&&state[k]>.4).length;
    return clamp((present/levels.length)*67+(state.introduced.fungi&&state.fungi>.5?22:0)+(state.nutrients>18&&state.nutrients<88?6:2)+(state.detritus<35?5:1),0,100);
  }

  function currentObjective(){
    if(state.grass<38)return{key:'grass38',icon:'🌿',title:'草原を育てる',detail:`草 ${fmt(state.grass)} / 38`,progress:state.grass/38,target:'grass'};
    if(!state.introduced.insect)return{key:'add-insect',icon:'🦗',title:'バッタを迎える',detail:'光っているカードをタップ',progress:1,target:'insect'};
    if(state.insect<14)return{key:'insect14',icon:'🦗',title:'バッタを増やす',detail:`バッタ ${fmt(state.insect)} / 14`,progress:state.insect/14,target:'insect'};
    if(!state.introduced.frog)return{key:'add-frog',icon:'🐸',title:'カエルを迎える',detail:'バッタを食べる仲間',progress:1,target:'frog'};
    if(state.frog<7)return{key:'frog7',icon:'🐸',title:'カエルを増やす',detail:`カエル ${fmt(state.frog)} / 7`,progress:state.frog/7,target:'frog'};
    if(!state.introduced.snake)return{key:'add-snake',icon:'🐍',title:'ヘビを迎える',detail:'カエルとの関係をつくる',progress:1,target:'snake'};
    if(state.snake<4)return{key:'snake4',icon:'🐍',title:'ヘビを増やす',detail:`ヘビ ${fmt(state.snake)} / 4`,progress:state.snake/4,target:'snake'};
    if(!state.introduced.hawk)return{key:'add-hawk',icon:'🦅',title:'タカを迎える',detail:'食物連鎖を頂点までつなぐ',progress:1,target:'hawk'};
    if(state.detritus<8)return{key:'detritus8',icon:'🍂',title:'死と落ち葉をためる',detail:`分解材料 ${fmt(state.detritus)} / 8`,progress:state.detritus/8,target:'detritus'};
    if(!state.introduced.fungi)return{key:'add-fungi',icon:'🍄',title:'菌類を迎える',detail:'死を土へ戻す最後の輪',progress:1,target:'fungi'};
    return{key:'balance',icon:'◌',title:'循環を安定させる',detail:`BALANCE ${Math.round(getBalance())}% · CYCLE ${Math.round(getCycle())}%`,progress:Math.min(getBalance()/70,getCycle()/80),target:'balance'};
  }

  function updateUI(){
    const balance=getBalance(),cycle=getCycle();els.life.textContent=Math.floor(state.score).toLocaleString('ja-JP');els.balance.textContent=`${Math.round(balance)}%`;els.cycle.textContent=`${Math.round(cycle)}%`;els.nutrient.textContent=Math.round(state.nutrients);
    const obj=currentObjective();els.objectiveIcon.textContent=obj.icon;els.objectiveTitle.textContent=obj.title;els.objectiveDetail.textContent=obj.detail;els.objectiveBar.style.width=`${clamp(obj.progress,0,1)*100}%`;
    if(obj.key!==lastObjectiveKey&&state.started){lastObjectiveKey=obj.key;flashObjective();}

    document.querySelectorAll('.species-card').forEach(card=>{
      const sp=SPECIES.find(s=>s.key===card.dataset.species);const unlocked=sp.unlock(state);const firstReady=unlocked&&!state.introduced[sp.key]&&obj.target===sp.key;
      card.disabled=!unlocked;card.classList.toggle('locked',!unlocked);card.classList.toggle('active',!!state.introduced[sp.key]);card.classList.toggle('ready',firstReady);
      card.querySelector('.pop').textContent=fmt(state[sp.key]);
      card.querySelector('.lock-copy').textContent=!unlocked?`🔒 ${sp.lock}`:firstReady?'← 今ここをタップ':(state.introduced[sp.key]?'もう一度迎える':'迎えられる');
      card.querySelector('.foodline').style.transform=`scaleX(${clamp(state[sp.key]/sp.target,0,1)})`;
    });
    els.chainHint.textContent=obj.target==='balance'?'全体の数を見て調整':'次に迎えられる生き物が光る';
  }

  function draw(){
    const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);
    drawSky(w,h);drawTerrain(w,h);drawGrass(w,h);drawCreatures(w,h);drawHunts(w,h);drawCycle(w,h);drawParticles(w,h);drawWeather(w,h);
  }

  function drawSky(w,h){
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#10241a');g.addColorStop(.45,'#355034');g.addColorStop(1,'#18281b');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.18;ctx.fillStyle='#dce8c2';ctx.beginPath();ctx.arc(w*.78,h*.2,58,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='rgba(21,46,27,.95)';ctx.beginPath();ctx.moveTo(0,h*.38);for(let x=0;x<=w;x+=35)ctx.lineTo(x,h*(.33+pseudo(x*.18)*.08));ctx.lineTo(w,h*.56);ctx.lineTo(0,h*.56);ctx.fill();
  }

  function drawTerrain(w,h){
    ctx.fillStyle='#304a2d';ctx.beginPath();ctx.moveTo(0,h*.39);ctx.bezierCurveTo(w*.2,h*.31,w*.34,h*.48,w*.54,h*.39);ctx.bezierCurveTo(w*.73,h*.31,w*.87,h*.49,w,h*.4);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    ctx.fillStyle='rgba(126,104,66,.18)';ctx.beginPath();ctx.ellipse(w*.5,h*.76,w*.45,h*.11,-.05,0,Math.PI*2);ctx.fill();
    terrainSeeds.forEach((p,i)=>{const y=h*(.42+p.y*.54),x=p.x*w;ctx.globalAlpha=.06+p.a*.12;ctx.fillStyle=i%3?'#d4d9ab':'#8d7147';ctx.beginPath();ctx.arc(x,y,1+p.a*1.8,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
  }

  function drawGrass(w,h){
    const density=Math.min(190,Math.floor(state.grass*2.15));ctx.lineCap='round';
    for(let i=0;i<density;i++){
      const x=pseudo(i*3.77+1)*w,y=h*(.45+pseudo(i*8.31+2)*.48),len=7+pseudo(i*6.11)*18,sway=Math.sin(state.time*.9+i)*2;
      ctx.strokeStyle=`rgba(${112+Math.floor(pseudo(i)*35)},${162+Math.floor(pseudo(i*2)*62)},${70+Math.floor(pseudo(i*4)*32)},${.3+pseudo(i*11.8)*.52})`;ctx.lineWidth=.8+pseudo(i*4.2)*1.3;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+sway,y-len*.55,x+sway*1.3,y-len);ctx.stroke();
    }
    if(state.grass>55){ctx.globalAlpha=.42;for(let i=0;i<Math.min(30,(state.grass-50));i++){ctx.fillStyle=i%2?'#ebdc87':'#d6edaa';ctx.beginPath();ctx.arc(pseudo(i*5.2)*w,h*(.53+pseudo(i*8.1)*.37),1.4,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
  }

  function seedFor(key,i){creatureSeeds[key]=creatureSeeds[key]||[];if(!creatureSeeds[key][i])creatureSeeds[key][i]={x:pseudo(i*7.2+key.length),y:pseudo(i*13.3+key.length*2),phase:pseudo(i*5.9)*Math.PI*2};return creatureSeeds[key][i];}
  function creatureCount(key,max){const sp=SPECIES.find(s=>s.key===key);return Math.min(max,Math.ceil(state[key]/Math.max(1,sp.target/max)));}

  function drawCreatures(w,h){
    for(let i=0;i<creatureCount('insect',18);i++)drawInsect(w,h,i);
    for(let i=0;i<creatureCount('frog',11);i++)drawFrog(w,h,i);
    for(let i=0;i<creatureCount('snake',8);i++)drawSnake(w,h,i);
    for(let i=0;i<creatureCount('hawk',5);i++)drawHawk(w,h,i);
    for(let i=0;i<creatureCount('fungi',18);i++)drawFungus(w,h,i);
  }

  function drawInsect(w,h,i){const s=seedFor('insect',i),x=(s.x*w+Math.sin(state.time*1.4+s.phase)*10+w)%w,y=h*(.53+s.y*.34)+Math.sin(state.time*3+s.phase)*2,sc=1+(pulse.insect||0)*.14;ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.strokeStyle='#2a2915';ctx.fillStyle='#d7c75e';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,0,5,2.4,-.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-2,1);ctx.lineTo(-7,5);ctx.moveTo(2,1);ctx.lineTo(8,5);ctx.moveTo(-1,-1);ctx.lineTo(-5,-5);ctx.stroke();ctx.restore();}
  function drawFrog(w,h,i){const s=seedFor('frog',i),x=s.x*w+Math.sin(state.time*.65+s.phase)*8,y=h*(.58+s.y*.27),sc=1+(pulse.frog||0)*.14;ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.fillStyle='#78bd79';ctx.beginPath();ctx.ellipse(0,2,8,6,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-4,-3,3,0,Math.PI*2);ctx.arc(4,-3,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#132017';ctx.beginPath();ctx.arc(-4,-4,1,0,Math.PI*2);ctx.arc(4,-4,1,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#78bd79';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5,5);ctx.lineTo(-11,10);ctx.moveTo(5,5);ctx.lineTo(11,10);ctx.stroke();ctx.restore();}
  function drawSnake(w,h,i){const s=seedFor('snake',i),x=s.x*w+Math.sin(state.time*.45+s.phase)*16,y=h*(.58+s.y*.29),sc=1+(pulse.snake||0)*.16;ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.strokeStyle='#c1af78';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-13,2);ctx.bezierCurveTo(-7,-7,0,9,8,-1);ctx.bezierCurveTo(11,-4,13,-2,15,0);ctx.stroke();ctx.fillStyle='#c1af78';ctx.beginPath();ctx.arc(15,0,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(16,-1,0.7,0,Math.PI*2);ctx.fill();ctx.restore();}
  function drawHawk(w,h,i){const s=seedFor('hawk',i),x=(s.x*w+state.time*(9+i*1.2))%(w+80)-40,y=h*(.25+s.y*.18)+Math.sin(state.time*.7+s.phase)*12,sc=1+(pulse.hawk||0)*.16;ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.fillStyle='#c99b76';ctx.beginPath();ctx.moveTo(0,3);ctx.quadraticCurveTo(-12,-9,-24,-2);ctx.quadraticCurveTo(-12,-2,-5,6);ctx.lineTo(0,10);ctx.lineTo(5,6);ctx.quadraticCurveTo(12,-2,24,-2);ctx.quadraticCurveTo(12,-9,0,3);ctx.fill();ctx.restore();}
  function drawFungus(w,h,i){const s=seedFor('fungi',i),x=s.x*w,y=h*(.72+s.y*.2),sc=.7+pseudo(i*3.2)*.7+(pulse.fungi||0)*.12;ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.fillStyle='#dbc7aa';ctx.fillRect(-1.5,0,3,7);ctx.fillStyle=i%3===0?'#b692c9':'#c8a67f';ctx.beginPath();ctx.arc(0,0,5,Math.PI,0);ctx.lineTo(5,1);ctx.lineTo(-5,1);ctx.fill();ctx.restore();}

  function drawHunts(w,h){
    const icons={insect:'🦗',frog:'🐸',snake:'🐍',hawk:'🦅'};
    state.hunts.forEach(ev=>{const t=1-ev.life,x=ev.x*w,y=ev.y*h;ctx.save();ctx.globalAlpha=Math.min(1,ev.life*2);ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText(icons[ev.prey],x+18*(1-t),y);ctx.font='25px system-ui';ctx.fillText(icons[ev.pred],x-25+31*t,y-8*Math.sin(t*Math.PI));ctx.strokeStyle='rgba(244,230,177,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-10,y+8);ctx.lineTo(x+12,y+2);ctx.stroke();ctx.restore();});
  }

  function drawCycle(w,h){
    if(state.fungi<1)return;
    const a=clamp(state.fungi/18,0,.65);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#c8daa0';ctx.setLineDash([3,6]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(w*.5,h*.72,Math.min(w*.29,105),-.15,Math.PI*1.75);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#c8daa0';ctx.font='11px system-ui';ctx.fillText('土へ還る',w*.5-25,h*.72-100);ctx.restore();
  }

  function drawParticles(w,h){state.particles.forEach(p=>{ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x*w,p.y*h,2,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;}
  function drawWeather(w,h){
    state.flashes.forEach(f=>{ctx.save();ctx.globalAlpha=f.life*.28;if(f.type==='sun'){const g=ctx.createRadialGradient(w*.78,h*.18,5,w*.78,h*.18,150);g.addColorStop(0,'#fff6b5');g.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}else if(f.type==='rain'){ctx.strokeStyle='#b7d8e7';ctx.lineWidth=1;for(let i=0;i<38;i++){const x=pseudo(i*9.2+state.time)*w,y=(pseudo(i*3.1)+state.time*.8)%1*h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+12);ctx.stroke();}}else{ctx.fillStyle='#c79756';for(let i=0;i<18;i++){const x=pseudo(i*8.2)*w,y=h*(.4+((pseudo(i*4.4)+state.time*.05)%1)*.5);ctx.fillRect(x,y,4,2);}}ctx.restore();});
  }

  let last=performance.now(),uiClock=0;
  function frame(now){const dt=Math.min(.08,(now-last)/1000);last=now;simulate(dt);draw();uiClock+=dt;if(uiClock>.14){updateUI();uiClock=0;}Object.keys(pulse).forEach(k=>pulse[k]=Math.max(0,pulse[k]-.04));requestAnimationFrame(frame);}
  updateUI();requestAnimationFrame(frame);
})();
