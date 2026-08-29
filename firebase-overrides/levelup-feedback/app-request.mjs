import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const marker = 'data-levelup-app-request-v1';
const buildSha = String(process.env.GITHUB_SHA || 'local').slice(0, 12);

if (!fs.existsSync(outDir)) throw new Error('Firebase LEVEL UP bundle not found.');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function slugFor(file) {
  const rel = path.relative(outDir, file).replaceAll(path.sep, '/');
  if (rel === 'index.html') return 'home';
  const parts = rel.split('/');
  const raw = parts[0] === 'apps' && parts[1] ? parts[1] : parts[0];
  return String(raw || 'home').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64) || 'home';
}

function injectedScript(slug) {
  return `<script ${marker} data-app-slug="${esc(slug)}" data-build="${esc(buildSha)}">
(() => {
  if (window.__LEVELUP_APP_REQUEST_V1__) return;
  window.__LEVELUP_APP_REQUEST_V1__ = true;
  const current = document.currentScript;
  const appSlug = current?.dataset.appSlug || 'home';
  const buildSha = current?.dataset.build || 'local';
  const load = src => new Promise((resolve, reject) => {
    const old = [...document.scripts].find(x => x.src === src);
    if (old) { if (window.firebase) resolve(); else old.addEventListener('load', resolve, { once:true }); return; }
    const el = document.createElement('script'); el.src = src; el.async = true; el.crossOrigin = 'anonymous';
    el.onload = resolve; el.onerror = () => reject(new Error('FIREBASE_LOAD_FAILED')); document.head.appendChild(el);
  });
  async function firestore() {
    if (!window.firebase) await load('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
    if (!window.firebase?.firestore) await load('https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore-compat.js');
    if (!firebase.apps?.length) {
      const r = await fetch('/__/firebase/init.json', { cache:'no-store' });
      if (!r.ok) throw new Error('FIREBASE_CONFIG_FAILED');
      firebase.initializeApp(await r.json());
    }
    return firebase.firestore();
  }
  const day = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');
  const quotaKey = () => 'levelup-app-request-local-quota-v1-' + day();
  const quota = () => Math.max(0, Number(localStorage.getItem(quotaKey()) || 0) || 0);
  async function submit(payload) {
    if (quota() >= 12) throw new Error('RATE_LIMIT');
    const db = await firestore();
    const envelope = JSON.stringify({ v:1, ...payload });
    const chars = [...envelope], chunks = [];
    for (let i=0; i<chars.length; i+=70) chunks.push(chars.slice(i,i+70).join(''));
    if (!chunks.length || chunks.length > 99) throw new Error('REQUEST_TOO_LARGE');
    const batchId = (Date.now().toString(36) + Math.random().toString(36).slice(2,10)).replace(/[^a-z0-9]/g,'').slice(0,24);
    const batch = db.batch();
    chunks.forEach((chunk, i) => {
      const id = (batchId + String(i+1).padStart(2,'0')).slice(0,40);
      const ref = db.collection('levelupSessions').doc(id);
      batch.set(ref, {
        slug: payload.appSlug,
        buildSha: payload.buildSha,
        status:'active',
        lastStep:'feedback-v1:' + batchId + ':' + String(i+1).padStart(2,'0') + '/' + String(chunks.length).padStart(2,'0'),
        lastAction:chunk,
        startedAt:firebase.firestore.FieldValue.serverTimestamp(),
        lastSeenAt:firebase.firestore.FieldValue.serverTimestamp(),
        pageKind:payload.appSlug === 'home' ? 'home' : 'game',
        durationSec:0
      });
    });
    await batch.commit();
    try { localStorage.setItem(quotaKey(), String(quota()+1)); } catch {}
    return { ok:true };
  }
  const style = document.createElement('style');
  style.textContent = '#lu-appreq-fab{position:fixed;right:0;top:calc(50% + 104px);transform:translateY(-50%);z-index:2147483645;width:38px;min-height:108px;padding:10px 7px;border-radius:14px 0 0 14px;border:1px solid rgba(216,255,91,.45);border-right:0;background:#d8ff5b;color:#11150d;font-weight:950;font-size:11px;line-height:1.1;writing-mode:vertical-rl;text-orientation:upright;box-shadow:0 8px 28px rgba(0,0,0,.28)}#lu-appreq-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(4,5,4,.82);display:none;align-items:flex-end;justify-content:center;padding:14px;backdrop-filter:blur(8px)}#lu-appreq-overlay.open{display:flex}#lu-appreq-panel{position:relative;width:min(590px,100%);border:1px solid rgba(216,255,91,.35);border-radius:24px;background:#0f130d;color:#f6f8f1;padding:20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}#lu-appreq-close{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.13);background:#171b15;color:#fff;font-size:20px}.lu-appreq-kicker{margin:0 44px 6px 0;color:#d8ff5b;font-size:12px;font-weight:900}#lu-appreq-panel h2{margin:0 44px 10px 0;font-size:22px;line-height:1.3}.lu-appreq-lead{margin:0 0 14px;color:#d7ddd2;font-size:13px;line-height:1.7}#lu-appreq-message{box-sizing:border-box;width:100%;min-height:160px;border-radius:15px;border:1px solid rgba(255,255,255,.15);background:#090c08;color:#fff;padding:13px;font:inherit;line-height:1.55;resize:vertical}.lu-appreq-safety{margin:10px 0;color:#9fa89a;font-size:11px;line-height:1.6}#lu-appreq-status{min-height:20px;margin:8px 0;font-size:12px;color:#d8ff5b}#lu-appreq-send{width:100%;min-height:50px;border:0;border-radius:14px;background:#d8ff5b;color:#11150d;font-weight:950;font-size:14px}';
  document.head.appendChild(style);
  const host = document.createElement('div');
  host.innerHTML = '<button id="lu-appreq-fab" type="button" aria-label="新しいアプリを作ってほしい">アプリ制作</button><div id="lu-appreq-overlay" aria-hidden="true"><section id="lu-appreq-panel" role="dialog" aria-modal="true" aria-labelledby="lu-appreq-title"><button id="lu-appreq-close" type="button" aria-label="閉じる">×</button><p class="lu-appreq-kicker">合うアプリが見つからない？</p><h2 id="lu-appreq-title">あなたの悩みから、次のアプリを作る。</h2><p class="lu-appreq-lead">今困っていることと、どうなれたら助かるかを書いてください。既存アプリで解決できる場合はそちらを優先し、なければ新しいLEVEL UPアプリの制作候補になります。</p><textarea id="lu-appreq-message" maxlength="800" placeholder="例：会議で言いたいことがあるのに、その場になると遠慮して黙ってしまう。自分の意見を落ち着いて言えるようになりたい。"></textarea><p class="lu-appreq-safety">安全のため、違法・危険・他者への加害を助長するなど、公序良俗に反する依頼は制作しません。</p><p id="lu-appreq-status" aria-live="polite"></p><button id="lu-appreq-send" type="button">アプリ制作を依頼する</button></section></div>';
  document.body.appendChild(host);
  const fab=host.querySelector('#lu-appreq-fab'), overlay=host.querySelector('#lu-appreq-overlay'), close=host.querySelector('#lu-appreq-close'), textarea=host.querySelector('#lu-appreq-message'), status=host.querySelector('#lu-appreq-status'), send=host.querySelector('#lu-appreq-send');
  let sending=false;
  const open=()=>{status.textContent='';overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');setTimeout(()=>textarea.focus(),50)};
  const hide=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')};
  fab.addEventListener('click',open); close.addEventListener('click',hide); overlay.addEventListener('click',e=>{if(e.target===overlay)hide()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))hide()});
  send.addEventListener('click', async () => {
    if (sending) return;
    const message = textarea.value.trim();
    if (message.length < 8) { status.textContent='困っていることを、もう少しだけ具体的に書いてください。'; return; }
    sending=true; send.disabled=true; send.textContent='送信中…';
    try {
      const result = await submit({
        requestType:'new_app', type:'idea', message, appSlug,
        appTitle:document.querySelector('h1')?.textContent?.trim() || document.title,
        pageTitle:document.title, pagePath:location.pathname+(location.hash||''),
        screenLabel:document.querySelector('.screen.active h1,.screen.active h2,.view.active h1,.view.active h2,h2,h1')?.textContent?.trim() || document.title,
        buildSha, viewport:Math.round(innerWidth)+'x'+Math.round(innerHeight)
      });
      if (!result?.ok) throw new Error('SEND_FAILED');
      textarea.value=''; status.textContent='制作依頼を受け付けました。改善キューに入ります。'; send.textContent='受け付けました ✓';
      setTimeout(()=>{hide();send.textContent='アプリ制作を依頼する'},1300);
    } catch (e) {
      console.warn('[LEVEL UP app request] submit failed', e);
      status.textContent=e?.message==='RATE_LIMIT'?'今日は送信上限です。明日また送れます。':'送信できませんでした。'; send.textContent='もう一度送る';
    } finally { sending=false; send.disabled=false; }
  });
})();
</script>`;
}

let injected = 0;
for (const file of walk(outDir)) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(marker) || !html.includes('</body>')) continue;
  html = html.replace('</body>', `${injectedScript(slugFor(file))}\n</body>`);
  fs.writeFileSync(file, html);
  injected += 1;
}
if (!injected) throw new Error('LEVEL UP app request widget was not injected into any page.');
console.log(`[Firebase] LEVEL UP app request widget injected into ${injected} HTML pages via Firestore fallback (build ${buildSha}).`);
