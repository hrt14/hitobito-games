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

const ROOT='higuma';
const STORAGE_KEY='chain-hokkaido-memory-v2';
const app=document.querySelector('#app');
const toast=document.querySelector('#toast');
const imageCache=new Map();
const ALL_EDGES=Object.entries(NODES).flatMap(([id,n])=>(n.foods||[]).map(food=>`${id}>${food}`));
const MILESTONES=[25,50,75];

function edgeKey(a,b){return `${a}>${b}`}
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return {
      visited:new Set(Array.isArray(raw.visited)?raw.visited.filter(k=>ALL_EDGES.includes(k)):[]),
      routes:Number(raw.routes||0),
      seenMilestones:new Set(Array.isArray(raw.seenMilestones)?raw.seenMilestones:[]),
    };
  }catch{return{visited:new Set(),routes:0,seenMilestones:new Set()}}
}
const saved=load();
let state={screen:'home',current:null,chain:[],routeNewEdges:0,visited:saved.visited,routes:saved.routes,seenMilestones:saved.seenMilestones,pendingMilestone:null};

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify({visited:[...state.visited],routes:state.routes,seenMilestones:[...state.seenMilestones]}))}
function pct(){return Math.round(state.visited.size/ALL_EDGES.length*100)}
function remainingLinks(){return Math.max(0,ALL_EDGES.length-state.visited.size)}
function node(id){return NODES[id]}
function isBranchComplete(from,to,memo=new Map()){
  const key=edgeKey(from,to);if(!state.visited.has(key))return false;
  const child=node(to);if(child.producer)return true;
  const mk=`${from}:${to}`;if(memo.has(mk))return memo.get(mk);memo.set(mk,false);
  const complete=(child.foods||[]).every(next=>isBranchComplete(to,next,memo));memo.set(mk,complete);return complete;
}
function availableFoods(id){return (node(id).foods||[]).filter(food=>!isBranchComplete(id,food))}
function isNodeComplete(id){const n=node(id);return n.producer||(n.foods||[]).every(food=>isBranchComplete(id,food))}
function tier(){const p=pct();return p>=75?3:p>=50?2:p>=25?1:0}
function discoveredNodes(){
  const ids=new Set([ROOT]);
  state.visited.forEach(k=>{const [a,b]=k.split('>');ids.add(a);ids.add(b)});
  return [...ids];
}
function maybeMilestone(before,after){
  const hit=MILESTONES.find(m=>before<m&&after>=m&&!state.seenMilestones.has(m));
  if(hit){state.seenMilestones.add(hit);state.pendingMilestone=hit;save()}
}
function releaseMilestone(){
  if(!state.pendingMilestone)return;const m=state.pendingMilestone;state.pendingMilestone=null;
  setTimeout(()=>showMilestone(m),220);
}
function scrollTopSoon(){requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}))}
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1300)}
function haptic(ms=16){try{navigator.vibrate?.(ms)}catch{}}
function tone(kind='tap'){
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=tone.ctx||(tone.ctx=new AC()),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=kind==='good'?720:kind==='clear'?880:430;gain.gain.value=.03;osc.connect(gain);gain.connect(ctx.destination);osc.start();gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.11);osc.stop(ctx.currentTime+.12)}catch{}
}
function shuffle(arr){return[...arr].sort(()=>Math.random()-.5)}

function shell(inner,{back=true}={}){
  return `<div class="app tier-${tier()}"><main class="shell"><header class="topbar">
    ${back?'<button class="icon-btn" data-action="home" aria-label="ステージへ戻る">←</button>':'<div class="brand">HITOBITO GAMES / CHAIN</div>'}
    ${back?'<div class="brand">CHAIN</div>':''}
    <div class="pill-row"><span class="pill dark">北海道 ${pct()}%</span></div>
  </header>${inner}</main></div>`;
}

