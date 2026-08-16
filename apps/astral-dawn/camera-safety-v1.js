import * as THREE from 'three';

let core=null,previous=null,blocked=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(){for(let i=0;i<200;i++){if(window.__ASTRAL_CORE?.camera&&window.__ASTRAL?.cameraOverride)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('camera hook unavailable');}

function segmentCircleT(a,b,c,r){const abx=b.x-a.x,abz=b.z-a.z,len2=abx*abx+abz*abz;if(len2<.001)return null;const t=Math.max(0,Math.min(1,((c.x-a.x)*abx+(c.z-a.z)*abz)/len2));const x=a.x+abx*t,z=a.z+abz*t;if(Math.hypot(c.x-x,c.z-z)<r)return t;return null;}
function safety(dt){
  if(previous?.(dt))return true;
  if(!core||!['field','dialogue'].includes(core.S.mode))return false;
  const target=core.player.position.clone().add(new THREE.Vector3(0,1.45,0)),cam=core.camera.position.clone();let nearest=1;
  for(const c of core.colliders){const t=segmentCircleT(target,cam,new THREE.Vector3(c.x,0,c.z),c.r+.28);if(t!==null&&t>.06&&t<nearest)nearest=t;}
  if(nearest>=.995){blocked=Math.max(0,blocked-dt*5);return false;}
  blocked=Math.min(1,blocked+dt*8);const dir=cam.clone().sub(target),len=dir.length();if(len<.1)return false;dir.normalize();const safeLen=Math.max(2.4,len*Math.max(.18,nearest-.08));const wanted=target.clone().addScaledVector(dir,safeLen).add(new THREE.Vector3(0,.2*blocked,0));core.camera.position.lerp(wanted,Math.min(1,dt*16));core.camera.lookAt(target);return true;
}

(async()=>{try{core=await wait();previous=window.__ASTRAL.cameraOverride;window.__ASTRAL.cameraOverride=safety;}catch(err){console.warn('[Astral Dawn] camera safety skipped.',err)}})();
