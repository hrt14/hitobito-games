import * as THREE from 'three';

let core=null,last=performance.now();
const states=new Map();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitCore(){for(let i=0;i<160;i++){if(window.__ASTRAL_CORE?.enemies)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('Astral core unavailable');}

function m(color,roughness=.8,metalness=0,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});}
function addMesh(parent,geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){const x=new THREE.Mesh(geo,mat);x.position.set(...pos);x.scale.set(...scale);x.rotation.set(...rot);x.castShadow=true;x.receiveShadow=true;parent.add(x);return x;}

function buildLeg(side,z,boss,materials){
  const g=new THREE.Group();g.position.set(side*(boss?.68:.48),boss?.7:.46,z);
  const upper=addMesh(g,new THREE.CapsuleGeometry(boss?.13:.1,boss?.58:.4,5,8),materials.dark,[0,0,0],[1,1,1],[0,0,side*.18]);
  const lower=addMesh(g,new THREE.CapsuleGeometry(boss?.1:.075,boss?.46:.32,5,7),materials.fur,[side*.05,-(boss?.43:.31),.07],[1,1,1],[.2,0,-side*.08]);
  const paw=addMesh(g,new THREE.DodecahedronGeometry(boss?.18:.135,0),materials.dark,[side*.06,-(boss?.72:.52),.16],[1.45,.62,1.5]);
  for(let i=-1;i<=1;i++)addMesh(g,new THREE.ConeGeometry(boss?.035:.025,boss?.2:.13,5),materials.claw,[i*(boss?.07:.05),-(boss?.76:.56),boss?.31:.23],[1,1,1],[Math.PI/2,0,0]);
  return {g,upper,lower,paw};
}

function buildTail(parent,boss,materials){
  const segments=[],count=boss?7:5;
  for(let i=0;i<count;i++){const s=addMesh(parent,new THREE.CapsuleGeometry(Math.max(.055,(boss?.14:.1)-i*.012),boss?.42:.3,4,7),i%2?materials.dark:materials.fur,[0,(boss?1.05:.78)-i*.025,-(boss?.95:.72)-i*(boss?.32:.23)],[1,1,1],[Math.PI/2+i*.08,0,0]);s.userData.tailIndex=i;segments.push(s)}
  return segments;
}

