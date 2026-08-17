(() => {
  'use strict';

  const STORAGE_KEY = 'levelup-mood-v1';
  const SESSION_ROUNDS = 8;

  const SKILLS = {
    body: { label: '身体', icon: '🫁' },
    senses: { label: '感覚', icon: '🎧' },
    attention: { label: '注意', icon: '👀' },
    words: { label: '言葉', icon: '💬' },
    action: { label: '小さな行動', icon: '⚡' },
    boundary: { label: '距離', icon: '↔️' },
    recovery: { label: '回復', icon: '☕' },
    humor: { label: 'ユーモア', icon: '🙂' }
  };

  const ACTIONS = [
    { id:'breathe', icon:'🫁', title:'息を長く吐く', sub:'10秒だけ身体から戻す', skill:'body', tags:['rush','anger','anxiety','body'], base:13 },
    { id:'water', icon:'🥤', title:'水をひと口', sub:'身体に小さな回復を渡す', skill:'recovery', tags:['fatigue','body','heat','waiting'], base:11 },
    { id:'music', icon:'🎧', title:'好きな1曲を流す', sub:'感覚のチャンネルを変える', skill:'senses', tags:['noise','sad','waiting','weather'], base:12 },
    { id:'lookfar', icon:'👀', title:'10秒、遠くを見る', sub:'画面と考え事から距離を取る', skill:'attention', tags:['screen','overload','fatigue','rumination'], base:12 },
    { id:'walk', icon:'🚶', title:'30歩だけ歩く', sub:'身体を動かして切り替える', skill:'body', tags:['anger','stuck','fatigue','rumination'], base:14 },
    { id:'tea', icon:'☕', title:'温かいものを飲む', sub:'まず快適さを1つ足す', skill:'recovery', tags:['weather','sad','waiting','fatigue'], base:12 },
    { id:'name', icon:'🏷️', title:'気分に名前をつける', sub:'「焦り」「悔しい」など一言にする', skill:'words', tags:['anger','social','rumination','disappointment'], base:13 },
    { id:'nextone', icon:'⚡', title:'次の1個だけ決める', sub:'コントロールを小さく取り戻す', skill:'action', tags:['stuck','delay','disappointment','overload'], base:15 },
    { id:'tinywin', icon:'✓', title:'30秒で1個終わらせる', sub:'小さな完了を作る', skill:'action', tags:['stuck','overload','delay','waiting'], base:14 },
    { id:'distance', icon:'↔️', title:'5分だけ距離を置く', sub:'反応する前に間を作る', skill:'boundary', tags:['social','anger','message','criticism'], base:16 },
    { id:'shoulders', icon:'🧍', title:'肩とあごをゆるめる', sub:'力みを先にほどく', skill:'body', tags:['rush','anger','body','screen'], base:12 },
    { id:'reframe', icon:'💬', title:'「そうなったか」と区切る', sub:'事実だけ一度受け取る', skill:'words', tags:['disappointment','delay','weather','rejection'], base:15 },
    { id:'humor', icon:'🙂', title:'心の中で実況する', sub:'ちょっとだけネタにする', skill:'humor', tags:['awkward','mistake','waiting','social'], base:11 },
    { id:'snack', icon:'🍫', title:'小さく補給する', sub:'空腹なら先に燃料を入れる', skill:'recovery', tags:['hunger','fatigue','anger','body'], base:16 },
    { id:'sun', icon:'🌤️', title:'外気に30秒触れる', sub:'環境を小さく切り替える', skill:'senses', tags:['screen','stuck','sad','fatigue'], base:13 },
    { id:'write', icon:'✍️', title:'1行だけ書き出す', sub:'頭の外に置く', skill:'attention', tags:['rumination','overload','anxiety','criticism'], base:14 }
  ];

  const TRAPS = [
    { id:'train_watch', icon:'🚃', title:'運行情報を何度も更新する', sub:'遅れが縮むか監視し続ける', trap:true, feedback:'確認を続けても遅れそのものは縮まりにくい。待っている自分を少し楽にする一手へ戻そう。' },
    { id:'reply_chase', icon:'📱', title:'追いメッセージを送る', sub:'返信を早めようとする', trap:true, feedback:'相手の返信速度を急がせるより、待っている時間の自分を整える方が今すぐ動かせる。' },
    { id:'rain_watch', icon:'🌧️', title:'天気予報を何度も見直す', sub:'雨が変わらないか気にし続ける', trap:true, feedback:'予報を見続けても今の雨は変わりにくい。今日の自分に足せる快適さを探そう。' },
    { id:'mood_watch', icon:'🧑‍💼', title:'相手の顔色をずっと読む', sub:'機嫌が直るまで気にし続ける', trap:true, feedback:'相手の機嫌を管理し続けると自分の緊張が増えやすい。自分の呼吸や距離に戻そう。' },
    { id:'mistake_replay', icon:'⏪', title:'送信前を頭の中でやり直す', sub:'「ああすれば」を繰り返す', trap:true, feedback:'過去の場面を何度再生しても送信前には戻れない。今できる次の一手へ切り替えよう。' },
    { id:'queue_watch', icon:'👥', title:'列の進みをずっと気にする', sub:'前の人ばかり見続ける', trap:true, feedback:'列の速さを見張り続けるより、待ち時間の自分を少し楽にする方が回復につながる。' },
    { id:'fight_back', icon:'💬', title:'勢いのまま言い返す', sub:'その場で相手を変えようとする', trap:true, feedback:'反射で言い返す前に、まず自分の熱を少し下げる。必要な返答はそのあとでもできる。' },
    { id:'cancel_restore', icon:'🗓️', title:'予定を戻せないか何度も聞く', sub:'キャンセルをなかったことにしたい', trap:true, feedback:'予定を元に戻すことだけに粘るより、空いた時間をどう使うかへ操作を戻そう。' },
    { id:'stuck_push', icon:'💻', title:'同じ画面のまま粘り続ける', sub:'気合いで突破しようとする', trap:true, feedback:'詰まったまま押し続けると消耗しやすい。いったん身体や注意を切り替えるのも前進。' },
    { id:'notify_all', icon:'🔔', title:'全部すぐ返す', sub:'通知の順番に反応し続ける', trap:true, feedback:'全部を今処理すると注意がさらに散りやすい。まず自分側で次の1個を決めよう。' },
    { id:'hunger_push', icon:'🍽️', title:'空腹のまま気合いで押し切る', sub:'身体のサインを無視する', trap:true, feedback:'空腹は気合いだけでは消えにくい。可能なら小さく補給して、身体から機嫌を戻そう。' },
    { id:'fatigue_push', icon:'😴', title:'眠気を無視して続ける', sub:'同じペースで頑張り続ける', trap:true, feedback:'疲れているときに同じ出力を求め続けると消耗しやすい。まず小さく状態を変えよう。' },
    { id:'awkward_replay', icon:'🙃', title:'相手の反応を何度も思い返す', sub:'沈黙の意味を考え続ける', trap:true, feedback:'数秒の反応を何度も再生すると気まずさが膨らみやすい。いったん出来事を区切ろう。' },
    { id:'rejection_push', icon:'📉', title:'判断を変えてもらおうと食い下がる', sub:'今の評価をすぐ覆そうとする', trap:true, feedback:'相手の判断をすぐ変えることだけに力を使うより、自分の次の一手へ戻す方が回復しやすい。' },
    { id:'closed_wait', icon:'🚧', title:'店の前で開くのを待ち続ける', sub:'予定どおりになるまで動かない', trap:true, feedback:'今日開く保証のない店を待つより、次の選択肢を1つ決める方が自分の時間を取り戻せる。' },
    { id:'noise_wait', icon:'🔊', title:'静かになるまでイライラして待つ', sub:'周りが変わるのを待ち続ける', trap:true, feedback:'周囲がすぐ静かになるとは限らない。音との距離や身体の力みなど、自分側を先に動かそう。' }
  ];

  const EVENTS = [
    {icon:'🚃',title:'電車が15分遅れている。',detail:'出発表示は15分遅れ。ホームは少し混んでいる。',drop:18,tags:['delay','waiting','rush'],impacts:['待ち','焦り'],trap:'train_watch',best:['breathe','nextone','music']},
    {icon:'📱',title:'返信が来ない。',detail:'既読はついた。10分経っても返信はまだない。',drop:16,tags:['waiting','message','rumination','social'],impacts:['待ち','考えすぎ'],trap:'reply_chase',best:['lookfar','tinywin','write']},
    {icon:'🌧️',title:'楽しみにしていた日に雨。',detail:'楽しみにしていた外出の日。朝から雨が続いている。',drop:15,tags:['weather','disappointment','sad'],impacts:['予定外','がっかり'],trap:'rain_watch',best:['reframe','tea','music']},
    {icon:'🧑‍💼',title:'相手が不機嫌そう。',detail:'返事が短く、いつもより空気が重い。',drop:17,tags:['social','anger','anxiety'],impacts:['対人','緊張'],trap:'mood_watch',best:['distance','name','breathe']},
    {icon:'🧾',title:'送ったあとでミスに気づいた。',detail:'メッセージを送信した直後、内容のミスに気づいた。',drop:20,tags:['mistake','rumination','disappointment','anxiety'],impacts:['後悔','焦り'],trap:'mistake_replay',best:['name','nextone','write']},
    {icon:'👥',title:'レジの行列が長い。',detail:'レジ前に12人。思ったより列が長い。',drop:13,tags:['waiting','anger','stuck'],impacts:['待ち','苛立ち'],trap:'queue_watch',best:['music','humor','water']},
    {icon:'💬',title:'きつい言い方をされた。',detail:'会話の途中で、思ったより強い言い方をされた。',drop:21,tags:['criticism','social','anger','message'],impacts:['批判','怒り'],trap:'fight_back',best:['distance','name','walk']},
    {icon:'🗓️',title:'予定が急にキャンセル。',detail:'予定の1時間前にキャンセルの連絡が来た。',drop:17,tags:['disappointment','stuck','waiting'],impacts:['予定外','空白'],trap:'cancel_restore',best:['reframe','nextone','tea']},
    {icon:'💻',title:'作業が全然進まない。',detail:'同じところで20分止まっている。考えても進まない。',drop:16,tags:['screen','stuck','overload','fatigue'],impacts:['詰まり','疲労'],trap:'stuck_push',best:['walk','lookfar','tinywin']},
    {icon:'🔔',title:'通知が次々に来る。',detail:'仕事中に通知が立て続けに5件。集中が切れた。',drop:14,tags:['overload','screen','rush'],impacts:['過負荷','注意散漫'],trap:'notify_all',best:['shoulders','nextone','write']},
    {icon:'🍽️',title:'お腹が空いてイライラ。',detail:'予定が続いていて、空腹でだんだんイライラしてきた。',drop:18,tags:['hunger','body','anger','fatigue'],impacts:['空腹','苛立ち'],trap:'hunger_push',best:['snack','water','breathe']},
    {icon:'😴',title:'眠くて頭が回らない。',detail:'眠気が強く、同じ文を何度も読み直している。',drop:17,tags:['fatigue','body','screen'],impacts:['疲労','集中低下'],trap:'fatigue_push',best:['water','sun','lookfar']},
    {icon:'🙃',title:'会話で変なことを言った。',detail:'言った直後に数秒の沈黙。ちょっと気まずい。',drop:14,tags:['awkward','social','rumination','mistake'],impacts:['気まずさ','反芻'],trap:'awkward_replay',best:['humor','reframe','name']},
    {icon:'📉',title:'提案が採用されなかった。',detail:'出した提案に「今回は見送り」と返ってきた。',drop:19,tags:['rejection','disappointment','rumination'],impacts:['不採用','がっかり'],trap:'rejection_push',best:['reframe','write','nextone']},
    {icon:'🚧',title:'店が臨時休業。',detail:'行きたかった店の前まで来たら、臨時休業の貼り紙。',drop:12,tags:['disappointment','stuck','delay'],impacts:['予定外','足止め'],trap:'closed_wait',best:['reframe','nextone','humor']},
    {icon:'🔊',title:'周りがうるさくて集中できない。',detail:'周りの話し声と物音が続き、集中が切れてきた。',drop:15,tags:['noise','screen','anger','stuck'],impacts:['騒音','集中低下'],trap:'noise_wait',best:['music','distance','shoulders']}
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    hero:$('hero'), game:$('game'), result:$('result'), start:$('startBtn'), retry:$('retryBtn'), next:$('nextBtn'),
    round:$('roundText'), combo:$('comboText'), moodValue:$('moodValue'), moodBar:$('moodBar'), eventCard:$('eventCard'),
    eventIcon:$('eventIcon'), eventTitle:$('eventTitle'), eventDetail:$('eventDetail'), impactRow:$('impactRow'), actionGrid:$('actionGrid'),
    feedback:$('feedback'), feedbackScore:$('feedbackScore'), feedbackTitle:$('feedbackTitle'), feedbackBody:$('feedbackBody'),
    timer:$('timerText'), resultScore:$('resultScore'), resultTitle:$('resultTitle'), resultLead:$('resultLead'), skillList:$('skillList'), skillCount:$('skillCount'),
    streak:$('streakText'), share:$('shareBtn'), toast:$('toast'), help:$('helpBtn'), helpModal:$('helpModal'), sound:$('soundBtn'), heroFace:$('heroFace')
  };

  let state = null;
  let timerId = null;
  let audioCtx = null;
  let soundOn = true;

  function shuffle(arr){
    const out = [...arr];
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }

  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

  function loadMeta(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }

  function saveMeta(meta){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); } catch {}
  }

  function startGame(){
    stopTimer();
    state = {
      round:0,
      mood:72,
      combo:0,
      maxCombo:0,
      total:0,
      choices:[],
      usedSkills:{},
      events:shuffle(EVENTS).slice(0,SESSION_ROUNDS),
      locked:false,
      seconds:10
    };
    els.hero.classList.add('hidden');
    els.result.classList.add('hidden');
    els.game.classList.remove('hidden');
    renderRound();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderRound(){
    state.locked = false;
    state.seconds = 10;
    els.next.classList.add('hidden');
    els.feedback.className = 'feedback hidden';
    const event = state.events[state.round];
    state.mood = clamp(state.mood - event.drop, 10, 95);
    updateHud();

    els.eventIcon.textContent = event.icon;
    els.eventTitle.textContent = event.title;
    els.eventDetail.textContent = event.detail;
    els.impactRow.innerHTML = event.impacts.map(x => `<span class="impact-tag">${escapeHtml(x)}</span>`).join('');
    els.eventCard.classList.remove('shake');
    void els.eventCard.offsetWidth;
    els.eventCard.classList.add('shake');

    const options = buildOptions(event);
    els.actionGrid.innerHTML = options.map(action => `
      <button class="action-btn ${action.trap?'trap':''}" type="button" data-action="${action.id}">
        <span class="a-icon">${action.icon}</span>
        <strong>${escapeHtml(action.title)}</strong>
        <small>${escapeHtml(action.sub)}</small>
      </button>`).join('');

    els.actionGrid.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => chooseAction(btn.dataset.action));
    });

    startTimer();
  }

  function buildOptions(event){
    const selfOptions = event.best.map(id => ACTIONS.find(a=>a.id===id)).filter(Boolean);
    const trap = TRAPS.find(t=>t.id===event.trap) || TRAPS[0];
    return shuffle([...selfOptions,trap]);
  }

  function startTimer(){
    stopTimer();
    els.timer.textContent = state.seconds;
    els.timer.classList.remove('urgent');
    timerId = setInterval(() => {
      if(state.locked) return stopTimer();
      state.seconds -= 1;
      els.timer.textContent = state.seconds;
      if(state.seconds <= 3) els.timer.classList.add('urgent');
      if(state.seconds <= 0){
        stopTimer();
        chooseAction(null, true);
      }
    },1000);
  }

  function stopTimer(){ if(timerId){clearInterval(timerId);timerId=null;} }

  function chooseAction(actionId, timedOut=false){
    if(!state || state.locked) return;
    state.locked = true;
    stopTimer();
    els.timer.classList.remove('urgent');

    const event = state.events[state.round];
    const action = actionId ? (ACTIONS.find(a=>a.id===actionId) || TRAPS.find(a=>a.id===actionId)) : null;
    const buttons = [...els.actionGrid.querySelectorAll('.action-btn')];
    buttons.forEach(b=>b.classList.add('disabled'));
    const selected = actionId ? els.actionGrid.querySelector(`[data-action="${actionId}"]`) : null;
    if(selected){selected.classList.remove('disabled');selected.classList.add('correct');}

    let gain = 0;
    let grade = 'bad';
    let title = 'まだ一手ある。';
    let body = 'いまの自分を少し動かせる選択を探してみよう。';

    if(timedOut){
      gain = 2;
      state.combo = 0;
      title = '10秒経過。';
      body = '正解探しで止まらなくていい。小さな一手を早めに出すのが目的。';
    } else if(action && action.trap){
      gain = 0;
      state.combo = 0;
      title = 'そこに粘ると消耗する。';
      body = action.feedback || '変えにくいものに力を使い続けるより、自分を少し楽にする一手へ戻そう。';
      tone('low');
    } else if(action){
      const matches = action.tags.filter(t=>event.tags.includes(t)).length;
      const isBest = event.best.includes(action.id);
      gain = action.base + matches*4 + (isBest?7:0) + Math.min(state.seconds,5);
      gain = clamp(gain,7,30);
      if(isBest || matches>=2){
        grade = 'good';
        state.combo += 1;
        title = state.combo >= 3 ? `RESET COMBO ×${state.combo}` : 'いいリセット。';
        body = explain(action,event,true);
        tone('high');
      } else if(matches===1){
        grade = 'weak';
        state.combo += 1;
        title = 'ちゃんと自分側。';
        body = explain(action,event,false);
        tone('mid');
      } else {
        grade = 'weak';
        state.combo = Math.max(0,state.combo-1);
        title = '効き目は小さめ。';
        body = 'でも「自分にできること」へ向いたのは正解。状況に合う手札ならもっと戻せる。';
        tone('mid');
      }
      state.usedSkills[action.skill] = (state.usedSkills[action.skill]||0)+1;
    }

    state.maxCombo = Math.max(state.maxCombo,state.combo);
    state.mood = clamp(state.mood + gain,0,100);
    const scoreAdd = gain + (grade==='good'?8:grade==='weak'?3:0);
    state.total += scoreAdd;
    state.choices.push({event:event.title,action:action?.title||'時間切れ',gain,grade});

    els.feedback.className = `feedback ${grade==='good'?'':grade}`.trim();
    els.feedbackScore.textContent = `+${gain}`;
    els.feedbackTitle.textContent = title;
    els.feedbackBody.textContent = body;
    updateHud();
    els.next.classList.remove('hidden');
    els.next.innerHTML = state.round === SESSION_ROUNDS-1 ? '結果を見る <span>→</span>' : '次のシーン <span>→</span>';
  }

  function explain(action,event,strong){
    const label = SKILLS[action.skill]?.label || '自分';
    if(strong) return `${label}から状態を動かした。出来事を消さずに、回復方向へ一手進んだ。`;
    return `${label}に操作を戻した。外を変えなくても、状態は少し動かせる。`;
  }

  function nextRound(){
    if(!state || !state.locked) return;
    if(state.round >= SESSION_ROUNDS-1){ finishGame(); return; }
    state.round += 1;
    renderRound();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function updateHud(){
    els.round.textContent = `${state.round+1} / ${SESSION_ROUNDS}`;
    els.combo.textContent = `×${state.combo}`;
    els.combo.parentElement.classList.toggle('hot',state.combo>=2);
    els.moodValue.textContent = Math.round(state.mood);
    els.moodBar.style.width = `${state.mood}%`;
  }

  function finishGame(){
    stopTimer();
    const normalized = clamp(Math.round((state.total/(SESSION_ROUNDS*40))*100),1,100);
    els.game.classList.add('hidden');
    els.result.classList.remove('hidden');
    els.resultScore.textContent = normalized;

    if(normalized>=82){
      els.resultTitle.innerHTML = '機嫌のハンドルを<br>取り戻している。';
      els.resultLead.textContent = '外を変えようとする前に、自分を整える一手がかなり早く出てきました。';
    } else if(normalized>=62){
      els.resultTitle.innerHTML = '外から、自分へ。<br>切り替えが速くなった。';
      els.resultLead.textContent = '出来事を消さなくても、自分側には複数の操作が残っていると分かってきています。';
    } else {
      els.resultTitle.innerHTML = 'まず一手。<br>機嫌は少し動かせる。';
      els.resultLead.textContent = '完璧に立て直さなくていい。外ではなく、自分に小さく操作を戻せれば十分です。';
    }

    const skills = Object.entries(state.usedSkills).sort((a,b)=>b[1]-a[1]);
    els.skillCount.textContent = `${skills.length}種類`;
    els.skillList.innerHTML = skills.length ? skills.map(([key,count]) => `<span class="skill-badge">${SKILLS[key].icon} ${SKILLS[key].label} ×${count}</span>`).join('') : '<span class="skill-badge">次は手札を増やそう</span>';

    const meta = loadMeta();
    const today = dateKey(new Date());
    const yesterday = dateKey(new Date(Date.now()-86400000));
    let streak = 1;
    if(meta.lastDate===today) streak = meta.streak||1;
    else if(meta.lastDate===yesterday) streak = (meta.streak||0)+1;
    const best = Math.max(meta.best||0,normalized);
    saveMeta({lastDate:today,streak,best,plays:(meta.plays||0)+1});
    els.streak.textContent = `連続プレイ ${streak}日目 ・ BEST ${best}`;
    state.resultScore = normalized;
    state.streak = streak;
    window.scrollTo({top:0,behavior:'smooth'});
    tone('finish');
  }

  function dateKey(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function copyResult(){
    if(!state?.resultScore) return;
    const text = `『機嫌は自分で取る』\nREGULATION ${state.resultScore}\nRESET COMBO ×${state.maxCombo}\n外に粘るより、自分の一手を選ぶ。\n#LEVELUP`;
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(()=>showToast('結果をコピーしました')).catch(()=>fallbackCopy(text));
    } else fallbackCopy(text);
  }

  function fallbackCopy(text){
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');showToast('結果をコピーしました');}catch{showToast('コピーできませんでした');}
    ta.remove();
  }

  function showToast(text){
    els.toast.textContent=text;els.toast.classList.add('show');
    setTimeout(()=>els.toast.classList.remove('show'),1600);
  }

  function openHelp(){ els.helpModal.classList.remove('hidden'); }
  function closeHelp(){ els.helpModal.classList.add('hidden'); }

  function tone(type){
    if(!soundOn) return;
    try{
      audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
      const freq = type==='high'?660:type==='mid'?480:type==='finish'?740:180;
      osc.frequency.setValueAtTime(freq,now);
      if(type==='finish') osc.frequency.exponentialRampToValueAtTime(980,now+.18);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.06,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.22);
      osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+.24);
    }catch{}
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  els.start.addEventListener('click',startGame);
  els.retry.addEventListener('click',startGame);
  els.next.addEventListener('click',nextRound);
  els.share.addEventListener('click',copyResult);
  els.help.addEventListener('click',openHelp);
  document.querySelectorAll('[data-close-help]').forEach(el=>el.addEventListener('click',closeHelp));
  els.sound.addEventListener('click',()=>{soundOn=!soundOn;els.sound.textContent=soundOn?'♪':'×';showToast(soundOn?'サウンド ON':'サウンド OFF');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeHelp();});
})();