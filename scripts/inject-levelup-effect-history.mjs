import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const marker = 'data-levelup-effect-history';
let patched = 0;
let missing = 0;

if (!fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP apps not found. Run build:hosting first.');
}

function runtimeFor(slug) {
  return `
<script ${marker} data-slug="${slug}">
(() => {
  if (window.__LEVELUP_EFFECT_HISTORY_V1__) return;
  window.__LEVELUP_EFFECT_HISTORY_V1__ = true;
  const slug = document.currentScript?.dataset?.slug || '';
  if (!slug) return;
  const key = 'levelup:quality:' + slug;

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch { return {}; }
  };

  const syncCard = () => {
    const card = document.querySelector('[data-luq-effect-card]');
    const kicker = card?.querySelector('.luq-effect-kicker');
    if (!kicker) return false;
    const state = readState();
    const yes = Number(state.responses?.yes || 0);
    const no = Number(state.responses?.no || 0);
    const total = yes + no;
    kicker.textContent = total ? 'この1回の効果 · これまで ' + yes + '/' + total + '回で変化' : 'この1回の効果';
    kicker.title = total ? '端末内に保存した、このアプリの効果回答履歴' : 'このアプリを使った直後の変化を記録';
    return true;
  };

  const observer = new MutationObserver(() => syncCard());
  observer.observe(document.body, { childList: true, subtree: true });
  syncCard();

  window.addEventListener('levelup:quality-feedback', (event) => {
    if (event.detail?.slug && event.detail.slug !== slug) return;
    syncCard();
    const answer = event.detail?.answer === 'yes' ? 'yes' : event.detail?.answer === 'no' ? 'no' : '';
    if (!answer) return;
    try {
      window.LevelUpTelemetry?.action?.('effect-' + answer);
      window.LevelUpTelemetry?.complete?.('effect-check');
    } catch {}
  });
})();
</script>`;
}

for (const [slug, meta] of Object.entries(GAME_META)) {
  if (meta?.[0] !== 'levelup') continue;
  const indexPath = path.join(appsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) {
    missing += 1;
    continue;
  }
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes(marker)) {
    const runtime = runtimeFor(slug);
    html = html.includes('</body>') ? html.replace('</body>', `${runtime}\n</body>`) : html + runtime;
    fs.writeFileSync(indexPath, html);
  }
  patched += 1;
}

if (patched < 20) {
  throw new Error(`LEVEL UP effect history reached only ${patched} apps.`);
}

console.log(`[Firebase] LEVEL UP effect history: ${patched} apps ready${missing ? `, ${missing} catalog entries not present` : ''}`);
