import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const appsDir = path.join(outDir, 'apps');
const marker = 'data-levelup-daily-report-v1';

if (!fs.existsSync(homePath) || !fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP bundle not found.');
}

const needs = {
  meeting: { label: '会議', terms: ['会議', 'ミーティング', '打ち合わせ'] },
  tired: { label: '疲れ', terms: ['疲れ', '疲労', 'ぐったり'] },
  procrastination: { label: '先延ばし', terms: ['先延ばし', '後回し', 'やる気'] },
  relationships: { label: '人間関係', terms: ['人間関係', '上司', '部下', '同僚'] },
  refusal: { label: '断れない', terms: ['断れない', '断る', '頼まれ'] },
  work: { label: '仕事', terms: ['仕事', 'タスク', '業務'] },
  anxiety: { label: '不安', terms: ['不安', '心配', '怖い'] },
  sleep: { label: '睡眠', terms: ['睡眠', '寝る', '眠れ'] },
  comparison: { label: '比較', terms: ['比較', '比べ'] },
  depressed: { label: '落ち込み', terms: ['落ち込', 'へこむ', '失敗'] },
  anger: { label: '怒り', terms: ['怒り', 'イライラ', 'ムカつ'] },
  overwhelm: { label: '圧倒', terms: ['圧倒', '多すぎ', '全部嫌'] },
  motivation: { label: '行動', terms: ['動けない', '行動', '始められ'] },
  self: { label: '自分', terms: ['自分', '自己', '自信'] },
};

