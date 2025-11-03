/* ===== common.js ===== */

/* スクロール時のヘッダー挙動 */
(() => {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (current <= 0) {
          header.classList.remove('hide', 'scrolling');
        } else if (current > lastScroll) {
          header.classList.add('hide');
          header.classList.remove('scrolling');
        } else {
          header.classList.remove('hide');
          header.classList.add('scrolling');
        }
        lastScroll = current;
        ticking = false;
      });
      ticking = true;
    }
  });

  // タップ中は非表示にならないように
  header.addEventListener('pointerdown', () => header.classList.add('active'));
  header.addEventListener('pointerup', () => header.classList.remove('active'));
})();

/* 現在ページハイライト */
(() => {
  const here = new URL(location.href).pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-main a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || /^https?:/.test(href)) return;
    const target = new URL(href, location.origin).pathname.replace(/\/+$/, '');
    if (target === here) a.setAttribute('aria-current', 'page');
  });
})();
