const eras = [
  { id:'child', label:'幼少期', range:'0–6歳' },
  { id:'school', label:'子ども時代', range:'7–12歳' },
  { id:'teen', label:'青春', range:'13–18歳' },
  { id:'young', label:'若者', range:'19–29歳' },
  { id:'adult', label:'人生の真ん中', range:'30–49歳' },
  { id:'middle', label:'積み上げたもの', range:'50–69歳' },
  { id:'old', label:'晩年', range:'70歳〜' },
];

const state = {
  stats:{ curiosity:0, empathy:0, courage:0, patience:0, ambition:0, stability:0, health:6, money:0 },
  relations:{ family:2, friend:0, romance:0 }, flags:new Set(), history:[], age:0, started:false, idx:0,
};

const $ = (s)=>document.querySelector(s);
const sceneEl=$('#scene'), ageEl=$('#age'), placeEl=$('#place'), hintEl=$('#swipeHint'), toastEl=$('#memoryToast');
let current=null, startTime=0, raf=0, dragging=false, startY=0, lastY=0, locked=false, soundOn=true;

const eventGraph = {
  birth:{age:0,era:'child',place:'HOME',kind:'hand',caption:'小さな指が、こちらへ伸びてくる。',duration:4600,phases:[
    p(.25,'まだ遠い。','次へ急いだ。',{patience:-1},'first_steps'),
    p(.52,'指先が触れそうになる。','手を伸ばした。',{family:1,empathy:1},'first_steps'),
    p(.78,'そっと握ってくれる。','初めて誰かの手を握った。',{family:2,patience:1},'first_steps'),
    p(1,'指は離れていく。','温もりが去るまで見ていた。',{family:1,patience:2},'first_steps') ]},
  first_steps:{age:1,era:'child',place:'LIVING ROOM',kind:'steps',caption:'少し離れたところで、家族が両手を広げている。',duration:4400,phases:[
    p(.22,'まだ立ち上がる前。','床に座ったまま、次へ進んだ。',{stability:1},'dog'),
    p(.48,'ふらつきながら立つ。','一歩だけ進んだ。',{courage:1,health:1},'dog'),
    p(.76,'手を離して歩き出す。','自分の足で向かった。',{courage:2,curiosity:1},'dog'),
    p(1,'転び、笑い声が響く。','転んでも立ち上がった。',{courage:2,family:1},'dog') ]},
  dog:{age:5,era:'child',place:'PARK',kind:'dog',caption:'ベンチの下から、知らない犬がこちらを見る。',duration:5200,phases:[
    p(.2,'犬はまだ遠い。','気づかず通り過ぎた。',{},'school_gate'),
    p(.48,'犬が一歩近づく。','立ち止まって見つめた。',{curiosity:1},'school_gate'),
    p(.76,'鼻先をこちらへ寄せる。','手を差し出した。',{empathy:2,courage:1},'school_gate',['animal_memory']),
    p(1,'犬は飼い主の元へ戻る。','見えなくなるまで見送った。',{patience:1,empathy:1},'school_gate') ]},
  school_gate:{age:7,era:'school',place:'SCHOOL GATE',kind:'school',caption:'校門の前。ひとりの子が靴ひもを結び直している。',duration:5100,phases:[
    p(.18,'まだこちらに気づかない。','一人で教室へ向かった。',{independence:1},'desk'),
    p(.43,'顔を上げる。','同じタイミングで歩き出した。',{friend:1},'desk',['met_friend']),
    p(.72,'こちらを見て笑う。','並んで校門をくぐった。',{friend:2,empathy:1},'desk',['met_friend']),
    p(1,'先に走っていく。','背中を追いかけた。',{friend:1,courage:1},'desk',['met_friend']) ]},
  desk:{age:9,era:'school',place:'CLASSROOM',kind:'pencil',caption:'机の端に、誰かが落とした鉛筆が転がってくる。',duration:4700,phases:[
    p(.2,'まだ遠い。','そのまま授業へ進んだ。',{ambition:1},'rain'),
    p(.46,'足元で止まる。','鉛筆に気づいた。',{curiosity:1},'rain'),
    p(.72,'隣の子が探し始める。','拾って渡した。',{empathy:2,friend:1},'rain',['kindness_memory']),
    p(1,'先生が探し始める。','みんなで探すことになった。',{friend:1,patience:1},'rain') ]},
  rain:{age:12,era:'school',place:'WAY HOME',kind:'rain',caption:'帰り道。雨脚が少しずつ強くなる。',duration:5600,phases:[
    p(.18,'まだ小雨。','濡れる前に走り出した。',{courage:1},'club'),
    p(.46,'傘のない友達が立ち止まる。','友達の横で足を止めた。',{friend:1,empathy:1},'club'),
    p(.74,'一本の傘に二人で入れる。','傘を半分渡した。',{friend:2,empathy:2},'club',['shared_umbrella']),
    p(1,'雨が土砂降りになる。','二人でずぶ濡れになって笑った。',{friend:2,courage:1},'club',['shared_umbrella']) ]},
  club:{age:14,era:'teen',place:'AFTER SCHOOL',kind:'music',caption:'音楽室の扉の向こうから、演奏が聞こえる。',duration:5200,phases:[
    p(.18,'音は小さい。','そのまま帰宅した。',{stability:1},'rooftop'),
    p(.45,'曲が聞こえてくる。','廊下で足を止めた。',{curiosity:2},'rooftop',['likes_music']),
    p(.73,'扉が少し開く。','中をのぞいた。',{curiosity:2,courage:1},'rooftop',['likes_music']),
    p(1,'演奏が終わり、拍手が起きる。','最後まで聴いた。',{patience:1,curiosity:2},'rooftop',['likes_music']) ]},
  rooftop:{age:17,era:'teen',place:'ROOFTOP',kind:'confession',caption:'放課後。あの人が何か言いたそうにしている。',duration:6500,phases:[
    p(.16,'まだ距離がある。','言葉を聞く前に帰った。',{ambition:1},'exam'),
    p(.42,'目が合う。','視線だけが残った。',{romance:1},'exam',['met_romance']),
    p(.72,'ゆっくり近づいてくる。','話を聞いた。',{romance:2,empathy:1},'exam',['met_romance','young_love']),
    p(1,'言葉が出ないまま夕日が沈む。','何も言わず一緒に夕日を見た。',{romance:1,patience:2},'exam',['met_romance']) ]},
  exam:{age:18,era:'teen',place:'CLASSROOM',kind:'exam',caption:'進路票。まだ白い欄がひとつ残っている。',duration:5000,phases:[
    p(.18,'先生がまだ来ない。','早々に提出した。',{stability:2},'station'),
    p(.44,'友達の進路が目に入る。','少し迷って書き直した。',{curiosity:1,friend:1},'station'),
    p(.72,'窓の外を電車が通る。','遠い街の名前を書いた。',{courage:2,ambition:1},'station',['left_hometown']),
    p(1,'締切のチャイムが鳴る。','最後の瞬間まで迷った。',{patience:1,curiosity:1},'station') ]},
  station:{age:20,era:'young',place:'STATION',kind:'train',caption:'ホームに列車が入ってくる。扉が開くのは短い。',duration:5100,phases:[
    p(.18,'列車はまだ遠い。','一本前の道を選んだ。',{stability:1},'interview'),
    p(.44,'列車が止まる。','迷わず乗った。',{courage:2},'interview',['took_train']),
    p(.72,'扉が閉まり始める。','ぎりぎりで飛び乗った。',{courage:2,ambition:1},'interview',['took_train']),
    p(1,'列車が去る。','ホームに残った。',{patience:1,stability:1},'interview',['stayed_hometown']) ]},
  interview:{age:23,era:'young',place:'INTERVIEW',kind:'interview',caption:'面接官が履歴書を置き、最後の質問をしようとしている。',duration:5900,phases:[
    p(.18,'質問前。','先に席を立った。',{courage:1},'careerFork'),
    p(.44,'「あなたは何をしたい？」','用意した答えを返した。',{stability:2,ambition:1},'careerFork',['office_path']),
    p(.72,'面接官が少し笑う。','本当にやりたいことを話した。',{courage:2,curiosity:1},'careerFork',['creative_path']),
    p(1,'沈黙が長くなる。','答えを急がなかった。',{patience:2,ambition:1},'careerFork') ]},
  careerFork:{age:26,era:'young',place:'NIGHT',kind:'career',caption:'夜。仕事机と、昔から好きだったものが同じ部屋にある。',duration:5400,phases:[
    p(.18,'仕事の通知が光る。','仕事へ戻った。',{ambition:2,money:2},'reunion',['career_focus']),
    p(.45,'昔の道具に手が触れる。','久しぶりに好きなことを始めた。',{curiosity:2,health:1},'reunion',['kept_hobby']),
    p(.74,'通知がまた鳴る。','通知を伏せて、そのまま続けた。',{courage:1,curiosity:2,ambition:-1},'reunion',['creative_focus']),
    p(1,'夜が明ける。','どちらも少しずつ続けた。',{patience:2,stability:1},'reunion',['balanced_path']) ]},
  reunion:{age:29,era:'young',place:'CROSSWALK',kind:'reunion',caption:'交差点の向こうに、昔よく知っていた顔が見える。',duration:5200,phases:[
    p(.18,'まだ遠い。','気づかず通り過ぎた。',{},'home30'),
    p(.45,'相手もこちらに気づく。','会釈だけ交わした。',{friend:1},'home30'),
    p(.72,'信号が変わる。','道路を渡って声をかけた。',{friend:2,courage:1},'home30',['reconnected']),
    p(1,'信号が赤に戻る。','遠くから笑って手を振った。',{friend:1,patience:1},'home30',['reconnected']) ]},
  home30:{age:34,era:'adult',place:'HOME',kind:'home',caption:'静かな夜。食卓に、もう一つ椅子を置けそうな余白がある。',duration:5900,phases:[
    p(.18,'まだ一人の時間。','仕事の続きを始めた。',{ambition:2,money:1},'parent_call',['solo_path']),
    p(.44,'スマホに昔の相手の名前。','メッセージを開いた。',{romance:1,empathy:1},'parent_call',['partner_path']),
    p(.72,'玄関で物音。','誰かを迎え入れた。',{romance:2,family:1},'parent_call',['partner_path']),
    p(1,'部屋の灯りだけが残る。','一人の夜を心地よく過ごした。',{stability:2,health:1},'parent_call',['solo_content']) ]},
  parent_call:{age:41,era:'adult',place:'OFFICE',kind:'phone',caption:'仕事中。家族からの着信が何度か鳴っている。',duration:5600,phases:[
    p(.17,'最初の着信。','仕事を優先した。',{ambition:2,money:1,family:-1},'crossroads40'),
    p(.44,'二度目の着信。','少し迷って画面を見た。',{family:1},'crossroads40'),
    p(.72,'三度目の着信。','電話に出た。',{family:2,empathy:2,ambition:-1},'crossroads40',['answered_family']),
    p(1,'着信が止まる。','あとから折り返した。',{family:1,patience:1},'crossroads40') ]},
  crossroads40:{age:48,era:'adult',place:'CITY',kind:'crossroads',caption:'長く続けたものと、新しい道が同時に目の前にある。',duration:6200,phases:[
    p(.18,'いつもの道が開いている。','慣れた道を選んだ。',{stability:2,money:2},'letter55',['stayed_course']),
    p(.45,'脇道に明かりがつく。','少しだけ寄り道した。',{curiosity:2},'letter55',['side_project']),
    p(.73,'新しい道の門が開く。','思い切って曲がった。',{courage:2,ambition:1,money:-1},'letter55',['changed_life']),
    p(1,'門が閉まり始める。','最後まで見てから歩き出した。',{patience:2,stability:1},'letter55') ]},
  letter55:{age:56,era:'middle',place:'HOME',kind:'letter',caption:'古い箱から、子どもの頃の手紙が一枚出てくる。',duration:5600,phases:[
    p(.18,'封筒だけが見える。','箱を閉じた。',{stability:1},'old_friend'),
    p(.45,'自分の名前が見える。','手紙を開いた。',{curiosity:1,family:1},'old_friend'),
    p(.72,'幼い字が並ぶ。','最後まで読んだ。',{empathy:2,patience:1},'old_friend',['remembered_childhood']),
    p(1,'写真が一枚落ちる。','写真まで拾い上げた。',{family:2,friend:1},'old_friend',['remembered_childhood']) ]},
  old_friend:{age:63,era:'middle',place:'CAFE',kind:'friend',caption:'窓の外を、昔の友人によく似た人が通る。',duration:5400,phases:[
    p(.18,'まだ横顔だけ。','コーヒーを飲み続けた。',{stability:1},'park72'),
    p(.45,'こちらを向く。','席を立った。',{friend:1,courage:1},'park72'),
    p(.72,'目が合う。','店の外へ追いかけた。',{friend:2,courage:1},'park72',['late_reunion']),
    p(1,'人混みに消える。','見えなくなるまで探した。',{friend:1,patience:2},'park72') ]},
  park72:{age:72,era:'old',place:'PARK',kind:'parkold',caption:'公園。子どもがボールをこちらへ転がしてくる。',duration:5500,phases:[
    p(.18,'ボールはまだ遠い。','散歩を続けた。',{health:1},'old_music'),
    p(.45,'足元まで転がる。','ボールを止めた。',{empathy:1,health:1},'old_music'),
    p(.72,'子どもがこちらを見る。','ゆっくり蹴り返した。',{empathy:2,health:1},'old_music',['passed_it_on']),
    p(1,'子どもが笑う。','少しだけ一緒に遊んだ。',{health:1,empathy:2},'old_music',['passed_it_on']) ]},
  old_music:{age:79,era:'old',place:'ROOM',kind:'oldmusic',caption:'部屋の隅に、若い頃に触れたものが残っている。',duration:6400,phases:[
    p(.18,'まだ埃をかぶっている。','眺めるだけで終えた。',{stability:1},'final'),
    p(.44,'手を伸ばせる距離。','埃を払った。',{curiosity:1},'final'),
    p(.73,'昔の音が少し戻る。','もう一度、音を鳴らした。',{curiosity:2,health:1},'final',['returned_to_music']),
    p(1,'音が部屋に残る。','一曲が終わるまで聴いた。',{patience:2,empathy:1},'final',['returned_to_music']) ]},
  final:{age:86,era:'old',place:'LAST DAY',kind:'final',caption:'人生の最後の日。もう急ぐ必要はない。',duration:12000,final:true,phases:[
    p(.15,'朝の光。','朝の光の中で人生を閉じた。',{},'END'),
    p(.38,'遠くで誰かの足音。','誰かの気配を感じながら人生を閉じた。',{family:1},'END'),
    p(.65,'思い出の品が光を受ける。','これまで残ったものを見渡した。',{patience:1},'END'),
    p(1,'夕暮れ。部屋に静けさが満ちる。','最後まで、この一日を見届けた。',{patience:2},'END') ]}
};

