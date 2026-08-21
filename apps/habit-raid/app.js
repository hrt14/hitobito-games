(() => {
  'use strict';

  const STORAGE_KEY = 'levelup:habit-raid:v1';
  const EMOJIS = ['📚','🏃','💧','🧘','🧹','✍️','💪','🌱','🧠','🎸','🛏️','🥗'];
  const BOSSES = [
    { name:'怠惰竜グータリオン', emoji:'🐉', aura:'💤' },
    { name:'先延ばし魔竜アトデス', emoji:'🐲', aura:'🌀' },
    { name:'誘惑竜キラキラス', emoji:'🐉', aura:'💎' },
    { name:'三日坊主竜ミッカーン', emoji:'🐲', aura:'🔥' },
    { name:'忘却竜ワスレール', emoji:'🐉', aura:'🌙' }
  ];
  const COMPANIONS = [
    {id:'sprout',name:'モリノコドラ',emoji:'🐲',aura:'🌱',element:'wood',rarity:'N'},
    {id:'drop',name:'アクアチビドラ',emoji:'🐉',aura:'💧',element:'water',rarity:'N'},
    {id:'book',name:'ルーンコドラ',emoji:'🐲',aura:'📘',element:'light',rarity:'N'},
    {id:'fox',name:'ブレイズフォックス',emoji:'🦊',aura:'🔥',element:'fire',rarity:'R'},
    {id:'owl',name:'ミストオウル',emoji:'🦉',aura:'❄️',element:'water',rarity:'R'},
    {id:'bolt',name:'ライジンボルト',emoji:'🐺',aura:'⚡',element:'light',rarity:'R'},
    {id:'moon',name:'月影キリン',emoji:'🦄',aura:'🌙',element:'dark',rarity:'SR'},
    {id:'phoenix',name:'紅蓮フェニックス',emoji:'🦅',aura:'🔥',element:'fire',rarity:'SR'},
    {id:'dragon',name:'星喰いドラグノヴァ',emoji:'🐉',aura:'✨',element:'rainbow',rarity:'SSR'}
  ];
  const XP_BASE = 100;
  const $ = id => document.getElementById(id);
  const els = {
    level:$('levelValue'), streak:$('streakValue'), coins:$('coinValue'), xpBar:$('xpBar'), xpText:$('xpText'),
    bossCard:$('bossCard'), bossName:$('bossName'), bossArt:$('bossArt'), bossHpText:$('bossHpText'), bossHpBar:$('bossHpBar'), bossHint:$('bossHint'), comboRow:$('comboRow'), feverLabel:$('feverLabel'),
    missions:$('missions'), todayLabel:$('todayLabel'), habitList:$('habitList'), emptyState:$('emptyState'), addHabitBtn:$('addHabitBtn'), emptyAddBtn:$('emptyAddBtn'),
    statsView:$('statsView'), collectionView:$('collectionView'), statsSummary:$('statsSummary'), weekBars:$('weekBars'), statsList:$('statsList'),
    statsPeriodLabel:$('statsPeriodLabel'), statsPrev:$('statsPrev'), statsNext:$('statsNext'), collectionGrid:$('collectionGrid'),
    recurringList:$('recurringList'), addRecurringBtn:$('addRecurringBtn'), recurringDialog:$('recurringDialog'), recurringForm:$('recurringForm'), recurringDialogTitle:$('recurringDialogTitle'), recurringName:$('recurringName'), recurringGroup:$('recurringGroup'), recurringMinutes:$('recurringMinutes'), recurringFrequency:$('recurringFrequency'), recurringWeekdayWrap:$('recurringWeekdayWrap'), recurringWeekday:$('recurringWeekday'), recurringMonthdayWrap:$('recurringMonthdayWrap'), recurringMonthday:$('recurringMonthday'), recurringEmojiPicker:$('recurringEmojiPicker'), deleteRecurringBtn:$('deleteRecurringBtn'), closeRecurringDialog:$('closeRecurringDialog'),
    habitDialog:$('habitDialog'), habitForm:$('habitForm'), habitDialogTitle:$('habitDialogTitle'), habitName:$('habitName'), habitGroup:$('habitGroup'), habitMinutes:$('habitMinutes'), habitOneTime:$('habitOneTime'), emojiPicker:$('emojiPicker'), deleteHabitBtn:$('deleteHabitBtn'), closeHabitDialog:$('closeHabitDialog'),
    rewardDialog:$('rewardDialog'), rewardEyebrow:$('rewardEyebrow'), rewardIcon:$('rewardIcon'), rewardTitle:$('rewardTitle'), rewardText:$('rewardText'), rewardBtn:$('rewardBtn'),
    toast:$('toast'), damagePop:$('damagePop'), soundBtn:$('soundBtn')
  };

  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `h${Date.now()}${Math.random().toString(16).slice(2)}`;
  const defaultData = () => ({
    habits:[
      {id:uid(),name:'読書',group:'学習',minutes:10,emoji:'📚',createdAt:Date.now()},
      {id:uid(),name:'ストレッチ',group:'健康',minutes:0,emoji:'🧘',createdAt:Date.now()+1}
    ],
    logs:{}, timers:{},
    player:{level:1,xp:0,coins:0,bossKills:0,collection:['sprout'],pity:0},
    boss:null, missionClaims:{}, recurringTasks:[], recurringDismissals:[], sound:true
  });

  let data = load();
  let editingId = null;
  let editingRecurringId = null;
  let selectedEmoji = EMOJIS[0];
  let selectedRecurringEmoji = EMOJIS[0];
  let toastTimer = null;
  let rewardAction = null;
  let audioCtx = null;
  let statsRange = 'week';
  let statsAnchor = startOfDay(new Date());

  function startOfDay(value){const d=new Date(value);d.setHours(12,0,0,0);return d}
  function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  const today = () => dateKey();
  const xpNeed = (l=data.player.level) => XP_BASE + (l-1)*35;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  function safeNumber(v,f=0){return v===null||v===undefined||v==='' ? f : (Number.isFinite(Number(v)) ? Number(v) : f)}

  function load(){
    try{
      const p=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!p)return defaultData();
      const b=defaultData();
      return {...b,...p,habits:Array.isArray(p.habits)?p.habits.map(h=>({...h,oneTime:Boolean(h.oneTime),completedAt:safeNumber(h.completedAt,null),recurringTaskId:h.recurringTaskId||null,recurringFrequency:h.recurringFrequency||null,scheduledFor:h.scheduledFor||null})):b.habits,logs:p.logs&&typeof p.logs==='object'?p.logs:{},timers:p.timers&&typeof p.timers==='object'?p.timers:{},player:{...b.player,...(p.player||{}),collection:Array.isArray(p.player?.collection)?p.player.collection:b.player.collection},missionClaims:p.missionClaims&&typeof p.missionClaims==='object'?p.missionClaims:{},recurringTasks:Array.isArray(p.recurringTasks)?p.recurringTasks:[],recurringDismissals:Array.isArray(p.recurringDismissals)?p.recurringDismissals:[]};
    }catch{return defaultData()}
  }
  const save = () => localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  function formatDuration(sec){if(sec<60)return `${Math.max(1,Math.round(sec))}秒`;const m=Math.floor(sec/60),s=Math.floor(sec%60);return s?`${m}分${s}秒`:`${m}分`}
  function getDayLog(k=today()){if(!data.logs[k])data.logs[k]={};return data.logs[k]}
  function getEntry(id,k=today()){const e=data.logs[k]?.[id];return e&&typeof e==='object'?{count:safeNumber(e.count),seconds:safeNumber(e.seconds)}:{count:0,seconds:0}}
  const setEntry=(id,k,e)=>{getDayLog(k)[id]=e};
  function lastDates(n=7){return Array.from({length:n},(_,i)=>{const d=startOfDay(new Date());d.setDate(d.getDate()-(n-1-i));return d})}
  const totalForDay=k=>Object.values(data.logs[k]||{}).reduce((a,e)=>a+safeNumber(e.count),0);
  const secondsForDay=k=>Object.values(data.logs[k]||{}).reduce((a,e)=>a+safeNumber(e.seconds),0);
  function streak(){let c=0,d=startOfDay(new Date());if(totalForDay(dateKey(d))===0)d.setDate(d.getDate()-1);while(totalForDay(dateKey(d))>0&&c<3650){c++;d.setDate(d.getDate()-1)}return c}
  const completionsToday=()=>totalForDay(today());
  const secondsToday=()=>secondsForDay(today());
  const uniqueHabitsToday=()=>Object.values(data.logs[today()]||{}).filter(e=>safeNumber(e.count)>0).length;

  function startOfWeek(value){const d=startOfDay(value);const monday=(d.getDay()+6)%7;d.setDate(d.getDate()-monday);return d}
  function rangeDates(){
    if(statsRange==='month'){
      const first=new Date(statsAnchor.getFullYear(),statsAnchor.getMonth(),1,12);
      const last=new Date(statsAnchor.getFullYear(),statsAnchor.getMonth()+1,0,12);
      return Array.from({length:last.getDate()},(_,i)=>new Date(first.getFullYear(),first.getMonth(),i+1,12));
    }
    const start=startOfWeek(statsAnchor);
    return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});
  }
  function periodLabel(dates){
    if(statsRange==='month')return `${dates[0].getFullYear()}年${dates[0].getMonth()+1}月`;
    const a=dates[0],b=dates[dates.length-1];
    return a.getFullYear()===b.getFullYear()?`${a.getFullYear()}年 ${a.getMonth()+1}/${a.getDate()}〜${b.getMonth()+1}/${b.getDate()}`:`${a.getFullYear()}年${a.getMonth()+1}/${a.getDate()}〜${b.getFullYear()}年${b.getMonth()+1}/${b.getDate()}`;
  }
  function currentPeriodReached(){
    const now=startOfDay(new Date());
    if(statsRange==='month')return statsAnchor.getFullYear()===now.getFullYear()&&statsAnchor.getMonth()===now.getMonth();
    return dateKey(startOfWeek(statsAnchor))===dateKey(startOfWeek(now));
  }
  function moveStatsPeriod(delta){
    if(statsRange==='month')statsAnchor=new Date(statsAnchor.getFullYear(),statsAnchor.getMonth()+delta,1,12);
    else {const d=new Date(statsAnchor);d.setDate(d.getDate()+delta*7);statsAnchor=startOfDay(d)}
    renderStats();
  }

  function recurringOccurrenceKey(taskId,scheduledFor){return `${taskId}:${scheduledFor}`}
  function ensureRecurringOccurrences(){
    if(!Array.isArray(data.recurringTasks)||!data.recurringTasks.length)return;
    const existing=new Set(data.habits.filter(h=>h.recurringTaskId&&h.scheduledFor).map(h=>recurringOccurrenceKey(h.recurringTaskId,h.scheduledFor)));
    const dismissed=new Set(data.recurringDismissals||[]),generated=[];
    const todayDate=startOfDay(new Date());
    for(const task of data.recurringTasks){
      const start=startOfDay(task.startsAt||new Date());
      if(!Number.isFinite(start.getTime()))continue;
      const cursor=new Date(start);
      while(cursor<=todayDate){
        const lastDay=new Date(cursor.getFullYear(),cursor.getMonth()+1,0,12).getDate();
        const due=task.frequency==='monthly'?cursor.getDate()===Math.min(safeNumber(task.dayOfMonth,1),lastDay):cursor.getDay()===safeNumber(task.weekday,1);
        if(due){
          const scheduledFor=dateKey(cursor),occurrenceKey=recurringOccurrenceKey(task.id,scheduledFor);
          if(!existing.has(occurrenceKey)&&!dismissed.has(occurrenceKey)){
            generated.push({id:uid(),name:task.name,group:task.group||'',minutes:safeNumber(task.minutes),emoji:task.emoji||'⭐',createdAt:Date.now()+generated.length,oneTime:true,completedAt:null,recurringTaskId:task.id,recurringFrequency:task.frequency,scheduledFor});
            existing.add(occurrenceKey);
          }
        }
        cursor.setDate(cursor.getDate()+1);
      }
    }
    if(generated.length){data.habits.push(...generated);save()}
  }
  function recurringLabel(task){return task.frequency==='monthly'?`毎月 ${task.dayOfMonth}日`:`毎週 ${['日','月','火','水','木','金','土'][safeNumber(task.weekday,1)]}曜`}

  const bossMaxHp=()=>60+Math.min(140,(data.player.level-1)*8)+(data.player.bossKills%5)*10;
  function ensureBoss(){if(!data.boss||data.boss.day!==today()){const i=(new Date().getDate()+data.player.bossKills)%BOSSES.length,m=bossMaxHp();data.boss={day:today(),index:i,hp:m,maxHp:m,chain:0};save()}}
  const currentBoss=()=>{ensureBoss();return data.boss};
  function bossDamage(nextChain){const combo=nextChain%3===0,crit=Math.random()<.12,base=12+Math.floor(Math.random()*7);let value=combo?Math.round(base*1.8):base;if(crit)value=Math.round(value*1.5);return {value,crit,combo}}
  function playTone(type='hit'){if(!data.sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime,cfg=type==='level'?[520,820,.18]:type==='chest'?[380,650,.16]:type==='ko'?[180,520,.22]:[210,140,.08];o.connect(g);g.connect(audioCtx.destination);o.frequency.setValueAtTime(cfg[0],now);o.frequency.exponentialRampToValueAtTime(cfg[1],now+cfg[2]);g.gain.setValueAtTime(.07,now);g.gain.exponentialRampToValueAtTime(.001,now+cfg[2]);o.start();o.stop(now+cfg[2])}catch{}if(navigator.vibrate)navigator.vibrate(type==='ko'?[35,35,55]:18)}
  function toast(msg){clearTimeout(toastTimer);els.toast.textContent=msg;els.toast.classList.add('show');toastTimer=setTimeout(()=>els.toast.classList.remove('show'),1700)}
  function damagePop(v,crit){els.damagePop.textContent=`${crit?'かいしん! ':''}-${v}`;els.damagePop.classList.remove('show');void els.damagePop.offsetWidth;els.damagePop.classList.add('show')}
  function addXp(a){data.player.xp+=a;let levels=0;while(data.player.xp>=xpNeed()){data.player.xp-=xpNeed();data.player.level++;levels++}if(levels){rewardAction=()=>openChest('LEVEL UP BONUS');showReward('LEVEL UP!','⚔️',`勇者Lv.${data.player.level}！ 召喚タマゴを1個獲得。`,'召喚する');playTone('level')}}
  const addCoins=n=>data.player.coins+=n;

  function completeHabit(id,seconds=null){
    const h=data.habits.find(x=>x.id===id);if(!h||h.completedAt)return;
    const active=data.timers[id];
    const recordedSeconds=seconds===null?(active?Math.round(timerElapsed(id)):0):Math.max(0,Math.round(seconds));
    const prev=getEntry(id);setEntry(id,today(),{count:prev.count+1,seconds:prev.seconds+recordedSeconds});delete data.timers[id];
    if(h.oneTime)h.completedAt=Date.now();
    const b=currentBoss(),nextChain=b.chain+1,dmg=bossDamage(nextChain);b.chain=nextChain;b.hp=Math.max(0,b.hp-dmg.value);const fever=dmg.combo;
    addXp(fever?32:20);addCoins(fever?22:12);save();
    els.bossCard.classList.remove('hit');void els.bossCard.offsetWidth;els.bossCard.classList.add('hit');damagePop(dmg.value,dmg.crit);playTone('hit');
    toast(`${h.emoji} ${h.name} 達成！${recordedSeconds?` ${formatDuration(recordedSeconds)}記録`:''}${fever?' ・ 🔥 3連撃！':''}`);
    if(b.hp<=0){
      els.bossCard.classList.add('ko');playTone('ko');data.player.bossKills++;addCoins(70);addXp(55);
      const idx=(b.index+1)%BOSSES.length,max=bossMaxHp();
      setTimeout(()=>{data.boss={day:today(),index:idx,hp:max,maxHp:max,chain:b.chain};save();els.bossCard.classList.remove('ko');render();rewardAction=()=>openChest('DRAGON DROP');showReward('BOSS DOWN!','🥚','魔竜討伐！ +70G +55XP。召喚タマゴを手に入れた。','タマゴを割る')},620)
    }
    render();
  }

  function showReward(eyebrow,icon,text,button='受け取る'){els.rewardEyebrow.textContent=eyebrow;els.rewardIcon.textContent=icon;els.rewardTitle.textContent=eyebrow==='LEVEL UP!'?'レベルアップ！':eyebrow==='BOSS DOWN!'?'魔竜討伐！':'モンスター召喚！';els.rewardText.textContent=text;els.rewardBtn.textContent=button;if(!els.rewardDialog.open)els.rewardDialog.showModal()}
  function rollCompanion(){data.player.pity=safeNumber(data.player.pity);let r=Math.random(),pool;if(data.player.pity>=7){pool=COMPANIONS.filter(c=>['SR','SSR'].includes(c.rarity));data.player.pity=0}else if(r<.04){pool=COMPANIONS.filter(c=>c.rarity==='SSR');data.player.pity=0}else if(r<.18){pool=COMPANIONS.filter(c=>c.rarity==='SR');data.player.pity=0}else if(r<.47){pool=COMPANIONS.filter(c=>c.rarity==='R');data.player.pity++}else{pool=COMPANIONS.filter(c=>c.rarity==='N');data.player.pity++}return pool[Math.floor(Math.random()*pool.length)]}
  function openChest(source='SUMMON'){const c=rollCompanion(),isNew=!data.player.collection.includes(c.id);if(isNew)data.player.collection.push(c.id);else addCoins(c.rarity==='N'?15:c.rarity==='R'?25:c.rarity==='SR'?45:80);save();render();rewardAction=null;showReward(source,`${c.aura}${c.emoji}`,`${c.name}　${isNew?`${c.rarity} モンスター召喚！`:'ダブり → ゴールドに変換！'}`,'OK');playTone('chest')}
  function awardMission(key){const ck=`${today()}:${key}`;if(data.missionClaims[ck])return;data.missionClaims[ck]=true;addCoins(30);addXp(25);save();render();toast('クエスト報酬 +30G +25XP');playTone('chest')}
  const isMissionClaimed=k=>!!data.missionClaims[`${today()}:${k}`];

  function render(){ensureRecurringOccurrences();ensureBoss();renderPlayer();renderBoss();renderMissions();renderHabits();renderRecurringTasks();renderStats();renderCollection();save()}
  function renderPlayer(){els.level.textContent=data.player.level;els.streak.textContent=`🔥 ${streak()}日`;els.coins.textContent=`💰 ${data.player.coins}G`;const n=xpNeed();els.xpBar.style.width=`${clamp(data.player.xp/n*100,0,100)}%`;els.xpText.textContent=`${data.player.xp} / ${n} XP`}
  function renderBoss(){const b=currentBoss(),info=BOSSES[b.index%BOSSES.length];els.bossName.textContent=info.name;els.bossArt.innerHTML=`<span class="boss-aura">${info.aura}</span><span class="boss-creature">${info.emoji}</span>`;els.bossHpText.textContent=`HP ${b.hp} / ${b.maxHp}`;els.bossHpBar.style.width=`${clamp(b.hp/b.maxHp*100,0,100)}%`;const combo=b.chain%3;[...els.comboRow.querySelectorAll('i')].forEach((i,n)=>i.classList.toggle('on',n<combo));els.comboRow.classList.toggle('fever',combo===0&&b.chain>0);els.feverLabel.textContent=combo===0&&b.chain>0?'連撃！':`あと${3-combo}回`;els.bossHint.textContent=combo===2?'次の達成で3連撃の大ダメージ！':'時間経過では攻撃しない。達成した瞬間に1回だけ攻撃。'}
  function renderMissions(){const ms=[{key:'three',icon:'⚔️',name:'習慣を3回達成',value:completionsToday(),goal:3,label:`${Math.min(completionsToday(),3)}/3`},{key:'variety',icon:'🛡️',name:'2種類の習慣を達成',value:uniqueHabitsToday(),goal:2,label:`${Math.min(uniqueHabitsToday(),2)}/2`},{key:'tenmin',icon:'⏱️',name:'合計10分修行する',value:secondsToday(),goal:600,label:`${Math.min(Math.floor(secondsToday()/60),10)}/10分`}];els.missions.innerHTML='';for(const m of ms){const ready=m.value>=m.goal,claimed=isMissionClaimed(m.key),row=document.createElement('div');row.className=`mission ${claimed?'done':''}`;row.innerHTML=`<div class="mission-icon">${m.icon}</div><div><strong>${escapeHtml(m.name)}</strong><small>${m.label} ・ 報酬 30G + 25XP</small></div><button class="claim" type="button" ${!ready||claimed?'disabled':''}>${claimed?'GET':'受取'}</button>`;row.querySelector('button').addEventListener('click',()=>awardMission(m.key));els.missions.appendChild(row)}const d=new Date();els.todayLabel.textContent=`${d.getMonth()+1}/${d.getDate()}`}

  function renderHabits(){
    els.habitList.innerHTML='';
    const available=data.habits.filter(h=>!(h.oneTime&&h.completedAt));
    els.emptyState.hidden=available.length>0;
    const dates=lastDates();
    for(const h of available){
      const t=data.timers[h.id],e=getEntry(h.id),card=document.createElement('article'),elapsed=timerElapsed(h.id);
      const goal=h.minutes>0?` / ${h.minutes}分`:'';
      const timeLabel=t?(t.paused?`▶ 再開 ${formatDuration(elapsed)}${goal}`:`⏸ ${formatDuration(elapsed)}${goal}`):(h.minutes>0?`⏱ ${h.minutes}分`:'⏱ 計る');
      const recurringBadge=h.recurringTaskId?`<span class="recurring-badge">${h.recurringFrequency==='monthly'?'毎月':'毎週'}・${escapeHtml(h.scheduledFor?.slice(5).replace('-','/')||'')}</span>`:(h.oneTime?'<span class="recurring-badge one-time">ONE TIME</span>':'');
      card.className=`habit-card ${t?'active':''} ${h.oneTime?'one-time-card':''}`;
      card.innerHTML=`<div class="habit-top"><div class="habit-icon">${h.emoji||'⭐'}</div><div class="habit-copy"><strong>${escapeHtml(h.name)}</strong><div class="habit-meta">${h.group?`<span class="group-tag">${escapeHtml(h.group)}</span>`:''}${recurringBadge}<span>今日 ${e.count}回${e.seconds?` ・ ${formatDuration(e.seconds)}`:''}</span></div></div><button class="edit-habit" type="button" aria-label="${escapeHtml(h.name)}を編集">•••</button></div><div class="habit-actions"><button class="done-btn" type="button">⚔️ 達成して攻撃！</button><button class="timer-btn ${t?(t.paused?'paused':'running'):''}" type="button">${timeLabel}</button></div>${t?`<div class="timer-note">タイマーは時間を記録するだけ。攻撃は達成時に1回。</div><div class="timer-row"><button type="button" data-action="finish">■ 修行完了＋攻撃</button><button type="button" data-action="cancel">× 取消</button></div>`:''}<div class="week-dots">${dates.map(d=>`<i class="${getEntry(h.id,dateKey(d)).count>0?'done':''}"></i>`).join('')}<span>過去7日</span></div>`;
      card.querySelector('.done-btn').addEventListener('click',()=>completeHabit(h.id));
      card.querySelector('.edit-habit').addEventListener('click',()=>openHabitDialog(h.id));
      card.querySelector('.timer-btn').addEventListener('click',()=>toggleTimer(h.id));
      card.querySelector('[data-action="finish"]')?.addEventListener('click',()=>finishTimer(h.id));
      card.querySelector('[data-action="cancel"]')?.addEventListener('click',()=>{delete data.timers[h.id];save();render();toast('タイマーを取り消した')});
      els.habitList.appendChild(card)
    }
  }

  function timerElapsed(id){const t=data.timers[id];if(!t)return 0;return safeNumber(t.accumulated)+(t.paused?0:Math.max(0,(Date.now()-t.startedAt)/1000))}
  function toggleTimer(id){const t=data.timers[id];if(!t){data.timers[id]={startedAt:Date.now(),accumulated:0,paused:false};toast('修行タイマー開始')}else if(t.paused){t.startedAt=Date.now();t.paused=false;toast('修行を再開')}else{t.accumulated=timerElapsed(id);t.paused=true;toast('修行を一時停止')}save();render()}
  function finishTimer(id){const sec=timerElapsed(id);if(sec<1){toast('1秒以上やってから完了しよう');return}completeHabit(id,Math.round(sec))}

  function renderRecurringTasks(){
    if(!els.recurringList)return;
    els.recurringList.innerHTML='';
    if(!data.recurringTasks.length){els.recurringList.innerHTML='<div class="recurring-empty">毎週・毎月のクエストはまだありません。</div>';return}
    for(const task of data.recurringTasks){
      const row=document.createElement('button');row.type='button';row.className='recurring-row';
      row.innerHTML=`<span class="recurring-icon">${task.emoji||'⭐'}</span><span><strong>${escapeHtml(task.name)}</strong><small>${recurringLabel(task)}${task.group?` ・ ${escapeHtml(task.group)}`:''}${task.minutes?` ・ ${task.minutes}分`:''}</small></span><b>編集 ›</b>`;
      row.addEventListener('click',()=>openRecurringDialog(task.id));els.recurringList.appendChild(row)
    }
  }
  function renderRecurringEmojiPicker(){if(!els.recurringEmojiPicker)return;els.recurringEmojiPicker.innerHTML='';EMOJIS.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.className=e===selectedRecurringEmoji?'active':'';b.addEventListener('click',()=>{selectedRecurringEmoji=e;renderRecurringEmojiPicker()});els.recurringEmojiPicker.appendChild(b)})}
  function updateRecurringFrequencyUi(){const monthly=els.recurringFrequency.value==='monthly';els.recurringWeekdayWrap.hidden=monthly;els.recurringMonthdayWrap.hidden=!monthly}
  function openRecurringDialog(id=null){editingRecurringId=id;const task=data.recurringTasks.find(x=>x.id===id);els.recurringDialogTitle.textContent=task?'定期クエストを編集':'定期クエストを追加';els.recurringName.value=task?.name||'';els.recurringGroup.value=task?.group||'';els.recurringMinutes.value=task?.minutes??0;els.recurringFrequency.value=task?.frequency||'weekly';els.recurringWeekday.value=task?.weekday??1;els.recurringMonthday.value=task?.dayOfMonth??1;selectedRecurringEmoji=task?.emoji||EMOJIS[0];els.deleteRecurringBtn.hidden=!task;updateRecurringFrequencyUi();renderRecurringEmojiPicker();els.recurringDialog.showModal();setTimeout(()=>els.recurringName.focus(),120)}
  function saveRecurringTask(ev){ev.preventDefault();const name=els.recurringName.value.trim();if(!name)return;const frequency=els.recurringFrequency.value==='monthly'?'monthly':'weekly',group=els.recurringGroup.value.trim(),minutes=clamp(Math.round(safeNumber(els.recurringMinutes.value)),0,600),weekday=clamp(Math.round(safeNumber(els.recurringWeekday.value,1)),0,6),dayOfMonth=clamp(Math.round(safeNumber(els.recurringMonthday.value,1)),1,31);if(editingRecurringId){const task=data.recurringTasks.find(x=>x.id===editingRecurringId);if(task)Object.assign(task,{name,group,minutes,emoji:selectedRecurringEmoji,frequency,weekday,dayOfMonth})}else data.recurringTasks.push({id:uid(),name,group,minutes,emoji:selectedRecurringEmoji,frequency,weekday,dayOfMonth,startsAt:new Date().toISOString()});save();els.recurringDialog.close();ensureRecurringOccurrences();render();toast(editingRecurringId?'定期クエストを更新した':'定期クエストを追加した')}
  function deleteRecurringTask(){if(!editingRecurringId)return;const task=data.recurringTasks.find(x=>x.id===editingRecurringId);if(!task||!confirm(`「${task.name}」の定期設定を削除しますか？すでに発生したクエストと記録は残ります。`))return;data.recurringTasks=data.recurringTasks.filter(x=>x.id!==editingRecurringId);save();els.recurringDialog.close();render();toast('定期設定を削除した')}

  function renderStats(){
    const dates=rangeDates();
    const total=dates.reduce((a,d)=>a+totalForDay(dateKey(d)),0);
    const sec=dates.reduce((a,d)=>a+secondsForDay(dateKey(d)),0);
    const activeDays=dates.filter(d=>totalForDay(dateKey(d))>0).length;
    const max=Math.max(1,...dates.map(d=>totalForDay(dateKey(d))));
    els.statsPeriodLabel.textContent=periodLabel(dates);
    els.statsNext.disabled=currentPeriodReached();
    document.querySelectorAll('[data-stats-range]').forEach(b=>b.classList.toggle('active',b.dataset.statsRange===statsRange));
    els.statsSummary.innerHTML=`<div class="stat-tile"><strong>${total}</strong><small>${statsRange==='week'?'週間':'月間'}達成</small></div><div class="stat-tile"><strong>${Math.round(sec/60)}</strong><small>取り組み分</small></div><div class="stat-tile"><strong>${activeDays}</strong><small>実行日</small></div>`;
    els.weekBars.classList.toggle('month-mode',statsRange==='month');
    els.weekBars.innerHTML=dates.map(d=>{const c=totalForDay(dateKey(d)),label=statsRange==='week'?['日','月','火','水','木','金','土'][d.getDay()]:d.getDate();return `<div class="day-bar" title="${d.getMonth()+1}/${d.getDate()}：${c}回"><i style="height:${Math.max(3,c/max*110)}px"></i><span>${label}</span></div>`}).join('');
    els.statsList.innerHTML='';
    for(const h of data.habits){
      const c=dates.reduce((a,d)=>a+getEntry(h.id,dateKey(d)).count,0),s=dates.reduce((a,d)=>a+getEntry(h.id,dateKey(d)).seconds,0),days=dates.filter(d=>getEntry(h.id,dateKey(d)).count>0).length,row=document.createElement('div');
      row.className='stat-habit';row.innerHTML=`<strong>${h.emoji} ${escapeHtml(h.name)}</strong><span>${c}回 ・ ${days}日${s?` ・ ${formatDuration(s)}`:''}</span>`;els.statsList.appendChild(row)
    }
  }

  function renderCollection(){
    els.collectionGrid.innerHTML='';
    for(const c of COMPANIONS){
      const owned=data.player.collection.includes(c.id),el=document.createElement('div'),cls=c.rarity==='R'?'rare':c.rarity==='SR'?'epic':c.rarity==='SSR'?'legend':'';
      el.className=`companion ${c.element} ${cls} ${owned?'':'locked'}`;
      el.innerHTML=`<div class="monster-art"><span class="monster-aura">${owned?c.aura:'✦'}</span><span class="emoji">${owned?c.emoji:'❔'}</span></div><strong>${owned?escapeHtml(c.name):'???'}</strong><small>${c.rarity} MONSTER</small>`;
      els.collectionGrid.appendChild(el)
    }
  }

  function openHabitDialog(id=null){editingId=id;const h=data.habits.find(x=>x.id===id);els.habitDialogTitle.textContent=h?'習慣・クエストを編集':'習慣・クエストを追加';els.habitName.value=h?.name||'';els.habitGroup.value=h?.group||'';els.habitMinutes.value=h?.minutes??0;els.habitOneTime.checked=Boolean(h?.oneTime);els.habitOneTime.disabled=Boolean(h?.recurringTaskId);selectedEmoji=h?.emoji||EMOJIS[0];els.deleteHabitBtn.hidden=!h;renderEmojiPicker();els.habitDialog.showModal();setTimeout(()=>els.habitName.focus(),120)}
  function renderEmojiPicker(){els.emojiPicker.innerHTML='';EMOJIS.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.className=e===selectedEmoji?'active':'';b.addEventListener('click',()=>{selectedEmoji=e;renderEmojiPicker()});els.emojiPicker.appendChild(b)})}
  function saveHabit(ev){ev.preventDefault();const name=els.habitName.value.trim();if(!name)return;const group=els.habitGroup.value.trim(),minutes=clamp(Math.round(safeNumber(els.habitMinutes.value)),0,600);if(editingId){const h=data.habits.find(x=>x.id===editingId);if(h)Object.assign(h,{name,group,minutes,emoji:selectedEmoji,oneTime:h.recurringTaskId?true:Boolean(els.habitOneTime.checked)})}else data.habits.push({id:uid(),name,group,minutes,emoji:selectedEmoji,createdAt:Date.now(),oneTime:Boolean(els.habitOneTime.checked),completedAt:null});save();els.habitDialog.close();render();toast(editingId?'習慣を更新した':'新しいクエストを追加！')}
  function deleteHabit(){if(!editingId)return;const h=data.habits.find(x=>x.id===editingId);if(!h||!confirm(`「${h.name}」を削除しますか？過去の記録は残ります。`))return;if(h.recurringTaskId&&h.scheduledFor){const k=recurringOccurrenceKey(h.recurringTaskId,h.scheduledFor);data.recurringDismissals=Array.from(new Set([...(data.recurringDismissals||[]),k]))}data.habits=data.habits.filter(x=>x.id!==editingId);delete data.timers[editingId];save();els.habitDialog.close();render();toast('クエストを削除した')}
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]))}
  function switchView(v){els.statsView.hidden=v!=='stats';els.collectionView.hidden=v!=='collection';document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));if(v==='stats')renderStats();if(v==='collection')renderCollection()}

  els.addHabitBtn.addEventListener('click',()=>openHabitDialog());
  els.emptyAddBtn.addEventListener('click',()=>openHabitDialog());
  els.habitForm.addEventListener('submit',saveHabit);
  els.closeHabitDialog.addEventListener('click',()=>els.habitDialog.close());
  els.deleteHabitBtn.addEventListener('click',deleteHabit);
  els.rewardBtn.addEventListener('click',()=>{if(rewardAction){const fn=rewardAction;rewardAction=null;els.rewardDialog.close();fn()}else els.rewardDialog.close()});
  els.soundBtn.addEventListener('click',()=>{data.sound=!data.sound;els.soundBtn.textContent=data.sound?'♪':'×';els.soundBtn.setAttribute('aria-pressed',String(data.sound));save();toast(data.sound?'効果音 ON':'効果音 OFF')});
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  document.querySelectorAll('[data-close-view]').forEach(b=>b.addEventListener('click',()=>switchView('home')));
  els.addRecurringBtn?.addEventListener('click',()=>openRecurringDialog());
  els.recurringForm?.addEventListener('submit',saveRecurringTask);
  els.closeRecurringDialog?.addEventListener('click',()=>els.recurringDialog.close());
  els.deleteRecurringBtn?.addEventListener('click',deleteRecurringTask);
  els.recurringFrequency?.addEventListener('change',updateRecurringFrequencyUi);
  document.querySelectorAll('[data-stats-range]').forEach(b=>b.addEventListener('click',()=>{statsRange=b.dataset.statsRange;statsAnchor=startOfDay(new Date());renderStats()}));
  els.statsPrev.addEventListener('click',()=>moveStatsPeriod(-1));
  els.statsNext.addEventListener('click',()=>moveStatsPeriod(1));

  setInterval(()=>{if(Object.keys(data.timers).some(id=>!data.timers[id].paused))renderHabits()},1000);
  render();
})();
