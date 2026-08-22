import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const cloudflareRoot = path.join(root, '.dist', 'cloudflare');
const MIN_PX = 14;
const MARKER = 'play-mobile-type-floor-v2';

if (!fs.existsSync(cloudflareRoot)) {
  throw new Error(`Cloudflare bundle not found: ${cloudflareRoot}`);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(?:html|css|js)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function raiseTinyFontSizes(content) {
  let changed = 0;
  const next = content.replace(/font-size\s*:\s*([^;}{]+)/gi, (match, value) => {
    const raised = value.replace(/(\d+(?:\.\d+)?)px/gi, (pxMatch, raw) => {
      const size = Number(raw);
      if (!Number.isFinite(size) || size <= 0 || size >= MIN_PX) return pxMatch;
      changed += 1;
      return `${MIN_PX}px`;
    });
    return match.replace(value, raised);
  });
  return { content: next, changed };
}

function normalizeViewport(html) {
  const safeViewport = '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />';
  const viewportPattern = /<meta\b[^>]*\bname=["']viewport["'][^>]*>/i;
  if (viewportPattern.test(html)) return html.replace(viewportPattern, safeViewport);
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>\n${safeViewport}`);
  return `${safeViewport}\n${html}`;
}

function injectReadabilityBaseline(html, isPortal) {
  if (html.includes(`id="${MARKER}"`)) return html;

  const portalRules = isPortal ? `
    html body #games .game-card h3 { font-size:24px !important; line-height:1.18 !important; }
    html body #games .game-card p { font-size:16px !important; line-height:1.68 !important; }
    html body #games .card-meta,
    html body #games .cover-number,
    html body #games .tag,
    html body #games .meta { font-size:14px !important; line-height:1.45 !important; }
    html body .hero-copy,
    html body .feature p,
    html body .levelup-copy { font-size:16px !important; line-height:1.7 !important; }
    html body .section-head h2,
    html body .section-head span,
    html body .brand,
    html body .pill,
    html body .eyebrow,
    html body .hero-side { font-size:14px !important; line-height:1.45 !important; }
  ` : '';

  const style = `
<style id="${MARKER}">
  /* PLAY readability baseline: metadata >=14px, reading/action text >=16px on phones. */
  html { -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  @media (max-width: 768px) {
    html body { font-size:16px !important; }
    html body p:not(.play-type-allow-small),
    html body li:not(.play-type-allow-small),
    html body dd:not(.play-type-allow-small),
    html body dt:not(.play-type-allow-small) {
      font-size:16px !important;
      line-height:1.7 !important;
    }
    html body small:not(.play-type-allow-small) {
      font-size:14px !important;
      line-height:1.45 !important;
    }
    html body button:not(.play-type-allow-small),
    html body input:not(.play-type-allow-small),
    html body textarea:not(.play-type-allow-small),
    html body select:not(.play-type-allow-small),
    html body a[role="button"]:not(.play-type-allow-small) {
      font-size:16px !important;
      line-height:1.35 !important;
    }
    html body [class*="hint"]:not(.play-type-allow-small),
    html body [class*="message"]:not(.play-type-allow-small),
    html body [class*="summary"]:not(.play-type-allow-small),
    html body [class*="description"]:not(.play-type-allow-small) {
      font-size:16px !important;
      line-height:1.6 !important;
    }
    ${portalRules}
  }
</style>`;

  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${style}\n</head>`);
  return `${style}\n${html}`;
}

const files = walk(cloudflareRoot);
let filesChanged = 0;
let declarationsRaised = 0;
let htmlTouched = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const raised = raiseTinyFontSizes(original);
  let next = raised.content;

  if (/\.html$/i.test(file)) {
    next = normalizeViewport(next);
    next = injectReadabilityBaseline(next, path.relative(cloudflareRoot, file) === 'index.html');
    htmlTouched += 1;
  }

  if (next !== original) {
    fs.writeFileSync(file, next);
    filesChanged += 1;
    declarationsRaised += raised.changed;
  }
}

const tinyDeclarations = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/font-size\s*:\s*([^;}{]+)/gi)) {
    for (const px of match[1].matchAll(/(\d+(?:\.\d+)?)px/gi)) {
      const size = Number(px[1]);
      if (size > 0 && size < MIN_PX) tinyDeclarations.push(`${path.relative(cloudflareRoot, file)}:${px[0]}`);
    }
  }
  if (/\.html$/i.test(file) && !content.includes(`id="${MARKER}"`)) {
    throw new Error(`Missing PLAY readability marker: ${path.relative(cloudflareRoot, file)}`);
  }
}

if (tinyDeclarations.length) {
  throw new Error(`PLAY typography floor failed; remaining declarations: ${tinyDeclarations.slice(0, 20).join(', ')}`);
}

console.log(`[PLAY typography] ${declarationsRaised} tiny font declarations raised to ${MIN_PX}px across ${filesChanged} files; ${htmlTouched} HTML pages received the mobile readability baseline.`);
