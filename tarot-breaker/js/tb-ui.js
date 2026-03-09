window.TB?.ready(() => {
  const nodes = document.querySelectorAll(window.TB.selectors.reveal);
  if (!nodes.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

  nodes.forEach((node) => observer.observe(node));
});
