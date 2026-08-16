const STORAGE_KEY = 'hitobito.procrastination-rescue.history.v1';

const app = document.querySelector('#app');

const categories = {
  study: { label: '勉強・宿題', icon: '📚' },
  work: { label: '仕事・企画', icon: '💼' },
  reply: { label: '連絡・返信', icon: '✉️' },
  housework: { label: '家事', icon: '🧺' },
  tidy: { label: '片付け', icon: '🧹' },
  admin: { label: '手続き・予約', icon: '🗂️' },
  health: { label: '運動・健康', icon: '👟' },
  other: { label: 'その他', icon: '•' },
};

const ladders = {
  study: ['教材を手元に置く', '教材を開く', '取り組む場所を1つ見る', '1問だけやる', '3分だけ続ける'],
  work: ['作業する場所に行く', '対象のファイルを開く', '見出しか1行だけ書く', '3分だけ進める', '最初の小さな区切りまで進める'],
  reply: ['メール・チャットを開く', '相手のメッセージを開く', '返信欄を開く', '最初の一文だけ書く', '下書きだけ完成させる'],
  housework: ['必要な道具を1つ出す', '対象の場所まで行く', '1個だけ動かす', '1分だけやる', '3分だけ続ける'],
  tidy: ['片付ける場所を見る', '物を1個だけ持つ', '1個だけ戻す・捨てる', '3個だけ片付ける', '3分だけ続ける'],
  admin: ['必要なページ・書類を開く', '必要な情報を1つ確認する', '最初の入力欄だけ埋める', '3分だけ進める', '送信・予約の直前まで進める'],
  health: ['準備する場所へ行く', '靴・道具を出す', '30秒だけ動く', '1分だけ続ける', '3分だけ続ける'],
  other: ['必要なものを1つ手元に置く', '対象を開く・見る', '最初の1個だけ触る', '1分だけやる', '3分だけ続ける'],
};

const blockers = {
  unclear: { title: '最初の一歩が、まだ曖昧', copy: '「やること」は見えていても、「次に手を動かすこと」が見えないと始めにくくなります。まず行動を目に見える形まで下げます。' },
  size: { title: '最初の一歩が大きすぎる', copy: '完成までを一気に考えると、開始そのものが重くなります。今日は完成を目標から外して、入口だけにします。' },
  aversion: { title: '嫌な気持ちを避けたくなっている', copy: '面倒・不安・退屈が強いときは、気合いで押し切らず、嫌な部分との接触を短くします。' },
  perfection: { title: 'ちゃんとやろうとしすぎている', copy: '完成度の条件が高いほど、最初の一手も重くなります。今回は「雑でいい最初の一手」にします。' },
  value: { title: '今やる意味が遠くなっている', copy: '必要なのは分かっていても、今の自分にとってのメリットが遠いと動きにくくなります。まず「終わると何が楽になるか」を1つだけ確認します。' },
  distraction: { title: '始める前に、別のものへ流れやすい', copy: '意志の強さで勝負せず、始める前に誘惑との距離を変えます。そのあと最小の一歩に入ります。' },
  energy: { title: '今日はエネルギーが少ない', copy: '方法が悪いのではなく、今使える力が少ない可能性があります。今日は最小レベルから始め、休む選択も残します。' },
};

const questions = [
  {
    id: 'clarity',
    text: '始めるとしたら、最初に何をするか分かりますか？',
    options: [
      ['clear', 'はっきり分かる', { unclear: 0 }],
      ['somewhat', 'なんとなく分かる', { unclear: 1 }],
      ['unclear', '分からない', { unclear: 3 }],
    ],
  },
  {
    id: 'duration',
    text: 'その最初の一歩は、5分以内で終わりそうですか？',
    options: [
      ['one', '1分以内', { size: 0 }],
      ['five', '5分以内', { size: 1 }],
      ['long', 'もっとかかる', { size: 3 }],
      ['unknown', '分からない', { size: 2, unclear: 1 }],
    ],
  },
  {
    id: 'emotion',
    text: 'それを考えたとき、一番近い感じは？',
    options: [
      ['bother', '面倒', { aversion: 2 }],
      ['anxious', '不安・怖い', { aversion: 3 }],
      ['fail', '失敗したくない', { perfection: 2, aversion: 1 }],
      ['boring', '退屈', { aversion: 2, value: 1 }],
      ['neutral', '特に嫌ではない', {}],
      ['tired', '疲れていて重い', { energy: 3 }],
    ],
  },
  {
    id: 'perfect',
    text: '「ちゃんとやらないと意味がない」と感じますか？',
    options: [
      ['strong', '強く感じる', { perfection: 3 }],
      ['little', '少し感じる', { perfection: 1 }],
      ['none', 'あまり感じない', {}],
    ],
  },
  {
    id: 'value',
    text: 'これを終えるメリットを、今すぐ1つ言えますか？',
    options: [
      ['yes', 'はっきり言える', {}],
      ['maybe', 'なんとなく', { value: 1 }],
      ['no', 'よく分からない', { value: 3 }],
    ],
  },
  {
    id: 'distraction',
    text: '始めようとしても、別のことをしてしまいますか？',
    options: [
      ['often', 'よくある', { distraction: 3 }],
      ['sometimes', 'ときどき', { distraction: 1 }],
      ['rare', 'ほぼない', {}],
    ],
  },
  {
    id: 'energy',
    text: '今の元気はどのくらいありますか？',
    options: [
      ['enough', '十分ある', {}],
      ['little', '少し疲れている', { energy: 1 }],
      ['low', 'かなり疲れている', { energy: 3 }],
      ['empty', '今日はほぼ無理', { energy: 5 }],
    ],
  },
];

