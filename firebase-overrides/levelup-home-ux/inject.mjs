import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const appsDir = path.join(outDir, 'apps');
const marker = 'data-levelup-home-ux-v2';

if (!fs.existsSync(homePath) || !fs.existsSync(appsDir)) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after build:firebase assets are generated.');
}

const homeStyle = `
<style id="levelup-home-ux-v2-style">
  /* Dense catalogue: preserve who/purpose/benefit, remove developer-oriented visual noise. */
  .intro{display:none!important}
  .hero{padding:34px 0 26px!important;gap:24px!important}
  .hero h1{font-size:clamp(52px,9vw,94px)!important}
  .stats{margin-top:14px!important}
  .levelup-search{margin-bottom:18px!important;padding:15px 16px!important;border-radius:18px!important;gap:16px!important}
  .levelup-search-copy p{max-width:52ch}
  .grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important;align-items:stretch}
  .card,.card-link{min-height:226px!important}
  .card{border-radius:16px!important}
  .card-link{padding:12px!important}
  .card:before{width:120px!important;height:120px!important;right:-55px!important;top:-70px!important}
  .card-top{min-height:20px;padding-right:34px!important}
  .card:not(.is-new) .number{display:none}
  .updates{display:none!important}
  .favorite{width:30px!important;height:30px!important;right:9px!important;top:9px!important;font-size:18px!important}
  .icon{font-size:19px!important;min-height:22px!important;margin-top:9px!important}
  .kicker{display:none!important}
  .skill{margin-top:5px!important;font-size:8px!important;letter-spacing:.08em!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:2px}
  .card h2{font-size:20px!important;line-height:1.05!important;margin:6px 0 7px!important;letter-spacing:-.035em!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .card-values{gap:4px!important;margin:0 0 9px!important}
  .card-value{grid-template-columns:51px minmax(0,1fr)!important;gap:5px!important;padding-top:4px!important}
  .card-value-label{font-size:7px!important;line-height:1.35!important;letter-spacing:.02em!important}
  .card-value-text{font-size:9px!important;line-height:1.35!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .play{font-size:8px!important}.play span{font-size:12px!important}
  .catalog-divider{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 1px;padding:7px 1px 4px;border-bottom:1px solid rgba(255,255,255,.08)}
  .catalog-divider:first-child{margin-top:0}
  .catalog-divider strong{font-size:10px;letter-spacing:.12em;color:#f4f7ef}
  .catalog-divider span{font-size:9px;color:#7f8777;font-weight:800}
  .catalog-divider[data-kind="favorite"] strong,.catalog-divider[data-kind="new"] strong,.catalog-divider[data-kind="popular"] strong{color:var(--lime)}
  .card[data-popular-rank] .card-top:before{content:'人気 ' attr(data-popular-rank);font-size:7px;font-weight:950;letter-spacing:.05em;color:var(--lime)}
  .card.is-search-top{border-color:rgba(216,255,91,.52)!important;box-shadow:0 0 0 1px rgba(216,255,91,.06) inset}
  .card.is-search-top .card-top:before{content:'おすすめ';font-size:7px;font-weight:950;color:var(--lime);letter-spacing:.05em}
  .grid.is-searching .card[hidden]{display:none!important}
  @media(max-width:900px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
  @media(max-width:600px){
    .shell{width:min(100% - 14px,1160px)!important}
    .top{padding-bottom:11px!important}.hero{padding:20px 1px 18px!important}.hero h1{font-size:52px!important;line-height:.82!important}.hero-copy{font-size:11px!important;line-height:1.55!important}.stats{display:none!important}
    .levelup-search{padding:12px!important;margin-bottom:12px!important}.levelup-search-copy{display:none}.levelup-search-box{min-height:46px!important}#levelup-search-input{height:46px!important;font-size:16px!important}
    .section-head{margin-bottom:8px!important}.section-head span{display:none}
    .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
    .card,.card-link{min-height:214px!important}.card-link{padding:10px!important}.card{border-radius:14px!important}
    .favorite{width:30px!important;height:30px!important;right:7px!important;top:7px!important}.icon{font-size:17px!important;margin-top:7px!important}.skill{font-size:7.5px!important}.card h2{font-size:17px!important;margin:5px 0 6px!important}
    .card-values{gap:3px!important;margin-bottom:7px!important}.card-value{grid-template-columns:42px minmax(0,1fr)!important;gap:4px!important;padding-top:3px!important}.card-value-label{font-size:6.5px!important}.card-value-text{font-size:8.3px!important;line-height:1.28!important}
    .catalog-divider{margin-top:8px;padding-top:5px}.catalog-divider strong{font-size:9px}.catalog-divider span{font-size:8px}
  }
  @media(max-width:360px){.grid{grid-template-columns:1fr!important}.card,.card-link{min-height:190px!important}.card-value-text{font-size:9.5px!important}}
</style>`;

