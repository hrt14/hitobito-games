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

const fail = (message) => failures.push(message);

function readRequired(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} missing: ${path.relative(root, filePath)}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function linesOf(text) {
  return String(text || '').split(/\r?\n/);
}

function hasHeading(text, heading) {
  return linesOf(text).some((line) => {
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
    return match && match[1].trim() === heading;
  });
}

function requireHeading(text, heading, label) {
  if (!hasHeading(text, heading)) fail(`${label} missing heading: ${heading}`);
}

function sectionOf(text, heading) {
  const lines = linesOf(text);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

function statusOf(section) {
  return section.match(/^-\s*Status:\s*(PASS|FAIL|UNVERIFIED|NOT APPLICABLE|NOT REQUIRED)\s*$/mi)?.[1]?.toUpperCase() || '';
}

function evidenceOf(section) {
  const match = section.match(/^-\s*Observed evidence:\s*(.*)$/mi);
  return match?.[1]?.trim() || '';
}

function scoreOf(text, name) {
  const line = linesOf(text).find((item) => item.trim().toLowerCase().startsWith(`${name.toLowerCase()}:`));
  if (!line) return null;
  const match = line.match(/:\s*(\d+(?:\.\d+)?)\s*\/\s*10\s*$/i);
  return match ? Number(match[1]) : null;
}

const spec = readRequired(specPath, 'SPEC.md');
const quality = readRequired(qualityPath, 'QUALITY.md');

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

  for (const heading of [
    'First-time clarity',
    'Main interaction',
    'Back / exit',
    'Reload',
    'Revisit',
    'Mobile readability and tap targets',
  ]) {
    const section = sectionOf(quality, heading);
    const status = statusOf(section);
    if (!status) fail(`QUALITY.md ${heading}: missing Status`);
    else if (status !== 'PASS') fail(`QUALITY.md ${heading}: completion gate requires PASS, found ${status}`);
    if (!evidenceOf(section)) fail(`QUALITY.md ${heading}: observed evidence is required`);
  }

  for (const heading of ['Wrong / failure path', 'Correct / success path']) {
    if (!hasHeading(quality, heading)) continue;
    const section = sectionOf(quality, heading);
    const status = statusOf(section);
    if (!status) fail(`QUALITY.md ${heading}: missing Status`);
    else if (!['PASS', 'NOT APPLICABLE'].includes(status)) fail(`QUALITY.md ${heading}: found ${status}`);
    if (status === 'PASS' && !evidenceOf(section)) {
      fail(`QUALITY.md ${heading}: observed evidence is required when PASS`);
    }
  }

  const productionSection = sectionOf(quality, 'Production verification');
  const productionStatus = statusOf(productionSection);
  if (!productionStatus) fail('QUALITY.md Production verification: missing Status');
  else if (!['PASS', 'NOT REQUIRED'].includes(productionStatus)) {
    fail(`QUALITY.md Production verification: found ${productionStatus}`);
  }
  if (productionStatus === 'PASS' && !evidenceOf(productionSection)) {
    fail('QUALITY.md Production verification: observed evidence is required when PASS');
  }

  for (const name of ['Clarity', 'Usefulness', 'Interaction quality', 'Uniqueness', 'Repeat value']) {
    const score = scoreOf(quality, name);
    if (score === null) {
      fail(`QUALITY.md missing score: ${name}: N/10`);
      continue;
    }
    if (!Number.isFinite(score) || score < 0 || score > 10) fail(`${name} score must be between 0 and 10`);
    else if (score < 7) fail(`${name} score is ${score}/10; minimum is 7/10`);
    else notes.push(`${name}: ${score}/10`);
  }

  const finalAnswerLine = linesOf(sectionOf(quality, 'Final question')).find((line) => /^Answer:/i.test(line.trim()));
  const finalAnswer = finalAnswerLine?.match(/^Answer:\s*(YES|NO|UNVERIFIED)\s*$/i)?.[1]?.toUpperCase() || '';
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