function p(until,cue,outcome,effects,next,flags=[]){return{until,cue,outcome,effects,next,flags}}
function applyEffects(e={}){
  Object.entries(e).forEach(([k,v])=>{
    if(k in state.stats) state.stats[k]+=v;
    else if(k in state.relations) state.relations[k]+=v;
    else state.stats[k]=(state.stats[k]||0)+v;
  });
}

function init(){
  Object.assign(state,{stats:{curiosity:0,empathy:0,courage:0,patience:0,ambition:0,stability:0,health:6,money:0},relations:{family:2,friend:0,romance:0},flags:new Set(),history:[],age:0,started:false,idx:0});
  $('#ending').classList.add('hidden'); $('#game').classList.remove('hidden'); hintEl.style.display='flex';
  loadEvent('birth');
}

function loadEvent(id){
  current=eventGraph[id]; current.id=id; startTime=performance.now(); locked=false; state.age=current.age;
  ageEl.textContent=`${current.age} YEARS`; placeEl.textContent=current.place; hintEl.style.opacity=state.started?'.55':'1';
  renderScene(current,0); cancelAnimationFrame(raf); raf=requestAnimationFrame(tick);
}

function tick(now){
  if(!current||locked) return;
  const progress=Math.min(1,(now-startTime)/current.duration);
  renderScene(current,progress);
  raf=requestAnimationFrame(tick);
}

