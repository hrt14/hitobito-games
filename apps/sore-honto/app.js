const LENSES = {
  mind: { name: '心読み', symbol: '…', note: '相手の気持ちを、確認する前に決める見方。' },
  future: { name: '先読み', symbol: '→', note: 'まだ起きていない未来を、ひとつの結末に固定する見方。' },
  all: { name: '0か100か', symbol: '01', note: '途中や例外を飛ばして、成功／失敗の二択にする見方。' },
  self: { name: '自分原因', symbol: 'ME', note: '原因が複数ありえる場面でも、自分を中心に説明する見方。' },
  should: { name: '〜べき', symbol: '!', note: '現実より先に「こうであるべき」を置く見方。' },
  general: { name: 'いつも化', symbol: '∞', note: '一度や数回の出来事を「いつも」「全部」に広げる見方。' },
  label: { name: '決めつけラベル', symbol: '#', note: '一つの出来事から、人や自分全体に名前をつける見方。' },
  discount: { name: '良い方を消す', symbol: '−', note: 'うまくいった部分や例外を、たまたまとして視界から外す見方。' },
};

const SCENARIOS = [
  { tag:'MESSAGE', fact:'メッセージを送って3時間。まだ返信がない。', thoughts:[['嫌われたのかもしれない','mind'],['何か怒らせたに違いない','self'],['このまま関係が悪くなる','future'],['自分は人付き合いが下手だ','label']], alts:['仕事や移動で見られていない','見たけれど、あとで返そうとしている','返事を考えるのに時間がかかっている','通知に気づいていない','本当に何か気になることがある'] },
  { tag:'MEETING', fact:'会議で出した案に、その場では誰も反応しなかった。', thoughts:[['案がつまらなかった','mind'],['自分はアイデアが弱い','label'],['次から発言しない方がいい','future'],['会議では反応するべきだ','should']], alts:['全員が内容を考えていた','次の議題へ急いでいた','反応を表に出さない人が多かった','あとで意見が出るかもしれない','案に本当に弱い部分があるかもしれない'] },
  { tag:'WORK', fact:'今日予定していた5個の仕事のうち、3個が終わった。', thoughts:[['2個も残した。今日は失敗だ','all'],['自分はいつも仕事が遅い','general'],['全部終わらせるべきだった','should'],['3個できたのは簡単だったからだ','discount']], alts:['3個は完了した','見積もりが大きすぎた可能性がある','途中で予定外の仕事が入ったかもしれない','残り2個を明日に回す選択もある','今日は本当に進みが悪かった可能性もある'] },
  { tag:'SHOP', fact:'店に入ったとき、店員がこちらを見たあと別の作業に戻った。', thoughts:[['歓迎されていない','mind'],['自分が変に見えたのかも','self'],['この店は感じが悪い','label'],['店員ならすぐ声をかけるべきだ','should']], alts:['必要なら呼んでほしい接客方針かもしれない','作業を終わらせようとしていた','こちらが見て回りたいように見えた','別の客対応中だった','本当に接客が雑だった可能性もある'] },
  { tag:'SNS', fact:'投稿して半日で、反応は2件だった。', thoughts:[['誰も興味がない','general'],['投稿は失敗だ','all'],['自分には発信力がない','label'],['今後も伸びない','future']], alts:['見た人の数自体が少ないかもしれない','時間帯や表示順の影響がある','2人は反応した','内容が刺さりにくかった可能性もある','1投稿だけでは傾向は決められない'] },
  { tag:'FAMILY', fact:'話しかけたとき、相手は短く「うん」と答えた。', thoughts:[['機嫌が悪い','mind'],['自分に怒っている','self'],['もう話したくないんだ','future'],['ちゃんと返事をするべきだ','should']], alts:['疲れている','別のことを考えている','急いでいる','普段から短い返事をすることがある','本当に何か引っかかっているかもしれない'] },
  { tag:'CLIENT', fact:'送った提案書に「一度社内で検討します」と返事が来た。', thoughts:[['これは断り文句だ','mind'],['提案が弱かった','self'],['受注できない','future'],['良い提案なら即決されるはずだ','should']], alts:['本当に社内承認が必要','予算確認をしている','他案と比較している','追加質問が後から来るかもしれない','断る前段階の可能性もある'] },
  { tag:'MISTAKE', fact:'送信した資料に誤字が1か所見つかった。', thoughts:[['全部台無しだ','all'],['自分は注意力がない人間だ','label'],['相手の信用を失った','future'],['仕事ならミスはゼロであるべきだ','should']], alts:['内容には影響しない誤字かもしれない','修正版を送れば済む可能性がある','相手が気づかない可能性もある','次回チェック工程を変えられる','信用に影響するミスだった可能性もある'] },
  { tag:'PLAN', fact:'楽しみにしていた予定が雨で中止になった。', thoughts:[['今日は最悪の日だ','all'],['自分はいつも運が悪い','general'],['せっかくの休みが全部無駄だ','discount'],['休みの日くらい晴れるべきだ','should']], alts:['予定は残念でも一日全部が決まったわけではない','別の楽しみ方に変えられる','休む日にしてもいい','延期できるかもしれない','今日は本当に残念な日として過ごすのもありえる'] },
  { tag:'LEARN', fact:'練習問題10問のうち、6問正解した。', thoughts:[['4問も間違えたからダメだ','discount'],['向いていない','label'],['本番でも失敗する','future'],['一度で全部できるべきだ','should']], alts:['6問は解けた','間違えた4問が次の練習場所になる','初回なら十分な可能性がある','問題との相性がある','基礎理解が不足している可能性もある'] },
  { tag:'CALL', fact:'電話をかけたが、相手は出なかった。', thoughts:[['避けられている','mind'],['何かまずいことをした','self'],['もう連絡は取れない','future'],['急ぎなら電話に出るべきだ','should']], alts:['会議中','移動中','知らない番号として見ている','後でかけ直すつもり','意図的に出ていない可能性もある'] },
  { tag:'FEEDBACK', fact:'上司から、資料の2ページを直してほしいと言われた。', thoughts:[['資料全体がダメだった','all'],['自分は資料作りが下手だ','label'],['評価が下がった','future'],['一度でOKを出すべきだった','should']], alts:['直す場所が2ページに限定されている','意図を合わせる通常のレビューかもしれない','他のページは問題なかった可能性がある','上司の好みとの調整かもしれない','重要な欠点を指摘された可能性もある'] },
  { tag:'EVENT', fact:'企画ページを公開した初日、申し込みは0件だった。', thoughts:[['誰も来ない','future'],['企画そのものに価値がない','all'],['自分の企画力がない','label'],['初日から反応があるべきだ','should']], alts:['まだ十分な人に届いていない','申し込みまで検討時間が必要','訴求が弱い可能性がある','対象者が違う可能性がある','本当に需要が弱い可能性もある'] },
  { tag:'HEALTHY DISTANCE', fact:'頼みごとをしたら「今週は難しい」と断られた。', thoughts:[['自分だから断られた','self'],['嫌われている','mind'],['もう頼れない','future'],['仲が良ければ引き受けるべきだ','should']], alts:['本当に今週は忙しい','内容が難しい','別の日なら可能かもしれない','断れる関係だから率直に言った','自分との関係も理由の一つかもしれない'] },
  { tag:'MONEY', fact:'今月の売上は、先月より8%低かった。', thoughts:[['事業がダメになってきた','future'],['自分の判断が悪かった','self'],['成長していないなら失敗だ','all'],['売上は毎月伸びるべきだ','should']], alts:['季節変動がある','先月が特に高かった','件数と単価のどちらかだけ下がった','一時的な変動かもしれない','本当に下降の初期サインかもしれない'] },
  { tag:'FRIEND', fact:'友人3人で集まった写真を、後からSNSで見た。', thoughts:[['自分だけ外された','self'],['もう仲間だと思われていない','mind'],['これからも誘われない','future'],['友達なら声をかけるべきだ','should']], alts:['急に決まった集まりかもしれない','人数や場所の都合があった','自分が忙しいと思われていた','別の機会には誘われるかもしれない','意図的に誘わなかった可能性もある'] },
];

