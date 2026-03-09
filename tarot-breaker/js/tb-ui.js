window.TB?.ready(() => {
  const root = document.documentElement;
  root.classList.add('js-enabled');

  const nodes = document.querySelectorAll(window.TB.selectors.reveal);
  if (!nodes.length) return;

  if (!('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

  nodes.forEach((node) => observer.observe(node));
});
