import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const gameEl = $('#game');
const loading = $('#loading');
const startScreen = $('#startScreen');

let renderer, scene, camera, clock, player, sun, hemi, keyLight, audioCtx;
const world = new THREE.Group();
const parts = {}, npcs = [], enemies = [], interactables = [], colliders = [], effects = [], particles = [];
const keys = {}, joy = new THREE.Vector2(), move = new THREE.Vector2(), camTarget = new THREE.Vector3(), tmp = new THREE.Vector3();

const C = {
  grass: 0x6f9a65, dirt: 0x9d8059, wood: 0x6a4935, roof: 0x355660,
  gold: 0xe7c77d, cyan: 0x77d9da, water: 0x4c99a8, stone: 0x778181,
  skin: 0xe8b995, cape: 0x334f68
};

const S = {
  mode: 'field', hp: 140, maxHp: 140, mp: 60, maxMp: 60, items: 3,
  quest: 0, wins: 0, boss: false, can: true, guard: false, time: .2,
  enemy: null, enemyObj: null, moveT: 0, area: 'ミレア草原', bossSpawned: false
};

const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
const rand = (a,b) => a + Math.random() * (b-a);
const groundY = (x,z) => (Math.sin(x*.105)+Math.cos(z*.12))*.34 + Math.sin((x+z)*.06)*.42 + Math.max(0,(Math.abs(x)-52)*.035);
const mat = (color, roughness=.85, metalness=0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
function mesh(g,m,shadow=true){ const x = new THREE.Mesh(g,m); x.castShadow=shadow; x.receiveShadow=shadow; return x; }

function tone(f=440,d=.12,type='sine',v=.03){
  if(!audioCtx) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(v,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+d);
  o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+d);
}

function init(){
  try{
    renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setSize(innerWidth,innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth<700?1.3:1.8));
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
    gameEl.appendChild(renderer.domElement);
    scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0xb8c6b5,.0095);
    camera = new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,350);
    clock = new THREE.Clock();
    lights(); sky(); terrain(); hero(); actors(); bind(); updateUI(); updateQuest(); loop();
    setTimeout(()=>loading.style.opacity=0,200); setTimeout(()=>loading.remove(),750);
  }catch(e){ console.error(e); loading?.remove(); $('#fatal').classList.remove('hidden'); }
}

function lights(){
  hemi = new THREE.HemisphereLight(0xbfe7ef,0x24352c,1.65); scene.add(hemi);
  keyLight = new THREE.DirectionalLight(0xffe2bd,3); keyLight.position.set(-18,30,14); keyLight.castShadow=true;
  keyLight.shadow.mapSize.set(2048,2048); Object.assign(keyLight.shadow.camera,{left:-45,right:45,top:45,bottom:-45}); keyLight.shadow.camera.updateProjectionMatrix(); scene.add(keyLight);
  sun = mesh(new THREE.SphereGeometry(2,20,16),new THREE.MeshBasicMaterial({color:0xffddb0}),false); sun.position.set(-50,34,-95); scene.add(sun);
}

function sky(){
  const g=new THREE.SphereGeometry(220,32,20);
  const m=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{top:{value:new THREE.Color(0x618d9b)},bottom:{value:new THREE.Color(0xe4c9a0)},offset:{value:12}},
    vertexShader:'varying vec3 v;void main(){v=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 top;uniform vec3 bottom;uniform float offset;varying vec3 v;void main(){float h=max(normalize(v+vec3(0.,offset,0.)).y,0.);gl_FragColor=vec4(mix(bottom,top,pow(h,.85)),1.);}'});
  scene.userData.sky=mesh(g,m,false); scene.add(scene.userData.sky);
  const cm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.5});
  for(let i=0;i<14;i++){ const c=new THREE.Group(); for(let j=0;j<4;j++){ const p=mesh(new THREE.SphereGeometry(rand(2.3,5.4),9,7),cm,false); p.scale.y=.42; p.position.set(j*rand(2,4),rand(-.4,.8),rand(-1,1)); c.add(p); } c.position.set(rand(-90,90),rand(27,43),rand(-110,-52)); scene.add(c); }
  const sg=new THREE.BufferGeometry(), arr=[]; for(let i=0;i<220;i++){ const r=150, a=Math.random()*Math.PI*2, y=rand(18,100); arr.push(Math.cos(a)*r, y, Math.sin(a)*r); }
  sg.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
  scene.userData.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xdcefff,size:.38,transparent:true,opacity:0})); scene.add(scene.userData.stars);
}

function terrain(){
  scene.add(world);
  const g=new THREE.PlaneGeometry(180,180,80,80); g.rotateX(-Math.PI/2); const a=g.attributes.position;
  for(let i=0;i<a.count;i++){ const x=a.getX(i),z=a.getZ(i); a.setY(i,groundY(x,z)); }
  g.computeVertexNormals(); world.add(mesh(g,mat(C.grass,1)));
  path(); guides(); lake(); village(); ruins(); mountains(); nature(); landmark(); objectiveBeacon();
}

