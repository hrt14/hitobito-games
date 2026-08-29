import { chromium } from 'playwright';
const url=process.env.RANK_URL||'https://levelup.hitobito.jp/apps/100nin-rank/?test=1';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let ready=false;for(let a=0;a<36;a++){try{await page.goto(url+'&v='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});ready=await page.locator('#startBtn').isVisible({timeout:2500}).catch(()=>false);if(ready)break}catch{}await sleep(10000)}
 if(!ready)throw new Error('production app not ready');
 const d=await page.locator('#homeDisclaimer').innerText();if(!d.includes('推定')||!d.includes('統計ではありません'))throw new Error('home estimate disclaimer missing');
 if((await page.locator('#startBtn').boundingBox()).height<44)throw new Error('start tap target too small');
 await page.locator('#startBtn').click();
 for(let i=0;i<12;i++){await page.waitForSelector('.choice');if(await page.locator('.choice').count()!==4)throw new Error('choice count');if(i===0&&await page.locator('.person').count()!==100)throw new Error('crowd not 100');await page.locator('.choice').nth(i%4).click();if(i<11)await page.waitForFunction(n=>document.body.innerText.includes(`QUESTION ${n} / 12`),i+2);else await page.waitForSelector('#overallRank')}
 const rank=Number(await page.locator('#overallRank').innerText());if(!(rank>=1&&rank<=100))throw new Error('rank invalid');
 if(await page.locator('.trait').count()!==5)throw new Error('trait count');
 const rd=await page.locator('#resultDisclaimer').innerText();if(!rd.includes('全国調査')||!rd.includes('推定'))throw new Error('result disclaimer missing');
 const share=await page.locator('#shareBtn').getAttribute('data-url');if(!share?.includes('?r='))throw new Error('share URL missing');
 await page.goto(share,{waitUntil:'domcontentloaded'});await page.waitForSelector('#mineBtn');if(!(await page.locator('.shared-tag').innerText()).includes('共有された推定結果'))throw new Error('shared result label missing');
 await page.setViewportSize({width:360,height:800});if(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)>1)throw new Error('mobile horizontal overflow');
 if(errors.length)throw new Error(errors.join('\n'));
 console.log(JSON.stringify({ok:true,url,rank,checks:['12 questions','100-person crowd','5 ranks','estimate disclosure','share result URL','shared-result CTA','360px overflow'],errors},null,2));
}finally{await browser.close()}
