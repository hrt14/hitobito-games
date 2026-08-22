const projectId = 'hitobito-levelup';
const siteId = 'hitobito-audio';
const customDomain = 'audio.hitobito.jp';
const apexDomain = 'hitobito.jp';
const firebaseToken = process.env.FIREBASE_ACCESS_TOKEN;
const vercelToken = process.env.VERCEL_TOKEN;
const vercelTeamId = process.env.VERCEL_TEAM_ID || 'team_vCUqyPcmj2xuDuBM7f7aOiMQ';

if (!firebaseToken) throw new Error('FIREBASE_ACCESS_TOKEN is missing');
if (!vercelToken) throw new Error('VERCEL_TOKEN is missing');

const fbHeaders = { Authorization: `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' };
const vercelHeaders = { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' };
const fbBase = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/customDomains`;
const vercelBase = `https://api.vercel.com`;
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
  if (result.response.status === 404) {
    console.log(`Creating Firebase custom domain ${customDomain}`);
    await jsonFetch(`${fbBase}?customDomainId=${encodeURIComponent(customDomain)}`, {
      method: 'POST', headers: fbHeaders, body: '{}'
    });
    await sleep(3000);
  } else {
    console.log(`Firebase custom domain already exists: ${customDomain}`);
  }
}

function cleanName(value) {
  return String(value || '').trim().replace(/\.$/, '');
}

function relativeName(value) {
  const clean = cleanName(value).toLowerCase();
  const apex = apexDomain.toLowerCase();
  if (!clean || clean === apex) return '';
  if (clean.endsWith(`.${apex}`)) return clean.slice(0, -(apex.length + 1));
  return clean;
}

