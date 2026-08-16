import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base=process.env.ASTRAL_URL||'http://127.0.0.1:4173/apps/astral-dawn/';
const out=path.resolve('apps/astral-dawn/.artifacts');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console.error: ${m.text()}`)});

const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
try{
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  assert(response?.ok(),`page request failed: ${response?.status()}`);
  await page.waitForSelector('#startBtn',{state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.__ASTRAL_CORE?.renderer,{timeout:45000});
  await page.waitForFunction(()=>!document.querySelector('#loading'),{timeout:15000});
  assert(await page.locator('#fatal').evaluate(e=>e.classList.contains('hidden')),'fatal overlay is visible');
  assert(await page.locator('#game canvas').count()===1,'Three.js canvas missing or duplicated');

  await page.click('#startBtn');
  await page.waitForSelector('#dialogue:not(.hidden)',{timeout:5000});
  for(let i=0;i<3;i++){await page.click('#dialogueNext');await page.waitForTimeout(120)}
  await page.waitForFunction(()=>document.querySelector('#dialogue')?.classList.contains('hidden'),{timeout:3000});
  await page.waitForFunction(()=>window.__ASTRAL_CORE?.S?.joined===true,{timeout:3000});
  await page.waitForFunction(()=>!!window.__ASTRAL_CORE?.companion,{timeout:3000});
  await page.waitForSelector('.combo-command',{state:'attached',timeout:3000});

  const before=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  await page.keyboard.down('KeyW');await page.waitForTimeout(650);await page.keyboard.up('KeyW');await page.waitForTimeout(150);
  const after=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  assert(Math.hypot(after.x-before.x,after.z-before.z)>.25,'keyboard movement did not move the hero');
  await page.screenshot({path:path.join(out,'field.png')});

  const chest=await page.evaluate(()=>{const c=window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest');if(!c)return null;return {label:c.label,opened:c.obj.userData.opened,items:window.__ASTRAL_CORE.S.items};});
  assert(chest,'V5 chest instrumentation missing');
  await page.evaluate(()=>{const c=window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest');window.__ASTRAL.openChest(c)});
  await page.waitForTimeout(250);
  assert(await page.evaluate(()=>window.__ASTRAL_CORE.interactables.find(x=>x.type==='chest').obj.userData.opened===true),'chest did not open');

  await page.evaluate(()=>{const c=window.__ASTRAL_CORE,p=c.player,e=c.enemies.find(x=>x.visible&&!x.userData.boss);p.position.set(e.position.x,e.position.y,e.position.z);});
  await page.waitForSelector('#battleHud:not(.hidden)',{timeout:5000});
  await page.waitForSelector('#enemyTrait.show',{timeout:3000});
  assert(await page.locator('.combo-command').isVisible(),'party combo command is not visible in battle');
  await page.screenshot({path:path.join(out,'battle.png')});

  const mpBefore=await page.evaluate(()=>window.__ASTRAL_CORE.S.mp);
  await page.click('.combo-command');
  await page.waitForTimeout(650);
  const mpAfter=await page.evaluate(()=>window.__ASTRAL_CORE.S.mp);
  assert(mpAfter<mpBefore,'party combo did not consume MP');
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.wins>=1,{timeout:6000});
  await page.waitForFunction(()=>window.__ASTRAL_CORE.S.mode==='field'||window.__ASTRAL_CORE.S.mode==='dialogue',{timeout:6000});

  const quality=await page.locator('#qualityToggle').textContent();
  assert(quality?.startsWith('Q·'),'adaptive quality control not initialized');

  // Ignore expected optional model fetch failures only when the procedural fallback kept the page healthy.
  const fatalErrors=errors.filter(x=>!(/Knight\.glb|Mage\.glb|KayKit|jsdelivr/i.test(x)));
  assert(fatalErrors.length===0,`browser errors:\n${fatalErrors.join('\n')}`);
  console.log(JSON.stringify({ok:true,moved:Math.hypot(after.x-before.x,after.z-before.z),chest:chest.label,comboMpCost:mpBefore-mpAfter,wins:await page.evaluate(()=>window.__ASTRAL_CORE.S.wins),quality},null,2));
} finally {await browser.close();}
