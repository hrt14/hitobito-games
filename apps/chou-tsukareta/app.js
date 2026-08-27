const AXES = ['recovery','brain','wip','people','emotion','work'];
const AXIS_LABELS = {
  recovery:'回復不足', brain:'判断・情報', wip:'未完了', people:'対人', emotion:'感情', work:'仕事圧'
};
const STORAGE_KEY = 'levelup-chou-tsukareta-v2';
const MAX_QUESTIONS = 7;
const MIN_QUESTIONS = 6;

const APPS = {
  'meeting-respawn':['会議後リスポーン','いったん止まり、ぐったりした状態から戻る'],
  'azukete-neru':['預けて寝る','寝る前まで抱えているものを外へ預ける'],
  'nou-keshigomu':['脳消しゴム','頭に残っている考えを外へ出して閉じる'],
  'one-thing':['ひとつだけ。','同時進行を止め、見るものを1つにする'],
  'zenbu-yaranai':['全部やらない。','守る・縮める・逃がす・捨てるで量を減らす'],
  'extra-load':['余計な負荷','自分で足している重さを見つけて外す'],
  'approval-off':['他人軸OFF','相手の評価を相手側へ返して自分へ戻る'],
  'task-separation':['課題の分離','自分の課題と相手の課題を分ける'],
  'nukeru':['ぬける。','嫌な気分との距離を短時間で作る'],
  'mou-owatta':['もう終わった','終わった出来事を頭の中で再開しない'],
  'boundary':['境界線','これ以上入れないものを決める'],
  'my-job':['それ、私の仕事？','背負う必要のない仕事を切り分ける']
};

const PROFILES = {
  recovery:{
    title:'休めていない疲れ',
    summary:'使える体力そのものが少なく、考える前に身体が止まりたがっている',
    secondary:'身体側の回復不足も重なっている',
    detail:'いまは原因分析を増やすより、刺激と判断を減らして回復に使える時間を確保する方が合いそうです。',
    pTitle:'「次に何する？」を一度やめる。',
    pText:'まず10分、座る・横になる・画面を閉じるなど、判断を伴わない休止を作る。再開するなら、そのあと1個だけ決める。',
    avoid:'休みながら予定整理を始めること。休息中まで脳に仕事をさせない。',
    primary:'meeting-respawn', secondaryApps:['azukete-neru','boundary']
  },
  brain:{
    title:'考え続ける疲れ',
    summary:'判断・切り替え・情報処理が多く、頭を使い続けることに削られている',
    secondary:'考え続ける負荷もかなり重なっている',
    detail:'身体を止めても頭が仕事を続けると、休んだ感覚が作りにくい状態になります。',
    pTitle:'考える対象を、1個まで減らす。',
    pText:'いま考えていることを全部解こうとせず、「今日ここでは考えない」を先に決める。残った1件だけを見る。',
    avoid:'疲れている頭で、全部をきれいに整理し直すこと。',
    primary:'nou-keshigomu', secondaryApps:['one-thing','boundary']
  },
  wip:{
    title:'終わっていないものを持つ疲れ',
    summary:'実際に作業している時間だけでなく、未返信・未完了・予定を頭の中で持ち続けることに削られている',
    secondary:'「まだ終わっていない」を抱える負荷も重なっている',
    detail:'休んでいる間も「あとでやる」が残るため、仕事から離れても頭の一部が占有されやすい状態です。',
    pTitle:'終わらせる前に、持つ量を減らす。',
    pText:'未完了を外に出し、「今日やる / 明日以降 / やらない」に分ける。今日の箱は1〜2個で十分。',
    avoid:'残っているものを全部今日中に片づけてから休もうとすること。',
    primary:'zenbu-yaranai', secondaryApps:['one-thing','extra-load']
  },
  people:{
    title:'人を気にし続ける疲れ',
    summary:'会話そのものより、相手の反応・期待・評価を読み続けることに削られている',
    secondary:'人への警戒や気遣いも重なっている',
    detail:'その場が終わっても「どう思われたか」を処理し続けると、対人時間の外まで消耗が伸びます。',
    pTitle:'相手の頭の中を、相手へ返す。',
    pText:'「自分が次にすること」と「相手がどう感じるか」を分ける。前者だけ1個決めたら、後者の予測はここで終える。',
    avoid:'相手の表情や返信から、正解を何度も逆算すること。',
    primary:'approval-off', secondaryApps:['task-separation','boundary']
  },
  emotion:{
    title:'嫌だったことが残る疲れ',
    summary:'起きた出来事より、そのときの不安・悔しさ・嫌さがまだ残っていて、それを抱えることに削られている',
    secondary:'感情が残り続ける負荷も重なっている',
    detail:'いま必要なのは「正しく考え直すこと」より、出来事と現在の自分の間に少し距離を作ることかもしれません。',
    pTitle:'解決より先に、現在へ戻る。',
    pText:'嫌さを消そうとせず「まだ残ってる」とだけ名前を付ける。対応を考えるなら、少し距離ができてからでいい。',
    avoid:'疲れた状態で、誰が悪かったか・何が正解だったかを最後まで決着させること。',
    primary:'nukeru', secondaryApps:['mou-owatta','boundary']
  },
  work:{
    title:'止められない仕事に押される疲れ',
    summary:'仕事量だけでなく、締切・要求・役割の多さや「自分で止めにくい」感覚に削られている',
    secondary:'仕事の圧力やコントロールしにくさも重なっている',
    detail:'頑張り方を改善するより先に、負荷そのもの・期限・担当範囲のどれを動かせるかを見る方が筋がよさそうです。',
    pTitle:'自分の処理能力ではなく、負荷側を動かす。',
    pText:'「減らす / 延ばす / 任せる / やめる」のどれかを1件だけ選ぶ。全部を自分の速度で吸収しようとしない。',
    avoid:'効率化だけで今の仕事量を全部飲み込もうとすること。',
    primary:'my-job', secondaryApps:['zenbu-yaranai','extra-load']
  }
};

