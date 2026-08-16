import * as THREE from 'three';

let core=null,comboUsed=null,lastEnemy=null,variantPending=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitCore(){for(let i=0;i<180;i++){if(window.__ASTRAL_CORE?.S)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('Astral battle core unavailable');}

function injectCss(){const s=document.createElement('style');s.textContent=`
.commands{grid-template-columns:repeat(5,1fr)!important}.commands .combo-command{position:relative;overflow:hidden;border-color:rgba(121,220,224,.28);background:linear-gradient(135deg,rgba(71,177,183,.11),rgba(231,199,125,.08))}.commands .combo-command:before{content:"";position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent,rgba(121,220,224,.18),transparent 35%);animation:comboTurn 7s linear infinite}.commands .combo-command>*{position:relative}.commands .combo-command.ready{box-shadow:0 0 26px rgba(121,220,224,.12),inset 0 0 25px rgba(121,220,224,.06)}.commands .combo-command.used{opacity:.34;filter:saturate(.3)}
#enemyTrait{position:absolute;top:171px;right:24px;z-index:19;padding:7px 11px;border-radius:999px;background:rgba(8,16,22,.68);border:1px solid rgba(255,255,255,.12);font-size:9px;letter-spacing:.12em;color:#b8c9c4;backdrop-filter:blur(10px);opacity:0;transition:.25s;pointer-events:none}#enemyTrait.show{opacity:1}#enemyTrait b{color:#f0d39a;margin-left:6px}
@keyframes comboTurn{to{transform:rotate(360deg)}}
@media(max-width:720px){.commands{grid-template-columns:repeat(2,1fr)!important}.commands .combo-command{grid-column:span 2}#enemyTrait{top:137px;right:10px}}
`;document.head.appendChild(s);}

function addComboButton(){const commands=document.querySelector('.commands');if(!commands||commands.querySelector('.combo-command'))return;const b=document.createElement('button');b.className='combo-command';b.dataset.command='combo';b.innerHTML='<span>✦</span><b>星環連携</b><small>MP 20 / 1戦1回</small>';commands.appendChild(b);b.addEventListener('click',useCombo);return b;}
function addTraitUi(){const e=document.createElement('div');e.id='enemyTrait';e.innerHTML='BEHAVIOR <b>観察中</b>';document.querySelector('#battleHud')?.appendChild(e);return e;}
function traitFor(enemy){if(!enemy||enemy.userData.boss)return {id:'boss',label:'古代種 / 星喰らい'};if(enemy.userData.variant)return enemy.userData.variant;const x=enemy.userData.home?.x??0;const v=x<14?{id:'fang',label:'裂爪型 / 追撃'}:x<23?{id:'drain',label:'吸星型 / MP侵食'}:{id:'regen',label:'再生型 / 自己回復'};enemy.userData.variant=v;return v;}
function updateTrait(){const e=document.querySelector('#enemyTrait');if(!e)return;const enemy=core.S.enemyObj;if(core.S.mode!=='battle'||!enemy){e.classList.remove('show');return}const t=traitFor(enemy);e.querySelector('b').textContent=t.label;e.classList.add('show');}

function comboFx(){const c=core,T=c.THREE,enemy=c.S.enemyObj;if(!enemy)return;const mid=c.player.position.clone().lerp(enemy.position,.55).add(new T.Vector3(0,1.25,0));for(let k=0;k<2;k++){const ring=new T.Mesh(new T.TorusGeometry(.6+k*.35,.035,8,42),new T.MeshBasicMaterial({color:k?0xf0cd79:0x7be7e6,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending}));ring.position.copy(mid);ring.rotation.x=Math.PI/2+k*.45;c.scene.add(ring);let t=0;(function tick(){t+=.035;ring.scale.setScalar(1+t*2.8);ring.rotation.z+=.09*(k?1:-1);ring.material.opacity=1-t;if(t<1)requestAnimationFrame(tick);else{c.scene.remove(ring);ring.geometry.dispose();ring.material.dispose()}})();}
  if(c.companion?.userData.gem)c.companion.userData.gem.material.emissiveIntensity=8;setTimeout(()=>{if(c.companion?.userData.gem)c.companion.userData.gem.material.emissiveIntensity=2},900);
}

function useCombo(){const S=core.S,button=document.querySelector('.combo-command');if(S.mode!=='battle'||!S.can)return;if(!S.joined)return core.toast('リナがいなければ連携できない。',1400);if(comboUsed===S.enemyObj)return core.toast('星環連携はこの戦闘ではもう使った。',1500);if(S.mp<20)return core.toast('星環連携には MP 20 が必要。',1500);
  comboUsed=S.enemyObj;button?.classList.add('used');S.mp-=12;
  S.enemy.hp=Math.max(1,S.enemy.hp-58);core.updateUI();comboFx();const log=document.querySelector('#battleLog');if(log){log.textContent='アレン＆リナ — 星環連携「双星断」！';log.classList.add('show')}core.tone(740,.14,'sine',.04);setTimeout(()=>core.tone(988,.22,'triangle',.04),110);
  setTimeout(()=>{const skill=[...document.querySelectorAll('.commands button')].find(x=>x.dataset.command==='skill');skill?.click()},330);
}

function onEnemyAttackStart(){const enemy=core.S.enemyObj;if(!enemy||enemy.userData.boss){variantPending=null;return}variantPending=traitFor(enemy);const log=document.querySelector('#battleLog');if(!log)return;setTimeout(()=>{if(!variantPending)return;const label=variantPending.id==='fang'?'裂爪跳び！':variantPending.id==='drain'?'星喰みの牙！':'灰角再生！';log.textContent=label;log.classList.add('show')},0);}
function applyVariantAfterHit(){if(!variantPending||!core.S.enemyObj)return;const v=variantPending;variantPending=null;if(v.id==='fang'){core.S.hp=Math.max(0,core.S.hp-5);core.updateUI();core.toast('裂爪の追撃　HP -5',1000);}
  else if(v.id==='drain'){const n=Math.min(6,core.S.mp);core.S.mp-=n;core.updateUI();core.toast(`星力を ${n} 吸われた`,1100);}
  else if(v.id==='regen'){core.S.enemy.hp=Math.min(core.S.enemy.maxHp,core.S.enemy.hp+12);const bar=document.querySelector('#enemyHpBar');if(bar)bar.style.width=`${core.S.enemy.hp/core.S.enemy.maxHp*100}%`;core.toast('ヴァルグの傷が塞がる　HP +12',1100);}}

function observeLog(){const e=document.querySelector('#battleLog');if(!e)return;let last='';new MutationObserver(()=>{const t=e.textContent;if(t===last)return;last=t;if(t.includes('灰角のヴァルグの攻撃'))onEnemyAttackStart();else if(/\d+ のダメージ/.test(t)&&variantPending)applyVariantAfterHit();else if(t.includes('星喰らいの衝撃波')&&core.S.enemyObj?.userData.boss){core.S.enemyObj.userData.monsterLight&&(core.S.enemyObj.userData.monsterLight.intensity=4.2);setTimeout(()=>{if(core.S.enemyObj?.userData.monsterLight)core.S.enemyObj.userData.monsterLight.intensity=2},500)}}).observe(e,{childList:true,characterData:true,subtree:true});}

function monitor(){
  const button=document.querySelector('.combo-command'),enemy=core.S.enemyObj;
  if(enemy!==lastEnemy){lastEnemy=enemy;button?.classList.remove('used');}
  const usable=core.S.mode==='battle'&&core.S.joined&&core.S.mp>=20&&comboUsed!==enemy;
  button?.classList.toggle('ready',!!usable);
  if(button)button.disabled=core.S.mode==='battle'&&!core.S.can;
  updateTrait();
  // Gameplay/UI availability must not depend on WebGL frame rate. On slow devices
  // requestAnimationFrame can stall while timers and battle state continue advancing.
  setTimeout(monitor,80);
}

(async()=>{try{core=await waitCore();injectCss();addComboButton();addTraitUi();observeLog();monitor();}catch(err){console.warn('[Astral Dawn] battle v2 layer skipped.',err)}})();