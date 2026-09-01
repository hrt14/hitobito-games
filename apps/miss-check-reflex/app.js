(()=>{
const app=document.getElementById('app');
const reset=document.getElementById('resetBtn');
const STORE='levelup-miss-check-reflex-v1';
const SESSION_ROUNDS=6;
const HOLD_MS=700;

const MODES={
  leftRight:{label:'右・左',desc:'方向を思い込みで取り違える',rule:'動かす前に、対象を指して「右／左」と言う。'},
  sourceTarget:{label:'元・先',desc:'コピー元とコピー先、AとBを逆にする',rule:'実行前に「元はどっち、先はどっち」と指して確認する。'},
  date:{label:'日付',desc:'今日・明日、締切日を1日ずらす',rule:'入力前に日付を声に出し、表示された数字をもう一度見る。'},
  recipient:{label:'宛先',desc:'送る相手やTo/Ccを思い込みで選ぶ',rule:'送信直前に宛先欄を指して、相手の名前を読む。'},
  tax:{label:'税込・税抜',desc:'似た金額条件を取り違える',rule:'金額を入れる直前に「税込？ 税抜？」と口に出してから入力する。'},
  custom:{label:'その他',desc:'自分が何度も繰り返すミス',rule:'実行ボタンの直前で0.7秒止まり、対象と条件を声に出して確認する。'}
};

const SETS={
  leftRight:[
    ['右の箱へ移動',['左','右'],1],['左のフォルダを開く',['左','右'],0],['右側の列を選ぶ',['左','右'],1],['左の矢印を押す',['左','右'],0],['右のタブへ切り替える',['左','右'],1],['左側だけを残す',['左','右'],0]
  ],
  sourceTarget:[
    ['コピー先を選ぶ',['コピー元','コピー先'],1],['コピー元を確認する',['コピー元','コピー先'],0],['貼り付け先を選ぶ',['貼り付け元','貼り付け先'],1],['更新前のデータを選ぶ',['更新前','更新後'],0],['移動先を選ぶ',['移動元','移動先'],1],['参照元を選ぶ',['参照元','反映先'],0]
  ],
  date:[
    ['締切は 9月2日',['9月1日','9月2日'],1],['入力するのは 10月11日',['10月11日','10月12日'],0],['開始日は 12月3日',['12月2日','12月3日'],1],['提出日は 4月18日',['4月18日','4月19日'],0],['対象日は 7月21日',['7月20日','7月21日'],1],['更新日は 11月6日',['11月6日','11月7日'],0]
  ],
  recipient:[
    ['送る相手は「佐藤さん」',['佐藤さん','鈴木さん'],0],['To は「営業部」',['営業部','制作部'],0],['Cc に入れるのは「田中さん」',['高橋さん','田中さん'],1],['送信先は「経理」',['総務','経理'],1],['共有するのは「山田さん」',['山本さん','山田さん'],1],['返信先は「伊藤さん」',['伊藤さん','加藤さん'],0]
  ],
  tax:[
    ['入力するのは「税込」',['税抜','税込'],1],['比較するのは「税抜」',['税抜','税込'],0],['表示価格は「税込」',['税込','税抜'],0],['計算基準は「税抜」',['税込','税抜'],1],['転記するのは「税込」',['税抜','税込'],1],['原価表は「税抜」',['税抜','税込'],0]
  ]
};

let mode='leftRight';
let customText='';
let round=0;
let checked=false;
let holdTimer=null;
let holdStart=0;
let stats={premature:0,correct:0,wrong:0,holds:0};

function loadLast(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function saveLast(data){try{localStorage.setItem(STORE,JSON.stringify(data))}catch{}}
function vibrate(pattern){try{navigator.vibrate?.(pattern)}catch{}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function titleForMode(){return MODES[mode]?.label||'確認'}
function ruleForMode(){
  if(mode==='custom'&&customText.trim()) return `「${customText.trim()}」の直前で0.7秒止まり、対象と条件を声に出してから実行する。`;
  return MODES[mode].rule;
}
function pressureFor(i){
  if(i<2)return['通常','急がなくていい。まず確認。'];
  if(i===2)return['ちょっと急ぎ','急いでも確認を飛ばさない。'];
  if(i===3)return['あと3秒のつもり','焦りを感じたら、それが確認の合図。'];
  if(i===4)return['慣れてきた頃','「分かった」が一番危ない。'];
  return['最後の1問','速さより、確認してから正確に。'];
}
function scenarios(){
  if(mode==='custom') return [
    ['確認した対象を選ぶ',['A','B'],1],['実行前にもう一度見る',['条件A','条件B'],0],['思い込みではなく表示を選ぶ',['表示1','表示2'],1],['対象を声に出してから選ぶ',['対象A','対象B'],0],['0.7秒止まってから選ぶ',['左の対象','右の対象'],1],['最後も確認してから選ぶ',['条件A','条件B'],0]
  ];
  return SETS[mode];
}
function home(){
  reset.hidden=true;
  const last=loadLast();
  app.innerHTML=`<section class="hero">
    <div class="eyebrow">STOP → CHECK → ACT</div>
    <h1>同じミスを繰り返さない<br>3秒確認</h1>
    <p class="lead">右と左、宛先、日付。<strong>「分かった」と思った瞬間に押す前に、0.7秒止まる反射</strong>を30秒で練習します。</p>
    <div class="promise"><span>30秒</span><span>6回だけ</span><span>注意力テストではない</span></div>
    <button class="primary" id="startBtn">自分のミスを選ぶ</button>
    ${last?`<div class="previous">前回：<strong>${esc(last.modeLabel)}</strong> ／ 確認してから正解 ${last.correct}/${SESSION_ROUNDS} ／ 先走り ${last.premature}回</div>`:''}
  </section>`;
  document.getElementById('startBtn').onclick=chooseMode;
}
function chooseMode(){
  reset.hidden=false;
  app.innerHTML=`<section>
    <div class="eyebrow">STEP 1</div>
    <h1 class="section-title">何を繰り返し間違えますか？</h1>
    <p class="section-copy">一番よく起きるものを1つだけ。原因探しではなく、直前の確認動作を作ります。</p>
    <div class="category-grid">${Object.entries(MODES).map(([k,v])=>`<button class="category ${k===mode?'selected':''}" data-mode="${k}"><b>${v.label}</b><span>${v.desc}</span></button>`).join('')}</div>
    <div class="custom-wrap" id="customWrap" ${mode==='custom'?'':'hidden'}>
      <label for="customInput">繰り返しているミス</label>
      <input id="customInput" maxlength="50" placeholder="例：請求書で税込と税抜を逆にする" value="${esc(customText)}">
    </div>
    <div class="actions"><button class="primary" id="trainBtn">30秒トレーニング</button><button class="secondary" id="backBtn">戻る</button></div>
  </section>`;
  app.querySelectorAll('.category').forEach(b=>b.onclick=()=>{
    mode=b.dataset.mode;
    chooseMode();
    if(mode==='custom') document.getElementById('customInput')?.focus();
  });
  const input=document.getElementById('customInput');
  if(input) input.oninput=e=>customText=e.target.value;
  document.getElementById('trainBtn').onclick=()=>{if(input)customText=input.value;startTraining()};
  document.getElementById('backBtn').onclick=home;
}
function startTraining(){
  round=0;checked=false;stats={premature:0,correct:0,wrong:0,holds:0};
  renderRound();
}
function renderRound(){
  const set=scenarios();
  const s=set[round];
  checked=false;
  const [pressure,pressureCopy]=pressureFor(round);
  app.innerHTML=`<section>
    <div class="progress-head"><span>${titleForMode()} ／ ${round+1} of ${SESSION_ROUNDS}</span><span>${Math.round(round/SESSION_ROUNDS*100)}%</span></div>
    <div class="progress"><i style="width:${round/SESSION_ROUNDS*100}%"></i></div>
    <div class="trial" id="trial">
      <div class="pressure ${round>=3?'urgent':''}">${pressure}</div>
      <div class="instruction">${esc(s[0])}</div>
      <div class="cue" id="cue">${pressureCopy}<br><strong>選ぶ前に「確認」を長押し。</strong></div>
      <button class="hold" id="holdBtn" type="button" aria-label="確認を長押し"><span>0.7秒 長押しして確認</span></button>
      <div class="choices">${s[1].map((x,i)=>`<button class="choice locked" data-i="${i}" aria-disabled="true">${esc(x)}</button>`).join('')}</div>
      <div class="feedback" id="feedback">まだ選べません。止まってから選ぶのが、このトレーニングです。</div>
      <div class="mini">正解の速さではなく、「確認を挟んでから動けたか」を記録します。</div>
    </div>
  </section>`;
  bindRound(s[2]);
}
function bindRound(correctIndex){
  const hold=document.getElementById('holdBtn');
  const trial=document.getElementById('trial');
  const feedback=document.getElementById('feedback');
  const choices=[...app.querySelectorAll('.choice')];
  function startHold(e){
    e.preventDefault();
    if(checked)return;
    holdStart=performance.now();
    hold.style.setProperty('--hold-progress','0%');
    let raf;
    const tick=()=>{
      const p=Math.min(100,(performance.now()-holdStart)/HOLD_MS*100);
      hold.style.setProperty('--hold-progress',`${p}%`);
      if(p<100&&!checked)raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    holdTimer=setTimeout(()=>{
      cancelAnimationFrame(raf);
      checked=true;stats.holds++;
      hold.classList.add('ready');
      hold.querySelector('span').textContent='確認した。表示を見て選ぶ';
      document.getElementById('cue').innerHTML='<strong>対象を指す → 声に出す → 選ぶ</strong>';
      feedback.className='feedback ok';
      feedback.textContent='ここで初めて実行。思い込みではなく、今見えている表示を選ぶ。';
      choices.forEach(c=>{c.classList.remove('locked');c.setAttribute('aria-disabled','false')});
      vibrate(20);
    },HOLD_MS);
  }
  function cancelHold(){
    if(checked)return;
    clearTimeout(holdTimer);
    hold.style.setProperty('--hold-progress','0%');
  }
  hold.addEventListener('pointerdown',startHold,{passive:false});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>hold.addEventListener(ev,cancelHold,{passive:true}));
  choices.forEach(c=>{
    c.addEventListener('click',()=>{
      if(!checked){
        stats.premature++;
        trial.classList.remove('shake');void trial.offsetWidth;trial.classList.add('shake');
        feedback.className='feedback warn';
        feedback.textContent='先に押しそうになった。これが実務で止めたい瞬間。まず確認。';
        vibrate([20,35,20]);
        return;
      }
      const i=+c.dataset.i;
      choices.forEach(x=>{x.classList.add('locked');x.setAttribute('aria-disabled','true')});
      if(i===correctIndex){
        stats.correct++;c.classList.add('correct');
        feedback.className='feedback ok';feedback.textContent='確認してから正しく選べた。速さより、この順番を残す。';
        vibrate(30);
      }else{
        stats.wrong++;c.classList.add('wrong');choices[correctIndex]?.classList.add('correct');
        feedback.className='feedback warn';feedback.textContent='確認を挟んでも取り違えた。次は「対象を声に出す」まで丁寧に。';
        vibrate([25,40,25]);
      }
      setTimeout(()=>{round++;if(round<SESSION_ROUNDS)renderRound();else showResult()},650);
    });
  });
}
function showResult(){
  const checkRate=Math.round(stats.holds/SESSION_ROUNDS*100);
  const score=Math.max(0,Math.min(100,Math.round(checkRate-(stats.premature*8)-(stats.wrong*10))));
  const data={at:new Date().toISOString(),mode,modeLabel:titleForMode(),customText,correct:stats.correct,wrong:stats.wrong,premature:stats.premature,score,rule:ruleForMode()};
  const prev=loadLast();saveLast(data);
  reset.hidden=false;
  app.innerHTML=`<section class="result-card">
    <div class="eyebrow">SESSION RESULT</div>
    <h2>確認反射 ${score}%</h2>
    <p class="section-copy">「すぐ押す」より先に確認を置けた割合から、先走りと取り違えを引いて表示しています。</p>
    <div class="big-score"><strong>${score}</strong><span>/ 100</span></div>
    <div class="metrics">
      <div class="metric"><strong>${stats.correct}</strong><span>確認後の正解</span></div>
      <div class="metric"><strong>${stats.premature}</strong><span>先走り</span></div>
      <div class="metric"><strong>${stats.wrong}</strong><span>確認後のミス</span></div>
    </div>
    <div class="rule"><small>今日、実務に持ち帰る1ルール</small><strong>${esc(ruleForMode())}</strong></div>
    ${prev?`<div class="history">前回 ${prev.score} → 今回 <b>${score}</b>。${score>prev.score?'確認を挟む順番が前回より安定しました。':score===prev.score?'同じ水準。次は先走り0回を狙います。':'次回はスピードより、先走りを1回減らすことだけ狙います。'}</div>`:''}
    <div class="actions"><button class="primary" id="againBtn">同じミスでもう1回</button><button class="secondary" id="changeBtn">別のミスを選ぶ</button></div>
  </section>`;
  document.getElementById('againBtn').onclick=startTraining;
  document.getElementById('changeBtn').onclick=chooseMode;
}
reset.onclick=home;
home();
})();
