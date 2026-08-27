import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const catalogPath = path.join(root, '.dist', 'firebase', 'levelup-catalog.json');
if (!fs.existsSync(catalogPath)) throw new Error('LEVEL UP catalog not found for success-mind registration.');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.games)) throw new Error('LEVEL UP catalog is invalid.');

const meta = {
  slug: 'success-mind',
  title: '成功マインド診断',
  kicker: '12 DECISIONS → LIFETIME EARNINGS',
  skill: '成功思考 / 意思決定 / 自己理解',
  description: '仕事・失敗・お金・競争・チャンスの12場面から、成功につながる判断パターンを6軸で診断し、「成功マインド換算 生涯年収」として可視化する。',
  icon: '¥',
  updateCount: 1,
  href: '/apps/success-mind/',
};

const index = catalog.games.findIndex((game) => game.slug === meta.slug);
if (index >= 0) catalog.games[index] = { ...catalog.games[index], ...meta };
else catalog.games.unshift(meta);

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('[Firebase] success-mind registered in LEVEL UP catalog.');
