import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const users = await db.collection('levelupUsers').limit(1000).get();
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
