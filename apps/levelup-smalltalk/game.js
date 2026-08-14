(() => {
  'use strict';

  const SKILLS = {
    empathy: { label: '共感', icon: '♡', color: '#ff77a8' },
    question: { label: '質問', icon: '?', color: '#64e7ff' },
    deepen: { label: '深掘り', icon: '↓', color: '#9e85ff' },
    expand: { label: '広げる', icon: '↗', color: '#d9ff63' },
    self: { label: '自己開示', icon: '●', color: '#ffb84f' },
    switch: { label: '転換', icon: '→', color: '#7ee3b3' },
    close: { label: '終了', icon: '✓', color: '#aab4c7' }
  };

  const SCENES = [
    {icon:'☕',place:'休憩室',name:'佐藤さん',type:'同僚',line:'最近コーヒーにハマってて。',branches:['最近','コーヒー','ハマった理由','お店'],next:['豆を挽くところからやってるんです。','近所にいい店を見つけたんですよ。','朝に飲むとかなり切り替わります。']},
    {icon:'🍜',place:'ランチ',name:'高橋さん',type:'同僚',line:'週末、新しくできたラーメン屋に行ったんですよ。',branches:['週末','新しい店','ラーメン','場所','味'],next:['鶏白湯がすごく濃かったです。','40分くらい並びました。','駅の反対側にできた店です。']},
    {icon:'✈️',place:'初対面',name:'山本さん',type:'知人の友人',line:'先月、初めて台湾に行ってきました。',branches:['先月','初めて','台湾','旅行','食べ物'],next:['夜市が一番楽しかったですね。','食べ物が全部おいしかったです。','次は台南にも行ってみたいです。']},
    {icon:'🏃',place:'オフィス',name:'鈴木さん',type:'同僚',line:'最近ジョギング始めたんですよ。',branches:['最近','ジョギング','始めた理由','朝夜','距離'],next:['夜に30分くらい走ってます。','健康診断がきっかけで。','靴を買ったら急に楽しくなりました。']},
    {icon:'🎬',place:'待合室',name:'田中さん',type:'初対面',line:'昨日、久しぶりに映画館で映画を見ました。',branches:['昨日','久しぶり','映画館','作品','誰と'],next:['映画館の音ってやっぱりいいですね。','一人でふらっと行ったんです。','原作を知らずに見たんですが面白かったです。']},
    {icon:'🐕',place:'公園',name:'井上さん',type:'近所の人',line:'この犬、もう10歳なんですよ。',branches:['犬','10歳','犬種','散歩','名前'],next:['毎朝ここまで散歩に来ます。','子犬のころから全然性格が変わらなくて。','家ではずっと寝てます。']},
    {icon:'🍳',place:'飲み会',name:'小林さん',type:'初対面',line:'最近、料理をちゃんとするようになって。',branches:['最近','料理','きっかけ','得意料理','自炊'],next:['パスタばっかり作ってます。','外食が高くなったのがきっかけです。','意外と片付けの方が大変ですね。']},
    {icon:'🎮',place:'休憩室',name:'中村さん',type:'同僚',line:'昨日、ゲームやってたら2時になっちゃいました。',branches:['昨日','ゲーム','2時','夜更かし','作品'],next:['あと一戦だけ、が止まらなくて。','友達とオンラインでやってました。','今日はさすがに眠いです。']},
    {icon:'📚',place:'カフェ',name:'加藤さん',type:'友人の友人',line:'本屋に行くと、つい長居しちゃうんですよね。',branches:['本屋','長居','本','ジャンル','買い方'],next:['気づくと1時間くらいいます。','旅行コーナーを見るのが好きです。','紙の本は減らしたいんですけどね。']},
    {icon:'🏕️',place:'懇親会',name:'松本さん',type:'取引先',line:'この前、初めてソロキャンプしてみました。',branches:['この前','初めて','ソロ','キャンプ','道具'],next:['一人だと時間がすごく長く感じました。','焚き火だけで2時間いけますね。','道具を揃え始めると危ないです。']},
    {icon:'⚽',place:'エレベーター前',name:'吉田さん',type:'同僚',line:'息子が最近サッカー始めたんです。',branches:['息子','最近','サッカー','習い事','応援'],next:['週末はほぼ付き添いです。','本人はゴールキーパーが好きみたいで。','自分もルールを覚え直してます。']},
    {icon:'🌧️',place:'入口',name:'伊藤さん',type:'同僚',line:'朝すごい雨でしたね。',branches:['朝','雨','通勤','天気','傘'],next:['駅までで靴がびしょびしょです。','午後は晴れるらしいですよ。','最近急な雨多いですよね。']},
    {icon:'🎵',place:'バー',name:'渡辺さん',type:'初対面',line:'最近また昔の曲ばっかり聴いてます。',branches:['最近','昔の曲','音楽','年代','きっかけ'],next:['高校のころ聴いてた曲です。','プレイリストから偶然流れてきて。','昔の曲ってイントロが長いですよね。']},
    {icon:'🚃',place:'移動中',name:'斎藤さん',type:'取引先',line:'今日は電車が空いてて助かりました。',branches:['今日','電車','空いてた','通勤','時間'],next:['いつもは座れないんです。','一本早い電車にしたんですよ。','毎日これくらいなら楽なんですけどね。']},
    {icon:'🏠',place:'懇親会',name:'木村さん',type:'初対面',line:'最近、部屋の模様替えをしてるんです。',branches:['最近','部屋','模様替え','家具','きっかけ'],next:['机の位置を変えただけでかなり違います。','物を捨てるところから始めました。','照明を変えたいんですよね。']},
    {icon:'🍰',place:'打ち合わせ前',name:'林さん',type:'取引先',line:'この近くのケーキ屋、いつも並んでますよね。',branches:['この近く','ケーキ屋','行列','甘い物','おすすめ'],next:['一回だけ買ったことあります。','チーズケーキが人気みたいです。','並ぶの苦手でまだ入れてなくて。']},
    {icon:'♨️',place:'旅行先',name:'清水さん',type:'同行者',line:'温泉って入ったあと何もしたくなくなりますね。',branches:['温泉','入浴後','旅行','休む','好み'],next:['このまま寝たいです。','露天風呂が一番好きです。','朝風呂も入りたいですね。']},
    {icon:'📱',place:'休憩室',name:'森さん',type:'同僚',line:'スマホの写真、気づいたら3万枚ありました。',branches:['スマホ','写真','3万枚','整理','何を撮る'],next:['ほとんど子どもの写真です。','消そうと思うと全然消せなくて。','容量がずっとギリギリです。']},
    {icon:'🌿',place:'屋外イベント',name:'池田さん',type:'初対面',line:'植物を育て始めたら朝見るのが楽しみになって。',branches:['植物','育てる','朝','楽しみ','種類'],next:['小さいハーブだけなんですけど。','新しい葉が出ると嬉しいですね。','水やりしすぎないのが難しいです。']},
    {icon:'🏎️',place:'交流会',name:'橋本さん',type:'初対面',line:'最近F1にハマってるんですよ。',branches:['最近','F1','きっかけ','見る場所','面白さ'],next:['Netflixの番組がきっかけです。','レース中の戦略が面白くて。','実は車自体はそんな詳しくないです。']},
    {icon:'🛏️',place:'朝会前',name:'石川さん',type:'同僚',line:'昨日ぜんぜん寝つけなくて。',branches:['昨日','寝つけない','睡眠','原因','今日'],next:['結局2時くらいまで起きてました。','考え事し始めたら止まらなくて。','今日はコーヒーで乗り切ります。']},
    {icon:'🧳',place:'会食',name:'前田さん',type:'取引先',line:'今年はどこか近場でも旅行したいんですよね。',branches:['今年','近場','旅行','候補','休み'],next:['温泉に一泊くらいが理想です。','遠出よりゆっくりしたくて。','まだ全然決めてないです。']},
    {icon:'🍺',place:'飲み会',name:'藤田さん',type:'初対面',line:'自分、最初の一杯だけビール派なんです。',branches:['最初の一杯','ビール','お酒','二杯目','好み'],next:['二杯目からはハイボールです。','家ではほとんど飲まないです。','夏だけはビールがうまいですね。']},
    {icon:'🖼️',place:'イベント',name:'岡田さん',type:'知人',line:'この前、美術館に行ったら意外と面白くて。',branches:['この前','美術館','意外','展示','きっかけ'],next:['現代アートの展示でした。','友達に誘われたんです。','説明を読むと見え方が変わりますね。']}
  ];

  const RUSH = [
    {line:'週末、新しくできたラーメン屋に行ったんですよ。', good:['週末','新しい店','ラーメン','場所','味','行列'], bad:['天気予報','パソコン','電池']},
    {line:'最近ジョギング始めたんですよ。', good:['最近','ジョギング','きっかけ','距離','朝か夜','靴'], bad:['映画館','名刺','料理']},
    {line:'先月、初めて台湾に行ってきました。', good:['先月','初めて','台湾','旅行','食べ物','次に行きたい所'], bad:['仕事の締切','洗濯','野球']},
    {line:'この犬、もう10歳なんですよ。', good:['犬','10歳','犬種','名前','散歩','子犬の頃'], bad:['新幹線','天気','ゲーム']},
    {line:'最近また昔の曲ばっかり聴いてます。', good:['最近','昔の曲','年代','きっかけ','好きな歌手','思い出'], bad:['ラーメン','家具','空港']}
  ];

  const RESPONSE_TEMPLATES = {
    empathy: s => [`それ、${pick(['いいですね','楽しそうですね','わかります','気になります'])}。`, 'まず気持ちを受ける'],
    question: s => [`${pickQuestion(s)}`, '相手にボールを返す'],
    deepen: s => [`その中で一番${pick(['よかった','印象に残った','面白かった'])}のって何ですか？`, '今の話を深くする'],
    expand: s => [`${s.branches[Math.min(1,s.branches.length-1)]}つながりだと、ほかにも何かあります？`, '横に話題を広げる'],
    self: s => [`自分も${pickSelf(s)}ことあります。`, '自分を少し出す'],
    switch: s => [`そういえば、${s.branches[0]}つながりで思い出したんですけど。`, '自然に別の枝へ'],
    close: () => [`面白かったです。またその話聞かせてください。`, '気持ちよく終える']
  };

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }
  function pickQuestion(scene){
    const b = pick(scene.branches.slice(0,Math.min(5,scene.branches.length)));
    const map = {
      '最近':'何がきっかけだったんですか？','昨日':'昨日はどんな感じだったんですか？','先月':'何日くらい行ったんですか？','週末':'週末によく行くんですか？',
      'コーヒー':'どんなコーヒーが好きなんですか？','ラーメン':'何系のラーメンだったんですか？','ジョギング':'どのくらい走るんですか？','映画館':'何を見たんですか？',
      '犬':'何ていう名前なんですか？','料理':'何をよく作るんですか？','ゲーム':'何のゲームやってるんですか？','台湾':'一番よかった場所はどこですか？',
      'F1':'どこが一番面白いんですか？','植物':'何を育ててるんですか？','温泉':'露天風呂派ですか？','写真':'何の写真が多いんですか？'
    };
    return map[b] || `${b}って、どんな感じなんですか？`;
  }
  function pickSelf(scene){
    const text = scene.line;
    if(/旅行|台湾|温泉/.test(text)) return '旅行先で予定を詰めずに過ごした';
    if(/コーヒー|ラーメン|ケーキ|料理/.test(text)) return '食べ物のお店を探してハマった';
    if(/ジョギング|サッカー/.test(text)) return '運動を始めようとして道具から揃えた';
    if(/映画|曲|ゲーム|本|美術/.test(text)) return '気になっていたものを一気に見た';
    return '似たようなことで時間を忘れた';
  }

  function makeAnswers(scene, round, state){
    let skills = ['empathy','question','deepen','expand','self'];
    if(round >= 5) skills.push('switch');
    if(round === state.roundMax-1) skills = ['close','empathy','self','question'];
    skills = shuffle(skills).slice(0,4);
    return skills.map(skill => {
      const [text,hint] = RESPONSE_TEMPLATES[skill](scene);
      const base = {empathy:11,question:10,deepen:13,expand:12,self:11,switch:10,close:14}[skill];
      return {skill,text,hint,base};
    });
  }

  function evaluateChoice(state, answer){
    let delta = answer.base;
    let feedback = 'GOOD TALK';
    const last = state.history[state.history.length-1];
    if(last && last.skill !== answer.skill){ delta += 4; state.flow += 1; }
    else if(last){ delta -= 2; state.flow = Math.max(0,state.flow-1); }
    else state.flow = 1;

    const recent = state.history.slice(-2).map(x=>x.skill);
    if(answer.skill === 'question' && recent.length===2 && recent.every(x=>x==='question')){
      delta -= 16; feedback='尋問モード'; state.flow=0; state.questionChain += 1;
    }
    if(answer.skill==='deepen' && last && last.skill==='empathy'){ delta += 5; feedback='NICE LINK'; }
    if(answer.skill==='self' && recent.includes('question')){ delta += 4; feedback='BALANCE'; }
    if(answer.skill==='switch' && state.fire < 35){ delta += 5; feedback='TOPIC JUMP'; }
    if(answer.skill==='close' && state.round >= state.roundMax-2){ delta += 8; feedback='NICE CLOSE'; }
    if(answer.skill==='close' && state.round < state.roundMax-2){ delta -= 10; feedback='まだ話せそう'; }

    delta = Math.max(-10,Math.min(22,delta));
    return {delta,feedback};
  }

  function scoreResult(state){
    const raw = state.score + state.fire*0.35 + state.bestFlow*3;
    return Math.max(0,Math.min(100,Math.round(raw/2.05)));
  }

  function coachMessage(state){
    const counts = state.skillCounts;
    const used = Object.entries(counts).filter(([,v])=>v>0);
    if(state.questionChain>0) return '質問は十分できています。次は「共感 → 自分の話を少し → 質問」の順を混ぜると、尋問っぽさが消えます。';
    if((counts.self||0)===0) return '聞く力はあります。次は自分の体験を一言だけ混ぜてみると、相手もあなたに質問しやすくなります。';
    if((counts.deepen||0)===0) return '話題を広げるのは得意です。次は相手が少し熱を持った話題で、一度だけ深掘りしてみましょう。';
    if(used.length>=5) return '返しの型をかなり使い分けています。現実でも「何を話すか」より、相手の言葉からどの枝を選ぶかに意識を向けると強いです。';
    return '同じ返しを続けず、共感・質問・自己開示を一つずつ混ぜると会話にリズムが出ます。';
  }

  const storage = {
    load(){ try{return JSON.parse(localStorage.getItem('levelup-smalltalk')||'{}')}catch{return{}} },
    save(data){ try{localStorage.setItem('levelup-smalltalk',JSON.stringify(data))}catch{} }
  };

  const els = {};
  let state = null;
  let rush = null;
  let soundOn = true;
  let timer = null;

  function q(id){ return document.getElementById(id); }
  function initDOM(){
    ['startScreen','gameScreen','resultScreen','rushScreen','rushResultScreen','homeLevel','homeBest','homePlays','startBtn','topicRushBtn','soundBtn','roundNow','roundMax','progressBar','flowCount','sceneIcon','sceneName','npcFace','npcEmoji','npcName','npcType','speech','reaction','fireBar','fireValue','branchesBox','branchHint','branchChips','timerLabel','answerCards','resultRank','resultSummary','resultScore','resultFlow','resultFire','skillBars','coachText','resultLevel','xpBar','xpText','retryBtn','homeBtn','rushRound','rushProgress','rushScore','rushSpeech','rushChoices','rushFeedback','rushNextBtn','rushResultScore','rushCoach','rushRetryBtn','rushHomeBtn','toast'].forEach(id=>els[id]=q(id));
    bindEvents(); updateHome();
  }

  function bindEvents(){
    els.startBtn.addEventListener('click',startGame);
    els.topicRushBtn.addEventListener('click',startRush);
    els.retryBtn.addEventListener('click',startGame);
    els.homeBtn.addEventListener('click',()=>showScreen('startScreen'));
    els.rushRetryBtn.addEventListener('click',startRush);
    els.rushHomeBtn.addEventListener('click',()=>showScreen('startScreen'));
    els.rushNextBtn.addEventListener('click',nextRush);
    els.soundBtn.addEventListener('click',()=>{soundOn=!soundOn;els.soundBtn.textContent=soundOn?'♪':'×';toast(soundOn?'SOUND ON':'SOUND OFF')});
  }

  function showScreen(id){
    clearTimeout(timer);
    ['startScreen','gameScreen','resultScreen','rushScreen','rushResultScreen'].forEach(x=>els[x].classList.toggle('active',x===id));
    if(id==='startScreen') updateHome();
    window.scrollTo(0,0);
  }

  function startGame(){
    const saved=storage.load();
    state={round:0,roundMax:8,score:0,fire:46,flow:0,bestFlow:0,history:[],skillCounts:{},questionChain:0,scenes:shuffle(SCENES).slice(0,8),saved};
    showScreen('gameScreen');
    els.roundMax.textContent=state.roundMax;
    renderRound();
  }

  function renderRound(){
    const scene=state.scenes[state.round];
    els.roundNow.textContent=state.round+1;
    els.progressBar.style.width=`${(state.round/state.roundMax)*100}%`;
    els.flowCount.textContent=state.flow;
    els.sceneIcon.textContent=scene.icon; els.sceneName.textContent=scene.place;
    els.npcName.textContent=scene.name; els.npcType.textContent=scene.type;
    els.npcEmoji.textContent='🙂'; els.npcFace.dataset.mood='neutral';
    els.speech.textContent=state.round===0?scene.line:(pick(scene.next)||scene.line);
    els.fireValue.textContent=Math.round(state.fire); els.fireBar.style.width=`${state.fire}%`;
    els.branchChips.innerHTML=''; scene.branches.slice(0,5).forEach((b,i)=>{const c=document.createElement('button');c.type='button';c.className='branch-chip';c.textContent=b;c.addEventListener('click',()=>{toast(`「${b}」から広げられる`);pulseSound(440+i*50,.03)});els.branchChips.appendChild(c)});
    const hideBranches=state.round>=5;
    els.branchesBox.classList.toggle('faded',hideBranches);
    els.branchHint.textContent=hideBranches?'補助を外します':'言葉の中から話題を拾う';
    const answers=makeAnswers(scene,state.round,state);
    els.answerCards.innerHTML='';
    answers.forEach((a,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='answer-card';btn.innerHTML=`<span class="key">${i+1}</span><b>${a.text}</b><small>${SKILLS[a.skill].icon} ${SKILLS[a.skill].label} · ${a.hint}</small>`;btn.addEventListener('click',()=>chooseAnswer(a,btn));els.answerCards.appendChild(btn)});
    startDecisionTimer();
  }

  function startDecisionTimer(){
    clearTimeout(timer); els.timerLabel.textContent='3秒で選ぶ';
    timer=setTimeout(()=>{els.timerLabel.textContent='急がなくてOK';},3000);
  }

  function chooseAnswer(answer,btn){
    clearTimeout(timer);
    [...els.answerCards.children].forEach(x=>x.disabled=true);
    const ev=evaluateChoice(state,answer);
    state.score += Math.max(0,ev.delta);
    state.fire = Math.max(8,Math.min(100,state.fire + ev.delta*.72 - 2));
    state.bestFlow=Math.max(state.bestFlow,state.flow);
    state.skillCounts[answer.skill]=(state.skillCounts[answer.skill]||0)+1;
    state.history.push({skill:answer.skill,delta:ev.delta});
    btn.classList.add(ev.delta>=8?'good':'warn');
    els.fireValue.textContent=Math.round(state.fire);els.fireBar.style.width=`${state.fire}%`;els.flowCount.textContent=state.flow;
    els.reaction.textContent=ev.feedback; els.reaction.classList.remove('show'); void els.reaction.offsetWidth; els.reaction.classList.add('show');
    if(ev.delta>=10){els.npcEmoji.textContent=pick(['😄','🙂','😊']);els.npcFace.dataset.mood='happy';pulseSound(620,.06)}else{els.npcEmoji.textContent='😅';els.npcFace.dataset.mood='awkward';pulseSound(260,.05)}
    timer=setTimeout(()=>{state.round++; if(state.round>=state.roundMax)finishGame();else renderRound();},650);
  }

  function finishGame(){
    const total=scoreResult(state);
    const rank=total>=88?'S':total>=75?'A':total>=60?'B':total>=45?'C':'D';
    const saved=storage.load();
    const xpGain=28+Math.round(total*.35); let xp=(saved.xp||0)+xpGain; let level=saved.level||1;
    while(xp>=100){xp-=100;level++}
    const next={...saved,xp,level,plays:(saved.plays||0)+1,bestFlow:Math.max(saved.bestFlow||0,state.bestFlow),bestScore:Math.max(saved.bestScore||0,total)};
    storage.save(next);
    els.resultRank.textContent=rank;els.resultScore.textContent=total;els.resultFlow.textContent=state.bestFlow;els.resultFire.textContent=Math.round(state.fire);els.resultLevel.textContent=level;els.xpBar.style.width=`${xp}%`;els.xpText.textContent=`${xp} / 100 XP (+${xpGain})`;
    els.resultSummary.textContent=rank==='S'?'返しの型を自在に切り替えています。':rank==='A'?'会話にいいリズムができています。':rank==='B'?'会話を自然につなげられました。':'同じ返しを減らすと一気に伸びます。';
    els.coachText.textContent=coachMessage(state); renderSkillBars(); showScreen('resultScreen');
  }

  function renderSkillBars(){
    const max=Math.max(1,...Object.values(state.skillCounts)); els.skillBars.innerHTML='';
    Object.entries(SKILLS).filter(([k])=>k!=='close'||state.skillCounts[k]).forEach(([k,v])=>{const n=state.skillCounts[k]||0;const row=document.createElement('div');row.className='skill-line';row.innerHTML=`<span>${v.label}</span><div><i style="width:${n/max*100}%"></i></div><b>${n}</b>`;els.skillBars.appendChild(row)});
  }

  function updateHome(){
    const s=storage.load(); els.homeLevel.textContent=s.level||1;els.homeBest.textContent=s.bestFlow||0;els.homePlays.textContent=s.plays||0;
  }

  function startRush(){rush={round:0,score:0,items:shuffle(RUSH)};showScreen('rushScreen');renderRush()}
  function renderRush(){
    const item=rush.items[rush.round]; els.rushRound.textContent=rush.round+1;els.rushProgress.style.width=`${rush.round/5*100}%`;els.rushScore.textContent=rush.score;els.rushSpeech.textContent=item.line;els.rushFeedback.textContent='';els.rushNextBtn.classList.add('hidden');els.rushChoices.innerHTML='';
    const opts=shuffle([...item.good.map(x=>({t:x,g:true})),...item.bad.map(x=>({t:x,g:false}))]);
    let remaining=item.good.length;
    opts.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='rush-choice';b.textContent=o.t;b.addEventListener('click',()=>{if(b.dataset.done)return;b.dataset.done='1';if(o.g){b.classList.add('hit');rush.score++;remaining--;els.rushScore.textContent=rush.score;els.rushFeedback.textContent=`+1 TOPIC  「${o.t}」も会話の入口`;pulseSound(560,.035)}else{b.classList.add('miss');els.rushFeedback.textContent='その言葉は今の発言にはまだ出ていない';pulseSound(220,.035)}if(remaining===0){els.rushFeedback.textContent='ALL FOUND! 一言から複数の枝が見えた。';els.rushNextBtn.classList.remove('hidden')}});els.rushChoices.appendChild(b)});
  }
  function nextRush(){rush.round++;if(rush.round>=5){els.rushResultScore.textContent=rush.score;els.rushCoach.textContent=rush.score>=25?'かなり見えています。現実でも相手の名詞だけでなく「最近」「初めて」「理由」も枝になります。':'名詞だけでなく、時間・感情・きっかけにも注目すると話題が一気に増えます。';showScreen('rushResultScreen')}else renderRush()}

  function toast(msg){els.toast.textContent=msg;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),900)}
  function pulseSound(freq=440,d=.04){if(!soundOn||!window.AudioContext)return;try{const ac=window.__smalltalkAC||(window.__smalltalkAC=new AudioContext());const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.028,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch{}}

  if(typeof module!=='undefined'&&module.exports){module.exports={SKILLS,SCENES,RUSH,makeAnswers,evaluateChoice,scoreResult,coachMessage};}
  if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',initDOM);}
})();
