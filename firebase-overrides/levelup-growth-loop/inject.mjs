import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const appsDir = path.join(outDir, 'apps');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const marker = 'data-levelup-growth-loop-v1';
const canonicalBase = 'https://levelup.hitobito.jp';

if (!fs.existsSync(homePath) || !fs.existsSync(appsDir) || !fs.existsSync(catalogPath)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after the main LEVEL UP build.');
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).games || [];
const bySlug = new Map(catalog.map((game) => [game.slug, game]));

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extract(html, regex, fallback = '') {
  const match = html.match(regex);
  return match ? stripTags(match[1] || '') : fallback;
}

function metaFor(slug, html = '') {
  const known = bySlug.get(slug);
  if (known) return known;
  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i, slug);
  const description = extract(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ''
  ) || extract(html, /<p[^>]*>([\s\S]*?)<\/p>/i, '遊んで、考え方と行動の反射を鍛えるLEVEL UPトレーニング。');
  return {
    slug,
    title: title.replace(/\s*[|｜—-]\s*LEVEL\s*UP.*$/i, '').trim() || slug,
    description,
    skill: '',
    href: `/apps/${encodeURIComponent(slug)}/`,
  };
}

const groups = [
  { key: 'action', keywords: ['着手','タスク','集中','時間','優先順位','自己管理','WIP','先延ばし','行動','動く'] },
  { key: 'boundary', keywords: ['境界','課題','相手','対人','期待','頼る','委任','雑談','会話'] },
  { key: 'recovery', keywords: ['切り替え','反芻','感情','受容','疲れ','機嫌','省エネ','手放す','気分'] },
  { key: 'perspective', keywords: ['視点','意味','編集','主人公','感謝','自己理解','見方','価値'] },
];

function groupFor(game) {
  const haystack = `${game.skill || ''} ${game.description || ''} ${game.title || ''}`;
  let best = { key: 'perspective', score: -1 };
  for (const group of groups) {
    const score = group.keywords.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { key: group.key, score };
  }
  return best.key;
}

function relatedFor(slug, count = 3) {
  const current = bySlug.get(slug);
  const currentGroup = current ? groupFor(current) : '';
  const same = catalog.filter((game) => game.slug !== slug && currentGroup && groupFor(game) === currentGroup);
  const rest = catalog.filter((game) => game.slug !== slug && !same.some((item) => item.slug === game.slug));
  return [...same, ...rest].slice(0, count);
}

