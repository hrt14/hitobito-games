(() => {
  'use strict';
  const body=document.body;
  const title=document.getElementById('objectiveTitle');
  const detail=document.getElementById('objectiveDetail');
  const objective=document.getElementById('objective');
  const sound=document.getElementById('soundBtn');
  const hud=document.querySelector('.hud');
  const tray=document.getElementById('speciesTray');
  const actions=[...document.querySelectorAll('.action-card')];
  const stage=body.classList.contains('pond-stage')?'池のほとり':'草原';
  const stageNo=body.classList.contains('pond-stage')?'2 / 2':'1 / 2';
  let currentTarget=null;

  if(hud&&!document.querySelector('.ux-stage-progress')){
    const p=document.createElement('div');p.className='ux-stage-progress';p.textContent=`${stage} · ${stageNo}`;hud.insertBefore(p,sound);
  }
  if(sound){sound.setAttribute('aria-label','画面演出を切り替える');sound.title='画面演出を切り替える';}
  if(objective){objective.setAttribute('role','button');objective.setAttribute('tabindex','0');objective.setAttribute('aria-label','次にすること。タップすると操作場所へ移動します');}
  const statLabels=[...document.querySelectorAll('.stat-label')];
  if(statLabels[0])statLabels[0].textContent='いのち';
  if(statLabels[1])statLabels[1].textContent='バランス';
  if(statLabels[2])statLabels[2].textContent=body.classList.contains('pond-stage')?'食物網':'循環';

  function phaseFromText(text){
    if(/迎える|増やす|少ない|多すぎ|調整/.test(text))return 'species';
    if(/落ち葉|水辺|草原|育てる|材料/.test(text))return 'environment';
    return 'balance';
  }
  function chooseTarget(text){
    const ready=document.querySelector('.species-card.ready:not(:disabled)');
    if(ready&&body.dataset.uxPhase==='species')return ready;
    if(/落ち葉|材料/.test(text))return document.querySelector('[data-action="detritus"]');
    if(/水質|雨/.test(text))return document.querySelector('[data-action="rain"]');
    if(body.dataset.uxPhase==='environment')return document.querySelector('[data-action="sun"]');
    return ready||document.querySelector('.species-card.active')||document.querySelector('.actions');
  }
  function refresh(){
    const text=`${title?.textContent||''} ${detail?.textContent||''}`;
    body.dataset.uxPhase=phaseFromText(text);
    actions.forEach(a=>a.classList.remove('ux-primary'));
    currentTarget=chooseTarget(text);
    if(currentTarget?.classList?.contains('action-card'))currentTarget.classList.add('ux-primary');
    const cards=[...document.querySelectorAll('.species-card')];
    const active=cards.filter(c=>c.classList.contains('active')).length;
    const progress=document.querySelector('.ux-stage-progress');
    if(progress)progress.textContent=`${stage} · ${stageNo} · ${active}/${cards.length}`;
    cards.forEach(c=>c.setAttribute('aria-current',c.classList.contains('ready')?'step':'false'));
  }
  function goToNext(){
    refresh();
    if(!currentTarget)return;
    currentTarget.scrollIntoView({behavior:'smooth',block:'center'});
    currentTarget.classList.add('ux-arrived');
    setTimeout(()=>currentTarget?.classList.remove('ux-arrived'),850);
    if(navigator.vibrate)navigator.vibrate(10);
  }
  const observer=new MutationObserver(refresh);
  if(title)observer.observe(title,{subtree:true,childList:true,characterData:true});
  if(detail)observer.observe(detail,{subtree:true,childList:true,characterData:true});
  if(tray)observer.observe(tray,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  refresh();

  objective?.addEventListener('click',goToNext);
  objective?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goToNext();}});
  document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;b.classList.add('ux-pressed');if(navigator.vibrate&&(!b.disabled))navigator.vibrate(8);});
  document.addEventListener('pointerup',e=>e.target.closest('button')?.classList.remove('ux-pressed'));
  document.addEventListener('pointercancel',e=>e.target.closest('button')?.classList.remove('ux-pressed'));
})();
