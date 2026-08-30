(() => {
  const app = document.getElementById('app');
  const scienceBtn = document.getElementById('scienceBtn');
  const scienceDialog = document.getElementById('scienceDialog');
  const scienceClose = document.getElementById('scienceClose');
  const scienceList = document.getElementById('scienceList');
  const exitBtn = document.getElementById('exitBtn');
  const STORE = 'thick-self:v1';
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());

  const SKILLS = {
    pause:{label:'余白',short:'反射しない',theory:'Equanimity / Non-reactivity',source:'Baer et al. (2008) FFMQ',url:'https://pubmed.ncbi.nlm.nih.gov/18310597/',color:'#4b7a60'},
    accept:{label:'受容',short:'追い出さない',theory:'Acceptance',source:'Ford et al. (2018)',url:'https://pubmed.ncbi.nlm.nih.gov/28703602/',color:'#6b7f58'},
    distance:{label:'距離',short:'事実と物語を分ける',theory:'Decentering / Defusion',source:'Macri & Rogge (2024)',url:'https://pubmed.ncbi.nlm.nih.gov/38615492/',color:'#4a7282'},
    uncertainty:{label:'曖昧さ',short:'未確定を置く',theory:'Tolerance of Uncertainty',source:'Näsling et al. (2024)',url:'https://pubmed.ncbi.nlm.nih.gov/39036833/',color:'#806f4d'},
    depth:{label:'奥行き',short:'複数の真実を持つ',theory:'Wise Reasoning / Intellectual Humility',source:'Grossmann & Brienza (2018)',url:'https://pubmed.ncbi.nlm.nih.gov/31162449/',color:'#715b7f'},
    lightness:{label:'軽やかさ',short:'欲を持ち、握りすぎない',theory:'Nonattachment / Psychological Flexibility',source:'Ho et al. (2022)',url:'https://pubmed.ncbi.nlm.nih.gov/35690041/',color:'#477b78'},
    recovery:{label:'復元',short:'揺れても戻る',theory:'Resilience',source:'2024 umbrella review',url:'https://pubmed.ncbi.nlm.nih.gov/39429523/',color:'#7c5f55'}
  };
  const ORDER = Object.keys(SKILLS);

  const SCENARIOS = {
    pause:[
      {context:'仕事 / 批判',text:'「この案、正直かなり微妙だと思う」と言われた。',after:['すぐ反論する','何が微妙かを聞く','今日は返答を保留する'],best:[1,2],why:'最初の反射と行動の間に時間を作る。怒りを消す必要はありません。'},
      {context:'SNS / 刺激',text:'自分を名指しで批判する投稿を見つけた。',after:['その場で引用して反論する','一度画面を閉じる','相手の人格を分析する'],best:[1],why:'刺激直後は、まず反応を遅らせる。内容の検討はその後でもできます。'},
      {context:'家庭 / いら立ち',text:'疲れて帰った瞬間に、家族から強い口調で頼み事をされた。',after:['同じ強さで返す','一度「今ちょっと余裕ない」と伝える','無言で全部引き受ける'],best:[1],why:'反射的に攻撃も服従もしない。間を作ったうえで状態を伝えます。'}
    ],
    accept:[
      {context:'比較 / 嫉妬',text:'自分より若い人が、自分より高く評価された。',emotion:'嫉妬',why:'嫉妬を消そうとすると、嫉妬への自己否定まで増えやすい。まず「ある」と置きます。'},
      {context:'失敗 / 恥',text:'人前で、自分の大きな勘違いが発覚した。',emotion:'恥ずかしさ',why:'恥ずかしさが出ることと、自分全体の価値は別です。感情の存在を先に認めます。'},
      {context:'成功 / 見栄',text:'大きな成果が出て、周囲からかなり褒められた。',emotion:'自慢したい気持ち',why:'見栄や承認欲求も人間の反応。否定せず認めることで、行動だけを別に選べます。'}
    ],
    distance:[
      {context:'返信 / 不安',text:'大事な相手から半日返信がない。',items:[['半日返信がない','fact'],['嫌われた','story'],['何か気に障ることを言った','story'],['今は理由が分からない','fact']],why:'観察できる事実と、頭が補った意味を分けます。'},
      {context:'評価 / 落胆',text:'企画が採用されなかった。',items:[['企画は採用されなかった','fact'],['自分には才能がない','story'],['今回の判断理由はまだ全部分からない','fact'],['もう将来も評価されない','story']],why:'一回の結果から、自己価値や未来まで一気に確定しない。'},
      {context:'会話 / 反芻',text:'会議で自分が話したあと、少し沈黙があった。',items:[['少し沈黙があった','fact'],['みんな呆れた','story'],['自分の発言が原因かは不明','fact'],['恥をかいた','story']],why:'「起きたこと」と「意味づけ」を分けるほど、余計な反芻を足しにくくなります。'}
    ],
    uncertainty:[
      {context:'仕事 / 不確実',text:'重要な案件の返事が予定日を過ぎても来ない。',items:[['返事がまだ来ていない',false],['相手は断るつもりだ',true],['自分の提案の評価',true],['今日できる別の仕事がある',false]],why:'今わからないものを「悪い結論」で埋めない。未確定のまま置けること自体が訓練です。'},
      {context:'人間関係 / 不確実',text:'いつもより相手の反応がそっけなかった。',items:[['今日は反応がそっけなかった',false],['自分に怒っている',true],['相手に別の事情がある可能性',true],['関係が終わった',true]],why:'説明がない部分を一つの物語で埋めず、複数の可能性を未確定のまま残します。'},
      {context:'将来 / 不確実',text:'新しい挑戦を始めたが、成果が出るかはまだ分からない。',items:[['成果が出るか',true],['今日の一手をやるか',false],['自分に向いているかの最終結論',true],['今は途中である',false]],why:'未来の確定を待たず、未確定と行動可能を切り分けます。'}
    ],
    depth:[
      {context:'成功 / 謙虚',text:'自分の仕事が大成功した。両方持てる2つを選ぶ。',items:[['自分はよくやった','keep'],['成功したから自分は人より上だ','drop'],['運や周囲の助けもあった','keep'],['謙虚でいるため喜ばない','drop']],why:'達成を小さくする必要はない。同時に、自分だけの力だと巨大化もしない。'},
      {context:'対立 / 視点',text:'相手と激しく意見が対立した。両方持てる2つを選ぶ。',items:[['自分の判断には根拠がある','keep'],['自分が正しいなら相手は愚かだ','drop'],['相手にも自分が見えていない事情があるかもしれない','keep'],['揉めないため自分の意見を捨てる','drop']],why:'自分の立場を持ちながら、知識の限界と別視点も同時に残します。'},
      {context:'自己評価 / 矛盾',text:'大きなミスをした。両方持てる2つを選ぶ。',items:[['今回、自分には改善点がある','keep'],['ミスした自分はダメな人間だ','drop'],['これまで積み上げた能力まで消えたわけではない','keep'],['前向きになるため反省しない','drop']],why:'反省と自己尊重は両立します。どちらかを消す必要はありません。'}
    ],
    lightness:[
      {context:'欲 / 評価',text:'「もっと評価されたい」という欲が強くなっている。',desire:'評価されたい',target:[35,65],why:'欲を0にするのではなく、「欲しい。でもそれだけが自分ではない」位置へ戻します。'},
      {context:'欲 / お金',text:'「もっと稼ぎたい」が頭の大部分を占め始めた。',desire:'もっと稼ぎたい',target:[35,65],why:'目標は持ったまま、手に入るかどうかと自己価値を結びつけすぎない。'},
      {context:'権力 / 影響力',text:'自分の意見が通る立場になり、もっと決定権が欲しくなった。',desire:'もっと権限が欲しい',target:[35,65],why:'権力欲も否定しない。ただし「持つ」と「握りしめる」を分けます。'}
    ],
    recovery:[
      {context:'失敗 / 復帰',text:'大きなミスでかなり取り乱した。まだ気持ちは6/10で重い。',items:[['今日必要な連絡を1本だけする','best'],['気持ちが0になるまで何もしない','bad'],['原因を完璧に分析してから動く','bad'],['自分を責めて気合いを入れる','bad']],why:'完全回復を待たず、日常へ戻る最小の一手を置きます。'},
      {context:'落胆 / 復帰',text:'期待していた話がなくなった。まだかなり落ち込んでいる。',items:[['次の予定を1つだけ通常どおりやる','best'],['無理に前向きな意味を作る','bad'],['落ち込んでいる自分を叱る','bad'],['すぐ別の大目標を立てて埋める','bad']],why:'落胆したままでも、生活へ一歩戻れます。戻ることと「もう平気」は同じではありません。'},
      {context:'対人 / 復帰',text:'感情的な言い方をしてしまい、後悔している。',items:[['落ち着いたら必要な部分だけ修復する','best'],['恥ずかしいので相手を避け続ける','bad'],['自分は最低だと反省し続ける','bad'],['何もなかったことにする','bad']],why:'失敗を否定も自己攻撃もせず、修復できる部分へ戻ります。'}
    ]
  };

  function load(){try{return JSON.parse(localStorage.getItem(STORE))||{}}catch{return{}}}
  function save(s){localStorage.setItem(STORE,JSON.stringify(s))}
  function defaultState(){return{version:1,history:[],skill:{},lastChallenge:null,lastReturn:null,session:null}}
  let state = Object.assign(defaultState(),load());
  ORDER.forEach(k=>{if(!state.skill[k])state.skill[k]={attempts:0,score:0,recent:[]}});
  save(state);

  function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function pickFor(skill,offset=0){const arr=SCENARIOS[skill];return arr[(hash(today()+skill)+offset)%arr.length]}
  function pctFor(k){const r=state.skill[k].recent||[];if(!r.length)return 0;return Math.round(r.reduce((a,b)=>a+b,0)/r.length*100)}
  function overall(){return Math.round(ORDER.reduce((sum,k)=>sum+pctFor(k),0)/ORDER.length)}
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function haptic(ms=20){try{navigator.vibrate?.(ms)}catch{}}
  function markSkill(k,value){const s=state.skill[k];s.attempts++;s.recent.push(value);if(s.recent.length>7)s.recent.shift();s.score=pctFor(k);save(state)}
  function layersHtml(){return `<div class="layer-stack">${ORDER.map(k=>`<div class="layer" title="${SKILLS[k].label}"><i style="--w:${pctFor(k)}%;background:${SKILLS[k].color}"></i></div>`).join('')}</div><div class="layer-labels">${ORDER.map(k=>`<span>${SKILLS[k].label}</span>`).join('')}</div>`}
  function science(){scienceList.innerHTML=ORDER.map(k=>{const s=SKILLS[k];return `<div class="science-item"><b>${s.label} — ${s.short}</b><span>${s.theory}</span><a href="${s.url}" target="_blank" rel="noopener">${s.source} ↗</a></div>`}).join('')}
  science(); scienceBtn.onclick=()=>scienceDialog.showModal(); scienceClose.onclick=()=>scienceDialog.close(); scienceDialog.addEventListener('click',e=>{if(e.target===scienceDialog)scienceDialog.close()}); exitBtn.onclick=()=>{if(confirm('LEVEL UPホームへ戻りますか？'))location.href='/'};

  function returnCheck(){if(!state.lastChallenge || state.lastReturn===state.lastChallenge.date || state.lastChallenge.date===today())return'';return `<section class="daily-return"><h3>昨日の実戦、どうだった？</h3><p>${escapeHtml(state.lastChallenge.text)}</p><div class="mini-choices"><button data-ret="1">できた</button><button data-ret="0.5">気づいた</button><button data-ret="0">思い出せなかった</button></div></section>`}
  function bindReturn(){app.querySelectorAll('[data-ret]').forEach(b=>b.onclick=()=>{state.lastReturn=state.lastChallenge.date;state.history.push({date:today(),kind:'field-return',value:Number(b.dataset.ret)});save(state);renderHome()})}
  function renderHome(){const done=state.history.some(x=>x.kind==='session'&&x.date===today());app.innerHTML=`<section class="hero"><div class="eyebrow">DAILY 3-MIN RESPONSE TRAINING</div><h1>分厚い自分を<span>つくる。</span></h1><p class="lead">取り乱さない人ではなく、<strong>取り乱しても戻れる人へ。</strong><br>7つの反応の型を、説明ではなく毎日の反復で身につける。</p><div class="hero-actions"><button id="startBtn" class="primary">${done?'今日もう一度、7つ稽古する':'今日の7つを稽古する'}</button><p class="micro">約3分。入力なし。感情を消す訓練ではありません。</p></div></section><section class="thickness-card"><div class="thickness-head"><div><div class="eyebrow">PRACTICE THICKNESS</div><div class="thickness-number">${state.history.some(x=>x.kind==='session')?overall():'—'}<small> / 100</small></div></div><p class="micro">最近7回のアプリ内練習から算出する独自指標</p></div>${layersHtml()}</section>${returnCheck()}`;document.getElementById('startBtn').onclick=startSession;bindReturn()}

  function startSession(){state.session={date:today(),i:0,skills:[...ORDER],scores:{},startedAt:Date.now()};save(state);renderRound()}
  function current(){return state.session.skills[state.session.i]}
  function roundShell(skill,scenario,body){const p=Math.round((state.session.i/ORDER.length)*100);app.innerHTML=`<section class="session-top"><div class="progress-wrap"><div class="progress-track"><i style="--p:${p}%"></i></div><div class="progress-text">${state.session.i+1} / ${ORDER.length}</div></div><div class="skill-pill">${SKILLS[skill].label} · ${SKILLS[skill].short}</div></section><section class="scenario-card"><div class="scenario-context">${escapeHtml(scenario.context)}</div><h2>${escapeHtml(scenario.text)}</h2></section><section class="drill" id="drill">${body}</section>`}
  function finishRound(skill,value,why,good=true){state.session.scores[skill]=value;markSkill(skill,value);const drill=document.getElementById('drill');drill.querySelectorAll('button,input').forEach(el=>el.disabled=true);const fb=document.createElement('div');fb.className='feedback'+(good?'':' bad');fb.innerHTML=`<div class="feedback-title">${good?'この型を残す':'ここでもう一度、型を作る'}</div><p>${escapeHtml(why)}</p><div class="theory">背景: ${SKILLS[skill].theory}</div><div class="reward-pop"><div class="reward-layer"><i></i></div><span>${SKILLS[skill].label}の層</span></div><button class="continue-btn" type="button">次へ</button>`;drill.appendChild(fb);fb.querySelector('.continue-btn').onclick=()=>{state.session.i++;save(state);if(state.session.i>=ORDER.length)finishSession();else renderRound()};haptic(good?18:[30,30,30])}

  function renderRound(){const skill=current(),sc=pickFor(skill,state.history.filter(x=>x.kind==='session').length);if(skill==='pause')return drillPause(sc);if(skill==='accept')return drillAccept(sc);if(skill==='distance')return drillDistance(sc);if(skill==='uncertainty')return drillUncertainty(sc);if(skill==='depth')return drillDepth(sc);if(skill==='lightness')return drillLightness(sc);if(skill==='recovery')return drillRecovery(sc)}

  function drillPause(sc){roundShell('pause',sc,`<p class="instruction"><strong>最初の3秒は、何もしない。</strong> 反応したくなる感じだけ見てください。</p><div class="pause-stage"><div class="pause-orb" id="orb"><b id="count">3</b></div><button id="tempt" class="tempt-btn">今すぐ返す</button></div><div id="afterPause"></div>`);let early=0,left=3;const tempt=document.getElementById('tempt'),orb=document.getElementById('orb'),count=document.getElementById('count');tempt.onclick=()=>{early++;tempt.classList.remove('shake');void tempt.offsetWidth;tempt.classList.add('shake');tempt.textContent='反射した。でも、まだ戻れる';haptic(30);setTimeout(()=>{if(!tempt.disabled)tempt.textContent='今すぐ返す'},650)};const timer=setInterval(()=>{left--;count.textContent=left||'✓';if(left<=0){clearInterval(timer);orb.classList.add('safe');tempt.disabled=true;document.getElementById('afterPause').innerHTML=`<p class="instruction" style="margin-top:15px">間ができました。<strong>次の行動は今選べる。</strong></p><div class="choice-list">${sc.after.map((x,i)=>`<button class="choice-btn" data-i="${i}">${escapeHtml(x)}</button>`).join('')}</div>`;document.querySelectorAll('.choice-btn').forEach(b=>b.onclick=()=>{const ok=sc.best.includes(Number(b.dataset.i));b.classList.add(ok?'correct':'wrong');finishRound('pause',ok&&early===0?1:ok?0.75:0.25,sc.why,ok)})}},1000)}

  function drillAccept(sc){roundShell('accept',sc,`<p class="instruction">この感情を<strong>消すか、あるものとして置くか。</strong></p><div class="emotion-zone"><div class="emotion-chip" id="emotion">${escapeHtml(sc.emotion)}</div><div class="accept-actions"><button id="erase">消す</button><button id="place">ここに置く</button></div></div>`);document.getElementById('erase').onclick=()=>finishRound('accept',0.25,sc.why,false);document.getElementById('place').onclick=()=>{document.getElementById('emotion').classList.add('placed');setTimeout(()=>finishRound('accept',1,sc.why,true),300)}}

  function drillDistance(sc){roundShell('distance',sc,`<p class="instruction">4つを<strong>事実 / 頭が足した物語</strong>に分ける。</p><div class="sort-list">${sc.items.map((it,i)=>`<div class="sort-row" data-row="${i}"><p>${escapeHtml(it[0])}</p><div class="sort-controls"><button data-v="fact">事実</button><button data-v="story">物語</button></div></div>`).join('')}</div><button id="judge" class="continue-btn" type="button">判定する</button>`);const answers={};document.querySelectorAll('.sort-row').forEach(row=>row.querySelectorAll('button').forEach(b=>b.onclick=()=>{row.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');answers[row.dataset.row]=b.dataset.v}));document.getElementById('judge').onclick=()=>{if(Object.keys(answers).length<sc.items.length){document.getElementById('judge').classList.add('pulse');return}let n=0;sc.items.forEach((it,i)=>{if(answers[i]===it[1])n++});finishRound('distance',n/sc.items.length,sc.why,n>=3)}}

  function drillUncertainty(sc){roundShell('uncertainty',sc,`<p class="instruction"><strong>今はまだ分からないもの</strong>だけを選ぶ。</p><div class="unknown-list">${sc.items.map((it,i)=>`<button class="unknown-btn" data-i="${i}">${escapeHtml(it[0])}</button>`).join('')}</div><button id="judge" class="continue-btn">未確定のまま置く</button>`);const set=new Set();document.querySelectorAll('.unknown-btn').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);set.has(i)?set.delete(i):set.add(i);b.classList.toggle('marked')});document.getElementById('judge').onclick=()=>{let n=0;sc.items.forEach((it,i)=>{if(set.has(i)===it[1])n++});finishRound('uncertainty',n/sc.items.length,sc.why,n>=3)}}

  function drillDepth(sc){roundShell('depth',sc,`<p class="instruction">どちらかを消さない。<strong>同時に持てる2つ</strong>を選ぶ。</p><div class="depth-grid">${sc.items.map((it,i)=>`<button class="depth-card" data-i="${i}">${escapeHtml(it[0])}</button>`).join('')}</div><button id="judge" class="continue-btn">2つを持つ</button>`);const set=new Set();document.querySelectorAll('.depth-card').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);if(set.has(i)){set.delete(i);b.classList.remove('kept')}else if(set.size<2){set.add(i);b.classList.add('kept')}});document.getElementById('judge').onclick=()=>{if(set.size!==2)return;const ok=[...set].every(i=>sc.items[i][1]==='keep');finishRound('depth',ok?1:0.25,sc.why,ok)}}

  function drillLightness(sc){roundShell('lightness',sc,`<p class="instruction"><strong>欲を0にはしない。</strong>「持つ。でも握りしめない」位置へ動かす。</p><div class="grip-wrap"><div class="grip-labels"><span>手放す</span><span>握りしめる</span></div><input id="grip" class="grip-slider" type="range" min="0" max="100" value="90" aria-label="握りしめる強さ"><div class="grip-readout" id="gripRead">90%</div><div class="grip-hint">${escapeHtml(sc.desire)}。欲しい気持ちは残していい。</div></div><button id="judge" class="continue-btn">この持ち方にする</button>`);const input=document.getElementById('grip'),read=document.getElementById('gripRead');input.oninput=()=>read.textContent=input.value+'%';document.getElementById('judge').onclick=()=>{const v=Number(input.value),ok=v>=sc.target[0]&&v<=sc.target[1];const dist=v<sc.target[0]?sc.target[0]-v:v>sc.target[1]?v-sc.target[1]:0;finishRound('lightness',ok?1:Math.max(.2,1-dist/70),sc.why,ok)}}

  function drillRecovery(sc){roundShell('recovery',sc,`<p class="instruction">気持ちが完全に戻るのを待たない。<strong>日常へ戻る最初の一歩</strong>を選ぶ。</p><div class="recovery-path">${sc.items.map((it,i)=>`<button class="recovery-step" data-i="${i}" data-n="${i+1}">${escapeHtml(it[0])}</button>`).join('')}</div>`);document.querySelectorAll('.recovery-step').forEach(b=>b.onclick=()=>{const ok=sc.items[Number(b.dataset.i)][1]==='best';finishRound('recovery',ok?1:.2,sc.why,ok)})}

  function weakest(){return ORDER.slice().sort((a,b)=>pctFor(a)-pctFor(b))[0]}
  function challengeFor(k){const map={pause:'もし今日カッとなったら、返事をする前に10秒置く。',accept:'もし嫌な感情が出たら、「ある」と一度だけ名前をつける。',distance:'もし悪い意味が浮かんだら、事実を1つだけ言い直す。',uncertainty:'もし理由が分からなかったら、「まだ分からない」で一度止める。',depth:'もし自分が正しいと思ったら、同時に成立する別の見方を1つ残す。',lightness:'もし強く欲しくなったら、「欲しい。でもこれが全部ではない」と一度言う。',recovery:'もし取り乱したら、平静になる前でも日常の小さな1つへ戻る。'};return map[k]}
  function finishSession(){const scores=state.session.scores;const avg=Math.round(ORDER.reduce((a,k)=>a+(scores[k]??0),0)/ORDER.length*100);const weak=weakest(),challenge=challengeFor(weak);state.history.push({date:today(),kind:'session',avg,scores,ms:Date.now()-state.session.startedAt});if(state.history.length>90)state.history=state.history.slice(-90);state.lastChallenge={date:today(),skill:weak,text:challenge};state.session=null;save(state);renderSummary(avg,weak,challenge)}
  function renderSummary(avg,weak,challenge){app.innerHTML=`<section class="summary"><div class="summary-hero"><div class="eyebrow">TODAY'S PRACTICE</div><div class="big">${overall()}<small> / 100</small></div><h1>今日も、7層を通した。</h1><p>「強い人」を演じるのではなく、反応の前に余白を作り、抱え、選び、戻る練習。</p></div><section class="thickness-card">${layersHtml()}</section><div class="skill-results">${ORDER.map(k=>`<div class="skill-result"><b>${SKILLS[k].label}</b><span>${SKILLS[k].short}</span><i style="--w:${pctFor(k)}%"></i></div>`).join('')}</div><section class="field-card"><div class="eyebrow">REAL WORLD TRANSFER</div><h2>今日は「${SKILLS[weak].label}」を現実で1回。</h2><p>アプリ内で分かるだけでは終わらせない。実際の刺激が来たときに思い出す。</p><div class="ifthen">${escapeHtml(challenge)}</div></section><div class="summary-actions"><button id="shareBtn" class="primary">今日の厚みを共有</button><button id="homeBtn" class="secondary">ホームへ戻る</button></div><p class="micro" style="margin-top:12px">厚みスコアは心理検査ではなく、最近のアプリ内練習の安定度を示す独自指標です。</p></section>`;document.getElementById('homeBtn').onclick=renderHome;document.getElementById('shareBtn').onclick=()=>shareResult(avg)}
  async function shareResult(avg){const text=`今日の「心の厚み」 ${overall()}/100\n取り乱さない人ではなく、取り乱しても戻れる人へ。\n#分厚い自分`;const url=location.href;try{if(navigator.share){await navigator.share({title:'分厚い自分をつくる',text,url})}else{await navigator.clipboard.writeText(text+'\n'+url);alert('結果をコピーしました')}}catch(e){if(e?.name!=='AbortError')alert('共有できませんでした')}}

  if(state.session?.date===today() && state.session.i<ORDER.length)renderRound();else{state.session=null;save(state);renderHome()}
})();
