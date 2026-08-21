import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const marker = 'data-levelup-state-diagnosis-v3';

if (!fs.existsSync(homePath)) throw new Error('Firebase LEVEL UP home not found for diagnosis v3.');

const issues = [
  ['rumination', '嫌なことが頭から離れない'],
  ['stuck', 'やることがあるのに動けない'],
  ['approval', '人からどう思われるか気になる'],
  ['frustration', '思い通りにいかなくてイライラ'],
  ['fatigue', 'なんかもう疲れた'],
  ['waiting', '予定があるだけで時間を使えない'],
  ['confusion', '考えがまとまらない'],
  ['direction', '何をしたいのかわからない'],
];

const config = {
  rumination:{question:'何がいちばん引っかかってる？',details:{
    slip:{label:'会話・会議で失言したかも',relief:['nukeru','mou-owatta'],rebuild:['kininaranai','approval-off']},
    disliked:{label:'嫌われた・感じ悪かった気がする',relief:['nukeru','kanji-warukatta'],rebuild:['kininaranai','approval-off']},
    failure:{label:'失敗したことを繰り返し考える',relief:['nukeru','mou-owatta'],rebuild:['mada-dekinai','kininaranai']},
    anger:{label:'腹が立つことを思い出す',relief:['nukeru','levelup-mood'],rebuild:['kininaranai','expect-nothing']},
    vague:{label:'理由はうまく言えないけどモヤモヤ',relief:['nukeru','name-it'],rebuild:['kininaranai','extra-load']},
  }},
  stuck:{question:'止まっている理由に近いのは？',details:{
    huge:{label:'大きすぎて、どこから手をつけるかわからない',relief:['3sec-action','start'],rebuild:['one-thing','3sec-action']},
    perfection:{label:'ちゃんとやろうとすると重くなる',relief:['3sec-action','maa-iika'],rebuild:['mada-dekinai','one-thing']},
    many:{label:'やることが多すぎて全部気になる',relief:['one-thing','3sec-action'],rebuild:['matomaru','one-thing']},
    morning:{label:'朝・起きた直後が特に動けない',relief:['asa-glide','start'],rebuild:['3sec-action','one-thing']},
    aversion:{label:'理由より、とにかく始めるのが嫌',relief:['3sec-action','start'],rebuild:['one-thing','mada-dekinai']},
  }},
  approval:{question:'どの場面がいちばん近い？',details:{
    aftertalk:{label:'会話のあと「失礼だったかな」と反省会',relief:['nukeru','kanji-warukatta'],rebuild:['approval-off','kininaranai']},
    choice:{label:'自分の希望より、よく思われる方を選ぶ',relief:['approval-off','task-separation'],rebuild:['main-character','watashi-zukan']},
    sns:{label:'SNS・反応・いいねが気になる',relief:['approval-off','nukeru'],rebuild:['kininaranai','main-character']},
    no:{label:'断る・意見を言うと嫌われそう',relief:['task-separation','approval-off'],rebuild:['task-separation','main-character']},
  }},
  frustration:{question:'何が思い通りにいってない？',details:{
    plan:{label:'予定や計画が崩れた',relief:['maa-iika','nukeru'],rebuild:['maa-iika','levelup-control']},
    person:{label:'相手が期待どおり動かない',relief:['nukeru','task-separation'],rebuild:['expect-nothing','task-separation']},
    unfair:{label:'納得できない・不公平に感じる',relief:['nukeru','levelup-mood'],rebuild:['kininaranai','maa-iika']},
    result:{label:'自分の結果が思ったより悪かった',relief:['maa-iika','nukeru'],rebuild:['mada-dekinai','levelup-control']},
  }},
  fatigue:{question:'いちばん重いのはどれ？',details:{
    brain:{label:'考えることが多すぎて頭が重い',relief:['extra-load','nukeru'],rebuild:['one-thing','matomaru']},
    people:{label:'人に気を使いすぎて疲れた',relief:['nukeru','extra-load'],rebuild:['approval-off','kininaranai']},
    meeting:{label:'会議・仕事のあと一気に消耗する',relief:['meeting-respawn','nukeru'],rebuild:['one-thing','kininaranai']},
    vague:{label:'何疲れかわからない',relief:['chou-tsukareta','name-it','nukeru'],rebuild:['extra-load','self-management']},
  }},
  waiting:{question:'どんな「待ち時間」になってる？',details:{
    one:{label:'午後に1個予定があるだけで、それまで動けない',relief:['yotei-made-tsukaeru','timecraft'],rebuild:['one-thing','timecraft']},
    split:{label:'予定が細かく散って、一日が全部細切れ',relief:['yotei-made-tsukaeru','one-thing'],rebuild:['timecraft','one-thing']},
    meeting:{label:'会議の前になると何も始められない',relief:['yotei-made-tsukaeru','3sec-action'],rebuild:['timecraft','one-thing']},
  }},
  confusion:{question:'どこで詰まってる？',details:{
    info:{label:'情報が多すぎて、要するに何かわからない',relief:['matomaru','one-thing'],rebuild:['matomaru','one-thing']},
    next:{label:'問題はわかるけど次の一手が出ない',relief:['uchite','matomaru'],rebuild:['idea-lenses-40','viewpoint-exam']},
    meeting:{label:'会議・説明で話が散らかる',relief:['matomaru','timecraft'],rebuild:['matomaru','levelup-smalltalk']},
    options:{label:'選択肢が多くて決められない',relief:['matomaru','levelup-control'],rebuild:['viewpoint-exam','main-character']},
  }},
  direction:{question:'迷い方に近いのは？',details:{
    approval:{label:'夢に「成功したい・認められたい」が混ざってる',relief:['approval-off','watashi-zukan'],rebuild:['meaning-map','main-character']},
    values:{label:'自分が何を大事にしたいかわからない',relief:['watashi-zukan','meaning-map'],rebuild:['main-character','meaning-map']},
    stagnant:{label:'毎日やってるのに進んでる感じがしない',relief:['life-plus-one','meaning-map'],rebuild:['main-character','watashi-zukan']},
    goal:{label:'目標はあるけど、本当にやりたいのかわからない',relief:['meaning-map','watashi-zukan'],rebuild:['main-character','meaning-map']},
  }},
};

