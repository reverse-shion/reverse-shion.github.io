window.TB?.ready(() => {
  const layers = [...document.querySelectorAll('[data-parallax]')];
  if (!layers.length) return;

  const handleMove = (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallax || 0.1);
      layer.style.transform = `translate3d(${x * depth * 20}px, ${y * depth * 20}px, 0)`;
    });
  };

  window.addEventListener('mousemove', handleMove, { passive: true });
});
