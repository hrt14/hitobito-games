const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'levelup-success-mind-v1';
const memoryStorage = new Map();
const store = {
  getItem(key){ try { return window.localStorage.getItem(key); } catch { return memoryStorage.get(key) || null; } },
  setItem(key,value){ try { window.localStorage.setItem(key,value); } catch { memoryStorage.set(key,value); } }
};

const AXES = {
  action: { label: '実行力', short: '実行', good: '決めたら小さく出し、現実の反応を取りにいける。', weak: '準備や正解探しが長くなると、複利の開始が遅れる。' },
  control: { label: '統制感', short: '統制', good: '結果を他人や運だけに預けず、自分が変えられる変数を探せる。', weak: '環境・相手・運を主因にすると、次の一手が消えやすい。' },
  compound: { label: '複利思考', short: '複利', good: '目先の快楽より、将来の選択肢を増やす資産へ回せる。', weak: '短期の快適さを優先し続けると、時間・知識・資本の複利が弱くなる。' },
  learn: { label: '学習修正', short: '学習', good: '失敗を自己評価ではなくデータとして扱い、次の仮説へ変えられる。', weak: '失敗の防御や成功パターンへの固執が、環境変化への対応を遅らせる。' },
  leverage: { label: 'レバレッジ', short: '協力', good: '自分一人の時間に閉じず、人・仕組み・交渉を使って成果を増幅できる。', weak: '全部自分で抱えると、能力が上がっても時間の上限にぶつかりやすい。' },
  risk: { label: 'リスク設計', short: 'リスク', good: '危険をゼロにせず、損失上限を決めて小さく試せる。', weak: '全回避か全賭けかに寄ると、成長機会か生存余力のどちらかを失いやすい。' },
};

