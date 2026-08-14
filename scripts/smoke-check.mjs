import fs from 'node:fs';
import path from 'node:path';
import { createLocalServer } from './local-server.mjs';

const root = process.cwd();
const appsDir = path.join(root, 'apps');
const local = createLocalServer({ root, port: 4174 });

const failures = [];
const checked = [];

try {
  await local.start();

  const targets = ['/'];
  if (fs.existsSync(appsDir)) {
    for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const indexPath = path.join(appsDir, entry.name, 'index.html');
      if (fs.existsSync(indexPath)) targets.push(`/apps/${entry.name}/`);
    }
  }

  for (const urlPath of targets) {
    try {
      const response = await fetch(`http://127.0.0.1:4174${urlPath}`);
      const text = await response.text();
      const ok = response.ok && text.trim().length > 0;
      checked.push({ urlPath, status: response.status, ok });
      if (!ok) failures.push(`${urlPath} -> HTTP ${response.status}`);
    } catch (error) {
      failures.push(`${urlPath} -> ${error.message}`);
    }
  }
} finally {
  await local.stop().catch(() => {});
}

for (const item of checked) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.status} ${item.urlPath}`);
}

if (failures.length) {
  console.error('\nSmoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\nSmoke check passed: ${checked.length} page(s) served successfully.`);
