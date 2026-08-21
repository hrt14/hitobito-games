#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT_NAME = 'FUN_REPORT.json';
const SCORE_KEYS = [
  'first10Seconds', 'coreLoop', 'inputFeel', 'decisionQuality', 'masteryDepth',
  'surpriseVariation', 'riskReward', 'pacing', 'retryDesire', 'uniqueness',
];
const TEST_KEYS = [
  'first10Seconds', 'first30Seconds', 'threeMinutes', 'tenMinutes', 'retryDesire', 'noReward',
];
const GAMEPLAY_EXTENSIONS = new Set([
  '.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.css',
  '.json', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.wav', '.mp3', '.ogg',
]);

function fail(message) {
  console.error(`FUN GATE FAIL: ${message}`);
  process.exitCode = 1;
}

function hasConcreteText(value, min = 12) {
  return typeof value === 'string' && value.trim().length >= min;
}

function requireText(value, label, min = 12) {
  if (!hasConcreteText(value, min)) {
    fail(`${label} must contain concrete text (minimum ${min} characters).`);
    return false;
  }
  return true;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${filePath} is missing or invalid JSON: ${error.message}`);
    return null;
  }
}

function validateReport(reportPath, expectedSlug = null) {
  const absolute = path.resolve(ROOT, reportPath);
  const report = readJson(absolute);
  if (!report) return false;

  let ok = true;
  const mark = (condition, message) => {
    if (!condition) {
      fail(`${reportPath}: ${message}`);
      ok = false;
    }
  };

  mark(report.schemaVersion === 1, 'schemaVersion must be 1.');
  mark(typeof report.game === 'string' && report.game.trim().length > 0, 'game is required.');
  if (expectedSlug) mark(report.game === expectedSlug, `game must equal directory slug "${expectedSlug}".`);

  if (!requireText(report.funStatement, `${reportPath}: funStatement`, 20)) ok = false;
  mark(Array.isArray(report.coreLoop) && report.coreLoop.length >= 4, 'coreLoop must have at least 4 concrete steps.');
  if (Array.isArray(report.coreLoop)) {
    report.coreLoop.forEach((step, index) => {
      if (!requireText(step, `${reportPath}: coreLoop[${index}]`, 5)) ok = false;
    });
  }

  mark(report.meaningfulDecision && typeof report.meaningfulDecision === 'object', 'meaningfulDecision is required.');
  if (report.meaningfulDecision) {
    if (!requireText(report.meaningfulDecision.tradeoff, `${reportPath}: meaningfulDecision.tradeoff`, 15)) ok = false;
    if (!requireText(report.meaningfulDecision.consequence, `${reportPath}: meaningfulDecision.consequence`, 15)) ok = false;
  }
  if (!requireText(report.highestMoment, `${reportPath}: highestMoment`, 15)) ok = false;
  if (!requireText(report.oneMoreRunReason, `${reportPath}: oneMoreRunReason`, 15)) ok = false;

  mark(report.playtest && typeof report.playtest === 'object', 'playtest is required.');
  if (report.playtest) {
    mark(/browser/i.test(String(report.playtest.method || '')), 'playtest.method must state a real browser playtest.');
    for (const key of TEST_KEYS) {
      const test = report.playtest[key];
      mark(test && typeof test === 'object', `playtest.${key} is required.`);
      if (test) {
        mark(test.pass === true, `playtest.${key}.pass must be true after actual playtesting.`);
        if (!requireText(test.evidence, `${reportPath}: playtest.${key}.evidence`, 20)) ok = false;
      }
    }
  }

  mark(report.scores && typeof report.scores === 'object', 'scores are required.');
  const numericScores = [];
  if (report.scores) {
    for (const key of SCORE_KEYS) {
      const score = report.scores[key];
      mark(Number.isFinite(score), `scores.${key} must be numeric.`);
      if (Number.isFinite(score)) {
        numericScores.push(score);
        mark(score >= 7 && score <= 10, `scores.${key} must be between 7 and 10 to pass.`);
      }
    }
    mark(report.scores.coreLoop >= 8, 'scores.coreLoop must be >= 8.');
    mark(report.scores.decisionQuality >= 8, 'scores.decisionQuality must be >= 8.');
    mark(report.scores.retryDesire >= 8, 'scores.retryDesire must be >= 8.');
  }

  if (numericScores.length === SCORE_KEYS.length) {
    const average = numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length;
    mark(average >= 8, `score average must be >= 8.0 (actual ${average.toFixed(2)}).`);
  }

  mark(report.scoreEvidence && typeof report.scoreEvidence === 'object', 'scoreEvidence is required.');
  if (report.scoreEvidence) {
    for (const key of SCORE_KEYS) {
      if (!requireText(report.scoreEvidence[key], `${reportPath}: scoreEvidence.${key}`, 20)) ok = false;
    }
  }

  mark(Number.isFinite(Date.parse(report.verifiedAt)), 'verifiedAt must be a valid ISO date/time from the actual playtest.');

  if (ok) console.log(`FUN GATE PASS: ${reportPath}`);
  return ok;
}

function gitDiffFiles(base, head) {
  try {
    const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', base, head], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch (error) {
    fail(`Could not read git diff ${base}..${head}: ${error.message}`);
    return [];
  }
}

function humanTestOnlySlugs() {
  const configPath = path.join(ROOT, 'deploy-targets.json');
  if (!fs.existsSync(configPath)) return new Set();
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return new Set(config?.targets?.humanTestOnly?.slugs || []);
  } catch {
    return new Set();
  }
}

function isLevelUpApp(slug) {
  const candidates = [
    path.join(ROOT, 'apps', slug, 'index.html'),
    path.join(ROOT, 'apps', slug, 'SPEC.md'),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const text = fs.readFileSync(candidate, 'utf8');
    if (/\bLEVEL\s*UP\b/i.test(text)) return true;
  }
  return false;
}

function isGameplayFile(file) {
  if (!file.startsWith('apps/')) return false;
  if (file.endsWith(`/${REPORT_NAME}`)) return false;
  return GAMEPLAY_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function validateDiff(base, head) {
  const changed = gitDiffFiles(base, head);
  if (process.exitCode) return;

  const appChanges = new Map();
  for (const file of changed) {
    const match = file.match(/^apps\/([^/]+)\/(.+)$/);
    if (!match || !isGameplayFile(file)) continue;
    const slug = match[1];
    if (!appChanges.has(slug)) appChanges.set(slug, []);
    appChanges.get(slug).push(file);
  }

  const humanOnly = humanTestOnlySlugs();
  const playSlugs = [...appChanges.keys()].filter((slug) => !humanOnly.has(slug) && !isLevelUpApp(slug));

  if (playSlugs.length === 0) {
    console.log('FUN GATE: no ordinary PLAY gameplay changes detected.');
    return;
  }

  for (const slug of playSlugs) {
    const reportRelative = `apps/${slug}/${REPORT_NAME}`;
    if (!changed.includes(reportRelative)) {
      fail(`${slug}: gameplay changed but ${reportRelative} was not updated in the same diff.`);
      console.error(`Changed gameplay files: ${appChanges.get(slug).join(', ')}`);
      continue;
    }
    validateReport(reportRelative, slug);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--report') args.report = argv[++i];
    else if (token === '--base') args.base = argv[++i];
    else if (token === '--head') args.head = argv[++i];
    else if (token === '--help' || token === '-h') args.help = true;
    else fail(`Unknown argument: ${token}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log('Usage:');
  console.log('  node scripts/validate-play-fun-gate.mjs --report apps/<slug>/FUN_REPORT.json');
  console.log('  node scripts/validate-play-fun-gate.mjs --base <base-ref> --head <head-ref>');
} else if (args.report) {
  const match = args.report.replaceAll('\\', '/').match(/^apps\/([^/]+)\/FUN_REPORT\.json$/);
  validateReport(args.report, match ? match[1] : null);
} else if (args.base && args.head) {
  validateDiff(args.base, args.head);
} else {
  fail('Provide either --report <path> or both --base <ref> --head <ref>. Use --help for usage.');
}

if (process.exitCode) process.exit(process.exitCode);
