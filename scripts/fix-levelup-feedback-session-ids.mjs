import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const from = 'const ref=db.collection("levelupSessions").doc();batch.set(ref,';
const to = 'const docId=(batchId+String(i+1).padStart(2,"0")).slice(0,40);const ref=db.collection("levelupSessions").doc(docId);batch.set(ref,';
const fallbackResultFrom = 'return{ok:true,fallback:true,transport:"levelup-feedback-session-fallback"}';
const fallbackResultTo = 'return{ok:true,id:"session-"+batchId,fallback:true,transport:"levelup-feedback-session-fallback"}';
const submitFrom = 'const result=await submit(payload);if(!result?.ok)throw new Error("SEND_FAILED");textarea.value="";status.textContent="送信しました。";';
const submitTo = 'const result=await submit(payload);if(!result?.ok)throw new Error("SEND_FAILED");window.dispatchEvent(new CustomEvent("levelup-feedback-submitted",{detail:{id:result.id||"",payload}}));textarea.value="";status.textContent="送信しました。";';
const historyMarker = 'data-levelup-feedback-history-v1';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function historySnippet() {
  return `
<style ${historyMarker}>
  #lu-fb-history{margin:12px 0;padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:13px;background:rgba(255,255,255,.025)}
  #lu-fb-history .lu-fb-history-title{font-size:10px;font-weight:950;letter-spacing:.1em;color:#aab2a5;margin-bottom:7px}
  #lu-fb-history .lu-fb-history-list{display:grid;gap:6px}
  #lu-fb-history .lu-fb-history-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 9px;border-radius:10px;background:#0a0d09;border:1px solid rgba(255,255,255,.07)}
  #lu-fb-history .lu-fb-history-copy{min-width:0;font-size:10px;line-height:1.4;color:#dfe4da;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #lu-fb-history .lu-fb-history-state{font-size:9px;font-weight:950;white-space:nowrap;color:#aab2a5}
  #lu-fb-history .lu-fb-history-state.published{color:#d8ff5b}
  #lu-fb-history .lu-fb-history-state.rejected{color:#ffb7a7}
  #lu-fb-history .lu-fb-history-empty{font-size:10px;color:#7f8776}
</style>
<script ${historyMarker}>
(() => {
  if (window.__LEVELUP_FEEDBACK_HISTORY_V1__) return;
  window.__LEVELUP_FEEDBACK_HISTORY_V1__ = true;
  const key = 'levelup-feedback-history-v1';
  const script = document.querySelector('script[data-levelup-feedback-v1]');
  const appSlug = script?.dataset.appSlug || 'home';
  const root = document.getElementById('levelup-feedback-root');
  const panel = root?.querySelector('#lu-fb-panel');
  const statusNode = root?.querySelector('#lu-fb-status');
  const fab = root?.querySelector('#lu-fb-fab');
  if (!panel || !statusNode) return;

  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const write = (items) => {
    try { localStorage.setItem(key, JSON.stringify(items.slice(0, 40))); } catch {}
  };
  const escapeHtml = (value) => String(value || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const host = document.createElement('div');
  host.id = 'lu-fb-history';
  host.innerHTML = '<div class="lu-fb-history-title">改善履歴</div><div class="lu-fb-history-list"></div>';
  panel.insertBefore(host, statusNode);
  const list = host.querySelector('.lu-fb-history-list');

  const labelFor = (status) => {
    if (status === 'published') return ['✓ 公開済み','published'];
    if (status === 'rejected') return ['未反映','rejected'];
    if (status === 'processing') return ['対応中',''];
    return ['受付済み',''];
  };
  const render = (items) => {
    const current = items.filter((item) => item.appSlug === appSlug).slice(0, 5);
    if (!current.length) {
      list.innerHTML = '<div class="lu-fb-history-empty">このアプリの改善依頼はまだありません。</div>';
      return;
    }
    list.innerHTML = current.map((item) => {
      const [label, klass] = labelFor(item.status);
      return '<div class="lu-fb-history-item"><div class="lu-fb-history-copy">' + escapeHtml(item.message || '改善依頼') + '</div><div class="lu-fb-history-state ' + klass + '">' + label + '</div></div>';
    }).join('');
  };

  const statusUrl = (id) => 'https://firestore.googleapis.com/v1/projects/hitobito-levelup/databases/(default)/documents/levelupFeedbackStatus/' + encodeURIComponent(id);
  const refresh = async () => {
    const items = read();
    render(items);
    const current = items.filter((item) => item.appSlug === appSlug && item.id).slice(0, 5);
    let changed = false;
    await Promise.all(current.map(async (item) => {
      try {
        const response = await fetch(statusUrl(item.id) + '?t=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) return;
        const doc = await response.json();
        const next = doc?.fields?.status?.stringValue || '';
        if (next && next !== item.status) { item.status = next; changed = true; }
      } catch {}
    }));
    if (changed) write(items);
    render(items);
  };

  window.addEventListener('levelup-feedback-submitted', (event) => {
    const detail = event.detail || {};
    const id = String(detail.id || '');
    const payload = detail.payload || {};
    if (!id) return;
    const items = read().filter((item) => item.id !== id);
    items.unshift({
      id,
      appSlug: String(payload.appSlug || appSlug),
      message: String(payload.message || '').slice(0, 120),
      status: 'queued',
      createdAt: new Date().toISOString(),
    });
    write(items);
    render(items);
  });
  fab?.addEventListener('click', () => setTimeout(refresh, 20));
  refresh();
})();
</script>`;
}

