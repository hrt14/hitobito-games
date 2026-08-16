const SKILLS = [
  {id:'plain', name:'短く断る', desc:'理由を盛らず、結論を先に伝える。'},
  {id:'thanks', name:'感謝＋断る', desc:'好意は受け取り、依頼は受け取らない。'},
  {id:'limit', name:'範囲限定', desc:'全部ではなく、できる範囲だけ提示する。'},
  {id:'schedule', name:'条件を変える', desc:'期限や量を変えれば可能な時に使う。'},
  {id:'priority', name:'優先順位を返す', desc:'何を後ろに回すか、依頼者に選んでもらう。'},
  {id:'broken', name:'同じ結論を繰り返す', desc:'説得されても、新しい言い訳を足さない。'},
  {id:'noReason', name:'理由なしで断る', desc:'説明する義務がない場面では、説明しすぎない。'},
  {id:'refer', name:'適任へ返す', desc:'抱えず、役割の合う人や窓口へ戻す。'},
  {id:'paid', name:'条件を明確にする', desc:'無料追加や範囲外依頼を、条件交渉に変える。'},
  {id:'boundary', name:'境界線を宣言する', desc:'繰り返される依頼には、今後の扱いまで明確にする。'},
  {id:'pause', name:'即答しない', desc:'その場の圧力から離れて判断時間を作る。'},
  {id:'care', name:'関係と拒否を分ける', desc:'相手を拒絶せず、今回の依頼だけ断る。'}
];

