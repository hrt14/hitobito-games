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

// The legacy sync module reads GITHUB_REPOSITORY internally. Assign it at
// process runtime rather than through workflow env, because GitHub reserves
// default GITHUB_* workflow variables and ignores attempted env overrides.
process.env.GITHUB_REPOSITORY = queueRepo;

// GitHub's private issue search rejects the marker-only query used by the
// legacy module unless it is explicitly scoped to issues. Keep the existing
// module intact while making that request unambiguous.
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  if (typeof input === 'string' && input.startsWith(`${apiBase}/search/issues?`)) {
    const url = new URL(input);
    const q = url.searchParams.get('q') || '';
    if (!/(?:^|\s)is:issue(?:\s|$)/.test(q)) {
      url.searchParams.set('q', `${q} is:issue`.trim());
    }
    return nativeFetch(url.toString(), init);
  }
  return nativeFetch(input, init);
};

await import('./sync-feedback-to-github.mjs');
