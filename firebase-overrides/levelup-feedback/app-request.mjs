import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const marker = 'data-levelup-app-request-v1';
const buildSha = String(process.env.GITHUB_SHA || 'local').slice(0, 12);
const endpoint = 'https://asia-northeast1-hitobito-levelup.cloudfunctions.net/submitLevelupFeedback';

if (!fs.existsSync(outDir)) throw new Error('Firebase LEVEL UP bundle not found. Run this after the main LEVEL UP build.');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function escapeAttr(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function slugFor(filePath) {
  const rel = path.relative(outDir, filePath).replaceAll(path.sep, '/');
  if (rel === 'index.html') return 'home';
  const parts = rel.split('/');
  if (parts[0] === 'apps' && parts[1]) return parts[1].toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64) || 'home';
  return (parts[0] || 'home').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64) || 'home';
}

function scriptFor(slug) {
  const safeSlug = escapeAttr(slug);
  const safeBuild = escapeAttr(buildSha);
  const safeEndpoint = escapeAttr(endpoint);
  return [
    `<script ${marker} data-app-slug="${safeSlug}" data-build="${safeBuild}" data-endpoint="${safeEndpoint}">`,
    '(() => {',
    'if(window.__LEVELUP_APP_REQUEST_V1__)return;window.__LEVELUP_APP_REQUEST_V1__=true;',
    'const s=document.currentScript,appSlug=s?.dataset.appSlug||"home",buildSha=s?.dataset.build||"local",endpoint=s?.dataset.endpoint||"";if(!endpoint)return;',
    'const esc=(v)=>String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("\\\"","&quot;");',
    'const loadScript=(src)=>new Promise((resolve,reject)=>{const found=[...document.scripts].find(x=>x.src===src);if(found){if(window.firebase)resolve();else found.addEventListener("load",resolve,{once:true});return}const el=document.createElement("script");el.src=src;el.async=true;el.crossOrigin="anonymous";el.onload=resolve;el.onerror=()=>reject(new Error("FIREBASE_LOAD_FAILED"));document.head.appendChild(el)});',
    'const ensureFirestore=async()=>{if(!window.firebase){await loadScript("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js")}if(!window.firebase?.firestore){await loadScript("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore-compat.js")}if(!firebase.apps?.length){const r=await fetch("/__/firebase/init.json",{cache:"no-store"});if(!r.ok)throw new Error("FIREBASE_CONFIG_FAILED");firebase.initializeApp(await r.json())}return firebase.firestore()};',
    'const japanDay=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).replaceAll("-","");',
    'const quotaKey=()=>"levelup-feedback-local-quota-v1-"+japanDay();const quotaCount=()=>Math.max(0,Number(localStorage.getItem(quotaKey())||0)||0);const bumpQuota=()=>{try{localStorage.setItem(quotaKey(),String(quotaCount()+1))}catch{}};',
    'const saveDirect=async(payload)=>{if(quotaCount()>=12)throw new Error("RATE_LIMIT");const db=await ensureFirestore();const envelope=JSON.stringify({v:1,...payload});const chars=[...envelope],chunks=[];for(let i=0;i<chars.length;i+=70)chunks.push(chars.slice(i,i+70).join(""));if(!chunks.length||chunks.length>99)throw new Error("REQUEST_TOO_LARGE");const batchId=(Date.now().toString(36)+Math.random().toString(36).slice(2,10)).replace(/[^a-z0-9]/g,"").slice(0,24);const batch=db.batch();chunks.forEach((chunk,i)=>{const id=(batchId+String(i+1).padStart(2,"0")).slice(0,40);const ref=db.collection("levelupSessions").doc(id);batch.set(ref,{slug:payload.appSlug,buildSha:payload.buildSha,status:"active",lastStep:"feedback-v1:"+batchId+":"+String(i+1).padStart(2,"0")+"/"+String(chunks.length).padStart(2,"0"),lastAction:chunk,startedAt:firebase.firestore.FieldValue.serverTimestamp(),lastSeenAt:firebase.firestore.FieldValue.serverTimestamp(),pageKind:payload.appSlug==="home"?"home":"game",durationSec:0})});await batch.commit();bumpQuota();return{ok:true,fallback:true,transport:"levelup-feedback-session-fallback"}};',
    'const submit=async(payload)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),2500);try{const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});const result=await r.json().catch(()=>({}));if(r.ok&&result.ok)return result;if(r.status===429||result.error==="RATE_LIMIT")throw new Error("RATE_LIMIT");return await saveDirect(payload)}catch(e){if(e?.message==="RATE_LIMIT")throw e;return await saveDirect(payload)}finally{clearTimeout(timer)}};',
    'const host=document.createElement("div");host.id="levelup-app-request-root";host.innerHTML=`<button id="lu-ar-fab" type="button" aria-label="新しいアプリを作ってほしい">アプリ制作</button><div id="lu-ar-overlay" aria-hidden="true"><section id="lu-ar-panel" role="dialog" aria-modal="true" aria-labelledby="lu-ar-title"><button id="lu-ar-close" type="button" aria-label="閉じる">×</button><p class="lu-ar-kicker">合うアプリが見つからない？</p><h2 id="lu-ar-title">あなたの悩みから、次のアプリを作る。</h2><p class="lu-ar-lead">今困っていることと、どうなれたら助かるかを書いてください。既存アプリで解決できる場合はそちらを優先し、なければ新しいLEVEL UPアプリの制作候補になります。</p><textarea id="lu-ar-message" maxlength="800" placeholder="例：会議で言いたいことがあるのに、その場になると遠慮して黙ってしまう。自分の意見を落ち着いて言えるようになりたい。"></textarea><p class="lu-ar-safety">安全のため、違法・危険・他者への加害を助長するなど、公序良俗に反する依頼は制作しません。</p><p id="lu-ar-status" aria-live="polite"></p><button id="lu-ar-send" type="button">アプリ制作を依頼する</button></section></div>`;',
    'const css=document.createElement("style");css.textContent=`#levelup-app-request-root{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}#lu-ar-fab{position:fixed;right:max(0px,env(safe-area-inset-right));top:calc(50% + 104px);transform:translateY(-50%);z-index:2147483645;width:38px;min-height:108px;padding:10px 7px;border-radius:14px 0 0 14px;border:1px solid rgba(216,255,91,.42);border-right:0;background:rgba(216,255,91,.96);color:#11150d;font-weight:950;font-size:11px;line-height:1.1;writing-mode:vertical-rl;text-orientation:upright;letter-spacing:.04em;box-shadow:0 8px 28px rgba(0,0,0,.28);touch-action:manipulation;-webkit-tap-highlight-color:transparent}#lu-ar-fab:hover,#lu-ar-fab:focus-visible{background:#e6ff8a;outline:2px solid rgba(216,255,91,.35);outline-offset:2px}#lu-ar-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(4,5,4,.82);display:none;align-items:flex-end;justify-content:center;padding:14px;backdrop-filter:blur(8px)}#lu-ar-overlay.open{display:flex}#lu-ar-panel{position:relative;width:min(590px,100%);border:1px solid rgba(216,255,91,.35);border-radius:24px;background:#0f130d;color:#f6f8f1;padding:20px}#lu-ar-close{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.13);background:#171b15;color:#fff;font-size:20px}.lu-ar-kicker{margin:0 44px 6px 0;color:#d8ff5b;font-size:12px;font-weight:900;letter-spacing:.06em}#lu-ar-panel h2{margin:0 44px 10px 0;font-size:22px;line-height:1.3}.lu-ar-lead{margin:0 0 14px;color:#d7ddd2;font-size:13px;line-height:1.7}#lu-ar-message{box-sizing:border-box;width:100%;min-height:160px;border-radius:15px;border:1px solid rgba(255,255,255,.15);background:#090c08;color:#fff;padding:13px;font:inherit;line-height:1.55;resize:vertical}#lu-ar-message:focus{outline:2px solid rgba(216,255,91,.45);outline-offset:1px}.lu-ar-safety{margin:10px 0 0;color:#9fa89a;font-size:11px;line-height:1.6}#lu-ar-status{min-height:20px;margin:8px 0;font-size:12px;color:#d8ff5b}#lu-ar-send{width:100%;min-height:50px;border:0;border-radius:14px;background:#d8ff5b;color:#11150d;font-weight:950;font-size:14px}@media(max-width:520px){#lu-ar-fab{width:36px;min-height:100px;top:calc(50% + 96px);padding:9px 6px;font-size:10px}#lu-ar-panel{padding:18px 16px}#lu-ar-panel h2{font-size:20px}}`;document.head.appendChild(css);document.body.appendChild(host);',
    'const fab=host.querySelector("#lu-ar-fab"),overlay=host.querySelector("#lu-ar-overlay"),close=host.querySelector("#lu-ar-close"),textarea=host.querySelector("#lu-ar-message"),status=host.querySelector("#lu-ar-status"),send=host.querySelector("#lu-ar-send");let sending=false;',
    'const open=()=>{status.textContent="";overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");setTimeout(()=>textarea.focus(),50)};const hide=()=>{overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true")};fab.addEventListener("click",open);close.addEventListener("click",hide);overlay.addEventListener("click",e=>{if(e.target===overlay)hide()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&overlay.classList.contains("open"))hide()});',
    'send.addEventListener("click",async()=>{if(sending)return;const message=textarea.value.trim();if(message.length<8){status.textContent="困っていることを、もう少しだけ具体的に書いてください。";return}sending=true;send.disabled=true;send.textContent="送信中…";try{const payload={requestType:"new_app",type:"idea",message,appSlug,appTitle:document.querySelector("h1")?.textContent?.trim()||document.title,pageTitle:document.title,pagePath:location.pathname+(location.hash||""),screenLabel:document.querySelector(".screen.active h1,.screen.active h2,.view.active h1,.view.active h2,h2,h1")?.textContent?.trim()||document.title,buildSha,viewport:Math.round(innerWidth)+"x"+Math.round(innerHeight)};const result=await submit(payload);if(!result?.ok)throw new Error("SEND_FAILED");textarea.value="";status.textContent="制作依頼を受け付けました。改善キューに入ります。";send.textContent="受け付けました ✓";setTimeout(()=>{hide();send.textContent="アプリ制作を依頼する"},1300)}catch(e){console.warn("[LEVEL UP app request] submit failed",e);status.textContent=e?.message==="RATE_LIMIT"?"今日は送信上限です。明日また送れます。":"送信できませんでした。";send.textContent="もう一度送る"}finally{sending=false;send.disabled=false}});',
    '})();',
    '</script>',
  ].join('\n');
}

let injected = 0;
for (const filePath of walk(outDir)) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(marker) || !html.includes('</body>')) continue;
  html = html.replace('</body>', `${scriptFor(slugFor(filePath))}\n</body>`);
  fs.writeFileSync(filePath, html);
  injected += 1;
}

if (!injected) throw new Error('LEVEL UP app request widget was not injected into any page.');
console.log(`[Firebase] LEVEL UP app request widget injected into ${injected} HTML pages (build ${buildSha}).`);
