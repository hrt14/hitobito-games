import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const marker = 'data-levelup-state-diagnosis-v2';

if (!fs.existsSync(homePath)) {
  throw new Error('Firebase LEVEL UP home not found. Run after the main home build.');
}

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

const issueButtons = issues.map(([key, label]) =>
  `<button type="button" class="lu-v2-problem" data-lu-v2-issue="${key}"><span>${label}</span><b>→</b></button>`
).join('\n');

const config = {
  rumination: {
    label: '嫌なことが頭から離れない',
    question: '何がいちばん引っかかってる？',
    details: {
      slip: { label: '会話・会議で失言したかも', instant: ['nukeru','mou-owatta'], cause: ['kanji-warukatta','sore-honto'], train: ['kininaranai','approval-off'] },
      disliked: { label: '嫌われた・感じ悪かった気がする', instant: ['nukeru','kanji-warukatta'], cause: ['sore-honto','approval-off'], train: ['kininaranai','approval-off'] },
      failure: { label: '失敗したことを繰り返し考える', instant: ['nukeru','mou-owatta'], cause: ['mou-owatta','sore-honto'], train: ['mada-dekinai','kininaranai'] },
      anger: { label: '腹が立つことを思い出す', instant: ['nukeru','levelup-mood'], cause: ['maa-iika','levelup-control'], train: ['kininaranai','expect-nothing'] },
      vague: { label: '理由はうまく言えないけどモヤモヤ', instant: ['nukeru','name-it'], cause: ['name-it','sore-honto'], train: ['kininaranai','extra-load'] },
    },
  },
  stuck: {
    label: 'やることがあるのに動けない',
    question: '止まっている理由に近いのは？',
    details: {
      huge: { label: '大きすぎて、どこから手をつけるかわからない', instant: ['3sec-action','start'], cause: ['ato-5min','matomaru'], train: ['one-thing','3sec-action'] },
      perfection: { label: 'ちゃんとやろうとすると重くなる', instant: ['3sec-action','maa-iika'], cause: ['extra-load','ato-5min'], train: ['mada-dekinai','one-thing'] },
      many: { label: 'やることが多すぎて全部気になる', instant: ['one-thing','3sec-action'], cause: ['self-management','extra-load'], train: ['matomaru','one-thing'] },
      morning: { label: '朝・起きた直後が特に動けない', instant: ['asa-glide','start'], cause: ['start','3sec-action'], train: ['3sec-action','one-thing'] },
      aversion: { label: '理由より、とにかく始めるのが嫌', instant: ['3sec-action','start'], cause: ['ato-5min','extra-load'], train: ['one-thing','mada-dekinai'] },
    },
  },
  approval: {
    label: '人からどう思われるか気になる',
    question: 'どの場面がいちばん近い？',
    details: {
      aftertalk: { label: '会話のあと「失礼だったかな」と反省会', instant: ['nukeru','kanji-warukatta'], cause: ['kanji-warukatta','sore-honto'], train: ['approval-off','kininaranai'] },
      choice: { label: '自分の希望より、よく思われる方を選ぶ', instant: ['approval-off','task-separation'], cause: ['approval-off','main-character'], train: ['main-character','watashi-zukan'] },
      sns: { label: 'SNS・反応・いいねが気になる', instant: ['approval-off','nukeru'], cause: ['sore-honto','approval-off'], train: ['kininaranai','main-character'] },
      no: { label: '断る・意見を言うと嫌われそう', instant: ['task-separation','approval-off'], cause: ['approval-off','dont-change-people'], train: ['task-separation','main-character'] },
    },
  },
  frustration: {
    label: '思い通りにいかなくてイライラ',
    question: '何が思い通りにいってない？',
    details: {
      plan: { label: '予定や計画が崩れた', instant: ['maa-iika','nukeru'], cause: ['expect-nothing','levelup-control'], train: ['maa-iika','levelup-control'] },
      person: { label: '相手が期待どおり動かない', instant: ['nukeru','task-separation'], cause: ['dont-change-people','task-separation'], train: ['expect-nothing','task-separation'] },
      unfair: { label: '納得できない・不公平に感じる', instant: ['nukeru','levelup-mood'], cause: ['levelup-control','sore-honto'], train: ['kininaranai','maa-iika'] },
      result: { label: '自分の結果が思ったより悪かった', instant: ['maa-iika','nukeru'], cause: ['mou-owatta','mada-dekinai'], train: ['mada-dekinai','levelup-control'] },
    },
  },
  fatigue: {
    label: 'なんかもう疲れた',
    question: 'いちばん重いのはどれ？',
    details: {
      brain: { label: '考えることが多すぎて頭が重い', instant: ['extra-load','nukeru'], cause: ['self-management','extra-load'], train: ['one-thing','matomaru'] },
      people: { label: '人に気を使いすぎて疲れた', instant: ['nukeru','extra-load'], cause: ['task-separation','approval-off'], train: ['approval-off','kininaranai'] },
      meeting: { label: '会議・仕事のあと一気に消耗する', instant: ['extra-load','nukeru'], cause: ['self-management','extra-load'], train: ['one-thing','kininaranai'] },
      vague: { label: '何疲れかわからない', instant: ['nukeru','name-it'], cause: ['name-it','self-management'], train: ['extra-load','self-management'] },
    },
  },
  waiting: {
    label: '予定があるだけで時間を使えない',
    question: 'どんな「待ち時間」になってる？',
    details: {
      one: { label: '午後に1個予定があるだけで、それまで動けない', instant: ['yotei-made-tsukaeru','timecraft'], cause: ['yotei-made-tsukaeru','timecraft'], train: ['one-thing','timecraft'] },
      split: { label: '予定が細かく散って、一日が全部細切れ', instant: ['yotei-made-tsukaeru','one-thing'], cause: ['timecraft','self-management'], train: ['timecraft','one-thing'] },
      meeting: { label: '会議の前になると何も始められない', instant: ['yotei-made-tsukaeru','3sec-action'], cause: ['yotei-made-tsukaeru','one-thing'], train: ['timecraft','one-thing'] },
    },
  },
  confusion: {
    label: '考えがまとまらない',
    question: 'どこで詰まってる？',
    details: {
      info: { label: '情報が多すぎて、要するに何かわからない', instant: ['matomaru','one-thing'], cause: ['matomaru','thinking-stairs'], train: ['matomaru','one-thing'] },
      next: { label: '問題はわかるけど次の一手が出ない', instant: ['uchite','matomaru'], cause: ['uchite','idea-lenses-40'], train: ['idea-lenses-40','viewpoint-exam'] },
      meeting: { label: '会議・説明で話が散らかる', instant: ['matomaru','timecraft'], cause: ['matomaru','one-thing'], train: ['matomaru','levelup-smalltalk'] },
      options: { label: '選択肢が多くて決められない', instant: ['matomaru','levelup-control'], cause: ['watashi-zukan','matomaru'], train: ['viewpoint-exam','main-character'] },
    },
  },
  direction: {
    label: '何をしたいのかわからない',
    question: '迷い方に近いのは？',
    details: {
      approval: { label: '夢に「成功したい・認められたい」が混ざってる', instant: ['approval-off','watashi-zukan'], cause: ['main-character','approval-off'], train: ['meaning-map','main-character'] },
      values: { label: '自分が何を大事にしたいかわからない', instant: ['watashi-zukan','meaning-map'], cause: ['watashi-zukan','meaning-map'], train: ['main-character','meaning-map'] },
      stagnant: { label: '毎日やってるのに進んでる感じがしない', instant: ['life-plus-one','meaning-map'], cause: ['life-plus-one','meaning-map'], train: ['main-character','watashi-zukan'] },
      goal: { label: '目標はあるけど、本当にやりたいのかわからない', instant: ['meaning-map','watashi-zukan'], cause: ['watashi-zukan','main-character'], train: ['main-character','meaning-map'] },
    },
  },
};

