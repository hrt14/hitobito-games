import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const targetPath = path.join(root, '.dist', 'firebase', 'embed', 'diagnosis', 'index.html');

if (!fs.existsSync(targetPath)) throw new Error('Embeddable LEVEL UP diagnosis not found. Run inject.mjs first.');

let html = fs.readFileSync(targetPath, 'utf8');
const before = "const BASE=${safeJson(canonicalBase)};const RECS=${safeJson(resolved)};const qs=new URLSearchParams(location.search);const source=(qs.get('source')||document.referrer||'embed').slice(0,120);let state={issue:'',mode:'',level:''};";

// The generated file contains the resolved BASE/RECS values, so replace only the stable source expression.
const sourceExpression = "const source=(qs.get('source')||document.referrer||'embed').slice(0,120);";
const safeExpression = "function luSafeSource(){const explicit=(qs.get('source')||'').toLowerCase().replace(/[^a-z0-9._-]/g,'').slice(0,80);if(explicit)return explicit;try{return document.referrer?new URL(document.referrer).hostname.toLowerCase().slice(0,80):'embed'}catch{return 'embed'}}const source=luSafeSource();";

if (!html.includes(sourceExpression)) {
  throw new Error('Expected embed referrer expression not found; review generator before changing privacy patch.');
}

html = html.replace(sourceExpression, safeExpression);
fs.writeFileSync(targetPath, html);
console.log('Hardened LEVEL UP embed referrer tracking to hostname/source slug only.');