const clientScript = `
<script ${marker}>
(() => {
  const home = document.querySelector('.grid');
  const searchInput = document.getElementById('levelup-search-input');
  const isHome = !!home;
  const accountScript = document.querySelector('[data-levelup-account]');
  const gameSlug = accountScript && accountScript.dataset ? (accountScript.dataset.gameSlug || '') : '';
  const SEARCH_COLLECTION = 'levelupSearchStats';
  const APP_COLLECTION = 'levelupAppStats';
  const OPEN_THROTTLE_MS = 30 * 60 * 1000;

  const waitForFirestore = (callback, attempts = 0) => {
    if (window.firebase && firebase.firestore && firebase.apps && firebase.apps.length) {
      try { callback(firebase.firestore()); } catch (error) { console.warn('[LEVEL UP telemetry]', error); }
      return;
    }
    if (attempts < 40) setTimeout(() => waitForFirestore(callback, attempts + 1), 250);
  };

  const safeSlug = (value) => /^[a-z0-9-]{1,64}$/.test(String(value || '')) ? String(value) : '';
  const normalizeQuery = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/\\s+/g, ' ').trim().slice(0, 40);
  const safeQuery = (value) => {
    const query = normalizeQuery(value);
    if (query.length < 2) return '';
    if (/@|https?:|www\\.|\\b\\d{6,}\\b/i.test(query)) return '';
    return query;
  };
  const hash = (value) => {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };

  const recordSearch = (raw) => {
    const term = safeQuery(raw);
    if (!term) return;
    const sessionKey = 'lu-search:' + term;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
    waitForFirestore((db) => {
      db.collection(SEARCH_COLLECTION).doc(hash(term)).set({
        term,
        count: firebase.firestore.FieldValue.increment(1),
        lastSearchedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch((error) => console.warn('[LEVEL UP telemetry] search write failed', error));
    });
  };

  const recordOpen = (slug) => {
    slug = safeSlug(slug);
    if (!slug) return;
    const key = 'hitobito-levelup-open:' + slug;
    const last = Number(localStorage.getItem(key) || 0);
    if (Date.now() - last < OPEN_THROTTLE_MS) return;
    localStorage.setItem(key, String(Date.now()));
    waitForFirestore((db) => {
      db.collection(APP_COLLECTION).doc(slug).set({
        opens: firebase.firestore.FieldValue.increment(1),
        lastOpenAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch((error) => console.warn('[LEVEL UP telemetry] app open write failed', error));
    });
  };

  if (gameSlug) recordOpen(gameSlug);

  if (!isHome) return;

  const cards = [...home.querySelectorAll('.card')];
  const originalIndex = new Map(cards.map((card, index) => [card, index]));
  let popularSlugs = [];

  const removeDividers = () => home.querySelectorAll('.catalog-divider').forEach((node) => node.remove());
  const makeDivider = (kind, label, count) => {
    const node = document.createElement('div');
    node.className = 'catalog-divider';
    node.dataset.kind = kind;
    node.innerHTML = '<strong>' + label + '</strong><span>' + count + '件</span>';
    return node;
  };

  const layout = () => {
    const query = searchInput ? normalizeQuery(searchInput.value) : '';
    removeDividers();
    cards.forEach((card) => { card.classList.remove('is-search-top'); delete card.dataset.popularRank; });

    if (query) {
      home.classList.add('is-searching');
      const visible = cards.filter((card) => !card.hidden).sort((a, b) => {
        const ao = Number(a.style.order || 9999); const bo = Number(b.style.order || 9999);
        return ao - bo || originalIndex.get(a) - originalIndex.get(b);
      });
      visible.slice(0, 3).forEach((card) => card.classList.add('is-search-top'));
      return;
    }

    home.classList.remove('is-searching');
    cards.forEach((card) => { card.style.order = ''; card.hidden = false; });
    const favorite = cards.filter((card) => card.querySelector('[data-favorite]')?.getAttribute('aria-pressed') === 'true');
    const favoriteSet = new Set(favorite);
    const newGames = cards.filter((card) => card.dataset.new === 'true' && !favoriteSet.has(card)).slice(0, 3);
    const used = new Set([...favorite, ...newGames]);
    const popular = popularSlugs.map((slug) => cards.find((card) => card.dataset.game === slug)).filter((card) => card && !used.has(card)).slice(0, 6);
    popular.forEach((card, index) => { card.dataset.popularRank = String(index + 1); used.add(card); });
    const rest = cards.filter((card) => !used.has(card));

    const groups = [];
    if (favorite.length) groups.push(['favorite', '♥ お気に入り', favorite]);
    if (newGames.length) groups.push(['new', 'NEW 新着', newGames]);
    if (popular.length) groups.push(['popular', '人気', popular]);
    groups.push(['all', 'すべて', rest]);

    groups.forEach(([kind, label, group]) => {
      if (!group.length) return;
      home.appendChild(makeDivider(kind, label, group.length));
      group.forEach((card) => home.appendChild(card));
    });
  };

  const loadPopularity = () => {
    waitForFirestore((db) => {
      db.collection(APP_COLLECTION).orderBy('opens', 'desc').limit(10).get().then((snapshot) => {
        popularSlugs = snapshot.docs.map((doc) => safeSlug(doc.id)).filter(Boolean);
        layout();
      }).catch((error) => console.warn('[LEVEL UP telemetry] popularity read failed', error));
    });
  };

  cards.forEach((card) => {
    const button = card.querySelector('[data-favorite]');
    if (button) button.addEventListener('click', () => requestAnimationFrame(layout));
    const link = card.querySelector('.card-link');
    if (link) link.addEventListener('click', () => { if (searchInput && searchInput.value.trim()) recordSearch(searchInput.value); });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => requestAnimationFrame(layout));
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') recordSearch(searchInput.value);
    });
    searchInput.addEventListener('change', () => recordSearch(searchInput.value));
  }

  requestAnimationFrame(layout);
  loadPopularity();
})();
</script>`;

