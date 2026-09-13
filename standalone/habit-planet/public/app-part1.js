const { cloudAvailable, getCurrentUser, idToken, loadState, loginGoogle, logout, saveState, watchAuth, watchEntitlement } = window.HP_CLOUD;
const $ = (s, root = document) => root.querySelector(s);
const root = document.getElementById("app");
const STORAGE_KEY = "habit-planet:v1";
const SETTINGS_KEY = "habit-planet:settings:v1";
const OVERWORK_PROGRESS_KEY = "habit-planet:overwork-progress:v1";
const GROWTH_MINUTES = 10;
const STAGE_STEPS = 5;
const PLANET_STAGES = ["岩石核", "大気形成", "海の誕生", "緑の拡大", "文明の光"];
const CYCLE_LENGTH = PLANET_STAGES.length * STAGE_STEPS;
const COLORS = ["#18a999", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef5d8e", "#5ba567"];
const REPEAT_OPTIONS = [[1,"毎日"],[2,"1日おき"],[3,"2日おき"],[4,"3日おき"],[5,"4日おき"],[6,"5日おき"],[7,"6日おき"]];
const PLANETS = [
  {name:"アクア",kind:"海洋",origin:"深い青の海",p1:"#8af1e6",p2:"#168aa2",p3:"#073c60",ring:false},
  {name:"ヴェルデ",kind:"森林",origin:"緑の大陸",p1:"#a8e68c",p2:"#3d985f",p3:"#164b45",ring:false},
  {name:"ルーメン",kind:"光原",origin:"薄明の平原",p1:"#ffe39a",p2:"#d08145",p3:"#733b45",ring:false},
  {name:"ノクス",kind:"夜海",origin:"永い夜の海",p1:"#6dc4e8",p2:"#334f91",p3:"#181f4b",ring:false},
  {name:"シルヴァ",kind:"雲海",origin:"白い雲の層",p1:"#f4f7ff",p2:"#86a4c4",p3:"#435775",ring:true},
  {name:"イグニス",kind:"火山",origin:"赤い火山帯",p1:"#ffb078",p2:"#c85245",p3:"#54263b",ring:false},
  {name:"フロスト",kind:"氷晶",origin:"凍った大洋",p1:"#e7ffff",p2:"#81c4d9",p3:"#446c96",ring:true},
  {name:"アンバー",kind:"砂海",origin:"琥珀色の砂漠",p1:"#ffe2a2",p2:"#d09150",p3:"#74503a",ring:false},
  {name:"ミスト",kind:"湿原",origin:"霧の水辺",p1:"#b8eee0",p2:"#629e99",p3:"#314f62",ring:false},
  {name:"オーロラ",kind:"極光",origin:"光る高層大気",p1:"#c2ffdf",p2:"#7d75d6",p3:"#243e70",ring:true},
  {name:"コバルト",kind:"鉱石",origin:"青い鉱物地帯",p1:"#94c8ff",p2:"#4168ba",p3:"#273261",ring:false},
  {name:"ローズ",kind:"花原",origin:"赤紫の植生",p1:"#ffbfd9",p2:"#ad5681",p3:"#593b62",ring:false},
  {name:"テラ",kind:"大陸",origin:"巨大な大陸棚",p1:"#aee5a0",p2:"#568868",p3:"#34516b",ring:false},
  {name:"ゼファー",kind:"風界",origin:"高速の大気流",p1:"#d9f3ff",p2:"#70a9c8",p3:"#355b83",ring:true},
  {name:"オパール",kind:"結晶",origin:"虹色の鉱床",p1:"#f4d9ff",p2:"#7cb8ca",p3:"#494b8d",ring:false},
  {name:"エンバー",kind:"溶岩",origin:"冷えゆく溶岩原",p1:"#ffbd76",p2:"#b84f45",p3:"#422435",ring:false},
  {name:"セレス",kind:"草原",origin:"広い草の海",p1:"#d5ed89",p2:"#6ba45e",p3:"#355a52",ring:false},
  {name:"アストラ",kind:"星環",origin:"環を持つ終着星",p1:"#d7dcff",p2:"#777cc1",p3:"#343662",ring:true},
];
const ANALYSIS_COLORS = ["#18a999","#3b82f6","#ef5d8e","#e9a23b","#8b5cf6","#5ba567","#ef4444","#06b6d4","#84cc16","#6366f1"];
const fmtDate = new Intl.DateTimeFormat("ja-JP",{month:"numeric",day:"numeric",weekday:"short"});
const fmtTime = new Intl.DateTimeFormat("ja-JP",{hour:"2-digit",minute:"2-digit",hour12:false});
const fmtCsv = new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uuid = () => crypto.randomUUID();
const sum = (xs) => xs.reduce((a,b)=>a+b,0);
function dateKey(d = new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dayNum(key){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(key);return m?Date.UTC(+m[1],+m[2]-1,+m[3])/86400000:NaN}
function normalizeRepeat(v){const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(7,Math.max(1,n)):1}
function repeatLabel(v){const n=normalizeRepeat(v);return n===1?"毎日":`${n-1}日おき`}
function normalizeGroup(v){return String(v??"").normalize("NFKC").replace(/[^A-Za-z]/g,"").toUpperCase().slice(0,16)}
function dueOn(h,key){if(h.oneTime||h.scheduledFor||h.recurringTaskId)return true;const n=normalizeRepeat(h.repeatEveryDays);if(n<=1)return true;const anchor=/^\d{4}-\d{2}-\d{2}$/.test(h.repeatAnchorDate||"")?h.repeatAnchorDate:dateKey(new Date(h.createdAt));const diff=dayNum(key)-dayNum(anchor);return Number.isFinite(diff)&&diff>=0&&diff%n===0}
function tomorrowKey(ts){const d=new Date(ts);d.setHours(12,0,0,0);d.setDate(d.getDate()+1);return dateKey(d)}
function msLabel(ms){const sec=Math.floor(Math.max(0,ms)/1000),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`}
function durationLabel(ms){if(ms<=0)return"0分";const m=Math.floor(ms/60000),h=Math.floor(m/60),r=m%60;if(h&&r)return`${h}時間${r}分`;if(h)return`${h}時間`;if(m)return`${m}分`;return`${Math.max(1,Math.floor(ms/1000))}秒`}
function datetimeLocal(ts){const d=new Date(ts);return new Date(ts-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function sessionRange(s){const a=new Date(s.startedAt),b=new Date(s.endedAt);return dateKey(a)===dateKey(b)?`${fmtDate.format(a)} ${fmtTime.format(a)}〜${fmtTime.format(b)}`:`${fmtDate.format(a)} ${fmtTime.format(a)}〜${fmtDate.format(b)} ${fmtTime.format(b)}`}
function defaultData(){const createdAt=new Date().toISOString();return{habits:[{id:"reading",name:"読書",group:"",memo:"",color:COLORS[0],goalMinutes:0,createdAt,repeatEveryDays:1,repeatAnchorDate:dateKey(),oneTime:false,completedAt:null},{id:"stretch",name:"ストレッチ",group:"",memo:"",color:COLORS[2],goalMinutes:0,createdAt,repeatEveryDays:1,repeatAnchorDate:dateKey(),oneTime:false,completedAt:null}],logs:{},sessions:[],activeSessions:[],skips:{},manualCompletions:{},recurringTasks:[],recurringDismissals:[]}}
function normalizeData(v){const d=v&&typeof v==="object"?v:{};return{habits:Array.isArray(d.habits)?d.habits.map(h=>({...h,group:normalizeGroup(h.group),memo:String(h.memo??""),repeatEveryDays:normalizeRepeat(h.repeatEveryDays),oneTime:Boolean(h.oneTime),completedAt:typeof h.completedAt==="number"?h.completedAt:null})):defaultData().habits,logs:d.logs&&typeof d.logs==="object"?d.logs:{},sessions:Array.isArray(d.sessions)?d.sessions.filter(s=>s&&typeof s.id==="string"&&typeof s.habitId==="string"&&Number.isFinite(s.startedAt)&&Number.isFinite(s.endedAt)&&Number.isFinite(s.durationMs)):[],activeSessions:Array.isArray(d.activeSessions)?d.activeSessions.filter(s=>s&&typeof s.habitId==="string"&&Number.isFinite(s.startedAt)).map(s=>({habitId:s.habitId,startedAt:s.startedAt,sessionStartedAt:Number.isFinite(s.sessionStartedAt)?s.sessionStartedAt:s.startedAt,accumulatedMs:Number.isFinite(s.accumulatedMs)?s.accumulatedMs:0,isPaused:Boolean(s.isPaused)})):[],skips:d.skips&&typeof d.skips==="object"?d.skips:{},manualCompletions:d.manualCompletions&&typeof d.manualCompletions==="object"?d.manualCompletions:{},recurringTasks:Array.isArray(d.recurringTasks)?d.recurringTasks.map(t=>({id:String(t.id||uuid()),name:String(t.name||"定期タスク"),group:normalizeGroup(t.group),memo:String(t.memo??""),frequency:t.frequency==="monthly"?"monthly":"weekly",weekday:Math.min(6,Math.max(0,Number(t.weekday)||0)),dayOfMonth:Math.min(31,Math.max(1,Number(t.dayOfMonth)||1)),startsAt:String(t.startsAt||new Date().toISOString())})):[],recurringDismissals:Array.isArray(d.recurringDismissals)?d.recurringDismissals.filter(x=>typeof x==="string"):[]}}
function readData(){try{return normalizeData(JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")||defaultData())}catch{return defaultData()}}
function readSettings(){try{return{dark:false,focus:true,breath:4,overwork:false,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}}catch{return{dark:false,focus:true,breath:4,overwork:false}}}

let data=readData();
let settings=readSettings();
if(!localStorage.getItem(SETTINGS_KEY)) settings.focus=true;
let user=null, entitlement=null, cloudStatus=cloudAvailable?"未ログイン":"この端末に保存", entitlementUnsub=()=>{};
let saveTimer=null, tick=Date.now(), toastTimer=null;
const ui={view:"home",filter:"incomplete",sort:"manual",reorder:false,recommendedId:null,timerHabitId:data.activeSessions[0]?.habitId||null,quickAdd:false,editingHabitId:null,recurringOpen:false,editingRecurringId:null,recurringFrequency:"weekly",analysisMode:"week",analysisAnchor:new Date(),historyExpanded:false,exportRange:"week",sessionEditId:null,timerCorrection:null,paywall:null,overworkAlert:null,overworkBusy:false,toast:""};
const DEV_PRO = location.hostname==="localhost" && new URLSearchParams(location.search).get("pro_preview")==="1";
function isPro(){if(DEV_PRO)return true;if(!entitlement)return false;const status=String(entitlement.status||"");if(!["active","trialing"].includes(status))return false;const end=entitlement.currentPeriodEnd;const ms=end?.toMillis?end.toMillis():typeof end==="number"?end*1000:Date.parse(end||"");return !Number.isFinite(ms)||ms>Date.now()}
function persist(renderNow=true){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));scheduleCloudSave();if(renderNow)render()}
function persistSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));applyTheme();render()}
function mutate(fn){const next=fn(structuredClone(data));if(next)data=normalizeData(next);persist()}
function scheduleCloudSave(){if(!user||!cloudAvailable)return;cloudStatus="クラウドへ保存中…";clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{try{await saveState(user.uid,data);cloudStatus="クラウド同期済み"}catch(e){console.error(e);cloudStatus="同期できませんでした"}renderHeaderStatus()},700)}
function showToast(msg){ui.toast=msg;render();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{ui.toast="";render()},2600)}
function applyTheme(){document.documentElement.classList.toggle("focus-mode",Boolean(settings.focus));document.documentElement.style.colorScheme=settings.dark||settings.focus?"dark":"light";document.body.classList.toggle("dark-user",Boolean(settings.dark))}

function elapsedFor(id,now=tick){const a=data.activeSessions.find(s=>s.habitId===id);return a?a.accumulatedMs+(a.isPaused?0:Math.max(0,now-a.startedAt)):0}
function totalFor(id){return sum(Object.values(data.logs).map(day=>Number(day?.[id]||0)))+elapsedFor(id)}
function manualDone(id,key=dateKey()){return Array.isArray(data.manualCompletions[key])&&data.manualCompletions[key].includes(id)}
function hasDone(id,key=dateKey()){return Number(data.logs[key]?.[id]||0)>0||manualDone(id,key)}
function isDoneToday(h){return hasDone(h.id)&&!data.activeSessions.some(s=>s.habitId===h.id)||Boolean(h.oneTime&&h.completedAt&&dateKey(new Date(h.completedAt))===dateKey())}
function skipped(id,key=dateKey()){return Array.isArray(data.skips[key])&&data.skips[key].includes(id)}
function habitDays(id){const days=new Set();Object.entries(data.logs).forEach(([k,d])=>{if(Number(d?.[id]||0)>0)days.add(k)});Object.entries(data.manualCompletions).forEach(([k,ids])=>{if(Array.isArray(ids)&&ids.includes(id))days.add(k)});if(elapsedFor(id)>0)days.add(dateKey());return days.size}
function executionCount(){const detailed=new Map();for(const s of data.sessions){const k=`${dateKey(new Date(s.endedAt))}:${s.habitId}`;detailed.set(k,(detailed.get(k)||0)+s.durationMs)}let n=0;for(const[k,day]of Object.entries(data.logs)){for(const[id,ms]of Object.entries(day||{})){if(Number(ms)-(detailed.get(`${k}:${id}`)||0)>1000)n++}}for(const[k,ids]of Object.entries(data.manualCompletions)){for(const id of ids||[]){if(Number(data.logs[k]?.[id]||0)<=0)n++}}return data.sessions.length+n}
function growthInfo(){
  const completedTime=sum(Object.values(data.logs).flatMap(d=>Object.values(d||{}).map(Number)))+sum(data.activeSessions.map(s=>elapsedFor(s.habitId)));
  const executions=executionCount();
  const timePoints=Math.floor(completedTime/(GROWTH_MINUTES*60000));
  const points=executions+timePoints;
  const generation=Math.floor(points/CYCLE_LENGTH);
  const cyclePos=points%CYCLE_LENGTH;
  const stage=Math.min(Math.floor(cyclePos/STAGE_STEPS),PLANET_STAGES.length-1);
  const inStage=cyclePos%STAGE_STEPS;
  const pct=(inStage/STAGE_STEPS)*100;
  const next=STAGE_STEPS-inStage;
  return{completedTime,executions,timePoints,points,generation,cyclePos,stage,pct,next,spec:PLANETS[generation%PLANETS.length]};
}
function planetHtml(info,{small=false,locked=false}={}){
  const spec=info.spec||PLANETS[0],stage=Number.isFinite(info.stage)?info.stage:4;
  return `<div class="planet-wrap ${small?"small":""}"><div class="planet ${spec.ringed||spec.ring?"ringed":""} stage-${stage}" style="--p1:${spec.p1};--p2:${spec.p2};--p3:${spec.p3};${locked?"filter:grayscale(1) brightness(.6);":""}"><span class="ring"></span><span class="city-lights"></span></div></div>`;
}
function todayInfo(){const key=dateKey();const activeIds=new Set(data.activeSessions.map(s=>s.habitId));const habits=data.habits.filter(h=>{if(h.oneTime&&h.completedAt)return Boolean(h.completedAt&&dateKey(new Date(h.completedAt))===key);return(!h.scheduledFor||h.scheduledFor<=key)&&dueOn(h,key)});const completed=habits.filter(isDoneToday).length;const skippedCount=habits.filter(h=>!isDoneToday(h)&&skipped(h.id)).length;return{habits,completed,skipped:skippedCount,remaining:Math.max(0,habits.length-completed-skippedCount),pct:habits.length?Math.round(completed/habits.length*100):0,activeIds}}
function manageableHabits(){const key=dateKey();return data.habits.filter(h=>!(h.oneTime&&h.completedAt)&&(!h.scheduledFor||h.scheduledFor<=key))}
function availableHabits(){const key=dateKey(),active=new Set(data.activeSessions.map(s=>s.habitId));return manageableHabits().filter(h=>active.has(h.id)||dueOn(h,key))}
