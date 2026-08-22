const projectId = 'hitobito-levelup';
const siteId = 'hitobito-audio';
const customDomain = 'audio.hitobito.jp';
const apexDomain = 'hitobito.jp';
const firebaseToken = process.env.FIREBASE_ACCESS_TOKEN;
const vercelToken = process.env.VERCEL_TOKEN;
const vercelTeamId = process.env.VERCEL_TEAM_ID || 'team_vCUqyPcmj2xuDuBM7f7aOiMQ';

if (!firebaseToken) throw new Error('FIREBASE_ACCESS_TOKEN is missing');

const fbHeaders = { Authorization: `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' };
const vercelHeaders = vercelToken
  ? { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' }
  : null;
const fbBase = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/customDomains`;
const vercelBase = 'https://api.vercel.com';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function jsonFetch(url, options = {}, allow = []) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
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
    method: 'POST', headers: fbHeaders, body: '{}'
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

function printFirebaseRequirements(domain) {
  const updates = domain?.requiredDnsUpdates || {};
  const desired = (updates.desired || [])
    .flatMap(set => set.records || [])
    .map(firebaseRecord)
    .filter(Boolean);
  const discovered = (updates.discovered || [])
    .flatMap(set => set.records || [])
    .map(firebaseRecord)
    .filter(Boolean);

  console.log('Firebase custom-domain state:');
  console.log(JSON.stringify({
    hostState: domain?.hostState || null,
    ownershipState: domain?.ownershipState || null,
    certState: domain?.cert?.state || null,
    desired,
    discovered,
    issues: domain?.issues || [],
  }, null, 2));
  return { desired, discovered };
}

async function listVercelRecords() {
  const url = `${vercelBase}/v5/domains/${encodeURIComponent(apexDomain)}/records?limit=100&teamId=${encodeURIComponent(vercelTeamId)}`;
  const { body } = await jsonFetch(url, { headers: vercelHeaders });
  return body?.records || [];
}

function recordId(record) {
  return record?.uid || record?.id;
}

function sameRecord(record, wanted) {
  return String(record?.type || '').toUpperCase() === wanted.type
    && relativeName(record?.name || '') === wanted.name
    && normalizeValue(wanted.type, record?.value) === wanted.value;
}

async function deleteVercelRecord(record) {
  const id = recordId(record);
  if (!id) return;
  const url = `${vercelBase}/v2/domains/${encodeURIComponent(apexDomain)}/records/${encodeURIComponent(id)}?teamId=${encodeURIComponent(vercelTeamId)}`;
  await jsonFetch(url, { method: 'DELETE', headers: vercelHeaders });
  console.log(`Removed Vercel DNS ${record.type} ${record.name || '@'} ${record.value || ''}`);
}

async function ensureVercelRecord(wanted) {
  let records = await listVercelRecords();
  if (records.some(record => sameRecord(record, wanted))) {
    console.log(`Vercel DNS already present: ${wanted.type} ${wanted.name || '@'} ${wanted.value}`);
    return;
  }

  if (['A', 'AAAA', 'CNAME'].includes(wanted.type)) {
    const conflicts = records.filter(record =>
      relativeName(record?.name || '') === wanted.name
      && ['A', 'AAAA', 'CNAME'].includes(String(record?.type || '').toUpperCase())
    );
    for (const conflict of conflicts) await deleteVercelRecord(conflict);
  }

  const url = `${vercelBase}/v2/domains/${encodeURIComponent(apexDomain)}/records?teamId=${encodeURIComponent(vercelTeamId)}`;
  await jsonFetch(url, {
    method: 'POST',
    headers: vercelHeaders,
    body: JSON.stringify({
      type: wanted.type,
      name: wanted.name,
      value: wanted.value,
      ttl: 60,
      comment: 'Firebase Hosting: audio.hitobito.jp',
    }),
  });
  console.log(`Added Vercel DNS ${wanted.type} ${wanted.name || '@'} ${wanted.value}`);
}

async function applyToVercel(requirements) {
  // Exact A record beats the Vercel wildcard that currently sends audio.hitobito.jp to a Vercel 404.
  await ensureVercelRecord({ type: 'A', name: 'audio', value: '199.36.158.100' });

  for (const record of requirements.desired.filter(r => r.requiredAction === 'ADD')) {
    await ensureVercelRecord(record);
  }

  const current = await listVercelRecords();
  console.log('Vercel audio/levelup DNS records:');
  console.log(JSON.stringify(current
    .filter(record => ['audio', 'levelup'].includes(relativeName(record?.name || '')))
    .map(record => ({ name: record.name, type: record.type, value: record.value, ttl: record.ttl })), null, 2));
}

await ensureCustomDomain();
const domain = await getFirebaseDomain();
const requirements = printFirebaseRequirements(domain);

if (!vercelToken) {
  console.log('VERCEL_TOKEN is not configured. Firebase DNS requirements were reported; Vercel DNS write was skipped.');
  process.exit(0);
}

await applyToVercel(requirements);
console.log('audio.hitobito.jp DNS is configured in Vercel for direct Firebase Hosting.');
