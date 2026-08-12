const NODES = {
  higuma: { name:'ヒグマ', search:'Ursus arctos Hokkaido brown bear', emoji:'🐻', kind:'頂点・雑食', foods:['salmon','ezo_deer','oak'] },
  salmon: { name:'サケ', search:'Pacific salmon Hokkaido', emoji:'🐟', kind:'魚類', foods:['small_fish','aquatic_insect','small_crustacean'] },
  ezo_deer: { name:'エゾシカ', search:'Cervus nippon yesoensis Ezo deer', emoji:'🦌', kind:'草食動物', foods:['sasa','grass','willow_leaf'] },
  oak: { name:'ミズナラの実', search:'Quercus crispula acorn', emoji:'🌰', kind:'植物', producer:true },
  small_fish: { name:'小魚', search:'freshwater small fish Hokkaido', emoji:'🐟', kind:'小型魚', foods:['zooplankton','aquatic_insect','small_crustacean'] },
  aquatic_insect: { name:'水生昆虫', search:'aquatic insect larva mayfly caddisfly', emoji:'🪲', kind:'水生昆虫', foods:['algae','aquatic_plant','diatom'] },
  small_crustacean: { name:'小型甲殻類', search:'freshwater amphipod copepod', emoji:'🦐', kind:'甲殻類', foods:['phytoplankton','algae','diatom'] },
  zooplankton: { name:'動物プランクトン', search:'zooplankton daphnia copepod', emoji:'🦠', kind:'プランクトン', foods:['phytoplankton','algae','diatom'] },
  sasa: { name:'ササ', search:'Sasa Hokkaido bamboo grass', emoji:'🌿', kind:'生産者', producer:true },
  grass: { name:'草', search:'Hokkaido grassland plants', emoji:'🌱', kind:'生産者', producer:true },
  willow_leaf: { name:'ヤナギの葉', search:'willow leaves Hokkaido', emoji:'🍃', kind:'生産者', producer:true },
  algae: { name:'藻類', search:'freshwater algae', emoji:'🌿', kind:'生産者', producer:true },
  aquatic_plant: { name:'水草', search:'freshwater aquatic plants', emoji:'🌱', kind:'生産者', producer:true },
  diatom: { name:'珪藻', search:'diatom microscope', emoji:'🔬', kind:'生産者', producer:true },
  phytoplankton: { name:'植物プランクトン', search:'phytoplankton microscope', emoji:'🦠', kind:'生産者', producer:true },
};

const ROOT = 'higuma';
const STORAGE_KEY = 'chain-hokkaido-memory-v2';
const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const imageCache = new Map();

function edgeKey(a,b){ return `${a}>${b}`; }
const ALL_EDGES = Object.entries(NODES).flatMap(([id,n]) => (n.foods || []).map(food => edgeKey(id,food)));

function load(){
  try{
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      visited: new Set(Array.isArray(raw.visited) ? raw.visited.filter(k => ALL_EDGES.includes(k)) : []),
      routes: Number(raw.routes || 0),
      bestStreak: Number(raw.bestStreak || 0),
    };
  }catch{
    return { visited:new Set(), routes:0, bestStreak:0 };
  }
}
const saved = load();
let state = {
  screen:'home', current:null, chain:[], routeNewEdges:0, streak:0, misses:0,
  visited:saved.visited, routes:saved.routes, bestStreak:saved.bestStreak,
  hidingRoute:false, lastMiss:null,
};

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({visited:[...state.visited],routes:state.routes,bestStreak:state.bestStreak}));
}
function pct(){ return Math.round((state.visited.size / ALL_EDGES.length) * 100); }
function node(id){ return NODES[id]; }
function isBranchComplete(from,to,memo=new Map()){
  const key=edgeKey(from,to);
  if(!state.visited.has(key)) return false;
  const child=node(to);
  if(child.producer) return true;
  const memoKey=`${from}:${to}`;
  if(memo.has(memoKey)) return memo.get(memoKey);
  memo.set(memoKey,false);
  const result=(child.foods || []).every(next => isBranchComplete(to,next,memo));
  memo.set(memoKey,result);
  return result;
}
function isNodeComplete(id){
  const n=node(id);
  if(n.producer) return true;
  return (n.foods || []).every(food => isBranchComplete(id,food));
}
function scrollTopSoon(){ requestAnimationFrame(()=>window.scrollTo(0,0)); }
function showToast(msg){
  toast.textContent=msg; toast.classList.add('show');
  clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1500);
}
function haptic(ms=18){ try{ navigator.vibrate?.(ms); }catch{} }
function tone(kind='tap'){
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    const ctx=tone.ctx||(tone.ctx=new AC()); const osc=ctx.createOscillator(); const gain=ctx.createGain();
    osc.type='sine'; osc.frequency.value=kind==='good'?660:kind==='miss'?180:420; gain.gain.value=.035;
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.09); osc.stop(ctx.currentTime+.1);
  }catch{}
}
function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }

