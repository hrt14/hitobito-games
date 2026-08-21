import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_META } from './playtest-catalog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const firebaseAppsDir = path.join(root, '.dist', 'firebase', 'apps');
const QUALITY_VERSION = '2026-08-21-v1';
const MARKER = 'data-levelup-quality-pass';

const EFFECT_GROUPS = {
  relief: new Set([
    'already-90','approval-off','anger-first-aid','chou-tsukareta','expect-nothing','extra-load',
    'kanji-warukatta','kininaranai','levelup-mood','mou-haratta','mou-owatta','name-it','nukeru',
    'nou-keshigomu','omoisadameru','saiten-shinai','seikan-switch','sore-honto','soredemo-ii-hi',
    'zenbu-fukusen'
  ]),
  action: new Set([
    '3sec-action','asa-glide','asa-tanoshimi','ato-5min','ato-ikkai','atsumaru','boundary',
    'fail-forward','habit-raid','help-me','hontono-shimekiri','meeting-respawn','meeting-timebox',
    'my-job','one-thing','suteru-yuki','timecraft','today-last-day','todo-raid',
    'yotei-made-tsukaeru','zenbu-yaranai'
  ]),
  skill: new Set([
    'big-tech-interview','levelup-smalltalk','web-marketer-owned-site','web-marketer-rakuten',
    'yahoo-shopping-marketer'
  ]),
  awareness: new Set([
    'arigatou-sagashi','jinsei-title','life-plus-one','meaning-map','watashi-zukan'
  ]),
  judgment: new Set([
    '100-turns','dont-change-people','idea-lenses-40','jinshin-shoaku','levelup-control',
    'mada-dekinai','main-character','matomaru','reflex-7','task-separation','thinking-stairs',
    'uchite','viewpoint-exam','kotowaru'
  ]),
};

const EFFECT_COPY = {
  relief: {
    questions: [
      '始める前より、少しだけ軽くなった？',
      'いま、頭の占有率は少し下がった？',
      '同じことを考え続ける勢いは弱まった？',
    ],
    next: [
      'このあと5分だけ、別のことへ意識を向ける。',
      '現実で変えられることが1つだけあるなら、それだけやる。',
      '何もしなくてよければ、ここで考えるのを終える。',
    ],
  },
  action: {
    questions: [
      '次にやることが、1つまで小さくなった？',
      '始める前より、着手のハードルは下がった？',
      'いまなら現実で1手だけ動けそう？',
    ],
    next: [
      'アプリを閉じて、30秒だけ現実の1手をやる。',
      'いちばん小さい行動を1回だけ実行する。',
      '続きを考えず、決めた最初の1手だけやる。',
    ],
  },
  skill: {
    questions: [
      '始める前より、判断の型が1つ増えた？',
      '似た場面で、前より速く考えられそう？',
      '次の実務で使える具体的な型が残った？',
    ],
    next: [
      '今日の実務で1回だけ、この型を使う。',
      '次に似た場面が来たら、最初の判断だけ再現する。',
      '正解を覚えるより、型を1回現実で試す。',
    ],
  },
  awareness: {
    questions: [
      '自分の見方や選び方が、1つ見えた？',
      '始める前にはなかった気づきが1つ増えた？',
      'いまの自分を、少し具体的に言葉にできる？',
    ],
    next: [
      '見つけたことを、今日の選択1つにだけ反映する。',
      '気づきを結論にせず、次の1回でも観察する。',
      '今日の生活で「これかも」と思う瞬間を1つ拾う。',
    ],
  },
  judgment: {
    questions: [
      '似た場面で、前より迷わず選べそう？',
      '判断するときの見る場所が、1つはっきりした？',
      '次の1件で、同じ考え方を使えそう？',
    ],
    next: [
      '次に似た場面が来たら、3秒だけこの判断を使う。',
      '現実の1件を、このゲームと同じ基準で仕分ける。',
      '全部に使わず、今日1回だけ再現する。',
    ],
  },
  general: {
    questions: [
      '始める前より、少し前に進んだ感じはある？',
      'この1回で、使えるものが1つ残った？',
      'もう一度やる意味が、少し見えた？',
    ],
    next: [
      '現実で1回だけ、いま得たものを使う。',
      '今日のうちに1回だけ試して、合わなければ変える。',
      '次回は「前回より1つ速く」を目標にする。',
    ],
  },
};

