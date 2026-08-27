(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const state = { node:'opening', offer:100, refusals:0, accepted:new Set(), turns:0, holdTarget:3, holdTimer:null, holdStartedAt:0 };

  const nodes = {
    opening:{offer:100,technique:'OPENING OFFER',message:'今日の交渉です。<br><strong>今夜、もう寝ませんか？</strong>',choices:[
      {label:'はい。もう寝る',kind:'accept',go:'finishNow'},
      {label:'まだやることがある',reason:'work',go:'workClose'},
      {label:'全然眠くない',reason:'awake',go:'dimLight'}]},
    workClose:{offer:36,technique:'REQUEST SHRINK',message:'了解。全部投げろとは言いません。<br><strong>「今日はここまで」にするだけなら？</strong>',choices:[
      {label:'ここまでにする',kind:'accept',action:'work',go:'dimLight'},
      {label:'いや、あと1個だけある',reason:'oneMore',go:'tomorrowOne'},
      {label:'締切が近いから無理',reason:'deadline',go:'dimWhileWorking'}]},
    tomorrowOne:{offer:22,technique:'FOOT IN THE DOOR',message:'その「あと1個」、消さなくていい。<br><strong>明日の最初の1個に回すだけなら？</strong>',choices:[
      {label:'それなら回す',kind:'accept',action:'work',go:'dimLight'},
      {label:'忘れそうで無理',reason:'forget',go:'sayIt'},
      {label:'今やった方が早い',reason:'fast',go:'dimWhileWorking'}]},
    sayIt:{offer:14,technique:'MICRO COMMITMENT',message:'書かなくていいです。<br><strong>「明日の最初はこれ」と1回だけ声に出す。それだけなら？</strong>',choices:[
      {label:'言った。今日はここまで',kind:'accept',action:'work',go:'dimLight'},
      {label:'声に出すのは嫌',reason:'voice',go:'dimWhileWorking'},
      {label:'まだ決めたくない',reason:'decide',go:'dimWhileWorking'}]},
    dimWhileWorking:{offer:17,technique:'SIDE DEAL',message:'仕事を止めろ、は撤回します。<br><strong>続けるとしても、照明を1段だけ暗くする？</strong>',choices:[
      {label:'1段だけ暗くする',kind:'accept',action:'light',go:'phoneCharge'},
      {label:'暗いと作業できない',reason:'bright',go:'phoneCharge'},
      {label:'今のままがいい',reason:'same',go:'faceDown'}]},
    dimLight:{offer:32,technique:'LOWER THE ASK',message:'眠くなくていいです。寝なくてもいい。<br><strong>照明を1段だけ暗くする？</strong>',choices:[
      {label:'1段だけ暗くする',kind:'accept',action:'light',go:'phoneCharge'},
      {label:'まだ明るくしていたい',reason:'bright',go:'phoneCharge'},
      {label:'まだスマホを見る',reason:'scroll',go:'phoneCharge'}]},
    phoneCharge:{offer:20,technique:'SMALL YES',message:'寝る話はしてません。<br><strong>スマホを充電器につなぐだけなら？</strong>',choices:[
      {label:'充電器につなぐ',kind:'accept',action:'phone',go:'lieDown'},
      {label:'まだ手元で見る',reason:'scroll',go:'faceDown'},
      {label:'充電は十分ある',reason:'battery',go:'faceDown'}]},
    faceDown:{offer:10,technique:'EVEN SMALLER',message:'充電しなくていい。遠くにも置かなくていい。<br><strong>画面を伏せて、10秒だけ触らない？</strong>',choices:[
      {label:'10秒だけなら',kind:'accept',action:'phone',go:'lieDown'},
      {label:'10秒も嫌',reason:'tenSec',go:'threeSecPhone'},
      {label:'通知が気になる',reason:'notify',go:'threeSecPhone'}]},
    threeSecPhone:{offer:6,technique:'MINIMUM VIABLE YES',message:'わかりました。10秒は撤回。<br><strong>3秒だけ、画面から指を離す。なら？</strong>',choices:[
      {label:'3秒ならできる',kind:'accept',action:'phone',go:'lieDown'},
      {label:'今はそれも嫌',reason:'noTouch',go:'lieDown'},
      {label:'寝る話に戻ってない？',reason:'caught',go:'lieDown'}]},
    lieDown:{offer:12,technique:'NO-SLEEP DEAL',message:'はい。まだ「寝る」とは言ってません。<br><strong>寝なくていいから、横になるだけなら？</strong>',choices:[
      {label:'横になるだけ',kind:'accept',action:'body',go:'eyesDeal'},
      {label:'まだ座っていたい',reason:'sit',go:'leanBack'},
      {label:'寝る準備ができてない',reason:'prep',go:'prepDeal'}]},
    leanBack:{offer:7,technique:'HALF STEP',message:'横になるのも撤回。<br><strong>背もたれか壁に体重を預けるだけなら？</strong>',choices:[
      {label:'それだけなら',kind:'accept',action:'body',go:'eyesDeal'},
      {label:'まだ動きたくない',reason:'move',go:'eyesDeal'},
      {label:'このまま続けたい',reason:'continue',go:'eyesDeal'}]},
    prepDeal:{offer:8,technique:'ONE THING ONLY',message:'全部の寝る準備はいりません。<br><strong>いちばん小さい準備を1個だけ済ませる？</strong>',choices:[
      {label:'1個だけ済ませる',kind:'accept',action:'body',go:'eyesDeal'},
      {label:'今は何もしたくない',reason:'nothing',go:'eyesDeal'},
      {label:'あとでまとめてやる',reason:'later',go:'eyesDeal'}]},
    eyesDeal:{offer:3,technique:'3-SECOND DEAL',message:'最後です。寝なくていい。<br><strong>3秒だけ目を閉じる。開けたければ開けていい。</strong>',special:'hold',choices:[]}
  };

  const actionLabels = {
    work:'今日の作業を「ここまで」に寄せた',
    light:'明るさを1段、寝る側へ寄せた',
    phone:'スマホとの距離を少し作った',
    body:'体勢を休む側へ寄せた',
    eyes:'3秒、目を閉じた'
  };

  function showScreen(id){
    screens.forEach((screen)=>screen.classList.toggle('active',screen.id===id));
    document.querySelector('.topbar').classList.toggle('blackout',id==='blackoutScreen');
    window.scrollTo(0,0);
  }
  function updateRoom(){
    const items=[['work','workState','明日へ'],['light','lightState','暗め'],['phone','phoneState','離した'],['body','bodyState','休む側']];
    const before={work:'継続中',light:'明るい',phone:'手元',body:'起きてる'};
    items.forEach(([key,id,doneText])=>{const item=document.querySelector(`[data-state="${key}"]`);const done=state.accepted.has(key);item.classList.toggle('done',done);$(id).textContent=done?doneText:before[key];});
    $('room').classList.toggle('sleepier',state.accepted.size>=3);
  }
  function setOffer(value){state.offer=value;$('offerSize').textContent=`${value}%`;$('shrinkBar').style.width=`${Math.max(3,value)}%`;}
  function renderNode(name){
    state.node=name;state.turns+=1;const node=nodes[name];if(!node)return finish(false);
    setOffer(node.offer);$('refusalCount').textContent=String(state.refusals);$('techniqueLabel').textContent=node.technique;$('message').innerHTML=node.message;updateRoom();
    $('negotiatorCard').classList.remove('bump');requestAnimationFrame(()=>$('negotiatorCard').classList.add('bump'));setTimeout(()=>$('negotiatorCard').classList.remove('bump'),180);
    if(node.special==='hold'){setTimeout(()=>openHold(3),260);return;}
    $('choices').innerHTML='';
    node.choices.forEach((choice,index)=>{const button=document.createElement('button');button.type='button';button.className=`choice ${choice.kind==='accept'?'accept':''}`;button.textContent=choice.label;button.dataset.choice=String(index);button.addEventListener('click',()=>choose(choice));$('choices').appendChild(button);});
  }
  function choose(choice){
    if(choice.go==='finishNow'){state.accepted.add('body');toast('最短で成立しました。');finish(true);return;}
    if(choice.kind==='accept'){if(choice.action){state.accepted.add(choice.action);toast(actionLabels[choice.action]);}}
    else{state.refusals+=1;$('refusalCount').textContent=String(state.refusals);}
    setTimeout(()=>renderNode(choice.go),170);
  }
  function openHold(seconds){state.holdTarget=seconds;$('holdTitle').innerHTML=`${seconds}秒だけ、<br>目を閉じる。`;$('holdCopy').textContent=seconds===3?'寝なくていい。開けたければ、すぐ開けていい。':'3秒も撤回。1秒だけで交渉を終わらせます。';$('holdSeconds').textContent=String(seconds);$('holdRing').style.setProperty('--hold-progress','0deg');showScreen('holdScreen');}
  function startHold(event){
    if(event)event.preventDefault();if(state.holdTimer)return;state.holdStartedAt=performance.now();$('holdScreen').classList.add('is-holding');const duration=state.holdTarget*1000;
    const tick=()=>{const elapsed=performance.now()-state.holdStartedAt;const progress=Math.min(1,elapsed/duration);$('holdRing').style.setProperty('--hold-progress',`${progress*360}deg`);$('holdSeconds').textContent=String(Math.max(0,Math.ceil((duration-elapsed)/1000)));if(progress>=1){state.holdTimer=null;completeHold();return;}state.holdTimer=requestAnimationFrame(tick);};
    state.holdTimer=requestAnimationFrame(tick);
  }
  function cancelHold(){if(!state.holdTimer)return;cancelAnimationFrame(state.holdTimer);state.holdTimer=null;$('holdScreen').classList.remove('is-holding');$('holdRing').style.setProperty('--hold-progress','0deg');$('holdSeconds').textContent=String(state.holdTarget);}
  function completeHold(){$('holdScreen').classList.remove('is-holding');state.accepted.add('eyes');toast(`${state.holdTarget}秒、成立。`);setTimeout(()=>finish(true),420);}
  function refuseHold(){state.refusals+=1;if(state.holdTarget>1){openHold(1);toast('了解。さらに条件を下げました。');}else finish(false);}
  function finish(succeeded){
    const lastOffer=state.accepted.has('eyes')?state.holdTarget:Math.min(state.offer,6);$('finalOffer').textContent=`${lastOffer}%`;$('resultRefusals').textContent=String(state.refusals);
    const done=[...state.accepted].filter((key)=>actionLabels[key]);$('doneList').innerHTML=done.length?done.map((key)=>`<div class="done-pill"><b>✓</b> ${actionLabels[key]}</div>`).join(''):'<div class="done-pill">大きな決断はしなくていい、と確認した。</div>';
    if(!succeeded){$('resultTitle').innerHTML='今日は、<br><em>不成立。</em>';$('resultLead').textContent='それでOKです。寝るかどうかはあなたが決める。交渉はここで打ち切ります。';$('lightsOutBtn').querySelector('span').textContent='それでも画面を閉じる';}
    else{$('resultTitle').innerHTML='交渉、<br><em>成立。</em>';$('resultLead').textContent='「寝る」と大きく決める代わりに、寝られる形まで要求を小さくしました。';$('lightsOutBtn').querySelector('span').textContent='このまま画面を閉じる';}
    const record={at:Date.now(),refusals:state.refusals,accepted:done,succeeded,finalOffer:lastOffer};try{localStorage.setItem('negotiator-sleep:last',JSON.stringify(record));}catch{}showScreen('resultScreen');
  }
  function reset(){state.node='opening';state.offer=100;state.refusals=0;state.accepted=new Set();state.turns=0;state.holdTarget=3;cancelHold();$('techniques').hidden=true;$('techniquesBtn').textContent='何をされた？';showScreen('dealScreen');renderNode('opening');}
  function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1400);}
  function loadPrevious(){try{const raw=localStorage.getItem('negotiator-sleep:last');if(!raw)return;const last=JSON.parse(raw);const date=new Date(last.at);const label=Number.isFinite(date.getTime())?`${date.getMonth()+1}/${date.getDate()}`:'前回';$('previous').hidden=false;$('previous').innerHTML=`<b>${label}の交渉</b><br>${last.refusals}回断って、要求は ${last.finalOffer}% まで縮みました。`;}catch{}}

  $('startBtn').addEventListener('click',reset);$('againBtn').addEventListener('click',reset);$('exitBtn').addEventListener('click',()=>{if(!$('blackoutScreen').classList.contains('active'))location.href='/';});$('lightsOutBtn').addEventListener('click',()=>showScreen('blackoutScreen'));$('wakeLink').addEventListener('click',()=>showScreen('resultScreen'));
  $('techniquesBtn').addEventListener('click',()=>{const box=$('techniques');box.hidden=!box.hidden;$('techniquesBtn').textContent=box.hidden?'何をされた？':'閉じる';});
  $('holdBtn').addEventListener('pointerdown',startHold);['pointerup','pointercancel','pointerleave'].forEach((eventName)=>$('holdBtn').addEventListener(eventName,cancelHold));$('holdRefuseBtn').addEventListener('click',refuseHold);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelHold();});
  loadPrevious();showScreen('startScreen');
})();