const STARTER = {
  id:'starter', eyebrow:'FIRST CLUE', targets:AXES,
  title:'いまの「疲れた」に一番近いのは？', sub:'理由ではなく、最初に出ているサインで。',
  options:[
    ['▰','体が重い','眠い・横になりたい',{recovery:5}],
    ['≡','頭がいっぱい','判断したくない・考えが止まらない',{brain:5,wip:1}],
    ['□','残っていることが重い','未返信・締切・やることが頭から離れない',{wip:5,work:1}],
    ['◎','人に会ったあと特に消耗する','気遣い・反応・評価が残る',{people:5,emotion:1}],
    ['≈','嫌な感じが残っている','不安・悔しさ・モヤモヤが抜けない',{emotion:5}],
    ['↯','仕事に押されている','量・期限・役割を止められない',{work:5,wip:1}],
    ['?','まだ全然わからない','だから正体を探したい',{recovery:1,brain:1,wip:1,people:1,emotion:1,work:1}]
  ]
};

const QUESTION_BANK = [
  {id:'recovery-stop',eyebrow:'BODY OR MIND',targets:['recovery','brain'],title:'予定が全部消えたら、最初にしたいのは？',sub:'「理想」ではなく、今すぐ近い方。',options:[
    ['Z','寝る・横になる','まず身体を止めたい',{recovery:4}],
    ['—','何もせず座る','刺激を減らしたい',{recovery:3,brain:1}],
    ['⌫','頭を空にする','身体より思考を止めたい',{brain:4}],
    ['✓','残りを片づける','休む前に未完了が気になる',{wip:4}]
  ]},
  {id:'brain-switch',eyebrow:'MENTAL LOAD',targets:['brain','work'],title:'今日は「頭の切り替え」を何回もした感じがある？',sub:'会議→作業→連絡→判断、のような切り替え。',options:[
    ['＋','かなりある','ずっと別のことへ切り替えていた',{brain:4,work:1}],
    ['○','少しある','まとまった時間が少なかった',{brain:3}],
    ['△','あまりない','切り替えより別の重さがある',{brain:0}],
    ['×','ない','今日は比較的一つのことをしていた',{brain:0}]
  ]},
  {id:'wip-stop',eyebrow:'OPEN LOOPS',targets:['wip','brain'],title:'休もうとすると「まだあれが残ってる」が出てくる？',sub:'実際にやるかではなく、頭に勝手に戻るか。',options:[
    ['↻','何度も出てくる','未完了が勝手に再点灯する',{wip:5,brain:1}],
    ['□','いくつか出る','忘れないように持っている',{wip:3}],
    ['△','少しだけ','主因ではなさそう',{wip:1}],
    ['—','ほぼ出ない','残件より別の疲れ',{wip:0}]
  ]},
  {id:'people-alone',eyebrow:'SOCIAL LOAD',targets:['people','emotion'],title:'一人になった瞬間、少し楽になる？',sub:'人が嫌いかではなく、接続を切ったときの変化。',options:[
    ['↓','かなり楽','誰にも反応しなくていいのが大きい',{people:5}],
    ['○','少し楽','気を使わなくていい分だけ軽い',{people:3}],
    ['≈','楽より嫌な場面が戻る','人より出来事そのものが残る',{emotion:4,people:1}],
    ['—','あまり変わらない','対人が主因ではなさそう',{people:0}]
  ]},
  {id:'emotion-replay',eyebrow:'WHAT LINGERS',targets:['emotion','people'],title:'止まったとき、嫌だった場面が勝手に戻ってくる？',sub:'反省しようとしてではなく、自然に浮かぶか。',options:[
    ['↺','何度も戻る','同じ場面を再生している',{emotion:5}],
    ['◎','相手の顔や反応が戻る','どう思われたかが中心',{people:4,emotion:2}],
    ['○','少し戻る','まだ感情が残っている',{emotion:3}],
    ['—','ほぼ戻らない','過去の場面は主因ではない',{emotion:0}]
  ]},
  {id:'work-control',eyebrow:'CONTROL',targets:['work','wip'],title:'つらいのは「多い」より「自分で止めにくい」に近い？',sub:'期限・相手都合・役割など、自分だけでは減らしにくい感じ。',options:[
    ['│','かなり近い','止めたいが止められない',{work:5}],
    ['＋','多いうえに止めにくい','量とコントロールの両方',{work:4,wip:2}],
    ['□','止められるが残件が多い','圧より未完了が中心',{wip:4,work:1}],
    ['—','どちらでもない','仕事圧は主因ではなさそう',{work:0}]
  ]},
  {id:'recovery-morning',eyebrow:'RECOVERY',targets:['recovery'],title:'今日の疲れ、朝の時点ですでにあった？',sub:'一日の負荷で増えたのか、回復しきらず始まったのか。',options:[
    ['●','朝からかなりあった','スタート時点で余力が少なかった',{recovery:5}],
    ['◐','少しあった','完全には戻っていなかった',{recovery:3}],
    ['↘','午後から増えた','今日の負荷で削られた感じ',{recovery:1,work:1}],
    ['○','朝は平気だった','回復不足だけではなさそう',{recovery:0}]
  ]},
  {id:'brain-decision',eyebrow:'DECISIONS',targets:['brain'],title:'いま「夕飯を決める」みたいな小さい判断まで面倒？',sub:'大きい仕事ではなく、小さな選択への反応。',options:[
    ['…','かなり面倒','もう選びたくない',{brain:5}],
    ['△','少し面倒','決める回数を減らしたい',{brain:3}],
    ['○','そこは平気','判断疲れは強くない',{brain:0}],
    ['□','判断より残件が気になる','決めるより終わってないこと',{wip:4}]
  ]},
  {id:'wip-memory',eyebrow:'HOLDING',targets:['wip','work'],title:'「忘れたらまずい」を頭の中で持っているものが多い？',sub:'メモしてあるかではなく、気にして保持している感覚。',options:[
    ['＋','かなり多い','頭の中に待機列がある',{wip:5}],
    ['□','いくつかある','常に少し気になっている',{wip:3}],
    ['↯','数より締切の圧が強い','残件より期限や要求が重い',{work:4,wip:1}],
    ['—','ほぼない','保持する負荷は少ない',{wip:0}]
  ]},
  {id:'people-performance',eyebrow:'VIGILANCE',targets:['people','work'],title:'人といる間、「ちゃんとして見せる」に力を使った？',sub:'説明・愛想・反応・期待への対応も含めて。',options:[
    ['◎','かなり使った','相手に合わせ続けた',{people:5}],
    ['○','少し使った','気を抜ける時間が少なかった',{people:3}],
    ['↯','人より役割の責任が重い','評価より仕事そのもの',{work:4}],
    ['—','ほぼ使ってない','対人警戒は小さい',{people:0}]
  ]},
  {id:'emotion-name',eyebrow:'EMOTION',targets:['emotion'],title:'「疲れた」を別の言葉にすると、近いのは？',sub:'疲れの奥にある感情があるなら。',options:[
    ['↓','がっかり・悲しい','期待とのズレが残る',{emotion:4}],
    ['!','イライラ・悔しい','納得できなさが残る',{emotion:4}],
    ['?','不安・心配','先のことが離れない',{emotion:4,brain:1}],
    ['—','特に感情はない','ただ消耗している',{recovery:2,emotion:0}]
  ]},
  {id:'work-volume',eyebrow:'DEMAND',targets:['work','brain'],title:'今日の仕事、普通の速度でやっても終わらない量だった？',sub:'自分の能力評価ではなく、要求量の話。',options:[
    ['↯','明らかに多い','普通にやっても溢れる',{work:5,wip:2}],
    ['＋','やや多い','余白がほぼなかった',{work:3}],
    ['◇','量より判断が多い','処理量より頭の切替',{brain:4}],
    ['—','量は普通','仕事量が中心ではない',{work:0}]
  ]},
  {id:'brain-vs-wip',eyebrow:'WHICH ONE',targets:['brain','wip'],title:'頭の重さは、どっちに近い？',sub:'似ているけれど、回復の仕方が違う2つ。',options:[
    ['≡','考えることが多すぎる','判断・情報・切り替え',{brain:5}],
    ['□','覚えておくことが多すぎる','未完了・予定・返信',{wip:5}],
    ['＋','両方','考えながら持ち続けている',{brain:3,wip:3}],
    ['—','どちらでもない','頭の負荷は中心ではない',{}]
  ]},
  {id:'people-vs-emotion',eyebrow:'WHICH ONE',targets:['people','emotion'],title:'あとに残っているのは、どっち？',sub:'人への警戒か、出来事の感情か。',options:[
    ['◎','相手がどう思ったか','評価・反応・関係が気になる',{people:5}],
    ['≈','自分がどう感じたか','嫌さ・悔しさ・不安が残る',{emotion:5}],
    ['＋','両方','相手も感情もまだ離れない',{people:3,emotion:3}],
    ['—','どちらでもない','別の疲れが中心',{}]
  ]},
  {id:'work-vs-wip',eyebrow:'WHICH ONE',targets:['work','wip'],title:'やることが全部見えたとして、楽になりそう？',sub:'見えない未完了か、見えていても重い仕事圧か。',options:[
    ['✓','かなり楽になる','整理できれば軽くなりそう',{wip:5}],
    ['○','少し楽になる','未完了の見える化は効きそう',{wip:3}],
    ['↯','見えても量が重い','整理より負荷自体を減らしたい',{work:5}],
    ['│','見えても止められないのが重い','コントロールしにくさが中心',{work:5}]
  ]}
];

