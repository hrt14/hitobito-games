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
  await page.waitForSelector('#dialogue:not(.hidden)',{timeout:5000});
  mark('finish-intro-dialogue');
  for(let i=0;i<3;i++){await page.click('#dialogueNext');await page.waitForTimeout(120)}
  await page.waitForFunction(()=>document.querySelector('#dialogue')?.classList.contains('hidden'),{timeout:3000});
  await page.waitForFunction(()=>window.__ASTRAL_CORE?.S?.joined===true,{timeout:3000});
  await page.waitForFunction(()=>!!window.__ASTRAL_CORE?.companion,{timeout:3000});
  await page.waitForSelector('.combo-command',{state:'attached',timeout:3000});
  await page.waitForTimeout(250);
  assert(errors.length===0,`errors appeared after party join:\n${errors.join('\n')}`);

  mark('movement');
  const before=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  await page.keyboard.down('KeyW');await page.waitForTimeout(650);await page.keyboard.up('KeyW');await page.waitForTimeout(150);
  const after=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  assert(Math.hypot(after.x-before.x,after.z-before.z)>.25,'keyboard movement did not move the hero');
  await page.screenshot({path:path.join(out,'field.png')});

  mark('treasure');
  const chest=await page.evaluate(()=>{const c=window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest');if(!c)return null;return {label:c.label,opened:c.obj.userData.opened,items:window.__ASTRAL_CORE.S.items};});
  assert(chest,'V5 chest instrumentation missing');
  await page.evaluate(()=>{const c=window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest');window.__ASTRAL.openChest(c)});
  await page.waitForTimeout(250);
  assert(await page.evaluate(()=>window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest').obj.userData.opened===true),'chest did not open');

  mark('enter-battle');
  await page.evaluate(()=>{const c=window.__ASTRAL_CORE,p=c.player,e=c.enemies.find(x=>x.visible&&!x.userData.boss);p.position.set(e.position.x,e.position.y,e.position.z);});
  await page.waitForSelector('#battleHud:not(.hidden)',{timeout:5000});
  await page.waitForSelector('#enemyTrait.show',{timeout:3000});
  assert(await page.locator('.combo-command').isVisible(),'party combo command is not visible in battle');
  await page.screenshot({path:path.join(out,'battle.png')});

  mark('party-combo');
  const mpBefore=await page.evaluate(()=>window.__ASTRAL_CORE.S.mp);
  await page.click('.combo-command');
  await page.waitForTimeout(650);
  const mpAfter=await page.evaluate(()=>window.__ASTRAL_CORE.S.mp);
  assert(mpAfter<mpBefore,'party combo did not consume MP');
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.wins>=1,{timeout:6000});
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.mode==='field'||window.__ASTRAL_CORE.S.mode==='dialogue',{timeout:6000});

  mark('quality-control');
  const quality=await page.locator('#qualityToggle').textContent();
  assert(quality?.startsWith('Q·'),'adaptive quality control not initialized');
  const fatalErrors=errors.filter(x=>!(/Knight\.glb|Mage\.glb|KayKit|jsdelivr/i.test(x)));
  assert(fatalErrors.length===0,`browser errors:\n${fatalErrors.join('\n')}`);
  const result={ok:true,stage,moved:Math.hypot(after.x-before.x,after.z-before.z),chest:chest.label,comboMpCost:mpBefore-mpAfter,wins:await page.evaluate(()=>window.__ASTRAL_CORE.S.wins),quality,errors};
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
    player:window.__ASTRAL_CORE?.player?{x:window.__ASTRAL_CORE.player.position.x,y:window.__ASTRAL_CORE.player.position.y,z:window.__ASTRAL_CORE.player.position.z}:null,
    scripts:[...document.scripts].map(x=>x.src).filter(Boolean)
  })).catch(()=>({}));
  const report={ok:false,stage,error:String(err?.stack||err),errors,messages:messages.slice(-160),snapshot};
  fs.writeFileSync(path.join(out,'diagnostic.json'),JSON.stringify(report,null,2));
  await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});
  console.error(JSON.stringify(report,null,2));
  throw err;
} finally {await browser.close();}
