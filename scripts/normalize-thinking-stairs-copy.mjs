import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const gamePath = path.join(root, '.dist', 'firebase', 'apps', 'thinking-stairs', 'game.js');

if (!fs.existsSync(gamePath)) throw new Error('Thinking Stairs game.js missing from Firebase bundle.');

let source = fs.readFileSync(gamePath, 'utf8');
if (source.includes('上の段ほど偉いわけではない')) {
  source = source.replaceAll('上の段ほど偉いわけではない', '高い段ほど偉いわけではない');
  fs.writeFileSync(gamePath, source);
}

const finalSource = fs.readFileSync(gamePath, 'utf8');
if (!finalSource.includes('高い段ほど偉いわけではない')) {
  throw new Error('Thinking Stairs normalized result copy missing.');
}

console.log('[Firebase] Thinking Stairs copy normalized for validation.');