function phaseAt(progress){return current.phases.find(x=>progress<=x.until)||current.phases.at(-1)}

function renderScene(ev,progress){
  const phaseIndex=Math.max(0,ev.phases.findIndex(x=>progress<=x.until));
  const phase=ev.phases[phaseIndex<0?ev.phases.length-1:phaseIndex];
  const ageClass=ev.age<7?'child':ev.age<19?'teen':ev.age>69?'old':'';
  const palettes={child:['#99c7d7','#f2d4a7','#78a66b'],school:['#86b8cf','#f2cf9e','#78a66b'],teen:['#eda88f','#8ea1c7','#6e7b58'],young:['#6d8195','#e7b79a','#4d5964'],adult:['#596d7c','#d1a27f','#4a4d4a'],middle:['#70818a','#c7ad8c','#6f775d'],old:['#708895','#d7b99a','#6b776b']};
  const [s1,s2,g]=palettes[ev.era]||palettes.adult;
  const char=`<div class="character ${ageClass}" style="--hair:${ev.age>65?'#c8c6c1':'#2e2728'};--shirt:${ev.era==='teen'?'#6f7c9b':ev.era==='old'?'#7d796f':'#607b87'}"><div class="hair"></div><div class="head"><i class="eye l"></i><i class="eye r"></i></div><div class="body"></div><div class="arm l"></div><div class="arm r"></div><div class="leg l"></div><div class="leg r"></div></div>`;
  let bg=`<div class="sky" style="--sky1:${s1};--sky2:${s2}"></div><div class="sun"></div><div class="ground" style="--ground:${g}"></div>`;
  let prop='';
  const t=progress;
  switch(ev.kind){
    case 'hand': prop=`<div class="prop" style="width:90px;height:34px;border-radius:30px;background:#e9b993;left:${20+Math.min(t,.8)*38}%;top:50%;transform:rotate(-8deg)"></div>`; break;
    case 'steps': prop=`<div class="prop" style="font-size:66px;right:13%;bottom:23%;transform:scale(${.6+t*.5})">🤲</div>`; break;
    case 'dog': prop=`<div class="prop" style="font-size:76px;left:${8+Math.min(t,.75)*45}%;bottom:20%">🐕</div>`; break;
    case 'school': bg+=`<div class="prop" style="left:8%;right:8%;bottom:18%;height:36%;background:#d7c1a0;border-radius:8px 8px 0 0;box-shadow:inset 0 -12px #a36b55"><div style="position:absolute;left:40%;bottom:0;width:20%;height:45%;background:#584d49"></div></div>`; prop=`<div class="prop" style="font-size:58px;left:${18+t*28}%;bottom:20%">🧒</div>`; break;
    case 'pencil': bg=`<div style="position:absolute;inset:0;background:linear-gradient(180deg,#bba783,#8b6d50)"></div>`; prop=`<div class="prop" style="width:128px;height:12px;border-radius:10px;background:#e0b949;left:${20+t*38}%;bottom:38%;transform:rotate(${20+t*80}deg)"></div>`; break;
    case 'rain': bg=`<div class="sky" style="--sky1:#73818e;--sky2:#9aa3a8"></div><div class="ground" style="--ground:#5d675c"></div><div style="position:absolute;inset:0;background:repeating-linear-gradient(105deg,transparent 0 18px,rgba(220,235,245,${.08+t*.16}) 19px 21px)"></div>`; prop=`<div class="prop" style="font-size:76px;left:11%;bottom:19%">☂️</div>`; break;
    case 'music': bg=`<div style="position:absolute;inset:0;background:linear-gradient(180deg,#cab598,#715b4c)"></div><div class="prop" style="left:7%;right:7%;top:12%;bottom:18%;border:12px solid #80563f;background:#b6926e"></div>`; prop=`<div class="prop" style="font-size:${45+t*25}px;right:15%;top:34%;opacity:${.45+t*.55}">♪ ♫</div>`; break;
    case 'confession': bg=`<div class="sky" style="--sky1:#d47a6c;--sky2:#6f79a8"></div><div class="ground" style="--ground:#555b62"></div>`; prop=`<div class="prop" style="font-size:84px;left:${8+t*34}%;bottom:19%;transform:scale(${.84+t*.12})">🧑</div>`; break;
    case 'exam': bg=`<div style="position:absolute;inset:0;background:linear-gradient(180deg,#9fb9c4 0 36%,#b99a76 36%)"></div>`; prop=`<div class="prop" style="left:14%;right:14%;bottom:18%;height:35%;background:#d9cfbd;transform:rotate(${2-t*3}deg);box-shadow:0 14px 30px rgba(0,0,0,.15)"><div style="margin:12%;border-bottom:2px solid #8b8175;height:22%"></div><div style="margin:0 12%;border-bottom:2px solid #8b8175;height:22%"></div></div>`; break;
    case 'train': bg=`<div class="sky" style="--sky1:#8c9aa4;--sky2:#d1b394"></div><div style="position:absolute;left:0;right:0;bottom:10%;height:28%;background:#5c5e61"></div>`; prop=`<div class="prop" style="font-size:88px;left:${90-t*100}%;bottom:21%">🚆</div>`; break;
    case 'interview': bg=`<div class="window" style="--sky1:#a8bdc7;--sky2:#d7bd9c"></div><div class="room-floor"></div>`; prop=`<div class="prop" style="font-size:86px;right:10%;bottom:22%">🧑‍💼</div>`; break;
    case 'career': bg=`<div class="window" style="--sky1:#303d55;--sky2:#6f6576"></div><div class="room-floor" style="background:#4d433d"></div>`; prop=`<div class="prop" style="font-size:58px;right:12%;bottom:24%;opacity:${.75+Math.sin(t*14)*.2}">💻</div><div class="prop" style="font-size:64px;left:10%;bottom:22%;transform:rotate(${-12+t*4}deg)">🎸</div>`; break;
    case 'reunion': prop=`<div class="prop" style="font-size:78px;left:${5+t*48}%;bottom:20%">🧑</div><div style="position:absolute;left:0;right:0;bottom:15%;height:30px;background:repeating-linear-gradient(90deg,#eee 0 35px,#444 35px 55px)"></div>`; break;
    case 'home': bg=`<div class="window" style="--sky1:#2a3450;--sky2:#706177"></div><div class="room-floor"></div>`; prop=`<div class="prop" style="left:12%;right:12%;bottom:22%;height:16%;background:#745a46;border-radius:8px"></div><div class="prop" style="font-size:62px;right:10%;bottom:33%;opacity:${Math.max(0,(t-.25)*1.5)}">🪑</div>`; break;
    case 'phone': bg=`<div class="window" style="--sky1:#60758b;--sky2:#c0a081"></div><div class="room-floor" style="background:#5e6466"></div>`; prop=`<div class="prop" style="font-size:70px;right:12%;bottom:23%;transform:rotate(${Math.sin(t*40)*4}deg)">📱</div>`; break;
    case 'crossroads': bg=`<div class="sky" style="--sky1:#7e95a3;--sky2:#ceb096"></div><div class="ground" style="--ground:#69725c"></div><div style="position:absolute;left:42%;bottom:-3%;width:18%;height:58%;background:#777;clip-path:polygon(35% 0,65% 0,100% 100%,0 100%)"></div><div style="position:absolute;left:${58+t*8}%;bottom:-3%;width:16%;height:50%;background:#9a806b;clip-path:polygon(35% 0,65% 0,100% 100%,0 100%);transform:rotate(-14deg);transform-origin:bottom"></div>`; break;
    case 'letter': bg=`<div class="window" style="--sky1:#9aa9a9;--sky2:#d3b896"></div><div class="room-floor"></div>`; prop=`<div class="prop" style="font-size:78px;left:12%;bottom:22%;transform:rotate(${-8+t*10}deg)">✉️</div><div class="prop" style="font-size:58px;left:${18+t*25}%;bottom:${20+t*12}%;opacity:${Math.max(0,(t-.55)*2.2)}">📷</div>`; break;
    case 'friend': bg=`<div class="window" style="--sky1:#8fa2ae;--sky2:#c9b28e"></div><div class="room-floor"></div>`; prop=`<div class="prop" style="font-size:76px;left:${2+t*58}%;bottom:24%">🧓</div>`; break;
    case 'parkold': prop=`<div class="prop" style="font-size:52px;left:${4+t*44}%;bottom:${23+t*4}%">⚽</div><div class="prop" style="font-size:64px;right:10%;bottom:20%">🧒</div>`; break;
    case 'oldmusic': bg=`<div class="window" style="--sky1:#8e9ca3;--sky2:#d3b49b"></div><div class="room-floor"></div>`; prop=`<div class="prop" style="font-size:74px;left:12%;bottom:22%;filter:grayscale(${Math.max(0,.7-t)});transform:rotate(-10deg)">🎸</div><div class="prop" style="right:13%;top:18%;font-size:${32+t*24}px;opacity:${Math.max(0,(t-.45)*1.8)}">♪</div>`; break;
    case 'final': bg=`<div class="window" style="--sky1:${t<.6?'#9cb3bd':'#bd8778'};--sky2:${t<.6?'#d8c5aa':'#5f6179'}"></div><div class="room-floor" style="background:#786653"></div>`; prop=`<div class="prop" style="font-size:48px;left:10%;bottom:23%;opacity:${Math.min(1,t*2)}">📷</div><div class="prop" style="font-size:50px;right:11%;bottom:23%;opacity:${Math.max(0,(t-.25)*2)}">✉️</div><div class="prop" style="font-size:56px;left:36%;bottom:18%;opacity:${Math.max(0,(t-.48)*2)}">🎸</div>`; break;
  }
  sceneEl.innerHTML=`${bg}${char}${prop}<div class="scene-caption">${ev.caption}<small>${phase.cue}</small></div>`;
}

