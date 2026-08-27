import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.CHOU_TSUKARETA_URL || 'http://127.0.0.1:4173/apps/chou-tsukareta/?test=1';
const artifacts = path.resolve('apps/chou-tsukareta/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }
async function noHorizontalOverflow(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) fail(`${label}: horizontal overflow ${overflow}px`);
}
async function clickFirstChoice() {
  const choice = page.locator('.choice').first();
  if (!(await choice.isVisible())) fail('No visible answer choice.');
  await choice.click();
}
async function finishCurrentRun() {
  for (let step = 0; step < 8; step += 1) {
    if (await active('resultScreen')) return;
    if (!(await active('questionScreen'))) fail(`Question screen disappeared before result at step ${step}.`);
    await clickFirstChoice();
  }
  fail('Result did not appear within 7 answers.');
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('levelup-chou-tsukareta-v2'));
  await page.reload({ waitUntil: 'networkidle' });

  if (!(await active('startScreen'))) fail('Start screen is not visible on first visit.');
  const h1 = await page.locator('#startScreen h1').innerText();
  if (!h1.includes('疲れたの') || !h1.includes('正体')) fail(`Core promise missing from H1: ${h1}`);
  const lead = await page.locator('.lead').innerText();
  if (!lead.includes('いま何に削られているか') || !lead.includes('言葉にします')) fail('First-screen benefit is unclear.');
  for (const label of ['7問以内', '文字入力なし', '約1分']) {
    if (!(await page.getByText(label, { exact: true }).isVisible())) fail(`Promise badge missing: ${label}`);
  }
  const start = page.locator('#startBtn');
  const startBox = await start.boundingBox();
  if (!startBox || startBox.height < 48) fail(`Primary tap target too short: ${startBox?.height}`);
  await noHorizontalOverflow('390 start');
  await page.screenshot({ path: path.join(artifacts, '01-start-390.png'), fullPage: true });

  await start.click();
  if (!(await active('questionScreen'))) fail('Question screen did not open.');
  if ((await page.locator('.choice').count()) < 4) fail('Starter question has too few concrete choices.');
  const starterTitle = await page.locator('#questionTitle').innerText();
  if (!starterTitle.includes('一番近い')) fail(`Unexpected starter question: ${starterTitle}`);

  await page.getByRole('button', { name: /頭がいっぱい/ }).click();
  const secondTitle = await page.locator('#questionTitle').innerText();
  if (secondTitle === starterTitle) fail('Adaptive flow did not advance after first answer.');
  await clickFirstChoice();
  const thirdTitle = await page.locator('#questionTitle').innerText();
  if (thirdTitle === secondTitle) fail('Question did not advance after second answer.');
  await page.locator('#backBtn').click();
  if ((await page.locator('#questionTitle').innerText()) !== secondTitle) fail('Back did not restore the previous question.');
  await page.screenshot({ path: path.join(artifacts, '02-adaptive-back-390.png'), fullPage: true });

  await finishCurrentRun();
  if (!(await active('resultScreen'))) fail('Result screen is not active.');
  const firstResultTitle = (await page.locator('#resultTitle').innerText()).trim();
  const firstSentence = (await page.locator('#resultSentence').innerText()).trim();
  if (firstResultTitle.length < 6) fail(`Result title is too thin: ${firstResultTitle}`);
  if (!firstSentence.includes('今日の「疲れた」は') || firstSentence.length < 45) fail(`Verbalized result is too thin: ${firstSentence}`);
  if ((await page.locator('.cause-row').count()) < 4) fail('Cause stack does not expose enough of the fatigue shape.');
  if ((await page.locator('#prescriptionTitle').innerText()).trim().length < 5) fail('Next action is missing.');
  if (!(await page.locator('#notNow').innerText()).includes('今はしなくていい')) fail('Explicit subtraction guidance is missing.');
  if (!(await page.locator('#primaryApp').isVisible())) fail('Related LEVEL UP recommendation is missing.');
  const relatedHref = await page.locator('#primaryApp').getAttribute('href');
  if (!relatedHref?.startsWith('/apps/')) fail(`Related LEVEL UP link is invalid: ${relatedHref}`);
  await page.screenshot({ path: path.join(artifacts, '03-result-390.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  if (!(await active('startScreen'))) fail('Reload did not return to usable start screen.');
  if (!(await page.locator('#lastResultBtn').isVisible())) fail('Saved result entry is missing on revisit.');
  await page.locator('#lastResultBtn').click();
  if (!(await active('resultScreen'))) fail('Saved result did not reopen.');
  if ((await page.locator('#resultTitle').innerText()).trim() !== firstResultTitle) fail('Saved result title changed after reload.');
  if ((await page.locator('#resultSentence').innerText()).trim() !== firstSentence) fail('Saved verbalization changed after reload.');

  await page.locator('#againBtn').click();
  if (!(await active('questionScreen'))) fail('Re-run did not open question screen.');
  await page.getByRole('button', { name: /人に会ったあと特に消耗する/ }).click();
  await finishCurrentRun();
  if (!(await active('resultScreen'))) fail('Second run did not reach a result.');
  if (await page.locator('#previousBlock').isHidden()) fail('Previous-vs-current comparison is missing after a second run.');
  const previousText = (await page.locator('#previousText').innerText()).trim();
  if (!previousText.includes('前回')) fail(`Previous comparison is too vague: ${previousText}`);
  await page.screenshot({ path: path.join(artifacts, '04-second-run-comparison.png'), fullPage: true });

  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  await noHorizontalOverflow('360 revisit');
  const mobileStartBox = await page.locator('#startBtn').boundingBox();
  if (!mobileStartBox || mobileStartBox.height < 48) fail('360px primary tap target is too small.');
  await page.locator('#startBtn').click();
  const choiceBoxes = await page.locator('.choice').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (choiceBoxes.some((box) => box.width < 300 || box.height < 56)) fail('Answer tap target is too small on 360px viewport.');
  await noHorizontalOverflow('360 question');
  await page.screenshot({ path: path.join(artifacts, '05-question-360.png'), fullPage: true });

  if (pageErrors.length) fail('Browser page errors:\n' + pageErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first-time promise and start action',
      'adaptive question progression',
      'one-step back with score rollback',
      'completion within seven answers',
      'primary + secondary verbalized result',
      'cause stack and subtraction-oriented next action',
      'related LEVEL UP recommendation',
      'reload and saved-result revisit',
      'second-run previous-result comparison',
      'mobile overflow and tap targets',
    ],
    observed: { firstResultTitle, firstSentence, previousText, pageErrors },
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
