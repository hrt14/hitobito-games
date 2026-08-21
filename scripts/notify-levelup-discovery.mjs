const canonicalBase = 'https://levelup.hitobito.jp';
const host = 'levelup.hitobito.jp';
const feedUrl = `${canonicalBase}/feed.xml`;
const sitemapUrl = `${canonicalBase}/sitemap.xml`;
const indexNowKey = '52d7d66fce9d4e7aa902bc5842a66d74';
const indexNowKeyLocation = `${canonicalBase}/${indexNowKey}.txt`;
const webSubHub = 'https://pubsubhubbub.appspot.com/';

async function readText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'hitobito-levelup-discovery/1.0' } });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.text();
}

const [sitemap, keyFile, feed] = await Promise.all([
  readText(sitemapUrl),
  readText(indexNowKeyLocation),
  readText(feedUrl),
]);

if (keyFile.trim() !== indexNowKey) throw new Error('Production IndexNow key verification file does not match.');
if (!feed.includes(`rel="hub" href="${webSubHub}"`)) throw new Error('Production Atom feed is missing the WebSub hub link.');

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].replaceAll('&amp;', '&'))
  .filter((url) => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  });

for (const url of [canonicalBase + '/', feedUrl]) {
  if (!urls.includes(url)) urls.push(url);
}

if (!urls.length) throw new Error('No production URLs found for IndexNow submission.');
if (urls.length > 10000) throw new Error(`IndexNow URL list exceeds 10,000 URLs: ${urls.length}`);

const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key: indexNowKey,
    keyLocation: indexNowKeyLocation,
    urlList: urls,
  }),
});

if (![200, 202].includes(indexNowResponse.status)) {
  const body = await indexNowResponse.text().catch(() => '');
  throw new Error(`IndexNow submission failed: ${indexNowResponse.status} ${body.slice(0, 300)}`);
}

const hubBody = new URLSearchParams({
  'hub.mode': 'publish',
  'hub.url': feedUrl,
});
const hubResponse = await fetch(webSubHub, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: hubBody,
});
if (!hubResponse.ok) {
  const body = await hubResponse.text().catch(() => '');
  throw new Error(`WebSub publish notification failed: ${hubResponse.status} ${body.slice(0, 300)}`);
}

console.log(`IndexNow accepted ${urls.length} URLs with HTTP ${indexNowResponse.status}.`);
console.log(`WebSub hub accepted ${feedUrl} with HTTP ${hubResponse.status}.`);
