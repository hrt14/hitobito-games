import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const appArgIndex = args.indexOf('--app');
const appDirArg = appArgIndex >= 0 ? args[appArgIndex + 1] : args.find((arg) => !arg.startsWith('-'));

if (!appDirArg) {
  console.error('Usage: node scripts/validate-levelup-quality-gate.mjs --app apps/<slug>');
  process.exit(2);
}

const root = process.cwd();
const appDir = path.resolve(root, appDirArg);
const specPath = path.join(appDir, 'SPEC.md');
const qualityPath = path.join(appDir, 'QUALITY.md');

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} missing: ${path.relative(root, filePath)}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function requireHeading(text, heading, label) {
  const re = new RegExp(`^#{1,6}\\s+${heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'mi');
  if (!re.test(text)) fail(`${label} missing heading: ${heading}`);
}

const spec = requireFile(specPath, 'SPEC.md');
const quality = requireFile(qualityPath, 'QUALITY.md');

if (spec) {
  for (const heading of [
    'Exact use moment',
    'Central benefit',
    'Problem / design rationale',
    'Core interaction',
    'First 10 seconds',
    'Success condition',
    'Uniqueness',
    'Repeat-use strategy',
  ]) {
    requireHeading(spec, heading, 'SPEC.md');
  }
}

if (quality) {
  for (const heading of [
    'Test environment',
    'First-time clarity',
    'Main interaction',
    'Back / exit',
    'Reload',
    'Revisit',
    'Mobile readability and tap targets',
    'Production verification',
    'Final scores',
    'Final question',
  ]) {
    requireHeading(quality, heading, 'QUALITY.md');
  }

  const requiredStatusSections = [
    'First-time clarity',
    'Main interaction',
    'Back / exit',
    'Reload',
    'Revisit',
    'Mobile readability and tap targets',
  ];

  for (const heading of requiredStatusSections) {
    const section = quality.match(new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`, 'mi'))?.[1] || '';
    const status = section.match(/-\s*Status:\s*(PASS|FAIL|UNVERIFIED|NOT APPLICABLE|NOT REQUIRED)/i)?.[1]?.toUpperCase();
    if (!status) fail(`QUALITY.md ${heading}: missing Status`);
    else if (status !== 'PASS') fail(`QUALITY.md ${heading}: completion gate requires PASS, found ${status}`);

    const evidence = section.match(/-\s*Observed evidence:\s*([^\n].*)/i)?.[1]?.trim();
    if (!evidence) fail(`QUALITY.md ${heading}: observed evidence is required`);
  }

  for (const heading of ['Wrong / failure path', 'Correct / success path']) {
    const section = quality.match(new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`, 'mi'))?.[1] || '';
    if (!section) continue;
    const status = section.match(/-\s*Status:\s*(PASS|FAIL|UNVERIFIED|NOT APPLICABLE|NOT REQUIRED)/i)?.[1]?.toUpperCase();
    if (!status) fail(`QUALITY.md ${heading}: missing Status`);
    else if (!['PASS', 'NOT APPLICABLE'].includes(status)) fail(`QUALITY.md ${heading}: found ${status}`);
    if (status === 'PASS') {
      const evidence = section.match(/-\s*Observed evidence:\s*([^\n].*)/i)?.[1]?.trim();
      if (!evidence) fail(`QUALITY.md ${heading}: observed evidence is required when PASS`);
    }
  }

  const productionSection = quality.match(/^##\s+Production verification\s*$([\s\S]*?)(?=^##\s+|\Z)/mi)?.[1] || '';
  const productionStatus = productionSection.match(/-\s*Status:\s*(PASS|FAIL|UNVERIFIED|NOT REQUIRED)/i)?.[1]?.toUpperCase();
  if (!productionStatus) fail('QUALITY.md Production verification: missing Status');
  else if (!['PASS', 'NOT REQUIRED'].includes(productionStatus)) fail(`QUALITY.md Production verification: found ${productionStatus}`);
  if (productionStatus === 'PASS') {
    const evidence = productionSection.match(/-\s*Observed evidence:\s*([^\n].*)/i)?.[1]?.trim();
    if (!evidence) fail('QUALITY.md Production verification: observed evidence is required when PASS');
  }

  const scoreNames = ['Clarity', 'Usefulness', 'Interaction quality', 'Uniqueness', 'Repeat value'];
  for (const name of scoreNames) {
    const match = quality.match(new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}:\\s*(\\d+(?:\\.\\d+)?)\\s*\\/\\s*10\\s*$`, 'mi'));
    if (!match) {
      fail(`QUALITY.md missing score: ${name}: N/10`);
      continue;
    }
    const score = Number(match[1]);
    if (!Number.isFinite(score) || score < 0 || score > 10) fail(`${name} score must be between 0 and 10`);
    else if (score < 7) fail(`${name} score is ${score}/10; minimum is 7/10`);
    else notes.push(`${name}: ${score}/10`);
  }

  const finalAnswer = quality.match(/^Answer:\s*(YES|NO|UNVERIFIED)\s*$/mi)?.[1]?.toUpperCase();
  if (!finalAnswer) fail('QUALITY.md Final question: missing `Answer: YES / NO / UNVERIFIED`');
  else if (finalAnswer !== 'YES') fail(`QUALITY.md Final question must be YES for completion, found ${finalAnswer}`);

  if (/\bUNVERIFIED\b/i.test(quality)) {
    fail('QUALITY.md still contains UNVERIFIED. Full completion cannot be claimed until those checks are actually performed.');
  }
}

if (failures.length) {
  console.error(`LEVEL UP quality gate FAILED for ${path.relative(root, appDir) || appDir}`);
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`LEVEL UP quality gate PASSED for ${path.relative(root, appDir) || appDir}`);
for (const item of notes) console.log(`- ${item}`);
