const $ = (id) => document.getElementById(id);
const screens = [...document.querySelectorAll('.screen')];
const storageKey = 'levelup-five-intelligences-v1';

const TYPES = {
  EQ: { name: '感情', verb: '感情を扱う', tip: 'イラッとしたら、返す前に「怒り」「焦り」など感情へ名前をつける。' },
  SQ: { name: '場', verb: '場を動かす', tip: '人が止まったら、誰が悪いかより「間に何が起きているか」を見る。' },
  IQ: { name: '思考', verb: '考えて解く', tip: '問題がぼんやりしたら、事実・仮説・数字へ分解してから打ち手を選ぶ。' },
  BKQ: { name: '身体', verb: '身体で掴む', tip: '体の技術は、読むだけで終えず、ゆっくり真似して感覚を反復する。' },
  NQ: { name: 'つながり', verb: 'つながる', tip: '一人で足りないものは、能力不足と決めず「誰とつながれば進むか」を考える。' },
};

const SCENARIOS = [
  { type:'EQ', level:1, area:'仕事', title:'メールにカチンときた', text:'反射で強い返信を書きそう。最初に使う知能は？', feedback:'まず「怒り」「傷ついた」など感情を認識する。反応と行動の間に1拍つくれる。' },
  { type:'EQ', level:1, area:'発表前', title:'焦りで頭が真っ白', text:'本番30秒前。自分を立て直す最初の一手は？', feedback:'「いま焦っている」と感情を言葉にする。ぼんやりした不安を観察できる状態へ戻す。' },
  { type:'EQ', level:3, area:'家族', title:'同じ注意をまたされた', text:'「分かってるよ」と言い返したくなった。最初に使うのは？', feedback:'言い返す前に、自分の苛立ちと相手の心配を認識する。感情事故を減らす入口になる。' },
  { type:'SQ', level:1, area:'会議', title:'2人が対立して止まった', text:'正論の応酬で全員が黙った。場を前へ進めるには？', feedback:'双方の共通点や未一致点を整理し、人と人の間を橋渡しする。ここは「場」を扱う場面。' },
  { type:'SQ', level:2, area:'チーム', title:'一人だけ発言していない', text:'会議は進んでいるが、普段話す人がずっと沈黙。何を見る？', feedback:'個人の能力だけでなく、場の空気・発言しやすさ・関係性を見る。必要なら自然に声を渡す。' },
  { type:'SQ', level:3, area:'友人', title:'3人の空気が急に重い', text:'一言をきっかけに会話が止まった。最初に使うのは？', feedback:'誰か一人の感情だけでなく、3人の間にできた緊張を読み、話題や問いで流れを作り直す。' },
  { type:'IQ', level:1, area:'仕事', title:'売上が急に落ちた', text:'原因はまだ不明。「なんとなく広告」と動く前に何を使う？', feedback:'売上をアクセス・転換・単価などへ分解し、どこが変わったかを確かめる。まず構造化する。' },
  { type:'IQ', level:2, area:'情報', title:'2つの説明が食い違う', text:'どちらももっともらしい。最初にやることは？', feedback:'事実・前提・推測を分け、比較できる形へ整理する。抽象的な問題を構造で扱う。' },
  { type:'IQ', level:3, area:'計画', title:'期限に間に合うか怪しい', text:'作業が多い。気合いではなく最初に何を見る？', feedback:'残り時間、工程、依存関係を分解し、ボトルネックを特定する。考える力を配置する場面。' },
  { type:'BKQ', level:1, area:'スポーツ', title:'スイングが安定しない', text:'解説は読んだ。でも体が同じ動きを再現できない。次は？', feedback:'動きをゆっくり再現し、感覚を反復する。身体技能は「分かった」と「できる」の間を練習で埋める。' },
  { type:'BKQ', level:2, area:'料理', title:'包丁の動きがぎこちない', text:'手順は理解した。もっと滑らかにするには何を使う？', feedback:'見本を真似し、手首・刃・食材の感覚を反復する。言葉だけでなく身体の暗黙知を育てる。' },
  { type:'BKQ', level:3, area:'楽器', title:'譜面は読めるのに弾けない', text:'指が追いつかない。突破に必要なのは？', feedback:'小さく区切って遅く動かし、指の感覚へ落とし込む。身体が覚えるまで反復する場面。' },
  { type:'NQ', level:1, area:'新しい仕事', title:'自分にない専門知識が必要', text:'一人で調べ続けるより、最初に何を使う？', feedback:'知っている人へつながり、知恵を借りる。ネットワークは「自分の外にある能力」へ接続できる。' },
  { type:'NQ', level:2, area:'挑戦', title:'一人だと続かない', text:'長期目標が毎回途切れる。仕組みを変えるなら？', feedback:'応援し合う人、伴走者、仲間との接点を作る。関係は継続を支える資源にもなる。' },
  { type:'NQ', level:3, area:'困りごと', title:'自分だけでは手詰まり', text:'能力不足だと落ち込み始めた。別の突破口は？', feedback:'「誰とつながれば進むか」へ視点を広げる。助け合える関係を持つことも実力の一部として使う。' },
];

