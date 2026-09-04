import fs from 'node:fs';

const url = 'https://levelup.hitobito.jp/apps/energy-bucket/?production-smoke=1';
const targetRes = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
if (!targetRes.ok) throw new Error(`Could not create Chrome target: ${targetRes.status}`);
const target = await targetRes.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let seq = 0;
const pending = new Map();
const pageExceptions = [];
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
    else resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const detail = msg.params?.exceptionDetails;
    pageExceptions.push({ text: detail?.text || 'exception', url: detail?.url || '', line: detail?.lineNumber });
  }
});

function call(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(condition, message) { if (!condition) throw new Error(message); }

async function evalJs(expression) {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`Browser eval failed: ${result.exceptionDetails.text}`);
  return result.result?.value;
}

async function waitFor(expression, label, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { if (await evalJs(expression)) return; } catch {}
    await sleep(120);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function navigate() {
  await call('Page.navigate', { url });
  await waitFor(`document.readyState !== 'loading' && document.querySelectorAll('.leak-card').length === 10`, 'energy-bucket DOM');
}

await call('Page.enable');
await call('Runtime.enable');
await call('Network.enable');
await navigate();
await evalJs(`localStorage.removeItem('levelup:energy-bucket:v1')`);
await call('Page.reload', { ignoreCache: true });
await waitFor(`document.readyState !== 'loading' && document.querySelectorAll('.leak-card').length === 10`, 'clean first visit');

assert((await evalJs(`document.querySelector('h1')?.innerText || ''`)).includes('漏れを1個ふさぐ'), 'First-view promise is not visible.');
assert(await evalJs(`document.querySelectorAll('.leak-card').length`) === 10, 'Expected 10 leak choices.');
assert(await evalJs(`document.querySelector('#toChoose')?.disabled === true`), 'Continue should be disabled before selection.');
assert(await evalJs(`document.documentElement.scrollWidth <= window.innerWidth + 1`), 'Mobile page overflows horizontally.');

await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await evalJs(`document.querySelector('.leak-card[data-key="postLunchSleepy"]').click()`);
await evalJs(`document.querySelector('.leak-card[data-key="nightPhone"]').click()`);
await sleep(150);
assert((await evalJs(`document.querySelector('#leakCounter').innerText`)).includes('2 / 10'), 'Leak counter did not update.');
assert(await evalJs(`document.querySelectorAll('#holeLayer i').length`) === 2, 'Bucket holes did not respond.');

await evalJs(`document.querySelector('#toChoose').click()`);
await waitFor(`!document.querySelector('#chooseView').hidden`, 'recommendation view');
assert(await evalJs(`document.querySelectorAll('.recommendation').length`) === 2, 'Recommendation count is wrong.');
assert((await evalJs(`document.querySelector('.recommendation').innerText`)).includes('食後2分だけ歩く'), 'Top recommendation is unexpected.');

await evalJs(`document.querySelector('[data-back="check"]').click()`);
await waitFor(`!document.querySelector('#checkView').hidden`, 'back to check');
assert((await evalJs(`document.querySelector('#leakCounter').innerText`)).includes('2 / 10'), 'Back navigation lost selections.');
await evalJs(`document.querySelector('#toChoose').click()`);
await waitFor(`!document.querySelector('#chooseView').hidden`, 'recommendation after back');
await evalJs(`document.querySelector('.recommendation').click()`);
await waitFor(`!document.querySelector('#planView').hidden`, 'plan view');
assert((await evalJs(`document.querySelector('#triggerInput').value`)).includes('昼食'), 'IF trigger was not prefilled.');
assert((await evalJs(`document.querySelector('#actionInput').value`)).includes('2分'), 'THEN action was not prefilled.');

await evalJs(`document.querySelector('[data-back="choose"]').click()`);
await waitFor(`!document.querySelector('#chooseView').hidden`, 'back to choose');
await evalJs(`document.querySelector('.recommendation').click()`);
await waitFor(`!document.querySelector('#planView').hidden`, 'plan view second time');
await evalJs(`(() => { const a=document.querySelector('#triggerInput'); a.value='昼食を食べ終えたら'; a.dispatchEvent(new Event('input',{bubbles:true})); const b=document.querySelector('#actionInput'); b.value='2分だけ軽く歩く'; b.dispatchEvent(new Event('input',{bubbles:true})); })()`);
await evalJs(`document.querySelector('#savePlan').click()`);
await waitFor(`!document.querySelector('#doneView').hidden`, 'result view');
assert((await evalJs(`document.querySelector('#resultLeak').innerText`)).includes('昼食後'), 'Result lost selected leak.');
assert((await evalJs(`document.querySelector('#resultThen').innerText`)).includes('2分だけ軽く歩く'), 'Result lost action.');

await call('Page.reload', { ignoreCache: true });
await waitFor(`document.readyState !== 'loading' && !document.querySelector('#returnCard').hidden`, 'saved plan after reload');
assert((await evalJs(`document.querySelector('#lastRule').innerText`)).includes('2分だけ軽く歩く'), 'Saved plan did not survive reload.');
await evalJs(`document.querySelector('#markNotYet').click()`);
assert((await evalJs(`document.querySelector('#lastCount').innerText`)).includes('成功 0日'), 'Not-yet path added success.');
await evalJs(`document.querySelector('#markDone').click()`);
assert((await evalJs(`document.querySelector('#lastCount').innerText`)).includes('成功 1日'), 'Done path did not add success.');

await evalJs(`document.querySelector('.leak-card[data-key="stairsBreathless"]').click()`);
await waitFor(`!document.querySelector('#safetyNote').hidden`, 'breathlessness safety branch');
assert((await evalJs(`document.querySelector('#safetyNote').innerText`)).includes('医療機関'), 'Safety branch lacks medical guidance.');
assert(await evalJs(`document.querySelector('.brand').getAttribute('href')`) === '/', 'LEVEL UP home exit is missing.');
assert(await evalJs(`document.documentElement.scrollWidth <= window.innerWidth + 1`), 'Mobile page overflows after interaction.');

const appExceptions = pageExceptions.filter((item) => /energy-bucket|app\.js/i.test(item.url || ''));
assert(appExceptions.length === 0, `App exceptions: ${JSON.stringify(appExceptions)}`);

fs.mkdirSync('apps/energy-bucket/.artifacts', { recursive: true });
const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
fs.writeFileSync('apps/energy-bucket/.artifacts/production-cdp.png', Buffer.from(shot.data, 'base64'));
const report = {
  status: 'PASS', url, viewport: '390x844',
  checks: ['live route', '10 leak choices', 'bucket interaction', 'recommendation ranking', 'back navigation', 'IF-THEN save', 'reload persistence', 'done/not-yet', 'breathlessness safety', 'mobile overflow', 'LEVEL UP exit', 'no app exceptions']
};
fs.writeFileSync('apps/energy-bucket/.artifacts/production-report.json', JSON.stringify(report, null, 2) + '\n');
console.log('ENERGY BUCKET PRODUCTION CHROME FLOW PASS');
console.log(JSON.stringify(report));
ws.close();
