import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apps = {
  'help-me': {
    scripts: ['real-delegation.js'],
    refs: ['./real-delegation.css', './real-delegation.js', 'id="realDelegateModal"', 'id="realDelegateButton"'],
  },
  'expect-nothing': {
    scripts: ['real-life.js'],
    refs: ['./real-life.css', './real-life.js', 'id="realExpectationModal"', 'id="realExpectationButton"'],
  },
  'suteru-yuki': {
    scripts: ['real-life.js'],
    refs: ['./real-life.css', './real-life.js'],
  },
};

const errors = [];
for (const [slug, cfg] of Object.entries(apps)) {
  const dir = path.join(root, 'apps', slug);
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) { errors.push(`${slug}: index.html missing`); continue; }
  const html = fs.readFileSync(indexPath, 'utf8');
  for (const ref of cfg.refs) if (!html.includes(ref)) errors.push(`${slug}: missing ${ref}`);
  if (/user-scalable\s*=\s*no/i.test(html) || /maximum-scale\s*=\s*1/i.test(html)) errors.push(`${slug}: zoom-blocking viewport`);
  for (const script of cfg.scripts) {
    const file = path.join(dir, script);
    if (!fs.existsSync(file)) { errors.push(`${slug}: ${script} missing`); continue; }
    try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); }
    catch (error) { errors.push(`${slug}: ${script} syntax error\n${String(error.stderr || error.message)}`); }
  }
}

const promoter = path.join(root, 'scripts', 'promote-levelup-native-real-flows.mjs');
try { execFileSync(process.execPath, ['--check', promoter], { stdio: 'pipe' }); }
catch (error) { errors.push(`promoter syntax error\n${String(error.stderr || error.message)}`); }

if (errors.length) {
  console.error('[validate-levelup-native-real-sources] FAILED');
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}
console.log(`[validate-levelup-native-real-sources] OK apps=${Object.keys(apps).length}`);