const STORAGE_KEY = 'levelup-sore-honto-v1';
const $ = (id) => document.getElementById(id);
const screens = [...document.querySelectorAll('.screen')];
let state = { mode:'train', round:0, order:[], scenario:null, thought:null, selectedAlts:new Set(), sessionLenses:[] };
let saved = loadSaved();

function loadSaved(){
  try{
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { sessions:Number(raw.sessions)||0, realWins:Number(raw.realWins)||0, picks:{...Object.fromEntries(Object.keys(LENSES).map(k=>[k,0])),...(raw.picks||{})} };
  }catch{return {sessions:0,realWins:0,picks:Object.fromEntries(Object.keys(LENSES).map(k=>[k,0]))};}
}
function save(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch{} }
function show(id){ screens.forEach(s=>s.classList.toggle('active',s.id===id)); window.scrollTo?.({top:0,behavior:'auto'}); }
function shuffle(items){ return [...items].sort(()=>Math.random()-.5); }
function toast(message){ const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1400); }
function updateProgress(){ const n=Math.min(state.round,5);$('progressNow').textContent=n;document.querySelector('.session-progress i').style.setProperty('--progress',`${n/5*100}%`); }
function updateStart(){ $('sessionCount').textContent=saved.sessions;$('realCount').textContent=saved.realWins;const seen=Object.values(saved.picks).filter(v=>v>0).length;$('lensSeen').textContent=`${seen}/8`;$('startStats').hidden=saved.sessions===0 && saved.realWins===0 && seen===0; }

