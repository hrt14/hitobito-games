import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const canonicalBase = 'https://levelup.hitobito.jp';
const feedUrl = `${canonicalBase}/feed.xml`;
const webSubHub = 'https://pubsubhubbub.appspot.com/';
const indexNowKey = '52d7d66fce9d4e7aa902bc5842a66d74';
const googleVerificationToken = 'sPBsbYpwHySgc4VntENvvGC4M--IgVcITX__dUozokA';
const googleVerificationFile = 'google4a20d374a163ef3d.html';

if (!fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP catalog not found. Run this after the Firebase LEVEL UP build.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).games || [];
if (!catalog.length) throw new Error('LEVEL UP catalog is empty.');

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function canonicalFor(game) {
  const href = game.href && game.href.startsWith('/') ? game.href : `/apps/${encodeURIComponent(game.slug)}/`;
  const url = new URL(href, canonicalBase);
  url.search = '';
  url.hash = '';
  if (url.pathname !== '/' && !url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

function indexPathFor(game) {
  const url = new URL(canonicalFor(game));
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '').replace(/\/+$/, '');
  return relative ? path.join(outDir, relative, 'index.html') : path.join(outDir, 'index.html');
}

function ensureFeedAlternate(html) {
  if (html.includes('type="application/atom+xml"') && html.includes('/feed.xml')) return html;
  return html.replace('</head>', `  <link rel="alternate" type="application/atom+xml" title="LEVEL UP updates" href="${feedUrl}" />\n</head>`);
}

function ensureGoogleVerification(html) {
  if (html.includes(`name="google-site-verification"`) && html.includes(googleVerificationToken)) return html;
  return html.replace('</head>', `  <meta name="google-site-verification" content="${googleVerificationToken}" />\n</head>`);
}

function ensureSoftwareApplication(html, game) {
  let next = html.replaceAll('"@type":"WebApplication"', '"@type":"SoftwareApplication"');
  if (next.includes('"@type":"SoftwareApplication"')) return next;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${game.title || game.slug} | LEVEL UP`,
    description: game.description || game.benefit || '遊んで、考え方と行動の反射を鍛えるLEVEL UPトレーニング。',
    url: canonicalFor(game),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  }).replaceAll('</', '<\\/');

  return next.replace('</head>', `  <script type="application/ld+json" data-levelup-software-application>${jsonLd}</script>\n</head>`);
}

let structuredPages = 0;
for (const game of catalog) {
  const indexPath = indexPathFor(game);
  if (!fs.existsSync(indexPath)) continue;
  const before = fs.readFileSync(indexPath, 'utf8');
  let after = ensureSoftwareApplication(before, game);
  after = ensureFeedAlternate(after);
  fs.writeFileSync(indexPath, after);
  if (after.includes('"@type":"SoftwareApplication"')) structuredPages += 1;
}

const homePath = path.join(outDir, 'index.html');
if (fs.existsSync(homePath)) {
  const before = fs.readFileSync(homePath, 'utf8');
  let after = ensureFeedAlternate(before);
  after = ensureGoogleVerification(after);
  fs.writeFileSync(homePath, after);
}

fs.writeFileSync(
  path.join(outDir, googleVerificationFile),
  `google-site-verification: ${googleVerificationFile}\n`,
);

const generatedAt = new Date().toISOString();
const entries = catalog.map((game) => {
  const url = canonicalFor(game);
  const title = game.title || game.slug;
  const summary = String(game.description || game.benefit || '').replace(/\s+/g, ' ').trim().slice(0, 220);
  return `  <entry>\n    <title>${escapeXml(title)}</title>\n    <id>${escapeXml(url)}</id>\n    <link rel="alternate" href="${escapeXml(url)}" />\n    <updated>${generatedAt}</updated>\n    <summary>${escapeXml(summary)}</summary>\n  </entry>`;
});

const atom = `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>LEVEL UP updates</title>\n  <id>${canonicalBase}/</id>\n  <link rel="self" href="${feedUrl}" />\n  <link rel="hub" href="${webSubHub}" />\n  <link rel="alternate" href="${canonicalBase}/" />\n  <updated>${generatedAt}</updated>\n${entries.join('\n')}\n</feed>\n`;
fs.writeFileSync(path.join(outDir, 'feed.xml'), atom);

fs.writeFileSync(path.join(outDir, `${indexNowKey}.txt`), `${indexNowKey}\n`);

const robotsPath = path.join(outDir, 'robots.txt');
let robots = fs.existsSync(robotsPath)
  ? fs.readFileSync(robotsPath, 'utf8')
  : `User-agent: *\nAllow: /\n`;
if (!robots.includes(`Sitemap: ${feedUrl}`)) {
  if (!robots.endsWith('\n')) robots += '\n';
  robots += `Sitemap: ${feedUrl}\n`;
}
fs.writeFileSync(robotsPath, robots);

const feed = fs.readFileSync(path.join(outDir, 'feed.xml'), 'utf8');
if (!feed.includes(`<link rel="hub" href="${webSubHub}" />`)) throw new Error('Atom feed is missing WebSub hub discovery.');
if (!feed.includes(`<link rel="self" href="${feedUrl}" />`)) throw new Error('Atom feed is missing self discovery.');
if (structuredPages < Math.max(1, Math.floor(catalog.length * 0.9))) {
  throw new Error(`SoftwareApplication coverage too low: ${structuredPages}/${catalog.length}`);
}
if (fs.readFileSync(path.join(outDir, `${indexNowKey}.txt`), 'utf8').trim() !== indexNowKey) {
  throw new Error('IndexNow verification key file is invalid.');
}
if (fs.readFileSync(path.join(outDir, googleVerificationFile), 'utf8').trim() !== `google-site-verification: ${googleVerificationFile}`) {
  throw new Error('Google Search Console verification file is invalid.');
}
if (!fs.readFileSync(homePath, 'utf8').includes(googleVerificationToken)) {
  throw new Error('Google Search Console meta verification is missing from LEVEL UP home.');
}

console.log(`[Firebase] LEVEL UP organic discovery ready: ${structuredPages} SoftwareApplication pages + Atom/WebSub feed + IndexNow + Google Search Console verification.`);