import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'..','..');
const file=path.join(root,'.dist','firebase','index.html');
const catalogPath=path.join(root,'.dist','firebase','levelup-catalog.json');
if(!fs.existsSync(file)||!fs.existsSync(catalogPath))throw new Error('LEVEL UP home/catalog missing');

const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const gameCount=Array.isArray(catalog.games)?catalog.games.length:0;
let h=fs.readFileSync(file,'utf8');

const hero=`<section class="hero lu-home-hero">
  <div class="lu-home-eyebrow">THINKING GAMES, MADE BY HITOBITO</div>
  <h1>悩んだら、遊べ。<br><span>思考を鍛える。</span></h1>
  <p class="hero-copy">読むだけの自己啓発じゃない。選んで、間違えて、繰り返して、日常で使える反射をつくる。</p>
  <div class="lu-home-stats"><div><strong>${gameCount}</strong><span>TRAINING GAMES</span></div><div><strong>0</strong><span>INSTALLS NEEDED</span></div></div>
  <p class="lu-home-note">スマホでもPCでも、そのまま始められます。</p>
</section>`;

if(!/<section class="hero(?: [^"]*)?">[\s\S]*?<\/section>/.test(h))throw new Error('hero missing');
h=h.replace(/<section class="hero(?: [^"]*)?">[\s\S]*?<\/section>/,hero).replace('<h2>Training Games</h2>','<h2>すべてのトレーニング</h2>');

const diagnosis=h.match(/<section class="lu-v3" id="levelup-state-diagnosis-v3">[\s\S]*?<\/section>/)?.[0];
const searchAnchor='<section class="levelup-search" id="levelup-search"';
if(!diagnosis||!h.includes(searchAnchor))throw new Error('diagnosis/search missing');
h=h.replace(diagnosis,'').replace(searchAnchor,diagnosis+'\n'+searchAnchor);

