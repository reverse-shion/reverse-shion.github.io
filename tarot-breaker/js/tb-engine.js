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
    selectors: {
      reveal: '.reveal'
    }
  };
})();
