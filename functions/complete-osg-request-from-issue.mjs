import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const issueNumber = Number(process.env.ISSUE_NUMBER || 0);
if (!repo.includes('/') || !token || !issueNumber) throw new Error('GITHUB_REPOSITORY, GH_TOKEN and ISSUE_NUMBER are required');

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const auth = getAuth();
const [owner, name] = repo.split('/');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function oneLine(value, max = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function queueCompletionEmail({ requestId, gameId, userId, prompt, resultUrl }) {
  let user;
  try {
    user = await auth.getUser(userId);
  } catch (error) {
    console.warn(`[OSG] unable to load Firebase Auth user ${userId}; email skipped`, error?.message || error);
    return { state: 'skipped', reason: 'auth-user-not-found' };
  }

  if (!user.email) {
    console.log(`[OSG] Firebase Auth user ${userId} has no email; notification skipped`);
    return { state: 'skipped', reason: 'no-email' };
  }

  const mailDocumentId = `osg-complete-${requestId}`;
  const mailRef = db.collection('mail').doc(mailDocumentId);
  const existing = await mailRef.get();
  if (existing.exists) {
    console.log(`[OSG] completion email already queued: ${mailDocumentId}`);
    return { state: 'queued', mailDocumentId, duplicate: true };
  }

  const safePrompt = escapeHtml(oneLine(prompt || 'あなたのゲーム'));
  const safeUrl = escapeHtml(resultUrl);
  const subject = '🎮 ゲームが完成しました｜OneShotGames';
  const text = [
    'OneShotGamesで依頼したゲームが完成しました。',
    '',
    oneLine(prompt || 'あなたのゲーム'),
    '',
    `遊ぶ: ${resultUrl}`,
    '',
    'OneShotGames',
    'https://osg.hitobito.jp/'
  ].join('\n');
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#07133b;line-height:1.7">
      <div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#6f2cff">ONESHOTGAMES</div>
      <h1 style="font-size:28px;line-height:1.2;margin:10px 0 18px">🎮 ゲームが完成しました</h1>
      <p style="color:#53607a">制作クエストが完了しました。</p>
      <div style="margin:20px 0;padding:16px 18px;border-radius:16px;background:#f5f8ff;font-weight:700">${safePrompt}</div>
      <p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#6f2cff;color:#fff;text-decoration:none;font-weight:800">ゲームを遊ぶ →</a></p>
      <p style="font-size:12px;color:#7a859d">このメールは、GoogleログインしたOneShotGamesアカウントでゲーム制作を依頼した方に送っています。</p>
    </div>`;

  await mailRef.create({
    to: [user.email],
    message: { subject, text, html },
    osg: {
      kind: 'game-completed',
      requestId,
      gameId,
      userId,
      resultUrl
    },
    createdAt: FieldValue.serverTimestamp()
  });

  console.log(`[OSG] completion email queued: ${mailDocumentId}`);
  return { state: 'queued', mailDocumentId };
}

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
const userSnapBefore = await userRef.get();
const requestBefore = Array.isArray(userSnapBefore.data()?.osgRequests)
  ? userSnapBefore.data().osgRequests.find((item) => item?.id === requestId)
  : null;

await db.runTransaction(async (tx) => {
  const snap = await tx.get(userRef);
  if (!snap.exists) return;
  const list = Array.isArray(snap.data()?.osgRequests) ? snap.data().osgRequests : [];
  const next = list.map((item) => item?.id === requestId ? { ...item, status, resultUrl, completedAt: new Date().toISOString() } : item);
  tx.set(userRef, { osgRequests: next }, { merge: true });
});

let emailNotification = { state: 'skipped', reason: status };
if (status === 'completed') {
  emailNotification = await queueCompletionEmail({
    requestId,
    gameId: index.gameId,
    userId: index.userId,
    prompt: requestBefore?.prompt || '',
    resultUrl
  });
}

await indexRef.set({
  status,
  resultUrl,
  githubIssueNumber: issueNumber,
  githubIssueUrl: issue.html_url,
  emailNotification,
  updatedAt: FieldValue.serverTimestamp(),
  completedAt: FieldValue.serverTimestamp()
}, { merge: true });
console.log(`[OSG] request ${requestId} -> ${status}; email=${emailNotification.state}`);
