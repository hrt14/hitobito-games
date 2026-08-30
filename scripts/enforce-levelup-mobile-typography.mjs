import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const firebaseRoot = path.join(root, '.dist', 'firebase');
const MIN_PX = 12;
const MARKER = 'levelup-mobile-type-floor';

if (!fs.existsSync(firebaseRoot)) throw new Error(`Firebase bundle not found: ${firebaseRoot}`);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(?:html|css|js)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function raiseTinyPxFonts(content) {
  let changed = 0;
  const next = content.replace(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi, (match, raw) => {
    const size = Number(raw);
    if (!Number.isFinite(size) || size <= 0 || size >= MIN_PX) return match;
    changed += 1;
    return match.replace(raw, String(MIN_PX));
  });
  return { content: next, changed };
}

function normalizeViewport(html) {
  const safeViewport = '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />';
  const viewportPattern = /<meta\b[^>]*\bname=["']viewport["'][^>]*>/i;
  if (viewportPattern.test(html)) return html.replace(viewportPattern, safeViewport);
  return /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>\n${safeViewport}`) : `${safeViewport}\n${html}`;
}

function injectMobileBaseline(html) {
  if (html.includes(`id="${MARKER}"`)) return html;
  const style = `
<style id="${MARKER}">
  /* LEVEL UP mobile readability floor: product floor 12px; standard actions/inputs 16px. */
  @media (max-width: 768px) {
    small { font-size:12px !important; line-height:1.4; }
    button,input,textarea,select { font-size:16px; }
  }
</style>`;
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${style}\n</head>`) : `${style}\n${html}`;
}

function injectReactionPatternReadability(html) {
  if (!html.includes('data-reaction-pattern-v1') || html.includes('id="reaction-pattern-mobile-readable"')) return html;
  const style = `
<style id="reaction-pattern-mobile-readable">
  @media (max-width: 768px) {
    .home,.brand,.eyebrow,.mirror-dot,.hero-step b,.hero-step span,.mood-labels,.q-meta,.scale-label,
    .bar-name,.bar-score,.bar-desc,.lens b,.lens span,.scene,.sort-buttons button small,.manual small,.chip,
    .stat span,.field label,.breath-orb,.breath-status,.review-prompt,.history-item b,.history-item span,.sources,.toast {
      font-size:12px !important;
      line-height:1.45;
    }
    .lead,.section-copy,.q-copy,.result-note,.hint,.feedback,.manual p,.modal-card p,.note {
      font-size:14px !important;
      line-height:1.7;
    }
    .section-copy,.lead { font-size:15px !important; }
    .primary,.secondary,.ghost,.scale button,.lens,.sort-buttons button,.tool>button {
      font-size:16px !important;
    }
  }
</style>`;
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${style}\n</head>`) : `${style}\n${html}`;
}

function injectMienaiZandakaReadability(html) {
  if (!html.includes('levelup-mienai-zandaka-v1') || html.includes('id="mienai-zandaka-mobile-readable"')) return html;
  const style = `
<style id="mienai-zandaka-mobile-readable">
  html { -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  :root { --muted:#55594f; }
  @media (max-width: 768px) {
    .brand,.day-chip,.eyebrow { font-size:14px !important; }
    .lead { font-size:17px !important; line-height:1.75 !important; color:#41453d !important; }
    .field-head { font-size:14px !important; line-height:1.45 !important; color:rgba(255,255,255,.86) !important; }
    .balance-label { font-size:15px !important; color:rgba(255,255,255,.92) !important; }
    .balance-unit { font-size:14px !important; line-height:1.5 !important; color:rgba(255,255,255,.86) !important; }
    .stat span { font-size:14px !important; line-height:1.35 !important; color:rgba(255,255,255,.84) !important; }
    .secondary { font-size:16px !important; color:#373b34 !important; }
    .hint { font-size:15px !important; line-height:1.65 !important; color:#4d5148 !important; }
    .section h2 { font-size:18px !important; }
    .section-note { font-size:14px !important; line-height:1.45 !important; color:#55594f !important; }
    .history-empty { font-size:15px !important; }
    .history-main b { font-size:16px !important; line-height:1.45 !important; }
    .history-main span { font-size:14px !important; line-height:1.5 !important; color:#55594f !important; }
    .history-delta { font-size:14px !important; }
    details.info summary { font-size:16px !important; color:#3f433b !important; }
    .info-body { font-size:15px !important; line-height:1.75 !important; color:#4b4f47 !important; }
    .reset-btn { min-height:44px; font-size:15px !important; color:#55594f !important; }
    .sheet-copy { font-size:16px !important; line-height:1.7 !important; color:#4c5047 !important; }
    .choice { min-height:76px; padding:14px; }
    .choice b { font-size:17px !important; line-height:1.4 !important; }
    .choice span { font-size:14px !important; line-height:1.55 !important; color:#55594f !important; }
    .sheet-close { font-size:16px !important; min-height:52px; color:#4c5047 !important; }
    .confirm-panel p { font-size:15px !important; line-height:1.7 !important; color:#454940 !important; }
    .confirm-actions button { min-height:52px; font-size:16px !important; }
    .toast { font-size:15px !important; line-height:1.55 !important; }
  }
</style>`;
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${style}\n</head>`) : `${style}\n${html}`;
}

let filesChanged = 0;
let declarationsRaised = 0;
let viewportNormalized = 0;
for (const file of walk(firebaseRoot)) {
  const original = fs.readFileSync(file, 'utf8');
  const raised = raiseTinyPxFonts(original);
  let next = raised.content;
  if (/\.html$/i.test(file)) {
    const beforeViewport = next;
    next = normalizeViewport(next);
    if (next !== beforeViewport) viewportNormalized += 1;
    next = injectMobileBaseline(next);
    next = injectReactionPatternReadability(next);
    next = injectMienaiZandakaReadability(next);
  }
  if (next !== original) {
    fs.writeFileSync(file, next);
    filesChanged += 1;
    declarationsRaised += raised.changed;
  }
}

console.log(`[LEVEL UP typography] minimum ${MIN_PX}px enforced; ${declarationsRaised} tiny declarations raised across ${filesChanged} files; ${viewportNormalized} viewport tags normalized for user zoom.`);
