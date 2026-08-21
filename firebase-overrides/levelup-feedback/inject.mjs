import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const marker = 'data-levelup-feedback-v1';
const buildSha = String(process.env.GITHUB_SHA || 'local').slice(0, 12);
const endpoint = 'https://asia-northeast1-hitobito-levelup.cloudfunctions.net/submitLevelupFeedback';

if (!fs.existsSync(outDir)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after the main LEVEL UP build.');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function slugFor(filePath) {
  const rel = path.relative(outDir, filePath).replaceAll(path.sep, '/');
  if (rel === 'index.html') return 'home';
  const parts = rel.split('/');
  if (parts[0] === 'apps' && parts[1]) return parts[1].toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64) || 'home';
  const first = parts[0] && parts[0] !== 'index.html' ? parts[0] : 'home';
  return first.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64) || 'home';
}

function scriptFor(slug) {
  return `
<script ${marker} data-app-slug="${escapeAttr(slug)}" data-build="${escapeAttr(buildSha)}" data-endpoint="${escapeAttr(endpoint)}">
(() => {
  if (window.__LEVELUP_FEEDBACK_V1__) return;
  window.__LEVELUP_FEEDBACK_V1__ = true;

  const currentScript = document.currentScript;
  const appSlug = currentScript?.dataset.appSlug || 'home';
  const buildSha = currentScript?.dataset.build || 'local';
  const endpoint = currentScript?.dataset.endpoint || '';
  if (!endpoint) return;

  const trim = (value, max = 120) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const pagePath = () => trim(location.pathname + (location.hash || ''), 300);
  const pageTitle = () => trim(document.title, 120) || appSlug;
  const appTitle = () => trim(document.querySelector('h1')?.textContent, 100) || pageTitle().replace(/\s*[|｜—-]\s*LEVEL\s*UP.*$/i, '') || appSlug;
  const visible = (el) => {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
  };
  const screenLabel = () => {
    const selectors = [
      '[aria-current="step"]', '[data-step].is-active', '[data-step].active',
      '.screen.active h1', '.screen.active h2', '.view.active h1', '.view.active h2',
      'main h2', 'main h1', 'h2', 'h1'
    ];
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        if (!visible(node)) continue;
        const text = trim(node.textContent, 120);
        if (text) return text;
      }
    }
    return pageTitle();
  };

  const host = document.createElement('div');
  host.id = 'levelup-feedback-root';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483646';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f7f8f2}
      *{box-sizing:border-box}
      button,textarea{font:inherit}
      .fab{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:4;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid rgba(216,255,91,.42);background:rgba(12,15,10,.93);color:#d8ff5b;font-size:12px;font-weight:900;letter-spacing:.02em;box-shadow:0 10px 32px rgba(0,0,0,.35);cursor:pointer;-webkit-tap-highlight-color:transparent}
      .overlay{position:fixed;inset:0;z-index:5;background:rgba(4,5,4,.78);display:none;align-items:flex-end;justify-content:center;padding:14px;backdrop-filter:blur(8px)}
      .overlay.open{display:flex}
      .panel{width:min(560px,100%);max-height:min(88vh,760px);overflow:auto;border:1px solid rgba(216,255,91,.28);border-radius:24px;background:#0f130d;color:#f6f8f1;padding:18px;box-shadow:0 28px 90px rgba(0,0,0,.5)}
      .top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.title{margin:0;font-size:20px;line-height:1.2}.sub{margin:5px 0 0;color:#9fa79a;font-size:11px;line-height:1.5}
      .close{width:36px;height:36px;flex:0 0 auto;border-radius:50%;border:1px solid rgba(255,255,255,.13);background:#171b15;color:#fff;font-size:20px;cursor:pointer}
      .meta{margin:14px 0 12px;padding:10px 12px;border-radius:14px;background:#151a12;border:1px solid rgba(255,255,255,.08);font-size:11px;line-height:1.5;color:#bdc5b8}.meta strong{color:#e8ecdf}
      .types{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0 12px}.type{min-height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#151914;color:#dfe4da;font-size:11px;font-weight:800;cursor:pointer}.type.on{border-color:#d8ff5b;background:rgba(216,255,91,.12);color:#e9ff9c}
      label{display:block;font-size:12px;font-weight:850;margin:0 0 7px}textarea{width:100%;min-height:132px;resize:vertical;border-radius:15px;border:1px solid rgba(255,255,255,.14);background:#0a0d09;color:#fff;padding:12px;outline:none;font-size:15px;line-height:1.55}textarea:focus{border-color:rgba(216,255,91,.72);box-shadow:0 0 0 3px rgba(216,255,91,.08)}
      .count{margin-top:5px;text-align:right;font-size:10px;color:#818a7d}.note{font-size:10px;color:#8f988a;line-height:1.55;margin:8px 0 12px}.status{min-height:18px;font-size:11px;color:#d8ff5b;margin:0 0 8px}.send{width:100%;min-height:48px;border:0;border-radius:14px;background:#d8ff5b;color:#11150d;font-weight:950;font-size:13px;cursor:pointer}.send:disabled{opacity:.48;cursor:default}
      @media(max-width:520px){.types{grid-template-columns:1fr 1fr}.fab{font-size:11px;padding:0 12px}.panel{border-radius:20px;padding:16px}}
    </style>
    <button class="fab" type="button" aria-label="改善要望を書く">改善要望</button>
    <div class="overlay" aria-hidden="true">
      <section class="panel" role="dialog" aria-modal="true" aria-labelledby="lu-feedback-title">
        <div class="top"><div><h2 class="title" id="lu-feedback-title">改善要望を送る</h2><p class="sub">今いるアプリ・画面は自動で一緒に送ります。</p></div><button class="close" type="button" aria-label="閉じる">×</button></div>
        <div class="meta"></div>
        <div class="types" role="group" aria-label="要望の種類">
          <button class="type on" type="button" data-type="improvement">改善</button>
          <button class="type" type="button" data-type="confusing">わかりにくい</button>
          <button class="type" type="button" data-type="bug">バグ</button>
          <button class="type" type="button" data-type="idea">アイデア</button>
        </div>
        <label for="lu-feedback-message">どうしたらもっと良くなる？</label>
        <textarea id="lu-feedback-message" maxlength="800" placeholder="例：この問題のあと、なぜその答えなのか1行で出ると分かりやすい"></textarea>
        <div class="count">0 / 800</div>
        <p class="note">個人情報は書かないでください。送信内容はLEVEL UPの改善検討に使います。</p>
        <div class="status" aria-live="polite"></div>
        <button class="send" type="button">送信する</button>
      </section>
    </div>
  `;

  const fab = shadow.querySelector('.fab');
  const overlay = shadow.querySelector('.overlay');
  const close = shadow.querySelector('.close');
  const meta = shadow.querySelector('.meta');
  const textarea = shadow.querySelector('textarea');
  const count = shadow.querySelector('.count');
  const send = shadow.querySelector('.send');
  const status = shadow.querySelector('.status');
  const typeButtons = [...shadow.querySelectorAll('.type')];
  let selectedType = 'improvement';
  let sending = false;

  const updateMeta = () => {
    const title = appTitle();
    const screen = screenLabel();
    const path = pagePath();
    meta.innerHTML = '<strong>' + escapeHtml(title) + '</strong><br>' + escapeHtml(screen) + '<br><span>' + escapeHtml(path) + '</span>';
  };
  function escapeHtml(value) {
    return String(value || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  const open = () => {
    updateMeta();
    status.textContent = '';
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    setTimeout(() => textarea.focus(), 50);
  };
  const hide = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    fab.focus();
  };

  fab.addEventListener('click', open);
  close.addEventListener('click', hide);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) hide(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && overlay.classList.contains('open')) hide(); });
  textarea.addEventListener('input', () => { count.textContent = textarea.value.length + ' / 800'; });
  typeButtons.forEach((button) => button.addEventListener('click', () => {
    selectedType = button.dataset.type || 'improvement';
    typeButtons.forEach((node) => node.classList.toggle('on', node === button));
  }));

  send.addEventListener('click', async () => {
    if (sending) return;
    const message = textarea.value.trim();
    if (message.length < 2) {
      status.textContent = 'もう少しだけ具体的に書いてください。';
      textarea.focus();
      return;
    }
    sending = true;
    send.disabled = true;
    send.textContent = '送信中…';
    status.textContent = '';
    try {
      const payload = {
        type: selectedType,
        message,
        appSlug,
        appTitle: appTitle(),
        pageTitle: pageTitle(),
        pagePath: pagePath(),
        screenLabel: screenLabel(),
        buildSha,
        viewport: Math.round(window.innerWidth) + 'x' + Math.round(window.innerHeight),
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'SEND_FAILED');
      textarea.value = '';
      count.textContent = '0 / 800';
      status.textContent = '送信しました。改善候補として記録されました。';
      send.textContent = '送信しました ✓';
      setTimeout(() => { hide(); send.textContent = '送信する'; }, 900);
    } catch (error) {
      console.warn('[LEVEL UP feedback] submit failed', error);
      status.textContent = error?.message === 'RATE_LIMIT' ? '送信回数が多いため、少し時間を空けてください。' : '送信できませんでした。通信状態を確認してもう一度お試しください。';
      send.textContent = 'もう一度送る';
    } finally {
      sending = false;
      send.disabled = false;
    }
  });
})();
</script>`;
}

let injected = 0;
for (const filePath of walk(outDir)) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(marker) || !html.includes('</body>')) continue;
  html = html.replace('</body>', `${scriptFor(slugFor(filePath))}\n</body>`);
  fs.writeFileSync(filePath, html);
  injected += 1;
}

if (!injected) throw new Error('LEVEL UP feedback widget was not injected into any page.');
console.log(`[Firebase] LEVEL UP feedback widget injected into ${injected} HTML pages (build ${buildSha}).`);