function path(){
  const pts=[[-4,8],[2,2],[6,-5],[12,-14],[18,-22],[24,-31],[31,-36]];
  for(let i=0;i<pts.length-1;i++){
    const [x,z]=pts[i],[x2,z2]=pts[i+1],dx=x2-x,dz=z2-z,len=Math.hypot(dx,dz);
    const p=mesh(new THREE.PlaneGeometry(5,len),mat(C.dirt,1)); p.rotation.x=-Math.PI/2; p.rotation.z=-Math.atan2(dz,dx)+Math.PI/2; p.position.set((x+x2)/2,groundY((x+x2)/2,(z+z2)/2)+.055,(z+z2)/2); world.add(p);
  }
}

function guides(){
  for(const [x,z] of [[1,1],[5,-5],[10,-12],[15,-19],[20,-25],[25,-31],[29,-36]]){
    const g=new THREE.Group(), s=mesh(new THREE.CylinderGeometry(.18,.28,.75,7),mat(0x64716d));
    const f=mesh(new THREE.OctahedronGeometry(.18,0),new THREE.MeshStandardMaterial({color:C.cyan,emissive:0x2bcbd4,emissiveIntensity:3}),false);
    s.position.y=.38; f.position.y=1.05; g.add(s,f); g.position.set(x,0,z); g.userData.flame=f; world.add(g);
  }
}

function lake(){
  const l=mesh(new THREE.CircleGeometry(18,64),new THREE.MeshPhysicalMaterial({color:C.water,roughness:.15,transparent:true,opacity:.72,clearcoat:1}),false);
  l.rotation.x=-Math.PI/2; l.scale.y=.72; l.position.set(-28,.18,-18); world.add(l); scene.userData.lake=l;
  for(let i=0;i<22;i++){ const r=mesh(new THREE.DodecahedronGeometry(rand(.25,.75),0),mat(0x6d7772)); const a=Math.random()*Math.PI*2,d=rand(12,19); r.position.set(-28+Math.cos(a)*d,.2,-18+Math.sin(a)*d*.72); r.scale.y=.6; world.add(r); }
}

function house(x,z,s=1,r=0){
  const g=new THREE.Group(), b=mesh(new THREE.BoxGeometry(5,3.4,4),mat(0xd5c4a5)), roof=mesh(new THREE.ConeGeometry(4.2,2.4,4),mat(C.roof));
  b.position.y=1.7; roof.position.y=4.45; roof.rotation.y=Math.PI/4; roof.scale.z=.82; g.add(b,roof);
  const d=mesh(new THREE.BoxGeometry(1.2,2,.22),mat(C.wood)); d.position.set(0,1,2.1); g.add(d);
  for(const sx of [-1.4,1.4]){ const w=mesh(new THREE.BoxGeometry(.8,.75,.15),new THREE.MeshStandardMaterial({color:0x9dd9d2,emissive:0x4f938f,emissiveIntensity:.8})); w.position.set(sx,2.1,2.14); g.add(w); }
  g.position.set(x,groundY(x,z),z); g.scale.setScalar(s); g.rotation.y=r; world.add(g); colliders.push({x,z,r:3*s});
}

function lantern(x,z){
  const g=new THREE.Group(), p=mesh(new THREE.CylinderGeometry(.05,.08,2.6,8),mat(C.wood)), l=mesh(new THREE.SphereGeometry(.18,10,8),new THREE.MeshStandardMaterial({color:0xffd89d,emissive:0xffad55,emissiveIntensity:2}));
  p.position.y=1.3; l.position.y=2.4; g.add(p,l); g.position.set(x,groundY(x,z),z); world.add(g);
}

function village(){
  house(-8,13,1.08,-.2); house(-15,7,.9,.25); house(1,17,.82,-.45); house(-7,22,1.35,.15);
  for(let i=0;i<6;i++) lantern(-12+i*3.8,11+Math.sin(i)*2);
  const w=new THREE.Group(), ring=mesh(new THREE.CylinderGeometry(1.3,1.45,1,18,1,true),mat(C.stone)); ring.position.y=.5; w.add(ring); w.position.set(-3,0,9); world.add(w);
  const cloth=mesh(new THREE.PlaneGeometry(3.4,1.8),new THREE.MeshStandardMaterial({color:0xa65d45,side:THREE.DoubleSide})); cloth.position.set(-12,2.6,15); cloth.rotation.y=.4; world.add(cloth);
}

function ruins(){
  const c=new THREE.Group();
  for(let i=0;i<7;i++){ const a=i/7*Math.PI*2,p=mesh(new THREE.CylinderGeometry(.42,.55,rand(3.5,6),8),mat(0x7b8078)); p.position.set(Math.cos(a)*5,rand(1.8,3),Math.sin(a)*5); c.add(p); }
  const al=mesh(new THREE.CylinderGeometry(2.3,2.8,.8,8),mat(0x6d7f7a)), cr=mesh(new THREE.OctahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:C.cyan,emissive:0x50d4db,emissiveIntensity:1.8}));
  al.position.y=.4; cr.position.y=2; c.add(al,cr); c.userData.crystal=cr; c.position.set(32,groundY(32,-39),-39); world.add(c); scene.userData.shrine=c;
  interactables.push({type:'shrine',obj:c,r:5,text:'祠を調べる'});
  const arch=mesh(new THREE.TorusGeometry(5.7,.65,10,26,Math.PI),mat(0x7b8078)); arch.rotation.z=Math.PI; arch.position.set(32,groundY(32,-44)+5.4,-44); world.add(arch);
}

