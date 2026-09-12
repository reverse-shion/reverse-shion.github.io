const start = document.getElementById('start');
start.addEventListener('click', async () => {
  start.disabled = true;
  document.getElementById('start-status').textContent = '星界へつないでいます…';
  try {
    const { startGame } = await import('./app.js?v=p2-1.1.0');
    await startGame();
  } catch (error) {
    console.error('Phase 2 startup:', error);
    document.getElementById('start-status').textContent = '星界を開けませんでした。WebGL 2に対応したブラウザで、通信状態を確かめて再試行してください。';
    start.textContent = 'もう一度試す'; start.disabled = false;
  }
});
