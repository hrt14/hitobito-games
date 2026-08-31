import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const gamesDir = path.join(repoRoot, 'oneshotgames', 'games');
const validator = path.join(repoRoot, 'scripts', 'validate-osg-game-security.mjs');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'osg-security-test-'));
const fixtureDir = path.join(gamesDir, `.security-test-${process.pid}`);

function runValidator() {
  return spawnSync(process.execPath, [validator], { cwd: repoRoot, encoding: 'utf8' });
}

try {
  fs.mkdirSync(fixtureDir, { recursive: true });

  const outside = path.join(tempRoot, 'outside.txt');
  fs.writeFileSync(outside, 'outside-secret\n');
  const link = path.join(fixtureDir, 'asset');
  fs.symlinkSync(outside, link);

  let result = runValidator();
  assert.notEqual(result.status, 0, 'validator must reject symlinked assets');
  assert.match(result.stderr, /symbolic links are not allowed/);

  fs.unlinkSync(link);
  fs.writeFileSync(
    path.join(fixtureDir, 'index.html'),
    '<a href="&#104;ttps&#58;&#47;&#47;example.invalid&#47;">external</a>\n'
  );

  result = runValidator();
  assert.notEqual(result.status, 0, 'validator must reject entity-encoded external URLs');
  assert.match(result.stderr, /external URL or protocol/);

  console.log('[OSG SECURITY TEST] symlink and HTML-entity bypasses are blocked.');
} finally {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