function mountains(){
  for(let i=0;i<18;i++){ const m=mesh(new THREE.ConeGeometry(rand(8,17),rand(18,42),rand(5,7)),mat(i%2?0x536865:0x61736c),false),a=i/18*Math.PI*2,d=rand(68,92); m.position.set(Math.cos(a)*d,rand(7,11),Math.sin(a)*d); world.add(m); }
}

function tree(x,z,s=1){
  const g=new THREE.Group(),t=mesh(new THREE.CylinderGeometry(.18,.3,2.8,7),mat(0x634936)); t.position.y=1.4; g.add(t);
  for(let i=0;i<3;i++){ const c=mesh(new THREE.IcosahedronGeometry(1.35-i*.08,1),mat(0x426f56,1)); c.position.set(rand(-.3,.3),3+i*.8,rand(-.3,.3)); c.scale.set(1.25,.95,1.1); g.add(c); }
  g.position.set(x,groundY(x,z),z); g.scale.setScalar(s); world.add(g);
}

function nature(){
  for(let i=0;i<80;i++){ let x=rand(-62,62),z=rand(-62,62); if((x>-22&&x<9&&z>3&&z<29)||(x>20&&z<-27)||Math.hypot(x+28,z+18)<20){i--;continue} tree(x,z,rand(.65,1.25)); }
  for(let i=0;i<130;i++){ const f=mesh(new THREE.SphereGeometry(rand(.04,.09),5,4),mat(Math.random()>.5?0xf0d2a2:0xd9b6cf),false); f.position.set(rand(-50,50),.12,rand(-50,50)); world.add(f); }
  for(let i=0;i<12;i++){
    const b=new THREE.Group(),w1=mesh(new THREE.PlaneGeometry(.18,.08),new THREE.MeshBasicMaterial({color:0xdbeee4,side:THREE.DoubleSide}),false),w2=w1.clone();
    w1.rotation.y=.45; w2.rotation.y=-.45; b.add(w1,w2); b.position.set(rand(-35,25),rand(1.2,2.8),rand(-28,18)); b.userData.butterfly=rand(0,10); world.add(b);
  }
}

function landmark(){
  const g=new THREE.Group(),b=mesh(new THREE.CylinderGeometry(2.5,4.1,17,8),mat(0x596d72)),r=mesh(new THREE.TorusGeometry(4,.25,10,30),new THREE.MeshStandardMaterial({color:C.gold,metalness:.6,roughness:.3})),o=mesh(new THREE.SphereGeometry(1.2,16,12),new THREE.MeshStandardMaterial({color:0x8ad8de,emissive:0x4bbbc5,emissiveIntensity:1.3}));
  b.position.y=8.5; r.position.y=15; r.rotation.x=Math.PI/2; o.position.y=18; g.add(b,r,o); g.position.set(56,groundY(56,-67)+2,-67); world.add(g);
}

function objectiveBeacon(){
  const g=new THREE.Group();
  const ring=mesh(new THREE.TorusGeometry(1.4,.04,8,40),new THREE.MeshBasicMaterial({color:C.cyan,transparent:true,opacity:.8}),false); ring.rotation.x=Math.PI/2;
  const beam=mesh(new THREE.CylinderGeometry(.05,.35,9,12,1,true),new THREE.MeshBasicMaterial({color:C.cyan,transparent:true,opacity:.11,side:THREE.DoubleSide}),false); beam.position.y=4.5;
  g.add(ring,beam); g.position.set(32,groundY(32,-39)+.3,-39); g.visible=false; g.userData.ring=ring; world.add(g); scene.userData.beacon=g;
}

function hero(){
  player=new THREE.Group();
  const body=mesh(new THREE.CapsuleGeometry(.42,1.15,6,10),mat(0x243f55)), head=mesh(new THREE.SphereGeometry(.42,16,12),mat(C.skin)), cape=mesh(new THREE.PlaneGeometry(.95,1.45,1,4),new THREE.MeshStandardMaterial({color:C.cape,side:THREE.DoubleSide}));
  body.position.y=1.55; head.position.y=2.65; cape.position.set(0,1.65,-.38); cape.rotation.x=.1; player.add(body,head,cape); parts.body=body; parts.cape=cape;
  const hair=mat(0x292324); for(let i=0;i<5;i++){ const h=mesh(new THREE.ConeGeometry(.18,.7,5),hair); h.position.set((i-2)*.13,2.98,0); h.rotation.z=(i-2)*.18; player.add(h); }
  for(const sx of [-1,1]){ const arm=mesh(new THREE.CapsuleGeometry(.12,.65,4,7),mat(C.skin)); arm.position.set(sx*.55,1.6,0); player.add(arm); parts[sx<0?'armL':'armR']=arm; const leg=mesh(new THREE.CapsuleGeometry(.14,.75,4,7),mat(0x3a302d)); leg.position.set(sx*.22,.6,0); player.add(leg); parts[sx<0?'legL':'legR']=leg; }
  const sword=new THREE.Group(),blade=mesh(new THREE.BoxGeometry(.12,1.75,.05),new THREE.MeshStandardMaterial({color:0xdde8e8,metalness:.85,roughness:.2})),guard=mesh(new THREE.BoxGeometry(.55,.09,.12),new THREE.MeshStandardMaterial({color:C.gold,metalness:.7,roughness:.3}));
  blade.position.y=.8; sword.add(blade,guard); sword.position.set(.63,1,-.05); sword.rotation.z=-.4; player.add(sword); parts.sword=sword;
  player.position.set(0,groundY(0,4)+.25,4); world.add(player);
}

