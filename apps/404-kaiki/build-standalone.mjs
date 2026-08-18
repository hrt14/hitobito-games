// apps/404-kaiki を1枚のHTMLへ束ねる。
// 通常のデプロイには不要（404.hitobito.jp はこのディレクトリをそのまま配信する）。
// 単体ファイルで配りたい時・オフラインで見せたい時だけ使う。
// 出力の standalone.html は生成物なので git には入れない。
// 使い方: node apps/404-kaiki/build-standalone.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SRC = dirname(fileURLToPath(import.meta.url));
const OUT = join(SRC, "standalone.html"); // 生成物。git 管理外

// 依存順に並べる（import を消して連結するため）
const ORDER = [
  'data/chars.js',
  'core/case.js',
  'core/investigation.js',
  'core/anomaly.js',
  'core/chase.js',
  'core/sight.js',
  'core/kunekune.js',
  'core/elevation.js',
  'core/pass.js',
  'core/teketeke.js',
  'core/lure.js',
  'core/ninmenken.js',
  'core/log.js',
  'world/path.js',
  'world/input.js',
  'world/audio.js',
  'world/render.js',
  'world/render-field.js',
  'world/render-school.js',
  'world/render-arcade.js',
  'modes/chase-mode.js',
  'modes/sight-mode.js',
  'modes/pass-mode.js',
  'modes/voice-mode.js',
  'main.js',
];

// CASE データは同じ名前（WORLD, SPEED, POINTS …）を並べて持つので、
// そのまま連結すると衝突する。1本ずつブロックに閉じて集約だけを外へ出す
const CASE_FILES = [['data/case01.js', 'CASE01'], ['data/case02.js', 'CASE02'], ['data/case03.js', 'CASE03'], ['data/case04.js', 'CASE04']];

const strip = src => src
  .replace(/^\s*import\s+[^;]*?from\s*['"][^'"]+['"]\s*;?\s*$/gm, '')
  .replace(/^\s*export\s+(?=(const|let|var|class|function|async))/gm, '');

const cases = CASE_FILES
  .map(([f, name]) => `/* ---- ${f} ---- */\nconst ${name} = (() => {\n`
    + `${strip(readFileSync(join(SRC, f), 'utf8'))}\nreturn ${name};\n})();`)
  .join('\n');

const js = [
  `/* ---- ${ORDER[0]} ---- */\n${strip(readFileSync(join(SRC, ORDER[0]), 'utf8'))}`,
  cases,
  ...ORDER.slice(1).map(f => `/* ---- ${f} ---- */\n${strip(readFileSync(join(SRC, f), 'utf8'))}`),
].join('\n');

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
