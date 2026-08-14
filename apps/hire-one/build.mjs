import { copyFile, mkdir, rm } from 'node:fs/promises';

const files = [
  'index.html',
  'style.css',
  'polish.css',
  'game.js',
  'polish.js',
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const file of files) {
  await copyFile(file, `dist/${file}`);
}

console.log(`Built dist/ with ${files.length} direct static files.`);