const questions = [
  {
    domain: 'WORK', title: '今月は仕事でいっぱい。新しいスキルを学ぶ時間を作るなら？', note: '売上は落としたくない。でも今の仕事だけを続けても、来年の単価は大きく変わらなそう。',
    options: [
      { label: '今月は忙しい。空いたら学ぶ', tag: '目先を守る', scores: { compound:0, action:0 } },
      { label: '週2時間だけ先に予定を固定する', tag: '未来へ先払い', scores: { compound:2, action:1 } },
    ]
  },
  {
    domain: 'FAILURE', title: '力を入れた企画が、想定の半分しか売れなかった。最初にすることは？', note: '周囲からは「市場が悪かったね」と言われた。',
    options: [
      { label: '市場・景気・客層が悪かった理由を整理する', tag: '外側を説明', scores:{ control:0, learn:1 } },
      { label: '自分で変えられた変数を3つ出し、1つだけ再テストする', tag: '可変点を探す', scores:{ control:2, learn:2, action:1 } },
    ]
  },
  {
    domain: 'MONEY', title: '収入が月10万円増えた。半年後の自分のためにどう使う？', note: '生活は今のままでも特に困っていない。',
    options: [
      { label: '生活水準を少し上げ、頑張った実感を得る', tag: '現在を豊かに', scores:{ compound:0 } },
      { label: '一部を学習・外注・資産など、将来の選択肢が増えるものへ回す', tag: '複利へ回す', scores:{ compound:2, leverage:1, risk:1 } },
    ]
  },
  {
    domain: 'CLIENT', title: '重要顧客から「明日までに全部」と、現実的でない依頼が来た。', note: '断ると評価が下がる気がする。',
    options: [
      { label: 'とりあえず受けて、自分が頑張って帳尻を合わせる', tag: '自分で抱える', scores:{ leverage:0, control:1 } },
      { label: '目的を確認し、範囲・優先順位・期限のどれかを交渉する', tag: '条件を動かす', scores:{ leverage:2, control:2 } },
    ]
  },
  {
    domain: 'COMPETITION', title: '強い競合が、自分より30%安い価格で出してきた。', note: '同じように値下げすれば、短期的には客離れを止められそう。',
    options: [
      { label: 'まず同程度まで値下げして守る', tag: '同じ土俵へ', scores:{ learn:0, risk:0 } },
      { label: '選ばれている理由を調べ、価格以外の勝ち筋を小さく検証する', tag: '勝ち筋を変える', scores:{ learn:2, risk:2, action:1 } },
    ]
  },
  {
    domain: 'TIME', title: '朝から未読と細かい依頼が20件。最初の60分をどう使う？', note: '全部それなりに急ぎに見える。',
    options: [
      { label: '小さいものから片づけ、受信箱をゼロに近づける', tag: '反応を減らす', scores:{ action:1, compound:0 } },
      { label: '今日の成果を最も変える1件を先に進め、残りは後でまとめる', tag: '重要を先に', scores:{ action:2, compound:2 } },
    ]
  },
  {
    domain: 'SKILL', title: 'やりたい仕事があるが、自分はまだ80%しか理解できていない。', note: '失敗すると「実力不足」と思われる可能性もある。',
    options: [
      { label: 'もっと勉強して、ほぼ確実にできる状態まで待つ', tag: '準備を完成', scores:{ action:0, learn:1, risk:0 } },
      { label: '失敗しても小さく済む範囲で出し、反応を教材にする', tag: '現実で学ぶ', scores:{ action:2, learn:2, risk:2 } },
    ]
  },
  {
    domain: 'TEAM', title: '自分なら80点、他人に任せると最初は60点になりそうな仕事。', note: 'でも毎週2時間、自分の時間を使っている。',
    options: [
      { label: '品質が落ちるのが嫌なので、自分で続ける', tag: '品質を自分で守る', scores:{ leverage:0, compound:0 } },
      { label: '基準を渡して任せ、最初の数回だけレビューする', tag: '仕組みに変える', scores:{ leverage:2, compound:2, action:1 } },
    ]
  },
  {
    domain: 'CHANCE', title: '成功すれば大きいが、3回に1回は失敗しそうな機会が来た。', note: '失敗しても生活が壊れるほどではないが、痛い損失は出る。',
    options: [
      { label: '失敗率が高いので見送る', tag: '損失を避ける', scores:{ risk:0, action:0 } },
      { label: '損失上限を先に決め、撤退条件つきで試す', tag: '下限を切って挑戦', scores:{ risk:2, action:1, control:1 } },
    ]
  },
  {
    domain: 'FEEDBACK', title: '顧客から、かなり刺さる批判コメントが届いた。', note: '言い方は理不尽。でも内容の一部には心当たりがある。',
    options: [
      { label: '言い方が悪いので、まず反論できる点を整理する', tag: '自分を守る', scores:{ learn:0, control:0 } },
      { label: '感情と情報を分け、使える指摘を1つだけ改善に回す', tag: 'ノイズから信号を取る', scores:{ learn:2, control:2 } },
    ]
  },
  {
    domain: 'GROWTH', title: '3か月続けた新しい取り組み。売上はまだ増えていないが、反応率は少しずつ改善している。', note: '別の新しい案も魅力的に見える。',
    options: [
      { label: '売上が出ていないので、新しい案へ切り替える', tag: '新規へ移動', scores:{ action:1, compound:0, learn:1 } },
      { label: '撤退条件を決めたうえで、改善中の指標をあと3回検証する', tag: '学習を積む', scores:{ action:2, compound:2, learn:2, risk:1 } },
    ]
  },
  {
    domain: 'CAREER', title: '次の1年。今の収入を守る仕事と、将来の単価を上げる活動が競合した。', note: '両方を100%やる時間はない。',
    options: [
      { label: '確実に請求できる仕事を全部優先する', tag: '確実な現在', scores:{ compound:0, leverage:0 } },
      { label: '生活を守る最低ラインを決め、残りを将来の単価を上げる活動へ固定する', tag: '現在＋未来', scores:{ compound:2, risk:2, leverage:1, control:1 } },
    ]
  },
];

const upgradePrompts = {
  action: { q:'あなたの「実行力」を1段上げるなら？', options:['次の行動を調べ続ける','15分で終わる最小版を今日出す'], best:1, copy:'実行は、意欲より「次の一手の小ささ」で始まりやすくなる。' },
  control: { q:'想定外が起きた直後、最初に探すものは？', options:['誰・何が原因だったか','自分が次に動かせる変数'], best:1, copy:'原因説明より先に可変点を見つけると、行動のハンドルを取り戻しやすい。' },
  compound: { q:'今月1時間だけ未来へ投資するなら？', options:['空いた時間ができたらやる','先にカレンダーへ固定する'], best:1, copy:'複利は大きさより、先に確保して開始することから生まれる。' },
  learn: { q:'失敗から次に持っていくものは？', options:['自分の向き・不向きの判定','次の仮説を1つ'], best:1, copy:'失敗を自己評価ではなく、次の実験データへ変える。' },
  leverage: { q:'自分にしかできない仕事が増えたら？', options:['自分の処理速度を上げる','基準を言語化し、任せられる部分を切り出す'], best:1, copy:'成果の上限を、自分一人の時間から外していく。' },
  risk: { q:'魅力的だが不確実な機会に対して？', options:['確実になるまで待つ','損失上限と撤退条件を決めて小さく試す'], best:1, copy:'挑戦より先に「死なない設計」をすると、試行回数を増やしやすい。' },
};

let state = { index:0, answers:[] };

function show(screen){
  document.querySelectorAll('.screen').forEach((el)=>el.classList.remove('active'));
  $(screen).classList.add('active');
  window.scrollTo({top:0,behavior:'instant'});
}

