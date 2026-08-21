import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const marker = 'data-levelup-feedback-v1';
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
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function slugFor(filePath) {
  const rel = path.relative(outDir, filePath).replaceAll(path.sep, '/');
  if (rel === 'index.html') return 'home';
  const parts = rel.split('/');
  if (parts[0] === 'apps' && parts[1]) return parts[1].toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0,64) || 'home';
  return (parts[0] || 'home').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0,64) || 'home';
}

function scriptFor(slug) {
  const safeSlug = escapeAttr(slug);
  const safeBuild = escapeAttr(buildSha);
  const safeEndpoint = escapeAttr(endpoint);
  return [
    `<script ${marker} data-app-slug="${safeSlug}" data-build="${safeBuild}" data-endpoint="${safeEndpoint}">`,
    '(() => {',
    'if (window.__LEVELUP_FEEDBACK_V1__) return; window.__LEVELUP_FEEDBACK_V1__ = true;',
    'const s=document.currentScript, appSlug=s?.dataset.appSlug||"home", buildSha=s?.dataset.build||"local", endpoint=s?.dataset.endpoint||""; if(!endpoint)return;',
    'const esc=(v)=>String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("\\\"","&quot;");',
    'const loadScript=(src)=>new Promise((resolve,reject)=>{const found=[...document.scripts].find(x=>x.src===src);if(found){if(window.firebase)resolve();else found.addEventListener("load",resolve,{once:true});return}const el=document.createElement("script");el.src=src;el.async=true;el.crossOrigin="anonymous";el.onload=resolve;el.onerror=()=>reject(new Error("FIREBASE_LOAD_FAILED"));document.head.appendChild(el)});',
    'const ensureFirestore=async()=>{if(!window.firebase){await loadScript("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js")}if(!window.firebase?.firestore){await loadScript("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore-compat.js")}if(!firebase.apps?.length){const r=await fetch("/__/firebase/init.json",{cache:"no-store"});if(!r.ok)throw new Error("FIREBASE_CONFIG_FAILED");const config=await r.json();firebase.initializeApp(config)}return firebase.firestore()};',
    'const japanDay=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).replaceAll("-","");',
    'const quotaKey=()=>"levelup-feedback-local-quota-v1-"+japanDay();const quotaCount=()=>Math.max(0,Number(localStorage.getItem(quotaKey())||0)||0);const bumpQuota=()=>{try{localStorage.setItem(quotaKey(),String(quotaCount()+1))}catch{}};',
    'const saveDirect=async(payload)=>{if(quotaCount()>=12)throw new Error("RATE_LIMIT");const db=await ensureFirestore();await db.collection("levelupFeedback").add({schemaVersion:1,source:"levelup-feedback-widget-fallback",...payload,status:"new",syncStatus:"pending",createdAt:firebase.firestore.FieldValue.serverTimestamp()});bumpQuota();return{ok:true,fallback:true}};',
    'const submit=async(payload)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),2500);try{const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});const result=await r.json().catch(()=>({}));if(r.ok&&result.ok)return result;if(r.status===429||result.error==="RATE_LIMIT")throw new Error("RATE_LIMIT");console.warn("[LEVEL UP feedback] API unavailable, using Firestore fallback",r.status,result);return await saveDirect(payload)}catch(e){if(e?.message==="RATE_LIMIT")throw e;console.warn("[LEVEL UP feedback] API request failed, using Firestore fallback",e);return await saveDirect(payload)}finally{clearTimeout(timer)}};',
    'const host=document.createElement("div"); host.id="levelup-feedback-root"; host.innerHTML="<button id=\\"lu-fb-fab\\" type=\\"button\\" aria-label=\\"改善要望を書く\\">改善</button><div id=\\"lu-fb-overlay\\" aria-hidden=\\"true\\"><section id=\\"lu-fb-panel\\" role=\\"dialog\\" aria-modal=\\"true\\"><button id=\\"lu-fb-close\\" type=\\"button\\" aria-label=\\"閉じる\\">×</button><h2>改善要望を送る</h2><p id=\\"lu-fb-meta\\"></p><div id=\\"lu-fb-types\\"><button data-type=\\"improvement\\" class=\\"on\\">改善</button><button data-type=\\"confusing\\">わかりにくい</button><button data-type=\\"bug\\">バグ</button><button data-type=\\"idea\\">アイデア</button></div><textarea id=\\"lu-fb-message\\" maxlength=\\"800\\" placeholder=\\"どうしたらもっと良くなる？\\"></textarea><p id=\\"lu-fb-status\\"></p><button id=\\"lu-fb-send\\" type=\\"button\\">送信する</button></section></div>";',
    'const css=document.createElement("style"); css.textContent="#levelup-feedback-root{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}#lu-fb-fab{position:fixed;right:max(0px,env(safe-area-inset-right));top:50%;transform:translateY(-50%);z-index:2147483646;width:38px;min-height:88px;padding:10px 7px;border-radius:14px 0 0 14px;border:1px solid rgba(216,255,91,.42);border-right:0;background:rgba(12,15,10,.94);color:#d8ff5b;font-weight:900;font-size:12px;line-height:1.1;writing-mode:vertical-rl;text-orientation:upright;letter-spacing:.08em;box-shadow:0 8px 28px rgba(0,0,0,.34);opacity:.9;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:opacity .15s ease,background .15s ease}#lu-fb-fab:hover,#lu-fb-fab:focus-visible{opacity:1;background:rgba(18,23,14,.98);outline:2px solid rgba(216,255,91,.35);outline-offset:2px}#lu-fb-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(4,5,4,.78);display:none;align-items:flex-end;justify-content:center;padding:14px;backdrop-filter:blur(8px)}#lu-fb-overlay.open{display:flex}#lu-fb-panel{position:relative;width:min(560px,100%);border:1px solid rgba(216,255,91,.28);border-radius:24px;background:#0f130d;color:#f6f8f1;padding:18px}#lu-fb-close{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.13);background:#171b15;color:#fff;font-size:20px}#lu-fb-panel h2{margin:0 44px 6px 0;font-size:20px}#lu-fb-meta{font-size:11px;color:#aab2a5;line-height:1.5}#lu-fb-types{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}#lu-fb-types button{min-height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#151914;color:#dfe4da;font-weight:800}#lu-fb-types button.on{border-color:#d8ff5b;color:#e9ff9c}#lu-fb-message{width:100%;min-height:130px;border-radius:15px;border:1px solid rgba(255,255,255,.14);background:#0a0d09;color:#fff;padding:12px;font:inherit}#lu-fb-status{min-height:18px;font-size:11px;color:#d8ff5b}#lu-fb-send{width:100%;min-height:48px;border:0;border-radius:14px;background:#d8ff5b;color:#11150d;font-weight:950}@media(max-width:520px){#lu-fb-types{grid-template-columns:1fr 1fr}#lu-fb-fab{width:36px;min-height:82px;padding:9px 6px;font-size:11px}}"; document.head.appendChild(css); document.body.appendChild(host);',
    'const fab=host.querySelector("#lu-fb-fab"), overlay=host.querySelector("#lu-fb-overlay"), close=host.querySelector("#lu-fb-close"), meta=host.querySelector("#lu-fb-meta"), textarea=host.querySelector("#lu-fb-message"), status=host.querySelector("#lu-fb-status"), send=host.querySelector("#lu-fb-send"), types=[...host.querySelectorAll("#lu-fb-types button")]; let selectedType="improvement", sending=false;',
    'const open=()=>{meta.innerHTML="<strong>"+esc(document.title)+"</strong><br>"+esc(location.pathname); status.textContent=""; overlay.classList.add("open"); overlay.setAttribute("aria-hidden","false"); setTimeout(()=>textarea.focus(),50)}; const hide=()=>{overlay.classList.remove("open"); overlay.setAttribute("aria-hidden","true")};',
    'fab.addEventListener("click",open); close.addEventListener("click",hide); overlay.addEventListener("click",e=>{if(e.target===overlay)hide()}); document.addEventListener("keydown",e=>{if(e.key==="Escape")hide()}); types.forEach(b=>b.addEventListener("click",()=>{selectedType=b.dataset.type||"improvement";types.forEach(n=>n.classList.toggle("on",n===b))}));',
    'send.addEventListener("click",async()=>{if(sending)return;const message=textarea.value.trim();if(message.length<2){status.textContent="もう少しだけ具体的に書いてください。";return}sending=true;send.disabled=true;send.textContent="送信中…";try{const payload={type:selectedType,message,appSlug,appTitle:document.querySelector("h1")?.textContent?.trim()||document.title,pageTitle:document.title,pagePath:location.pathname+(location.hash||""),screenLabel:document.querySelector(".screen.active h1,.screen.active h2,.view.active h1,.view.active h2,h2,h1")?.textContent?.trim()||document.title,buildSha,viewport:Math.round(innerWidth)+"x"+Math.round(innerHeight)};const result=await submit(payload);if(!result?.ok)throw new Error("SEND_FAILED");textarea.value="";status.textContent="送信しました。";send.textContent="送信しました ✓";setTimeout(()=>{hide();send.textContent="送信する"},800)}catch(e){console.warn("[LEVEL UP feedback] submit failed",e);status.textContent=e?.message==="RATE_LIMIT"?"今日は送信上限です。明日また送れます。":"送信できませんでした。";send.textContent="もう一度送る"}finally{sending=false;send.disabled=false}});',
    '})();',
    '</script>'
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

if (!injected) throw new Error('LEVEL UP feedback widget was not injected into any page.');
console.log(`[Firebase] LEVEL UP feedback widget injected into ${injected} HTML pages with Firestore fallback (build ${buildSha}).`);
