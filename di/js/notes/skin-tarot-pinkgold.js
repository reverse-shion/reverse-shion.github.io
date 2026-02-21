/* /di/js/notes/skin-tarot-pinkgold.js
   DiCo NOTE SKIN (IMAGE-BASED tarot pink-gold) - PRO
   - Asset: /di/idle/note-tarot-pinkgold.png
   - Bigger + "emissive card" look (not flat image)
   - Minimize tint on transparent area (clip + edge-only glow)
   - iOS/Safari safe: cache-bust option + robust load guard
*/
(() => {
  "use strict";

  const NS = (window.DI_ENGINE ||= {});

  const CFG = {
    // slightly bigger (was 44x64)
    w: 50,
    h: 72,
    radius: 10,

    // emissive tuning (subtle, not noisy)
    pulse: 1.05,       // breathing strength
    edgeGlow: 1.10,    // border emission
    halo: 0.55,        // outer halo strength (keep low to avoid tinting lanes)
    core: 0.40,        // inner core lift

    // optional sparkle/streak (kept subtle to avoid tint)
    spark: 0.65,
    streak: 0.70,

    // asset path (fixed)
    imgSrc: "/di/idle/note-tarot-pinkgold.png",

    // cache bust for debugging (set true only when needed)
    bust: false,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // ---- image loader (single instance) ----
  const IMG = new Image();
  IMG.decoding = "async";

  // cache bust only when you need to force reload
  IMG.src = CFG.bust ? `${CFG.imgSrc}?v=${Date.now()}` : CFG.imgSrc;

  let IMG_OK = false;
  IMG.onload = () => { IMG_OK = true; };
  IMG.onerror = () => { IMG_OK = false; };

  // ---- draw helpers ----

  function setHiQualitySampling(ctx) {
    // iOS/Safari: may ignore "high" but harmless
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = "high"; } catch (_) {}
  }

  /**
   * Outer halo: keep weak and centered so it doesn't tint transparent area too much.
   */
  function drawOuterHalo(ctx, cx, cy, p, a) {
    const t = performance.now() / 1000;
    const breathe = (0.78 + 0.22 * Math.sin(t * 6.0 + p * 1.1)) * CFG.pulse;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * CFG.halo * (0.12 + p * 0.22) * breathe;

    const r = 44 + p * 10;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,0.28)");
    g.addColorStop(0.25, "rgba(255,220,240,0.20)");
    g.addColorStop(0.55, "rgba(255,240,205,0.12)");
    g.addColorStop(1, "rgba(255,170,230,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Edge-only glow: clip to the card shape so glow doesn't spill into transparent pixels.
   * This is the key to "no tint on transparent area".
   */
  function drawEdgeGlow(ctx, x, y, w, h, p, a) {
    const t = performance.now() / 1000;
    const breathe = (0.80 + 0.20 * Math.sin(t * 6.2 + p * 1.3)) * CFG.pulse;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // clip to card silhouette
    roundRectPath(ctx, x, y, w, h, CFG.radius);
    ctx.clip();

    // draw a strong-ish stroke with shadow (inside clip => stays on-card)
    ctx.globalAlpha = a * (0.22 + p * 0.30) * CFG.edgeGlow * breathe;

    ctx.lineWidth = 3.4;
    ctx.shadowColor = "rgba(255,210,180,0.95)";
    ctx.shadowBlur = 16 + p * 12;

    const br = ctx.createLinearGradient(x, y, x + w, y + h);
    br.addColorStop(0, "rgba(255,170,230,0.95)");
    br.addColorStop(0.55, "rgba(255,245,205,0.98)");
    br.addColorStop(1, "rgba(255,120,210,0.95)");
    ctx.strokeStyle = br;

    roundRectPath(ctx, x + 1.0, y + 1.0, w - 2.0, h - 2.0, CFG.radius - 0.6);
    ctx.stroke();

    // inner white rim (crispness)
    ctx.shadowBlur = 0;
    ctx.globalAlpha = a * (0.10 + p * 0.16) * breathe;
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    roundRectPath(ctx, x + 2.4, y + 2.4, w - 4.8, h - 4.8, CFG.radius - 1.4);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Core lift: VERY subtle. Makes it feel emissive, not flat.
   * Also clipped to card so it won't tint transparent background.
   */
  function drawInnerCore(ctx, x, y, w, h, p, a) {
    const t = performance.now() / 1000;
    const breathe = (0.82 + 0.18 * Math.sin(t * 5.4 + p * 0.9)) * CFG.pulse;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    roundRectPath(ctx, x, y, w, h, CFG.radius);
    ctx.clip();

    ctx.globalAlpha = a * CFG.core * (0.10 + p * 0.22) * breathe;

    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(255,255,255,0.22)");
    g.addColorStop(0.40, "rgba(255,235,210,0.10)");
    g.addColorStop(1, "rgba(255,170,230,0.00)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    ctx.restore();
  }

  function drawSparkles(ctx, cx, cy, p, a) {
    if (CFG.spark <= 0) return;
    const t = performance.now() / 1000;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * CFG.spark * (0.08 + p * 0.18);

    const r = 24 + p * 10;
    for (let i = 0; i < 4; i++) {
      const ang = t * (1.0 + i * 0.12) + i * 1.7;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * (r * 0.7);

      ctx.fillStyle = i % 2 ? "rgba(255,235,200,0.95)" : "rgba(255,200,240,0.95)";
      ctx.fillRect(x, y, 1.6, 1.6);

      if (i === 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.70)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3);
        ctx.lineTo(x, y + 3);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawStreak(ctx, cx, cy, p, a) {
    if (CFG.streak <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const strength = a * CFG.streak * (0.10 + p * 0.18);

    // white core
    ctx.globalAlpha = strength * 1.0;
    ctx.strokeStyle = "rgba(255,255,255,0.70)";
    ctx.shadowColor = "rgba(255,255,255,0.45)";
    ctx.shadowBlur = 10 + p * 10;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy - 86);
    ctx.stroke();

    // gold outer
    ctx.globalAlpha = strength * 0.75;
    ctx.strokeStyle = "rgba(255,225,170,0.65)";
    ctx.shadowColor = "rgba(255,190,235,0.45)";
    ctx.shadowBlur = 12 + p * 12;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy - 86);
    ctx.stroke();

    ctx.restore();
  }

  // ---- public API ----
  NS.noteSkin = {
    name: "tarot-pinkgold-img-pro",
    cfg: CFG,

    drawNote(ctx, x, y, alpha, p /* 0..1 */, meta) {
      const a = clamp(alpha, 0, 1);
      const pp = clamp(p * 1.06 + 0.02, 0, 1);

      // subtle scale pulse (too much looks "floaty")
      const scale = 0.98 + pp * 0.14;

      const w = CFG.w * scale;
      const h = CFG.h * scale;
      const xx = x - w / 2;
      const yy = y - h / 2;

      // 0) outer halo (weak) - helps "emissive" feel
      drawOuterHalo(ctx, x, y, pp, a);

      // 1) draw image (solid core, no screen here => avoids tinting)
      ctx.save();
      setHiQualitySampling(ctx);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = a * 0.98;

      if (IMG_OK && IMG.naturalWidth > 0) {
        ctx.drawImage(IMG, xx, yy, w, h);
      } else {
        // ultra-safe fallback (transparent-safe)
        roundRectPath(ctx, xx, yy, w, h, CFG.radius);
        ctx.fillStyle = "rgba(255,220,240,0.35)";
        ctx.fill();
      }
      ctx.restore();

      // 2) emissive treatments (ALL clipped to card => no tint on transparent area)
      drawInnerCore(ctx, xx, yy, w, h, pp, a);
      drawEdgeGlow(ctx, xx, yy, w, h, pp, a);

      // 3) optional subtle spark/streak (kept low to avoid lane tint)
      drawSparkles(ctx, x, y, pp, a);
      drawStreak(ctx, x, y, pp, a);
    },
  };
})();
