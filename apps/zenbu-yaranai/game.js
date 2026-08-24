(()=>{
  'use strict';

  const app=document.querySelector('#app');
  const historyButton=document.querySelector('#historyButton');
  const resetButton=document.querySelector('#resetButton');
  const DRAFT_KEY='levelup-zenbu-yaranai-v3-draft';
  const HISTORY_KEY='levelup-zenbu-yaranai-v3-history';
  const APP_SLUG='zenbu-yaranai';
  const QA_MODE=new URLSearchParams(location.search).get('qa')==='1';
  const FOCUS_SECONDS=QA_MODE?2:25*60;

  const CHECKS=[
    '締切が近い未完了仕事が複数ある',
    '作業時間そのものが足りない',
    '出張・移動・会議などで自由時間が少ない',
    '複数の会社・案件を頻繁に切り替えている',
    'ミスが増えてきた',
    '仕事をしていない時間も仕事が頭に残っている',
    '「全部ちゃんとできない」と感じている',
    '毎日「今日は乗り切れるか」と不安になる'
  ];

  const DISCARD_OPTIONS=[
    '完璧な資料','詳細分析','見栄え','すべての論点','今日中の完成','全員を満足させること','自分で全部やること'
  ];

  const MINIMUM_EXAMPLES=[
    '最新数字を確認して、課題3つと次施策3つを出す',
    '資料10ページではなく、議題3つを用意する',
    '完璧な分析ではなく、現状把握と次回までの宿題を決める'
  ];

  const END_MESSAGES=[
    'やるべきことをやった。それで残らない仕事なら、それまで。',
    '全部を守る必要はない。残るものだけ残ればいい。',
    '今日の仕事は、人生全部ではない。',
    'できなかった仕事ではなく、処理した一件を見る。',
    '高負荷のときの正解は、速度ではなく順番。'
  ];

  const freshState=()=>({
    version:3,
    step:'check',
    checkIndex:0,
    checkAnswers:[],
    loadLevel:null,
    tasks:[''],
    selectedTaskIndex:null,
    minimumLine:'',
    discarded:[],
    discardOther:'',
    timerSessionCount:0,
    timerRunning:false,
    timerEndsAt:0,
    timerDurationSec:FOCUS_SECONDS,
    completion:null,
    completionMessage:0
  });

  let state=loadDraft()||freshState();
  let timerHandle=null;
  let historyOpen=false;
  let currentUser=null;
  let cloudReady=false;
  let cloudHistoryLoaded=false;
  let cloudHistoryLoading=false;
  let cloudUserId=null;

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'
    }[ch]));
  }

  function loadDraft(){
    try{
      const parsed=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(!parsed||parsed.version!==3)return null;
      return {...freshState(),...parsed};
    }catch{return null;}
  }

  function saveDraft(){
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(state));}catch{}
  }

  function loadLocalHistory(){
    try{
      const rows=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
      return Array.isArray(rows)?rows:[];
    }catch{return [];}
  }

  function saveLocalHistory(rows){
    try{localStorage.setItem(HISTORY_KEY,JSON.stringify(rows.slice(0,80)));}catch{}
  }

  function updateLocalRecord(id,patch){
    const rows=loadLocalHistory();
    const index=rows.findIndex(row=>row.id===id);
    if(index>=0){rows[index]={...rows[index],...patch};saveLocalHistory(rows);}
  }

  function localDateKey(date=new Date()){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,'0');
    const d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  function stepTop(number,title,copy){
    return `<div class="step-label">${number} / 7</div><div class="eyebrow">${escapeHtml(title)}</div>${copy?`<p class="helper">${escapeHtml(copy)}</p>`:''}`;
  }

  function backButton(label='戻る'){
    return `<div class="back-row"><button class="back-button" type="button" data-action="back">← ${escapeHtml(label)}</button></div>`;
  }

  function setStep(step){
    state.step=step;
    saveDraft();
    historyOpen=false;
    render();
  }

  function loadResult(){
    const score=state.checkAnswers.reduce((sum,n)=>sum+Number(n||0),0);
    if(score<=4)return {level:'GREEN',klass:'green',copy:'まだ通常運転可能。',detail:'今のうちに順番を決め、余白を残す。'};
    if(score<=9)return {level:'YELLOW',klass:'yellow',copy:'負荷が高い。仕事を増やさない。',detail:'全部を守ろうとせず、今日の処理対象を絞る。'};
    return {level:'RED',klass:'red',copy:'アクセルを踏む段階ではない。削ることを優先。',detail:'速度を上げるより、今やらないものを決める。'};
  }

  function renderCheck(){
    const i=Math.max(0,Math.min(CHECKS.length-1,state.checkIndex));
    app.innerHTML=`
      <section class="screen check-screen">
        <div class="eyebrow">仕事負荷セルフチェック</div>
        <h1>全部やらなくていい</h1>
        <p class="subtitle">高負荷のときほど、一個ずつ。</p>
        <div class="step-label">1 / 7</div>
        <div class="question-card">
          <div class="question-index">${i+1} / ${CHECKS.length}</div>
          <h2 data-testid="check-question">${escapeHtml(CHECKS[i])}</h2>
          <div class="answer-grid">
            <button type="button" data-answer="0">いいえ</button>
            <button type="button" data-answer="1">少し</button>
            <button type="button" data-answer="2">かなり</button>
          </div>
        </div>
      </section>`;
    app.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
      state.checkAnswers[i]=Number(button.dataset.answer);
      state.checkIndex=i+1;
      if(state.checkIndex>=CHECKS.length){
        const result=loadResult();
        state.loadLevel=result.level;
        state.step='checkResult';
      }
      saveDraft();
      render();
    }));
  }

  function renderCheckResult(){
    const result=loadResult();
    state.loadLevel=result.level;
    saveDraft();
    app.innerHTML=`
      <section class="screen">
        ${backButton('最後の質問へ')}
        ${stepTop(1,'いま、どれくらい重い？','これは仕事負荷のセルフチェックです。医療診断ではありません。')}
        <div class="panel level-${result.klass}">
          <div class="result-badge"><span class="result-dot"></span><strong data-testid="load-level">${result.level}</strong></div>
          <p class="result-copy">${escapeHtml(result.copy)}</p>
          <p class="helper">${escapeHtml(result.detail)}</p>
          <div class="actions"><button class="primary" type="button" data-action="to-tasks">一個ずつにする</button></div>
        </div>
      </section>`;
    app.querySelector('[data-action="to-tasks"]').onclick=()=>setStep('tasks');
    wireBack(()=>{
      state.checkIndex=CHECKS.length-1;
      state.checkAnswers=state.checkAnswers.slice(0,-1);
      state.step='check';
      saveDraft();render();
    });
  }

  function renderTasks(){
    if(!Array.isArray(state.tasks)||!state.tasks.length)state.tasks=[''];
    app.innerHTML=`
      <section class="screen">
        ${backButton()}
        ${stepTop(2,'全部書き出す','頭に残っている仕事を外へ出す。整理はまだしない。')}
        <div class="notice">全部を今日やる必要はない。</div>
        <div class="task-input-list" id="taskInputs">
          ${state.tasks.map((task,index)=>`
            <div class="task-input-row">
              <input data-testid="task-input" data-task-index="${index}" value="${escapeHtml(task)}" placeholder="例）木曜のA社コンサル準備" aria-label="仕事 ${index+1}">
              <button class="remove-task" type="button" data-remove-task="${index}" aria-label="仕事 ${index+1}を削除">×</button>
            </div>`).join('')}
        </div>
        <div class="inline-actions">
          <button class="voice-button" type="button" data-action="add-task">＋ 仕事を追加</button>
          <button class="voice-button" type="button" data-action="voice">🎙 話して追加</button>
        </div>
        <p class="helper" id="voiceHint">音声入力が使えない端末では、キーボードの音声入力でも追加できます。</p>
        <div class="actions"><button class="primary" type="button" data-action="tasks-next">一個だけ選ぶ</button></div>
      </section>`;

    app.querySelectorAll('[data-task-index]').forEach(input=>input.addEventListener('input',()=>{
      state.tasks[Number(input.dataset.taskIndex)]=input.value;
      saveDraft();
    }));
    app.querySelectorAll('[data-remove-task]').forEach(button=>button.onclick=()=>{
      const index=Number(button.dataset.removeTask);
      state.tasks.splice(index,1);
      if(!state.tasks.length)state.tasks=[''];
      saveDraft();renderTasks();
    });
    app.querySelector('[data-action="add-task"]').onclick=()=>{
      if(state.tasks.length<12){state.tasks.push('');saveDraft();renderTasks();requestAnimationFrame(()=>app.querySelectorAll('[data-task-index]')[state.tasks.length-1]?.focus());}
    };
    app.querySelector('[data-action="voice"]').onclick=startVoiceAdd;
    app.querySelector('[data-action="tasks-next"]').onclick=()=>{
      const cleaned=state.tasks.map(t=>String(t||'').trim()).filter(Boolean);
      if(!cleaned.length){flashNotice('仕事を1件だけ入れてください。');return;}
      state.tasks=cleaned;
      state.selectedTaskIndex=null;
      setStep('choose');
    };
    wireBack(()=>setStep('checkResult'));
  }

  function startVoiceAdd(){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const button=app.querySelector('[data-action="voice"]');
    if(!Recognition){flashNotice('このブラウザではアプリ内音声入力を使えません。キーボードのマイクを使ってください。');return;}
    const recognition=new Recognition();
    recognition.lang='ja-JP';
    recognition.interimResults=false;
    recognition.maxAlternatives=1;
    button.classList.add('listening');
    button.textContent='聞いています…';
    recognition.onresult=event=>{
      const text=event.results?.[0]?.[0]?.transcript?.trim();
      if(text){
        const empty=state.tasks.findIndex(t=>!String(t||'').trim());
        if(empty>=0)state.tasks[empty]=text;
        else if(state.tasks.length<12)state.tasks.push(text);
        saveDraft();renderTasks();
      }
    };
    recognition.onerror=()=>{flashNotice('音声を取れませんでした。もう一度試すか、キーボードで入力してください。');renderTasks();};
    recognition.onend=()=>button?.classList.remove('listening');
    recognition.start();
  }

  function renderChoose(){
    app.innerHTML=`
      <section class="screen">
        ${backButton()}
        ${stepTop(3,'一個だけ選ぶ','「一番重要」ではなく、今先に処理すると被害が減る一件。')}
        <div class="panel">
          <div class="mini-label">今、一番先に処理すると被害が減るものは？</div>
          <div class="task-list">
            ${state.tasks.map((task,index)=>`<button class="task-card" type="button" data-testid="task-choice" data-task-choice="${index}">${escapeHtml(task)}<small>これを今の一件にする</small></button>`).join('')}
          </div>
        </div>
      </section>`;
    app.querySelectorAll('[data-task-choice]').forEach(button=>button.onclick=()=>{
      state.selectedTaskIndex=Number(button.dataset.taskChoice);
      button.classList.add('selected');
      saveDraft();
      setTimeout(()=>setStep('minimum'),120);
    });
    wireBack(()=>setStep('tasks'));
  }

  function selectedTask(){
    return state.tasks[state.selectedTaskIndex]||state.tasks[0]||'';
  }

  function renderMinimum(){
    app.innerHTML=`
      <section class="screen">
        ${backButton()}
        ${stepTop(4,'最低成立ライン','100点ではなく、この仕事が成立する最低ラインを決める。')}
        <div class="focus-card"><div class="label">今の一件</div><strong>${escapeHtml(selectedTask())}</strong></div>
        <label class="mini-label" for="minimumInput">これだけできれば、この仕事は成立する。</label>
        <textarea class="minimum-input" id="minimumInput" data-testid="minimum-input" placeholder="例）最新数字を確認して、課題3つと次施策3つを出す">${escapeHtml(state.minimumLine)}</textarea>
        <div class="examples">
          ${MINIMUM_EXAMPLES.map((example,index)=>`<button class="example-button" type="button" data-example="${index}">${escapeHtml(example)}</button>`).join('')}
        </div>
        <div class="actions"><button class="primary" type="button" data-action="minimum-next">今回は何を諦める？</button></div>
      </section>`;
    const input=app.querySelector('#minimumInput');
    input.addEventListener('input',()=>{state.minimumLine=input.value;saveDraft();});
    app.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{
      state.minimumLine=MINIMUM_EXAMPLES[Number(button.dataset.example)];
      input.value=state.minimumLine;saveDraft();input.focus();
    });
    app.querySelector('[data-action="minimum-next"]').onclick=()=>{
      state.minimumLine=input.value.trim();
      if(!state.minimumLine){flashNotice('最低成立ラインを一行だけ決めてください。');return;}
      setStep('discard');
    };
    wireBack(()=>setStep('choose'));
  }

  function allDiscarded(){
    const out=[...state.discarded];
    const other=String(state.discardOther||'').trim();
    if(other)out.push(other);
    return out;
  }

  function renderDiscard(){
    const chosen=allDiscarded();
    app.innerHTML=`
      <section class="screen">
        ${backButton()}
        ${stepTop(5,'捨てる','今回は、何を諦める？ 先に決める。')}
        <div class="focus-card"><div class="label">最低成立ライン</div><strong>${escapeHtml(state.minimumLine)}</strong></div>
        <div class="discard-grid">
          ${DISCARD_OPTIONS.map(item=>`<button class="discard-chip ${state.discarded.includes(item)?'on':''}" type="button" data-discard="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('')}
        </div>
        <input class="other-input" id="discardOther" value="${escapeHtml(state.discardOther)}" placeholder="その他：今回はやらないこと">
        ${chosen.length?`<div class="no-do-card"><b>これは、やらない。</b><ul>${chosen.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`:''}
        <div class="actions"><button class="primary" type="button" data-action="discard-next">この一件だけ25分</button></div>
      </section>`;
    app.querySelectorAll('[data-discard]').forEach(button=>button.onclick=()=>{
      const item=button.dataset.discard;
      state.discarded=state.discarded.includes(item)?state.discarded.filter(x=>x!==item):[...state.discarded,item];
      saveDraft();renderDiscard();
    });
    const other=app.querySelector('#discardOther');
    other.addEventListener('input',()=>{state.discardOther=other.value;saveDraft();});
    app.querySelector('[data-action="discard-next"]').onclick=()=>{
      state.discardOther=other.value.trim();
      if(!allDiscarded().length){flashNotice('今回はやらないものを1つ決めてください。');return;}
      setStep('timer');
    };
    wireBack(()=>setStep('minimum'));
  }

  function renderTimer(){
    stopTick();
    if(state.timerRunning&&state.timerEndsAt<=Date.now()){
      state.timerRunning=false;state.timerEndsAt=0;state.step='outcome';saveDraft();return renderOutcome();
    }
    const remaining=state.timerRunning?Math.max(0,Math.ceil((state.timerEndsAt-Date.now())/1000)):state.timerDurationSec;
    const discarded=allDiscarded();
    app.innerHTML=`
      <section class="screen timer-screen">
        ${stepTop(6,'25分だけやる','他の仕事は表示しない。今の一件だけ。')}
        <div class="timer-task">${escapeHtml(selectedTask())}</div>
        <div class="timer-display" data-testid="timer-display">${formatTime(remaining)}</div>
        <div class="timer-progress"><i id="timerBar" style="width:${Math.max(0,Math.min(100,remaining/state.timerDurationSec*100))}%"></i></div>
        <div class="timer-meta">
          <div><span>最低成立ライン</span><strong>${escapeHtml(state.minimumLine)}</strong></div>
          <div><span>今回はやらない</span><strong>${discarded.map(escapeHtml).join(' / ')}</strong></div>
        </div>
        ${state.timerRunning
          ?`<button class="timer-stop" type="button" data-action="pause-timer">中断して戻る</button>`
          :`<div class="actions"><button class="primary" type="button" data-testid="timer-start" data-action="start-timer">この一件だけ25分</button><button class="secondary" type="button" data-action="timer-back">捨てるものを見直す</button></div>`}
        <p class="sync-note">セッション ${state.timerSessionCount}回</p>
      </section>`;
    if(state.timerRunning){
      app.querySelector('[data-action="pause-timer"]').onclick=pauseTimer;
      startTick();
    }else{
      app.querySelector('[data-action="start-timer"]').onclick=startTimer;
      app.querySelector('[data-action="timer-back"]').onclick=()=>setStep('discard');
    }
  }

  function startTimer(){
    state.timerSessionCount+=1;
    state.timerDurationSec=FOCUS_SECONDS;
    state.timerRunning=true;
    state.timerEndsAt=Date.now()+FOCUS_SECONDS*1000;
    state.step='timer';
    saveDraft();renderTimer();
  }

  function pauseTimer(){
    stopTick();
    state.timerRunning=false;
    state.timerEndsAt=0;
    saveDraft();renderTimer();
  }

  function startTick(){
    stopTick();
    timerHandle=setInterval(()=>{
      if(!state.timerRunning)return;
      const remaining=Math.max(0,Math.ceil((state.timerEndsAt-Date.now())/1000));
      const display=app.querySelector('[data-testid="timer-display"]');
      const bar=app.querySelector('#timerBar');
      if(display)display.textContent=formatTime(remaining);
      if(bar)bar.style.width=`${Math.max(0,Math.min(100,remaining/state.timerDurationSec*100))}%`;
      if(remaining<=0){
        stopTick();
        state.timerRunning=false;state.timerEndsAt=0;state.step='outcome';saveDraft();renderOutcome();
      }
    },250);
  }

  function stopTick(){if(timerHandle){clearInterval(timerHandle);timerHandle=null;}}
  function formatTime(seconds){const m=Math.floor(seconds/60),s=Math.max(0,seconds%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}

  function renderOutcome(){
    app.innerHTML=`
      <section class="screen">
        ${stepTop(6,'25分終了','次の判断も一個だけ。')}
        <div class="focus-card"><div class="label">今の一件</div><strong>${escapeHtml(selectedTask())}</strong></div>
        <div class="outcome-grid">
          <button class="outcome-button" type="button" data-testid="outcome-done" data-outcome="done"><strong>最低ライン達成</strong><small>この一件を閉じる</small></button>
          <button class="outcome-button" type="button" data-testid="outcome-more" data-outcome="more"><strong>もう25分必要</strong><small>同じ一件を続ける</small></button>
          <button class="outcome-button" type="button" data-testid="outcome-stop" data-outcome="stop"><strong>今日はここまで</strong><small>未完でも今日の処理を止める</small></button>
        </div>
      </section>`;
    app.querySelector('[data-outcome="done"]').onclick=()=>finishSession(true);
    app.querySelector('[data-outcome="more"]').onclick=startTimer;
    app.querySelector('[data-outcome="stop"]').onclick=()=>finishSession(false);
  }

  function buildRecord(completed){
    const now=new Date();
    return {
      id:`${APP_SLUG}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      appSlug:APP_SLUG,
      createdAt:now.toISOString(),
      dateKey:localDateKey(now),
      loadLevel:state.loadLevel||loadResult().level,
      taskCount:state.tasks.filter(Boolean).length,
      selectedTask:selectedTask(),
      minimumLine:state.minimumLine,
      discarded:allDiscarded(),
      sessionCount:state.timerSessionCount,
      completed:Boolean(completed),
      cloudSynced:false
    };
  }

  function finishSession(completed){
    const record=buildRecord(completed);
    const rows=loadLocalHistory().filter(row=>row.id!==record.id);
    rows.unshift(record);saveLocalHistory(rows);
    state.completion={completed,recordId:record.id,selectedTask:record.selectedTask};
    state.completionMessage=Date.now()%END_MESSAGES.length;
    state.step='complete';state.timerRunning=false;state.timerEndsAt=0;
    saveDraft();
    syncRecord(record);
    renderComplete();
  }

  function renderComplete(){
    const completed=Boolean(state.completion?.completed);
    const message=END_MESSAGES[state.completionMessage%END_MESSAGES.length];
    app.innerHTML=`
      <section class="screen complete-screen">
        ${completed?'<div class="plus-one">+1</div>':'<div class="plus-one" style="background:#ffffff12;color:var(--text)">✓</div>'}
        <div class="eyebrow">7 / 7</div>
        <h2 data-testid="complete-title">${completed?'1件、減った。':'今日はここまで。'}</h2>
        <p class="complete-message">${escapeHtml(message)}</p>
        <div class="focus-card" style="text-align:left"><div class="label">処理した一件</div><strong>${escapeHtml(state.completion?.selectedTask||selectedTask())}</strong></div>
        <div class="actions">
          <button class="primary" type="button" data-action="next-one">次の一件へ</button>
          <button class="secondary" type="button" data-action="show-history">7日間を見る</button>
          <button class="secondary" type="button" data-action="home">LEVEL UPへ戻る</button>
        </div>
      </section>`;
    app.querySelector('[data-action="next-one"]').onclick=nextOne;
    app.querySelector('[data-action="show-history"]').onclick=()=>{historyOpen=true;renderHistory();};
    app.querySelector('[data-action="home"]').onclick=()=>{location.href='../../';};
  }

  function nextOne(){
    const index=Number.isInteger(state.selectedTaskIndex)?state.selectedTaskIndex:0;
    state.tasks=state.tasks.filter((_,i)=>i!==index);
    if(!state.tasks.length)state.tasks=[''];
    state.selectedTaskIndex=null;
    state.minimumLine='';state.discarded=[];state.discardOther='';
    state.timerSessionCount=0;state.timerRunning=false;state.timerEndsAt=0;state.completion=null;
    state.step=state.tasks.some(t=>String(t).trim())?'choose':'tasks';
    saveDraft();render();
  }

  function renderHistory(){
    historyOpen=true;stopTick();
    const rows=loadLocalHistory().filter(row=>row.appSlug===APP_SLUG);
    const stats=historyStats(rows);
    app.innerHTML=`
      <section class="screen">
        <div class="back-row"><button class="back-button" type="button" data-action="close-history">← 戻る</button></div>
        <div class="eyebrow">過去7日</div>
        <h1 style="font-size:clamp(38px,9vw,58px)">一個ずつ、減らした記録</h1>
        <p class="sync-note" id="syncNote">${syncLabel()}</p>
        <div class="history-grid">
          <div class="history-stat"><strong data-testid="stat-red">${stats.redDays}</strong><span>REDだった日</span></div>
          <div class="history-stat"><strong data-testid="stat-tasks">${stats.taskCount}</strong><span>入力タスク数</span></div>
          <div class="history-stat"><strong data-testid="stat-completed">${stats.completed}</strong><span>完了した一件</span></div>
          <div class="history-stat"><strong data-testid="stat-streak">${stats.redStreak}</strong><span>連続RED日数</span></div>
        </div>
        <div class="panel">
          <div class="mini-label">よく捨てたもの</div>
          <h2 style="font-size:22px;margin:10px 0 0">${stats.topDiscards.length?stats.topDiscards.map(escapeHtml).join(' / '):'まだ記録なし'}</h2>
        </div>
        <div class="history-list">
          ${rows.slice(0,12).map(row=>`
            <article class="history-item">
              <div class="row"><span>${escapeHtml(row.dateKey||'')}</span><span>${escapeHtml(row.loadLevel||'')} · ${row.completed?'完了':'ここまで'}</span></div>
              <strong>${escapeHtml(row.selectedTask||'')}</strong>
              <p>${escapeHtml(row.minimumLine||'')}</p>
            </article>`).join('')||'<p class="helper">まだ記録はありません。最初の一件を処理すると、ここに残ります。</p>'}
        </div>
      </section>`;
    app.querySelector('[data-action="close-history"]').onclick=()=>{historyOpen=false;render();};
    if(currentUser&&!cloudHistoryLoaded&&!cloudHistoryLoading)loadCloudHistory();
  }

  function historyStats(rows){
    const today=new Date();today.setHours(0,0,0,0);
    const start=new Date(today);start.setDate(start.getDate()-6);
    const recent=rows.filter(row=>{
      const d=new Date(row.createdAt||`${row.dateKey}T00:00:00`);
      return Number.isFinite(d.getTime())&&d>=start;
    });
    const redDates=[...new Set(recent.filter(r=>r.loadLevel==='RED').map(r=>r.dateKey).filter(Boolean))].sort();
    const counts=new Map();
    recent.forEach(row=>(row.discarded||[]).forEach(item=>counts.set(item,(counts.get(item)||0)+1)));
    const topDiscards=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([item])=>item);
    let redStreak=0,best=0,prev=null;
    for(const key of redDates){
      const time=new Date(`${key}T00:00:00`).getTime();
      if(prev!==null&&Math.round((time-prev)/86400000)===1)redStreak+=1;else redStreak=1;
      best=Math.max(best,redStreak);prev=time;
    }
    return {
      redDays:redDates.length,
      taskCount:recent.reduce((sum,row)=>sum+Number(row.taskCount||0),0),
      completed:recent.filter(row=>row.completed).length,
      redStreak:best,
      topDiscards
    };
  }

  function wireBack(fn){const button=app.querySelector('[data-action="back"]');if(button)button.onclick=fn;}

  function flashNotice(text){
    let node=document.querySelector('#zenbuToast');
    if(node)node.remove();
    node=document.createElement('div');node.id='zenbuToast';
    node.textContent=text;
    Object.assign(node.style,{position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',zIndex:'100',width:'min(92vw,520px)',padding:'13px 16px',borderRadius:'16px',background:'#f4f7ef',color:'#11160c',fontWeight:'900',fontSize:'14px',boxShadow:'0 16px 50px rgba(0,0,0,.35)'});
    document.body.appendChild(node);setTimeout(()=>node.remove(),2300);
  }

  function resetFlow(){
    stopTick();state=freshState();historyOpen=false;saveDraft();render();
  }

  function render(){
    if(historyOpen)return renderHistory();
    switch(state.step){
      case 'check':return renderCheck();
      case 'checkResult':return renderCheckResult();
      case 'tasks':return renderTasks();
      case 'choose':return renderChoose();
      case 'minimum':return renderMinimum();
      case 'discard':return renderDiscard();
      case 'timer':return renderTimer();
      case 'outcome':return renderOutcome();
      case 'complete':return renderComplete();
      default:state=freshState();saveDraft();return renderCheck();
    }
  }

  function syncLabel(){
    if(currentUser)return 'Googleログイン中：この履歴はFirestoreにも保存されます。';
    if(cloudReady)return '未ログイン：この端末に保存しています。ログインすると以後の履歴を同期します。';
    return 'この端末に保存中。';
  }

  function firebaseReady(){return Boolean(window.firebase&&window.firebase.apps&&window.firebase.apps.length);}

  function setupCloud(){
    if(!firebaseReady())return false;
    try{
      cloudReady=true;
      window.firebase.auth().onAuthStateChanged(user=>{
        const nextUser=user||null;
        const nextId=nextUser?.uid||null;
        if(nextId!==cloudUserId){
          cloudUserId=nextId;
          cloudHistoryLoaded=false;
          cloudHistoryLoading=false;
        }
        currentUser=nextUser;
        const note=document.querySelector('#syncNote');if(note)note.textContent=syncLabel();
        if(currentUser){syncPendingRecords();if(historyOpen&&!cloudHistoryLoaded&&!cloudHistoryLoading)loadCloudHistory();}
      });
      return true;
    }catch{return false;}
  }

  async function syncRecord(record){
    if(!currentUser||!firebaseReady())return;
    try{
      const db=window.firebase.firestore();
      await db.collection('levelupUsers').doc(currentUser.uid).collection('history').doc(record.id).set({
        ...record,cloudSynced:true,savedAt:window.firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      updateLocalRecord(record.id,{cloudSynced:true});
      cloudHistoryLoaded=false;
    }catch(error){console.warn('[zenbu-yaranai] Firestore save failed',error?.code||error);}
  }

  async function syncPendingRecords(){
    const pending=loadLocalHistory().filter(row=>row.appSlug===APP_SLUG&&!row.cloudSynced);
    for(const row of pending)await syncRecord(row);
  }

  async function loadCloudHistory(){
    if(!currentUser||!firebaseReady()||cloudHistoryLoading)return;
    cloudHistoryLoading=true;
    try{
      const snap=await window.firebase.firestore().collection('levelupUsers').doc(currentUser.uid).collection('history').get();
      const cloud=[];
      snap.forEach(doc=>{const data=doc.data();if(data.appSlug===APP_SLUG)cloud.push({...data,id:data.id||doc.id,cloudSynced:true});});
      if(cloud.length){
        const merged=new Map(loadLocalHistory().map(row=>[row.id,row]));
        cloud.forEach(row=>merged.set(row.id,{...merged.get(row.id),...row,cloudSynced:true}));
        const rows=[...merged.values()].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
        saveLocalHistory(rows);
      }
      cloudHistoryLoaded=true;
      if(historyOpen)renderHistoryFromSync();
    }catch(error){
      console.warn('[zenbu-yaranai] Firestore history load failed',error?.code||error);
    }finally{
      cloudHistoryLoading=false;
    }
  }

  function renderHistoryFromSync(){
    if(!historyOpen)return;
    const scrollY=window.scrollY;
    renderHistory();
    requestAnimationFrame(()=>window.scrollTo(0,scrollY));
  }

  historyButton.addEventListener('click',()=>{historyOpen=true;renderHistory();});
  resetButton.addEventListener('click',resetFlow);
  window.addEventListener('beforeunload',saveDraft);
  window.addEventListener('load',()=>{
    let attempts=0;
    const probe=()=>{
      attempts+=1;
      if(setupCloud()||attempts>=24)return;
      setTimeout(probe,250);
    };
    probe();
  });

  if(state.timerRunning&&state.timerEndsAt<=Date.now())state.step='outcome';
  render();
})();
