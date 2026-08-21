(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const key = 'levelup-jinsei-title-real-v1';
  const lenses = {
    chapter:{name:'章を変える',question:'終点ではなく区切りにするなら、何章の始まり？',next:'次の章の最初の1カットは？'},
    foreshadow:{name:'伏線にする',question:'意味をまだ確定しないなら、どんな「伏線候補」？',next:'今は結論を出さず、何だけ残す？'},
    reframe:{name:'意味をずらす',question:'同じ事実の、別の面にタイトルをつけるなら？',next:'この出来事から残ったものを1つ挙げるなら？'},
    challenge:{name:'攻略対象にする',question:'人格評価ではなく攻略対象にするなら、どんなタイトル？',next:'次回の攻略法を1つだけ作るなら？'},
    space:{name:'余白にする',question:'前向きにも悲観にも決めず、空白に置くなら？',next:'今日は何も決めず、どこで考えるのを止める？'},
    observe:{name:'事実を切り取る',question:'評価を足さず、一場面として切り取るなら？',next:'起きた事実だけ一文で残すなら？'}
  };
  let modal, selected='space';

  function ensureLauncher(){
    const again=$('.again');
    if(!again || $('[data-real-title-launch]')) return;
    const b=document.createElement('button');
    b.type='button'; b.className='primary real-title-launch'; b.dataset.realTitleLaunch='1';
    b.textContent='今の出来事に、本当にタイトルをつける →';
    b.addEventListener('click',open); again.before(b);
  }
  function ensureModal(){
    if(modal) return modal;
    modal=document.createElement('div'); modal.className='real-title-modal'; modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="real-title-card" role="dialog" aria-modal="true" aria-labelledby="realTitleHeading">
      <div class="real-title-head"><div><small>REAL LIFE / EDIT ONE EVENT</small><h2 id="realTitleHeading">今の出来事を、<br>意味1個に固定しない。</h2></div><button type="button" data-rt-close aria-label="閉じる">×</button></div>
      <section data-rt-step="input">
        <label><span>いま起きている／引っかかっている出来事</span><textarea data-rt-event maxlength="180" placeholder="例：会議で提案が通らなかった。"></textarea></label>
        <label><span>今、頭がつけているタイトル（任意）</span><input data-rt-old maxlength="70" placeholder="例：自分の提案力が足りなかった日"></label>
        <div class="real-title-meter"><div><span>意味が1つに固まっている感じ</span><strong><b data-rt-before-v>7</b>/10</strong></div><input data-rt-before type="range" min="0" max="10" value="7"></div>
        <button class="real-title-primary" data-rt-next type="button" disabled>別の置き場所を選ぶ</button>
      </section>
      <section data-rt-step="lens" hidden>
        <p class="real-title-question">ポジティブにする必要はない。今と違うレンズを1つ。</p>
        <div class="real-title-lenses">${Object.entries(lenses).map(([id,v])=>`<button type="button" data-rt-lens="${id}"><small>${id.toUpperCase()}</small>${v.name}</button>`).join('')}</div>
      </section>
      <section data-rt-step="edit" hidden>
        <div class="real-title-lens"><small>今回のレンズ</small><strong data-rt-lens-name></strong></div>
        <label><span data-rt-question></span><input data-rt-new maxlength="70" placeholder="新しいタイトル"></label>
        <label><span data-rt-next-question></span><textarea data-rt-action maxlength="160" placeholder="次の1カット。何もしない、でもOK。"></textarea></label>
        <div class="real-title-meter"><div><span>いま、意味が1つに固まっている感じ</span><strong><b data-rt-after-v>7</b>/10</strong></div><input data-rt-after type="range" min="0" max="10" value="7"></div>
        <small class="real-title-neutral">下がらなくてもOK。別のタイトルを作れたこと自体を記録する。</small>
        <button class="real-title-primary" data-rt-finish type="button">編集前 / 編集後を見る</button>
      </section>
      <section data-rt-step="done" hidden>
        <h3 data-rt-done-title>出来事は同じ。タイトルは選び直せる。</h3>
        <div class="real-title-result"><div><small>EVENT</small><p data-rt-event-out></p></div><div class="old"><small>BEFORE TITLE</small><strong data-rt-old-out></strong></div><div class="new"><small>NEW TITLE</small><strong data-rt-new-out></strong></div><div><small>NEXT CUT</small><p data-rt-action-out></p></div></div>
        <div class="real-title-delta" data-rt-delta></div><div class="real-title-history" data-rt-history hidden></div>
        <button class="real-title-secondary" data-rt-again type="button">別の出来事でもう1回</button>
      </section>
    </div>`;
    document.body.appendChild(modal);
    $('[data-rt-close]',modal).addEventListener('click',close);
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    $('[data-rt-event]',modal).addEventListener('input',validate);
    $('[data-rt-before]',modal).addEventListener('input',e=>$('[data-rt-before-v]',modal).textContent=e.target.value);
    $('[data-rt-after]',modal).addEventListener('input',e=>$('[data-rt-after-v]',modal).textContent=e.target.value);
    $('[data-rt-next]',modal).addEventListener('click',()=>show('lens'));
    $$('[data-rt-lens]',modal).forEach(b=>b.addEventListener('click',()=>chooseLens(b.dataset.rtLens)));
    $('[data-rt-finish]',modal).addEventListener('click',finish);
    $('[data-rt-again]',modal).addEventListener('click',reset);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('show'))close()});
    return modal;
  }
  function show(name){$$('[data-rt-step]',modal).forEach(s=>s.hidden=s.dataset.rtStep!==name)}
  function validate(){$('[data-rt-next]',modal).disabled=$('[data-rt-event]',modal).value.trim().length<2}
  function open(){ensureModal();reset();modal.classList.add('show');modal.setAttribute('aria-hidden','false');requestAnimationFrame(()=>$('[data-rt-event]',modal).focus({preventScroll:true}));try{window.LevelUpTelemetry?.action?.('real-title-start')}catch{}}
  function close(){modal?.classList.remove('show');modal?.setAttribute('aria-hidden','true');$('[data-real-title-launch]')?.focus({preventScroll:true})}
  function reset(){ensureModal();selected='space';$('[data-rt-event]',modal).value='';$('[data-rt-old]',modal).value='';$('[data-rt-new]',modal).value='';$('[data-rt-action]',modal).value='';$('[data-rt-before]',modal).value='7';$('[data-rt-after]',modal).value='7';$('[data-rt-before-v]',modal).textContent='7';$('[data-rt-after-v]',modal).textContent='7';$('[data-rt-next]',modal).disabled=true;show('input')}
  function chooseLens(id){selected=id;const lens=lenses[id]||lenses.space;$('[data-rt-lens-name]',modal).textContent=lens.name;$('[data-rt-question]',modal).textContent=lens.question;$('[data-rt-next-question]',modal).textContent=lens.next;$('[data-rt-after]',modal).value=$('[data-rt-before]',modal).value;$('[data-rt-after-v]',modal).textContent=$('[data-rt-before]',modal).value;show('edit');requestAnimationFrame(()=>$('[data-rt-new]',modal).focus({preventScroll:true}));try{window.LevelUpTelemetry?.action?.(`real-title-lens-${id}`)}catch{}}
  function finish(){const event=$('[data-rt-event]',modal).value.trim(),old=$('[data-rt-old]',modal).value.trim()||'（無意識のタイトル）',nextTitle=$('[data-rt-new]',modal).value.trim(),action=$('[data-rt-action]',modal).value.trim()||'今日はここで意味づけを止める';if(nextTitle.length<1){$('[data-rt-new]',modal).focus();return}const before=Number($('[data-rt-before]',modal).value),after=Number($('[data-rt-after]',modal).value),delta=before-after;$('[data-rt-event-out]',modal).textContent=event;$('[data-rt-old-out]',modal).textContent=`「${old}」`;$('[data-rt-new-out]',modal).textContent=`「${nextTitle}」`;$('[data-rt-action-out]',modal).textContent=action;$('[data-rt-done-title]',modal).textContent=delta>0?'意味の固定が、少しゆるんだ。':delta===0?'重さは同じ。でも別タイトルは作れた。':'少し重くなった。美談にせず、別の置き方だけ残す。';$('[data-rt-delta]',modal).textContent=`意味の固定 ${before} → ${after}　／　${lenses[selected].name}`;save({delta,lens:selected});history();show('done');try{window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete',{detail:{slug:'jinsei-title',delta,lens:selected}}));window.LevelUpTelemetry?.complete?.('real-title')}catch{}}
  function save(run){try{const prev=JSON.parse(localStorage.getItem(key)||'[]'),runs=Array.isArray(prev)?prev.slice(-19):[];runs.push({...run,at:Date.now()});localStorage.setItem(key,JSON.stringify(runs))}catch{}}
  function history(){try{const runs=JSON.parse(localStorage.getItem(key)||'[]'),el=$('[data-rt-history]',modal);if(!Array.isArray(runs)||!runs.length){el.hidden=true;return}const loosened=runs.filter(r=>Number(r.delta)>0).length;el.hidden=false;el.textContent=`現実の出来事 ${runs.length}件を編集。${loosened}件で「意味の固定」が下がりました。`;}catch{}}
  const observer=new MutationObserver(ensureLauncher);observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(ensureLauncher,300);
})();
