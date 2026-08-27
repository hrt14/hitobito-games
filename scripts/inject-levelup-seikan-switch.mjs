import './register-success-mind-catalog.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const htmlPath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');

if (!fs.existsSync(htmlPath) || !fs.existsSync(catalogPath)) {
  throw new Error('LEVEL UP build output not found.');
}

const game = {
  slug:'seikan-switch',
  title:'とらえ方スイッチ',
  kicker:'CHANGE THE NEXT VIEW',
  skill:'受容 / 感謝 / 言葉',
  description:'言葉・受容・感謝・親切・小さな行動。日常の出来事に対して、次の見方を選ぶ反射を5問で鍛える。',
  icon:'↻',
  href:'/apps/seikan-switch/',
  updateCount:2,
};

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!catalog.games.some((item) => item.slug === game.slug)) {
  catalog.games.unshift(game);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
}

let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('data-game="seikan-switch"')) {
  const oldCount = (html.match(/<article class="card"/g) || []).length;
  const newCount = oldCount + 1;
  const card = `
  <article class="card" data-game="${game.slug}">
    <button class="favorite" type="button" data-favorite="${game.slug}" aria-pressed="false" aria-label="${game.title}をお気に入りに追加">♡</button>
    <a class="card-link" href="${game.href}">
      <div class="card-top"><span class="number">01</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${game.icon}</div>
      <div class="kicker">${game.kicker}</div>
      <div class="skill">${game.skill}</div>
      <h2>${game.title}</h2>
      <p>${game.description}</p>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`;
  html = html.replace('<div class="grid">', `<div class="grid">${card}`);
  html = html.replace(new RegExp(`<strong>${oldCount}</strong><span>TRAINING GAMES</span>`), `<strong>${newCount}</strong><span>TRAINING GAMES</span>`);
  html = html.replace(new RegExp(`<span>${oldCount} games</span>`), `<span>${newCount} games</span>`);
  fs.writeFileSync(htmlPath, html);
}
