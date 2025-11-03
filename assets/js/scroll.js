// /assets/js/scroll.js
// スクロール出現（reveal）。data-reveal="off" のページでは無効化。

(() => {
  const root = document.querySelector('[data-reveal="off"]');
  if (root) return; // ← 零書などでは何もしない

  const items = document.querySelectorAll('[data-reveal], .reveal');
  if (!items.length) return;

  const io = new IntersectionObserver((ents) => {
    ents.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add('is-revealed');
        io.unobserve(ent.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  items.forEach(el => io.observe(el));
})();
