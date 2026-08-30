import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const issueNumber = Number(process.env.ISSUE_NUMBER || 0);
if (!repo.includes('/') || !token || !issueNumber) throw new Error('GITHUB_REPOSITORY, GH_TOKEN and ISSUE_NUMBER are required');

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const [owner, name] = repo.split('/');
const response = await fetch(`https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`, { headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28' } });
if (!response.ok) throw new Error(`Unable to fetch issue ${issueNumber}: ${response.status}`);
const issue = await response.json();
const body = String(issue.body || '');
const match = body.match(/<!-- osg-request-id:([a-z0-9]{10,24}) -->/);
if (!match) {
  console.log('[OSG] closed issue is not an OSG request; skip');
  process.exit(0);
}
const requestId = match[1];
const indexRef = db.collection('osgRequestIndex').doc(requestId);
const indexSnap = await indexRef.get();
if (!indexSnap.exists) throw new Error(`Missing osgRequestIndex/${requestId}`);
const index = indexSnap.data();
const rejected = Array.isArray(issue.labels) && issue.labels.some((label) => (typeof label === 'string' ? label : label?.name) === 'osg-rejected');
const status = rejected ? 'rejected' : 'completed';
const resultUrl = `https://osg.hitobito.jp/g/${index.gameId}/`;
const userRef = db.collection('levelupUsers').doc(index.userId);
await db.runTransaction(async (tx) => {
  const snap = await tx.get(userRef);
  if (!snap.exists) return;
  const list = Array.isArray(snap.data()?.osgRequests) ? snap.data().osgRequests : [];
  const next = list.map((item) => item?.id === requestId ? { ...item, status, resultUrl, completedAt: new Date().toISOString() } : item);
  tx.set(userRef, { osgRequests: next }, { merge: true });
});
await indexRef.set({ status, resultUrl, githubIssueNumber: issueNumber, githubIssueUrl: issue.html_url, updatedAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp() }, { merge: true });
console.log(`[OSG] request ${requestId} -> ${status}`);