function stageLife(){
  const ids=discoveredNodes().slice(-7);
  return `<div class="stage-life">${ids.map(id=>`<span title="${node(id).name}">${node(id).emoji}</span>`).join('')}${remainingLinks()?'<span class="unknown-life">?</span>':''}</div>`;
}
function renderHome(){
  state.screen='home';
  const p=pct();
  app.innerHTML=shell(`
    <section class="hero"><div class="eyebrow">FOOD WEB EXPLORER</div><h1>食べる道を、<br>消していく。</h1><p>ヒグマから食べ物をたどる。<strong>最後まで埋めた枝は、次から消える。</strong>残った道だけを選び、北海道の食物網を100%にしよう。</p></section>
    <button class="stage stage-tier-${tier()}" data-start="${ROOT}">
      <div class="region">HOKKAIDO / STAGE 01</div>${stageLife()}<div class="name">ヒグマの食物網</div>
      <div class="stage-progress"><span style="width:${p}%"></span></div><div class="desc">${p}% 完成 ・ 残り ${remainingLinks()} LINKS ・ ${state.routes} CHAIN</div>
      <div class="play">${p===0?'START':p===100?'VIEW':'CONTINUE'} →</div>
    </button>
    ${p>0&&p<100?'<button class="quiet-reset" data-action="reset">進行を最初からやり直す</button>':''}
    <div class="section-title"><h2>この先の生態系</h2><small>北海道クリアで次へ</small></div>
    <div class="soon-grid"><div class="soon"><div class="e">🐻‍❄️</div><div class="n">北極</div></div><div class="soon"><div class="e">🦁</div><div class="n">サバンナ</div></div><div class="soon"><div class="e">🐆</div><div class="n">アマゾン</div></div><div class="soon"><div class="e">🐋</div><div class="n">海</div></div><div class="soon"><div class="e">🐳</div><div class="n">深海</div></div></div>`,{back:false});
  bind();scrollTopSoon();
}

function startRun(){
  if(pct()===100){renderComplete();return}
  state.screen='game';state.current=ROOT;state.chain=[ROOT];state.routeNewEdges=0;renderGame();
}
function statusCard(){
  const p=pct();
  const copy=p<25?'埋めた枝は消える。残っている道だけをたどろう。':p<75?`あと ${remainingLinks()} 本。食物網が少しずつ絞られていく。`:'あと少し。最後のつながりを見つけよう。';
  return `<section class="status-card"><div class="progress-ring" style="--p:${p}"><strong>${p}%</strong></div><div><div class="status-kicker">HOKKAIDO FOOD WEB</div><h2>残り ${remainingLinks()} LINKS</h2><p>${copy}</p></div></section>`;
}
function chainStrip(){return `<div class="current-chain">${state.chain.map((id,i)=>`${i?'<span class="chev">›</span>':''}<span class="node-chip"><span class="dot"></span>${node(id).name}</span>`).join('')}</div>`}
function renderGame(){
  const n=node(state.current);if(n.producer){renderProducer();return}
  const foods=shuffle(availableFoods(state.current));
  if(!foods.length){if(state.current===ROOT){renderComplete()}else{renderConnection()}return}
  const remainingLabel=foods.length===1?'最後の1本':`残り ${foods.length} 本`;
  app.innerHTML=shell(`${statusCard()}
    <section class="game-head"><div class="crumb">CURRENT SPECIES</div><div class="subject-row"><h1>${n.name}</h1><span class="kind">${n.kind}</span></div></section>
    ${chainStrip()}<section class="image-search" id="imageSearch">${imageSkeleton(n)}</section>
    <section class="question"><div><div class="small">NEXT LINK</div><h2>${n.name}が食べるもの</h2></div><span class="remaining-badge ${foods.length===1?'last':''}">${remainingLabel}</span></section>
    <section class="choices ${foods.length===1?'one-left':''}">${foods.map(food=>choice(food)).join('')}</section>
    <div class="rule-note">✓ 完成した枝は、この画面から自動で消えます</div>`);
  bind();scrollTopSoon();hydrateImages(state.current,foods);releaseMilestone();
}
function imageSkeleton(n){return Array.from({length:6},(_,i)=>`<div class="image-cell loading-shimmer"><span class="fallback-mark">${n.emoji}</span>${i===0?'<span class="search-badge">IMAGE SEARCH</span>':''}</div>`).join('')}
function choice(id){
  const n=node(id);
  return `<button class="choice" data-food="${id}"><div class="choice-img" id="choice-${id}">${n.emoji}</div><div><div class="label">${n.name}</div><div class="hint">${n.producer?'この枝の終点':'さらに食べ物をたどる'}</div></div><div class="arrow">→</div></button>`;
}

