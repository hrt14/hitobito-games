(()=>{
  const KEY='asa-no-jibun-lock:v2';
  const LEGACY_KEY='asa-no-jibun-lock:v1';
  const DEFAULT_STEPS=[
    {label:'上半身を起こす',offset:0,help:'まず姿勢だけ変える。'},
    {label:'両足を床につける',offset:15,help:'次の判断はしない。足だけ。'},
    {label:'立つ',offset:30,help:'立ったら、ベッド会議は終了。'},
    {label:'洗面所へ行く',offset:45,help:'場所を変える。考えるのはその後。'},
    {label:'水をひと口飲む',offset:75,help:'ここまでで朝の命令は完了。'}
  ];
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const now=()=>new Date();
  let state=load();
  let runtime={preview:false,index:0,startedAt:null,completed:[],busy:false};
  let wakeLock=null;

  function initialState(){return{version:2,wakeTime:'07:00',steps:structuredClone(DEFAULT_STEPS),locked:null,activeMorning:null,history:[]};}
  function normalize(raw){
    if(!raw||typeof raw!=='object')return initialState();
    return{
      version:2,
      wakeTime:typeof raw.wakeTime==='string'?raw.wakeTime:'07:00',
      steps:Array.isArray(raw.steps)&&raw.steps.length===5?raw.steps:structuredClone(DEFAULT_STEPS),
      locked:raw.locked||null,
      activeMorning:raw.activeMorning||null,
      history:Array.isArray(raw.history)?raw.history:[]
    };
  }
  function load(){
    try{
      const current=localStorage.getItem(KEY);
      if(current)return normalize(JSON.parse(current));
      const legacy=localStorage.getItem(LEGACY_KEY);
      if(legacy){const migrated=normalize(JSON.parse(legacy));localStorage.setItem(KEY,JSON.stringify(migrated));return migrated;}
    }catch{}
    return initialState();
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function pad(n){return String(n).padStart(2,'0');}
  function fmtTime(d){return `${pad(d.getHours())}:${pad(d.getMinutes())}`;}
  function fmtDate(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
  function localTarget(wakeTime,forceTomorrow=false){
    const [h,m]=wakeTime.split(':').map(Number);const d=now();const t=new Date(d);t.setHours(h,m,0,0);
    if(forceTomorrow||t.getTime()<=d.getTime()+5*60*1000)t.setDate(t.getDate()+1);
    return t;
  }
  function offsetTime(baseMs,sec){return fmtTime(new Date(baseMs+sec*1000));}
  function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800);}
  function vibrate(pattern=20){try{navigator.vibrate?.(pattern);}catch{}}
  function show(id){['setupScreen','lockedScreen','morningScreen','resultScreen'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id));window.scrollTo({top:0,left:0,behavior:'auto'});}
  function isMorningWindow(){if(!state.locked)return false;const t=state.locked.targetAt;const n=Date.now();return n>=t-10*60*1000&&n<=t+4*60*60*1000;}
  function activeMorningIsValid(){return Boolean(state.locked&&state.activeMorning&&state.activeMorning.targetAt===state.locked.targetAt&&Date.now()<=state.locked.targetAt+12*60*60*1000);}
  function commandSchedule(){const base=state.locked?.targetAt||Date.now();return state.steps.map(s=>offsetTime(base,s.offset));}

  function renderSetup(){show('setupScreen');$('#wakeTime').value=state.wakeTime;renderTimeline();renderEditor();renderHistory();document.body.style.setProperty('--dawn',0);}
  function renderTimeline(){const base=localTarget($('#wakeTime').value||state.wakeTime).getTime();$('#timeline').innerHTML=state.steps.map((s,i)=>`<div class="step-row"><div class="step-time">${offsetTime(base,s.offset)}</div><div class="step-copy"><b>${escapeHtml(s.label)}</b><small>${escapeHtml(s.help)}</small></div><div class="step-no">${i+1}</div></div>`).join('');}
  function renderEditor(){
    const el=$('#editor');el.innerHTML=state.steps.map((s,i)=>`<label><span>${i+1}</span><input data-step="${i}" maxlength="24" value="${escapeAttr(s.label)}" aria-label="ステップ${i+1}"></label>`).join('');
    $$('#editor input').forEach(input=>input.addEventListener('input',e=>{const i=Number(e.target.dataset.step);state.steps[i].label=e.target.value.trim()||DEFAULT_STEPS[i].label;renderTimeline();}));
  }
  function renderHistory(){
    const panel=$('#historyPanel');const items=state.history.slice(-7);panel.classList.toggle('hidden',items.length===0);if(!items.length)return;
    const max=Math.max(10,...items.map(x=>Math.abs(x.deltaMin||0)));
    $('#history').innerHTML=items.map(x=>{const h=Math.max(10,Math.min(100,Math.round(Math.abs(x.deltaMin||0)/max*100)));return `<div class="hist ${x.status==='broken'?'break':''}"><div class="hist-bar"><div class="hist-fill" style="height:${h}%"></div></div><b>${x.status==='broken'?'途中':formatDelta(x.deltaMin)}</b><small>${x.date.slice(5)}</small></div>`;}).join('');
  }
  function lockPlan(forceTomorrow=false){
    state.wakeTime=$('#wakeTime').value||state.wakeTime;
    const inputs=$$('#editor input');if(inputs.length)inputs.forEach((el,i)=>state.steps[i].label=el.value.trim()||DEFAULT_STEPS[i].label);
    const target=localTarget(state.wakeTime,forceTomorrow);state.locked={targetAt:target.getTime(),createdAt:Date.now(),date:fmtDate(target)};state.activeMorning=null;save();
    vibrate([25,35,25]);renderLocked();toast('朝の編集権をロックしました');
  }
  function renderLocked(){
    show('lockedScreen');const target=new Date(state.locked.targetAt);$('#lockedTitle').textContent=`${fmtTime(target)} 開始`;
    $('#lockedCopy').textContent=`${state.steps.map(s=>s.label).join(' → ')}。明日の朝は、この順番を変えません。`;
    $('#countSteps').textContent=state.steps.length;updateCountdown();clearInterval(renderLocked.timer);renderLocked.timer=setInterval(updateCountdown,30000);document.body.style.setProperty('--dawn',0);
  }
  function updateCountdown(){
    if(!state.locked)return;const ms=Math.max(0,state.locked.targetAt-Date.now());$('#countHours').textContent=Math.floor(ms/3600000);$('#countMinutes').textContent=Math.floor((ms%3600000)/60000);
    if(isMorningWindow()&&!$('#lockedScreen').classList.contains('hidden'))startMorning(false);
  }
  function unlock(){state.locked=null;state.activeMorning=null;save();renderSetup();toast('ロックを解除しました');}

  async function requestWakeLock(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen');}catch{}}
  function startMorning(preview=false){
    if(preview){
      runtime={preview:true,index:0,startedAt:Date.now(),completed:[],busy:false};
    }else if(activeMorningIsValid()){
      runtime={preview:false,index:Math.min(Number(state.activeMorning.index)||0,state.steps.length-1),startedAt:state.activeMorning.startedAt||Date.now(),completed:Array.isArray(state.activeMorning.completed)?state.activeMorning.completed:[],busy:false};
    }else{
      runtime={preview:false,index:0,startedAt:Date.now(),completed:[],busy:false};
      state.activeMorning={targetAt:state.locked.targetAt,index:0,startedAt:runtime.startedAt,completed:[]};save();
    }
    show('morningScreen');$('#modeLabel').textContent=preview?'PREVIEW / 記録しません':'MORNING AUTOPILOT';$('#breakBtn').classList.toggle('hidden',preview);document.body.style.setProperty('--dawn',.08);requestWakeLock();renderCommand();
  }
  function renderCommand(){
    const i=runtime.index;const step=state.steps[i];const total=state.steps.length;const pct=Math.round(i/total*100);runtime.busy=false;
    $('#doneBtn').disabled=false;$('#progressBar').style.setProperty('--progress',pct+'%');$('#stepBadge').textContent=i+1;$('#stepLabel').textContent=`STEP ${i+1} / ${total}`;$('#commandTitle').textContent=step.label;$('#commandHelp').textContent=step.help||'考えなくていい。これだけ。';$('#commandTime').textContent=`予定 ${commandSchedule()[i]}`;document.body.style.setProperty('--dawn',Math.min(.85,.08+i*.17));
  }
  function completeStep(){
    if(runtime.busy)return;runtime.busy=true;$('#doneBtn').disabled=true;
    const completedAt=Date.now();runtime.completed.push(completedAt);runtime.index++;
    if(!runtime.preview){state.activeMorning={targetAt:state.locked.targetAt,index:runtime.index,startedAt:runtime.startedAt,completed:[...runtime.completed]};save();}
    vibrate(30);
    if(runtime.index>=state.steps.length){finish('complete');return;}
    const command=$('.command');command.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});setTimeout(renderCommand,140);
  }
  function finish(status){
    try{wakeLock?.release?.();}catch{}wakeLock=null;const end=Date.now();
    if(runtime.preview){renderLocked();toast('プレビュー終了。記録していません');return;}
    const target=state.locked?.targetAt||end;const deltaMin=Math.round((end-target)/60000);
    const record={date:fmtDate(new Date(target)),targetAt:target,actualAt:end,deltaMin,status,completedSteps:runtime.completed.length,wakeTime:state.wakeTime};
    state.history.push(record);state.history=state.history.slice(-30);state.locked=null;state.activeMorning=null;save();renderResult(record);
  }
  function renderResult(record){
    show('resultScreen');const complete=record.status==='complete';$('#resultKicker').textContent=complete?'MORNING COMPLETE':'MORNING STOPPED';$('#resultTitle').innerHTML=complete?'朝の自分、<br>実行だけした。':'今日は、<br>ここまで。';
    $('#resultCopy').textContent=complete?`5つの判断を朝にやり直さず、そのまま実行しました。予定との差は ${formatDelta(record.deltaMin)}。`:`${record.completedSteps}/5ステップまで実行しました。止めたことではなく、どこまで進んだかだけ残します。`;
    $('#plannedAt').textContent=fmtTime(new Date(record.targetAt));$('#actualAt').textContent=fmtTime(new Date(record.actualAt));
    const prev=[...state.history].reverse().find(x=>x!==record&&x.status==='complete');const cmp=$('#compare');
    if(complete&&prev){const gain=prev.deltaMin-record.deltaMin;cmp.classList.remove('hidden');cmp.textContent=gain>0?`前回より ${Math.abs(gain)}分、予定との差が縮まりました。`:gain<0?`前回より ${Math.abs(gain)}分広がりました。次は1分だけ縮めればOK。`:'前回と同じ差。まず再現できています。';}else cmp.classList.add('hidden');
    document.body.style.setProperty('--dawn',.95);
  }
  function formatDelta(n){if(n===0)return '±0分';return n>0?`+${n}分`:`${n}分`;}
  function breakFlow(){if(runtime.busy)return;$('#breakDialog').showModal();}
  function editAfterResult(){state.locked=null;state.activeMorning=null;save();renderSetup();}
  function relockSame(){renderSetup();setTimeout(()=>lockPlan(true),0);}
  async function shareResult(){
    const last=state.history.at(-1);if(!last)return;
    const text=last.status==='complete'?`今朝の離床：予定との差 ${formatDelta(last.deltaMin)}\n「朝の自分に決めさせない」`:`今朝は ${last.completedSteps}/5 ステップまで。\n「朝の自分に決めさせない」`;const url=location.origin+location.pathname;
    try{if(navigator.share){await navigator.share({title:'朝の自分に決めさせない',text,url});}else{await navigator.clipboard.writeText(`${text}\n${url}`);toast('結果をコピーしました');}}catch{}
  }
  function escapeHtml(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function escapeAttr(v){return escapeHtml(v);}

  $('#wakeTime').addEventListener('input',renderTimeline);
  $('#editToggle').addEventListener('click',()=>{$('#editor').classList.toggle('show');$('#editToggle').textContent=$('#editor').classList.contains('show')?'編集を閉じる':'行動だけ変える';});
  $('#lockBtn').addEventListener('click',()=>lockPlan(false));
  $('#previewBtn').addEventListener('click',()=>startMorning(true));
  $('#unlockBtn').addEventListener('click',unlock);
  $('#doneBtn').addEventListener('click',completeStep);
  $('#breakBtn').addEventListener('click',breakFlow);
  $('#morningExit').addEventListener('click',breakFlow);
  $('#keepGoing').addEventListener('click',()=>$('#breakDialog').close());
  $('#confirmBreak').addEventListener('click',()=>{$('#breakDialog').close();finish('broken');});
  $('#samePlanBtn').addEventListener('click',relockSame);
  $('#editPlanBtn').addEventListener('click',editAfterResult);
  $('#shareBtn').addEventListener('click',shareResult);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!wakeLock&&!$('#morningScreen').classList.contains('hidden'))requestWakeLock();});

  if(state.activeMorning&&!activeMorningIsValid()){state.activeMorning=null;save();}
  if(state.locked){if(activeMorningIsValid()||isMorningWindow())startMorning(false);else renderLocked();}else renderSetup();
})();