const SCENARIOS = [
  {
    id:1, level:1, person:'同僚・佐藤', relation:'同僚', pressure:'低', skin:'#efc1a1', hair:'#2d3442', shirt:'#2f9ccb',
    text:'今日のこの集計、ついでにお願いしてもいい？',
    push:'ほんと10分くらいで終わると思うんだけど…だめ？',
    choices:[
      {t:'今日は自分の締切があるので、今回はできません。', type:'短く断る', score:3, b:8, r:4, skill:'plain', tip:'「できるかも」を残さず、短く結論を伝えています。'},
      {t:'えっと…時間があれば見ておきます。', type:'先送り', score:0, b:-9, r:1, tip:'曖昧な返事は、相手にも自分にも「まだ可能性あり」と残ります。'},
      {t:'無理。自分でやって。', type:'強すぎる', score:1, b:7, r:-8, tip:'境界線は守れますが、関係コストが大きすぎます。'}]
  },
  {
    id:2, level:1, person:'友人・ミキ', relation:'友人', pressure:'低', skin:'#eab996', hair:'#6a3f36', shirt:'#d96687',
    text:'今夜飲みに行こうよ。久しぶりだし！',
    push:'えー、1杯だけでも来ない？みんな来るよ。',
    choices:[
      {t:'誘ってくれてありがとう。今日は行かないよ。また今度！', type:'感謝＋断る', score:3, b:7, r:6, skill:'thanks', tip:'好意への感謝と、参加しない判断を分けています。'},
      {t:'今日はちょっと…たぶん無理かな。', type:'ぼかす', score:1, b:-3, r:2, tip:'「たぶん」が入ると交渉の余地が生まれ、押し返されやすくなります。'},
      {t:'行きたくない。', type:'強すぎる', score:1, b:8, r:-7, tip:'本音でも、関係を残したい相手には言い方の選択肢があります。'}]
  },
  {
    id:3, level:1, person:'先輩・田中', relation:'先輩', pressure:'中', skin:'#efc39f', hair:'#212936', shirt:'#6577d6',
    text:'この資料、全部整えておいてくれる？',
    push:'全部じゃないと困るんだけど。今日だけお願い。',
    choices:[
      {t:'全部は難しいですが、数字の確認までならできます。', type:'範囲限定', score:3, b:8, r:4, skill:'limit', tip:'ゼロか100かにせず、自分が引き受ける範囲を明確にしています。'},
      {t:'わかりました。なんとかします。', type:'引き受ける', score:0, b:-12, r:4, tip:'関係を守るために自分の余白を差し出すと、次も同じ依頼が来やすくなります。'},
      {t:'それ、私の仕事じゃないですよね。', type:'刺す', score:1, b:7, r:-7, tip:'論点は正しくても、相手を責める形にすると関係コストが上がります。'}]
  },
  {
    id:4, level:2, person:'上司・鈴木', relation:'上司', pressure:'中', skin:'#d8a984', hair:'#1d2635', shirt:'#426b94',
    text:'この分析、今日中に追加できる？',
    push:'明日の会議で使いたいんだ。今の仕事と両方なんとかならない？',
    choices:[
      {t:'追加するなら今のA案件が明日にずれます。どちらを優先しますか？', type:'優先順位を返す', score:3, b:9, r:6, skill:'priority', tip:'「できません」で終えず、仕事量のトレードオフを上司の判断に戻しています。'},
      {t:'たぶん夜までやれば両方できます。', type:'自己犠牲', score:0, b:-14, r:5, tip:'短期では評価されても、無限に仕事を足せる人だと学習されます。'},
      {t:'無理です。', type:'結論だけ', score:2, b:8, r:-1, skill:'plain', tip:'断れてはいますが、上司との業務調整では条件を見せるとさらに強いです。'}]
  },
  {
    id:5, level:2, person:'取引先・高橋', relation:'取引先', pressure:'中', skin:'#efbd9f', hair:'#3a2f2c', shirt:'#9c6b4f',
    text:'この修正も、今回の費用内でお願いできますよね？',
    push:'前回は似たようなのやってもらえましたよね？',
    choices:[
      {t:'今回は契約範囲外なので、追加対応としてお見積りします。', type:'条件を明確にする', score:3, b:10, r:5, skill:'paid', tip:'断るか受けるかではなく、条件のある仕事として扱い直しています。'},
      {t:'今回だけなら…。', type:'例外化', score:0, b:-13, r:4, tip:'「今回だけ」は、次回の前例になります。'},
      {t:'契約読んでください。', type:'刺す', score:1, b:8, r:-9, tip:'正しさだけで押すと、不要な対立を作ります。'}]
  },
  {
    id:6, level:2, person:'家族', relation:'家族', pressure:'中', skin:'#efc4a7', hair:'#4a302c', shirt:'#8f72cf',
    text:'日曜、これ手伝ってくれるよね？空いてるでしょ？',
    push:'家族なんだから、それくらいやってくれてもいいじゃない。',
    choices:[
      {t:'日曜は休む日にしてるから、今回はやらないよ。', type:'理由なしで断る', score:3, b:9, r:4, skill:'noReason', tip:'長い弁明をせず、自分の予定も「予定」として扱えています。'},
      {t:'午前だけなら手伝えるよ。', type:'範囲限定', score:2, b:5, r:6, skill:'limit', tip:'本当に午前ならよい場合は有効です。嫌なのに譲るなら境界線が崩れます。'},
      {t:'家族って言えば何でも頼めると思わないで。', type:'反撃', score:1, b:8, r:-10, tip:'依頼だけでなく相手そのものを攻撃すると、話題が「手伝うか」から喧嘩に変わります。'}]
  },
  {
    id:7, level:3, person:'営業・山本', relation:'営業', pressure:'高', skin:'#dcae8c', hair:'#232a36', shirt:'#3f8b77',
    text:'5分だけでいいので、今ここで説明させてください。',
    push:'聞くだけで結構です。絶対に損はさせません。',
    choices:[
      {t:'必要ありません。失礼します。', type:'同じ結論を繰り返す', score:3, b:10, r:2, skill:'broken', tip:'説得に一つずつ反論せず、最初の結論を保っています。'},
      {t:'今忙しいので、また今度…。', type:'先送り', score:0, b:-8, r:2, tip:'「今は」は、相手に「後ならよい」と解釈されます。'},
      {t:'しつこいです！', type:'感情で反撃', score:1, b:7, r:-4, tip:'危険がない場面なら、感情を上げずに会話を終了できます。'}]
  },
  {
    id:8, level:3, person:'後輩・中村', relation:'後輩', pressure:'中', skin:'#f0c1a1', hair:'#40362f', shirt:'#c77f4f',
    text:'この仕事、先輩の方が早いので代わりにやってもらえませんか？',
    push:'やり方だけでも全部見てもらえたら助かるんですが…。',
    choices:[
      {t:'代わりにはやらないよ。最初の10分だけ一緒に確認しよう。', type:'範囲限定', score:3, b:9, r:7, skill:'limit', tip:'相手の成長を奪わず、必要な支援だけ切り出しています。'},
      {t:'じゃあ今回だけやるよ。', type:'肩代わり', score:0, b:-12, r:6, tip:'優しさが、次も「先輩に頼めばよい」という学習になります。'},
      {t:'自分で考えて。', type:'突き放す', score:1, b:8, r:-8, tip:'断ることと、育成を放棄することは別です。'}]
  },
  {
    id:9, level:3, person:'別部署・加藤', relation:'社内', pressure:'高', skin:'#e8b793', hair:'#252b31', shirt:'#596cc7',
    text:'急ぎなんです。あなたが一番詳しいので、今日中に対応してください。',
    push:'担当が誰かは置いておいて、とにかく今だけ助けてもらえませんか？',
    choices:[
      {t:'この件は担当窓口から依頼してください。私から直接は受けません。', type:'適任へ返す', score:3, b:10, r:4, skill:'refer', tip:'能力があることと、自分が担当することを分離しています。'},
      {t:'急ぎなら仕方ないですね。', type:'緊急に負ける', score:0, b:-13, r:3, tip:'相手の「急ぎ」が、自分の最優先になるとは限りません。'},
      {t:'知りません。', type:'遮断', score:1, b:8, r:-7, tip:'窓口を示せるなら、関係を壊さずに返せます。'}]
  },
  {
    id:10, level:4, person:'役員', relation:'役員', pressure:'高', skin:'#d6a582', hair:'#1c222d', shirt:'#293c52',
    text:'来週の新企画、君がオーナーでやってくれないか？',
    push:'期待してるんだよ。今の仕事も大事だけど、成長のチャンスだと思って。',
    choices:[
      {t:'お声がけありがとうございます。今の担当との入れ替え条件を確認して、明日返答します。', type:'即答しない＋条件', score:3, b:10, r:7, skills:['pause','schedule'], tip:'魅力や圧力が強い依頼ほど、その場でYES/NOを決めず、条件を整理する時間を取れます。'},
      {t:'ぜひやります！', type:'反射で受ける', score:0, b:-15, r:7, tip:'魅力的な依頼ほど「何をやめるか」を同時に決めないとWIPが増えます。'},
      {t:'忙しいので無理です。', type:'結論だけ', score:2, b:7, r:0, skill:'plain', tip:'断れてはいますが、魅力ある依頼では条件変更という選択肢もあります。'}]
  },
  {
    id:11, level:4, person:'常連クライアント', relation:'取引先', pressure:'高', skin:'#edbd9d', hair:'#44332d', shirt:'#3c8e95',
    text:'ちょっと相談だけ。30分くらい電話できません？',
    push:'いつもお願いしてる仲だし、正式な依頼にするほどでもない話なんです。',
    choices:[
      {t:'相談は契約時間内でお受けしています。次回定例で扱いましょう。', type:'境界線を宣言する', score:3, b:10, r:6, skill:'boundary', tip:'今回だけでなく、今後も使えるルールにしています。'},
      {t:'30分だけなら大丈夫です。', type:'無料で受ける', score:0, b:-12, r:5, tip:'「相談だけ」が積み重なると、時間の境界が消えます。'},
      {t:'無料相談はしてません。', type:'強め', score:2, b:9, r:-3, skill:'plain', tip:'内容は明確ですが、継続関係では既存の枠へ戻す方が滑らかです。'}]
  },
  {
    id:12, level:4, person:'自分の頭の声', relation:'自分', pressure:'最高', skin:'#d7b69d', hair:'#253248', shirt:'#47617e',
    text:'頼られてるんだから、やった方がいいんじゃない？',
    push:'断ったら「感じ悪い人」だと思われるかもしれないよ？',
    choices:[
      {t:'頼られることと、引き受けることは別。今回はやらない。', type:'境界線', score:3, b:12, r:6, skill:'care', tip:'「いい人でいたい」と「全部引き受ける」を分けられています。'},
      {t:'そうだよね。やっておこう。', type:'自動承諾', score:0, b:-15, r:3, tip:'相手がいなくても、自分の中の圧力で引き受けてしまうことがあります。'},
      {t:'もう誰にも頼られたくない。', type:'極端', score:1, b:6, r:-6, tip:'目標は人を遠ざけることではなく、自分で選べることです。'}]
  }
];

