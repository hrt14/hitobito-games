import * as THREE from 'three';

let core=null,active=false,startAt=0,duration=6200,oldOverride=null,fxRoot=null,title=null,lastTriggered=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitRuntime(){for(let i=0;i<200;i++){if(window.__ASTRAL_CORE?.camera&&window.__ASTRAL?.cameraOverride)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('Astral cinematic hooks unavailable');}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

function injectCss(){const s=document.createElement('style');s.textContent=`
#dawnTitle{position:fixed;z-index:35;left:50%;top:29%;transform:translate(-50%,18px);text-align:center;opacity:0;pointer-events:none;text-shadow:0 5px 28px rgba(0,0,0,.72);transition:opacity .8s,transform .8s}#dawnTitle.show{opacity:1;transform:translate(-50%,0)}#dawnTitle small{display:block;font-size:9px;letter-spacing:.48em;color:#f0d69c;margin-bottom:10px}#dawnTitle b{display:block;font:500 clamp(30px,5vw,58px)/1 serif;letter-spacing:.24em;text-indent:.24em;color:#fff8e6}#dawnTitle span{display:block;margin-top:11px;font-size:8px;letter-spacing:.45em;color:#cddfd8}
body.dawn-cinema #hud,body.dawn-cinema #quest,body.dawn-cinema #commandPanel,body.dawn-cinema #enemyCard{opacity:0!important;transition:opacity .5s}body.dawn-cinema #vignette{background:radial-gradient(circle at 55% 38%,transparent 48%,rgba(23,14,20,.22) 78%,rgba(7,7,13,.66));transition:.8s}
`;document.head.appendChild(s);title=document.createElement('div');title.id='dawnTitle';title.innerHTML='<small>CHAPTER I COMPLETE</small><b>夜明け</b><span>THE FIRST DAWN</span>';document.body.appendChild(title);}

function makeFx(){const T=core.THREE;fxRoot=new T.Group();core.scene.add(fxRoot);const warm=new T.MeshBasicMaterial({color:0xffd79a,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
  for(let i=0;i<7;i++){const ray=new T.Mesh(new T.PlaneGeometry(2.8+i*.7,42),warm.clone());ray.position.set(38+i*1.4,16+i*.6,-64-i*1.5);ray.rotation.set(-.92,-.32+i*.035,-.1);ray.userData.i=i;fxRoot.add(ray)}
  const glow=new T.Sprite(new T.SpriteMaterial({map:radialTexture(T),transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,color:0xffd59a}));glow.position.set(54,24,-78);glow.scale.set(24,24,1);glow.name='dawnGlow';fxRoot.add(glow);
  const dustGeo=new T.BufferGeometry(),arr=[];for(let i=0;i<180;i++)arr.push(THREE.MathUtils.randFloat(-25,25),THREE.MathUtils.randFloat(1,15),THREE.MathUtils.randFloat(-30,18));dustGeo.setAttribute('position',new T.Float32BufferAttribute(arr,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:0xffe9bb,size:.08,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));dust.position.set(28,0,-38);dust.name='dawnDust';fxRoot.add(dust);
  const birds=new T.Group();for(let i=0;i<7;i++){const g=new T.Group(),mat=new T.MeshBasicMaterial({color:0x27343a,side:T.DoubleSide});const l=new T.Mesh(new T.PlaneGeometry(.45,.08),mat),r=l.clone();l.position.x=-.2;r.position.x=.2;l.rotation.z=.25;r.rotation.z=-.25;g.add(l,r);g.position.set(30+i*1.8,19+(i%3)*.8,-61-i*1.2);g.userData={phase:i*1.3,l,r};birds.add(g)}birds.name='dawnBirds';fxRoot.add(birds);}

function radialTexture(T){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,220,1)');g.addColorStop(.18,'rgba(255,210,140,.75)');g.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);}

function trigger(){if(active||lastTriggered===core.S.enemyObj)return;lastTriggered=core.S.enemyObj;active=true;startAt=performance.now();document.body.classList.add('dawn-cinema');document.querySelector('#letterbox')?.classList.add('active');title?.classList.remove('show');if(!fxRoot)makeFx();fxRoot.visible=true;core.S.time=.86;core.tone(392,.45,'sine',.035);setTimeout(()=>core.tone(523.25,.55,'sine',.035),150);setTimeout(()=>core.tone(659.25,.8,'sine',.03),300);}

function cameraOverride(dt){if(!active)return oldOverride?.(dt)||false;const T=core.THREE,p=clamp((performance.now()-startAt)/duration,0,1),e=ease(p),player=core.player,shrine=core.scene.userData.shrine||player;
  const a=new T.Vector3(player.position.x+7.5,player.position.y+4.5,player.position.z+8),b=new T.Vector3(41,11,-54),c=new T.Vector3(52,16,-68);let pos,target;
  if(p<.48){const q=ease(p/.48);pos=a.clone().lerp(b,q);target=player.position.clone().lerp(shrine.position.clone().add(new T.Vector3(0,3,0)),q*.7).add(new T.Vector3(0,1.3,0));}
  else{const q=ease((p-.48)/.52);pos=b.clone().lerp(c,q);target=shrine.position.clone().add(new T.Vector3(0,3.5,-9*q));}
  core.camera.position.lerp(pos,clamp(dt*7,0,1));core.camera.lookAt(target);core.camera.fov=THREE.MathUtils.lerp(48,42,Math.sin(p*Math.PI));core.camera.updateProjectionMatrix();return true;}

function update(now){if(!active)return;const p=clamp((now-startAt)/duration,0,1),dawn=clamp((p-.08)/.7,0,1);core.S.time=THREE.MathUtils.lerp(.86,.285,ease(dawn));core.renderer.toneMappingExposure=THREE.MathUtils.lerp(.78,1.2,ease(dawn));
  if(fxRoot){const glow=fxRoot.getObjectByName('dawnGlow'),dust=fxRoot.getObjectByName('dawnDust'),birds=fxRoot.getObjectByName('dawnBirds');if(glow)glow.material.opacity=clamp((p-.08)*2.2,0,.85)*(1-clamp((p-.9)*5,0,.35));if(dust){dust.material.opacity=clamp((p-.18)*1.3,0,.55);dust.rotation.y+=.0015}for(const r of fxRoot.children.filter(x=>x.userData.i!==undefined)){r.material.opacity=clamp((p-.12)*.75,0,.18)*(1-r.userData.i*.055);r.rotation.z=Math.sin(now*.00035+r.userData.i)*.03-.1}if(birds){birds.position.x+=(1/60)*1.6;birds.children.forEach(b=>{const flap=Math.sin(now*.012+b.userData.phase)*.36;b.userData.l.rotation.z=.18+flap;b.userData.r.rotation.z=-.18-flap})}}
  if(p>.32&&p<.72)title?.classList.add('show');else title?.classList.remove('show');
  if(p>=1){active=false;document.body.classList.remove('dawn-cinema');document.querySelector('#letterbox')?.classList.remove('active');if(fxRoot)fxRoot.visible=false;core.camera.fov=48;core.camera.updateProjectionMatrix();core.S.time=.285;}}

function observe(){const log=document.querySelector('#battleLog');if(!log)return;new MutationObserver(()=>{const t=log.textContent;if(t.includes('星喰らいのオルグを倒した'))trigger();}).observe(log,{childList:true,characterData:true,subtree:true});}

(async()=>{try{core=await waitRuntime();injectCss();oldOverride=window.__ASTRAL.cameraOverride;window.__ASTRAL.cameraOverride=cameraOverride;observe();(function loop(now){update(now);requestAnimationFrame(loop)})(performance.now());}catch(err){console.warn('[Astral Dawn] dawn cinematic skipped.',err)}})();
