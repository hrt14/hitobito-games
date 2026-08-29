(() => {
  'use strict';

  const STORAGE_KEY = 'levelup.dailySpecialAbility.v1';
  const SHARE_URL = 'https://levelup.hitobito.jp/apps/daily-special-ability/';
  const DIMENSIONS = {
    detect:   { label: '違和感検知', short: 'DETECT', base: '違和感早期検知', glyph: 'D' },
    burst:    { label: '瞬間加速', short: 'BURST', base: '締切直前超加速', glyph: 'B' },
    social:   { label: '警戒解除', short: 'SOCIAL', base: '初対面警戒解除', glyph: 'S' },
    connect:  { label: '情報統合', short: 'CONNECT', base: '情報断片自動統合', glyph: 'C' },
    adapt:    { label: '即時再構築', short: 'ADAPT', base: '不測事態即時再構築', glyph: 'A' },
    simplify: { label: '経路短縮', short: 'SIMPLIFY', base: '面倒最短経路発見', glyph: 'M' },
  };

  const questions = [
    { scene:'SCENE 01 · GROUP CHAT', title:'グループチャットで、少しだけ変な言い回しが流れた。', note:'誰も触れていない。あなたは？', a:{text:'「ん？」と小さなズレがまず気になる', dim:'detect'}, b:{text:'空気が止まらないよう自然に話題をつなぐ', dim:'social'} },
    { scene:'SCENE 02 · DEADLINE', title:'締切まで、まだ一週間ある仕事。', note:'いつもの動きに近いのは？', a:{text:'材料を集めて全体像を先につくる', dim:'connect'}, b:{text:'最後の集中で一気に仕上げることが多い', dim:'burst'} },
    { scene:'SCENE 03 · FIRST MEET', title:'初対面ばかりの集まりに入った。', note:'最初の30秒でやりがちなこと。', a:{text:'誰がどういう人か静かに観察する', dim:'detect'}, b:{text:'一言投げて場の硬さをほぐす', dim:'social'} },
    { scene:'SCENE 04 · BAD BRIEF', title:'説明が足りない依頼を渡された。', note:'まず何をする？', a:{text:'散らばった情報から意図を組み立てる', dim:'connect'}, b:{text:'仮の前提で一度動き、ズレたら直す', dim:'adapt'} },
    { scene:'SCENE 05 · PLAN B', title:'予定が突然ぜんぶ崩れた。', note:'その瞬間の反応は？', a:{text:'残った手札で新しい段取りを即組む', dim:'adapt'}, b:{text:'やらなくていいものを削って軽くする', dim:'simplify'} },
    { scene:'SCENE 06 · MESSY TASK', title:'面倒な作業が、細かく散らかっている。', note:'片づけ方は？', a:{text:'最短の順番や省ける工程を見つける', dim:'simplify'}, b:{text:'短時間だけ集中モードに入って潰す', dim:'burst'} },
    { scene:'SCENE 07 · “I’M FINE”', title:'友人が「全然、大丈夫」と言った。', note:'でも少しだけ何か違う。', a:{text:'声や間の変化を拾ってしまう', dim:'detect'}, b:{text:'重くせず、話しやすい空気を作る', dim:'social'} },
    { scene:'SCENE 08 · 18 TABS', title:'タブもメモも資料も増えすぎた。', note:'頭の中ではどうする？', a:{text:'共通点を見つけて1つの構造にまとめる', dim:'connect'}, b:{text:'必要なものだけ残して一気に減らす', dim:'simplify'} },
    { scene:'SCENE 09 · SUDDEN STAGE', title:'突然「今ここで説明して」と振られた。', note:'準備はほぼゼロ。', a:{text:'その場で話す順番を組み替えて対応する', dim:'adapt'}, b:{text:'相手の反応を見ながら場を味方につける', dim:'social'} },
    { scene:'SCENE 10 · BORING WORK', title:'退屈だけど、終わらせる必要がある。', note:'突破口はどっち？', a:{text:'制限時間を決めて短距離走にする', dim:'burst'}, b:{text:'クリック数や手順そのものを減らす', dim:'simplify'} },
    { scene:'SCENE 11 · MEETING', title:'会議で、みんな同じ方向に進み始めた。', note:'でも少し引っかかる。', a:{text:'「前提が1個ずれてない？」を先に拾う', dim:'detect'}, b:{text:'論点を並べ直して、何が混ざったか見る', dim:'connect'} },
    { scene:'SCENE 12 · LAST MINUTES', title:'残り数分。想定外の問題が1つ増えた。', note:'最後に出やすい強みは？', a:{text:'状況を組み直して成立する形へ持っていく', dim:'adapt'}, b:{text:'集中出力を上げて最後の一気をかける', dim:'burst'} },
  ];

  const abilityMap = {
    'detect|social':   {name:'空気微細変化探知', code:'DS-01', tagline:'みんなが流した「ほんの少し違う」を先に拾う。', moment:'言葉・表情・場の温度が、いつもより数ミリずれたとき。'},
    'detect|connect':  {name:'矛盾先行捕捉', code:'DC-02', tagline:'話が破綻する前に、合っていない前提を見つける。', moment:'会議や説明で「それ、前の話とつながってる？」が浮かんだとき。'},
    'detect|adapt':    {name:'異常予兆即応', code:'DA-03', tagline:'小さな異常を見つけ、問題になる前に動き方を変える。', moment:'予定・仕事・人の反応に、まだ説明できない違和感が出たとき。'},
    'detect|burst':    {name:'危険箇所瞬間集中', code:'DB-04', tagline:'怪しい一点を見つけると、そこだけ処理速度が跳ね上がる。', moment:'締切前に「ここを落とすと全部まずい」が見えたとき。'},
    'detect|simplify': {name:'無駄ノイズ自動除去', code:'DM-05', tagline:'違和感の正体を見つけ、いらない複雑さごと消していく。', moment:'手順や会話に「なんでこれ必要？」が混ざっているとき。'},
    'burst|adapt':     {name:'緊急時性能上限解除', code:'BA-06', tagline:'平常時より、想定外＋残り時間わずかで妙に強い。', moment:'時間がない、予定が崩れた、それでも形にする必要があるとき。'},
    'burst|simplify':  {name:'締切直前超加速', code:'BM-07', tagline:'残り時間が見えた瞬間、迷いと余計な工程が消える。', moment:'「あと30分」が現実になり、やることが急に一本に絞れたとき。'},
    'burst|connect':   {name:'終盤情報圧縮', code:'BC-08', tagline:'散らかった材料を、締切直前に一つの答えへ圧縮する。', moment:'材料はある。あとは一気に意味をつなげて出すだけ、というとき。'},
    'burst|social':    {name:'土壇場場力増幅', code:'BS-09', tagline:'人がいる本番ほど、瞬間的に出力が上がる。', moment:'突然振られた説明・発表・会話で、逃げ場がなくなったとき。'},
    'social|adapt':    {name:'場温度即時調整', code:'SA-10', tagline:'空気が変わっても、その場に合う温度へすぐ合わせ直す。', moment:'予定外の人・話題・反応が入って、場が一瞬固まったとき。'},
    'social|simplify': {name:'会話摩擦自動低減', code:'SM-11', tagline:'言いにくいことを、相手が受け取りやすい形まで軽くする。', moment:'このまま言うと重い。でも言わないのも違う、というとき。'},
    'social|connect':  {name:'人間関係点線接続', code:'SC-12', tagline:'人と人、話と話の間に自然な橋を一本かける。', moment:'共通点があるのに、まだ誰もその接点に気づいていないとき。'},
    'connect|adapt':   {name:'混線状況即時構造化', code:'CA-13', tagline:'情報が増えるほど、何が本筋かを組み直して進める。', moment:'話・条件・予定が同時に変わり、全員が少し混乱しているとき。'},
    'connect|simplify':{name:'複雑系要点圧縮', code:'CM-14', tagline:'ごちゃごちゃした話を「つまり3つ」に変える。', moment:'説明が長い、資料が多い、でも本当に必要な論点は少ないとき。'},
    'connect|burst':   {name:'断片情報高速結晶化', code:'CB-15', tagline:'バラバラの材料から、短時間で一つの形を作り上げる。', moment:'考える材料は揃ったのに、まだ誰も答えにしていないとき。'},
    'adapt|simplify':  {name:'プランB瞬時生成', code:'AM-16', tagline:'予定が壊れたら、より軽い別ルートをその場で作る。', moment:'元の計画を守るより、違うやり方で目的だけ取る方が早いとき。'},
    'adapt|social':    {name:'空気急変軟着陸', code:'AS-17', tagline:'場が乱れても、人を置いていかずに着地させる。', moment:'想定外の発言や変更で、誰かが困り始めたとき。'},
    'adapt|burst':     {name:'不測事態即時再構築', code:'AB-18', tagline:'壊れた予定を見て止まらず、その場で成立する形へ作り直す。', moment:'想定外が起きたのに、止める選択肢がないとき。'},
    'simplify|burst':  {name:'面倒最短経路発見', code:'MB-19', tagline:'面倒を見た瞬間、「もっと短くできる」が勝手に始まる。', moment:'手数が多い、待ち時間が長い、同じことを繰り返しているとき。'},
    'simplify|connect':{name:'手順自動圧縮', code:'MC-20', tagline:'複数の工程をまとめ、少ない手数で同じ結果へ持っていく。', moment:'工程表を見て「これとこれは一緒にできる」が見えたとき。'},
    'simplify|social': {name:'気まずさ回避経路生成', code:'MS-21', tagline:'余計な摩擦を増やさず、自然に話を前へ進める。', moment:'断る・頼む・切り上げるなど、少し言いにくい場面。'},
  };

  const $ = (id) => document.getElementById(id);
  const screens = ['startScreen','questionScreen','revealScreen','resultScreen'];
  let index = 0;
  let answers = [];
  let currentResult = null;
  let previousResult = loadSaved();
  let revealTimer = null;

  function showScreen(id){ screens.forEach(s => $(s).classList.toggle('active', s === id)); window.scrollTo({top:0,behavior:'instant'}); }
  function scoresFromAnswers(){ const s=Object.fromEntries(Object.keys(DIMENSIONS).map(k=>[k,0])); answers.forEach(dim=>{ if(dim) s[dim]+=1; }); return s; }
  function ranked(scores){ const order=Object.keys(DIMENSIONS); return order.sort((a,b)=>scores[b]-scores[a] || order.indexOf(a)-order.indexOf(b)); }
  function pairKey(a,b){ return abilityMap[`${a}|${b}`] ? `${a}|${b}` : abilityMap[`${b}|${a}`] ? `${b}|${a}` : `${a}|${b}`; }
  function loadSaved(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null} }
  function saveResult(result){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...result,savedAt:new Date().toISOString()}))}catch{} }
  function pulse(ms=18){ try{navigator.vibrate?.(ms)}catch{} }

  function start(){ clearTimeout(revealTimer); index=0; answers=[]; currentResult=null; renderQuestion(); showScreen('questionScreen'); }
  function renderQuestion(){
    const q=questions[index];
    $('progressText').textContent=`${String(index+1).padStart(2,'0')} / ${questions.length}`;
    $('progressBar').style.width=`${((index+1)/questions.length)*100}%`;
    $('signalText').textContent='SCANNING'; $('signalGlyph').textContent='+';
    $('sceneLabel').textContent=q.scene; $('questionTitle').textContent=q.title; $('questionNote').textContent=q.note;
    $('backBtn').hidden=index===0;
    $('choices').innerHTML='';
    [q.a,q.b].forEach((choice,n)=>{
      const btn=document.createElement('button'); btn.type='button'; btn.className='choice';
      btn.innerHTML=`<small>ROUTE ${n===0?'A':'B'}</small><strong>${choice.text}</strong><span class="choice-signal">${DIMENSIONS[choice.dim].short}</span>`;
      btn.addEventListener('click',()=>choose(choice.dim,btn)); $('choices').appendChild(btn);
    });
  }
  function choose(dim,btn){
    if(btn.disabled) return; [...$('choices').children].forEach(el=>el.disabled=true); btn.classList.add('selected');
    $('signalText').textContent=`+ ${DIMENSIONS[dim].short}`; $('signalGlyph').textContent=DIMENSIONS[dim].glyph;
    document.querySelector('.scanner-panel').classList.add('flash'); pulse(); answers[index]=dim;
    setTimeout(()=>{ document.querySelector('.scanner-panel').classList.remove('flash'); if(index<questions.length-1){index++;renderQuestion()}else{reveal()} },220);
  }
  function goBack(){ if(index<=0)return; answers.splice(index,1); index--; renderQuestion(); }
  function reveal(){
    showScreen('revealScreen');
    const scores=scoresFromAnswers(); const order=ranked(scores);
    $('signalGrid').innerHTML=order.map((k,i)=>`<span class="${i<2?'on':''}">${DIMENSIONS[k].short}<br>${scores[k]} SIGNAL</span>`).join('');
    revealTimer=setTimeout(()=>showResult(buildResult(scores,order)),850);
  }
  function buildResult(scores,order){
    const primary=order[0], secondary=order[1];
    const ability=abilityMap[pairKey(primary,secondary)] || {name:DIMENSIONS[primary].base,code:`${DIMENSIONS[primary].short}-00`,tagline:'いつもの行動に、名前をつけると強さが見える。',moment:'その強みを無意識に使っている日常の瞬間。'};
    return {primary,secondary,scores,ability};
  }
  function showResult(result,fromSaved=false){
    currentResult=result; const {primary,secondary,scores,ability}=result;
    $('abilityCode').textContent=ability.code; $('abilityInitial').textContent=DIMENSIONS[primary].glyph;
    $('abilityName').textContent=ability.name; $('abilityTagline').textContent=ability.tagline; $('activationMoment').textContent=ability.moment;
    $('subAbility').textContent=DIMENSIONS[secondary].base;
    const max=Math.max(...Object.values(scores),1);
    $('meters').innerHTML=Object.keys(DIMENSIONS).map(k=>{const pct=Math.round((scores[k]/max)*100);return `<div class="meter"><span class="meter-label">${DIMENSIONS[k].label}</span><span class="meter-track"><b data-width="${pct}"></b></span><span class="meter-value">${scores[k]}</span></div>`}).join('');
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('.meter-track b').forEach(b=>b.style.width=`${b.dataset.width}%`)));
    if(!fromSaved){
      if(previousResult?.ability?.name && previousResult.ability.name!==ability.name){$('previousNote').hidden=false;$('previousNote').textContent=`前回：${previousResult.ability.name} → 今回：${ability.name}`;} else {$('previousNote').hidden=true;}
      saveResult(result); previousResult={...result};
    } else {$('previousNote').hidden=true;}
    $('lastResultBtn').hidden=false; showScreen('resultScreen');
  }
  function shareText(){ const r=currentResult; return `私の日常特殊能力は\n【${r.ability.name}】\n「${r.ability.tagline}」\n副能力：${DIMENSIONS[r.secondary].base}\n\n#日常特殊能力診断 #LEVELUP\n${SHARE_URL}`; }
  async function share(){
    if(!currentResult)return;
    try{ if(navigator.share){await navigator.share({title:'あなたの日常特殊能力診断',text:shareText(),url:SHARE_URL});return;} await navigator.clipboard.writeText(shareText()); toast('結果をコピーしました'); }
    catch(err){ if(err?.name!=='AbortError') fallbackCopy(); }
  }
  function fallbackCopy(){ const ta=document.createElement('textarea');ta.value=shareText();ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('結果をコピーしました')}catch{toast('コピーできませんでした')}ta.remove(); }
  function toast(message){ const el=$('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800); }

  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){
    const chars=[...text]; let line='',lines=[];
    for(const ch of chars){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch}else line=test}
    if(line)lines.push(line); lines=lines.slice(0,maxLines); lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight)); return y+lines.length*lineHeight;
  }
  function drawShareCard(){
    const c=$('shareCanvas'),ctx=c.getContext('2d'),r=currentResult; ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='#07100c';ctx.fillRect(0,0,1080,1350);
    ctx.strokeStyle='rgba(183,255,69,.18)';ctx.lineWidth=1; for(let x=40;x<1080;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1350);ctx.stroke()}for(let y=40;y<1350;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1080,y);ctx.stroke()}
    ctx.strokeStyle='#b7ff45';ctx.lineWidth=3;ctx.strokeRect(58,58,964,1234);
    ctx.fillStyle='#91a097';ctx.font='700 26px system-ui,sans-serif';ctx.fillText(`ABILITY // ${r.ability.code}`,96,116);ctx.textAlign='right';ctx.fillText('LEVEL UP',984,116);ctx.textAlign='left';
    ctx.strokeStyle='rgba(183,255,69,.32)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(540,330,150,0,Math.PI*2);ctx.stroke();ctx.setLineDash([10,12]);ctx.beginPath();ctx.arc(540,330,108,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#b7ff45';ctx.font='900 168px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(DIMENSIONS[r.primary].glyph,540,388);ctx.textAlign='left';
    ctx.fillStyle='#66ffc2';ctx.font='800 25px system-ui,sans-serif';ctx.fillText('あなたの日常特殊能力',96,540);
    ctx.fillStyle='#edf6f0';ctx.font='900 72px system-ui,sans-serif';let y=wrapCanvasText(ctx,r.ability.name,96,640,888,82,2);
    ctx.fillStyle='#aab8ae';ctx.font='500 32px system-ui,sans-serif';y=wrapCanvasText(ctx,r.ability.tagline,96,y+32,888,48,3);
    ctx.fillStyle='#718077';ctx.font='700 22px system-ui,sans-serif';ctx.fillText('発動する瞬間',96,y+42);ctx.fillStyle='#edf6f0';ctx.font='700 28px system-ui,sans-serif';y=wrapCanvasText(ctx,r.ability.moment,96,y+88,888,42,3);
    ctx.fillStyle='rgba(183,255,69,.10)';ctx.fillRect(96,y+26,888,86);ctx.fillStyle='#91a097';ctx.font='700 20px system-ui,sans-serif';ctx.fillText('副能力',124,y+60);ctx.fillStyle='#b7ff45';ctx.font='800 30px system-ui,sans-serif';ctx.textAlign='right';ctx.fillText(DIMENSIONS[r.secondary].base,956,y+78);ctx.textAlign='left';
    ctx.fillStyle='#66736b';ctx.font='600 20px system-ui,sans-serif';ctx.fillText('遊びの自己診断 / levelup.hitobito.jp',96,1248);
    return c;
  }
  async function saveImage(){
    if(!currentResult)return; const c=drawShareCard();
    c.toBlob(async blob=>{if(!blob){toast('画像を作れませんでした');return} const file=new File([blob],`daily-special-ability-${currentResult.ability.code}.png`,{type:'image/png'});
      try{if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],title:'私の日常特殊能力'});return}}catch(err){if(err?.name==='AbortError')return}
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('結果カードを保存しました');
    },'image/png');
  }

  $('startBtn').addEventListener('click',start); $('backBtn').addEventListener('click',goBack); $('againBtn').addEventListener('click',start); $('shareBtn').addEventListener('click',share); $('saveImageBtn').addEventListener('click',saveImage);
  $('lastResultBtn').addEventListener('click',()=>{const saved=loadSaved();if(saved?.ability)showResult(saved,true);});
  $('lastResultBtn').hidden=!previousResult?.ability;
})();
