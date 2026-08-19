(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const fast=new URLSearchParams(location.search).has('fast');
  const demo=new URLSearchParams(location.search).get('demo');
  const TOTAL=8, LOOK_MS=fast?180:2100, BLACKOUT_MS=fast?120:460, FIND_MS=fast?900:6200;
  document.documentElement.style.setProperty('--find-time',`${FIND_MS}ms`);
  const anomalyInfo={
    sign:{target:'sign',label:'料金看板',text:'最大料金の桁が増えている'},
    stop:{target:'stop',label:'車止め',text:'車止めが消えている'},
    lamp:{target:'lamp',label:'照明',text:'白い照明が赤くなっている'},
    bay:{target:'bay',label:'駐車番号',text:'010L が 001L になっている'},
    sheet:{target:'sheet',label:'カバー',text:'カバーの中身が立ち上がっている'},
    post:{target:'post',label:'番号ポール',text:'矢印の向きが逆になっている'},
    gate:{target:'gate',label:'フェンス',text:'閉まっていたフェンスが開いている'},
    mirror:{target:'mirror',label:'車',text:'サイドミラーがなくなっている'},
    beam:{target:'beam',label:'高架の梁',text:'天井に亀裂が増えている'},
    shadow:{target:'shadow',label:'フェンスの奥',text:'フェンスの奥に誰か立っている'},
    none:{target:'none',label:'変化なし',text:'今回は何も変わっていなかった'}
  };
  const tiered=[['sign','stop'],['lamp','bay'],['sheet','post'],['gate','mirror'],['beam','none'],['shadow']];
  let round=0,fee=0,active='none',state='intro',timer=null,deadline=0,audio=null,master=null;
  const scene=$('#scene'),phase=$('#phase'),message=$('#message'),noneBtn=$('#noneBtn'),scan=$('#scan'),feeEl=$('#fee'),feeStat=$('#feeStat'),gameTime=$('#gameTime'),clock=$('#clock'),roundEl=$('#round'),blackout=$('#blackout'),flash=$('#flash'),toast=$('#toast');

  const pickSequence=()=>{
    const seq=[];
    for(const pair of tiered.slice(0,4)) seq.push(pair[Math.floor(Math.random()*pair.length)]);
    const late=['beam','none','gate','mirror'].sort(()=>Math.random()-.5).slice(0,2); seq.push(...late);
    seq.push('shadow');
    const last=['none','beam','post','sheet'].filter(x=>!seq.includes(x))[0]||'none'; seq.push(last);
    return seq.slice(0,TOTAL);
  };
  let sequence=pickSequence();

  function initAudio(){
    if(audio) return;
    try{audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.08;master.connect(audio.destination);}catch(e){}
  }
  function tone(freq=220,dur=.08,type='sine',vol=.18){
    if(!audio||!master) return; const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(master);const t=audio.currentTime;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.start(t);o.stop(t+dur+.01);
  }
  function vibrate(p){try{navigator.vibrate?.(p)}catch(e){}}
  function setPhase(kind,label){phase.className=`phase ${kind}`;phase.textContent=label}
  function setAnomaly(a){active=a;scene.dataset.anomaly=a==='none'?'none':a}
  function setFee(v){fee=Math.min(2000,Math.max(0,v));feeEl.textContent=`¥${fee.toLocaleString('ja-JP')}`;feeStat.classList.toggle('limit',fee>=1600)}
  function setTime(){
    const mins=Math.round((round/TOTAL)*(5*60+51))+2*60+9;const h=Math.min(8,Math.floor(mins/60)),m=mins%60;const s=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;gameTime.textContent=s;clock.textContent=s;
  }
  function showToast(text){toast.textContent=text;toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show')}
  function pulse(kind){flash.className=`flash ${kind}`;void flash.offsetWidth;setTimeout(()=>flash.className='flash',360)}
  function clearRoundTimer(){if(timer){clearTimeout(timer);timer=null}scan.classList.remove('run')}
  function revealTarget(){
    const target=anomalyInfo[active].target;if(target==='none') return;const btn=$(`.hotspot[data-target="${target}"]`);btn?.classList.add('reveal');setTimeout(()=>btn?.classList.remove('reveal'),900)
  }

  function beginRound(){
    clearRoundTimer();
    if(fee>=2000){return endGame(false)}
    if(round>=TOTAL){return endGame(true)}
    setTime();roundEl.textContent=`ROUND ${round+1} / ${TOTAL}`;state='look';setAnomaly('none');noneBtn.disabled=true;setPhase('look','記憶中');message.textContent='暗転前の景色を覚えてください';scene.classList.remove('flicker');
    timer=setTimeout(()=>doBlackout(),LOOK_MS);
  }
  function doBlackout(){
    state='blackout';blackout.classList.add('on');tone(72,.18,'sine',.28);setTimeout(()=>{
      active=sequence[round];setAnomaly(active);scene.classList.add('flicker');blackout.classList.remove('on');startFind();
    },BLACKOUT_MS);
  }
  function startFind(){
    state='find';noneBtn.disabled=false;setPhase(round>=6?'danger':'find',round>=6?'違和感を見つけろ':'探してください');message.textContent=round>=6?'何かがおかしい。早く見つけて。':'変わった場所をタップ';scan.classList.remove('run');void scan.offsetWidth;scan.classList.add('run');deadline=performance.now()+FIND_MS;timer=setTimeout(()=>miss(),FIND_MS);
  }
  function correct(){
    clearRoundTimer();state='result';pulse('ok');vibrate(28);tone(620,.08,'sine',.2);setPhase('look','確認');showToast('正解  +¥0');message.textContent=anomalyInfo[active].text;round++;
    timer=setTimeout(beginRound,fast?120:900);
  }
  function wrong(){
    if(state!=='find') return;setFee(fee+200);pulse('bad');vibrate([35,30,35]);tone(118,.13,'square',.22);showToast('誤タップ  +¥200');message.textContent='違う。料金が加算された。';
    if(fee>=2000){clearRoundTimer();setTimeout(()=>endGame(false),350)}
  }
  function miss(){
    if(state!=='find') return;clearRoundTimer();state='result';setFee(fee+400);pulse('bad');vibrate([55,45,55]);tone(92,.23,'sawtooth',.25);revealTarget();setPhase('danger','見逃し');message.textContent=`見逃し：${anomalyInfo[active].text}  +¥400`;showToast('見逃し  +¥400');round++;
    if(fee>=2000) timer=setTimeout(()=>endGame(false),fast?160:1200); else timer=setTimeout(beginRound,fast?160:1300);
  }
  function submit(target){
    if(state!=='find') return;
    if((active==='none'&&target==='none')||(active!=='none'&&anomalyInfo[active].target===target)) correct(); else wrong();
  }
  function endGame(success){
    clearRoundTimer();state='end';setTime();setAnomaly(success?'shadow':'shadow');scene.classList.add('flicker');
    const ending=$('#ending'),ey=$('#endEyebrow'),title=$('#endTitle'),text=$('#endText'),receipt=$('#receipt');
    if(success&&fee<2000){
      ey.textContent='08:00 / EXIT OPEN';title.textContent='精算できます。';text.textContent='ゲートが開いた。朝の車道が見える。料金は上限に届かなかった。';receipt.innerHTML=`<div>UNDERPASS PARKING / LOT 009</div><div>入庫　02:09</div><div>出庫　08:00</div><hr><div class="big"><span>合計</span><span>¥${fee.toLocaleString('ja-JP')}</span></div><hr><div>車両　1台</div><div class="red">同乗者　1名</div>`;tone(740,.08,'sine',.18);setTimeout(()=>tone(980,.12,'sine',.12),130);
    }else{
      ey.textContent='MAXIMUM CHARGE REACHED';title.textContent='最大料金です。';text.textContent='これ以上は請求されない。……ただし、出られるとは書いていない。';receipt.innerHTML=`<div>UNDERPASS PARKING / LOT 009</div><div>入庫　02:09</div><div>精算　不可</div><hr><div class="big"><span>合計</span><span class="red">¥2,000</span></div><hr><div class="red">ゲート：CLOSED</div><div class="red">駐車時間：24:00:00+</div>`;tone(60,.6,'sawtooth',.28);
    }
    ending.classList.remove('hidden');
  }
  function restart(){
    round=0;setFee(0);sequence=pickSequence();$('#ending').classList.add('hidden');setAnomaly('none');beginRound();
  }

  $$('.hotspot').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();submit(b.dataset.target)}));
  noneBtn.addEventListener('click',()=>submit('none'));
  $('#start').addEventListener('click',()=>{initAudio();audio?.resume?.();$('#intro').classList.add('hidden');round=0;setFee(0);beginRound()});
  $('#restart').addEventListener('click',restart);

  if(demo){
    $('#intro').classList.add('hidden');setAnomaly(anomalyInfo[demo]?demo:'none');state='demo';setPhase('find',`DEMO / ${demo}`);message.textContent=anomalyInfo[demo]?.text||'基準状態';roundEl.textContent='VISUAL QA';noneBtn.disabled=true;gameTime.textContent='02:09';clock.textContent='02:09';
  }
})();