async function commonsImages(term,limit=6){
  const key=`${term}:${limit}`;if(imageCache.has(key))return imageCache.get(key);
  const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:term,gsrnamespace:'6',gsrlimit:String(limit),prop:'imageinfo',iiprop:'url',iiurlwidth:'700'});
  try{const res=await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);if(!res.ok)throw 0;const data=await res.json();const imgs=Object.values(data.query?.pages||{}).map(p=>p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url).filter(Boolean);imageCache.set(key,imgs);return imgs}catch{imageCache.set(key,[]);return[]}
}
async function hydrateImages(currentId,foods){
  const current=node(currentId);const [hero,...children]=await Promise.all([commonsImages(current.search,6),...foods.map(id=>commonsImages(node(id).search,1))]);
  if(state.current!==currentId||state.screen!=='game')return;
  const grid=document.querySelector('#imageSearch');if(grid)[...grid.children].forEach((cell,i)=>{cell.classList.remove('loading-shimmer');if(hero[i])cell.innerHTML=`<img src="${hero[i]}" alt="${current.name}" loading="lazy">${i===0?'<span class="search-badge">IMAGE SEARCH</span>':''}`});
  foods.forEach((id,i)=>{const el=document.querySelector(`#choice-${CSS.escape(id)}`);if(el&&children[i]?.[0])el.innerHTML=`<img src="${children[i][0]}" alt="${node(id).name}">`});
}

