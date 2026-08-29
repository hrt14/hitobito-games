import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.IYA_FEELING_URL || 'http://127.0.0.1:4173/apps/iya-feeling-first-aid/?test=1';
const artifacts = path.resolve('apps/iya-feeling-first-aid/.artifacts');
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
async function openFresh() {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#startScreen.active', { timeout: 10000 });
}
async function chooseIntensity(role, value) {
  await page.locator(`[data-role="${role}-scale"] [data-intensity="${value}"]`).click();
}
async function passWave() {
  const wave = page.locator('#waveHold');
  await wave.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true });
  await page.waitForTimeout(760);
  await wave.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true });
  await page.waitForSelector('#labelScreen.active', { timeout: 3000 });
}
async function runSession({ before, emotion, source, anchorIndex = 0, after }) {
  await chooseIntensity('before', before);
  if (!(await active('waveScreen'))) fail('Wave screen did not open after baseline intensity.');
  await passWave();
  await page.getByRole('button', { name: emotion, exact: emotion !== '何かわからない' }).click();
  if (!(await active('sourceScreen'))) fail('Source screen did not open after affect label.');
  const sourceCopy = await page.locator('#sourceScreen .subcopy').innerText();
  const expected = emotion === '何かわからない' ? 'わからないが来てる' : `${emotion}が来てる`;
  if (!sourceCopy.includes(expected)) fail(`Affect label is not carried forward: ${sourceCopy}`);
  await page.locator(`[data-source="${source}"]`).click();
  if (!(await active('anchorScreen'))) fail('Anchor screen did not open.');
  const anchors = page.locator('#anchorChoices button');
  if ((await anchors.count()) !== 4) fail('Expected four concrete anchors.');
  await anchors.nth(anchorIndex).click();
  if (!(await active('doScreen'))) fail('Concrete action screen did not open.');
  await page.locator('#doneActionBtn').click();
  if (!(await active('afterScreen'))) fail('After-intensity screen did not open.');
  await chooseIntensity('after', after);
  if (!(await active('resultScreen'))) fail('Result screen did not open.');
}

