(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const ui = {
    tabs: document.getElementById('stageTabs'), stageName: document.getElementById('stageName'), stageSub: document.getElementById('stageSub'),
    water: document.getElementById('waterText'), found: document.getElementById('foundText'), total: document.getElementById('totalText'),
    intro: document.getElementById('introPanel'), introKicker: document.getElementById('introKicker'), introTitle: document.getElementById('introTitle'), introCopy: document.getElementById('introCopy'),
    complete: document.getElementById('completePanel'), completeCopy: document.getElementById('completeCopy'), nextBtn: document.getElementById('nextBtn'), nextTease: document.getElementById('nextTease'),
    discoveries: document.getElementById('discoveries'), record: document.getElementById('recordText'), toast: document.getElementById('toast'),
    pumpName: document.getElementById('pumpName'), pumpBar: document.getElementById('pumpBar'), pumpMeter: document.getElementById('pumpMeter'), boostCopy: document.getElementById('boostCopy'), boostBtn: document.getElementById('boostBtn'),
    goal: document.getElementById('goalBanner'), goalIcon: document.getElementById('goalIcon'), goalText: document.getElementById('goalText'), waterCard: document.querySelector('.water-card')
  };

  const GLYPHS = { fish:'🐟', eel:'〰', crab:'✣', turtle:'⬢', frog:'●', trash:'▰', coin:'●', bike:'◇', pot:'◒', boat:'▱', relic:'◆', mystery:'?' };

  const stages = [
    {
      id:'bath', name:'家の風呂', short:'風呂', sub:'最初の水抜き', kicker:'STAGE 01', intro:'栓を抜くだけ。水の下に何が残る？', type:'bath', drain:5.2, pump:'排水栓', pumpLevel:18,
      tease:'次は、泥の中で生き物が動く「小さな沼」',
      palette:{land:'#b8b5aa', mud:'#93836f', water:'#78c8d5', deep:'#297d91', edge:'#ded8ca'},
      items:[i('coin','10円玉','落とし物',.32,.74,72,0,'common'),i('trash','シャンプーのキャップ','落とし物',.68,.33,48,0,'common'),i('fish','金魚？','なぜここに',.48,.56,27,1,'rare'),i('mystery','排水口の奥の影','???',.54,.78,8,0,'rare')]
    },
    {
      id:'swamp', name:'小さな沼', short:'沼', sub:'泥の中が動いている', kicker:'STAGE 02', intro:'浅くなるほど、泥の住人が姿を現す。', type:'swamp', drain:3.1, pump:'家庭用ポンプ', pumpLevel:30,
      tease:'次は、魚と人工物が一緒に沈む「古い農業ため池」',
      palette:{land:'#6f7c4e', mud:'#5c5037', water:'#557e64', deep:'#274b42', edge:'#85915f'},
      items:[i('frog','トノサマガエル','在来生物',.22,.37,78,1,'common'),i('fish','フナ','在来生物',.70,.33,65,3,'common'),i('eel','ドジョウ','在来生物',.64,.61,50,2,'common'),i('crab','アメリカザリガニ','外来生物',.37,.68,39,2,'rare'),i('trash','長靴','落とし物',.48,.81,18,0,'common'),i('mystery','泥の大きな穴','発見地点',.79,.73,5,0,'rare')]
    },
    {
      id:'pond', name:'古い農業ため池', short:'池', sub:'魚と人工物が混ざる', kicker:'STAGE 03', intro:'生活の痕跡まで水面の下に沈んでいる。', type:'pond', drain:2.55, pump:'エンジンポンプ', pumpLevel:44,
      tease:'次は、流れを迂回させて調べる「山あいの川」',
      palette:{land:'#758d59', mud:'#756447', water:'#4b9389', deep:'#185b5f', edge:'#9aa86e'},
      items:[i('fish','ギンブナ','在来生物',.30,.44,80,3,'common'),i('fish','ブラックバス','外来生物',.69,.47,61,4,'rare'),i('turtle','ミシシッピアカミミガメ','外来生物',.48,.26,44,1,'rare'),i('crab','スジエビ','在来生物',.25,.72,31,2,'common'),i('bike','沈んだ自転車','人工物',.60,.73,19,0,'rare'),i('pot','古い陶器','古物',.76,.25,9,0,'rare'),i('fish','巨大なコイ','大型個体',.48,.57,12,1,'rare')]
    },
    {
      id:'river', name:'山あいの川', short:'川', sub:'流れを迂回させて調査', kicker:'STAGE 04', intro:'淵が浅くなると、岩陰から一斉に動き出す。', type:'river', drain:2.15, pump:'仮設排水設備', pumpLevel:58,
      tease:'次は、岸線そのものが変わる「巨大湖」',
      palette:{land:'#87957e', mud:'#756b58', water:'#4c9ca8', deep:'#1c6477', edge:'#a6b09b'},
      items:[i('fish','アユ','在来生物',.27,.33,83,5,'common'),i('fish','ニジマス','移入種',.56,.44,69,5,'rare'),i('eel','ウナギ','在来生物',.44,.70,40,3,'rare'),i('crab','モクズガニ','在来生物',.72,.65,29,2,'common'),i('trash','古いタイヤ','人工物',.24,.75,18,0,'common'),i('relic','石碑の一部','歴史物',.73,.28,8,0,'rare'),i('fish','巨大ナマズ','大型個体',.50,.55,11,1,'rare')]
    },
    {
      id:'lake', name:'巨大湖', short:'湖', sub:'岸線そのものが変わる', kicker:'STAGE 05', intro:'島が陸続きになる。その先に何がある？', type:'lake', drain:1.8, pump:'大型排水ポンプ群', pumpLevel:72,
      tease:'次は、干潟の向こうに港が現れる「大きな湾」',
      palette:{land:'#788d72', mud:'#726753', water:'#357d91', deep:'#123f59', edge:'#9eb09a'},
      items:[i('fish','コイの群れ','魚類',.29,.44,80,6,'common'),i('fish','ビワコオオナマズ級の大魚','大型個体',.51,.52,56,1,'rare'),i('turtle','大型のカメ','爬虫類',.70,.38,45,1,'common'),i('boat','沈んだ小舟','人工物',.26,.73,27,0,'rare'),i('relic','水没した石段','歴史物',.66,.70,16,0,'rare'),i('pot','古い壺','古物',.79,.57,9,0,'rare'),i('mystery','湖底の直線構造','???',.46,.77,3,0,'rare')]
    },
    {
      id:'bay', name:'大きな湾', short:'湾', sub:'干潟の向こうに港が現れる', kicker:'STAGE 06', intro:'海の入口。水が引くと街の裏側が見える。', type:'bay', drain:1.5, pump:'湾岸排水システム', pumpLevel:84,
      tease:'最後は、水深3,800mまで露出する「北大西洋」',
      palette:{land:'#8d8878', mud:'#716657', water:'#267b92', deep:'#0d445c', edge:'#aba595'},
      items:[i('fish','クロダイ','海水魚',.31,.39,85,4,'common'),i('crab','ワタリガニ','甲殻類',.69,.60,58,3,'common'),i('fish','エイ','大型魚',.52,.54,49,2,'rare'),i('boat','沈没した漁船','沈没船',.30,.72,25,0,'rare'),i('trash','海底ケーブル','人工物',.71,.73,14,0,'rare'),i('relic','古い錨','歴史物',.78,.31,8,0,'rare'),i('mystery','巨大な船影','???',.46,.79,2,0,'rare')]
    },
    {
      id:'sea', name:'北大西洋', short:'海', sub:'水深3,800mの世界へ', kicker:'FINAL AREA', intro:'大陸棚の先から、海底そのものが現れる。', type:'sea', drain:1.18, pump:'海洋排水システム', pumpLevel:96,
      tease:'海底のさらに下には、まだ「???」が残っている。',
      palette:{land:'#555f62', mud:'#39474c', water:'#14566e', deep:'#071f32', edge:'#6d787b'},
      items:[i('fish','深海魚','深海生物',.24,.42,70,4,'common'),i('fish','巨大なサメ','大型生物',.67,.33,58,3,'rare'),i('mystery','熱水噴出孔','海底地形',.72,.68,36,0,'rare'),i('boat','大型沈没船','沈没船',.32,.70,25,0,'rare'),i('relic','海底ケーブル網','人工物',.62,.78,15,0,'rare'),i('boat','タイタニック号','歴史的沈没船',.48,.56,5,0,'rare'),i('mystery','海溝のさらに下','???',.78,.47,1,0,'rare')]
    }
  ];

  function i(kind,name,category,x,y,reveal,speed,rarity){ return {kind,name,category,x,y,reveal,speed,rarity}; }
  function requiredFor(s){ return Math.min(s.items.length, Math.max(2, Math.ceil(s.items.length * .55))); }

  const saveKey='hitobito-drain-v2';
  let saved=loadSave();
  let stageIndex=Math.min(saved.stageIndex||0,stages.length-1);
  let unlocked=Math.max(0,Math.min(saved.unlocked||0,stages.length-1));
  let records=saved.records||{};
  let water=100,draining=false,completed=false,last=performance.now(),boost=0,found=new Set(),runtimeItems=[],toastTimer;
  let width=0,height=0,dpr=Math.min(devicePixelRatio||1,2),firstPromptDone=false,promptItemId=null,lastWaterBucket=100,pumpFlashTimer;

  function loadSave(){try{return JSON.parse(localStorage.getItem(saveKey))||{}}catch{return {}}}
  function persist(){localStorage.setItem(saveKey,JSON.stringify({stageIndex,unlocked,records}))}

  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}

  function setGoal(icon,text,alert=false){ui.goalIcon.textContent=icon;ui.goalText.textContent=text;ui.goal.classList.toggle('alert',alert)}

  function prepareStage(index){
    stageIndex=index;const s=stages[stageIndex];water=100;draining=false;completed=false;boost=0;found=new Set();firstPromptDone=false;promptItemId=null;lastWaterBucket=100;
    runtimeItems=s.items.map((item,n)=>({...item,id:`${s.id}-${n}`,ox:0,oy:0,phase:Math.random()*Math.PI*2,caught:false,noticed:false}));
    ui.stageName.textContent=s.name;ui.stageSub.textContent=s.sub;ui.introKicker.textContent=s.kicker;ui.introTitle.textContent=s.name;ui.introCopy.textContent=s.intro;
    ui.pumpName.textContent=s.pump;ui.pumpBar.style.width=`${s.pumpLevel}%`;ui.boostCopy.textContent=stageIndex<2?'タップで水位を一気に下げる':'ポンプを一時的に増速する';
    ui.intro.classList.remove('hidden');ui.complete.classList.add('hidden');ui.pumpMeter.classList.remove('active');setGoal('↓','水を抜いてみよう');
    renderTabs();updateHud();updateDiscoveries();persist();
  }

  function renderTabs(){
    ui.tabs.innerHTML='';
    stages.forEach((s,idx)=>{const b=document.createElement('button');b.type='button';b.className='stage-tab';if(idx===stageIndex)b.classList.add('active');if(idx>unlocked)b.classList.add('locked');b.textContent=`${idx+1}. ${s.short}${idx>unlocked?' 🔒':''}`;b.addEventListener('click',()=>{if(idx<=unlocked)prepareStage(idx);else showToast('前の水場を調査すると解放')});ui.tabs.appendChild(b)});
    requestAnimationFrame(()=>ui.tabs.querySelector('.active')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}));
  }

  function updateHud(){
    ui.water.textContent=Math.max(0,Math.round(water));ui.found.textContent=found.size;ui.total.textContent=`/ ${stages[stageIndex].items.length}`;
    const s=stages[stageIndex],best=Math.max(records[s.id]||0,found.size);ui.record.textContent=`BEST ${best} / ${s.items.length}`;
  }

  function updateDiscoveries(){
    const caught=runtimeItems.filter(x=>x.caught);
    if(!caught.length){ui.discoveries.className='discoveries empty';ui.discoveries.innerHTML='<p>水の下に、まだ何かいる。</p>';return}
    ui.discoveries.className='discoveries';ui.discoveries.innerHTML=caught.map(x=>`<article class="discovery ${x.rarity==='rare'?'rare':''}"><span class="glyph">${GLYPHS[x.kind]||'•'}</span><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.category)}</small></div></article>`).join('')
  }

  function escapeHtml(v){return v.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function showToast(text){ui.toast.textContent=text;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1350)}

  function startDrain(){draining=true;ui.intro.classList.add('hidden');ui.pumpMeter.classList.add('active');setGoal('↓','水位が下がっている');showToast('排水開始')}
  document.getElementById('startBtn').addEventListener('click',startDrain);

  ui.boostBtn.addEventListener('click',()=>{
    if(!draining||completed)return showToast(promptItemId?'先に光っているものをタップ':'先に水抜きを開始');
    const prev=water;boost=Math.min(boost+12,26);water=Math.max(0,water-2.4);checkReveal(prev,water);checkWaterMoment();if(water<=0)finishStage();updateHud();
    showToast('水位 -2%');ui.boostBtn.classList.add('flash');ui.waterCard.classList.add('pulse');
    clearTimeout(pumpFlashTimer);pumpFlashTimer=setTimeout(()=>{ui.boostBtn.classList.remove('flash');ui.waterCard.classList.remove('pulse')},260)
  });

  document.getElementById('resetBtn').addEventListener('click',()=>{localStorage.removeItem(saveKey);unlocked=0;records={};prepareStage(0);showToast('最初から再調査')});
  ui.nextBtn.addEventListener('click',()=>{const next=Math.min(stageIndex+1,stages.length-1);prepareStage(next===stageIndex?stageIndex:next)});

  function markRecord(){const s=stages[stageIndex];records[s.id]=Math.max(records[s.id]||0,found.size);persist()}

  function finishStage(){
    if(completed)return;const s=stages[stageIndex],need=requiredFor(s);
    if(found.size<need){draining=false;ui.pumpMeter.classList.remove('active');setGoal('＋',`あと${need-found.size}個 タップして調査`,true);showToast('水底を調査しよう');return}
    completed=true;draining=false;ui.pumpMeter.classList.remove('active');markRecord();
    if(stageIndex<stages.length-1){unlocked=Math.max(unlocked,stageIndex+1);ui.nextBtn.textContent='次の水場へ';ui.nextTease.innerHTML=`NEXT<strong>${escapeHtml(stages[stageIndex+1].name)}</strong><span>${escapeHtml(s.tease)}</span>`}
    else{ui.nextBtn.textContent='海をもう一度調査';ui.nextTease.innerHTML=`COMPLETE<strong>まだ全部は見つかっていないかも</strong><span>${escapeHtml(s.tease)}</span>`}
    const missed=s.items.length-found.size;ui.completeCopy.textContent=missed?`${found.size}件を発見。まだ${missed}件、水底に残っている。`:`全${found.size}件を発見。この水場の記録を埋めた。`;
    ui.complete.classList.remove('hidden');setGoal('✓','調査完了');renderTabs();persist()
  }

  function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  canvas.addEventListener('pointerdown',e=>{
    e.preventDefault();const p=pointerPos(e);let target=null,best=Infinity;
    for(const item of runtimeItems){if(item.caught||water>item.reveal)continue;const q=itemScreen(item),dist=Math.hypot(p.x-q.x,p.y-q.y);const radius=item.kind==='fish'?34:30;if(dist<radius&&dist<best){target=item;best=dist}}
    if(target){catchItem(target)}else{spawnTapRipple(p.x,p.y);if(promptItemId)showToast('光っているものをタップ')}
  });

  function catchItem(target){
    target.caught=true;found.add(target.id);markRecord();showToast(`${target.rarity==='rare'?'★ 大発見：':'＋ '}${target.name}`);updateHud();updateDiscoveries();
    if(target.id===promptItemId){promptItemId=null;draining=true;ui.pumpMeter.classList.add('active');setGoal('↓','さらに水を抜く');showToast('調査成功 → 排水再開')}
    else if(water<=0){finishStage()}else{const remaining=runtimeItems.filter(x=>!x.caught&&water<=x.reveal).length;setGoal(remaining?'＋':'↓',remaining?'見えているものをタップ':'さらに水を抜く',remaining>0)}
  }

  const ripples=[];
  function spawnTapRipple(x,y){ripples.push({x,y,t:0})}
  function itemScreen(item){return{x:(item.x+item.ox)*width,y:(item.y+item.oy)*height}}

  function loop(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(draining&&water>0){const s=stages[stageIndex],prev=water;water-=dt*(s.drain+boost*.13);boost=Math.max(0,boost-dt*5.1);water=Math.max(0,water);checkReveal(prev,water);checkWaterMoment();if(water<=0)finishStage();updateHud()}
    animateItems(dt,now);for(const r of ripples)r.t+=dt;while(ripples.length&&ripples[0].t>.55)ripples.shift();draw(now);requestAnimationFrame(loop)
  }

  function checkReveal(prev,current){
    const newly=runtimeItems.filter(x=>!x.caught&&!x.noticed&&prev>x.reveal&&current<=x.reveal);
    newly.forEach(x=>x.noticed=true);
    if(newly.length&&!firstPromptDone){firstPromptDone=true;promptItemId=newly[0].id;draining=false;ui.pumpMeter.classList.remove('active');setGoal('！',`${newly[0].name}をタップ`,true);showToast('何か出た！')}
    else if(newly.length&&!promptItemId){setGoal('！','新しいものが出てきた',true)}
  }

  function checkWaterMoment(){
    const bucket=water>75?100:water>50?75:water>25?50:water>8?25:0;
    if(bucket===lastWaterBucket)return;lastWaterBucket=bucket;ui.waterCard.classList.remove('pulse');void ui.waterCard.offsetWidth;ui.waterCard.classList.add('pulse');
    const messages={75:'岸が見えてきた',50:'泥と地形が露出',25:'水底の人工物が見える',0:'ほぼ水底。最後まで調査'};showToast(messages[bucket]||'水位低下')
  }

  function animateItems(dt,now){
    const activity=Math.max(.18,water/100);runtimeItems.forEach((item,n)=>{if(item.caught||water>item.reveal+18||!item.speed)return;const sp=item.speed*.00055*activity;item.ox+=Math.cos(item.phase+now*.00045+n)*sp*dt*60;item.oy+=Math.sin(item.phase*.7+now*.00038+n)*sp*.65*dt*60;item.ox=Math.max(-.05,Math.min(.05,item.ox));item.oy=Math.max(-.04,Math.min(.04,item.oy))})
  }

  function draw(now){const s=stages[stageIndex];ctx.clearRect(0,0,width,height);drawGround(s,now);drawExposedWorld(s,now);drawWater(s,now);drawScenery(s);drawItems(s,now);drawRipples();drawAtmosphere(s,now)}

  function drawGround(s){
    ctx.fillStyle=s.palette.land;ctx.fillRect(0,0,width,height);const seed=(stageIndex+2)*71;
    for(let n=0;n<85;n++){const x=(Math.sin(n*seed)*.5+.5)*width,y=(Math.cos(n*41+seed)*.5+.5)*height;ctx.globalAlpha=.08+(n%4)*.015;ctx.fillStyle=n%3?'#14211b':'#ffffff';ctx.beginPath();ctx.arc(x,y,1+(n%3),0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=1;ctx.save();ctx.translate(width/2,height/2);drawBaseShape(s,1.03,s.palette.edge);drawBaseShape(s,.94,s.palette.mud);ctx.restore()
  }

  function drawExposedWorld(s,now){
    ctx.save();const exposure=1-water/100;ctx.globalAlpha=Math.max(0,exposure-.12);
    const rockCount=Math.floor(exposure*18);for(let n=0;n<rockCount;n++){const a=n*2.37+stageIndex,b=.18+.28*((n*17)%11)/10,x=width/2+Math.cos(a)*width*b,y=height/2+Math.sin(a)*height*b*.8;ctx.fillStyle=n%3?'rgba(70,61,48,.52)':'rgba(120,108,82,.4)';ctx.beginPath();ctx.ellipse(x,y,4+(n%4)*2,2+(n%3),a,0,Math.PI*2);ctx.fill()}
    if(water<52){ctx.strokeStyle='rgba(48,39,28,.28)';ctx.lineWidth=1;for(let n=0;n<11;n++){const x=width*(.18+(n%6)*.12),y=height*(.28+((n*7)%8)*.075);ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x,y-5);ctx.lineTo(x+7,y+2);ctx.stroke()}}
    if(water<27){drawLowWaterLandmark(s,now)}ctx.restore()
  }

  function drawLowWaterLandmark(s,now){
    ctx.globalAlpha=Math.min(.75,(27-water)/18);
    if(s.type==='bath'){ctx.strokeStyle='#3c4341';ctx.lineWidth=4;ctx.beginPath();ctx.arc(width*.78,height*.73,18,0,Math.PI*2);ctx.stroke();for(let n=0;n<6;n++){ctx.save();ctx.translate(width*.78,height*.73);ctx.rotate(n*Math.PI/3);ctx.fillStyle='#303735';ctx.fillRect(3,-1,13,2);ctx.restore()}}
    else if(s.type==='pond'){ctx.strokeStyle='rgba(74,64,52,.8)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(width*.18,height*.69);ctx.lineTo(width*.82,height*.43);ctx.stroke()}
    else if(s.type==='river'){ctx.fillStyle='rgba(87,80,68,.7)';for(let n=0;n<8;n++)ctx.fillRect(width*(.13+n*.1),height*(.56+Math.sin(n)*.03),26,7)}
    else if(s.type==='lake'){ctx.fillStyle='rgba(101,93,75,.65)';for(let n=0;n<7;n++)ctx.fillRect(width*(.58+n*.025),height*(.62-n*.035),45,6)}
    else if(s.type==='bay'){ctx.strokeStyle='rgba(65,69,68,.8)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(width*.18,height*.72);ctx.lineTo(width*.75,height*.44);ctx.stroke()}
    else if(s.type==='sea'){ctx.fillStyle='rgba(92,109,112,.58)';ctx.beginPath();ctx.moveTo(width*.08,height*.74);ctx.lineTo(width*.42,height*.57);ctx.lineTo(width*.68,height*.70);ctx.lineTo(width*.93,height*.54);ctx.lineTo(width*.93,height*.88);ctx.lineTo(width*.08,height*.88);ctx.closePath();ctx.fill()}
    else{ctx.fillStyle='rgba(63,54,38,.38)';for(let n=0;n<8;n++){ctx.beginPath();ctx.arc(width*(.2+n*.08),height*(.62+Math.sin(n)*.05),6+n%3,0,Math.PI*2);ctx.fill()}}
  }

  function drawBaseShape(s,scale,color){ctx.save();ctx.scale(scale,scale);ctx.fillStyle=color;shapePath(s.type,width,height);ctx.fill();ctx.restore()}

  function shapePath(type,w,h){
    ctx.beginPath();
    if(type==='bath')roundRectPath(ctx,-w*.35,-h*.31,w*.70,h*.62,34);
    else if(type==='river'){ctx.moveTo(-w*.46,-h*.46);ctx.bezierCurveTo(-w*.12,-h*.34,-w*.38,-h*.02,-w*.04,h*.10);ctx.bezierCurveTo(w*.34,h*.24,w*.04,h*.41,w*.46,h*.47);ctx.lineTo(w*.29,h*.48);ctx.bezierCurveTo(-w*.05,h*.35,w*.21,h*.27,-w*.10,h*.17);ctx.bezierCurveTo(-w*.43,h*.06,-w*.20,-h*.25,-w*.47,-h*.35);ctx.closePath()}
    else if(type==='bay'){ctx.moveTo(-w*.48,-h*.45);ctx.lineTo(w*.48,-h*.45);ctx.lineTo(w*.48,h*.48);ctx.bezierCurveTo(w*.19,h*.35,w*.12,h*.12,-w*.02,h*.19);ctx.bezierCurveTo(-w*.17,h*.28,-w*.24,h*.08,-w*.48,h*.17);ctx.closePath()}
    else if(type==='sea')roundRectPath(ctx,-w*.48,-h*.46,w*.96,h*.92,42);
    else{const pts=type==='lake'?[[-.42,-.30],[-.18,-.45],[.14,-.39],[.39,-.22],[.43,.10],[.24,.37],[-.08,.44],[-.39,.27],[-.46,-.04]]:type==='swamp'?[[-.36,-.30],[-.04,-.42],[.31,-.30],[.43,.00],[.28,.33],[-.09,.40],[-.39,.23],[-.45,-.05]]:[[-.40,-.28],[-.10,-.41],[.30,-.31],[.43,-.02],[.30,.34],[-.02,.42],[-.36,.28],[-.44,-.02]];pts.forEach(([x,y],idx)=>idx?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath()}
  }

  function roundRectPath(c,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath()}

  function drawWater(s,now){
    const level=Math.max(.025,water/100),shrink=.20+.80*Math.sqrt(level);ctx.save();ctx.translate(width/2,height/2);ctx.scale(shrink,shrink);const grad=ctx.createRadialGradient(0,-height*.12,10,0,0,width*.5);grad.addColorStop(0,s.palette.water);grad.addColorStop(1,s.palette.deep);ctx.fillStyle=grad;shapePath(s.type,width,height);ctx.fill();ctx.clip();ctx.globalAlpha=.18;ctx.strokeStyle='#d4ffff';ctx.lineWidth=1;
    for(let n=0;n<10;n++){const y=((n*47+now*.015)%(height*.9))-height*.45;ctx.beginPath();ctx.moveTo(-width*.5,y);for(let x=-width*.5;x<width*.5;x+=18)ctx.lineTo(x,y+Math.sin(x*.05+n)*2);ctx.stroke()}ctx.globalAlpha=1;ctx.restore()
  }

  function drawScenery(s){
    ctx.save();if(s.type==='bath'){ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=7;roundRectStroke(width*.15,height*.18,width*.70,height*.62,34);ctx.fillStyle='#59605e';ctx.beginPath();ctx.arc(width*.78,height*.73,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#222928';ctx.beginPath();ctx.arc(width*.78,height*.73,5,0,Math.PI*2);ctx.fill()}
    else{const trees=s.type==='sea'?0:s.type==='bay'?4:9;for(let n=0;n<trees;n++){const side=n%2?1:-1,x=width*(.08+(n%3)*.07),px=side===1?width-x:x,py=height*(.12+(n%5)*.18);drawTree(px,py,9+(n%3)*3)}if(s.type==='river'){ctx.fillStyle='rgba(90,85,75,.72)';ctx.fillRect(width*.08,height*.48,width*.84,9);for(let n=0;n<7;n++)ctx.fillRect(width*(.12+n*.12),height*.45,5,24)}if(s.type==='bay'){ctx.fillStyle='#474d4d';ctx.fillRect(width*.04,height*.08,width*.27,height*.14);ctx.fillStyle='#616969';for(let n=0;n<4;n++)ctx.fillRect(width*(.06+n*.06),height*.04,15,height*.09)}if(s.type==='sea'){ctx.fillStyle='rgba(120,145,150,.38)';ctx.beginPath();ctx.moveTo(0,height*.22);ctx.lineTo(width*.20,height*.13);ctx.lineTo(width*.30,height*.25);ctx.lineTo(width*.42,height*.18);ctx.lineTo(width*.54,height*.30);ctx.lineTo(0,height*.34);ctx.closePath();ctx.fill()}}ctx.restore()
  }

  function roundRectStroke(x,y,w,h,r){ctx.beginPath();roundRectPath(ctx,x,y,w,h,r);ctx.stroke()}
  function drawTree(x,y,r){ctx.fillStyle='#384b2d';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#263620';ctx.beginPath();ctx.arc(x-r*.45,y+r*.25,r*.75,0,Math.PI*2);ctx.fill()}

  function drawItems(s,now){
    runtimeItems.forEach((item,n)=>{if(item.caught)return;const p=itemScreen(item);if(water>item.reveal){const delta=water-item.reveal;if(delta<22){ctx.save();ctx.globalAlpha=(22-delta)/22*.34;ctx.fillStyle='#071819';ctx.beginPath();ctx.ellipse(p.x,p.y,18+(item.rarity==='rare'?14:2),7,Math.sin(item.phase),0,Math.PI*2);ctx.fill();ctx.restore()}return}
      const emerge=Math.min(1,(item.reveal-water+4)/10);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=.42+.58*emerge;const prompted=item.id===promptItemId;if(item.rarity==='rare'||prompted){ctx.strokeStyle=prompted?'rgba(255,255,255,.92)':'rgba(216,239,119,.62)';ctx.lineWidth=prompted?3:1.5;ctx.beginPath();ctx.arc(0,0,(prompted?27:21)+Math.sin(now*.006+n)*3,0,Math.PI*2);ctx.stroke()}if(prompted){ctx.globalAlpha=.16;ctx.fillStyle='#d8ef77';ctx.beginPath();ctx.arc(0,0,34+Math.sin(now*.006)*4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}drawItemGlyph(item,now,n);ctx.restore()})
  }

  function drawItemGlyph(item,now,n){
    const wet=water>8,giant=item.name.includes('巨大')||item.name.includes('サメ')||item.name.includes('タイタニック')||item.name.includes('沈没船');if(giant)ctx.scale(1.45,1.45);
    if(item.kind==='fish'){const flip=Math.sin(item.phase+now*.0009+n)>0?1:-1;ctx.scale(flip,1);ctx.fillStyle=item.rarity==='rare'?'#d8ef77':'#d7d8c0';ctx.beginPath();ctx.ellipse(0,0,giant?18:13,giant?7:6,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(-20,-9);ctx.lineTo(-20,9);ctx.closePath();ctx.fill();ctx.fillStyle='#1b2a29';ctx.beginPath();ctx.arc(8,-1,1.5,0,Math.PI*2);ctx.fill();if(wet){ctx.globalAlpha=.18;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(0,0,25+Math.sin(now*.006)*2,0,Math.PI*2);ctx.stroke()}}
    else if(item.kind==='eel'){ctx.strokeStyle='#c2b77a';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-16,0);ctx.bezierCurveTo(-7,-9,7,9,16,0);ctx.stroke()}
    else if(item.kind==='crab'){ctx.fillStyle='#d46f48';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d46f48';ctx.lineWidth=2;for(const sy of[-1,1])for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo((k-1)*4,sy*4);ctx.lineTo((k-1)*8,sy*(11+k));ctx.stroke()}}
    else if(item.kind==='turtle'){ctx.fillStyle='#617b49';ctx.beginPath();ctx.ellipse(0,0,12,9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#829a65';ctx.beginPath();ctx.arc(13,0,4,0,Math.PI*2);ctx.fill()}
    else if(item.kind==='frog'){ctx.fillStyle='#7fa35a';ctx.beginPath();ctx.ellipse(0,0,10,8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-5,-7,3,0,Math.PI*2);ctx.arc(5,-7,3,0,Math.PI*2);ctx.fill()}
    else if(item.kind==='boat'){ctx.fillStyle='#564a3e';ctx.rotate(-.15);ctx.fillRect(-20,-7,40,14);ctx.fillStyle='#232827';ctx.fillRect(-13,-3,26,7);ctx.strokeStyle='#8b7b66';ctx.beginPath();ctx.moveTo(2,-8);ctx.lineTo(2,-26);ctx.stroke()}
    else if(item.kind==='bike'){ctx.strokeStyle='#4b4540';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-10,5,8,0,Math.PI*2);ctx.arc(11,5,8,0,Math.PI*2);ctx.moveTo(-10,5);ctx.lineTo(0,-5);ctx.lineTo(11,5);ctx.moveTo(0,-5);ctx.lineTo(5,5);ctx.lineTo(-10,5);ctx.stroke()}
    else if(item.kind==='pot'){ctx.fillStyle='#997155';ctx.beginPath();ctx.ellipse(0,1,10,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#493c33';ctx.fillRect(-7,-11,14,4)}
    else if(item.kind==='relic'){ctx.fillStyle='#7f7a6a';ctx.rotate(.25);ctx.fillRect(-12,-9,24,18);ctx.fillStyle='#4f4c43';ctx.fillRect(-8,-4,16,2);ctx.fillRect(-6,1,12,2)}
    else if(item.kind==='trash'){ctx.fillStyle='#6d7770';ctx.rotate(.35);ctx.fillRect(-9,-13,18,26);ctx.fillStyle='#9aa39e';ctx.fillRect(-9,-13,18,4)}
    else if(item.kind==='coin'){ctx.fillStyle='#b68b35';ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6d511f';ctx.beginPath();ctx.arc(0,0,2,0,Math.PI*2);ctx.fill()}
    else{ctx.fillStyle='#151c1c';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d8ef77';ctx.font='900 20px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',0,1)}
  }

  function drawRipples(){for(const r of ripples){const p=r.t/.55;ctx.save();ctx.globalAlpha=(1-p)*.45;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,8+p*28,0,Math.PI*2);ctx.stroke();ctx.restore()}}
  function drawAtmosphere(s,now){if(water<45){ctx.save();ctx.globalAlpha=(45-water)/45*.10;ctx.fillStyle='#d3b376';for(let n=0;n<12;n++){const x=(Math.sin(n*87+now*.0002)*.5+.5)*width,y=(Math.cos(n*43)*.5+.5)*height;ctx.beginPath();ctx.arc(x,y,3+(n%3),0,Math.PI*2);ctx.fill()}ctx.restore()}ctx.save();ctx.fillStyle='rgba(0,0,0,.13)';ctx.fillRect(0,0,width,10);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(0,height-1,width,1);ctx.restore()}

  window.addEventListener('resize',resize,{passive:true});resize();prepareStage(stageIndex);requestAnimationFrame(loop);
})();
