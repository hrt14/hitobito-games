import * as THREE from 'three';

let core=null,last=performance.now(),smokes=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitCore(){for(let i=0;i<180;i++){if(window.__ASTRAL_CORE?.world)return window.__ASTRAL_CORE;await sleep(50)}throw new Error('Astral world unavailable');}
function mat(color,roughness=.8,metalness=0,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});}
function add(parent,geo,material,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function y(x,z){return core.groundY(x,z);}

function timberHouseDetail(x,z,rot=0,s=1,kind='home'){
  const g=new THREE.Group();g.position.set(x,y(x,z),z);g.rotation.y=rot;g.scale.setScalar(s);core.world.add(g);
  const wood=mat(0x5f402e,.82),dark=mat(0x273a3e,.72),stone=mat(0x707873,.94),warm=mat(0xffc77d,.42,0,{emissive:0xd4873c,emissiveIntensity:1.4}),cloth=mat(kind==='inn'?0x874a42:kind==='shop'?0x4d6d69:0x6e594c,.78,0,{side:THREE.DoubleSide});
  // Stone plinth + exposed timber skeleton immediately breaks the flat box read.
  add(g,new THREE.BoxGeometry(5.35,.34,4.3),stone,[0,.18,0]);
  for(const sx of [-2.22,2.22])for(const sz of [-1.72,1.72])add(g,new THREE.BoxGeometry(.16,3.1,.16),wood,[sx,1.72,sz]);
  for(const z0 of [-1.78,1.78]){add(g,new THREE.BoxGeometry(4.65,.13,.14),wood,[0,2.9,z0]);add(g,new THREE.BoxGeometry(4.5,.12,.12),wood,[0,1.15,z0],[1,1,1],[0,0,.25]);add(g,new THREE.BoxGeometry(4.5,.12,.12),wood,[0,1.15,z0],[1,1,1],[0,0,-.25]);}
  const chimney=add(g,new THREE.CylinderGeometry(.28,.35,2.1,7),stone,[1.45,4.25,-.55]);chimney.rotation.y=.2;
  const cap=add(g,new THREE.ConeGeometry(.48,.35,7),dark,[1.45,5.42,-.55]);
  const awning=add(g,new THREE.PlaneGeometry(kind==='home'?1.7:2.7,1.1),cloth,[0,2.05,2.28],[1,1,1],[-.48,0,0]);
  if(kind!=='home'){
    const sign=add(g,new THREE.BoxGeometry(kind==='inn'?1.05:1.35,.56,.12),wood,[-1.45,2.75,2.37]);
    const icon=add(g,kind==='inn'?new THREE.TorusGeometry(.18,.045,7,18):new THREE.OctahedronGeometry(.15,0),warm,[-1.45,2.75,2.45]);
    if(kind==='inn'){const lantern=new THREE.PointLight(0xffad62,1.3,7,2);lantern.position.set(-1.45,2.5,2.7);g.add(lantern)}
  }
  // Window boxes add lived-in silhouette at eye level.
  for(const sx of [-1.25,1.25]){add(g,new THREE.BoxGeometry(.95,.14,.28),wood,[sx,1.72,2.25]);for(let i=0;i<4;i++)add(g,new THREE.IcosahedronGeometry(.09,0),mat(i%2?0xf0c68c:0xb86e76,1),[sx-.3+i*.2,1.9,2.28]);}
  smokeEmitter(g,new THREE.Vector3(1.45,5.65,-.55));
  return g;
}

function smokeEmitter(root,local){const material=mat(0xb8c1bd,1,0,{transparent:true,opacity:.12,depthWrite:false});for(let i=0;i<5;i++){const p=add(root,new THREE.SphereGeometry(.18+i*.035,8,6),material.clone(),[local.x,local.y+i*.34,local.z]);p.castShadow=false;p.receiveShadow=false;smokes.push({o:p,phase:i*1.1,base:p.position.clone()});}}

function marketStall(){const x=-15,z=12,g=new THREE.Group();g.position.set(x,y(x,z),z);g.rotation.y=.28;core.world.add(g);const wood=mat(0x60402d,.86),cloth=mat(0xb46452,.82,0,{side:THREE.DoubleSide});for(const sx of [-1.25,1.25])for(const sz of [-.75,.75])add(g,new THREE.BoxGeometry(.1,2.3,.1),wood,[sx,1.15,sz]);add(g,new THREE.PlaneGeometry(2.9,2),cloth,[0,2.35,0],[1,1,1],[-Math.PI/2,0,0]);add(g,new THREE.BoxGeometry(2.5,.2,1.25),wood,[0,.7,.05]);for(let i=0;i<8;i++){const c=i%3===0?0xe6bb72:i%3===1?0x8ea967:0xb77467;add(g,new THREE.SphereGeometry(.11,7,5),mat(c,1),[-.9+(i%4)*.58,.88,-.2+Math.floor(i/4)*.42]);}}

function forgeCorner(){const x=3.5,z=19.5,g=new THREE.Group();g.position.set(x,y(x,z),z);g.rotation.y=-.35;core.world.add(g);const stone=mat(0x626965,.96),iron=mat(0x313b3d,.5,.65),fire=mat(0xffaa55,.3,0,{emissive:0xff5a22,emissiveIntensity:4});add(g,new THREE.BoxGeometry(1.8,1.05,1.25),stone,[0,.55,0]);add(g,new THREE.BoxGeometry(1.2,.2,.75),iron,[0,1.16,0]);const coal=add(g,new THREE.BoxGeometry(.95,.12,.55),fire,[0,1.3,0]);const light=new THREE.PointLight(0xff6b32,2.1,8,2);light.position.set(0,1.8,0);g.add(light);const anvil=add(g,new THREE.BoxGeometry(.9,.22,.38),iron,[1.45,.9,.4]);add(g,new THREE.CylinderGeometry(.18,.3,.8,8),iron,[1.45,.42,.4]);g.userData={fire:coal,light};}

function shrineArchitecture(){const s=core.scene.userData.shrine;if(!s)return;const stone=mat(0x6d7b79,.95),edge=mat(0x879994,.8),rune=mat(0x9efff4,.25,.25,{emissive:0x43cfd1,emissiveIntensity:2.1});
  // Three concentric stepped terraces make the shrine read as a destination, not scattered columns.
  for(let i=0;i<3;i++){const r=3.5+i*.85,h=.22;const step=add(s,new THREE.CylinderGeometry(r+.55,r+.75,h,12),i===0?edge:stone,[0,-.05-i*.17,0]);step.receiveShadow=true;}
  // Broken cardinal pylons with asymmetry.
  const pylons=[[0,-4.7,4.8],[-4.3,0,3.6],[4.5,.2,5.6],[.4,4.45,2.7]];
  pylons.forEach(([px,pz,h],idx)=>{const p=add(s,new THREE.BoxGeometry(.7,h,.9),stone,[px,h/2,pz],[1,1,1],[idx*.03,idx*.19,.04*(idx-1)]);add(s,new THREE.BoxGeometry(1.05,.24,1.2),edge,[px,h+.08,pz]);if(idx!==3)add(s,new THREE.OctahedronGeometry(.14,0),rune,[px,h+.5,pz]);});
  // Rune floor: radial bars and an inner star.
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,b=add(s,new THREE.BoxGeometry(.045,.025,2.2),rune,[Math.sin(a)*1.8,.45,Math.cos(a)*1.8],[1,1,1],[0,a,0]);}
  const star=new THREE.Shape();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?1.0:2.0,p=new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r);i?star.lineTo(p.x,p.y):star.moveTo(p.x,p.y)}star.closePath();const sg=new THREE.ShapeGeometry(star),sm=new THREE.MeshBasicMaterial({color:0x8ce8df,transparent:true,opacity:.11,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}),floor=new THREE.Mesh(sg,sm);floor.rotation.x=-Math.PI/2;floor.position.y=.46;s.add(floor);s.userData.archStar=floor;
}