function npc(x,z,name,color){
  const g=new THREE.Group(),b=mesh(new THREE.CapsuleGeometry(.38,1.1,6,9),mat(color)),h=mesh(new THREE.SphereGeometry(.38,14,10),mat(C.skin)); b.position.y=1.45;h.position.y=2.47;g.add(b,h);g.position.set(x,groundY(x,z)+.25,z);g.userData.name=name;world.add(g);npcs.push(g);interactables.push({type:'npc',obj:g,r:2.2,text:'話す',name});
}

function enemy(x,z,boss=false){
  const g=new THREE.Group(), body=mesh(new THREE.IcosahedronGeometry(boss?1.05:.72,1),mat(boss?0x4f343b:0x65745a)),head=mesh(new THREE.IcosahedronGeometry(boss?.72:.48,1),mat(boss?0x6f4750:0x73846a));
  body.scale.set(boss?1.35:1.1,boss?.85:.72,boss?1.55:1.35); body.position.y=boss?1.2:.9; head.position.set(0,boss?1.8:1.3,boss?1.15:.8); g.add(body,head);
  for(const sx of [-1,1]){ const horn=mesh(new THREE.ConeGeometry(boss?.17:.11,boss?1.4:.7,7),mat(0x9a8b74)); horn.position.set(sx*(boss?.38:.27),boss?2.3:1.66,boss?1.2:.9); horn.rotation.z=sx*.35; g.add(horn); const e=mesh(new THREE.SphereGeometry(boss?.08:.055,7,6),new THREE.MeshStandardMaterial({color:0xffdc8a,emissive:0xff5e37,emissiveIntensity:boss?3:2}),false); e.position.set(sx*(boss?.26:.18),boss?1.9:1.38,boss?1.7:1.25); g.add(e); }
  let aura=null; if(boss){ const ring=mesh(new THREE.TorusGeometry(1.7,.07,8,32),new THREE.MeshBasicMaterial({color:0xa55f68,transparent:true,opacity:.7}),false); ring.rotation.x=Math.PI/2; ring.position.y=.35; g.add(ring); aura=ring; }
  const gy=groundY(x,z)+.15; g.position.set(x,gy,z); g.userData={boss,hp:boss?300:95,maxHp:boss?300:95,name:boss?'星喰らいのオルグ':'灰角のヴァルグ',home:new THREE.Vector3(x,gy,z),phase:Math.random()*10,aura}; world.add(g); enemies.push(g); return g;
}

function actors(){ npc(-4,8,'リナ',0x6e455e); npc(-12,17,'旅商人ノエ',0x5c7057); npc(0,15,'村長ガレフ',0x7a6046); enemy(9,-8); enemy(18,-18); enemy(26,-29); }

function bind(){
  addEventListener('keydown',e=>{ keys[e.code]=1; if((e.code==='KeyE'||e.code==='Space')&&S.mode==='field')interact(); if(S.mode==='battle'&&/^Digit[1-4]$/.test(e.code))document.querySelectorAll('.commands button')[+e.code.slice(-1)-1]?.click(); });
  addEventListener('keyup',e=>keys[e.code]=0); addEventListener('resize',resize);
  $('#startBtn').onclick=start; $('#dialogueNext').onclick=nextDialogue; document.querySelectorAll('.commands button').forEach(b=>b.onclick=()=>command(b.dataset.command));
  $('#actionBtn').onpointerdown=interact; $('#runBtn').onpointerdown=()=>keys.ShiftLeft=1; $('#runBtn').onpointerup=()=>keys.ShiftLeft=0;
  const j=$('#joystick'),st=$('#stick'); let id=null;
  const jm=e=>{ if(e.pointerId!==id)return; const r=j.getBoundingClientRect(); let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y); if(l>42){x=x/l*42;y=y/l*42} st.style.transform=`translate(${x}px,${y}px)`; joy.set(x/42,-y/42); };
  j.onpointerdown=e=>{id=e.pointerId;j.setPointerCapture(id);jm(e)}; j.onpointermove=jm; j.onpointerup=j.onpointercancel=e=>{if(e.pointerId===id){id=null;joy.set(0,0);st.style.transform=''}};
}

function setTouch(show){ $('#touchControls').style.display=show?'':'none'; }

