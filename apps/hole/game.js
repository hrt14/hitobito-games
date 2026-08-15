(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const bar = document.getElementById('bar');
  const pct = document.getElementById('pct');
  const sizeLabel = document.getElementById('sizeLabel');
  const toast = document.getElementById('toast');
  const hint = document.getElementById('hint');
  const countEl = document.getElementById('count');
  const pile = document.getElementById('pile');
  const under = document.getElementById('underground');
  const underBtn = document.getElementById('underBtn');
  const closeUg = document.getElementById('closeUg');
  const ending = document.getElementById('ending');
  const restart = document.getElementById('restart');

  let W=0,H=0,dpr=1,last=performance.now();
  const WORLD=2500;
  const TAU=Math.PI*2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);

  const TYPE = {
    leaf:{r:5,g:0.34,name:'葉っぱ',emoji:'🍃',tier:0,kind:'leaf'},
    pebble:{r:7,g:0.46,name:'小石',emoji:'🪨',tier:0,kind:'rock'},
    can:{r:9,g:0.62,name:'空き缶',emoji:'🥫',tier:0,kind:'can'},
    ball:{r:11,g:0.75,name:'ボール',emoji:'⚽️',tier:0,kind:'ball'},
    cone:{r:13,g:0.9,name:'カラーコーン',emoji:'🚧',tier:1,kind:'cone'},
    pot:{r:16,g:1.15,name:'植木鉢',emoji:'🪴',tier:1,kind:'pot'},
    person:{r:20,g:1.45,name:'人',emoji:'🚶',tier:1,kind:'person'},
    bench:{r:24,g:1.8,name:'ベンチ',emoji:'🪑',tier:2,kind:'bench'},
    bike:{r:29,g:2.1,name:'自転車',emoji:'🚲',tier:2,kind:'bike'},
    vending:{r:34,g:2.7,name:'自販機',emoji:'🥤',tier:2,kind:'vending'},
    car:{r:42,g:3.4,name:'車',emoji:'🚗',tier:3,kind:'car'},
    tree:{r:48,g:4.1,name:'大きな木',emoji:'🌳',tier:3,kind:'tree'},
    truck:{r:56,g:5.0,name:'トラック',emoji:'🚚',tier:3,kind:'truck'},
    kiosk:{r:66,g:6.2,name:'売店',emoji:'🏪',tier:4,kind:'kiosk'},
    house:{r:80,g:7.8,name:'家',emoji:'🏠',tier:4,kind:'house'},
    store:{r:98,g:9.8,name:'コンビニ',emoji:'🏬',tier:5,kind:'store'},
    apartment:{r:122,g:12.5,name:'マンション',emoji:'🏢',tier:5,kind:'apartment'},
    tower:{r:165,g:25,name:'街の塔',emoji:'🗼',tier:6,kind:'tower',goal:true}
  };
  const tierNames=['小物まで','植木鉢まで','自転車まで','車まで','家まで','ビルまで','街の塔まで'];

  let objects=[], particles=[], rings=[], collected=[], player, pointer, shownTier=-1, completed=false;

  function seededScatter(type,n,minR,maxR){
    for(let i=0;i<n;i++){
      const a=Math.random()*TAU, rr=rand(minR,maxR);
      let x=WORLD/2+Math.cos(a)*rr, y=WORLD/2+Math.sin(a)*rr;
      if(i%4===0) x+=Math.sin(i*1.7)*70;
      if(i%5===0) y+=Math.cos(i*1.3)*55;
      add(type,x,y,rand(-.15,.15));
    }
  }
  function add(type,x,y,rot=0){ const t=TYPE[type]; objects.push({type,x,y,r:t.r,rot,state:'alive',sink:0,seed:Math.random()*10}); }

  function reset(){
    objects=[];particles=[];rings=[];collected=[];completed=false;shownTier=-1;
    player={x:WORLD/2,y:WORLD/2,r:18,targetR:18,pulse:0,total:0,tier:0};
    pointer={down:false,sx:W/2,sy:H*.7,wx:player.x,wy:player.y};

    seededScatter('leaf',26,40,330); seededScatter('pebble',28,30,360); seededScatter('can',18,70,410); seededScatter('ball',14,100,430);
    seededScatter('cone',16,190,580); seededScatter('pot',18,220,620); seededScatter('person',18,300,700);
    seededScatter('bench',13,350,760); seededScatter('bike',14,390,800); seededScatter('vending',12,470,880);
    seededScatter('car',13,590,980); seededScatter('tree',14,620,1040); seededScatter('truck',9,700,1080);
    seededScatter('kiosk',8,820,1120); seededScatter('house',10,880,1180); seededScatter('store',6,980,1260); seededScatter('apartment',5,1060,1360);
    add('bike',WORLD/2+155,WORLD/2-110,.15);
    add('car',WORLD/2-210,WORLD/2+90,-.12);
    add('tree',WORLD/2+250,WORLD/2+170,.06);
    add('house',WORLD/2-420,WORLD/2-180,.02);
    add('store',WORLD/2+610,WORLD/2-260,.02);
    add('apartment',WORLD/2-760,WORLD/2+520,-.02);
    add('tower',WORLD/2+1010,WORLD/2-900,0);
    add('bench',WORLD/2+110,WORLD/2+45,0); add('pot',WORLD/2-85,WORLD/2-75,0); add('cone',WORLD/2+40,WORLD/2-95,0);
    buildPile(); updateHUD(); ending.classList.remove('show'); hint.style.opacity=1;
  }

  function resize(){
    dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px';canvas.style.height=H+'px'; ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize',resize);resize();

  function tierForRadius(r){ if(r<22)return 0;if(r<32)return 1;if(r<45)return 2;if(r<65)return 3;if(r<95)return 4;if(r<135)return 5;return 6; }
  function updateHUD(){
    const t=tierForRadius(player.r); player.tier=t; sizeLabel.textContent=tierNames[t];
    const thresholds=[18,22,32,45,65,95,135,210];
    const lo=thresholds[t], hi=thresholds[t+1]||190; const p=clamp((player.r-lo)/(hi-lo),0,1);
    bar.style.width=(p*100)+'%'; pct.textContent=t===6?'MAX':Math.round(p*100)+'%'; countEl.textContent=collected.length;
  }
  let toastTimer;
  function say(text){clearTimeout(toastTimer);toast.textContent=text;toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),1200);}

  function worldToScreen(x,y,zoom){return {x:(x-player.x)*zoom+W/2,y:(y-player.y)*zoom+H/2};}
  function currentZoom(){return clamp(1.16-(player.r-18)*.0041,.43,1.16);}
  function screenToWorld(sx,sy){const z=currentZoom(); return {x:(sx-W/2)/z+player.x,y:(sy-H/2)/z+player.y};}

  function onPointer(e,down){
    if(under.classList.contains('open')||completed)return;
    if(e.cancelable)e.preventDefault(); const p=e.touches?e.touches[0]:e; if(!p)return;
    pointer.down=down; pointer.sx=p.clientX;pointer.sy=p.clientY; const w=screenToWorld(pointer.sx,pointer.sy);pointer.wx=w.x;pointer.wy=w.y;
    if(down && collected.length===0) hint.style.opacity=.15;
  }
  canvas.addEventListener('pointerdown',e=>onPointer(e,true));canvas.addEventListener('pointermove',e=>{if(pointer.down)onPointer(e,true)});addEventListener('pointerup',()=>pointer.down=false);
  canvas.addEventListener('touchstart',e=>onPointer(e,true),{passive:false});canvas.addEventListener('touchmove',e=>onPointer(e,true),{passive:false});canvas.addEventListener('touchend',()=>pointer.down=false,{passive:false});

  function tryEat(o){
    if(o.state!=='alive')return;
    const d=dist(player.x,player.y,o.x,o.y); const edible=o.r <= player.r*.88;
    if(d < player.r*.76){
      if(edible){
        o.state='sinking'; o.sink=0; player.pulse=1; const t=TYPE[o.type];
        player.targetR=clamp(player.targetR+t.g*.44,18,210); player.total+=t.r;
        rings.push({x:o.x,y:o.y,r:player.r*.35,a:1});
        for(let i=0;i<7;i++)particles.push({x:o.x,y:o.y,vx:rand(-30,30),vy:rand(-30,30),life:1,size:rand(2,5)});
        if(navigator.vibrate)navigator.vibrate(t.r>50?24:10);
        tone(t.r);
      } else if(d < Math.max(8,player.r*.45) && Math.random()<.08){
        rings.push({x:o.x,y:o.y,r:o.r*.65,a:.35,bad:true});
      }
    }
  }

  let audio;
  function tone(size){
    try{
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      const osc=audio.createOscillator(), gain=audio.createGain(); osc.connect(gain);gain.connect(audio.destination);
      osc.type='sine';osc.frequency.setValueAtTime(clamp(260-size*1.4,75,240),audio.currentTime);osc.frequency.exponentialRampToValueAtTime(clamp(110-size*.25,55,105),audio.currentTime+.12);
      gain.gain.setValueAtTime(.05,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.14);osc.start();osc.stop(audio.currentTime+.15);
    }catch{}
  }

  function finishSink(o){
    o.state='gone'; collected.push(o.type); countEl.textContent=collected.length;
    const t=TYPE[o.type]; if(t.goal){completed=true;setTimeout(()=>ending.classList.add('show'),850);}
    const nt=tierForRadius(player.targetR); if(nt>shownTier){shownTier=nt; if(nt>0)say(`${tierNames[nt]}、落とせそう。`);}
    if(collected.length===1)say('落ちた。穴が少し広がった。');
    if(collected.length===8)hint.textContent='さっき無理だったものへ戻ってみよう';
    if(collected.length%10===0)buildPile(); updateHUD();
  }

  function update(dt){
    if(pointer.down){
      const w=screenToWorld(pointer.sx,pointer.sy); pointer.wx=w.x;pointer.wy=w.y;
      const dx=w.x-player.x,dy=w.y-player.y,dd=Math.hypot(dx,dy); const speed=clamp(245+player.r*1.5,260,430);
      if(dd>3){const step=Math.min(dd,speed*dt);player.x+=dx/dd*step;player.y+=dy/dd*step;}
    }
    const margin=80;player.x=clamp(player.x,margin,WORLD-margin);player.y=clamp(player.y,margin,WORLD-margin);
    player.r+=(player.targetR-player.r)*Math.min(1,dt*4.8);player.pulse*=Math.pow(.015,dt);
    for(const o of objects){
      if(o.state==='alive')tryEat(o);
      else if(o.state==='sinking'){o.sink+=dt*2.65;if(o.sink>=1)finishSink(o);}
    }
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt*2.2;}
    particles=particles.filter(p=>p.life>0);
    for(const r of rings){r.r+=70*dt;r.a-=dt*1.8;} rings=rings.filter(r=>r.a>0);
    updateHUD();
  }

  function drawBackground(z){
    ctx.fillStyle='#d9eee0';ctx.fillRect(0,0,W,H);
    const tl=screenToWorld(0,0), br=screenToWorld(W,H);
    const zones=[
      {x:WORLD/2,y:WORLD/2,r:390,c:'#bfe1c5'},
      {x:WORLD/2+720,y:WORLD/2-380,r:480,c:'#d8ddbd'},
      {x:WORLD/2-720,y:WORLD/2+520,r:520,c:'#c3d8c0'},
      {x:WORLD/2-470,y:WORLD/2-720,r:380,c:'#d8e0c6'}
    ];
    for(const q of zones){const s=worldToScreen(q.x,q.y,z);ctx.beginPath();ctx.fillStyle=q.c;ctx.arc(s.x,s.y,q.r*z,0,TAU);ctx.fill();}
    ctx.lineCap='round';ctx.strokeStyle='#edf0e8';ctx.lineWidth=78*z;
    const roads=[[[290,1240],[630,1060],[1060,1140],[1440,970],[1850,1120],[2210,900]],[[1270,260],[1140,700],[1250,1150],[1110,1580],[1330,2200]],[[470,1840],[820,1600],[1230,1700],[1660,1600],[2030,1880]]];
    for(const pts of roads){ctx.beginPath();pts.forEach((p,i)=>{const s=worldToScreen(p[0],p[1],z);i?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y)});ctx.stroke();}
    ctx.strokeStyle='rgba(86,112,94,.18)';ctx.lineWidth=2*z;
    for(let gx=Math.floor(tl.x/120)*120;gx<br.x;gx+=120){const a=worldToScreen(gx,tl.y,z),b=worldToScreen(gx,br.y,z);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    for(let gy=Math.floor(tl.y/120)*120;gy<br.y;gy+=120){const a=worldToScreen(tl.x,gy,z),b=worldToScreen(br.x,gy,z);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    ctx.fillStyle='rgba(62,122,73,.25)';
    for(let i=0;i<70;i++){const x=(i*193)%WORLD,y=(i*337+120)%WORLD;if(x<tl.x-20||x>br.x+20||y<tl.y-20||y>br.y+20)continue;const s=worldToScreen(x,y,z);ctx.beginPath();ctx.arc(s.x,s.y,2.2*z,0,TAU);ctx.fill();}
  }

  function shadow(s,r,z,alpha=.16){ctx.save();ctx.translate(s.x+r*.12*z,s.y+r*.38*z);ctx.scale(1,.42);ctx.beginPath();ctx.fillStyle=`rgba(34,48,40,${alpha})`;ctx.arc(0,0,r*z,0,TAU);ctx.fill();ctx.restore();}

  function drawObject(o,z){
    if(o.state==='gone')return;const t=TYPE[o.type],s=worldToScreen(o.x,o.y,z);let k=1,drop=0;
    if(o.state==='sinking'){const q=clamp(o.sink,0,1);k=1-q*q;drop=q*22*z;}
    const R=o.r*z*k;if(R<1)return;
    shadow({x:s.x,y:s.y+drop},o.r*k,z,.18*(1-(o.sink||0)));
    ctx.save();ctx.translate(s.x,s.y+drop);ctx.rotate(o.rot);ctx.scale(k*z,k*z);
    const r=o.r;
    switch(t.kind){
      case 'leaf': ctx.fillStyle='#5d9c63';ctx.beginPath();ctx.ellipse(0,0,r*1.25,r*.62,-.4,0,TAU);ctx.fill();ctx.strokeStyle='#3e7147';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-r*.8,r*.35);ctx.lineTo(r*.85,-r*.38);ctx.stroke();break;
      case 'rock': ctx.fillStyle='#8b918a';poly([[-r*.8,r*.35],[-r*.6,-r*.5],[0,-r*.82],[r*.76,-r*.36],[r*.9,r*.42],[.1*r,r*.8]],true);break;
      case 'can': ctx.fillStyle='#e45f55';roundRect(-r*.58,-r,r*1.16,r*2,r*.25);ctx.fill();ctx.fillStyle='#f0eee5';ctx.fillRect(-r*.55,-r*.58,r*1.1,r*.35);ctx.strokeStyle='#9aaca4';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,-r,r*.55,r*.18,0,0,TAU);ctx.stroke();break;
      case 'ball': ctx.fillStyle='#f7e4b3';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.strokeStyle='#c98561';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-r*.4,0,r*.55,-1.2,1.2);ctx.stroke();break;
      case 'cone': ctx.fillStyle='#ef7c3b';poly([[0,-r],[r*.72,r*.6],[-r*.72,r*.6]],true);ctx.fillStyle='#f7f1dd';ctx.fillRect(-r*.44,-r*.06,r*.88,r*.25);ctx.fillStyle='#44544c';roundRect(-r,r*.58,r*2,r*.34,r*.12);ctx.fill();break;
      case 'pot': ctx.fillStyle='#437a4e';ctx.beginPath();ctx.arc(0,-r*.45,r*.68,0,TAU);ctx.fill();ctx.fillStyle='#b36f4d';poly([[-r*.65,-r*.1],[r*.65,-r*.1],[r*.45,r*.85],[-r*.45,r*.85]],true);break;
      case 'person': ctx.fillStyle='#efc29e';ctx.beginPath();ctx.arc(0,-r*.6,r*.3,0,TAU);ctx.fill();ctx.strokeStyle='#3f5964';ctx.lineWidth=r*.25;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-r*.28);ctx.lineTo(0,r*.42);ctx.moveTo(0,0);ctx.lineTo(-r*.42,r*.2);ctx.moveTo(0,0);ctx.lineTo(r*.42,r*.2);ctx.moveTo(0,r*.42);ctx.lineTo(-r*.3,r*.88);ctx.moveTo(0,r*.42);ctx.lineTo(r*.3,r*.88);ctx.stroke();break;
      case 'bench': ctx.fillStyle='#9a693e';roundRect(-r,-r*.3,r*2,r*.38,r*.08);ctx.fill();roundRect(-r*.92,r*.16,r*1.84,r*.32,r*.08);ctx.fill();ctx.strokeStyle='#4d544d';ctx.lineWidth=r*.12;ctx.beginPath();ctx.moveTo(-r*.65,r*.4);ctx.lineTo(-r*.65,r*.82);ctx.moveTo(r*.65,r*.4);ctx.lineTo(r*.65,r*.82);ctx.stroke();break;
      case 'bike': ctx.strokeStyle='#344b48';ctx.lineWidth=r*.1;ctx.beginPath();ctx.arc(-r*.55,r*.35,r*.4,0,TAU);ctx.arc(r*.55,r*.35,r*.4,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(-r*.55,r*.35);ctx.lineTo(-r*.08,-r*.1);ctx.lineTo(r*.26,r*.35);ctx.lineTo(-r*.55,r*.35);ctx.moveTo(-r*.08,-r*.1);ctx.lineTo(r*.12,-r*.42);ctx.lineTo(r*.55,r*.35);ctx.stroke();break;
      case 'vending': ctx.fillStyle='#e8e5d9';roundRect(-r*.58,-r,r*1.16,r*2,r*.12);ctx.fill();ctx.fillStyle='#3d6f8d';roundRect(-r*.4,-r*.7,r*.8,r*.72,r*.08);ctx.fill();ctx.fillStyle='#f3c85a';for(let i=0;i<3;i++)ctx.fillRect(-r*.3+i*r*.3,-r*.58,r*.18,r*.12);ctx.fillStyle='#303c38';ctx.fillRect(r*.18,r*.24,r*.22,r*.3);break;
      case 'car': ctx.fillStyle='#517ba7';roundRect(-r,-r*.5,r*2,r, r*.28);ctx.fill();ctx.fillStyle='#bcd7df';poly([[-r*.45,-r*.5],[-r*.18,-r*.85],[r*.45,-r*.85],[r*.7,-r*.5]],true);ctx.fillStyle='#202d2a';for(const x of [-r*.55,r*.55]){ctx.beginPath();ctx.arc(x,r*.52,r*.2,0,TAU);ctx.fill()}break;
      case 'tree': ctx.fillStyle='#795638';ctx.fillRect(-r*.18,0,r*.36,r*.9);ctx.fillStyle='#4f8754';for(const q of [[0,-r*.45],[-r*.45,-r*.15],[r*.42,-r*.12],[0,r*.12]]){ctx.beginPath();ctx.arc(q[0],q[1],r*.52,0,TAU);ctx.fill()}break;
      case 'truck': ctx.fillStyle='#d4cfb7';roundRect(-r,-r*.48,r*1.35,r*.96,r*.12);ctx.fill();ctx.fillStyle='#d46d4a';roundRect(r*.18,-r*.42,r*.72,r*.84,r*.12);ctx.fill();ctx.fillStyle='#202d2a';for(const x of [-r*.55,r*.5]){ctx.beginPath();ctx.arc(x,r*.48,r*.18,0,TAU);ctx.fill()}break;
      case 'kiosk': building(r,'#d79052','#f3e2bf',.9); awning(r,'#456f5a');break;
      case 'house': building(r,'#d8b17b','#f2e1c2',1);ctx.fillStyle='#8b5e4b';poly([[-r*1.05,-r*.35],[0,-r*1.12],[r*1.05,-r*.35]],true);ctx.fillStyle='#6b7d82';ctx.fillRect(-r*.18,r*.18,r*.36,r*.7);break;
      case 'store': building(r,'#ece7d8','#f7f2e8',.82);awning(r,'#4b8264');ctx.fillStyle='#446758';ctx.fillRect(-r*.75,-r*.55,r*1.5,r*.22);break;
      case 'apartment': building(r,'#bdc4bc','#e6e9e4',1.12);ctx.fillStyle='#637b73';for(let yy=-.72;yy<.72;yy+=.36)for(let xx=-.65;xx<.66;xx+=.43)ctx.fillRect(xx*r,yy*r,r*.2,r*.18);break;
      case 'tower': ctx.fillStyle='#cc554b';ctx.lineWidth=r*.08;ctx.strokeStyle='#8b3d38';ctx.beginPath();ctx.moveTo(-r*.38,r);ctx.lineTo(0,-r);ctx.lineTo(r*.38,r);ctx.stroke();for(let y=-.55;y<.8;y+=.36){ctx.beginPath();ctx.moveTo(-r*.24,y*r);ctx.lineTo(r*.24,y*r);ctx.stroke()}ctx.fillStyle='#efe4cf';ctx.fillRect(-r*.55,r*.42,r*1.1,r*.12);break;
    }
    ctx.restore();

    if(o.state==='alive' && o.r>player.r*.88 && o.r<player.r*1.35){ctx.save();ctx.strokeStyle='rgba(255,255,255,.62)';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(s.x,s.y,(o.r+5)*z,0,TAU);ctx.stroke();ctx.restore();}
  }
  function poly(points,fill=false){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();fill?ctx.fill():ctx.stroke();}
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function building(r,wall,front,ratio){ctx.fillStyle=wall;roundRect(-r,-r*ratio,r*2,r*ratio*1.85,r*.1);ctx.fill();ctx.fillStyle=front;roundRect(-r*.82,-r*ratio*.82,r*1.64,r*ratio*1.55,r*.08);ctx.fill();}
  function awning(r,c){ctx.fillStyle=c;for(let i=-3;i<=2;i++){ctx.fillRect(i*r*.27,-r*.78,r*.22,r*.34)}ctx.fillStyle='#29443a';ctx.fillRect(-r*.18,r*.12,r*.36,r*.65);}

  function drawPlayer(z){
    const x=W/2,y=H/2,r=player.r*z*(1+player.pulse*.08);
    ctx.save();ctx.translate(x,y);ctx.scale(1,.68);
    ctx.beginPath();ctx.fillStyle='rgba(34,52,43,.24)';ctx.arc(3,8,r*1.08,0,TAU);ctx.fill();
    const g=ctx.createRadialGradient(-r*.18,-r*.28,r*.05,0,0,r);g.addColorStop(0,'#263a31');g.addColorStop(.45,'#111a16');g.addColorStop(1,'#030504');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.02,Math.PI*1.05,Math.PI*1.85);ctx.stroke();ctx.restore();
    if(pointer.down){ctx.strokeStyle='rgba(18,42,31,.22)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(pointer.sx,pointer.sy,22,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(pointer.sx,pointer.sy);ctx.stroke();}
  }

  function draw(){
    const z=currentZoom();drawBackground(z);
    const visible=objects.filter(o=>o.state!=='gone').sort((a,b)=>a.y-b.y);for(const o of visible)drawObject(o,z);
    for(const r of rings){const s=worldToScreen(r.x,r.y,z);ctx.strokeStyle=r.bad?`rgba(190,80,65,${r.a})`:`rgba(255,255,255,${r.a})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,r.r*z,0,TAU);ctx.stroke();}
    for(const p of particles){const s=worldToScreen(p.x,p.y,z);ctx.fillStyle=`rgba(255,255,255,${p.life})`;ctx.beginPath();ctx.arc(s.x,s.y,p.size,0,TAU);ctx.fill();}
    drawPlayer(z);
    ctx.fillStyle='rgba(255,255,255,.035)';ctx.fillRect(0,0,W,H);
  }

  function loop(now){const dt=Math.min(.034,(now-last)/1000);last=now;if(!under.classList.contains('open')&&!completed)update(dt);draw();requestAnimationFrame(loop)}

  function buildPile(){
    pile.innerHTML=''; const latest=collected.slice(-34); latest.forEach((type,i)=>{const t=TYPE[type],el=document.createElement('span');el.className='pileItem';el.textContent=t.emoji; const col=i%7,row=Math.floor(i/7);el.style.left=(11+col*13+((row%2)*5))+'%';el.style.top=(86-row*14-rand(0,6))+'%';el.style.setProperty('--s',clamp(20+t.r*.18,22,44)+'px');el.style.setProperty('--r',rand(-24,24)+'deg');el.style.setProperty('--d',(-Math.random()*2.5)+'s');pile.appendChild(el);});
    if(!latest.length){const e=document.createElement('div');e.textContent='まだ何も落ちていない。';e.style.cssText='position:absolute;inset:0;display:grid;place-items:center;opacity:.38;font-weight:800;font-size:12px';pile.appendChild(e);}
  }
  underBtn.onclick=()=>{buildPile();under.classList.add('open')}; closeUg.onclick=()=>under.classList.remove('open'); restart.onclick=()=>reset();

  reset(); requestAnimationFrame(loop);
})();
