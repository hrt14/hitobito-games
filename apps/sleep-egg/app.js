const STORAGE_KEY='sleep-egg-state-v1';
const defaults={activeSleepStart:null,records:[],totalPoints:0,rhythmStreak:0,creatureGeneration:1,targetSleepMinutes:420,targetBedtime:'23:30',targetWakeTime:'06:30'};
let state=load(),tab='home',result=null,mood=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return {...defaults}}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
const duration=m=>`${Math.floor(m/60)}時間${String(m%60).padStart(2,'0')}分`;
const clock=iso=>new Date(iso).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});
const date=iso=>new Date(iso).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',weekday:'short'});
const clockMinutes=iso=>{const d=new Date(iso);return d.getHours()*60+d.getMinutes()};
const targetMinutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const circularDiff=(a,b)=>Math.min(Math.abs(a-b),1440-Math.abs(a-b));
const rhythmPoints=d=>d<=15?5:d<=30?4:d<=45?3:d<=60?2:d<=90?1:0;
function score(start,end){
 const minutes=Math.max(0,Math.round((new Date(end)-new Date(start))/60000));
 const sleepPoints=Math.min(9,Math.round(minutes/6)/10);
 const bedtimePoints=rhythmPoints(circularDiff(clockMinutes(start),targetMinutes(state.targetBedtime)));
 const wakePoints=rhythmPoints(circularDiff(clockMinutes(end),targetMinutes(state.targetWakeTime)));
 const perfectBonus=bedtimePoints>=4&&wakePoints>=4?3:0;
 const nextStreak=perfectBonus?state.rhythmStreak+1:0;
 const streakBonus=nextStreak>=30?5:nextStreak>=14?3:nextStreak>=7?2:nextStreak>=3?1:0;
 return {minutes,sleepPoints,bedtimePoints,wakePoints,perfectBonus,streakBonus,nextStreak,totalPoints:Math.round((sleepPoints+bedtimePoints+wakePoints+perfectBonus+streakBonus)*10)/10};
}
function creature(points,small=false){
 const stage=points<25?0:points<60?1:points<120?2:points<200?3:4;
 return `<div class="creature stage-${stage}${small?' small':''}">${stage===0?'<div class="egg"><span>✦</span></div>':'<div class="fox"><div class="ear left"></div><div class="ear right"></div><div class="face"><i></i><i></i><b>ω</b></div><div class="body"></div><div class="tail">☾</div>'+(stage>=3?'<div class="crown">✦</div>':'')+'</div>'}<div class="creature-shadow"></div></div>`;
}
function home(){
 const thresholds=[25,60,120,200],next=thresholds.find(x=>state.totalPoints<x)||200,prev=[...thresholds].reverse().find(x=>state.totalPoints>=x)||0;
 const progress=Math.min(100,(state.totalPoints-prev)/Math.max(1,next-prev)*100);
 const avg=state.records.slice(0,7);const avgMin=avg.length?Math.round(avg.reduce((a,r)=>a+r.sleepMinutes,0)/avg.length):0;
 return `<section class="home panel"><div class="sky"><span class="stars">✦　·　✧　·　✦</span>${creature(state.totalPoints)}</div><div class="identity"><h2>${state.totalPoints<25?'月の卵':'ムーンフォックス'}</h2><p>第${state.creatureGeneration}世代</p></div><div class="progress-row"><span>${state.totalPoints.toFixed(1)} pt</span><span>NEXT ${next}</span></div><div class="progress"><i style="width:${progress}%"></i></div>${state.activeSleepStart?`<div class="sleeping-card"><span>睡眠中…</span><strong>${clock(state.activeSleepStart)} START</strong><button class="primary morning" data-action="wake">☀ おはよう</button><button class="demo" data-action="demo">試遊用：7時間30分眠る</button><button class="text-button" data-action="cancel">計測を取り消す</button></div>`:`<button class="primary" data-action="sleep"><b>☾</b> おやすみ</button>`}<div class="today-grid"><div><small>目標就寝</small><b>${state.targetBedtime}</b></div><div><small>目標起床</small><b>${state.targetWakeTime}</b></div><div><small>週間平均</small><b>${avgMin?duration(avgMin):'--'}</b></div></div></section>`;
}
function records(){return `<section class="panel page"><h2>睡眠履歴</h2>${state.records.length?state.records.map(r=>`<article class="record"><div><strong>${date(r.sleepEnd)}</strong><span>${clock(r.sleepStart)} → ${clock(r.sleepEnd)}</span></div><div class="record-score"><b>${duration(r.sleepMinutes)}</b><span>+${r.totalPoints} pt</span></div><button data-delete="${r.id}">削除</button></article>`).join(''):'<p class="empty">まだ記録がありません。</p>'}</section>`}
function book(){return `<section class="panel page"><h2>図鑑</h2><div class="book-grid"><div class="book-card unlocked">${creature(Math.max(80,state.totalPoints),true)}<b>ムーンフォックス</b><span>取得済み</span></div>${['スターオウル','ドリームシープ','ナイトドラゴン','クラウドキャット','ルナラビット'].map(n=>`<div class="book-card locked"><div class="silhouette">?</div><b>${n}</b><span>未発見</span></div>`).join('')}</div></section>`}
function analysis(){const recent=state.records.slice(0,7),avg=recent.length?Math.round(recent.reduce((a,r)=>a+r.sleepMinutes,0)/recent.length):0,perfect=recent.filter(r=>r.perfectBonus>0).length,score=recent.length?Math.round(recent.reduce((a,r)=>a+r.bedtimePoints+r.wakePoints,0)/(recent.length*10)*100):0;return `<section class="panel page"><h2>週間分析</h2><div class="score-ring" style="--score:${score*3.6}deg"><div><strong>${score}</strong><span>RHYTHM SCORE</span></div></div><div class="analysis-grid"><div><small>平均睡眠</small><b>${avg?duration(avg):'--'}</b></div><div><small>PERFECT</small><b>${perfect} / ${recent.length||7}日</b></div></div><p class="insight">${score>=80?'睡眠リズムがかなり安定しています。相棒もごきげんです。':score>=50?'あと少し就寝・起床時刻をそろえると、成長が速くなります。':'まずは目標時刻の±30分を3日続けてみましょう。'}</p></section>`}
function settings(){return `<section class="panel page settings"><h2>設定</h2><label>目標睡眠時間<input id="target-hours" type="number" min="3" max="12" step=".5" value="${state.targetSleepMinutes/60}"></label><label>目標就寝時刻<input id="target-bed" type="time" value="${state.targetBedtime}"></label><label>目標起床時刻<input id="target-wake" type="time" value="${state.targetWakeTime}"></label><div class="manual-note"><b>この端末に保存</b><p>記録はブラウザ内だけに保存されます。</p></div><button class="danger" data-action="reset">全データを削除</button></section>`}
function render(){
 $('#streak').textContent=`🔥 ${state.rhythmStreak} DAYS`;
 $('#screen').innerHTML=tab==='home'?home():tab==='record'?records():tab==='book'?book():tab==='analysis'?analysis():settings();
 const tabs=[['home','HOME','⌂'],['record','RECORD','◷'],['book','BOOK','◇'],['analysis','ANALYSIS','▥'],['settings','SETTINGS','⚙']];
 $('#nav').innerHTML=tabs.map(([id,label,icon])=>`<button data-tab="${id}" class="${tab===id?'active':''}"><b>${icon}</b><span>${label}</span></button>`).join('');
 bind();renderModal();
}
function finishSleep(end){const scored=score(state.activeSleepStart,end);const rec={id:crypto.randomUUID?.()||String(Date.now()),sleepStart:state.activeSleepStart,sleepEnd:end,mood:null,...scored,createdAt:end};state={...state,activeSleepStart:null,records:[rec,...state.records],totalPoints:state.totalPoints+rec.totalPoints,rhythmStreak:rec.nextStreak};result=rec;mood=null;save();render()}
function bind(){
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
 const action=$('[data-action]');
 if(action) document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
  const a=b.dataset.action;
  if(a==='sleep'){state.activeSleepStart=new Date().toISOString();save();render()}
  if(a==='wake')finishSleep(new Date().toISOString());
  if(a==='demo'){const start=new Date(Date.now()-450*60000);state.activeSleepStart=start.toISOString();finishSleep(new Date().toISOString())}
  if(a==='cancel'&&confirm('睡眠計測を取り消しますか？')){state.activeSleepStart=null;save();render()}
  if(a==='reset'&&confirm('Sleep Eggの全データを削除しますか？')){state={...defaults};save();render()}
 });
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const r=state.records.find(x=>x.id===b.dataset.delete);if(r&&confirm(`${date(r.sleepEnd)}の記録を削除しますか？`)){state.records=state.records.filter(x=>x.id!==r.id);state.totalPoints=Math.max(0,state.totalPoints-r.totalPoints);save();render()}});
 if($('#target-hours'))$('#target-hours').onchange=e=>{state.targetSleepMinutes=Number(e.target.value)*60;save()};
 if($('#target-bed'))$('#target-bed').onchange=e=>{state.targetBedtime=e.target.value;save()};
 if($('#target-wake'))$('#target-wake').onchange=e=>{state.targetWakeTime=e.target.value;save()};
}
function renderModal(){
 if(!result){$('#modal').innerHTML='';return}
 $('#modal').innerHTML=`<div class="modal-backdrop"><div class="result-modal"><small>GOOD MORNING!</small><h2>${duration(result.sleepMinutes)}</h2><div class="result-lines"><p><span>睡眠時間</span><b>+${result.sleepPoints}</b></p><p><span>就寝リズム</span><b>+${result.bedtimePoints}</b></p><p><span>起床リズム</span><b>+${result.wakePoints}</b></p>${result.perfectBonus?`<p class="perfect"><span>★ PERFECT RHYTHM ★</span><b>+${result.perfectBonus}</b></p>`:''}<p class="total"><span>TOTAL</span><b>+${result.totalPoints} pt</b></p></div><p>起きた気分は？</p><div class="moods">${[['tired','😫'],['normal','🙂'],['fresh','😄']].map(([v,e])=>`<button data-mood="${v}" class="${mood===v?'selected':''}">${e}</button>`).join('')}</div><button class="primary" id="close-result">相棒を見に行く</button></div></div>`;
 document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{mood=b.dataset.mood;renderModal()});
 $('#close-result').onclick=()=>{state.records=state.records.map(r=>r.id===result.id?{...r,mood}:r);result=null;save();render()};
}
render();
