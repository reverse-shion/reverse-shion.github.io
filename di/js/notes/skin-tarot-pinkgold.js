/* /di/js/notes/skin-tarot-pinkgold.js
   DiCo NOTE SKIN (tarot pink-gold) - BRIGHT EDIT
   - 形は維持、視認性・派手さを強化
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  // 既定の設定（派手さ調整はここ）
  const CFG = {
    // note size (px) ※少し大きくして判別しやすく
    w: 38,
    h: 54,
    radius: 9,

    // glow intensity
    glow: 1.25,

    // sparkle density
    spark: 1.15,

    // outline/contrast
    ink: 0.40,     // 黒縁っぽい締め（輪郭が溶けるの防止）
    bloom: 1.20,   // 面発光（にじみ）
    pulse: 1.00,   // 鼓動（pに連動）
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

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

  // タロット背面の簡易モチーフ（星＋回路）
  function drawTarotFace(ctx, x, y, w, h, p, a) {
    const t = performance.now() / 1000;

    // ---- base card shape
    roundRectPath(ctx, x, y, w, h, CFG.radius);

    // ---- dark contrast underlay（これが効く：背景動画に負けない輪郭）
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = a * (0.55 * CFG.ink);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill();
    ctx.restore();

    // ---- inner bright body（面を明るく）
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.95 + p * 0.55) * CFG.bloom;

    const body = ctx.createLinearGradient(x, y, x, y + h);
    body.addColorStop(0, `rgba(255,220,240,${0.42})`);
    body.addColorStop(0.45, `rgba(255,140,220,${0.28})`);
    body.addColorStop(1, `rgba(255,235,190,${0.26})`);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.restore();

    // ---- bloom halo around card（“面のにじみ”＝派手さ）
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const pulse = (0.70 + 0.30 * Math.sin(t * 6.2 + p * 1.2)) * CFG.pulse;
    ctx.globalAlpha = a * (0.28 + p * 0.55) * CFG.glow * pulse;

    ctx.shadowColor = "rgba(255,170,230,0.95)";
    ctx.shadowBlur = 22 + p * 18;
    ctx.fillStyle = "rgba(255,170,230,0.22)";
    roundRectPath(ctx, x, y, w, h, CFG.radius);
    ctx.fill();
    ctx.restore();

    // ---- neon border（線を太く＋強く）
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.95 + p * 0.65) * CFG.glow;

    ctx.lineWidth = 3.2;
    ctx.shadowColor = "rgba(255,210,170,0.95)";
    ctx.shadowBlur = 18 + p * 14;

    const br = ctx.createLinearGradient(x, y, x + w, y + h);
    br.addColorStop(0, `rgba(255,170,220,1)`);
    br.addColorStop(0.55, `rgba(255,235,180,1)`);
    br.addColorStop(1, `rgba(255,120,210,1)`);
    ctx.strokeStyle = br;

    roundRectPath(ctx, x, y, w, h, CFG.radius);
    ctx.stroke();
    ctx.restore();

    // ---- inner outline（白で締め）
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.35 + p * 0.30);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    roundRectPath(ctx, x + 2.4, y + 2.4, w - 4.8, h - 4.8, CFG.radius - 1.2);
    ctx.stroke();
    ctx.restore();

    // ---- circuit lines（少し明るく）
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.45 + p * 0.35);
    ctx.lineWidth = 1.2;

    for (let i = 0; i < 4; i++) {
      const xx = x + w * (0.22 + i * 0.18) + Math.sin(t * 0.9 + i) * 0.7;
      ctx.strokeStyle = i % 2 ? "rgba(255,220,150,0.85)" : "rgba(255,150,230,0.80)";
      ctx.beginPath();
      ctx.moveTo(xx, y + h * 0.20);
      ctx.lineTo(xx, y + h * 0.86);

      ctx.moveTo(xx, y + h * 0.44);
      ctx.lineTo(xx + (i % 2 ? 12 : -12), y + h * 0.44);

      ctx.moveTo(xx, y + h * 0.66);
      ctx.lineTo(xx + (i % 2 ? -14 : 14), y + h * 0.66);
      ctx.stroke();
    }
    ctx.restore();

    // ---- emblem (star)（もっと光らせる）
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const cx = x + w * 0.5;
    const cy = y + h * 0.26;
    const R = Math.min(w, h) * 0.18;

    // emblem glow
    ctx.globalAlpha = a * (0.70 + p * 0.60) * CFG.glow;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.6);
    g.addColorStop(0, `rgba(255,240,210,0.65)`);
    g.addColorStop(0.55, `rgba(255,190,235,0.22)`);
    g.addColorStop(1, `rgba(255,220,170,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // ring
    ctx.shadowColor = "rgba(255,255,255,0.95)";
    ctx.shadowBlur = 10 + p * 10;
    ctx.globalAlpha = a * (0.60 + p * 0.40);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // pentagram
    ctx.shadowBlur = 0;
    ctx.globalAlpha = a * (0.70 + p * 0.35);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 1.5;
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      pts.push([cx + Math.cos(ang) * R * 0.64, cy + Math.sin(ang) * R * 0.64]);
    }
    const order = [0, 2, 4, 1, 3, 0];
    ctx.beginPath();
    ctx.moveTo(pts[order[0]][0], pts[order[0]][1]);
    for (let k = 1; k < order.length; k++) ctx.lineTo(pts[order[k]][0], pts[order[k]][1]);
    ctx.stroke();

    ctx.restore();

    // ---- sparkles（もっと派手に、でも邪魔しない：四隅＋周辺）
    if (CFG.spark > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = a * (0.22 + p * 0.40) * CFG.spark;

      // corner pixels
      ctx.fillStyle = "rgba(255,200,240,1)";
      ctx.fillRect(x + 6, y + 6, 2.0, 2.0);
      ctx.fillRect(x + w - 8, y + 10, 1.8, 1.8);
      ctx.fillRect(x + 10, y + h - 10, 1.8, 1.8);

      // tiny cross sparkles
      const sx = x + w * 0.80;
      const sy = y + h * 0.22;
      ctx.strokeStyle = "rgba(255,235,200,0.95)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy);
      ctx.lineTo(sx + 3, sy);
      ctx.moveTo(sx, sy - 3);
      ctx.lineTo(sx, sy + 3);
      ctx.stroke();

      ctx.restore();
    }
  }

  function drawRingAura(ctx, cx, cy, p, a) {
    const t = performance.now() / 1000;
    const pulse = (0.72 + 0.28 * Math.sin(t * 5.8 + p)) * CFG.pulse;

    // outer aura ring
    const r = 18 + p * 12;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.70 + p * 0.45) * CFG.glow * pulse;

    // halo (thicker + brighter)
    ctx.lineWidth = 2.8;
    ctx.shadowColor = "rgba(255,160,220,0.95)";
    ctx.shadowBlur = 14 + p * 12;

    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, `rgba(255,120,200,0)`);
    grad.addColorStop(0.25, `rgba(255,160,235,0.85)`);
    grad.addColorStop(0.55, `rgba(255,235,190,0.95)`);
    grad.addColorStop(0.85, `rgba(255,180,230,0.70)`);
    grad.addColorStop(1, `rgba(255,120,200,0)`);
    ctx.strokeStyle = grad;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // orbit dash (more visible)
    ctx.shadowBlur = 0;
    ctx.globalAlpha *= 0.78;
    ctx.setLineDash([7, 10]);
    ctx.lineDashOffset = -(t * 48);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "rgba(210,180,255,0.60)";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // ===== public API for Renderer =====
  NS.noteSkin = {
    name: "tarot-pinkgold",
    cfg: CFG,

    drawNote(ctx, x, y, alpha, p, meta) {
      const a = clamp(alpha, 0, 1);

      // pが小さいときも少し盛る（見えづらさ対策）
      const pp = clamp(p * 1.05 + 0.02, 0, 1);

      const w = CFG.w * (0.94 + pp * 0.18);
      const h = CFG.h * (0.94 + pp * 0.18);

      const xx = x - w / 2;
      const yy = y - h / 2;

      // aura ring first (behind)
      drawRingAura(ctx, x, y, pp, a);

      // strong glow blob behind（より明るい“核”）
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = a * (0.28 + pp * 0.40) * CFG.glow;

      const g = ctx.createRadialGradient(x, y, 0, x, y, 62);
      g.addColorStop(0, "rgba(255,200,240,0.55)");
      g.addColorStop(0.32, "rgba(255,235,190,0.28)");
      g.addColorStop(1, "rgba(255,170,230,0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // tarot card
      drawTarotFace(ctx, xx, yy, w, h, pp, a);

      // trailing streak（明るく：動いてる感）
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = a * (0.18 + pp * 0.26);
      ctx.strokeStyle = "rgba(170,90,255,0.62)";
      ctx.shadowColor = "rgba(255,180,240,0.75)";
      ctx.shadowBlur = 10 + pp * 10;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y - 74);
      ctx.stroke();
      ctx.restore();
    }
  };
})();