function normalizeTxt(value) {
  const v = String(value ?? '').trim();
  return v.length >= 2 && v.startsWith('"') && v.endsWith('"')
    ? v.slice(1, -1).replace(/\\"/g, '"')
    : v;
}

function normalizeValue(type, value) {
  if (type === 'TXT') return normalizeTxt(value);
  return cleanName(value);
}

function desiredFromFirebase(record) {
  if (!record?.type || !record?.domainName || record.rdata == null) return null;
  const type = String(record.type).toUpperCase();
  if (!['A', 'AAAA', 'CNAME', 'TXT', 'CAA'].includes(type)) {
    console.log(`Skipping unsupported Firebase DNS type ${type}: ${JSON.stringify(record)}`);
    return null;
  }
  return {
    type,
    name: relativeName(record.domainName),
    value: normalizeValue(type, record.rdata),
  };
}

async function listVercelRecords() {
  const url = `${vercelBase}/v5/domains/${encodeURIComponent(apexDomain)}/records?limit=100&teamId=${encodeURIComponent(vercelTeamId)}`;
  const { body } = await jsonFetch(url, { headers: vercelHeaders });
  return body?.records || [];
}

function vercelRecordId(record) {
  return record?.uid || record?.id;
}

function vercelRecordName(record) {
  return relativeName(record?.name || '');
}

function sameRecord(record, desired) {
  return String(record?.type || '').toUpperCase() === desired.type
    && vercelRecordName(record) === desired.name
    && normalizeValue(desired.type, record?.value) === desired.value;
}

async function deleteVercelRecord(record) {
  const id = vercelRecordId(record);
  if (!id) throw new Error(`Vercel DNS record has no id: ${JSON.stringify(record)}`);
  const url = `${vercelBase}/v2/domains/${encodeURIComponent(apexDomain)}/records/${encodeURIComponent(id)}?teamId=${encodeURIComponent(vercelTeamId)}`;
  await jsonFetch(url, { method: 'DELETE', headers: vercelHeaders });
  console.log(`Removed Vercel DNS ${record.type} ${record.name || '@'} ${record.value || ''}`);
}

async function createVercelRecord(desired) {
  const url = `${vercelBase}/v2/domains/${encodeURIComponent(apexDomain)}/records?teamId=${encodeURIComponent(vercelTeamId)}`;
  const payload = {
    type: desired.type,
    name: desired.name,
    value: desired.value,
    ttl: 60,
    comment: 'Firebase Hosting: audio.hitobito.jp',
  };
  await jsonFetch(url, { method: 'POST', headers: vercelHeaders, body: JSON.stringify(payload) });
  console.log(`Added Vercel DNS ${desired.type} ${desired.name || '@'} ${desired.value}`);
}

async function ensureVercelRecord(desired) {
  let records = await listVercelRecords();
  if (records.some(record => sameRecord(record, desired))) {
    console.log(`Vercel DNS already present: ${desired.type} ${desired.name || '@'} ${desired.value}`);
    return;
  }

  if (['A', 'AAAA', 'CNAME'].includes(desired.type)) {
    const conflicts = records.filter(record =>
      vercelRecordName(record) === desired.name
      && ['A', 'AAAA', 'CNAME'].includes(String(record?.type || '').toUpperCase())
    );
    for (const conflict of conflicts) await deleteVercelRecord(conflict);
  }

  await createVercelRecord(desired);
}

async function removeFirebaseRequestedRecord(record) {
  const desired = desiredFromFirebase(record);
  if (!desired) return;
  const records = await listVercelRecords();
  for (const existing of records.filter(item => sameRecord(item, desired))) {
    await deleteVercelRecord(existing);
  }
}

async function logLevelupAndAudioRecords() {
  const records = await listVercelRecords();
  const selected = records
    .filter(record => ['levelup', 'audio'].includes(vercelRecordName(record)))
    .map(record => ({
      id: vercelRecordId(record),
      name: record.name,
      type: record.type,
      value: record.value,
      ttl: record.ttl,
    }));
  console.log('Vercel DNS comparison (LEVEL UP / audio):');
  console.log(JSON.stringify(selected, null, 2));
}

async function applyFirebaseDnsToVercel() {
  await logLevelupAndAudioRecords();

  // Firebase Hosting's standard custom-domain address. This exact record overrides
  // any Vercel wildcard record that previously made audio.hitobito.jp return Vercel 404.
  await ensureVercelRecord({ type: 'A', name: 'audio', value: '199.36.158.100' });

  for (let attempt = 1; attempt <= 8; attempt++) {
    const { response, body: domain } = await jsonFetch(`${fbBase}/${customDomain}`, { headers: fbHeaders }, [404]);
    if (response.status === 404) {
      await sleep(3000);
      continue;
    }

    const updates = domain?.requiredDnsUpdates || {};
    const discovered = (updates.discovered || []).flatMap(set => set.records || []);
    const desired = (updates.desired || []).flatMap(set => set.records || []);

    for (const record of discovered.filter(r => r.requiredAction === 'REMOVE')) {
      await removeFirebaseRequestedRecord(record);
    }
    for (const record of desired.filter(r => r.requiredAction === 'ADD')) {
      const target = desiredFromFirebase(record);
      if (target) await ensureVercelRecord(target);
    }

    console.log(`Firebase domain status: host=${domain?.hostState || 'unknown'} ownership=${domain?.ownershipState || 'unknown'} cert=${domain?.cert?.state || 'unknown'}`);
    if (domain?.hostState === 'HOST_ACTIVE' && domain?.ownershipState === 'OWNERSHIP_ACTIVE') break;
    if (desired.length) break;
    await sleep(3000);
  }

  await logLevelupAndAudioRecords();

  for (let attempt = 1; attempt <= 12; attempt++) {
    const { body: domain } = await jsonFetch(`${fbBase}/${customDomain}`, { headers: fbHeaders });
    console.log(`Firebase propagation check ${attempt}: host=${domain?.hostState || 'unknown'} ownership=${domain?.ownershipState || 'unknown'} cert=${domain?.cert?.state || 'unknown'}`);
    if (domain?.hostState === 'HOST_ACTIVE' && domain?.ownershipState === 'OWNERSHIP_ACTIVE') return;
    await sleep(10000);
  }
}

await ensureCustomDomain();
await applyFirebaseDnsToVercel();
console.log('audio.hitobito.jp DNS is configured in Vercel for direct Firebase Hosting.');
