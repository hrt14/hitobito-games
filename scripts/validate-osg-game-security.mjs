import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = path.join(root, 'oneshotgames', 'games');
const textExtensions = new Set(['.html', '.htm', '.js', '.mjs', '.cjs', '.css', '.svg', '.json', '.txt']);
const maxTextBytes = 1024 * 1024;

const rules = [
  ['network request API', /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\s*\(/i],
  ['Firebase or hosted backend access', /\/__\/firebase\/|\bfirebase\s*\.|\bfirestore\b|\binitializeApp\s*\(|\bgetFirestore\s*\(|\bgetAuth\s*\(/i],
  ['sensitive browser storage', /\bdocument\.cookie\b|\bindexedDB\b|\blocalStorage\b|\bsessionStorage\b/i],
  ['location, camera, microphone or device permission', /\bnavigator\.geolocation\b|\bgetCurrentPosition\s*\(|\bwatchPosition\s*\(|\bgetUserMedia\s*\(|\bnavigator\.mediaDevices\b|\brequestMIDIAccess\s*\(/i],
  ['clipboard read', /\bnavigator\.clipboard\.read(?:Text)?\s*\(/i],
  ['service worker registration', /\bnavigator\.serviceWorker\b|\bregister\s*\(\s*['\"][^'\"]*service-worker/i],
  ['external navigation or popup', /\bwindow\.open\s*\(|\blocation\.(?:assign|replace)\s*\(|\blocation\.href\s*=|\bwindow\.location\s*=/i],
  ['embedded browsing or plugin content', /<\s*(?:iframe|object|embed|base)\b/i],
  ['HTML form submission', /<\s*form\b|\bformaction\s*=|\baction\s*=\s*['\"][^'\"]+/i],
  ['sensitive input field', /<\s*input\b[^>]*\btype\s*=\s*['\"]?(?:password|email|tel|file)['\"]?/i],
  ['dynamic code execution', /\beval\s*\(|\bnew\s+Function\s*\(|\bFunction\s*\(/i],
  ['external URL or protocol', /(?:https?:\/\/|\/\/[^\s'\"<]+|mailto:|tel:|data:text\/html)/i]
];

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function normalizedForScan(text) {
  return String(text)
    .replaceAll('http://www.w3.org/2000/svg', '')
    .replaceAll('http://www.w3.org/1999/xlink', '');
}

const failures = [];
for (const file of walk(gamesDir)) {
  const ext = path.extname(file).toLowerCase();
  if (!textExtensions.has(ext)) continue;
  const stat = fs.statSync(file);
  if (stat.size > maxTextBytes) {
    failures.push(`${path.relative(root, file)}: text file exceeds ${maxTextBytes} bytes`);
    continue;
  }
  const source = normalizedForScan(fs.readFileSync(file, 'utf8'));
  for (const [label, pattern] of rules) {
    if (pattern.test(source)) failures.push(`${path.relative(root, file)}: ${label}`);
  }
}

if (failures.length) {
  console.error('[OSG SECURITY] blocked unsafe generated game content:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nGenerated games must be static, local-only experiences. Network access, authentication/database access, sensitive browser APIs, external URLs and data-collection surfaces are not allowed.');
  process.exit(1);
}

console.log('[OSG SECURITY] all generated game files passed the static security gate.');