const issueButtons = issues.map(([key,label]) => `<button type="button" class="lu-v3-problem" data-lu-v3-issue="${key}"><span>${label}</span><b>→</b></button>`).join('\n');

const style = `
<style id="levelup-state-diagnosis-v3-style">
  #levelup-state-diagnosis-v2,.lu-v2-sheet{display:none!important}
  .lu-v3{position:relative;overflow:hidden;margin:0 0 18px;border:1px solid rgba(216,255,91,.3);border-radius:22px;background:linear-gradient(145deg,rgba(216,255,91,.1),rgba(255,255,255,.025));padding:20px}
  .lu-v3-kicker{font-size:8px;letter-spacing:.17em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:8px}.lu-v3 h2{margin:0;font-size:clamp(28px,5vw,46px);line-height:1;letter-spacing:-.055em}.lu-v3-lead{margin:9px 0 15px;max-width:66ch;color:#aeb5a5;font-size:11px;line-height:1.65}
  .lu-v3-problems{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.lu-v3-problem{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:58px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:#131711;color:#f3f6ee;padding:11px 13px;text-align:left;font-size:12px;font-weight:850;line-height:1.35}.lu-v3-problem b{color:var(--lime,#d8ff5b);font-size:17px}
  .lu-v3-sheet{position:fixed;inset:0;z-index:2147483150;display:none;align-items:flex-end;justify-content:center;padding:14px;background:rgba(4,5,4,.84);backdrop-filter:blur(10px)}.lu-v3-sheet.is-open{display:flex}.lu-v3-panel{width:min(650px,100%);max-height:min(88vh,820px);overflow:auto;border:1px solid rgba(216,255,91,.3);border-radius:24px;background:#0e120c;color:#f6f8f1;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
  .lu-v3-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}.lu-v3-top strong{font-size:11px;letter-spacing:.12em}.lu-v3-close{width:36px;height:36px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:#151914;color:#fff;font-size:18px}.lu-v3-step{font-size:8px;letter-spacing:.14em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:6px}.lu-v3-question{font-size:23px;line-height:1.12;letter-spacing:-.04em;margin:0 0 13px}
  .lu-v3-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lu-v3-option{min-height:58px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:#151914;color:#edf0e9;padding:11px;text-align:left;font-size:12px;font-weight:850;line-height:1.35}.lu-v3-option small{display:block;margin-top:4px;color:#899283;font-size:9px;font-weight:650;line-height:1.45}.lu-v3-option.is-on{border-color:rgba(216,255,91,.72);background:rgba(216,255,91,.11);color:#eaff9a}.lu-v3-option.is-on small{color:#c7d39d}.lu-v3-mode-options{grid-template-columns:1fr}.lu-v3-mode-options .lu-v3-option{min-height:68px}
  .lu-v3-next{display:flex;gap:8px;margin-top:14px}.lu-v3-primary,.lu-v3-secondary{min-height:46px;border-radius:999px;padding:0 16px;font-size:11px;font-weight:950}.lu-v3-primary{border:0;background:var(--lime,#d8ff5b);color:#10140c}.lu-v3-primary:disabled{opacity:.35}.lu-v3-secondary{border:1px solid rgba(216,255,91,.25);background:#11150e;color:#d8ff5b}.lu-v3-screen[hidden]{display:none!important}
  .lu-v3-result-intro{margin:0 0 14px;padding:12px 13px;border-radius:14px;background:rgba(216,255,91,.07);color:#c8cfbe;font-size:11px;line-height:1.6}.lu-v3-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.lu-v3-result{display:flex;flex-direction:column;min-height:225px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:#131711;padding:14px}.lu-v3-result.is-priority{border-color:rgba(216,255,91,.74);box-shadow:0 0 0 1px rgba(216,255,91,.08) inset}.lu-v3-role{display:flex;align-items:center;justify-content:space-between;gap:7px;color:var(--lime,#d8ff5b);font-size:8px;letter-spacing:.09em;font-weight:950}.lu-v3-priority{display:none;padding:3px 6px;border-radius:999px;background:var(--lime,#d8ff5b);color:#10140c;font-size:7px}.lu-v3-result.is-priority .lu-v3-priority{display:inline-block}.lu-v3-app-type{display:inline-flex;width:max-content;margin-top:10px;padding:4px 7px;border:1px solid rgba(255,255,255,.1);border-radius:999px;color:#aeb7a5;font-size:8px;font-weight:850}.lu-v3-result h3{margin:9px 0 7px;font-size:21px;line-height:1.05;letter-spacing:-.04em}.lu-v3-result p{margin:0 0 12px;color:#aeb5a5;font-size:10px;line-height:1.55}.lu-v3-result a{margin-top:auto;display:flex;align-items:center;justify-content:center;min-height:40px;border-radius:999px;background:#20261b;color:#d8ff5b;text-decoration:none;font-size:10px;font-weight:950}.lu-v3-restart{margin-top:13px}
  @media(max-width:650px){.lu-v3{padding:15px;border-radius:18px}.lu-v3 h2{font-size:32px}.lu-v3-problems{grid-template-columns:1fr 1fr;gap:7px}.lu-v3-problem{min-height:64px;padding:10px;font-size:11px}.lu-v3-options,.lu-v3-results{grid-template-columns:1fr}.lu-v3-result{min-height:0}.lu-v3-panel{padding:16px}.lu-v3-question{font-size:21px}}@media(max-width:390px){.lu-v3-problems{grid-template-columns:1fr}}
</style>`;