let scores = freshScores();
let history = [];
let currentQuestion = STARTER;
let previousSaved = null;

const $ = (id) => document.getElementById(id);
const screens = {start:$('startScreen'),question:$('questionScreen'),result:$('resultScreen')};

function freshScores(){return Object.fromEntries(AXES.map(a=>[a,0]));}
function show(name){Object.values(screens).forEach(s=>s.classList.remove('active'));screens[name].classList.add('active');window.scrollTo({top:0,behavior:'instant'});}
function apply(weights,sign=1){Object.entries(weights||{}).forEach(([axis,value])=>{scores[axis]=(scores[axis]||0)+(value*sign);});}
function sortedAxes(){return AXES.slice().sort((a,b)=>scores[b]-scores[a] || AXES.indexOf(a)-AXES.indexOf(b));}
function askedIds(){return new Set(history.map(h=>h.question.id));}

function questionValue(q,top){
  const asked=askedIds(); if(asked.has(q.id)) return -999;
  let value=0;
  if(q.targets.includes(top[0])) value+=8;
  if(q.targets.includes(top[1])) value+=5;
  if(q.targets.includes(top[2])) value+=2;
  if(q.targets.length===2 && q.targets.includes(top[0]) && q.targets.includes(top[1])) value+=4;
  const targetScores=q.targets.map(a=>scores[a]||0);
  if(targetScores.length>1 && Math.max(...targetScores)-Math.min(...targetScores)<=3) value+=2;
  return value;
}

