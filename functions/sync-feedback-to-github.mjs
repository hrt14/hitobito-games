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
const requestTypeSet = new Set(['improvement', 'new_app']);
let productionMetaCache = null;

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

async function ensureLabel(label, color, description) {
  const encoded = encodeURIComponent(label);
  const exists = await fetch(`${apiBase}/repos/${owner}/${name}/labels/${encoded}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (exists.ok) return label;
  if (exists.status !== 404) throw new Error(`Unable to check label ${label}: ${exists.status}`);
  if (dryRun) return label;
  await github(`/repos/${owner}/${name}/labels`, {
    method: 'POST',
    body: JSON.stringify({ name: label, color, description }),
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

function requestTypeFor(data) {
  return data?.requestType === 'new_app' ? 'new_app' : 'improvement';
}

function bodyFor(id, data) {
  const requestType = requestTypeFor(data);
  const kind = feedbackTypes[data.type] || data.type || '改善';
  const created = timestamp(data.createdAt) || 'unknown';
  if (requestType === 'new_app') {
    return `<!-- levelup-feedback-id:${id} -->\
` +
`## 悩み・作ってほしいアプリ\
\
${data.message || ''}\
\
` +
`## 送信場所\
\
` +
`- 依頼種別: 新規アプリ制作\
` +
`- 送信元アプリ: ${data.appTitle || data.appSlug || '-'}\
` +
`- slug: \`${data.appSlug || '-'}\`\
` +
`- 画面: ${data.screenLabel || data.pageTitle || '-'}\
` +
`- path: \`${data.pagePath || '-'}\`\
` +
`- build: \`${data.buildSha || '-'}\`\
` +
`- viewport: \`${data.viewport || '-'}\`\
` +
`- 送信日時: ${created}\
\
` +
`## アプリ制作ルーチン\
\
` +
`- [ ] 安全性・合法性・公序良俗を確認\
` +
`- [ ] 既存アプリとの重複・近い解決策を確認\
` +
`- [ ] 悩みを解決するアプローチを決める\
` +
`- [ ] 実装・テスト\
` +
`- [ ] Firebase本番反映と実URLを確認\
\
` +
`違法・危険・他者への加害を助長するなど、公序良俗に反する依頼は制作しません。既存アプリで十分に解決できる場合は、新規制作より既存アプリの案内・改善を優先します。\
\
` +
`このIssueはLEVEL UPの「アプリ制作依頼」導線から自動生成されました。ChappyはこのIssueを新規アプリ制作候補として読めます。\
`;
  }
  return `<!-- levelup-feedback-id:${id} -->\
` +
`## 要望\
\
${data.message || ''}\
\
` +
`## 発生場所\
\
` +
`- 種類: ${kind}\
` +
`- アプリ: ${data.appTitle || data.appSlug || '-'}\
` +
`- slug: \`${data.appSlug || '-'}\`\
` +
`- 画面: ${data.screenLabel || data.pageTitle || '-'}\
` +
`- path: \`${data.pagePath || '-'}\`\
` +
`- build: \`${data.buildSha || '-'}\`\
` +
`- viewport: \`${data.viewport || '-'}\`\
` +
`- 送信日時: ${created}\
\
` +
`## 改善ルーチン\
\
` +
`- [ ] 要望の意図と再現箇所を確認\
` +
`- [ ] 改善案を決める\
` +
`- [ ] 実装・テスト\
` +
`- [ ] 本番反映を確認\
\
` +
`このIssueはLEVEL UPの「改善要望」ボタンから自動生成されました。ChappyはこのIssueを改善候補として読めます。\
`;
}

function validSessionFeedback(raw, docs) {
  if (!raw || raw.v !== 1) return null;
  const requestType = String(raw.requestType || 'improvement');
  const type = String(raw.type || '');
  const message = String(raw.message || '').trim();
  const appSlug = String(raw.appSlug || '');
  const appTitle = String(raw.appTitle || '').trim();
  const pageTitle = String(raw.pageTitle || '').trim();
  const pagePath = String(raw.pagePath || '');
  const screenLabel = String(raw.screenLabel || '').trim();
  const buildSha = String(raw.buildSha || '');
  const viewport = String(raw.viewport || '');
  if (!requestTypeSet.has(requestType)) return null;
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
  return { requestType, type, message, appSlug, appTitle, pageTitle, pagePath, screenLabel, buildSha, viewport };
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
    if (group.total !== total) group.invalid = true;
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
        schemaVersion: 2,
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
  const q = encodeURIComponent(`repo:${repo} in:body \"levelup-feedback-id:${feedbackId}\"`);
  const result = await github(`/search/issues?q=${q}&per_page=5`);
  return result?.items?.[0] || null;
}

async function setPublicStatus(id, data, status, extra = {}) {
  if (dryRun) return;
  await db.collection('levelupFeedbackStatus').doc(id).set({
    status,
    appSlug: String(data?.appSlug || 'home').slice(0, 64),
    requestType: requestTypeFor(data),
    buildSha: String(data?.buildSha || 'local').slice(0, 12),
    updatedAt: FieldValue.serverTimestamp(),
    ...extra,
  }, { merge: true });
}

