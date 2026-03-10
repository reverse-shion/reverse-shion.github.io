window.TB?.ready(() => {
  const canvas = document.getElementById('tb-star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let stars = [];
  let rafId = 0;

  const DPR_MAX = 1.8;

  const ensureSize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || window.innerWidth || document.documentElement.clientWidth));
    const height = Math.max(1, Math.floor(rect.height || window.innerHeight || document.documentElement.clientHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { width, height };
  };

  const makeStars = (count, width, height) => {
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() > 0.84 ? Math.random() * 1.7 + 1.25 : Math.random() * 1.25 + 0.35,
      a: Math.random() > 0.82 ? Math.random() * 0.35 + 0.6 : Math.random() * 0.5 + 0.28,
      v: Math.random() * 0.016 + 0.004,
      tone: Math.random() > 0.78
        ? [255, 224, 170]
        : Math.random() > 0.5
          ? [209, 224, 255]
          : [186, 203, 255],
      halo: Math.random() > 0.86
    }));
  };

  const resize = () => {
    const { width, height } = ensureSize();
    makeStars(Math.max(120, Math.floor(width * 0.2)), width, height);
  };

  const tick = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    ctx.clearRect(0, 0, width, height);

    for (const s of stars) {
      s.a += s.v;
      if (s.a > 1 || s.a < 0.15) {
        s.v *= -1;
      }

      const [r, g, b] = s.tone;
      if (s.halo) {
        const halo = s.r * 5.2;
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, halo);
        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${Math.min(0.44, s.a * 0.4)})`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, halo, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, s.a)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(tick);
  };

  resize();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
});
