import * as THREE from 'three';

let core=null,previous=null,blocked=0,lookSmoothed=null,lastMode='',battlePick=null;
const raycaster=new THREE.Raycaster();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(){for(let i=0;i<200;i++){if(window.__ASTRAL_CORE?.camera&&window.__ASTRAL?.cameraOverride)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('camera hook unavailable');}

function segmentCircleT(a,b,c,r){const abx=b.x-a.x,abz=b.z-a.z,len2=abx*abx+abz*abz;if(len2<.001)return null;const t=Math.max(0,Math.min(1,((c.x-a.x)*abx+(c.z-a.z)*abz)/len2));const x=a.x+abx*t,z=a.z+abz*t;if(Math.hypot(c.x-x,c.z-z)<r)return t;return null;}
function smoothLook(target,dt,mode){if(!lookSmoothed||lastMode!==mode)lookSmoothed=target.clone();else lookSmoothed.lerp(target,1-Math.exp(-dt*7));lastMode=mode;return lookSmoothed;}
function isUnder(o,root){for(let p=o;p;p=p.parent)if(p===root)return true;return false;}

function collectBattleOccluders(enemy){
  const roots=[core.player,core.companion,enemy].filter(Boolean),list=[];
  core.world.traverse(o=>{
    if(!o.isMesh||!o.visible||o.isInstancedMesh||roots.some(r=>isUnder(o,r)))return;
    const materials=Array.isArray(o.material)?o.material:[o.material];
    if(materials.some(m=>m?.transparent&&(m.opacity??1)<.3))return;
    const hex=materials[0]?.color?.getHex?.();
    if(hex===0x6f9a65||hex===0x9d8059)return; // terrain and road are never camera blockers
    if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
    if((o.geometry.boundingSphere?.radius||0)<.45)return;
    list.push(o);
  });
  return list;
}
function candidateScore(look,pos,occluders){
  const v=pos.clone().sub(look),dist=v.length();if(dist<.1)return -1;
  raycaster.set(look,v.normalize());raycaster.near=.45;raycaster.far=Math.max(.5,dist-.45);
  const hit=raycaster.intersectObjects(occluders,false)[0];
  return hit?hit.distance:dist+20;
}
function chooseBattleCamera(enemy,p,e,dir,side,mid,look){
  if(battlePick?.enemy===enemy)return battlePick.pos;
  const occluders=collectBattleOccluders(enemy);
  const specs=[[1,11.3,-2.25,6.25],[-1,11.3,-2.25,6.25],[1,9.8,2.2,7.0],[-1,9.8,2.2,7.0]];
  let best=null,bestScore=-Infinity;
  for(const [sgn,sideDist,dirDist,height] of specs){const pos=mid.clone().addScaledVector(side,sideDist*sgn).addScaledVector(dir,dirDist).add(new THREE.Vector3(0,height,0)),score=candidateScore(look,pos,occluders);if(score>bestScore){bestScore=score;best=pos;}}
  battlePick={enemy,pos:best||mid.clone().addScaledVector(side,11.3).add(new THREE.Vector3(0,6.25,0)),score:bestScore};
  return battlePick.pos;
}

function battleCamera(dt){
  const enemy=core.S.enemyObj;if(!enemy)return false;
  const p=core.player.position,e=enemy.position,dir=e.clone().sub(p).setY(0);if(dir.lengthSq()<.01)dir.set(0,0,-1);dir.normalize();
  const side=new THREE.Vector3(-dir.z,0,dir.x),mid=p.clone().lerp(e,.5),look=mid.clone().add(new THREE.Vector3(0,1.28,0));
  const target=smoothLook(look,dt,'battle'),desired=chooseBattleCamera(enemy,p,e,dir,side,mid,look);
  core.camera.position.lerp(desired,1-Math.exp(-dt*5.8));core.camera.lookAt(target);return true;
}

function fieldCamera(dt){
  battlePick=null;
  const yaw=core.player.rotation.y,forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),side=new THREE.Vector3(-forward.z,0,forward.x);
  const look=core.player.position.clone().addScaledVector(forward,2.15).add(new THREE.Vector3(0,1.28,0));
  const target=smoothLook(look,dt,'field');
  const desired=core.player.position.clone().addScaledVector(forward,-12.7).addScaledVector(side,.82).add(new THREE.Vector3(0,6.55,0));

  if(core.companion&&core.S.joined){const follow=core.player.position.clone().addScaledVector(forward,-2.15).addScaledVector(side,1.42);follow.y=core.groundY(follow.x,follow.z)+.22;core.companion.position.lerp(follow,1-Math.exp(-dt*9));}

  let nearest=1;
  for(const c of core.colliders){const t=segmentCircleT(target,desired,new THREE.Vector3(c.x,0,c.z),c.r+.38);if(t!==null&&t>.055&&t<nearest)nearest=t;}
  let wanted=desired;
  if(nearest<.995){blocked=Math.min(1,blocked+dt*8);const dir=desired.clone().sub(target),len=dir.length();if(len>.1){dir.normalize();const safeLen=Math.max(3.25,len*Math.max(.22,nearest-.07));wanted=target.clone().addScaledVector(dir,safeLen).add(new THREE.Vector3(0,.28*blocked,0));}}
  else blocked=Math.max(0,blocked-dt*5);

  core.camera.position.lerp(wanted,1-Math.exp(-dt*5.2));core.camera.lookAt(target);return true;
}

function safety(dt){
  if(previous?.(dt))return true;
  if(!core)return false;
  if(core.S.mode==='battle')return battleCamera(dt);
  if(['field','dialogue'].includes(core.S.mode))return fieldCamera(dt);
  lastMode=core.S.mode;return false;
}

(async()=>{try{core=await wait();previous=window.__ASTRAL.cameraOverride;window.__ASTRAL.cameraOverride=safety;}catch(err){console.warn('[Astral Dawn] camera safety skipped.',err)}})();