function start(){
  try{audioCtx=new (AudioContext||webkitAudioContext)()}catch{}
  startScreen.style.transition='opacity .8s'; startScreen.style.opacity=0; setTimeout(()=>startScreen.remove(),850); setTimeout(showArea,500);
  setTimeout(()=>dialogue('リナ',['……起きた？　よかった。流星が落ちてから、森の獣たちが妙に荒れてる。','東の〈薄明の祠〉なら、星の欠片の正体が分かるかもしれない。青い灯を追って。','剣は忘れないで。今日は、たぶん静かな朝じゃ終わらない。']),1300);
}

function dialogue(name,lines,done){ S.mode='dialogue'; S.dialogue={name,lines,i:0,done}; $('#speaker').textContent=name; $('#dialogueText').textContent=lines[0]; $('#dialogue').classList.remove('hidden'); $('#interaction').classList.add('hidden'); setTouch(false); tone(520,.05,'sine',.02); }
function nextDialogue(){ const d=S.dialogue;if(!d)return;if(++d.i>=d.lines.length){$('#dialogue').classList.add('hidden');S.dialogue=null;S.mode='field';setTouch(true);d.done?.();return}$('#dialogueText').textContent=d.lines[d.i];tone(580,.04,'sine',.015); }
function nearest(){ let best=null,bd=99;for(const i of interactables){const d=player.position.distanceTo(i.obj.position);if(d<i.r&&d<bd){best=i;bd=d}}return best; }
function interact(){ if(S.mode!=='field'||!S.can)return;const i=nearest();if(i){if(i.type==='npc')talk(i);else shrine();return}const e=enemies.find(e=>e.visible&&player.position.distanceTo(e.position)<3);if(e)battle(e); }

function talk(i){
  let l=i.name==='リナ'?['祠は東よ。青い灯を追えば迷わない。','帰ってきたら、ちゃんと話の続きを聞かせて。']:i.name==='旅商人ノエ'?['旅の道具は軽い方がいい。でも、命まで軽く扱っちゃいけない。','薬草雫をひとつ分けておくよ。']:['昨夜、祠の方角から地鳴りがした。','星は道を示すが、歩くのは人の足じゃ。'];
  if(i.name==='旅商人ノエ'&&!i.gave){i.gave=1;S.items++;updateUI();toast('薬草雫を 1 個もらった',1800)} dialogue(i.name,l);
}

function shrine(){
  if(S.wins<2) return toast(`祭壇の光が弱い。魔獣をあと ${2-S.wins} 体退けよう。`);
  if(S.boss) return dialogue('？？？',['祭壇の星光は静かに脈打っている。遠い空で、新しい星がひとつ瞬いた。']);
  if(S.bossSpawned) return;
  S.bossSpawned=true; S.quest=3; updateQuest(); S.can=false; $('#letterbox').classList.add('active'); camera.userData.cine=1; scene.userData.beacon.visible=false;
  const b=enemy(32,-48,true); b.visible=false;
  setTimeout(()=>{b.visible=true;b.scale.setScalar(.12);effects.push({type:'grow',o:b,t:0,d:1.25});flash(.6);tone(90,.2,'square',.05)},700);
  setTimeout(()=>$('#bossBanner').classList.remove('hidden'),1000);
  setTimeout(()=>{$('#bossBanner').classList.add('hidden');$('#letterbox').classList.remove('active');camera.userData.cine=0;S.can=true;battle(b)},4550);
}

function battle(e){
  if(S.mode!=='field')return;
  S.mode='transition'; S.can=false; S.enemyObj=e; S.enemy={...e.userData}; e.userData.field=e.position.clone(); $('#letterbox').classList.add('active'); flash(.25); setTouch(false);
  setTimeout(()=>{ S.mode='battle';S.can=true;e.position.set(player.position.x+3.5,groundY(player.position.x+3.5,player.position.z-4.6)+.15,player.position.z-4.6);e.rotation.y=Math.PI;$('#enemyName').textContent=S.enemy.name;$('#battleHud').classList.remove('hidden');updateBattle();log(S.enemy.boss?'古代種が星光を喰らっている！':'魔獣がこちらを睨んでいる！');setTimeout(()=>$('#letterbox').classList.remove('active'),350); },550);
}

function command(c){
  if(S.mode!=='battle'||!S.can)return; S.can=false; document.querySelectorAll('.commands button').forEach(b=>b.disabled=true);
  if(c==='item'){
    if(!S.items){log('薬草雫を持っていない。');return unlock()}
    S.items--; const heal=58; S.hp=Math.min(S.maxHp,S.hp+heal);updateUI();log(`薬草雫！ HPが ${heal} 回復した。`);tone(720,.3);return setTimeout(enemyTurn,800);
  }
  if(c==='guard'){S.guard=true;log('アレンは剣を構えた。次の一撃を受け流す。');return setTimeout(enemyTurn,700)}
  if(c==='skill'&&S.mp<8){log('MPが足りない！');return unlock()}
  const skill=c==='skill'; if(skill){S.mp-=8;updateUI();log('星断ち！')}else log('アレンの攻撃！');
  const from=player.position.clone(),to=S.enemyObj.position.clone().add(new THREE.Vector3(0,0,2));
  effects.push({type:'lunge',o:player,from,to,t:0,d:skill?.58:.4,skill,hit:false,cb:()=>{const crit=!skill&&Math.random()<.12;const n=Math.round(skill?rand(66,82):rand(30,40))*(crit?1.7:1);damage(Math.round(n),crit);setTimeout(()=>S.enemy.hp>0?enemyTurn():win(),650)}});
}

