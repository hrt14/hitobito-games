(()=>{
const app=document.getElementById('app');
const reset=document.getElementById('resetBtn');
const STORE='levelup-recovery-map-v1';

const signals=[
  {id:'loop',side:'mind',text:'同じことを何度も考えている'},
  {id:'focus',side:'mind',text:'集中が続かず、頭が散らばる'},
  {id:'irritable',side:'mind',text:'小さなことにも気持ちが擦れる'},
  {id:'social',side:'mind',text:'会話や連絡を返すのが重い'},
  {id:'sleepy',side:'body',text:'まぶたが重く、横になりたい'},
  {id:'heavy',side:'body',text:'身体全体が重く、動き出しにくい'},
  {id:'muscle',side:'body',text:'肩や脚などに、だるさを感じる'},
  {id:'posture',side:'body',text:'座る・立つ姿勢を保つのがつらい'},
];

const actions={
  mind:[
    ['画面を閉じて、5分だけ入力を止める','考える材料を増やさず、静かな時間をつくる'],
    ['気になっていることを1つだけ紙に出す','頭の中で持ち続けず、外に置いて区切る'],
    ['次の予定を1つ遅らせられるか確認する','判断や連絡の密度を一度下げる'],
  ],
  body:[
    ['水分をとって、10分休む','楽な姿勢に変えて身体の負荷を下げる'],
    ['目を閉じて、楽な姿勢で10分休む','作業を続ける前に身体を止める'],
    ['今日は止める作業を1つ決める','身体を使う量をこれ以上増やさない'],
  ],
  both:[
    ['画面を閉じて、楽な姿勢で10分休む','頭への入力と身体への負荷を同時に下げる'],
    ['予定を1つ減らして、10分休む','回復のための空白を先に確保する'],
    ['次の予定を遅らせられるか確認する','両方が重い日は、まず負荷の総量を下げる'],
  ],
};

let state={phase:'home',values:{},selectedAction:null};

function esc(value){return String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function readHistory(){try{const raw=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(raw)?raw.slice(0,3):[];}catch{return[];}}
function saveHistory(item){const next=[item,...readHistory()].slice(0,3);localStorage.setItem(STORE,JSON.stringify(next));}
function points(side){return signals.filter(s=>s.side===side).reduce((sum,s)=>sum+(state.values[s.id]||0),0);}
function total(){return points('mind')+points('body');}
function resultType(){const m=points('mind'),b=points('body'),t=m+b;const margin=Math.max(1,Math.round(t*.2));if(Math.abs(m-b)<=margin)return'both';return m>b?'mind':'body';}
function resultLabel(type){return type==='mind'?'頭・気持ち寄り':type==='body'?'身体寄り':'両方';}
function historyLabel(type){return type==='mind'?'頭・気持ち':type==='body'?'身体':'両方';}

function home(){state={phase:'home',values:{},selectedAction:null};reset.hidden=true;const history=readHistory();app.innerHTML=`<section class="hero">
  <div class="eyebrow">RECOVERY MAP</div>
  <h1>疲れを分けて、<br>休み方を決める<span>頭・気持ち / 身体</span></h1>
  <p class="lead">疲れているのに、どう休めばいいか分からない時へ。<strong>今のサインを2つのメーターに分けて、次の10分を1つ決めます。</strong></p>
  <div class="facts"><span>約90秒</span><span>診断ではない</span><span>「両方」でもOK</span></div>
  <button class="primary" id="startBtn" type="button">今の疲れを分ける</button>
  ${history.length?`<div class="history"><b>前回:</b> ${esc(historyLabel(history[0].type))}寄り / ${esc(history[0].action||'回復行動を選択')}</div>`:''}
</section>`;
  document.getElementById('startBtn').onclick=startCheck;
}

function startCheck(){state={phase:'check',values:{},selectedAction:null};reset.hidden=false;renderCheck();}
function renderCheck(){const m=points('mind'),b=points('body');const max=8;app.innerHTML=`<section>
  <div class="stage-head"><div><div class="eyebrow">CHECK IN</div><h2>今あるサインをタップ</h2></div><span>${total()} pt</span></div>
  <p class="stage-copy">当てはまるものを1回、強く当てはまるものは2回タップ。正解を当てるテストではありません。</p>
  <div class="meters">
    <div class="meter mind" style="--level:${Math.max(5,m/max*100)}%"><small>HEAD / MOOD</small><strong>頭・気持ち</strong><b>${m} / ${max}</b></div>
    <div class="meter body" style="--level:${Math.max(5,b/max*100)}%"><small>BODY</small><strong>身体</strong><b>${b} / ${max}</b></div>
  </div>
  <div class="signal-grid">${signals.map(s=>{const v=state.values[s.id]||0;return`<button type="button" class="signal${v?' is-on':''}${v===2?' is-strong':''}" data-signal="${s.id}" data-side="${s.side}"><span class="side">${s.side==='mind'?'頭・気持ち':'身体'}</span><strong>${esc(s.text)}</strong><span class="intensity">${v===0?'タップで追加':v===1?'当てはまる → もう1回で強く':'強く当てはまる → もう1回で解除'}</span></button>`;}).join('')}</div>
  <div class="next-wrap"><button type="button" id="showResult" class="primary" ${total()<2?'disabled':''}>休み方を選ぶ</button>${total()<2?'<div class="note">当てはまるサインを合計2ポイント以上選ぶと進めます。</div>':''}</div>
</section>`;
  document.querySelectorAll('[data-signal]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.signal;state.values[id]=((state.values[id]||0)+1)%3;renderCheck();});
  const next=document.getElementById('showResult');if(next&&!next.disabled)next.onclick=renderResult;
}

function renderResult(){state.phase='result';state.selectedAction=null;const m=points('mind'),b=points('body'),type=resultType(),list=actions[type];const intro=type==='mind'?'いま選んだサインでは、身体よりも頭や気持ち側の負荷が強く出ています。':type==='body'?'いま選んだサインでは、頭や気持ち側より身体側の重さが強く出ています。':'いま選んだサインでは、頭・気持ち側と身体側の両方に負荷が出ています。';app.innerHTML=`<section class="result-card">
  <div class="label">TODAY'S MAP</div><h2>${resultLabel(type)}</h2><p>${intro} 原因や病名を判定する結果ではなく、次の休み方を選ぶための現在地です。</p>
  <div class="balance"><div class="m"><strong>${m}</strong><span>頭・気持ち</span></div><div class="b"><strong>${b}</strong><span>身体</span></div></div>
  <h3 class="choose-title">次の10分、どれをやる？</h3><div class="action-list">${list.map((a,i)=>`<button type="button" class="action-card" data-action="${i}"><strong>${esc(a[0])}</strong><span>${esc(a[1])}</span></button>`).join('')}</div>
  <button type="button" class="primary commit" id="commitAction" disabled>これをやる</button>
  <div class="actions"><button type="button" class="secondary" id="redoBtn">サインを選び直す</button></div>
</section>`;
  document.querySelectorAll('[data-action]').forEach(btn=>btn.onclick=()=>{state.selectedAction=Number(btn.dataset.action);document.querySelectorAll('[data-action]').forEach(x=>x.classList.toggle('selected',x===btn));document.getElementById('commitAction').disabled=false;});
  document.getElementById('commitAction').onclick=finish;
  document.getElementById('redoBtn').onclick=renderCheck;
}

function finish(){const type=resultType();const action=actions[type][state.selectedAction]?.[0];if(!action)return;saveHistory({at:new Date().toISOString(),type,mind:points('mind'),body:points('body'),action});state.phase='done';app.innerHTML=`<section class="done"><small>NEXT 10 MINUTES</small><h2>${esc(action)}</h2><p>分析はここで終わり。次の10分は、この1つだけやれば十分です。</p><button type="button" class="primary" id="homeBtn">閉じる</button></section>`;document.getElementById('homeBtn').onclick=home;}

reset.onclick=home;
home();
})();
