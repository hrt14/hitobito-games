import { SCENARIOS } from './game-data.js';
import { createRun, chooseAction, endRun, evaluateRun, formatDuration, clockAt, bestScore } from './game-engine.js';

const app = document.querySelector('#app');
const STORAGE = 'today-last-day-v1';
let state = load();
let currentScenario = null;
let run = null;

function load(){
  try { return JSON.parse(localStorage.getItem(STORAGE)) || { introSeen:false, history:[], unlocked:1 }; }
  catch { return { introSeen:false, history:[], unlocked:1 }; }
}
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
function haptic(ms=12){ if(navigator.vibrate) navigator.vibrate(ms); }

function shell(content){
  app.innerHTML = `<div class="topbar"><div class="brand">LEVEL UP / TODAY</div><button class="ghost" id="homeBtn">最初へ</button></div>${content}`;
  document.querySelector('#homeBtn')?.addEventListener('click', home);
}

function home(){
  currentScenario = null; run = null;
  if(!state.introSeen){ showIntro(); return; }
  showChapters();
}

function showIntro(){
  app.innerHTML = `
    <section class="hero">
      <div class="eyebrow">LEVEL UP — PRIORITY TRAINING</div>
      <h1>今日が<br>最後なら？</h1>
      <p>あなたに、24時間だけ与えます。仕事をしてもいい。寝てもいい。SNSを見てもいい。誰かに会ってもいい。</p>
      <p class="note">正解は表示しません。いつものように一日を選んでください。</p>
    </section>
    <button class="primary" id="startBtn">今日を始める</button>`;
  document.querySelector('#startBtn').addEventListener('click', () => {
    state.introSeen = true; save(); startScenario(0);
  });
}

function showChapters(){
  shell(`
    <section class="run-title"><h2>もう一度、今日を選ぶ。</h2><p>同じ24時間でも、選ぶ順番で一日の意味は変わる。</p></section>
    <div class="section-title">DAYS</div>
    <section class="chapter-grid">${SCENARIOS.map((s,i)=>{
      const unlocked = i < state.unlocked;
      const best = bestScore(state.history, s.id);
      return `<button class="chapter ${unlocked?'':'locked'}" data-index="${i}" ${unlocked?'':'disabled'}>
        <span class="chapter-num">DAY ${String(i+1).padStart(2,'0')}</span>
        ${best!==null?`<span class="best">BEST ${best}</span>`:''}
        <h3>${s.title}</h3><p>${s.subtitle}</p>
      </button>`;
    }).join('')}</section>
    <div class="section-title">TRAINING RULE</div>
    <p class="reflection">「重要そうなこと」を当てるゲームではありません。<strong>自分が本当に選びたいことに、惰性より先に時間を渡せるか</strong>を何度も試すゲームです。</p>
  `);
  document.querySelectorAll('.chapter:not(.locked)').forEach(btn => btn.addEventListener('click', ()=>startScenario(Number(btn.dataset.index))));
}

function startScenario(index){
  currentScenario = SCENARIOS[index];
  const previousRuns = state.history.filter(h=>h.scenarioId===currentScenario.id).length;
  run = createRun(currentScenario, previousRuns + 1);
  renderRun();
}

function renderRun(){
  const usedPct = Math.round((run.elapsed/24)*100);
  shell(`
    <section class="clock-card">
      <div class="clock-row"><div><div class="remaining-label">残り時間</div><div class="remaining">${formatDuration(run.remaining)}</div></div><div class="now">${clockAt(currentScenario.startHour, run.elapsed)}<br>選択 ${run.chosen.length}件</div></div>
      <div class="daybar"><div style="width:${usedPct}%"></div></div>
    </section>
    <section class="run-title"><h2>${currentScenario.title}</h2><p>${currentScenario.subtitle}</p></section>
    <div class="timeline">${run.chosen.length ? run.chosen.map(a=>`<span class="timeline-chip">${a.icon} ${a.title}</span>`).join('') : '<span class="empty-timeline">まだ何も選んでいない。</span>'}</div>
    <div class="section-title">このあと、何をする？</div>
    <section class="actions">
      ${currentScenario.actions.map(a=>{
        const alreadyChosen = run.chosen.some(x=>x.id===a.id);
        const disabled = alreadyChosen || a.duration > run.remaining + 1e-9;
        return `<button class="action" data-id="${a.id}" ${disabled?'disabled':''}>
          <span class="action-icon">${alreadyChosen?'✓':a.icon}</span><span><h3>${a.title}</h3><p>${alreadyChosen?'今日、もう選んだ。':a.desc}</p></span><span class="duration">${alreadyChosen?'済':formatDuration(a.duration)}</span>
        </button>`;
      }).join('')}
      <div class="end-wrap"><button class="primary" id="endDay">この一日を終える</button></div>
    </section>
    <div class="done-flash" id="flash"></div>
  `);
  document.querySelectorAll('.action').forEach(btn => btn.addEventListener('click', ()=>{
    const action = currentScenario.actions.find(a=>a.id===btn.dataset.id);
    run = chooseAction(run, action);
    haptic();
    renderRun();
    flash(`${action.icon} ${action.title}　−${formatDuration(action.duration)}`);
  }));
  document.querySelector('#endDay').addEventListener('click', () => {
    haptic(22); run = endRun(run); showReveal();
  });
}

function flash(text){
  const el = document.querySelector('#flash');
  if(!el) return; el.textContent=text; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 850);
}

