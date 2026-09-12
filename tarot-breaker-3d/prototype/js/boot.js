const start = document.getElementById('start');

start.addEventListener('click', async () => {
  start.disabled = true;
  document.getElementById('start-status').textContent = '星界へつないでいます…';

  // Prime BGM directly from the user's tap. This is important on iPhone/iPad,
  // where starting audio only after async loading can lose the user gesture.
  const initialAudio = new Audio(new URL('../../../audio/seifu-raguna.mp3?v=p2-1.2.0', import.meta.url).href);
  initialAudio.loop = true;
  initialAudio.volume = 0.34;
  initialAudio.preload = 'auto';
  try {
    const play = initialAudio.play();
    if (play?.catch) play.catch(() => {});
  } catch (_) {}

  try {
    const { startGame } = await import('./app.js?v=p2-1.2.0');
    await startGame({ initialAudio, initialSoundEnabled: true });
  } catch (error) {
    initialAudio.pause();
    console.error('Phase 2 startup:', error);
    document.getElementById('start-status').textContent = '星界を開けませんでした。通信状態を確かめて、もう一度試してください。';
    start.textContent = 'もう一度試す';
    start.disabled = false;
  }
});
