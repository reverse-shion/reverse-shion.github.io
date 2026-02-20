/* /di/js/notes/skin-tarot-pinkgold.js
   DiCo NOTE SKIN (tarot pink-gold)
   - Renderer から呼ばれる「描画関数」だけ持つ
   - いつでも差し替え可能
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  // 既定の設定（必要ならここだけ微調整）
  const CFG = {
    // note size (px)
    w: 34,
    h: 48,
    radius: 8,

    // glow intensity
    glow: 0.85,

    // sparkle density
    spark: 0.7,
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // タロット背面の簡易モチーフ（星＋回路っぽい線）
  function drawTarotFace(ctx, x, y, w, h, p, a) {
    const r = CFG.radius;
    const t = performance.now() / 1000;

    // 角丸カードパス
    ctx.beginPath();
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();

    // glass body
    const body = ctx.createLinearGradient(x, y, x, y + h);
    body.addColorStop(0, `rgba(255,200,220,${0.16 * a})`);
    body.addColorStop(0.55, `rgba(255,120,200,${0.10 * a})`);
    body.addColorStop(1, `rgba(255,220,170,${0.10 * a})`);
    ctx.fillStyle = body;
    ctx.fill();

    // neon border (pink-gold)
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = 2.2;
    const br = ctx.createLinearGradient(x, y, x + w, y + h);
    br.addColorStop(0, `rgba(255,170,210,${0.95 * a})`);
    br.addColorStop(0.55, `rgba(255,220,160,${0.90 * a})`);
    br.addColorStop(1, `rgba(255,120,200,${0.88 * a})`);
    ctx.strokeStyle = br;
    ctx.stroke();
    ctx.restore();

    // inner outline
    ctx.strokeStyle = `rgba(255,255,255,${0.18 * a})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // circuit lines
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.35 * a;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const xx = x + w * (0.22 + i * 0.18) + Math.sin(t * 0.9 + i) * 0.6;
      ctx.strokeStyle = i % 2 ? "rgba(255,205,120,0.55)" : "rgba(255,140,210,0.50)";
      ctx.beginPath();
      ctx.moveTo(xx, y + h * 0.22);
      ctx.lineTo(xx, y + h * 0.84);
      // little branches
      ctx.moveTo(xx, y + h * 0.44);
      ctx.lineTo(xx + (i % 2 ? 10 : -10), y + h * 0.44);
      ctx.moveTo(xx, y + h * 0.66);
      ctx.lineTo(xx + (i % 2 ? -12 : 12), y + h * 0.66);
      ctx.stroke();
    }
    ctx.restore();

    // emblem (star)
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const cx = x + w * 0.5;
    const cy = y + h * 0.26;
    const R = Math.min(w, h) * 0.16;

    // emblem glow
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2);
    g.addColorStop(0, `rgba(255,220,170,${0.35 * a})`);
    g.addColorStop(1, `rgba(255,220,170,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // ring
    ctx.strokeStyle = `rgba(255,235,220,${0.75 * a})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // pentagram
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * a})`;
    ctx.lineWidth = 1.4;
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      pts.push([cx + Math.cos(ang) * R * 0.62, cy + Math.sin(ang) * R * 0.62]);
    }
    const order = [0, 2, 4, 1, 3, 0];
    ctx.beginPath();
    ctx.moveTo(pts[order[0]][0], pts[order[0]][1]);
    for (let k = 1; k < order.length; k++) ctx.lineTo(pts[order[k]][0], pts[order[k]][1]);
    ctx.stroke();

    ctx.restore();

    // tiny sparkle corners (cute)
    if (CFG.spark > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = (0.22 + p * 0.25) * a * CFG.spark;
      ctx.fillStyle = "rgba(255,180,230,1)";
      ctx.fillRect(x + 6, y + 6, 1.6, 1.6);
      ctx.fillRect(x + w - 8, y + 10, 1.4, 1.4);
      ctx.fillRect(x + 10, y + h - 10, 1.4, 1.4);
      ctx.restore();
    }
  }

  function drawRingAura(ctx, cx, cy, p, a) {
    // outer aura ring (DiCo vibe)
    const r = 18 + p * 10;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = a * (0.50 + p * 0.30) * CFG.glow;

    // halo
    ctx.lineWidth = 2.2;
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, `rgba(255,120,200,${0.00})`);
    grad.addColorStop(0.25, `rgba(255,140,220,${0.55})`);
    grad.addColorStop(0.55, `rgba(255,220,170,${0.65})`);
    grad.addColorStop(0.85, `rgba(255,160,210,${0.40})`);
    grad.addColorStop(1, `rgba(255,120,200,${0.00})`);
    ctx.strokeStyle = grad;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // tiny orbit dash
    ctx.globalAlpha *= 0.7;
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -(performance.now() / 1000) * 40;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // ===== public API for Renderer =====
  // 1) サイズや判定位置に関わるパラメータ（Rendererから参照してもいい）
  NS.noteSkin = {
    name: "tarot-pinkgold",
    cfg: CFG,

    // 2) note draw
    drawNote(ctx, x, y, alpha, p, meta) {
      // meta 例: { type, lane, isHitWindow } など将来拡張できる
      const a = clamp(alpha, 0, 1);
      const w = CFG.w * (0.92 + p * 0.14);
      const h = CFG.h * (0.92 + p * 0.14);

      // center to top-left
      const xx = x - w / 2;
      const yy = y - h / 2;

      // aura ring first (behind card)
      drawRingAura(ctx, x, y, p, a);

      // soft glow blob behind
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = a * (0.20 + p * 0.22) * CFG.glow;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 48);
      g.addColorStop(0, "rgba(255,170,220,0.35)");
      g.addColorStop(0.45, "rgba(255,220,170,0.18)");
      g.addColorStop(1, "rgba(255,170,220,0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // tarot card
      drawTarotFace(ctx, xx, yy, w, h, p, a);

      // trailing cute streak (subtle)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = a * (0.14 + p * 0.18);
      ctx.strokeStyle = "rgba(156,60,255,0.38)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y - 64);
      ctx.stroke();
      ctx.restore();
    }
  };
})();
