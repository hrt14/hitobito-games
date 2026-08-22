const projectId = 'hitobito-levelup';
const siteId = 'hitobito-audio';
const customDomain = 'audio.hitobito.jp';
const apexDomain = 'hitobito.jp';
const firebaseToken = process.env.FIREBASE_ACCESS_TOKEN;

if (!firebaseToken) throw new Error('FIREBASE_ACCESS_TOKEN is missing');

const fbHeaders = {
  Authorization: `Bearer ${firebaseToken}`,
  'Content-Type': 'application/json',
};
const fbBase = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/customDomains`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function jsonFetch(url, options = {}, allow = []) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok && !allow.includes(response.status)) {
    throw new Error(`${response.status} ${response.statusText} ${url}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return { response, body };
}

async function ensureCustomDomain() {
  const result = await jsonFetch(`${fbBase}/${customDomain}`, { headers: fbHeaders }, [404]);
  if (result.response.status !== 404) {
    console.log(`Firebase custom domain already exists: ${customDomain}`);
    return;
  }

  console.log(`Creating Firebase custom domain ${customDomain}`);
  await jsonFetch(`${fbBase}?customDomainId=${encodeURIComponent(customDomain)}`, {
    method: 'POST',
    headers: fbHeaders,
    body: '{}',
  });
  await sleep(3000);
}

function clean(value) {
  return String(value ?? '').trim().replace(/\.$/, '');
}

function relativeName(domainName) {
  const value = clean(domainName).toLowerCase();
  const apex = apexDomain.toLowerCase();
  if (!value || value === apex) return '';
  return value.endsWith(`.${apex}`) ? value.slice(0, -(apex.length + 1)) : value;
}

function normalizeTxt(value) {
  const text = String(value ?? '').trim();
  return text.length >= 2 && text.startsWith('"') && text.endsWith('"')
    ? text.slice(1, -1).replace(/\\"/g, '"')
    : text;
}

function normalizeValue(type, value) {
  return type === 'TXT' ? normalizeTxt(value) : clean(value);
}

function firebaseRecord(record) {
  if (!record?.type || !record?.domainName || record.rdata == null) return null;
  const type = String(record.type).toUpperCase();
  if (!['A', 'AAAA', 'CNAME', 'TXT', 'CAA'].includes(type)) return null;
  return {
    type,
    name: relativeName(record.domainName),
    value: normalizeValue(type, record.rdata),
    requiredAction: record.requiredAction,
  };
}

async function getFirebaseDomain() {
  const { body } = await jsonFetch(`${fbBase}/${customDomain}`, { headers: fbHeaders });
  return body;
}

function getDnsRequirements(domain) {
  const updates = domain?.requiredDnsUpdates || {};
  const desired = (updates.desired || [])
    .flatMap(set => set.records || [])
    .map(firebaseRecord)
    .filter(Boolean);
  const discovered = (updates.discovered || [])
    .flatMap(set => set.records || [])
    .map(firebaseRecord)
    .filter(Boolean);

  return { desired, discovered };
}

function printState(domain, requirements) {
  const state = {
    hostState: domain?.hostState || null,
    ownershipState: domain?.ownershipState || null,
    certState: domain?.cert?.state || null,
    desired: requirements.desired,
    discovered: requirements.discovered,
    issues: domain?.issues || [],
  };

  console.log('Firebase custom-domain state:');
  console.log(JSON.stringify(state, null, 2));

  const addRecords = requirements.desired.filter(record => record.requiredAction === 'ADD');
  if (addRecords.length) {
    console.log('\nDNS records that must be configured at the authoritative DNS provider:');
    for (const record of addRecords) {
      console.log(`${record.type}\t${record.name || '@'}\t${record.value}`);
    }
  } else {
    console.log('\nFirebase is not requesting any DNS record additions.');
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      `## Firebase custom domain: ${customDomain}`,
      '',
      `- hostState: ${state.hostState ?? 'unknown'}`,
      `- ownershipState: ${state.ownershipState ?? 'unknown'}`,
      `- certState: ${state.certState ?? 'unknown'}`,
      '',
      '### Required DNS additions',
      '',
      '| Type | Name | Value |',
      '| --- | --- | --- |',
      ...addRecords.map(record => `| ${record.type} | ${record.name || '@'} | \`${record.value}\` |`),
      '',
      '> Hosting is Firebase. DNS must be managed outside Vercel (for example Cloudflare DNS, Google Cloud DNS, or the registrar DNS).',
      '',
    ];

    import('node:fs').then(({ appendFileSync }) => {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
    });
  }
}

await ensureCustomDomain();
const domain = await getFirebaseDomain();
const requirements = getDnsRequirements(domain);
printState(domain, requirements);

console.log('Vercel DNS writes are disabled. Firebase DNS requirements were reported only.');