function pickNextQuestion(){
  const top=sortedAxes();
  return QUESTION_BANK.slice().sort((a,b)=>questionValue(b,top)-questionValue(a,top) || QUESTION_BANK.indexOf(a)-QUESTION_BANK.indexOf(b))[0];
}

function confidenceState(){
  const top=sortedAxes();
  const gap=(scores[top[0]]||0)-(scores[top[1]]||0);
  const answered=history.length;
  if(answered<=2) return ['輪郭を探しています',Math.max(14,answered/MAX_QUESTIONS*100)];
  if(gap>=7) return ['かなり絞れてきました',Math.max(52,answered/MAX_QUESTIONS*100)];
  if(gap>=4) return ['少し見えてきました',Math.max(42,answered/MAX_QUESTIONS*100)];
  return ['まだ2つで迷っています',Math.max(34,answered/MAX_QUESTIONS*100)];
}

function renderQuestion(){
  const n=history.length+1;
  $('progressText').textContent=`${n} / 最大${MAX_QUESTIONS}問`;
  const [label,pct]=confidenceState();
  $('confidenceText').textContent=label;
  $('progressBar').style.width=`${Math.min(100,pct)}%`;
  $('silhouetteGlow').style.transform=`scale(${1+history.length*.09})`;
  $('silhouetteGlow').style.opacity=String(Math.min(.82,.28+history.length*.08));
  $('questionEyebrow').textContent=currentQuestion.eyebrow;
  $('questionTitle').textContent=currentQuestion.title;
  $('questionSub').textContent=currentQuestion.sub;
  $('choices').innerHTML='';
  currentQuestion.options.forEach(([icon,title,sub,weights],index)=>{
    const btn=document.createElement('button');
    btn.type='button';btn.className='choice';
    btn.innerHTML=`<span class="icon">${icon}</span><span><strong>${title}</strong><small>${sub}</small></span>`;
    btn.addEventListener('click',()=>choose(index,weights));
    $('choices').appendChild(btn);
  });
  $('backBtn').style.visibility=history.length===0?'hidden':'visible';
}

