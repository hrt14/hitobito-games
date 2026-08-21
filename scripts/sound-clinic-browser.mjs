import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.SOUND_CLINIC_URL || 'http://127.0.0.1:4173/apps/sound-clinic/';
const artifacts = path.resolve('artifacts/sound-clinic');
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(String(error)));

async function hold(code, ms, modifiers = []) {
  for (const modifier of modifiers) await page.keyboard.down(modifier);
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
  for (const modifier of [...modifiers].reverse()) await page.keyboard.up(modifier);
  await page.waitForTimeout(80);
}

async function assertText(locator, pattern, label) {
  const text = (await locator.innerText()).trim();
  if (!pattern.test(text)) throw new Error(`${label}: expected ${pattern}, got ${JSON.stringify(text)}`);
  return text;
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(artifacts, '01-start-mobile.png'), fullPage: true });

  await page.getByRole('button', { name: '診療所に入る' }).click();
  await page.waitForTimeout(250);
  await assertText(page.locator('#objective'), /ヒューズ\s*0\s*\/\s*3/, 'initial objective');
  const controlsVisible = await page.locator('#controls').evaluate((el) => getComputedStyle(el).display !== 'none' && !el.hidden);
  if (!controlsVisible) throw new Error('Mobile controls were not visible at 390x844.');
  await page.screenshot({ path: path.join(artifacts, '02-entered-mobile.png'), fullPage: true });

  // Walking must create a small noise pulse.
  await hold('ArrowLeft', 620);
  const walkingNoise = (await page.locator('#noiseText').innerText()).trim();
  if (!['小', '大'].includes(walkingNoise)) throw new Error(`Walking did not create audible noise UI: ${walkingNoise}`);

  // Running must create the larger risk signal.
  await hold('ArrowRight', 620, ['Shift']);
  const runningNoise = (await page.locator('#noiseText').innerText()).trim();
  if (runningNoise !== '大') throw new Error(`Running noise should be 大, got ${runningNoise}`);
  await page.screenshot({ path: path.join(artifacts, '03-running-noise.png'), fullPage: true });

  // Throwing a tray consumes one and creates the alternative sound action.
  await page.keyboard.press('Space');
  await page.waitForTimeout(420);
  await assertText(page.locator('#trayCount'), /×2/, 'tray count after throw');

  // Reload to make the first fuse route deterministic.
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '診療所に入る' }).click();
  await page.waitForTimeout(180);

  // Start: (15.5, 19.2). Move to the opening at y=18, cross the wall at x=20,
  // and stop next to the south-east fuse around (24,18).
  await hold('ArrowUp', 360);
  await hold('ArrowRight', 3520);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(650);
  await assertText(page.locator('#objective'), /ヒューズ\s*1\s*\/\s*3/, 'objective after first fuse');
  await page.screenshot({ path: path.join(artifacts, '04-first-fuse-awakens.png'), fullPage: true });

  // Head north through the right-side doors while running. This deliberately
  // trades speed for noise and should eventually let the awakened entity catch us.
  await hold('ArrowRight', 350);
  const death = page.locator('#deathScreen:not(.hidden)');
  for (let i = 0; i < 7 && !(await death.isVisible()); i += 1) {
    await hold('ArrowUp', 900, ['Shift']);
    await page.waitForTimeout(180);
  }
  if (!(await death.isVisible())) {
    // If it did not catch us on the first pass, make loud movement near the top corridor.
    for (let i = 0; i < 8 && !(await death.isVisible()); i += 1) {
      await hold(i % 2 ? 'ArrowRight' : 'ArrowLeft', 650, ['Shift']);
      await page.waitForTimeout(180);
    }
  }
  await death.waitFor({ state: 'visible', timeout: 10000 });
  await page.screenshot({ path: path.join(artifacts, '05-caught.png'), fullPage: true });

  await page.getByRole('button', { name: '入口から続ける' }).click();
  await page.waitForTimeout(250);
  await assertText(page.locator('#objective'), /ヒューズ\s*1\s*\/\s*3/, 'progress after retry');
  await page.screenshot({ path: path.join(artifacts, '06-progress-preserved.png'), fullPage: true });

  if (consoleErrors.length) throw new Error('Browser console errors:\n' + consoleErrors.join('\n'));

  fs.writeFileSync(path.join(artifacts, 'playtest-summary.json'), JSON.stringify({
    url,
    viewport: '390x844 mobile/touch',
    verified: [
      'start screen and mobile controls',
      'walking creates low noise',
      'running creates high noise',
      'tray throw consumes one tray',
      'first fuse changes objective to 1/3 and awakens threat sequence',
      'deliberate loud running can end in capture',
      'retry preserves fuse progress at 1/3',
    ],
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
