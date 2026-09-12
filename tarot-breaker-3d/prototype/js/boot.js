const start = document.getElementById('start');
const status = document.getElementById('start-status');

start.addEventListener('click', async () => {
  start.disabled = true;
  status.hidden = false;
  status.textContent = '星の国へ——';

  const initialAudio = new Audio(new URL('../../../audio/seifu-raguna.mp3?v=star-country-v1.0', import.meta.url).href);
  initialAudio.loop = true;
  initialAudio.volume = 0.34;
  initialAudio.preload = 'auto';
  try {
    const play = initialAudio.play();
    if (play?.catch) play.catch(() => {});
  } catch (_) {}

  try {
    const { startGame } = await import('./app.js?v=star-country-v1.0');
    await startGame({ initialAudio, initialSoundEnabled: true });
  } catch (error) {
    initialAudio.pause();
    console.error('Star Country startup:', error);
    status.hidden = false;
    status.textContent = '星の国へ入れませんでした。通信状態を確かめて、もう一度試してください。';
    start.textContent = 'もう一度';
    start.disabled = false;
  }
});