const style = `
<style id="levelup-state-diagnosis-v2-style">
  #levelup-growth,#lu-diagnosis{display:none!important}
  .lu-v2{position:relative;overflow:hidden;margin:0 0 18px;border:1px solid rgba(216,255,91,.28);border-radius:22px;background:linear-gradient(145deg,rgba(216,255,91,.09),rgba(255,255,255,.025));padding:20px}
  .lu-v2:after{content:'';position:absolute;width:220px;height:220px;border-radius:50%;right:-110px;top:-135px;background:rgba(216,255,91,.08);pointer-events:none}
  .lu-v2-kicker{font-size:8px;letter-spacing:.17em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:8px}
  .lu-v2 h2{position:relative;z-index:1;margin:0;font-size:clamp(28px,5vw,46px);line-height:1;letter-spacing:-.055em}
  .lu-v2-lead{position:relative;z-index:1;margin:9px 0 15px;max-width:62ch;color:#aeb5a5;font-size:11px;line-height:1.65}
  .lu-v2-problems{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .lu-v2-problem{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:58px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:#131711;color:#f3f6ee;padding:11px 13px;text-align:left;font-size:12px;font-weight:850;line-height:1.35;cursor:pointer}
  .lu-v2-problem b{color:var(--lime,#d8ff5b);font-size:17px;flex:0 0 auto}
  .lu-v2-problem:active{transform:scale(.99)}
  .lu-v2-sheet{position:fixed;inset:0;z-index:2147483100;display:none;align-items:flex-end;justify-content:center;padding:14px;background:rgba(4,5,4,.84);backdrop-filter:blur(10px)}
  .lu-v2-sheet.is-open{display:flex}
  .lu-v2-panel{width:min(650px,100%);max-height:min(88vh,820px);overflow:auto;border:1px solid rgba(216,255,91,.3);border-radius:24px;background:#0e120c;color:#f6f8f1;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
  .lu-v2-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}
  .lu-v2-top strong{font-size:11px;letter-spacing:.12em}
  .lu-v2-close{width:36px;height:36px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:#151914;color:#fff;font-size:18px;cursor:pointer}
  .lu-v2-step{font-size:8px;letter-spacing:.14em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:6px}
  .lu-v2-question{font-size:23px;line-height:1.12;letter-spacing:-.04em;margin:0 0 13px}
  .lu-v2-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .lu-v2-option{min-height:54px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:#151914;color:#edf0e9;padding:10px 11px;text-align:left;font-size:12px;font-weight:850;line-height:1.4;cursor:pointer}
  .lu-v2-option.is-on{border-color:rgba(216,255,91,.72);background:rgba(216,255,91,.11);color:#eaff9a}
  .lu-v2-next{display:flex;gap:8px;margin-top:14px}
  .lu-v2-primary,.lu-v2-secondary{min-height:46px;border-radius:999px;padding:0 16px;font-size:11px;font-weight:950;cursor:pointer}
  .lu-v2-primary{border:0;background:var(--lime,#d8ff5b);color:#10140c}
  .lu-v2-primary:disabled{opacity:.35;cursor:not-allowed}
  .lu-v2-secondary{border:1px solid rgba(216,255,91,.25);background:#11150e;color:#d8ff5b}
  .lu-v2-screen[hidden]{display:none!important}
  .lu-v2-result-intro{margin:0 0 14px;padding:12px 13px;border-radius:14px;background:rgba(216,255,91,.07);color:#c8cfbe;font-size:11px;line-height:1.6}
  .lu-v2-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .lu-v2-result{display:flex;flex-direction:column;min-height:214px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:#131711;padding:13px}
  .lu-v2-result.is-priority{border-color:rgba(216,255,91,.72);box-shadow:0 0 0 1px rgba(216,255,91,.08) inset}
  .lu-v2-role{display:flex;align-items:center;justify-content:space-between;gap:6px;color:var(--lime,#d8ff5b);font-size:8px;letter-spacing:.09em;font-weight:950}
  .lu-v2-priority{display:none;padding:3px 6px;border-radius:999px;background:var(--lime,#d8ff5b);color:#10140c;font-size:7px}
  .lu-v2-result.is-priority .lu-v2-priority{display:inline-block}
  .lu-v2-result h3{margin:12px 0 7px;font-size:20px;line-height:1.05;letter-spacing:-.04em}
  .lu-v2-result p{margin:0 0 12px;color:#aeb5a5;font-size:10px;line-height:1.55}
  .lu-v2-result a{margin-top:auto;display:flex;align-items:center;justify-content:center;min-height:40px;border-radius:999px;background:#20261b;color:#d8ff5b;text-decoration:none;font-size:10px;font-weight:950}
  .lu-v2-restart{margin-top:13px}
  @media(max-width:650px){.lu-v2{padding:15px;border-radius:18px}.lu-v2 h2{font-size:32px}.lu-v2-problems{grid-template-columns:1fr 1fr;gap:7px}.lu-v2-problem{min-height:64px;padding:10px;font-size:11px}.lu-v2-options{grid-template-columns:1fr}.lu-v2-results{grid-template-columns:1fr}.lu-v2-result{min-height:0}.lu-v2-panel{padding:16px}.lu-v2-question{font-size:21px}}
  @media(max-width:390px){.lu-v2-problems{grid-template-columns:1fr}}
</style>`;

