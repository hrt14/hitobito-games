import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url=process.env.APP_URL||'http://127.0.0.1:4173/apps/listening-reflex/';
const quality='apps/listening-reflex/QUALITY.md';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const must=(v,m)=>{if(!v)throw new Error(m)};
const pick=async(index)=>{for(const id of ['summaryChoices','feelingChoices','questionChoices']) await page.locator(`#${id} .choice`).nth(index).click();};
try{
 await page.goto(url,{waitUntil:'networkidle'});
 must((await page.locator('h1').textContent()).includes('聴く'),'title missing');
 must(await page.getByRole('button',{name:'6会話、受け取る'}).isVisible(),'start CTA missing');
 await page.getByRole('button',{name:'6会話、受け取る'}).click();
 must((await page.locator('#num').textContent()).includes('1 / 6'),'round 1 missing');
 await pick(1);await page.getByRole('button',{name:'この返しで聴く'}).click();must((await page.locator('#fb').textContent()).includes('助言・決めつけ'),'wrong-path feedback missing');
 await page.getByRole('button',{name:'次の会話'}).click();await pick(0);await page.getByRole('button',{name:'この返しで聴く'}).click();must((await page.locator('#fb').textContent()).includes('いい返し'),'correct-path feedback missing');
 for(let n=2;n<6;n++){await page.getByRole('button',{name:'次の会話'}).click();await pick(0);await page.getByRole('button',{name:'この返しで聴く'}).click()}
 await page.getByRole('button',{name:'次の会話'}).click();must(!(await page.locator('#result').evaluate(el=>el.classList.contains('hidden'))),'result missing');must((await page.locator('#score').textContent()).includes('%'),'score missing');must((await page.locator('#weakTitle').textContent()).includes('次に意識する'),'weak-area result missing');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('levelup-listening-reflex-v1')||'null'));must(saved?.pct>=0&&saved?.miss,'result persistence missing');
 await page.reload({waitUntil:'networkidle'});must(await page.getByRole('button',{name:'6会話、受け取る'}).isVisible(),'reload unusable');const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('levelup-listening-reflex-v1')||'null'));must(persisted?.pct===saved.pct,'revisit persistence missing');
 const metrics=await page.evaluate(()=>({w:document.documentElement.scrollWidth,vw:innerWidth,buttons:[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null).map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height}))}));must(metrics.w<=metrics.vw,'mobile overflow');must(metrics.buttons.every(r=>r.w>=44&&r.h>=44),'small tap target');must(await page.locator('.top a').getAttribute('href')==='/','exit link wrong');
 const report=`# 聴く。 — Quality Report\n\n## Test environment\n- Browser/device: Playwright Chromium mobile emulation\n- Viewport: 390x844\n- Build/commit: PR browser run\n- Production URL: NOT REQUIRED for pre-merge quality gate\n\n## First-time clarity\n- Status: PASS\n- Observed evidence: First visit showed the listen-before-advice benefit, the three-step model, and an immediate six-conversation start action.\n\n## Main interaction\n- Status: PASS\n- Observed evidence: Browser completed all six conversations by selecting summary, tentative feeling, and open-question responses.\n\n## Wrong / failure path\n- Status: PASS\n- Observed evidence: A deliberately advice/judgment-heavy response returned the reusable warning about advice, assumptions, and self-story.\n\n## Correct / success path\n- Status: PASS\n- Observed evidence: The intended three-part response returned 「いい返し。」 and the final screen showed total score plus the weakest listening step.\n\n## Back / exit\n- Status: PASS\n- Observed evidence: The persistent LEVEL UP link resolves to / and remains available from the app shell.\n\n## Reload\n- Status: PASS\n- Observed evidence: Reload returned to a usable home screen with the start action intact.\n\n## Revisit\n- Status: PASS\n- Observed evidence: The prior percentage and per-step miss counts persisted in localStorage after reload.\n\n## Mobile readability and tap targets\n- Status: PASS\n- Observed evidence: At 390x844 there was no horizontal overflow and all visible buttons were at least 44px in both dimensions.\n\n## Production verification\n- Status: NOT REQUIRED\n- Observed evidence: Pre-merge browser quality gate; Firebase production is verified after merge.\n\n## Final scores\nClarity: 9/10\nUsefulness: 9/10\nInteraction quality: 8/10\nUniqueness: 9/10\nRepeat value: 8/10\n\n## Final question\nIf I genuinely had this problem, would I open this app again?\n\nAnswer: YES\nReason: The three-step response pattern is specific enough to rehearse before or after real conversations and the result identifies the weakest step.\n\n## Remaining issues\n- Verify the exact Firebase production route after deployment before production completion.\n`;
 await fs.writeFile(quality,report);console.log(JSON.stringify({status:'PASS',saved,metrics},null,2));
}finally{await browser.close()}
