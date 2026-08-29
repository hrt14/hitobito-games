import { chromium } from 'playwright';

const base=process.env.LEVELUP_BASE||'https://levelup.hitobito.jp';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const must=(v,m)=>{if(!v)throw new Error(m)};

async function lifeRpg(){
 const page=await context.newPage();
 await page.goto(`${base}/apps/life-rpg-status/?verify=${Date.now()}`,{waitUntil:'networkidle',timeout:60000});
 must(await page.getByRole('button',{name:'42問で自分を読む'}).isVisible(),'life-rpg: 42-question CTA missing');
 await page.getByRole('button',{name:'42問で自分を読む'}).click();
 for(let n=0;n<42;n++) await page.locator('#scale button').nth(n%5).click();
 must(await page.locator('#stats .stat').count()===6,'life-rpg: six axes missing');
 must(await page.locator('#styles .style-card').count()===3,'life-rpg: three styles missing');
 must((await page.locator('#history').textContent()).trim().length>10,'life-rpg: history text missing');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);must(!overflow,'life-rpg: mobile overflow');
 await page.close();
 return {questions:42,axes:6,styles:3};
}

const factSet=new Set(['上司は無言でメモを取った。','半日、既読がついていない。','昨日の投稿は、普段より反応数が少ない。','「うん」「あとで」と短く返事をした。','返信文は「承知しました」だった。','相手は一度スマホの画面を見た。','「確認します」と返信が来た。','今月は忙しい、と断られた。']);
async function sasshi(){
 const page=await context.newPage();
 await page.goto(`${base}/apps/sasshi-sugi-stop/?verify=${Date.now()}`,{waitUntil:'networkidle',timeout:60000});
 must(await page.getByRole('button',{name:'8問、仕分ける'}).isVisible(),'sasshi: start missing');
 await page.getByRole('button',{name:'8問、仕分ける'}).click();
 for(let n=0;n<8;n++){
   const raw=(await page.locator('#statement').textContent()).replace(/^「|」$/g,'');
   const kind=factSet.has(raw)?'fact':'guess';
   await page.locator('#'+kind).click();
   must((await page.locator('#fb').textContent()).includes('その仕分け'),'sasshi: correct feedback missing');
   await page.getByRole('button',{name:'次へ'}).click();
 }
 must((await page.locator('#score').textContent()).includes('%'),'sasshi: result score missing');
 await page.getByRole('button',{name:'現実の1件を分ける'}).click();
 await page.locator('#realFact').fill('返信がまだ来ていない');await page.locator('#realGuess').fill('嫌われたと思われている');await page.getByRole('button',{name:'分ける'}).click();
 must((await page.locator('#realOut').textContent()).includes('未確認'),'sasshi: real-mode rule missing');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);must(!overflow,'sasshi: mobile overflow');
 await page.close();return {rounds:8,realMode:true};
}

async function listening(){
 const page=await context.newPage();
 await page.goto(`${base}/apps/listening-reflex/?verify=${Date.now()}`,{waitUntil:'networkidle',timeout:60000});
 must(await page.getByRole('button',{name:'6会話、受け取る'}).isVisible(),'listening: start missing');
 await page.getByRole('button',{name:'6会話、受け取る'}).click();
 for(let n=0;n<6;n++){
   for(const id of ['summaryChoices','feelingChoices','questionChoices']) await page.locator(`#${id} .choice`).first().click();
   await page.getByRole('button',{name:'この返しで聴く'}).click();
   must((await page.locator('#fb').textContent()).includes('いい返し'),'listening: correct feedback missing');
   await page.getByRole('button',{name:'次の会話'}).click();
 }
 must((await page.locator('#score').textContent()).includes('%'),'listening: score missing');
 must((await page.locator('#weakTitle').textContent()).includes('次に意識する'),'listening: weak area missing');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);must(!overflow,'listening: mobile overflow');
 await page.close();return {conversations:6,threeStep:true};
}

try{
 const result={lifeRpg:await lifeRpg(),sasshi:await sasshi(),listening:await listening()};
 console.log('REAL PRODUCTION FEEDBACK-REQUEST APPS VERIFIED');
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}
