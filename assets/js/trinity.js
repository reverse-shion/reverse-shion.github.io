(() => {
  const video = document.getElementById('trinityVideo');
  if (!video) return;

  let isControlled = false;

  function toggleLoopPlay() {
    if (video.paused) {
      try { video.muted = false; } catch(e){}
      video.loop = true;
      video.onended = null;
      video.play().catch(()=>{});
      isControlled = true;
    } else {
      video.pause();
    }
  }

  function setupVideoControls() {
    if (isControlled) return;
    video.onended = () => { video.pause(); };
    video.addEventListener('click', toggleLoopPlay);
    video.addEventListener('touchend', toggleLoopPlay, { passive:true });
    video.setAttribute('tabindex','0');
    video.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.code === 'Space' || e.key === ' '){
        e.preventDefault(); toggleLoopPlay();
      }
    });
  }

  video.addEventListener('loadedmetadata', () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(setupVideoControls).catch(()=>{ setupVideoControls(); });
    }
  });

  if (video.readyState >= 3) {
    video.play().catch(()=>{});
    setupVideoControls();
  }

  // 初回ヒントのフェード
  let hintShown = false;
  video.addEventListener('play', ()=>{
    if (!hintShown) {
      const hint = document.querySelector('.trinity__hint');
      if (hint){ hint.style.opacity = '.6'; setTimeout(()=>hint.style.opacity='.3', 1500); }
      hintShown = true;
    }
    <script>
(() => {
  const v = document.getElementById('trinityVideo');
  if (!v) return;

  // 404等で最初の<source>が失敗した場合の保険
  v.addEventListener('error', () => {
    // ソースを両方作り直して再トライ（パスは実体に合わせて）
    v.pause();
    v.removeAttribute('src'); // 既存の読み込み状態をリセット
    v.innerHTML = `
      <source src="/assets/trinity/loop.mp4" type="video/mp4">
      <source src="/assets/trinity/loop.webm" type="video/webm">
    `;
    v.load();
    v.play().catch(()=>{ /* ユーザー操作待ちでもOK */ });
  }, true);
})();
</script>
  }, { once: true });
})();
