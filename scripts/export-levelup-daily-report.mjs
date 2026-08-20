import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ID = 'hitobito-levelup';
const DB = '(default)';
const outDir = path.resolve('.dist/firebase/reports');
const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(DB)}/documents`;

function tokyoDay(offsetDays = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const noonUtc = new Date(`${v.year}-${v.month}-${v.day}T03:00:00Z`);
  noonUtc.setUTCDate(noonUtc.getUTCDate() + offsetDays);
  return noonUtc.toISOString().slice(0, 10).replaceAll('-', '');
}

function scalar(v) {
  if (!v || typeof v !== 'object') return null;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  return null;
}

function fields(doc) {
  return Object.fromEntries(Object.entries(doc?.fields || {}).map(([k, v]) => [k, scalar(v)]));
}

function unavailableDay(date, blockedReason = null) {
  return { date, available: false, metrics: null, games: [], needs: [], blockedReason };
}

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    const error = new Error(`GET ${url} -> ${res.status}`);
    error.status = res.status;
    error.reportCode = res.status === 403 && body.includes('SERVICE_DISABLED') && body.includes('firestore.googleapis.com')
      ? 'firestore_api_disabled'
      : 'firestore_unavailable';
    throw error;
  }
  return res.json();
}

async function loadDay(date) {
  const rootDoc = await getJson(`${base}/levelupDailyReports/${date}`);
  if (!rootDoc) return unavailableDay(date);
  const [gamesRaw, needsRaw] = await Promise.all([
    getJson(`${base}/levelupDailyReports/${date}/games?pageSize=100`),
    getJson(`${base}/levelupDailyReports/${date}/needs?pageSize=100`),
  ]);
  const games = (gamesRaw?.documents || []).map(fields).sort((a, b) => (b.sessions || 0) - (a.sessions || 0) || (b.completed || 0) - (a.completed || 0));
  const needs = (needsRaw?.documents || []).map(fields).sort((a, b) => (b.count || 0) - (a.count || 0));
  const metrics = fields(rootDoc);
  const gameSessions = Number(metrics.gameSessions || 0);
  const completedGames = Number(metrics.completedGames || 0);
  const gameDurationSec = Number(metrics.gameDurationSec || 0);
  return {
    date,
    available: true,
    metrics: {
      ...metrics,
      completionRate: gameSessions ? completedGames / gameSessions : null,
      avgGameDurationSec: gameSessions ? gameDurationSec / gameSessions : null,
    },
    games: games.map((g) => ({
      ...g,
      completionRate: g.sessions ? (g.completed || 0) / g.sessions : null,
      avgDurationSec: g.sessions ? (g.durationSec || 0) / g.sessions : null,
    })),
    needs,
    blockedReason: null,
  };
}

const reportDate = tokyoDay(-1);
const previousDate = tokyoDay(-2);
let current;
let previous;
let blockedReason = null;

try {
  [current, previous] = await Promise.all([loadDay(reportDate), loadDay(previousDate)]);
} catch (error) {
  blockedReason = error?.reportCode || 'firestore_unavailable';
  current = unavailableDay(reportDate, blockedReason);
  previous = unavailableDay(previousDate, blockedReason);
  console.warn(`[LEVEL UP report] Firestore unavailable: ${blockedReason}`);
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  timezone: 'Asia/Tokyo',
  current,
  previous,
  blockedReason,
  privacy: 'Aggregates only. No UID, raw search term, profile field, or visitor ID.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${reportDate}.json`), JSON.stringify(current, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(payload, null, 2) + '\n');
console.log(`Exported LEVEL UP report ${reportDate} (available=${current.available}, blocked=${blockedReason || 'none'})`);