function swipe(){
  if(locked||!current) return;
  locked=true; state.started=true; hintEl.style.display='none'; cancelAnimationFrame(raf);
  const progress=Math.min(1,(performance.now()-startTime)/current.duration);
  const phase=phaseAt(progress); applyEffects(phase.effects); phase.flags.forEach(f=>state.flags.add(f));
  state.history.push({id:current.id,age:current.age,era:current.era,title:current.caption,outcome:phase.outcome,chosen:phase.cue,alternatives:current.phases.filter(x=>x!==phase).map(x=>x.outcome)});
  showToast(phase.outcome);
  sceneEl.style.transition='transform .38s cubic-bezier(.2,.85,.2,1),opacity .38s'; sceneEl.style.transform='translateY(-100%)'; sceneEl.style.opacity='.75';
  setTimeout(()=>{
    sceneEl.style.transition='none'; sceneEl.style.transform='translateY(100%)'; sceneEl.style.opacity='1';
    if(phase.next==='END'){ showEnding(); return; }
    current=eventGraph[phase.next]; current.id=phase.next; state.age=current.age; ageEl.textContent=`${current.age} YEARS`; placeEl.textContent=current.place; startTime=performance.now(); renderScene(current,0);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{sceneEl.style.transition='transform .42s cubic-bezier(.2,.85,.2,1)';sceneEl.style.transform='translateY(0)';setTimeout(()=>{sceneEl.style.transition='none';locked=false;raf=requestAnimationFrame(tick)},430)}));
  },390);
}