const markup = `
<section class="lu-v3" id="levelup-state-diagnosis-v3">
  <div class="lu-v3-kicker">START FROM YOUR STATE</div><h2>いま、どうした？</h2>
  <p class="lu-v3-lead">今の悩みを選んだあと、「まず今ラクになりたい」か「根っこから変えたい」かでアプリを分けます。</p>
  <div class="lu-v3-problems">${issueButtons}</div>
</section>
<div class="lu-v3-sheet" id="lu-v3-sheet" aria-hidden="true"><div class="lu-v3-panel" role="dialog" aria-modal="true" aria-labelledby="lu-v3-title">
  <div class="lu-v3-top"><strong id="lu-v3-title">今の状態から選ぶ</strong><button type="button" class="lu-v3-close" id="lu-v3-close" aria-label="閉じる">×</button></div>
  <section class="lu-v3-screen" id="lu-v3-detail-screen"><div class="lu-v3-step">STEP 2 / 3</div><h3 class="lu-v3-question" id="lu-v3-detail-question"></h3><div class="lu-v3-options" id="lu-v3-detail-options"></div><div class="lu-v3-next"><button class="lu-v3-secondary" type="button" id="lu-v3-back-top">← 戻る</button><button class="lu-v3-primary" type="button" id="lu-v3-to-mode" disabled>次へ →</button></div></section>
  <section class="lu-v3-screen" id="lu-v3-mode-screen" hidden><div class="lu-v3-step">STEP 3 / 3</div><h3 class="lu-v3-question">今日は、どっちで使いたい？</h3><div class="lu-v3-options lu-v3-mode-options">
    <button class="lu-v3-option" type="button" data-lu-v3-mode="relief">今すぐラクになりたい<small>30秒〜数分で、いまの状態を少し動かす。</small></button>
    <button class="lu-v3-option" type="button" data-lu-v3-mode="rebuild">根っこから変えたい<small>同じことで消耗しにくい反射・習慣を鍛える。</small></button>
    <button class="lu-v3-option" type="button" data-lu-v3-mode="both">両方ほしい<small>まず今を軽くして、そのあと体質改善までつなぐ。</small></button>
  </div><div class="lu-v3-next"><button class="lu-v3-secondary" type="button" id="lu-v3-back-detail">← 戻る</button><button class="lu-v3-primary" type="button" id="lu-v3-run" disabled>結果を見る →</button></div></section>
  <section class="lu-v3-screen" id="lu-v3-result-screen" hidden><div class="lu-v3-step">YOUR LEVEL UP</div><h3 class="lu-v3-question" id="lu-v3-result-heading"></h3><div class="lu-v3-result-intro" id="lu-v3-result-intro"></div><div class="lu-v3-results" id="lu-v3-results"></div><button class="lu-v3-secondary lu-v3-restart" type="button" id="lu-v3-restart">最初から選び直す</button></section>
</div></div>`;

