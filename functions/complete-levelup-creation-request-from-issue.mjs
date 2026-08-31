import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.REQUEST_QUEUE_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const issueNumber = Number(process.env.ISSUE_NUMBER || 0);
if (!repo.includes('/') || !token || !issueNumber) throw new Error('REQUEST_QUEUE_REPOSITORY, GH_TOKEN and ISSUE_NUMBER are required');

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const [owner, name] = repo.split('/');
const headers = {
  accept: 'application/vnd.github+json',
  authorization: `Bearer ${token}`,
  'x-github-api-version': '2022-11-28',
};

const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers });
if (!repoResponse.ok) throw new Error(`Unable to verify request queue: ${repoResponse.status}`);
if ((await repoResponse.json())?.private !== true) throw new Error('Refusing to read LEVEL UP requests from a non-private repository');

const issueResponse = await fetch(`https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`, { headers });
if (!issueResponse.ok) throw new Error(`Unable to fetch issue ${issueNumber}: ${issueResponse.status}`);
const issue = await issueResponse.json();
const body = String(issue.body || '');
const requestMatch = body.match(/<!-- levelup-creation-request-id:([a-z0-9-]{8,36}) -->/);
if (!requestMatch) {
  console.log('[LEVEL UP maker] closed issue is not a guided creation request; skip');
  process.exit(0);
}

const requestId = requestMatch[1];
const indexRef = db.collection('levelupCreationRequestIndex').doc(requestId);
const indexSnap = await indexRef.get();
if (!indexSnap.exists) throw new Error(`Missing levelupCreationRequestIndex/${requestId}`);
const index = indexSnap.data() || {};

const labels = Array.isArray(issue.labels) ? issue.labels.map((label) => typeof label === 'string' ? label : label?.name).filter(Boolean) : [];
const rejected = labels.includes('levelup-request-rejected');
const slugMatch = body.match(/<!-- levelup-app-slug:([a-z0-9-]{1,64}) -->/);
const titleMatch = body.match(/<!-- levelup-app-title:([^<>\n]{1,100}) -->/);
const slug = slugMatch?.[1] && slugMatch[1] !== 'pending' ? slugMatch[1] : '';
const appTitle = String(titleMatch?.[1] || '').trim();

if (!rejected && !slug) {
  console.log(`[LEVEL UP maker] issue #${issueNumber} is closed but has no completed app slug; keep request building`);
  await indexRef.set({
    status: 'building',
    completionWarning: 'closed-without-app-slug',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  process.exit(0);
}

const status = rejected ? 'rejected' : 'published';
const appPath = slug ? `/apps/${slug}/` : '';
const userRef = db.collection('levelupUsers').doc(index.userId);
await db.runTransaction(async (tx) => {
  const snap = await tx.get(userRef);
  if (!snap.exists) return;
  const map = snap.data()?.creationRequests;
  if (!map || typeof map !== 'object' || Array.isArray(map) || !map[requestId]) return;
  const next = {
    ...map,
    [requestId]: {
      ...map[requestId],
      status,
      appSlug: slug,
      appPath,
      appTitle: appTitle || map[requestId].appTitle || '',
      githubIssueNumber: issueNumber,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  tx.set(userRef, { creationRequests: next }, { merge: true });
});

await indexRef.set({
  status,
  appSlug: slug,
  appPath,
  appTitle,
  githubIssueNumber: issueNumber,
  githubIssueUrl: issue.html_url,
  completionChannel: 'my-levelup',
  updatedAt: FieldValue.serverTimestamp(),
  completedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`[LEVEL UP maker] request ${requestId} -> ${status}${slug ? ` (${slug})` : ''}`);
