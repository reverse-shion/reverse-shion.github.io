(() => {
  const video = document.getElementById('trinityVideo');
  if (!video) return;

  // 初期は無音ループで再生（背景として動いて見せる）
  const tryAutoplay = () => {
    video.muted = true;
    video.loop = true;
    video.play().catch(()=>{/* モバイルは失敗してもOK */});
  };

  // iOSの「タップで音解禁」＋「ループ切れ」対策
  const enableSound = () => {
    // iOSで音を確実に解錠
    try { video.muted = false; } catch(e){}
    // たまに無音フレームから始まって音が出ない対策
    if (video.ended || video.currentTime >= video.duration - 0.05) {
      video.currentTime = 0;
    } else if (video.currentTime === 0) {
      video.currentTime = 0.01; // iOSの無音スキップ対策
    }
    video.loop = true; // 常にループ維持
    video.play().catch(()=>{/* ユーザー操作直後なら通る */});

    // ヒントをフェードアウト
    const hint = document.querySelector('.trinity__hint');
    if (hint) { hint.style.opacity = '.35'; setTimeout(()=>hint.style.opacity='.2', 1200); }
  };

  // endedで止まるケースを強制復帰
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.play().catch(()=>{ /* まれに拒否されてもタップで復帰 */ });
  });

  // タップ/Enter/Spaceで音ON
  const userToggle = (e) => {
    // 2回目以降のタップで一時停止したい場合は下をトグルに
    if (video.muted || video.paused) {
      enableSound();
    } else {
      // 音あり再生中にもう一度タップ → 一時停止（好みで無効化OK）
      video.pause();
    }
  };

  video.addEventListener('click', userToggle, { passive:true });
  video.addEventListener('touchend', userToggle, { passive:true });
  video.setAttribute('tabindex', '0');
  video.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault(); userToggle();
    }
  });

  // 読み込み後に無音ループを試す
  if (video.readyState >= 1) tryAutoplay();
  video.addEventListener('loadedmetadata', tryAutoplay, { once:true });
})();