const markup = `
<section class="lu-v2" id="levelup-state-diagnosis-v2">
  <div class="lu-v2-kicker">START FROM YOUR STATE</div>
  <h2>いま、どうした？</h2>
  <p class="lu-v2-lead">アプリ名から探さなくて大丈夫。今の状態に一番近いものを選ぶと、そこから原因と必要な変化を絞ります。</p>
  <div class="lu-v2-problems">${issueButtons}</div>
</section>
<div class="lu-v2-sheet" id="lu-v2-sheet" aria-hidden="true">
  <div class="lu-v2-panel" role="dialog" aria-modal="true" aria-labelledby="lu-v2-title">
    <div class="lu-v2-top"><strong id="lu-v2-title">今の状態から選ぶ</strong><button type="button" class="lu-v2-close" id="lu-v2-close" aria-label="閉じる">×</button></div>
    <section class="lu-v2-screen" id="lu-v2-detail-screen">
      <div class="lu-v2-step">STEP 2 / 3</div>
      <h3 class="lu-v2-question" id="lu-v2-detail-question"></h3>
      <div class="lu-v2-options" id="lu-v2-detail-options"></div>
      <div class="lu-v2-next"><button class="lu-v2-secondary" type="button" id="lu-v2-back-to-top">← 戻る</button><button class="lu-v2-primary" type="button" id="lu-v2-to-need" disabled>次へ →</button></div>
    </section>
    <section class="lu-v2-screen" id="lu-v2-need-screen" hidden>
      <div class="lu-v2-step">STEP 3 / 3</div>
      <h3 class="lu-v2-question">今いちばん欲しいのは？</h3>
      <div class="lu-v2-options" id="lu-v2-need-options">
        <button class="lu-v2-option" type="button" data-lu-v2-need="instant">とにかく今すぐ状態を変えたい</button>
        <button class="lu-v2-option" type="button" data-lu-v2-need="cause">何が起きているか整理したい</button>
        <button class="lu-v2-option" type="button" data-lu-v2-need="train">同じことで消耗しない自分を作りたい</button>
      </div>
      <div class="lu-v2-next"><button class="lu-v2-secondary" type="button" id="lu-v2-back-detail">← 戻る</button><button class="lu-v2-primary" type="button" id="lu-v2-run" disabled>結果を見る →</button></div>
    </section>
    <section class="lu-v2-screen" id="lu-v2-result-screen" hidden>
      <div class="lu-v2-step">YOUR LEVEL UP</div>
      <h3 class="lu-v2-question" id="lu-v2-result-heading">この3本が近いです。</h3>
      <div class="lu-v2-result-intro" id="lu-v2-result-intro"></div>
      <div class="lu-v2-results" id="lu-v2-results"></div>
      <button class="lu-v2-secondary lu-v2-restart" type="button" id="lu-v2-restart">最初から選び直す</button>
    </section>
  </div>
</div>`;

