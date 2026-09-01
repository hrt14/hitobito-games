import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.YESTERDAY_SELF_URL || 'http://127.0.0.1:4173/apps/yesterday-self/';
const artifactDir = path.resolve('apps/yesterday-self/.artifacts');
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
  locale: 'ja-JP',
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function screenshot(name) {
  await page.screenshot({ path: path.join(artifactDir, `${name}.png`), fullPage: true });
}

async function assertTarget(selector, minimum = 44) {
  const locator = page.locator(selector).first();
  assert(await locator.isVisible(), `Tap target is not visible: ${selector}`);
  const box = await locator.boundingBox();
  assert(box && box.height >= minimum, `Tap target ${selector} is ${Math.round(box?.height || 0)}px; expected >= ${minimum}px.`);
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('levelup-yesterday-self-v1');
    localStorage.removeItem('levelup-yesterday-self-draft-v1');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // First visit: purpose and next action are visible without scrolling.
  await page.locator('#resetScreen.active').waitFor();
  assert(await page.locator('h1').filter({ hasText: '今、誰と' }).isVisible(), 'First-visit purpose is not visible.');
  assert(await page.locator('#opponentCard').isVisible(), 'Opponent card is not visible on first visit.');
  assert(await page.locator('#dismissFallbackBtn').isVisible(), 'Swipe fallback is not visible.');
  const startDisabled = await page.locator('#startMatchBtn').isDisabled();
  assert(startDisabled, 'Match must not start before choosing one win.');
  const homeHref = await page.locator('.home-link').getAttribute('href');
  assert(homeHref === '/', 'Home/exit link must point to LEVEL UP root.');
  await assertTarget('.home-link', 40);
  await assertTarget('.record-btn', 40);
  await assertTarget('#dismissFallbackBtn', 40);
  await screenshot('01-first-visit');

  // Enter a comparison target, then physically dismiss the card with a horizontal drag.
  await page.locator('#opponentInput').fill('SNSで見た人');
  assert((await page.locator('#opponentName').textContent())?.includes('SNSで見た人'), 'Opponent label did not update.');
  const box = await page.locator('#opponentCard').boundingBox();
  assert(box, 'Opponent card has no bounding box.');
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX + 140, y, { steps: 8 });
  await page.mouse.up();
  await page.locator('#enemyScreen.active').waitFor();
  assert(await page.getByText("TODAY'S ENEMY", { exact: true }).isVisible(), 'Yesterday-self reveal did not appear after swipe.');
  await page.locator('.today-card').waitFor({ state: 'visible' });
  await page.waitForTimeout(550);
  await assertTarget('#chooseWinBtn');
  await screenshot('02-yesterday-reveal');

  // Choose one specific win and enter the duel.
  await page.locator('#chooseWinBtn').click();
  await page.locator('#chooseScreen.active').waitFor();
  await page.locator('[data-win="move"]').click();
  assert(!(await page.locator('#startMatchBtn').isDisabled()), 'Start button did not enable after win selection.');
  const selectedText = await page.locator('#selectedWinText').textContent();
  assert(selectedText?.includes('一手だけ'), 'Selected win copy is not concrete.');
  await assertTarget('[data-win="move"]');
  await assertTarget('#startMatchBtn');
  await page.locator('#startMatchBtn').click();
  await page.locator('#duelScreen.active').waitFor();

  // Failure/not-yet path must shrink the real action rather than punish the user.
  await assertTarget('#winBtn');
  await assertTarget('#notYetBtn');
  await page.locator('#notYetBtn').click();
  assert(await page.locator('#nudgeCard').isVisible(), 'Not-yet path did not reveal a smaller action.');
  const nudge = await page.locator('#nudgeText').textContent();
  assert(nudge && nudge.length >= 12, 'Not-yet guidance is too thin.');
  await screenshot('03-not-yet');

  // Reload in the middle of a duel: the selected real-life win must survive.
  const missionBeforeReload = await page.locator('#missionText').textContent();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#duelScreen.active').waitFor();
  const missionAfterReload = await page.locator('#missionText').textContent();
  assert(missionAfterReload === missionBeforeReload, 'Duel draft did not survive reload.');

  // Success path.
  await page.locator('#winBtn').click();
  await page.locator('#resultScreen.active').waitFor();
  assert(await page.getByText('昨日の自分に', { exact: false }).isVisible(), 'Result headline is missing.');
  assert((await page.locator('#todayWins').textContent()) === '1勝', 'First win was not recorded as today 1 win.');
  assert((await page.locator('#totalWins').textContent()) === '1勝', 'First win was not added to total wins.');
  await assertTarget('#shareBtn');
  await assertTarget('#resetAgainBtn');
  await screenshot('04-result');

  // Privacy: comparison target must not be written into localStorage.
  const storageDump = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  assert(!storageDump.includes('SNSで見た人'), 'Comparison target leaked into localStorage.');

  // Revisit in the same browser context: recorded progress must remain usable.
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('#resetScreen.active').waitFor();
  assert(await page.locator('#todayMini').isVisible(), 'Today win badge is missing on revisit.');
  assert((await page.locator('#todayMiniWins').textContent()) === '1勝', 'Revisit did not restore today win count.');
  await page.locator('#recordBtn').click();
  await page.locator('#recordScreen.active').waitFor();
  assert((await page.locator('#recordTotal').textContent()) === '1', 'Record screen did not restore total win count.');
  assert(await page.locator('.record-item').first().isVisible(), 'Record history is missing on revisit.');
  await assertTarget('#recordResetBtn');
  await screenshot('05-revisit-record');

  assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(' | ')}`);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);

  const report = {
    url: baseUrl,
    viewport: '390x844',
    firstVisit: 'PASS',
    horizontalDismiss: 'PASS',
    notYetPath: 'PASS',
    reloadDraft: 'PASS',
    successPath: 'PASS',
    revisit: 'PASS',
    privacy: 'PASS',
    mobileTapTargets: 'PASS',
    consoleErrors,
    pageErrors,
  };
  await fs.writeFile(path.join(artifactDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
