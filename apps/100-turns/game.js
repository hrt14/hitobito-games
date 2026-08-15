(() => {
  'use strict';

  const TURN_LIMIT = 100;
  const TURN_TIMEOUT_MS = 10000;

  const archetypes = [
    {
      icon:'📱', tag:'DISTRACTION', text:'少し疲れた。スマホを開くと、誰かの成功が流れてきた。',
      choices:[
        {label:'もう少し見る。自分も遅れていないか確認したい', kind:'eyes', delta:{body:-1}},
        {label:'閉じる。今日は自分の予定に戻る', kind:'agency', delta:{story:1}},
        {label:'そのままぼんやりする', kind:'drift', delta:{body:1}}
      ]
    },
    {
      icon:'💼', tag:'WORK', text:'仕事があと少しで区切れそう。でも、約束の時間も近い。',
      choices:[
        {label:'ここまで仕上げたいから、今日は残る', kind:'agency', delta:{money:2,body:-1}},
        {label:'評価が下がるのが怖いから、残る', kind:'eyes', delta:{money:1,body:-1}},
        {label:'約束へ向かう。続きは明日にする', kind:'bond', delta:{bond:2,money:-1}}
      ]
    },
    {
      icon:'☎️', tag:'PEOPLE', text:'しばらく話していない人の顔が、ふと浮かんだ。',
      choices:[
        {label:'今、連絡する', kind:'bond', delta:{bond:2,story:1}},
        {label:'落ち着いたら連絡しよう、と先送りする', kind:'drift', delta:{}},
        {label:'用事もないし迷惑かも、とやめる', kind:'eyes', delta:{}}
      ]
    },
    {
      icon:'🛋️', tag:'REST', text:'休日。予定を詰めれば有意義に見える。でも体は重い。',
      choices:[
        {label:'何もしない日を選ぶ。ちゃんと休む', kind:'rest', delta:{body:2}},
        {label:'予定を入れる。休んでいると思われたくない', kind:'eyes', delta:{body:-1}},
        {label:'気になっていた場所へ行く', kind:'story', delta:{story:2,body:-1,money:-1}}
      ]
    },
    {
      icon:'🎟️', tag:'CHANCE', text:'ずっと気になっていたイベント。今日申し込めば行ける。',
      choices:[
        {label:'行く。予定を空ける', kind:'story', delta:{story:2,money:-1}},
        {label:'もう少し比較してから決める', kind:'worry', delta:{}},
        {label:'今月は余白を守る', kind:'agency', delta:{money:1,body:1}}
      ]
    },
    {
      icon:'🧑‍🤝‍🧑', tag:'INVITE', text:'知人から誘いが来た。行けば楽しそう。でも本当は乗り気ではない。',
      choices:[
        {label:'断る。今夜は自分の時間にする', kind:'agency', delta:{body:1}},
        {label:'嫌われたくないので行く', kind:'eyes', delta:{body:-1,bond:1}},
        {label:'少しだけ顔を出す', kind:'bond', delta:{bond:1}}
      ]
    },
    {
      icon:'🧠', tag:'WORRY', text:'まだ起きていない失敗が、頭の中で何度も再生される。',
      choices:[
        {label:'もう少し考える。最悪のケースまで詰める', kind:'worry', delta:{body:-1}},
        {label:'できる準備を1つして、今日は終える', kind:'agency', delta:{story:1}},
        {label:'誰かに話して頭から出す', kind:'bond', delta:{bond:1,body:1}}
      ]
    },
    {
      icon:'🧳', tag:'TRIP', text:'行ってみたい場所がある。でも「いつか」で困ってはいない。',
      choices:[
        {label:'日付を決める', kind:'story', delta:{story:2,money:-2}},
        {label:'もう少し余裕ができたら、と保留する', kind:'drift', delta:{money:1}},
        {label:'今回は行かない。別の目的にお金を残す', kind:'agency', delta:{money:2}}
      ]
    },
    {
      icon:'💬', tag:'WORDS', text:'言いすぎたかもしれない。謝るなら早い方がいい。',
      choices:[
        {label:'短く謝る', kind:'bond', delta:{bond:2}},
        {label:'相手から来るまで待つ', kind:'eyes', delta:{}},
        {label:'言い訳を考える', kind:'worry', delta:{body:-1}}
      ]
    },
    {
      icon:'🌱', tag:'BEGIN', text:'やってみたいことがある。準備はまだ60点くらい。',
      choices:[
        {label:'小さく始める', kind:'story', delta:{story:2,money:-1}},
        {label:'失敗して見られるのが嫌なので、整える', kind:'eyes', delta:{}},
        {label:'今日は10分だけ試す', kind:'agency', delta:{story:1}}
      ]
    },
    {
      icon:'🛍️', tag:'MONEY', text:'欲しいものがある。買える。でも本当に欲しいのかは少し曖昧。',
      choices:[
        {label:'欲しい。買って使う', kind:'agency', delta:{money:-2,story:1}},
        {label:'みんな持っているので買う', kind:'eyes', delta:{money:-2}},
        {label:'今日は買わない', kind:'agency', delta:{money:2}}
      ]
    },
    {
      icon:'🌙', tag:'NIGHT', text:'もう眠い。けれど、今日を終えるのがもったいない気もする。',
      choices:[
        {label:'寝る。明日の自分に渡す', kind:'rest', delta:{body:2}},
        {label:'SNSをもう少し見る', kind:'drift', delta:{body:-1}},
        {label:'気になっていた本を少し読む', kind:'agency', delta:{story:1,body:-1}}
      ]
    },
    {
      icon:'🏆', tag:'COMPARE', text:'同年代の人が大きな成果を出した。自分の現在地が急に小さく見える。',
      choices:[
        {label:'自分も急いで何か始める', kind:'eyes', delta:{body:-1}},
        {label:'祝って、自分のペースに戻る', kind:'agency', delta:{bond:1}},
        {label:'悔しさを次の1歩に変える', kind:'story', delta:{story:1}}
      ]
    },
    {
      icon:'🏠', tag:'FAMILY', text:'家にいる人が「少し話さない？」と声をかけてきた。作業はまだ残っている。',
      choices:[
        {label:'10分だけ手を止める', kind:'bond', delta:{bond:2}},
        {label:'今は無理。作業を終える', kind:'agency', delta:{money:1}},
        {label:'忙しい人だと思われたいので、そのまま続ける', kind:'eyes', delta:{money:1,bond:-1}}
      ]
    },
    {
      icon:'🩺', tag:'BODY', text:'最近、体の小さな違和感が続いている。まだ動ける。',
      choices:[
        {label:'予定を空けて確認する', kind:'rest', delta:{body:2,money:-1}},
        {label:'忙しいので、そのうち', kind:'drift', delta:{body:-1,money:1}},
        {label:'周りも働いている。休みにくい', kind:'eyes', delta:{body:-2}}
      ]
    },
    {
      icon:'📚', tag:'LEARN', text:'気になっていることを学ぶ時間がほしい。成果になる保証はない。',
      choices:[
        {label:'1時間使う', kind:'story', delta:{story:2}},
        {label:'役に立つと証明できるまで保留する', kind:'worry', delta:{}},
        {label:'今は稼ぐ方を選ぶ', kind:'agency', delta:{money:2}}
      ]
    },
    {
      icon:'✉️', tag:'REQUEST', text:'頼まれごとが来た。できなくはない。でも今週の余白は少ない。',
      choices:[
        {label:'断る。今ある予定を守る', kind:'agency', delta:{body:1}},
        {label:'期待を裏切りたくないので受ける', kind:'eyes', delta:{body:-1,money:1}},
        {label:'条件を変えて引き受ける', kind:'agency', delta:{money:1,bond:1}}
      ]
    },
    {
      icon:'🎨', tag:'PLAY', text:'子どもの頃に好きだったことを、急にやりたくなった。',
      choices:[
        {label:'30分だけやる', kind:'story', delta:{story:2,body:1}},
        {label:'今さら上手くもならないのでやめる', kind:'eyes', delta:{}},
        {label:'写真だけ見て満足する', kind:'drift', delta:{}}
      ]
    },
    {
      icon:'🚪', tag:'CHANGE', text:'今の環境は安定している。でも、別の道も少し気になっている。',
      choices:[
        {label:'小さく情報を取りに行く', kind:'story', delta:{story:1}},
        {label:'失敗したと思われたくないので考えない', kind:'eyes', delta:{}},
        {label:'今の安定を、自分で選び直す', kind:'agency', delta:{money:1,body:1}}
      ]
    },
    {
      icon:'☕', tag:'MORNING', text:'朝に15分だけ余白ができた。',
      choices:[
        {label:'何もしないで外を見る', kind:'rest', delta:{body:1}},
        {label:'通知を全部確認する', kind:'drift', delta:{}},
        {label:'今日いちばんやりたいことを始める', kind:'agency', delta:{story:1}}
      ]
    },
    {
      icon:'🗣️', tag:'OPINION', text:'会議で自分の意見と違う流れになった。言わなくても仕事は進む。',
      choices:[
        {label:'短く自分の意見を言う', kind:'agency', delta:{story:1}},
        {label:'浮きたくないので合わせる', kind:'eyes', delta:{}},
        {label:'今回は任せる、と意識して黙る', kind:'agency', delta:{body:1}}
      ]
    },
    {
      icon:'🌧️', tag:'PLAN', text:'楽しみにしていた予定が急に消えた。ぽっかり時間が空いた。',
      choices:[
        {label:'代わりに、今やりたいことをする', kind:'story', delta:{story:1}},
        {label:'予定が崩れたことを引きずる', kind:'worry', delta:{body:-1}},
        {label:'休む日に変える', kind:'rest', delta:{body:2}}
      ]
    },
    {
      icon:'🧹', tag:'LET GO', text:'もう使っていないものや予定が、ずっと残っている。',
      choices:[
        {label:'1つ手放す', kind:'agency', delta:{body:1}},
        {label:'いつか必要かもしれない、と残す', kind:'worry', delta:{}},
        {label:'人からどう見えるか気になって残す', kind:'eyes', delta:{}}
      ]
    },
    {
      icon:'🎂', tag:'TIME', text:'またひとつ節目を迎えた。思っていたより早かった。',
      choices:[
        {label:'会いたい人と過ごす', kind:'bond', delta:{bond:2,story:1}},
        {label:'仕事を進める。今はそれを選びたい', kind:'agency', delta:{money:2}},
        {label:'年齢を気にして焦る', kind:'worry', delta:{body:-1}}
      ]
    },
    {
      icon:'🌅', tag:'TODAY', text:'今日は、特別な予定のない普通の日だ。',
      choices:[
        {label:'大事な人に一言送る', kind:'bond', delta:{bond:1}},
        {label:'やりたいことを1つ進める', kind:'agency', delta:{story:1}},
        {label:'なんとなく流れに任せる', kind:'drift', delta:{body:1}}
      ]
    }
  ];

  const phasePrefixes = [
    'まだ先は長い。',
    '忙しさが普通になってきた。',
    'できることが増えた。',
    '守りたいものも増えた。',
    '時間の速さを少し感じる。',
    '半分を使った。',
    '先送りしたものが目に入る。',
    '残りが数字として見えてきた。',
    '「いつか」が短くなってきた。',
    'もう、後回しの余白は少ない。'
  ];

  const milestoneCopy = {
    75:'25ターン使いました。\nまだ「残り75」ある。そう見えます。',
    50:'半分、使いました。\n使った50ターンは戻りません。',
    25:'残り25。\n「いつか」は、かなり小さくなりました。',
    10:'残り10。\nここで初めて捨てるものは、何ですか？',
    3:'残り3。\n最後まで、1ターンの値段は同じです。'
  };

  const state = {
    lap:1,
    turnIndex:0,
    remaining:TURN_LIMIT,
    money:5,
    bond:5,
    story:0,
    body:5,
    deck:[],
    firstChoices:[],
    secondChoices:[],
    timerId:null,
    timerStartedAt:0,
    locked:false,
    sound:true,
    milestonesShown:new Set(),
    seed:0
  };

  const $ = (id) => document.getElementById(id);
  const intro = $('intro');
  const game = $('game');
  const result = $('result');
  const startBtn = $('startBtn');
  const soundBtn = $('soundBtn');
  const choicesEl = $('choices');
  const remainingEl = $('remaining');
  const lifeLineFill = $('lifeLineFill');
  const sceneText = $('sceneText');
  const sceneIcon = $('sceneIcon');
  const sceneNo = $('sceneNo');
  const sceneTag = $('sceneTag');
  const phaseLabel = $('phaseLabel');
  const lapBadge = $('lapBadge');
  const previousHint = $('previousHint');
  const timerFill = $('timerFill');
  const turnToast = $('turnToast');
  const milestone = $('milestone');
  const milestoneNumber = $('milestoneNumber');
  const milestoneText = $('milestoneText');
  const milestoneBtn = $('milestoneBtn');
  const nextLapBtn = $('nextLapBtn');
  const restartBtn = $('restartBtn');

  function mulberry32(a){
    return function(){
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function buildDeck(seed){
    const rand = mulberry32(seed);
    const deck = [];
    for(let phase=0; phase<10; phase++){
      const pool = archetypes.map((item, index) => ({item,index}));
      for(let i=pool.length-1;i>0;i--){
        const j = Math.floor(rand()*(i+1));
        [pool[i],pool[j]]=[pool[j],pool[i]];
      }
      const picked = pool.slice(0,10);
      picked.forEach((entry,slot)=>{
        const base = entry.item;
        const choices = base.choices.map((choice,choiceIndex)=>({...choice, choiceIndex}));
        if(rand()>.5) choices.reverse();
        if(rand()>.78 && choices.length===3){
          const first = choices.shift();
          choices.push(first);
        }
        deck.push({
          ...base,
          choices,
          phase,
          phaseText:phasePrefixes[phase],
          id:`${phase}-${slot}-${entry.index}`
        });
      });
    }
    return deck;
  }

  function clampStat(value){ return Math.max(0,Math.min(20,value)); }

  function applyDelta(delta={}){
    state.money = clampStat(state.money + (delta.money||0));
    state.bond = clampStat(state.bond + (delta.bond||0));
    state.story = clampStat(state.story + (delta.story||0));
    state.body = clampStat(state.body + (delta.body||0));
  }

  function renderStats(){
    $('moneyStat').textContent = state.money;
    $('bondStat').textContent = state.bond;
    $('storyStat').textContent = state.story;
    $('bodyStat').textContent = state.body;
  }

  function beep(freq=240,duration=.05,volume=.035){
    if(!state.sound || !window.AudioContext) return;
    try{
      const ctx = beep.ctx || (beep.ctx = new AudioContext());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = volume;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
      osc.stop(ctx.currentTime+duration);
    }catch(_e){}
  }

  function startGame(){
    state.seed = Math.floor(Date.now()%2147483647);
    state.deck = buildDeck(state.seed);
    state.lap = 1;
    state.firstChoices = [];
    state.secondChoices = [];
    resetLapState();
    intro.classList.add('hidden');
    result.classList.add('hidden');
    game.classList.remove('hidden');
    document.body.classList.remove('second-lap','urgent');
    renderTurn();
  }

  function resetLapState(){
    state.turnIndex = 0;
    state.remaining = TURN_LIMIT;
    state.money = 5;
    state.bond = 5;
    state.story = 0;
    state.body = 5;
    state.locked = false;
    state.milestonesShown = new Set();
    clearTurnTimer();
    renderStats();
  }

  function renderTurn(){
    clearTurnTimer();
    state.locked = false;
    if(state.remaining<=0 || state.turnIndex>=TURN_LIMIT){
      finishLap();
      return;
    }

    const scene = state.deck[state.turnIndex];
    remainingEl.textContent = state.remaining;
    remainingEl.classList.toggle('low', state.remaining<=10);
    lifeLineFill.style.width = `${state.remaining}%`;
    sceneNo.textContent = `TURN ${String(state.turnIndex+1).padStart(3,'0')}`;
    sceneTag.textContent = scene.tag;
    sceneIcon.textContent = scene.icon;
    sceneText.textContent = state.lap===1 ? scene.text : `${scene.phaseText} ${scene.text}`;
    phaseLabel.textContent = state.lap===1 ? scene.phaseText : '前回と同じ100ターン。残り数も同じ。';
    lapBadge.textContent = `${state.lap}周目`;
    document.body.classList.toggle('urgent', state.remaining<=10);
    document.body.classList.toggle('second-lap', state.lap===2);

    choicesEl.innerHTML='';
    scene.choices.forEach((choice)=>{
      const btn = document.createElement('button');
      btn.className='choice';
      btn.type='button';
      const previous = state.lap===2 ? state.firstChoices[state.turnIndex] : null;
      const sameAsPrev = previous && previous.choiceIndex===choice.choiceIndex;
      btn.innerHTML = `${escapeHtml(choice.label)}${sameAsPrev?'<span class="ghost">前回</span>':''}`;
      btn.addEventListener('click',()=>choose(choice));
      choicesEl.appendChild(btn);
    });

    if(state.lap===2 && state.firstChoices[state.turnIndex]){
      previousHint.classList.remove('hidden');
      previousHint.textContent = `前回：${state.firstChoices[state.turnIndex].label}`;
    }else{
      previousHint.classList.add('hidden');
      previousHint.textContent='';
    }

    startTurnTimer();
  }

  function startTurnTimer(){
    state.timerStartedAt = performance.now();
    timerFill.style.transition='none';
    timerFill.style.width='100%';
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        timerFill.style.transition=`width ${TURN_TIMEOUT_MS}ms linear`;
        timerFill.style.width='0%';
      });
    });
    state.timerId = window.setTimeout(()=>{
      if(document.hidden){ startTurnTimer(); return; }
      timeoutTurn();
    },TURN_TIMEOUT_MS);
  }

  function clearTurnTimer(){
    if(state.timerId){ clearTimeout(state.timerId); state.timerId=null; }
  }

  function timeoutTurn(){
    if(state.locked) return;
    state.locked=true;
    commitTurn({label:'迷っているうちに、1ターン終わった',kind:'worry',choiceIndex:-1,delta:{body:-1}},true);
  }

  function choose(choice){
    if(state.locked) return;
    state.locked=true;
    clearTurnTimer();
    commitTurn(choice,false);
  }

  function commitTurn(choice,timedOut){
    applyDelta(choice.delta);
    const record = {
      turn:state.turnIndex,
      id:state.deck[state.turnIndex].id,
      label:choice.label,
      kind:choice.kind,
      choiceIndex:choice.choiceIndex,
      timedOut:!!timedOut
    };
    if(state.lap===1) state.firstChoices.push(record);
    else state.secondChoices.push(record);

    state.remaining -= 1;
    state.turnIndex += 1;
    renderStats();
    remainingEl.textContent=state.remaining;
    remainingEl.classList.remove('tick');
    void remainingEl.offsetWidth;
    remainingEl.classList.add('tick');
    lifeLineFill.style.width=`${Math.max(0,state.remaining)}%`;

    const toastText = timedOut ? '迷っていても、−1ターン' : '何をしても、−1ターン';
    showToast(toastText);
    beep(state.remaining<=10?165:250,.06,state.remaining<=10?.05:.025);

    window.setTimeout(()=>{
      if(state.remaining<=0){ finishLap(); return; }
      if(milestoneCopy[state.remaining] && !state.milestonesShown.has(state.remaining)){
        showMilestone(state.remaining);
      }else{
        renderTurn();
      }
    },300);
  }

  function showToast(text){
    turnToast.textContent=text;
    turnToast.classList.add('show');
    window.setTimeout(()=>turnToast.classList.remove('show'),650);
  }

  function showMilestone(value){
    state.milestonesShown.add(value);
    milestoneNumber.textContent=value;
    milestoneText.textContent=milestoneCopy[value];
    milestone.classList.remove('hidden');
  }

  function continueMilestone(){
    milestone.classList.add('hidden');
    renderTurn();
  }

  function summarize(records){
    const counts={agency:0,eyes:0,drift:0,worry:0,bond:0,story:0,rest:0};
    records.forEach(r=>{ if(counts[r.kind]!==undefined) counts[r.kind]++; });
    const autopilot=counts.eyes+counts.drift+counts.worry;
    const intentional=counts.agency+counts.bond+counts.story+counts.rest;
    const last10=records.slice(-10);
    const last10Intentional=last10.filter(r=>['agency','bond','story','rest'].includes(r.kind)).length;
    const first90=records.slice(0,90);
    const first90Intentional=first90.filter(r=>['agency','bond','story','rest'].includes(r.kind)).length;
    return {counts,autopilot,intentional,last10Intentional,first90Intentional};
  }

  function finishLap(){
    clearTurnTimer();
    game.classList.add('hidden');
    result.classList.remove('hidden');
    document.body.classList.remove('urgent');
    window.scrollTo(0,0);

    if(state.lap===1){ renderFirstResult(); }
    else{ renderSecondResult(); }
  }

  function renderFirstResult(){
    const s=summarize(state.firstChoices);
    $('resultKicker').textContent='1周目が終わった。';
    $('resultTitle').textContent='100ターン、なくなりました。';
    $('resultLead').textContent='仕事をしたターンも、休んだターンも、迷ったターンも、全部同じように残りを1つ使いました。ここでは人生の正解ではなく、配分だけを見ます。';
    $('resultHero').innerHTML=`<div class="hero-number">${s.autopilot}</div><div class="hero-caption">迷い・人の目・惰性で使ったターン</div>`;
    $('resultBreakdown').innerHTML=breakdownHtml(s);
    $('compareBlock').classList.add('hidden');
    $('compareBlock').innerHTML='';
    $('resultQuestion').textContent='残り10になってから、急に「どうでもいい」と思えたものはありましたか？';
    nextLapBtn.textContent='同じ100ターンを、もう一度生きる';
    nextLapBtn.classList.remove('hidden');
    restartBtn.classList.add('hidden');
  }

  function renderSecondResult(){
    const a=summarize(state.firstChoices);
    const b=summarize(state.secondChoices);
    const changed=state.secondChoices.reduce((sum,r,i)=>sum+(state.firstChoices[i]&&state.firstChoices[i].choiceIndex!==r.choiceIndex?1:0),0);
    $('resultKicker').textContent='2周目が終わった。';
    $('resultTitle').textContent='100ターン目から、変えられた。';
    $('resultLead').textContent='残り時間は1周目とまったく同じでした。変わったのは、残り10を知っているあなたの選び方です。';
    $('resultHero').innerHTML=`<div class="hero-number">${changed}</div><div class="hero-caption">前回と違う選択をしたターン / 100</div>`;
    $('resultBreakdown').innerHTML=breakdownHtml(b);
    const compare=$('compareBlock');
    compare.classList.remove('hidden');
    const better = b.autopilot < a.autopilot;
    compare.innerHTML=`
      <h3>1周目 → 2周目</h3>
      <div class="compare-row"><span>迷い・人の目・惰性</span><b>${a.autopilot}</b><span class="arrow">→</span><b>${b.autopilot}</b></div>
      <div class="compare-row"><span>自分で選んだターン</span><b>${a.intentional}</b><span class="arrow">→</span><b>${b.intentional}</b></div>
      <div class="compare-row"><span>最後の10ターンで意図的に選んだ</span><b>${a.last10Intentional}</b><span class="arrow">→</span><b>${b.last10Intentional}</b></div>
      <p class="compare-note">${better?'1周目で終盤になって手放したものを、2周目ではもっと早く手放せています。':'2周目も、同じように使ったターンがありました。それも含めて、あなたが選んだ配分です。'}</p>`;
    $('resultQuestion').textContent='残り10になって捨てたものを、残り100のときから捨てられましたか？';
    nextLapBtn.classList.add('hidden');
    restartBtn.classList.remove('hidden');
    try{
      localStorage.setItem('hundredTurnsLast',JSON.stringify({date:new Date().toISOString(),changed,first:a,second:b}));
    }catch(_e){}
  }

  function breakdownHtml(summary){
    const c=summary.counts;
    return `
      <div class="break-item"><span>自分で決めた</span><strong>${c.agency}</strong><small>守る・進む・やめるを自分で選んだ</small></div>
      <div class="break-item"><span>人・物語・休息</span><strong>${c.bond+c.story+c.rest}</strong><small>つながる / 経験する / 休む</small></div>
      <div class="break-item"><span>人の目</span><strong>${c.eyes}</strong><small>評価や比較への反応で使った</small></div>
      <div class="break-item"><span>迷い・惰性</span><strong>${c.worry+c.drift}</strong><small>決めきれない / なんとなくで使った</small></div>`;
  }

  function startSecondLap(){
    state.lap=2;
    resetLapState();
    result.classList.add('hidden');
    game.classList.remove('hidden');
    document.body.classList.add('second-lap');
    renderTurn();
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>'"]/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
    }[ch]));
  }

  startBtn.addEventListener('click',startGame);
  milestoneBtn.addEventListener('click',continueMilestone);
  nextLapBtn.addEventListener('click',startSecondLap);
  restartBtn.addEventListener('click',()=>{
    result.classList.add('hidden');
    intro.classList.remove('hidden');
    document.body.classList.remove('second-lap','urgent');
  });
  soundBtn.addEventListener('click',()=>{
    state.sound=!state.sound;
    soundBtn.textContent=state.sound?'♪':'×';
    soundBtn.setAttribute('aria-label',state.sound?'音をオフにする':'音をオンにする');
    beep(320,.04,.025);
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) clearTurnTimer();
    else if(!game.classList.contains('hidden')&&!milestone.classList.contains('hidden')) clearTurnTimer();
    else if(!game.classList.contains('hidden')&&!state.locked) startTurnTimer();
  });
})();
