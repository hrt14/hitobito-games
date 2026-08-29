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

const base = 'https://levelup.hitobito.jp';
const mobileViewport = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

async function freshPage(route) {
  const page = await browser.newPage();
  await page.setViewport(mobileViewport);
  page.on('console', (message) => console.log(`[browser:${route}:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => console.log(`[browser:${route}:pageerror] ${error.message}`));
  await page.goto(`${base}${route}?quality-smoke=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 60000 });
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  if (width.scroll > width.client + 2) throw new Error(`${route} horizontal overflow: ${JSON.stringify(width)}`);
  return page;
}

async function clickByExactText(page, selector, text) {
  const clicked = await page.evaluate(({ selector, text }) => {
    const node = [...document.querySelectorAll(selector)].find((el) => el.textContent.trim() === text);
    if (!node) return false;
    node.click();
    return true;
  }, { selector, text });
  if (!clicked) throw new Error(`Could not find ${selector} with text: ${text}`);
}

async function verifyMindReading() {
  const page = await freshPage('/apps/mind-reading-off/');
  try {
    await page.waitForSelector('#start', { visible: true });
    const heading = await page.$eval('h1', (el) => el.textContent.replace(/\s+/g, ' ').trim());
    if (!heading.includes('考えすぎ')) throw new Error(`mind-reading-off heading mismatch: ${heading}`);
    await page.click('#start');
    await page.waitForSelector('#train:not(.hidden)');

    await page.click('[data-bin="story"]');
    const wrong = await page.$eval('#feedback', (el) => el.textContent);
    if (!wrong.includes('観察できた事実')) throw new Error(`mind-reading-off wrong-path feedback missing: ${wrong}`);
    await page.click('#next');

    await page.click('[data-bin="story"]');
    const correct = await page.$eval('#feedback', (el) => el.textContent);
    if (!correct.includes('観察と解釈')) throw new Error(`mind-reading-off correct feedback missing: ${correct}`);
    await page.click('#next');

    const answers = ['story','fact','story','story','fact','story','story','fact','story','story','fact','story','story'];
    for (const answer of answers) {
      await page.click(`[data-bin="${answer}"]`);
      await page.click('#next');
    }
    await page.waitForSelector('#done:not(.hidden)');
    const score = await page.$eval('#score', (el) => el.textContent);
    if (!score.includes('/ 15')) throw new Error(`mind-reading-off result missing: ${score}`);

    await page.click('#toReal');
    await page.waitForSelector('#real:not(.hidden)');
    await page.type('#rFact', '返信が半日ない');
    await page.type('#rStory', '嫌われたかもしれない');
    await page.type('#rAlt', '忙しいだけかもしれない');
    await page.type('#rAsk', '届いてる？');
    await page.click('#finishReal');
    await page.waitForSelector('#realResult:not(.hidden)');
    const output = await page.$eval('#oFact', (el) => el.textContent);
    if (output !== '返信が半日ない') throw new Error(`mind-reading-off REAL output mismatch: ${output}`);

    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#home:not(.hidden)');
    const homeHref = await page.$eval('.top a', (el) => el.getAttribute('href'));
    if (homeHref !== '/') throw new Error(`mind-reading-off exit link mismatch: ${homeHref}`);
    console.log('QUALITY 302 VERIFIED: first visit, mobile, wrong/correct sorting, completion, REAL mode, reload reset, exit link.');
  } finally {
    await page.close();
  }
}

const LISTEN_CORRECT = [
  '仕事が増えて、家に帰っても頭が休まらないんだね。',
  'かなり消耗してる感じ？',
  '一番きついのは、仕事量？それとも頭が切り替わらないこと？',
  '行きたい気持ちと、面倒な気持ちが両方あるんだね。',
  '今はどっちかというと迷ってる感じ？',
  '行くとしたら何が楽しみで、何が面倒？',
  '今日はうまくいかないことが重なったんだね。',
  '今はもう、考えるのもしんどい感じ？',
  '話したい？ それとも今は静かにしてたい？',
  '修正が続いて、自分のやり方まで不安になってきたんだね。',
  '頑張っても終わらない感じがつらい？',
  'どの修正から「またか」と感じ始めた？',
  '解決策より、まず話を受け止めてほしかったんだね。',
  '聞いてもらえなかった感じが残ってる？',
  'どのところを、もう一回ちゃんと聞いてほしい？',
  'やってみたいけど、失敗を見られるのが怖くて止まってるんだね。',
  '挑戦より、人からどう見られるかが重い感じ？',
  'もし人に見られないなら、何を始めたい？',
];

