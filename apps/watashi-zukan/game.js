(() => {
  const parts = [
    'game-1-1.txt','game-1-2.txt','game-1-3.txt','game-1-4.txt',
    'game-2.txt','game-3.txt',
    'game-4-1.txt','game-4-2.txt','game-4-3.txt','game-4-4.txt',
    'game-5.txt'
  ];
  Promise.all(parts.map(async (name) => {
    const response = await fetch(`./${name}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    return response.text();
  }))
    .then((chunks) => (0, eval)(chunks.join('')))
    .catch((error) => {
      console.error('[watashi-zukan] load failed', error);
      const app = document.getElementById('app');
      if (app) app.innerHTML = '<section style="max-width:680px;margin:80px auto;padding:24px;font-family:system-ui"><h1>読み込みに失敗しました</h1><p>人間テストプレイ画面に戻って、もう一度「わたし図鑑」を開いてください。</p></section>';
    });
})();
