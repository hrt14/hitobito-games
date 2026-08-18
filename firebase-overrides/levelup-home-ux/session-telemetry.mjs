import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const appsDir = path.join(outDir, 'apps');
const marker = 'data-levelup-session-telemetry';
const buildSha = String(process.env.GITHUB_SHA || 'local').slice(0, 12);

if (!fs.existsSync(homePath) || !fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP bundle not found.');
}

function scriptFor(slug, pageKind) {
  return `
<script ${marker} data-game="${slug}" data-page-kind="${pageKind}" data-build="${buildSha}">
(() => {
  if (window.__LEVELUP_SESSION_TELEMETRY__) return;
  window.__LEVELUP_SESSION_TELEMETRY__ = true;

  const script = document.currentScript;
  const slug = script.dataset.game || '';
  const pageKind = script.dataset.pageKind === 'home' ? 'home' : 'game';
  const buildSha = script.dataset.build || 'local';
  if (!/^(home|[a-z0-9-]{1,64})$/.test(slug)) return;

  const VISITOR_KEY = 'hitobito-levelup-visitor-v1';
  const HEARTBEAT_MS = 2 * 60 * 1000;
  const startedAtMs = Date.now();

  const randomId = () => {
    try {
      if (window.crypto?.randomUUID) return window.crypto.randomUUID().replaceAll('-', '').slice(0, 32);
    } catch {}
    return (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).replace(/[^a-z0-9]/g, '').slice(0, 32).padEnd(16, '0');
  };

  const getVisitorId = () => {
    try {
      const existing = localStorage.getItem(VISITOR_KEY) || '';
      if (/^[a-z0-9]{16,40}$/.test(existing)) return existing;
      const created = randomId();
      localStorage.setItem(VISITOR_KEY, created);
      return created;
    } catch {
      return randomId();
    }
  };

  const japanDay = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(new Date());
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return String(values.year || '') + String(values.month || '') + String(values.day || '');
    } catch {
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
      return now.toISOString().slice(0, 10).replaceAll('-', '');
    }
  };

  const visitorId = getVisitorId();
  const sessionId = randomId().slice(0, 40);
  let db = null;
  let auth = null;
  let ref = null;
  let currentUser = null;
  let identityKey = 'anonymous';
  let lastAction = 'start';
  let lastStep = 'start';
  let completed = false;
  let initialized = false;
  let heartbeat = null;

  const safeToken = (value, fallback = '') => String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || fallback;

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

  const identity = (user = currentUser) => ({
    userId: user?.uid || '',
    authState: user?.uid ? 'signed_in' : 'anonymous',
  });

  const durationSec = () => Math.min(86400, Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
  const serverTime = () => firebase.firestore.FieldValue.serverTimestamp();
  const increment = () => firebase.firestore.FieldValue.increment(1);

  const visitorRef = () => db.collection('levelupVisitors').doc(visitorId);
  const visitorDayRef = () => db.collection('levelupVisitorDays').doc(japanDay()).collection('visitors').doc(visitorId);
  const loginUserRef = (user) => db.collection('levelupLoginUsers').doc(user.uid);
  const loginDayRef = (user) => db.collection('levelupLoginDays').doc(japanDay()).collection('users').doc(user.uid);

  const recordVisitorSession = (user) => {
    if (!db) return;
    const id = identity(user);
    const common = { visitorId, ...id, lastSlug: slug, lastSeenAt: serverTime() };
    visitorRef().set({ ...common, sessionCount: increment() }, { merge: true })
      .catch((error) => console.warn('[LEVEL UP analytics] visitor write failed', error));
    visitorDayRef().set({ date: japanDay(), ...common, sessionCount: increment() }, { merge: true })
      .catch((error) => console.warn('[LEVEL UP analytics] visitor day write failed', error));
  };

  const recordLoginSession = (user) => {
    if (!db || !user?.uid) return;
    const common = { userId: user.uid, lastSlug: slug, lastSeenAt: serverTime() };
    loginUserRef(user).set({ ...common, sessionCount: increment() }, { merge: true })
      .catch((error) => console.warn('[LEVEL UP analytics] login user write failed', error));
    loginDayRef(user).set({ date: japanDay(), ...common, sessionCount: increment() }, { merge: true })
      .catch((error) => console.warn('[LEVEL UP analytics] login day write failed', error));
  };

  const touchPresence = (user) => {
    if (!db) return;
    const id = identity(user);
    visitorRef().set({ visitorId, ...id, lastSlug: slug, lastSeenAt: serverTime() }, { merge: true })
      .catch((error) => console.warn('[LEVEL UP analytics] visitor heartbeat failed', error));
    if (user?.uid) {
      loginUserRef(user).set({ userId: user.uid, lastSlug: slug, lastSeenAt: serverTime() }, { merge: true })
        .catch((error) => console.warn('[LEVEL UP analytics] login heartbeat failed', error));
    }
  };

  const update = (status = 'active') => {
    if (!initialized || !ref) return;
    const id = identity();
    ref.update({
      ...id,
      status: completed ? 'completed' : status,
      lastStep,
      lastAction,
      durationSec: durationSec(),
      lastSeenAt: serverTime(),
    }).catch((error) => console.warn('[LEVEL UP session] update failed', error));
    touchPresence(currentUser);
  };

  const resolveInitialUser = () => new Promise((resolve) => {
    if (!auth) { resolve(null); return; }
    let settled = false;
    let unsubscribe = () => {};
    const finish = (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { unsubscribe(); } catch {}
      resolve(user || null);
    };
    const timer = setTimeout(() => finish(auth.currentUser || null), 1800);
    try {
      unsubscribe = auth.onAuthStateChanged((user) => finish(user), () => finish(null));
    } catch {
      finish(auth.currentUser || null);
    }
  });

  const begin = async () => {
    currentUser = await resolveInitialUser();
    identityKey = currentUser?.uid || 'anonymous';
    const id = identity();
    ref = db.collection('levelupSessions').doc(sessionId);
    ref.set({
      slug,
      buildSha,
      status: 'active',
      lastStep,
      lastAction,
      visitorId,
      ...id,
      pageKind,
      durationSec: 0,
      startedAt: serverTime(),
      lastSeenAt: serverTime(),
    }).then(() => {
      initialized = true;
      recordVisitorSession(currentUser);
      if (currentUser?.uid) recordLoginSession(currentUser);
    }).catch((error) => console.warn('[LEVEL UP session] start failed', error));

    try {
      auth?.onAuthStateChanged((user) => {
        const nextKey = user?.uid || 'anonymous';
        if (nextKey === identityKey) return;
        const wasSignedIn = identityKey !== 'anonymous';
        identityKey = nextKey;
        currentUser = user || null;
        if (currentUser?.uid && !wasSignedIn) recordLoginSession(currentUser);
        update('active');
      });
    } catch {}

    heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') update('active');
    }, HEARTBEAT_MS);
  };

  const waitForFirebase = (attempt = 0) => {
    if (window.firebase?.firestore && firebase.apps?.length) {
      try {
        db = firebase.firestore();
        auth = firebase.auth ? firebase.auth() : null;
        begin();
      } catch (error) {
        console.warn('[LEVEL UP analytics] initialization failed', error);
      }
      return;
    }
    if (attempt < 60) setTimeout(() => waitForFirebase(attempt + 1), 250);
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

  window.addEventListener('pagehide', () => update(completed ? 'completed' : 'left'));
  window.addEventListener('pageshow', () => { if (!completed) update('active'); });

  window.LevelUpTelemetry = Object.freeze({
    step(stepId) { lastStep = safeToken(stepId, lastStep); },
    action(actionId) { lastAction = 'action:' + safeToken(actionId, 'unknown'); },
    complete(stepId = 'complete') {
      lastStep = safeToken(stepId, 'complete');
      completed = true;
      update('completed');
    },
  });

  waitForFirebase();

  window.addEventListener('unload', () => {
    if (heartbeat) clearInterval(heartbeat);
  });
})();
</script>`;
}

function injectPage(indexPath, slug, pageKind) {
  if (!fs.existsSync(indexPath)) return false;
  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(marker) || !html.includes('</body>')) return false;
  html = html.replace('</body>', `${scriptFor(slug, pageKind)}</body>`);
  fs.writeFileSync(indexPath, html);
  return true;
}

let injected = 0;
if (injectPage(homePath, 'home', 'home')) injected += 1;

for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (injectPage(indexPath, entry.name, 'game')) injected += 1;
}

if (!injected) throw new Error('LEVEL UP session telemetry was not injected into any page.');
console.log(`[Firebase] LEVEL UP audience + session telemetry injected into ${injected} pages (build ${buildSha}).`);