const state = {
  screen:'home', index:0, boundary:60, relation:70, xp:0,
  unlocked:new Set(JSON.parse(localStorage.getItem('kotowaru-unlocked') || '["plain"]')),
  seen:Number(localStorage.getItem('kotowaru-seen') || 0),
  best:Number(localStorage.getItem('kotowaru-best') || 0),
  roundScore:0, pushMode:false, feedback:null, audio: localStorage.getItem('kotowaru-audio') !== 'off'
};
const app = document.querySelector('#app');

function clamp(n){ return Math.max(0, Math.min(100,n)); }
function buzz(ms=20){ if(navigator.vibrate) navigator.vibrate(ms); }
function tone(kind='ok'){
  if(!state.audio) return;
  try{
    const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC(); const o=ctx.createOscillator(); const g=ctx.createGain();
    o.type='sine'; o.frequency.value = kind==='ok'?660:kind==='great'?820:220; g.gain.value=.035; o.connect(g);g.connect(ctx.destination);o.start();
    o.frequency.exponentialRampToValueAtTime(kind==='great'?1040:kind==='ok'?760:180,ctx.currentTime+.12); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);o.stop(ctx.currentTime+.17);
  }catch(e){}
}
function save(){
  localStorage.setItem('kotowaru-unlocked', JSON.stringify([...state.unlocked]));
  localStorage.setItem('kotowaru-seen', String(state.seen));
  localStorage.setItem('kotowaru-best', String(state.best));
  localStorage.setItem('kotowaru-audio', state.audio?'on':'off');
}
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.append(el); setTimeout(()=>el.remove(),1500); }
function skillBy(id){return SKILLS.find(s=>s.id===id)}
function stageName(level){ return ['','まず断る','押し返しに耐える','役割を守る','圧力の中で選ぶ'][level] || '実戦'; }