try {
  await openFresh();
  await page.evaluate(() => localStorage.removeItem('levelup-iya-feeling-first-aid-v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#startScreen.active');

  if (!(await active('startScreen'))) fail('First visit is not usable.');
  if (!(await page.locator('#lastSession').isHidden())) fail('First visit shows an empty previous-session panel.');
  const h1 = await page.locator('#startTitle').innerText();
  if (!h1.includes('嫌な気持ち') || !h1.includes('いったん下げる')) fail(`Promise is unclear: ${h1}`);
  const lead = await page.locator('.lead').innerText();
  if (!lead.includes('理由はあとでいい') || !lead.includes('波の勢い')) fail('First-screen instruction is not immediate enough.');
  if ((await page.locator('[data-role="before-scale"] [data-intensity]').count()) !== 5) fail('Baseline intensity must be one-tap 1-5.');
  const firstTap = await page.locator('[data-role="before-scale"] [data-intensity="3"]').boundingBox();
  if (!firstTap || firstTap.height < 60) fail(`Baseline tap target too small: ${firstTap?.height}`);
  await noOverflow('390 start');
  await page.screenshot({ path: path.join(artifacts, '01-start-390.png'), fullPage: true });

  await chooseIntensity('before', 5);
  if (!(await active('waveScreen'))) fail('Wave screen missing.');
  if (!(await page.locator('#waveTitle').innerText()).includes('通り過ぎる')) fail('Wave interaction meaning is unclear.');
  const waveBox = await page.locator('#waveHold').boundingBox();
  if (!waveBox || waveBox.width < 190 || waveBox.height < 190) fail('Wave hold target is too small.');
  await passWave();
  if (!(await active('labelScreen'))) fail('Label screen missing after hold.');
  await page.screenshot({ path: path.join(artifacts, '02-label-390.png'), fullPage: true });

  await page.getByRole('button', { name: '不安', exact: true }).click();
  if (!(await active('sourceScreen'))) fail('Source screen missing after emotion choice.');
  if (!(await page.locator('#sourceScreen .subcopy').innerText()).includes('不安が来てる')) fail('Affect label is not shown in plain language.');
  await page.locator('#sourceScreen [data-back="label"]').click();
  if (!(await active('labelScreen'))) fail('Back from source did not return to label choice.');
  await page.getByRole('button', { name: '不安', exact: true }).click();
  await page.locator('[data-source="future"]').click();
  if (!(await active('anchorScreen'))) fail('Anchor screen missing.');
  if ((await page.locator('#anchorChoices button').count()) !== 4) fail('Future source must offer four anchors.');
  await page.locator('#anchorChoices button').first().click();
  if (!(await active('doScreen'))) fail('Action execution screen missing.');
  const actionTitle = (await page.locator('#doTitle').innerText()).trim();
  if (actionTitle.length < 8) fail(`Action title too vague: ${actionTitle}`);
  await page.locator('#doneActionBtn').click();
  await chooseIntensity('after', 3);
  const resultTitle = (await page.locator('#resultTitle').innerText()).trim();
  if (!resultTitle.includes('2段階')) fail(`Successful before/after result missing: ${resultTitle}`);
  const resultTitleBox = await page.locator('#resultTitle').boundingBox();
  if (!resultTitleBox || resultTitleBox.height > 96) fail(`Result headline wraps too awkwardly: ${resultTitleBox?.height}px`);
  if (!(await page.locator('#beforeAfter').innerText()).includes('5 → 3')) fail('Before/after change is not visible.');
  if (!(await page.locator('#resultEmotion').innerText()).includes('不安が来てる')) fail('Result does not preserve affect label.');
  await page.screenshot({ path: path.join(artifacts, '03-result-success-390.png'), fullPage: true });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#startScreen.active');
  if (await page.locator('#lastSession').isHidden()) fail('Revisit does not show the previous useful result.');
  const lastText = (await page.locator('#lastSessionText').innerText()).trim();
  if (!lastText.includes('5 → 3')) fail(`Saved result did not survive reload: ${lastText}`);

  await runSession({ before: 2, emotion: 'イライラ', source: 'person', anchorIndex: 0, after: 4 });
  const raisedTitle = (await page.locator('#resultTitle').innerText()).trim();
  const raisedCopy = (await page.locator('#resultCopy').innerText()).trim();
  if (!raisedTitle.includes('上がっている')) fail(`Failure/raised-intensity path is missing: ${raisedTitle}`);
  if (!raisedCopy.includes('場所を変えるか人に声をかける')) fail('Raised-intensity path does not offer a safer switch.');

  await page.locator('[data-next="again"]').click();
  if (!(await active('startScreen'))) fail('Run-again did not return to usable first screen.');
  await runSession({ before: 4, emotion: '不安', source: 'future', anchorIndex: 0, after: 2 });
  if (await page.locator('#resultInsight').isHidden()) fail('Three-use evidence did not produce a personalized helpful pattern.');
  const insight = (await page.locator('#resultInsight').innerText()).trim();
  if (!insight.includes('平均') || !insight.includes('段階')) fail(`Personal insight is not evidence-based: ${insight}`);
  await page.screenshot({ path: path.join(artifacts, '04-result-insight-390.png'), fullPage: true });

  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator('[data-next="again"]').click();
  await noOverflow('360 start');
  const scaleBoxes = await page.locator('[data-role="before-scale"] [data-intensity]').evaluateAll((nodes) => nodes.map((node) => {
    const r = node.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }));
  if (scaleBoxes.some((box) => box.height < 60 || box.width < 52)) fail('Intensity taps are too small on 360px.');
  await chooseIntensity('before', 3);
  await noOverflow('360 wave');
  await passWave();
  const emotionBoxes = await page.locator('#emotionChoices button').evaluateAll((nodes) => nodes.map((node) => {
    const r = node.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }));
  if (emotionBoxes.some((box) => box.height < 60 || box.width < 145)) fail('Emotion tap targets are too small on 360px.');
  await noOverflow('360 emotion');
  await page.screenshot({ path: path.join(artifacts, '05-mobile-360.png'), fullPage: true });

  if (pageErrors.length) fail(`Browser page errors:\n${pageErrors.join('\n')}`);

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first visit without empty revisit chrome',
      'one-tap baseline',
      '8-second hold metaphor in accelerated test mode',
      'affect labeling carried into the next screen',
      'back path from source to label',
      'source-specific four-anchor choice',
      'concrete action execution',
      'before/after success result and readable result headline',
      'reload and revisit history',
      'raised-intensity failure path',
      'repeat run and observed personal anchor insight',
      '360px overflow and tap targets',
    ],
    observed: { resultTitle, lastText, raisedTitle, insight, pageErrors },
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