const state = {
  screen: 'start', task: '', category: '', questionIndex: 0,
  scores: freshScores(), answers: {}, primary: '', level: 2,
  actionStartedAt: 0, stepsCompleted: 0,
};

function freshScores(){
  return { unclear:0, size:0, aversion:0, perfection:0, value:0, distraction:0, energy:0 };
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}

function render(html){
  app.innerHTML = `<div class="card animate-in">${html}</div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startScreen(){
  state.screen='start';
  render(`
    <p class="eyebrow">いまの一個だけ</p>
    <h1>動けない理由をほどいて、<br>一歩を小さくする。</h1>
    <p class="lead">性格を決めつける診断ではありません。今先送りしていることを1つだけ入れてください。</p>
    <label class="task-label" for="task">いま先送りしていること</label>
    <input id="task" class="task-input" maxlength="80" autocomplete="off" placeholder="例：企画書を作る" value="${escapeHtml(state.task)}">
    <button id="start" class="primary" type="button" disabled>動けない理由をほどく</button>
  `);
  const input=document.querySelector('#task'), button=document.querySelector('#start');
  const sync=()=>{ button.disabled=!input.value.trim(); };
  input.addEventListener('input',sync); sync();
  input.addEventListener('keydown',(e)=>{ if(e.key==='Enter'&&!button.disabled) begin(input.value); });
  button.addEventListener('click',()=>begin(input.value));
  setTimeout(()=>input.focus(),80);
}

function begin(value){
  state.task=value.trim(); state.category=''; state.questionIndex=0; state.scores=freshScores(); state.answers={}; state.stepsCompleted=0;
  categoryScreen();
}

function categoryScreen(){
  state.screen='category';
  const choices=Object.entries(categories).map(([id,c])=>`<button class="choice" data-category="${id}">${c.icon} ${c.label}</button>`).join('');
  render(`
    <div class="progress"><span style="width:8%"></span></div>
    <div class="task-chip">${escapeHtml(state.task)}</div>
    <p class="eyebrow">まず分類</p><h2>これは、どんなことですか？</h2>
    <div class="choices">${choices}</div>
  `);
  document.querySelectorAll('[data-category]').forEach((el)=>el.addEventListener('click',()=>{
    state.category=el.dataset.category; state.questionIndex=0; questionScreen();
  }));
}

function questionScreen(){
  state.screen='question';
  const q=questions[state.questionIndex];
  if(!q){ finishQuestions(); return; }
  const progress=16 + Math.round((state.questionIndex/questions.length)*62);
  const options=q.options.map(([id,label])=>`<button class="choice" data-answer="${id}">${escapeHtml(label)}</button>`).join('');
  render(`
    <div class="progress"><span style="width:${progress}%"></span></div>
    <div class="task-chip">${escapeHtml(state.task)}</div>
    <p class="eyebrow">${state.questionIndex+1} / ${questions.length}</p>
    <h2>${escapeHtml(q.text)}</h2>
    <div class="choices">${options}</div>
  `);
  document.querySelectorAll('[data-answer]').forEach((el)=>el.addEventListener('click',()=>answerQuestion(q,el.dataset.answer)));
}

function answerQuestion(q,answerId){
  const option=q.options.find(([id])=>id===answerId); if(!option)return;
  state.answers[q.id]=answerId;
  const delta=option[2]||{};
  for(const [key,val] of Object.entries(delta)) state.scores[key]+=val;
  state.questionIndex++;
  questionScreen();
}

function finishQuestions(){
  const ranked=Object.entries(state.scores).sort((a,b)=>b[1]-a[1]);
  state.primary=ranked[0][1]===0 ? 'size' : ranked[0][0];
  state.level=initialLevel(state.primary);
  resultScreen();
}

function initialLevel(primary){
  if(primary==='energy') return 0;
  if(primary==='aversion'||primary==='perfection') return 1;
  if(primary==='unclear'||primary==='size') return 2;
  return 1;
}

function resultScreen(){
  state.screen='result';
  const item=blockers[state.primary];
  const ranked=Object.entries(state.scores).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const hints=ranked.map(([key,score])=>`<div class="hint-item"><b>${escapeHtml(blockers[key].title.replace('最初の一歩が、','').replace('最初の一歩が',''))}</b><span>${score>=4?'強め':score>=2?'少しあり':'小さめ'}</span></div>`).join('');
  const extra=state.primary==='distraction' ? '<div class="notice">始める前に、スマホや別タブを手の届かない場所へ1つだけ移してください。</div>' : state.primary==='value' ? '<div class="notice">「終わったら何が少し楽になるか」を1つだけ思い浮かべてから始めます。</div>' : '';
  render(`
    <div class="progress"><span style="width:82%"></span></div>
    <div class="result-badge">今回の詰まり候補</div>
    <h2>${escapeHtml(item.title)}</h2>
    <p class="result-copy">${escapeHtml(item.copy)}</p>
    <div class="score-hint">${hints}</div>
    ${extra}
    <button class="primary" data-action="show-action">今できる一歩を見る</button>
    <button class="text-button" data-action="restart">最初からやり直す</button>
  `);
}

function actionScreen(){
  state.screen='action';
  const ladder=ladders[state.category]||ladders.other;
  state.level=Math.max(0,Math.min(state.level,ladder.length-1));
  const action=ladder[state.level];
  const dots=ladder.map((_,i)=>`<span class="level-dot ${i<=state.level?'on':''}"></span>`).join('');
  const energyNotice=state.primary==='energy' && state.answers.energy==='empty' ? '<div class="notice">今日はほぼ無理を選んでいます。これも重ければ、「今日は休む」を選んでかまいません。</div>' : '';
  render(`
    <div class="progress"><span style="width:92%"></span></div>
    <div class="task-chip">${escapeHtml(state.task)}</div>
    <p class="eyebrow">今はこれだけ</p>
    <div class="action-card">
      <div class="action-kicker">完成させなくていい</div>
      <div class="action-text">${escapeHtml(action)}</div>
      <div class="action-rule">これができたら、いったん終了でOK。</div>
    </div>
    <div class="level-strip" aria-label="行動の大きさ">${dots}</div>
    ${energyNotice}
    <div class="outcome-grid">
      <button class="primary" data-action="done">できた</button>
      <button class="secondary" data-action="smaller">これでも重い</button>
    </div>
    ${state.primary==='energy' ? '<button class="text-button" data-action="rest">今日は休む</button>' : ''}
  `);
  if(!state.actionStartedAt) state.actionStartedAt=Date.now();
}

function makeSmaller(){
  if(state.level>0){ state.level--; actionScreen(); return; }
  render(`
    <div class="task-chip">${escapeHtml(state.task)}</div>
    <p class="eyebrow">ここまで小さくしても重い</p>
    <h2>今日は「始めない」も選べます。</h2>
    <p class="lead">今の一歩をこれ以上小さくするより、休むか、始める時間だけ決める方がよさそうです。</p>
    <button class="primary" data-action="rest">今日は休む</button>
    <button class="secondary" data-action="plan">始める時間だけ決める</button>
  `);
}

function successScreen(){
  state.stepsCompleted++;
  saveHistory('success');
  const ladder=ladders[state.category]||ladders.other;
  const canNext=state.level<ladder.length-1;
  render(`
    <div class="success-icon">✓</div>
    <p class="eyebrow">着手できた</p>
    <h2>できました。</h2>
    <p class="lead">「${escapeHtml(state.task)}」全部ではなく、<strong>「${escapeHtml(ladder[state.level])}」</strong>なら動けました。</p>
    ${canNext?'<button class="primary" data-action="next-step">もう一歩だけやる</button>':''}
    <button class="secondary" data-action="finish">今日はここまで</button>
  `);
}

function plannedScreen(){
  const options=['10分後','食事のあと','お風呂のあと','寝る前','明日の朝'];
  render(`
    <p class="eyebrow">開始だけ予約</p><h2>いつなら、最小の一歩を始めますか？</h2>
    <div class="choices">${options.map(v=>`<button class="choice" data-plan="${v}">${v}</button>`).join('')}</div>
  `);
  document.querySelectorAll('[data-plan]').forEach(el=>el.addEventListener('click',()=>{
    saveHistory('planned',el.dataset.plan);
    render(`<div class="success-icon">↗</div><p class="eyebrow">予定を決めた</p><h2>${escapeHtml(el.dataset.plan)}に始めます。</h2><p class="lead">そのときも、完成ではなく最小の一歩からで大丈夫です。</p><button class="primary" data-action="home">終了する</button>`);
  }));
}

function restScreen(){
  saveHistory('rest');
  render(`<div class="success-icon">–</div><p class="eyebrow">今日は休む</p><h2>今日はここで終了。</h2><p class="lead">「できないのに押す」のではなく、今日は休むと決めました。次回はまた、その時の一歩を小さくします。</p><button class="primary" data-action="home">終了する</button>`);
}

function finishScreen(){
  render(`<div class="success-icon">✓</div><p class="eyebrow">今日の記録</p><h2>一歩動けたので、今日は成功。</h2><p class="lead">次に同じ種類のタスクで止まったときは、今回動けた大きさを優先して出します。</p><button class="primary" data-action="home">別の一個をほどく</button><button class="secondary" data-action="history">履歴を見る</button>`);
}

function saveHistory(result,plan=''){
  const history=getHistory();
  const ladder=ladders[state.category]||ladders.other;
  history.unshift({
    id:Date.now(), task:state.task, category:state.category, blocker:state.primary,
    level:state.level, action:ladder[state.level]||'', result, plan,
    elapsed:state.actionStartedAt?Math.max(1,Math.round((Date.now()-state.actionStartedAt)/1000)):0,
    date:new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY,JSON.stringify(history.slice(0,60)));
}

function getHistory(){
  try{ const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); return Array.isArray(v)?v:[]; }catch{return []}
}

function historyScreen(){
  const history=getHistory();
  const successes=history.filter(x=>x.result==='success').length;
  const plans=history.filter(x=>x.result==='planned').length;
  const rests=history.filter(x=>x.result==='rest').length;
  const list=history.slice(0,12).map(item=>{
    const date=new Date(item.date); const when=Number.isNaN(date.getTime())?'':`${date.getMonth()+1}/${date.getDate()}`;
    const label=item.result==='success'?'できた':item.result==='planned'?'予定を決めた':'休んだ';
    return `<div class="history-item"><div class="history-item-top"><strong>${escapeHtml(item.task)}</strong><time>${when}</time></div><p>${escapeHtml(label)}${item.action?` · ${escapeHtml(item.action)}`:''}</p></div>`;
  }).join('');
  render(`
    <p class="eyebrow">あなたの実績だけを見る</p><h2>行動の履歴</h2>
    <div class="stat-row"><div class="stat"><b>${successes}</b><span>できた</span></div><div class="stat"><b>${plans}</b><span>予定化</span></div><div class="stat"><b>${rests}</b><span>休む判断</span></div></div>
    ${history.length?`<div class="history-list">${list}</div>`:'<div class="empty-state">まだ記録はありません。</div>'}
    <button class="primary" data-action="home">新しい一個をほどく</button>
    ${history.length?'<button class="text-button" data-action="clear-history">履歴を消す</button>':''}
  `);
}

function resetSession(){
  state.task='';state.category='';state.questionIndex=0;state.scores=freshScores();state.answers={};state.primary='';state.level=2;state.actionStartedAt=0;state.stepsCompleted=0;
  startScreen();
}

document.addEventListener('click',(event)=>{
  const el=event.target.closest('[data-action]'); if(!el)return;
  const action=el.dataset.action;
  if(action==='home'||action==='restart') resetSession();
  if(action==='history') historyScreen();
  if(action==='show-action') actionScreen();
  if(action==='smaller') makeSmaller();
  if(action==='done') successScreen();
  if(action==='next-step'){ state.level++; state.actionStartedAt=Date.now(); actionScreen(); }
  if(action==='finish') finishScreen();
  if(action==='plan') plannedScreen();
  if(action==='rest') restScreen();
  if(action==='clear-history'){ localStorage.removeItem(STORAGE_KEY); historyScreen(); }
});

startScreen();
