import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { renderSVG } from 'uqr';
import { createLocalServer } from './local-server.mjs';
import { CATEGORIES, getGameMeta } from './playtest-catalog.mjs';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const toolsPort = Number(process.env.TOOLS_PORT || 4174);
const toolsRoot = path.join(root, '.playtest', 'hitobito-tools');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let toolsChild = null;
let local = null;
let stopping = false;

const esc = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
}

function findLanAddress() {
  const list = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family !== 'IPv4' || entry.internal || entry.address.startsWith('169.254.')) continue;
      const privateIp = entry.address.startsWith('10.') || entry.address.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(entry.address);
      list.push({ name, address: entry.address, privateIp });
    }
  }
  list.sort((a, b) => Number(b.privateIp) - Number(a.privateIp));
  return list[0] || null;
}

function readGameInfo(indexPath, fallback) {
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    const title = stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || fallback);
    const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i)?.[1];
    const visible = html.match(/<(?:p|div)[^>]+class=["'][^"']*(?:subtitle|lead|tag)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/i)?.[1];
    return { title, description: stripHtml(meta || visible || '') };
  } catch {
    return { title: fallback, description: '' };
  }
}

function discoverStaticGames() {
  const appsDir = path.join(root, 'apps');
  if (!fs.existsSync(appsDir)) return [];
  return fs.readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const indexPath = path.join(appsDir, entry.name, 'index.html');
      if (!fs.existsSync(indexPath)) return null;
      const info = readGameInfo(indexPath, entry.name);
      const meta = getGameMeta(entry.name, info.description);
      return { slug: entry.name, title: info.title, ...meta, href: `/apps/${encodeURIComponent(entry.name)}/`, source: 'hitobito-games' };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}

function runSync(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', windowsHide: true });
  return !result.error && result.status === 0;
}

function prepareToolsRepo() {
  fs.mkdirSync(path.dirname(toolsRoot), { recursive: true });
  if (!fs.existsSync(path.join(toolsRoot, '.git'))) {
    console.log('[Playtest] Fetching hitobito-tools for LEVEL UP games...');
    if (!runSync('git', ['clone', '--depth', '1', '--branch', 'main', 'https://github.com/hrt14/hitobito-tools.git', toolsRoot])) return false;
  } else {
    console.log('[Playtest] Updating hitobito-tools...');
    const fetched = runSync('git', ['-C', toolsRoot, 'fetch', 'origin', 'main']);
    if (fetched) runSync('git', ['-C', toolsRoot, 'reset', '--hard', 'origin/main']);
  }
  if (!fs.existsSync(path.join(toolsRoot, 'node_modules', 'next', 'package.json'))) {
    console.log('[Playtest] Installing hitobito-tools dependencies (first run only)...');
    if (!runSync(npmCommand, ['install', '--no-fund', '--no-audit'], toolsRoot)) return false;
  }
  return true;
}

async function urlReady(url) {
  try { return (await fetch(url, { signal: AbortSignal.timeout(2500) })).ok; } catch { return false; }
}

async function startToolsServer() {
  const checkUrl = `http://127.0.0.1:${toolsPort}/maa-iika`;
  if (await urlReady(checkUrl)) return true;
  if (!prepareToolsRepo()) return false;
  toolsChild = spawn(npmCommand, ['run', 'dev', '--', '--hostname', '0.0.0.0', '--port', String(toolsPort)], {
    cwd: toolsRoot, stdio: 'inherit', windowsHide: true,
  });
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (await urlReady(checkUrl)) return true;
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  return false;
}

function stopToolsServer() {
  if (!toolsChild?.pid) return;
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(toolsChild.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    else toolsChild.kill('SIGTERM');
  } catch {}
  toolsChild = null;
}

function openBrowser(url) {
  try {
    const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();
  } catch {}
}

function buildToolsGames(host, ready) {
  if (!ready) return [];
  const base = `http://${host}:${toolsPort}`;
  return [
    { slug: 'maa-iika', title: 'まあ、いいか。 | LEVEL UP', category: 'levelup', description: '予定外の出来事に引っかからず、「そうなったか。じゃあ次へ」と切り替える反射を鍛える。', href: `${base}/maa-iika`, source: 'LEVEL UP / Next.js' },
    { slug: 'self-management', title: '自分を回せ — 自己管理 | LEVEL UP', category: 'levelup', description: '体力・集中・予定を見ながら、自分を無理なく回す判断を反復する自己管理トレーニング。', href: `${base}/self-management`, source: 'LEVEL UP / Next.js' },
  ];
}