function shell(inner, back=true){
  return `<div class="app"><main class="shell"><header class="topbar">
    ${back?'<button class="icon-btn" data-action="home" aria-label="ホーム">←</button>':'<div class="brand">HITOBITO GAMES / CHAIN</div>'}
    ${back?'<div class="brand">CHAIN</div>':''}
    <div class="pill-row"><span class="pill dark">${pct()}%</span></div>
  </header>${inner}</main></div>`;
}

function renderHome(){
  state.screen='home';
  app.innerHTML=shell(`
    <section class="hero"><div class="eyebrow">HIDDEN FOOD WEB</div><h1>食べた道を、<br>覚えてる？</h1><p>生き物の食べるものをたどる。太陽に着いた道は<strong>消える</strong>。記憶を頼りに別の道を探して、北海道の食物網を完成させよう。</p></section>
    <button class="stage" data-start="${ROOT}"><div class="region">HOKKAIDO / STAGE 01</div><div class="emoji">🐻</div><div class="name">ヒグマから始める</div><div class="desc">完成 ${pct()}% ・ ${state.routes} CHAIN</div><div class="play">PLAY →</div></button>
    <div class="section-title"><h2>次の生態系</h2><small>COMING SOON</small></div>
    <div class="soon-grid"><div class="soon"><div class="e">🐻‍❄️</div><div class="n">北極</div></div><div class="soon"><div class="e">🦁</div><div class="n">サバンナ</div></div><div class="soon"><div class="e">🐆</div><div class="n">アマゾン</div></div><div class="soon"><div class="e">🐋</div><div class="n">海</div></div><div class="soon"><div class="e">🐳</div><div class="n">深海</div></div></div>
  `,false);
  bind(); scrollTopSoon();
}

function startRun(){
  if(pct()===100){ renderComplete(); return; }
  state.screen='game'; state.current=ROOT; state.chain=[ROOT]; state.routeNewEdges=0; state.lastMiss=null;
  renderGame();
}
function statusCard(){
  return `<section class="status-card"><div class="progress-ring" style="--p:${pct()}"><strong>${pct()}%</strong></div><div><h2>北海道の食物網</h2><p>完成した道は表示されない。前に埋めた枝を避けて、まだ知らない道を探す。</p><div class="streak">MEMORY STREAK ${state.streak} ・ BEST ${state.bestStreak}</div></div></section>`;
}
function chainStrip(){
  return `<div class="current-chain">${state.chain.map((id,i)=>`${i?'<span class="chev">›</span>':''}<span class="node-chip"><span class="dot"></span>${node(id).name}</span>`).join('')}</div>`;
}
function renderGame(){
  const n=node(state.current);
  if(n.producer){ renderProducer(); return; }
  const foods=shuffle(n.foods || []);
  app.innerHTML=shell(`${statusCard()}<section class="game-head"><div class="crumb">いまの道だけ表示中</div><div class="subject-row"><h1>${n.name}</h1><span class="kind">${n.kind}</span></div></section>${chainStrip()}
    <section class="image-search" id="imageSearch">${imageSkeleton(n)}</section>
    <section class="question"><div class="small">CHOOSE THE NEXT LINK</div><h2>${n.name}が食べるもの</h2><p>完成済みの道かどうかは表示されない。記憶を頼りに選ぶ。</p></section>
    <section class="choices">${foods.map(food=>choice(food)).join('')}</section>`);
  bind(); scrollTopSoon(); hydrateImages(state.current,foods);
}
function imageSkeleton(n){
  return Array.from({length:6},(_,i)=>`<div class="image-cell loading-shimmer"><span class="fallback-mark">${n.emoji}</span>${i===0?'<span class="search-badge">WIKIMEDIA IMAGE SEARCH</span>':''}</div>`).join('');
}
function choice(id){
  const n=node(id);
  return `<button class="choice" data-food="${id}"><div class="choice-img" id="choice-${id}">${n.emoji}</div><div><div class="label">${n.name}</div><div class="hint">${n.producer?'ここで光へつながる':'この先にも分岐がある'}</div></div><div class="arrow">→</div></button>`;
}