function shell(inner){ return `<section class="screen">${inner}</section>`; }
function render(){
  if(state.screen==='home') renderHome();
  else if(state.screen==='game') renderGame();
  else if(state.screen==='collection') renderCollection();
  else if(state.screen==='summary') renderSummary();
}
function header(){
  return `<div class="brand"><div class="logo">断る<span>。</span></div><button class="icon-btn" id="soundBtn" aria-label="サウンド切替">${state.audio?'♪':'×'}</button></div>`;
}
function bindHeader(){ const b=document.querySelector('#soundBtn'); if(b) b.onclick=()=>{state.audio=!state.audio;save();render();}; }

function renderHome(){
  app.innerHTML=shell(`${header()}
    <div class="hero">
      <div class="eyebrow">3 MINUTES / BOUNDARY TRAINING</div>
      <h1>100回断れば、<br>現実でも言える。</h1>
      <p>頼みごとを断るほど、使える「断り方」が増えていく。知識ではなく、言葉がすぐ出てくる反射を鍛えるゲーム。</p>
      <div class="hero-visual"><div class="orb a"></div><div class="orb b"></div><div class="avatar-big"><div class="avatar-head"></div><div class="avatar-hair"></div><div class="avatar-body"></div></div><div class="shield"></div></div>
      <button class="primary-btn" id="startBtn">今日の12人を断る</button>
      <button class="secondary-btn" id="collectionBtn">断り方コレクション　${state.unlocked.size}/${SKILLS.length}</button>
      <div class="micro">断った累計 ${state.seen}回　・　ベスト ${state.best}点</div>
    </div>`);
  bindHeader();
  document.querySelector('#startBtn').onclick=()=>startGame();
  document.querySelector('#collectionBtn').onclick=()=>{state.screen='collection';render();};
}

function startGame(){
  state.screen='game'; state.index=0; state.boundary=60; state.relation=70; state.roundScore=0; state.pushMode=false; state.feedback=null; render();
}

