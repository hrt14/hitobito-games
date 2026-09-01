import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url=process.env.RECOVERY_MAP_URL||'http://127.0.0.1:4173/apps/recovery-map/';
const out=path.resolve('apps/recovery-map/.artifacts');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.goto(url,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#startBtn');
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
if(overflow)throw new Error('horizontal overflow on first visit');
if(!(await page.locator('h1').innerText()).includes('休み方'))throw new Error('purpose is unclear on first screen');
await page.screenshot({path:path.join(out,'01-home.png'),fullPage:true});
await page.click('#startBtn');
if(!(await page.locator('#showResult').isDisabled()))throw new Error('result should be gated before selecting signs');
for(const id of ['loop','focus','irritable']){
  await page.click(`[data-signal="${id}"]`);
  await page.click(`[data-signal="${id}"]`);
}
if(await page.locator('#showResult').isDisabled())throw new Error('result did not unlock');
const meterText=await page.locator('.meter.mind').innerText();
if(!meterText.includes('6 / 8'))throw new Error(`mind meter did not update: ${meterText}`);
await page.screenshot({path:path.join(out,'02-check.png'),fullPage:true});
await page.click('#showResult');
const result=await page.locator('.result-card h2').innerText();
if(result!=='頭・気持ち寄り')throw new Error(`unexpected result: ${result}`);
if(!(await page.locator('#commitAction').isDisabled()))throw new Error('commit should require one recovery action');
await page.click('[data-action="0"]');
await page.click('#commitAction');
if(await page.locator('.done').count()!==1)throw new Error('completion screen missing');
await page.screenshot({path:path.join(out,'03-done.png'),fullPage:true});
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForSelector('#startBtn');
const history=await page.locator('.history').innerText();
if(!history.includes('頭・気持ち'))throw new Error('revisit history missing');
await page.click('#startBtn');
// The shared LEVEL UP app-menu layer is injected only in production and can
// overlap the app-owned reset control in headless hit testing. Invoke the
// control's real DOM click here so this app smoke test verifies reset behavior
// without coupling itself to the shared navigation overlay.
await page.locator('#resetBtn').evaluate((button)=>button.click());
if(await page.locator('#startBtn').count()!==1)throw new Error('back/reset did not return home');
const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
if(mobileOverflow)throw new Error('horizontal overflow after interaction');
await browser.close();
console.log('RECOVERY_MAP_SMOKE_OK');
