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

function clipBy(clips,patterns){for(const p of patterns){const c=clips.find(x=>p.test(x.name));if(c)return c;}return clips[0]||null;}
function normalizeModel(model,targetHeight){model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);const s=targetHeight/Math.max(.001,size.y);model.scale.setScalar(s);model.updateMatrixWorld(true);const after=new THREE.Box3().setFromObject(model);model.position.y-=after.min.y;}

function addAstralIdentity(root,model,role){
  const gold=new THREE.MeshStandardMaterial({color:0xe5c879,metalness:.58,roughness:.28}),cyan=new THREE.MeshStandardMaterial({color:0x9ff7f2,emissive:0x43d5d3,emissiveIntensity:2.8,metalness:.18,roughness:.28}),red=new THREE.MeshStandardMaterial({color:0x8c3f48,roughness:.74,side:THREE.DoubleSide}),violet=new THREE.MeshStandardMaterial({color:0x76536f,roughness:.76,side:THREE.DoubleSide});
  if(role==='hero'){
    const cloak=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.28,1,3),red);cloak.position.set(0,1.58,-.34);cloak.rotation.x=.13;cloak.name='Aren_Astral_Cloak';root.add(cloak);
    const sigil=new THREE.Mesh(new THREE.OctahedronGeometry(.105,0),cyan);sigil.position.set(0,1.93,.41);sigil.rotation.z=Math.PI/4;sigil.name='Aren_Star_Sigil';root.add(sigil);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.19,.027,8,24),gold);ring.position.set(0,1.93,.405);ring.rotation.x=Math.PI/2;root.add(ring);
    root.userData.identityFx={sigil,ring,cloak};
  }else{
    const mantle=new THREE.Mesh(new THREE.PlaneGeometry(.86,1.12,1,3),violet);mantle.position.set(0,1.62,-.32);mantle.rotation.x=.12;root.add(mantle);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(.29,.025,8,30),gold);halo.position.set(0,2.46,-.08);halo.rotation.x=Math.PI/2;root.add(halo);
    const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.1,0),cyan);orb.position.set(.55,2.0,.18);root.add(orb);root.userData.identityFx={halo,orb,mantle};
  }
  // A restrained tint prevents the stock atlas from reading as a completely unrelated art direction.
  const tint=new THREE.Color(role==='hero'?0xdceaf0:0xf0ddec);
  model.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.multiply(tint);o.material.roughness=Math.max(.42,o.material.roughness??.6);o.material.envMapIntensity=.65;}});
}

function prepareModel(root,gltf,role){
  const model=gltf.scene,old=[...root.children];model.name=role==='hero'?'Aren_HD':'Rina_HD';normalizeModel(model,role==='hero'?3.0:2.82);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(model);old.forEach(o=>o.visible=false);addAstralIdentity(root,model,role);
  const mixer=new THREE.AnimationMixer(model),clips=gltf.animations||[];
  const defs={idle:clipBy(clips,[/^idle/i,/idle/i]),walk:clipBy(clips,[/walking/i,/walk/i]),run:clipBy(clips,[/running/i,/run/i]),attack:clipBy(clips,[/melee.*attack/i,/attack/i,/slash/i]),spell:clipBy(clips,[/spell/i,/cast/i,/magic/i]),hit:clipBy(clips,[/hit/i,/damage/i])};
  const state={root,model,mixer,defs,current:null,onceUntil:0,prev:root.position.clone(),role};actors.set(role,state);playLoop(state,'idle');
}

function actionFor(state,name){const clip=state.defs[name];return clip?state.mixer.clipAction(clip):null;}
function fadeTo(state,name,d=.18){if(state.current===name)return;const next=actionFor(state,name)||actionFor(state,'idle');if(!next)return;const old=state.current?actionFor(state,state.current):null;next.enabled=true;next.setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false;next.reset().fadeIn(d).play();if(old&&old!==next)old.fadeOut(d);state.current=name;}
function playLoop(state,name){state.current=null;fadeTo(state,name,0);}
function playOnce(state,name,d=.1){const next=actionFor(state,name);if(!next)return;const old=state.current?actionFor(state,state.current):null;if(old&&old!==next)old.fadeOut(d);next.enabled=true;next.reset();next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;next.fadeIn(d).play();state.current=name;state.onceUntil=performance.now()+Math.max(420,next.getClip().duration*1000*.75);}

async function loadHero(){try{const gltf=await load(ASSETS.hero);prepareModel(core.player,gltf,'hero');console.info('[Astral Dawn] HD hero loaded (KayKit CC0 + Astral identity layer).');}catch(err){console.warn('[Astral Dawn] HD hero unavailable; procedural hero retained.',err);}}
async function loadCompanion(){if(actors.has('companion')||!core.companion)return;try{const gltf=await load(ASSETS.companion);prepareModel(core.companion,gltf,'companion');console.info('[Astral Dawn] HD companion loaded (KayKit CC0 + Astral identity layer).');}catch(err){console.warn('[Astral Dawn] HD companion unavailable; procedural companion retained.',err);}}

function observeBattleLog(){const log=document.querySelector('#battleLog');if(!log)return;new MutationObserver(()=>{const t=log.textContent,hero=actors.get('hero'),rina=actors.get('companion');if(hero&&(t.includes('アレンの攻撃')||t.includes('星断ち')))playOnce(hero,'attack');if(hero&&(t.includes('ダメージ')||t.includes('衝撃波')))playOnce(hero,'hit');if(rina&&t.includes('リナの'))playOnce(rina,'spell');}).observe(log,{childList:true,characterData:true,subtree:true});}

function updateIdentity(state,t,dt){const f=state.root.userData.identityFx;if(!f)return;if(f.sigil){f.sigil.rotation.y+=dt*1.4;f.ring.rotation.z+=dt*.55;f.sigil.material.emissiveIntensity=2.3+Math.sin(t*3)*.8;f.cloak.rotation.z=Math.sin(t*2)*.025;}else{f.halo.rotation.z+=dt*.3;f.orb.rotation.y+=dt*1.6;f.orb.position.y=2+Math.sin(t*2.2)*.06;f.orb.material.emissiveIntensity=2.4+Math.sin(t*2.8)*.7;f.mantle.rotation.z=Math.sin(t*1.8)*.02;}}
function updateActor(state,dt,now){state.mixer.update(dt);updateIdentity(state,now/1000,dt);if(now<state.onceUntil){state.prev.copy(state.root.position);return;}const dist=state.root.position.distanceTo(state.prev),speed=dist/Math.max(.001,dt);state.prev.copy(state.root.position);if(core.S.mode==='battle'){fadeTo(state,'idle');return;}if(speed>5.8)fadeTo(state,'run');else if(speed>.2)fadeTo(state,'walk');else fadeTo(state,'idle');}
function loop(now){const dt=Math.min((now-last)/1000,.04);last=now;if(core?.S.joined&&!actors.has('companion')&&core.companion)loadCompanion();for(const a of actors.values())updateActor(a,dt,now);requestAnimationFrame(loop);}

(async()=>{try{core=await waitCore();observeBattleLog();loadHero();requestAnimationFrame(loop);}catch(err){console.warn('[Astral Dawn] optional HD model layer skipped.',err);}})();