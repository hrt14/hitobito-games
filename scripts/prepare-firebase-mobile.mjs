import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');

function prepareAto5min() {
  const dir = path.join(root, 'apps', 'ato-5min');
  const aPath = path.join(dir, 'game-a.bin');
  const bPath = path.join(dir, 'game-b.bin');
  const indexPath = path.join(dir, 'index.html');
  const style1Path = path.join(dir, 'style-part1.css');
  const style2Path = path.join(dir, 'style-part2.css');
  if (![aPath, bPath, indexPath, style1Path, style2Path].every(fs.existsSync)) {
    throw new Error('ato-5min snapshot files are missing');
  }

  const compressed = Buffer.concat([fs.readFileSync(aPath), fs.readFileSync(bPath)]);
  const code = zlib.gunzipSync(compressed).toString('utf8');
  fs.writeFileSync(path.join(dir, 'game.js'), code);

  const css = `${fs.readFileSync(style1Path, 'utf8')}\n${fs.readFileSync(style2Path, 'utf8')}`;
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html
    .replace(/\s*<link rel="stylesheet" href="style-part1\.css" \/>/, '')
    .replace(/\s*<link rel="stylesheet" href="style-part2\.css" \/>/, '')
    .replace('</head>', `  <style id="ato5min-inline-styles">\n${css}\n  </style>\n</head>`);

  const start = html.indexOf('<script>\n  (async()=>{');
  if (start < 0) throw new Error('ato-5min legacy loader not found');
  const end = html.indexOf('</script>', start);
  if (end < 0) throw new Error('ato-5min legacy loader end not found');
  html = `${html.slice(0, start)}<script src="./game.js"></script>${html.slice(end + '</script>'.length)}`;
  fs.writeFileSync(indexPath, html);
  console.log('[Mobile prep] ato-5min: gzip loader -> plain game.js; split CSS -> inline CSS');
}

function prepareWatashiZukan() {
  const dir = path.join(root, 'apps', 'watashi-zukan');
  const parts = [
    'game-1-1.txt', 'game-1-2.txt', 'game-1-3.txt', 'game-1-4.txt',
    'game-2.txt', 'game-3.txt',
    'game-4-1.txt', 'game-4-2.txt', 'game-4-3.txt', 'game-4-4.txt',
    'game-5.txt',
  ];
  for (const part of parts) {
    if (!fs.existsSync(path.join(dir, part))) throw new Error(`watashi-zukan missing ${part}`);
  }
  const code = parts.map((part) => fs.readFileSync(path.join(dir, part), 'utf8')).join('');
  fs.writeFileSync(path.join(dir, 'game.js'), code);
  console.log('[Mobile prep] watashi-zukan: 11 runtime fetch/eval chunks -> plain game.js');
}

function restoreTaskSeparationTwoChoice() {
  const source = path.join(root, 'firebase-overrides', 'task-separation');
  const target = path.join(root, 'apps', 'task-separation');
  for (const file of ['index.html', 'game.js']) {
    const from = path.join(source, file);
    if (!fs.existsSync(from)) throw new Error(`task-separation override missing: ${file}`);
    fs.copyFileSync(from, path.join(target, file));
  }
  console.log('[LEVEL UP restore] task-separation: restored user-approved two-choice gameplay');
}

prepareAto5min();
prepareWatashiZukan();
restoreTaskSeparationTwoChoice();
