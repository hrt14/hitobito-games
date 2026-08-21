import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const MARKER = 'id="levelup-category-card-theme-v1"';

if (!fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home missing for category card theme.');
}

let html = fs.readFileSync(homePath, 'utf8');

const style = `
<style id="levelup-category-card-theme-v1">
  :root{
    --lu-cat-paper:#f3f1e8;
    --lu-cat-card:#fffef8;
    --lu-cat-ink:#11110f;
    --lu-cat-muted:#6a675f;
    --lu-cat-line:#bdb9ad;
    --lu-cat-lime:#dfff4f;
    --lu-cat-lime-soft:#f2ffc0;
  }

  body .lu-categories{color:var(--lu-cat-ink)!important}
  body .lu-categories-head span{color:#8a877f!important}
  body .lu-categories-head h2{color:var(--lu-cat-ink)!important}

  body #levelup-category-all{
    display:inline-flex!important;
    align-items:center!important;
    gap:10px!important;
    min-height:44px!important;
    padding:0 12px 0 17px!important;
    border:1px solid var(--lu-cat-line)!important;
    border-radius:999px!important;
    background:rgba(255,254,248,.9)!important;
    color:var(--lu-cat-ink)!important;
    box-shadow:0 6px 18px rgba(22,21,17,.04)!important;
  }
  body #levelup-category-all::after{
    content:'→';
    display:grid;
    place-items:center;
    width:29px;
    height:29px;
    border-radius:50%;
    background:var(--lu-cat-lime);
    color:var(--lu-cat-ink);
    font-size:17px;
    line-height:1;
  }

  body .lu-category-grid{gap:14px!important}
  body .lu-category-card,
  body .lu-category-card.tone-black,
  body .lu-category-card.tone-red,
  body .lu-category-card.tone-green,
  body .lu-category-card.tone-navy,
  body .lu-category-card.tone-purple,
  body .lu-category-card.tone-ochre{
    position:relative!important;
    min-height:174px!important;
    padding:18px!important;
    border:1px solid var(--lu-cat-line)!important;
    border-radius:24px!important;
    background:var(--lu-cat-card)!important;
    color:var(--lu-cat-ink)!important;
    box-shadow:0 9px 22px rgba(28,26,20,.045)!important;
    overflow:hidden!important;
  }
  body .lu-category-card::after{
    content:'';
    position:absolute;
    left:18px;
    bottom:17px;
    width:52px;
    height:4px;
    border-radius:999px;
    background:var(--lu-cat-lime);
  }
  body .lu-category-card:hover{
    transform:translateY(-2px)!important;
    border-color:var(--lu-cat-ink)!important;
    box-shadow:0 15px 32px rgba(28,26,20,.08)!important;
  }
  body .lu-category-card:active{transform:scale(.985)!important}
  body .lu-category-card.is-selected{
    outline:0!important;
    border-color:var(--lu-cat-ink)!important;
    box-shadow:0 0 0 3px var(--lu-cat-lime),0 14px 28px rgba(28,26,20,.08)!important;
  }

  body .lu-category-mark{
    display:grid!important;
    place-items:center!important;
    width:43px!important;
    height:43px!important;
    margin-bottom:25px!important;
    border:0!important;
    border-radius:13px!important;
    background:linear-gradient(145deg,var(--lu-cat-lime-soft),#fffde9)!important;
    color:var(--lu-cat-ink)!important;
    font-size:20px!important;
    font-weight:950!important;
    box-shadow:none!important;
  }
  body .lu-category-copy{padding-right:24px!important;padding-bottom:22px!important}
  body .lu-category-copy strong{
    color:var(--lu-cat-ink)!important;
    font-size:20px!important;
    line-height:1.1!important;
    font-weight:950!important;
    letter-spacing:-.04em!important;
  }
  body .lu-category-copy small{
    margin-top:8px!important;
    color:var(--lu-cat-muted)!important;
    font-size:12px!important;
    line-height:1.55!important;
    font-weight:750!important;
  }
  body .lu-category-arrow{
    display:grid!important;
    place-items:center!important;
    right:16px!important;
    top:16px!important;
    width:34px!important;
    height:34px!important;
    border:1px solid var(--lu-cat-line)!important;
    border-radius:50%!important;
    background:transparent!important;
    color:#b4d900!important;
    font-size:19px!important;
    font-weight:800!important;
  }

  @media(max-width:650px){
    body .lu-category-grid{gap:10px!important}
    body .lu-category-card,
    body .lu-category-card.tone-black,
    body .lu-category-card.tone-red,
    body .lu-category-card.tone-green,
    body .lu-category-card.tone-navy,
    body .lu-category-card.tone-purple,
    body .lu-category-card.tone-ochre{
      min-height:158px!important;
      padding:15px!important;
      border-radius:20px!important;
    }
    body .lu-category-card::after{left:15px!important;bottom:14px!important;width:44px!important;height:4px!important}
    body .lu-category-mark{width:38px!important;height:38px!important;margin-bottom:21px!important;border-radius:12px!important;font-size:18px!important}
    body .lu-category-copy{padding-right:14px!important;padding-bottom:20px!important}
    body .lu-category-copy strong{font-size:18px!important}
    body .lu-category-copy small{font-size:12px!important}
    body .lu-category-arrow{right:12px!important;top:12px!important;width:31px!important;height:31px!important;font-size:17px!important}
  }
</style>`;

if (!html.includes(MARKER)) {
  if (!html.includes('</head>')) throw new Error('LEVEL UP head missing for category card theme.');
  html = html.replace('</head>', `${style}\n</head>`);
  fs.writeFileSync(homePath, html);
}

const out = fs.readFileSync(homePath, 'utf8');
for (const token of [MARKER, '.lu-category-card.tone-red', '--lu-cat-lime:#dfff4f', '#levelup-category-all::after', 'font-size:12px!important']) {
  if (!out.includes(token)) throw new Error(`LEVEL UP category card theme missing ${token}`);
}

console.log('[Firebase] LEVEL UP category cards restyled to cream / black / fluorescent lime.');
