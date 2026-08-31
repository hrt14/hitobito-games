import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'hitobito-levelup';
const repo = process.env.REQUEST_QUEUE_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
if (!repo.includes('/')) throw new Error('REQUEST_QUEUE_REPOSITORY is required');
if (!token) throw new Error('GH_TOKEN is required');

if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const [owner, name] = repo.split('/');
const apiBase = 'https://api.github.com';

const goalLabels = {
  switch: '今すぐ気持ちを切り替えたい',
  start: '行動できるようになりたい',
  stop: 'やめられるようになりたい',
  learn: '考え方を身につけたい',
  habit: '習慣にしたい',
  other: 'その他',
};
const timingLabels = {
  moment: '困ったその瞬間',
  morning: '朝',
  night: '寝る前',
  'before-work': '仕事・勉強を始める前',
  fixed: '毎日決まった時間',
  remembered: '思い出したとき',
  other: 'その他',
};
const modeLabels = {
  instant: '今すぐ',
  training: 'トレーニング',
  habit: '習慣化',
  auto: 'おまかせ',
};
const durationLabels = {
  '30sec': '30秒以内',
  '1-3min': '1〜3分',
  '5min': '5分くらい',
  '10min': '10分くらい',
  any: '時間は気にしない',
  auto: 'おまかせ',
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
    throw new Error(`GitHub ${options.method || 'GET'} ${path} -> ${response.status}: ${(await response.text()).slice(0, 400)}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function assertPrivateQueue() {
  const target = await github(`/repos/${owner}/${name}`);
  if (target?.private !== true) throw new Error('Refusing to sync LEVEL UP creation requests to a non-private repository');
}

async function ensureLabel(label, color, description) {
  const response = await fetch(`${apiBase}/repos/${owner}/${name}/labels/${encodeURIComponent(label)}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (response.ok) return;
  if (response.status !== 404) throw new Error(`Label check failed: ${label} ${response.status}`);
  await github(`/repos/${owner}/${name}/labels`, {
    method: 'POST',
    body: JSON.stringify({ name: label, color, description }),
  });
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function oneLine(value, max = 64) {
  const text = clean(value, max * 2).replace(/\s+/g, ' ');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function validRequest(raw) {
  if (!raw || typeof raw !== 'object') return false;
  if (!/^[a-z0-9-]{8,36}$/.test(String(raw.id || ''))) return false;
  if (raw.status !== 'requested') return false;
  if (clean(raw.problem, 241).length < 4 || String(raw.problem || '').length > 240) return false;
  if (!Object.hasOwn(goalLabels, raw.goalType)) return false;
  if (clean(raw.goalDetail, 181).length < 2 || String(raw.goalDetail || '').length > 180) return false;
  if (!Object.hasOwn(timingLabels, raw.usageTiming)) return false;
  if (String(raw.timingDetail || '').length > 120) return false;
  if (raw.usageTiming === 'other' && clean(raw.timingDetail, 121).length < 2) return false;
  if (!Object.hasOwn(modeLabels, raw.solutionType)) return false;
  if (!Object.hasOwn(durationLabels, raw.duration)) return false;
  if (raw.showPublicName != null && typeof raw.showPublicName !== 'boolean') return false;
  if (String(raw.publicNickname || '').length > 30) return false;
  if (raw.showPublicName === true && clean(raw.publicNickname, 31).length < 1) return false;
  return true;
}

function issueBody(request) {
  const timing = `${timingLabels[request.usageTiming]}${request.timingDetail ? `：${request.timingDetail}` : ''}`;
  const showPublicName = request.showPublicName === true;
  const publicNickname = clean(request.publicNickname, 30);
  const attribution = showPublicName ? `Requested by ${publicNickname}` : '依頼者名は表示しない';
  return `<!-- levelup-creation-request-id:${request.id} -->\n` +
`<!-- levelup-app-slug:pending -->\n` +
`# LEVEL UP 制作依頼\n\n` +
`## ユーザーが変えたいこと\n\n${request.problem}\n\n` +
`## 5ステップ回答\n\n` +
`- **なりたい方向:** ${goalLabels[request.goalType]}\n` +
`- **具体的な成功状態:** ${request.goalDetail}\n` +
`- **使うタイミング:** ${timing}\n` +
`- **欲しい変化:** ${modeLabels[request.solutionType]}\n` +
`- **1回の長さ:** ${durationLabels[request.duration]}\n\n` +
`## 公開時の見せ方\n\n` +
`- 作者名を主役にしない。主役は「何に効くLEVEL UPか」。\n` +
`- アプリ内または共有時に、**「このアプリは○○という悩みから生まれたLEVEL UPです」**のような短い由来を入れてよい。\n` +
`- ただし依頼文をそのまま引用しない。個人が特定されないよう一般化し、氏名・勤務先・メール・Google表示名・具体的な個人識別情報・センシティブな詳細は出さない。\n` +
`- 公開用の依頼者表示: **${attribution}**。\n` +
`- ニックネーム表示がOFFの場合、Requested by / Created for など依頼者を示す名前欄自体を出さない。\n` +
`- ニックネーム表示がONでも、ここで指定された公開用ニックネーム以外のアカウント情報は絶対に使わない。\n\n` +
`## LEVEL UP 制作コンセプト\n\n` +
`これは「ゲームのアイデア」の依頼ではない。ユーザーの悩み・困りごと・やめたい行動・身につけたい考え方や習慣を、実際に変化を起こす小さなアプリへ変換する依頼。\n\n` +
`- ユーザーにゲーム方式を求めない。依頼内容から最適な介入形式を設計する。\n` +
`- 即時解決なら、困った瞬間に30秒〜数分で第一歩が出る体験を優先する。\n` +
`- トレーニングなら、反復操作そのものが判断・考え方の練習になるようにする。\n` +
`- 習慣化なら、意味のある記録・継続・振り返りを使い、単なるログインボーナスにしない。\n` +
`- 3択を並べただけ、長い解説を読ませるだけ、「それっぽい心理学コピー」だけのアプリにしない。\n` +
`- 最初の10秒で目的と操作が分かり、スマホで最後まで使えること。\n` +
`- 既存LEVEL UPアプリで十分に代替できる場合は、重複新作より既存アプリ改善・統合を優先する。\n` +
`- 心理学・行動科学など事実性が必要な内容は、信頼できる一次情報・専門情報に基づく。\n` +
`- タイトルは内容と一致し、具体的で、意味のない言葉遊びを避ける。\n` +
`- Firebase HostingのLEVEL UPへ実装し、Vercelは使用しない。\n` +
`- 実装・ビルドだけで完了にせず、本番URLをスマホ幅で実際に操作して確認する。\n\n` +
`## 完了時の必須作業\n\n` +
`1. 本番反映と動作確認を完了する。\n` +
`2. このIssue本文の \`<!-- levelup-app-slug:pending -->\` を、実際のslug（例: \`<!-- levelup-app-slug:my-app -->\`）へ置換する。\n` +
`3. 完成したアプリ名を \`<!-- levelup-app-title:アプリ名 -->\` として本文へ追加する。\n` +
`4. その後にIssueをcloseする。close後、ユーザーの「自分の制作アプリ」にPLAYリンクが反映される。\n\n` +
`安全・合法に制作できない依頼は実装せず、\`levelup-request-rejected\` ラベルを付けてcloseする。\n`;
}

async function findExistingIssue(id) {
  const q = encodeURIComponent(`repo:${repo} is:issue "levelup-creation-request-id:${id}" in:body`);
  const result = await github(`/search/issues?q=${q}&per_page=5`);
  return result.items?.[0] || null;
}

async function updateUserRequest(userRef, requestId, patch) {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;
    const map = snap.data()?.creationRequests;
    if (!map || typeof map !== 'object' || Array.isArray(map) || !map[requestId]) return;
    const next = { ...map, [requestId]: { ...map[requestId], ...patch } };
    tx.set(userRef, { creationRequests: next }, { merge: true });
  });
}

await assertPrivateQueue();
await ensureLabel('levelup-app-request', '7C5CFC', 'LEVEL UP new app creation request');
await ensureLabel('levelup-request-rejected', 'D73A4A', 'LEVEL UP request rejected for safety or feasibility');

const users = await db.collection('levelupUsers').limit(1000).get();
let synced = 0;
for (const userDoc of users.docs) {
  const raw = userDoc.data()?.creationRequests;
  const requests = raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.values(raw) : [];
  for (const request of requests.filter(validRequest).slice(0, 5)) {
    const indexRef = db.collection('levelupCreationRequestIndex').doc(request.id);
    const indexed = await indexRef.get();
    if (indexed.exists) {
      const data = indexed.data() || {};
      await updateUserRequest(userDoc.ref, request.id, {
        status: data.status || 'building',
        githubIssueNumber: data.githubIssueNumber || null,
      });
      continue;
    }

    let issue = await findExistingIssue(request.id);
    if (!issue) {
      issue = await github(`/repos/${owner}/${name}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: `[LEVEL UP CREATE] ${oneLine(request.problem)}`,
          body: issueBody(request),
          labels: ['levelup-app-request'],
        }),
      });
    }

    await indexRef.set({
      userId: userDoc.id,
      requestId: request.id,
      status: 'building',
      githubIssueNumber: issue.number,
      githubIssueUrl: issue.html_url,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await updateUserRequest(userDoc.ref, request.id, {
      status: 'building',
      githubIssueNumber: issue.number,
      updatedAt: new Date().toISOString(),
    });
    synced += 1;
  }
}

console.log(`[LEVEL UP maker] synced ${synced} guided creation request(s) to private request queue`);