import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const marker = 'data-levelup-acquisition-v2';
const canonicalBase = 'https://levelup.hitobito.jp';

if (!fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home not found. Run this after the Firebase LEVEL UP build.');
}

const problems = [
  ['ugokenai', '先延ばしで動けない', '最初の一手まで小さくする'],
  ['hikizuru', '嫌なこと・失言を引きずる', '必要な反省だけ残して終える'],
  ['hitonome', '人の目・嫌われるのが気になる', '他人の評価と自分の行動を分ける'],
  ['kangaesugi', '考えすぎて頭がいっぱい', '今考えることだけに絞る'],
  ['smartphone', 'スマホをやめたい', '刺激との距離を作る'],
  ['tsukareta', '疲れて何もしたくない', '余計な負荷を増やさず回復する'],
  ['kotowarenai', '断れない・頼めない', '言いにくいことを短く伝える'],
  ['nerumae-kangaegoto', '寝る前に考え事が止まらない', '明日に預けて休息へ切り替える'],
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

let html = fs.readFileSync(homePath, 'utf8');
if (html.includes(marker)) {
  console.log('[Firebase] LEVEL UP acquisition v2 already injected.');
  process.exit(0);
}

const seoTitle = 'LEVEL UP｜考えすぎ・先延ばし・人の目をゲームで切り替える';
const seoDescription = '考えすぎ、先延ばし、人の目、失言の後悔、スマホ、疲れ。今の困りごとから選び、短い無料Webゲームで考え方と行動を切り替えるLEVEL UP。';

if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${seoTitle}</title>`);
} else {
  html = html.replace('</head>', `  <title>${seoTitle}</title>\n</head>`);
}

if (/<meta[^>]+name=["']description["'][^>]*>/i.test(html)) {
  html = html.replace(/<meta[^>]+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(seoDescription)}" />`);
} else {
  html = html.replace('</head>', `  <meta name="description" content="${escapeHtml(seoDescription)}" />\n</head>`);
}

const headPieces = [];
if (!/<meta[^>]+property=["']og:site_name["']/i.test(html)) headPieces.push('<meta property="og:site_name" content="LEVEL UP" />');
if (!/<meta[^>]+property=["']og:title["']/i.test(html)) headPieces.push(`<meta property="og:title" content="${escapeHtml(seoTitle)}" />`);
if (!/<meta[^>]+property=["']og:description["']/i.test(html)) headPieces.push(`<meta property="og:description" content="${escapeHtml(seoDescription)}" />`);
if (!/<meta[^>]+property=["']og:url["']/i.test(html)) headPieces.push(`<meta property="og:url" content="${canonicalBase}/" />`);
if (!/<meta[^>]+property=["']og:type["']/i.test(html)) headPieces.push('<meta property="og:type" content="website" />');
if (!/<meta[^>]+name=["']twitter:card["']/i.test(html)) headPieces.push('<meta name="twitter:card" content="summary" />');
if (!html.includes('data-levelup-website-schema')) {
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LEVEL UP',
    alternateName: 'hitobito LEVEL UP',
    url: `${canonicalBase}/`,
    description: seoDescription,
  }).replaceAll('</', '<\\/');
  headPieces.push(`<script type="application/ld+json" data-levelup-website-schema>${schema}</script>`);
}

const style = `<style ${marker}>
  .lu-acq{margin:24px 0 8px;padding:22px;border:1px solid rgba(216,255,91,.19);border-radius:22px;background:linear-gradient(145deg,rgba(216,255,91,.055),rgba(255,255,255,.018))}
  .lu-acq__kicker{font-size:12px;font-weight:950;letter-spacing:.12em;color:var(--lime,#d8ff5b);margin-bottom:8px}
  .lu-acq h2{margin:0 0 7px;font-size:clamp(24px,4vw,36px);line-height:1.08;letter-spacing:-.04em}
  .lu-acq__lead{margin:0 0 15px;max-width:68ch;color:#aeb5a5;font-size:12px;line-height:1.7}
  .lu-acq__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
  .lu-acq__item{display:block;min-height:92px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(8,10,7,.52);transition:transform .16s ease,border-color .16s ease}
  .lu-acq__item:hover{transform:translateY(-2px);border-color:rgba(216,255,91,.34)}
  .lu-acq__item strong{display:block;font-size:13px;line-height:1.35;color:#f3f6ee}
  .lu-acq__item span{display:block;margin-top:5px;font-size:12px;line-height:1.5;color:#8f9887}
  .lu-acq__all{display:inline-flex;margin-top:13px;font-size:12px;font-weight:950;color:var(--lime,#d8ff5b)}
  @media(max-width:860px){.lu-acq__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:520px){.lu-acq{padding:16px;border-radius:18px}.lu-acq__grid{grid-template-columns:1fr}.lu-acq__item{min-height:0}}
</style>`;
headPieces.push(style);
html = html.replace('</head>', `${headPieces.join('\n  ')}\n</head>`);

const items = problems.map(([slug, title, copy]) => `
    <a class="lu-acq__item" href="/problems/${escapeHtml(slug)}/"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></a>`).join('');

const section = `
<section class="lu-acq" ${marker}>
  <div class="lu-acq__kicker">START FROM YOUR PROBLEM</div>
  <h2>いま困っていることから、直接始める。</h2>
  <p class="lu-acq__lead">アプリ名を知らなくても大丈夫。近い状態を1つ選ぶと、その悩みに合うLEVEL UPへ進めます。</p>
  <nav class="lu-acq__grid" aria-label="悩み別のLEVEL UP">${items}
  </nav>
  <a class="lu-acq__all" href="/problems/">悩み別の入口を全部見る →</a>
</section>`;

if (html.includes('</main>')) {
  html = html.replace('</main>', `${section}\n</main>`);
} else if (html.includes('</body>')) {
  html = html.replace('</body>', `${section}\n</body>`);
} else {
  throw new Error('LEVEL UP home has no </main> or </body> insertion point.');
}

fs.writeFileSync(homePath, html);

for (const [slug] of problems) {
  const target = path.join(outDir, 'problems', slug, 'index.html');
  if (!fs.existsSync(target)) throw new Error(`Expected problem landing is missing: ${slug}`);
}

for (const required of [seoTitle, '/problems/ugokenai/', '/problems/hikizuru/', 'data-levelup-website-schema']) {
  if (!html.includes(required)) throw new Error(`LEVEL UP acquisition v2 validation failed: ${required}`);
}

console.log(`[Firebase] LEVEL UP acquisition v2 ready: ${problems.length} crawlable problem links + descriptive home metadata.`);