function showToast(txt){ toastEl.textContent=txt; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),1200); }

function showEnding(){
  $('#game').classList.add('hidden'); $('#ending').classList.remove('hidden');
  const age=state.age; $('#endingAge').textContent=`${age} YEARS`;
  const line=lifeLine(); $('#endingLine').textContent=line;
  const people=Math.max(3,6+state.relations.friend*2+state.relations.romance*2+state.relations.family);
  const moments=state.history.length;
  $('#endingMetrics').innerHTML=`<div class="metric"><b>${moments}</b><span>MOMENTS</span></div><div class="metric"><b>${people}</b><span>PEOPLE</span></div><div class="metric"><b>${state.flags.size}</b><span>MEMORIES</span></div>`;
  renderEraTabs(); renderEra('child'); renderPossibilities();
}

function lifeLine(){
  const s=state.stats,r=state.relations;
  const candidates=[
    [s.patience*1.4+r.family,'急がずに見届けた時間が、あなたの人生を長くつないだ。'],
    [s.curiosity*1.4,'何度も立ち止まり、知らないものを見つけた人生だった。'],
    [s.courage*1.4,'迷った瞬間にも、何度か自分から一歩を踏み出した。'],
    [r.friend*1.5+r.romance,'人との縁が、何年たっても人生の続きを連れてきた。'],
    [s.ambition*1.3,'先へ進むことを恐れず、自分の道を作った。'],
    [s.stability*1.3,'遠くへ行くより、残したものを大切にした人生だった。'],
  ].sort((a,b)=>b[0]-a[0]);
  return candidates[0][1];
}

