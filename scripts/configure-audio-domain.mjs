const projectId = 'hitobito-levelup';
const siteId = 'hitobito-audio';
const customDomain = 'audio.hitobito.jp';
const apexDomain = 'hitobito.jp';
const firebaseToken = process.env.FIREBASE_ACCESS_TOKEN;
const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;

if (!firebaseToken) throw new Error('FIREBASE_ACCESS_TOKEN is missing');
if (!cloudflareToken) throw new Error('CLOUDFLARE_API_TOKEN is missing');

const fbHeaders = { Authorization: `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' };
const cfHeaders = { Authorization: `Bearer ${cloudflareToken}`, 'Content-Type': 'application/json' };
const fbBase = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/customDomains`;

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
  let result = await jsonFetch(`${fbBase}/${customDomain}`, { headers: fbHeaders }, [404]);
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

async function getZoneId() {
  const { body } = await jsonFetch(`https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(apexDomain)}`, { headers: cfHeaders });
  const zone = body?.result?.[0];
  if (!body?.success || !zone?.id) throw new Error(`Cloudflare zone not found for ${apexDomain}`);
  return zone.id;
}

async function listRecords(zoneId, name) {
  const clean = name.replace(/\.$/, '');
  const { body } = await jsonFetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(clean)}&per_page=100`, { headers: cfHeaders });
  return body?.result || [];
}

function normalizeTxt(value) {
  const v = String(value ?? '').trim();
  return v.length >= 2 && v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1).replace(/\\"/g, '"') : v;
}

function cfPayload(record) {
  const name = record.domainName.replace(/\.$/, '');
  if (record.type === 'CAA') {
    const match = String(record.rdata).match(/^\s*(\d+)\s+(\S+)\s+"?(.+?)"?\s*$/);
    if (!match) return null;
    return { type: 'CAA', name, data: { flags: Number(match[1]), tag: match[2], value: match[3] }, ttl: 1 };
  }
  return {
    type: record.type,
    name,
    content: record.type === 'TXT' ? normalizeTxt(record.rdata) : String(record.rdata).replace(/\.$/, ''),
    ttl: 1,
    ...(record.type === 'A' || record.type === 'AAAA' || record.type === 'CNAME' ? { proxied: false } : {})
  };
}

function sameRecord(existing, desired) {
  if (existing.type !== desired.type || existing.name !== desired.name) return false;
  if (desired.type === 'CAA') {
    return Number(existing.data?.flags ?? existing.flags ?? -1) === desired.data.flags &&
      String(existing.data?.tag ?? existing.tag ?? '') === desired.data.tag &&
      String(existing.data?.value ?? existing.value ?? '') === desired.data.value;
  }
  const existingContent = desired.type === 'TXT' ? normalizeTxt(existing.content) : String(existing.content || '').replace(/\.$/, '');
  return existingContent === desired.content;
}

async function deleteRecord(zoneId, record) {
  await jsonFetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`, { method: 'DELETE', headers: cfHeaders });
  console.log(`Removed DNS ${record.type} ${record.name} ${record.content || ''}`);
}

async function ensureRecord(zoneId, desiredRecord) {
  const payload = cfPayload(desiredRecord);
  if (!payload) { console.log(`Skipping unsupported DNS value: ${JSON.stringify(desiredRecord)}`); return; }
  const existing = await listRecords(zoneId, payload.name);
  if (existing.some(r => sameRecord(r, payload))) {
    console.log(`DNS already present: ${payload.type} ${payload.name}`);
    return;
  }
  if (['A', 'AAAA', 'CNAME'].includes(payload.type)) {
    for (const conflict of existing.filter(r => ['A', 'AAAA', 'CNAME'].includes(r.type))) await deleteRecord(zoneId, conflict);
  }
  const { body } = await jsonFetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: 'POST', headers: cfHeaders, body: JSON.stringify(payload)
  });
  if (!body?.success) throw new Error(`Cloudflare failed to create ${payload.type} ${payload.name}: ${JSON.stringify(body?.errors)}`);
  console.log(`Added DNS ${payload.type} ${payload.name} ${payload.content || JSON.stringify(payload.data)}`);
}

async function applyFirebaseDns(zoneId) {
  await ensureRecord(zoneId, { type: 'A', domainName: customDomain, rdata: '199.36.158.100', requiredAction: 'ADD' });

  for (let attempt = 1; attempt <= 6; attempt++) {
    const { response, body: domain } = await jsonFetch(`${fbBase}/${customDomain}`, { headers: fbHeaders }, [404]);
    if (response.status === 404) { await sleep(3000); continue; }
    const updates = domain?.requiredDnsUpdates || {};
    const discovered = (updates.discovered || []).flatMap(set => set.records || []);
    const desired = (updates.desired || []).flatMap(set => set.records || []);
    for (const record of discovered.filter(r => r.requiredAction === 'REMOVE')) {
      const name = String(record.domainName || customDomain).replace(/\.$/, '');
      const existing = await listRecords(zoneId, name);
      const payload = cfPayload(record);
      for (const match of existing.filter(r => payload && sameRecord(r, payload))) await deleteRecord(zoneId, match);
    }
    for (const record of desired.filter(r => r.requiredAction === 'ADD')) await ensureRecord(zoneId, record);
    console.log(`Firebase domain status: host=${domain?.hostState || 'unknown'} ownership=${domain?.ownershipState || 'unknown'} cert=${domain?.cert?.state || 'unknown'} reconciling=${Boolean(domain?.reconciling)}`);
    if ((domain?.hostState === 'HOST_ACTIVE') && (domain?.ownershipState === 'OWNERSHIP_ACTIVE')) break;
    if (desired.length) break;
    await sleep(3000);
  }
}

await ensureCustomDomain();
const zoneId = await getZoneId();
await applyFirebaseDns(zoneId);