const script = `
<script ${marker}>
(() => {
  const CONFIG=${JSON.stringify(config)};
  const sheet=document.getElementById('lu-v3-sheet'),detailScreen=document.getElementById('lu-v3-detail-screen'),modeScreen=document.getElementById('lu-v3-mode-screen'),resultScreen=document.getElementById('lu-v3-result-screen');
  const question=document.getElementById('lu-v3-detail-question'),options=document.getElementById('lu-v3-detail-options'),toMode=document.getElementById('lu-v3-to-mode'),run=document.getElementById('lu-v3-run');
  const cards=[...document.querySelectorAll('.card[data-game][data-treatment]')],bySlug=new Map(cards.map(card=>[card.dataset.game,card]));
  let issueKey='',detailKey='',mode='';
  const open=v=>{sheet?.classList.toggle('is-open',v);sheet?.setAttribute('aria-hidden',String(!v));document.documentElement.style.overflow=v?'hidden':''};
  const show=x=>{detailScreen.hidden=x!=='detail';modeScreen.hidden=x!=='mode';resultScreen.hidden=x!=='result'};
  const resetMode=()=>{mode='';run.disabled=true;document.querySelectorAll('[data-lu-v3-mode]').forEach(b=>b.classList.remove('is-on'))};
  const openIssue=key=>{const issue=CONFIG[key];if(!issue)return;issueKey=key;detailKey='';resetMode();question.textContent=issue.question;options.innerHTML='';Object.entries(issue.details).forEach(([id,detail])=>{const b=document.createElement('button');b.type='button';b.className='lu-v3-option';b.textContent=detail.label;b.onclick=()=>{options.querySelectorAll('.lu-v3-option').forEach(n=>n.classList.remove('is-on'));b.classList.add('is-on');detailKey=id;toMode.disabled=false};options.appendChild(b)});toMode.disabled=true;show('detail');open(true)};
  const rank=(treatment,wanted)=>wanted==='relief'?(treatment==='relief'?0:treatment==='both'?1:2):(treatment==='rebuild'?0:treatment==='both'?1:2);
  const pick=(slugs,wanted,used)=>{const candidate=(slugs||[]).map(slug=>({slug,card:bySlug.get(slug)})).filter(x=>x.card&&!used.has(x.slug)).sort((a,b)=>rank(a.card.dataset.treatment,wanted)-rank(b.card.dataset.treatment,wanted))[0];if(candidate)return candidate;return cards.filter(card=>!used.has(card.dataset.game)).sort((a,b)=>rank(a.dataset.treatment,wanted)-rank(b.dataset.treatment,wanted)).map(card=>({slug:card.dataset.game,card}))[0]||null};
  const meta=p=>p?{slug:p.slug,title:p.card.querySelector('h2')?.textContent?.trim()||p.slug,description:p.card.querySelector('p')?.textContent?.trim()||'',href:p.card.querySelector('.card-link')?.getAttribute('href')||'/apps/'+p.slug+'/',treatment:p.card.dataset.treatment,label:p.card.querySelector('.lu-treatment-badge')?.textContent?.trim()||''}:null;
  const renderCard=(game,role,priority)=>{const article=document.createElement('article');article.className='lu-v3-result'+(priority?' is-priority':'');const row=document.createElement('div');row.className='lu-v3-role';row.innerHTML='<span>'+(role==='relief'?'今すぐ用':'体質改善用')+'</span><span class="lu-v3-priority">いま優先</span>';const type=document.createElement('span');type.className='lu-v3-app-type';type.textContent='APP TYPE：'+(game.label||game.treatment);const h=document.createElement('h3');h.textContent=game.title;const p=document.createElement('p');p.textContent=(role==='relief'?'いまの状態を少し動かすための1本。':'同じ場面で消耗しにくい自分を作るための1本。')+(game.description?' '+game.description:'');const a=document.createElement('a');a.href=game.href+(game.href.includes('?')?'&':'?')+'ref=diagnosis-v3&utm_source=levelup&utm_medium=diagnosis&utm_campaign=treatment_match&diagnosis='+encodeURIComponent(issueKey+':'+detailKey+':'+mode+':'+role);a.textContent='これをやる →';article.append(row,type,h,p,a);return article};
  document.querySelectorAll('[data-lu-v3-issue]').forEach(b=>b.onclick=()=>openIssue(b.dataset.luV3Issue));document.getElementById('lu-v3-close')?.addEventListener('click',()=>open(false));sheet?.addEventListener('click',e=>{if(e.target===sheet)open(false)});document.getElementById('lu-v3-back-top')?.addEventListener('click',()=>open(false));toMode?.addEventListener('click',()=>{if(detailKey)show('mode')});document.getElementById('lu-v3-back-detail')?.addEventListener('click',()=>show('detail'));
  document.querySelectorAll('[data-lu-v3-mode]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-lu-v3-mode]').forEach(n=>n.classList.remove('is-on'));b.classList.add('is-on');mode=b.dataset.luV3Mode;run.disabled=false});
  run?.addEventListener('click',()=>{const detail=CONFIG[issueKey]?.details?.[detailKey];if(!detail||!mode)return;const used=new Set();const relief=pick(detail.relief,'relief',used);if(relief)used.add(relief.slug);const rebuild=pick(detail.rebuild,'rebuild',used);const r1=meta(relief),r2=meta(rebuild);document.getElementById('lu-v3-result-heading').textContent='「'+detail.label+'」なら、この2方向。';document.getElementById('lu-v3-result-intro').textContent=mode==='relief'?'まず「今すぐ用」を優先。落ち着いたら体質改善へ。':mode==='rebuild'?'「体質改善用」を優先。同じ場面での反応そのものを鍛えます。':'今日は「今すぐ用」→「体質改善用」の順でつなげます。';const out=document.getElementById('lu-v3-results');out.innerHTML='';if(r1)out.appendChild(renderCard(r1,'relief',mode==='relief'||mode==='both'));if(r2)out.appendChild(renderCard(r2,'rebuild',mode==='rebuild'||mode==='both'));try{localStorage.setItem('hitobito-levelup-last-diagnosis-v3',JSON.stringify({issue:issueKey,detail:detailKey,mode,relief:r1?.slug||null,rebuild:r2?.slug||null,at:new Date().toISOString()}))}catch{};show('result')});
  document.getElementById('lu-v3-restart')?.addEventListener('click',()=>{open(false);setTimeout(()=>document.getElementById('levelup-state-diagnosis-v3')?.scrollIntoView({behavior:'smooth',block:'start'}),80)});
})();
</script>`;

