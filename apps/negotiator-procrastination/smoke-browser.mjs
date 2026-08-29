import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.NEGOTIATOR_URL || 'http://127.0.0.1:4173/apps/negotiator-procrastination/?test=1';
const artifacts = path.resolve('apps/negotiator-procrastination/.artifacts');
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
async function openFresh() {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#negotiationScreen.active', { timeout: 15000 });
}
async function reloadReady() {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#negotiationScreen.active', { timeout: 15000 });
}
async function resetStorage() {
  await page.evaluate(() => localStorage.removeItem('levelup-negotiator-procrastination-v1'));
  await reloadReady();
}
async function readStats() {
  return page.evaluate(() => JSON.parse(localStorage.getItem('levelup-negotiator-procrastination-v1') || '{}'));
}
async function assertChoiceTargets(label) {
  const boxes = await page.locator('.choice-btn').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  if (boxes.length !== 3) fail(`${label}: expected 3 choices, got ${boxes.length}`);
  if (boxes.some((box) => box.height < 56)) fail(`${label}: choice tap target below 56px`);
}
async function completeVisibleAgreement(actionName = /対象を開く/) {
  await page.getByRole('button', { name: actionName }).click();
  if (!(await active('timerScreen'))) fail('Choosing a micro-action did not open timer screen.');
  await page.locator('#startActionBtn').click();
  if (await page.locator('#didStartBtn').isHidden()) fail('Started-action confirmation did not appear after timer start.');
  await page.locator('#didStartBtn').click();
  if (!(await active('resultScreen'))) fail('Started-action confirmation did not reach result.');
}

