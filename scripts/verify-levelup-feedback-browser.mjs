import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const candidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const executablePath = candidates.find((value) => fs.existsSync(value));
if (!executablePath) throw new Error(`Chrome executable not found. Tried: ${candidates.join(', ')}`);

const buildSha = String(process.env.GITHUB_SHA || '').slice(0, 12);
if (!/^[a-f0-9]{12}$/.test(buildSha)) throw new Error(`Invalid GITHUB_SHA: ${process.env.GITHUB_SHA || ''}`);

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  page.on('console', (message) => console.log(`[browser:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => console.log(`[browser:pageerror] ${error.message}`));
  await page.goto(`https://levelup.hitobito.jp/apps/smartphone-escape/?feedback-smoke=${Date.now()}`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  await page.waitForFunction(
    () => Boolean(window.firebase?.firestore && window.firebase?.apps?.length),
    { timeout: 30000 },
  );

  const ids = await page.evaluate(async (sha) => {
    const db = window.firebase.firestore();
    const batch = db.batch();
    const base = (`fbsmoke${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`)
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 32);
    const serverTime = () => window.firebase.firestore.FieldValue.serverTimestamp();
    const ids = [];
    for (let index = 0; index < 2; index += 1) {
      const id = `${base}${String(index + 1).padStart(2, '0')}`.slice(0, 40);
      if (!/^[a-z0-9]{8,40}$/.test(id)) throw new Error(`Generated invalid session id: ${id}`);
      ids.push(id);
      batch.set(db.collection('levelupSessions').doc(id), {
        slug: 'home',
        buildSha: sha,
        status: 'active',
        lastStep: `feedback-smoke:${String(index + 1).padStart(2, '0')}/02`,
        lastAction: index === 0 ? 'smoke-a' : 'smoke-b',
        pageKind: 'home',
        durationSec: 0,
        startedAt: serverTime(),
        lastSeenAt: serverTime(),
      });
    }
    await batch.commit();
    return ids;
  }, buildSha);

  console.log(`REAL FEEDBACK WRITE VERIFIED IN BROWSER: ${ids.join(', ')}`);
} finally {
  await browser.close();
}
