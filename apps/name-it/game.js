(() => {
'use strict';
const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const STORAGE_KEY = 'levelup-name-it-v1';
const EMOTIONS = {
  '喜び':{c1:'#ffe879',c2:'#ff9d45',desc:'うれしい、満たされた'},
  '誇らしさ':{c1:'#ffd96a',c2:'#e66d3e',desc:'自分や誰かを誇らしく思う'},
  '安心':{c1:'#91f0c3',c2:'#3ea58d',desc:'危険や心配が和らいだ'},
  '不安':{c1:'#7cc8ff',c2:'#4157ba',desc:'まだ起きていないことが気になる'},
  '緊張':{c1:'#7fdff0',c2:'#386d9c',desc:'本番や評価を前に身体がこわばる'},
  '恐怖':{c1:'#5676c9',c2:'#222a64',desc:'目の前の危険を強く感じる'},
  '焦り':{c1:'#ffb765',c2:'#e24c35',desc:'急がなければ、という圧迫感'},
  '怒り':{c1:'#ff736b',c2:'#9e2136',desc:'侵害や不公平に反発する'},
  '苛立ち':{c1:'#ff9361',c2:'#b54044',desc:'思いどおりに進まず神経が立つ'},
  '悔しさ':{c1:'#ffac58',c2:'#a93f3a',desc:'もっとできた、負けたくなかった'},
  '悲しさ':{c1:'#76a6e8',c2:'#39487c',desc:'失ったことや傷つきを感じる'},
  '寂しさ':{c1:'#8395dc',c2:'#574574',desc:'つながりが足りないと感じる'},
  '落胆':{c1:'#8b96af',c2:'#4f5263',desc:'期待していた結果にならなかった'},
  '恥':{c1:'#cf91d9',c2:'#743f79',desc:'人の目に自分をさらしたくない'},
  '罪悪感':{c1:'#b69be8',c2:'#65558c',desc:'自分の行為を申し訳なく思う'},
  '嫉妬':{c1:'#8fd77a',c2:'#36735d',desc:'関係や立場を奪われそうで苦しい'},
  '羨望':{c1:'#a6e67c',c2:'#559b52',desc:'自分もそれを持ちたいと思う'},
  '戸惑い':{c1:'#d0a4ef',c2:'#6a5a9e',desc:'どう受け止めればいいか定まらない'}
};
const Q = {
 basic:[
  {s:'大事な発表の5分前。',c:'手が冷たい。心臓が少し速い。',a:'緊張',ok:['不安'],o:['緊張','喜び','怒り','寂しさ']},
  {s:'楽しみにしていた予定が急に中止になった。',c:'「せっかく楽しみにしてたのに」と思う。',a:'落胆',ok:['悲しさ'],o:['落胆','安心','羨望','焦り']},
  {s:'自分だけ誘われていなかったことを知った。',c:'胸のあたりが重い。誰かと話したい。',a:'寂しさ',ok:['悲しさ'],o:['寂しさ','誇らしさ','安心','焦り']},
  {s:'提出期限まであと10分。まだ終わっていない。',c:'「間に合わない」が頭の中で繰り返される。',a:'焦り',ok:['不安'],o:['焦り','恥','羨望','安心']},
  {s:'後ろから突然、大きな犬が走ってきた。',c:'身体がびくっとして、すぐ距離を取りたい。',a:'恐怖',ok:[],o:['恐怖','落胆','罪悪感','誇らしさ']},
  {s:'頑張った企画が採用された。',c:'思わず誰かに知らせたくなる。',a:'喜び',ok:['誇らしさ'],o:['喜び','戸惑い','怒り','寂しさ']},
  {s:'約束していたのに、自分が完全に忘れていた。',c:'「相手に悪いことをした」が残る。',a:'罪悪感',ok:['恥'],o:['罪悪感','安心','羨望','苛立ち']},
  {s:'並んでいた列に、目の前で割り込まれた。',c:'反射的に「それは違うだろ」と思う。',a:'怒り',ok:['苛立ち'],o:['怒り','喜び','寂しさ','不安']},
  {s:'何度やってもアプリが同じところで止まる。',c:'机を指でトントンしたくなる。',a:'苛立ち',ok:['怒り'],o:['苛立ち','誇らしさ','恐怖','安心']},
  {s:'ずっと探していた鍵が、ポケットから出てきた。',c:'肩の力が抜ける。',a:'安心',ok:['喜び'],o:['安心','恥','嫉妬','焦り']},
  {s:'試合で最後の一点を自分のミスで落とした。',c:'「あそこを決めたかった」が何度も浮かぶ。',a:'悔しさ',ok:['悲しさ'],o:['悔しさ','安心','羨望','戸惑い']},
  {s:'人前で名前を盛大に言い間違えた。',c:'顔が熱い。その場から一瞬消えたい。',a:'恥',ok:[],o:['恥','怒り','誇らしさ','安心']},
  {s:'長く練習してきた曲を、初めて最後まで弾けた。',c:'「できた」と自分の積み重ねを感じる。',a:'誇らしさ',ok:['喜び'],o:['誇らしさ','罪悪感','不安','苛立ち']},
  {s:'待ち合わせ場所が急に変更された。',c:'「え、どこへ行けば？」と頭が止まる。',a:'戸惑い',ok:['不安'],o:['戸惑い','喜び','怒り','羨望']}
 ],
 precise:[
  {s:'来週の面接を考えると、失敗する場面が何度も浮かぶ。',c:'危険はまだ目の前にはない。',a:'不安',ok:['緊張'],o:['不安','恐怖','怒り','羨望'],tip:'まだ起きていない可能性への心配なら「不安」が近い。'},
  {s:'暗い路地で、すぐ後ろから足音が速く近づいてくる。',c:'今ここから離れたい。',a:'恐怖',ok:['不安'],o:['恐怖','不安','落胆','罪悪感'],tip:'目の前に具体的な危険を感じるときは「恐怖」が近い。'},
  {s:'友人の新しい家を見て「自分もこんな家に住みたい」と思った。',c:'友人との関係を失う心配はない。',a:'羨望',ok:[],o:['羨望','嫉妬','怒り','恥'],tip:'相手が持つものを「自分もほしい」は羨望。'},
  {s:'親しい同僚が、自分より新しく入った人とばかり話している。',c:'自分の居場所を取られそうに感じる。',a:'嫉妬',ok:['寂しさ'],o:['嫉妬','羨望','安心','誇らしさ'],tip:'関係や立場を失いそうな痛みが混じると「嫉妬」に近い。'},
  {s:'会議で間違った数字を言ってしまった。',c:'「みんなに無能だと思われたかも」と顔を上げにくい。',a:'恥',ok:['不安'],o:['恥','罪悪感','怒り','安心'],tip:'自分がどう見えるかが苦しいときは「恥」が近い。'},
  {s:'自分の確認不足で、同僚に余計な残業をさせてしまった。',c:'「悪いことをした。謝りたい」と思う。',a:'罪悪感',ok:['恥'],o:['罪悪感','恥','羨望','安心'],tip:'自分の行為について「申し訳ない」が中心なら罪悪感。'},
  {s:'第一志望の結果が不合格だった。',c:'期待していた未来が一度しぼむ。',a:'落胆',ok:['悲しさ'],o:['落胆','寂しさ','怒り','焦り'],tip:'期待が外れた直後のしぼむ感覚は「落胆」。'},
  {s:'仲のよかった人が遠くへ引っ越した。',c:'会えなくなることそのものが胸に残る。',a:'寂しさ',ok:['悲しさ'],o:['寂しさ','落胆','苛立ち','羨望'],tip:'つながりが減った感覚は「寂しさ」が近い。'},
  {s:'勝てると思っていた相手に僅差で負けた。',c:'「もう一回やれば勝てるのに」と拳を握る。',a:'悔しさ',ok:['怒り'],o:['悔しさ','落胆','罪悪感','安心'],tip:'自分ならもっとできた、取り返したい感覚は「悔しさ」。'},
  {s:'何度説明しても相手が話を最後まで聞かず遮ってくる。',c:'小さく舌打ちしたくなる。',a:'苛立ち',ok:['怒り'],o:['苛立ち','焦り','恥','誇らしさ'],tip:'大きな侵害より、繰り返す引っかかりなら「苛立ち」が近い。'},
  {s:'久しぶりの試験会場。開始ベルを待っている。',c:'身体はこわばるが、具体的な失敗場面はまだ考えていない。',a:'緊張',ok:['不安'],o:['緊張','恐怖','落胆','嫉妬'],tip:'本番を前に身体が高ぶる状態は「緊張」。'},
  {s:'突然「来月から海外チームへ」と言われた。',c:'嫌でも嬉しいでもなく、まず状況を飲み込めない。',a:'戸惑い',ok:['不安'],o:['戸惑い','落胆','怒り','誇らしさ'],tip:'意味づけがまだ定まらないときは「戸惑い」。'}
 ],
 deep:[
  {s:'友人から半日返信がない。「もういい」とスマホを伏せた。',c:'表面では少しムッとしている。',surface:'怒り',a:'寂しさ',ok:['不安'],o1:['怒り','喜び','安心','誇らしさ'],o2:['寂しさ','羨望','安心','誇らしさ'],tip:'怒りの下に「つながりが切れたかも」という寂しさや不安があることも。'},
  {s:'後輩が自分より先に大きな仕事を任された。「別に」と言った。',c:'話題を早く変えたくなる。',surface:'苛立ち',a:'悔しさ',ok:['羨望'],o1:['苛立ち','安心','喜び','寂しさ'],o2:['悔しさ','罪悪感','恐怖','安心'],tip:'比較でムッとした奥に「自分もそこへ行きたかった」があるかもしれない。'},
  {s:'大事な場で注意され、「そんな言い方しなくても」と反発した。',c:'その場では強く言い返したくなった。',surface:'怒り',a:'恥',ok:['悔しさ'],o1:['怒り','喜び','安心','羨望'],o2:['恥','寂しさ','安心','誇らしさ'],tip:'人前での指摘は、怒りと一緒に恥や悔しさが動くことがある。'},
  {s:'家族が予定より遅く帰ってきた。「何時だと思ってるの」と強く言った。',c:'帰るまで何度も時計を見ていた。',surface:'怒り',a:'不安',ok:['恐怖'],o1:['怒り','羨望','喜び','安心'],o2:['不安','誇らしさ','落胆','羨望'],tip:'強い言葉の前に「何かあったのでは」という不安があった可能性。'},
  {s:'企画が通らず「どうせ何を出しても無駄」と投げたくなった。',c:'最初は腹が立ったが、力が抜けてきた。',surface:'怒り',a:'落胆',ok:['悔しさ'],o1:['怒り','安心','喜び','羨望'],o2:['落胆','罪悪感','恐怖','安心'],tip:'反発のあとに残る「期待がしぼむ感じ」は落胆かもしれない。'},
  {s:'パートナーが他の人を何度も褒める。「好きにすれば」と距離を取った。',c:'自分の位置が小さくなるように感じる。',surface:'怒り',a:'嫉妬',ok:['寂しさ'],o1:['怒り','喜び','安心','誇らしさ'],o2:['嫉妬','羨望','罪悪感','安心'],tip:'相手との関係を失いそうな痛みなら、羨望より嫉妬が近い。'},
  {s:'ミスを指摘され「そんな細かいところどうでもいい」と言い返した。',c:'本当は自分でも気づけなかったことが引っかかっている。',surface:'苛立ち',a:'悔しさ',ok:['恥'],o1:['苛立ち','喜び','安心','寂しさ'],o2:['悔しさ','恐怖','羨望','安心'],tip:'「できたはず」が残るなら、苛立ちの奥に悔しさがある。'},
  {s:'子どもが初めて一人暮らしを始める。「せいせいする」と笑った。',c:'空いた部屋を見ると、少し静かに感じる。',surface:'喜び',a:'寂しさ',ok:['誇らしさ'],o1:['喜び','怒り','恐怖','嫉妬'],o2:['寂しさ','罪悪感','苛立ち','羨望'],tip:'嬉しさと寂しさは同時にあっていい。感情は一つとは限らない。'},
  {s:'退職最終日。「やっと終わった」と笑って会社を出た。',c:'駅まで歩きながら、何度もビルを振り返る。',surface:'安心',a:'寂しさ',ok:['誇らしさ'],o1:['安心','怒り','恐怖','嫉妬'],o2:['寂しさ','焦り','罪悪感','苛立ち'],tip:'解放感と寂しさのように、反対方向の感情が同時にあることも。'},
  {s:'友人の成功報告に「すごいじゃん！」と答えた。',c:'本当に嬉しい。でも帰宅後、自分の進み具合も気になる。',surface:'喜び',a:'羨望',ok:['悔しさ'],o1:['喜び','怒り','恐怖','罪悪感'],o2:['羨望','嫉妬','安心','寂しさ'],tip:'相手を喜びながら、自分も欲しいと思う羨望が同居することもある。'}
 ]
};
const ALL_RUSH=[...Q.basic,...Q.precise];
const state={mode:'basic',queue:[],idx:0,phase:1,score:0,combo:0,maxCombo:0,correct:0,totalJudged:0,depthCorrect:0,depthTotal:0,times:[],found:new Set(),timer:null,t0:0,timeLimit:3,locked:false,rushEnds:0,rushTick:null,rushNamed:0,lastMode:'basic'};
let store=loadStore();
function loadStore(){try{return Object.assign({plays:0,best:0,found:{},lastMode:'basic'},JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}catch{return {plays:0,best:0,found:{},lastMode:'basic'}}}
function saveStore(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(store))}catch{}}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function show(id){$$('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');window.scrollTo({top:0,behavior:'instant'})}
function palette(name){return EMOTIONS[name]||{c1:'#77727c',c2:'#292731'}}
function setBlob(el,name,named=true){const p=palette(name);el.style.setProperty('--blob1',p.c1);el.style.setProperty('--blob2',p.c2);el.style.borderRadius=['48% 52% 58% 42% / 55% 45% 55% 45%','55% 45% 43% 57% / 48% 55% 45% 52%','42% 58% 52% 48% / 57% 44% 56% 43%'][Math.floor(Math.random()*3)];el.classList.toggle('named',named)}
function resetBlob(){const el=$('#gameBlob');el.classList.remove('named');el.style.setProperty('--blob1','#6b6872');el.style.setProperty('--blob2','#24222a');$('#gameBlobName').textContent=''}
function discover(name){if(!EMOTIONS[name])return;state.found.add(name);store.found[name]=(store.found[name]||0)+1;saveStore()}
function audioTone(type='good'){
 try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;window.__ac=window.__ac||new AC();const ac=window.__ac;const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=type==='bad'?175:type==='partial'?420:620;g.gain.setValueAtTime(.0001,ac.currentTime);g.gain.exponentialRampToValueAtTime(.08,ac.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.12);o.start();o.stop(ac.currentTime+.13)}catch{}
}
function feedback(kind,big,sub){const f=$('#feedback');f.className='feedback '+kind+' show';$('#feedbackBig').textContent=big;$('#feedbackSub').textContent=sub;clearTimeout(feedback.t);feedback.t=setTimeout(()=>f.classList.remove('show'),520)}
function updateHome(){const n=Object.keys(store.found||{}).filter(k=>EMOTIONS[k]).length;$('#homeDexCount').textContent=`${n} / ${Object.keys(EMOTIONS).length}`;$('#homeBest').textContent=store.best||0}
function start(mode){
 state.mode=mode;state.lastMode=mode;store.lastMode=mode;saveStore();state.idx=0;state.phase=1;state.score=0;state.combo=0;state.maxCombo=0;state.correct=0;state.totalJudged=0;state.depthCorrect=0;state.depthTotal=0;state.times=[];state.found=new Set();state.locked=false;state.rushNamed=0;
 if(mode==='rush'){state.queue=shuffle(ALL_RUSH);show('#gameScreen');$('#stageName').textContent='RUSH / 10秒ラッシュ';$('#clockPill').style.display='inline-block';$('#promptLabel').textContent='10秒。名前をつけ続けろ。';startRush();return}
 const count=mode==='deep'?8:10;state.queue=shuffle(Q[mode]).slice(0,count);state.timeLimit=mode==='basic'?3.4:mode==='precise'?4.8:5.2;show('#gameScreen');$('#stageName').textContent=mode==='basic'?'BASIC / 3秒で名前':mode==='precise'?'PRECISE / 見分けろ':'DEEP / その奥は？';$('#clockPill').style.display='inline-block';renderQuestion();
}
function current(){return state.queue[state.idx]}
function renderQuestion(){
 clearTimers();state.locked=false;state.phase=1;const q=current();if(!q){finish();return}resetBlob();$('#sceneCard').classList.remove('shake');$('#deepBanner').classList.remove('show');$('#sceneText').textContent=q.s;$('#clueText').innerHTML=q.c?`<strong>ヒント</strong>　${q.c}`:'';$('#qCount').textContent=`${state.idx+1} / ${state.queue.length}`;$('#progressBar').style.width=`${state.idx/state.queue.length*100}%`;$('#scoreText').textContent=state.score;$('#comboText').textContent=state.combo;$('#promptLabel').textContent=state.mode==='deep'?'まず、表面に出ている感情は？':'いま、何を感じている？';$('#answerLabel').textContent='名前をつけろ。';renderAnswers(state.mode==='deep'?q.o1:q.o);startTimer();
}
function renderAnswers(opts){const box=$('#answers');box.innerHTML='';shuffle(opts).forEach((name,i)=>{const b=document.createElement('button');b.className='answer';b.type='button';b.dataset.answer=name;b.innerHTML=`<small>${i+1}</small>${name}`;b.addEventListener('click',()=>choose(name,b));box.appendChild(b)})}
function startTimer(){clearInterval(state.timer);state.t0=performance.now();const bar=$('#timerBar');bar.style.display='block';bar.classList.remove('warning');const inner=$('i',bar);inner.style.transform='scaleX(1)';state.timer=setInterval(()=>{const elapsed=(performance.now()-state.t0)/1000,remain=Math.max(0,state.timeLimit-elapsed),ratio=remain/state.timeLimit;$('#timeText').textContent=remain.toFixed(1);inner.style.transform=`scaleX(${ratio})`;bar.classList.toggle('warning',ratio<.3);if(remain<=0){clearInterval(state.timer);timeout()}},40)}
function clearTimers(){if(state.timer){clearInterval(state.timer);state.timer=null}if(state.rushTick){clearInterval(state.rushTick);state.rushTick=null}}
function disableAnswers(){$$('.answer').forEach(b=>b.disabled=true)}
function choose(name,btn){if(state.locked)return;const q=current();if(state.mode==='rush'){chooseRush(name,btn);return}clearInterval(state.timer);const elapsed=(performance.now()-state.t0)/1000;state.times.push(elapsed);state.totalJudged++;
 let target=state.mode==='deep'?(state.phase===1?q.surface:q.a):q.a;let accepted=state.mode==='deep'&&state.phase===1?[]:(q.ok||[]);let kind=name===target?'correct':accepted.includes(name)?'partial':'wrong';
 if(kind==='correct'){state.correct++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);const speed=Math.max(0,Math.round((state.timeLimit-elapsed)/state.timeLimit*90));state.score+=100+speed+Math.min(100,state.combo*8);btn.classList.add('correct');discover(name);feedback('good',state.phase===2?'DEEP NAME!':'NAMED!',name);audioTone('good');navigator.vibrate?.(12)}
 else if(kind==='partial'){state.correct+=.65;state.combo=Math.max(0,state.combo-1);state.score+=70;btn.classList.add('partial');discover(name);feedback('partial','ありえる',`${name} / 主役は ${target}`);audioTone('partial')}
 else{state.combo=0;btn.classList.add('wrong');feedback('bad','モヤ…',`今回は ${target}`);audioTone('bad');$('#sceneCard').classList.add('shake')}
 $('#scoreText').textContent=state.score;$('#comboText').textContent=state.combo;setBlob($('#gameBlob'),target,true);$('#gameBlobName').textContent=target;disableAnswers();$$('.answer').forEach(b=>{if(b.dataset.answer===target)b.classList.add('correct')});
 if(state.mode==='deep'&&state.phase===1){setTimeout(()=>beginDeep(),620)}else{if(state.mode==='deep'&&state.phase===2){state.depthTotal++;if(kind==='correct'||kind==='partial')state.depthCorrect+=kind==='correct'?1:.65}setTimeout(nextQuestion,650)}
}
function beginDeep(){const q=current();state.phase=2;state.locked=false;resetBlob();$('#deepBanner').classList.add('show');$('#promptLabel').textContent='その奥は？';$('#answerLabel').textContent='もう一段、名前をつけろ。';renderAnswers(q.o2);startTimer()}
function timeout(){if(state.locked)return;state.totalJudged++;state.combo=0;const q=current();const target=state.mode==='deep'?(state.phase===1?q.surface:q.a):q.a;feedback('bad','TIME','名前がつく前に消えた');setBlob($('#gameBlob'),target,true);$('#gameBlobName').textContent=target;disableAnswers();$$('.answer').forEach(b=>{if(b.dataset.answer===target)b.classList.add('correct')});if(state.mode==='deep'&&state.phase===1)setTimeout(beginDeep,620);else{if(state.mode==='deep'&&state.phase===2)state.depthTotal++;setTimeout(nextQuestion,650)}}
function nextQuestion(){state.idx++;state.phase=1;renderQuestion()}
function startRush(){
 clearTimers();$('#timerBar').style.display='none';state.rushEnds=performance.now()+10000;state.idx=0;renderRushQuestion();state.rushTick=setInterval(()=>{const r=Math.max(0,(state.rushEnds-performance.now())/1000);$('#timeText').textContent=r.toFixed(1);$('#clockPill').classList.toggle('combo',r<3);if(r<=0){clearInterval(state.rushTick);state.rushTick=null;finish()}},50)
}
function renderRushQuestion(){if(performance.now()>=state.rushEnds){finish();return}if(state.idx>=state.queue.length){state.queue.push(...shuffle(ALL_RUSH));}const q=current();state.locked=false;resetBlob();$('#sceneText').textContent=q.s;$('#clueText').innerHTML=q.c?`<strong>ヒント</strong>　${q.c}`:'';$('#qCount').textContent=`${state.rushNamed} NAMED`;$('#progressBar').style.width=`${Math.min(100,(10000-(state.rushEnds-performance.now()))/100)}%`;$('#answerLabel').textContent='考える前に、名前。';renderAnswers(q.o);$('#scoreText').textContent=state.score;$('#comboText').textContent=state.combo}
function chooseRush(name,btn){const q=current();const isGood=name===q.a||(q.ok||[]).includes(name);state.totalJudged++;if(isGood){state.correct++;state.rushNamed++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.score+=name===q.a?120:80;discover(name);setBlob($('#gameBlob'),q.a,true);$('#gameBlobName').textContent=q.a;audioTone('good');navigator.vibrate?.(8);state.idx++;renderRushQuestion()}else{state.combo=0;btn.classList.add('wrong');audioTone('bad');$('#sceneCard').classList.add('shake');setTimeout(()=>$('#sceneCard').classList.remove('shake'),220)}$('#scoreText').textContent=state.score;$('#comboText').textContent=state.combo}
function finish(){
 clearTimers();store.plays=(store.plays||0)+1;store.best=Math.max(store.best||0,state.score);saveStore();const acc=state.totalJudged?Math.round(state.correct/state.totalJudged*100):0;const avg=state.times.length?state.times.reduce((a,b)=>a+b,0)/state.times.length:0;const speed=state.mode==='rush'?state.rushNamed:`${avg.toFixed(1)}s`;const depth=state.mode==='deep'&&state.depthTotal?Math.round(state.depthCorrect/state.depthTotal*100)+'%':'—';$('#finalScore').textContent=state.score;$('#metricSpeed').textContent=speed;$('#metricPrecision').textContent=acc+'%';$('#metricRange').textContent=state.found.size;$('#metricDepth').textContent=depth;
 let title='名前が\n見えてきた。',lead=`${state.totalJudged}回、モヤモヤに名前をつけました。`;if(state.mode==='rush'){title=state.rushNamed>=8?'反射に\nなってきた。':'まだ、\n速くなる。';lead=`10秒で ${state.rushNamed} 個に名前をつけました。`}else if(acc>=85){title='かなり\n見えている。'}else if(acc<55){title='モヤは\n伸びしろ。'}$('#resultTitle').innerHTML=title.replace('\n','<br>');$('#resultLead').textContent=lead;
 const top=[...state.found].slice(0,3);let note=top.length?`今回見つけた感情は <strong>${top.join('・')}</strong>${state.found.size>3?' など':''}。`:'今回はまだ図鑑に追加なし。';if(state.mode==='deep')note+=` 表面の感情だけで止まらず、その奥を探す問題では <strong>${depth}</strong> でした。`;else note+=` 正解率より、現実で「いま○○だ」と名前が浮かぶ速さを育てるのが目的です。`;$('#resultNote').innerHTML=note;show('#resultScreen');updateHome();
}
function renderDex(){const grid=$('#dexGrid');grid.innerHTML='';const found=store.found||{};Object.entries(EMOTIONS).forEach(([name,e])=>{const n=found[name]||0;const card=document.createElement('div');card.className='dex-card'+(n?'':' locked');card.style.setProperty('--c1',e.c1);card.style.setProperty('--c2',e.c2);card.innerHTML=`<span class="dex-count">${n?`${n}回`:'未発見'}</span><div class="dex-ball"></div><h3>${n?name:'？？？'}</h3><p>${n?e.desc:'ゲームで名前をつけると開きます'}</p>`;grid.appendChild(card)});$('#dexCount').textContent=`${Object.keys(found).filter(k=>EMOTIONS[k]&&found[k]>0).length} / ${Object.keys(EMOTIONS).length}`;$('#playCount').textContent=store.plays||0}
function openDex(){renderDex();show('#dexScreen')}
function quit(){clearTimers();show('#homeScreen');updateHome()}
$$('.mode-card').forEach(b=>b.addEventListener('click',()=>start(b.dataset.mode)));$('#quitBtn').addEventListener('click',quit);$('#dexTopBtn').addEventListener('click',openDex);$('#homeDexBtn').addEventListener('click',openDex);$('#dexBackBtn').addEventListener('click',()=>{show('#homeScreen');updateHome()});$('#resultHomeBtn').addEventListener('click',()=>{show('#homeScreen');updateHome()});$('#againBtn').addEventListener('click',()=>start(state.lastMode));
document.addEventListener('keydown',e=>{if(!$('#gameScreen').classList.contains('active'))return;const n=Number(e.key);if(n>=1&&n<=4){const b=$$('.answer:not(:disabled)')[n-1];b?.click()}});
// home demo: vague -> named loop
let demoOn=false;setInterval(()=>{demoOn=!demoOn;const b=$('#demoBlob');if(demoOn){setBlob(b,'不安',true);$('#demoName').textContent='不安'}else{b.classList.remove('named');b.style.setProperty('--blob1','#6b6872');b.style.setProperty('--blob2','#24222a')}},1800);
updateHome();
})();
