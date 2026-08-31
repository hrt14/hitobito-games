import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { syncLevelupCreationRequests, validLevelupCreationRequest } from './levelup-request-queue-core.mjs';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.REQUEST_QUEUE_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
if (!repo.includes('/')) throw new Error('REQUEST_QUEUE_REPOSITORY is required');
if (!token) throw new Error('GH_TOKEN is required');

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

let requested = 0;
let invalid = 0;
for (const user of users.docs) {
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
console.log(`[LEVEL UP maker] requested rows=${requested}; schema-rejected=${invalid}`);

const synced = await syncLevelupCreationRequests({
  db,
  repo,
  token,
  userDocs: users.docs,
  maxPerUser: 5,
});

console.log(`[LEVEL UP maker] synced ${synced} guided creation request(s) to private request queue`);
