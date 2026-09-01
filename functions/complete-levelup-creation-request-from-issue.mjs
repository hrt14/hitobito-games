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
if (!issueResponse.ok) throw new Error(`Unable to fetch private request: ${issueResponse.status}`);
const issue = await issueResponse.json();
const body = String(issue.body || '');
const requestMatch = body.match(/<!-- levelup-creation-request-id:([a-z0-9-]{8,36}) -->/);
if (!requestMatch) {
  console.log('[LEVEL UP maker] queue item is not a guided creation request; skip');
  process.exit(0);
}

const requestId = requestMatch[1];
const indexRef = db.collection('levelupCreationRequestIndex').doc(requestId);
const indexSnap = await indexRef.get();
if (!indexSnap.exists) throw new Error(`Missing levelupCreationRequestIndex/${requestId}`);
const index = indexSnap.data() || {};

const labels = Array.isArray(issue.labels) ? issue.labels.map((label) => typeof label === 'string' ? label : label?.name).filter(Boolean) : [];
const rejected = labels.includes('levelup-request-rejected') || issue.state_reason === 'not_planned';
const slugMatch = body.match(/<!-- levelup-app-slug:([a-z0-9-]{1,64}) -->/);
const titleMatch = body.match(/<!-- levelup-app-title:([^<>\n]{1,100}) -->/);
const purposeMatch = body.match(/<!-- levelup-app-purpose-ja:([^<>\n]{2,80}) -->/);
const slug = slugMatch?.[1] && slugMatch[1] !== 'pending' ? slugMatch[1] : '';
const appTitle = String(titleMatch?.[1] || '').trim();
const appPurposeJa = String(purposeMatch?.[1] || '').trim();

if (!rejected && !slug) {
  console.log(`[LEVEL UP maker] request ${requestId} has no completed app slug; keep request building`);
  await indexRef.set({
    status: 'building',
    completionWarning: 'waiting-for-app-slug',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  process.exit(0);
}

const appPath = slug ? `/apps/${slug}/` : '';

async function verifyProductionApp(appSlug) {
  if (!/^[a-z0-9-]{1,64}$/.test(appSlug)) return false;
  const nonce = Date.now();
  const appUrl = `https://levelup.hitobito.jp/apps/${appSlug}/?verify=${nonce}`;
  const appResponse = await fetch(appUrl, {
    cache: 'no-store',
    redirect: 'follow',
    headers: { 'cache-control': 'no-cache, no-store, must-revalidate', 'user-agent': 'levelup-creation-completer' },
  });
  if (!appResponse.ok) {
    console.log(`[LEVEL UP maker] production app is not live yet for request ${requestId}: ${appResponse.status}`);
    return false;
  }

  const catalogResponse = await fetch(`https://levelup.hitobito.jp/levelup-catalog.json?verify=${nonce}`, {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache, no-store, must-revalidate', 'user-agent': 'levelup-creation-completer' },
  });
  if (!catalogResponse.ok) {
    console.log(`[LEVEL UP maker] production catalog is not available yet for request ${requestId}: ${catalogResponse.status}`);
    return false;
  }
  const catalog = await catalogResponse.json().catch(() => null);
  const games = Array.isArray(catalog?.games) ? catalog.games : [];
  const listed = games.some((game) => String(game?.slug || '') === appSlug);
  if (!listed) console.log(`[LEVEL UP maker] production catalog is waiting for request ${requestId}; keep request building`);
  return listed;
}

if (!rejected) {
  const live = await verifyProductionApp(slug);
  if (!live) {
    await indexRef.set({
      status: 'building',
      completionWarning: 'waiting-for-production',
      appSlug: slug,
      appPath,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    process.exit(0);
  }
}

const status = rejected ? 'rejected' : 'published';
const userId = String(index.userId || '').trim();
if (!userId) {
  await indexRef.set({
    status: 'building',
    completionWarning: 'my-page-user-link-missing',
    appSlug: slug,
    appPath,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`[LEVEL UP maker] request ${requestId} is waiting for its My Page user link`);
  process.exit(0);
}

const completedAt = new Date().toISOString();
const userRef = db.collection('levelupUsers').doc(userId);
const myPageSynced = await db.runTransaction(async (tx) => {
  const snap = await tx.get(userRef);
  if (!snap.exists) return false;

  const rawMap = snap.data()?.creationRequests;
  const map = rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap) ? rawMap : {};
  const current = map[requestId] && typeof map[requestId] === 'object' && !Array.isArray(map[requestId])
    ? map[requestId]
    : {};
  const next = {
    ...map,
    [requestId]: {
      ...current,
      id: requestId,
      status,
      appSlug: slug,
      appPath,
      appTitle: appTitle || current.appTitle || String(index.appTitle || '').trim(),
      appPurposeJa: appPurposeJa || current.appPurposeJa || String(index.appPurposeJa || '').trim(),
      completedAt,
      updatedAt: completedAt,
    },
  };
  tx.set(userRef, { creationRequests: next }, { merge: true });
  return true;
});

if (!myPageSynced) {
  await indexRef.set({
    status: 'building',
    completionWarning: 'my-page-user-document-missing',
    appSlug: slug,
    appPath,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`[LEVEL UP maker] request ${requestId} is waiting for its My Page user document`);
  process.exit(0);
}

await indexRef.set({
  status,
  appSlug: slug,
  appPath,
  appTitle,
  appPurposeJa,
  completionChannel: 'my-levelup',
  myPageSynced: true,
  myPageSyncedAt: FieldValue.serverTimestamp(),
  completionWarning: FieldValue.delete(),
  updatedAt: FieldValue.serverTimestamp(),
  completedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`[LEVEL UP maker] request ${requestId} -> ${status}; My Page synchronized`);