function renderHub({ lanUrl, lanAddress, qrSvg, toolsReady, games }) {
  const count = (id) => games.filter((game) => game.category === id).length;
  const filters = [`<button class="filter active" data-filter="all">すべて <b>${games.length}</b></button>`]
    .concat(CATEGORIES.filter((c) => count(c.id)).map((c) => `<button class="filter" data-filter="${c.id}">${esc(c.label)} <b>${count(c.id)}</b></button>`)).join('');

  const sections = CATEGORIES.map((category) => {
    const items = games.filter((game) => game.category === category.id);
    if (!items.length) return '';
    const cards = items.map((game) => `
      <a class="game" data-category="${category.id}" data-search="${esc(`${game.title} ${game.slug} ${game.description}`.toLowerCase())}" href="${esc(game.href)}" target="_blank" rel="noopener noreferrer">
        <div class="game-head"><span class="source">${esc(game.source)}</span><span class="slug">${esc(game.slug)}</span></div>
        <strong>${esc(game.title)}</strong><p>${esc(game.description)}</p><span class="play">遊ぶ ↗</span>
      </a>`).join('');
    return `<section class="category"><div class="category-head"><div><h2>${esc(category.label)}</h2><p>${esc(category.note)}</p></div><span>${items.length}本</span></div><div class="games">${cards}</div></section>`;
  }).join('');

  const network = lanAddress ? `<span class="ok">● LAN接続OK</span><span>PC: ${esc(lanAddress)}</span>` : `<span class="warn">● LAN IPを検出できません</span>`;
  const tools = toolsReady ? `<span class="ok">● LEVEL UP Next.js OK</span>` : `<span class="warn">● LEVEL UP Next.jsは起動できませんでした</span>`;

  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>人間テストプレイ</title><style>
  :root{color-scheme:dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;background:#0b0d10;color:#f5f7fa}main{width:min(1120px,calc(100% - 28px));margin:auto;padding:32px 0 64px}.eyebrow{color:#929da9;font-size:11px;letter-spacing:.16em;font-weight:800}h1{font-size:clamp(30px,5vw,50px);margin:8px 0}.lead{color:#aeb7c2;margin:0;line-height:1.6}.hero{display:grid;grid-template-columns:1fr 250px;gap:18px;margin:24px 0}.panel{background:#14181e;border:1px solid #252b34;border-radius:18px;padding:18px}.steps{display:grid;gap:8px;margin-top:12px}.step{color:#9da7b3;font-size:12px}.step b{color:#fff}.status{display:flex;flex-wrap:wrap;gap:8px 15px;margin-top:14px;font-size:11px}.ok{color:#78e08f}.warn{color:#ffc857}.url{margin-top:12px;padding:10px;border:1px solid #2c3440;border-radius:10px;background:#0c1015;font:11px Consolas,monospace;word-break:break-all}.qr{display:grid;place-items:center;background:white;border-radius:18px;padding:16px}.qr svg{width:100%}.tools{position:sticky;top:0;z-index:10;background:#0b0d10ed;backdrop-filter:blur(12px);padding:10px 0}.search{width:100%;height:44px;border:1px solid #2d3540;border-radius:13px;background:#11161c;color:white;padding:0 14px;font-size:15px}.filters{display:flex;gap:7px;overflow:auto;padding-top:9px}.filter{flex:none;border:1px solid #303844;border-radius:999px;background:#12171d;color:#aab4bf;padding:8px 11px;font-size:11px}.filter.active{background:#f5f6f7;color:#111;border-color:#f5f6f7}.filter b{margin-left:3px;opacity:.65}.category{margin-top:28px}.category-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:10px}.category-head h2{margin:0;font-size:21px}.category-head p{margin:3px 0 0;color:#7f8a96;font-size:11px}.category-head>span{color:#66717d;font-size:11px}.games{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.game{min-height:180px;display:flex;flex-direction:column;text-decoration:none;color:inherit;background:#14181e;border:1px solid #252b34;border-radius:16px;padding:15px}.game:hover{border-color:#606b78;transform:translateY(-1px)}.game-head{display:flex;justify-content:space-between;gap:8px;margin-bottom:9px}.source{color:#78e08f;font-size:8px;font-weight:850}.slug{color:#62707d;font:8px Consolas,monospace}.game strong{font-size:15px;line-height:1.4}.game p{color:#9fa9b5;font-size:12px;line-height:1.6;margin:7px 0}.play{margin-top:auto;padding-top:12px;font-size:11px;font-weight:800}.game[hidden],.category[hidden]{display:none}.empty{display:none;text-align:center;color:#7e8994;padding:40px}.empty.show{display:block}.note{color:#7f8995;font-size:11px;margin-top:28px}@media(max-width:760px){main{width:calc(100% - 20px);padding-top:20px}.hero{grid-template-columns:1fr}.qr{display:none}.games{grid-template-columns:1fr 1fr}}@media(max-width:520px){.games{grid-template-columns:1fr}.game{min-height:150px}}
  </style></head><body><main>
  <div class="eyebrow">HITOBITO GAMES / HUMAN PLAYTEST</div><h1>人間テストプレイ</h1><p class="lead">カテゴリと説明から、試したいゲームをすぐ選べます。</p>
  <section class="hero"><div class="panel"><b>スマホで遊ぶ</b><div class="steps"><div class="step"><b>1.</b> PCとスマホを同じWi-Fiへ</div><div class="step"><b>2.</b> QRコードをスマホで読む</div><div class="step"><b>3.</b> カテゴリか検索からゲームを選ぶ</div></div><div class="status">${network}${tools}</div><div class="url">${esc(lanUrl)}</div></div><div class="qr">${qrSvg || '<span style="color:#111">QRなし</span>'}</div></section>
  <div class="tools"><input id="search" class="search" type="search" placeholder="ゲーム名・内容で検索"><div class="filters">${filters}</div></div>
  <div id="catalog">${sections}</div><div id="empty" class="empty">該当するゲームがありません。</div>
  <p class="note">終了はPC側の黒いウィンドウを閉じるか Ctrl+C。外部インターネットには公開されません。</p>
  </main><script>
  const search=document.querySelector('#search'),buttons=[...document.querySelectorAll('.filter')],cards=[...document.querySelectorAll('.game')],groups=[...document.querySelectorAll('.category')],empty=document.querySelector('#empty');let active='all';
  function apply(){const q=search.value.trim().toLowerCase();let n=0;for(const card of cards){card.hidden=!((active==='all'||card.dataset.category===active)&&(!q||card.dataset.search.includes(q)));if(!card.hidden)n++}for(const group of groups)group.hidden=![...group.querySelectorAll('.game')].some(card=>!card.hidden);empty.classList.toggle('show',n===0)}
  search.addEventListener('input',apply);for(const button of buttons)button.addEventListener('click',()=>{active=button.dataset.filter;buttons.forEach(b=>b.classList.toggle('active',b===button));apply()});
  </script></body></html>`;
}

async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  stopToolsServer();
  if (local) await local.stop().catch(() => {});
  process.exit(code);
}
process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));
process.on('exit', stopToolsServer);

const lan = findLanAddress();
const host = lan?.address || '127.0.0.1';
const staticGames = discoverStaticGames();
const toolsReady = await startToolsServer();
const toolsGames = buildToolsGames(host, toolsReady);
const games = [...toolsGames, ...staticGames];
const lanUrl = `http://${host}:${port}/__test/`;
const qrSvg = lan ? renderSVG(lanUrl, { ecc: 'M', border: 3 }) : '';
const html = renderHub({ lanUrl, lanAddress: lan?.address || null, qrSvg, toolsReady, games });
local = createLocalServer({ root, port, host: '0.0.0.0', virtualRoutes: {
  '/__test': { status: 302, headers: { location: '/__test/' }, type: 'text/plain; charset=utf-8', content: 'Redirecting...' },
  '/__test/': { type: 'text/html; charset=utf-8', content: html },
} });
await local.start();
console.log(`Human Playtest: http://127.0.0.1:${port}/__test/`);
if (lan) console.log(`Mobile: ${lanUrl}`);
console.log(`Games: ${games.length}`);
openBrowser(`http://127.0.0.1:${port}/__test/`);
