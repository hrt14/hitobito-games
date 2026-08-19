(() => {
  'use strict';

  const TOTAL_STOPS = 12;
  const STORAGE_KEY = 'hitobito_shuden_hyakki_collection_v1';
  const BEST_KEY = 'hitobito_shuden_hyakki_best_v1';

  const stops = [
    '夜見一丁目','狐坂下','古書横丁','飛石橋','赤提灯前','雨垂小路',
    '猫塚入口','柳ノ辻','眠り町','影踏坂','境川車庫前','朝待終点'
  ];

  const yokai = [
    { id:'hitotsume', name:'一つ目の会社員', symbol:'目', kind:'hitotsume',
      clue:'傘は二本。影はひとつ。顔の中央だけが光っている。',
      note:'終電後だけホームに現れる、一つ目の通勤客。' },
    { id:'rokuro', name:'首長のひと', symbol:'首', kind:'rokuro',
      clue:'電線を避けるように、首だけがゆっくり下がってきた。',
      note:'屋根より上まで首を伸ばし、電車を待つ。' },
    { id:'karakasa', name:'からかさ乗客', symbol:'傘', kind:'karakasa',
      clue:'雨は降っていない。傘だけが、片足で時刻表を見ている。',
      note:'一本足で跳ねながら、最後尾の席を好む。' },
    { id:'nekomata', name:'二尾猫', symbol:'猫', kind:'nekomata',
      clue:'ベンチの下。猫のしっぽが、左右へ別々に動いた。',
      note:'停車すると、人のふりをやめて二本の尾を見せる。' },
    { id:'noppera', name:'顔なしの女', symbol:'無', kind:'noppera',
      clue:'こちらを向いた。帽子も口元も見えるのに、目鼻だけがない。',
      note:'窓に顔を映さず、静かに一番前へ乗る。' },
    { id:'chochin', name:'提灯小僧', symbol:'灯', kind:'chochin',
      clue:'足音がない。赤い灯りだけが、ホームの高さを漂っている。',
      note:'車内灯が消えると、代わりに赤く光る。' },
    { id:'kagebozu', name:'影ぼうず', symbol:'影', kind:'kagebozu',
      clue:'人影が止まったのに、その影だけは線路側へ歩き続けた。',
      note:'本体と影が別々の席へ座る、黒い乗客。' },
    { id:'ameonna', name:'雨女', symbol:'雨', kind:'ameonna',
      clue:'空は晴れている。あの人の頭上だけ、細い雨が落ちている。',
      note:'乗ると窓が少し曇る。降りると雨も止む。' }
  ];

  const humans = [
    { id:'office', name:'帰れなくなった会社員', kind:'human-office',
      clue:'スマホの終電案内を何度も更新して、ため息をついている。' },
    { id:'student', name:'部活帰りの学生', kind:'human-student',
      clue:'大きなスポーツバッグ。眠そうに靴先で地面をこすっている。' },
    { id:'elder', name:'買い物帰りの人', kind:'human-elder',
      clue:'紙袋から長ねぎ。腕時計と路線図を交互に見ている。' },
    { id:'tourist', name:'道に迷った旅行者', kind:'human-tourist',
      clue:'地図をこちらに向けて、困った顔で駅名を指さしている。' },
    { id:'worker', name:'夜勤明けの作業員', kind:'human-worker',
      clue:'反射ベストと水筒。ベンチに座って普通にあくびをした。' },
    { id:'parent', name:'子どもを抱いた人', kind:'human-parent',
      clue:'眠った子どもの靴が片方だけ揺れている。二人とも影がある。' }
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    startScreen:$('startScreen'), gameScreen:$('gameScreen'), resultScreen:$('resultScreen'),
    startBtn:$('startBtn'), retryBtn:$('retryBtn'), stopBtn:$('stopBtn'), passBtn:$('passBtn'),
    scene:$('scene'), cab:$('cab'), clueCard:$('clueCard'), clueText:$('clueText'),
    feedback:$('feedback'), feedbackMark:$('feedbackMark'), feedbackTitle:$('feedbackTitle'), feedbackText:$('feedbackText'),
    stopName:$('stopName'), bannerStop:$('bannerStop'), approachBanner:$('approachBanner'),
    timeLabel:$('timeLabel'), yokaiCount:$('yokaiCount'), dangerCount:$('dangerCount'),
    routeProgress:$('routeProgress'), passengerStrip:$('passengerStrip'), speedLabel:$('speedLabel'),
    muteBtn:$('muteBtn'), openZukanBtn:$('openZukanBtn'), resultZukanBtn:$('resultZukanBtn'),
    closeZukanBtn:$('closeZukanBtn'), zukanDialog:$('zukanDialog'), zukanGrid:$('zukanGrid'),
    startCollection:$('startCollection'), rank:$('rank'), correctScore:$('correctScore'),
    newScore:$('newScore'), resultTitle:$('resultTitle'), resultCopy:$('resultCopy'), endingReveal:$('endingReveal')
  };

  let collection = loadJSON(STORAGE_KEY, []);
  let best = Number(safeStorageGet(BEST_KEY) || 0);
  let muted = false;
  let audioCtx = null;
  let state = makeState();
  let view = { w: 0, h: 0, dpr: 1 };
  const ctx = els.scene.getContext('2d');

  function makeState() {
    return {
      index:0, schedule:[], encounter:null, atStop:false, locked:true,
      correct:0, danger:0, onboard:[], newFinds:0, ended:false,
      travelStarted:performance.now(), stopStarted:0, lastChoice:null
    };
  }

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function loadJSON(key, fallback) {
    try {
      const val = JSON.parse(safeStorageGet(key));
      return Array.isArray(val) ? val : fallback;
    } catch { return fallback; }
  }

  function saveCollection() {
    safeStorageSet(STORAGE_KEY, JSON.stringify(collection));
  }

  function shuffle(list) {
    const a = [...list];
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function buildSchedule() {
    const ys = shuffle(yokai).slice(0,7).map(v => ({...v,isYokai:true}));
    const hs = shuffle(humans).slice(0,5).map(v => ({...v,isYokai:false}));
    return shuffle([...ys,...hs]);
  }

  function switchScreen(target) {
    [els.startScreen,els.gameScreen,els.resultScreen].forEach(el=>el.classList.remove('active'));
    target.classList.add('active');
  }

  function makeRoute() {
    els.routeProgress.innerHTML = '';
    for (let i=0;i<TOTAL_STOPS;i++) {
      const n=document.createElement('i');
      n.className='route-node';
      els.routeProgress.appendChild(n);
    }
    updateRoute();
  }

  function updateRoute() {
    const nodes=[...els.routeProgress.children];
    nodes.forEach((n,i)=>{
      n.classList.toggle('done', i < state.index);
      n.classList.toggle('current', i === state.index && !state.ended);
      n.classList.toggle('last-done', state.ended && i===TOTAL_STOPS-1);
    });
  }

  function startGame() {
    unlockAudio();
    state = makeState();
    state.schedule=buildSchedule();
    makeRoute();
    switchScreen(els.gameScreen);
    els.passengerStrip.innerHTML='';
    setDanger(0);
    els.yokaiCount.textContent='0';
    els.feedback.className='feedback';
    els.clueCard.classList.remove('show');
    els.stopBtn.disabled=true; els.passBtn.disabled=true;
    requestAnimationFrame(()=>resizeCanvas());
    beginStop();
  }

  function beginStop() {
    if (state.index >= TOTAL_STOPS) return finishGame(false);
    state.encounter=state.schedule[state.index];
    state.atStop=false;
    state.locked=true;
    state.lastChoice=null;
    state.travelStarted=performance.now();
    els.stopBtn.disabled=true; els.passBtn.disabled=true;
    els.clueCard.classList.remove('show');
    els.feedback.className='feedback';
    els.approachBanner.classList.remove('show');
    els.cab.classList.remove('correct-flash','wrong-flash','arriving');
    const stop=stops[state.index];
    els.stopName.textContent=stop;
    els.bannerStop.textContent=stop;
    els.timeLabel.textContent=timeForIndex(state.index);
    els.speedLabel.textContent='26';
    updateRoute();
    setTimeout(()=>els.approachBanner.classList.add('show'),220);
    setTimeout(arriveAtStop,920);
  }

  function arriveAtStop() {
    if (state.ended) return;
    state.atStop=true;
    state.stopStarted=performance.now();
    state.locked=false;
    els.speedLabel.textContent='0';
    els.cab.classList.add('arriving');
    els.clueText.textContent=state.encounter.clue;
    els.clueCard.classList.add('show');
    els.stopBtn.disabled=false; els.passBtn.disabled=false;
    beep(520,.06,'sine',.035);
    setTimeout(()=>els.cab.classList.remove('arriving'),750);
  }

  function decide(stopChoice) {
    if (state.locked || state.ended) return;
    state.locked=true;
    els.stopBtn.disabled=true; els.passBtn.disabled=true;
    state.lastChoice=stopChoice?'stop':'pass';
    const e=state.encounter;
    const correct=(stopChoice && e.isYokai) || (!stopChoice && !e.isYokai);
    if (correct) {
      state.correct++;
      els.cab.classList.add('correct-flash');
      els.feedback.className='feedback good show';
      els.feedbackMark.textContent='○';
      if (e.isYokai) {
        const isNew=!collection.includes(e.id);
        if (isNew) {
          collection.push(e.id);
          state.newFinds++;
          saveCollection();
        }
        state.onboard.push(e);
        els.yokaiCount.textContent=String(state.onboard.length);
        addPassenger(e);
        els.feedbackTitle.textContent=isNew ? `新発見「${e.name}」` : `${e.name}が乗車`;
        els.feedbackText.textContent=isNew ? '図鑑に記録した。車内の気配がひとつ増えた。' : 'やはり妖怪だった。夜の乗客がひとつ増えた。';
        ding();
      } else {
        els.feedbackTitle.textContent='人間だった';
        els.feedbackText.textContent='通過して正解。あの人には、この電車が見えていない。';
        beep(700,.05,'sine',.03);
      }
    } else {
      state.danger++;
      setDanger(state.danger);
      els.cab.classList.add('wrong-flash');
      els.feedback.className='feedback bad show';
      els.feedbackMark.textContent='×';
      if (e.isYokai) {
        els.feedbackTitle.textContent=`${e.name}を置き去り`;
        els.feedbackText.textContent='窓の外の影が、電車と同じ速さでついてくる。';
      } else {
        els.feedbackTitle.textContent='人間を乗せてしまった';
        els.feedbackText.textContent='扉の向こうで車内が軋んだ。ここは人間の乗る電車ではない。';
      }
      buzz();
    }
    vibrate(correct ? 22 : [45,35,60]);
    updateCollectionCount();
    setTimeout(()=>{
      if (state.danger>=3) return finishGame(true);
      state.index++;
      beginStop();
    },1050);
  }

  function setDanger(n) {
    els.dangerCount.textContent=`${n} / 3`;
    els.cab.classList.remove('danger-1','danger-2','danger-3');
    if (n>0) els.cab.classList.add(`danger-${Math.min(3,n)}`);
  }

  function addPassenger(e) {
    const mini=document.createElement('span');
    mini.className='passenger-mini';
    mini.title=e.name;
    mini.textContent=e.symbol;
    els.passengerStrip.appendChild(mini);
  }

  function finishGame(failed) {
    state.ended=true;
    state.locked=true;
    els.stopBtn.disabled=true; els.passBtn.disabled=true;
    updateRoute();
    if (!failed) state.index=TOTAL_STOPS;
    const score=state.correct;
    if (score>best) {
      best=score;
      safeStorageSet(BEST_KEY,String(best));
    }
    let rank='C';
    if (!failed && score>=11) rank='S';
    else if (!failed && score>=9) rank='A';
    else if (score>=7) rank='B';
    els.rank.textContent=rank;
    els.correctScore.textContent=`${score} / ${TOTAL_STOPS}`;
    els.newScore.textContent=String(state.newFinds);
    if (failed) {
      els.resultTitle.textContent='線路が、消えた。';
      els.resultCopy.textContent='三度目の見誤り。都電は朝の来ない路地へ曲がっていった。';
      els.endingReveal.innerHTML='<span>車掌からの伝言</span><p>「人と妖怪を間違えるな。境目を三度越えると、帰る線路まで消える。」</p>';
      buzz();
    } else if (rank==='S') {
      els.resultTitle.textContent='朝まで、完璧に運んだ。';
      els.resultCopy.textContent='空が白むころ、車内の妖怪たちは一人ずつ消えていった。';
      els.endingReveal.innerHTML='<span>車掌からの伝言</span><p>「人間を乗せなかったな。よし。<br>この電車は、最初から人のための電車じゃない。」</p>';
      ding(true);
    } else {
      els.resultTitle.textContent='夜を走り切った。';
      els.resultCopy.textContent='朝焼けの線路に、乗客の影だけが残った。';
      els.endingReveal.innerHTML='<span>車掌からの伝言</span><p>「夜の都電には、昼とは別の客がいる。<br>次は、もっとよく顔を見ろ。」</p>';
    }
    updateCollectionCount();
    setTimeout(()=>switchScreen(els.resultScreen),350);
  }

  function timeForIndex(i) {
    const minutes=13+i*23;
    const h=Math.floor(minutes/60);
    const m=minutes%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  function updateCollectionCount() {
    els.startCollection.textContent=`${collection.length} / ${yokai.length}`;
  }

  function openZukan() {
    renderZukan();
    if (typeof els.zukanDialog.showModal==='function') els.zukanDialog.showModal();
    else els.zukanDialog.setAttribute('open','');
  }

  function closeZukan() {
    if (typeof els.zukanDialog.close==='function') els.zukanDialog.close();
    else els.zukanDialog.removeAttribute('open');
  }

  function renderZukan() {
    els.zukanGrid.innerHTML='';
    yokai.forEach((y,i)=>{
      const unlocked=collection.includes(y.id);
      const card=document.createElement('article');
      card.className=`zukan-card${unlocked?'':' locked'}`;
      card.innerHTML=`
        <div class="zukan-symbol">${unlocked?y.symbol:'？'}</div>
        <h3>${unlocked?y.name:`未記録 ${String(i+1).padStart(2,'0')}`}</h3>
        <p>${unlocked?y.note:'夜のどこかで、まだ電車を待っている。'}</p>`;
      els.zukanGrid.appendChild(card);
    });
  }

  // ---- sound ----
  function unlockAudio() {
    if (muted) return;
    try {
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      if (audioCtx.state==='suspended') audioCtx.resume();
    } catch {}
  }
  function beep(freq=440,dur=.06,type='sine',volume=.03,delay=0) {
    if (muted || !audioCtx) return;
    const t=audioCtx.currentTime+delay;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.02);
  }
  function ding(long=false) {
    beep(622,long?.12:.08,'sine',.03,0);
    beep(932,long?.16:.1,'sine',.025,.07);
  }
  function buzz() {
    beep(95,.15,'sawtooth',.025,0);beep(73,.19,'sawtooth',.018,.07);
  }
  function vibrate(pattern) { try { navigator.vibrate?.(pattern); } catch {} }

  // ---- canvas ----
  function resizeCanvas() {
    const rect=els.scene.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1);
    if (!rect.width || !rect.height) return;
    view={w:rect.width,h:rect.height,dpr};
    els.scene.width=Math.round(rect.width*dpr);
    els.scene.height=Math.round(rect.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function draw(now) {
    if (els.gameScreen.classList.contains('active')) drawScene(now);
    requestAnimationFrame(draw);
  }

  function drawScene(now) {
    const {w,h}=view;if(!w||!h)return;
    ctx.clearRect(0,0,w,h);
    const travel=!state.atStop;
    const travelP=Math.min(1,(now-state.travelStarted)/920);
    drawSky(w,h,state.index,now);
    drawCity(w,h,now,travel);
    drawWires(w,h);
    drawStreet(w,h,now,travel);
    drawPlatform(w,h,state.index);
    drawStopSign(w,h,stops[state.index]||'朝待終点');
    if (state.encounter) {
      const alpha=travel ? Math.max(0,(travelP-.48)/.52) : 1;
      drawEncounter(state.encounter,w,h,now,alpha);
    }
    drawCabEdges(w,h);
    if (travel) drawMotion(w,h,now);
  }

  function drawSky(w,h,index,now) {
    const g=ctx.createLinearGradient(0,0,0,h);
    const dawn=index>=10;
    g.addColorStop(0,dawn?'#282131':'#090b18');
    g.addColorStop(.6,dawn?'#33262f':'#121321');
    g.addColorStop(1,'#111117');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.7;
    for(let i=0;i<18;i++){
      const x=(i*83.7)%w,y=24+((i*47)%Math.max(70,h*.28));
      ctx.fillStyle='#ddd8bf';ctx.fillRect(x,y,1,1);
    }
    ctx.globalAlpha=1;
    if(dawn){
      const rg=ctx.createRadialGradient(w*.82,h*.23,4,w*.82,h*.23,w*.32);
      rg.addColorStop(0,'rgba(232,144,108,.18)');rg.addColorStop(1,'rgba(232,144,108,0)');
      ctx.fillStyle=rg;ctx.fillRect(0,0,w,h*.7);
    }
  }

  function drawCity(w,h,now,travel) {
    const base=h*.62;
    const speed=travel?((now-state.travelStarted)*.04):0;
    const layers=[
      {y:base-.22*h, color:'#11131a', width:86, shift:.23},
      {y:base-.12*h, color:'#171820', width:62, shift:.45}
    ];
    layers.forEach((l,li)=>{
      const off=-(speed*l.shift)%l.width;
      for(let x=off-l.width;x<w+l.width;x+=l.width){
        const variation=((Math.floor((x+speed*l.shift)/l.width)+state.index*3+li*7)%4+4)%4;
        const bh=(.15+variation*.035)*h;
        ctx.fillStyle=l.color;ctx.fillRect(x,l.y-bh,l.width-5,bh);
        ctx.fillStyle=li?'rgba(221,187,112,.12)':'rgba(204,210,190,.07)';
        for(let wy=l.y-bh+13;wy<l.y-10;wy+=18){
          ctx.fillRect(x+9,wy,7,5);ctx.fillRect(x+27,wy,7,5);ctx.fillRect(x+45,wy,7,5);
        }
      }
    });
    for(let i=0;i<5;i++){
      const x=(i*137 + 36 - speed*.72)%(w+170)-60;
      ctx.fillStyle='#0a0d0d';ctx.fillRect(x,base-h*.23,4,h*.25);
      ctx.beginPath();ctx.arc(x+2,base-h*.25,25+(i%2)*8,0,Math.PI*2);ctx.fill();
    }
  }

  function drawWires(w,h) {
    ctx.strokeStyle='rgba(175,177,181,.32)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,h*.19);ctx.quadraticCurveTo(w*.5,h*.24,w,h*.18);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,h*.29);ctx.quadraticCurveTo(w*.43,h*.25,w,h*.31);ctx.stroke();
    ctx.strokeStyle='rgba(130,132,137,.2)';
    ctx.beginPath();ctx.moveTo(w*.56,0);ctx.lineTo(w*.49,h*.44);ctx.stroke();
  }

  function drawStreet(w,h,now,travel) {
    const y=h*.62;
    ctx.fillStyle='#24242a';ctx.fillRect(0,y,w,h-y);
    ctx.strokeStyle='#66666a';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(w*.23,h);ctx.lineTo(w*.42,y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(w*.77,h);ctx.lineTo(w*.58,y);ctx.stroke();
    ctx.strokeStyle='#17181b';ctx.lineWidth=6;
    const offset=travel?((now-state.travelStarted)*.12)%32:0;
    for(let yy=y+offset;yy<h+30;yy+=32){
      const p=(yy-y)/(h-y);
      const half=(.08+.34*p)*w;
      ctx.beginPath();ctx.moveTo(w*.5-half,yy);ctx.lineTo(w*.5+half,yy);ctx.stroke();
    }
    ctx.fillStyle='#343238';
    ctx.beginPath();ctx.moveTo(w*.59,y+2);ctx.lineTo(w,y-h*.03);ctx.lineTo(w,h*.86);ctx.lineTo(w*.72,h*.79);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#d6ba69';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(w*.59,y+4);ctx.lineTo(w,h*.57);ctx.stroke();
  }

  function drawPlatform(w,h,index) {
    const y=h*.58;
    ctx.fillStyle='#15171d';ctx.fillRect(w*.66,y-h*.18,w*.25,h*.18);
    ctx.fillStyle='#20232a';ctx.fillRect(w*.64,y-h*.19,w*.29,5);
    ctx.fillStyle='rgba(204,194,169,.13)';ctx.fillRect(w*.69,y-h*.16,w*.16,h*.10);
    ctx.fillStyle='#27282d';ctx.fillRect(w*.70,y-9,w*.12,5);
    if(index%3===0){
      ctx.fillStyle='#22242a';ctx.fillRect(w*.91,y-h*.15,w*.065,h*.15);
      ctx.fillStyle='rgba(105,178,210,.18)';ctx.fillRect(w*.917,y-h*.135,w*.05,h*.07);
    }else if(index%3===1){
      ctx.fillStyle='#3b2020';ctx.fillRect(w*.91,y-h*.10,w*.045,h*.10);
      ctx.fillStyle='#b55b42';ctx.beginPath();ctx.arc(w*.932,y-h*.12,6,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle='#1d1d22';ctx.fillRect(w*.88,y-h*.12,w*.1,h*.12);
      ctx.fillStyle='rgba(224,179,86,.22)';ctx.fillRect(w*.89,y-h*.105,w*.07,4);
    }
  }

  function drawStopSign(w,h,name) {
    const x=w*.61,y=h*.36;
    ctx.strokeStyle='#47474d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y+17);ctx.lineTo(x,h*.61);ctx.stroke();
    ctx.fillStyle='#ece6d8';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9d2f31';ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f6eee0';ctx.font='700 7px sans-serif';ctx.textAlign='center';ctx.fillText('都電',x,y+2);
    ctx.fillStyle='#e3ded5';ctx.fillRect(x-24,y+20,48,13);
    ctx.fillStyle='#1c1d21';ctx.font='600 6px sans-serif';
    const short=name.length>6?name.slice(0,6):name;ctx.fillText(short,x,y+29);
  }

  function drawEncounter(e,w,h,now,alpha) {
    ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
    const x=w*.78, ground=h*.585;
    if(e.kind.startsWith('human')) drawHuman(e.kind,x,ground,w,h,now);
    else drawYokai(e.kind,x,ground,w,h,now);
    ctx.restore();
  }

  function body(ctx,x,y,scale=1,coat='#17191f') {
    ctx.fillStyle=coat;
    ctx.beginPath();ctx.ellipse(x,y-34*scale,13*scale,15*scale,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(x-14*scale,y-20*scale);ctx.lineTo(x+13*scale,y-20*scale);ctx.lineTo(x+18*scale,y+35*scale);ctx.lineTo(x-19*scale,y+35*scale);ctx.closePath();ctx.fill();
    ctx.strokeStyle=coat;ctx.lineWidth=5*scale;ctx.beginPath();ctx.moveTo(x-7*scale,y+32*scale);ctx.lineTo(x-9*scale,y+55*scale);ctx.moveTo(x+7*scale,y+32*scale);ctx.lineTo(x+10*scale,y+55*scale);ctx.stroke();
  }

  function drawHuman(kind,x,g,w,h,now) {
    const s=Math.max(.78,Math.min(1.05,w/390));
    body(ctx,x,g-55*s,s,kind==='human-worker'?'#30343a':'#1a1b21');
    const headY=g-89*s;
    ctx.fillStyle='#c2ad9c';ctx.beginPath();ctx.arc(x,headY,10*s,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#29272a';ctx.beginPath();ctx.arc(x,headY-4*s,10*s,Math.PI,0);ctx.fill();
    ctx.fillStyle='#35343a';ctx.fillRect(x-7*s,headY+1*s,3*s,2*s);ctx.fillRect(x+4*s,headY+1*s,3*s,2*s);
    if(kind==='human-student'){
      ctx.fillStyle='#262933';ctx.fillRect(x+15*s,g-47*s,16*s,26*s);
    } else if(kind==='human-tourist'){
      ctx.fillStyle='#d7d0bd';ctx.fillRect(x-23*s,g-52*s,20*s,16*s);
      ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.strokeRect(x-23*s,g-52*s,20*s,16*s);
    } else if(kind==='human-elder'){
      ctx.strokeStyle='#7c6c56';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+18*s,g-30*s);ctx.lineTo(x+20*s,g);ctx.stroke();
      ctx.fillStyle='#4b4a3f';ctx.fillRect(x-27*s,g-43*s,13*s,20*s);
    } else if(kind==='human-worker'){
      ctx.fillStyle='#b9a448';ctx.fillRect(x-13*s,g-68*s,26*s,5*s);
    } else if(kind==='human-parent'){
      ctx.fillStyle='#282832';ctx.beginPath();ctx.arc(x-14*s,g-52*s,9*s,0,Math.PI*2);ctx.fill();
    } else {
      ctx.fillStyle='#697b80';ctx.fillRect(x+12*s,g-50*s,7*s,13*s);
    }
  }

  function drawYokai(kind,x,g,w,h,now) {
    const s=Math.max(.8,Math.min(1.08,w/390));
    const pulse=Math.sin(now*.004);
    if(kind==='hitotsume'){
      body(ctx,x,g-55*s,s,'#14151a');
      ctx.fillStyle='#bca996';ctx.beginPath();ctx.arc(x,g-89*s,11*s,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#efe7d8';ctx.beginPath();ctx.ellipse(x,g-89*s,7*s,4.5*s,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#171319';ctx.beginPath();ctx.arc(x,g-89*s,2.6*s,0,Math.PI*2);ctx.fill();
    } else if(kind==='rokuro'){
      body(ctx,x,g-50*s,s,'#1b1820');
      const neck=35+8*pulse;
      ctx.fillStyle='#b9a397';ctx.fillRect(x-3*s,g-(104+neck)*s,6*s,neck*s);
      ctx.beginPath();ctx.arc(x,g-(108+neck)*s,10*s,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#252027';ctx.beginPath();ctx.arc(x,g-(112+neck)*s,10*s,Math.PI,0);ctx.fill();
    } else if(kind==='karakasa'){
      const yy=g-45*s+Math.sin(now*.006)*3;
      ctx.strokeStyle='#a99270';ctx.lineWidth=5*s;ctx.beginPath();ctx.moveTo(x,yy+25*s);ctx.lineTo(x,yy+72*s);ctx.stroke();
      ctx.fillStyle='#7c332d';ctx.beginPath();ctx.moveTo(x-28*s,yy+6*s);ctx.quadraticCurveTo(x,yy-24*s,x+28*s,yy+6*s);ctx.closePath();ctx.fill();
      ctx.fillStyle='#eee4cf';ctx.beginPath();ctx.arc(x,yy,4*s,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#a99270';ctx.lineWidth=4*s;ctx.beginPath();ctx.moveTo(x,yy+72*s);ctx.lineTo(x-9*s,yy+91*s);ctx.stroke();
    } else if(kind==='nekomata'){
      const yy=g-22*s;
      ctx.fillStyle='#151419';ctx.beginPath();ctx.ellipse(x,yy,20*s,12*s,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(x+15*s,yy-12*s,9*s,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(x+10*s,yy-19*s);ctx.lineTo(x+13*s,yy-28*s);ctx.lineTo(x+18*s,yy-20*s);ctx.fill();
      ctx.strokeStyle='#151419';ctx.lineWidth=4*s;
      ctx.beginPath();ctx.moveTo(x-15*s,yy);ctx.bezierCurveTo(x-44*s,yy-35*s,x-36*s,yy-55*s,x-18*s,yy-45*s);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-13*s,yy+3*s);ctx.bezierCurveTo(x-49*s,yy+8*s,x-43*s,yy-31*s,x-22*s,yy-28*s);ctx.stroke();
      ctx.fillStyle='#e4bc63';ctx.fillRect(x+17*s,yy-14*s,2*s,2*s);
    } else if(kind==='noppera'){
      body(ctx,x,g-55*s,s,'#201a21');
      ctx.fillStyle='#c4aea0';ctx.beginPath();ctx.ellipse(x,g-89*s,10*s,12*s,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2b2026';ctx.beginPath();ctx.arc(x,g-96*s,11*s,Math.PI,0);ctx.fill();
    } else if(kind==='chochin'){
      const yy=g-83*s+Math.sin(now*.005)*6;
      ctx.fillStyle='rgba(202,75,48,.18)';ctx.beginPath();ctx.arc(x,yy,28*s,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#a63d2f';ctx.beginPath();ctx.ellipse(x,yy,15*s,24*s,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#d78e57';ctx.lineWidth=1;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x-13*s,yy+i*7*s);ctx.lineTo(x+13*s,yy+i*7*s);ctx.stroke()}
      ctx.fillStyle='#f1d99b';ctx.beginPath();ctx.arc(x-4*s,yy-2*s,2*s,0,Math.PI*2);ctx.arc(x+4*s,yy-2*s,2*s,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#e9c57c';ctx.beginPath();ctx.arc(x,yy+7*s,5*s,0,Math.PI);ctx.stroke();
    } else if(kind==='kagebozu'){
      ctx.save();ctx.globalAlpha*=.22;body(ctx,x-31*s,g-53*s,s*1.05,'#020203');ctx.restore();
      body(ctx,x,g-55*s,s,'#101115');
      ctx.fillStyle='#0d0e12';ctx.beginPath();ctx.arc(x,g-89*s,10*s,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(234,214,159,.55)';ctx.fillRect(x-5*s,g-91*s,2*s,2*s);ctx.fillRect(x+4*s,g-91*s,2*s,2*s);
    } else if(kind==='ameonna'){
      body(ctx,x,g-55*s,s,'#192027');
      ctx.fillStyle='#aaa0a0';ctx.beginPath();ctx.arc(x,g-89*s,10*s,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#17191e';ctx.lineWidth=3*s;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*4*s,g-98*s);ctx.lineTo(x+i*5*s,g-67*s);ctx.stroke()}
      ctx.strokeStyle='rgba(160,194,211,.55)';ctx.lineWidth=1;
      for(let i=0;i<12;i++){
        const rx=x-28*s+(i*13%58)*s, ry=g-145*s+((now*.09+i*17)%70)*s;
        ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-2*s,ry+8*s);ctx.stroke();
      }
    }
  }

  function drawCabEdges(w,h) {
    ctx.fillStyle='#090a0d';
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.055,0);ctx.lineTo(w*.16,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w*.945,0);ctx.lineTo(w*.84,h);ctx.lineTo(w,h);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#27282d';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(w*.06,0);ctx.lineTo(w*.16,h);ctx.moveTo(w*.94,0);ctx.lineTo(w*.84,h);ctx.stroke();
    const glass=ctx.createLinearGradient(0,0,w,h);glass.addColorStop(0,'rgba(255,255,255,.025)');glass.addColorStop(.5,'rgba(255,255,255,0)');glass.addColorStop(1,'rgba(190,198,207,.035)');
    ctx.fillStyle=glass;ctx.fillRect(w*.07,0,w*.86,h);
  }

  function drawMotion(w,h,now) {
    const p=(now-state.travelStarted)/920;
    ctx.save();ctx.globalAlpha=Math.max(0,.35*(1-p));
    ctx.strokeStyle='rgba(230,229,218,.3)';ctx.lineWidth=1;
    for(let i=0;i<9;i++){
      const y=(i*47+now*.25)%h;
      ctx.beginPath();ctx.moveTo(w*.12,y);ctx.lineTo(w*.30,y-4);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.72,y+17);ctx.lineTo(w*.94,y+12);ctx.stroke();
    }
    ctx.restore();
  }

  // ---- events ----
  els.startBtn.addEventListener('click',startGame);
  els.retryBtn.addEventListener('click',startGame);
  els.stopBtn.addEventListener('click',()=>decide(true));
  els.passBtn.addEventListener('click',()=>decide(false));
  els.openZukanBtn.addEventListener('click',openZukan);
  els.resultZukanBtn.addEventListener('click',openZukan);
  els.closeZukanBtn.addEventListener('click',closeZukan);
  els.zukanDialog.addEventListener('click',(e)=>{
    if(e.target===els.zukanDialog) closeZukan();
  });
  els.muteBtn.addEventListener('click',()=>{
    muted=!muted;els.muteBtn.textContent=muted?'×':'♪';
    if(!muted) { unlockAudio();beep(520,.05,'sine',.02); }
  });
  window.addEventListener('resize',resizeCanvas,{passive:true});
  window.addEventListener('keydown',(e)=>{
    if(!els.gameScreen.classList.contains('active')||state.locked)return;
    if(e.key==='ArrowLeft'||e.key==='a')decide(true);
    if(e.key==='ArrowRight'||e.key==='d')decide(false);
  });

  updateCollectionCount();
  renderZukan();
  requestAnimationFrame(draw);
})();