async function verifyListening() {
  const page = await freshPage('/apps/kiku-chikara/');
  try {
    await page.waitForSelector('#start', { visible: true });
    await page.click('#start');
    await page.waitForSelector('#train:not(.hidden)');
    await clickByExactText(page, '#choices .choice', 'それは転職した方がいいよ。');
    const wrong = await page.$eval('#feedback', (el) => el.textContent);
    if (!wrong.includes('先回りしすぎ')) throw new Error(`kiku-chikara wrong feedback missing: ${wrong}`);

    await page.goto(`${base}/apps/kiku-chikara/?quality-restart=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.click('#start');
    for (let i = 0; i < LISTEN_CORRECT.length; i += 1) {
      await clickByExactText(page, '#choices .choice', LISTEN_CORRECT[i]);
      const feedback = await page.$eval('#feedback', (el) => el.textContent);
      if (!feedback.includes('相手が「そう／違う」と直せる余白')) throw new Error(`kiku-chikara correct feedback missing at ${i + 1}: ${feedback}`);
      await page.click('#next');
    }
    await page.waitForSelector('#done:not(.hidden)');
    const result = await page.$eval('.result', (el) => el.textContent.replace(/\s+/g, ' '));
    if (!result.includes('6/6')) throw new Error(`kiku-chikara result missing 6/6: ${result}`);

    await page.click('#toReal');
    await page.type('#topic', '最近、仕事がしんどくて');
    await page.click('#build');
    await page.waitForSelector('#plan:not(.hidden)');
    const plan = await page.$eval('#plan', (el) => el.textContent);
    if (!plan.includes('要約') || !plan.includes('開いた質問')) throw new Error('kiku-chikara REAL plan incomplete');

    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#home:not(.hidden)');
    const homeHref = await page.$eval('.top a', (el) => el.getAttribute('href'));
    if (homeHref !== '/') throw new Error(`kiku-chikara exit link mismatch: ${homeHref}`);
    console.log('QUALITY 303 VERIFIED: first visit, mobile, advice trap, 18 correct listening steps, completion, REAL mode, reload reset, exit link.');
  } finally {
    await page.close();
  }
}

async function verifyLifeRpg() {
  const page = await freshPage('/apps/life-rpg-status/');
  try {
    await page.waitForSelector('#start', { visible: true });
    const homeText = await page.$eval('#home', (el) => el.textContent.replace(/\s+/g, ' '));
    if (!homeText.includes('42問') || !homeText.includes('6軸')) throw new Error(`life-rpg-status new copy missing: ${homeText.slice(0, 240)}`);
    await page.click('#start');
    for (let i = 0; i < 42; i += 1) {
      await page.waitForSelector('#quiz:not(.hidden) .scale button:nth-child(3)');
      await page.click('#quiz .scale button:nth-child(3)');
    }
    await page.waitForSelector('#result:not(.hidden)');
    const statCount = await page.$$eval('#stats .stat', (els) => els.length);
    const axisCount = await page.$$eval('#axes .axis', (els) => els.length);
    const styleCount = await page.$$eval('#styles .style-card', (els) => els.length);
    if (statCount !== 6 || axisCount !== 6 || styleCount !== 3) throw new Error(`life-rpg-status result counts wrong: stats=${statCount}, axes=${axisCount}, styles=${styleCount}`);
    for (const id of ['environment','risk','experiment']) {
      const text = await page.$eval(`#${id}`, (el) => el.textContent.trim());
      if (!text) throw new Error(`life-rpg-status ${id} empty`);
    }

    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#home:not(.hidden)');
    await page.click('#lastBtn');
    await page.waitForSelector('#result:not(.hidden)');
    const history = await page.$eval('#history', (el) => el.textContent);
    if (!history.includes('保存日')) throw new Error(`life-rpg-status revisit history missing: ${history}`);
    const homeHref = await page.$eval('.top a', (el) => el.getAttribute('href'));
    if (homeHref !== '/') throw new Error(`life-rpg-status exit link mismatch: ${homeHref}`);
    console.log('QUALITY 301 VERIFIED: first visit, mobile, 42-question completion, 6-axis results, 3 style combinations, environment/risk/experiment, reload and previous-result revisit, exit link.');
  } finally {
    await page.close();
  }
}

try {
  await verifyLifeRpg();
  await verifyMindReading();
  await verifyListening();

  const page = await browser.newPage();
  page.on('console', (message) => console.log(`[browser:feedback:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => console.log(`[browser:feedback:pageerror] ${error.message}`));
  await page.goto(`${base}/apps/smartphone-escape/?feedback-smoke=${Date.now()}`, {
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
    const baseId = (`fbsmoke${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`)
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 32);
    const serverTime = () => window.firebase.firestore.FieldValue.serverTimestamp();
    const ids = [];
    for (let index = 0; index < 2; index += 1) {
      const id = `${baseId}${String(index + 1).padStart(2, '0')}`.slice(0, 40);
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
  await page.close();
} finally {
  await browser.close();
}
