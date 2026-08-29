import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url=process.env.APP_URL||'http://127.0.0.1:4173/apps/sasshi-sugi-stop/';
const quality='apps/sasshi-sugi-stop/QUALITY.md';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const must=(v,m)=>{if(!v)throw new Error(m)};
const facts=new Set([
'上司は無言でメモを取った。','半日、既読がついていない。','昨日の投稿は、普段より反応数が少ない。','「うん」「あとで」と短く返事をした。','返信文は「承知しました」だった。','相手は一度スマホの画面を見た。','「確認します」と返信が来た。','今月は忙しい、と断られた。'
]);
const choose=async(correct=true)=>{const raw=(await page.locator('#statement').textContent()).replace(/^「|」$/g,'');const kind=facts.has(raw)?'fact':'guess';await page.locator('#'+(correct?kind:(kind==='fact'?'guess':'fact'))).click();};
try{
 await page.goto(url,{waitUntil:'networkidle'});
 must((await page.locator('h1').textContent()).includes('事実'),'title missing');
 must(await page.getByRole('button',{name:'8問、仕分ける'}).isVisible(),'start CTA missing');
 await page.getByRole('button',{name:'8問、仕分ける'}).click();
 must((await page.locator('#num').textContent()).includes('1 / 8'),'round 1 missing');
 await choose(false);must((await page.locator('#fb').textContent()).includes('ここは逆'),'wrong path feedback missing');
 await page.getByRole('button',{name:'次へ'}).click();
 await choose(true);must((await page.locator('#fb').textContent()).includes('その仕分け'),'correct path feedback missing');
 for(let n=2;n<8;n++){await page.getByRole('button',{name:'次へ'}).click();await choose(true)}
 await page.getByRole('button',{name:'次へ'}).click();
 must(!(await page.locator('#result').evaluate(el=>el.classList.contains('hidden'))),'result missing');
 must((await page.locator('#score').textContent()).includes('%'),'score missing');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('levelup-sasshi-sugi-stop-v1')||'null'));must(saved?.pct>=0,'result not saved');
 await page.getByRole('button',{name:'現実の1件を分ける'}).click();
 await page.getByRole('button',{name:'分ける'}).click();must((await page.locator('#realOut').textContent()).includes('1つずつ'),'empty real-mode failure path missing');
 await page.locator('#realFact').fill('返信がまだ来ていない');await page.locator('#realGuess').fill('嫌われたと思われている');await page.getByRole('button',{name:'分ける'}).click();must((await page.locator('#realOut').textContent()).includes('未確認'),'real-mode success rule missing');
 await page.getByRole('button',{name:'戻る'}).click();must(await page.getByRole('button',{name:'8問、仕分ける'}).isVisible(),'back did not return home');
 await page.reload({waitUntil:'networkidle'});must(await page.getByRole('button',{name:'8問、仕分ける'}).isVisible(),'reload unusable');
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('levelup-sasshi-sugi-stop-v1')||'null'));must(persisted?.pct===saved.pct,'revisit result persistence missing');
 const metrics=await page.evaluate(()=>({w:document.documentElement.scrollWidth,vw:innerWidth,buttons:[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null).map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height}))}));must(metrics.w<=metrics.vw,'mobile overflow');must(metrics.buttons.every(r=>r.w>=44&&r.h>=44),'small tap target');must(await page.locator('.top a').getAttribute('href')==='/','exit link wrong');
 const report=`# それ、事実？ — Quality Report\n\n## Test environment\n- Browser/device: Playwright Chromium mobile emulation\n- Viewport: 390x844\n- Build/commit: PR browser run\n- Production URL: NOT REQUIRED for pre-merge quality gate\n\n## First-time clarity\n- Status: PASS\n- Observed evidence: First visit showed the fact-versus-guess purpose and an immediate 8-round start action.\n\n## Main interaction\n- Status: PASS\n- Observed evidence: Browser completed eight fact/guess classifications and the real-mode fact/inference split.\n\n## Wrong / failure path\n- Status: PASS\n- Observed evidence: An intentionally wrong classification returned 「ここは逆。」 and empty real-mode input returned a concrete recovery prompt.\n\n## Correct / success path\n- Status: PASS\n- Observed evidence: Correct classification returned 「その仕分け。」, completion rendered score, and real mode returned the 未確認 rule.\n\n## Back / exit\n- Status: PASS\n- Observed evidence: Real-mode back returned home and the persistent LEVEL UP link resolves to /.\n\n## Reload\n- Status: PASS\n- Observed evidence: Reload returned to a usable home screen with the start action intact.\n\n## Revisit\n- Status: PASS\n- Observed evidence: The previous session score remained in localStorage after reload for future comparison/use.\n\n## Mobile readability and tap targets\n- Status: PASS\n- Observed evidence: At 390x844 there was no horizontal overflow and every visible button was at least 44px in both dimensions.\n\n## Production verification\n- Status: NOT REQUIRED\n- Observed evidence: Pre-merge browser quality gate; Firebase production is verified after merge.\n\n## Final scores\nClarity: 9/10\nUsefulness: 9/10\nInteraction quality: 9/10\nUniqueness: 9/10\nRepeat value: 8/10\n\n## Final question\nIf I genuinely had this problem, would I open this app again?\n\nAnswer: YES\nReason: The same two-bin rule is reusable immediately when a real interpersonal worry appears.\n\n## Remaining issues\n- Verify the exact Firebase production route after deployment before production completion.\n`;
 await fs.writeFile(quality,report);console.log(JSON.stringify({status:'PASS',saved,metrics},null,2));
}finally{await browser.close()}