function shouldFinish(){
  if(history.length>=MAX_QUESTIONS) return true;
  if(history.length<MIN_QUESTIONS) return false;
  const top=sortedAxes();
  return scores[top[0]]-scores[top[1]]>=8;
}

function choose(optionIndex,weights){
  apply(weights,1);
  history.push({question:currentQuestion,optionIndex,weights});
  if(shouldFinish()){renderResult();return;}
  currentQuestion=pickNextQuestion();
  renderQuestion();
}

function goBack(){
  const last=history.pop();
  if(!last)return;
  apply(last.weights,-1);
  currentQuestion=last.question;
  renderQuestion();
}

function makeResult(){
  const sorted=sortedAxes();
  const primary=sorted[0],secondary=sorted[1];
  const max=Math.max(...AXES.map(a=>scores[a]),1);
  return {primary,secondary,scores:{...scores},max,savedAt:Date.now()};
}

function resultSentence(data){
  const p=PROFILES[data.primary],s=PROFILES[data.secondary];
  const gap=(data.scores[data.primary]||0)-(data.scores[data.secondary]||0);
  if(gap<=3){return `今日の「疲れた」は、${p.summary}感じが中心です。同時に、${s.secondary}ようです。ひとつの理由ではなく、この2つが重なって「もう疲れた」になっていそうです。`;}
  return `今日の「疲れた」は、${p.summary}感じが中心です。${p.detail}`;
}

