(() => {
  'use strict';

  const AGENTS = [
    { id:'self', name:'自分', short:'自', role:'最終判断', color:'#57e5ff', unlock:0, speed:1.0 },
    { id:'tanaka', name:'田中', short:'田', role:'数字・運用', color:'#ffc863', unlock:1, speed:1.15 },
    { id:'ai', name:'AI', short:'AI', role:'下書き・整理', color:'#bafc72', unlock:3, speed:2.1 },
    { id:'boss', name:'上司', short:'上', role:'相談・優先順位', color:'#b896ff', unlock:6, speed:3.0 },
    { id:'outsource', name:'外注', short:'外', role:'制作・専門', color:'#ff8db4', unlock:8, speed:1.35 }
  ];

  const TASKS = [
    task('morning-check','📊','今日の売上を確認','昨日との差を見るだけ。まずは仕事の流れをつかもう。',24,'今日 09:30','LOW',{self:3,tanaka:2,ai:2,boss:0,outsource:0},['ops'],{forced:'self'}),
    task('sales-breakdown','🧮','先週の売上を商品別に集計','CSVはある。数字に強い人ならすぐ終わる。',70,'今日 11:00','LOW',{self:1,tanaka:3,ai:2,boss:0,outsource:1},['data','ops']),
    task('reply','✉️','重要顧客への返信','関係性がある相手。最後の言葉選びは雑にできない。',45,'今日 10:30','HIGH',{self:3,tanaka:1,ai:1,boss:1,outsource:0},['judgment','relationship']),
    task('deck-draft','📝','会議資料のたたき台','白紙から構成を作る。完成品ではなく、まず骨組みがほしい。',90,'今日 13:00','MID',{self:1,tanaka:1,ai:3,boss:1,outsource:1},['draft','text']),
    task('images','🖼️','商品画像30枚をリサイズ','同じ作業を30回。判断はほぼいらない。',110,'今日 15:00','LOW',{self:0,tanaka:1,ai:2,boss:0,outsource:3},['repetitive','design']),
    task('weekly-report','📈','週次レポートを作成','数字をまとめて、先週との差を3行で説明する。',95,'今日 14:00','MID',{self:1,tanaka:3,ai:3,boss:0,outsource:1},['data','text']),
    task('scope','🧭','新施策、どこまで作る？','「とりあえず全部」と言われた。目的と優先順位が曖昧。',150,'今日 17:00','HIGH',{self:1,tanaka:0,ai:0,boss:3,outsource:0},['ambiguity','priority'],{bossReduce:true}),
    task('banner','🎨','キャンペーンバナーを制作','コピーは決まっている。あとは見た目を仕上げる。',100,'今日 16:00','MID',{self:0,tanaka:0,ai:1,boss:0,outsource:3},['design']),
    task('big-plan','🧱','新規事業計画を作る','市場、数字、構成、判断が全部混ざった巨大タスク。',240,'明日 10:00','HIGH',{self:1,tanaka:1,ai:1,boss:2,outsource:1},['huge','strategy'],{splittable:true,parts:['market-part','numbers-part','decision-part']}),
    task('market-part','🔎','市場と競合を10社調べる','新規事業計画の材料。事実を広く集めたい。',90,'今日 16:30','LOW',{self:1,tanaka:2,ai:3,boss:0,outsource:1},['research','data'],{subtask:true}),
    task('numbers-part','📐','売上モデルの数字を置く','粗い仮説でよい。計算と表の形まで作る。',80,'今日 16:30','MID',{self:1,tanaka:3,ai:2,boss:0,outsource:1},['data'],{subtask:true}),
    task('decision-part','🎯','最後に方針を1つ決める','材料は揃った。何をやるかだけは責任を持って決める。',35,'今日 17:00','HIGH',{self:3,tanaka:0,ai:0,boss:2,outsource:0},['judgment','strategy'],{subtask:true}),
    task('csv','🧹','商品CSVを整形','列名をそろえ、不要行を削除する。ルールは明確。',75,'今日 15:30','LOW',{self:0,tanaka:3,ai:3,boss:0,outsource:1},['data','repetitive']),
    task('complaint','☎️','クレームの最終判断','返金するか、交換するか。顧客と会社の両方に責任がある。',50,'今日 14:30','HIGH',{self:3,tanaka:1,ai:0,boss:2,outsource:0},['judgment','relationship']),
    task('priority','🗂️','来月の優先順位を決める','全部やると破綻する。何を捨てるか決める必要がある。',70,'今日 17:00','HIGH',{self:2,tanaka:0,ai:0,boss:3,outsource:0},['priority','strategy'],{bossReduce:true}),
    task('lp','🪄','LPのデザインを修正','訴求は決まった。スマホの見た目を整えたい。',120,'明日 12:00','MID',{self:0,tanaka:0,ai:1,boss:0,outsource:3},['design']),
    task('research','🌐','競合の新機能を整理','記事と公式ページを集め、違いを一覧にする。',100,'今日 17:30','LOW',{self:1,tanaka:2,ai:3,boss:0,outsource:1},['research','text']),
    task('minutes','🗒️','1時間の会議メモを議事録にする','発言を整理し、決定事項とTODOだけ抜き出す。',80,'今日 18:00','LOW',{self:1,tanaka:2,ai:3,boss:0,outsource:1},['text','repetitive']),
    task('price','💴','価格改定の最終判断','数字は揃った。値上げするか据え置くか、責任を持って決める。',45,'今日 18:00','HIGH',{self:3,tanaka:1,ai:0,boss:2,outsource:0},['judgment','strategy']),
    task('board','🎙️','役員会プレゼンを準備','調査・数字・資料・最終メッセージが混ざっている。',210,'明日 09:00','HIGH',{self:1,tanaka:1,ai:1,boss:2,outsource:1},['huge','judgment'],{splittable:true,parts:['board-research','board-draft','board-final']}),
    task('board-research','📚','役員会用の根拠を集める','数字と事例を揃える。材料集めが中心。',70,'今日 18:00','MID',{self:1,tanaka:3,ai:3,boss:0,outsource:1},['research','data'],{subtask:true}),
    task('board-draft','🧾','役員会資料の骨組みを作る','10枚の構成案と各ページの一言を作る。',80,'今日 18:00','MID',{self:1,tanaka:1,ai:3,boss:1,outsource:1},['draft','text'],{subtask:true}),
    task('board-final','🗣️','最後のメッセージを決める','何を決めてほしいのか、一文にする。',30,'今日 18:20','HIGH',{self:3,tanaka:0,ai:0,boss:2,outsource:0},['judgment'],{subtask:true}),
    task('fire','🔥','突然の炎上案件','締切・担当・優先順位が全部あいまい。まず一人で走るべき？',180,'今すぐ','CRITICAL',{self:0,tanaka:0,ai:0,boss:3,outsource:0},['ambiguity','priority'],{bossReduce:true,final:true})
  ];

  const BASE_QUEUE = ['morning-check','sales-breakdown','reply','deck-draft','images','weekly-report','scope','banner','big-plan','csv','complaint','priority','lp','research','minutes','price','board','fire'];
  const TASK_BY_ID = new Map(TASKS.map(t => [t.id,t]));

  function task(id,icon,title,detail,effort,deadline,risk,fit,tags,extra={}){
    return {id,icon,title,detail,effort,deadline,risk,fit,tags,...extra};
  }

  const $ = id => document.getElementById(id);
  const els = {
    app:$('app'),time:$('timeValue'),trust:$('trustValue'),fatigue:$('fatigueValue'),wip:$('wipValue'),trustBar:$('trustBar'),fatigueBar:$('fatigueBar'),wipBar:$('wipBar'),
    workspace:$('workspace'),teamStage:$('teamStage'),clutter:$('clutter'),taskCard:$('taskCard'),taskType:$('taskType'),taskDeadline:$('taskDeadline'),taskIcon:$('taskIcon'),taskTitle:$('taskTitle'),taskDetail:$('taskDetail'),taskEffort:$('taskEffort'),taskRisk:$('taskRisk'),fitHint:$('fitHint'),split:$('splitButton'),
    feedback:$('feedback'),feedbackLabel:$('feedbackLabel'),feedbackText:$('feedbackText'),help:$('helpButton'),dock:$('agentDock'),microcopy:$('microcopy'),turn:$('turnLabel'),phase:$('phaseLabel'),progress:$('progressBar'),sound:$('soundButton'),
    intro:$('introModal'),start:$('startButton'),result:$('resultModal'),resultBadge:$('resultBadge'),resultLabel:$('resultLabel'),resultTitle:$('resultTitle'),resultText:$('resultText'),hoard:$('hoardScore'),finalTrust:$('finalTrust'),finalFatigue:$('finalFatigue'),resultGrid:$('resultGrid'),lesson:$('lessonBox'),retry:$('retryButton'),share:$('shareButton'),toast:$('toast')
  };

  let audio = null;
  let state;
  let toastTimer;
  let locked = false;

  function initialState(){
    return {
      minute: 9*60, trust:75, fatigue:8, turn:0, queue:[...BASE_QUEUE], jobs:[], decisions:[],
      budget:4, sound:true, splitCount:0, helpCount:0, delegated:0, selfAssigned:0, goodDecisions:0,
      aiCount:0, consultCount:0, tanakaCount:0, outsourceCount:0, misses:0, completed:0, resultShown:false
    };
  }

  function reset(){
    state = initialState();
    locked = false;
    els.result.classList.remove('show');
    renderTeam(); renderDock(); render();
  }

  function currentTask(){ return TASK_BY_ID.get(state.queue[0]); }
  function agentById(id){ return AGENTS.find(a=>a.id===id); }
  function isUnlocked(agent){ return state.turn >= agent.unlock; }
  function loadFor(id){ return state.jobs.filter(j=>j.agent===id).length; }
  function selfWip(){ return loadFor('self'); }

  function renderTeam(){
    els.teamStage.innerHTML = AGENTS.map(a => `
      <div class="team-person" id="team-${a.id}" style="--person:${a.color}">
        <div class="person-head">${a.short}</div>
        <span class="person-name">${a.name}</span>
        <span class="person-load" aria-hidden="true">${'<i></i>'.repeat(4)}</span>
      </div>`).join('');
  }

  function renderDock(){
    els.dock.innerHTML = AGENTS.map(a => `
      <button class="agent-button" id="agent-${a.id}" data-agent="${a.id}" style="--agent:${a.color}" type="button">
        <span class="mini-load">0</span><span class="avatar">${a.short}</span><b>${a.name}</b><small>${a.role}</small>
      </button>`).join('');
    els.dock.querySelectorAll('.agent-button').forEach(btn => btn.addEventListener('click', () => assign(btn.dataset.agent)));
  }

  function render(){
    const t = currentTask();
    renderHud(); renderAgents(); renderClutter();
    if (!t) { finish(); return; }

    els.taskType.textContent = t.subtask ? 'SUB TASK' : t.final ? 'EMERGENCY' : t.tags.includes('huge') ? 'BIG TASK' : 'TASK';
    els.taskDeadline.textContent = t.deadline;
    els.taskIcon.textContent = t.icon;
    els.taskTitle.textContent = t.title;
    els.taskDetail.textContent = t.detail;
    els.taskEffort.textContent = `${t.effort}分相当`;
    els.taskRisk.textContent = t.risk;
    els.fitHint.hidden = true; els.fitHint.textContent='';
    els.split.hidden = !t.splittable;
    const totalTurns = 18 + state.splitCount * 2;
    els.turn.textContent = `${Math.min(state.turn+1,totalTurns)} / ${totalTurns}`;
    els.progress.style.width = `${Math.min(100,state.turn/totalTurns*100)}%`;
    els.phase.textContent = phaseCopy();
    els.help.classList.toggle('needed', selfWip() >= 5 || t.final || t.bossReduce);
    els.microcopy.textContent = state.turn < 2 ? '最初は自分で処理できる。でも仕事は増えていく。' : selfWip() >= 5 ? 'WIPが危険域。これ以上、自分の机へ積むと速度と信用が落ちる。' : `外注枠 ${state.budget} / 4　・　担当の得意分野を見て振り分けよう。`;
    clearRecommendations();
  }

  function phaseCopy(){
    if (state.turn < 1) return 'まずは自分でやってみる';
    if (state.turn < 3) return '田中さんと並列で進める';
    if (state.turn < 6) return 'AIで下書きと整理を逃がす';
    if (state.turn < 9) return '分からない仕事は相談する';
    if (state.turn < 13) return '自分しかできない部分だけ残す';
    return 'チーム全体のWIPを守る';
  }

  function renderHud(){
    const wip = selfWip();
    els.time.textContent = formatTime(state.minute);
    els.trust.textContent = Math.round(state.trust);
    els.fatigue.textContent = Math.round(state.fatigue);
    els.wip.textContent = wip;
    els.trustBar.style.width = `${clamp(state.trust,0,100)}%`;
    els.fatigueBar.style.width = `${clamp(state.fatigue,0,100)}%`;
    els.fatigueBar.style.background = state.fatigue > 70 ? 'var(--red)' : state.fatigue > 40 ? 'var(--amber)' : 'var(--lime)';
    els.wipBar.style.width = `${clamp(wip/8*100,0,100)}%`;
    els.wipBar.style.background = wip > 5 ? 'var(--red)' : wip > 3 ? 'var(--amber)' : 'var(--cyan)';
    els.wip.closest('.metric').classList.toggle('hot', wip > 5);
    els.workspace.classList.toggle('overload', wip > 5);
  }

  function renderAgents(){
    AGENTS.forEach(a => {
      const load = loadFor(a.id);
      const team = $(`team-${a.id}`);
      const btn = $(`agent-${a.id}`);
      if (!team || !btn) return;
      const unlocked = isUnlocked(a);
      team.classList.toggle('unlocked',unlocked);
      team.classList.toggle('busy',load>0);
      team.classList.toggle('overloaded',load>=4);
      team.querySelectorAll('.person-load i').forEach((i,n)=>i.classList.toggle('on',n<Math.min(load,4)));
      btn.disabled = !unlocked || (a.id==='outsource' && state.budget<=0) || locked;
      btn.querySelector('.mini-load').textContent = load;
    });
  }

  function renderClutter(){
    const count = Math.min(10, selfWip()+Math.floor(state.fatigue/28));
    const words = ['未返信','締切','確認','資料','TODO','あとで','急ぎ','修正','会議','集計'];
    els.clutter.innerHTML = Array.from({length:count},(_,i)=>{
      const left = [3,82,9,75,1,87,14,71,5,80][i%10];
      const top = [48,51,67,70,35,39,82,84,59,29][i%10];
      const rot = [-13,9,7,-9,16,-17,5,13,-5,11][i%10];
      return `<span class="clutter-note" style="left:${left}%;top:${top}%;transform:rotate(${rot}deg)">${words[i%words.length]}</span>`;
    }).join('');
  }

  function assign(agentId){
    if (locked) return;
    const t = currentTask(); const a = agentById(agentId);
    if (!t || !a || !isUnlocked(a)) return;
    if (t.forced && t.forced !== agentId){ toast('最初の1件は自分で処理してみよう'); return; }
    if (agentId==='outsource' && state.budget<=0){ toast('外注枠を使い切っています'); return; }

    locked = true; renderAgents();
    const fit = t.fit[agentId] ?? 0;
    const beforeWip = selfWip();

    if (agentId === 'boss') {
      state.consultCount++;
      state.trust += fit>=2 ? 2 : -1;
      const reduced = t.bossReduce || fit===3;
      if (reduced) {
        state.completed++;
        state.goodDecisions++;
        state.decisions.push({task:t.id,agent:agentId,fit,consult:true});
        state.queue.shift();
        feedback('good','相談で仕事が小さくなった', t.bossReduce ? '目的が整理され、「全部やる」が消えた。自分のWIPは増えていない。' : '判断だけ上司に借りて、迷う時間を消した。');
        flyCard(agentId, ()=>afterDecision(10));
      } else {
        state.decisions.push({task:t.id,agent:agentId,fit,consult:true});
        feedback(fit>=2?'good':'bad','相談した',fit>=2?'判断の迷いを先に潰せた。':'これは相談より実作業向き。上司の時間を使った。');
        flyCard(agentId, ()=>{ state.queue.shift(); afterDecision(10); });
      }
      tone(fit>=2?540:220,.08); return;
    }

    if (agentId==='outsource') { state.budget--; state.outsourceCount++; }
    if (agentId==='ai') state.aiCount++;
    if (agentId==='tanaka') state.tanakaCount++;
    if (agentId==='self') state.selfAssigned++; else state.delegated++;

    const load = loadFor(agentId);
    const efficiency = efficiencyFor(t,a,fit,load);
    const remaining = Math.max(10, Math.round(t.effort / efficiency));
    const outcome = outcomeFor(t,agentId,fit,load);
    state.jobs.push({task:t.id,agent:agentId,remaining,fit,outcome,title:t.title});
    state.decisions.push({task:t.id,agent:agentId,fit});
    state.queue.shift();

    if (fit >= 3 && load < 3) { state.goodDecisions++; feedback('good',agentId==='self'?'自分が持つべき仕事':'机から仕事が消えた',goodCopy(t,a,remaining)); }
    else if (fit >= 2) { feedback('good','十分いい振り分け',`${a.name}が処理開始。${remaining}分相当で完了予定。`); }
    else { state.misses++; feedback('bad','その担当だと重い',badCopy(t,a)); }

    flyCard(agentId, ()=>afterDecision(12));
    tone(fit>=2?620:190,.075);
    if (beforeWip <= 5 && agentId==='self' && selfWip()>5) setTimeout(()=>toast('脳内WIPが危険域に入りました'),240);
  }

  function efficiencyFor(t,a,fit,load){
    let e = a.speed * (fit===3?1.55:fit===2?1.05:fit===1?.66:.42);
    if (load>=3) e *= .72;
    if (a.id==='self') e *= Math.max(.45,1-state.fatigue/145);
    if (a.id==='ai' && (t.tags.includes('judgment')||t.tags.includes('relationship'))) e *= .55;
    return Math.max(.28,e);
  }

  function outcomeFor(t,agentId,fit,load){
    let trustDelta = fit===3?2:fit===2?1:fit===1?-2:-5;
    if (load>=4) trustDelta -= 2;
    if (agentId==='ai' && t.tags.includes('judgment')) trustDelta -= 4;
    if (agentId==='tanaka' && load>=3) trustDelta -= 2;
    return {trustDelta};
  }

  function goodCopy(t,a,remaining){
    if (a.id==='ai') return `AIが下書き・整理を開始。${remaining}分相当まで圧縮。あなたの机は増えない。`;
    if (a.id==='tanaka') return `田中さんの得意分野。並列処理で${remaining}分相当。あなたは別の判断へ進める。`;
    if (a.id==='outsource') return `専門作業を外へ。外注枠は減るが、あなたのWIPは増えない。`;
    return `これは責任を持って自分でやる価値がある。抱える仕事を選べている。`;
  }
  function badCopy(t,a){
    if (a.id==='self') return '自分でもできる。でも「できる」と「自分がやるべき」は違う。';
    if (a.id==='ai') return 'AIは速いが、関係性や最終責任の判断は苦手。';
    if (a.id==='tanaka') return '田中さんに渡せるが、得意分野ではない。説明コストが重い。';
    if (a.id==='outsource') return '外注できるが、ここは判断の文脈が強すぎる。';
    return '相談先と実作業の担当先を分けて考えよう。';
  }

  function afterDecision(minutes){
    advance(minutes);
    state.turn++;
    unlockNotice();
    els.taskCard.className='task-card';
    locked=false;
    render();
  }

  function advance(minutes){
    state.minute += minutes;
    const wipBefore = selfWip();
    state.jobs.forEach(j => {
      const agent = agentById(j.agent);
      let tick = minutes * (agent.id==='self' ? Math.max(.5,1-state.fatigue/140) : 1);
      j.remaining -= tick;
    });
    const done = state.jobs.filter(j=>j.remaining<=0);
    state.jobs = state.jobs.filter(j=>j.remaining>0);
    done.forEach(j=>{
      state.completed++;
      state.trust += j.outcome.trustDelta;
      if (j.agent==='self') state.fatigue += 2.4;
    });
    const self = selfWip();
    state.fatigue += self*1.15 + Math.max(0,self-5)*2.4;
    if (self<=2) state.fatigue -= 1.4;
    if (self>5) state.trust -= (self-5)*.8;
    if (state.minute > 17*60) { state.fatigue += 2; state.trust -= .5; }
    if (wipBefore>self && self<=3) state.fatigue -= 1;
    state.trust = clamp(state.trust,0,100); state.fatigue=clamp(state.fatigue,0,100);
  }

  function splitCurrent(){
    if (locked) return;
    const t=currentTask(); if(!t?.splittable) return;
    state.queue.shift();
    state.queue.unshift(...t.parts);
    state.splitCount++;
    feedback('good','巨大タスクを分解した','「全部を自分でやる」から、「材料・数字・判断」へ。担当を変えられるようになった。');
    toast('3つの小さな仕事に分かれました'); tone(720,.10); render();
  }

  function askHelp(){
    const t=currentTask(); if(!t) return;
    state.helpCount++;
    clearRecommendations();
    let best = Object.entries(t.fit).filter(([id])=>isUnlocked(agentById(id)) && !(id==='outsource'&&state.budget<=0)).sort((a,b)=>b[1]-a[1]);
    const topScore=best[0]?.[1]??0; const ids=best.filter(([,s])=>s===topScore).map(([id])=>id);
    ids.forEach(id=>$(`agent-${id}`)?.classList.add('recommended'));
    els.fitHint.hidden=false;
    if(t.splittable){
      els.fitHint.textContent='ヒント：この仕事は「誰に渡すか」より先に、分解すると強い。';
      els.split.classList.add('recommended');
    } else if(t.bossReduce || t.final){
      els.fitHint.textContent='ヒント：目的・優先順位が曖昧な仕事は、走る前に相談すると小さくなる。';
    } else {
      els.fitHint.textContent=`ヒント：${ids.map(id=>agentById(id).name).join(' / ')} がこの仕事の得意担当。`;
    }
    feedback('good','「助けて」で選択肢を増やした','詰まってから耐えるのではなく、早めに助け方を選べる。');
    tone(460,.06);
  }

  function clearRecommendations(){
    els.dock.querySelectorAll('.recommended').forEach(x=>x.classList.remove('recommended'));
    els.split.classList.remove('recommended');
  }

  function unlockNotice(){
    const unlocked = AGENTS.find(a=>a.unlock===state.turn);
    if (!unlocked) return;
    const copy = {
      tanaka:'田中さんが合流。数字・運用を並列で進められる。',
      ai:'AIが解放。下書き・整理・調査を高速で逃がせる。',
      boss:'上司に相談できる。曖昧な巨大タスクを小さくできる。',
      outsource:'外注が解放。制作・専門作業を予算と交換で手放せる。'
    }[unlocked.id];
    toast(copy); tone(760,.09);
  }

  function flyCard(agentId,done){
    els.taskCard.classList.add(`fly-${agentId}`);
    setTimeout(done,230);
  }

  function feedback(kind,label,text){
    els.feedback.className=`feedback ${kind||''}`;
    els.feedbackLabel.textContent=label.toUpperCase();
    els.feedbackText.textContent=text;
  }

  function finish(){
    if (state.resultShown) return;
    state.resultShown=true;
    for(let i=0;i<12 && state.jobs.length;i++) advance(15);
    const totalAssigned = Math.max(1,state.selfAssigned+state.delegated);
    const hoard = Math.round(state.selfAssigned/totalAssigned*100);
    const delegationRate = Math.round(state.delegated/totalAssigned*100);
    const accuracy = Math.round(state.goodDecisions/Math.max(1,state.decisions.length)*100);
    const profile = profileFor(hoard,accuracy,state.consultCount,state.aiCount);

    els.resultBadge.textContent=profile.badge;
    els.resultLabel.textContent=profile.label;
    els.resultTitle.textContent=profile.title;
    els.resultText.textContent=profile.text;
    els.hoard.textContent=`${hoard}%`;
    els.finalTrust.textContent=Math.round(state.trust);
    els.finalFatigue.textContent=Math.round(state.fatigue);
    els.resultGrid.innerHTML=[
      ['委任率',`${delegationRate}%`],['AI活用',`${state.aiCount}件`],['相談',`${state.consultCount}回`],['分解',`${state.splitCount}回`],['田中',`${state.tanakaCount}件`],['外注',`${state.outsourceCount}件`],['助けて',`${state.helpCount}回`],['適材適所',`${accuracy}%`]
    ].map(([k,v])=>`<div><small>${k}</small><strong>${v}</strong></div>`).join('');
    els.lesson.innerHTML=`<small>NEXT REFLEX</small><p>${lessonFor(hoard,state)}</p>`;
    els.result.classList.add('show');
    try{localStorage.setItem('help-me:last',JSON.stringify({hoard,trust:Math.round(state.trust),fatigue:Math.round(state.fatigue),profile:profile.title}));}catch(e){}
    tone(840,.16);
  }

  function profileFor(hoard,accuracy,consult,ai){
    if (hoard>=62) return {badge:'▣',label:'抱え込み型',title:'一人エース',text:'処理能力は高い。でも仕事が増えた瞬間に、自分の机がボトルネックになる。次は「自分でもできる仕事」を1つ外へ逃がしてみよう。'};
    if (accuracy<45) return {badge:'↺',label:'丸投げ型',title:'振り分け実験家',text:'抱え込まない姿勢は強い。ただし頼れば全部正解ではない。得意分野・責任・相手のWIPまで見ると一段強くなる。'};
    if (consult===0) return {badge:'?',label:'自己完結型',title:'静かな分散型',text:'実作業はかなり分散できている。次の壁は「分からないまま走らない」。相談は作業ではなく、仕事そのものを小さくする技術。'};
    if (ai>=4 && hoard<=38) return {badge:'⌁',label:'拡張型',title:'AI＋チーム指揮官',text:'自分は最終判断に残り、下書き・数字・制作を外へ流せている。人とAIを同じ「助け方の選択肢」として使えている。'};
    return {badge:'↗',label:'分散型',title:'助け上手リーダー',text:'自分しかできない仕事だけを残し、他は適切な場所へ流せている。抱え込まないことが、速度と信用の両方につながった。'};
  }

  function lessonFor(hoard,s){
    if (hoard>55) return '次に仕事が来た瞬間、「自分でできる？」ではなく「自分がやるべき？」を先に問う。';
    if (s.consultCount<2) return '次は、曖昧な仕事ほど着手前に10分相談する。8時間の仕事が2時間になることがある。';
    if (s.splitCount===0) return '巨大な仕事は丸ごと任せず、材料集め・作業・最終判断に分ける。自分は判断だけ残せる。';
    return '現実でもWIPを3件以内に保ち、超えそうなら「AI・人・相談・外注・分解」を1つ使う。';
  }

  function start(){
    els.intro.classList.remove('show');
    ensureAudio(); tone(520,.08); reset();
  }
  function retry(){ reset(); els.result.classList.remove('show'); tone(520,.08); }
  async function share(){
    const text=`『助けて』結果：${els.resultTitle.textContent}｜抱え込み度 ${els.hoard.textContent}｜信用 ${els.finalTrust.textContent}｜疲労 ${els.finalFatigue.textContent}`;
    try{await navigator.clipboard.writeText(text);toast('結果をコピーしました');}catch(e){toast(text);}
  }
  function toggleSound(){ state.sound=!state.sound; els.sound.textContent=state.sound?'SOUND ON':'SOUND OFF'; if(state.sound) tone(520,.05); }

  function toast(text){ clearTimeout(toastTimer); els.toast.textContent=text; els.toast.classList.add('show'); toastTimer=setTimeout(()=>els.toast.classList.remove('show'),1800); }
  function formatTime(min){ const h=Math.floor(min/60)%24,m=Math.floor(min%60);return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function ensureAudio(){ if(!audio) try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} }
  function tone(freq,duration){ if(!state?.sound) return; ensureAudio(); if(!audio) return; try{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.035,audio.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.02);}catch(e){} }

  els.start.addEventListener('click',start);
  els.split.addEventListener('click',splitCurrent);
  els.help.addEventListener('click',askHelp);
  els.retry.addEventListener('click',retry);
  els.share.addEventListener('click',share);
  els.sound.addEventListener('click',toggleSound);

  reset();
})();
