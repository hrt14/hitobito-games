(() => {
  'use strict';

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const STORAGE_KEY = 'hitobito_one_tsubo_v1';
  const TOTAL_TURNS = 24;

  const ITEMS = [
    {id:'grass',name:'草原',hint:'何もない場所に、まず緑が広がる。',n:3,p:0,m:0,phase:1},
    {id:'tree',name:'大きな木',hint:'木陰と実りが、生き物を呼ぶ。',n:4,p:0,m:1,phase:1},
    {id:'pond',name:'小さな池',hint:'水があるだけで、世界の流れが変わる。',n:3,p:0,m:2,phase:1},
    {id:'flowers',name:'花畑',hint:'見た目は小さくても、人と虫を集める。',n:2,p:1,m:1,phase:1},
    {id:'rock',name:'巨石',hint:'邪魔か、ランドマークか。残すほど意味が出る。',n:1,p:0,m:3,phase:1},
    {id:'well',name:'井戸',hint:'暮らしの中心になりやすい古い設備。',n:1,p:2,m:2,phase:1},
    {id:'bamboo',name:'竹林',hint:'狭い土地を一気に緑で満たす。',n:4,p:0,m:1,phase:1},

    {id:'hut',name:'小屋',hint:'人が住み始めると、土地は村になっていく。',n:1,p:3,m:0,phase:2},
    {id:'field',name:'畑',hint:'食べ物ができると、暮らしが続く。',n:2,p:3,m:0,phase:2},
    {id:'road',name:'道',hint:'何も生まないようで、商いを強くする。',n:0,p:4,m:0,phase:2},
    {id:'shrine',name:'祠',hint:'小さな祠が、土地の物語を濃くする。',n:1,p:1,m:4,phase:2},
    {id:'cat',name:'猫',hint:'役には立たない。でも国の性格は変わる。',n:1,p:2,m:2,phase:2},
    {id:'bird',name:'鳥',hint:'水と木がある国では、よく居つく。',n:3,p:0,m:1,phase:2},
    {id:'fire',name:'焚き火',hint:'人が集まり、夜の時間が生まれる。',n:0,p:2,m:3,phase:2},
    {id:'grave',name:'古い墓',hint:'壊すのは簡単。残すと夜が少し変わる。',n:0,p:0,m:5,phase:2},

    {id:'shop',name:'商店',hint:'道や猫と組み合わさると、妙に強い。',n:0,p:5,m:0,phase:3},
    {id:'workshop',name:'工房',hint:'ものを作る場所が、町の密度を上げる。',n:0,p:4,m:1,phase:3},
    {id:'inn',name:'宿屋',hint:'旅人が泊まると、小さな国に外から人が来る。',n:0,p:4,m:1,phase:3},
    {id:'tower',name:'見張り塔',hint:'狭い土地ほど、高さは大きな武器になる。',n:0,p:3,m:2,phase:3},
    {id:'garden',name:'庭園',hint:'自然を残したまま、人の手を入れる。',n:3,p:2,m:1,phase:3},
    {id:'gate',name:'大門',hint:'入口を作ると、ただの集落が「国」っぽくなる。',n:0,p:3,m:3,phase:3},
    {id:'fox',name:'狐',hint:'祠と竹林の近くでは、ただの狐ではなくなる。',n:2,p:0,m:4,phase:3},
    {id:'statue',name:'石像',hint:'誰の像か分からない方が、物語は増える。',n:0,p:1,m:4,phase:3},
    {id:'bridge',name:'小橋',hint:'池や道をつなぐと、景色まで一段よくなる。',n:1,p:3,m:1,phase:3},

    {id:'market',name:'市場',hint:'人と道が集まった国を、一気に賑やかにする。',n:0,p:6,m:0,phase:4},
    {id:'castle',name:'小さな城',hint:'たった一坪でも、城を置けば王国になる。',n:0,p:6,m:3,phase:4},
    {id:'temple',name:'神殿',hint:'祠より大きく、土地の信仰を形にする。',n:0,p:2,m:6,phase:4},
    {id:'library',name:'書庫',hint:'物語を残す国は、最後に少し変わった名がつく。',n:0,p:4,m:4,phase:4},
    {id:'bath',name:'湯屋',hint:'宿と庭があれば、国全体が観光地になる。',n:2,p:5,m:1,phase:4},
    {id:'windmill',name:'風車',hint:'畑と小屋が残っていると、美しい農村になる。',n:2,p:4,m:1,phase:4},
    {id:'lantern',name:'灯籠',hint:'夜の国に、目印と不思議な明かりを足す。',n:0,p:1,m:4,phase:4},
    {id:'clock',name:'時計塔',hint:'土地は小さいまま、時間だけが積み上がる。',n:0,p:5,m:3,phase:4}
  ];
  const byId = Object.fromEntries(ITEMS.map(x => [x.id, x]));

  const COMBOS = [
    {id:'cat-shop',req:['cat','shop'],name:'猫商い',icon:'🐾',n:0,p:3,m:1},
    {id:'cat-inn',req:['cat','inn'],name:'猫宿',icon:'🐈',n:0,p:2,m:2},
    {id:'water-grove',req:['pond','tree','bird'],name:'水鳥の森',icon:'🪽',n:4,p:0,m:2},
    {id:'village',req:['hut','field'],name:'自給の村',icon:'🌾',n:2,p:3,m:0},
    {id:'farmwind',req:['hut','field','windmill'],name:'麦風の里',icon:'〰',n:3,p:4,m:1},
    {id:'ghost-shrine',req:['shrine','grave'],name:'常夜の祠',icon:'✦',n:0,p:0,m:5},
    {id:'fox-shrine',req:['shrine','fox','bamboo'],name:'狐ノ宮',icon:'◇',n:2,p:0,m:6},
    {id:'market-road',req:['road','shop','market'],name:'一坪商店街',icon:'旗',n:0,p:6,m:0},
    {id:'fortress',req:['gate','tower','castle'],name:'城塞',icon:'♜',n:0,p:6,m:3},
    {id:'spa',req:['bath','inn','garden'],name:'湯けむり街',icon:'♨',n:2,p:6,m:2},
    {id:'academy',req:['library','temple','statue'],name:'石書の学都',icon:'▤',n:0,p:4,m:6},
    {id:'bridge-pond',req:['bridge','pond'],name:'水辺の橋',icon:'⌒',n:2,p:2,m:1},
    {id:'fire-inn',req:['fire','inn'],name:'夜市の宿',icon:'✺',n:0,p:3,m:3}
  ];

  const ENDINGS = [
    {id:'cat',test:s=>hasAll(s,['cat','shop','inn']),title:'猫宿王国',desc:'商店の棚にも、宿の玄関にも猫。人間はたぶん居候です。',tags:['猫が主役','商い','宿場']},
    {id:'fox',test:s=>hasAll(s,['shrine','fox','bamboo']),title:'狐ノ宮',desc:'竹の音と祠の灯りだけが残る、小さくて古い王国になりました。',tags:['竹林','祠','狐']},
    {id:'ghost',test:s=>hasAll(s,['shrine','grave']) && stats(s).mystery>=18,title:'常夜王国',desc:'昼でも少し薄暗い。誰も壊さなかったものが、国の中心になりました。',tags:['怪異','記憶','夜']},
    {id:'spa',test:s=>hasAll(s,['bath','inn','garden']),title:'一坪温泉郷',desc:'庭を眺め、湯に入り、泊まる。面積だけがどう考えても足りません。',tags:['湯けむり','庭園','宿']},
    {id:'fort',test:s=>hasAll(s,['gate','tower','castle']),title:'一坪城塞国',desc:'門、塔、城。土地のほぼ全部を防御に使った、とても小さくて強情な国です。',tags:['城','門','防衛']},
    {id:'academy',test:s=>hasAll(s,['library','temple','statue']),title:'石書王国',desc:'石像を眺め、古い本を読み、誰かが意味を考え続ける国になりました。',tags:['書物','信仰','石像']},
    {id:'nature',test:s=>stats(s).nature>=22 && stats(s).nature>stats(s).people+4,title:'深緑王国',desc:'建物より木陰。効率より水辺。一坪の中に森を残した王国です。',tags:['自然','水辺','生き物']},
    {id:'city',test:s=>stats(s).people>=24 && stats(s).people>stats(s).nature+5,title:'一坪大都会',desc:'狭いからこそ、上へ、奥へ、人が集まる。九つの区画が全部にぎやかです。',tags:['都市','市場','高密度']},
    {id:'mystery',test:s=>stats(s).mystery>=22,title:'黄昏王国',desc:'役に立つかより、残しておきたいか。そんな選択だけでできた不思議な国です。',tags:['不思議','遺物','物語']},
    {id:'balanced',test:s=>true,title:'雑居王国',desc:'森も店も祠も同居する。計画通りではないのに、妙にここでしか見られない国です。',tags:['ごちゃまぜ','共存','一坪']}
  ];

  let state = load() || freshState();
  let lastSnapshot = null;
  let toastTimer = null;
  let audioCtx = null;

  function freshState(seed = Math.floor(Math.random()*1e9)) {
    return {
      seed,
      rngIndex:0,
      turn:1,
      board:Array(9).fill(null),
      candidate:'tree',
      skips:0,
      placed:0,
      seenCombos:[],
      justPlaced:null,
      finished:false,
      sound:true
    };
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(_e){}
  }
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      const s = JSON.parse(raw);
      if(!s || !Array.isArray(s.board) || s.board.length!==9) return null;
      return s;
    }catch(_e){ return null; }
  }
  function cloneState(){ return JSON.parse(JSON.stringify(state)); }

  function rand(){
    let x = (state.seed + (state.rngIndex++ * 0x6D2B79F5)) >>> 0;
    x = Math.imul(x ^ x >>> 15, x | 1);
    x ^= x + Math.imul(x ^ x >>> 7, x | 61);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  }

  function phaseForTurn(turn){ return turn<=6?1:turn<=12?2:turn<=18?3:4; }
  function phaseLabel(p){ return ['','芽吹き','集落','町','王国'][p]; }

  function nextCandidate(){
    const phase = phaseForTurn(state.turn);
    const idsOnBoard = new Set(state.board.filter(Boolean));
    let pool = ITEMS.filter(i => i.phase <= phase);
    pool = pool.flatMap(i => Array(i.phase===phase ? 3 : 1).fill(i));
    let chosen = pool[Math.floor(rand()*pool.length)];
    for(let tries=0; tries<6 && idsOnBoard.has(chosen.id); tries++){
      chosen = pool[Math.floor(rand()*pool.length)];
    }
    return chosen.id;
  }

  function stats(s=state){
    let nature=0, people=0, mystery=0;
    for(const id of s.board){
      if(!id) continue;
      const it = byId[id]; if(!it) continue;
      nature += it.n; people += it.p; mystery += it.m;
    }
    for(const c of activeCombos(s)){ nature+=c.n; people+=c.p; mystery+=c.m; }
    return {nature,people,mystery};
  }
  function activeCombos(s=state){
    const ids = new Set(s.board.filter(Boolean));
    return COMBOS.filter(c => c.req.every(id => ids.has(id)));
  }
  function hasAll(s, ids){ const set = new Set(s.board.filter(Boolean)); return ids.every(id=>set.has(id)); }
  function emptyCount(){ return state.board.filter(x=>!x).length; }

  function currentKingdomName(){
    const c = activeCombos();
    const special = [
      ['fox-shrine','狐ノ宮'],['spa','湯けむり街'],['fortress','小城塞'],['academy','石書の学都'],
      ['cat-shop','猫商いの町'],['ghost-shrine','常夜の集落'],['farmwind','麦風の里'],['water-grove','水鳥の森']
    ];
    for(const [id,name] of special){ if(c.some(x=>x.id===id)) return name; }
    const st = stats();
    if(state.placed===0) return '名もない一坪';
    if(state.turn<=6) return st.nature>=st.people ? '芽吹きの領地' : '小さな居場所';
    if(st.mystery>st.people+4 && st.mystery>st.nature+3) return '薄明の国';
    if(st.nature>st.people+5) return '緑の国';
    if(st.people>st.nature+6) return 'ぎゅうぎゅう国';
    if(state.turn<=12) return '一坪集落';
    if(state.turn<=18) return '一坪の町';
    return '一坪王国';
  }

  function ending(){ return ENDINGS.find(e=>e.test(state)) || ENDINGS[ENDINGS.length-1]; }

  function render(){
    if(!byId[state.candidate]) state.candidate='tree';
    const phase = phaseForTurn(Math.min(state.turn,TOTAL_TURNS));
    const st = stats();
    const combos = activeCombos();
    const mystic = st.mystery > st.nature+5 && st.mystery > st.people+3;
    app.className = `app phase-${phase}${mystic?' mystic':''}`;

    const full = emptyCount()===0;
    const cand = byId[state.candidate];
    const comboHtml = combos.length
      ? combos.map(c=>`<span class="combo-pill ${state.seenCombos.includes(c.id)?'':'new'}"><b>${escapeHtml(c.icon)}</b>${escapeHtml(c.name)}</span>`).join('')
      : `<span class="combo-pill">組み合わせで国の名前が変わる</span>`;

    app.innerHTML = `
      <div class="sky-decor" aria-hidden="true"><div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="hills"></div></div>
      <div class="shell">
        <header class="topbar">
          <div class="brand"><span class="mark"></span> hitobito / games</div>
          <div class="top-actions">
            <button class="icon-btn" id="soundBtn" aria-label="音 ${state.sound?'オン':'オフ'}">${soundIcon(state.sound)}</button>
            <button class="icon-btn" id="undoBtn" aria-label="ひとつ戻す" ${lastSnapshot?'':'disabled'}>${undoIcon()}</button>
            <button class="icon-btn" id="resetBtn" aria-label="最初から">${resetIcon()}</button>
          </div>
        </header>

        <section class="title-row">
          <div class="kingdom-block"><div class="kicker">PHASE ${phase} / ${phaseLabel(phase)}</div><h1 class="kingdom-name">${escapeHtml(currentKingdomName())}</h1></div>
          <div class="turn"><strong>${Math.min(state.turn,TOTAL_TURNS)}</strong>/ ${TOTAL_TURNS}</div>
        </section>

        <section class="stats" aria-label="王国の性格">
          ${statCard('nature','緑','🌿',st.nature)}
          ${statCard('people','賑','🏠',st.people)}
          ${statCard('mystery','謎','✦',st.mystery)}
        </section>

        <section class="world-wrap">
          <div class="world-shadow"></div>
          <div class="world" aria-label="一坪の土地">
            <div class="grid">${state.board.map((id,i)=>tileHtml(id,i,full)).join('')}</div>
            <div class="life-layer" aria-hidden="true">${lifeHtml(st)}</div>
          </div>
        </section>

        <div class="combo-strip">${comboHtml}</div>

        <section class="visitor" aria-label="次に訪れたもの">
          <div class="visitor-head">
            <div class="preview"><div class="sprite">${sprite(cand.id)}</div></div>
            <div class="visitor-copy"><div class="visitor-label">NEXT VISITOR</div><h2>${escapeHtml(cand.name)}</h2><p>${escapeHtml(cand.hint)}</p></div>
            <div class="impact">${impactHtml(cand)}</div>
          </div>
          <div class="visitor-actions">
            <button class="action skip" id="skipBtn">見送る</button>
            <button class="action place" id="placeHintBtn" disabled>${full?'入れ替える場所をタップ':'空いている場所をタップ'}<span class="place-note">${full?'残すものを選ぶゲームです':'＋ が光っている場所へ'}</span></button>
          </div>
        </section>
        <div class="hint"><span class="dot"></span>${full?'土地は満員。どれか1つを新しいものと入れ替える。':'光っている空き地をタップすると置けます。'}</div>
      </div>
      <div class="flash" id="flash"></div>
      <div class="phase-banner" id="phaseBanner"><div class="phase-card"><small>THE LAND CHANGED</small><strong></strong></div></div>
    `;

    bindEvents();
    requestAnimationFrame(()=>{
      document.querySelectorAll('.meter i').forEach(el => { el.style.width = `${Math.min(100,Number(el.dataset.value)*3.15)}%`; });
    });

    if(state.finished) showResult();
  }

  function tileHtml(id,i,full){
    const empty = !id;
    const cls = ['tile',empty?'empty':'filled',empty?'target':'',full&&!empty?'replace-target':'',state.justPlaced===i?'just-placed':''].filter(Boolean).join(' ');
    return `<button class="${cls}" data-index="${i}" aria-label="${empty?'空き地':escapeAttr(byId[id]?.name||id)}">${id?`<div class="item"><div class="sprite" style="--delay:${(i%4)*-.47}s">${sprite(id)}</div><span class="item-name">${escapeHtml(byId[id].name)}</span></div>`:''}</button>`;
  }

  function statCard(cls,label,icon,value){ return `<div class="stat ${cls}"><div class="stat-top"><span>${icon} ${label}</span><strong>${value}</strong></div><div class="meter"><i data-value="${value}"></i></div></div>`; }
  function impactHtml(it){
    return [it.n?`<span class="n">🌿 +${it.n}</span>`:'',it.p?`<span class="p">🏠 +${it.p}</span>`:'',it.m?`<span class="m">✦ +${it.m}</span>`:''].filter(Boolean).join('');
  }

  function lifeHtml(st){
    let out='';
    const people = Math.min(8,Math.floor(st.people/5));
    for(let i=0;i<people;i++){
      const left=10+((i*31)%78), top=12+((i*23)%72), speed=6+(i%4)*1.7;
      out += `<i class="person" style="left:${left}%;top:${top}%;--speed:${speed}s"></i>`;
    }
    const birds = Math.min(3,Math.floor(st.nature/9));
    for(let i=0;i<birds;i++) out += `<i class="bird-fly" style="top:${18+i*12}%;animation-delay:${-i*3.1}s;animation-duration:${8+i*2}s"></i>`;
    return out;
  }

  function bindEvents(){
    document.querySelectorAll('.tile').forEach(btn=>btn.addEventListener('click',()=>placeAt(Number(btn.dataset.index))));
    document.getElementById('skipBtn')?.addEventListener('click',skip);
    document.getElementById('resetBtn')?.addEventListener('click',restart);
    document.getElementById('undoBtn')?.addEventListener('click',undo);
    document.getElementById('soundBtn')?.addEventListener('click',toggleSound);
  }

  function placeAt(index){
    if(state.finished) return;
    const full = emptyCount()===0;
    if(!full && state.board[index]){
      toast(`${byId[state.board[index]].name}は残っています。空き地へ置こう。`);
      tapSound('soft'); return;
    }
    lastSnapshot = cloneState();
    const old = state.board[index];
    const beforePhase = phaseForTurn(state.turn);
    const beforeCombos = activeCombos().map(c=>c.id);
    state.board[index] = state.candidate;
    state.placed++;
    state.justPlaced=index;
    tapSound('place'); haptic(18);
    advanceTurn(beforePhase, beforeCombos, old);
  }

  function skip(){
    if(state.finished) return;
    lastSnapshot = cloneState();
    state.skips++;
    const beforePhase = phaseForTurn(state.turn);
    const beforeCombos = activeCombos().map(c=>c.id);
    tapSound('soft');
    advanceTurn(beforePhase,beforeCombos,null,true);
  }

  function advanceTurn(beforePhase,beforeCombos,old,skipped=false){
    if(state.turn >= TOTAL_TURNS){
      state.turn = TOTAL_TURNS;
      state.finished = true;
      save(); render();
      setTimeout(()=>showResult(),180);
      return;
    }
    state.turn++;
    const afterPhase = phaseForTurn(state.turn);
    state.candidate = nextCandidate();
    const afterCombos = activeCombos();
    const newCombo = afterCombos.find(c=>!beforeCombos.includes(c.id));
    if(newCombo && !state.seenCombos.includes(newCombo.id)){
      state.seenCombos.push(newCombo.id);
      setTimeout(()=>{toast(`組み合わせ発見：${newCombo.name}`); comboSound(); flash();},80);
    }else if(old){
      setTimeout(()=>toast(`${byId[old].name} → ${byId[lastSnapshot.candidate].name}`),50);
    }else if(skipped){
      setTimeout(()=>toast('見送った。土地はそのまま。'),40);
    }
    save(); render();
    if(afterPhase!==beforePhase) setTimeout(()=>phaseBanner(afterPhase),120);
  }

  function undo(){
    if(!lastSnapshot) return;
    const keepSound = state.sound;
    state = lastSnapshot;
    state.sound = keepSound;
    lastSnapshot = null;
    state.finished=false;
    tapSound('undo'); haptic(10); save(); render(); toast('ひとつ前に戻した。');
  }
  function restart(){
    const ok = state.placed===0 || confirm('この一坪を更地に戻しますか？');
    if(!ok) return;
    const sound=state.sound;
    state=freshState(); state.sound=sound; lastSnapshot=null; save(); render(); toast('新しい一坪を始めた。');
  }
  function toggleSound(){ state.sound=!state.sound; save(); render(); if(state.sound) tapSound('place'); }

  function showResult(){
    if(document.querySelector('.result-overlay')) return;
    const e=ending(), st=stats(), combos=activeCombos();
    const overlay=document.createElement('div');
    overlay.className='result-overlay';
    overlay.innerHTML=`<article class="result-card" role="dialog" aria-modal="true" aria-label="王国完成">
      <div class="result-art"><div class="mini-world">${state.board.map(id=>`<div class="mini-item">${id?sprite(id):''}</div>`).join('')}</div></div>
      <div class="result-kicker">YOUR ONE-TSUBO KINGDOM</div>
      <h2>${escapeHtml(e.title)}</h2>
      <p>${escapeHtml(e.desc)}</p>
      <div class="result-tags">${e.tags.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}${combos.slice(0,2).map(c=>`<span>${escapeHtml(c.name)}</span>`).join('')}</div>
      <div class="result-stats"><div><strong>${st.nature}</strong><small>🌿 緑</small></div><div><strong>${st.people}</strong><small>🏠 賑</small></div><div><strong>${st.mystery}</strong><small>✦ 謎</small></div></div>
      <div class="result-actions"><button class="secondary" id="resultRestart">もう一度</button><button class="primary" id="shareBtn">王国を共有</button></div>
    </article>`;
    document.body.appendChild(overlay);
    comboSound(); haptic([35,35,55]);
    document.getElementById('resultRestart').addEventListener('click',()=>{overlay.remove();const sound=state.sound;state=freshState();state.sound=sound;lastSnapshot=null;save();render();});
    document.getElementById('shareBtn').addEventListener('click',()=>shareResult(e,st));
  }

  async function shareResult(e,st){
    const text=`一坪だけの土地から「${e.title}」ができた。\n🌿${st.nature} 🏠${st.people} ✦${st.mystery}\n#一坪王国`;
    try{
      if(navigator.share){ await navigator.share({title:'一坪王国',text,url:location.href}); }
      else { await navigator.clipboard.writeText(`${text}\n${location.href}`); toast('結果をコピーした。'); }
    }catch(_e){}
  }

  function phaseBanner(p){
    const el=document.getElementById('phaseBanner'); if(!el)return;
    el.querySelector('strong').textContent = p===2?'人が住み始めた':p===3?'町の気配がする':'王国になってきた';
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); comboSound(); haptic(30);
  }
  function flash(){const el=document.getElementById('flash');if(!el)return;el.classList.remove('go');void el.offsetWidth;el.classList.add('go');}
  function toast(msg){clearTimeout(toastTimer);toastEl.textContent=msg;toastEl.classList.add('show');toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1900);}

  function haptic(pattern){ try{ navigator.vibrate?.(pattern); }catch(_e){} }
  function ensureAudio(){
    if(!state.sound) return null;
    try{ audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended')audioCtx.resume(); return audioCtx; }catch(_e){return null;}
  }
  function beep(freq,dur=.06,type='sine',gain=.035,delay=0){
    const ctx=ensureAudio(); if(!ctx)return;
    const o=ctx.createOscillator(), g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0.0001,ctx.currentTime+delay);g.gain.exponentialRampToValueAtTime(gain,ctx.currentTime+delay+.01);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+delay+dur);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+delay);o.stop(ctx.currentTime+delay+dur+.02);
  }
  function tapSound(kind){ if(kind==='place'){beep(310,.07,'triangle',.028);beep(470,.09,'sine',.018,.035);} else if(kind==='undo'){beep(260,.08,'sine',.02);} else beep(220,.045,'sine',.014); }
  function comboSound(){beep(392,.12,'sine',.03);beep(523,.15,'sine',.025,.06);beep(659,.18,'triangle',.018,.12);}

  function soundIcon(on){ return on?`<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M17.5 6.5a8 8 0 0 1 0 11"/></svg>`:`<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 5m0-5-5 5"/></svg>`; }
  function undoIcon(){return `<svg viewBox="0 0 24 24"><path d="M9 7 4 12l5 5"/><path d="M5 12h9a5 5 0 0 1 5 5v1"/></svg>`;}
  function resetIcon(){return `<svg viewBox="0 0 24 24"><path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/></svg>`;}

  function sprite(id){
    const c = {
      leaf:'#5d8e45',leaf2:'#78a858',wood:'#7a5234',water:'#6eb8c4',water2:'#9bd2d3',stone:'#888b7b',paper:'#f6edd2',roof:'#a75b43',roof2:'#765245',gold:'#d5a84c',night:'#6a5f87',orange:'#c8743d',red:'#b34b3f',white:'#f9f5df',soil:'#9e7a4f',ink:'#3b4737',blue:'#5d859f'
    };
    const open=`<svg viewBox="0 0 100 100" role="img" aria-hidden="true">`;
    const close=`</svg>`;
    const ground=`<ellipse cx="50" cy="82" rx="34" ry="8" fill="rgba(67,82,54,.10)"/>`;
    const sprites={
      grass:`${ground}<path d="M19 78c9-20 20-30 31-30s24 11 33 30" fill="#90b85f"/><path d="M28 73 20 50m19 22-2-32m13 31 7-33m4 37 18-25" stroke="${c.leaf}" stroke-width="4" stroke-linecap="round"/>`,
      tree:`${ground}<path d="M47 47h9v35h-9z" fill="${c.wood}"/><circle cx="51" cy="36" r="20" fill="${c.leaf}"/><circle cx="36" cy="44" r="14" fill="${c.leaf2}"/><circle cx="67" cy="47" r="15" fill="#6d9d4e"/><circle cx="46" cy="25" r="12" fill="#82aa55"/>`,
      pond:`${ground}<ellipse cx="50" cy="63" rx="34" ry="22" fill="${c.water}"/><ellipse cx="50" cy="58" rx="29" ry="16" fill="${c.water2}"/><path d="M29 60c8-5 13 4 21 0s13-5 22 0" stroke="#e7f2dc" stroke-width="3" fill="none" opacity=".75"/><path d="M66 42c8-8 12-6 15-3-6 3-8 7-15 3Z" fill="${c.leaf}"/>`,
      flowers:`${ground}<path d="M20 76c10-16 21-22 31-20 11 2 19 11 28 20" fill="#8eb061"/><path d="M35 66V48M51 68V42M66 68V51" stroke="${c.leaf}" stroke-width="2"/><g fill="#e5a0a8"><circle cx="35" cy="46" r="7"/><circle cx="48" cy="40" r="7"/></g><circle cx="53" cy="40" r="6" fill="#f0d56d"/><circle cx="67" cy="49" r="7" fill="#ad8fc1"/>`,
      rock:`${ground}<path d="m25 73 8-29 18-13 22 10 9 31-13 8H37Z" fill="${c.stone}"/><path d="m34 45 17-14 5 26-19 14Z" fill="#a8aa99"/><path d="m58 35 15 7 7 25-24-10Z" fill="#777c70"/>`,
      well:`${ground}<ellipse cx="50" cy="67" rx="27" ry="14" fill="#817b66"/><path d="M25 51h50v17c0 8-50 8-50 0Z" fill="#a9a18a"/><ellipse cx="50" cy="51" rx="25" ry="11" fill="#c4b9a0"/><ellipse cx="50" cy="50" rx="18" ry="7" fill="#527f91"/><path d="M31 48V28h38v20M28 28h44" stroke="${c.wood}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      bamboo:`${ground}<path d="M33 80V26M50 82V18M66 79V29" stroke="#598945" stroke-width="6" stroke-linecap="round"/><g fill="#77a75b"><path d="m31 38-15-8 12 16Zm4 13 16-9-12 17Zm15-19 14-10-10 19Zm4 27-17-8 14 17Zm13-11 15-7-12 15Z"/></g>`,
      hut:`${ground}<path d="M27 48h47v33H27Z" fill="#d7bd87"/><path d="m20 50 31-29 31 29Z" fill="${c.roof}"/><rect x="46" y="60" width="12" height="21" rx="2" fill="${c.wood}"/><rect x="32" y="57" width="10" height="10" fill="#a9d0ca"/>`,
      field:`${ground}<path d="M18 52h64l-9 28H27Z" fill="#c6a85c"/><path d="M27 56 36 78m4-22 5 22m8-22-1 22m14-22-6 22" stroke="#8f7a43" stroke-width="3"/><g fill="#e4cc73"><circle cx="31" cy="48" r="5"/><circle cx="44" cy="44" r="5"/><circle cx="58" cy="48" r="5"/><circle cx="70" cy="43" r="5"/></g>`,
      road:`${ground}<path d="M15 77c20-13 20-29 42-35 12-3 18-10 25-19" stroke="#8a806f" stroke-width="19" fill="none" stroke-linecap="round"/><path d="M16 76c20-13 21-28 42-34 12-4 17-11 24-20" stroke="#cfc4a9" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M18 73c19-13 21-26 40-32 12-4 17-10 22-18" stroke="#fff0c5" stroke-width="2" fill="none" stroke-dasharray="7 7"/>`,
      shrine:`${ground}<path d="M31 50h38v30H31Z" fill="#e8d7b3"/><path d="m25 52 25-18 25 18Z" fill="${c.roof2}"/><path d="M21 33h58M27 27h46M31 27v25m38-25v25" stroke="${c.red}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="65" r="5" fill="${c.gold}"/>`,
      cat:`${ground}<path d="M34 69c0-17 10-28 22-28 13 0 21 13 19 30-2 9-12 12-24 11-10-1-17-5-17-13Z" fill="#d9a668"/><path d="m39 44 1-17 13 12m15 6-1-17-12 12" fill="#d9a668" stroke="#b9814f" stroke-width="2"/><circle cx="48" cy="52" r="2.5" fill="#263229"/><circle cx="62" cy="52" r="2.5" fill="#263229"/><path d="M55 56c-1 5-7 5-8 1m10 0c1 4 7 4 8 0M73 65c14-9 14 3 8 8" fill="none" stroke="#7b5a3d" stroke-width="3" stroke-linecap="round"/>`,
      bird:`${ground}<path d="M26 62c12-21 30-26 47-10-8 0-15 4-20 11 12 1 18 6 21 12-18 6-35 2-48-13Z" fill="${c.blue}"/><path d="M46 56c-2-14 9-22 20-24-7 8-9 14-8 23" fill="#7ca8b8"/><circle cx="67" cy="51" r="2.5" fill="#20353b"/><path d="m73 54 12 4-12 4Z" fill="#c79b43"/>`,
      fire:`${ground}<path d="M31 78 68 55M30 55l40 23" stroke="${c.wood}" stroke-width="6" stroke-linecap="round"/><path d="M51 65c-15-9-5-22 4-32 0 9 7 11 7 20 5-4 8-8 8-13 9 12 8 28-2 35-14 10-29 1-29-10 0-7 5-12 9-17-1 9 0 13 3 17Z" fill="#e57c3d"/><path d="M52 66c-6-6 1-13 5-19 0 6 5 7 5 13 3-3 4-5 4-7 4 8 1 17-6 19-5 2-9-2-8-6Z" fill="#ffd86b"/>`,
      grave:`${ground}<path d="M36 31c0-8 6-13 14-13s14 5 14 13v42H36Z" fill="#8f9386"/><path d="M29 74h42v8H29Z" fill="#777c70"/><path d="M44 40h12m-6-6v18" stroke="#70756c" stroke-width="3"/><circle cx="72" cy="28" r="8" fill="#d9d8b7" opacity=".65"/>`,
      shop:`${ground}<path d="M23 43h55v38H23Z" fill="#e8d2a4"/><path d="M19 42h63l-7-18H26Z" fill="#d96c59"/><path d="M26 24v18m14-18v18m14-18v18m14-18v18" stroke="#fff0d0" stroke-width="7"/><rect x="32" y="54" width="17" height="13" rx="2" fill="#9bc0be"/><rect x="58" y="54" width="12" height="27" fill="${c.wood}"/>`,
      workshop:`${ground}<path d="M21 50h58v31H21Z" fill="#c8b38d"/><path d="m18 51 23-25 41 25Z" fill="#7f6854"/><path d="M66 29h8v22h-8z" fill="#68564a"/><circle cx="49" cy="61" r="12" fill="#827967"/><circle cx="49" cy="61" r="5" fill="#d8ca9d"/><path d="M49 45v7m0 18v7M33 61h7m18 0h7m-27-11 5 5m12 12 5 5m0-22-5 5M43 67l-5 5" stroke="#d8ca9d" stroke-width="3"/>`,
      inn:`${ground}<path d="M23 38h54v43H23Z" fill="#ead9b1"/><path d="m17 40 33-19 34 19Z" fill="#6f5145"/><rect x="46" y="53" width="16" height="28" fill="#795c45"/><rect x="29" y="50" width="11" height="13" fill="#9bc5c3"/><circle cx="72" cy="53" r="7" fill="#d9664a"/><path d="M72 60v12" stroke="#7c5b42" stroke-width="2"/>`,
      tower:`${ground}<path d="M38 27h25l7 54H31Z" fill="#9b9a89"/><path d="M34 23h34l-5 13H39Z" fill="#747a70"/><rect x="46" y="42" width="9" height="13" rx="2" fill="#586c70"/><path d="M35 67h31" stroke="#747a70" stroke-width="4"/>`,
      garden:`${ground}<path d="M19 74c6-18 20-29 31-29 13 0 25 11 31 29" fill="#91b362"/><circle cx="34" cy="59" r="10" fill="#658f4a"/><circle cx="51" cy="52" r="13" fill="#7ca354"/><circle cx="68" cy="61" r="9" fill="#5c8845"/><path d="M21 75c17-13 41-13 59 0" stroke="#e2d6ac" stroke-width="5" fill="none"/>`,
      gate:`${ground}<path d="M24 78V34h9v44m34 0V34h9v44M18 31h64v9H18Z" fill="#a9493d"/><path d="M26 24h48l9 9H17Z" fill="#755044"/><path d="M39 43h22v35H39Z" fill="#d7c6a0"/>`,
      fox:`${ground}<path d="M32 64c1-20 13-31 28-28 15 3 22 20 14 34-7 13-30 14-42-6Z" fill="#c8783e"/><path d="m36 42-8-20 20 13m18 3 8-18 8 26" fill="#c8783e"/><path d="M48 60c4 6 12 6 16 0" stroke="#f6e6c8" stroke-width="8" stroke-linecap="round"/><circle cx="48" cy="51" r="2.5"/><circle cx="65" cy="51" r="2.5"/><path d="M32 67c-15 6-9 17 7 12" fill="none" stroke="#f0d9bb" stroke-width="7" stroke-linecap="round"/>`,
      statue:`${ground}<path d="M30 74h42v9H30Z" fill="#8e9087"/><path d="M36 61h30v15H36Z" fill="#a6a69a"/><circle cx="51" cy="36" r="13" fill="#aaa99c"/><path d="M39 50c3-10 21-10 24 0l4 13H35Z" fill="#96988e"/><path d="M45 35h3m7 0h3" stroke="#6f756e" stroke-width="2"/>`,
      bridge:`${ground}<ellipse cx="50" cy="69" rx="34" ry="14" fill="${c.water}"/><path d="M17 67c11-25 54-25 66 0" stroke="#9b7250" stroke-width="11" fill="none"/><path d="M22 65c12-17 44-17 57 0" stroke="#d3a46b" stroke-width="6" fill="none"/><path d="M26 53v18m12-25v19m25-18v19m12-12v18" stroke="#744f37" stroke-width="2"/>`,
      market:`${ground}<path d="M17 50h30v29H17Z" fill="#e6c997"/><path d="m13 50 8-20h22l8 20Z" fill="#d25748"/><path d="M53 48h31v31H53Z" fill="#d9bc84"/><path d="m49 48 8-19h23l8 19Z" fill="#5f89a3"/><path d="M24 30v20m13-20v20M60 29v19m14-19v19" stroke="#f8edcf" stroke-width="5"/><circle cx="50" cy="68" r="4" fill="#a05a3c"/>`,
      castle:`${ground}<path d="M26 40h49v41H26Z" fill="#a5a494"/><path d="M19 29h18v52H19Zm45 0h18v52H64Z" fill="#8e9389"/><path d="M18 25h7v8h6v-8h7v12H18Zm45 0h7v8h6v-8h7v12H63Z" fill="#777e75"/><path d="M44 81V62c0-10 14-10 14 0v19" fill="#5e625b"/><path d="M51 25V12m0 0 17 6-17 6" stroke="#a74840" stroke-width="3" fill="#c65347"/>`,
      temple:`${ground}<path d="M26 48h49v33H26Z" fill="#d6c69f"/><path d="m17 48 34-15 35 15-8 7H25Z" fill="#664d50"/><path d="M28 34 51 22l24 12-7 6H35Z" fill="#826061"/><path d="M46 56h12v25H46Z" fill="#8d5d49"/><circle cx="52" cy="64" r="3" fill="${c.gold}"/>`,
      library:`${ground}<path d="M20 42h62v39H20Z" fill="#d8cba8"/><path d="m15 42 36-22 36 22Z" fill="#6d675c"/><path d="M27 51h10v21H27Zm18 0h10v21H45Zm18 0h10v21H63Z" fill="#8d6d4f"/><path d="M30 54h4v16h-4m18-16h4v16h-4m18-16h4v16h-4" stroke="#c8564a" stroke-width="3"/>`,
      bath:`${ground}<path d="M21 49h58v31H21Z" fill="#d8be91"/><path d="m18 50 32-20 34 20Z" fill="#7c5c4c"/><rect x="41" y="58" width="19" height="22" fill="#6d5a46"/><ellipse cx="50" cy="48" rx="18" ry="6" fill="#7fc2c6" opacity=".75"/><path d="M36 38c-7-8 5-11 0-19m15 18c-6-8 5-11 1-19m15 21c-5-8 5-10 1-17" stroke="#fff6dd" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`,
      windmill:`${ground}<path d="M37 43h27l7 38H29Z" fill="#d7c39a"/><path d="m31 44 20-22 20 22Z" fill="#8a604a"/><circle cx="51" cy="44" r="6" fill="#6f5544"/><path d="M51 44 21 24m30 20 20-30M51 44l30 20M51 44 31 76" stroke="#e8dec3" stroke-width="6" stroke-linecap="round"/><circle cx="51" cy="44" r="4" fill="#8d684f"/>`,
      lantern:`${ground}<path d="M48 25h6v54h-6Z" fill="#66665c"/><path d="M34 36h34l-5 27H39Z" fill="#d6a657"/><path d="m30 36 21-12 21 12Z" fill="#6c5a52"/><path d="M39 42h24" stroke="#fff0aa" stroke-width="12" opacity=".55"/><path d="M34 79h34" stroke="#77746b" stroke-width="6" stroke-linecap="round"/>`,
      clock:`${ground}<path d="M38 29h25l8 52H30Z" fill="#958f80"/><path d="M34 23h34l-5 11H39Z" fill="#665c54"/><circle cx="51" cy="47" r="11" fill="#f3e7c6" stroke="#5d5e58" stroke-width="3"/><path d="M51 47V39m0 8 6 4" stroke="#555a52" stroke-width="2" stroke-linecap="round"/><path d="M44 64h14v17H44Z" fill="#6d5746"/>`
    };
    return open + (sprites[id]||sprites.grass) + close;
  }

  function escapeHtml(s){return String(s).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
  function escapeAttr(s){return escapeHtml(s);}

  render();
})();