function scriptFor(slug, pageKind) {
  const needsJson = JSON.stringify(needs);
  return `
<script ${marker} data-slug="${slug}" data-page-kind="${pageKind}">
(() => {
  if (window.__LEVELUP_DAILY_REPORT_V1__) return;
  window.__LEVELUP_DAILY_REPORT_V1__ = true;

  const script = document.currentScript;
  const slug = script.dataset.slug || '';
  const pageKind = script.dataset.pageKind === 'home' ? 'home' : 'game';
  if (!/^(home|[a-z0-9-]{1,64})$/.test(slug)) return;

  const NEEDS = ${needsJson};
  const REPORT_COLLECTION = 'levelupDailyReports';
  const LOGIN_MARKER_COLLECTION = 'levelupReportLoginDays';
  const VISITOR_KEY = 'hitobito-levelup-visitor-v1';
  const startedAtMs = Date.now();
  let finalized = false;
  let db = null;
  let auth = null;

  const japanDay = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(new Date());
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return String(values.year || '') + String(values.month || '') + String(values.day || '');
    } catch {
      return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replaceAll('-', '');
    }
  };

  const safeVisitorId = () => {
    try {
      const value = localStorage.getItem(VISITOR_KEY) || '';
      return /^[a-z0-9]{16,40}$/.test(value) ? value : '';
    } catch { return ''; }
  };

  const title = (() => {
    const raw = document.querySelector('h1')?.textContent || document.title || slug;
    return String(raw).replace(/\\s+/g, ' ').trim().slice(0, 80) || slug;
  })();

  const day = japanDay();
  const reportRef = () => db.collection(REPORT_COLLECTION).doc(day);
  const gameRef = () => reportRef().collection('games').doc(slug);
  const needRef = (need) => reportRef().collection('needs').doc(need);
  const serverTime = () => firebase.firestore.FieldValue.serverTimestamp();

  const reportDefaults = () => ({
    date: day,
    sessions: 0,
    homeSessions: 0,
    gameSessions: 0,
    visitorUu: 0,
    loginUu: 0,
    searches: 0,
    completedGames: 0,
    leftGames: 0,
    gameDurationSec: 0,
  });

  const gameDefaults = () => ({
    date: day,
    slug,
    title,
    sessions: 0,
    completed: 0,
    left: 0,
    durationSec: 0,
  });

  const bump = (ref, defaults, delta) => db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? snap.data() : defaults();
    const next = { ...current };
    for (const [key, value] of Object.entries(delta)) {
      next[key] = Math.max(0, Number(current[key] || 0) + Number(value || 0));
    }
    next.lastUpdatedAt = serverTime();
    tx.set(ref, next);
  });

  const bumpReport = (delta) => bump(reportRef(), reportDefaults, delta)
    .catch((error) => console.warn('[LEVEL UP daily report] report write failed', error));

  const bumpGame = (delta) => {
    if (pageKind !== 'game') return Promise.resolve();
    return bump(gameRef(), gameDefaults, delta)
      .catch((error) => console.warn('[LEVEL UP daily report] game write failed', error));
  };

  const recordStart = async () => {
    let visitorUu = 0;
    const visitorId = safeVisitorId();
    if (visitorId) {
      const key = 'lu-report-visitor:' + day;
      try {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, visitorId);
          visitorUu = 1;
        }
      } catch {}
    }

    await bumpReport({
      sessions: 1,
      homeSessions: pageKind === 'home' ? 1 : 0,
      gameSessions: pageKind === 'game' ? 1 : 0,
      visitorUu,
    });
    if (pageKind === 'game') await bumpGame({ sessions: 1 });
  };

  const recordLoginUu = async (user) => {
    if (!user?.uid || !db) return;
    const markerRef = db.collection(LOGIN_MARKER_COLLECTION).doc(day).collection('users').doc(user.uid);
    try {
      await db.runTransaction(async (tx) => {
        const marker = await tx.get(markerRef);
        if (marker.exists) return;
        const ref = reportRef();
        const snap = await tx.get(ref);
        const current = snap.exists ? snap.data() : reportDefaults();
        tx.set(markerRef, { date: day, userId: user.uid, createdAt: serverTime() });
        tx.set(ref, { ...current, loginUu: Number(current.loginUu || 0) + 1, lastUpdatedAt: serverTime() });
      });
    } catch (error) {
      console.warn('[LEVEL UP daily report] login UU write failed', error);
    }
  };

  const durationSec = () => Math.min(86400, Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));

  const finalize = async (status) => {
    if (finalized || pageKind !== 'game') return;
    finalized = true;
    const duration = durationSec();
    const completed = status === 'completed' ? 1 : 0;
    const left = completed ? 0 : 1;
    await Promise.all([
      bumpReport({ completedGames: completed, leftGames: left, gameDurationSec: duration }),
      bumpGame({ completed, left, durationSec: duration }),
    ]);
  };

  const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/\\s+/g, ' ').trim().slice(0, 40);

  const recordSearch = async (raw) => {
    const query = normalize(raw);
    if (query.length < 2) return;
    const key = 'lu-report-search:' + day + ':' + query;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {}
    await bumpReport({ searches: 1 });
    const matches = Object.entries(NEEDS).filter(([, config]) => config.terms.some((term) => query.includes(term)));
    await Promise.all(matches.map(([need, config]) => {
      const defaults = () => ({ date: day, need, label: config.label, count: 0 });
      return bump(needRef(need), defaults, { count: 1 })
        .catch((error) => console.warn('[LEVEL UP daily report] need write failed', error));
    }));
  };

  const bind = () => {
    document.addEventListener('click', (event) => {
      const node = event.target?.closest?.('[data-complete="true"],[data-action="complete"],[data-action="finish"]');
      if (node) finalize('completed');
      const card = event.target?.closest?.('.card-link');
      const input = document.getElementById('levelup-search-input');
      if (card && input?.value?.trim()) recordSearch(input.value);
    }, true);

    const input = document.getElementById('levelup-search-input');
    if (input) {
      input.addEventListener('keydown', (event) => { if (event.key === 'Enter') recordSearch(input.value); });
      input.addEventListener('change', () => recordSearch(input.value));
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') finalize('left');
    });
    window.addEventListener('pagehide', () => finalize('left'));

    if (window.LevelUpTelemetry?.complete) {
      const original = window.LevelUpTelemetry.complete.bind(window.LevelUpTelemetry);
      try {
        window.LevelUpTelemetry = Object.freeze({
          ...window.LevelUpTelemetry,
          complete(stepId) {
            original(stepId);
            finalize('completed');
          },
        });
      } catch {}
    }
  };

  const begin = async () => {
    await recordStart();
    bind();
    try {
      auth?.onAuthStateChanged((user) => { if (user?.uid) recordLoginUu(user); });
      if (auth?.currentUser?.uid) recordLoginUu(auth.currentUser);
    } catch {}
  };

  const waitForFirebase = (attempt = 0) => {
    if (window.firebase?.firestore && firebase.apps?.length) {
      try {
        db = firebase.firestore();
        auth = firebase.auth ? firebase.auth() : null;
        begin();
      } catch (error) {
        console.warn('[LEVEL UP daily report] initialization failed', error);
      }
      return;
    }
    if (attempt < 60) setTimeout(() => waitForFirebase(attempt + 1), 250);
  };

  waitForFirebase();
})();
</script>`;
}

function inject(indexPath, slug, pageKind) {
  if (!fs.existsSync(indexPath)) return false;
  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(marker) || !html.includes('</body>')) return false;
  html = html.replace('</body>', `${scriptFor(slug, pageKind)}</body>`);
  fs.writeFileSync(indexPath, html);
  return true;
}

let injected = 0;
if (inject(homePath, 'home', 'home')) injected += 1;
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (inject(path.join(appsDir, entry.name, 'index.html'), entry.name, 'game')) injected += 1;
}

if (!injected) throw new Error('LEVEL UP daily report telemetry was not injected.');
console.log(`[Firebase] LEVEL UP daily report telemetry injected into ${injected} pages.`);
