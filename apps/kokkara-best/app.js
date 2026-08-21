(() => {
  'use strict';

  const SLUG = 'kokkara-best';
  const STORAGE_KEY = 'levelup:kokkara-best:v1';
  const WAVES_PER_RUN = 7;

  const chains = [
    [
      {tier:1,title:'商談前。電車が止まった。',detail:'開始には30分ほど遅れそう。焦っても電車は動かない。',fixed:'30分の遅延はもう発生した',remaining:'連絡・オンライン切替・移動中の準備',choices:[
        ['今日はもうダメだ、と商談自体を諦める','abandon','状況まで失敗に確定しなくていい。'],
        ['遅れる連絡だけ入れて、ずっと到着時刻を気にする','partial','連絡は必要。ただし残り時間はまだ使える。'],
        ['即連絡し、オンライン切替を提案。移動中に論点を3つへ絞る','best','失った30分ではなく、残った手段を使えている。'] ]},
      {tier:2,title:'オンラインに切替えた。充電8%。',detail:'電源席は空いていない。商談開始まであと6分。',fixed:'バッテリー残量は8%',remaining:'低電力化・資料共有・スマホ・相手への一言',choices:[
        ['PCが落ちないことを祈って、そのまま始める','partial','進める判断は悪くないが、バックアップを作れる。'],
        ['資料を先に共有し、スマホ接続も準備してから開始する','best','故障を消せなくても、失敗時の出口は増やせる。'],
        ['もう不運すぎるので今日は無理だと連絡する','abandon','不運の回数ではなく、残った選択肢で決める。'] ]},
      {tier:2,title:'提案の本命案を、その場で断られた。',detail:'相手は「予算が合わない」と明言した。',fixed:'本命案はこの条件では通らない',remaining:'理由を聞く・範囲を削る・次回条件を確認する',choices:[
        ['すぐ値引きして、とにかく受注する','partial','動いてはいるが、原因を確かめず条件を壊している。'],
        ['敗因だと思って早く商談を終える','abandon','断られた案と、商談全体は同じではない。'],
        ['予算の上限と優先項目を聞き、範囲を変えた案に組み直す','best','「NO」を情報へ変えて次の手札を作れている。'] ]},
      {tier:3,title:'商談後、重要メールを誤送信した。',detail:'社内向けの一文が取引先にも見える状態で送られた。',fixed:'送信済みのメールは取り消せない',remaining:'事実確認・早い訂正・必要なら謝罪',choices:[
        ['何度もメールを読み返して、相手の反応を想像する','abandon','反芻は手札を増やさない。'],
        ['誤送信箇所を確認し、必要な訂正と謝罪を一度だけ送る','best','変えられる範囲を最短で処理している。'],
        ['何も言わず、相手が気づかないことを期待する','partial','問題が軽ければあり得るが、まず影響確認が必要。'] ]},
      {tier:3,title:'帰り道。財布がない。',detail:'最後に使った店は閉店10分前。スマホはある。',fixed:'いま手元に財布がない',remaining:'店へ連絡・カード停止・移動履歴・電子決済',choices:[
        ['今日はもう最悪だ、と家まで歩きながら落ち込む','abandon','気分は自然でも、先に守れるものがある。'],
        ['店へ電話し、なければカード停止。帰路はスマホ決済で確保する','best','損失拡大を止めつつ、帰る手段も残している。'],
        ['まず来た道を全部歩き直す','partial','探索は一手だが、時間制約とカード保護を先に扱える。'] ]},
      {tier:4,title:'家に着くと、予定していた作業時間が消えた。',detail:'トラブル対応で2時間なくなり、残り45分。',fixed:'失った2時間は戻らない',remaining:'45分・優先順位変更・延期連絡・最小版',choices:[
        ['予定どおり全部やろうとして睡眠を削る','partial','取り返そうとすると次の損失が増える。'],
        ['今日は何もできない日だったことにする','abandon','45分はまだ残っている。'],
        ['今日必須の1件だけ45分版に縮め、残りは日程を引き直す','best','現在の資源に計画を合わせ直せている。'] ]},
      {tier:5,title:'寝る直前、明朝の予定が急に変更。',detail:'朝一で対応が必要になった。今日の計画は最後まで崩れた。',fixed:'明朝の変更は確定している',remaining:'今夜の準備・睡眠・明朝の最初の一手',choices:[
        ['今日一日を「全部ダメだった日」と採点する','abandon','一日の意味まで不運に渡さなくていい。'],
        ['明朝の最初の一手だけ準備し、睡眠を守って終える','best','最後に残った資源まで守るのが、こっからのベスト。'],
        ['不安なので明朝分を全部いま片付ける','partial','備えるのは良いが、睡眠という資源を失いやすい。'] ]},
    ],
    [
      {tier:1,title:'楽しみにしていた店が臨時休業。',detail:'もう現地まで来ている。次の予定までは90分ある。',fixed:'その店には今日は入れない',remaining:'周辺の別店・散歩・次の予定を前倒し',choices:[['今日は外れ日だと帰る','abandon','目的と手段を同じにしなくていい。'],['近くを検索し、今いる場所で一番楽しめる案へ切り替える','best','失った店ではなく、残った90分を使えている。'],['店のSNSを見続けて休業理由を調べる','partial','情報は増えるが今日の時間は良くならない。']]},
      {tier:2,title:'代わりの店は40分待ち。',detail:'次の予定に間に合うには待てても25分。',fixed:'40分待ちは自分では縮められない',remaining:'別候補・テイクアウト・時間上限を決める',choices:[['せっかく来たので予定に遅れてでも待つ','partial','得るものと失うものの比較が必要。'],['25分で入れなければ切替える、と上限を決めて別案も探す','best','待つか否かではなく、撤退条件まで決めている。'],['またダメだ、と何も選ばず時間をつぶす','abandon','選ばない間にも時間は減る。']]},
      {tier:2,title:'雨が強くなった。傘がない。',detail:'駅までは徒歩12分。コンビニは3分。',fixed:'いま雨が降っていて傘がない',remaining:'傘を買う・雨宿り・交通手段変更',choices:[['濡れて走って駅へ向かう','partial','早いが、その後の予定への影響も見る余地がある。'],['コンビニで傘を確保し、到着時刻を必要なら一報する','best','小さな損失で後続のダメージを止めている。'],['天気予報が外れたことに腹を立てる','abandon','原因を責めても雨は弱まらない。']]},
      {tier:3,title:'予約時間を勘違いしていた。',detail:'本当は30分前。施設側から確認の連絡が来た。',fixed:'予約時刻にはもう遅れている',remaining:'謝罪・空き枠確認・別日・代替案',choices:[['言い訳を長く説明して理解してもらう','partial','説明より、まず相手の運用と代替を確認した方が進む。'],['短く謝り、今日の空き枠か別日の最短枠を聞く','best','過去の説明より未来の選択肢を増やしている。'],['恥ずかしいので返信しない','abandon','沈黙すると残っている手札まで減る。']]},
      {tier:3,title:'スマホを落として画面にひび。',detail:'操作はできるが、タッチが不安定。',fixed:'画面はすでに破損した',remaining:'バックアップ・修理予約・必要データ移行',choices:[['割れた画面を見て何度も後悔する','abandon','後悔はデータを守らない。'],['動くうちにバックアップし、修理手段を確保する','best','次の損失を防ぐ一手が最優先。'],['まだ使えるので何もしない','partial','使える今こそ備えられる。']]},
      {tier:4,title:'帰宅するとネット回線が不調。',detail:'今夜中に送る予定のファイルがある。',fixed:'自宅回線はいま安定しない',remaining:'テザリング・軽量化・場所変更・締切連絡',choices:[['復旧するまでルーターを何度も再起動する','partial','一度の確認後は代替経路へ移った方が速い。'],['テザリングで送信。難しければ軽量版を先に共有し事情を伝える','best','目的を「回線復旧」から「届ける」に戻している。'],['今日はついてないので明日にする','abandon','締切に対する選択肢はまだある。']]},
      {tier:5,title:'最後に、楽しみにしていた予定もキャンセル。',detail:'相手の体調不良。今日は思い通りにならないことが続いた。',fixed:'今夜その予定は実現しない',remaining:'休む・一人で楽しむ・別日に再設定',choices:[['今日という日を失敗扱いして終える','abandon','予定が崩れた日にも残り時間はある。'],['相手を気遣って別日を決め、今夜は自分が回復する時間に変える','best','相手も自分も守る次善ではなく、その時点の最善。'],['すぐ別の誰かを探して予定を埋める','partial','埋めることが本当の目的か、一度見てもいい。']]},
    ],
    [
      {tier:1,title:'朝一。提出した資料に数字ミスが見つかった。',detail:'会議開始まで20分。影響範囲はまだ不明。',fixed:'誤った版はすでに共有済み',remaining:'影響確認・訂正版・先回り連絡',choices:[['誰のチェック漏れかを確認する','partial','原因分析は後でもできる。まず影響を止めたい。'],['影響箇所を特定し訂正版を作り、会議前に訂正を一報する','best','被害の拡大を最短で止めている。'],['会議で聞かれなければ触れない','abandon','残っている修正機会を捨てている。']]},
      {tier:2,title:'訂正版を作る途中でPCが再起動。',detail:'未保存の修正が一部消えた。残り14分。',fixed:'未保存分は戻らない',remaining:'履歴・最小修正・共有方法変更',choices:[['消えた作業を思い出しながら落ち込む','abandon','失った作業ではなく残り14分を見る。'],['影響する数字だけ最小修正し、完全版は会議後と宣言する','best','完璧より、期限内に必要な正しさを守っている。'],['全部を元どおり作り直そうとする','partial','正確さは大事だが、残り時間に合わせた範囲変更が必要。']]},
      {tier:2,title:'会議相手が想定外の論点を出した。',detail:'用意した説明では答え切れない。',fixed:'その質問はすでに出た',remaining:'確認質問・分かる範囲・宿題化',choices:[['分かったふりをして即答する','partial','場はつながるが、誤情報の損失が大きい。'],['前提を確認し、分かる範囲だけ答えて不足分は期限付きで持ち帰る','best','答えられないことを、次の進行に変えている。'],['質問した相手が厳しすぎると思う','abandon','相手の態度を評価しても回答は進まない。']]},
      {tier:3,title:'会議後、上司から厳しい指摘。',detail:'「準備が甘い」と言われた。具体例は1つ示された。',fixed:'指摘された事実は変えられない',remaining:'具体例を聞く・次回のチェック項目化・必要分だけ受け取る',choices:[['自分は評価されていない、と一日引きずる','abandon','一つの指摘を自己評価全体へ広げている。'],['具体的に直す1点を確認し、次回チェックリストへ入れる','best','痛い情報を改善可能な単位へ変えている。'],['反論できる材料を探す','partial','誤解なら必要。ただ、まず使える情報を拾える。']]},
      {tier:3,title:'午後、予定していた担当者が急に休み。',detail:'今日中の確認事項が1件ある。',fixed:'その担当者は今日は対応できない',remaining:'代理・期限調整・自分で確認できる範囲',choices:[['担当者が戻るまで全部止める','partial','止める前に依存部分を切り分けられる。'],['確認事項を分解し、代理で済む部分と延期が必要な部分を分ける','best','一人の不在を全停止へ広げていない。'],['どうして今日休むのかと考え続ける','abandon','理由は今日の進行を増やさない。']]},
      {tier:4,title:'締切直前、仕様変更の連絡。',detail:'全部対応すると今日中には終わらない。',fixed:'要求変更そのものは来ている',remaining:'優先順位・範囲交渉・段階納品',choices:[['徹夜して全部入れる','partial','責任感はあるが、品質と明日を同時に失う可能性がある。'],['必須変更を確認し、今日の納品範囲と後続分を分けて合意する','best','制約を共有し、現実に合わせてゴールを再定義している。'],['無理な依頼だと腹を立て、返信を後回しにする','abandon','返信を遅らせるほど交渉の手札が減る。']]},
      {tier:5,title:'退勤前、その案件自体が延期になった。',detail:'一日かけて整えたものは今日使われない。',fixed:'今日の本番はなくなった',remaining:'成果物を保存・学びを残す・回復・次日へ再配置',choices:[['今日やったことは全部無駄だったと思う','abandon','使われる日が変わっただけで、成果まで消えていない。'],['成果物と次回の確認点を残し、今日は予定どおり切り上げる','best','失った「今日使う」を、残った成果と回復へ切り替えている。'],['せっかくなのでさらに作り込む','partial','目的が延期されたなら、追加投資が今の最善とは限らない。']]},
    ]
  ];

  const screens = [...document.querySelectorAll('.screen')];
  const $ = (id) => document.getElementById(id);
  let state = null;
  let timerId = 0;
  let realState = null;

  function defaultStats(){return {runs:0,bestChoices:0,totalChoices:0,bestRate:0,fastestAvg:null,bestRunRate:0,realRuns:0,realDeltaTotal:0};}
  function loadStats(){try{return {...defaultStats(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};}catch{return defaultStats();}}
  function saveStats(stats){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(stats));}catch{}}
  function telemetry(step,detail={}){try{window.LevelUpTelemetry?.step?.(step,{slug:SLUG,...detail});}catch{}}
  function haptic(pattern=12){try{navigator.vibrate?.(pattern);}catch{}}

  function showScreen(id){
    screens.forEach(s=>s.classList.toggle('active',s.id===id));
    window.scrollTo({top:0,behavior:'smooth'});
    if(id==='homeScreen') renderHomeStats();
    if(id==='statsScreen') renderStats();
  }

  function renderHomeStats(){
    const s=loadStats();
    $('homeRuns').textContent=s.runs;
    $('homeBest').textContent=s.runs?`${Math.round(s.bestRunRate)}%`:'—';
    $('homeFast').textContent=s.fastestAvg?`${s.fastestAvg.toFixed(1)}s`:'—';
  }

  function shuffled(items){return items.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);}
  function selectChain(){return chains[Math.floor(Math.random()*chains.length)].map(item=>({...item,choices:shuffled(item.choices)}));}

  function startTraining(){
    clearInterval(timerId);
    state={waves:selectChain().slice(0,WAVES_PER_RUN),index:0,rebound:100,streak:0,bestStreak:0,bestCount:0,times:[],startedAt:0,answered:false};
    telemetry('training_start');
    showScreen('trainingScreen');
    renderWave();
  }

  function renderWave(){
    const item=state.waves[state.index];
    state.answered=false;
    $('waveLabel').textContent=`${state.index+1} / ${state.waves.length}`;
    $('reboundLabel').textContent=state.rebound;
    $('streakLabel').textContent=state.streak;
    $('reboundBar').style.width=`${state.rebound}%`;
    $('reboundBar').style.background=state.rebound>=70?'var(--lime)':state.rebound>=45?'var(--amber)':'var(--red)';
    $('scenarioTier').textContent=`LEVEL ${item.tier}`;
    $('scenarioTitle').textContent=item.title;
    $('scenarioDetail').textContent=item.detail;
    $('fixedFact').textContent=item.fixed;
    $('feedbackSheet').classList.remove('open');
    $('feedbackSheet').setAttribute('aria-hidden','true');
    const choices=$('choices'); choices.innerHTML='';
    item.choices.forEach((choice,i)=>{
      const button=document.createElement('button');
      button.className='choice'; button.type='button';
      button.innerHTML=`<span class="choice-index">${i+1}</span><span class="choice-text"></span>`;
      button.querySelector('.choice-text').textContent=choice[0];
      button.addEventListener('click',()=>answerChoice(button,choice,item));
      choices.appendChild(button);
    });
    state.startedAt=performance.now();
    clearInterval(timerId);
    timerId=setInterval(()=>{$('decisionTimer').textContent=`${((performance.now()-state.startedAt)/1000).toFixed(1)}s`;},100);
  }

  function answerChoice(button,choice,item){
    if(state.answered)return;
    state.answered=true; clearInterval(timerId);
    const elapsed=(performance.now()-state.startedAt)/1000;
    state.times.push(elapsed); $('decisionTimer').textContent=`${elapsed.toFixed(1)}s`;
    const kind=choice[1];
    document.querySelectorAll('.choice').forEach(b=>b.disabled=true);
    button.classList.add('chosen',kind);
    let loss=0;
    if(kind==='best'){state.bestCount++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);haptic([12,35,12]);}
    else if(kind==='partial'){loss=6;state.streak=0;haptic(18);}
    else{loss=15;state.streak=0;haptic(35);}
    state.rebound=Math.max(0,state.rebound-loss);
    $('reboundLabel').textContent=state.rebound;
    $('streakLabel').textContent=state.streak;
    $('reboundBar').style.width=`${state.rebound}%`;
    $('feedbackKicker').textContent=kind==='best'?'BEST MOVE':kind==='partial'?'まだ手札がある':'そこで終わらない';
    $('feedbackKicker').style.color=kind==='best'?'var(--lime)':kind==='partial'?'var(--amber)':'var(--red)';
    $('feedbackTitle').textContent=kind==='best'?'こっからを選べた。':kind==='partial'?'悪くない。もう一段。':'不運と、敗北は別。';
    $('feedbackText').textContent=choice[2]+(loss?` 再起力 -${loss}。不運ではなく、次の一手を狭めた分だけ減る。`:' 不運そのものによる再起力ダメージは 0。');
    $('remainingHand').textContent=item.remaining;
    $('nextWave').textContent=state.index===state.waves.length-1?'結果を見る →':'次の不運へ →';
    $('feedbackSheet').classList.add('open'); $('feedbackSheet').setAttribute('aria-hidden','false');
    telemetry('training_choice',{wave:state.index+1,kind,seconds:Number(elapsed.toFixed(1))});
  }

  function nextWave(){
    if(!state?.answered)return;
    if(state.index>=state.waves.length-1){finishTraining();return;}
    state.index++; renderWave(); window.scrollTo({top:0,behavior:'smooth'});
  }

  function finishTraining(){
    clearInterval(timerId);
    const rate=state.bestCount/state.waves.length*100;
    const avg=state.times.reduce((a,b)=>a+b,0)/state.times.length;
    const stats=loadStats();
    stats.runs++; stats.bestChoices+=state.bestCount; stats.totalChoices+=state.waves.length;
    stats.bestRate=stats.totalChoices?stats.bestChoices/stats.totalChoices*100:0;
    stats.bestRunRate=Math.max(stats.bestRunRate||0,rate);
    stats.fastestAvg=stats.fastestAvg==null?avg:Math.min(stats.fastestAvg,avg);
    saveStats(stats);
    $('resultScore').textContent=`${Math.round(rate)}%`;
    $('resultRebound').textContent=state.rebound;
    $('resultTime').textContent=`${avg.toFixed(1)}s`;
    $('resultStreak').textContent=state.bestStreak;
    $('resultMessage').textContent=rate>=85?'かなり強い。状況が崩れても「残っている手札」へ戻れている。次は判断速度を縮めよう。':rate>=55?'切り替えられている。不運が重なった後半ほど「取り返す」より「残った資源」を見ると強くなる。':'今日はここが伸びしろ。不運が起きた瞬間に「もう確定したこと／まだ選べること」を分けるだけで次が見えやすくなる。';
    showScreen('resultScreen');
    telemetry('training_complete',{rate:Math.round(rate),avg:Number(avg.toFixed(1)),rebound:state.rebound});
    try{window.dispatchEvent(new CustomEvent('levelup:played',{detail:{slug:SLUG,score:Math.round(rate),metric:'best_rate'}}));}catch{}
  }

  function startReal(){
    realState={step:1,situation:'',before:7,fixed:'',levers:[],customLever:'',move:'',after:null};
    telemetry('real_start'); showScreen('realScreen'); renderReal();
  }

  const leverOptions=['伝える','時間を使う','代替案を作る','優先順位を変える','助けを借りる','休んで立て直す'];
  function renderReal(){
    const root=$('realFlow');
    if(realState.step===1){
      root.innerHTML=`<div class="real-card"><div class="real-step">STEP 1 / 3</div><h3>何が起きた？</h3><p>評価や原因分析はあと。まず出来事を1件だけ置く。</p><label class="field-label" for="realSituation">起きたこと</label><textarea class="textarea" id="realSituation" maxlength="240" placeholder="例：大事な会議で説明がうまくいかなかった"></textarea><label class="field-label" for="beforeRange">いま「次の一手が見えない」度</label><div class="range-row"><input id="beforeRange" type="range" min="0" max="10" value="${realState.before}"><span class="range-value" id="beforeValue">${realState.before}</span></div></div><button class="primary-button" id="realNext1" type="button">確定と手札を分ける →</button>`;
      $('realSituation').value=realState.situation; $('beforeRange').addEventListener('input',e=>{$('beforeValue').textContent=e.target.value;}); $('realNext1').addEventListener('click',()=>{const v=$('realSituation').value.trim();if(!v){$('realSituation').focus();return;}realState.situation=v;realState.before=Number($('beforeRange').value);realState.step=2;renderReal();});
    } else if(realState.step===2){
      root.innerHTML=`<div class="real-card"><div class="real-step">STEP 2 / 3</div><h3>確定したことと、残った手札。</h3><p>過去は閉じる。いま動かせるレバーだけ探す。</p><label class="field-label" for="realFixed">もう変えられないこと</label><textarea class="textarea" id="realFixed" maxlength="180" placeholder="例：会議は終わった。あの発言はもうした。"></textarea><span class="field-label">まだ動かせそうなもの</span><div class="chips" id="leverChips"></div><label class="field-label" for="customLever">ほかに残っている手札（任意）</label><textarea class="textarea" id="customLever" maxlength="120" placeholder="例：次回の冒頭だけ変える"></textarea></div><button class="primary-button" id="realNext2" type="button">こっからのベストを決める →</button>`;
      $('realFixed').value=realState.fixed;$('customLever').value=realState.customLever;
      leverOptions.forEach(label=>{const b=document.createElement('button');b.className='chip'+(realState.levers.includes(label)?' selected':'');b.type='button';b.textContent=label;b.addEventListener('click',()=>{b.classList.toggle('selected');});$('leverChips').appendChild(b);});
      $('realNext2').addEventListener('click',()=>{const fixed=$('realFixed').value.trim();if(!fixed){$('realFixed').focus();return;}realState.fixed=fixed;realState.levers=[...document.querySelectorAll('.chip.selected')].map(x=>x.textContent);realState.customLever=$('customLever').value.trim();realState.step=3;renderReal();});
    } else if(realState.step===3){
      const hands=[...realState.levers,realState.customLever].filter(Boolean).join('・')||'まだ選べる行動がある';
      root.innerHTML=`<div class="real-card"><div class="real-step">STEP 3 / 3</div><h3>こっからのベストは？</h3><div class="split-card"><div class="mini-card"><span>確定</span><b id="fixedPreview"></b></div><div class="mini-card"><span>残った手札</span><b id="handsPreview"></b></div></div><label class="field-label" for="realMove">次にやる、具体的な一手</label><textarea class="textarea" id="realMove" maxlength="180" placeholder="例：必要なら一度だけ補足し、次回の冒頭で結論を先に言う"></textarea><label class="field-label" for="afterRange">決めたあと「次の一手が見えない」度</label><div class="range-row"><input id="afterRange" type="range" min="0" max="10" value="${realState.before}"><span class="range-value" id="afterValue">${realState.before}</span></div></div><button class="primary-button" id="realFinish" type="button">これが、こっからのベスト →</button>`;
      $('fixedPreview').textContent=realState.fixed;$('handsPreview').textContent=hands;$('realMove').value=realState.move;$('afterRange').addEventListener('input',e=>{$('afterValue').textContent=e.target.value;});
      $('realFinish').addEventListener('click',()=>{const move=$('realMove').value.trim();if(!move){$('realMove').focus();return;}realState.move=move;realState.after=Number($('afterRange').value);realState.step=4;finishReal();});
    }
  }

  function finishReal(){
    const stats=loadStats(); const delta=realState.after-realState.before; stats.realRuns++;stats.realDeltaTotal+=delta;saveStats(stats);
    const hands=[...realState.levers,realState.customLever].filter(Boolean).join('・')||'自分で選べる行動';
    $('realFlow').innerHTML=`<div class="real-card"><div class="real-step">REAL MOVE</div><h3>起きたことは確定。<br>次の一手は未確定。</h3><div class="split-card"><div class="mini-card"><span>もう変えない</span><b id="realResultFixed"></b></div><div class="mini-card"><span>まだ使える</span><b id="realResultHands"></b></div><div class="mini-card"><span>こっからのベスト</span><b class="real-result-move" id="realResultMove"></b></div><div class="mini-card"><span>「次が見えない」度</span><b class="${delta<=0?'delta-good':''}">${realState.before} → ${realState.after}${delta<0?`（${Math.abs(delta)}軽くなった）`:delta===0?'（変化なし）':`（+${delta}）`}</b></div></div><p style="margin-top:16px">この一手を実行したら、この件の残りは未来の自分へ渡していい。</p></div><button class="primary-button" id="realAgain" type="button">別の1件で使う</button>`;
    $('realResultFixed').textContent=realState.fixed;$('realResultHands').textContent=hands;$('realResultMove').textContent=realState.move;
    $('realAgain').addEventListener('click',startReal);
    telemetry('real_complete',{before:realState.before,after:realState.after,delta});
    try{window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete',{detail:{slug:SLUG,before:realState.before,after:realState.after,delta}}));}catch{}
    haptic([12,30,12]);
  }

  function renderStats(){
    const s=loadStats();
    $('statRuns').textContent=s.runs;
    $('statAccuracy').textContent=s.totalChoices?`${Math.round(s.bestRate)}%`:'—';
    $('statFastest').textContent=s.fastestAvg?`${s.fastestAvg.toFixed(1)}秒`:'—';
    $('statRealRuns').textContent=s.realRuns;
    if(!s.realRuns){$('statRealDelta').textContent='—';}
    else{const d=s.realDeltaTotal/s.realRuns;$('statRealDelta').textContent=d<0?`${Math.abs(d).toFixed(1)} ↓`:d>0?`+${d.toFixed(1)}`:'±0';}
  }

  async function shareResult(){
    if(!state)return;
    const rate=Math.round(state.bestCount/state.waves.length*100);const avg=state.times.reduce((a,b)=>a+b,0)/state.times.length;
    const text=`こっからのベスト。\n不運7連続 → BEST ${rate}%\n平均判断 ${avg.toFixed(1)}秒 / 再起力 ${state.rebound}\n\n起きたことは確定。次の一手は未確定。`;
    try{if(navigator.share){await navigator.share({title:'こっからのベスト。',text,url:location.href});}else{await navigator.clipboard.writeText(`${text}\n${location.href}`);$('shareResult').textContent='コピーしました';setTimeout(()=>{$('shareResult').textContent='結果をシェア';},1400);}}catch{}
  }

  $('startTraining').addEventListener('click',startTraining);
  $('startReal').addEventListener('click',startReal);
  $('nextWave').addEventListener('click',nextWave);
  $('retryTraining').addEventListener('click',startTraining);
  $('resultToReal').addEventListener('click',startReal);
  $('shareResult').addEventListener('click',shareResult);
  $('resultHome').addEventListener('click',()=>showScreen('homeScreen'));
  $('realHome').addEventListener('click',()=>showScreen('homeScreen'));
  $('statsButton').addEventListener('click',()=>showScreen('statsScreen'));
  $('statsHome').addEventListener('click',()=>showScreen('homeScreen'));
  renderHomeStats();
})();
