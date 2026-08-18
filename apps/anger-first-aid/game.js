(() => {
  'use strict';

  const $app = document.getElementById('app');
  const KEYS = {
    logs: 'hitobito.angerFirstAid.v1.logs',
    practice: 'hitobito.angerFirstAid.v1.practice'
  };

  const triggers = [
    ['disrespect','失礼・否定された'],['unfair','不公平だと感じた'],['ignored','無視・軽視された'],['rushed','急かされた'],
    ['broken','約束・期待が外れた'],['overload','余裕がなかった'],['self','自分に腹が立った'],['unknown','うまく言えない']
  ];
  const signs = [
    ['heat','顔・体が熱い'],['tight','顎・拳・肩に力'],['breath','息が浅い'],['race','頭の中が高速'],
    ['blank','頭が真っ白'],['reply','今すぐ言い返したい'],['slam','物に当たりたくなる'],['leave','その場から逃げたい']
  ];

  const reframes = [
    {id:'fact', title:'事実だけに戻す', text:'相手の意図まで今決めない。「起きた事実」と「自分の解釈」をいったん分ける。'},
    {id:'wish', title:'「べき」を「してほしかった」へ', text:'「絶対こうするべきだった」を、「私はこうしてほしかった」に言い換える。要求を希望に戻す。'},
    {id:'later', title:'今は判定しない', text:'正しい・間違い、続ける・辞める、返信する・しない。熱が高い今は最終判断を保留する。'},
    {id:'control', title:'自分の次の一手だけ選ぶ', text:'相手を変えることではなく、距離・時間・伝え方など、自分が選べる行動へ戻る。'}
  ];

  const actions = [
    {id:'timeout10', title:'10分、その場から離れる', sub:'会話や返信を続けず、場所か時間を分ける。', script:'「今はうまく話せない。少し時間を置いてから話したい」'},
    {id:'draft', title:'返信は下書きで止める', sub:'送信せず、書きたいことだけ外に出す。', script:'送らない。下書きだけ作って、あとで読み直す。'},
    {id:'listen', title:'反論の前に質問を1つ', sub:'すぐ結論を出さず、相手の意図を確認する。', script:'「それは、どういう意味で言った？」'},
    {id:'request', title:'要求ではなく依頼で伝える', sub:'「普通は」「絶対」を外して、具体的に頼む。', script:'「私はこうしてもらえると助かる」'},
    {id:'noaction', title:'今日は決めない', sub:'大きな決断を熱い状態で確定させない。', script:'この件は、落ち着いてから決める。'}
  ];

  const practice = [
    {q:'チャットで刺さる言い方をされた。指がもう返信ボタンの上にある。最初の一手は？', a:'stop', choices:[['reply','同じ強さですぐ返す'],['stop','送らずに数秒止まる'],['explain','長文で誤解を全部説明する']], why:'まず反応と行動の間に間を作る。内容の整理は、そのあとでいい。'},
    {q:'「なんで毎回こうなの？」と頭に浮かんだ。怒りを増幅しにくい言い換えは？', a:'fact', choices:[['always','本当に毎回だ、と証拠を集める'],['fact','今回起きた事実だけに戻る'],['win','相手の矛盾を全部探す']], why:'「いつも・絶対」のような広げ方をやめ、今回の事実へ戻す。'},
    {q:'約束を忘れられた。「守るのが普通だろ」と思った。次に使う型は？', a:'wish', choices:[['wish','「守ってほしかった」に直す'],['punish','同じことをやり返す'],['judge','人間性の問題だと結論づける']], why:'要求の言葉を希望・依頼の言葉に変えると、次の伝え方を選びやすい。'},
    {q:'会議で話を遮られて体が熱い。今すぐ相手の意図を決めつけそう。', a:'later', choices:[['later','意図の判定を保留する'],['mind','見下されたに違いないと決める'],['quit','その場で関係を切る']], why:'熱が高い時は、相手の意図や大きな決断を確定しない。'},
    {q:'怒りはまだ7/10。でも「10分離れる」を選べた。これは？', a:'success', choices:[['fail','怒りがゼロでないので失敗'],['success','行動を選び直せたので成功'],['hide','怒っていること自体を隠す']], why:'目的は感情を消すことではなく、勢いのまま行動しない選択肢を増やすこと。'},
    {q:'物に当たりたくなるほど強い。最優先は？', a:'safe', choices:[['win','議論に勝つ'],['safe','人・物・危険な場所から距離を取る'],['message','今の気持ちを全部送る']], why:'危険がありそうな時は、会話術より安全と距離を優先する。'}
  ];

  let flow = null;
  let timers = [];
  let practiceState = {index:0, score:0, answered:false};

  function esc(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function read(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function logs() { const l = read(KEYS.logs, []); return Array.isArray(l) ? l : []; }
  function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }
  function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function every(fn, ms) { const id = setInterval(fn, ms); timers.push(id); return id; }
  function vibrate(ms=12) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch {} }
  function tone(cool=false) { document.body.dataset.tone = cool ? 'cool' : 'hot'; }
  function toast(msg) { let el=document.querySelector('.toast'); if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el);} el.textContent=msg;el.classList.add('show');later(()=>el.classList.remove('show'),1400); }
  function header(progress=0, back='home') {
    return `<header class="topbar"><a class="home-link" href="/" aria-label="LEVEL UPへ戻る">⌂</a><div class="brand">LEVEL UP / ANGER FIRST AID</div><button class="icon-btn" data-nav="${back}" aria-label="閉じる">×</button></header>${progress ? `<div class="progress"><i style="--p:${progress}%"></i></div>`:''}`;
  }
  function footer() {
    return `<div class="footer-note">セルフケア用。診断・治療や医療専門家の代替ではありません。<button class="text-btn" data-nav="safety">危ないと感じるとき</button> · <button class="text-btn" data-action="erase">端末内の記録を消す</button></div>`;
  }
  function screen(html, progress=0, back='home') {
    clearTimers();
    $app.innerHTML = header(progress, back) + `<section class="screen">${html}</section>`;
    window.scrollTo({top:0,behavior:'instant'});
  }

  function home() {
    tone(false); flow=null;
    const l=logs();
    const last=l[0];
    screen(`
      <div class="eyebrow">咄嗟の怒りに、行動する前の間を。</div>
      <h1 class="hero-title">怒りの<span>処方箋</span></h1>
      <p class="lead">怒ったままでいい。まず、送らない・言い返さない・決めない。短い手順で「次にどう動くか」を自分で選び直す。</p>
      <button class="emergency" data-action="start"><span class="small">EMERGENCY MODE</span><strong>いま、怒ってる</strong><span class="go">30〜60秒の緊急処方 <b>→</b></span></button>
      <div class="quick-grid">
        <button class="quick-card" data-nav="practice"><span class="mini-icon">↯</span><b>反射を練習</b><span>平常時に6問。咄嗟の一手を体に入れる。</span></button>
        <button class="quick-card" data-nav="history"><span class="mini-icon">◎</span><b>自分の処方箋</b><span>${l.length ? `${l.length}回の記録から傾向を見る。` : '使うほど、自分の傾向が見えてくる。'}</span></button>
      </div>
      ${last ? `<p class="micro" style="margin-top:14px">前回：${esc(labelOf(triggers,last.trigger) || '未選択')} · ${last.before} → ${last.after}</p>`:''}
      <div class="spacer"></div>${footer()}`);
  }

  function start() {
    flow={startedAt:Date.now(),before:null,trigger:null,sign:null,reframe:null,action:null,after:null};
    intensity();
  }

  function intensity() {
    screen(`
      <div class="eyebrow">STEP 0 / 5</div><h2 class="section-title">いま、どのくらい熱い？</h2>
      <p class="section-copy">正確じゃなくていい。いちばん近いものを1つ。</p>
      <div class="heat-grid">
        ${[[4,'イラッ'],[6,'かなり'],[8,'強い'],[10,'爆発前']].map(([v,t])=>`<button class="heat" data-before="${v}" data-v="${v}"><b>${v}</b><span>${t}</span></button>`).join('')}
      </div>
      <div class="spacer"></div><p class="micro">数字は記録のためだけ。高くても悪いわけではありません。</p>`,5);
  }

  function stopPhase() {
    tone(false);
    screen(`
      <div class="eyebrow">STEP 1 / 5 · STOP</div><h2 class="section-title">まず、反応しない。</h2>
      <div class="rule-card"><p class="rule">今だけは、<span>結論を出さない。</span></p>
        <div class="rule-list"><div class="rule-item"><span class="rule-dot">1</span>送らない</div><div class="rule-item"><span class="rule-dot">2</span>言い返さない</div><div class="rule-item"><span class="rule-dot">3</span>大きな決断をしない</div></div>
      </div>
      <div class="count-wrap"><div class="count-ring" id="stopRing"><strong id="stopCount">6</strong><span>SECONDS</span></div></div>
      <div class="action-stack"><button class="primary" id="stopNext" data-action="breathe" disabled>6秒たったら次へ</button><button class="ghost" data-nav="safety">人や物を傷つけそう</button></div>`,20);
    let n=6; const ring=document.getElementById('stopRing'), count=document.getElementById('stopCount'), btn=document.getElementById('stopNext');
    every(()=>{n--; if(n<0)return; count.textContent=n; ring.style.setProperty('--deg',`${((6-n)/6)*360}deg`); if(n===0){btn.disabled=false;btn.textContent='呼吸へ →';vibrate(18);clearTimers();}},1000);
  }

  function breathe() {
    tone(true);
    screen(`
      <div class="eyebrow cool">STEP 2 / 5 · COOL</div><h2 class="section-title">吐く方を、少し長く。</h2>
      <p class="section-copy">円だけ見ればOK。3回だけ。</p>
      <div class="breathe-stage"><div class="breath-cycle" id="cycle">1 / 3</div><div class="orb-shell"><div id="orb" class="orb exhale"></div></div><div class="breath-word" id="breathWord">吸う</div><div class="breath-time" id="breathTime">4秒</div></div>
      <div class="action-stack"><button class="secondary" data-action="skipBreath">呼吸を飛ばして次へ</button></div>`,38);
    const orb=document.getElementById('orb'), word=document.getElementById('breathWord'), time=document.getElementById('breathTime'), cyc=document.getElementById('cycle');
    let cycle=1;
    const doInhale=()=>{orb.className='orb inhale';word.textContent='吸う';time.textContent='4秒';cyc.textContent=`${cycle} / 3`;vibrate(8);later(doExhale,4000)};
    const doExhale=()=>{orb.className='orb exhale';word.textContent='吐く';time.textContent='6秒';vibrate(8);later(()=>{ if(cycle>=3){notice();} else {cycle++;doInhale();}},6000)};
    doInhale();
  }

  function notice() {
    tone(true);
    screen(`
      <div class="eyebrow cool">STEP 3 / 5 · NOTICE</div><h2 class="section-title">何に反応した？</h2>
      <p class="section-copy">理由を分析しなくていい。近い言葉を1つ選ぶ。</p>
      <div class="tag-grid">${triggers.map(([id,l])=>`<button class="tag-choice" data-trigger="${id}">${esc(l)}</button>`).join('')}</div>
      <h3 style="font-size:16px;margin:28px 0 11px">体・頭のサインは？</h3>
      <div class="tag-grid">${signs.map(([id,l])=>`<button class="tag-choice" data-sign="${id}">${esc(l)}</button>`).join('')}</div>
      <div class="spacer"></div><div class="action-stack"><button class="primary cool" id="noticeNext" data-action="reframe" disabled>次へ</button></div>`,56);
  }

  function reframe() {
    tone(true);
    screen(`
      <div class="eyebrow cool">STEP 4 / 5 · REFRAME</div><h2 class="section-title">頭の火に、言葉を1枚。</h2>
      <p class="section-copy">納得しなくていい。今の自分が使えそうな型を1つ。</p>
      <div class="choice-grid">${reframes.map(r=>`<button class="choice" data-reframe="${r.id}"><strong>${esc(r.title)}</strong><small>${esc(r.text)}</small></button>`).join('')}</div>`,74);
  }

  function chooseAction() {
    tone(true);
    screen(`
      <div class="eyebrow cool">STEP 5 / 5 · CHOOSE</div><h2 class="section-title">次に、どう動く？</h2>
      <p class="section-copy">「正しい答え」ではなく、後悔しにくい一手を1つ。</p>
      <div class="choice-grid">${actions.map(a=>`<button class="choice" data-nextaction="${a.id}"><strong>${esc(a.title)}</strong><small>${esc(a.sub)}</small></button>`).join('')}</div>`,88);
  }

  function afterIntensity() {
    const a=actions.find(x=>x.id===flow.action);
    screen(`
      <div class="eyebrow cool">LAST CHECK</div><h2 class="section-title">この一手で、いったん止める。</h2>
      <div class="reframe-card"><div class="label">YOUR NEXT MOVE</div><h3>${esc(a.title)}</h3><p>${esc(a.sub)}</p><div class="script" id="scriptText">${esc(a.script)}</div><button class="copy-btn" data-action="copyScript">文をコピー</button></div>
      <h3 style="font-size:16px;margin:24px 0 11px">いまの怒りは？</h3>
      <div class="heat-grid">${[[2,'下がった'],[4,'少し'],[6,'まだある'],[8,'強い']].map(([v,t])=>`<button class="heat" data-after="${v}" data-v="${v}"><b>${v}</b><span>${t}</span></button>`).join('')}</div>
      <button class="ghost" data-after="${Math.min(10,flow.before)}" style="margin-top:7px">変わらない</button>`,96);
  }

  function finish() {
    const entry={...flow,endedAt:Date.now()};
    const l=logs();l.unshift(entry);write(KEYS.logs,l.slice(0,40));
    const delta=entry.before-entry.after;
    const message=delta>0 ? '少し冷えた。次の行動は、自分で選べる。' : '下がらなくてもいい。勢いのまま動かなかった時点で、1回選び直せた。';
    screen(`
      <div class="eyebrow cool">DONE</div>
      <div class="result-hero"><div class="delta"><span class="num">${entry.before}</span><span class="arrow">→</span><span class="num after">${entry.after}</span></div><div class="delta-label">ANGER HEAT</div><h2>${esc(message)}</h2><p>選んだ一手：${esc(labelAction(entry.action))}</p></div>
      <div class="stats"><div class="stat"><strong>${logs().length}</strong><span>累計の緊急処方</span></div><div class="stat"><strong>${delta>0?`-${delta}`:'±0'}</strong><span>今回の変化</span></div><div class="stat"><strong>${Math.round((Date.now()-entry.startedAt)/1000)}s</strong><span>今回の所要時間</span></div></div>
      <div class="action-stack"><button class="primary cool" data-nav="home">閉じる</button><button class="secondary" data-nav="history">自分の処方箋を見る</button></div>`,100);
  }

  function history() {
    tone(true); const l=logs();
    const summary=makeSummary(l);
    screen(`
      <div class="eyebrow cool">MY ANGER PLAN</div><h2 class="section-title">自分の処方箋</h2><p class="section-copy">「何に反応しやすいか」と「どの一手の時に落ち幅が大きかったか」を、端末内の記録から見る。</p>
      ${l.length ? `<div class="stats"><div class="stat"><strong>${l.length}</strong><span>記録</span></div><div class="stat"><strong>${summary.avg}</strong><span>平均 Before</span></div><div class="stat"><strong>${summary.drop}</strong><span>平均の落ち幅</span></div></div>
      <div class="reframe-card"><div class="label">YOUR PATTERN</div><h3>${esc(summary.triggerText)}</h3><p>${esc(summary.actionText)}</p></div>
      <h3 style="font-size:15px;margin:18px 0 10px">最近の記録</h3><div class="log-list">${l.slice(0,10).map(logHtml).join('')}</div>` : `<div class="empty">まだ記録はありません。<br>怒った瞬間に「いま、怒ってる」から1回使うと、ここに自分の傾向がたまります。</div>`}
      <div class="spacer"></div><div class="action-stack"><button class="primary cool" data-action="start">いま使う</button><button class="secondary" data-nav="practice">平常時に練習する</button></div>${footer()}`);
  }

  function makeSummary(l) {
    const avg=l.length?(l.reduce((s,x)=>s+x.before,0)/l.length).toFixed(1):'-';
    const drop=l.length?(l.reduce((s,x)=>s+(x.before-x.after),0)/l.length).toFixed(1):'-';
    const tr=mode(l.map(x=>x.trigger).filter(Boolean));
    const actionStats={};l.forEach(x=>{if(!x.action)return;(actionStats[x.action]??=[]).push(x.before-x.after)});
    let best=null,bestAvg=-Infinity;Object.entries(actionStats).forEach(([id,arr])=>{const a=arr.reduce((s,v)=>s+v,0)/arr.length;if(a>bestAvg){bestAvg=a;best=id;}});
    return {avg,drop,triggerText:tr?`反応が多い：${labelOf(triggers,tr)}`:'まだ傾向は未確定',actionText:best?`これまで比較的、怒りの落ち幅が大きかった一手：${labelAction(best)}（記録上の傾向）`:'記録が増えると、選んだ一手との傾向が見えてきます。'};
  }
  function mode(arr){const c={};let best=null,n=0;arr.forEach(x=>{c[x]=(c[x]||0)+1;if(c[x]>n){n=c[x];best=x}});return best}
  function labelOf(list,id){return list.find(x=>x[0]===id)?.[1]||''}
  function labelAction(id){return actions.find(x=>x.id===id)?.title||''}
  function logHtml(x){const d=new Date(x.endedAt);return `<div class="log"><div class="log-top"><span>${d.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})} ${d.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</span><strong>${x.before} → ${x.after}</strong></div><p>${esc(labelOf(triggers,x.trigger)||'トリガー未選択')} · ${esc(labelAction(x.action)||'行動未選択')}</p></div>`}

  function practiceHome() {
    tone(false); const saved=read(KEYS.practice,{best:0,runs:0}); practiceState={index:0,score:0,answered:false};
    screen(`
      <div class="eyebrow">REFLEX TRAINING</div><h2 class="section-title">怒る前に、反射を作る。</h2><p class="section-copy">本番で長文は読めない。だから平常時に「最初の一手」を6問だけ練習する。</p>
      <div class="result-hero" style="background:rgba(255,177,90,.06);border-color:rgba(255,177,90,.16)"><div class="delta-label">BEST SCORE</div><div class="delta"><span class="num">${saved.best||0}</span><span class="arrow">/</span><span class="num after">6</span></div><p>${saved.runs?`${saved.runs}回プレイ済み`:'まだ未プレイ'}</p></div>
      <div class="spacer"></div><div class="action-stack"><button class="primary" data-action="practiceStart">6問スタート</button></div>`,0,'home');
  }
  function practiceQuestion() {
    clearTimers(); const q=practice[practiceState.index];
    screen(`
      <div class="eyebrow">QUESTION ${practiceState.index+1} / ${practice.length}</div><div class="practice-card"><div class="practice-no">3秒で選ぶ</div><h3>${esc(q.q)}</h3></div>
      <div class="choice-grid" id="practiceChoices">${q.choices.map(([id,t])=>`<button class="choice" data-practice="${id}"><strong>${esc(t)}</strong></button>`).join('')}</div><div id="practiceFeedback"></div>`,Math.round(((practiceState.index)/practice.length)*100),'practice');
  }
  function answerPractice(id,btn){if(practiceState.answered)return;practiceState.answered=true;const q=practice[practiceState.index];const ok=id===q.a;if(ok)practiceState.score++;document.querySelectorAll('[data-practice]').forEach(b=>b.disabled=true);btn.classList.add('selected');const f=document.getElementById('practiceFeedback');f.innerHTML=`<div class="feedback ${ok?'ok':'ng'}"><strong>${ok?'○ その一手。':'△ 先に止める型を。'}</strong><br>${esc(q.why)}</div><div class="action-stack"><button class="primary" data-action="practiceNext">${practiceState.index===practice.length-1?'結果を見る':'次の問題 →'}</button></div>`;vibrate(ok?16:8)}
  function practiceNext(){if(practiceState.index>=practice.length-1){practiceResult();return}practiceState.index++;practiceState.answered=false;practiceQuestion()}
  function practiceResult(){const saved=read(KEYS.practice,{best:0,runs:0});saved.best=Math.max(saved.best||0,practiceState.score);saved.runs=(saved.runs||0)+1;write(KEYS.practice,saved);tone(true);screen(`<div class="eyebrow cool">TRAINING COMPLETE</div><div class="result-hero"><div class="delta-label">SCORE</div><div class="delta"><span class="num after">${practiceState.score}</span><span class="arrow">/</span><span class="num">6</span></div><h2>${practiceState.score>=5?'かなり反射になってきた。':'間違いは練習で使うためにある。'}</h2><p>本番は正解を当てるゲームではない。「止まる → 選ぶ」の間を作れればいい。</p></div><div class="action-stack"><button class="primary cool" data-nav="home">ホームへ</button><button class="secondary" data-action="practiceStart">もう6問</button></div>`,100)}

  function safety() {
    tone(false); screen(`<div class="safety"><div class="eyebrow">SAFETY FIRST</div><h2>危ないと感じるなら、話し合いより距離。</h2><p><strong>人や物を傷つけそう、運転や危険な行動をしそう</strong>なくらい怒りが強い時は、このアプリで解決しようとせず安全を優先してください。</p><div class="safety-list"><div><b>1</b><span>相手・壊れやすい物・危険物から距離を取る。</span></div><div><b>2</b><span>運転や対面の衝突を続けず、安全な場所へ移る。</span></div><div><b>3</b><span>一人で安全を保てない緊急時は、地域の緊急サービスや周囲の助けを利用する。</span></div></div></div><div class="spacer"></div><div class="action-stack"><button class="primary" data-nav="home">ホームへ</button></div><div class="footer-note">このアプリはセルフケア用で、診断・治療の代替ではありません。</div>`,0,'home'); }

  function erase(){ if(confirm('この端末に保存した怒りの記録と練習記録を削除しますか？')){localStorage.removeItem(KEYS.logs);localStorage.removeItem(KEYS.practice);toast('端末内の記録を削除しました');home();}}

  $app.addEventListener('click', async e => {
    const el=e.target.closest('button,a'); if(!el)return;
    const nav=el.dataset.nav; if(nav){e.preventDefault(); if(nav==='home')home(); if(nav==='history')history(); if(nav==='practice')practiceHome(); if(nav==='safety')safety(); return;}
    if(el.dataset.before){flow.before=Number(el.dataset.before);vibrate();stopPhase();return;}
    if(el.dataset.trigger){flow.trigger=el.dataset.trigger;document.querySelectorAll('[data-trigger]').forEach(x=>x.classList.toggle('selected',x===el));checkNotice();return;}
    if(el.dataset.sign){flow.sign=el.dataset.sign;document.querySelectorAll('[data-sign]').forEach(x=>x.classList.toggle('selected',x===el));checkNotice();return;}
    if(el.dataset.reframe){flow.reframe=el.dataset.reframe;vibrate();chooseAction();return;}
    if(el.dataset.nextaction){flow.action=el.dataset.nextaction;vibrate();afterIntensity();return;}
    if(el.dataset.after){flow.after=Number(el.dataset.after);finish();return;}
    if(el.dataset.practice){answerPractice(el.dataset.practice,el);return;}
    const a=el.dataset.action;
    if(a==='start')start();
    if(a==='breathe')breathe();
    if(a==='skipBreath')notice();
    if(a==='reframe')reframe();
    if(a==='practiceStart'){practiceState={index:0,score:0,answered:false};practiceQuestion();}
    if(a==='practiceNext')practiceNext();
    if(a==='erase')erase();
    if(a==='copyScript'){try{await navigator.clipboard.writeText(document.getElementById('scriptText')?.textContent||'');toast('コピーしました');}catch{toast('長押しでコピーできます');}}
  });

  function checkNotice(){const btn=document.getElementById('noticeNext');if(btn)btn.disabled=!(flow?.trigger&&flow?.sign)}
  home();
})();
