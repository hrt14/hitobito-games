import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const appsDir = path.join(outDir, 'apps');
const marker = 'data-levelup-session-telemetry';
const buildSha = String(process.env.GITHUB_SHA || 'local').slice(0, 12);

if (!fs.existsSync(appsDir)) throw new Error('Firebase LEVEL UP apps bundle not found.');

function scriptFor(slug) {
  return `
<script ${marker} data-game="${slug}" data-build="${buildSha}">
(() => {
  if (window.__LEVELUP_SESSION_TELEMETRY__) return;
  window.__LEVELUP_SESSION_TELEMETRY__ = true;
  const script = document.currentScript;
  const slug = script.dataset.game || '';
  const buildSha = script.dataset.build || 'local';
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return;

  const sessionId = (crypto.randomUUID ? crypto.randomUUID().replaceAll('-', '') : (Date.now().toString(36) + Math.random().toString(36).slice(2))).slice(0, 40);
  let db = null;
  let ref = null;
  let lastAction = 'start';
  let lastStep = 'start';
  let completed = false;
  let initialized = false;

  const safeToken = (value, fallback = '') => String(value || fallback).toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback;
  const inferStep = (target) => {
    const node = target?.closest?.('[data-step],[data-question-index],[data-round],[data-stage]');
    if (!node) return lastStep;
    return safeToken(node.dataset.step || node.dataset.questionIndex || node.dataset.round || node.dataset.stage, lastStep);
  };
  const inferAction = (target) => {
    const node = target?.closest?.('[data-answer],[data-action],[data-choice],button,a,[role="button"]');
    if (!node) return lastAction;
    const kind = node.dataset.answer ? 'answer' : node.dataset.action ? 'action' : node.dataset.choice ? 'choice' : node.tagName?.toLowerCase() || 'tap';
    const value = node.dataset.answer || node.dataset.action || node.dataset.choice || node.id || node.getAttribute?.('aria-label') || node.classList?.[0] || 'tap';
    return safeToken(kind, 'tap') + ':' + safeToken(value, 'tap');
  };
  const waitForFirestore = (attempt = 0) => {
    if (window.firebase?.firestore && firebase.apps?.length) {
      try {
        db = firebase.firestore();
        ref = db.collection('levelupSessions').doc(sessionId);
        ref.set({
          slug, buildSha, status: 'active', lastStep, lastAction,
          startedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
        }).then(() => { initialized = true; }).catch((error) => console.warn('[LEVEL UP session] start failed', error));
      } catch (error) { console.warn('[LEVEL UP session]', error); }
      return;
    }
    if (attempt < 40) setTimeout(() => waitForFirestore(attempt + 1), 250);
  };
  const update = (status) => {
    if (!initialized || !ref) return;
    ref.update({
      status: completed ? 'completed' : status,
      lastStep,
      lastAction,
      lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).catch((error) => console.warn('[LEVEL UP session] update failed', error));
  };

  document.addEventListener('click', (event) => {
    lastAction = inferAction(event.target);
    lastStep = inferStep(event.target);
    const node = event.target?.closest?.('[data-complete="true"],[data-action="complete"],[data-action="finish"]');
    if (node) { completed = true; update('completed'); }
  }, true);

  document.addEventListener('visibilitychange', () => {
    update(document.visibilityState === 'hidden' ? 'left' : 'active');
  });

  window.LevelUpTelemetry = Object.freeze({
    step(stepId) { lastStep = safeToken(stepId, lastStep); },
    action(actionId) { lastAction = 'action:' + safeToken(actionId, 'unknown'); },
    complete(stepId = 'complete') { lastStep = safeToken(stepId, 'complete'); completed = true; update('completed'); },
  });

  waitForFirestore();
})();
</script>`;
}

let injected = 0;
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(marker) || !html.includes('</body>')) continue;
  html = html.replace('</body>', `${scriptFor(entry.name)}</body>`);
  fs.writeFileSync(indexPath, html);
  injected += 1;
}

if (!injected) throw new Error('LEVEL UP session telemetry was not injected into any app.');
console.log(`[Firebase] LEVEL UP session telemetry injected into ${injected} apps (build ${buildSha}).`);