function damage(n,crit=false){ S.enemy.hp=Math.max(0,S.enemy.hp-n);spawnDamage(S.enemyObj.position,n);flash(crit?.28:.15);camera.userData.shake=crit?.28:.18;tone(crit?150:100,.08,'square',.05);if(crit)log('会心の一撃！',650);updateBattle(); }

function enemyTurn(){
  if(S.enemy.hp<=0)return;
  const heavy=S.enemy.boss&&Math.random()>.58;
  if(heavy){ log('オルグの角に赤い星光が集まる――！',950); S.enemyObj.userData.aura&&(S.enemyObj.userData.aura.material.opacity=1); }
  else log(`${S.enemy.name}の攻撃！`,600);
  setTimeout(()=>{
    const base=heavy?rand(38,48):S.enemy.boss?rand(21,30):rand(16,23), n=Math.round(base*(S.guard?.34:1));
    S.guard=false; S.hp=Math.max(0,S.hp-n); updateUI(); spawnDamage(player.position,n,true); camera.userData.shake=heavy?.38:.26; flash(heavy?.18:.09); tone(85,.1,'square',.05);
    if(S.enemyObj.userData.aura)S.enemyObj.userData.aura.material.opacity=.7;
    log(heavy?`星喰らいの衝撃波！ ${n} ダメージ`:`${n} のダメージ！`);
    setTimeout(()=>S.hp<=0?gameover():unlock(),700);
  },heavy?1050:620);
}

function unlock(){ S.can=true;document.querySelectorAll('.commands button').forEach(b=>b.disabled=false); }

function win(){
  log(`${S.enemy.name}を倒した！`,1100); effects.push({type:'vanish',o:S.enemyObj,t:0,d:1}); tone(523,.18);setTimeout(()=>tone(659,.18),160);setTimeout(()=>tone(784,.35),320);
  if(S.enemy.boss){S.boss=true;S.quest=4;updateQuest();setTimeout(()=>endBattle(true),1350)}
  else{
    S.wins++; const hpGain=28,mpGain=10; S.hp=Math.min(S.maxHp,S.hp+hpGain);S.mp=Math.min(S.maxMp,S.mp+mpGain); updateUI();
    if(S.wins===1)S.quest=1;
    if(S.wins>=2){S.quest=2;scene.userData.beacon.visible=true;toast('祠の星光が目覚めた。青い光柱を目指そう。',2400)}
    else toast(`星の余韻で HP +${hpGain} / MP +${mpGain}`,1700);
    updateQuest(); setTimeout(()=>endBattle(false),1200);
  }
}

function endBattle(boss){
  S.mode='transition'; $('#letterbox').classList.add('active'); const o=S.enemyObj;
  if(o?.visible&&!boss&&o.userData.field)o.position.copy(o.userData.field);
  setTimeout(()=>{ $('#battleHud').classList.add('hidden');$('#letterbox').classList.remove('active');S.mode='field';S.can=true;S.enemy=S.enemyObj=null;setTouch(true); if(boss){S.time=.78;dialogue('リナ（遠くから）',['……空が、明るくなってる。','帰ってきて。今度こそ、朝の続きを話そう。'],()=>toast('VERTICAL SLICE CLEAR — 世界はこの先へ続く',5000))}},650);
}

function gameover(){
  log('力尽きた……星光が時間を巻き戻す。',1600);
  setTimeout(()=>{S.hp=S.maxHp;S.mp=S.maxMp;player.position.set(1,groundY(1,1)+.25,1);updateUI();if(S.enemyObj?.userData.field){S.enemyObj.position.copy(S.enemyObj.userData.field);S.enemyObj.visible=true}endBattle(false);toast('星の加護で村の入口へ戻った',2300)},1750);
}

function updateBattle(){ $('#enemyHpBar').style.width=`${S.enemy.hp/S.enemy.maxHp*100}%`;updateUI(); }
function updateUI(){ $('#hpText').textContent=`${S.hp} / ${S.maxHp}`;$('#mpText').textContent=`${S.mp} / ${S.maxMp}`;$('#hpBar').style.width=`${S.hp/S.maxHp*100}%`;$('#mpBar').style.width=`${S.mp/S.maxMp*100}%`;$('#battleStats').textContent=`HP ${S.hp}　MP ${S.mp}`;$('#itemCount').textContent=`${S.items} 個`; }
function updateQuest(){ const q=[['薄明の祠へ向かう','村の東、青い灯が揺れる古道を進む'],['灰角のヴァルグを退ける','祠へ続く古道を塞ぐ魔獣をもう一体倒す'],['薄明の祠を調べる','青い光柱の下、星明かりを帯びた祭壇へ'],['星喰らいのオルグを倒す','赤い予備動作には「まもる」が有効'],['夜明けを見届ける','祠の高台で新しい朝を迎える']][S.quest];$('#questTitle').textContent=q[0];$('#questDetail').textContent=q[1]; }
function toast(t,ms=1600){ const e=$('#toast');e.textContent=t;e.classList.remove('hidden');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.add('hidden'),ms); }
function log(t,ms=900){ const e=$('#battleLog');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),ms); }
function flash(v){ const f=$('#flash');f.style.transition='none';f.style.opacity=v;requestAnimationFrame(()=>{f.style.transition='opacity .28s';f.style.opacity=0}); }