const styleId='lu-home-redesign-v1';
if(!h.includes(`id="${styleId}"`)){
const css=`<style id="${styleId}">
:root{color-scheme:light!important;--lu-paper:#f2f0ea;--lu-ink:#11110f;--lu-muted:#686861;--lu-line:#d7d4cc;--lu-red:#ff4e42;--lu-card:#171715}
html{background:var(--lu-paper)!important}
body{background:var(--lu-paper)!important;color:var(--lu-ink)!important}
body:before{display:none!important}
a{color:inherit}
.shell{width:min(1120px,calc(100% - 34px))!important;padding-top:18px!important;padding-bottom:90px!important}
.top{min-height:64px!important;padding:8px 0 18px!important;border-bottom:1px solid #cfcdc5!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.brand{color:var(--lu-ink)!important;font-size:12px!important;letter-spacing:.18em!important;font-weight:950!important}
.top a,#levelup-account-chip{color:var(--lu-ink)!important;border:1px solid #cecbc2!important;background:rgba(255,255,255,.42)!important;box-shadow:none!important;font-weight:900!important}
#levelup-nav-fixed{position:absolute!important;top:max(14px,env(safe-area-inset-top))!important;left:max(14px,env(safe-area-inset-left))!important}
#levelup-nav-toggle{width:44px!important;height:44px!important;border:1px solid #cbc8bf!important;border-radius:15px!important;background:#fbfaf6!important;color:#111!important;box-shadow:0 6px 18px rgba(20,20,16,.07)!important}
#levelup-nav-toggle svg{color:#111!important;stroke:#111!important}

.lu-home-hero{display:block!important;padding:66px 0 54px!important}
.lu-home-eyebrow{margin-bottom:24px;color:#171713;font-size:12px;font-weight:950;letter-spacing:.23em}
.lu-home-hero h1{margin:0!important;max-width:1040px!important;color:#0c0c0b!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif!important;font-size:clamp(64px,9.5vw,118px)!important;font-weight:950!important;line-height:.88!important;letter-spacing:-.075em!important;text-shadow:none!important}
.lu-home-hero h1 span{color:var(--lu-red)!important}
.lu-home-hero .hero-copy{display:block!important;max-width:770px!important;margin:34px 0 0!important;color:#5d5d57!important;font-size:17px!important;font-weight:750!important;line-height:1.8!important}
.lu-home-stats{display:flex;gap:76px;margin-top:44px}
.lu-home-stats div{min-width:160px}.lu-home-stats strong{display:block;color:#111!important;font-size:50px;line-height:1;font-weight:950;letter-spacing:-.05em}.lu-home-stats span{display:block;margin-top:8px;color:#696962;font-size:11px;font-weight:950;letter-spacing:.16em}.lu-home-note{margin:28px 0 0;color:#85847d;font-size:12px;font-weight:800}

.lu-v3{margin:8px 0 26px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#111!important;box-shadow:none!important;overflow:visible!important}
.lu-v3-kicker{margin:0 0 10px!important;color:#71716a!important;font-size:10px!important;letter-spacing:.18em!important}
.lu-v3 h2{margin:0 0 8px!important;color:#111!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif!important;font-size:clamp(38px,5.2vw,62px)!important;font-weight:950!important;line-height:.95!important;letter-spacing:-.055em!important}
.lu-v3-lead{margin:0 0 18px!important;max-width:720px!important;color:#6c6b65!important;font-size:13px!important;font-weight:700!important;line-height:1.7!important}
.lu-v3-problems{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
.lu-v3-problem{position:relative!important;min-height:112px!important;padding:22px 24px!important;border:0!important;border-radius:26px!important;background:#151514!important;color:white!important;box-shadow:none!important;font-size:20px!important;font-weight:950!important;line-height:1.24!important;letter-spacing:-.02em!important}
.lu-v3-problem:nth-child(3n+2){background:#551126!important}.lu-v3-problem:nth-child(3n){background:#23480d!important}
.lu-v3-problem b{color:white!important;font-size:31px!important;font-weight:500!important}
.lu-v3-problem:hover{transform:translateY(-2px)!important}

.levelup-search{display:grid!important;grid-template-columns:220px minmax(0,1fr)!important;gap:18px!important;align-items:center!important;margin:38px 0 38px!important;padding:14px!important;border:1px solid #d4d1c8!important;border-radius:22px!important;background:rgba(255,255,255,.38)!important;box-shadow:none!important}
.levelup-search-copy{display:block!important}.levelup-search-kicker,.levelup-search p{display:none!important}.levelup-search h2{margin:0!important;color:#252520!important;font-size:13px!important;font-weight:950!important;letter-spacing:.03em!important}
.levelup-search-box{min-height:54px!important;border-color:#cbc8bf!important;border-radius:17px!important;background:#fffef9!important;box-shadow:none!important}
#levelup-search-input{height:54px!important;color:#111!important;background:transparent!important;font-size:16px!important}
#levelup-search-input::placeholder{color:#9a9991!important}
.levelup-search-icon{color:#111!important}.levelup-search-status{color:#77766f!important}

.section-head{margin:54px 0 17px!important;align-items:center!important}.section-head h2,.section-head strong{color:#111!important;font-size:18px!important;font-weight:950!important;letter-spacing:.16em!important;text-transform:uppercase!important}.section-head span{color:#77766f!important;font-size:12px!important;font-weight:800!important}
.grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important}
.catalog-divider{grid-column:1/-1!important;margin:18px 0 0!important;padding:0 1px 10px!important;border-bottom:1px solid #d7d4cb!important;background:none!important}
.catalog-divider strong{color:#171713!important;font-size:13px!important;font-weight:950!important;letter-spacing:.12em!important}.catalog-divider span{color:#77766f!important;border-color:#d3d0c7!important;background:rgba(255,255,255,.4)!important}
.catalog-divider[data-kind="favorite"] strong,.catalog-divider[data-kind="new"] strong,.catalog-divider[data-kind="popular"] strong{color:#e13f35!important}

.premium-book-card,.premium-book-card.title-long,.premium-book-card.title-xlong{--lu-card-bg:#171715!important;position:relative!important;min-height:238px!important;border:0!important;border-radius:28px!important;background:var(--lu-card-bg)!important;box-shadow:none!important;overflow:hidden!important}
.premium-theme-1,.premium-theme-4,.premium-theme-7{--lu-card-bg:#171715!important}.premium-theme-2,.premium-theme-5,.premium-theme-8{--lu-card-bg:#551126!important}.premium-theme-3,.premium-theme-6{--lu-card-bg:#23480d!important}
.premium-book-card:before{display:none!important}.premium-book-card:after{display:none!important}
.premium-book-card:hover{transform:translateY(-3px)!important;box-shadow:0 16px 32px rgba(32,28,22,.12)!important}
.premium-book-card .card-link,.premium-book-card.title-long .card-link,.premium-book-card.title-xlong .card-link{min-height:238px!important;padding:25px 26px 22px!important}
.premium-book-card .icon,.premium-book-card .card-top,.premium-book-card .kicker,.premium-book-card .skill,.premium-book-card .card-values,.premium-book-card .play,.premium-book-card .lu-treatment-badge,.premium-book-card .card-link>p:not(.book-obi){display:none!important}
.premium-book-card h2,.premium-book-card.title-long h2,.premium-book-card.title-xlong h2{display:block!important;margin:44px 34px 18px 8px!important;color:#fff!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif!important;font-size:clamp(24px,2.4vw,34px)!important;font-weight:950!important;line-height:1.12!important;letter-spacing:-.045em!important;text-shadow:none!important;overflow:visible!important;-webkit-line-clamp:unset!important}
.premium-book-card.title-xlong h2{font-size:clamp(21px,2vw,29px)!important;line-height:1.2!important}
.premium-book-card .book-obi{display:block!important;margin:auto 6px 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:rgba(255,255,255,.73)!important;font-size:13px!important;font-weight:760!important;line-height:1.6!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.premium-book-card .book-obi:before{content:""!important;margin:0!important}
.premium-book-card .favorite{width:42px!important;height:42px!important;right:15px!important;top:15px!important;border:1px solid rgba(255,255,255,.25)!important;background:rgba(255,255,255,.08)!important;color:#fff!important;box-shadow:none!important}
.premium-book-card .favorite.is-on,.premium-book-card .favorite[aria-pressed="true"]{color:#fff36a!important;border-color:rgba(255,243,106,.7)!important;background:rgba(255,243,106,.12)!important}
.footer{margin-top:60px!important;border-color:#d3d0c7!important;color:#77766f!important}.footer strong{color:#171713!important}

.lu-v3-sheet{background:rgba(30,29,25,.42)!important}.lu-v3-panel{border:1px solid #d2cfc5!important;background:#f7f5ef!important;color:#111!important;box-shadow:0 28px 80px rgba(34,31,24,.22)!important}.lu-v3-top strong,.lu-v3-question{color:#111!important}.lu-v3-close{border-color:#d1cec5!important;background:white!important;color:#111!important}.lu-v3-option{border-color:#d8d4ca!important;background:white!important;color:#222!important}.lu-v3-option small{color:#77766f!important}.lu-v3-option.is-on{border-color:#ff4e42!important;background:#fff0ed!important;color:#bf2e25!important}.lu-v3-option.is-on small{color:#86534d!important}.lu-v3-primary{background:#ff4e42!important;color:white!important}.lu-v3-secondary{border-color:#cbc8be!important;background:#fff!important;color:#222!important}.lu-v3-result{border-color:#d8d4ca!important;background:white!important;color:#111!important}.lu-v3-result h3{color:#111!important}.lu-v3-result p{color:#6b6a63!important}.lu-v3-result a{background:#171715!important;color:white!important}.lu-v3-result.is-priority{border-color:#ff4e42!important}.lu-v3-role{color:#d9382e!important}.lu-v3-priority{background:#ff4e42!important;color:white!important}.lu-v3-result-intro{background:#eeeae0!important;color:#5e5d57!important}

@media(max-width:900px){.lu-v3-problems{grid-template-columns:1fr 1fr!important}.grid{grid-template-columns:1fr 1fr!important}}
@media(max-width:650px){
  .shell{width:min(100% - 24px,1120px)!important;padding-top:12px!important}
  .top{min-height:74px!important;padding-left:98px!important;padding-bottom:18px!important}
  #levelup-nav-fixed{top:max(12px,env(safe-area-inset-top))!important;left:max(12px,env(safe-area-inset-left))!important}
  #levelup-nav-toggle{width:46px!important;height:46px!important;border-radius:16px!important}
  .brand{font-size:10px!important;white-space:nowrap!important}
  .lu-home-hero{padding:52px 0 42px!important}.lu-home-eyebrow{font-size:10px!important;line-height:1.4!important;margin-bottom:20px!important}.lu-home-hero h1{font-size:clamp(56px,16vw,78px)!important;line-height:.91!important}.lu-home-hero .hero-copy{margin-top:26px!important;font-size:15px!important;line-height:1.75!important}.lu-home-stats{gap:44px!important;margin-top:36px!important}.lu-home-stats div{min-width:0!important}.lu-home-stats strong{font-size:42px!important}.lu-home-stats span{font-size:9px!important}.lu-home-note{font-size:12px!important;margin-top:24px!important}
  .lu-v3{margin-top:8px!important}.lu-v3 h2{font-size:40px!important}.lu-v3-lead{font-size:12px!important}.lu-v3-problems{grid-template-columns:1fr!important;gap:10px!important}.lu-v3-problem{min-height:96px!important;padding:19px 21px!important;border-radius:24px!important;font-size:18px!important}
  .levelup-search{grid-template-columns:1fr!important;gap:8px!important;margin:30px 0 34px!important;padding:12px!important;border-radius:20px!important}.levelup-search h2{font-size:12px!important}.levelup-search-box{min-height:50px!important}#levelup-search-input{height:50px!important}
  .section-head{margin-top:42px!important}.section-head h2,.section-head strong{font-size:16px!important;letter-spacing:.12em!important}.section-head span{font-size:10px!important}
  .grid{grid-template-columns:1fr!important;gap:12px!important}.premium-book-card,.premium-book-card.title-long,.premium-book-card.title-xlong,.premium-book-card .card-link,.premium-book-card.title-long .card-link,.premium-book-card.title-xlong .card-link{min-height:218px!important}.premium-book-card,.premium-book-card.title-long,.premium-book-card.title-xlong{border-radius:24px!important}.premium-book-card .card-link,.premium-book-card.title-long .card-link,.premium-book-card.title-xlong .card-link{padding:21px 21px 19px!important}.premium-book-card h2,.premium-book-card.title-long h2,.premium-book-card.title-xlong h2{margin:40px 35px 18px 6px!important;font-size:27px!important;line-height:1.13!important}.premium-book-card.title-xlong h2{font-size:23px!important;line-height:1.2!important}.premium-book-card .book-obi{margin-left:6px!important;font-size:13px!important}.premium-book-card .favorite{width:40px!important;height:40px!important;right:13px!important;top:13px!important}
}
@media(max-width:370px){.lu-home-hero h1{font-size:52px!important}.lu-home-stats{gap:28px!important}.premium-book-card h2,.premium-book-card.title-long h2{font-size:24px!important}.premium-book-card.title-xlong h2{font-size:21px!important}}
</style>`;
h=h.replace('</head>',css+'\n</head>');
}

fs.writeFileSync(file,h);
const out=fs.readFileSync(file,'utf8');
for(const x of [`id="${styleId}"`,'悩んだら、遊べ。','思考を鍛える。','TRAINING GAMES','INSTALLS NEEDED','すべてのトレーニング'])if(!out.includes(x))throw new Error('redesign missing '+x);
if(!(out.indexOf('lu-home-hero')<out.indexOf('id="levelup-state-diagnosis-v3"')&&out.indexOf('id="levelup-state-diagnosis-v3"')<out.indexOf('id="levelup-search"')))throw new Error('home order invalid');
console.log(`[Firebase] LEVEL UP PLAY-style light home injected: ${gameCount} games.`);
