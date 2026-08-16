import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';

const ASSET_BASE='https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0@main/addons/kaykit_character_pack_adventures/Characters/gltf/';
const ASSETS={hero:`${ASSET_BASE}Knight.glb`,companion:`${ASSET_BASE}Mage.glb`};
const loader=new GLTFLoader();
const actors=new Map();
let core=null,last=performance.now();

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitCore(){for(let i=0;i<160;i++){if(window.__ASTRAL_CORE?.player)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('Astral core did not expose the scene in time');}
function load(url){return new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));}

function clipBy(clips,patterns){
  for(const p of patterns){const c=clips.find(x=>p.test(x.name));if(c)return c;}
  return clips[0]||null;
}

function normalizeModel(model,targetHeight){
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);
  const s=targetHeight/Math.max(.001,size.y);model.scale.setScalar(s);model.updateMatrixWorld(true);
  const after=new THREE.Box3().setFromObject(model);model.position.y-=after.min.y;
}

function prepareModel(root,gltf,role){
  const model=gltf.scene,old=[...root.children];
  model.name=role==='hero'?'Aren_HD':'Rina_HD';
  normalizeModel(model,role==='hero'?3.0:2.82);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(.42,o.material.roughness??.6);o.material.envMapIntensity=.65;}}});
  root.add(model);old.forEach(o=>o.visible=false);
  const mixer=new THREE.AnimationMixer(model),clips=gltf.animations||[];
  const defs={
    idle:clipBy(clips,[/^idle/i,/idle/i]),
    walk:clipBy(clips,[/walking/i,/walk/i]),
    run:clipBy(clips,[/running/i,/run/i]),
    attack:clipBy(clips,[/melee.*attack/i,/attack/i,/slash/i]),
    spell:clipBy(clips,[/spell/i,/cast/i,/magic/i]),
    hit:clipBy(clips,[/hit/i,/damage/i])
  };
  const state={root,model,mixer,defs,current:null,onceUntil:0,prev:root.position.clone(),role};
  actors.set(role,state);playLoop(state,'idle');
}

function actionFor(state,name){const clip=state.defs[name];return clip?state.mixer.clipAction(clip):null;}
function fadeTo(state,name,d=.18){
  if(state.current===name)return;const next=actionFor(state,name)||actionFor(state,'idle');if(!next)return;
  const old=state.current? actionFor(state,state.current):null;next.enabled=true;next.setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false;next.reset().fadeIn(d).play();if(old&&old!==next)old.fadeOut(d);state.current=name;
}
function playLoop(state,name){state.current=null;fadeTo(state,name,0);}
function playOnce(state,name,d=.1){
  const next=actionFor(state,name);if(!next)return;const old=state.current? actionFor(state,state.current):null;if(old&&old!==next)old.fadeOut(d);next.enabled=true;next.reset();next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;next.fadeIn(d).play();state.current=name;state.onceUntil=performance.now()+Math.max(420,next.getClip().duration*1000*.75);
}

async function loadHero(){
  try{const gltf=await load(ASSETS.hero);prepareModel(core.player,gltf,'hero');console.info('[Astral Dawn] HD hero loaded (KayKit CC0).');}
  catch(err){console.warn('[Astral Dawn] HD hero unavailable; procedural hero retained.',err);}
}
async function loadCompanion(){
  if(actors.has('companion')||!core.companion)return;
  try{const gltf=await load(ASSETS.companion);prepareModel(core.companion,gltf,'companion');console.info('[Astral Dawn] HD companion loaded (KayKit CC0).');}
  catch(err){console.warn('[Astral Dawn] HD companion unavailable; procedural companion retained.',err);}
}

function observeBattleLog(){
  const log=document.querySelector('#battleLog');if(!log)return;
  new MutationObserver(()=>{
    const t=log.textContent,hero=actors.get('hero'),rina=actors.get('companion');
    if(hero&&(t.includes('アレンの攻撃')||t.includes('星断ち')))playOnce(hero,'attack');
    if(hero&&(t.includes('ダメージ')||t.includes('衝撃波')))playOnce(hero,'hit');
    if(rina&&t.includes('リナの'))playOnce(rina,'spell');
  }).observe(log,{childList:true,characterData:true,subtree:true});
}

function updateActor(state,dt,now){
  state.mixer.update(dt);
  if(now<state.onceUntil){state.prev.copy(state.root.position);return;}
  const dist=state.root.position.distanceTo(state.prev),speed=dist/Math.max(.001,dt);state.prev.copy(state.root.position);
  if(core.S.mode==='battle'){fadeTo(state,'idle');return;}
  if(speed>5.8)fadeTo(state,'run');else if(speed>.2)fadeTo(state,'walk');else fadeTo(state,'idle');
}

function loop(now){
  const dt=Math.min((now-last)/1000,.04);last=now;
  if(core?.S.joined&&!actors.has('companion')&&core.companion)loadCompanion();
  for(const a of actors.values())updateActor(a,dt,now);
  requestAnimationFrame(loop);
}

(async()=>{
  try{core=await waitCore();observeBattleLog();loadHero();requestAnimationFrame(loop);}
  catch(err){console.warn('[Astral Dawn] optional HD model layer skipped.',err);}
})();