function spawnDamage(pos,n,red=false){
  const d=document.createElement('div');d.textContent=`-${n}`;Object.assign(d.style,{position:'fixed',zIndex:50,color:red?'#ffd1c6':'#fff3b5',font:'800 26px serif',textShadow:'0 3px 10px #000',pointerEvents:'none',transition:'transform .7s,opacity .7s'});document.body.appendChild(d);
  const p=pos.clone().add(new THREE.Vector3(0,2,0)).project(camera);d.style.left=`${(p.x*.5+.5)*innerWidth}px`;d.style.top=`${(-p.y*.5+.5)*innerHeight}px`;requestAnimationFrame(()=>{d.style.transform='translateY(-55px) scale(1.25)';d.style.opacity=0});setTimeout(()=>d.remove(),750);
}

function particle(pos,c){ const p=mesh(new THREE.OctahedronGeometry(rand(.035,.1),0),new THREE.MeshBasicMaterial({color:c}),false);p.position.copy(pos);p.userData.v=new THREE.Vector3(rand(-1,1),rand(.2,1.8),rand(-1,1)).normalize().multiplyScalar(rand(.6,1.6));p.userData.life=rand(.4,.8);world.add(p);particles.push(p); }
function showArea(){ const e=$('#areaTitle');e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2400); }

function field(dt){
  if(S.mode!=='field'||!S.can)return;
  move.set((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)).add(joy);if(move.length()>1)move.normalize();
  const moving=move.lengthSq()>.01,run=keys.ShiftLeft||keys.ShiftRight;
  if(moving){const ang=Math.atan2(move.x,-move.y);player.rotation.y=THREE.MathUtils.damp(player.rotation.y,ang,13,dt);tmp.set(move.x,0,-move.y).multiplyScalar((run?8.6:5.2)*dt);const n=player.position.clone().add(tmp);if(canMove(n)){player.position.copy(n);player.position.y=groundY(player.position.x,player.position.z)+.25}S.moveT+=dt*(run?13:9)}else S.moveT+=dt*2;
  const sw=moving?Math.sin(S.moveT)*.45:0;parts.body.position.y=1.55+(moving?Math.sin(S.moveT)*.06:0);parts.cape.rotation.x=.12+(moving?.14:.03);parts.armL.rotation.x=sw;parts.armR.rotation.x=-sw;parts.legL.rotation.x=-sw;parts.legR.rotation.x=sw;
  const i=nearest(),e=enemies.find(x=>x.visible&&player.position.distanceTo(x.position)<3);if(i||e){$('#interactionText').textContent=i?.text||'戦う';$('#interaction').classList.remove('hidden')}else $('#interaction').classList.add('hidden');
  for(const x of enemies)if(x.visible&&!x.userData.boss&&player.position.distanceTo(x.position)<1.55)return battle(x);
  for(const n of npcs){const d=player.position.distanceTo(n.position);if(d<4){const v=player.position.clone().sub(n.position);n.rotation.y=THREE.MathUtils.damp(n.rotation.y,Math.atan2(v.x,v.z),5,dt)}}
  const old=S.area;if(player.position.x>18&&player.position.z<-22)S.area='薄明の古道';else S.area='ミレア草原';if(old!==S.area){$('#areaName').textContent=S.area;showArea()}
}

function canMove(p){ for(const c of colliders)if(Math.hypot(p.x-c.x,p.z-c.z)<c.r)return false;if(Math.hypot(p.x+28,(p.z+18)/.72)<15)return false;return Math.abs(p.x)<74&&Math.abs(p.z)<74; }

function AI(dt,t){
  if(S.mode!=='field')return;
  for(const e of enemies){if(!e.visible||e.userData.boss)continue;const ph=e.userData.phase+t*.55,target=e.userData.home.clone().add(new THREE.Vector3(Math.sin(ph)*2.2,0,Math.cos(ph*.8)*2.2)),d=target.sub(e.position);if(d.length()>.3){d.normalize();e.position.addScaledVector(d,dt*.55);e.rotation.y=Math.atan2(d.x,d.z)}e.position.y=groundY(e.position.x,e.position.z)+.15+Math.sin(t*3+e.userData.phase)*.04}
}

