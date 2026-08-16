import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base=process.env.ASTRAL_URL||'http://127.0.0.1:4173/apps/astral-dawn/';
const out=path.resolve('apps/astral-dawn/.artifacts');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[],messages=[];let stage='launch';
page.on('pageerror',e=>errors.push(`pageerror: ${e.stack||e.message}`));
page.on('console',m=>{messages.push(`${m.type()}: ${m.text()}`);if(m.type()==='error')errors.push(`console.error: ${m.text()}`)});
page.on('requestfailed',r=>messages.push(`requestfailed: ${r.url()} :: ${r.failure()?.errorText||''}`));
const mark=s=>{stage=s;console.log(`[Astral smoke] ${s}`)};
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const settleFrames=async(count=2)=>page.evaluate(n=>new Promise(resolve=>{const step=()=>--n<=0?resolve():requestAnimationFrame(step);requestAnimationFrame(step)}),count);
const waitCombo=()=>page.waitForFunction(()=>{const b=document.querySelector('.combo-command');return !!b&&!b.disabled&&b.classList.contains('ready');},{timeout:10000});

async function enterNextNormalBattle(){
  await page.evaluate(()=>{const c=window.__ASTRAL_CORE,p=c.player,e=c.enemies.find(x=>x.visible&&!x.userData.boss);if(!e)throw new Error('no normal enemy available');p.position.set(e.position.x,e.position.y,e.position.z);});
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.mode==='battle'&&!window.__ASTRAL_CORE.S.enemyObj?.userData.boss,{timeout:12000});
  await page.waitForSelector('#enemyTrait.show',{timeout:8000});
  await waitCombo();
}
async function useComboAndWaitWins(targetWins){
  const before=await page.evaluate(()=>window.__ASTRAL_CORE.S.mp);
  await page.click('.combo-command');
  await page.waitForFunction(v=>window.__ASTRAL_CORE.S.mp<v,before,{timeout:6000});
  await page.waitForFunction(w=>window.__ASTRAL_CORE.S.wins>=w,targetWins,{timeout:18000});
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.mode==='field'||window.__ASTRAL_CORE.S.mode==='dialogue',{timeout:15000});
  return before-(await page.evaluate(()=>window.__ASTRAL_CORE.S.mp));
}

