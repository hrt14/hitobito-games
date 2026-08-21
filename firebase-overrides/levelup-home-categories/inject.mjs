import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home missing for category navigation.');

let html = fs.readFileSync(homePath, 'utf8');

// The old state-diagnosis block is no longer a top-page entry point.
html = html.replace(/<section class="lu-v3" id="levelup-state-diagnosis-v3">[\s\S]*?<\/section>\s*/g, '');

const categories = [
  { label: '行動する', sub: '先延ばし・始められない', query: '先延ばし', tone: 'black', mark: '→' },
  { label: '気持ちを整える', sub: '不安・落ち込み・モヤモヤ', query: '不安', tone: 'red', mark: '↗' },
  { label: '人間関係', sub: '気を使う・断れない・期待', query: '人間関係', tone: 'green', mark: '↔' },
  { label: '仕事を軽くする', sub: '会議・時間・やることが多い', query: '仕事', tone: 'navy', mark: '✓' },
  { label: '休む・眠る', sub: '疲れ・睡眠・切り替え', query: '睡眠', tone: 'purple', mark: '☾' },
  { label: '自分を知る', sub: '比較・価値観・自分らしさ', query: '比較', tone: 'ochre', mark: '◎' },
];

const cards = categories.map((item) => `
<button type="button" class="lu-category-card tone-${item.tone}" data-levelup-category-query="${item.query}">
  <span class="lu-category-mark" aria-hidden="true">${item.mark}</span>
  <span class="lu-category-copy"><strong>${item.label}</strong><small>${item.sub}</small></span>
  <span class="lu-category-arrow" aria-hidden="true">↗</span>
</button>`).join('');

const section = `
<section class="lu-categories" id="levelup-categories" aria-labelledby="levelup-categories-title">
  <div class="lu-categories-head">
    <div><span>CATEGORIES</span><h2 id="levelup-categories-title">カテゴリから選ぶ</h2></div>
    <button type="button" id="levelup-category-all">すべて見る</button>
  </div>
  <div class="lu-category-grid">${cards}</div>
</section>`;

const searchMatch = html.match(/<section class="levelup-search" id="levelup-search"[\s\S]*?<\/section>/);
if (!searchMatch) throw new Error('LEVEL UP search section missing for search-first home.');
if (!html.includes('id="levelup-categories"')) {
  html = html.replace(searchMatch[0], `${searchMatch[0]}\n${section}`);
}

if (!html.includes('id="levelup-home-categories-style"')) {
  const style = `
<style id="levelup-home-categories-style">
  /* Search is now the first action after the hero. */
  .levelup-search{margin-top:6px!important}
  .levelup-search-copy h2{font-size:18px!important;letter-spacing:-.02em!important;text-transform:none!important}
  #levelup-search-input{font-weight:800!important}

  .lu-categories{margin:30px 0 12px;color:#111}
  .lu-categories[hidden]{display:none!important}
  .lu-categories-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:14px}
  .lu-categories-head span{display:block;margin-bottom:7px;color:#77766f;font-size:9px;font-weight:950;letter-spacing:.19em}
  .lu-categories-head h2{margin:0;color:#111;font-size:28px;line-height:1;font-weight:950;letter-spacing:-.045em}
  #levelup-category-all{min-height:38px;padding:0 14px;border:1px solid #cbc8bf;border-radius:999px;background:#fbfaf6;color:#222;font-size:11px;font-weight:900;cursor:pointer}
  .lu-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .lu-category-card{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;min-height:176px;padding:20px;border:0;border-radius:26px;background:#171715;color:#fff;text-align:left;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease;-webkit-tap-highlight-color:transparent}
  .lu-category-card:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(33,30,24,.13)}
  .lu-category-card:active{transform:scale(.985)}
  .lu-category-card.tone-red{background:#a92d2d}.lu-category-card.tone-green{background:#24510f}.lu-category-card.tone-navy{background:#193b50}.lu-category-card.tone-purple{background:#4b315d}.lu-category-card.tone-ochre{background:#806019}
  .lu-category-mark{display:grid;place-items:center;width:42px;height:42px;margin-bottom:23px;border:1px solid rgba(255,255,255,.28);border-radius:14px;background:rgba(255,255,255,.09);font-size:21px;font-weight:900}
  .lu-category-copy{display:block;padding-right:26px}.lu-category-copy strong{display:block;color:#fff;font-size:22px;line-height:1.08;font-weight:950;letter-spacing:-.04em}.lu-category-copy small{display:block;margin-top:7px;color:rgba(255,255,255,.70);font-size:11px;line-height:1.5;font-weight:750}
  .lu-category-arrow{position:absolute;right:17px;top:16px;color:#fff;font-size:24px;font-weight:700}
  .lu-category-card.is-selected{outline:4px solid #ff4e42;outline-offset:3px}
  section.is-search-results{margin-top:18px!important}
  section.is-search-results .catalog-divider[hidden]{display:none!important}

  @media(max-width:800px){.lu-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:650px){
    .levelup-search{margin:4px 0 28px!important;padding:14px!important;background:#fff!important;border-radius:24px!important;box-shadow:0 8px 24px rgba(33,30,24,.055)!important}
    .levelup-search-copy h2{font-size:17px!important}.levelup-search-box{min-height:58px!important}#levelup-search-input{height:58px!important;font-size:17px!important}
    .lu-categories{margin:30px 0 4px}.lu-categories-head{align-items:center}.lu-categories-head h2{font-size:25px}.lu-category-grid{grid-template-columns:1fr 1fr;gap:9px}
    .lu-category-card{min-height:156px;padding:16px;border-radius:22px}.lu-category-mark{width:36px;height:36px;margin-bottom:20px;border-radius:12px;font-size:18px}.lu-category-copy{padding-right:10px}.lu-category-copy strong{font-size:18px}.lu-category-copy small{font-size:10px}.lu-category-arrow{right:14px;top:13px;font-size:21px}
    section.is-search-results{margin-top:8px!important}
  }
  @media(max-width:360px){.lu-category-grid{grid-template-columns:1fr}.lu-category-card{min-height:136px}}
</style>`;
  html = html.replace('</head>', `${style}\n</head>`);
}