function emptyScores(){ return Object.fromEntries(Object.keys(AXES).map(k=>[k,0])); }
function maxScores(){
  const out = emptyScores();
  questions.forEach(q=>q.options.forEach(()=>{}));
  questions.forEach(q=>{
    Object.keys(AXES).forEach(axis=>{ out[axis]+=Math.max(...q.options.map(o=>o.scores[axis]||0)); });
  });
  return out;
}
const AXIS_MAX = maxScores();

function calculate(answers=state.answers){
  const raw=emptyScores();
  answers.forEach((choiceIndex,qi)=>{
    const scores=questions[qi]?.options[choiceIndex]?.scores||{};
    Object.entries(scores).forEach(([k,v])=>raw[k]+=v);
  });
  const axisPercent={};
  Object.keys(AXES).forEach(k=>axisPercent[k]=Math.round((raw[k]/Math.max(1,AXIS_MAX[k]))*100));
  const score=Math.round(Object.values(axisPercent).reduce((a,b)=>a+b,0)/Object.keys(axisPercent).length);
  const yen=Math.round((120000000 + 400000000*Math.pow(score/100,1.55))/1000000)*1000000;
  return {raw,axisPercent,score,yen};
}

function formatYen(yen){
  const oku=Math.floor(yen/100000000);
  const man=Math.round((yen%100000000)/10000);
  if(oku===0) return `${man.toLocaleString('ja-JP')}万円`;
  return man?`${oku}億${man.toLocaleString('ja-JP')}万円`:`${oku}億円`;
}

function resultType(score){
  if(score>=90) return ['複利設計者','目先の得より、行動・学習・人・資本を「次の選択肢が増える方」へ回す判断がかなり強い。成功の主戦場は、もっと頑張ることより大きいレバレッジを選ぶこと。'];
  if(score>=78) return ['伸び続ける実行家','考えて終わらず、現実に出して修正する流れが強い。今後の差は「何を自分でやめ、何を仕組みや他人へ渡すか」で広がりやすい。'];
  if(score>=65) return ['堅実成長型','危険を避けすぎず、現実的に前へ進める。短期の安心が優先される場面を1つだけ未来投資へ置き換えると、伸び方が変わりやすい。'];
  if(score>=50) return ['安定優先型','大崩れしにくい一方、失敗回避・抱え込み・目先優先が重なると、成長機会を小さくしやすい。全部変えず、最弱1項目だけ鍛えるのが効率的。'];
  return ['伸びしろ保有型','今は「失敗しない」「自分で抱える」「確実になるまで待つ」が判断を支配しやすい。能力不足というより、未来に複利がかかる選択をまだ使っていない状態。'];
}

function start(){ state={index:0,answers:[]}; renderQuestion(); show('questionScreen'); }

function renderQuestion(){
  const q=questions[state.index];
  $('progressText').textContent=`${String(state.index+1).padStart(2,'0')} / ${questions.length}`;
  $('progressBar').style.width=`${((state.index)/questions.length)*100}%`;
  $('futureDot').style.left=`${8+(state.index/questions.length)*84}%`;
  $('sceneKicker').textContent=`SCENE ${String(state.index+1).padStart(2,'0')} · ${q.domain}`;
  $('questionTitle').textContent=q.title;
  $('questionNote').textContent=q.note;
  $('signalLabel').textContent=state.index<4?'判断中':state.index<8?'傾向形成中':'未来線ほぼ完成';
  const wrap=$('choices'); wrap.innerHTML='';
  q.options.forEach((o,i)=>{
    const btn=document.createElement('button'); btn.type='button'; btn.className='path';
    btn.innerHTML=`<small>PATH ${String.fromCharCode(65+i)} · ${o.tag}</small><strong>${o.label}</strong>`;
    btn.addEventListener('click',()=>choose(i,btn)); wrap.appendChild(btn);
  });
  $('backBtn').hidden=state.index===0;
}

function choose(choiceIndex,button){
  [...$('choices').children].forEach((el)=>el.classList.add(el===button?'chosen':'fade'));
  if(navigator.vibrate) navigator.vibrate(12);
  state.answers[state.index]=choiceIndex;
  setTimeout(()=>{
    if(state.index<questions.length-1){ state.index++; renderQuestion(); }
    else reveal();
  },250);
}

function back(){
  if(state.index===0) return;
  state.answers=state.answers.slice(0,-1); state.index--; renderQuestion();
}

function reveal(){
  show('revealScreen');
  const labels=['実行','統制','複利','学習','協力','リスク'];
  $('calcGrid').innerHTML=labels.map(x=>`<span>${x}</span>`).join('');
  const cells=[...$('calcGrid').children];
  cells.forEach((c,i)=>setTimeout(()=>c.classList.add('done'),180+i*130));
  setTimeout(renderResult,1150);
}

