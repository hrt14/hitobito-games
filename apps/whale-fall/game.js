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
    ['lantern','ハダカイワシの仲間','沈降中に出会う。腹側の発光器が点々と光る中深層魚。'],
    ['shark','深海性のサメ','大きな軟組織を噛み取り、最初に死骸を利用する。'],
    ['hagfish','ヌタウナギ','細長い体で死骸のすき間に入り、軟組織を食べる。'],
    ['grenadier','ソコダラの仲間','大きな頭と細長い尾をもつ深海魚。死骸に集まる。'],
    ['amphipod','端脚類','エビに似た節足動物。小さくても大群で死骸を覆う。'],
    ['polychaete','多毛類','体の両側に毛をもつゴカイの仲間。栄養の増えた泥で急増する。'],
    ['osedax','Osedaxの仲間','クジラの骨に根を張る。赤い房のような部分が骨の上に広がる。'],
    ['microbe','化学合成微生物','太陽光ではなく化学反応のエネルギーを使い、新しい食物網を支える。']
  ];

  const POLISH_CSS = `
    .animal .tag{font-size:12px!important;font-weight:800!important;padding:7px 10px!important;top:-35px!important;background:rgba(0,8,13,.9)!important;border:1px solid rgba(205,244,255,.22)!important;box-shadow:0 8px 20px rgba(0,0,0,.32)!important;z-index:5}
    .amphipod{width:28px!important;height:19px!important;background:transparent!important;border:3px solid #dfb68e!important;border-left-color:transparent!important;border-radius:52% 62% 56% 48%!important;box-shadow:none!important;transform-origin:center;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))!important}
    .amphipod:before{content:"";position:absolute;left:4px;top:3px;width:4px;height:4px;border-radius:50%;background:#241910;box-shadow:6px 1px 0 -1px #f3d0aa,11px 2px 0 -1px #f3d0aa,16px 4px 0 -1px #f3d0aa}
    .amphipod:after{content:"";position:absolute;left:8px;top:13px;width:2px;height:8px;background:#dfb68e;transform:rotate(24deg);box-shadow:6px -2px 0 #dfb68e,12px -3px 0 #dfb68e,17px -5px 0 #dfb68e}
    .hagfish{width:125px!important;height:18px!important;border-radius:60% 40% 55% 45%!important;background:linear-gradient(180deg,#b48ca7,#795c79)!important;box-shadow:inset 0 -4px 0 rgba(38,20,41,.25)}
    .hagfish:before{content:"";position:absolute;right:7px;top:6px;width:4px;height:4px;border-radius:50%;background:#111}
    .hagfish:after{content:"";position:absolute;right:1px;top:8px;width:9px;height:2px;background:#ddbacd;border-radius:50%}
    .grenadier{width:98px!important;height:34px!important;background:linear-gradient(90deg,#89a5b0 0 38%,#526b79 62%,#2f4653 100%)!important;clip-path:polygon(0 49%,12% 13%,42% 17%,62% 31%,100% 47%,63% 63%,43% 82%,13% 84%)!important}
    .grenadier:after{content:"";position:absolute;left:17px;top:10px;width:5px;height:5px;border-radius:50%;background:#06131b;box-shadow:0 0 0 2px rgba(220,245,250,.32)}
    .shark:after{content:"";position:absolute;right:28px;top:15px;width:5px;height:5px;border-radius:50%;background:#07151c;box-shadow:0 0 0 2px rgba(230,251,255,.25)}
    .lantern-creature{position:absolute;z-index:11;width:58px;height:20px;border-radius:56% 42% 48% 55%;background:#244b61;box-shadow:inset -12px -4px 0 rgba(5,24,38,.22);pointer-events:auto;animation:lanternSwim 5s ease-in-out infinite;filter:drop-shadow(0 4px 7px rgba(0,0,0,.28))}
    .lantern-creature:before{content:"";position:absolute;left:-12px;top:4px;border-right:13px solid #244b61;border-top:6px solid transparent;border-bottom:6px solid transparent}
    .lantern-creature:after{content:"";position:absolute;left:14px;bottom:2px;width:4px;height:4px;border-radius:50%;background:#b8fff3;box-shadow:10px 1px 0 #b8fff3,20px 1px 0 #b8fff3,30px 0 0 #b8fff3,0 0 9px rgba(154,255,236,.9)}
    @keyframes lanternSwim{50%{transform:translate(22px,-8px) rotate(-2deg)}}
    .discovery-pop{position:absolute;z-index:64;left:50%;top:18%;width:min(88vw,390px);transform:translate(-50%,-12px) scale(.96);opacity:0;pointer-events:none;background:rgba(2,15,23,.91);border:1px solid rgba(202,244,255,.25);border-radius:24px;padding:15px;display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center;box-shadow:0 20px 60px rgba(0,0,0,.42);backdrop-filter:blur(16px);transition:.25s}
    .discovery-pop.show{opacity:1;transform:translate(-50%,0) scale(1)}
    .discovery-pop .art{height:78px;border-radius:18px;background:radial-gradient(circle,rgba(130,222,231,.14),transparent 68%);display:grid;place-items:center}
    .discovery-pop svg{width:92px;height:66px;overflow:visible}
    .discovery-pop small{display:block;font-size:10px;letter-spacing:.15em;color:#9cc6d2;margin-bottom:4px}
    .discovery-pop strong{display:block;font-size:18px;line-height:1.25}
    .discovery-pop p{font-size:12px;line-height:1.55;color:#b8d0d7;margin:5px 0 0}
    .guide-item{min-height:168px!important;padding:12px!important}
    .guide-visual{height:78px;border-radius:14px;background:radial-gradient(circle,rgba(118,211,225,.12),transparent 70%);display:grid;place-items:center;margin-bottom:8px}
    .guide-visual svg{width:105px;height:68px;overflow:visible}
    .guide-name{font-size:14px!important;margin-top:5px!important}
    .guide-role{font-size:11px!important;line-height:1.55!important}
    .bloom-patch{width:76px!important;height:46px!important}
    .bloom-patch.done:before{display:none!important}
    .poly-worm{position:absolute;bottom:8px;width:7px;height:28px;border-radius:45% 45% 55% 55%;background:repeating-linear-gradient(180deg,#ef9f6f 0 4px,#c66d59 4px 7px);transform-origin:bottom;animation:polyWiggle 1.5s ease-in-out infinite alternate;box-shadow:-3px 3px 0 -2px #f6c08e,3px 5px 0 -2px #f6c08e}
    .poly-worm:after{content:"";position:absolute;left:-4px;top:4px;width:15px;height:2px;background:#f0c39b;box-shadow:0 6px 0 #f0c39b,0 12px 0 #f0c39b,0 18px 0 #f0c39b;opacity:.75}
    .poly-worm:nth-child(1){left:8px;transform:rotate(-14deg)}.poly-worm:nth-child(2){left:23px;height:34px}.poly-worm:nth-child(3){left:39px;height:26px;transform:rotate(12deg)}.poly-worm:nth-child(4){left:53px;height:31px;transform:rotate(20deg)}
    @keyframes polyWiggle{to{rotate:8deg;translate:0 -2px}}
    .osedax .worm path{stroke-width:5!important}.osedax .worm circle{r:5px}
    @media(max-width:420px){.discovery-pop{grid-template-columns:82px 1fr;top:15%;padding:13px}.discovery-pop .art{height:70px}.discovery-pop svg{width:80px}.discovery-pop strong{font-size:17px}.animal .tag{font-size:11px!important}}
  `;

  const found = new Set();
  let phase = 0, started = false, depth = 20, pointerY = null, pointerX = null, dragging = false;
  let scentScore = 0, holdTimer = null, captionTimer = null, bloomHits = 0, boneHoldTimer = null, energyRAF = null, discoveryTimer = null;
  let energyPoints = [];

  function init(){
    const style = document.createElement('style'); style.textContent = POLISH_CSS; document.head.appendChild(style);
    makeSnow(); makeFish(); makeDots(); renderGuide(); resizeCanvas();
    addEventListener('resize', resizeCanvas);
    $('#startButton').addEventListener('click', startExperience);
    $('#guideButton').addEventListener('click', openGuide); $('#closeGuide').addEventListener('click', closeGuide); $('#endingGuide').addEventListener('click', openGuide);
    $('#restartButton').addEventListener('click', () => location.reload());
    timeButton.addEventListener('pointerdown', beginTimeHold); timeButton.addEventListener('pointerup', cancelTimeHold); timeButton.addEventListener('pointercancel', cancelTimeHold);
    game.addEventListener('pointerdown', onDown); game.addEventListener('pointermove', onMove); game.addEventListener('pointerup', onUp); game.addEventListener('pointercancel', onUp);
  }

  function creatureSVG(id){
    const common='viewBox="0 0 120 80" aria-hidden="true"';
    if(id==='shark') return `<svg ${common}><path d="M6 41 22 28 49 25 66 10 72 28 99 34 115 21 110 41 115 61 98 49 69 52 49 65 22 55Z" fill="#658796"/><circle cx="91" cy="37" r="3" fill="#07151c"/></svg>`;
    if(id==='hagfish') return `<svg ${common}><path d="M10 49 C28 19 55 68 86 36 C99 23 111 30 112 41 C92 28 83 64 55 56 C31 49 24 29 10 49Z" fill="none" stroke="#b58ba5" stroke-width="12" stroke-linecap="round"/><circle cx="107" cy="39" r="2.5" fill="#0d1015"/></svg>`;
    if(id==='grenadier') return `<svg ${common}><path d="M9 41 C14 19 45 16 61 29 L112 41 61 52 C42 68 15 61 9 41Z" fill="#7896a4"/><path d="M55 29 112 41 56 44Z" fill="#425b69"/><circle cx="31" cy="34" r="4" fill="#081820"/></svg>`;
    if(id==='amphipod') return `<svg ${common}><g fill="none" stroke="#e5ba90" stroke-width="7" stroke-linecap="round"><path d="M20 25 C13 50 33 65 59 58 C81 52 86 32 71 20"/><path d="M30 31 20 57M42 39 34 67M56 41 53 69M69 37 73 62" stroke-width="3"/></g><circle cx="22" cy="27" r="3" fill="#21170f"/><path d="M24 21 10 12M27 23 14 8" stroke="#e5ba90" stroke-width="2"/></svg>`;
    if(id==='polychaete') return `<svg ${common}><path d="M58 67 C40 57 70 46 51 33 C38 24 53 14 64 10" fill="none" stroke="#df835f" stroke-width="12" stroke-linecap="round"/><g stroke="#f1c195" stroke-width="2"><path d="M48 57 30 62M55 51 76 57M49 42 29 43M57 36 78 39M53 27 35 23M60 21 79 17"/></g></svg>`;
    if(id==='osedax') return `<svg ${common}><path d="M15 64 Q60 47 108 62" fill="none" stroke="#d8d1ba" stroke-width="13" stroke-linecap="round"/><g stroke="#d97689" stroke-width="4" fill="#f4a6b0"><path d="M40 59 Q35 34 42 18"/><circle cx="42" cy="17" r="6"/><path d="M62 56 Q65 31 59 12"/><circle cx="59" cy="12" r="6"/><path d="M82 58 Q87 39 91 24"/><circle cx="91" cy="23" r="6"/></g></svg>`;
    if(id==='microbe') return `<svg ${common}><g stroke="#79e1cb" stroke-width="2" opacity=".55"><path d="M18 48 48 25 75 44 101 21M48 25 55 62 75 44 96 61"/></g><g fill="#a0f4dd"><circle cx="18" cy="48" r="6"/><circle cx="48" cy="25" r="8"/><circle cx="75" cy="44" r="5"/><circle cx="101" cy="21" r="6"/><circle cx="55" cy="62" r="5"/><circle cx="96" cy="61" r="7"/></g></svg>`;
    return `<svg ${common}><path d="M12 41 Q27 21 61 25 Q90 27 107 41 Q88 55 57 56 Q27 55 12 41Z" fill="#315a6f"/><path d="M13 41 2 30 4 51Z" fill="#315a6f"/><circle cx="88" cy="35" r="3" fill="#07141b"/><g fill="#b9fff1"><circle cx="39" cy="51" r="3"/><circle cx="51" cy="53" r="3"/><circle cx="63" cy="53" r="3"/><circle cx="75" cy="51" r="3"/></g></svg>`;
  }

  function makeSnow(){for(let i=0;i<58;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.top=(-Math.random()*100)+'%';p.style.opacity=.18+Math.random()*.65;p.style.animationDuration=9+Math.random()*17+'s';p.style.animationDelay=-Math.random()*20+'s';$('#snow').appendChild(p)}}
  function makeFish(){for(let i=0;i<7;i++){const f=document.createElement('i');f.className='fish-sil';f.style.top=16+Math.random()*58+'%';f.style.left=-25-Math.random()*60+'%';f.style.animationDelay=-Math.random()*12+'s';f.style.animationDuration=12+Math.random()*12+'s';$('#distantLife').appendChild(f)}}
  function spawnLanterns(){
    if($('#descentLife')) return;
    const layer=document.createElement('div'); layer.id='descentLife'; layer.style.cssText='position:absolute;inset:0;z-index:11;pointer-events:none';
    [[12,28],[70,38],[27,62],[76,68]].forEach(([x,y],i)=>{const f=document.createElement('div');f.className='lantern-creature';f.style.left=x+'%';f.style.top=y+'%';f.style.animationDelay=(-i*.8)+'s';f.style.pointerEvents='auto';f.addEventListener('click',e=>{e.stopPropagation();discover('lantern',true)});layer.appendChild(f)});
    $('#ocean').appendChild(layer);
  }
  function makeDots(){phases.forEach((_,i)=>{const d=document.createElement('i');if(i===0)d.className='on';phaseDots.appendChild(d)})}
  function updateDots(){[...phaseDots.children].forEach((d,i)=>d.classList.toggle('on',i<=phase))}
  function caption(text,ms=2300){clearTimeout(captionTimer);storyCaption.textContent=text;storyCaption.classList.add('show');captionTimer=setTimeout(()=>storyCaption.classList.remove('show'),ms)}
  function dock(icon,title,sub,progress=0){actionIcon.textContent=icon;actionTitle.textContent=title;actionSub.textContent=sub;actionProgress.style.width=progress+'%';actionDock.classList.remove('hidden')}
  function hideDock(){actionDock.classList.add('hidden')}
  function haptic(ms=20){navigator.vibrate?.(ms)}

  function showDiscovery(id){
    const c=creatures.find(x=>x[0]===id); if(!c)return;
    let pop=$('#discoveryPop'); if(!pop){pop=document.createElement('div');pop.id='discoveryPop';pop.className='discovery-pop';game.appendChild(pop)}
    pop.innerHTML=`<div class="art">${creatureSVG(id)}</div><div><small>NEW SPECIES</small><strong>${c[1]}</strong><p>${c[2]}</p></div>`;
    clearTimeout(discoveryTimer); requestAnimationFrame(()=>pop.classList.add('show')); discoveryTimer=setTimeout(()=>pop.classList.remove('show'),2600);
  }

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
    if(phase===1){game.style.setProperty('--flesh','1');game.style.setProperty('--bone','0');caption('光の届かない場所へ。');dock('↑','上へスワイプ','海を送って、クジラを深海 2,400m へ',0);spawnLanterns()}
    if(phase===2){$('#descentLife')?.remove();impact();caption('海底に着いた。ここには、ほとんど何もいない。');dock('〜','海中をなぞる','匂いを遠くまで広げる',0)}
    if(phase===3){game.style.setProperty('--flesh','.72');game.style.setProperty('--bone','.18');addDecay(3);caption('匂いをたどって、食べる者たちが来た。');spawnScavengers();timeButton.classList.remove('hidden');dock('◌','生き物をタップ','形の違う生き物を見つける',100)}
    if(phase===4){game.style.setProperty('--flesh','.42');game.style.setProperty('--bone','.52');addDecay(6);caption('クジラの周りの海底まで、栄養で変わっていく。');makeBloomPatches();dock('•','光る海底をタップ','3か所の変化を見つける',0)}
    if(phase===5){game.style.setProperty('--flesh','.12');game.style.setProperty('--bone','1');addDecay(9);caption('肉がなくなっても、終わりではない。');dock('＋','骨をタップ','骨に生えるものを近くで見る',0)}
    if(phase===6){game.style.setProperty('--flesh','.04');game.style.setProperty('--bone','1');caption('骨の中にも、まだエネルギーが残っている。');startEnergy();dock('◎','骨を長押し','見えない流れを浮かび上がらせる',0)}
    if(phase===7) finish();
  }

  function onDown(e){
    if(fieldGuide.classList.contains('open')||!started)return;
    pointerY=e.clientY; pointerX=e.clientX; dragging=true;
    if(phase===2){addScent(e.clientX,e.clientY,5)}
    if(phase===5 && e.target.closest?.('#whale')){showOsedax();setTimeout(()=>setPhase(6),1500)}
    if(phase===6 && e.target.closest?.('#whale')) beginBoneHold(e);
  }
  function onMove(e){
    if(!dragging)return;
    if(phase===1){const dy=pointerY-e.clientY;if(dy>6){depth=Math.min(2400,depth+dy*5.8);pointerY=e.clientY;const p=Math.min(100,(depth-20)/2380*100);game.style.setProperty('--depth',(p/100).toFixed(2));depthLabel.textContent=Math.round(depth).toLocaleString()+' m';whale.style.top=44+Math.min(20,p*.2)+'%';dock('↑','上へスワイプ',depth<1000?'光が急に弱くなる':'海底が近い',p);if(depth>=2380){dragging=false;haptic(35);setTimeout(()=>setPhase(2),250)}}}
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
    scavengers.innerHTML='';animal('shark','shark',2,50,'深海性のサメ');animal('grenadier','grenadier',70,48,'ソコダラの仲間');animal('hagfish','hagfish',45,72,'ヌタウナギ');
    for(let i=0;i<12;i++){const a=animal('amphipod','amphipod',26+Math.random()*50,60+Math.random()*20,'端脚類');a.style.animationDelay=Math.random()*.8+'s'}
  }
  function beginTimeHold(e){if(phase!==3)return;e.stopPropagation();timeButton.setPointerCapture?.(e.pointerId);timeButton.classList.add('holding');scavengers.classList.add('fast');caption('食べる。運ぶ。さらに集まる。',1500);haptic(12);holdTimer=setTimeout(()=>{holdTimer=null;timeButton.classList.remove('holding');scavengers.classList.remove('fast');game.style.setProperty('--flesh','.42');game.style.setProperty('--bone','.52');addDecay(6);haptic(30);setTimeout(()=>setPhase(4),500)},1150)}
  function cancelTimeHold(e){e?.stopPropagation();timeButton.classList.remove('holding');scavengers.classList.remove('fast');if(holdTimer){clearTimeout(holdTimer);holdTimer=null}}

  function addDecay(count){
    const g=$('#decayMarks'); while(g.childElementCount<count){const p=document.createElementNS('http://www.w3.org/2000/svg','path');const x=280+Math.random()*450,y=120+Math.random()*120,r=14+Math.random()*30;p.setAttribute('d',`M${x-r} ${y} q${r*.5} -${r} ${r} 0 q${r*.7} ${r*.7} ${r*1.4} 0 q-${r*.3} ${r*1.2} -${r*1.2} ${r*.7} q-${r} ${r*.3} -${r*1.2} -${r*.7}Z`);g.appendChild(p)}
  }

  function makeBloomPatches(){
    bloomLayer.innerHTML='';bloomHits=0;const spots=[[23,31],[48,49],[70,30]];
    spots.forEach(([x,y])=>{const p=document.createElement('button');p.className='bloom-patch';p.style.left=x+'%';p.style.top=y+'%';p.setAttribute('aria-label','栄養が集まった海底');p.addEventListener('click',e=>{e.stopPropagation();if(p.classList.contains('done'))return;p.classList.add('done');p.innerHTML='<i class="poly-worm"></i><i class="poly-worm"></i><i class="poly-worm"></i><i class="poly-worm"></i>';bloomHits++;discover('polychaete',bloomHits===1);haptic(13);dock('•','多毛類が増えた',`${bloomHits}/3 か所`,bloomHits/3*100);if(bloomHits===3){caption('何もなかった泥に、毛のあるゴカイの仲間が密集した。',2100);setTimeout(()=>setPhase(5),1600)}});bloomLayer.appendChild(p)})
  }

  function showOsedax(){
    if(osedax.childElementCount===0){for(let i=0;i<24;i++){const x=220+Math.random()*460,y=128+Math.random()*95;const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','worm');g.innerHTML=`<path d="M${x} ${y} q ${-7+Math.random()*14} -${16+Math.random()*22} ${-4+Math.random()*8} -${34+Math.random()*30}" stroke="#da798b" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${x-3+Math.random()*6}" cy="${y-37-Math.random()*24}" r="5" fill="#f4a6b0"/>`;osedax.appendChild(g)}}
    osedax.style.opacity=1;discover('osedax',true);whale.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(1.24)'},{transform:'translate(-50%,-50%) scale(1.15)'}],{duration:800,fill:'forwards'});haptic(20)
  }

  function beginBoneHold(e){e.stopPropagation();whale.classList.add('energy-view');energyCanvas.style.filter='brightness(1.8)';haptic(10);boneHoldTimer=setTimeout(()=>{boneHoldTimer=null;discover('microbe',true);dock('◎','エネルギーがつながった','骨 → 微生物 → 新しい食物網',100);caption('太陽のない深海で、新しい食物網ができた。',2500);haptic(35);setTimeout(()=>setPhase(7),2500)},1350)}
  function cancelBoneHold(){if(phase!==6)return;whale.classList.remove('energy-view');energyCanvas.style.filter='';if(boneHoldTimer){clearTimeout(boneHoldTimer);boneHoldTimer=null}}

  function resizeCanvas(){const dpr=Math.min(2,devicePixelRatio||1);energyCanvas.width=Math.floor(innerWidth*dpr);energyCanvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);energyPoints=Array.from({length:82},()=>({x:innerWidth*(.2+Math.random()*.62),y:innerHeight*(.5+Math.random()*.34),vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.18,r:.7+Math.random()*1.9,p:Math.random()*Math.PI*2}))}
  function startEnergy(){if(energyRAF)return;const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);for(let i=0;i<energyPoints.length;i++){const p=energyPoints[i];p.x+=p.vx;p.y+=p.vy;p.p+=.025;if(p.x<innerWidth*.15||p.x>innerWidth*.86)p.vx*=-1;if(p.y<innerHeight*.47||p.y>innerHeight*.9)p.vy*=-1;ctx.beginPath();ctx.fillStyle=`rgba(153,242,216,${.22+.42*(.5+.5*Math.sin(p.p))})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();if(i%6===0){const q=energyPoints[(i+13)%energyPoints.length];ctx.beginPath();ctx.strokeStyle='rgba(125,235,215,.08)';ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}energyRAF=requestAnimationFrame(draw)};energyRAF=requestAnimationFrame(draw)}

  function discover(id,announce){if(found.has(id)){if(announce)showDiscovery(id);return}found.add(id);foundCount.textContent=found.size;renderGuide();if(announce)showDiscovery(id)}
  function renderGuide(){guideGrid.innerHTML=creatures.map(c=>{const unlocked=found.has(c[0]);return `<article class="guide-item ${unlocked?'':'locked'}"><div class="guide-visual">${unlocked?creatureSVG(c[0]):'<span style="font-size:34px;opacity:.4">?</span>'}</div><div class="guide-name">${unlocked?c[1]:'未発見'}</div><div class="guide-role">${unlocked?c[2]:'この世界のどこかにいる'}</div></article>`}).join('')}
  function openGuide(){fieldGuide.classList.add('open');fieldGuide.setAttribute('aria-hidden','false')}
  function closeGuide(){fieldGuide.classList.remove('open');fieldGuide.setAttribute('aria-hidden','true')}
  function finish(){hideDock();timeButton.classList.add('hidden');game.style.setProperty('--flesh','.02');game.style.setProperty('--bone','1');osedax.style.opacity=1;startEnergy();setTimeout(()=>ending.classList.remove('hidden'),900)}

  init();
})();