function current(){ return SCENARIOS[state.index]; }
function renderGame(){
  const s=current(); if(!s){state.screen='summary';return render();}
  const pct=((state.index)/SCENARIOS.length)*100;
  app.innerHTML=shell(`${header()}
    <div class="topbar">
      <div class="progress-wrap">
        <div class="stage-line"><span>STAGE ${s.level}　${stageName(s.level)}</span><b>${state.index+1}/${SCENARIOS.length}</b></div>
        <div class="progress"><div style="width:${pct}%"></div></div>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-label"><span>境界線</span><b>${state.boundary}</b></div><div class="meter boundary"><div style="width:${state.boundary}%"></div></div></div>
      <div class="stat"><div class="stat-label"><span>関係</span><b>${state.relation}</b></div><div class="meter relation"><div style="width:${state.relation}%"></div></div></div>
    </div>
    <div class="scene">
      <div class="context-row"><span class="tag">${s.relation}</span><span class="tag ${s.pressure==='高'||s.pressure==='最高'?'danger':''}">圧力 ${s.pressure}</span>${state.pushMode?'<span class="tag danger">押し返された</span>':''}</div>
      <div class="person-stage">
        <div class="person-card" style="--skin:${s.skin};--hair:${s.hair};--shirt:${s.shirt}"><div class="face"></div><div class="torso"></div><div class="person-name">${s.person}</div></div>
        <div class="bubble ${state.pushMode?'pushback':''}">${state.pushMode?s.push:s.text}</div>
      </div>
      <div class="instruction"><strong>${state.pushMode?'もう一度、結論を守る。':'どう返す？'}</strong><span>${state.pushMode?'言い訳を増やさない':'関係も、自分の時間も守る'}</span></div>
      <div class="choices">${renderChoices(s)}</div>
    </div>`);
  bindHeader();
  document.querySelectorAll('.choice').forEach((b,i)=>b.onclick=()=>choose(i));
}
function renderChoices(s){
  if(state.pushMode){
    const good = pushbackChoice(s);
    return [good,
      {t:'…わかった。そこまで言うならやるよ。',type:'折れる',score:0,b:-12,r:3,tip:'押し返された瞬間に撤回すると、「押せば通る」と相手が学習します。'},
      {t:'だから無理って言ってるでしょ！',type:'怒る',score:1,b:7,r:-7,tip:'同じ結論を静かに繰り返す方が、境界線は強くなります。'}
    ].map((c,i)=>`<button class="choice" data-i="${i}"><span class="choice-text">${c.t}</span><span class="choice-type">${c.type}</span></button>`).join('');
  }
  return s.choices.map((c,i)=>`<button class="choice" data-i="${i}"><span class="choice-text">${c.t}</span><span class="choice-type">${c.type}</span></button>`).join('');
}
function pushbackChoice(s){
  const base = s.choices.find(c=>c.score===3);
  const t = base.t.replace(/。?$/,'。');
  return {t, type:'結論を保つ', score:3, b:9, r:4, skill:'broken', tip:'押し返されても新しい理由を足さず、同じ意思を保てました。'};
}
function choose(i){
  const s=current(); const pool=state.pushMode?[pushbackChoice(s),{t:'',score:0,b:-12,r:3,tip:'押し返された瞬間に撤回すると、「押せば通る」と相手が学習します。'},{t:'',score:1,b:7,r:-7,tip:'同じ結論を静かに繰り返す方が、境界線は強くなります。'}]:s.choices;
  const c=pool[i]; buzz(c.score===3?30:16); tone(c.score===3?'great':c.score===0?'bad':'ok');
  state.boundary=clamp(state.boundary+c.b); state.relation=clamp(state.relation+c.r); state.roundScore+=c.score;
  let newly=[];
  const gained=[...(c.skill?[c.skill]:[]), ...(c.skills||[])];
  gained.forEach(id=>{ if(!state.unlocked.has(id)){ state.unlocked.add(id); newly.push(skillBy(id)); } });
  state.seen++; save();
  const shouldPush = !state.pushMode && c.score>=2 && s.level>=2 && [4,5,6,7,9,10,11,12].includes(s.id);
  state.feedback={c,newly,shouldPush}; showFeedback();
}
function showFeedback(){
  const {c,newly,shouldPush}=state.feedback;
  const grade=c.score===3?'◎':c.score===2?'○':c.score===1?'△':'×';
  const title=c.score===3?'いい断り方':c.score===2?'断れている':c.score===1?'惜しい':'境界線が消えた';
  const bText=(c.b>=0?'+':'')+c.b; const rText=(c.r>=0?'+':'')+c.r;
  const overlay=document.createElement('div'); overlay.className='feedback-overlay'; overlay.innerHTML=`<div class="feedback-card">
    <div class="grade"><div class="grade-badge">${grade}</div><div><h2>${title}</h2><p>${shouldPush?'でも相手は、もう一度押してくる。':''}</p></div></div>
    <div class="lesson"><div class="lesson-title">WHY</div><div class="lesson-text">${c.tip}</div></div>
    <div class="delta-row"><div class="delta">境界線<br><b>${bText}</b></div><div class="delta">関係<br><b>${rText}</b></div></div>
    ${newly.length?`<div class="unlock"><small>NEW PHRASE UNLOCKED</small>${newly.map(n=>`<strong style="display:block;margin-top:4px">「${n.name}」</strong><div style="font-size:11px;color:#b9c7d5;margin:4px 0 8px">${n.desc}</div>`).join('')}</div>`:''}
    <button class="primary-btn" id="nextBtn">${shouldPush?'押し返しに答える':'次の依頼へ'}</button>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector('#nextBtn').onclick=()=>{
    overlay.remove();
    if(shouldPush){ state.pushMode=true; state.feedback=null; render(); }
    else { state.pushMode=false; state.feedback=null; state.index++; render(); }
  };
}

function renderCollection(){
  app.innerHTML=shell(`${header()}<div style="margin-top:28px"><div class="eyebrow">PHRASE DECK</div><h1 style="margin:8px 0 6px;font-size:30px">断り方コレクション</h1><p style="margin:0;color:var(--muted);font-size:13px;line-height:1.6">ゲームで使った「断る型」が残る。言葉ではなく型を覚えると、状況が変わっても使える。</p>
    <div class="collection-grid">${SKILLS.map((s,i)=>`<div class="skill-card ${state.unlocked.has(s.id)?'':'locked'}"><div class="skill-num">NO.${String(i+1).padStart(2,'0')}</div><h3>${state.unlocked.has(s.id)?s.name:'？？？'}</h3><p>${state.unlocked.has(s.id)?s.desc:'実戦で使うと解放される'}</p></div>`).join('')}</div>
    <button class="secondary-btn" id="backBtn" style="margin-top:18px">戻る</button></div>`);
  bindHeader(); document.querySelector('#backBtn').onclick=()=>{state.screen='home';render();};
}

function renderSummary(){
  const max=SCENARIOS.length*3 + 8*3; // pushback max for 8 scenarios
  const score=Math.round((state.roundScore/max)*100);
  state.best=Math.max(state.best,score); save();
  const label = state.boundary>=80 && state.relation>=65 ? 'しなやかな境界線' : state.boundary>=80 ? '強い境界線' : state.relation>=75 ? '配慮型' : '練習中';
  app.innerHTML=shell(`${header()}<div class="summary"><div class="eyebrow">TODAY'S RESULT</div><h1>${label}</h1><p>断ることは、関係を切ることではない。今日のプレイでは「自分の時間」と「相手との関係」を同時に守る練習をした。</p>
    <div class="score-ring" style="--deg:${score*3.6}deg"><div><b>${score}</b><small>MASTER SCORE</small></div></div>
    <div class="summary-list">
      <div class="summary-item"><span>境界線</span><b>${state.boundary}/100</b></div>
      <div class="summary-item"><span>関係</span><b>${state.relation}/100</b></div>
      <div class="summary-item"><span>使える型</span><b>${state.unlocked.size}/${SKILLS.length}</b></div>
      <div class="summary-item"><span>累計で断った回数</span><b>${state.seen}回</b></div>
    </div>
    <button class="primary-btn" id="retryBtn">もう12人、断る</button>
    <button class="secondary-btn" id="collectionBtn">断り方コレクションを見る</button>
    <button class="secondary-btn" id="homeBtn">トップへ</button>
  </div>`);
  bindHeader();
  document.querySelector('#retryBtn').onclick=startGame;
  document.querySelector('#collectionBtn').onclick=()=>{state.screen='collection';render();};
  document.querySelector('#homeBtn').onclick=()=>{state.screen='home';render();};
}

render();
