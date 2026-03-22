(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  };

  window.TB = {
    ready,
    register: ready,
    selectors: {
      reveal: '.reveal'
    }
  };
})();
