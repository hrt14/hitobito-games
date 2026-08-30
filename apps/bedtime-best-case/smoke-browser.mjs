import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.BEDTIME_BEST_CASE_URL || 'http://127.0.0.1:4173/apps/bedtime-best-case/';
const artifacts = path.resolve('apps/bedtime-best-case/.artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

function fail(message) { throw new Error(message); }
async function active(id) { return page.locator(`#${id}.active`).isVisible(); }
async function noOverflow(label) {
  const px = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (px > 1) fail(`${label}: horizontal overflow ${px}px`);
}
async function inputValue(selector, value) {
  await page.locator(selector).fill(value);
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.removeItem('levelup-bedtime-best-case-v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  if (!(await active('startScreen'))) fail('First visit does not show start screen.');
  const title = await page.locator('#startScreen h1').innerText();
  if (!title.includes('寝る前3分') || !title.includes('全部うまくいくイメトレ')) fail(`Core title missing: ${title}`);
  const lead = await page.locator('#startScreen .lead').innerText();
  if (!lead.includes('目を閉じてから迷わない') || !lead.includes('3シーン')) fail(`Core benefit missing: ${lead}`);
  if (!(await page.locator('#savedCard').isHidden())) fail('Saved card should be hidden on clean first visit.');
  const startBox = await page.locator('#customStartBtn').boundingBox();
  if (!startBox || startBox.height < 44) fail(`Primary start target too short: ${startBox?.height}`);
  await noOverflow('390 start');
  await page.screenshot({ path: path.join(artifacts, '01-start-390.png'), fullPage: true });

  // Failure path: no theme or custom input.
  await page.locator('#customStartBtn').click();
  const startValidation = await page.locator('#startValidation').innerText();
  if (!startValidation.includes('テーマ')) fail('Empty start path has no useful validation.');

  // Main path: work theme.
  await page.getByRole('button', { name: /仕事.*会議・商談・成果/ }).click();
  if (!(await active('buildScreen'))) fail('Theme choice did not open build screen.');
  if ((await page.locator('.suggestion').count()) < 2) fail('Concrete scene suggestions are missing.');

  // Failure path: blank cut.
  await page.locator('#addCutBtn').click();
  const blankValidation = await page.locator('#buildValidation').innerText();
  if (!blankValidation.includes('1枚')) fail('Blank cut has no useful validation.');

  const cut1 = '朝、静かな部屋で資料を開き、落ち着いて深く息をしている。';
  const cut2 = '相手が笑ってうなずき、「それで進めましょう」と資料に目を落とす。';
  const cut3 = '会議を終えて外に出る。肩の力が抜けて、静かに「うまくいった」と思う。';
  await inputValue('#sceneInput', cut1);
  await page.locator('#addCutBtn').click();
  if ((await page.locator('#cutCounter').innerText()) !== 'CUT 2 / 3') fail('Cut 1 did not advance to Cut 2.');

  // Back must restore previous content.
  const backBox = await page.locator('#buildBackBtn').boundingBox();
  if (!backBox || backBox.height < 44) fail('Back target is too small.');
  await page.locator('#buildBackBtn').click();
  if ((await page.locator('#cutCounter').innerText()) !== 'CUT 1 / 3') fail('Back did not return to Cut 1.');
  if (!(await page.locator('#sceneInput').inputValue()).includes('静かな部屋')) fail('Back did not restore Cut 1 content.');
  await page.locator('#addCutBtn').click();

  await inputValue('#sceneInput', cut2);
  await inputValue('#quoteInput', '「それで進めましょう」');
  await page.locator('#addCutBtn').click();
  if ((await page.locator('#cutCounter').innerText()) !== 'CUT 3 / 3') fail('Cut 2 did not advance to Cut 3.');
  await inputValue('#sceneInput', cut3);
  await page.locator('#addCutBtn').click();

  if (!(await active('storyboardScreen'))) fail('Three cuts did not reach storyboard.');
  if ((await page.locator('#storyboard .story-card').count()) !== 3) fail('Storyboard does not contain exactly three base cuts.');
  if (!(await page.locator('#storyboard').innerText()).includes('安心の余韻')) fail('Calm final scene is not explicit.');
  await page.screenshot({ path: path.join(artifacts, '02-storyboard-390.png'), fullPage: true });

  // Optional vividness detail.
  await page.getByRole('button', { name: '体の感じ' }).click();
  await inputValue('#detailInput', '肩が軽く、深く息ができる');
  await page.locator('#saveDetailBtn').click();
  if ((await page.locator('#storyboard .story-card').count()) !== 4) fail('Optional detail was not added.');
  const savedRaw = await page.evaluate(() => localStorage.getItem('levelup-bedtime-best-case-v1'));
  if (!savedRaw) fail('Completed story was not saved locally.');

  // Three-step preview.
  const prepareBox = await page.locator('#prepareBtn').boundingBox();
  if (!prepareBox || prepareBox.height < 44) fail('Prepare target is too small.');
  await page.locator('#prepareBtn').click();
  if (!(await active('playbackScreen'))) fail('Playback did not start.');
  if (!(await page.locator('#playbackText').innerText()).includes('静かな部屋')) fail('Playback Cut 1 is wrong.');
  await page.screenshot({ path: path.join(artifacts, '03-playback-390.png'), fullPage: true });
  await page.locator('#playbackNextBtn').click();
  if (!(await page.locator('#playbackText').innerText()).includes('それで進めましょう')) fail('Playback Cut 2 is wrong.');
  await page.locator('#playbackNextBtn').click();
  if (!(await page.locator('#playbackText').innerText()).includes('肩の力')) fail('Playback Cut 3 is wrong.');
  if (await page.locator('#playbackDetail').isHidden()) fail('Saved detail is missing from final calm scene.');
  await page.locator('#playbackNextBtn').click();

  if (!(await active('lightsoutScreen'))) fail('Playback did not reach ready screen.');
  const readyText = await page.locator('#lightsoutScreen').innerText();
  if (!readyText.includes('うまくいくところを見るだけ')) fail('Final closed-eye instruction is missing.');
  if ((await page.locator('#memoryCuts li').count()) !== 3) fail('Three memory cues are missing.');
  await page.screenshot({ path: path.join(artifacts, '04-ready-390.png'), fullPage: true });
  await page.locator('#screenDownBtn').click();
  if (!(await active('blackoutScreen'))) fail('Screen-down mode did not activate.');
  await page.screenshot({ path: path.join(artifacts, '05-blackout-390.png'), fullPage: true });
  await page.locator('#blackoutReturnBtn').click();
  if (!(await active('lightsoutScreen'))) fail('Blackout return failed.');

  // Reload + revisit.
  await page.reload({ waitUntil: 'domcontentloaded' });
  if (!(await active('startScreen'))) fail('Reload does not return to usable start screen.');
  if (await page.locator('#savedCard').isHidden()) fail('Saved-story revisit entry is missing after reload.');
  if (!(await page.locator('#savedTheme').innerText()).includes('仕事')) fail('Saved theme changed after reload.');
  await page.locator('#replayBtn').click();
  if (!(await active('playbackScreen'))) fail('Saved-story replay did not open playback.');
  if (!(await page.locator('#playbackText').innerText()).includes('静かな部屋')) fail('Saved Cut 1 changed after reload.');

  // Mobile width check and tap targets.
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await noOverflow('360 revisit');
  const mobileStart = await page.locator('#customStartBtn').boundingBox();
  if (!mobileStart || mobileStart.height < 44) fail('360px primary target too small.');
  const themeBoxes = await page.locator('.theme-choice').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (themeBoxes.some((box) => box.width < 140 || box.height < 44)) fail('Theme choices are too small on 360px viewport.');
  await page.screenshot({ path: path.join(artifacts, '06-revisit-360.png'), fullPage: true });

  if (pageErrors.length) fail('Browser page errors:\n' + pageErrors.join('\n'));
  const visibleBody = await page.locator('body').innerText();
  if (/\b(undefined|NaN|Infinity)\b/.test(visibleBody)) fail('Invalid visible runtime value detected.');

  const summary = {
    url,
    browser: 'Playwright Chromium',
    viewports: ['390x844', '360x800'],
    tested: [
      'first-visit promise and tap target',
      'empty-theme validation',
      'blank-cut validation',
      'theme selection and concrete suggestions',
      'three-cut creation',
      'one-step back with content restore',
      'calm final scene',
      'optional vividness detail',
      'local-only saved story',
      'three-step playback',
      'ready screen and blackout',
      'reload and saved-story revisit',
      'saved-story replay',
      '360px overflow and tap targets',
    ],
    pageErrors,
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