function renderCauses(data){
  const ranked=sortedAxes().slice(0,4);
  const max=Math.max(...ranked.map(a=>data.scores[a]||0),1);
  $('causeStack').innerHTML=ranked.map((axis,index)=>{
    const pct=Math.max(5,Math.round((data.scores[axis]||0)/max*100));
    return `<div class="cause-row"><span>${AXIS_LABELS[axis]}</span><div class="cause-track"><div class="cause-fill" style="width:${pct}%"></div></div><b>${index===0?'主':index===1?'副':'・'}</b></div>`;
  }).join('');
}

function renderApps(profile){
  const [t,d]=APPS[profile.primary];
  $('primaryApp').href=`/apps/${profile.primary}/`;
  $('primaryAppTitle').textContent=t;
  $('primaryAppDesc').textContent=d;
  $('secondaryApps').innerHTML=profile.secondaryApps.map(slug=>{
    const [title,desc]=APPS[slug];
    return `<a class="secondary-app" href="/apps/${slug}/"><strong>${title} ↗</strong><small>${desc}</small></a>`;
  }).join('');
}

function loadStored(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{return null;}}
function saveStored(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch{}}

function renderPrevious(data){
  const block=$('previousBlock');
  if(!previousSaved||!previousSaved.primary){block.hidden=true;return;}
  block.hidden=false;
  const before=PROFILES[previousSaved.primary]?.title||AXIS_LABELS[previousSaved.primary];
  const now=PROFILES[data.primary].title;
  $('previousText').textContent=previousSaved.primary===data.primary
    ? `前回も「${now}」が中心でした。同じ種類の疲れが続いているなら、今日は対処より先に負荷を減らせないかを見るのもありです。`
    : `前回は「${before}」が中心。今日は「${now}」。同じ「疲れた」でも、削られている場所が変わっています。`;
}

function renderResult(saved=null){
  const data=saved||makeResult();
  const profile=PROFILES[data.primary];
  $('resultTitle').textContent=profile.title;
  $('resultSentence').textContent=saved&&saved.sentence?saved.sentence:resultSentence(data);
  $('prescriptionTitle').textContent=profile.pTitle;
  $('prescriptionText').textContent=profile.pText;
  $('notNow').innerHTML=`<strong>今はしなくていい:</strong> ${profile.avoid}`;
  renderCauses(data);
  renderApps(profile);
  if(!saved){
    renderPrevious(data);
    data.sentence=$('resultSentence').textContent;
    saveStored(data);
  }else{
    blockPreviousForSaved();
  }
  show('result');
}

function blockPreviousForSaved(){
  $('previousBlock').hidden=true;
}

function reset(){
  previousSaved=loadStored();
  scores=freshScores();history=[];currentQuestion=STARTER;
  renderQuestion();show('question');
}

async function shareResult(){
  const title=$('resultTitle').textContent;
  const sentence=$('resultSentence').textContent;
  const text=`今日の「疲れた」の正体：${title}\n${sentence}\n#LEVELUP`;
  try{
    if(navigator.share){await navigator.share({title:'疲れたの正体',text});$('shareStatus').textContent='共有しました';return;}
    await navigator.clipboard.writeText(text);$('shareStatus').textContent='結果をコピーしました';
  }catch(err){if(err?.name!=='AbortError')$('shareStatus').textContent='共有できませんでした';}
}

$('startBtn').addEventListener('click',reset);
$('backBtn').addEventListener('click',goBack);
$('againBtn').addEventListener('click',reset);
$('shareBtn').addEventListener('click',shareResult);

const stored=loadStored();
if(stored?.primary){
  $('lastResultBtn').hidden=false;
  $('lastResultBtn').addEventListener('click',()=>{previousSaved=null;renderResult(stored);});
}
