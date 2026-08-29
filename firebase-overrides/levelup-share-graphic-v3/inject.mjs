import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const assetsDir = path.join(outDir, 'assets');
const outputImage = path.join(assetsDir, 'levelup-share-v3.jpg');
const imageUrl = 'https://levelup.hitobito.jp/assets/levelup-share-v3.jpg';
const expectedBytes = 30109;
const expectedSha256 = '36408c894c550b71f8f7e785796bf79839126b10157e4b8bd82140bc0a3980ce';

if (!fs.existsSync(outDir)) {
  throw new Error('LEVEL UP Firebase bundle not found. Run this after the main LEVEL UP build.');
}

const chunkFiles = fs.readdirSync(dir)
  .filter((name) => /^image-\d+\.b64$/.test(name))
  .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));

if (chunkFiles.length !== 7) {
  throw new Error(`LEVEL UP share graphic v3 expected 7 chunks, found ${chunkFiles.length}.`);
}

const encoded = chunkFiles
  .map((name) => fs.readFileSync(path.join(dir, name), 'utf8').replace(/\s+/g, ''))
  .join('');
const image = Buffer.from(encoded, 'base64');
const actualSha256 = crypto.createHash('sha256').update(image).digest('hex');

if (image.length !== expectedBytes || actualSha256 !== expectedSha256 || image[0] !== 0xff || image[1] !== 0xd8) {
  throw new Error(`LEVEL UP share graphic v3 integrity check failed: bytes=${image.length}, sha256=${actualSha256}.`);
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(outputImage, image);

function upsertMeta(html, matcher, tag) {
  if (matcher.test(html)) return html.replace(matcher, tag);
  if (!html.includes('</head>')) return html;
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function patchSocialPreview(html) {
  html = upsertMeta(html, /<meta[^>]+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${imageUrl}" />`);
  html = upsertMeta(html, /<meta[^>]+property=["']og:image:width["'][^>]*>/i, '<meta property="og:image:width" content="1200" />');
  html = upsertMeta(html, /<meta[^>]+property=["']og:image:height["'][^>]*>/i, '<meta property="og:image:height" content="630" />');
  html = upsertMeta(html, /<meta[^>]+property=["']og:image:type["'][^>]*>/i, '<meta property="og:image:type" content="image/jpeg" />');
  html = upsertMeta(html, /<meta[^>]+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${imageUrl}" />`);
  html = upsertMeta(html, /<meta[^>]+name=["']twitter:card["'][^>]*>/i, '<meta name="twitter:card" content="summary_large_image" />');
  return html;
}

let patched = 0;
const walk = (current) => {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.isFile() || entry.name !== 'index.html') continue;
    let html = fs.readFileSync(full, 'utf8');
    if (!html.includes('LEVEL UP') && !html.includes('levelup')) continue;
    const next = patchSocialPreview(html);
    if (next !== html) {
      fs.writeFileSync(full, next);
      patched += 1;
    }
  }
};
walk(outDir);

if (patched < 100) {
  throw new Error(`LEVEL UP share graphic v3 coverage unexpectedly low: ${patched}`);
}

console.log(`[Firebase] LEVEL UP share graphic v3 ready: ${patched} pages use approved 1200x630 social preview; sha256=${actualSha256}.`);
