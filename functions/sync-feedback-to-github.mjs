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

const label = await ensureLabel();
await syncPending(label);
await syncClosed();
console.log('LEVEL UP feedback sync complete.');
