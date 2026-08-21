(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const STORAGE_KEY = 'levelup.jinshin-shoaku.v1';

  const principles = {
    story: { label:'SELF STORY', title:'自己物語を理解する', short:'自己像', action:'次の会話で、相手が大事にしている「自分はこういう人」を1つ言葉にして返す。', copy:'「そこを大事にしてきたんですね」' },
    role: { label:'PERSON ≠ ROLE', title:'役割と本人を分ける', short:'本人', action:'いつもの役割を期待する前に、「今日はどう？」を一度だけ聞く。', copy:'「今日はどうしたい？」' },
    ideal: { label:'IDEAL SELF', title:'理想自己を支える', short:'理想', action:'相手が伸ばしたいことに、小さな決定権を1つ渡す。', copy:'「ここ、あなたならどう決める？」' },
    choice: { label:'AUTONOMY', title:'選べる余地を残す', short:'選択', action:'次の依頼を「命令1択」ではなく、A/B/別案の余地がある聞き方に変える。', copy:'「AとBならどちらがやりやすい？ 別案でも大丈夫」' },
    face: { label:'SAVE FACE', title:'フェイスを守る', short:'面子', action:'訂正が必要なとき、人前で詰めず「直せる出口」を先に作る。', copy:'「ここだけ一緒に直せば大丈夫です」' },
    ethics: { label:'ETHICS', title:'支配しない', short:'倫理', action:'「相手をどう動かす？」ではなく「相手が自由に決められる条件は？」に問いを置き換える。', copy:'「あなたはどうしたい？」' },
  };

  const scenarios = [
    { p:'story', place:'1on1', relation:'部下', line:'部下が「自分は、雑な仕事だけはしたくないんです」と締切延長を相談してきた。', choices:[
      {t:'「でも仕事は締切がすべて。今回は従って」',s:0,f:'本人が守りたい自己像を否定すると、内容より「自分を守る」ことにエネルギーが向きやすい。'},
      {t:'「丁寧に仕上げたいんだね。品質を守りつつ今日出せる範囲を一緒に決めよう」',s:2,f:'「丁寧な仕事をする自分」を認めたうえで、現実的な行動へつなげている。'},
      {t:'「わかった。好きなだけ時間を使っていいよ」',s:1,f:'自己像は尊重できるが、協働では締切や他者への影響も一緒に扱う必要がある。'}], better:'「丁寧に仕上げたいんだね。品質を守りつつ、今日出せる範囲を一緒に決めよう」'},
    { p:'story', place:'商談', relation:'取引先', line:'相手が「うちは安売りではなく、品質で選ばれてきた会社です」と強く話している。', choices:[
      {t:'「でも価格を下げないと売れません」',s:0,f:'価格論の前に、相手の会社像そのものを否定する形になっている。'},
      {t:'「その強みを残したまま、買いやすい入口を作る案を考えませんか」',s:2,f:'相手の自己物語を土台にして提案しているので、変化が「自己否定」になりにくい。'},
      {t:'「品質が高いのはわかります」だけで終える',s:1,f:'尊重は伝わるが、次の共同作業へつなぐ一歩が弱い。'}], better:'「その強みを残したまま、買いやすい入口を作る案を考えませんか」'},
    { p:'story', place:'チーム', relation:'同僚', line:'同僚が「私は裏方で支える方が向いてるから」と発表役を断ろうとしている。', choices:[
      {t:'「そんなこと言わず、発表も経験しないと」',s:0,f:'相手が自分をどう捉えているかを飛ばして役割変更だけを迫っている。'},
      {t:'「支える役が得意なんだね。今回はどこまでなら前に出ても負担が少ない？」',s:2,f:'自己像を否定せず、選べる変化の幅を一緒に探している。'},
      {t:'「じゃあずっと裏方でお願い」',s:1,f:'自己像は尊重しているが、本人の変化可能性まで固定してしまう。'}], better:'「支える役が得意なんだね。今回はどこまでなら前に出ても負担が少ない？」'},

    { p:'role', place:'繁忙日', relation:'同僚', line:'いつも聞き役の同僚が、今日はほとんど話さず疲れた表情をしている。', choices:[
      {t:'「今日もみんなの話、聞いてあげてよ」',s:0,f:'「聞き役」という役割を本人より優先している。'},
      {t:'「今日は静かだけど、聞く側じゃなくて休みたい感じ？」',s:2,f:'役割を固定せず、今の本人の状態を直接確認している。'},
      {t:'何も聞かず、いつも通り相談を持ち込む',s:0,f:'過去の役割を現在の本人へ自動適用している。'}], better:'「今日はどう？ 聞く側じゃなくて休みたい感じ？」'},
    { p:'role', place:'家庭', relation:'家族', line:'いつもしっかり予定を決める家族が「今日は何も決めたくない」と言った。', choices:[
      {t:'「あなたが決めないと進まないよ」',s:0,f:'「しっかり者」という役割を本人に押し戻している。'},
      {t:'「了解。今日はこっちで決める？ それとも何もしない日にする？」',s:2,f:'いつもの役割から降りられる余地を作り、今の気持ちを優先している。'},
      {t:'「珍しいね、大丈夫？」とだけ言う',s:1,f:'本人を見る姿勢はある。さらに実際に役割から降りられる選択肢を作ると強い。'}], better:'「了解。今日はこっちで決める？ それとも何もしない日にする？」'},
    { p:'role', place:'プロジェクト', relation:'先輩', line:'いつも火消し役の先輩が「今回はもう誰かに任せたい」と漏らした。', choices:[
      {t:'「先輩ならなんとかできますよ」',s:0,f:'称賛に見えても、「強い人でいて」という役割の強制になりうる。'},
      {t:'「今回は降りたいんですね。どこを渡せば一番楽になります？」',s:2,f:'本人の変化をそのまま受け取り、役割を再設計している。'},
      {t:'「じゃあ全部こちらでやります」',s:1,f:'負担は減らせるが、本人の希望を細かく確認する余地がある。'}], better:'「今回は降りたいんですね。どこを渡せば一番楽になります？」'},

    { p:'ideal', place:'育成', relation:'後輩', line:'後輩が「いつか自分で企画を回せるようになりたい」と話している。', choices:[
      {t:'「まだ早いから、今は指示どおりやって」',s:0,f:'理想自己への動線を閉じると、成長意欲と協力意欲の両方を削りやすい。'},
      {t:'「じゃあ次の案件で、最初の企画案だけあなたが決めてみる？」',s:2,f:'理想の自分へ近づける、小さく安全な決定権を渡している。'},
      {t:'「そのうちチャンスはあるよ」',s:1,f:'応援はしているが、理想自己へ近づく具体的な足場がない。'}], better:'「じゃあ次の案件で、最初の企画案だけあなたが決めてみる？」'},
    { p:'ideal', place:'1on1', relation:'部下', line:'部下が「人前で説明できるようになりたい」と言う一方、発表には自信がない。', choices:[
      {t:'いきなり全社会議の発表を任せる',s:0,f:'理想を支えることと、過大な負荷をかけることは別。失敗回避が主目的になりやすい。'},
      {t:'「次のチーム会議で5分だけ説明してみる？」',s:2,f:'理想自己に近づく挑戦を、成功可能性のある小ささで渡している。'},
      {t:'「無理しなくていいよ」と発表機会をなくす',s:1,f:'安全は守れるが、本人が望む成長の方向まで閉じてしまう。'}], better:'「次のチーム会議で5分だけ説明してみる？」'},
    { p:'ideal', place:'企画', relation:'同僚', line:'同僚が「もっと数字で判断できる人になりたい」と話している。次の施策会議がある。', choices:[
      {t:'数字の分析は全部自分で終わらせて見せる',s:0,f:'効率は良くても、相手の理想自己へ近づく経験を奪っている。'},
      {t:'「会議で見る3指標、あなたが先に選んでみる？」',s:2,f:'理想自己に直結する小さな判断機会を渡している。'},
      {t:'分析本を一冊おすすめする',s:1,f:'役立つが、実践の決定権ほど強く理想自己を支えない。'}], better:'「会議で見る3指標、あなたが先に選んでみる？」'},

    { p:'choice', place:'依頼', relation:'部下', line:'今日中に追加作業をお願いしたいが、相手にも予定がある。', choices:[
      {t:'「これ、今日中に絶対やって」',s:0,f:'緊急性が本当に必要な場合を除き、選択余地をゼロにすると納得感を削りやすい。'},
      {t:'「今日中だとAとBどちらがやりやすい？ 難しければ別案を考えよう」',s:2,f:'必要条件を示しつつ、方法と相談の余地を残している。'},
      {t:'「暇ならやっておいて」',s:1,f:'自由はあるが、優先度と期待が曖昧で協働しにくい。'}], better:'「今日中だとAとBどちらがやりやすい？ 難しければ別案を考えよう」'},
    { p:'choice', place:'会議', relation:'チーム', line:'方針は決まっているが、進め方には複数の方法がある。', choices:[
      {t:'細かい手順まで全部こちらで指定する',s:0,f:'必要以上に決定権を奪うと、実行が「やらされ仕事」になりやすい。'},
      {t:'「ゴールはここ。進め方はA/Bどちらがやりやすい？」',s:2,f:'動かせない条件と選べる領域を分け、納得感を作っている。'},
      {t:'「好きにやって」と条件も渡さない',s:1,f:'自律性はあるが、必要な境界まで消すと不安や手戻りを増やす。'}], better:'「ゴールはここ。進め方はA/Bどちらがやりやすい？」'},
    { p:'choice', place:'家庭', relation:'家族', line:'週末に片付けを一緒にしたい。相手は乗り気ではない。', choices:[
      {t:'「今すぐ全部片付けて」',s:0,f:'目的より支配感が前に出ると、協力ではなく抵抗を生みやすい。'},
      {t:'「10分だけやる？ それとも夕方に30分？ 今日はやらない案も含めて決めよう」',s:2,f:'負担量と時間に選択肢を作り、本人の決定を残している。'},
      {t:'黙って自分だけで全部やる',s:1,f:'衝突は避けられるが、協力の設計そのものは起きていない。'}], better:'「10分だけやる？ それとも夕方に30分？ 今日はやらない案も含めて決めよう」'},

    { p:'face', place:'会議', relation:'同僚', line:'同僚の資料に明らかな数字の間違いがある。今は複数人が見ている。', choices:[
      {t:'「そこ間違ってます」とその場で強く指摘する',s:0,f:'内容の訂正より、面子を守る反応が先に立つ可能性がある。'},
      {t:'「この数字だけ、あとで一緒に確認してもいい？」と修正の出口を作る',s:2,f:'必要な訂正を避けず、人前で本人を小さくしない道を残している。'},
      {t:'間違いに一切触れない',s:1,f:'面子は守れるが、誤情報による実害を放置してしまう。'}], better:'「この数字だけ、あとで一緒に確認してもいい？」'},
    { p:'face', place:'チャット', relation:'後輩', line:'後輩が全体チャットで誤った案内を投稿した。まだ大きな影響は出ていない。', choices:[
      {t:'全体チャットで「違います」と即否定する',s:0,f:'訂正は必要でも、公開の場で本人の逃げ道をなくす必要はない。'},
      {t:'個別に「ここだけ修正したらOK。訂正版を出してもらえる？」と送る',s:2,f:'本人が自分で修正し、信頼を回復できる出口を残している。'},
      {t:'自分が無言で訂正文を投稿する',s:1,f:'誤りは直るが、本人の主体性と修正機会が消える。'}], better:'「ここだけ修正したらOK。訂正版を出してもらえる？」'},
    { p:'face', place:'商談', relation:'取引先', line:'取引先が以前言っていた内容と矛盾する提案をしてきた。', choices:[
      {t:'「前と言ってること違いますよね」と詰める',s:0,f:'整合性を確認する以上に、相手を「間違った人」に固定してしまう。'},
      {t:'「状況が変わった部分がありますか？ 今の前提を教えてください」',s:2,f:'矛盾を指摘しつつ、状況変化という修正可能な出口を作っている。'},
      {t:'気づかないふりをして同意する',s:1,f:'面子は守れるが、重要な前提確認を捨てている。'}], better:'「状況が変わった部分がありますか？ 今の前提を教えてください」'},

    { p:'ethics', place:'交渉', relation:'取引先', line:'相手が急いでいて、こちらに有利な条件を深く確認せず同意しそうだ。', choices:[
      {t:'急いでいるうちに署名まで進める',s:0,f:'相手の判断余地を狭めることは、協力ではなく利用に近づく。'},
      {t:'「重要条件だけ確認します。持ち帰っても大丈夫です」と選択権を明示する',s:2,f:'自分に有利でも、相手が自由に判断できる状態を守っている。'},
      {t:'条件説明はするが、断れることは言わない',s:1,f:'情報は増えるが、時間圧力の中で実質的な自由が残っているかまで見るとさらに良い。'}], better:'「重要条件だけ確認します。持ち帰っても大丈夫です」'},
    { p:'ethics', place:'マネジメント', relation:'部下', line:'部下に残業してほしい。評価を握っている立場なので、断りにくいこともわかっている。', choices:[
      {t:'「評価にも関わるから、やってくれるよね？」',s:0,f:'立場の力を使って断るコストを上げるのは、自由な協力ではない。'},
      {t:'「難しければ断って大丈夫。必要なら優先順位をこちらで調整する」',s:2,f:'立場の非対称性を自覚し、断れる出口を現実に作っている。'},
      {t:'「お願いできる？」だけ聞く',s:1,f:'形は依頼でも、断りにくい関係性まで考慮すると不十分な場合がある。'}], better:'「難しければ断って大丈夫。必要なら優先順位をこちらで調整する」'},
    { p:'ethics', place:'人間関係', relation:'友人', line:'友人の弱点を知っていて、その不安を刺激すればこちらの希望を通せそうだ。', choices:[
      {t:'不安を匂わせて希望を通す',s:0,f:'相手の弱さを操作レバーにするのは、信頼ではなく支配に近い。'},
      {t:'自分の希望を率直に伝え、相手の希望も聞く',s:2,f:'相手が自分を守る必要のない関係を優先している。'},
      {t:'自分の希望を言わず、相手に察してもらう',s:1,f:'操作は避けられるが、対等な協力に必要な情報まで隠している。'}], better:'「私はこうしたい。あなたはどうしたい？」'},
  ];

  let audioContext = null;
  const state = { sound:true, session:[], index:0, score:0, byPrinciple:{}, timer:null, locked:false };

  function loadHistory(){
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { sessions:Array.isArray(raw.sessions) ? raw.sessions.slice(-40) : [], sound:raw.sound !== false };
    } catch { return {sessions:[], sound:true}; }
  }
  let history = loadHistory();
  state.sound = history.sound;
  function saveHistory(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {} }

  function ensureAudio(){
    if (!state.sound) return null;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    } catch { return null; }
  }
  function tone(freq=440,duration=.07,gain=.024){
    const ctx = ensureAudio(); if(!ctx) return;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value=freq; g.gain.setValueAtTime(gain,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+duration);
  }
  function vibrate(pattern=8){ try { navigator.vibrate?.(pattern); } catch {} }
  function setScreen(id){
    screens.forEach(s=>s.classList.toggle('active',s.id===id));
    window.scrollTo({top:0,behavior:'auto'});
    try { window.LevelUpTelemetry?.step?.(id.replace(/Screen$/,'')); } catch {}
  }
  function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function buildSession(){
    return shuffle(Object.keys(principles)).map(p => {
      const pool=scenarios.filter(s=>s.p===p);
      return pool[Math.floor(Math.random()*pool.length)];
    });
  }
  function clearTimer(){ clearTimeout(state.timer); state.timer=null; }
  function startVisualTimer(){
    clearTimer();
    const bar=$('timerBar'); bar.classList.remove('running'); void bar.offsetWidth; bar.classList.add('running');
    state.timer=setTimeout(()=>{ if(!state.locked) $('headerProgress').textContent='THINK, DON’T RUSH'; },12000);
  }
  function renderStats(){
    if(!history.sessions.length){$('localStats').hidden=true;return;}
    $('localStats').hidden=false;
    $('sessionCount').textContent=history.sessions.length;
    $('bestScore').textContent=Math.max(...history.sessions.map(s=>Number(s.score)||0));
  }
  function startSession(){
    ensureAudio(); tone(420,.06); vibrate(8);
    state.session=buildSession(); state.index=0; state.score=0; state.byPrinciple={}; state.locked=false;
    renderQuestion();
  }
  function renderQuestion(){
    clearTimer(); state.locked=false;
    const item=state.session[state.index], p=principles[item.p];
    $('headerProgress').textContent=`${state.index+1} / 6`;
    $('principleLabel').textContent=p.label;
    $('principleTitle').textContent=p.title;
    $('questionIndex').textContent=state.index+1;
    $('scenePlace').textContent=item.place;
    $('sceneRelation').textContent=item.relation;
    $('sceneLine').textContent=item.line;
    const letters=['A','B','C'];
    $('choices').innerHTML=item.choices.map((c,i)=>`<button class="choice-btn" type="button" data-choice="${i}"><span class="choice-key">${letters[i]}</span><span class="choice-text">${c.t}</span></button>`).join('');
    setScreen('trainingScreen'); startVisualTimer();
  }
  function choose(index){
    if(state.locked) return;
    state.locked=true; clearTimer();
    const item=state.session[state.index], choice=item.choices[index], p=principles[item.p];
    const s=choice.s;
    state.score+=s;
    state.byPrinciple[item.p]=(state.byPrinciple[item.p]||0)+s;

    const symbol=$('feedbackSymbol'); symbol.className='feedback-symbol';
    if(s===2){
      symbol.textContent='◎'; $('feedbackEyebrow').textContent='GOOD JUDGMENT'; $('feedbackTitle').textContent=`${p.short}を守れた。`; tone(620,.11,.026); vibrate([8,24,8]);
    } else if(s===1){
      symbol.textContent='△'; symbol.classList.add('mid'); $('feedbackEyebrow').textContent='ALMOST'; $('feedbackTitle').textContent='悪くない。もう一歩。'; tone(430,.08,.022); vibrate(8);
    } else {
      symbol.textContent='×'; symbol.classList.add('low'); $('feedbackEyebrow').textContent='CONTROL RISK'; $('feedbackTitle').textContent='相手が「自分を守る側」に回りやすい。'; tone(240,.11,.02); vibrate([18,35,8]);
    }
    $('feedbackBody').textContent=choice.f;
    $('protectedValue').textContent=p.short;
    $('protectedWhy').textContent=`原則：${p.title}`;
    const showBetter=s<2;
    $('betterLine').hidden=!showBetter;
    $('betterText').textContent=item.better;
    $('nextLabel').textContent=state.index===5?'結果を見る':'次の場面';
    $('headerProgress').textContent=`${state.index+1} / 6 · REVIEW`;
    setScreen('feedbackScreen');
  }
  function next(){
    if(state.index>=5){ showResult(); return; }
    state.index+=1; renderQuestion();
  }
  function showResult(){
    clearTimer();
    const pct=Math.round((state.score/12)*100);
    $('totalScore').textContent=pct;
    $('scoreRing').style.setProperty('--score-angle',`${Math.round(pct*3.6)}deg`);
    let title='支配せずに、協力をつくれた。', lead='相手の自由と自己像を守るほど、協力は「従わせる」から「自分で動く」へ変わる。';
    if(pct<50){title='「動かす」より先に、守る。';lead='相手が自分を守る必要のある場面では、説得力より安全・選択・面子の設計が先。';}
    else if(pct<80){title='あと少しで、かなり自然。';lead='正しさを伝えるだけでなく、相手が自分で選べる出口を残すと関係が強くなる。';}
    $('resultTitle').textContent=title; $('resultLead').textContent=lead;

    const order=['story','role','ideal','choice','face','ethics'];
    $('skillBars').innerHTML=order.map(k=>{
      const val=state.byPrinciple[k]||0;
      const width=val===2?100:val===1?55:12;
      return `<div class="skill-row"><span>${principles[k].short}</span><div class="skill-track"><i style="width:${width}%"></i></div><b>${val}/2</b></div>`;
    }).join('');
    const weakest=[...order].sort((a,b)=>(state.byPrinciple[a]||0)-(state.byPrinciple[b]||0))[0];
    $('realActionText').textContent=principles[weakest].action;
    $('actionCopyBtn').dataset.copy=principles[weakest].copy;

    history.sessions.push({t:Date.now(),score:pct,byPrinciple:{...state.byPrinciple}});
    history.sessions=history.sessions.slice(-40); saveHistory(); renderStats();
    $('headerProgress').textContent='COMPLETE';
    setScreen('resultScreen');
    try { window.LevelUpTelemetry?.complete?.('result'); } catch {}
    tone(660,.12,.025); setTimeout(()=>tone(840,.15,.018),90);
  }
  async function copyAction(){
    const text=$('actionCopyBtn').dataset.copy||'';
    try { await navigator.clipboard.writeText(text); showToast('コピーしました'); }
    catch { showToast(text); }
  }
  function showToast(text){
    const toast=$('toast'); toast.textContent=text; toast.classList.add('on');
    clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('on'),1600);
  }

  $('startBtn').addEventListener('click',startSession);
  $('choices').addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(b)choose(Number(b.dataset.choice));});
  $('nextBtn').addEventListener('click',next);
  $('againBtn').addEventListener('click',startSession);
  $('actionCopyBtn').addEventListener('click',copyAction);
  $('soundBtn').addEventListener('click',()=>{
    state.sound=!state.sound; history.sound=state.sound; saveHistory();
    $('soundBtn').textContent=state.sound?'♪':'×';
    $('soundBtn').setAttribute('aria-pressed',String(state.sound));
    $('soundBtn').setAttribute('aria-label',state.sound?'音をオフにする':'音をオンにする');
    if(state.sound) tone(520,.06);
  });
  document.addEventListener('keydown',e=>{
    if(!$('#trainingScreen').classList.contains('active')) return;
    if(['1','2','3'].includes(e.key)) choose(Number(e.key)-1);
  });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) clearTimer(); });

  state.sound=history.sound;
  $('soundBtn').textContent=state.sound?'♪':'×';
  $('soundBtn').setAttribute('aria-pressed',String(state.sound));
  renderStats();
})();