async function commonsImages(term,limit=6){
  const key=`${term}:${limit}`; if(imageCache.has(key)) return imageCache.get(key);
  const api='https://commons.wikimedia.org/w/api.php';
  const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:term,gsrnamespace:'6',gsrlimit:String(limit),prop:'imageinfo',iiprop:'url',iiurlwidth:'700'});
  try{
    const res=await fetch(`${api}?${params}`); if(!res.ok) throw new Error('image');
    const data=await res.json(); const pages=Object.values(data.query?.pages||{});
    const imgs=pages.map(p=>p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url).filter(Boolean); imageCache.set(key,imgs); return imgs;
  }catch{ imageCache.set(key,[]); return []; }
}
async function hydrateImages(currentId,foods){
  const current=node(currentId);
  const [hero,...child]=await Promise.all([commonsImages(current.search,6),...foods.map(id=>commonsImages(node(id).search,1))]);
  if(state.current!==currentId || state.screen!=='game') return;
  const grid=document.querySelector('#imageSearch');
  if(grid){ [...grid.children].forEach((cell,i)=>{ cell.classList.remove('loading-shimmer'); if(hero[i]) cell.innerHTML=`<img src="${hero[i]}" alt="${current.name}" loading="lazy">${i===0?'<span class="search-badge">WIKIMEDIA IMAGE SEARCH</span>':''}`; }); }
  foods.forEach((id,i)=>{ const el=document.querySelector(`#choice-${CSS.escape(id)}`); if(el&&child[i]?.[0]) el.innerHTML=`<img src="${child[i][0]}" alt="${node(id).name}">`; });
}

function chooseFood(id,button){
  const from=state.current;
  if(isBranchComplete(from,id)){
    state.streak=0; state.misses++; state.lastMiss=edgeKey(from,id); save(); haptic(55); tone('miss');
    button?.classList.add('memory-miss');
    flashMemory('ここは、もう埋めた。','別の道を思い出そう');
    setTimeout(()=>button?.classList.remove('memory-miss'),480);
    return;
  }
  const key=edgeKey(from,id); const fresh=!state.visited.has(key);
  if(fresh){ state.visited.add(key); state.routeNewEdges++; state.streak++; state.bestStreak=Math.max(state.bestStreak,state.streak); save(); }
  haptic(); tone(fresh?'good':'tap');
  state.current=id; state.chain.push(id);
  if(fresh && !node(id).producer && isNodeComplete(id)){ renderConnection(); return; }
  renderGame();
}
function flashMemory(title,sub){
  const el=document.createElement('div'); el.className='memory-overlay'; el.innerHTML=`<div class="memory-burst"><strong>${title}</strong><small>${sub}</small></div>`; document.body.appendChild(el); setTimeout(()=>el.remove(),900);
}

