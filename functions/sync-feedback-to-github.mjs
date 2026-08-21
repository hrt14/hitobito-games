import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const dryRun = process.env.DRY_RUN === '1';

if (!repo.includes('/')) throw new Error('GITHUB_REPOSITORY is required');
if (!token) throw new Error('GH_TOKEN is required');

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const [owner, name] = repo.split('/');
const apiBase = 'https://api.github.com';
const feedbackTypes = {
  improvement: '改善',
  confusing: 'わかりにくい',
  bug: 'バグ',
  idea: 'アイデア',
};
const feedbackTypeSet = new Set(Object.keys(feedbackTypes));

async function github(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub ${options.method || 'GET'} ${path} -> ${response.status}: ${detail.slice(0, 400)}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function ensureLabel() {
  const label = 'levelup-feedback';
  const encoded = encodeURIComponent(label);
  const exists = await fetch(`${apiBase}/repos/${owner}/${name}/labels/${encoded}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (exists.ok) return label;
  if (exists.status !== 404) throw new Error(`Unable to check label: ${exists.status}`);
  if (dryRun) return label;
  await github(`/repos/${owner}/${name}/labels`, {
    method: 'POST',
    body: JSON.stringify({ name: label, color: 'D8FF5B', description: 'LEVEL UPの画面から送られた改善要望' }),
  });
  return label;
}

function timestamp(value) {
  try { return value?.toDate?.().toISOString?.() || ''; } catch { return ''; }
}

function oneLine(value, max = 70) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function bodyFor(id, data) {
  const kind = feedbackTypes[data.type] || data.type || '改善';
  const created = timestamp(data.createdAt) || 'unknown';
  return `<!-- levelup-feedback-id:${id} -->\n` +
`## 要望\n\n${data.message || ''}\n\n` +
`## 発生場所\n\n` +
`- 種類: ${kind}\n` +
`- アプリ: ${data.appTitle || data.appSlug || '-'}\n` +
`- slug: \`${data.appSlug || '-'}\`\n` +
`- 画面: ${data.screenLabel || data.pageTitle || '-'}\n` +
`- path: \`${data.pagePath || '-'}\`\n` +
`- build: \`${data.buildSha || '-'}\`\n` +
`- viewport: \`${data.viewport || '-'}\`\n` +
`- 送信日時: ${created}\n\n` +
`## 改善ルーチン\n\n` +
`- [ ] 要望の意図と再現箇所を確認\n` +
`- [ ] 改善案を決める\n` +
`- [ ] 実装・テスト\n` +
`- [ ] 本番反映を確認\n\n` +
`このIssueはLEVEL UPの「改善要望」ボタンから自動生成されました。ChappyはこのIssueを改善候補として読めます。\n`;
}

function validSessionFeedback(raw, docs) {
  if (!raw || raw.v !== 1) return null;
  const type = String(raw.type || '');
  const message = String(raw.message || '').trim();
  const appSlug = String(raw.appSlug || '');
  const appTitle = String(raw.appTitle || '').trim();
  const pageTitle = String(raw.pageTitle || '').trim();
  const pagePath = String(raw.pagePath || '');
  const screenLabel = String(raw.screenLabel || '').trim();
  const buildSha = String(raw.buildSha || '');
  const viewport = String(raw.viewport || '');
  if (!feedbackTypeSet.has(type)) return null;
  if (message.length < 2 || message.length > 800) return null;
  if (!/^(home|[a-z0-9-]{1,64})$/.test(appSlug)) return null;
  if (!appTitle || appTitle.length > 100) return null;
  if (!pageTitle || pageTitle.length > 120) return null;
  if (!pagePath.startsWith('/') || pagePath.length > 300) return null;
  if (screenLabel.length > 120) return null;
  if (!/^(local|[a-f0-9]{4,12})$/.test(buildSha)) return null;
  if (!/^\d{2,5}x\d{2,5}$/.test(viewport)) return null;
  if (docs.some((doc) => doc.data()?.slug !== appSlug || doc.data()?.buildSha !== buildSha)) return null;
  return { type, message, appSlug, appTitle, pageTitle, pagePath, screenLabel, buildSha, viewport };
}

async function markSessionGroup(docs, batchId, state) {
  const batch = db.batch();
  for (const doc of docs) {
    batch.update(doc.ref, {
      status: 'completed',
      lastStep: `feedback-${state}:${batchId}`.slice(0, 60),
      lastSeenAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

async function syncSessionFallbacks() {
  const lower = 'feedback-v1:';
  const upper = 'feedback-v1;';
  const snap = await db.collection('levelupSessions')
    .where('lastStep', '>=', lower)
    .where('lastStep', '<', upper)
    .limit(300)
    .get();
  const groups = new Map();
  for (const doc of snap.docs) {
    const step = String(doc.data()?.lastStep || '');
    const match = /^feedback-v1:([a-z0-9]{8,24}):(\d{2})\/(\d{2})$/.exec(step);
    if (!match) continue;
    const [, batchId, indexText, totalText] = match;
    const index = Number(indexText);
    const total = Number(totalText);
    if (index < 1 || total < 1 || total > 99 || index > total) continue;
    const group = groups.get(batchId) || { total, parts: new Map(), docs: [] };
    if (group.total !== total) {
      group.invalid = true;
    }
    group.parts.set(index, String(doc.data()?.lastAction || ''));
    group.docs.push(doc);
    groups.set(batchId, group);
  }

  for (const [batchId, group] of groups) {
    if (group.invalid || group.parts.size !== group.total) continue;
    let complete = true;
    const chunks = [];
    for (let i = 1; i <= group.total; i += 1) {
      if (!group.parts.has(i)) { complete = false; break; }
      chunks.push(group.parts.get(i));
    }
    if (!complete) continue;

    let raw;
    try { raw = JSON.parse(chunks.join('')); } catch { raw = null; }
    const payload = validSessionFeedback(raw, group.docs);
    if (!payload) {
      console.warn(`Invalid session feedback batch ${batchId}; quarantining ${group.docs.length} chunks.`);
      if (!dryRun) await markSessionGroup(group.docs, batchId, 'invalid');
      continue;
    }

    const feedbackRef = db.collection('levelupFeedback').doc(`session-${batchId}`);
    const exists = await feedbackRef.get();
    if (!exists.exists && !dryRun) {
      const createdAt = group.docs
        .map((doc) => doc.data()?.startedAt)
        .filter(Boolean)
        .sort((a, b) => (a?.toMillis?.() || 0) - (b?.toMillis?.() || 0))[0] || FieldValue.serverTimestamp();
      await feedbackRef.set({
        schemaVersion: 1,
        source: 'levelup-feedback-session-fallback',
        ...payload,
        status: 'new',
        syncStatus: 'pending',
        createdAt,
      });
    }
    if (!dryRun) await markSessionGroup(group.docs, batchId, 'done');
    console.log(`Recovered session feedback ${batchId}: ${oneLine(payload.message, 90)}`);
  }
}

async function findExistingIssue(feedbackId) {
  const q = encodeURIComponent(`repo:${repo} in:body "levelup-feedback-id:${feedbackId}"`);
  const result = await github(`/search/issues?q=${q}&per_page=5`);
  return result?.items?.[0] || null;
}

async function syncPending(label) {
  const snap = await db.collection('levelupFeedback').where('syncStatus', '==', 'pending').limit(25).get();
  const docs = [...snap.docs].sort((a, b) => {
    const ta = a.data()?.createdAt?.toMillis?.() || 0;
    const tb = b.data()?.createdAt?.toMillis?.() || 0;
    return ta - tb;
  });
  console.log(`Pending feedback: ${docs.length}`);
  for (const doc of docs) {
    const data = doc.data() || {};
    let issue = await findExistingIssue(doc.id);
    if (!issue && !dryRun) {
      const kind = feedbackTypes[data.type] || '改善';
      const title = `[改善要望] ${oneLine(data.appTitle || data.appSlug, 28)} / ${kind}: ${oneLine(data.message, 58)}`;
      issue = await github(`/repos/${owner}/${name}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body: bodyFor(doc.id, data), labels: [label] }),
      });
    }
    if (dryRun) {
      console.log(`[dry-run] ${doc.id}: ${oneLine(data.message, 90)}`);
      continue;
    }
    if (!issue?.number) throw new Error(`Issue creation failed for feedback ${doc.id}`);
    await doc.ref.update({
      syncStatus: 'synced',
      status: 'triaged',
      githubIssueNumber: issue.number,
      githubIssueUrl: issue.html_url || '',
      syncedAt: FieldValue.serverTimestamp(),
    });
    console.log(`Synced feedback ${doc.id} -> issue #${issue.number}`);
  }
}

async function syncClosed() {
  const snap = await db.collection('levelupFeedback').where('syncStatus', '==', 'synced').limit(50).get();
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const issueNumber = Number(data.githubIssueNumber || 0);
    if (!issueNumber || data.status === 'done') continue;
    const issue = await github(`/repos/${owner}/${name}/issues/${issueNumber}`);
    if (issue?.state !== 'closed') continue;
    if (!dryRun) {
      await doc.ref.update({
        status: 'done',
        completedAt: FieldValue.serverTimestamp(),
      });
    }
    console.log(`Marked feedback ${doc.id} done from issue #${issueNumber}`);
  }
}

await syncSessionFallbacks();
const label = await ensureLabel();
await syncPending(label);
await syncClosed();
console.log('LEVEL UP feedback sync complete.');
