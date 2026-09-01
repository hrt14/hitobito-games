import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url=process.env.MISS_CHECK_URL||'http://127.0.0.1:4173/apps/miss-check-reflex/';
const out=path.resolve('apps/miss-check-reflex/.artifacts');
fs.mkdirSync(out,{recursive:true});

function rgb(value){const m=String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null;}
function lum(c){return c.map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);}
function ratio(a,b){const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:393,height:819},isMobile:true,hasTouch:true});
await page.goto(url,{waitUntil:'domcontentloaded'});
await page.waitForSelector('.lead');
await page.click('.primary');
await page.waitForSelector('.section-copy');
const data=await page.evaluate(()=>{
  const el=document.querySelector('.section-copy');
  const style=getComputedStyle(el);
  return {color:style.color,bg:getComputedStyle(document.body).backgroundColor,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};
});
if(data.overflow)throw new Error('mobile horizontal overflow');
const fg=rgb(data.color),bg=rgb(data.bg);if(!fg||!bg)throw new Error('unable to parse computed colors');
const r=ratio(fg,bg);if(r<4.5)throw new Error(`secondary text contrast too low: ${r.toFixed(2)}`);
await page.screenshot({path:path.join(out,'mobile-contrast.png'),fullPage:true});
await browser.close();
console.log(`MISS_CHECK_CONTRAST_OK ${r.toFixed(2)}`);
