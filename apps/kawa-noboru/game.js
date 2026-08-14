(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const portrait = document.getElementById('fishPortrait');
  const pctx = portrait.getContext('2d');
  const el = id => document.getElementById(id);

  function storageGet(key, fallback='{}'){ try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
  function storageSet(key, value){ try { localStorage.setItem(key, value); } catch {} }
  function storageRemove(key){ try { localStorage.removeItem(key); } catch {} }

  const zones = [
    {name:'下流', min:0, max:24, sky:'#9cc9bf', water:'#568f8c', bank:'#6f8654', rock:'#8a8476', spots:['瀬','岸際','橋脚']},
    {name:'中流', min:25, max:49, sky:'#91b7ad', water:'#477d7d', bank:'#5f764b', rock:'#7e7a70', spots:['瀬','淵','岩陰']},
    {name:'上流', min:50, max:74, sky:'#809f98', water:'#3a6f73', bank:'#506947', rock:'#73736e', spots:['淵','落ち込み','倒木']},
    {name:'源流', min:75, max:100, sky:'#6b8782', water:'#2f626a', bank:'#425c43', rock:'#676c68', spots:['滝壺','岩陰','白泡']}
  ];

  const fish = [
    {id:'oikawa',name:'オイカワ',zone:0,spot:['瀬','岸際'],size:[12,24],power:.7,color:'#d9d6b5',accent:'#df7f68',shape:'slender',note:'陽の差す浅瀬で、銀色の腹がきらめく。'},
    {id:'ayu',name:'アユ',zone:0,spot:['瀬','橋脚'],size:[16,28],power:.9,color:'#b8c8b2',accent:'#e7bf62',shape:'slender',note:'流れの筋を選んで泳ぐ。川の匂いをまとった魚。'},
    {id:'ugui',name:'ウグイ',zone:1,spot:['瀬','淵'],size:[20,38],power:1.1,color:'#b6b29e',accent:'#d96f72',shape:'round',note:'深みと瀬を行き来する、たくましい川の住人。'},
    {id:'yamame',name:'ヤマメ',zone:1,spot:['岩陰','淵'],size:[18,32],power:1.35,color:'#b8a98b',accent:'#5e6571',shape:'trout',note:'岩陰の流れに潜む。体側の斑紋が森の影に溶ける。'},
    {id:'iwana',name:'イワナ',zone:2,spot:['落ち込み','倒木','淵'],size:[24,45],power:1.6,color:'#786d54',accent:'#d6c69a',shape:'trout',note:'冷たい水ほど上へ。倒木の下から音もなく出てくる。'},
    {id:'amago',name:'アマゴ',zone:2,spot:['淵','落ち込み'],size:[22,40],power:1.75,color:'#a68d78',accent:'#df6d67',shape:'trout',note:'朱点が走る渓流魚。速い流れほど落ち着いている。'},
    {id:'nushi',name:'川の主',zone:3,spot:['滝壺'],size:[82,118],power:2.45,color:'#5f665b',accent:'#e6d49b',shape:'giant',note:'源流の滝壺に棲む、川のすべてを知る影。',boss:true}
  ];

  const state = {
    progress: 0, targetProgress: 0, discovered: JSON.parse(storageGet('river-memory','{}')),
    mode:'walk', t:0, scroll:0, spots:[], particles:[], fishFight:null,
    pointerDown:false, downX:0, downY:0, lastY:0, moved:false, castSpot:null,
    timeOfDay:0, lastZone:-1, caught:0
  };

  function resize(){
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width*dpr); canvas.height = Math.round(r.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0); state.w=r.width; state.h=r.height;
    buildSpots();
  }

  function currentZone(){ return Math.min(3, Math.floor(state.progress/25)); }
  function zoneObj(){ return zones[currentZone()]; }

  function buildSpots(){
    if(!state.w) return;
    const z = currentZone(); const names=zones[z].spots;
    state.spots = Array.from({length:5},(_,i)=>({
      x: state.w*(.34 + ((i*0.37+z*.13)%1)*.32),
      y: state.h*(.24 + i*.15),
      r: 20 + (i%2)*5,
      label:names[i%names.length],
      pulse: Math.random()*6.28,
      used:false
    }));
  }

  function save(){ storageSet('river-memory', JSON.stringify(state.discovered)); }
  function caughtCount(){ return Object.keys(state.discovered).length; }

  function updateHud(){
    const z = zoneObj(); el('placeName').textContent=z.name;
    el('caughtCount').textContent=caughtCount();
    const hour = 7 + Math.floor(state.timeOfDay%11);
    el('weatherText').textContent=`晴れ・${hour<10?'朝':hour<16?'昼':'夕'} ${hour}:00`;
    if(state.mode==='walk') el('hint').textContent = currentZone()===3 ? '滝壺を探す　下へスワイプで戻れる' : '上へスワイプして川をのぼる';
  }

  function toast(msg, ms=1400){ const t=el('toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(toast._id); toast._id=setTimeout(()=>t.classList.add('hidden'),ms); }

  function fishForSpot(spot){
    const z=currentZone(); let pool=fish.filter(f=>f.zone===z && f.spot.includes(spot.label));
    if(z===3 && spot.label==='滝壺'){
      const prereq=['yamame','iwana'].every(id=>state.discovered[id]);
      if(!prereq) return null;
      return fish.find(f=>f.id==='nushi');
    }
    if(!pool.length) pool=fish.filter(f=>f.zone===z && !f.boss);
    if(!pool.length) return null;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function startCast(spot){
    if(state.mode!=='walk') return;
    state.mode='cast'; state.castSpot=spot; spot.used=true; state.castAt=performance.now(); state.biteAt=state.castAt+900+Math.random()*1700; state.biteWindow=false;
    el('hint').textContent='……'; el('hint').classList.remove('fade');
    ping(440,.04,.04);
  }

  function bite(){
    if(state.mode!=='cast') return;
    state.biteWindow=true; state.biteExpire=performance.now()+850; el('hint').textContent='ピクッ！ タップ';
    ping(760,.08,.07); navigator.vibrate?.(35);
  }

  function hook(){
    if(state.mode!=='cast' || !state.biteWindow) return;
    const f=fishForSpot(state.castSpot);
    if(!f){ state.mode='walk'; el('hint').textContent='まだ川の記憶が足りない　下へスワイプで戻る'; toast('ヤマメとイワナの気配を追おう',1800); setTimeout(()=>updateHud(),2200); return; }
    state.mode='fight';
    state.fishFight={fish:f,dist:f.boss?26:10+f.power*4,tension:.28,stamina:1,phase:Math.random()*6.2,hold:false};
    el('fightHud').classList.remove('hidden'); el('hint').classList.add('hidden');
    el('fishLabel').textContent=f.boss?'巨大な影':`${f.name}？`; navigator.vibrate?.([20,30,25]);
  }

  function finishCatch(){
    const ff=state.fishFight; if(!ff) return; const f=ff.fish;
    const size=Math.round(f.size[0]+Math.random()*(f.size[1]-f.size[0])); const isNew=!state.discovered[f.id];
    state.discovered[f.id]={name:f.name,size,zone:currentZone(),spot:state.castSpot.label}; save();
    state.mode='card'; state.fishFight=null; el('fightHud').classList.add('hidden');
    drawPortrait(f); el('catchName').textContent=f.name; el('catchSize').textContent=`${size}cm`; el('catchPlace').textContent=`${zoneObj().name}・${state.castSpot.label}`; el('catchNote').textContent=f.note;
    el('catchNew').style.visibility=isNew?'visible':'hidden'; el('catchCard').classList.remove('hidden');
    ping(f.boss?220:880,.14,.12); setTimeout(()=>ping(f.boss?330:1100,.12,.09),130); navigator.vibrate?.([30,40,80]);
  }

  function loseFish(reason){
    state.mode='walk'; state.fishFight=null; el('fightHud').classList.add('hidden'); el('hint').classList.remove('hidden'); toast(reason); updateHud();
  }

  function closeCatch(){
    const wasBoss=!!fish.find(f=>f.id==='nushi' && state.discovered[f.id]);
    el('catchCard').classList.add('hidden');
    if(wasBoss && currentZone()===3){ state.mode='ending'; setTimeout(()=>el('ending').classList.remove('hidden'),250); return; }
    state.mode='walk'; state.progress=Math.min(99, state.progress+4.5); state.targetProgress=state.progress; state.timeOfDay+=.45; buildSpots(); updateHud(); el('hint').classList.remove('hidden');
  }

  function drawPortrait(f){
    const w=portrait.width,h=portrait.height; pctx.clearRect(0,0,w,h);
    const g=pctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#9fc8c2');g.addColorStop(1,'#568f8c');pctx.fillStyle=g;pctx.fillRect(0,0,w,h);
    pctx.globalAlpha=.18;pctx.fillStyle='#fff';for(let i=0;i<8;i++){pctx.beginPath();pctx.arc((i*47)%w,18+(i%3)*35,2+(i%2)*2,0,7);pctx.fill()}pctx.globalAlpha=1;
    drawFish(pctx,w*.52,h*.54,f,f.boss?1.65:1.2,0);
  }

  function drawFish(c,x,y,f,scale=1,flip=0){
    c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.scale(scale,scale);
    const L=f.shape==='giant'?82:f.shape==='trout'?56:f.shape==='round'?50:54, H=f.shape==='giant'?22:f.shape==='trout'?17:f.shape==='round'?19:13;
    c.fillStyle=f.color;c.beginPath();c.ellipse(0,0,L/2,H/2,0,0,Math.PI*2);c.fill();
    c.beginPath();c.moveTo(-L/2+3,0);c.lineTo(-L/2-16,-11);c.lineTo(-L/2-13,11);c.closePath();c.fill();
    c.fillStyle=f.accent;c.globalAlpha=.9;c.beginPath();c.moveTo(-4,-H/2+2);c.lineTo(8,-H/2-10);c.lineTo(13,-H/2+3);c.fill();
    if(f.shape==='trout'||f.shape==='giant'){c.globalAlpha=.65;for(let i=-15;i<=15;i+=10){c.fillStyle=f.accent;c.beginPath();c.arc(i,0,3,0,7);c.fill()}}
    if(f.id==='amago'){c.globalAlpha=.95;for(let i=-15;i<=16;i+=10){c.fillStyle='#d85d59';c.beginPath();c.arc(i,6,2,0,7);c.fill()}}
    c.globalAlpha=1;c.fillStyle='#17231e';c.beginPath();c.arc(L/2-9,-3,2.2,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(L/2-8.3,-3.7,.7,0,7);c.fill();c.restore();
  }

  function update(dt, now){
    state.t+=dt; state.scroll+=(state.progress-state.targetProgress)*.001;
    if(state.mode==='cast'){
      if(!state.biteWindow && now>=state.biteAt) bite();
      if(state.biteWindow && now>state.biteExpire){ state.mode='walk'; state.biteWindow=false; el('hint').textContent='逃げた…'; setTimeout(updateHud,700); }
    }
    if(state.mode==='fight' && state.fishFight){
      const f=state.fishFight; f.phase+=dt*(1.4+f.fish.power*.22);
      const surge=(Math.sin(f.phase)+1)/2; const fishPull=.11+surge*.34*f.fish.power;
      if(f.hold){ f.tension += dt*(.34+fishPull); f.dist -= dt*(1.4/(.55+f.fish.power*.35))*(1-surge*.3); f.stamina-=dt*.028; }
      else { f.tension -= dt*(.46-fishPull*.22); f.dist += dt*(.18+fishPull*.22); f.stamina-=dt*.009; }
      if(surge>.83) f.tension+=dt*.12*f.fish.power;
      f.tension=Math.max(.04,Math.min(1.08,f.tension)); f.dist=Math.max(0,Math.min(f.fish.boss?32:18,f.dist));
      el('tensionFill').style.width=`${Math.min(100,f.tension*100)}%`; el('fishDist').textContent=`${Math.max(0,Math.ceil(f.dist))}m`;
      if(f.tension>=1) loseFish('糸が切れた'); else if(f.dist<=0) finishCatch();
    }
  }

  function draw(){
    const w=state.w,h=state.h;if(!w)return; const z=zoneObj();
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle=z.sky;ctx.fillRect(0,0,w,h);
    const p=state.progress/100;
    ctx.fillStyle=mix('#41604a','#2c4540',p);mountain(0,h*.22,w*.72,h*.23,0);mountain(w*.35,h*.18,w*.8,h*.3,1);
    const center=w*.5+Math.sin(state.progress*.17)*w*.05; const topWidth=w*(.23-.05*p), botWidth=w*(.58-.12*p);
    ctx.fillStyle=z.bank;ctx.beginPath();ctx.moveTo(0,h*.16);ctx.lineTo(center-topWidth/2,h*.16);ctx.bezierCurveTo(center-botWidth*.7,h*.48,center-botWidth*.45,h*.72,center-botWidth/2,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(w,h*.16);ctx.lineTo(center+topWidth/2,h*.16);ctx.bezierCurveTo(center+botWidth*.7,h*.48,center+botWidth*.45,h*.72,center+botWidth/2,h);ctx.lineTo(w,h);ctx.closePath();ctx.fill();
    const wg=ctx.createLinearGradient(0,h*.15,0,h);wg.addColorStop(0,mix(z.water,'#c8e1d8',.15));wg.addColorStop(1,z.water);ctx.fillStyle=wg;ctx.beginPath();ctx.moveTo(center-topWidth/2,h*.15);ctx.lineTo(center+topWidth/2,h*.15);ctx.bezierCurveTo(center+botWidth*.68,h*.5,center+botWidth*.43,h*.72,center+botWidth/2,h);ctx.lineTo(center-botWidth/2,h);ctx.bezierCurveTo(center-botWidth*.43,h*.72,center-botWidth*.68,h*.5,center-topWidth/2,h*.15);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#d9f0e633';ctx.lineWidth=2;for(let i=0;i<9;i++){const yy=(i*93+state.t*24)%h;const ww=20+(i%3)*16;const xx=center+Math.sin(i*1.9+yy*.01)*botWidth*.18;ctx.beginPath();ctx.moveTo(xx-ww/2,yy);ctx.quadraticCurveTo(xx,yy-3,xx+ww/2,yy);ctx.stroke()}
    for(let i=0;i<18;i++){const yy=(i*61+state.progress*17)%h;const side=i%2?1:-1;const spread=(topWidth+(botWidth-topWidth)*(yy/h))*.5;const xx=center+side*(spread+18+(i*37)%58);drawRock(xx,yy,6+(i%4)*3,z.rock);if(i%3===0)drawGrass(xx+side*8,yy+5,side);}
    if(currentZone()===3){ctx.fillStyle='#d6eee7aa';ctx.fillRect(center-26,0,52,h*.19);ctx.fillStyle='#efffffb0';for(let i=0;i<5;i++)ctx.fillRect(center-20+i*10,0,3,h*.19);ctx.fillStyle='#e6fff052';ctx.beginPath();ctx.ellipse(center,h*.19,65,18,0,0,7);ctx.fill();}
    if(state.mode==='walk'||state.mode==='cast') state.spots.forEach(s=>drawSpot(s));
    if(state.mode==='cast'&&state.castSpot){const s=state.castSpot;const bobY=s.y+Math.sin(state.t*5)*2;ctx.strokeStyle='#f3ead5aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.5,h*.78);ctx.lineTo(s.x,bobY);ctx.stroke();ctx.fillStyle=state.biteWindow?'#ffd26a':'#f0ece1';ctx.beginPath();ctx.arc(s.x,bobY,5,0,7);ctx.fill();ctx.fillStyle='#d95f58';ctx.fillRect(s.x-2,bobY-8,4,7);}
    if(state.mode==='fight'&&state.fishFight){const ff=state.fishFight;const sx=center+Math.sin(ff.phase)*botWidth*.18, sy=h*.36+Math.cos(ff.phase*.7)*h*.08;ctx.save();ctx.globalAlpha=.26;ctx.fillStyle='#152b2b';ctx.beginPath();ctx.ellipse(sx,sy,26+(ff.fish.power*7),8+(ff.fish.power*3),Math.sin(ff.phase)*.2,0,7);ctx.fill();ctx.restore();ctx.strokeStyle='#f4ead5aa';ctx.beginPath();ctx.moveTo(w*.5,h*.78);ctx.lineTo(sx,sy);ctx.stroke();}
    const py=h*.79;const px=center-botWidth*.5-22;ctx.fillStyle='#24352c';ctx.beginPath();ctx.arc(px,py-25,6,0,7);ctx.fill();ctx.fillRect(px-4,py-19,8,17);ctx.strokeStyle='#2a332c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,py-15);ctx.lineTo(px+10,py-4);ctx.stroke();ctx.strokeStyle='#c7b98d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+8,py-8);ctx.lineTo(px+25,py-38);ctx.stroke();
    const vg=ctx.createRadialGradient(w*.5,h*.45,w*.2,w*.5,h*.45,w*.72);vg.addColorStop(0,'#0000');vg.addColorStop(1,'#07100d88');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
  }

  function drawSpot(s){const pulse=(Math.sin(state.t*3+s.pulse)+1)/2;ctx.save();ctx.globalAlpha=s.used?.22:.5+.25*pulse;ctx.strokeStyle='#e9fff1';ctx.lineWidth=1.5;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(s.x,s.y,s.r*(.7+i*.55)+pulse*3,5+i*4,0,0,7);ctx.stroke()}ctx.restore();if(!s.used){ctx.fillStyle='#f6f0dcdd';ctx.font='600 10px system-ui';ctx.textAlign='center';ctx.fillText(s.label,s.x,s.y-15)}}
  function drawRock(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-r,y+r*.5);ctx.lineTo(x-r*.55,y-r*.65);ctx.lineTo(x+r*.35,y-r);ctx.lineTo(x+r,y+r*.4);ctx.closePath();ctx.fill();}
  function drawGrass(x,y,side){ctx.strokeStyle='#354f3a';ctx.lineWidth=2;for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+side*(j-1)*4,y-8,x+side*(j-1)*5,y-15-j*2);ctx.stroke()}}
  function mountain(x,y,w,h,seed){ctx.beginPath();ctx.moveTo(x,y+h);for(let i=0;i<=7;i++){const xx=x+w*i/7;const yy=y+h*(.2+.5*Math.abs(Math.sin(i*1.7+seed)));ctx.lineTo(xx,yy)}ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill()}
  function mix(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ar=pa>>16,ag=pa>>8&255,ab=pa&255,br=pb>>16,bg=pb>>8&255,bb=pb&255;return`rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`}

  function pointerDown(e){if(state.mode==='card'||state.mode==='ending')return;state.pointerDown=true;state.downX=e.clientX;state.downY=e.clientY;state.lastY=e.clientY;state.moved=false;if(state.mode==='fight'&&state.fishFight)state.fishFight.hold=true}
  function pointerMove(e){if(!state.pointerDown)return;const dy=e.clientY-state.lastY;state.lastY=e.clientY;if(Math.abs(e.clientY-state.downY)>10)state.moved=true;if(state.mode==='walk'&&Math.abs(dy)>0){const before=currentZone();state.progress=Math.max(0,Math.min(99,state.progress-dy*.035));state.targetProgress=state.progress;state.timeOfDay+=Math.abs(dy)*.0008;if(currentZone()!==before){buildSpots();toast(`${zoneObj().name}へ入った`);navigator.vibrate?.(20)}updateHud()}}
  function pointerUp(e){if(!state.pointerDown)return;state.pointerDown=false;if(state.mode==='fight'&&state.fishFight){state.fishFight.hold=false;return}if(state.mode==='cast'&&state.biteWindow&&!state.moved){hook();return}if(state.mode==='walk'&&!state.moved){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;let best=null,bd=999;state.spots.forEach(s=>{const d=Math.hypot(s.x-x,s.y-y);if(d<bd&&!s.used){bd=d;best=s}});if(best&&bd<42)startCast(best)}}

  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
  window.addEventListener('resize',resize);
  el('catchClose').onclick=closeCatch;
  el('bookBtn').onclick=()=>{renderBook();el('book').classList.remove('hidden')};
  el('closeBook').onclick=()=>el('book').classList.add('hidden');
  el('restartBtn').onclick=()=>{storageRemove('river-memory');location.reload()};

  function renderBook(){
    const m=el('memoryMap');m.innerHTML='';zones.forEach((z,zi)=>{const sec=document.createElement('div');sec.className='memoryZone';sec.innerHTML=`<h3>${z.name}</h3>`;const list=fish.filter(f=>f.zone===zi);list.forEach(f=>{const d=state.discovered[f.id],row=document.createElement('div');row.className='fishChip '+(d?'':'unknown');row.innerHTML=d?`<span class="miniFish">◀</span><div><b>${f.name}</b><small>${d.size}cm ・ ${d.spot}</small></div>`:`<span class="miniFish">?</span><div><b>？？？</b><small>${zi===3?'滝壺の奥':'まだ知らない魚'}</small></div>`;sec.appendChild(row)});m.appendChild(sec)})
  }

  let audioCtx;
  function ping(freq=440,dur=.05,vol=.04){try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch{}}

  let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt,now);draw();requestAnimationFrame(loop)}
  resize();updateHud();requestAnimationFrame(loop);
})();
