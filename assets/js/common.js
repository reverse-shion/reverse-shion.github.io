// /assets/js/common.js
// Header: スクロール中は表示、停止後だけ遅延で隠す。ヘッダー操作中は絶対に消えない。

(() => {
  const header = document.querySelector('header.header, header[role="banner"]');
  if (!header) return;

  const HIDE_DELAY = 1400; // 停止後1.4秒で隠す
  let hideTimer = null;
  let lastY = window.scrollY;

  // 常にbodyの上余白を確保（Safariノッチ対応も含む）
  const root = document.documentElement;
  const headerH = getComputedStyle(root).getPropertyValue('--header-h') || '64px';
  document.body.style.paddingTop =
    `calc(${headerH.trim()} + env(safe-area-inset-top, 0px))`;

  function showHeader() {
    header.classList.remove('hide');        // 旧クラス互換
    header.classList.add('is-visible');     // 新クラス（保険）
  }
  function hideHeader() {
    // ヘッダーに触れている間 or フォーカス中は隠さない
    if (header.matches(':hover, :focus-within') || header.dataset.hold === '1') return;
    header.classList.add('hide');
    header.classList.remove('is-visible');
  }

  // スクロールで表示 → 停止したら遅延で隠す
  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    // スクロール中は常に見せる
    showHeader();
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideHeader, HIDE_DELAY);
    lastY = currentY;
  }, { passive: true });

  // ヘッダーに触れている間は固定表示（タップ/ドラッグ/ホバー）
  const holdOn = () => { header.dataset.hold = '1'; showHeader(); if (hideTimer) clearTimeout(hideTimer); };
  const holdOff = () => {
    header.dataset.hold = '0';
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideHeader, HIDE_DELAY);
  };

  header.addEventListener('pointerdown', holdOn);
  header.addEventListener('pointerup', holdOff);
  header.addEventListener('pointercancel', holdOff);
  header.addEventListener('mouseenter', holdOn);
  header.addEventListener('mouseleave', holdOff);

  // 初期表示は出しておく
  showHeader();
})();
