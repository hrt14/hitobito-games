(() => {
  const STORAGE_KEY = 'levelup:energy-bucket:v1';
  const leaks = [
    {key:'morningTired',label:'朝起きた時点ですでに疲れている',short:'朝から疲れている',stage:'回復を守る',priority:74,plug:'明日の起床時刻を先に決める',trigger:'今夜、アラームをセットするとき',action:'明日の起床時刻を1つ決めて、その時刻で起きる',why:'いきなり睡眠を完璧にせず、まず毎日のリズムを観察できる形にします。強い疲れが続く場合は生活習慣だけで決めつけません。'},
    {key:'postLunchSleepy',label:'昼食の後に猛烈に眠くなる',short:'昼食後の眠気',stage:'穴を塞ぐ',priority:100,plug:'食後2分だけ歩く',trigger:'昼食を食べ終えたら',action:'その場を離れて、2分だけ軽く歩く',why:'座り続けるより短い軽歩行をはさむ方が、食後の血糖・インスリン反応を小さくする方向の研究があります。2分は続けるための最小単位です。'},
    {key:'mondayHeavy',label:'休日にたくさん寝ても月曜がしんどい',short:'月曜が重い',stage:'回復を守る',priority:68,plug:'休日の起床差を少しだけ縮める',trigger:'次の休日にアラームを決めるとき',action:'いつもの休日より30分だけ早い時刻に起きる',why:'いきなり平日と同じ時刻にせず、生活リズムの差を小さく観察する実験にします。'},
    {key:'stairsBreathless',label:'駅の階段を登ると息が切れる',short:'階段で息が切れる',stage:'安全確認',priority:120,plug:'負荷を足す前に、息切れを確認する',trigger:'階段で息切れが繰り返す・強くなると感じたら',action:'無理に運動量を増やさず、必要に応じて医療機関へ相談する',why:'息切れには体力以外の原因もあります。急な悪化や胸の痛み、強いめまいなどがある場合は「鍛える」より安全確認を優先します。'},
    {key:'eveningFog',label:'夕方には頭が働かなくなる',short:'夕方に頭が止まる',stage:'穴を塞ぐ',priority:86,plug:'午後に2分だけ席を離れる',trigger:'15時になったら',action:'2分だけ立って歩き、座りっぱなしを切る',why:'夕方の不調を単一原因と決めつけず、まず長時間座り続ける状態を1回だけ切る小さな実験にします。'},
    {key:'longSitting',label:'座っている時間が1日6時間以上ある',short:'座りっぱなしが長い',stage:'穴を塞ぐ',priority:96,plug:'1回だけ座りっぱなしを切る',trigger:'午後、1時間以上座っていたと気づいたら',action:'2分だけ歩いてから席に戻る',why:'「毎時間必ず」から始めず、明日は1回成功させることだけを狙います。'},
    {key:'workRumination',label:'休んでいるはずなのに仕事のことを考えている',short:'休んでも仕事が頭に残る',stage:'回復を守る',priority:79,plug:'仕事の続きを頭の外に置く',trigger:'仕事を終える直前',action:'明日の最初の一手を1行だけメモして、そこで仕事を閉じる',why:'「考えないようにする」のではなく、続きを頭の外に置いて終了線を作ります。'},
    {key:'wakeGap',label:'平日と休日で起きる時間が2時間以上違う',short:'起床時刻の差が大きい',stage:'回復を守る',priority:82,plug:'起床差を30分だけ縮める',trigger:'次の休日のアラームを決めるとき',action:'普段の休日より30分だけ平日に近い時刻にする',why:'一気に同じ時刻へ変えず、続けられる幅で生活リズムの差を小さくします。'},
    {key:'nightPhone',label:'疲れているのに夜スマホを見るのをやめられない',short:'夜スマホが止まらない',stage:'回復を守る',priority:90,plug:'スマホを意志ではなく場所で止める',trigger:'歯を磨き終えたら',action:'スマホをベッドから手の届かない充電場所へ置く',why:'疲れた夜に「見るかどうか」を判断させず、毎晩来る合図と行動を先に結びます。'},
    {key:'noExercise',label:'運動しなきゃと思いながら何週間も何もできていない',short:'運動がゼロのまま',stage:'容量を育てる',priority:88,plug:'運動を2分まで小さくする',trigger:'昼食を食べ終えたら',action:'運動着に着替えず、そのまま2分だけ歩く',why:'ジムや30分運動ではなく、毎日来る合図に最小の運動を結びます。まず入口を作ります。'}
  ];

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const state = {selected:[],active:null,saved:null,step:'check'};
  const views = {check:$('#checkView'),choose:$('#chooseView'),plan:$('#planView'),done:$('#doneView')};

  function vibrate(pattern){ try{ navigator.vibrate?.(pattern); }catch{} }
  function today(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function byKey(key){ return leaks.find(x=>x.key===key); }
  function saveLocal(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state.saved)); }catch{} }
  function loadLocal(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) state.saved=JSON.parse(raw); }catch{} }

  function showStep(step){
    state.step=step;
    Object.entries(views).forEach(([key,node])=>{ node.hidden=key!==step; node.classList.toggle('active',key===step); });
    $$('[data-progress]').forEach(node=>node.classList.toggle('active',node.dataset.progress===step));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function buildLeaks(){
    const grid=$('#leakGrid');
    leaks.forEach((item,i)=>{
      const b=document.createElement('button');
      b.type='button'; b.className='leak-card'; b.dataset.key=item.key; b.setAttribute('aria-pressed','false');
      b.innerHTML=`<span class="leak-number">${String(i+1).padStart(2,'0')}</span><strong>${item.label}</strong><span class="leak-state">当てはまる</span>`;
      b.addEventListener('click',()=>toggle(item.key,b)); grid.appendChild(b);
    });
  }

  function toggle(key,button){
    const exists=state.selected.includes(key);
    state.selected=exists?state.selected.filter(x=>x!==key):[...state.selected,key];
    button.classList.toggle('selected',!exists); button.setAttribute('aria-pressed',String(!exists));
    button.querySelector('.leak-state').textContent=!exists?'穴を発見':'当てはまる';
    updateBucket(); vibrate(10);
  }

  function updateBucket(){
    const count=state.selected.length; const level=Math.max(18,92-count*7.1);
    $('#water').style.height=`${level}%`; $('#waterNumber').textContent=String(Math.round(level));
    $('#leakCounter').textContent=`${count} / 10`; $('#bucketCaption').textContent=count?`穴 ${count}個を発見`:'今のバケツ';
    const layer=$('#holeLayer'); layer.innerHTML='';
    const positions=[[84,34],[14,55],[74,67],[22,78],[55,47],[46,82],[9,28],[90,83],[35,61],[65,25]];
    state.selected.slice(0,10).forEach((key,i)=>{ const dot=document.createElement('i'); dot.dataset.key=key; dot.style.left=`${positions[i][0]}%`; dot.style.top=`${positions[i][1]}%`; layer.appendChild(dot); });
    $('#safetyNote').hidden=!state.selected.includes('stairsBreathless');
    const go=$('#toChoose'); go.disabled=count===0; go.textContent=count?`${count}個の穴から、1個だけ塞ぐ →`:'まず1つタップ';
  }

  function renderRecommendations(){
    const list=state.selected.map(byKey).filter(Boolean).sort((a,b)=>b.priority-a.priority).slice(0,3); const box=$('#recommendations'); box.innerHTML='';
    list.forEach((item,i)=>{
      const b=document.createElement('button'); b.type='button'; b.className=`recommendation${i===0?' best':''}`; b.dataset.choose=item.key;
      b.innerHTML=`<div class="rank-row"><span>${i===0?'まずこれ':`候補 ${i+1}`}</span><small>${item.stage}</small></div><h2>${item.plug}</h2><p>${item.why}</p><div class="if-preview"><span>IF</span><strong>${item.trigger}</strong><span>THEN</span><strong>${item.action}</strong></div>`;
      b.addEventListener('click',()=>choose(item)); box.appendChild(b);
    });
  }

  function choose(item){
    state.active=item.key; $('#planLeakName').textContent=item.short; $('#triggerInput').value=item.trigger; $('#actionInput').value=item.action; updatePreview(); showStep('plan'); vibrate([20,30,20]);
  }
  function updatePreview(){ const a=$('#triggerInput').value.trim()||'合図'; const b=$('#actionInput').value.trim()||'小さな行動'; $('#rulePreview').innerHTML=`もし「<strong>${escapeHtml(a)}</strong>」なら、<br>「<strong>${escapeHtml(b)}</strong>」。`; }
  function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  function commitPlan(){
    const trigger=$('#triggerInput').value.trim(), action=$('#actionInput').value.trim(); if(!state.active||!trigger||!action)return;
    const previous=state.saved; state.saved={leak:state.active,trigger,action,createdAt:new Date().toISOString(),baselineCount:state.selected.length,completedDays:previous?.leak===state.active&&Array.isArray(previous.completedDays)?previous.completedDays:[],lastOutcome:'',lastOutcomeAt:''};
    saveLocal(); renderResult(); renderReturn(); showStep('done'); vibrate([30,40,60]);
  }

  function renderResult(){
    if(!state.saved)return; const item=byKey(state.saved.leak); $('#resultFraction').textContent=`1 / ${Math.max(1,state.saved.baselineCount||1)}`; $('#resultLeak').textContent=item?.short||''; $('#resultIf').textContent=state.saved.trigger; $('#resultThen').textContent=state.saved.action;
  }

  function renderReturn(){
    const card=$('#returnCard'); if(!state.saved){card.hidden=true;return;} const item=byKey(state.saved.leak); const days=Array.isArray(state.saved.completedDays)?state.saved.completedDays.length:0;
    $('#lastPlugTitle').textContent=item?.plug||''; $('#lastRule').textContent=`もし「${state.saved.trigger}」なら、「${state.saved.action}」。`; $('#lastCount').textContent=`成功 ${days}日。できなかった日は、合図か行動を小さくする材料。`; card.hidden=false;
  }

  function markOutcome(outcome){
    if(!state.saved)return; const days=Array.isArray(state.saved.completedDays)?[...state.saved.completedDays]:[]; const day=today(); if(outcome==='done'&&!days.includes(day))days.push(day); state.saved={...state.saved,completedDays:days,lastOutcome:outcome,lastOutcomeAt:new Date().toISOString()}; saveLocal(); renderReturn(); vibrate(outcome==='done'?[25,25,50]:15);
  }

  async function share(){
    if(!state.saved)return; const item=byKey(state.saved.leak); const text=`今日ふさぐ体力の穴：${item?.short||''}\nもし「${state.saved.trigger}」なら、「${state.saved.action}」。\nLEVEL UP`;
    try{ if(navigator.share){await navigator.share({title:'明日の体力プラグ',text,url:location.href});return;} await navigator.clipboard.writeText(`${text}\n${location.href}`); const b=$('#sharePlan'); b.textContent='コピーしました'; setTimeout(()=>b.textContent='結果をシェア',1600); }catch{}
  }

  function restart(){
    state.selected=[]; state.active=null; $$('.leak-card').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');b.querySelector('.leak-state').textContent='当てはまる';}); updateBucket(); showStep('check');
  }

  buildLeaks(); loadLocal(); renderReturn(); updateBucket();
  $('#toChoose').addEventListener('click',()=>{renderRecommendations();showStep('choose');vibrate(12);});
  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.back)));
  $('#triggerInput').addEventListener('input',updatePreview); $('#actionInput').addEventListener('input',updatePreview); $('#savePlan').addEventListener('click',commitPlan);
  $('#markDone').addEventListener('click',()=>markOutcome('done')); $('#markNotYet').addEventListener('click',()=>markOutcome('not-yet')); $('#sharePlan').addEventListener('click',share); $('#restart').addEventListener('click',restart);
  window.__ENERGY_BUCKET_TEST__={leaks,state,showStep};
})();