function routeNodesHtml(finalLabel='LIGHT'){
  return state.chain.map((id,i)=>`${i?'<div class="route-arrow">↓</div>':''}<div class="route-node"><div class="emo">${node(id).emoji}</div><div><strong>${node(id).name}</strong><br><small>${node(id).kind}</small></div><div>${i===0?'START':i===state.chain.length-1?finalLabel:`#${i}`}</div></div>`).join('');
}
function renderConnection(){
  state.screen='route';
  app.innerHTML=shell(`<section class="route-complete"><div class="eyebrow">CHAIN CONNECTED</div><div class="sun">🔗</div><h1>知っている道につながった。</h1><p class="lead">この先は前に完成済み。新しい入口だけ覚えれば、この枝も完成。</p>
    <div class="route-preview" id="routePreview">${routeNodesHtml('KNOWN')}</div>
    <div class="new-links">＋ ${state.routeNewEdges} NEW LINKS ・ TOTAL ${pct()}%</div>
    <button class="action lime" data-action="hide-route">覚えた。道を消す</button></section>`);
  bind(); scrollTopSoon();
}

function renderProducer(){
  state.screen='route';
  app.innerHTML=shell(`<section class="route-complete"><div class="eyebrow">ONE BRANCH COMPLETE</div><div class="sun">☀️</div><h1>光までつながった。</h1><p class="lead">この道は一度だけ見せる。覚えたら消して、ヒグマから別の枝を探す。</p>
    <div class="route-preview" id="routePreview">${routeNodesHtml('LIGHT')}<div class="route-arrow">↓</div><div class="route-node"><div class="emo">☀️</div><div><strong>太陽</strong><br><small>エネルギー源</small></div><div>GOAL</div></div></div>
    <div class="new-links">＋ ${state.routeNewEdges} NEW LINKS ・ TOTAL ${pct()}%</div>
    <button class="action lime" data-action="hide-route">覚えた。道を消す</button></section>`);
  bind(); scrollTopSoon();
}
function hideRoute(){
  const preview=document.querySelector('#routePreview'); preview?.classList.add('hiding'); haptic(28); tone('good');
  state.routes++; save();
  setTimeout(()=>{
    if(pct()===100) renderComplete();
    else { state.current=ROOT; state.chain=[ROOT]; state.routeNewEdges=0; state.screen='game'; renderGame(); showToast(`道を記憶した ・ ${pct()}% 完成`); }
  },560);
}

const POS={
  higuma:[400,45], salmon:[150,145], ezo_deer:[400,145], oak:[650,145], small_fish:[85,255], aquatic_insect:[220,255], small_crustacean:[350,255], sasa:[440,255], grass:[535,255], willow_leaf:[630,255], zooplankton:[95,365], algae:[245,365], aquatic_plant:[370,365], phytoplankton:[505,365], diatom:[635,365]
};
function webSvg(){
  const lines=Object.entries(NODES).flatMap(([from,n])=>(n.foods||[]).map(to=>{const a=POS[from],b=POS[to];return `<line class="web-line" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;})).join('');
  const nodes=Object.entries(POS).map(([id,[x,y]])=>{const n=node(id);const cls=`web-node ${id===ROOT?'root':''} ${n.producer?'producer':''}`;return `<g class="${cls}" transform="translate(${x} ${y})"><circle r="26"/><text y="1">${n.emoji}</text></g>`;}).join('');
  return `<svg viewBox="0 0 720 420" role="img" aria-label="完成した北海道の食物網">${lines}${nodes}</svg>`;
}
function renderComplete(){
  state.screen='complete'; toast.classList.remove('show');
  app.innerHTML=shell(`<section class="complete"><div class="eyebrow">HOKKAIDO COMPLETE</div><div class="big">🐻🌿🐟</div><h1>全部、つながった。</h1><p>見えなかった道を記憶しながら、北海道の食物網を完成させた。ここで初めて、全部の道を公開。</p><div class="web-card">${webSvg()}</div><div class="stats"><div class="stat"><strong>${ALL_EDGES.length}</strong><small>DISCOVERED LINKS</small></div><div class="stat"><strong>${state.routes}</strong><small>CHAINS</small></div><div class="stat"><strong>${state.bestStreak}</strong><small>BEST MEMORY</small></div></div><button class="action" data-action="reset">もう一度、記憶を消して遊ぶ</button><button class="action secondary" data-action="home">ステージ一覧へ</button></section>`);
  bind(); scrollTopSoon();
}
function resetAll(){
  localStorage.removeItem(STORAGE_KEY); state.visited=new Set(); state.routes=0; state.bestStreak=0; state.streak=0; state.misses=0; startRun();
}

function bind(){
  document.querySelectorAll('[data-start]').forEach(el=>el.addEventListener('click',()=>{tone();haptic();startRun();}));
  document.querySelectorAll('[data-food]').forEach(el=>el.addEventListener('click',()=>chooseFood(el.dataset.food,el)));
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{
    const a=el.dataset.action; if(a==='home') renderHome(); if(a==='hide-route') hideRoute(); if(a==='reset') resetAll();
  }));
}

renderHome();
