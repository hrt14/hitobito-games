import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.TEN_YEARS_URL || 'http://127.0.0.1:4173/apps/ten-years-back/';
const artifacts = path.resolve('apps/ten-years-back/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }
async function setRange(value) {
  await page.locator('#timeRange').evaluate((node, next) => {
    node.value = String(next);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  if (!(await active('ageScreen'))) fail('Age screen is not visible on first visit.');
  if (!(await page.locator('#ageScreen h1').innerText()).includes('何歳ですか？')) fail('First-screen question is unclear.');
  if (!(await page.getByRole('button', { name: '10年後へ行く' }).isVisible())) fail('Primary start action is not visible.');
  await page.screenshot({ path: path.join(artifacts, '01-first-visit-mobile.png'), fullPage: true });

  await page.locator('#ageInput').fill('5');
  await page.locator('#ageForm').evaluate((form) => form.requestSubmit());
  if (!(await page.locator('#ageError').innerText()).includes('10〜110歳')) fail('Invalid age did not show the range error.');
  if (!(await active('ageScreen'))) fail('Invalid age incorrectly advanced the flow.');

  await page.locator('#ageInput').fill('48');
  await page.locator('#ageForm').evaluate((form) => form.requestSubmit());
  if (!(await active('timelineScreen'))) fail('Timeline did not open after valid age.');
  if ((await page.locator('#ageHero').innerText()) !== '48') fail('Current age was not rendered.');

  await setRange(10);
  if ((await page.locator('#ageHero').innerText()) !== '58') fail('Future age did not become 58.');
  if ((await page.locator('#futureAgeLine').innerText()) !== '58歳のあなたです。') fail('Future arrival message is wrong.');
  if (!(await page.locator('#futureMessage').isVisible())) fail('Future message is not visible at +10 years.');
  await page.screenshot({ path: path.join(artifacts, '02-ten-years-later.png'), fullPage: true });

  await page.locator('#turnBackBtn').click();
  await setRange(7);
  if (!(await page.locator('#timelineInstruction').innerText()).includes('巻き戻す')) fail('Return phase did not begin.');
  await setRange(0);
  await page.waitForTimeout(350);
  if (!(await active('rebornScreen'))) fail('Reborn screen did not appear after returning to today.');
  if ((await page.locator('#rebornAge').innerText()) !== '48') fail('Returned age is wrong.');
  if (!(await page.locator('.reborn-badge').innerText()).includes('10歳、若返りました')) fail('Core reframe is missing.');
  await page.screenshot({ path: path.join(artifacts, '03-reborn.png'), fullPage: true });

  await page.locator('#rebornNextBtn').click();
  if (!(await active('moodScreen'))) fail('Mood screen did not open.');
  await page.locator('#moodChoices .choice').nth(1).click();
  if (await page.locator('#moodNextBtn').isDisabled()) fail('Mood choice did not unlock next action.');
  await page.locator('#moodNextBtn').click();

  if (!(await active('regretScreen'))) fail('Regret screen did not open.');
  if ((await page.locator('#futureAgeQuestion').innerText()) !== '58歳') fail('Future-age question is wrong.');
  await page.locator('#regretInput').fill('やりたいことにもっと挑戦すればよかった');
  await page.locator('#regretNextBtn').click();

  if (!(await active('actionScreen'))) fail('Action screen did not open.');
  if (!(await page.locator('#regretEcho').innerText()).includes('挑戦')) fail('Regret was not carried forward.');
  await page.locator('#actionInput').fill('本の企画を1行だけ書く');
  await page.locator('#actionNextBtn').click();

  if (!(await active('resultScreen'))) fail('Result screen did not appear.');
  if ((await page.locator('#resultAge').innerText()) !== '48') fail('Result age is wrong.');
  if ((await page.locator('#resultAction').innerText()) !== '本の企画を1行だけ書く') fail('Today action is missing from result.');
  await page.screenshot({ path: path.join(artifacts, '04-result.png'), fullPage: true });

  await page.locator('#doneBtn').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('levelup-ten-years-back-v1') || '{}'));
  if (stored.sessions !== 1) fail(`Expected one stored session, got ${stored.sessions}`);
  if (stored.lastAge !== 48) fail(`Expected stored age 48, got ${stored.lastAge}`);
  if (stored.lastAction !== '本の企画を1行だけ書く') fail('Stored action is wrong.');

  // Required real reload: same HTTP origin, same browser context, real localStorage.
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await active('ageScreen'))) fail('Reload did not return to a usable age screen.');
  if (!(await page.locator('#returnNote').innerText()).includes('未来から戻ってきて 2回目。')) fail('Reload did not restore session count.');
  if (!(await page.locator('#lastAction').innerText()).includes('本の企画を1行だけ書く')) fail('Reload lost the previous action.');
  if ((await page.locator('#ageInput').inputValue()) !== '48') fail('Reload lost the previous age.');
  await page.screenshot({ path: path.join(artifacts, '05-revisit-after-real-reload.png'), fullPage: true });

  if ((await page.locator('.brand').getAttribute('href')) !== '/') fail('LEVEL UP home link is incorrect.');
  await page.locator('#resetBtn').click();
  if (!(await active('ageScreen'))) fail('RESET did not return to the age screen.');
  if ((await page.locator('#ageInput').inputValue()) !== '') fail('RESET did not clear age input.');

  const primaryBox = await page.getByRole('button', { name: '10年後へ行く' }).boundingBox();
  if (!primaryBox || primaryBox.height < 48) fail(`Primary tap target too short: ${primaryBox?.height}`);
  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow390 > 1) fail(`390px viewport has horizontal overflow: ${overflow390}px`);

  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow360 > 1) fail(`360px viewport has horizontal overflow: ${overflow360}px`);

  if (consoleErrors.length) fail('Browser console errors:\n' + consoleErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first-time clarity',
      'invalid age failure path',
      'current to ten-years-later timeline',
      'ten-years-later to today rewind',
      'reborn reframe',
      'mood to regret to today action',
      'result and localStorage save',
      'real browser reload on same HTTP origin',
      'revisit restores session count, age, and previous action',
      'RESET and LEVEL UP exit',
      'mobile overflow and primary tap target',
    ],
    observed: {
      storedSessions: stored.sessions,
      storedAge: stored.lastAge,
      storedAction: stored.lastAction,
      reloadReturnNote: await page.locator('#returnNote').innerText(),
      consoleErrors,
    },
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
