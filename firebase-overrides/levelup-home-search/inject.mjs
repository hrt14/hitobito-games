import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');

if (!fs.existsSync(homePath)) {
  throw new Error('Firebase LEVEL UP home not found. Run build:firebase after the home is generated.');
}

let html = fs.readFileSync(homePath, 'utf8');

const uiMarker = 'id="levelup-search"';
if (!html.includes(uiMarker)) {
  const searchUi = `
    <section class="levelup-search" id="levelup-search" aria-labelledby="levelup-search-title">
      <div class="levelup-search-copy">
        <span class="levelup-search-kicker">FIND YOUR TRAINING</span>
        <h2 id="levelup-search-title">いまの悩みから探す</h2>
        <p>「会議」「疲れ」「先延ばし」など、いま困っていることから関連アプリを探せます。</p>
      </div>
      <div class="levelup-search-control">
        <label class="sr-only" for="levelup-search-input">LEVEL UPアプリをキーワード検索</label>
        <div class="levelup-search-box">
          <span class="levelup-search-icon" aria-hidden="true">⌕</span>
          <input id="levelup-search-input" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" placeholder="会議、疲れ、先延ばし、人間関係…" />
          <button id="levelup-search-clear" type="button" aria-label="検索をクリア" hidden>×</button>
        </div>
        <div class="levelup-search-status" id="levelup-search-status" aria-live="polite"></div>
      </div>
    </section>`;

  const target = '<section><div class="section-head"><h2>Training Games</h2>';
  if (!html.includes(target)) throw new Error('LEVEL UP training section not found for search UI injection.');
  html = html.replace(target, `${searchUi}\n    ${target}`);
}

const styleMarker = 'id="levelup-search-style"';
if (!html.includes(styleMarker)) {
  const style = `
<style id="levelup-search-style">
  .levelup-search{display:grid;grid-template-columns:minmax(0,.8fr) minmax(300px,1.2fr);gap:24px;align-items:end;margin:0 0 34px;padding:20px;border:1px solid rgba(216,255,91,.2);border-radius:22px;background:linear-gradient(145deg,rgba(216,255,91,.07),rgba(216,255,91,.02))}
  .levelup-search-kicker{display:block;margin-bottom:7px;color:var(--lime);font-size:9px;font-weight:950;letter-spacing:.16em}.levelup-search h2{margin:0 0 7px;font-size:24px;line-height:1.1;letter-spacing:-.035em}.levelup-search p{margin:0;color:#959d8c;font-size:11px;line-height:1.7}
  .levelup-search-box{position:relative;display:flex;align-items:center;min-height:52px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:#0c100a;transition:border-color .16s,box-shadow .16s}.levelup-search-box:focus-within{border-color:rgba(216,255,91,.7);box-shadow:0 0 0 3px rgba(216,255,91,.08)}
  .levelup-search-icon{position:absolute;left:16px;color:var(--lime);font-size:21px;line-height:1;pointer-events:none}#levelup-search-input{width:100%;min-width:0;height:52px;border:0;outline:0;background:transparent;color:#f7f9f2;font:inherit;font-size:15px;font-weight:750;padding:0 48px 0 47px;border-radius:15px;-webkit-appearance:none;appearance:none}#levelup-search-input::placeholder{color:#697162;font-weight:650}#levelup-search-input::-webkit-search-cancel-button{-webkit-appearance:none}
  #levelup-search-clear{position:absolute;right:8px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.07);color:#b7beae;font-size:22px;line-height:1;cursor:pointer;padding:0}#levelup-search-clear:active{transform:scale(.92)}.levelup-search-status{min-height:18px;margin-top:7px;color:#8f9786;font-size:10px;font-weight:800}.levelup-search-status strong{color:var(--lime)}
  .card[hidden]{display:none!important}.levelup-search-empty{grid-column:1/-1;padding:36px 20px;border:1px dashed rgba(255,255,255,.12);border-radius:20px;text-align:center;color:#8f9786;font-size:12px;line-height:1.8}.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
  @media(max-width:700px){.levelup-search{grid-template-columns:1fr;gap:14px;padding:16px;margin-bottom:24px}.levelup-search h2{font-size:22px}.levelup-search p{font-size:11.5px}#levelup-search-input{font-size:16px}}
</style>
`;
  if (!html.includes('</head>')) throw new Error('LEVEL UP head not found for search styles.');
  html = html.replace('</head>', `${style}</head>`);
}

