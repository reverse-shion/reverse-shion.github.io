/* /di/js/notes/skin-tarot-pinkgold.js
   DiCo NOTE SKIN (IMAGE-BASED tarot pink-gold)
   - Asset path fixed: /di/idle/note-tarot-pinkgold.png
   - Solid image core + pulse glow + sparkles + streak
   - iOS safe / cache friendly
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  const CFG = {
    w: 44,
    h: 64,
    glow: 1.6,
    pulse: 1.15,
    spark: 1.1,
    imgSrc: "/di/idle/note-tarot-pinkgold.png", // ← 固定
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---- image loader (cached once) ----
  const IMG = new Image();
  IMG.decoding = "async";
  IMG.src = CFG.imgSrc;

  // ---- effects ----
  function drawGlow(ctx, x, y, p, a) {
    const t = performance.now() / 1000;
    const pulse = (0.72 + 0.28 * Math.sin(t * 6.0 + p * 1.2)) * CFG.pulse;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.28 + p * 0.60) * CFG.glow * pulse;

    const g = ctx.createRadialGradient(x, y, 0, x, y, 56);
    g.addColorStop(0, "rgba(255,255,255,0.70)");
    g.addColorStop(0.20, "rgba(255,220,240,0.60)");
    g.addColorStop(0.48, "rgba(255,245,210,0.35)");
    g.addColorStop(1, "rgba(255,170,230,0.0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSparkles(ctx, x, y, p, a) {
    if (CFG.spark <= 0) return;
    const t = performance.now() / 1000;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.18 + p * 0.40) * CFG.spark;

    const r = 28 + p * 12;
    for (let i = 0; i < 6; i++) {
      const ang = t * (1.1 + i * 0.08) + i * 1.3;
      const sx = x + Math.cos(ang) * r;
      const sy = y + Math.sin(ang) * (r * 0.7);
      const s = 1.2 + (i % 3) * 0.6;

      ctx.fillStyle = i % 2
        ? "rgba(255,235,200,1)"
        : "rgba(255,200,240,1)";
      ctx.fillRect(sx, sy, s, s);

      if (i % 3 === 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy);
        ctx.lineTo(sx + 3, sy);
        ctx.moveTo(sx, sy - 3);
        ctx.lineTo(sx, sy + 3);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawStreak(ctx, x, y, p, a) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // white core
    ctx.globalAlpha = a * (0.20 + p * 0.30);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.shadowColor = "rgba(255,255,255,0.60)";
    ctx.shadowBlur = 10 + p * 12;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y - 86);
    ctx.stroke();

    // gold outer
    ctx.globalAlpha = a * (0.16 + p * 0.22);
    ctx.strokeStyle = "rgba(255,225,170,0.80)";
    ctx.shadowColor = "rgba(255,190,235,0.65)";
    ctx.shadowBlur = 14 + p * 14;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y - 86);
    ctx.stroke();

    ctx.restore();
  }

  // ---- public API ----
  NS.noteSkin = {
    name: "tarot-pinkgold-img",
    cfg: CFG,

    drawNote(ctx, x, y, alpha, p /* 0..1 */, meta) {
      const a = clamp(alpha, 0, 1);
      const pp = clamp(p * 1.05 + 0.03, 0, 1);

      const w = CFG.w * (0.94 + pp * 0.20);
      const h = CFG.h * (0.94 + pp * 0.20);
      const xx = x - w / 2;
      const yy = y - h / 2;

      // 1) glow behind
      drawGlow(ctx, x, y, pp, a);

      // 2) draw image (solid core)
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = a * (0.94 + pp * 0.18);

      if (IMG.complete && IMG.naturalWidth > 0) {
        ctx.drawImage(IMG, xx, yy, w, h);
      } else {
        // fallback while loading
        ctx.fillStyle = "rgba(255,220,240,0.75)";
        ctx.fillRect(xx, yy, w, h);
      }
      ctx.restore();

      // 3) highlight overlay (adds punch)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = a * (0.22 + pp * 0.35);

      const hg = ctx.createLinearGradient(xx, yy, xx + w, yy + h);
      hg.addColorStop(0, "rgba(255,255,255,0.55)");
      hg.addColorStop(0.35, "rgba(255,245,210,0.25)");
      hg.addColorStop(1, "rgba(255,170,230,0.0)");
      ctx.fillStyle = hg;
      ctx.fillRect(xx, yy, w, h);
      ctx.restore();

      // 4) sparkles + streak
      drawSparkles(ctx, x, y, pp, a);
      drawStreak(ctx, x, y, pp, a);
    },
  };
})();
