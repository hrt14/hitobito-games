import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { renderSVG } from 'uqr';
import { createLocalServer } from './local-server.mjs';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const toolsPort = Number(process.env.TOOLS_PORT || 4174);
const playtestRoot = path.join(root, '.playtest');
const toolsRoot = path.join(playtestRoot, 'hitobito-tools');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let toolsChild = null;
let local = null;
let stopping = false;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isPrivateIPv4(address) {
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;
  const match = address.match(/^172\.(\d+)\./);
  return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false;
}

function findLanAddress() {
  const candidates = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      if (entry.address.startsWith('169.254.')) continue;
      candidates.push({ name, address: entry.address, private: isPrivateIPv4(entry.address) });
    }
  }

  candidates.sort((a, b) => Number(b.private) - Number(a.private));
  return candidates[0] || null;
}

function readGameTitle(indexPath, fallback) {
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ?.replace(/\s+/g, ' ')
      .trim();
    return title || fallback;
  } catch {
    return fallback;
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
      return {
        slug: entry.name,
        title: readGameTitle(indexPath, entry.name),
        href: `/apps/${encodeURIComponent(entry.name)}/`,
        source: 'hitobito-games',
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}

function runSync(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    stdio: options.stdio || 'inherit',
    windowsHide: true,
  });
  return !result.error && result.status === 0;
}

function prepareToolsRepo() {
  fs.mkdirSync(playtestRoot, { recursive: true });
  const gitDir = path.join(toolsRoot, '.git');

  if (!fs.existsSync(gitDir)) {
    console.log('[Playtest] Fetching hitobito-tools for LEVEL UP games...');
    if (!runSync('git', ['clone', '--depth', '1', '--branch', 'main', 'https://github.com/hrt14/hitobito-tools.git', toolsRoot])) {
      console.warn('[Playtest] Could not clone hitobito-tools. Static games will still run.');
      return false;
    }
  } else {
    console.log('[Playtest] Updating hitobito-tools...');
    const fetched = runSync('git', ['-C', toolsRoot, 'fetch', 'origin', 'main']);
    const reset = fetched && runSync('git', ['-C', toolsRoot, 'reset', '--hard', 'origin/main']);
    if (!reset) {
      console.warn('[Playtest] Could not update hitobito-tools. Trying the existing playtest copy.');
    }
  }

  if (!fs.existsSync(path.join(toolsRoot, 'node_modules', 'next', 'package.json'))) {
    console.log('[Playtest] Installing hitobito-tools dependencies (first run only)...');
    if (!runSync(npmCommand, ['install', '--no-fund', '--no-audit'], { cwd: toolsRoot })) {
      console.warn('[Playtest] Could not install hitobito-tools dependencies. Static games will still run.');
      return false;
    }
  }

  return true;
}

async function urlReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await urlReady(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  return false;
}

