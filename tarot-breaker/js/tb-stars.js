window.TB?.ready(() => {
  const canvas = document.getElementById("tb-star-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let rafId = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;

  const DPR_MAX = 1.8;

  let farStars = [];
  let midStars = [];
  let nearStars = [];
  let dust = [];
  let shootingStars = [];
  let phase = 0;

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const STAR_TONES = [
    [255, 244, 214], // warm white
    [212, 228, 255], // pale blue
    [180, 200, 255], // blue
    [224, 205, 255], // violet
    [255, 223, 166], // gold
  ];

  function setSize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width || window.innerWidth || document.documentElement.clientWidth));
    h = Math.max(1, Math.floor(rect.height || window.innerHeight || document.documentElement.clientHeight));
    dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeStar(layer) {
    const baseYBias =
      layer === "far" ? rand(0, 1) :
      layer === "mid" ? rand(0, 1) :
      rand(0.05, 1);

    const radius =
      layer === "far" ? rand(0.35, 1.0) :
      layer === "mid" ? rand(0.8, 1.8) :
      rand(1.2, 2.8);

    const alpha =
      layer === "far" ? rand(0.16, 0.48) :
      layer === "mid" ? rand(0.30, 0.78) :
      rand(0.55, 1.0);

    return {
      x: rand(0, w),
      y: Math.pow(baseYBias, 1.15) * h,
      r: radius,
      a: alpha,
      baseA: alpha,
      tw: rand(0.004, 0.02),
      twOffset: rand(0, Math.PI * 2),
      driftX: rand(-0.006, 0.006),
      driftY: rand(0.002, 0.014),
      tone: pick(STAR_TONES),
      halo:
        layer === "far" ? Math.random() > 0.92 :
        layer === "mid" ? Math.random() > 0.72 :
        true,
      cross:
        layer === "near" ? Math.random() > 0.72 :
        Math.random() > 0.95,
      layer,
    };
  }

  function makeDust() {
    return {
      x: rand(0, w),
      y: rand(0, h),
      r: rand(24, 84),
      a: rand(0.015, 0.06),
      vx: rand(-0.02, 0.02),
      vy: rand(-0.01, 0.03),
      tone: pick([
        [120, 145, 255],
        [155, 126, 238],
        [255, 212, 146],
      ]),
    };
  }

  function seedField() {
    farStars = Array.from({ length: Math.max(160, Math.floor(w * 0.22)) }, () => makeStar("far"));
    midStars = Array.from({ length: Math.max(110, Math.floor(w * 0.14)) }, () => makeStar("mid"));
    nearStars = Array.from({ length: Math.max(42, Math.floor(w * 0.045)) }, () => makeStar("near"));
    dust = Array.from({ length: Math.max(18, Math.floor(w * 0.012)) }, makeDust);
    shootingStars = [];
  }

  function respawnStar(s) {
    s.x = rand(0, w);
    s.y = -10;
    s.r =
      s.layer === "far" ? rand(0.35, 1.0) :
      s.layer === "mid" ? rand(0.8, 1.8) :
      rand(1.2, 2.8);
    s.baseA =
      s.layer === "far" ? rand(0.16, 0.48) :
      s.layer === "mid" ? rand(0.30, 0.78) :
      rand(0.55, 1.0);
    s.a = s.baseA;
    s.tw = rand(0.004, 0.02);
    s.twOffset = rand(0, Math.PI * 2);
    s.driftX = rand(-0.006, 0.006);
    s.driftY =
      s.layer === "far" ? rand(0.001, 0.006) :
      s.layer === "mid" ? rand(0.002, 0.012) :
      rand(0.004, 0.02);
    s.tone = pick(STAR_TONES);
    s.halo =
      s.layer === "far" ? Math.random() > 0.92 :
      s.layer === "mid" ? Math.random() > 0.72 :
      true;
    s.cross =
      s.layer === "near" ? Math.random() > 0.72 :
      Math.random() > 0.95;
  }

  function respawnDust(d) {
    d.x = rand(0, w);
    d.y = rand(0, h);
    d.r = rand(24, 84);
    d.a = rand(0.015, 0.06);
    d.vx = rand(-0.02, 0.02);
    d.vy = rand(-0.01, 0.03);
    d.tone = pick([
      [120, 145, 255],
      [155, 126, 238],
      [255, 212, 146],
    ]);
  }

  function maybeSpawnShootingStar() {
    if (Math.random() > 0.007) return;

    const fromLeft = Math.random() > 0.5;
    shootingStars.push({
      x: fromLeft ? rand(-120, -40) : rand(w + 40, w + 120),
      y: rand(0, h * 0.42),
      vx: fromLeft ? rand(8, 13) : rand(-13, -8),
      vy: rand(2.4, 4.8),
      len: rand(90, 180),
      life: 0,
      maxLife: rand(26, 42),
      tone: pick([
        [255, 236, 198],
        [210, 225, 255],
        [198, 204, 255],
      ]),
    });
  }

  function drawNebulaBackdrop(t) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#08101f");
    g.addColorStop(0.38, "#050915");
    g.addColorStop(1, "#03060f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const pulse = (Math.sin(t * 0.00022) + 1) * 0.5;

    const n1 = ctx.createRadialGradient(w * 0.18, h * 0.18, 0, w * 0.18, h * 0.18, w * 0.42);
    n1.addColorStop(0, `rgba(110, 126, 255, ${0.11 + pulse * 0.03})`);
    n1.addColorStop(1, "rgba(110,126,255,0)");
    ctx.fillStyle = n1;
    ctx.fillRect(0, 0, w, h);

    const n2 = ctx.createRadialGradient(w * 0.78, h * 0.22, 0, w * 0.78, h * 0.22, w * 0.28);
    n2.addColorStop(0, "rgba(235, 192, 118, 0.08)");
    n2.addColorStop(1, "rgba(235,192,118,0)");
    ctx.fillStyle = n2;
    ctx.fillRect(0, 0, w, h);

    const n3 = ctx.createRadialGradient(w * 0.62, h * 0.74, 0, w * 0.62, h * 0.74, w * 0.4);
    n3.addColorStop(0, "rgba(136, 108, 226, 0.10)");
    n3.addColorStop(1, "rgba(136,108,226,0)");
    ctx.fillStyle = n3;
    ctx.fillRect(0, 0, w, h);

    const vignette = ctx.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, "rgba(2, 4, 10, 0.00)");
    vignette.addColorStop(0.72, "rgba(2, 4, 10, 0.08)");
    vignette.addColorStop(1, "rgba(1, 2, 6, 0.30)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function drawDustField() {
    for (const d of dust) {
      d.x += d.vx;
      d.y += d.vy;

      if (d.x < -d.r || d.x > w + d.r || d.y < -d.r || d.y > h + d.r) {
        respawnDust(d);
      }

      const [r, g, b] = d.tone;
      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${d.a})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStar(s, t) {
    s.x += s.driftX;
    s.y += s.driftY;

    if (s.x < -12) s.x = w + 12;
    if (s.x > w + 12) s.x = -12;
    if (s.y > h + 12) respawnStar(s);

    const twinkle = 0.5 + 0.5 * Math.sin(t * s.tw + s.twOffset);
    const a = Math.max(0.06, Math.min(1, s.baseA * (0.72 + twinkle * 0.56)));
    const [r, g, b] = s.tone;

    if (s.halo) {
      const haloR = s.r * (s.layer === "near" ? 8.5 : s.layer === "mid" ? 5.5 : 3.8);
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a * 0.22})`);
      glow.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${a * 0.08})`);
      glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();

    if (s.cross) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.42})`;
      ctx.lineWidth = 0.8;
      const len = s.r * 4.4;
      ctx.beginPath();
      ctx.moveTo(s.x - len, s.y);
      ctx.lineTo(s.x + len, s.y);
      ctx.moveTo(s.x, s.y - len);
      ctx.lineTo(s.x, s.y + len);
      ctx.stroke();
    }
  }

  function drawShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.life += 1;
      s.x += s.vx;
      s.y += s.vy;

      const p = s.life / s.maxLife;
      const alpha = Math.max(0, 1 - p);
      const [r, g, b] = s.tone;

      const tx = s.x - s.vx * (s.len / Math.max(1, Math.abs(s.vx)));
      const ty = s.y - s.vy * (s.len / Math.max(1, Math.abs(s.vy)));

      const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.95})`);
      grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      const head = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 10);
      head.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      head.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
      ctx.fill();

      if (s.life >= s.maxLife || s.x < -220 || s.x > w + 220 || s.y > h + 120) {
        shootingStars.splice(i, 1);
      }
    }
  }

  function render(t) {
    phase += 0.003;
    ctx.clearRect(0, 0, w, h);

    drawNebulaBackdrop(t);
    drawDustField();

    for (const s of farStars) drawStar(s, t);
    for (const s of midStars) drawStar(s, t);
    for (const s of nearStars) drawStar(s, t);

    maybeSpawnShootingStar();
    drawShootingStars();

    rafId = requestAnimationFrame(render);
  }

  function rebuild() {
    setSize();
    seedField();
  }

  rebuild();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(render);

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      rebuild();
    }, 120);
  };

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
});
