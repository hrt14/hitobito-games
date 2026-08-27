import { spawn, execFileSync } from 'node:child_process';

const url = process.env.NEGOTIATOR_URL || 'https://hitobito-levelup.web.app/apps/negotiator-move/';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitFor(fn, { timeout = 15000, interval = 250, label = 'condition' } = {}) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(interval);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

const response = await fetch(url, { redirect: 'follow', cache: 'no-store' });
assert(response.ok, `Production URL returned HTTP ${response.status}`);
const html = await response.text();
assert(html.includes('NEGOTIATOR'), 'Production HTML is missing NEGOTIATOR');
assert(html.includes('交渉を始める'), 'Production HTML is missing the primary CTA');
assert(html.includes('30分 → 1動作'), 'Production HTML is missing the shrinking-demand promise');

let chrome;
for (const candidate of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
  try {
    const resolved = execFileSync('which', [candidate], { encoding: 'utf8' }).trim();
    if (resolved) { chrome = resolved; break; }
  } catch {}
}
assert(chrome, 'No Chrome/Chromium binary found on runner');

const chromeProc = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/negotiator-chrome-profile',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let browserWs;
try {
  browserWs = await waitFor(async () => {
    const r = await fetch('http://127.0.0.1:9222/json/version');
    if (!r.ok) return null;
    const data = await r.json();
    return data.webSocketDebuggerUrl;
  }, { label: 'Chrome DevTools endpoint' });

  const created = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  assert(created.ok, `Could not create Chrome target: ${created.status}`);
  const target = await created.json();
  assert(target.webSocketDebuggerUrl, 'Chrome target has no websocket URL');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP websocket open timeout')), 10000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP websocket error')); }, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const pageErrors = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params?.exceptionDetails?.text || 'Runtime exception');
    }
    if (msg.method === 'Log.entryAdded' && msg.params?.entry?.level === 'error') {
      pageErrors.push(msg.params.entry.text || 'Console error');
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || `JS evaluation failed: ${expression}`);
    return result.result?.value;
  };

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });
  await send('Page.navigate', { url });

  await waitFor(() => evaluate(`document.readyState === 'complete' && !!document.getElementById('startBtn')`), { label: 'NEGOTIATOR DOM ready' });
  assert(await evaluate('document.title'), 'Page title is empty');
  assert((await evaluate('document.title')).includes('NEGOTIATOR'), 'Production title does not contain NEGOTIATOR');
  assert(await evaluate(`document.querySelectorAll('.screen.active').length === 1 && document.getElementById('startScreen').classList.contains('active')`), 'Start screen is not the single active screen');

  await evaluate(`document.getElementById('startBtn').click()`);
  await waitFor(() => evaluate(`document.getElementById('targetScreen').classList.contains('active')`), { label: 'target screen' });
  assert((await evaluate(`document.querySelectorAll('[data-target]').length`)) === 4, 'Expected four target categories');

  await evaluate(`document.querySelector('[data-target="work"]').click()`);
  await waitFor(() => evaluate(`document.getElementById('dealScreen').classList.contains('active')`), { label: 'deal screen' });
  assert((await evaluate(`document.getElementById('askValue').innerText`)).includes('30'), 'Initial ask is not 30 MIN');
  assert((await evaluate(`document.getElementById('choices').querySelectorAll('.choice').length`)) === 3, 'Deal round does not show three choices');

  const expected = ['5', '60', '10', '1'];
  for (const value of expected) {
    await evaluate(`document.querySelector('[data-choice="0"]').click()`);
    await waitFor(() => evaluate(`document.getElementById('askValue').innerText.includes('${value}')`), { label: `ask ${value}` });
  }
  assert((await evaluate(`document.getElementById('rejectCount').textContent`)) === '0', 'Result should not be active before acceptance');

  await evaluate(`document.querySelector('[data-choice="2"]').click()`);
  await waitFor(() => evaluate(`document.getElementById('actionScreen').classList.contains('active')`), { label: 'action screen' });
  assert((await evaluate(`document.getElementById('settledText').textContent`)).includes('1 MOVE'), 'Settled offer should be 1 MOVE');
  assert((await evaluate(`document.getElementById('timerNum').textContent`)) === '10', '10-second action timer is missing');

  await evaluate(`document.getElementById('alreadyBtn').click()`);
  await waitFor(() => evaluate(`document.getElementById('doneScreen').classList.contains('active')`), { label: 'result screen' });
  assert((await evaluate(`document.getElementById('rejectCount').textContent`)) === '4', 'Expected four rejected offers');
  assert((await evaluate(`document.getElementById('yesCount').textContent`)) === '1', 'Expected one YES');
  assert((await evaluate(`document.getElementById('resultDeal').textContent`)) === '1 MOVE', 'Result does not preserve settled offer');

  await evaluate(`document.getElementById('againBtn').click()`);
  await waitFor(() => evaluate(`document.getElementById('targetScreen').classList.contains('active')`), { label: 'replay target screen' });

  await evaluate(`document.querySelector('[data-target="study"]').click()`);
  await waitFor(() => evaluate(`document.getElementById('dealScreen').classList.contains('active')`), { label: 'second deal screen' });
  await evaluate(`document.querySelector('#dealScreen [data-exit]').click()`);
  await waitFor(() => evaluate(`document.getElementById('exitScreen').classList.contains('active')`), { label: 'exit screen' });
  assert((await evaluate(`document.querySelector('#exitScreen p').textContent`)).includes('それも選択'), 'Exit copy should preserve user agency');

  const bodyWidth = await evaluate('document.documentElement.scrollWidth');
  assert(bodyWidth <= 390, `Mobile viewport has horizontal overflow: ${bodyWidth}px`);

  await sleep(800);
  const meaningfulErrors = pageErrors.filter((text) => !/favicon|ERR_BLOCKED_BY_CLIENT/i.test(text));
  assert(meaningfulErrors.length === 0, `Browser errors detected: ${meaningfulErrors.join(' | ')}`);

  console.log(JSON.stringify({
    ok: true,
    url,
    viewport: '390x844@3x',
    flow: 'start > work > NO x4 > 1 MOVE > action > result > replay > exit',
    rejects: 4,
    yes: 1,
    horizontalOverflow: false,
    browserErrors: 0,
  }, null, 2));
  ws.close();
} finally {
  chromeProc.kill('SIGTERM');
}
