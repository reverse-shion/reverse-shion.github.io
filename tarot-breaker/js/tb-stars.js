window.TB?.ready(() => {
  const canvas = document.getElementById('tb-star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  const makeStars = (count) => {
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3,
      a: Math.random() * 0.7 + 0.2,
      v: Math.random() * 0.015 + 0.003
    }));
  };

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    makeStars(Math.max(80, Math.floor(window.innerWidth * 0.12)));
  };

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a += s.v;
      if (s.a > 1 || s.a < 0.15) s.v *= -1;
      ctx.fillStyle = `rgba(210,220,255,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  };

  resize();
  tick();
  window.addEventListener('resize', resize);
});