function startTraining(){
  state={mode:'train',round:0,order:shuffle(SCENARIOS).slice(0,5),scenario:null,thought:null,selectedAlts:new Set(),sessionLenses:[]};
  nextScenario();
}
function nextScenario(){
  if(state.round>=5){finishSession();return;}
  state.scenario=state.order[state.round];state.thought=null;state.selectedAlts=new Set();state.round+=1;updateProgress();
  $('roundNo').textContent=state.round;$('sceneTag').textContent=state.scenario.tag;$('factText').textContent=state.scenario.fact;
  const grid=$('thoughtGrid');grid.innerHTML='';shuffle(state.scenario.thoughts).forEach(([text,lens])=>{const b=document.createElement('button');b.type='button';b.className='thought-btn';b.textContent=text;b.addEventListener('click',()=>chooseThought(text,lens));grid.appendChild(b);});
  show('scenarioScreen');
}
function chooseThought(text,lens){
  state.thought={text,lens};state.sessionLenses.push(lens);saved.picks[lens]=(saved.picks[lens]||0)+1;save();
  $('splitFactText').textContent=state.scenario.fact;$('splitStoryText').textContent=text;$('splitStage').classList.remove('separated');$('splitBtn').disabled=false;$('splitBtn').querySelector('span').textContent='事実と意味を分ける';show('splitScreen');
}
function doSplit(){
  $('splitStage').classList.add('separated');$('splitBtn').disabled=true;$('splitBtn').querySelector('span').textContent='分かれた';
  if(navigator.vibrate) navigator.vibrate(18);
  setTimeout(openAlternatives,620);
}
function openAlternatives(){
  const list=$('alternativeList');list.innerHTML='';state.selectedAlts=new Set();$('altCount').textContent='0';$('altNextBtn').disabled=true;
  shuffle(state.scenario.alts).forEach((text,index)=>{const b=document.createElement('button');b.type='button';b.className='alt-btn';b.textContent=text;b.dataset.key=String(index);b.addEventListener('click',()=>toggleAlt(b,index));list.appendChild(b);});
  show('alternativesScreen');
}
function toggleAlt(button,key){
  if(state.selectedAlts.has(key)){state.selectedAlts.delete(key);button.classList.remove('selected');}
  else if(state.selectedAlts.size<2){state.selectedAlts.add(key);button.classList.add('selected');if(navigator.vibrate)navigator.vibrate(10);}
  else{toast('2つ見つかれば十分');return;}
  $('altCount').textContent=state.selectedAlts.size;$('altNextBtn').disabled=state.selectedAlts.size<2;
}
function reveal(){
  $('possibilityCount').textContent=state.selectedAlts.size+2;const lens=LENSES[state.thought.lens];$('lensName').textContent=lens.name;$('lensNote').textContent=lens.note;
  $('nextRoundBtn').querySelector('span').textContent=state.round===5?'結果を見る':'次の場面';show('revealScreen');
}
function finishSession(){
  saved.sessions+=1;save();
  $('resultScore').textContent='10';const counts={};state.sessionLenses.forEach(k=>counts[k]=(counts[k]||0)+1);const box=$('sessionLenses');box.innerHTML='';Object.entries(counts).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>{const s=document.createElement('span');s.textContent=`${LENSES[k].name} × ${n}`;box.appendChild(s);});
  const [mostKey]=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]||[];
  $('resultInsight').innerHTML=mostKey?`今回いちばん出たのは <strong>「${LENSES[mostKey].name}」</strong>。<br>次に似た場面が来たら、まず「これは事実？ それとも意味？」と1回だけ分けてみる。`:'5つの場面を完了しました。';
  updateStart();show('resultScreen');
}