function renderResult(saved=null){
  const result=saved?.result||calculate(saved?.answers||state.answers);
  const answers=saved?.answers||state.answers;
  const [type,lead]=resultType(result.score);
  const sorted=Object.entries(result.axisPercent).sort((a,b)=>b[1]-a[1]);
  const top=sorted[0][0], weak=sorted.at(-1)[0];
  $('moneyValue').textContent=formatYen(result.yen);
  $('moneyRange').textContent='※ 実収入の予測ではなく、意思決定スコアのゲーム換算';
  $('resultTitle').textContent=type;
  $('resultLead').textContent=lead;
  $('topStrength').textContent=AXES[top].label;
  $('topStrengthText').textContent=AXES[top].good;
  const noWeakness=result.axisPercent[weak]>=90;
  $('weakLabel').textContent=noWeakness?'弱点なし':'最大のブレーキ';
  $('topWeakness').textContent=noWeakness?'6項目すべて高水準':AXES[weak].label;
  $('topWeaknessText').textContent=noWeakness?'思考修正より、より大きな実戦で同じ判断を維持できるかが次のテーマ。':AXES[weak].weak;
  $('scoreValue').textContent=`${result.score}/100`;
  $('meters').innerHTML=Object.entries(result.axisPercent).map(([k,v])=>`<div class="meter"><label>${AXES[k].label}</label><i><b style="width:${v}%"></b></i><em>${v}</em></div>`).join('');
  $('shareMoney').textContent=formatYen(result.yen);
  $('shareType').textContent=`${type}｜成功マインド ${result.score}/100`;
  renderUpgrade(weak,result);
  const save={answers,result,at:Date.now()};
  store.setItem(STORAGE_KEY,JSON.stringify(save));
  $('lastResultBtn').hidden=false;
  show('resultScreen');
}

function renderUpgrade(weak,result){
  const noWeakness=result.axisPercent[weak]>=90;
  const u=noWeakness
    ? {q:'次に伸ばすのは「考え方」ではなく、挑戦のサイズ。',options:['今の安全な規模で続ける','損失上限を決めて、実戦のサイズを1段上げる'],best:1,copy:'高得点帯では思考の正解探しより、同じ判断をより大きな責任・金額・人の場面で使えるかが次の差になる。'}
    : upgradePrompts[weak];
  $('upgradePrompt').textContent=u.q;
  $('upgradeResult').hidden=true;
  $('upgradeActions').innerHTML='';
  u.options.forEach((text,i)=>{
    const btn=document.createElement('button'); btn.type='button'; btn.textContent=text;
    btn.addEventListener('click',()=>{
      [...$('upgradeActions').children].forEach((b,j)=>b.classList.toggle('best',j===i));
      const gap=Math.max(0,100-result.axisPercent[weak]);
      const gain=(i===u.best && !noWeakness)?Math.round((gap*700000)/1000000)*1000000:0;
      $('upgradeResult').hidden=false;
      $('upgradeMoney').textContent=gain?`${formatYen(result.yen+gain)} (+${formatYen(gain)})`:noWeakness?'5億2,000万円（換算上限）':'金額は据え置き';
      $('upgradeCopy').textContent=i===u.best?u.copy:'今までの判断パターンを選んだ。変えるなら、もう一方を1回だけ現実で試してみる。';
    });
    $('upgradeActions').appendChild(btn);
  });
}

async function share(){
  const saved=JSON.parse(store.getItem(STORAGE_KEY)||'null'); if(!saved) return;
  const [type]=resultType(saved.result.score);
  const text=`成功マインド診断\n成功マインド換算 生涯年収：${formatYen(saved.result.yen)}\nタイプ：${type}\nスコア：${saved.result.score}/100\n\n※実収入予測ではなくゲーム換算\n${location.href}`;
  try{
    if(navigator.share){await navigator.share({title:'成功マインド診断',text});}
    else{await navigator.clipboard.writeText(text);$('shareBtn').firstChild.textContent='結果をコピーしました ';}
  }catch(e){}
}

function showLast(){
  const saved=JSON.parse(store.getItem(STORAGE_KEY)||'null');
  if(saved?.result) renderResult(saved);
}

$('startBtn').addEventListener('click',start);
$('backBtn').addEventListener('click',back);
$('againBtn').addEventListener('click',start);
$('shareBtn').addEventListener('click',share);
$('lastResultBtn').addEventListener('click',showLast);
try{$('lastResultBtn').hidden=!JSON.parse(store.getItem(STORAGE_KEY)||'null')?.result;}catch(e){}