const defaultStats = { sessions:0, bestScore:0, bestWindows:0 };
let session = null;
let toastTimer = null;

function track(event, detail={}){
  try{
    if(typeof window.levelupTrack === 'function') window.levelupTrack(event,{app:'five-intelligences',...detail});
  }catch{}
}

function showScreen(id){
  screens.forEach((screen)=>screen.classList.toggle('active',screen.id===id));
  window.scrollTo({top:0,behavior:'instant'});
  track('screen_view',{screen:id});
}

function loadStats(){
  try{return {...defaultStats,...JSON.parse(localStorage.getItem(storageKey)||'{}')}}catch{return {...defaultStats}}
}
function saveStats(stats){try{localStorage.setItem(storageKey,JSON.stringify(stats))}catch{}}
function haptic(pattern=18){try{navigator.vibrate?.(pattern)}catch{}}
function showToast(message){
  clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');
  toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1600);
}
function shuffle(items){
  const arr=[...items];
  for(let i=arr.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr;
}
function buildRun(){
  const picked=[];
  Object.keys(TYPES).forEach((type)=>{
    picked.push(...shuffle(SCENARIOS.filter((item)=>item.type===type)).slice(0,2));
  });
  return shuffle(picked);
}

function startGame(){
  session={questions:buildRun(),index:0,correct:0,combo:0,bestCombo:0,byType:Object.fromEntries(Object.keys(TYPES).map((type)=>[type,{correct:0,total:0}])),lit:new Set(),locked:false};
  document.querySelectorAll('#litWindows span').forEach((el)=>el.classList.remove('lit'));
  showScreen('playScreen');
  track('game_started');
  renderQuestion();
}

function renderQuestion(){
  const q=session.questions[session.index];
  session.locked=false;
  $('questionCounter').textContent=`${session.index+1} / ${session.questions.length}`;
  $('comboValue').textContent=`COMBO ${session.combo}`;
  $('progressBar').style.width=`${((session.index+1)/session.questions.length)*100}%`;
  $('scenarioArea').textContent=q.area.toUpperCase();
  $('scenarioTitle').textContent=q.title;
  $('scenarioText').textContent=q.text;
  $('difficulty').textContent=`LEVEL ${q.level}`;
  $('feedback').className='feedback';
  $('switchGrid').classList.remove('locked');
  document.querySelectorAll('#switchGrid button').forEach((button)=>button.classList.remove('correct','wrong'));
  $('scenarioCard').animate?.([{opacity:.65,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
}

function answer(type){
  if(!session||session.locked)return;
  session.locked=true;
  const q=session.questions[session.index];
  const correct=type===q.type;
  session.byType[q.type].total+=1;
  if(correct){
    session.correct+=1;session.combo+=1;session.bestCombo=Math.max(session.bestCombo,session.combo);session.byType[q.type].correct+=1;session.lit.add(q.type);haptic(24);
    document.querySelector(`#litWindows [data-type="${q.type}"]`)?.classList.add('lit');
  }else{session.combo=0;haptic([18,35,18])}
  $('comboValue').textContent=`COMBO ${session.combo}`;
  $('switchGrid').classList.add('locked');
  const chosen=document.querySelector(`#switchGrid button[data-type="${type}"]`);
  const right=document.querySelector(`#switchGrid button[data-type="${q.type}"]`);
  chosen?.classList.add(correct?'correct':'wrong');
  if(!correct)right?.classList.add('correct');
  $('feedbackBadge').textContent=q.type;
  $('feedbackTitle').textContent=correct?`✓ ${q.type} — ${TYPES[q.type].name}`:`↺ ここは ${q.type} — ${TYPES[q.type].name}`;
  $('feedbackText').textContent=q.feedback;
  $('feedback').className=`feedback show ${correct?'good':'bad'}`;
  track('answer',{question:q.title,answer:type,correct,target:q.type});
  setTimeout(()=>{
    session.index+=1;
    if(session.index>=session.questions.length)finishGame();else renderQuestion();
  },correct?740:980);
}

function finishGame(){
  const score=Math.round((session.correct/session.questions.length)*100);
  const litCount=session.lit.size;
  $('scoreValue').textContent=score;
  $('scoreRing').style.setProperty('--score',`${score}%`);
  $('litValue').textContent=`${litCount} / 5`;
  $('resultCopy').textContent=score>=90?'5つの切り替えがかなり速い。現実でも「今は何の知能か」を意識してみよう。':score>=70?'複数の窓が見えてきた。迷った種類だけ、もう1セットで反射にする。':'まずは「頭で解く」以外の窓を増やすところから。';
  renderTypeResults();
  const nextType=Object.keys(TYPES).sort((a,b)=>{
    const ar=session.byType[a].correct/session.byType[a].total;
    const br=session.byType[b].correct/session.byType[b].total;
    return ar-br;
  })[0];
  $('nextType').textContent=`${nextType} — ${TYPES[nextType].name}`;
  $('nextTip').textContent=TYPES[nextType].tip;
  const stats=loadStats();
  stats.sessions+=1;stats.bestScore=Math.max(stats.bestScore,score);stats.bestWindows=Math.max(stats.bestWindows,litCount);saveStats(stats);
  showScreen('resultScreen');
  track('game_completed',{score,lit:litCount,bestCombo:session.bestCombo});
}

function renderTypeResults(){
  $('typeResults').innerHTML=Object.entries(TYPES).map(([type,meta])=>{
    const row=session.byType[type];
    const pct=row.total?Math.round((row.correct/row.total)*100):0;
    return `<div class="type-row"><strong>${type}<small>${meta.name}</small></strong><div class="type-track"><i style="width:${pct}%"></i></div><span>${row.correct}/${row.total}</span></div>`;
  }).join('');
}

function renderStats(){
  const stats=loadStats();
  $('statSessions').textContent=stats.sessions;
  $('statBest').textContent=stats.sessions?`${stats.bestScore}%`:'—';
  $('statWindows').textContent=stats.sessions?`${stats.bestWindows}/5`:'—';
  showScreen('statsScreen');
}

async function shareResult(){
  const score=$('scoreValue').textContent;
  const lit=$('litValue').textContent;
  const text=`5つの知能 使い分けスコア ${score}/100｜点灯 ${lit}\nEQ・SQ・IQ・BKQ・NQを10シーンで切り替える。\nLEVEL UP`;
  try{
    if(navigator.share){await navigator.share({title:'60秒で使い分ける 5つの知能 | LEVEL UP',text,url:location.href});track('share',{method:'share'});return}
    await navigator.clipboard.writeText(`${text}\n${location.href}`);showToast('結果をコピーしました');track('share',{method:'clipboard'});
  }catch(error){if(error?.name!=='AbortError')showToast('共有できませんでした')}
}

document.querySelectorAll('#switchGrid button').forEach((button)=>button.addEventListener('click',()=>answer(button.dataset.type)));
$('startBtn').addEventListener('click',startGame);
$('againBtn').addEventListener('click',startGame);
$('homeBtn').addEventListener('click',()=>showScreen('homeScreen'));
$('statsBtn').addEventListener('click',renderStats);
$('statsPlayBtn').addEventListener('click',startGame);
$('statsBackBtn').addEventListener('click',()=>showScreen('homeScreen'));
$('shareBtn').addEventListener('click',shareResult);

track('app_opened');
