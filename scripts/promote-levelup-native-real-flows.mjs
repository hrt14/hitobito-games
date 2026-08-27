import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const appsDir = path.join(root, '.dist', 'firebase', 'apps');
const apps = {
  'help-me': { required: ['id="realDelegateModal"', 'src="./real-delegation.js"'] },
  'expect-nothing': { required: ['id="realExpectationModal"', 'src="./real-life.js"'] },
  'suteru-yuki': { required: ['src="./app.js"', 'href="./style.css"'] },
  'jinsei-title': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'arigatou-sagashi': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'main-character': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'kokkara-best': { required: ['id="realFlow"'] },
  'idea-lenses-40': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'viewpoint-exam': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'uchite': { required: ['data-action="practice"', 'USE IT NOW'], sanitizeUchite: true },
  'matomaru': { required: ['id="realScreen"', 'id="realBtn"'] },
  'approval-off': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'levelup-mood': { injectAssets: true, required: ['src="./real-life.js"', 'href="./real-life.css"'] },
  'kanji-warukatta': { required: ['FAST RELIEF', '流せ'], sanitizeKanji: true },
};

function injectAssets(html) {
  if (!html.includes('href="./real-life.css"')) {
    html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="./real-life.css">\n</head>');
  }
  if (!html.includes('src="./real-life.js"')) {
    html = html.replace(/<\/body>/i, '  <script src="./real-life.js"></script>\n</body>');
  }
  return html;
}

function sanitizeUchite(html) {
  html = html.replace(/state\.practiceProblem\s*\|\|\s*localStorage\.getItem\(['"]uchite-problem['"]\)\s*\|\|\s*['"]/g, "state.practiceProblem||'");
  html = html.replace(/localStorage\.setItem\(['"]uchite-problem['"],\s*state\.practiceProblem\);?/g, 'void 0;');
  html = html.replace(
    /localStorage\.setItem\(['"]uchite-last-move['"],\s*JSON\.stringify\(\{problem:state\.practiceProblem,tactic:state\.practiceSelected,action:state\.practiceAction,at:Date\.now\(\)\}\)\);?/g,
    "localStorage.setItem('uchite-last-move',JSON.stringify({tactic:state.practiceSelected,at:Date.now()}));",
  );
  if (!html.includes('id="uchite-private-draft-migration"')) {
    html = html.replace(/<\/body>/i, `  <script id="uchite-private-draft-migration">
  try {
    localStorage.removeItem('uchite-problem');
    const raw = localStorage.getItem('uchite-last-move');
    if (raw) {
      const old = JSON.parse(raw);
      localStorage.setItem('uchite-last-move', JSON.stringify({ tactic: old?.tactic || '', at: Number(old?.at || Date.now()) }));
    }
  } catch {}
  <\/script>\n</body>`);
  }
  if (/localStorage\.getItem\(['"]uchite-problem['"]\)/.test(html)) throw new Error('[native-real-flow] uchite still reads private problem text');
  if (/problem\s*:\s*state\.practiceProblem/.test(html) || /action\s*:\s*state\.practiceAction/.test(html)) throw new Error('[native-real-flow] uchite still persists private practice text');
  return html;
}

function sanitizeKanji(html) {
  const oldDefault = 'flow={start:Date.now(),before:70,after:20,repair:null}';
  const newDefault = 'flow={start:Date.now(),before:70,after:70,repair:null}';
  const oldScale = '[10,20,40,60].map(v=>`<button data-after=';
  const newScale = '[30,50,70,90].map(v=>`<button data-after=';
  if (!html.includes(oldDefault) && !html.includes(newDefault)) throw new Error('[native-real-flow] kanji-warukatta effect default pattern missing');
  if (!html.includes(oldScale) && !html.includes(newScale)) throw new Error('[native-real-flow] kanji-warukatta effect scale pattern missing');
  html = html.replace(oldDefault, newDefault).replace(oldScale, newScale);
  if (html.includes(oldDefault) || html.includes(oldScale)) throw new Error('[native-real-flow] kanji-warukatta still biases effect downward');
  if (!html.includes('id="kanji-effect-neutral-scale"')) {
    html = html.replace(/<\/body>/i, '  <script id="kanji-effect-neutral-scale">document.documentElement.dataset.kanjiEffectScale="neutral";<\/script>\n</body>');
  }
  return html;
}

for (const [slug, config] of Object.entries(apps)) {
  const indexPath = path.join(appsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error(`[native-real-flow] missing ${slug}/index.html`);
  let html = fs.readFileSync(indexPath, 'utf8');

  if (config.injectAssets) html = injectAssets(html);
  if (config.sanitizeUchite) html = sanitizeUchite(html);
  if (config.sanitizeKanji) html = sanitizeKanji(html);

  for (const marker of config.required) {
    if (!html.includes(marker)) throw new Error(`[native-real-flow] ${slug} dedicated flow missing: ${marker}`);
  }

  html = html.replace(/<style id="levelup-real-bridge-style">[\s\S]*?<\/style>\s*/i, '');
  html = html.replace(/<script id="levelup-real-bridge-runtime">[\s\S]*?<\/script>\s*/i, '');
  if (/data-levelup-real-bridge=["'][^"']*["']/i.test(html)) {
    html = html.replace(/data-levelup-real-bridge=["'][^"']*["']/i, 'data-levelup-real-bridge="native"');
  } else {
    html = html.replace(/<html(\s|>)/i, '<html data-levelup-real-bridge="native"$1');
  }
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`[native-real-flow] promoted ${slug}`);
}
