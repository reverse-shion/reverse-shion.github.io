/* ===== scroll.js ===== */
(() => {
  const toTop = document.querySelector('.to-top');
  if (!toTop) return;

  window.addEventListener('scroll', () => {
    toTop.classList.toggle('show', window.scrollY > 300);
  });

  toTop.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
