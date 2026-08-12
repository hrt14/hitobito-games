(() => {
  const $ = (s) => document.querySelector(s);
  const game = $('#game'), whale = $('#whale'), livingWhale = $('#livingWhale'), skeleton = $('#skeleton');
  const osedax = $('#osedax'), scavengers = $('#scavengers'), scent = $('#scent'), approaching = $('#approaching');
  const bloomLayer = $('#bloomLayer'), energyCanvas = $('#energyCanvas'), ctx = energyCanvas.getContext('2d');
  const phaseLabel = $('#phaseLabel'), timeLabel = $('#timeLabel'), depthLabel = $('#depthLabel'), phaseDots = $('#phaseDots');
  const intro = $('#intro'), storyCaption = $('#storyCaption'), actionDock = $('#actionDock'), actionIcon = $('#actionIcon');
  const actionTitle = $('#actionTitle'), actionSub = $('#actionSub'), actionProgress = $('#actionProgress i'), timeButton = $('#timeButton');
  const fieldGuide = $('#fieldGuide'), guideGrid = $('#guideGrid'), foundCount = $('#foundCount'), ending = $('#ending');

  const phases = [
    ['surface','生きている海','0日',20],['descent','沈降','数時間',20],['floor','着底','1日',2400],
    ['scavenge','最初の食事','3週間',2400],['enrich','海底が生き始める','8か月',2400],
    ['bone','骨を食べるもの','3年',2400],['chemo','見えない生態系','12年',2400],['ending','小さな世界','数十年',2400]
  ];
  const creatures = [
    ['lantern','✦','ハダカイワシの仲間','沈降中に出会う中深層の魚'],['shark','◁','深海性のサメ','大きな軟組織を噛み取る'],
    ['hagfish','〜','ヌタウナギ','死骸に集まり軟組織を食べる'],['grenadier','›','ソコダラの仲間','深海の死骸に集まる魚'],
    ['amphipod','·','端脚類','小さな体で大量に集まる甲殻類'],['polychaete','〰','多毛類','栄養の増えた海底で増える'],
    ['osedax','⚘','Osedaxの仲間','クジラの骨を利用する'],['microbe','⁙','化学合成微生物','骨に残るエネルギーから食物網を支える']
  ];

  const found = new Set();
  let phase = 0, started = false, depth = 20, pointerY = null, pointerX = null, dragging = false;
  let scentScore = 0, holdTimer = null, captionTimer = null, bloomHits = 0, boneHoldTimer = null, energyRAF = null;
  let energyPoints = [];

  function init(){
    makeSnow(); makeFish(); makeDots(); renderGuide(); resizeCanvas();
    addEventListener('resize', resizeCanvas);
    $('#startButton').addEventListener('click', startExperience);
    $('#guideButton').addEventListener('click', openGuide); $('#closeGuide').addEventListener('click', closeGuide); $('#endingGuide').addEventListener('click', openGuide);
    $('#restartButton').addEventListener('click', () => location.reload());
    timeButton.addEventListener('pointerdown', beginTimeHold); timeButton.addEventListener('pointerup', cancelTimeHold); timeButton.addEventListener('pointercancel', cancelTimeHold);
    game.addEventListener('pointerdown', onDown); game.addEventListener('pointermove', onMove); game.addEventListener('pointerup', onUp); game.addEventListener('pointercancel', onUp);
  }

  function makeSnow(){for(let i=0;i<58;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.top=(-Math.random()*100)+'%';p.style.opacity=.18+Math.random()*.65;p.style.animationDuration=9+Math.random()*17+'s';p.style.animationDelay=-Math.random()*20+'s';$('#snow').appendChild(p)}}
  function makeFish(){for(let i=0;i<7;i++){const f=document.createElement('i');f.className='fish-sil';f.style.top=16+Math.random()*58+'%';f.style.left=-25-Math.random()*60+'%';f.style.animationDelay=-Math.random()*12+'s';f.style.animationDuration=12+Math.random()*12+'s';$('#distantLife').appendChild(f)}}
  function makeDots(){phases.forEach((_,i)=>{const d=document.createElement('i');if(i===0)d.className='on';phaseDots.appendChild(d)})}
  function updateDots(){[...phaseDots.children].forEach((d,i)=>d.classList.toggle('on',i<=phase))}
  function caption(text,ms=2300){clearTimeout(captionTimer);storyCaption.textContent=text;storyCaption.classList.add('show');captionTimer=setTimeout(()=>storyCaption.classList.remove('show'),ms)}
  function dock(icon,title,sub,progress=0){actionIcon.textContent=icon;actionTitle.textContent=title;actionSub.textContent=sub;actionProgress.style.width=progress+'%';actionDock.classList.remove('hidden')}
  function hideDock(){actionDock.classList.add('hidden')}
  function haptic(ms=20){navigator.vibrate?.(ms)}

  function startExperience(){
    if(started)return; started=true; intro.classList.add('hide'); haptic(18);
    caption('ゆっくり泳いでいたクジラが、止まった。',2200);
    livingWhale.querySelectorAll('.tail,.fin').forEach(x=>x.style.animationPlayState='paused');
    setTimeout(()=>setPhase(1),1900);
  }

  function setPhase(next){
    phase=Math.max(0,Math.min(phases.length-1,next)); const [key,label,time,baseDepth]=phases[phase];
    game.className=`game phase-${key}`; phaseLabel.textContent=label; timeLabel.textContent=time; depthLabel.textContent=(phase===1?Math.round(depth):baseDepth).toLocaleString()+' m'; updateDots();
    hideDock(); timeButton.classList.add('hidden'); approaching.classList.remove('show');
    if(phase===1){game.style.setProperty('--flesh','1');game.style.setProperty('--bone','0');caption('光の届かない場所へ。');dock('↓','下へスワイプ','深海 2,400m まで沈める',0);discover('lantern',false)}
    if(phase===2){impact();caption('海底に着いた。ここには、ほとんど何もいない。');dock('〜','海中をなぞる','匂いを遠くまで広げる',0)}
    if(phase===3){game.style.setProperty('--flesh','.72');game.style.setProperty('--bone','.18');addDecay(3);caption('匂いをたどって、食べる者たちが来た。');spawnScavengers();timeButton.classList.remove('hidden');dock('◌','生き物をタップ','何が来たか見つけられる',100)}
    if(phase===4){game.style.setProperty('--flesh','.42');game.style.setProperty('--bone','.52');addDecay(6);caption('クジラの周りの海底まで、栄養で変わっていく。');makeBloomPatches();dock('•','光る海底をタップ','3か所の変化を見つける',0)}
    if(phase===5){game.style.setProperty('--flesh','.12');game.style.setProperty('--bone','1');addDecay(9);caption('肉がなくなっても、終わりではない。');dock('＋','骨をタップ','もっと近くで見る',0)}
    if(phase===6){game.style.setProperty('--flesh','.04');game.style.setProperty('--bone','1');caption('骨の中にも、まだエネルギーが残っている。');startEnergy();dock('◎','骨を長押し','見えない流れを浮かび上がらせる',0)}
    if(phase===7) finish();
  }

  function onDown(e){
    if(fieldGuide.classList.contains('open')||!started)return;
    pointerY=e.clientY; pointerX=e.clientX; dragging=true;
    if(phase===2){addScent(e.clientX,e.clientY,5)}
    if(phase===5 && e.target.closest?.('#whale')){showOsedax();setTimeout(()=>setPhase(6),1200)}
    if(phase===6 && e.target.closest?.('#whale')) beginBoneHold(e);
  }
  function onMove(e){
    if(!dragging)return;
    if(phase===1){const dy=e.clientY-pointerY;if(dy>6){depth=Math.min(2400,depth+dy*5.8);pointerY=e.clientY;const p=Math.min(100,(depth-20)/2380*100);game.style.setProperty('--depth',(p/100).toFixed(2));depthLabel.textContent=Math.round(depth).toLocaleString()+' m';whale.style.top=44+Math.min(20,p*.2)+'%';dock('↓','下へスワイプ',depth<1000?'光が急に弱くなる':'海底が近い',p);if(depth>=2380){dragging=false;haptic(35);setTimeout(()=>setPhase(2),250)}}}
    if(phase===2){const dx=e.clientX-pointerX,dy=e.clientY-pointerY;const dist=Math.hypot(dx,dy);if(dist>8){addScent(e.clientX,e.clientY,Math.min(8,dist/3));pointerX=e.clientX;pointerY=e.clientY}}
  }
  function onUp(){dragging=false;pointerY=null;pointerX=null;cancelBoneHold()}

  function addScent(x,y,amount){
    const n=document.createElement('i');n.style.left=x+'px';n.style.top=y+'px';scent.appendChild(n);setTimeout(()=>n.remove(),2000);
    scentScore=Math.min(100,scentScore+amount);dock('〜','海中をなぞる',scentScore<45?'匂いが広がっている':scentScore<80?'暗闇で何かが動いた':'もうすぐ届く',scentScore);
    if(scentScore>42)approaching.classList.add('show');
    if(scentScore>=100 && phase===2){haptic(28);setTimeout(()=>setPhase(3),450)}
  }

  function impact(){const s=$('.silt-cloud');s.animate([{opacity:.15,transform:'scale(.5)'},{opacity:1,transform:'scale(2.8)'},{opacity:.25,transform:'scale(1)'}],{duration:1500,easing:'ease-out'});haptic(38)}

  function animal(type,id,x,y,label){const a=document.createElement('div');a.className=`animal ${type}`;a.dataset.id=id;a.style.left=x+'%';a.style.top=y+'%';a.innerHTML=`<span class="tag">${label}</span>`;a.addEventListener('click',e=>{e.stopPropagation();discover(id,true);a.classList.add('found');haptic(10)});scavengers.appendChild(a);return a}
  function spawnScavengers(){
    scavengers.innerHTML='';animal('shark','shark',4,52,'深海性のサメ');animal('grenadier','grenadier',72,49,'ソコダラの仲間');animal('hagfish','hagfish',48,70,'ヌタウナギ');
    for(let i=0;i<24;i++){const a=animal('amphipod','amphipod',27+Math.random()*48,61+Math.random()*19,'端脚類');a.style.animationDelay=Math.random()*.8+'s'}
  }
  function beginTimeHold(e){if(phase!==3)return;e.stopPropagation();timeButton.setPointerCapture?.(e.pointerId);timeButton.classList.add('holding');scavengers.classList.add('fast');caption('食べる。運ぶ。さらに集まる。',1500);haptic(12);holdTimer=setTimeout(()=>{holdTimer=null;timeButton.classList.remove('holding');scavengers.classList.remove('fast');game.style.setProperty('--flesh','.42');game.style.setProperty('--bone','.52');addDecay(6);haptic(30);setTimeout(()=>setPhase(4),500)},1150)}
  function cancelTimeHold(e){e?.stopPropagation();timeButton.classList.remove('holding');scavengers.classList.remove('fast');if(holdTimer){clearTimeout(holdTimer);holdTimer=null}}

  function addDecay(count){
    const g=$('#decayMarks'); while(g.childElementCount<count){const p=document.createElementNS('http://www.w3.org/2000/svg','path');const x=280+Math.random()*450,y=120+Math.random()*120,r=14+Math.random()*30;p.setAttribute('d',`M${x-r} ${y} q${r*.5} -${r} ${r} 0 q${r*.7} ${r*.7} ${r*1.4} 0 q-${r*.3} ${r*1.2} -${r*1.2} ${r*.7} q-${r} ${r*.3} -${r*1.2} -${r*.7}Z`);g.appendChild(p)}
  }

  function makeBloomPatches(){
    bloomLayer.innerHTML='';bloomHits=0;const spots=[[25,32],[50,48],[72,30]];
    spots.forEach(([x,y])=>{const p=document.createElement('button');p.className='bloom-patch';p.style.left=x+'%';p.style.top=y+'%';p.setAttribute('aria-label','栄養が集まった海底');p.addEventListener('click',e=>{e.stopPropagation();if(p.classList.contains('done'))return;p.classList.add('done');bloomHits++;discover('polychaete',bloomHits===1);haptic(13);dock('•','海底が生き始めた',`${bloomHits}/3 か所`,bloomHits/3*100);if(bloomHits===3){caption('何もなかった泥に、小さな命が密集した。',1900);setTimeout(()=>setPhase(5),1400)}});bloomLayer.appendChild(p)})
  }

  function showOsedax(){
    if(osedax.childElementCount===0){for(let i=0;i<34;i++){const x=220+Math.random()*460,y=128+Math.random()*95;const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','worm');g.innerHTML=`<path d="M${x} ${y} q ${-5+Math.random()*10} -${12+Math.random()*18} ${-3+Math.random()*6} -${25+Math.random()*25}" stroke="#da798b" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="${x-2+Math.random()*4}" cy="${y-27-Math.random()*18}" r="${2+Math.random()*2}" fill="#f4a6b0"/>`;osedax.appendChild(g)}}
    osedax.style.opacity=1;discover('osedax',true);whale.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(1.2)'},{transform:'translate(-50%,-50%) scale(1.12)'}],{duration:700,fill:'forwards'});haptic(20)
  }

  function beginBoneHold(e){e.stopPropagation();whale.classList.add('energy-view');energyCanvas.style.filter='brightness(1.8)';haptic(10);boneHoldTimer=setTimeout(()=>{boneHoldTimer=null;discover('microbe',true);dock('◎','エネルギーがつながった','骨 → 微生物 → 新しい食物網',100);caption('太陽のない深海で、新しい食物網ができた。',2500);haptic(35);setTimeout(()=>setPhase(7),2500)},1350)}
  function cancelBoneHold(){if(phase!==6)return;whale.classList.remove('energy-view');energyCanvas.style.filter='';if(boneHoldTimer){clearTimeout(boneHoldTimer);boneHoldTimer=null}}

  function resizeCanvas(){const dpr=Math.min(2,devicePixelRatio||1);energyCanvas.width=Math.floor(innerWidth*dpr);energyCanvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);energyPoints=Array.from({length:82},()=>({x:innerWidth*(.2+Math.random()*.62),y:innerHeight*(.5+Math.random()*.34),vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.18,r:.7+Math.random()*1.9,p:Math.random()*Math.PI*2}))}
  function startEnergy(){if(energyRAF)return;const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);for(let i=0;i<energyPoints.length;i++){const p=energyPoints[i];p.x+=p.vx;p.y+=p.vy;p.p+=.025;if(p.x<innerWidth*.15||p.x>innerWidth*.86)p.vx*=-1;if(p.y<innerHeight*.47||p.y>innerHeight*.9)p.vy*=-1;ctx.beginPath();ctx.fillStyle=`rgba(153,242,216,${.22+.42*(.5+.5*Math.sin(p.p))})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();if(i%6===0){const q=energyPoints[(i+13)%energyPoints.length];ctx.beginPath();ctx.strokeStyle='rgba(125,235,215,.08)';ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}energyRAF=requestAnimationFrame(draw)};energyRAF=requestAnimationFrame(draw)}

  function discover(id,announce){if(found.has(id))return;found.add(id);foundCount.textContent=found.size;renderGuide();if(announce){const c=creatures.find(x=>x[0]===id);caption(`発見：${c[2]}`,1300)}}
  function renderGuide(){guideGrid.innerHTML=creatures.map(c=>{const unlocked=found.has(c[0]);return `<article class="guide-item ${unlocked?'':'locked'}"><div class="guide-icon">${unlocked?c[1]:'?'}</div><div class="guide-name">${unlocked?c[2]:'未発見'}</div><div class="guide-role">${unlocked?c[3]:'この世界のどこかにいる'}</div></article>`}).join('')}
  function openGuide(){fieldGuide.classList.add('open');fieldGuide.setAttribute('aria-hidden','false')}
  function closeGuide(){fieldGuide.classList.remove('open');fieldGuide.setAttribute('aria-hidden','true')}
  function finish(){hideDock();timeButton.classList.add('hidden');game.style.setProperty('--flesh','.02');game.style.setProperty('--bone','1');osedax.style.opacity=1;startEnergy();setTimeout(()=>ending.classList.remove('hidden'),900)}

  init();
})();
