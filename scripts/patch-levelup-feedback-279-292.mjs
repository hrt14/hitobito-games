import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.dist', 'firebase');

// #279: 「まとまる。」の実戦モードで、30秒で足りないときに考える時間を延長できるようにする。
for (const rel of ['apps/matomaru/index.html', 'matomaru/index.html']) {
  const file = path.join(outDir, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const timer = '<div class="real-timer" id="realTimer">30</div>';
  if (html.includes(timer) && !html.includes('id="realExtendBtn"')) {
    html = html.replace(timer, '<div class="real-time-controls"><div class="real-timer" id="realTimer">30</div><button class="ghost-btn" id="realExtendBtn" type="button">もう少し考える +30秒</button></div>');
    html = html.replace('</head>', '<style>.real-time-controls{display:flex;flex-direction:column;align-items:flex-end;gap:8px}.real-time-controls #realExtendBtn{font-size:12px;padding:8px 10px;white-space:nowrap}</style></head>');
    fs.writeFileSync(file, html);
  }
}

for (const rel of ['apps/matomaru/app.js', 'matomaru/app.js']) {
  const file = path.join(outDir, rel);
  if (!fs.existsSync(file)) continue;
  let js = fs.readFileSync(file, 'utf8');
  if (!js.includes("$('realExtendBtn')")) {
    const oldStart = "function startRealMode() {\n    clearInterval(state.realTimerId); ['realSummary','realReason','realNext'].forEach(id=>$(id).value=''); $('realTimer').textContent='30'; showScreen('realScreen');\n    let left=30; state.realTimerId=setInterval(()=>{left--; $('realTimer').textContent=Math.max(0,left); if(left<=0){clearInterval(state.realTimerId);tone(220,.08)}},1000);\n    setTimeout(()=>$('realSummary').focus(),180);\n  }";
    const newStart = "function startRealMode() {\n    clearInterval(state.realTimerId); ['realSummary','realReason','realNext'].forEach(id=>$(id).value=''); $('realTimer').textContent='30'; showScreen('realScreen');\n    let left=30; const tick=()=>{clearInterval(state.realTimerId);state.realTimerId=setInterval(()=>{left--; $('realTimer').textContent=Math.max(0,left); if(left<=0){clearInterval(state.realTimerId);tone(220,.08)}},1000)}; tick();\n    const extend=$('realExtendBtn'); if(extend){extend.onclick=()=>{left+=30;$('realTimer').textContent=left;tick();toast('30秒延長しました');};}\n    setTimeout(()=>$('realSummary').focus(),180);\n  }";
    if (!js.includes(oldStart)) throw new Error(`matomaru startRealMode pattern missing in ${rel}`);
    js = js.replace(oldStart, newStart);
    fs.writeFileSync(file, js);
  }
}
console.log('[LEVEL UP feedback] #279: matomaru can extend thinking time by 30 seconds.');

// #292: 既存の多数テーマとは別に、依頼に明記された「MODERN」をワンタップで選べるようにする。
const homePath = path.join(outDir, 'index.html');
if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home missing.');
let home = fs.readFileSync(homePath, 'utf8');
if (!home.includes('data-levelup-modern-v1')) {
  const modern = `<style data-levelup-modern-v1>html[data-levelup-theme="modern"]{color-scheme:light!important;--lu-paper:#f5f5f3!important;--lu-surface:#ffffff!important;--lu-ink:#111315!important;--lu-muted:#697078!important;--lu-line:#d8dde2!important;--lu-lime:#111315!important;--lu-lime-soft:#e8eaed!important;--lu-cat-paper:#f5f5f3!important;--lu-cat-card:#ffffff!important;--lu-cat-ink:#111315!important;--lu-cat-muted:#697078!important;--lu-cat-line:#d8dde2!important;--lu-cat-lime:#111315!important;--lu-cat-lime-soft:#e8eaed!important}#levelup-modern-theme-btn{width:44px;height:44px;border-radius:50%;border:1px solid var(--lu-line,#ccc);background:var(--lu-surface,#fff);color:var(--lu-ink,#111);font:800 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.04em;cursor:pointer}</style><script data-levelup-modern-v1>(()=>{const KEY='hitobito-levelup-color-mode-v1';const apply=()=>{try{if(localStorage.getItem(KEY)==='modern')document.documentElement.dataset.levelupTheme='modern'}catch{}};apply();const install=()=>{const toggle=document.getElementById('levelup-theme-toggle');if(!toggle||document.getElementById('levelup-modern-theme-btn'))return;const b=document.createElement('button');b.id='levelup-modern-theme-btn';b.type='button';b.textContent='MOD';b.title='MODERN';b.setAttribute('aria-label','MODERNテーマにする');b.onclick=()=>{document.documentElement.dataset.levelupTheme='modern';try{localStorage.setItem(KEY,'modern')}catch{}};toggle.insertAdjacentElement('afterend',b)};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install()})();</script>`;
  home = home.replace('</body>', modern + '</body>');
  fs.writeFileSync(homePath, home);
}
console.log('[LEVEL UP feedback] #292: explicit MODERN theme added to top page.');
