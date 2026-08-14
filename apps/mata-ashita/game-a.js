  'use strict';

  const $ = (s) => document.querySelector(s);
  const worldEl = $('#world');
  const viewport = $('#viewport');
  const playScreen = $('#playScreen');
  const dialogueLayer = $('#dialogue');
  const dialogueText = $('#dialogueText');
  const speakerEl = $('#speaker');
  const portraitEl = $('#portrait');
  const choicesEl = $('#choices');
  const talkBtn = $('#talkBtn');
  const hintEl = $('#hint');
  const objectiveText = $('#objectiveText');
  const objectiveCard = $('#objective');
  const battleLayer = $('#battle');

  const WORLD = { w: 1440, h: 1160 };
  const state = {
    started: false,
    player: { x: 405, y: 990, speed: 175, hp: 36, maxHp: 36, shock: 0 },
    camera: { x: 0, y: 0 },
    movement: { x: 0, y: 0 },
    dialogue: null,
    flags: new Set(),
    coins: 120,
    bag: [{name:'10円ガム', emoji:'🍬', note:'どうようを4へらす', count:1}],
    entities: [],
    nearby: null,
    battle: null,
    objective: 'milk',
    timeMinutes: 17 * 60 + 18,
    lastTime: performance.now(),
    companion: null,
    cleared: false,
  };

  const dialogues = {
    momIntro: [
      {speaker:'おかあさん', face:'👩', text:'誰だった？', choices:[
        {text:'友達。', set:'answeredFriend'},
        {text:'間違い電話。', set:'answeredWrong'},
        {text:'わかんない。', set:'answeredUnknown'},
      ]},
      {speaker:'おかあさん', face:'👩', text:'ふうん。\n牛乳なくなったから、帰りに買ってきて。'},
      {speaker:'', face:'🥛', text:'牛乳を買いに行くことになった。', onEnd: () => { setObjective('milk'); flashHint('画面下をドラッグすると歩ける'); }},
    ],
    mom: [
      {speaker:'おかあさん', face:'👩', text:'牛乳ね。\nアイスじゃないよ。牛乳。'},
      {speaker:'おかあさん', face:'👩', text:'……まあ、アイスも買っていいけど。'},
    ],
    phone: [
      {speaker:'でんわ', face:'☎️', text:'ツー……ツー……'},
      {speaker:'', face:'☎️', text:'かけ直しても、つながらない。'},
    ],
    dog: [
      {speaker:'犬', face:'🐕', text:'ぼく犬ですけど。'},
      {speaker:'犬', face:'🐕', text:'今日は犬じゃない気がします。'},
      {speaker:'犬', face:'🐕', text:'そういう日、ありません？'},
    ],
    oldMan: [
      {speaker:'植木に水をやる人', face:'👴', text:'夕方はいいねえ。\nまだ今日なのに、ちょっと昨日みたいで。'},
    ],
    kid: [
      {speaker:'知らない子', face:'🧒', text:'学校、明日からだって。'},
      {speaker:'知らない子', face:'🧒', text:'明日って、どっち？'},
    ],
    vending: [
      {speaker:'自動販売機', face:'🥤', text:'つめたい　つめたい　つめたい'},
      {speaker:'', face:'🥤', text:'「あした」というボタンだけ売り切れている。'},
    ],
    river: [
      {speaker:'', face:'🌊', text:'川はちゃんと流れている。'},
      {speaker:'', face:'🌊', text:'なんだか安心した。'},
    ],
    minatoFirst: [
      {speaker:'ミナト', face:'🧢', text:'おい。\nおまえも電話きた？'},
      {speaker:'ミナト', face:'🧢', text:'「明日、学校に来るな」って。'},
      {speaker:'ミナト', face:'🧢', text:'……変だよな。\nでも先に牛乳買うんだろ？'},
      {speaker:'ミナト', face:'🧢', text:'ついてく。\n暇だから。', onEnd: () => { state.flags.add('minatoJoined'); state.companion = {x: state.player.x - 34, y: state.player.y + 32}; ensureCompanion(); setObjective(state.flags.has('milkBought') ? 'arcade' : 'store'); flashHint('ミナトがついてきた'); }},
    ],
    minatoRepeat: [
      {speaker:'ミナト', face:'🧢', text:'牛乳買ったら、商店街の入口な。\n電話のこと、気になる。'},
    ],
    clerkBefore: [
      {speaker:'コンビニの人', face:'🧑‍💼', text:'いらっしゃいませ。'},
      {speaker:'コンビニの人', face:'🧑‍💼', text:'牛乳？\nあります。昨日の棚に。'},
      {speaker:'コンビニの人', face:'🧑‍💼', text:'……昨日の棚？'},
      {speaker:'コンビニの人', face:'🧑‍💼', text:'まあ、あります。120円。', choices:[
        {text:'買う', action: buyMilk},
        {text:'やめとく', action: () => {}},
      ]},
    ],
    clerkAfter: [
      {speaker:'コンビニの人', face:'🧑‍💼', text:'ありがとうございました。'},
      {speaker:'コンビニの人', face:'🧑‍💼', text:'また明日。'},
      {speaker:'コンビニの人', face:'🧑‍💼', text:'……たぶん。'},
    ],
    arcadeGate: [
      {speaker:'ミナト', face:'🧢', text:'ここから先、商店街。'},
      {speaker:'ミナト', face:'🧢', text:'さっきまで「閉店」の看板だったのに。'},
      {speaker:'ミナト', face:'🧢', text:'今、「ずっと営業中」になってる。'},
      {speaker:'', face:'🌇', text:'いつもの町の先が、少しだけ知らない場所に見えた。', onEnd: areaClear},
    ],
    pigeonAfter: [
      {speaker:'ミナト', face:'🧢', text:'……鳩とケンカしたの、初めて見た。'},
      {speaker:'ミナト', face:'🧢', text:'しかも負けそうだった。'},
    ],
    bench: [
      {speaker:'', face:'🪑', text:'座るには、まだ帰るのが惜しい時間だ。'},
    ],
    cat: [
      {speaker:'猫', face:'🐈', text:'……。'},
      {speaker:'猫', face:'🐈', text:'……？'},
      {speaker:'猫', face:'🐈', text:'そんなに？'},
    ],
  };

  function buyMilk() {
    if (state.flags.has('milkBought')) return;
    if (state.coins < 120) return;
    state.coins -= 120;
    state.flags.add('milkBought');
    state.bag.push({name:'牛乳', emoji:'🥛', note:'おかあさんに頼まれた', count:1});
    updateCoins();
    setObjective(state.flags.has('minatoJoined') ? 'arcade' : 'minato');
    flashHint(state.flags.has('minatoJoined') ? '牛乳を買った。商店街の入口へ' : '牛乳を買った。ミナトを探そう');
  }

  function areaClear() {
    state.cleared = true;
    $('#ending').classList.remove('hidden');
    state.movement.x = state.movement.y = 0;
  }

  function setObjective(key) {
    state.objective = key;
    const labels = {
      milk:'牛乳を買いに行く',
      store:'コンビニを探す',
      minato:'ミナトを探す',
      arcade:'商店街の入口へ行く',
    };
    objectiveText.textContent = labels[key] || key;
    objectiveCard.classList.remove('pulse');
    void objectiveCard.offsetWidth;
    objectiveCard.classList.add('pulse');
  }

  function updateCoins(){ $('#coinCount').textContent = state.coins; }

  function createBuilding(x,y,w,h,kind,label) {
    const el = document.createElement('div');
    el.className = `building ${kind}`;
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    el.innerHTML = `<div class="roof"></div>${label?`<div class="sign">${label}</div>`:''}<div class="door"></div><div class="window" style="left:18px;top:48px"></div>`;
    worldEl.appendChild(el);
    return el;
  }

  function deco(cls,x,y,w,h,extra='') {
    const el=document.createElement('div');
    el.className=cls;
    el.style.cssText=`left:${x}px;top:${y}px;${w?`width:${w}px;`:''}${h?`height:${h}px;`:''}${extra}`;
    worldEl.appendChild(el); return el;
  }

  function createEntity(cfg) {
    const el = document.createElement('div');
    el.className = `entity ${cfg.kind || 'person'} ${cfg.className || ''}`;
    el.style.left = `${cfg.x}px`; el.style.top = `${cfg.y}px`;
    el.dataset.id = cfg.id;
    if (cfg.kind === 'animal' || cfg.kind === 'object-entity') {
      el.innerHTML = `<div class="shadow"></div>${cfg.emoji || '❓'}${cfg.label?`<div class="npc-label">${cfg.label}</div>`:''}`;
    } else {
      el.innerHTML = `<div class="shadow"></div><div class="head"></div><div class="hair"></div><div class="body"></div><div class="legs"></div>${cfg.label?`<div class="npc-label">${cfg.label}</div>`:''}`;
      if (cfg.shirt) el.style.setProperty('--shirt', cfg.shirt);
      if (cfg.hair) el.style.setProperty('--hair', cfg.hair);
    }
    worldEl.appendChild(el);
    const entity = {...cfg, el};
    state.entities.push(entity);
    el.addEventListener('pointerdown', e => { e.stopPropagation(); if (distance(state.player, entity) < 115) interact(entity); else flashHint('もう少し近づこう'); });
    return entity;
  }

  function buildWorld() {
    worldEl.innerHTML=''; state.entities=[];
    deco('grass',20,20,1380,1120);
    deco('road h',0,720,1440,124);
    deco('road v',630,0,128,1160);
    deco('sidewalk',0,685,1440,32);
    deco('sidewalk',0,848,1440,30);
    deco('sidewalk',592,0,32,1160);
    deco('sidewalk',764,0,32,1160);
    deco('river',1010,0,210,650);
    deco('sidewalk',980,318,270,92,'border:5px solid #6b5b50;background:#c2ab86;z-index:3');
    createBuilding(95,880,250,160,'home','じぶんの家');
    createBuilding(820,880,250,170,'store','サンデーマート');
    createBuilding(80,360,280,180,'shop','くすり・日用品');
    createBuilding(395,105,300,210,'school','あさひ小学校');
    createBuilding(820,150,170,170,'shop','駄菓子 こばやし');
    createBuilding(1170,500,225,180,'arcade','ひばり商店街 →');
    deco('grass',1040,610,330,150,'background-color:#7e9e6c');
    for (const [x,y] of [[110,120],[240,230],[410,580],[950,520],[1280,160],[1120,690],[1350,590],[520,920]]) deco('tree-obj',x,y);
    for (const [x,y] of [[570,650],[790,650],[570,900],[790,900],[1080,610]]) deco('lamp',x,y);
    createEntity({id:'bench',kind:'object-entity',emoji:'🪑',label:'ベンチ',x:1180,y:670,dialogue:'bench'});
    createEntity({id:'vending',kind:'object-entity',emoji:'🥤',label:'自販機',x:770,y:615,dialogue:'vending'});
    createEntity({id:'river',kind:'object-entity',emoji:'🌊',label:'川',x:1100,y:350,dialogue:'river'});
    createEntity({id:'phone',kind:'object-entity',emoji:'☎️',label:'電話',x:355,y:1015,dialogue:'phone'});
    createEntity({id:'mom',x:455,y:1000,label:'おかあさん',dialogue:'mom',shirt:'#a06a72'});
    createEntity({id:'dog',kind:'animal',emoji:'🐕',x:430,y:885,label:'犬',dialogue:'dog'});
    createEntity({id:'oldman',x:230,y:610,label:'水やりの人',dialogue:'oldMan',shirt:'#6d8165',hair:'#bbb4aa'});
    createEntity({id:'kid',x:530,y:700,label:'知らない子',dialogue:'kid',shirt:'#d89e4c'});
    createEntity({id:'cat',kind:'animal',emoji:'🐈',x:940,y:430,label:'猫',dialogue:'cat'});
    createEntity({id:'minato',x:570,y:790,label:'ミナト',dialogue: () => state.flags.has('minatoJoined') ? 'minatoRepeat' : 'minatoFirst',shirt:'#526e91',className:'friend'});
    createEntity({id:'clerk',x:945,y:860,label:'店員',dialogue: () => state.flags.has('milkBought') ? 'clerkAfter' : 'clerkBefore',shirt:'#5e8267'});
    createEntity({id:'pigeon',kind:'animal',emoji:'🐦',x:790,y:760,label:'せかせか鳩',battle:'pigeon'});
    createEntity({id:'arcadeGate',kind:'object-entity',emoji:'🏮',x:1120,y:720,label:'商店街',dialogue:'arcadeGate',requires:['milkBought','minatoJoined']});
    const p = document.createElement('div');
    p.id='player'; p.className='entity person player';
    p.innerHTML='<div class="shadow"></div><div class="cap"></div><div class="head"></div><div class="hair"></div><div class="body"></div><div class="legs"></div>';
    worldEl.appendChild(p); state.player.el=p;
    updatePlayerEl();
  }

  function ensureCompanion() {
    let el = $('#companion');
    if (!state.companion) { if(el) el.remove(); return; }
    if (!el) {
      el=document.createElement('div'); el.id='companion'; el.className='entity person friend';
      el.innerHTML='<div class="shadow"></div><div class="head"></div><div class="hair"></div><div class="body"></div><div class="legs"></div>';
      worldEl.appendChild(el);
    }
    el.style.left=`${state.companion.x}px`;el.style.top=`${state.companion.y}px`;
  }

  function updatePlayerEl(){
    if(!state.player.el) return;
    state.player.el.style.left=`${state.player.x}px`; state.player.el.style.top=`${state.player.y}px`;
  }

  function distance(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }

  function interact(entity) {
    if (state.dialogue || state.battle || state.cleared) return;
    if (entity.requires) {
      const reqs = Array.isArray(entity.requires) ? entity.requires : [entity.requires];
      const missing = reqs.find(r => !state.flags.has(r));
      if (missing) {
        const text = missing === 'milkBought' ? '商店街へ行く前に、牛乳を買っておこう。' : '電話のことを聞くため、ミナトを探そう。';
        startDialogue([{speaker:'',face:'🏮',text}]); return;
      }
    }
    if (entity.battle && !state.flags.has(`${entity.battle}Defeated`)) { startBattle(entity.battle); return; }
    const key = typeof entity.dialogue === 'function' ? entity.dialogue() : entity.dialogue;
    if(key && dialogues[key]) startDialogue(dialogues[key]);
  }

  function startDialogue(lines) {
    state.movement.x=state.movement.y=0;
    state.dialogue={lines,index:0,choiceLocked:false};
    dialogueLayer.classList.remove('hidden');
    renderDialogue();
  }

  function renderDialogue() {
    if(!state.dialogue) return;
    const line=state.dialogue.lines[state.dialogue.index];
    if(!line){ endDialogue(); return; }
    speakerEl.textContent=line.speaker || '';
    portraitEl.textContent=line.face || '…';
    dialogueText.textContent=line.text;
    choicesEl.innerHTML='';
    choicesEl.classList.toggle('hidden', !line.choices);
    $('.next-mark').classList.toggle('hidden', !!line.choices);
    if(line.choices){
      line.choices.forEach(choice=>{
        const b=document.createElement('button'); b.textContent=choice.text;
        b.addEventListener('click',e=>{e.stopPropagation(); if(choice.set) state.flags.add(choice.set); if(choice.action) choice.action(); state.dialogue.index++; renderDialogue();});
        choicesEl.appendChild(b);
      });
    }
  }

  function nextDialogue(){
    if(!state.dialogue) return;
    const line=state.dialogue.lines[state.dialogue.index];
    if(line?.choices) return;
    if(line?.onEnd) line.onEnd();
    state.dialogue.index++;
    renderDialogue();
  }

  function endDialogue(){ dialogueLayer.classList.add('hidden'); state.dialogue=null; }
  dialogueLayer.addEventListener('click',nextDialogue);

