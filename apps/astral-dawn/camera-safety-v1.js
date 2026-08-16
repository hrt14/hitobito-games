import * as THREE from 'three';

let core=null,previous=null,blocked=0,lookSmoothed=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(){for(let i=0;i<200;i++){if(window.__ASTRAL_CORE?.camera&&window.__ASTRAL?.cameraOverride)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('camera hook unavailable');}

function segmentCircleT(a,b,c,r){const abx=b.x-a.x,abz=b.z-a.z,len2=abx*abx+abz*abz;if(len2<.001)return null;const t=Math.max(0,Math.min(1,((c.x-a.x)*abx+(c.z-a.z)*abz)/len2));const x=a.x+abx*t,z=a.z+abz*t;if(Math.hypot(c.x-x,c.z-z)<r)return t;return null;}

function safety(dt){
  if(previous?.(dt))return true;
  if(!core||!['field','dialogue'].includes(core.S.mode))return false;

  // Field composition: keep the party readable, but show enough road, village and
  // landmark context that the player feels inside a place rather than behind a model.
  const yaw=core.player.rotation.y;
  const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const side=new THREE.Vector3(-forward.z,0,forward.x);
  const look=core.player.position.clone().addScaledVector(forward,1.55).add(new THREE.Vector3(0,1.35,0));
  const desired=core.player.position.clone().addScaledVector(forward,-10.4).addScaledVector(side,.65).add(new THREE.Vector3(0,5.85,0));

  if(!lookSmoothed)lookSmoothed=look.clone();
  lookSmoothed.lerp(look,1-Math.exp(-dt*7));

  let nearest=1;
  for(const c of core.colliders){const t=segmentCircleT(lookSmoothed,desired,new THREE.Vector3(c.x,0,c.z),c.r+.38);if(t!==null&&t>.055&&t<nearest)nearest=t;}

  let wanted=desired;
  if(nearest<.995){
    blocked=Math.min(1,blocked+dt*8);
    const dir=desired.clone().sub(lookSmoothed),len=dir.length();
    if(len>.1){dir.normalize();const safeLen=Math.max(3.25,len*Math.max(.22,nearest-.07));wanted=lookSmoothed.clone().addScaledVector(dir,safeLen).add(new THREE.Vector3(0,.28*blocked,0));}
  }else blocked=Math.max(0,blocked-dt*5);

  core.camera.position.lerp(wanted,1-Math.exp(-dt*5.2));
  core.camera.lookAt(lookSmoothed);
  return true;
}

(async()=>{try{core=await wait();previous=window.__ASTRAL.cameraOverride;window.__ASTRAL.cameraOverride=safety;}catch(err){console.warn('[Astral Dawn] camera safety skipped.',err)}})();
