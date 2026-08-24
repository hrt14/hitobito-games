import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');

if (!fs.existsSync(homePath)) {
  throw new Error('Firebase LEVEL UP home not found. Run build:firebase after the home is generated.');
}

// Every LEVEL UP card must explain three things at a glance:
// who it is for, what it trains, and the concrete benefit.
// Existing games are explicitly isNew:false. New entries are NEW by default;
// switch isNew to false when they should return to the normal catalog order.
const cardValueMeta = {
  'start': { isNew:false, forWhom:'宿題や課題を先送りしがちな人', purpose:'自分に合う「最初の一手」を見つける', benefit:'やることが小さくなり、動き出しやすくなる' },
  '3sec-action': { isNew:false, forWhom:'考えすぎて着手が遅くなる人', purpose:'迷う前に小さく判断して動く練習', benefit:'先延ばしを減らし、すぐ一歩を出しやすくなる' },
  'ato-5min': { isNew:false, forWhom:'大きな仕事を見ると重く感じる人', purpose:'仕事を「今できるサイズ」まで分解する', benefit:'圧倒されにくくなり、着手しやすくなる' },
  'one-thing': { isNew:false, forWhom:'同時進行が増えて何も終わらない人', purpose:'一度に一個へ集中する反射を鍛える', benefit:'脳内WIPを減らし、完了を増やしやすくなる' },
  'timecraft': { isNew:false, forWhom:'忙しいのに大事なことが進まない人', purpose:'優先順位と余白を含めて時間を配る', benefit:'重要なことへ時間を使いやすくなる' },
  '100-turns': { isNew:false, forWhom:'なんとなく時間を使ってしまう人', purpose:'人生の時間が有限だと体感して選ぶ', benefit:'本当に大事なことの優先順位が見えやすくなる' },
  'task-separation': { isNew:false, forWhom:'他人の反応や問題まで背負ってしまう人', purpose:'「誰の課題か」を素早く切り分ける', benefit:'自分が動けることへ集中しやすくなる' },
  'levelup-control': { isNew:false, forWhom:'変えられないことで消耗しやすい人', purpose:'変えられること／変えられないことを分ける', benefit:'悩む時間を減らし、次の一手へ移りやすくなる' },
  'expect-nothing': { isNew:false, forWhom:'相手や予定への期待で疲れやすい人', purpose:'「こうなるはず」という期待を手放す', benefit:'予定外や他人の反応に振り回されにくくなる' },
  'dont-change-people': { isNew:false, forWhom:'相手を変えようとして疲れてしまう人', purpose:'相手ではなく自分の対応を変える', benefit:'対人ストレスを減らし、現実的な一手を選びやすくなる' },
  'help-me': { isNew:false, forWhom:'仕事や問題を一人で抱え込みやすい人', purpose:'頼る・任せる・助けを求める練習', benefit:'抱える量を減らし、物事を前に進めやすくなる' },
  'levelup-mood': { isNew:false, forWhom:'周囲の出来事で気分が崩れやすい人', purpose:'自分で状態を整える選択肢を増やす', benefit:'嫌なことの後でも切り替えやすくなる' },
  'mou-owatta': { isNew:false, forWhom:'終わったことを何度も考えてしまう人', purpose:'反芻を止め、今できることへ戻る', benefit:'過去に取られる注意を減らし、次へ進みやすくなる' },
  'name-it': { isNew:false, forWhom:'モヤモヤの正体が分からない人', purpose:'いまの感情に具体的な名前をつける', benefit:'感情に飲まれず、対応を選びやすくなる' },
  'viewpoint-exam': { isNew:false, forWhom:'嫌な出来事を一つの見方で抱え込みやすい人', purpose:'別の見方を複数つくる練習', benefit:'出来事を柔らかく捉え直しやすくなる' },
  'jinsei-title': { isNew:false, forWhom:'出来事を悪い物語として固定しやすい人', purpose:'出来事の「タイトル」を変えて編集する', benefit:'同じ事実にも別の意味を見つけやすくなる' },
  'meaning-map': { isNew:false, forWhom:'仕事や日常に「意味ある？」と感じる人', purpose:'行動を一貫性・目的・重要感につなげる', benefit:'やる理由が見え、納得して動きやすくなる' },
  'main-character': { isNew:false, forWhom:'周囲の正解を優先しすぎる人', purpose:'自分が主人公ならどう選ぶかを反復する', benefit:'自分の基準で意思決定しやすくなる' },
  'arigatou-sagashi': { isNew:false, forWhom:'足りないものばかり目につきやすい人', purpose:'日常を支えるものを意識して見つける', benefit:'すでにある良いものへ注意を向けやすくなる' },
  'levelup-smalltalk': { isNew:false, forWhom:'雑談で次の一言に困りやすい人', purpose:'返し・質問・話の広げ方を反復する', benefit:'会話を自然に続けやすくなる' },
  'watashi-zukan': { isNew:false, forWhom:'自分が何を大切にする人か知りたい人', purpose:'実際の選択から自分の判断パターンを知る', benefit:'自分に合う選択や働き方を考えやすくなる' },
  'maa-iika': { isNew:false, forWhom:'予定外のことに抵抗して消耗しやすい人', purpose:'現実を受け取り、次へ進む反射を鍛える', benefit:'崩れた後の立て直しが早くなりやすい' },
  'self-management': { isNew:false, forWhom:'疲労や仕事量で自分を回せなくなる人', purpose:'体力・集中・WIPから次の一手を選ぶ', benefit:'無理を増やさず、継続して動きやすくなる' },

  // Current new releases. New metadata entries are treated as NEW unless isNew:false is set.
  'seikan-switch': { forWhom:'嫌な出来事に気持ちを引っ張られやすい人', purpose:'受容・感謝・言葉から次の見方を選ぶ', benefit:'出来事への反応を切り替え、次へ進みやすくなる' },
  'meeting-respawn': { forWhom:'会議のあとにぐったりして仕事へ戻れない人', purpose:'状態を整え、次の仕事を30秒の一手まで縮める', benefit:'会議後の空白を短くし、仕事へ復帰しやすくなる' },
  'extra-load': { forWhom:'仕事や人間関係を必要以上に頭の中へ抱えて消耗しやすい人', purpose:'余計に疲れを増やす思考を見抜き、必要な分だけ考える', benefit:'「全部」を背負わず、今必要な一手へ戻りやすくなる' },
  '100oku-connection': { forWhom:'目の前の出会いや小さな会話を「今は関係ない」と切りがちな人', purpose:'限られた注意の中で、価値がまだ見えない接点を細く残す判断を練習する', benefit:'全部に深く関わらずに、未来の機会へ戻れる選択肢を残しやすくなる' },
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let html = fs.readFileSync(homePath, 'utf8');
const cardSlugs = [...html.matchAll(/<article class="card" data-game="([^"]+)"/g)].map((match) => match[1]);
const missingMeta = cardSlugs.filter((slug) => !cardValueMeta[slug]);
if (missingMeta.length) {
  throw new Error(`LEVEL UP card value metadata missing: ${missingMeta.join(', ')}`);
}

for (const slug of cardSlugs) {
  const meta = cardValueMeta[slug];
  const isNew = meta.isNew !== false;
  const values = `
      <div class="card-values" aria-label="このゲームの対象・目的・ベネフィット">
        <div class="card-value"><span class="card-value-label">こんな人に</span><span class="card-value-text">${escapeHtml(meta.forWhom)}</span></div>
        <div class="card-value"><span class="card-value-label">なんのため</span><span class="card-value-text">${escapeHtml(meta.purpose)}</span></div>
        <div class="card-value"><span class="card-value-label">ベネフィット</span><span class="card-value-text">${escapeHtml(meta.benefit)}</span></div>
      </div>`;

  const slugPattern = escapeRegExp(slug);
  const cardPattern = new RegExp(`(<article class="card" data-game="${slugPattern}"[\\s\\S]*?<h2>[\\s\\S]*?<\\/h2>)\\s*<p>[\\s\\S]*?<\\/p>([\\s\\S]*?<\\/article>)`);
  if (!cardPattern.test(html)) throw new Error(`LEVEL UP card markup not found for value injection: ${slug}`);
  html = html.replace(cardPattern, `$1${values}$2`);

  if (isNew) {
    html = html.replace(
      new RegExp(`<article class="card" data-game="${slugPattern}"`),
      `<article class="card is-new" data-game="${slug}" data-new="true"`,
    );
    const newBadgePattern = new RegExp(`(<article class="card is-new" data-game="${slugPattern}"[\\s\\S]*?<span class="number">)[\\s\\S]*?(<\\/span>)`);
    html = html.replace(newBadgePattern, '$1NEW$2');
  }
}

const styleMarker = 'id="levelup-card-value-style"';
if (!html.includes(styleMarker)) {
  const style = `
<style id="levelup-card-value-style">
  .card,.card-link{min-height:350px}
  .card-values{display:grid;gap:7px;margin:0 0 18px}
  .card-value{display:grid;grid-template-columns:72px minmax(0,1fr);gap:8px;align-items:start;border-top:1px solid rgba(255,255,255,.075);padding-top:7px}
  .card-value-label{font-size:8px;line-height:1.5;font-weight:950;letter-spacing:.06em;color:#7f8777;white-space:nowrap}
  .card-value-text{font-size:10.5px;line-height:1.5;color:#c3cab9;font-weight:700}
  .card.is-new{border-color:rgba(216,255,91,.34);box-shadow:0 0 0 1px rgba(216,255,91,.055) inset}
  .card.is-new .number{color:var(--lime)}
  @media(max-width:600px){.card,.card-link{min-height:330px}.card-value{grid-template-columns:70px minmax(0,1fr)}.card-value-text{font-size:11px}}
</style>
`;
  if (html.includes('</head>')) html = html.replace('</head>', `${style}</head>`);
  else throw new Error('LEVEL UP head not found for card value styles.');
}

const marker = 'id="levelup-favorite-sort"';
if (!html.includes(marker)) {
  const snippet = `
<script id="levelup-favorite-sort">
  (() => {
    const grid = document.querySelector('.grid');
    if (!grid) return;

    const cards = [...grid.querySelectorAll('.card')];
    const sortCards = () => {
      const favorites = [];
      const newGames = [];
      const others = [];

      cards.forEach((card) => {
        const button = card.querySelector('[data-favorite]');
        if (button?.getAttribute('aria-pressed') === 'true') favorites.push(card);
        else if (card.dataset.new === 'true') newGames.push(card);
        else others.push(card);
      });

      [...favorites, ...newGames, ...others].forEach((card) => grid.appendChild(card));
    };

    sortCards();
    cards.forEach((card) => {
      const button = card.querySelector('[data-favorite]');
      button?.addEventListener('click', () => requestAnimationFrame(sortCards));
      if (button) {
        new MutationObserver(() => requestAnimationFrame(sortCards)).observe(button, {
          attributes: true,
          attributeFilter: ['aria-pressed'],
        });
      }
    });
  })();
</script>
`;

  if (html.includes('</body>')) html = html.replace('</body>', `${snippet}</body>`);
  else html += snippet;
}

fs.writeFileSync(homePath, html);
const finalHtml = fs.readFileSync(homePath, 'utf8');

for (const slug of cardSlugs) {
  if (!finalHtml.includes(`data-game="${slug}"`)) throw new Error(`LEVEL UP card disappeared after value injection: ${slug}`);
  if (!finalHtml.includes('class="card-values"')) throw new Error('LEVEL UP card value block injection failed.');
}
if (!finalHtml.includes(marker)) throw new Error('LEVEL UP favorite/new sorting injection failed.');
if (!finalHtml.includes('data-new="true"')) throw new Error('LEVEL UP new game marker injection failed.');

console.log(`[Firebase] LEVEL UP cards enriched (${cardSlugs.length}) + favorites > NEW > existing sorting injected`);