function injectHome() {
  let html = fs.readFileSync(homePath, 'utf8');
  if (!html.includes('id="levelup-home-ux-v2-style"')) {
    if (!html.includes('</head>')) throw new Error('LEVEL UP home head not found.');
    html = html.replace('</head>', `${homeStyle}</head>`);
  }
  if (!html.includes(marker)) {
    if (!html.includes('</body>')) throw new Error('LEVEL UP home body not found.');
    html = html.replace('</body>', `${clientScript}</body>`);
  }
  fs.writeFileSync(homePath, html);
}

function injectGame(indexPath) {
  let html = fs.readFileSync(indexPath, 'utf8');
  if (html.includes(marker)) return;
  if (!html.includes('</body>')) return;
  html = html.replace('</body>', `${clientScript}</body>`);
  fs.writeFileSync(indexPath, html);
}

injectHome();
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const indexPath = path.join(appsDir, entry.name, 'index.html');
  if (fs.existsSync(indexPath)) injectGame(indexPath);
}

const finalHome = fs.readFileSync(homePath, 'utf8');
for (const required of ['levelup-home-ux-v2-style', marker, 'NEW 新着', "orderBy('opens', 'desc')", 'levelupSearchStats']) {
  if (!finalHome.includes(required)) throw new Error(`LEVEL UP home UX injection missing: ${required}`);
}
console.log('[Firebase] LEVEL UP compact home UX + usage telemetry injected.');
