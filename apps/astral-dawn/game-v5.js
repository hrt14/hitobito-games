import * as THREE from 'three';

// V5 keeps the proven V4 game loop intact and instruments it with a high-density
// presentation layer: procedural PBR detail, environment dressing, treasure,
// richer silhouettes, ambient music, battle impact FX and short camera cuts.
window.__ASTRAL = {};

async function bootCore(){
  const response = await fetch('./game-v4.js', {cache:'no-store'});
  if(!response.ok) throw new Error(`Could not load game-v4.js (${response.status})`);
  let source = await response.text();

  const dispatchNeedle = "if(i){if(i.type==='npc')talk(i);else shrine();return}";
  const dispatchPatch = "if(i){if(i.type==='npc')talk(i);else if(i.type==='chest'&&window.__ASTRAL?.openChest)window.__ASTRAL.openChest(i);else shrine();return}";
  if(source.includes(dispatchNeedle)) source = source.replace(dispatchNeedle, dispatchPatch);

  const camNeedle = 'function cameraUpdate(dt){';
  if(source.includes(camNeedle)) source = source.replace(camNeedle, "function cameraUpdate(dt){if(window.__ASTRAL?.cameraOverride?.(dt))return;");

  const impactNeedle = 'function damage(n,crit=false){';
  if(source.includes(impactNeedle)) source = source.replace(impactNeedle, "function damage(n,crit=false){window.__ASTRAL?.impact?.(S.enemyObj,n,crit);");

  const exposure = `\nwindow.__ASTRAL_CORE={
    THREE,
    get renderer(){return renderer},get scene(){return scene},get camera(){return camera},
    get player(){return player},get companion(){return companion},get world(){return world},
    get S(){return S},parts,enemies,npcs,interactables,colliders,effects,particles,
    groundY,mesh,mat,toast,updateUI,updateQuest,tone
  };\ninit();`;
  const before = source;
  source = source.replace(/\ninit\(\);\s*$/, exposure);
  if(source === before) throw new Error('V5 instrumentation failed: core exposure point not found');

  const blob = URL.createObjectURL(new Blob([source], {type:'text/javascript'}));
  try { await import(blob); } finally { URL.revokeObjectURL(blob); }
  return window.__ASTRAL_CORE;
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const isMobile=matchMedia('(max-width:720px), (pointer:coarse)').matches;
const runtime={core:null,decoratedCompanion:false,fx:[],chestTweens:[],cameraCut:0,cameraCutMax:0,cutEnemy:null,audio:null,lastMode:'field',lastWins:0};

function injectPolishCss(){
  const style=document.createElement('style');
  style.textContent=`
  #cinematicNoise,#dangerFx{position:fixed;inset:0;pointer-events:none;z-index:6}
  #cinematicNoise{opacity:.13;mix-blend-mode:soft-light;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.34'/%3E%3C/svg%3E");animation:noiseShift .22s steps(2) infinite}
  #dangerFx{z-index:17;opacity:0;background:radial-gradient(circle at center,transparent 45%,rgba(170,20,20,.42));transition:opacity .2s}
  #dangerFx.on{opacity:1;animation:dangerPulse .55s ease-in-out 2}
  #soundToggle{position:fixed;z-index:15;right:20px;top:101px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(8,17,23,.58);backdrop-filter:blur(12px);color:#d9e6df;cursor:pointer;font-size:14px;box-shadow:0 10px 32px rgba(0,0,0,.2)}
  #partyChip{position:fixed;z-index:10;right:18px;top:150px;padding:9px 13px;border-radius:999px;border:1px solid rgba(121,220,224,.22);background:rgba(9,23,29,.58);backdrop-filter:blur(12px);font-size:9px;letter-spacing:.13em;color:#a8c9c7;opacity:0;transform:translateY(-5px);transition:.35s}
  #partyChip.show{opacity:1;transform:none}#partyChip b{color:#e7d49c;margin-left:7px}
  body.battle-cinema #vignette{background:radial-gradient(circle at center,transparent 42%,rgba(0,0,0,.46) 82%,rgba(0,0,0,.82));transition:.35s}
  body.battle-cinema #quest{opacity:.28;transform:translateX(-8px);transition:.35s}
  @keyframes noiseShift{0%{transform:translate(0)}25%{transform:translate(-1%,1%)}50%{transform:translate(1%,-1%)}75%{transform:translate(1%,1%)}100%{transform:translate(-1%,-1%)}}
  @keyframes dangerPulse{50%{opacity:.25}}
  @media(max-width:720px){#soundToggle{right:12px;top:76px;width:34px;height:34px}#partyChip{right:10px;top:121px;padding:7px 10px}}
  `;
  document.head.appendChild(style);
  const noise=document.createElement('div');noise.id='cinematicNoise';document.body.appendChild(noise);
  const danger=document.createElement('div');danger.id='dangerFx';document.body.appendChild(danger);
  const sound=document.createElement('button');sound.id='soundToggle';sound.setAttribute('aria-label','サウンド切替');sound.textContent='♪';document.body.appendChild(sound);
  const party=document.createElement('div');party.id='partyChip';party.innerHTML='PARTY <b>✦ リナ</b>';document.body.appendChild(party);
  return {danger,sound,party};
}

function makeNoiseTexture(THREE, palette, repeat=8, bump=false){
  const size=128,c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),img=x.createImageData(size,size);
  for(let i=0;i<size*size;i++){
    const n=Math.random(),p=palette[(Math.random()*palette.length)|0];
    const o=i*4;
    if(bump){const g=(110+n*90)|0;img.data[o]=img.data[o+1]=img.data[o+2]=g;}
    else{img.data[o]=clamp(p[0]+(n-.5)*18,0,255);img.data[o+1]=clamp(p[1]+(n-.5)*18,0,255);img.data[o+2]=clamp(p[2]+(n-.5)*18,0,255);}
    img.data[o+3]=255;
  }
  x.putImageData(img,0,0);
  // Add sparse fibers / stone flecks so surfaces read at mid distance.
  x.globalAlpha=bump?.2:.28;
  for(let i=0;i<180;i++){
    x.fillStyle=bump?'#fff':`rgba(255,255,255,${rand(.04,.14)})`;
    x.fillRect(rand(0,size),rand(0,size),rand(.4,2.2),rand(.4,2.2));
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.colorSpace=bump?THREE.NoColorSpace:THREE.SRGBColorSpace;t.anisotropy=Math.min(8,runtime.core.renderer.capabilities.getMaxAnisotropy());return t;
}

function applySurfaceDetail(core){
  const T=core.THREE;
  const maps={
    grass:[makeNoiseTexture(T,[[87,126,75],[101,145,84],[70,108,67]],32),makeNoiseTexture(T,[[0,0,0]],32,true)],
    dirt:[makeNoiseTexture(T,[[142,111,76],[166,136,93],[116,90,68]],9),makeNoiseTexture(T,[[0,0,0]],9,true)],
    stone:[makeNoiseTexture(T,[[112,119,116],[126,128,121],[91,104,103]],5),makeNoiseTexture(T,[[0,0,0]],5,true)],
    wood:[makeNoiseTexture(T,[[103,72,51],[126,84,54],[82,57,44]],4),makeNoiseTexture(T,[[0,0,0]],4,true)],
    plaster:[makeNoiseTexture(T,[[207,194,166],[222,207,179],[187,176,152]],3),makeNoiseTexture(T,[[0,0,0]],3,true)]
  };
  const assign=(m,pair,bumpScale)=>{if(!m?.isMeshStandardMaterial&&!m?.isMeshPhysicalMaterial)return;m.map=pair[0];m.bumpMap=pair[1];m.bumpScale=bumpScale;m.needsUpdate=true;};
  core.world.traverse(o=>{
    if(!o.isMesh)return;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    for(const m of ms){if(!m?.color)continue;const h=m.color.getHex();
      if(h===0x6f9a65)assign(m,maps.grass,.055);
      else if(h===0x9d8059)assign(m,maps.dirt,.045);
      else if([0x778181,0x7b8078,0x6d7f7a,0x6d7772,0x596d72].includes(h))assign(m,maps.stone,.06);
      else if([0x6a4935,0x634936].includes(h))assign(m,maps.wood,.045);
      else if(h===0xd5c4a5)assign(m,maps.plaster,.025);
    }
  });
}

function distSeg(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;if(!l)return Math.hypot(px-ax,pz-az);const t=clamp(((px-ax)*dx+(pz-az)*dz)/l,0,1);return Math.hypot(px-(ax+t*dx),pz-(az+t*dz));}
const pathPts=[[-4,8],[2,2],[6,-5],[12,-14],[18,-22],[24,-31],[31,-36]];
function nearPath(x,z,r=3.6){for(let i=0;i<pathPts.length-1;i++)if(distSeg(x,z,...pathPts[i],...pathPts[i+1])<r)return true;return false;}
function validWild(x,z){if(x>-22&&x<8&&z>2&&z<29)return false;if(Math.hypot(x+28,(z+18)/.72)<19)return false;if(x>21&&z<-28)return false;if(nearPath(x,z))return false;return Math.abs(x)<59&&Math.abs(z)<59;}

function dressField(core){
  const T=core.THREE,world=core.world;
  const grassGeo=new T.ConeGeometry(.055,.46,3),grassMat=new T.MeshStandardMaterial({color:0x789e63,roughness:1,side:T.DoubleSide});
  const count=isMobile?420:1050,inst=new T.InstancedMesh(grassGeo,grassMat,count);inst.castShadow=false;inst.receiveShadow=true;const dummy=new T.Object3D();
  let made=0,guard=0;
  while(made<count&&guard++<count*10){const x=rand(-58,58),z=rand(-58,58);if(!validWild(x,z))continue;dummy.position.set(x,core.groundY(x,z)+.2,z);dummy.rotation.y=rand(0,Math.PI*2);const s=rand(.55,1.45);dummy.scale.set(s,s*rand(.7,1.2),s);dummy.updateMatrix();inst.setMatrixAt(made++,dummy.matrix);}
  inst.count=made;inst.instanceMatrix.needsUpdate=true;world.add(inst);

  const rockGeo=new T.DodecahedronGeometry(1,0),rockMat=new T.MeshStandardMaterial({color:0x687470,roughness:.93});const rocks=new T.InstancedMesh(rockGeo,rockMat,isMobile?32:58);
  for(let i=0;i<rocks.count;i++){let x,z;do{x=rand(-54,54);z=rand(-54,54)}while(!validWild(x,z));dummy.position.set(x,core.groundY(x,z)+.18,z);dummy.rotation.set(rand(-.2,.2),rand(0,6.28),rand(-.2,.2));dummy.scale.set(rand(.15,.65),rand(.12,.5),rand(.18,.8));dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=true;rocks.receiveShadow=true;world.add(rocks);

  // Foreground shrubs create depth when the camera travels through the meadow.
  const shrubMat=new T.MeshStandardMaterial({color:0x355f4b,roughness:1});
  for(let i=0;i<(isMobile?24:46);i++){let x,z;do{x=rand(-52,52);z=rand(-52,52)}while(!validWild(x,z));const g=new T.Group();for(let j=0;j<3;j++){const m=new T.Mesh(new T.IcosahedronGeometry(rand(.25,.52),1),shrubMat);m.position.set(rand(-.35,.35),rand(.25,.55),rand(-.35,.35));m.castShadow=true;g.add(m)}g.position.set(x,core.groundY(x,z),z);world.add(g);}
}

function addVillageProps(core){
  const T=core.THREE,w=core.world,wood=new T.MeshStandardMaterial({color:0x6a4935,roughness:.86}),iron=new T.MeshStandardMaterial({color:0x40484a,metalness:.55,roughness:.5});
  const makeFence=(x,z,len,rot=0)=>{const g=new T.Group();for(const sx of [-len/2,len/2]){const p=new T.Mesh(new T.BoxGeometry(.13,1.25,.13),wood);p.position.set(sx,.62,0);p.castShadow=true;g.add(p)}for(const y of [.43,.9]){const r=new T.Mesh(new T.BoxGeometry(len,.11,.12),wood);r.position.y=y;r.castShadow=true;g.add(r)}g.position.set(x,core.groundY(x,z),z);g.rotation.y=rot;w.add(g)};
  makeFence(-20,18,9,.12);makeFence(5,23,7,-.16);makeFence(-18,2,6,1.35);
  const barrel=(x,z,s=1)=>{const g=new T.Group(),b=new T.Mesh(new T.CylinderGeometry(.44,.48,.9,12),wood);b.position.y=.45;b.castShadow=true;g.add(b);for(const y of [.18,.72]){const r=new T.Mesh(new T.TorusGeometry(.46,.025,5,16),iron);r.rotation.x=Math.PI/2;r.position.y=y;g.add(r)}g.position.set(x,core.groundY(x,z),z);g.scale.setScalar(s);w.add(g)};
  barrel(-10,11);barrel(-10.8,11.5,.82);barrel(-1,17,.9);
  for(const [x,z] of [[-12,11],[-8.2,12.6],[-.5,15.4],[-6.5,20]]){const l=new T.PointLight(0xffb967,1.35,8,2.1);l.position.set(x,core.groundY(x,z)+2.3,z);w.add(l)}
  const sign=new T.Group(),post=new T.Mesh(new T.BoxGeometry(.12,2.1,.12),wood),board=new T.Mesh(new T.BoxGeometry(1.5,.58,.12),wood);post.position.y=1.05;board.position.set(0,1.65,.05);sign.add(post,board);sign.position.set(2,core.groundY(2,5),5);sign.rotation.y=-.4;w.add(sign);
}

function enhanceShrine(core){
  const T=core.THREE,s=core.scene.userData.shrine;if(!s)return;const ringMat=new T.MeshStandardMaterial({color:0x90f4ef,emissive:0x39ced1,emissiveIntensity:2.4,metalness:.35,roughness:.25,transparent:true,opacity:.65});
  const rings=[];for(let i=0;i<3;i++){const r=new T.Mesh(new T.TorusGeometry(2.3+i*.6,.035,8,48),ringMat.clone());r.rotation.set(Math.PI/2+i*.25,i*.35,0);r.position.y=1.1+i*.52;s.add(r);rings.push(r)}
  const shards=[];for(let i=0;i<9;i++){const sh=new T.Mesh(new T.OctahedronGeometry(rand(.08,.18),0),ringMat.clone());const a=i/9*Math.PI*2;sh.position.set(Math.cos(a)*rand(2.1,3.4),rand(1.2,3.6),Math.sin(a)*rand(2.1,3.4));s.add(sh);sh.userData.phase=rand(0,10);shards.push(sh)}
  const light=new T.PointLight(0x55e4e5,2.2,14,2);light.position.y=2.4;s.add(light);s.userData.v5={rings,shards,light};
}

function decorateHero(core){
  const T=core.THREE,p=core.player;if(!p||p.userData.v5)return;p.userData.v5=1;
  const metal=new T.MeshStandardMaterial({color:0xb8c9c8,metalness:.72,roughness:.3}),leather=new T.MeshStandardMaterial({color:0x4f3429,roughness:.72}),gold=new T.MeshStandardMaterial({color:0xd6b76b,metalness:.62,roughness:.3}),eye=new T.MeshStandardMaterial({color:0x223238,roughness:.45});
  const chest=new T.Mesh(new T.BoxGeometry(.82,.58,.45),new T.MeshStandardMaterial({color:0x2d536c,roughness:.58}));chest.position.set(0,1.8,.05);chest.rotation.x=-.04;chest.castShadow=true;p.add(chest);
  const belt=new T.Mesh(new T.TorusGeometry(.41,.045,6,20),leather);belt.rotation.x=Math.PI/2;belt.position.y=1.3;p.add(belt);
  for(const sx of [-1,1]){const pa=new T.Mesh(new T.DodecahedronGeometry(.22,0),metal);pa.scale.set(1.35,.62,1);pa.position.set(sx*.54,1.93,.01);pa.castShadow=true;p.add(pa);const boot=new T.Mesh(new T.BoxGeometry(.27,.38,.42),leather);boot.position.set(sx*.22,.27,.11);boot.castShadow=true;p.add(boot);const e=new T.Mesh(new T.SphereGeometry(.045,8,6),eye);e.position.set(sx*.14,2.71,.385);p.add(e)}
  const clasp=new T.Mesh(new T.OctahedronGeometry(.09,0),gold);clasp.position.set(0,2.03,.31);clasp.rotation.z=Math.PI/4;p.add(clasp);
  const scarf=new T.Mesh(new T.PlaneGeometry(.42,.8),new T.MeshStandardMaterial({color:0x8a3f45,side:T.DoubleSide,roughness:.8}));scarf.position.set(-.18,2.06,-.4);scarf.rotation.x=.2;scarf.rotation.z=.2;p.add(scarf);
}

function decorateCompanion(core){
  const T=core.THREE,p=core.companion;if(!p||p.userData.v5)return;p.userData.v5=1;
  const cloth=new T.MeshStandardMaterial({color:0x79546d,roughness:.78}),gold=new T.MeshStandardMaterial({color:0xdcc47d,metalness:.45,roughness:.35}),wood=new T.MeshStandardMaterial({color:0x5c4434,roughness:.82}),glow=new T.MeshStandardMaterial({color:0xa8fcf1,emissive:0x4edbd7,emissiveIntensity:3});
  const mantle=new T.Mesh(new T.ConeGeometry(.65,.75,14,1,true),cloth);mantle.position.y=1.65;mantle.rotation.y=.2;p.add(mantle);
  const staff=new T.Group(),shaft=new T.Mesh(new T.CylinderGeometry(.035,.045,2.45,8),wood),head=new T.Mesh(new T.TorusGeometry(.22,.035,8,20),gold),gem=new T.Mesh(new T.OctahedronGeometry(.11,0),glow);shaft.position.y=1.2;head.position.y=2.32;head.rotation.x=Math.PI/2;gem.position.y=2.32;staff.add(shaft,head,gem);staff.position.set(.62,.05,.05);staff.rotation.z=-.08;p.add(staff);p.userData.v5staff=staff;
}

function decorateEnemy(core,e){
  if(e.userData.v5)return;e.userData.v5=1;const T=core.THREE,boss=e.userData.boss,fur=new T.MeshStandardMaterial({color:boss?0x4e2f38:0x566b53,roughness:.96}),dark=new T.MeshStandardMaterial({color:0x302d2b,roughness:.82});
  for(const sx of [-1,1])for(const z of [-.45,.45]){const leg=new T.Mesh(new T.CapsuleGeometry(.09,boss?.62:.42,3,6),dark);leg.position.set(sx*(boss?.56:.42),boss?.42:.32,z);leg.castShadow=true;e.add(leg)}
  const tail=new T.Mesh(new T.ConeGeometry(boss?.2:.13,boss?1.8:1.2,8),fur);tail.position.set(0,boss?1:.78,-1);tail.rotation.x=-1.15;e.add(tail);
  for(let i=0;i<(boss?7:4);i++){const sp=new T.Mesh(new T.ConeGeometry(boss?.11:.07,boss?.62:.36,7),dark);sp.position.set(0,(boss?1.1:.85)+i*.12,-.55+i*.18);sp.rotation.x=-.85;e.add(sp)}
  if(boss){const rune=new T.Mesh(new T.TorusKnotGeometry(.28,.045,40,7,2,3),new T.MeshStandardMaterial({color:0xe87b67,emissive:0xd63828,emissiveIntensity:3,metalness:.3,roughness:.25}));rune.position.set(0,1.22,1.28);rune.scale.set(1,.7,.35);e.add(rune);e.userData.v5rune=rune;}
}

function makeChest(core,x,z,reward,label){
  const T=core.THREE,g=new T.Group(),wood=new T.MeshStandardMaterial({color:0x704831,roughness:.66}),metal=new T.MeshStandardMaterial({color:0xc5a663,metalness:.65,roughness:.3});
  const base=new T.Mesh(new T.BoxGeometry(1.05,.55,.72),wood);base.position.y=.3;base.castShadow=true;const lidPivot=new T.Group(),lid=new T.Mesh(new T.BoxGeometry(1.08,.32,.76),wood);lid.position.set(0,.15,.0);lid.castShadow=true;lidPivot.position.set(0,.56,-.32);lid.position.z=.32;lidPivot.add(lid);
  const band=new T.Mesh(new T.BoxGeometry(.16,.9,.78),metal);band.position.set(0,.45,.03);const lock=new T.Mesh(new T.BoxGeometry(.22,.24,.1),metal);lock.position.set(0,.55,.4);g.add(base,lidPivot,band,lock);g.position.set(x,core.groundY(x,z),z);g.userData={v5chest:true,lidPivot,reward,label,opened:false};core.world.add(g);core.interactables.push({type:'chest',obj:g,r:2.25,text:'宝箱を開ける',reward,label});return g;
}

function addTreasure(core){
  makeChest(core,-18,-3,'items','旅人の小箱');
  makeChest(core,13,-8,'hp','星鉄の小箱');
  makeChest(core,22,-21,'mp','青晶の小箱');
}

function burst(core,pos,color=0xffd77e,count=18){
  const T=core.THREE;for(let i=0;i<count;i++){const m=new T.Mesh(new T.OctahedronGeometry(rand(.025,.08),0),new T.MeshBasicMaterial({color,transparent:true,opacity:1}));m.position.copy(pos).add(new T.Vector3(rand(-.2,.2),rand(.25,1),rand(-.2,.2)));m.userData.v=new T.Vector3(rand(-1.2,1.2),rand(.5,2),rand(-1.2,1.2));core.world.add(m);runtime.fx.push({o:m,t:0,d:rand(.55,1),type:'particle'});}}

function openChest(i){
  const core=runtime.core,g=i.obj;if(!g||g.userData.opened)return core.toast('宝箱は空だ。');g.userData.opened=true;runtime.chestTweens.push({g,t:0});burst(core,g.position.clone(),0xf5cf75,28);core.tone(880,.12);setTimeout(()=>core.tone(1174,.2),100);
  if(g.userData.reward==='items'){core.S.items+=2;core.toast('薬草雫 ×2 を手に入れた！',2100)}
  else if(g.userData.reward==='hp'){core.S.maxHp+=12;core.S.hp=core.S.maxHp;core.toast('星鉄の護符 — 最大HP +12',2300)}
  else{core.S.maxMp+=10;core.S.mp=core.S.maxMp;core.toast('青晶の欠片 — 最大MP +10',2300)}
  core.updateUI();
}

function glowSprite(T,color){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.16,color);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);const tex=new T.CanvasTexture(c);const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));return s;
}

