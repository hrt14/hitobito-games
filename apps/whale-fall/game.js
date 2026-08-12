(() => {
  const $ = (s) => document.querySelector(s);
  const game = $('#game');
  const whale = $('#whale');
  const livingWhale = $('#livingWhale');
  const skeleton = $('#skeleton');
  const osedax = $('#osedax');
  const seafloor = $('#seafloor');
  const scavengers = $('#scavengers');
  const benthicLife = $('#benthicLife');
  const nutrients = $('#nutrients');
  const microbeCanvas = $('#microbeCanvas');
  const ctx = microbeCanvas.getContext('2d');
  const phaseLabel = $('#phaseLabel');
  const depthLabel = $('#depthLabel');
  const timeLabel = $('#timeLabel');
  const storyCaption = $('#storyCaption');
  const gestureHint = $('#gestureHint');
  const phaseDots = $('#phaseDots');
  const intro = $('#intro');
  const startButton = $('#startButton');
  const timeHold = $('#timeHold');
  const ending = $('#ending');
  const fieldGuide = $('#fieldGuide');
  const guideGrid = $('#guideGrid');
  const foundCount = $('#foundCount');

  const phases = [
    {key:'surface', label:'生きている海', depth:20, time:'0日'},
    {key:'descent', label:'沈降', depth:200, time:'数時間'},
    {key:'floor', label:'着底', depth:2400, time:'1日'},
    {key:'scavenge', label:'最初の食事', depth:2400, time:'3週間'},
    {key:'enrich', label:'海底が生き始める', depth:2400, time:'8か月'},
    {key:'bone', label:'骨を食べるもの', depth:2400, time:'3年'},
    {key:'chemo', label:'見えない生態系', depth:2400, time:'12年'},
    {key:'ending', label:'小さな世界', depth:2400, time:'数十年'}
  ];

  const creatures = [
    {id:'lantern', icon:'✦', name:'ハダカイワシの仲間', role:'沈降中に出会う中深層の魚'},
    {id:'shark', icon:'◁', name:'深海性のサメ', role:'大きな軟組織を噛み取るスカベンジャー'},
    {id:'hagfish', icon:'〜', name:'ヌタウナギ', role:'死骸に集まり軟組織を食べる'},
    {id:'grenadier', icon:'›', name:'ソコダラの仲間', role:'深海の死骸に集まる魚類'},
    {id:'amphipod', icon:'·', name:'端脚類', role:'小さな体で大量に集まる甲殻類'},
    {id:'polychaete', icon:'〰', name:'多毛類', role:'富栄養化した海底で増える'},
    {id:'osedax', icon:'⚘', name:'Osedaxの仲間', role:'クジラの骨を利用する特殊なゴカイ類'},
    {id:'microbe', icon:'⁙', name:'化学合成微生物', role:'硫化物などを利用し新しい食物網を支える'}
  ];
  const found = new Set();
  let phase = 0;
  let started = false;
  let descentDepth = 20;
  let downStartY = null;
  let holdingTimer = null;
  let captionTimer = null;
  let microbeRAF = null;
  let microbePoints = [];

  function init() {
    makeSnow();
    makeDistantFish();
    makePhaseDots();
    renderGuide();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    startButton.addEventListener('pointerdown', beginHold);
    startButton.addEventListener('pointerup', endIntroHold);
    startButton.addEventListener('pointercancel', cancelHold);
    timeHold.addEventListener('pointerdown', beginTimeHold);
    timeHold.addEventListener('pointerup', endTimeHold);
    timeHold.addEventListener('pointercancel', endTimeHold);
    game.addEventListener('pointerdown', onPointerDown);
    game.addEventListener('pointermove', onPointerMove);
    game.addEventListener('pointerup', onPointerUp);
    $('#infoButton').addEventListener('click', openGuide);
    $('#closeGuide').addEventListener('click', closeGuide);
    $('#openFieldGuide').addEventListener('click', openGuide);
    $('#restartButton').addEventListener('click', () => location.reload());
    showHint('「時間を進める」を長押し');
  }

  function makeSnow(){
    const snow=$('#snow');
    for(let i=0;i<54;i++){
      const p=document.createElement('i');
      p.style.left=Math.random()*100+'%';
      p.style.top=(-Math.random()*100)+'%';
      p.style.opacity=(.2+Math.random()*.6);
      p.style.animationDuration=(9+Math.random()*16)+'s';
      p.style.animationDelay=(-Math.random()*20)+'s';
      p.style.transform=`scale(${.5+Math.random()*1.6})`;
      snow.appendChild(p);
    }
  }
  function makeDistantFish(){
    const wrap=$('#distantLife');
    for(let i=0;i<7;i++){
      const f=document.createElement('i'); f.className='fish-sil';
      f.style.top=(16+Math.random()*60)+'%'; f.style.left=(-20-Math.random()*50)+'%';
      f.style.animationDelay=(-Math.random()*12)+'s'; f.style.animationDuration=(11+Math.random()*12)+'s';
      f.style.transform=`scale(${.5+Math.random()*.8})`; wrap.appendChild(f);
    }
  }
  function makePhaseDots(){ phases.forEach((_,i)=>{const d=document.createElement('i'); if(i===0)d.className='on'; phaseDots.appendChild(d);}); }
  function updateDots(){[...phaseDots.children].forEach((d,i)=>d.classList.toggle('on',i<=phase));}
  function showCaption(text,ms=2900){clearTimeout(captionTimer);storyCaption.textContent=text;storyCaption.classList.add('show');captionTimer=setTimeout(()=>storyCaption.classList.remove('show'),ms)}
  function showHint(text){gestureHint.textContent=text;gestureHint.classList.add('show')}
  function hideHint(){gestureHint.classList.remove('show')}

  function beginHold(e){e.preventDefault();startButton.setPointerCapture?.(e.pointerId);startButton.classList.add('holding');holdingTimer=setTimeout(()=>{holdingTimer=null;startExperience();},750)}
  function endIntroHold(){if(holdingTimer){clearTimeout(holdingTimer);holdingTimer=null;showHint('もう少し長く押してみる')}}
  function cancelHold(){if(holdingTimer)clearTimeout(holdingTimer);holdingTimer=null}
  function startExperience(){if(started)return;started=true;intro.classList.add('hide');hideHint();showCaption('泳ぎは、少しずつ遅くなっていく。',2200);livingWhale.style.animationDuration='8s';setTimeout(()=>{showCaption('そして、動かなくなった。',2200);livingWhale.querySelectorAll('.tail,.fin').forEach(x=>x.style.animationPlayState='paused');setTimeout(()=>setPhase(1),1800)},2400)}

  function setPhase(next){
    phase=Math.max(0,Math.min(phases.length-1,next)); const p=phases[phase];
    game.className=`game phase-${p.key}`; phaseLabel.textContent=p.label; timeLabel.textContent=p.time; depthLabel.textContent=(phase===1?Math.round(descentDepth):p.depth).toLocaleString()+' m';updateDots();hideHint();timeHold.classList.add('hidden');
    if(phase===1){showCaption('体は、暗い海へ沈み始める。');showHint('画面を下へスワイプ');discover('lantern',false)}
    if(phase===2){showCaption('2,400m。光の届かない海底。');impactSilt();setTimeout(()=>{showHint('暗闇をなぞって、匂いを広げる');},1500)}
    if(phase===3){showCaption('匂いをたどって、最初の食事が始まる。');spawnScavengers();timeHold.classList.remove('hidden');showHint('生き物をタップして発見 ／ 時間を長押し')}
    if(phase===4){showCaption('栄養は死骸だけでなく、海底へ広がっていく。');spawnBenthic();timeHold.classList.remove('hidden');showHint('海底をタップして拡大してみる')}
    if(phase===5){showCaption('肉がなくなっても、終わりではない。');revealSkeleton();timeHold.classList.remove('hidden');showHint('骨をタップしてみる')}
    if(phase===6){showCaption('目に見えないところでも、エネルギーは流れ続ける。');startMicrobes();discover('microbe',true);timeHold.classList.remove('hidden');showHint('骨を長押しすると流れが見える')}
    if(phase===7){finish();}
  }

  function onPointerDown(e){
    if(fieldGuide.classList.contains('open')||!started)return;
    downStartY=e.clientY;
    if(phase===2){spawnNutrient(e.clientX,e.clientY);}
    if(phase===4 && e.clientY>innerHeight*.55){benthicBloom(e.clientX,e.clientY)}
    if(phase===5 && e.target.closest?.('#whale')){showOsedax();}
    if(phase===6 && e.target.closest?.('#whale')){whale.classList.add('energy-view');microbeCanvas.style.filter='brightness(1.7)';}
  }
  function onPointerMove(e){
    if(phase===2 && downStartY!==null){spawnNutrient(e.clientX,e.clientY)}
    if(phase===1 && downStartY!==null){const dy=e.clientY-downStartY;if(dy>12){descentDepth=Math.min(2400,descentDepth+dy*3.6);depthLabel.textContent=Math.round(descentDepth).toLocaleString()+' m';whale.style.top=(43+Math.min(18,descentDepth/170))+'%';downStartY=e.clientY;if(descentDepth>2200){setTimeout(()=>setPhase(2),250);downStartY=null}}}
  }
  function onPointerUp(){downStartY=null;if(phase===6){whale.classList.remove('energy-view');microbeCanvas.style.filter=''}}

  function spawnNutrient(x,y){
    const n=document.createElement('i');n.className='nutrient';n.style.left=x+'px';n.style.top=y+'px';nutrients.appendChild(n);setTimeout(()=>n.remove(),2300);
    if(nutrients.childElementCount>18 && phase===2){setTimeout(()=>setPhase(3),500)}
  }

  function animal(type,id,x,y,label){
    const a=document.createElement('div');a.className=`animal ${type}`;a.dataset.id=id;a.style.left=x+'%';a.style.top=y+'%';a.innerHTML=`<span class="tag">${label}</span>`;a.addEventListener('click',(e)=>{e.stopPropagation();discover(id,true);a.classList.add('found')});scavengers.appendChild(a);return a;
  }
  function spawnScavengers(){
    animal('shark','shark',8,54,'深海性のサメ'); animal('grenadier','grenadier',70,48,'ソコダラの仲間');
    animal('hagfish','hagfish',51,72,'ヌタウナギ');
    for(let i=0;i<22;i++){const a=animal('amphipod','amphipod',28+Math.random()*47,62+Math.random()*18,'端脚類');a.style.animationDelay=(Math.random()*.8)+'s'}
  }

  function beginTimeHold(e){e.stopPropagation();timeHold.setPointerCapture?.(e.pointerId);timeHold.classList.add('holding');holdingTimer=setTimeout(()=>{holdingTimer=null;advanceByTime()},1150)}
  function endTimeHold(e){e?.stopPropagation();timeHold.classList.remove('holding');if(holdingTimer){clearTimeout(holdingTimer);holdingTimer=null}}
  function advanceByTime(){timeHold.classList.remove('holding');if(phase>=3&&phase<7)setPhase(phase+1)}

  function impactSilt(){seafloor.querySelector('.silt').animate([{opacity:.2,transform:'scale(.5)'},{opacity:.9,transform:'scale(2.4)'},{opacity:.25,transform:'scale(1)'}],{duration:1800,easing:'ease-out'});navigator.vibrate?.(35)}

  function spawnBenthic(){
    scavengers.style.opacity=.5;
    for(let i=0;i<100;i++){const d=document.createElement('i');d.className='benthic-dot';d.style.left=(10+Math.random()*80)+'%';d.style.top=(68+Math.random()*25)+'%';d.style.opacity=.25+Math.random()*.75;d.style.animationDelay=(-Math.random()*2)+'s';d.style.transform=`scale(${.5+Math.random()*1.6})`;benthicLife.appendChild(d)}
    discover('polychaete',true);
  }
  function benthicBloom(x,y){
    for(let i=0;i<18;i++){const d=document.createElement('i');d.className='benthic-dot';d.style.left=(x+(Math.random()-.5)*130)+'px';d.style.top=(y+(Math.random()-.5)*90)+'px';benthicLife.appendChild(d)}
    game.animate([{transform:'scale(1)'},{transform:'scale(1.015)'},{transform:'scale(1)'}],{duration:500});
  }

  function revealSkeleton(){livingWhale.animate([{opacity:1},{opacity:.25}],{duration:1300,fill:'forwards'});skeleton.style.opacity=1;scavengers.style.opacity=.18;benthicLife.style.opacity=.7;}
  function showOsedax(){
    if(osedax.childElementCount===0){for(let i=0;i<26;i++){const x=210+Math.random()*430,y=125+Math.random()*95;const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','worm');g.innerHTML=`<path d="M${x} ${y} q ${-4+Math.random()*8} -${10+Math.random()*17} ${-2+Math.random()*4} -${22+Math.random()*22}" stroke="#d97586" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="${x-2+Math.random()*4}" cy="${y-24-Math.random()*18}" r="${2+Math.random()*2}" fill="#f3a4ad"/>`;osedax.appendChild(g)}}
    osedax.style.opacity=1;discover('osedax',true);whale.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(1.18)'},{transform:'translate(-50%,-50%) scale(1.1)'}],{duration:800,fill:'forwards'});
  }

  function resizeCanvas(){const dpr=Math.min(2,devicePixelRatio||1);microbeCanvas.width=Math.floor(innerWidth*dpr);microbeCanvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);createMicrobePoints()}
  function createMicrobePoints(){microbePoints=Array.from({length:70},()=>({x:innerWidth*(.25+Math.random()*.5),y:innerHeight*(.54+Math.random()*.28),vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.18,r:.5+Math.random()*1.7,p:Math.random()*Math.PI*2}))}
  function startMicrobes(){if(microbeRAF)return;const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);for(const p of microbePoints){p.x+=p.vx;p.y+=p.vy;p.p+=.025;if(p.x<innerWidth*.18||p.x>innerWidth*.82)p.vx*=-1;if(p.y<innerHeight*.48||p.y>innerHeight*.88)p.vy*=-1;ctx.beginPath();ctx.fillStyle=`rgba(151,239,216,${.22+.35*(.5+.5*Math.sin(p.p))})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();if(Math.random()<.016){const q=microbePoints[(Math.random()*microbePoints.length)|0];ctx.beginPath();ctx.strokeStyle='rgba(120,230,215,.10)';ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}microbeRAF=requestAnimationFrame(draw)};microbeRAF=requestAnimationFrame(draw)}

  function discover(id,announce){if(found.has(id))return;found.add(id);foundCount.textContent=found.size;renderGuide();if(announce){const c=creatures.find(x=>x.id===id);showCaption(`発見：${c.name}`,1500)}}
  function renderGuide(){guideGrid.innerHTML=creatures.map(c=>{const unlocked=found.has(c.id);return `<article class="guide-item ${unlocked?'':'locked'}"><div class="guide-icon">${unlocked?c.icon:'?'}</div><div class="guide-name">${unlocked?c.name:'未発見'}</div><div class="guide-role">${unlocked?c.role:'この生態系のどこかにいる'}</div></article>`}).join('')}
  function openGuide(){fieldGuide.classList.add('open');fieldGuide.setAttribute('aria-hidden','false')}
  function closeGuide(){fieldGuide.classList.remove('open');fieldGuide.setAttribute('aria-hidden','true')}

  function finish(){timeHold.classList.add('hidden');hideHint();skeleton.style.opacity=1;osedax.style.opacity=1;startMicrobes();setTimeout(()=>ending.classList.remove('hidden'),1300)}

  init();
})();
