(() => {
  const $ = (s) => document.querySelector(s);
  const game = $('#game');
  const ocean = $('#ocean');
  const whale = $('#whale');
  const livingWhale = $('#livingWhale');
  const osedax = $('#osedax');
  const scavengers = $('#scavengers');
  const scent = $('#scent');
  const approaching = $('#approaching');
  const bloomLayer = $('#bloomLayer');
  const energyCanvas = $('#energyCanvas');
  const ctx = energyCanvas.getContext('2d');
  const phaseLabel = $('#phaseLabel');
  const timeLabel = $('#timeLabel');
  const depthLabel = $('#depthLabel');
  const phaseDots = $('#phaseDots');
  const intro = $('#intro');
  const storyCaption = $('#storyCaption');
  const actionDock = $('#actionDock');
  const actionIcon = $('#actionIcon');
  const actionTitle = $('#actionTitle');
  const actionSub = $('#actionSub');
  const actionProgress = $('#actionProgress i');
  const timeButton = $('#timeButton');
  const fieldGuide = $('#fieldGuide');
  const guideGrid = $('#guideGrid');
  const foundCount = $('#foundCount');
  const ending = $('#ending');

  const phases = [
    ['surface','生きている海','0日',20],
    ['descent','沈降','数時間',20],
    ['floor','着底','1日',2400],
    ['scavenge','最初の食事','3週間',2400],
    ['enrich','海底が生き始める','8か月',2400],
    ['bone','骨を食べるもの','3年',2400],
    ['chemo','見えない生態系','12年',2400],
    ['ending','小さな世界','数十年',2400]
  ];

  const creatures = [
    ['lantern','ハダカイワシの仲間','腹側の発光器が光る中深層魚。'],
    ['shark','深海性のサメ','大きな軟組織を噛み取る。'],
    ['hagfish','ヌタウナギ','細長い体で死骸のすき間に入る。'],
    ['grenadier','ソコダラの仲間','大きな頭と細い尾をもつ深海魚。'],
    ['amphipod','端脚類','エビに似た節足動物。群れで死骸を覆う。'],
    ['polychaete','多毛類','毛のあるゴカイの仲間。栄養の多い泥で増える。'],
    ['osedax','Osedaxの仲間','クジラの骨に根を張る、赤い房状の生物。'],
    ['microbe','化学合成微生物','化学反応のエネルギーで食物網を支える。']
  ];

  const CSS = `
    .time-button{touch-action:manipulation!important;cursor:pointer!important}
    .time-button .ring{display:none!important}
    .time-button b{font-size:13px!important}
    .time-button small{font-size:9px!important}
    .phase-enrich .scavengers{opacity:.22!important;pointer-events:none!important;transition:opacity .4s}
    .phase-enrich .animal,.phase-bone .animal,.phase-chemo .animal{pointer-events:none!important}
    .animal{touch-action:manipulation;min-width:44px;min-height:36px;display:grid;place-items:center}
    .animal .tag{display:none!important}
    .amphipod{width:38px!important;height:27px!important;background:transparent!important;border:4px solid #dfb68e!important;border-left-color:transparent!important;border-radius:54% 64% 58% 46%!important;box-shadow:none!important;filter:drop-shadow(0 4px 4px rgba(0,0,0,.45))!important}
    .amphipod:before{content:"";position:absolute;left:7px;top:5px;width:5px;height:5px;border-radius:50%;background:#20160f;box-shadow:8px 1px 0 -1px #f4d2ad,15px 3px 0 -1px #f4d2ad,22px 5px 0 -1px #f4d2ad}
    .amphipod:after{content:"";position:absolute;left:10px;top:19px;width:3px;height:9px;background:#dfb68e;transform:rotate(25deg);box-shadow:8px -2px 0 #dfb68e,16px -4px 0 #dfb68e,23px -6px 0 #dfb68e}
    .hagfish{width:128px!important;height:18px!important;border-radius:60% 40% 55% 45%!important;background:linear-gradient(180deg,#b58da7,#775b78)!important}
    .grenadier{width:100px!important;height:35px!important;background:linear-gradient(90deg,#8aa7b2 0 40%,#536c79 62%,#2d4552 100%)!important;clip-path:polygon(0 49%,12% 13%,42% 17%,63% 32%,100% 48%,64% 62%,43% 82%,13% 84%)!important}
    .shark{width:155px!important;height:49px!important}
    .scavengers{transition:opacity .4s}
    .bloom-layer{position:absolute!important;inset:0!important;z-index:33!important;pointer-events:none!important}
    .bloom-patch{position:absolute!important;width:96px!important;height:96px!important;border-radius:50%!important;border:2px solid rgba(194,255,226,.78)!important;background:radial-gradient(circle,rgba(157,242,197,.34) 0 16%,rgba(111,211,166,.18) 38%,rgba(67,152,122,.04) 68%,transparent 72%)!important;box-shadow:0 0 0 10px rgba(138,236,190,.06),0 0 34px rgba(122,233,182,.35)!important;pointer-events:auto!important;touch-action:manipulation!important;appearance:none!important;padding:0!important;animation:bloomPulse 1.25s ease-in-out infinite!important}
    .bloom-patch:after{content:"タップ";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:900;letter-spacing:.06em;color:#e9fff6;text-shadow:0 2px 8px #001}
    .bloom-patch.done{animation:none!important;border-color:rgba(240,255,246,.35)!important;background:radial-gradient(circle,rgba(220,154,112,.2),rgba(97,172,130,.12) 50%,transparent 72%)!important;box-shadow:0 0 22px rgba(164,230,180,.2)!important}
    .bloom-patch.done:after{content:""!important}
    @keyframes bloomPulse{50%{transform:scale(1.1);box-shadow:0 0 0 18px rgba(138,236,190,.02),0 0 42px rgba(122,233,182,.48)}}
    .poly-worm{position:absolute;bottom:22px;width:8px;height:34px;border-radius:45%;background:repeating-linear-gradient(180deg,#f0a16f 0 5px,#c76e59 5px 8px);transform-origin:bottom;animation:polyWiggle 1.25s ease-in-out infinite alternate}
    .poly-worm:after{content:"";position:absolute;left:-5px;top:5px;width:18px;height:2px;background:#f3c59e;box-shadow:0 7px 0 #f3c59e,0 14px 0 #f3c59e,0 21px 0 #f3c59e;opacity:.82}
    .poly-worm:nth-child(1){left:20px;transform:rotate(-13deg)}.poly-worm:nth-child(2){left:40px;height:42px}.poly-worm:nth-child(3){left:60px;height:31px;transform:rotate(13deg)}.poly-worm:nth-child(4){left:76px;height:37px;transform:rotate(20deg)}
    @keyframes polyWiggle{to{rotate:8deg;translate:0 -3px}}
    .discovery-pop{position:absolute;z-index:70;left:50%;top:16%;width:min(88vw,390px);transform:translate(-50%,-10px) scale(.96);opacity:0;pointer-events:none;background:rgba(2,15,23,.93);border:1px solid rgba(202,244,255,.28);border-radius:24px;padding:15px;display:grid;grid-template-columns:92px 1fr;gap:14px;align-items:center;box-shadow:0 20px 60px rgba(0,0,0,.48);backdrop-filter:blur(16px);transition:.22s}
    .discovery-pop.show{opacity:1;transform:translate(-50%,0) scale(1)}
    .discovery-pop .art{height:74px;border-radius:17px;background:radial-gradient(circle,rgba(130,222,231,.14),transparent 68%);display:grid;place-items:center}
    .discovery-pop svg{width:88px;height:64px;overflow:visible}
    .discovery-pop small{display:block;font-size:10px;letter-spacing:.15em;color:#9cc6d2;margin-bottom:3px}
    .discovery-pop strong{display:block;font-size:19px;line-height:1.2}
    .discovery-pop p{font-size:12px;line-height:1.5;color:#b8d0d7;margin:5px 0 0}
    .guide-item{min-height:160px!important}
    .guide-visual{height:76px;border-radius:14px;background:radial-gradient(circle,rgba(118,211,225,.12),transparent 70%);display:grid;place-items:center;margin-bottom:8px}
    .guide-visual svg{width:104px;height:66px;overflow:visible}
    .osedax .worm path{stroke-width:6!important}
    .osedax .worm circle{r:6px}
    @media(max-width:430px){.bloom-patch{width:88px!important;height:88px!important}.discovery-pop{grid-template-columns:80px 1fr;top:14%;padding:13px}.discovery-pop strong{font-size:17px}}
  `;

  const found = new Set();
  let phase = 0;
  let started = false;
  let depth = 20;
  let pointerY = null;
  let pointerX = null;
  let dragging = false;
  let scentScore = 0;
  let captionTimer = null;
  let discoveryTimer = null;
  let bloomHits = 0;
  let energyRAF = null;
  let energyPoints = [];
  let chemoTriggered = false;

  function init(){
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    ocean.appendChild(bloomLayer);
    makeSnow();
    makeFish();
    makeDots();
    renderGuide();
    resizeCanvas();
    addEventListener('resize', resizeCanvas);
    $('#startButton').addEventListener('click', startExperience);
    $('#guideButton').addEventListener('click', openGuide);
    $('#closeGuide').addEventListener('click', closeGuide);
    $('#endingGuide').addEventListener('click', openGuide);
    $('#restartButton').addEventListener('click', () => location.reload());
    timeButton.innerHTML = '<b>タップ</b><small>時間を進める</small>';
    timeButton.setAttribute('aria-label','タップして時間を進める');
    timeButton.addEventListener('click', advanceScavenging);
    game.addEventListener('pointerdown', onDown);
    game.addEventListener('pointermove', onMove);
    game.addEventListener('pointerup', onUp);
    game.addEventListener('pointercancel', onUp);
  }

  function creatureSVG(id){
    const common='viewBox="0 0 120 80" aria-hidden="true"';
    if(id==='shark') return `<svg ${common}><path d="M6 41 22 28 49 25 66 10 72 28 99 34 115 21 110 41 115 61 98 49 69 52 49 65 22 55Z" fill="#658796"/><circle cx="91" cy="37" r="3" fill="#07151c"/></svg>`;
    if(id==='hagfish') return `<svg ${common}><path d="M10 49 C28 19 55 68 86 36 C99 23 111 30 112 41 C92 28 83 64 55 56 C31 49 24 29 10 49Z" fill="none" stroke="#b58ba5" stroke-width="12" stroke-linecap="round"/><circle cx="107" cy="39" r="2.5" fill="#0d1015"/></svg>`;
    if(id==='grenadier') return `<svg ${common}><path d="M9 41 C14 19 45 16 61 29 L112 41 61 52 C42 68 15 61 9 41Z" fill="#7896a4"/><path d="M55 29 112 41 56 44Z" fill="#425b69"/><circle cx="31" cy="34" r="4" fill="#081820"/></svg>`;
    if(id==='amphipod') return `<svg ${common}><g fill="none" stroke="#e5ba90" stroke-width="7" stroke-linecap="round"><path d="M20 25 C13 50 33 65 59 58 C81 52 86 32 71 20"/><path d="M30 31 20 57M42 39 34 67M56 41 53 69M69 37 73 62" stroke-width="3"/></g><circle cx="22" cy="27" r="3" fill="#21170f"/><path d="M24 21 10 12M27 23 14 8" stroke="#e5ba90" stroke-width="2"/></svg>`;
    if(id==='polychaete') return `<svg ${common}><path d="M58 67 C40 57 70 46 51 33 C38 24 53 14 64 10" fill="none" stroke="#df835f" stroke-width="12" stroke-linecap="round"/><g stroke="#f1c195" stroke-width="2"><path d="M48 57 30 62M55 51 76 57M49 42 29 43M57 36 78 39M53 27 35 23M60 21 79 17"/></g></svg>`;
    if(id==='osedax') return `<svg ${common}><path d="M15 64 Q60 47 108 62" fill="none" stroke="#d8d1ba" stroke-width="13" stroke-linecap="round"/><g stroke="#d97689" stroke-width="4" fill="#f4a6b0"><path d="M40 59 Q35 34 42 18"/><circle cx="42" cy="17" r="6"/><path d="M62 56 Q65 31 59 12"/><circle cx="59" cy="12" r="6"/><path d="M82 58 Q87 39 91 24"/><circle cx="91" cy="23" r="6"/></g></svg>`;
    if(id==='microbe') return `<svg ${common}><g stroke="#79e1cb" stroke-width="2" opacity=".6"><path d="M18 48 48 25 75 44 101 21M48 25 55 62M75 44 94 65"/></g><g fill="#a7ffe8"><circle cx="18" cy="48" r="5"/><circle cx="48" cy="25" r="6"/><circle cx="75" cy="44" r="5"/><circle cx="101" cy="21" r="4"/><circle cx="55" cy="62" r="4"/><circle cx="94" cy="65" r="4"/></g></svg>`;
    if(id==='lantern') return `<svg ${common}><path d="M12 40 C24 22 72 21 101 39 C74 59 27 58 12 40Z" fill="#31566b"/><path d="M13 40 2 29 5 48Z" fill="#31566b"/><circle cx="85" cy="34" r="3" fill="#07151c"/><g fill="#baffee"><circle cx="31" cy="51" r="2.5"/><circle cx="43" cy="53" r="2.5"/><circle cx="56" cy="53" r="2.5"/><circle cx="69" cy="51" r="2.5"/></g></svg>`;
    return `<svg ${common}><circle cx="60" cy="40" r="18" fill="#8ecdd7"/></svg>`;
  }

  function makeSnow(){for(let i=0;i<58;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.top=(-Math.random()*100)+'%';p.style.opacity=.18+Math.random()*.65;p.style.animationDuration=9+Math.random()*17+'s';p.style.animationDelay=-Math.random()*20+'s';$('#snow').appendChild(p)}}
  function makeFish(){for(let i=0;i<7;i++){const f=document.createElement('i');f.className='fish-sil';f.style.top=16+Math.random()*58+'%';f.style.left=-25-Math.random()*60+'%';f.style.animationDelay=-Math.random()*12+'s';f.style.animationDuration=12+Math.random()*12+'s';$('#distantLife').appendChild(f)}}
  function makeDots(){phases.forEach((_,i)=>{const d=document.createElement('i');if(i===0)d.className='on';phaseDots.appendChild(d)})}
  function updateDots(){[...phaseDots.children].forEach((d,i)=>d.classList.toggle('on',i<=phase))}
  function caption(text,ms=2300){clearTimeout(captionTimer);storyCaption.textContent=text;storyCaption.classList.add('show');captionTimer=setTimeout(()=>storyCaption.classList.remove('show'),ms)}
  function dock(icon,title,sub,progress=0){actionIcon.textContent=icon;actionTitle.textContent=title;actionSub.textContent=sub;actionProgress.style.width=progress+'%';actionDock.classList.remove('hidden')}
  function hideDock(){actionDock.classList.add('hidden')}
  function haptic(ms=20){navigator.vibrate?.(ms)}

  function showDiscovery(id){const c=creatures.find(x=>x[0]===id);if(!c)return;let pop=$('#discoveryPop');if(!pop){pop=document.createElement('div');pop.id='discoveryPop';pop.className='discovery-pop';game.appendChild(pop)}pop.innerHTML=`<div class="art">${creatureSVG(id)}</div><div><small>発見</small><strong>${c[1]}</strong><p>${c[2]}</p></div>`;clearTimeout(discoveryTimer);requestAnimationFrame(()=>pop.classList.add('show'));discoveryTimer=setTimeout(()=>pop.classList.remove('show'),2400)}
  function discover(id,announce=true){if(!found.has(id)){found.add(id);foundCount.textContent=found.size;renderGuide()}if(announce)showDiscovery(id)}
  function renderGuide(){guideGrid.innerHTML=creatures.map(c=>{const unlocked=found.has(c[0]);return `<article class="guide-item ${unlocked?'':'locked'}"><div class="guide-visual">${unlocked?creatureSVG(c[0]):'<span style="font-size:34px;opacity:.4">?</span>'}</div><div class="guide-name">${unlocked?c[1]:'未発見'}</div><div class="guide-role">${unlocked?c[2]:'この世界のどこかにいる'}</div></article>`}).join('')}
  function openGuide(){fieldGuide.classList.add('open');fieldGuide.setAttribute('aria-hidden','false')}
  function closeGuide(){fieldGuide.classList.remove('open');fieldGuide.setAttribute('aria-hidden','true')}

  function startExperience(){if(started)return;started=true;intro.classList.add('hide');haptic(18);caption('ゆっくり泳いでいたクジラが、止まった。',2200);livingWhale.querySelectorAll('.tail,.fin').forEach(x=>x.style.animationPlayState='paused');setTimeout(()=>setPhase(1),1700)}

  function setPhase(next){
    phase=Math.max(0,Math.min(phases.length-1,next));const [key,label,time,baseDepth]=phases[phase];game.className=`game phase-${key}`;phaseLabel.textContent=label;timeLabel.textContent=time;depthLabel.textContent=(phase===1?Math.round(depth):baseDepth).toLocaleString()+' m';updateDots();hideDock();timeButton.classList.add('hidden');approaching.classList.remove('show');
    if(phase===1){game.style.setProperty('--flesh','1');game.style.setProperty('--bone','0');caption('海を上へ送ると、クジラは深く沈んでいく。');dock('↑','上へスワイプ','深海 2,400m まで沈める',0);spawnLanterns()}
    if(phase===2){$('#descentLife')?.remove();impact();caption('海底に着いた。まだ、ほとんど何もいない。');dock('〜','海中をなぞる','匂いを広げて生き物を呼ぶ',0)}
    if(phase===3){game.style.setProperty('--flesh','.72');game.style.setProperty('--bone','.18');addDecay(3);caption('匂いをたどって、食べる者たちが来た。');spawnScavengers();timeButton.classList.remove('hidden');dock('◌','生き物をタップ','違う形の生き物を見つける',100)}
    if(phase===4){game.style.setProperty('--flesh','.42');game.style.setProperty('--bone','.52');addDecay(6);caption('周りの泥まで、栄養で変わり始めた。');makeBloomPatches();dock('•','光る3地点をタップ','どこを押しても反応する',0)}
    if(phase===5){clearBloomPatches();game.style.setProperty('--flesh','.12');game.style.setProperty('--bone','1');addDecay(9);caption('肉がなくなっても、終わりではない。');dock('＋','クジラの骨をタップ','骨に生えるものを見る',0)}
    if(phase===6){game.style.setProperty('--flesh','.04');game.style.setProperty('--bone','1');caption('骨の中にも、まだエネルギーが残っている。');startEnergy();dock('◎','骨をもう一度タップ','見えないエネルギーの流れを見る',0)}
    if(phase===7)finish();
  }

  function spawnLanterns(){if($('#descentLife'))return;const layer=document.createElement('div');layer.id='descentLife';layer.style.cssText='position:absolute;inset:0;z-index:11;pointer-events:none';[[12,28],[70,38],[27,62],[76,68]].forEach(([x,y])=>{const f=document.createElement('button');f.type='button';f.style.cssText=`position:absolute;left:${x}%;top:${y}%;width:70px;height:48px;border:0;background:transparent;padding:0;pointer-events:auto;touch-action:manipulation`;f.innerHTML=creatureSVG('lantern');f.addEventListener('click',e=>{e.stopPropagation();discover('lantern',true)});layer.appendChild(f)});ocean.appendChild(layer)}

  function onDown(e){if(fieldGuide.classList.contains('open')||!started)return;pointerY=e.clientY;pointerX=e.clientX;dragging=true;if(phase===2)addScent(e.clientX,e.clientY,5)}
  function onMove(e){if(!dragging)return;if(phase===1){const dy=pointerY-e.clientY;if(dy>6){depth=Math.min(2400,depth+dy*5.8);pointerY=e.clientY;const p=Math.min(100,(depth-20)/2380*100);game.style.setProperty('--depth',(p/100).toFixed(2));depthLabel.textContent=Math.round(depth).toLocaleString()+' m';whale.style.top=44+Math.min(20,p*.2)+'%';dock('↑','上へスワイプ',depth<1000?'光が急に弱くなる':'海底が近い',p);if(depth>=2380){dragging=false;haptic(35);setTimeout(()=>setPhase(2),220)}}}if(phase===2){const dx=e.clientX-pointerX,dy=e.clientY-pointerY,dist=Math.hypot(dx,dy);if(dist>8){addScent(e.clientX,e.clientY,Math.min(8,dist/3));pointerX=e.clientX;pointerY=e.clientY}}}
  function onUp(){dragging=false;pointerY=null;pointerX=null}

  function addScent(x,y,amount){const n=document.createElement('i');n.style.left=x+'px';n.style.top=y+'px';scent.appendChild(n);setTimeout(()=>n.remove(),2000);scentScore=Math.min(100,scentScore+amount);dock('〜','海中をなぞる',scentScore<45?'匂いが広がっている':scentScore<80?'暗闇で何かが動いた':'もうすぐ届く',scentScore);if(scentScore>42)approaching.classList.add('show');if(scentScore>=100&&phase===2){haptic(28);setTimeout(()=>setPhase(3),420)}}
  function impact(){const s=$('.silt-cloud');s.animate([{opacity:.15,transform:'scale(.5)'},{opacity:1,transform:'scale(2.8)'},{opacity:.25,transform:'scale(1)'}],{duration:1500,easing:'ease-out'});haptic(38)}

  function animal(type,id,x,y){const a=document.createElement('button');a.type='button';a.className=`animal ${type}`;a.dataset.id=id;a.style.left=x+'%';a.style.top=y+'%';a.setAttribute('aria-label',creatures.find(c=>c[0]===id)?.[1]||id);a.addEventListener('click',e=>{e.stopPropagation();discover(id,true);haptic(10)});scavengers.appendChild(a);return a}
  function spawnScavengers(){scavengers.innerHTML='';animal('shark','shark',2,50);animal('grenadier','grenadier',70,48);animal('hagfish','hagfish',45,72);for(let i=0;i<7;i++){const a=animal('amphipod','amphipod',24+Math.random()*52,60+Math.random()*17);a.style.animationDelay=Math.random()*.8+'s'}}
  function advanceScavenging(e){if(phase!==3)return;e?.stopPropagation();timeButton.classList.add('hidden');scavengers.classList.add('fast');caption('食べる。運ぶ。さらに集まる。',1200);haptic(18);game.style.setProperty('--flesh','.42');game.style.setProperty('--bone','.52');addDecay(6);setTimeout(()=>{scavengers.classList.remove('fast');setPhase(4)},900)}

  function addDecay(count){const g=$('#decayMarks');while(g.childElementCount<count){const p=document.createElementNS('http://www.w3.org/2000/svg','path');const x=280+Math.random()*450,y=120+Math.random()*120,r=14+Math.random()*30;p.setAttribute('d',`M${x-r} ${y} q${r*.5} -${r} ${r} 0 q${r*.7} ${r*.7} ${r*1.4} 0 q-${r*.3} ${r*1.2} -${r*1.2} ${r*.7} q-${r} ${r*.3} -${r*1.2} -${r*.7}Z`);g.appendChild(p)}}

  function makeBloomPatches(){bloomLayer.innerHTML='';bloomHits=0;const spots=[[18,66],[52,75],[76,64]];spots.forEach(([x,y])=>{const p=document.createElement('button');p.type='button';p.className='bloom-patch';p.style.left=`calc(${x}% - 44px)`;p.style.top=`calc(${y}% - 44px)`;p.setAttribute('aria-label','光っている海底を調べる');const activate=(e)=>{e.preventDefault();e.stopPropagation();if(p.classList.contains('done'))return;p.classList.add('done');p.innerHTML='<i class="poly-worm"></i><i class="poly-worm"></i><i class="poly-worm"></i><i class="poly-worm"></i>';bloomHits++;discover('polychaete',bloomHits===1);haptic(16);dock('•','多毛類が増えた',`${bloomHits}/3 か所`,bloomHits/3*100);if(bloomHits===3){caption('何もなかった泥に、毛のあるゴカイの仲間が密集した。',1800);setTimeout(()=>setPhase(5),1300)}};p.addEventListener('pointerup',activate);bloomLayer.appendChild(p)})}
  function clearBloomPatches(){bloomLayer.innerHTML=''}

  function showOsedax(){if(osedax.childElementCount===0){for(let i=0;i<24;i++){const x=220+Math.random()*460,y=128+Math.random()*95;const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','worm');g.innerHTML=`<path d="M${x} ${y} q ${-7+Math.random()*14} -${16+Math.random()*22} ${-4+Math.random()*8} -${34+Math.random()*30}" stroke="#da798b" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="${x-3+Math.random()*6}" cy="${y-37-Math.random()*24}" r="6" fill="#f4a6b0"/>`;osedax.appendChild(g)}}osedax.style.opacity=1;discover('osedax',true);whale.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(1.24)'},{transform:'translate(-50%,-50%) scale(1.15)'}],{duration:750,fill:'forwards'});haptic(20)}

  whale.addEventListener('click',(e)=>{if(phase===5){e.stopPropagation();showOsedax();setTimeout(()=>setPhase(6),1200);return}if(phase===6&&!chemoTriggered){e.stopPropagation();chemoTriggered=true;whale.classList.add('energy-view');energyCanvas.style.filter='brightness(1.8)';discover('microbe',true);dock('◎','エネルギーがつながった','骨 → 微生物 → 新しい食物網',100);caption('太陽のない深海で、新しい食物網ができた。',2200);haptic(35);setTimeout(()=>setPhase(7),2200)}})

  function resizeCanvas(){const dpr=Math.min(2,devicePixelRatio||1);energyCanvas.width=Math.floor(innerWidth*dpr);energyCanvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);energyPoints=Array.from({length:82},()=>({x:innerWidth*(.2+Math.random()*.62),y:innerHeight*(.5+Math.random()*.34),vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.18,r:.7+Math.random()*1.9,p:Math.random()*Math.PI*2}))}
  function startEnergy(){if(energyRAF)return;const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);for(let i=0;i<energyPoints.length;i++){const p=energyPoints[i];p.x+=p.vx;p.y+=p.vy;p.p+=.025;if(p.x<innerWidth*.15||p.x>innerWidth*.86)p.vx*=-1;if(p.y<innerHeight*.47||p.y>innerHeight*.9)p.vy*=-1;ctx.beginPath();ctx.fillStyle=`rgba(153,242,216,${.22+.42*(.5+.5*Math.sin(p.p))})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();if(i%6===0){const q=energyPoints[(i+13)%energyPoints.length];ctx.beginPath();ctx.strokeStyle='rgba(125,235,215,.10)';ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}energyRAF=requestAnimationFrame(draw)};energyRAF=requestAnimationFrame(draw)}

  function finish(){clearBloomPatches();hideDock();timeButton.classList.add('hidden');game.style.setProperty('--flesh','.02');game.style.setProperty('--bone','1');osedax.style.opacity=1;startEnergy();setTimeout(()=>ending.classList.remove('hidden'),800)}

  init();
})();