function chooseFood(id,button){
  const from=state.current;if(isBranchComplete(from,id))return renderGame();
  button?.classList.add('selected');haptic();tone('tap');
  const before=pct(),key=edgeKey(from,id),fresh=!state.visited.has(key);
  if(fresh){state.visited.add(key);state.routeNewEdges++;save();maybeMilestone(before,pct())}
  setTimeout(()=>{
    state.current=id;state.chain.push(id);
    if(fresh&&!node(id).producer&&isNodeComplete(id)){renderConnection();releaseMilestone();return}
    renderGame();
  },130);
}
function routeNodesHtml(finalLabel='LIGHT'){
  return state.chain.map((id,i)=>`${i?'<div class="route-arrow">↓</div>':''}<div class="route-node"><div class="emo">${node(id).emoji}</div><div><strong>${node(id).name}</strong><br><small>${node(id).kind}</small></div><div>${i===0?'START':i===state.chain.length-1?finalLabel:`#${i}`}</div></div>`).join('');
}
function renderConnection(){
  state.screen='route';tone('good');haptic(28);
  app.innerHTML=shell(`<section class="route-complete connected"><div class="eyebrow">CHAIN CONNECTED</div><div class="sun">🔗</div><h1>前の道につながった。</h1><p class="lead">この先はもう完成済み。今回つないだ入口も埋まり、次からこの枝は表示されなくなる。</p>
    <div class="route-preview" id="routePreview">${routeNodesHtml('CONNECTED')}</div><div class="new-links">＋${state.routeNewEdges} NEW LINKS <span>北海道 ${pct()}%</span></div>
    <button class="action lime" data-action="hide-route">枝をしまって次へ →</button></section>`);
  bind();scrollTopSoon();releaseMilestone();
}
function renderProducer(){
  state.screen='route';tone('clear');haptic(32);
  app.innerHTML=shell(`<section class="route-complete"><div class="eyebrow">BRANCH COMPLETE</div><div class="sun">☀️</div><h1>この枝、完成。</h1><p class="lead">光までつながった。完成した枝はしまわれ、次の探索では選択肢から消える。</p>
    <div class="route-preview" id="routePreview">${routeNodesHtml('LIGHT')}<div class="route-arrow">↓</div><div class="route-node goal"><div class="emo">☀️</div><div><strong>太陽</strong><br><small>エネルギー源</small></div><div>GOAL</div></div></div>
    <div class="new-links">＋${state.routeNewEdges} NEW LINKS <span>北海道 ${pct()}%</span></div>
    <button class="action lime" data-action="hide-route">枝をしまって次へ →</button></section>`);
  bind();scrollTopSoon();releaseMilestone();
}
function hideRoute(){
  const preview=document.querySelector('#routePreview');preview?.classList.add('hiding');tone('good');haptic(22);state.routes++;save();
  setTimeout(()=>{if(pct()===100)renderComplete();else{state.current=ROOT;state.chain=[ROOT];state.routeNewEdges=0;state.screen='game';renderGame();showToast('完成した枝を隠しました')}},420);
}
function showMilestone(value){
  const el=document.createElement('div');el.className='milestone-overlay';el.innerHTML=`<div class="milestone-card"><div class="milestone-ring">${value}%</div><small>HOKKAIDO DISCOVERED</small><strong>${value===25?'食物網が広がってきた':value===50?'半分までつながった':'ゴールが見えてきた'}</strong></div>`;document.body.appendChild(el);tone('clear');haptic(38);setTimeout(()=>el.classList.add('leave'),1250);setTimeout(()=>el.remove(),1650);
}

const POS={higuma:[400,45],salmon:[150,145],ezo_deer:[400,145],oak:[650,145],small_fish:[85,255],aquatic_insect:[220,255],small_crustacean:[350,255],sasa:[440,255],grass:[535,255],willow_leaf:[630,255],zooplankton:[95,365],algae:[245,365],aquatic_plant:[370,365],phytoplankton:[505,365],diatom:[635,365]};
function webSvg(){
  const lines=Object.entries(NODES).flatMap(([from,n])=>(n.foods||[]).map(to=>{const a=POS[from],b=POS[to];return `<line class="web-line" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`})).join('');
  const nodes=Object.entries(POS).map(([id,[x,y]])=>{const n=node(id),cls=`web-node ${id===ROOT?'root':''} ${n.producer?'producer':''}`;return `<g class="${cls}" transform="translate(${x} ${y})"><circle r="26"/><text y="1">${n.emoji}</text></g>`}).join('');
  return `<svg viewBox="0 0 720 420" role="img" aria-label="完成した北海道の食物網">${lines}${nodes}</svg>`;
}
function renderComplete(){
  state.screen='complete';clearTimeout(showToast.t);toast.classList.remove('show');toast.textContent='';
  app.innerHTML=shell(`<section class="complete"><div class="eyebrow">HOKKAIDO COMPLETE</div><div class="complete-glow"><div class="big">🐻</div><div class="orbit">🐟　🌿　🦌　🦠　🌱</div></div><h1>北海道、100%。</h1><p>消してきた枝が、最後にひとつの食物網として戻ってくる。</p><div class="web-card">${webSvg()}</div>
    <div class="stats"><div class="stat"><strong>${ALL_EDGES.length}</strong><small>LINKS</small></div><div class="stat"><strong>${state.routes}</strong><small>CHAINS</small></div><div class="stat"><strong>${discoveredNodes().length}</strong><small>SPECIES</small></div></div>
    <div class="next-stage"><span>UNLOCK NEXT</span><strong>🐻‍❄️ 北極ステージ</strong><small>次の生態系を準備中</small></div>
    <button class="action secondary" data-action="home">ステージ一覧へ</button><button class="quiet-reset" data-action="reset">北海道を最初から遊ぶ</button></section>`);
  bind();scrollTopSoon();
}
function resetAll(){localStorage.removeItem(STORAGE_KEY);state.visited=new Set();state.routes=0;state.seenMilestones=new Set();state.pendingMilestone=null;renderHome()}
function bind(){
  document.querySelectorAll('[data-start]').forEach(el=>el.addEventListener('click',()=>{tone();haptic();startRun()}));
  document.querySelectorAll('[data-food]').forEach(el=>el.addEventListener('click',()=>chooseFood(el.dataset.food,el)));
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{const a=el.dataset.action;if(a==='home')renderHome();if(a==='hide-route')hideRoute();if(a==='reset')resetAll()}));
}
renderHome();
