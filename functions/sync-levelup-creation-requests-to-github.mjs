import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { syncLevelupCreationRequests } from './levelup-request-queue-core.mjs';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.REQUEST_QUEUE_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
if (!repo.includes('/')) throw new Error('REQUEST_QUEUE_REPOSITORY is required');
if (!token) throw new Error('GH_TOKEN is required');

if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const users = await db.collection('levelupUsers').limit(1000).get();
const synced = await syncLevelupCreationRequests({
  db,
  repo,
  token,
  userDocs: users.docs,
  maxPerUser: 5,
});

console.log(`[LEVEL UP maker] synced ${synced} guided creation request(s) to private request queue`);
