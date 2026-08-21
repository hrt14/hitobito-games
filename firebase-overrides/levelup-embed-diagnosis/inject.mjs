import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const targetDir = path.join(outDir, 'embed', 'diagnosis');
const targetPath = path.join(targetDir, 'index.html');
const canonicalBase = 'https://levelup.hitobito.jp';

if (!fs.existsSync(catalogPath)) throw new Error('LEVEL UP catalog not found. Run after the main Firebase build.');
const games = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).games || [];
if (!games.length) throw new Error('LEVEL UP catalog is empty.');
const bySlug = new Map(games.map((game) => [game.slug, game]));

const recommendations = {
  rumination: {
    relief: ['nukeru', 'mou-owatta', 'maa-iika'],
    rebuild: ['kininaranai', 'approval-off', 'mada-dekinai'],
  },
  stuck: {
    relief: ['3sec-action', 'start', 'one-thing'],
    rebuild: ['one-thing', 'mada-dekinai', '3sec-action'],
  },
  approval: {
    relief: ['approval-off', 'task-separation', 'nukeru'],
    rebuild: ['approval-off', 'main-character', 'watashi-zukan'],
  },
  frustration: {
    relief: ['maa-iika', 'nukeru', 'levelup-mood'],
    rebuild: ['levelup-control', 'expect-nothing', 'task-separation'],
  },
  fatigue: {
    relief: ['chou-tsukareta', 'meeting-respawn', 'extra-load'],
    rebuild: ['self-management', 'one-thing', 'kininaranai'],
  },
  confusion: {
    relief: ['matomaru', 'one-thing', 'uchite'],
    rebuild: ['viewpoint-exam', 'meaning-map', 'main-character'],
  },
};

function safeJson(value) {
  return JSON.stringify(value).replaceAll('</', '<\\/');
}

function resolveGame(candidates) {
  for (const slug of candidates) {
    if (bySlug.has(slug)) return bySlug.get(slug);
  }
  return games[0];
}

