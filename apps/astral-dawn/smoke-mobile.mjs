import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base=process.env.ASTRAL_URL||'http://127.0.0.1:4173/apps/astral-dawn/';
const out=path.resolve('apps/astral-dawn/.artifacts');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();
const errors=[];let stage='launch';
page.on('pageerror',e=>errors.push(`pageerror: ${e.stack||e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console.error: ${m.text()}`)});
const mark=s=>{stage=s;console.log(`[Astral mobile] ${s}`)};
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const waitNoArg=(fn,timeout)=>page.waitForFunction(fn,undefined,{timeout});
const inViewport=(b,w=390,h=844)=>!!b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=w+1&&b.y+b.height<=h+1;

try{
  mark('navigate');
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});assert(response?.ok(),`page request failed: ${response?.status()}`);
  await page.waitForSelector('#startBtn',{state:'visible',timeout:45000});
  await waitNoArg(()=>!!window.__ASTRAL_CORE?.renderer,45000);await waitNoArg(()=>!document.querySelector('#loading'),15000);
  assert(await page.locator('#fatal').evaluate(e=>e.classList.contains('hidden')),'fatal overlay visible');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow on mobile start screen');

  mark('start-and-dialogue');
  await page.locator('#startBtn').tap();await page.waitForSelector('#dialogue:not(.hidden)',{timeout:9000});
  for(let i=0;i<3;i++){await page.locator('#dialogueNext').tap();await page.waitForTimeout(100)}
  await waitNoArg(()=>window.__ASTRAL_CORE?.S?.joined===true,6000);await waitNoArg(()=>!!window.__ASTRAL_CORE?.companion,6000);

  mark('touch-controls');
  assert(await page.locator('#touchControls').evaluate(e=>getComputedStyle(e).display!=='none'),'touch controls not visible after intro');
  for(const selector of ['#joystick','#actionBtn','#runBtn'])assert(inViewport(await page.locator(selector).boundingBox()),`${selector} is clipped outside mobile viewport`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow in mobile field');

  const before=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  const joy=await page.locator('#joystick').boundingBox();assert(joy,'joystick missing');
  const cx=joy.x+joy.width/2,cy=joy.y+joy.height/2;
  await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx,cy-38,{steps:3});await page.waitForTimeout(900);await page.mouse.up();
  const after=await page.evaluate(()=>({x:window.__ASTRAL_CORE.player.position.x,z:window.__ASTRAL_CORE.player.position.z}));
  const moved=Math.hypot(after.x-before.x,after.z-before.z);assert(moved>.06,`touch joystick did not move hero (${moved})`);
  await page.screenshot({path:path.join(out,'mobile-field.png')});

  mark('mobile-battle');
  await page.evaluate(()=>{const c=window.__ASTRAL_CORE,e=c.enemies.find(x=>x.visible&&!x.userData.boss&&!x.userData.defeated);if(!e)throw new Error('normal enemy missing');c.player.position.copy(e.position);});
  await waitNoArg(()=>window.__ASTRAL_CORE.S.mode==='battle',12000);await page.waitForSelector('.combo-command',{state:'visible',timeout:8000});
  assert(await page.locator('#touchControls').evaluate(e=>getComputedStyle(e).display==='none'),'field touch controls remain visible during battle');
  for(const selector of ['#commandPanel','#enemyCard'])assert(inViewport(await page.locator(selector).boundingBox()),`${selector} clipped on mobile battle`);
  const buttons=page.locator('.commands button');const count=await buttons.count();assert(count===5,`expected 5 battle commands, found ${count}`);
  for(let i=0;i<count;i++){const b=await buttons.nth(i).boundingBox();assert(inViewport(b),`battle command ${i+1} clipped on mobile`);assert(b.width>=80&&b.height>=45,`battle command ${i+1} touch target too small`);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow in mobile battle');
  await page.screenshot({path:path.join(out,'mobile-battle.png')});

  mark('tap-combo');
  await waitNoArg(()=>{const b=document.querySelector('.combo-command');return !!b&&!b.disabled&&b.classList.contains('ready');},10000);
  const mp=await page.evaluate(()=>window.__ASTRAL_CORE.S.mp);await page.locator('.combo-command').tap();
  await page.waitForFunction(v=>window.__ASTRAL_CORE.S.mp<v,mp,{timeout:6000});
  const fatalErrors=errors.filter(x=>!(/Knight\.glb|Mage\.glb|KayKit|jsdelivr/i.test(x)));assert(fatalErrors.length===0,`mobile browser errors:\n${fatalErrors.join('\n')}`);
  const result={ok:true,stage,moved,commands:count,mpBefore:mp,mpAfter:await page.evaluate(()=>window.__ASTRAL_CORE.S.mp),errors};fs.writeFileSync(path.join(out,'mobile-diagnostic.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(err){
  const report={ok:false,stage,error:String(err?.stack||err),errors,body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,3000)};fs.writeFileSync(path.join(out,'mobile-diagnostic.json'),JSON.stringify(report,null,2));await page.screenshot({path:path.join(out,'mobile-failure.png'),fullPage:true}).catch(()=>{});console.error(JSON.stringify(report,null,2));throw err;
}finally{await browser.close();}