async function startToolsServer() {
  const checkUrl = `http://127.0.0.1:${toolsPort}/maa-iika`;
  if (await urlReady(checkUrl)) {
    console.log(`[Playtest] LEVEL UP server already running on port ${toolsPort}.`);
    return true;
  }

  if (!prepareToolsRepo()) return false;

  console.log(`[Playtest] Starting LEVEL UP server on port ${toolsPort}...`);
  toolsChild = spawn(
    npmCommand,
    ['run', 'dev', '--', '--hostname', '0.0.0.0', '--port', String(toolsPort)],
    {
      cwd: toolsRoot,
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  toolsChild.on('error', (error) => {
    console.warn(`[Playtest] LEVEL UP server error: ${error.message}`);
  });

  const ready = await waitForUrl(checkUrl);
  if (!ready) {
    console.warn('[Playtest] LEVEL UP server did not become ready. Static games will still run.');
  }
  return ready;
}

function stopToolsServer() {
  if (!toolsChild?.pid) return;
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(toolsChild.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      toolsChild.kill('SIGTERM');
    }
  } catch {
    // Best-effort cleanup only.
  }
  toolsChild = null;
}

function openBrowser(url) {
  try {
    let command;
    let args;

    if (process.platform === 'win32') {
      command = 'cmd';
      args = ['/c', 'start', '', url];
    } else if (process.platform === 'darwin') {
      command = 'open';
      args = [url];
    } else {
      command = 'xdg-open';
      args = [url];
    }

    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();
  } catch {
    // Browser auto-open is a convenience only. The terminal still prints the URL.
  }
}

function buildToolsGames(lanHost, toolsReady) {
  if (!toolsReady) return [];
  const base = `http://${lanHost}:${toolsPort}`;
  return [
    {
      slug: 'maa-iika',
      title: 'まあ、いいか。 | LEVEL UP',
      href: `${base}/maa-iika`,
      source: 'LEVEL UP / Next.js',
    },
    {
      slug: 'self-management',
      title: '自分を回せ — 自己管理 | LEVEL UP',
      href: `${base}/self-management`,
      source: 'LEVEL UP / Next.js',
    },
  ];
}

function buildHubHtml({ lanUrl, games, qrSvg, lanAddress, toolsReady }) {
  const cards = games.map((game) => `
      <a class="game" href="${escapeHtml(game.href)}">
        <span class="source">${escapeHtml(game.source)}</span>
        <span class="game-title">${escapeHtml(game.title)}</span>
        <span class="game-slug">${escapeHtml(game.slug)}</span>
        <span class="play">遊ぶ →</span>
      </a>`).join('');

  const networkStatus = lanAddress
    ? `<span class="ok">● LAN接続OK</span><span>PC: ${escapeHtml(lanAddress)}</span>`
    : `<span class="warn">● LAN IPを検出できませんでした</span>`;
  const toolsStatus = toolsReady
    ? `<span class="ok">● LEVEL UP Next.js OK</span>`
    : `<span class="warn">● LEVEL UP Next.jsは起動できませんでした</span>`;

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Hitobito Games 人間テストプレイ</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0b0d10; color: #f5f7fa; min-height: 100vh; }
    main { width: min(1040px, calc(100% - 28px)); margin: 0 auto; padding: 34px 0 64px; }
    .eyebrow { color: #9ea7b3; font-size: 12px; letter-spacing: .16em; font-weight: 800; }
    h1 { margin: 8px 0 10px; font-size: clamp(28px, 5vw, 50px); line-height: 1.05; }
    .lead { color: #b8c0ca; line-height: 1.7; margin: 0; }
    .hero { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 22px; margin: 28px 0; }
    .panel { background: #14181e; border: 1px solid #252b34; border-radius: 20px; padding: 22px; }
    .steps { display: grid; gap: 12px; margin-top: 18px; }
    .step { display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: start; }
    .num { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: #f5f7fa; color: #0b0d10; font-weight: 900; }
    .step strong { display: block; margin-bottom: 3px; }
    .step small { color: #9ea7b3; line-height: 1.5; }
    .status { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 18px; font-size: 13px; color: #aeb6c1; }
    .ok { color: #78e08f; font-weight: 800; }
    .warn { color: #ffc857; font-weight: 800; }
    .url { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: #0c1015; border: 1px solid #2c3440; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 13px; }
    .qr { display: grid; place-items: center; background: white; border-radius: 18px; padding: 18px; min-height: 240px; }
    .qr svg { width: 100%; height: auto; display: block; }
    h2 { margin: 36px 0 14px; font-size: 20px; }
    .games { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .game { min-height: 150px; display: flex; flex-direction: column; padding: 17px; color: inherit; text-decoration: none; background: #14181e; border: 1px solid #252b34; border-radius: 17px; transition: transform .12s ease, border-color .12s ease; }
    .game:hover { transform: translateY(-2px); border-color: #626d7c; }
    .source { color: #78e08f; font-size: 9px; font-weight: 850; letter-spacing: .08em; margin-bottom: 9px; }
    .game-title { font-weight: 850; line-height: 1.35; }
    .game-slug { color: #788390; font-size: 11px; margin-top: 5px; }
    .play { color: #f5f7fa; margin-top: auto; padding-top: 20px; font-size: 13px; font-weight: 800; }
    .note { color: #8f99a6; font-size: 12px; line-height: 1.7; margin-top: 20px; }
    @media (max-width: 760px) {
      main { width: min(100% - 20px, 680px); padding-top: 22px; }
      .hero { grid-template-columns: 1fr; }
      .qr { display: none; }
      .games { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 440px) {
      .games { grid-template-columns: 1fr; }
      .game { min-height: 120px; }
    }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">HITOBITO GAMES / HUMAN PLAYTEST</div>
    <h1>人間テストプレイ</h1>
    <p class="lead">本番デプロイ前のゲームを、同じWi-Fiにいるスマホから直接プレイできます。</p>

    <section class="hero">
      <div class="panel">
        <strong>スマホで遊ぶ</strong>
        <div class="steps">
          <div class="step"><span class="num">1</span><div><strong>PCとスマホを同じWi-Fiへ</strong><small>ゲストWi-Fiなど端末同士を分離するネットワークでは接続できない場合があります。</small></div></div>
          <div class="step"><span class="num">2</span><div><strong>右のQRをスマホで読む</strong><small>スマホではこの試遊ハブが開きます。</small></div></div>
          <div class="step"><span class="num">3</span><div><strong>下からゲームを選んで遊ぶ</strong><small>起動時にGitHubの最新版を取り込みます。</small></div></div>
        </div>
        <div class="status">${networkStatus}${toolsStatus}</div>
        <div class="url">${escapeHtml(lanUrl)}</div>
      </div>
      <div class="qr" aria-label="スマホ接続用QRコード">${qrSvg || '<span style="color:#111">LAN IPを検出後にQRを表示します</span>'}</div>
    </section>

    <h2>試遊できるゲーム <span style="color:#77818d;font-weight:500">${games.length}</span></h2>
    <section class="games">${cards || '<div class="panel">試遊できるゲームがまだありません。</div>'}</section>

    <p class="note">終了するときは、PC側の黒いウィンドウで Ctrl+C を押すか、そのウィンドウを閉じてください。外部インターネットには公開されません。</p>
  </main>
</body>
</html>`;
}

async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  stopToolsServer();
  if (local) await local.stop().catch(() => {});
  process.exit(code);
}

process.on('SIGINT', () => { void shutdown(0); });
process.on('SIGTERM', () => { void shutdown(0); });
process.on('exit', () => { stopToolsServer(); });

const lan = findLanAddress();
const lanHost = lan?.address || '127.0.0.1';
const staticGames = discoverStaticGames();
const toolsReady = await startToolsServer();
const toolsGames = buildToolsGames(lanHost, toolsReady);
const games = [...toolsGames, ...staticGames];
const lanUrl = `http://${lanHost}:${port}/__test/`;
const qrSvg = lan ? renderSVG(lanUrl, { ecc: 'M', border: 3 }) : '';
const hubHtml = buildHubHtml({ lanUrl, games, qrSvg, lanAddress: lan?.address || null, toolsReady });

local = createLocalServer({
  root,
  port,
  host: '0.0.0.0',
  virtualRoutes: {
    '/__test': {
      status: 302,
      headers: { location: '/__test/' },
      type: 'text/plain; charset=utf-8',
      content: 'Redirecting...',
    },
    '/__test/': {
      type: 'text/html; charset=utf-8',
      content: hubHtml,
    },
  },
});

await local.start();

console.log('');
console.log('==============================================');
console.log(' Hitobito Games - HUMAN PLAYTEST');
console.log('==============================================');
console.log(`PC:     http://127.0.0.1:${port}/__test/`);
if (lan) {
  console.log(`Mobile: ${lanUrl}`);
  console.log(`LAN:    ${lan.name} / ${lan.address}`);
} else {
  console.log('LAN IPv4 address was not detected. PC-only test is available.');
}
console.log(`Games:  ${games.length} (${staticGames.length} static + ${toolsGames.length} Next.js)`);
console.log('');
console.log('Press Ctrl+C to stop.');
console.log('==============================================');
console.log('');

openBrowser(`http://127.0.0.1:${port}/__test/`);
