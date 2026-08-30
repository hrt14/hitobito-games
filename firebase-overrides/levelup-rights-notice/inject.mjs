import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const MARKER = 'id="levelup-rights-notice-v1"';

if (!fs.existsSync(outDir)) throw new Error('LEVEL UP Firebase bundle missing for rights notice injection.');

function walk(dirPath, out = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const injection = `
<script id="levelup-rights-notice-v1">
(()=>{
  if(window.__LEVELUP_RIGHTS_NOTICE_V1__)return;window.__LEVELUP_RIGHTS_NOTICE_V1__=true;
  const mount=()=>{
    const panel=document.getElementById('lu-fb-panel');
    const types=document.getElementById('lu-fb-types');
    const textarea=document.getElementById('lu-fb-message');
    if(!panel||!types||!textarea)return false;
    let note=document.getElementById('lu-fb-rights-note');
    if(!note){
      note=document.createElement('div');
      note.id='lu-fb-rights-note';
      note.setAttribute('role','note');
      note.innerHTML='<strong>アプリ制作に関する注意</strong><span>制作・生成された内容について、著作権その他の権利の成立・帰属は保証されません。第三者の著作物・商標・キャラクター等の無断利用は避けてください。</span>';
      textarea.insertAdjacentElement('afterend',note);
      const style=document.createElement('style');
      style.id='lu-fb-rights-note-style';
      style.textContent='#lu-fb-rights-note{display:none;margin:10px 0 2px;padding:10px 11px;border:1px solid rgba(216,255,91,.22);border-radius:12px;background:rgba(216,255,91,.06);font-size:11px;line-height:1.55}#lu-fb-rights-note.on{display:block}#lu-fb-rights-note strong{display:block;margin-bottom:3px;color:#d8ff5b;font-size:11px}#lu-fb-rights-note span{display:block;color:#c4cbbf}';
      document.head.appendChild(style);
    }
    const sync=()=>{const idea=types.querySelector('[data-type="idea"]');note.classList.toggle('on',Boolean(idea?.classList.contains('on')))};
    types.addEventListener('click',()=>setTimeout(sync,0));
    sync();
    return true;
  };
  if(mount())return;
  let attempts=0;const timer=setInterval(()=>{attempts+=1;if(mount()||attempts>120)clearInterval(timer)},50);
})();
</script>`;

let injected = 0;
for (const filePath of walk(outDir)) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(MARKER) || !html.includes('data-levelup-feedback-v1') || !html.includes('</body>')) continue;
  html = html.replace('</body>', `${injection}\n</body>`);
  fs.writeFileSync(filePath, html);
  injected += 1;
}

if (!injected) throw new Error('LEVEL UP rights notice was not injected into any feedback-enabled page.');
console.log(`[Firebase] LEVEL UP app-idea rights notice injected into ${injected} pages.`);