try {
  await openFresh();
  await resetStorage();

  if (!(await active('negotiationScreen'))) fail('Negotiation screen is not visible on first visit.');
  const h1 = (await page.locator('h1').innerText()).replace(/\s+/g, ' ');
  if (!h1.includes('先延ばし') || !h1.includes('やめろ')) fail(`Core promise missing from H1: ${h1}`);
  if ((await page.locator('#askChip').innerText()).trim() !== '25:00') fail('Opening offer is not 25:00.');
  const firstSpeech = await page.locator('#speech').innerText();
  if (!firstSpeech.includes('今から25分')) fail(`Opening ask is unclear: ${firstSpeech}`);
  await assertChoiceTargets('390 opening');
  await noHorizontalOverflow('390 opening');
  await page.screenshot({ path: path.join(artifacts, '01-opening-390.png'), fullPage: true });

  await page.getByRole('button', { name: /無理。そんな時間ない/ }).click();
  if ((await page.locator('#askChip').innerText()).trim() !== '05:00') fail('First refusal did not shrink request to 5 minutes.');
  const firstConcession = await page.locator('#concession').innerText();
  if (!firstConcession.includes('時間は増やしません') || !firstConcession.includes('25分 → 5分')) fail(`Time-resistance response missing: ${firstConcession}`);

  await page.getByRole('button', { name: /5分でも長い/ }).click();
  if ((await page.locator('#askChip').innerText()).trim() !== '01:00') fail('Second refusal did not shrink request to 60 seconds.');
  const secondConcession = await page.locator('#concession').innerText();
  if (!secondConcession.includes('もっと小さく') || !secondConcession.includes('5分 → 60秒')) fail(`Heavy-resistance response missing: ${secondConcession}`);
  await page.screenshot({ path: path.join(artifacts, '02-concessions-390.png'), fullPage: true });

  await page.locator('#exitBtn').click();
  if (await page.locator('#exitModal').isHidden()) fail('Exit dialog did not open.');
  await page.locator('#stayBtn').click();
  if (!(await page.locator('#exitModal').isHidden())) fail('Exit dialog did not close after staying.');

  await page.getByRole('button', { name: /60秒ならできる/ }).click();
  if (!(await active('prepScreen'))) fail('Accepting 60 seconds did not open action selection.');
  if ((await page.locator('#actionGrid button').count()) !== 3) fail('Action selection does not contain three concrete micro-actions.');
  await page.locator('#backToNegotiation').click();
  if (!(await active('negotiationScreen'))) fail('Back from action selection did not return to negotiation.');
  if ((await page.locator('#askChip').innerText()).trim() !== '01:00') fail('Back lost the negotiated 60-second condition.');

  await page.getByRole('button', { name: /60秒ならできる/ }).click();
  await page.getByRole('button', { name: /対象を開く/ }).click();
  if ((await page.locator('#timerNumber').innerText()).trim() !== '30') fail('60-second agreement should verify the first 30 seconds.');
  await page.locator('#startActionBtn').click();
  if (await page.locator('#didStartBtn').isHidden()) fail('Started-action confirmation did not appear after timer start.');
  await page.locator('#didStartBtn').click();
  if (!(await active('resultScreen'))) fail('Started-action confirmation did not reach result.');
  if ((await page.locator('#initialAsk').innerText()).trim() !== '25分') fail('Result lost initial 25-minute offer.');
  if ((await page.locator('#finalAsk').innerText()).trim() !== '60秒') fail('Result lost accepted 60-second condition.');
  const resultLead = await page.locator('#resultLead').innerText();
  if (!resultLead.includes('対象を開く') || !resultLead.includes('先延ばし状態')) fail(`Result does not prove the session mattered: ${resultLead}`);
  if (!(await page.locator('#continueBtn').isVisible())) fail('Continue-for-five-minutes action is missing.');
  if (!(await page.locator('#shareBtn').isVisible())) fail('Share result action is missing.');

  const beforeContinuation = await readStats();
  await page.locator('#continueBtn').click();
  if (!(await active('timerScreen'))) fail('Five-minute continuation did not open timer.');
  await page.locator('#startActionBtn').click();
  if ((await page.locator('#didStartBtn').innerText()).trim() !== 'ここで終える') fail('Continuation exit label is misleading.');
  await page.locator('#didStartBtn').click();
  if (!(await active('resultScreen'))) fail('Ending continuation did not return to result.');
  const afterContinuation = await readStats();
  if (afterContinuation.sessions !== beforeContinuation.sessions || afterContinuation.starts !== beforeContinuation.starts) fail('Continuation recounted the same negotiation session.');
  if (JSON.stringify(afterContinuation.resistances) !== JSON.stringify(beforeContinuation.resistances)) fail('Continuation double-counted resistance history.');
  await page.screenshot({ path: path.join(artifacts, '03-success-390.png'), fullPage: true });

  await reloadReady();
  const revisitHint = await page.locator('#sessionHint').innerText();
  if (!revisitHint.includes('1回交渉') || !revisitHint.includes('時間がない') || !revisitHint.includes('今回は5分から')) fail(`Revisit did not remember/adapt to resistance: ${revisitHint}`);
  if ((await page.locator('#askChip').innerText()).trim() !== '05:00') fail('Saved time resistance did not adapt the next opening offer to 5 minutes.');
  await page.screenshot({ path: path.join(artifacts, '04-adaptive-revisit-390.png'), fullPage: true });

  // Direct acceptance must not invent a resistance category.
  await resetStorage();
  await page.getByRole('button', { name: /できる。25分やる/ }).click();
  if (!(await active('prepScreen'))) fail('Direct opening acceptance did not reach prep.');
  await completeVisibleAgreement(/最初の1操作をする/);
  if ((await page.locator('#topResistance').innerText()).trim() !== '抵抗なし') fail('Direct acceptance invented a resistance category.');
  const directStats = await readStats();
  if (directStats.lastTopResistance !== '') fail(`Direct acceptance persisted fake resistance: ${directStats.lastTopResistance}`);

  // Failure path from a completely fresh session.
  await resetStorage();
  await page.getByRole('button', { name: /無理。そんな時間ない/ }).click();
  await page.getByRole('button', { name: /5分でも長い/ }).click();
  await page.getByRole('button', { name: /何から始めるか決まってない/ }).click();
  await page.getByRole('button', { name: /中途半端なら意味ない/ }).click();
  await page.getByRole('button', { name: /それでもまだ重い/ }).click();
  await page.getByRole('button', { name: /今日はやらないと決める/ }).click();
  if (!(await active('failScreen'))) fail('Explicit stop-for-today path did not reach negotiation-closed screen.');
  if (!(await page.locator('#retryTinyBtn').isVisible())) fail('Failure screen does not offer a smaller retry.');
  await page.screenshot({ path: path.join(artifacts, '05-failure-390.png'), fullPage: true });

  await page.locator('#retryTinyBtn').click();
  if (!(await active('negotiationScreen'))) fail('Tiny retry did not reopen negotiation.');
  if ((await page.locator('#askChip').innerText()).trim() !== '00:10') fail('Tiny retry did not resume at 10 seconds.');

  await page.setViewportSize({ width: 360, height: 800 });
  await reloadReady();
  await noHorizontalOverflow('360 revisit');
  await assertChoiceTargets('360 revisit');
  const exitBox = await page.locator('#exitBtn').boundingBox();
  if (!exitBox || exitBox.width < 44 || exitBox.height < 44) fail('Mobile exit target is below 44px.');
  await page.screenshot({ path: path.join(artifacts, '06-mobile-360.png'), fullPage: true });

  if (pageErrors.length) fail('Browser page errors:\n' + pageErrors.join('\n'));

  const summary = {
    url,
    viewports: ['390x844', '360x800'],
    tested: [
      'first visit: title, 25-minute opening offer, and three response choices',
      'time-resistance branch and 25m→5m concession',
      'heavy-resistance branch and 5m→60s concession',
      'exit dialog and stay path',
      'accept path, concrete micro-action selection, and back path',
      'real timer start and immediate started-action confirmation',
      'result proof: initial offer, accepted condition, resistance insight, continuation, share',
      'five-minute continuation does not double-count session/resistance',
      'reload adapts next opening offer from saved resistance history',
      'direct acceptance records no invented resistance',
      'explicit failure/stop path and 10-second retry',
      '360px overflow and mobile tap targets'
    ],
    observed: { firstSpeech, firstConcession, secondConcession, resultLead, revisitHint, pageErrors }
  };
  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