const script = `
<script ${marker}>
(() => {
  const CONFIG = ${JSON.stringify(config)};
  const sheet = document.getElementById('lu-v2-sheet');
  const detailScreen = document.getElementById('lu-v2-detail-screen');
  const needScreen = document.getElementById('lu-v2-need-screen');
  const resultScreen = document.getElementById('lu-v2-result-screen');
  const detailQuestion = document.getElementById('lu-v2-detail-question');
  const detailOptions = document.getElementById('lu-v2-detail-options');
  const toNeed = document.getElementById('lu-v2-to-need');
  const run = document.getElementById('lu-v2-run');
  const cards = [...document.querySelectorAll('.card[data-game]')];
  const bySlug = new Map(cards.map((card) => [card.dataset.game, card]));
  let issueKey = '';
  let detailKey = '';
  let need = '';

  const setOpen = (value) => {
    sheet?.classList.toggle('is-open', value);
    sheet?.setAttribute('aria-hidden', String(!value));
    document.documentElement.style.overflow = value ? 'hidden' : '';
  };
  const show = (which) => {
    detailScreen.hidden = which !== 'detail';
    needScreen.hidden = which !== 'need';
    resultScreen.hidden = which !== 'result';
  };
  const resetNeed = () => {
    need = '';
    run.disabled = true;
    document.querySelectorAll('[data-lu-v2-need]').forEach((button) => button.classList.remove('is-on'));
  };
  const openIssue = (key) => {
    const issue = CONFIG[key];
    if (!issue) return;
    issueKey = key;
    detailKey = '';
    resetNeed();
    detailQuestion.textContent = issue.question;
    detailOptions.innerHTML = '';
    Object.entries(issue.details).forEach(([detailId, detail]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lu-v2-option';
      button.textContent = detail.label;
      button.addEventListener('click', () => {
        detailOptions.querySelectorAll('.lu-v2-option').forEach((node) => node.classList.remove('is-on'));
        button.classList.add('is-on');
        detailKey = detailId;
        toNeed.disabled = false;
      });
      detailOptions.appendChild(button);
    });
    toNeed.disabled = true;
    show('detail');
    setOpen(true);
  };

  document.querySelectorAll('[data-lu-v2-issue]').forEach((button) => button.addEventListener('click', () => openIssue(button.dataset.luV2Issue)));
  document.getElementById('lu-v2-close')?.addEventListener('click', () => setOpen(false));
  sheet?.addEventListener('click', (event) => { if (event.target === sheet) setOpen(false); });
  document.getElementById('lu-v2-back-to-top')?.addEventListener('click', () => setOpen(false));
  toNeed?.addEventListener('click', () => { if (detailKey) show('need'); });
  document.getElementById('lu-v2-back-detail')?.addEventListener('click', () => show('detail'));
  document.querySelectorAll('[data-lu-v2-need]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-lu-v2-need]').forEach((node) => node.classList.remove('is-on'));
      button.classList.add('is-on');
      need = button.dataset.luV2Need;
      run.disabled = false;
    });
  });

  const firstAvailable = (slugs, used) => {
    for (const slug of slugs || []) {
      const card = bySlug.get(slug);
      if (card && !used.has(slug)) return { slug, card };
    }
    const fallback = cards.find((card) => card.dataset.game && !used.has(card.dataset.game));
    return fallback ? { slug: fallback.dataset.game, card: fallback } : null;
  };
  const meta = (picked) => {
    if (!picked) return null;
    const card = picked.card;
    return {
      slug: picked.slug,
      title: card.querySelector('h2')?.textContent?.trim() || picked.slug,
      description: card.querySelector('p')?.textContent?.trim() || card.querySelector('.card-value-text')?.textContent?.trim() || '',
      href: card.querySelector('.card-link')?.getAttribute('href') || '/apps/' + picked.slug + '/',
    };
  };
  const roles = {
    instant: { label: '今すぐ効く', reason: 'まず今の状態を少し変えて、考える余力を取り戻す。' },
    cause: { label: '原因に合っている', reason: 'いま起きているパターンそのものを整理する。' },
    train: { label: '体質改善', reason: '同じ場面で反応しすぎない・止まりすぎない反射を鍛える。' },
  };

  run?.addEventListener('click', () => {
    const issue = CONFIG[issueKey];
    const detail = issue?.details?.[detailKey];
    if (!issue || !detail || !need) return;
    const used = new Set();
    const result = {};
    ['instant','cause','train'].forEach((role) => {
      const picked = firstAvailable(detail[role], used);
      if (picked) used.add(picked.slug);
      result[role] = meta(picked);
    });
    const needLabel = need === 'instant' ? '今すぐ状態を変えたい' : need === 'cause' ? '原因を整理したい' : '同じことで消耗しない自分を作りたい';
    document.getElementById('lu-v2-result-heading').textContent = '「' + detail.label + '」なら、この3本。';
    document.getElementById('lu-v2-result-intro').textContent = '今の優先は「' + needLabel + '」。1本に決め打ちせず、今すぐ・原因・体質改善の3方向から選べます。';
    const results = document.getElementById('lu-v2-results');
    results.innerHTML = '';
    ['instant','cause','train'].forEach((role) => {
      const game = result[role];
      if (!game) return;
      const info = roles[role];
      const article = document.createElement('article');
      article.className = 'lu-v2-result' + (need === role ? ' is-priority' : '');
      const roleRow = document.createElement('div');
      roleRow.className = 'lu-v2-role';
      roleRow.innerHTML = '<span>' + info.label + '</span><span class="lu-v2-priority">いま優先</span>';
      const title = document.createElement('h3');
      title.textContent = game.title;
      const copy = document.createElement('p');
      copy.textContent = info.reason + (game.description ? ' ' + game.description : '');
      const link = document.createElement('a');
      link.href = game.href + (game.href.includes('?') ? '&' : '?') + 'ref=diagnosis-v2&utm_source=levelup&utm_medium=diagnosis&utm_campaign=state_match&diagnosis=' + encodeURIComponent(issueKey + ':' + detailKey + ':' + role);
      link.textContent = 'これをやる →';
      article.append(roleRow, title, copy, link);
      results.appendChild(article);
    });
    try { localStorage.setItem('hitobito-levelup-last-diagnosis-v2', JSON.stringify({ issue: issueKey, detail: detailKey, need, at: new Date().toISOString() })); } catch {}
    show('result');
  });

  document.getElementById('lu-v2-restart')?.addEventListener('click', () => {
    setOpen(false);
    setTimeout(() => document.getElementById('levelup-state-diagnosis-v2')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  });
})();
</script>`;