function fx(dt){
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];e.t+=dt;const p=clamp(e.t/e.d,0,1);
    if(e.type==='lunge'){const q=p<.48?p/.48:(1-p)/.52;e.o.position.copy(e.from).lerp(e.to,Math.sin(q*Math.PI/2));e.o.rotation.z=Math.sin(p*Math.PI)*-.18;if(e.skill){parts.sword.rotation.x=-p*Math.PI*1.3;particle(e.o.position.clone().add(new THREE.Vector3(rand(-.4,.4),rand(.7,2),rand(-.4,.4))),C.cyan)}if(p>.48&&!e.hit){e.hit=true;e.cb()}}
    if(e.type==='vanish'){e.o.rotation.y+=dt*7;e.o.scale.setScalar(Math.max(.01,1-p));particle(e.o.position.clone().add(new THREE.Vector3(rand(-.5,.5),rand(.3,1.5),rand(-.5,.5))),C.gold);if(p>=1)e.o.visible=false}
    if(e.type==='grow')e.o.scale.setScalar(THREE.MathUtils.smootherstep(p,0,1)*1.55);
    if(p>=1){if(e.type==='lunge'){e.o.position.copy(e.from);e.o.rotation.z=0;parts.sword.rotation.x=0}effects.splice(i,1)}
  }
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.userData.v.y-=dt*.8;p.rotation.x+=dt*4;p.scale.setScalar(Math.max(.01,p.userData.life));if(p.userData.life<=0){world.remove(p);particles.splice(i,1)}}
}

function cameraUpdate(dt){
  if(camera.userData.cine){camera.position.lerp(new THREE.Vector3(22,7,-31),dt*1.3);camera.lookAt(32,2,-42);return}
  if(S.mode==='battle'&&S.enemyObj){const e=S.enemyObj,mid=player.position.clone().lerp(e.position,.52),d=e.position.clone().sub(player.position).normalize(),side=new THREE.Vector3(-d.z,0,d.x),p=mid.clone().addScaledVector(side,7.8).add(new THREE.Vector3(0,4.8,0)).addScaledVector(d,-1.2);camera.position.lerp(p,1-Math.exp(-dt*4));camTarget.lerp(mid.clone().add(new THREE.Vector3(0,1.1,0)),1-Math.exp(-dt*6));camera.lookAt(camTarget)}
  else{const f=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y)),p=player.position.clone().add(new THREE.Vector3(0,4.7,0)).addScaledVector(f,-7.6);camera.position.lerp(p,1-Math.exp(-dt*4.6));camTarget.lerp(player.position.clone().add(new THREE.Vector3(0,1.45,0)),1-Math.exp(-dt*7));camera.lookAt(camTarget)}
  if(camera.userData.shake>0){camera.position.x+=rand(-1,1)*camera.userData.shake;camera.position.y+=rand(-1,1)*camera.userData.shake*.5;camera.userData.shake=Math.max(0,camera.userData.shake-dt*2.5)}
}

function ambience(dt,t){
  scene.userData.lake.material.opacity=.69+Math.sin(t*.8)*.035;scene.userData.lake.rotation.z+=dt*.003;
  for(const o of world.children){if(o.userData.flame){o.userData.flame.rotation.y+=dt*1.2;o.userData.flame.position.y=1.05+Math.sin(t*3+o.position.x)*.08}if(o.userData.butterfly!==undefined){o.position.y+=Math.sin(t*3+o.userData.butterfly)*dt*.08;o.rotation.y+=Math.sin(t*1.7+o.userData.butterfly)*dt*.4}}
  const cr=scene.userData.shrine?.userData.crystal;if(cr)cr.rotation.y+=dt*.45;
  const b=scene.userData.beacon;if(b?.visible){b.userData.ring.rotation.z+=dt*.8;b.position.y=.3+Math.sin(t*2)*.08}
  S.time=(S.time+dt*.0017)%1;const a=S.time*Math.PI*2-.4,day=clamp(Math.sin(a)*.7+.45,.08,1);keyLight.intensity=.25+2.75*day;hemi.intensity=.45+1.2*day;sun.position.set(Math.cos(a)*90,Math.sin(a)*70-5,-90);sun.visible=day>.18;
  scene.userData.sky.material.uniforms.top.value.copy(new THREE.Color(0x0c1730)).lerp(new THREE.Color(0x6f9daa),day);scene.userData.sky.material.uniforms.bottom.value.copy(new THREE.Color(0x172438)).lerp(new THREE.Color(0xe5c39b),day);scene.userData.stars.material.opacity=clamp((.42-day)*2.3,0,.8);scene.fog.color.copy(new THREE.Color(0x172438)).lerp(new THREE.Color(0xb8c6b5),day);renderer.toneMappingExposure=.76+.29*day;
}

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.3:1.8));}
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.033),t=clock.elapsedTime;field(dt);AI(dt,t);fx(dt);ambience(dt,t);cameraUpdate(dt);renderer.render(scene,camera);}

(function stars2d(){
  const c=$('#startStars'),x=c.getContext('2d');let ss=[];function r(){c.width=innerWidth*devicePixelRatio;c.height=innerHeight*devicePixelRatio;ss=Array.from({length:140},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.8*devicePixelRatio,a:Math.random()*8}))}r();addEventListener('resize',r);let t=0;(function d(){if(!c.isConnected)return;t+=.01;x.clearRect(0,0,c.width,c.height);for(const s of ss){x.globalAlpha=.2+.8*(Math.sin(t+s.a)*.5+.5);x.fillStyle='#e9f7ef';x.beginPath();x.arc(s.x,s.y,s.r,0,Math.PI*2);x.fill()}requestAnimationFrame(d)})();
})();

init();