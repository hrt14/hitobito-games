// apps/404-kaiki を1枚のHTMLへ束ねる。
// 404.hitobito.jp のVercelプロジェクトがGitに繋がっていないため、
// 稼働中の drain プロジェクト配下へ生成物を置いて公開している。
// 使い方: node apps/404-kaiki/build-standalone.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SRC = dirname(fileURLToPath(import.meta.url));
const OUT = join(SRC, '../drain/404/index.html');

// 依存順に並べる（import を消して連結するため）
const ORDER = [
  'data/case01.js',
  'core/case.js',
  'core/investigation.js',
  'core/anomaly.js',
  'core/chase.js',
  'core/log.js',
  'world/path.js',
  'world/input.js',
  'world/audio.js',
  'world/render.js',
  'main.js',
];

const strip = src => src
  .replace(/^\s*import\s+[^;]*?from\s*['"][^'"]+['"]\s*;?\s*$/gm, '')
  .replace(/^\s*export\s+(?=(const|let|var|class|function|async))/gm, '');

const js = ORDER
  .map(f => `/* ---- ${f} ---- */\n${strip(readFileSync(join(SRC, f), 'utf8'))}`)
  .join('\n');

const leftover = js.split('\n').filter(l => /^\s*(import|export)\s/.test(l));
if (leftover.length) {
  console.error('import/export が残っています:\n' + leftover.join('\n'));
  process.exit(1);
}

const html = readFileSync(join(SRC, 'index.html'), 'utf8');
const head = html.split('<head>')[1].split('</head>')[0]
  .replace(/<link[^>]+style\.css[^>]*>/, '')
  .trim();
const body = html.split('<body>')[1].split('</body>')[0]
  .replace(/<script[^>]*><\/script>/g, '')
  .trim();

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `<!doctype html>
<html lang="ja">
<head>
${head}
<style>
${readFileSync(join(SRC, 'style.css'), 'utf8')}</style>
</head>
<body>
${body}
<script type="module">
${js}
</script>
</body>
</html>
`);
console.log(`built ${OUT} (${js.split('\n').length} lines of js)`);