try{
  mark('navigate');
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  assert(response?.ok(),`page request failed: ${response?.status()}`);
  mark('wait-start');
  await page.waitForSelector('#startBtn',{state:'visible',timeout:45000});
  mark('wait-core');
  await page.waitForFunction(()=>!!window.__ASTRAL_CORE?.renderer,{timeout:45000});
  await page.waitForFunction(()=>!document.querySelector('#loading'),{timeout:15000});
  assert(await page.locator('#fatal').evaluate(e=>e.classList.contains('hidden')),'fatal overlay is visible');
  assert(await page.locator('#game canvas').count()===1,'Three.js canvas missing or duplicated');

  mark('start-game');
  await page.click('#startBtn');
  await page.waitForSelector('#dialogue:not(.hidden)',{timeout:9000});
  mark('finish-intro-dialogue');
  for(let i=0;i<3;i++){await page.click('#dialogueNext');await page.waitForTimeout(120)}
  await page.waitForFunction(()=>document.querySelector('#dialogue')?.classList.contains('hidden'),{timeout:5000});
  await page.waitForFunction(()=>window.__ASTRAL_CORE?.S?.joined===true,{timeout:5000});
  await page.waitForFunction(()=>!!window.__ASTRAL_CORE?.companion,{timeout:5000});
  await page.waitForSelector('.combo-command',{state:'attached',timeout:5000});
  await page.waitForTimeout(250);
  assert(errors.length===0,`errors appeared after party join:\n${errors.join('\n')}`);

  mark('movement');
  const before=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  await page.keyboard.down('KeyW');
  try{
    await page.waitForFunction(start=>{const p=window.__ASTRAL_CORE?.player?.position;return !!p&&Math.hypot(p.x-start.x,p.z-start.z)>.12;},before,{timeout:7000});
  } finally { await page.keyboard.up('KeyW'); }
  await settleFrames(2);
  const after=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  const moved=Math.hypot(after.x-before.x,after.z-before.z);assert(moved>.12,'keyboard movement did not move the hero');
  await page.screenshot({path:path.join(out,'field.png')});

  mark('treasure');
  const chest=await page.evaluate(()=>{const c=window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest');if(!c)return null;return {label:c.label,opened:c.obj.userData.opened,items:window.__ASTRAL_CORE.S.items};});
  assert(chest,'V5 chest instrumentation missing');
  await page.evaluate(()=>{const c=window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest');window.__ASTRAL.openChest(c)});
  await page.waitForFunction(()=>window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest')?.obj.userData.opened===true,{timeout:5000});

  mark('first-battle');
  await enterNextNormalBattle();
  await settleFrames(3);
  await page.screenshot({path:path.join(out,'battle.png')});
  const comboMpCost=await useComboAndWaitWins(1);

  mark('second-battle');
  await enterNextNormalBattle();
  await useComboAndWaitWins(2);
  assert(await page.evaluate(()=>window.__ASTRAL_CORE.S.quest>=2),'quest did not advance after two normal victories');

  mark('activate-shrine');
  await page.evaluate(()=>{const c=window.__ASTRAL_CORE,p=c.player,s=c.interactables.find(x=>x.type==='shrine');if(!s)throw new Error('shrine interactable missing');p.position.copy(s.obj.position);p.position.y=c.groundY(p.position.x,p.position.z)+.25;});
  await settleFrames(1);
  await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.bossSpawned===true,{timeout:6000});
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.mode==='battle'&&window.__ASTRAL_CORE.S.enemyObj?.userData.boss===true,{timeout:15000});
  await waitCombo();
  await page.evaluate(()=>{window.__ASTRAL_CORE.S.enemy.hp=100;const bar=document.querySelector('#enemyHpBar');if(bar)bar.style.width=`${100/window.__ASTRAL_CORE.S.enemy.maxHp*100}%`;});
  await settleFrames(3);
  await page.screenshot({path:path.join(out,'boss.png')});

  mark('defeat-boss');
  await page.click('.combo-command');
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.boss===true,{timeout:12000});
  await page.waitForSelector('#dawnTitle.show',{state:'visible',timeout:12000});
  await settleFrames(2);
  await page.screenshot({path:path.join(out,'dawn.png')});
  assert(await page.locator('body').evaluate(b=>b.classList.contains('dawn-cinema')),'dawn cinematic did not activate');

  mark('quality-control');
  const quality=await page.locator('#qualityToggle').textContent();
  assert(quality?.startsWith('Q·'),'adaptive quality control not initialized');
  const fatalErrors=errors.filter(x=>!(/Knight\.glb|Mage\.glb|KayKit|jsdelivr/i.test(x)));
  assert(fatalErrors.length===0,`browser errors:\n${fatalErrors.join('\n')}`);
  const result={ok:true,stage,moved,chest:chest.label,comboMpCost,wins:await page.evaluate(()=>window.__ASTRAL_CORE.S.wins),boss:await page.evaluate(()=>window.__ASTRAL_CORE.S.boss),quality,errors};
  fs.writeFileSync(path.join(out,'diagnostic.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
} catch(err) {
  const snapshot=await page.evaluate(()=>({
    url:location.href,
    body:(document.body?.innerText||'').slice(0,4000),
    fatal:document.querySelector('#fatal')?.className,
    loading:!!document.querySelector('#loading'),
    core:!!window.__ASTRAL_CORE,
    mode:window.__ASTRAL_CORE?.S?.mode||null,
    joined:window.__ASTRAL_CORE?.S?.joined||false,
    wins:window.__ASTRAL_CORE?.S?.wins||0,
    bossSpawned:window.__ASTRAL_CORE?.S?.bossSpawned||false,
    boss:window.__ASTRAL_CORE?.S?.boss||false,
    player:window.__ASTRAL_CORE?.player?{x:window.__ASTRAL_CORE.player.position.x,y:window.__ASTRAL_CORE.player.position.y,z:window.__ASTRAL_CORE.player.position.z}:null,
    scripts:[...document.scripts].map(x=>x.src).filter(Boolean)
  })).catch(()=>({}));
  const report={ok:false,stage,error:String(err?.stack||err),errors,messages:messages.slice(-180),snapshot};
  fs.writeFileSync(path.join(out,'diagnostic.json'),JSON.stringify(report,null,2));
  await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});
  console.error(JSON.stringify(report,null,2));
  throw err;
} finally {await browser.close();}
