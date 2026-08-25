const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'hitobito-levelup';
const SITE_ID = process.env.FIREBASE_SITE_ID || 'hitobito-sportsdata-995292';
const DOMAIN = process.env.SPORTS_DOMAIN || 'xn--zckmom2i6hc.hitobito.jp';
const GOOGLE_TOKEN = process.env.GOOGLE_ACCESS_TOKEN;
const CF_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_PAGES_PROJECT = process.env.CF_PAGES_PROJECT || 'hitobito-games-normal';
const CF_REFERENCE_DOMAIN = process.env.CF_REFERENCE_DOMAIN || 'play.hitobito.jp';

if (!GOOGLE_TOKEN) throw new Error('GOOGLE_ACCESS_TOKEN is required');
if (!CF_TOKEN) throw new Error('CF_API_TOKEN is required');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const firebaseBase = 'https://firebasehosting.googleapis.com/v1beta1';
const cfBase = 'https://api.cloudflare.com/client/v4';

async function jsonFetch(url, options = {}, allow = []) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  if (!response.ok && !allow.includes(response.status)) throw new Error(`${options.method || 'GET'} ${url} -> ${response.status}: ${text.slice(0, 800)}`);
  return { response, body };
}

const googleHeaders = { Authorization: `Bearer ${GOOGLE_TOKEN}`, 'Content-Type': 'application/json' };
const cfHeaders = { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' };

async function ensureSite() {
  const url = `${firebaseBase}/projects/${PROJECT_ID}/sites/${SITE_ID}`;
  const current = await jsonFetch(url, { headers: googleHeaders }, [404]);
  if (current.response.ok) return console.log(`Firebase Hosting site exists: ${SITE_ID}`);
  await jsonFetch(`${firebaseBase}/projects/${PROJECT_ID}/sites?siteId=${encodeURIComponent(SITE_ID)}`, { method: 'POST', headers: googleHeaders, body: '{}' });
  console.log(`Created Firebase Hosting site: ${SITE_ID}`);
}

async function ensureCustomDomain() {
  const url = `${firebaseBase}/projects/${PROJECT_ID}/sites/${SITE_ID}/customDomains/${DOMAIN}`;
  const current = await jsonFetch(url, { headers: googleHeaders }, [404]);
  if (current.response.ok) return current.body;
  await jsonFetch(`${firebaseBase}/projects/${PROJECT_ID}/sites/${SITE_ID}/customDomains?customDomainId=${encodeURIComponent(DOMAIN)}`, { method: 'POST', headers: googleHeaders, body: '{}' });
  console.log(`Requested Firebase custom domain: ${DOMAIN}`);
  for (let i = 0; i < 18; i++) {
    await sleep(5000);
    const next = await jsonFetch(url, { headers: googleHeaders }, [404]);
    if (next.response.ok) return next.body;
  }
  throw new Error('Custom domain was not readable after creation request');
}

async function getZoneId() {
  const direct = await jsonFetch(`${cfBase}/zones?name=hitobito.jp`, { headers: cfHeaders });
  const directId = direct.body?.result?.[0]?.id;
  if (direct.body?.success && directId) {
    console.log('Resolved Cloudflare zone through Zones API.');
    return directId;
  }

  if (CF_ACCOUNT_ID) {
    const domainUrl = `${cfBase}/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/domains/${CF_REFERENCE_DOMAIN}`;
    const domain = await jsonFetch(domainUrl, { headers: cfHeaders }, [404]);
    const domainZone = domain.body?.result?.zone_tag;
    if (domain.body?.success && domainZone) {
      console.log(`Resolved Cloudflare zone through Pages domain ${CF_REFERENCE_DOMAIN}.`);
      return domainZone;
    }

    const listUrl = `${cfBase}/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/domains`;
    const list = await jsonFetch(listUrl, { headers: cfHeaders }, [403, 404]);
    const domains = Array.isArray(list.body?.result) ? list.body.result : [];
    const match = domains.find((item) => item?.name === CF_REFERENCE_DOMAIN && item?.zone_tag)
      || domains.find((item) => item?.zone_tag && String(item?.name || '').endsWith('.hitobito.jp'));
    if (list.body?.success && match?.zone_tag) {
      console.log(`Resolved Cloudflare zone through Pages domain list (${match.name}).`);
      return match.zone_tag;
    }
  }

  throw new Error('Cloudflare hitobito.jp zone not found through Zones API or Pages domain fallback');
}

const cleanName = (value) => String(value || '').replace(/\.$/, '');
function cleanContent(type, value) {
  let content = String(value || '').trim();
  if (type === 'TXT' && content.startsWith('"') && content.endsWith('"')) content = content.slice(1, -1).replaceAll('\\"', '"');
  if (type === 'CNAME') content = content.replace(/\.$/, '');
  return content;
}

async function listRecords(zoneId, name, type) {
  const result = await jsonFetch(`${cfBase}/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&per_page=100`, { headers: cfHeaders });
  if (!result.body?.success) throw new Error(`Cloudflare list failed for ${type} ${name}: ${JSON.stringify(result.body?.errors || [])}`);
  return result.body.result || [];
}
async function removeId(zoneId, id) {
  const result = await jsonFetch(`${cfBase}/zones/${zoneId}/dns_records/${id}`, { method: 'DELETE', headers: cfHeaders });
  if (!result.body?.success) throw new Error(`Cloudflare delete failed: ${id}`);
}
async function addRecord(zoneId, record) {
  const name = cleanName(record.domainName), type = record.type, content = cleanContent(type, record.rdata);
  if (!['A', 'AAAA', 'CNAME', 'TXT'].includes(type)) { console.log(`Skipping DNS type ${type}: ${name}`); return false; }
  const existing = await listRecords(zoneId, name, type);
  if (existing.some((item) => cleanContent(type, item.content) === content)) return false;
  if (type === 'CNAME') for (const item of existing) await removeId(zoneId, item.id);
  const payload = { type, name, content, ttl: 300 };
  if (type !== 'TXT') payload.proxied = false;
  const result = await jsonFetch(`${cfBase}/zones/${zoneId}/dns_records`, { method: 'POST', headers: cfHeaders, body: JSON.stringify(payload) });
  if (!result.body?.success) throw new Error(`Cloudflare create failed for ${type} ${name}: ${JSON.stringify(result.body?.errors || [])}`);
  console.log(`DNS ADD ${type} ${name} ${content}`);
  return true;
}
async function removeRecord(zoneId, record) {
  const name = cleanName(record.domainName), type = record.type, content = cleanContent(type, record.rdata);
  if (!['A', 'AAAA', 'CNAME', 'TXT'].includes(type)) return false;
  const existing = await listRecords(zoneId, name, type);
  let changed = false;
  for (const item of existing) if (!content || cleanContent(type, item.content) === content) { await removeId(zoneId, item.id); console.log(`DNS REMOVE ${type} ${name} ${item.content}`); changed = true; }
  return changed;
}

function required(domain) {
  const take = (source, action) => (source || []).flatMap((set) => set.records || []).filter((record) => record.requiredAction === action);
  return {
    add: [...take(domain?.requiredDnsUpdates?.desired, 'ADD'), ...take(domain?.cert?.verification?.dns?.desired, 'ADD')],
    remove: [...take(domain?.requiredDnsUpdates?.discovered, 'REMOVE'), ...take(domain?.cert?.verification?.dns?.discovered, 'REMOVE')]
  };
}
async function syncDns(zoneId, domain) {
  const records = required(domain);
  console.log(`Firebase requires DNS add=${records.add.length} remove=${records.remove.length}`);
  for (const record of records.remove) await removeRecord(zoneId, record);
  for (const record of records.add) await addRecord(zoneId, record);
}
async function getDomain() {
  return (await jsonFetch(`${firebaseBase}/projects/${PROJECT_ID}/sites/${SITE_ID}/customDomains/${DOMAIN}`, { headers: googleHeaders })).body;
}
async function reconcile(zoneId, first) {
  let current = first;
  for (let i = 0; i < 32; i++) {
    await syncDns(zoneId, current);
    const ready = current?.hostState === 'HOST_ACTIVE' && current?.ownershipState === 'OWNERSHIP_ACTIVE' && ['CERT_ACTIVE', 'CERT_EXPIRING_SOON'].includes(current?.cert?.state);
    console.log(`Firebase domain: host=${current?.hostState} ownership=${current?.ownershipState} cert=${current?.cert?.state}`);
    if (ready) return current;
    await sleep(10000);
    current = await getDomain();
  }
  console.log('Domain provisioning is still in progress; DNS is synchronized.');
  return current;
}

await ensureSite();
const customDomain = await ensureCustomDomain();
const zoneId = await getZoneId();
const finalState = await reconcile(zoneId, customDomain);
console.log(JSON.stringify({ domain: DOMAIN, site: SITE_ID, hostState: finalState?.hostState, ownershipState: finalState?.ownershipState, certState: finalState?.cert?.state }, null, 2));
