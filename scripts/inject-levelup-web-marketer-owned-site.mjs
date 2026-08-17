import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, '.dist', 'firebase');
const homePath = path.join(out, 'index.html');
const catalogPath = path.join(out, 'levelup-catalog.json');
const appPath = path.join(out, 'apps', 'web-marketer-owned-site', 'index.html');

if (!fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP home/catalog missing. Run after build-firebase-levelup-home.');
}
if (!fs.existsSync(appPath)) {
  throw new Error('web-marketer-owned-site is missing from the Firebase bundle.');
}

const appHtml = fs.readFileSync(appPath, 'utf8');
for (const required of [
  'WEBマーケター：自社サイト担当者 | LEVEL UP',
  'const LIMIT=7000,ROUNDS=10;',
  "traffic:'集客'",
  "cvr:'CVR'",
  "measure:'計測'",
  "ltv:'LTV'",
  "test:'実験'",
  'セッション × CVR × 客単価',
]) {
  if (!appHtml.includes(required)) {
    throw new Error(`web-marketer-owned-site quality check failed: ${required}`);
  }
}

const game = {
  slug: 'web-marketer-owned-site',
  title: 'WEBマーケター｜自社サイト担当者',
  kicker: 'OWNED EC GROWTH TRAINING',
  skill: 'KPI分解 / CVR / 計測 / LTV',
  description: '自社ECの数字からボトルネックを見抜き、集客・CVR・計測・LTV・実験設計の最優先アクションを7秒で選ぶ。',
  icon: 'EC',
  href: '/apps/web-marketer-owned-site/',
  updateCount: 1,
};

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const beforeCount = catalog.games.length;
if (!catalog.games.some((item) => item.slug === game.slug)) {
  catalog.games.push(game);
}
const afterCount = catalog.games.length;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(`data-game="${game.slug}"`)) {
  const card = `
  <article class="card is-new" data-game="${game.slug}" data-new="true">
    <button class="favorite" type="button" data-favorite="${game.slug}" aria-pressed="false" aria-label="${game.title}をお気に入りに追加">♡</button>
    <a class="card-link" href="${game.href}">
      <div class="card-top"><span class="number">NEW</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${game.icon}</div>
      <div class="kicker">${game.kicker}</div>
      <div class="skill">${game.skill}</div>
      <h2>${game.title}</h2>
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">自社EC・DTC・ブランド公式サイトの売上全体を見る担当者</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">数字から詰まりを見つけ、次に確認・改善すべき場所を即判断する</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">集客・CVR・計測・LTVを横断して、最も効く一手を選びやすくなる</span></div>
      </div>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;

  const gridOpen = '<div class="grid">';
  if (!html.includes(gridOpen)) throw new Error('LEVEL UP card grid not found.');
  html = html.replace(gridOpen, `${gridOpen}${card}`);
}

if (afterCount !== beforeCount) {
  html = html.replaceAll(`${beforeCount} games`, `${afterCount} games`);
  html = html.replace(
    `<strong>${beforeCount}</strong><span>TRAINING GAMES</span>`,
    `<strong>${afterCount}</strong><span>TRAINING GAMES</span>`,
  );
}

fs.writeFileSync(homePath, html);

const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes(`data-game="${game.slug}"`)) throw new Error('web-marketer-owned-site card injection failed.');
if (!finalHtml.includes('data-new="true"')) throw new Error('web-marketer-owned-site NEW marker missing.');
if (!finalHtml.includes('自社EC・DTC・ブランド公式サイトの売上全体を見る担当者')) throw new Error('web-marketer-owned-site value metadata missing.');
if (!catalog.games.some((item) => item.slug === game.slug)) throw new Error('web-marketer-owned-site catalog injection failed.');

console.log(`[Firebase] web-marketer-owned-site injected as NEW release (${afterCount} curated games)`);
