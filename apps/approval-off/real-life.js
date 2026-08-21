(() => {
  'use strict';
  const key='levelup-approval-effect-v1';
  const $=(s,r=document)=>r.querySelector(s);
  let before=7;

  function ensure(){
    const trigger=$('#triggerScreen'), lock=$('#lockScreen');
    if(trigger&&!$('#approvalEffectBefore',trigger)){
      const box=document.createElement('div');box.id='approvalEffectBefore';box.className='approval-effect-box';box.innerHTML='<div><span>いま「どう思われるか」が頭を占める強さ</span><strong><b>7</b>/10</strong></div><input type="range" min="0" max="10" value="7" aria-label="他人の評価が頭を占める強さ">';
      const input=$('input',box),value=$('b',box);input.addEventListener('input',()=>{before=Number(input.value);value.textContent=input.value});const next=$('#noticeNextBtn');next?.before(box);
    }
    if(lock&&!$('#approvalEffectAfter',lock)){
      const box=document.createElement('div');box.id='approvalEffectAfter';box.className='approval-effect-box after';box.innerHTML='<div><span>いまの占有の強さ</span><strong><b>7</b>/10</strong></div><input type="range" min="0" max="10" value="7" aria-label="処理後の他人評価の占有の強さ"><small>下がっていなくてもOK。今の数字をそのまま。</small><p data-effect-history hidden></p>';
      const done=$('#lockDoneBtn');done?.before(box);const input=$('input',box),value=$('b',box);input.addEventListener('input',()=>value.textContent=input.value);done?.addEventListener('click',()=>save(before,Number(input.value)));renderHistory(box);
    }
  }
  function syncLock(){const lock=$('#lockScreen');if(!lock?.classList.contains('active'))return;const box=$('#approvalEffectAfter');if(!box)return;const input=$('input',box),value=$('b',box);input.value=String(before);value.textContent=String(before)}
  function save(b,a){const delta=b-a;try{const prev=JSON.parse(localStorage.getItem(key)||'[]'),runs=Array.isArray(prev)?prev.slice(-19):[];runs.push({before:b,after:a,delta,at:Date.now()});localStorage.setItem(key,JSON.stringify(runs));renderHistory($('#approvalEffectAfter'))}catch{};try{window.dispatchEvent(new CustomEvent('levelup:real-bridge-complete',{detail:{slug:'approval-off',delta}}));window.LevelUpTelemetry?.action?.(`real-approval-effect-${delta>0?'lighter':delta===0?'same':'heavier'}`);window.LevelUpTelemetry?.complete?.('real-approval')}catch{}}
  function renderHistory(root){try{const runs=JSON.parse(localStorage.getItem(key)||'[]'),el=$('[data-effect-history]',root);if(!Array.isArray(runs)||!runs.length){el.hidden=true;return}const lighter=runs.filter(r=>Number(r.delta)>0).length;el.hidden=false;el.textContent=`実戦 ${runs.length}回。${lighter}回で占有が下がりました。`}catch{}}
  ensure();const lock=$('#lockScreen');if(lock)new MutationObserver(syncLock).observe(lock,{attributes:true,attributeFilter:['class']});
})();