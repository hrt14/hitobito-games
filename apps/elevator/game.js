(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const floorNum = $('floorNum');
  const hallFloorLabel = $('hallFloorLabel');
  const candidate = $('candidate');
  const candidateEmoji = $('candidateEmoji');
  const candidateName = $('candidateName');
  const candidateNote = $('candidateNote');
  const doorFrame = $('doorFrame');
  const passengersEl = $('passengers');
  const eventToast = $('eventToast');
  const controls = $('controls');
  const acceptBtn = $('acceptBtn');
  const rejectBtn = $('rejectBtn');
  const intro = $('intro');
  const startBtn = $('startBtn');
  const endingScreen = $('endingScreen');
  const restartBtn = $('restartBtn');
  const endingCount = $('endingCount');
  const capacityNow = $('capacityNow');
  const moodBar = $('moodBar');
  const dangerBar = $('dangerBar');
  const wonderBar = $('wonderBar');
  const leftFeedback = $('leftFeedback');
  const rightFeedback = $('rightFeedback');
  const hall = $('hall');
  const gameArea = $('gameArea');

  const MAX_CAPACITY = 12;
  const tutorial = ['old','dog','rich','thief','scientist','alien','doctor','zombie'];

  const people = [
    {id:'old', emoji:'👴', name:'老人', note:'少し息を切らしている', min:1, kind:'human'},
    {id:'dog', emoji:'🐕', name:'犬', note:'しっぽだけは信用できそう', min:1, kind:'animal'},
    {id:'rich', emoji:'🤑', name:'大金持ち', note:'札束の匂いがする', min:1, kind:'human'},
    {id:'thief', emoji:'🥷', name:'泥棒', note:'目を合わせない', min:1, kind:'human'},
    {id:'scientist', emoji:'🧑‍🔬', name:'科学者', note:'ずっと天井を計測している', min:1, kind:'human'},
    {id:'alien', emoji:'👽', name:'宇宙人', note:'ボタンの意味を理解している', min:5, kind:'weird'},
    {id:'doctor', emoji:'🧑‍⚕️', name:'医者', note:'救急箱を持っている', min:1, kind:'human'},
    {id:'zombie', emoji:'🧟', name:'ゾンビ', note:'乗せていい顔ではない', min:7, kind:'danger'},
    {id:'child', emoji:'🧒', name:'子ども', note:'100階を見てみたいらしい', min:2, kind:'human'},
    {id:'teacher', emoji:'🧑‍🏫', name:'先生', note:'全員の人数を数えている', min:3, kind:'human'},
    {id:'police', emoji:'👮', name:'警察官', note:'車内を一周見回した', min:10, kind:'human'},
    {id:'cat', emoji:'🐈', name:'猫', note:'もう乗るつもりでいる', min:2, kind:'animal'},
    {id:'chef', emoji:'🧑‍🍳', name:'料理人', note:'鍋だけ持ってきた', min:8, kind:'human'},
    {id:'musician', emoji:'🎸', name:'ミュージシャン', note:'音量だけが心配', min:8, kind:'human'},
    {id:'robot', emoji:'🤖', name:'ロボット', note:'定員表示を凝視している', min:16, kind:'weird'},
    {id:'astronaut', emoji:'👩‍🚀', name:'宇宙飛行士', note:'なぜここにいるのか聞けない', min:20, kind:'human'},
    {id:'ghost', emoji:'👻', name:'幽霊', note:'定員に数えるべきだろうか', min:22, kind:'weird'},
    {id:'monk', emoji:'🧘', name:'僧侶', note:'目を閉じたまま待っている', min:18, kind:'human'},
    {id:'box', emoji:'📦', name:'謎の箱', note:'宛先は「100F」', min:12, kind:'object'},
    {id:'detective', emoji:'🕵️', name:'探偵', note:'すでに何か疑っている', min:20, kind:'human'},
    {id:'engineer', emoji:'🧑‍🔧', name:'技術者', note:'エレベーターの音を聞いている', min:14, kind:'human'},
    {id:'nurse', emoji:'👩‍⚕️', name:'看護師', note:'誰かの体温を測りたそう', min:15, kind:'human'},
    {id:'artist', emoji:'👩‍🎨', name:'画家', note:'車内を描き始めた', min:15, kind:'human'},
    {id:'firefighter', emoji:'🧑‍🚒', name:'消防士', note:'何も燃えていないのに来た', min:18, kind:'human'},
    {id:'hacker', emoji:'🧑‍💻', name:'ハッカー', note:'階数表示を見て笑っている', min:26, kind:'human'},
    {id:'fortune', emoji:'🔮', name:'占い師', note:'100階のことは言いたくないらしい', min:28, kind:'weird'},
    {id:'clown', emoji:'🤡', name:'道化師', note:'誰も呼んでいない', min:30, kind:'human'},
    {id:'penguin', emoji:'🐧', name:'ペンギン', note:'この階だけ少し寒い', min:34, kind:'animal'},
    {id:'monster', emoji:'👾', name:'小さな怪物', note:'宇宙人の後ろに隠れていた', min:40, kind:'weird'},
    {id:'angel', emoji:'😇', name:'天使', note:'上に行きたいと言っている', min:45, kind:'weird'},
    {id:'devil', emoji:'😈', name:'悪魔', note:'下りじゃなくていいのか', min:45, kind:'danger'},
    {id:'clone', emoji:'🧍', name:'あなたに似た人', note:'先に乗っていた気がする', min:55, kind:'weird'},
    {id:'time', emoji:'⏳', name:'時間旅行者', note:'「まだ73階？」と言った', min:60, kind:'weird'},
    {id:'moon', emoji:'🌝', name:'月の住人', note:'地球の重力が重そう', min:68, kind:'weird'},
    {id:'king', emoji:'🤴', name:'王様', note:'この箱を国だと思っている', min:72, kind:'human'},
    {id:'dragon', emoji:'🐉', name:'小さな竜', note:'火気厳禁の表示を見ている', min:78, kind:'danger'},
    {id:'ai', emoji:'🧠', name:'意識だけのAI', note:'スマホから「乗せて」と表示された', min:82, kind:'weird'},
    {id:'star', emoji:'⭐', name:'落ちてきた星', note:'触ると少しあたたかい', min:88, kind:'weird'},
    {id:'future', emoji:'🧑‍🚀', name:'100階の住人', note:'「やっと来た」と言った', min:94, kind:'weird'}
  ];
  const byId = Object.fromEntries(people.map(p => [p.id,p]));

  const pairEvents = {
    'dog|old': () => {
      setStatus('old','元気'); mod({mood:18});
      return '🐕 犬が老人の膝にあごを乗せた。<strong>老人が少し元気になった。</strong>';
    },
    'rich|thief': () => {
      setStatus('rich','財布なし'); setStatus('thief','財布？'); mod({danger:10,mood:-5});
      return '🥷 ドアが閉まった。<strong>金持ちの財布が消えた。</strong> 泥棒は急に静かになった。';
    },
    'alien|scientist': () => {
      state.device = true; mod({wonder:30,mood:7}); setStatus('scientist','興奮'); setStatus('alien','共同研究');
      return '👽 科学者と宇宙人が無言で部品を交換した。<strong>未知の装置ができた。</strong>';
    },
    'doctor|zombie': () => {
      const z = state.passengers.find(p => p.id === 'zombie');
      if(z){ z.id='recovered'; z.emoji='🧑'; z.name='元ゾンビ'; z.kind='human'; z.status='平熱'; }
      mod({danger:-28,wonder:14,mood:12});
      return '🧑‍⚕️ 医者がゾンビを診察した。39.8度。注射一本。<strong>……治った。</strong>';
    },
    'police|thief': () => {
      removeOne('thief'); if(has('rich')) setStatus('rich','財布戻る'); mod({danger:-18,mood:8});
      return '👮 警察官が泥棒の袖をつかんだ。<strong>財布が戻った。</strong> 泥棒だけ次の階で降ろされた。';
    },
    'child|teacher': () => { setStatus('child','安心'); mod({mood:12}); return '🧑‍🏫 先生が子どもに100階までの数え方を教え始めた。<strong>車内が教室になった。</strong>'; },
    'chef|old': () => { setStatus('old','満腹'); mod({mood:10}); return '🧑‍🍳 料理人がどこからかスープを出した。<strong>老人が二杯飲んだ。</strong>'; },
    'cat|dog': () => { mod({danger:8,mood:5}); return '🐈🐕 猫と犬が座席の一角をめぐって冷戦を始めた。<strong>誰もそこに座れない。</strong>'; },
    'engineer|robot': () => { setStatus('robot','改造済'); mod({wonder:14}); return '🧑‍🔧 技術者がロボットの背中を開けた。<strong>ロボットが階数を予知し始めた。</strong>'; },
    'hacker|robot': () => { setStatus('robot','乗っ取られた'); mod({danger:17,wonder:12}); return '🧑‍💻 ハッカーがロボットに接続した。<strong>「次は存在しない階です」</strong>と表示された。'; },
    'alien|astronaut': () => { mod({wonder:18,mood:6}); return '👩‍🚀 宇宙飛行士と宇宙人が目を合わせた。<strong>二人とも「久しぶり」と言った。</strong>'; },
    'ghost|monk': () => { removeOne('ghost'); mod({danger:-12,mood:7,wonder:8}); return '🧘 僧侶が一度だけ鐘を鳴らした。<strong>幽霊は会釈して天井へ消えた。</strong>'; },
    'fortune|ghost': () => { setStatus('ghost','常連'); mod({wonder:12}); return '🔮 占い師は幽霊を見るなり言った。<strong>「またあなた？」</strong>'; },
    'alien|artist': () => { setStatus('alien','肖像画'); mod({mood:8,wonder:8}); return '👩‍🎨 画家が宇宙人の肖像を描いた。<strong>本人がいちばん気に入った。</strong>'; },
    'box|cat': () => { setStatus('cat','箱入り'); mod({mood:9,wonder:4}); return '📦 箱が少し開いた。猫が入った。<strong>箱はもう謎ではなくなった。</strong>'; },
    'box|thief': () => { setStatus('thief','紙吹雪'); mod({mood:8,danger:-4}); return '🥷 泥棒が謎の箱を開けた。<strong>中身は紙吹雪だけだった。</strong> 一番驚いたのは泥棒。'; },
    'doctor|nurse': () => { state.clinic=true; mod({mood:10,danger:-10}); return '👩‍⚕️ 医者と看護師が壁際を診察室にした。<strong>エレベーター内医院が開業。</strong>'; },
    'engineer|scientist': () => { state.lab=true; mod({wonder:16}); return '🧑‍🔧 科学者の設計図を技術者が本当に作ってしまった。<strong>床から謎の低音がする。</strong>'; },
    'clown|ghost': () => { setStatus('ghost','笑顔'); mod({mood:13,danger:-5}); return '🤡 道化師が幽霊を驚かせた。<strong>幽霊が初めて笑った。</strong>'; },
    'angel|devil': () => { mod({wonder:20,danger:6,mood:4}); return '😇😈 天使と悪魔が階数ボタンの前で協議を始めた。<strong>議題は「上か下か」。</strong>'; },
    'king|police': () => { setStatus('king','一般客'); mod({mood:8,danger:-6}); return '👮 王様が列に割り込んだ。警察官が止めた。<strong>王様は初めて順番を守った。</strong>'; },
    'dragon|firefighter': () => { setStatus('dragon','火気厳禁'); mod({danger:-18,mood:6}); return '🧑‍🚒 消防士が小さな竜に「ここでは火を吹かない」と約束させた。<strong>竜はうなずいた。</strong>'; },
    'ai|scientist': () => { setStatus('scientist','議論中'); mod({wonder:20}); return '🧠 AIと科学者が「人間とは何か」を議論し始めた。<strong>人間たちは聞かなかったことにした。</strong>'; },
    'clone|detective': () => { setStatus('clone','本人？'); mod({wonder:14,danger:7}); return '🕵️ 探偵があなたに似た人を調べた。<strong>「あなたの方が偽物かもしれない」</strong>と言った。'; },
    'alien|star': () => { setStatus('alien','帰宅準備'); mod({wonder:22,mood:10}); return '⭐ 宇宙人が星を両手で包んだ。<strong>車内の照明が一度だけ昼になった。</strong>'; }
  };

  const endings = [
    {id:'empty', icon:'🛗', title:'無人の100階', test:s=>s.passengers.length===0, text:'最後まで誰も乗せなかった。100階でドアが開く。そこには、あなたを待つ椅子が一脚だけあった。'},
    {id:'outbreak', icon:'🧟', title:'移動する感染都市', test:s=>countId('zombie')>=3 || s.danger>=82, text:'100階に着いた時、もうこれはエレベーターではなかった。階を移動する、小さな感染都市だった。'},
    {id:'newcivil', icon:'🛸', title:'最初の異星共同体', test:s=>s.device && has('alien') && (has('scientist')||has('engineer')) && s.wonder>=55, text:'未知の装置が100階で起動した。扉の外にあったのは屋上ではない。ここから、人間と宇宙人の最初の町が始まった。'},
    {id:'gentle', icon:'🐕', title:'やさしい共同体', test:s=>has('old')&&has('dog')&&s.mood>=58&&s.danger<55, text:'犬のそばに老人がいて、誰かが食べ物を分け、誰かが席を譲る。100階までに、知らない者同士は家族のようになっていた。'},
    {id:'paranormal', icon:'👻', title:'存在しない101階', test:s=>(has('ghost')||has('fortune')||has('time'))&&s.wonder>=48, text:'100階の表示が一瞬だけ「101」になった。誰もボタンを押していない。何人かは、その階で降りていった。'},
    {id:'order', icon:'🏛️', title:'十二人共和国', test:s=>s.passengers.length>=9&&has('police')&&has('teacher')&&s.danger<45, text:'定員12名。法律、当番、議事録までできた。100階に着くころには、エレベーターは世界でいちばん小さな共和国になっていた。'},
    {id:'chaos', icon:'🎪', title:'混沌の箱', test:s=>s.passengers.length>=10&&s.danger>=55, text:'誰かが歌い、誰かが盗み、誰かが幽霊と話している。扉が開いても、全員「このままでいい」と言った。'},
    {id:'society', icon:'🏙️', title:'小さな社会', test:s=>true, text:'100回の選択のあと、残ったのは偶然ではない。乗せた人、見送った人、その組み合わせ全部が、この小さな社会を作った。'}
  ];

  const state = {
    floor:1, passengers:[], candidate:null, locked:false,
    mood:25, danger:12, wonder:8, device:false, clinic:false, lab:false,
    serial:0, seenPairs:new Set(), usedOnFloor:new Set(), started:false
  };

  function resetState(){
    state.floor=1; state.passengers=[]; state.candidate=null; state.locked=false;
    state.mood=25; state.danger=12; state.wonder=8; state.device=false; state.clinic=false; state.lab=false;
    state.serial=0; state.seenPairs=new Set(); state.usedOnFloor=new Set(); state.started=true;
    endingScreen.hidden=true; controls.classList.remove('locked'); updateUI();
  }

  function clonePerson(base){ return {...base, uid:`${base.id}-${++state.serial}`, status:''}; }
  function has(id){ return state.passengers.some(p=>p.id===id); }
  function countId(id){ return state.passengers.filter(p=>p.id===id).length; }
  function setStatus(id,status){ const p=state.passengers.find(x=>x.id===id); if(p) p.status=status; }
  function removeOne(id){ const i=state.passengers.findIndex(p=>p.id===id); if(i>=0) state.passengers.splice(i,1); }
  function mod(v){
    if(v.mood) state.mood=Math.max(0,Math.min(100,state.mood+v.mood));
    if(v.danger) state.danger=Math.max(0,Math.min(100,state.danger+v.danger));
    if(v.wonder) state.wonder=Math.max(0,Math.min(100,state.wonder+v.wonder));
  }
  function pairKey(a,b){ return [a,b].sort().join('|'); }

  function chooseCandidate(){
    let id;
    if(state.floor<=tutorial.length) id=tutorial[state.floor-1];
    else {
      const unlocked=people.filter(p=>p.min<=state.floor);
      const recent=[...state.usedOnFloor].slice(-7);
      const options=unlocked.filter(p=>!recent.includes(p.id));
      const pool=options.length?options:unlocked;
      id=pool[Math.floor(Math.random()*pool.length)].id;
    }
    state.usedOnFloor.add(id);
    if(state.usedOnFloor.size>14){ const first=state.usedOnFloor.values().next().value; state.usedOnFloor.delete(first); }
    state.candidate=clonePerson(byId[id]);
    renderCandidate();
  }

  function renderCandidate(){
    const p=state.candidate;
    candidateEmoji.textContent=p.emoji;
    candidateName.textContent=p.name;
    candidateNote.textContent=p.note;
    floorNum.textContent=String(state.floor).padStart(3,'0');
    hallFloorLabel.textContent=`${state.floor}F`;
    const hue = state.floor<25 ? 48 : state.floor<50 ? 26 : state.floor<75 ? 206 : 274;
    hall.style.background=`linear-gradient(180deg,hsl(${hue} 18% 67%) 0,hsl(${hue} 13% 45%) 58%,#3f403b 59%,#242522 100%)`;
    candidate.classList.remove('entering');
    requestAnimationFrame(()=>candidate.classList.add('entering'));
  }

  function renderPassengers(){
    passengersEl.innerHTML='';
    passengersEl.classList.toggle('crowded',state.passengers.length>9);
    state.passengers.forEach(p=>{
      const el=document.createElement('div'); el.className='passenger'; el.title=p.name;
      el.innerHTML=`<span class="pemoji">${p.emoji}</span>${p.status?`<span class="status">${escapeHtml(p.status)}</span>`:''}`;
      passengersEl.appendChild(el);
    });
    capacityNow.textContent=state.passengers.length;
  }

  function escapeHtml(str){ return String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function updateUI(){
    renderPassengers();
    moodBar.style.width=`${state.mood}%`; dangerBar.style.width=`${state.danger}%`; wonderBar.style.width=`${state.wonder}%`;
    const found=getFoundEndings(); endingCount.textContent=`END ${found.length}/8`;
  }

  function showToast(html,ms=1500){
    eventToast.innerHTML=html; eventToast.classList.add('show');
    clearTimeout(showToast.t); showToast.t=setTimeout(()=>eventToast.classList.remove('show'),ms);
  }

  function resolvePair(newPassenger){
    const others=state.passengers.filter(p=>p.uid!==newPassenger.uid);
    for(const other of others){
      const key=pairKey(newPassenger.id,other.id);
      if(pairEvents[key] && !state.seenPairs.has(key)){
        state.seenPairs.add(key);
        const html=pairEvents[key](newPassenger,other);
        updateUI(); showToast(html,1900); return true;
      }
    }
    return false;
  }

  function ambientEvent(){
    if(state.floor%7!==0) return;
    if(has('zombie')&&!has('doctor')&&!has('nurse')){
      const victims=state.passengers.filter(p=>p.kind==='human'&&p.id!=='zombie');
      if(victims.length && Math.random()<0.42){
        const v=victims[Math.floor(Math.random()*victims.length)];
        v.id='zombie'; v.emoji='🧟'; v.name=`元${v.name}`; v.kind='danger'; v.status='感染';
        mod({danger:16,mood:-9}); showToast(`🧟 <strong>${escapeHtml(v.name)}</strong>が感染した。車内がざわつく。`,1700); updateUI(); return;
      }
    }
    if(has('musician')&&state.passengers.length>=4){ mod({mood:5}); showToast('🎸 誰かが手拍子を始めた。<strong>短い車内ライブ。</strong>',1200); updateUI(); return; }
    if(state.clinic&&state.danger>15){ mod({danger:-6,mood:3}); showToast('🩺 車内医院が全員を診察。<strong>少しだけ安心した。</strong>',1200); updateUI(); return; }
    if(state.device&&Math.random()<.55){ mod({wonder:5}); showToast('✨ 未知の装置が一度だけ光った。<strong>階数表示が0.3秒止まった。</strong>',1200); updateUI(); }
  }

  function decide(accept){
    if(state.locked||!state.started) return;
    state.locked=true; controls.classList.add('locked');
    const feedback=accept?rightFeedback:leftFeedback; feedback.classList.add('on');
    setTimeout(()=>feedback.classList.remove('on'),320);

    let pairHappened=false;
    if(accept){
      if(state.passengers.length>=MAX_CAPACITY){
        showToast('🚫 <strong>定員12名。</strong> もう乗れない。',1100);
        mod({mood:-2});
      } else {
        state.passengers.push(state.candidate);
        mod({mood:1,wonder:state.candidate.kind==='weird'?3:0,danger:state.candidate.kind==='danger'?6:0});
        renderPassengers();
        pairHappened=resolvePair(state.candidate);
      }
    } else {
      mod({mood:-.2});
    }
    updateUI();

    setTimeout(()=>{
      doorFrame.classList.add('closing');
      setTimeout(()=>{
        doorFrame.classList.remove('closing'); doorFrame.classList.add('closed');
        if(state.floor>=100){ setTimeout(showEnding,420); return; }
        state.floor += 1;
        ambientEvent();
        chooseCandidate();
        setTimeout(()=>{
          doorFrame.classList.remove('closed');
          setTimeout(()=>{state.locked=false; controls.classList.remove('locked');},430);
        },260);
      },430);
    }, pairHappened?760:170);
  }

  function getFoundEndings(){
    try{return JSON.parse(localStorage.getItem('lastElevatorEndings')||'[]');}catch{return [];}
  }
  function saveEnding(id){
    const found=getFoundEndings(); const isNew=!found.includes(id);
    if(isNew){ found.push(id); localStorage.setItem('lastElevatorEndings',JSON.stringify(found)); }
    return {isNew,found};
  }

  function showEnding(){
    state.locked=true; controls.classList.add('locked');
    const ending=endings.find(e=>e.test(state));
    const saved=saveEnding(ending.id);
    $('endingIcon').textContent=ending.icon;
    $('endingTitle').textContent=ending.title;
    $('endingText').textContent=ending.text;
    $('endingCast').innerHTML=state.passengers.map(p=>`<span title="${escapeHtml(p.name)}">${p.emoji}</span>`).join('') || '<span>🛗</span>';
    $('endingStats').innerHTML=`<span>♥ ${Math.round(state.mood)}</span><span>! ${Math.round(state.danger)}</span><span>✦ ${Math.round(state.wonder)}</span><span>${state.passengers.length}/12</span>`;
    const kicker=endingScreen.querySelector('.ending-kicker');
    kicker.textContent=saved.isNew?'100F / NEW ENDING':'100F / ENDING'; kicker.classList.toggle('new-ending',saved.isNew);
    endingCount.textContent=`END ${saved.found.length}/8`;
    endingScreen.hidden=false;
  }

  function openFloor(){
    doorFrame.classList.add('closed');
    chooseCandidate(); updateUI();
    setTimeout(()=>{doorFrame.classList.remove('closed'); state.locked=false; controls.classList.remove('locked');},240);
  }

  function start(){
    intro.style.display='none'; resetState(); openFloor();
  }
  function restart(){ resetState(); openFloor(); }

  let startX=0,startY=0,dragging=false;
  gameArea.addEventListener('pointerdown',e=>{ if(state.locked||!state.started)return; startX=e.clientX;startY=e.clientY;dragging=true; });
  gameArea.addEventListener('pointerup',e=>{
    if(!dragging)return; dragging=false;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(Math.abs(dx)>48 && Math.abs(dx)>Math.abs(dy)*1.15) decide(dx>0);
  });
  gameArea.addEventListener('pointercancel',()=>dragging=false);
  acceptBtn.addEventListener('click',()=>decide(true)); rejectBtn.addEventListener('click',()=>decide(false));
  startBtn.addEventListener('click',start); restartBtn.addEventListener('click',restart);
  window.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){e.preventDefault();decide(true);} if(e.key==='ArrowLeft'){e.preventDefault();decide(false);} });

  updateUI();
})();
