import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { syncLevelupCreationRequests, validLevelupCreationRequest } from './levelup-request-queue-core.mjs';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.REQUEST_QUEUE_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
if (!repo.includes('/')) throw new Error('REQUEST_QUEUE_REPOSITORY is required');
if (!token) throw new Error('GH_TOKEN is required');

const selectedGoalLabels = {
  switch: '今すぐ気持ちを切り替えたい',
  start: '行動できるようになりたい',
  stop: 'やめられるようになりたい',
  learn: '考え方を身につけたい',
  habit: '習慣にしたい',
};

function normalizeGuidedRequest(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  if (raw.goalType === 'other') return raw;
  const selectedGoal = selectedGoalLabels[raw.goalType];
  if (!selectedGoal) return raw;
  if (String(raw.goalDetail || '').trim().length >= 2) return raw;
  return { ...raw, goalDetail: selectedGoal };
}

function normalizedUserDoc(user) {
  const data = user.data() || {};
  const map = data.creationRequests;
  if (!map || typeof map !== 'object' || Array.isArray(map)) return user;
  const creationRequests = Object.fromEntries(
    Object.entries(map).map(([id, request]) => [id, normalizeGuidedRequest(request)]),
  );
  return {
    id: user.id,
    ref: user.ref,
    data: () => ({ ...data, creationRequests }),
  };
}

function validationReasons(raw) {
  if (!raw || typeof raw !== 'object') return ['not-object'];
  const reasons = [];
  if (!/^[a-z0-9-]{8,36}$/.test(String(raw.id || ''))) reasons.push('id');
  if (raw.status !== 'requested') reasons.push('status');
  const problemLength = String(raw.problem || '').trim().length;
  if (problemLength < 4 || problemLength > 240) reasons.push('problem-length');
  if (!['switch','start','stop','learn','habit','other'].includes(raw.goalType)) reasons.push('goal-type');
  const goalLength = String(raw.goalDetail || '').trim().length;
  if (goalLength < 2 || goalLength > 180) reasons.push('goal-detail-length');
  if (!['moment','morning','night','before-work','fixed','remembered','other'].includes(raw.usageTiming)) reasons.push('usage-timing');
  const timingLength = String(raw.timingDetail || '').length;
  if (timingLength > 120 || (raw.usageTiming === 'other' && String(raw.timingDetail || '').trim().length < 2)) reasons.push('timing-detail');
  if (!['instant','training','habit','auto'].includes(raw.solutionType)) reasons.push('solution-type');
  if (!['30sec','1-3min','5min','10min','any','auto'].includes(raw.duration)) reasons.push('duration');
  if (raw.showPublicName != null && typeof raw.showPublicName !== 'boolean') reasons.push('public-name-flag');
  if (String(raw.publicNickname || '').length > 30 || (raw.showPublicName === true && !String(raw.publicNickname || '').trim())) reasons.push('public-nickname');
  return reasons;
}

const githubHeaders = {
  accept: 'application/vnd.github+json',
  authorization: `Bearer ${token}`,
  'x-github-api-version': '2022-11-28',
};