function showReveal(){
  const firstEverForScenario = !state.history.some(h=>h.scenarioId===currentScenario.id);
  shell(`
    <section class="reveal">
      <div class="small">${firstEverForScenario?'DAY COMPLETE':'ONE MORE DAY COMPLETE'}</div>
      <div class="pulse-line"></div>
      <h2>${firstEverForScenario?'これが、人生最後の日でした。':'もし、今日が最後だったなら。'}</h2>
      <p>${firstEverForScenario?'もう予定は増えません。締切も、未読も、明日もありません。残ったのは、今日どこに時間を使ったかだけです。':'同じ日でも、選び方は変えられる。結果を見てみよう。'}</p>
    </section>
    <button class="primary" id="resultBtn">一日を振り返る</button>
  `);
  document.querySelector('#resultBtn').addEventListener('click', showResult);
}

function showResult(){
  const result = evaluateRun(currentScenario, run);
  state.history.push({ scenarioId:currentScenario.id, runNumber:run.runNumber, chosen:run.chosen.map(a=>a.id), result, at:Date.now() });
  const scenarioIndex = SCENARIOS.findIndex(s=>s.id===currentScenario.id);
  const qualifies = result.alignment >= 65 || run.runNumber >= 2;
  if(qualifies) state.unlocked = Math.max(state.unlocked, Math.min(SCENARIOS.length, scenarioIndex + 2));
  save();

  const missedLabels = result.missedHeart.map(id=>currentScenario.actions.find(a=>a.id===id)?.title).filter(Boolean);
  const prevRuns = state.history.filter(h=>h.scenarioId===currentScenario.id && h.runNumber < run.runNumber);
  const prev = prevRuns.length ? prevRuns[prevRuns.length-1].result.alignment : null;
  const delta = prev===null ? null : result.alignment - prev;
  const reflection = makeReflection(result, delta);
  shell(`
    <section class="result-header">
      <div class="kicker">LAST DAY RESULT</div><h2>${currentScenario.title}</h2>
      <div class="score-ring" style="--score:${result.alignment}%"><strong>${result.alignment}</strong><span>本心一致度</span></div>
    </section>
    <section class="metrics">
      <div class="metric good"><label>本当にやりたかったこと</label><b>${result.heartDone}/${result.heartTotal}</b></div>
      <div class="metric good"><label>本当に言いたかったこと</label><b>${result.saidDone}/${result.saidTotal}</b></div>
      <div class="metric bad"><label>惰性で使った時間</label><b>${formatDuration(result.inertiaHours)}</b></div>
      <div class="metric"><label>自分で選んだ時間</label><b>${formatDuration(result.intentionalHours)}</b></div>
      ${delta!==null?`<div class="metric ${delta>=0?'good':'bad'}"><label>前回から</label><b>${delta>=0?'+':''}${delta}</b></div>`:''}
    </section>
    ${missedLabels.length?`<section class="missed"><h3>今日、未着手だったもの</h3>${missedLabels.map(x=>`<div class="missed-item">${x}</div>`).join('')}</section>`:'<section class="missed"><h3>今日、未着手だったもの</h3><div class="missed-item">本当にやりたかったことには、全部時間を渡せた。</div></section>'}
    <p class="reflection">${reflection}</p>
    <div class="stack">
      <button class="primary" id="retry">同じ一日を、もう一度</button>
      ${scenarioIndex+1 < state.unlocked && scenarioIndex+1 < SCENARIOS.length ? '<button class="secondary" id="next">別の一日へ進む</button>' : ''}
      <button class="secondary" id="chapters">日を選ぶ</button>
    </div>
    <p class="tiny">高得点が目的ではありません。<br>「何を先に選ぶと、自分は納得するか」を身体で覚えるのが目的です。</p>
  `);
  if(result.alignment>=82) confetti();
  document.querySelector('#retry').addEventListener('click', ()=>startScenario(scenarioIndex));
  document.querySelector('#next')?.addEventListener('click', ()=>startScenario(scenarioIndex+1));
  document.querySelector('#chapters').addEventListener('click', showChapters);
}

function makeReflection(r, delta){
  if(r.inertiaHours >= 5) return 'やりたいことがなかったのではなく、惰性に先に時間を渡していました。次は「あとで」にしたくないものを、最初の6時間に置いてみてください。';
  if(r.heartDone === r.heartTotal && r.inertiaHours <= 2) return '大事なことを後回しにせず、先に時間を渡せています。ここで覚えたいのは「全部やる」ではなく、「自分で選んだ順番で一日を使う」感覚です。';
  if(delta !== null && delta > 12) return '同じ24時間でも、一日の意味はかなり変わりました。増えたのは時間ではなく、選ぶ順番です。';
  if(r.heartDone <= Math.floor(r.heartTotal/2)) return '忙しかった一日というより、「大事だけど急がないもの」が後ろに押し出された一日でした。最後の日だと知っていたら、最初に何を置きますか。';
  return 'かなり自分で選べています。次は「やる・やらない」だけでなく、大事なことを一日の前半に置けるか試してみてください。';
}

function confetti(){
  const wrap=document.createElement('div'); wrap.className='confetti';
  for(let i=0;i<34;i++){const p=document.createElement('i'); p.style.left=`${Math.random()*100}%`;p.style.animationDelay=`${Math.random()*.35}s`;p.style.opacity=.5+Math.random()*.5;p.style.transform=`rotate(${Math.random()*180}deg)`;wrap.appendChild(p)}
  document.body.appendChild(wrap); setTimeout(()=>wrap.remove(),1700);
}

home();
