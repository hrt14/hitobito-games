(() => {
  'use strict';
  const STORAGE_KEY = 'levelup:habit-raid:v1';
  const $ = id => document.getElementById(id);
  const BOSSES = [
    {name:'怠惰竜グータリオン',emoji:'🐉',aura:'💤'},
    {name:'先延ばし魔竜アトデス',emoji:'🐲',aura:'🌀'},
    {name:'誘惑竜キラキラス',emoji:'🐉',aura:'💎'},
    {name:'三日坊主竜ミッカーン',emoji:'🐲',aura:'🔥'},
    {name:'忘却竜ワスレール',emoji:'🐉',aura:'🌙'}
  ];
  const MONSTERS = [
    {name:'モリノコドラ',emoji:'🐲',aura:'🌱',element:'wood',rarity:'N'},
    {name:'アクアチビドラ',emoji:'🐉',aura:'💧',element:'water',rarity:'N'},
    {name:'ルーンコドラ',emoji:'🐲',aura:'📘',element:'light',rarity:'N'},
    {name:'ブレイズフォックス',emoji:'🦊',aura:'🔥',element:'fire',rarity:'R'},
    {name:'ミストオウル',emoji:'🦉',aura:'❄️',element:'water',rarity:'R'},
    {name:'ライジンボルト',emoji:'🐺',aura:'⚡',element:'light',rarity:'R'},
    {name:'月影キリン',emoji:'🦄',aura:'🌙',element:'dark',rarity:'SR'},
    {name:'紅蓮フェニックス',emoji:'🦅',aura:'🔥',element:'fire',rarity:'SR'},
    {name:'星喰いドラグノヴァ',emoji:'🐉',aura:'✨',element:'rainbow',rarity:'SSR'}
  ];
  let statsRange = 'week';
  let statsAnchor = midday(new Date());

  function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return {}}}
  function midday(value){const d=new Date(value);d.setHours(12,0,0,0);return d}
  function key(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function startOfWeek(value){const d=midday(value),shift=(d.getDay()+6)%7;d.setDate(d.getDate()-shift);return d}
  function datesForRange(){
    if(statsRange==='month'){
      const first=new Date(statsAnchor.getFullYear(),statsAnchor.getMonth(),1,12),days=new Date(statsAnchor.getFullYear(),statsAnchor.getMonth()+1,0,12).getDate();
      return Array.from({length:days},(_,i)=>new Date(first.getFullYear(),first.getMonth(),i+1,12));
    }
    const start=startOfWeek(statsAnchor);
    return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d});
  }
  function entry(data,habitId,day){const e=data.logs?.[day]?.[habitId];return e&&typeof e==='object'?{count:Number(e.count)||0,seconds:Number(e.seconds)||0}:{count:0,seconds:0}}
  function dayCount(data,day){return Object.values(data.logs?.[day]||{}).reduce((sum,e)=>sum+(Number(e?.count)||0),0)}
  function daySeconds(data,day){return Object.values(data.logs?.[day]||{}).reduce((sum,e)=>sum+(Number(e?.seconds)||0),0)}
  function formatDuration(sec){if(sec<60)return `${Math.max(1,Math.round(sec))}秒`;const m=Math.floor(sec/60),s=Math.floor(sec%60);return s?`${m}分${s}秒`:`${m}分`}
  function periodLabel(dates){
    const a=dates[0],b=dates[dates.length-1];
    if(statsRange==='month')return `${a.getFullYear()}年${a.getMonth()+1}月`;
    return `${a.getFullYear()}年 ${a.getMonth()+1}/${a.getDate()}〜${b.getMonth()+1}/${b.getDate()}`;
  }
  function atCurrentPeriod(){const now=midday(new Date());return statsRange==='month'?(statsAnchor.getFullYear()===now.getFullYear()&&statsAnchor.getMonth()===now.getMonth()):key(startOfWeek(statsAnchor))===key(startOfWeek(now))}
  function movePeriod(delta){
    statsAnchor=statsRange==='month'?new Date(statsAnchor.getFullYear(),statsAnchor.getMonth()+delta,1,12):new Date(statsAnchor.getFullYear(),statsAnchor.getMonth(),statsAnchor.getDate()+delta*7,12);
    renderStats();
  }
  function renderStats(){
    const summary=$('statsSummary'),bars=$('weekBars'),list=$('statsList'),label=$('statsPeriodLabel');
    if(!summary||!bars||!list||!label)return;
    const data=load(),dates=datesForRange(),habits=Array.isArray(data.habits)?data.habits:[];
    const total=dates.reduce((s,d)=>s+dayCount(data,key(d)),0),seconds=dates.reduce((s,d)=>s+daySeconds(data,key(d)),0),activeDays=dates.filter(d=>dayCount(data,key(d))>0).length,max=Math.max(1,...dates.map(d=>dayCount(data,key(d))));
    label.textContent=periodLabel(dates);
    $('statsNext').disabled=atCurrentPeriod();
    document.querySelectorAll('[data-stats-range]').forEach(b=>b.classList.toggle('active',b.dataset.statsRange===statsRange));
    summary.innerHTML=`<div class="stat-tile"><strong>${total}</strong><small>${statsRange==='week'?'週間':'月間'}達成</small></div><div class="stat-tile"><strong>${Math.round(seconds/60)}</strong><small>取り組み分</small></div><div class="stat-tile"><strong>${activeDays}</strong><small>実行日</small></div>`;
    bars.classList.toggle('month-mode',statsRange==='month');
    bars.innerHTML=dates.map(d=>{const count=dayCount(data,key(d)),text=statsRange==='week'?['日','月','火','水','木','金','土'][d.getDay()]:d.getDate();return `<div class="day-bar" title="${d.getMonth()+1}/${d.getDate()}：${count}回"><i style="height:${Math.max(3,count/max*110)}px"></i><span>${text}</span></div>`}).join('');
    list.innerHTML='';
    habits.forEach(h=>{const count=dates.reduce((s,d)=>s+entry(data,h.id,key(d)).count,0),sec=dates.reduce((s,d)=>s+entry(data,h.id,key(d)).seconds,0),days=dates.filter(d=>entry(data,h.id,key(d)).count>0).length,row=document.createElement('div');row.className='stat-habit';row.innerHTML=`<strong>${h.emoji||'⭐'} ${escapeHtml(h.name||'習慣')}</strong><span>${count}回 ・ ${days}日${sec?` ・ ${formatDuration(sec)}`:''}</span>`;list.appendChild(row)});
  }
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]))}

  function decorateBoss(){
    const data=load(),boss=data.boss||{},monster=BOSSES[(Number(boss.index)||0)%BOSSES.length],name=$('bossName'),art=$('bossArt'),hp=$('bossHpText'),hint=$('bossHint');
    if(name&&name.textContent!==monster.name)name.textContent=monster.name;
    if(art&&!art.querySelector('.boss-creature'))art.innerHTML=`<span class="boss-aura">${monster.aura}</span><span class="boss-creature">${monster.emoji}</span>`;
    if(hp&&!hp.textContent.startsWith('HP '))hp.textContent=`HP ${hp.textContent}`;
    if(hint&&hint.textContent.includes('習慣を1回完了'))hint.textContent='習慣を1回達成すると、仲間モンスターが攻撃する。3連続で大連撃。';
  }
  function decorateHabits(){document.querySelectorAll('.done-btn').forEach(b=>{if(b.textContent!=='⚔️ 達成して攻撃！')b.textContent='⚔️ 達成して攻撃！'});document.querySelectorAll('[data-action="finish"]').forEach(b=>{if(b.textContent!=='■ 修行完了')b.textContent='■ 修行完了'})}
  function decorateCollection(){
    const cards=[...document.querySelectorAll('#collectionGrid .companion')];
    cards.forEach((card,i)=>{
      const m=MONSTERS[i];if(!m)return;
      card.classList.add(m.element);
      if(card.classList.contains('locked'))return;
      const strong=card.querySelector('strong'),small=card.querySelector('small');
      if(strong)strong.textContent=m.name;if(small)small.textContent=`${m.rarity} MONSTER`;
      const emoji=card.querySelector('.emoji');if(emoji&&!card.querySelector('.monster-art')){const wrap=document.createElement('div');wrap.className='monster-art';wrap.innerHTML=`<span class="monster-aura">${m.aura}</span><span class="emoji">${m.emoji}</span>`;emoji.replaceWith(wrap)}
    });
  }
  function decoratePlayer(){const coin=$('coinValue');if(coin&&coin.textContent.startsWith('🪙'))coin.textContent=coin.textContent.replace(/^🪙\s*/, '💰 ')+'G'}
  function decorate(){decorateBoss();decorateHabits();decorateCollection();decoratePlayer()}

  document.querySelectorAll('[data-stats-range]').forEach(b=>b.addEventListener('click',()=>{statsRange=b.dataset.statsRange;statsAnchor=midday(new Date());renderStats()}));
  $('statsPrev')?.addEventListener('click',()=>movePeriod(-1));
  $('statsNext')?.addEventListener('click',()=>movePeriod(1));
  document.addEventListener('click',()=>setTimeout(()=>{decorate();if(!$('statsView')?.hidden)renderStats()},0),true);
  ['bossName','bossArt','habitList','collectionGrid','coinValue'].forEach(id=>{const node=$(id);if(node)new MutationObserver(()=>decorate()).observe(node,{childList:true,subtree:false,characterData:true})});
  decorate();
  renderStats();
})();