function distantRuins(){const stone=mat(0x566763,.98);for(let i=0;i<7;i++){const x=44+i*2.6,z=-51-Math.sin(i*.7)*4,h=2.5+(i%3)*1.2,g=new THREE.Group();g.position.set(x,y(x,z),z);g.rotation.y=.2+i*.13;core.world.add(g);add(g,new THREE.BoxGeometry(.75,h,.75),stone,[0,h/2,0]);if(i%2===0)add(g,new THREE.BoxGeometry(2.2,.5,.6),stone,[.7,h-.2,0],[1,1,1],[0,0,.15]);}}

function build(){timberHouseDetail(-8,13,-.2,1.08,'inn');timberHouseDetail(-15,7,.25,.9,'shop');timberHouseDetail(1,17,-.45,.82,'home');timberHouseDetail(-7,22,.15,1.35,'home');marketStall();forgeCorner();shrineArchitecture();distantRuins();}
function loop(now){const dt=Math.min((now-last)/1000,.04);last=now,t=now/1000;for(const s of smokes){s.o.position.x=s.base.x+Math.sin(t*.45+s.phase)*.13;s.o.position.y=s.base.y+Math.sin(t*.7+s.phase)*.09;s.o.scale.setScalar(1+Math.sin(t*.5+s.phase)*.12);s.o.material.opacity=.08+Math.sin(t*.4+s.phase)*.025}const shrine=core?.scene.userData.shrine;if(shrine?.userData.archStar){shrine.userData.archStar.rotation.z+=dt*.08;shrine.userData.archStar.material.opacity=.08+Math.sin(t*1.4)*.035}const forge=core?.world.children.find(x=>x.userData.fire);if(forge){forge.userData.fire.material.emissiveIntensity=3.3+Math.sin(t*9)*1.2;forge.userData.light.intensity=1.8+Math.sin(t*8)*.55}requestAnimationFrame(loop);}

(async()=>{try{core=await waitCore();build();requestAnimationFrame(loop);}catch(err){console.warn('[Astral Dawn] architecture layer skipped.',err)}})();
