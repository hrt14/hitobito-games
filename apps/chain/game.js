const NODES = {
  higuma: { name:'ヒグマ', search:'ヒグマ', emoji:'🐻', kind:'頂点捕食者', foods:['salmon','ezo_deer','oak'] },
  salmon: { name:'サケ', search:'サケ 鮭', emoji:'🐟', kind:'消費者', foods:['small_fish','krill','aquatic_insect'] },
  ezo_deer: { name:'エゾシカ', search:'エゾシカ', emoji:'🦌', kind:'草食動物', foods:['sasa','grass','tree_leaf'] },
  small_fish: { name:'小魚', search:'北海道 小魚', emoji:'🐟', kind:'消費者', foods:['zooplankton','shrimp','aquatic_insect'] },
  krill: { name:'オキアミ', search:'オキアミ', emoji:'🦐', kind:'消費者', foods:['phytoplankton','algae','diatom'] },
  aquatic_insect: { name:'水生昆虫', search:'水生昆虫', emoji:'🪲', kind:'消費者', foods:['zooplankton','algae','aquatic_plant'] },
  zooplankton: { name:'動物プランクトン', search:'動物プランクトン', emoji:'🦠', kind:'消費者', foods:['phytoplankton','algae','diatom'] },
  shrimp: { name:'小型甲殻類', search:'淡水 エビ 小型甲殻類', emoji:'🦐', kind:'消費者', foods:['algae','phytoplankton','aquatic_plant'] },
  sasa: { name:'ササ', search:'北海道 ササ', emoji:'🌿', kind:'生産者', producer:true },
  grass: { name:'草', search:'北海道 草原 植物', emoji:'🌱', kind:'生産者', producer:true },
  tree_leaf: { name:'木の葉', search:'北海道 広葉樹 葉', emoji:'🍃', kind:'生産者', producer:true },
  oak: { name:'ミズナラ', search:'ミズナラ 樹木 ドングリ', emoji:'🌳', kind:'生産者', producer:true },
  phytoplankton: { name:'植物プランクトン', search:'植物プランクトン 顕微鏡', emoji:'🦠', kind:'生産者', producer:true },
  algae: { name:'藻類', search:'藻類 水中', emoji:'🌿', kind:'生産者', producer:true },
  diatom: { name:'珪藻', search:'珪藻 顕微鏡', emoji:'🔬', kind:'生産者', producer:true },
  aquatic_plant: { name:'水草', search:'北海道 水草', emoji:'🌱', kind:'生産者', producer:true },
  sun: { name:'太陽', search:'太陽', emoji:'☀️', kind:'エネルギー源', sun:true }
};

const STAGES = [
  {region:'北海道', name:'ヒグマ', emoji:'🐻', node:'higuma', live:true},
  {region:'北極', name:'ホッキョクグマ', emoji:'🐻‍❄️'},
  {region:'アフリカ', name:'ライオン', emoji:'🦁'},
  {region:'アマゾン', name:'ジャガー', emoji:'🐆'},
  {region:'太平洋', name:'シャチ', emoji:'🐋'},
  {region:'深海', name:'マッコウクジラ', emoji:'🐳'}
];

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const imageCache = new Map();
let state = {
  screen:'home',
  current:null,
  chain:[],
  runNew:0,
  discovered:new Set(JSON.parse(localStorage.getItem('chain-discovered') || '[]')),
  best:Number(localStorage.getItem('chain-best') || 0),
  modal:false,
};

function saveProgress(){
  localStorage.setItem('chain-discovered', JSON.stringify([...state.discovered]));
  localStorage.setItem('chain-best', String(state.best));
}
function showToast(message){
  toast.textContent=message; toast.classList.add('show');
  clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1600);
}
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function uniqueFoods(node){return [...new Set(node.foods || [])]}
function nodeLabel(id){return NODES[id]?.name || id}
function chainLength(){return Math.max(0,state.chain.filter(id=>id!=='sun').length-1)}

async function commonsImages(term, limit=6){
  const key=`${term}:${limit}`;
  if(imageCache.has(key)) return imageCache.get(key);
  const api='https://commons.wikimedia.org/w/api.php';
  const params=new URLSearchParams({
    action:'query',format:'json',origin:'*',generator:'search',
    gsrsearch:term,gsrnamespace:'6',gsrlimit:String(limit),
    prop:'imageinfo',iiprop:'url',iiurlwidth:'700'
  });
  try{
    const res=await fetch(`${api}?${params}`);
    if(!res.ok) throw new Error('image api');
    const data=await res.json();
    const pages=Object.values(data.query?.pages || {});
    const images=pages.map(p=>p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url).filter(Boolean);
    imageCache.set(key,images); return images;
  }catch(e){ imageCache.set(key,[]); return []; }
}

