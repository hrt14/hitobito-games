(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const screens = $$('.screen');
  const els = {
    hud: $('#hud'), combo: $('#combo'), score: $('#score'), stage: $('#stageLabel'), progress: $('#progressBar'),
    controlBar: $('#controlBar'), controlValue: $('#controlValue'), intro: $('#introScreen'), play: $('#playScreen'),
    boss: $('#bossScreen'), action: $('#actionScreen'), result: $('#resultScreen'), card: $('#problemCard'),
    qType: $('#questionType'), qText: $('#questionText'), qHint: $('#questionHint'), context: $('#contextLabel'), timer: $('#timerBar'),
    choices: $('#choices'), burst: $('#burst'), microcopy: $('#microcopy'), bossTitle: $('#bossTitle'), bossMass: $('#bossMass'),
    fragments: $('#fragments'), bossRemain: $('#bossRemain'), bossAction: $('#bossAction'), actionBefore: $('#actionBefore'),
    actionText: $('#actionText'), accuracy: $('#accuracy'), avgTime: $('#avgTime'), maxCombo: $('#maxCombo'), grade: $('#grade'),
    insight: $('#insight'), toast: $('#toast')
  };

  const questions = [
    {t:'明日、雨が降る',a:'out',c:'日常',e:'天気は操作できない。傘を持つかは操作できる。'},
    {t:'今から傘を持っていく',a:'control',c:'日常',e:'自分の準備は直接動かせる。'},
    {t:'電車が5分遅れている',a:'out',c:'日常',e:'遅延そのものは変えられない。'},
    {t:'別ルートを調べる',a:'control',c:'日常',e:'次の行動は自分で選べる。'},
    {t:'昨日の失敗',a:'out',c:'過去',e:'起きた事実は戻せない。'},
    {t:'失敗の原因を1つ書き出す',a:'control',c:'過去',e:'過去は変えられなくても、扱い方は変えられる。'},
    {t:'相手から返信が来るか',a:'out',c:'人間関係',e:'返信するかどうかは相手の行動。'},
    {t:'必要事項をもう一度送る',a:'control',c:'人間関係',e:'自分から伝えることはできる。'},
    {t:'上司の機嫌',a:'out',c:'仕事',e:'他人の感情を直接操作することはできない。'},
    {t:'会議前に要点を3つ準備する',a:'control',c:'仕事',e:'準備は完全に自分の範囲。'},
    {t:'試験に合格する',a:'influence',c:'未来',e:'結果は保証できない。でも大きく影響はできる。'},
    {t:'今日30分勉強する',a:'control',c:'未来',e:'今の行動は直接選べる。'},
    {t:'商品が売れる',a:'influence',c:'仕事',e:'購入は顧客が決める。こちらは確率を上げられる。'},
    {t:'商品ページの1枚目を変える',a:'control',c:'仕事',e:'施策は直接操作できる。'},
    {t:'景気が良くなる',a:'out',c:'仕事',e:'景気そのものは自分の操作範囲外。'},
    {t:'広告予算を配分し直す',a:'control',c:'仕事',e:'自分の意思決定で変えられる。'},
    {t:'相手に自分を好きになってもらう',a:'influence',c:'人間関係',e:'好意は相手のもの。ただし接し方で影響はできる。'},
    {t:'相手の話を最後まで聞く',a:'control',c:'人間関係',e:'自分の聞き方は選べる。'},
    {t:'子どもが勉強する気になる',a:'influence',c:'家族',e:'本人の気持ちは操作できないが、環境で影響できる。'},
    {t:'机の上を片付ける',a:'control',c:'家族',e:'環境を整える行動は直接できる。'},
    {t:'競合が値下げする',a:'out',c:'仕事',e:'競合の意思決定は競合のもの。'},
    {t:'自社の価格を見直す',a:'control',c:'仕事',e:'自社の選択は動かせる。'},
    {t:'SNSで批判されない',a:'influence',c:'人間関係',e:'他人の投稿は止められない。発信の仕方で確率は変わる。'},
    {t:'批判への返信を一晩置く',a:'control',c:'人間関係',e:'返信のタイミングは自分で選べる。'},
    {t:'明日の商談が成功する',a:'influence',c:'仕事',e:'結果は相手も決める。準備で確率は変えられる。'},
    {t:'商談の想定質問を5つ作る',a:'control',c:'仕事',e:'準備は直接コントロールできる。'},
    {t:'自分の年齢',a:'out',c:'自分',e:'年齢は戻せない。'},
    {t:'今夜何時に寝るか',a:'control',c:'自分',e:'自分の選択として扱える。'},
    {t:'面接官に高く評価される',a:'influence',c:'未来',e:'評価は相手が決める。ただし材料は作れる。'},
    {t:'実績を数字で整理する',a:'control',c:'未来',e:'自分が提示する材料は変えられる。'},
    {t:'飛行機が欠航する',a:'out',c:'日常',e:'運航判断は操作できない。'},
    {t:'代替便を調べる',a:'control',c:'日常',e:'次の対応は選べる。'},
    {t:'チーム全員が賛成する',a:'influence',c:'仕事',e:'他人の賛否は直接は変えられない。'},
    {t:'反対理由を聞く',a:'control',c:'仕事',e:'聞くという行動は自分の範囲。'},
    {t:'昔言ってしまった一言',a:'out',c:'過去',e:'発言した事実は消せない。'},
    {t:'今から謝る',a:'control',c:'過去',e:'今の行動は選べる。'},
    {t:'新商品がヒットする',a:'influence',c:'未来',e:'市場が決める部分がある。こちらは確率を上げられる。'},
    {t:'まず10人に売って反応を見る',a:'control',c:'未来',e:'小さな実験は直接できる。'},
    {t:'渋滞がなくなる',a:'out',c:'日常',e:'道路全体は操作できない。'},
    {t:'10分早く家を出る',a:'control',c:'日常',e:'自分の出発時刻は変えられる。'},
    {t:'部下がミスをしない',a:'influence',c:'仕事',e:'他人の行動は完全には制御できない。仕組みで影響はできる。'},
    {t:'チェックリストを作る',a:'control',c:'仕事',e:'仕組みは直接作れる。'},
    {t:'顧客が怒っている',a:'out',c:'仕事',e:'今ある感情そのものは操作できない。'},
    {t:'事実関係を確認して説明する',a:'control',c:'仕事',e:'自分の対応は選べる。'},
    {t:'一年後も今の会社にいる',a:'influence',c:'未来',e:'外部要因もあるが、自分の選択で大きく動く。'},
    {t:'求人を3件見る',a:'control',c:'未来',e:'今日の小さな行動は直接できる。'},
    {t:'相手が約束を守る',a:'influence',c:'人間関係',e:'約束は相手の行動。ただし確認で影響はできる。'},
    {t:'期限を文章で確認する',a:'control',c:'人間関係',e:'認識合わせは自分からできる。'}
  ];

  const bosses = [
    {title:'会社で評価されない',action:'評価基準を上司に確認する',parts:[
      ['上司の価値観','out'],['過去の評価','out'],['同僚の成果','out'],['評価される結果','influence'],
      ['自分の成果','control'],['成果の見せ方','control'],['評価基準を聞く','control'],['転職先を探す','control']
    ]},
    {title:'新商品が売れるか不安',action:'今日、10人に見せて反応を取る',parts:[
      ['市場全体の景気','out'],['競合の新商品','out'],['顧客が買うか','influence'],['口コミが広がるか','influence'],
      ['価格','control'],['1枚目の画像','control'],['広告','control'],['10人に試す','control']
    ]},
    {title:'嫌われたかもしれない',action:'必要なことを一度だけ丁寧に伝える',parts:[
      ['相手の気分','out'],['既読になった事実','out'],['相手がどう解釈するか','influence'],['関係が続くか','influence'],
      ['自分の言葉','control'],['謝るか','control'],['確認するか','control'],['一度距離を置く','control']
    ]}
  ];

  let state = {};
  let timerRaf = null;
  let locked = false;
  let audio = null;

  function resetState(){
    state = {index:0,score:0,combo:0,maxCombo:0,correct:0,answered:0,times:[],deck:shuffle([...questions]).slice(0,30),three:false,bossIndex:0,bossModeOnly:false,bossesSeen:{}};
    renderHud();
  }

  function shuffle(a){
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }

  function show(screen){
    screens.forEach(s=>s.classList.remove('active'));
    screen.classList.add('active');
  }

  function tone(freq=440,dur=.06,type='sine',gain=.035){
    try{
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      const o=audio.createOscillator(),g=audio.createGain();
      o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+dur);o.stop(audio.currentTime+dur);
    }catch(e){}
  }

  function renderHud(){
    els.combo.textContent=state.combo||0;els.score.textContent=(state.score||0).toLocaleString();
    const total=state.deck?.length||30; const idx=state.index||0;
    els.progress.style.width=`${Math.min(100,idx/total*100)}%`;
    const rate=state.answered?Math.round(state.correct/state.answered*100):0;
    els.controlBar.style.width=`${rate}%`;els.controlValue.textContent=`${rate}%`;
    els.stage.textContent=`DAILY / ${String(Math.min(idx+1,total)).padStart(2,'0')}`;
  }

  function startGame(){
    resetState(); state.bossModeOnly=false; els.hud.hidden=false; show(els.play); nextQuestion();
  }

  function nextQuestion(){
    cancelAnimationFrame(timerRaf); locked=false;
    if(state.index>=state.deck.length){ return finish(); }
    if((state.index===10 || state.index===20) && !state.bossesSeen[state.index]){ state.bossesSeen[state.index]=true; return startBoss(Math.floor(state.index/10)-1); }
    state.three=state.index>=10;
    els.choices.className=`choices ${state.three?'three':'two'}`;
    els.microcopy.textContent=state.three?'OUT / INFLUENCE / CONTROL を選べ':'左右どちらかをタップ';
    const q=state.deck[state.index];
    els.context.textContent=q.c; els.qText.textContent=q.t; els.qType.textContent=state.three?'どこまで動かせる？':'これは変えられる？'; els.qHint.textContent=state.index<3?'直感で選べ。':'3秒で切り分けろ。';
    els.card.className='problem-card';
    renderHud();
    startTimer();
  }

  function startTimer(){
    const started=performance.now(), limit=4200;
    els.timer.style.transform='scaleX(1)';
    const tick=(now)=>{
      const p=Math.max(0,1-(now-started)/limit);els.timer.style.transform=`scaleX(${p})`;
      if(p>0&&!locked){timerRaf=requestAnimationFrame(tick);}else if(!locked){answer('timeout',started);}
    };
    els.card.dataset.started=String(started);timerRaf=requestAnimationFrame(tick);
  }

  function answer(choice, forcedStart){
    if(locked)return;locked=true;cancelAnimationFrame(timerRaf);
    const q=state.deck[state.index];const expected=(!state.three&&q.a==='influence')?'out':q.a;const started=forcedStart||Number(els.card.dataset.started);const dt=(performance.now()-started)/1000;
    state.times.push(Math.min(dt,4.2));state.answered++;
    const ok=choice===expected;
    if(ok){
      state.correct++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);
      const speed=Math.max(0,Math.round((3-dt)*70));const gain=100+speed+Math.min(300,state.combo*10);state.score+=gain;
      els.card.classList.add('correct');burst(state.combo>=5?`CONTROL ×${state.combo}`:'CORRECT',true);tone(620+Math.min(state.combo,10)*20,.07,'triangle',.045);
    }else{
      state.combo=0;els.card.classList.add('wrong');burst(choice==='timeout'?'TIME':'違う',false);tone(150,.12,'sawtooth',.025);toast(q.e);
    }
    renderHud();
    setTimeout(()=>{
      els.card.classList.add(expected==='control'?'fly-control':expected==='influence'?'fly-up':'fly-out');
      setTimeout(()=>{state.index++;nextQuestion();},230);
    },ok?330:850);
  }

  function burst(text,good){els.burst.textContent=text;els.burst.className=`burst show ${good?'good':'bad'}`;setTimeout(()=>els.burst.className='burst',600);}
  function toast(text){els.toast.textContent=text;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),1700);}

  function startBoss(idx=0, only=false){
    cancelAnimationFrame(timerRaf); locked=true; state.bossModeOnly=only||state.bossModeOnly; state.bossIndex=idx%bosses.length;
    const boss=bosses[state.bossIndex];show(els.boss);els.hud.hidden=false;els.bossTitle.textContent=boss.title;els.bossMass.style.transform='scale(1)';els.bossMass.style.opacity='1';
    els.fragments.innerHTML=''; els.bossRemain.textContent=`残り ${boss.parts.length}`;els.bossAction.textContent='CONTROL 0';
    let done=0, controls=0;
    boss.parts.forEach((part,i)=>{
      const b=document.createElement('button');b.className='fragment';b.style.animationDelay=`${i*.045}s`;b.innerHTML=`${part[0]}<small>タップして判定</small>`;
      b.addEventListener('click',()=>{
        if(b.disabled)return;b.disabled=true;done++;
        if(part[1]==='control'){
          controls++;b.classList.add('kept');b.querySelector('small').textContent='CONTROL / 残す';tone(690,.06,'triangle',.04);
        }else if(part[1]==='influence'){
          b.classList.add('out');b.querySelector('small').textContent='INFLUENCE / 直接は動かせない';tone(420,.05,'sine',.025);setTimeout(()=>b.style.visibility='hidden',420);
        }else{
          b.classList.add('out');b.querySelector('small').textContent='OUT / 手放す';tone(240,.05,'sine',.02);setTimeout(()=>b.style.visibility='hidden',420);
        }
        const remain=boss.parts.length-done;els.bossRemain.textContent=`残り ${remain}`;els.bossAction.textContent=`CONTROL ${controls}`;
        const scale=Math.max(.28,1-done/boss.parts.length*.68);els.bossMass.style.transform=`scale(${scale})`;
        if(done===boss.parts.length){setTimeout(()=>showAction(boss),650);}
      });els.fragments.appendChild(b);
    });
  }

  function showAction(boss){
    els.actionBefore.textContent=boss.title;els.actionText.textContent=boss.action;show(els.action);tone(780,.16,'triangle',.05);setTimeout(()=>tone(980,.18,'triangle',.035),100);
  }

  function continueAfterAction(){
    if(state.bossModeOnly){els.hud.hidden=true;show(els.intro);state.bossModeOnly=false;return;}
    state.score+=600;renderHud();show(els.play);locked=false;nextQuestion();
  }

  function finish(){
    els.hud.hidden=true;show(els.result);const acc=state.answered?state.correct/state.answered:0;const avg=state.times.length?state.times.reduce((a,b)=>a+b,0)/state.times.length:0;
    const grade=acc>=.93&&avg<1.8?'S':acc>=.85?'A':acc>=.72?'B':'C';
    els.accuracy.textContent=`${Math.round(acc*100)}%`;els.avgTime.textContent=`${avg.toFixed(1)}s`;els.maxCombo.textContent=state.maxCombo;els.grade.textContent=grade;
    const missed=state.answered-state.correct;
    els.insight.innerHTML=acc>=.9?`<b>かなり速い。</b> 「結果」より「自分の次の行動」へ意識を戻せている。現実でも悩みが出たら、まず CONTROL を1枚だけ探そう。`:acc>=.75?`<b>あと少し。</b> ${missed}問で、結果や他人の反応まで自分の CONTROL に入れかけた。結果は動かすものではなく、<b>影響するもの</b>として切り分けると軽くなる。`:`<b>伸びしろあり。</b> 変えられないものを手放すのも成功行動。まず「過去・他人の感情・結果」を OUT に出す反射から鍛えよう。`;
    try{localStorage.setItem('levelup-control-best',JSON.stringify({acc,avg,max:state.maxCombo,date:Date.now()}));}catch(e){}
  }

  $$('.choice').forEach(b=>b.addEventListener('click',()=>answer(b.dataset.answer)));
  $('#startBtn').addEventListener('click',startGame);
  $('#retryBtn').addEventListener('click',startGame);
  $('#bossDemoBtn').addEventListener('click',()=>{resetState();state.bossModeOnly=true;els.hud.hidden=false;startBoss(0,true);});
  $('#actionContinue').addEventListener('click',continueAfterAction);

  window.addEventListener('keydown',(e)=>{
    if(!els.play.classList.contains('active'))return;
    if(e.key==='ArrowLeft')answer('out'); if(e.key==='ArrowRight')answer('control'); if(e.key==='ArrowUp'&&state.three)answer('influence');
  });
})();
