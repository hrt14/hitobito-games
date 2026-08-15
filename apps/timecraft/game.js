(() => {
  'use strict';

  const SLOT_MIN = 30;
  const DAY_MIN = 480;
  const SLOT_COUNT = DAY_MIN / SLOT_MIN;
  const START_HOUR = 9;
  const STORAGE_KEY = 'levelup-time-use-v1';

  const TYPE = {
    deep: { label: '深い仕事', icon: '◆' },
    comm: { label: '連絡', icon: '↗' },
    admin: { label: '事務', icon: '▤' },
    meeting: { label: '会議', icon: '◎' }
  };

  const techniques = [
    { no: '01', title: '捨ててから入れる', text: '全部は入らない。重要度の低い予定を先に削る。' },
    { no: '02', title: '重い仕事は元気な時間に', text: '集中力が高い時間帯を、重要で重い仕事に先取りする。' },
    { no: '03', title: '同じ仕事はまとめる', text: '連絡・事務を細切れにしない。切り替え回数を減らす。' },
    { no: '04', title: '予定は8割まで', text: '見積りも突発も外れる。余白が予定を守る。' },
    { no: '05', title: '締切から逆算する', text: '完成時刻から必要工程を後ろ向きに置く。' }
  ];

  const campaign = [
    {
      id: 1,
      title: '全部は入らない',
      text: '重要な仕事を先に確保して、価値の低い仕事は捨てよう。',
      tag: "TODAY'S RULE",
      technique: 0,
      tasks: [
        T('proposal','企画の骨組みを作る','🧠',120,5,'deep',{due:true, required:true}),
        T('urgent-client','顧客の急ぎ確認','☎️',30,4,'comm',{due:true, required:true}),
        T('tomorrow-deck','明日の会議資料','📊',90,4,'deep'),
        T('numbers','今日中の数値確認','📈',90,3,'admin',{due:true, required:true}),
        T('all-chat','チャットを全部返す','💬',60,1,'comm',{delegatable:true}),
        T('expense','経費精算','🧾',30,2,'admin',{delegatable:true}),
        T('research','なんとなく情報収集','🔎',90,1,'admin'),
        T('nice-meeting','念のための定例参加','🪑',60,1,'meeting',{delegatable:true})
      ]
    },
    {
      id: 2,
      title: '朝を守れ',
      text: '頭を使う仕事ほど、集中力の高い前半へ。小さい用事で朝を削らない。',
      tag: 'FOCUS WINDOW',
      technique: 1,
      tasks: [
        T('strategy','新戦略を考える','🧩',120,5,'deep',{due:true, required:true}),
        T('writing','重要メールの草稿','✍️',60,4,'deep',{due:true}),
        T('inbox','メール返信 8件','📨',60,2,'comm',{delegatable:true}),
        T('meeting','進捗会議','🗣️',60,3,'meeting'),
        T('sheet','数字の転記','📋',60,1,'admin',{delegatable:true}),
        T('feed','業界ニュース巡回','📰',60,1,'admin'),
        T('call','確認電話','📞',30,2,'comm')
      ]
    },
    {
      id: 3,
      title: '切り替えるな',
      text: '連絡は連絡、事務は事務。同じ種類を隣に置くほど、時間が戻ってくる。',
      tag: 'BATCH MODE',
      technique: 2,
      tasks: [
        T('deep-review','重要レビュー','🔬',120,5,'deep',{due:true, required:true}),
        T('mail-a','取引先へ返信','✉️',30,3,'comm',{due:true}),
        T('mail-b','社内確認 3件','💬',30,2,'comm'),
        T('call-b','折返し電話','📞',30,2,'comm'),
        T('receipt','領収書処理','🧾',30,1,'admin'),
        T('crm','CRM更新','🗂️',30,1,'admin',{delegatable:true}),
        T('calendar','日程調整','📅',30,1,'admin'),
        T('meeting-b','短い定例','👥',60,2,'meeting')
      ]
    },
    {
      id: 4,
      title: '予定は外れる',
      text: '見積りが伸びても、突発が来ても壊れない予定にする。余白を残そう。',
      tag: 'BUFFER TEST',
      technique: 3,
      eventMinutes: 60,
      tasks: [
        T('release','公開前チェック','🚀',90,5,'deep',{due:true, required:true, actual:120, uncertain:true}),
        T('fix','修正対応','🛠️',60,4,'deep',{due:true, actual:90, uncertain:true}),
        T('client','顧客返信','📨',30,3,'comm',{due:true}),
        T('report','週報','📝',60,2,'admin'),
        T('meeting-c','情報共有会','👥',60,1,'meeting',{delegatable:true}),
        T('cleanup','ファイル整理','🗃️',60,1,'admin',{delegatable:true}),
        T('research-c','追加調査','🔎',60,1,'admin')
      ]
    },
    {
      id: 5,
      title: '締切から戻れ',
      text: '17時提出。完成から逆算して、必要工程を正しい順番で置こう。',
      tag: 'BACKWARD PLAN',
      technique: 4,
      tasks: [
        T('draft','① たたき台を作る','📝',120,5,'deep',{required:true, due:true}),
        T('review','② レビューを受ける','🔍',60,5,'meeting',{required:true, due:true, dependsOn:'draft'}),
        T('fix-final','③ 修正して確定','✅',60,5,'deep',{required:true, due:true, dependsOn:'review'}),
        T('send','④ 17時までに提出','📤',30,5,'comm',{required:true, due:true, dependsOn:'fix-final'}),
        T('mail-c','通常メール返信','📨',60,1,'comm',{delegatable:true}),
        T('data','データ整理','📊',60,2,'admin',{delegatable:true}),
        T('casual','雑談ミーティング','☕',60,1,'meeting')
      ]
    }
  ];

  const practicePool = [
    T('p1','企画を1枚にまとめる','🧠',90,5,'deep',{due:true, required:true}),
    T('p2','重要な分析','📈',120,5,'deep'),
    T('p3','顧客へ返信','📨',30,4,'comm',{due:true}),
    T('p4','社内チャット返信','💬',30,2,'comm',{delegatable:true}),
    T('p5','定例会議','👥',60,2,'meeting'),
    T('p6','数字の転記','📋',60,1,'admin',{delegatable:true}),
    T('p7','情報収集','🔎',60,1,'admin'),
    T('p8','レビュー','🔍',60,4,'deep',{uncertain:true, actual:90}),
    T('p9','日程調整','📅',30,1,'admin',{delegatable:true}),
    T('p10','折返し電話','📞',30,2,'comm'),
    T('p11','資料の最終確認','✅',60,4,'deep',{due:true}),
    T('p12','念のため参加','🪑',60,1,'meeting',{delegatable:true})
  ];

  function T(id, title, emoji, minutes, impact, type, options={}) {
    return { id, title, emoji, minutes, actual: options.actual || minutes, impact, type, due: !!options.due,
      required: !!options.required, delegatable: !!options.delegatable, uncertain: !!options.uncertain,
      dependsOn: options.dependsOn || null };
  }

  const els = Object.fromEntries([
    'titleScreen','gameScreen','resultScreen','completeScreen','startBtn','homeBtn','dayTitle','skillLevel',
    'missionTag','missionTitle','missionText','remainingTime','timeAxis','timeline','timelineHint','taskList',
    'inboxCount','taskActions','selectedType','selectedName','delegateBtn','dropBtn','restoreBtn','impactMetric',
    'switchMetric','bufferMetric','runBtn','gradeRing','grade','resultHeadline','resultSummary','resultImpact',
    'resultBuffer','resultSwitches','resultOvertime','coachTitle','coachText','unlockCard','unlockTitle','unlockText',
    'nextBtn','retryBtn','skillBook','bestScore','practiceBtn','resetBtn','toast'
  ].map(id => [id, document.getElementById(id)]));

  let save = loadSave();
  let currentDayIndex = Math.min(save.progress || 0, campaign.length - 1);
  let currentDay = null;
  let taskState = new Map();
  let selectedId = null;
  let practiceMode = false;
  let lastResult = null;
  let toastTimer = null;

  initAxis();
  updateTitleStart();

  els.startBtn.addEventListener('click', () => {
    practiceMode = false;
    currentDayIndex = Math.min(save.progress || 0, campaign.length - 1);
    startDay(campaign[currentDayIndex]);
  });
  els.homeBtn.addEventListener('click', showTitle);
  els.runBtn.addEventListener('click', runDay);
  els.delegateBtn.addEventListener('click', delegateSelected);
  els.dropBtn.addEventListener('click', dropSelected);
  els.restoreBtn.addEventListener('click', restoreSelected);
  els.retryBtn.addEventListener('click', () => startDay(currentDay));
  els.nextBtn.addEventListener('click', nextDay);
  els.practiceBtn.addEventListener('click', () => {
    practiceMode = true;
    startDay(makePracticeDay());
  });
  els.resetBtn.addEventListener('click', () => {
    save = { progress: 0, best: 0, clears: 0 };
    persist();
    currentDayIndex = 0;
    practiceMode = false;
    showTitle();
  });

  function loadSave() {
    try { return { progress:0,best:0,clears:0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return { progress:0,best:0,clears:0 }; }
  }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); }

  function updateTitleStart() {
    if ((save.progress || 0) >= campaign.length) {
      els.startBtn.innerHTML = '時間術を復習する <span>→</span>';
    } else if ((save.progress || 0) > 0) {
      els.startBtn.innerHTML = `${save.progress + 1}日目から続ける <span>→</span>`;
    }
  }

  function initAxis() {
    els.timeAxis.innerHTML = '';
    for (let i=0;i<SLOT_COUNT;i++) {
      const d = document.createElement('div');
      if (i % 2 === 0) {
        const h = START_HOUR + i / 2;
        d.textContent = String(h).padStart(2,'0') + ':00';
        d.className = 'time-label';
      }
      els.timeAxis.appendChild(d);
    }
  }

  function startDay(day) {
    currentDay = cloneDay(day);
    selectedId = null;
    taskState = new Map(currentDay.tasks.map(t => [t.id, { status:'inbox', start:null }]));
    showScreen('game');
    renderAll();
    if (practiceMode) toast('実戦モード：5つ全部を使え');
  }

  function cloneDay(day) { return { ...day, tasks: day.tasks.map(t => ({...t})) }; }

  function renderAll() {
    const dayNo = practiceMode ? 'PRACTICE' : `DAY ${currentDay.id} / ${campaign.length}`;
    els.dayTitle.textContent = dayNo;
    els.skillLevel.textContent = `Lv.${Math.min(6, 1 + (save.progress || 0))}`;
    els.missionTag.textContent = currentDay.tag;
    els.missionTitle.textContent = currentDay.title;
    els.missionText.textContent = currentDay.text;
    renderTasks();
    renderTimeline();
    renderMetrics();
    renderActions();
  }

  function renderTasks() {
    els.taskList.innerHTML = '';
    let inbox = 0;
    currentDay.tasks.forEach(task => {
      const st = taskState.get(task.id);
      if (st.status === 'inbox') inbox++;
      const btn = document.createElement('button');
      btn.className = `task-card ${selectedId === task.id ? 'selected' : ''} ${st.status}`;
      btn.dataset.id = task.id;
      const chips = [];
      chips.push(`<span class="chip">${TYPE[task.type].label}</span>`);
      chips.push(`<span class="chip">${task.minutes}分</span>`);
      if (task.due) chips.push('<span class="chip hot">今日</span>');
      if (task.impact >= 4) chips.push('<span class="chip important">重要</span>');
      if (task.uncertain) chips.push('<span class="chip uncertain">見積?</span>');
      if (task.delegatable) chips.push('<span class="chip">任せ可</span>');
      const statusText = st.status === 'scheduled' ? `${slotTime(st.start)}〜` : st.status === 'delegated' ? '任せた' : st.status === 'dropped' ? 'やらない' : '未配置';
      btn.innerHTML = `<span class="task-icon">${task.emoji}</span><span class="task-main"><strong>${task.title}</strong><span class="task-meta">${chips.join('')}</span></span><span class="impact-dots"><b>${'●'.repeat(task.impact)}${'○'.repeat(5-task.impact)}</b><span>${statusText}</span></span>`;
      btn.addEventListener('click', () => selectTask(task.id));
      els.taskList.appendChild(btn);
    });
    els.inboxCount.textContent = inbox;
  }

  function renderTimeline() {
    els.timeline.innerHTML = '';
    const occupied = getOccupiedSlots();
    for (let i=0;i<SLOT_COUNT;i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.slot = i;
      if (selectedId) {
        const task = getTask(selectedId), st = taskState.get(selectedId);
        if (st.status !== 'delegated' && st.status !== 'dropped' && canPlace(task, i, occupied, st)) slot.classList.add('available');
      }
      slot.addEventListener('click', () => onSlotClick(i));
      els.timeline.appendChild(slot);
    }

    const scheduled = currentDay.tasks
      .filter(t => taskState.get(t.id).status === 'scheduled')
      .sort((a,b) => taskState.get(a.id).start - taskState.get(b.id).start);

    scheduled.forEach((task, index) => {
      const st = taskState.get(task.id);
      const block = document.createElement('div');
      const startPct = st.start / SLOT_COUNT * 100;
      const span = task.minutes / SLOT_MIN;
      const heightPct = span / SLOT_COUNT * 100;
      const prev = scheduled[index-1];
      const prevState = prev ? taskState.get(prev.id) : null;
      const contiguousSame = prev && prev.type === task.type && prevState.start + prev.minutes/SLOT_MIN === st.start;
      const focusGood = task.type === 'deep' && st.start < 6;
      block.className = `task-block ${task.type}${contiguousSame ? ' batch-good' : ''}${focusGood ? ' focus-good' : ''}`;
      block.style.top = `calc(${startPct}% + 5px)`;
      block.style.height = `calc(${heightPct}% - 4px)`;
      block.innerHTML = `<span class="block-copy"><strong>${task.title}</strong><span>${slotTime(st.start)} / ${task.minutes}m</span></span><span class="block-icon">${task.emoji}</span>`;
      block.addEventListener('click', (e) => { e.stopPropagation(); selectTask(task.id); toast('もう一度時刻をタップすると移動'); });
      els.timeline.appendChild(block);
    });

    els.timelineHint.textContent = selectedId ? `${getTask(selectedId).title}：開始時刻をタップ` : 'タスクを選んで、開始時刻をタップ';
    els.timelineHint.classList.toggle('active', !!selectedId);
  }

  function renderMetrics() {
    const scheduled = currentDay.tasks.filter(t => taskState.get(t.id).status === 'scheduled');
    const used = scheduled.reduce((s,t) => s+t.minutes,0);
    const free = Math.max(0, DAY_MIN-used);
    const impact = scheduled.reduce((s,t) => s+t.impact,0) + currentDay.tasks.filter(t => taskState.get(t.id).status === 'delegated').reduce((s,t) => s+Math.round(t.impact*.6),0);
    const switches = countSwitches(scheduled);
    els.remainingTime.innerHTML = `<strong>${free}</strong><span>min free</span>`;
    els.remainingTime.classList.toggle('warning', free < 60);
    els.impactMetric.textContent = impact;
    els.switchMetric.textContent = switches;
    els.bufferMetric.textContent = `${free}m`;
  }

  function renderActions() {
    if (!selectedId) { els.taskActions.classList.add('hidden'); return; }
    const task = getTask(selectedId), st = taskState.get(selectedId);
    els.taskActions.classList.remove('hidden');
    els.selectedType.textContent = `${TYPE[task.type].label} / ${task.minutes}分`;
    els.selectedName.textContent = task.title;
    els.delegateBtn.disabled = !task.delegatable || st.status === 'delegated';
    els.delegateBtn.style.opacity = els.delegateBtn.disabled ? '.35' : '1';
    els.dropBtn.classList.toggle('hidden', st.status === 'dropped');
    els.restoreBtn.classList.toggle('hidden', st.status === 'inbox');
    if (st.status === 'scheduled') els.restoreBtn.textContent = '予定から外す';
    else if (st.status === 'delegated' || st.status === 'dropped') els.restoreBtn.textContent = '戻す';
  }

  function selectTask(id) {
    selectedId = selectedId === id ? null : id;
    renderAll();
    if (selectedId) {
      const task = getTask(selectedId), st = taskState.get(selectedId);
      if (st.status === 'delegated' || st.status === 'dropped') toast('戻すと予定に入れられる');
      else toast(`${task.minutes}分：開始時刻を選ぶ`);
    }
  }

  function onSlotClick(slot) {
    if (!selectedId) return;
    const task = getTask(selectedId), st = taskState.get(selectedId);
    if (st.status === 'delegated' || st.status === 'dropped') return toast('先に「戻す」');
    const occupied = getOccupiedSlots(selectedId);
    if (!canPlace(task, slot, occupied, st)) {
      els.timeline.classList.remove('shake'); void els.timeline.offsetWidth; els.timeline.classList.add('shake');
      return toast('そこには入らない');
    }
    st.status = 'scheduled'; st.start = slot;
    selectedId = null;
    renderAll();
    const endFree = freeMinutes();
    if (task.type === 'deep' && slot < 6) toast('FOCUS + 朝の集中帯');
    else if (hasBatchNeighbor(task)) toast('BATCH + 切替を減らした');
    else if (endFree < 60) toast('⚠ 余白が60分を切った');
    else toast(`${slotTime(slot)} を確保`);
  }

  function delegateSelected() {
    if (!selectedId) return;
    const task = getTask(selectedId), st = taskState.get(selectedId);
    if (!task.delegatable) return toast('これは自分でやる仕事');
    st.status = 'delegated'; st.start = null; selectedId = null;
    renderAll(); toast('任せた。自分の時間が戻った');
  }

  function dropSelected() {
    if (!selectedId) return;
    const task = getTask(selectedId), st = taskState.get(selectedId);
    st.status = 'dropped'; st.start = null; selectedId = null;
    renderAll();
    toast(task.impact <= 1 ? 'CUT + やらないを決めた' : '捨てた。重要度に注意');
  }

  function restoreSelected() {
    if (!selectedId) return;
    const st = taskState.get(selectedId);
    st.status = 'inbox'; st.start = null;
    renderAll(); toast('INBOXへ戻した');
  }

  function getOccupiedSlots(exceptId=null) {
    const occ = Array(SLOT_COUNT).fill(null);
    currentDay.tasks.forEach(task => {
      if (task.id === exceptId) return;
      const st = taskState.get(task.id);
      if (st.status !== 'scheduled') return;
      const span = task.minutes / SLOT_MIN;
      for (let i=0;i<span;i++) occ[st.start+i] = task.id;
    });
    return occ;
  }

  function canPlace(task, start, occupied) {
    const span = task.minutes / SLOT_MIN;
    if (start < 0 || start + span > SLOT_COUNT) return false;
    for (let i=0;i<span;i++) if (occupied[start+i]) return false;
    return true;
  }

  function freeMinutes() {
    return DAY_MIN - currentDay.tasks.filter(t => taskState.get(t.id).status === 'scheduled').reduce((s,t)=>s+t.minutes,0);
  }

  function hasBatchNeighbor(task) {
    const scheduled = currentDay.tasks.filter(t => taskState.get(t.id).status === 'scheduled' && t.id !== task.id);
    const s = taskState.get(task.id); const span = task.minutes/SLOT_MIN;
    return scheduled.some(other => {
      if (other.type !== task.type) return false;
      const o = taskState.get(other.id), ospan = other.minutes/SLOT_MIN;
      return o.start + ospan === s.start || s.start + span === o.start;
    });
  }

  function countSwitches(tasks) {
    const sorted = tasks.slice().sort((a,b)=>taskState.get(a.id).start-taskState.get(b.id).start);
    let n=0, prev=null;
    sorted.forEach(t => { if (prev && prev.type !== t.type) n++; prev=t; });
    return n;
  }

  function runDay() {
    const result = evaluateDay();
    lastResult = result;
    if (!practiceMode) {
      if (result.grade !== 'D') save.progress = Math.max(save.progress || 0, currentDay.id);
      save.clears = (save.clears || 0) + 1;
    } else save.clears = (save.clears || 0) + 1;
    save.best = Math.max(save.best || 0, result.score);
    persist();
    showResult(result);
  }

  function evaluateDay() {
    const scheduled = currentDay.tasks.filter(t => taskState.get(t.id).status === 'scheduled').sort((a,b)=>taskState.get(a.id).start-taskState.get(b.id).start);
    const delegated = currentDay.tasks.filter(t => taskState.get(t.id).status === 'delegated');
    const dropped = currentDay.tasks.filter(t => taskState.get(t.id).status === 'dropped');
    const ignored = currentDay.tasks.filter(t => taskState.get(t.id).status === 'inbox');
    const switches = countSwitches(scheduled);
    const planned = scheduled.reduce((s,t)=>s+t.minutes,0);
    const actual = scheduled.reduce((s,t)=>s+t.actual,0);
    const buffer = Math.max(0, DAY_MIN-planned);
    const event = currentDay.eventMinutes || 0;
    const switchCost = Math.max(0, switches - 2) * 10;
    const overtime = Math.max(0, actual + event + switchCost - DAY_MIN);
    const impact = scheduled.reduce((s,t)=>s+t.impact,0) + delegated.reduce((s,t)=>s+Math.max(1,Math.round(t.impact*.65)),0);
    const dueMisses = [...ignored,...dropped].filter(t=>t.due || t.required);

    let score = impact * 10;
    score -= dueMisses.reduce((s,t)=>s + (t.required ? 34 : 18),0);
    score -= overtime * .45;
    score -= switches * 3;
    score += dropped.filter(t=>t.impact<=1).length * 8;
    score += delegated.filter(t=>t.impact<=2).length * 6;

    const morningDeep = scheduled.filter(t=>t.type==='deep' && taskState.get(t.id).start < 6).reduce((s,t)=>s+t.impact,0);
    score += morningDeep * 3;
    const batchPairs = countBatchPairs(scheduled);
    score += batchPairs * 8;
    if (buffer >= 60 && buffer <= 150) score += 18;
    if (buffer > 180) score -= (buffer - 180) * .15;
    if (buffer === 0) score -= 15;
    if (event && buffer >= event + Math.max(0, actual-planned)) score += 25;

    const dependencyOk = checkDependencies(scheduled);
    if (currentDay.id === 5 || currentDay.isPracticeChain) score += dependencyOk ? 45 : -45;

    score = Math.max(0, Math.round(score));
    const endBuffer = Math.max(0, DAY_MIN - actual - event - switchCost);
    let grade = score >= 200 ? 'S' : score >= 150 ? 'A' : score >= 105 ? 'B' : score >= 65 ? 'C' : 'D';
    const insight = buildCoach({scheduled,delegated,dropped,ignored,switches,buffer,overtime,dueMisses,morningDeep,batchPairs,dependencyOk,actual,planned,event});
    return { score, grade, impact, switches, buffer:endBuffer, plannedBuffer:buffer, overtime, insight, dependencyOk };
  }

  function countBatchPairs(sorted) {
    let n=0;
    for (let i=1;i<sorted.length;i++) {
      const a=sorted[i-1], b=sorted[i], sa=taskState.get(a.id), sb=taskState.get(b.id);
      if (a.type===b.type && sa.start + a.minutes/SLOT_MIN === sb.start) n++;
    }
    return n;
  }

  function checkDependencies(scheduled) {
    const byId = new Map(scheduled.map(t=>[t.id,t]));
    for (const t of scheduled) {
      if (!t.dependsOn) continue;
      const pre = byId.get(t.dependsOn);
      if (!pre) return false;
      const ps = taskState.get(pre.id), ts = taskState.get(t.id);
      if (ps.start + pre.minutes/SLOT_MIN > ts.start) return false;
    }
    const requiredChain = currentDay.tasks.filter(t=>t.dependsOn || ['draft'].includes(t.id));
    if (requiredChain.length && requiredChain.some(t=>taskState.get(t.id).status!=='scheduled')) return false;
    return true;
  }

  function buildCoach(x) {
    if (x.dueMisses.length) return { headline:'締切が残った。', summary:`${x.dueMisses[0].title} が未処理。小さい予定より先に、今日落とせない仕事を確保しよう。`, title:'「今日落とせない」を最初に置く', text:'緊急ではなくても、締切と影響が大きいものから時間を確保する。' };
    if ((currentDay.id===5 || currentDay.isPracticeChain) && !x.dependencyOk) return { headline:'順番が逆だった。', summary:'工程は全部入っている。でも前工程が終わる前に次工程が始まっている。', title:'完成時刻から後ろ向きに置く', text:'提出→修正→レビュー→作成の順に必要時間を戻すと、工程の前後が崩れない。' };
    if (x.overtime > 0) return { headline:'予定があふれた。', summary:`見積り差と突発で ${Math.round(x.overtime)}分の残業。予定を100%使うと、ズレが全部はみ出す。`, title:'余白は「空き」ではなく機能', text:'予定を8割程度にすると、見積り誤差や急な依頼を吸収できる。' };
    if (currentDay.id===2 && x.morningDeep < 5) return { headline:'朝が細切れになった。', summary:'重要な深い仕事を、連絡や事務が先に食べている。', title:'集中力のピークを予約する', text:'メールを開く前に、重い仕事の時間を先にブロックする。' };
    if (x.switches >= 5) return { headline:'切り替えすぎた。', summary:`種類の違う仕事を ${x.switches}回切り替えた。1件ずつ片づけるより、種類でまとめた方が速い。`, title:'同種の仕事を連結する', text:'返信→返信→電話、事務→事務のように並べると、頭の再起動が減る。' };
    if (x.scheduled?.some(t=>t.impact<=1) && x.ignored?.some(t=>t.impact>=4)) return { headline:'小さい仕事に勝って、大事な仕事に負けた。', summary:'達成数ではなく、重要な結果を先に取りにいこう。', title:'ToDoの数ではなく影響で選ぶ', text:'「終わると何が進むか」で仕事を比較する。' };
    return { headline:'時間を守った。', summary:'重要な仕事・集中・余白のバランスが取れている。', title:'予定表を「意思決定」に使う', text:'空いている場所へ仕事を入れるのではなく、大事なものへ先に時間を渡す。' };
  }

  function showResult(result) {
    showScreen('result');
    els.grade.textContent = result.grade;
    els.gradeRing.style.borderColor = result.grade === 'S' ? 'rgba(217,255,100,.62)' : result.grade === 'D' ? 'rgba(255,107,114,.42)' : 'rgba(217,255,100,.22)';
    els.resultHeadline.textContent = result.insight.headline;
    els.resultSummary.textContent = result.insight.summary;
    els.resultImpact.textContent = result.impact;
    els.resultBuffer.textContent = `${result.buffer}m`;
    els.resultSwitches.textContent = result.switches;
    els.resultOvertime.textContent = `${Math.round(result.overtime)}m`;
    els.coachTitle.textContent = result.insight.title;
    els.coachText.textContent = result.insight.text;
    if (practiceMode) {
      els.unlockCard.classList.add('hidden');
      els.nextBtn.textContent = 'もう1日やる ↻';
    } else {
      els.unlockCard.classList.remove('hidden');
      const tech = techniques[currentDay.technique];
      els.unlockTitle.textContent = tech.title;
      els.unlockText.textContent = tech.text;
      els.nextBtn.innerHTML = result.grade === 'D' ? '予定を組み直す <span>↻</span>' : (currentDay.id === campaign.length ? '5日間を振り返る <span>→</span>' : '次の日へ <span>→</span>');
    }
  }

  function nextDay() {
    if (!practiceMode && lastResult && lastResult.grade === 'D') return startDay(currentDay);
    if (practiceMode) return startDay(makePracticeDay());
    if (currentDay.id >= campaign.length) return showComplete();
    currentDayIndex = currentDay.id;
    startDay(campaign[currentDayIndex]);
  }

  function showComplete() {
    showScreen('complete');
    els.skillBook.innerHTML = techniques.map(t => `<div class="skill-item"><small>TIME SKILL ${t.no}</small><strong>${t.title}</strong><p>${t.text}</p></div>`).join('');
    els.bestScore.textContent = save.best || 0;
  }

  function makePracticeDay() {
    const shuffled = practicePool.map(t=>({...t,id:`${t.id}-${Math.random().toString(36).slice(2,6)}`})).sort(()=>Math.random()-.5);
    const tasks = shuffled.slice(0,7);
    if (!tasks.some(t=>t.required)) { tasks[0].required=true; tasks[0].due=true; tasks[0].impact=5; }
    return { id: 99, title:'8時間を設計せよ', text:'重要度・集中・まとめ処理・余白。5つの時間術を同時に使う。', tag:'PRACTICE', technique:4, eventMinutes:Math.random()<.65?60:30, tasks };
  }

  function showTitle() { showScreen('title'); updateTitleStart(); }
  function showScreen(name) {
    els.titleScreen.classList.toggle('hidden', name!=='title');
    els.gameScreen.classList.toggle('hidden', name!=='game');
    els.resultScreen.classList.toggle('hidden', name!=='result');
    els.completeScreen.classList.toggle('hidden', name!=='complete');
    window.scrollTo(0,0);
  }

  function getTask(id) { return currentDay.tasks.find(t=>t.id===id); }
  function slotTime(slot) {
    const mins = START_HOUR*60 + slot*SLOT_MIN;
    return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>els.toast.classList.remove('show'), 1500);
  }
})();
