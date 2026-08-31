(() => {
  'use strict';
  if (window.__OSG_RUNTIME__) return;
  window.__OSG_RUNTIME__ = true;
  const CREATOR_ORIGIN = 'https://osg.hitobito.jp';
  const script = document.currentScript;
  const gameId = script?.dataset.gameId || '';
  const author = script?.dataset.author || 'oneshotgames';
  const title = script?.dataset.title || document.title || 'OneShotGames';
  const style = document.createElement('style');
  style.textContent = `#osg-runtime{position:fixed;z-index:2147483000;left:10px;right:10px;top:max(10px,env(safe-area-inset-top));display:flex;justify-content:space-between;align-items:center;gap:10px;pointer-events:none;font-family:Inter,system-ui,-apple-system,sans-serif}#osg-runtime a,#osg-runtime button{pointer-events:auto;border:1px solid rgba(255,255,255,.22);background:rgba(7,19,59,.86);color:#fff;border-radius:999px;min-height:38px;padding:8px 12px;font:800 11px/1.1 Inter,system-ui,sans-serif;backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(0,0,0,.18);text-decoration:none}#osg-runtime .brand{display:flex;align-items:center;gap:7px}#osg-runtime .brand:before{content:'▶';display:grid;place-items:center;width:21px;height:21px;border-radius:50%;background:linear-gradient(135deg,#ff5a1f,#ffbf00);font-size:9px}#osg-runtime .actions{display:flex;gap:7px}#osg-runtime .author{color:#cbd7ff}@media(max-width:560px){#osg-runtime .author{display:none}}`;
  document.head.appendChild(style);
  const host = document.createElement('div');
  host.id = 'osg-runtime';
  host.innerHTML = `<a class="brand" href="${CREATOR_ORIGIN}/" rel="noopener">OneShotGames <span class="author">@${escapeHtml(author)}</span></a><div class="actions"><button type="button" data-osg-share>シェア</button></div>`;
  document.body.appendChild(host);
  host.querySelector('[data-osg-share]').addEventListener('click', async () => {
    const url = gameId ? `${location.origin}/g/${encodeURIComponent(gameId)}/` : location.href;
    const data = { title, text: `${title}｜OneShotGames`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        const button = host.querySelector('[data-osg-share]');
        const before = button.textContent;
        button.textContent = 'URLコピー済み';
        setTimeout(() => { button.textContent = before; }, 1300);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('[OSG] share failed', error);
    }
  });
  function escapeHtml(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
})();
