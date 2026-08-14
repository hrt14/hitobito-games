import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'index.html',
  'style.css',
  'polish.css',
  'game.js',
  'polish.js',
];

for (const file of requiredFiles) {
  await access(file);
}

const html = await readFile('index.html', 'utf8');
const requiredRefs = ['./style.css', './polish.css', './game.js', './polish.js'];
for (const ref of requiredRefs) {
  if (!html.includes(ref)) {
    throw new Error(`index.html is missing direct local asset reference: ${ref}`);
  }
}

const forbiddenPatterns = [
  'DecompressionStream',
  'cdn.jsdelivr.net',
  'document.write(h)',
];
for (const pattern of forbiddenPatterns) {
  if (html.includes(pattern)) {
    throw new Error(`Forbidden deployment wrapper found in index.html: ${pattern}`);
  }
}

console.log('Static deployment smoke check passed.');
