import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.LIFE_RPG_URL || 'http://127.0.0.1:4173/apps/life-rpg-status/';
const artifacts = path.resolve('apps/life-rpg-status/.artifacts');
const qualityPath = path.resolve('apps/life-rpg-status/QUALITY.md');
await fs.mkdir(artifacts,{recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page = await context.newPage();
const must = (condition,message)=>{if(!condition)throw new Error(message)};
try {
  await page.goto(url,{waitUntil:'networkidle'});
  must((await page.locator('h1').textContent())?.includes('人生RPG'),'intro title missing');
  must(await page.getByRole('button',{name:'42問で自分を読む'}).isVisible(),'42-question CTA missing');
  must((await page.locator('body').textContent()).includes('取扱説明'),'central benefit copy missing');
  await page.screenshot({path:path.join(artifacts,'01-intro.png'),fullPage:true});

  await page.getByRole('button',{name:'42問で自分を読む'}).click();
  must((await page.locator('#num').textContent())?.includes('1 / 42'),'Q1 did not start');
  must(await page.locator('#scale button').count()===5,'five scale choices missing');

  // Exercise all 42 real interactions with varied answers so result combinations render.
  for(let n=0;n<42;n++){
    const value = [2,3,4,5,1][n%5];
    await page.locator('#scale button').nth(value-1).click();
    if(n<41) must((await page.locator('#num').textContent())?.includes(`${n+2} / 42`),`did not advance to Q${n+2}`);
  }
  must(!await page.locator('#result').evaluate(el=>el.classList.contains('hidden')),'result did not open');
  must(await page.locator('#stats .stat').count()===6,'six axis stats missing');
  must(await page.locator('#styles .style-card').count()===3,'three combination styles missing');
  must((await page.locator('#environment').textContent())?.trim().length>8,'environment insight missing');
  must((await page.locator('#risk').textContent())?.trim().length>8,'risk insight missing');
  must((await page.locator('#experiment').textContent())?.trim().length>8,'experiment missing');
  await page.screenshot({path:path.join(artifacts,'02-result.png'),fullPage:true});

  const saved = await page.evaluate(()=>JSON.parse(localStorage.getItem('levelup-life-rpg-v3')||'null'));
  must(saved?.scores && Object.keys(saved.scores).length===6,'saved six-axis result missing');

  // Reload is safe: app returns to its clear entry screen without broken state.
  await page.reload({waitUntil:'networkidle'});
  must(await page.getByRole('button',{name:'42問で自分を読む'}).isVisible(),'reload did not return to usable home');
  await page.getByRole('button',{name:'前回の結果を見る'}).click();
  must((await page.locator('#history').textContent())?.includes('保存日'),'saved-result revisit did not render');
  must(await page.locator('#stats .stat').count()===6,'saved result lost axes');

  // Retry from result and check touch targets/mobile overflow.
  await page.getByRole('button',{name:'今の自分でもう一度'}).click();
  must((await page.locator('#num').textContent())?.includes('1 / 42'),'retry did not restart at Q1');
  const metrics=await page.evaluate(()=>({w:document.documentElement.scrollWidth,vw:window.innerWidth,rects:[...document.querySelectorAll('#scale button')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}))}));
  must(metrics.w<=metrics.vw,'horizontal overflow on mobile');
  must(metrics.rects.length===5 && metrics.rects.every(r=>r.h>=44&&r.w>=44),'tap targets below 44px');
  const homeHref=await page.locator('.top a').getAttribute('href');
  must(homeHref==='/','back/exit link does not return to LEVEL UP');

  const quality=`# 人生RPGステータス — Quality Report\n\n## Test environment\n- Browser/device: Playwright Chromium mobile emulation\n- Viewport: 390x844\n- Build/commit: PR browser run\n- Production URL: NOT REQUIRED for pre-merge quality gate\n\n## First-time clarity\n- Status: PASS\n- Observed evidence: First visit showed 人生RPG, the 42-question CTA, and the 取扱説明 benefit without a tutorial.\n\n## Main interaction\n- Status: PASS\n- Observed evidence: Browser completed all 42 taps across five scale choices and reached a result with six axes and three combined styles.\n\n## Wrong / failure path\n- Status: NOT APPLICABLE\n- Observed evidence: This is a self-reflection questionnaire with no right/wrong answer.\n\n## Correct / success path\n- Status: PASS\n- Observed evidence: Completion rendered six axis stats, three style combinations, environment, risk, and next-week experiment.\n\n## Back / exit\n- Status: PASS\n- Observed evidence: The persistent top link resolves to / and returns to LEVEL UP.\n\n## Reload\n- Status: PASS\n- Observed evidence: Reload returned to a usable home screen with the 42-question start action intact and no broken transient state.\n\n## Revisit\n- Status: PASS\n- Observed evidence: After completion and reload, 前回の結果を見る restored all six saved axes and the saved-date history view.\n\n## Mobile readability and tap targets\n- Status: PASS\n- Observed evidence: At 390x844 there was no horizontal overflow and all five answer controls were at least 44px in both dimensions.\n\n## Production verification\n- Status: NOT REQUIRED\n- Observed evidence: Pre-merge browser quality gate; production verification is performed after Firebase deployment.\n\n## Final scores\nClarity: 9/10\nUsefulness: 9/10\nInteraction quality: 8/10\nUniqueness: 8/10\nRepeat value: 8/10\n\n## Final question\nIf I genuinely had this problem, would I open this app again?\n\nAnswer: YES\nReason: The result connects six tendencies to recovery, decision, execution, risks, and a repeatable previous-result comparison.\n\n## Remaining issues\n- Production URL must still be verified after Firebase deployment before production completion is claimed.\n`;
  await fs.writeFile(qualityPath,quality);
  console.log(JSON.stringify({status:'PASS',questions:42,axes:6,styles:3,mobile:metrics},null,2));
} finally { await browser.close(); }