async function findPrivateQueueIssue(requestId) {
  if (!/^[a-z0-9-]{8,36}$/.test(String(requestId || ''))) return null;
  const q = encodeURIComponent(`repo:${repo} is:issue \"levelup-creation-request-id:${requestId}\" in:body`);
  const response = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=5`, { headers: githubHeaders });
  if (!response.ok) throw new Error(`Unable to audit private LEVEL UP queue: ${response.status}`);
  const result = await response.json();
  return result.items?.[0] || null;
}

async function setUserRequestStatus(userRef, requestId, patch) {
  await userRef.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;
    const map = snap.data()?.creationRequests;
    if (!map || typeof map !== 'object' || Array.isArray(map) || !map[requestId]) return;
    const nextRequest = { ...map[requestId], ...patch };
    if (patch.githubIssueNumber === null) delete nextRequest.githubIssueNumber;
    const next = { ...map, [requestId]: nextRequest };
    tx.set(userRef, { creationRequests: next }, { merge: true });
  });
}

async function auditAndRecoverBuildingRequests(db, users) {
  let building = 0;
  let linked = 0;
  let recovered = 0;
  let unrecoverable = 0;

  for (const user of users.docs) {
    const map = user.data()?.creationRequests;
    if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
    for (const raw of Object.values(map)) {
      if (raw?.status !== 'building') continue;
      building += 1;
      const requestId = String(raw?.id || '');
      const safeId = /^[a-z0-9-]{8,36}$/.test(requestId) ? requestId : 'invalid-id';
      const issue = await findPrivateQueueIssue(requestId);
      if (issue) {
        linked += 1;
        const issueNumber = Number(issue.number || 0);
        if (issueNumber && Number(raw.githubIssueNumber || 0) !== issueNumber) {
          await setUserRequestStatus(user.ref, requestId, { githubIssueNumber: issueNumber, updatedAt: new Date().toISOString() });
          await db.collection('levelupCreationRequestIndex').doc(requestId).set({
            userId: user.id,
            requestId,
            status: 'building',
            githubIssueNumber: issueNumber,
            githubIssueUrl: issue.html_url || '',
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        continue;
      }

      const candidate = normalizeGuidedRequest({ ...raw, status: 'requested' });
      if (!validLevelupCreationRequest(candidate)) {
        unrecoverable += 1;
        console.error(`[LEVEL UP maker] building row has no private queue issue and cannot be safely requeued: id=${safeId} reasons=${validationReasons(candidate).join(',') || 'unknown'}`);
        continue;
      }

      await db.collection('levelupCreationRequestIndex').doc(requestId).set({
        userId: user.id,
        requestId,
        status: 'pending',
        githubIssueNumber: FieldValue.delete(),
        githubIssueUrl: FieldValue.delete(),
        completionWarning: 'private-queue-issue-missing-requeued',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await setUserRequestStatus(user.ref, requestId, {
        status: 'requested',
        githubIssueNumber: null,
        updatedAt: new Date().toISOString(),
      });
      recovered += 1;
      console.warn(`[LEVEL UP maker] recovered orphaned building request to requested state: id=${safeId}`);
    }
  }

  console.log(`[LEVEL UP maker] building rows=${building}; private-issue-linked=${linked}; orphan-requeued=${recovered}; orphan-unrecoverable=${unrecoverable}`);
  if (unrecoverable > 0) throw new Error(`LEVEL UP queue health audit found ${unrecoverable} unrecoverable building request(s)`);
  return recovered;
}

if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
let users = await db.collection('levelupUsers').limit(1000).get();
const recovered = await auditAndRecoverBuildingRequests(db, users);
if (recovered > 0) users = await db.collection('levelupUsers').limit(1000).get();
const userDocs = users.docs.map(normalizedUserDoc);

let requested = 0;
let invalid = 0;
let normalizedGoals = 0;
for (let index = 0; index < users.docs.length; index += 1) {
  const originalMap = users.docs[index].data()?.creationRequests;
  const normalizedMap = userDocs[index].data()?.creationRequests;
  if (originalMap && normalizedMap && typeof originalMap === 'object' && !Array.isArray(originalMap)) {
    for (const [id, original] of Object.entries(originalMap)) {
      const normalized = normalizedMap[id];
      if (original?.status === 'requested' && normalized?.goalDetail !== original?.goalDetail) normalizedGoals += 1;
    }
  }
}
for (const user of userDocs) {
  const map = user.data()?.creationRequests;
  if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
  for (const request of Object.values(map)) {
    if (request?.status !== 'requested') continue;
    requested += 1;
    if (!validLevelupCreationRequest(request)) {
      invalid += 1;
      const safeId = /^[a-z0-9-]{8,36}$/.test(String(request?.id || '')) ? request.id : 'invalid-id';
      console.warn(`[LEVEL UP maker] requested row rejected by schema: id=${safeId} reasons=${validationReasons(request).join(',') || 'unknown'}`);
    }
  }
}
console.log(`[LEVEL UP maker] requested rows=${requested}; schema-rejected=${invalid}; normalized-selection-goals=${normalizedGoals}`);

const synced = await syncLevelupCreationRequests({
  db,
  repo,
  token,
  userDocs,
  maxPerUser: 5,
});

console.log(`[LEVEL UP maker] synced ${synced} guided creation request(s) to private request queue`);