function impact(enemy,n,crit){
  const core=runtime.core;if(!core||!enemy)return;runtime.cameraCut=crit?.38:.22;runtime.cameraCutMax=runtime.cameraCut;runtime.cutEnemy=enemy;const T=core.THREE,pos=enemy.position.clone().add(new T.Vector3(0,1.1,0));burst(core,pos,crit?0xfff1a5:0x83e8ef,crit?36:22);
  const ring=new T.Mesh(new T.RingGeometry(.18,.25,32),new T.MeshBasicMaterial({color:crit?0xffe899:0xb1ffff,transparent:true,opacity:1,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));ring.position.copy(pos);ring.lookAt(core.camera.position);core.scene.add(ring);runtime.fx.push({o:ring,t:0,d:.36,type:'ring'});
  const glow=glowSprite(T,crit?'rgba(255,213,97,.72)':'rgba(95,225,236,.68)');glow.position.copy(pos);glow.scale.setScalar(crit?3.2:2.1);core.scene.add(glow);runtime.fx.push({o:glow,t:0,d:.25,type:'glow'});
}

function cameraOverride(dt){
  if(runtime.cameraCut<=0||!runtime.core||!runtime.cutEnemy)return false;const c=runtime.core,T=c.THREE;runtime.cameraCut=Math.max(0,runtime.cameraCut-dt);const p=1-runtime.cameraCut/runtime.cameraCutMax,enemy=runtime.cutEnemy,mid=c.player.position.clone().lerp(enemy.position,.62).add(new T.Vector3(0,1.3,0)),dir=enemy.position.clone().sub(c.player.position).setY(0).normalize(),side=new T.Vector3(-dir.z,0,dir.x);const cam=mid.clone().addScaledVector(side,3.2+Math.sin(p*Math.PI)*.55).addScaledVector(dir,-2.2).add(new T.Vector3(0,1.3,0));c.camera.position.lerp(cam,clamp(dt*24,0,1));c.camera.lookAt(mid);c.camera.fov=44-Math.sin(p*Math.PI)*3;c.camera.updateProjectionMatrix();if(runtime.cameraCut<=0){c.camera.fov=48;c.camera.updateProjectionMatrix();}return true;
}

class AudioDirector{
  constructor(core,button){this.core=core;this.button=button;this.ctx=null;this.master=null;this.field=null;this.battle=null;this.muted=false;this.timer=null;button.onclick=()=>this.toggle();document.addEventListener('pointerdown',()=>this.start(),{once:true});}
  start(){if(this.ctx)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.3;this.master.connect(this.ctx.destination);this.field=this.ctx.createGain();this.battle=this.ctx.createGain();this.field.gain.value=.12;this.battle.gain.value=0;this.field.connect(this.master);this.battle.connect(this.master);this.pad(110,this.field,'sine',.1);this.pad(164.81,this.field,'triangle',.045);this.pad(55,this.battle,'sawtooth',.06);this.wind();this.timer=setInterval(()=>this.tick(),650);}
  pad(f,dest,type,gain){const o=this.ctx.createOscillator(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();o.type=type;o.frequency.value=f;filter.type='lowpass';filter.frequency.value=700;g.gain.value=gain;o.connect(filter).connect(g).connect(dest);o.start();}
  wind(){const len=this.ctx.sampleRate*2,b=this.ctx.createBuffer(1,len,this.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=b;s.loop=true;f.type='lowpass';f.frequency.value=580;g.gain.value=.018;s.connect(f).connect(g).connect(this.field);s.start();}
  note(f,d=.28,gain=.025,dest=this.field){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(gain,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+d);o.connect(g).connect(dest);o.start();o.stop(this.ctx.currentTime+d);}
  kick(){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(92,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(42,this.ctx.currentTime+.16);g.gain.setValueAtTime(.12,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+.18);o.connect(g).connect(this.battle);o.start();o.stop(this.ctx.currentTime+.2);}
  tick(){const battle=this.core.S.mode==='battle'||this.core.S.mode==='transition';const t=this.ctx.currentTime;this.field.gain.cancelScheduledValues(t);this.battle.gain.cancelScheduledValues(t);this.field.gain.linearRampToValueAtTime(battle?.018:.12,t+.45);this.battle.gain.linearRampToValueAtTime(battle?.14:0,t+.3);if(battle)this.kick();else if(Math.random()<.24){const notes=[261.63,293.66,329.63,392,440];this.note(notes[(Math.random()*notes.length)|0],.65,.015);}}
  toggle(){this.start();this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.3,this.ctx.currentTime,.05);this.button.textContent=this.muted?'×':'♪';}
}

function observeBattleUi(core,ui){
  const battle=document.querySelector('#battleHud'),log=document.querySelector('#battleLog');
  new MutationObserver(()=>{const on=!battle.classList.contains('hidden');document.body.classList.toggle('battle-cinema',on);runtime.lastMode=on?'battle':'field';}).observe(battle,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>{if(log.textContent.includes('赤い星光')){ui.danger.classList.add('on');setTimeout(()=>ui.danger.classList.remove('on'),1200)}}).observe(log,{childList:true,characterData:true,subtree:true});
}

function updateDecorations(dt,t){
  const c=runtime.core;if(!c)return;
  if(c.S.joined){document.querySelector('#partyChip')?.classList.add('show');if(!runtime.decoratedCompanion&&c.companion){decorateCompanion(c);runtime.decoratedCompanion=true;}}
  for(const e of c.enemies)decorateEnemy(c,e);
  const shrine=c.scene.userData.shrine;if(shrine?.userData.v5){const v=shrine.userData.v5;v.rings.forEach((r,i)=>{r.rotation.z+=dt*(i%2?-.28:.22);r.material.opacity=.46+Math.sin(t*1.8+i)*.16});v.shards.forEach((s,i)=>{s.rotation.x+=dt*1.2;s.rotation.y+=dt*.8;s.position.y+=Math.sin(t*1.7+s.userData.phase)*dt*.08});v.light.intensity=1.8+Math.sin(t*2)*.45;}
  for(const e of c.enemies)if(e.userData.v5rune){e.userData.v5rune.rotation.y+=dt*.8;e.userData.v5rune.material.emissiveIntensity=2.4+Math.sin(t*3)*1.2;}
  for(let i=runtime.chestTweens.length-1;i>=0;i--){const a=runtime.chestTweens[i];a.t+=dt;const p=clamp(a.t/.55,0,1);a.g.userData.lidPivot.rotation.x=-p*1.1;if(p>=1)runtime.chestTweens.splice(i,1);}
  for(let i=runtime.fx.length-1;i>=0;i--){const f=runtime.fx[i];f.t+=dt;const p=clamp(f.t/f.d,0,1);if(f.type==='particle'){f.o.position.addScaledVector(f.o.userData.v,dt);f.o.userData.v.y-=dt*1.7;f.o.scale.setScalar(1-p);f.o.material.opacity=1-p;f.o.material.transparent=true}else if(f.type==='ring'){f.o.scale.setScalar(1+p*6);f.o.material.opacity=1-p}else if(f.type==='glow'){f.o.scale.multiplyScalar(1+dt*4);f.o.material.opacity=1-p}if(p>=1){f.o.parent?.remove(f.o);f.o.material?.map?.dispose?.();f.o.material?.dispose?.();f.o.geometry?.dispose?.();runtime.fx.splice(i,1)}}
  if(c.S.wins!==runtime.lastWins){runtime.lastWins=c.S.wins;const p=c.player.position.clone().add(new c.THREE.Vector3(0,1,0));burst(c,p,0xf6dd8a,30);}
}

async function main(){
  const ui=injectPolishCss();
  const core=await bootCore();runtime.core=core;
  window.__ASTRAL.openChest=openChest;window.__ASTRAL.impact=impact;window.__ASTRAL.cameraOverride=cameraOverride;
  applySurfaceDetail(core);dressField(core);addVillageProps(core);enhanceShrine(core);decorateHero(core);addTreasure(core);observeBattleUi(core,ui);runtime.audio=new AudioDirector(core,ui.sound);
  let last=performance.now();function loop(now){const dt=Math.min((now-last)/1000,.033);last=now;updateDecorations(dt,now/1000);requestAnimationFrame(loop)}requestAnimationFrame(loop);
}

main().catch(err=>{console.error(err);const fatal=document.querySelector('#fatal');document.querySelector('#loading')?.remove();if(fatal){fatal.classList.remove('hidden');fatal.querySelector('b').textContent='品質レイヤーの初期化に失敗しました';fatal.querySelector('p').textContent='再読み込みしても直らない場合は、game-v5.js のコンソールエラーを確認してください。';}});