const scriptMarker = 'id="levelup-search-script"';
if (!html.includes(scriptMarker)) {
  const script = `
<script id="levelup-search-script">
  (() => {
    const input = document.getElementById('levelup-search-input');
    const clear = document.getElementById('levelup-search-clear');
    const status = document.getElementById('levelup-search-status');
    const grid = document.querySelector('.grid');
    if (!input || !clear || !status || !grid) return;

    const scenarios = {
      '会議': ['meeting-respawn','mou-owatta','task-separation','extra-load','kotowaru','levelup-smalltalk'],
      'ミーティング': ['meeting-respawn','mou-owatta','task-separation','extra-load','kotowaru','levelup-smalltalk'],
      '打ち合わせ': ['meeting-respawn','mou-owatta','task-separation','extra-load','kotowaru','levelup-smalltalk'],
      '疲れ': ['extra-load','self-management','meeting-respawn','nemuri-no-umi','levelup-mood'],
      '先延ばし': ['3sec-action','ato-5min','start','one-thing'],
      '人間関係': ['task-separation','dont-change-people','kotowaru','levelup-smalltalk','expect-nothing'],
      '上司': ['task-separation','dont-change-people','kotowaru','help-me','my-job'],
      '断れない': ['kotowaru','task-separation','my-job'],
      '仕事': ['one-thing','timecraft','extra-load','help-me','self-management','my-job'],
      '不安': ['name-it','levelup-control','maa-iika','levelup-mood'],
      '睡眠': ['nemuri-no-umi','asa-tanoshimi'],
      '寝る': ['nemuri-no-umi','asa-tanoshimi'],
      '比較': ['jibun-wa-jibun','main-character','watashi-zukan'],
      '落ち込む': ['mou-owatta','viewpoint-exam','levelup-mood','maa-iika']
    };

    const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/\\s+/g, ' ').trim();
    let empty = null;
    const cards = () => [...grid.querySelectorAll('.card')];

    const scoreCard = (card, query, terms, aliases) => {
      const slug = card.dataset.game || '';
      const title = normalize(card.querySelector('h2')?.textContent);
      const skill = normalize(card.querySelector('.skill')?.textContent);
      const body = normalize(card.textContent);
      let score = 0;

      if (title === query) score += 180;
      else if (title.includes(query)) score += 130;
      if (skill.includes(query)) score += 90;
      if (body.includes(query)) score += 45;

      if (aliases.length) {
        for (const alias of aliases) {
          const ranked = scenarios[alias] || [];
          const rank = ranked.indexOf(slug);
          const textMatch = title.includes(alias) || skill.includes(alias) || body.includes(alias);
          if (rank < 0 && !textMatch) return 0;
          if (rank >= 0) score += 100 - Math.min(rank * 10, 50);
          if (title.includes(alias)) score += 80;
          else if (skill.includes(alias)) score += 45;
          else if (textMatch) score += 20;
        }
        return score;
      }

      for (const term of terms) {
        if (!body.includes(term)) return 0;
        if (title.includes(term)) score += 80;
        else if (skill.includes(term)) score += 45;
        else score += 20;
      }
      return score;
    };

    const setEmpty = (show, query) => {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'levelup-search-empty';
        grid.appendChild(empty);
      }
      empty.hidden = !show;
      if (show) empty.textContent = '「' + query + '」に合うアプリが見つかりませんでした。別の言葉でも試してみてください。';
    };

    const applySearch = () => {
      const query = normalize(input.value);
      const allCards = cards();
      clear.hidden = !query;
      if (!query) {
        allCards.forEach((card) => { card.hidden = false; card.style.order = ''; });
        setEmpty(false, '');
        status.textContent = '';
        return;
      }

      const terms = query.split(' ').filter(Boolean);
      const aliases = Object.keys(scenarios).filter((alias) => query.includes(alias));
      const matches = allCards
        .map((card, index) => ({ card, index, score: scoreCard(card, query, terms, aliases) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index);
      const matched = new Set(matches.map((item) => item.card));
      allCards.forEach((card) => { card.hidden = !matched.has(card); });
      matches.forEach((item, index) => { item.card.style.order = String(index); });
      setEmpty(matches.length === 0, input.value.trim());
      status.innerHTML = '<strong>' + matches.length + '</strong> 件の関連アプリ';
    };

    input.addEventListener('input', applySearch);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && input.value) { input.value = ''; applySearch(); input.focus(); }
    });
    clear.addEventListener('click', () => { input.value = ''; applySearch(); input.focus(); });
    applySearch();
  })();
</script>
`;
  if (!html.includes('</body>')) throw new Error('LEVEL UP body not found for search script.');
  html = html.replace('</body>', `${script}</body>`);
}

fs.writeFileSync(homePath, html);
const finalHtml = fs.readFileSync(homePath, 'utf8');
for (const marker of [uiMarker, styleMarker, scriptMarker]) {
  if (!finalHtml.includes(marker)) throw new Error(`LEVEL UP search injection failed: ${marker}`);
}
if (!finalHtml.includes("'会議': ['meeting-respawn'")) throw new Error('LEVEL UP search scenario map is missing meeting search.');
if (!finalHtml.includes('id="levelup-search-input"')) throw new Error('LEVEL UP search input is missing.');

console.log('[Firebase] LEVEL UP keyword search injected.');