const START_LABELS = {
  '3sec-action':'3秒判断を始める',
  '100-turns':'100ターンを始める',
  'already-90':'いまある90%を見る',
  'approval-off':'評価を切り分ける',
  'anger-first-aid':'怒りのピークを抜ける',
  'arigatou-sagashi':'支えを探し始める',
  'asa-glide':'寝たまま始める',
  'ato-5min':'5分サイズにする',
  'ato-ikkai':'あと1回だけ試す',
  'atsumaru':'不安を仮説に分ける',
  'big-tech-interview':'30秒思考を始める',
  'boundary':'境界線を引く',
  'chou-tsukareta':'5問で疲れをほどく',
  'dont-change-people':'変えられる方を探す',
  'expect-nothing':'期待を1つ外す',
  'extra-load':'余計な荷物を外す',
  'fail-forward':'60点で出す練習を始める',
  'habit-raid':'今日の習慣レイドへ',
  'help-me':'頼り方を選ぶ',
  'idea-lenses-40':'打ち手を増やす',
  'hontono-shimekiri':'本当の締切を出す',
  'jinsei-title':'出来事に別タイトルをつける',
  'jinshin-shoaku':'会話判断を始める',
  'kanji-warukatta':'事実と予測を分ける',
  'kininaranai':'拾うものだけ選ぶ',
  'levelup-control':'変えられる方へ進む',
  'levelup-mood':'機嫌の選択肢を増やす',
  'levelup-smalltalk':'雑談トレーニングを始める',
  'reflex-7':'7つの反射を鍛える',
  'life-plus-one':'今日の+1を見つける',
  'mada-dekinai':'「まだ」に通してみる',
  'main-character':'主人公として選ぶ',
  'matomaru':'3点にまとめる',
  'meaning-map':'意味のつながりを探す',
  'meeting-respawn':'会議後から復活する',
  'meeting-timebox':'時間内に終える練習',
  'mou-haratta':'「支払い済み」にする',
  'mou-owatta':'脳内反省会を終える',
  'my-job':'仕事を3秒仕分けする',
  'name-it':'感情に名前をつける',
  'nukeru':'60秒で少し抜ける',
  'omoisadameru':'現実を確定して次へ',
  'nou-keshigomu':'頭から仕事を出す',
  'one-thing':'1個だけ終わらせる',
  'saiten-shinai':'自己採点を切る',
  'seikan-switch':'見方を切り替える',
  'sore-honto':'事実と解釈を分ける',
  'soredemo-ii-hi':'残りの一日を組み直す',
  'suteru-yuki':'残すものを選ぶ',
  'task-separation':'誰の課題か分ける',
  'thinking-stairs':'思考の段を切り替える',
  'timecraft':'時間の使い方を試す',
  'today-last-day':'今日の優先を選ぶ',
  'todo-raid':'タスクをクエスト化する',
  'uchite':'打ち手を8方向に出す',
  'viewpoint-exam':'別の見方を作る',
  'watashi-zukan':'自分の選び方を集める',
  'web-marketer-owned-site':'自社ECの次の一手を選ぶ',
  'web-marketer-rakuten':'楽天の次の一手を選ぶ',
  'yahoo-shopping-marketer':'Yahoo!の次の一手を選ぶ',
  'yotei-made-tsukaeru':'予定前の時間を取り戻す',
  'zenbu-fukusen':'意味を未確定にする',
  'zenbu-yaranai':'全部やらない設計を作る',
  'kotowaru':'断り方を選ぶ',
  'asa-tanoshimi':'明日の楽しみを予約する',
};