let patched = 0;
let historyPatched = 0;
for (const file of walk(outDir)) {
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('levelup-feedback-session-fallback')) continue;

  if (html.includes(from)) html = html.replaceAll(from, to);
  else if (!html.includes(to)) throw new Error(`Feedback fallback session-id pattern missing in ${file}`);

  if (html.includes(fallbackResultFrom)) html = html.replaceAll(fallbackResultFrom, fallbackResultTo);
  else if (!html.includes(fallbackResultTo)) throw new Error(`Feedback fallback result-id pattern missing in ${file}`);

  if (html.includes(submitFrom)) html = html.replaceAll(submitFrom, submitTo);
  else if (!html.includes('levelup-feedback-submitted')) throw new Error(`Feedback submitted-event pattern missing in ${file}`);

  if (!html.includes(historyMarker)) {
    html = html.includes('</body>') ? html.replace('</body>', `${historySnippet()}\n</body>`) : `${html}${historySnippet()}`;
    historyPatched += 1;
  }

  fs.writeFileSync(file, html);
  patched += 1;
}

if (!patched) throw new Error('No LEVEL UP feedback fallback pages were patched.');
if (!historyPatched && !walk(outDir).some((file) => fs.readFileSync(file, 'utf8').includes(historyMarker))) {
  throw new Error('No LEVEL UP feedback history panels were patched.');
}
console.log(`[Firebase] LEVEL UP feedback fallback now uses explicit lowercase session IDs on ${patched} HTML pages.`);
console.log(`[Firebase] LEVEL UP feedback history now distinguishes requested vs actually published changes on ${patched} HTML pages.`);

// Keep LEVEL UP maker wording aligned with OneShotGames: a request becomes
// "published" only after its production page is live, and the UI says exactly that.
const makerPath = path.join(outDir, 'levelup-maker.js');
if (!fs.existsSync(makerPath)) throw new Error('LEVEL UP maker asset missing.');
let maker = fs.readFileSync(makerPath, 'utf8');
const makerFrom = "if (status === 'published') return '公開中';";
const makerTo = "if (status === 'published') return '✓ 公開済み';";
if (maker.includes(makerFrom)) maker = maker.replace(makerFrom, makerTo);
else if (!maker.includes(makerTo)) throw new Error('LEVEL UP maker published-label pattern missing.');
fs.writeFileSync(makerPath, maker);

const makerVersion = createHash('sha256').update(maker).digest('hex').slice(0, 12);
const makerHomePath = path.join(outDir, 'index.html');
let makerHome = fs.readFileSync(makerHomePath, 'utf8');
if (!/\/levelup-maker\.js\?v=[a-f0-9]{12}/.test(makerHome)) throw new Error('LEVEL UP maker versioned script tag missing.');
makerHome = makerHome.replace(/\/levelup-maker\.js\?v=[a-f0-9]{12}/, `/levelup-maker.js?v=${makerVersion}`);
fs.writeFileSync(makerHomePath, makerHome);
console.log(`[Firebase] LEVEL UP maker published status label patched (asset ${makerVersion}).`);

// Feedback #293: do not reveal the preferred answer before the user chooses.
// The previous markup added `good` to every negative-stress option at render time,
// which looked like a pre-selected answer and also exposed the intended answer.
const maaIikaPath = path.join(outDir, 'maa-iika', 'index.html');
if (!fs.existsSync(maaIikaPath)) throw new Error('maa-iika production page missing.');
let maaIika = fs.readFileSync(maaIikaPath, 'utf8');
const preselectedChoice = 'class="choice ${c[1]<0?\'good\':\'\'}"';
if (!maaIika.includes(preselectedChoice)) throw new Error('maa-iika preselected choice pattern missing.');
maaIika = maaIika.replace(preselectedChoice, 'class="choice"');
fs.writeFileSync(maaIikaPath, maaIika);
console.log('[Firebase] maa-iika no longer pre-highlights the preferred choice.');

// Feedback #294: keep Negotiator apps available at their direct URLs, but remove
// the whole series from the LEVEL UP home catalog so it does not crowd discovery.
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) throw new Error('LEVEL UP home/catalog missing.');
let home = fs.readFileSync(homePath, 'utf8');
const negotiatorCard = /\s*<article class="card[^"]*" data-game="negotiator-[^"]+"[\s\S]*?<\/article>/g;
const beforeHome = home;
home = home.replace(negotiatorCard, '');
if (home === beforeHome) throw new Error('No Negotiator cards were found on LEVEL UP home.');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');
const beforeCount = catalog.games.length;
catalog.games = catalog.games.filter((game) => !String(game?.slug || '').startsWith('negotiator-'));
const removedCount = beforeCount - catalog.games.length;
if (removedCount < 1) throw new Error('No Negotiator entries were found in LEVEL UP catalog.');
const visibleCount = catalog.games.length;
home = home.replace(/<strong>\d+<\/strong><span>TRAINING GAMES<\/span>/, `<strong>${visibleCount}</strong><span>TRAINING GAMES</span>`);
home = home.replace(/<span>\d+ games<\/span>/, `<span>${visibleCount} games</span>`);
fs.writeFileSync(homePath, home);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`[Firebase] removed ${removedCount} Negotiator cards from LEVEL UP home discovery; visible=${visibleCount}.`);

// App creation requests now use the authenticated 5-step LEVEL UP maker injected
// by scripts/inject-levelup-maker.mjs. Do not inject the legacy anonymous,
// single-textarea app-request widget here; public apps remain login-free, while
// creating a new app is intentionally tied to the signed-in user's account.
await import('./apply-levelup-queue-improvements.mjs');
await import('./validate-levelup-maker-only-request-flow.mjs');