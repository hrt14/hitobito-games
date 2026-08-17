import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const manifestPath = path.join(outDir, 'manifest.json');
const brandAssetDir = path.join(root, 'assets', 'levelup');

if (!fs.existsSync(manifestPath)) {
  throw new Error('Firebase manifest not found. Run npm run build:hosting first.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const available = new Set(manifest.games.map((game) => game.slug));

const catalog = [
  {slug:'start',title:'START',kicker:'MBTI TO ACTION',skill:'着手 / 極小化',description:'MBTIを選び、自分に合う始め方で宿題を最初の一手まで小さくして、現実で動き出す。',icon:'GO',href:'/start',updateCount:1,special:true},
  {slug:'3sec-action',title:'3秒で動け',kicker:'THINK LESS, START SMALL',skill:'即着手',description:'3秒以内に「やる・捨てる・任せる」。考え込む前に動く反射を鍛える。',icon:'03',updateCount:1},
  {slug:'ato-5min',title:'あと5分',kicker:'BREAK IT DOWN',skill:'タスク分解',description:'巨大な仕事を最初の一手まで小さくし、動けるサイズへ分解する反射を鍛える。',icon:'05',updateCount:3},
  {slug:'one-thing',title:'一個だけやれ',kicker:'ONE THING UNTIL DONE',skill:'集中 / WIP制御',description:'通知や割り込みに触れず、選んだ一個を最後まで終える集中力を鍛える。',icon:'01',updateCount:3},
  {slug:'timecraft',title:'時間を使え。',kicker:"USE TIME, DON'T FILL IT",skill:'時間術 / 優先順位',description:'時間の使い方、優先順位、余白の作り方を予定づくりで反復する。',icon:'8H',updateCount:1},
  {slug:'100-turns',title:'死ぬまでに、あと100ターン',kicker:'TIME IS FINITE',skill:'有限性 / 選択',description:'残り100ターンの人生で何に時間を使うかを選び、有限な時間を体で覚える。',icon:'100',updateCount:1},
  {slug:'task-separation',title:'課題の分離',kicker:'WHOSE TASK IS THIS?',skill:'境界線 / 集中',description:'「これは誰の課題か？」を切り分け、自分の課題だけに集中する反射を鍛える。',icon:'↔',updateCount:2},
  {slug:'levelup-control',title:'変えられる？',kicker:'CONTROL WHAT YOU CAN',skill:'コントロール / 次の一手',description:'変えられることと変えられないことを素早く切り分け、次の一手へ進む。',icon:'◉',updateCount:1},
  {slug:'expect-nothing',title:'期待しない',kicker:'DROP THE SHOULD',skill:'期待を手放す',description:'相手や予定への「こうなるはず」を手放し、期待に振り回されない考え方を反復する。',icon:'0',updateCount:1},
  {slug:'dont-change-people',title:'人を変えるな',kicker:'CHANGE YOUR RESPONSE',skill:'対人調整 / 境界線',description:'相手を変えようとせず、自分の距離・頼み方・配置を変えて問題を解く。',icon:'人',updateCount:1},
  {slug:'help-me',title:'助けて',kicker:"DON'T CARRY IT ALONE",skill:'頼る / 委任',description:'仕事を一人で抱えず、人・AI・外注・上司へ適切に頼るほど物事が進む。',icon:'HELP',updateCount:1},
  {slug:'levelup-mood',title:'機嫌は自分で取る',kicker:'OWN YOUR STATE',skill:'感情調整',description:'外部の出来事に任せず、自分で自分の機嫌を整える選択肢を増やしていく。',icon:'☺',updateCount:1},
  {slug:'mou-owatta',title:'もう終わった',kicker:'END THE LOOP',skill:'切り替え / 反芻停止',description:'終わった出来事を反芻せず、事実と次に変えられることだけ拾って思考を終了する。',icon:'END',updateCount:1},
  {slug:'name-it',title:'名前をつけろ',kicker:'NAME THE FEELING',skill:'感情認識',description:'いま感じている感情に名前をつけ、ぼんやり抱えず認識する反射を鍛える。',icon:'Aa',updateCount:1},
  {slug:'viewpoint-exam',title:'物の見方検定',kicker:'FIND ANOTHER VIEW',skill:'視点転換',description:'嫌な出来事にも別の見方を何通りも作り、視点を切り替える型を反復する。',icon:'↻',updateCount:1},
  {slug:'jinsei-title',title:'人生にタイトルをつけろ',kicker:'EDIT THE STORY',skill:'意味づけ / 編集',description:'同じ出来事でもタイトルを変えると意味が変わる。人生の出来事を編集する力を鍛える。',icon:'T',updateCount:1},
  {slug:'meaning-map',title:'意味マップ',kicker:'CONNECT WHAT YOU DO',skill:'意味づけ / 目的',description:'仕事や日常を「一貫性・目的・重要感」の3方向へつなぎ、意味を見つける型を鍛える。',icon:'⌘',updateCount:1},
  {slug:'main-character',title:'主人公で行け。',kicker:'LIVE YOUR STORY',skill:'自己決定',description:'周囲の「普通」ではなく、自分が人生の主人公ならどう動くかを選び続ける。',icon:'★',updateCount:1},
  {slug:'arigatou-sagashi',title:'ありがとう探し',kicker:'NOTICE WHAT SUPPORTS YOU',skill:'感謝 / 観察',description:'何気ない日常を支えているものを次々に見つけ、感謝を観察ゲームとして鍛える。',icon:'＋',updateCount:1},
  {slug:'levelup-smalltalk',title:'雑談力アップ',kicker:'KEEP THE TALK MOVING',skill:'雑談 / 会話',description:'雑談の返し・広げ方・質問を反復し、自然に会話を続けるパターンを身につける。',icon:'…',updateCount:1},
  {slug:'watashi-zukan',title:'わたし図鑑',kicker:'KNOW YOUR CHOICES',skill:'自己理解',description:'ゲーム中の意思決定から、安定と挑戦・一人と仲間・お金と時間など自分の選び方を知る。',icon:'私',updateCount:19},
  {slug:'maa-iika',title:'まあ、いいか。',kicker:'ACCEPT, THEN MOVE',skill:'受容 / 切り替え',description:'予定外に抵抗し続けず、「そうなったか」と受け取り、次へ進む反射を鍛える。',icon:'→',href:'/maa-iika',updateCount:1,special:true},
  {slug:'self-management',title:'自分を回せ。',kicker:'SELF MANAGEMENT TRAINING',skill:'自己管理 / WIP制御',description:'体力、集中、ストレス、脳内WIPを見て、その瞬間に最適な一手を選ぶ。',icon:'WIP',href:'/self-management',updateCount:1,special:true},
];

for (const game of catalog) {
  if (!game.special && !available.has(game.slug)) throw new Error(`Curated LEVEL UP game is missing from Firebase bundle: ${game.slug}`);
  if (!game.href) game.href = `/apps/${encodeURIComponent(game.slug)}/`;
}

const games = [...catalog].sort((a,b)=> b.updateCount !== a.updateCount ? b.updateCount-a.updateCount : catalog.indexOf(a)-catalog.indexOf(b));

const iconFiles = ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
for (const file of iconFiles) {
  const source = path.join(brandAssetDir, file);
  if (!fs.existsSync(source)) throw new Error(`LEVEL UP icon asset is missing: ${file}`);
  fs.copyFileSync(source, path.join(outDir, file));
}

fs.writeFileSync(path.join(outDir, 'site.webmanifest'), JSON.stringify({
  name: 'hitobito LEVEL UP',
  short_name: 'LEVEL UP',
  description: '遊んで、生きる力を鍛える。',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#090b08',
  theme_color: '#d8ff5b',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2) + '\n');

fs.writeFileSync(path.join(outDir,'levelup-catalog.json'),JSON.stringify({version:1,games:games.map(({special,...game})=>game)},null,2)+'\n');

function escapeHtml(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}

const cards = games.map((game,index)=>`
  <article class="card" data-game="${escapeHtml(game.slug)}">
    <button class="favorite" type="button" data-favorite="${escapeHtml(game.slug)}" aria-pressed="false" aria-label="${escapeHtml(game.title)}をお気に入りに追加">♡</button>
    <a class="card-link" href="${escapeHtml(game.href)}">
      <div class="card-top"><span class="number">${String(index+1).padStart(2,'0')}</span><span class="updates">UPDATE ${game.updateCount}</span></div>
      <div class="icon">${escapeHtml(game.icon)}</div>
      <div class="kicker">${escapeHtml(game.kicker)}</div>
      <div class="skill">${escapeHtml(game.skill)}</div>
      <h2>${escapeHtml(game.title)}</h2>
      <p>${escapeHtml(game.description)}</p>
      <div class="play">PLAY <span>↗</span></div>
    </a>
  </article>`).join('\n');

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#0a0d08" />
  <meta name="description" content="遊ぶだけで、考え方の癖を鍛える。hitobito LEVEL UP。" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="LEVEL UP" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
  <link rel="manifest" href="/site.webmanifest" />
  <title>LEVEL UP | hitobito</title>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;color:#f6f8f1;background:#090b08;--lime:#d8ff5b;--muted:#aab09f;--line:rgba(216,255,91,.17)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 90% -10%,rgba(216,255,91,.12),transparent 32%),#090b08;color:#f6f8f1;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}
    .shell{width:min(1160px,calc(100% - 28px));margin:auto;padding:18px 0 72px}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding:8px 0 18px}.brand{font-size:11px;font-weight:950;letter-spacing:.18em}.top a{font-size:10px;color:var(--muted);border:1px solid var(--line);padding:8px 11px;border-radius:999px}
    .hero{padding:58px 0 44px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);gap:34px;align-items:end}.hero-kicker{font-size:10px;font-weight:950;letter-spacing:.18em;color:var(--lime);margin-bottom:15px}.hero h1{font-size:clamp(64px,11vw,130px);line-height:.78;letter-spacing:-.075em;margin:0;font-weight:950}.hero h1 span{color:var(--lime)}.hero-copy{font-size:14px;line-height:1.9;color:#bbc1b0;margin:0}.stats{display:flex;gap:24px;margin-top:22px}.stats strong{display:block;font-size:28px}.stats span{font-size:9px;letter-spacing:.12em;color:#7f8777;font-weight:900}
    .intro{border:1px solid var(--line);border-radius:22px;padding:18px 20px;margin-bottom:34px;background:rgba(216,255,91,.035);font-size:12px;line-height:1.8;color:#b8bfac}.intro strong{color:#f7f9f2}
    .section-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:13px}.section-head h2{font-size:11px;letter-spacing:.18em;margin:0;text-transform:uppercase}.section-head span{font-size:10px;color:#798071}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{position:relative;overflow:hidden;min-height:280px;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:linear-gradient(150deg,#151a12,#0d100c);transition:.18s transform,.18s border-color}.card:before{content:'';position:absolute;width:180px;height:180px;border-radius:50%;right:-80px;top:-95px;background:rgba(216,255,91,.055);pointer-events:none}.card:hover{transform:translateY(-3px);border-color:rgba(216,255,91,.35)}.card.is-favorite{border-color:rgba(216,255,91,.52);box-shadow:0 0 0 1px rgba(216,255,91,.08) inset}.card-link{display:flex;flex-direction:column;min-height:280px;height:100%;padding:17px}.card-top{display:flex;justify-content:space-between;align-items:center;padding-right:42px;position:relative;z-index:1}.number{font-size:9px;font-weight:950;color:#747c6e;letter-spacing:.12em}.updates{font-size:9px;font-weight:950;color:#10140c;background:var(--lime);padding:5px 7px;border-radius:999px}.favorite{position:absolute;z-index:4;right:14px;top:13px;width:34px;height:34px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:#10140d;color:#b9c0af;font-size:20px;line-height:1;display:grid;place-items:center;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}.favorite:active{transform:scale(.92)}.favorite.is-on{color:var(--lime);border-color:rgba(216,255,91,.45);background:rgba(216,255,91,.1)}.icon{font-size:24px;font-weight:950;color:var(--lime);margin-top:24px;min-height:29px}.kicker{font-size:8px;letter-spacing:.14em;color:#737b6d;font-weight:950;margin-top:5px}.skill{margin-top:8px;font-size:9px;color:#8e9785;font-weight:900;letter-spacing:.12em}.card h2{font-size:28px;line-height:1.05;letter-spacing:-.045em;margin:10px 0 9px}.card p{font-size:11px;line-height:1.7;color:#aeb5a5;margin:0 0 18px}.play{margin-top:auto;font-size:10px;font-weight:950;letter-spacing:.12em;color:var(--lime)}.play span{font-size:16px;margin-left:4px}.footer{margin-top:50px;border-top:1px solid var(--line);padding-top:20px;color:#747c6e;font-size:10px;display:flex;justify-content:space-between;gap:18px}
    @media(max-width:900px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:600px){.shell{width:min(100% - 20px,1160px);padding-top:10px}.hero{padding:38px 0 30px;gap:20px}.hero h1{font-size:clamp(64px,22vw,94px)}.hero-copy{font-size:13px}.grid{grid-template-columns:1fr}.card,.card-link{min-height:230px}.footer{flex-direction:column}.favorite{width:38px;height:38px;font-size:22px}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="top"><div class="brand">HITOBITO / LEVEL UP</div><a href="https://games.hitobito.jp/">GAMES ↗</a></header>
    <section class="hero"><div><div class="hero-kicker">PLAY. REPEAT. CHANGE.</div><h1>LEVEL<br><span>UP.</span></h1></div><div><p class="hero-copy">考え方、行動、切り替え、自己理解。知識を読むだけでなく、ゲームとして何度も判断して、日常で使える思考の癖にする。</p><div class="stats"><div><strong>${games.length}</strong><span>TRAINING GAMES</span></div><div><strong>0</strong><span>API COST</span></div></div></div></section>
    <div class="intro"><strong>元のLEVEL UPカタログをそのまま維持。</strong> ホスティングを変えても、ゲームの選び方や中身は勝手に変えません。</div>
    <section><div class="section-head"><h2>Training Games</h2><span>${games.length} games</span></div><div class="grid">${cards}</div></section>
    <footer class="footer"><strong>hitobito LEVEL UP</strong><span>遊んで、生きる力を鍛える。</span></footer>
  </main>
  <script>
    (()=>{
      const KEY='hitobito-levelup-favorites-v1';
      let favorites=new Set();
      try{favorites=new Set(JSON.parse(localStorage.getItem(KEY)||'[]'));}catch{}
      const render=(button)=>{
        const slug=button.dataset.favorite;
        const on=favorites.has(slug);
        button.classList.toggle('is-on',on);
        button.closest('.card')?.classList.toggle('is-favorite',on);
        button.textContent=on?'♥':'♡';
        button.setAttribute('aria-pressed',String(on));
        const title=button.closest('.card')?.querySelector('h2')?.textContent||slug;
        button.setAttribute('aria-label',title+(on?'をお気に入りから外す':'をお気に入りに追加'));
      };
      document.querySelectorAll('[data-favorite]').forEach(button=>{
        render(button);
        button.addEventListener('click',()=>{
          const slug=button.dataset.favorite;
          favorites.has(slug)?favorites.delete(slug):favorites.add(slug);
          localStorage.setItem(KEY,JSON.stringify([...favorites]));
          render(button);
        });
      });
    })();
  </script>
</body>
</html>\n`;

fs.writeFileSync(path.join(outDir,'index.html'),html);
console.log(`[Firebase] Curated LEVEL UP home generated: ${games.length} games + favorites`);