function buildBeast(enemy){
  const boss=!!enemy.userData.boss;
  const existing=[...enemy.children];existing.forEach(c=>c.visible=false);
  const root=new THREE.Group();root.name=boss?'Orgu_Visual':'Valg_Visual';enemy.add(root);
  const materials={
    fur:m(boss?0x51323c:0x536b51,.96),fur2:m(boss?0x70404a:0x718768,.92),dark:m(boss?0x29272d:0x34362f,.85),claw:m(0xb9aa8c,.5,.15),horn:m(boss?0xceb67e:0xb3a281,.54,.12),eye:m(0xffd78d,.28,.05,{emissive:boss?0xff462b:0xff8a32,emissiveIntensity:boss?5:3.3}),crystal:m(0xff7866,.24,.2,{emissive:0xcf281f,emissiveIntensity:4,transparent:true,opacity:.92})
  };
  const s=boss?1.28:1;
  const body=addMesh(root,new THREE.SphereGeometry(.78,18,13),materials.fur,[0,1.02,0],[1.2*s,.72*s,1.52*s]);
  const chest=addMesh(root,new THREE.IcosahedronGeometry(.6,2),materials.fur2,[0,1.17,.54],[1.05*s,.9*s,1.08*s]);
  const neck=addMesh(root,new THREE.CapsuleGeometry(.34,.45,6,10),materials.fur2,[0,1.38,.78],[1,1,1],[.56,0,0]);
  const head=addMesh(root,new THREE.DodecahedronGeometry(.52,1),materials.fur,[0,1.53,1.18],[1.04*s,.82*s,1.2*s]);
  const muzzle=addMesh(root,new THREE.BoxGeometry(.58,.31,.54),materials.dark,[0,1.37,1.62],[s*.9,s*.82,s]);
  const jaw=addMesh(root,new THREE.BoxGeometry(.5,.13,.47),materials.dark,[0,1.19,1.58],[s*.88,s,s]);
  const nose=addMesh(root,new THREE.DodecahedronGeometry(.13,0),materials.dark,[0,1.47,1.91],[1.25,.72,.82]);
  const eyes=[];for(const side of [-1,1]){eyes.push(addMesh(root,new THREE.SphereGeometry(boss?.075:.057,9,7),materials.eye,[side*(boss?.25:.2),1.64,1.63]));const ear=addMesh(root,new THREE.ConeGeometry(boss?.16:.12,boss?.48:.36,6),materials.fur2,[side*(boss?.4:.32),1.93,1.15],[1,.72,1],[0,0,-side*.35]);ear.rotation.x=-.15;}
  const horns=[];for(const side of [-1,1]){const h=addMesh(root,new THREE.ConeGeometry(boss?.13:.09,boss?1.05:.62,8),materials.horn,[side*(boss?.3:.25),2.02,1.16],[1,1,1],[-.32,0,-side*(boss?.34:.26)]);horns.push(h);if(boss){const h2=addMesh(root,new THREE.ConeGeometry(.09,.68,7),materials.horn,[side*.48,1.87,1.04],[1,1,1],[-.15,0,-side*.72]);horns.push(h2)}}
  const legs=[buildLeg(-1,.55,boss,materials),buildLeg(1,.55,boss,materials),buildLeg(-1,-.52,boss,materials),buildLeg(1,-.52,boss,materials)];legs.forEach(l=>root.add(l.g));
  const tail=buildTail(root,boss,materials);
  const mane=[];for(let i=0;i<(boss?11:7);i++){const a=(i-(boss?5:3))*.22;const sp=addMesh(root,new THREE.ConeGeometry(boss?.095:.065,boss?.48:.32,6),materials.dark,[Math.sin(a)*(boss?.42:.28),1.56+Math.cos(a)*.22,.48-i*.13],[1,1,1],[-.75,0,a*.5]);mane.push(sp)}
  const crystals=[];if(boss){for(let i=0;i<6;i++){const c=addMesh(root,new THREE.OctahedronGeometry(.13+i*.012,0),materials.crystal,[0,1.55+Math.sin(i*.6)*.16,.25-i*.28],[1,1.6,1],[-.4,0,i*.3]);crystals.push(c)}const chestRune=addMesh(root,new THREE.TorusKnotGeometry(.22,.035,48,8,2,3),materials.crystal,[0,1.28,1.04],[1,.62,.35],[Math.PI/2,0,0]);crystals.push(chestRune)}
  const aura=new THREE.Mesh(new THREE.RingGeometry(boss?1.7:1.05,boss?2.15:1.38,48),new THREE.MeshBasicMaterial({color:boss?0xd84437:0xe0a65d,transparent:true,opacity:boss?.68:.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));aura.rotation.x=-Math.PI/2;aura.position.y=.06;root.add(aura);enemy.userData.aura=aura;
  if(boss){const light=new THREE.PointLight(0xf04b3c,2.1,9,2);light.position.set(0,1.6,.8);root.add(light);enemy.userData.monsterLight=light;}
  const state={enemy,root,boss,body,chest,head,jaw,eyes,horns,legs,tail,mane,crystals,aura,phase:Math.random()*10,attackT:0,heavyT:0};states.set(enemy,state);enemy.userData.monsterV1=state;
}

function observeBattle(){
  const log=document.querySelector('#battleLog');if(!log)return;
  new MutationObserver(()=>{const t=log.textContent,e=core?.S.enemyObj,s=e&&states.get(e);if(!s)return;if(t.includes('赤い星光'))s.heavyT=1.15;if(t.includes('の攻撃')||t.includes('衝撃波'))s.attackT=.62;}).observe(log,{childList:true,characterData:true,subtree:true});
}

function updateState(s,dt,t){
  const idle=Math.sin(t*2.15+s.phase),breath=1+idle*.018;s.body.scale.y=(s.boss?.92:.72)*breath;s.chest.scale.y=(s.boss?1.16:.9)*(1+idle*.025);s.head.rotation.y=Math.sin(t*.85+s.phase)*.055;
  s.jaw.rotation.x=.04+Math.max(0,Math.sin(t*.7+s.phase))*.035;s.eyes.forEach(e=>e.material.emissiveIntensity=(s.boss?4.4:2.9)+Math.sin(t*3+s.phase)*.65);
  s.tail.forEach((x,i)=>{x.rotation.z=Math.sin(t*2+s.phase+i*.5)*(.08+i*.014);});
  s.legs.forEach((l,i)=>{l.g.rotation.x=Math.sin(t*1.7+s.phase+i)*.025;});
  s.mane.forEach((x,i)=>x.rotation.z+=Math.sin(t*1.3+i)*dt*.02);
  if(s.crystals.length)s.crystals.forEach((c,i)=>{c.rotation.y+=dt*(.45+i*.07);c.material.emissiveIntensity=3.2+Math.sin(t*3+i)*1.1;});
  if(s.heavyT>0){s.heavyT=Math.max(0,s.heavyT-dt);const p=s.heavyT/1.15;s.aura.scale.setScalar(1+(1-p)*.32);s.aura.material.opacity=.72+Math.sin(t*18)*.22;if(s.enemy.userData.monsterLight)s.enemy.userData.monsterLight.intensity=2.5+Math.sin(t*15)*1.5;}else{s.aura.scale.setScalar(1);s.aura.material.opacity=s.boss?.62:.2;if(s.enemy.userData.monsterLight)s.enemy.userData.monsterLight.intensity=1.7+Math.sin(t*3)*.5;}
  if(s.attackT>0){s.attackT=Math.max(0,s.attackT-dt);const p=1-s.attackT/.62,arc=Math.sin(p*Math.PI);s.root.position.z=arc*(s.boss?1.25:.85);s.root.position.y=arc*.12;s.head.rotation.x=-arc*.24;s.jaw.rotation.x=arc*.55;}else{s.root.position.z*=Math.max(0,1-dt*14);s.root.position.y*=Math.max(0,1-dt*14);}
}

function loop(now){const dt=Math.min((now-last)/1000,.04);last=now;if(core){for(const e of core.enemies)if(!states.has(e))buildBeast(e);for(const s of states.values())updateState(s,dt,now/1000);}requestAnimationFrame(loop);}

(async()=>{try{core=await waitCore();observeBattle();requestAnimationFrame(loop);}catch(err){console.warn('[Astral Dawn] monster visual layer skipped.',err);}})();