function ensureHeadMeta(html, slug, game) {
  const href = game.href && game.href.startsWith('/') ? game.href : `/apps/${encodeURIComponent(slug)}/`;
  const canonical = new URL(href, canonicalBase).href;
  const title = game.title || slug;
  const description = game.description || '遊んで、考え方と行動の反射を鍛えるLEVEL UPトレーニング。';

  const pieces = [];
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
    pieces.push(`<link rel="canonical" href="${escapeAttr(canonical)}" />`);
  }
  if (!/<meta[^>]+property=["']og:title["']/i.test(html)) {
    pieces.push(`<meta property="og:title" content="${escapeAttr(title)} | LEVEL UP" />`);
  }
  if (!/<meta[^>]+property=["']og:description["']/i.test(html)) {
    pieces.push(`<meta property="og:description" content="${escapeAttr(description)}" />`);
  }
  if (!/<meta[^>]+property=["']og:url["']/i.test(html)) {
    pieces.push(`<meta property="og:url" content="${escapeAttr(canonical)}" />`);
  }
  if (!/<meta[^>]+property=["']og:type["']/i.test(html)) {
    pieces.push('<meta property="og:type" content="website" />');
  }
  if (!/<meta[^>]+name=["']twitter:card["']/i.test(html)) {
    pieces.push('<meta name="twitter:card" content="summary" />');
  }
  if (!html.includes('"applicationCategory":"EducationalApplication"')) {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${title} | LEVEL UP`,
      description,
      url: canonical,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    }).replaceAll('</', '<\\/');
    pieces.push(`<script type="application/ld+json">${jsonLd}</script>`);
  }

  return pieces.length ? html.replace('</head>', `${pieces.join('\n')}\n</head>`) : html;
}

const commonStyle = `
<style id="levelup-growth-loop-v1-style">
  .lu-growth-home{display:grid;grid-template-columns:1.05fr .95fr;gap:10px;margin:0 0 18px}
  .lu-growth-card{position:relative;overflow:hidden;border:1px solid rgba(216,255,91,.22);background:linear-gradient(145deg,rgba(216,255,91,.08),rgba(255,255,255,.025));border-radius:18px;padding:16px}
  .lu-growth-card:after{content:'';position:absolute;width:160px;height:160px;border-radius:50%;right:-90px;top:-95px;background:rgba(216,255,91,.08);pointer-events:none}
  .lu-growth-kicker{font-size:8px;letter-spacing:.15em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:7px}
  .lu-growth-card h2{font-size:24px;line-height:1.05;letter-spacing:-.04em;margin:0 0 7px}
  .lu-growth-card p{font-size:10px;line-height:1.55;color:#aeb5a5;margin:0 0 12px;max-width:58ch}
  .lu-growth-primary,.lu-growth-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border-radius:999px;padding:0 15px;font-size:10px;font-weight:950;letter-spacing:.06em;border:0;text-decoration:none;cursor:pointer}
  .lu-growth-primary{background:var(--lime,#d8ff5b);color:#10140c}
  .lu-growth-secondary{background:#11150e;color:#d8ff5b;border:1px solid rgba(216,255,91,.25)}
  .lu-growth-today-meta{font-size:9px;color:#7f8777;margin-top:9px}
  .lu-diagnosis{position:fixed;inset:0;z-index:2147483000;background:rgba(4,5,4,.82);backdrop-filter:blur(10px);display:none;align-items:flex-end;justify-content:center;padding:14px}
  .lu-diagnosis.is-open{display:flex}
  .lu-diagnosis-panel{width:min(560px,100%);max-height:min(86vh,760px);overflow:auto;background:#0e120c;border:1px solid rgba(216,255,91,.28);border-radius:24px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.48);color:#f6f8f1}
  .lu-diagnosis-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}
  .lu-diagnosis-top strong{font-size:11px;letter-spacing:.12em}
  .lu-close{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:#151914;color:#fff;font-size:18px}
  .lu-question{margin:0 0 15px}
  .lu-question h3{font-size:17px;margin:0 0 9px}
  .lu-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .lu-option{min-height:48px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:#151914;color:#e9ece4;padding:9px 10px;text-align:left;font-size:12px;font-weight:850}
  .lu-option.is-on{border-color:rgba(216,255,91,.72);background:rgba(216,255,91,.11);color:#eaff9a}
  .lu-diagnosis-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .lu-result{display:none;border-top:1px solid rgba(255,255,255,.1);margin-top:16px;padding-top:16px}
  .lu-result.is-on{display:block}
  .lu-result-title{font-size:27px;font-weight:950;letter-spacing:-.04em;margin:5px 0 7px}
  .lu-result-copy{font-size:12px;line-height:1.65;color:#b9c0b1;margin:0 0 12px}
  .lu-complete-fab{position:fixed;z-index:2147482000;left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom));width:48px;height:48px;border-radius:50%;border:1px solid rgba(216,255,91,.42);background:rgba(12,15,10,.9);color:#d8ff5b;font-size:18px;font-weight:950;box-shadow:0 10px 30px rgba(0,0,0,.32);backdrop-filter:blur(10px);-webkit-tap-highlight-color:transparent}
  .lu-complete-fab.is-done{background:#d8ff5b;color:#10140c}
  .lu-share-sheet{position:fixed;inset:0;z-index:2147483001;background:rgba(4,5,4,.78);display:none;align-items:flex-end;justify-content:center;padding:14px}
  .lu-share-sheet.is-open{display:flex}
  .lu-share-panel{width:min(520px,100%);background:#0e120c;border:1px solid rgba(216,255,91,.28);border-radius:24px;padding:18px;color:#f6f8f1}
  .lu-result-card{border:1px solid rgba(216,255,91,.25);background:linear-gradient(145deg,#161d11,#0b0e09);border-radius:18px;padding:18px;margin:10px 0 14px}
  .lu-result-card small{font-size:8px;letter-spacing:.16em;color:#d8ff5b;font-weight:950}
  .lu-result-card h2{font-size:26px;line-height:1.06;margin:8px 0}
  .lu-result-grid{font-size:20px;letter-spacing:.05em;margin:8px 0}
  .lu-result-card p{font-size:11px;color:#aeb5a5;line-height:1.6;margin:0}
  .lu-related{display:grid;grid-template-columns:1fr;gap:7px;margin-top:12px}
  .lu-related a{display:block;border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:10px 11px;background:#141812;color:#eef2e8;text-decoration:none}
  .lu-related strong{display:block;font-size:12px}.lu-related span{display:block;font-size:9px;color:#9ca493;margin-top:2px}
  .lu-toast{position:fixed;z-index:2147483640;left:50%;bottom:72px;transform:translateX(-50%);background:#d8ff5b;color:#11150d;border-radius:999px;padding:9px 13px;font-size:10px;font-weight:950;display:none}
  .lu-toast.is-on{display:block}
  @media(max-width:650px){
    .lu-growth-home{grid-template-columns:1fr}
    .lu-growth-card{padding:14px}.lu-growth-card h2{font-size:21px}
    .lu-options{grid-template-columns:1fr}
    .lu-complete-fab{width:46px;height:46px}
  }
</style>`;

const diagnosisPools = {
  action: ['3sec-action','ato-5min','one-thing','timecraft','start'],
  recovery: ['mou-owatta','maa-iika','name-it','extra-load','levelup-mood'],
  boundary: ['task-separation','expect-nothing','dont-change-people','help-me','levelup-smalltalk'],
  perspective: ['viewpoint-exam','meaning-map','jinsei-title','main-character','watashi-zukan'],
};

const homeMarkup = `
<section class="lu-growth-home" id="levelup-growth">
  <article class="lu-growth-card">
    <div class="lu-growth-kicker">TODAY'S LEVEL UP</div>
    <h2 id="lu-today-title">今日の1本を選んでいます</h2>
    <p id="lu-today-copy">毎日1つだけ。迷わず始めて、短く反復する。</p>
    <a class="lu-growth-primary" id="lu-today-link" href="#training-games">今日の1本をやる →</a>
    <div class="lu-growth-today-meta" id="lu-today-meta"></div>
  </article>
  <article class="lu-growth-card">
    <div class="lu-growth-kicker">3 QUESTIONS / 20 SEC</div>
    <h2>今のあなたに1本。</h2>
    <p>アプリ一覧から探さない。3問だけ答えると、いま一番使いやすいLEVEL UPを1つ出します。</p>
    <button class="lu-growth-secondary" type="button" id="lu-diagnosis-open">3問で選ぶ →</button>
  </article>
</section>
<div class="lu-diagnosis" id="lu-diagnosis" aria-hidden="true">
  <div class="lu-diagnosis-panel" role="dialog" aria-modal="true" aria-labelledby="lu-diagnosis-title">
    <div class="lu-diagnosis-top"><strong id="lu-diagnosis-title">いまの自分に合う1本</strong><button type="button" class="lu-close" data-lu-close aria-label="閉じる">×</button></div>
    <div class="lu-question" data-question="state">
      <h3>1. 今いちばん近いのは？</h3>
      <div class="lu-options">
        <button class="lu-option" type="button" data-value="action">やることがあるのに止まってる</button>
        <button class="lu-option" type="button" data-value="recovery">嫌なことが頭から離れない</button>
        <button class="lu-option" type="button" data-value="boundary">人のこと・人の反応で消耗してる</button>
        <button class="lu-option" type="button" data-value="perspective">何を大事にすればいいか迷う</button>
      </div>
    </div>
    <div class="lu-question" data-question="goal">
      <h3>2. どうなりたい？</h3>
      <div class="lu-options">
        <button class="lu-option" type="button" data-value="action">考える前に小さく動く</button>
        <button class="lu-option" type="button" data-value="recovery">手放して切り替える</button>
        <button class="lu-option" type="button" data-value="boundary">自分のことだけに戻る</button>
        <button class="lu-option" type="button" data-value="perspective">見方を変えて整理する</button>
      </div>
    </div>
    <div class="lu-question" data-question="time">
      <h3>3. 今どれくらい使える？</h3>
      <div class="lu-options">
        <button class="lu-option" type="button" data-value="0">30秒</button>
        <button class="lu-option" type="button" data-value="1">2〜3分</button>
        <button class="lu-option" type="button" data-value="2">5分</button>
        <button class="lu-option" type="button" data-value="3">じっくり</button>
      </div>
    </div>
    <div class="lu-diagnosis-actions">
      <button type="button" class="lu-growth-primary" id="lu-diagnosis-run">この条件で1本出す</button>
    </div>
    <div class="lu-result" id="lu-diagnosis-result">
      <div class="lu-growth-kicker">YOUR LEVEL UP</div>
      <div class="lu-result-title" id="lu-result-title"></div>
      <p class="lu-result-copy" id="lu-result-copy"></p>
      <a class="lu-growth-primary" id="lu-result-link" href="/">これをやる →</a>
    </div>
  </div>
</div>`;

function homeScript() {
  const pools = JSON.stringify(diagnosisPools);
  return `
<script ${marker}>
(() => {
  const cards = [...document.querySelectorAll('.card[data-game]')];
  if (!cards.length) return;
  const bySlug = new Map(cards.map((card) => [card.dataset.game, card]));
  const jstDate = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  let seed = 2166136261;
  for (const ch of jstDate) { seed ^= ch.charCodeAt(0); seed = Math.imul(seed, 16777619); }
  const todayCard = cards[Math.abs(seed >>> 0) % cards.length];
  const todayTitle = todayCard.querySelector('h2')?.textContent?.trim() || '今日のLEVEL UP';
  const todayCopy = todayCard.querySelector('.card-value-text, p')?.textContent?.trim() || '今日の1本を短く反復する。';
  const todayHref = todayCard.querySelector('.card-link')?.getAttribute('href') || '/';
  const todayTitleEl = document.getElementById('lu-today-title');
  const todayCopyEl = document.getElementById('lu-today-copy');
  const todayLinkEl = document.getElementById('lu-today-link');
  const todayMetaEl = document.getElementById('lu-today-meta');
  if (todayTitleEl) todayTitleEl.textContent = todayTitle;
  if (todayCopyEl) todayCopyEl.textContent = todayCopy;
  if (todayLinkEl) todayLinkEl.href = todayHref + (todayHref.includes('?') ? '&' : '?') + 'ref=today&utm_source=levelup&utm_medium=internal&utm_campaign=today';
  if (todayMetaEl) todayMetaEl.textContent = jstDate + ' / 1日1本';

  const modal = document.getElementById('lu-diagnosis');
  const open = document.getElementById('lu-diagnosis-open');
  const run = document.getElementById('lu-diagnosis-run');
  const answers = {};
  const pools = ${pools};

  const setOpen = (value) => {
    if (!modal) return;
    modal.classList.toggle('is-open', value);
    modal.setAttribute('aria-hidden', String(!value));
    document.documentElement.style.overflow = value ? 'hidden' : '';
  };
  open?.addEventListener('click', () => setOpen(true));
  modal?.querySelectorAll('[data-lu-close]').forEach((button) => button.addEventListener('click', () => setOpen(false)));
  modal?.addEventListener('click', (event) => { if (event.target === modal) setOpen(false); });

  modal?.querySelectorAll('.lu-question').forEach((question) => {
    const key = question.dataset.question;
    question.querySelectorAll('.lu-option').forEach((button) => {
      button.addEventListener('click', () => {
        question.querySelectorAll('.lu-option').forEach((node) => node.classList.remove('is-on'));
        button.classList.add('is-on');
        answers[key] = button.dataset.value;
      });
    });
  });

  run?.addEventListener('click', () => {
    const scores = {action:0,recovery:0,boundary:0,perspective:0};
    if (scores[answers.state] !== undefined) scores[answers.state] += 2;
    if (scores[answers.goal] !== undefined) scores[answers.goal] += 3;
    const category = Object.entries(scores).sort((a,b) => b[1] - a[1])[0][0];
    const available = (pools[category] || []).filter((slug) => bySlug.has(slug));
    const fallback = cards.map((card) => card.dataset.game).filter(Boolean);
    const pool = available.length ? available : fallback;
    const index = Math.min(Number(answers.time || 0), Math.max(0, pool.length - 1));
    const slug = pool[index] || fallback[0];
    const card = bySlug.get(slug) || cards[0];
    const title = card.querySelector('h2')?.textContent?.trim() || slug;
    const copy = card.querySelector('.card-value-text, p')?.textContent?.trim() || '';
    const href = card.querySelector('.card-link')?.getAttribute('href') || '/';
    document.getElementById('lu-result-title').textContent = title;
    document.getElementById('lu-result-copy').textContent = copy;
    document.getElementById('lu-result-link').href = href + (href.includes('?') ? '&' : '?') + 'ref=diagnosis&utm_source=levelup&utm_medium=diagnosis&utm_campaign=recommendation';
    document.getElementById('lu-diagnosis-result').classList.add('is-on');
    try { localStorage.setItem('hitobito-levelup-last-diagnosis-v1', JSON.stringify({date:jstDate, category, slug})); } catch {}
  });
})();
</script>`;
}

function appMarkup(slug, game) {
  const related = relatedFor(slug);
  const relatedMarkup = related.map((item) => {
    const href = item.href || `/apps/${encodeURIComponent(item.slug)}/`;
    return `<a href="${escapeAttr(href)}?ref=related&utm_source=levelup&utm_medium=internal&utm_campaign=after_complete"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.skill || item.description || '')}</span></a>`;
  }).join('');
  return `
<button type="button" class="lu-complete-fab" data-lu-complete aria-label="今日のトレーニングを完了">✓</button>
<div class="lu-share-sheet" data-lu-sheet aria-hidden="true">
  <div class="lu-share-panel" role="dialog" aria-modal="true">
    <div class="lu-diagnosis-top"><strong>今日のLEVEL UP</strong><button type="button" class="lu-close" data-lu-sheet-close aria-label="閉じる">×</button></div>
    <div class="lu-result-card">
      <small>LEVEL UP / COMPLETE</small>
      <h2>${escapeHtml(game.title)}</h2>
      <div class="lu-result-grid">🟩🟩🟩🟩🟩</div>
      <p>今日も1回、考え方と行動の反射を鍛えた。</p>
    </div>
    <div class="lu-diagnosis-actions">
      <button type="button" class="lu-growth-primary" data-lu-share>結果をシェア</button>
      <button type="button" class="lu-growth-secondary" data-lu-sheet-close>閉じる</button>
    </div>
    ${relatedMarkup ? `<div class="lu-related"><div class="lu-growth-kicker">NEXT TRAINING</div>${relatedMarkup}</div>` : ''}
  </div>
</div>
<div class="lu-toast" data-lu-toast>コピーしました</div>`;
}

function appScript(slug, game) {
  const canonical = new URL(game.href || `/apps/${encodeURIComponent(slug)}/`, canonicalBase).href;
  const shareUrl = `${canonical}${canonical.includes('?') ? '&' : '?'}ref=share&utm_source=share&utm_medium=earned&utm_campaign=levelup_result`;
  const title = game.title || slug;
  return `
<script ${marker} data-game-slug="${escapeAttr(slug)}">
(() => {
  const slug = ${JSON.stringify(slug)};
  const title = ${JSON.stringify(title)};
  const shareUrl = ${JSON.stringify(shareUrl)};
  const button = document.querySelector('[data-lu-complete]');
  const sheet = document.querySelector('[data-lu-sheet]');
  const toast = document.querySelector('[data-lu-toast]');
  const date = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  const key = 'hitobito-levelup-complete:' + date + ':' + slug;
  const alreadyDone = (() => { try { return localStorage.getItem(key) === '1'; } catch { return false; } })();
  if (alreadyDone) button?.classList.add('is-done');

  const setSheet = (value) => {
    if (!sheet) return;
    sheet.classList.toggle('is-open', value);
    sheet.setAttribute('aria-hidden', String(!value));
  };
  button?.addEventListener('click', () => {
    try { localStorage.setItem(key, '1'); } catch {}
    button.classList.add('is-done');
    setSheet(true);
  });
  sheet?.querySelectorAll('[data-lu-sheet-close]').forEach((node) => node.addEventListener('click', () => setSheet(false)));
  sheet?.addEventListener('click', (event) => { if (event.target === sheet) setSheet(false); });

  const text = 'LEVEL UP ✓\\n「' + title + '」\\n🟩🟩🟩🟩🟩\\n今日も1回、反射を鍛えた。\\n#LEVELUP';
  sheet?.querySelector('[data-lu-share]')?.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title + ' | LEVEL UP', text, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text + '\\n' + shareUrl);
        if (toast) {
          toast.classList.add('is-on');
          setTimeout(() => toast.classList.remove('is-on'), 1500);
        }
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('[LEVEL UP share]', error);
    }
  });
})();
</script>`;
}

function injectHome() {
  let html = fs.readFileSync(homePath, 'utf8');
  if (!html.includes('id="levelup-growth-loop-v1-style"')) {
    html = html.replace('</head>', `${commonStyle}\n</head>`);
  }
  if (!html.includes('id="levelup-growth"')) {
    const trainingSection = /<section><div class="section-head"><h2>Training Games<\/h2>/;
    if (trainingSection.test(html)) {
      html = html.replace(trainingSection, `${homeMarkup}\n<section id="training-games"><div class="section-head"><h2>Training Games</h2>`);
    } else {
      html = html.replace('<footer class="footer">', `${homeMarkup}\n<footer class="footer">`);
    }
  }
  if (!html.includes(marker)) {
    html = html.replace('</body>', `${homeScript()}\n</body>`);
  }
  if (!html.includes('"@type":"WebSite"')) {
    const itemList = catalog.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: game.title,
      url: new URL(game.href || `/apps/${game.slug}/`, canonicalBase).href,
    }));
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'hitobito LEVEL UP',
      url: `${canonicalBase}/`,
      description: '遊んで、生きる力を鍛える。考え方と行動を反復する短時間トレーニング。',
      mainEntity: { '@type': 'ItemList', itemListElement: itemList },
    }).replaceAll('</', '<\\/');
    html = html.replace('</head>', `<link rel="canonical" href="${canonicalBase}/" />\n<script type="application/ld+json">${jsonLd}</script>\n</head>`);
  }
  fs.writeFileSync(homePath, html);
}

function injectApps() {
  for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const indexPath = path.join(appsDir, slug, 'index.html');
    if (!fs.existsSync(indexPath)) continue;
    let html = fs.readFileSync(indexPath, 'utf8');
    const game = metaFor(slug, html);
    html = ensureHeadMeta(html, slug, game);
    if (!html.includes('id="levelup-growth-loop-v1-style"')) {
      html = html.replace('</head>', `${commonStyle}\n</head>`);
    }
    if (!html.includes('data-lu-complete')) {
      html = html.replace('</body>', `${appMarkup(slug, game)}\n${appScript(slug, game)}\n</body>`);
    }
    fs.writeFileSync(indexPath, html);
  }
}

function writeDiscoveryFiles() {
  const urls = new Set([`${canonicalBase}/`]);
  for (const game of catalog) {
    if (!game.href || !game.href.startsWith('/')) continue;
    urls.add(new URL(game.href, canonicalBase).href);
  }
  for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!fs.existsSync(path.join(appsDir, entry.name, 'index.html'))) continue;
    urls.add(`${canonicalBase}/apps/${encodeURIComponent(entry.name)}/`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
  fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${canonicalBase}/sitemap.xml\n`);
}

injectHome();
injectApps();
writeDiscoveryFiles();

const finalHome = fs.readFileSync(homePath, 'utf8');
for (const required of ['levelup-growth', 'lu-diagnosis-open', "TODAY'S LEVEL UP", 'levelup-growth-loop-v1-style']) {
  if (!finalHome.includes(required)) throw new Error(`LEVEL UP growth loop home injection missing: ${required}`);
}

const sampleSlug = catalog.find((game) => fs.existsSync(path.join(appsDir, game.slug, 'index.html')))?.slug;
if (sampleSlug) {
  const sample = fs.readFileSync(path.join(appsDir, sampleSlug, 'index.html'), 'utf8');
  for (const required of ['data-lu-complete', 'data-lu-share', 'rel="canonical"', 'application/ld+json']) {
    if (!sample.includes(required)) throw new Error(`LEVEL UP growth loop app injection missing (${sampleSlug}): ${required}`);
  }
}

console.log(`[Firebase] LEVEL UP zero-cost growth loop injected: today + diagnosis + share + related + SEO discovery (${catalog.length} catalog games).`);