function layout(inner){
  return `<div class="app"><main class="shell">
    <header class="topbar">
      <button class="icon-btn" aria-label="ホーム" data-action="home">←</button>
      <div class="brand">CHAIN</div>
      <button class="icon-btn" aria-label="図鑑" data-action="dex">◫</button>
    </header>${inner}</main>${state.modal?renderDex():''}</div>`;
}

function renderHome(){
  app.innerHTML=`<div class="app"><main class="shell">
    <header class="topbar"><div class="brand">HITOBITO GAMES / CHAIN</div><div class="pill-row"><span class="pill dark">BEST ${state.best}</span><button class="icon-btn" data-action="dex" aria-label="図鑑">◫</button></div></header>
    <section class="hero"><div class="eyebrow">FOOD CHAIN EXPLORER</div><h1>食べるを、<br>たどる。</h1><p>食物連鎖の頂点からスタート。<strong>「何を食べる？」</strong>を選び続けて、最後は太陽まで。長いCHAINを見つけよう。</p></section>
    <div class="section-title"><h2>頂点を選ぶ</h2><small>地域 = ステージ</small></div>
    <section class="stage-list">${STAGES.map(s=>`<button class="stage ${s.live?'live':''}" ${s.live?'':'disabled'} ${s.live?`data-start="${s.node}"`:''}><div class="region">${s.region}</div><div class="emoji">${s.emoji}</div><div class="name">${s.name}</div><div class="status">${s.live?'探索可能':'COMING SOON'}</div></button>`).join('')}</section>
  </main>${state.modal?renderDex():''}</div>`;
  bind();
}

function startGame(id){
  state.screen='game'; state.current=id; state.chain=[id]; state.runNew=0;
  discover(id); renderGame();
}
function discover(id){
  if(id==='sun') return;
  if(!state.discovered.has(id)){state.discovered.add(id);state.runNew++;saveProgress();}
}

function renderGame(){
  const id=state.current, node=NODES[id];
  if(node.producer){ renderProducer(); return; }
  const foods=shuffle(uniqueFoods(node));
  const chainHtml=state.chain.map((n,i)=>`${i?'<span class="chev">›</span>':''}<span class="node-chip"><span class="dot"></span>${nodeLabel(n)}</span>`).join('');
  app.innerHTML=layout(`
    <section class="game-head"><div class="crumb">北海道 · CHAIN ${chainLength()}</div><div class="subject-row"><h1>${node.name}</h1><span class="kind">${node.kind}</span></div></section>
    <div class="chain-strip">${chainHtml}</div>
    <section class="image-search" id="imageSearch">${renderImageSkeleton(node)}</section>
    <section class="question"><div class="small">NEXT LINK</div><h2>${node.name}が食べるもの</h2></section>
    <section class="choices">${foods.map(fid=>renderChoice(fid)).join('')}</section>
  `);
  bind(); hydrateImages(id, foods);
}

function renderImageSkeleton(node){
  return Array.from({length:6},(_,i)=>`<div class="image-cell loading-shimmer"><span class="fallback-mark">${node.emoji}</span>${i===0?'<span class="search-badge">WIKIMEDIA IMAGE SEARCH</span>':''}</div>`).join('');
}
function renderChoice(fid){
  const f=NODES[fid];
  return `<button class="choice" data-food="${fid}"><div class="choice-img" id="choice-${fid}">${f.emoji}</div><div><div class="label">${f.name}</div><div class="hint">${f.producer?'ここから太陽へ':'この先も続く'}</div></div><div class="arrow">→</div></button>`;
}
async function hydrateImages(currentId, foods){
  const current=NODES[currentId];
  const [heroImages,...foodImages]=await Promise.all([
    commonsImages(current.search,6),
    ...foods.map(fid=>commonsImages(NODES[fid].search,1))
  ]);
  if(state.current!==currentId) return;
  const grid=document.querySelector('#imageSearch');
  if(grid){
    const cells=[...grid.children];
    cells.forEach((cell,i)=>{
      cell.classList.remove('loading-shimmer');
      if(heroImages[i]) cell.innerHTML=`<img src="${heroImages[i]}" alt="${current.name}の検索画像" loading="lazy">${i===0?'<span class="search-badge">WIKIMEDIA IMAGE SEARCH</span>':''}`;
    });
  }
  foods.forEach((fid,i)=>{
    const el=document.querySelector(`#choice-${CSS.escape(fid)}`);
    if(el && foodImages[i]?.[0]) el.innerHTML=`<img src="${foodImages[i][0]}" alt="${NODES[fid].name}">`;
  });
}

