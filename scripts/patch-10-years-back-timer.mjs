import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('apps/10-years-back/index.html');
if (!fs.existsSync(file)) process.exit(0);

const before = 'function renderTimer(){const mission=chosenMission();';
const after = 'function renderTimer(){clearInterval(timerId);timerId=null;const mission=chosenMission();';
let html = fs.readFileSync(file, 'utf8');

if (html.includes(after)) process.exit(0);
if (!html.includes(before)) {
  throw new Error('10-years-back timer patch target not found');
}

html = html.replace(before, after);
fs.writeFileSync(file, html);
console.log('[10-years-back] timer pause/restart patch applied');