if (!html.includes('id="levelup-home-categories-script"')) {
  const script = `
<script id="levelup-home-categories-script">
(() => {
  const input=document.getElementById('levelup-search-input');
  const cards=[...document.querySelectorAll('[data-levelup-category-query]')];
  const all=document.getElementById('levelup-category-all');
  const categories=document.getElementById('levelup-categories');
  const grid=document.querySelector('.grid');
  const trainingSection=grid?.closest('section')||null;
  const trainingHead=trainingSection?.querySelector('.section-head')||null;
  const trainingTitle=trainingHead?.querySelector('h2')||null;
  const trainingCount=trainingHead?.querySelector('span')||null;
  const originalTitle=trainingTitle?.textContent||'';
  const originalCount=trainingCount?.textContent||'';
  if(!input||!cards.length)return;

  const syncSearchView=()=>{
    const searching=Boolean(input.value.trim());
    if(categories){
      categories.hidden=searching;
      categories.setAttribute('aria-hidden',searching?'true':'false');
    }
    trainingSection?.classList.toggle('is-search-results',searching);
    if(trainingTitle)trainingTitle.textContent=searching?'検索結果':originalTitle;
    if(trainingCount){
      const visible=grid?[...grid.querySelectorAll('.card')].filter(card=>!card.hidden).length:0;
      trainingCount.textContent=searching?(visible+'件'):originalCount;
    }
    grid?.querySelectorAll('.catalog-divider').forEach(divider=>{divider.hidden=searching;});
  };

  const run=(query,card)=>{
    input.value=query;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    cards.forEach(x=>x.classList.toggle('is-selected',x===card));
    document.getElementById('training-games')?.scrollIntoView({behavior:'smooth',block:'start'});
  };
  cards.forEach(card=>card.addEventListener('click',()=>run(card.dataset.levelupCategoryQuery||'',card)));
  all?.addEventListener('click',()=>{
    input.value='';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    cards.forEach(x=>x.classList.remove('is-selected'));
    document.getElementById('training-games')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  input.addEventListener('input',()=>{
    if(!input.value.trim())cards.forEach(x=>x.classList.remove('is-selected'));
    syncSearchView();
  });
  syncSearchView();
})();
</script>`;
  html = html.replace('</body>', `${script}\n</body>`);
}

fs.writeFileSync(homePath, html);
const out = fs.readFileSync(homePath, 'utf8');
for (const required of ['id="levelup-search"','id="levelup-categories"','カテゴリから選ぶ','data-levelup-category-query="先延ばし"','id="levelup-home-categories-script"','検索結果','categories.hidden=searching']) {
  if (!out.includes(required)) throw new Error(`LEVEL UP search/category injection missing: ${required}`);
}
if (out.includes('<section class="lu-v3" id="levelup-state-diagnosis-v3">')) throw new Error('Old LEVEL UP diagnosis section is still visible on top page.');
if (!(out.indexOf('id="levelup-search"') < out.indexOf('id="levelup-categories"'))) throw new Error('LEVEL UP home must be search-first, then categories.');
console.log('[Firebase] LEVEL UP search replaces categories with live results while typing.');