let html=fs.readFileSync(homePath,'utf8');
if (!html.includes('data-treatment="')) throw new Error('LEVEL UP diagnosis v3 requires treatment attributes before injection.');
if (!html.includes('id="levelup-state-diagnosis-v3-style"')) { if(!html.includes('</head>')) throw new Error('LEVEL UP head missing.'); html=html.replace('</head>',`${style}\n</head>`); }
if (!html.includes('id="levelup-state-diagnosis-v3"')) {
  const anchor='<section class="lu-v2" id="levelup-state-diagnosis-v2">';
  if(!html.includes(anchor)) throw new Error('LEVEL UP diagnosis v2 anchor missing.');
  html=html.replace(anchor,`${markup}\n${anchor}`);
}
if (!html.includes(marker)) { if(!html.includes('</body>')) throw new Error('LEVEL UP body missing.'); html=html.replace('</body>',`${script}\n</body>`); }
fs.writeFileSync(homePath,html);

const finalHome=fs.readFileSync(homePath,'utf8');
for (const required of ['levelup-state-diagnosis-v3','今日は、どっちで使いたい？','今すぐラクになりたい','根っこから変えたい','両方ほしい','data-treatment="','#levelup-state-diagnosis-v2,.lu-v2-sheet{display:none!important}']) {
  if(!finalHome.includes(required)) throw new Error(`LEVEL UP diagnosis v3 missing: ${required}`);
}
console.log('[Firebase] LEVEL UP diagnosis v3 injected with relief / rebuild app attributes.');
