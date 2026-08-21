import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'apps', 'asa-jikan-7days', 'index.html');
const builtPath = path.join(root, '.dist', 'firebase', 'apps', 'asa-jikan-7days', 'index.html');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
const errors = [];

for (const p of [sourcePath, builtPath, homePath, catalogPath]) if (!fs.existsSync(p)) errors.push(`missing ${p}`);

if (!errors.length) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const built = fs.readFileSync(builtPath, 'utf8');
  const home = fs.readFileSync(homePath, 'utf8');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const required = [
    '睡眠を削らず、朝時間をつくる7日間',
    "if(sleep<420)",
    "duration<420",
    'adult-sleep-duration-consensus.pdf',
    'sleep-deprivation/healthy-sleep-habits',
    '医療行為や診断を目的としません',
    'resultCard',
    'navigator.share',
    'localStorage',
  ];
  for (const marker of required) if (!source.includes(marker)) errors.push(`source marker missing: ${marker}`);
  for (const marker of ['トマト酢','成長ホルモンを最大','最初の90分で','睡眠は短いほど']) if (source.includes(marker)) errors.push(`unsupported claim marker present: ${marker}`);
  if (!built.includes('7-DAY MORNING RESET')) errors.push('built app missing core experience');
  if (!home.includes('data-game="asa-jikan-7days" data-new="true"')) errors.push('LEVEL UP home card missing');
  if (!catalog.games?.some((item) => item.slug === 'asa-jikan-7days')) errors.push('LEVEL UP catalog entry missing');
}

if (errors.length) {
  console.error('[validate-levelup-asa-jikan-7days] FAILED');
  errors.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log('[validate-levelup-asa-jikan-7days] OK');
