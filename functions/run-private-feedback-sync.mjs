const queueRepo = process.env.REQUEST_QUEUE_REPOSITORY || '';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

if (!queueRepo.includes('/')) throw new Error('REQUEST_QUEUE_REPOSITORY is required');
if (!token) throw new Error('GH_TOKEN is required');

const apiBase = 'https://api.github.com';
const verify = await fetch(`${apiBase}/repos/${queueRepo}`, {
  headers: {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'x-github-api-version': '2022-11-28',
  },
});
if (!verify.ok) {
  throw new Error(`Unable to verify private request queue: ${verify.status}`);
}
const target = await verify.json();
if (target?.private !== true) {
  throw new Error(`Refusing to sync user text: ${queueRepo} is not private`);
}

// Compatibility path for older feedback/session records. Guided app requests use
// sync-levelup-creation-requests-to-github.mjs as the canonical source. The
// compatibility module still understands old new_app payloads, so normalize
// its generated private Issue policy here before any GitHub write. This keeps
// migration/recovery support without allowing the retired duplicate-blocking
// rule to re-enter the active request queue.
process.env.GITHUB_REPOSITORY = queueRepo;

const retiredChecklist = '- [ ] 既存アプリとの重複・近い解決策を確認';
const currentChecklist = '- [ ] 依頼ごとに最適な新しい体験・アプローチを決める';
const retiredPolicy = '既存アプリで十分に解決できる場合は、新規制作より既存アプリの案内・改善を優先します。';
const currentPolicy = '似た既存アプリがあっても制作前の重複チェックでは止めません。依頼ごとに最適な体験を新規制作し、必要なら制作後に品質・利用実績・役割の違いで整理します。';

function normalizeCompatibilityIssueBody(body) {
  if (typeof body !== 'string' || !body.includes('levelup-feedback-id:')) return body;
  return body
    .replace(retiredChecklist, currentChecklist)
    .replace(retiredPolicy, currentPolicy);
}

// GitHub's private issue search rejects the marker-only query used by the
// compatibility module unless it is explicitly scoped to issues. The same
// boundary also enforces the current app-creation policy on compatibility
// Issue creation. User free text remains only in the verified private queue.
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => {
  if (typeof input === 'string' && input.startsWith(`${apiBase}/search/issues?`)) {
    const url = new URL(input);
    const q = url.searchParams.get('q') || '';
    if (!/(?:^|\s)is:issue(?:\s|$)/.test(q)) {
      url.searchParams.set('q', `${q} is:issue`.trim());
    }
    return nativeFetch(url.toString(), init);
  }

  if (
    typeof input === 'string' &&
    input === `${apiBase}/repos/${queueRepo}/issues` &&
    String(init?.method || 'GET').toUpperCase() === 'POST' &&
    typeof init?.body === 'string'
  ) {
    let payload;
    try { payload = JSON.parse(init.body); } catch { payload = null; }
    if (payload && typeof payload.body === 'string') {
      const normalizedBody = normalizeCompatibilityIssueBody(payload.body);
      if (normalizedBody.includes(retiredChecklist) || normalizedBody.includes(retiredPolicy)) {
        throw new Error('Retired duplicate-blocking policy reached the private queue boundary');
      }
      init = { ...init, body: JSON.stringify({ ...payload, body: normalizedBody }) };
    }
  }

  return nativeFetch(input, init);
};

await import('./sync-feedback-to-github.mjs');
await import('./sync-levelup-creation-requests-to-github.mjs');
