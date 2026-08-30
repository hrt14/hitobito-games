(() => {
  const KEY = 'thick-self:theme';
  const root = document.documentElement;
  const button = document.getElementById('themeBtn');
  const meta = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');

  function getSaved(){
    try{
      const value = localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : null;
    }catch{return null;}
  }

  function systemTheme(){
    return media?.matches ? 'dark' : 'light';
  }

  function apply(theme, persist = true){
    const next = theme === 'dark' ? 'dark' : 'light';
    root.dataset.thickTheme = next;
    root.style.colorScheme = next;
    if(document.body) document.body.dataset.thickTheme = next;
    if(meta) meta.setAttribute('content', next === 'dark' ? '#07111d' : '#f6f3ed');
    if(button){
      const goingTo = next === 'dark' ? 'ライトモード' : 'ダークモード';
      button.textContent = next === 'dark' ? '☀︎' : '☾';
      button.setAttribute('aria-label', `${goingTo}に切り替える`);
      button.setAttribute('title', `${goingTo}に切り替える`);
      button.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    }
    if(persist){
      try{localStorage.setItem(KEY, next);}catch{}
    }
  }

  const initial = getSaved() || root.dataset.thickTheme || systemTheme();
  apply(initial, false);

  button?.addEventListener('click', () => {
    apply(root.dataset.thickTheme === 'dark' ? 'light' : 'dark', true);
  });

  media?.addEventListener?.('change', e => {
    if(!getSaved()) apply(e.matches ? 'dark' : 'light', false);
  });
})();