async function syncPending(feedbackLabel, appRequestLabel) {
  const snap = await db.collection('levelupFeedback').where('syncStatus', '==', 'pending').limit(25).get();
  const docs = [...snap.docs].sort((a, b) => {
    const ta = a.data()?.createdAt?.toMillis?.() || 0;
    const tb = b.data()?.createdAt?.toMillis?.() || 0;
    return ta - tb;
  });
  console.log(`Pending feedback: ${docs.length}`);
  for (const doc of docs) {
    const data = doc.data() || {};
    const requestType = requestTypeFor(data);
    let issue = await findExistingIssue(doc.id);
    if (!issue && !dryRun) {
      const kind = feedbackTypes[data.type] || '改善';
      const title = requestType === 'new_app'
        ? `[アプリ制作依頼] ${oneLine(data.message, 72)}`
        : `[改善要望] ${oneLine(data.appTitle || data.appSlug, 28)} / ${kind}: ${oneLine(data.message, 58)}`;
      const labels = requestType === 'new_app' ? [feedbackLabel, appRequestLabel] : [feedbackLabel];
      issue = await github(`/repos/${owner}/${name}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body: bodyFor(doc.id, data), labels }),
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
    await setPublicStatus(doc.id, data, 'processing', { githubIssueNumber: issue.number });
    console.log(`Synced feedback ${doc.id} -> issue #${issue.number}`);
  }
}

async function productionMeta() {
  if (productionMetaCache) return productionMetaCache;
  const response = await fetch(`https://levelup.hitobito.jp/deploy-meta.json?feedback=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache, no-store, must-revalidate', 'user-agent': 'levelup-feedback-sync' },
  });
  if (!response.ok) throw new Error(`LEVEL UP production deploy-meta unavailable: ${response.status}`);
  const meta = await response.json();
  if (!/^[a-f0-9]{40}$/.test(String(meta?.sha || ''))) throw new Error('LEVEL UP production deploy-meta has invalid SHA');
  productionMetaCache = meta;
  return meta;
}

async function productionPageIsLive(data) {
  const slug = String(data?.appSlug || 'home');
  const path = slug === 'home' ? '/' : `/apps/${slug}/`;
  const response = await fetch(`https://levelup.hitobito.jp${path}?feedback=${Date.now()}`, {
    cache: 'no-store',
    redirect: 'follow',
    headers: { 'cache-control': 'no-cache, no-store, must-revalidate', 'user-agent': 'levelup-feedback-sync' },
  });
  return response.ok;
}

async function syncClosed() {
  const snap = await db.collection('levelupFeedback').where('syncStatus', '==', 'synced').limit(50).get();
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const issueNumber = Number(data.githubIssueNumber || 0);
    if (!issueNumber || data.status === 'done') continue;
    const issue = await github(`/repos/${owner}/${name}/issues/${issueNumber}`);
    if (issue?.state !== 'closed') continue;

    if (issue?.state_reason === 'not_planned') {
      if (!dryRun) {
        await doc.ref.update({ status: 'rejected', completedAt: FieldValue.serverTimestamp() });
        await setPublicStatus(doc.id, data, 'rejected', { githubIssueNumber: issueNumber });
      }
      console.log(`Marked feedback ${doc.id} rejected from issue #${issueNumber}`);
      continue;
    }

    const meta = await productionMeta();
    const productionSha = String(meta.sha || '');
    const baseline = String(data.buildSha || '');
    if (baseline && baseline !== 'local' && productionSha.startsWith(baseline)) {
      await setPublicStatus(doc.id, data, 'processing', { githubIssueNumber: issueNumber });
      console.log(`Feedback ${doc.id} issue #${issueNumber} is closed, but production is still baseline ${baseline}; waiting`);
      continue;
    }
    if (!(await productionPageIsLive(data))) {
      await setPublicStatus(doc.id, data, 'processing', { githubIssueNumber: issueNumber });
      console.log(`Feedback ${doc.id} issue #${issueNumber} is closed, but target production page is not live yet; waiting`);
      continue;
    }

    if (!dryRun) {
      await doc.ref.update({
        status: 'done',
        completedAt: FieldValue.serverTimestamp(),
        publishedSha: productionSha,
      });
      await setPublicStatus(doc.id, data, 'published', {
        githubIssueNumber: issueNumber,
        publishedSha: productionSha,
        publishedAt: FieldValue.serverTimestamp(),
      });
    }
    console.log(`Marked feedback ${doc.id} published from issue #${issueNumber} on production ${productionSha.slice(0, 12)}`);
  }
}

await syncSessionFallbacks();
const feedbackLabel = await ensureLabel('levelup-feedback', 'D8FF5B', 'LEVEL UPの画面から送られた改善・アプリ制作要望');
const appRequestLabel = await ensureLabel('levelup-app-request', '7C5CFC', 'LEVEL UPの新規アプリ制作依頼');
await syncPending(feedbackLabel, appRequestLabel);
await syncClosed();
console.log('LEVEL UP feedback sync complete.');