const resolved = {};
for (const [issue, modes] of Object.entries(recommendations)) {
  resolved[issue] = {};
  for (const [mode, candidates] of Object.entries(modes)) {
    const game = resolveGame(candidates);
    resolved[issue][mode] = {
      slug: game.slug,
      title: game.title || game.slug,
      description: game.description || game.skill || '今の状態から一歩進むためのLEVEL UPトレーニング。',
      href: game.href?.startsWith('/') ? game.href : `/apps/${encodeURIComponent(game.slug)}/`,
    };
  }
}

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="robots" content="noindex,nofollow" />
<title>30秒LEVEL UP診断</title>
<style>
:root{color-scheme:dark;--bg:#0b0e09;--card:#12170f;--line:rgba(216,255,91,.22);--lime:#d8ff5b;--text:#f5f7f1;--muted:#aab2a3}*{box-sizing:border-box}html,body{margin:0;background:transparent;color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{min-height:100vh;padding:10px}.card{border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,rgba(216,255,91,.08),rgba(13,17,11,.98));padding:16px;box-shadow:0 14px 44px rgba(0,0,0,.22)}.brand{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.brand b{font-size:10px;letter-spacing:.13em;color:var(--lime)}.brand a{font-size:9px;color:#8f9988;text-decoration:none}.step{font-size:8px;letter-spacing:.14em;color:#7f8978;font-weight:800;margin-bottom:5px}h1{font-size:23px;line-height:1.08;letter-spacing:-.045em;margin:0 0 6px}p{font-size:11px;line-height:1.55;color:var(--muted);margin:0 0 12px}.options{display:grid;grid-template-columns:1fr 1fr;gap:7px}.opt{border:1px solid rgba(255,255,255,.1);border-radius:13px;background:#151a12;color:#eef2e8;min-height:54px;padding:10px;text-align:left;font-size:11px;font-weight:800;line-height:1.35;cursor:pointer}.opt:hover,.opt:focus-visible{border-color:rgba(216,255,91,.55);outline:none}.opt.on{border-color:var(--lime);background:rgba(216,255,91,.1);color:#eaff9a}.actions{display:flex;gap:8px;margin-top:12px}.btn{min-height:42px;border-radius:999px;padding:0 14px;font-size:10px;font-weight:900;cursor:pointer}.primary{border:0;background:var(--lime);color:#11150d}.secondary{border:1px solid var(--line);background:#11150e;color:var(--lime)}.primary:disabled{opacity:.32}.screen[hidden]{display:none!important}.result{border:1px solid rgba(216,255,91,.28);border-radius:15px;background:#11160e;padding:14px;margin:10px 0}.tag{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:4px 7px;color:var(--lime);font-size:8px;font-weight:900;letter-spacing:.08em}.result h2{font-size:24px;line-height:1.05;letter-spacing:-.04em;margin:9px 0 7px}.result p{margin-bottom:12px}.go{display:flex;min-height:44px;align-items:center;justify-content:center;border-radius:999px;background:var(--lime);color:#11150d;text-decoration:none;font-size:11px;font-weight:950}.note{font-size:8px;color:#788273;margin-top:9px;text-align:center}@media(max-width:420px){.options{grid-template-columns:1fr}.card{padding:14px}h1{font-size:21px}}
</style>
</head>
<body>
<div class="wrap"><main class="card" data-levelup-embed-diagnosis-v1>
  <div class="brand"><b>LEVEL UP · 30秒診断</b><a id="brand-link" target="_top" rel="noopener">levelup.hitobito.jp ↗</a></div>
  <section class="screen" id="s1">
    <div class="step">1 / 3</div><h1>いま、何がいちばん近い？</h1><p>言葉にしきれなくても、近いものを1つ。</p>
    <div class="options" id="issue-options">
      <button class="opt" data-value="rumination">嫌なことが頭から離れない</button><button class="opt" data-value="stuck">やることがあるのに動けない</button>
      <button class="opt" data-value="approval">人からどう思われるか気になる</button><button class="opt" data-value="frustration">思い通りにいかなくてモヤモヤ</button>
      <button class="opt" data-value="fatigue">なんかもう疲れた</button><button class="opt" data-value="confusion">考えがまとまらない</button>
    </div><div class="actions"><button class="btn primary" id="to2" disabled>次へ →</button></div>
  </section>
  <section class="screen" id="s2" hidden>
    <div class="step">2 / 3</div><h1>今ほしいのはどっち？</h1><p>対症ケアか、根っこからの体質改善か。</p>
    <div class="options"><button class="opt" data-mode="relief">今すぐ少しラクになりたい</button><button class="opt" data-mode="rebuild">同じことで困りにくい自分になりたい</button></div>
    <div class="actions"><button class="btn secondary" id="back1">← 戻る</button><button class="btn primary" id="to3" disabled>次へ →</button></div>
  </section>
  <section class="screen" id="s3" hidden>
    <div class="step">3 / 3</div><h1>どのくらい重い？</h1><p>推薦先は変えず、今の状態を自分で把握するための1問です。</p>
    <div class="options"><button class="opt" data-level="light">ちょっと気になる</button><button class="opt" data-level="medium">何度も戻ってくる</button><button class="opt" data-level="heavy">今かなりしんどい</button></div>
    <div class="actions"><button class="btn secondary" id="back2">← 戻る</button><button class="btn primary" id="show" disabled>おすすめを見る →</button></div>
  </section>
  <section class="screen" id="result" hidden>
    <div class="step">YOUR LEVEL UP</div><h1>今のあなたには、これ。</h1>
    <article class="result"><span class="tag" id="mode-tag"></span><h2 id="result-title"></h2><p id="result-copy"></p><a class="go" id="result-link" target="_top" rel="noopener">このLEVEL UPを始める →</a></article>
    <div class="actions"><button class="btn secondary" id="restart">もう一度診断</button></div><div class="note">診断は医療行為ではありません。今の状態に合うLEVEL UP内のトレーニングを案内します。</div>
  </section>
</main></div>
<script>
const BASE=${safeJson(canonicalBase)};const RECS=${safeJson(resolved)};const qs=new URLSearchParams(location.search);const source=(qs.get('source')||document.referrer||'embed').slice(0,120);let state={issue:'',mode:'',level:''};
const $=id=>document.getElementById(id);$('brand-link').href=BASE+'/?utm_source=embed&utm_medium=referral&utm_campaign=diagnosis_widget';
function choose(selector,key,value){document.querySelectorAll(selector).forEach(b=>b.classList.toggle('on',b.dataset[key]===value))}
function screen(id){['s1','s2','s3','result'].forEach(x=>$(x).hidden=x!==id)}
document.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{state.issue=b.dataset.value;choose('[data-value]','value',state.issue);$('to2').disabled=false});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;choose('[data-mode]','mode',state.mode);$('to3').disabled=false});
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{state.level=b.dataset.level;choose('[data-level]','level',state.level);$('show').disabled=false});
$('to2').onclick=()=>screen('s2');$('back1').onclick=()=>screen('s1');$('to3').onclick=()=>screen('s3');$('back2').onclick=()=>screen('s2');
$('show').onclick=()=>{const game=RECS[state.issue]?.[state.mode];if(!game)return;const u=new URL(game.href,BASE);u.searchParams.set('utm_source','embed');u.searchParams.set('utm_medium','referral');u.searchParams.set('utm_campaign','diagnosis_widget');u.searchParams.set('utm_content',state.issue+'_'+state.mode+'_'+state.level);if(source&&source!=='embed')u.searchParams.set('ref',source);$('mode-tag').textContent=state.mode==='relief'?'今すぐ効く一本':'体質改善の一本';$('result-title').textContent=game.title;$('result-copy').textContent=game.description;$('result-link').href=u.href;screen('result')};
$('restart').onclick=()=>{state={issue:'',mode:'',level:''};document.querySelectorAll('.opt').forEach(b=>b.classList.remove('on'));$('to2').disabled=$('to3').disabled=$('show').disabled=true;screen('s1')};
</script>
</body></html>`;

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetPath, html);
console.log(`Generated embeddable LEVEL UP diagnosis: ${path.relative(root, targetPath)}`);
