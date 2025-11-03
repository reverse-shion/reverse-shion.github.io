/* -------------------------------------------------------
   reveal.js — 1行ずつ表示を安定させる共通スクリプト
   対象: .book-body .mode--poem .line
------------------------------------------------------- */
(() => {
  const main = document.getElementById('main');
  if (!main || main.dataset.reveal === 'off') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lines = Array.from(document.querySelectorAll('.book-body .mode--poem .line'));
  if (!lines.length) return;

  // モーション無効ユーザーは即時表示
  if (prefersReduced) {
    lines.forEach(el => el.classList.add('is-in'));
    return;
  }

  // 既に表示済みのものがあれば一旦初期状態へ（再入場対策）
  lines.forEach(el => el.classList.remove('is-in'));

  // IntersectionObserverで全行を監視
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target); // 一度表示したら監視解除（パフォーマンス安定）
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px', // 下側に少し余裕を持たせて自然に
    threshold: 0.12
  });

  // すべての行を監視開始
  lines.forEach(el => io.observe(el));

  // タブ切り替えで詩パネルを再表示したときのフォールバック
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[role="tab"]');
    if (!tabBtn) return;

    // 「詩」タブに切り替わったら、未表示行を再監視
    const selectedId = tabBtn.getAttribute('aria-controls');
    if (selectedId === 'panel-poem') {
      const freshLines = Array.from(document.querySelectorAll('.book-body .mode--poem .line:not(.is-in)'));
      freshLines.forEach(el => io.observe(el));
    }
  }, { passive: true });
})();