let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes('id="levelup-state-diagnosis-v2-style"')) {
  if (!html.includes('</head>')) throw new Error('LEVEL UP home head not found.');
  html = html.replace('</head>', `${style}\n</head>`);
}
if (!html.includes('id="levelup-state-diagnosis-v2"')) {
  const anchor = '<section id="training-games">';
  if (html.includes(anchor)) html = html.replace(anchor, `${markup}\n${anchor}`);
  else if (html.includes('<footer class="footer">')) html = html.replace('<footer class="footer">', `${markup}\n<footer class="footer">`);
  else throw new Error('LEVEL UP training section anchor not found.');
}
if (!html.includes(marker)) {
  if (!html.includes('</body>')) throw new Error('LEVEL UP home body not found.');
  html = html.replace('</body>', `${script}\n</body>`);
}

fs.writeFileSync(homePath, html);

const finalHome = fs.readFileSync(homePath, 'utf8');
for (const required of ['levelup-state-diagnosis-v2', 'いま、どうした？', 'data-lu-v2-issue="waiting"', '今すぐ効く', '原因に合っている', '体質改善', '#levelup-growth,#lu-diagnosis{display:none!important}']) {
  if (!finalHome.includes(required)) throw new Error(`LEVEL UP diagnosis v2 missing: ${required}`);
}

console.log('[Firebase] LEVEL UP state diagnosis v2 injected; random today recommendation hidden.');
