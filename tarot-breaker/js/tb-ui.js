window.TB?.ready(() => {
  const root = document.documentElement;
  const selector = window.TB?.selectors?.reveal || ".reveal";
  const nodes = Array.from(document.querySelectorAll(selector));
  if (!nodes.length) return;

  const revealNow = (node, delay = 0) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.classList.contains("is-visible")) return;

    if (delay <= 0) {
      node.classList.add("is-visible");
      return;
    }

    window.setTimeout(() => {
      node.classList.add("is-visible");
    }, delay);
  };

  const isInInitialViewport = (node) => {
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
  };

  const getStaggerDelay = (node, fallbackIndex = 0) => {
    const custom = node.getAttribute("data-reveal-delay");
    if (custom) {
      const parsed = Number(custom);
      if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
    }

    const parent = node.parentElement;
    if (!parent) return Math.min(fallbackIndex * 70, 280);

    const siblings = Array.from(parent.children).filter((el) =>
      el.matches?.(selector)
    );

    const siblingIndex = siblings.indexOf(node);
    if (siblingIndex >= 0) {
      return Math.min(siblingIndex * 80, 320);
    }

    return Math.min(fallbackIndex * 70, 280);
  };

  nodes.forEach((node) => {
    if (isInInitialViewport(node)) {
      node.classList.add("is-visible");
    }
  });

  root.classList.add("js-enabled");

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node, index) => {
      revealNow(node, Math.min(index * 60, 240));
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, entryIndex) => {
        if (!entry.isIntersecting) return;

        const node = entry.target;
        const delay = node.classList.contains("is-visible")
          ? 0
          : getStaggerDelay(node, entryIndex);

        revealNow(node, delay);
        observer.unobserve(node);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  nodes.forEach((node) => {
    if (!node.classList.contains("is-visible")) {
      observer.observe(node);
    }
  });
});