function renderBook(){
  const list=$('lensList');list.innerHTML='';const total=Object.values(saved.picks).reduce((a,b)=>a+b,0);$('totalPicks').textContent=total;
  Object.entries(LENSES).sort((a,b)=>(saved.picks[b[0]]||0)-(saved.picks[a[0]]||0)).forEach(([key,lens])=>{const count=saved.picks[key]||0;const row=document.createElement('div');row.className=`lens-row${count?'':' unseen'}`;row.innerHTML=`<div class="lens-symbol">${lens.symbol}</div><div class="lens-meta"><strong>${lens.name}</strong><span>${lens.note}</span></div><div class="lens-count">${count}<small>PICKS</small></div>`;list.appendChild(row);});
}
function openBook(){renderBook();const d=$('lensBook');if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
function closeBook(){const d=$('lensBook');if(typeof d.close==='function')d.close();else d.removeAttribute('open');}

function openReal(){ $('realFact').value='';$('realStory').value='';$('realSeparateBtn').disabled=true;show('realScreen'); }
function validateReal(){ $('realSeparateBtn').disabled=!($('realFact').value.trim().length>=4 && $('realStory').value.trim().length>=2); }
function separateReal(){ $('realFactView').textContent=$('realFact').value.trim();$('realStoryView').textContent=$('realStory').value.trim();$('realAlternative').value='';$('realFinishBtn').disabled=true;show('realAltScreen'); }
function validateRealAlt(){ $('realFinishBtn').disabled=$('realAlternative').value.trim().length<3; }
function finishReal(){ saved.realWins+=1;save();updateStart();$('realFact').value='';$('realStory').value='';$('realAlternative').value='';show('realDoneScreen'); }

$('trainBtn').addEventListener('click',startTraining);$('againBtn').addEventListener('click',startTraining);$('splitBtn').addEventListener('click',doSplit);$('altNextBtn').addEventListener('click',reveal);$('nextRoundBtn').addEventListener('click',nextScenario);
$('lensBookBtn').addEventListener('click',openBook);$('resultBookBtn').addEventListener('click',openBook);$('closeBookBtn').addEventListener('click',closeBook);$('lensBook').addEventListener('click',(e)=>{if(e.target===$('lensBook'))closeBook();});
$('realBtn').addEventListener('click',openReal);$('realBackBtn').addEventListener('click',()=>show('startScreen'));$('realFact').addEventListener('input',validateReal);$('realStory').addEventListener('input',validateReal);$('realSeparateBtn').addEventListener('click',separateReal);$('realAlternative').addEventListener('input',validateRealAlt);$('realFinishBtn').addEventListener('click',finishReal);$('realAgainBtn').addEventListener('click',openReal);$('realToTrainBtn').addEventListener('click',startTraining);

updateStart();updateProgress();
