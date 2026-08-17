import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');

if (!fs.existsSync(homePath)) {
  throw new Error('Firebase LEVEL UP home not found. Run build:firebase after the home is generated.');
}

let html = fs.readFileSync(homePath, 'utf8');
const marker = 'id="levelup-refresh"';

if (!html.includes(marker)) {
  const snippet = `
<style id="levelup-refresh-style">
  #levelup-refresh{
    position:fixed;
    z-index:2147483647;
    right:max(14px,env(safe-area-inset-right));
    bottom:max(16px,env(safe-area-inset-bottom));
    min-width:94px;
    height:48px;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    border:1px solid rgba(216,255,91,.42);
    border-radius:999px;
    background:rgba(15,19,12,.92);
    color:#d8ff5b;
    padding:0 16px;
    font:900 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;
    letter-spacing:.04em;
    box-shadow:0 12px 38px rgba(0,0,0,.38);
    -webkit-backdrop-filter:blur(14px);
    backdrop-filter:blur(14px);
    cursor:pointer;
    touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
  }
  #levelup-refresh:active{transform:scale(.96)}
  #levelup-refresh.is-loading{opacity:.72;pointer-events:none}
  #levelup-refresh .refresh-icon{font-size:19px;line-height:1}

  .levelup-top-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0}
  #levelup-account-chip{
    min-width:0;
    max-width:220px;
    min-height:34px;
    display:flex;
    align-items:center;
    gap:7px;
    padding:3px 10px 3px 4px;
    border:1px solid rgba(216,255,91,.24);
    border-radius:999px;
    background:rgba(216,255,91,.055);
    color:#f6f8f1;
    font:900 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI",sans-serif;
    cursor:pointer;
    -webkit-tap-highlight-color:transparent;
  }
  #levelup-account-chip:hover{border-color:rgba(216,255,91,.48);background:rgba(216,255,91,.09)}
  #levelup-account-chip:active{transform:scale(.97)}
  #levelup-account-chip .account-avatar,
  #levelup-account-chip .account-avatar-fallback{
    width:26px;
    height:26px;
    flex:0 0 26px;
    border-radius:50%;
  }
  #levelup-account-chip .account-avatar{display:block;object-fit:cover;background:#20251b}
  #levelup-account-chip .account-avatar-fallback{display:grid;place-items:center;background:#d8ff5b;color:#11150c;font-size:11px;font-weight:950}
  #levelup-account-chip .account-name{min-width:0;max-width:154px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #levelup-account-chip.is-signed-in{border-color:rgba(216,255,91,.38)}

  @media(max-width:600px){
    .levelup-top-actions{gap:6px}
    #levelup-account-chip{max-width:132px;padding-right:8px}
    #levelup-account-chip .account-name{max-width:88px}
  }
  @media(max-width:390px){
    #levelup-account-chip{max-width:104px}
    #levelup-account-chip .account-name{max-width:60px}
  }
</style>
<button id="levelup-refresh" type="button" aria-label="最新のLEVEL UPトップページに更新する">
  <span class="refresh-icon" aria-hidden="true">↻</span><span>更新</span>
</button>
<script>
  (() => {
    const refreshKey = '_levelup_refresh';
    const current = new URL(location.href);
    if (current.searchParams.has(refreshKey)) {
      current.searchParams.delete(refreshKey);
      history.replaceState(null, '', current.pathname + (current.search ? current.search : '') + current.hash);
    }

    const button = document.getElementById('levelup-refresh');
    button?.addEventListener('click', () => {
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      const url = new URL(location.href);
      url.searchParams.set(refreshKey, Date.now().toString());
      location.replace(url.toString());
    });

    const header = document.querySelector('.top');
    const gamesLink = header?.querySelector('a[href*="games.hitobito.jp"]') || header?.querySelector('a');
    if (!header || !gamesLink) return;

    const actions = document.createElement('div');
    actions.className = 'levelup-top-actions';
    header.insertBefore(actions, gamesLink);

    const accountChip = document.createElement('button');
    accountChip.id = 'levelup-account-chip';
    accountChip.type = 'button';
    accountChip.setAttribute('aria-label', 'LEVEL UP アカウントを開く');
    actions.appendChild(accountChip);
    actions.appendChild(gamesLink);

    const userName = (user) => {
      const displayName = String(user?.displayName || '').trim();
      if (displayName) return displayName;
      const emailName = String(user?.email || '').split('@')[0].trim();
      return emailName || 'LEVEL UP ユーザー';
    };

    const makeFallback = (name) => {
      const fallback = document.createElement('span');
      fallback.className = 'account-avatar-fallback';
      fallback.setAttribute('aria-hidden', 'true');
      fallback.textContent = (name || 'L').slice(0, 1).toUpperCase();
      return fallback;
    };

    const renderAccount = (user) => {
      const name = user ? userName(user) : 'ログイン';
      const nameNode = document.createElement('span');
      nameNode.className = 'account-name';
      nameNode.textContent = name;

      let avatarNode = makeFallback(user ? name : 'L');
      if (user?.photoURL) {
        const image = document.createElement('img');
        image.className = 'account-avatar';
        image.src = user.photoURL;
        image.alt = '';
        image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => image.replaceWith(makeFallback(name)), { once: true });
        avatarNode = image;
      }

      accountChip.replaceChildren(avatarNode, nameNode);
      accountChip.classList.toggle('is-signed-in', Boolean(user));
      accountChip.title = user ? name : 'Googleでログイン';
      accountChip.setAttribute('aria-label', user ? name + ' のLEVEL UPアカウントを開く' : 'Googleでログイン');
    };

    const openAccountPanel = () => {
      const trigger = document.getElementById('levelup-account-root')?.shadowRoot?.querySelector('.trigger');
      trigger?.click();
    };
    accountChip.addEventListener('click', openAccountPanel);
    renderAccount(null);

    let authBound = false;
    let floatingHidden = false;
    let attempts = 0;
    const connectAccount = () => {
      attempts += 1;

      if (!floatingHidden) {
        const floatingTrigger = document.getElementById('levelup-account-root')?.shadowRoot?.querySelector('.trigger');
        if (floatingTrigger) {
          floatingTrigger.style.display = 'none';
          floatingHidden = true;
        }
      }

      if (!authBound && window.firebase?.auth && window.firebase?.apps?.length) {
        try {
          window.firebase.auth().onAuthStateChanged(renderAccount);
          authBound = true;
        } catch (error) {
          console.warn('[LEVEL UP header account] auth binding failed', error);
        }
      }

      if ((!authBound || !floatingHidden) && attempts < 120) setTimeout(connectAccount, 100);
    };
    connectAccount();
  })();
</script>
`;

  if (html.includes('</body>')) html = html.replace('</body>', `${snippet}</body>`);
  else html += snippet;
  fs.writeFileSync(homePath, html);
}

const finalHtml = fs.readFileSync(homePath, 'utf8');
if (!finalHtml.includes(marker)) {
  throw new Error('LEVEL UP refresh button injection failed.');
}
if (!finalHtml.includes('levelup-account-chip')) {
  throw new Error('LEVEL UP header account injection failed.');
}

console.log('[Firebase] LEVEL UP refresh button + header account injected');
