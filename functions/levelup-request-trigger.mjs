import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import { syncSpecificLevelupCreationRequests, validLevelupCreationRequest } from './levelup-request-queue-core.mjs';

const REGION = 'asia-northeast1';
const REQUEST_QUEUE_REPOSITORY = 'hrt14/hitobito-request-queue';
const PRIVATE_REQUEST_TOKEN = defineSecret('PRIVATE_REQUEST_TOKEN');

function requestMap(snapshot) {
  const raw = snapshot?.data()?.creationRequests;
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function newlyRequestedIds(before, after) {
  const ids = [];
  for (const [id, request] of Object.entries(after)) {
    if (!validLevelupCreationRequest(request)) continue;
    const previous = before[id];
    if (!previous || previous.status !== 'requested') ids.push(id);
  }
  return ids;
}

export const queueLevelupCreationRequests = onDocumentWritten(
  {
    document: 'levelupUsers/{userId}',
    region: REGION,
    secrets: [PRIVATE_REQUEST_TOKEN],
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10,
    retry: true,
  },
  async (event) => {
    const afterSnapshot = event.data?.after;
    if (!afterSnapshot?.exists) return;

    const before = requestMap(event.data?.before);
    const after = requestMap(afterSnapshot);
    const requestIds = newlyRequestedIds(before, after);
    if (!requestIds.length) return;

    const db = getFirestore();
    const synced = await syncSpecificLevelupCreationRequests({
      db,
      repo: REQUEST_QUEUE_REPOSITORY,
      token: PRIVATE_REQUEST_TOKEN.value(),
      userDoc: afterSnapshot,
      requestIds,
    });
    console.log(`[LEVEL UP maker trigger] queued ${synced}/${requestIds.length} new request(s) immediately`);
  },
);
