(() => {
'use strict';
const $ = s => document.querySelector(s);
const screens = [...document.querySelectorAll('.screen')];
const el = {title:$('#titleScreen'),novel:$('#novelScreen'),investigate:$('#investigateScreen'),board:$('#boardScreen'),result:$('#resultScreen'),start:$('#startBtn'),cont:$('#continueBtn'),sound:$('#soundBtn'),textPanel:$('#textPanel'),text:$('#novelText'),speaker:$('#speaker'),tap:$('#tapHint'),choices:$('#choices'),scene:$('#scene'),time:$('#timeBadge'),chapter:$('#chapterLabel'),clueCount:$('#clueCount'),tensionText:$('#tensionText'),tensionBar:$('#tensionBar'),invTitle:$('#investigateTitle'),invCopy:$('#investigateCopy'),invGrid:$('#investigateGrid'),pips:$('#focusPips'),finishInv:$('#finishInvestigation'),boardQ:$('#boardQuestion'),clueBoard:$('#clueBoard'),pair:$('#selectedPair'),deduce:$('#deduceBtn'),backBoard:$('#backFromBoard'),toast:$('#clueToast'),flash:$('#flash'),endingKind:$('#endingKind'),endingTitle:$('#endingTitle'),endingText:$('#endingText'),truth:$('#truthPercent'),truthBar:$('#truthBar'),endingStats:$('#endingStats'),retry:$('#retryBtn'),titleBtn:$('#titleBtn')};

const cast = {
  me:'あなた', rei:'神谷 玲', asano:'浅野 医師', fujita:'藤田 船長', natsume:'夏目 記者', mikami:'三上 技師', saya:'小峰 沙耶', owner:'黒木 管理人'
};
const clues = {
  wetRope:{name:'濡れた麻縄',desc:'嵐の前に切られた。切断面だけ新しい。'},clock:{name:'止まった時計',desc:'無線室の時計は23:52で止まっている。'},oil:{name:'灯油の跡',desc:'無線室から廊下ではなく壁際へ続く。'},key:{name:'真鍮の予備鍵',desc:'無線室の床。黒木の手から1m。扉の鍵と同型。'},note:{name:'破れた航海日誌',desc:'「灯台地下の旧搬入口。満潮時は使用禁止」。'},scar:{name:'三上の手の傷',desc:'左掌に新しい擦過傷。細い金属で擦ったような跡。'},photo:{name:'20年前の集合写真',desc:'黒木と藤田、そして幼い沙耶。灯台地下入口が写る。'},medicine:{name:'鎮静剤の空アンプル',desc:'浅野の鞄から1本だけ消えている。'},recording:{name:'23:48の録音',desc:'死亡推定時刻より前に、被害者が「灯台を止める」と話している。'},wire:{name:'切れた銅線',desc:'灯台制御盤の裏。工具で切断。'},ring:{name:'錆びた指輪',desc:'灯台地下で発見。「S.K. 2006」。'},ledger:{name:'送金台帳',desc:'黒木から「灯台保守会」へ20年間毎月送金。受取印は三上。'},vent:{name:'壁の通風口',desc:'無線室と旧搬入口を結ぶ、人が這える太さの空洞。'}
};
const state = {step:0,scene:'pier',chapter:'PROLOGUE',time:'23:41',tension:12,clues:new Set(),trust:{rei:1,asano:0,fujita:0,natsume:0,mikami:0,saya:1,owner:0},flags:{},sound:true,invTaken:[],selected:[],deductions:0,wrong:0,started:false};
let audio = null, wind = null, typingTimer = null, fullText = '', typing = false, currentLines = [], lineIndex = 0, afterLines = null;

const show = id => { screens.forEach(s=>s.classList.toggle('active',s.id===id)); };
function ensureAudio(){ if(!state.sound||audio)return; const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audio=new C(); const o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();o.type='sawtooth';o.frequency.value=43;f.type='lowpass';f.frequency.value=85;g.gain.value=.012;o.connect(f).connect(g).connect(audio.destination);o.start();wind={o,g};}
function tone(freq=190,d=.08,v=.045,type='sine'){if(!state.sound)return;ensureAudio();if(!audio)return;const o=audio.createOscillator(),g=audio.createGain(),n=audio.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g).connect(audio.destination);o.start(n);o.stop(n+d);}
function thunder(){if(!state.sound)return;ensureAudio();if(!audio)return; const b=audio.createBuffer(1,audio.sampleRate*.7,audio.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const s=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();f.type='lowpass';f.frequency.value=110;g.gain.value=.13;s.buffer=b;s.connect(f).connect(g).connect(audio.destination);s.start(); el.flash.classList.remove('hit');void el.flash.offsetWidth;el.flash.classList.add('hit');}
function footstep(count=3){let i=0;const t=setInterval(()=>{tone(68,.12,.08,'triangle');if(navigator.vibrate)navigator.vibrate(18);if(++i>=count)clearInterval(t)},430)}
function save(){ if(!state.started)return; localStorage.setItem('midnight-lighthouse-save',JSON.stringify({...state,clues:[...state.clues]})); el.cont.hidden=false;}
function load(){try{const x=JSON.parse(localStorage.getItem('midnight-lighthouse-save'));if(!x)return false;Object.assign(state,x);state.clues=new Set(x.clues||[]);return true}catch{return false}}
function reset(){state.step=0;state.scene='pier';state.chapter='PROLOGUE';state.time='23:41';state.tension=12;state.clues=new Set();state.trust={rei:1,asano:0,fujita:0,natsume:0,mikami:0,saya:1,owner:0};state.flags={};state.invTaken=[];state.selected=[];state.deductions=0;state.wrong=0;state.started=true;localStorage.removeItem('midnight-lighthouse-save');updateHud();}
function updateHud(){el.clueCount.textContent=state.clues.size;el.tensionText.textContent=state.tension;el.tensionBar.style.width=`${Math.min(100,state.tension)}%`;el.scene.dataset.scene=state.scene;el.time.textContent=state.time;el.chapter.textContent=state.chapter;}
function setTension(n){state.tension=Math.max(0,Math.min(100,state.tension+n));updateHud();if(n>8)tone(92,.14,.055,'triangle');}
function addClue(id){if(!clues[id]||state.clues.has(id))return;state.clues.add(id);updateHud();el.toast.querySelector('b').textContent=clues[id].name;el.toast.querySelector('p').textContent=clues[id].desc;el.toast.classList.add('show');tone(360,.17,.055,'triangle');if(navigator.vibrate)navigator.vibrate([15,25,18]);setTimeout(()=>el.toast.classList.remove('show'),2200);save();}
function typeText(text){clearInterval(typingTimer);fullText=text;typing=true;el.text.textContent='';let i=0;typingTimer=setInterval(()=>{i+=2;el.text.textContent=text.slice(0,i);if(i>=text.length){clearInterval(typingTimer);typing=false;}},22)}
function line(speaker,text){return{speaker,text}}
function playLines(lines,after){show('novelScreen');currentLines=lines;lineIndex=0;afterLines=after||null;renderLine();}
function renderLine(){const l=currentLines[lineIndex];if(!l){const cb=afterLines;afterLines=null;if(cb)cb();return}el.speaker.textContent=l.speaker?cast[l.speaker]||l.speaker:'—';typeText(l.text);el.tap.style.display='block';save();}
function advance(){if(!$('#novelScreen').classList.contains('active')||el.choices.children.length)return;if(typing){clearInterval(typingTimer);el.text.textContent=fullText;typing=false;return;}lineIndex++;renderLine();}
function choose(options){el.tap.style.display='none';el.choices.innerHTML='';options.forEach(o=>{const b=document.createElement('button');b.className='choice';b.textContent=o.text;b.onclick=()=>{el.choices.innerHTML='';tone(230,.05,.03);o.run();};el.choices.appendChild(b)})}
function setScene(scene,time,chapter){state.scene=scene;if(time)state.time=time;if(chapter)state.chapter=chapter;updateHud();}

const chapters = {
prologue(){setScene('pier','23:41','PROLOGUE');playLines([
line(null,'黒潮島へ向かう最終便は、港を出て17分で引き返した。'),
line('fujita','「波が高すぎる。戻るぞ」'),
line(null,'そのとき、島の灯台が三度だけ瞬いた。\n短く、長く、短く。'),
line('rei','「……SOSじゃない。あれ、誰かが手で切ってる」'),
line(null,'あなたを含む7人の客は、予定を変えず小型艇で島へ渡った。\n理由は全員、少しずつ違っていた。')
],()=>{choose([{text:'玲に「三度の点滅」の意味を聞く',run:()=>{state.trust.rei++;playLines([line('rei','「合図だと思う。私たちの到着を、誰かが見てる」')],chapters.arrival)}},{text:'船長・藤田が戻らなかった理由を聞く',run:()=>{state.trust.fujita++;playLines([line('fujita','「20年前に、この島で一人死んだ。今夜はその命日だ」')],chapters.arrival)}},{text:'黙って島の様子を見る',run:()=>{addClue('wetRope');playLines([line(null,'桟橋の係留縄が一本だけ濡れている。\n雨ではない。切断面に新しい毛羽立ちがあった。')],chapters.arrival)}}])});},
arrival(){setScene('hall','23:56','CHAPTER 1 / 七人');playLines([
line(null,'宿泊棟「波止館」。\n管理人の黒木が、濡れた鍵束を机に置いた。'),
line('owner','「無線は古いが使える。灯台も自動だ。朝まで外へ出る必要はない」'),
line('natsume','「では自己紹介を。記事にするつもりはありませんよ、たぶん」'),
line(null,'神谷玲。医師・浅野。船長・藤田。記者・夏目。灯台技師・三上。大学院生・沙耶。そして、あなた。\n七人の客を、管理人・黒木が迎えた。'),
line(null,'午前0時。\n島から、光が消えた。')
],()=>{thunder();setTimeout(()=>chapters.murder(),600)});},
murder(){setScene('radio','00:07','CHAPTER 1 / 最初の死');setTension(10);playLines([
line(null,'無線室の内側から鍵がかかっていた。\n扉を破ると、黒木管理人が机に伏していた。'),
line('asano','「死んでいる。後頭部を一撃。……ただし、血が少なすぎる」'),
line('mikami','「窓は内側から金具が下りてる。人が出られる場所はない」'),
line('saya','「じゃあ……この中に犯人がいるってこと？」'),
line(null,'床に、真鍮の鍵が一本。\n壁の時計は23:52で止まっていた。')
],()=>startInvestigation(1));},
afterInv1(){playLines([
line('natsume','「全員が全部を見たわけじゃない。そこが厄介ですね」'),
line('rei','「あなた、今ある証拠だけでいい。密室の作り方を考えて」')
],()=>startBoard('密室は、本当に扉の鍵で作られた？',[['oil','key'],['oil','clock']],chapters.board1Result));},
board1Result(ok,pair){if(ok){state.deductions++;state.flags.secretPassage=true;setTension(-6);addClue('vent');playLines([line(null,'鍵は床に落ちている。だが、灯油の筋は扉ではなく壁で消えている。'),line(null,'壁板を外すと、人ひとりが這える通風路が現れた。\n鍵は密室を信じ込ませるための偽装だった。')],chapters.chapter2)}else{state.wrong++;setTension(12);playLines([line(null,'推理は噛み合わない。\nその瞬間、二階で何かが倒れる音がした。')],chapters.chapter2)}},
chapter2(){setScene('hall','01:12','CHAPTER 2 / 嘘');playLines([
line(null,'通風路は灯台地下へ続いていた。\nだが、誰もその存在を認めない。'),
line('fujita','「昔の搬入口なら埋めたはずだ。20年前にな」'),
line('saya','「20年前……？」'),
line(null,'沙耶の顔色が変わった。\n藤田はそれ以上しゃべらなかった。')
],()=>startInvestigation(2));},
afterInv2(){setScene('stairs','02:03','CHAPTER 2 / 足音');footstep(4);setTension(8);playLines([
line(null,'二階の廊下。\n停電しているのに、上の階から足音が降りてくる。'),
line(null,'一段。\n……一段。\n……一段。'),
line('rei','「灯台へ行く。今なら犯人も動く」')
],()=>choose([{text:'玲と灯台へ向かう',run:()=>{state.trust.rei+=2;state.flags.withRei=true;chapters.lighthouse()}},{text:'沙耶を一人にしない',run:()=>{state.trust.saya+=2;state.flags.protectSaya=true;chapters.sayaScene()}},{text:'三上技師を追う',run:()=>{state.flags.followMikami=true;state.trust.mikami--;chapters.mikamiScene()}}]));},
sayaScene(){playLines([line('saya','「黒木さんは私の父じゃない。でも、父を殺した人を知ってた」'),line(null,'沙耶は20年前の事故で父を失っていた。\n父は当時、灯台の保守員だった。')],()=>{addClue('photo');chapters.lighthouse()});},
mikamiScene(){playLines([line(null,'三上は倉庫で工具箱を洗っていた。'),line('mikami','「血じゃない。機械油だ」'),line(null,'左手に新しい擦り傷。')],()=>{addClue('scar');setTension(5);chapters.lighthouse()});},
lighthouse(){setScene('lighthouse','02:31','CHAPTER 3 / 消灯');playLines([
line(null,'灯台内部は、風より静かだった。'),
line('rei','「自動灯台が消えるには、電源を落とすだけじゃ足りない。予備系統も切る必要がある」'),
line(null,'最上部の制御盤。\n銅線が一本、工具で切られていた。')
],()=>{addClue('wire');startInvestigation(3)});},
afterInv3(){playLines([
line(null,'地下へ下りる鉄扉が、半分だけ開いている。'),
line(null,'暗闇の向こうから、金属を擦る音。'),
line('rei','「ここで決める。誰を信じる？」')
],()=>{choose([{text:'玲を信じて地下へ入る',run:()=>{state.flags.enteredCellar=true;chapters.cellar()}},{text:'藤田船長を呼びに戻る',run:()=>{state.flags.calledFujita=true;chapters.fujitaRoute()}},{text:'扉を閉め、全員を食堂に集める',run:()=>{state.flags.lockdown=true;chapters.lockdown()}}])});},
fujitaRoute(){setScene('hall','03:02','CHAPTER 3 / 船長');playLines([line('fujita','「地下は入るな。20年前も、あそこで一人死んだ」'),line(null,'藤田は隠していた古い航海日誌を差し出した。')],()=>{addClue('note');chapters.cellar()});},
lockdown(){setScene('hall','03:18','CHAPTER 3 / 籠城');setTension(18);playLines([line(null,'食堂に6人を集めた。'),line(null,'4分後。灯台側の窓が割れ、三上が姿を消した。'),line('natsume','「囲えば安全、とは限らないみたいですね」')],()=>{state.flags.mikamiMissing=true;chapters.cellar()});},
cellar(){setScene('cellar','03:37','CHAPTER 4 / 地下');footstep(5);playLines([
line(null,'旧搬入口。潮の匂い。\n壁には、20年前の水位線が残っている。'),
line(null,'錆びた指輪。\n「S.K. 2006」'),
line('saya','「父のイニシャル……」')
],()=>{addClue('ring');startBoard('20年前、何が隠された？',[['photo','ring'],['ledger','recording'],['note','ring']],chapters.board2Result)});},
board2Result(ok,pair){if(ok){state.deductions++;setTension(-8);state.flags.oldTruth=true;playLines([line(null,'20年前の死者は沙耶の父。\n事故ではない。灯台地下で違法な密輸を目撃し、殺された。'),line(null,'黒木はその秘密を知り、三上へ20年間口止め料を払い続けていた。')],chapters.accusation)}else{state.wrong++;setTension(14);playLines([line(null,'過去の断片は繋がらない。\nだが夜明けは近い。今夜の犯人だけでも止めなければ。')],chapters.accusation)}},
accusation(){setScene('hall','04:46','FINAL CHAPTER / 七人目');playLines([
line(null,'全員を食堂に集めた。\n空いた椅子が一つ。'),
line('natsume','「さあ。あなたは誰を犯人だと思う？」')
],()=>choose([
{text:'灯台技師・三上',run:()=>finish('mikami')},{text:'船長・藤田',run:()=>finish('fujita')},{text:'記者・夏目',run:()=>finish('natsume')},{text:'医師・浅野',run:()=>finish('asano')},{text:'小峰 沙耶',run:()=>finish('saya')}
]));}
};

const investigationData = {
1:{title:'2つだけ調べられる',copy:'警察は朝まで来ない。現場・死体・周囲。どこに時間を使う？',items:[
{id:'clock',title:'止まった時計',desc:'23:52で停止。死亡時刻の手掛かり。',tension:0},
{id:'oil',title:'床の油染み',desc:'机から壁際へ続く細い跡。',tension:4},
{id:'key',title:'落ちた鍵',desc:'黒木の右手から1m離れた床。',tension:0}
],after:chapters.afterInv1},
2:{title:'誰の嘘を追う？',copy:'3人とも何かを隠している。2人しか追えない。',items:[
{id:'photo',title:'沙耶の部屋',desc:'20年前の写真を隠している。',tension:1},
{id:'recording',title:'夏目のレコーダー',desc:'事件前から録音していた。',tension:5},
{id:'medicine',title:'浅野の医療鞄',desc:'薬の本数が合わない。',tension:4}
],after:chapters.afterInv2},
3:{title:'灯台で2つ拾え',copy:'犯人が近くにいる。調べるほど危険になる。',items:[
{id:'scar',title:'工具棚の血痕',desc:'少量。誰かが手を切ったらしい。',tension:8},
{id:'note',title:'旧搬入口の図面',desc:'灯台地下へ続く廃止通路。',tension:7},
{id:'ledger',title:'黒木の封筒',desc:'20年分の送金記録。',tension:9}
],after:chapters.afterInv3}
};
let currentInv=1;
function startInvestigation(n){el.toast.classList.remove('show');currentInv=n;const d=investigationData[n];state.invTaken=[];show('investigateScreen');el.invTitle.textContent=d.title;el.invCopy.textContent=d.copy;el.invGrid.innerHTML='';[...el.pips.children].forEach(x=>x.classList.remove('used'));el.finishInv.classList.add('locked');d.items.forEach((it,i)=>{const b=document.createElement('button');b.className='investigateCard';b.dataset.number=`0${i+1}`;b.innerHTML=`<h3>${it.title}</h3><p>${it.desc}</p>`;b.onclick=()=>takeInvestigation(b,it);el.invGrid.appendChild(b)});}
function takeInvestigation(btn,it){if(btn.classList.contains('taken')||state.invTaken.length>=2)return;btn.classList.add('taken');state.invTaken.push(it.id);[...el.pips.children][state.invTaken.length-1].classList.add('used');setTension(it.tension);addClue(it.id);if(state.invTaken.length===2)el.finishInv.classList.remove('locked');}
el.finishInv.onclick=()=>{if(state.invTaken.length<2)return;investigationData[currentInv].after()};

let boardValid=[],boardCallback=null;
function startBoard(question,valid,cb){el.toast.classList.remove('show');state.selected=[];boardValid=valid;boardCallback=cb;show('boardScreen');el.boardQ.textContent=question;renderBoard();}
function renderBoard(){el.clueBoard.innerHTML='';[...state.clues].forEach((id,i)=>{const b=document.createElement('button');b.className='clueChip'+(state.selected.includes(id)?' selected':'');b.style.setProperty('--r',`${(i%5-2)*.7}deg`);b.textContent=clues[id].name;b.onclick=()=>{if(state.selected.includes(id))state.selected=state.selected.filter(x=>x!==id);else if(state.selected.length<2)state.selected.push(id);renderBoard()};el.clueBoard.appendChild(b)});const spans=el.pair.querySelectorAll('span');for(let i=0;i<2;i++){spans[i].textContent=state.selected[i]?clues[state.selected[i]].name:`${i+1}つ目`;spans[i].classList.toggle('filled',!!state.selected[i])}el.deduce.classList.toggle('locked',state.selected.length!==2)}
el.deduce.onclick=()=>{if(state.selected.length!==2)return;const sorted=[...state.selected].sort();const ok=boardValid.some(p=>[...p].sort().join('|')===sorted.join('|'));tone(ok?440:84,.22,.08,ok?'triangle':'sawtooth');if(!ok)thunder();const cb=boardCallback;boardCallback=null;cb(ok,[...state.selected])};el.backBoard.onclick=()=>show('novelScreen');

function finish(accused){const has=id=>state.clues.has(id);let correct=accused==='mikami';let truth=25+state.clues.size*5+state.deductions*12-state.wrong*6+(state.flags.oldTruth?12:0);truth=Math.max(5,Math.min(100,truth));let ending;
if(correct&&truth>=82&&has('scar')&&has('wire')&&state.flags.oldTruth){ending={kind:'TRUE ENDING',title:'灯台は、もう一度点く',text:'三上は黒木を殺し、通風路から無線室を出た。\n目的は20年前の密輸記録を消すこと。黒木が口止めをやめ、沙耶へ真実を渡そうとしたためだった。\n\n午前5時31分。三上は地下搬入口から逃げようとしたところを止められた。\n夜明けと同時に予備灯が点く。沙耶は父の指輪を握り、初めて海を見た。\n\nそして最後に、夏目の録音に残った「9人目の足音」だけが説明されなかった。'}}
else if(correct){ending={kind:'ENDING 02',title:'犯人は止めた。真相は残った',text:'三上を犯人として止めることには成功した。\nしかし20年前の事件と黒木が殺された本当の理由は、まだ霧の中だ。\n\n結果画面に残る未取得の証拠が、次の周回では別の夜を作る。'}}
else if(accused==='fujita'&&has('photo')){ending={kind:'ENDING 03',title:'20年前に引きずられて',text:'藤田には罪があった。20年前の密輸を知りながら沈黙した罪だ。\nだが、今夜の殺人犯ではなかった。\n\n拘束の混乱で灯台側の扉が開き、真犯人は地下へ消えた。'}}
else if(accused==='natsume'){ending={kind:'ENDING 04',title:'記事にならない夜',text:'夏目は嘘をついていた。事件を追って島へ来たことを隠していた。\nだが殺人はしていない。\n\n午前5時、録音機だけを残して夏目が消える。最後の音声には、あなたの声で「違う」と入っていた。'}}
else if(accused==='asano'&&has('medicine')){ending={kind:'ENDING 05',title:'薬の本当の使い道',text:'消えた鎮静剤は黒木に使われたものではなかった。\n浅野は重いパニック発作を起こした沙耶へ、本人の同意を得て投与していた。\n\n疑いを外した瞬間、灯台から発煙。証拠の一部が燃えた。'}}
else if(accused==='saya'){ending={kind:'BAD END',title:'いちばん信じたかった人',text:'沙耶には動機があった。父の死。黒木の沈黙。\nけれど、彼女には密室を作る方法がなかった。\n\n午前5時19分。地下から船のエンジン音がする。真犯人は島を離れた。'}}
else{ending={kind:'BAD END',title:'夜明け前の誤答',text:'指名した人物を拘束した。\nその直後、灯台が一度だけ点いた。\n\n食堂にいる全員の顔が、白く照らされる。\n――犯人以外の顔が。'}}
showEnding(ending,truth,correct);}
function showEnding(e,truth,correct){show('resultScreen');el.endingKind.textContent=e.kind;el.endingTitle.textContent=e.title;el.endingText.textContent=e.text;el.truth.textContent=`${truth}%`;setTimeout(()=>el.truthBar.style.width=`${truth}%`,100);el.endingStats.innerHTML=`<span>証拠 ${state.clues.size}/13</span><span>推理成功 ${state.deductions}/2</span><span>誤推理 ${state.wrong}</span><span>緊張 ${state.tension}</span>`;localStorage.removeItem('midnight-lighthouse-save');if(e.kind==='TRUE ENDING')localStorage.setItem('midnight-lighthouse-true','1');tone(correct?523:98,.4,.07,correct?'sine':'sawtooth');}

el.start.onclick=()=>{ensureAudio();reset();chapters.prologue()};el.cont.onclick=()=>{ensureAudio();if(load()){state.started=true;updateHud();const t=parseInt(state.time)||0;if(state.chapter.includes('FINAL'))chapters.accusation();else if(state.chapter.includes('4'))chapters.cellar();else if(state.chapter.includes('3'))chapters.lighthouse();else if(state.chapter.includes('2'))chapters.chapter2();else chapters.murder();}};
el.sound.onclick=()=>{state.sound=!state.sound;el.sound.textContent=`音 ${state.sound?'ON':'OFF'}`;if(state.sound)ensureAudio();if(wind)wind.g.gain.value=state.sound ? .012 : 0};el.retry.onclick=()=>{reset();ensureAudio();chapters.prologue()};el.titleBtn.onclick=()=>{show('titleScreen');el.cont.hidden=!localStorage.getItem('midnight-lighthouse-save')};el.textPanel.onclick=advance;
if(localStorage.getItem('midnight-lighthouse-save'))el.cont.hidden=false;
updateHud();
})();