function chooseFood(id){
  state.current=id; state.chain.push(id); discover(id); renderGame();
}
function renderProducer(){
  const node=NODES[state.current];
  app.innerHTML=layout(`
    <section class="game-head"><div class="crumb">北海道 · PRODUCER</div><div class="subject-row"><h1>${node.name}</h1><span class="kind producer">${node.kind}</span></div></section>
    <div class="chain-strip">${state.chain.map((n,i)=>`${i?'<span class="chev">›</span>':''}<span class="node-chip"><span class="dot"></span>${nodeLabel(n)}</span>`).join('')}</div>
    <section class="image-search" id="imageSearch">${renderImageSkeleton(node)}</section>
    <section class="sun-card"><div class="eyebrow">THE SOURCE OF ENERGY</div><div class="sun">☀️</div><h2>ここから始まった。</h2><p>${node.name}が光のエネルギーを受け取り、<br>そのエネルギーが食物連鎖を上っていく。</p></section>
    <div class="actions"><button class="action full" data-action="finish">太陽へ →</button></div>
  `);
  bind(); hydrateImages(state.current,[]);
}
function finish(){
  state.chain.push('sun');
  const len=chainLength(); if(len>state.best){state.best=len;saveProgress();}
  state.screen='result'; renderResult();
}
function renderResult(){
  const len=chainLength();
  app.innerHTML=layout(`
    <section class="result">
      <div class="result-head"><div class="eyebrow">YOUR CHAIN</div><h1>太陽まで到達。</h1><div class="score"><div class="box"><strong>${len}</strong><small>CHAIN LENGTH</small></div><div class="box"><strong>+${state.runNew}</strong><small>NEW SPECIES</small></div></div></div>
      <div class="result-chain">${state.chain.map((id,i)=>{const n=NODES[id];return `${i?'<div class="result-arrow">↓</div>':''}<div class="result-node"><div class="emo">${n.emoji}</div><div><strong>${n.name}</strong><br><small>${n.kind}</small></div><div>${i===0?'START':i===state.chain.length-1?'GOAL':`#${i}`}</div></div>`}).join('')}</div>
      <div class="actions"><button class="action primary" data-action="replay">ヒグマからもう一度</button><button class="action" data-action="share">結果を共有</button><button class="action full" data-action="home">別の頂点を見る</button></div>
      <section class="discover"><h3>今回までに発見したもの ${state.discovered.size} / ${Object.keys(NODES).filter(k=>k!=='sun').length}</h3>${speciesGrid()}</section>
    </section>
  `);
  bind();
}

function speciesGrid(){
  return `<div class="species-grid">${Object.entries(NODES).filter(([id])=>id!=='sun').map(([id,n])=>`<div class="species ${state.discovered.has(id)?'':'unknown'}"><div><div class="e">${state.discovered.has(id)?n.emoji:'?'}</div><div class="n">${state.discovered.has(id)?n.name:'未発見'}</div></div></div>`).join('')}</div>`;
}
function renderDex(){
  return `<div class="modal-wrap" data-action="close-dex"><section class="modal" onclick="event.stopPropagation()"><div class="modal-head"><div><div class="eyebrow">FIELD GUIDE</div><h2>発見図鑑</h2></div><button class="icon-btn" data-action="close-dex">×</button></div><p style="color:var(--muted);line-height:1.7;margin-top:0">遊んで出会った生き物や植物が埋まっていく。現在 ${state.discovered.size} 種発見。</p>${speciesGrid()}</section></div>`;
}
async function shareResult(){
  const text=`CHAIN LENGTH ${chainLength()}\n${state.chain.map(id=>NODES[id].name).join(' → ')}\n#CHAIN #食物連鎖`;
  try{
    if(navigator.share){await navigator.share({title:'CHAIN｜食物連鎖ゲーム',text});}
    else{await navigator.clipboard.writeText(text);showToast('結果をコピーしました');}
  }catch(e){ if(e.name!=='AbortError') showToast('共有できませんでした'); }
}
function openDex(){state.modal=true;state.screen==='home'?renderHome():state.screen==='result'?renderResult():renderGame()}
function closeDex(){state.modal=false;state.screen==='home'?renderHome():state.screen==='result'?renderResult():renderGame()}

function bind(){
  document.querySelectorAll('[data-start]').forEach(el=>el.addEventListener('click',()=>startGame(el.dataset.start)));
  document.querySelectorAll('[data-food]').forEach(el=>el.addEventListener('click',()=>chooseFood(el.dataset.food)));
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',e=>{
    const a=el.dataset.action;
    if(a==='home'){state.modal=false;state.screen='home';renderHome();}
    if(a==='dex'){e.stopPropagation();openDex();}
    if(a==='close-dex'){e.stopPropagation();closeDex();}
    if(a==='finish')finish();
    if(a==='replay')startGame('higuma');
    if(a==='share')shareResult();
  }));
}

renderHome();
