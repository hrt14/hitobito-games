import puppeteer from 'puppeteer';

const url=process.env.APP_URL||'http://127.0.0.1:4173/apps/miss-check-reflex/';
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const page=await browser.newPage();
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto(url,{waitUntil:'networkidle0'});

const text=await page.$eval('body',el=>el.innerText);
if(!text.includes('同じミスを繰り返さない')) throw new Error('home copy missing');
await page.click('#startBtn');
await page.click('[data-mode="leftRight"]');
await page.click('#trainBtn');

const firstChoice=await page.$('.choice');
const locked=await page.evaluate(el=>el.classList.contains('locked'),firstChoice);
if(!locked) throw new Error('choice should be locked before hold');
await page.evaluate(()=>document.querySelector('.choice')?.click());
const warning=await page.$eval('#feedback',el=>el.innerText);
if(!warning.includes('先に')) throw new Error('premature-click warning missing');

const hold=await page.$('#holdBtn');
const box=await hold.boundingBox();
await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
await page.mouse.down();
await new Promise(r=>setTimeout(r,780));
await page.mouse.up();
await page.waitForFunction(()=>[...document.querySelectorAll('.choice')].every(x=>!x.classList.contains('locked')));
await page.click('.choice[data-i="1"]');
await new Promise(r=>setTimeout(r,750));

const round2=await page.$eval('.progress-head',el=>el.innerText);
if(!round2.includes('2 of 6')) throw new Error('did not advance to round 2');

await browser.close();
console.log('SMOKE_OK');