function renderEraTabs(){
  $('#eraTabs').innerHTML=eras.map((e,i)=>`<button class="era-tab ${i===0?'active':''}" data-era="${e.id}">${e.label}<br><small>${e.range}</small></button>`).join('');
  document.querySelectorAll('.era-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.era-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderEra(b.dataset.era)}));
}
function renderEra(era){
  const items=state.history.filter(h=>h.era===era);
  $('#eraSummary').innerHTML=items.length?items.map(h=>`<article class="memory-card"><div class="memory-age">${h.age} YEARS</div><div class="memory-title">${shortTitle(h.id)}</div><div class="memory-outcome">${h.outcome}</div></article>`).join(''):`<div class="memory-card"><div class="memory-outcome">この時代には大きな記憶が残らなかった。</div></div>`;
}
function renderPossibilities(){
  const major=state.history.filter((_,i)=>i%3===1).slice(0,7);
  $('#possibilities').innerHTML=major.map(h=>`<article class="possibility"><div class="memory-age">${h.age} YEARS · ${shortTitle(h.id)}</div><div class="actual">● あなたが歩いた人生<br><span style="font-weight:500">${h.outcome}</span></div><ul>${h.alternatives.slice(0,3).map(a=>`<li>${a}</li>`).join('')}</ul></article>`).join('');
}
function shortTitle(id){
  const map={birth:'はじめての手',first_steps:'最初の一歩',dog:'公園の犬',school_gate:'校門',desk:'落とした鉛筆',rain:'雨の帰り道',club:'音楽室',rooftop:'放課後の屋上',exam:'進路票',station:'駅のホーム',interview:'面接',careerFork:'夜の机',reunion:'交差点の再会',home30:'食卓の余白',parent_call:'家族からの電話',crossroads40:'二つの道',letter55:'古い手紙',old_friend:'窓の外の友人',park72:'転がるボール',old_music:'昔の音',final:'最後の日'};return map[id]||id;
}

const drag=$('#dragLayer');
drag.addEventListener('pointerdown',e=>{if(locked)return;dragging=true;startY=lastY=e.clientY;drag.setPointerCapture(e.pointerId)});
drag.addEventListener('pointermove',e=>{if(!dragging||locked)return;lastY=e.clientY;const dy=Math.min(0,lastY-startY);sceneEl.style.transition='none';sceneEl.style.transform=`translateY(${dy*.46}px)`;});
drag.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;const dy=lastY-startY;if(dy<-46){swipe()}else{sceneEl.style.transition='transform .22s';sceneEl.style.transform='translateY(0)'}});
drag.addEventListener('pointercancel',()=>{dragging=false;sceneEl.style.transform='translateY(0)'});
$('#rebornBtn').addEventListener('click',init);
$('#soundBtn').addEventListener('click',()=>{soundOn=!soundOn;$('#soundBtn').textContent=soundOn?'♪':'×';showToast(soundOn?'音をオン':'音をオフ')});

init();