function effectTypeFor(slug) {
  for (const [type, slugs] of Object.entries(EFFECT_GROUPS)) {
    if (slugs.has(slug)) return type;
  }
  return 'general';
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function normalizeViewport(html) {
  const re = /<meta\b[^>]*name=["']viewport["'][^>]*>/i;
  const match = html.match(re);
  const content = 'width=device-width,initial-scale=1,viewport-fit=cover';
  if (!match) return html.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="viewport" content="${content}">`);
  return html.replace(re, `<meta name="viewport" content="${content}">`);
}

function ensureDescription(html, description) {
  if (/<meta\b[^>]*name=["']description["'][^>]*>/i.test(html)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="description" content="${String(description || '').replaceAll('&','&amp;').replaceAll('"','&quot;')}">`);
}

function patchHtml(html, slug, description) {
  const type = effectTypeFor(slug);
  const effect = EFFECT_COPY[type] || EFFECT_COPY.general;
  const runtimeConfig = {
    slug,
    version: QUALITY_VERSION,
    purpose: description || '',
    type,
    questions: effect.questions,
    next: effect.next,
    startLabel: START_LABELS[slug] || '',
  };

  html = normalizeViewport(html);
  html = ensureDescription(html, description);

  if (!html.includes(`${MARKER}=`)) {
    html = html.replace(/<html(\s|>)/i, `<html ${MARKER}="${QUALITY_VERSION}"$1`);
  }

  if (!html.includes('id="levelup-quality-pass-style"')) {
    const style = `
<style id="levelup-quality-pass-style">
  html{ -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  body{ overflow-wrap:anywhere; }
  button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"]{
    min-width:44px;
    min-height:44px;
    touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
  }
  input,textarea,select{ font-size:max(16px,1em); }
  button:disabled,[aria-disabled="true"]{ opacity:.5; cursor:not-allowed; }
  :where(button,[role="button"],a[href],input,textarea,select):focus-visible{
    outline:3px solid currentColor;
    outline-color:color-mix(in srgb, currentColor 70%, #fff 30%);
    outline-offset:3px;
  }
  [data-luq-pressed="true"]{ filter:brightness(1.08); opacity:.94; }
  .luq-effect-card{
    width:min(100%,440px);
    margin:18px auto 0;
    padding:16px;
    border:1px solid rgba(127,127,127,.22);
    border-radius:18px;
    background:rgba(127,127,127,.12);
    color:inherit;
    -webkit-backdrop-filter:blur(12px);
    backdrop-filter:blur(12px);
    box-shadow:0 14px 34px rgba(0,0,0,.14);
    text-align:left;
  }
  .luq-effect-card *{ box-sizing:border-box; }
  .luq-effect-kicker{ margin:0 0 6px; font-size:11px; font-weight:800; letter-spacing:.08em; opacity:.65; }
  .luq-effect-question{ margin:0; font-size:15px; line-height:1.55; font-weight:800; }
  .luq-effect-actions{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
  .luq-effect-actions button{
    width:100%;
    border:1px solid rgba(127,127,127,.28);
    border-radius:13px;
    background:rgba(127,127,127,.10);
    color:inherit;
    font:inherit;
    font-size:13px;
    font-weight:800;
    padding:10px 12px;
    cursor:pointer;
  }
  .luq-effect-actions button:first-child{ background:color-mix(in srgb, currentColor 10%, transparent); }
  .luq-next{ margin:10px 0 0; font-size:12px; line-height:1.6; opacity:.78; }
  #levelup-quality-live{
    position:fixed!important;
    width:1px!important;height:1px!important;
    padding:0!important;margin:-1px!important;
    overflow:hidden!important;clip:rect(0,0,0,0)!important;
    white-space:nowrap!important;border:0!important;
  }
  @media (prefers-reduced-motion:reduce){
    html:focus-within{ scroll-behavior:auto; }
    *,*::before,*::after{
      animation-duration:.01ms!important;
      animation-iteration-count:1!important;
      transition-duration:.01ms!important;
      scroll-behavior:auto!important;
    }
  }
</style>`;
    html = html.replace(/<\/head>/i, `${style}\n</head>`);
  }

  if (!html.includes('id="levelup-quality-pass-runtime"')) {
    const runtime = `
<script id="levelup-quality-pass-runtime">
(() => {
  const cfg = ${escapeScriptJson(runtimeConfig)};
  const storageKey = 'levelup:quality:' + cfg.slug;
  const genericStart = new Set(['スタート','START','Start','開始','始める','はじめる','PLAY','Play','プレイ']);
  const state = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { return {}; }
  })();
  state.visits = Number(state.visits || 0) + 1;
  state.lastVisitAt = Date.now();
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}

  document.documentElement.dataset.levelupQuality = cfg.version;
  document.body?.setAttribute('data-levelup-purpose', cfg.purpose);

  const live = document.createElement('div');
  live.id = 'levelup-quality-live';
  live.setAttribute('role','status');
  live.setAttribute('aria-live','polite');
  document.body?.appendChild(live);

  const pressOn = (el) => el?.setAttribute?.('data-luq-pressed','true');
  const pressOff = (el) => el?.removeAttribute?.('data-luq-pressed');
  const interactive = (target) => target?.closest?.('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"]');
  document.addEventListener('pointerdown', (event) => pressOn(interactive(event.target)), { passive:true });
  for (const type of ['pointerup','pointercancel','pointerleave']) {
    document.addEventListener(type, (event) => pressOff(interactive(event.target)), { passive:true });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') pressOn(interactive(event.target));
  });
  document.addEventListener('keyup', (event) => pressOff(interactive(event.target)));

  let startCopyApplied = false;
  const improveControls = (root = document) => {
    root.querySelectorAll?.('button').forEach((button) => {
      if (!button.hasAttribute('type') && !button.closest('form')) button.type = 'button';
      const text = (button.textContent || '').replace(/\s+/g,' ').trim();
      if (!button.getAttribute('aria-label') && !text && button.title) button.setAttribute('aria-label', button.title);
    });
    if (cfg.startLabel && !startCopyApplied) {
      const candidates = [...(root.querySelectorAll?.('button') || [])];
      const firstGeneric = candidates.find((button) => genericStart.has((button.textContent || '').replace(/\s+/g,' ').trim()));
      if (firstGeneric) {
        firstGeneric.textContent = cfg.startLabel;
        firstGeneric.dataset.luqStartCopy = 'true';
        startCopyApplied = true;
      }
    }
  };

  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 160 && rect.height > 80;
  };

  const resultCandidates = () => [
    ...document.querySelectorAll('#result,#results,.result-screen,.results-screen,.result-view,[data-screen="result"],[data-view="result"],[class~="result"]')
  ].filter((el, index, all) => all.indexOf(el) === index && visible(el) && (el.textContent || '').trim().length > 35);

  let reflectionShown = false;
  const showReflection = () => {
    if (reflectionShown || document.querySelector('[data-luq-effect-card]')) return;
    const result = resultCandidates()[0];
    if (!result) return;
    reflectionShown = true;
    const visitIndex = Math.max(0, Number(state.visits || 1) - 1);
    const question = cfg.questions[visitIndex % cfg.questions.length];
    const next = cfg.next[visitIndex % cfg.next.length];

    const card = document.createElement('section');
    card.className = 'luq-effect-card';
    card.dataset.luqEffectCard = 'true';
    card.setAttribute('aria-label','この1回の効果チェック');
    card.innerHTML =
      '<p class="luq-effect-kicker">この1回の効果</p>' +
      '<p class="luq-effect-question"></p>' +
      '<div class="luq-effect-actions">' +
        '<button type="button" data-luq-effect="yes">少し変わった</button>' +
        '<button type="button" data-luq-effect="no">まだ</button>' +
      '</div>' +
      '<p class="luq-next" hidden></p>';
    card.querySelector('.luq-effect-question').textContent = question;

    const preferredHost =
      result.querySelector('.result-scroll,.result-inner,.result-content,.results-content,.content') || result;
    preferredHost.appendChild(card);

    let answered = false;
    card.addEventListener('click', (event) => {
      const button = event.target.closest('[data-luq-effect]');
      if (!button) return;
      if (answered) return;
      answered = true;
      const answer = button.dataset.luqEffect;
      state.responses = state.responses || { yes:0, no:0 };
      state.responses[answer] = Number(state.responses[answer] || 0) + 1;
      state.lastResponse = answer;
      state.lastResponseAt = Date.now();
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
      window.dispatchEvent(new CustomEvent('levelup:quality-feedback', {
        detail: { slug: cfg.slug, answer, type: cfg.type, version: cfg.version }
      }));
      card.querySelector('.luq-effect-actions').hidden = true;
      const nextNode = card.querySelector('.luq-next');
      nextNode.hidden = false;
      nextNode.textContent = '現実への1手：' + next;
      live.textContent = answer === 'yes' ? '効果チェックを記録しました。' : 'まだ、と記録しました。';
    });
  };

  improveControls();
  const observer = new MutationObserver(() => {
    improveControls();
    showReflection();
  });
  observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','hidden','style'] });
  window.addEventListener('load', () => {
    improveControls();
    showReflection();
    setTimeout(showReflection, 800);
  }, { once:true });
})();
</script>`;
    html = html.replace(/<\/body>/i, `${runtime}\n</body>`);
  }

  return html;
}

if (!fs.existsSync(firebaseAppsDir)) {
  throw new Error('Firebase apps directory not found. Run build:hosting before LEVEL UP quality pass.');
}

const levelupEntries = Object.entries(GAME_META)
  .filter(([, meta]) => meta?.[0] === 'levelup')
  .map(([slug, meta]) => ({ slug, description: meta?.[1] || '' }));

const report = [];
let patched = 0;
let missing = 0;

for (const { slug, description } of levelupEntries) {
  const indexPath = path.join(firebaseAppsDir, slug, 'index.html');
  if (!fs.existsSync(indexPath)) {
    missing += 1;
    report.push({ slug, status:'missing' });
    continue;
  }

  const before = fs.readFileSync(indexPath, 'utf8');
  const signals = {
    lockedViewport: /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(before),
    hasFocusVisible: /:focus-visible/i.test(before),
    hasReducedMotion: /prefers-reduced-motion/i.test(before),
    hasResultSignal: /id=["']results?["']|class=["'][^"']*\bresults?(?:-screen|-view)?\b/i.test(before),
    hasPersistence: /localStorage|indexedDB|firestore/i.test(before),
    visibleTextChars: before.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().length,
  };

  const after = patchHtml(before, slug, description);
  fs.writeFileSync(indexPath, after);
  patched += 1;
  report.push({ slug, status:'patched', type:effectTypeFor(slug), ...signals });
}

const highRisk = report.filter((item) =>
  item.status === 'patched' &&
  (item.visibleTextChars < 120 || (!item.hasResultSignal && !item.hasPersistence))
);

console.log(`[Firebase] LEVEL UP quality pass ${QUALITY_VERSION}: ${patched} apps patched, ${missing} catalog apps not present`);
if (highRisk.length) {
  console.log('[Firebase] Strict review queue:', highRisk.map((item) => item.slug).join(', '));
}
